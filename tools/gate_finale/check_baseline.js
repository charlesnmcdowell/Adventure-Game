// Read-only comparison against HEAD; never checks out or changes runtime files.
const vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path');
const H=require('../../test/harness');
H.load=()=>{
 delete globalThis.ADV;
 for(const file of H.FILES.filter(f=>!f.endsWith('/gate_finale.js'))) {
  const source=cp.execFileSync('git',['show','HEAD:'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
  vm.runInThisContext(source,{filename:file});
 }
 return globalThis.ADV;
};
const test=process.argv[2];
if(!['gate_mercy','campaign3_perks'].includes(test))throw Error('Choose one known baseline check');
require(path.resolve('test',test+'.js'));
