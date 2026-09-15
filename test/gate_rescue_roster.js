'use strict';
const assert=require('node:assert/strict'),{load,memBackend}=require('./harness');
const A=load(),C=A.Campaign3;
function fresh(n=6,hired=false){
 A.Save.setBackend(memBackend());
 const g=A.Game.newGame({seed:917,name:'Rescue test',sex:'f'}),p=A.Game.player(g);
 p.inventory.gold=5000;Object.assign(C.state(g),{stage:n-1,started:true,recruited:['wren_ward','fennick','vess','selene'],company:['wren_ward','fennick','vess','selene']});
 const extras=[];for(let i=0;i<4;i++){const c=A.Character.base({id:'rescue_hire_'+i,name:'Hire '+i,sex:'m'});g.world.characters.push(c);extras.push(c);}
 const lead=hired?extras[0]:p,party=A.Party.create(g.world,lead.id);
 for(const c of [p,...extras].filter(c=>c!==lead)){party.memberIds.push(c.id);party.wages[c.id]=0;c.partyId=party.id;c.leaderId=lead.id;}
 const quest=C.buildQuest(g,n);assert.equal(A.Game.startQuest(g,quest,{}).ok,true);g.quest.departureShown=true;
 return{g,p,extras,lead,quest};
}
for(const hired of [false,true]){
 const {g,p,quest,lead,extras}=fresh(6,hired);
 // Recruit Kaito through the real rescue option with one story seat available.
 const seats=C.applyOption(g,'q6_faelen',C.options(g,'q6_faelen').find(o=>o.id==='cut'));
 assert.deepEqual(seats.joined,['faelen']);assert.deepEqual(seats.overflow,[]);
 g.quest.encIdx=2;A.Game.currentEncounter(g);
 const roster=A.Game.partyRoster(g),ids=roster.map(c=>c.campaignId).filter(Boolean);
 assert.deepEqual(ids,C.companyIds(g),'all selected story companions survive the company cap');
 assert.equal(roster.length,C.MAX_COMPANY+1);assert.equal(new Set(roster).size,roster.length);
 assert.ok(extras.every(c=>!roster.includes(c)),'regular party waits at home');
 const st=A.Game.startCombat(g,false),hunter=st.units.find(u=>u.ch.campaignId==='faelen');
 assert.ok(hunter&&!hunter.reserved&&!hunter.fled&&!hunter.downed);
 assert.equal(hunter.side,'a');
 assert.equal(st.leaderId,p.id);
 // Preview and actual battle use the same list; the ordinary-party roster is untouched.
 const actual=roster.map(c=>c.id);g.quest=null;
 assert.deepEqual(A.Game.partyRoster(g,quest).map(c=>c.id),actual);
 assert.deepEqual(A.Game.partyRoster(g).map(c=>c.id),A.Party.battleRoster(g.world,A.Game.player(g)).map(c=>c.id));
}
{
 const {g}=fresh();C.recruit(g,'dorran'); // fill the fifth story seat
 const seats=C.applyOption(g,'q6_faelen',C.options(g,'q6_faelen').find(o=>o.id==='cut'));
 assert.deepEqual(seats.overflow,['faelen']);assert.ok(C.isRecruited(g,'faelen'));assert.ok(!C.inCompany(g,'faelen'));
 assert.ok(!C.openerBeats(g,g.quest.quest,2).some(b=>b.who==='faelen'),'benched hunter does not deliver the wyvern line');
 C.replaceCompany(g,'dorran','faelen');
 assert.ok(A.Game.partyRoster(g).some(c=>c.campaignId==='faelen'));
}
for(const route of ['free_first','letters_first']){
 const {g}=fresh(5);g.quest.encIdx=3;A.Game.currentEncounter(g);
 const res=A.Game.tryVerb(g,{verb:'persuade',odds:1,mode:'bypass'});assert.ok(res.success);
 assert.equal(g.quest.readyToComplete,true);
 const queued=g.quest.closingBeats,rescue=queued.find(b=>b.choice==='q5_rescue');assert.ok(rescue);
 assert.deepEqual(rescue.lines,[],'rescue prompt is silent, with existing Cal voice on the reply');
 assert.ok(!queued.some(b=>b.key==='q5_letters'),'letters play only as the rescue reply');
 C.queueClosing(g);assert.equal(g.quest.closingBeats,queued,'conclusion queued once');
 const opt=C.options(g,'q5_rescue').find(o=>o.id===route);C.applyOption(g,'q5_rescue',opt);
 assert.ok(C.flag(g,'caelFreed')&&C.flag(g,'lettersRecovered'));
 const reply=C.replyBeat(opt.reply,'cael',g,opt,'q5_rescue');assert.equal(reply.key,'q5_letters');
 assert.ok(reply.caption.includes('escort him back to the Wardens'));
 assert.ok(!C.isRecruited(g,'cael'),'Cal is the rescued contact; Kaito is the recruitable hunter');
}
{
 const {g}=fresh(5);g.quest.encIdx=3;C.bypassEncounter(g);
 assert.ok(g.quest.closingBeats.some(b=>b.choice==='q5_rescue'));
}
for(const fail of ['failed','fled','playerDead']){
 const {g}=fresh(5);g.quest.readyToComplete=true;g.quest[fail]=true;C.queueClosing(g);
 assert.ok(!g.quest.closingBeats,'no rescue after '+fail);
}
// Every Gate quest gets its closing beats after a successful last-encounter verb.
for(let n=1;n<=14;n++){
 const {g}=fresh(n);g.quest.encIdx=g.quest.quest.encounters.length-1;A.Game.currentEncounter(g);
 A.Game.tryVerb(g,{verb:'persuade',odds:1,mode:'bypass'});
 assert.ok(g.quest.__c3closed,'Q'+n+' closes after a bypass');
 assert.deepEqual(g.quest.closingBeats,C.closingBeats(g,g.quest.quest));
}
console.log('Gate rescue/roster passed: outside parties excluded, player leadership, Kaito rescue and bench choice, departure preview, both Cal rescue orders, final bypass on all 14 quests, failure guards.');
