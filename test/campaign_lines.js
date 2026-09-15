'use strict';
const assert = require('assert/strict');
const H = require('./harness'), A = H.load();

const game = { meta: {} };
const who = 'vanekessler';
const first = A.DATA.CAMPAIGN2_DIALOGUE.navy.vanekessler.first;
assert.ok(first && first[1], 'navy introduction still names the hanging');
A.Campaign.markSpoken(game, who, first[1]);
const war = A.DATA.FACTION_WAR_DIALOGUE.tally.boss;
assert.ok(war.length >= 4, 'anti-piracy boss remarks have a rotation pool');
const firstWar = A.Campaign.pickSpoken(game, who, war, { limit: 2 });
assert.ok(firstWar.length, 'war still has something to say');
assert.ok(firstWar.every(l => !/hanged/i.test(l.t)), 'Kessler does not reuse the hanging line across events');
firstWar.forEach(l => A.Campaign.markSpoken(game, who, l));
const secondWar = A.Campaign.pickSpoken(game, who, war, { limit: 2 });
assert.ok(secondWar.every(l => !firstWar.some(x => x.t === l.t)), 'a second patrol does not repeat the last pair');

const g2 = { meta: {} };
const a = A.Campaign.pickSpoken(g2, who, war, { limit: 2 });
a.forEach(l => A.Campaign.markSpoken(g2, who, l));
const b = A.Campaign.pickSpoken(g2, who, war, { limit: 2 });
assert.ok(b.every(l => !a.some(x => x.t === l.t)), 'unused war lines come out before a reuse');

for (const p of Object.values(A.DATA.DIALOGUE).filter(x => !x.hidden && x.combat_hatred)) {
  assert.match(p.combat_hatred.join(' '), /fuck|shit|damn|hell|bitch/i, p.id + ' combat hatred still swears');
}
assert.doesNotMatch(JSON.stringify(A.DATA.DIALOGUE.M04.combat_hatred), /bastard/i);
assert.match(A.DATA.FACTION_WAR_DIALOGUE.tally.boss.map(l => l.t).join(' '), /punk ass bitch|fuck|hell|damn/i);
assert.match(A.DATA.CAMPAIGN2_DIALOGUE.navy.vanekessler.fight.map(l => l.t).join(' '), /bitch|fuck|damn/i);
console.log('Campaign line rotation and cursing checks passed.');
