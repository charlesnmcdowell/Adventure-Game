// Explicit benchmark, not a wall-clock pass/fail gate. Compare identical worlds.
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),h=require('./harness');
const ticks=+(process.argv.find(a=>a.startsWith('--ticks='))||'--ticks=150').split('=')[1],rows=[];
for(const indexed of [false,true]){
 const A=h.load();A.Save.setBackend(h.memBackend());
 const g=A.Game.newGame({seed:78232,name:'Profile',sex:'f',personalityId:'F01'});
 const query=indexed?A.World.byId:(world,id)=>world.characters.find(c=>c.id===id)||null;
 let calls=0,queryMs=0;
 A.World.byId=(world,id)=>{const start=performance.now();const value=query(world,id);calls++;queryMs+=performance.now()-start;return value;};
 const start=performance.now();for(let tick=0;tick<ticks;tick++)A.World.tick(g.world,g.rng,{playerQuested:true});
 rows.push({indexed,ticks,calls,queryMs,totalMs:performance.now()-start,population:g.world.characters.length,
  hash:crypto.createHash('sha256').update(JSON.stringify(A.Save.capture(g))).digest('hex')});
}
assert.equal(rows[0].hash,rows[1].hash,'indexed simulation must preserve the complete world');
fs.mkdirSync('test/reports/profile',{recursive:true});fs.writeFileSync('test/reports/profile/world-index.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows,null,2));
