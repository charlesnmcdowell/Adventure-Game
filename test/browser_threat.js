// Threat mark / bar / evade beat (THREAT_PROMPT.md §9–10). Server on :8734.
//   node test/browser_threat.js [port]
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SHOT = (n) => path.join('/tmp/shots', 'threat_' + n + '.png');
fs.mkdirSync('/tmp/shots', { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

(async () => {
  const port = process.argv[2] || '8734';
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|audio|mp3/i.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForTimeout(1400);

  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 21, name: 'Vale', sex: 'm', portraitSlot: 1, portraitSeed: 2, startingSkills: ['bulwark', 'taunt', 'shield_wall'] });
    const p = ADV.Game.player(game);
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game); window.__G = game;
    const w = game.world;
    const allies = w.characters.filter(c => !c.isPlayer && c.alive && !c.isMonster).slice(0, 3);
    const rng = new ADV.RNG(8);
    const foes = Object.keys(ADV.DATA.ENEMIES).slice(0, 3).map(id => ADV.Character.makeEnemy(rng, id, { level: 2 }));
    game.rescueCombat = { st: ADV.Combat.create([p].concat(allies), foes, { rng: new ADV.RNG(4) }) };
    window.__game.scene.stop('Title'); window.__game.scene.start('Combat', { mode: 'rescue' });
  });
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Combat'); sc.ended = true; sc.time.timeScale = 8; sc.tweens.timeScale = 8; });

  const marks = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Combat');
    sc.refreshThreatMarks();
    const views = [...sc.unitViews.values()];
    const leaders = { a: ADV.Combat.threatLeader(sc.st(), 'a'), b: ADV.Combat.threatLeader(sc.st(), 'b') };
    const marked = views.filter(v => v._threatLead).map(v => v.u.uid);
    const bars = views.filter(v => v.threatBar).length;
    return {
      marked,
      wantA: leaders.a && leaders.a.uid,
      wantB: leaders.b && leaders.b.uid,
      bars,
      hasBeat: typeof ADV.VFX.evadeBeat === 'function',
    };
  });
  ok(marks.hasBeat, 'VFX.evadeBeat is present');
  ok(marks.bars === [...new Set([marks.bars])].length && marks.bars >= 4, 'every unit view has a threat bar', marks.bars);
  ok(marks.marked.includes(marks.wantA) && marks.marked.includes(marks.wantB), 'the mark sits on each side\'s threat leader');

  const moved = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const st = sc.st();
    const live = st.units.filter(u => u.side === 'a' && !u.downed);
    const lead = ADV.Combat.threatLeader(st, 'a');
    const other = live.find(u => u !== lead);
    if (!other) return { ok: false };
    const oldUid = lead.uid;
    ADV.Combat.addThreat(st, other, 80, 'healing');
    sc.refreshThreatMarks();
    await new Promise(r => setTimeout(r, 280));
    const now = ADV.Combat.threatLeader(st, 'a');
    const views = [...sc.unitViews.values()];
    return { ok: now && now.uid === other.uid, oldGone: !views.find(v => v.u.uid === oldUid)._threatLead, newOn: !!views.find(v => v.u.uid === other.uid)._threatLead };
  });
  ok(moved.ok && moved.newOn, 'the mark transfers when the leader changes');

  const evade = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const n0 = sc.children.list.length;
    const v = [...sc.unitViews.values()].find(x => x.u.side === 'a');
    const by = [...sc.unitViews.values()].find(x => x.u.side === 'b');
    const t0 = Date.now();
    const ms = sc.animateEvent({ t: 'evade', uid: v.u.uid, by: by.u.uid, pct: true, power: 3 });
    await new Promise(r => setTimeout(r, 400));
    const left = sc.children.list.length;
    return { ms, budget: ms <= 260, leak: left <= n0 + 2, elapsed: Date.now() - t0 };
  });
  ok(evade.budget, 'evade beat stays inside 260 ms', evade.ms);
  ok(evade.leak, 'evade beat does not leak display objects', evade.elapsed);

  await page.screenshot({ path: SHOT('field') });
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4).join(' | '));

  await browser.close();
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
