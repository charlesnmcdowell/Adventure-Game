'use strict';
const { load, checkScriptOrder } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x || ''); } }

const order = checkScriptOrder();
ok(order.ok, 'harness still matches index.html script order', order.missing && order.missing.join(','));

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
ok(ADV.Game.versionLabel() === '1.2.0', 'login version is 1.2.0');
const fresh = ADV.Game.newGame({ seed: 8, name: 'Nils', sex: 'm', portraitSeed: 2, portraitSlot: 1, startingSkills: ['cleave'] });
ok(fresh.meta.patchId === '1.2.0', 'a new life starts already current');
ok(!ADV.Game.applyPatch(fresh), 'a new life is not paid again');
const game = ADV.Game.newGame({ seed: 9, name: 'Cole', sex: 'm', portraitSeed: 3, portraitSlot: 1, startingSkills: ['cleave'] });
game.meta.patchId = null;
const before = ADV.Game.player(game).inventory.gold;
ok(ADV.Game.applyPatch(game), 'an older save receives the patch');
ok(ADV.Game.player(game).inventory.gold === before + 5000, 'five thousand gold for staying current');
ok(game.meta.patchNotice, 'patch notes are queued');
ok(!ADV.Game.applyPatch(game), 'the same patch does not pay twice');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
