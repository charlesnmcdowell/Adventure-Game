'use strict';
const assert = require('node:assert/strict');
const {load, memBackend} = require('./harness');
const A = load(), C = A.Campaign3;
function fresh(company = ['fennick', 'wren_ward']) {
  A.Save.setBackend(memBackend());
  const g = A.Game.newGame({seed: 913, name: 'Journey test', sex: 'f', startingSkills: ['mend']});
  Object.assign(C.state(g), {stage: 4, started: true, recruited: ['fennick', 'wren_ward'], company});
  const p = A.Game.player(g); p.inventory.gold = 1000;
  const q = C.buildQuest(g, 5);
  assert.equal(A.Game.startQuest(g, q, {}).ok, true);
  g.quest.departureShown = true;
  return g;
}
for (const company of [[], ['fennick'], ['wren_ward'], ['fennick', 'wren_ward']]) {
  const g = fresh(company), beats = C.openerBeats(g, g.quest.quest, 2);
  assert.equal(beats.filter(b => b.who === 'fennick' && b.key === 'q5_camp').length, company.includes('fennick') ? 1 : 0);
  assert.equal(beats.filter(b => b.who === 'wren_ward' && b.key === 'q5_camp').length, company.includes('wren_ward') ? 1 : 0);
  assert.equal(beats.filter(b => b.choice === 'q5_camp').length, company.length ? 1 : 0);
  if (company.length) assert.ok(C.options(g, 'q5_camp').some(o => o.id === 'storm'));
}
for (const [route, text] of [['pay', 'Femi’s map'], ['pocket', 'map Hiwot lifted'], ['beat', 'courier’s papers']]) {
  const g = fresh(), q = g.quest, p = A.Game.player(g), gold = p.inventory.gold;
  assert.equal(q.quest.encounters.length, 4);
  assert.equal(C.travelBridge(g), null, 'do not travel before the inn');
  C.applyOption(g, 'q5_verlan', C.options(g, 'q5_verlan').find(o => o.id === route));
  if (route === 'beat') {
    assert.equal(q.encIdx, 0, 'fighting the courier is still required');
    assert.equal(C.travelBridge(g), null);
    // Simulate the next-encounter state reached by a victory; the full campaign
    // suite separately exercises the real combat and finishCombat path.
    q.encIdx = 1; q.enemies = null;
  } else assert.equal(q.encIdx, 1, 'map purchase/theft bypasses only the courier');
  assert.equal(p.inventory.gold, gold - (route === 'pay' ? 50 : 0));
  const before = JSON.stringify({gold: p.inventory.gold, world: g.world.questClock, enc: q.encIdx});
  const bridge = C.travelBridge(g);
  assert.ok(bridge.caption.includes(text));
  assert.ok(bridge.arrivalCaption.includes('soldiers block the path'));
  assert.equal(bridge.location, 'gate_holloway');
  assert.equal(JSON.stringify({gold: p.inventory.gold, world: g.world.questClock, enc: q.encIdx}), before);
  assert.ok(C.openerBeats(g, q.quest, 1).some(b => b.who === 'ilvara' && b.caption.includes('on the way to the bandit camp')));
  q.__q5ValeJourney = true;
  assert.equal(C.travelBridge(g), null, 'scene restart does not replay the bridge');
  delete q.__q5ValeJourney; q.failed = true;
  assert.equal(C.travelBridge(g), null);
  q.failed = false; q.encIdx = 2;
  assert.equal(C.travelBridge(g), null, 'later encounters never replay the bridge');
}
console.log('Q5 flow passed: four company combinations, three courier routes, map recovery, once per run, no extra encounter/cost.');
