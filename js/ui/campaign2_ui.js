// Second-campaign UI (add-on §1-§7): the recruiter offers, up to three halls
// at once, the faction-war board copy and the god-line cutscenes.
//
// This file adds; it does not replace. Beat playback, the dialogue box and the
// notice modals are CampaignUI's — the only surgery is teaching CampaignUI.fill
// and CampaignUI.speaker to recognise a campaign2 character, so every existing
// playBeat path works for the new cast unchanged.
(function () {
'use strict';
const T = () => ADV.T;
const D = () => ADV.DATA;
const Panels = ADV.Panels = ADV.Panels || {};
const keepBtn = (scene, b) => ADV.UI.keepBtn(scene, b);
const C2 = () => ADV.Campaign2;

const UI2 = ADV.Campaign2UI = {};

// ---------------------------------------------------------------- shared plumbing
// Extend, don't fork: campaign2 characters route through campaign2's tables and
// everyone else falls through to the original.
(function patchCampaignUI() {
  const CU = ADV.CampaignUI;
  const fill = CU.fill, speaker = CU.speaker;

  CU.fill = function (game, text, who) {
    const ch = D().CAMPAIGN_CHARS[who];
    if (!ch || !C2().isC2(ch.faction)) return fill(game, text, who);
    const p = ADV.Game.player(game);
    const f = C2().faction(ch.faction);
    const rival = D().CAMPAIGN_CHARS[f.rival];
    const self = who === f.rival;
    const first = rival ? rival.name.split(' ')[0] : 'that one';
    const they = self ? 'that one' : first;
    const their = self ? 'their' : first + "'s";
    return String(text).replace(/\{target\}/g, p.name)
      .replace(/\{they\}/g, they).replace(/\{them\}/g, they).replace(/\{their\}/g, their)
      .replace(/\[[a-z ]+\]\s*/gi, '')
      .replace(/\s+([,.!?])/g, '$1').replace(/^\s+/, '');
  };

  CU.speaker = function (game, who) {
    const ch = D().CAMPAIGN_CHARS[who];
    if (!ch || !C2().isC2(ch.faction)) {
      if (ch && (ch.faction === 'god' || ch.godLine || ch.role === 'god')) return C2().actor(game, who);
      return speaker(game, who);
    }
    return C2().actor(game, who);
  };
})();

UI2.playBeats = (scene, game, beats, done) => ADV.CampaignUI.playBeats(scene, game, beats, done);

// ---------------------------------------------------------------- the offer (§1, §1a)
// The alignment lock is the whole decision, so the modal says out loud what
// joining costs — including that a criminal choice does not come back.
UI2.offer = function (scene, game, fid, done) {
  const f = C2().faction(fid);
  const rec = f.recruiter;
  ADV.CampaignUI.playBeat(scene, game, { who: rec, key: 'offer' }, () => {
    ADV.Notices.custom(scene, (keep, Dp, close) => {
      const W = T().W;
      const lock = C2().alignmentOf(game);
      const held = C2().joined(game).length;
      let cost;
      if (f.alignment === 'neutral') cost = 'The Bell asks nothing of your standing. It closes no other door.';
      else if (f.alignment === 'criminal') cost = 'Take this and you are criminal for the rest of this life. No lawful faction will speak to you again, and only death clears it.';
      else if (!lock) cost = 'Take this and you are lawful for the rest of this life. The Red Tally will never approach you.';
      else cost = 'You are already lawful. This costs you nothing you had not already spent.';
      keep(T().text(scene, W / 2, 214, f.name, { size: 22, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
      keep(T().text(scene, W / 2, 248, f.blurb, { size: 13, ox: 0.5, wrap: 560, align: 'center', italic: true, color: T().css.inkDim }).setDepth(Dp));
      keep(T().text(scene, W / 2, 292, cost, { size: 13, ox: 0.5, wrap: 560, align: 'center',
        color: f.alignment === 'criminal' ? T().css.blood : T().css.ink }).setDepth(Dp));
      keep(T().text(scene, W / 2, 348, `Five contracts, a rival, a boss. You hold ${held} of ${C2().MAX_PER_LIFE} allegiances.`,
        { size: 12, ox: 0.5, wrap: 560, align: 'center', color: T().css.inkDim }).setDepth(Dp));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, 396, 190, 40, 'Join ' + f.short, () => {
        close();
        C2().accept(game, fid);
        UI2.playBeats(scene, game, ADV.Campaign.takeBeats(game), () => {
          if (scene.buildMenu) { scene.refreshAll(); scene.scene.restart(); }
          if (done) done();
        });
      }, { size: 14, bold: true, color: T().css.gold }));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 + 10, 396, 190, 40, 'Not for me', () => {
        close();
        C2().decline(game, fid);
        ADV.CampaignUI.playBeat(scene, game, { who: rec, key: 'decline' }, done);
      }, { size: 14 }));
    });
  });
};

// Called by the Town scene alongside CampaignUI.arrival.
UI2.arrival = function (scene, game, done) {
  const steps = [];
  for (const fid of C2().joined(game)) {
    const m = C2().member(game, fid);
    if (m && m.endCardDue) { m.endCardDue = false; steps.push(n => UI2.endCard(scene, game, fid, n)); }
  }
  const offer = C2().currentOffer(game);
  if (offer) steps.push(n => UI2.offer(scene, game, offer, n));
  const run = () => { const st = steps.shift(); if (!st) { ADV.Save.saveGame(game); if (done) done(); return; } st(run); };
  run();
};

// ---------------------------------------------------------------- the halls (§1b)
// Up to three at once, so the panel is a hall list first and a hall second.
Panels.campaign2 = function (scene, r) {
  const game = scene.g();
  const joined = C2().joined(game);
  const offer = C2().currentOffer(game);
  const pick = scene.c2Hall && joined.includes(scene.c2Hall) ? scene.c2Hall : joined[0];

  if (!joined.length) {
    ADV.UI.header(scene, r, 'Allegiances',
      'Four houses work these waters. Some of them will not be in a room with the others.');
    let y = r.y + 100;
    if (offer) {
      keepBtn(scene, T().button(scene, r.x + 24, y, 340, 44, 'Hear ' + C2().faction(offer).name + ' out',
        () => UI2.offer(scene, game, offer, () => scene.openPanel('campaign2')), { size: 14, display: true }));
      y += 60;
    }
    y = UI2.standingList(scene, r, y);
    UI2.debugRow(scene, r);
    return;
  }

  const v = C2().hallView(game, pick);
  const f = v.faction;
  ADV.UI.header(scene, r, f.name, f.blurb, { reserveRight: 140 });

  // hall tabs when more than one allegiance is held
  let y = r.y + 84;
  if (joined.length > 1) {
    let x = r.x + 24;
    for (const fid of joined) {
      const on = fid === pick;
      keepBtn(scene, T().button(scene, x, y, 150, 32, C2().faction(fid).short, () => {
        scene.c2Hall = fid; scene.openPanel('campaign2');
      }, { size: 12, color: on ? T().css.gold : T().css.inkDim, disabled: on }));
      x += 158;
    }
    y += 44;
  }

  const bossId = C2().bossId(game, pick);
  const bossCh = ADV.CampaignUI.speaker(game, bossId);
  const key = ADV.Portraits.key(scene, bossCh);
  const bimg = scene.keep(scene.add.image(r.x + r.w - 92, r.y + 132, key).setDisplaySize(110, 140));
  if (ADV.Portraits.animate) ADV.Portraits.animate(scene, bimg, bossCh, key);
  if (ADV.Portraits.stand) ADV.Portraits.stand(scene, bimg, game, bossCh, key, 'town');
  const fg = scene.keep(scene.add.graphics()); fg.lineStyle(2, T().c.gold, 0.7); fg.strokeRect(r.x + r.w - 147, r.y + 62, 110, 140);
  scene.keep(T().text(scene, r.x + r.w - 92, r.y + 210, v.boss.name, { size: 12, ox: 0.5, color: T().css.gold }));
  scene.keep(T().text(scene, r.x + r.w - 92, r.y + 226, v.boss.epithet || 'runs the hall', { size: 11, ox: 0.5, italic: true, color: T().css.inkDim }));

  scene.keep(T().text(scene, r.x + 24, y, `Standing: ${v.title || '—'}${v.nextTitle ? `  →  ${v.nextTitle} (${v.nextTitleAt})` : '  · the top of the ladder'}`,
    { size: 14, color: T().css.purple })); y += 22;
  const rate = v.titleTier >= 2 ? '3×' : '2×';
  scene.keep(T().text(scene, r.x + 24, y, `${rate} levelling on ${f.archetypes.join('/')} skills · ${f.alignment === 'neutral' ? 'neutral — closes nothing' : f.alignment === 'criminal' ? 'criminal — lawful houses are shut to you' : 'lawful — the Red Tally is shut to you'}`,
    { size: 12, color: T().css.inkDim, wrap: r.w - 220 })); y += 22;
  if (v.alsoIn.length) {
    scene.keep(T().text(scene, r.x + 24, y, `Also sworn to: ${v.alsoIn.join(', ')}`, { size: 12, italic: true, color: T().css.inkFaint })); y += 22;
  }
  y += 8;

  for (const q of v.quests) {
    const status = q.status;
    const sub = status === 'done' ? 'done' : status === 'locked' ? 'locked' : `Tier ${q.tier} · ${(q.enc || []).length} encounters · ${q.brief}`;
    keepBtn(scene, T().button(scene, r.x + 24, y, r.w - 220, 44, `${q.n}. ${q.name}`, () => {
      if (status !== 'open') return;
      ADV.Panels.departure(scene, C2().buildQuest(game, pick, q.n));
    }, { size: 14, disabled: status !== 'open', display: status === 'open',
         sub: ADV.CampaignUI.fill(game, sub, f.rival), subColor: status === 'done' ? T().css.green : T().css.inkDim }));
    y += 52;
  }
  y += 6;

  const m = C2().member(game, pick);
  if (v.rivalAvailable) {
    keepBtn(scene, T().button(scene, r.x + 24, y, 440, 40, `${v.rival.name}: ${v.rivalToggle ? 'coming along' : 'staying behind'}`, () => {
      m.rivalToggle = !m.rivalToggle; ADV.Save.saveGame(game); scene.openPanel('campaign2');
    }, { size: 13, color: v.rivalToggle ? T().css.gold : T().css.ink,
         sub: 'no wage · cannot die in your fights · walks off when beaten', subColor: T().css.inkFaint }));
    y += 46;
  } else if (!m.rivalAlive) {
    scene.keep(T().text(scene, r.x + 24, y, `${v.rival.name} is gone. The hall does not say the name.`, { size: 12, italic: true, color: T().css.inkFaint })); y += 22;
  }
  if (v.speechUnlocked) {
    keepBtn(scene, T().button(scene, r.x + 24, y, 440, 36,
      `Ask ${D().CAMPAIGN_CHARS[f.recruiter].name.split(' ')[0]} why they do this`,
      () => ADV.CampaignUI.playBeat(scene, game, { who: f.recruiter, key: 'why' }), { size: 13 }));
    y += 46;
  }
  if (v.completed) {
    scene.keep(T().text(scene, r.x + 24, y, `Complete. ${D().GEAR_SETS[f.gearSet].name} issued — it advances ${D().GEAR_SETS[f.gearSet].archetypes.join('/')} skills one tier.`,
      { size: 12, color: T().css.green, wrap: r.w - 220 })); y += 24;
    scene.keep(T().text(scene, r.x + 24, y, 'All sixty-four from these four houses are on the trainer\'s board now — including the houses that will not have you. The Maw, the Antler, and Varenholm are a separate seventy-two.',
      { size: 12, color: T().css.gold, wrap: r.w - 220 })); y += 26;
    if (v.canReissue) {
      keepBtn(scene, T().button(scene, r.x + 24, y, 300, 34, 'Quartermaster: re-issue the set',
        () => { C2().reissue(game, pick); scene.refreshAll(); scene.openPanel('campaign2'); }, { size: 12 }));
      y += 42;
    }
    keepBtn(scene, T().button(scene, r.x + 24, y, 300, 32, 'The end card, again', () => UI2.endCard(scene, game, pick), { size: 12, color: T().css.inkDim }));
    y += 40;
  }
  if (offer) {
    keepBtn(scene, T().button(scene, r.x + 24, y, 340, 40, C2().faction(offer).name + ' is waiting on an answer',
      () => UI2.offer(scene, game, offer, () => scene.openPanel('campaign2')), { size: 13, display: true, color: T().css.gold }));
    y += 46;
  }
  y = UI2.standingList(scene, r, y);
  UI2.debugRow(scene, r);
};

// Why the doors that are shut are shut — the lock is invisible otherwise.
UI2.standingList = function (scene, r, y) {
  const game = scene.g();
  const s = C2().state(game);
  const lock = C2().alignmentOf(game);
  if (lock) {
    scene.keep(T().text(scene, r.x + 24, y, lock === 'criminal'
      ? 'You are criminal. The Green-Eyed and the Admiralty will not receive you in this life.'
      : 'You are lawful. The Red Tally will not approach you in this life.',
      { size: 12, color: T().css.blood, wrap: r.w - 60 })); y += 24;
  }
  for (const fid of C2().FACTIONS) {
    const f = C2().faction(fid);
    let why = null;
    if (C2().member(game, fid)) continue;
    if (C2().consumed(game, fid)) why = 'your line has already run this one — it does not open twice';
    else if (s.declined[fid]) why = 'you turned them down; they will not ask twice this life';
    else if ((s.war[fid] || 0) >= C2().WAR_CLOSES_AT) why = 'you have taken too many contracts against them';
    else if (!C2().alignmentAllows(game, fid)) why = 'your standing forbids it';
    else if (C2().joined(game).length >= C2().MAX_PER_LIFE) why = 'you already hold three allegiances';
    if (!why) continue;
    scene.keep(T().text(scene, r.x + 24, y, `${f.name} — ${why}.`, { size: 12, italic: true, color: T().css.inkFaint }));
    y += 20;
  }
  return y;
};

UI2.debugRow = function (scene, r) {
  const game = scene.g();
  const y = r.y + r.h - 44;
  scene.keep(T().text(scene, r.x + 24, y + 8, 'debug skip:', { size: 11, color: T().css.inkFaint }));
  let x = r.x + 100;
  for (const fid of C2().FACTIONS) {
    for (let n = 1; n <= 5; n++) {
      keepBtn(scene, T().button(scene, x, y, 26, 24, String(n),
        () => { C2().debugJump(game, fid, n); scene.scene.restart(); }, { size: 10, color: T().css.inkFaint }));
      x += 28;
    }
    scene.keep(T().text(scene, x - 140, y + 26, fid, { size: 9, color: T().css.inkFaint }));
    x += 12;
  }
};

// ---------------------------------------------------------------- end card (§5)
UI2.endCard = function (scene, game, fid, done) {
  const f = C2().faction(fid);
  const bossId = C2().bossId(game, fid);
  ADV.CampaignUI.playBeat(scene, game, { who: bossId, key: 'ending' }, () => {
    ADV.Notices.custom(scene, (keep, Dp, close) => {
      const W = T().W;
      keep(T().text(scene, W / 2, 240, f.name, { size: 24, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
      keep(T().text(scene, W / 2, 282, f.blurb,
        { size: 14, ox: 0.5, wrap: 620, align: 'center', italic: true, color: T().css.ink }).setDepth(Dp));
      keep(T().text(scene, W / 2, 352, 'All sixty-four skills from these four houses are on the trainer\'s board, including the ones that will not have you. The three older houses keep their own seventy-two behind a separate hall. The gear and the title stay yours alone.',
        { size: 12, ox: 0.5, wrap: 560, align: 'center', color: T().css.inkDim }).setDepth(Dp));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 90, 400, 180, 40, 'Close', () => { close(); if (done) done(); }, { size: 14 }));
    });
  });
};

// ---------------------------------------------------------------- the god line (§7)
// Two bosses, two routes each, and the cutscene runs on both ends of the fight.
UI2.godOpener = function (scene, game, quest, done) {
  const who = quest.godBoss;
  const lines = (D().GOD_LINE_DIALOGUE || {})[who];
  if (!lines || !lines.length) { if (done) done(); return; }
  UI2.playBeats(scene, game, [{ who, key: 'open', lines }], done);
};
// The gods have no last words — that is the point of them. The close is the purse.
UI2.godClosing = function (scene, game, quest, done) {
  (function (next) { next(); })(() => {
    ADV.Notices.custom(scene, (keep, Dp, close) => {
      const W = T().W;
      const pay = ADV.Quests.godPayout(game);
      keep(T().text(scene, W / 2, 250, 'It does not die. It stops.', { size: 22, display: true, ox: 0.5, color: T().css.purple }).setDepth(Dp));
      keep(T().text(scene, W / 2, 296, `${pay}g, and the next one who asks will be paid half of that.`,
        { size: 14, ox: 0.5, wrap: 560, align: 'center', color: T().css.gold }).setDepth(Dp));
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 90, 356, 180, 40, 'Take it', () => { close(); if (done) done(); }, { size: 14 }));
    });
  });
};

// The board's copy for a war contract (§6) and for the god line (§7).
UI2.questNote = function (game, q) {
  if (q.warAgainst) {
    const f = C2().faction(q.warAgainst);
    const s = C2().state(game);
    const n = (s.war || {})[q.warAgainst] || 0;
    const left = C2().WAR_CLOSES_AT - n;
    const opens = C2().faction(f.opposed);
    const bits = [`Against ${f.name}.`];
    if (left > 0) bits.push(`${left} more like this and they stop asking after you.`);
    else bits.push('They have stopped asking after you.');
    const other = opens.short.charAt(0).toUpperCase() + opens.short.slice(1);
    bits.push(`${other} notices this sort of work.`);
    return bits.join(' ');
  }
  if (q.godLine) return q.brief || 'God-tier. A boss in every fight; the last room is the god.';
  return null;
};
})();
