'use strict';
const assert=require('assert/strict'),{load,memBackend}=require('./harness');
const a=load(),s=memBackend();a.Save.setBackend(s);
const set=(k,v)=>s.setItem('adv:'+k,JSON.stringify(v));
for(const k of ['world','characters','edges','vaults','meta','backup'])set(k,{legacy:true});
set('backup',{v:1,world:{seed:1},characters:[],meta:{lives:9}});
assert.equal(a.Save.hasSave(),false);assert.deepEqual(s._m,{});assert.equal(a.Save.restoreBackup(),false);
const game=a.Game.newGame({seed:841,name:'Nia',sex:'f',portraitSlot:3,personalityId:'F01',appearance:{head:8,eyeType:3,mouthType:1,iris:'#64887f',lipColor:'#813f68'}});
game.meta.travelSeen={'bell:outbound':2};game.meta.lives=3;a.Save.saveGame(game);
const saved=a.Save.loadGame();assert.deepEqual(a.World.byId(saved.world,saved.world.playerId).appearance,a.Game.player(game).appearance);
assert.equal(saved.meta.travelSeen['bell:outbound'],2);assert.equal(saved.meta.lives,3);
s.removeItem('adv:world');assert.equal(a.Save.hasSave(),true);assert.equal(a.Save.loadGame().meta.lives,3);
s.setItem('adv:world','{broken');assert.ok(a.Save.loadGame());
set('backup',{v:1,world:{},characters:[]});assert.equal(a.Save.ensureCompatible(),true);assert.equal(s.getItem('adv:backup'),null);
// Meta persists after death even when the world and backup have been intentionally removed.
s.removeItem('adv:world');s.removeItem('adv:characters');assert.equal(a.Save.loadMeta().lives,3);
assert.equal(a.Save.loadMeta().travelSeen['bell:outbound'],2);
console.log('Anime save gate, backup recovery, appearance, and lifetime meta passed.');
