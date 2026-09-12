// Travel-only panoramas. Battle compositions keep their original camera and art.
(function(){
'use strict';
const A=ADV,W=1280,H=760,ROOT='assets/anime/travel/v1/runtime/';
const INDOOR=new Set(['crypt','ossuary','birthing_house']);
// Authored regions in the original panorama bands, before the seam overlap.
// Cropped painted strips animate the actual water and fabric, not a replacement drawing.
const DETAILS={
 forest:{water:[.40,.64,.14,.11]},marsh:{water:[.23,.52,.50,.16]},
 city:{cloth:[.05,.20,.12,.13]},alley:{cloth:[.16,.24,.22,.21]},
 prison:{cloth:[.53,.19,.045,.33]},tavern:{cloth:[.025,.28,.12,.14]},
 coast:{water:[.25,.40,.46,.23]},port:{water:[.38,.48,.23,.20],cloth:[.865,.23,.05,.21]},
 maw:{water:[.34,.51,.39,.20],cloth:[.035,.10,.09,.17]},
 antler:{cloth:[.198,.19,.063,.43]},academy:{cloth:[.08,.03,.045,.34]},
 bell:{cloth:[.265,.21,.04,.26]},green:{cloth:[.09,.29,.025,.22]},
 tally:{water:[.48,.56,.21,.16],cloth:[.085,.22,.11,.17]},
 navy:{water:[.40,.49,.22,.20],cloth:[.082,.04,.056,.35]},
 salt_court:{water:[.35,.35,.29,.24],cloth:[.31,.38,.10,.13]},
 low_tide:{water:[.23,.58,.55,.17]},pyre:{cloth:[.536,.31,.03,.23]},
 maw_boss:{cloth:[.48,.21,.07,.23]},green_boss:{cloth:[.17,.08,.045,.34]},
 sea:{water:[.12,.39,.77,.17]},
};
const LIFE={};
const pool=new Map();
const files={};
function purge(scene){const free=[...pool.values()].filter(v=>v.loaded&&!v.refs).sort((a,b)=>a.used-b.used);while(free.length>2){const old=free.shift();scene.textures.remove(old.key);pool.delete(old.id);}}
function acquire(scene,id){
 if(id!=='sea'&&!A.DATA.TRAVEL_LOCATIONS[id]&&!files[id])throw Error('Unknown travel panorama: '+id);
 let e=pool.get(id);
 if(e?.failed){pool.delete(id);e=null;}
 if(!e){
  e={id,key:'travel_pano_'+id,refs:0,used:performance.now()};pool.set(id,e);
  e.ready=new Promise(resolve=>{
   const img=new Image();img.decoding='async';
   img.onload=()=>{if(!scene.textures.exists(e.key))scene.textures.addImage(e.key,img);e.loaded=true;resolve(true);purge(scene);};
   img.onerror=()=>{e.failed=true;resolve(false);};img.src=files[id]||ROOT+id+'.webp';
  });
 }
 e.refs++;e.used=performance.now();let released=false;
 return{entry:e,ready:e.ready,release(){
  if(released)return;released=true;e.refs--;e.used=performance.now();
  purge(scene);
 }};
}
function motion(){return !(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function view(scene,id,phase,opts={}){
 const lease=acquire(scene,id),root=scene.add.container(0,0),fx=scene.add.graphics();
 let tile=null,alive=true,elapsed=0,distance=opts.resume?310:0,sky=null;const slices=[];
 root.add(scene.add.rectangle(W/2,H/2,W,H,0x18283c));
 root.add(fx);root.locationId=id;root.distance=distance;
 const terrain=id==='sea'?'coast':A.DATA.TRAVEL_LOCATIONS[id].terrain;
 const leafy=['forest','mountain'].includes(terrain),water=!!DETAILS[id]?.water||['coast','port'].includes(terrain)||id==='marsh'||id==='maw';
 const inside=INDOOR.has(id),haunted=['crypt','ossuary','birthing_house','gate_catacombs','gate_undercity','gate_temple'].includes(id),city=terrain==='city',fire=id==='pyre';
 lease.ready.then(ok=>{
  if(!alive||!ok)return;
  const frame=scene.textures.get(lease.entry.key).get(),scale=H/frame.realHeight;
  tile=scene.add.tileSprite(0,0,W,H,lease.entry.key).setOrigin(0).setTileScale(scale,scale);
  tile.tilePositionX=distance/scale;root.addAt(tile,1);root.tile=tile;root.tileScale=scale;
  root.sourceWidth=frame.realWidth;root.sourceHeight=frame.realHeight;root.slices=slices;
  if(!INDOOR.has(id)&&A.WeatherFX.skyMask){sky=A.WeatherFX.skyMask(scene,frame.source.image,scale,0,0,true);root.skyMask=sky.mask;if(root.weather?.celestial)root.weather.celestial.setMask(sky.mask);}
  if(phase==='night')tile.setTint(0x7189ba);else if(phase==='evening')tile.setTint(0xffc795);
  for(const [kind,rect]of Object.entries(DETAILS[id]||{})){
   const [nx,ny,nw,nh]=rect,originalW=frame.realWidth/.945,sx=nx*originalW-originalW*.055,sy=ny*frame.realHeight,sw=nw*originalW,sh=nh*frame.realHeight,count=kind==='water'?9:7;
   for(let copy=0;copy<2;copy++)for(let i=0;i<count;i++){
    const strip=scene.add.image(0,0,lease.entry.key).setOrigin(0).setScale(scale).setCrop(sx,sy+sh*i/count,sw,sh/count+.5);
    if(phase==='night')strip.setTint(0x7189ba);else if(phase==='evening')strip.setTint(0xffc795);
    if(kind==='water')strip.setAlpha(.8);
    root.addAt(strip,root.length-1);slices.push({strip,kind,i,count,copy});
   }
  }
  const key='travel_grade_'+phase;
  if(!scene.textures.exists(key)){
   const t=scene.textures.createCanvas(key,4,H),c=t.getContext(),g=c.createLinearGradient(0,0,0,H);
   g.addColorStop(0,phase==='night'?'rgba(5,13,40,.6)':phase==='evening'?'rgba(164,63,73,.25)':'rgba(10,25,40,.08)');
   g.addColorStop(.45,phase==='night'?'rgba(7,17,39,.22)':'rgba(0,0,0,0)');g.addColorStop(1,phase==='night'?'rgba(6,15,30,.40)':'rgba(6,15,23,.28)');c.fillStyle=g;c.fillRect(0,0,4,H);t.refresh();
  }
  root.addAt(scene.add.image(W/2,H/2,key).setDisplaySize(W,H),root.length-1);
 });
 root.advance=(dt,velocity)=>{
  if(!alive||!tile||document.hidden)return;
  dt=Math.min(50,dt);const moving=motion();if(moving){elapsed+=dt;distance+=velocity*dt/1000*1.6;}
  root.distance=distance;tile.tilePositionX=distance/root.tileScale;
  if(sky)sky.update(distance);
  const t=elapsed,span=root.sourceWidth*root.tileScale;
  for(const {strip,kind,i,count,copy}of slices){const sway=Math.sin(t/(kind==='water'?640:420)+i*.48)*(kind==='water'?1.5:(i+1)/count*2.8);strip.x=copy*span-(distance%span)+sway;}
  const at=(fraction,speed=1)=>((fraction*span-distance*speed)%(span)+span)%span;
  fx.clear();
  // Screen-space atmosphere passes faster than the painted midground.
  if(leafy||fire||haunted){for(let i=0;i<24;i++){
   const x=((i*127-distance*1.9)%(W+100)+W+100)%(W+100)-50;
   const y=fire?650-(i*53+t*.038)%430:haunted?210+(i*41+t*.009)%340:180+(i*71+t*.019)%510;
   fx.fillStyle(fire?0xffb76a:haunted?0xa4d2de:['green','green_boss','bell'].includes(id)?0xc7d99a:0xc9cb8b,fire?.6:.32);
   fx.fillEllipse(x,y,haunted?2:5+Math.sin(t/220+i)*2,fire?3:2);
  }}
  if(!inside&&phase!=='night'){
   fx.lineStyle(1.7,0x273e50,.68);
   for(let i=0;i<5;i++){const x=((i*34+t*.042)%(W+250))-125,y=130+i%3*12,flap=Math.sin(t/145+i)*4;
    fx.lineBetween(x-7,y+flap,x,y);fx.lineBetween(x,y,x+7,y+flap);}
  }
  if(water&&!id.startsWith('gate_')){for(let i=0;i<28;i++){
   const x=at(i/28,.9),y=H*(id==='sea'?.42:.61)+(i%5)*9;
   fx.lineStyle(1,phase==='night'?0xa6bbdc:0xf5edd1,.08+Math.max(0,Math.sin(t/600+i))*.15);
   fx.lineBetween(x,y,x+14+i%4*9,y);
  }}
  if(city&&!inside){for(let i=0;i<3;i++){
   const x=at(.2+i*.28)-t*.008*(i%2?1:-1),y=606,step=Math.sin(t/150+i);
   fx.fillStyle([0x34404a,0x604e43,0x354e4c][i],.78);fx.fillCircle(x,y-29,4);
   fx.fillTriangle(x-6,y-23,x+6,y-23,x+8,y-7);fx.lineStyle(2.5,0x29323c,.8);
   fx.lineBetween(x-2,y-8,x-3+step*4,y+4);fx.lineBetween(x+3,y-8,x+4-step*4,y+4);
  }}
  if(haunted||fire||id==='alley'||id==='maw_boss'){
   for(let i=0;i<6;i++){const x=at(.1+i*.16),y=haunted?H*.48:H*.65,k=.75+Math.sin(t/170+i)*.15;
    for(let r=3;r>0;r--){fx.fillStyle(haunted?0x99d9ef:0xffc174,.015*k);fx.fillCircle(x,y,r*12);}}
  }
  if(id==='marsh'||haunted||id==='mountain'){for(let i=0;i<6;i++){
   fx.fillStyle(0xb7ced3,.035);fx.fillEllipse(at(i/6,.45),510+Math.sin(t/2700+i)*14,370,25);
  }}
  // Lights and smoke stay anchored to the painted lanterns and chimneys as they pass.
  const life=LIFE[id]||{};
  const sourceX=x=>at((x-.055)/.945);
  for(const [x,y]of life.lights||[]){const px=sourceX(x),py=y*H,k=.84+Math.sin(t/160+x*19)*.09+Math.sin(t/93+y*31)*.07;
   for(let r=3;r>0;r--){fx.fillStyle(0xffba66,.035*k);fx.fillCircle(px,py,r*11);}
   fx.fillStyle(0xffdc9c,.24*k);fx.fillEllipse(px,py,3,7*k);
  }
  for(const [x,y]of life.smoke||[])for(let i=0;i<8;i++){const age=(t+i*450)%3600,px=sourceX(x)+age*.011+Math.sin(age/650)*5,py=y*H-age*.025;
   fx.fillStyle(0xc4c5c1,.07*(1-age/3600));fx.fillEllipse(px,py,11+age*.009,8+age*.007);
  }
  // Footfall dust stays on the road, while its wake drifts behind the party.
  if(moving&&!inside&&!water){for(let i=0;i<9;i++){
   const age=(t+i*123)%1100;fx.fillStyle(0xdccca7,.13*(1-age/1100));fx.fillEllipse(520+i%4*65-age*.05,651-age*.013,9+age*.015,3+age*.004);
  }}
 };
 const stop=()=>root.destroy(true);scene.events.once('shutdown',stop);
 root.once('destroy',()=>{alive=false;scene.events.off('shutdown',stop);sky?.destroy();lease.release();});
 root.ready=lease.ready;return root;
}
A.TravelPanorama={acquire,view,INDOOR,DETAILS,LIFE,files,pool,motion};
})();
