'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const ua='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
(async()=>{const engine=process.env.MOBILE_WEBKIT==='1'?'webkit':'chromium';const b=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true}));const results=[];
try{for(const installed of [false,true]){
 const ctx=await b.newContext({viewport:{width:390,height:844},userAgent:ua,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await ctx.route(/https:\/\/(neverendingnarratives.com|charlesnmcdowell.github.io)\//,async route=>{
  const u=new URL(route.request().url());const site=u.hostname==='neverendingnarratives.com';let relative=decodeURIComponent(u.pathname).replace(site?'/adventurer/':'/Adventure-Game/','');
  if(!relative||relative==='index.html')relative=site?'tools/mobile_site/index.html':'index.html';
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return route.fulfill({status:404,body:'Not found'});
  await route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await ctx.addInitScript(({installed})=>{if(window===top)Object.defineProperty(navigator,'standalone',{value:installed,configurable:true});},{installed});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('https://neverendingnarratives.com/adventurer/');
 const f=p.frameLocator('#game');await f.locator('#mobile-home').waitFor({timeout:120000});await p.waitForTimeout(300);
 assert.deepEqual(errors,[]);assert.equal(await p.locator('#bar').isVisible(),false,await p.evaluate(()=>document.body.className));assert(Math.abs((await p.locator('#game').boundingBox()).height-844)<1);
 const frame=p.frames().find(f=>f.url().includes('Adventure-Game'));
 assert.equal(await f.locator('.browser-hint').count(),installed?0:1,'host standalone mode reaches embedded game');
 // Real safe-area propagation, including landscape notches and home indicator.
 await p.evaluate(()=>{document.getElementById('safe-probe').style.padding='47px 12px 34px 12px';window.dispatchEvent(new Event('resize'));});await p.waitForTimeout(450);
 const box=await f.getByRole('button',{name:'Play',exact:true}).boundingBox();assert(box.x>=12&&box.y+box.height<=810);
 const parent=await frame.evaluate(()=>{const r=document.getElementById('game').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});assert.equal(parent.y,47);assert(Math.abs(parent.h-763)<1);
 await p.screenshot({path:`tools/mobile-host-${engine}-${installed?'installed':'safari'}.png`});
 // Saved Continue survives the shell, then enters the unchanged town scene.
 await frame.evaluate(()=>{const A=ADV,g=A.Game.newGame({seed:477,name:'Mobile Continue',sex:'f',personalityId:'F01',startingSkills:['cleave','mend','bulwark']});g.tutorial={step:'done'};g.meta.promptsSeen=Object.fromEntries(Object.keys(A.DATA.PROMPTS).map(k=>[k,true]));A.Save.saveGame(g);});
 await p.reload();await f.getByRole('button',{name:'Continue',exact:true}).waitFor({timeout:120000});
 assert.equal(await f.locator('.browser-hint').count(),0,'one-time hint stays gone after reload');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(450);
 const current=p.frames().find(f=>f.url().includes('Adventure-Game'));await current.evaluate(()=>ADV.TownScene.prototype.nextNotice=()=>{});
 await f.getByRole('button',{name:'New game',exact:true}).click();await f.getByRole('button',{name:'Keep my current game'}).click();
 await current.waitForFunction(()=>__game.scene.isActive('Town'));
 assert.equal(await current.evaluate(()=>ADV.Game.player(__game.registry.get('game')).name),'Mobile Continue');
 assert.equal(await f.locator('#mobile-home').count(),0);assert.equal(await f.locator('#rotate').isVisible(),false);
 assert.deepEqual(errors,[]);results.push({engine,installed,iframe:true,safeArea:true,savePreserved:true,continue:true,errors});await ctx.close();
}
// Desktop launch remains Phaser's original title.
const p=await b.newPage({viewport:{width:1280,height:760}});await p.goto('http://127.0.0.1:8734/index.html');await p.waitForFunction(()=>__game.scene.getScene('Title')?.pwField,{timeout:120000});assert.equal(await p.locator('#mobile-home').count(),0);await p.screenshot({path:`tools/mobile-desktop-${engine}.png`});await p.close();
console.log(JSON.stringify(results));fs.writeFileSync('tools/mobile-host-'+engine+'.json',JSON.stringify(results,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
