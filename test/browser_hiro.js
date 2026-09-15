// Hiro as an NPC in the real scenes: his party on the apply panel, his line
// (cues stripped) and his clip path, the reputation-15 refusal.
'use strict';
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const SHOT = (n) => path.join('/tmp/shots', n + '.png');
(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = []; const voices = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('request', r => { if (/audio\/vo\//.test(r.url())) voices.push(r.url()); });
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  const checks = []; const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };
  const texts = () => page.evaluate(() => window.__game.scene.getScene('Town').children.list.filter(o => o.text).map(o => o.text).join(' | '));
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 99, name: 'Sable', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] });
    game.tutorial = { step: 'done' };
    const p = ADV.Game.player(game); p.questsCompleted = 2;
    ADV.World.tick(game.world, game.rng, { playerQuested: true });
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.stop('Title'); window.__game.scene.start('Town');
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__game.scene.getScene('Town').openPanel('apply'));
  await page.waitForTimeout(400);
  let t = await texts();
  ok(/Hiro's party/.test(t) && /4\/5/.test(t), "Hiro's party is hiring with one seat open");
  await page.screenshot({ path: SHOT('h01_apply') });
  // talk to him from the relationships panel
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const game = sc.registry.get('game'); const h = ADV.Hiro.npc(game.world); ADV.Panels.personDialog(sc, h); });
  await page.waitForTimeout(900);
  t = await texts();
  ok(/Hiro/.test(t) && !/\[(tired|sighs|sad)\]/.test(t), 'his line shows without the delivery cue');
  ok(voices.some(u => /audio\/vo\/HIRO\//.test(u)), 'his clip was requested: ' + (voices.find(u => /HIRO/.test(u)) || 'none'));
  await page.screenshot({ path: SHOT('h02_speaks') });
  const canvas = await page.$('canvas'); const box = await canvas.boundingBox();
  const scale = Math.min(box.width / 1280, box.height / 760); const ox = box.x + (box.width - 1280 * scale) / 2, oy = box.y + (box.height - 760 * scale) / 2;
  const click = async (x, y) => { await page.mouse.click(ox + x * scale, oy + y * scale); await page.waitForTimeout(300); };
  await click(640, 690); await click(640, 690); await page.waitForTimeout(400);
  // make him Friendly and propose with a low reputation
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const game = sc.registry.get('game'); const h = ADV.Hiro.npc(game.world); const p = ADV.Game.player(game); ADV.Courtship.recordShared(game.world, [h.id, p.id]); ADV.Courtship.recordShared(game.world, [h.id, p.id]); sc.children.list.filter(o => o.depth >= 900).forEach(o => o.destroy()); ADV.Panels.personDialog(sc, h); });
  await page.waitForTimeout(900);
  if (/On family/.test(await texts())) { await click(640, 419); await page.waitForTimeout(900); }   // the one-time family explainer
  await click(640, 690); await click(640, 690); await page.waitForTimeout(400);
  t = await texts();
  ok(/Propose/.test(t), 'after two shared quests she may propose');
  const pos = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const b = sc.children.list.find(o => o.text && /^Propose$/.test(o.text)); return b ? { x: b.x, y: b.y } : null; });
  await click(pos.x, pos.y); await page.waitForTimeout(900);
  await click(640, 690); await click(640, 690); await page.waitForTimeout(400);
  t = await texts();
  ok(/reputation of 15 or better/.test(t), 'refused with the reputation notice');
  await page.screenshot({ path: SHOT('h03_refused') });
  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' || ') : ''));
  await browser.close();
  const fails = checks.filter(c => !c[0]).length;
  console.log(`\n==== ${checks.length - fails} passed, ${fails} failed ====`);
  process.exit(fails ? 1 : 0);
})();
