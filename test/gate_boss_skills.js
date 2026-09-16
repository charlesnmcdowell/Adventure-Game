// Kolade's three set-pieces in the Iron War finale: the front-rank sweep he carries all
// through the temple, the stronger sweep once he is Unbound, and the challenge he makes to
// the biggest body on the field. All three are written as a share of a target's maximum
// health, so the test measures shares, not power numbers.
'use strict';
const assert = require('node:assert/strict'), { load, memBackend } = require('./harness');
const A = load(), C = A.Campaign3, S = A.DATA.SKILLS;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function fresh() {
 A.Save.setBackend(memBackend());
 const g = A.Game.newGame({ seed: 4401, name: 'Ward', sex: 'f' });
 g.player.inventory.gold = 50000; C.debugJump(g, 14);
 assert.ok(A.Game.startQuest(g, C.buildQuest(g, 14), {}).ok);
 return g;
}

console.log('-- the skills themselves --');
for (const id of ['reaving_arc', 'unbound_arc', 'the_strongest_among_you']) {
 const sk = S[id];
 ok(!!sk, id + ' is defined');
 ok(sk.unique && sk.noSlot && sk.noTierGrowth, id + ' is boss-only: no slot, no pool, no tier growth');
 ok(A.SkillSys.mechKey(sk) === null, id + ' never twins with a learnable skill');
 ok(!!sk.signature && !!sk.cooldown, id + ' is a signature move on a cooldown');
}
eq(S.reaving_arc.pctMaxHp, 0.20, 'the arc takes a fifth of maximum health');
eq(S.reaving_arc.cooldown, 3, 'the arc comes round every three rounds');
eq(S.reaving_arc.target, 'enemyFront', 'the arc sweeps the front rank');
eq(S.unbound_arc.pctMaxHp, 0.40, 'the unbound arc takes two fifths');
eq(S.unbound_arc.cooldown, 3, 'the unbound arc also comes round every three rounds');
eq(S.unbound_arc.target, 'enemyFront', 'the unbound arc sweeps the front rank');
eq(S.the_strongest_among_you.pctMaxHp, 0.75, 'the challenge takes three quarters');
eq(S.the_strongest_among_you.cooldown, 5, 'the challenge comes round every five rounds');
ok(S.the_strongest_among_you.targetHighestHp, 'the challenge picks the biggest body itself');

// No learnable pool, trainer offer or gear set may reach them.
{
 const reachable = new Set();
 for (const sk of Object.values(S)) for (const id of (sk.extraSkills || [])) reachable.add(id);
 for (const set of Object.values(A.DATA.GEAR_SETS || {})) for (const id of (set.extraSkills || [])) reachable.add(id);
 for (const id of ['reaving_arc', 'unbound_arc', 'the_strongest_among_you']) ok(!reachable.has(id), id + ' is not granted by any gear set');
 const rng = new A.RNG(7);
 const p = A.Character.makePlayer(rng, { name: 'Pool', sex: 'f', startingSkills: ['momentum', 'cleave'] });
 const pool = A.SkillSys.learnable ? A.SkillSys.learnable(p) : null;
 if (pool) for (const id of ['reaving_arc', 'unbound_arc', 'the_strongest_among_you']) ok(!pool.some(x => (x.id || x) === id), id + ' is not in the learnable pool');
}

console.log('\n-- the lines --');
{
 const lines = A.DATA.CAMPAIGN3_DIALOGUE.gate.korvath;
 const text = k => (lines[k] || []).map(l => l.t).join(' ');
 ok(text('q14_boss_challenge').includes('I will challenge the strongest among you'), 'he announces the challenge');
 ok(text('q14_boss_survived').includes('You will not stop me, you will join our sister and the rest'), 'the line for a target who lives');
 ok(!/sibling/i.test(text('q14_boss_survived')), 'the survive line does not say sibling');
 ok(text('q14_boss_killed').includes('One more murder, one more sacrifice on my road to God Hood'), 'the line for a target who does not');
 const say = S.the_strongest_among_you.say;
 ok(say.on === 'q14_boss_challenge' && say.survived === 'q14_boss_survived' && say.killed === 'q14_boss_killed',
  'the skill is wired to all three lines');
}

console.log('\n-- who carries what --');
{
 const g = fresh(); g.quest.encIdx = 2;
 const mortal = A.Game.currentEncounter(g).enemies.find(ch => ch.campaignId === 'korvath');
 ok(!!mortal, 'Kolade stands in the temple');
 const ids = mortal.actives.map(e => e.skillId);
 ok(ids.includes('reaving_arc'), 'the temple Kolade carries the arc');
 ok(!ids.includes('unbound_arc') && !ids.includes('the_strongest_among_you'), 'and neither of the ascended moves');

 const g2 = fresh(); g2.quest.encIdx = 3; A.GateFinale.takeSoul(g2);
 const unbound = A.Game.currentEncounter(g2).enemies.find(ch => ch.gateAscendant);
 ok(!!unbound, 'Kolade the Unbound stands in the realm');
 const uids = unbound.actives.map(e => e.skillId);
 ok(uids.includes('unbound_arc'), 'the Unbound carries the stronger arc');
 ok(uids.includes('the_strongest_among_you'), 'the Unbound carries the challenge');
 ok(!uids.includes('reaving_arc'), 'and no longer the weaker one');
}

// ------------------------------------------------------------------ mechanics
function field(bossCh, hps) {
 const rng = new A.RNG(99);
 const party = hps.map((hp, i) => A.Character.makeEnemy(rng, 'bandit', { level: 12 }));
 const st = A.Combat.create(party, [bossCh], { rng });
 const mine = st.units.filter(u => u.side === 'a');
 // Lanes and health are set by hand so the assertions are about the skill, not the layout.
 const lanes = ['front', 'front', 'mid', 'back'];
 mine.forEach((u, i) => { u.lane = lanes[i] || 'back'; u.maxHp = hps[i]; u.chp = hps[i]; u.tempHp = 0; });
 return { st, mine, boss: st.units.find(u => u.side === 'b') };
}
function bossFrom(g) {
 return A.Game.currentEncounter(g).enemies.find(ch => ch.campaignId === 'korvath');
}

console.log('\n-- the arc sweeps the front rank --');
{
 const g = fresh(); g.quest.encIdx = 2;
 const { st, mine, boss } = field(bossFrom(g), [400, 900, 500, 600]);
 // Aimed deliberately at the back line: the sweep must still take the front rank.
 const r = A.Combat.act(st, boss, { kind: 'skill', skillId: 'reaving_arc', targetUid: mine[3].uid });
 ok(r.ok, 'the arc resolves even when the named target is at the back');
 eq(mine[0].maxHp - mine[0].chp, 80, 'the smaller front-liner loses a fifth of its own maximum (400)');
 eq(mine[1].maxHp - mine[1].chp, 180, 'the larger front-liner loses a fifth of its own maximum (900)');
 eq(mine[2].chp, 500, 'the middle rank is untouched');
 eq(mine[3].chp, 600, 'the back rank is untouched');
 eq(A.Combat.cooldownLeft(boss, 'reaving_arc'), 3, 'three rounds before it comes round again');
 const denied = A.Combat.act(st, boss, { kind: 'skill', skillId: 'reaving_arc', targetUid: mine[0].uid });
 ok(!denied.ok, 'it cannot be used again while it is recovering');
 const until = st.round + 3;
 while (st.round < until && A.Combat.currentTurn(st)) A.Combat.advance(st);
 eq(A.Combat.cooldownLeft(boss, 'reaving_arc'), 0, 'and is back after three rounds');
}

console.log('\n-- an empty front rank does not waste the turn --');
{
 const g = fresh(); g.quest.encIdx = 2;
 const { st, mine, boss } = field(bossFrom(g), [400, 900, 500, 600]);
 mine[0].downed = true; mine[0].chp = 0; mine[1].downed = true; mine[1].chp = 0;
 const r = A.Combat.act(st, boss, { kind: 'skill', skillId: 'reaving_arc', targetUid: mine[3].uid });
 ok(r.ok, 'the arc still resolves');
 eq(mine[2].maxHp - mine[2].chp, 100, 'it falls on the frontmost rank still standing');
 eq(mine[3].chp, 600, 'and no further back than that');
}

console.log('\n-- the unbound arc is the same sweep, twice as deep --');
{
 const g = fresh(); g.quest.encIdx = 3; A.GateFinale.takeSoul(g);
 const unbound = A.Game.currentEncounter(g).enemies.find(ch => ch.gateAscendant);
 const { st, mine, boss } = field(unbound, [400, 900, 500, 600]);
 A.Combat.act(st, boss, { kind: 'skill', skillId: 'unbound_arc', targetUid: mine[2].uid });
 eq(mine[0].maxHp - mine[0].chp, 160, 'two fifths of 400');
 eq(mine[1].maxHp - mine[1].chp, 360, 'two fifths of 900');
 eq(mine[2].chp, 500, 'still only the front rank');
 eq(A.Combat.cooldownLeft(boss, 'unbound_arc'), 3, 'every three rounds');
}

console.log('\n-- the challenge finds the strongest, and says so --');
{
 const g = fresh(); g.quest.encIdx = 3; A.GateFinale.takeSoul(g);
 const unbound = A.Game.currentEncounter(g).enemies.find(ch => ch.gateAscendant);
 const { st, mine, boss } = field(unbound, [400, 900, 500, 600]);
 // The biggest body is at the front; a taunt from someone else must not redirect it.
 mine[3].marksBy = []; boss.marksBy = [mine[2].uid];
 mine[2].statuses.push({ kind: 'taunted', srcUid: mine[2].uid, rounds: 3 });
 st.events.length = 0;
 const r = A.Combat.act(st, boss, { kind: 'skill', skillId: 'the_strongest_among_you', targetUid: mine[0].uid });
 ok(r.ok, 'the challenge resolves');
 eq(mine[1].maxHp - mine[1].chp, 675, 'three quarters of the largest maximum (900)');
 ok(mine[0].chp === 400 && mine[2].chp === 500 && mine[3].chp === 600, 'nobody else is touched');
 eq(A.Combat.cooldownLeft(boss, 'the_strongest_among_you'), 5, 'every five rounds');
 const beats = st.events.filter(e => e.t === 'campaignBanter').map(e => e.beat);
 eq(beats.length, 2, 'he speaks twice: the challenge, then the outcome');
 eq(beats[0].key, 'q14_boss_challenge', 'the challenge comes first');
 eq(beats[1].key, 'q14_boss_survived', 'the target lived, so he promises the altar');
 ok(beats.every(b => b.who === 'korvath' && b.fid === 'gate' && b.combat && b.c3), 'both beats address the company mid-combat');
 ok(beats.every(b => (A.DATA.CAMPAIGN3_DIALOGUE.gate[b.who] || {})[b.key]), 'both beats resolve to written lines');
}

console.log('\n-- and the other line when it kills --');
{
 const g = fresh(); g.quest.encIdx = 3; A.GateFinale.takeSoul(g);
 const unbound = A.Game.currentEncounter(g).enemies.find(ch => ch.gateAscendant);
 const { st, mine, boss } = field(unbound, [400, 900, 500, 600]);
 mine[1].chp = 100;                                       // the strongest is already hurt
 st.events.length = 0;
 A.Combat.act(st, boss, { kind: 'skill', skillId: 'the_strongest_among_you', targetUid: mine[0].uid });
 ok(mine[1].downed, 'the challenge still measures the health they were built for, and it kills');
 const beats = st.events.filter(e => e.t === 'campaignBanter').map(e => e.beat);
 eq(beats[1].key, 'q14_boss_killed', 'he counts the sacrifice');
}

console.log('\n-- armour does not answer a share of your own health --');
{
 const g = fresh(); g.quest.encIdx = 2;
 const { st, mine, boss } = field(bossFrom(g), [400, 900, 500, 600]);
 mine[0].armorBonus = 500; mine[0].ch.bonusStats = Object.assign({}, mine[0].ch.bonusStats, { def: 200 });
 A.Combat.act(st, boss, { kind: 'skill', skillId: 'reaving_arc', targetUid: mine[0].uid });
 eq(mine[0].maxHp - mine[0].chp, 80, 'a wall of Defence still loses a fifth');
}

console.log('\n-- the AI reaches for it the moment it is available --');
{
 const g = fresh(); g.quest.encIdx = 2;
 const { st, mine, boss } = field(bossFrom(g), [400, 900, 500, 600]);
 let used = 0;
 for (let i = 0; i < 60; i++) {
  const plan = A.Combat.planFor(st, boss);
  if (plan && plan.skillId === 'reaving_arc') used++;
 }
 eq(used, 60, 'the arc is what the boss does the round it is available');
 // And once it is spent, he goes back to fighting normally rather than stalling on it.
 A.Combat.act(st, boss, { kind: 'skill', skillId: 'reaving_arc', targetUid: mine[0].uid });
 const after = A.Combat.planFor(st, boss);
 ok(after && after.skillId !== 'reaving_arc', 'while it recovers he uses the rest of his kit');
}

console.log('\n-- the rarest set-piece takes precedence --');
{
 const g = fresh(); g.quest.encIdx = 3; A.GateFinale.takeSoul(g);
 const unbound = A.Game.currentEncounter(g).enemies.find(ch => ch.gateAscendant);
 const { st, mine, boss } = field(unbound, [400, 900, 500, 600]);
 eq(A.Combat.planFor(st, boss).skillId, 'the_strongest_among_you', 'the challenge goes first when both are ready');
 A.Combat.act(st, boss, { kind: 'skill', skillId: 'the_strongest_among_you', targetUid: mine[1].uid });
 eq(A.Combat.planFor(st, boss).skillId, 'unbound_arc', 'then the sweep');
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' : 'PASSED all ') + (pass + fail) + ' checks');
process.exit(fail ? 1 : 0);
