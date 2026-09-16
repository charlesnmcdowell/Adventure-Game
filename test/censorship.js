'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const H = require('./harness');
globalThis.localStorage = H.memBackend();
const A = H.load(), C = A.Censorship;
assert.equal(C.enabled(), false, 'new website installs keep the original language');
A.Prefs.set({ censorProfanity: true });
assert.equal(C.enabled(), true);
assert.equal(JSON.parse(localStorage.getItem('adv:prefs')).censorProfanity, true);
assert.equal(C.text('Fuck this bullshit. SHITTIER. Motherfucker!'), '**** this ********. ********. ************!');
assert.equal(C.text('assassin class assistance Scunthorpe cockatrice hoarse rehearsed'), 'assassin class assistance Scunthorpe cockatrice hoarse rehearsed');
assert.equal(C.text('fuck, fuck; fucking\nshit!'), '****, ****; *******\n****!');
assert.deepEqual(C.text(['damn', 'Hello']), ['****', 'Hello']);
const authored = A.DATA.DIALOGUE.M01.general[0];
vm.runInThisContext(fs.readFileSync('js/ui/narrator.js', 'utf8'));
const files = fs.readdirSync('audio/vo', { recursive: true }).filter(f => f.endsWith('.mp3')).map(f => 'audio/vo/' + f.split(path.sep).join('/'));
const unknown = files.filter(f => C.voiceText(f) === null);
const explicit = files.filter(f => C.contains(C.voiceText(f)));
assert(explicit.length > 100, 'real authored swearing is covered');
for (const file of explicit) assert.equal(C.voiceAllowed(file), false, file);
assert.equal(C.voiceAllowed('audio/vo/campaign/new_speaker/unknown_1.mp3'), false, 'unmapped clips cannot leak through');
assert.equal(C.voiceAllowed('audio/vo/M01/general_1.mp3'), true, 'clean voices remain available');
assert.equal(C.voiceAllowed('audio/vo/campaign/aldric/endcard_heading_restored_1.mp3'), true, 'finale narration remains available');
assert.equal(A.DATA.DIALOGUE.M01.general[0], authored, 'no source dialogue mutations');
A.Prefs.set({ censorProfanity: false });
for (const file of explicit) assert.equal(C.voiceAllowed(file), true, 'off restores original voice availability');
assert.equal(C.text('fuck'), 'fuck');

// Force-on is a build policy, not a preference or URL flag. Test an actual
// alternate release-config source with the same prefs/censorship modules.
const storage = H.memBackend(); storage.setItem('adv:prefs', JSON.stringify({ censorProfanity: false }));
const portal = vm.createContext({ ADV: { DATA: A.DATA }, localStorage: storage });
for (const file of ['release_config', 'prefs', 'censorship']) {
  let code = fs.readFileSync('js/core/' + file + '.js', 'utf8');
  if (file === 'release_config') code = fs.readFileSync('tools/crazygames/release_config.js', 'utf8');
  vm.runInContext(code, portal);
}
assert(portal.ADV.Censorship.locked());
portal.ADV.Prefs.set({ censorProfanity: false }); portal.ADV.Censorship.toggle();
assert.equal(portal.ADV.Prefs.get().censorProfanity, true);
assert.equal(portal.ADV.Censorship.text('shit'), '****');
assert(Object.isFrozen(portal.ADV.Release));
assert.equal(Object.getOwnPropertyDescriptor(portal.ADV, 'Release').writable, false);

// Exercise the real centralized audio player, including resume/replay/fallback.
globalThis.document = { hidden: false, addEventListener() {} };
const realInterval = globalThis.setInterval; globalThis.setInterval = () => null;
class AudioStub {
  constructor(src) { this.src = src; this.paused = true; this.handlers = {}; this.plays = 0; }
  addEventListener(event, fn) { (this.handlers[event] ||= []).push(fn); }
  play() { this.plays++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
  removeAttribute() {}
}
globalThis.Audio = AudioStub;
vm.runInThisContext(fs.readFileSync('js/ui/music.js', 'utf8'));
const M = A.Music;
const dirty = explicit.find(p => /^audio\/vo\/[MF]\d+\//.test(p));
const [, pid, band, index] = dirty.match(/audio\/vo\/([^/]+)\/(.*)_(\d+)\.mp3$/);
M.speakFile(pid, band, Number(index)); const playing = M.voiceEl;
assert(playing && playing.plays === 1);
A.Prefs.set({ censorProfanity: true });
assert.equal(M.voiceEl, null); assert(playing.paused, 'enabling stops an already playing explicit line');
assert.equal(M.replayVoice(playing), false);
M.speakFile(pid, band, Number(index)); assert.equal(M.voiceEl, null);
M.speakFile(pid, band, Number(index), 'legacy'); assert.equal(M.voiceEl, null, 'tagged fallback has the same censorship');
M.toggleMute(); M.toggleMute(); M.wake(); assert.equal(M.voiceEl, null);
M.speakFile('M01', 'general', 1); assert.equal(M.voiceEl.plays, 1);
M.stopVoice(); globalThis.setInterval = realInterval;
fs.mkdirSync('test/reports/censorship', { recursive: true });
fs.writeFileSync('test/reports/censorship/voice-coverage.json', JSON.stringify({ clips: files.length, censored: explicit.length, unknown }, null, 2));
console.log(`Censorship passed: default/persistence, text boundaries, build lock, voice stop/replay/resume. ${explicit.length} explicit clips; ${unknown.length} unmapped clips muted when enabled.`);
