/* global __game, __finaleBox, __finaleDone, __movieDone */
'use strict';
const { chromium, webkit } = require('playwright'), fs = require('node:fs'), assert = require('node:assert/strict');
const dir = 'test/reports/gate-finale'; fs.mkdirSync(dir, { recursive: true });
(async () => {
 const engine = process.argv.includes('--webkit') ? webkit : chromium;
 const browser = await engine.launch({ headless: true });
 const reports = [];
 try {
  for (const viewport of [{width:1280,height:760},{width:844,height:390}]) {
   const context = await browser.newContext({ viewport, hasTouch: true }), page = await context.newPage(), errors = [];
   page.setDefaultTimeout(30000);
   console.log(engine.name(), viewport.width, 'starting');
   page.on('pageerror', e => errors.push(e.message));
   await page.goto('http://127.0.0.1:8734/index.html');
   await page.waitForFunction(() => window.__game?.scene.isActive('Title') && !!ADV.GateArt?.playOpening);
   await page.evaluate(() => {
    const g = ADV.Game.newGame({ seed: 1514, name: 'Ward', sex: 'f' }); g.tutorial = {step:'done'};
    g.player.inventory.gold = 50000; ADV.Campaign3.debugJump(g, 14);
    if (!ADV.Game.startQuest(g, ADV.Campaign3.buildQuest(g, 14), {}).ok) throw Error('Start failed');
    g.quest.encIdx = 3; g.quest.departureShown = true; ADV.GateFinale.takeSoul(g);
    __game.registry.set('game', g);
    const show = ADV.DialogueBox.showText;
    ADV.DialogueBox.showText = function (...args) { return window.__finaleBox = show.apply(this, args); };
    const b = document.createElement('button'); b.id='finale-test-start'; b.textContent='Start'; b.style.cssText='position:fixed;z-index:99999;top:0';
    b.onclick=()=>{b.remove();__game.scene.stop('Title');__game.scene.start('Quest');}; document.body.append(b);
   });
   await page.locator('#finale-test-start').click();
   await page.waitForFunction(() => __game.scene.getScene('Quest').gateSequence?.spec?.id === 'morrak_realm' && ADV.Music.voiceEl?.currentTime > .2);
   const first = await page.evaluate(() => {
    const s = __game.scene.getScene('Quest');
    return {spec:s.gateSequence.spec,elapsed:s.gateSequence.view.ambience.elapsed,voice:ADV.Music.voiceEl.src,cutscene:s.__cutscene,allies:ADV.Game.partyRoster(s.game_).map(ch=>ch.campaignId)};
   });
   assert.ok(first.cutscene && !first.allies.includes('wren_ward'));
   assert.ok(first.voice.includes('korvath/q14_final_realm_1'));
   await page.waitForTimeout(800);
   assert.ok(await page.evaluate(t=>__game.scene.getScene('Quest').gateSequence.view.ambience.elapsed>t,first.elapsed));
   await page.screenshot({path:`${dir}/${engine.name()}-${viewport.width}-realm.png`});
   // Close the real boxes to allow the scene sequence to restore the battlefield.
   for (let i=0;i<3;i++) {
    await page.evaluate(()=>__finaleBox.close());
    await page.waitForTimeout(100);
   }
   await page.waitForFunction(()=>!__game.scene.getScene('Quest').__cutscene);
   await page.waitForTimeout(300);
   await page.screenshot({path:`${dir}/${engine.name()}-${viewport.width}-battle.png`});
   const menu = await page.evaluate(() => {
    const s=__game.scene.getScene('Quest'),g=s.game_; window.__finaleDone=false;
    ADV.Campaign3UI.pickModal(s,g,{who:'korvath',key:'q14_final_questions'},ADV.Campaign3.options(g,'q14_final_questions'),()=>{window.__finaleDone=true;});
    return ADV.Campaign3.options(g,'q14_final_questions').map(o=>o.text);
   });
   assert.equal(menu.length,4); await page.screenshot({path:`${dir}/${engine.name()}-${viewport.width}-questions.png`});
   const point=await page.evaluate(()=>{
    const s=__game.scene.getScene('Quest'),all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};s.children.list.forEach(walk);
    const t=all.find(o=>o.text==='Enough. I will stop you.'),b=t.getBounds(),r=__game.canvas.getBoundingClientRect();
    return{x:r.x+b.centerX*r.width/1280,y:r.y+b.centerY*r.height/760};
   });
   await page.mouse.click(point.x,point.y,{delay:100}); await page.waitForFunction(()=>__finaleDone);
   console.log(engine.name(), viewport.width, 'realm and choices passed');
   // Missing movie assets must not affect Q1. A failed future render has a hard escape.
   await page.evaluate(()=>{
    const s=__game.scene.getScene('Quest'); window.__movieDone=false;
    if(ADV.GateArt.openingMovie.src!==null)throw Error('Unreviewed movie enabled');
    ADV.GateArt.playOpening(s,s.game_,()=>{window.__movieDone=true;},{src:'missing-test-movie.mp4',title:'Opening test',version:1});
   });
   assert.equal(await page.locator('.gate-opening-movie').count(),1);
   await page.getByRole('button',{name:'Continue to quest',exact:true}).click();
   assert.ok(await page.evaluate(()=>__movieDone&&!ADV.Music.movieHeld));
   assert.equal(await page.locator('.gate-opening-movie').count(),0);
   assert.deepEqual(errors,[]); reports.push({engine:engine.name(),viewport,...first,questions:menu.length,animation:true,movieEscape:true,errors});
   await context.close();
  }
 } finally { await browser.close(); }
 fs.writeFileSync(`${dir}/${engine.name()}.json`,JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
