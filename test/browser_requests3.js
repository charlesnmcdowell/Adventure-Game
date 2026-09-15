// Browser pass over the third request set: hireling board, store (sell set,
// spouse purchase, Maw desk), trainer tutoring, proposal notice, raise notice.
'use strict';
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const SHOT = (n) => path.join('/tmp/shots', n + '.png');
(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);
  const checks = []; const ok = (c, n) => { checks.push([!!c, n]); console.log((c ? '  ok  ' : 'FAIL  ') + n); };
  const texts = () => page.evaluate(() => window.__game.scene.getScene('Town').children.list.filter(o => o.text).map(o => o.text).join(' | '));

  // hireling: the board shows "Ready for the quest" only
  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Rook', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] });
    const world = game.world, p = ADV.Game.player(game);
    const party = world.parties[0]; const leader = ADV.Party.leader(world, party);
    party.memberIds.push(p.id); party.wages[p.id] = 30; p.partyId = party.id; p.leaderId = leader.id; p.wage = 30;
    game.tutorial = { step: 'done' };
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.stop('Title'); window.__game.scene.start('Town');
  });
  await page.waitForTimeout(900);
  let t = await texts();
  ok(/Ready for the quest/.test(t) && !/SOLO CONTRACTS/.test(t), 'hireling sees only "Ready for the quest"');
  await page.screenshot({ path: SHOT('r01_hireling_board') });

  // store: sell set, spouse purchase, Maw desk
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town'); const game = sc.registry.get('game'); const world = game.world; const p = ADV.Game.player(game);
    ADV.Party.removeMember(world, ADV.Party.of(world, p), p.id);
    p.inventory.gold = 1200; p.equippedSet = 'warrior';
    const wife = world.characters.find(c => c.alive && c.sex === 'f' && !c.isPlayer); ADV.Rel.commit(world, p.id, wife.id); wife.inventory.gold = 900;
    for (const c of world.characters.slice(0, 6)) ADV.World.met(world, c.id);
    sc.storeTab = 'gear'; sc.refreshAll(); sc.openPanel('store');
  });
  await page.waitForTimeout(400);
  t = await texts();
  ok(/Sell the Warrior Set — 800g back/.test(t), 'sell-set button');
  ok(/buys it \(900g\)/.test(t), 'spouse can buy a set with her gold');
  ok(/THE MAW'S DESK/.test(t) && /— \d+g/.test(t), "Maw's desk lists targets with fees");
  ok(/survivor if you or your spouse dies/.test(t), 'insurance covers both');
  await page.screenshot({ path: SHOT('r02_store') });

  // trainer tutoring dialog
  await page.evaluate(() => { const sc = window.__game.scene.getScene('Town'); sc.openPanel('trainer'); ADV.Panels.forgetDialog(sc, 'cleave'); });
  await page.waitForTimeout(400);
  t = await texts();
  ok(/Tutoring to .* — 300g/.test(t) && /600g/.test(t), 'tutoring offers at 300/600');
  await page.screenshot({ path: SHOT('r03_tutoring') });

  // proposal notice
  await page.evaluate(() => {
    const sc = window.__game.scene.getScene('Town'); const game = sc.registry.get('game'); const world = game.world; const p = ADV.Game.player(game);
    sc.children.list.filter(o => o.depth >= 900).forEach(o => o.destroy());
    const wife = ADV.World.byId(world, p.partnerId); ADV.Rel.jilt(world, wife, p); world.pendingPlayerJilt = null;
    p.inventory.gold = 9000;
    world.pendingProposals = [{ fromId: world.characters.find(c => c.alive && c.sex === 'f' && !c.isPlayer && !c.partnerId).id, at: world.questClock }];
    sc.queueArrivalNotices(true); sc.nextNotice();
  });
  await page.waitForTimeout(700);
  const dlg = await page.evaluate(() => window.__game.scene.getScene('Town').children.list.some(o => o.depth === 904 && o.text));
  ok(dlg, 'she speaks first');
  const canvas = await page.$('canvas'); const box = await canvas.boundingBox();
  const scale = Math.min(box.width / 1280, box.height / 760); const ox = box.x + (box.width - 1280 * scale) / 2, oy = box.y + (box.height - 760 * scale) / 2;
  const click = async (x, y) => { await page.mouse.click(ox + x * scale, oy + y * scale); await page.waitForTimeout(300); };
  await click(640, 690); await click(640, 690);
  await page.waitForTimeout(400);
  t = await texts();
  ok(/asks you/.test(t) && /wealthiest men/.test(t), 'proposal choice shown');
  await page.screenshot({ path: SHOT('r04_proposal') });

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' || ') : ''));
  await browser.close();
  const fails = checks.filter(c => !c[0]).length;
  console.log(`\n==== ${checks.length - fails} passed, ${fails} failed ====`);
  process.exit(fails ? 1 : 0);
})();
