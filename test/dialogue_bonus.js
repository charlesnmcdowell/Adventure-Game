'use strict';
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const H=require('./harness'),A=H.load();
assert.ok(H.checkScriptOrder().ok);
const manifest=JSON.parse(fs.readFileSync('tools/voice_manifest.json'));
const casting=JSON.parse(fs.readFileSync('tools/voice_casting.json'));
for(const e of manifest.entries)assert.equal(e.voice,casting[e.speaker],'Existing casting remains fixed: '+e.path);
let statements=0,responses=0;
for(const [id,row]of Object.entries(A.DATA.CONVERSATION_BONUS_ROWS)){
 const groups=row.map(s=>s.split('|'));
 assert.equal(groups[0].length,5,id+' statement count');
 assert.equal(groups.slice(1).flat().length,20,id+' response count');
 statements+=groups[0].length;responses+=groups.slice(1).flat().length;
 const p=A.DATA.DIALOGUE[id];
 assert.match(p.hatred.at(-1),/fuck|shit|damn/i,id+' keeps coarse hostility');
 for(const [band,ls]of Object.entries(p)){
  if(!Array.isArray(ls)||!ls.every(x=>typeof x==='string'))continue;
  const families=p.replyFamilies[band];
  if(families)assert.equal(families.length,ls.length,id+' '+band+' metadata');
  const contexts=families?[...new Set(families.flat())]:[null];
  for(const family of contexts){
   const eligible=ls.map((_,i)=>i).filter(i=>!family||families[i].includes(family));
   const ch={personalityId:id,lastVariantUsed:{},dialogueRotation:{}};
   const first=[];
   for(let j=0;j<eligible.length;j++){
    const r=A.util.speakEx(null,ch,band,{replyTo:family,rand:0});
    assert.ok(eligible.includes(r.idx),id+' left the subject before that family was spent');
    assert.ok(!first.includes(r.idx),id+' '+band+' repeats before the family is spent');
    if(first.length)assert.notEqual(r.idx,first.at(-1),id+' repeats back to back');
    first.push(r.idx);
   }
   const usable=ls.map((_,i)=>i);
   const extra=[];
   for(let j=eligible.length;j<usable.length;j++){
    const r=A.util.speakEx(null,ch,band,{replyTo:family,rand:0});
    assert.ok(!first.includes(r.idx)&&!extra.includes(r.idx),id+' repeated before other responses were used');
    extra.push(r.idx);
   }
   if(usable.length>1){
    const again=A.util.speakEx(null,ch,band,{replyTo:family,rand:0});
    assert.notEqual(again.idx,(extra.at(-1)??first.at(-1)),id+' repeats after the band wraps');
   }
  }
 }
}
assert.equal(statements,300);assert.equal(responses,1200);
A.Save.setBackend(H.memBackend());
const g=A.Game.newGame({seed:203,sex:'m',name:'Rook',personalityId:'M15',startingSkills:['mend']});
const p=A.Game.player(g);
const first=A.util.speakEx(g.world,p,'general_response',{replyTo:'contact',rand:0});
A.Save.saveGame(g);
const loaded=A.Save.loadGame(),lp=A.World.byId(loaded.world,p.id);
assert.deepEqual(lp.dialogueRotation,p.dialogueRotation);
const second=A.util.speakEx(loaded.world,lp,'general_response',{replyTo:'contact',rand:0});
assert.notEqual(first.idx,second.idx,'Reload does not reset rotation');
const slot=lp.dialogueRotation.general_response;slot.signature='old revision';slot.used=[999];
assert.ok(A.util.speakEx(loaded.world,lp,'general_response',{replyTo:'contact',rand:0}));
assert.ok(!slot.used.includes(undefined));
console.log('Bonus dialogue checks passed: 60 personalities, 300 bonus statements and 1200 bonus responses retained, fixed casting, compatible rotation, save persistence and revision migration.');
