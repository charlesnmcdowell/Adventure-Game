// Overflow/scroll: every list that can exceed its pane must clip and the
// last item must be reachable. Also the creation skill grid.
'use strict';
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const SHOT = (n) => path.join('/tmp/shots', n + '.png');

(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] }).catch(() => chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  const checks = []; const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };

  const canvas = await page.$('canvas'); const box = await canvas.boundingBox();
  const scale = Math.min(box.width / 1280, box.height / 760);
  const ox = box.x + (box.width - 1280 * scale) / 2, oy = box.y + (box.height - 760 * scale) / 2;
  const wheelAt = async (gx, gy, dy) => {
    await page.mouse.move(ox + gx * scale, oy + gy * scale);
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(120);
  };

  // ---- creation phase 2 -------------------------------------------------
  await page.evaluate(() => {
    ADV.Save.reset();
    window.__game.scene.stop('Title');
    window.__game.scene.start('Creation');
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Creation');
    (sc.tutorObjs || []).forEach(o => { try { o.destroy(); } catch (e) {} });
    sc.sel.name = 'Scroll';
    sc.buildPhase2();
  });
  await page.waitForTimeout(400);
  let cr = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Creation');
    const area = sc.skillScroll;
    const pane = area && area.rect;
    const unmasked = [];
    ADV.UI.walk(sc, o => {
      if (o.text == null || o.text === '') return;
      if ((o.depth || 0) >= 900) return;
      if (o.parentContainer && o.parentContainer.mask) return;
      const b = o.getBounds();
      if (b.bottom > 760 - 4 && !/Back|Step into the world/.test(o.text) && b.centerY > 600) unmasked.push(o.text.slice(0, 48));
    });
    const lastId = ADV.DATA.TRAINER_POOL.filter(id => !ADV.DATA.SKILLS[id].forbidden && !ADV.DATA.SKILLS[id].campaign).slice(-1)[0];
    const lastName = ADV.DATA.SKILLS[lastId].name;
    return {
      max: area ? area.maxOffset() : -1,
      pane,
      unmasked,
      lastName,
      beginY: sc.beginBtn && sc.beginBtn.zone.y,
      descY: sc.descText && sc.descText.y,
    };
  });
  ok(cr.max > 0, 'creation skill grid overflows and can scroll (' + cr.max + 'px)');
  ok(cr.unmasked.length === 0, 'creation: no unmasked skill text under the buttons' + (cr.unmasked.length ? ' — ' + cr.unmasked.join(' | ') : ''));
  ok(cr.beginY >= 760 - 90, 'Step into the world stays on the bottom chrome');
  await wheelAt(640, 360, 2400);
  const afterWheel = await page.evaluate(() => window.__game.scene.getScene('Creation').skillScroll.offset());
  ok(afterWheel > 40, 'creation wheel moves the grid (offset ' + afterWheel + ')');
  const lastVis = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Creation');
    sc.skillScroll.setOffset(sc.skillScroll.maxOffset());
    const lastId = ADV.DATA.TRAINER_POOL.filter(id => !ADV.DATA.SKILLS[id].forbidden && !ADV.DATA.SKILLS[id].campaign).slice(-1)[0];
    const name = ADV.DATA.SKILLS[lastId].name;
    const t = ADV.UI.allText(sc).find(o => o.text && o.text.indexOf(name) === 0);
    if (!t) return { ok: false, name };
    const b = t.getBounds(), r = sc.skillScroll.rect;
    return { ok: b.y < r.y + r.h && b.y + b.height > r.y, name, y: Math.round(b.y), pane: r };
  });
  ok(lastVis.ok, 'creation scroll reaches last skill (' + lastVis.name + ' @ ' + lastVis.y + ')');
  await page.screenshot({ path: SHOT('s00_creation_end') });

  // ---- town panels with a fat roster / journal / parties ----------------
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 4242, name: 'Scroll', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] });
    game.tutorial = { step: 'done' };
    const world = game.world, p = ADV.Game.player(game);
    p.inventory.gold = 2000;
    for (const id of ADV.DATA.TRAINER_POOL) {
      p.journal[id] = Object.assign({ witnessed: true, eligible: true, sawTier: 'basic' }, p.journal[id] || {});
    }
    game.meta.codexUnlocked = Object.keys(ADV.DATA.PROMPTS);
    game.meta.campaignSkillsUnlocked = true;
    const free = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster && !c.partyId && !c.registryId);
    for (const c of free) ADV.Party.create(world, c.id);
    const rng = new ADV.RNG(77);
    for (let i = 0; i < 8; i++) {
      const extra = ADV.Character.seedNPC(rng, world, { sex: i % 2 ? 'f' : 'm', inclination: 'fighter' });
      world.characters.push(extra);
      ADV.Party.create(world, extra.id);
    }
    for (let i = 0; i < 28; i++) ADV.World.feed(world, 'A long feed line number ' + i + ' about someone doing something out in the world.', []);
    for (const c of world.characters) if (!c.isPlayer) ADV.World.met(world, c.id);
    p.equippedSet = 'warrior';
    window.__game.scene.getScene('Creation').scene.stop();
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.start('Town');
  });
  await page.waitForTimeout(800);

  const paneCheck = async (id) => page.evaluate((panelId) => {
    const sc = window.__game.scene.getScene('Town');
    sc.openPanel(panelId);
    const pane = sc.contentRect();
    const leaks = [];
    ADV.UI.walk(sc, o => {
      if (o.text == null || o.text === '') return;
      if ((o.depth || 0) >= 900) return;
      if (o.parentContainer && o.parentContainer.mask) return;
      const b = o.getBounds();
      if (b.width < 2 || b.height < 2) return;
      if (b.centerX < pane.x - 4 || b.centerX > pane.x + pane.w + 4) return;
      const pad = 6;
      if (b.y < pane.y - pad || b.y + b.height > pane.y + pane.h + pad) leaks.push(o.text.slice(0, 42));
    });
    const areas = (sc.panelScrolls || []).map(a => ({
      max: a.maxOffset(),
      end: a.contentEnd(),
      h: a.rect.h, y: a.rect.y, w: a.rect.w,
    }));
    const lastVisible = (sc.panelScrolls || []).map(a => {
      a.setOffset(a.maxOffset());
      let last = null;
      for (const ch of a.container.list) {
        if (ch.text) last = ch;
      }
      if (!last) return { ok: a.maxOffset() === 0 };
      const b = last.getBounds();
      return { ok: b.y < a.rect.y + a.rect.h && (b.y + b.height) > a.rect.y, y: Math.round(b.y), text: String(last.text).slice(0, 36) };
    });
    return { leaks, areas, lastVisible };
  }, id);

  const panels = ['board', 'store', 'trainer', 'apply', 'create', 'roster', 'rel', 'journal', 'codex', 'campaign', 'vault'];
  for (const id of panels) {
    if (id === 'store') {
      await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.storeTab = 'gear'; });
    }
    const r = await paneCheck(id);
    ok(r.leaks.length === 0, id + ': no unmasked text leaves the pane' + (r.leaks.length ? ' — ' + r.leaks.join(' | ') : ''));
    const needsScroll = ['trainer', 'journal', 'codex', 'roster', 'rel', 'apply', 'store'].includes(id);
    if (needsScroll) {
      ok(r.areas.some(a => a.max > 0), id + ': has a scrollable pane (max ' + r.areas.map(a => a.max).join(',') + ')');
    }
    ok(r.lastVisible.every(v => v.ok), id + ': scrolling reaches the last item' + (r.lastVisible.some(v => !v.ok) ? ' — ' + JSON.stringify(r.lastVisible) : ''));
    await page.screenshot({ path: SHOT('s_' + id) });
  }

  // trainer faction tab is even taller
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town');
    sc.trainerTab = 'maw';
    sc.openPanel('trainer');
  });
  await page.waitForTimeout(200);
  const maw = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town');
    const a = (sc.panelScrolls || [])[0];
    if (!a) return { max: -1 };
    a.setOffset(a.maxOffset());
    let last = null;
    for (const ch of a.container.list) if (ch.text) last = ch;
    const b = last && last.getBounds();
    return { max: a.maxOffset(), lastOk: !!(b && b.y < a.rect.y + a.rect.h && (b.y + b.height) > a.rect.y), last: last && String(last.text).slice(0, 36) };
  });
  ok(maw.max >= 0 && maw.lastOk, 'trainer Maw tab last skill in view (' + maw.last + ', max ' + maw.max + ')');
  await page.screenshot({ path: SHOT('s_trainer_maw') });

  // wheel on the trainer actually moves offset
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town');
    sc.trainerTab = 'core';
    sc.openPanel('trainer');
  });
  await page.waitForTimeout(150);
  const before = await page.evaluate(() => (window.__game.scene.getScene('Town').panelScrolls[0] || {}).offset());
  await wheelAt(800, 400, 1800);
  const after = await page.evaluate(() => window.__game.scene.getScene('Town').panelScrolls[0].offset());
  ok(after > before, 'trainer wheel changes offset (' + before + ' → ' + after + ')');

  // combat action bar with many actives
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town');
    const game = sc.registry.get('game');
    const p = ADV.Game.player(game);
    const extras = ['fire_bolt', 'spark', 'frost_touch', 'shield_wall', 'taunt', 'backstab', 'aimed_shot', 'snare', 'cleave', 'sunder', 'two_hand_slash', 'ember_lash', 'venom_fang'];
    p.actives = extras.filter(id => ADV.DATA.SKILLS[id]).map(id => ({ skillId: id, level: 1, uses: 0 }));
    const rng = new ADV.RNG(3);
    const foe = ADV.Character.makeEnemy(rng, 'bandit', {});
    foe.combatHp = ADV.Character.maxHp(foe); p.combatHp = ADV.Character.maxHp(p);
    const st = ADV.Combat.create([p], [foe], { rng });
    game.quest = { quest: { name: 'scroll', encounters: [{}] }, encIdx: 0, combat: st, witnessedNew: [], defeatedNamed: [], lootGold: 0 };
    window.__game.scene.stop('Town');
    window.__game.scene.start('Combat', { mode: 'quest' });
  });
  await page.waitForTimeout(800);
  const bar = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Combat');
    const areas = sc.panelScrolls || [];
    const a = areas[0];
    if (!a) return { has: false };
    a.setOffset(a.maxOffset());
    let last = null;
    for (const ch of a.container.list) if (ch.text) last = ch;
    const b = last && last.getBounds();
    return { has: true, max: a.maxOffset(), lastOk: !!(b && b.x < a.rect.x + a.rect.w && (b.x + b.width) > a.rect.x), last: last && String(last.text).slice(0, 24) };
  });
  ok(bar.has, 'combat action bar uses a scroll area');
  ok(bar.max > 0, 'combat action bar overflows horizontally (' + bar.max + 'px)');
  ok(bar.lastOk, 'combat action bar scroll reaches the last action (' + bar.last + ')');
  await page.screenshot({ path: SHOT('s_combat_bar') });

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' || ') : ''));
  await browser.close();
  process.exit(checks.some(c => !c[0]) || errors.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(2); });
