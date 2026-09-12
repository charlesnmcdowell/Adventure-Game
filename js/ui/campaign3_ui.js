// Varenholm's Gate story campaign UI (VARENHOLMS_GATE_CAMPAIGN.md §0, §2, §5):
// the Story hall, the pick-a-line choice modal for the silent protagonist, the
// company picker, the epilogue card.
//
// This file adds; it does not replace. CampaignUI.playBeat is taught to route
// campaign3 beats through C3.playBeat (which never dedupes lines the way
// pickSpoken does, because a story replays after death) and to recognise the
// campaign3 cast in fill / speaker. Every other path is untouched.
(function () {
'use strict';
const T = () => ADV.T;
const D = () => ADV.DATA;
const Panels = ADV.Panels = ADV.Panels || {};
const keepBtn = (scene, b) => ADV.UI.keepBtn(scene, b);
const C3 = () => ADV.Campaign3;

const UI3 = ADV.Campaign3UI = {};

// ---------------------------------------------------------------- shared plumbing
(function patchCampaignUI() {
  const CU = ADV.CampaignUI;
  const fill = CU.fill, speaker = CU.speaker, playBeat = CU.playBeat;

  CU.fill = function (game, text, who, context) {
    const ch = D().CAMPAIGN_CHARS[who];
    if (!ch || !ch.campaign3) return fill(game, text, who, context);
    const p = ADV.Game.player(game);
    const ctx = context || { target: (p && p.name) || 'you' };
    return String(text || '').replace(/\{target\}/g, ctx.target || (p && p.name) || 'you')
      .replace(/\{they\}/g, ctx.them || 'they').replace(/\{them\}/g, ctx.them || 'them').replace(/\{their\}/g, ctx.them ? ctx.them + "'s" : 'their')
      .replace(/\[[^\]]+\]\s*/g, '')
      .replace(/\s+([,.!?])/g, '$1').replace(/^\s+/, '');
  };
  CU.speaker = function (game, who) {
    const ch = D().CAMPAIGN_CHARS[who];
    if (!ch || !ch.campaign3) return speaker(game, who);
    return C3().actor(game, who);
  };
  CU.playBeat = function (scene, game, beat, done) {
    if (beat && beat.c3) return UI3.playBeat(scene, game, beat, done);
    return playBeat(scene, game, beat, done);
  };
  D().STORY_DEATH_CAPTIONS = D().STORY_DEATH_CAPTIONS || {};
  D().STORY_DEATH_CAPTIONS.gate = 'The sword goes through him. You run because he told you to.';
})();

// A clip plays only once it exists in the manifest; until then the story is silent.
function speak(who, key, idx) {
  const path = 'audio/vo/campaign/' + who + '/' + key + '_' + idx + '.mp3';
  if (ADV.Music && D().VOICE_HASHES && D().VOICE_HASHES[path]) ADV.Music.speakCampaign(who, key, idx);
  else if (ADV.Music && ADV.Music.stopVoice) ADV.Music.stopVoice();
}

// ---------------------------------------------------------------- beat playback (§2)
UI3.playBeat = function (scene, game, beat, done) {
  if (beat.artChapter !== undefined && ADV.GateArt) return ADV.GateArt.chapter(scene, game, beat, done);
  if (!beat.__gateReady && ADV.GateArt) return ADV.GateArt.withScene(scene, game, beat, done, next => UI3.playBeat(scene, game, Object.assign({}, beat, { __gateReady: true }), next));
  const who = beat.who;
  const def = D().CAMPAIGN_CHARS[who];
  if (!def) { if (done) done(); return; }
  const p = ADV.Game.player(game);
  const listener = beat.to && beat.to !== 'player' ? D().CAMPAIGN_CHARS[beat.to] : p;
  const context = { target: listener ? listener.name : '', them: beat.subject ? (D().CAMPAIGN_CHARS[beat.subject] || {}).name : undefined, self: def.name };
  const lines = beat.lines || C3().lines(C3().FID, who, beat.key);
  const actor = ADV.CampaignUI.speaker(game, who);
  const spk = ADV.GateArt ? ADV.GateArt.speaker(game, beat, actor) : actor;
  const recipient = listener ? 'To ' + listener.name : 'To the company';
  const finish = () => {
    C3().applyBeat(game, beat);
    if (beat.choice) UI3.choice(scene, game, beat, done);
    else if (beat.dynamic) UI3.dynamicChoice(scene, game, beat, done);
    else if (done) done();
  };
  if (beat.death) {
    const line = lines[0];
    if (!line) { finish(); return; }
    speak(who, beat.key, 1);
    ADV.DialogueBox.showText(scene, game, spk, ADV.CampaignUI.fill(game, line.t, who, context), () => {
      if (ADV.VFX && ADV.VFX.flashOverlay) ADV.VFX.flashOverlay(scene, 0xa8352c, 0.8);
      scene.time.delayedCall(600, finish);
    }, { raw: line.t, recipient, caption: beat.caption || D().STORY_DEATH_CAPTIONS.gate });
    return;
  }
  let i = 0;
  const next = () => {
    if (i >= lines.length) { finish(); return; }
    const line = lines[i++];
    speak(who, beat.key, i);
    ADV.DialogueBox.showText(scene, game, spk, ADV.CampaignUI.fill(game, line.t, who, context), next,
      { raw: line.t, recipient, caption: i === 1 ? beat.caption : undefined });
  };
  next();
};

// The silent protagonist picks a line; it shows in the box as theirs, then the reply plays.
UI3.choice = function (scene, game, beat, done) {
  const opts = C3().options(game, beat.choice);
  if (!opts.length) { if (done) done(); return; }
  UI3.pickModal(scene, game, beat, opts, (opt) => {
    C3().applyOption(game, beat.choice, opt);
    UI3.playerLine(scene, game, opt.text, beat.who, () => {
      if (opt.reply) UI3.playBeat(scene, game, C3().replyBeat(opt.reply, beat.who, game, opt, beat.choice), done);
      else if (done) done();
    });
  });
};
UI3.dynamicChoice = function (scene, game, beat, done) {
  const opts = C3().dynamicOptions(game, beat.dynamic);
  if (!opts.length) {
    // nobody is close enough: Hiwot (or nobody) marks the night and we move on
    if (beat.quiet) { if (done) done(); return; }
    if (C3().inCompany(game, 'wren_ward') || C3().isRecruited(game, 'wren_ward')) UI3.playBeat(scene, game, { c3: true, who: 'wren_ward', key: 'q9_romance_none', fid: C3().FID }, done);
    else if (done) done();
    return;
  }
  // each candidate speaks their piece in turn, then the player answers once
  const list = opts.slice();
  const speakAll = (cb) => { const o = list.shift(); if (!o) { cb(); return; } UI3.playBeat(scene, game, Object.assign({ c3: true, fid: C3().FID }, o.prompt), () => speakAll(cb)); };
  speakAll(() => {
    const all = opts.concat([{ id: 'none', text: 'Not now. Not with the city ahead of us.' }]);
    UI3.pickModal(scene, game, Object.assign({}, beat, { promptText: 'Someone is waiting for an answer.' }), all, (opt) => {
      if (opt.romance) {
        C3().applyOption(game, 'romance', opt);
        UI3.playerLine(scene, game, opt.text.replace(/^\([^)]*\)\s*/, ''), opt.speaker, () => UI3.playBeat(scene, game, Object.assign({ c3: true, fid: C3().FID }, opt.reply), done));
      } else {
        const declines = opts.map(o => ({ c3: true, fid: C3().FID, who: o.speaker, key: 'q9_romance_no' }));
        UI3.playerLine(scene, game, opt.text, opts[0].speaker, () => ADV.CampaignUI.playBeats(scene, game, declines, done));
      }
    });
  });
};
UI3.playerLine = function (scene, game, text, toWho, done) {
  const p = ADV.Game.player(game);
  const to = D().CAMPAIGN_CHARS[toWho];
  if (ADV.Music && ADV.Music.stopVoice) ADV.Music.stopVoice();
  ADV.DialogueBox.showText(scene, game, p, text, done, { raw: text, recipient: to ? 'To ' + to.name : 'To the company' });
};
// The modal: prompt (last NPC line) on top, one button per option, no cancel.
UI3.pickModal = function (scene, game, beat, opts, onPick) {
  const W = T().W;
  const n = opts.length;
  const bw = 760, rowH = 44, bh = 96 + rowH * n;
  const by = Math.max(60, Math.round((T().H - bh) / 2) - 40);
  const who = D().CAMPAIGN_CHARS[beat.who];
  const lines = beat.lines || C3().lines(C3().FID, beat.who, beat.key);
  const last = beat.promptText || (lines.length ? ADV.CampaignUI.fill(game, lines[lines.length - 1].t, beat.who) : '');
  ADV.Notices.custom(scene, (keep, Dp, close) => {
    ADV.GateArt?.choiceFrame(scene, keep, Dp, { x: W / 2 - bw / 2, y: by, w: bw, h: bh });
    keep(T().text(scene, W / 2, by + 22, who ? who.name : '', { size: 14, ox: 0.5, color: T().css.gold }).setDepth(Dp));
    keep(T().text(scene, W / 2, by + 46, last, { size: 13, ox: 0.5, wrap: bw - 60, align: 'center', italic: true, color: T().css.inkDim }).setDepth(Dp));
    let y = by + 84;
    for (const opt of opts) {
      const label = opt.text.length > 96 ? opt.text.slice(0, 93) + '…' : opt.text;
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - bw / 2 + 24, y, bw - 48, rowH - 8, label, () => { close(); onPick(opt); }, { size: 13 }));
      y += rowH;
    }
  }, { x: W / 2 - bw / 2, y: by, w: bw, h: bh });
};

// ---------------------------------------------------------------- town arrival
// Beats drain through CampaignUI.arrival (takeBeats is wrapped). The epilogue
// card is ours: shown once, replayable from the hall.
(function patchArrival() {
  const U2 = ADV.Campaign2UI;
  if (!U2 || !U2.arrival) return;
  const arrival = U2.arrival;
  U2.arrival = function (scene, game, done) {
    arrival(scene, game, () => {
      const s = C3().state(game);
      if (s.endCardDue) { s.endCardDue = false; C3().save(game); UI3.endCard(scene, game, done); }
      else if (done) done();
    });
  };
})();

UI3.endCard = function (scene, game, done) {
  const s = C3().state(game);
  const E = D().CAMPAIGN3_ENDINGS[s.ending] || { title: 'The End', line: '' };
  const paras = s.epilogue || C3().epilogue(game);
  const W = T().W, H = T().H;
  const objs = [];
  const k = o => { objs.push(o); return o; };
  const painting = ADV.GateArt?.view(scene, 'stills', ADV.GateArt.endingId(s.ending), { depth: 959 });
  if (painting) k(painting);
  k(scene.add.rectangle(W / 2, H / 2, W, H, 0x0c0a08, painting ? 0.70 : 0.97).setDepth(960).setInteractive());
  k(T().text(scene, W / 2, 60, E.title, { size: 34, display: true, ox: 0.5, color: T().css.gold }).setDepth(961));
  k(T().text(scene, W / 2, 104, E.line, { size: 15, ox: 0.5, italic: true, color: T().css.inkDim }).setDepth(961));
  const scroll = ADV.UI.scrollArea(scene, { x: 160, y: 136, w: W - 320, h: H - 136 - 110 }, { keep: k, depth: 961 });
  let y = 140;
  for (const para of paras) {
    const t = T().text(scene, 180, y, para, { size: 14, wrap: W - 380, color: T().css.ink });
    t.setDepth(961); scroll.add(t);
    y += (t.height || 40) + 16;
  }
  scroll.finish && scroll.finish();
  const b = T().button(scene, W / 2 - 110, H - 80, 220, 42, 'Back to the hall', () => { objs.forEach(o => { try { o.destroy(); } catch (e) {} }); if (done) done(); }, { size: 14, bold: true, color: T().css.ink });
  b.g.setDepth(962); b.txt.setDepth(963); b.zone.setDepth(964); objs.push(b.g, b.txt, b.zone);
};

// ---------------------------------------------------------------- the Story hall (§0)
Panels.story = function (scene, r) {
  const game = scene.g();
  const v = C3().hallView(game);
  const s = C3().state(game);
  ADV.GateArt?.hallBanner(scene, r);
  ADV.UI.header(scene, r, "Varenholm's Gate", v.ending ? 'The road is finished. The company is still yours.' : 'Fourteen quests, one road, and every word you say is yours to pick.', { reserveRight: 300 });

  // right column: company picker + meters
  const cx = r.x + r.w - 290, cw = 270;
  let cy = r.y + 70;
  scene.keep(T().text(scene, cx, cy, 'THE COMPANY  ·  up to ' + C3().MAX_COMPANY + ' ride along', { size: 11, color: T().css.inkDim })); cy += 20;
  if (!v.roster.length) { scene.keep(T().text(scene, cx, cy, 'Nobody yet. The road will provide.', { size: 12, italic: true, color: T().css.inkFaint })); cy += 22; }
  const companyTop = cy, companyH = Math.min(v.roster.length * 40, Math.max(80, r.h - 260));
  const companyScroll = v.roster.length ? ADV.UI.scrollArea(scene, { x: cx - 3, y: cy, w: cw + 6, h: companyH }, { keep: o => scene.keep(o) }) : null;
  for (const id of v.roster) {
    const ch = D().CAMPAIGN_CHARS[id];
    const on = v.company.includes(id);
    companyScroll.addBtn(T().button(scene, cx, cy, cw, 34, (on ? '● ' : '○ ') + ch.name, () => { C3().toggleCompany(game, id); scene.openPanel('story'); },
      { size: 12, color: on ? T().css.gold : T().css.inkDim, sub: (s.romance === id ? 'yours · ' : '') + (ch.desc || '').split('.')[0], subColor: T().css.inkFaint }));
    cy += 40;
  }
  if (companyScroll) { companyScroll.finish(); cy = companyTop + companyH; }
  cy += 6;
  const her = s.heritage;
  const herLabel = her <= -2 ? 'starved' : her < 0 ? 'resisting' : her === 0 ? 'quiet' : her < 2 ? 'stirring' : 'awake';
  const emblem = ADV.GateArt?.icon(scene, herLabel === 'awake' ? 'extras' : 'emblem', herLabel);
  if (emblem) scene.keep(scene.add.image(cx + cw - 22, cy + 14, emblem).setDisplaySize(42, 42));
  scene.keep(T().text(scene, cx, cy, `The blood: ${herLabel}`, { size: 12, color: her > 0 ? T().css.blood : T().css.purple })); cy += 18;
  if (s.allegiance) { scene.keep(T().text(scene, cx, cy, `Allegiance: ${({ gauntlet: 'the Burning Gauntlet', consortium: 'Folake', thieves: 'the Undervault' })[s.allegiance]}`, { size: 12, color: T().css.inkDim })); cy += 18; }
  scene.keep(T().text(scene, cx, cy, s.stage ? 'The road remembers you: progress survives death.' : 'Progress survives death.', { size: 11, italic: true, color: T().css.inkFaint })); cy += 20;

  // left column: the quests (scrolling)
  const lx = r.x + 24, lw = r.w - 340;
  const listTop = r.y + 96, listH = r.h - 96 - 60;
  const scroll = ADV.UI.scrollArea(scene, { x: lx - 4, y: listTop, w: lw + 8, h: listH }, { keep: o => scene.keep(o) });
  let y = listTop + 4;
  let chapter = null;
  for (const q of v.quests) {
    if (q.chapter !== chapter) {
      chapter = q.chapter;
      scroll.add(T().text(scene, lx, y, chapter.toUpperCase(), { size: 11, color: T().css.inkDim })); y += 20;
    }
    const status = q.status;
    const short = q.brief.length > 58 ? q.brief.slice(0, 55).replace(/\s+\S*$/, '') + '…' : q.brief;
    const sub = status === 'done' ? 'done' : status === 'locked' ? 'locked' : `${q.enc.length} encounters · ${short}`;
    scroll.addBtn(T().button(scene, lx, y, lw, 46, `${q.n}. ${q.name}`, () => {
      if (status !== 'open') return;
      if (!s.started) C3().start(game);
      ADV.Panels.departure(scene, C3().buildQuest(game, q.n));
    }, { size: 14, disabled: status !== 'open', display: status === 'open', sub, subColor: status === 'done' ? T().css.green : T().css.inkDim }));
    y += 54;
  }
  if (v.ending) {
    scroll.addBtn(T().button(scene, lx, y, 300, 34, 'Read the epilogue again', () => UI3.endCard(scene, game), { size: 12, color: T().css.inkDim })); y += 42;
  }
  scroll.addBtn(T().button(scene, lx, y, 300, 34, 'Start the road over', () => {
    ADV.Notices.confirm(scene, 'Start over?', 'Every choice, every companion and every chapter is forgotten. The world and your character are untouched.', 'Forget it all', () => { C3().restart(game); scene.openPanel('story'); }, T().css.blood);
  }, { size: 12, color: T().css.inkFaint })); y += 42;
  scroll.finish && scroll.finish();
  UI3.debugRow(scene, r);
};

UI3.debugRow = function (scene, r) {
  const game = scene.g();
  const y = r.y + r.h - 44;
  scene.keep(T().text(scene, r.x + 24, y + 8, 'debug skip:', { size: 11, color: T().css.inkFaint }));
  let x = r.x + 100;
  for (let n = 1; n <= C3().QUEST_COUNT; n++) {
    keepBtn(scene, T().button(scene, x, y, 26, 24, String(n), () => { C3().debugJump(game, n); scene.openPanel('story'); }, { size: 10, color: T().css.inkFaint }));
    x += 28;
  }
};
})();
