'use strict';
const assert=require('node:assert/strict'),{load,memBackend}=require('./harness');
const A=load(),C=A.Campaign3,D=A.DATA;
function fresh(){
 A.Save.setBackend(memBackend());const g=A.Game.newGame({seed:874,name:'Ward',sex:'f'});
 A.Game.player(g).inventory.gold=5000;Object.assign(C.state(g),{stage:9,started:true});
 const q=C.buildQuest(g,10);assert.ok(A.Game.startQuest(g,q,{}).ok);g.quest.encIdx=1;
 return g;
}
function checkAfter(g,killed){
 const beats=C.openerBeats(g,g.quest.quest,2),keys=beats.map(b=>b.who+':'+b.key);
 assert.equal(keys.includes('sarn:q10_murder'),!killed);
 assert.equal(beats.some(b=>b.death&&b.who==='maddox'),!killed,'no second murder on the player-kill route');
 const arrest=keys.indexOf('hadrian:'+(killed?'q10_arrest':'q10_arrest_spared'));
 assert.ok(arrest>=0);assert.equal(beats.filter(b=>b.who==='hadrian').length,1);
 assert.ok(keys.indexOf('sarn:q10_accuse')<arrest,'accusation precedes custody');
 const prison=beats.findIndex(b=>b.artPrison),letter=keys.indexOf('aldric:q10_letter'),escape=keys.indexOf('ambrose:q10_escape');
 assert.ok(prison>arrest&&letter>prison&&escape>letter,'arrest, cell, letter, escape in order');
 assert.ok(escape<keys.indexOf('grell:q10_catacombs'),'escape before catacomb ambush');
 const arrival=C.arrivalBeats(g,10);assert.ok(arrival.findIndex(b=>b.who==='korvath'&&b.key==='q10_unmasked')<arrival.findIndex(b=>b.key==='q10_dream'));
 C.applyBeat(g,arrival.find(b=>b.who==='korvath'&&b.key==='q10_unmasked'));assert.ok(C.flag(g,'sarnUnmasked'));
}
for(const id of ['kill','talk','arrest']){
 const g=fresh();C.applyOption(g,'q10_summit',C.options(g,'q10_summit').find(o=>o.id===id));checkAfter(g,id==='kill');
 assert.equal(C.flag(g,'leadersKilled'),id==='kill');assert.equal(C.flag(g,'leadersSpared'),id!=='kill');
}
{
 const g=fresh();C.applyOption(g,'q10_summit',C.options(g,'q10_summit').find(o=>o.id==='kill'));
 A.Game.currentEncounter(g);const r=A.Game.tryVerb(g,{verb:'persuade',odds:1,mode:'bypass'});
 assert.ok(r.success);assert.equal(g.quest.encIdx,2);
 assert.ok(!C.flag(g,'leadersKilled')&&C.flag(g,'leadersSpared'));
 const saved=A.Save.loadMeta().c3.flags;assert.equal(saved.leadersKilled,false);assert.equal(saved.leadersSpared,true);
 checkAfter(g,false);
}
// A failed attempt's flags must not override the next decision.
for(const prior of ['kill','arrest']){
 const g=fresh();C.applyOption(g,'q10_summit',C.options(g,'q10_summit').find(o=>o.id===prior));
 g.quest.encIdx=1;const next=prior==='kill'?'arrest':'kill';C.applyOption(g,'q10_summit',C.options(g,'q10_summit').find(o=>o.id===next));
 checkAfter(g,next==='kill');assert.equal(C.flag(g,'leadersArrested'),next==='arrest');
}
checkAfter(fresh(),false); // Old state with no summit flags still has a complete scene.
for(const outcome of ['lysandraBargain','lysandraArrested','lysandraDead']){
 const g=fresh(),s=C.state(g);s.company=[];s.recruited=[];s.flags[outcome]=true;
 for(const [n,key,who]of [[4,'q4_dream','aldric'],[7,'q7_dream','aldric'],[8,'q8_duke_work','halvard'],[10,'q10_dream','aldric']]){
  assert.ok(C.arrivalBeats(g,n).some(b=>b.key===key&&b.who===who),'lore remains mandatory without companions or Folake');
  const lines=D.CAMPAIGN3_DIALOGUE.gate[who][key].map(l=>l.t).join(' ');
  if(n===4||n===7){assert.match(lines,/god of murder/);assert.match(lines,/You are one of/);assert.match(lines,/throne/);}
  if(n===10){assert.match(lines,/other children and take their power/);assert.match(lines,/war as an offering/);}
 }
 assert.ok(C.departureBeats(g,{n:9}).some(b=>b.who==='sarn'&&b.key==='q9_tower'));checkAfter(g,false);
}
console.log('Gate conspiracy flow passed: hostile, mercy, arrest, generic bypass, retry, old-state fallback; mandatory lore, civilian introduction, staged murder, custody, escape and reveal.');
