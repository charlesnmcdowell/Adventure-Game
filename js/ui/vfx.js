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
  try {
    if (scene.sys && scene.sys.updateList) {
      const list = scene.sys.updateList.getActive ? scene.sys.updateList.getActive() : [];
      for (const o of list) {
        if (o && o.pause && o.type === 'ParticleEmitter') try { o.pause(); o.__hitStopped = true; } catch (e) {}
      }
    }
  } catch (e) {}
  const cam = scene.cameras && scene.cameras.main;
  if (cam) { try { cam._cx = cam.scrollX; cam._cy = cam.scrollY; } catch (e) {} }
  scene.time.delayedCall(ms || 60, () => {
    try { scene.tweens.resumeAll(); } catch (e) {}
    try {
      if (scene.sys && scene.sys.updateList) {
        const list = scene.sys.updateList.getActive ? scene.sys.updateList.getActive() : [];
        for (const o of list) {
          if (o && o.__hitStopped && o.resume) { try { o.resume(); } catch (e) {} o.__hitStopped = false; }
        }
      }
    } catch (e) {}
  });
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

// ---- generated textures + particle helper --------------------------------
function fxTex(scene, key, w, h, draw) {
  if (!scene || !scene.textures) return key;
  if (scene.textures.exists(key)) return key;
  try {
    const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    if (!c) return key;
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    scene.textures.addCanvas(key, c);
  } catch (e) {}
  return key;
}
function emberKey(scene) {
  return fxTex(scene, 'fx_ember', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,224,122,1)');
    g.addColorStop(0.45, 'rgba(232,106,48,0.9)');
    g.addColorStop(1, 'rgba(122,42,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
  });
}
function snowKey(scene) {
  return fxTex(scene, 'fx_snow', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(244,238,224,1)');
    g.addColorStop(1, 'rgba(244,238,224,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
  });
}
function glowKey(scene) {
  return fxTex(scene, 'fx_glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}
function emitOn(scene, key, cfg) {
  if (!scene || !scene.add || !scene.add.particles) return null;
  try {
    const em = scene.add.particles(0, 0, key, cfg);
    if (em && em.setDepth) em.setDepth(cfg.depth == null ? FXD : cfg.depth);
    if (em) em.__em = em;
    return em;
  } catch (e) {
    try {
      const mgr = scene.add.particles(key);
      if (mgr && mgr.setDepth) mgr.setDepth(cfg.depth == null ? FXD : cfg.depth);
      if (mgr && mgr.createEmitter) {
        mgr.__em = mgr.createEmitter(cfg);
        return mgr;
      }
    } catch (e2) {}
  }
  return null;
}
function clampPx(n, min) { return Math.max(min == null ? 3 : min, n); }
function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

VFX.lightField = function (scene, x, y, color, radius, ms) {
  if (!scene || !scene.add) return;
  const r = clampPx(radius || 80, 16);
  let glow;
  try {
    glow = scene.add.image(x, y, glowKey(scene)).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    glow.setDisplaySize(r * 2, r * 2);
    if (glow.setTint) glow.setTint(color || 0xffe0c0);
    glow.setAlpha(0.42);
  } catch (e) {
    glow = scene.add.circle(x, y, r, color || 0xffe0c0, 0.22).setDepth(8);
  }
  scene.tweens.add({ targets: glow, alpha: 0, scale: 1.35, duration: ms || 240, onComplete: () => kill(glow) });
  return glow;
};

VFX.emberTrail = function (scene, follow, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const mgr = emitOn(scene, emberKey(scene), {
    speed: { min: 18 * scale, max: 54 * scale },
    lifespan: 300,
    scale: { start: 0.7 * scale, end: 0 },
    alpha: { start: 0.9, end: 0 },
    tint: [0xffe07a, 0xe86a30, 0x7a2a10],
    frequency: opts.freq || 28,
    quantity: opts.n || 1,
    gravityY: 40,
    depth: FXD - 2,
  });
  if (mgr && mgr.__em && follow && mgr.__em.startFollow) mgr.__em.startFollow(follow);
  if (opts.ms) scene.time.delayedCall(opts.ms, () => {
    try { if (mgr && mgr.__em) mgr.__em.stop(); } catch (e) {}
    scene.time.delayedCall(340, () => kill(mgr));
  });
  return mgr;
};

VFX.explosion = function (scene, x, y, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const color = opts.color || 0xe86a30;
  const flash = scene.add.circle(x, y, clampPx(10 * scale, 4), 0xffffff, 0.95).setDepth(FXD + 2);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 60, onComplete: () => kill(flash) });
  VFX.shockwave(scene, x, y, color, { scale: 1.6 * scale, dur: 280 });
  const n = Math.round(8 + 8 * Math.min(2, scale));
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
    const d = (22 + Math.random() * 28) * scale;
    const p = scene.add.rectangle(x, y, clampPx(4 * scale, 2), clampPx(10 * scale, 3), i % 2 ? 0xffe07a : color).setDepth(FXD);
    scene.tweens.add({
      targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, angle: 80,
      duration: 260 + Math.random() * 120, onComplete: () => kill(p),
    });
  }
  VFX.cloud(scene, x, y - 6, 0x6a6058, { r: 16 * scale, a: 0.45, scale: 2.2, dur: 360 });
  if (scale >= 2) VFX.groundCrack(scene, x, y, 0x3a2a1c, { n: 5, dur: 2000 });
  const scorch = scene.add.ellipse(x, y + 28, 36 * scale, 12 * scale, 0x2a1810, 0.35).setDepth(4);
  scene.tweens.add({ targets: scorch, alpha: 0, duration: 2000, onComplete: () => kill(scorch) });
  if (scorch.__residue == null) scorch.__residue = true;
  VFX.lightField(scene, x, y, 0xffe0c0, 70 * scale, 280);
  if (opts.shake !== false && VFX.camShake) VFX.camShake(scene, 0.003 * scale);
  return scorch;
};

VFX.comet = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const r = clampPx((opts.r || 8) * scale, 3);
  const color = opts.color || 0xe86a30;
  const d = dist(x1, y1, x2, y2);
  const speed = opts.speed || 1100;
  const flight = Math.max(140, Math.min(420, Math.round((d / speed) * 1000)));
  const arc = opts.arc == null ? 22 * scale : opts.arc;
  const core = scene.add.circle(x1, y1, r, 0xffe07a).setDepth(FXD + 1);
  const glow = scene.add.circle(x1, y1, r * 1.7, color, 0.45).setDepth(FXD);
  const shimmer = scene.add.circle(x1, y1, r * 2.2, 0xfff2c0, 0.15).setDepth(FXD - 1);
  core.__comet = true;
  VFX.emberTrail(scene, core, { scale: (opts.trail || 1) * scale, ms: flight + 40, n: opts.trail >= 2 ? 2 : 1 });
  VFX.lightField(scene, x1, y1, 0xffe0c0, 40 * scale, 80);
  const ease = opts.accel ? 'Cubic.easeIn' : 'Sine.easeInOut';
  const dummy = { t: 0 };
  scene.tweens.add({
    targets: dummy, t: 1, duration: flight, ease,
    onUpdate: () => {
      const t = dummy.t;
      const sag = Math.sin(t * Math.PI) * arc;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t - sag;
      core.x = glow.x = shimmer.x = x;
      core.y = glow.y = shimmer.y = y;
    },
    onComplete: () => {
      kill(core); kill(glow); kill(shimmer);
      if (opts.explode !== false) VFX.explosion(scene, x2, y2, { scale: opts.boom || scale, color });
      if (opts.done) opts.done();
    },
  });
  if (opts.hum && VFX.camShake) VFX.camShake(scene, 0.002);
  return flight;
};

function boltPath(x1, y1, x2, y2, segs, jitter) {
  const pts = [{ x: x1, y: y1 }];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    pts.push({
      x: x1 + (x2 - x1) * t + (Math.random() * 2 - 1) * jitter,
      y: y1 + (y2 - y1) * t + (Math.random() * 2 - 1) * jitter * 0.7,
    });
  }
  pts.push({ x: x2, y: y2 });
  return pts;
}
function drawBolt(g, pts, w, color, a) {
  g.lineStyle(w, color, a);
  g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

VFX.lightningStreak = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const segs = opts.segs || (7 + Math.floor(Math.random() * 5));
  const jitter = (opts.jitter || 12) * scale;
  const g = scene.add.graphics().setDepth(FXD);
  let branches = 0;
  const paint = () => {
    g.clear();
    const main = boltPath(x1, y1, x2, y2, segs, jitter);
    drawBolt(g, main, clampPx(5 * scale, 2), 0xf4e07a, 0.35);
    drawBolt(g, main, clampPx(2 * scale, 2), 0xffffff, 1);
    const n = opts.branches == null ? (2 + Math.floor(Math.random() * 3)) : opts.branches;
    branches = n;
    for (let i = 0; i < n; i++) {
      const at = 2 + Math.floor(Math.random() * Math.max(1, main.length - 3));
      const src = main[at];
      const remain = 1 - at / main.length;
      const len = remain * (0.3 + Math.random() * 0.2);
      const ang = Math.atan2(y2 - y1, x2 - x1) + (Math.random() < 0.5 ? -0.7 : 0.7);
      const bx = src.x + Math.cos(ang) * dist(x1, y1, x2, y2) * len;
      const by = src.y + Math.sin(ang) * dist(x1, y1, x2, y2) * len;
      const side = boltPath(src.x, src.y, bx, by, 4, jitter * 0.6);
      drawBolt(g, side, clampPx(2.5 * scale, 2), 0xf4e07a, 0.3);
      drawBolt(g, side, clampPx(1.2 * scale, 2), 0xffffff, 0.9);
    }
  };
  paint();
  g.__branches = branches;
  scene.time.delayedCall(40, paint);
  scene.time.delayedCall(80, paint);
  scene.time.delayedCall(120, () => kill(g));
  if (opts.impact !== false) {
    VFX.burst(scene, x2, y2, 0xffffff, 6);
    const hit = scene.add.circle(x2, y2, clampPx(10 * scale, 4), 0xffffff, 0.35).setDepth(FXD);
    scene.tweens.add({ targets: hit, alpha: 0, scale: 1.8, duration: 140, onComplete: () => kill(hit) });
  }
  VFX.lightField(scene, x2, y2, 0xf4e07a, 50 * scale, 120);
  return g;
};

VFX.shatter = function (scene, x, y, opts) {
  opts = opts || {};
  const color = opts.color || 0x9ad8f0;
  const n = opts.n || 8;
  const scale = opts.scale || 1;
  const shards = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const s = clampPx(5 * scale, 3);
    const t = scene.add.triangle(x, y, 0, -s, s * 0.7, s, -s * 0.7, s, color, 0.85).setDepth(FXD);
    t.__shard = true;
    shards.push(t);
    scene.tweens.add({
      targets: t,
      x: x + Math.cos(a) * (28 + Math.random() * 22) * scale,
      y: y + Math.sin(a) * 16 * scale + 36,
      angle: 80 + Math.random() * 80,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => kill(t),
    });
  }
  return shards;
};

VFX.iceLance = function (scene, x1, y1, x2, y2, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const color = opts.color || 0x9ad8f0;
  const d = dist(x1, y1, x2, y2);
  const flight = Math.max(160, Math.min(400, Math.round((d / (opts.speed || 700)) * 1000)));
  const len = clampPx(22 * scale, 10);
  const w = clampPx(6 * scale, 3);
  const g = scene.add.graphics().setDepth(FXD);
  const draw = (x, y, ang) => {
    g.clear();
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(ang);
    g.fillStyle(color, 0.72);
    g.beginPath();
    g.moveTo(len, 0); g.lineTo(len * 0.35, -w); g.lineTo(-len * 0.55, -w * 0.55);
    g.lineTo(-len * 0.7, 0); g.lineTo(-len * 0.55, w * 0.55); g.lineTo(len * 0.35, w);
    g.closePath(); g.fillPath();
    g.lineStyle(1.4, 0xffffff, 0.85);
    g.lineBetween(-len * 0.4, 0, len * 0.7, 0);
    g.restore();
  };
  const ang = Math.atan2(y2 - y1, x2 - x1);
  draw(x1, y1, ang);
  g.__lance = true;
  const dummy = { t: 0 };
  scene.tweens.add({
    targets: dummy, t: 1, duration: flight, ease: 'Quad.easeOut',
    onUpdate: () => {
      const t = dummy.t;
      draw(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, ang);
    },
    onComplete: () => {
      kill(g);
      if (opts.shatter !== false) {
        VFX.shatter(scene, x2, y2, { scale, color, n: opts.shards || 8 });
        VFX.frostSpikes(scene, x2, y2 + 18, color, { n: 5, scale, r: 28 * scale });
      }
      VFX.lightField(scene, x2, y2, 0x9ad8f0, 40 * scale, 180);
      if (opts.done) opts.done();
    },
  });
  VFX.motes(scene, x1, y1, color, 3);
  return flight;
};

VFX.freezeOver = function (scene, view, opts) {
  opts = opts || {};
  if (!view) return null;
  if (view.__freeze) return view.__freeze;
  const x = view.x, y = view.y;
  const w = (view.img && view.img.displayWidth) || 80;
  const h = (view.img && view.img.displayHeight) || 100;
  const g = scene.add.graphics().setDepth(FXD - 4);
  g.fillStyle(0x8ec8e0, 0.35);
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(2, 0xd8f4ff, 0.8);
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(1.4, 0xffffff, 0.7);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const side = i % 4;
    if (side === 0) g.lineBetween(x - w / 2, y - h / 2 + 8 + i * 10, x - 4, y - 6 + i * 4);
    else if (side === 1) g.lineBetween(x + w / 2, y - h / 2 + 12 + i * 8, x + 6, y + 4);
    else if (side === 2) g.lineBetween(x - w / 2 + 10 + i * 12, y + h / 2, x - 2, y + 10);
    else g.lineBetween(x + w / 2 - 8, y + h / 2, x + 8, y - 4);
  }
  view.__freeze = g;
  if (opts.hold === false) {
    scene.tweens.add({ targets: g, alpha: 0, duration: opts.dur || 500, onComplete: () => { kill(g); view.__freeze = null; } });
  }
  return g;
};

VFX.clearFreeze = function (view) {
  if (view && view.__freeze) { kill(view.__freeze); view.__freeze = null; }
};

VFX.blizzard = function (scene, bounds, opts) {
  opts = opts || {};
  bounds = bounds || { x: 0, y: 0, w: ADV.T.W, h: ADV.T.H };
  const mgr = emitOn(scene, snowKey(scene), {
    x: { min: bounds.x, max: bounds.x + bounds.w },
    y: bounds.y - 10,
    speedX: { min: 180, max: 280 },
    speedY: { min: 80, max: 160 },
    lifespan: 900,
    scale: { start: 0.7, end: 0.3 },
    alpha: { start: 0.85, end: 0.2 },
    frequency: 12,
    quantity: 3,
    depth: 6,
  });
  VFX.screenSweep(scene, 0xd8f0f8, { dir: 1, dur: 320 });
  VFX.lightField(scene, bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, 0x9ad8f0, 220, 500);
  scene.time.delayedCall(900, () => {
    try { if (mgr && mgr.__em) mgr.__em.stop(); } catch (e) {}
    scene.time.delayedCall(400, () => kill(mgr));
  });
  return 900;
};

// ---- cinematic toolkit ---------------------------------------------------
const cine = {};
cine._move = null;

cine.impactFrame = function (scene, img) {
  if (!img || !img.setTintFill) return 40;
  img.setTintFill(0xffffff);
  scene.time.delayedCall(18, () => { try { img.setTintFill(0x1a1210); } catch (e) {} });
  scene.time.delayedCall(40, () => {
    try {
      if (img.__baseTint != null) img.setTint(img.__baseTint);
      else img.clearTint();
    } catch (e) {}
  });
  return 40;
};

cine.letterbox = function (scene, on) {
  const H = ADV.T.H, W = ADV.T.W, bar = H * 0.06;
  if (!scene.__letter) {
    const top = scene.add.rectangle(W / 2, bar / 2, W, bar, 0x000000, 1).setDepth(80).setAlpha(0);
    const bot = scene.add.rectangle(W / 2, H - bar / 2, W, bar, 0x000000, 1).setDepth(80).setAlpha(0);
    scene.__letter = { top, bot };
  }
  const { top, bot } = scene.__letter;
  scene.tweens.add({ targets: [top, bot], alpha: on ? 1 : 0, duration: 200 });
};

cine.camMove = function (scene, kind, opts) {
  opts = opts || {};
  if (cine._move) return;
  const cam = scene.cameras.main;
  cine._move = kind;
  const done = () => { cine._move = null; try { cam.setZoom(1); cam.setScroll(0, 0); } catch (e) {} };
  if (kind === 'pushIn') {
    scene.tweens.add({
      targets: cam, zoom: 1.08, duration: 300, ease: 'Sine.easeOut',
      onComplete: () => scene.tweens.add({ targets: cam, zoom: 1, duration: 120, onComplete: done }),
    });
  } else if (kind === 'whip') {
    const dx = opts.x || 20, dy = opts.y || 0;
    scene.tweens.add({
      targets: cam, zoom: 1.06, scrollX: dx, scrollY: dy, duration: 120, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({
        targets: cam, zoom: 1, scrollX: 0, scrollY: 0, duration: 300, onComplete: done,
      }),
    });
  } else if (kind === 'drift') {
    scene.tweens.add({
      targets: cam, zoom: 1.03, duration: opts.ms || 2400, ease: 'Sine.easeInOut', onComplete: done,
    });
  } else done();
};

cine.slowMo = function (scene, ms) {
  if (scene.__slowMoUsed) return;
  scene.__slowMoUsed = true;
  try { scene.time.timeScale = 0.35; } catch (e) {}
  try { scene.tweens.timeScale = 0.35; } catch (e) {}
  scene.time.delayedCall((ms || 400) * 0.35, () => {
    try { scene.time.timeScale = 1; } catch (e) {}
    try { scene.tweens.timeScale = 1; } catch (e) {}
  });
};

cine.chargeUp = function (scene, src, color) {
  if (!src) return 0;
  const x = src.x, y = src.y;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const c = scene.add.circle(x + Math.cos(a) * 46, y + Math.sin(a) * 36, 3, color || 0xe86a30, 0.85).setDepth(FXD);
    scene.tweens.add({ targets: c, x, y, alpha: 0, duration: 280, onComplete: () => kill(c) });
  }
  VFX.lightField(scene, x, y, color || 0xe86a30, 50, 280);
  return 280;
};

VFX.cine = cine;
VFX.STATS = { lastMs: 0, avgMs: 0, n: 0 };
VFX._tex = { emberKey, snowKey, glowKey, fxTex };

ADV.VFX = VFX;
})();
