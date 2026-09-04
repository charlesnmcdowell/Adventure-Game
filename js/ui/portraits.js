// Procedural bust portraits (§1a placeholder pipeline).
// JRPG bust crop: head + hair dominate ~60% of frame height, eye line fixed,
// one lighting key, flat palette-shiftable background. Deterministic per seed,
// so generated NPCs keep their face forever. Real art swaps in later by
// replacing textures keyed the same way (see PORTRAIT_MANIFEST note in README).
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};

const W = 220, H = 280;
const EYE_Y = 118;            // identical eye line across every portrait (§1a)

const SKIN = {
  dark:   ['#5a3a26', '#6b4630'],
  brown:  ['#8a5c3a', '#9c6c48'],
  tan:    ['#a5714a', '#b78257'],
  fair:   ['#c9976b', '#d9a97c'],
  pale:   ['#d8ab87', '#e5bc97'],
  ashen:  ['#9a9a8a', '#ababa0'],
};
const HAIR_COLORS = ['#191410', '#2e2013', '#4a2f18', '#6b4423', '#8a6a3a', '#3a3a3f', '#7a7a72', '#8a3020', '#b8b4a6'];
const BG = ['#43506088', '#50435f88', '#435f4e88', '#5f524388', '#5f434388', '#43585f88'];

function rngFor(seed) { return new ADV.RNG((seed >>> 0) || 1); }

function chinYOf(o) {
  return o.sex === 'f' ? EYE_Y + 38 : EYE_Y + 42 + (o.jaw || 0) * 2;
}

function drawNeck(ctx, o, cx, skin) {
  const chinY = chinYOf(o);
  const topW = 18;
  const botW = o.sex === 'f' ? 30 : 26;
  ctx.fillStyle = shade(skin, o.sex === 'f' ? 1.02 : 0.92);
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, chinY - 2);
  ctx.lineTo(cx + topW / 2, chinY - 2);
  ctx.lineTo(cx + botW / 2, chinY + 44);
  ctx.lineTo(cx - botW / 2, chinY + 44);
  ctx.closePath();
  ctx.fill();
  if (o.sex === 'f') {
    ctx.strokeStyle = shade(skin, 0.88);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 5, chinY + 32);
    ctx.quadraticCurveTo(cx - 16, chinY + 36, cx - 28, chinY + 34);
    ctx.moveTo(cx + 5, chinY + 32);
    ctx.quadraticCurveTo(cx + 16, chinY + 36, cx + 28, chinY + 34);
    ctx.stroke();
  }
}

// ---- drawing primitives ----------------------------------------------------
function shade(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawBust(ctx, o) {
  // o: {bg, skin:[base,hi], hairColor, hairStyle, sex, wardrobe, eyes, jaw, extras}
  ctx.clearRect(0, 0, W, H);
  // flat background with subtle grade (§1a)
  ctx.fillStyle = o.bg || BG[0];
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const skin = o.skin[0];
  const headW = 46 + o.jaw * 4, headH = 60;
  const chinY = chinYOf(o);

  // torso, then hair behind the body, then the neck in front of the hair so
  // hanging locks cannot sit on the chin (that reads as a beard).
  drawWardrobe(ctx, o, cx);
  ctx.fillStyle = o.hairColor;
  hairBack(ctx, o, cx, headW);
  drawNeck(ctx, o, cx, skin);

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, EYE_Y + 2, headW / 2 + 6, headH / 2 + 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // jaw taper — women stay round so hair cannot fill a pointed chin
  ctx.beginPath();
  ctx.moveTo(cx - headW / 2 - 4, EYE_Y + 8);
  ctx.quadraticCurveTo(cx - headW / 2 - (o.sex === 'f' ? 2 : 0), EYE_Y + (o.sex === 'f' ? 30 : 36), cx, chinY);
  ctx.quadraticCurveTo(cx + headW / 2 + (o.sex === 'f' ? 2 : 0), EYE_Y + (o.sex === 'f' ? 30 : 36), cx + headW / 2 + 4, EYE_Y + 8);
  ctx.fill();
  // lighting key: consistent left-high light, right shade (§1a)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx + headW / 4 + 4, EYE_Y + 6, headW / 3.2, headH / 2 + 8, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.ellipse(cx - headW / 4, EYE_Y - 12, headW / 4, headH / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.fillStyle = shade(skin, 0.92);
  ctx.beginPath(); ctx.ellipse(cx - headW / 2 - 5, EYE_Y + 6, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + headW / 2 + 5, EYE_Y + 6, 5, 9, 0, 0, Math.PI * 2); ctx.fill();

  // eyes on the fixed line
  const eyeDX = 14;
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#f2ede2';
    ctx.beginPath(); ctx.ellipse(cx + s * eyeDX, EYE_Y, 7.5, o.sex === 'f' ? 5.5 : 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.eyes;
    ctx.beginPath(); ctx.arc(cx + s * eyeDX + 1, EYE_Y, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#131313';
    ctx.beginPath(); ctx.arc(cx + s * eyeDX + 1, EYE_Y, 1.7, 0, Math.PI * 2); ctx.fill();
    // lid line
    ctx.strokeStyle = shade(skin, 0.55); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx + s * eyeDX - 7, EYE_Y - 4); ctx.quadraticCurveTo(cx + s * eyeDX, EYE_Y - 7, cx + s * eyeDX + 7, EYE_Y - 4); ctx.stroke();
    // brow
    ctx.strokeStyle = shade(o.hairColor, 0.8); ctx.lineWidth = o.sex === 'f' ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(cx + s * (eyeDX - 8), EYE_Y - 11 + o.brow);
    ctx.quadraticCurveTo(cx + s * eyeDX, EYE_Y - 14, cx + s * (eyeDX + 8), EYE_Y - 10 - o.brow);
    ctx.stroke();
  }
  // nose hint
  ctx.strokeStyle = shade(skin, 0.7); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(cx + 1, EYE_Y + 8); ctx.quadraticCurveTo(cx + 4, EYE_Y + 18, cx, EYE_Y + 20); ctx.stroke();
  // mouth
  ctx.strokeStyle = o.sex === 'f' ? '#8a4038' : shade(skin, 0.55);
  ctx.lineWidth = o.sex === 'f' ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, EYE_Y + 30);
  ctx.quadraticCurveTo(cx, EYE_Y + 30 + o.mouth, cx + 8, EYE_Y + 30);
  ctx.stroke();

  // veteran marks — a scar past a few contracts, greying at rank
  if ((o.quests || 0) >= 6 || (o.rank || 1) >= 3) {
    const side = ((o.quests || 0) + (o.rank || 0)) % 2 ? 1 : -1;
    ctx.strokeStyle = shade(skin, 0.52);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(cx + side * 16, EYE_Y + 1);
    ctx.lineTo(cx + side * 26, EYE_Y + 20);
    ctx.stroke();
  }

  // hair front
  ctx.fillStyle = o.hairColor;
  hairFront(ctx, o, cx, headW);
  // stubble / beard is men only — never on a woman's jaw
  if (o.sex === 'm' && o.beard) {
    ctx.fillStyle = shade(o.hairColor, 0.7);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y + 34, 15 + o.jaw * 2, 11 + o.jaw, 0, 0.15, Math.PI - 0.15);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (o.extras) o.extras(ctx, cx, o);
  drawHeadwear(ctx, o, cx);
}

// hair silhouettes — the primary differentiator (§1a)
function hairBack(ctx, o, cx, headW) {
  const s = o.hairStyle;
  const f = o.sex === 'f';
  if (s === 'long') {
    // Crown mass, then two shoulder-length curtains with a neck gap so the
    // hair cannot wrap the chin.
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 18, headW / 2 + 16, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    const gap = f ? 12 : 10;
    ctx.beginPath();
    ctx.moveTo(cx - headW / 2 - 18, EYE_Y + 4);
    ctx.quadraticCurveTo(cx - headW / 2 - 34, EYE_Y + 56, cx - 40, EYE_Y + 116);
    ctx.lineTo(cx - gap, EYE_Y + 116);
    ctx.quadraticCurveTo(cx - 18, EYE_Y + 50, cx - headW / 2 - 2, EYE_Y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + headW / 2 + 18, EYE_Y + 4);
    ctx.quadraticCurveTo(cx + headW / 2 + 34, EYE_Y + 56, cx + 40, EYE_Y + 116);
    ctx.lineTo(cx + gap, EYE_Y + 116);
    ctx.quadraticCurveTo(cx + 18, EYE_Y + 50, cx + headW / 2 + 2, EYE_Y + 10);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (s === 'braids' || s === 'dreads') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 28, headW / 2 + 2, 22, 0, Math.PI, 0);
    ctx.fill();
    const ids = f ? [-3.2, -2.2, -1.2, 1.2, 2.2, 3.2] : [-3, -2, -1, 0, 1, 2, 3];
    const long = f && s === 'braids';
    for (const i of ids) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 11, EYE_Y + (long ? 72 : 54), long ? 4.2 : 4.5, long ? 56 : 30, i * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (s === 'afro') {
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 42, headW / 2 + 20, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'locs' || s === 'twists') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 16, headW / 2 + 14, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    const ids = f ? [-3.2, -2.2, -1.2, 1.2, 2.2, 3.2] : [-3, -2, -1, 0, 1, 2, 3];
    const thick = s === 'locs' ? 6 : 3.6;
    const drop = s === 'locs' ? (f ? 34 : 32) : 26;
    for (const i of ids) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 11, EYE_Y + 60, thick, drop, i * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (s === 'cornrows') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 14, headW / 2 + 8, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y + 10, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'puff') {
    ctx.beginPath();
    ctx.ellipse(cx, EYE_Y - 14, headW / 2 + 8, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 52, 28, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (s === 'twa') {
    ctx.beginPath();
    ctx.arc(cx, EYE_Y - 20, headW / 2 + 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  if (s === 'ponytail') {
    ctx.ellipse(cx, EYE_Y - 10, headW / 2 + 10, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + headW / 2 + 16, EYE_Y + 26, 10, 46, -0.25, 0, Math.PI * 2);
  }
  else if (s === 'bun') {
    ctx.ellipse(cx, EYE_Y - 12, headW / 2 + 9, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, EYE_Y - 52, 14, 0, Math.PI * 2);
  }
  else { ctx.ellipse(cx, EYE_Y - 8, headW / 2 + 10, 46, 0, 0, Math.PI * 2); }
  ctx.fill();
}
function hairFront(ctx, o, cx, headW) {
  const s = o.hairStyle;
  ctx.beginPath();
  if (s === 'buzz' || s === 'bald' || s === 'twa' || s === 'puff' || s === 'locs' || s === 'twists') {
    if (s === 'buzz') { ctx.globalAlpha = 0.55; ctx.ellipse(cx, EYE_Y - 26, headW / 2 + 5, 24, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; }
    return;
  }
  if (s === 'afro') return;
  if (s === 'hood') return;
  if (s === 'cornrows') {
    ctx.strokeStyle = shade(o.hairColor, 0.7);
    ctx.lineWidth = 2.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5, EYE_Y - 8);
      ctx.quadraticCurveTo(cx + i * 4, EYE_Y - 36, cx + i * 2, EYE_Y - 48);
      ctx.stroke();
    }
    ctx.fillStyle = o.hairColor;
    return;
  }
  // generic fringe
  ctx.moveTo(cx - headW / 2 - 8, EYE_Y - 8);
  ctx.quadraticCurveTo(cx - headW / 2, EYE_Y - 50, cx, EYE_Y - 46);
  ctx.quadraticCurveTo(cx + headW / 2, EYE_Y - 50, cx + headW / 2 + 8, EYE_Y - 8);
  ctx.quadraticCurveTo(cx + headW / 2 - 2, EYE_Y - 26, cx + (o.fringe || 0), EYE_Y - 22);
  ctx.quadraticCurveTo(cx - headW / 2 + 4, EYE_Y - 28, cx - headW / 2 - 8, EYE_Y - 8);
  ctx.fill();
  if (s === 'sidecut') {
    ctx.fillStyle = shade(o.hairColor, 0.5);
    ctx.beginPath(); ctx.rect(cx + headW / 2 - 8, EYE_Y - 34, 16, 22); ctx.fill();
    ctx.fillStyle = o.hairColor;
  }
}

function drawWardrobe(ctx, o, cx) {
  const y0 = EYE_Y + 62;
  const kind = o.wardrobe;
  const col = o.wardrobeColor || '#3a4150';
  // base shoulders
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - 78, H);
  ctx.quadraticCurveTo(cx - 74, y0 + 12, cx - 34, y0);
  ctx.quadraticCurveTo(cx, y0 - 8, cx + 34, y0);
  ctx.quadraticCurveTo(cx + 74, y0 + 12, cx + 78, H);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(cx + 8, y0 - 8, 80, H - y0 + 8);
  if (kind === 'armor' || kind === 'samurai') {
    ctx.fillStyle = shade(col, 1.35);
    for (const s of [-1, 1]) { // pauldrons
      ctx.beginPath(); ctx.ellipse(cx + s * 52, y0 + 12, 26, 18, s * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // high collar — reads as a cutout even at thumbnail size
    ctx.fillStyle = shade(col, 0.75);
    ctx.beginPath();
    ctx.moveTo(cx - 18, y0 - 6); ctx.lineTo(cx - 22, y0 + 22);
    ctx.lineTo(cx + 22, y0 + 22); ctx.lineTo(cx + 18, y0 - 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(col, 1.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 30, y0 + 26); ctx.quadraticCurveTo(cx, y0 + 34, cx + 30, y0 + 26); ctx.stroke();
    if (kind === 'samurai') { // katana at the shoulder (§14a)
      ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(cx + 40, y0 + 4); ctx.lineTo(cx + 88, y0 - 44); ctx.stroke();
      ctx.strokeStyle = '#8a6f36'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + 36, y0 + 8); ctx.lineTo(cx + 46, y0 - 2); ctx.stroke();
    }
  } else if (kind === 'ninja') {
    ctx.fillStyle = 'rgba(180,190,200,0.25)'; // mesh collar
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 26 + i * 2, y0 + 4 + i * 5); ctx.quadraticCurveTo(cx, y0 + 10 + i * 5, cx + 26 - i * 2, y0 + 4 + i * 5); ctx.stroke();
    }
  } else if (kind === 'dress' || kind === 'hide') {
    // bare shoulders: skin above the garment line
    ctx.fillStyle = o.skin[0];
    ctx.beginPath();
    ctx.moveTo(cx - 66, y0 + 26); ctx.quadraticCurveTo(cx - 60, y0 + 2, cx - 30, y0 - 2);
    ctx.quadraticCurveTo(cx, y0 - 10, cx + 30, y0 - 2);
    ctx.quadraticCurveTo(cx + 60, y0 + 2, cx + 66, y0 + 26);
    ctx.lineTo(cx + 66, y0 + 34); ctx.quadraticCurveTo(cx, y0 + (kind === 'dress' ? 20 : 30), cx - 66, y0 + 34);
    ctx.closePath(); ctx.fill();
    if (kind === 'hide') { // asymmetric wrap
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(cx - 70, H); ctx.lineTo(cx - 60, y0 + 14); ctx.lineTo(cx + 30, y0 + 44); ctx.lineTo(cx + 40, H); ctx.closePath(); ctx.fill();
    }
    if (kind === 'dress' && o.sex === 'f') {
      ctx.strokeStyle = '#d4a94e'; ctx.lineWidth = 2.5; // statement jewelry
      ctx.beginPath(); ctx.arc(cx, y0 + 6, 18, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = '#d4a94e';
      ctx.beginPath(); ctx.arc(cx, y0 + 25, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'suit') {
    ctx.fillStyle = '#e8e2d2'; // open collar shirt
    ctx.beginPath(); ctx.moveTo(cx - 16, y0 - 2); ctx.lineTo(cx, y0 + 26); ctx.lineTo(cx + 16, y0 - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(col, 1.5); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 20, y0); ctx.lineTo(cx - 34, y0 + 40); ctx.moveTo(cx + 20, y0); ctx.lineTo(cx + 34, y0 + 40); ctx.stroke();
  } else if (kind === 'hiking') {
    ctx.strokeStyle = shade(col, 0.6); ctx.lineWidth = 6; // harness straps
    ctx.beginPath(); ctx.moveTo(cx - 40, y0 + 2); ctx.lineTo(cx + 10, H); ctx.moveTo(cx + 40, y0 + 2); ctx.lineTo(cx - 10, H); ctx.stroke();
  } else if (kind === 'robe') {
    ctx.strokeStyle = shade(col, 1.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 14, y0 - 4); ctx.lineTo(cx - 14, H); ctx.moveTo(cx + 14, y0 - 4); ctx.lineTo(cx + 14, H); ctx.stroke();
  } else if (kind === 'pirate') {
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath(); ctx.moveTo(cx - 18, y0 - 2); ctx.lineTo(cx, y0 + 28); ctx.lineTo(cx + 18, y0 - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, 1.15);
    ctx.beginPath(); ctx.moveTo(cx - 72, y0 + 34); ctx.lineTo(cx + 72, y0 + 28); ctx.lineTo(cx + 68, y0 + 46); ctx.lineTo(cx - 68, y0 + 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d4a94e';
    ctx.beginPath(); ctx.arc(cx + (o.sex === 'f' ? 22 : 24), EYE_Y + 8, 3.2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'navy') {
    ctx.fillStyle = shade(col, 1.45);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(cx + s * 50, y0 + 8, 20, 11, s * 0.15, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#d4a94e';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(cx, y0 + 16 + i * 13, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#d4a94e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 22, y0 + 4); ctx.quadraticCurveTo(cx, y0 + 10, cx + 22, y0 + 4); ctx.stroke();
  }
  if (o.cloak) {
    ctx.fillStyle = shade(col, 0.55);
    ctx.beginPath();
    ctx.moveTo(cx - 70, y0 + 8);
    ctx.quadraticCurveTo(cx - 88, y0 + 40, cx - 82, H);
    ctx.lineTo(cx - 40, H);
    ctx.quadraticCurveTo(cx - 48, y0 + 30, cx - 28, y0 + 4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 70, y0 + 8);
    ctx.quadraticCurveTo(cx + 88, y0 + 40, cx + 82, H);
    ctx.lineTo(cx + 40, H);
    ctx.quadraticCurveTo(cx + 48, y0 + 30, cx + 28, y0 + 4);
    ctx.closePath(); ctx.fill();
  }
}

function drawHeadwear(ctx, o, cx) {
  const kind = o.headwear;
  const col = o.wardrobeColor || '#3a4150';
  if (kind === 'helm') {
    ctx.fillStyle = shade(col, 1.15);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 18, 40, 36, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 40, EYE_Y - 22, 80, 18);
    ctx.fillStyle = shade(col, 0.7);
    ctx.fillRect(cx - 36, EYE_Y - 8, 72, 10);
    ctx.fillStyle = shade(col, 1.35);
    ctx.fillRect(cx - 4, EYE_Y - 52, 8, 34);
  } else if (kind === 'cap') {
    ctx.fillStyle = shade(col, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 28, 36, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(col, 0.65);
    ctx.beginPath(); ctx.ellipse(cx + 6, EYE_Y - 18, 44, 8, 0.08, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'hood' && o.hairStyle !== 'hood') {
    const hc = col;
    ctx.fillStyle = shade(hc, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 12, 42, 52, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 42, EYE_Y - 10); ctx.quadraticCurveTo(cx, EYE_Y - 70, cx + 42, EYE_Y - 10); ctx.fill();
  }
}

// ---- portrait recipes -------------------------------------------------------
// Creation portraits — slots 1–5 keep the original looks; 6–17 add
// more faces plus shinobi / samurai / privateer / Admiralty kits.
const SLOT_RECIPES = {
  1: { skin: 'dark',  tag: 'Look', f: { hair: 'afro', wardrobe: 'armor' },   m: { hair: 'buzz', wardrobe: 'armor' },   wardrobeColor: '#5a5f6e' },
  2: { skin: 'brown', tag: 'Look', f: { hair: 'braids', wardrobe: 'ninja' }, m: { hair: 'hood', wardrobe: 'ninja' },   wardrobeColor: '#2a2d36' },
  3: { skin: 'fair',  tag: 'Look', f: { hair: 'long', wardrobe: 'dress' },   m: { hair: 'short', wardrobe: 'suit' },   wardrobeColor: '#4a3550' },
  4: { skin: 'pale',  tag: 'Look', f: { hair: 'ponytail', wardrobe: 'hiking' }, m: { hair: 'short', wardrobe: 'hiking' }, wardrobeColor: '#4e5a3e' },
  5: { skin: 'tan',   tag: 'Look', f: { hair: 'long', wardrobe: 'hide' },    m: { hair: 'bun', wardrobe: 'hide' },     wardrobeColor: '#6e4a30' },
  // four more African-American looks, distinct hair on each face
  6: { skin: 'dark',  tag: 'Look', hairColor: '#191410', f: { hair: 'locs', wardrobe: 'dress' }, m: { hair: 'twists', wardrobe: 'armor' }, wardrobeColor: '#4a3550' },
  7: { skin: 'dark',  tag: 'Look', hairColor: '#2e2013', f: { hair: 'puff', wardrobe: 'hiking' }, m: { hair: 'twa', wardrobe: 'suit' }, wardrobeColor: '#3a4150' },
  8: { skin: 'brown', tag: 'Look', hairColor: '#191410', f: { hair: 'cornrows', wardrobe: 'hide' }, m: { hair: 'cornrows', wardrobe: 'hiking' }, wardrobeColor: '#6e4a30' },
  9: { skin: 'dark',  tag: 'Look', hairColor: '#3a3a3f', f: { hair: 'twists', wardrobe: 'robe' }, m: { hair: 'locs', wardrobe: 'robe', beard: true }, wardrobeColor: '#3f3a50' },
  // Hollow Bell / Green-Eyed shinobi
  10: { skin: 'tan',  tag: 'Shinobi', f: { hair: 'ponytail', wardrobe: 'ninja' }, m: { hair: 'hood', wardrobe: 'ninja' }, wardrobeColor: '#1a1c22' },
  11: { skin: 'fair', tag: 'Shinobi', f: { hair: 'bun', wardrobe: 'ninja' }, m: { hair: 'sidecut', wardrobe: 'ninja', extras: 'mask' }, wardrobeColor: '#2a3228' },
  // Green-Eyed / Bell samurai
  12: { skin: 'tan',  tag: 'Samurai', f: { hair: 'long', wardrobe: 'samurai' }, m: { hair: 'bun', wardrobe: 'samurai' }, wardrobeColor: '#38343e' },
  13: { skin: 'pale', tag: 'Samurai', f: { hair: 'ponytail', wardrobe: 'samurai' }, m: { hair: 'fringe', wardrobe: 'samurai' }, wardrobeColor: '#3a4a38' },
  // Red Tally privateers
  14: { skin: 'tan',  tag: 'Privateer', f: { hair: 'bandana', wardrobe: 'pirate', extras: 'bandana' }, m: { hair: 'fringe', wardrobe: 'pirate', extras: 'tricorne', beard: true }, wardrobeColor: '#503028' },
  15: { skin: 'brown', tag: 'Privateer', f: { hair: 'long', wardrobe: 'pirate', extras: 'bandana' }, m: { hair: 'dreads', wardrobe: 'pirate', extras: 'bandana', beard: true }, wardrobeColor: '#3a2a22' },
  // Admiralty
  16: { skin: 'fair', tag: 'Admiralty', f: { hair: 'bun', wardrobe: 'navy', extras: 'bicorne' }, m: { hair: 'fringe', wardrobe: 'navy', extras: 'bicorne' }, wardrobeColor: '#2a3a55' },
  17: { skin: 'pale', tag: 'Admiralty', f: { hair: 'ponytail', wardrobe: 'navy' }, m: { hair: 'buzz', wardrobe: 'navy', extras: 'bicorne' }, wardrobeColor: '#243048' },
};

function drawExtras(kind, col) {
  return (ctx, cx, o) => {
    if (kind === 'hood' || o.hairStyle === 'hood') {
      const hc = col || '#2a2d36';
      ctx.fillStyle = hc;
      ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 12, 42, 52, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 42, EYE_Y - 10); ctx.quadraticCurveTo(cx, EYE_Y - 70, cx + 42, EYE_Y - 10); ctx.fill();
    }
    if (kind === 'mask') {
      ctx.fillStyle = shade(col || '#2a2d36', 0.85);
      ctx.beginPath(); ctx.rect(cx - 28, EYE_Y + 10, 56, 22); ctx.fill();
    }
    if (kind === 'bandana') {
      ctx.fillStyle = col || '#8a3020';
      ctx.beginPath();
      ctx.moveTo(cx - 40, EYE_Y - 8);
      ctx.quadraticCurveTo(cx, EYE_Y - 52, cx + 40, EYE_Y - 8);
      ctx.lineTo(cx + 36, EYE_Y + 4);
      ctx.quadraticCurveTo(cx, EYE_Y - 18, cx - 36, EYE_Y + 4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 28, EYE_Y - 6);
      ctx.lineTo(cx + 52, EYE_Y + 18);
      ctx.lineTo(cx + 34, EYE_Y + 4);
      ctx.closePath(); ctx.fill();
    }
    if (kind === 'tricorne') {
      ctx.fillStyle = '#1c1c22';
      ctx.beginPath();
      ctx.moveTo(cx - 54, EYE_Y - 16);
      ctx.quadraticCurveTo(cx, EYE_Y - 8, cx + 54, EYE_Y - 16);
      ctx.quadraticCurveTo(cx + 20, EYE_Y - 54, cx, EYE_Y - 58);
      ctx.quadraticCurveTo(cx - 20, EYE_Y - 54, cx - 54, EYE_Y - 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d4a94e'; ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (kind === 'bicorne') {
      ctx.fillStyle = '#1a2030';
      ctx.beginPath();
      ctx.ellipse(cx, EYE_Y - 36, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 48, EYE_Y - 36);
      ctx.quadraticCurveTo(cx, EYE_Y - 72, cx + 48, EYE_Y - 36);
      ctx.quadraticCurveTo(cx, EYE_Y - 44, cx - 48, EYE_Y - 36);
      ctx.fill();
      ctx.fillStyle = '#d4a94e';
      ctx.beginPath(); ctx.arc(cx, EYE_Y - 40, 3, 0, Math.PI * 2); ctx.fill();
    }
  };
}

function recipePlayer(slot, sex, seed) {
  const r = rngFor(seed || (slot * 7919 + (sex === 'f' ? 13 : 29)));
  const rec = SLOT_RECIPES[slot] || SLOT_RECIPES[1];
  const v = rec[sex] || rec.m;
  const hair = v.hair === 'short' || v.hair === 'bandana' ? 'fringe' : v.hair;
  const extraKind = v.extras || (v.hair === 'hood' ? 'hood' : null);
  return {
    bg: BG[slot % BG.length],
    skin: SKIN[rec.skin],
    hairColor: rec.hairColor || HAIR_COLORS[r.int(0, 4)],
    hairStyle: hair,
    sex, wardrobe: v.wardrobe, wardrobeColor: v.wardrobeColor || rec.wardrobeColor,
    eyes: r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20']),
    jaw: sex === 'f' ? 0 : 1.5, brow: r.int(0, 2), mouth: r.int(0, 3), fringe: r.int(-6, 6),
    beard: sex === 'm' && !!v.beard,
    extras: extraKind ? drawExtras(extraKind, v.wardrobeColor || rec.wardrobeColor) : null,
  };
}

function recipeNPC(sex, seed) {
  const r = rngFor(seed);
  const skins = Object.keys(SKIN).filter(k => k !== 'ashen');
  const styles = sex === 'f' ? ['long', 'braids', 'ponytail', 'bun', 'fringe', 'afro', 'sidecut']
                             : ['fringe', 'buzz', 'bun', 'dreads', 'afro', 'sidecut', 'bald'];
  return {
    bg: BG[r.int(0, BG.length - 1)],
    skin: SKIN[r.pick(skins)],
    hairColor: r.pick(HAIR_COLORS),
    hairStyle: r.pick(styles),
    sex,
    wardrobe: r.pick(['armor', 'hiking', 'robe', 'suit', 'hide', 'ninja']),
    wardrobeColor: r.pick(['#3a4150', '#504338', '#38503e', '#503a3a', '#3f3a50']),
    eyes: r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20', '#3a3a3a']),
    jaw: sex === 'f' ? 0 : r.int(0, 3), brow: r.int(0, 3), mouth: r.int(-1, 3), fringe: r.int(-8, 8),
    beard: sex === 'm' && r.chance(0.4),
    headwear: r.int(0, 7) === 0 ? r.pick(['helm', 'cap', 'hood']) : null,
    cloak: r.int(0, 5) === 0,
  };
}

const SET_LOOK = {
  warrior:           { wardrobe: 'armor',   color: '#5a5f6e', headwear: 'helm' },
  ranger:            { wardrobe: 'hiking',  color: '#3a4a32', headwear: 'cap', cloak: true },
  mage:              { wardrobe: 'robe',    color: '#3a3644', cloak: true },
  healer:            { wardrobe: 'robe',    color: '#4a5a48' },
  assassins_gear:    { wardrobe: 'ninja',   color: '#2a2d36', headwear: 'hood' },
  mercenarys_gear:   { wardrobe: 'armor',   color: '#6a5a48', headwear: 'helm' },
  battle_mages_gear: { wardrobe: 'robe',    color: '#4a3a5a', cloak: true },
  shinobi_gear:      { wardrobe: 'ninja',   color: '#1a1c22', headwear: 'hood' },
  green_eyed_armour: { wardrobe: 'samurai', color: '#4a5a38', headwear: 'helm' },
  privateers_kit:    { wardrobe: 'pirate',  color: '#3a2a22', headwear: 'cap' },
  kings_uniform:     { wardrobe: 'navy',    color: '#2a3a52' },
  // Single-class: silhouette first, then colour. Cross-class mixes two recipes.
  plate:             { wardrobe: 'armor',   color: '#6a7080', headwear: 'helm', cloak: true },
  duelist:           { wardrobe: 'suit',    color: '#4a3a32' },
  leathers:          { wardrobe: 'ninja',   color: '#3a3228', extras: 'mask' },
  adept:             { wardrobe: 'robe',    color: '#2a3850' },
  wildhide:          { wardrobe: 'hide',    color: '#5a4030' },
  hunter:            { wardrobe: 'hiking',  color: '#3a4a28', headwear: 'cap' },
  street:            { wardrobe: 'hiking',  color: '#4a3830', extras: 'mask' },
  oath:              { wardrobe: 'armor',   color: '#5a5a48', cloak: true },
  chantry:           { wardrobe: 'robe',    color: '#4a4a38' },
  greenward:         { wardrobe: 'hide',    color: '#3a4a32', headwear: 'cap', cloak: true },
  shadowweave:       { wardrobe: 'ninja',   color: '#2a2438', headwear: 'hood', cloak: true },
};

function applySetLook(rec, setId) {
  const L = SET_LOOK[setId];
  if (!L || !rec) return rec;
  rec.wardrobe = L.wardrobe;
  rec.wardrobeColor = L.color;
  if (L.headwear) rec.headwear = L.headwear;
  if (L.cloak) rec.cloak = true;
  if (L.extras) rec.extras = typeof L.extras === 'function' ? L.extras : drawExtras(L.extras, L.color);
  return rec;
}

function applyVeteran(rec, ch) {
  if (!rec || !ch) return rec;
  rec.rank = ch.rank || 1;
  rec.quests = ch.questsCompleted || 0;
  if (rec.rank >= 5 && rec.sex === 'm') rec.jaw = Math.min(3, (rec.jaw || 0) + 1);
  if (rec.rank >= 4 && rec.hairColor) rec.hairColor = shade(rec.hairColor, 1.55);
  return rec;
}

// Campaign characters (campaign doc §6a): fixed looks from their data recipe.
function recipeCampaign(id) {
  const def = ADV.DATA.CAMPAIGN_CHARS[id];
  const pr = (def && def.portrait) || { skin: 'tan', hair: 'fringe', wardrobe: 'armor', color: '#4a4a4a' };
  const tint = { maw: '#3a2a4a88', antler: '#2f3f2a88', varenholm: '#2a3a5588' }[def ? def.faction : ''] || '#33333388';
  const r = rngFor(ADV.hashStr(id));
  return {
    bg: tint, skin: SKIN[pr.skin] || SKIN.tan,
    hairColor: pr.skin === 'ashen' ? '#333' : HAIR_COLORS[r.int(0, HAIR_COLORS.length - 1)],
    hairStyle: pr.hair, sex: def ? def.sex : 'm', wardrobe: pr.wardrobe, wardrobeColor: pr.color,
    eyes: pr.skin === 'ashen' ? '#7a9a8a' : r.pick(['#4a3520', '#2f4a2a', '#2a3a55', '#4a2a20']),
    jaw: def && def.sex === 'f' ? 0 : r.int(1, 3), brow: r.int(0, 2), mouth: r.int(-1, 2), fringe: r.int(-6, 6),
  };
}

const HIRO_RECIPE = {
  bg: '#3a2a5588',
  skin: SKIN.dark,
  hairColor: '#6a3faa', hairStyle: 'dreads',    // purple dreadlocks (§14a)
  sex: 'm', wardrobe: 'samurai', wardrobeColor: '#38343e',
  eyes: '#8a7a3a',                              // hazel
  jaw: 2, brow: 1, mouth: 1, fringe: 0,
};

// ---- monster heads ----------------------------------------------------------
function drawMonster(ctx, typeId, tint) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tint ? tint + '66' : '#4a303055';
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.05)'); grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  if (typeId === 'dire_wolf') {
    const fur = tint || '#5a5a5f';
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 30, 75, 65, 0, 0, Math.PI * 2); ctx.fill(); // ruff
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 4, 48, 44, 0, 0, Math.PI * 2); ctx.fill(); // head
    for (const s of [-1, 1]) { // ears
      ctx.beginPath(); ctx.moveTo(cx + s * 20, EYE_Y - 30);
      ctx.lineTo(cx + s * 44, EYE_Y - 72); ctx.lineTo(cx + s * 44, EYE_Y - 28); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = shade(fur, 0.8); // snout
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 34, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y + 24, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (const s of [-1, 1]) { // eyes
      ctx.fillStyle = '#c8a018';
      ctx.beginPath(); ctx.ellipse(cx + s * 20, EYE_Y - 4, 8, 5, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#131313';
      ctx.beginPath(); ctx.arc(cx + s * 20, EYE_Y - 4, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 3; // fangs
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 12, EYE_Y + 48); ctx.lineTo(cx + s * 10, EYE_Y + 58); ctx.stroke();
    }
    return;
  }
  if (typeId === 'plated_sentinel') {
    const metal = tint || '#6e7480';
    drawWardrobe(ctx, { wardrobe: 'armor', wardrobeColor: shade(metal, 0.8), skin: SKIN.ashen, sex: 'm' }, cx);
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.rect(cx - 34, EYE_Y - 44, 68, 92); ctx.fill(); // helm block
    ctx.fillStyle = shade(metal, 1.25);
    ctx.beginPath(); ctx.rect(cx - 34, EYE_Y - 44, 68, 18); ctx.fill();
    ctx.fillStyle = '#0e0e12';
    ctx.fillRect(cx - 26, EYE_Y - 8, 52, 14); // visor slit
    ctx.fillStyle = '#58c8e8';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 14, EYE_Y - 1, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = shade(metal, 0.6); ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 34, EYE_Y + 12 + i * 12); ctx.lineTo(cx + 34, EYE_Y + 12 + i * 12); ctx.stroke(); }
    return;
  }
  // human-frame monsters
  const rec = {
    bandit:       { skin: SKIN.tan, hairStyle: 'hood', hairColor: '#332d26', wardrobe: 'ninja', wardrobeColor: tint || '#4a3f30', eyes: '#3a3a3a', mask: true },
    hedge_mage:   { skin: SKIN.pale, hairStyle: 'long', hairColor: '#7a7a72', wardrobe: 'robe', wardrobeColor: tint || '#3f3a50', eyes: '#2a3a55', hat: true },
    grave_acolyte:{ skin: SKIN.ashen, hairStyle: 'bald', hairColor: '#222', wardrobe: 'robe', wardrobeColor: tint || '#333833', eyes: '#5d8a4a', cowl: true },
  }[typeId] || recipeNPC('m', 1);
  const o = Object.assign({ sex: 'm', jaw: 2, brow: 2, mouth: -1, bg: 'transparent' }, rec);
  o.skin = rec.skin;
  drawBust(ctx, Object.assign({}, o, { bg: 'rgba(0,0,0,0)' }));
  if (rec.mask) {
    ctx.fillStyle = '#2a2620';
    ctx.beginPath(); ctx.rect(cx - 30, EYE_Y + 12, 60, 26); ctx.fill();
    // hood up
    ctx.fillStyle = shade(rec.wardrobeColor, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 14, 44, 54, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 44, EYE_Y - 12); ctx.quadraticCurveTo(cx, EYE_Y - 74, cx + 44, EYE_Y - 12); ctx.fill();
  }
  if (rec.hat) {
    ctx.fillStyle = shade(rec.wardrobeColor, 1.1);
    ctx.beginPath(); ctx.moveTo(cx - 52, EYE_Y - 26); ctx.lineTo(cx + 52, EYE_Y - 26); ctx.lineTo(cx + 8, EYE_Y - 96); ctx.closePath(); ctx.fill();
  }
  if (rec.cowl) {
    ctx.fillStyle = shade(rec.wardrobeColor, 0.85);
    ctx.beginPath(); ctx.ellipse(cx, EYE_Y - 16, 46, 56, 0, Math.PI, 0); ctx.fill();
  }
}

// ---- public API -------------------------------------------------------------
const cacheKeys = new Set();
// Blinking repaints over the bust rather than regenerating the texture, so the
// eye geometry and skin tone of each portrait are kept beside its cache key.
const META = {};

const Portraits = {
  W, H,
  CREATION_SLOTS: 17,
  slotTag(slot) {
    const rec = SLOT_RECIPES[slot];
    return (rec && rec.tag) || 'Look';
  },
  // Returns a texture key, generating the canvas texture on first request.
  key(scene, ch) {
    let key;
    const TYPE_TINTS = { marsh_stalker: '#2a4a2a', ember_cultist: '#7a3a1a', frost_hag: '#2a4a6a', gravewarden: '#3a3a26' };
    const typeTint = ch.isMonster && TYPE_TINTS[ch.enemyTypeId];
    const setBit = ch.equippedSet ? '_s' + ch.equippedSet : '';
    const vetBit = '_r' + (ch.rank || 1) + 'q' + (ch.questsCompleted || 0);
    if (ch.portraitId && ch.isMonster) key = 'pm6_' + ch.portraitId + (ch.boss ? '_boss' : '') + (ch.isUndead ? '_risen' : '') + (typeTint ? '_' + ch.enemyTypeId : '');
    else if (ch.portraitKind === 'campaign') key = 'pc5_' + ch.portraitId + setBit + vetBit;
    else if (ch.portraitId) key = 'pr5_' + ch.portraitId + setBit + vetBit;
    else if (ch.portraitKind === 'player') key = 'pp5_' + ch.portraitSlot + '_' + ch.sex + '_' + (ch.portraitSeed % 1000) + setBit + vetBit;
    else key = 'pn6_' + ch.sex + '_' + ch.portraitSeed + setBit + vetBit;
    if (cacheKeys.has(key) && scene.textures.exists(key)) return key;
    let rec = null;
    const tex = scene.textures.createCanvas(key, W, H);
    const ctx = tex.getContext();
    if (ch.isMonster) {
      const bossTints = { bandit: '#7a3a2a', hedge_mage: '#5a2a6a', dire_wolf: '#3a1f1f', plated_sentinel: '#7a6a2a', grave_acolyte: '#2a4a3a' };
      drawMonster(ctx, ch.portraitId, ch.isUndead ? '#2a3a3a' : ch.boss ? bossTints[ch.portraitId] : (typeTint || null));
    } else {
      // keep the recipe: the blink needs this character's own skin tone
      if (ch.portraitKind === 'campaign') rec = recipeCampaign(ch.portraitId);
      else if (ch.portraitId === 'hiro') rec = Object.assign({}, HIRO_RECIPE);
      else if (ch.portraitKind === 'player') rec = recipePlayer(ch.portraitSlot || 1, ch.sex, ch.portraitSeed);
      else rec = recipeNPC(ch.sex, ch.portraitSeed);
      if (ch.equippedSet) applySetLook(rec, ch.equippedSet);
      applyVeteran(rec, ch);
      drawBust(ctx, rec);
    }
    tex.refresh();
    cacheKeys.add(key);
    if (!META[key]) {
      const lidHex = rec && rec.skin ? shade(rec.skin[0], 0.97) : null;
      const hairHex = rec && rec.hairColor ? rec.hairColor : null;
      META[key] = { eyeY: EYE_Y, eyeDX: 14, monster: !!ch.isMonster,
        lid: lidHex ? parseInt(lidHex.slice(1), 16) : null,
        hair: hairHex ? parseInt(hairHex.slice(1), 16) : null,
        browY: EYE_Y - 12, mouthY: EYE_Y + 30 };
    }
    return key;
  },
  // Idle life. A bust that breathes and blinks reads as a person; the same bust
  // held perfectly still reads as a placeholder. Two tweens, no new textures.
  // Call after placing the image; returns a stop() for scenes that tear down.
  animate(scene, img, ch, key) {
    if (!scene || !img || !img.scene) return () => {};
    const meta = (key && META[key]) || { eyeY: EYE_Y, eyeDX: 14, monster: !!(ch && ch.isMonster) };
    const seed = Math.abs(((ch && (ch.portraitSeed || 0)) | 0) + ((ch && ch.name) ? ch.name.length : 0));
    const y0 = img.y;
    // breathe — offset per character so a row of them never marches in step
    const bob = scene.tweens.add({
      targets: img, y: y0 - 2, duration: 2200 + (seed % 900),
      delay: seed % 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    if (meta.monster) return () => { try { bob.remove(); } catch (e) {} };

    // blink: two lids painted over the eye line, in the portrait's own skin tone
    const lids = [];
    const drawLids = () => {
      const w = img.displayWidth, h = img.displayHeight;
      const ey = img.y - h / 2 + h * (meta.eyeY / H);
      const dx = w * (meta.eyeDX / W);
      for (const sgn of [-1, 1]) {
        const g = scene.add.graphics().setDepth((img.depth || 0) + 1);
        lids.push(g);
        g.fillStyle(meta.lid != null ? meta.lid : 0x8a5c3a, 1);
        g.fillEllipse(img.x + sgn * dx, ey, w * (17 / W), h * (12 / H));
      }
    };
    const clearLids = () => { for (const g of lids.splice(0)) { try { g.destroy(); } catch (e) {} } };
    let timer = null;
    const schedule = () => {
      timer = scene.time.delayedCall(2600 + Math.random() * 4200, () => {
        if (!img.scene) return;
        drawLids();
        scene.time.delayedCall(95, () => { clearLids(); if (img.scene) schedule(); });
      });
    };
    schedule();
    const stop = () => { try { bob.remove(); } catch (e) {} if (timer) { try { timer.remove(false); } catch (e) {} } clearLids(); };
    // scenes destroy portraits constantly (panel switches, scene restarts); clean
    // up with the image so no tween or timer outlives it
    try { img.once('destroy', stop); } catch (e) {}
    return stop;
  },

  // Brow + mouth overlay. Neutral draws nothing. Depth sits above the blink
  // lids (depth+1) so a blink still covers the eyes and never fights the face.
  express(scene, img, ch, key, mood) {
    if (!scene || !img || !img.scene) return () => {};
    mood = mood || 'neutral';
    if (img.__expressStop) {
      try { img.__expressStop(); } catch (e) {}
      img.__expressStop = null;
    }
    img.__expressMood = mood;
    if (mood === 'neutral' || (ch && ch.isMonster)) {
      const noop = () => { img.__expressMood = 'neutral'; img.__expressStop = null; };
      img.__expressStop = noop;
      try { img.once('destroy', noop); } catch (e) {}
      return noop;
    }
    const meta = (key && META[key]) || { eyeY: EYE_Y, eyeDX: 14 };
    const g = scene.add.graphics().setDepth((img.depth || 0) + 3);
    const paint = () => {
      if (!img.scene) return;
      g.clear();
      const w = img.displayWidth, h = img.displayHeight;
      const ey = img.y - h / 2 + h * ((meta.eyeY || EYE_Y) / H);
      const dx = w * ((meta.eyeDX || 14) / W);
      const browY = ey - h * (12 / H);
      const mouthY = ey + h * (30 / H);
      const browCol = meta.hair != null ? meta.hair : (meta.lid != null ? meta.lid : 0x2a1c12);
      const mouthCol = meta.lid != null ? meta.lid : 0x6a4030;
      const lw = Math.max(2, w * (2.6 / W));
      g.lineStyle(lw, browCol, 0.95);
      const brow = (sgn, y0, y1) => {
        g.beginPath();
        g.moveTo(img.x + sgn * (dx - w * (8 / W)), y0);
        g.lineTo(img.x + sgn * (dx + w * (8 / W)), y1);
        g.strokePath();
      };
      const mouth = (curve) => {
        g.lineStyle(lw, mouthCol, 0.95);
        g.beginPath();
        g.moveTo(img.x - w * (8 / W), mouthY);
        g.lineTo(img.x, mouthY + curve);
        g.lineTo(img.x + w * (8 / W), mouthY);
        g.strokePath();
      };
      if (mood === 'happy') { brow(-1, browY + 1, browY - 1); brow(1, browY + 1, browY - 1); mouth(h * (4 / H)); }
      else if (mood === 'sad') { brow(-1, browY - 3, browY + 2); brow(1, browY - 3, browY + 2); mouth(-h * (4 / H)); }
      else if (mood === 'angry') { brow(-1, browY - 4, browY + 2); brow(1, browY - 4, browY + 2); mouth(-h * (1 / H)); }
      else if (mood === 'afraid') { brow(-1, browY + 2, browY - 4); brow(1, browY + 2, browY - 4); mouth(-h * (3 / H)); }
      else if (mood === 'hurt') { brow(-1, browY - 3, browY + 1); brow(1, browY + 1, browY - 2); mouth(-h * (2 / H)); }
    };
    paint();
    const tick = () => { if (img.scene) paint(); };
    scene.events.on('update', tick);
    const stop = () => {
      try { scene.events.off('update', tick); } catch (e) {}
      try { g.destroy(); } catch (e) {}
      img.__expressMood = null;
      img.__expressStop = null;
    };
    try { img.once('destroy', stop); } catch (e) {}
    img.__expressStop = stop;
    return stop;
  },

  // For the creation screen grid
  creationKey(scene, slot, sex) {
    return Portraits.key(scene, { portraitKind: 'player', portraitSlot: slot, sex, portraitSeed: slot * 7919 + (sex === 'f' ? 13 : 29) });
  },
  hiroKey(scene) { return Portraits.key(scene, { portraitId: 'hiro', portraitKind: 'player', sex: 'm' }); },
};

ADV.Portraits = Portraits;
})();
