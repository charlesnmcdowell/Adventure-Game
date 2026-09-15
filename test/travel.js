'use strict';
const assert=require('assert/strict'),fs=require('fs'),{load,memBackend,checkScriptOrder}=require('./harness');
const A=load();A.Save.setBackend(memBackend());
const fresh=()=>{A.Save.reset();return A.Game.newGame({seed:801,name:'Rook',sex:'m',personalityId:'M01',startingSkills:['mend']});};
let g=fresh(),p=A.Game.player(g);
const q=(id)=>A.Travel.declare({id:'test-'+id,name:'Journey',travelLocation:id,track:'solo',tier:1,factionAlignment:'neutral',payout:100,enemyLevels:[1,2],encounters:[{enemyTypeIds:['dire_wolf']} ]});
const sea=q('port'),key=A.Travel.key(sea,'outbound');
assert.equal(A.Travel.views(g,key),0);A.Travel.mark(g,key);assert.equal(A.Travel.views(g,key),1);
A.Save.saveGame(g);g=A.Game.load();assert.equal(A.Travel.views(g,key),1,'reload retains history');
g=A.Game.newGame({seed:802,name:'Next life',sex:'m',personalityId:'M01'});assert.equal(A.Travel.views(g,key),1,'reincarnation retains history');
A.Travel.mark(g,key);A.Travel.mark(g,key);assert.equal(A.Travel.views(g,key),2,'counter saturates');
assert.equal(A.Travel.views(g,A.Travel.key(sea,'outbound','new-story')),0,'new event owns history');
g=fresh();p=A.Game.player(g);assert.equal(A.Travel.views(g,key),0,'fresh game resets history');
const oldClock=g.world.questClock;
p.inventory.gold=100;
const quote=A.Travel.quote(g,sea);assert.equal(quote.total,16);assert.equal(quote.days,2);
const fail=A.Game.startQuest(g,sea,{vaultGold:100});assert.equal(fail.ok,false);assert.equal(p.inventory.gold,100,'failed departure is atomic');
assert.equal(A.Game.startQuest(g,sea,{provisions:false}).ok,true);assert.equal(p.inventory.gold,92);
assert.equal(p.combatHp,Math.floor(A.Character.maxHp(p)*.85));
g.quest.over=true;g.quest.readyToComplete=true;
const out=A.Game.completeQuest(g);assert.equal(out.travelReimbursement,8);assert.equal(g.world.questClock,oldClock+2);assert.ok(p.inventory.gold>=200,'net reward preserved');
g=fresh();p=A.Game.player(g);p.inventory.gold=0;
const local=g.board.find(q=>q.localTravel&&q.track==='solo');assert.ok(local);assert.equal(A.Travel.quote(g,local).total,0);assert.equal(A.Game.startQuest(g,local).ok,true,'zero gold local quest works');
assert.equal(A.Travel.dialogue(g,local,'outbound',A.Travel.plan(g,local,'outbound')).length,0,'solo silent');
const inventory=[];
for(let seed=1;seed<=100;seed++){
 const qs=A.Quests.generateBoard(g.world,new A.RNG(seed),g);
 for(const item of qs){assert.ok(A.DATA.TRAVEL_LOCATIONS[item.travelLocation]);assert.ok(item.passageCost<=30);}
 for(const track of ['solo','party'])assert.ok(qs.some(q=>q.localTravel&&q.track===track&&q.distance==='near'&&q.passageCost===0));
}
for(const [fid,qs]of Object.entries(A.DATA.CAMPAIGN_QUESTS))for(const item of qs){const target=A.Travel.declare({...item,factionId:fid,campaign:true});inventory.push({source:fid,quest:item.name,location:target.travelLocation});}
for(const route of A.DATA.GOD_LINE.routes){const target=A.Quests.makeGodQuest(g.world,new A.RNG(1),route);assert.ok(A.DATA.TRAVEL_LOCATIONS[target.travelLocation]);inventory.push({source:'divine',quest:route.name,location:target.travelLocation});}
for(const [pid,per]of Object.entries(A.DATA.DIALOGUE).filter(([pid])=>/^[MF]\d\d$/.test(pid)))for(const loc of Object.keys(A.DATA.TRAVEL_LOCATIONS))assert.ok(per['travel_'+loc],pid+' location coverage');
assert.ok(checkScriptOrder().ok);
const oldRoster=A.Game.partyRoster;
const rival=A.Campaign.makeActor(A.DATA.CAMPAIGN_CHARS.kite);
A.Game.partyRoster=()=>[A.Game.player(g),rival];
const namedQuest=q('maw');
g.meta.travelSeen[A.Travel.key(namedQuest,'outbound')]=2;
const namedPlan=A.Travel.plan(g,namedQuest,'outbound');
assert.equal(namedPlan.event,'companion');assert.equal(namedPlan.skip,false,'unseen companion remains unskippable on a familiar road');
A.Travel.mark(g,namedPlan.key);assert.equal(A.Travel.plan(g,namedQuest,'outbound').skip,true);
A.Game.partyRoster=oldRoster;
const tiny=[];A.Travel.prepareBoard(tiny,g.world,g);assert.equal(tiny.length,2,'legacy empty boards gain local options');
g.meta.travelJourneyCount=10;g.meta.travelLastRare={port:9};
g.meta.travelSeen[A.Travel.key(sea,'outbound')]=2;
for(let i=0;i<100;i++){sea.id='rare-'+i;assert.equal(A.Travel.plan(g,sea,'outbound').event,null,'no consecutive rare events on a two-day sea route');}

function hireRoadTalkers(g, n) {
  const player = A.Game.player(g);
  const party = A.Party.create(g.world, player.id);
  const hired = [];
  for (const c of g.world.characters) {
    if (hired.length >= n) break;
    if (!c.alive || c.isPlayer || c.isUndead || c.isMonster || c.campaign) continue;
    if (!/^[MF]\d\d$/.test(c.personalityId)) continue;
    const held = A.Party.of(g.world, c);
    if (held && held.leaderId === c.id) continue;
    if (held) A.Party.removeMember(g.world, held, c.id);
    party.memberIds.push(c.id);
    party.wages[c.id] = 30;
    c.partyId = party.id;
    c.leaderId = player.id;
    hired.push(c);
  }
  return hired;
}
{
  g = fresh();
  const hired = hireRoadTalkers(g, 4);
  assert.equal(hired.length, 4, 'four companions on the road');
  const player = A.Game.player(g);
  player.partnerId = hired[0].id;
  hired[0].partnerId = player.id;
  const speakers = new Set();
  const ordered = [];
  let partnerOpens = 0;
  for (let i = 0; i < 8; i++) {
    const quest = q('forest');
    quest.id = 'banter-' + i;
    g.world.questClock = i;
    g.meta.travelJourneyCount = i + 1;
    const lines = A.Travel.dialogue(g, quest, 'outbound', { visits: 0 });
    assert.ok(lines.length >= 2, 'two voices on a party walk');
    const ids = lines.map(l => l.speaker.id);
    ids.forEach(id => speakers.add(id));
    ordered.push(ids.join('>'));
    if (lines[0].speaker.id === hired[0].id) partnerOpens++;
  }
  assert.equal(speakers.size, 4, 'every companion gets a travel line');
  assert.ok(partnerOpens < 8, 'the spouse does not open every walk');
  assert.ok(new Set(ordered).size >= 3, 'walks do not keep the same two voices in the same order');
  let samePairRepeat = 0;
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1].split('>').sort().join();
    const cur = ordered[i].split('>').sort().join();
    if (prev === cur) samePairRepeat++;
  }
  assert.ok(samePairRepeat <= 1, 'the same pair is not the default next walk');
}

fs.writeFileSync('tools/travel_inventory.json',JSON.stringify({locations:Object.values(A.DATA.TRAVEL_LOCATIONS),authoredQuests:inventory},null,2));
console.log('Travel: history, succession, costs, zero-gold access, reward preservation, clock and destination coverage passed.');
