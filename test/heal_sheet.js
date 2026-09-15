// Contact sheets for the healer & druid pass. Not a test — a way to LOOK.
//   node test/heal_sheet.js [port]   → /tmp/shots/heal_*.png
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const port = process.argv[2] || '8734';
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html`); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__game.loop._min = 1000; });
  fs.mkdirSync('/tmp/shots', { recursive: true });
  // beasts + tree + wings + grove on the title scene
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Title'); s.__sheet = s.__sheet || [];
    const keep = (o) => { s.__sheet.push(o); return o; };
    const P = ADV.Portraits, V = ADV.VFX;
    keep(s.add.rectangle(640, 380, 1280, 760, 0x141a22).setDepth(200));
    const chF = { portraitKind: 'player', portraitSlot: 3, sex: 'f', portraitSeed: 3 * 7919 + 13, equippedSet: 'ranger' };
    const chM = { portraitKind: 'player', portraitSlot: 1, sex: 'm', portraitSeed: 1 * 7919 + 29 };
    let i = 0;
    for (const ch of [chF, chM]) for (const b of P.BEASTS) {
      const x = 110 + i * 200; i++;
      keep(s.add.image(x, 130, P.key(s, ch)).setDisplaySize(60, 76).setDepth(210));
      const img = keep(s.add.image(x, 260, P.beastKey(s, ch, b)).setDisplaySize(110, 140).setDepth(210));
      P.express(s, img, ch, img.texture.key, i % 2 ? 'furious' : 'pain', 1);
      keep(s.add.text(x - 40, 340, b + ' ' + (ch.sex), { fontSize: '11px', color: '#ddd' }).setDepth(230));
    }
    // marks on fake views
    const mk = (x, y) => { const img = keep(s.add.image(x, y, P.key(s, chF)).setDisplaySize(92, 116).setDepth(212)); return { x, y, img, u: { statuses: [], chp: 50, maxHp: 100 } }; };
    const v1 = mk(120, 560), v2 = mk(360, 560), v3 = mk(600, 560), v4 = mk(840, 560), v5 = mk(1080, 560);
    const m1 = V.lifeTree(s, v1, 'basic'), m2 = V.lifeTree(s, v2, 'advanced'), m3 = V.wings(s, v3, {}), m4 = V.grove(s, v4, 3, {});
    s.__marks = [m1, m2, m3, m4];
    V.healCrosses(s, v5.x, v5.y, 'advanced', { w: 92, h: 116 });
    keep(s.add.text(60, 640, 'tree basic', { fontSize: '11px', color: '#ddd' }).setDepth(230)); keep(s.add.text(300, 640, 'tree advanced', { fontSize: '11px', color: '#ddd' }).setDepth(230));
    keep(s.add.text(560, 640, 'wings', { fontSize: '11px', color: '#ddd' }).setDepth(230)); keep(s.add.text(800, 640, 'grove', { fontSize: '11px', color: '#ddd' }).setDepth(230)); keep(s.add.text(1030, 640, 'crosses adv', { fontSize: '11px', color: '#ddd' }).setDepth(230));
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/shots/heal_sheet.png' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/shots/heal_sheet2.png' });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
