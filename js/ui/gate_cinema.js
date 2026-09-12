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
G.sceneForBeat=function(game,beat){
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
 if(!beat.caption)return null;
 const special={q1_wake:'lanternhold',q1_store:'lanternhold',q1_road:'griffon',q1_appear:'griffon',q1_catchup:'shore',q2_pair:'shore',q2_cassian:'shore',q2_morwin:'open_hand',q2_selene:'open_hand',q3_ithrel:'shore',q3_lessa:'dunmere',q3_bramm:'ford',q3_freed:'gnoll_fort',q3_tollan:'dunmere',q8_span:'span',q11_healer:'sickroom',q11_docks:'hunted_city',q12_steps:'palace',q13_gate:'undercity'};
 id=special[k]||G.encounterRoutes[n]?.[game.quest?.encIdx||0];return id&&M.environments[id]?{kind:'environments',id}:null;
};
G.withScene=function(scene,game,beat,done,play){const spec=G.sceneForBeat(game,beat);if(!spec){play(done);return;}const view=G.view(scene,spec.kind,spec.id);if(!view){play(done);return;}
 const oldCut=scene.__cutscene;scene.__cutscene=true;scene.hideChrome?.();let ended=false;
 const stop=()=>{ended=true;scene.__cutscene=oldCut;};scene.events.once('shutdown',stop);
 const finish=()=>{if(ended)return;ended=true;scene.events.off('shutdown',stop);view.destroy(true);scene.__cutscene=oldCut;if(!oldCut)scene.showChrome?.();done?.();};
 view.ready.then(()=>{if(view.active&&!ended)play(finish);});
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
