// Tests for the legacy pass: learned skills carry through EVERY death, no
// free picks after life one, father-based titles with a growing buff, and
// mother-only child naming.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const mem = memBackend;
const equippedIds = (ch) => ch.perks.concat(ch.actives).map(e => e.skillId).sort();

// ---------------- reincarnation: the learned set itself carries ----------------
(function () {
  console.log('\n-- skills carry through reincarnation --');
  ADV.Save.setBackend(mem());
  const g1 = ADV.Game.newGame({ seed: 11, name: 'First', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['aimed_shot', 'snare', 'marksman'] });
  const p1 = ADV.Game.player(g1);
  // grow: swap snare for a bought skill, level aimed shot
  p1.inventory.gold = 500;
  ADV.SkillSys.learn(p1, 'spark', {});
  const e = p1.actives.find(x => x.skillId === 'aimed_shot');
  e.uses = 130; e.level = 14; p1.skillLevels.aimed_shot = { level: 14, uses: 130 };
  const before = equippedIds(p1);

  ADV.Game.onPlayerDeath(g1, null);
  const route = g1.pendingDeath.route;
  eq(route.mode, 'reincarnation', 'no heir -> reincarnation');
  ADV.Game.continueAfterDeath(g1, { name: 'Second', sex: 'f', portraitSlot: 2, portraitSeed: 2, startingSkills: [] });
  const p2 = ADV.Game.player(g1);
  eq(JSON.stringify(equippedIds(p2)), JSON.stringify(before), 'same learned set equipped in the next life');
  eq(p2.actives.find(x => x.skillId === 'aimed_shot').level, 14, 'levels intact on the carried set');
  eq(ADV.SkillSys.freeSkillsRemaining(p2), 0, 'NO free picks in later lives');
  ok(ADV.SkillSys.trainerCost(p2, 'cleave') === 150, 'unwitnessed skills must be bought now');
})();

// ---------------- father-based legacy titles that grow ----------------
(function () {
  console.log('\n-- father legacy titles --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 21, name: 'Mother', sex: 'f', portraitSlot: 1, portraitSeed: 3, startingSkills: ['mend', 'triage', 'devoted'] });
  const world = g.world;
  const mom = ADV.Game.player(g);
  const dad = world.characters.find(c => c.sex === 'm' && !c.isPlayer);
  dad.rank = 3;
  // marry + force a child
  ADV.Rel.move(world, mom.id, dad.id, 60, 'romance');
  ADV.Rel.move(world, dad.id, mom.id, 60, 'romance');
  ADV.Rel.commit(world, mom.id, dad.id);
  const child = ADV.Character.makeDependent(g.rng, world, mom, dad.id);
  child.age = 10;
  child.name = 'Kaelenna'; // mother named at birth
  mom.dependents.push(child); mom.childIds.push(child.id); dad.childIds.push(child.id);

  const npc = ADV.Character.matureChild(g.rng, world, child);
  world.characters.push(npc);
  ok(npc.name.startsWith('Kaelenna'), "mother's chosen name survives to adulthood", npc.name);
  eq(npc.title, (npc.sex === 'f' ? 'Daughter of ' : 'Son of ') + dad.name, "title names the FATHER");
  const b0 = npc.titleBonus;
  ok(b0 >= 1, 'legacy buff present', b0);
  // father grows -> buff grows on the world clock
  dad.rank = 7; dad.questsCompleted = 48;
  const e2 = dad.actives[0]; e2.level = 20;
  ADV.World.tick(world, g.rng, { playerQuested: true });
  ok(npc.titleBonus > b0, 'buff grows while the father lives', npc.titleBonus + ' > ' + b0);
  // father dies -> buff freezes
  ADV.Death.finalize(world, dad, null, 'quest');
  const frozen = npc.titleBonus;
  ADV.World.tick(world, g.rng, { playerQuested: true });
  eq(npc.titleBonus, frozen, "buff frozen at the father's death");
})();

// ---------------- nepotism: carried set + father legacy + naming ----------------
(function () {
  console.log('\n-- nepotism inheritance --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 31, name: 'Matron', sex: 'f', portraitSlot: 1, portraitSeed: 4, startingSkills: ['mend', 'blood_pact', 'devoted'] });
  const world = g.world;
  const mom = ADV.Game.player(g);
  const dad = world.characters.find(c => c.sex === 'm' && !c.isPlayer);
  ADV.Rel.move(world, mom.id, dad.id, 60, 'romance');
  ADV.Rel.move(world, dad.id, mom.id, 60, 'romance');
  ADV.Rel.commit(world, mom.id, dad.id);
  const child = ADV.Character.makeDependent(g.rng, world, mom, dad.id);
  child.age = 6; // self-sufficient heir
  child.name = 'Wrenna';
  mom.dependents.push(child); mom.childIds.push(child.id);
  const momSet = equippedIds(mom);

  ADV.Game.onPlayerDeath(g, null);
  eq(g.pendingDeath.route.mode, 'nepotism', 'heir exists -> nepotism');
  ADV.Game.continueAfterDeath(g, {});
  const heir = ADV.Game.player(g);
  ok(heir.name.startsWith('Wrenna'), 'player-mother named the heir at birth', heir.name);
  eq(heir.title, (heir.sex === 'f' ? 'Daughter of ' : 'Son of ') + dad.name, 'heir title names the living NPC father');
  const heirSet = equippedIds(heir).filter(id => id !== 'demigod');
  eq(JSON.stringify(heirSet), JSON.stringify(momSet), "parent's learned set transfers to the heir");
  eq(ADV.SkillSys.freeSkillsRemaining(heir), 0, 'heir gets no free picks either');
  ok(world.questClock >= 0 && heir.fatherId === dad.id, 'heir keeps father link for the growing buff');
  const b0 = heir.titleBonus;
  dad.rank = 9;
  ADV.World.tick(world, g.rng, { playerQuested: true });
  ok(heir.titleBonus > b0, "heir's buff keeps growing while the NPC father lives");
})();

// ---------------- male player: mother NPC names the child ----------------
(function () {
  console.log('\n-- fathers do not name --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 41, name: 'Patriarch', sex: 'm', portraitSlot: 1, portraitSeed: 5, startingSkills: ['cleave', 'sunder', 'momentum'] });
  const world = g.world;
  const dadP = ADV.Game.player(g);
  dadP.homeId = 'brick';
  const momN = world.characters.find(c => c.sex === 'f' && !c.isPlayer);
  ADV.Rel.move(world, dadP.id, momN.id, 60, 'romance');
  ADV.Rel.move(world, momN.id, dadP.id, 60, 'romance');
  ADV.Rel.commit(world, dadP.id, momN.id);
  // run quests until conception (guaranteed by 10)
  for (let i = 0; i < 12 && !(momN.dependents || []).length; i++) {
    const q = g.board.find(x => x.tier === 1 && x.track === 'solo');
    const s = ADV.Game.startQuest(g, q, {});
    if (!s.ok) break;
    g.quest.encIdx = q.encounters.length; g.quest.readyToComplete = true;
    dadP.meal = { id: 'bread', name: 'Bread', bonus: { hp: 4 } };
    ADV.Game.completeQuest(g);
  }
  ok((momN.dependents || []).length > 0, 'child conceived with NPC mother');
  ok(!g.pendingChildNaming, 'male player is never asked to name the child');
  const kid = momN.dependents[0];
  ok(!kid.name, 'child name left to the mother (rolled at maturity)');
})();

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
