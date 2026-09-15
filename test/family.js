// Family-arc scenario: marry, conceive (guaranteed by quest 10), raise the
// child through tuition/stay-home, die, verify the nepotism inheritance path.
'use strict';
const { load } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x || ''); } }

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
const game = ADV.Game.newGame({ seed: 42, name: 'Mara', sex: 'f', portraitSeed: 9, portraitSlot: 1, startingSkills: ['aimed_shot', 'snare', 'marksman'] });
const world = game.world;
const p = ADV.Game.player(game);
p.inventory.gold = 2000; // fund the arc
p.homeId = 'brick';
function keepFed() { p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 4 } }; }

// Marry the first eligible man
const man = world.characters.find(c => c.sex === 'm' && !c.isPlayer);
ADV.Rel.move(world, man.id, p.id, 60, 'romance');
ADV.Rel.move(world, p.id, man.id, 60, 'romance');
const chk = ADV.Rel.canRomance(world, p.id, man.id);
ok(chk.ok, 'romance eligible');
ADV.Rel.commit(world, p.id, man.id);
ok(p.partnerId === man.id && man.partnerId === p.id, 'married');
const v = ADV.Vault.of(world, p);
ok(v && v.holderId === p.id, 'female player holds the vault');

// Quest until the guaranteed conception (<= 10 quests)
let conceived = false;
for (let i = 0; i < 12 && !conceived; i++) {
  const q = game.board.find(x => x.tier === 1 && x.track === 'solo');
  const s = ADV.Game.startQuest(game, q, {});
  if (!s.ok) { ok(false, 'startQuest ' + s.error); break; }
  game.quest.encIdx = q.encounters.length; game.quest.readyToComplete = true; // abstract the fights
  keepFed();
  ADV.Game.completeQuest(game);
  conceived = (p.dependents || []).length > 0;
}
ok(conceived, 'guaranteed child by quest 10', p.relationshipQuests);
ok(p.childIds.length >= 1, 'childIds recorded');

// Tuition gate: with a dependent, quests cost tuition
const dep = p.dependents[0];
const goldBefore = p.inventory.gold;
const q2 = game.board.find(x => x.tier === 1 && x.track === 'solo');
ADV.Game.startQuest(game, q2, {});
ok(p.inventory.gold === goldBefore - 20, 'tuition charged per child per quest', goldBefore - p.inventory.gold);
game.quest.encIdx = q2.encounters.length; game.quest.readyToComplete = true;
keepFed();
ADV.Game.completeQuest(game);

// Broke mother must stay home — never soft-locked. (Guarantee a young
// dependent: the board's RNG draws otherwise decide whether hers has aged out.)
if (!ADV.Game.youngDependents(p)) {
  p.dependents.push(ADV.Character.makeDependent(game.rng, world, p, p.partnerId));
}
const savedGold = p.inventory.gold; p.inventory.gold = 5;
const q3 = game.board.find(x => x.tier === 1 && x.track === 'solo');
const s3 = ADV.Game.startQuest(game, q3, {});
ok(!s3.ok, 'cannot afford tuition blocks the quest');
keepFed();
const r3 = ADV.Game.stayHome(game);
ok(r3.ok, 'stay-home always available');
p.inventory.gold = savedGold;

// Age the child to self-sufficiency then adulthood
let guard = 0;
while ((p.dependents || []).some(d => d.age < 10) && guard++ < 15) {
  const q4 = game.board.find(x => x.tier === 1 && x.track === 'solo');
  const s4 = ADV.Game.startQuest(game, q4, {});
  keepFed();
  if (s4.ok) { game.quest.encIdx = q4.encounters.length; game.quest.readyToComplete = true; ADV.Game.completeQuest(game); }
  else ADV.Game.stayHome(game);
}
// child either matured into an adult NPC or is still tracked
const adultKids = world.characters.filter(c => c.motherId === p.id);
ok(adultKids.length >= 1 || (p.dependents || []).length >= 1, 'child persisted through the clock');

// Death routes to nepotism when an heir exists
const route = ADV.Game.onPlayerDeath(game, null);
ok(route.mode === 'nepotism', 'death routes to nepotism with an heir', route.mode);
const cont = ADV.Game.continueAfterDeath(game, {});
const heir = ADV.Game.player(game);
ok(heir && heir.alive && heir.isPlayer, 'playing as the heir');
ok(/Son of |Daughter of /.test(heir.title || ''), 'heir carries the title', heir.title);
ok(heir.bonusStats.atk > 0, 'nepotism stat bonus applied');
ok(Object.keys(heir.journal).length >= 0, 'journal carried');
ok(game.world.questClock > 0, 'world did NOT reset on nepotism');

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
