// Full-bleed town backdrops keyed to the player's home. Hub panels sit nearly
// opaque on top; the art shows through at the edges and during the embark beat.
// Lighting follows the world clock: day → evening → night → day.
(function () {
'use strict';
const T = () => ADV.T;

function sky(g, W, H, top, bot) {
  g.fillStyle(top, 1); g.fillRect(0, 0, W, H);
  g.fillStyle(bot, 0.55); g.fillRect(0, H * 0.38, W, H * 0.62);
}

function stars(g, n, seed) {
  let s = seed || 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.fillStyle(0xf4eee0, 0.85);
  for (let i = 0; i < n; i++) g.fillCircle(20 + rnd() * 1240, 10 + rnd() * 220, rnd() > 0.8 ? 1.6 : 1);
}

function hill(g, x, y, w, h, color) {
  g.fillStyle(color, 1);
  g.fillEllipse(x + w / 2, y + h, w, h * 2);
}

function tree(g, x, y, h, trunk, leaf) {
  g.fillStyle(trunk, 1);
  g.fillRect(x - 5, y - h * 0.35, 10, h * 0.4);
  g.fillStyle(leaf, 1);
  g.fillCircle(x, y - h * 0.45, h * 0.28);
  g.fillCircle(x - h * 0.16, y - h * 0.32, h * 0.2);
  g.fillCircle(x + h * 0.16, y - h * 0.32, h * 0.2);
}

function horse(g, x, y, flip) {
  const s = flip ? -1 : 1;
  g.fillStyle(0x5a4030, 1);
  g.fillRoundedRect(x, y, 46, 22, 6);
  g.fillRect(x + 4, y + 20, 6, 18);
  g.fillRect(x + 36, y + 20, 6, 18);
  g.fillTriangle(x + (s > 0 ? 46 : 0), y + 4, x + (s > 0 ? 70 : -24), y - 6, x + (s > 0 ? 46 : 0), y + 16);
  g.fillCircle(x + (s > 0 ? 64 : -18), y - 4, 7);
  g.fillStyle(0x3a2a20, 1);
  g.fillRect(x + 10, y - 8, 8, 10);
}

function sun(g, x, y, r) {
  g.fillStyle(0xf4d78a, 1); g.fillCircle(x, y, r);
  g.fillStyle(0xf4eee0, 0.9); g.fillCircle(x, y, r * 0.5);
}

function duskSun(g, x, y, r) {
  g.fillStyle(0xe87840, 1); g.fillCircle(x, y, r);
  g.fillStyle(0xf4c070, 0.85); g.fillCircle(x, y, r * 0.5);
}

function moon(g, x, y, r, skyTop) {
  g.fillStyle(0xd8c48a, 0.9); g.fillCircle(x, y, r);
  g.fillStyle(skyTop, 1); g.fillCircle(x - r * 0.4, y - r * 0.22, r * 0.82);
}

function celestial(g, phase, skyTop, seed) {
  if (phase === 'day') sun(g, 1080, 70, 36);
  else if (phase === 'evening') { duskSun(g, 980, 118, 32); stars(g, 14, seed || 7); }
  else { stars(g, 64, seed || 42); moon(g, 1080, 70, 28, skyTop); }
}

function litWindow(g, x, y, w, h, phase) {
  if (phase === 'day') { g.fillStyle(0xc8d8e8, 1); g.fillRect(x, y, w, h); }
  else if (phase === 'evening') { g.fillStyle(0xe8a050, 0.9); g.fillRect(x, y, w, h); }
  else {
    g.fillStyle(0x1a2838, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xd4a94e, 0.5); g.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
}

const SKY = {
  camp:     { day: [0x6fa0bf, 0xd8c48a], evening: [0xc06038, 0x3a1810], night: [0x0c1018, 0x1a1410] },
  cottage:  { day: [0x6fa0bf, 0xd8c48a], evening: [0xc07040, 0x5a3020], night: [0x0e1420, 0x1a2230] },
  brick:    { day: [0x7aa0c0, 0xd0c0a8], evening: [0x4a5a6a, 0xb8a090], night: [0x121820, 0x1c2430] },
  mansion:  { day: [0x6a80a0, 0xe8c090], evening: [0x8a6048, 0xc89060], night: [0x101820, 0x1a2430] },
  castle:   { day: [0x6a88b0, 0xc8b090], evening: [0x4a2a40, 0x8a4a50], night: [0x2a1a3a, 0x6a4a50] },
};

function haze(g, W, H, color, a) {
  g.fillStyle(color, a);
  g.fillRect(0, 0, W, H * 0.42);
}

function vignette(scene, a) {
  const key = (ADV.VFX && ADV.VFX._tex) ? ADV.VFX._tex.glowKey(scene) : null;
  const v = scene.add.rectangle(T().W / 2, T().H / 2, T().W, T().H, 0x000000, 0).setDepth(-4);
  const g = scene.add.graphics().setDepth(-4);
  g.fillStyle(0x000000, a == null ? 0.18 : a);
  g.fillRect(0, 0, T().W, 36);
  g.fillRect(0, T().H - 36, T().W, 36);
  g.fillRect(0, 0, 28, T().H);
  g.fillRect(T().W - 28, 0, 28, T().H);
  return [v, g, key];
}

function lightPool(scene, x, y, color, r, a) {
  try {
    const key = ADV.VFX && ADV.VFX._tex && ADV.VFX._tex.glowKey(scene);
    if (key && scene.add.image) {
      const img = scene.add.image(x, y, key).setDepth(-6).setBlendMode(Phaser.BlendModes.ADD);
      img.setDisplaySize(r * 2, r * 1.2);
      if (img.setTint) img.setTint(color || 0xd4a94e);
      img.setAlpha(a);
      return img;
    }
  } catch (e) {}
  return scene.add.circle(x, y, r, color || 0xd4a94e, a).setDepth(-6);
}

const HousingArt = {};
HousingArt.weatherKind = function (clock, world) {
  if (ADV.Weather && ADV.Weather.at) {
    return ADV.Weather.at(world || { seed: 1, questClock: clock || 0 }).kind;
  }
  const n = ((((clock | 0) * 17 + 5) % 10) + 10) % 10;
  if (n < 2) return 'rain';
  if (n === 2) return 'snow';
  return 'clear';
};

HousingArt.paint = function (scene, homeId) {
  if (scene.homeArt) { try { scene.homeArt.destroy(true); } catch (e) { try { scene.homeArt.destroy(); } catch (e2) {} } }
  if (scene.homeLife) { try { scene.homeLife.destroy(true); } catch (e) {} scene.homeLife = null; }
  if (scene.weatherFx && scene.weatherFx.destroy) { try { scene.weatherFx.destroy(); } catch (e) {} }
  const W = T().W, H = T().H;
  const id = homeId || 'camp';
  const world = scene.game_ && scene.game_.world;
  const clock = (world && world.questClock) || 0;
  const phase = ADV.Housing.timeOfDay(clock);
  const far = scene.add.graphics().setScrollFactor(0.3);
  const mid = scene.add.graphics().setScrollFactor(0.6);
  const near = scene.add.graphics().setScrollFactor(1);
  const planes = scene.add.container(0, 0).setDepth(-10);
  planes.add([far, mid, near]);
  scene.homeArt = planes;
  scene.homePlanes = { far, mid, near };
  scene.tweens.add({ targets: far, x: 3, duration: 12000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  if (id === 'inn') inn(mid, W, H, phase);
  else if (id === 'cottage') cottage(mid, W, H, phase);
  else if (id === 'brick') brick(mid, W, H, phase);
  else if (id === 'mansion') mansion(mid, W, H, phase);
  else if (id === 'castle') castle(mid, W, H, phase);
  else camp(far, mid, near, W, H, phase);
  paintLife(scene, id, phase, clock);
  const weather = ADV.Weather
    ? ADV.Weather.at(world || { seed: 1, questClock: clock }, { phase })
    : { kind: HousingArt.weatherKind(clock, world), intensity: 0.6, wind: 0.3 };
  let mask = null;
  if (id === 'inn' && scene.makeGeometryMask) {
    const mg = scene.add.graphics();
    mg.fillStyle(0xffffff, 1); mg.fillRect(980, 140, 160, 200);
    mask = mg.createGeometryMask();
    mg.setVisible(false);
  }
  if (ADV.WeatherFX) {
    ADV.WeatherFX.attach(scene, weather, phase, { x: 0, y: 0, w: W, h: H }, {
      depth: -5, town: true, sunX: 1080, sunY: phase === 'evening' ? 118 : 70,
      tintScale: id === 'inn' ? 0.5 : 1,
      mask: (weather.kind === 'rain' || weather.kind === 'snow' || weather.kind === 'storm') ? mask : null,
    });
  }
  scene.homePost = vignette(scene, 0.18);
  return planes;
};

function camp(far, mid, near, W, H, phase) {
  const [top, bot] = SKY.camp[phase];
  sky(far, W, H, top, bot);
  celestial(far, phase, top, 42);
  haze(far, W, H, top, phase === 'day' ? 0.22 : 0.32);
  const litF = phase === 'day' ? 1.12 : phase === 'evening' ? 1.18 : 0.92;
  const shdF = phase === 'day' ? 0.82 : phase === 'evening' ? 0.72 : 0.7;
  const hillA = phase === 'night' ? 0x1a2218 : phase === 'evening' ? 0x2a2818 : 0x3a5a32;
  const hillB = phase === 'night' ? 0x162018 : phase === 'evening' ? 0x242018 : 0x2e4a28;
  const hillC = phase === 'night' ? 0x1c241a : phase === 'evening' ? 0x2c2418 : 0x355828;
  hill(far, -40, 390, 520, 160, shadeHex(hillA, shdF));
  hill(far, -20, 400, 480, 130, shadeHex(hillA, litF));
  hill(mid, 380, 410, 620, 150, hillB);
  hill(mid, 400, 420, 560, 120, shadeHex(hillB, litF));
  hill(far, 860, 380, 500, 170, hillC);
  mid.fillStyle(phase === 'night' ? 0x12100e : 0x3a3028, 1);
  for (const [x, hh] of [[920, 48], [948, 62], [980, 40], [1008, 70], [1040, 44], [1072, 56], [1100, 38]]) {
    mid.fillRect(x, 430 - hh, 22, hh);
    mid.fillStyle(shadeHex(phase === 'night' ? 0x12100e : 0x3a3028, litF), 1);
    mid.fillRect(x, 430 - hh, 6, hh);
    mid.fillStyle(phase === 'night' ? 0x12100e : 0x3a3028, 1);
  }
  const lamp = phase === 'day' ? 0 : phase === 'evening' ? 0.7 : 0.85;
  if (lamp) {
    mid.fillStyle(0xd4a94e, lamp);
    for (const [x, y] of [[928, 400], [956, 388], [988, 408], [1016, 378], [1048, 404], [1080, 392]]) mid.fillRect(x, y, 4, 5);
  }
  near.fillStyle(phase === 'night' ? 0x2a2418 : 0x4a6a38, 1); near.fillRect(0, 520, W, H - 520);
  near.fillStyle(phase === 'night' ? 0x3a3224 : 0x5a7a44, 1); near.fillTriangle(0, 520, 200, 500, 420, 530);
  near.fillTriangle(700, 525, 980, 495, W, 530);
  for (let i = 0; i < 18; i++) {
    near.fillStyle(phase === 'night' ? 0x243020 : 0x4a6a34, 0.7);
    near.fillTriangle(30 + i * 70, 720, 48 + i * 70, 688, 66 + i * 70, 720);
  }
  const trunk = phase === 'day' ? 0x4a3020 : 0x2a2014;
  const leaf = phase === 'day' ? 0x2a5a28 : 0x1a2a18;
  tree(near, 110, 520, 140, trunk, leaf);
  tree(near, 1180, 530, 160, trunk, phase === 'day' ? 0x245022 : 0x152218);
  tree(near, 240, 545, 90, trunk, leaf);
  near.fillStyle(shadeHex(leaf, litF), 0.45);
  near.fillCircle(96, 520 - 140 * 0.45, 18);
  near.fillCircle(1164, 530 - 160 * 0.45, 20);
  near.fillStyle(0x3a3028, 1); near.fillRoundedRect(560, 575, 90, 28, 10);
  near.fillStyle(0x5a4030, 1); near.fillRoundedRect(568, 568, 74, 18, 8);
  const fire = phase === 'day' ? 0.25 : phase === 'evening' ? 0.55 : 0.85;
  near.fillStyle(0x7a3a1a, 0.2 + fire * 0.2); near.fillCircle(720, 582, 48);
  near.fillStyle(0xd4a94e, fire); near.fillCircle(720, 582, 18);
  near.fillStyle(0xd8574a, fire > 0.4 ? 1 : 0.4); near.fillCircle(720, 580, 9);
  near.fillStyle(0x3a2a20, 1);
  near.fillTriangle(704, 598, 710, 568, 716, 598);
  near.fillTriangle(724, 598, 730, 566, 736, 598);
}

function shadeHex(hex, f) {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((hex >> 8) & 255) * f));
  const b = Math.min(255, Math.round((hex & 255) * f));
  return (r << 16) | (g << 8) | b;
}

function inn(g, W, H, phase) {
  const wall = phase === 'day' ? 0x6a4a32 : phase === 'evening' ? 0x4a3020 : 0x3a281c;
  const beam = phase === 'day' ? 0x8a6a48 : phase === 'evening' ? 0x5a4030 : 0x4a3424;
  const roof = phase === 'day' ? 0x4a3020 : 0x2a1c14;
  g.fillStyle(wall, 1); g.fillRect(0, 0, W, H);
  g.fillStyle(beam, 1);
  for (let y = 80; y < H; y += 28) g.fillRect(0, y, W, 3);
  g.fillStyle(roof, 1); g.fillRect(0, 0, W, 70);
  g.fillTriangle(0, 70, 80, 0, 160, 70);
  g.fillTriangle(W, 70, W - 80, 0, W - 160, 70);
  g.fillRect(W / 2 - 20, 0, 40, 80);
  // window onto the yard
  if (phase === 'day') {
    g.fillStyle(0x6fa0bf, 1); g.fillRect(980, 140, 160, 200);
    g.fillStyle(0xd8c48a, 0.35); g.fillRect(980, 240, 160, 100);
  } else if (phase === 'evening') {
    g.fillStyle(0xc06038, 1); g.fillRect(980, 140, 160, 200);
    g.fillStyle(0xe8a050, 0.35); g.fillRect(980, 140, 160, 200);
  } else {
    g.fillStyle(0x1a2838, 1); g.fillRect(980, 140, 160, 200);
    g.fillStyle(0xd4a94e, 0.15); g.fillRect(980, 140, 160, 200);
  }
  g.lineStyle(8, 0x5a4030, 1); g.strokeRect(980, 140, 160, 200);
  g.lineBetween(1060, 140, 1060, 340); g.lineBetween(980, 240, 1140, 240);
  g.fillStyle(0x5a4030, 1); g.fillRoundedRect(80, 480, 340, 160, 8);
  g.fillStyle(0x8a6a4a, 1); g.fillRoundedRect(96, 460, 308, 90, 10);
  g.fillStyle(0xe8dfc8, 1); g.fillRoundedRect(110, 470, 80, 48, 12);
  const lamp = phase === 'day' ? 0.15 : phase === 'evening' ? 0.7 : 0.9;
  g.fillStyle(0xd4a94e, lamp * 0.6); g.fillCircle(640, 200, 50);
  g.fillStyle(0xf4eee0, lamp); g.fillCircle(640, 200, 16);
  g.fillStyle(0x3a2a20, 1); g.fillRect(632, 80, 16, 90);
  g.fillStyle(roof, 1); g.fillRect(0, 640, W, 120);
}

function cottage(g, W, H, phase) {
  const [top, bot] = SKY.cottage[phase];
  sky(g, W, H, top, bot);
  celestial(g, phase, top, 11);
  g.fillStyle(phase === 'night' ? 0x1a2a18 : phase === 'evening' ? 0x2a4a22 : 0x3a5a32, 1); g.fillRect(0, 430, W, H - 430);
  g.fillStyle(phase === 'night' ? 0x243228 : 0x4a6a38, 1); g.fillTriangle(0, 430, 300, 400, 620, 440);
  const trunk = 0x4a3020, leaf = phase === 'night' ? 0x1a3a1c : 0x2a5a28;
  tree(g, 160, 430, 180, trunk, leaf);
  tree(g, 1140, 420, 200, trunk, phase === 'night' ? 0x163218 : 0x245022);
  tree(g, 980, 445, 140, 0x3a2818, leaf);
  g.fillStyle(0x6e4a30, 1); g.fillRect(430, 310, 380, 200);
  g.fillStyle(0x5a3a26, 1);
  g.fillTriangle(400, 318, 620, 180, 840, 318);
  g.fillStyle(0x4a3020, 1); g.fillRect(700, 200, 36, 90);
  g.fillStyle(phase === 'day' ? 0x8a8a82 : 0x6b6151, 0.7); g.fillEllipse(718, 188, 44, 32);
  g.fillStyle(0x3a2418, 1); g.fillRect(580, 390, 70, 120);
  g.fillStyle(0xd4a94e, 0.5); g.fillCircle(638, 450, 5);
  litWindow(g, 470, 360, 70, 70, phase);
  litWindow(g, 700, 360, 70, 70, phase);
  g.lineStyle(3, 0x3a2418, 1); g.strokeRect(470, 360, 70, 70); g.strokeRect(700, 360, 70, 70);
  g.lineBetween(505, 360, 505, 430); g.lineBetween(470, 395, 540, 395);
  g.fillStyle(0x5a4a30, 1); g.fillRect(560, 500, 40, 80);
  g.fillStyle(phase === 'night' ? 0x3a5a32 : 0x5d8a4a, 1);
  for (let i = 0; i < 8; i++) g.fillCircle(360 + i * 18, 518, 7);
  g.fillStyle(0x9a70c0, 1); g.fillCircle(368, 512, 3); g.fillCircle(420, 510, 3);
}

function brick(g, W, H, phase) {
  const [top, bot] = SKY.brick[phase];
  sky(g, W, H, top, bot);
  celestial(g, phase, top, 19);
  g.fillStyle(phase === 'night' ? 0x2a2a28 : 0x4a4a48, 1); g.fillRect(0, 500, W, H - 500);
  g.fillStyle(0x5a5a56, 1);
  for (let x = 0; x < W; x += 28) g.fillRect(x, 498, 18, 8);
  g.fillStyle(0x8a4030, 1); g.fillRect(360, 240, 520, 280);
  g.fillStyle(0x6e3428, 1);
  for (let y = 250; y < 510; y += 16) {
    for (let x = 368 + ((y / 16) % 2) * 12; x < 860; x += 28) g.fillRect(x, y, 24, 12);
  }
  g.fillStyle(0x3a2a28, 1); g.fillTriangle(340, 250, 620, 140, 900, 250);
  g.fillRect(780, 160, 40, 80);
  g.fillStyle(0x2a221c, 1); g.fillRect(560, 390, 80, 130);
  g.fillStyle(0xd4a94e, 0.6); g.fillCircle(628, 460, 5);
  litWindow(g, 420, 300, 70, 90, phase);
  litWindow(g, 740, 300, 70, 90, phase);
  g.lineStyle(4, 0x2a1c14, 1); g.strokeRect(420, 300, 70, 90); g.strokeRect(740, 300, 70, 90);
  g.fillStyle(0x3a3a38, 1); g.fillRect(320, 500, 10, 70); g.fillRect(910, 500, 10, 70);
  g.fillStyle(phase === 'day' ? 0x8a8a82 : 0xd4a94e, phase === 'day' ? 0.4 : 0.7);
  g.fillCircle(325, 490, 8); g.fillCircle(915, 490, 8);
  g.fillStyle(0x2a4a2a, 1);
  for (let i = 0; i < 6; i++) g.fillRect(200 + i * 14, 470, 8, 40);
}

function mansion(g, W, H, phase) {
  const [top, bot] = SKY.mansion[phase];
  sky(g, W, H, top, bot);
  celestial(g, phase, top, 23);
  g.fillStyle(phase === 'night' ? 0x1a2a18 : 0x3a5a32, 1); g.fillRect(0, 500, W, H - 500);
  g.fillStyle(0x5a5a50, 1); g.fillEllipse(640, 530, 560, 100);
  g.fillStyle(phase === 'day' ? 0x6fa0bf : 0x4a6f8a, 0.8); g.fillCircle(640, 520, 22);
  g.fillStyle(0xe8dfc8, 1); g.fillRect(340, 220, 560, 280);
  g.fillStyle(0xd8c8b0, 1); g.fillRect(300, 250, 80, 250); g.fillRect(860, 250, 80, 250);
  g.fillStyle(0x6a4a3a, 1); g.fillTriangle(280, 258, 640, 90, 1000, 258);
  for (const x of [380, 460, 700, 780]) litWindow(g, x, 280, 44, 70, phase);
  g.fillStyle(0x3a2a20, 1); g.fillRect(580, 360, 80, 140);
  g.fillRect(400, 200, 18, 50); g.fillRect(820, 200, 18, 50);
  tree(g, 140, 500, 170, 0x4a3020, phase === 'night' ? 0x1a3a1c : 0x2a5a28);
  tree(g, 1160, 505, 180, 0x4a3020, phase === 'night' ? 0x163218 : 0x245022);
  horse(g, 180, 500, false);
  horse(g, 980, 498, true);
  g.fillStyle(0x4a3a28, 1); g.fillRect(170, 518, 8, 28); g.fillRect(1070, 518, 8, 28);
}

function castle(g, W, H, phase) {
  const [top, bot] = SKY.castle[phase];
  sky(g, W, H, top, bot);
  celestial(g, phase, top, 9);
  hill(g, -20, 420, 400, 140, phase === 'day' ? 0x3a4a38 : 0x2a2430);
  hill(g, 900, 400, 420, 160, phase === 'day' ? 0x324030 : 0x241e2a);
  g.fillStyle(phase === 'day' ? 0x5a5a66 : 0x3a3a44, 1); g.fillRect(0, 540, W, H - 540);
  g.fillStyle(0x5a5a66, 1); g.fillRect(300, 220, 640, 340);
  g.fillStyle(0x4a4a58, 1); g.fillRect(240, 160, 110, 400); g.fillRect(890, 150, 120, 410);
  g.fillRect(560, 100, 130, 200);
  const merlon = (x, y, n) => { for (let i = 0; i < n; i++) g.fillRect(x + i * 18, y, 10, 16); };
  g.fillStyle(0x6a6a78, 1);
  merlon(300, 204, 34); merlon(240, 144, 6); merlon(890, 134, 6); merlon(560, 84, 7);
  g.fillStyle(0x6a4a8a, 1); g.fillRect(268, 80, 12, 70); g.fillTriangle(262, 80, 274, 48, 286, 80);
  g.fillStyle(0xa8352c, 1); g.fillRect(920, 70, 12, 80); g.fillTriangle(914, 70, 926, 36, 938, 70);
  g.fillStyle(0x1a181c, 1); g.fillRect(560, 390, 120, 170);
  g.fillStyle(0xd4a94e, phase === 'day' ? 0.15 : 0.35); g.fillEllipse(620, 470, 80, 140);
  for (const [x, y] of [[340, 280], [420, 280], [780, 280], [860, 280], [270, 240], [930, 230], [590, 160]]) {
    litWindow(g, x, y, 28, 40, phase);
  }
  g.fillStyle(0x2a2a34, 1); g.fillRect(200, 540, 840, 24);
}

function paintLife(scene, id, phase, clock) {
  const life = scene.add.container(0, 0).setDepth(-9);
  scene.homeLife = life;
  if (id !== 'inn') paintCrowd(scene, life, clock);
  if (!ADV.WeatherFX) {
    const weather = HousingArt.weatherKind(clock);
    if (weather === 'rain') paintRain(scene, life);
    if (weather === 'snow') paintSnow(scene, life);
  }
  smokeStacks(scene, life, id);
  flickerLamps(scene, life, id, phase);
  if (id === 'camp') {
    const fireA = phase === 'day' ? 0.12 : phase === 'evening' ? 0.4 : 0.7;
    const pool = lightPool(scene, 720, 600, 0xe87840, 90, fireA);
    life.add(pool);
    scene.tweens.add({
      targets: pool, alpha: { from: fireA, to: fireA * 0.55 },
      duration: 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}

function paintRain(scene, life) {
  const g = scene.add.graphics();
  g.lineStyle(1, 0x9ab0c0, 0.45);
  for (let i = 0; i < 70; i++) {
    const x = (i * 47) % 1320 - 20, y = (i * 31) % 760;
    g.lineBetween(x, y, x + 8, y + 22);
  }
  life.add(g);
  scene.tweens.add({ targets: g, y: 28, duration: 380, repeat: -1, onRepeat: () => { g.y = 0; } });
}

function paintSnow(scene, life) {
  const flakes = [];
  for (let i = 0; i < 36; i++) {
    const c = scene.add.circle((i * 83) % 1280, (i * 47) % 760, i % 3 === 0 ? 2.2 : 1.4, 0xf4eee0, 0.7);
    flakes.push(c);
    life.add(c);
    scene.tweens.add({
      targets: c, y: c.y + 90, x: c.x + ((i % 2) ? 18 : -14),
      duration: 2400 + (i % 7) * 200, repeat: -1, yoyo: false,
      onRepeat: () => { c.y = -10; },
    });
  }
}

function smokeStacks(scene, life, id) {
  const stacks = {
    cottage: [[718, 188]], brick: [[800, 160]], mansion: [[409, 200], [829, 200]],
    castle: [[274, 80], [926, 70]], camp: [[720, 560]],
  }[id] || [];
  stacks.forEach(([x, y], si) => {
    for (let i = 0; i < 3; i++) {
      const puff = scene.add.circle(x, y, 7 + i * 2, 0xc8c4b8, 0.22);
      life.add(puff);
      scene.tweens.add({
        targets: puff, y: y - 70 - i * 8, x: x + (si ? -10 : 12) + i * 4, alpha: 0, scale: 1.8,
        duration: 1800 + i * 220, delay: i * 280, repeat: -1,
        onRepeat: () => { puff.y = y; puff.x = x; puff.alpha = 0.22; puff.scale = 1; },
      });
    }
  });
}

function flickerLamps(scene, life, id, phase) {
  if (phase === 'day') return;
  const lamps = {
    camp: [[720, 582, 16]], cottage: [[638, 450, 7]], brick: [[325, 490, 9], [915, 490, 9]],
    inn: [[640, 200, 18]], castle: [[620, 470, 14]],
  }[id] || [];
  lamps.forEach(([x, y, r]) => {
    const glow = scene.add.circle(x, y, r, 0xd4a94e, phase === 'night' ? 0.55 : 0.35);
    life.add(glow);
    scene.tweens.add({
      targets: glow, alpha: { from: glow.alpha, to: glow.alpha * 0.45 },
      duration: 180 + Math.random() * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  });
}

function paintCrowd(scene, life, clock) {
  const g = scene.add.graphics();
  const n = 4 + (clock % 3);
  for (let i = 0; i < n; i++) {
    const x = 180 + ((i * 197 + clock * 13) % 900);
    const y = 548 + (i % 3) * 6;
    const h = 22 + (i % 4) * 3;
    g.fillStyle(0x12110e, 0.55);
    g.fillEllipse(x, y - h, 7, 6);
    g.fillRect(x - 6, y - h + 4, 12, h);
  }
  life.add(g);
}

ADV.HousingArt = HousingArt;
})();
