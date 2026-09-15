'use strict';
const {chromium}=require('playwright'),fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('tools/voice_manifest.json'));
 const state=JSON.parse(fs.readFileSync('tools/voice_generation_state.json'));
 assert.ok(state.reservedCredits<=450000);
 for(const e of manifest.entries){
  assert.ok(fs.existsSync(e.path),e.path+' missing');
  if(e.changed){
   const rec=state.completed[e.hash];assert.ok(rec,e.path+' not generated');
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(e.path)).digest('hex'),rec.audioHash,e.path+' stale audio');
  }
 }
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8734/index.html');
 const report=await page.evaluate(async entries=>{
  const ctx=new AudioContext(),results=[];let i=0;
  async function worker(){
   while(i<entries.length){const e=entries[i++];try{
    const r=await fetch(e.path+'?v='+e.hash.slice(0,12));if(!r.ok)throw Error('HTTP '+r.status);
    const b=await ctx.decodeAudioData(await r.arrayBuffer());
    const ch=b.getChannelData(0);let peak=0;
    for(let j=0;j<ch.length;j+=32)peak=Math.max(peak,Math.abs(ch[j]));
    results.push({path:e.path,seconds:b.duration,peak,valid:b.duration>0.25&&b.duration<90&&peak>0.001});
   }catch(error){results.push({path:e.path,valid:false,error:String(error)})}}
  }
  await Promise.all(Array.from({length:4},worker));await ctx.close();return results;
 },manifest.entries);
 await browser.close();
 const summary={clips:report.length,failed:report.filter(r=>!r.valid),totalSeconds:Math.round(report.reduce((n,r)=>n+(r.seconds||0),0))};
 fs.writeFileSync('tools/story_audio_validation.json',JSON.stringify({summary,clips:report},null,2));
 console.log(JSON.stringify(summary));assert.equal(summary.failed.length,0);
})().catch(e=>{console.error(e);process.exit(1)});
