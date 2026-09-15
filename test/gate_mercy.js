'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const C3 = ADV.Campaign3;

function game(seed) {
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed, name: 'Ward', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'aimed_shot', 'cleave'] });
  const p = ADV.Game.player(g);
  p.inventory.gold = 5000;
  p.homeId = 'brick';
  g.tutorial = { step: 'done' };
  return g;
}

console.log('-- early Gate foes --');
{
  const g = game(61);
  ADV.Difficulty.set(g, 'easy');
  const q1 = C3.buildQuest(g, 1);
  const easy = ADV.Campaign.spawnEncounter(g, q1, 0);
  ok(easy.length && easy.every(ch => ch.c3FoeDmg === 0.7), 'easy Q1 foes deal 70%');
  ADV.Difficulty.set(g, 'normal');
  const normal = ADV.Campaign.spawnEncounter(g, q1, 1);
  ok(normal.every(ch => ch.c3FoeDmg === 0.7), 'normal Q1 foes deal 70%');
  ADV.Difficulty.set(g, 'hard');
  const hard = ADV.Campaign.spawnEncounter(g, q1, 2);
  ok(hard.every(ch => ch.c3FoeDmg === 1), 'hard Q1 keeps full output');
  ADV.Difficulty.set(g, 'easy');
  const later = ADV.Campaign.spawnEncounter(g, C3.buildQuest(g, 3), 0);
  ok(later.every(ch => ch.c3FoeDmg === 1), 'easy Q3 is full output');
  const foe = Object.assign({}, easy[0]);
  const before = 40;
  const after = Math.max(ADV.DATA.CONST.MIN_DAMAGE, Math.round(before * foe.c3FoeDmg));
  eq(after, 28, '70% of a 40-point blow is 28');
}

console.log('\n-- solo flee --');
{
  const p = ADV.Character.base({ stats: { hp: 80, atk: 8, def: 8, spd: 1 }, isPlayer: true });
  const foe = ADV.Character.base({ stats: { hp: 80, atk: 8, def: 8, spd: 20 } });
  const st = ADV.Combat.create([p], [foe], { rng: new ADV.RNG(1) });
  const u = st.units.find(x => x.ch === p);
  eq(ADV.Combat.fleeChance(st, u), 1, 'solo flee is certain');
  const r = ADV.Combat.act(st, u, { kind: 'flee' });
  ok(r.fled && u.fled, 'a slow solo fighter still gets away');
  const ally = ADV.Character.base({ stats: { hp: 80, atk: 8, def: 8, spd: 1 } });
  const st2 = ADV.Combat.create([p, ally], [foe], { rng: new ADV.RNG(1) });
  const u2 = st2.units.find(x => x.ch === p);
  ok(ADV.Combat.fleeChance(st2, u2) < 1, 'flee is a roll when someone else is still standing');
}

console.log('\n-- Gate wipe is a retreat --');
{
  const g = game(62);
  ADV.Difficulty.set(g, 'easy');
  const p = ADV.Game.player(g);
  const q = C3.buildQuest(g, 1);
  ok(ADV.Game.startQuest(g, q, {}).ok, 'Q1 starts');
  ADV.Game.currentEncounter(g);
  const st = ADV.Game.startCombat(g, false);
  const u = st.units.find(x => x.ch === p);
  u.downed = true; u.chp = 0; p.combatHp = 0;
  st.winner = 'b'; st.over = true;
  const r = ADV.Game.finishCombat(g);
  ok(!r.playerDead && g.quest.fled && g.quest.failed && !g.quest.playerDead, 'a Gate wipe is a flee, not a death');
  ok(p.alive && p.combatHp >= 1, 'the ward is on their feet for the walk home');
}

console.log('\n-- a regular contract still kills --');
{
  const g = game(63);
  const p = ADV.Game.player(g);
  const q = { ...g.board.find(x => x.track === 'solo' && !x.isBoss) };
  q.encounters = q.encounters.slice(0, 1);
  ok(ADV.Game.startQuest(g, q, {}).ok, 'a board contract starts');
  ADV.Game.currentEncounter(g);
  const st = ADV.Game.startCombat(g, false);
  const u = st.units.find(x => x.ch === p);
  u.downed = true; u.chp = 0; p.combatHp = 0;
  st.winner = 'b'; st.over = true;
  const r = ADV.Game.finishCombat(g);
  ok(r.playerDead && g.quest.playerDead, 'a regular wipe is still death');
}

console.log('\n-- courtesy gold --');
{
  const g = game(70);
  const p = ADV.Game.player(g);
  const before = p.inventory.gold;
  ok(ADV.Game.grantCourtesyGold(g), 'the first load pays the apology');
  eq(p.inventory.gold, before + 10000, 'ten thousand gold');
  ok(g.meta.grantGold10000 && !g.meta.courtesyGoldNotice, 'the grant is recorded without the retired courtesy notice');
  ok(!ADV.Game.grantCourtesyGold(g), 'it is paid only once');
  eq(p.inventory.gold, before + 10000, 'a second load does not pay again');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
