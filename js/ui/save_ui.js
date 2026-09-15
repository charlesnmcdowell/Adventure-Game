// Browser save controls stay outside Phaser's scene-local objects.
(function () {
'use strict';
let banner=null,modal=null;
function node(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
function button(text,fn){const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;}
function download(text,name){
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const SaveUI={};
SaveUI.show=function(game){
 if(modal)modal.remove();
 modal=node('dialog');modal.className='save-tools';modal.setAttribute('aria-label','Save backup');
 const close=()=>{modal?.close();modal?.remove();modal=null;};
 modal.append(node('h2','Save backup'),node('p','Download a copy of your adventure, or restore a backup you saved earlier. Restoring replaces the adventure in this browser.'));
 const status=node('p');status.setAttribute('role','status');
 if(ADV.Save.identityWarnings?.length)status.textContent='This older save contains repeated character IDs. Keep an exported copy; ambiguous historical links may need repair.';
 modal.append(button('Download backup',()=>download(ADV.Save.exportGame(game),'adventurer-save.json')));
 const label=node('label','Choose a backup to restore'),input=node('input');input.type='file';input.accept='.json,application/json';label.append(input);modal.append(label);
 const restore=button('Restore selected backup',async()=>{
  const file=input.files[0];if(!file){status.textContent='Choose a backup file first.';return;}
  if(file.size>12*1024*1024){status.textContent='This file is too large to be an Adventurer backup.';return;}
  if(!window.confirm('Replace your current adventure with this backup?'))return;
  let result;try{result=ADV.Save.importGame(await file.text());}catch(_){result={ok:false};}
  if(!result.ok){status.textContent='Could not restore this file. Your current save was kept.';return;}
  // Stop the current game before it can autosave over the imported snapshot.
  location.reload();
 });
 modal.append(restore,status,button('Close',close));modal.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.body.append(modal);modal.showModal();
};
ADV.Save.watch(result=>{
 if(result.ok){banner?.remove();banner=null;return;}
 if(banner)return;
 banner=node('aside');banner.className='save-warning';banner.setAttribute('role','alert');
 banner.append(node('p',result.error==='corrupt-save'?'This save could not be read. Download a recovery copy before starting a new adventure.':'Your latest progress could not be saved. Try again or download a backup before leaving.'));
 banner.append(button('Retry save',()=>{if(ADV.Save.lastGame)ADV.Save.saveGame(ADV.Save.lastGame);else ADV.Save.restoreBackup();}));
 banner.append(button('Download backup',()=>download(result.error==='corrupt-save'?ADV.Save.exportRaw():ADV.Save.exportGame(ADV.Save.lastGame),'adventurer-unsaved-backup.json')));
 banner.append(button('Dismiss',()=>{banner.remove();banner=null;}));document.body.append(banner);
});
ADV.SaveUI=SaveUI;
})();
