// Captain of the Tower: Shield Wall used to hold a 0-HP (or empty-looking)
// body upright because a full-negate self-guard returned before the lethal check.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }

const mk = (o) => ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 40, def: 2, spd: 10 } }, o));
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }
function wall(st, u) {
  ADV.Combat._internals.addStatus(st, u, { kind: 'guard', scope: 'lane', rounds: 1, absorb: 1 });
}
function hit(st, src, tgt, amount) {
  tgt.evade = 0;
  tgt.statuses = (tgt.statuses || []).filter(s => s.kind !== 'ward' && s.kind !== 'anchor');
  return ADV.Combat._internals.dealDamage(st, src, tgt, amount, 'attack');
}

console.log('\n-- Shield Wall cannot hold an empty body --');
{
  const hero = mk({ name: 'Ward' });
  const cap = mk({ name: 'Captain of the Tower' });
  cap.boss = true;
  give(cap, 'shield_wall', 1);
  const st = fight(hero, cap, 9);
  const uh = unit(st, hero), ut = unit(st, cap);
  wall(st, ut);
  ut.chp = 0;
  hit(st, uh, ut, 80);
  ok(ut.downed && ut.chp === 0, '0 HP behind a self-wall still falls');
}

{
  const hero = mk({ name: 'Ward' });
  const cap = mk({ name: 'Captain of the Tower', stats: { hp: 3500, atk: 20, def: 2, spd: 8 } });
  cap.boss = true;
  give(cap, 'shield_wall', 1);
  const st = fight(hero, cap, 10);
  const uh = unit(st, hero), ut = unit(st, cap);
  wall(st, ut);
  ut.maxHp = 3500;
  ut.chp = 1;
  hit(st, uh, ut, 80);
  ok(ut.downed, 'a 1-HP sliver on a Gate-sized bar is a finishing blow through self-wall');
}

{
  const hero = mk({ name: 'Ward' });
  const cap = mk({ name: 'Captain of the Tower' });
  cap.boss = true;
  give(cap, 'shield_wall', 1);
  const st = fight(hero, cap, 11);
  const uh = unit(st, hero), ut = unit(st, cap);
  const before = ut.chp;
  wall(st, ut);
  const dealt = hit(st, uh, ut, 40);
  ok(!ut.downed && ut.chp === before, 'a healthy self-wall still negates incoming damage');
  ok(dealt === 0, 'the absorbed blow deals no HP', dealt);
}

{
  const hero = mk({ name: 'Ward' });
  const cap = mk({ name: 'Captain of the Tower' });
  const mage = mk({ name: 'Consortium Mage', stats: { hp: 180, atk: 10, def: 2, spd: 8 } });
  cap.boss = true;
  give(cap, 'shield_wall', 1);
  const st = fight(hero, [cap, mage], 12);
  const uh = unit(st, hero), ut = unit(st, cap), um = unit(st, mage);
  ut.lane = um.lane = 'front';
  wall(st, ut);
  const before = um.chp;
  hit(st, uh, um, 40);
  ok(!um.downed && um.chp === before, 'the wall still covers an ally in lane');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
