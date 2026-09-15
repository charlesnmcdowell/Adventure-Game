// Poison skills must never mark the caster or an ally. Every enemy type
// wears a matching portrait and at least two alternative looks.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat;

function field(seed) {
  const rng = new ADV.RNG(seed || 4);
  const a = ADV.Character.base({ stats: { hp: 200, atk: 14, def: 8, spd: 20 } });
  a.actives = [
    { skillId: 'venom_fang', level: 1, uses: 0 },
    { skillId: 'regenerate', level: 1, uses: 0 },
    { skillId: 'thorn_lash', level: 1, uses: 0 },
    { skillId: 'wither_touch', level: 1, uses: 0 },
  ];
  const ally = ADV.Character.base({ stats: { hp: 180, atk: 10, def: 10, spd: 8 } });
  const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([a, ally], [e], { rng });
  const ua = st.units.find(u => u.ch === a);
  const ub = st.units.find(u => u.ch === ally);
  const ue = st.units.find(u => u.ch === e);
  ue.evade = 0;
  Cb.currentTurn(st);
  return { st, ua, ub, ue };
}
function poisoned(u) { return (u.statuses || []).some(s => s.kind === 'poison'); }

console.log('-- poison skills never mark the caster or an ally --');
{
  const { st, ua, ub, ue } = field(1);
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang' });
  ok(poisoned(ue) && !poisoned(ua) && !poisoned(ub), 'venom_fang with no targetUid hits the foe, not the party');
}
{
  const { st, ua, ub, ue } = field(2);
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ua.uid });
  ok(poisoned(ue) && !poisoned(ua) && !poisoned(ub), 'venom_fang aimed at the caster retargets to an enemy');
}
{
  const { st, ua, ub, ue } = field(3);
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ub.uid });
  ok(poisoned(ue) && !poisoned(ua) && !poisoned(ub), 'venom_fang aimed at an ally retargets to an enemy');
}
{
  const { st, ua, ub, ue } = field(4);
  Cb.act(st, ua, { kind: 'skill', skillId: 'regenerate', targetUid: ua.uid, offensiveMode: true });
  ok(poisoned(ue) && !poisoned(ua) && !poisoned(ub), 'regenerate Poison mode never poisons the healer');
}
{
  const { st, ua, ub, ue } = field(5);
  Cb.act(st, ua, { kind: 'skill', skillId: 'thorn_lash', targetUid: ua.uid });
  ok(poisoned(ue) && !poisoned(ua), 'thorn_lash aimed at self still poisons the foe');
}
{
  const { st, ua, ub, ue } = field(6);
  Cb.act(st, ua, { kind: 'skill', skillId: 'wither_touch', targetUid: ub.uid });
  ok(ue.statuses.some(s => s.kind === 'healcut') && !ub.statuses.some(s => s.kind === 'healcut'), 'wither_touch cannot land on an ally');
}

console.log('-- enemy art matches the creature, and every type has two looks --');
const MATCH = {
  thorn_lurker: 'plant', moss_matron: 'plant', cave_boar: 'boar', cliff_raptor: 'raptor',
  frost_hag: 'hag', shadow_beast: 'shadow', dire_wolf: 'dire_wolf',
};
for (const [id, want] of Object.entries(MATCH)) {
  const t = ADV.DATA.ENEMIES[id];
  ok(t && t.portrait === want, `${id} portrait is ${want}`, t && t.portrait);
}
const CREATURE = {
  giant_raptor: 'raptor', swamp_hydra: 'hydra', plague_boar: 'boar', river_serpent: 'serpent',
  moss_giant: 'moss_giant', grave_hound: 'hound', crystal_spider: 'spider', maw_toad: 'toad',
  goblin_king: 'goblin', orc_king: 'orc', blood_ape: 'ape',
};
for (const [id, want] of Object.entries(CREATURE)) {
  const t = ADV.DATA.BOSSES[id];
  ok(t && t.portrait === want, `${id} portrait is ${want}`, t && t.portrait);
}
const books = [ADV.DATA.ENEMIES, ADV.DATA.BOSSES, ADV.DATA.CAMPAIGN_ENEMIES];
const short = [];
for (const book of books) {
  for (const t of Object.values(book)) {
    if (!t || !t.portrait) continue;
    if (!t.skins || t.skins.length < 2) short.push(t.id || t.name);
  }
}
ok(short.length === 0, 'every enemy type has at least two looks', short.slice(0, 8).join(', '));

const used = new Set();
for (const book of books) for (const t of Object.values(book)) if (t.portrait) used.add(t.portrait);
ok(!used.has('frost_hag'), 'broken frost_hag portrait key is unused');
ok(used.has('plant') && used.has('boar') && used.has('hag'), 'new creature rigs are referenced');

{
  const a = ADV.Character.makeEnemy(new ADV.RNG(1), 'thorn_lurker', { level: 8 });
  const b = ADV.Character.makeEnemy(new ADV.RNG(2), 'thorn_lurker', { level: 8 });
  ok(a.portraitId === 'plant' && a.skinTint && b.skinTint, 'thorn lurker is a plant and rolls a look');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
