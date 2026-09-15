// Screenshot a full party battle (lanes, intents, reserves) fabricated in-page.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const args = ['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args }).catch(() => chromium.launch({ args }));
  const page = await browser.newPage({ viewport: { width: 1340, height: 820 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8734/index.html');
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    // fabricate a game with a 5v6 battle and jump straight to Combat
    ADV.Save.reset();
    const game = ADV.Game.newGame({ seed: 777, name: 'Captain', sex: 'm', portraitSlot: 1, portraitSeed: 7942, startingSkills: ['cleave', 'sunder', 'momentum'] });
    const world = game.world;
    const p = ADV.Game.player(game);
    const rng = new ADV.RNG(5);
    const allies = world.characters.filter(c => !c.isPlayer && c.alive).slice(0, 4);
    const enemies = [];
    for (const t of ['bandit', 'bandit', 'hedge_mage', 'dire_wolf', 'plated_sentinel', 'grave_acolyte']) {
      enemies.push(ADV.Character.makeEnemy(rng, t, {}));
    }
    const side = [p].concat(allies);
    for (const c of side.concat(enemies)) c.combatHp = ADV.Character.maxHp(c);
    const st = ADV.Combat.create(side, enemies, { rng });
    game.quest = { quest: { name: 'demo', encounters: [{}] }, encIdx: 0, combat: st, witnessedNew: [], defeatedNamed: [], lootGold: 0 };
    window.__game.scene.getScene('Town').registry.set('game', game);
    window.__game.scene.stop('Town');
    window.__game.scene.start('Combat', { mode: 'quest' });
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/shots/party_battle.png' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/shots/party_battle2.png' });
  console.log('errors:', errors.length);
  errors.slice(0, 8).forEach(e => console.log(' ', e.slice(0, 200)));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(2); });
