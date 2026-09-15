// Real media playback in isolated browser contexts; never touches a player's save.
/* global __game, __voiceTrace, __voiceBox */
const { chromium, webkit } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const out = path.join(__dirname, 'reports/gate-voice'); fs.mkdirSync(out, { recursive:true });
(async () => {
 const reports=[];
 for (const engine of process.argv.includes('--webkit') ? [webkit] : [chromium]) {
  const browser=await engine.launch({headless:true});
  try {
   const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
   const page=await context.newPage(), errors=[];
   page.on('pageerror', e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__voiceTrace=[];
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
     const el=this,src=el.src;
     if(!src.includes('/vo/'))return play.apply(el,args);
     const record=(event,detail)=>__voiceTrace.push({event,src,detail,time:el.currentTime,paused:el.paused,at:performance.now()});
     record('play');
     for(const event of ['playing','pause','ended','error'])el.addEventListener(event,()=>record(event,el.error?.message),{once:true});
     // Opt-in fault injection exercises the real dialogue recovery control.
     const result=window.__rejectNextVoice
      ? (window.__rejectNextVoice=false, Promise.reject(new DOMException('Test: gesture required','NotAllowedError')))
      : play.apply(el,args);
     result?.then(()=>record('resolved'),e=>record('rejected',e.name+': '+e.message));
     return result;
    };
   });
   await page.goto('http://127.0.0.1:8734/index.html');
   await page.waitForFunction(()=>window.ADV?.Campaign3UI && window.__game?.scene.isActive('Title'),null,{timeout:120000});
   await page.evaluate(()=>{
    const g=ADV.Game.newGame({seed:915,name:'Amina',sex:'f',personalityId:'F01'}),c=ADV.Campaign3,s=c.state(g);
    s.started=true;s.stage=12;c.recruit(g,'selene');
    ADV.Game.player(g).inventory.gold=10000;
    const result=ADV.Game.startQuest(g,c.buildQuest(g,13),{});
    if(!result.ok)throw Error(JSON.stringify(result));
    g.quest.encIdx=4;g.quest.departureShown=true;
    __game.registry.set('game',g);
    const show=ADV.DialogueBox.showText;
    ADV.DialogueBox.showText=function(...args){return window.__voiceBox=show.apply(this,args);};
    const b=document.createElement('button');b.textContent='Start voice test';b.id='voice-test-start';
    b.style.cssText='position:fixed;z-index:99999;top:0;left:0';
    b.onclick=()=>{b.remove();__game.scene.stop('Title');__game.scene.start('Quest');};document.body.append(b);
   });
   await page.locator('#voice-test-start').click();
   await page.waitForFunction(()=>ADV.Music.voiceEl?.src.includes('lucan/q13_steps_1'),null,{timeout:60000});
   await page.waitForTimeout(2500);
   const first=await page.evaluate(()=>({src:ADV.Music.voiceEl.src,time:ADV.Music.voiceEl.currentTime,paused:ADV.Music.voiceEl.paused,ended:ADV.Music.voiceEl.ended,trace:__voiceTrace}));
   await page.screenshot({path:path.join(out,engine.name()+'-segun.png')});
   const report={engine:engine.name(),first,errors,clips:[]};reports.push(report);
   fs.writeFileSync(path.join(out,engine.name()+'-playback.json'),JSON.stringify(reports,null,2));
   assert(first.time>0.4,'Segun first line must actually play: '+JSON.stringify(first));
   const clickReplay=async()=>{
    const point=await page.evaluate(()=>{
     const scene=__game.scene.getScene('Quest');
     const text=scene.children.list.find(o=>o.text==='Replay voice');
     if(!text)throw Error('No replay control');
     const b=text.getBounds(),r=__game.canvas.getBoundingClientRect();
     return{x:r.x+(b.x+b.width/2)*r.width/ADV.T.W,y:r.y+(b.y+b.height/2)*r.height/ADV.T.H};
    });
    await page.mouse.click(point.x,point.y);
   };
   await clickReplay();
   assert.equal(await page.evaluate(()=>ADV.Music.voiceEl.src),first.src,'replay must not advance dialogue');
   await page.waitForFunction(()=>ADV.Music.voiceEl.currentTime>.3&&ADV.Music.voiceEl.currentTime<2);
   for(const file of ['lucan/q13_steps_2','selene/q13_steps_selene_1','lucan/q13_steps_selene_reply_1']) {
    await page.evaluate(()=>__voiceBox.completeText());await page.mouse.click(422,360);
    await page.waitForFunction(f=>ADV.Music.voiceEl?.src.includes(f)&&ADV.Music.voiceEl.currentTime>.3,file,{timeout:30000});
   }
   await page.evaluate(()=>__voiceBox.close());
   await page.waitForTimeout(100);
   // All late-campaign branches use their actual speaker, key, line index and UI.
   const clips=await page.evaluate(()=>Object.entries(ADV.DATA.CAMPAIGN3_DIALOGUE.gate).flatMap(([who,keys])=>
    Object.entries(keys).filter(([key])=>/^q(12|13|14)_/.test(key)).flatMap(([key,lines])=>lines.map((line,i)=>({who,key,line,index:i+1})))));
   for(const clip of clips) {
    await page.evaluate(c=>{
     const scene=__game.scene.getScene('Quest'),g=scene.game_;
     ADV.Campaign3UI.playBeat(scene,g,{c3:true,__gateReady:true,who:c.who,key:c.key,lines:[c.line],voOffset:c.index-1},()=>{});
    },clip);
    const file=`${clip.who}/${clip.key}_${clip.index}.mp3`;
    await page.waitForFunction(f=>ADV.Music.voiceEl?.src.includes(f)&&ADV.Music.voiceEl.currentTime>.2,file,{timeout:30000});
    report.clips.push({file,time:await page.evaluate(()=>ADV.Music.voiceEl.currentTime)});
    await page.evaluate(()=>__voiceBox.close());
   }
   // A simulated browser denial is recoverable using a real button gesture.
   await page.evaluate(()=>{
    window.__rejectNextVoice=true;
    const scene=__game.scene.getScene('Quest');
    ADV.Campaign3UI.playBeat(scene,scene.game_,{c3:true,__gateReady:true,who:'lucan',key:'q13_steps'},()=>{});
   });
   await page.waitForFunction(()=>ADV.Music.voiceEl.__playBlocked);
   await clickReplay();
   await page.waitForFunction(()=>!ADV.Music.voiceEl.__playBlocked&&ADV.Music.voiceEl.currentTime>.3);
   assert.equal(await page.evaluate(()=>ADV.Music.voiceEl.src),first.src);
   report.blockedReplay=true;
   report.trace=await page.evaluate(()=>__voiceTrace);
   assert.deepEqual(errors,[]);
   fs.writeFileSync(path.join(out,engine.name()+'-playback.json'),JSON.stringify(reports,null,2));
   await context.close();
  } finally {await browser.close();}
 }
 console.log(JSON.stringify(reports.map(r=>({engine:r.engine,clips:r.clips.length,blockedReplay:r.blockedReplay,errors:r.errors})),null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
