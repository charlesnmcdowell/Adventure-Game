'use strict';
const assert=require('node:assert/strict'),{load,memBackend}=require('./harness');
const A=load();
require('node:vm').runInThisContext(require('node:fs').readFileSync('js/ui/tutor.js','utf8'));
// Keep unrelated population rolls out of resolution assertions.
A.World.tick=()=>{};A.Game.pendingAmbush=()=>null;
function fresh(party=false){
 A.Save.setBackend(memBackend());
 const g=A.Game.newGame({seed:918,name:'Nia',sex:'f',startingSkills:['fire_bolt','bulwark','heal']}),p=A.Game.player(g);
 p.inventory.gold=10000;p.homeId='brick';g.tutorial={step:'firstQuest'};
 if(party){
  const ally=A.Character.base({id:'advice_ally',name:'Ally',sex:'m'});g.world.characters.push(ally);
  const company=A.Party.create(g.world,ally.id);company.memberIds.push(p.id);company.wages[p.id]=0;p.partyId=company.id;p.leaderId=ally.id;
 }
 const q={...g.board.find(q=>q.track===(party?'party':'solo')&&!q.isBoss)};q.encounters=q.encounters.slice(0,1);
 assert.ok(A.Game.startQuest(g,q).ok);A.Game.currentEncounter(g);
 return{g,p,q,st:A.Game.startCombat(g,false)};
}
for(const party of [false,true])for(const outcome of ['win','downed-win','fled-win','fled-loss','death-loss','loss']){
 const {g,p,st}=fresh(party),u=st.units.find(u=>u.ch===p);
 st.winner=outcome.endsWith('win')?'a':'b';st.ended=true;
 if(outcome.startsWith('downed')||outcome==='death-loss'){u.downed=true;u.chp=0;}
 if(outcome.startsWith('fled'))u.fled=true;
 const result=A.Game.finishCombat(g),run=g.quest;
 assert.equal(!!g.meta.questFailureAdvice,false,'no advice while combat merely resolves');
 if(outcome==='death-loss'){
  assert.equal(result.playerDead,true);A.Game.onPlayerDeath(g,null);
  assert.ok(A.Save.loadMeta().questFailureAdvice,'fatal loss survives in meta');
 }else{
  A.Game.completeQuest(g);
  assert.equal(!!g.meta.questFailureAdvice,st.winner!=='a',`${party}/${outcome}`);
  assert.equal(!!A.Game.load().meta.questFailureAdvice,st.winner!=='a','reload preserves exact outcome');
 }
 if(st.winner==='a'){assert.ok(p.alive);assert.ok(!run.failed&&!run.playerDead);}
 else{
  delete g.meta.questFailureAdvice;
  assert.equal(A.Game.queueQuestFailureAdvice(g,run),false,'same resolved quest cannot requeue after dismissal');
  assert.ok(!g.meta.questFailureAdvice);
 }
}
// Every Gate chapter uses the same failure path, including abandoning without combat.
for(let n=1;n<=14;n++){
 const {g}=fresh();g.quest=null;const q=A.Campaign3.buildQuest(g,n);assert.ok(A.Game.startQuest(g,q).ok);
 g.quest.failed=true;g.quest.fled=true;g.quest.over=true;
 A.Game.completeQuest(g);assert.equal(g.meta.questFailureAdvice.questName,q.name);
}
// Original faction quest failure also reaches settlement independently of progression.
for(const second of [false,true]){
 const {g}=fresh();Object.assign(g.quest.quest,{campaign:true,campaign2:second,factionId:'antler',n:2});
 g.quest.failed=true;g.quest.over=true;A.Game.completeQuest(g);assert.ok(g.meta.questFailureAdvice);
}
// A lost life is not, by itself, a lost quest (including an ambush after victory).
for(const completed of [false,true]){
 const {g,st}=fresh();
 if(completed){st.winner='a';A.Game.finishCombat(g);A.Game.completeQuest(g);}else g.quest=null;
 A.Game.onPlayerDeath(g,null);assert.ok(!g.meta.questFailureAdvice);
}
// Pending advice survives reincarnation, yet a deliberately brand-new game resets it.
{
 const {g}=fresh();g.quest.playerDead=true;g.quest.over=true;A.Game.onPlayerDeath(g,null);
 const next=A.Game.newGame({seed:919,name:'Next',sex:'f'});assert.ok(next.meta.questFailureAdvice);
 delete next.meta.questFailureAdvice;A.Save.saveMeta(next);assert.ok(!A.Save.loadMeta().questFailureAdvice);
 A.Save.reset();assert.ok(!A.Game.newGame({seed:920,name:'New',sex:'m'}).meta.questFailureAdvice);
}
// The spoken armor examples match the real equipped tier, not the learned level.
{
 const {p}=fresh();p.equippedSet='mage';const e=A.SkillSys.entryFor(p,'fire_bolt');
 e.level=1;assert.equal(A.SkillSys.manifest(p,e).tier,'intermediate');assert.equal(e.level,1);
 e.level=A.DATA.CONST.TIER_THRESHOLDS.intermediate;assert.equal(A.SkillSys.manifest(p,e).tier,'advanced');
 const tank=A.SkillSys.entryFor(p,'bulwark');tank.level=1;assert.equal(A.SkillSys.manifest(p,tank).tier,'basic');
 p.equippedSet=null;assert.equal(A.SkillSys.manifest(p,e).tier,'intermediate');
 p.equippedSet='adept';assert.equal(A.SkillSys.manifest(p,e).tier,'intermediate','cheaper armor does not grant the advanced tier');
}
// The early tutorial keeps its quest step, while making the recommended shops usable.
for(const step of ['firstQuest','partyQuest']){
 const {g,p}=fresh();g.tutorial.step=step;
 for(const shop of ['blacksmith','trainer'])assert.equal(A.Tutor.allowed(g,shop),false);
 g.quest.failed=true;g.quest.over=true;A.Game.completeQuest(g);
 for(const shop of ['blacksmith','trainer'])assert.equal(A.Tutor.allowed(g,shop),true);
 assert.equal(A.Tutor.allowed(g,'rel'),false);assert.equal(g.tutorial.step,step);
 const restored=A.Game.load();assert.equal(A.Tutor.allowed(restored,'trainer'),true);
}
console.log('Quest failure advice passed: solo/party death, flee and defeat; party victories; 14 Gate chapters; faction losses; nonquest deaths; save/new life; duplicate prevention; matching armor tiers.');
