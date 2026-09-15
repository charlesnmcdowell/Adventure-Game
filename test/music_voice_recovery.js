'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const H=require('./harness'), A=H.load();
const warnings=[], realWarn=console.warn, realInterval=globalThis.setInterval;
console.warn=(...args)=>warnings.push(args);
globalThis.setInterval=()=>null;
globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}};
globalThis.localStorage=H.memBackend();
class AudioStub {
 constructor(src){this.src=src;this.paused=true;this.ended=false;this.currentTime=0;this.volume=1;this.handlers={};this.requests=[];this.loads=0;}
 addEventListener(name,fn){(this.handlers[name]||=[]).push(fn);}
 play(){this.paused=false;return new Promise((resolve,reject)=>this.requests.push({resolve,reject}));}
 pause(){this.paused=true;}
 load(){this.error=null;this.loads++;}
 removeAttribute(){}
 fire(name){for(const fn of this.handlers[name]||[])fn();}
}
globalThis.Audio=AudioStub;
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../js/ui/music.js'),'utf8'),{filename:'music.js'});
const M=A.Music, flush=()=>new Promise(resolve=>setImmediate(resolve));
const speak=()=>{M.speakCampaign('lucan','q13_steps',1);return M.voiceEl;};
(async()=>{
 try {
  let v=speak();v.requests[0].resolve();await flush();
  M.toggleMute();assert(v.paused);M.toggleMute();
  assert.equal(v.requests.length,2,'unmute resumes the current line');
  v.requests[1].resolve();await flush();assert(!v.paused);

  M.toggleMute();v=speak();assert.equal(v.requests.length,0);
  M.toggleMute();assert.equal(v.requests.length,1,'a line shown while muted starts on unmute');
  v.requests[0].resolve();await flush();

  // Backgrounding while a request is still loading preserves the line.
  v=speak();M.halt(false);M.wake();assert.equal(v.requests.length,2);
  v.requests[1].resolve();await flush();
  v.requests[0].resolve();await flush();
  assert(!v.paused,'an older play promise cannot silence a newer resume');

  v=speak();v.paused=true;
  v.requests[0].reject(Object.assign(new Error('User gesture required'),{name:'NotAllowedError'}));await flush();
  assert(v.__playBlocked);assert.equal(v.__playError,'NotAllowedError');
  assert(warnings.some(w=>w[1].includes('lucan/q13_steps_1.mp3')),'failed playback identifies its exact recording');
  assert(M.replayVoice(v));assert.equal(v.requests.length,2);
  v.requests[1].resolve();await flush();assert(!v.paused);assert.equal(v.__playError,null);

  v.error={code:2};v.fire('error');
  assert.equal(v.__playError,'MediaError:2');
  assert(M.replayVoice(v));assert.equal(v.loads,1,'retry reloads a failed media request');
  v.requests[2].resolve();await flush();
  M.replayVoice(v);const old=v;v=speak();
  assert.equal(M.replayVoice(old),false,'a dismissed line cannot replace the current speaker');
  assert.equal(M.voiceEl,v);
  old.requests[3].reject(new Error('stale'));await flush();assert.equal(v.__playError,null);

  v.requests[0].resolve();await flush();v.ended=true;v.paused=true;v.fire('ended');
  M.toggleMute();M.toggleMute();assert.equal(v.requests.length,1,'unmute does not replay a finished line');
  M.stopVoice();assert.equal(M.replayVoice(v),false);
  console.log('Voice recovery: mute, background, pending-play race, blocked/load-failed retry, and stale-line guards passed.');
 } finally {console.warn=realWarn;globalThis.setInterval=realInterval;M.stopVoice();}
})().catch(e=>{console.error(e);process.exitCode=1;});
