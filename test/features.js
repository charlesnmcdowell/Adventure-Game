// Non-organic resistances, intermediate AoEs, rival companies, necromancy thralls.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const mkCh = (o) => ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 12, def: 10, spd: 10 } }, o));
const give = (ch, id, lvl) => { const sk = ADV.DATA.SKILLS[id]; (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: lvl || 1, uses: 0 }); };
const fight = (a, b, seed) => { for (const c of [].concat(a, b)) c.combatHp = null; return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) }); };
const unit = (st, ch) => st.units.find(u => u.ch === ch);
function newGame(seed, skills) {
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed, name: 'T', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: skills || ['cleave', 'mend', 'fire_bolt'] });
  g.tutorial = { step: 'done' };
  return g;
}

(function () {
  console.log('\n-- non-organic: immunities and weaknesses --');
  const sentinel = ADV.Character.makeEnemy(new ADV.RNG(2), 'plated_sentinel', { level: 6 });
  ok(!ADV.Character.isOrganic(sentinel), 'constructs are non-organic');
  ok(sentinel.statusImmunities.includes('poison') && sentinel.statusImmunities.includes('bleed') && sentinel.statusImmunities.includes('burn'),
    'constructs are immune to poison, bleed, and burn');
  const mage2 = mkCh({ stats: { hp: 200, atk: 12, def: 10, spd: 14 } }); give(mage2, 'spark', 1); give(mage2, 'fire_bolt', 1);
  const sent2 = ADV.Character.makeEnemy(new ADV.RNG(2), 'plated_sentinel', { level: 6 });
  sent2.stats.hp = 400; sent2.stats.def = 10;
  const stSparkS = fight(mage2, sent2, 12);
  const dummyH = mkCh({ stats: { hp: 400, atk: 8, def: 10, spd: 8 } });
  const mage3 = mkCh({ stats: { hp: 200, atk: 12, def: 10, spd: 14 } }); give(mage3, 'spark', 1); give(mage3, 'fire_bolt', 1);
  const stSparkH = fight(mage3, dummyH, 12);
  ADV.Combat.act(stSparkS, unit(stSparkS, mage2), { kind: 'skill', skillId: 'spark', targetUid: unit(stSparkS, sent2).uid });
  ADV.Combat.act(stSparkH, unit(stSparkH, mage3), { kind: 'skill', skillId: 'spark', targetUid: unit(stSparkH, dummyH).uid });
  const dmgS = 400 - unit(stSparkS, sent2).chp;
  const dmgH = 400 - unit(stSparkH, dummyH).chp;
  ok(dmgS > dmgH, 'constructs take extra lightning damage', dmgS + ' vs ' + dmgH);

  const stBurn = fight(mage2, sentinel, 13);
  ADV.Combat.act(stBurn, unit(stBurn, mage2), { kind: 'skill', skillId: 'fire_bolt', targetUid: unit(stBurn, sentinel).uid });
  ok(!unit(stBurn, sentinel).statuses.some(x => x.kind === 'burn'), 'Fire Bolt cannot burn a construct');
})();

(function () {
  console.log('\n-- non-organic: poison / bleed bounce --');
  const rogue = mkCh({}); give(rogue, 'venom_fang', 1);
  const sent = ADV.Character.makeEnemy(new ADV.RNG(4), 'plated_sentinel', { level: 6 });
  sent.stats.hp = 400;
  const st = fight(rogue, sent, 21);
  ADV.Combat.act(st, unit(st, rogue), { kind: 'skill', skillId: 'venom_fang', targetUid: unit(st, sent).uid });
  ok(!unit(st, sent).statuses.some(x => x.kind === 'poison'), 'Venom Fang cannot poison a construct');
  ok(st.events.some(e => e.t === 'immune' && e.kind === 'poison'), 'immunity is logged');
})();

(function () {
  console.log('\n-- intermediate AoE: fire, poison, cleanse --');
  eq(ADV.DATA.SKILLS.fire_bolt.tiers.intermediate.target, 'enemyLane', 'Fire Blast hits the enemy lane');
  eq(ADV.DATA.SKILLS.venom_fang.tiers.intermediate.adjacent, 1, 'Black Fang splashes an adjacent foe');
  eq(ADV.DATA.SKILLS.cleanse.tiers.intermediate.target, 'party', 'Purify cleanses the party');
  eq(ADV.DATA.SKILLS.regenerate.tiers.intermediate.offensiveTarget, 'enemyLane', 'Sustain-as-Poison hits the lane');
  const healer = mkCh({ name: 'H', archetypeInclination: ['healer'] }); give(healer, 'regenerate', 10); give(healer, 'cleanse', 10);
  const a = mkCh({ name: 'A' });
  const e1 = mkCh({ name: 'E1' }); const e2 = mkCh({ name: 'E2' });
  const st = fight([healer, a], [e1, e2], 31);
  const uH = unit(st, healer), uA = unit(st, a), uE1 = unit(st, e1), uE2 = unit(st, e2);
  uA.statuses.push({ kind: 'poison', rounds: 3, power: 0.5 });
  ADV.Combat.act(st, uH, { kind: 'skill', skillId: 'cleanse', targetUid: uA.uid });
  ok(!uA.statuses.some(x => x.kind === 'poison'), 'Purify strips poison from the party');
  ADV.Combat.act(st, uH, { kind: 'skill', skillId: 'regenerate', targetUid: uE1.uid, offensiveMode: true });
  const poisoned = [uE1, uE2].filter(u => u.statuses.some(x => x.kind === 'poison'));
  ok(poisoned.length >= 1, 'intermediate Poison lands on at least the target');
})();

(function () {
  console.log('\n-- rival company every 5th outing --');
  const g = newGame(99);
  const p = ADV.Game.player(g);
  p.questsCompleted = 4; p.questsFailed = 0;
  const q = g.board.find(x => x.track !== 'solo' || !ADV.Party.of(g.world, p)) || g.board[0];
  // solo-legal vs criminal opposite
  const criminal = Object.assign({}, q, { factionAlignment: 'criminal', campaign: false, track: 'solo' });
  const r = ADV.Game.attachRival(g, criminal);
  ok(r && r.alignment === 'law', 'criminal outing meets a legal company');
  ok(r.leaderId && g.world.parties.some(x => x.id === r.partyId), 'rival is a living board party');
  p.questsCompleted = 0;
  ok(!ADV.Game.shouldMeetRival(g, criminal), 'first outing is not a rival meeting');
  p.questsCompleted = 4;
  const camp = Object.assign({}, criminal, { campaign: true });
  ok(!ADV.Game.shouldMeetRival(g, camp), 'campaign quests skip the intercept');
})();

(function () {
  console.log('\n-- rival wipe + new parties every 2 quests --');
  const g = newGame(101);
  const world = g.world;
  const before = world.parties.length;
  const freeBefore = world.characters.filter(c => c.alive && !c.isPlayer && !c.partyId && !c.registryId).length;
  ADV.World.formFreeParties(world, g.rng, () => {}, { max: 2 });
  ok(world.parties.length >= before, 'formFreeParties does not shrink the board');
  if (freeBefore >= 2) ok(world.parties.length > before || world.characters.filter(c => c.alive && !c.isPlayer && !c.partyId).length < freeBefore,
    'available NPCs are gathered into new parties');
  const victimParty = world.parties.find(x => x.leaderId !== world.playerId);
  const ids = ADV.Party.roster(world, victimParty).map(c => c.id);
  ADV.Game.wipeParty(world, victimParty, world.playerId);
  ok(!world.parties.includes(victimParty), 'a wiped company leaves the party board');
  ok(ids.every(id => { const c = ADV.World.byId(world, id); return c && !c.alive; }), 'a wiped company is dead');
})();

(function () {
  console.log('\n-- necromancy: auto-raise quest thralls --');
  const g = newGame(77, ['necromancy', 'cleave', 'mend']);
  const p = ADV.Game.player(g);
  const quest = g.board.find(x => x.track === 'solo') || g.board[0];
  const started = ADV.Game.startQuest(g, quest, {});
  ok(started.ok, 'quest starts');
  const mk = (type, seed) => {
    const foe = ADV.Character.makeEnemy(new ADV.RNG(seed), type, { level: 2 });
    foe.stats.hp = 20;
    return foe;
  };
  const bandits = [mk('bandit', 8), mk('bandit', 9), mk('bandit', 10)];
  const steel = mk('plated_sentinel', 11);
  g.quest.enemies = bandits.concat(steel);
  const st = ADV.Combat.create([p], g.quest.enemies, { rng: new ADV.RNG(9) });
  for (const u of st.units.filter(x => x.side === 'b')) { u.chp = 0; u.downed = true; }
  st.winner = 'a'; st.over = true;
  g.quest.combat = st;
  ADV.Game.finishCombat(g);
  eq(g.quest.thralls.length, 3, 'every organic enemy rises');
  ok(g.quest.thralls.every(t => t.isUndead && t.isQuestThrall), 'thralls are undead for this quest');
  ok(!g.quest.thralls.some(t => /Sentinel/.test(t.name)), 'constructs stay down');
  ok(steel.organic === false && !ADV.Character.isOrganic(steel), 'sentinels are stamped inorganic');
  const stripped = mk('plated_sentinel', 12);
  stripped.species = 'human';
  ok(!ADV.Character.isOrganic(stripped), 'type table still blocks a sentinel if species is missing');
  const roster = ADV.Game.partyRoster(g);
  ok(g.quest.thralls.every(t => roster.includes(t)), 'thralls join the quest roster');
  g.quest.thralls[0].combatHp = 0;
  ADV.Game.restoreQuestThralls(g);
  ok(g.quest.thralls[0].combatHp > 0, 'a downed thrall stands up for the next field');
  ok(g.quest.thralls.every(t => ADV.Game.partyRoster(g).includes(t)), 'they stay on the roster for the next battle');
  g.quest.failed = false; g.quest.readyToComplete = true;
  ADV.Game.completeQuest(g);
  ok(!g.quest, 'quest cleared');
  ok(p.undeadIds.length === 0, 'all thralls are gone when the contract ends');
})();

(function () {
  console.log('\n-- company of 8: empty seats then 3 extras --');
  const solo = newGame(81, ['necromancy', 'cleave', 'mend']);
  const sp = ADV.Game.player(solo);
  eq(ADV.Party.companyCap(), 8, 'the company caps at eight');
  eq(ADV.Party.followerRoom(solo.world, sp, []), 7, 'solo: four empty seats plus three extras');
  const sq = solo.board.find(x => x.track === 'solo') || solo.board[0];
  ok(ADV.Game.startQuest(solo, sq, {}).ok, 'solo quest starts');
  const pack = [];
  for (let i = 0; i < 10; i++) {
    const foe = ADV.Character.makeEnemy(new ADV.RNG(20 + i), 'bandit', { level: 1 });
    foe.stats.hp = 10;
    pack.push(foe);
  }
  solo.quest.enemies = pack;
  const stS = ADV.Combat.create([sp], pack, { rng: new ADV.RNG(21) });
  for (const u of stS.units.filter(x => x.side === 'b')) { u.chp = 0; u.downed = true; }
  stS.winner = 'a'; stS.over = true;
  solo.quest.combat = stS;
  ADV.Game.finishCombat(solo);
  eq(solo.quest.thralls.length, 7, 'seven organic fallen rise onto a solo company');
  eq(ADV.Game.partyRoster(solo).length, 8, 'player plus seven thralls');
  const nextS = ADV.Combat.create(ADV.Game.partyRoster(solo), [ADV.Character.makeEnemy(new ADV.RNG(22), 'bandit', { level: 1 })], { rng: new ADV.RNG(23) });
  eq(nextS.units.filter(u => u.side === 'a' && !u.reserved).length, 8, 'all eight stand on the next field');

  const full = newGame(82, ['necromancy', 'conscript', 'cleave']);
  const fp = ADV.Game.player(full);
  ADV.Party.create(full.world, fp.id);
  const party = ADV.Party.of(full.world, fp);
  full.world.characters.filter(c => c.alive && !c.isPlayer).slice(0, 4).forEach(c => {
    party.memberIds.push(c.id); party.wages[c.id] = 0;
    c.partyId = party.id; c.leaderId = fp.id; c.wage = 0;
  });
  eq(ADV.Party.regularMembers(full.world, fp).length, 5, 'five hired bodies');
  eq(ADV.Party.followerRoom(full.world, fp, []), 3, 'three extra seats remain for the bound');
  const pq = full.board.find(x => x.track === 'party') || full.board[0];
  ok(ADV.Game.startQuest(full, pq, {}).ok, 'party quest starts');
  const more = [];
  for (let i = 0; i < 5; i++) {
    const foe = ADV.Character.makeEnemy(new ADV.RNG(30 + i), 'bandit', { level: 1 });
    foe.stats.hp = 10;
    more.push(foe);
  }
  full.quest.enemies = more;
  const stF = ADV.Combat.create(ADV.Game.partyRoster(full), more, { rng: new ADV.RNG(31), world: full.world });
  for (const u of stF.units.filter(x => x.side === 'b')) { u.chp = 0; u.downed = true; }
  stF.winner = 'a'; stF.over = true;
  full.quest.combat = stF;
  ADV.Game.finishCombat(full);
  eq(full.quest.thralls.length, 3, 'three risen fill the extra seats on a full company');
  eq(ADV.Game.partyRoster(full).length, 8, 'hired five plus three bound is eight');
  eq(ADV.Party.followerRoom(full.world, fp, full.quest.thralls), 0, 'no ninth body');
})();

(function () {
  console.log('\n-- conscript: in-fight, guild NPC, 3-quest term --');
  const g = newGame(78, ['conscript', 'cleave', 'mend']);
  const p = ADV.Game.player(g);
  const npc = g.world.characters.find(c => c.alive && !c.isPlayer && !c.partyId && c.sex === 'm');
  const monster = ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', { level: 2 });
  const st = ADV.Combat.create([p], [npc, monster], { rng: new ADV.RNG(4), world: g.world });
  const uP = st.units.find(u => u.ch === p);
  const uN = st.units.find(u => u.ch === npc);
  const uM = st.units.find(u => u.ch === monster);
  uN.chp = Math.round(uN.maxHp * 0.8);
  ok(!ADV.Combat.validTargets(st, uP, 'conscript').includes(uN), 'above 60% health is not a valid take');
  ok(!ADV.Combat.validTargets(st, uP, 'conscript').includes(uM), 'monsters are not guild members');
  uN.chp = Math.round(uN.maxHp * 0.4);
  ok(ADV.Combat.validTargets(st, uP, 'conscript').includes(uN), 'a hurt guild NPC can be taken');
  const r = ADV.Combat.act(st, uP, { kind: 'skill', skillId: 'conscript', targetUid: uN.uid });
  ok(r.ok && npc.isConscript && npc.conscriptorId === p.id, 'the skill binds them mid-fight');
  eq(npc.conscriptQuestsLeft, 3, 'the term is three quests');
  eq(uN.side, 'a', 'they switch to your side');
  ok((p.conscriptIds || []).includes(npc.id), 'they stay on the party as a follower');
  g.world.questClock = 0;
  ADV.Divine.tickFollowers(g.world, () => {});
  ADV.Divine.tickFollowers(g.world, () => {});
  ok(npc.isConscript && npc.conscriptQuestsLeft === 1, 'still bound after two quests');
  ADV.Divine.tickFollowers(g.world, () => {});
  ok(!npc.isConscript, 'they escape after the third quest');
  ok(ADV.Rel.score(g.world, npc.id, p.id) <= ADV.DATA.CONST.REL.HATRED_MAX, 'and they hate you for it');
})();

(function () {
  console.log('\n-- conscript: post-fight choice on a beaten guild NPC --');
  const g = newGame(79, ['conscript', 'necromancy', 'cleave']);
  const p = ADV.Game.player(g);
  const npc = g.world.characters.find(c => c.alive && !c.isPlayer && ADV.Divine.guildNpc(g.world, c));
  ok(!!ADV.SkillSys.entryFor(p, 'conscript'), 'the player has Conscript equipped');
  ok(!!npc, 'a guild NPC is on the roster');
  const quest = g.board.find(x => x.track === 'solo') || g.board[0];
  ok(ADV.Game.startQuest(g, quest, {}).ok, 'quest starts');
  const risen = ADV.Game.autoRaiseFallen(g, [npc]);
  eq(risen.length, 0, 'necromancy does not swallow a guild member the player can conscript');
  const r = ADV.Game.resolveDefeatedNamed(g, npc, 'conscript');
  ok(!r.error && npc.isConscript && npc.conscriptorId === p.id, 'the beaten choice binds them');
  eq(npc.conscriptQuestsLeft, 3, 'the term is still three quests');
})();

(function () {
  console.log('\n-- portraits match voices --');
  const woman = ADV.Character.base({ sex: 'f', name: 'Tes', personalityId: 'M01' });
  ADV.Character.ensurePersonalitySex(woman, new ADV.RNG(3));
  ok(ADV.DATA.DIALOGUE[woman.personalityId].sex === 'f', 'a woman is given a female voice');
  const man = ADV.Character.base({ sex: 'm', name: 'Tes2', personalityId: 'F01' });
  ADV.Character.ensurePersonalitySex(man, new ADV.RNG(4));
  ok(ADV.DATA.DIALOGUE[man.personalityId].sex === 'm', 'a man is given a male voice');
  const world = ADV.World.create(7);
  ok(world.characters.filter(c => !c.isPlayer).every(c => {
    const p = ADV.DATA.DIALOGUE[c.personalityId];
    return p && p.sex === c.sex;
  }), 'every seeded NPC speaks in a matching voice');
})();

(function () {
  console.log('\n-- leader death disbands and pays nothing --');
  const g = newGame(55, ['cleave', 'mend', 'bulwark']);
  const p = ADV.Game.player(g);
  const party = g.world.parties[0];
  const leader = ADV.Party.leader(g.world, party);
  party.memberIds.push(p.id); party.wages[p.id] = 30;
  p.partyId = party.id; p.leaderId = leader.id; p.wage = 30;
  const others = ADV.Party.members(g.world, party).filter(c => c !== p);
  const q = g.board.find(x => x.track === 'party') || g.board[0];
  const started = ADV.Game.startQuest(g, Object.assign({}, q, { track: 'party', campaign: false }), {});
  ok(started.ok, 'hireling quest starts');
  const foe = ADV.Character.makeEnemy(new ADV.RNG(2), 'bandit', { level: 1 });
  g.quest.enemies = [foe];
  const st = ADV.Combat.create(ADV.Game.partyRoster(g), [foe], { rng: new ADV.RNG(3), leaderId: leader.id });
  const lu = st.units.find(u => u.ch === leader);
  lu.chp = 0; lu.downed = true; st.over = true; st.winner = 'b'; st.leaderFell = true;
  g.quest.combat = st;
  const beforeRep = p.reputation;
  ADV.Game.finishCombat(g);
  ok(g.quest.leaderDied && g.quest.failed, 'leader death voids the contract');
  ok(!p.partyId, 'the hireling is no longer in a party');
  ok(!g.world.parties.includes(party), 'the company leaves the board');
  ok(!leader.alive, 'the lead is dead');
  ok(g.world.pendingLeaderDeath && g.world.pendingLeaderDeath.memberIds.length === others.length, 'farewells are queued');
  const goldBefore = p.inventory.gold;
  const out = ADV.Game.completeQuest(g);
  ok(out.gold === 0 && !out.wage, 'no payout when the lead dies');
  ok(p.reputation < beforeRep, 'reputation is lost');
  ok(others.every(c => c.alive && !c.partyId), 'survivors are free agents');
})();

(function () {
  console.log('\n-- skill auto-target: lowest health --');
  const healer = mkCh({ isPlayer: true }); give(healer, 'mend', 1); give(healer, 'fire_bolt', 1);
  const ally = mkCh({ name: 'Ally' });
  const e1 = mkCh({ name: 'Hurt' }); const e2 = mkCh({ name: 'Healthy' });
  const st = fight([healer, ally], [e1, e2], 7);
  const uh = unit(st, healer), ua = unit(st, ally), u1 = unit(st, e1), u2 = unit(st, e2);
  u1.chp = 40; u2.chp = 180; ua.chp = 30; uh.chp = 90;
  const foe = ADV.Combat.lowestHealth(ADV.Combat.validTargets(st, uh, 'fire_bolt', false));
  eq(foe && foe.ch, e1, 'offensive auto picks the lowest-health enemy');
  const heal = ADV.Combat.lowestHealth(ADV.Combat.validTargets(st, uh, 'mend', false));
  eq(heal && heal.ch, ally, 'heal auto picks the lowest-health ally');
  uh.chp = 10;
  const healSelf = ADV.Combat.lowestHealth(ADV.Combat.validTargets(st, uh, 'mend', false));
  eq(healSelf && healSelf.ch, healer, 'heal auto can pick self when you are the weakest');
  ok(ADV.Combat.skillNeedsAuto(healer, 'fire_bolt', false), 'Fire Bolt offers auto');
  ok(!ADV.Combat.skillNeedsAuto(healer, 'smoke_bomb', false), 'self-only skills skip auto');
  ADV.Combat.setSkillAuto(healer, 'fire_bolt', true, false);
  ok(ADV.Combat.skillAutoOn(healer, 'fire_bolt', false), 'auto flag sticks on the skill');
  ADV.Combat.setSkillAuto(healer, 'mend', true, false);
  ok(ADV.Combat.skillAutoOn(healer, 'mend', false), 'Mend takes over as the auto skill');
  ok(!ADV.Combat.skillAutoOn(healer, 'fire_bolt', false), 'only one auto skill at a time');
  uh.chp = 90; ua.chp = 30; u1.chp = 8; u2.chp = 180;
  ADV.Combat.setSkillAuto(healer, 'fire_bolt', true, false);
  const ready = ADV.Combat.autoReadyAction(st, uh);
  eq(ready && ready.action.skillId, 'fire_bolt', 'auto-ready repeats Fire Bolt');
  eq(ready && ready.tgt.ch, e1, 'auto-ready still takes a finishable foe');
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: ready.action.skillId, targetUid: ready.tgt.uid });
  ok(u1.chp < 40, 'the repeating skill actually fires');
  const ready2 = ADV.Combat.autoReadyAction(st, uh);
  eq(ready2 && ready2.action.skillId, 'fire_bolt', 'auto stays armed for the next turn');
  ADV.Combat.setSkillAuto(healer, 'mend', true, false);
  ADV.SkillSys.forget(healer, 'mend');
  ADV.SkillSys.learn(healer, 'mend', { free: true });
  ok(ADV.Combat.skillAutoOn(healer, 'mend', false), 'auto survives forget and relearn');
})();

(function () {
  console.log('\n-- auto waits when smoke hides the only target --');
  const hero = mkCh({ isPlayer: true, stats: { hp: 200, atk: 14, def: 10, spd: 12 } });
  give(hero, 'cleave', 1);
  const bandit = mkCh({ name: 'Bandit', stats: { hp: 200, atk: 10, def: 8, spd: 10 } });
  give(bandit, 'smoke_bomb', ADV.DATA.CONST.TIER_THRESHOLDS.intermediate);
  const st = fight(hero, bandit, 3);
  const uh = unit(st, hero), ub = unit(st, bandit);
  ADV.Combat.setSkillAuto(hero, 'cleave', true, false);
  ok(!!ADV.Combat.autoReadyAction(st, uh), 'cleave auto is ready before the smoke');
  ADV.Combat.act(st, ub, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ub.uid });
  ok(ub.untargetable, 'the bandit Vanished');
  eq(ADV.Combat.validTargets(st, uh, 'cleave', false).length, 0, 'cleave has no target while they are vanished');
  eq(ADV.Combat.validTargets(st, uh, 'basic_attack', false).length, 0, 'the basic attack is also empty');
  ok(!ADV.Combat.autoReadyAction(st, uh), 'auto will not fire into empty air');
  ok(!ADV.Combat.hasLegalCombatAction(st, uh), 'nothing legal except wait or flee');
  const held = ADV.Combat.act(st, uh, { kind: 'hold' });
  ok(held && held.ok, 'hold spends the turn');
  ok(st.events.some(e => e.t === 'hold' && e.uid === uh.uid), 'waiting is logged');
  const idx = st.turnIdx;
  ADV.Combat.advance(st);
  eq(st.turnIdx, idx + 1, 'the player turn actually ends');
  ok(ADV.Combat.skillAutoOn(hero, 'cleave', false), 'auto stays armed through the wait');
})();

(function () {
  console.log('\n-- tutorial party quest is a canned easy job --');
  const q = ADV.Quests.makeTutorialParty();
  eq(q.tier, 1, 'tier 1');
  eq(q.track, 'party', 'party track');
  eq(q.name, 'A short road job', 'canned name');
  ok(q.tutorialEasy, 'marked easy');
  eq(q.encounters.length, 2, 'two encounters');
  eq(q.factionAlignment, 'neutral', 'tutorial party job stays off the banners');
  ok(q.encounters.every(e => e.enemyTypeIds.length === 1 && e.enemyTypeIds[0] === 'dire_wolf'), 'one beast each');
  eq(q.enemyLevels[0], 1, 'levels start at the bottom of tier 1');
  eq(q.enemyLevels[1], 2, 'levels stay at the bottom of tier 1');
  const g = newGame(31);
  g.tutorial = { step: 'partyQuest' };
  const p = ADV.Game.player(g);
  const party = g.world.parties[0];
  const leader = ADV.Party.leader(g.world, party);
  party.memberIds.push(p.id); party.wages[p.id] = 30; p.partyId = party.id; p.leaderId = leader.id; p.wage = 30;
  const pick = ADV.Game.leaderPick(g);
  eq(pick && pick.id, 'q_tut_party', 'the guided hireling quest is the canned road job');
  ok(pick.encounters.every(e => e.enemyTypeIds.length === 1), 'the leader is not facing a 3–5 pack');
})();

(function () {
  console.log('\n-- enemy look variants --');
  const a = ADV.Character.makeEnemy(new ADV.RNG(1), 'bandit', { level: 3 });
  const b = ADV.Character.makeEnemy(new ADV.RNG(2), 'bandit', { level: 3 });
  const c = ADV.Character.makeEnemy(new ADV.RNG(3), 'dire_wolf', { level: 6 });
  const d = ADV.Character.makeEnemy(new ADV.RNG(4), 'dire_wolf', { level: 6 });
  ok(a.portraitSeed !== b.portraitSeed, 'two bandits do not share one face seed');
  ok(c.portraitSeed !== d.portraitSeed, 'two wolves do not share one face seed');
  const vars = new Set();
  for (let i = 1; i <= 24; i++) {
    const e = ADV.Character.makeEnemy(new ADV.RNG(i * 17), 'bandit', { level: 3 });
    vars.add((e.portraitSeed >>> 0) % 3);
  }
  eq(vars.size, 3, 'all three bandit looks show up across a pack');
})();

(function () {
  console.log('\n-- housing and extra spouses --');
  eq(ADV.DATA.HOMES.length, 6, 'six dwellings including the roadside');
  ok(!!ADV.DATA.PROMPTS.firstHome, 'buying a first roof has a tutorial line');
  ok(ADV.DATA.PREGAME_CARDS.every(c => !/home|spouse|inn/i.test(c)), 'pre-game cards do not mention housing');
  const g = newGame(88, ['cleave', 'sunder', 'momentum']);
  const p = ADV.Game.player(g);
  eq(ADV.Housing.of(p).id, 'camp', 'starts sleeping rough');
  eq(ADV.Housing.spouseCap(p), 1, 'the roadside holds one spouse');
  p.inventory.gold = 2000;
  const inn = ADV.Housing.buy(g, 'inn');
  ok(inn.ok && inn.first, 'a room at the inn is the first roof');
  eq(p.homeId, 'inn', 'home is the inn');
  eq(p.inventory.gold, 1900, 'the inn costs 100');
  ok(!ADV.Housing.buy(g, 'inn').ok, 'cannot buy the same roof twice');
  ok(ADV.Housing.buy(g, 'brick').ok, 'the brick house upgrades');
  eq(ADV.Housing.spouseCap(p), 2, 'brick holds two spouses');
  ok(ADV.Housing.buy(g, 'mansion').ok, 'the mansion upgrades');
  eq(ADV.Housing.spouseCap(p), 3, 'mansion holds three');
  ok(ADV.Housing.buy(g, 'castle').ok, 'the castle upgrades');
  eq(ADV.Housing.spouseCap(p), 5, 'castle holds five');
  ok(!ADV.Housing.buy(g, 'cottage').ok, 'cannot move backwards into a cottage');

  const g2 = newGame(89, ['cleave']);
  const me = ADV.Game.player(g2);
  const w1 = mkCh({ name: 'Ada', sex: 'f' }); const w2 = mkCh({ name: 'Bea', sex: 'f' });
  g2.world.characters.push(w1, w2);
  ADV.Rel.commit(g2.world, me.id, w1.id);
  ADV.Rel.commit(g2.world, me.id, w2.id);
  ok(!ADV.Rel.isPartner(me, w1), 'a second wife on the roadside jilts the first');
  ok(ADV.Rel.isPartner(me, w2), 'the new wife stays');
  ok(ADV.Rel.hates(g2.world, w1.id, me.id), 'the jilted wife hates him');

  const g3 = newGame(90, ['cleave']);
  const p3 = ADV.Game.player(g3);
  p3.inventory.gold = 350;
  ADV.Housing.buy(g3, 'brick');
  const a = mkCh({ name: 'Cora', sex: 'f' }); const b = mkCh({ name: 'Della', sex: 'f' });
  g3.world.characters.push(a, b);
  ADV.Rel.commit(g3.world, p3.id, a.id);
  ADV.Rel.commit(g3.world, p3.id, b.id);
  ok(ADV.Rel.isPartner(p3, a) && ADV.Rel.isPartner(p3, b), 'a brick house holds two spouses');
  ok(!ADV.Rel.hates(g3.world, a.id, p3.id), 'the first wife is not jilted');
  eq(ADV.Rel.partnerIds(p3).length, 2, 'two partner ids');
  const v = ADV.Vault.of(g3.world, p3);
  ok(v && v.holderId === a.id, 'the first wife still holds the vault');
})();

(function () {
  console.log('\n-- home lighting cycle --');
  eq(ADV.Housing.timeOfDay(0), 'day', 'quest 0 is day');
  eq(ADV.Housing.timeOfDay(1), 'evening', 'quest 1 is evening');
  eq(ADV.Housing.timeOfDay(2), 'night', 'quest 2 is night');
  eq(ADV.Housing.timeOfDay(3), 'day', 'the sky repeats every three quests');
  eq(ADV.Housing.SKY_PHASES.length, 3, 'every roof has day, evening, and night');
})();

(function () {
  console.log('\n-- hireling rival intercept is the lead\'s call --');
  const g = newGame(77);
  const me = ADV.Game.player(g);
  me.questsCompleted = 4;
  const party = g.world.parties.find(x => x.leaderId !== me.id && ADV.Party.leader(g.world, x));
  ok(!!party, 'a company exists to hire into');
  party.memberIds.push(me.id); party.wages[me.id] = 30;
  me.partyId = party.id; me.leaderId = party.leaderId; me.wage = 30;
  eq(ADV.Game.careerStage(g), 'hireling', 'player is a hireling');
  const q = g.board.find(x => x.track === 'party' && !x.campaign);
  const started = ADV.Game.startQuest(g, q, {});
  ok(started.ok && g.quest.rival, 'the fifth outing meets a rival company');
  const r = ADV.Game.applyRivalDecision(g, 'fight');
  eq(r.outcome, 'fight', 'the intercept resolves without a hireling vote');
  ok(g.quest.rivalResolved, 'the intercept is spent');
  ok(g.quest.rivalPending && !g.quest.rivalFight, 'the other company waits until the job is done');
  const enc = ADV.Game.currentEncounter(g);
  ok(enc && !enc.rival, 'the first field is the contract, not the other company');
  g.quest.encIdx = g.quest.quest.encounters.length;
  g.quest.readyToComplete = true;
  ok(ADV.Game.maybeStartRivalFinale(g), 'the finale starts after the last encounter');
  const finale = ADV.Game.currentEncounter(g);
  ok(finale && finale.rival, 'the last field is the other company');
  ok(finale.verbs.length === 1 && finale.verbs[0].verb === 'fight', 'no second fight-or-flee menu');
  const st = ADV.Game.startCombat(g, false);
  ok(st && st.units.some(u => u.ch === me), 'combat starts from the lead\'s call');
  const rivalIds = finale.enemies.map(c => c.id);
  st.winner = 'a';
  for (const u of st.units) if (u.side === 'b') u.downed = true;
  ADV.Game.finishCombat(g);
  ok(rivalIds.every(id => { const c = ADV.World.byId(g.world, id); return c && !c.alive; }), 'the other company is dead');
  ok(rivalIds.every(id => !ADV.World.adults(g.world).some(c => c.id === id)), 'the dead leave the guild roster');
  ok(ADV.Death.graves(g.world).some(c => rivalIds.includes(c.id) && c.obituary), 'the dead are in the graveyard');
})();

(function () {
  console.log('\n-- Ilaria Venn portrait is a Black woman with white braids --');
  const pr = ADV.DATA.CAMPAIGN_CHARS.venn.portrait;
  eq(pr.skin, 'deep', 'deep skin');
  eq(pr.hair, 'braids', 'long braids');
  ok(pr.hairColor && pr.hairColor.toLowerCase() !== '#b8b4a6', 'hair color is set, not a rolled pale disc');
})();

(function () {
  console.log('\n-- graveyard records skills, family, and a eulogy --');
  const g = newGame(51);
  const world = g.world;
  const p = ADV.Game.player(g);
  const spouse = world.characters.find(c => c.sex === 'f' && !c.isPlayer && c.alive);
  ok(!!spouse, 'a living woman exists');
  ADV.Rel.commit(world, p.id, spouse.id);
  const child = ADV.Character.makeDependent(g.rng, world, spouse, p.id);
  child.name = 'Ryn'; child.age = 8;
  spouse.dependents.push(child);
  spouse.childIds.push(child.id); p.childIds.push(child.id);
  give(spouse, 'mend', 4);
  give(spouse, 'cleave', 2);
  ADV.Death.finalize(world, spouse, p.id, 'killed');
  ok(!spouse.alive, 'she is dead');
  ok(!ADV.World.adults(world).includes(spouse), 'the dead are not on the living roster');
  const graves = ADV.Death.graves(world);
  const row = graves.find(c => c.id === spouse.id);
  ok(!!row && row.obituary, 'the graveyard has her');
  const ob = row.obituary;
  ok(ob.skills.indexOf('Mend') >= 0 || ob.skills.some(s => /mend/i.test(s)), 'skills are listed', ob.skills.join(','));
  ok(ob.spouses.indexOf(p.name) >= 0, 'surviving spouse is named');
  ok(ob.children.indexOf('Ryn') >= 0, 'surviving child is named');
  ok(/fell to/.test(ob.text) && /Ryn/.test(ob.text), 'the eulogy names the killer and the child');
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
