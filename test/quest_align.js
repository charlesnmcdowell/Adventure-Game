// Alignment-locked enemy pools, quest themes, and tutorial-neutral first jobs.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./harness');
const ADV = load();
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/tutor.js'), 'utf8'), { filename: 'tutor.js' });

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra != null ? '  [' + extra + ']' : '')); }
}
function eq(a, b, name) { ok(a === b, name, a + ' != ' + b); }

function allIds(q) {
  const ids = [];
  for (const enc of q.encounters || []) for (const id of enc.enemyTypeIds || []) ids.push(id);
  return ids;
}

(function () {
  console.log('\n-- Camps: every regular foe is tagged --');
  for (const id of Object.keys(ADV.DATA.ENEMIES)) {
    const e = ADV.DATA.ENEMIES[id];
    ok(e.camp === 'law' || e.camp === 'criminal' || e.camp === 'wild', id + ' has a camp', e.camp);
  }
  for (const id of Object.keys(ADV.DATA.BOSSES)) {
    const e = ADV.DATA.BOSSES[id];
    ok(e.camp === 'law' || e.camp === 'criminal' || e.camp === 'wild', id + ' boss has a camp', e.camp);
  }
  eq(ADV.Quests.campOf('bandit'), 'criminal', 'bandit is criminal');
  eq(ADV.Quests.campOf('plated_sentinel'), 'law', 'sentinel is law');
  eq(ADV.Quests.campOf('dire_wolf'), 'wild', 'wolf is wild');
  eq(ADV.Quests.alignmentVs('criminal'), 'law', 'hunting criminals is a law job');
  eq(ADV.Quests.alignmentVs('law'), 'criminal', 'hitting the watch is a criminal job');
  eq(ADV.Quests.alignmentVs('wild'), 'neutral', 'beasts are a neutral job');
})();

(function () {
  console.log('\n-- Generated quests only field the opposing camp --');
  const rng = new ADV.RNG(20260905);
  for (const fac of ['law', 'criminal', 'neutral']) {
    for (const tier of [1, 2, 3, 'boss']) {
      for (let i = 0; i < 8; i++) {
        const q = ADV.Quests.make(rng, tier, tier === 'boss' ? 'party' : 'solo', fac);
        ok(q.factionAlignment === fac, fac + ' T' + tier + ' keeps its banner');
        ok(q.theme && q.brief && q.name, fac + ' T' + tier + ' has a theme, brief, and name');
        ok(ADV.Quests.foesMatchAlignment(q), fac + ' T' + tier + ' foes match the banner', allIds(q).join(','));
        const camps = ADV.Quests.foeCamps(fac);
        for (const id of allIds(q)) {
          ok(camps.includes(ADV.Quests.campOf(id)), fac + ' never fields ' + id);
        }
      }
    }
    for (const hz of ['hazard2', 'hazard3']) {
      for (let i = 0; i < 6; i++) {
        const q = ADV.Quests.makeHazard(rng, hz, fac);
        ok(ADV.Quests.foesMatchAlignment(q), fac + ' ' + hz + ' foes match', allIds(q).join(',') + ' as ' + q.factionAlignment);
        ok(q.theme && q.brief, hz + ' has a theme');
      }
    }
  }
})();

(function () {
  console.log('\n-- Tutorial first two jobs stay neutral --');
  const party = ADV.Quests.makeTutorialParty();
  eq(party.factionAlignment, 'neutral', 'tutorial party job is neutral');
  ok(ADV.Quests.foesMatchAlignment(party), 'tutorial party foes are wild');
  ok(allIds(party).every(id => ADV.Quests.campOf(id) === 'wild'), 'tutorial party is beasts, not bandits');
  ok(!allIds(party).includes('bandit'), 'tutorial party no longer fields bandits');

  const world = { characters: [], playerId: null, seed: 1 };
  const tutGame = { tutorial: { step: 'firstQuest' }, world };
  const board = ADV.Quests.generateBoard(world, new ADV.RNG(11), tutGame);
  const t1solo = board.filter(q => q.track === 'solo' && q.tier === 1);
  ok(t1solo.length >= 2, 'board posts two tier-1 solos');
  ok(t1solo.every(q => q.factionAlignment === 'neutral'), 'tutorial board tier-1 solos are all neutral');
  ok(t1solo.every(q => ADV.Quests.foesMatchAlignment(q)), 'tutorial tier-1 solos field only beasts');

  let sawOther = false;
  for (let seed = 1; seed < 40 && !sawOther; seed++) {
    const later = ADV.Quests.generateBoard(world, new ADV.RNG(seed), { tutorial: { step: 'done' } });
    if (later.some(q => q.track === 'solo' && q.tier === 1 && q.factionAlignment !== 'neutral')) sawOther = true;
  }
  ok(sawOther, 'after the tour the board can post law or criminal tier-1 solos');

  const stale = [
    { track: 'solo', tier: 1, factionAlignment: 'law', encounters: [{ enemyTypeIds: ['bandit'] }] },
    { track: 'solo', tier: 1, factionAlignment: 'criminal', encounters: [{ enemyTypeIds: ['plated_sentinel'] }] },
  ];
  ADV.Quests.forceTutorialNeutrals(stale, new ADV.RNG(3));
  ok(stale.filter(q => q.track === 'solo' && q.tier === 1).every(q => q.factionAlignment === 'neutral'),
    'forceTutorialNeutrals rewrites a stale first-quest board');

  ok(ADV.Tutor.questAllowed({ tutorial: { step: 'firstQuest' } }, { track: 'solo', tier: 1, factionAlignment: 'neutral' }),
    'tutor allows a neutral first solo');
  ok(!ADV.Tutor.questAllowed({ tutorial: { step: 'firstQuest' } }, { track: 'solo', tier: 1, factionAlignment: 'law' }),
    'tutor blocks a law first solo');
})();

(function () {
  console.log('\n-- Tutorial wolves stay at the easy level --');
  const q = ADV.Quests.makeTutorialParty();
  const foes = ADV.Quests.spawnEncounter(new ADV.RNG(4), q, 0);
  ok(foes.length === 1 && foes[0].enemyTypeId === 'dire_wolf', 'tutorial encounter is one wolf');
  ok(foes[0].enemyLevel >= 3 && foes[0].enemyLevel <= 4, 'tutorial wolves use their 1–2 base levels plus Easy’s two-level offset', foes[0].enemyLevel);
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
