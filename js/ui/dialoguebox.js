// JRPG dialogue box (§1a/§17a): portrait + name plate + one line, rendered
// wherever a character speaks. The only place characters exist as people.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;

const DialogueBox = {
  // Show a speech line. opts: {band, ctx, onDone}. Returns a closer.
  show(scene, game, speaker, band, ctx, onDone) {
    const r = ADV.util.speakEx(game.world, speaker, band, ctx || {});
    if (!r) { if (onDone) onDone(); return null; }
    // one personality, one voice — play this exact line's clip (§17a)
    if (ADV.Music && speaker.personalityId) {
      const world = game && game.world;
      ADV.Music.speakFile(speaker.personalityId, r.band, r.idx + 1,
        ADV.Character.voiceTagFor(world, speaker));
    }
    // the raw line still carries its delivery tags — the face reads them (expression pass)
    const raw = (() => { try { const p = ADV.DATA.DIALOGUE[speaker.personalityId]; const arr = p && (p[r.band] || p.general); return arr ? arr[r.idx] : null; } catch (e) { return null; } })();
    return DialogueBox.showText(scene, game, speaker, r.text, onDone, { raw });
  },

  // opts: { raw } — the untrimmed line with [delivery] tags, for reactions
  showText(scene, game, speaker, line, onDone, opts) {
    opts = opts || {};
    const W = T().W, H = T().H;
    const bh = 132, y = H - bh - 12;
    const group = [];
    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(900).setInteractive();
    const panel = scene.add.graphics().setDepth(901);
    panel.fillStyle(0x14110d, 0.96);
    panel.fillRoundedRect(20, y, W - 40, bh, 8);
    panel.lineStyle(2, T().c.gold, 0.85);
    panel.strokeRoundedRect(20, y, W - 40, bh, 8);
    group.push(dim, panel);
    // portrait
    const key = ADV.Portraits.key(scene, speaker);
    const img = scene.add.image(88, y + bh / 2, key).setDisplaySize(96, 122).setDepth(902);
    if (ADV.Portraits.animate) ADV.Portraits.animate(scene, img, speaker, key);
    if (ADV.Portraits.moodFor && game && speaker) {
      const P = ADV.Portraits;
      P.stand(scene, img, game, speaker, key, 'dialogue');
      // delivery tags → a reaction as the line opens; the speaker looks at the player
      const tags = P.tagsIn(opts.raw || line);
      tags.slice(0, 2).forEach((t, i) => scene.time.delayedCall(i * 500, () => P.react(scene, img, speaker, key, t.mood, { ms: 900, intensity: t.intensity })));
      if (/\[(nod|agrees?)\]/i.test(opts.raw || '')) P.motion(scene, img, 'nod');
      if (/\[(shakes head|refus)/i.test(opts.raw || '')) P.motion(scene, img, 'shake');
      if (/\[(curious|questioning)\]/i.test(opts.raw || '')) P.motion(scene, img, 'tilt');
      P.look(scene, img, speaker, key, 0.8, 0.2, 320, true);
      // lip flap on the voice clip (or a word-count fallback when the line is silent)
      const el = ADV.Music && ADV.Music.voiceEl;
      P.lipFlap(scene, img, speaker, key, el && !el.error ? el : null, { words: String(line || '').split(/\s+/).length });
      // skin states the standing mood does not carry
      const sv = ADV.Survival && !speaker.isMonster ? ADV.Survival.state(speaker) : null;
      P.skinState(scene, img, speaker, key, { sick: !!(sv && sv.sick), pale: sv && sv.hunger >= 3 ? 0.6 : 0 });
    }
    const frame = scene.add.graphics().setDepth(903);
    frame.lineStyle(2, T().c.panelEdge, 1);
    frame.strokeRect(40, y + bh / 2 - 61, 96, 122);
    group.push(img, frame);
    // name plate
    const nameBg = scene.add.graphics().setDepth(903);
    nameBg.fillStyle(0x2b261f, 1);
    nameBg.fillRoundedRect(150, y - 14, 200, 28, 4);
    nameBg.lineStyle(1.5, T().c.gold, 0.8);
    nameBg.strokeRoundedRect(150, y - 14, 200, 28, 4);
    const nameTxt = T().text(scene, 250, y, speaker.name + (speaker.title ? ' · ' + speaker.title : ''), { size: 14, ox: 0.5, oy: 0.5, display: true, color: T().css.gold }).setDepth(904);
    group.push(nameBg, nameTxt);
    // typewriter text
    const txt = T().text(scene, 160, y + 26, '', { size: 17, wrap: W - 220, display: true }).setDepth(904);
    group.push(txt);
    let i = 0, doneTyping = false;
    const timer = scene.time.addEvent({ delay: 14, repeat: line.length - 1, callback: () => {
      i++; txt.setText(line.slice(0, i));
      if (i >= line.length) doneTyping = true;
    } });
    const hint = T().text(scene, W - 44, y + bh - 20, '▼', { size: 13, ox: 0.5, oy: 0.5, color: T().css.inkDim }).setDepth(904);
    scene.tweens.add({ targets: hint, y: hint.y + 4, duration: 420, yoyo: true, repeat: -1 });
    group.push(hint);

    if (ADV.Tooltip) ADV.Tooltip.hide();
    if (ADV.Tutor) ADV.Tutor.clear(scene);
    if (ADV.Notices && ADV.Notices.block) ADV.Notices.block(scene);
    if (!scene.__cutscene && scene.hideChrome) scene.hideChrome();
    const close = () => {
      timer.remove(false);
      if (ADV.Music) ADV.Music.stopVoice();
      for (const g of group) { try { g.destroy(); } catch (e) {} }
      if (ADV.UI && ADV.UI.releaseCard) ADV.UI.releaseCard('dialogue');
      if (!scene.__cutscene && scene.showChrome) scene.showChrome();
      if (ADV.Notices && ADV.Notices.unblock) ADV.Notices.unblock(scene);
      if (onDone) onDone();
    };
    if (ADV.UI && ADV.UI.holdCard) ADV.UI.holdCard('dialogue', close);
    dim.on('pointerdown', () => {
      if (!doneTyping) { timer.remove(false); txt.setText(line); doneTyping = true; }
      else close();
    });
    return { close };
  },

  // Build the token context for a speaker addressing the player (§17a)
  ctxFor(game, speaker, extra) {
    const world = game.world;
    const p = ADV.Game.player(game);
    const partner = speaker.partnerId ? world.characters.find(c => c.id === speaker.partnerId) : null;
    return Object.assign({
      target: p.name,
      partner: partner ? partner.name : null,
      them: extra && extra.themName ? extra.themName : (partner ? partner.name : null),
      score: ADV.Rel.score(world, speaker.id, p.id),
      rand: Math.random(),
    }, extra || {});
  },

  bandFor(game, speaker) {
    const world = game.world;
    const tier = ADV.Rel.tierBetween(world, speaker.id, world.playerId);
    return tier === 'romantic' ? 'romantic' : tier === 'hatred' ? 'hatred' :
           tier === 'friendly' ? 'friendly' : 'general';
  },
};

ADV.DialogueBox = DialogueBox;
})();
