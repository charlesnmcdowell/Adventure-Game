// Player display and combat prefs. Lives in this browser, not the save,
// so a new life keeps the type size and the enemy-turn pause.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const KEY = 'adv:prefs';
const DEFAULTS = { textScale: 1, pauseEnemy: false };

let cache = null;
function read() {
  if (cache) return cache;
  try { cache = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
  catch (e) { cache = Object.assign({}, DEFAULTS); }
  if (!(cache.textScale > 0)) cache.textScale = 1;
  cache.pauseEnemy = !!cache.pauseEnemy;
  return cache;
}
function write(next) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
}

const Prefs = {};
Prefs.get = function () { return Object.assign({}, read()); };
Prefs.set = function (patch) { write(Object.assign(read(), patch || {})); };
Prefs.textScale = function () { return read().textScale || 1; };
Prefs.pauseEnemy = function () { return !!read().pauseEnemy; };
Prefs.setPauseEnemy = function (on) { Prefs.set({ pauseEnemy: !!on }); };
Prefs.setTextScale = function (n) {
  const v = n >= 1.3 ? 1.35 : n >= 1.1 ? 1.2 : 1;
  Prefs.set({ textScale: v });
};

ADV.Prefs = Prefs;
})();
