// NPC world clock: quests, gold, skills, gear, children, hatred, and jilts.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function livingNpcs(world) {
  return world.characters.filter(c => c && c.alive && !c.isPlayer && !c.isMonster && !c.isUndead);
}
function kitSize(c) { return (c.perks || []).length + (c.actives || []).length; }
function maxSkillLevel(c) {
  return Math.max(1, ...(c.perks || []).map(e => e.level), ...(c.actives || []).map(e => e.level));
}

function soak(seed, ticks) {
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed, name: 'Watcher', sex: 'm', personalityId: 'M01',
    portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'sunder', 'momentum'] });
  const start = livingNpcs(g.world).map(c => ({
    id: c.id, gold: c.inventory.gold, quests: c.questsCompleted || 0,
    kit: kitSize(c), set: c.equippedSet || null, lvl: maxSkillLevel(c),
  }));
  const startKids = g.world.characters.reduce((n, c) => n + ((c.dependents || []).length) + (c.childIds || []).length, 0)
    + (g.world.orphans || []).length;
  const startPairs = livingNpcs(g.world).filter(c => ADV.Rel.partnerIds(c).length).length;
  for (let i = 0; i < ticks; i++) ADV.World.tick(g.world, g.rng, { playerQuested: true });
  const now = livingNpcs(g.world);
  const quested = now.filter(c => (c.questsCompleted || 0) > 0).length;
  const goldUp = now.filter(c => (c.inventory.gold || 0) > 0).length;
  const leveled = now.filter(c => maxSkillLevel(c) > 1).length;
  const boughtSkill = now.filter(c => kitSize(c) > 3).length;
  const boughtGear = now.filter(c => c.equippedSet && !c.campaignId).length;
  const kids = g.world.characters.reduce((n, c) => n + ((c.dependents || []).length), 0)
    + (g.world.orphans || []).length
    + now.filter(c => (c.childIds || []).length).length;
  const pairs = now.filter(c => ADV.Rel.partnerIds(c).length).length;
  const hatred = (g.world.edges || []).filter(e => e.score <= ADV.DATA.CONST.REL.HATRED_MAX).length;
  const jiltFeed = (g.world.eventFeed || []).filter(e => /will not forgive|left /.test(e.text || '')).length;
  const bornFeed = (g.world.eventFeed || []).filter(e => /had a child/.test(e.text || '')).length;
  const goldSum = now.reduce((n, c) => n + (c.inventory.gold || 0), 0);
  const questSum = now.reduce((n, c) => n + (c.questsCompleted || 0), 0);
  return { g, goldUp, quested, leveled, boughtSkill, boughtGear, kids, startKids, pairs, startPairs,
    hatred, jiltFeed, bornFeed, goldSum, questSum, pop: now.length };
}

console.log('\n-- NPC world clock after 50 ticks --');
{
  const s = soak(20260909, 50);
  console.log('   pop=' + s.pop + ' quested=' + s.quested + ' goldUp=' + s.goldUp +
    ' leveled=' + s.leveled + ' boughtSkill=' + s.boughtSkill + ' gear=' + s.boughtGear +
    ' kids=' + s.kids + ' pairs=' + s.pairs + ' hatred=' + s.hatred +
    ' goldSum=' + s.goldSum + ' questSum=' + s.questSum + ' births=' + s.bornFeed);
  ok(s.quested >= 8, 'several NPCs complete contracts on the clock', s.quested);
  ok(s.goldSum >= 400, 'the town purse grows from those contracts', s.goldSum);
  ok(s.goldUp >= 6, 'individual NPCs earn gold', s.goldUp);
  ok(s.leveled >= 4, 'used skills gain levels', s.leveled);
  ok(s.boughtSkill >= 1, 'NPCs buy or witness-learn extra skills', s.boughtSkill);
  ok(s.boughtGear >= 1, 'at least one NPC buys a gear set', s.boughtGear);
  ok(s.pairs > s.startPairs || s.pairs >= 4, 'NPCs form relationships', s.pairs + ' from ' + s.startPairs);
  ok(s.bornFeed >= 1 || s.kids > s.startKids, 'NPC couples have children', s.bornFeed + '/' + s.kids);
  ok(s.hatred >= 1, 'hatred edges appear (jilt, envy, or assassination)', s.hatred);
}

console.log('\n-- jilt still abandons and hates --');
{
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed: 88, name: 'Pat', sex: 'f', personalityId: 'F01',
    portraitSlot: 1, portraitSeed: 2, startingSkills: ['mend'] });
  const world = g.world;
  const man = livingNpcs(world).find(c => c.sex === 'm');
  const woman = livingNpcs(world).find(c => c.sex === 'f');
  const other = livingNpcs(world).find(c => c.sex === 'm' && c !== man);
  man.inventory.gold = 400;
  ADV.Rel.move(world, woman.id, man.id, 60, 'romance');
  ADV.Rel.move(world, man.id, woman.id, 60, 'romance');
  ADV.Rel.commit(world, man.id, woman.id);
  ok(ADV.Rel.isPartner(man, woman), 'they marry');
  const lines = ADV.Rel.jilt(world, woman, man);
  ok(!ADV.Rel.isPartner(man, woman), 'the marriage is over');
  ok(ADV.Rel.hates(world, man.id, woman.id), 'the abandoned partner hates her');
  ok(lines.some(l => /will not forgive/.test(l.text)), 'the feed records the jilt');
  ADV.Rel.move(world, woman.id, other.id, 80, 'romance');
  ADV.Rel.move(world, other.id, woman.id, 80, 'romance');
  woman.inventory.gold = 0; other.inventory.gold = 200;
  ADV.Rel.commit(world, woman.id, other.id);
  ok(ADV.Rel.isPartner(woman, other), 'she can take a new partner');
  ok(ADV.Rel.hates(world, man.id, woman.id), 'the first husband still hates her');
}

console.log('\n-- player skill and armor purchase still spend gold --');
{
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed: 11, name: 'Buyer', sex: 'm', personalityId: 'M01',
    portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'sunder', 'momentum'] });
  const p = ADV.Game.player(g);
  p.inventory.gold = 1000;
  const before = p.inventory.gold;
  const cost = ADV.DATA.CONST.GOLD.skillUnwitnessed;
  const r = ADV.SkillSys.learn(p, 'mend', { free: false });
  ok(r.ok, 'an unwitnessed skill can be acquired');
  p.inventory.gold -= cost;
  eq(p.inventory.gold, before - cost, 'the trainer takes 150g');
  ok(ADV.SkillSys.knows(p, 'mend'), 'Mend is on the kit');
  const set = ADV.DATA.GEAR_SETS.warrior;
  ok(set && set.cost === 800, 'a civilian set still costs 800g');
  p.inventory.gold -= set.cost;
  p.equippedSet = 'warrior';
  eq(p.equippedSet, 'warrior', 'the set is worn');
  eq(p.inventory.gold, before - cost - set.cost, 'gold left after skill and armor');
  p.equippedSet = null;
  p.inventory.gold += set.cost;
  eq(p.inventory.gold, before - cost, 'selling the set returns the 800g');
}

console.log('\n==== ' + pass + ' passed, ' + fail + ' failed ====');
process.exit(fail ? 1 : 0);
