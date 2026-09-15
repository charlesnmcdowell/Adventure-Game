'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game&&ADV.TravelUI);
await page.evaluate(()=>{ADV.Save.reset();const g=ADV.Game.newGame({seed:524,name:'Rook',sex:'m',personalityId:'M01',startingSkills:['mend']});g.tutorial={step:'done'};__game.registry.set('game',g);__game.scene.stop('Title');__game.scene.start('Town');});await page.waitForTimeout(500);
await page.evaluate(()=>{
 const sc=__game.scene.getScene('Town'),g=sc.game_;g.meta.travelSeen={};
 window.q=ADV.Travel.declare({id:'flow',name:'The village mile',travelLocation:'road',track:'solo',tier:1,payout:40,factionAlignment:'neutral',enemyLevels:[1,2],encounters:[{enemyTypeIds:['dire_wolf']},{enemyTypeIds:['dire_wolf']},{enemyTypeIds:['dire_wolf']}]});
 // Isolate repeat behavior from the independent rare-event scheduler.
 g.meta.travelLastEvent={road:'roadside-candle'};
 for(const event of ['roadside-candle','occupied-landmark','weather-turn'])g.meta.travelSeen[ADV.Travel.key(q,'outbound',event)]=2;
 window.done=0;ADV.TravelUI.play(sc,g,q,'outbound',()=>window.done++);
});await page.waitForTimeout(1500);
assert.equal(await page.evaluate(()=>__game.scene.getScene('Town').children.list.some(o=>o.text==='Skip journey')),false);
await page.mouse.click(1100,700);assert.equal(await page.evaluate(()=>window.done),0);
await page.evaluate(()=>__game.scene.getScene('Town').time.timeScale=25);await page.waitForFunction(()=>window.done===1);await page.evaluate(()=>__game.scene.getScene('Town').time.timeScale=1);
await page.evaluate(()=>{const sc=__game.scene.getScene('Town');ADV.TravelUI.play(sc,sc.game_,q,'outbound',()=>window.done++);});await page.waitForTimeout(1400);
assert.equal(await page.evaluate(()=>__game.scene.getScene('Town').children.list.some(o=>o.text==='Skip journey')),true);
await page.mouse.click(1180,40);await page.waitForFunction(()=>window.done===2);
await page.evaluate(()=>{const sc=__game.scene.getScene('Town');ADV.TravelUI.play(sc,sc.game_,q,'outbound',()=>window.done++);});assert.equal(await page.evaluate(()=>window.done),3,'third view bypasses immediately');
// Departure controls: decline provisions, attempt to vault expenses, then leave.
await page.evaluate(()=>{const sc=__game.scene.getScene('Town');window.portq=ADV.Travel.declare({...q,id:'port-flow',travelLocation:'port'});ADV.Game.player(sc.game_).inventory.gold=100;ADV.Panels.departure(sc,portq);});
await page.screenshot({path:'tools/travel_screenshots/departure.png'});
await page.mouse.click(600,583);assert.equal(await page.evaluate(()=>__game.scene.getScene('Town').children.list.some(o=>o.text==='No provisions · arrive at 85% health')),true);
await page.mouse.click(640,255);await page.mouse.click(520,680);
assert.equal(await page.evaluate(()=>!!__game.registry.get('game').quest),false,'cannot vault passage money');
await page.mouse.click(450,255);await page.mouse.click(520,680);
await page.waitForFunction(()=>!!__game.registry.get('game').quest);
assert.equal(await page.evaluate(()=>__game.registry.get('game').quest.travel.provisions),false);
// Speed through outbound and the single mid-leg, then exercise return + results.
await page.evaluate(()=>__game.scene.getScene('Town').time.timeScale=30);
await page.waitForFunction(()=>__game.scene.isActive('Quest'),{},{timeout:20000});
await page.evaluate(()=>{const sc=__game.scene.getScene('Quest');sc.game_.quest.encIdx=1;sc.scene.restart();});await page.waitForTimeout(100);
await page.evaluate(()=>__game.scene.getScene('Quest').time.timeScale=30);
await page.waitForFunction(()=>__game.registry.get('game').quest.travelMidShown);await page.waitForTimeout(600);
await page.evaluate(()=>{const sc=__game.scene.getScene('Quest'),g=sc.game_;window.beforeClock=g.world.questClock;window.ambushCount=0;
 ADV.Game.pendingAmbush=()=>({attacker:g.world.characters.find(c=>!c.isPlayer&&c.alive),kind:'assassin'});
 sc.ambushIntro=function(){window.ambushCount++;this.scene.restart();};
 g.quest.over=true;g.quest.readyToComplete=true;sc.scene.restart();});
await page.waitForFunction(()=>window.ambushCount===1,{},{timeout:20000});
await page.waitForFunction(()=>__game.registry.get('game').travelResolution.q.travelReturnShown,{},{timeout:20000});
const state=await page.evaluate(()=>{const g=__game.registry.get('game');return {clock:g.world.questClock-beforeClock,ambushes:ambushCount,reimbursed:g.travelResolution.out.travelReimbursement,textures:Object.keys(__game.textures.list).filter(k=>k.startsWith('journey-')).length};});
assert.equal(state.clock,2);assert.equal(state.ambushes,1);assert.equal(state.reimbursed,8);assert.equal(state.textures,0);
await page.screenshot({path:'tools/travel_screenshots/results.png'});
assert.deepEqual(errors,[]);fs.writeFileSync('tools/travel_flow_results.json',JSON.stringify({state,errors},null,2));console.log(JSON.stringify({state,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
