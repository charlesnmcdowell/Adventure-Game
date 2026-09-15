'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function clickText(scene,label){
  await page.waitForFunction(({scene,label})=>{const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};__game.scene.getScene(scene).children.list.forEach(walk);return all.some(o=>o.visible&&o.text===label);},{scene,label},{timeout:20000});
  const at=await page.evaluate(({scene,label})=>{const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};__game.scene.getScene(scene).children.list.forEach(walk);const o=all.find(o=>o.visible&&o.text===label),b=o.getBounds(),c=__game.canvas.getBoundingClientRect();return{x:c.x+b.centerX*c.width/1280,y:c.y+b.centerY*c.height/760};},{scene,label});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.mouse.click(at.x,at.y,{delay:100});
 }
 try{
  await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField);
  await clickText('Title','Begin');await clickText('Title','Skip all');
  await page.waitForFunction(()=>__game.scene.isActive('Creation')&&__game.scene.getScene('Creation').nameField);
  await clickText('Creation','Got it');await page.locator('.adv-field').fill('Kess');
  await clickText('Creation','Next — choose your three skills');
  await page.waitForFunction(()=>__game.scene.getScene('Creation').phase===2);
  const picks=await page.evaluate(()=>__game.scene.getScene('Creation').skillButtons.slice(0,3).map(b=>({id:b.id,label:b.txt.text})));
  for(const p of picks)await clickText('Creation',p.label);
  assert.deepEqual(await page.evaluate(()=>__game.scene.getScene('Creation').sel.skills),picks.map(p=>p.id));
  await clickText('Creation','Step into the world');
  const personality=await page.evaluate(()=>ADV.Conversation.personalityPool('f')[0]);
  await clickText('Creation',personality.name);await clickText('Creation','Keep this personality');
  await clickText('Creation','Easy — chosen');
  await page.waitForFunction(()=>__game.scene.isActive('Town'),{},{timeout:20000});
  const state=await page.evaluate(()=>{const g=__game.registry.get('game'),p=ADV.Game.player(g);return{name:p.name,sex:p.sex,skills:p.perks.concat(p.actives).map(e=>e.skillId),voice:p.personalityId,difficulty:g.meta.difficulty,saved:ADV.Save.hasValidContinue()};});
  assert.equal(state.name,'Kess');assert.equal(state.sex,'f');assert.deepEqual(state.skills.sort(),picks.map(p=>p.id).sort());assert.equal(state.voice,personality.id);assert.equal(state.difficulty,'easy');assert(state.saved);assert.deepEqual(errors,[]);
  fs.mkdirSync('test/reports/creation',{recursive:true});await page.screenshot({path:'test/reports/creation/town.png'});
  console.log('Creation: current name input, three selected skills, one voice, difficulty choice, town and save passed.');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
