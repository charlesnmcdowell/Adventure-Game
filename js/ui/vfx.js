// Code-generated VFX vocabulary (§1a): portrait motion is the primary feel
// channel; effect atoms cover every skill so no mechanic is visually silent.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const VFX = {};

// ---- portrait motion atoms --------------------------------------------------
VFX.lunge = function (scene, obj, dir, done) {  // dir: +1 rightward (attacker side a)
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 + 26 * dir, duration: 110, yoyo: true, ease: 'Power2', onComplete: done });
};
VFX.recoil = function (scene, obj, dir) {
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 - 14 * dir, duration: 70, yoyo: true, ease: 'Power1' });
};
VFX.shake = function (scene, obj) {
  const x0 = obj.x;
  scene.tweens.add({ targets: obj, x: x0 + 6, duration: 40, yoyo: true, repeat: 5, onComplete: () => { obj.x = x0; } });
};
VFX.tintFlash = function (scene, img, color) {
  if (!img.setTintFill) return;
  img.setTintFill(color);
  if (img.__tintTimer) img.__tintTimer.remove(false);
  img.__tintTimer = scene.time.delayedCall(110, () => {
    img.__tintTimer = null;
    try { if (img.__baseTint != null) img.setTint(img.__baseTint); else img.clearTint(); } catch (e) {}
  });
};
VFX.desaturate = function (img) { try { img.setTint(0x555555); } catch (e) {} };
VFX.scalePunch = function (scene, obj) {
  scene.tweens.add({ targets: obj, scaleX: obj.scaleX * 1.18, scaleY: obj.scaleY * 1.18, duration: 90, yoyo: true });
};
VFX.driftPulse = function (scene, obj) {
  scene.tweens.add({ targets: obj, y: obj.y - 4, duration: 500, yoyo: true, repeat: 1 });
};

// ---- screen-space -----------------------------------------------------------
VFX.camShake = function (scene, mag) { scene.cameras.main.shake(140, mag || 0.006); };
VFX.zoomPunch = function (scene) {
  const cam = scene.cameras.main;
  scene.tweens.add({ targets: cam, zoom: 1.03, duration: 90, yoyo: true, onComplete: () => cam.setZoom(1) });
};
VFX.flashOverlay = function (scene, color, alpha) {
  const r = scene.add.rectangle(ADV.T.W / 2, ADV.T.H / 2, ADV.T.W, ADV.T.H, color, alpha || 0.18).setDepth(999);
  scene.tweens.add({ targets: r, alpha: 0, duration: 260, onComplete: () => r.destroy() });
};

// ---- projectile / arc / burst atoms ----------------------------------------
VFX.projectile = function (scene, x1, y1, x2, y2, color, done) {
  const dot = scene.add.circle(x1, y1, 6, color).setDepth(500);
  const trail = [];
  scene.tweens.add({
    targets: dot, x: x2, y: y2, duration: 220, ease: 'Power1',
    onUpdate: () => {
      const t = scene.add.circle(dot.x, dot.y, 3, color, 0.5).setDepth(499);
      trail.push(t);
      scene.tweens.add({ targets: t, alpha: 0, duration: 200, onComplete: () => t.destroy() });
    },
    onComplete: () => { dot.destroy(); VFX.burst(scene, x2, y2, color); if (done) done(); },
  });
};
VFX.slashArc = function (scene, x, y, color) {
  const g = scene.add.graphics().setDepth(500);
  g.lineStyle(4, color || 0xe8dfc8, 1);
  g.beginPath(); g.arc(x, y, 40, -2.2, -0.4); g.strokePath();
  g.setAngle(-20);
  scene.tweens.add({ targets: g, angle: 50, alpha: 0, duration: 240, onComplete: () => g.destroy() });
};
VFX.burst = function (scene, x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 26;
    const p = scene.add.rectangle(x, y, 5, 5, color).setDepth(500);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 300 + Math.random() * 150, onComplete: () => p.destroy() });
  }
};
VFX.aura = function (scene, x, y, color) {
  const ring = scene.add.circle(x, y, 30, color, 0).setStrokeStyle(3, color, 0.9).setDepth(500);
  scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 480, onComplete: () => ring.destroy() });
};
VFX.healSparkle = function (scene, x, y) {
  for (let i = 0; i < 8; i++) {
    const p = scene.add.star(x + (Math.random() - 0.5) * 50, y + 20 + Math.random() * 30, 4, 2, 5, 0x83b56b).setDepth(500);
    scene.tweens.add({ targets: p, y: p.y - 46, alpha: 0, duration: 520 + Math.random() * 200, onComplete: () => p.destroy() });
  }
};
VFX.damageNumber = function (scene, x, y, val, color) {
  const t = scene.add.text(x, y, String(val), {
    fontFamily: ADV.T.font.display, fontSize: '22px', color: color || '#f4eee0', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(600);
  scene.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 800, ease: 'Power1', onComplete: () => t.destroy() });
};

// Skill id -> default atom mapping (§1a: pair each primitive with a default)
VFX.ELEMENT = {
  fire: 0xe86a30, ice: 0x6fc0e8, lightning: 0xf4e07a, poison: 0x7fa848,
  bleed: 0xa8352c, shadow: 0x4a3a5a, holy: 0xf4eee0, nature: 0x5d8a4a, steel: 0xcfd8e8,
};
VFX.elementColor = function (el) { return VFX.ELEMENT[el] || 0xd8d0b8; };
VFX.skillColor = function (skillId) {
  const m = {
    fire_bolt: 0xe86a30, ember_lash: 0xe86a30,
    frost_touch: 0x6fc0e8, rime_grasp: 0x6fc0e8,
    spark: 0xf4e07a, aimed_shot: 0xcfd8e8, snare: 0x5d8a4a,
    backstab: 0xa8352c, cleave: 0xcfd8e8, sunder: 0xd4a94e, katana_slash: 0xcfd8e8,
    blood_pact: 0xa8352c, regenerate: 0x5d8a4a, mend: 0xf4eee0, triage: 0xf4eee0,
    basic_attack: 0xcfd8e8, venom_fang: 0x7fa848, wither_touch: 0x4a3a5a,
    smoke_bomb: 0x4a3a5a, thorn_skin: 0x5d8a4a, beast_shape: 0x5d8a4a,
    cleanse: 0xf4eee0, guardian_ward: 0xd4a94e, shield_wall: 0xd4a94e, taunt: 0x9a70c0,
    necromancy: 0x9a70c0, conscript: 0x6a4a8a, true_rest: 0xf4eee0, god_aura: 0xd4a94e,
    finisher: 0xa8352c, counter_attack: 0xcfd8e8,
  };
  return m[skillId] || 0xd8d0b8;
};
VFX.isProjectile = function (skillId) {
  return ['fire_bolt', 'frost_touch', 'aimed_shot', 'snare', 'blood_pact'].includes(skillId);
};
VFX.hitStop = function (scene, ms) {
  try { scene.tweens.pauseAll(); } catch (e) {}
  scene.time.delayedCall(ms || 60, () => { try { scene.tweens.resumeAll(); } catch (e) {} });
};

function kill(o) { try { if (o && o.destroy) o.destroy(); } catch (e) {} }
const FXD = 530;

VFX.bolt = function (scene, x1, y1, x2, y2, color, opts) {
  opts = opts || {};
  const n = opts.segs || 5, g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 3, color, 1);
  g.beginPath(); g.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    g.lineTo(x1 + (x2 - x1) * t + (Math.random() * 18 - 9), y1 + (y2 - y1) * t + (Math.random() * 14 - 7));
  }
  g.lineTo(x2, y2); g.strokePath();
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 180, onComplete: () => kill(g) });
};
VFX.beam = function (scene, x1, y1, x2, y2, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  const w = opts.w || 6;
  g.lineStyle(w, color, 0.95);
  g.lineBetween(x1, y1, x2, y2);
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 160, onComplete: () => kill(g) });
};
VFX.shards = function (scene, x, y, color, n, opts) {
  opts = opts || {};
  const count = n || 5, scale = opts.scale || 1;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + 0.2, d = (22 + i * 4) * scale;
    const t = scene.add.triangle(x, y, 0, -7 * scale, 5 * scale, 6 * scale, -5 * scale, 6 * scale, color).setDepth(FXD);
    scene.tweens.add({ targets: t, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 220 + i * 20, onComplete: () => kill(t) });
  }
};
VFX.plume = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 4, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const r = scene.add.rectangle(x + (i - n / 2) * 6, y, 8 * scale, 14 * scale, color).setDepth(FXD);
    scene.tweens.add({ targets: r, y: y - 36 * scale, alpha: 0, duration: 240 + i * 30, onComplete: () => kill(r) });
  }
};
VFX.motes = function (scene, x, y, color, n, opts) {
  opts = opts || {};
  const count = n || 5;
  for (let i = 0; i < count; i++) {
    const c = scene.add.circle(x + (Math.random() * 28 - 14), y + (Math.random() * 16 - 8), 3, color, 0.85).setDepth(FXD);
    scene.tweens.add({ targets: c, y: c.y - 24, x: c.x + (Math.random() * 16 - 8), alpha: 0, duration: 420 + i * 40, onComplete: () => kill(c) });
  }
};
VFX.cloud = function (scene, x, y, color, opts) {
  opts = opts || {};
  const c = scene.add.circle(x, y, opts.r || 28, color, opts.a == null ? 0.7 : opts.a).setDepth(FXD);
  scene.tweens.add({ targets: c, scale: opts.scale || 2.2, alpha: 0, duration: opts.dur || 380, onComplete: () => kill(c) });
};
VFX.ring = function (scene, x, y, color, opts) {
  opts = opts || {};
  const ring = scene.add.circle(x, y, opts.r || 22, color, 0).setStrokeStyle(opts.w || 3, color, 0.95).setDepth(FXD);
  scene.tweens.add({ targets: ring, scale: opts.scale || 2, alpha: 0, duration: opts.dur || 320, onComplete: () => kill(ring) });
};
VFX.shockwave = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(3, color, 0.9);
  g.strokeEllipse(x, y + 28, 30, 12);
  scene.tweens.add({ targets: g, scaleX: opts.scale || 3, scaleY: opts.scale || 1.6, alpha: 0, duration: opts.dur || 280, onComplete: () => kill(g) });
};
VFX.groundCrack = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(2, color, 1);
  const n = opts.n || 4;
  for (let i = 0; i < n; i++) {
    const a = -0.4 + i * 0.35;
    g.lineBetween(x, y + 36, x + Math.cos(a) * 40, y + 36 + Math.sin(a) * 18 + 10);
  }
  scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 700, onComplete: () => kill(g) });
};
VFX.sweep = function (scene, x, y, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 5, color, 1);
  g.beginPath(); g.arc(x, y, opts.r || 48, opts.from || -2.4, opts.to || 0.2); g.strokePath();
  g.setAngle(opts.ang || -18);
  scene.tweens.add({ targets: g, angle: (opts.ang || -18) + 70, alpha: 0, duration: opts.dur || 200, onComplete: () => kill(g) });
};
VFX.stab = function (scene, x, y, dir, color, opts) {
  opts = opts || {};
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(opts.w || 4, color, 1);
  g.lineBetween(x - 28 * dir, y, x + 10 * dir, y);
  scene.tweens.add({ targets: g, x: g.x + 16 * dir, alpha: 0, duration: opts.dur || 140, onComplete: () => kill(g) });
};
VFX.spray = function (scene, x, y, dir, color, opts) {
  opts = opts || {};
  const n = opts.n || 6, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const a = -0.5 + i * (1 / n), d = (28 + i * 4) * scale;
    const p = scene.add.rectangle(x, y, 4, 8, color).setDepth(FXD).setAngle(a * 50 * dir);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d * dir, y: y + Math.sin(a) * d, alpha: 0, duration: 180, onComplete: () => kill(p) });
  }
};
VFX.drip = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 3;
  for (let i = 0; i < n; i++) {
    const c = scene.add.circle(x + (i - 1) * 6, y + 10, 3, color).setDepth(FXD);
    scene.tweens.add({ targets: c, y: y + 34, alpha: 0, duration: 260 + i * 40, onComplete: () => kill(c) });
  }
};
VFX.frostSpikes = function (scene, x, y, color, opts) {
  opts = opts || {};
  const n = opts.n || 6, r = opts.r || 42, scale = opts.scale || 1;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const t = scene.add.triangle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7,
      0, -10 * scale, 4 * scale, 8 * scale, -4 * scale, 8 * scale, color).setDepth(FXD).setAngle(a * 57);
    scene.tweens.add({ targets: t, x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 8, alpha: 0, duration: 240, onComplete: () => kill(t) });
  }
};
VFX.laneWave = function (scene, x, color, opts) {
  opts = opts || {};
  const ys = opts.ys || [170, 330, 490];
  ys.forEach((y, i) => scene.time.delayedCall(i * 36, () => VFX.shockwave(scene, x, y, color, opts)));
};
VFX.screenSweep = function (scene, color, opts) {
  opts = opts || {};
  const W = ADV.T.W, H = ADV.T.H;
  const r = scene.add.rectangle(opts.dir < 0 ? W + 40 : -40, H / 2, 80, H, color, 0.28).setDepth(555);
  scene.tweens.add({ targets: r, x: opts.dir < 0 ? -40 : W + 40, duration: opts.dur || 280, onComplete: () => kill(r) });
};

ADV.VFX = VFX;
})();
