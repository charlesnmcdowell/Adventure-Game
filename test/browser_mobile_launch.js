'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium,webkit}=require('playwright');
const url=process.env.MOBILE_TEST_URL||'http://127.0.0.1:8734/index.html';
const baseUA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const results=[];
(async()=>{for(const engine of (process.env.MOBILE_WEBKIT==='1'?['webkit']:['chromium'])){
 const browser=await (engine==='webkit'?webkit.launch():chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true}));
 try{for(const [width,height,app]of [[375,667,'Messenger'],[390,844,'Safari'],[390,844,'Instagram']]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:baseUA+(app==='Messenger'?' [FBAN/MessengerForiOS;FBAV/500]':app==='Instagram'?' Instagram 500':'')});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.locator('#mobile-home').waitFor({timeout:120000});
  await p.waitForTimeout(250);
  assert.equal(await p.locator('#rotate').isVisible(),false);
  const boxes=await p.locator('.launch-actions button').evaluateAll(ns=>ns.map(n=>({name:n.textContent,x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  assert(boxes.every(r=>r.w>=44&&r.h>=44&&r.x>=0&&r.x+r.w<=innerWidthSafe(width)));
  assert(boxes[0].y>=height*.65,'primary action in bottom third');
  assert.equal(await p.evaluate(()=>getComputedStyle(document.body).touchAction),'manipulation');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.screenshot({path:`tools/mobile-${engine}-${app}-${width}.png`});
  await p.getByRole('button',{name:'More',exact:true}).click();
  await p.getByLabel('Character password (optional)').fill('Hiro');
  assert.equal(await p.evaluate(()=>__game.scene.getScene('Title').password),'Hiro');
  assert.equal(await p.getByRole('button',{name:'Fullscreen',exact:true}).count(),0);
  const dialog=p.getByRole('dialog',{name:'More',exact:true});await dialog.evaluate(n=>n.scrollTop=n.scrollHeight);
  await p.screenshot({path:`tools/mobile-${engine}-${app}-${width}-more.png`});
  await p.getByRole('button',{name:'Close More',exact:true}).click();
  await p.getByRole('button',{name:'Play',exact:true}).click();await p.getByRole('button',{name:'Skip introduction',exact:true}).click();
  await p.waitForFunction(()=>__game.scene.isActive('Creation'));await p.waitForTimeout(250);
  await p.locator('#rotate').waitFor({state:'visible',timeout:5000});
  // Emulate Messenger retaining portrait visual dimensions after rotation.
  await p.evaluate(({width,height})=>{Object.defineProperty(visualViewport,'width',{get:()=>width,configurable:true});Object.defineProperty(visualViewport,'height',{get:()=>height,configurable:true});},{width,height});
  await p.setViewportSize({width:height,height:width});await p.waitForTimeout(400);
  await p.locator('#rotate').waitFor({state:'hidden',timeout:5000});
  assert.equal(await p.locator('#rotate').isVisible(),false,'rotation dismisses stale-vv overlay');
  const name=p.locator('.adv-field');await name.click();
  assert.equal(await name.evaluate(n=>document.activeElement===n),true,'creation field focuses on first tap');
  assert(await name.evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=16));
  await name.fill('Mira');assert.equal(await p.evaluate(()=>__game.scene.getScene('Creation').sel.name),'Mira');
  await name.press('Enter');
  await p.setViewportSize({width,height});await p.waitForTimeout(400);
  assert.equal(await p.locator('#rotate').isVisible(),true);await p.getByRole('button',{name:'Dismiss rotation reminder'}).click();
  assert.equal(await p.locator('#rotate').isVisible(),false);await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await p.waitForTimeout(250);assert.equal(await p.locator('#rotate').isVisible(),false);
  assert.deepEqual(errors,[]);results.push({engine,width,height,app,boxes,rotation:true,manualEscape:true,creationInput:true,errors});
  await context.close();
 }
 }finally{await browser.close();}
}fs.writeFileSync('tools/mobile-browser-'+(process.env.MOBILE_WEBKIT==='1'?'webkit':'chromium')+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
function innerWidthSafe(width){return width+.1;}
