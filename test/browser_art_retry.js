'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.MOBILE_TEST_URL||'http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField);
  const url=await page.evaluate(()=>new URL(ADV.AnimeWorld.ROOT+ADV.AnimeManifest.parts.children.file,location.href).href);
  let attempts=0;await page.route(url,r=>{attempts++;return r.abort();});
  const key=await page.evaluate(()=>{
   const s=__game.scene.getScene('Title'),ch={id:'child-audit',sex:'f',isChild:true,portraitSeed:10};
   const k=ADV.Portraits.key(s,ch);window.auditImage=s.add.image(640,380,k);ADV.Portraits.animate(s,auditImage,ch,k);
   window.auditTexture=auditImage.texture;return k;
  });
  assert(await page.evaluate(()=>!!auditImage.__animeRig),'animation binds before artwork arrives');
  await page.getByRole('button',{name:'Retry artwork'}).waitFor({timeout:20000});assert.equal(attempts,3);
  await page.unroute(url);await page.getByRole('button',{name:'Retry artwork'}).click();
  await page.waitForFunction(k=>ADV.AnimeArt.META.has(k)&&!ADV.AnimeArt.META.get(k).pending,key,{timeout:30000});
  assert(await page.evaluate(()=>auditImage.texture===auditTexture&&!!auditImage.__animeRig),'retry updates the existing animated texture');
  await page.waitForFunction(()=>ADV.ArtAssets.stats().failed===0);
  assert.equal(await page.locator('.art-warning').count(),0);assert.deepEqual(errors,[]);
  console.log('Artwork recovery: bounded retries, manual recovery, stable texture and early animation attachment passed.');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
