// Family listing: spouses and children stay visible after death, and they
// sort first on the roster and in the graveyard.
'use strict';
const { load } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });

const game = ADV.Game.newGame({ seed: 7, name: 'Mara', sex: 'f', portraitSeed: 9, portraitSlot: 1, startingSkills: ['aimed_shot'] });
const world = game.world;
const p = ADV.Game.player(game);
const living = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster);
const spouse = living.find(c => c.sex === 'm');
const adult = living.find(c => c.id !== spouse.id);
const stranger = living.find(c => c.id !== spouse.id && c.id !== adult.id);
ok(!!spouse && !!adult && !!stranger, 'seeded a spouse, an adult child, and a stranger');

ADV.Rel.setPartners(p, [spouse.id]);
ADV.Rel.setPartners(spouse, [p.id]);
p.dependents.push({ id: 'kid-lina', name: 'Lina', age: 3, sex: 'f', motherId: p.id, fatherId: spouse.id });
p.childIds.push('kid-lina');
spouse.childIds.push('kid-lina');
adult.motherId = p.id;
adult.fatherId = spouse.id;
p.childIds.push(adult.id);
spouse.childIds.push(adult.id);

const fam = ADV.Rel.familyOf(world, p);
ok(fam.some(f => f.id === spouse.id && f.alive && f.role === 'husband'), 'living spouse listed');
ok(fam.some(f => f.id === 'kid-lina' && f.alive && f.young && f.name === 'Lina'), 'young child listed at home');
ok(fam.some(f => f.id === adult.id && f.alive), 'adult child listed');
ok(fam[0].id === spouse.id, 'spouses sort before children');
ok(!fam.some(f => f.id === stranger.id), 'unrelated adult is not family');

const roster = ADV.World.adults(world).filter(c => !c.isPlayer);
const rosterSorted = roster.slice().sort((a, b) => {
  const kin = ADV.Rel.familyIds(world, p);
  const fa = kin[a.id] ? 0 : 1;
  const fb = kin[b.id] ? 0 : 1;
  return fa - fb;
});
ok(ADV.Rel.isFamily(world, p, rosterSorted[0]), 'family leads the roster');
ok(rosterSorted.findIndex(c => c.id === stranger.id) > rosterSorted.findIndex(c => c.id === adult.id), 'stranger sits after family on the roster');

ADV.Death.finalize(world, spouse, null, 'quest');
ok((p.deadSpouseIds || []).includes(spouse.id), 'widow records the dead spouse');
const famDead = ADV.Rel.familyOf(world, p);
ok(famDead.some(f => f.id === spouse.id && !f.alive && f.role === 'husband'), 'dead spouse still listed as family');

world.questClock = (world.questClock || 0) + 5;
ADV.Death.finalize(world, stranger, null, 'quest');
const graves = ADV.Rel.familyFirst(world, p, ADV.Death.graves(world));
ok(graves[0].id === spouse.id, 'family grave leads even when someone else died later');
ok(graves.findIndex(c => c.id === stranger.id) > 0, 'later stranger grave sits after family');

const jilted = living.find(c => c.alive && c.id !== adult.id && c.id !== spouse.id && c.id !== stranger.id);
if (jilted) {
  p.exIds = [jilted.id];
  ok(!ADV.Rel.isFamily(world, p, jilted), 'a jilted ex is not family');
}

const mom = world.characters.find(c => c.sex === 'f' && c.alive && !c.isPlayer && !c.isMonster);
const dad = world.characters.find(c => c.sex === 'm' && c.alive && !c.isPlayer && !c.isMonster && c.id !== mom.id);
ok(!!mom && !!dad, 'found parents for the young-death path');
mom.dependents = [{ id: 'baby-pip', name: 'Pip', age: 1, sex: 'm', motherId: mom.id, fatherId: dad.id }];
ADV.Death.finalize(world, mom, null, 'quest');
ok((mom.deadDependents || []).some(d => d.id === 'baby-pip'), 'young child who dies with the mother is remembered');
ok((dad.deadDependents || []).some(d => d.id === 'baby-pip'), 'the father also keeps the dead child');
const dadFam = ADV.Rel.familyOf(world, dad);
ok(dadFam.some(f => f.id === 'baby-pip' && !f.alive), 'home list shows the deceased child');

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
