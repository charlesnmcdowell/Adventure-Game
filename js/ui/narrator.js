// Naval narrator: condition-driven advice, persisted cooldowns, no dialogue interruption.
(function(){
'use strict';
const N={voice:'C34VRFVgUY3W0ZIN2NQ5',lines:{
 flee_solo:'You are below thirty percent health, and your entire rescue team is you. Use Flee. A tactical retreat beats a very small funeral.',
 shelter_two:'Two more completed quests in this shelter and you will get sick. Upgrade your house. The damp has moved in, and it is not paying rent.',
 shelter_one:'One quest left before this shelter makes you sick. Buy a better roof before your lungs start negotiating separately.',
 hungry_one:'Your stomach has filed a formal complaint. Hunger has cost you a quarter of your stats. Buy a meal before the next contract; one meal clears hunger.',
 hungry_two:'You have skipped enough meals to lose half your stats to hunger. The enemy does not need a clever tactic now. A sandwich might be your strongest skill.',
 hungry_three:'Three hunger stacks. Only a quarter of your stats remains before any sickness penalties. Eat now. Starving to death is not an achievement worth unlocking.',
 sick:'Congratulations. You have saved money on shelter and invested the difference in a disease. Sickness cuts your stats and stacks with hunger. Upgrade your house; a brick house ends the recurring shelter problem.',
 low_gold:'Your purse is becoming a percussion instrument: mostly empty space. Check the better-paying contracts and available faction campaigns. Solo work pays too, but without a party, one bad fight can cost you the lot.',
 broke_marriage:'Less than a hundred gold. You could marry a rich husband or wife, if budgeting continues to be your dump stat. Try some paid work first. Romance has its own requirements.',
 broke_work:'Your finances have entered stealth mode. Hire on with a party for wages, or check faction contracts and campaign work you qualify for. Solo bounties can pay well. They can also end in a funeral for one.',
 brick_spouses:'A brick house. Actual walls, and room for two spouses. You can now marry more than one person without exceeding the housing limit. Apparently the next boss fight is the household calendar.'
}};
N.conditions=function(game){
 const p=ADV.Game.player(game);if(!p||!p.alive)return [];
 const s=ADV.Survival.state(p),mem=p.narratorMemory||(p.narratorMemory={}),tick=game.world.questClock||0,out=[];
 const add=(id,key)=>{if(mem[key]!==true)out.push({id,key});};
 if(s.hunger>0)add('hungry_'+['one','two','three'][Math.min(2,s.hunger-1)],'hunger:'+s.questTicks+':'+s.hunger);
 if(s.sick)add('sick','sickness:'+s.questTicks);
 else {const left=ADV.Survival.shelterDeadline(p);if(left<=2)add(left===2?'shelter_two':'shelter_one','shelter:'+s.questTicks+':'+left);}
 if(ADV.Housing.rank(ADV.Housing.of(p).id)>=ADV.Housing.rank('brick'))add('brick_spouses','brick_spouses');
 const wealth=ADV.Vault.wealthOf(game.world,p);
 if(wealth<200 && tick-(mem.lastGoldAt??-99)>=3){const n=mem.goldCount||0;out.push({id:wealth<100?(n%2?'broke_work':'broke_marriage'):'low_gold',key:'gold:'+tick,gold:true});}
 return out;
};
N.say=function(scene,game,id,done){
 if(!N.lines[id]){if(done)done();return;}
 ADV.Notices.toast(scene,N.lines[id]);
 if(ADV.Music.speakNarrator)ADV.Music.speakNarrator(id);
 const audio=ADV.Music.voiceEl;
 let finished=false,timer;
 const finish=()=>{if(finished)return;finished=true;if(timer)timer.remove(false);if(audio)audio.removeEventListener('ended',finish);if(done)done();};
 if(audio)audio.addEventListener('ended',finish,{once:true});
 timer=scene.time.delayedCall(Math.max(6500,N.lines[id].length*65),finish);
 scene.events.once('shutdown',()=>{if(audio)audio.removeEventListener('ended',finish);if(ADV.Music.voiceKind==='narrator')ADV.Music.stopVoice();});
};
N.town=function(scene,game){
 if(scene.__narratorQueue)return;scene.__narratorQueue=true;
 const next=()=>{
  if(!scene.sys.isActive())return;
  if((ADV.Tutor&&ADV.Tutor.active(game)) || scene.__embarking || scene._chromeHidden || (ADV.Music.voiceEl&&!ADV.Music.voiceEl.paused&&!ADV.Music.voiceEl.ended)) {scene.time.delayedCall(1200,next);return;}
  const item=N.conditions(game)[0];if(!item){scene.__narratorQueue=false;return;}
  const m=ADV.Game.player(game).narratorMemory;m[item.key]=true;if(item.gold){m.lastGoldAt=game.world.questClock||0;m.goldCount=(m.goldCount||0)+1;}
  ADV.Save.saveGame(game);N.say(scene,game,item.id,()=>scene.time.delayedCall(1200,next));
 };
 scene.events.once('shutdown',()=>{scene.__narratorQueue=false;});scene.time.delayedCall(800,next);
};
ADV.Narrator=N;
})();
