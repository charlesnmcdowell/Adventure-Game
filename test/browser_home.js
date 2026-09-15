// Healer & druid pass Part D (browser): the six homes carry a living layer. Server on :8734.
//   node test/browser_home.js [port]
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SHOT = (n) => path.join('/tmp/shots', 'home_' + n + '.png');
fs.mkdirSync('/tmp/shots', { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

(async () => {
  const port = process.argv[2] || '8734';
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || /HomeLife failed/.test(m.text())) && !/Failed to load resource|audio|mp3|GL Driver|GroupMarker/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.goto(`http://localhost:${port}/index.html`); await page.waitForTimeout(1400);
  await page.evaluate(() => { window.__game.loop._min = 1000; });
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Sable', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['fire_bolt', 'spark', 'frost_touch'] });
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game); window.__G = game;
  });
  const show = async (id, phase, wx) => {
    await page.evaluate(([id, phase, wx]) => {
      const game = window.__G; const p = ADV.Game.player(game); p.homeId = id;
      ADV.Housing.timeOfDay = () => phase; if (ADV.Weather && ADV.Weather.force) ADV.Weather.force(wx);
      window.__game.scene.stop('Town'); window.__game.scene.stop('Title'); window.__game.scene.start('Town');
    }, [id, phase, wx]);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.time.timeScale = 10; sc.tweens.timeScale = 10; });
  };
  const until = (fnSrc, ms) => page.evaluate(async ([src, ms]) => { const fn = new Function('return (' + src + ')()'); const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await new Promise(r => setTimeout(r, 100)); } return fn(); }, [fnSrc, ms]);

  for (const [id, phase] of [['inn', 'day'], ['camp', 'day'], ['cottage', 'night'], ['brick', 'day'], ['mansion', 'evening'], ['castle', 'day']]) {
    await show(id, phase, id === 'inn' ? 'rain' : 'clear');
    // most actors enter over time (deer walk in, carriages arrive), so give the clock a moment
    await until(`() => { const sc = window.__game.scene.getScene('Town'); const h = sc.homeLifeActors; return h && h.actors.length >= 6; }`, 60000);
    const info = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const h = sc.homeLifeActors; return { id: h && h.id, n: h ? h.actors.length : 0, timers: h ? h.timers.length : 0 }; });
    ok(info.id === id && info.n >= 6, `${id} (${phase}): living layer with ${info.n} actors, ${info.timers} timers`);
    if (id === 'inn') {
      const wx = await page.evaluate(() => {
        const sc = window.__game.scene.getScene('Town'); const w = sc.weatherFx;
        const objs = (w && w._objs) || [];
        const drawn = objs.filter(o => o && o.setMask && o.type !== 'Container');
        return { kind: w && w.weather && w.weather.kind, n: drawn.length, masked: drawn.filter(o => o.mask).length, windows: (ADV.HousingArt.INN_WINDOWS || []).length };
      });
      ok(wx.kind === 'rain' && wx.n > 0 && wx.masked === wx.n, `the inn's rain is masked to the window panes (${wx.masked}/${wx.n} layers masked, ${wx.windows} windows)`);
      await page.screenshot({ path: SHOT('inn_rain') });
    }
    if (id === 'brick') {
      const corn = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const h = sc.homeLifeActors; let sway = 0; for (const a of h.actors) { if (sc.tweens.getTweensOf(a).some(t => t.data && t.data.some(d => d.key === 'angle'))) sway++; } return sway; });
      ok(corn >= 11, `${corn} garden actors carry a rotation tween (corn swaying, flowers turning)`);
    }
    if (id === 'mansion' || id === 'castle') {
      const got = await until(`() => { const sc = window.__game.scene.getScene('Town'); const h = sc.homeLifeActors; return h.actors.some(a => a.__wheels); }`, 40000);
      ok(got, `${id}: a carriage arrives`);
      if (id === 'mansion') { const staff = await until(`() => { const sc = window.__game.scene.getScene('Town'); const h = sc.homeLifeActors; return h.actors.filter(a => a.__legs && a.__legs.length === 2).length >= 1; }`, 30000); ok(staff, 'mansion: staff cross the porch with trays'); }
      if (id === 'castle') { const guards = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); return sc.homeLifeActors.actors.filter(a => a.__legs && a.__legs.length === 2).length; }); ok(guards >= 2, `castle: ${guards} figures on the ground (two guards + labourers)`); }
      await page.screenshot({ path: SHOT(id) });
    }
    if (id === 'cottage') {
      const owlish = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); return sc.homeLifeActors.actors.filter(a => a.__head).length; });
      ok(owlish >= 1, `cottage at night: owl / deer present (${owlish})`);
    }
    // repaint tears the old layer down
    const leak = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const before = sc.homeLifeActors; ADV.HousingArt.paint(sc, ADV.Housing.of(ADV.Game.player(window.__G)).id); return { dead: before.dead, gone: before.actors.length === 0, fresh: sc.homeLifeActors !== before && (sc.homeLifeActors.actors.length >= 1 || sc.homeLifeActors.timers.length >= 2) }; });
    ok(leak.dead && leak.gone && leak.fresh, `${id}: repaint destroys the old layer and builds a new one`);
  }

  const realErrors = errors.filter(e => !/Failed to load/.test(e));
  ok(realErrors.length === 0, 'no page errors', realErrors.slice(0, 3).join(' | '));
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
