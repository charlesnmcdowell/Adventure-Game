// Difficulty settings: easy is the previous normal; normal is the previous hard;
// hard steps further — more bodies, earlier veterans, less rest.
'use strict';
const { load, memBackend, checkScriptOrder } = require('./harness');
const ADV = load();
const Df = ADV.Difficulty;
const D = ADV.DATA;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function fresh(seed, skills) {
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed, name: 'Diff', sex: 'f', portraitSlot: 1, portraitSeed: seed, startingSkills: skills || ['momentum', 'cleave', 'sunder'] });
  ADV.Game.player(g).inventory.gold = 1000;                                  // fares and childcare never block a start
  return g;
}

console.log('-- data --');
ok(checkScriptOrder().ok, 'index.html and the harness load the same core files in the same order');
eq(Df.ORDER.join(), 'easy,normal,hard', 'three levels');
for (const id of Df.ORDER) ok(Df.LEVELS[id].name && Df.LEVELS[id].blurb && Df.LEVELS[id].tagline, id + ' has a name, tagline and blurb');
const E = Df.LEVELS.easy, N = Df.LEVELS.normal, H = Df.LEVELS.hard;
eq(E.playerHp, 1.5, 'easy keeps the half-again health buffer');
eq(E.extraFoes, 1, 'easy fields one extra enemy (what normal used to)');
eq(E.foeLevel, 2, 'easy veterans are two levels up');
ok(E.foeSkillFloor === 10 && E.basicHitCap > 0 && E.recoverPct === 0.35 && E.payBonus === 50 && E.autoStopPct === 0.3, 'easy matches the previous normal');
ok(N.extraFoes >= 1 && H.extraFoes > N.extraFoes, 'normal and hard add enemies, hard more');
ok(N.foeLevel >= 1 && H.foeLevel > N.foeLevel, 'normal and hard field veterans, hard more so');
ok(E.playerHp > N.playerHp && N.playerHp >= H.playerHp && H.playerHp === 1, 'the health buffer shrinks to nothing');
ok(E.recoverPct > N.recoverPct && N.recoverPct > H.recoverPct, 'less rest between fights');
ok(E.payBonus > N.payBonus && N.payMult >= H.payMult && H.payMult < 1, 'pay shrinks on the harder roads');
ok(E.autoStopPct > N.autoStopPct && H.autoStopPct === 0, 'the safety stop lowers, then goes');
ok(!/shame|lesser|baby|coward/i.test(E.blurb + E.tagline), 'easy is described as a road, not a penalty');

console.log('\n-- the setting follows the player --');
{
  const g = fresh(3);
  eq(Df.id(), 'easy', 'a new game starts on easy');
  Df.set(g, 'hard');
  eq(g.meta.difficulty, 'hard', 'written to meta');
  ADV.Save.saveGame(g);
  const g2 = ADV.Save.loadGame();
  eq(Df.id(), 'hard', 'a loaded game binds the saved setting');
  eq(ADV.Save.loadMeta().difficulty, 'hard', 'meta on disk carries it');
  const g3 = ADV.Game.newGame({ seed: 4, name: 'Next', sex: 'm', portraitSlot: 1, portraitSeed: 4, startingSkills: ['momentum', 'cleave', 'sunder'] });
  eq(Df.id(), 'hard', 'a new life keeps it');
  eq(Df.set(g3, 'nonsense'), 'hard', 'an unknown id is ignored');
  Df.set(g3, 'easy');
  eq(Df.id(), 'easy', 'and it can be set back');
  void g2;
}

console.log('\n-- player health buffer --');
{
  const g = fresh(5);
  const p = ADV.Game.player(g);
  const base = p.stats.hp;
  Df.set(g, 'easy'); eq(ADV.Character.maxHp(p), Math.round(base * 1.5), 'easy: half again');
  Df.set(g, 'normal'); eq(ADV.Character.maxHp(p), base, 'normal: natural');
  Df.set(g, 'hard'); eq(ADV.Character.maxHp(p), base, 'hard: natural');
  // switching re-fits current health to the same fraction
  Df.set(g, 'easy'); p.combatHp = Math.round(ADV.Character.maxHp(p) * 0.5);
  Df.set(g, 'hard');
  ok(Math.abs(p.combatHp / ADV.Character.maxHp(p) - 0.5) < 0.02 && p.combatHp <= ADV.Character.maxHp(p), 'switching keeps the same health fraction, never over full');
  Df.set(g, 'easy');
}

console.log('\n-- enemies: more, better, a little stronger --');
{
  const g = fresh(6);
  const rng = ADV.rngFromString('diff');
  Df.set(g, 'easy');
  const e1 = ADV.Character.makeEnemy(ADV.rngFromString('m'), 'bandit', { level: 4, world: g.world });
  Df.set(g, 'hard');
  const e2 = ADV.Character.makeEnemy(ADV.rngFromString('m'), 'bandit', { level: 4, world: g.world });
  ok(Df.isFoe(e1) && Df.isFoe(e2), 'stock enemies are foes');
  const baseLvl = e2.__kit0 ? e2.__kit0.enemyLevel : e1.__kit0.enemyLevel;
  const lift = l => Math.max(l + H.foeLevel, (baseLvl >= (H.foeSkillFloorFrom || 0) ? (H.foeSkillFloor || 0) : 0));
  eq(e2.enemyLevel, baseLvl + H.foeLevel, 'hard: a veteran, levels up by the offset');
  ok(e2.actives.every((a, i) => a.level === lift(e2.__kit0.actives[i].level)), 'hard: every skill climbs by the offset, or to the floor');
  ok(e2.actives.every(a => a.level >= ADV.DATA.CONST.TIER_THRESHOLDS.intermediate), 'hard: every kit is at least intermediate');
  // The kit floor raises how well an enemy fights, never what it is. It once lifted
  // enemyLevel too, which turned a first-contract wolf into a level-10 one.
  ok(e2.enemyLevel === baseLvl + H.foeLevel,
    'hard: the kit floor never inflates the creature\'s own level', 'lvl ' + baseLvl + ' -> ' + e2.enemyLevel);
  ok(e2.perks.length > (e2.__kit0.perks || []).length || e2.perks.length > 0, 'hard: a tier-1 mook brings its perks');
  ok(ADV.Character.effStat(e2, 'atk') >= Math.round(e2.stats.atk * H.foeAtk) - 1 && ADV.Character.maxHp(e2) >= Math.round(e2.stats.hp * H.foeHp) - 1, 'hard: the stat edge applies');
  Df.set(g, 'easy');
  eq(ADV.Character.effStat(e2, 'atk'), e2.stats.atk, 'back on easy the same unit reads its plain stats');
  // allies that began as monsters are never scaled
  const c = ADV.Character.makeEnemy(ADV.rngFromString('c'), 'bandit', { level: 4, world: g.world });
  c.isConscript = true; c.conscriptorId = ADV.Game.player(g).id;
  Df.set(g, 'hard');
  eq(ADV.Character.effStat(c, 'atk'), c.stats.atk, 'a conscript is not scaled');
  const r = ADV.Character.makeEnemy(ADV.rngFromString('r'), 'bandit', { level: 4, world: g.world });
  r.raisedById = 'x'; r.isUndead = true;
  eq(ADV.Character.effStat(r, 'atk'), Math.round(r.stats.atk * (D.CONST.UNDEAD_STAT_MULT || 1.5)), 'the risen are not scaled');
  Df.set(g, 'easy');
  void rng;
}
{
  // reinforcements: copies of the encounter's own kinds, capped by the company size
  const g = fresh(7);
  const p = ADV.Game.player(g), w = g.world;
  const party = ADV.Party.create(w, p.id);
  for (const c of w.characters.filter(c => c.alive && !c.isPlayer && !c.partyId && !c.isMonster).slice(0, 3)) { party.memberIds.push(c.id); party.wages[c.id] = 0; c.partyId = party.id; c.leaderId = p.id; }
  const q = g.board.find(x => x.track === 'party' && !x.isBoss);
  const count = (id) => { Df.set(g, id); ADV.Game.startQuest(g, q, {}); const enc = ADV.Game.currentEncounter(g); const n = enc.enemies.length; const kinds = new Set(enc.enemies.map(e => e.enemyTypeId)); const extras = enc.enemies.filter(e => e.reinforcement); g.quest = null; return { n, kinds, extras }; };
  const a = count('easy'), b = count('normal'), c = count('hard');
  eq(a.extras.length, E.extraFoes, 'easy: the extra enemies the previous normal fielded');
  eq(b.n, a.n + (N.extraFoes - E.extraFoes), 'normal: more enemies than easy');
  eq(c.n, a.n + (H.extraFoes - E.extraFoes), 'hard: more still');
  ok(c.extras.every(e => a.kinds.has(e.enemyTypeId)), 'the extras are the encounter\'s own kinds');
  // __toughened was a one-shot flag; toughening is now re-derived from __kit0 every time the
  // setting changes, so the mark that a creature has been through it is the recorded original.
  ok(c.extras.every(e => !e.boss && Df.isFoe(e) && e.__kit0 && e.enemyLevel > e.__kit0.enemyLevel), 'extras are veterans, never bosses');
  Df.set(g, 'easy');
}
{
  const g = fresh(8);
  const q = g.board.find(x => x.track === 'solo' && !x.isBoss);
  Df.set(g, 'hard'); ADV.Game.startQuest(g, q, {});
  const enc = ADV.Game.currentEncounter(g);
  ok(!enc.enemies.some(e => e.reinforcement), 'a lone player is never swarmed: no adds on solo work');
  ok(enc.enemies.every(e => e.__kit0 && e.enemyLevel > e.__kit0.enemyLevel), 'but the solo enemies are veterans');
  g.quest = null; Df.set(g, 'easy');
}
{
  // the campaign: extras exist, are silent like the rest, and never join a lone-boss fight
  const g = fresh(9);
  const C3 = ADV.Campaign3;
  Df.set(g, 'hard');
  C3.debugJump(g, 4); C3.state(g).company = ['wren_ward', 'selene'].filter(id => C3.isRecruited(g, id));
  ADV.Game.startQuest(g, C3.buildQuest(g, 4), {});
  const enc = ADV.Game.currentEncounter(g);
  const extras = enc.enemies.filter(e => e.reinforcement);
  ok(extras.length === Math.min(H.extraFoes, ADV.Game.partyRoster(g).length - 1) && extras.length > 0, 'a campaign fight with company gets its adds (' + extras.length + ')');
  ok(extras.every(e => e.noCombatVoice && !e.personalityId), 'campaign adds are as silent as the rest');
  g.quest = null;
  ADV.Game.startQuest(g, C3.buildQuest(g, 14), {});
  ADV.Game.currentEncounter(g); g.quest.encIdx = 2; g.quest.enemies = null;
  const altar = ADV.Game.currentEncounter(g);
  const named = altar.enemies.filter(e => e.reinforcement);
  ok(named.every(e => e.enemyTypeId !== 'korvath'), 'Kolade is never copied');
  g.quest = null; Df.set(g, 'easy');
}

console.log('\n-- rest, pay, safety stop --');
{
  const g = fresh(10);
  const p = ADV.Game.player(g);
  const check = (id, pct) => { Df.set(g, id); p.combatHp = 10; ADV.Combat.applyPostVictoryRecovery([p]); const max = ADV.Character.maxHp(p); eq(p.combatHp, Math.min(max, 10 + Math.round(max * pct)), id + ': ' + Math.round(pct * 100) + '% back after a win'); };
  check('easy', 0.35); check('normal', 0.2); check('hard', 0.1);
  Df.set(g, 'easy'); eq(Df.pay(300), 350, 'easy: +50 a contract');
  Df.set(g, 'normal'); eq(Df.pay(300), Math.round(300 * 0.85), 'normal: no bonus and 85%');
  Df.set(g, 'hard'); eq(Df.pay(300), Math.round(300 * 0.7), 'hard: no bonus and 70%');
  const built = ADV.BalanceSupport.quest({ track: 'solo', payout: 200 });
  eq(built.payout, Df.pay(200), 'quest builders pay by the setting');
  eq(Df.autoStopPct(), 0, 'hard: auto never stops itself');
  ok(!Df.fleeWarn(), 'hard: no flee warning');
  Df.set(g, 'easy'); eq(Df.autoStopPct(), 0.3, 'easy: stops below 30%');
  Df.set(g, 'easy');
  eq(ADV.Campaign3.earlyFoeDmg(g, { campaign3: true, n: 1 }), 0.7, 'easy: the first two Gate quests still hit softer');
  Df.set(g, 'normal');
  eq(ADV.Campaign3.earlyFoeDmg(g, { campaign3: true, n: 1 }), 1, 'normal: the Gate opens at full strength');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
