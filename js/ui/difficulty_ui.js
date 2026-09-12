// Difficulty UI: the town panel (change any time between contracts) and the
// pick-a-road modal on a new life. The numbers live in js/core/difficulty.js.
(function () {
'use strict';
const T = () => ADV.T;
const Df = () => ADV.Difficulty;
const Panels = ADV.Panels = ADV.Panels || {};
const UI = ADV.DifficultyUI = {};

const COLORS = { easy: 'green', normal: 'gold', hard: 'blood' };
const FILLS = { easy: 0x2a3a22, normal: 0x3a3320, hard: 0x3a2222 };

function facts(def) {
  const pct = n => Math.round((n - 1) * 100);
  const fmt = n => (n > 0 ? '+' : '') + n + '%';
  const stats = def.foeHp === 1 && def.foeAtk === 1 && def.foeDef === 1 ? 'as listed'
    : 'health ' + fmt(pct(def.foeHp)) + ', attack ' + fmt(pct(def.foeAtk)) + (def.foeDef !== 1 ? ', defence ' + fmt(pct(def.foeDef)) : '');
  const lines = [
    'Enemies per fight: ' + (def.extraFoes ? '+' + def.extraFoes + ' (never more than your companions)' : 'as authored'),
    'Enemy skill: ' + (def.foeLevel ? '+' + def.foeLevel + ' levels, perks on every mook' : 'as authored') + '; stats ' + stats,
    'Your health: ' + (def.playerHp === 1 ? 'natural' : '×' + def.playerHp) + '; ' + Math.round((def.recoverPct != null ? def.recoverPct : 0.5) * 100) + '% back after a won fight',
    'Pay: ' + (def.payBonus ? '+' + def.payBonus + 'g a contract' : 'no bonus') + (def.payMult !== 1 ? ', ×' + def.payMult : ''),
    'Auto combat: ' + (def.autoStopPct ? 'stops below ' + Math.round(def.autoStopPct * 100) + '% health' : 'never stops itself'),
  ];
  return lines.join('\n');
}

// One card per level; `onPick(id)` after the button. Returns the bottom y.
function cards(scene, keep, x, y, w, current, onPick, depth) {
  const D = Df();
  const cw = Math.floor((w - 24) / 3);
  let bottom = y;
  D.ORDER.forEach((id, i) => {
    const def = D.LEVELS[id];
    const cx = x + i * (cw + 12);
    const on = id === current;
    const col = T().css[COLORS[id]];
    const b = T().button(scene, cx, y, cw, 46, def.name + (on ? ' — chosen' : ''), () => onPick(id),
      { size: 15, bold: true, display: true, color: on ? col : T().css.ink, edge: on ? T().c[COLORS[id]] : undefined, fill: on ? FILLS[id] : undefined });
    if (depth != null) ADV.UI.modalBtn(keep, depth, b); else ADV.UI.keepBtn(scene, b);
    const tag = keep(T().text(scene, cx + 10, y + 56, def.tagline, { size: 13, italic: true, color: col }));
    const body = keep(T().text(scene, cx + 10, y + 78, def.blurb, { size: 12, color: T().css.ink, wrap: cw - 20 }));
    const f = keep(T().text(scene, cx + 10, y + 86 + (body.height || 60), facts(def), { size: 11, color: T().css.inkDim, wrap: cw - 20 }));
    if (depth != null) { tag.setDepth(depth); body.setDepth(depth); f.setDepth(depth); }
    bottom = Math.max(bottom, f.y + (f.height || 70));
  });
  return bottom + 12;
}

// ---- town panel ------------------------------------------------------------------
Panels.difficulty = function (scene, r) {
  const game = scene.g ? scene.g() : scene.game_;
  const D = Df();
  ADV.UI.header(scene, r, 'Difficulty', 'Change it between contracts. It follows you through every life until you change it again.');
  const current = D.id();
  let y = r.y + 100;
  y = cards(scene, o => scene.keep(o), r.x + 24, y, r.w - 48, current, (id) => {
    if (id === current) return;
    D.set(game, id);
    if (ADV.Save && ADV.Save.saveGame) ADV.Save.saveGame(game);
    ADV.Notices.toast(scene, D.name(id) + ' — in force from your next fight.');
    scene.buildCharacterPanel && scene.buildCharacterPanel();
    scene.openPanel('difficulty');
  });
  scene.keep(T().text(scene, r.x + 24, y + 10, 'Easy is the game exactly as it played before this setting existed. The harder roads change how many enemies show up and how seasoned they are, their stats a little, your own health buffer and rest between fights, contract pay and the auto-combat safety stop. Stories, companions and rewards in kind are the same on every road.', { size: 12, color: T().css.inkFaint, wrap: r.w - 48 }));
};

// ---- the new-life modal ------------------------------------------------------------
// Shown once on a new life before the world is made. Picks are saved to meta at once.
UI.choose = function (scene, onDone) {
  const D = Df();
  const W = T().W, H = T().H;
  const bw = 960, bh = 470;
  const bx = W / 2 - bw / 2, by = Math.max(40, Math.round((H - bh) / 2));
  let current = D.stored();
  ADV.Notices.custom(scene, (keep, Dp, close) => {
    keep(T().text(scene, W / 2, by + 26, 'How hard a road?', { size: 24, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
    keep(T().text(scene, W / 2, by + 58, 'You can change this in town whenever you like.', { size: 13, ox: 0.5, italic: true, color: T().css.inkDim }).setDepth(Dp));
    const pick = (id) => { current = id; D.set(null, id); close(); if (onDone) onDone(id); };
    cards(scene, keep, bx + 24, by + 90, bw - 48, current, pick, Dp);
  }, { x: bx, y: by, w: bw, h: bh });
};
})();
