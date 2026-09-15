'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='tools/skill_art/review';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),report=[];
try{for(const mode of ['webgl','canvas']){
 const p=await b.newPage({viewport:{width:1920,height:1080}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 if(mode==='canvas')await p.route('**/index.html*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('type: Phaser.AUTO','type: Phaser.CANVAS')});});
 await p.goto('http://127.0.0.1:8734/index.html');await p.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField,{timeout:120000});
 await p.evaluate(()=>{ADV.Music.muted=true;__game.scene.getScene('Title').pwField.destroy();__game.scene.stop('Title');__game.scene.start('Creation',{password:''});});
 await p.waitForFunction(()=>__game.scene.getScene('Creation').cards?.length>0);await p.evaluate(()=>__game.scene.getScene('Creation').buildPhase2());
 const creation=await p.evaluate(()=>{const s=__game.scene.getScene('Creation');if(!s.skillButtons.every(b=>b.icon?.texture?.key.startsWith('skill_art_')))throw Error('Creation icon missing');for(const b of s.skillButtons){const list=s.skillScroll.container.list;if(list.indexOf(b.icon)<list.indexOf(b.g))throw Error('Icon below panel');if(b.txt.x+b.txt.displayWidth>b.tag.x-b.tag.width+4)throw Error('Creation title overlaps category');}return s.skillButtons.length;});
 await p.screenshot({path:out+'/'+mode+'-creation.png'});
 await p.evaluate(()=>{const A=ADV;__game.scene.stop('Creation');const g=A.Game.newGame({seed:977,name:'Skill QA',sex:'f',portraitSlot:2,personalityId:'F01',startingSkills:['fire_bolt','mend','cleave']});g.__artPreview=true;g.tutorial={step:'done'};g.meta.promptsSeen=Object.fromEntries(Object.keys(A.DATA.PROMPTS).map(k=>[k,true]));const pc=A.Game.player(g);pc.inventory.gold=5000;__game.registry.set('game',g);A.Tutor.maybe=()=>{};__game.scene.start('Town');});
 await p.waitForFunction(()=>__game.scene.isActive('Town')&&__game.scene.getScene('Town').game_);await p.evaluate(()=>{const s=__game.scene.getScene('Town');ADV.Tutor.clear(s);s.openPanel('trainer');});
 await p.waitForTimeout(120);await p.screenshot({path:out+'/'+mode+'-trainer.png'});
 await p.evaluate(()=>{const s=__game.scene.getScene('Town');s.openPanel('journal');});await p.waitForTimeout(70);
 await p.evaluate(()=>{
  const A=ADV,g=__game.registry.get('game'),pc=A.Game.player(g);__game.scene.stop('Town');
  pc.actives=['fire_bolt','cleave','mend','frost_touch','spark','dual_swords','guardian_ward','blood_pact','beast_shape'].map(id=>({skillId:id,level:90,uses:0}));pc.stats={hp:10000,atk:40,def:30,spd:200};pc.homeId='brick';pc.meal={id:'bread'};
  const friend=A.Character.base({name:'Ally',sex:'m',stats:{hp:10000,atk:20,def:30,spd:20}}),foe=A.Character.makeEnemy(new A.RNG(44),'dire_wolf',{level:1});foe.stats={hp:10000,atk:20,def:30,spd:20};
  const st=A.Combat.create([pc,friend],[foe],{rng:new A.RNG(71)});g.ambushCombat={st};__game.scene.getScene('Combat').loop=()=>{};__game.scene.start('Combat',{mode:'ambush'});
 });await p.waitForFunction(()=>__game.scene.getScene('Combat').unitViews?.size===3&&__game.scene.isActive('Combat'));
 const bar=await p.evaluate(()=>{const s=__game.scene.getScene('Combat'),u=s.st().units.find(u=>u.ch.isPlayer);s.showActionBar(u);const z=s.actionObjs.find(o=>o.type==='Text'&&o.text==='Flee');if(!z||z.parentContainer)throw Error('Flee is not pinned');const area=s.skillBarScroll;if(area.maxOffset()<=0)throw Error('Loadout not scrollable');area.setOffset(area.maxOffset());const count=area.container.list.filter(o=>o.type==='Image').length;area.setOffset(0);return{icons:count,overflow:area.maxOffset(),pinnedFlee:true};});
 await p.screenshot({path:out+'/'+mode+'-combat-bar.png'});
 const routing=await p.evaluate(()=>{
  const A=ADV,s=__game.scene.getScene('Combat'),src=s.st().units.find(u=>u.ch.isPlayer),enemy=s.st().units.find(u=>u.side==='b'),ally=s.st().units.find(u=>u.side==='a'&&!u.ch.isPlayer),calls=[];
  const play=A.SkillArt.play,outcome=A.SkillArt.outcome;A.SkillArt.play=(sc,ctx)=>{calls.push(['cast',ctx.skillId]);return play(sc,ctx);};A.SkillArt.outcome=(sc,v,id,tier,phase,ctx)=>{calls.push([phase,id]);return outcome(sc,v,id,tier,phase,ctx);};
  for(const id of ['basic_attack','cleave','fire_bolt','frost_touch','spark','poison_spray','mend','blood_pact','shuriken_fan','iron_fan_guard','volley_fire']){
   const d=A.SkillArt.describe(id,'advanced').definition,target=d.target==='self'?src:['party','ally','allyLane'].includes(d.target)?ally:enemy;
   s.animateEvent({t:'use',uid:src.uid,target:target.uid,skillId:id,tier:'advanced',name:d.name});
   for(let i=0;i<14;i++)A.SkillArt.sample(s,40);
   if(target.side!==src.side){s.animateEvent({t:'damage',uid:target.uid,by:src.uid,dmg:12,tag:'attack'});s.animateEvent({t:'evade',uid:target.uid,by:src.uid});s.animateEvent({t:'ward',uid:target.uid,by:src.uid});}
   A.SkillArt.clear(s);
  }
  A.SkillArt.play=play;A.SkillArt.outcome=outcome;
  if(calls.filter(c=>c[0]==='cast').length!==11)throw Error('A use event bypassed the new renderer');
  const v=s.view(src.uid);for(const status of ['burn','poison','frozen','ward']){v.u.statuses=[{kind:status}];s.redrawUnit(v);}v.u.statuses=[];s.redrawUnit(v);
  const before=s.input.listenerCount('wheel'),shutdown=s.events.listenerCount('shutdown');for(let i=0;i<12;i++)s.showActionBar(src);const after=s.input.listenerCount('wheel');if(before!==after||shutdown!==s.events.listenerCount('shutdown'))throw Error('Action bar leaked input/shutdown listeners');
  return{casts:11,outcomes:calls.filter(c=>c[0]!=='cast').length,scrollListenersStable:true};
 });
 const attackPoint=await p.evaluate(()=>{const s=__game.scene.getScene('Combat'),area=s.skillBarScroll;area.setOffset(area.maxOffset());const label=area.container.list.find(o=>o.type==='Text'&&o.text==='Attack');if(!label)throw Error('No Attack control');return{x:label.x-area.offset(),y:label.y};});
 const bounds=await p.locator('canvas').first().boundingBox();await p.mouse.click(bounds.x+attackPoint.x*bounds.width/1280,bounds.y+attackPoint.y*bounds.height/760);
 await p.waitForFunction(()=>__game.scene.getScene('Combat').targeting?.action?.skillId==='basic_attack');
 routing.scrolledAttackClickable=true;
 await p.evaluate(()=>{const s=__game.scene.getScene('Combat');s.showActionBar(s.st().units.find(u=>u.ch.isPlayer));});
 await p.setViewportSize({width:2560,height:1440});await p.evaluate(()=>window.__refit());await p.waitForTimeout(60);await p.screenshot({path:out+'/'+mode+'-combat-1440p.png'});
 await p.evaluate(()=>__game.scene.stop('Combat'));await p.waitForTimeout(100);assert.deepEqual(errors,[]);report.push({mode,creation,...bar,routing,viewports:[[1920,1080],[2560,1440]],errors});await p.close();
}}finally{await b.close();fs.writeFileSync(out+'/flow-results.json',JSON.stringify(report,null,2));}console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
