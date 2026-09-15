'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='tools/skill_art/review';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const report=[];
 try{for(const mode of ['webgl','canvas']){
  const page=await browser.newPage({viewport:{width:1280,height:760}}),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('SpellFX failed'))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  if(mode==='canvas')await page.route('**/index.html*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('type: Phaser.AUTO','type: Phaser.CANVAS')});});
  await page.goto('http://127.0.0.1:8734/index.html');await page.waitForFunction(()=>window.__game?.scene.getScene('Title')?.pwField,{timeout:120000});
  await page.evaluate(()=>{
   const A=ADV;A.Music.muted=true;A.Music.stopVoice();__game.scene.getScene('Title').pwField.destroy();__game.scene.stop('Title');
   const game=A.Game.newGame({seed:123,name:'Art Review',sex:'f',personalityId:'F01',startingSkills:['fire_bolt','mend','cleave']});game.__artPreview=true;
   __game.scene.add('SkillArtQA',{create(){
    const s=this;s.game_=game;A.BattleArt.paint(s,'deep_wood','day');s.add.rectangle(640,376,1240,516,0x0c1525,.58);
    s.label=s.add.text(640,55,'Skill animation review',{fontFamily:'Georgia',fontSize:'26px',color:'#f3dea1'}).setOrigin(.5).setDepth(700);
    s.caption=s.add.text(640,700,'Cel-shaded combat · current character artwork',{fontFamily:'Arial',fontSize:'16px',color:'#c6d2dc'}).setOrigin(.5).setDepth(700);
    s.unitViews=new Map();s.view=id=>s.unitViews.get(id);
    for(let i=0;i<6;i++){
     const side=i<3?'a':'b',x=i<3?410:870,y=180+(i%3)*160,ch={...A.Game.player(game),id:'art_'+i,name:['Mage','Warrior','Healer','Rival','Sentinel','Scout'][i],isPlayer:i===0,portraitSlot:i%5,sex:i%2?'m':'f',portraitSeed:876+i*97};
     const img=s.add.image(x,y,A.Portraits.key(s,ch)).setDisplaySize(92,116);s.add.rectangle(x,y,96,120).setFillStyle(0,0).setStrokeStyle(1,0x7888a3);
     s.add.text(x,y+66,ch.name,{fontSize:'13px',color:'#c7d5df'}).setOrigin(.5);const u={uid:ch.id,ch,side,lane:'front',statuses:[],hp:500,maxHp:500};s.unitViews.set(ch.id,{x,y,img,u});
    }
    window.__qa=s;
   }},true);
  });await page.waitForFunction(()=>window.__qa?.unitViews?.size===6);
  const coverage=await page.evaluate(()=>{
   const A=ADV,s=__qa,all=Object.values(A.DATA.SKILLS),views=[...s.unitViews.values()],src=views[1],enemy=views[4],ally=views[2];
   const original=JSON.stringify(views.map(v=>v.u)),baseline=s.children.list.length;let casts=0,icons=0;
   function run(ms=900){for(let t=0;t<ms;t+=40)A.SkillArt.sample(s,40);}
   for(const d of all)for(const tier of ['basic','intermediate','advanced']){
    const key=A.SkillArt.icon(s,d.id,tier);if(!key||!s.textures.exists(key))throw Error('Missing icon '+d.id);icons++;
    if(d.kind==='perk')continue;
    const p=A.SkillArt.describe(d.id,tier),tgt=['self'].includes(p.definition.target)?src:['party','ally','allyLane'].includes(p.definition.target)?ally:enemy;
    const ctx={skillId:d.id,tier,src,tgt,dir:1};const n=A.SkillArt.play(s,ctx);if(!Number.isFinite(n))throw Error('Invalid timing '+d.id);run();
    for(const phase of ['hit','miss','block']){A.SkillArt.outcome(s,tgt,d.id,tier,phase,ctx);run();}
    if(A.SkillArt.inspect(s).jobs)throw Error('Leaked animation '+d.id);casts++;
   }
   if(JSON.stringify(views.map(v=>v.u))!==original)throw Error('Artwork mutated game state');
   if(s.children.list.length!==baseline)throw Error('Display leak '+s.children.list.length+' vs '+baseline);
   for(const k of ['burn','poison','bleed','frozen','shocked','rooted','ward','guard','taunted','conscript','hot','thornShield','grove','wings']){src.u.statuses=[{kind:k}];A.SpellFX.syncStatus(s,src);run(80);A.SpellFX.tick(s,src,{dmg:20});run();A.SpellFX.clearStatus(src);}
   src.u.statuses=[];
   for(const id of ['conscript','necromancy']){const r=A.SkillArt.ritual(s,id,src,enemy);run();r.destroy();}
   for(const d of all.filter(d=>d.kind==='perk')){A.SkillArt.perk(s,src,d.id);run();}
   const w=src.img.displayWidth,h=src.img.displayHeight,normal=src.img.texture.key;
   const forms=['werewolf','werebear','panther','hound','serpent','fox','fox_three','fox_nine','storm','marine','sea_dog','spellblade','unbroken','wild'];
   for(const beast of forms){const key=A.Portraits.beastKey(s,src.u.ch,beast);A.VFX.transform(s,src,key,{form:beast});run();if(src.img.texture.key!==key)throw Error('Form did not swap '+beast);A.VFX.revertForm(s,src,normal);run();if(src.img.texture.key!==normal||src.img.displayWidth!==w||src.img.displayHeight!==h)throw Error('Form failed to restore');}
   A.SkillArt.clear(s);if(s.children.list.length!==baseline)throw Error('Cleanup leaked display objects');
   return{skills:all.length,active:casts/3,tierCasts:casts,outcomes:casts*3,icons,statusKinds:14,forms:forms.length};
  });
  console.log(mode+' all-skills coverage '+JSON.stringify(coverage));
  for(const [id,tier,phase]of [['cleave','advanced','cast'],['fire_bolt','advanced','cast'],['frost_touch','advanced','hit'],['chain_lightning','advanced','cast'],['mend','advanced','cast'],['prismatic_bolt','advanced','hit'],['shuriken_fan','advanced','cast'],['powder_keg','advanced','cast'],['thorn_skin','advanced','cast'],['beast_shape','advanced','cast'],['raptor_shred','advanced','cast'],['grove_raise','advanced','cast']]){
   if(process.env.SKILL_ART_NO_SHOTS||(mode==='canvas'&&id!=='cleave'))continue;
   await page.evaluate(({id,tier,phase})=>{const s=__qa,A=ADV;A.SkillArt.clear(s);const v=[...s.unitViews.values()],src=v[1],tgt=A.SkillArt.describe(id,tier).definition.heal?v[2]:v[4];s.label.setText(A.DATA.SKILLS[id].tiers?.[tier]?.name||A.DATA.SKILLS[id].name);s.caption.setText(A.DATA.SKILLS[id].name+' · '+tier+' · '+phase);const ctx={skillId:id,tier,src,tgt,dir:1};A.SkillArt.play(s,ctx);if(phase==='hit'){for(let i=0;i<14;i++)A.SkillArt.sample(s,40);A.SkillArt.outcome(s,tgt,id,tier,'hit',ctx);}for(let i=0;i<5;i++)A.SkillArt.sample(s,40);__game.loop.sleep();}, {id,tier,phase});
   // Render the manually sampled phase before capturing without letting it advance.
   await page.evaluate(()=>{__qa.scene.pause();__game.loop.wake();});await page.waitForTimeout(55);
   await page.screenshot({path:out+'/'+mode+'-'+id+'.png'});await page.evaluate(()=>__qa.scene.resume());
  }
  const cleanup=await page.evaluate(()=>{const s=__qa,A=ADV,v=[...s.unitViews.values()][1];A.SkillArt.clear(s);const baseline=s.children.list.length;
   for(let i=0;i<30;i++)A.SkillArt.play(s,{skillId:'fire_bolt',tier:'advanced',src:v,tgt:[...s.unitViews.values()][4]});if(A.SkillArt.inspect(s).jobs>18)throw Error('Unbounded effects');
   v.u.statuses=[{kind:'burn'}];A.SkillArt.syncStatus(s,v);A.SkillArt.clear(s);v.u.statuses=[];
   if(A.SkillArt.inspect(s).jobs||A.SkillArt.inspect(s).statuses||s.children.list.length!==baseline)throw Error('Stress cleanup failed');
   return{boundedJobs:18,cleared:true};});
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>{const s=__qa,A=ADV,v=[...s.unitViews.values()][1],x=v.img.x,y=v.img.y;const ms=A.SkillArt.play(s,{skillId:'cleave',tier:'advanced',src:v,tgt:[...s.unitViews.values()][4]});A.SkillArt.sample(s,80);if(v.img.x!==x||v.img.y!==y||ms>290)throw Error('Reduced motion ignored');A.SkillArt.clear(s);return{noLunge:true,duration:ms};});
  await page.evaluate(()=>{__game.scene.stop('SkillArtQA');});await page.waitForTimeout(60);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);report.push({mode,...coverage,cleanup,reduced,errors,missing});await page.close();
 }}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
