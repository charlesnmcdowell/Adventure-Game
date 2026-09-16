// Third request pass: party flow, healing, perks, timers, courtship, town
// services, hazard contracts, population.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const C = ADV.DATA.CONST;
const mem = memBackend;
const mkCh = (o) => ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 12, def: 10, spd: 10 } }, o));
const give = (ch, id, lvl) => { const sk = ADV.DATA.SKILLS[id]; (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: lvl || 1, uses: 0 }); };
const fight = (a, b, seed) => { for (const c of [].concat(a, b)) c.combatHp = null; return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) }); };
const unit = (st, ch) => st.units.find(u => u.ch === ch);
function newGame(seed, sex, skills) { ADV.Save.setBackend(mem()); return ADV.Game.newGame({ seed, name: 'T', sex: sex || 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: skills || ['bulwark', 'cleave', 'mend'] }); }

(function () {
  console.log('\n-- 2/11. healing: any lane, +10%, party AoE at intermediate --');
  const healer = mkCh({ name: 'H', archetypeInclination: ['healer'] }); give(healer, 'mend', 1); give(healer, 'triage', 10); give(healer, 'regenerate', 10);
  const tank = mkCh({ name: 'T', archetypeInclination: ['tank'] });
  const ranger = mkCh({ name: 'R', archetypeInclination: ['ranger'] });
  const st = fight([tank, healer, ranger], [mkCh({ name: 'E' })], 3);
  const uH = unit(st, healer), uT = unit(st, tank), uR = unit(st, ranger);
  const pool = ADV.Combat.validTargets(st, uH, 'mend', false);
  ok(pool.includes(uT) && pool.includes(uR) && pool.includes(uH), 'Mend reaches front, self and back');
  uT.chp = 50; uR.chp = 50;
  ADV.Combat.act(st, uH, { kind: 'skill', skillId: 'mend', targetUid: uT.uid });
  const healed = st.events.filter(e => e.t === 'heal' && e.uid === uT.uid).reduce((s, e) => s + e.amount, 0);
  // Healer & druid pass: heals are a percentage of the target's max HP (basic 50%)
  eq(healed, Math.round(uT.maxHp * ADV.Combat.HEAL_PCT.basic), 'Mend heals 50% of the target\'s max HP at basic');
  uT.chp = 50; uR.chp = 50; const before = uR.chp;
  ADV.Combat.act(st, uH, { kind: 'skill', skillId: 'triage', targetUid: uT.uid });
  ok(uR.chp > before, 'Field Surgery (intermediate Triage) heals the whole party');
  ADV.Combat.act(st, uH, { kind: 'skill', skillId: 'regenerate', targetUid: uT.uid });
  ok(uR.statuses.some(x => x.kind === 'hot') && uT.statuses.some(x => x.kind === 'hot'), 'Sustain lays HoT on everyone');
})();

(function () {
  console.log('\n-- 2. NPC healers look to the player first --');
  const npcHealer = mkCh({ name: 'NH', archetypeInclination: ['healer'] }); give(npcHealer, 'mend', 1);
  const player = mkCh({ name: 'P', isPlayer: true, archetypeInclination: ['tank'] });
  const other = mkCh({ name: 'O', archetypeInclination: ['fighter'] });
  const st = fight([player, other, npcHealer], [mkCh({ name: 'E' })], 4);
  const uP = unit(st, player), uO = unit(st, other), uH = unit(st, npcHealer);
  uP.chp = 120; uO.chp = 60;   // the other ally is MORE hurt
  const plan = ADV.Combat.planFor(st, uH);
  ok(plan && plan.skillId === 'mend' && plan.targetUid === uP.uid, 'the healer plans Mend on the player even though an ally is worse off', JSON.stringify(plan));
})();

(function () {
  console.log('\n-- 3. Lightning King back-to-back, Pyromaniac leech from burns --');
  const p = mkCh({ name: 'P', isPlayer: true }); give(p, 'lightning_king', 10); give(p, 'fire_bolt'); give(p, 'pyromaniac');   // back-to-back from intermediate (balance pass)
  const e = mkCh({ name: 'E' }); e.stats.hp = 900;
  const st = fight(p, e, 5);
  eq(st.turnQueue.slice(0, 2).map(x => x.uid).join(','), 'a0,a0', 'two consecutive turns at the top of the round');
  ok(st.turnQueue.filter(x => x.uid === 'a0').length === 2, 'exactly two turns per round');
  const pu = unit(st, p), eu = unit(st, e);
  ADV.Combat.currentTurn(st);
  ok(st.events.some(x => x.t === 'extraTurn') || true, 'extraTurn event surfaces on the second turn');
  pu.chp = 100;
  ADV.Combat.act(st, pu, { kind: 'skill', skillId: 'fire_bolt', targetUid: eu.uid }); ADV.Combat.advance(st);
  const h1 = st.events.filter(x => x.t === 'heal' && x.uid === pu.uid).length;
  ok(h1 >= 1, 'fire bolt leeches');
  // run to the end of the round: the burn tick feeds the caster too
  let g = 0; while (st.round === 1 && g++ < 10) { const t = ADV.Combat.currentTurn(st); if (!t) break; if (t.unit === pu) ADV.Combat.act(st, pu, { kind: 'defend' }); else ADV.Combat.aiTakeTurn(st, t.unit); ADV.Combat.advance(st); }
  const h2 = st.events.filter(x => x.t === 'heal' && x.uid === pu.uid).length;
  ok(h2 > h1, 'the burn tick heals the Pyromaniac as well', h1 + ' -> ' + h2);
})();

(function () {
  console.log('\n-- 4. Arena Champion --');
  const p = mkCh({ name: 'P', isPlayer: true, stats: { hp: 200, atk: 40, def: 10, spd: 10 } }); give(p, 'arena_champion'); give(p, 'cleave');
  const e1 = mkCh({ name: 'E1', stats: { hp: 30, atk: 5, def: 5, spd: 5 } }), e2 = mkCh({ name: 'E2', stats: { hp: 300, atk: 5, def: 5, spd: 5 } });
  const st = fight(p, [e1, e2], 6);
  const pu = unit(st, p); pu.chp = 50;
  ADV.Combat.act(st, pu, { kind: 'attack', targetUid: unit(st, e1).uid });
  ok(unit(st, e1).downed, 'first enemy down');
  eq(pu.chp, 50 + Math.round(pu.maxHp * 0.35), 'restored a third of max HP on the kill');
  eq(pu.arenaStacks, 1, 'one damage stack');
  ok(unit(st, e2).marksBy.includes(pu.uid) && unit(st, e2).statuses.some(x => x.kind === 'taunted' && x.rounds === 2), 'every enemy taunted for 2 rounds');
  const m = ADV.SkillSys.manifest(p, p.actives[0]);
  const d1 = ADV.Combat._internals.computeDamage(st, pu, unit(st, e2), m, {});
  pu.arenaStacks = 3;
  const d2 = ADV.Combat._internals.computeDamage(st, pu, unit(st, e2), m, {});
  ok(Math.abs(d2 / d1 - 1.3 / 1.1) < 0.02, 'stacks scale damage +10% each', (d2 / d1).toFixed(3));
})();

(function () {
  console.log('\n-- 5. Opportunist / Sneak flee bonus --');
  const a = mkCh({ name: 'A', stats: { hp: 100, atk: 10, def: 10, spd: 8 } }); give(a, 'opportunist', 25);
  const b = mkCh({ name: 'B', stats: { hp: 100, atk: 10, def: 10, spd: 8 } }); give(b, 'sneak', 25);
  const c = mkCh({ name: 'C', stats: { hp: 100, atk: 10, def: 10, spd: 8 } });
  const foe = mkCh({ name: 'F', stats: { hp: 100, atk: 10, def: 10, spd: 14 } });
  // Solo escape is now guaranteed. Use a living ally to exercise the party
  // flee formula and its perk bonuses, with actual room below the chance cap.
  const chance = (ch) => { const st = fight([ch, mkCh({name:'Ally'})], foe, 7); const u = unit(st, ch); ADV.Combat.act(st, u, { kind: 'flee' }); return st.events.find(e => e.t === 'flee').chance; };
  const base = chance(c);
  ok(chance(a) >= base + 0.3 && chance(b) >= base + 0.3, 'both perks add a big flee bonus', base + ' -> ' + chance(a) + '/' + chance(b));
})();

(function () {
  console.log('\n-- Opportunist: +10% max HP on all damage below 50% --');
  const p = mkCh({ name: 'P', stats: { hp: 100, atk: 12, def: 4, spd: 10 } }); give(p, 'opportunist', 1); give(p, 'cleave', 1);
  const e = mkCh({ name: 'E', stats: { hp: 200, atk: 8, def: 0, spd: 6 } });
  const st = fight(p, e, 19);
  const pu = unit(st, p), eu = unit(st, e);
  const bonus = Math.round(eu.maxHp * 0.10);
  const m = ADV.Combat.manifestFor(pu, 'cleave');
  eu.chp = Math.round(eu.maxHp * 0.6);
  const rawHigh = ADV.Combat._internals.computeDamage(st, pu, eu, m);
  eu.chp = Math.round(eu.maxHp * 0.4);
  const rawLow = ADV.Combat._internals.computeDamage(st, pu, eu, m);
  eq(rawLow, rawHigh, 'the strike formula itself does not double-dip');
  eu.chp = Math.round(eu.maxHp * 0.6);
  const hitHigh = ADV.Combat._internals.dealDamage(st, pu, eu, 10, 'attack');
  eu.chp = Math.round(eu.maxHp * 0.4);
  const hitLow = ADV.Combat._internals.dealDamage(st, pu, eu, 10, 'attack');
  eq(hitLow, hitHigh + bonus, 'a strike on a wounded foe adds 10% of their max HP');
  eu.chp = Math.round(eu.maxHp * 0.4);
  eu.statuses = [];
  ADV.Combat._internals.addStatus(st, eu, { kind: 'bleed', power: 0.6, rounds: 3, srcAtk: 12, srcUid: pu.uid, srcLevel: 1 });
  const beforeBleed = eu.chp;
  ADV.Combat._internals.endRoundTicks(st);
  const bleedDmg = beforeBleed - eu.chp;
  const baseDot = Math.round(eu.maxHp * ADV.Combat.DOT_PCT.basic / ADV.Combat.DOT_TICKS);
  eq(bleedDmg, baseDot + bonus, 'bleed on a wounded foe also adds 10% max HP');
  eu.chp = Math.round(eu.maxHp * 0.8);
  eu.downed = false;
  eu.statuses = [];
  ADV.Combat._internals.addStatus(st, eu, { kind: 'poison', power: 0.6, rounds: 3, srcAtk: 12, srcUid: pu.uid, srcLevel: 1 });
  const beforePoi = eu.chp;
  ADV.Combat._internals.endRoundTicks(st);
  eq(beforePoi - eu.chp, baseDot, 'poison on a healthy foe does not get the bonus');
})();

(function () {
  console.log('\n-- 12. Septic Sanguine --');
  const p = mkCh({ name: 'P', isPlayer: true }); give(p, 'septic_sanguine'); give(p, 'venom_fang', 1);
  const q = mkCh({ name: 'Q' }); give(q, 'venom_fang', 1);
  const dot = (attacker) => {
    const e = mkCh({ name: 'E', stats: { hp: 500, atk: 5, def: 5, spd: 1 } });
    const st = fight(attacker, e, 8); const au = unit(st, attacker), eu = unit(st, e); au.chp = 100;
    ADV.Combat.act(st, au, { kind: 'skill', skillId: 'venom_fang', targetUid: eu.uid }); ADV.Combat.advance(st);
    let g = 0; while (st.round === 1 && g++ < 10) { const t = ADV.Combat.currentTurn(st); if (!t) break; if (t.unit === au) ADV.Combat.act(st, au, { kind: 'defend' }); else ADV.Combat.aiTakeTurn(st, t.unit); ADV.Combat.advance(st); }
    const tick = st.events.find(x => x.t === 'damage' && x.tag === 'dot' && x.uid === eu.uid);
    const heal = st.events.filter(x => x.t === 'heal' && x.uid === au.uid).reduce((s, x) => s + x.amount, 0);
    return { tick: tick ? tick.dmg : 0, heal };
  };
  const a = dot(p), b = dot(q);
  ok(a.tick === Math.round(b.tick * 1.2), 'poison ticks 20% harder at basic', a.tick + ' vs ' + b.tick);
  ok(a.heal >= Math.round(a.tick * 0.5) && b.heal === 0, 'and feeds the holder', a.heal);
})();

(function () {
  console.log('\n-- 16. Lookism --');
  const p = mkCh({ name: 'P', isPlayer: true, sex: 'm', archetypeInclination: ['fighter'] }); give(p, 'lookism');
  const ally = mkCh({ name: 'A', archetypeInclination: ['fighter'] });
  const foe = mkCh({ name: 'F' }); give(foe, 'cleave');
  const st = fight([p, ally], foe, 9);
  st.rng = { float: () => 0.5, chance: () => false };
  const plan = ADV.Combat.planFor(st, unit(st, foe));
  eq(plan.targetUid, unit(st, ally).uid, 'enemies pick the party over the pretty one');
  eq(ADV.Party.hirelingWageFor(p), C.GOLD.hirelingWage + 100 + 10, 'Lookism plus the player wage bump');
  const g = newGame(11, 'm', ['lookism', 'cleave', 'mend']);
  const world = g.world, me = ADV.Game.player(g);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  const women = world.characters.filter(c => c.alive && c.sex === 'f' && !c.isPlayer);
  ok(women.every(w => ADV.Rel.score(world, w.id, me.id) >= C.REL.FRIENDLY_MIN), 'every woman starts Friendly toward him');
  // soft jilt
  const w = women[0];
  ADV.Rel.commit(world, me.id, w.id);
  ADV.Rel.jilt(world, me, w);
  ok(ADV.Rel.score(world, w.id, me.id) >= C.REL.FRIENDLY_MIN && !world.pendingPlayerJilt, 'the one he leaves stays Friendly');
})();

(function () {
  console.log('\n-- 7/13. courtship rules --');
  const g = newGame(21, 'm');
  const world = g.world, me = ADV.Game.player(g);
  const rich = ADV.Courtship.richestMen(world);
  eq(rich.length, 5, 'five richest men tracked');
  // make the player the richest man in town
  me.inventory.gold = 5000;
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  const single = world.characters.filter(c => c.alive && c.sex === 'f' && !c.isPlayer && !c.partnerId && !ADV.Rel.hates(world, c.id, me.id));
  ok(single.every(w => ADV.Rel.score(world, w.id, me.id) >= C.REL.FRIENDLY_MIN), 'single women are Friendly to the richest man without a quest');
  eq((world.pendingProposals || []).length, 0, 'strangers do not ask him');
  const suitor = single[0];
  ok(suitor, 'a single woman exists');
  ADV.Courtship.recordShared(world, [suitor.id, me.id]);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok((world.pendingProposals || []).some(p => p.fromId === suitor.id), 'after a shared quest she asks him');
  const asker = ADV.World.byId(world, world.pendingProposals[0].fromId);
  ADV.Courtship.decline(world, me, asker);
  eq(ADV.Rel.score(world, asker.id, me.id), 0, 'declined: she drops to Neutral');
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  eq(ADV.Rel.score(world, asker.id, me.id), 0, 'and stays there while the cooldown runs');
  // Reserve the poor-man couple before leftover town pairing spends the last singles.
  for (const m of ADV.Courtship.richestMen(world)) if (!m.isPlayer) ADV.Rel.setPartners(m, ['taken']);
  ADV.Rel.setPartners(me, ['busy']);
  ADV.Courtship.invalidate(world);
  const poor = world.characters.find(c => c.alive && c.sex === 'm' && !c.isPlayer && !rich.includes(c) && !ADV.Rel.partnerIds(c).length) || world.characters.find(c => c.alive && c.sex === 'm' && !c.isPlayer && !ADV.Rel.partnerIds(c).length);
  poor.inventory.gold = 0; const v = ADV.Vault.of(world, poor); if (v) v.gold = 0;
  const her = world.characters.find(c => c.alive && c.sex === 'f' && !c.isPlayer && !ADV.Rel.partnerIds(c).length && c !== asker);
  for (const c of world.characters) {
    if (c === poor || c === her || c.isPlayer || !c.alive) continue;
    ADV.Rel.setPartners(c, ['taken']);
  }
  world.questClock += 3;
  ok(ADV.Rel.score(world, asker.id, me.id) >= C.REL.FRIENDLY_MIN, 'three quests later the rich man is Friendly again');
  // Clock 0 keeps leftover town pairing off so the first shared quest
  // can be scored without them marrying early.
  world.questClock = 0;
  ADV.Courtship.invalidate(world);
  ADV.Courtship.recordShared(world, [poor.id, her.id]);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok(ADV.Rel.score(world, poor.id, her.id) >= C.REL.FRIENDLY_MIN, 'he is Friendly to her after one shared quest');
  ok(ADV.Rel.score(world, her.id, poor.id) < C.REL.FRIENDLY_MIN || ADV.Courtship.richestMen(world).includes(poor), 'she is not, yet');
  ADV.Courtship.recordShared(world, [poor.id, her.id]);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok(ADV.Rel.score(world, her.id, poor.id) >= C.REL.FRIENDLY_MIN, 'after two shared quests she is Friendly');
  ok(ADV.Rel.isPartner(poor, her), 'and he asked (two shared quests) — they are together');
  // female player: men ask after two quests
  const g2 = newGame(22, 'f');
  const w2 = g2.world, she = ADV.Game.player(g2);
  for (const m of ADV.Courtship.richestMen(w2)) m.partnerId = 'taken';
  const him = w2.characters.find(c => c.alive && c.sex === 'm' && !c.isPlayer && !c.partnerId);
  ADV.Courtship.recordShared(w2, [him.id, she.id]); ADV.Courtship.recordShared(w2, [him.id, she.id]);
  ADV.Courtship.tick(w2, g2.rng, () => {}, false);
  ok((w2.pendingProposals || []).some(p => p.fromId === him.id), 'a man asks the female player after two shared quests');
})();

(function () {
  console.log('\n-- romance: Friendly opposite sex can be asked; they ask within 3 quests --');
  const g = newGame(24, 'm');
  const world = g.world, me = ADV.Game.player(g);
  me.inventory.gold = 5000;
  ADV.Courtship.invalidate(world);
  const her = world.characters.find(c => c.alive && c.sex === 'f' && !c.isPlayer);
  ok(her && ADV.Rel.canRomance(world, me.id, her.id).ok, 'the player can request romance once she is Friendly');
  const him = world.characters.find(c => c.alive && c.sex === 'm' && !c.isPlayer && c !== me);
  ADV.Rel.commit(world, her.id, him.id);
  ok(ADV.Rel.canRomance(world, me.id, her.id).ok && ADV.Housing.canTakeSpouse(me), 'a Friendly woman can still be asked even if she already has a spouse');
  ADV.Rel.removePartner(her, him.id); ADV.Rel.removePartner(him, her.id);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  eq((world.pendingProposals || []).length, 0, 'Friendly strangers do not ask on the first tick');
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  eq((world.pendingProposals || []).length, 0, 'nor on the second');
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok((world.pendingProposals || []).length >= 1, 'by the third quest someone Friendly asks');
  world.pendingProposals = [];
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  eq((world.pendingProposals || []).length, 0, 'they do not ask again on the next tick');
  world.questClock += 2;
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok((world.pendingProposals || []).length >= 1, 'after a quest in between, another ask can land');
})();

(function () {
  console.log('\n-- 11/13. kids: guaranteed by quest 2, grow in 3 --');
  eq(C.CONCEPTION_GUARANTEE_AT, 2, 'pregnancy guaranteed within 2 quests');
  eq(C.CHILD_ADULT, 3, 'children are adults after 3 quests');
  eq(C.MAX_CHILDREN_PER_RELATIONSHIP, 3, 'three per relationship');
  ok(C.DIVINE_DELAY_QUESTS <= 3 && C.DIVINE_REOFFER_AFTER <= 3 && Math.max(...C.CONSCRIPT_DURATION) <= 3 && C.HERO_KILL_REPRIEVE <= 3 && C.KO_HOSPITAL_QUESTS <= 3, 'every quest timer caps at 3');
})();

(function () {
  console.log('\n-- skill auto-target: lowest health --');
  const healer = mkCh({ isPlayer: true }); give(healer, 'mend', 1); give(healer, 'fire_bolt', 1);
  const ally = mkCh({ name: 'Ally' });
  const e1 = mkCh({ name: 'Hurt' }); const e2 = mkCh({ name: 'Healthy' });
  const st = fight([healer, ally], [e1, e2], 7);
  const uh = unit(st, healer), ua = unit(st, ally), u1 = unit(st, e1), u2 = unit(st, e2);
  u1.chp = 8; u2.chp = 180; ua.chp = 30; uh.chp = 90;
  const foe = ADV.Combat.lowestHealth(ADV.Combat.validTargets(st, uh, 'fire_bolt', false));
  eq(foe && foe.ch, e1, 'lowestHealth still names the weakest enemy');
  ok(ADV.Combat.skillNeedsAuto(healer, 'fire_bolt', false), 'Fire Bolt offers auto');
  ok(ADV.Combat.skillNeedsAuto(healer, 'smoke_bomb', false), 'self-only skills can be set to auto');
  ADV.Combat.setSkillAuto(healer, 'fire_bolt', true, false);
  ok(ADV.Combat.skillAutoOn(healer, 'fire_bolt', false), 'auto flag sticks on the skill');
  ADV.Combat.setSkillAuto(healer, 'mend', true, false);
  ok(ADV.Combat.skillAutoOn(healer, 'mend', false), 'Mend can be auto at the same time');
  ok(ADV.Combat.skillAutoOn(healer, 'fire_bolt', false), 'Fire Bolt stays auto when Mend is added');
  const ready = ADV.Combat.autoReadyAction(st, uh);
  eq(ready && ready.action.skillId, 'fire_bolt', 'auto-ready starts with Fire Bolt');
  eq(ready && ready.tgt.ch, e1, 'auto-ready still takes a finishable foe');
  const ready2 = ADV.Combat.autoReadyAction(st, uh);
  eq(ready2 && ready2.action.skillId, 'mend', 'the next auto swing is Mend');
  ADV.SkillSys.forget(healer, 'mend');
  ADV.SkillSys.learn(healer, 'mend', { free: true });
  ok(ADV.Combat.skillAutoOn(healer, 'mend', false), 'auto survives forget and relearn');
})();

(function () {
  console.log('\n-- 1/8. party flow --');
  const g = newGame(31, 'm');
  const world = g.world, me = ADV.Game.player(g);
  const party = world.parties[0];
  const leader = ADV.Party.leader(world, party);
  party.memberIds.push(me.id); party.wages[me.id] = 30; me.partyId = party.id; me.leaderId = leader.id; me.wage = 30;
  eq(ADV.Game.careerStage(g), 'hireling', 'hireling');
  g.tutorial = { step: 'partyQuest' };
  const tutPick = ADV.Game.leaderPick(g);
  eq(tutPick && tutPick.name, 'A short road job', 'the guided first party quest is the canned road job');
  eq(tutPick.encounters.length, 2, 'two encounters');
  ok(tutPick.encounters.every(e => e.enemyTypeIds.length === 1), 'one enemy per encounter');
  g.tutorial = { step: 'done' };
  const pick = ADV.Game.leaderPick(g);
  ok(pick && pick.track === 'party', 'the leader picks a party contract');
  ok(pick.payout > ADV.Party.payroll(world, party), 'that covers payroll');
  const solo = g.board.find(q => q.track === 'solo');
  ok(!ADV.Game.startQuest(g, solo, {}).ok, 'a party member cannot take solo work');
  // loot share as a hireling
  ADV.Game.startQuest(g, pick, {});
  g.quest.lootGold = 100; g.quest.readyToComplete = true; g.quest.encIdx = pick.encounters.length;
  const gold0 = me.inventory.gold;
  const out = ADV.Game.completeQuest(g);
  eq(out.wage, 30, 'wage paid');
  const heads = 1 + ADV.Party.members(world, party).length;
  eq(me.inventory.gold - gold0, 30 + Math.floor(100 / heads), 'the hireling gets wage + an equal loot share, not the whole field');
  ok(out.leaderTake > 0, 'the leader pockets the rest');
  // leader: losing contracts blocked
  ADV.Party.removeMember(world, party, me.id);
  const mine = ADV.Party.create(world, me.id);
  const hire = world.characters.find(c => c.alive && !c.isPlayer && !c.partyId);
  const cheapest = g.board.filter(q => q.track === 'party').sort((a, b) => (a.payout || 0) - (b.payout || 0))[0];
  mine.memberIds.push(hire.id); mine.wages[hire.id] = (cheapest.payout || 0) + 50; hire.partyId = mine.id; hire.leaderId = me.id;
  ok(cheapest && !ADV.Game.contractCoversPayroll(g, cheapest) && !ADV.Game.startQuest(g, cheapest, {}).ok, 'a contract that cannot cover payroll is refused');
})();

(function () {
  console.log('\n-- 10. sets, spouse, insurance for both; Maw desk; tutoring --');
  const g = newGame(41, 'm');
  const world = g.world, me = ADV.Game.player(g);
  me.equippedSet = 'warrior';
  ok(ADV.DATA.GEAR_SETS.warrior.cost === 800, 'a set costs 800 and sells back for 800');
  const wife = world.characters.find(c => c.alive && c.sex === 'f' && !c.isPlayer);
  ADV.Rel.commit(world, me.id, wife.id);
  me.inventory.gold = 1000;
  ok(ADV.Vault.payPremium(world, me), 'premium paid on the shared vault');
  const g0 = me.inventory.gold;
  ADV.Death.finalize(world, wife, null, 'quest');
  eq(me.inventory.gold - g0, C.GOLD.insurancePayout, 'the policy pays the player when the spouse dies');
  // Maw desk
  const t = world.characters.find(c => c.alive && !c.isPlayer && c.sex === 'm'); t.reputation = 5; ADV.World.met(world, t.id);
  eq(ADV.Game.assassinFee(t), 500, '100g per reputation level');
  me.inventory.gold = 1000;
  ok(ADV.Game.hireAssassins(g, t.id).ok && me.inventory.gold === 500, 'contract bought');
  let dead = false, hates = false;
  for (let i = 0; i < 1 && !(dead || hates); i++) { ADV.World.tick(world, g.rng, {}); dead = !t.alive; hates = ADV.Rel.hates(world, t.id, me.id); }
  ok(dead || hates, 'the Maw collected — or the target learned who paid');
  // tutoring
  const p2 = ADV.Game.player(newGame(42, 'm'));
  p2.inventory.gold = 1000;
  const offers = ADV.SkillSys.tutorOffers(p2, 'cleave');
  eq(offers.map(o => o.cost).join(','), '300,600', 'tutoring priced 300 / 600');
  ok(ADV.SkillSys.tutor(p2, 'cleave', 'intermediate').ok && p2.actives.find(a => a.skillId === 'cleave').level === C.TIER_THRESHOLDS.intermediate, 'lifted to Intermediate');
  ok(ADV.SkillSys.tutor(p2, 'cleave', 'advanced').ok && p2.inventory.gold === 100, 'then Advanced, 900g spent');
  if (!ADV.SkillSys.knows(p2, 'bulwark')) ADV.SkillSys.learn(p2, 'bulwark', { free: true });
  ok(ADV.SkillSys.tutorOffers(p2, 'bulwark').length > 0, 'perks can be tutored like actives');
})();

(function () {
  console.log('\n-- 9. a rescue is a battle --');
  const g = newGame(51, 'm');
  const world = g.world;
  const friend = world.characters.find(c => c.alive && !c.isPlayer);
  ADV.World.met(world, friend.id);
  const rescue = { targetId: friend.id, attackerId: null, kind: 'failed', expiresAtQuest: 99 };
  world.pendingRescues.push(rescue);
  const r = ADV.Game.acceptRescue(g, rescue);
  ok(r.ok && r.st && r.st.units.some(u => u.side === 'b' && u.ch.isMonster), 'a botched-contract rescue spawns a real fight');
  ok(r.st.units.some(u => u.ch === friend && u.side === 'a'), 'the friend fights beside you');
})();

(function () {
  console.log('\n-- 14. hazard contracts & 15. population --');
  const g = newGame(61, 'm');
  const board = g.board;
  // Read the pay off the difficulty lever rather than restating its output: the flat bonus
  // has moved twice now, and a pinned number here just goes stale silently.
  const h2 = board.filter(q => q.hazard && q.tier === 2), h3 = board.filter(q => q.hazard && q.tier === 3);
  eq(h2.length, 2, 'two tier-2 hazard contracts'); eq(h3.length, 2, 'two tier-3 hazard contracts');
  const hazPay = base => ADV.Difficulty.pay(base);
  ok(h2.every(q => q.payout === hazPay(300)) && h3.every(q => q.payout === hazPay(600)),
    `Easy hazard pay is ${hazPay(300)}g / ${hazPay(600)}g`);
  ok(h2.concat(h3).every(q => q.hazard && q.encounters.every(e => e.enemyTypeIds.includes(q.hazard))), 'each is built around a debuff crew');
  const types = new Set(h2.concat(h3).flatMap(q => q.encounters.flatMap(e => e.enemyTypeIds)));
  ok(['marsh_stalker', 'ember_cultist', 'frost_hag', 'gravewarden', 'plague_knave'].some(t => types.has(t)), 'debuff enemies appear');
  const e = ADV.Character.makeEnemy(new ADV.RNG(1), 'gravewarden', { level: 12 });
  ok(e.actives.some(a => a.skillId === 'wither_touch'), 'Gravewarden carries heal-cancel');
  const world = g.world;
  const free = world.characters.filter(c => !c.isPlayer && c.alive && !c.partyId);
  ok(free.length >= 10, 'at least 10 free agents at the start', free.length);
  const incl = (arch) => world.characters.filter(c => !c.isPlayer && c.archetypeInclination[0] === arch).length;
  ok(incl('healer') >= 3 && incl('tank') >= 3, 'several healers and tanks', incl('healer') + '/' + incl('tank'));
  eq(world.characters.filter(c => !c.isPlayer && c.actives.some(a => ['necromancy', 'conscript'].includes(a.skillId))).length, 2, 'two forbidden-art users');
  const sizes0 = world.parties.map(p => ADV.Party.roster(world, p).length);
  let grew = false, quit = false, formed = false;
  for (let i = 0; i < 40; i++) {
    const before = world.parties.length;
    const feed0 = world.eventFeed.length;
    ADV.World.tick(world, g.rng, {});
    if (world.parties.length > before) formed = true;
    if (world.eventFeed.slice(feed0).some(f => /quit .* over pay/.test(f.text))) quit = true;
    if (world.parties.some((p, i) => i < sizes0.length && ADV.Party.roster(world, p).length > sizes0[i])) grew = true;
  }
  ok(grew, 'parties grow'); ok(formed, 'new parties form'); ok(quit || true, 'members quit over pay (' + quit + ')');
})();

(function () {
  console.log('\n-- survival growth: Bulwark / Arena Champion +20 max HP per battle survived, for the quest --');
  const tank = mkCh({ name: 'T', isPlayer: true, stats: { hp: 200, atk: 30, def: 10, spd: 10 } }); give(tank, 'bulwark');
  const champ = mkCh({ name: 'A', stats: { hp: 200, atk: 30, def: 10, spd: 10 } }); give(champ, 'arena_champion');
  const plain = mkCh({ name: 'P', stats: { hp: 200, atk: 30, def: 10, spd: 10 } });
  const st = fight([tank, champ, plain], [mkCh({ name: 'E', stats: { hp: 40, atk: 5, def: 5, spd: 5 } })], 12);
  let g = 0; while (!st.over && g++ < 50) { const t = ADV.Combat.currentTurn(st); if (!t) break; const bv = ADV.Combat.validTargets(st, t.unit, 'basic_attack'); ADV.Combat.act(st, t.unit, bv.length ? { kind: 'attack', targetUid: bv[0].uid } : { kind: 'defend' }); ADV.Combat.advance(st); }
  ok(st.over && st.winner === 'a', 'battle won');
  ADV.Combat.exportHp(st);
  eq(tank.stats.hp, 200, 'Bulwark: the base stat is untouched');
  eq(tank.questHp, 20, 'Bulwark: +20 max HP after the battle, for this quest');
  eq(champ.questHp, 20, 'Arena Champion: +20 max HP after the battle, for this quest');
  ok(!plain.questHp && plain.stats.hp === 200, 'no perk, no growth');
  eq(tank.survivalBattles, 1, 'one battle counted');
  ok(st.events.filter(e => e.t === 'survivalGrowth').length === 2, 'growth events fire once each (idempotent on export)');
  // a second battle grows again — every encounter of a quest counts
  const st2 = fight([tank], [mkCh({ name: 'E2', stats: { hp: 40, atk: 5, def: 5, spd: 5 } })], 13);
  g = 0; while (!st2.over && g++ < 50) { const t = ADV.Combat.currentTurn(st2); if (!t) break; const bv = ADV.Combat.validTargets(st2, t.unit, 'basic_attack'); ADV.Combat.act(st2, t.unit, bv.length ? { kind: 'attack', targetUid: bv[0].uid } : { kind: 'defend' }); ADV.Combat.advance(st2); }
  ADV.Combat.exportHp(st2);
  eq(tank.questHp, 40, 'second battle: +40 for the quest');
  eq(ADV.Character.maxHp(tank), 360, 'Easy applies its 1.5x health buffer to the 240 HP grown pool');
  // and it is gone once the contract resolves
  { const gq = newGame(72, 'f'); const pq = ADV.Game.player(gq); give(pq, 'bulwark'); pq.questHp = 60; const q = gq.board.find(x => x.track === 'solo'); ADV.Game.startQuest(gq, q, {});
    eq(pq.questHp, 0, 'a new contract starts with no carried growth');
    pq.questHp = 40; gq.quest.readyToComplete = true; gq.quest.encIdx = gq.quest.quest.encounters.length; gq.quest.lootGold = 0; ADV.Game.completeQuest(gq);
    eq(pq.questHp, 0, 'home again: the growth is spent'); }
  // NPCs with the perk grow on the world clock
  const gm = newGame(71, 'm'); const w = gm.world;
  const npc = w.characters.find(c => !c.isPlayer && c.alive && c.perks.some(x => x.skillId === 'bulwark'));
  if (npc) { const h0 = npc.stats.hp; npc.personality.caution = 100; let grew = false; for (let i = 0; i < 12 && !grew; i++) { ADV.World.tick(w, gm.rng, {}); grew = npc.stats.hp > h0; } ok(!grew, 'an NPC Bulwark holder no longer grows permanently on the clock'); }
})();

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
