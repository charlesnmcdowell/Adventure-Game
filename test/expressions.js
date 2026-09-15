// Expression pass (EXPRESSION_PROMPT.md §12, headless half).
// portraits.js is a UI file, but its data and its chooser are pure: MOODS,
// PERSONALITY_BIAS, TAG_MOODS and moodFor() run under Node with a Phaser stub.
'use strict';
const path = require('path');
const fs = require('fs');
const { load } = require('./harness.js');
load();

let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

// minimal Phaser stub: portraits.js only touches these at call time
globalThis.Phaser = globalThis.Phaser || { Curves: { QuadraticBezier: function () { this.draw = () => {}; } }, Math: { Vector2: function (x, y) { this.x = x; this.y = y; } }, Display: { Color: { IntegerToColor: () => ({ darken: () => ({ color: 0 }) }) } } };
globalThis.window = globalThis.window || {};
require(path.join(__dirname, '..', 'js', 'ui', 'portraits.js'));
const P = ADV.Portraits;

console.log('-- palette --');
ok(P.MOOD_IDS.length === 16, `MOODS has exactly 16 entries (${P.MOOD_IDS.length})`);
let shapeOk = true;
for (const id of P.MOOD_IDS) {
  const M = P.MOODS[id];
  if (!M.brow || M.brow.length !== 2 || !M.brow.every(b => b.length === 3 && b.every(Number.isFinite))) shapeOk = false;
  if (!Number.isFinite(M.lid) || !M.mouth || !Number.isFinite(M.mouth.curve) || !Number.isFinite(M.mouth.open) || !Number.isFinite(M.mouth.side)) shapeOk = false;
}
ok(shapeOk, 'every mood has 2×3 finite brow offsets, a finite lid, and a finite mouth');
for (const need of ['neutral', 'content', 'happy', 'laughing', 'tender', 'sad', 'grief', 'angry', 'furious', 'disgust', 'smug', 'afraid', 'surprised', 'pain', 'resolve', 'dazed']) ok(!!P.MOODS[need], `mood present: ${need}`);
ok(P.MOODS.smug.brow[0].join() !== P.MOODS.smug.brow[1].join(), 'smug is asymmetric');
ok(P.MOODS.pain.brow[0].join() !== P.MOODS.pain.brow[1].join(), 'pain is asymmetric');

console.log('-- personality baselines --');
const pids = Object.keys(ADV.DATA.DIALOGUE);
const missing = pids.filter(id => !P.PERSONALITY_BIAS[id]);
ok(missing.length === 0, `every personality has a resting bias (${pids.length} personalities)`, missing.join(','));
ok(Object.values(P.PERSONALITY_BIAS).every(([m, k]) => P.MOODS[m] && k >= 0 && k <= 1), 'baselines name real moods with intensity in [0,1]');
const distinct = new Set(pids.slice(0, 12).map(id => P.PERSONALITY_BIAS[id][0]));
ok(distinct.size >= 4, `first 12 personalities show >= 4 distinct resting moods (${distinct.size})`);

console.log('-- delivery tags --');
const re = /\[([a-z][a-z ,'-]*)\]/gi;
const found = new Set();
const walk = (o) => { if (!o) return; if (typeof o === 'string') { let m; while ((m = re.exec(o))) found.add(m[1].toLowerCase().trim()); return; } if (Array.isArray(o)) return o.forEach(walk); if (typeof o === 'object') Object.values(o).forEach(walk); };
walk(ADV.DATA.DIALOGUE); walk(ADV.DATA.CAMPAIGN_DIALOGUE); walk(ADV.DATA.CAMPAIGN2_DIALOGUE); walk(ADV.DATA.GOD_LINE_DIALOGUE);
for (const f of ['dialogue_hiro.js']) { try { walk(fs.readFileSync(path.join(__dirname, '..', 'js', 'data', f), 'utf8')); } catch (e) {} }
const uncovered = [...found].filter(t => !P.TAG_MOODS[t] && !P.TAG_IGNORE.includes(t));
ok(found.size > 20, `found ${found.size} distinct delivery tags in the data`);
ok(uncovered.length === 0, 'every tag in the data maps to a reaction or is deliberately ignored', uncovered.join(' | '));
ok(Object.values(P.TAG_MOODS).every(([m, k]) => P.MOODS[m] && k > 0 && k <= 1), 'tag reactions name real moods');
const t = P.tagsIn('[laughs] Oh, {target}. [sighs] Fine.');
ok(t.length === 2 && t[0].mood === 'laughing' && t[1].mood === 'sad', 'tagsIn parses tags in order');

console.log('-- moodFor --');
const rng = new ADV.RNG(7);
const world = ADV.World.create(rng, { seed: 7 });
const game = { world };
const player = ADV.World.byId(world, world.playerId) || world.characters.find(c => c.isPlayer) || world.characters[0];
if (!world.playerId) { world.playerId = player.id; player.isPlayer = true; }
const inR = (r) => r && P.MOODS[r.mood] && r.intensity >= 0 && r.intensity <= 1;
const S = ADV.Survival;
let r;
r = P.moodFor(game, player, 'town'); ok(inR(r), `player, nothing wrong → ${r.mood} ${r.intensity.toFixed(2)}`);
S.state(player).hunger = 2; r = P.moodFor(game, player, 'town'); ok(r.mood === 'sad' && r.intensity > 0.4 && r.intensity < 0.7, `hunger 2 → sad mid (${r.mood} ${r.intensity.toFixed(2)})`);
S.state(player).hunger = 4; r = P.moodFor(game, player, 'town'); ok(r.mood === 'dazed', `hunger 4 → dazed (${r.mood})`);
S.state(player).hunger = 0; S.state(player).sick = true; r = P.moodFor(game, player, 'town'); ok(r.mood === 'pain', `sick → pain (${r.mood})`);
S.state(player).sick = false;
const npc = world.characters.find(c => !c.isPlayer && c.alive && c.personalityId);
r = P.moodFor(game, npc, 'dialogue'); const base = P.PERSONALITY_BIAS[npc.personalityId];
ok(inR(r) && (r.mood === base[0] || r.intensity > 0), `NPC with no signal → its baseline (${npc.personalityId} ${r.mood})`);
// relationship tiers via score
const edge = (score) => { ADV.Rel.setScore ? ADV.Rel.setScore(world, npc.id, world.playerId, score) : null; };
try {
  ADV.Rel.move(world, npc.id, world.playerId, 100, 'test');
  r = P.moodFor(game, npc, 'dialogue'); ok(r.mood === 'content' || r.mood === 'tender', `friendly NPC → content/tender (${r.mood})`);
  ADV.Rel.move(world, npc.id, world.playerId, -300, 'test');
  r = P.moodFor(game, npc, 'dialogue'); ok(r.mood === 'angry' && r.intensity >= 0.5, `hatred → angry >= .5 (${r.mood} ${r.intensity.toFixed(2)})`);
  ADV.Rel.move(world, npc.id, world.playerId, 200, 'test');
} catch (e) { ok(false, 'relationship tiers exercised', e.message); }
edge(0);
// bereaved via feed
const spouse = world.characters.find(c => !c.isPlayer && c.alive && c !== npc);
ADV.World.feed(world, `${spouse.name} fell on the road and did not return.`, [spouse.id, npc.id]);
r = P.moodFor(game, npc, 'town'); ok(r.mood === 'grief', `NPC named in a death → grief (${r.mood})`);
world.eventFeed.pop();
// combat
const st = { units: [], turnQueue: [] };
const mk = (ch, chp, maxHp, extra) => Object.assign({ uid: 'u' + Math.random(), ch, chp, maxHp, statuses: [], side: 'a' }, extra || {});
const timid = { id: 'timid', name: 'T', personalityId: 'M03', perks: [], actives: [] };
const u1 = mk(timid, 20, 100); st.units.push(u1);
r = P.moodFor(game, timid, 'combat', { unit: u1, st }); ok(r.mood === 'afraid', `ordinary NPC at 20% → afraid (${r.mood})`);
const bossU = mk({ name: 'Boss', boss: true, isMonster: true, perks: [], actives: [] }, 20, 100);
r = P.moodFor(game, bossU.ch, 'combat', { unit: bossU, st }); ok(r.mood === 'furious', `boss at 20% → furious, not afraid (${r.mood})`);
const steadyU = mk({ name: 'S', personalityId: 'M01', perks: [], actives: [] }, 20, 100);
r = P.moodFor(game, steadyU.ch, 'combat', { unit: steadyU, st }); ok(r.mood === 'resolve', `Stoic at 20% → resolve (${r.mood})`);
const bulwark = mk({ name: 'B', personalityId: 'M02', perks: [{ skillId: 'bulwark' }], actives: [] }, 20, 100);
r = P.moodFor(game, bulwark.ch, 'combat', { unit: bulwark, st }); ok(r.mood === 'resolve', `Bulwark holder at 20% → resolve (${r.mood})`);
const frozen = mk({ name: 'F', perks: [], actives: [] }, 90, 100, { statuses: [{ kind: 'frozen' }] });
r = P.moodFor(game, frozen.ch, 'combat', { unit: frozen, st }); ok(r.mood === 'dazed', `Frozen → dazed (${r.mood})`);
const risen = mk({ name: 'R', isUndead: true, perks: [], actives: [] }, 90, 100);
r = P.moodFor(game, risen.ch, 'combat', { unit: risen, st }); ok(r.mood === 'dazed' && r.intensity === 0.8, `Risen → dazed .8 (${r.mood} ${r.intensity})`);
const half = mk({ name: 'H', perks: [], actives: [] }, 50, 100);
r = P.moodFor(game, half.ch, 'combat', { unit: half, st }); ok(r.mood === 'pain' && r.intensity === 0.5, `50% HP → standing pain .5 (${r.mood} ${r.intensity})`);
const cleanser = mk({ name: 'C', perks: [], actives: [{ skillId: 'cleanse' }] }, 90, 100);
r = P.moodFor(game, cleanser.ch, 'combat', { unit: cleanser, st, facingUndead: true, cleanse: true }); ok(r.mood === 'disgust' && r.intensity === 0.7, `Cleanse user facing undead → disgust .7 (${r.mood} ${r.intensity})`);
// campaign roles
const rivalDef = Object.values(ADV.DATA.CAMPAIGN_CHARS).find(d => d.role === 'rival');
const rivalCh = { id: 'cmp_x', name: 'Rival', campaign: true, campaignId: rivalDef.id, perks: [], actives: [] };
r = P.moodFor(game, rivalCh, 'dialogue'); ok(r.mood === 'smug', `campaign rival → smug (${r.mood})`);
// all 60 personalities produce a valid result with no other signal
let allOk = true;
for (const id of pids) { const c = { id: 'p_' + id, name: 'X', personalityId: id, perks: [], actives: [] }; const rr = P.moodFor(game, c, 'roster'); if (!inR(rr)) allOk = false; }
ok(allOk, 'moodFor is valid for all personalities with no other signal');

console.log('-- costumes --');
ok(Object.keys(P.SET_LOOK).length === Object.keys(ADV.DATA.GEAR_SETS).length, `SET_LOOK covers every gear set (${Object.keys(P.SET_LOOK).length}/${Object.keys(ADV.DATA.GEAR_SETS).length})`);
ok(Object.keys(ADV.DATA.GEAR_SETS).every(id => P.SET_LOOK[id]), 'every gear set id has a look', Object.keys(ADV.DATA.GEAR_SETS).filter(id => !P.SET_LOOK[id]).join(','));
ok(Object.values(P.SET_LOOK).every(L => P.PATTERNS[L.pattern] && L.palette && L.palette.base && L.palette.trim && L.palette.metal), 'every look has a real pattern and a 3-colour palette');
const patternsUsed = new Set(Object.values(P.SET_LOOK).map(L => L.pattern));
ok(patternsUsed.size >= 10, `>= 10 distinct costume patterns in use (${patternsUsed.size})`);

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
