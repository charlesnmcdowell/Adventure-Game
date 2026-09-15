'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./harness');
const ADV = load();

globalThis.Phaser = {
  Curves: { QuadraticBezier: class { constructor() {} draw() {} } },
  Math: { Vector2: class { constructor(x, y) { this.x = x; this.y = y; } } },
};
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/combat_presentation.js'), 'utf8'), { filename: 'combat_presentation.js' });

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

console.log('\n-- Combat presentation profiles every skill --');
{
  const P = ADV.CombatPresentation;
  ok(!!P && typeof P.profile === 'function', 'presentation module loaded');
  const seen = new Set();
  let melee = 0, magic = 0, heal = 0;
  for (const id of Object.keys(ADV.DATA.SKILLS)) {
    const p = P.profile(id, 'basic');
    ok(!!p && p.id === id && p.family, id + ' has a family');
    seen.add(p.family);
    if (p.melee) melee++;
    if (p.family === 'magic') magic++;
    if (p.family === 'heal') heal++;
  }
  ok(melee > 8, 'several skills are melee swings');
  ok(magic > 4, 'elemental skills use the magic family');
  ok(heal >= 1, 'heals have their own family');
  ok(seen.has('slash') && seen.has('gun'), 'melee and gun families are distinct');
  const fire = P.profile('fire_bolt', 'advanced');
  ok(fire.element === 'fire' && fire.intensity > 1, 'advanced Fire Bolt keeps its element');
  const raise = P.profile('raise', 'basic');
  ok(raise.family === 'heal' && !raise.melee, 'Raise is a heal, not a swing');
}

console.log('\n-- Recorded SFX land on the right skills --');
{
  const P = ADV.CombatPresentation;
  const dir = path.join(__dirname, '../audio/sfx');
  const files = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).map(f => f.replace(/\.mp3$/, '')));
  const hashes = ADV.DATA.SFX_HASHES || {};
  ok(Object.keys(hashes).length >= 40, 'SFX hash bank is populated');
  ok(Object.keys(hashes).every(k => files.has(k)), 'every hashed sample has a file');
  const stale = Object.entries(hashes).filter(([k, h]) => {
    const got = crypto.createHash('md5').update(fs.readFileSync(path.join(dir, k + '.mp3'))).digest('hex').slice(0, 12);
    return got !== h;
  });
  ok(stale.length === 0, 'cache-bust hashes match the files on disk' + (stale.length ? ' [' + stale.map(x => x[0]).join(', ') + ']' : ''));
  const expect = {
    fire_bolt: ['fire_use', 'fire_hit'],
    ember_lash: ['fire_use', 'fire_hit'],
    fire_barrier: ['fire_use', 'fire_hit'],
    powder_keg: ['fire_use', 'fire_hit'],
    cinder_charge: ['fire_use', 'fire_hit'],
    frost_touch: ['ice_use', 'ice_hit'],
    frost_bite: ['ice_use', 'ice_hit'],
    spark: ['lightning_use', 'lightning_hit'],
    poison_spray: ['acid_use', 'acid_hit'],
    venom_draw: ['acid_use', 'acid_hit'],
    venom_fang: ['thrust_use', 'thrust_hit'],   // a dagger stab, not jaws (reported: the bite bank sounded like biting an apple)
    shadow_lance: ['shadow_use', 'shadow_hit'],
    umbral_rake: ['shadow_use', 'shadow_hit'],
    thorn_lash: ['nature_use', 'nature_hit'],
    quartermasters_root: ['nature_use', 'nature_hit'],
    grove_raise: ['revive_use', 'heal_use'],
    mend: ['heal_use', 'heal_use'],
    raise: ['revive_use', 'heal_use'],
    shield_wall: ['guard_use', 'guard_use'],
    beast_shape: ['transform_use', 'transform_use'],
    flintlock_shot: ['gun_use', 'gun_hit'],
    aimed_shot: ['projectile_use', 'projectile_hit'],
    cleave: ['slash_use', 'slash_hit'],
    basic_attack: ['slash_use', 'slash_hit'],
    smoke_bomb: ['stealth_use', 'support_use'],
    gods_edict: ['holy_use', 'holy_hit'],
    true_rest: ['holy_use', 'holy_hit'],
    bell_silence: ['arcane_use', 'arcane_hit'],
    dual_swords: ['slash_use', 'slash_hit'],
    volley_fire: ['projectile_use', 'projectile_hit'],
    fire_ship: ['fire_use', 'fire_hit'],
  };
  for (const [id, [use, hit]] of Object.entries(expect)) {
    const p = P.profile(id, 'basic');
    eq(P.sampleKey(p, 'use'), use, id + ' use → ' + use);
    eq(P.sampleKey(p, 'hit'), hit, id + ' hit → ' + hit);
    ok(files.has(use) && files.has(hit), id + ' samples exist on disk');
  }
  let missing = 0;
  for (const id of Object.keys(ADV.DATA.SKILLS)) {
    const p = P.profile(id, 'basic');
    for (const phase of ['use', 'hit']) {
      const key = P.sampleKey(p, phase);
      if (!files.has(key)) { missing++; console.log('FAIL  ' + id + ' ' + phase + ' → ' + key); }
    }
  }
  ok(missing === 0, 'every skill resolves to a recorded sample');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
