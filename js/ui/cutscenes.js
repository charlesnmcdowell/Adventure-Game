// Party cutscenes: the ride home after a won contract, and the funeral when a
// party leader falls. Both are built from the same march-of-portraits grammar
// as the embark beat in scene_town.js (playEmbark) — portraits slide across the
// housing art with a caption bar, click to skip — so the three read as one
// language rather than three separate ideas.
//
// The embark beat is deliberately left where it is. This file adds; it does not
// refactor scene_town.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

const Cut = {};
const DEPTH = 420;

// One at a time. playEmbark guards itself with __embarking; without the same
// guard a funeral queued behind a won contract draws over the ride home.
function busy(scene) { return !!(scene.__cutscene || scene.__embarking); }

function shortName(c) { return (c && c.name ? c.name : 'Someone').split(' ')[0]; }

// Shared stage: dims the hub, lays a caption bar, returns the handles a scene
// needs to animate portraits and finish. Mirrors playEmbark's setup exactly.
function stage(scene, opts) {
  const W = T().W, H = T().H;
  const actors = [];
  const keep = (o) => { actors.push(o); return o; };

  if (ADV.Tutor && ADV.Tutor.clear) { try { ADV.Tutor.clear(scene); } catch (e) {} }
  scene.children.list.forEach(o => {
    if (o && o.depth >= 900) {
      try { if (o.disableInteractive) o.disableInteractive(); } catch (e) {}
      scene.tweens.add({ targets: o, alpha: 0, duration: 200 });
    }
  });
  scene.__cutscene = true;
  if (scene.hideChrome) scene.hideChrome();

  // A funeral wants the light pulled down; the ride home does not.
  if (opts && opts.gloom) {
    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0c12, opts.gloom).setDepth(DEPTH - 2));
  }
  keep(scene.add.rectangle(W / 2, H - 54, W, 108, 0x0c0a08, 0.58).setDepth(DEPTH));
  const cap = keep(T().text(scene, W / 2, H - 68, opts.caption || '', {
    size: 18, display: true, ox: 0.5, oy: 0.5,
    color: opts.captionColor || T().css.gold, wrap: W - 80, align: 'center',
  }).setDepth(DEPTH + 1));
  keep(T().text(scene, W / 2, H - 30, 'click to skip', {
    size: 12, ox: 0.5, italic: true, color: T().css.inkFaint,
  }).setDepth(DEPTH + 1).setAlpha(0.75));

  return { W, H, actors, keep, cap,
    say(text) { try { if (cap.active) cap.setText(text); } catch (e) {} } };
}

// Fade to black, tear down, hand back control.
function closeOut(scene, st, done) {
  const veil = st.keep(scene.add.rectangle(st.W / 2, st.H / 2, st.W, st.H, 0x0b0a08, 0).setDepth(DEPTH + 80));
  scene.tweens.add({
    targets: veil, alpha: 1, duration: 320,
    onComplete: () => {
      st.actors.forEach(o => { try { o.destroy(); } catch (e) {} });
      scene.__cutscene = false;
      if (scene.showChrome) scene.showChrome();
      if (done) done();
    },
  });
}

// A click-anywhere skip that can only fire once, armed after a short grace so a
// stray click from the previous screen cannot eat the whole scene.
function armSkip(scene, st, finish, graceMs) {
  scene.time.delayedCall(graceMs == null ? 450 : graceMs, () => {
    if (st.done) return;
    st.keep(scene.add.rectangle(st.W / 2, st.H / 2, st.W, st.H, 0x000000, 0.001)
      .setDepth(DEPTH + 70).setInteractive()).on('pointerdown', finish);
  });
}

// One portrait card. Returns the container so the caller can tween it.
function card(scene, st, c, x0, y0, opts) {
  opts = opts || {};
  const bw = opts.lead ? 100 : 82;
  const bh = opts.lead ? 128 : 104;
  const cont = st.keep(scene.add.container(x0, y0).setDepth(DEPTH + 2 + (opts.z || 0)).setAlpha(opts.alpha == null ? 0 : opts.alpha));
  const img = scene.add.image(0, 0, ADV.Portraits.key(scene, c)).setDisplaySize(bw, bh);
  if (opts.tint != null) { try { img.setTint(opts.tint); } catch (e) {} }
  const rim = scene.add.rectangle(0, 0, bw + 4, bh + 4, 0x000000, 0)
    .setStrokeStyle(2, opts.lead ? T().c.gold : T().c.panelEdge, 0.95);
  const nm = T().text(scene, 0, bh / 2 + 10, shortName(c), {
    size: 12, ox: 0.5, display: true, color: opts.lead ? T().css.gold : T().css.ink,
  });
  cont.add([rim, img, nm]);
  cont.__img = img;
  // faces in a cutscene carry the moment: grief at a funeral, the standing mood
  // (relief reads as content) on the ride home. Overlays follow the container.
  if (ADV.Portraits.express) {
    const game = scene.game_ || (scene.g && scene.g());
    const ckey = img.texture && img.texture.key;
    if (opts.mood) ADV.Portraits.express(scene, img, c, ckey, opts.mood, opts.moodK == null ? 1 : opts.moodK);
    else if (game && ADV.Portraits.stand) { const m = ADV.Portraits.moodFor(game, c, 'cutscene'); ADV.Portraits.express(scene, img, c, ckey, m.mood === 'neutral' ? 'content' : m.mood, m.mood === 'neutral' ? 0.5 : m.intensity); }
  }
  return cont;
}

// A grave: mound, headstone and the one warm light. Drawn here rather than in
// two places — scene_death.js stages the same tableau at a different scale.
// (x, y) is the ground line the mound sits on.
Cut.grave = function (scene, o) {
  o = o || {};
  const x = o.x == null ? T().W / 2 : o.x;
  const y = o.y == null ? 566 : o.y;
  const s = o.scale || 1;
  const g = scene.add.graphics().setDepth(o.depth == null ? DEPTH - 1 : o.depth);
  g.fillStyle(0x241f19, 1); g.fillEllipse(x, y, 210 * s, 46 * s);
  g.fillStyle(0x2f2a22, 1); g.fillEllipse(x, y - 6 * s, 190 * s, 36 * s);
  g.fillStyle(0x4a4a52, 1); g.fillRoundedRect(x - 26 * s, y - 96 * s, 52 * s, 78 * s, 6);
  g.fillStyle(0x5a5a64, 1); g.fillRoundedRect(x - 22 * s, y - 92 * s, 44 * s, 40 * s, 5);
  g.fillStyle(0x1a1814, 1);
  g.fillRect(x - 3 * s, y - 80 * s, 6 * s, 22 * s);
  g.fillRect(x - 12 * s, y - 72 * s, 24 * s, 6 * s);
  g.fillStyle(0xd4a94e, 0.15); g.fillCircle(x + 100 * s, y - 26 * s, 48 * s);
  g.fillStyle(0xd4a94e, 0.85); g.fillCircle(x + 100 * s, y - 26 * s, 7 * s);
  return g;
};

function livingRoster(game) {
  let roster = [];
  try { roster = ADV.Game.partyRoster(game).filter(c => c && c.alive !== false); } catch (e) { roster = []; }
  if (!roster.length) { const p = ADV.Game.player(game); if (p) roster = [p]; }
  const cap = (ADV.Party && ADV.Party.companyCap) ? ADV.Party.companyCap() : 8;
  return roster.slice(0, cap);
}

// ============================================================ THE RIDE HOME
// Plays on arrival in town after a won contract. Silent by design: the embark
// beat says nothing either, and the pair of them bracket the quest.
Cut.rideHome = function (scene, done) {
  const game = scene.g ? scene.g() : scene.game_;
  if (!game) { if (done) done(); return; }
  const p = ADV.Game.player(game);
  const roster = livingRoster(game);
  const party = roster.length > 1;
  if (busy(scene)) { if (done) done(); return; }
  const home = (ADV.Housing && ADV.Housing.of) ? ADV.Housing.of(p) : null;
  const where = home && home.title ? home.title.toLowerCase().replace(/^the /, 'the ') : 'home';

  const st = stage(scene, {
    caption: party ? 'The road back is quieter than the road out.'
                   : `${p.name} walks the last mile alone.`,
  });
  const n = roster.length;
  const mid = (n - 1) / 2;

  // Mirror of embark: there they walked out of frame to the right, so coming
  // home they enter from the right and settle at the door.
  roster.forEach((c, i) => {
    const isLead = c.id === p.id;
    // Far off they read as a clump on the road; at the door they spread out.
    const x0 = 1040 + (i - mid) * 54;
    const y0 = 538 + (i % 2) * 12;
    const cont = card(scene, st, c, x0, y0, { lead: isLead, z: isLead ? n : i });
    scene.tweens.add({ targets: cont, alpha: 1, duration: 300, delay: 120 + i * 80 });
    scene.tweens.add({
      targets: cont,
      x: 470 + (i - mid) * 122,
      y: 548 + (i % 2) * 14,
      duration: 1900, delay: 360 + i * 70, ease: 'Cubic.easeInOut',
    });
  });

  scene.time.delayedCall(1380, () => st.say(party
    ? `They come back to ${where}.`
    : `${shortName(p)} comes back to ${where}.`));

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true; st.done = true;
    closeOut(scene, st, done);
  };
  armSkip(scene, st, finish, 450);
  scene.time.delayedCall(2480, finish);
};

// ============================================================== THE FUNERAL
// The company buries its leader and then stops being a company. Each survivor
// speaks once, in their own personality's voice, from the band their standing
// with the dead leader earns — warm, indifferent, or unforgiving. Then they
// walk off in different directions, which is the party dissolving on screen.
Cut.funeral = function (scene, rec, done) {
  const game = scene.g ? scene.g() : scene.game_;
  if (!game || !rec) { if (done) done(); return; }
  if (busy(scene)) { if (done) done(); return; }
  const world = game.world;
  const player = ADV.Game.player(game);
  const leaderName = rec.leaderName || 'The lead';
  const wordsById = {};
  for (const w of rec.words || []) wordsById[w.id] = w;

  const mourners = (rec.memberIds || [])
    .map(id => ADV.World.byId(world, id))
    .filter(c => c && c.alive);
  if (player && player.alive && !mourners.some(c => c.id === player.id)) mourners.unshift(player);

  const st = stage(scene, {
    caption: mourners.length > 1
      ? `They walk ${leaderName} to the ground.`
      : `${shortName(player)} walks ${leaderName} to the ground.`,
    captionColor: T().css.inkDim,
    gloom: 0.45,
  });
  const W = st.W;

  st.keep(Cut.grave(scene, { x: W / 2, y: 566, scale: 1 }));

  // Same march grammar as embark: they enter from the left and settle at the stone.
  const n = Math.max(1, mourners.length);
  const mid = (n - 1) / 2;
  const dest = mourners.map((_, i) => ({
    x: W / 2 + (i - mid) * 118,
    y: 392 + Math.abs(i - mid) * 9,
  }));
  const conts = mourners.map((c, i) => {
    const x0 = 220 + (i - mid) * 54;
    const y0 = 548 + (i % 2) * 14;
    const cont = card(scene, st, c, x0, y0, { z: i, tint: 0x9aa0aa, lead: c.isPlayer, mood: 'grief', moodK: c.isPlayer ? 1 : 0.8 });
    scene.tweens.add({ targets: cont, alpha: 1, duration: 280, delay: 140 + i * 90 });
    scene.tweens.add({
      targets: cont,
      x: dest[i].x,
      y: dest[i].y,
      duration: 1750, delay: 400 + i * 80, ease: 'Cubic.easeInOut',
    });
    return cont;
  });

  const finishAll = () => {
    if (st.done) return;
    st.done = true;
    st.say('The company does not re-form.');
    // Each mourner leaves by a different road: the party breaking up, shown.
    conts.forEach((cont, i) => {
      const dir = (i - mid) === 0 ? (i % 2 ? 1 : -1) : Math.sign(i - mid) || (i % 2 ? 1 : -1);
      scene.tweens.add({
        targets: cont,
        x: cont.x + dir * (320 + Math.abs(i - mid) * 80),
        alpha: 0,
        duration: 1500, delay: 260 + i * 170, ease: 'Cubic.easeIn',
      });
    });
    scene.time.delayedCall(2100, () => closeOut(scene, st, done));
  };

  // Speeches use the band earned with the dead lead, not the player.
  // DialogueBox.show hands back a {close} handle so a skip can shut an open box.
  const speakers = mourners
    .map((c, i) => ({ c, i, word: wordsById[c.id] }))
    .filter(x => x.word && !x.c.isPlayer);
  let idx = 0, openBox = null;
  const speakNext = () => {
    if (st.done) return;
    const turn = speakers[idx++];
    if (!turn) { finishAll(); return; }
    const { c, i, word } = turn;
    const cont = conts[i];
    if (cont) {
      try { cont.__img.clearTint(); } catch (e) {}
      scene.tweens.add({ targets: cont, y: cont.y - 10, duration: 260, yoyo: true });
    }
    st.say(`${c.name} says a word over ${leaderName}.`);
    const ctx = ADV.DialogueBox.ctxFor(game, c, {
      target: leaderName,
      them: leaderName,
      score: word.score,
    });
    openBox = ADV.DialogueBox.show(scene, game, c, word.band || 'general', ctx, () => {
      openBox = null;
      if (cont) { try { cont.__img.setTint(0x9aa0aa); } catch (e) {} }
      speakNext();
    });
    if (!openBox) speakNext();
  };

  armSkip(scene, st, () => {
    if (openBox && openBox.close) { try { openBox.close(); } catch (e) {} openBox = null; }
    finishAll();
  }, 700);
  scene.time.delayedCall(2280, () => {
    st.say(`They put ${leaderName} in the ground.`);
    speakNext();
  });
};

ADV.Cutscenes = Cut;
})();
