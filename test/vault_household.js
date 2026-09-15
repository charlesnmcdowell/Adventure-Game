// Household vault: every current spouse shares one box. A second marriage
// must not hide the first wife's gold from the player.
'use strict';
const { load } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x || ''); } }

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });

function marry(world, a, b) {
  ADV.Rel.move(world, a.id, b.id, 80, 'romance');
  ADV.Rel.move(world, b.id, a.id, 80, 'romance');
  ADV.Rel.commit(world, a.id, b.id);
}

function twoWives() {
  const game = ADV.Game.newGame({ seed: 7, name: 'Bram', sex: 'm', portraitSeed: 3, portraitSlot: 1, startingSkills: ['cleave'] });
  const world = game.world;
  const p = ADV.Game.player(game);
  p.homeId = 'mansion';
  p.inventory.gold = 800;
  const women = world.characters.filter(c => c.sex === 'f' && !c.isPlayer && c.alive);
  const w1 = women[0], w2 = women[1];
  marry(world, p, w1);
  const box = ADV.Vault.of(world, p);
  box.gold = 500;
  p.inventory.gold = 0;
  marry(world, p, w2);
  return { game, world, p, w1, w2 };
}

(function () {
  console.log('\n-- Second wife keeps the same vault --');
  const { world, p, w1, w2 } = twoWives();
  const v = ADV.Vault.of(world, p);
  const v1 = ADV.Vault.of(world, w1);
  const v2 = ADV.Vault.of(world, w2);
  ok(v && v.gold === 500, 'player still sees the 500g after the second marriage', v && v.gold);
  ok(v && v1 && v2 && v.id === v1.id && v.id === v2.id, 'player and both wives share one vault id');
  ok((world.vaults || []).filter(x => (x.gold || 0) > 0).length === 1, 'only one vault still holds the gold');
  const names = (ADV.Vault.sharePartners(world, v, p) || []).map(c => c.id).sort();
  ok(names.includes(w1.id) && names.includes(w2.id), 'share list names both wives');
})();

(function () {
  console.log('\n-- Broken save: second wife opened an empty box --');
  const game = ADV.Game.newGame({ seed: 11, name: 'Cole', sex: 'm', portraitSeed: 2, portraitSlot: 1, startingSkills: ['cleave'] });
  const world = game.world;
  const p = ADV.Game.player(game);
  p.homeId = 'mansion';
  const women = world.characters.filter(c => c.sex === 'f' && !c.isPlayer && c.alive);
  const w1 = women[0], w2 = women[1];
  ADV.Rel.addPartner(p, w1.id); ADV.Rel.addPartner(w1, p.id);
  ADV.Rel.addPartner(p, w2.id); ADV.Rel.addPartner(w2, p.id);
  const old = ADV.Vault.create(world, w1.id);
  old.gold = 900; old.sharedWithId = p.id;
  w1.vaultId = old.id;
  const empty = ADV.Vault.create(world, w2.id);
  empty.sharedWithId = p.id;
  w2.vaultId = empty.id;
  p.vaultId = empty.id;
  const v = ADV.Vault.of(world, p);
  ok(v && v.gold === 900, 'opening the vault heals a split household', v && v.gold);
  ok(p.vaultId === w1.vaultId && w1.vaultId === w2.vaultId, 'everyone is retargeted to the healed vault');
})();

(function () {
  console.log('\n-- Female player: two husbands share her vault --');
  const game = ADV.Game.newGame({ seed: 19, name: 'Mara', sex: 'f', portraitSeed: 9, portraitSlot: 1, startingSkills: ['aimed_shot'] });
  const world = game.world;
  const p = ADV.Game.player(game);
  p.homeId = 'mansion';
  p.inventory.gold = 400;
  const men = world.characters.filter(c => c.sex === 'm' && !c.isPlayer && c.alive);
  const h1 = men[0], h2 = men[1];
  h1.inventory.gold = 120;
  h2.inventory.gold = 80;
  marry(world, p, h1);
  marry(world, p, h2);
  const v = ADV.Vault.of(world, p);
  ok(v && v.holderId === p.id, 'she still holds the vault');
  ok(v && v.gold >= 200, 'both husbands poured their purses into the same vault', v && v.gold);
  ok(ADV.Vault.of(world, h1) && ADV.Vault.of(world, h1).id === v.id, 'first husband can still open it');
  ok(ADV.Vault.of(world, h2) && ADV.Vault.of(world, h2).id === v.id, 'second husband can open it');
})();

(function () {
  console.log('\n-- Jilt first wife, remaining household keeps the gold --');
  const { world, p, w1, w2 } = twoWives();
  ADV.Rel.jilt(world, p, w1);
  const v = ADV.Vault.of(world, p);
  const left = ADV.Vault.of(world, w1);
  ok(v && v.gold === 500, 'player still reaches the 500g with the second wife', v && v.gold);
  ok(v && ADV.Vault.of(world, w2) && v.id === ADV.Vault.of(world, w2).id, 'second wife still shares it');
  ok(!left || left.id !== v.id || left.gold === 0, 'first wife no longer holds the household gold');
})();

(function () {
  console.log('\n-- Jilt last wife: she keeps the box --');
  const game = ADV.Game.newGame({ seed: 23, name: 'Nils', sex: 'm', portraitSeed: 4, portraitSlot: 1, startingSkills: ['cleave'] });
  const world = game.world;
  const p = ADV.Game.player(game);
  p.inventory.gold = 300;
  const w = world.characters.find(c => c.sex === 'f' && !c.isPlayer && c.alive);
  marry(world, p, w);
  ADV.Rel.jilt(world, p, w);
  const his = ADV.Vault.of(world, p);
  const hers = ADV.Vault.of(world, w);
  ok(!his || his.id !== (hers && hers.id), 'he loses access after the last wife leaves');
  ok(hers && hers.gold >= 300, 'she keeps the vaulted gold', hers && hers.gold);
})();

(function () {
  console.log('\n-- ensureOwn on a married man does not open a second box --');
  const { world, p } = twoWives();
  const before = world.vaults.length;
  const v = ADV.Vault.ensureOwn(world, p);
  ok(v && v.gold === 500, 'ensureOwn returns the household vault');
  ok(world.vaults.length === before, 'no extra vault is created');
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
