'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game&&ADV.TravelUI);
await page.evaluate(()=>{ADV.Save.reset();const g=ADV.Game.newGame({seed:924,name:'Rook',sex:'m',personalityId:'M01',startingSkills:['mend']});g.tutorial={step:'done'};__game.registry.set('game',g);__game.scene.stop('Title');__game.scene.start('Town');});await page.waitForTimeout(600);
const turns=await page.evaluate(()=>{
 const sc=__game.scene.getScene('Town'),g=sc.game_,p=ADV.Game.player(g),ns=g.world.characters.filter(c=>c.alive&&!c.isPlayer&&!c.isMonster&&!c.campaign).slice(0,2);
 ns[0].personalityId='M01';ns[0].name='Edwyn';ns[1].personalityId='M02';ns[1].name='Garrick';ns.forEach(c=>{c.isConscript=false;c.isUndead=false;c.hasFled=false;c.combatHp=ADV.Character.maxHp(c);});
 ADV.Game.partyRoster=()=>[p,...ns];window.journeyDone=false;
 const q=ADV.Travel.declare({id:'party-shot',name:'Following the old forest road',travelLocation:'forest',payout:100,encounters:[],factionAlignment:'neutral'});
 const turns=ADV.Travel.dialogue(g,q,'outbound',ADV.Travel.plan(g,q,'outbound'));
 ADV.TravelUI.play(sc,g,q,'outbound',()=>window.journeyDone=true);return turns.map(t=>({name:t.speaker.name,pid:t.speaker.personalityId,text:t.text,to:t.to.name,band:t.band}));
});await page.waitForTimeout(2900);
const src=await page.evaluate(()=>ADV.Music.voiceEl&&ADV.Music.voiceEl.src);
assert.ok(src.includes('/'+turns[0].pid+'/'+turns[0].band+'_1.mp3'));
await page.screenshot({path:'tools/travel_screenshots/party_conversation.png'});
await page.mouse.click(900,660);assert.equal(await page.evaluate(()=>window.journeyDone),false);
await page.waitForFunction(()=>window.journeyDone,{},{timeout:35000});
assert.equal(await page.evaluate(()=>__game.scene.getScene('Town')._chromeHidden),0);
assert.deepEqual(errors,[]);fs.writeFileSync('tools/travel_party_results.json',JSON.stringify({turns,src,errors},null,2));console.log(JSON.stringify({turns:turns.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
