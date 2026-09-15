'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { load, memBackend } = require('./harness');
const A = load(), C = A.Campaign3;

function fresh(sex = 'f') {
  A.Save.setBackend(memBackend());
  return A.Game.newGame({ seed: 914, name: 'Ward', sex });
}
function recruit(g, id, affinity = 0) {
  C.recruit(g, id);
  C.state(g).aff[id] = affinity;
}
function family(g) { return C.arrivalBeats(g, 9).filter(b => b.key === 'q9_family'); }

// Familial treatment does not depend on the player's sex or widowhood.
for (const sex of ['f', 'm']) for (const beauAlive of [true, false]) {
  const g = fresh(sex);
  recruit(g, 'selene', 99);
  recruit(g, 'dorran');
  if (!beauAlive) C.kill(g, 'dorran');
  assert.equal(C.dynamicOptions(g, 'romance').some(o => o.romance === 'selene'), false);
  assert.equal(family(g).length, 1);
  C.dismiss(g, 'selene'); // An arrival at the inn can include a benched companion.
  assert.equal(family(g).length, 1);
  C.setFlag(g, 'floodedEarly', true);
  assert.equal(family(g).length, 0, 'no warm reassurance after the player drowned Beau');
  C.setFlag(g, 'floodedEarly', false);
  C.state(g).aff.selene = -1;
  assert.equal(family(g).length, 0, 'hostile Delphine does not suddenly act warmly');
  C.state(g).aff.selene = 99;
  C.kill(g, 'selene');
  assert.equal(family(g).length, 0, 'dead companions do not speak');
  assert(!C.arrivalBeats(g, 9).some(b => b.dynamic), 'arrival does not trigger unsolicited courtship');
}
assert.equal(family(fresh()).length, 0, 'no reassurance from an unrecruited Delphine');
assert.equal(A.DATA.CAMPAIGN3_EPILOGUE.romance.selene, undefined);
assert(Object.keys(A.DATA.CAMPAIGN3_DIALOGUE.gate.selene).every(k => !/^q9_romance/.test(k)));

// Existing campaigns lose only the retired romantic state, including cached endings.
{
  const g = fresh(), s = C.state(g);
  recruit(g, 'selene', 8);
  Object.assign(s, { stage: 14, romance: 'selene', ending: 'hero', allegiance: 'gauntlet' });
  s.choices.romance = 'romance_selene';
  s.choices.q7_flood = 'wait';
  delete s.choiceEffects; // Also exercise the older choice-state migration.
  const familyEnding = A.DATA.CAMPAIGN3_EPILOGUE.companion.selene.present;
  s.epilogue = [
    'Other campaign outcome.', familyEnding,
    "Delphine is at the Warden house. So are you, most nights. Neither of you has said Beau's name in front of the other yet. You will.",
    'She says Tesfaye would have liked how it ended. Then she says he would have cheated a little. Then she laughs, for the first time since the mine.',
  ];
  const p = A.Game.player(g), gold = p.inventory.gold;
  C.state(g);
  assert.equal(s.romance, null);
  assert.equal(s.choices.romance, undefined);
  assert.equal(s.choiceEffects.romance, undefined);
  assert.deepEqual(s.epilogue, ['Other campaign outcome.', familyEnding]);
  assert.equal(s.stage, 14);
  assert.equal(s.ending, 'hero');
  assert.equal(s.aff.selene, 8);
  assert.equal(s.choices.q7_flood, 'wait');
  assert.equal(p.inventory.gold, gold);
  const after = JSON.stringify(s);
  C.state(g);
  assert.equal(JSON.stringify(s), after, 'migration is idempotent');
  C.save(g);
  assert.equal(A.Save.loadMeta().c3.romance, null);
  const rejected = C.applyOption(g, 'romance', { id: 'romance_selene', romance: 'selene', aff: { selene: 100 } });
  assert(rejected.error, 'a stale option cannot restore the retired route');
  assert.equal(s.aff.selene, 8);
  assert.equal(s.romance, null);
}

// Exercise the actual playback functions, replacing only drawing and audio output.
for (const file of ['js/ui/campaign_ui.js', 'js/ui/campaign3_ui.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { filename: file });
}
const voices = [], text = [], menus = [];
A.Music = { speakCampaign: (who, key, n) => voices.push({ who, key, n }), stopVoice() {} };
A.DialogueBox = { showText: (scene, game, speaker, line, next) => { text.push(line); next(); } };
A.Campaign3UI.pickModal = (scene, game, beat, opts, onPick) => {
  menus.push(opts.map(o => o.id));
  onPick(opts.find(o => o.romance === 'cassian') || opts.find(o => o.id === 'none'));
};
function play(g, beat) {
  voices.length = text.length = menus.length = 0;
  let completed = 0;
  A.Campaign3UI.playBeat({}, g, beat, () => completed++);
  assert.equal(completed, 1, 'the cutscene continues exactly once');
}
const legacyWrapper = { c3: true, who: 'selene', key: 'q9_romance', dynamic: 'romance' };
{
  const g = fresh();
  recruit(g, 'selene', 99);
  recruit(g, 'dorran');
  play(g, legacyWrapper);
  assert.deepEqual(voices, [], 'the old wrapper never speaks Delphine before eligibility');
  assert.deepEqual(text, []);
  assert.deepEqual(menus, []);
  for (const key of ['q9_romance', 'q9_romance_yes', 'q9_romance_no']) {
    play(g, { c3: true, who: 'selene', key, lines: [{ t: 'Cached romantic dialogue.' }] });
    assert.deepEqual(voices, []);
    assert.deepEqual(text, []);
  }
  play(g, family(g)[0]);
  assert.deepEqual(voices, [{ who: 'selene', key: 'q9_family', n: 1 }]);
  assert(text[0].startsWith("You're family, honey."));
  assert.equal(C.state(g).romance, null);
}
{
  const g = fresh();
  recruit(g, 'selene', 99);
  C.kill(g, 'selene');
  recruit(g, 'cassian', 5);
  play(g, legacyWrapper);
  assert.deepEqual(voices, [], 'approval no longer causes a confession');
  assert.equal(C.state(g).romance, null);
  C.state(g).romance = 'cassian'; // A valid, previously accepted legacy relationship.
  play(g, legacyWrapper);
  assert.deepEqual(voices, [], 'an existing relationship does not replay the old wrapper');
  recruit(g, 'amara', 5);
  play(g, { c3: true, who: 'amara', key: 'q9_romance', dynamic: 'romance', quiet: true });
  assert.deepEqual(voices, [], 'the old Q13 wrapper also respects the existing relationship');
  assert(!C.arrivalBeats(g, 13).some(b => b.dynamic));
  assert.equal(C.state(g).romance, 'cassian');
}
console.log('Delphine family-only checks passed: both player sexes, widowhood, affinity, absence, old saves, cached dialogue, stale choices and real UI playback.');
