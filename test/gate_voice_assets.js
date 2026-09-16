// Read-only Q12-Q14 recording/deployment audit. --live compares the public origin.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const A=require('./harness').load();
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const dir=path.join(__dirname,'../test/reports/gate-voice');fs.mkdirSync(dir,{recursive:true});
// Written, approved for the page, not yet cut. Lines wait here only while the player is
// still reading them; delete a key the moment its clip exists and the assertions below
// guard it like every other line. The count is reported so a forgotten entry is visible.
const PENDING=new Set();
(async()=>{
 const rows=[],pending=[];
 for(const [who,keys] of Object.entries(A.DATA.CAMPAIGN3_DIALOGUE.gate)) for(const [key,lines] of Object.entries(keys)) {
  if(!/^q(12|13|14)_/.test(key))continue;
  for(const [i,line] of lines.entries()) {
   const file=`audio/vo/campaign/${who}/${key}_${i+1}.mp3`,abs=path.join(__dirname,'..',file),exists=fs.existsSync(abs);
   const row={who,key,index:i+1,file,text:line.t,exists,bytes:exists?fs.statSync(abs).size:0,hash:exists?digest(fs.readFileSync(abs)):null,version:A.DATA.VOICE_HASHES[file]||null};
   if(PENDING.has(who+':'+key)&&!exists){pending.push(row);continue;}
   rows.push(row);
  }
 }
 if(process.argv.includes('--live')){
  const origin='https://charlesnmcdowell.github.io/Adventure-Game/';
  const files=rows.concat(['index.html','js/ui/music.js','js/ui/campaign3_ui.js','js/data/campaign3_dialogue.js'].map(file=>({file,hash:digest(fs.readFileSync(path.join(__dirname,'..',file)))})));
  let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{
   while(cursor<files.length){const row=files[cursor++];try{
    const response=await fetch(origin+row.file+(row.version?'?v='+row.version:''),{signal:AbortSignal.timeout(45000)});
    const body=Buffer.from(await response.arrayBuffer());row.live={status:response.status,bytes:body.length,hash:digest(body),matches:digest(body)===row.hash,contentType:response.headers.get('content-type')};
   }catch(e){row.live={error:e.message};}}
  }));
  fs.writeFileSync(path.join(dir,'live.json'),JSON.stringify(files,null,2));
  console.log(JSON.stringify({liveFiles:files.length,issues:files.filter(r=>!r.live?.matches).map(r=>({file:r.file,live:r.live}))},null,2));
 }
 fs.writeFileSync(path.join(dir,'inventory.json'),JSON.stringify(rows,null,2));
 assert(rows.length>=81,'retain late campaign recording coverage');
 assert.deepEqual(rows.filter(r=>!r.exists||r.bytes<1024||!r.version),[],'late campaign clips must exist with a cache version');
 console.log(JSON.stringify({lateClips:rows.length,missing:rows.filter(r=>!r.exists).map(r=>r.file),awaitingRecording:pending.map(r=>r.file),segun:rows.filter(r=>r.who==='lucan').map(r=>r.file)},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
