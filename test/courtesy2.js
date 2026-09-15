'use strict';
const { load } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x || ''); } }

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
const game = ADV.Game.newGame({ seed: 5, name: 'Bram', sex: 'm', portraitSeed: 1, portraitSlot: 1, startingSkills: ['cleave'] });
game.meta.grantGold10000 = true;
const before = ADV.Game.player(game).inventory.gold;
ok(ADV.Game.grantCourtesyGold2(game), 'second purse is paid once');
ok(ADV.Game.player(game).inventory.gold === before + 10000, 'ten thousand gold added', ADV.Game.player(game).inventory.gold);
ok(!game.meta.courtesyGoldNotice2 && !game.meta.homeReloadNotice, 'gold no longer queues apology or logout cards');
ok(!ADV.Game.grantCourtesyGold2(game), 'second purse does not repeat');
game.meta.courtesyGoldNotice = true;
game.meta.courtesyGoldNotice2 = true;
game.meta.homeReloadNotice = true;
ok(ADV.Game.clearCourtesyNotices(game), 'leftover cards are cleared');
ok(!game.meta.courtesyGoldNotice && !game.meta.courtesyGoldNotice2 && !game.meta.homeReloadNotice, 'no courtesy cards remain');
ok(typeof ADV.Game.offerHomeReload === 'undefined', 'retired home reload API stays removed');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
