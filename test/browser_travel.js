'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game&&ADV.TravelUI);
 await page.evaluate(()=>{
  ADV.Save.reset();const g=ADV.Game.newGame({seed:918,name:'Rook',sex:'m',personalityId:'M01',startingSkills:['mend']});g.tutorial={step:'done'};
  __game.registry.set('game',g);__game.scene.stop('Title');__game.scene.start('Town');
 });await page.waitForTimeout(600);
 fs.mkdirSync('tools/travel_screenshots',{recursive:true});
 const locations=await page.evaluate(()=>Object.keys(ADV.DATA.TRAVEL_LOCATIONS));
 for(const id of locations){
  await page.evaluate(id=>{
   const sc=__game.scene.getScene('Town'),g=sc.game_;
   ADV.UI.clearCards&&ADV.UI.clearCards();
   const q=ADV.Travel.declare({id:'visual-'+id,name:'A road worth remembering',travelLocation:id,payout:100,encounters:[],factionAlignment:'neutral'});
   window.travelDone=false;
   ADV.TravelUI.play(sc,g,q,'outbound',()=>window.travelDone=true);
  },id);
  await page.waitForTimeout(1900);
  if(['forest','tally','city','academy','green','ossuary'].includes(id))await page.screenshot({path:'tools/travel_screenshots/'+id+'.png'});
  const state=await page.evaluate(()=>({skip:__game.scene.getScene('Town').children.list.some(o=>o.text==='Skip journey'),keys:Object.keys(__game.textures.list).filter(k=>k.startsWith('journey-')).length}));
  assert.equal(state.skip,false,id+' first view cannot skip');assert.equal(state.keys,5);
  // Advance scene time without a real ten-second wait for every catalog entry.
  await page.evaluate(()=>__game.scene.getScene('Town').time.timeScale=25);
  await page.waitForFunction(()=>window.travelDone,{},{timeout:10000});
  await page.evaluate(()=>__game.scene.getScene('Town').time.timeScale=1);
  assert.equal(await page.evaluate(()=>Object.keys(__game.textures.list).filter(k=>k.startsWith('journey-')).length),0,id+' textures cleaned');
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tools/travel_browser_results.json',JSON.stringify({locations:locations.length,errors},null,2));
 console.log(JSON.stringify({locations:locations.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
