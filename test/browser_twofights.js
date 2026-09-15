// REGRESSION: the second fight of a quest must accept player actions.
// (Phaser reuses scene instances; a stale `ended` flag once froze fight 2.)
// Drives the real Combat scene deterministically via scene calls.
'use strict';
const { chromium } = require('playwright');

(async () => {
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 91, name: 'Two', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['aimed_shot', 'snare', 'marksman'] });
    window.__game.scene.getScene('Town').registry.set('game', game);
    const q = game.board.find(x => x.tier === 1 && x.track === 'solo' && x.encounters.length >= 2);
    ADV.Game.startQuest(game, q, {});
    window.__game.scene.stop('Title');
    window.__game.scene.start('Quest');
  });
  await page.waitForTimeout(700);

  const poll = () => page.evaluate(() => {
    const g = window.__game;
    const active = g.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key).join(',');
    const game = g.scene.getScene('Town').registry.get('game');
    const q = game.quest;
    const sc = g.scene.getScene('Combat');
    const st = q && q.combat;
    return {
      active, encIdx: q ? q.encIdx : -1, ready: q ? !!q.readyToComplete : false,
      over: q ? !!q.over : true, round: st ? st.round : 0,
      canAct: !!(sc && sc.actionObjs && sc.actionObjs.length), ended: sc ? !!sc.ended : null,
    };
  });

  // deterministic player turn: basic attack the first valid target
  const act = () => page.evaluate(() => {
    const g = window.__game;
    const sc = g.scene.getScene('Combat');
    const game = g.scene.getScene('Town').registry.get('game');
    const st = game.quest.combat;
    const t = ADV.Combat.currentTurn(st);
    if (!t || !t.isPlayer) return 'not-player-turn';
    const pool = ADV.Combat.validTargets(st, t.unit, 'basic_attack');
    if (!pool.length) return 'no-target';
    sc.commitAction(t.unit, { isAttack: true, skillId: 'basic_attack', pool }, pool[0]);
    return 'acted';
  });

  const enterFight = () => page.evaluate(() => {
    const sc = window.__game.scene.getScene('Quest');
    sc.chooseVerb({ verb: 'fight' });
  });

  let fightsEntered = 0, actionsInFight = {};
  for (let step = 0; step < 240; step++) {
    const s = await poll();
    if (errors.length) break;
    if (s.active.includes('Quest') && !s.ready && !s.over && s.encIdx >= 0) {
      await enterFight();
      fightsEntered = Math.max(fightsEntered, s.encIdx + 1);
      await page.waitForTimeout(600);
      continue;
    }
    if (s.active.includes('Combat')) {
      if (s.canAct) {
        const r = await act();
        if (r === 'acted') actionsInFight[fightsEntered] = (actionsInFight[fightsEntered] || 0) + 1;
      }
      await page.waitForTimeout(350);
      continue;
    }
    if (s.ready || s.over || s.active.includes('Town') || s.active.includes('Death')) {
      if (fightsEntered >= 2) break;
      if (s.active.includes('Town') || s.active.includes('Death')) break;
    }
    await page.waitForTimeout(350);
  }

  const s = await poll();
  const f2 = actionsInFight[2] || 0;
  console.log('fights entered:', fightsEntered, 'actions per fight:', JSON.stringify(actionsInFight));
  console.log('final:', JSON.stringify(s));
  console.log('errors:', errors.length);
  errors.slice(0, 5).forEach(e => console.log(' ', e));
  const pass = fightsEntered >= 2 && f2 > 0 && !errors.length;
  console.log(pass ? 'PASS: second fight accepts player actions' : 'FAIL: second-fight regression');
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error('DRIVER FAIL', e); process.exit(2); });
