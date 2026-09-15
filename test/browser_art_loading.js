'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 try{
  await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField);
  const portraitPaths=await page.evaluate(()=>Object.values(ADV.AnimeManifest.parts).map(d=>new URL(ADV.AnimeWorld.ROOT+d.file,location.href).href));
  assert.equal(requests.filter(u=>portraitPaths.includes(u)).length,0,'title requests no portrait atlases');
  await page.evaluate(()=>__game.scene.start('Creation'));await page.waitForFunction(()=>__game.scene.getScene('Creation')?.sel);
  await page.waitForFunction(()=>ADV.AnimeWorld.pendingPortraits.size===0&&ADV.ArtAssets.stats().pending===0,{},{timeout:120000});
  assert.equal(await page.evaluate(()=>ADV.AnimeWorld.lastLoadError||null),null);
  fs.mkdirSync('test/reports/art',{recursive:true});await page.screenshot({path:'test/reports/art/creation.png'});
  const fixtures=await page.evaluate(()=>{
   const faces=[];
   for(const sex of ['f','m'])for(let eye=0;eye<5;eye++)faces.push({id:'audit-'+sex+eye,sex,portraitKind:'player',portraitSlot:5,portraitSeed:eye*13+9,equippedSet:['mage','shinobi_gear','hunter','plate','wardens_gear'][eye],appearance:{head:eye+6,eyeType:eye,mouthType:eye,iris:ADV.AnimeWorld.EYES[eye],lipColor:ADV.AnimeWorld.LIPS[eye]}});
   for(const id of ['wren_ward','fennick','bramm','idris','sarn','korvath'])faces.push({id,portraitId:id,campaignId:id,sex:ADV.DATA.CAMPAIGN_CHARS[id]?.sex||'m',portraitSeed:4});
   for(const form of ['werewolf','werebear','panther','sentinel'])faces.push({id:'form-'+form,sex:'f',portraitSeed:5,form});
   for(const set of ADV.AnimeWorld.SETS)for(const sex of ['f','m'])faces.push({id:'gear-'+sex+set,sex,equippedSet:set,portraitSeed:12,portraitKind:'player',portraitSlot:1});
   return faces;
  });
  for(const ch of fixtures){
   const key=await page.evaluate(ch=>{const scene=__game.scene.getScene('Creation');return ch.form?ADV.Portraits.beastKey(scene,ch,ch.form):ADV.Portraits.key(scene,ch);},ch);
   await page.waitForFunction(k=>ADV.AnimeArt.META.has(k)&&!ADV.AnimeArt.META.get(k).pending,key,{timeout:45000});
  }
  const metrics=await page.evaluate(()=>({sources:ADV.AnimeWorld.sources.size,parts:ADV.AnimeWorld.partCache.size,pending:ADV.ArtAssets.stats(),error:ADV.AnimeWorld.lastLoadError||null}));
  assert(metrics.sources<=12);assert(metrics.parts<=20);assert.equal(metrics.error,null);
  assert.deepEqual(errors,[]);
  fs.writeFileSync('test/reports/art/loading.json',JSON.stringify({fixtures:fixtures.length,titlePortraitRequests:0,...metrics,errors},null,2));
  console.log(JSON.stringify({fixtures:fixtures.length,titlePortraitRequests:0,...metrics,errors}));
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
