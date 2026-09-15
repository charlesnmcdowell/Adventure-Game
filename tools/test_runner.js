'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
function run(suite='headless',only=[]) {
 const registry=require('../test/suites.json');
 if(!registry[suite])throw new Error('Unknown test suite: '+suite);
 const list=registry[suite].filter(t=>!only.length||only.includes(path.basename(t.file,'.js')));
 if(!list.length)throw new Error('No matching tests');
 const reportName=suite==='mobile'?suite+'-'+(process.env.MOBILE_WEBKIT==='1'?'webkit':'chromium'):suite;
 const dir=path.join(root,'test/reports',reportName);fs.mkdirSync(dir,{recursive:true});
 const results=[];
 for(const t of list) {
  const started=Date.now(),result=spawnSync(process.execPath,[t.file,...t.args],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000});
  const output=(result.stdout||'')+(result.stderr||'');
  const name=path.basename(t.file,'.js');fs.writeFileSync(path.join(dir,name+'.log'),output);
  const row={file:t.file,args:t.args,passed:result.status===0,exitCode:result.status,error:result.error?.message,elapsedMs:Date.now()-started};results.push(row);
  console.log((row.passed?'PASS ':'FAIL ')+t.file+' ('+row.elapsedMs+'ms)');
  if(!row.passed)console.log(output.slice(-4000));
  fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));
 }
 const failed=results.filter(r=>!r.passed).length;
 console.log(`${results.length-failed} passed, ${failed} failed. Logs: test/reports/${reportName}`);
 if(failed)process.exitCode=1;
 return results;
}
module.exports={run};
if(require.main===module)run(process.argv[2]||'headless',process.argv.slice(3));
