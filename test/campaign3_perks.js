'use strict';
const assert=require('assert/strict'),{load,memBackend,checkScriptOrder}=require('./harness');
const A=load(),R=A.GatePerks,G=A.GatePerkCombat,B=A.Combat,I=B._internals;
let passed=0;
function test(name,fn){fn();passed++;console.log('ok '+name);}
function game(){A.Save.setBackend(memBackend());return A.Game.newGame({seed:412,name:'Perk audit',sex:'f'});}
function mk(player,keys=[]){const c=A.Character.base({isPlayer:player,name:player?'Player':'Other',stats:{hp:500,atk:40,def:20,spd:20}});c.perks=keys.map(k=>({skillId:'gate_'+k,level:1,uses:0}));return c;}
function field(keys=[],others=[]){const p=mk(true,keys),e=mk(false),st=B.create([p,...others],[e],{rng:new A.RNG(55)});return {p,e,st,u:st.units[0],t:st.units.find(u=>u.side==='b')};}
function cast(st,u,t,id='basic_attack'){return B.act(st,u,{kind:id==='basic_attack'?'attack':'skill',skillId:id,targetUid:t.uid});}
function give(ch,id){ch.actives.push({skillId:id,level:1,uses:0});}
test('runtime and harness script order agree',()=>assert.ok(checkScriptOrder().ok));
test('thirteen fixed passive rewards never enter ordinary acquisition',()=>{
 const p=mk(true);assert.equal(A.DATA.CAMPAIGN3_PERKS.length,13);
 for(const sk of A.DATA.CAMPAIGN3_PERKS){assert.ok(sk.noSlot&&sk.noTierGrowth&&sk.kind==='perk');assert.ok(!A.DATA.TRAINER_POOL.includes(sk.id));assert.ok(!A.SkillSys.purchasable(p,sk.id,{}));assert.ok(!A.SkillSys.learn(p,sk.id,{allowUnique:true,free:true}).ok);assert.equal(A.SkillSys.witness(p,sk.id,'advanced'),null);}
});
test('first dream waits for resolved choice, grants after reply, not just stage',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=4;R.reconcile(g);assert.equal(R.visible(g),false);
 const opt=A.DATA.CAMPAIGN3_CHOICES.q4_dream.options.find(o=>o.id==='reject');A.Campaign3.applyOption(g,'q4_dream',opt);assert.ok(!R.has(g.player,'cure'));
 A.Campaign3.applyBeat(g,A.Campaign3.replyBeat(opt.reply,'aldric',g,opt,'q4_dream'));assert.ok(R.has(g.player,'cure'));assert.equal(R.state(g).pending.length,1);
 assert.equal(A.SkillSys.slottedCount(g.player,'perk'),0);assert.ok(!A.SkillSys.forget(g.player,'gate_cure').ok);
});
test('all dream branches, optional rescue, city choices, endings and upgrade reconcile',()=>{
 for(const dark of [false,true])for(const city of ['gauntlet','consortium','thieves'])for(const ending of ['hero','monster','mercy','usurper','ascetic']){
  const g=game(),s=A.Campaign3.state(g);s.stage=14;s.ending=ending;s.choices={q4_dream:dark?'embrace':'reject',q7_dream:dark?'embrace':'reject',q10_dream:dark?'embrace':'reject',q10_double:'question',q11_allegiance:city};s.flags={waitedForDorran:true,lysandraBargain:true};R.reconcile(g);
  assert.equal(Object.keys(R.state(g).earned).length,8);assert.equal(R.state(g).earned.gate_unmasker,2);assert.ok(R.has(g.player,dark?'drain':'cure'));assert.ok(R.has(g.player,{gauntlet:'duke',consortium:'contacts',thieves:'routes'}[city]));
 }
});
test('no rescue/recognition reward for failed choice, no guessed dream from heritage',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=10;s.heritage=-3;s.flags={floodedEarly:true,waitedForDorran:true};s.choices.q10_double='strike';R.reconcile(g);assert.ok(!R.has(g.player,'door'));assert.ok(!R.has(g.player,'cure'));assert.equal(R.state(g).earned.gate_unmasker,1);
});
test('old saves backfill and acknowledged notices do not repeat on load',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=7;s.flags.dream1='reject';s.flags.dream2='embrace';A.Save.saveGame(g);
 const loaded=A.Game.load();assert.ok(R.has(loaded.player,'cure'));assert.ok(R.has(loaded.player,'focus'));assert.equal(R.state(loaded).pending.length,3);
 R.acknowledge(loaded,R.state(loaded).pending.slice());assert.equal(R.state(A.Game.load()).pending.length,0);
});
test('replay keeps gifts, replaces branches without duplication, announces replacement',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=4;s.choices.q4_dream='reject';R.reconcile(g);R.acknowledge(g,R.state(g).pending.slice());A.Campaign3.restart(g);R.reconcile(g);assert.ok(R.has(g.player,'cure'));
 const s2=A.Campaign3.state(g);s2.stage=4;s2.choices.q4_dream='embrace';R.reconcile(g);assert.ok(!R.has(g.player,'cure'));assert.ok(R.has(g.player,'drain'));assert.ok(R.state(g).pending[0].replaced);
 R.acknowledge(g,R.state(g).pending.slice());s2.choices.q4_dream='reject';R.reconcile(g);assert.ok(R.state(g).pending[0].replaced);R.reconcile(g);assert.equal(g.player.perks.filter(e=>e.skillId.startsWith('gate_')).length,1);
});
test('cross-life ledger restores gifts; a full reset clears them',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=4;s.choices.q4_dream='reject';R.reconcile(g);R.acknowledge(g,R.state(g).pending.slice());
 const next=A.Game.newGame({seed:413,name:'Next',sex:'m'});assert.ok(R.has(next.player,'cure'));assert.equal(R.state(next).pending.length,0);
 A.Save.reset();const fresh=A.Game.newGame({seed:414,name:'New',sex:'f'});assert.equal(R.visible(fresh),false);assert.ok(!R.has(fresh.player,'cure'));
});
test('nepotism restores perks onto the actual successor without repeating notices',()=>{
 const g=game(),s=A.Campaign3.state(g);s.stage=4;s.choices.q4_dream='reject';R.reconcile(g);R.acknowledge(g,R.state(g).pending.slice());
 const heir=mk(false);heir.name='Successor';g.world.characters.push(heir);g.player.alive=false;g.pendingDeath={route:{mode:'nepotism',heir:{adult:true,ch:heir}}};
 const result=A.Game.continueAfterDeath(g);assert.equal(result.mode,'nepotism');assert.ok(R.has(A.Game.player(g),'cure'));assert.equal(R.state(g).pending.length,0);
});
test('Cure prefers injured companions, limits rounds/charges, never overheals or cleanses',()=>{
 const friend=mk(false),{st,u}=field(['cure'],[friend]),t=st.units[1];t.chp=t.maxHp/2;u.chp=u.maxHp/4;
 G.turn(st,u);assert.equal(t.chp,Math.round(t.maxHp*.56));assert.equal(u.chp,u.maxHp/4);G.turn(st,u);assert.equal(u.gateCureUses,1);
 for(let n=2;n<=5;n++){st.round=n;G.turn(st,u);}assert.equal(u.gateCureUses,3);
 const f=field(['cure']);f.u.chp=f.u.maxHp-1;f.u.statuses.push({kind:'poison',rounds:3});G.turn(f.st,f.u);assert.equal(f.u.chp,f.u.maxHp);assert.equal(f.u.tempHp,0);assert.ok(f.u.statuses.some(s=>s.kind==='poison'));
});
test('Cure obeys Withering and healcut and cannot amplify with Demigod/Devoted',()=>{
 const f=field(['cure']);f.u.chp=f.u.maxHp/2;f.u.statuses.push({kind:'withering'});G.turn(f.st,f.u);assert.ok(!f.u.gateCureUses);
 f.u.statuses=[{kind:'healcut',pct:.5}];f.u.ch.perks.push({skillId:'demigod',level:1,uses:0},{skillId:'devoted',level:25,uses:0});f.st.round++;G.turn(f.st,f.u);assert.equal(f.u.chp,Math.round(f.u.maxHp*.53));assert.equal(f.u.tempHp,0);
});
test('Cure ignores reserves and temporary thralls, no charge when all healthy',()=>{
 const friend=mk(false);friend.isQuestThrall=true;const f=field(['cure'],[friend]);f.st.units[1].chp=1;G.turn(f.st,f.u);assert.ok(!f.u.gateCureUses);f.u.chp=10;f.st.round++;G.turn(f.st,f.u);assert.ok(f.u.chp>10);assert.equal(f.st.units[1].chp,1);
});
test('Drain uses actual HP loss, not overkill, and one multi-hit action cap',()=>{
 const f=field(['drain']);f.u.chp=100;f.t.chp=20;cast(f.st,f.u,f.t);assert.equal(f.u.chp,103);
 const x=field(['drain']);x.u.chp=100;give(x.p,'cleave');x.t.maxHp=x.t.chp=99999;x.p.stats.atk=10000;cast(x.st,x.u,x.t,'cleave');assert.equal(x.u.chp,100+Math.round(x.u.maxHp*.05));const hp=x.u.chp;cast(x.st,x.u,x.t);assert.equal(x.u.chp,hp);
 for(let n=2;n<=5;n++){x.st.round=n;x.st.over=false;cast(x.st,x.u,x.t);}assert.equal(x.u.gateDrainUses,3);
});
test('Drain ignores shields, DOT and reflected damage',()=>{
 const f=field(['drain']);f.u.chp=100;f.t.tempHp=10000;cast(f.st,f.u,f.t);assert.equal(f.u.chp,100);assert.ok(!f.u.gateDrainUses);
 G.beginAction(f.st,f.u);I.applyRawDamage(f.st,f.u,f.t,50,'dot');I.applyRawDamage(f.st,f.u,f.t,50,'reflect');G.finishAction(f.st,f.u);assert.equal(f.u.chp,100);
});
test('Unbowed resists elements and Burning but not physical or prismatic',()=>{
 for(const element of ['fire','ice','lightning','physical','prismatic']){const f=field(['unbowed']);const hp=f.u.chp;I.applyRawDamage(f.st,f.t,f.u,100,'spell',{element,cannotMiss:true});assert.equal(hp-f.u.chp,['fire','ice','lightning'].includes(element)?80:100);}
 const f=field(['unbowed']);const hp=f.u.chp;I.applyRawDamage(f.st,f.t,f.u,100,'dot',{visual:{dotKind:'burn'}});assert.equal(hp-f.u.chp,80);
});
test('Hardiness reduces only Poison damage',()=>{
 for(const kind of ['poison','bleed','burn']){const f=field(['hardiness']),hp=f.u.chp;I.applyRawDamage(f.st,f.t,f.u,100,'dot',{visual:{dotKind:kind}});assert.equal(hp-f.u.chp,kind==='poison'?80:100);}
});
test('Predatory Focus improves first real attack each round, no stacked ignore',()=>{
 const a=field(['focus']),b=field([]);a.t.ch.stats.def=b.t.ch.stats.def=100;a.p.stats.atk=b.p.stats.atk=100;const ha=a.t.chp,hb=b.t.chp;cast(a.st,a.u,a.t);cast(b.st,b.u,b.t);assert.equal((ha-a.t.chp)-(hb-b.t.chp),20);
 const ha2=a.t.chp,hb2=b.t.chp;cast(a.st,a.u,a.t);cast(b.st,b.u,b.t);assert.equal(ha2-a.t.chp,hb2-b.t.chp);
});
test('Unmasker targets Vanish in manual and auto target resolution, leaves ordinary attackers blocked',()=>{
 const f=field(['unmasker']);B.applyUntargetable(f.t);assert.ok(B.validTargets(f.st,f.u,'basic_attack').includes(f.t));assert.ok(B.playerTargets(f.st,f.u,'basic_attack').includes(f.t));assert.ok(cast(f.st,f.u,f.t).ok);
 const x=field();B.applyUntargetable(x.t);assert.equal(B.validTargets(x.st,x.u,'basic_attack').length,0);assert.ok(!cast(x.st,x.u,x.t).ok);
});
test('Unmasker bypasses one guaranteed dodge per round, has 15/25-point evasion cuts',()=>{
 const f=field(['unmasker']);assert.equal(G.evasionCut(f.u),.15);f.u.ch.perks[0].campaignRank=2;assert.equal(G.evasionCut(f.u),.25);
 f.t.evade=2;const hp=f.t.chp;cast(f.st,f.u,f.t);assert.ok(f.t.chp<hp);const hp2=f.t.chp;cast(f.st,f.u,f.t);assert.equal(f.t.chp,hp2);assert.equal(f.t.evade,0);
});
test('Self-Mastery triggers once, survives two rounds, never rescues a lethal hit',()=>{
 const f=field(['mastery']);f.u.chp=f.u.maxHp*.31;I.applyRawDamage(f.st,f.t,f.u,f.u.maxHp*.02,'attack',{cannotMiss:true});assert.equal(f.u.tempHp,Math.round(f.u.maxHp*.15));assert.ok(f.u.gateMastery);G.endRound(f.st);assert.ok(f.u.tempHp>0);f.st.round++;G.endRound(f.st);assert.equal(f.u.tempHp,0);G.turn(f.st,f.u);assert.equal(f.u.tempHp,0);
 const x=field(['mastery']);x.u.chp=10;I.applyRawDamage(x.st,x.t,x.u,20,'attack',{cannotMiss:true});assert.ok(x.u.downed);assert.equal(x.u.tempHp,0);
});
test('Hold the Door expires only its remaining shield, excludes reserves and thralls',()=>{
 const thrall=mk(false);thrall.isQuestThrall=true;const f=field(['door'],[mk(false),thrall]);assert.equal(f.st.units[1].tempHp,Math.round(f.st.units[1].maxHp*.05));assert.equal(f.st.units[2].tempHp,0);
 f.u.tempHp+=20;I.applyRawDamage(f.st,f.t,f.u,10,'attack',{cannotMiss:true});G.endRound(f.st);f.st.round=2;G.endRound(f.st);assert.equal(f.u.tempHp,20);
});
test('Murderous Resolve buffs direct damage only below its threshold',()=>{
 const f=field(['resolve']);f.t.chp=f.t.maxHp*.34;G.beginAction(f.st,f.u);const hp=f.t.chp;I.applyRawDamage(f.st,f.u,f.t,100,'attack',{cannotMiss:true});assert.equal(hp-f.t.chp,112);G.finishAction(f.st,f.u);
 f.t.chp=300;const hp2=f.t.chp;I.applyRawDamage(f.st,f.u,f.t,100,'dot');assert.equal(hp2-f.t.chp,100);
});
test('Duke protects every hit of just the first enemy action; DOT does not consume it',()=>{
 const f=field(['duke']);I.applyRawDamage(f.st,f.t,f.u,10,'dot');assert.equal(f.u.gateDukeAction,undefined);G.beginAction(f.st,f.t);const hp=f.u.chp;I.applyRawDamage(f.st,f.t,f.u,100,'attack',{cannotMiss:true});I.applyRawDamage(f.st,f.t,f.u,100,'attack',{cannotMiss:true});assert.equal(hp-f.u.chp,160);G.finishAction(f.st,f.t);G.beginAction(f.st,f.t);const hp2=f.u.chp;I.applyRawDamage(f.st,f.t,f.u,100,'attack',{cannotMiss:true});assert.equal(hp2-f.u.chp,100);
});
test('Gate Veteran preserves attrition and does not accumulate on export/re-entry',()=>{
 const p=mk(true,['veteran']),base=A.Character.maxHp(p);p.combatHp=base/2;const e=mk(false),st=B.create([p],[e]);assert.equal(st.units[0].maxHp,Math.round(base*1.05));B.exportHp(st);assert.equal(p.combatHp,base/2);const next=B.create([p],[e]);assert.equal(next.units[0].maxHp,st.units[0].maxHp);assert.equal(p.stats.hp,500);
});
test('Contacts pays a capped personal bonus exactly once, without changing loot or wages',()=>{
 for(const field of ['gold','wage']){const g=game();g.player.perks.push({skillId:'gate_contacts',level:1,uses:0});const q={},out={gold:0,wage:0,loot:100,travelReimbursement:300,payroll:80};out[field]=1000;const before=g.player.inventory.gold;R.questBonus(g,q,out);assert.equal(g.player.inventory.gold-before,75);assert.equal(out[field],1075);assert.equal(out.loot,100);assert.equal(out.payroll,80);R.questBonus(g,q,out);assert.equal(out[field],1075);}
});
test('Undervault Routes changes real Flee calculation without removing restrictions',()=>{
 const a=field(['routes']),b=field();a.st.rng.chance=b.st.rng.chance=()=>false;B.act(a.st,a.u,{kind:'flee'});B.act(b.st,b.u,{kind:'flee'});assert.ok(Math.abs(a.st.events.find(e=>e.t==='flee').chance-b.st.events.find(e=>e.t==='flee').chance-.15)<.0001);
 a.u.ch.isConscript=true;assert.equal(B.act(a.st,a.u,{kind:'flee'}).fled,false);
});
test('ordinary NPCs cannot activate player-only campaign effects or inflate threat',()=>{
 const p=mk(true,['cure','door','veteran']);assert.equal(B.threatBaseFor(p),B.threatBaseFor(mk(true)));
 const npc=mk(false,['cure','veteran']);assert.equal(R.has(npc,'cure'),false);
});
console.log(passed+' campaign perk checks passed');
