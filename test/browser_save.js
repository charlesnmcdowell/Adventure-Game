'use strict';
const assert=require('assert/strict'),fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:760},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.MOBILE_TEST_URL||'http://127.0.0.1:8734/index.html');
  await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField);
  await page.evaluate(()=>{
   const g=ADV.Game.newGame({seed:763,name:'Recovery UI',sex:'f',personalityId:'F01'});window.auditGame=g;
   window.originalSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k.startsWith('adv:'))throw new DOMException('Quota exceeded','QuotaExceededError');return originalSetItem.call(this,k,v);};
   ADV.Game.player(g).inventory.gold=1873;ADV.Save.saveGame(g);
  });
  assert(await page.locator('.save-warning').isVisible());
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download backup',exact:true}).click();
  const download=await downloadPromise,backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(backup.characters.find(c=>c.id===backup.world.playerId).inventory.gold,1873,'export includes unsaved progress');
  await page.evaluate(()=>{Storage.prototype.setItem=originalSetItem;});
  await page.getByRole('button',{name:'Retry save',exact:true}).click();
  assert.equal(await page.locator('.save-warning').count(),0);
  assert.equal(await page.evaluate(()=>ADV.Game.player(ADV.Save.loadGame()).inventory.gold),1873);
  await page.evaluate(()=>ADV.SaveUI.show(auditGame));
  const modal=page.getByRole('dialog',{name:'Save backup'});
  page.on('dialog',d=>d.accept());
  await modal.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await modal.getByRole('button',{name:'Restore selected backup'}).click();
  await page.getByRole('status').filter({hasText:'Could not restore'}).waitFor();
  assert.equal(await page.evaluate(()=>ADV.Game.player(ADV.Save.loadGame()).inventory.gold),1873);
  backup.characters.find(c=>c.id===backup.world.playerId).inventory.gold=2026;
  await modal.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await Promise.all([page.waitForEvent('load'),modal.getByRole('button',{name:'Restore selected backup'}).click()]);
  await page.waitForFunction(()=>window.ADV?.Save?.hasValidContinue());
  assert.equal(await page.evaluate(()=>ADV.Game.player(ADV.Save.loadGame()).inventory.gold),2026);
  assert.deepEqual(errors,[]);
  console.log('Browser saves: visible quota failure, unsaved download, retry, invalid import preservation and valid import/reload passed.');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
