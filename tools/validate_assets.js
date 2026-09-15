// Check literal paths, generated manifests, and indexed atlas references.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),refs=new Set(),errors=[];
const add=p=>{if(typeof p==='string'&&!/[${}]/.test(p))refs.add(p.split(/[?#]/)[0]);};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g))if(!/^(?:https?:|data:|#)/.test(m[1]))add(m[1]);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
for(const f of walk(path.join(root,'js')).filter(f=>f.endsWith('.js'))) {
 // Its sources[] lists production provenance, never a runtime request. Validate
 // this generated catalog's actual runtime groups explicitly below.
 if(path.basename(f)==='gate_manifest.js')continue;
 const text=fs.readFileSync(f,'utf8');
 for(const m of text.matchAll(/["'`]((?:assets|audio|lib|js)\/[\w./-]+\.(?:js|json|mp3|ogg|wav|webp|png|jpg|css|svg))(?:[?#][^"'`]*)?["'`]/g))add(m[1]);
}
const context={ADV:{}};
for(const f of ['anime_manifest','gate_manifest']) {
 const file=path.join(root,'js/ui',f+'.js');if(fs.existsSync(file))vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
}
for(const p of Object.values(context.ADV.AnimeManifest?.parts||{}))add('assets/anime/v2/runtime/'+p.file);
for(const p of Object.values(context.ADV.AnimeManifest?.environments||{}))add('assets/anime/v2/runtime/'+p.file);
// Gate parts are registered into the production atlas map when the game boots.
const gate=context.ADV.GateManifest;
for(const p of Object.values(gate?.parts||{}))add('assets/anime/v2/runtime/'+p.file);
for(const group of ['environments','panoramas','stills','ui'])for(const p of Object.values(gate?.[group]||{}))add(p.file);
// Legacy illustrated druid forms are requested by ID at runtime.
const art=fs.readFileSync(path.join(root,'js/ui/anime_art.js'),'utf8');
const catalog=art.match(/const ASSETS\s*=\s*({[\s\S]*?});/);
if(catalog)for(const value of Object.values(vm.runInNewContext('('+catalog[1]+')')))add('assets/anime/v1/'+value);
for(const ref of [...refs].filter(p=>p.endsWith('.css'))) {
 const filename=path.resolve(root,ref);if(!fs.existsSync(filename))continue;
 for(const m of fs.readFileSync(filename,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))
  if(!/^(?:data:|https?:|#)/.test(m[1]))add(path.relative(root,path.resolve(path.dirname(filename),m[1])).replaceAll('\\','/'));
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons||[])add(icon.src);
const files=[...refs].sort();
for(const ref of files){const p=path.resolve(root,ref);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))errors.push(ref);}
const output={references:files,missing:errors};
if(process.argv.includes('--json'))console.log(JSON.stringify(output));
else console.log(`Asset references: ${files.length} checked, ${errors.length} missing`+(errors.length?'\n'+errors.join('\n'):''));
if(errors.length)process.exitCode=1;
