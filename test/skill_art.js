'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('./harness').load();require('../js/ui/skill_art_catalog');
const C=A.SkillArtCatalog,all=Object.values(A.DATA.SKILLS),before=JSON.stringify(A.DATA.SKILLS);
assert.deepEqual(C.missing(),[]);
for(const d of all)for(const tier of ['basic','intermediate','advanced']){
 const p=C.describe(d.id,tier);assert.ok(p&&p.palette.length===4,d.id+' missing artwork');
 assert.equal(p.definition.target,d.tiers?.[tier]?.target||d.target,d.id+' changed targeting');
 assert.equal(p.passive,d.kind==='perk');
}
assert.equal(C.describe('venom_fang').motion,'thrust','Venom Fang is a blade, not a jaw');
assert.equal(C.describe('volley_fire').motion,'command','Volley Fire buffs the party');
assert.equal(C.describe('frost_touch','advanced').motion,'storm','Blizzard needs falling ice');
assert.equal(C.describe('aimed_shot','advanced').motion,'volley');
assert.equal(C.describe('spark','advanced').motion,'descent');
assert.equal(C.describe('cleave','advanced').motion,'whirlwind');
assert.notEqual(C.describe('prismatic_bolt').family,C.describe('frost_touch').family);
assert.notEqual(C.describe('arcane_cascade').motion,C.describe('fire_bolt').motion);
const hostile={src:{u:{side:'a'}},tgt:{u:{side:'b'}}};
for(const id of ['mend','triage','regenerate']){
 assert.ok(C.describe(id,'advanced',hostile).offensive,id+' hostile use needs offensive artwork');
 assert.equal(C.describe(id,'advanced',hostile).family,C.describe(id,'advanced',{offensive:true}).family);
 assert.ok(!C.describe(id,'advanced',{src:{u:{side:'a'}},tgt:{u:{side:'a'}}}).offensive);
}
assert.equal(C.describe('basic_attack','basic',{src:{u:{form:'panther'}}}).motion,'claw');
assert.equal(C.describe('basic_attack','basic',{src:{u:{form:'serpent'}}}).motion,'bite');
assert.equal(C.describe('not_a_skill'),null);
assert.equal(JSON.stringify(A.DATA.SKILLS),before,'Presentation changed authored mechanics');

// The final tick must retain its effect after the combat engine removes the status.
const pc=A.Character.base({stats:{hp:20000,atk:12,def:10,spd:30}});pc.actives=[{skillId:'venom_fang',level:1,uses:0}];
const foe=A.Character.makeEnemy(new A.RNG(3),'bandit',{level:1});
const st=A.Combat.create([pc],[foe],{rng:new A.RNG(5)}),src=st.units.find(u=>u.ch===pc),tgt=st.units.find(u=>u.ch===foe);
tgt.maxHp=1000;tgt.chp=100000;tgt.evade=0;A.Combat.currentTurn(st);A.Combat.act(st,src,{kind:'skill',skillId:'venom_fang',targetUid:tgt.uid});
const n=st.events.length;for(let i=0;i<10;i++){st.turnIdx=st.turnQueue.length;A.Combat.currentTurn(st);}
const ticks=st.events.slice(n).filter(e=>e.t==='damage'&&e.tag==='dot'&&e.uid===tgt.uid);
assert.ok(ticks.length>0);assert.ok(!tgt.statuses.some(s=>['poison','bleed'].includes(s.kind)));
assert.ok(ticks.every(e=>['poison','bleed'].includes(e.visual?.dotKind)),'Expired DOT lost its artwork');

const pc2=A.Character.base({stats:{hp:20000,atk:12,def:10,spd:30}});pc2.actives=[{skillId:'powder_keg',level:1,uses:0}];
const foe2=A.Character.makeEnemy(new A.RNG(2),'bandit',{level:1}),st2=A.Combat.create([pc2],[foe2],{rng:new A.RNG(6)});
const s2=st2.units.find(u=>u.ch===pc2),t2=st2.units.find(u=>u.ch===foe2);t2.chp=100000;t2.maxHp=1000;t2.evade=0;A.Combat.currentTurn(st2);
A.Combat.act(st2,s2,{kind:'skill',skillId:'powder_keg',targetUid:t2.uid});
assert.equal(st2.hazards[0]?.skillId,'powder_keg');
for(let i=0;i<5;i++){st2.turnIdx=st2.turnQueue.length;A.Combat.currentTurn(st2);}
assert.ok(st2.events.some(e=>e.t==='damage'&&e.visual?.skillId==='powder_keg'),'Keg impact lost its source');

// Recorded audio remains separate from the drawing catalog; never regenerate it here.
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
assert.ok(html.indexOf('js/ui/skill_art_catalog.js')<html.indexOf('js/ui/skill_art.js'));
assert.ok(html.indexOf('js/ui/skill_art.js')<html.indexOf('js/ui/scene_combat.js'));
console.log('Skill art: '+all.length+' skills, all tiers, hostile heals, creature attacks, final DOTs and hazard provenance passed.');
