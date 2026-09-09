// Procedural journey staging. Each invocation owns its textures and callbacks.
(function () {
'use strict';
let serial=0;
const palettes={forest:['#75949a','#d7c594','#547064','#343f30'],city:['#8a9ca2','#dbbc8b','#736f68','#42382f'],coast:['#779aa9','#e0c49e','#678388','#695e49'],mountain:['#7c96a6','#d2c8b2','#66737b','#444745'],dungeon:['#172332','#5a666a','#36444b','#282b2c'],port:['#607e94','#d0b997','#4e6772','#3a3835']};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function drawStrip(c,w,h,r,layer,rng,phase){
 const p=palettes[r.terrain], color=layer===1?p[2]+'99':layer===2?p[2]:p[3];
 if(layer===0){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);c.fillStyle=g;c.fillRect(0,0,w,h);
  c.fillStyle=phase==='night'?'#e6ddbe':'#f0d4a2';c.beginPath();c.arc(970,110,phase==='night'?24:34,0,7);c.fill();return;}
 const y=layer===1?370:layer===2?470:545;
 if(layer===3){c.fillStyle=p[3];c.fillRect(0,510,w,h);c.fillStyle='#ffffff18';for(let i=0;i<110;i++)c.fillRect(rng.int(0,w),rng.int(522,590),rng.int(5,35),2);return;}
 const near=layer===4;
 for(let x=-100;x<w+160;x+=near?650:rng.int(100,190)){
  const ht=near?rng.int(380,590):rng.int(80,layer===1?190:290), width=near?65:rng.int(80,155), base=near?630:y;
  if(['forest','mountain'].includes(r.terrain)){
   if(r.terrain==='mountain'&&!near) poly(c,[[x-100,base],[x+width/2,base-ht],[x+width+120,base]],color);
   else {c.fillStyle=near?'#172724':color;c.fillRect(x+width*.46,base-ht,width*.09,ht);poly(c,[[x-20,base-ht*.18],[x+width*.5,base-ht],[x+width+20,base-ht*.18]],near?'#172724':color);}
  }else if(r.terrain==='city'){
   c.fillStyle=near?'#272527':color;c.fillRect(x,base-ht,width,ht);poly(c,[[x-12,base-ht],[x+width/2,base-ht-30],[x+width+12,base-ht]],color);
   c.fillStyle=phase==='night'?'#d8ae6566':'#292b3044';for(let yy=base-ht+25;yy<base-20;yy+=35)for(let xx=x+15;xx<x+width-12;xx+=24)c.fillRect(xx,yy,8,13);
  }else if(r.terrain==='dungeon'){
   c.fillStyle=color;c.fillRect(x,0,width,25);poly(c,[[x,0],[x+width,0],[x+width*.6,ht]],color);poly(c,[[x-30,base+50],[x+width*.4,base-ht*.4],[x+width+40,base+50]],color);
   if(near){c.fillStyle='#111d26';c.fillRect(x,0,50,h);}
  }else {
   if(layer===1){poly(c,[[x-50,base],[x+width/2,base-ht*.45],[x+width+90,base]],color);}
   else if(r.terrain==='port'||near){c.fillStyle=color;c.fillRect(x+width*.5,base-ht,5,ht);c.fillRect(x+width*.15,base-ht*.75,width*.7,4);poly(c,[[x+width*.5+5,base-ht+12],[x+width*.5+5,base-ht*.3],[x+width,base-ht*.3]],color);poly(c,[[x,base-15],[x+width,base-15],[x+width*.8,base+18],[x+width*.2,base+18]],color);}
   else {c.fillStyle=color;c.beginPath();c.ellipse(x,base+20,width,ht*.24,0,0,7);c.fill();}
  }
 }
}
function landmark(scene,container,r){
 const g=scene.add.graphics();container.add(g);const x=0,y=460,col=0x252d30;
 g.fillStyle(col,1);
 const rect=(a,b,w,h)=>g.fillRect(x+a,y+b,w,h);
 if(r.landmark==='bridge'){
  rect(-150,-25,300,18);rect(-140,-25,24,80);rect(116,-25,24,80);
  for(let i=-140;i<145;i+=35)if(i!==0)rect(i,-68,6,44);
  rect(-140,-70,110,6);rect(20,-70,125,6);
 }else if(['toll','gate','arch','bars'].includes(r.landmark)){
  rect(-100,-190,26,200);rect(74,-190,26,200);rect(-100,-190,200,25);rect(-115,-15,230,20);
  if(r.landmark==='bars')for(let i=-65;i<70;i+=18)rect(i,-170,5,160);
 }else if(['red_sails','blue_sails','lighthouse','wreck','throne'].includes(r.landmark)){
  if(r.landmark==='lighthouse'){rect(-25,-255,50,260);g.fillStyle(0xffd998,.8);g.fillRect(-18,y-248,36,25);g.fillTriangle(0,y-235,210,y-290,210,y-175);}
  else {g.fillTriangle(-140,y-40,140,y-40,90,y+12);rect(-5,-285,10,260);g.fillStyle(r.landmark==='red_sails'?0x893b3d:r.landmark==='blue_sails'?0x3d637d:0x8b8971,1);g.fillTriangle(10,y-265,10,y-60,125,y-60);}
 }else if(['laundry','paper','sign'].includes(r.landmark)){
  rect(-150,-210,8,230);rect(142,-210,8,230);g.lineStyle(2,0xafa17e);g.lineBetween(-150,y-190,150,y-170);
  for(let i=-120;i<140;i+=50){g.fillStyle(r.landmark==='paper'?0xc6bd96:0x92978a,.9);g.fillRect(i,y-185,35,r.landmark==='sign'?55:85);}
 }else if(['bamboo','banner','shrine'].includes(r.landmark)){
  for(let i=-90;i<110;i+=50){rect(i,-230,8,250);if(r.landmark==='bamboo'){g.fillTriangle(i,y-170,i+65,y-200,i+20,y-140);}else{g.fillStyle(0x728555,1);g.fillRect(i+8,y-220,32,120);g.fillStyle(col,1);}}
  rect(-65,-40,130,45);g.fillTriangle(-85,y-45,0,y-115,85,y-45);
 }else if(['grave','bones','candles'].includes(r.landmark)){
  for(let i=-100;i<120;i+=45){g.fillStyle(col,1);g.fillRoundedRect(i,y-70,28,75,12);g.fillStyle(0xe8bb69,.9);g.fillCircle(i+14,y-80,3);}
 }else if(r.landmark==='runes'){
  rect(-90,-260,40,270);rect(50,-260,40,270);rect(-90,-260,180,35);g.lineStyle(3,0x9d97c9,.85);for(let yy=-220;yy<-30;yy+=40)g.strokeTriangle(-80,y+yy,-65,y+yy-18,-55,y+yy);
 }else if(r.landmark==='roots'){
  g.lineStyle(18,0x384d39);for(let i=-3;i<=3;i++)g.lineBetween(i*40,y+20,i*13,y-245);g.fillStyle(0x547758);g.fillEllipse(0,y-235,250,130);
 }else if(r.landmark==='fire'){
  g.fillStyle(0x9b5438,.6);for(let i=-3;i<=3;i++)g.fillTriangle(i*38,y+15,i*38+18,y-100-Math.abs(i)*12,i*38+38,y+15);
 }else if(r.landmark==='reeds'){
  for(let i=-12;i<13;i++){rect(i*9,-100-Math.abs(i)*6,3,140+Math.abs(i)*6);}
 }else {g.fillRoundedRect(-25,y-110,50,115,7);g.lineStyle(3,0xaeaa8e);g.lineBetween(-14,y-80,14,y-80);}
 return g;
}
function ambience(scene,terrain){
 // Synthesized wind/water; uses the existing mute and visibility controls.
 const ac=scene.sound&&scene.sound.context;if(!ac)return()=>{};
 const buffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.25;
 const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();source.buffer=buffer;source.loop=true;
 filter.type='lowpass';filter.frequency.value=['port','coast'].includes(terrain)?650:terrain==='dungeon'?160:380;
 gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(ac.destination);source.start();
 const tick=()=>{gain.gain.setTargetAtTime(ADV.Music.muted||document.hidden?0:.12,ac.currentTime,.2);};scene.events.on('update',tick);
 return()=>{scene.events.off('update',tick);try{source.stop();source.disconnect();filter.disconnect();gain.disconnect();}catch(e){}};
}
ADV.TravelUI={
 play(scene,game,q,leg,done,options){
  options=options||{};
  const plan=ADV.Travel.plan(game,q,leg);if(plan.bypass){if(done)done();return;}
  const W=ADV.T.W,H=ADV.T.H,r=plan.location,id=++serial;
  const owned=[],keys=[],timers=[],keep=o=>(owned.push(o),o);
  const later=(ms,fn)=>{const t=scene.time.delayedCall(ms,()=>{if(!ended)fn();});timers.push(t);return t;};
  let ended=false,box=null,elapsed=options.resume?3200:0,ending=false;
  const oldCut=scene.__cutscene;scene.__cutscene=true;if(scene.hideChrome)scene.hideChrome();
  if(ADV.Tutor)ADV.Tutor.clear(scene);if(ADV.Notices)ADV.Notices.block(scene);
  const root=keep(scene.add.container(0,0).setDepth(410));
  const shield=keep(scene.add.rectangle(W/2,H/2,W,H,0x000000,.001).setDepth(890).setInteractive());
  const rng=new ADV.RNG(ADV.hashStr(r.id+':'+q.id)>>>0);
  const qs=game.quest||(game.travelResolution&&game.travelResolution.q);
  const phase=(qs&&qs.travel&&qs.travel.phase)||ADV.BattleArt.phaseFor(game);
  const layers=[];
  for(let n=0;n<5;n++){
   const key='journey-'+id+'-'+n,tex=scene.textures.createCanvas(key,W*2,H);keys.push(key);drawStrip(tex.getContext(),W*2,H,r,n,rng,phase);tex.refresh();
   const tile=scene.add.tileSprite(0,0,W,H,key).setOrigin(0);root.add(tile);layers.push(tile);
   if(options.resume)tile.tilePositionX=72*[0,.15,.4,1,1.8][n]*3.2;
  }
  const grade=scene.add.rectangle(W/2,H/2,W,H,phase==='night'?0x101e38:0x9b4b2c,phase==='night'?.4:phase==='evening'?.16:0);root.add(grade);
  // The water sits behind ships; reflections and ripples move independently.
  const water=['port','coast'].includes(r.terrain)?scene.add.graphics():null;
  if(water)root.addAt(water,2);
  const life=scene.add.graphics();root.add(life);
  const seaCrossing=r.terrain==='port'&&leg==='midleg';
  if(seaCrossing){layers[2].setAlpha(.25);layers[4].setAlpha(.2);}
  const mark=scene.add.container(1040,0);root.addAt(mark,3);landmark(scene,mark,r);
  if(options.resume)mark.x-=72*.45*3.2;
  if(plan.event==='roadside-candle'){const g=scene.add.graphics();mark.add(g);g.fillStyle(0x161b22);g.fillEllipse(-90,473,85,18);g.fillStyle(0xf5ce88);g.fillRect(-40,451,5,18);g.fillCircle(-38,447,4);}
  if(plan.event==='occupied-landmark'){const g=scene.add.graphics();mark.add(g);g.fillStyle(0x171f26);g.fillCircle(-85,424,9);g.fillRoundedRect(-98,435,25,30,5);g.fillRect(-98,460,44,9);}
  const heading=keep(ADV.T.text(scene,W/2,95,leg==='outbound'?r.name:leg==='midleg'?'Further in':'The road home',{size:30,display:true,ox:.5,color:ADV.T.css.gold}).setDepth(892));
  const sub=keep(ADV.T.text(scene,W/2,139,plan.event==='roadside-candle'?'A candle burns beside someone who will not be going home.':leg==='outbound'?q.name:leg==='return'&&(qs&&qs.failed)?'The work is unfinished. The road is still there.':'',{size:15,ox:.5,wrap:900,align:'center',color:ADV.T.css.ink}).setDepth(892));
  if(plan.event==='occupied-landmark')sub.setText('Someone has left a space beside them. The company keeps walking.');
  if(plan.event==='party-friction')sub.setText('There is room on the road. They choose opposite sides.');
  if(plan.event==='weather-turn')sub.setText('The light changes. The weather is following you in.');
  if(leg==='outbound'){
    heading.setAlpha(0);sub.setAlpha(0);
    scene.tweens.add({targets:[heading,sub],alpha:1,delay:800,duration:400});
    if(!plan.event)later(3300,()=>scene.tweens.add({targets:[heading,sub],alpha:0,duration:600}));
  }
  const roster=ADV.Travel.roster(game),cards=[];
  roster.forEach((c,i)=>{
   const cont=keep(scene.add.container(W/2+(i-(roster.length-1)/2)*116,489).setDepth(894));
   const img=scene.add.image(0,0,ADV.Portraits.key(scene,c)).setDisplaySize(82,104);cont.add(img);
   const rim=scene.add.rectangle(0,0,86,108,0,0).setStrokeStyle(2,i===0?ADV.T.c.gold:ADV.T.c.panelEdge);cont.add(rim);
   const name=ADV.T.text(scene,0,62,c.name.split(' ')[0],{size:12,ox:.5});cont.add(name);
   ADV.Portraits.stand(scene,img,game,c,img.texture.key,'cutscene');cards.push({c,cont,img,base:489});
  });
  // Keep the quest's weather snapshot; restore the underlying scene on completion.
  const oldWeather=scene.weatherFx;let weather=null;
  if(oldWeather&&oldWeather.container)oldWeather.container.setVisible(false);
  if(ADV.WeatherFX){scene.weatherFx=null;weather=ADV.WeatherFX.attach(scene,(qs&&qs.travel&&qs.travel.weather)||ADV.Weather.at(game.world,{phase}),phase,{x:0,y:0,w:W,h:570},{depth:885});}
  if(plan.event==='weather-turn'&&qs&&qs.travel)later(3000,()=>{
    qs.travel.weather={kind:r.terrain==='mountain'?'snow':'rain',intensity:.7,wind:.4};
    if(weather)weather.destroy();scene.weatherFx=null;
    weather=ADV.WeatherFX.attach(scene,qs.travel.weather,phase,{x:0,y:0,w:W,h:570},{depth:885});
  });
  const stopSound=ambience(scene,r.terrain);
  const cleanup=()=>{
   if(ended)return;ended=true;timers.forEach(t=>t.remove(false));scene.events.off('update',tick);scene.events.off('shutdown',abort);
   if(box){const b=box;box=null;b.close();}stopSound();if(weather)weather.destroy();scene.weatherFx=oldWeather;
   if(oldWeather&&oldWeather.container)oldWeather.container.setVisible(true);
   owned.forEach(o=>{scene.tweens.killTweensOf(o);o.destroy();});keys.forEach(k=>scene.textures.remove(k));
   scene.__cutscene=oldCut;if(!oldCut&&scene.showChrome)scene.showChrome();if(ADV.Notices)ADV.Notices.unblock(scene);
  };
  const abort=()=>cleanup();scene.events.once('shutdown',abort);
  const finish=()=>{
   if(ended||ending)return;ending=true;
   if(box){box.completeText();}
   const voice=box&&ADV.Music.voiceEl;
   const wait=voice&&!voice.ended&&!voice.error&&Number.isFinite(voice.duration)?Math.max(600,(voice.duration-voice.currentTime)*1000+150):600;
   later(Math.max(0,wait-600),()=>{
    const veil=keep(scene.add.rectangle(W/2,H/2,W,H,0x0c1118,1).setDepth(960).setAlpha(0));
    scene.tweens.add({targets:veil,alpha:1,duration:600});
   });
   later(wait,()=>{ADV.Travel.mark(game,plan.key);if(plan.event&&plan.event!=='companion'){game.meta.travelLastRare=game.meta.travelLastRare||{};game.meta.travelLastRare[r.id]=game.meta.travelJourneyCount||0;game.meta.travelLastEvent=game.meta.travelLastEvent||{};game.meta.travelLastEvent[r.id]=plan.event;ADV.Save.saveMeta(game);}cleanup();if(done)done();});
  };
  function tick(time,dt){
   elapsed+=dt;const velocity=72*Math.min(1,elapsed/400)*(ending?Math.max(0,1-(elapsed-endAt)/600):1);
   layers.forEach((tile,n)=>tile.tilePositionX+=velocity*[0,.15,.4,1,1.8][n]*dt/1000);
   mark.x-=velocity*.45*dt/1000;
   if(water){
    water.clear();water.fillStyle(phase==='night'?0x223b4d:0x608c9c,.9);water.fillRect(0,365,W,150);
    for(let i=0;i<30;i++){
     const yy=378+(i%9)*15,xx=((i*173-elapsed*(.006+i%3*.003))%(W+100)+W+100)%(W+100)-50;
     water.lineStyle(i%3===0?2:1,0xd8d6b6,.12+Math.sin(elapsed/1300+i)*.07);water.lineBetween(xx,yy,xx+40+(i%4)*16,yy);
    }
    if(seaCrossing){mark.y=Math.sin(elapsed/900)*5;}
   }
   life.clear();
   if(['forest','mountain','coast','port'].includes(r.terrain)&&phase!=='night'){
    life.lineStyle(2,0x263f49,.65);
    for(let i=0;i<4;i++){const bx=((elapsed*.023+i*32)%(W+100))-50,by=190+i%2*12,flap=Math.sin(elapsed/160+i)*5;life.lineBetween(bx-7,by+flap,bx,by);life.lineBetween(bx,by,bx+7,by+flap);}
   }
   if(r.terrain==='dungeon'||r.id==='pyre'){
    for(let i=0;i<20;i++){const xx=(i*137+elapsed*.009)%W,yy=200+(i*61-elapsed*.025)%310;life.fillStyle(r.id==='pyre'?0xffb764:0xa8c3c4,.2+.15*Math.sin(elapsed/700+i));life.fillCircle(xx,yy,1.5);}
   }
   if(r.terrain==='city'){
    for(let i=0;i<3;i++){const xx=(i*427+elapsed*(i%2?-.018:.012)+W*2)%(W+100)-50,yy=467;life.fillStyle(0x202830,.65);life.fillCircle(xx,yy-32,5);life.fillRect(xx-6,yy-26,12,20);life.lineStyle(3,0x202830,.65);life.lineBetween(xx-3,yy-6,xx-4+Math.sin(elapsed/130+i)*4,yy+9);life.lineBetween(xx+3,yy-6,xx+4-Math.sin(elapsed/130+i)*4,yy+9);}
   }
   cards.forEach(({c,cont,base},i)=>{const hurt=(c.combatHp??ADV.Character.maxHp(c))<ADV.Character.maxHp(c)*.4;cont.y=base+(hurt?7:0)+(c.isUndead?0:Math.sin(elapsed/(hurt?170:112)+i*1.7)*(hurt?2:3.5));});
  }
  let endAt=0;scene.events.on('update',tick);
  const end=()=>{endAt=elapsed;finish();};
  if(plan.skip)later(1200,()=>ADV.UI.modalBtn(keep,950,ADV.T.button(scene,W-176,22,150,36,'Skip journey',end,{size:13})));
  const lines=ADV.Travel.dialogue(game,q,leg,plan);let li=0;
  function next(){
   if(ended||ending)return;
   const line=lines[li++];if(!line){later(Math.max(500,(leg==='outbound'?10000:7000)-elapsed),end);return;}
   const card=cards.find(c=>c.c===line.speaker);if(card){card.cont.setScale(1.05);card.img.setTint(0xfff3cc);}
   if(line.campaign) ADV.Music.speakCampaign(line.campaign,line.band,line.idx+1);
   else ADV.Music.speakFile(line.speaker.personalityId,line.band,line.idx+1);
   box=ADV.DialogueBox.showText(scene,game,line.speaker,line.text,()=>{box=null;if(card){card.cont.setScale(1);card.img.clearTint();}next();},{recipient:line.to?'To '+line.to.name:'To the company',autoAdvance:true});
   const current=box,el=ADV.Music.voiceEl;
   const duration=Math.max(3500,line.text.split(/\s+/).length*370);
   const advance=()=>{if(box===current&&!ended&&!ending)current.close();};
   if(el){el.addEventListener('ended',advance,{once:true});}
   const fallback=later(duration+3000,advance);
   if(el)el.addEventListener('loadedmetadata',()=>{
    if(ended||ending||box!==current||!Number.isFinite(el.duration))return;
    fallback.remove(false);later(Math.max(duration,el.duration*1000+1000),advance);
   },{once:true});
  }
  if(options.interrupt) later(3200,()=>{cleanup();options.interrupt();});
  else {if(options.resume)sub.setText('The ambush is behind you. The survivors take the road again.');later(1800,next);}
 },
};
})();
