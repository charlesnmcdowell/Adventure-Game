// Browser run of the Maw campaign's hardest scripted stretch (quest 4: rival
// along, antagonist appears, rival dies) and the hall/end card screens.
// Drives real scenes; dialogue boxes are advanced by canvas clicks.
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const SHOT = (n) => path.join('/tmp/shots', n + '.png');

(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/audio|mp3|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const GW = 1280, GH = 760;
  const scale = Math.min(box.width / GW, box.height / GH);
  const ox = box.x + (box.width - GW * scale) / 2, oy = box.y + (box.height - GH * scale) / 2;
  const click = async (gx, gy) => { await page.mouse.click(ox + gx * scale, oy + gy * scale); await page.waitForTimeout(300); };

  // 1. a strong player jumped to Maw quest 4, hall open
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 4242, name: 'Sable', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['bulwark', 'cleave', 'mend'] });
    const p = ADV.Game.player(game);
    p.stats = { hp: 900, atk: 45, def: 30, spd: 22 };
    for (const e of p.perks.concat(p.actives)) e.level = 40;
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game);
    ADV.Campaign.debugJump(game, 'maw', 4);
    window.__game.scene.stop('Title');
    window.__game.scene.start('Town');
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__game.scene.getScene('Town').openPanel('campaign'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('c01_hall') });
  const hallText = await page.evaluate(() => window.__game.scene.getScene('Town').contentObjs.filter(o => o.text).map(o => o.text).join(' | '));
  const checks = [];
  const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };
  ok(/The Maw/.test(hallText) && /Red Hand of the Maw/.test(hallText), 'hall shows faction + tier-2 title');
  ok(/Kite: coming along/.test(hallText), 'rival toggle shown as along');

  // 2. depart on quest 4 straight from the hall
  await page.evaluate(() => {
    const game = window.__game.scene.getScene('Town').registry.get('game');
    ADV.Game.startQuest(game, ADV.Campaign.buildQuest(game, 4), {});
    window.__game.scene.stop('Town');
    window.__game.scene.start('Quest');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOT('c02_before4_line') });
  const dlgVisible = () => page.evaluate(() => window.__game.scene.getScene('Quest').children.list.some(o => o.depth === 904 && o.text));
  ok(await dlgVisible(), 'rival speaks at departure (before-it-goes-wrong)');
  // click through dialogue lines (2 clicks per line: finish typing, close)
  for (let i = 0; i < 8; i++) { if (!(await dlgVisible())) break; await click(640, 690); await click(640, 690); await page.waitForTimeout(300); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('c03_encounter') });

  const poll = () => page.evaluate(() => {
    const g = window.__game;
    const active = g.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(',');
    const game = g.scene.getScene('Town').registry.get('game');
    const q = game.quest;
    const sc = g.scene.getScene('Combat');
    const dlg = (k) => { const s = g.scene.getScene(k); return s && s.scene.isActive() && s.children.list.some(o => o.depth === 904 && o.text); };
    return { active, encIdx: q ? q.encIdx : -1, ready: q ? !!q.readyToComplete : false, over: q ? !!q.over : true,
      canAct: !!(sc && sc.actionObjs && sc.actionObjs.length), dlg: dlg('Combat') || dlg('Quest'), closing: q && q.closingBeats ? q.closingBeats.length : 0,
      stage: game.campaign.stage, rivalAlive: game.campaign.rivalAlive, quest: !!q };
  });
  const act = () => page.evaluate(() => {
    const g = window.__game; const sc = g.scene.getScene('Combat');
    const game = g.scene.getScene('Town').registry.get('game');
    const st = game.quest.combat; const t = ADV.Combat.currentTurn(st);
    if (!t || !t.isPlayer) return 'not-player-turn';
    const pool = ADV.Combat.validTargets(st, t.unit, 'basic_attack'); if (!pool.length) return 'no-target';
    sc.commitAction(t.unit, { isAttack: true, skillId: 'basic_attack', pool }, pool[0]); return 'acted';
  });
  let fights = 0, sawBanter = false, sawExit = false, shotClosing = false, sawClosingDlg = false;
  for (let step = 0; step < 600; step++) {
    const s = await poll();
    if (process.env.DEBUG) console.log(step, JSON.stringify(s));
    if (errors.length) { console.log('ERRORS', errors); break; }
    if (s.dlg) {
      if (s.active.includes('Combat')) { sawBanter = true; await page.screenshot({ path: SHOT('c04_banter') }); }
      if (s.active.includes('Quest') && (s.ready || !s.quest) && !shotClosing) { shotClosing = true; sawClosingDlg = true; await page.screenshot({ path: SHOT('c05_arden_appears') }); }
      await click(640, 690); await click(640, 690); continue;
    }
    if (s.active.includes('Quest') && s.quest && !s.ready && !s.over && s.encIdx >= 0) {
      await page.evaluate(() => window.__game.scene.getScene('Quest').chooseVerb({ verb: 'fight' }));
      fights = Math.max(fights, s.encIdx + 1);
      await page.waitForTimeout(600); continue;
    }
    if (s.active.includes('Combat')) {
      const exited = await page.evaluate(() => { const game = window.__game.scene.getScene('Town').registry.get('game'); const st = game.quest && game.quest.combat; return !!(st && st.events.some(e => e.t === 'campaignExit')); });
      if (exited) sawExit = true;
      if (s.canAct) await act();
      await page.waitForTimeout(300); continue;
    }
    if (s.active.includes('Quest') && (s.ready || !s.quest)) {
      // wait for either the closing beats or the completion panel
      const panel = await page.evaluate(() => window.__game.scene.getScene('Quest').children.list.some(o => o.text && /Head back to town/.test(o.text)));
      if (!panel) { await page.waitForTimeout(300); continue; }
      await page.screenshot({ path: SHOT('c06_complete') });
      await page.evaluate(() => { const sc = window.__game.scene.getScene('Quest'); sc.scene.start('Town'); });
      await page.waitForTimeout(900); continue;
    }
    if (s.active.includes('Town') && !s.quest) {
      // arrival beats (debrief4) show in town
      const d = await page.evaluate(() => window.__game.scene.getScene('Town').children.list.some(o => o.depth === 904 && o.text));
      if (d) { await page.screenshot({ path: SHOT('c07_debrief4') }); await click(640, 690); await click(640, 690); continue; }
      break;
    }
    if (s.active.includes('Death')) break;
    await page.waitForTimeout(200);
  }
  const fin = await poll();
  ok(fights === 3, 'all three encounters fought (' + fights + ')');
  ok(sawBanter, 'rival banter line shown in combat');
  ok(sawClosingDlg, 'closing sequence dialogue shown (Arden appears / Kite dies)');
  ok(fin.stage === 4 && !fin.rivalAlive, 'stage 4 reached, rival gone');
  ok(fin.active.includes('Town'), 'back in town');
  const title = await page.evaluate(() => ADV.Campaign.titleName(ADV.Game.player(window.__game.scene.getScene('Town').registry.get('game'))));
  ok(title === "The Maw's Own", 'tier-3 title after Q4: ' + title);
  await page.evaluate(() => window.__game.scene.getScene('Town').openPanel('campaign'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('c08_hall_after4') });

  // 3. end card + trainer tabs after completion
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const game = sc.registry.get('game'); ADV.Campaign.complete(game); ADV.CampaignUI.endCard(sc, game); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('c09_endcard') });
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.children.list.filter(o => o.depth >= 960).forEach(o => o.destroy()); sc.trainerTab = 'maw'; sc.openPanel('trainer'); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('c10_trainer_maw') });
  const trainerText = await page.evaluate(() => window.__game.scene.getScene('Town').contentObjs.filter(o => o.text).map(o => o.text).join(' | '));
  ok(/Varenholm/.test(trainerText) && /Corpse Work/.test(trainerText), 'trainer shows faction tabs and Maw skills after unlock');

  // 4. recruiter offer flow from a fresh life
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 77, name: 'Offer', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] });
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game);
    game.campaign.pendingOffer = 'maw'; game.campaign.offers.maw = true;
    window.__game.scene.start('Town');
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOT('c11_offer') });
  const offerDlg = await page.evaluate(() => window.__game.scene.getScene('Town').children.list.some(o => o.depth === 904 && o.text));
  ok(offerDlg, 'recruiter approaches on arrival');
  for (let i = 0; i < 12; i++) { const d = await page.evaluate(() => window.__game.scene.getScene('Town').children.list.some(o => o.depth === 904 && o.text)); if (!d) break; await click(640, 690); await click(640, 690); }
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('c12_join_choice') });
  const joinBtn = await page.evaluate(() => window.__game.scene.getScene('Town').children.list.some(o => o.text && /Join the Maw/.test(o.text)));
  ok(joinBtn, 'Join / decline choice presented');

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' || ') : ''));
  await browser.close();
  const fails = checks.filter(c => !c[0]).length;
  console.log(`\n==== ${checks.length - fails} passed, ${fails} failed ====`);
  process.exit(fails ? 1 : 0);
})();
