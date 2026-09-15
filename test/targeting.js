// Player targeting: pick any living foe unless taunted; heals pick any ally.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat;

function field(seed) {
  const rng = new ADV.RNG(seed || 9);
  const healer = ADV.Character.base({ stats: { hp: 200, atk: 14, def: 8, spd: 20 } });
  healer.actives = [
    { skillId: 'mend', level: 1, uses: 0 },
    { skillId: 'regenerate', level: 1, uses: 0 },
    { skillId: 'guardian_ward', level: 1, uses: 0 },
    { skillId: 'fire_bolt', level: 1, uses: 0 },
    { skillId: 'shield_wall', level: 1, uses: 0 },
    { skillId: 'venom_fang', level: 1, uses: 0 },
  ];
  const ally = ADV.Character.base({ stats: { hp: 180, atk: 10, def: 10, spd: 8 } });
  const e1 = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const e2 = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const e3 = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([healer, ally], [e1, e2, e3], { rng });
  const uh = st.units.find(u => u.ch === healer);
  const ua = st.units.find(u => u.ch === ally);
  const foes = st.units.filter(u => u.side !== uh.side && !u.downed);
  foes.forEach(f => { f.evade = 0; });
  Cb.currentTurn(st);
  return { st, uh, ua, foes };
}

function damageOn(st, uid, from) {
  return st.events.slice(from).filter(e => e.t === 'damage' && e.uid === uid);
}
function healsOn(st, uid, from) {
  return st.events.slice(from).filter(e => e.t === 'heal' && e.uid === uid);
}

console.log('-- picker stays open except taunt / self / party --');
{
  const { st, uh, ua, foes } = field(2);
  const mendPool = Cb.playerTargets(st, uh, 'mend', false);
  ok(mendPool.includes(uh) && mendPool.includes(ua), 'mend pool includes self and the ally');
  ok(!Cb.skillAutocasts(uh, { skillId: 'mend', off: false, pool: mendPool }), 'mend does not auto-cast on self');
  const boltPool = Cb.playerTargets(st, uh, 'fire_bolt', false);
  ok(boltPool.length === foes.length && foes.every(f => boltPool.includes(f)), 'fire bolt offers every living foe');
  ok(!Cb.skillAutocasts(uh, { skillId: 'fire_bolt', off: false, pool: boltPool }), 'fire bolt waits for a click');
  const atkPool = Cb.playerTargets(st, uh, 'basic_attack', false);
  ok(atkPool.length === foes.length, 'Attack offers every living foe, not just melee reach');
  ok(!Cb.skillAutocasts(uh, { skillId: 'basic_attack', off: false, isAttack: true, pool: atkPool }), 'Attack does not default to one foe');
  const wallPool = Cb.playerTargets(st, uh, 'shield_wall', false);
  ok(Cb.skillAutocasts(uh, { skillId: 'shield_wall', off: false, pool: wallPool }), 'self skills still fire without a pick');
}

console.log('-- chosen ally receives the heal / ward / regenerate --');
{
  const { st, uh, ua } = field(3);
  ua.chp = Math.round(ua.maxHp * 0.2);
  uh.chp = uh.maxHp;
  const n0 = st.events.length;
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'mend', targetUid: ua.uid });
  ok(r.ok && healsOn(st, ua.uid, n0).length && !healsOn(st, uh.uid, n0).length, 'mend lands on the clicked ally, not the caster');
}
{
  const { st, uh, ua } = field(4);
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua.uid });
  ok(r.ok && ua.statuses.some(s => s.kind === 'hot') && !uh.statuses.some(s => s.kind === 'hot'), 'regenerate HoT sits on the clicked ally');
}
{
  const { st, uh, ua } = field(5);
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'guardian_ward', targetUid: ua.uid });
  ok(r.ok && ua.statuses.some(s => s.kind === 'ward') && !uh.statuses.some(s => s.kind === 'ward'), 'guardian ward sits on the clicked ally');
}

console.log('-- chosen enemy is hit; taunt is the only lock --');
{
  const { st, uh, foes } = field(6);
  const back = foes.find(f => f.lane === 'back') || foes[foes.length - 1];
  const front = foes.find(f => f !== back) || foes[0];
  const n0 = st.events.length;
  const r = Cb.act(st, uh, { kind: 'attack', targetUid: back.uid });
  ok(r.ok && damageOn(st, back.uid, n0).length && !damageOn(st, front.uid, n0).length, 'Attack hits the clicked foe, even off the front row');
}
{
  const { st, uh, foes } = field(7);
  const a = foes[0], b = foes[1];
  const n0 = st.events.length;
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'fire_bolt', targetUid: b.uid });
  ok(r.ok && damageOn(st, b.uid, n0).length && !damageOn(st, a.uid, n0).length, 'fire bolt hits the clicked foe');
}
{
  const { st, uh, foes } = field(8);
  const marker = foes[0], other = foes[1];
  uh.marksBy.push(marker.uid);
  marker.statuses.push({ kind: 'taunted', srcUid: marker.uid, rounds: 2 });
  const pool = Cb.playerTargets(st, uh, 'fire_bolt', false);
  ok(pool.length === 1 && pool[0] === marker, 'taunt shrinks the player pool to the marker');
  ok(Cb.skillAutocasts(uh, { skillId: 'fire_bolt', off: false, pool }), 'taunt is the case that auto-aims');
  const n0 = st.events.length;
  Cb.act(st, uh, { kind: 'skill', skillId: 'fire_bolt', targetUid: other.uid });
  ok(damageOn(st, marker.uid, n0).length && !damageOn(st, other.uid, n0).length, 'taunt overrides a click on someone else');
}

console.log('-- hostile skills still refuse the caster and allies --');
{
  const { st, uh, ua, foes } = field(9);
  const n0 = st.events.length;
  Cb.act(st, uh, { kind: 'skill', skillId: 'venom_fang', targetUid: uh.uid });
  const foeHit = foes.some(f => f.statuses.some(s => s.kind === 'poison'));
  ok(foeHit && !uh.statuses.some(s => s.kind === 'poison') && !ua.statuses.some(s => s.kind === 'poison'), 'venom aimed at self still poisons a foe');
  ok(st.events.slice(n0).some(e => e.t === 'use'), 'the skill still fires');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
