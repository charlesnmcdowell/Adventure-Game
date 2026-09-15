// Isolated contexts: never reads or changes the user's browser save.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const output = path.join(__dirname, 'reports/gate-courtship'); fs.mkdirSync(output, { recursive:true });
(async () => {
 const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true });
 const results = [];
 try {
  for (const [width,height] of [[1280,760],[844,390]]) {
   const context = await browser.newContext({ viewport:{width,height}, hasTouch:width<900, isMobile:width<900 });
   const page = await context.newPage(), errors=[], missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{ if(r.status()>=400) missing.push(r.url()); });
   await page.goto('http://127.0.0.1:8734/index.html');
   await page.waitForFunction(()=>window.ADV?.Campaign3UI && window.__game?.scene.isActive('Title'),null,{timeout:120000});
   await page.evaluate(()=>{
    const g=ADV.Game.newGame({seed:914,name:'Amina',sex:'f',personalityId:'F01'}), c=ADV.Campaign3, s=c.state(g);
    s.started=true;s.stage=6;
    for(const id of ['cassian','ithrel','ilvara','faelen']) {
     c.recruit(g,id);s.aff[id]=4;
     c.finishConversation(g,id,c.personalConversation(g,id).key);
    }
    s.stage++;
    for(const id of ['cassian','ithrel','ilvara','faelen']) {
     c.finishConversation(g,id,c.personalConversation(g,id).key);c.expressInterest(g,id);
    }
    s.stage++;
    window.__courtshipGame=g; window.__courtshipVoices=[]; window.__courtshipDone=0;
    const speak=ADV.Music.speakCampaign;
    ADV.Music.speakCampaign=function(...args){__courtshipVoices.push(args);return speak.apply(this,args);};
    __game.registry.set('game',g);__game.scene.stop('Title');__game.scene.start('Town');
   });
   await page.waitForFunction(()=>__game.scene.isActive('Town')&&__game.scene.getScene('Town').g()?.meta?.c3?.stage===8,null,{timeout:30000});
   await page.evaluate(()=>{ const scene=__game.scene.getScene('Town');scene.openPanel('story'); });
   async function clickText(text) {
    const find = wanted => {
     const scene=__game.scene.getScene('Town');
     const all=[]; const walk=(o,parentVisible=true)=>{const visible=parentVisible&&o.visible!==false&&o.active!==false;if(visible&&o.text===wanted)all.push(o);if(o.list)for(const child of o.list)walk(child,visible);};
     for(const o of scene.children.list)walk(o);
     const t=all.sort((a,b)=>b.depth-a.depth)[0];if(!t)return null;
     const b=t.getBounds(),canvas=__game.canvas.getBoundingClientRect();
     return{x:canvas.x+(b.x+b.width/2)*canvas.width/__game.scale.gameSize.width,y:canvas.y+(b.y+b.height/2)*canvas.height/__game.scale.gameSize.height};
    };
    await page.waitForFunction(find,text,{timeout:15000});
    const pos=await page.evaluate(find,text); await page.mouse.click(pos.x,pos.y); await page.waitForTimeout(150);
   }
   await clickText('Talk at the inn');
   assert.deepEqual(await page.evaluate(()=>__courtshipVoices),[],'select a companion before anyone speaks');
   await clickText('Itsuki');
   await page.screenshot({path:path.join(output,`choices-${width}.png`)});
   await clickText('Could we talk about us? [Courtship]');
   await page.waitForFunction(()=>__courtshipVoices.length>=1,null,{timeout:30000});
   await page.waitForFunction(()=>__game.scene.getScene('Town').gateSequence?.spec?.id==='nine_lanterns',null,{timeout:30000});
   await page.waitForTimeout(2200);
   await page.screenshot({path:path.join(output,`itsuki-${width}.png`)});
   const spec=await page.evaluate(()=>__game.scene.getScene('Town').gateSequence.spec);
   assert.equal(spec.phase,'night');
   // Advance the real dialogue through its pointer input (typewriter reveal + next).
   for(let i=0;i<5;i++) {await page.mouse.click(width*.5,height*.80);await page.waitForTimeout(300);}
   await clickText('I want us to remain friends.');
   for(let i=0;i<5;i++) {await page.mouse.click(width*.5,height*.80);await page.waitForTimeout(300);}
   const state=await page.evaluate(()=>({bond:ADV.Campaign3.courtshipState(__courtshipGame,'ithrel'),romance:ADV.Campaign3.state(__courtshipGame).romance,voices:__courtshipVoices}));
   assert.equal(state.bond.status,'declined');assert.equal(state.romance,null);
   assert(state.voices.every(v=>v[0]==='ithrel'),'unselected companions do not speak');
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   results.push({width,height,spec,...state,errors,missing}); await context.close();
  }
 } finally { await browser.close(); }
 fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
