// The Varenholm's Gate score (request: no battle themes under the dialogue, music
// under the voices): a scored run keeps the quest underscore on every screen and
// only swaps to the battle cue inside a fight; dreams and the ending are cues laid
// over it; the music channel ducks while a voice clip plays.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const H = require('./harness');

const ADV = H.load();
const C3 = ADV.Campaign3;

// ---- a tiny DOM for music.js ------------------------------------------------
const made = [];
class FakeAudio {
  constructor(src) { this.src = src; this.paused = true; this.ended = false; this.volume = 1; this.loop = false; this.currentTime = 0; this._h = {}; made.push(this); }
  addEventListener(ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); }
  removeEventListener() {}
  fire(ev) { for (const fn of this._h[ev] || []) fn({}); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
  removeAttribute() {}
}
const timers = [];
globalThis.Audio = FakeAudio;
globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
globalThis.localStorage = H.memBackend();
const realSetInterval = globalThis.setInterval, realClearInterval = globalThis.clearInterval;
globalThis.setInterval = (fn) => { const t = { fn, dead: false }; timers.push(t); return t; };
globalThis.clearInterval = (t) => { if (t) t.dead = true; };
const settle = () => { for (let i = 0; i < 200; i++) for (const t of timers) if (!t.dead) t.fn(); };
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'ui', 'music.js'), 'utf8'), { filename: 'js/ui/music.js' });
const M = ADV.Music;
const name = () => M.el && M.el.__name;
const playing = () => made.filter(a => !a.paused && a.__wantPlay).map(a => a.__name || a.src);

let n = 0;
const ok = (c, msg) => { assert.ok(c, msg); n++; };

// ---- musicFor / hubMusic ----------------------------------------------------
const q = k => C3.buildQuest({ meta: {} }, k);
ok(C3.musicFor(q(1)).quest === 'vg_lanternhold' && C3.musicFor(q(1)).combat === 'vg_battle' && C3.musicFor(q(1)).boss === 'vg_battle', 'Q1: road battle cue, mid-quest bosses use it too');
ok(C3.musicFor(q(7)).combat === 'vg_battle' && C3.musicFor(q(8)).combat === 'vg_battle_city', 'the city battle cue starts at Q8');
ok(C3.musicFor(q(5)).combat === 'vg_battle_bandit_camp' && C3.musicFor(q(5)).boss === 'vg_battle_bandit_camp', 'the Bandit Camp and Gorruk have their own battle hymn');
ok(C3.musicFor(q(4)).combat === 'vg_battle' && C3.musicFor(q(6)).combat === 'vg_battle', 'the Bandit Camp override does not leak into neighboring quests');
ok(C3.musicFor(q(14)).quest === 'vg_temple' && C3.musicFor(q(14)).boss === 'vg_boss', 'Q14: temple underscore, Kolade for the altar');
for (let k = 1; k <= 14; k++) ok(ADV.DATA.CAMPAIGN3_MUSIC.quest[k], 'every quest has an underscore: ' + k);
ok(C3.musicFor({ campaign: true, n: 3 }) === null && C3.musicFor(null) === null, 'other content is not scored');
{ const M = ADV.DATA.CAMPAIGN3_MUSIC;
  const files = Object.values(M.quest).concat(Object.values(M.combat), Object.values(M.combatByQuest || {}), [M.boss, M.dream, M.ending, M.camp]);
  for (const f of new Set(files)) ok(fs.existsSync(path.join(__dirname, '..', 'audio', 'music', f + '.mp3')), 'score file shipped: ' + f); }
const game = { meta: {} };
ok(C3.hubMusic(game) === null, 'hub keeps the home theme before the campaign starts');
C3.state(game).started = true;
ok(C3.hubMusic(game) === 'vg_camp', 'hub plays the camp cue while the road is open');
C3.state(game).ending = 'hero';
ok(C3.hubMusic(game) === null, 'and the home theme again once it is finished');

// ---- a scored run -------------------------------------------------------------
M.play('town');
ok(name() === 'edwyn2', 'home theme in town');
M.startRun(false, C3.musicFor(q(3)));
ok(name() === 'vg_thornbury' && M.el.loop, 'quest underscore starts with the run and loops');
ok(playing().length === 1, 'only one music track sounds');
M.play('quest');
const questEl = M.el;
questEl.currentTime = 41;
ok(name() === 'vg_thornbury', 'quest screens keep the underscore');
M.play('combat');
ok(name() === 'vg_battle', 'the battle cue plays only inside a fight');
ok(questEl.paused && playing().length === 1, 'the underscore pauses under the fight');
M.play('quest');
ok(M.el === questEl && !questEl.paused && questEl.currentTime === 41, 'after the fight the underscore resumes where it left off');
M.play('boss');
ok(name() === 'vg_battle', 'a mid-campaign boss uses the road battle cue');
M.play('quest');
M.cue('vg_dream');
ok(name() === 'vg_dream' && M.cued === 'vg_dream', 'a dream cue overrides the underscore');
M.play('quest');
ok(name() === 'vg_thornbury' && !M.cued, 'a scene change clears the cue');
M.cue('vg_dream'); M.cue(null);
ok(M.el === questEl && !questEl.paused, 'clearing the cue brings the underscore back');
M.play('town');
ok(name() === 'edwyn2' && !M.run && questEl.paused, 'town ends the run and returns to the home theme');

// A persisted musicStarted flag is not an in-memory audio session. The scene
// entry helper restores the correct quest and switches when its chapter changes.
M.playQuest(q(3));
ok(name() === 'vg_thornbury' && M.run.story, 'restore Q3 after town/reload with its own score');
M.playQuest(q(3), 'combat');
ok(name() === 'vg_battle', 'restored Q3 combat uses its campaign battle cue');
M.playQuest(q(3));
ok(name() === 'vg_thornbury', 'return from an ambush restores exploration music');
M.playQuest(q(8), 'combat');
ok(name() === 'vg_battle_city', 'a different quest restores the correct half of the score');
M.play('town');
M.playQuest(q(14), 'boss');
ok(name() === 'vg_boss', 'a resumed final fight restores the boss score without an embark screen');
M.play('town');
M.playQuest(q(5), 'combat');
ok(name() === 'vg_battle_bandit_camp', 'bandit fights actually select the new audio');
M.playQuest(q(5));
ok(name() === 'vg_gnashing_wood', 'bandit dialogue returns to its quieter forest underscore');
M.playQuest(q(5), 'boss');
ok(name() === 'vg_battle_bandit_camp', 'Gorruk uses the same region hymn');
M.play('town');

// the last quest
M.startRun(true, C3.musicFor(q(14)));
ok(name() === 'vg_temple', 'Q14 opens on the temple underscore, not a boss track');
M.play('combat');
ok(name() === 'vg_battle_city', 'the mirror fights use the city battle cue');
M.play('boss');
ok(name() === 'vg_boss', 'Kolade gets his theme');
M.play('town');

// the ending cue in town (no run) returns to the home theme when cleared
M.cue('vg_ending');
ok(name() === 'vg_ending', 'the epilogue plays the ending cue');
M.cue(null);
ok(name() === 'edwyn2' && !M.el.paused, 'and the home theme comes back after the card');

// the hub override
M.homeOverride = 'vg_camp';
M.play('town');
ok(name() === 'vg_camp' && M.homeEl === M.el && M.el.loop, 'the hub swaps to the camp cue while the campaign is under way');
M.homeOverride = null;
M.play('town');
ok(name() === 'edwyn2', 'and back to the home theme when the override lifts');

// ---- legacy runs are untouched ------------------------------------------------
M.startRun(false);
const legacy = name();
ok(legacy && !M.run.story, 'an ordinary quest still picks one track from the pools');
M.play('combat');
ok(name() === legacy, 'and keeps it through the fight');
M.play('town');

// ---- ducking --------------------------------------------------------------------
M.startRun(false, C3.musicFor(q(2)));
settle();
const full = M.el.volume;
ok(Math.abs(full - M.volume) < 1e-9, 'underscore at full music volume before anyone speaks');
M.speakCampaign('aldric', 'q1_wake', 1);
settle();
ok(Math.abs(M.el.volume - M.volume * M.duck) < 1e-9, 'music ducks while a line plays');
ok(M.voiceEl.volume === 1, 'the voice itself is not ducked');
M.voiceEl.fire('ended');
settle();
ok(Math.abs(M.el.volume - M.volume) < 1e-9, 'music comes back up when the line ends');
M.speakCampaign('aldric', 'q1_wake', 2);
settle();
M.play('combat');
settle();
ok(Math.abs(M.el.volume - M.volume * M.duck) < 1e-9, 'a track that starts under a line starts ducked');
M.stopVoice();
settle();
ok(Math.abs(M.el.volume - M.volume) < 1e-9, 'stopping the voice restores the music');
M.play('town');

globalThis.setInterval = realSetInterval; globalThis.clearInterval = realClearInterval;
console.log('music_score: ' + n + ' checks OK');
