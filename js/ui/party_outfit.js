(function(){
'use strict';
ADV.Panels.outfitPartyMember=function(scene,r){
 const A=ADV,T=A.T,g=scene.g(),p=scene.player(),target=A.World.byId(g.world,scene.outfitTargetId),party=A.Party.of(g.world,p);
 const scroll=A.UI.scrollArea(scene,{x:r.x+8,y:r.y+8,w:r.w-16,h:r.h-16});let y=r.y+16;
 scroll.addBtn(T.button(scene,r.x+20,y,180,34,'Back to party',()=>scene.openPanel('create'),{size:13}));y+=44;
 if(!target||!party||party.leaderId!==p.id||!A.Party.roster(g.world,party).concat(A.Party.followers(g.world,party)).includes(target)){scroll.add(T.text(scene,r.x+20,y,'You can outfit only members of a party you lead.',{size:14,wrap:r.w-48}));return;}
 scroll.add(T.text(scene,r.x+20,y,'Outfit '+target.name,{size:22,color:T.css.gold}));y+=36;
 const worn=A.DATA.GEAR_SETS[target.equippedSet];
 scroll.add(T.text(scene,r.x+20,y,`Your gold: ${p.inventory.gold}g. Worn: ${worn?worn.name:'no set'}. Replaced gear stays with them. Gifts stay theirs if they leave.`+(target.isUndead||target.isConscript?' This follower is temporary.':''),{size:13,wrap:r.w-48}));y+=76;
 for(const [id,set]of Object.entries(A.DATA.GEAR_SETS)){
  const owned=(target.ownedSets||[]).includes(id);if((set.campaign||set.unique)&&!owned)continue;
  const wearing=id===target.equippedSet,cost=owned?0:set.cost,locked=worn&&(worn.campaign||worn.unique);
  const matching=target.perks.concat(target.actives).filter(e=>(set.archetypes||[]).includes((A.DATA.SKILLS[e.skillId]||{}).archetype)).map(e=>A.DATA.SKILLS[e.skillId].name);
  const button=T.button(scene,r.x+20,y,r.w-48,68,`${set.name} — ${owned?'equip owned set':cost+'g'}`,()=>{
   const result=A.Party.outfit(g.world,p,target,id,owned);A.Notices.toast(scene,result.ok?`${target.name} wears ${set.name}. You paid ${result.cost}g.`:result.error);
   if(result.ok)A.Save.saveGame(g);scene.refreshAll();scene.openPanel('outfit');
  },{size:14,sub:wearing?'Worn now':locked?'Their issued outfit cannot be replaced':matching.length?'Matches: '+matching.join(', '):'No currently equipped skills match',disabled:wearing||!!locked||p.inventory.gold<cost});
  if(A.Tooltip&&A.GearSetInfo)A.Tooltip.attach(scene,button.zone,()=>A.GearSetInfo.describe(id,target));scroll.addBtn(button);y+=76;
 }
 scroll.extend(y+20);
};
})();
