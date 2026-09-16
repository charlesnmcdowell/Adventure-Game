/* global ADV, Phaser, __game, __reviewBox */
'use strict';
const {chromium,webkit}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='test/reports/gate-endcard';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const engine=process.argv.includes('--webkit')?webkit:chromium,browser=await engine.launch({headless:true}),reports=[];
 try{for(const viewport of [{width:1280,height:760},{width:844,height:390}]){
  const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.goto('http://127.0.0.1:8734/index.html');
  await page.waitForFunction(()=>window.__game?.scene.isActive('Title'));
  await page.evaluate(()=>{
   const old=ADV.DialogueBox.showText;ADV.DialogueBox.showText=function(...args){return window.__reviewBox=old.apply(this,args);};
   class Review extends Phaser.Scene{
    constructor(){super('FinaleReview');}
    g(){return this.game_;}keep(o){return o;}
    create(){
     this.game_=ADV.Game.newGame({seed:1514,name:'Ward',sex:'f'});const g=this.game_;
     g.player.inventory.gold=50000;ADV.Campaign3.debugJump(g,14);ADV.Game.startQuest(g,ADV.Campaign3.buildQuest(g,14),{});g.quest.encIdx=3;
     this.ready=true;
    }
   }
   __game.scene.stop('Title');__game.scene.add('FinaleReview',Review,true);
  });
  await page.waitForFunction(()=>__game.scene.getScene('FinaleReview').ready);
  async function gesture(code){
   await page.evaluate(code=>{const b=document.createElement('button');b.id='review-action';b.textContent='Review';b.style.cssText='position:fixed;top:0;left:0;z-index:999999';b.onclick=()=>{b.remove();(0,eval)(code);};document.body.append(b);},code);
   await page.locator('#review-action').click();
  }
  async function clickControl(label){
   const point=await page.evaluate(label=>{
    const s=__game.scene.getScene('FinaleReview'),t=s.children.list.find(o=>o.text===label),r=__game.canvas.getBoundingClientRect();
    if(!t)throw Error('Missing control: '+label);
    const bounds=t.getBounds(),zone=s.children.list.find(o=>o.type==='Zone'&&o.depth===964&&o.getBounds().contains(bounds.centerX,bounds.centerY));
    if(!zone)throw Error('Missing hit target: '+label);
    return{x:r.x+bounds.centerX*r.width/1280,y:r.y+bounds.centerY*r.height/760,height:zone.height*r.height/760};
   },label);
   assert.ok(point.height>=43.99,'end-card controls remain at least 44 CSS pixels tall');
   await page.mouse.click(point.x,point.y);
  }
  for(const [key,id]of [['q14_final_taken','hiwot_sacrifice'],['q14_final_soul','hiwot_bound']]){
   await gesture(`{const s=__game.scene.getScene('FinaleReview'),g=s.g();s.beatDone=false;const beat=ADV.Campaign3.openerBeats(g,g.quest.quest,3).find(b=>b.key==='${key}');if(!beat)throw Error('Missing beat');ADV.Campaign3UI.playBeat(s,g,beat,()=>{s.beatDone=true;});}`);
   await page.waitForFunction(id=>__game.scene.getScene('FinaleReview').gateSequence?.spec?.id===id&&ADV.Music.voiceEl?.currentTime>.05,id);
   const before=await page.evaluate(()=>__game.scene.getScene('FinaleReview').gateSequence.view.ambience.elapsed);
   await page.waitForTimeout(200);
   assert.ok(await page.evaluate(t=>__game.scene.getScene('FinaleReview').gateSequence.view.ambience.elapsed>t,before));
   await page.evaluate(()=>ADV.Prefs.set({artMotion:false}));
   const frozen=await page.evaluate(()=>__game.scene.getScene('FinaleReview').gateSequence.view.ambience.elapsed);
   await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>__game.scene.getScene('FinaleReview').gateSequence.view.ambience.elapsed),frozen);
   await page.evaluate(()=>ADV.Prefs.set({artMotion:true}));
   await page.screenshot({path:`${dir}/${engine.name()}-${viewport.width}-${id}.png`});
   await page.evaluate(()=>__reviewBox.close());await page.waitForFunction(()=>__game.scene.getScene('FinaleReview').beatDone);
   assert.ok(await page.evaluate(()=>!__game.scene.getScene('FinaleReview').gateSequence));
  }
  assert.ok(await page.evaluate(()=>{const s=__game.scene.getScene('FinaleReview'),g=s.g(),q=g.quest.quest;return !ADV.Campaign3.openerBeats(g,q,3).some(b=>b.key==='q14_final_taken')&&ADV.GateArt.sceneForBeat(g,ADV.Campaign3.script(14).closing[0]).id==='morrak_realm';}),'no second death, no bound image after freeing soul');
  for(const ending of ['restored','ascended']){
   await gesture(`{const scene=__game.scene.getScene('FinaleReview'),g=scene.g(),s=ADV.Campaign3.state(g);s.ending='${ending}';s.epilogue=ADV.Campaign3.epilogue(g);if('${ending}'==='restored'){s.epilogue=[ADV.DATA.GATE_EPILOGUE_VO.legacyText.find(p=>p.includes('Your learned skills, campaign gifts'))];delete s.epilogueRevision;}ADV.Campaign3UI.endCard(scene,g);}`);
   await page.waitForFunction(()=>__game.scene.getScene('FinaleReview').gateEndCard?.narration.current?.currentTime>.1);
   const info=await page.evaluate(()=>{const n=__game.scene.getScene('FinaleReview').gateEndCard.narration;return{voice:n.current.src,queue:n.queue.map(r=>r.key),time:n.current.currentTime};});
   assert.ok(info.voice.includes(`/aldric/endcard_heading_${ending}_1.mp3?v=`));
   assert.ok(info.queue.includes(`endcard_ending_${ending}`));
   assert.ok(info.queue.includes('endcard_finale_cityaftermath'),'the city aftermath is narrated after either ending, including a migrated saved card');
   assert.ok(!info.queue.includes(`endcard_ending_${ending==='restored'?'ascended':'restored'}`));
   await page.screenshot({path:`${dir}/${engine.name()}-${viewport.width}-${ending}.png`});
   // Finish only this real clip early; the controller must start the next matching audio.
   await page.evaluate(()=>{const n=__game.scene.getScene('FinaleReview').gateEndCard.narration;n.current.currentTime=n.current.duration-.06;});
   await page.waitForFunction(ending=>ADV.Music.voiceEl?.src.includes(`endcard_ending_${ending}_1.mp3`)&&ADV.Music.voiceEl.currentTime>.05,ending);
   await clickControl('Sound: on');assert.ok(await page.evaluate(()=>ADV.Music.muted&&ADV.Music.voiceEl.paused));
   await page.waitForTimeout(50);await clickControl('Sound: off');await page.waitForFunction(()=>!ADV.Music.muted&&!ADV.Music.voiceEl.paused);
   await clickControl('Stop narration');assert.ok(await page.evaluate(()=>!ADV.Music.voiceEl));
   await page.waitForTimeout(50);await clickControl('Read with Tesfaye');await page.waitForFunction(()=>ADV.Music.voiceEl?.currentTime>.05);
   await clickControl('Back to the hall');
   assert.ok(await page.evaluate(()=>!ADV.Music.voiceEl&&!__game.scene.getScene('FinaleReview').gateEndCard&&!__game.scene.getScene('FinaleReview').__cutscene));
   reports.push({engine:engine.name(),viewport,ending,...info});
  }
  await page.evaluate(()=>{
   const play=HTMLMediaElement.prototype.play;let rejected=false;
   HTMLMediaElement.prototype.play=function(){
    if(this.src.includes('endcard_')&&!rejected){rejected=true;return Promise.reject(new DOMException('Review autoplay recovery','NotAllowedError'));}
    return play.call(this);
   };
  });
  // A scene shutdown also owns and stops its narration; it cannot bleed into the title.
  await gesture('{const s=__game.scene.getScene("FinaleReview");ADV.Campaign3UI.endCard(s,s.g());}');
  await page.waitForFunction(()=>ADV.Music.voiceEl?.__playBlocked);
  await page.waitForTimeout(50);await clickControl('Play narration');
  await page.waitForFunction(()=>ADV.Music.voiceEl?.currentTime>.05);
  await page.evaluate(()=>__game.scene.stop('FinaleReview'));assert.ok(await page.evaluate(()=>!ADV.Music.voiceEl));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await context.close();
 }}finally{await browser.close();}
 fs.writeFileSync(`${dir}/${engine.name()}.json`,JSON.stringify(reports,null,2));console.log(engine.name()+': new scenes, motion preference, ritual retry, both end cards, real audio, mute, replay and cleanup passed at desktop/mobile sizes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
