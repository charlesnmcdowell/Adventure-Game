'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8734/index.html');
 await page.waitForFunction(()=>window.__game&&window.ADV&&ADV.DATA.CONVERSATION_BONUS_ROWS);
 await page.evaluate(()=>{
  ADV.Save.reset();
  const g=ADV.Game.newGame({seed:440,name:'Rook',sex:'m',personalityId:'M01',startingSkills:['mend']});
  g.tutorial={step:'done'};
  window.__game.registry.set('game',g);window.__game.scene.stop('Title');window.__game.scene.start('Town');
 });
 await page.waitForTimeout(600);
 const shown=[];
 for(let i=0;i<5;i++){
  shown.push(await page.evaluate(()=>{
   const sc=window.__game.scene.getScene('Town'),g=sc.game_,p=ADV.Game.player(g);
   const npc=g.world.characters.find(c=>c.alive&&!c.isPlayer&&c.personalityId&&!c.campaignId);
   g.world.edges=g.world.edges.filter(e=>e.fromId!==p.id||e.toId!==npc.id);
   g.world.edges.push({fromId:p.id,toId:npc.id,score:0});
   const turns=ADV.Conversation.exchange(g,npc,{band:'friendly'});
   const reply=turns[1];
   window.__bonusClose=ADV.DialogueBox.playExchange(sc,g,[reply],()=>{});
   return {band:reply.band,index:reply.idx,text:reply.text,voice:ADV.Music.voiceEl.src};
  }));
  await page.waitForTimeout(350);
  if(i===2){fs.mkdirSync('tools/story_screenshots',{recursive:true});await page.screenshot({path:path.resolve('tools/story_screenshots/bonus_player_response.png')});}
  await page.evaluate(()=>window.__bonusClose.close());
 }
 assert.equal(new Set(shown.map(r=>r.text)).size,5,'Five consecutive matching replies are different');
 assert.ok(shown.some(r=>r.index>=4),'Bonus clips actually reach playback');
 for(const r of shown)assert.match(r.voice,/audio\/vo\/M01\/(general|friendly)_response_\d+\.mp3\?v=/);
 assert.equal(errors.length,0);
 fs.writeFileSync('tools/bonus_browser_results.json',JSON.stringify({errors,shown},null,2));
 console.log(JSON.stringify({errors,distinctReplies:5,bonusClips:shown.filter(r=>r.index>=4).length}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
