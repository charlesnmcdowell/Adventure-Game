// Per-skill, per-tier combat recipes. Composes VFX atoms; never throws.
// play() returns the wait the combat scene should use. Residue may outlive it.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const V = () => ADV.VFX;
const FIRE = 0xe86a30, ICE = 0x6fc0e8, LIT = 0xf4e07a;
const POI = 0x7fa848, BLD = 0xa8352c, SHD = 0x4a3a5a;
const HOLY = 0xf4eee0, NAT = 0x5d8a4a, STL = 0xcfd8e8;
const GOLD = 0xd4a94e, ASH = 0x4a4038, PURP = 0x9a70c0;
const SLOT_Y = [170, 330, 490];
const FXD = 530;

function kill(o) { try { if (o && o.destroy) o.destroy(); } catch (e) {} }

function tp(tier) {
  if (tier === 'advanced') return { n: 6, scale: 1.6, reach: 'lane', wait: 520 };
  if (tier === 'intermediate') return { n: 2, scale: 1.25, reach: 'two', wait: 340 };
  return { n: 1, scale: 1, reach: 'one', wait: 260 };
}

function waitOf(tier, skillId) {
  if (skillId === 'basic_attack') return 180;
  return tp(tier).wait;
}

function tierChain(draw) {
  return {
    basic: (sc, ctx) => draw(sc, ctx, tp('basic')),
    intermediate: (sc, ctx) => draw(sc, ctx, tp('intermediate')),
    advanced: (sc, ctx) => draw(sc, ctx, tp('advanced')),
  };
}

function foes(scene, src, tgt) {
  const out = [];
  if (scene.unitViews) {
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (src && src.u && v.u.side === src.u.side) continue;
      out.push(v);
    }
  }
  if (!out.length && tgt) out.push(tgt);
  return out;
}

function laneOf(scene, tgt) {
  if (!tgt) return [];
  if (scene.unitViews && tgt.u) {
    const out = [];
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (v.u.side === tgt.u.side && v.u.lane === tgt.u.lane) out.push(v);
    }
    if (out.length) return out;
  }
  return SLOT_Y.map(y => ({ x: tgt.x, y, img: tgt.img, u: tgt.u }));
}

function alliesOf(scene, src) {
  const out = [];
  if (scene.unitViews && src && src.u) {
    for (const v of scene.unitViews.values()) {
      if (!v.u || v.u.downed || v.u.fled) continue;
      if (v.u.side === src.u.side) out.push(v);
    }
  }
  if (!out.length && src) out.push(src);
  return out;
}

function twoOf(scene, src, tgt) {
  const all = foes(scene, src, tgt);
  if (tgt) {
    const i = all.indexOf(tgt);
    if (i > 0) { all.splice(i, 1); all.unshift(tgt); }
    else if (i < 0) all.unshift(tgt);
  }
  return all.slice(0, 2);
}

function residue(scene, x, y, color, tier) {
  if (tier === 'basic') return;
  V().motes(scene, x, y, color, tier === 'advanced' ? 5 : 3);
  if (tier === 'advanced') V().groundCrack(scene, x, y, color, { dur: 900, n: 3 });
}

function boom(scene, ctx, mag) {
  if (ctx.tier !== 'advanced') return;
  if (V().camShake) V().camShake(scene, mag || 0.005);
}

function sx(src) { return src ? src.x : 400; }
function sy(src) { return src ? src.y : 330; }
function tx(tgt, src) { return tgt ? tgt.x : sx(src) + 200; }
function ty(tgt, src) { return tgt ? tgt.y : sy(src); }

// ---- mage -----------------------------------------------------------------
function fireBolt(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  const color = FIRE;
  if (p.reach === 'lane') {
    const slots = laneOf(scene, tgt);
    const x1 = sx(src), y1 = sy(src);
    slots.forEach((v, i) => {
      const go = () => {
        V().bolt(scene, x1, y1, v.x, v.y, color, { segs: 4, w: 4 });
        V().plume(scene, v.x, v.y, color, { n: 3, scale: p.scale });
        V().shockwave(scene, v.x, v.y, color, { scale: 2.2 });
      };
      if (i) scene.time.delayedCall(i * 40, go); else go();
    });
    V().screenSweep(scene, color, { dir, dur: 260 });
    boom(scene, ctx, 0.005);
    residue(scene, tx(tgt, src), ty(tgt, src), color, 'advanced');
    return p.wait;
  }
  V().bolt(scene, sx(src), sy(src), tx(tgt, src), ty(tgt, src), color, { segs: 5, w: 3 * p.scale });
  V().plume(scene, tx(tgt, src), ty(tgt, src), color, { n: 2 + p.n, scale: p.scale });
  if (p.reach === 'two') V().burst(scene, tx(tgt, src), ty(tgt, src), color, 8);
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function frostTouch(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = ICE;
  const hits = p.reach === 'lane' ? laneOf(scene, tgt) : p.reach === 'two' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!hits.length && tgt) hits.push(tgt);
  if (p.reach === 'lane') {
    hits.forEach((v, i) => {
      const go = () => {
        V().shards(scene, v.x, v.y - 80, color, 4, { scale: p.scale });
        V().frostSpikes(scene, v.x, v.y, color, { n: 5, scale: p.scale });
      };
      if (i) scene.time.delayedCall(i * 30, go); else go();
    });
    V().laneWave(scene, tgt ? tgt.x : sx(src) + 200, color, { scale: 2 });
    boom(scene, ctx, 0.004);
  } else {
    hits.forEach((v, i) => {
      const go = () => {
        V().bolt(scene, sx(src), sy(src), v.x, v.y, color, { segs: 4, w: 3 });
        V().shards(scene, v.x, v.y, color, 4, { scale: p.scale });
      };
      if (i) scene.time.delayedCall(i * 70, go); else go();
    });
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function sparkFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = LIT;
  const chain = p.reach === 'lane' ? foes(scene, src, tgt) : p.reach === 'two' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!chain.length && tgt) chain.push(tgt);
  let px = sx(src), py = sy(src);
  chain.forEach((v, i) => {
    const fromX = px, fromY = py;
    px = v.x; py = v.y;
    const go = () => {
      V().bolt(scene, fromX, fromY, v.x, v.y, color, { segs: 6, w: 2 + p.scale });
      V().bolt(scene, fromX, fromY, v.x, v.y, 0xffffff, { segs: 5, w: 1, dur: 100 });
      V().burst(scene, v.x, v.y, color, 4);
    };
    if (i) scene.time.delayedCall(i * 55, go); else go();
  });
  if (p.reach === 'lane') {
    V().screenSweep(scene, color, { dir: ctx.dir || 1, dur: 220 });
    boom(scene, ctx, 0.005);
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function emberLash(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = FIRE, scale = p.scale;
  const hits = p.reach === 'lane' ? laneOf(scene, tgt) : (tgt ? [tgt] : [{ x: tx(tgt, src), y: ty(tgt, src) }]);
  hits.forEach((v, i) => {
    const go = () => {
      const g = scene.add.graphics().setDepth(FXD);
      g.lineStyle(5 * scale, color, 1);
      const mx = (sx(src) + v.x) / 2, my = (sy(src) + v.y) / 2 - 46 * scale;
      g.beginPath(); g.moveTo(sx(src), sy(src));
      if (g.quadraticCurveTo) g.quadraticCurveTo(mx, my, v.x, v.y);
      else { g.lineTo(mx, my); g.lineTo(v.x, v.y); }
      g.strokePath();
      scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => kill(g) });
      V().spray(scene, v.x, v.y, ctx.dir || 1, color, { n: 4, scale });
      V().plume(scene, v.x, v.y, color, { n: 2, scale: 0.8 * scale });
    };
    if (i) scene.time.delayedCall(i * 40, go); else go();
  });
  if (p.reach === 'lane') boom(scene, ctx, 0.004);
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function rimeGrasp(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = ICE;
  const hits = p.reach === 'two' || ctx.tier === 'advanced' ? twoOf(scene, src, tgt) : (tgt ? [tgt] : []);
  if (!hits.length) hits.push({ x: tx(tgt, src), y: ty(tgt, src) });
  hits.forEach((v, i) => {
    const go = () => {
      V().frostSpikes(scene, v.x, v.y, color, { n: 5 + p.n, r: 48 * p.scale, scale: p.scale });
      V().ring(scene, v.x, v.y, color, { r: 18, scale: 1.6 * p.scale, dur: 240 });
    };
    if (i) scene.time.delayedCall(i * 60, go); else go();
  });
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

// ---- melee ----------------------------------------------------------------
function cleaveFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = STL;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  if (ctx.tier === 'advanced') {
    V().sweep(scene, sx(src), sy(src), color, { r: 70, from: -3.1, to: 3.1, w: 6, dur: 280 });
    V().sweep(scene, sx(src), sy(src), color, { r: 52, from: 0.2, to: 3.0, w: 4, ang: 40, dur: 240 });
    boom(scene, ctx, 0.004);
  } else if (ctx.tier === 'intermediate') {
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 50, w: 5 });
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 40, from: -0.4, to: 2.2, ang: 70, w: 4 });
  } else {
    V().sweep(scene, tx(tgt, src), ty(tgt, src), color, { r: 48, w: 5 });
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function sunderFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = GOLD;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  V().beam(scene, tx(tgt, src), ty(tgt, src) - 70 * p.scale, tx(tgt, src), ty(tgt, src) + 20, color, { w: 6 * p.scale, dur: 140 });
  V().shards(scene, tx(tgt, src), ty(tgt, src), color, 3 + p.n, { scale: p.scale });
  if (ctx.tier === 'advanced') {
    V().groundCrack(scene, tx(tgt, src), ty(tgt, src), color, { n: 5, dur: 1000 });
    boom(scene, ctx, 0.005);
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function backstabFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = BLD, dir = ctx.dir || 1;
  if (src && src.img) {
    const img = src.img, x0 = img.x;
    img.setAlpha(0.25);
    img.x = tx(tgt, src) - 36 * dir;
    scene.tweens.add({ targets: img, alpha: 1, duration: 80 });
    scene.time.delayedCall(160, () => {
      scene.tweens.add({ targets: img, x: x0, duration: 90 });
    });
  }
  V().stab(scene, tx(tgt, src), ty(tgt, src), dir, color, { w: 5 * p.scale });
  if (ctx.tier !== 'basic') V().drip(scene, tx(tgt, src), ty(tgt, src), color, { n: 3 });
  if (ctx.tier === 'advanced') {
    V().spray(scene, tx(tgt, src), ty(tgt, src), dir, color, { n: 6, scale: 1.4 });
    if (V().hitStop) V().hitStop(scene, 70);
    boom(scene, ctx, 0.006);
  }
  return p.wait;
}

function venomFang(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = POI, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().stab(scene, tx(tgt, src), ty(tgt, src) - 6, dir, color, { w: 4 });
  V().stab(scene, tx(tgt, src), ty(tgt, src) + 8, dir, BLD, { w: 3 });
  V().motes(scene, tx(tgt, src), ty(tgt, src), color, 3 + p.n);
  V().drip(scene, tx(tgt, src), ty(tgt, src), BLD, { n: 2 + p.n });
  if (ctx.tier === 'advanced') {
    laneOf(scene, tgt).forEach(v => V().motes(scene, v.x, v.y, color, 4));
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function katanaFx(scene, ctx) {
  const tgt = ctx.tgt, src = ctx.src, color = STL;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  const g = scene.add.graphics().setDepth(FXD);
  g.lineStyle(3, color, 1);
  g.lineBetween(tx(tgt, src) - 72, ty(tgt, src), tx(tgt, src) + 72, ty(tgt, src));
  scene.tweens.add({ targets: g, alpha: 0, duration: 110, onComplete: () => kill(g) });
  return 160;
}

function basicAtk(scene, ctx) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().stab(scene, tx(tgt, src), ty(tgt, src), dir, STL, { w: 3, dur: 120 });
  return 180;
}

function finisherFx(scene, ctx) {
  const src = ctx.src, tgt = ctx.tgt, dir = ctx.dir || 1;
  if (src && src.img) V().lunge(scene, src.img, dir);
  V().sweep(scene, tx(tgt, src), ty(tgt, src), BLD, { w: 8, r: 58, dur: 260 });
  V().beam(scene, tx(tgt, src) - 80, ty(tgt, src), tx(tgt, src) + 80, ty(tgt, src), BLD, { w: 4, dur: 160 });
  if (V().hitStop) V().hitStop(scene, 80);
  if (V().camShake) V().camShake(scene, 0.007);
  return 400;
}

function counterFx(scene, ctx) {
  const src = ctx.src, color = STL;
  V().sweep(scene, sx(src), sy(src), color, { from: 0.6, to: 2.8, ang: 30, r: 44, w: 5, dur: 160 });
  V().ring(scene, sx(src), sy(src), color, { r: 20, scale: 1.5, dur: 200 });
  return 200;
}

// ---- support --------------------------------------------------------------
function smokeBomb(scene, ctx, p) {
  const src = ctx.src, color = SHD;
  V().cloud(scene, sx(src), sy(src), color, { r: 26 * p.scale, scale: 2.4 * p.scale, a: 0.8, dur: 420 });
  V().cloud(scene, sx(src) + 12, sy(src) - 8, ASH, { r: 18 * p.scale, scale: 2, a: 0.55, dur: 380 });
  if (src && src.img) {
    scene.tweens.add({ targets: src.img, alpha: 0.35, duration: 180 });
    if (ctx.tier === 'advanced') {
      const ghost = scene.add.rectangle(src.img.x, src.img.y, 40, 52, SHD, 0.45).setDepth(FXD);
      scene.tweens.add({
        targets: ghost, x: src.img.x + 48 * (ctx.dir || 1), alpha: 0, duration: 280,
        onComplete: () => kill(ghost),
      });
    }
  }
  return p.wait;
}

function aimedShot(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = STL;
  const aim = scene.add.graphics().setDepth(FXD);
  aim.lineStyle(1, color, 0.7);
  aim.lineBetween(sx(src), sy(src), tx(tgt, src), ty(tgt, src));
  scene.tweens.add({ targets: aim, alpha: 0, duration: 140, delay: 80, onComplete: () => kill(aim) });
  if (p.reach === 'lane') {
    foes(scene, src, tgt).forEach((v, i) => {
      const go = () => V().beam(scene, sx(src), sy(src) - 8 + (i % 3) * 6, v.x, v.y, color, { w: 2, dur: 120 });
      if (i) scene.time.delayedCall(i * 35, go); else go();
    });
    boom(scene, ctx, 0.004);
  } else {
    V().beam(scene, sx(src), sy(src), tx(tgt, src), ty(tgt, src), color, { w: 3 * p.scale, dur: 140 });
    if (ctx.tier === 'intermediate' && tgt) {
      V().beam(scene, tx(tgt, src), ty(tgt, src), tx(tgt, src) + 80 * (ctx.dir || 1), ty(tgt, src), color, { w: 2, dur: 120 });
    }
  }
  residue(scene, tx(tgt, src), ty(tgt, src), color, ctx.tier);
  return p.wait;
}

function snareFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src, color = NAT;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt) : (tgt ? [tgt] : []);
  hits.forEach(v => {
    const g = scene.add.graphics().setDepth(FXD);
    g.lineStyle(2, color, 1);
    for (let i = 0; i < 3; i++) {
      const a = 0.4 + i * 0.5;
      g.lineBetween(v.x + Math.cos(a) * 28, v.y + 36, v.x, v.y + 20);
      g.lineBetween(v.x - Math.cos(a) * 28, v.y + 36, v.x, v.y + 20);
    }
    scene.tweens.add({ targets: g, alpha: 0, duration: ctx.tier === 'advanced' ? 900 : 320, onComplete: () => kill(g) });
  });
  if (ctx.tier === 'advanced') V().laneWave(scene, tgt ? tgt.x : sx(src) + 200, color, { scale: 1.8 });
  return p.wait;
}

function thornSkin(scene, ctx, p) {
  const src = ctx.src, color = NAT;
  const cover = ctx.tier === 'advanced' ? alliesOf(scene, src) : ctx.tier === 'intermediate' ? laneOf(scene, src) : (src ? [src] : []);
  cover.forEach(v => {
    V().frostSpikes(scene, v.x, v.y, color, { n: 7, r: 36 * p.scale, scale: 0.7 * p.scale });
    V().ring(scene, v.x, v.y, color, { r: 28, scale: 1.3, dur: 280 });
  });
  return p.wait;
}

function beastShape(scene, ctx, p) {
  const src = ctx.src, color = NAT;
  if (src && src.img) {
    V().scalePunch(scene, src.img);
    try { src.img.setTint(0x6a8a4a); } catch (e) {}
    scene.time.delayedCall(480, () => { try { src.img.clearTint(); } catch (e) {} });
  }
  V().ring(scene, sx(src), sy(src), color, { r: 24, scale: 2 * p.scale, dur: 300 });
  V().plume(scene, sx(src), sy(src) + 20, color, { n: 3, scale: p.scale });
  return p.wait;
}

function witherTouch(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = SHD;
  if (src && src.img) V().lunge(scene, src.img, ctx.dir || 1);
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt).slice(0, 2).concat(tgt ? [tgt] : []).filter(Boolean) : (tgt ? [tgt] : []);
  const seen = [];
  hits.forEach(v => {
    if (seen.indexOf(v) >= 0) return;
    seen.push(v);
    V().cloud(scene, v.x, v.y, color, { r: 20 * p.scale, a: 0.55, scale: 1.8, dur: 320 });
    V().motes(scene, v.x, v.y, POI, 3);
    if (v.img) {
      try { v.img.setTint(0x555555); } catch (e) {}
      scene.time.delayedCall(360, () => { try { v.img.clearTint(); } catch (e) {} });
    }
  });
  return p.wait;
}

function mendFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = HOLY;
  const hits = ctx.tier === 'basic' ? (tgt ? [tgt] : [src]) : alliesOf(scene, src);
  hits.forEach((v, i) => {
    const go = () => {
      V().healSparkle(scene, v.x, v.y);
      V().ring(scene, v.x, v.y, color, { r: 18, scale: 1.6 * p.scale, dur: 240 });
    };
    if (i) scene.time.delayedCall(i * 30, go); else go();
  });
  return p.wait;
}

function regenFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = NAT;
  const hits = ctx.tier === 'basic' ? (tgt ? [tgt] : [src]) : alliesOf(scene, src);
  hits.forEach(v => {
    V().motes(scene, v.x, v.y, color, 4);
    V().ring(scene, v.x, v.y, color, { r: 16, scale: 1.4, dur: 400 });
    scene.time.delayedCall(180, () => V().motes(scene, v.x, v.y, 0x83b56b, 3));
  });
  return p.wait;
}

function cleanseFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src, color = HOLY;
  V().ring(scene, tx(tgt, src), ty(tgt, src), color, { r: 22, scale: 2.2 * p.scale, dur: 280 });
  V().motes(scene, tx(tgt, src), ty(tgt, src), color, 5);
  if (ctx.tier !== 'basic') V().flashOverlay(scene, color, 0.08);
  if (tgt && tgt.pips) { try { tgt.pips.clear(); } catch (e) {} }
  return p.wait;
}

function wardFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = GOLD;
  const hits = ctx.tier === 'advanced' ? (tgt && tgt.u ? laneOf(scene, tgt) : alliesOf(scene, src)) : (tgt ? [tgt] : [src]);
  hits.forEach(v => {
    const g = scene.add.graphics().setDepth(FXD);
    g.lineStyle(3, color, 0.95);
    g.strokeRoundedRect(v.x - 36 * p.scale, v.y - 46 * p.scale, 72 * p.scale, 92 * p.scale, 8);
    scene.tweens.add({ targets: g, alpha: 0, duration: ctx.tier === 'advanced' ? 700 : 320, onComplete: () => kill(g) });
  });
  return p.wait;
}

function triageFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = HOLY;
  if (ctx.tier === 'advanced') {
    const hits = alliesOf(scene, src);
    hits.forEach(v => {
      V().healSparkle(scene, v.x, v.y);
      V().ring(scene, v.x, v.y, color, { r: 28, scale: 2.4, dur: 400 });
    });
    V().flashOverlay(scene, color, 0.16);
    if (V().camShake) V().camShake(scene, 0.004);
    V().motes(scene, sx(src), sy(src) - 20, GOLD, 8);
    return p.wait;
  }
  const hits = ctx.tier === 'intermediate' ? alliesOf(scene, src) : (tgt ? [tgt] : [src]);
  hits.forEach(v => {
    V().healSparkle(scene, v.x, v.y);
    V().ring(scene, v.x, v.y, 0x83b56b, { r: 16, scale: 1.5, dur: 220 });
  });
  return p.wait;
}

function bloodPact(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = BLD;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt) : (tgt ? [tgt] : []);
  hits.forEach((v, i) => {
    const go = () => {
      V().beam(scene, sx(src), sy(src), v.x, v.y, color, { w: 3, dur: 180 });
      V().drip(scene, v.x, v.y, color, { n: 3 });
      const g = scene.add.circle((sx(src) + v.x) / 2, (sy(src) + v.y) / 2, 4, color).setDepth(FXD);
      scene.tweens.add({ targets: g, x: sx(src), y: sy(src), alpha: 0.2, duration: 220, onComplete: () => kill(g) });
    };
    if (i) scene.time.delayedCall(i * 40, go); else go();
  });
  if (src) V().healSparkle(scene, sx(src), sy(src));
  return p.wait;
}

function shieldWall(scene, ctx, p) {
  const src = ctx.src, color = GOLD;
  const cover = ctx.tier === 'advanced' ? alliesOf(scene, src)
    : ctx.tier === 'intermediate' ? laneOf(scene, src)
    : (src ? [src] : []);
  cover.forEach(v => {
    const g = scene.add.graphics().setDepth(FXD);
    g.fillStyle(color, 0.18);
    g.fillRoundedRect(v.x - 40, v.y - 50, 80, 100, 6);
    g.lineStyle(3, color, 0.95);
    g.strokeRoundedRect(v.x - 40, v.y - 50, 80, 100, 6);
    scene.tweens.add({ targets: g, alpha: 0, duration: 360, onComplete: () => kill(g) });
  });
  return p.wait;
}

function tauntFx(scene, ctx, p) {
  const src = ctx.src, tgt = ctx.tgt, color = PURP;
  const hits = ctx.tier === 'advanced' ? laneOf(scene, tgt)
    : ctx.tier === 'intermediate' ? twoOf(scene, src, tgt)
    : (tgt ? [tgt] : []);
  hits.forEach(v => {
    const star = scene.add.star(v.x, v.y - 58, 4, 4, 9, color).setDepth(FXD);
    scene.tweens.add({ targets: star, y: v.y - 70, alpha: 0, duration: 420, onComplete: () => kill(star) });
    V().ring(scene, v.x, v.y, color, { r: 20, scale: 1.6, dur: 240 });
  });
  return p.wait;
}

function raiseFx(scene, ctx, p) {
  const tgt = ctx.tgt, src = ctx.src, color = PURP;
  V().ring(scene, tx(tgt, src), ty(tgt, src), color, { r: 24, scale: 2.2 * p.scale, dur: 360 });
  V().motes(scene, tx(tgt, src), ty(tgt, src), color, 6);
  V().plume(scene, tx(tgt, src), ty(tgt, src) + 20, SHD, { n: 3, scale: p.scale });
  return p.wait;
}

function trueRest(scene, ctx) {
  const tgt = ctx.tgt, src = ctx.src, color = HOLY;
  V().ring(scene, tx(tgt, src), ty(tgt, src), color, { r: 30, scale: 2.6, dur: 400 });
  V().flashOverlay(scene, color, 0.14);
  V().motes(scene, tx(tgt, src), ty(tgt, src), GOLD, 8);
  return 400;
}

function godAura(scene, ctx) {
  const src = ctx.src, color = GOLD;
  alliesOf(scene, src).forEach(v => {
    V().ring(scene, v.x, v.y, color, { r: 26, scale: 2, dur: 360 });
    V().motes(scene, v.x, v.y, color, 4);
  });
  return 300;
}

const RECIPES = {
  fire_bolt:     tierChain(fireBolt),
  frost_touch:   tierChain(frostTouch),
  spark:         tierChain(sparkFx),
  ember_lash:    tierChain(emberLash),
  rime_grasp:    tierChain(rimeGrasp),
  cleave:        tierChain(cleaveFx),
  sunder:        tierChain(sunderFx),
  backstab:      tierChain(backstabFx),
  venom_fang:    tierChain(venomFang),
  katana_slash:  { basic: katanaFx, intermediate: katanaFx, advanced: katanaFx },
  basic_attack:  { basic: basicAtk, intermediate: basicAtk, advanced: basicAtk },
  finisher:      { basic: finisherFx, intermediate: finisherFx, advanced: finisherFx },
  counter_attack:{ basic: counterFx, intermediate: counterFx, advanced: counterFx },
  smoke_bomb:    tierChain(smokeBomb),
  aimed_shot:    tierChain(aimedShot),
  snare:         tierChain(snareFx),
  thorn_skin:    tierChain(thornSkin),
  beast_shape:   tierChain(beastShape),
  wither_touch:  tierChain(witherTouch),
  mend:          tierChain(mendFx),
  regenerate:    tierChain(regenFx),
  cleanse:       tierChain(cleanseFx),
  guardian_ward: tierChain(wardFx),
  triage:        tierChain(triageFx),
  blood_pact:    tierChain(bloodPact),
  shield_wall:   tierChain(shieldWall),
  taunt:         tierChain(tauntFx),
  necromancy:    tierChain(raiseFx),
  conscript:     tierChain(raiseFx),
  true_rest:     { basic: trueRest, intermediate: trueRest, advanced: trueRest },
  god_aura:      { basic: godAura, intermediate: godAura, advanced: godAura },
};

function play(scene, ctx) {
  try {
    ctx = ctx || {};
    const rec = RECIPES[ctx.skillId];
    if (!rec) return 240;
    const tier = ctx.tier || 'basic';
    const fn = rec[tier] || rec.basic;
    if (!fn) return 240;
    ctx.tier = tier;
    ctx.color = ctx.color || (V().skillColor && V().skillColor(ctx.skillId)) || STL;
    const d = fn(scene, ctx);
    return typeof d === 'number' ? d : waitOf(tier, ctx.skillId);
  } catch (err) {
    if (!ADV.SpellFX._logged) {
      try { console.warn('SpellFX failed', ctx && ctx.skillId, err); } catch (e) {}
      ADV.SpellFX._logged = true;
    }
    return 240;
  }
}

function has(skillId, tier) {
  const rec = RECIPES[skillId];
  if (!rec) return false;
  return !!(rec[tier || 'basic'] || rec.basic);
}

function ids() { return Object.keys(RECIPES); }

// ---- status idle marks ----------------------------------------------------
function killMark(m) {
  if (!m) return;
  try { if (m.timer) m.timer.remove(false); } catch (e) {}
  if (m.tweens) for (const t of m.tweens) try { t.stop(); t.remove(); } catch (e) {}
  if (m.objs) for (const o of m.objs) kill(o);
  if (m.onKill) try { m.onKill(); } catch (e) {}
}

function idleBurn(scene, v) {
  const f = scene.add.rectangle(v.x, v.y + 38, 10, 14, FIRE).setDepth(520);
  const tw = scene.tweens.add({ targets: f, scaleY: 1.35, alpha: 0.5, duration: 180, yoyo: true, repeat: -1 });
  return { objs: [f], tweens: [tw] };
}
function idlePoison(scene, v) {
  const drop = () => {
    if (!v.img || !v.img.active) return;
    const c = scene.add.circle(v.x + (Math.random() * 16 - 8), v.y + 8, 3, POI, 0.85).setDepth(520);
    scene.tweens.add({ targets: c, y: c.y - 22, alpha: 0, duration: 480, onComplete: () => kill(c) });
  };
  drop();
  const timer = scene.time.addEvent({ delay: 540, loop: true, callback: drop });
  return { objs: [], timer };
}
function idleBleed(scene, v) {
  const drop = () => {
    if (!v.img || !v.img.active) return;
    const c = scene.add.circle(v.x + 6, v.y + 16, 3, BLD).setDepth(520);
    scene.tweens.add({ targets: c, y: v.y + 44, alpha: 0, duration: 360, onComplete: () => kill(c) });
  };
  drop();
  const timer = scene.time.addEvent({ delay: 500, loop: true, callback: drop });
  return { objs: [], timer };
}
function idleFrozen(scene, v) {
  if (v.img) try { v.img.setTint(0x8ec8e0); } catch (e) {}
  const ring = scene.add.circle(v.x, v.y, 46, ICE, 0).setStrokeStyle(2, ICE, 0.7).setDepth(520);
  return { objs: [ring], onKill: () => { try { if (v.img) v.img.clearTint(); } catch (e) {} } };
}
function idleShock(scene, v) {
  const zap = () => {
    if (!v.img || !v.img.active) return;
    V().bolt(scene, v.x - 16, v.y - 10, v.x + 16, v.y + 12, LIT, { segs: 3, w: 2, dur: 90 });
  };
  const timer = scene.time.addEvent({ delay: 640, loop: true, callback: zap });
  return { objs: [], timer };
}
function idleGuard(scene, v) {
  const g = scene.add.circle(v.x, v.y, 48, GOLD, 0).setStrokeStyle(2, GOLD, 0.75).setDepth(520);
  return { objs: [g] };
}
function idleWard(scene, v) {
  const g = scene.add.circle(v.x, v.y, 50, 0x6fa0bf, 0).setStrokeStyle(2, 0x6fa0bf, 0.75).setDepth(520);
  return { objs: [g] };
}
function idleRoot(scene, v) {
  const g = scene.add.graphics().setDepth(520);
  g.lineStyle(2, NAT, 0.9);
  g.lineBetween(v.x - 22, v.y + 40, v.x, v.y + 22);
  g.lineBetween(v.x + 22, v.y + 40, v.x, v.y + 22);
  return { objs: [g] };
}
function idleTaunt(scene, v) {
  const s = scene.add.star(v.x, v.y - 56, 4, 3, 7, PURP).setDepth(520);
  const tw = scene.tweens.add({ targets: s, y: v.y - 62, duration: 400, yoyo: true, repeat: -1 });
  return { objs: [s], tweens: [tw] };
}

const STATUS = {
  burn: idleBurn, poison: idlePoison, bleed: idleBleed,
  frozen: idleFrozen, shocked: idleShock,
  guard: idleGuard, ward: idleWard, rooted: idleRoot, taunted: idleTaunt,
};

function clearStatus(v) {
  if (!v || !v._fxMarks) return;
  for (const k of Object.keys(v._fxMarks)) killMark(v._fxMarks[k]);
  v._fxMarks = {};
}

function syncStatus(scene, v) {
  try {
    if (!v || !v.u) return;
    const kinds = [];
    for (const s of v.u.statuses || []) {
      if (STATUS[s.kind] && kinds.indexOf(s.kind) < 0) kinds.push(s.kind);
    }
    const keep = kinds.slice(0, 3);
    v._fxMarks = v._fxMarks || {};
    for (const k of Object.keys(v._fxMarks)) {
      if (keep.indexOf(k) < 0) { killMark(v._fxMarks[k]); delete v._fxMarks[k]; }
    }
    for (const k of keep) {
      if (v._fxMarks[k]) {
        if (k === 'frozen' && v.img) try { v.img.setTint(0x8ec8e0); } catch (e) {}
        continue;
      }
      v._fxMarks[k] = STATUS[k](scene, v);
    }
  } catch (e) {}
}

function tick(scene, v, e) {
  try {
    if (!v) return 140;
    const kinds = (v.u && v.u.statuses || []).map(s => s.kind);
    if (kinds.indexOf('burn') >= 0) V().plume(scene, v.x, v.y + 16, FIRE, { n: 2, scale: 0.7 });
    else if (kinds.indexOf('poison') >= 0) V().motes(scene, v.x, v.y, POI, 3);
    else if (kinds.indexOf('bleed') >= 0) V().drip(scene, v.x, v.y, BLD, { n: 2 });
    else V().motes(scene, v.x, v.y, POI, 2);
    return 140;
  } catch (err) { return 140; }
}

ADV.SpellFX = { play, has, ids, tick, syncStatus, clearStatus, RECIPES };
})();
