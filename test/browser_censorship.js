/* global ADV, __game */
'use strict';
const { chromium, webkit } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const dir = 'test/reports/censorship'; fs.mkdirSync(dir, { recursive: true });
(async () => {
  const engine = process.argv.includes('--webkit') ? webkit : chromium;
  const browser = await engine.launch({ headless: true }), results = [];
  try {
    for (const locked of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 760 } });
      if (locked) await context.route('**/js/core/release_config.js*', async route => {
        await route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync('tools/crazygames/release_config.js', 'utf8') });
      });
      if (locked) await context.route('https://sdk.crazygames.com/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.CrazyGames={SDK:{init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){}}}};' }));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:8734/index.html');
      await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
      assert.equal(await page.evaluate(() => ADV.Censorship.enabled()), locked);
      if (!locked) {
        const point = await page.evaluate(() => {
          const t = __game.scene.getScene('Title').children.list.find(o => o.text === 'Censor swearing: off');
          const b = t.getBounds(); return { x: b.centerX, y: b.centerY };
        });
        await page.mouse.click(point.x, point.y);
        assert(await page.evaluate(() => ADV.Censorship.enabled()));
      } else {
        await page.evaluate(() => { ADV.Prefs.set({ censorProfanity: false }); ADV.Censorship.toggle(); });
        assert(await page.evaluate(() => ADV.Censorship.enabled()));
      }
      const textCheck = await page.evaluate(() => {
        const scene = __game.scene.getScene('Title');
        const t = scene.add.text(100, 185, 'Fuck this bullshit. The assassin rehearsed.');
        const first = t.text; t.setText('Shit!'); const updated = t.text; t.destroy();
        return { first, updated };
      });
      assert.equal(textCheck.first, '**** this ********. The assassin rehearsed.');
      assert.equal(textCheck.updated, '****!');
      await page.reload(); await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
      assert(await page.evaluate(() => ADV.Censorship.enabled()), 'preference survives reload');
      await page.evaluate(() => {
        const game = ADV.Game.newGame({ seed: 1609, name: 'Test Ward', sex: 'f' });
        ADV.Conversation.assign(ADV.Game.player(game), 'F01');
        ADV.Game.applyPatch(game); game.meta.patchNotice = null;
        game.tutorial = { step: 'done' }; game.meta.leadershipReminderSeen = ['leadership_1', 'leadership_2', 'leadership_3'];
        __game.scene.getScene('Title').registry.set('game', game);
        __game.scene.stop('Title'); __game.scene.start('Town');
      });
      await page.waitForFunction(() => __game.scene.isActive('Town'));
      await page.waitForFunction(() => !__game.scene.getScene('Town')._arrivalPending);
      await page.evaluate(() => { ADV.Tutor.clear(__game.scene.getScene('Town')); __game.scene.getScene('Town').openPanel('settings'); });
      await page.screenshot({ path: `${dir}/${engine.name()}-settings-${locked ? 'locked' : 'optional'}.png` });
      assert.equal(await page.evaluate(() => __game.scene.getScene('Town').currentPanel), 'settings');
      const leaks = await page.evaluate(async () => {
        const scene = __game.scene.getScene('Town'), game = scene.g();
        const box = ADV.DialogueBox.showText(scene, game, ADV.Game.player(game), 'Fucking hell. Keep moving.', () => {});
        const observed = [];
        for (let i = 0; i < 25; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          observed.push(...scene.children.list.filter(o => o.type === 'Text' && o.depth === 904).map(o => o.text));
        }
        box.completeText(); box.close();
        return observed.filter(t => /fuc|hell/i.test(t));
      });
      assert.deepEqual(leaks, [], 'typewriter never reveals a partial profanity');
      assert.deepEqual(errors, []);
      results.push({ locked, errors, textCheck });
      await context.close();
    }
    // The phone's DOM More sheet offers the same persisted preference.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8734/index.html');
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Censor swearing: off', exact: true }).click();
    await page.getByRole('button', { name: 'Censor swearing: on', exact: true }).waitFor();
    await page.screenshot({ path: `${dir}/${engine.name()}-phone-more.png` });
    await page.getByRole('button', { name: 'Close More', exact: true }).click();
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Censor swearing: on', exact: true }).waitFor();
    await context.close();
    fs.writeFileSync(`${dir}/browser-${engine.name()}.json`, JSON.stringify(results, null, 2));
    console.log(`${engine.name()}: desktop settings, forced portal policy, persistence, typewriter masking and phone More sheet passed.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
