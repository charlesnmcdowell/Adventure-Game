// Campaign UI (campaign doc §4, §5c, §8, §10-§11a): recruiter offers, the
// faction hall, cutscene beats through the dialogue box, the Antler branch
// choice, the villain reveal, the support ask and the end card.
(function () {
'use strict';
const T = () => ADV.T;
const D = () => ADV.DATA;
const Panels = ADV.Panels = ADV.Panels || {};
const keepBtn = (scene, b) => ADV.UI.keepBtn(scene, b);

const CampaignUI = {};

// ---------------------------------------------------------------- lines
// Tokens are filled on screen; the spoken clip is the name-free `v` form
// (the name plate and the text box carry the names).
CampaignUI.fill = function (game, text, who) {
  const p = ADV.Game.player(game);
  const f = ADV.Campaign.faction(game) || D().FACTIONS[D().CAMPAIGN_CHARS[who].faction];
  const rival = D().CAMPAIGN_CHARS[f.rival];
  // third-person tokens name the rival on screen — unless the rival is the one
  // speaking (banter about an enemy), where a plain pronoun reads right
  const self = who === f.rival;
  const first = rival.name.split(' ')[0];
  const they = self ? 'that one' : first;
  const their = self ? 'their' : first + "'s";
  return text.replace(/\{target\}/g, p.name).replace(/\{they\}/g, they).replace(/\{them\}/g, they).replace(/\{their\}/g, their)
    .replace(/\[[a-z ]+\]\s*/gi, '')                       // delivery cues are for the voice
    .replace(/\s+([,.!?])/g, '$1').replace(/^\s+/, '');
};

CampaignUI.speaker = function (game, who) {
  const s = ADV.Campaign.state(game);
  if (s.actors[who]) return s.actors[who];
  return ADV.Campaign.makeActor(D().CAMPAIGN_CHARS[who]);   // recruiters never fight: a display-only actor
};

// Play one beat: every line of dialogue[faction][who][key], in order.
CampaignUI.playBeat = function (scene, game, beat, done) {
  const who = beat.who;
  const fid = D().CAMPAIGN_CHARS[who].faction;
  const lines = beat.lines || ADV.Campaign.lines(fid, who, beat.key);
  const speaker = CampaignUI.speaker(game, who);
  let i = 0;
  const next = () => {
    if (i >= lines.length) { if (done) done(); return; }
    const line = lines[i++];
    if (ADV.Music) ADV.Music.speakCampaign(who, beat.key, i);
    ADV.DialogueBox.showText(scene, game, speaker, CampaignUI.fill(game, line.t, who), next);
  };
  if (beat.death && !beat.offscreen) {
    // the rival's last line, then the screen goes red for a moment
    const speak = () => { const line = lines[0]; if (ADV.Music) ADV.Music.speakCampaign(who, 'death', 1); ADV.DialogueBox.showText(scene, game, speaker, CampaignUI.fill(game, line.t, who), () => { ADV.VFX.flashOverlay(scene, 0xa8352c, 0.8); scene.time.delayedCall(600, done); }); };
    speak(); return;
  }
  if (beat.death && beat.offscreen) {
    ADV.Notices.toast(scene, `${speaker.name} went ahead alone. ${speaker.name} did not come back.`);
    scene.time.delayedCall(1800, done); return;
  }
  next();
};
CampaignUI.playBeats = function (scene, game, beats, done) {
  const list = beats.slice();
  const next = () => { const b = list.shift(); if (!b) { if (done) done(); return; } CampaignUI.playBeat(scene, game, b, next); };
  next();
};

// ---------------------------------------------------------------- town arrival
// Called by the Town scene after the ordinary notices: recruiter offers,
// queued hall beats, the villain reveal, the support ask, the end card.
CampaignUI.arrival = function (scene, game, done) {
  const s = ADV.Campaign.state(game);
  const steps = [];
  if (s.villainReveal) { s.villainReveal = false; steps.push(n => CampaignUI.villainReveal(scene, game, n)); }
  const beats = ADV.Campaign.takeBeats(game);
  if (beats.length) steps.push(n => CampaignUI.playBeats(scene, game, beats, n));
  if (s.endCardDue) { s.endCardDue = false; steps.push(n => CampaignUI.endCard(scene, game, n)); }
  else if (s.supportAskDue && !game.meta.supportAskSeen) { s.supportAskDue = false; steps.push(n => CampaignUI.supportAsk(scene, game, false, n)); }
  const offer = ADV.Campaign.currentOffer(game);
  if (offer) steps.push(n => CampaignUI.offer(scene, game, offer, n));
  const run = () => { const st = steps.shift(); if (!st) { ADV.Save.saveGame(game); if (done) done(); return; } st(run); };
  run();
};

// The recruiter's approach (§3): lines, then Join / Decline.
CampaignUI.offer = function (scene, game, fid, done) {
  const f = D().FACTIONS[fid];
  const rec = f.recruiter;
  CampaignUI.playBeat(scene, game, { who: rec, key: 'offer' }, () => {
    ADV.Notices.custom(scene, (keep, Dp, close) => {
      const W = T().W;
      keep(T().text(scene, W / 2, 240, f.name, { size: 22, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
      keep(T().text(scene, W / 2, 274, f.blurb, { size: 13, ox: 0.5, wrap: 560, align: 'center', italic: true, color: T().css.inkDim }).setDepth(Dp));
      keep(T().text(scene, W / 2, 316, 'Five contracts, one faction per life. Joining locks the other two until you die.', { size: 13, ox: 0.5, wrap: 560, align: 'center', color: T().css.ink }).setDepth(Dp));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, 380, 190, 40, 'Join ' + f.short, () => {
        close();
        ADV.Campaign.accept(game, fid);
        scene.promptOnce && scene.promptOnce('firstCampaign');
        CampaignUI.playBeats(scene, game, ADV.Campaign.takeBeats(game), () => { if (scene.buildMenu) { scene.refreshAll(); scene.scene.restart(); } if (done) done(); });
      }, { size: 14, bold: true, color: T().css.gold }));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 + 10, 380, 190, 40, 'Not for me', () => {
        close();
        ADV.Campaign.decline(game, fid);
        CampaignUI.playBeat(scene, game, { who: rec, key: 'decline' }, done);
      }, { size: 14 }));
    });
  });
};

// ---------------------------------------------------------------- the hall
Panels.campaign = function (scene, r) {
  const game = scene.g();
  const s = ADV.Campaign.state(game);
  const offer = ADV.Campaign.currentOffer(game);
  if (!s.factionId) {
    ADV.UI.header(scene, r, 'Campaign', 'A faction noticed you. Five contracts, a rival, a boss, and a title that grows with the work.');
    let y = r.y + 100;
    if (offer) {
      keepBtn(scene, T().button(scene, r.x + 24, y, 320, 44, 'Hear ' + D().FACTIONS[offer].name + ' out', () => CampaignUI.offer(scene, game, offer, () => scene.openPanel('campaign')), { size: 14, display: true }));
      y += 60;
    }
    if (ADV.Campaign.antlerAvailable(game) && offer !== 'antler') {
      keepBtn(scene, T().button(scene, r.x + 24, y, 320, 44, "The Antler's standing offer", () => {
        ADV.Campaign.state(game).pendingOffer = 'antler';
        CampaignUI.offer(scene, game, 'antler', () => scene.openPanel('campaign'));
      }, { size: 14, sub: 'a company, not a cause — it takes anyone', subColor: T().css.inkDim }));
      y += 60;
    }
    for (const fid of ['maw', 'varenholm']) if (s.declined[fid]) { scene.keep(T().text(scene, r.x + 24, y, `You turned ${D().FACTIONS[fid].name} down. They will not ask twice this life.`, { size: 12, italic: true, color: T().css.inkFaint })); y += 20; }
    CampaignUI.debugRow(scene, r);
    return;
  }
  const v = ADV.Campaign.hallView(game);
  const f = v.faction;
  ADV.UI.header(scene, r, f.name, f.blurb, { reserveRight: 140 });
  // banner + boss portrait
  const bossCh = CampaignUI.speaker(game, ADV.Campaign.bossId(game));
  const key = ADV.Portraits.key(scene, bossCh);
  const bimg = scene.keep(scene.add.image(r.x + r.w - 92, r.y + 132, key).setDisplaySize(110, 140));
  if (ADV.Portraits.animate) ADV.Portraits.animate(scene, bimg, bossCh, key);
  const fg = scene.keep(scene.add.graphics()); fg.lineStyle(2, T().c.gold, 0.7); fg.strokeRect(r.x + r.w - 147, r.y + 62, 110, 140);
  scene.keep(T().text(scene, r.x + r.w - 92, r.y + 210, v.boss.name, { size: 12, ox: 0.5, color: T().css.gold }));
  scene.keep(T().text(scene, r.x + r.w - 92, r.y + 226, v.boss.epithet || 'runs the hall', { size: 11, ox: 0.5, italic: true, color: T().css.inkDim }));

  let y = r.y + 84;
  scene.keep(T().text(scene, r.x + 24, y, `Standing: ${v.title}${v.nextTitle ? `  →  ${v.nextTitle} (${v.nextTitleAt})` : '  · the top of the ladder'}`, { size: 14, color: T().css.purple })); y += 22;
  const rate = v.titleTier >= 2 ? '3×' : '2×';
  scene.keep(T().text(scene, r.x + 24, y, `${rate} levelling on ${f.archetypes.join('/')} skills${v.titleTier >= 3 ? ' · faction skills manifest one tier up' : ''} · ${v.factionContracts} contracts for the hall`, { size: 12, color: T().css.inkDim, wrap: r.w - 220 })); y += 30;

  for (const q of v.quests) {
    const status = q.status;
    const label = `${q.n}. ${q.name}`;
    const sub = status === 'done' ? 'done' : status === 'locked' ? 'locked' : `Tier ${q.tier} · ${q.enc.length} encounters · ${q.brief}`;
    const b = T().button(scene, r.x + 24, y, r.w - 220, 44, label, () => {
      if (status !== 'open') return;
      if (q.branch && !s.branch) { CampaignUI.branchChoice(scene, game, () => scene.openPanel('campaign')); return; }
      ADV.Panels.departure(scene, ADV.Campaign.buildQuest(game, q.n));
    }, { size: 14, disabled: status !== 'open', display: status === 'open', sub: CampaignUI.fill(game, sub, f.rival), subColor: status === 'done' ? T().css.green : T().css.inkDim });
    keepBtn(scene, b);
    y += 52;
  }
  y += 6;
  // rival toggle (§5a)
  if (v.rivalAvailable) {
    keepBtn(scene, T().button(scene, r.x + 24, y, 440, 40, `${v.rival.name}: ${v.rivalToggle ? 'coming along' : 'staying behind'}`, () => {
      s.rivalToggle = !s.rivalToggle; ADV.Save.saveGame(game); scene.openPanel('campaign');
    }, { size: 13, color: v.rivalToggle ? T().css.gold : T().css.ink, sub: 'no wage · cannot die in your fights · walks off when beaten', subColor: T().css.inkFaint }));
    y += 46;
  } else if (!s.rivalAlive) { scene.keep(T().text(scene, r.x + 24, y, `${v.rival.name} is gone. The hall does not say the name.`, { size: 12, italic: true, color: T().css.inkFaint })); y += 22; }
  // motivation speech (§10) — the boss's why, after two quests
  if (v.speechUnlocked) {
    keepBtn(scene, T().button(scene, r.x + 24, y, 440, 36, `Ask ${D().CAMPAIGN_CHARS[f.recruiter].name.split(' ')[0]} why the ${f.short.replace('the ', '')} does this`, () => CampaignUI.playBeat(scene, game, { who: f.recruiter, key: 'why' }), { size: 13 }));
    y += 46;
  }
  if (v.completed) {
    scene.keep(T().text(scene, r.x + 24, y, `Campaign complete. ${D().GEAR_SETS[f.gearSet].name} issued — it floors ${D().GEAR_SETS[f.gearSet].archetypes.join('/')} skills at 15.`, { size: 12, color: T().css.green, wrap: r.w - 220 })); y += 24;
    if (v.canReissue) { keepBtn(scene, T().button(scene, r.x + 24, y, 300, 34, 'Quartermaster: re-issue the set', () => { ADV.Campaign.reissue(game); scene.refreshAll(); scene.openPanel('campaign'); }, { size: 12 })); y += 42; }
    scene.keep(T().text(scene, r.x + 24, y, 'STANDING CONTRACTS', { size: 12, color: T().css.inkDim })); y += 20;
    for (const q of v.repeatables) {
      keepBtn(scene, T().button(scene, r.x + 24, y, r.w - 220, 40, q.name, () => ADV.Panels.departure(scene, q), { size: 13, sub: `Tier ${q.tier} · 3 encounters · pays ${q.payout}g`, subColor: T().css.inkDim }));
      y += 46;
    }
    keepBtn(scene, T().button(scene, r.x + 24, y, 300, 32, 'The end card, again', () => CampaignUI.endCard(scene, game), { size: 12, color: T().css.inkDim }));
    y += 40;
  }
  CampaignUI.debugRow(scene, r);
};

// Debug skip (§11a): jump to any quest of any campaign.
CampaignUI.debugRow = function (scene, r) {
  const game = scene.g();
  const y = r.y + r.h - 44;
  scene.keep(T().text(scene, r.x + 24, y + 8, 'debug skip:', { size: 11, color: T().css.inkFaint }));
  let x = r.x + 100;
  for (const fid of ['maw', 'antler', 'varenholm']) {
    for (let n = 1; n <= 5; n++) {
      keepBtn(scene, T().button(scene, x, y, 30, 24, String(n), () => { ADV.Campaign.debugJump(game, fid, n); scene.scene.restart(); }, { size: 10, color: T().css.inkFaint }));
      x += 32;
    }
    scene.keep(T().text(scene, x - 160, y + 26, fid, { size: 9, color: T().css.inkFaint }));
    x += 14;
  }
};

// ---------------------------------------------------------------- the Antler branch (§5c)
CampaignUI.branchChoice = function (scene, game, done) {
  CampaignUI.playBeat(scene, game, { who: 'crane', key: 'briefing' }, () => {
    ADV.Notices.custom(scene, (keep, Dp, close) => {
      const W = T().W;
      keep(T().text(scene, W / 2, 236, 'Pick a side', { size: 22, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
      keep(T().text(scene, W / 2, 270, 'Crane is going after the hero who killed Roscarrow. It was legal. She is going anyway.', { size: 13, ox: 0.5, wrap: 560, align: 'center', color: T().css.ink }).setDepth(Dp));
      keep(T().text(scene, W / 2, 300, 'One of them dies. Whoever runs the Antler afterward is decided here — and killing a hero is not a thing the world forgets.', { size: 12, ox: 0.5, wrap: 560, align: 'center', italic: true, color: T().css.inkDim }).setDepth(Dp));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 250, 360, 240, 40, 'Stand with Crane', () => {
        close(); ADV.Campaign.chooseSide(game, 'crane');
        CampaignUI.playBeat(scene, game, { who: 'crane', key: 'sided' }, done);
      }, { size: 14, bold: true, color: T().css.gold }));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 + 10, 360, 240, 40, 'Side with Hargrave', () => {
        close(); ADV.Campaign.chooseSide(game, 'holloway');
        CampaignUI.playBeat(scene, game, { who: 'holloway', key: 'sided' }, done);
      }, { size: 14, bold: true, color: T().css.blue }));
    });
  });
};

// The villain reveal (§0b): full-screen card, click to continue.
CampaignUI.villainReveal = function (scene, game, done) {
  const W = T().W, H = T().H;
  const objs = [];
  const k = o => { objs.push(o); return o; };
  k(scene.add.rectangle(W / 2, H / 2, W, H, 0x1a0808, 0.97).setDepth(960).setInteractive());
  const lines = D().CAMPAIGN_COPY.villainReveal;
  k(T().text(scene, W / 2, 150, lines[0], { size: 40, display: true, ox: 0.5, color: T().css.blood }).setDepth(961));
  let y = 230;
  for (const l of lines.slice(1)) { k(T().text(scene, W / 2, y, l, { size: 15, ox: 0.5, wrap: 760, align: 'center', color: T().css.ink }).setDepth(961)); y += 78; }
  const b = T().button(scene, W / 2 - 100, H - 90, 200, 40, 'Understood', () => { objs.forEach(o => { try { o.destroy(); } catch (e) {} }); if (done) done(); }, { size: 14, color: T().css.blood });
  b.g.setDepth(962); b.txt.setDepth(963); b.zone.setDepth(964); objs.push(b.g, b.txt, b.zone);
  ADV.VFX.camShake(scene, 0.01);
};

// Support ask (§10a): once after two contracts (short), once at the end card.
CampaignUI.supportAsk = function (scene, game, atEnd, done) {
  const copy = atEnd ? D().CAMPAIGN_COPY.endAsk : D().CAMPAIGN_COPY.supportShort;
  game.meta.supportAskSeen = true; ADV.Save.saveMeta(game);
  ADV.Notices.custom(scene, (keep, Dp, close) => {
    const W = T().W;
    keep(T().text(scene, W / 2, 238, copy.title, { size: 22, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
    keep(T().text(scene, W / 2, 272, copy.body, { size: 13, ox: 0.5, wrap: 580, align: 'center', color: T().css.ink }).setDepth(Dp));
    keep(T().text(scene, W / 2, 330, copy.foot, { size: 12, ox: 0.5, wrap: 580, align: 'center', italic: true, color: T().css.inkDim }).setDepth(Dp));
    ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, 400, 190, 40, 'Support the project', () => { try { window.open(copy.url, '_blank'); } catch (e) {} }, { size: 13, bold: true, color: T().css.gold }));
    ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 + 10, 400, 190, 40, atEnd ? 'Back to the hall' : 'Maybe later', () => { close(); if (done) done(); }, { size: 13 }));
  });
};

// End card (§10a): the ending is not the end of the game.
CampaignUI.endCard = function (scene, game, done) {
  const s = ADV.Campaign.state(game);
  const copy = D().CAMPAIGN_COPY.endAsk;
  const W = T().W, H = T().H;
  const objs = [];
  const k = o => { objs.push(o); return o; };
  k(scene.add.rectangle(W / 2, H / 2, W, H, 0x0c0a08, 0.97).setDepth(960).setInteractive());
  k(T().text(scene, W / 2, 86, copy.title, { size: 34, display: true, ox: 0.5, color: T().css.gold }).setDepth(961));
  k(T().text(scene, W / 2, 148, copy.unlock, { size: 14, ox: 0.5, wrap: 780, align: 'center', color: T().css.ink }).setDepth(961));
  k(T().text(scene, W / 2, 292, copy.body, { size: 14, ox: 0.5, wrap: 780, align: 'center', color: T().css.ink }).setDepth(961));
  k(T().text(scene, W / 2, 378, copy.foot, { size: 13, ox: 0.5, wrap: 780, align: 'center', italic: true, color: T().css.inkDim }).setDepth(961));
  k(T().text(scene, W / 2, 454, copy.more, { size: 13, ox: 0.5, wrap: 780, align: 'center', color: T().css.blue }).setDepth(961));
  k(T().text(scene, W / 2, 528, 'The world keeps going. Your title, your gear, and the hall are still there — and so is everyone you fought beside.', { size: 13, ox: 0.5, wrap: 780, align: 'center', italic: true, color: T().css.inkDim }).setDepth(961));
  const mk = (x, label, fn, color) => { const b = T().button(scene, x, H - 100, 220, 42, label, fn, { size: 14, bold: true, color }); b.g.setDepth(962); b.txt.setDepth(963); b.zone.setDepth(964); objs.push(b.g, b.txt, b.zone); };
  mk(W / 2 - 340, 'neverendingnarratives.com', () => { try { window.open(copy.url, '_blank'); } catch (e) {} }, T().css.gold);
  mk(W / 2 - 110, 'Support the next one', () => { try { window.open(copy.url, '_blank'); } catch (e) {} }, T().css.gold);
  mk(W / 2 + 120, 'Back to the hall', () => { objs.forEach(o => { try { o.destroy(); } catch (e) {} }); s.endCardSeen = true; game.meta.endCardSeen = true; ADV.Save.saveGame(game); if (done) done(); }, T().css.ink);
};

ADV.CampaignUI = CampaignUI;
})();
