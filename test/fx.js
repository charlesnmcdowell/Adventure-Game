// Weather model + spell-school coverage (FX_WEATHER_PROMPT §10, headless).
'use strict';
const path = require('path');
const { load } = require('./harness.js');
load();

globalThis.Phaser = globalThis.Phaser || {
  BlendModes: { ADD: 1 },
  Curves: { QuadraticBezier: function () { this.draw = () => {}; } },
  Math: { Vector2: function (x, y) { this.x = x; this.y = y; } },
  Display: { Color: { IntegerToColor: () => ({ darken: () => ({ color: 0 }) }) } },
};
require(path.join(__dirname, '..', 'js', 'ui', 'vfx.js'));
require(path.join(__dirname, '..', 'js', 'ui', 'weather.js'));
require(path.join(__dirname, '..', 'js', 'ui', 'spell_fx.js'));

let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra != null ? '  [' + extra + ']' : '')); } };

console.log('\n-- Weather.at --');
const w0 = ADV.Weather.at({ seed: 42, questClock: 7 });
const w1 = ADV.Weather.at({ seed: 42, questClock: 7 });
ok(w0.kind === w1.kind && w0.intensity === w1.intensity && w0.wind === w1.wind, 'deterministic for same seed+clock');
ok(ADV.Weather.KINDS.includes(w0.kind), 'kind is one of the six');

const night = ADV.Weather.at({ seed: 1, questClock: 3 }, { phase: 'night' });
ok(night.kind !== 'sunny', 'sunny never appears at night');
const eve = ADV.Weather.at({ seed: 1, questClock: 3 }, { phase: 'evening' });
ok(eve.kind !== 'sunny', 'sunny never appears at evening');

const counts = { clear: 0, sunny: 0, overcast: 0, rain: 0, storm: 0, snow: 0 };
let run = 0, last = null, maxRun = 0;
for (let c = 0; c < 200; c++) {
  const w = ADV.Weather.at({ seed: 99, questClock: c }, { phase: 'day' });
  counts[w.kind] = (counts[w.kind] || 0) + 1;
  if (w.kind !== 'clear' && w.kind === last) run += 1;
  else run = w.kind === 'clear' ? 0 : 1;
  if (run > maxRun) maxRun = run;
  last = w.kind;
}
ok(maxRun <= 3, 'no non-clear run exceeds 3 quests', maxRun);
ok(Object.values(counts).every(n => n > 0), 'every kind appears over 200 day-quests');
const pct = (k) => counts[k] / 200;
ok(Math.abs(pct('clear') - 0.45) <= 0.12, 'clear near 45%', pct('clear').toFixed(2));
ok(pct('sunny') > 0.05 && pct('sunny') < 0.30, 'sunny in band', pct('sunny').toFixed(2));
ok(pct('rain') > 0.04 && pct('rain') < 0.25, 'rain in band', pct('rain').toFixed(2));

ADV.Weather.force('storm', { intensity: 1, wind: 1 });
ok(ADV.Weather.at({ seed: 1, questClock: 0 }).kind === 'storm', 'force(kind) sticks');
ADV.Weather.force(null);
ok(ADV.Weather.at({ seed: 42, questClock: 7 }).kind === w0.kind, 'force(null) restores derived weather');

console.log('\n-- SpellFX schools --');
ok(typeof ADV.SpellFX.schoolOf === 'function', 'schoolOf exported');
ok(ADV.SpellFX.has('fire_bolt', 'basic') && ADV.SpellFX.has('fire_bolt', 'intermediate') && ADV.SpellFX.has('fire_bolt', 'advanced'), 'fire_bolt all tiers');
ok(ADV.SpellFX.has('spark', 'basic') && ADV.SpellFX.has('spark', 'advanced'), 'spark tiers');
ok(ADV.SpellFX.has('frost_touch', 'basic') && ADV.SpellFX.has('frost_touch', 'advanced'), 'frost_touch tiers');
ok(ADV.SpellFX.has('ember_lash', 'basic') && ADV.SpellFX.has('rime_grasp', 'advanced'), 'lash / grasp');

const schools = ADV.SpellFX.SCHOOLS;
const missing = [];
const unschooled = [];
for (const id of Object.keys(ADV.DATA.SKILLS || {})) {
  const d = ADV.DATA.SKILLS[id];
  if (!d || d.kind === 'perk') continue;
  const s = ADV.SpellFX.schoolOf(id);
  if (!s) unschooled.push(id);
  else if (schools.indexOf(s) < 0) missing.push(id + ':' + s);
  if (!ADV.SpellFX.has(id, 'basic')) missing.push(id + ':no-has');
}
ok(unschooled.length === 0, 'every non-perk skill has a school', unschooled.slice(0, 8).join(','));
ok(missing.length === 0, 'every school is in the grammar and has()', missing.slice(0, 8).join(','));
ok(ADV.SpellFX.schoolOf('fire_bolt') === 'fire', 'fire_bolt is fire');
ok(ADV.SpellFX.schoolOf('spark') === 'lightning', 'spark is lightning');
ok(ADV.SpellFX.schoolOf('frost_touch') === 'ice', 'frost_touch is ice');
ok(ADV.SpellFX.schoolOf('mend') === 'holy', 'mend is holy');
ok(ADV.VFX.comet && ADV.VFX.lightningStreak && ADV.VFX.iceLance && ADV.VFX.explosion, 'new atoms exist');
ok(ADV.VFX.cine && ADV.VFX.cine.letterbox && ADV.VFX.cine.impactFrame, 'cine toolkit exists');
ok(ADV.VFX.blizzard && ADV.VFX.freezeOver && ADV.VFX.emberTrail, 'ice/fire support atoms exist');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
