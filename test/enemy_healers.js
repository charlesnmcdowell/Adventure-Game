// DOT_PROMPT.md §10: every camp has enemy healers, and they heal.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat, E = ADV.DATA.ENEMIES, S = ADV.DATA.SKILLS;
const restores = (id) => { const d = S[id]; return !!(d && d.heal && (d.power || d.hotRounds || d.healFromTaken || d.revive) && d.target !== 'enemy'); };
const healsAllies = (e) => (e.actives || []).some(restores);

console.log('-- roster --');
for (const camp of ['law', 'criminal', 'wild']) {
  const ids = Object.keys(E).filter(id => E[id].camp === camp && healsAllies(E[id]));
  ok(ids.length >= 2, `${camp}: ${ids.length} healing enemy types (${ids.join(', ')})`);
  ok(ids.every(id => E[id].healer), `${camp}: all of them carry the healer flag`);
}
for (const id of ['field_chaplain', 'cutpurse_leech', 'moss_matron']) ok(!!E[id] && healsAllies(E[id]) && E[id].levels[0] >= 10, `${id} exists, heals, and does not appear before level 10 (tier 2)`);
ok(Object.keys(E).filter(id => E[id].healer).every(id => healsAllies(E[id])), 'the healer flag is never a lie');

console.log('-- encounter weighting --');
{
  const Q = ADV.Quests;
  let withHealer = 0, total = 0, t1 = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const rng = new ADV.RNG(seed);
    const q = Q.make(rng, seed % 2 ? 2 : 3, 'party', 'neutral');
    for (const enc of q.encounters) { if (enc.boss) continue; total++; if (enc.enemyTypeIds.some(id => E[id] && E[id].healer)) withHealer++; }
    const q1 = Q.make(new ADV.RNG(seed + 1000), 1, 'party', 'neutral');
    for (const enc of q1.encounters) if (enc.enemyTypeIds.some(id => ['field_chaplain', 'cutpurse_leech', 'moss_matron'].includes(id))) t1++;
  }
  const frac = withHealer / total;
  ok(frac >= 0.33, `tier 2+ party fights with a healer: ${(frac * 100).toFixed(0)}% (at least 1 in 3)`);
  ok(t1 === 0, `the new healers never appear at tier 1 (${t1})`);
}

console.log('-- the AI heals --');
for (const id of ['field_chaplain', 'cutpurse_leech', 'moss_matron', 'storm_bailiff', 'thorn_lurker', 'grave_acolyte']) {
  const rng = new ADV.RNG(7);
  const healer = ADV.Character.makeEnemy(rng, id, { level: 12 });
  const buddy = ADV.Character.makeEnemy(rng, 'bandit', { level: 12 });
  const p = ADV.Character.base({ stats: { hp: 400, atk: 6, def: 30, spd: 1 } }); p.isPlayer = true; p.statusImmunities = ['poison', 'bleed'];   // a dummy: percentage DoTs would kill any HP pool
  const st = Cb.create([p], [healer, buddy], { rng });
  const uh = st.units.find(u => u.ch === healer), ub = st.units.find(u => u.ch === buddy);
  const up = st.units.find(u => u.ch === p); up.maxHp = 50000; up.chp = 50000;
  ub.chp = Math.round(ub.maxHp * 0.6); ub.maxHp = ub.maxHp * 3; ub.chp = ub.maxHp;   // sturdy enough to be worth healing
  ADV.Combat._internals.addStatus(st, ub, { kind: 'poison', tier: 'basic', srcUid: null, stacks: true });
  ub.chp = Math.round(ub.maxHp * 0.6);
  let healed = false, guard = 0;
  while (!st.over && guard++ < 40) {
    const t = Cb.currentTurn(st); if (!t) break;
    if (t.unit === uh) {
      const before = st.events.length;
      Cb.aiTakeTurn(st, uh);
      if (st.events.slice(before).some(e => e.uid === ub.uid && (e.t === 'heal' || e.t === 'thornShield' || e.t === 'cleansed' || (e.t === 'status' && e.kind === 'hot')))) healed = true;
      if (!healed && ub.statuses.some(s => s.kind === 'hot')) healed = true;
    } else if (t.isPlayer) { Cb.act(st, t.unit, { kind: 'hold' }); }
    else Cb.aiTakeTurn(st, t.unit);
    Cb.advance(st);
    if (healed) break;
  }
  ok(healed, `${id} heals a wounded, poisoned ally within a few turns`);
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
