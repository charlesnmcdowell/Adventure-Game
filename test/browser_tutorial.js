// Browser run of the guided first hour: creation (name required, sexes
// labelled) → tour → first solo contract → trainer → vault → party (declined,
// then hired at the named wage) → the leader's contract → free play. Also the store's
// Food tab.
'use strict';
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const SHOT = (n) => path.join('/tmp/shots', n + '.png');
(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  await page.evaluate(() => ADV.Save.reset());
  await page.reload(); await page.waitForTimeout(1000);
  const checks = []; const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };
  const canvas = await page.$('canvas'); const box = await canvas.boundingBox();
  const scale = Math.min(box.width / 1280, box.height / 760); const ox = box.x + (box.width - 1280 * scale) / 2, oy = box.y + (box.height - 760 * scale) / 2;
  const click = async (x, y) => { await page.mouse.click(ox + x * scale, oy + y * scale); await page.waitForTimeout(350); };
  const sceneTexts = (key) => page.evaluate((k) => window.__game.scene.getScene(k).children.list.filter(o => o.text).map(o => o.text).join(' | '), key);
  const clickText = async (key, re) => {
    const pos = await page.evaluate(([k, src]) => {
      const rx = new RegExp(src); const sc = window.__game.scene.getScene(k);
      const t = sc.children.list.filter(o => o.text && rx.test(o.text) && o.visible).sort((a, b) => b.depth - a.depth)[0];
      return t ? { x: t.x + (t.originX === 0 ? t.width / 2 : 0), y: t.y + (t.originY === 0 ? t.height / 2 : 0) } : null;
    }, [key, re]);
    if (!pos) return false;
    await click(pos.x, pos.y); return true;
  };

  // Title → cards → creation
  await click(640, 363); await page.waitForTimeout(400);
  for (let i = 0; i < 5; i++) await click(640, 300);
  await page.waitForTimeout(600);
  let t = await sceneTexts('Creation');
  ok(/Your name/.test(t) && /Name yourself first/.test(t), 'creation pauses on the name and requires one');
  ok((t.match(/Woman/g) || []).length >= 5 && (t.match(/Man/g) || []).length >= 5, 'every portrait states its sex');
  await page.screenshot({ path: SHOT('t01_creation') });
  await clickText('Creation', '^Got it$');
  await page.keyboard.type('Wren');
  await page.waitForTimeout(300);
  t = await sceneTexts('Creation');
  ok(/Next — choose your three skills/.test(t), 'Next unlocks once named');
  await clickText('Creation', 'Next — choose');
  await page.waitForTimeout(500);
  // pick three skills: bulwark, cleave, mend
  for (const name of ['^Bulwark', '^Cleave', '^Mend$']) await clickText('Creation', name);
  await page.waitForTimeout(300);
  await clickText('Creation', 'Step into the world');
  await page.waitForTimeout(1200);

  // Town: the tour
  t = await sceneTexts('Town');
  ok(/Welcome to the town/.test(t), 'the tour opens');
  await page.screenshot({ path: SHOT('t02_tour_start') });
  await clickText('Town', '^Show me$');
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(250); if (!(await clickText('Town', '^(Next|Got it)$'))) break; }
  await page.waitForTimeout(400);
  t = await sceneTexts('Town');
  ok(/Take this one/.test(t), 'after the tour: the board opens with the first-contract callout');
  await page.screenshot({ path: SHOT('t03_tour_end') });
  // locked menu: store must not open
  await clickText('Town', '^Store$');
  await page.waitForTimeout(300);
  ok(!/Food is cheap/.test(await sceneTexts('Town')), 'other doors are locked');
  await clickText('Town', '^Quest Board$');
  await page.waitForTimeout(400);
  t = await sceneTexts('Town');
  ok(/Take this one/.test(t), 'board callout points at a Tier 1 solo contract');
  await page.screenshot({ path: SHOT('t04_first_quest') });
  // click the highlighted quest
  const qpos = await page.evaluate(() => { const b = window.__game.scene.getScene('Town').tutorFirstQuestBtn; return b ? { x: b.zone.x + b.zone.width / 2, y: b.zone.y + b.zone.height / 2 } : null; });
  ok(!!qpos, 'a first-quest button is tracked');
  await click(qpos.x, qpos.y); await page.waitForTimeout(400);
  await clickText('Town', '^Set out$'); await page.waitForTimeout(800);

  // play the quest with a strong hand (the point is the flow, not the fight)
  await page.evaluate(() => { const game = window.__game.scene.getScene('Town').registry.get('game'); const p = ADV.Game.player(game); p.stats = { hp: 600, atk: 40, def: 25, spd: 20 }; p.combatHp = 600; });
  const playQuest = async () => {
    for (let step = 0; step < 400; step++) {
      const s = await page.evaluate(() => {
        const g = window.__game; const active = g.scene.scenes.filter(x => x.scene.isActive()).map(x => x.scene.key).join(',');
        const game = g.scene.getScene('Town').registry.get('game'); const q = game.quest; const sc = g.scene.getScene('Combat');
        const dlg = ['Combat', 'Quest', 'Town'].some(k => { const s2 = g.scene.getScene(k); return s2.scene.isActive() && s2.children.list.some(o => o.depth === 904 && o.text); });
        return { active, quest: !!q, ready: q ? !!q.readyToComplete : false, over: q ? !!q.over : true, encIdx: q ? q.encIdx : -1, canAct: !!(sc && sc.actionObjs && sc.actionObjs.length), dlg };
      });
      if (errors.length) break;
      if (s.dlg) { await click(640, 690); await click(640, 690); continue; }
      if (s.active.includes('Quest') && s.quest && !s.ready && !s.over && s.encIdx >= 0) { await page.evaluate(() => window.__game.scene.getScene('Quest').chooseVerb({ verb: 'fight' })); await page.waitForTimeout(500); continue; }
      if (s.active.includes('Combat')) {
        if (s.canAct) await page.evaluate(() => { const g = window.__game; const sc = g.scene.getScene('Combat'); const game = g.scene.getScene('Town').registry.get('game'); const st = game.quest.combat; const tt = ADV.Combat.currentTurn(st); if (tt && tt.isPlayer) { const pool = ADV.Combat.validTargets(st, tt.unit, 'basic_attack'); if (pool.length) sc.commitAction(tt.unit, { isAttack: true, skillId: 'basic_attack', pool }, pool[0]); } });
        await page.waitForTimeout(250); continue;
      }
      if (s.active.includes('Quest') && (s.ready || !s.quest)) {
        const panel = await page.evaluate(() => window.__game.scene.getScene('Quest').children.list.some(o => o.text && /Head back to town/.test(o.text)));
        if (!panel) { await page.waitForTimeout(300); continue; }
        await clickText('Quest', 'Head back to town'); await page.waitForTimeout(900); continue;
      }
      if (s.active.includes('Town') && !s.quest) return true;
      await page.waitForTimeout(200);
    }
    return false;
  };
  ok(await playQuest(), 'first quest played to completion');
  t = await sceneTexts('Town');
  ok(/^.*Gold.*came home with/.test(t) || /came home with/.test(t), 'gold is explained on return');
  await page.screenshot({ path: SHOT('t05_gold') });
  await clickText('Town', '^Next$'); await page.waitForTimeout(300);
  await clickText('Town', '^Trainer$'); await page.waitForTimeout(500);
  t = await sceneTexts('Town');
  ok(/Skills for sale/.test(t), 'trainer callout');
  await page.screenshot({ path: SHOT('t06_trainer') });
  await clickText('Town', '^Understood$'); await page.waitForTimeout(300);
  await clickText('Town', '^Vault$'); await page.waitForTimeout(500);
  t = await sceneTexts('Town');
  ok(/Safe keeping/.test(t) && /In the vault|No vault yet|Carrying:/.test(t), 'vault panel + callout');
  await page.screenshot({ path: SHOT('t07_vault') });
  await clickText('Town', '^Understood$'); await page.waitForTimeout(300);
  await clickText('Town', '^Apply for Party$'); await page.waitForTimeout(500);
  t = await sceneTexts('Town');
  ok(/Ask to join/.test(t) && /30g/.test(t) && /200g/.test(t), 'party callout explains wage negotiation');
  await page.screenshot({ path: SHOT('t08_party') });
  const partyBtn = async () => page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); const tt = sc.contentObjs.filter(o => o.text && /'s party$/.test(o.text))[0]; return tt ? { x: tt.x, y: tt.y } : null; });
  let pb = await partyBtn(); await click(pb.x, pb.y); await page.waitForTimeout(500);
  await click(640, 690); await click(640, 690); await page.waitForTimeout(500);   // leader's line
  let st = await page.evaluate(() => window.__game.scene.getScene('Town').registry.get('game').tutorial);
  ok(st.declined && st.step === 'party', 'first ask was declined');
  t = await sceneTexts('Town');
  ok(/Try another/.test(t), 'told to try another');
  pb = await partyBtn(); await click(pb.x, pb.y); await page.waitForTimeout(500);
  await click(640, 690); await click(640, 690); await page.waitForTimeout(600);
  st = await page.evaluate(() => { const game = window.__game.scene.getScene('Town').registry.get('game'); return { step: game.tutorial.step, wage: ADV.Game.player(game).wage, stage: ADV.Game.careerStage(game) }; });
  ok(st.step === 'partyQuest' && st.stage === 'hireling' && st.wage > 0, 'hired at the named wage: ' + st.wage);
  await page.screenshot({ path: SHOT('t09_hired') });
  await clickText('Town', '^Quest Board$'); await page.waitForTimeout(500);
  t = await sceneTexts('Town');
  ok(/Queue up/.test(t) && /Ready for the quest/.test(t), 'board shows Ready for the quest with the callout');
  await page.screenshot({ path: SHOT('t10_ready') });
  await clickText('Town', '^Ready for the quest$'); await page.waitForTimeout(500);
  await clickText('Town', '^Set out$'); await page.waitForTimeout(800);
  ok(await playQuest(), 'party quest played to completion');
  st = await page.evaluate(() => window.__game.scene.getScene('Town').registry.get('game').tutorial);
  ok(st.step === 'done', 'tutorial finished');
  t = await sceneTexts('Town');
  ok(/That is the whole loop/.test(t), 'closing words');
  await page.screenshot({ path: SHOT('t11_done') });
  await clickText('Town', '^Go on$'); await page.waitForTimeout(300);
  // free play: store food tab
  await clickText('Town', '^Store$'); await page.waitForTimeout(400);
  t = await sceneTexts('Town');
  ok(/Bread and Butter — 5g/.test(t) && /Traveller's Feast — 15g/.test(t), 'store opens on Food');
  await page.evaluate(() => { const game = window.__game.scene.getScene('Town').registry.get('game'); ADV.Game.player(game).inventory.gold = 100; window.__game.scene.getScene('Town').openPanel('store'); });
  await page.waitForTimeout(300);
  await clickText('Town', 'Salted Red Meat'); await page.waitForTimeout(400);
  const meal = await page.evaluate(() => { const game = window.__game.scene.getScene('Town').registry.get('game'); const p = ADV.Game.player(game); return { meal: p.meal && p.meal.id, atk: ADV.Character.effStat(p, 'atk'), base: p.stats.atk }; });
  ok(meal.meal === 'meat' && meal.atk === meal.base + 2, 'meat eaten: +2 ATK for the quest');
  await page.screenshot({ path: SHOT('t12_food') });
  await clickText('Town', '^Gear$'); await page.waitForTimeout(300);
  ok(/Warrior Set — 800g/.test(await sceneTexts('Town')), 'Gear tab');

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' || ') : ''));
  await browser.close();
  const fails = checks.filter(c => !c[0]).length;
  console.log(`\n==== ${checks.length - fails} passed, ${fails} failed ====`);
  process.exit(fails ? 1 : 0);
})();
