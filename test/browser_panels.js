// Sweep every town panel and long-play combats for console errors.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = (n) => '/tmp/shots/' + n + '.png';

(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1200);
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const GW = 1280, GH = 760;
  const scale = Math.min(box.width / GW, box.height / GH);
  const ox = box.x + (box.width - GW * scale) / 2;
  const oy = box.y + (box.height - GH * scale) / 2;
  const click = async (gx, gy, ms) => { await page.mouse.click(ox + gx * scale, oy + gy * scale); await page.waitForTimeout(ms || 350); };

  // fresh start (may show Continue + New Life if a save exists)
  const hasSave = await page.evaluate(() => ADV.Save.hasSave());
  if (hasSave) {
    await click(640, 363); // Continue
  } else {
    await click(640, 363); // Begin -> cards
    for (let i = 0; i < 5; i++) await click(640, 300);
    await page.keyboard.type('Vale');
    await click(292, 400, 300);   // a face
    await click(640, 693, 600);   // Next — choose skills
    await click(284, 138, 250); await click(640, 182, 250); await click(996, 226, 250);
    await click(640, 709, 1200);  // Step into the world
  }
  await page.waitForTimeout(800);

  // menu buttons: x=292..462; y items starting 62+... computed: menu x=282+10, items y = 16+46=62 sequence +44 each (some locked +48)
  const menu = await page.evaluate(() => {
    // read back button positions from the scene? cheaper: recompute like the code does
    return null;
  });
  const panels = [
    ['store', 125], ['trainer', 169], ['apply', 213], ['roster', 305],
    ['rel', 349], ['faction', 393], ['journal', 437], ['codex', 481],
  ];
  // NOTE: y positions mirror buildMenu order: board 102, store 148, trainer 194,
  // apply 240, create ~286(locked→taller), roster 336, rel 383... locked create shifts by +4.
  for (const [name, y] of panels) {
    await click(377, y, 600);
    await page.screenshot({ path: SHOT('p_' + name) });
  }

  // open roster and click a person (dialogue box path)
  await click(377, 305, 500);
  await click(700, 100, 700); // first roster row
  await page.screenshot({ path: SHOT('p_dialogue') });
  await click(640, 660, 400); // dismiss dialogue
  await click(640, 400, 400); // dismiss anything else

  // relationships: click a person -> walk away
  await click(377, 349, 500);
  await click(650, 210, 700);
  await page.screenshot({ path: SHOT('p_person') });
  await click(640, 660, 500); // advance dialogue
  await click(640, 420, 500); // pick an option region (walk away likely mid-list)
  await page.screenshot({ path: SHOT('p_person2') });
  await click(640, 460, 400);

  // run three full quests via monkey clicks
  for (let qn = 0; qn < 2; qn++) {
    await click(377, 81, 500);           // quest board
    await click(700, 148, 600);           // first solo quest
    await click(510, 583, 900);           // set out
    for (let i = 0; i < 40; i++) {
      // click fight / verb area, action bar, targets, continue buttons — broad sweep
      await click(640, 442, 220);         // fight (quest scene) or nothing
      await click(120, 704, 180);         // first action
      await click(760, 170, 160);         // enemy slot 1
      await click(760, 330, 160);         // enemy slot 2
      await click(640, 452, 160);         // complete-flow continue button area
      await click(640, 640, 140);         // dismiss dialogue/toast
      const scene = await page.evaluate(() => {
        const g = window.__PHASER_GAME__;
        return null;
      });
      const inTown = await page.evaluate(() => {
        try {
          const gm = document.querySelector('canvas');
          return !!(window.ADV && ADV.__town);
        } catch (e) { return false; }
      });
      // detect town by probing: the town scene sets registry; use scene manager
      const active = await page.evaluate(() => {
        try {
          const game = window.__game;
          if (!game) return '';
          return game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(',');
        } catch (e) { return 'err'; }
      });
      if (active.includes('Town') || active.includes('Death')) break;
    }
    const active = await page.evaluate(() => {
      const game = window.__game;
      return game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(',');
    });
    await page.screenshot({ path: SHOT('q_' + qn) });
    if (active.includes('Death')) {
      await click(640, 520, 800); // continue after death
      // if reincarnation -> creation
      const a2 = await page.evaluate(() => window.__game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(','));
      if (a2.includes('Creation')) {
        await page.keyboard.type('Vale2');
        await click(292, 400, 300);
        await click(640, 693, 600);
        await click(284, 138, 250); await click(640, 182, 250); await click(996, 226, 250);
        await click(640, 709, 1200);
      }
    }
  }
  await page.screenshot({ path: SHOT('final') });
  const active = await page.evaluate(() => window.__game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(','));
  console.log('final scene:', active);
  console.log('console errors:', errors.length);
  for (const e of [...new Set(errors)].slice(0, 15)) console.log('  ', e.slice(0, 260));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('DRIVER FAIL', e); process.exit(2); });
