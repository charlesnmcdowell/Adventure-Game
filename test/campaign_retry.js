'use strict';
const assert=require('assert/strict'),h=require('./harness'),A=h.load();
A.Save.setBackend(h.memBackend());
let g=A.Game.newGame({seed:4823,name:'Retry',sex:'f',personalityId:'F01'});
A.Game.player(g).inventory.gold=10000;Object.assign(A.Campaign3.state(g),{started:true,stage:2});
assert(A.Game.startQuest(g,A.Campaign3.buildQuest(g,3)).ok);
const fee=A.Campaign3.options(g,'q3_tollan').find(o=>o.id==='fee');
A.Campaign3.applyOption(g,'q3_tollan',fee);
const gold=A.Game.player(g).inventory.gold,aff=A.Campaign3.aff(g,'wren_ward');
g=A.Game.load();assert.equal(g.quest,null);
assert(A.Game.startQuest(g,A.Campaign3.buildQuest(g,3)).ok);
A.Campaign3.applyOption(g,'q3_tollan',fee);
assert.equal(A.Game.player(g).inventory.gold,gold);assert.equal(A.Campaign3.aff(g,'wren_ward'),aff);
// Committed questions/recruits/perks survive; changing a settled payment cannot farm alternatives.
assert.deepEqual(A.Campaign3.options(g,'q3_tollan').filter(o=>!o.ask).map(o=>o.id),['fee']);
const pay=A.DATA.CAMPAIGN3_CHOICES.q5_verlan.options.find(o=>o.id==='pay');
g.quest={quest:A.Campaign3.buildQuest(g,5),encIdx:0};
A.Game.player(g).inventory.gold=10;
assert(!A.Campaign3.options(g,'q5_verlan').some(o=>o.id==='pay'));
assert(A.Campaign3.applyOption(g,'q5_verlan',pay).error);
A.Game.player(g).inventory.gold=100;
A.Campaign3.applyOption(g,'q5_verlan',pay);assert.equal(A.Game.player(g).inventory.gold,50);assert.equal(g.quest.encIdx,1);
A.Campaign3.applyOption(g,'q5_verlan',pay);assert.equal(g.quest.encIdx,1);
g=A.Game.load();g.quest={quest:A.Campaign3.buildQuest(g,5),encIdx:0};
A.Campaign3.applyOption(g,'q5_verlan',pay);assert.equal(A.Game.player(g).inventory.gold,50);assert.equal(g.quest.encIdx,1);
// The explicitly revisable summit changes outcomes without stacking affection.
const opts=A.DATA.CAMPAIGN3_CHOICES.q10_summit.options;
g.quest={quest:A.Campaign3.buildQuest(g,10),encIdx:1};
const baseline=A.Campaign3.aff(g,'cassian');
A.Campaign3.applyOption(g,'q10_summit',opts.find(o=>o.id==='kill'));
g.quest={quest:A.Campaign3.buildQuest(g,10),encIdx:1};
A.Campaign3.applyOption(g,'q10_summit',opts.find(o=>o.id==='arrest'));
assert.equal(A.Campaign3.aff(g,'cassian'),baseline+1);assert(A.Campaign3.flag(g,'leadersArrested'));
// Existing selected choices are migrated as paid, not replayed after the patch.
delete A.Campaign3.state(g).choiceEffects;
const before=A.Game.player(g).inventory.gold;A.Campaign3.applyOption(g,'q3_tollan',fee);
assert.equal(A.Game.player(g).inventory.gold,before);
console.log('Campaign retry: payments, costs, affection, bypass, alternatives and migration passed.');
