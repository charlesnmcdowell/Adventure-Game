(function () {
'use strict';
const T=()=>ADV.T, R=()=>ADV.GatePerks;
const UI={};
function requirement(game,sk) {
  const stage=ADV.Campaign3.state(game).stage;
  if (stage<sk.quest && ['door','city','veteran'].includes(sk.group)) return 'Complete this quest’s special event or arrangement. Details revealed when you reach it.';
  return sk.requirement;
}
function row(scene,scroll,x,y,width,game,sk,notice) {
  const rank=R().state(game).earned[sk.id], earned=!!rank;
  const add=(copy,size,color)=>{
    const label=T().text(scene,x,y,copy,{size,color,wrap:width});
    scroll.add(label); y+=label.height+7;
  };
  add((notice?.replaced ? 'New choice: ' : notice?.improved ? 'Improved: ' : '')+sk.name,17,earned?T().css.gold:T().css.inkDim);
  add(earned?'Earned · Passive · No class requirement · No skill slot':'Locked · Campaign reward',12,earned?T().css.green:T().css.inkFaint);
  add(R().description(game,sk.id),14,T().css.ink);
  if (notice?.replaced) add('Replaces the other perk from this milestone.',12,T().css.gold);
  add('Quest '+sk.quest+' — '+sk.questName+'\n'+requirement(game,sk),12,T().css.inkDim);
  if (sk.key==='unmasker' && rank<2) add('Upgrade: Quest 10 — Return to Lanternhold. Recognize the impostor safely.',12,T().css.inkDim);
  return y+18;
}
UI.panel = function (scene,r,top) {
  const game=scene.g();
  const scroll=ADV.UI.scrollArea(scene,{x:r.x+12,y:top,w:r.w-24,h:r.y+r.h-top-8});
  let y=top+8;
  scroll.add(T().text(scene,r.x+24,y,'Varenholm’s Iron War — Campaign Perks',{size:18,display:true,color:T().css.gold})); y+=34;
  for (const sk of ADV.DATA.CAMPAIGN3_PERKS) y=row(scene,scroll,r.x+24,y,r.w-70,game,sk);
  scroll.extend(y);
};
UI.arrival = function (scene,game,done) {
  R().reconcile(game);
  const notices=R().state(game).pending.slice().sort((a,b)=>ADV.DATA.SKILLS[a.id].quest-ADV.DATA.SKILLS[b.id].quest);
  if (!notices.length) { if(done)done();return; }
  const W=T().W,H=T().H,bw=Math.min(820,W-64),bh=Math.min(notices.length===1?Math.round(340*(ADV.Prefs?.textScale() || 1)):550,H-90),x=(W-bw)/2,y=(H-bh)/2;
  let shown=false;
  ADV.Notices.custom(scene,(keep,depth,close)=>{
    keep(T().text(scene,W/2,y+22,notices.length===1?'Campaign perk earned':'Campaign perks earned',{size:25,display:true,ox:0.5,color:T().css.gold}).setDepth(depth));
    const scroll=ADV.UI.scrollArea(scene,{x:x+18,y:y+70,w:bw-36,h:bh-150},{keep,depth});
    let yy=y+76;
    for (const n of notices) yy=row(scene,scroll,x+32,yy,bw-90,game,ADV.DATA.SKILLS[n.id],n);
    scroll.extend(yy);
    const finish=view=>{close();if(done)done();if(view){scene.trainerTab='gate_perks';scene.openPanel('trainer');}};
    ADV.UI.modalBtn(keep,depth,T().button(scene,x+28,y+bh-58,(bw-72)/2,38,'View Campaign Perks',()=>finish(true),{size:15,color:T().css.gold}));
    ADV.UI.modalBtn(keep,depth,T().button(scene,W/2+8,y+bh-58,(bw-72)/2,38,'Continue',()=>finish(false),{size:15}));
    // Only mark a notice seen after its modal has actually been constructed.
    R().acknowledge(game,notices); shown=true;
  },{x,y,w:bw,h:bh});
  if(!shown && done)done();
};
ADV.GatePerksUI=UI;
})();
