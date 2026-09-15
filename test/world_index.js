'use strict';
const assert=require('assert/strict'),h=require('./harness'),A=h.load();
A.Save.setBackend(h.memBackend());
const g=A.Game.newGame({seed:777,name:'Index',sex:'f',personalityId:'F01'}),w=g.world;
function check(){for(const c of w.characters)assert.strictEqual(A.World.byId(w,c.id),w.characters.find(x=>x.id===c.id));}
check();
for(let t=0;t<12;t++){A.World.tick(w,g.rng,{playerQuested:false});check();}
const p=A.Game.player(g),child=A.Character.makeDependent(g.rng,w,p,null);
const adult=A.Character.matureChild(g.rng,w,child,p.name);A.World.addCharacter(w,adult);check();
adult.alive=false;assert.strictEqual(A.World.byId(w,adult.id),adult,'death retains genealogy');
w.characters.reverse();check();
w.characters=w.characters.slice();check();
const removed=w.characters.splice(5,1)[0];assert.equal(A.World.byId(w,removed.id),null);check();
const previous=w.characters[3],replacement={...previous,id:'replacement'};w.characters[3]=replacement;
assert.equal(A.World.byId(w,previous.id),null);assert.strictEqual(A.World.byId(w,'replacement'),replacement);
replacement.id='renamed-fixture';assert.strictEqual(A.World.byId(w,'renamed-fixture'),replacement);check();
assert.throws(()=>A.World.addCharacter(w,{...adult}),/Duplicate/);
A.Save.saveGame(g);const loaded=A.Game.load();for(const c of loaded.world.characters)assert.strictEqual(A.World.byId(loaded.world,c.id),c);
loaded.world.characters.push({...loaded.world.characters[0]});
assert.deepEqual(A.World.duplicateIds(loaded.world),[loaded.world.characters[0].id]);
assert.strictEqual(A.World.byId(loaded.world,loaded.world.characters[0].id),loaded.world.characters[0]);
console.log('World index: ticks, adulthood, death, reorder, removal, replacement, reload and duplicates passed.');
