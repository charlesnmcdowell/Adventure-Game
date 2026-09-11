// A slow camera over the approved title painting; the menu never moves with it.
(function(){
'use strict';
ADV.TitleBackdrop={create(scene){
 const W=1280,H=760,lease=ADV.AnimeEnvironments.acquire(scene,'road');
 const root=scene.add.container(640,380).setDepth(-10),world=scene.add.container(-512,-380),fx=scene.add.graphics();root.add(world);
 let image=null,alive=true,clock=0;
 lease.ready.then(ok=>{if(!alive||!ok)return;image=scene.add.image(0,0,lease.entry.key).setOrigin(0).setTint(0xffd5aa);world.addAt(image,0);});world.add(fx);
 const veilKey='title_cinema_veil';
 if(!scene.textures.exists(veilKey)){
  const t=scene.textures.createCanvas(veilKey,W,H),c=t.getContext();
  c.fillStyle='rgba(13,24,40,.12)';c.fillRect(0,0,W,H);
  const g=c.createRadialGradient(640,365,130,640,365,570);
  g.addColorStop(0,'rgba(10,19,34,.84)');g.addColorStop(.48,'rgba(10,19,34,.76)');g.addColorStop(1,'rgba(10,19,34,.04)');
  c.fillStyle=g;c.fillRect(0,0,W,H);t.refresh();
 }
 const veil=scene.add.image(640,380,veilKey).setDepth(-8);
 function tick(time,dt){
  if(!alive)return;const moving=ADV.Prefs.get().titleMotion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden;
  if(moving)clock+=Math.min(dt,50);const t=clock;
  root.setScale(1.31+Math.sin(t/24000)*.028).setPosition(640+Math.sin(t/19000)*17,380+Math.sin(t/23000)*9);
  root.cinemaTime=t;fx.clear();
  // Chimney smoke follows the village roofs in source-image coordinates.
  for(const [x,y]of [[380,239],[478,271],[321,239]])for(let i=0;i<10;i++){
   const age=(t/70+i*12)%120;fx.fillStyle(0xc9c4ba,.05*(1-age/120));fx.fillEllipse(x+age*.18+Math.sin(age/16)*3,y-age*.48,6+age*.14,5+age*.1);
  }
  // Travelers progress along the actual approach and then cross the bridge.
  const route=[[470,641],[351,482],[310,410],[428,394],[645,373],[873,347]];
  for(let i=0;i<4;i++){
   const u=((t/80000+i*.021+.31)%1)*(route.length-1),n=Math.min(route.length-2,Math.floor(u)),f=u-n;
   const x=route[n][0]*(1-f)+route[n+1][0]*f,y=route[n][1]*(1-f)+route[n+1][1]*f,s=.5+(y-345)/300,step=Math.sin(t/170+i);
   fx.fillStyle(0x26333b,.85);fx.fillCircle(x,y-13*s,3*s);fx.fillStyle([0x5a3141,0x2b4c54,0x594f37,0x354336][i],.9);fx.fillTriangle(x-4*s,y-10*s,x+4*s,y-10*s,x+5*s,y-2*s);
   fx.lineStyle(1.5*s,0x253239,.9);fx.lineBetween(x-2*s,y-2*s,x-2*s+step*2*s,y+4*s);fx.lineBetween(x+2*s,y-2*s,x+2*s-step*2*s,y+4*s);
  }
  fx.lineStyle(1.1,0x374a5b,.7);
  for(let i=0;i<7;i++){const x=(t*.014+i*22)%1200-80,y=130+(i%3)*8+Math.sin(t/3400)*9,flap=Math.sin(t/180+i)*3;fx.lineBetween(x-5,y+flap,x,y);fx.lineBetween(x,y,x+5,y+flap);}
  for(let i=0;i<18;i++){const x=(i*91+t*.009)%1100-40,y=(i*79+t*.016)%850-50;fx.fillStyle(0xc9b779,.32);fx.fillEllipse(x,y,3+Math.sin(t/280+i),1.8);}
  for(const [x,y]of [[141,163],[190,181]]){const k=.9+Math.sin(t/180+x)*.08;for(let r=4;r>0;r--){fx.fillStyle(0xffb665,.04*k);fx.fillCircle(x,y,r*8);}fx.fillStyle(0xffe6a2,.8*k);fx.fillEllipse(x,y,3,5);}
  for(let i=0;i<18;i++){const x=665+(i*41+t*.008)%235,y=297+i%6*18;fx.lineStyle(1,0xefe0b1,.1+Math.max(0,Math.sin(t/800+i))*.16);fx.lineBetween(x,y,x+5+i%3*4,y);}
 }
 scene.events.on('update',tick);const stop=()=>root.destroy(true);scene.events.once('shutdown',stop);
 root.once('destroy',()=>{alive=false;scene.events.off('update',tick);scene.events.off('shutdown',stop);lease.release();veil.destroy();});
 root.ready=lease.ready;scene.titleBackdrop=root;return root;
}};
})();
