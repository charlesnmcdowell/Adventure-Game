'use strict';
const assert = require('assert/strict'), fs = require('fs'), vm = require('vm');
const H = require('./harness'), A = H.load();
H.checkScriptOrder().ok || assert.fail('Browser/harness load order differs');
A.Save.setBackend(H.memBackend());
const game = A.Game.newGame({seed: 41, name:'Rook', sex:'m', personalityId:'M15', startingSkills:['mend']});
const w = game.world, player = A.Game.player(game);
const npc = w.characters.find(c => c.alive && !c.isPlayer && !c.isMonster && c.personalityId);
assert.equal(player.personalityId, 'M15');
assert.equal(A.Conversation.assign(player, 'M02'), false, 'Identity cannot be rerolled');
assert.equal(A.Conversation.personalityPool('m').length, 30);
assert.equal(A.Conversation.personalityPool('f').length, 30);
assert.equal(A.Conversation.assign({sex:'f'}, 'M01'), false);
function relation(from, to, score) {
 w.edges = w.edges.filter(e => e.fromId !== from.id || e.toId !== to.id);
 w.edges.push({fromId:from.id,toId:to.id,score});
}
relation(npc, player, 60); relation(player, npc, -70);
let turns = A.Conversation.exchange(game, npc, {rand:0});
assert.equal(turns.length, 2);
assert.equal(turns[0].band, 'friendly');
assert.equal(turns[1].band, 'hatred_response', 'Reply uses listener-to-speaker regard');
assert.equal(turns[1].ctx.listenerId, npc.id);
relation(npc, player, -70); relation(player, npc, 60);
turns = A.Conversation.exchange(game, npc, {rand:0});
assert.equal(turns[1].band, 'dismissal_response', 'A friendly listener respects an explicit dismissal');
assert.equal(A.Conversation.exchange(game,npc,{listenerId:null}).length,1);
assert.equal(A.Conversation.exchange(game,npc,{listenerId:npc.id}).length,1);
assert.equal(A.Conversation.exchange(game,npc,{noReply:true}).length,1);
player.alive=false;
assert.equal(A.Conversation.exchange(game,npc,{}).length,1,'A dead listener cannot reply');
player.alive=true;
npc.alive=false;
assert.deepEqual(A.Conversation.exchange(game,npc,{}),[],'Dead speakers cannot start a social exchange');
npc.alive=true;
const inquirer={...npc,personalityId:'M15',lastVariantUsed:{}};
relation(player,inquirer,0);
assert.equal(A.Conversation.exchange(game,inquirer,{band:'general',rand:0})[1].band,'inquiry_response','A request to state business receives a brief acknowledgment');
const funeral = A.Conversation.exchange(game,npc,{scene:'funeral',listenerId:null,subjectName:'The dead captain',band:'hatred'});
assert.equal(funeral.length,1);
assert.equal(funeral[0].band,'funeral_hatred');
assert.equal(funeral[0].ctx.them,'The dead captain');
assert.equal(funeral[0].ctx.listenerId,null);
assert.equal(A.util.speakEx(w,npc,'nonexistent',{}),null);
function noRepeat(speaker, band, extra, n, allowSingle=false) {
 const seen = [];
 for (let i = 0; i < n; i++) {
  const line = A.util.speakEx(w, speaker, band, extra || {});
  assert.ok(line, band + ' must have a line');
  if (seen.length&&!allowSingle) assert.notEqual(line.idx, seen[seen.length - 1], band + ' never repeats back to back');
  seen.push(line.idx);
 }
 return new Set(seen);
}
const replyNpc = {...npc, lastVariantUsed: {}, dialogueRotation: {}};
for (const band of ['general_response','friendly_response','hatred_response','romantic_response']) {
 const pool = A.DATA.DIALOGUE[replyNpc.personalityId][band];
 assert.ok(pool.length >= 4, band + ' keeps the full emotional pool');
 const rules=A.DATA.DIALOGUE[replyNpc.personalityId].replyFamilies[band];
 const thanks=pool.map((_,i)=>i).filter(i=>rules[i].includes('thanks'));
 replyNpc.lastVariantUsed = {}; replyNpc.dialogueRotation = {};
 const first = noRepeat(replyNpc, band, {replyTo:'thanks', target:player.name}, thanks.length, thanks.length===1);
 assert.equal(first.size,thanks.length,band+' spends every thanks reply first');
 assert.ok([...first].every(i=>thanks.includes(i)),band+' answers thanks before reaching for other replies');
 if (pool.length > thanks.length) {
  const more = noRepeat(replyNpc, band, {replyTo:'thanks', target:player.name}, pool.length - thanks.length);
  assert.ok([...more].every(i => !first.has(i)),band+' uses other responses after thanks is spent');
 }
}
noRepeat({...npc, lastVariantUsed:{}, dialogueRotation:{}}, 'friendly', {score:80, target:player.name}, 24);
noRepeat({...npc, lastVariantUsed:{}, dialogueRotation:{}}, 'hatred', {score:-80, target:player.name}, 24);
{
 const speaker={personalityId:npc.personalityId, lastVariantUsed:{}, dialogueRotation:{}};
 const band='friendly_response';
 const rules=A.DATA.DIALOGUE[speaker.personalityId].replyFamilies[band];
 const contact=A.DATA.DIALOGUE[speaker.personalityId][band].map((_,i)=>i).filter(i=>rules[i].includes('contact'));
 const walked=[];
 for (let i = 0; i < contact.length; i++) walked.push(A.util.speakEx(w, speaker, band, {replyTo:'contact', target:player.name}).idx);
 assert.deepEqual(walked, contact, 'contact replies walk their family in order');
 if (contact.length > 1) {
  assert.notEqual(A.util.speakEx(w, speaker, band, {replyTo:'contact', target:player.name}).idx, walked[walked.length-1], 'a new cycle does not reopen the last contact reply');
 }
 const greeter={personalityId:npc.personalityId, lastVariantUsed:{}, dialogueRotation:{}};
 const greetPool=A.DATA.DIALOGUE[greeter.personalityId].friendly.filter((t,i)=>{
  const needs=A.util.lineNeeds(t); return !needs.includes('them') && !needs.includes('partner');
 });
 const greetSeen=new Set();
 let lastGreet=null;
 const greetN=Math.min(8, greetPool.length);
 for (let i = 0; i < greetN; i++) {
  const line=A.util.speakEx(w, greeter, 'friendly', {score:80, target:player.name});
  if (lastGreet != null) assert.notEqual(line.idx, lastGreet);
  lastGreet=line.idx;
  greetSeen.add(line.idx);
 }
 assert.equal(greetSeen.size, greetN, 'a warm greeting uses the whole friendly pool, not two neighbouring lines');
}
A.Conversation.remember(w,'revived',player.id,npc.id);
A.Conversation.remember(w,'revived',player.id,npc.id);
assert.equal(npc.conversationMemory.filter(e=>e.kind==='revived').length,1);
turns = A.Conversation.exchange(game,npc,{scene:'return'});
assert.equal(turns[0].band,'revived');
assert.notEqual(A.Conversation.exchange(game,npc,{})[0].band,'revived','Memory acknowledged once');
A.Conversation.remember(w,'theft',player.id,npc.id);
const other = w.characters.find(c=>c!==npc&&c!==player&&c.alive);
assert.notEqual(A.Conversation.exchange(game,npc,{listenerId:other.id})[0].band,'theft');
assert.equal(A.Conversation.exchange(game,npc,{})[0].band,'theft');
A.Conversation.remember(w,'revived',other.id,npc.id);
w.questClock += 4;
assert.notEqual(A.Conversation.exchange(game,npc,{listenerId:other.id})[0].band,'revived');
w.pendingLeaderDeath={leaderName:'Captain Vale',words:[{id:player.id,band:'hatred',score:-70}],memberIds:[player.id]};
A.Save.saveGame(game);
const restored = A.Save.loadGame();
assert.equal(A.World.byId(restored.world,player.id).personalityId,'M15');
assert.deepEqual(A.World.byId(restored.world,npc.id).conversationMemory,npc.conversationMemory);
assert.deepEqual(restored.world.pendingLeaderDeath,w.pendingLeaderDeath,'A pending funeral survives save migration');
player.bloodline={demigod:true};
assert.equal(A.Character.voiceTagFor(w,player),null,'Inherited powers do not recast an ordinary voice');
w.parties=[{id:'conversation-party',leaderId:npc.id,memberIds:[player.id],wages:{}}];
player.partyId=npc.partyId='conversation-party';
turns=A.Conversation.partyExchange(game,'departure');
assert.equal(turns[0].speaker.id,player.id,'A hired player can initiate a party remark');
assert.equal(turns[0].ctx.listenerId,npc.id,'Departure addresses the actual NPC leader');
assert.equal(turns[0].band,'departure');
for(const p of Object.values(A.DATA.DIALOGUE).filter(p=>!p.hidden)) {
 assert.match(p.hatred.join(' '),/fuck|shit|damn|bloody/i,p.id+' retains coarse hostility');
 for(const b of ['departure','return','revived','theft','funeral_general','funeral_friendly','funeral_hatred','funeral_romantic','dismissal_response','inquiry_response','combat_hatred']) assert.ok(p[b].length,p.id+' '+b);
 for(const b of ['general_response','friendly_response','hatred_response','romantic_response']) {
  for(const family of ['contact','company','preparation','thanks']) assert.ok(p.replyFamilies[b].some(x=>x.includes(family)),p.id+' '+family);
 }
}
for(const [key,beats] of Object.entries(A.DATA.STORY_SCENES))for(const b of beats){
 const fid=key.split(':')[0];
 assert.ok(A.DATA.CAMPAIGN_CHARS[b.who]);
 assert.ok(b.to==='player'||A.DATA.CAMPAIGN_CHARS[b.to]);
 assert.ok(A.Campaign.lines(fid,b.who,b.key).length,key+' '+b.key);
}
for(const fid of ['maw','antler','varenholm','bell','green','tally','navy']){
 assert.equal(A.DATA.CAMPAIGN_QUESTS[fid].length,5);
 assert.ok(A.DATA.CAMPAIGN_QUESTS[fid].every(q=>q.brief===q.storyCaption));
 assert.ok(A.DATA.STORY_DEATH_CAPTIONS[fid]);
}
// Drive the actual presentation sequencer without Phaser rendering: close once,
// cancel mid-exchange, and keep each speech clip with its own character.
vm.runInThisContext(fs.readFileSync('js/ui/dialoguebox.js','utf8'));
const calls=[]; let closer, callback;
A.Music={stopTutorial(){},speakFile(...args){calls.push(args);}};
A.DialogueBox.showText=(scene,g,s,text,done)=>{ callback=done; return closer={close:done}; };
relation(npc,player,0); relation(player,npc,0);
turns=A.Conversation.exchange(game,npc,{});
let ended=0;
const exchange=A.DialogueBox.playExchange({},game,turns,()=>ended++);
assert.equal(calls.length,1);
callback();
assert.equal(calls.length,2);
assert.equal(calls[1][0],player.personalityId);
exchange.close(); exchange.close();
assert.equal(ended,1);
const count=calls.length;
callback();
assert.equal(calls.length,count,'Cancelled exchange cannot restart');
console.log('Conversation regression checks passed: identity, directed responses, dismissal, context, memory, saves, script links, voice sequencing and cancellation.');
