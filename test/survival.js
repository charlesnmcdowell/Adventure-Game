// Hunger, shelter, sickness, and save compatibility.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function newGame(seed) {
  ADV.Save.setBackend(memBackend());
  return ADV.Game.newGame({ seed: seed || 3, name: 'Pat', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
}

console.log('\n-- hunger stacks --');
(function () {
  const g = newGame(3);
  const p = ADV.Game.player(g);
  eq(ADV.Survival.statMult(p), 1, 'fed start is full strength');
  p.meal = null;
  ADV.Survival.onQuestResolved(g);
  eq(ADV.Survival.state(p).hunger, 1, 'one missed meal is one stack');
  eq(ADV.Survival.statMult(p), 0.75, 'one stack is 0.75');
  ADV.Survival.onQuestResolved(g);
  eq(ADV.Survival.statMult(p), 0.50, 'two stacks are 0.50');
  ADV.Survival.onQuestResolved(g);
  eq(ADV.Survival.statMult(p), 0.25, 'three stacks are 0.25');
  ok(!g.pendingDeath, 'three stacks do not kill');
  ADV.Survival.onQuestResolved(g);
  eq(ADV.Survival.statMult(p), 0, 'four stacks are 0');
  ok(!!g.pendingDeath, 'four stacks kill');
  ok(g.pendingDeath.route && (g.pendingDeath.route.mode === 'reincarnation' || g.pendingDeath.route.mode === 'nepotism'), 'hunger death uses the normal death route');
})();

console.log('\n-- a meal clears every hunger stack --');
(function () {
  const g = newGame(4);
  const p = ADV.Game.player(g);
  p.inventory.gold = 50;
  ADV.Survival.state(p).hunger = 3;
  const r = ADV.Character.eat(p, 'bread');
  ok(r.ok && r.cured, 'eating reports a cure');
  eq(ADV.Survival.state(p).hunger, 0, 'one meal wipes the stack');
  eq(ADV.Survival.statMult(p), 1, 'strength returns after eating');
})();

console.log('\n-- HP follows the multiplier and clamps --');
(function () {
  const g = newGame(5);
  const p = ADV.Game.player(g);
  const full = ADV.Character.maxHp(p);
  p.combatHp = full;
  ADV.Survival.state(p).hunger = 2;
  const half = ADV.Character.maxHp(p);
  eq(half, Math.round(full * 0.5), 'max HP halves at two stacks');
  ADV.Survival.state(p).hunger = 2;
  if (p.combatHp > half) p.combatHp = half;
  ADV.Survival.onQuestResolved(g); // +1 hunger, clamps
  ok(p.combatHp <= ADV.Character.maxHp(p), 'current HP clamps to the new max');
})();

console.log('\n-- NPCs are never affected --');
(function () {
  const g = newGame(6);
  const npc = g.world.characters.find(c => !c.isPlayer && c.alive);
  ok(npc, 'an NPC exists');
  npc.survival = { hunger: 4, questsSinceShelter: 9, sick: true, sickStacks: 4 };
  eq(ADV.Survival.statMult(npc), 1, 'an NPC at four stacks is still full strength');
  const before = ADV.Character.maxHp(npc);
  npc.survival.hunger = 0;
  eq(ADV.Character.maxHp(npc), before, 'NPC max HP ignores a fake hunger record');
})();

console.log('\n-- shelter clock and sickness --');
(function () {
  const g = newGame(7);
  const p = ADV.Game.player(g);
  p.inventory.gold = 2000;
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } };
  for (let i = 0; i < 4; i++) { p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } }; ADV.Survival.onQuestResolved(g); }
  eq(ADV.Survival.state(p).sick, false, 'four quests on a rung do not sicken');
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } };
  const fifth = ADV.Survival.onQuestResolved(g);
  ok(fifth.becameSick && ADV.Survival.state(p).sick, 'sickness fires on the fifth quest');
  eq(ADV.Survival.state(p).sickStacks, 1, 'first sickness is one stack');
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } };
  ADV.Survival.onQuestResolved(g);
  eq(ADV.Survival.state(p).sickStacks, 2, 'further nights add sickness stacks');
  const r = ADV.Housing.buy(g, 'inn');
  ok(r.ok, 'the inn can be bought');
  eq(ADV.Survival.state(p).sick, false, 'moving up clears sickness');
  eq(ADV.Survival.state(p).questsSinceShelter, 0, 'moving up resets the clock');
})();

console.log('\n-- brick house ends the clock --');
(function () {
  const g = newGame(8);
  const p = ADV.Game.player(g);
  p.inventory.gold = 5000;
  ADV.Housing.buy(g, 'inn');
  ADV.Housing.buy(g, 'cottage');
  ADV.Housing.buy(g, 'brick');
  for (let i = 0; i < 8; i++) { p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } }; ADV.Survival.onQuestResolved(g); }
  eq(ADV.Survival.state(p).sick, false, 'brick and above never sicken');
  eq(ADV.Survival.shelterDeadline(p), Infinity, 'the settled clock is closed');
})();

console.log('\n-- sickness jilts every spouse --');
(function () {
  const g = newGame(9);
  const p = ADV.Game.player(g);
  const w = g.world.characters.find(c => !c.isPlayer && c.alive && c.sex === 'f');
  ok(w, 'a spouse exists');
  ADV.Rel.commit(g.world, p.id, w.id);
  ok(ADV.Rel.isPartner(p, w), 'they are together');
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 10 } };
  ADV.Survival.state(p).questsSinceShelter = 4;
  const r = ADV.Survival.onQuestResolved(g);
  ok(r.becameSick && r.jilted >= 1, 'sickness jilts');
  ok(!ADV.Rel.isPartner(p, w), 'the spouse has left');
  ok(!!g.world.pendingPlayerJilt, 'pendingPlayerJilt is set');
})();

console.log('\n-- old save loads unpenalised --');
(function () {
  ADV.Save.setBackend(memBackend());
  const raw = {
    seed: 1, questClock: 30, eventFeed: [], activeHeroes: [], pendingRescues: [],
    pendingPopulation: [], orphans: [], divineOffers: [], pendingHeroInvites: [],
    pendingPlayerJilt: null, playerId: 'c1', metIds: [], parties: [],
    board: [], life: 1,
  };
  const p = ADV.Character.base({ id: 'c1', name: 'Old', sex: 'm', isPlayer: true, stats: { hp: 100, atk: 10, def: 10, spd: 10 }, homeId: 'camp' });
  delete p.survival;
  const store = memBackend();
  store.setItem('adv:world', JSON.stringify(raw));
  store.setItem('adv:characters', JSON.stringify([p]));
  store.setItem('adv:edges', JSON.stringify([]));
  store.setItem('adv:vaults', JSON.stringify([]));
  store.setItem('adv:meta', JSON.stringify({ journal: {}, skillLevels: {}, promptsSeen: {}, codexUnlocked: [], lives: 1 }));
  ADV.Save.setBackend(store);
  const loaded = ADV.Save.loadGame();
  const lp = loaded.world.characters[0];
  const st = ADV.Survival.state(lp);
  eq(st.hunger, 0, 'old save hunger is zero');
  eq(st.questsSinceShelter, 0, 'old save shelter clock is zero');
  eq(st.sick, false, 'old save is not sick');
  eq(ADV.Survival.statMult(lp), 1, 'old save is unpenalised');
  ok(lp.alive !== false, 'old save player is alive');
})();

console.log('\n-- no-gold opening: five quests, eat, reach the inn --');
(function () {
  const g = newGame(11);
  const p = ADV.Game.player(g);
  eq(p.inventory.gold, 0, 'starts at 0g');
  let meals = 0, died = false;
  for (let i = 0; i < 5; i++) {
    p.inventory.gold += ADV.DATA.CONST.QUEST_TIERS[1].soloPay;
    if (p.inventory.gold >= 5) {
      const e = ADV.Character.eat(p, 'bread');
      if (e.ok) meals++;
    }
    const r = ADV.Survival.onQuestResolved(g);
    if (r.died) died = true;
  }
  ok(!died, 'five fed quests do not kill');
  eq(meals, 5, 'cheapest meal is affordable every night');
  ok(p.inventory.gold >= 100, 'payouts cover the inn after five meals', p.inventory.gold);
  const inn = ADV.Housing.buy(g, 'inn');
  ok(inn.ok, 'the inn is reachable on a no-gold opening');
})();

console.log('\n-- new gear sets floor only their archetypes --');
(function () {
  const SAMPLE = { tank: 'taunt', fighter: 'cleave', rogue: 'backstab', mage: 'fire_bolt',
    druid: 'thorn_skin', ranger: 'aimed_shot', healer: 'mend' };
  const shop = Object.entries(ADV.DATA.GEAR_SETS).filter(([, s]) => s && !s.campaign);
  eq(ADV.DATA.GEAR_SETS.warrior.cost, 800, 'warrior set stays 800g');
  for (const [id, set] of shop) {
    const ch = ADV.Character.base({ stats: { hp: 100, atk: 10, def: 10, spd: 10 }, perkCap: 12, activeCap: 12 });
    for (const sid of Object.values(SAMPLE)) {
      const sk = ADV.DATA.SKILLS[sid];
      (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: sid, level: 1, uses: 0 });
    }
    ch.equippedSet = id;
    for (const [arch, sid] of Object.entries(SAMPLE)) {
      const sk = ADV.DATA.SKILLS[sid];
      const floor = ADV.SkillSys.gearFloor(ch, sk);
      const want = set.archetypes.includes(arch) ? (set.floor || ADV.DATA.CONST.GEAR_SET_FLOOR_LEVEL) : 0;
      eq(floor, want, id + ' floors ' + arch + ' at ' + want);
    }
  }
})();

console.log('\n==== ' + pass + ' passed, ' + fail + ' failed ====');
process.exit(fail ? 1 : 0);
