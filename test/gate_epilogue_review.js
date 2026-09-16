'use strict';
const assert=require('node:assert/strict');
const A=require('./harness').load(),C=A.Campaign3,D=A.DATA,E=D.CAMPAIGN3_EPILOGUE;
const recorded=new Set(D.GATE_EPILOGUE_VO.entries.map(row=>row.text));
function fresh(ending='restored'){
 const g=A.Game.newGame({seed:160914,name:'Ending review',sex:'f'}),s=C.state(g);
 Object.assign(s,{stage:14,started:true,ending,allegiance:'gauntlet',recruited:[],dead:[],gone:[],romance:null});
 return[g,s];
}
for(const ending of ['restored','ascended']){
 const[g,s]=fresh(ending);s.recruited=['wren_ward','amara'];
 const paragraphs=C.epilogue(g);
 assert.equal(paragraphs[0],E.ending[ending]);
 assert.equal(paragraphs[1],E.finale.cityAftermath);
 assert(!paragraphs.includes(E.ending[ending==='restored'?'ascended':'restored']));
 assert(!paragraphs.some(p=>Object.values(E.companion.wren_ward).includes(p)||Object.values(E.heritage).includes(p)));
 assert(paragraphs.includes(E.finale.amaraMourning));
 assert(!paragraphs.includes(E.companion.amara.present),'no prison visits to a dead Kolade');
 paragraphs.forEach(p=>assert(recorded.has(p)));
}
for(const ending of ['hero','monster','usurper','ascetic','mercy']){
 const[g,s]=fresh(ending);s.recruited=['amara'];
 const paragraphs=C.epilogue(g);
 assert(paragraphs.includes(ending==='mercy'?E.companion.amara.present:ending==='ascetic'?E.finale.amaraWaiting:E.finale.amaraMourning));
}
for(const[id,flag,special]of [['ilvara','ilvaraSold','laylaSold'],['faelen','faelenLeft','kaitoAbandoned'],['durnik','durnikLeft','daiAbandoned']]){
 const[g,s]=fresh();s.recruited=[id];s.gone=[id];
 assert(C.epilogue(g).includes(E.companion[id].gone));
 assert(!C.epilogue(g).includes(E.outcome[special]));
 s.flags[flag]=true;s.recruited=[];
 assert(C.epilogue(g).includes(E.outcome[special]));
 s.dead=[id];assert(!C.epilogue(g).includes(E.outcome[special]),'known death takes priority over departure');
}
{
 const[g,s]=fresh();s.recruited=['dorran'];s.dead=['dorran'];
 assert(C.epilogue(g).includes(E.companion.dorran.dead));
 s.flags.floodedEarly=true;
 assert(C.epilogue(g).includes(E.outcome.beauDrowned));
 assert(!C.epilogue(g).includes(E.companion.dorran.dead));
}
for(const[first,second]of [['vess','fennick'],['bramm','ysolde']]){
 const[g,s]=fresh();s.recruited=[first,second];s.dead=[second];
 const paragraphs=C.epilogue(g);
 assert(paragraphs.includes(E.companion[first].present));
 assert(!paragraphs.includes(E.companion[second].present));
 assert(!E.companion[first].present.includes(D.CAMPAIGN_CHARS[second].name),'one survivor does not imply both survived');
 s.dead=[first];
 assert(C.epilogue(g).includes(E.companion[second].present),'second companion has an independent conclusion');
}
for(const value of Object.values(E.outcome))assert(recorded.has(value));
{
 const[g,s]=fresh();s.recruited=['wren_ward','durnik'];s.gone=['durnik'];
 s.flags={dukeDead:true};s.choices.q7_flood='wait';
 const obsolete=D.GATE_EPILOGUE_VO.legacyText.find(p=>p.includes('Your learned skills, campaign gifts'));
 assert(obsolete,'previous restored paragraph is recognized for migration');
 s.epilogue=[obsolete,'A custom ending note.'];
 C.state(g); // Apply the existing romance-text migration before isolating this one.
 const snapshot=()=>{const copy=structuredClone(s);delete copy.epilogue;delete copy.epilogueRevision;return JSON.stringify(copy);};
 const prior=snapshot(),player=JSON.stringify(A.Game.player(g));
 const paragraphs=C.endCardParagraphs(g);
 assert(paragraphs.includes(E.ending.restored));assert(!paragraphs.includes(obsolete));
 assert(paragraphs.includes('A custom ending note.'));
 assert(paragraphs.includes(E.dukes.one));assert(paragraphs.includes(E.companion.durnik.gone));
 assert.equal(snapshot(),prior,'migration preserves progression, ending, choices and relationships');
 assert.equal(JSON.stringify(A.Game.player(g)),player,'no reward, skill or inventory changes');
 assert.deepEqual(C.endCardParagraphs(g),paragraphs,'repeated display is idempotent');
 assert(A.Save.saveGame(g).ok);const loaded=A.Game.load();
 assert.deepEqual(C.endCardParagraphs(loaded),paragraphs,'updated ending survives save/reload');
}
console.log('Epilogue review: actual outcomes, independent companion fates, exact narration and completed-save migration passed.');
