// Varenholm's Gate art registration. Story rules and voice lines remain in Campaign3.
(function(){
'use strict';
const A=ADV,M=A.GateManifest,N=A.AnimeIdentities.named,F=M.frames;
const G=A.GateArt={version:1,manifest:M};
const frame=(kind,id)=>F[kind+':'+id];
Object.assign(A.AnimeManifest.parts,M.parts);
// Nose / anatomical chin landmarks in the original 627px head cells.
// Eyes and mouths are drawn by the existing expression rig, not baked twice into art.
const points={
 heads_1:[[343,380,513],[301,367,512],[327,339,479],[315,325,480]],
 heads_2:[[332,330,455],[300,342,472],[335,324,442],[296,253,427]],
 heads_3:[[309,398,516],[304,400,534],[314,325,483],[301,400,526]],
 heads_4:[[332,335,465],[310,302,442],[354,294,444],[301,299,426]],
 heads_5:[[313,338,469],[311,337,474],[311,348,476],[301,356,482]],
 heads_6:[[312,251,403],[311,367,474],[311,253,388],[311,259,385]],
 heads_7:[[338,298,432],[294,296,432],[335,320,445],[292,253,386]],
 heads_8:[[313,328,478],[325,310,452],[313,288,446],[313,332,463]],
 heads_9:[[311,390,522],[309,352,502],[329,307,458],[309,295,438]],
 heads_10:[[313,305,439],[310,307,448],[317,291,430],[317,313,455]],
 heads_11:[[345,403,548],[318,437,584],[324,345,508],[334,354,518]],
 heads_12:[[314,291,423],[312,291,447],[314,297,435],[313,314,480]],
};
for(const [key,hf]of Object.entries(F)){
 if(!key.startsWith('head:'))continue;
 const id=key.slice(5),base=N[id]||N.korvath;
 const sheet=hf.sheet.replace(/^gate_/,''),p=points[sheet]?.[hf.frame]||[313,345,483];
 const body=frame('body',id==='korvath_helmet'?'korvath':id);
 const head={...hf,nx:p[0],ny:p[1],chin:p[2],eyeUp:68,mouthDown:60,spread:61};
 if(['ilvara','sarn','korvath_helmet'].includes(id))head.masked=true;
 if(['sarn','korvath_helmet'].includes(id)){head.noEyes=true;head.browsCovered=true;}
 if(id==='aurelius')head.mouthDown=72;
 if(id==='fennick')head.clipPolygon=[[0,0],[627,0],[627,380],[445,380],[432,426],[390,473],[332,492],[269,458],[223,411],[210,380],[0,380]];
 if(id==='bramm'){head.eyeUp=74;head.mouthDown=70;head.clipRight=462;}
 if(id==='durnik')head.mouthDown=65;
 if(['grukhar','gorruk'].includes(id)){head.mouthDown=88;head.spread=75;}
 N[id]={...base,key:id,head,bodySheet:body?.sheet,bodyFrame:body?.frame,
  bodyWidth:['gorruk','korvath','korvath_helmet','bramm'].includes(id)?1120:id==='durnik'?1100:id==='fennick'?940:1020,
  authoredSkin:true,clothColor:null,companion:id==='bramm'?'pip':null,ragged:false,
  beardFront:['bramm','durnik','torvald','thornwise','ostwin'].includes(id),
  iris:['korvath','sarn'].includes(id)?'#b08345':id==='idris'?'#b2bec5':base.iris,
  cloudy:id==='idris',eyeWidth:['grukhar','gorruk'].includes(id)?42:base.eyeWidth,
 };
}
if(N.amara&&frame('extras','amara_docks')){const b=frame('extras','amara_docks');N.amara_docks={...N.amara,key:'amara_docks',bodySheet:b.sheet,bodyFrame:b.frame,set:'plain'};}
// These superseded head atlases are no longer loaded alongside their replacements.
for(let i=1;i<=12;i++)if(M.parts['gate_heads_'+i])delete A.AnimeManifest.parts['heads_named_gate'+i];
G.named=(ch,base)=>N[ch.gateAppearance]||base;
G.enemy=ch=>frame('mini',ch.campaignMiniId)||frame('enemy',ch.enemyTypeId);
G.warden=ch=>{
 const role=ch.archetype||(ch.archetypeInclination||[])[0]||'fighter',sex=ch.sex==='f'?'f':'m';
 const kind=['healer','druid','mage','necromancer'].includes(role)?'healer':['rogue','ranger','assassin'].includes(role)?'rogue':'fighter';
 return frame('warden',kind+'_'+sex)||frame('warden_extra',kind+'_'+sex)||frame('extras','wardens_'+kind+'_'+sex);
};
G.icon=function(scene,kind,id){const f=frame(kind,id);if(!f)return null;const k='gate_icon_'+kind+'_'+id;if(!scene.textures.exists(k)){const c=A.AnimeWorld.cell(scene,f.sheet,f.frame);if(!c)return null;const t=scene.textures.createCanvas(k,160,160);t.getContext().drawImage(c,0,0,160,160);t.refresh();}return k;};
const encounterRoutes=G.encounterRoutes={
 1:['lanternhold','lanternhold','griffon'],2:['shore','shore','open_hand'],3:['dunmere','ford','gnoll_fort'],
 4:['dunmere_mine','dunmere_mine','dunmere_mine','black_altar'],5:['thornbury','holloway','bandit_camp','bandit_camp'],
 6:['mirkhollow','grove','cliffs','iron_mine'],7:['iron_mine','iron_mine','iron_mine','study','valve'],
 8:['sewers','nine_lanterns','counting','counting'],9:['tower','counting','silk_floor','tower'],
 10:['lanternhold','lanternhold','catacombs','catacombs','catacombs'],11:['hunted_city','sickroom','hunted_city','undervault'],
 12:['palace','palace','palace'],13:['undervault','undercity','undercity','undercity','temple'],14:['temple','mirrors','temple']
};
const journeys=G.journeys={
 1:['lanternhold','griffon'],2:['shore','open_hand'],3:['ford','dunmere'],4:['dunmere_mine','dunmere'],
 5:['holloway','bandit_camp'],6:['mirkhollow','iron_mine'],7:['iron_mine','mirkhollow'],8:['span','nine_lanterns'],
 9:['tower','hunted_city'],10:['lanternhold','catacombs'],11:['hunted_city','hunted_city'],12:['palace','palace'],
 13:['undercity','undercity'],14:['temple','temple']
};
const terrain={lanternhold:'city',griffon:'road',shore:'coast',open_hand:'city',thornbury:'city',ford:'forest',dunmere:'city',dunmere_mine:'crypt',holloway:'forest',bandit_camp:'forest',mirkhollow:'forest',iron_mine:'crypt',span:'city',sewers:'crypt',nine_lanterns:'city',palace:'crypt',tower:'crypt',catacombs:'crypt',hunted_city:'city',undercity:'crypt',temple:'crypt'};
for(const [id,e]of Object.entries(M.environments)){
 const key='gate_'+id;
 A.AnimeManifest.environments[key]={...e,file:'../../gate/v1/runtime/'+e.file.split('/').pop()};
 if(e.indoor)A.AnimeEnvironments.INDOOR.add(key);
 A.AnimeEnvironments.DETAILS[key]={...(e.indoor?{mist:.8}:{leaves:['forest','road'].includes(terrain[id])})};
}
for(const [id,e]of Object.entries(M.panoramas)){
 const key='gate_'+id;
 A.TravelPanorama.files[key]=e.file;
 A.DATA.TRAVEL_LOCATIONS[key]={id:key,name:id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),terrain:terrain[id]||'road',distance:'close',version:1};
 if(e.indoor)A.TravelPanorama.INDOOR.add(key);
}
G.travelId=(q,leg)=>q?.campaign3&&journeys[q.n]?'gate_'+journeys[q.n][leg==='return'?1:0]:null;
G.travelPhase=(q,leg)=>{const id=G.travelId(q,leg);return ['gate_lanternhold','gate_griffon','gate_nine_lanterns'].includes(id)?'night':['gate_open_hand','gate_hunted_city'].includes(id)?'evening':null;};
G.travelSequence=(q,leg)=>q?.campaign3&&leg==='outbound'&&q.n===5?['gate_thornbury','gate_holloway']:q?.campaign3&&leg==='outbound'&&q.n===8?['gate_span','gate_sewers']:[G.travelId(q,leg)].filter(Boolean);
// Calibrated against each panorama's painted water, fabric, lanterns and chimneys.
const movingDetails={
 lanternhold:{water:[.025,.63,.09,.15],cloth:[.82,.05,.03,.50]},
 griffon:{cloth:[.18,.46,.045,.30]},shore:{water:[.31,.45,.54,.10],cloth:[.948,.10,.042,.43]},
 open_hand:{cloth:[.866,.08,.034,.32]},thornbury:{cloth:[.322,.10,.035,.28]},
 ford:{water:[.59,.78,.27,.075],cloth:[.05,.02,.063,.30]},dunmere:{cloth:[.93,.27,.043,.26]},
 dunmere_mine:{water:[.66,.79,.18,.10]},holloway:{cloth:[.084,.21,.031,.30]},
 bandit_camp:{cloth:[.752,.105,.046,.34]},mirkhollow:{cloth:[.03,.45,.09,.14]},
 iron_mine:{cloth:[.81,.085,.047,.42]},span:{water:[.36,.72,.33,.10],cloth:[.953,.05,.023,.30]},
 sewers:{water:[.355,.64,.26,.13]},nine_lanterns:{cloth:[.835,.29,.11,.08]},
 palace:{cloth:[.388,.05,.034,.28]},tower:{cloth:[.289,0,.04,.27]},
 catacombs:{water:[.72,.80,.065,.05]},hunted_city:{water:[.431,.62,.11,.07],cloth:[.868,.25,.08,.08]},
 temple:{cloth:[.151,.15,.021,.41]}
};
const life={
 lanternhold:{lights:[[.84,.54],[.93,.58]]},griffon:{lights:[[.37,.63],[.54,.57]]},
 open_hand:{lights:[[.72,.44],[.86,.43],[.79,.30]]},thornbury:{smoke:[[.13,.19]]},
 dunmere:{smoke:[[.09,.13],[.36,.39]]},dunmere_mine:{lights:[[.19,.20],[.304,.41],[.91,.35]]},
 holloway:{lights:[[.23,.62],[.49,.59]]},bandit_camp:{lights:[[.134,.49],[.458,.54]]},
 iron_mine:{lights:[[.63,.54],[.80,.55],[.074,.62]]},sewers:{lights:[[.03,.44],[.446,.29],[.80,.17],[.87,.56]]},
 nine_lanterns:{lights:[.45,.487,.523,.56,.60,.638,.68,.723,.767].map(x=>[x,.40])},
 palace:{lights:[[.34,.47],[.66,.47]]},tower:{lights:[[.242,.66],[.714,.72],[.863,.62]]},
 catacombs:{lights:[[.105,.64],[.45,.76],[.94,.68]]},hunted_city:{lights:[[.907,.53],[.677,.48]]},
 temple:{lights:[[.031,.53],[.23,.56],[.295,.54],[.851,.57],[.639,.45]]}
};
for(const[id,d]of Object.entries(movingDetails))A.TravelPanorama.DETAILS['gate_'+id]=d;
for(const[id,d]of Object.entries(life))A.TravelPanorama.LIFE['gate_'+id]=d;
const groundFor=A.BattleArt.groundFor;
A.BattleArt.groundFor=function(game,mode){const q=game.quest?.quest;if(q?.campaign3){const id=encounterRoutes[q.n]?.[game.quest.encIdx||0];if(id&&M.environments[id])return'gate_'+id;}return groundFor(game,mode);};
const phaseFor=A.BattleArt.phaseFor;
A.BattleArt.phaseFor=function(game){const q=game.quest?.quest;if(q?.campaign3){if(q.n===1||q.n===12)return'night';if(q.n===11&&game.quest.encIdx===2)return'evening';return game.quest.travel?.phase||phaseFor(game);}return phaseFor(game);};
// The new paintings have their own viewing history; prices/distance and existing dialogue stay intact.
const travelKey=A.Travel.key;
A.Travel.key=(q,leg,event)=>G.travelId(q,leg)?'travel:'+G.travelId(q,leg)+':v1:'+(event?'event:'+event:leg):travelKey(q,leg,event);
const plan=A.Travel.plan;
A.Travel.plan=function(game,q,leg){const p=plan(game,q,leg);if(q?.campaign3){const id=G.travelId(q,leg);p.location={...p.location,name:A.DATA.TRAVEL_LOCATIONS[id]?.name||p.location.name,caption:q.name};}return p;};
const actor=A.Campaign3.actor;
A.Campaign3.actor=function(game,id){const ch=actor(game,id);if(ch&&id==='korvath')ch.gateAppearance=A.Campaign3.state(game).stage<11&&!A.Campaign3.state(game).artKoladeRevealed?'korvath_helmet':'korvath';return ch;};
G.speaker=function(game,beat,ch){if(!ch)return ch;const copy={...ch};if(beat.who==='korvath')copy.gateAppearance=beat.key.startsWith('q1_')?'korvath_helmet':'korvath';if(beat.who==='amara')copy.gateAppearance=beat.key.startsWith('q11_')?'amara_docks':'amara';return copy;};
const spawn=A.Campaign3.spawnEncounter;
A.Campaign3.spawnEncounter=function(game,q,n){const out=spawn(game,q,n),spec=A.Campaign3.resolveSpec(game,q.cEnc?.[n]);if(spec?.mini){const d=A.DATA.CAMPAIGN_MINIBOSSES[spec.mini];for(const ch of out)if(d&&ch.enemyTypeId===d.base&&ch.name.startsWith(d.name)){ch.campaignMiniId=spec.mini;if(['nib','verlan'].includes(spec.mini))ch.portraitId=spec.mini;}}return out;};
})();
