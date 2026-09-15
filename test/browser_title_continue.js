'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
const chrome=fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined;
const url=process.env.MOBILE_TEST_URL||'http://127.0.0.1:8734/index.html';
const ua='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';

function seed(opts){
 return page=>page.evaluate(({name,sex,personalityId,alive})=>{
  ADV.Save.reset();
  const g=ADV.Game.newGame({seed:611,name,sex,personalityId,startingSkills:['mend']});
  g.tutorial={step:'done'};
  g.meta.promptsSeen=Object.fromEntries(Object.keys(ADV.DATA.PROMPTS).map(k=>[k,true]));
  if(alive===false)ADV.Game.player(g).alive=false;
  ADV.Save.saveGame(g);
 },opts);
}

(async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true});
 try{
  {
   const ctx=await browser.newContext({viewport:{width:390,height:844},userAgent:ua,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url);await p.locator('#mobile-home').waitFor({timeout:120000});
   assert.equal(await p.getByRole('button',{name:'Play',exact:true}).count(),1,'fresh phone title offers Play');
   assert.equal(await p.getByRole('button',{name:'Continue',exact:true}).count(),0);
   await seed({name:'Mira',sex:'f',personalityId:'F01'})(p);
   await p.reload();await p.getByRole('button',{name:'Continue',exact:true}).waitFor({timeout:120000});
   assert.equal(await p.getByRole('button',{name:'New game',exact:true}).count(),1);
   await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);
   await p.evaluate(()=>ADV.TownScene.prototype.nextNotice=()=>{});
   await p.getByRole('button',{name:'Continue',exact:true}).click();
   await p.waitForFunction(()=>__game.scene.isActive('Town'));
   assert.equal(await p.evaluate(()=>ADV.Game.player(__game.registry.get('game')).name),'Mira');
   assert.deepEqual(errors,[]);
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:390,height:844},userAgent:ua,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url);await p.locator('#mobile-home').waitFor({timeout:120000});
   await seed({name:'Old Life',sex:'m'})(p);
   await p.reload();await p.getByRole('button',{name:'Continue',exact:true}).waitFor({timeout:120000});
   assert.equal(await p.getByRole('button',{name:'Play',exact:true}).count(),0,'an unvoiced living save still offers Continue');
   await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);
   await p.evaluate(()=>ADV.TownScene.prototype.nextNotice=()=>{});
   await p.getByRole('button',{name:'New game',exact:true}).click();
   await p.getByRole('button',{name:'Keep my current game',exact:true}).click();
   await p.waitForFunction(()=>__game.scene.isActive('Town'));
   assert.equal(await p.evaluate(()=>ADV.Game.player(__game.registry.get('game')).name),'Old Life');
   assert.equal(await p.evaluate(()=>{
    const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};
    __game.scene.getScene('Town').children.list.forEach(walk);
    return all.some(o=>o.text==='How do you speak?');
   }),true,'unvoiced Continue asks for a voice instead of returning to Title');
   assert.deepEqual(errors,[]);
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:1280,height:760}});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   async function clickText(scene,label){
    await p.waitForFunction(({scene,label})=>{const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};__game.scene.getScene(scene).children.list.forEach(walk);return all.some(o=>o.visible&&o.text===label);},{scene,label},{timeout:20000});
    const at=await p.evaluate(({scene,label})=>{const all=[],walk=o=>{all.push(o);o.list?.forEach(walk);};__game.scene.getScene(scene).children.list.forEach(walk);const o=all.find(o=>o.visible&&o.text===label),b=o.getBounds(),c=__game.canvas.getBoundingClientRect();return{x:c.x+b.centerX*c.width/1280,y:c.y+b.centerY*c.height/760};},{scene,label});
    await p.mouse.click(at.x,at.y,{delay:80});
   }
   await p.goto(url);await p.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField,{timeout:120000});
   await seed({name:'Desk',sex:'f',personalityId:'F01'})(p);
   await p.reload();await p.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField,{timeout:120000});
   await p.evaluate(()=>ADV.TownScene.prototype.nextNotice=()=>{});
   await clickText('Title','Continue');
   await p.waitForFunction(()=>__game.scene.isActive('Town'));
   assert.equal(await p.evaluate(()=>ADV.Game.player(__game.registry.get('game')).name),'Desk');
   assert.deepEqual(errors,[]);
   await ctx.close();
  }
  console.log('Title Continue: phone Continue, Keep resumes unvoiced lives, desktop Continue passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
