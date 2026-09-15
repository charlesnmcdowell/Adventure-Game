// Browser smoke test: drive the real build in Chromium via Playwright.
// Clicks through title -> cards -> creation -> town -> quest -> combat,
// screenshotting each stage and failing on console errors.
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const SHOT = (n) => path.join('/tmp/shots', n + '.png');

(async () => {
  const fs = require('fs');
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' + (fs.existsSync('/opt/pw-browsers/chromium') ? '' : ''), args: ['--no-sandbox'] }).catch(async () => {
    return chromium.launch({ args: ['--no-sandbox'] });
  });
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT('01_title') });

  // helper: click at canvas coordinates (game is FIT-scaled; compute mapping)
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const GW = 1280, GH = 760;
  const scale = Math.min(box.width / GW, box.height / GH);
  const ox = box.x + (box.width - GW * scale) / 2;
  const oy = box.y + (box.height - GH * scale) / 2;
  const click = async (gx, gy) => { await page.mouse.click(ox + gx * scale, oy + gy * scale); await page.waitForTimeout(350); };

  // Title: "Begin" (no save) at ~(640, 363)
  await click(640, 363);
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('02_cards') });
  // click through 5 cards
  for (let i = 0; i < 5; i++) await click(640, 300);
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT('03_creation') });

  // type a name
  await page.keyboard.type('Vale');
  // pick slot 4 female (ranger) — grid starts x=80,y=130, cw=128,gap=14 → slot4 x≈80+3*142+64=570, y≈130+78
  await click(570, 208);
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT('04_creation_sel') });
  // Begin button at (640, H-90+25=695)
  await click(640, 695);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOT('05_town') });

  // Town: quest board opens by default; click first solo quest row (x≈512+24+..., y≈16+84+24+? ) — rows start y=r.y+84+24=124; first row center ≈ (488+24 + (w-220)/2, 124+22)
  await click(700, 148);
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('06_departure') });
  // "Set out" at (640-250+120=510, 583)
  await click(510, 583);
  await page.waitForTimeout(900);
  await page.screenshot({ path: SHOT('07_quest') });

  // choose Fight — verbs start at y=420; fight is first: center (640, 442)
  await click(640, 442);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT('08_combat') });

  // let AI turns play; then try player action loop for a while: click first action button then a target ring
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(700);
    // click the first action button region (x≈56..170, y≈H-86+30=704)
    await click(120, 704);
    await page.waitForTimeout(300);
    // click enemy front lane top slot (760, 170)
    await click(760, 170);
    await page.waitForTimeout(300);
    await click(760, 330);
    // dismiss any toast/dialogue by clicking center-bottom
    await click(640, 640);
    const over = await page.evaluate(() => {
      const g = window.ADV && ADV.__lastGame;
      return false;
    });
  }
  await page.screenshot({ path: SHOT('09_combat_late') });

  console.log('console errors:', errors.length);
  for (const e of errors.slice(0, 12)) console.log('  ', e.slice(0, 220));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('DRIVER FAIL', e); process.exit(2); });
