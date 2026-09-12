const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const OUT=__dirname;fs.mkdirSync(path.join(OUT,'raw'),{recursive:true});fs.mkdirSync(path.join(OUT,'review'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const ctx=await browser.newContext({viewport:{width:1920,height:1140},recordVideo:{dir:path.join(OUT,'raw'),size:{width:1920,height:1140}}});
 const t0=performance.now(),page=await ctx.newPage(),marks=[],errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.log('PAGEERROR',e.message)});
 const ev=fn=>page.evaluate(fn),wait=ms=>page.waitForTimeout(ms);
 const start=name=>{const m={name,start:(performance.now()-t0)/1000};marks.push(m);console.log('START',name,m.start.toFixed(2));return m;};
 const end=async m=>{m.duration=(performance.now()-t0)/1000-m.start;await page.screenshot({path:path.join(OUT,'review',m.name+'.png')});fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify({marks,errors},null,2));};
 const click=async(x,y)=>{const r=await page.locator('canvas').first().boundingBox();await page.mouse.move(r.x+x*r.width/1280,r.y+y*r.height/760,{steps:8});await page.mouse.click(r.x+x*r.width/1280,r.y+y*r.height/760);};
 const revealText=async(text)=>{
  await page.evaluate(text=>{const s=__game.scene.getScenes(true).at(-1),all=s.children.list.flatMap(function flat(o){return [o,...(o.list||[]).flatMap(flat)]});const o=all.find(o=>typeof o.text==='string'&&o.text.startsWith(text));if(!o)throw Error('Missing button: '+text);const area=s.panelScrolls?.find(a=>a.container===o.parentContainer);area?.show(o,30);},text);await wait(100);
 };
 const clickText=async(text)=>{
  await revealText(text);
  const pt=await page.evaluate(text=>{const s=__game.scene.getScenes(true).at(-1),all=s.children.list.flatMap(function flat(o){return [o,...(o.list||[]).flatMap(flat)]});const o=all.find(o=>typeof o.text==='string'&&o.text.startsWith(text));const b=o.getBounds();return{x:b.centerX,y:b.centerY};},text);await click(pt.x,pt.y);
  await wait(100);const r=await page.locator('canvas').first().boundingBox();await page.mouse.move(r.x+r.width*.92,r.y+r.height*.085,{steps:10});await ev(()=>ADV.Tooltip?.hide());
 };
 try{
  await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField,{timeout:90000});
  await ev(()=>{
   ADV.Music.muted=true;ADV.Music.stopVoice();ADV.Prefs.set({artMotion:true,pauseEnemy:true,textScale:1});
   ADV.Narrator.town=()=>{};ADV.Tutor.maybe=()=>{};ADV.Tutor.town=()=>{};
   __game.scene.getScene('Title').pwField.destroy();__game.scene.stop('Title');__game.scene.start('Creation',{password:''});
   window.AdCapture={evidence:{purchases:[]}};
   // Record the real pointer position and clicks, which Chromium's video omits.
   const cursor=document.createElement('div');Object.assign(cursor.style,{position:'fixed',width:'12px',height:'12px',border:'2px solid white',background:'#d8b76f',borderRadius:'50%',pointerEvents:'none',zIndex:2147483647,opacity:0});document.body.append(cursor);
   document.addEventListener('pointermove',e=>{Object.assign(cursor.style,{left:(e.clientX-6)+'px',top:(e.clientY-6)+'px',opacity:1});});
   document.addEventListener('pointerdown',()=>cursor.animate([{transform:'scale(1)'},{transform:'scale(2.5)',opacity:.3},{transform:'scale(1)',opacity:1}],{duration:300}));
   AdCapture.cursor=cursor;
  });
  await page.waitForFunction(()=>__game.scene.getScene('Creation').cards?.length);await ev(()=>ADV.Tutor.clear(__game.scene.getScene('Creation')));await wait(400);
  await ev(()=>{const s=__game.scene.getScene('Creation');Object.assign(s.sel,{sex:'f',slot:3,appearance:{head:6,eyeType:0,mouthType:1,iris:'#8b663b',lipColor:'#795651'}});s.refresh();ADV.AnimeCustomization.open(s,s.sel,()=>s.refresh());});await wait(350);
  let m=start('appearance');await wait(2200);await end(m);await clickText('Keep this appearance');await wait(350);
  m=start('creation');await page.locator('input[placeholder="your name"]').fill('');await page.locator('input[placeholder="your name"]').pressSequentially('Lyra',{delay:220});await wait(2400);await end(m);
  await ev(()=>{
   const s=__game.scene.getScene('Creation');AdCapture.appearance=s.sel.appearance;AdCapture.slot=s.sel.slot;__game.scene.stop('Creation');
   AdCapture.fresh=function(){
    for(const s of __game.scene.getScenes(true))__game.scene.stop(s.sys.settings.key);
    const A=ADV,g=A.Game.newGame({seed:947,name:'Lyra',sex:'f',portraitSlot:AdCapture.slot||3,portraitSeed:(AdCapture.slot||3)*7919+13,appearance:AdCapture.appearance,personalityId:'F01',startingSkills:['arcane_focus','fire_bolt','necromancy']});g.__artPreview=true;g.tutorial={step:'done'};
    const p=A.Game.player(g);p.inventory.gold=2400;p.homeId='brick';p.meal={id:'feast',name:"Traveller's Feast",bonus:{hp:20}};p.archetypeInclination=['mage'];
    g.meta.promptsSeen=Object.fromEntries(Object.keys(A.DATA.PROMPTS).map(k=>[k,true]));g.rideHomeDue=false;g.world.pendingProposals=[];g.world.pendingRescues=[];
    __game.registry.set('game',g);AdCapture.g=g;return g;
   };
   AdCapture.party=function(g,joined=true){
    const A=ADV,p=A.Game.player(g);
    const make=(name,sex,slot,arch,actives,perks)=>{const c=A.Character.base({name,sex,portraitKind:'player',portraitSlot:slot,portraitSeed:slot*7919+(sex==='f'?13:29),personalityId:sex==='f'?'F06':'M06',stats:{hp:145,atk:18,def:14,spd:12},archetypeInclination:[arch],actives:actives.map(skillId=>({skillId,level:25,uses:0})),perks:perks.map(skillId=>({skillId,level:25,uses:0})),homeId:'brick'});g.world.characters.push(c);return c;};
    const lead=make('Ronan','m',1,'tank',['shield_wall','taunt'],['bulwark']),rogue=make('Nerissa','f',2,'rogue',['backstab','smoke_bomb'],['opportunist']),ranger=make('Kael','m',4,'ranger',['aimed_shot','snare'],['marksman']);
    const party=A.Party.create(g.world,lead.id);party.treasury=3000;lead.inventory.gold=5000;
    for(const c of [rogue,ranger,...(joined?[p]:[])]){party.memberIds.push(c.id);party.wages[c.id]=130;c.partyId=party.id;c.leaderId=lead.id;c.wage=130;}
    g.world.parties=g.world.parties.filter(x=>x===party);g.world.metIds=[lead.id,rogue.id,ranger.id];AdCapture.lead=lead;AdCapture.partyMembers=[lead,rogue,ranger];return party;
   };
   AdCapture.town=function(){__game.scene.start('Town');};
   const g=AdCapture.fresh();AdCapture.party(g,false);AdCapture.town();
  });
  const townReady=async()=>{await page.waitForFunction(()=>__game.scene.isActive('Town')&&__game.scene.getScene('Town').game_);await ev(()=>{const s=__game.scene.getScene('Town');ADV.Tutor.clear(s);s.noticeQueue=[];s._arrivalPending=false;s.promptOnce=()=>{};s.speak=(c,b,ctx,cb)=>cb?.();});await wait(400);};
  await townReady();await ev(()=>__game.scene.getScene('Town').openPanel('apply'));await wait(300);
  m=start('party');await wait(1600);await ev(()=>{AdCapture.originalApplication=ADV.Tutor.application;ADV.Tutor.application=()=>({accepted:true,wage:130});});await clickText("Ronan's party");await ev(()=>{ADV.Tutor.application=AdCapture.originalApplication;});await wait(1800);assert.ok(await ev(()=>ADV.Game.player(AdCapture.g).partyId));await end(m);
  await ev(()=>__game.scene.getScene('Town').openPanel('board'));await wait(350);m=start('quest_board');await wait(3400);await end(m);
  await ev(()=>{
   AdCapture.combat=function(kind){
    const A=ADV,g=AdCapture.fresh(),p=A.Game.player(g);A.Campaign3.state(g).stage=1;A.Campaign3.recruit(g,'wren_ward');
    const q=A.Campaign3.buildQuest(g,2);g.quest={quest:q,encIdx:0,travel:{phase:'day',weather:{kind:'sun',intensity:.4,wind:.3}},thralls:[],witnessedNew:[],defeatedNamed:[],lootGold:0};
    p.stats={hp:180,atk:24,def:16,spd:100};p.actives=[{skillId:'fire_bolt',level:25,uses:0},{skillId:'necromancy',level:25,uses:0}];p.perks=[{skillId:'arcane_focus',level:25,uses:0}];
    const enemies=A.Campaign3.spawnEncounter(g,q,0),allies=A.Game.partyRoster(g);
    g.quest.enemies=enemies;g.quest.combat=A.Combat.create(allies,enemies,{rng:new A.RNG(251),leaderId:p.id});
    // Film the finishing spell of this staged encounter, using the actual
    // campaign wolves and their maximum HP; no production balance changes.
    for(const u of g.quest.combat.units)if(u.side==='b')u.chp=20;
    AdCapture.expectedUnits=allies.length+enemies.length;
    const scene=__game.scene.getScene('Combat');scene.loop=()=>{};__game.scene.start('Combat',{mode:'quest'});
   };
   AdCapture.cast=async function(id,who){const A=ADV,s=__game.scene.getScene('Combat'),st=s.st(),u=st.units.find(u=>who==='player'?u.ch.isPlayer:u.ch.name===who),target=A.Combat.validTargets(st,u,id)[0];if(!target)throw Error('No legal target '+id);s.showActionBar(u);const result=A.Combat.act(st,u,{kind:'skill',skillId:id,targetUid:target.uid});if(!result.ok)throw Error(JSON.stringify(result));await new Promise(resolve=>s.drainEvents(resolve));};
  });
  // Real combat events drive the shipped animation renderer; no invented effects.
  for(const [name,skill,who]of [['mage','fire_bolt','player']]){
   await ev(()=>AdCapture.combat());await page.waitForFunction(()=>__game.scene.isActive('Combat')&&__game.scene.getScene('Combat').unitViews?.size===AdCapture.expectedUnits);await wait(550);
   await ev(()=>{const s=__game.scene.getScene('Combat');s.eventCursor=s.st().events.length;});m=start(name);await wait(600);
   await page.evaluate(({skill,who})=>AdCapture.cast(skill,who),{skill,who});
   await wait(2000);await end(m);
  }
  m=start('necromancy');await ev(()=>{const A=ADV,s=__game.scene.getScene('Combat'),g=AdCapture.g,p=A.Game.player(g),fallen=s.st().units.filter(u=>u.side==='b'&&u.chp<=0).map(u=>u.ch);if(!fallen.length)throw Error('Fire Ball did not defeat a wolf');const raised=A.Game.autoRaiseFallen(g,fallen);if(!raised.length)throw Error('No necromancy spawn');AdCapture.raised=raised;A.Cutscenes.raising(s,g,p,raised[0],()=>{}, {count:raised.length});});await wait(3400);await end(m);
  await ev(()=>{const A=ADV,g=AdCapture.g,p=A.Game.player(g);__game.scene.stop('Combat');g.quest.encIdx=1;g.quest.enemies=A.Campaign3.spawnEncounter(g,g.quest.quest,1);const allies=A.Game.partyRoster(g);g.quest.combat=A.Combat.create(allies,g.quest.enemies,{rng:new A.RNG(252),leaderId:p.id});AdCapture.expectedUnits=allies.length+g.quest.enemies.length;__game.scene.start('Combat',{mode:'quest'});});await page.waitForFunction(()=>__game.scene.getScene('Combat').unitViews?.size===AdCapture.expectedUnits);await wait(600);m=start('thralls_spawned');await wait(2100);await end(m);
  await ev(()=>{ADV.Prefs.set({textScale:1});const g=AdCapture.fresh();AdCapture.party(g,true);AdCapture.town();});await townReady();
  await ev(()=>{const s=__game.scene.getScene('Town'),g=AdCapture.g,p=ADV.Game.player(g),c=AdCapture.lead;ADV.Rel.move(g.world,p.id,c.id,85,'quest',{set:true});ADV.Rel.move(g.world,c.id,p.id,85,'quest',{set:true});const pr={fromId:c.id};g.world.pendingProposals=[pr];ADV.Notices.proposal(s,{proposal:pr},()=>{});});await wait(350);
  m=start('relationship');await wait(2700);await clickText('Yes');await wait(800);await end(m);
  await ev(()=>{const s=__game.scene.getScene('Town'),g=AdCapture.g,p=ADV.Game.player(g),child={sex:'f',age:0,fatherId:AdCapture.lead.id,name:null};p.dependents.push(child);g.pendingChildNaming=child;ADV.Notices.nameChild(s,{child},()=>s.refreshAll());});await wait(300);
  m=start('child_name');await wait(500);await page.locator('input[placeholder="a name"]').pressSequentially('Aria',{delay:280});await wait(1300);await clickText('So be it');await wait(700);await end(m);
  // Record real purchases, including the game's sell-before-switch rule.
  await ev(()=>{const g=AdCapture.fresh(),p=ADV.Game.player(g);p.homeId='cottage';p.inventory.gold=4000;p.equippedSet=null;AdCapture.town();});await townReady();
  for(const [i,set]of ['mage','leathers','ranger','warrior'].entries()){
   const label=await page.evaluate(set=>ADV.DATA.GEAR_SETS[set].name,set);
   if(i){const prev=await ev(()=>ADV.DATA.GEAR_SETS[ADV.Game.player(AdCapture.g).equippedSet].name);await clickText('Sell the '+prev);await clickText('Sell it');await wait(300);await revealText(label+' —');}
   m=start('buy_'+set);
   if(i===0){await wait(250);await clickText('Blacksmith');await wait(250);}
   else await wait(250);
   const before=await ev(()=>ADV.Game.player(AdCapture.g).inventory.gold);
   await clickText(label+' —');await wait(1700);
   const result=await page.evaluate(({set,before})=>{const p=ADV.Game.player(AdCapture.g),r={set,before,after:p.inventory.gold,equipped:p.equippedSet,cost:ADV.DATA.GEAR_SETS[set].cost};AdCapture.evidence.purchases.push(r);return r;},{set,before});
   assert.equal(result.equipped,set);assert.equal(result.before-result.after,result.cost);await end(m);
  }
  m=start('buy_brick');await wait(200);await clickText('Home');await wait(400);await revealText('Brick house');await wait(300);const homeGold=await ev(()=>ADV.Game.player(AdCapture.g).inventory.gold);await clickText('Brick house');await townReady();await wait(1800);
  assert.equal(await ev(()=>ADV.Game.player(AdCapture.g).homeId),'brick');assert.equal(homeGold-await ev(()=>ADV.Game.player(AdCapture.g).inventory.gold),350);await ev(()=>{AdCapture.evidence.house={from:'cottage',to:ADV.Game.player(AdCapture.g).homeId,cost:350};});await end(m);
  await ev(()=>{const g=AdCapture.fresh();AdCapture.party(g,true);AdCapture.town();});await townReady();
  await ev(()=>{const A=ADV,g=AdCapture.g,q=A.Campaign2.buildQuest(g,'green',2);g.quest={quest:q,encIdx:0,travel:{phase:'evening',weather:{kind:'wind',intensity:.6,wind:.6}},thralls:[]};A.TravelUI.play(__game.scene.getScene('Town'),g,q,'outbound',()=>{});});
  await page.waitForFunction(()=>__game.scene.getScene('Town').travelPanorama?.ready);await ev(()=>__game.scene.getScene('Town').travelPanorama.ready);await wait(650);m=start('samurai');await wait(5100);await end(m);
  await ev(()=>{AdCapture.quest2=function(){const A=ADV,g=AdCapture.fresh();A.Campaign3.state(g).stage=1;A.Campaign3.recruit(g,'wren_ward');const q=A.Campaign3.buildQuest(g,2);g.quest={quest:q,encIdx:0,travel:{phase:'day',weather:{kind:'sun',intensity:.4,wind:.35}},thralls:[]};AdCapture.town();return g;};AdCapture.quest2();});await townReady();
  await ev(()=>{const g=AdCapture.g;ADV.TravelUI.play(__game.scene.getScene('Town'),g,g.quest.quest,'outbound',()=>{});});await page.waitForFunction(()=>__game.scene.getScene('Town').travelPanorama?.ready);await ev(()=>__game.scene.getScene('Town').travelPanorama.ready);await wait(650);m=start('gate_quest2');await wait(3500);await end(m);
  await ev(()=>AdCapture.quest2());await townReady();
  await ev(()=>{const A=ADV,g=AdCapture.g,s=__game.scene.getScene('Town'),beat=A.Campaign3.closingBeats(g,g.quest.quest).find(b=>b.key==='q2_notice');if(!beat)throw Error('Missing paper-reading illustration beat');AdCapture.cursor.style.opacity=0;A.Campaign3UI.playBeat(s,g,beat,()=>{});});
  await page.waitForFunction(()=>__game.scene.getScene('Town').gateSequence?.view?.background);await wait(700);m=start('gate_scroll');await wait(4000);assert.equal(await ev(()=>__game.scene.getScene('Town').gateSequence.spec.id),'bounty');await end(m);
  await ev(()=>{const A=ADV,g=AdCapture.fresh();A.Campaign3.state(g).stage=0;const q=A.Campaign3.buildQuest(g,1);g.quest={quest:q,encIdx:2,travel:{phase:'night',weather:{kind:'wind',intensity:.35}},thralls:[]};AdCapture.town();});await townReady();
  await ev(()=>{const A=ADV,g=AdCapture.g,beat=A.Campaign3.script(1).closing.find(b=>b.key==='q1_death');if(!beat)throw Error('Missing father death beat');A.Campaign3UI.playBeat(__game.scene.getScene('Town'),g,beat,()=>{});});
  await page.waitForFunction(()=>__game.scene.getScene('Town').gateSequence?.view?.background);await wait(500);m=start('gate_father');await wait(3900);assert.equal(await ev(()=>__game.scene.getScene('Town').gateSequence.spec.id),'death');await end(m);
  fs.writeFileSync(path.join(OUT,'capture_evidence.json'),JSON.stringify(await ev(()=>({...AdCapture.evidence,appearance:AdCapture.appearance,cutscenes:['q2_notice:bounty','q1_death:death'],sourceCanvas:[1280,760]})),null,2));
 }finally{
  const video=page.video();await page.close();await ctx.close();await video.saveAs(path.join(OUT,'raw','gameplay.webm'));await video.delete();await browser.close();fs.writeFileSync(path.join(OUT,'marks.json'),JSON.stringify({marks,errors},null,2));
 }
 assert.deepEqual(errors,[]);console.log('CAPTURE COMPLETE',marks.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
