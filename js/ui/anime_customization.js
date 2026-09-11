// Appearance choices are cosmetic and independent of personality/voice or equipped gear.
(function(){
'use strict';
const A=ADV,T=A.T;
A.AnimeCustomization={open(scene,selection,done){
 const owned=[],keep=o=>(owned.push(o),o),draft=Object.assign({},selection.appearance||{});
 const ch={sex:selection.sex,portraitKind:'player',portraitSlot:selection.slot,equippedSet:'plain',portraitSeed:selection.slot*7919+(selection.sex==='f'?13:29),appearance:draft};
 const initial=A.AnimeWorld.identity(ch);for(const k of ['head','iris','eyeType','mouthType','lipColor'])if(draft[k]==null)draft[k]=initial[k];
 const depth=1100;keep(scene.add.rectangle(640,380,1280,760,0x08111e,.96).setDepth(depth).setInteractive());
 keep(T.text(scene,640,55,'Make it your face',{size:30,display:true,ox:.5,color:T.css.gold}).setDepth(depth+1));
 keep(T.text(scene,640,94,'Your appearance stays yours when equipment changes.',{size:14,ox:.5,color:T.css.inkDim}).setDepth(depth+1));
 const img=keep(scene.add.image(314,395,A.Portraits.key(scene,ch)).setDisplaySize(330,420).setDepth(depth+1));
 A.Portraits.animate(scene,img,ch,img.texture.key);A.Portraits.express(scene,img,ch,img.texture.key,'content',.7);
 const labels=[],buttons=[],swatches={};
 function button(x,y,w,text,fn){const b=T.button(scene,x,y,w,38,text,fn,{size:14});b.g.setDepth(depth+2);b.txt.setDepth(depth+3);b.zone.setDepth(depth+4);buttons.push(b);return b;}
 const rows=[['head','Hair & face',()=>A.AnimeWorld.headNames[ch.sex]],['eyeType','Eye shape',()=>['Almond','Round','Hooded','Upswept','Downturned']],['mouthType','Mouth shape',()=>['Balanced','Full','Cupid’s bow','Wide','Fine']],['iris','Eye color',()=>A.AnimeWorld.EYES],['lipColor','Lip color',()=>A.AnimeWorld.LIPS]];
 function render(){img.setTexture(A.Portraits.key(scene,ch));rows.forEach(([key,label,get],i)=>{const list=get(),v=draft[key],index=typeof v==='number'?v:list.indexOf(v);labels[i].setText(label+'\n'+(key==='iris'||key==='lipColor'?A.AnimeWorld.colorNames[v]||v:list[index]));if(swatches[key])swatches[key].setFillStyle(parseInt(v.slice(1),16));});}
 rows.forEach(([key,label,get],i)=>{const y=171+i*83;labels.push(keep(T.text(scene,784,y+3,label,{size:16,ox:.5,align:'center',color:T.css.ink}).setDepth(depth+2)));const cycle=d=>{const list=get(),v=draft[key],index=typeof v==='number'?v:list.indexOf(v),next=(index+d+list.length)%list.length;draft[key]=typeof v==='number'?next:list[next];render();};button(572,y,60,'‹',()=>cycle(-1));button(954,y,60,'›',()=>cycle(1));});
 for(const [key,i]of [['iris',3],['lipColor',4]])swatches[key]=keep(scene.add.circle(907,194+i*83,10,0xffffff).setStrokeStyle(1,0xe9dec8).setDepth(depth+3));
 const close=save=>{buttons.forEach(b=>b.destroy());owned.forEach(o=>o.destroy());if(save)selection.appearance=Object.assign({},draft);if(done)done(save);};
 button(556,640,210,'Keep this appearance',()=>close(true));button(792,640,210,'Back',()=>close(false));render();
}};
})();
