/* global ADV, __game */
'use strict';
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:8734/dist/crazygames-candidate-20260916/';
const dir = 'test/reports/censorship';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 821, height: 462 }, deviceScaleFactor: 1 });
    const page = await context.newPage(), errors = [], missing = [], requested = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requested.push(request.url()));
    page.on('response', response => { if (response.status() >= 400) missing.push({ status: response.status(), url: response.url() }); });
    const cdp = await context.newCDPSession(page); await cdp.send('Network.enable');
    let finishedBytes = 0;
    cdp.on('Network.loadingFinished', row => { finishedBytes += row.encodedDataLength; });
    const started = Date.now();
    await page.goto(base);
    await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
    const initial = await page.evaluate(() => ({ target: ADV.Release.target, locked: ADV.Censorship.locked(), enabled: ADV.Censorship.enabled(), sdk: ADV.Portal.ready, sdkError: ADV.Portal.error, fullscreen: ADV.Display.supported() }));
    assert.equal(initial.target, 'crazygames'); assert(initial.locked && initial.enabled);
    assert(initial.sdk, 'actual SDK initializes on localhost: ' + initial.sdkError);
    assert.equal(initial.fullscreen, false);
    await page.evaluate(() => {
      ADV.Prefs.set({ censorProfanity: false }); ADV.Censorship.toggle();
      const game = ADV.Game.newGame({ seed: 160916, name: 'Portal Ward', sex: 'f', startingSkills: ['bulwark', 'fire_bolt', 'necromancy'] });
      ADV.Conversation.assign(ADV.Game.player(game), 'F01'); ADV.Game.applyPatch(game); game.meta.patchNotice = null;
      game.tutorial = { step: 'done' }; ADV.Game.player(game).inventory.gold = 1000;
      __game.scene.getScene('Title').registry.set('game', game); __game.scene.stop('Title'); __game.scene.start('Town');
    });
    await page.waitForFunction(() => __game.scene.isActive('Town') && !__game.scene.getScene('Town')._arrivalPending);
    const coldStartToTownMs = Date.now() - started;
    const completedResponseBytesAtTown = finishedBytes;
    assert(await page.evaluate(() => ADV.Censorship.enabled()));
    const featureCheck = await page.evaluate(() => {
      const town = __game.scene.getScene('Town');
      town.openPanel('settings');
      return { supportDue: ADV.SupportUI.due({ meta: { c3: { stage: 2 } } }), fullscreenButton: !!town.fsBtn };
    });
    assert.equal(featureCheck.supportDue, false); assert.equal(featureCheck.fullscreenButton, false);
    await page.screenshot({ path: `${dir}/crazygames-821-settings.png` });
    // Real external audio, started by a user gesture. No stubbed CDN or media.
    await page.evaluate(() => {
      const button = document.createElement('button'); button.id = 'voice-check'; button.textContent = 'Voice check';
      button.style.cssText = 'position:fixed;top:0;left:0;z-index:999999';
      button.onclick = () => { ADV.Music.speakFile('M01', 'general', 1); button.remove(); };
      document.body.append(button);
    });
    await page.locator('#voice-check').click();
    await page.waitForFunction(() => ADV.Music.voiceEl?.currentTime > 0.05);
    const voice = await page.evaluate(() => ({ url: ADV.Music.voiceEl.src, error: ADV.Music.voiceEl.__playError }));
    assert(voice.url.startsWith('https://charlesnmcdowell.github.io/Adventure-Game/audio/vo/'));
    assert.equal(voice.error, null);
    // Newly recorded Mzee lines are intentionally bundled until the host has them.
    await page.evaluate(() => ADV.Music.speakCampaign('thornwise', 'q6_grove_mzee', 1));
    await page.waitForFunction(() => ADV.Music.voiceEl?.currentTime > 0.05);
    const localVoice = await page.evaluate(() => ({ url: ADV.Music.voiceEl.src, error: ADV.Music.voiceEl.__playError }));
    assert(localVoice.url.startsWith(base + 'audio/vo/campaign/thornwise/'));
    assert.equal(localVoice.error, null);
    const blocked = await page.evaluate(() => {
      const entry = Object.entries(ADV.DATA.DIALOGUE).find(([, p]) => p.hatred?.some(ADV.Censorship.contains));
      const index = entry[1].hatred.findIndex(ADV.Censorship.contains) + 1;
      ADV.Music.speakFile(entry[0], 'hatred', index);
      return { path: '/' + entry[0] + '/hatred_' + index + '.mp3', silent: ADV.Music.voiceEl === null };
    });
    assert(blocked.silent); assert(!requested.some(url => url.includes(blocked.path)));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    const report = { initial, featureCheck, coldStartToTownMs, completedResponseBytesAtTown,
      measurement: 'Fresh desktop browser with scripted jump past creation to Town. Completed responses only; not a certified initial-load or mobile-network measurement.', voice, localVoice, blocked, errors, missing };
    fs.writeFileSync(`${dir}/crazygames-browser.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
