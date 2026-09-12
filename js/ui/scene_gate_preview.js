// Save-isolated review of the production campaign assets and equipment rig.
(function(){
'use strict';
const A=ADV,G=A.GateArt,M=G.manifest;
const title=s=>s.replace(/^c3_/,'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
class GatePreview extends Phaser.Scene{
 constructor(){super('GatePreview');}
 create(){
  this.game_={__artPreview:true,meta:{c3:A.Campaign3.fresh()},world:{characters:[],day:1},rng:new A.RNG(931)};
  this.groups=['Companions','Cast','Enemies','Mini-bosses','Battle locations','Journeys','Story scenes','Heritage'];
  this.category=0;this.item=0;this.phase='day';this.weatherKind='clear';this.revision=0;this.owned=[];this.cards=[];
  this.g=()=>this.game_;this.ready=true;this.show();
  this.events.once('shutdown',()=>{this.revision++;this.weather?.destroy();this.owned.splice(0).forEach(o=>o.destroy());});
 }
 entries(){const cast=Object.values(A.DATA.CAMPAIGN_CHARS).filter(c=>c.campaign3);
  return [cast.filter(c=>c.companion).map(c=>c.id),cast.map(c=>c.id),Object.keys(A.DATA.CAMPAIGN_ENEMIES).filter(id=>M.frames['enemy:'+id]),Object.keys(A.DATA.CAMPAIGN_MINIBOSSES).filter(id=>M.frames['mini:'+id]),Object.keys(M.environments),Object.keys(M.panoramas),Object.keys(M.stills),Object.keys(M.frames).filter(k=>k.startsWith('emblem:')||k==='extras:awake').map(k=>k.split(':')[1])][this.category];
 }
 keep(o){this.owned.push(o);return o;}
 button(x,y,w,label,fn){const b=A.T.button(this,x,y,w,35,label,fn,{size:13});[b.g,b.txt,b.zone].forEach(o=>this.keep(o.setDepth(1002)));return b;}
 label(x,y,text,opts={}){return this.keep(A.T.text(this,x,y,text,{size:15,color:'#f2dfbc',...opts}).setDepth(1002));}
 show(){
  const nextCharacterId=A.Character.peekNextId();
  const rev=++this.revision;this.panorama=null;this.weather?.destroy();this.weather=null;this.owned.splice(0).forEach(o=>o.destroy());this.cards=[];
  const ids=this.entries();this.item=(this.item+ids.length)%ids.length;const id=ids[this.item];
  this.keep(this.add.rectangle(640,380,1280,760,0x172637));
  const kind=this.category===4?'environments':this.category===6?'stills':null;
  if(kind){const v=G.view(this,kind,id,{depth:1});if(v)this.keep(v);}
  if(this.category===5){const v=A.TravelPanorama.view(this,'gate_'+id,this.phase);v.setDepth(1);this.panorama=v;this.keep(v);
   if(!A.TravelPanorama.INDOOR.has('gate_'+id)){this.weather=A.WeatherFX.attach(this,{kind:this.weatherKind,intensity:.65,wind:.35},this.phase,{x:0,y:0,w:1280,h:760},{depth:2,celestial:true});v.weather=this.weather;v.ready.then(()=>{if(rev===this.revision&&v.skyMask&&this.weather?.celestial)this.weather.celestial.setMask(v.skyMask);});}
   ['wren_ward','dorran','selene'].forEach((cid,i)=>this.portrait(A.Campaign3.actor(this.game_,cid),515+i*120,565,100,126));
  }
  if(this.category<2){const ch={...A.Campaign3.actor(this.game_,id)};if(id==='korvath')ch.gateAppearance='korvath';
   const role=ch.archetype||(ch.archetypeInclination||[])[0],third=({druid:'wildhide',mage:'mage',healer:'healer',rogue:'leathers',ranger:'ranger'})[role]||'warrior';
   [null,'wardens_gear',third].forEach((set,i)=>{const c={...ch,equippedSet:set};this.portrait(c,330+i*310,370,260,410);this.label(330+i*310,605,i===0?'Signature outfit':i===1?'Warden field kit':title(third),{ox:.5});});
  }else if(this.category===2||this.category===3){const nextId=A.Character.peekNextId();let ch;
   try{if(this.category===2)ch=A.Campaign3.spawnEnemy(new A.RNG(54+this.item),id,18,{});else{const def=A.DATA.CAMPAIGN_MINIBOSSES[id];ch=A.Campaign3.spawnEnemy(new A.RNG(78),def.base,18,{name:def.name});ch.campaignMiniId=id;if(['nib','verlan'].includes(id))ch.portraitId=id;}}
   finally{A.Character.resetIds(nextId);}
   this.portrait(ch,690,377,360,470);
  }else if(this.category===7){const kind=M.frames['emblem:'+id]?'emblem':'extras',key=G.icon(this,kind,id);if(key)this.keep(this.add.image(690,380,key).setDisplaySize(290,290).setDepth(3));}
  this.keep(this.add.rectangle(640,44,1280,88,0x0b1422,.94).setDepth(1000));
  this.keep(this.add.rectangle(640,711,1280,98,0x0b1422,.94).setDepth(1000));
  this.label(25,18,"VARENholm’s GATE · ART VIEWER".toUpperCase(),{size:24,bold:true});
  this.label(25,52,'Production art · save isolated · story scenes contain spoilers',{size:13,color:'#b7cbd3'});
  this.button(1110,25,145,'Back to title',()=>this.scene.start('Title'));
  this.button(25,680,210,this.groups[this.category],()=>{this.category=(this.category+1)%this.groups.length;this.item=0;this.show();});
  this.button(252,680,100,'Previous',()=>{this.item--;this.show();});this.button(1090,680,150,'Next',()=>{this.item++;this.show();});
  const name=A.DATA.CAMPAIGN_CHARS[id]?.name||A.DATA.CAMPAIGN_ENEMIES[id]?.name||A.DATA.CAMPAIGN_MINIBOSSES[id]?.name||title(id);
  this.label(716,692,`${this.item+1} / ${ids.length} · ${name}`,{size:18,ox:.5});
  if(this.category===5){this.button(25,102,140,title(this.phase),()=>{this.phase=['day','evening','night'][(['day','evening','night'].indexOf(this.phase)+1)%3];this.show();});this.button(180,102,140,title(this.weatherKind),()=>{this.weatherKind=['clear','rain','storm','snow'][(['clear','rain','storm','snow'].indexOf(this.weatherKind)+1)%4];this.show();});}
  this.label(25,730,'Use the category button to browse all collections.',{size:12,color:'#a7bcc6'});
  A.Character.resetIds(nextCharacterId);
 }
 portrait(ch,x,y,w,h){const key=A.Portraits.key(this,ch),img=this.keep(this.add.image(x,y,key).setDisplaySize(w,h).setDepth(3));A.Portraits.stand(this,img,this.game_,ch,key,'cutscene');this.cards.push(img);}
 update(_time,dt){this.panorama?.advance(dt,72);}
}
A.GatePreviewScene=GatePreview;
})();
