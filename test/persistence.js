'use strict';
const assert=require('assert/strict'),h=require('./harness');
let A;
function fresh(storage=h.memBackend()) {
  A=h.load();A.Save.setBackend(storage);
  return {storage,game:A.Game.newGame({seed:4823,name:'Save test',sex:'f',personalityId:'F01',startingSkills:['mend']})};
}
// Cold runtime reload, adulthood and vault creation preserve identity links.
{
 const {storage,game}=fresh(),p=A.Game.player(game);
 const old=A.Vault.ensureOwn(game.world,p);old.gold=800;
 const child=A.Character.makeDependent(game.rng,game.world,p,null);child.name='Heir';p.dependents.push(child);
 A.Save.saveGame(game);A=h.load();A.Save.setBackend(storage);
 const loaded=A.Game.load(),mother=A.Game.player(loaded);
 const adult=A.Character.matureChild(loaded.rng,loaded.world,mother.dependents[0],mother.name);
 assert(!loaded.world.characters.some(c=>c.id===adult.id));loaded.world.characters.push(adult);
 assert.equal(adult.motherId,mother.id);
 const vault=A.Vault.ensureOwn(loaded.world,adult);assert.notEqual(vault.id,old.id);
 assert.equal(A.Vault.of(loaded.world,mother).gold,800);
 A.Save.saveGame(loaded);A=h.load();A.Save.setBackend(storage);
 const again=A.Game.load();assert.equal(A.World.byId(again.world,adult.id).name,'Heir');
}
// Fail every atomic write independently. Never expose an uncommitted revision.
for(const failAt of [1,2]) {
 const {storage,game}=fresh();const p=A.Game.player(game);p.inventory.gold=70;A.Save.saveGame(game);
 const before=A.Save.exportGame();let calls=0;const original=storage.setItem;
 storage.setItem=function(k,v){if(++calls===failAt)throw new Error('quota');original.call(this,k,v);};
 game.world.questClock=9;p.inventory.gold=193;
 assert.equal(A.Save.saveGame(game).ok,false);
 assert.equal(A.Save.exportGame(),before);
 A=h.load();A.Save.setBackend(storage);assert.equal(A.Game.player(A.Game.load()).inventory.gold,70);
 storage.setItem=original;
}
{
 const {storage,game}=fresh();A.Game.player(game).inventory.gold=99;A.Save.saveGame(game);
 const original=storage.setItem;storage.setItem=()=>{throw new Error('denied');};
 assert.equal(A.Save.restoreBackup(),false);storage.setItem=original;
 const head=JSON.parse(storage.getItem('adv:commit'));storage.setItem('adv:slot:'+head.current.slot,'{broken');
 assert(A.Save.loadGame()); // falls back to the committed previous revision
 const text=A.Save.exportGame(),before=text;
 assert.equal(A.Save.importGame('{not json').ok,false);assert.equal(A.Save.exportGame(),before);
 assert.equal(A.Save.importGame(JSON.stringify({world:{},meta:{artVersion:2}})).ok,false);
 const destination=h.memBackend();A.Save.setBackend(destination);
 assert.equal(A.Save.importGame(text).ok,true);assert.equal(A.Save.exportGame(),text);
}
// Legacy current-art saves migrate without deleting input before commit succeeds.
{
 const {game}=fresh();const payload=A.Save.capture(game),legacy=h.memBackend();
 for(const k of ['world','characters','edges','vaults','meta'])legacy.setItem('adv:'+k,JSON.stringify(payload[k]));
 A.Save.setBackend(legacy);assert.equal(A.Game.player(A.Game.load()).name,'Save test');
 const original=legacy.setItem;legacy.setItem=()=>{throw new Error('quota');};
 assert.equal(A.Save.saveGame(game).ok,false);assert(legacy.getItem('adv:world'));
 legacy.setItem=original;assert.equal(A.Save.saveGame(game).ok,true);assert.equal(legacy.getItem('adv:world'),null);
}
{
 const {storage,game}=fresh();for(let i=0;i<37;i++)game.rng.float();A.Save.saveGame(game);
 const expected=Array.from({length:20},()=>game.rng.float());
 A=h.load();A.Save.setBackend(storage);const loaded=A.Game.load();
 assert.deepEqual(Array.from({length:20},()=>loaded.rng.float()),expected);
 const before=storage.getItem('adv:commit'),preview=Object.assign({},loaded,{meta:{lives:999}});
 A.Save.bind(preview,A.Save.memoryBackend());A.Save.saveGame(preview);A.Save.saveMeta(preview);
 assert.equal(storage.getItem('adv:commit'),before);
}
console.log('Persistence: cold IDs, atomic failures, recovery, migration, import/export, RNG, preview isolation passed.');
