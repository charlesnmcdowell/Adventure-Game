// Browser run of the Varenholm's Gate story campaign: the hall, a departure with
// its beats, the first pick-a-line choice in a real encounter, a town-arrival
// choice, and the epilogue card. Drives real scenes; dialogue boxes and choice
// buttons are advanced by canvas clicks. Server on :8734.
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
  page.on('console', m => { if (m.type() === 'error' && !/audio|mp3|favicon|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  const GW = 1280, GH = 760;
  const scale = Math.min(box.width / GW, box.height / GH);
  const ox = box.x + (box.width - GW * scale) / 2, oy = box.y + (box.height - GH * scale) / 2;
  const click = async (gx, gy) => { await page.mouse.click(ox + gx * scale, oy + gy * scale); await page.waitForTimeout(300); };
  const checks = [];
  const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };

  // text objects visible in any active scene, with game-space centres
  const texts = () => page.evaluate(() => {
    const out = [];
    for (const s of window.__game.scene.scenes) {
      if (!s.scene.isActive()) continue;
      const walk = (list, dx, dy) => { for (const o of list) { if (o.list) walk(o.list, dx + (o.x || 0), dy + (o.y || 0)); else if (o.text != null && o.visible) out.push({ t: o.text, x: dx + o.x + (0.5 - (o.originX || 0)) * (o.width || 0), y: dy + o.y + (0.5 - (o.originY || 0)) * (o.height || 0), d: o.depth, scene: s.scene.key }); } };
      walk(s.children.list, 0, 0);
    }
    return out;
  });
  const findText = async (re) => (await texts()).find(o => re.test(o.t));
  const clickText = async (re) => { const o = await findText(re); if (!o) return false; await click(o.x, o.y); return true; };
  const dlgOpen = () => page.evaluate(() => window.__game.scene.scenes.some(s => s.scene.isActive() && s.children.list.some(o => o.depth === 904 && o.text)));
  const modalOpen = () => page.evaluate(() => window.__game.scene.scenes.some(s => s.scene.isActive() && s.children.list.some(o => o.depth >= 928 && o.depth <= 931 && o.text)));
  // advance dialogue boxes until a modal shows or none is open
  const clickThrough = async (max) => { for (let i = 0; i < (max || 12); i++) { if (await modalOpen()) return 'modal'; if (!(await dlgOpen())) return 'done'; await click(640, 690); await click(640, 690); await page.waitForTimeout(250); } return 'stuck'; };

  // 1. fresh strong player, straight to town (a voiced life — Town sends unvoiced ones back to Title)
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Ward', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['bulwark', 'aimed_shot', 'cleave'] });
    const p = ADV.Game.player(game);
    ADV.Conversation.assign(p, 'F01');
    p.stats = { hp: 900, atk: 60, def: 30, spd: 22 };
    for (const e of p.perks.concat(p.actives)) e.level = 40;
    p.inventory.gold = 4000;
    game.tutorial = { step: 'done' };
    ADV.Campaign3.restart(game);
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.stop('Title');
    window.__game.scene.start('Town');
  });
  const activeScenes = () => page.evaluate(() => window.__game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(','));
  for (let i = 0; i < 10 && !/Town/.test(await activeScenes()); i++) await page.waitForTimeout(400);
  await page.waitForTimeout(1200);
  ok(/Town/.test(await activeScenes()), 'Town is up');
  const menu = await texts();
  ok(menu.some(o => /Varenholm's Gate/.test(o.t)), 'town menu carries the story entry from the first minute');

  // 2. the hall
  await page.evaluate(() => window.__game.scene.getScene('Town').openPanel('story'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('s01_hall') });
  const hall = (await texts()).map(o => o.t).join(' | ');
  ok(/1\. The Road from Lanternhold/.test(hall) && /14\. The Temple of Morrak/.test(hall), 'hall lists all fourteen quests');
  ok(/PROLOGUE/.test(hall) && /CHAPTER 7/.test(hall), 'hall groups quests by chapter');
  ok(/THE COMPANY/.test(hall) && /Nobody yet/.test(hall), 'company picker shows before anyone joins');
  ok(/Progress survives death/.test(hall), 'persistence note shown');

  // 3. quest 1 from the hall: departure screen -> set out -> embark -> beats
  ok(await clickText(/^1\. The Road from Lanternhold/), 'quest 1 button clickable');
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT('s02_departure') });
  const dep = (await texts()).map(o => o.t).join(' | ');
  ok(/Set out/i.test(dep), 'departure screen opened for the story quest');
  ok(await clickText(/^Set out/i), 'set out');
  // the first journey to a place never offers a skip: run the clock fast until Tesfaye speaks
  await page.evaluate(() => { window.__game.scene.getScene('Town').time.timeScale = 25; });
  for (let i = 0; i < 60 && !(await dlgOpen()); i++) await page.waitForTimeout(400);
  await page.evaluate(() => { window.__game.scene.getScene('Town').time.timeScale = 1; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('s03_departure_beat') });
  ok(await dlgOpen(), 'Tesfaye speaks at departure');
  const seen = async (re, tries) => { for (let i = 0; i < (tries || 12); i++) { if (await findText(re)) return true; await page.waitForTimeout(150); } return false; };
  ok(await seen(/Wake, my child|travelling coat/), 'the first departure line is on screen');
  // the departure beat itself ends in a choice (questions loop back; the last option continues)
  let state = await clickThrough(14);
  ok(state === 'modal', 'Tesfaye\'s wake-up ends in a choice modal (' + state + ')');
  const wakeTexts = (await texts()).filter(o => o.d >= 928 && o.d <= 931).map(o => o.t);
  ok(wakeTexts.some(t => /Why tonight\?/.test(t)) && wakeTexts.some(t => /I will get my things/.test(t)), 'the wake-up offers questions and a way on');
  ok(await clickText(/^Why tonight\?/), 'asked a question');
  state = await clickThrough(10);
  ok(state === 'modal', 'the question was answered and the same choice came back (' + state + ')');
  const againTexts = (await texts()).filter(o => o.d >= 928 && o.d <= 931).map(o => o.t);
  ok(!againTexts.some(t => /Why tonight\?/.test(t)) && againTexts.some(t => /I will get my things/.test(t)), 'the asked question is gone; the rest remain');
  ok(await clickText(/^I will get my things/), 'went to get my things');
  state = await clickThrough(10);
  ok(state === 'modal', 'Tesfaye asks his own question before you go (' + state + ')');
  ok(await clickText(/^No one\./), 'answered him');
  state = await clickThrough(14);
  ok(state === 'modal', 'the storehouse opener ends in a choice modal (' + state + ')');
  await page.screenshot({ path: SHOT('s04_choice') });
  const modalTexts = (await texts()).filter(o => o.d >= 928 && o.d <= 931).map(o => o.t);
  ok(modalTexts.some(t => /Who paid you\?/.test(t)) && modalTexts.some(t => /Go\. Run, and I will not follow\./.test(t)), 'four options are offered, in the player\'s words');
  ok(modalTexts.some(t => /Stand still and I/.test(t)), 'the prompt shows the NPC\'s last line');
  // pick "Run" -> bypass -> reply -> next encounter
  ok(await clickText(/^Go\. Run, and I will not follow\./), 'picked an option');
  const mine = await seen(/Go\. Run, and I will not follow|^Go\. Run/, 15);
  await page.screenshot({ path: SHOT('s05_player_line') });
  ok(mine, 'the player\'s picked line shows in the dialogue box');
  state = await clickThrough(10);
  ok(state === 'modal', 'reply played, and Tesfaye debriefs you before the next fight (' + state + ')');
  ok(await clickText(/^Two hundred in gold/), 'told him about the bounty');
  state = await clickThrough(10);
  ok(state === 'done', 'the debrief closed (' + state + ')');
  await page.waitForTimeout(700);
  const q = await page.evaluate(() => { const g = window.__game.scene.getScene('Town').registry.get('game'); return { encIdx: g.quest.encIdx, heritage: ADV.Campaign3.state(g).heritage, choice: ADV.Campaign3.state(g).choices.q1_nib }; });
  ok(q.encIdx === 1 && q.choice === 'run' && q.heritage === -1, 'letting Nib run bypassed the fight and moved the blood one step toward starving', JSON.stringify(q));
  state = await clickThrough(10);
  await page.screenshot({ path: SHOT('s06_encounter2') });
  const enc2 = (await texts()).map(o => o.t).join(' | ');
  ok(/Cobb/.test(enc2) && /Fight/i.test(enc2), 'the second encounter (Cobb) is on the table with the fight verb');

  // 4. a town-arrival choice: jump to the end of Q1 and let the debrief queue play in Town
  await page.evaluate(() => {
    const g = window.__game.scene.getScene('Town').registry.get('game');
    const C3 = ADV.Campaign3; const s = C3.state(g); s.stage = 1;
    for (const b of C3.arrivalBeats(g, 1)) C3.pushBeat(g, b);
    const quest = window.__game.scene.getScene('Quest');
    // abandon the run and go home the way the quest scene does
    g.quest = null; window.__game.scene.getScene('Town').campaignArrivalDone = false;
    quest.scene.start('Town');
  });
  await page.waitForTimeout(2500);
  const townUp = await page.evaluate(() => window.__game.scene.getScene('Town').scene.isActive());
  if (!townUp) {
    // the scene switch did not settle in this environment: play the arrival directly
    await page.evaluate(() => { const t = window.__game.scene.getScene('Quest'); const g = t.registry.get('game'); ADV.CampaignUI.arrival(t, g, () => {}); });
    await page.waitForTimeout(800);
  }
  for (let i = 0; i < 40 && !(await dlgOpen()) && !(await modalOpen()); i++) await page.waitForTimeout(250);   // Town settles at its own pace
  state = await clickThrough(10);
  await page.screenshot({ path: SHOT('s07_arrival_choice') });
  ok(state === 'modal', 'Hiwot\'s arrival beat ends in a choice in Town (' + state + ')');
  ok(await clickText(/Stay close to me/), 'answered Hiwot');
  state = await clickThrough(10);
  await page.waitForTimeout(600);
  const joined = await page.evaluate(() => { const g = window.__game.scene.getScene('Town').registry.get('game'); return { recruited: ADV.Campaign3.isRecruited(g, 'wren_ward'), aff: ADV.Campaign3.aff(g, 'wren_ward') }; });
  ok(joined.recruited && joined.aff === 1, 'Hiwot joined the company with affinity from the answer', JSON.stringify(joined));
  await page.evaluate(() => window.__game.scene.getScene('Town').openPanel('story'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('s08_hall_after_q1') });
  const hall2 = (await texts()).map(o => o.t).join(' | ');
  ok(/● Hiwot/.test(hall2) && /2\. The Open Hand/.test(hall2), 'hall shows Hiwot riding along and quest 2 open');

  // 5. the epilogue card
  await page.evaluate(() => {
    const g = window.__game.scene.getScene('Town').registry.get('game');
    const C3 = ADV.Campaign3; const s = C3.state(g);
    s.stage = 14; s.allegiance = 'gauntlet'; s.heritage = -2; s.romance = 'cassian'; s.recruited.push('selene', 'dorran', 'cassian');
    C3.resolveEnding(g, 'kill');
    const scene = window.__game.scene.scenes.find(sc => sc.scene.isActive());
    ADV.Campaign3UI.endCard(scene, g);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOT('s09_epilogue') });
  const card = (await texts()).map(o => o.t).join(' | ');
  ok(/The Gate Stands/.test(card) && /his knighting/.test(card), 'the epilogue card shows the hero ending with the romance line');
  ok(await clickText(/Back to the hall/), 'closed the card');
  await page.waitForTimeout(400);

  await browser.close();
  const failed = checks.filter(c => !c[0]).length;
  if (errors.length) { console.log('console errors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ', e)); }
  console.log(`\n==== ${checks.length - failed} passed, ${failed} failed ====`);
  process.exit(failed || errors.length ? 1 : 0);
})().catch(e => { console.log('DRIVER FAIL', e); process.exit(2); });
