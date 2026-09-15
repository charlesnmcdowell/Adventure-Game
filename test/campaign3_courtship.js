'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const { load, memBackend } = require('./harness');
const A = load(), C = A.Campaign3, routes = Object.keys(A.DATA.CAMPAIGN3_COURTSHIP);
function fresh(sex = 'f') {
  A.Save.setBackend(memBackend());
  const g = A.Game.newGame({ seed: 914, name: 'Ward', sex, personalityId: sex === 'f' ? 'F01' : 'M01' });
  C.state(g).stage = 6;
  return g;
}
function meet(g, who) { C.recruit(g, who); C.state(g).aff[who] = 3; }
function talk(g, who) {
  const scene = C.personalConversation(g, who);
  assert(scene, 'a personal conversation is available');
  assert(C.finishConversation(g, who, scene.key));
  return scene;
}
function develop(g, who) {
  meet(g, who); talk(g, who); C.state(g).stage++;
  talk(g, who); assert(C.expressInterest(g, who)); C.state(g).stage++;
  assert(C.canOfferRomance(g, who));
}
for (const sex of ['f', 'm']) for (const who of routes) {
  const g = fresh(sex), s = C.state(g); meet(g, who); s.aff[who] = 99;
  assert.equal(C.dynamicOptions(g, 'romance').length, 0, 'approval alone is not courtship');
  assert(!C.expressInterest(g, who), 'interest needs personal familiarity');
  assert(C.applyOption(g, 'romance', { romance: who }).error, 'stale accept cannot bypass courtship');
  const first = talk(g, who), approval = C.aff(g, who);
  assert(!C.finishConversation(g, who, first.key), 'retry cannot count twice');
  assert.equal(C.aff(g, who), approval);
  g.world.questClock += 4;
  assert.equal(C.personalConversation(g, who), null, 'failed/repeated quests cannot advance campaign courtship');
  s.stage++;
  talk(g, who);
  assert.equal(C.dynamicOptions(g, 'romance').length, 0, 'two friendly talks are still friendship');
  assert(C.expressInterest(g, who));
  assert(!C.canOfferRomance(g, who), 'no confession on the same occasion as interest');
  s.stage++;
  C.dismiss(g, who);
  assert(C.canOfferRomance(g, who), 'benched companions are accessible at the inn');
  g.quest = { quest: { campaign3: true } };
  assert(!C.canOfferRomance(g, who), 'no private courtship in battle or on the road');
  g.quest = null;
  assert(C.answerCourtship(g, who, 'friends'));
  assert.equal(C.courtshipState(g, who).status, 'declined');
  assert(!C.canOfferRomance(g, who));
  assert(!C.expressInterest(g, who), 'cannot immediately undo refusal on the same evening');
  s.stage++;
  assert(!C.canOfferRomance(g, who), 'refusal persists across later quests');
  assert(C.expressInterest(g, who), 'only explicit player interest can reopen');
  s.stage++;
  assert(C.answerCourtship(g, who, 'later'));
  s.stage++;
  assert(!C.canOfferRomance(g, who), 'deferral is also remembered');
  assert(C.expressInterest(g, who)); s.stage++;
  assert(C.answerCourtship(g, who, 'yes'));
  assert.equal(s.romance, who);
  C.save(g);
  assert.equal(A.Save.loadMeta().c3.courtship[who].status, 'established');
  const snapshot = JSON.stringify(s); C.state(g); assert.equal(JSON.stringify(s), snapshot);
}
for (const who of ['selene', 'amara']) {
  const g = fresh(); meet(g, who); C.state(g).aff[who] = 99;
  assert.equal(C.personalConversation(g, who), null);
  assert(!C.expressInterest(g, who));
  assert(C.applyOption(g, 'romance', { romance: who }).error);
}
for (const who of routes.concat('amara')) {
  const g = fresh(), s = C.state(g); meet(g, who);
  s.romance = who; delete s.courtship;
  s.epilogue = ['Unrelated outcome.', A.DATA.CAMPAIGN3_OLD_ROMANCE_ENDINGS[who].line];
  C.state(g);
  assert.equal(s.romance, who, 'valid legacy relationships survive');
  assert.equal(C.courtshipState(g, who).status, 'established');
  assert.equal(C.dynamicOptions(g, 'romance').length, 0);
  assert.deepEqual(s.epilogue, ['Unrelated outcome.', A.DATA.CAMPAIGN3_EPILOGUE.romance[who].line]);
}
for (const exit of ['kill', 'gone']) {
  const g = fresh(); develop(g, 'ithrel'); C[exit](g, 'ithrel');
  assert(!C.canOfferRomance(g, 'ithrel')); assert(!C.answerCourtship(g, 'ithrel', 'yes'));
}
{
  const g = fresh(), s = C.state(g); develop(g, 'cassian');
  s.aff.cassian = -1; assert(!C.canOfferRomance(g, 'cassian'));
  s.aff.cassian = 3; s.romance = 'ilvara'; assert(!C.canOfferRomance(g, 'cassian'));
}
{
  const g = fresh(), s = C.state(g); meet(g, 'faelen'); s.stage = 14; s.ending = 'hero';
  talk(g, 'faelen'); g.world.questClock++;
  talk(g, 'faelen'); assert(C.expressInterest(g, 'faelen'));
  assert(!C.canOfferRomance(g, 'faelen')); g.world.questClock++;
  assert(C.answerCourtship(g, 'faelen', 'yes'));
  assert(s.epilogue.some(p => p.includes('Kaito takes you')), 'late courtship refreshes the epilogue');
}

// Exercise the real UI dispatch, with only graphics/audio replaced by doubles.
for (const file of ['js/ui/campaign_ui.js', 'js/ui/campaign3_ui.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { filename: file });
const voices = [], menus = [];
A.Music = { speakCampaign: (who, key, n) => voices.push({ who, key, n }), stopVoice() {} };
A.DialogueBox = { showText: (scene, game, speaker, line, next) => next() };
let picks = [];
A.Campaign3UI.pickModal = (scene, game, beat, opts, choose) => {
  menus.push(opts.map(o => o.id));
  const id = picks.shift(), opt = opts.find(o => o.id === id);
  assert(opt, `expected UI option ${id}, got ${opts.map(o => o.id)}`); choose(opt);
};
for (const answer of ['yes', 'later', 'friends']) {
  const g = fresh();
  for (const who of routes) develop(g, who);
  voices.length = menus.length = 0; picks = ['ithrel', 'offer', answer, 'close'];
  let done = 0;
  A.Campaign3UI.innConversations({}, g, () => done++);
  assert.equal(done, 1); assert.equal(picks.length, 0);
  assert(voices.length && voices.every(v => v.who === 'ithrel'), 'only the selected companion speaks');
  assert.equal(voices.filter(v => v.key === 'q9_romance' && v.n === 1).length, 1);
  assert.equal(C.courtshipState(g, 'ithrel').status, { yes: 'established', later: 'deferred', friends: 'declined' }[answer]);
  assert(routes.filter(id => id !== 'ithrel').every(id => C.courtshipState(g, id).status === 'interested'), 'unselected routes are not rejected');
  for (const who of ['selene', 'amara', 'ithrel', 'wren_ward']) {
    voices.length = 0;
    A.Campaign3UI.playBeat({}, g, { who, key: 'q9_romance', dynamic: 'romance' }, () => {});
    A.Campaign3UI.playBeat({}, g, { who, key: 'q9_romance', lines: [{ t: 'Stale confession' }] }, () => {});
    assert.equal(voices.length, 0, 'saved unsolicited wrappers and lines stay silent');
  }
}
{
  const g = fresh(); meet(g, 'cassian'); picks = ['talk', 'continue', 'close'];
  A.Campaign3UI.privateConversation({}, g, 'cassian', () => {});
  assert.equal(C.courtshipState(g, 'cassian').talks.length, 1);
  assert.equal(C.courtshipState(g, 'cassian').status, 'friendship');
  C.state(g).stage++; picks = ['talk', 'continue', 'interest'];
  A.Campaign3UI.privateConversation({}, g, 'cassian', () => {});
  assert.equal(C.courtshipState(g, 'cassian').status, 'interested');
  assert(!C.canOfferRomance(g, 'cassian'));
}
console.log('Courtship passed: four routes, both player sexes, separate occasions, friendship, refusal, deferral, explicit reopening, legacy saves, death/departure, post-campaign progression and private UI playback.');
