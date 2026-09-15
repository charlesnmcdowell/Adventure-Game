// Beast Shape is a free stance: auto-applied, stripable, never spends the turn.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }

const mkCh = (o) => ADV.Character.base(Object.assign({ stats: { hp: 100, atk: 20, def: 5, spd: 12 } }, o));
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  if (sk.kind === 'perk') ch.perks.push({ skillId: id, level: level || 1, uses: 0 });
  else ch.actives.push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }
function shaped(u) { return u.statuses.find(s => s.kind === 'beastShape'); }

console.log('\n-- Beast Shape stance --');
const druid = mkCh({ name: 'Druid', archetypeInclination: ['druid'] });
give(druid, 'beast_shape', 1);
const foe = ADV.Character.makeEnemy(new ADV.RNG(2), 'bandit', { level: 3 });
const st = fight(druid, foe, 11);
const ud = unit(st, druid);
const uf = unit(st, foe);
ok(!!shaped(ud), 'applied at battle start');
ok(shaped(ud).mult === 1.25, 'basic form is ATK ×1.25');

const beforeActed = ud.actedThisEncounter;
const res = ADV.Combat.act(st, ud, { kind: 'skill', skillId: 'beast_shape', targetUid: ud.uid });
ok(res && res.refund, 'using it refunds the turn');
ok(ud.actedThisEncounter === beforeActed, 'does not mark the encounter action used');

const hpBefore = uf.chp;
ADV.Combat.act(st, ud, { kind: 'attack', targetUid: uf.uid });
ok(uf.chp < hpBefore, 'a real action still fires on the same turn');
ok(ud.actedThisEncounter, 'the attack spends the turn');

const mage = mkCh({ name: 'Mage', stats: { hp: 80, atk: 10, def: 5, spd: 8 } });
give(mage, 'dispel');
const st2 = fight(mage, druid, 21);
const ud2 = unit(st2, druid);
const um = unit(st2, mage);
ok(!!shaped(ud2), 'up again in a fresh fight');
ADV.Combat.act(st2, um, { kind: 'skill', skillId: 'dispel', targetUid: ud2.uid });
ok(!shaped(ud2), 'Dispel strips the stance');
ok(ADV.Combat.POS_STATUSES.includes('beastShape'), 'counts as a stripable buff, not a perk');

st2.turnIdx = st2.turnQueue.findIndex(e => e.uid === ud2.uid);
const back = ADV.Combat.currentTurn(st2);
ok(back && back.unit === ud2 && !!shaped(ud2), 'reapplied when the shapeshifter\'s turn comes back');

const auto = ADV.Combat.autoReadyAction(st2, ud2);
ok(!auto || auto.action.skillId !== 'beast_shape', 'auto rotation never spends a turn on the stance');

console.log('\n-- Greater Beast / Primal Form --');
const greater = mkCh({ name: 'Greater', archetypeInclination: ['druid'] });
give(greater, 'beast_shape', 10);
const prey = ADV.Character.makeEnemy(new ADV.RNG(4), 'bandit', { level: 2 });
prey.stats.hp = 40;
const st3 = fight(greater, prey, 31);
const ug = unit(st3, greater);
const up = unit(st3, prey);
ok(shaped(ug) && shaped(ug).lifeSteal === 0.3, 'intermediate carries lifesteal on the status');
ug.chp = 40;
const lifeBefore = ug.chp;
ADV.Combat.act(st3, ug, { kind: 'attack', targetUid: up.uid });
ok(ug.chp > lifeBefore, 'Greater Beast heals from damage dealt');

const primal = mkCh({ name: 'Primal', archetypeInclination: ['druid'] });
give(primal, 'beast_shape', 25);
const a = ADV.Character.makeEnemy(new ADV.RNG(5), 'bandit', { level: 2 });
const b = ADV.Character.makeEnemy(new ADV.RNG(6), 'bandit', { level: 2 });
const st4 = fight(primal, [a, b], 41);
const ua = unit(st4, a);
const ub = unit(st4, b);
const up4 = unit(st4, primal);
ua.lane = 'front'; ub.lane = 'front';
ok(shaped(up4) && shaped(up4).splashAdjacent, 'advanced form splashes');
const ha = ua.chp, hb = ub.chp;
ADV.Combat.act(st4, up4, { kind: 'attack', targetUid: ua.uid });
ok(ua.chp < ha && ub.chp < hb, 'Primal Form hits a second enemy in the lane');

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
