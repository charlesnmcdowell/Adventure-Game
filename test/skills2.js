// Tests for the second skill pass: durations, positional casting, elemental
// statuses + perks, smoke duration, bribes, the cleanse family, and seals.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

const mkCh = (o) => ADV.Character.base(Object.assign({ stats: { hp: 100, atk: 10, def: 10, spd: 10 } }, o));
function give(ch, id, level, kind) {
  const sk = ADV.DATA.SKILLS[id];
  (kind || sk.kind) === 'perk' ? ch.perks.push({ skillId: id, level: level || 1, uses: 0 })
    : ch.actives.push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }
function endRound(st) { // run everyone's turn as holds by draining the queue
  const before = st.round;
  let g = 0;
  while (st.round === before && !st.over && g++ < 60) {
    const t = ADV.Combat.currentTurn(st);
    if (!t) break;
    ADV.Combat.advance(st);
  }
}

// ---------------- 1. durations: shield wall & taunt ----------------
(function () {
  console.log('\n-- 1. Shield Wall & Taunt persist --');
  const tank = mkCh({}); give(tank, 'shield_wall'); give(tank, 'taunt');
  const foe = ADV.Character.makeEnemy(new ADV.RNG(2), 'bandit', { level: 3 });
  const st = fight(tank, foe, 11);
  const ut = unit(st, tank), uf = unit(st, foe);
  ADV.Combat.act(st, ut, { kind: 'skill', skillId: 'shield_wall', targetUid: ut.uid });
  ADV.Combat.act(st, ut, { kind: 'skill', skillId: 'taunt', targetUid: uf.uid });
  ok(ut.statuses.find(x => x.kind === 'guard').rounds === 1, 'guard lasts 1 round at basic');
  ok(uf.statuses.find(x => x.kind === 'taunted').rounds === 3, 'taunt mark is timed (3 rounds)');
  endRound(st);
  ok(ut.statuses.some(x => x.kind === 'guard'), 'guard still up through the round it was applied');
  endRound(st);
  ok(!ut.statuses.some(x => x.kind === 'guard'), 'guard expired after its round');
  for (let i = 0; i < 5; i++) endRound(st);
  ok(!uf.marksBy.includes(ut.uid), 'taunt mark expired and unhooked from marksBy');
})();

// ---------------- 2 & 3. positional healing / warding ----------------
(function () {
  console.log('\n-- 2/3. positional casting --');
  const tankF = mkCh({ name: 'Front', archetypeInclination: ['tank'] });
  const healM = mkCh({ name: 'MidHealer', archetypeInclination: ['healer'] });
  give(healM, 'mend'); give(healM, 'guardian_ward');
  const rangB = mkCh({ name: 'BackRanger', archetypeInclination: ['ranger'] });
  give(rangB, 'mend', 1, 'active');
  const foes = [ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', {}), ADV.Character.makeEnemy(new ADV.RNG(4), 'bandit', {})];
  const st = fight([tankF, healM, rangB], foes, 21);
  const uT = unit(st, tankF), uH = unit(st, healM), uR = unit(st, rangB);
  eq(uT.lane, 'front', 'tank lands front');
  eq(uH.lane, 'mid', 'healer lands MID (one behind the front)');
  eq(uR.lane, 'back', 'ranger lands back');
  const healPool = ADV.Combat.validTargets(st, uH, 'mend', false);
  ok(healPool.includes(uT), 'mid healer can heal the front-liner');
  ok(healPool.includes(uH), 'self-heal always allowed');
  ok(healPool.includes(uR), 'healing reaches allies in ANY lane (positional rule retired)');
  const backPool = ADV.Combat.validTargets(st, uR, 'mend', false);
  ok(backPool.includes(uH) && backPool.includes(uT), 'back-liner heals anyone');
  const wardPool = ADV.Combat.validTargets(st, uH, 'guardian_ward', false);
  ok(wardPool.includes(uR) && wardPool.includes(uH), 'ward reaches same lane and behind');
  ok(wardPool.includes(uT), 'ward also reaches a target ahead of the caster');
})();

// ---------------- 4. elemental statuses & perks ----------------
(function () {
  console.log('\n-- 4. fire / ice / lightning --');
  // burn at basic + level scaling
  const mage = mkCh({ stats: { hp: 100, atk: 10, def: 10, spd: 14 } });
  give(mage, 'fire_bolt', 1); give(mage, 'frost_touch', 1); give(mage, 'spark', 1);
  const dummy = ADV.Character.makeEnemy(new ADV.RNG(5), 'bandit', { level: 3 });
  dummy.stats.hp = 400; // survives everything
  const st = fight(mage, dummy, 31);
  const um = unit(st, mage), ud = unit(st, dummy);
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'fire_bolt', targetUid: ud.uid });
  ok(ud.statuses.some(x => x.kind === 'burn'), 'basic Fire Bolt burns');
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'frost_touch', targetUid: ud.uid });
  ok(ud.statuses.some(x => x.kind === 'frozen'), 'Frost Touch freezes');
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'frost_touch', targetUid: ud.uid });
  eq(ud.statuses.filter(x => x.kind === 'frozen').length, 1, 'no double-freeze stacking');
  um.stormMark = 0; // fire-bolt's mage flare would otherwise pad the first Spark
  const hpBefore = ud.chp;
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'spark', targetUid: ud.uid });
  ok(ud.statuses.some(x => x.kind === 'shocked'), 'Spark shocks');
  const dmgSpark = hpBefore - ud.chp;
  const hp2 = ud.chp;
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'spark', targetUid: ud.uid });
  ok(hp2 - ud.chp > dmgSpark, 'shocked target takes MORE damage than before', (hp2 - ud.chp) + ' vs ' + dmgSpark);
  // frozen consumes a turn
  let skipped = false, g = 0;
  while (g++ < 30) {
    const evn = st.events.find(e => e.t === 'skip' && e.reason === 'frozen');
    if (evn) { skipped = true; break; }
    const t = ADV.Combat.currentTurn(st);
    if (!t) break;
    if (t.unit === um) ADV.Combat.act(st, um, { kind: 'attack', targetUid: ud.uid });
    else ADV.Combat.aiTakeTurn(st, t.unit);
    ADV.Combat.advance(st);
  }
  ok(skipped, 'frozen enemy loses a whole turn');

  // pyromaniac: resist + leech
  const pyro = mkCh({}); give(pyro, 'pyromaniac', 25); give(pyro, 'fire_bolt', 1);
  const pyroFoe = mkCh({ name: 'FoeMage' }); give(pyroFoe, 'fire_bolt', 1);
  const st2 = fight(pyro, pyroFoe, 41);
  const up = unit(st2, pyro), uf = unit(st2, pyroFoe);
  up.chp = 50;
  ADV.Combat.act(st2, up, { kind: 'skill', skillId: 'fire_bolt', targetUid: uf.uid });
  ok(up.chp > 50, 'Fire Lord heals from fire damage dealt (leech)', up.chp);
  const before = up.chp;
  ADV.Combat.act(st2, uf, { kind: 'skill', skillId: 'fire_bolt', targetUid: up.uid });
  const taken = before - up.chp;
  const st3 = fight(mkCh({}), pyroFoe, 41);
  const plain = unit(st3, st3.units[0].ch);
  ADV.Combat.act(st3, unit(st3, pyroFoe), { kind: 'skill', skillId: 'fire_bolt', targetUid: plain.uid });
  ok(taken < 100 - plain.chp + 3, 'fire resist reduces incoming fire damage', taken);

  // ice queen stacks
  const iq = mkCh({}); give(iq, 'ice_queen', 25); give(iq, 'frost_touch', 1);
  const iqFoe = ADV.Character.makeEnemy(new ADV.RNG(6), 'plated_sentinel', { level: 3 });
  iqFoe.stats.hp = 400;
  const st4 = fight(iq, iqFoe, 51);
  const uq = unit(st4, iq);
  ADV.Combat.act(st4, uq, { kind: 'skill', skillId: 'frost_touch', targetUid: unit(st4, iqFoe).uid });
  const armor = uq.statuses.find(x => x.kind === 'iceArmor');
  ok(armor && Math.abs(armor.pct - 0.25) < 1e9 && armor.pct === 0.25, 'Winter Court stacks 25% frost armor per ice hit', armor && armor.pct);

  // lightning king: 2 turns per round
  const lk = mkCh({}); give(lk, 'lightning_king', 1);
  const st5 = fight(lk, ADV.Character.makeEnemy(new ADV.RNG(7), 'bandit', {}), 61);
  eq(st5.turnQueue.filter(t => t.uid === unit(st5, lk).uid).length, 2, 'Lightning King acts twice per round');
})();

// ---------------- 5. smoke bomb durations / cooldown; backstab power ----------------
(function () {
  console.log('\n-- 5. Vanish / Shadowstep duration --');
  eq(ADV.DATA.SKILLS.smoke_bomb.tiers.intermediate.untargetableRounds, 1, 'Vanish: 1 round, then evade');
  eq(ADV.DATA.SKILLS.smoke_bomb.tiers.advanced.untargetableRounds, 1, 'Shadowstep: 1 round, then evade');
  const rogue = mkCh({}); give(rogue, 'smoke_bomb', 1); give(rogue, 'backstab', 1);
  const foe = ADV.Character.makeEnemy(new ADV.RNG(6), 'bandit', { level: 3 });
  const st = fight(rogue, foe, 51);
  const ur = unit(st, rogue);
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ur.uid });
  eq(ADV.Combat.cooldownLeft(ur, 'smoke_bomb'), 3, 'basic Smoke Bomb: cooldown 3');
  const again = ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ur.uid });
  ok(!again.ok, 'refused while recovering');
  const bs = ADV.SkillSys.manifest(rogue, rogue.actives.find(a => a.skillId === 'backstab'));
  eq(bs.data.power, 3, 'basic Backstab is half power (3.0)');
  rogue.actives.find(a => a.skillId === 'backstab').level = 10;
  const bs2 = ADV.SkillSys.manifest(rogue, rogue.actives.find(a => a.skillId === 'backstab'));
  eq(bs2.data.power, 6, 'Throat Cut keeps the old 6.0');
})();

// ---------------- 6. bribes ----------------
(function () {
  console.log('\n-- 6. Charm bribes --');
  ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
  const game = ADV.Game.newGame({ seed: 66, name: 'Silver', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['charm', 'aimed_shot', 'snare'] });
  const world = game.world;
  const p = ADV.Game.player(game);
  p.inventory.gold = 500;
  const hater = world.characters.find(c => !c.isPlayer);
  ADV.Rel.move(world, hater.id, p.id, -100, 'murder', { set: true });
  const offer = ADV.Game.bribeOffer(game, hater);
  ok(offer && offer.fee > 0 && offer.chance === 0.4, 'offer exists for a hater (Charm L1: 40%)', JSON.stringify(offer));
  const charm = p.perks.find(e => e.skillId === 'charm') || p.actives.find(e => e.skillId === 'charm');
  const st1 = fight([p], [hater], 71);
  st1.rng = { chance: () => true, float: () => 0, pick: a => a[0], int: (a) => a, shuffle: a => a, fork: () => st1.rng };
  const r1 = ADV.Combat.act(st1, unit(st1, p), { kind: 'bribe', targetUid: unit(st1, hater).uid, fee: offer.fee, chance: offer.chance });
  ok(r1.ok && r1.success && unit(st1, hater).fled, 'basic Charm: bribed enemy walks away');
  charm.level = 25; charm.uses = 250;
  const offerAdv = ADV.Game.bribeOffer(game, hater);
  ok(offerAdv && offerAdv.chance === 0.8, 'Charm at advanced bribes at 80%');
  ok(!ADV.Game.bribeOffer(game, ADV.Character.makeEnemy(new ADV.RNG(8), 'bandit', {})), 'no bribing monsters');
  const hater2 = world.characters.find(c => !c.isPlayer && c !== hater) || hater;
  ADV.Rel.move(world, hater2.id, p.id, -100, 'murder', { set: true });
  p.inventory.gold = 500;
  const st = fight([p], [hater2], 72);
  st.rng = { chance: () => true, float: () => 0, pick: a => a[0], int: (a) => a, shuffle: a => a, fork: () => st.rng };
  const up = unit(st, p), uh = unit(st, hater2);
  const r = ADV.Combat.act(st, up, { kind: 'bribe', targetUid: uh.uid, fee: offerAdv.fee, chance: offerAdv.chance });
  ok(r.ok && r.success && uh.side === 'a' && !uh.fled, 'Beguile recruits the bribed enemy for this fight');
  eq(p.inventory.gold, 500 - offerAdv.fee, 'fee deducted');
  ok(st.over && st.winner === 'a', 'battle ends when the last enemy is bought off');
})();

// ---------------- 7. Holy Smite (was Cleanse) ----------------
(function () {
  console.log('\n-- 7. Holy Smite --');
  const priest = mkCh({}); give(priest, 'cleanse', 1);
  const foe = ADV.Character.makeEnemy(new ADV.RNG(9), 'bandit', {});
  const st = fight([priest], [foe], 81);
  const uP = unit(st, priest), uF = unit(st, foe);
  uF.evade = 0;
  const hp = uF.chp;
  const r = ADV.Combat.act(st, uP, { kind: 'skill', skillId: 'cleanse', targetUid: uF.uid });
  ok(r.ok && uF.chp < hp, 'Holy Smite damages the enemy');
  ok(uF.statuses.some(x => x.kind === 'burn'), 'applies burn');
  const w = uF.statuses.find(x => x.kind === 'withering');
  ok(w && w.rounds === 2, 'applies wither for 2 turns');
  const healed = ADV.Combat._internals.healUnit(st, uP, uF, 80);
  eq(healed, 0, 'withered target cannot receive healing');
  const ally = mkCh({ name: 'Ally' });
  const st2 = fight([priest, ally], [ADV.Character.makeEnemy(new ADV.RNG(10), 'bandit', {})], 82);
  const pool = ADV.Combat.validTargets(st2, unit(st2, priest), 'cleanse', false);
  ok(pool.every(x => x.side === 'b'), 'Holy Smite targets enemies, not allies');
})();

// ---------------- 8. snare seals ----------------
(function () {
  console.log('\n-- 8. Bind / Root Field seals --');
  const ranger = mkCh({}); give(ranger, 'snare', 12); // Bind
  const foe = mkCh({ name: 'Mageling' }); give(foe, 'fire_bolt', 1); // basic manifests
  const st = fight(ranger, foe, 121);
  const uR = unit(st, ranger), uF = unit(st, foe);
  ADV.Combat.act(st, uR, { kind: 'skill', skillId: 'snare', targetUid: uF.uid });
  const sealSt = uF.statuses.find(x => x.kind === 'sealed');
  ok(sealSt && sealSt.tiers.includes('basic') && sealSt.rounds === 2, 'Bind seals basic skills for 2 rounds');
  const blocked = ADV.Combat.act(st, uF, { kind: 'skill', skillId: 'fire_bolt', targetUid: uR.uid });
  ok(!blocked.ok && blocked.error === 'sealed', 'sealed unit cannot use a basic-tier skill');
  const basicOk = ADV.Combat.act(st, uF, { kind: 'attack', targetUid: uR.uid });
  ok(basicOk.ok, 'Basic Attack is never sealed (no dead turns)');

  // Root Field: hits three lanes, seals basic+intermediate
  const ranger2 = mkCh({}); give(ranger2, 'snare', 25);
  const g1 = mkCh({ name: 'F1', archetypeInclination: ['tank'] });
  const g2 = mkCh({ name: 'M1', archetypeInclination: ['healer'] }); give(g2, 'mend', 12);
  const g3 = mkCh({ name: 'B1', archetypeInclination: ['mage'] });
  const st2 = fight([ranger2], [g1, g2, g3], 131);
  const uR2 = unit(st2, ranger2);
  ADV.Combat.act(st2, uR2, { kind: 'skill', skillId: 'snare', targetUid: unit(st2, g2).uid });
  const sealedCount = [g1, g2, g3].filter(c => unit(st2, c).statuses.some(x => x.kind === 'sealed')).length;
  ok(sealedCount >= 2, 'Root Field spreads across adjacent lanes', sealedCount);
  const s2 = unit(st2, g2).statuses.find(x => x.kind === 'sealed');
  ok(s2 && s2.tiers.includes('intermediate'), 'Root Field also seals intermediate skills');
  const blocked2 = ADV.Combat.act(st2, unit(st2, g2), { kind: 'skill', skillId: 'mend', targetUid: unit(st2, g2).uid });
  ok(!blocked2.ok, 'intermediate Mend blocked under Root Field');
})();

(function () {
  console.log('\n-- auto rotation skips a skill that cannot fire --');
  const healer = mkCh({ isPlayer: true }); give(healer, 'mend', 1); give(healer, 'fire_bolt', 1);
  const ally = mkCh({ name: 'Ally' });
  const e1 = mkCh({ name: 'Hurt' }); const e2 = mkCh({ name: 'Healthy' });
  const st = fight([healer, ally], [e1, e2], 41);
  const uh = unit(st, healer), ua = unit(st, ally), u1 = unit(st, e1);
  u1.chp = 8; ua.chp = ua.maxHp; uh.chp = uh.maxHp;
  ADV.Combat.setSkillAuto(healer, 'mend', true, false);
  ADV.Combat.setSkillAuto(healer, 'fire_bolt', true, false);
  ok(ADV.Combat.skillAutoOn(healer, 'mend', false) && ADV.Combat.skillAutoOn(healer, 'fire_bolt', false), 'both skills stay in the rotation');
  const ready = ADV.Combat.autoReadyAction(st, uh);
  eq(ready && ready.action.skillId, 'fire_bolt', 'full-party Mend is skipped; Fire Bolt fires instead');
  eq(ready && ready.tgt.ch, e1, 'the fallback still takes a finishable foe');
  ua.chp = 20;
  healer.autoIdx = 0;
  const readyHeal = ADV.Combat.autoReadyAction(st, uh);
  eq(readyHeal && readyHeal.action.skillId, 'mend', 'Mend is used once someone is actually hurt');
})();

(function () {
  console.log('\n-- turning AUTO off actually drops the last skill --');
  const ch = mkCh({ isPlayer: true }); give(ch, 'fire_bolt', 1);
  ADV.Combat.setSkillAuto(ch, 'basic_attack', true, false);
  ok(ADV.Combat.skillAutoOn(ch, 'basic_attack', false), 'Attack AUTO arms');
  ADV.Combat.setSkillAuto(ch, 'basic_attack', false, false);
  ok(!ADV.Combat.skillAutoOn(ch, 'basic_attack', false), 'Attack AUTO stays off when it was the only one');
  eq(ADV.Combat.autoList(ch).length, 0, 'the rotation is empty after the last Attack toggle');
  ok(!ch.autoAttack && !ch.autoRepeat, 'legacy attack flags do not resurrect it');

  ADV.Combat.setSkillAuto(ch, 'fire_bolt', true, false);
  ADV.Combat.setSkillAuto(ch, 'basic_attack', true, false);
  ADV.Combat.setSkillAuto(ch, 'fire_bolt', false, false);
  ok(ADV.Combat.skillAutoOn(ch, 'basic_attack', false), 'Attack stays on after dropping Fire Bolt');
  ADV.Combat.setSkillAuto(ch, 'basic_attack', false, false);
  ok(!ADV.Combat.skillAutoOn(ch, 'basic_attack', false), 'Attack turns off after the other skill is already gone');
  eq(ADV.Combat.autoList(ch).length, 0, 'clearing the last remaining skill empties the rotation');

  ADV.Combat.setSkillAuto(ch, 'fire_bolt', true, false);
  ADV.Combat.setSkillAuto(ch, 'fire_bolt', false, false);
  ok(!ADV.Combat.skillAutoOn(ch, 'fire_bolt', false), 'a lone skill AUTO also stays off');
  ok(!ch.actives.find(e => e.skillId === 'fire_bolt').auto, 'the per-skill flag is cleared');

  const legacy = mkCh({ isPlayer: true, autoOrder: undefined, autoAdopted: false, autoAttack: true });
  delete legacy.autoOrder;
  legacy.autoAdopted = false;
  legacy.autoAttack = true;
  ok(ADV.Combat.skillAutoOn(legacy, 'basic_attack', false), 'old saves still fold autoAttack into the list');
  ADV.Combat.setSkillAuto(legacy, 'basic_attack', false, false);
  ok(!ADV.Combat.skillAutoOn(legacy, 'basic_attack', false), 'then that folded Attack can still be turned off');
})();

(function () {
  console.log('\n-- Venom Fang applies poison and bleed --');
  const rogue = mkCh({ stats: { hp: 100, atk: 14, def: 8, spd: 14 } }); give(rogue, 'venom_fang', 1);
  const foe = mkCh({ name: 'Mark', stats: { hp: 200, atk: 8, def: 6, spd: 8 } });
  const st = fight(rogue, foe, 51);
  const ur = unit(st, rogue), uf = unit(st, foe);
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'venom_fang', targetUid: uf.uid });
  ok(uf.statuses.some(x => x.kind === 'poison'), 'Venom Fang poisons');
  ok(uf.statuses.some(x => x.kind === 'bleed'), 'Venom Fang also bleeds');
})();

(function () {
  console.log('\n-- poison hops to the next living foe --');
  const hero = mkCh({ isPlayer: true, stats: { hp: 200, atk: 18, def: 8, spd: 14 } });
  give(hero, 'venom_fang', 10);
  const a = mkCh({ name: 'First', stats: { hp: 80, atk: 6, def: 8, spd: 8 } });
  const b = mkCh({ name: 'Next', stats: { hp: 80, atk: 6, def: 2, spd: 8 } });
  const st = fight(hero, [a, b], 61);
  const uh = unit(st, hero), ua = unit(st, a), ub = unit(st, b);
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'venom_fang', targetUid: ua.uid });
  ok(ua.statuses.some(x => x.kind === 'poison'), 'the first foe is poisoned');
  ua.chp = 1;
  ADV.Combat.act(st, uh, { kind: 'attack', targetUid: ua.uid });
  ok(ua.downed, 'the poisoned foe dies');
  ok(ub.statuses.some(x => x.kind === 'poison'), 'the poison lands on the next living foe');
  ok(st.events.some(e => e.t === 'poisonHop' && e.from === ua.uid && e.to === ub.uid), 'the hop is logged');
})();

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
