// Battlefield backdrops, drawn entirely in code (add-on brief, Task 6).
//
// Combat used to paint one flat rectangle, so a roadside mugging and a drowned
// king looked identical. This is a small kit of drawing ELEMENTS plus a table of
// GROUND RECIPES that are data, not code — 38 grounds are 38 entries here, not
// 38 hand-written functions the way js/ui/home_art.js does its six.
//
// Every ground inherits day/evening/night from the world clock, so each recipe
// is three looks. Nothing here loads an asset; it is all Phaser Graphics.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

const BA = {};

// ---------------------------------------------------------------- palette
// A ground names colour ROLES; the phase decides the actual values, so one
// recipe reads as noon, dusk and midnight without being written three times.
function shade(hex, f) {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((hex >> 8) & 255) * f));
  const b = Math.min(255, Math.round((hex & 255) * f));
  return (r << 16) | (g << 8) | b;
}
function phaseMul(phase) { return phase === 'night' ? 0.58 : phase === 'evening' ? 0.80 : 1; }

// ---------------------------------------------------------------- elements
// Each takes (g, o, P) — graphics, the layer's own options, the resolved palette.
const EL = {
  hill(g, o, P) { g.fillStyle(P[o.c] || P.far, 1); g.fillEllipse(o.x + o.w / 2, o.y + o.h * 1.6, o.w * 1.35, o.h * 1.5); },

  ridge(g, o, P) {
    g.fillStyle(P[o.c] || P.far, 1);
    g.beginPath(); g.moveTo(o.x, o.y + o.h);
    const steps = o.steps || 5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      g.lineTo(o.x + o.w * t, o.y + Math.abs(Math.sin(t * 3.1 + (o.seed || 0))) * -o.h * 0.6 + o.h * 0.2);
    }
    g.lineTo(o.x + o.w, o.y + o.h); g.closePath(); g.fillPath();
  },

  tree(g, o, P) {
    const h = o.h || 120;
    g.fillStyle(P.trunk || 0x3a2a1c, 1); g.fillRect(o.x - 5, o.y - h * 0.35, 10, h * 0.4);
    g.fillStyle(P[o.c] || P.leaf, 1);
    g.fillCircle(o.x, o.y - h * 0.45, h * 0.28);
    g.fillCircle(o.x - h * 0.16, o.y - h * 0.32, h * 0.2);
    g.fillCircle(o.x + h * 0.16, o.y - h * 0.32, h * 0.2);
  },

  bamboo(g, o, P) {
    g.fillStyle(P[o.c] || P.leaf, 1);
    for (let i = 0; i < (o.n || 5); i++) {
      const x = o.x + i * (o.gap || 22);
      g.fillRect(x, o.y - (o.h || 200), 7, o.h || 200);
      g.fillStyle(shade(P[o.c] || P.leaf, 0.75), 1);
      for (let k = 1; k < 5; k++) g.fillRect(x, o.y - (o.h || 200) * (k / 5), 7, 3);
      g.fillStyle(P[o.c] || P.leaf, 1);
    }
  },

  wall(g, o, P) {
    g.fillStyle(P[o.c] || P.mid, 1); g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle(shade(P[o.c] || P.mid, 0.82), 1);
    const bh = o.brick || 14;
    for (let y = o.y + 4; y < o.y + o.h; y += bh) {
      for (let x = o.x + ((y / bh) % 2) * 12; x < o.x + o.w - 10; x += 26) g.fillRect(x, y, 22, bh - 5);
    }
  },

  pillar(g, o, P) {
    const c = P[o.c] || P.mid;
    g.fillStyle(c, 1); g.fillRect(o.x, o.y, o.w || 26, o.h || 180);
    g.fillStyle(shade(c, 1.2), 1); g.fillRect(o.x - 5, o.y, 8, o.h || 180);
    g.fillStyle(shade(c, 1.3), 1); g.fillRect(o.x - 8, o.y - 12, (o.w || 26) + 16, 12);
  },

  gravestone(g, o, P) {
    const c = P[o.c] || P.mid;
    g.fillStyle(c, 1); g.fillRoundedRect(o.x, o.y, o.w || 24, o.h || 34, 5);
    g.fillStyle(shade(c, 0.7), 1); g.fillRect(o.x + (o.w || 24) / 2 - 2, o.y + 8, 4, 14);
    g.fillRect(o.x + (o.w || 24) / 2 - 7, o.y + 13, 14, 4);
  },

  crate(g, o, P) {
    const c = P[o.c] || P.trunk;
    g.fillStyle(c, 1); g.fillRect(o.x, o.y, o.w || 40, o.h || 34);
    g.fillStyle(shade(c, 1.25), 1);
    g.fillRect(o.x, o.y, o.w || 40, 4); g.fillRect(o.x, o.y + (o.h || 34) / 2 - 2, o.w || 40, 4);
  },

  mast(g, o, P) {
    g.fillStyle(P.trunk || 0x3a2a1c, 1); g.fillRect(o.x, o.y - (o.h || 300), 12, o.h || 300);
    g.fillStyle(shade(P.trunk || 0x3a2a1c, 1.2), 1);
    g.fillRect(o.x - (o.arm || 70), o.y - (o.h || 300) + 40, (o.arm || 70) * 2 + 12, 8);
  },

  rigging(g, o, P) {
    g.lineStyle(2, shade(P.trunk || 0x3a2a1c, 1.4), o.a == null ? 0.7 : o.a);
    for (let i = 0; i < (o.n || 6); i++) {
      const x = o.x + i * (o.gap || 26);
      g.lineBetween(x, o.y, o.x + (o.n || 6) * (o.gap || 26) / 2, o.y - (o.h || 220));
    }
  },

  water(g, o, P) {
    g.fillStyle(P[o.c] || P.water, 1); g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle(shade(P[o.c] || P.water, 1.35), 0.5);
    for (let i = 0; i < (o.n || 9); i++) {
      const yy = o.y + 12 + i * ((o.h - 20) / (o.n || 9));
      g.fillRect(o.x + ((i * 61) % 120), yy, 60 + (i % 3) * 40, 3);
    }
  },

  banner(g, o, P) {
    const c = P[o.c] || P.accent;
    g.fillStyle(P.trunk || 0x3a2a1c, 1); g.fillRect(o.x, o.y, 5, o.h || 120);
    g.fillStyle(c, 1);
    g.fillRect(o.x + 5, o.y + 6, o.w || 44, (o.h || 120) * 0.62);
    g.fillTriangle(o.x + 5, o.y + 6 + (o.h || 120) * 0.62,
      o.x + 5 + (o.w || 44) / 2, o.y + 6 + (o.h || 120) * 0.62 + 16,
      o.x + 5 + (o.w || 44), o.y + 6 + (o.h || 120) * 0.62);
  },

  // light sources carry the phase: dead at noon, the only warm thing at night
  brazier(g, o, P, phase) {
    const lit = phase === 'day' ? 0.15 : phase === 'evening' ? 0.6 : 0.95;
    g.fillStyle(P.mid, 1); g.fillRect(o.x - 8, o.y, 16, o.h || 26);
    g.fillStyle(0x2a2018, 1); g.fillEllipse(o.x, o.y, 34, 12);
    g.fillStyle(0xd8574a, 0.14 * lit + 0.04); g.fillCircle(o.x, o.y - 6, 52);
    g.fillStyle(0xd4a94e, lit); g.fillCircle(o.x, o.y - 6, 11);
    g.fillStyle(0xf4d78a, lit * 0.9); g.fillCircle(o.x, o.y - 9, 5);
  },

  torch(g, o, P, phase) {
    const lit = phase === 'day' ? 0.1 : phase === 'evening' ? 0.55 : 0.9;
    g.fillStyle(P.trunk || 0x3a2a1c, 1); g.fillRect(o.x - 2, o.y, 5, o.h || 40);
    g.fillStyle(0xd4a94e, 0.1 * lit + 0.03); g.fillCircle(o.x, o.y - 4, 40);
    g.fillStyle(0xd4a94e, lit); g.fillCircle(o.x, o.y - 4, 7);
  },

  fog(g, o, P) {
    g.fillStyle(o.color || 0x9aa8b4, o.a == null ? 0.12 : o.a);
    for (let i = 0; i < (o.n || 4); i++) g.fillEllipse(o.x + i * (o.gap || 260), o.y + (i % 2) * 22, 320, 60);
  },

  road(g, o, P) {
    const c = P.path || 0xa08a68;
    const yTop = o.y, yBot = o.y + (o.h || 180);
    const halfTop = o.top || 60, halfBot = o.w || 300;
    g.fillStyle(c, 0.9);
    g.beginPath();
    g.moveTo(o.x - halfTop, yTop); g.lineTo(o.x + halfTop, yTop);
    g.lineTo(o.x + halfBot, yBot); g.lineTo(o.x - halfBot, yBot);
    g.closePath(); g.fillPath();
    // ruts, converging with the road
    g.fillStyle(shade(c, 0.82), 0.55);
    for (let i = 0; i < 7; i++) {
      const t = i / 7, y = yTop + (yBot - yTop) * t;
      const half = halfTop + (halfBot - halfTop) * t;
      g.fillRect(o.x - half * 0.45, y, half * 0.10, 4 + t * 4);
      g.fillRect(o.x + half * 0.35, y + 5, half * 0.10, 4 + t * 4);
    }
  },

  rubble(g, o, P) {
    g.fillStyle(P[o.c] || P.mid, 1);
    for (let i = 0; i < (o.n || 7); i++) {
      const x = o.x + ((i * 97) % (o.w || 300));
      g.fillRect(x, o.y - ((i * 37) % 14), 14 + (i % 3) * 9, 9 + (i % 2) * 5);
    }
  },

  throne(g, o, P, phase) {
    const c = P[o.c] || P.mid;
    g.fillStyle(shade(c, 0.7), 1); g.fillRect(o.x - 46, o.y - 10, 92, 20);
    g.fillStyle(c, 1); g.fillRect(o.x - 34, o.y - 120, 68, 120);
    g.fillStyle(shade(c, 1.25), 1); g.fillRect(o.x - 40, o.y - 132, 80, 16);
    g.fillStyle(P.accent, phase === 'night' ? 0.85 : 0.5);
    g.fillTriangle(o.x - 22, o.y - 132, o.x, o.y - 168, o.x + 22, o.y - 132);
  },

  tent(g, o, P) {
    const c = P[o.c] || P.mid;
    g.fillStyle(c, 1); g.fillTriangle(o.x - (o.w || 70), o.y, o.x, o.y - (o.h || 80), o.x + (o.w || 70), o.y);
    g.fillStyle(shade(c, 0.65), 1); g.fillTriangle(o.x - 14, o.y, o.x, o.y - 40, o.x + 14, o.y);
  },
};

// ---------------------------------------------------------------- recipes
// role colours are given at full daylight; the phase multiplier darkens them.
const GROUNDS = {
  // --- generic, by event -------------------------------------------------
  bandit_road: {
    sky: { day: [0x6fa0bf, 0xd8c48a], evening: [0xc06038, 0x5a3020], night: [0x0e1420, 0x1a2230] },
    P: { far: 0x3a5a32, mid: 0x2e4a28, near: 0x4a6a38, leaf: 0x2a5a28, trunk: 0x4a3020, accent: 0xd4a94e, path: 0xa8916a },
    layers: [
      { el: 'hill', x: -60, y: 300, w: 560, h: 150, c: 'far' },
      { el: 'hill', x: 420, y: 320, w: 640, h: 140, c: 'mid' },
      { el: 'hill', x: 900, y: 296, w: 520, h: 160, c: 'far' },
      { el: 'road', x: 640, y: 512, w: 430, h: 290, top: 46 },
      { el: 'tree', x: 120, y: 470, h: 190 }, { el: 'tree', x: 232, y: 492, h: 130 },
      { el: 'tree', x: 1130, y: 476, h: 200 }, { el: 'tree', x: 1030, y: 498, h: 140 },
      { el: 'brazier', x: 300, y: 600, h: 26 },
      { el: 'tent', x: 240, y: 600, w: 62, h: 74, c: 'trunk' },
    ],
  },
  crypt: {
    sky: { day: [0x4a4a52, 0x6b6151], evening: [0x3a3040, 0x4a3a44], night: [0x0c0e14, 0x161a22] },
    P: { far: 0x2e2c34, mid: 0x4a4a52, near: 0x3a3a42, leaf: 0x2a3a2a, trunk: 0x2a2420, accent: 0x9a70c0, water: 0x2a3a44 },
    layers: [
      { el: 'wall', x: 0, y: 120, w: 1280, h: 210, c: 'far', brick: 18 },
      { el: 'pillar', x: 150, y: 150, w: 30, h: 330, c: 'mid' },
      { el: 'pillar', x: 1090, y: 150, w: 30, h: 330, c: 'mid' },
      { el: 'gravestone', x: 300, y: 560, w: 26, h: 38 }, { el: 'gravestone', x: 352, y: 570, w: 22, h: 30 },
      { el: 'gravestone', x: 920, y: 566, w: 24, h: 34 }, { el: 'gravestone', x: 968, y: 556, w: 26, h: 40 },
      { el: 'rubble', x: 480, y: 610, w: 320, n: 8, c: 'near' },
      { el: 'brazier', x: 232, y: 590, h: 30 }, { el: 'brazier', x: 1048, y: 590, h: 30 },
      { el: 'fog', x: 60, y: 590, n: 5, gap: 280, a: 0.10 },
    ],
  },
  shallows: {
    sky: { day: [0x6fa0bf, 0xbfd8e0], evening: [0xc06038, 0x8a5a40], night: [0x0a1018, 0x14202c] },
    P: { far: 0x4a6f8a, mid: 0x3a5a6a, near: 0x8a8a72, leaf: 0x2a5a48, trunk: 0x3a2a1c, accent: 0xd4a94e, water: 0x4a7f96 },
    layers: [
      { el: 'ridge', x: -40, y: 250, w: 700, h: 90, c: 'far', seed: 1 },
      { el: 'ridge', x: 620, y: 262, w: 740, h: 80, c: 'far', seed: 2 },
      { el: 'water', x: 0, y: 330, w: 1280, h: 180, n: 10 },
      { el: 'mast', x: 1080, y: 330, h: 240, arm: 60 },
      { el: 'rigging', x: 1000, y: 330, n: 5, gap: 30, h: 190, a: 0.5 },
      { el: 'crate', x: 150, y: 578, w: 46, h: 38 }, { el: 'crate', x: 200, y: 590, w: 34, h: 26 },
      { el: 'fog', x: 0, y: 520, n: 5, gap: 300, a: 0.09 },
    ],
  },

  // --- faction: the Green-Eyed (samurai) ---------------------------------
  green: {
    sky: { day: [0x8fb0c8, 0xd8d0b0], evening: [0xc07048, 0x6a4030], night: [0x101828, 0x1c2636] },
    P: { far: 0x3f5a3a, mid: 0x6e6a58, near: 0x4a6a44, leaf: 0x4a7a3a, trunk: 0x4a3a24, accent: 0x5d8a4a },
    layers: [
      { el: 'ridge', x: -40, y: 236, w: 800, h: 110, c: 'far', seed: 3 },
      { el: 'wall', x: 0, y: 300, w: 1280, h: 120, c: 'mid', brick: 20 },
      { el: 'bamboo', x: 70, y: 560, n: 6, gap: 20, h: 300, c: 'leaf' },
      { el: 'bamboo', x: 1110, y: 560, n: 5, gap: 20, h: 270, c: 'leaf' },
      { el: 'banner', x: 300, y: 300, w: 40, h: 150, c: 'accent' },
      { el: 'banner', x: 940, y: 300, w: 40, h: 150, c: 'accent' },
      { el: 'torch', x: 420, y: 596, h: 44 }, { el: 'torch', x: 860, y: 596, h: 44 },
    ],
  },
  green_boss: {
    sky: { day: [0x6a7a92, 0xa89a86], evening: [0x8a3a2a, 0x3a1a18], night: [0x0e1018, 0x1a1420] },
    P: { far: 0x2a3428, mid: 0x5a5448, near: 0x33402f, leaf: 0x2f4f28, trunk: 0x3a2c1c, accent: 0xa8352c },
    layers: [
      { el: 'ridge', x: -40, y: 220, w: 900, h: 130, c: 'far', seed: 5 },
      { el: 'wall', x: 0, y: 290, w: 1280, h: 140, c: 'mid', brick: 22 },
      { el: 'pillar', x: 190, y: 300, w: 28, h: 230, c: 'mid' },
      { el: 'pillar', x: 1062, y: 300, w: 28, h: 230, c: 'mid' },
      { el: 'banner', x: 250, y: 292, w: 46, h: 172, c: 'accent' },
      { el: 'banner', x: 984, y: 292, w: 46, h: 172, c: 'accent' },
      { el: 'bamboo', x: 40, y: 580, n: 4, gap: 18, h: 260, c: 'leaf' },
      { el: 'torch', x: 300, y: 600, h: 50 }, { el: 'torch', x: 980, y: 600, h: 50 },
      { el: 'brazier', x: 640, y: 604, h: 30 },
      { el: 'fog', x: 40, y: 600, n: 4, gap: 320, a: 0.10 },
    ],
  },

  // --- god line: the Drowned King, Route B ---------------------------------
  salt_court: {
    sky: { day: [0x2a3a48, 0x3a4a56], evening: [0x24303e, 0x2e3a48], night: [0x070b12, 0x0e1620] },
    P: { far: 0x1a2530, mid: 0x3a4450, near: 0x22303c, leaf: 0x1e3a34, trunk: 0x2a2218, accent: 0x6fc0e8, water: 0x1e3442 },
    layers: [
      { el: 'water', x: 0, y: 120, w: 1280, h: 150, n: 6, c: 'water' },
      { el: 'mast', x: 300, y: 470, h: 340, arm: 90 },
      { el: 'mast', x: 980, y: 470, h: 300, arm: 70 },
      { el: 'rigging', x: 220, y: 470, n: 7, gap: 28, h: 300, a: 0.45 },
      { el: 'rigging', x: 900, y: 470, n: 6, gap: 28, h: 260, a: 0.45 },
      { el: 'throne', x: 640, y: 470, c: 'mid' },
      { el: 'crate', x: 120, y: 566, w: 44, h: 40 }, { el: 'crate', x: 1120, y: 572, w: 40, h: 34 },
      { el: 'fog', x: 0, y: 560, n: 6, gap: 240, a: 0.14, color: 0x8aa4b8 },
    ],
  },
  ossuary: {
    sky: { day: [0x5a5a62, 0x7a6a58], evening: [0x3a3040, 0x4a3a38], night: [0x0a0c12, 0x141820] },
    P: { far: 0x3a3834, mid: 0x5a5448, near: 0x2e2c28, leaf: 0x2a3a2a, trunk: 0x2a2218, accent: 0xd8c48a, water: 0x2a3a44 },
    layers: [
      { el: 'wall', x: 0, y: 100, w: 1280, h: 240, c: 'far', brick: 20 },
      { el: 'pillar', x: 180, y: 140, w: 34, h: 360, c: 'mid' },
      { el: 'pillar', x: 1066, y: 140, w: 34, h: 360, c: 'mid' },
      { el: 'gravestone', x: 280, y: 552, w: 28, h: 42 }, { el: 'gravestone', x: 960, y: 548, w: 26, h: 40 },
      { el: 'rubble', x: 400, y: 610, w: 480, n: 12, c: 'near' },
      { el: 'brazier', x: 260, y: 600, h: 32 }, { el: 'brazier', x: 1020, y: 600, h: 32 },
      { el: 'fog', x: 0, y: 580, n: 5, gap: 280, a: 0.16, color: 0xc8c0a8 },
    ],
  },
  birthing_house: {
    sky: { day: [0x8a7068, 0xc8b09a], evening: [0x8a4038, 0x4a2018], night: [0x120c10, 0x1c1418] },
    P: { far: 0x4a3a38, mid: 0x6e5a52, near: 0x3a2a28, leaf: 0x3a4a32, trunk: 0x3a2a1c, accent: 0xa8352c },
    layers: [
      { el: 'wall', x: 0, y: 180, w: 1280, h: 200, c: 'mid', brick: 16 },
      { el: 'pillar', x: 220, y: 200, w: 22, h: 280, c: 'far' },
      { el: 'pillar', x: 1040, y: 200, w: 22, h: 280, c: 'far' },
      { el: 'banner', x: 300, y: 210, w: 36, h: 140, c: 'accent' },
      { el: 'banner', x: 940, y: 210, w: 36, h: 140, c: 'accent' },
      { el: 'crate', x: 140, y: 580, w: 50, h: 36 }, { el: 'crate', x: 1090, y: 586, w: 44, h: 30 },
      { el: 'torch', x: 400, y: 590, h: 48 }, { el: 'torch', x: 880, y: 590, h: 48 },
      { el: 'fog', x: 40, y: 600, n: 4, gap: 320, a: 0.10, color: 0xd8a0a0 },
    ],
  },
  low_tide: {
    sky: { day: [0x6a8aa0, 0xc0d0d4], evening: [0xa05038, 0x4a3028], night: [0x081018, 0x122028] },
    P: { far: 0x3a5a4a, mid: 0x4a6a58, near: 0x8a8a6e, leaf: 0x2a5a40, trunk: 0x3a2a1c, accent: 0x6fc0e8, water: 0x3a6a78, path: 0x9a8a68 },
    layers: [
      { el: 'ridge', x: -40, y: 240, w: 800, h: 80, c: 'far', seed: 4 },
      { el: 'water', x: 0, y: 360, w: 1280, h: 160, n: 11 },
      { el: 'mast', x: 200, y: 360, h: 200, arm: 50 },
      { el: 'crate', x: 980, y: 560, w: 48, h: 32 }, { el: 'crate', x: 1040, y: 572, w: 36, h: 24 },
      { el: 'rubble', x: 420, y: 600, w: 400, n: 8, c: 'near' },
      { el: 'fog', x: 0, y: 500, n: 5, gap: 300, a: 0.12, color: 0x8aa8b4 },
    ],
  },
  deep_wood: {
    sky: { day: [0x4a6a50, 0x8aaa70], evening: [0x6a4030, 0x2a2018], night: [0x0a100c, 0x121810] },
    P: { far: 0x1a3a22, mid: 0x2a4a2c, near: 0x1e3220, leaf: 0x245028, trunk: 0x3a2418, accent: 0xd4a94e },
    layers: [
      { el: 'hill', x: -80, y: 280, w: 700, h: 160, c: 'far' },
      { el: 'hill', x: 500, y: 300, w: 860, h: 150, c: 'mid' },
      { el: 'tree', x: 80, y: 500, h: 240 }, { el: 'tree', x: 180, y: 520, h: 180 },
      { el: 'tree', x: 300, y: 510, h: 210 }, { el: 'tree', x: 980, y: 505, h: 230 },
      { el: 'tree', x: 1100, y: 520, h: 190 }, { el: 'tree', x: 1200, y: 500, h: 250 },
      { el: 'fog', x: 0, y: 560, n: 5, gap: 280, a: 0.14 },
    ],
  },
  marsh: {
    sky: { day: [0x6a8a78, 0xb8c8a0], evening: [0x8a5038, 0x3a2818], night: [0x0c1410, 0x182018] },
    P: { far: 0x2a4a38, mid: 0x3a5a44, near: 0x4a5a3a, leaf: 0x2a5a38, trunk: 0x3a2a18, accent: 0x5d8a4a, water: 0x2a4a44 },
    layers: [
      { el: 'hill', x: -40, y: 320, w: 600, h: 120, c: 'far' },
      { el: 'hill', x: 700, y: 340, w: 640, h: 110, c: 'mid' },
      { el: 'water', x: 0, y: 420, w: 1280, h: 120, n: 8 },
      { el: 'tree', x: 140, y: 500, h: 140 }, { el: 'tree', x: 1120, y: 510, h: 150 },
      { el: 'fog', x: 0, y: 480, n: 6, gap: 240, a: 0.18, color: 0x8aaa90 },
    ],
  },
  tavern: {
    sky: { day: [0x5a4030, 0x8a6a48], evening: [0x4a3020, 0x6a4030], night: [0x1a100c, 0x2a1c14] },
    P: { far: 0x3a281c, mid: 0x6a4a32, near: 0x4a3224, leaf: 0x2a5a28, trunk: 0x4a3020, accent: 0xd4a94e },
    layers: [
      { el: 'wall', x: 0, y: 80, w: 1280, h: 280, c: 'mid', brick: 14 },
      { el: 'crate', x: 80, y: 560, w: 56, h: 40 }, { el: 'crate', x: 150, y: 576, w: 40, h: 28 },
      { el: 'crate', x: 1100, y: 562, w: 50, h: 36 },
      { el: 'brazier', x: 320, y: 590, h: 28 }, { el: 'brazier', x: 960, y: 590, h: 28 },
      { el: 'banner', x: 240, y: 160, w: 40, h: 130, c: 'accent' },
      { el: 'banner', x: 1000, y: 160, w: 40, h: 130, c: 'accent' },
    ],
  },
  alley: {
    sky: { day: [0x4a4a52, 0x6a6a70], evening: [0x4a3028, 0x2a1c18], night: [0x0c0c10, 0x16161c] },
    P: { far: 0x2a2a30, mid: 0x4a4a52, near: 0x3a3a42, leaf: 0x2a3a2a, trunk: 0x2a2218, accent: 0xd4a94e },
    layers: [
      { el: 'wall', x: 0, y: 0, w: 220, h: 760, c: 'far', brick: 18 },
      { el: 'wall', x: 1060, y: 0, w: 220, h: 760, c: 'mid', brick: 18 },
      { el: 'crate', x: 240, y: 580, w: 48, h: 36 }, { el: 'crate', x: 990, y: 586, w: 40, h: 30 },
      { el: 'rubble', x: 400, y: 610, w: 480, n: 9, c: 'near' },
      { el: 'torch', x: 250, y: 400, h: 40 }, { el: 'torch', x: 1030, y: 400, h: 40 },
    ],
  },
  maw: {
    sky: { day: [0x4a3a48, 0x7a6a58], evening: [0x5a2838, 0x2a1418], night: [0x0c0810, 0x181420] },
    P: { far: 0x2a2230, mid: 0x4a3a48, near: 0x322830, leaf: 0x2a3a28, trunk: 0x2a1c18, accent: 0x6a4a8a },
    layers: [
      { el: 'wall', x: 0, y: 200, w: 1280, h: 160, c: 'mid', brick: 16 },
      { el: 'banner', x: 260, y: 210, w: 42, h: 150, c: 'accent' },
      { el: 'banner', x: 980, y: 210, w: 42, h: 150, c: 'accent' },
      { el: 'crate', x: 120, y: 570, w: 46, h: 34 }, { el: 'crate', x: 1110, y: 576, w: 40, h: 28 },
      { el: 'torch', x: 380, y: 590, h: 46 }, { el: 'torch', x: 900, y: 590, h: 46 },
      { el: 'fog', x: 40, y: 600, n: 4, gap: 320, a: 0.10, color: 0x6a4a8a },
    ],
  },
  maw_boss: {
    sky: { day: [0x3a2a38, 0x5a4a48], evening: [0x4a1828, 0x1a0c10], night: [0x08060c, 0x120e16] },
    P: { far: 0x1a1420, mid: 0x3a2a38, near: 0x221820, leaf: 0x1a2a18, trunk: 0x221410, accent: 0xa8352c },
    layers: [
      { el: 'wall', x: 0, y: 160, w: 1280, h: 200, c: 'mid', brick: 18 },
      { el: 'pillar', x: 200, y: 180, w: 28, h: 300, c: 'far' },
      { el: 'pillar', x: 1052, y: 180, w: 28, h: 300, c: 'far' },
      { el: 'banner', x: 280, y: 180, w: 48, h: 180, c: 'accent' },
      { el: 'banner', x: 952, y: 180, w: 48, h: 180, c: 'accent' },
      { el: 'brazier', x: 360, y: 600, h: 30 }, { el: 'brazier', x: 920, y: 600, h: 30 },
      { el: 'fog', x: 0, y: 590, n: 5, gap: 280, a: 0.14, color: 0x4a2a40 },
    ],
  },
};

BA.GROUNDS = GROUNDS;
BA.has = (id) => !!GROUNDS[id];
BA.ids = () => Object.keys(GROUNDS);

// ---------------------------------------------------------------- paint
BA.paint = function (scene, groundId, phase) {
  const W = T().W, H = T().H;
  const rec = GROUNDS[groundId] || GROUNDS.bandit_road;
  phase = phase || 'day';
  const g = scene.add.graphics().setDepth(-20);

  const sky = (rec.sky && rec.sky[phase]) || [0x121110, 0x121110];
  g.fillStyle(sky[0], 1); g.fillRect(0, 0, W, H);
  g.fillStyle(sky[1], 0.55); g.fillRect(0, H * 0.30, W, H * 0.70);

  // resolve role colours for this phase once
  const m = phaseMul(phase);
  const P = {};
  for (const k of Object.keys(rec.P || {})) P[k] = shade(rec.P[k], m);
  P.leaf = P.leaf || 0x2a5a28; P.trunk = P.trunk || 0x3a2a1c;
  P.mid = P.mid || 0x4a4a52; P.far = P.far || 0x2e2c34; P.near = P.near || 0x3a3a42;
  P.accent = P.accent || 0xd4a94e; P.water = P.water || 0x3a5a6a;

  // ground plane, with a band of the far colour above it so the horizon reads as
  // depth instead of a hard stripe across the screen
  g.fillStyle(P.far, 1); g.fillRect(0, H * 0.55, W, H * 0.12);
  g.fillStyle(P.near, 1); g.fillRect(0, H * 0.64, W, H * 0.36);
  g.fillStyle(shade(P.near, 1.12), 0.45); g.fillRect(0, H * 0.64, W, 10);

  for (const layer of (rec.layers || [])) {
    const fn = EL[layer.el];
    if (!fn) continue;
    try { fn(g, layer, P, phase); } catch (e) { /* one bad layer must not kill the fight */ }
  }
  if (phase !== 'day') { g.fillStyle(0x080a10, phase === 'night' ? 0.18 : 0.08); g.fillRect(0, 0, W, H); }
  // scrim: the fight is the subject, the ground is where it happens
  g.fillStyle(0x0d0c0a, 0.34); g.fillRect(0, 0, W, H);
  // and a heavier band right behind the lanes, where portraits must read
  g.fillStyle(0x0d0c0a, 0.22); g.fillRect(0, 110, W, 580);
  return g;
};

// ---------------------------------------------------------------- selection
// First match wins. Unknown ids fall through to the road, so a ground that has
// not been authored yet degrades instead of crashing.
BA.groundFor = function (game, mode) {
  const q = (game && game.quest && game.quest.quest) || null;
  if (q) {
    if (q.campaign && q.factionId) {
      const enc = q.encounters && q.encounters[game.quest.encIdx];
      if (enc && enc.boss && BA.has(q.factionId + '_boss')) return q.factionId + '_boss';
      if (BA.has(q.factionId)) return q.factionId;
    }
    if (q.godLine && q.routeId && BA.has(q.routeId)) return q.routeId;
    if (q.warAgainst && BA.has(q.warAgainst)) return q.warAgainst;
    const lead = (game.quest.enemies && game.quest.enemies[0]) ||
      (q.encounters && q.encounters[game.quest.encIdx] && q.encounters[game.quest.encIdx].types && { enemyTypeId: q.encounters[game.quest.encIdx].types[0] }) || null;
    const byType = {
      grave_acolyte: 'crypt', gravewarden: 'crypt', dire_wolf: 'deep_wood',
      marsh_stalker: 'marsh', frost_hag: 'marsh', hedge_mage: 'tavern',
      bandit: 'bandit_road', plated_sentinel: 'crypt',
    };
    const t = lead && (lead.enemyTypeId || lead.typeId);
    if (t && byType[t] && BA.has(byType[t])) return byType[t];
    if (/crypt|grave|ossuar|tomb/i.test(q.name || '')) return 'crypt';
    if (/wood|wolf|forest/i.test(q.name || '')) return 'deep_wood';
    if (/marsh|mire|bog/i.test(q.name || '')) return 'marsh';
    if (/shallow|sea|tide|dock|blockade|pirac|ship/i.test(q.name || '')) return 'shallows';
    if (/tavern|inn|ale/i.test(q.name || '')) return 'tavern';
  }
  if (mode === 'ambush') return 'bandit_road';
  if (mode === 'rescue') return BA.has('alley') ? 'alley' : 'crypt';
  if (mode === 'assassination') return BA.has('tavern') ? 'tavern' : 'crypt';
  return 'bandit_road';
};

BA.phaseFor = function (game) {
  try { return ADV.Housing.timeOfDay((game && game.world && game.world.questClock) || 0); }
  catch (e) { return 'day'; }
};

ADV.BattleArt = BA;
})();
