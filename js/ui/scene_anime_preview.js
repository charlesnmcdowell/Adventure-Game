// A save-isolated fitting room and real combat sample for art review.
(function () {
'use strict';
const A=ADV,Art=A.AnimeArt,T=()=>A.T;
function person(identity='aera') {
  return {id:'art_'+identity,name:({aera:'Aera',samurai:'Ren',pirate:'Cassian',sentinel:'Plated Sentinel'})[identity],
    animeIdentity:identity,animeTone:'original',sex:identity==='aera'?'f':'m',portraitKind:'player',portraitSlot:5,portraitSeed:843,
    personalityId:identity==='aera'?'F01':'M01',equippedSet:({aera:'mage',samurai:'ronin',pirate:'privateers_kit'})[identity]||null,
    rank:1,questsCompleted:0,alive:true,stats:{hp:200,atk:16,def:12,spd:12},bonusStats:{hp:0,atk:0,def:0,spd:0},
    inventory:{gold:300,items:[]},survival:{hunger:0},perks:[],actives:[],skillLevels:{},journal:{},homeId:'brick'};
}
function demoGame(selected) {
  const nextId=A.Character.peekNextId(),rng=new A.RNG(4823);
  try {
    const world=A.World.create(48103);
    const player=A.Character.makePlayer(rng,{name:selected.name,sex:selected.sex,portraitSlot:5,portraitSeed:843,personalityId:selected.personalityId,startingSkills:['cleave','mend','thorn_skin']});
    Object.assign(player,{animeIdentity:selected.animeIdentity,animeTone:selected.animeTone,equippedSet:selected.equippedSet});
    const allies=['samurai','pirate'].filter(id=>id!==selected.animeIdentity).map(id=>{
      const c=A.Character.makePlayer(rng,{name:id==='samurai'?'Ren':'Cassian',sex:'m',personalityId:'M01',startingSkills:['cleave','mend']});
      Object.assign(c,person(id),{id:c.id,isPlayer:false});c.actives=[{skillId:'cleave',level:10,uses:0}];return c;
    });
    world.characters=[player,...allies];world.playerId=player.id;
    const foes=[0,1].map(()=>{const c=A.Character.makeEnemy(rng,'plated_sentinel',{level:4});c.animeIdentity='sentinel';return c;});
    const game={world,rng,player,meta:{journal:{},skillLevels:{},codexUnlocked:[],promptsSeen:Object.fromEntries(Object.keys(A.DATA.PROMPTS).map(id=>[id,true]))},life:1,quest:null,tutorial:{step:'done'},__artPreview:true};
    game.rescueCombat={st:A.Combat.create([player,...allies],foes,{})};return game;
  } finally { A.Character.resetIds(nextId); }
}
// Combat's skill toggles normally autosave. The art sandbox cannot write a life.
for(const method of ['saveGame','saveMeta']){
  const original=A.Save[method];
  A.Save[method]=function(game,...args){if(game&&game.__artPreview)return false;return original.call(this,game,...args);};
}
class AnimePreview extends Phaser.Scene {
  constructor(){super('AnimePreview');}
  init(data){this.ready=false;this.ch=data&&data.selected?Object.assign({},data.selected):person();this.form=null;this.location=(data&&data.location)||'port';this.mood='content';}
  preload(){Art.load(this);T().text(this,640,380,'Preparing the fitting room…',{size:24,ox:.5});}
  create(){
    this.cameras.main.setBackgroundColor('#131b26');
    const missing=Object.keys(Art.ASSETS).filter(id=>!this.textures.exists(Art.rawKey(id)));
    if(missing.length){T().text(this,640,300,'Art could not load. Please reopen the preview.',{size:22,ox:.5});T().button(this,520,400,240,46,'Back to title',()=>this.scene.start('Title'));return;}
    this.backdrop=Art.background(this,this.location);
    this.add.rectangle(640,40,1280,80,0x101b2a,.94);
    T().text(this,28,18,'THE ADVENTURER ATELIER',{size:25,bold:true,color:'#f3dfb1'});
    T().text(this,29,51,'Character, wardrobe & wild-form study',{size:13,color:'#bdd0d9'});
    T().button(this,1050,20,205,40,'Back to title',()=>{this.events.once('shutdown',()=>Art.release(this.textures));this.scene.start('Title');},{size:15});
    this.add.rectangle(138,402,244,612,0x101b2a,.94);
    this.add.rectangle(1122,402,270,612,0x101b2a,.91);
    this.add.rectangle(626,704,696,73,0x101b2a,.92);
    const label=(y,s)=>T().text(this,30,y,s,{size:12,bold:true,color:'#b8cad0'});
    label(109,'CHARACTER');
    const ids=['aera','samurai','pirate','sentinel'];
    this.identityButton=T().button(this,28,132,220,37,'',()=>{const next=ids[(ids.indexOf(this.ch.animeIdentity)+1)%ids.length];this.ch=person(next);this.form=null;this.redraw();},{size:15});
    label(185,'EQUIPPED SET');
    this.gearButton=T().button(this,28,208,220,39,'',()=>{if(this.ch.animeIdentity!=='aera')return;const ids=['mage','oath','shinobi_gear'];this.ch.equippedSet=ids[(ids.indexOf(this.ch.equippedSet)+1)%ids.length];this.form=null;this.redraw();},{size:15});
    this.gearInfo=T().text(this,30,254,'',{size:12,color:'#c0cbd2',wrap:211});
    label(303,'SKIN TONE');
    this.toneButton=T().button(this,28,326,220,35,'',()=>{if(this.ch.animeIdentity!=='aera')return;const ts=Object.keys(Art.TONES);this.ch.animeTone=ts[(ts.indexOf(this.ch.animeTone)+1)%ts.length];this.redraw();},{size:14});
    label(378,'DRUID FORMS');
    ['werewolf','werebear','panther'].forEach((id,i)=>T().button(this,28+i*75,402,70,34,({werewolf:'Wolf',werebear:'Bear',panther:'Cat'})[id],()=>this.transform(id),{size:13}));
    T().button(this,28,445,220,33,'Return to equipped outfit',()=>this.transform(null),{size:13});
    this.motionButton=T().button(this,28,498,220,32,'',()=>{Art.motion.breathing=!Art.motion.breathing;this.updateLabels();},{size:13});
    this.secondaryButton=T().button(this,28,537,220,32,'',()=>{Art.motion.secondary=!Art.motion.secondary;this.updateLabels();},{size:13});
    T().button(this,28,591,220,38,'Try a combat encounter',()=>{if(this.ch.animeIdentity==='sentinel')this.ch=person();this.scene.start('AnimeCombat',{selected:this.ch,location:this.location});},{size:14,color:'#f5df9e'});
    T().button(this,28,639,220,34,'Preview dialogue',()=>this.dialogue(),{size:14});
    T().text(this,1122,119,'CURRENT GAME ART',{size:12,ox:.5,color:'#b8cad0'});
    T().text(this,1122,378,'NEW ART · COMBAT SIZE',{size:12,ox:.5,color:'#b8cad0'});
    this.nameText=T().text(this,626,100,'',{size:27,ox:.5,color:'#ffffff',bold:true});
    this.statusText=T().text(this,626,138,'',{size:13,ox:.5,color:'#ecede1'}).setDepth(20).setStroke('#10202c',3);
    this.note=T().text(this,299,685,'',{size:13,wrap:645,color:'#d0dbe1'});
    T().button(this,1005,636,235,35,'Change expression',()=>{const ids=A.Portraits.MOOD_IDS;this.mood=ids[(ids.indexOf(this.mood)+1)%ids.length];this.setMood();},{size:14});
    T().button(this,1005,681,235,35,'Port / forest ruins',()=>{this.location=this.location==='port'?'forest':'port';this.backdrop.destroy(true);this.backdrop=Art.background(this,this.location);},{size:14});
    this.redraw();this.ready=true;
  }
  updateLabels(){
    this.identityButton.txt.setText(this.ch.name+'  ›');
    this.gearButton.txt.setText((A.DATA.GEAR_SETS[this.ch.equippedSet]||{name:'Sentinel armor'}).name+(this.ch.animeIdentity==='aera'?'  ›':''));
    this.gearInfo.setText(this.ch.animeIdentity==='aera'?'Cycle three outfit prototypes on one fixed head and face.':'Authored costume study. More wardrobe variants follow.');
    this.toneButton.txt.setText(this.ch.animeIdentity==='aera'?(this.ch.animeTone==='original'?'Original warm brown':this.ch.animeTone)+'  ›':'Authored skin palette');
    this.motionButton.txt.setText('Breathing: '+(Art.motion.breathing?'on':'off'));
    this.secondaryButton.txt.setText('Secondary motion: '+(Art.motion.secondary?'on':'off'));
  }
  redraw(){
    [this.hero,this.small,this.legacy].forEach(o=>{if(o)o.destroy();});
    const id=this.form||Art.resolve(this.ch);
    const full=Art.key(this,this.ch,id,'full'),bust=Art.key(this,this.ch,id,'bust');
    this.hero=this.add.image(626,404,full).setDisplaySize(440,550).setDepth(0);Art.attach(this,this.hero,this.ch);
    this.small=this.add.image(1122,511,bust).setDisplaySize(164,209);Art.attach(this,this.small,this.ch);
    const old=this.form?Art.original.beastKey.call(A.Portraits,this,this.ch,this.form):Art.original.key.call(A.Portraits,this,this.ch);
    this.legacy=this.add.image(1122,251,old).setDisplaySize(164,209);
    this.nameText.setText(this.form?this.form[0].toUpperCase()+this.form.slice(1):this.ch.name);
    this.note.setText(this.form?'Your equipped set is retained while transformed. Returning restores that exact outfit.':'Outfit prototypes use a shared face and head. The wardrobe includes 15 smith sets and 8 faction or unique sets.');
    this.updateLabels();this.setMood();
  }
  setMood(){for(const img of [this.hero,this.small])A.Portraits.express(this,img,this.ch,img.texture.key,this.mood,1);this.statusText.setText(this.mood+' · '+(this.form?'druid form':(A.DATA.GEAR_SETS[this.ch.equippedSet]||{name:'construct'}).name));}
  transform(form){this.form=form;this.redraw();this.hero.setAlpha(.1);this.tweens.add({targets:this.hero,alpha:1,duration:340});}
  dialogue(){
    const ch=Object.assign({},this.ch,{isPlayer:true});
    const game={world:{seed:1,questClock:0,characters:[ch],playerId:ch.id,eventFeed:[]},player:ch};
    const line='The armor stays in the magic. I checked. Coming back from a fight wearing nothing but a leaf is a mistake you make once.';
    this.dialogueCard=A.DialogueBox.showText(this,game,ch,line,()=>{}, {raw:'[amused] '+line,recipient:'To the company'});
  }
}
class AnimeCombat extends A.CombatScene {
  constructor(){super('AnimeCombat');}
  init(data){super.init({mode:'rescue'});this.selected=Object.assign({},data.selected);this.location=data.location||'port';}
  create(){
    this.previousGame=this.registry.get('game');this.previewGame=demoGame(this.selected);this.registry.set('game',this.previewGame);
    this.events.once('shutdown',()=>{if(this.registry.get('game')===this.previewGame)this.registry.set('game',this.previousGame);});
    super.create();
    if(this.battleArt)this.battleArt.destroy(true);this.battleArt=Art.background(this,this.location);
    const scrim=this.add.graphics().setDepth(-19);scrim.fillStyle(0x101925,.83);scrim.fillRect(0,0,1280,112);scrim.fillRect(0,623,1280,137);
    if(this.__weatherCleanup)this.__weatherCleanup();
    T().button(this,1050,686,205,40,'Return to fitting room',()=>this.leave(),{size:14});
  }
  wantsCombatHatred(){return false;}
  finish(){if(this.ended)return;this.ended=true;this.banner.setText('Sample encounter complete · return to the fitting room');}
  leave(){this.scene.start('AnimePreview',{selected:this.selected,location:this.location});}
}
A.AnimePreviewScene=AnimePreview;A.AnimeCombatScene=AnimeCombat;
})();
