'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true}),ctx=await b.newContext({viewport:{width:1280,height:760}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto('http://127.0.0.1:8734/index.html');await p.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField);
  const route=await p.evaluate(()=>{
   const g=ADV.Game.newGame({seed:173,name:'Gate route',sex:'f',personalityId:'F01'});g.tutorial={step:'done'};ADV.Game.player(g).inventory.gold=5000;ADV.Campaign3.debugJump(g,1);
   const q=ADV.Campaign3.buildQuest(g,1);if(!ADV.Game.startQuest(g,q).ok)throw Error('Departure failed');
   __game.registry.set('game',g);__game.scene.stop('Title');__game.scene.start('Quest');
   return {provider:ADV.CampaignRoutes.forQuest(q).id,chapter:g.quest.departureBeats[0].artChapter,solo:ADV.Game.partyRoster(g).length};
  });
  assert.deepEqual(route,{provider:'gate',chapter:0,solo:1});
  await p.waitForFunction(()=>{const s=__game.scene.getScene('Quest'),all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};s.children.list.forEach(walk);return all.some(o=>o.text==='Continue'&&o.active);},{},{timeout:30000});
  const at=await p.evaluate(()=>{const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};__game.scene.getScene('Quest').children.list.forEach(walk);const o=all.find(o=>o.text==='Continue'&&o.active),r=o.getBounds(),c=__game.canvas.getBoundingClientRect();return{x:c.x+r.centerX*c.width/1280,y:c.y+r.centerY*c.height/760};});
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await p.mouse.click(at.x,at.y,{delay:100});
  await p.waitForFunction(()=>{const s=__game.scene.getScene('Quest');return s.gateSequence?.view&&s.children.list.some(o=>o.text&&/Tesfaye/.test(o.text));},{},{timeout:30000}).catch(async e=>{console.log('GATE DIAGNOSTIC',await p.evaluate(()=>{const s=__game.scene.getScene('Quest'),all=[],walk=o=>{if(o.text)all.push(o.text);o.list?.forEach(walk);};s.children.list.forEach(walk);return{text:all,state:s.gateSequence?.spec,chapter:ADV.Campaign3.state(__game.registry.get('game')).artChapters};}),errors);await p.screenshot({path:'test/reports/gate-failure.png'});throw e;});
  const scene=await p.evaluate(()=>{const s=__game.scene.getScene('Quest');return{cutscene:s.__cutscene,location:s.gateSequence.spec.id,weather:!!s.gateSequence.weather,chapterSeen:!!ADV.Campaign3.state(__game.registry.get('game')).artChapters[0]};});
  assert(scene.cutscene);assert.equal(scene.location,'lanternhold');assert(scene.chapterSeen);assert.deepEqual(errors,[]);
  fs.mkdirSync('test/reports/gate',{recursive:true});await p.screenshot({path:'test/reports/gate/departure.png'});console.log('Gate route: solo departure, decorated chapter card, Continue, cinematic backdrop and Tesfaye dialogue passed.',scene);
 }finally{await ctx.close();await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
