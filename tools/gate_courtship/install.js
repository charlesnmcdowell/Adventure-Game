const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const A=require('../../test/harness').load(),patch=read(path.join(__dirname,'patch.json')),state=read(path.join(__dirname,'recording.json'));
 const cast=read('tools/voice_casting.json'),checks=[];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage();
  for(const e of patch.entries){
   assert.equal(e.voice,cast[e.speaker]);assert.equal(A.DATA.CAMPAIGN3_DIALOGUE.gate[e.speaker][e.key][e.index-1].t,e.shown);
   const rec=state.completed[e.hash],bytes=fs.readFileSync(path.join(__dirname,'audio',e.speaker,path.basename(e.path)));
   assert.equal(hash(bytes),rec.audioHash);assert.equal(rec.voice,e.voice);
   const sound=await page.evaluate(async b64=>{const ctx=new AudioContext(),b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const a=await ctx.decodeAudioData(b.buffer);let peak=0,power=0;for(const v of a.getChannelData(0)){peak=Math.max(peak,Math.abs(v));power+=v*v;}await ctx.close();return{duration:a.duration,peak,rms:Math.sqrt(power/a.length)};},bytes.toString('base64'));
   assert.ok(sound.duration>.5&&sound.duration<45&&sound.peak>.05&&sound.rms>.004);
   checks.push({path:e.path,voice:e.voice,audioHash:rec.audioHash,...sound});
  }
 }finally{await browser.close();}
 const backup=path.resolve('archive/dialogue/2026-09-14-gate-courtship');
 const manifest=read('tools/voice_manifest.json'),globalState=read('tools/voice_generation_state.json');
 for(const e of patch.entries){
  const dest=path.resolve(e.path),old=path.join(backup,e.path);
  assert.ok(dest.startsWith(path.resolve('audio/vo/campaign')+path.sep));
  if(fs.existsSync(dest)&&!fs.existsSync(old)){fs.mkdirSync(path.dirname(old),{recursive:true});fs.copyFileSync(dest,old);}
  fs.copyFileSync(path.join(__dirname,'audio',e.speaker,path.basename(e.path)),dest);
  A.DATA.VOICE_HASHES[e.path]=e.hash.slice(0,12);
  const slot=manifest.entries.findIndex(x=>x.path===e.path),{before,...entry}=e;
  if(slot>=0)manifest.entries[slot]={...manifest.entries[slot],...entry,c3:true,changed:false};else manifest.entries.push({...entry,c3:true,changed:false});
  const rec=state.completed[e.hash];globalState.completed[e.hash]={path:e.path,audioHash:rec.audioHash,bytes:rec.bytes};
 }
 globalState.externalPatchRuns??=[];const id='20260914-gate-courtship';
 let run=globalState.externalPatchRuns.find(r=>r.id===id);
 const delta=state.reserved-(run?.reservedCredits||0);assert.ok(delta>=0);
 globalState.reservedCredits+=delta;
 if(!run){run={id};globalState.externalPatchRuns.push(run);}
 Object.assign(run,{clips:checks.length,reservedCredits:state.reserved,reportedCost:state.reportedClipCosts});
 fs.writeFileSync('tools/voice_manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync('tools/voice_generation_state.json',JSON.stringify(globalState,null,2));
 fs.writeFileSync('js/data/voice_manifest.js','// Content hashes prevent stale recordings after a script revision.\nADV.DATA.VOICE_HASHES = '+JSON.stringify(A.DATA.VOICE_HASHES)+';\n');
 let html=fs.readFileSync('index.html','utf8');
 for(const file of ['data/campaign3_data','data/campaign3_dialogue','data/voice_manifest','core/campaign3','ui/campaign3_ui']){
  html=html.replace(new RegExp('(js/'+file+'\\.js)(?:\\?v=[^"\\s]+)?'),'$1?v='+id+'-r2');
 }
 fs.writeFileSync('index.html',html);
 fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify({checks,billed:state.reportedClipCosts,installedAt:new Date().toISOString()},null,2));
 console.log(JSON.stringify({installed:checks.length,billed:state.reportedClipCosts,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
