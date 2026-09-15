// Contact sheets for the expression/costume pass. Not a test — a way to LOOK.
//   node test/expr_sheet.js   (server on :8734) → /tmp/shots/sheet_*.png
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8734/index.html'); await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '.adv-field{display:none !important}' });
  const which = process.argv[2] || 'all';
  const sheet = async (name, fn) => {
    await page.evaluate(fn);
    await page.waitForTimeout(700);
    await page.screenshot({ path: '/tmp/shots/sheet_' + name + '.png' });
    await page.evaluate(() => { const s = window.__game.scene.getScene('Title'); (s.__sheet || []).forEach(o => { try { o.destroy(); } catch (e) {} }); s.__sheet = []; });
  };
  const prelude = `
    const s = window.__game.scene.getScene('Title'); s.__sheet = s.__sheet || [];
    const keep = (o) => { s.__sheet.push(o); return o; };
    const P = ADV.Portraits; const W = 1280, H = 760;
    keep(s.add.rectangle(W/2, H/2, W, H, 0x101010).setDepth(200));
    const D = 201;
    const label = (x, y, t) => keep(s.add.text(x, y, t, { fontSize: '11px', color: '#ddd' }).setDepth(D + 5));
  `;
  if (which === 'all' || which === 'moods') await sheet('moods', new Function(prelude + `
    const ch = { portraitKind: 'player', portraitSlot: 3, sex: 'f', portraitSeed: 3 * 7919 + 13 };
    const chm = { portraitKind: 'player', portraitSlot: 1, sex: 'm', portraitSeed: 1 * 7919 + 29 };
    const key = P.key(s, ch), keym = P.key(s, chm);
    P.MOOD_IDS.forEach((m, i) => {
      const x = 80 + (i % 8) * 155, y = 110 + Math.floor(i / 8) * 330;
      const img = keep(s.add.image(x, y, key).setDisplaySize(110, 140).setDepth(D));
      P.express(s, img, ch, key, m, 1);
      const img2 = keep(s.add.image(x + 60, y + 90, keym).setDisplaySize(60, 76).setDepth(D + 2));
      P.express(s, img2, chm, keym, m, 1);
      const img3 = keep(s.add.image(x - 45, y + 100, key).setDisplaySize(50, 64).setDepth(D + 2));
      P.express(s, img3, ch, key, m, 0.5);
      label(x - 50, y + 130, m);
    });
  `));
  if (which === 'all' || which === 'monsters') await sheet('monsters', new Function(prelude + `
    const wolf = { portraitId: 'dire_wolf', isMonster: true, enemyTypeId: 'dire_wolf' };
    const sent = { portraitId: 'plated_sentinel', isMonster: true, enemyTypeId: 'plated_sentinel' };
    const kw = P.key(s, wolf), ks = P.key(s, sent);
    ['neutral','angry','furious','afraid','pain','dazed','resolve','surprised'].forEach((m, i) => {
      const x = 90 + i * 150;
      const a = keep(s.add.image(x, 160, kw).setDisplaySize(130, 165).setDepth(D)); P.express(s, a, wolf, kw, m, 1);
      const b = keep(s.add.image(x, 420, ks).setDisplaySize(130, 165).setDepth(D)); P.express(s, b, sent, ks, m, 1);
      label(x - 40, 250, m);
    });
    // human-frame enemies with faction gear + skins
    const ids = ['bell_initiate','sworn_blade','tally_hand','marine_of_the_line','gunnery_officer','poison_sister','green_recruit','sea_dog'];
    ids.forEach((id, i) => {
      const def = ADV.DATA.CAMPAIGN_ENEMIES[id]; if (!def) return;
      const skin = def.skins ? def.skins[i % def.skins.length] : null;
      const ch = { portraitId: def.portrait, isMonster: true, enemyTypeId: id, skinTint: skin && skin.tint, sex: i % 3 === 0 ? 'f' : 'm' };
      const k = P.key(s, ch);
      keep(s.add.image(90 + i * 150, 640, k).setDisplaySize(110, 140).setDepth(D));
      label(50 + i * 150, 715, id + (skin ? ' / ' + skin.name : ''));
    });
  `));
  if (which === 'all' || which === 'creation') await sheet('creation', new Function(prelude + `
    for (let slot = 1; slot <= 17; slot++) for (const sex of ['f','m']) {
      const i = (slot - 1) * 2 + (sex === 'm' ? 1 : 0);
      const x = 60 + (i % 12) * 105, y = 100 + Math.floor(i / 12) * 240;
      const k = P.creationKey(s, slot, sex);
      keep(s.add.image(x, y, k).setDisplaySize(96, 122).setDepth(D));
      label(x - 40, y + 66, slot + sex);
    }
  `));
  if (which === 'all' || which === 'sets') await sheet('sets', new Function(prelude + `
    const sets = Object.keys(P.SET_LOOK);
    sets.forEach((id, i) => {
      for (const sex of ['f','m']) {
        const j = i * 2 + (sex === 'm' ? 1 : 0);
        const x = 55 + (j % 16) * 80, y = 95 + Math.floor(j / 16) * 240;
        const ch = { portraitKind: 'npc', sex, portraitSeed: 1000 + i * 7 + (sex === 'm' ? 3 : 0), equippedSet: id, rank: 2 };
        const k = P.key(s, ch);
        keep(s.add.image(x, y, k).setDisplaySize(72, 92).setDepth(D));
        if (sex === 'f') label(x - 34, y + 52, id.slice(0, 12));
      }
    });
  `));
  if (which === 'all' || which === 'grey') await sheet('grey', new Function(prelude + `
    // G3: greyscale silhouette row at 60px for each distinct pattern
    const pats = ['warrior','mercenarys_gear','plate','oath','green_eyed_armour','shinobi_gear','privateers_kit','kings_uniform','mage','healer','ranger','wildhide','duelist','street'];
    pats.forEach((id, i) => {
      const ch = { portraitKind: 'npc', sex: 'm', portraitSeed: 4242, equippedSet: id, rank: 2 };
      const k = P.key(s, ch);
      const src = s.textures.get(k).getSourceImage();
      const c = document.createElement('canvas'); c.width = 220; c.height = 280; const ctx = c.getContext('2d');
      ctx.filter = 'grayscale(1) contrast(1.3)'; ctx.drawImage(src, 0, 0);
      const gk = 'grey_' + id; if (!s.textures.exists(gk)) s.textures.addCanvas(gk, c);
      keep(s.add.image(70 + i * 88, 140, gk).setDisplaySize(60, 76).setDepth(D));
      keep(s.add.image(70 + i * 88, 330, gk).setDisplaySize(160, 204).setDepth(D));
      label(40 + i * 88, 185, id.slice(0, 11));
    });
    // NPC randoms with builds
    for (let i = 0; i < 14; i++) { const sex = i % 2 ? 'm' : 'f'; const ch = { portraitKind: 'npc', sex, portraitSeed: 777 + i * 13 }; const k = P.key(s, ch); keep(s.add.image(70 + i * 88, 600, k).setDisplaySize(110, 140).setDepth(D)); }
  `));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
