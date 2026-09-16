// Golden event traces captured before extracting combat subsystems. This protects
// outcomes and event ordering, independently of their implementation location.
// Rebased 16 Sep 2026 for the approved difficulty step-up in d24f496. Restoring
// only that commit's prior difficulty config reproduced all 24 old hashes;
// see test/reports/censorship/trace-cause.log. No combat rules changed here.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('./harness').load(),rows=[];
for(let seed=1;seed<=24;seed++){
 A.Character.resetIds(1);const rng=new A.RNG(seed*917),arch=A.DATA.CONST.ARCHETYPES[seed%A.DATA.CONST.ARCHETYPES.length];
 const kit=A.DATA.ARCHETYPE_SKILLS[arch];
 const p=A.Character.makePlayer(rng,{name:'Trace',sex:'f',startingSkills:[kit.perk,...kit.actives.slice(0,2)]});
 p.inventory.gold=1000;for(const e of p.perks.concat(p.actives))e.level=12;
 const ally=A.Character.makeEnemy(rng,'field_chaplain',{level:12});
 const foes=['bandit','grave_acolyte','moss_matron'].slice(0,seed%3+1).map(id=>A.Character.makeEnemy(rng,id,{level:12}));
 const st=A.Combat.create([p,ally],foes,{rng});
 for(let step=0;step<350&&!st.over;step++){const turn=A.Combat.currentTurn(st);if(!turn)break;A.Combat.aiTakeTurn(st,turn.unit);A.Combat.advance(st);}
 const trace={events:st.events,winner:st.winner,units:st.units.map(u=>({id:u.uid,hp:u.chp,down:u.downed,statuses:u.statuses}))};
 rows.push({seed,arch,winner:st.winner,events:st.events.length,hash:crypto.createHash('sha256').update(JSON.stringify(trace)).digest('hex')});
}
const file=path.join(__dirname,'fixtures/combat-traces.json');
if(process.argv.includes('--capture')){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(rows,null,2));}
else assert.deepEqual(rows,JSON.parse(fs.readFileSync(file,'utf8')));
console.log('Combat characterization: 24 seeded event traces match.');
