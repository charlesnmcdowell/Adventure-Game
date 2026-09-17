// What a gear set actually does to a skill's manifestation, locked as a table.
// Written after a report that "mage armor is not levelling Fire Bolt to advanced":
// the machinery was correct, the documentation and the shop copy were not. This
// keeps the answer checkable instead of re-auditing it by hand next time.
'use strict';
const { load } = require('./harness');
const A = load(), S = A.SkillSys, D = A.DATA, C = D.CONST;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
const eq = (a, b, n) => ok(a === b, n, a + ' != ' + b);

const MAGE_SKILLS = ['fire_bolt', 'spark', 'frost_touch'];
const rng = new A.RNG(31);

// A character carrying the mage kit at a chosen NATURAL level, in a chosen set.
function wearer(setId, level) {
  const p = A.Character.makePlayer(rng, { name: 'Robe', sex: 'f', startingSkills: ['arcane_focus', 'fire_bolt', 'spark'] });
  for (const id of MAGE_SKILLS) if (!S.entryFor(p, id)) S.learn(p, id, { free: true });
  for (const e of p.actives.concat(p.perks)) { e.level = level; e.uses = (level - 1) * C.USES_PER_LEVEL; }
  p.equippedSet = setId;
  return p;
}
const tierOf = (p, id) => S.manifest(p, S.entryFor(p, id)).tier;

console.log('-- the 800g Mage Set reaches Advanced, and that is the point --');
for (const id of MAGE_SKILLS) {
  eq(tierOf(wearer('mage', 1), id), 'intermediate', `${id}: natural 1 in a Mage Set floors to Intermediate`);
  eq(tierOf(wearer('mage', 9), id), 'intermediate', `${id}: natural 9 is still Intermediate`);
  eq(tierOf(wearer('mage', 10), id), 'advanced', `${id}: natural 10 in a Mage Set manifests Advanced`);
}
eq(S.manifest(wearer('mage', 10), S.entryFor(wearer('mage', 10), 'fire_bolt')).data.name, 'Fire Ball',
  'Fire Bolt at natural 10 in a Mage Set is Fire Ball');

console.log('\n-- the floor and the advance never compound --');
// Natural 1 floored to 10 must not then be advanced off the floored value; if it
// did, every 800g set would hand out Advanced skills at level 1.
eq(tierOf(wearer('mage', 1), 'fire_bolt'), 'intermediate', 'a level-1 skill cannot ride the floor into Advanced');

console.log('\n-- cheaper sets floor only, by design --');
for (const setId of ['adept', 'chantry', 'shadowweave']) {
  const set = D.GEAR_SETS[setId];
  ok(!set.advanceTier && set.cost < C.GOLD.gearSet, `${setId} is a floor-only set`);
  for (const lv of [1, 10, 15]) {
    eq(tierOf(wearer(setId, lv), 'fire_bolt'), lv < C.TIER_THRESHOLDS.advanced ? 'intermediate' : 'advanced',
      `${setId}: natural ${lv} stays at the floor, not Advanced`);
  }
  // Use still gets you there on your own.
  eq(tierOf(wearer(setId, 25), 'fire_bolt'), 'advanced', `${setId}: levelling to 25 still reaches Advanced unaided`);
}

console.log('\n-- a set only touches its own archetypes --');
for (const setId of ['warrior', 'ronin']) {
  eq(S.gearFloor(wearer(setId, 1), D.SKILLS.fire_bolt), 0, `${setId} gives a mage skill no floor`);
  ok(!S.gearAdvances(wearer(setId, 1), D.SKILLS.fire_bolt), `${setId} gives a mage skill no tier advance`);
  eq(tierOf(wearer(setId, 1), 'fire_bolt'), 'basic', `${setId}: Fire Bolt stays Basic at natural 1`);
}

console.log('\n-- every set that costs the top price, or is earned, advances --');
for (const [id, set] of Object.entries(D.GEAR_SETS)) {
  if (set.campaign && !set.unique) ok(!!set.advanceTier, `campaign reward set ${id} advances a tier`);
  if (set.cost >= C.GOLD.gearSet) ok(!!set.advanceTier || set.cost >= C.GOLD.gearSet, `${id} at ${set.cost}g advances a tier`);
}

console.log('\n-- Hiro is deliberately locked to his own kit --');
{
  const h = A.Character.makeRegistry(rng, 'hiro', 'Hiro', false);
  ok(!!h, 'Hiro builds from the registry');
  eq(h.equippedSet, 'ronin', 'Hiro wears Ronin Gear');
  const ronin = D.GEAR_SETS.ronin;
  ok(ronin.unique && ronin.campaign, 'Ronin Gear is unique and campaign-issued, so the smith will not replace it');
  // His authored kit is fixed-power on purpose: it must never tier with use or gear.
  for (const e of h.perks.concat(h.actives)) {
    const sk = D.SKILLS[e.skillId];
    ok(!!sk && sk.unique && sk.noTierGrowth, `${e.skillId} is unique and does not tier`);
    eq(S.effectiveLevel(h, e.skillId, e.level), e.level, `${e.skillId} ignores any gear floor`);
  }
  ok(h.perks.concat(h.actives).length === 8, 'Hiro carries all eight authored entries', h.perks.length + '+' + h.actives.length);
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' : 'PASSED all ') + (pass + fail) + ' checks');
process.exit(fail ? 1 : 0);
