'use strict';
const assert=require('node:assert/strict'),{load,memBackend}=require('./harness');
const A=load(),C=A.Campaign3;
function fresh(mode='leader',n=1){
 A.Save.setBackend(memBackend());
 const g=A.Game.newGame({seed:918,name:'Gate Ward',sex:'f'}),p=A.Game.player(g);p.inventory.gold=5000;p.homeId='brick';g.tutorial={step:'done'};
 const extras=Array.from({length:4},(_,i)=>A.Character.base({id:'gate_external_'+i,name:'Regular '+i,sex:'m'}));
 g.world.characters.push(...extras);for(const c of extras){c.inventory.gold=0;c.combatHp=17;}
 let party=null;if(mode==='leader'||mode==='hireling'){
  const lead=mode==='hireling'?extras[0]:p;party=A.Party.create(g.world,lead.id);
  for(const c of [p,...extras].filter(c=>c!==lead)){party.memberIds.push(c.id);party.wages[c.id]=9000;c.partyId=party.id;c.leaderId=lead.id;c.wage=9000;}
 }
 if(mode!=='solo'){
  p.conscriptIds=[extras[2].id];extras[2].isConscript=true;
  p.undeadIds=[extras[3].id];extras[3].isUndead=true;extras[3].undeadQuestsLeft=20;
 }
 Object.assign(C.state(g),{stage:n-1,started:true});
 return{g,p,extras,party,q:C.buildQuest(g,n)};
}
const ids=r=>r.map(c=>c.id);
for(const mode of ['solo','leader','hireling','followers'])for(let n=1;n<=14;n++){
 const {g,p,extras,party,q}=fresh(mode,n),regular=ids(A.Game.partyRoster(g));
 for(const id of ['wren_ward','fennick','vess','selene','faelen'])C.recruit(g,id);
 const expected=[p,...(n===1?[]:C.alliesFor(g,q))];
 assert.deepEqual(ids(A.Game.departureInfo(g,q).roster),ids(expected));
 assert.equal(A.Game.departureInfo(g,q).payroll,0);
 assert.equal(A.Travel.quote(g,q).payer,p,'Gate passage is paid by the player');
 assert.equal(A.Game.contractCoversPayroll(g,q),true,'idle regular wages cannot block a story quest');
 assert.equal(!!C.departureNotice(g,q),mode!=='solo');
 assert.equal(A.Game.startQuest(g,q).ok,true,mode+' Q'+n);
 assert.deepEqual(ids(A.Game.partyRoster(g)),ids(expected));
 assert.deepEqual(ids(A.Travel.roster(g)),ids(expected));
 assert.ok(extras.every(c=>c.combatHp===17),'idle party was not healed/reset for the quest');
 A.Game.currentEncounter(g);const st=A.Game.startCombat(g,false);
 assert.equal(st.leaderId,p.id);assert.deepEqual(ids(st.units.filter(u=>u.side==='a').map(u=>u.ch)),ids(expected));
 assert.equal(A.Party.of(g.world,p),party);
 g.quest=null;assert.deepEqual(ids(A.Game.partyRoster(g)),regular,'normal roster restored without disbanding');
}
// Only actual Gate companion definitions can enter through the story company.
{
 const {g,p,q}=fresh('leader',2);const fake=Object.values(A.DATA.CAMPAIGN_CHARS).find(c=>c.faction!=='gate');
 Object.assign(C.state(g),{company:[fake.id,'aldric','wren_ward'],recruited:[fake.id,'aldric','wren_ward']});
 assert.deepEqual(ids(A.Game.partyRoster(g,q)),[p.id,C.actor(g,'wren_ward').id]);
}
// Hiwot joins through the actual Q1 arrival beat, then rides in Q2.
{
 const {g,p}=fresh('hireling');assert.deepEqual(A.Game.partyRoster(g,C.buildQuest(g,1)),[p]);
 C.applyBeat(g,C.arrivalBeats(g,1).find(b=>b.recruit?.includes('wren_ward')));
 assert.deepEqual(A.Game.partyRoster(g,C.buildQuest(g,2)).map(c=>c.campaignId||'player'),['player','wren_ward']);
}
// Quest-created summons remain available even when all the normal seats are full.
{
 const {g,p,q,extras}=fresh('leader',6);
 for(const id of ['wren_ward','fennick','vess','selene','faelen'])C.recruit(g,id);
 p.perks.push({skillId:'necromancy',level:1,uses:0});A.Game.startQuest(g,q);
 const fallen=Array.from({length:3},()=>A.Character.makeEnemy(g.rng,'dire_wolf',{level:1,world:g.world}));
 const raised=A.Game.autoRaiseFallen(g,fallen);assert.equal(raised.length,2);
 assert.ok(raised.every(c=>A.Game.partyRoster(g).includes(c)));assert.equal(A.Game.partyRoster(g).length,A.Party.companyCap());
 assert.ok(extras.every(c=>!A.Game.partyRoster(g).includes(c)));
 // A preview for a different quest cannot borrow the current battle's thralls.
 assert.deepEqual(A.Game.partyRoster(g,C.buildQuest(g,1)),[p]);
 A.Game.releaseQuestThralls(g);assert.equal(g.quest.thralls.length,0);assert.deepEqual(p.undeadIds,[extras[3].id]);
}
// Settlement is independent of the resting party on both success and failure.
// Pause the unrelated world simulation to isolate quest money/relationship effects.
const tick=A.World.tick;A.World.tick=()=>{};
try{for(const mode of ['leader','hireling'])for(const failed of [false,true]){
 const {g,p,q,extras,party}=fresh(mode,2);C.recruit(g,'wren_ward');
 const members=party.memberIds.slice(),wages={...party.wages};A.Game.startQuest(g,q);g.quest.lootGold=57;
 const snapshot=A.Travel.roster(g).slice(),run=g.quest;run.failed=failed;run.fled=failed;run.over=true;
 const out=A.Game.completeQuest(g);
 assert.equal(out.wage,0);assert.equal(out.leaderTake,null);assert.ok(!out.payroll&&!out.fired);
 if(!failed){assert.equal(out.gold,q.payout);assert.equal(out.loot,57);}
 assert.ok(extras.every(c=>c.inventory.gold===0));assert.deepEqual(party.memberIds,members);assert.deepEqual(party.wages,wages);
 g.travelResolution={q:run,roster:snapshot};assert.deepEqual(ids(A.Travel.roster(g)),ids(snapshot));delete g.travelResolution;
 assert.equal(A.Party.of(g.world,p),party);
 A.Save.saveGame(g);const restored=A.Game.load();assert.deepEqual(A.Party.of(restored.world,A.Game.player(restored)).memberIds,members);
 assert.ok(!A.Game.partyRoster(restored,C.buildQuest(restored,2)).some(c=>extras.some(e=>e.id===c.id)));
}}finally{A.World.tick=tick;}
// Death/flee handling cannot dismiss or kill an employer waiting at home.
for(const leaderFled of [true,false]){
 const {g,p,party,q,extras}=fresh('hireling',2);A.Game.startQuest(g,q);
 A.Game.resolveLeaderFall(g,{leaderFled});assert.equal(g.quest.failed,true);assert.equal(A.Party.of(g.world,p),party);
 assert.ok(extras[0].alive);assert.ok(!g.world.pendingLeaderDeath);if(!leaderFled)assert.equal(g.quest.playerDead,true);
}
// The explanatory notice survives reload and resets with a campaign restart.
{
 const {g,q}=fresh();assert.match(C.departureNotice(g,q),/begin this quest alone/);
 C.state(g).partyNoticeSeen=true;A.Save.saveGame(g);const restored=A.Game.load();assert.equal(C.departureNotice(restored,q),null);
 C.restart(restored);assert.ok(C.departureNotice(restored,q));
}
// Ordinary quests and both original faction campaigns keep their regular party.
{
 const {g,p,party}=fresh('hireling');const normal={id:'normal',track:'party',payout:50000,travelLocation:'port',encounters:[]};
 const expected=A.Party.battleRoster(g.world,p);assert.deepEqual(A.Game.departureInfo(g,normal).roster,expected);
 assert.equal(A.Travel.quote(g,normal).payer,A.Party.leader(g.world,party));
 for(const q of [normal,{...normal,campaign:true,factionId:'antler',n:2},{...normal,campaign:true,campaign2:true,factionId:'green',n:2}]){
  assert.ok(expected.every(c=>A.Game.partyRoster(g,q).includes(c)));assert.equal(C.departureNotice(g,q),null);
 }
}
console.log('Gate party isolation passed: all 14 quests × solo/leader/hireling/followers; prologue/recruits; summon capacity; costs/rewards/failures; save/restart; return travel; regular/faction quest controls.');
