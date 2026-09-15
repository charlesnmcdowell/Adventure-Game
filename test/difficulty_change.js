// Changing difficulty mid-game has to take effect on the quest the player is standing in,
// not only on the next one they accept — and it has to work in both directions.
//
// Most levers are read live from the table every time they are used, so they follow a change
// for free. Toughening did not: it edited an enemy's levels in place and set a flag so it
// never ran twice, which left anyone already on the board at whatever setting they spawned
// under. An enemy met on Hard stayed Hard after the player dropped to Easy, permanently.
'use strict';
const { load } = require('./harness');
const ADV = load();
globalThis.ADV = ADV;
const Ch = ADV.Character, Df = ADV.Difficulty;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(String(a) === String(b), n, a + ' != ' + b); }

const mem = {};
ADV.Save.setBackend({ get: k => mem[k], set: (k, v) => { mem[k] = v; }, remove: k => { delete mem[k]; } });
const g = ADV.Game.newGame({ seed: 4, name: 'Ward', sex: 'f', portraitSlot: 1, portraitSeed: 4, startingSkills: ['cleave'] });
const p = ADV.Game.player(g);

console.log('-- levers read live, so a change lands at once and reverses --');
{
  const read = () => ({ hp: Ch.maxHp(p), rec: Df.recoverPct(), stop: Df.autoStopPct(),
    pay: Df.pay(100), cap: Df.basicHitCap(), flee: Df.fleeWarn() });
  Df.set(g, 'easy'); const E = read();
  Df.set(g, 'hard'); const H = read();
  Df.set(g, 'easy'); const B = read();
  for (const k of Object.keys(E)) {
    ok(String(E[k]) !== String(H[k]), `${k}: hard differs from easy`, E[k] + ' vs ' + H[k]);
    eq(B[k], E[k], `${k}: switching back restores easy`);
  }
}

console.log('\n-- an enemy already on the board follows the change, both ways --');
{
  const kitOf = e => ({ lvl: e.enemyLevel, kit: (e.actives || []).map(a => a.level).join('/'), perks: (e.perks || []).length });
  const openEncounter = (id) => {
    g.quest = null;
    Df.set(g, id);
    for (const q of (g.board || []).filter(x => !x.isBoss)) {
      const r = ADV.Game.startQuest(g, q, {});
      if (!r || !r.ok) continue;
      ADV.Game.currentEncounter(g);
      if (g.quest && g.quest.enemies && g.quest.enemies.length) return g.quest.enemies[0];
      g.quest = null;
    }
    return null;
  };

  const met = openEncounter('easy');
  ok(!!met, 'met an enemy on an easy contract');
  if (met) {
    const onEasy = kitOf(met);
    ok(met.__kit0 != null, 'the creature remembers what it was before any setting touched it');
    Df.set(g, 'hard');
    const nowHard = kitOf(met);
    ok(nowHard.lvl > onEasy.lvl, 'switching up re-arms it where it stands', onEasy.lvl + ' -> ' + nowHard.lvl);
    ok(nowHard.kit !== onEasy.kit, 'and its kit climbs with it', onEasy.kit + ' -> ' + nowHard.kit);
    Df.set(g, 'easy');
    const backEasy = kitOf(met);
    eq(backEasy.lvl, onEasy.lvl, 'switching back down stands it back to exactly what it was');
    eq(backEasy.kit, onEasy.kit, 'kit too');
    eq(backEasy.perks, onEasy.perks, 'and it hands back any perk the harder setting lent it');
    // and the second round trip must not compound
    Df.set(g, 'hard'); Df.set(g, 'easy');
    eq(kitOf(met).lvl, onEasy.lvl, 'a second round trip does not drift');
    eq(kitOf(met).kit, onEasy.kit, 'nor does the kit');
  }
  g.quest = null;
}

console.log('\n-- a fight already under way keeps the bodies it started with --');
{
  Df.set(g, 'easy');
  let met = null;
  for (const q of (g.board || []).filter(x => !x.isBoss)) {
    const r = ADV.Game.startQuest(g, q, {});
    if (!r || !r.ok) continue;
    ADV.Game.currentEncounter(g);
    if (g.quest && g.quest.enemies && g.quest.enemies.length) { met = g.quest.enemies[0]; break; }
    g.quest = null;
  }
  if (met) {
    ADV.Game.startCombat(g, false);
    const before = met.enemyLevel;
    Df.set(g, 'hard');
    eq(met.enemyLevel, before, 'mid-fight, the enemy in front of you does not change under you');
    ok(g.quest && g.quest.combat, 'because a combat is in progress');
    g.quest = null;
    // ...and the very next encounter does field the new setting
    Df.set(g, 'hard');
    let next = null;
    for (const q of (g.board || []).filter(x => !x.isBoss)) {
      const r = ADV.Game.startQuest(g, q, {});
      if (!r || !r.ok) continue;
      ADV.Game.currentEncounter(g);
      if (g.quest && g.quest.enemies && g.quest.enemies.length) { next = g.quest.enemies[0]; break; }
      g.quest = null;
    }
    ok(next && next.enemyLevel > (next.__kit0 ? next.__kit0.enemyLevel : 0), 'the next fight fields the harder setting');
    g.quest = null;
  } else {
    ok(false, 'could not open an encounter for the mid-fight check');
  }
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
