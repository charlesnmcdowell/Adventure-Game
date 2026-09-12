// Illustrated story scenes, chapter plates and epilogues, with bounded texture leases.
(function(){
'use strict';
const A=ADV,G=A.GateArt,M=G.manifest,W=1280,H=760,pool=new Map();
G.cinemaPool=pool;
function purge(scene){const free=[...pool.values()].filter(e=>!e.refs&&e.loaded).sort((a,b)=>a.used-b.used);while(free.length>3){const e=free.shift();scene.textures.remove(e.key);pool.delete(e.url);}}
G.acquire=function(scene,url){let e=pool.get(url);if(e?.failed){pool.delete(url);e=null;}if(!e){e={url,key:'gate_scene_'+A.hashStr(url),refs:0,used:performance.now()};pool.set(url,e);e.ready=new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=()=>{if(!scene.textures.exists(e.key))scene.textures.addImage(e.key,img);e.loaded=true;resolve(true);purge(scene);};img.onerror=()=>{e.failed=true;resolve(false);};img.src=url;});}e.refs++;let released=false;return{entry:e,ready:e.ready,release(){if(released)return;released=true;e.refs--;e.used=performance.now();purge(scene);}};};
G.view=function(scene,kind,id,opts={}){
 const spec=M[kind]?.[id];if(!spec)return null;
 const root=scene.add.container(0,0).setDepth(opts.depth??400),lease=G.acquire(scene,spec.file);
 let alive=true,elapsed=0,bg=null;const w=opts.w||W,h=opts.h||H,x=opts.x||0,y=opts.y||0;
 root.add(scene.add.rectangle(x+w/2,y+h/2,w,h,0x0c111c));
 const label=A.T.text(scene,x+w/2,y+h/2,'Preparing the scene…',{size:18,ox:.5,color:A.T.css.gold});root.add(label);
 const fx=scene.add.graphics();root.add(fx);
 lease.ready.then(ok=>{if(!alive)return;if(!ok){label.setText('Illustration unavailable');return;}label.destroy();bg=scene.add.image(x+w/2,y+h/2,lease.entry.key);const scale=Math.max(w/spec.width,h/spec.height);bg.setScale(scale);root.addAt(bg,1);root.background=bg;root.baseScale=scale;
  if(opts.banner){
   if(opts.cover){const scale=w/spec.width,sh=h/scale,sy=Math.max(0,Math.min(spec.height-sh,spec.height*.55));bg.setOrigin(0).setPosition(x,y-sy*scale).setScale(scale).setCrop(0,sy,spec.width,sh);root.add(scene.add.rectangle(x+w/2,y+h/2,w,h,0x0b1420,.58));}
   else bg.setDisplaySize(w,h);return;
  }
  root.add(scene.add.rectangle(W/2,26,W,52,0x080b12,.94));
  root.add(scene.add.rectangle(W/2,H-25,W,50,0x080b12,.94));
 });
 const tick=(_time,dt)=>{if(!alive||!bg||opts.banner)return;const motion=A.TravelPanorama.motion();if(motion&&!document.hidden)elapsed+=Math.min(50,dt||16);const t=elapsed;
  bg.setScale(root.baseScale*(1+Math.min(.025,t/700000))).setPosition(W/2+Math.sin(t/19000)*5,H/2);
  fx.clear();if(/dream|altar|ending|catacomb|temple/.test(id))for(let i=0;i<28;i++){fx.fillStyle(0xc6c3ba,.11);fx.fillEllipse((i*113+t*.009)%W,(i*57+t*.011)%H,2,1);}
  if(id==='frost'){fx.lineStyle(2,0xb9e8ff,.10+.04*Math.sin(t/700));fx.strokeEllipse(660,535,490+Math.sin(t/900)*25,90);for(let i=0;i<24;i++){const a=i*Math.PI/12+t/1300;fx.fillStyle(0xc9efff,.4);fx.fillRect(660+Math.cos(a)*240,330+Math.sin(a)*230,2,5);}}
  if(id==='death'||id==='valve_scene'){for(let i=0;i<12;i++){fx.fillStyle(0xffc281,.28);fx.fillCircle((i*141+t*.012)%W,620-(i*89+t*.027)%540,1.5);}}
 };
 scene.events.on('update',tick);const stop=()=>root.destroy(true);scene.events.once('shutdown',stop);
 root.once('destroy',()=>{alive=false;scene.events.off('update',tick);scene.events.off('shutdown',stop);lease.release();});root.ready=lease.ready;root.artId=id;return root;
};
// Stage locations belong to story beats, including arrival after quest state clears.
const departures=['','lanternhold','shore','shore','dunmere_mine','thornbury','mirkhollow','iron_mine','span','tower','griffon','hunted_city','palace','undervault','temple'];
const arrivals=['','shore','open_hand','dunmere','dunmere','thornbury','mirkhollow','mirkhollow','palace','nine_lanterns','catacombs','hunted_city','palace','undercity','temple'];
const changes={q1_catchup:'shore',q2_morwin:'open_hand',q3_ithrel:'shore',q3_lessa:'dunmere',q5_sage:'thornbury',q5_inn:'thornbury',q8_duke:'palace',q10_ring:'griffon',q10_letter:'lanternhold',q10_arrest:'lanternhold',q10_catacombs:'catacombs',q10_shore:'shore',q11_cured:'sickroom',q11_docks:'hunted_city'};
const phases={q1_wake:'night',q1_store:'night',q1_road:'night',q1_appear:'night',q1_catchup:'night',q3_lessa:'night',q4_camp_hiwot:'night',q4_camp_selene:'night',q6_fire:'night',q9_romance:'night',q10_ring:'day',q10_shore:'night',q11_posters:'day',q11_docks:'evening',q12_steps:'night'};
const sceneLocations=new Map();
function annotate(beats,location,phase){return (beats||[]).map(b=>{
 location=changes[b.key]||location;phase=phases[b.key]||phase;
 return {...b,artLocation:location,artPhase:phase};
});}
for(let n=1;n<=14;n++){
 const s=A.Campaign3.script(n),routes=G.encounterRoutes[n];
 const groups=[annotate(s.departure,departures[n],n===1?'night':null),annotate(s.closing,routes.at(-1),n===1?'night':null),annotate(s.arrival,arrivals[n],null),...Object.entries(s.openers||{}).map(([i,beats])=>annotate(beats,routes[i],n===1?'night':null))];
 for(const b of groups.flat())if(!sceneLocations.has(b.key))sceneLocations.set(b.key,{id:b.artLocation,phase:b.artPhase});
}
const C=A.Campaign3;
for(const method of ['departureBeats','openerBeats','closingBeats','arrivalBeats']){
 const original=C[method];C[method]=function(game,q,index){
  const n=typeof q==='number'?q:q.n,routes=G.encounterRoutes[n];
  const id=method==='departureBeats'?departures[n]:method==='arrivalBeats'?arrivals[n]:method==='openerBeats'?routes?.[index]:routes?.at(-1);
  return annotate(original(game,q,index),id,n===1?'night':null);
 };
}
G.sceneForBeat=function(game,beat,context){
 const k=beat.key||'',n=Number((k.match(/^q(\d+)_/)||[])[1]);
 let id=null;
 if(k==='q1_death')id='death';
 else if(n===2&&/notice|bounty/.test(k))id='bounty';
 else if(k.startsWith('q4_dream'))id='dream_1';
 else if(k.startsWith('q7_dream'))id='dream_2';
 else if(k.startsWith('q10_dream'))id='dream_3';
 else if(n===7&&/valve|flood/.test(k))id=beat.who==='selene'?'valve_scene':null;
 else if(k.startsWith('q10_letter'))id='letter';
 else if(k==='q12_reveal'||k.startsWith('q12_face_'))id='reveal';
 else if(k==='q12_teleport')id='frost';
 else if(n===14&&(/altar|plea/.test(k)))id=A.Campaign3.inCompany(game,'amara')||A.Campaign3.flag(game,'amaraPassed')?'altar_amara':'altar';
 if(id&&M.stills[id])return{kind:'stills',id};
 const mapped=sceneLocations.get(k);
 if(!beat.artLocation&&!mapped&&context)return context;
 id=beat.artLocation||mapped?.id||G.encounterRoutes[n]?.[game.quest?.encIdx||0];
 const phase=beat.artPhase||mapped?.phase||context?.phase||game.quest?.travel?.phase||A.BattleArt.phaseFor(game);
 return id&&M.environments[id]?{kind:'environments',id,phase}:null;
};
function sequence(scene,done,play){
 if(scene.gateSequence){play(done);return;}
 const oldCut=scene.__cutscene,oldWeather=scene.weatherFx,visible=oldWeather?.container?.visible;
 const state=scene.gateSequence={view:null,spec:null,weather:null,ended:false};
 scene.__cutscene=true;scene.hideChrome?.();A.Notices?.block(scene);oldWeather?.container?.setVisible(false);
 // Block the underlying encounter/home controls, below dialogue and choice controls.
 const shield=scene.add.rectangle(W/2,H/2,W,H,0,0.001).setDepth(899).setInteractive();
 const clean=()=>{if(state.ended)return;state.ended=true;scene.events.off('shutdown',clean);state.weather?.destroy();state.pending?.destroy(true);state.view?.destroy(true);shield.destroy();scene.gateSequence=null;scene.__cutscene=oldCut;scene.showChrome?.();A.Notices?.unblock(scene);if(!oldWeather?.destroyed)oldWeather?.container?.setVisible(visible);};
 scene.events.once('shutdown',clean);
 play(()=>{if(state.ended)return;clean();done?.();});
}
G.withScene=function(scene,game,beat,done,play){
 if(!scene.gateSequence)return sequence(scene,done,next=>G.withScene(scene,game,beat,next,play));
 const state=scene.gateSequence,spec=G.sceneForBeat(game,beat,state.spec);
 if(!spec||JSON.stringify(spec)===JSON.stringify(state.spec)){play(done);return;}
 const view=spec.kind==='environments'?A.AnimeEnvironments.view(scene,'gate_'+spec.id,spec.phase,{depth:400}):G.view(scene,spec.kind,spec.id);
 if(!view){play(done);return;}
 state.pending=view;
 view.ready.then(()=>{
  if(state.ended||!view.active)return;
  state.weather?.destroy();state.weather=null;state.view?.destroy(true);state.view=view;state.spec=spec;state.pending=null;
  if(spec.kind==='environments'&&!M.environments[spec.id].indoor){
   state.weather=A.WeatherFX.attach(scene,A.Weather.at(game.world,{phase:spec.phase,override:game.quest?.travel?.weather}),spec.phase,{x:0,y:0,w:W,h:H},{depth:405,independent:true});
  }
  play(done);
 });
};
const playBeats=A.CampaignUI.playBeats;
A.CampaignUI.playBeats=function(scene,game,beats,done){
 if(!beats.some(b=>b.c3))return playBeats(scene,game,beats,done);
 sequence(scene,done,next=>playBeats(scene,game,beats,next));
};
const firstQuest={1:0,2:1,3:2,5:3,6:4,8:5,10:6,11:7};
G.chapterLocations=['lanternhold','open_hand','dunmere','bandit_camp','mirkhollow','span','catacombs','palace'];
G.chapter=function(scene,game,beat,done){const chapter=beat.artChapter,id=G.chapterLocations[chapter],root=G.view(scene,'environments',id,{depth:940});if(!root){done?.();return;}
 root.add(scene.add.rectangle(W/2,H/2,W,H,0x08111f,.48).setInteractive());
 const title=A.T.text(scene,W/2,295,chapter?'CHAPTER '+chapter:'PROLOGUE',{size:18,ox:.5,color:A.T.css.gold});root.add(title);
 root.add(A.T.text(scene,W/2,335,beat.artTitle,{size:37,display:true,ox:.5,color:'#f5e8d0',wrap:980,align:'center'}));
 const ornament=G.icon(scene,'warden_extra','plate_corner');if(ornament)root.add(scene.add.image(W/2,250,ornament).setDisplaySize(140,70));
 let finished=false;const finish=()=>{if(finished)return;finished=true;const s=A.Campaign3.state(game);(s.artChapters||(s.artChapters={}))[chapter]=true;A.Campaign3.save(game);root.destroy(true);done?.();};
 root.ready.then(()=>{if(!root.active)return;const timer=scene.time.delayedCall(1800,()=>{if(!root.active)return;const b=A.T.button(scene,W/2-105,490,210,40,'Continue',finish,{size:14});root.add([b.g,b.txt,b.zone]);});root.once('destroy',()=>timer.remove());});
};
const departure=A.Campaign3.departureBeats;
A.Campaign3.departureBeats=function(game,q){const beats=departure(game,q),chapter=firstQuest[q?.n],s=A.Campaign3.state(game);if(q?.campaign3&&chapter!==undefined&&!s.artChapters?.[chapter])beats.unshift({c3:true,who:'aldric',key:'art_chapter',artChapter:chapter,artTitle:q.name});return beats;};
G.endingId=ending=>({hero:'ending_hero',monster:'ending_vengeance',usurper:'ending_usurper',mercy:'ending_mercy',ascetic:'ending_empty'})[ending];
G.hallBanner=function(scene,r){const view=G.view(scene,'ui','story_banner',{depth:0,x:r.x+4,y:r.y+4,w:r.w-8,h:66,banner:true,cover:true});if(view)scene.keep(view);};
G.choiceFrame=function(scene,keep,depth,rect){const view=G.view(scene,'ui','choice_frame',{depth:depth-1,...rect,banner:true});if(view){view.setAlpha(.25);keep(view);}};
})();
