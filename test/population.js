'use strict';
const assert = require('assert/strict'), H = require('./harness'), A = H.load(), C = A.DATA.CONST;
let checks = 0;
const ok = (v, message) => { assert.ok(v, message); checks++; };
const make = (seed=477, sex='m') => { A.Save.setBackend(H.memBackend()); return A.Game.newGame({ seed, name:'Population test', sex, personalityId:sex==='f'?'F01':'M01', startingSkills:['mend'] }); };
const residents = w => A.World.population(w);
for (const seed of [2, 477, 20260913]) {
 const g=make(seed), people=residents(g.world);
 ok(people.length===80 && people.filter(c=>c.sex==='f').length===48 && people.filter(c=>c.sex==='m').length===32, '80 ordinary residents at 60% female');
 ok(g.world.characters.length===81, 'the player is additional to the NPC pool');
 ok(new Set(people.map(c=>c.id)).size===80, 'every resident has a unique identity');
 ok(C.ARCHETYPES.every(a=>people.some(c=>c.archetypeInclination.includes(a))), 'starting residents cover every combat role');
 ok(people.every(c=>A.DATA.DIALOGUE[c.personalityId]?.sex===c.sex && c.perks.length+c.actives.length>=3), 'each resident has a valid voice personality and kit');
 ok(A.Game.load().world.populationVersion===C.POPULATION_VERSION, 'new-world expansion marker survives save/load');
}
// Legacy save: keep families, opinions, dead people, gear and story progression.
{
 const start=C.POP_START; C.POP_START={men:8,women:8}; let g;
 try { g=make(); } finally { C.POP_START=start; }
 const w=g.world, p=A.Game.player(g), original=residents(w), woman=original.find(c=>c.sex==='f'), man=original.find(c=>c.sex==='m');
 delete w.populationVersion;
 A.Rel.commit(w, woman.id, man.id); woman.equippedSet='mage';
 const child=A.Character.makeDependent(g.rng,w,woman,man.id); woman.dependents.push(child);woman.childIds.push(child.id);man.childIds.push(child.id);
 A.Rel.move(w,man.id,p.id,-90,'jilt',{set:true,decays:false});
 A.Campaign3.state(g).stage=3;
 const story=A.Character.base({name:'Story extra',campaign:true}), dead=A.Character.base({name:'Old grave',alive:false}), risen=A.Character.base({name:'Risen thrall',isUndead:true});
 w.characters.push(story,dead,risen);
 A.Survival.state(p);
 const records=new Map(w.characters.map(c=>[c.id,JSON.stringify(c)])), edges=JSON.stringify(w.edges), stage=A.Campaign3.state(g).stage;
 A.Save.saveGame(g); const loaded=A.Game.load(), lw=loaded.world;
 ok(residents(lw).length===80, 'legacy saves receive 80 living ordinary NPCs, excluding story cast and thralls');
 ok(residents(lw).filter(c=>c.sex==='f').length===48, 'legacy 8/8 world reaches 48/32 without changing anyone');
 ok([...records].every(([id,record])=>JSON.stringify(A.World.byId(lw,id))===record), 'all existing character, child and equipment records preserved');
 ok(JSON.stringify(lw.edges)===edges && A.Rel.hates(lw,man.id,p.id), 'existing relationships and grudges preserved');
 ok(A.Campaign3.state(loaded).stage===stage, 'campaign progress preserved');
 const additions=residents(lw).filter(c=>!records.has(c.id));
 ok(additions.length===64 && additions.every(c=>!lw.edges.some(e=>e.fromId===c.id||e.toId===c.id)), 'newcomers do not inherit grudges');
 const ids=lw.characters.map(c=>c.id).join();
 ok(A.Game.load().world.characters.map(c=>c.id).join()===ids, 'reloading never duplicates the top-up');
 residents(lw).find(c=>!records.has(c.id)).alive=false; A.Save.saveGame(loaded);
 ok(residents(A.Game.load().world).length===79, 'new deaths do not trigger another 80-NPC migration');
}
{
 const g=make(),w=g.world; delete w.populationVersion;
 for(let i=0;i<7;i++)w.characters.push(A.Character.seedNPC(g.rng,w,{sex:'m'}));
 const ids=w.characters.map(c=>c.id).join(); A.World.upgradePopulation(w,g.rng);
 ok(w.characters.map(c=>c.id).join()===ids, 'already-large worlds are not shrunk or rewritten');
}
// Wealth attracts strangers but does not stop them starting their own families.
{
 const g=make(),w=g.world,p=A.Game.player(g); p.inventory.gold=100000;p.homeId='brick';w.questClock=1;
 A.Courtship.tick(w,g.rng,()=>{},false);
 ok(residents(w).filter(c=>c.partnerId).length>=10, 'a wealthy male player no longer reserves all women');
 ok(residents(w).some(c=>c.sex==='f'&&A.Rel.score(w,c.id,p.id)>=C.REL.FRIENDLY_MIN), 'wealth still provides its established attraction benefit');
 for(let i=0;i<3;i++){w.questClock++;A.Courtship.tick(w,g.rng,()=>{},false);}
 ok(w.pendingProposals.length>0 && w.pendingProposals.every(q=>A.Housing.canTakeSpouse(A.World.byId(w,q.fromId))), 'town marriages do not let unavailable suitors swallow player proposals');
}
{
 const g=make(67,'f'),w=g.world,p=A.Game.player(g),suitor=residents(w).find(c=>c.sex==='m'&&!c.partnerId);p.homeId='brick';
 A.Courtship.recordShared(w,[p.id,suitor.id]);w.questClock=1;A.Courtship.tick(w,g.rng,()=>{},false);
 ok(!suitor.partnerId, 'a companion keeps the opportunity to court the player after their first quest');
 A.Courtship.recordShared(w,[p.id,suitor.id]);w.questClock++;A.Courtship.tick(w,g.rng,()=>{},false);
 ok(w.pendingProposals.some(q=>q.fromId===suitor.id), 'the companion can still propose after two shared quests');
}
// Density control pauses only new ambient births, never maturation or the player's family.
{
 const g=make(),w=g.world,p=A.Game.player(g),people=residents(w).slice(0,50);
 w.characters=[p,...people];w.parties=[];
 for(const c of people){c.partyId=null;c.leaderId=null;c.hospitalizedQuestsLeft=999;}
 const ids=new Set(w.characters.map(c=>c.id));A.World.tick(w,g.rng,{});
 ok(residents(w).length===51,'depleted town adds a newcomer before it falls to six residents');
 const arriving=residents(w).find(c=>!ids.has(c.id));
 ok(arriving && !w.edges.some(e=>e.fromId===arriving.id||e.toId===arriving.id),'population recovery creates a fresh social opportunity without resetting old opinions');
}
{
 const g=make(18),w=g.world,p=A.Game.player(g),mom=residents(w).find(c=>c.sex==='f'),dad=residents(w).find(c=>c.sex==='m');
 A.Rel.commit(w,mom.id,dad.id);mom.relationshipQuests=2;mom.hospitalizedQuestsLeft=999;dad.hospitalizedQuestsLeft=999;
 const child=A.Character.makeDependent(g.rng,w,mom,dad.id);child.age=2;child.name='Growing Child';mom.dependents.push(child);mom.childIds.push(child.id);dad.childIds.push(child.id);
 const high=C.POP_HIGH;C.POP_HIGH=1;
 try {
  let births=0;const born=A.Character.makeDependent;
  A.Character.makeDependent=function(...args){births++;return born.apply(this,args);};
  try { A.World.tick(w,g.rng,{}); } finally { A.Character.makeDependent=born; }
  ok(births===0,'crowded town defers new NPC-only births');
  ok(w.characters.some(c=>c.birthId===child.id&&c.name==='Growing Child'),'already-born children still mature in a crowded town');
  const wife=residents(w).find(c=>c.sex==='f'&&!c.partnerId); A.Rel.commit(w,p.id,wife.id);wife.relationshipQuests=2;wife.hospitalizedQuestsLeft=999;
  A.World.tick(w,g.rng,{});
  ok(wife.dependents.length>0,'the population limit does not suppress the player family');
 } finally { C.POP_HIGH=high; }
}
console.log('population: '+checks+' checks passed');
