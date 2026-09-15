// Healer & druid pass (HEALER_DRUID_PROMPT.md §8, browser half). Server on :8734.
//   node test/browser_heal.js [port]
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SHOT = (n) => path.join('/tmp/shots', 'heal_' + n + '.png');
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
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|audio|mp3/i.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html`); await page.waitForTimeout(1400);
  // headless software GL: let slow frames count as real time, and run the scene clocks fast
  await page.evaluate(() => { window.__game.loop._min = 1000; });

  // ---- a party with a healer and a druid, loop frozen
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Sable', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['devoted', 'mend', 'raise'] });
    const p = ADV.Game.player(game); p.stats = { hp: 600, atk: 30, def: 20, spd: 18 };
    for (const e of p.actives) e.level = e.skillId === 'raise' ? 1 : 30;
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game); window.__G = game;
    const w = game.world;
    const allies = w.characters.filter(c => !c.isPlayer && c.alive && !c.isMonster).slice(0, 4);
    const druid = allies[0];
    druid.actives = [{ skillId: 'beast_shape', level: 1, uses: 0 }, { skillId: 'grove_raise', level: 1, uses: 0 }, { skillId: 'growth_field', level: 12, uses: 0 }];
    druid.perks = [{ skillId: 'wild_form', level: 1, uses: 0 }];
    const rng = new ADV.RNG(99); const foes = []; const ids = Object.keys(ADV.DATA.ENEMIES);
    for (let i = 0; i < 4; i++) foes.push(ADV.Character.makeEnemy(rng, ids[i % ids.length], 2));
    game.rescueCombat = { st: ADV.Combat.create([p].concat(allies), foes, { rng: new ADV.RNG(5) }) };
    window.__druidId = druid.id;
    window.__game.scene.stop('Title'); window.__game.scene.start('Combat', { mode: 'rescue' });
  });
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Combat'); sc.ended = true; sc.time.timeScale = 8; sc.tweens.timeScale = 8; });

  // ---- the druid arrived shifted (free buff at battle start): the field shows a beast
  const shift = await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Combat');
    const v = [...sc.unitViews.values()].find(x => x.u.ch.id === window.__druidId);
    return { form: v.u.form, key: v.img.texture.key, rig: (ADV.Portraits._meta && ADV.Portraits._meta[v.img.texture.key] || {}).rig };
  });
  ok(ADV_BEASTS().includes(shift.form) && /^pb1_/.test(shift.key), `the druid's free shapeshift shows a beast portrait on the field (${shift.form}, ${shift.key.slice(0, 12)}…)`);
  await page.screenshot({ path: SHOT('field') });

  // ---- shapeshift beat swaps the texture live; dropping the form brings the face back
  // (headless frames are slow and irregular, so every timing check polls for its state)
  const beat = await page.evaluate(async () => {
    const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 15000)) { if (fn()) return true; await new Promise(r => setTimeout(r, 60)); } return fn(); };
    const sc = window.__game.scene.getScene('Combat');
    const v = [...sc.unitViews.values()].find(x => x.u.ch.id === window.__druidId);
    const human = ADV.Portraits.key(sc, v.u.ch);
    // put the human face back, then play the event
    v.img.setTexture(human); v.img.setDisplaySize(92, 116);
    const before = v.img.texture.key;
    const ms = sc.animateEvent({ t: 'shapeshift', uid: v.u.uid, beast: v.u.form, skillId: 'beast_shape' });
    const during = await until(() => /^pb1_/.test(v.img.texture.key));
    for (const s of v.u.statuses.slice()) if (s.kind === 'beastShape' || s.kind === 'form') ADV.Combat._internals.removeStatus(v.u, s);
    sc.redrawUnit(v);
    const after = await until(() => v.img.texture.key === human);
    return { before: /^pb1_/.test(before), during, after, ms, form: v.u.form };
  });
  ok(!beat.before && beat.during, `the transformation beat swaps to the beast (${beat.ms} ms)`);
  ok(beat.after && beat.form == null, 'when the form drops the human face returns');

  // ---- a heal draws crosses sized by tier and lands the number after them
  const crosses = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const views = [...sc.unitViews.values()];
    const healer = views.find(x => x.u.ch.isPlayer), tgt = views.find(x => x.u.side === 'a' && !x.u.ch.isPlayer);
    const count = () => sc.children.list.filter(o => o.__cross).length;
    const out = {};
    for (const [tier, frac] of [['basic', 0.5], ['intermediate', 1.0], ['advanced', 1.5]]) {
      sc.animateEvent({ t: 'heal', uid: tgt.u.uid, by: healer.u.uid, amount: Math.round(tgt.u.maxHp * frac) });
      await new Promise(r => setTimeout(r, 80));
      out[tier] = count();
      await new Promise(r => setTimeout(r, 700));
    }
    sc.animateEvent({ t: 'heal', uid: tgt.u.uid, by: healer.u.uid, amount: 20, tick: true });
    await new Promise(r => setTimeout(r, 80));
    out.tick = count();
    await new Promise(r => setTimeout(r, 900));
    out.left = count();
    return out;
  });
  ok(crosses.basic >= 4 && crosses.intermediate > crosses.basic && crosses.advanced > crosses.intermediate, `crosses grow with the tier (${crosses.basic} / ${crosses.intermediate} / ${crosses.advanced})`);
  ok(crosses.tick >= 2 && crosses.left === 0, `a tick shows a few crosses and everything clears (${crosses.tick}, ${crosses.left} left)`);

  // ---- marks: thorn shield → tree, hot → cross pulses, wings, grove; each clears with its status
  const marks = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const v = [...sc.unitViews.values()].find(x => x.u.side === 'a' && !x.u.ch.isPlayer && x.u.ch.id !== window.__druidId);
    const has = (k) => !!(v._fxMarks && v._fxMarks[k]);
    const out = {};
    v.u.statuses.push({ kind: 'thornShield', pool: 100, max: 100, reflectPct: 0.5, rounds: 3, tier: 'advanced' }); ADV.SpellFX.syncStatus(sc, v);
    out.tree = has('thornShield') && !!v.__lifeTree;
    sc.animateEvent({ t: 'shieldAbsorb', uid: v.u.uid, absorbed: 40, left: 60, by: null });
    await new Promise(r => setTimeout(r, 200));
    v.u.statuses = v.u.statuses.filter(s => s.kind !== 'thornShield'); ADV.SpellFX.syncStatus(sc, v);
    out.treeGone = !has('thornShield') && !v.__lifeTree;
    v.u.statuses.push({ kind: 'hot', regen: true, ticks: 5, perTick: 10 }); ADV.SpellFX.syncStatus(sc, v);
    out.hot = has('hot') && !!v._fxMarks.hot.timer;
    v.u.statuses.push({ kind: 'wings', rounds: 2 }); ADV.SpellFX.syncStatus(sc, v);
    out.wings = has('wings') && v._fxMarks.wings.objs.length >= 2;
    v.u.statuses.push({ kind: 'grove', rounds: 3 }); ADV.SpellFX.syncStatus(sc, v);
    out.grove = has('grove') && v._fxMarks.grove.saplings.length >= 5;
    const n0 = sc.children.list.length;
    v.u.statuses = []; ADV.SpellFX.syncStatus(sc, v);
    out.cleared = !v._fxMarks.hot && !v._fxMarks.wings && !v._fxMarks.grove;
    // the marks dissolve into motes/leaves that clean themselves up; poll until the scene is back down
    const t0 = Date.now();
    while (Date.now() - t0 < 20000 && sc.children.list.length >= n0) await new Promise(r => setTimeout(r, 100));
    out.shrunk = sc.children.list.length < n0;
    return out;
  });
  ok(marks.tree && marks.treeGone, 'thorn shield draws the tree of life and clears when the pool is gone');
  ok(marks.hot, 'a regeneration pulses crosses on a timer');
  ok(marks.wings, 'wings unfold on a winged unit');
  ok(marks.grove, 'a grove grows around a grove unit');
  ok(marks.cleared && marks.shrunk, 'all marks clear with their statuses');
  await page.screenshot({ path: SHOT('marks') });

  // ---- a real revive by each class in the running fight: statuses, beats, the line
  const rev = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat'); const st = sc.st();
    const views = [...sc.unitViews.values()];
    const healer = views.find(x => x.u.ch.isPlayer), druid = views.find(x => x.u.ch.id === window.__druidId);
    const fallen = views.filter(x => x.u.side === 'a' && x.u !== healer.u && x.u !== druid.u).slice(0, 2);
    for (const f of fallen) { f.u.downed = true; f.u.chp = 0; }
    const out = {};
    const run = async (caster, skill, tgt) => {
      const n0 = st.events.length;
      const r = ADV.Combat.act(st, caster.u, { kind: 'skill', skillId: skill, targetUid: tgt.u.uid });
      const evs = st.events.slice(n0);
      sc.eventCursor = n0;
      let lineShown = false, drained = false;
      sc.drainEvents(() => { drained = true; });
      const t0 = Date.now();
      while (!drained && Date.now() - t0 < 30000) { if (sc.children.list.find(o => o.depth === 901)) lineShown = true; await new Promise(res => setTimeout(res, 50)); }
      return { ok: r.ok, drained, revive: evs.find(e => e.t === 'revive'), line: evs.find(e => e.t === 'line'), lineShown, marks: Object.keys(tgt._fxMarks || {}) };
    };
    out.h = await run(healer, 'raise', fallen[0]);
    out.d = await run(druid, 'grove_raise', fallen[1]);
    return out;
  });
  ok(rev.h.ok && rev.h.revive && rev.h.revive.arch === 'healer' && rev.h.marks.includes('wings'), `healer revive: wings on the risen (${rev.h.marks.join(',')})`);
  ok(rev.h.line && rev.h.lineShown, `the healer's line is spoken over the risen ("${rev.h.line && rev.h.line.text}")`);
  ok(rev.d.ok && rev.d.revive && rev.d.revive.arch === 'druid' && rev.d.marks.includes('grove'), `druid revive: a grove around the risen (${rev.d.marks.join(',')})`);
  ok(rev.d.line && rev.d.lineShown, `the druid's line is spoken ("${rev.d.line && rev.d.line.text}")`);
  await page.screenshot({ path: SHOT('revive') });

  // ---- every healer/druid recipe plays without throwing, in range
  const bounds = { basic: [156, 364], intermediate: [204, 476], advanced: [312, 728] };
  const waits = await page.evaluate(async () => {
    const sc = window.__game.scene.getScene('Combat');
    const views = [...sc.unitViews.values()];
    const src = views.find(x => x.u.ch.isPlayer), tgt = views.find(x => x.u.side === 'a' && !x.u.ch.isPlayer), foe = views.find(x => x.u.side === 'b');
    ADV.SpellFX._logged = false;
    const out = {};
    const ids = ['mend', 'triage', 'cleanse', 'guardian_ward', 'regenerate', 'raise', 'grove_raise', 'thorn_skin', 'thorn_lash', 'growth_field', 'storm_shape', 'wither_touch', 'field_suture', 'company_medic'];
    for (const id of ids) for (const tier of ['basic', 'intermediate', 'advanced']) {
      const hostile = ['thorn_lash', 'wither_touch'].includes(id);
      out[id + '/' + tier] = ADV.SpellFX.play(sc, { skillId: id, tier, src, tgt: hostile ? foe : tgt, dir: 1, name: id });
      await new Promise(r => setTimeout(r, 160));
    }
    await new Promise(r => setTimeout(r, 1200));
    return { out, logged: ADV.SpellFX._logged };
  });
  let inRange = 0, total = 0;
  for (const k of Object.keys(waits.out)) { total++; const [lo, hi] = bounds[k.split('/')[1]]; if (waits.out[k] >= lo && waits.out[k] <= hi) inRange++; }
  ok(inRange === total, `${inRange}/${total} healer & druid recipe waits inside tp(tier) ±40%`);
  ok(!waits.logged, 'no recipe threw');

  const realErrors = errors.filter(e => !/Failed to load/.test(e));
  ok(realErrors.length === 0, 'no page errors', realErrors.slice(0, 3).join(' | '));
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
function ADV_BEASTS() { return ['werewolf', 'werebear', 'panther']; }
