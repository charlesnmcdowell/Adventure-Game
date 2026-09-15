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

// Hashes are cache-busters on the URL, not a play gate. Missing entries still
// play; a 404 is silent, but a recorded line must not be dropped because the
// manifest lagged behind the file.
function speak(who, key, idx) {
  if (ADV.Music && ADV.Music.speakCampaign) ADV.Music.speakCampaign(who, key, idx);
}

// ---------------------------------------------------------------- beat playback (§2)
UI3.playBeat = function (scene, game, beat, done) {
  // Resolve eligibility before loading any dialogue from a dynamic wrapper.
  if (beat.dynamic) return UI3.dynamicChoice(scene, game, beat, done);
  // Old saves can still contain queued offers or replies from the retired route.
  if (beat.who === 'selene' && /^q9_romance(?:_|$)/.test(beat.key || '')) {
    if (done) done();
    return;
  }
  // Retire unsolicited queued confessions, including old Amara/Hiwot wrappers.
  if (/^q9_romance(?:_|$)/.test(beat.key || '') && !beat.privateCourtship) {
    if (done) done();
    return;
  }
  if (beat.artChapter !== undefined && ADV.GateArt) return ADV.GateArt.chapter(scene, game, beat, done);
  if (!beat.combat && !beat.__gateReady && ADV.GateArt) return ADV.GateArt.withScene(scene, game, beat, done, next => UI3.playBeat(scene, game, Object.assign({}, beat, { __gateReady: true }), next));
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
  UI3.cueFor(beat);
  const finish = () => {
    const seats = C3().applyBeat(game, beat) || { joined: [], overflow: [] };
    const cont = () => {
      if (beat.choice) UI3.choice(scene, game, beat, done);
      else if (done) done();
    };
    UI3.announceJoins(scene, seats.joined);
    UI3.offerSeats(scene, game, seats.overflow, cont);
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
    speak(who, beat.key, line.vo || (beat.voOffset || 0) + i);
    ADV.DialogueBox.showText(scene, game, spk, ADV.CampaignUI.fill(game, line.t, who, context), next,
      { raw: line.t, recipient, caption: i === 1 ? beat.caption : undefined });
  };
  next();
};

// The throne dreams play under their own cue; the first waking beat brings the
// quest's underscore back (replies to a dream choice stay in the dream).
UI3.cueFor = function (beat) {
  const M = D().CAMPAIGN3_MUSIC, Mu = ADV.Music;
  if (!M || !Mu || !Mu.cue) return;
  if (beat.dream) { if (Mu.cued !== M.dream) Mu.cue(M.dream); }
  else if (Mu.cued === M.dream) Mu.cue(null);
};

// The silent protagonist picks a line; it shows in the box as theirs, then the reply plays.
UI3.choice = function (scene, game, beat, done) {
  const opts = C3().options(game, beat.choice);
  if (!opts.length) { if (done) done(); return; }
  UI3.pickModal(scene, game, beat, opts, (opt) => {
    const seats = C3().applyOption(game, beat.choice, opt) || { joined: [], overflow: [] };
    UI3.announceJoins(scene, seats.joined);
    UI3.playerLine(scene, game, opt.text, beat.who, () => {
      const after = () => UI3.offerSeats(scene, game, seats.overflow, done);
      if (opt.reply) UI3.playBeat(scene, game, Object.assign(C3().replyBeat(opt.reply, beat.who, game, opt, beat.choice), beat.dream ? { dream: true } : {}), after);
      else after();
    });
  });
};
UI3.dynamicChoice = function (scene, game, beat, done) {
  // Compatibility with arrival queues in older saves. Courtship now starts only
  // from the inn, never by playing a procession of unsolicited confessions.
  if (done) done();
};
UI3.innConversations = function (scene, game, done) {
  const opts = C3().roster(game).filter(id => C3().canTalkPrivately(game, id)).map(id => ({ id, text: C3().charName(id) }));
  opts.push({ id: 'close', text: 'Back to the hall' });
  UI3.pickModal(scene, game, { promptText: opts.length > 1 ? 'Spend some time with a companion. Who would you like to talk to?' : 'No private conversations are available yet.' }, opts, opt => {
    if (opt.id === 'close') { if (done) done(); return; }
    UI3.privateConversation(scene, game, opt.id, () => UI3.innConversations(scene, game, done));
  });
};
UI3.privateConversation = function (scene, game, who, done) {
  const c = C3(), route = D().CAMPAIGN3_COURTSHIP[who];
  if (!c.canTalkPrivately(game, who)) { if (done) done(); return; }
  const bond = c.courtshipState(game, who), conversation = c.personalConversation(game, who);
  const frame = { c3: true, fid: c.FID, who, privateCourtship: true, artLocation: 'nine_lanterns', artPhase: 'night' };
  const play = (key, next) => UI3.playBeat(scene, game, { ...frame, key }, next);
  const finish = () => { if (done) done(); };
  const opts = [];
  if (conversation) opts.push({ id: 'talk', text: 'Sit and talk for a while. [Friendship]' });
  if (c.canExpressInterest(game, who)) opts.push({ id: 'interest', text: bond.status === 'deferred' ? 'I am ready to try courtship. [Romantic interest]' : bond.status === 'declined' ? 'My feelings have changed. May I court you? [Romantic interest]' : 'I would like to be more than friends. [Romantic interest]' });
  if (c.canOfferRomance(game, who)) opts.push({ id: 'offer', text: 'Could we talk about us? [Courtship]' });
  opts.push({ id: 'close', text: 'Leave the conversation' });
  const status = bond.status === 'established' ? 'You are seeing each other.' : bond.status === 'declined' ? 'You agreed to remain friends. Only you can reopen the subject.' : bond.status === 'deferred' ? 'You asked for time. There will be no further invitation unless you bring it up.' : bond.status === 'interested' ? (c.canOfferRomance(game, who) ? 'You have spent time together. You can ask how they feel about you.' : 'You have expressed interest. Give the relationship time between conversations.') : 'You can get to know each other without pursuing a romance.';
  const wait = !conversation && bond.talks.length < 2 || bond.status === 'interested' && !c.canOfferRomance(game, who);
  UI3.pickModal(scene, game, { ...frame, promptText: status + (wait ? (c.completed(game) ? ' Return after another adventure.' : ' Return after completing another campaign quest.') : '') }, opts, opt => {
    if (opt.id === 'close') return finish();
    if (opt.id === 'talk') {
      play(conversation.key, () => UI3.pickModal(scene, game, { ...frame, key: conversation.key }, [
        { id: 'continue', text: conversation.text }, { id: 'close', text: 'I should go. We can talk another time.' },
      ], answer => {
        if (answer.id === 'close') return finish();
        if (!c.finishConversation(game, who, conversation.key)) return finish();
        UI3.playerLine(scene, game, answer.text, who, () => play(conversation.reply, () => UI3.privateConversation(scene, game, who, done)));
      }));
    } else if (opt.id === 'interest') {
      if (!c.expressInterest(game, who)) return finish();
      UI3.playerLine(scene, game, opt.text.replace(/ \[[^\]]+\]$/, ''), who, () => play(route.interest, finish));
    } else if (opt.id === 'offer' && c.canOfferRomance(game, who)) {
      play('q9_romance', () => UI3.pickModal(scene, game, { ...frame, key: 'q9_romance' }, [
        { id: 'yes', text: 'Yes. I would like that. [Begin a relationship]' },
        { id: 'later', text: 'I need more time. I will bring it up when I am ready.' },
        { id: 'friends', text: 'I want us to remain friends.' },
      ], answer => {
        if (!c.answerCourtship(game, who, answer.id)) return finish();
        UI3.playerLine(scene, game, answer.text.replace(/ \[[^\]]+\]$/, ''), who,
          () => play(answer.id === 'later' ? route.later : 'q9_romance_' + (answer.id === 'yes' ? 'yes' : 'no'), finish));
      }));
    } else finish();
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
  const scale = ADV.DialogueBox.displayScale(scene);
  const bw = scale < .85 ? W - 100 : 760;
  const size = ADV.DialogueBox.fontSize(scene,13);
  const who = D().CAMPAIGN_CHARS[beat.who];
  const lines = beat.lines || C3().lines(C3().FID, beat.who, beat.key);
  const last = beat.promptText || (lines.length ? ADV.CampaignUI.fill(game, lines[lines.length - 1].t, beat.who) : '');
  const heightOf = (text,wrap) => {
    const probe=T().text(scene,-2000,-2000,text,{size,wrap});const h=probe.height;probe.destroy();return h;
  };
  const promptH=heightOf(last,bw-80);
  const rowHeights=opts.map(opt=>Math.max(40,Math.ceil(34/scale),heightOf(opt.text,bw-100)+22));
  const bh=Math.min(T().H-60,Math.ceil(100+promptH+rowHeights.reduce((sum,h)=>sum+h+12,0)));
  const by=Math.round((T().H-bh)/2);
  return ADV.Notices.custom(scene, (keep, Dp, close) => {
    ADV.GateArt?.choiceFrame(scene, keep, Dp, { x: W / 2 - bw / 2, y: by, w: bw, h: bh });
    keep(ADV.DialogueBox.crisp(T().text(scene, W / 2, by + 20, who ? who.name : '', { size:ADV.DialogueBox.fontSize(scene,14,12), ox: 0.5, color: T().css.gold })).setDepth(Dp));
    const area=ADV.UI.scrollArea(scene,{x:W/2-bw/2+16,y:by+62,w:bw-32,h:bh-78},{keep,depth:Dp});
    area.add(ADV.DialogueBox.crisp(T().text(scene,W/2,by+66,last,{size,ox:.5,wrap:bw-80,align:'center',color:T().css.inkDim})));
    let y = by + 66 + promptH + 22;
    for (const [i,opt] of opts.entries()) {
      const b=T().button(scene,W/2-bw/2+28,y,bw-56,rowHeights[i],opt.text,()=>{close();onPick(opt);},{size});
      b.txt.setWordWrapWidth(bw-100).setAlign('center');ADV.DialogueBox.crisp(b.txt);
      area.addBtn(b);
      y += rowHeights[i]+12;
    }
    area.extend(y);
  }, { x: W / 2 - bw / 2, y: by, w: bw, h: bh });
};

const mountChoice=UI3.pickModal;
UI3.pickModal=function(scene,game,beat,opts,onPick){
  let closeCard,timer,closed=false,scale=ADV.DialogueBox.displayScale(scene);
  const unbind=()=>{scene.scale.off('resize',resize);scene.events.off('shutdown',shutdown);timer?.remove(false);};
  const pick=opt=>{if(closed)return;closed=true;unbind();onPick(opt);};
  const resize=()=>{timer?.remove(false);timer=scene.time.delayedCall(40,()=>{
    const next=ADV.DialogueBox.displayScale(scene);if(closed||Math.abs(next-scale)<.001)return;scale=next;
    closeCard();closeCard=mountChoice(scene,game,beat,opts,pick);
  });};
  const shutdown=()=>{if(closed)return;closed=true;unbind();closeCard();};
  closeCard=mountChoice(scene,game,beat,opts,pick);
  scene.scale.on('resize',resize);scene.events.once('shutdown',shutdown);
  return shutdown;
};

function toast(scene, text) { if (text && ADV.Notices && ADV.Notices.toast) ADV.Notices.toast(scene, text); }
function andNames(ids) {
  const names = (ids || []).map(id => C3().charName(id));
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return names[0] + ' and ' + names[1];
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}
UI3.announceJoins = function (scene, joined) {
  if (joined && joined.length) toast(scene, andNames(joined) + (joined.length === 1 ? ' rides with you.' : ' ride with you.'));
};
// After a recruit, anyone who did not fit is offered a seat: replace a rider
// or leave the newcomer at the inn. Hall clicks pass { cancelable: true }.
UI3.offerSeats = function (scene, game, ids, done, opts) {
  const list = (ids || []).filter(id => C3().isRecruited(game, id) && !C3().inCompany(game, id));
  const next = () => {
    if (!list.length) { if (done) done(); return; }
    const id = list.shift();
    if (C3().seat(game, id)) { toast(scene, C3().charName(id) + ' rides with you.'); next(); return; }
    UI3.pickSeat(scene, game, id, opts, next);
  };
  next();
};
UI3.pickSeat = function (scene, game, who, opts, done) {
  const name = C3().charName(who);
  const riding = C3().companyIds(game);
  const cancelable = !!(opts && opts.cancelable);
  if (!ADV.Notices || !ADV.Notices.custom) { if (done) done(); return; }
  const n = riding.length + 1 + (cancelable ? 1 : 0);
  const W = T().W, bw = 560, rowH = 40, bh = 118 + rowH * n;
  const by = Math.max(36, Math.round((T().H - bh) / 2) - 16);
  ADV.Notices.custom(scene, (keep, Dp, close) => {
    keep(T().text(scene, W / 2, by + 22, 'The company is full', { size: 20, display: true, ox: 0.5, color: T().css.gold }).setDepth(Dp));
    keep(T().text(scene, W / 2, by + 52, name + ' wants to ride, but only ' + (C3().MAX_COMPANY + 1) + ' can. Who stays at the inn?', {
      size: 13, ox: 0.5, wrap: bw - 48, align: 'center', color: T().css.inkDim,
    }).setDepth(Dp));
    let y = by + 86;
    for (const rid of riding) {
      const label = 'Send ' + C3().charName(rid) + ' back — ' + name + ' rides';
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, y, 400, 34, label, () => {
        close();
        C3().replaceCompany(game, rid, who);
        toast(scene, name + ' rides. ' + C3().charName(rid) + ' waits at the inn.');
        if (done) done();
      }, { size: 13 }));
      y += rowH;
    }
    ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, y, 400, 34, 'Leave ' + name + ' at the inn', () => {
      close();
      toast(scene, name + ' waits at the inn. Bring them from the Story hall.');
      if (done) done();
    }, { size: 13 }));
    y += rowH;
    if (cancelable) {
      ADV.UI.modalBtn(keep, Dp, T().button(scene, W / 2 - 200, y, 400, 34, 'Keep the company as it is', () => { close(); if (done) done(); }, { size: 13 }));
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
  const M = D().CAMPAIGN3_MUSIC;
  if (M && M.ending && ADV.Music && ADV.Music.cue) ADV.Music.cue(M.ending);
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
  const b = T().button(scene, W / 2 - 110, H - 80, 220, 42, 'Back to the hall', () => {
    objs.forEach(o => { try { o.destroy(); } catch (e) {} });
    if (ADV.Music && ADV.Music.cued) { ADV.Music.homeOverride = C3().hubMusic(game); ADV.Music.cue(null); }
    if (done) done();
  }, { size: 14, bold: true, color: T().css.ink });
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
  const ridingN = v.company.length, full = ridingN >= C3().MAX_COMPANY;
  scene.keep(T().text(scene, cx, cy, 'THE COMPANY  ·  ' + (ridingN + 1) + '/' + (C3().MAX_COMPANY + 1), { size: 11, color: full ? T().css.gold : T().css.inkDim })); cy += 20;
  if (!v.roster.length) { scene.keep(T().text(scene, cx, cy, 'Nobody yet. The road will provide.', { size: 12, italic: true, color: T().css.inkFaint })); cy += 22; }
  const companyTop = cy, companyH = Math.min(v.roster.length * 40, Math.max(80, r.h - 260));
  const companyScroll = v.roster.length ? ADV.UI.scrollArea(scene, { x: cx - 3, y: cy, w: cw + 6, h: companyH }, { keep: o => scene.keep(o) }) : null;
  for (const id of v.roster) {
    const ch = D().CAMPAIGN_CHARS[id];
    const on = v.company.includes(id);
    const description = (on ? 'riding · ' : 'at the inn · ') + (s.romance === id ? 'partner · ' : '') + (ch.desc || '').split('.')[0];
    const subtitle = description.length > 38 ? description.slice(0, 35).replace(/\s+\S*$/, '') + '…' : description;
    companyScroll.addBtn(T().button(scene, cx, cy, cw, 34, (on ? '● ' : '○ ') + ch.name, () => {
      if (on || !C3().companyFull(game)) { C3().toggleCompany(game, id); scene.openPanel('story'); return; }
      UI3.offerSeats(scene, game, [id], () => scene.openPanel('story'), { cancelable: true });
    }, { size: 12, color: on ? T().css.gold : T().css.inkDim, sub: subtitle, subColor: T().css.inkFaint }));
    cy += 40;
  }
  if (companyScroll) { companyScroll.finish?.(); cy = companyTop + companyH; }
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
  scroll.addBtn(T().button(scene, lx, y, lw, 46, 'Talk at the inn', () => UI3.innConversations(scene, game, () => scene.openPanel('story')), { size: 14, sub: 'Optional private conversations · friendship or courtship', subColor: T().css.inkDim }));
  y += 58;
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
