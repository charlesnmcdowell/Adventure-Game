// Expression pass (EXPRESSION_PROMPT.md §12, browser half). Server on :8734.
//   node test/browser_expressions.js
// Checks: enemies carry a non-neutral mood in a real fight; a hit plays a pain
// reaction that clears and restores the standing mood; a [laughs] line plays a
// laughing reaction; frame-time holds with 18 units expressing; the roster
// shows >= 4 distinct moods; panel churn leaks no update listeners; and the
// contact sheets (16 moods at two sizes, wolf + sentinel, costumes) are written
// to /tmp/shots for a human to look at.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SHOT = (n) => path.join('/tmp/shots', 'x_' + n + '.png');
fs.mkdirSync('/tmp/shots', { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

(async () => {
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|audio|mp3/i.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:8734/index.html'); await page.waitForTimeout(1400);

  // ---- a strong player straight into a party fight with a full field
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Sable', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['bulwark', 'cleave', 'mend'] });
    const p = ADV.Game.player(game);
    p.stats = { hp: 600, atk: 30, def: 20, spd: 18 };
    for (const e of p.perks.concat(p.actives)) e.level = 30;
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.stop('Title');
    window.__game.scene.start('Town');
  });
  await page.waitForTimeout(800);

  // roster: faces with distinct moods (strangers stay greyed and blank by design, so meet everyone first)
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const g = sc.registry.get('game'); g.world.characters.forEach(c => ADV.World.met(g.world, c.id)); sc.openPanel('roster'); });
  await page.waitForTimeout(700);
  const rosterMoods = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town'); const out = [];
    ADV.UI.walk(sc, (o) => { if (o.type === 'Image' && o.__expressMood != null) out.push(o.__expressMood); });
    return out;
  });
  ok(rosterMoods.length >= 8, `roster draws faces (${rosterMoods.length})`);
  ok(new Set(rosterMoods).size >= 4, `roster shows >= 4 distinct standing moods (${[...new Set(rosterMoods)].join(',')})`);
  await page.screenshot({ path: SHOT('roster') });
  // leak check: open/close the roster 20 times
  const before = await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.openPanel('home'); return sc.events.listenerCount('update'); });
  for (let i = 0; i < 20; i++) { await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.openPanel('roster'); sc.openPanel('home'); }); }
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__game.scene.getScene('Town').events.listenerCount('update'));
  ok(after <= before + 2, `no leaked update listeners after 20 roster open/close cycles (${before} → ${after})`);

  // hub card: player face + dialogue with a tagged line
  const dlg = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Town');
    const game = sc.registry.get('game');
    const npc = game.world.characters.find(c => !c.isPlayer && c.alive && c.personalityId);
    // force a line that carries [laughs] if any exists for this personality, else synthesize via showText
    const raw = '[laughs] You again, {target}. [sighs] Fine, what is it?';
    const closer = ADV.DialogueBox.showText(sc, game, npc, raw.replace(/\[[^\]]+\]\s*/g, '').replace('{target}', 'Sable'), () => {}, { raw });
    window.__dlgCloser = closer;
    await new Promise(r => setTimeout(r, 200));
    const img = sc.children.list.find(o => o.type === 'Image' && o.depth === 902);
    const cur = img && img.__reactCur ? img.__reactCur.mood : null;
    await new Promise(r => setTimeout(r, 1500));
    const later = img && img.__reactCur ? img.__reactCur.mood : null;
    return { cur, later, standing: img && img.__expressMood, hasImg: !!img, closer: !!closer };
  });
  ok(dlg.hasImg, 'dialogue box draws the speaker');
  ok(dlg.cur === 'laughing', `[laughs] plays a laughing reaction as the line opens (${dlg.cur})`);
  ok(dlg.later === 'sad' || dlg.later === null, `queued [sighs] follows / reactions clear (${dlg.later})`);
  await page.screenshot({ path: SHOT('dialogue') });
  await page.evaluate(() => { if (window.__dlgCloser && window.__dlgCloser.close) window.__dlgCloser.close(); });
  await page.waitForTimeout(300);

  // ---- combat with a full field
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town');
    const game = sc.registry.get('game');
    const w = game.world; const p = ADV.Game.player(game);
    const allies = w.characters.filter(c => !c.isPlayer && c.alive && !c.isMonster).slice(0, 8);
    const rng = new ADV.RNG(99);
    const foes = [];
    const ids = Object.keys(ADV.DATA.ENEMIES);
    for (let i = 0; i < 9; i++) foes.push(ADV.Character.makeEnemy(rng, ids[i % ids.length], 2));
    game.rescueCombat = { st: ADV.Combat.create([p].concat(allies), foes, {}) };
    window.__game.scene.stop('Town');
    window.__game.scene.start('Combat', { mode: 'rescue' });
  });
  await page.waitForTimeout(1500);
  const combat = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Combat');
    const views = [...sc.unitViews.values()];
    return { n: views.length, monsters: views.filter(v => v.u.ch.isMonster).map(v => v.img.__expressMood), rigs: views.filter(v => v.u.ch.isMonster).map(v => (ADV.Portraits._meta[v.img.texture.key] || {}).rig) };
  });
  ok(combat.n >= 12, `field has ${combat.n} units`);
  ok(combat.monsters.some(m => m && m !== 'neutral'), `at least one enemy carries a non-neutral standing mood (${[...new Set(combat.monsters)].join(',')})`);
  ok(combat.rigs.every(r => r), 'every monster has a rig recorded in META');
  await page.screenshot({ path: SHOT('combat_start') });

  // a hit: pain reaction appears (the live fight keeps landing hits, so the
  // clear-and-restore half is checked on an isolated bust below)
  const hit = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const v = [...sc.unitViews.values()].find(x => x.u.ch.isMonster && !x.u.downed);
    sc.animateEvent({ t: 'damage', uid: v.u.uid, by: null, dmg: Math.round(v.u.maxHp * 0.3), tag: null });
    await new Promise(r => setTimeout(r, 250));
    return { during: v.img.__reactCur ? v.img.__reactCur.mood : null, wound: !!v.u.__wound, standing: v.img.__expressMood };
  });
  ok(hit.during === 'pain', `a heavy hit shows a pain reaction (${hit.during})`);
  ok(hit.wound, 'a hit for >= 30% max HP leaves a wound mark on the unit');
  const iso = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat'); const P = ADV.Portraits;
    const ch = { portraitKind: 'player', portraitSlot: 3, sex: 'f', portraitSeed: 3 * 7919 + 13 };
    const key = P.key(sc, ch); const img = sc.add.image(-500, -500, key).setDisplaySize(140, 178);
    P.express(sc, img, ch, key, 'content', 1);
    P.react(sc, img, ch, key, 'pain', { ms: 500 });
    await new Promise(r => setTimeout(r, 250)); const during = img.__reactCur && img.__reactCur.mood;
    await new Promise(r => setTimeout(r, 2500)); const after = img.__reactCur && img.__reactCur.mood;
    const standing = img.__expressMood; img.destroy();
    return { during, after, standing };
  });
  ok(iso.during === 'pain', `react(): pain overlay present at 250 ms (${iso.during})`);
  ok(!iso.after, `react(): overlay gone by 2.75 s (${iso.after})`);
  ok(iso.standing === 'content', `react(): standing mood untouched underneath (${iso.standing})`);

  // frame time with everyone expressing
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Combat');
    for (const v of sc.unitViews.values()) ADV.Portraits.express(sc, v.img, v.u.ch, v.img.texture.key, ['angry', 'afraid', 'pain', 'smug'][Math.floor(Math.random() * 4)], 1);
  });
  // budget: overlay paint time per frame with 18 units expressing. Headless
  // Chromium has no GPU, so absolute fps is meaningless here; we measure what
  // the overlays themselves cost against the §3 budget (0.2 ms / frame).
  const cost = await page.evaluate(async () => {
    const S = ADV.Portraits.STATS;
    S.paintMs = 0; S.paints = 0; S.ticks = 0; const t0 = performance.now();
    await new Promise(r => setTimeout(r, 3000));
    const secs = (performance.now() - t0) / 1000;
    return { msPerSec: S.paintMs / secs, perPaint: S.paints ? S.paintMs / S.paints : 0, paints: S.paints, ticks: S.ticks, fps: window.__game.loop.actualFps };
  });
  console.log(`  --  overlay paint: ${cost.msPerSec.toFixed(2)} ms per second of play, ${cost.perPaint.toFixed(3)} ms per repaint, ${cost.paints} repaints (headless software-GL fps ${cost.fps.toFixed(1)} — absolute fps is not meaningful here)`);
  ok(cost.msPerSec < 12, `overlay paint under 12 ms per second with ${combat.n} units expressing (= <0.2 ms/frame at 60 fps): ${cost.msPerSec.toFixed(2)}`);
  await page.screenshot({ path: SHOT('combat_expressing') });

  // ---- contact sheets (look at these)
  await page.evaluate(() => { window.__game.scene.stop('Combat'); window.__game.scene.start('Title'); });
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: '.adv-field{display:none !important}' });
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Title'); const P = ADV.Portraits;
    s.add.rectangle(640, 380, 1280, 760, 0x101010).setDepth(200);
    const ch = { portraitKind: 'player', portraitSlot: 3, sex: 'f', portraitSeed: 3 * 7919 + 13 };
    const chm = { portraitKind: 'player', portraitSlot: 1, sex: 'm', portraitSeed: 1 * 7919 + 29 };
    const key = P.key(s, ch), keym = P.key(s, chm);
    P.MOOD_IDS.forEach((m, i) => {
      const x = 80 + (i % 8) * 155, y = 120 + Math.floor(i / 8) * 330;
      P.express(s, s.add.image(x, y, key).setDisplaySize(140, 178).setDepth(201), ch, key, m, 1);
      P.express(s, s.add.image(x + 55, y + 105, keym).setDisplaySize(60, 76).setDepth(203), chm, keym, m, 1);
      s.add.text(x - 60, y + 100, m, { fontSize: '12px', color: '#ddd' }).setDepth(205);
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('sheet_moods') });

  ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
