'use strict';
const assert=require('assert/strict'),{install}=require('../js/ui/mobile_viewport');
function fixture(){
 const listeners={},classes=new Set(),props={},memory=new Map();let pending;
 const listen=(scope)=>(event,fn)=>{listeners[scope+event]=fn;};
 const media={matches:false,addEventListener:listen('media:')};
 const box={setAttribute(k,v){this[k]=v;}},close={addEventListener:listen('close:')};
 const doc={body:{classList:{contains:c=>classes.has(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}},documentElement:{style:{setProperty:(k,v)=>props[k]=v}},getElementById:id=>id==='rotate'?box:id==='rotate-dismiss'?close:null,addEventListener:listen('doc:')};
 const win={innerWidth:390,innerHeight:844,navigator:{userAgent:'iPhone Messenger'},matchMedia:()=>media,visualViewport:{width:390,height:844,addEventListener:listen('vv:')},sessionStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},addEventListener:listen('win:'),clearTimeout(){pending=null;},setTimeout(fn,ms){assert.equal(ms,150);pending=fn;return 1;}};
 const api=install(win,doc,null);const fire=k=>{assert.equal(typeof listeners[k],'function',k+' is subscribed');listeners[k]();assert(pending,k+' debounces');pending();};
 return{win,doc,media,classes,props,box,close,memory,api,fire,listeners};
}
let f=fixture();assert(f.classes.has('rotate-required'));
f.win.innerWidth=844;f.win.innerHeight=390;f.media.matches=true;f.fire('media:change');
assert(!f.classes.has('rotate-required'),'landscape hides overlay despite stale portrait visualViewport');assert.equal(f.props['--adv-view-width'],'844px');assert.equal(f.box['aria-hidden'],'true');assert(f.box.inert);
for(const trigger of ['win:resize','vv:resize','win:pageshow','doc:visibilitychange']){
 f=fixture();f.win.innerWidth=844;f.win.innerHeight=390;f.fire(trigger);assert(!f.classes.has('rotate-required'),trigger+' handles stale media value using layout');
}
f=fixture();f.media.matches=true;f.fire('media:change');assert(!f.classes.has('rotate-required'),'media event works even when both size APIs are stale');
f=fixture();f.listeners['close:click']();assert(!f.classes.has('rotate-required'));f.fire('win:resize');assert(!f.classes.has('rotate-required'),'manual dismissal survives later resize');assert.equal(f.memory.get('adv:rotate-dismissed'),'1');
f=fixture();f.win.sessionStorage.setItem=()=>{throw Error('blocked');};f.api.dismiss();assert(!f.classes.has('rotate-required'),'escape works with blocked storage');
f=fixture();f.classes.add('mobile-launch');f.api.refit();assert(!f.classes.has('rotate-required'),'phone launch menu works in portrait');f.classes.delete('mobile-launch');f.api.refit();assert(f.classes.has('rotate-required'),'gameplay retains landscape reminder');
f=fixture();f.win.visualViewport.height=270;f.fire('vv:resize');assert(f.classes.has('rotate-required'),'portrait keyboard does not masquerade as rotation');
f=fixture();f.classes.add('mobile-loading');f.api.refit();assert(!f.classes.has('rotate-required'),'initial loading does not flash a portrait blocker');
console.log('Mobile viewport regression: orientation, stale dimensions, all event fallbacks, debounce, escape and launch exemption passed.');
