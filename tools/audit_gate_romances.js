// Read-only game-state audit. All scenarios use fresh games and in-memory saves.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { load, memBackend } = require('../test/harness');
const A = load(), C = A.Campaign3;
function fresh(sex) {
  A.Save.setBackend(memBackend());
  return A.Game.newGame({ seed: 914, name: 'Ward', sex });
}
function choose(g, key, id) {
  const opt = C.options(g, key).find(o => o.id === id);
  if (!opt) throw new Error('Unavailable scenario option: ' + key + '/' + id);
  C.applyOption(g, key, opt);
}
const paths = {
  cassian: [['q2_cassian', 'join'], ['q8_halloran', 'yes'], ['q8_halvard', 'city']],
  ithrel: [['q3_ithrel', 'yes'], ['q5_ithrel_shot', 'shoot']],
  ilvara: [['q5_ilvara', 'defend'], ['q9_lysandra', 'deal']],
  faelen: [['q6_faelen', 'cut'], ['q8_door', 'faelen'], ['q8_halvard', 'pay']],
  amara: [['q11_amara', 'promise'], ['q13_amara_gate', 'join']],
};
const report = { scope: 'Varenholm Gate romance eligibility and playback; isolated state scenarios, not full playthroughs', routes: [] };
for (const sex of ['f', 'm']) for (const [id, choices] of Object.entries(paths)) {
  const g = fresh(sex);
  for (const [key, option] of choices) choose(g, key, option);
  const s = C.state(g);
  s.stage = id === 'amara' ? 13 : 9;
  const offered = () => C.dynamicOptions(g, 'romance').some(o => o.romance === id);
  const entry = { id, name: A.DATA.CAMPAIGN_CHARS[id].name, playerSex: sex, stage: s.stage,
    choices, affinity: C.aff(g, id), offeredWithoutCourtship: offered(), asked: s.asked };
  C.dismiss(g, id);
  entry.offeredWhileBenched = offered();
  report.routes.push(entry);
}
for (const file of ['js/ui/campaign_ui.js', 'js/ui/campaign3_ui.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { filename: file });
}
const voices = [], menus = [];
A.Music = { speakCampaign: (who, key, n) => voices.push({ who, key, n }), stopVoice() {} };
A.DialogueBox = { showText: (scene, game, speaker, text, next) => next() };
A.Campaign3UI.pickModal = (scene, game, beat, opts, onPick) => {
  menus.push({ optionIds: opts.map(o => o.id), declineLabel: opts.find(o => o.id === 'none')?.text });
  onPick(opts.find(o => o.id === 'none'));
};
const g = fresh('f');
for (const [key, option] of paths.ithrel) choose(g, key, option);
C.state(g).stage = 9;
function play(n) {
  const beat = { c3:true, dynamic:'romance', who:n===9?'selene':'amara', key:'q9_romance' }; // saved pre-fix wrapper
  let completed = false;
  A.Campaign3UI.playBeat({}, g, beat, () => { completed = true; });
  if (!completed) throw new Error('Playback did not finish');
}
play(9);
report.afterLegacyArrival = { romance: C.state(g).romance, choiceRecorded: C.state(g).choices.romance || null,
  itsukiStillEligible: C.dynamicOptions(g, 'romance').some(o => o.romance === 'ithrel') };
for (const [key, option] of paths.amara) choose(g, key, option);
C.state(g).stage = 13;
play(13);
report.playback = { menus, itsukiConfessions: voices.filter(v => v.who === 'ithrel' && v.key === 'q9_romance' && v.n === 1).length,
  confessionSpeakersBeforeSecondMenu: menus[1]?.optionIds.filter(id => id !== 'none') || [] };
report.writing = Object.entries(A.DATA.CAMPAIGN_CHARS).filter(([, c]) => c.campaign3 && c.romance).map(([id, c]) => ({
  id, name: c.name, description: c.desc,
  dialogue: Object.fromEntries(Object.entries(A.DATA.CAMPAIGN3_DIALOGUE.gate[id]).filter(([key]) => key.startsWith('q9_romance'))),
  epilogue: A.DATA.CAMPAIGN3_EPILOGUE.romance[id],
}));
const output = path.join(__dirname, '../docs/dialogue/GATE_ROMANCE_FIXED_2026-09-14.json');
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ cases: report.routes.length, offeredWithoutCourtship: report.routes.filter(r => r.offeredWithoutCourtship).length,
  afterLegacyArrival: report.afterLegacyArrival, playback: report.playback, output }, null, 2));
