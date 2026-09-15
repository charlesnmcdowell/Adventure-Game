'use strict';
const assert=require('assert/strict'),{EventEmitter}=require('events'),A=require('./harness').load();
const initial=A.Display.subscriptionCount();
for(let j=0;j<10;j++){
 const owners=Array.from({length:100},()=>new EventEmitter());
 owners.forEach(owner=>A.Display.watch(()=>{},owner));assert.equal(A.Display.subscriptionCount(),initial+100);
 owners.forEach(owner=>owner.emit('destroy'));assert.equal(A.Display.subscriptionCount(),initial);
}
const dispose=A.Display.watch(()=>{});dispose();dispose();assert.equal(A.Display.subscriptionCount(),initial);
console.log('Scene subscriptions: 1,000 destroyed controls release listeners.');
