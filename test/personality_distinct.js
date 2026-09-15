'use strict';
const assert=require('assert/strict'),H=require('./harness'),A=H.load();
assert.ok(H.checkScriptOrder().ok);
const spoken=t=>t.replace(/\[[^\]]*\]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const owner=new Map();let paths=0,selections=0;
for(const [pid,p]of Object.entries(A.DATA.DIALOGUE)){
 if(!/^[MF]\d\d$/.test(pid))continue;
 for(const [band,lines]of Object.entries(p)){
  if(!Array.isArray(lines)||!lines.every(t=>typeof t==='string'))continue;
  for(const text of lines){
   const key=spoken(text);assert.ok(key,pid+' empty '+band);
   assert.ok(!owner.has(key)||owner.get(key)===pid,`${pid} repeats ${owner.get(key)}: ${text}`);
   owner.set(key,pid);paths++;
  }
  const families=p.replyFamilies&&p.replyFamilies[band];if(!families)continue;
  assert.equal(families.length,lines.length,pid+' '+band+' metadata');
  const speaker={personalityId:pid};
  for(const family of new Set(families.flat())){
   const eligible=lines.map((_,i)=>i).filter(i=>families[i].includes(family));
   speaker.lastVariantUsed={};speaker.dialogueRotation={};
   const seen=new Set();
   for(let j=0;j<eligible.length;j++){
    const line=A.util.speakEx(null,speaker,band,{replyTo:family,rand:(j%7)/7});
    assert.ok(line,pid+' '+band+' missing '+family);
    assert.ok(eligible.includes(line.idx),pid+' left the subject before that family was spent');
    assert.ok(!seen.has(line.idx),pid+' repeated before compatible pool exhausted');
    seen.add(line.idx);selections++;
   }
   const usable=[];
   for(let i=0;i<lines.length;i++){
    const needs=A.util.lineNeeds(lines[i]);
    if(needs.includes('them')||needs.includes('partner'))continue;
    usable.push(i);
   }
   while(seen.size<usable.length){
    const line=A.util.speakEx(null,speaker,band,{replyTo:family,rand:0.4});
    assert.ok(line,pid+' '+band+' went silent with replies left');
    assert.ok(!seen.has(line.idx),pid+' repeated before the rest of the band was spent');
    seen.add(line.idx);selections++;
   }
  }
  assert.equal(A.util.speakEx(null,speaker,band,{replyTo:'unknown-subject'}),null);
 }
 assert.match(p.hatred.join(' '),/fuck|shit|damn|bloody/i,pid+' hostility retained');
 assert.match(p.combat_hatred.join(' '),/fuck|shit|damn|hell|bitch/i,pid+' user combat profanity retained');
 for(const location of Object.values(A.DATA.TRAVEL_LOCATIONS)){
  assert.ok(location.caption,location.id+' location lore');
  assert.ok(p['travel_'+location.id].length,pid+' '+location.id);
 }
}
console.log(`Distinct personality checks passed: ${paths} paths, no shared spoken text across personalities; ${selections} compatible reply selections through four cycles.`);
