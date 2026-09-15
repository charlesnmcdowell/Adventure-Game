'use strict';
const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const {chromium}=require('playwright'),A=require('./harness').load();
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('tools/voice_manifest.json'));
 const state=JSON.parse(fs.readFileSync('tools/voice_generation_state.json'));
 const cast=JSON.parse(fs.readFileSync('tools/voice_casting.json'));
 const entries=manifest.entries.filter(e=>e.path.startsWith('audio/vo/tutorial/'));
 assert.equal(entries.length,Object.keys(A.DATA.TUTORIAL_VO).length);
 for(const e of entries){
  assert.equal(e.voice,cast.ash,'Tutorial uses configured naval actor');
  const record=state.completed[e.hash];assert.ok(record,e.path+' has verified actor/text generation');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(e.path)).digest('hex'),record.audioHash,e.path+' matches recording');
  assert.equal(A.DATA.VOICE_HASHES[e.path],e.hash.slice(0,12));
 }
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8734/index.html');
  await page.waitForFunction(()=>window.__game&&ADV.Music);
  await page.evaluate(()=>__game.scene.getScene('Title').startCards());
  const card=await page.evaluate(()=>ADV.Music.voiceEl.src);
  const first=entries.find(e=>e.path.endsWith('/card_1.mp3'));
  assert.ok(card.endsWith(first.path+'?v='+first.hash.slice(0,12)),'Actual pregame card uses versioned tutorial clip');
  const results=await page.evaluate(async entries=>{
   const ctx=new AudioContext(),out=[];
   for(const e of entries){
    const id=e.path.split('/').at(-1).replace('.mp3','');
    ADV.Music.speakTutorial(id);
    const src=ADV.Music.voiceEl.src;ADV.Music.stopTutorial();
    const response=await fetch(src);if(!response.ok)throw Error(src+' '+response.status);
    const audio=await ctx.decodeAudioData(await response.arrayBuffer());
    const samples=audio.getChannelData(0);let peak=0;
    for(let i=0;i<samples.length;i+=32)peak=Math.max(peak,Math.abs(samples[i]));
    out.push({id,versioned:src.endsWith(e.path+'?v='+e.hash.slice(0,12)),seconds:audio.duration,peak});
   }
   await ctx.close();return out;
  },entries);
  assert.ok(results.every(r=>r.versioned&&r.seconds>.25&&r.peak>.001));
  assert.deepEqual(errors,[]);
  fs.writeFileSync('tools/tutorial_voice_validation.json',JSON.stringify({clips:entries.length,actor:'ash',voice:cast.ash,errors,results},null,2));
  console.log(JSON.stringify({clips:entries.length,actor:'ash',versionedPlayback:true,decoded:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
