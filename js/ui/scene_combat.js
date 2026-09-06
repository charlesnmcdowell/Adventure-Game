// Combat scene (§4/§20): three lanes per side, portrait units with name plate,
// HP bar and intent icon; turn order strip; portrait motion as the feel channel.
(function () {
'use strict';
const T = () => ADV.T;
const AUTO_PACE_PAD_MS = 500;

const LANE_X = { a: { front: 520, mid: 396, back: 272 }, b: { front: 760, mid: 884, back: 1008 } };
const SLOT_Y = [170, 330, 490];

class CombatScene extends Phaser.Scene {
  constructor() { super('Combat'); }
  init(data) { this.mode = (data && data.mode) || 'quest'; }

  st() {
    const g = this.game_;
    if (this.mode === 'quest') return g.quest.combat;
    if (this.mode === 'ambush') return g.ambushCombat.st;
    if (this.mode === 'rescue') return g.rescueCombat.st;
    if (this.mode === 'assassination') return g.assassination.st;
    return null;
  }

  create() {
    this.game_ = this.registry.get('game');
    // Phaser reuses scene instances across scene.start() — every run flag
    // must be reset here or the second fight of a quest inherits ended=true
    // and the turn loop never runs.
    this.ended = false;
    this.processing = false;
    this.targeting = null;
    this.actionObjs = [];
    this.autoTimer = null;
    this._autoPaused = false;
    this._autoHalted = false;
    const W = T().W, H = T().H;
    // A roadside mugging and a drowned king used to share one flat rectangle.
    if (ADV.BattleArt) {
      ADV.BattleArt.paint(this, ADV.BattleArt.groundFor(this.game_, this.mode), ADV.BattleArt.phaseFor(this.game_));
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0x121110);
    }
    const st = this.st();
    if (!st) { this.scene.start('Town'); return; }
    // music: bosses, ambushes and divine business get the heavy themes;
    // ordinary encounters rotate the battle pool ("switch it up often")
    const heavy = this.mode !== 'quest' || st.units.some(u => u.ch.boss);
    ADV.Music.play(heavy ? 'boss' : 'combat');
    // battlefield ground
    const g = this.add.graphics();
    // translucent so the ground reads at the edges without costing lane clarity
    g.fillStyle(0x1a1815, ADV.BattleArt ? 0.72 : 1); g.fillRect(40, 120, W - 80, 500);
    g.lineStyle(1, T().c.panelEdge, 0.6);
    for (const side of ['a', 'b']) for (const lane of ['front', 'mid', 'back']) {
      g.strokeRect(LANE_X[side][lane] - 62, 130, 124, 484);
    }
    g.lineStyle(2, T().c.goldDim, 0.5);
    g.lineBetween(W / 2, 130, W / 2, 614);
    T().text(this, W / 2, 636, 'front lanes meet in the middle · melee reaches the front · cover shields the lanes behind', { size: 11, ox: 0.5, color: T().css.inkFaint });

    this.unitViews = new Map();
    for (const u of st.units) if (!u.reserved) this.makeUnitView(u);
    this.updateReserveCounters();

    this.roundText = T().text(this, 56, 18, '', { size: 15, display: true, color: T().css.gold });
    this.paintHudChrome();
    const box = this.hudChrome();
    this.turnStrip = T().text(this, 56, 56, '', { size: 12, color: T().css.inkDim, wrap: box.left - 68 });
    this.banner = T().text(this, W / 2, 96, this.mode === 'ambush' ? 'AMBUSHED — at your worst, as intended' :
      this.mode === 'rescue' ? 'You took a side.' :
      this.mode === 'assassination' ? 'Only one side walks away.' :
      (st.ambushUid ? 'Your ambush — strike first, twice' : ''), { size: 15, display: true, ox: 0.5, wrap: box.left - 80, align: 'center', color: T().css.blood });

    // an ambush opens on startled faces (Part B): the ambushed side, or the
    // victims of the player's own ambush
    if (this.mode === 'ambush' || st.ambushUid) {
      const ambusher = st.ambushUid ? st.units.find(x => x.uid === st.ambushUid) : null;
      const victimSide = this.mode === 'ambush' ? 'a' : (ambusher ? (ambusher.side === 'a' ? 'b' : 'a') : 'b');
      this.time.delayedCall(250, () => { for (const o of this.unitViews.values()) if (o.u.side === victimSide) this.reactAt(o, 'surprised', { ms: 600, intensity: 1 }); });
    }
    this.eventCursor = st.events.length;
    if (this.res_a) { this.res_a = null; }
    if (this.res_b) { this.res_b = null; }
    // replay initial round order
    this.refreshStrip();
    this.time.delayedCall(300, () => this.loop());
  }

  // ------------------------------------------------------------ unit views
  // C1: on the field the portrait is the beast while a form holds
  unitKey(u) {
    if (u.form && ADV.Portraits.beastKey) { try { return ADV.Portraits.beastKey(this, u.ch, u.form); } catch (e) {} }
    return ADV.Portraits.key(this, u.ch);
  }
  makeUnitView(u) {
    const x = LANE_X[u.side][u.lane], y = SLOT_Y[u.slot] || SLOT_Y[0];
    const key = this.unitKey(u);
    const laneScale = u.lane === 'back' ? 0.9 : u.lane === 'mid' ? 0.95 : 1;
    const img = this.add.image(x, y, key).setDisplaySize((u.ch.boss ? 112 : 92) * laneScale, (u.ch.boss ? 142 : 116) * laneScale).setDepth(10);
    if (u.ch.isConscript) { img.setTint(ADV.CONSCRIPT_TINT || 0x9a8ab0); img.__baseTint = ADV.CONSCRIPT_TINT || 0x9a8ab0; }
    else if (u.ch.isUndead) { img.setTint(0x88bb99); img.__baseTint = 0x88bb99; }
    else if (u.lane === 'back') { img.setTint(0xb0a898); img.__baseTint = 0xb0a898; }
    if (ADV.Portraits.animate) ADV.Portraits.animate(this, img, u.ch, key);
    if (ADV.Portraits.express) { const m = this.combatMood(u); ADV.Portraits.express(this, img, u.ch, key, m.mood, m.intensity); }
    const frame = this.add.graphics();
    const isPlayer = !!u.ch.isPlayer;
    frame.lineStyle(2, isPlayer ? T().c.gold : u.side === 'a' ? T().c.green : T().c.blood, 0.9);
    frame.strokeRect(x - img.displayWidth / 2, y - img.displayHeight / 2, img.displayWidth, img.displayHeight);
    const name = T().text(this, x, y + img.displayHeight / 2 + 17, u.ch.name, { size: 11, ox: 0.5, color: isPlayer ? T().css.gold : T().css.ink });
    const hpBar = this.add.graphics();
    const intent = T().text(this, x, y - img.displayHeight / 2 - 18, '', { size: 10, ox: 0.5, color: T().css.blue, wrap: 130, align: 'center' });
    const status = T().text(this, x, y + img.displayHeight / 2 + 33, '', { size: 9, ox: 0.5, color: T().css.purple });
    const pips = this.add.graphics();
    const view = { u, img, frame, name, hpBar, intent, status, pips, x, y };
    this.unitViews.set(u.uid, view);
    this.redrawUnit(view);
    return view;
  }

  // Standing mood in combat comes from one chooser for every surface (Part C).
  // Enemies are people too — no isMonster guard here any more.
  combatMood(u) {
    if (!u || !u.ch || u.dead || u.chp <= 0) return { mood: 'neutral', intensity: 0 };
    const st = this.st();
    const foes = st ? st.units.filter(x => x.side !== u.side && !x.downed && !x.fled) : [];
    const facingUndead = foes.some(x => x.ch.isUndead || x.ch.status === 'undead' || x.risen || (x.ch.actives || []).some(a => /necromancy|conscript/.test(a.skillId)));
    const cleanse = (u.ch.actives || []).some(a => /cleanse|purify|absolution/.test(a.skillId));
    return ADV.Portraits.moodFor(this.game_, u.ch, 'combat', { unit: u, st, facingUndead, cleanse });
  }

  // relationship helpers for reactions (Part B): kin on the same field
  isKin(a, b) {
    if (!a || !b || a === b) return false;
    if (ADV.Rel && ADV.Rel.isPartner && ADV.Rel.isPartner(a, b)) return true;
    return a.motherId === b.id || a.fatherId === b.id || b.motherId === a.id || b.fatherId === a.id;
  }
  laughsAtKills(ch) {
    return /^(M02|M25|M26|F02|F26|M17|F17)$/.test(ch.personalityId || '') || (ch.perks || []).some(p => p.skillId === 'arena_champion');
  }
  reactAt(v, mood, opts) {
    if (!v || !v.img || !ADV.Portraits.react) return;
    ADV.Portraits.react(this, v.img, v.u.ch, v.img.texture && v.img.texture.key, mood, opts);
  }
  isDruidUnit(u) {
    if (!u || !u.ch) return false;
    const has = (id) => (u.ch.actives || []).some(a => a.skillId === id) || (u.ch.perks || []).some(a => a.skillId === id);
    return (u.ch.actives || []).concat(u.ch.perks || []).some(a => { const d = ADV.DATA.SKILLS[a.skillId]; return d && d.archetype === 'druid'; }) || has('wild_form');
  }
  cameraPunch() {
    const now = this.time.now;
    if (this.__lastPunch && now - this.__lastPunch < 1500) return;
    this.__lastPunch = now;
    const cam = this.cameras.main;
    this.tweens.add({ targets: cam, zoom: 1.06, duration: 180, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { cam.setZoom(1); } });
  }
  unitSkin(v) {
    if (!ADV.Portraits.skinState || !v.img) return;
    const u = v.u;
    const has = (k) => (u.statuses || []).some(s => s.kind === k);
    const pct = u.maxHp ? u.chp / u.maxHp : 1;
    const state = { pale: pct < 0.25 ? 1 : pct < 0.4 ? 0.5 : 0, sick: has('poison') ? 1 : 0, frozen: has('frozen'), burning: has('burn'), wound: !!u.__wound,
      flush: (v.img.__expressMood === 'angry' || v.img.__expressMood === 'furious') ? 0.8 : 0 };
    const sig = JSON.stringify(state);
    if (v.__skinSig === sig) return;
    v.__skinSig = sig;
    ADV.Portraits.skinState(this, v.img, u.ch, v.img.texture && v.img.texture.key, state);
  }

  redrawUnit(v) {
    const u = v.u;
    // the form dropped without a beat (status expired at round end): bring the face back
    if (v.img && !u.form && v.img.texture && /^pb1_/.test(v.img.texture.key) && !v.__reverting) {
      v.__reverting = true;
      const human = ADV.Portraits.key(this, u.ch);
      const done = () => { v.__reverting = false; };
      if (ADV.VFX.revertForm) { this.time.delayedCall(ADV.VFX.revertForm(this, v, human), done); } else { try { v.img.setTexture(human); } catch (e) {} done(); }
    }
    if (ADV.Portraits.express && v.img) {
      const m = this.combatMood(u);
      if (v.img.__expressMood !== m.mood || Math.abs((v.img.__expressK == null ? 1 : v.img.__expressK) - m.intensity) > 0.05) ADV.Portraits.express(this, v.img, u.ch, v.img.texture && v.img.texture.key, m.mood, m.intensity);
      this.unitSkin(v);
    }
    v.hpBar.clear();
    const w = v.img.displayWidth;
    const pct = Math.max(0, u.chp / u.maxHp);
    const by = v.y + v.img.displayHeight / 2 + 3;
    v.hpBar.fillStyle(0x0d0c0a, 1); v.hpBar.fillRect(v.x - w / 2, by, w, 7);
    v.hpBar.fillStyle(pct > 0.5 ? 0x5d8a4a : pct > 0.25 ? 0xd4a94e : T().c.hp, 1);
    v.hpBar.fillRect(v.x - w / 2, by, w * pct, 7);
    v.hpBar.lineStyle(1, 0x000000, 0.8); v.hpBar.strokeRect(v.x - w / 2, by, w, 7);
    if (u.tempHp > 0) {
      const tp = Math.min(1, u.tempHp / u.maxHp);
      v.hpBar.fillStyle(T().c.tempHp, 1); v.hpBar.fillRect(v.x - w / 2, by + 8, w * tp, 3);
    }
    const PIP = {
      burn: 0xd8574a, bleed: 0xa8352c, poison: 0x5d8a4a, hot: 0x83b56b, thorns: 0x4a6a38,
      guard: 0xd4a94e, ward: 0x6fa0bf, atkBuff: 0xd4a94e, beastShape: 0xc48a3a, aura: 0x9a70c0, healcut: 0xa8352c,
      frozen: 0x6fc0e8, shocked: 0xd4a94e, sealed: 0x6a4a8a, purified: 0xf4eee0, iceArmor: 0x6fa0bf,
    };
    const colors = [];
    for (const s of u.statuses) if (PIP[s.kind]) colors.push(PIP[s.kind]);
    if (u.evade > 0) colors.push(0xa89a7c);
    if (u.marksBy.length) colors.push(0x9a70c0);
    v.status.setText('');
    if (v.pips) {
      v.pips.clear();
      const pipY = v.y + v.img.displayHeight / 2 + 36;
      const start = v.x - (Math.max(0, colors.length - 1) * 6);
      colors.forEach((c, i) => {
        v.pips.fillStyle(c, 1);
        v.pips.fillCircle(start + i * 12, pipY, 4);
        v.pips.lineStyle(1, 0x000000, 0.55);
        v.pips.strokeCircle(start + i * 12, pipY, 4);
      });
    }
    if (u.downed || u.fled) { if (ADV.SpellFX) ADV.SpellFX.clearStatus(v); }
    else if (ADV.SpellFX) ADV.SpellFX.syncStatus(this, v);
    if (u.stealth && !u.downed && !u.fled) { v._fxStealthed = true; if (v.img.alpha > 0.5) v.img.setAlpha(0.4); }
    else if (v._fxStealthed && !u.downed && !u.fled) { v._fxStealthed = false; v.img.setAlpha(1); }
    if (u.downed) { ADV.VFX.desaturate(v.img); v.intent.setText(''); v.frame.setAlpha(0.4); v.name.setAlpha(0.5); }
    if (u.fled) { v.img.setAlpha(0.2); v.intent.setText('fled'); }
  }

  refreshIntents() {
    let shownPrompt = false;
    for (const v of this.unitViews.values()) {
      if (v.u.downed || v.u.fled) continue;
      if (v.u.planned && !v.u.ch.isPlayer) {
        v.intent.setText(v.u.planned.label || '');
        if (v.u.side === 'a' && !shownPrompt) {
          const l = ADV.Game.prompt(this.game_, 'firstIntentIcon');
          if (l) { ADV.Notices.toast(this, l); shownPrompt = true; }
        }
      } else v.intent.setText('');
    }
  }

  refreshStrip() {
    const st = this.st();
    this.roundText.setText('Round ' + st.round);
    const names = st.turnQueue.slice(st.turnIdx, st.turnIdx + 9).map(e => {
      const u = st.units.find(x => x.uid === e.uid);
      return u && !u.downed && !u.fled ? (u.ch.isPlayer ? '★' + u.ch.name : u.ch.name) : null;
    }).filter(Boolean);
    this.turnStrip.setText('order: ' + names.join(' → '));
  }

  updateReserveCounters() {
    const st = this.st();
    for (const side of ['a', 'b']) {
      const n = st.units.filter(u => u.side === side && u.reserved && !u.downed && !u.fled).length;
      const key = 'res_' + side;
      if (this[key]) { try { this[key].destroy(); } catch (e) {} this[key] = null; }
      if (n > 0) this[key] = T().text(this, side === 'a' ? 70 : T().W - 70, 600, `+${n} in reserve`, { size: 12, ox: 0.5, color: T().css.inkDim });
    }
  }

  // ------------------------------------------------------------ main loop
  loop() {
    if (this.ended) return;
    const st = this.st();
    this.drainEvents(() => {
      if (st.over) { this.finish(); return; }
      const t = ADV.Combat.currentTurn(st);
      if (!t) { this.finish(); return; }
      this.refreshStrip();
      this.refreshIntents();
      const takeTurn = () => {
        if (this.ended) return;
        if (t.isPlayer) {
          if (!this._autoHalted && this.queuePlayerAuto(t.unit)) return;
          this.showActionBar(t.unit);
        } else {
          const go = () => {
            if (this.ended) return;
            ADV.Combat.aiTakeTurn(st, t.unit);
            ADV.Combat.advance(st);
            this.loop();
          };
          if (ADV.Prefs && ADV.Prefs.pauseEnemy()) this.showEnemyHold(t.unit, go);
          else this.time.delayedCall(this.autoGap(160), go);
        }
      };
      this.tryHatredRemark(t.unit, takeTurn);
    });
  }

  playerAutoArmed() {
    const p = ADV.Game.player(this.game_);
    return !!(p && ADV.Combat.autoList && ADV.Combat.autoList(p).length);
  }

  autoGap(base) {
    return this.playerAutoArmed() ? (base + AUTO_PACE_PAD_MS) : base;
  }

  wantsCombatHatred() {
    if (this.mode === 'assassination' || this.mode === 'ambush') return true;
    const q = this.game_ && this.game_.quest;
    if (!q) return false;
    if (q.rivalFight) return true;
    const quest = q.quest;
    if (quest && (quest.godLine || quest.war || quest.isBoss || quest.special || quest.monsterBoss)) return true;
    const st = this.st && this.st();
    if (st && (st.units || []).some(u => u.ch && u.ch.boss && u.side === 'b' && !u.downed)) return true;
    return false;
  }

  tryHatredRemark(acting, then) {
    if (!this.wantsCombatHatred()) { then(); return; }
    const st = this.st();
    const speaker = ADV.Combat.hatredRemarkDue(st, { acting, foeSide: 'b' });
    if (!speaker) { then(); return; }
    ADV.Combat.noteHatredRemark(st, speaker.ch);
    const voId = speaker.ch.enemyTypeId;
    const pack = voId && ADV.DATA.MONSTER_VO && ADV.DATA.MONSTER_VO[voId];
    if (pack && pack.roar && pack.roar.length) {
      const line = pack.roar[0];
      const text = line.t || line;
      if (ADV.Music) ADV.Music.speakCampaign(voId, 'roar', 1);
      if (ADV.DialogueBox) {
        ADV.DialogueBox.showText(this, this.game_, speaker.ch, text, then);
        return;
      }
    }
    const godId = speaker.ch.campaignId;
    const godLines = godId && ADV.DATA.GOD_LINE_HATRED && ADV.DATA.GOD_LINE_HATRED[godId];
    if (godLines && ADV.CampaignUI && ADV.CampaignUI.playBeats) {
      ADV.CampaignUI.playBeats(this, this.game_, [{ who: godId, key: 'hatred', lines: godLines.slice(0, 1) }], then);
      return;
    }
    if (!ADV.DialogueBox) { then(); return; }
    const ctx = ADV.DialogueBox.ctxFor
      ? ADV.DialogueBox.ctxFor(this.game_, speaker.ch, { target: ADV.Game.player(this.game_).name })
      : {};
    let started = false;
    const done = () => { if (started) return; started = true; then(); };
    const box = ADV.DialogueBox.show(this, this.game_, speaker.ch, 'hatred', ctx, done);
    if (!box) done();
  }

  // animate events appended since eventCursor, then cb
  drainEvents(cb) {
    const st = this.st();
    const evs = st.events.slice(this.eventCursor);
    this.eventCursor = st.events.length;
    let i = 0;
    const step = () => {
      if (i >= evs.length) { for (const v of this.unitViews.values()) this.redrawUnit(v); this.updateReserveCounters(); cb(); return; }
      const e = evs[i++];
      const d = this.animateEvent(e);
      if (typeof d === 'function') d(step);          // blocking beats (campaign lines)
      else this.time.delayedCall(d, step);
    };
    step();
  }

  view(uid) { return this.unitViews.get(uid); }

  animateEvent(e) {
    const st = this.st();
    const V = ADV.VFX;
    const v = e.uid ? this.view(e.uid) : null;
    switch (e.t) {
      case 'round': {
        this.refreshStrip();
        // campaign banter (§8): one line from a present companion, round 2
        const b = ADV.Campaign && ADV.CampaignUI && this.mode === 'quest' ? ADV.Campaign.banter(this.game_, st, e.n) : null;
        if (b) return (next) => ADV.CampaignUI.playBeat(this, this.game_, { who: b.who, key: b.key, lines: [b.line] }, next);
        return 30;
      }
      case 'reinforce': {
        const u = st.units.find(x => x.uid === e.uid);
        if (u && !this.unitViews.has(e.uid)) this.makeUnitView(u);
        const nv = this.view(e.uid);
        if (nv) { ADV.VFX.damageNumber(this, nv.x, nv.y - 40, 'RISEN', '#9a70c0'); ADV.VFX.flashOverlay(this, 0x2a3a3a, 0.4); }
        // something stood up: everyone on the other side is startled
        if (u) for (const o of this.unitViews.values()) if (o.u.side !== u.side && !o.u.downed) this.reactAt(o, 'surprised', { ms: 500, intensity: 0.8 });
        return 400;
      }
      case 'campaignExit': {
        // companions walk off instead of dying (§5a): fade, then their line
        if (v) { this.tweens.add({ targets: [v.img, v.frame, v.name], alpha: 0.12, duration: 350 }); v.hpBar.setAlpha(0.12); v.intent.setAlpha(0.12); }
        const def = ADV.DATA.CAMPAIGN_CHARS[v && v.u.ch.campaignId];
        const lines = def && def.exitLines ? def.exitLines : null;
        const l = ADV.Game.prompt(this.game_, 'firstCampaignExit');
        if (l) ADV.Notices.toast(this, l);
        if (!lines || v.u.side !== 'a') return 400;
        const line = lines[Math.floor(Math.random() * lines.length)];
        const idx = lines.indexOf(line) + 1;
        return (next) => { if (ADV.Music) ADV.Music.speakCampaign(v.u.ch.campaignId, 'exit', idx); ADV.DialogueBox.showText(this, this.game_, v.u.ch, line, next); };
      }
      case 'witness': {
        // The hook of the whole game: you learn by being shown. Hold the frame,
        // ring the teacher in gold, and say it plainly.
        const sk = ADV.DATA.SKILLS[e.skillId];
        const tv = e.uid ? this.view(e.uid) : null;
        const label = (sk && sk.name) || e.skillId;
        return (next) => {
          if (tv) {
            V.tintFlash(this, tv.img, 0xd4a94e);
            const ring = this.add.rectangle(tv.x, tv.y, tv.img.displayWidth + 14, tv.img.displayHeight + 14)
              .setStrokeStyle(3, T().c.gold, 1).setFillStyle(0, 0).setDepth(560);
            this.tweens.add({ targets: ring, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 620,
              onComplete: () => ring.destroy() });
          }
          const W = T().W, H = T().H;
          const band = this.add.rectangle(W / 2, H / 2 - 40, W, 92, 0x0c0a08, 0.72).setDepth(700).setAlpha(0);
          const big = T().text(this, W / 2, H / 2 - 58, label,
            { size: 30, display: true, ox: 0.5, oy: 0.5, color: T().css.gold }).setDepth(701).setAlpha(0);
          const sub = T().text(this, W / 2, H / 2 - 22, 'You have seen this.',
            { size: 15, ox: 0.5, oy: 0.5, italic: true, color: T().css.ink }).setDepth(701).setAlpha(0);
          const parts = [band, big, sub];
          // hit-stop: hold everything for a beat so the moment registers
          this.tweens.add({ targets: parts, alpha: 1, duration: 90 });
          V.camShake(this, 0.004);
          this.time.delayedCall(900, () => {
            this.tweens.add({ targets: parts, alpha: 0, duration: 260,
              onComplete: () => { parts.forEach(o => { try { o.destroy(); } catch (err) {} }); next(); } });
          });
        };
      }
      case 'skip': {
        if (v) V.damageNumber(this, v.x, v.y - 30, e.reason === 'frozen' ? 'frozen!' : 'bound!', '#6fc0e8');
        return 200;
      }
      case 'hold': { if (v) V.damageNumber(this, v.x, v.y - 30, 'waiting', '#a89a7c'); return 160; }
      case 'bribe': {
        const tv = e.target ? this.view(e.target) : null;
        if (tv) V.damageNumber(this, tv.x, tv.y - 30, e.success ? `bought off (${e.fee}g)` : `kept the ${e.fee}g anyway`, '#d4a94e');
        return 300;
      }
      case 'freed': { if (v) V.damageNumber(this, v.x, v.y - 30, 'freed!', '#83b56b'); return 260; }
      case 'unraise': { if (v) { V.healSparkle(this, v.x, v.y); V.damageNumber(this, v.x, v.y - 34, 'RESTORED TO LIFE', '#f4eee0'); } return 400; }
      case 'cleansed': { if (v) { V.healSparkle(this, v.x, v.y); if (e.purified) V.damageNumber(this, v.x, v.y - 30, 'purified', '#f4eee0'); this.redrawUnit(v); } return 200; }
      case 'sealedBlock': return 10;
      case 'use': {
        const src = this.view(e.uid);
        if (!src) return 10;
        const dir = src.u.side === 'a' ? 1 : -1;
        const tgt = e.target ? this.view(e.target) : null;
        if (ADV.Portraits.look) {
          if (tgt && tgt !== src) ADV.Portraits.look(this, src.img, src.u.ch, src.img.texture.key, Math.sign(tgt.x - src.x) * 0.9, Math.sign(tgt.y - src.y) * 0.4, 220);
          for (const o of this.unitViews.values()) if (o !== src && !o.u.downed && Math.random() < 0.6) ADV.Portraits.look(this, o.img, o.u.ch, o.img.texture.key, Math.sign(src.x - o.x) * 0.7, 0, 260);
        }
        const lbl = T().text(this, src.x, src.y - 78, e.name, { size: 12, ox: 0.5, color: T().css.gold })
          .setDepth(600).setAlpha(0.95);
        this.tweens.add({ targets: lbl, y: lbl.y - 16, alpha: 0, delay: 350, duration: 400, onComplete: () => lbl.destroy() });
        if (ADV.SpellFX && ADV.SpellFX.has(e.skillId, e.tier)) {
          return ADV.SpellFX.play(this, { skillId: e.skillId, tier: e.tier, src, tgt, dir, name: e.name });
        }
        if (tgt && tgt.u.side !== src.u.side) {
          if (V.isProjectile(e.skillId)) V.projectile(this, src.x, src.y, tgt.x, tgt.y, V.skillColor(e.skillId));
          else { V.lunge(this, src.img, dir); V.slashArc(this, tgt.x, tgt.y, V.skillColor(e.skillId)); }
        } else {
          V.aura(this, src.x, src.y, e.skillId && ADV.DATA.SKILLS[e.skillId] && ADV.DATA.SKILLS[e.skillId].heal ? 0x83b56b : 0x6fa0bf);
        }
        return 240;
      }
      case 'damage': {
        if (!v) return 10;
        const color = e.tag === 'reflect' ? '#d4a94e' : e.tag === 'retaliation' ? '#9a70c0' : e.tag === 'dot' ? '#83b56b' : '#f4eee0';
        V.damageNumber(this, v.x + (Math.random() * 20 - 10), v.y - 30, e.dmg, color);
        const frac = e.dmg / Math.max(1, v.u.maxHp || 40);
        if (e.tag === 'dot' && ADV.SpellFX) {
          ADV.SpellFX.tick(this, v, e);
          this.reactAt(v, 'pain', { ms: 400, intensity: Math.min(0.6, 0.2 + frac * 2) });
          this.redrawUnit(v);
          return 140;
        }
        V.recoil(this, v.img, v.u.side === 'a' ? 1 : -1);
        V.tintFlash(this, v.img, 0xff6655);
        const heavy = e.tag !== 'dot' && e.dmg >= Math.max(12, (v.u.maxHp || 40) * 0.18);
        // the face flinches in proportion; a heavy blow also turns the head and leaves a mark
        this.reactAt(v, 'pain', { ms: heavy ? 900 : 600, intensity: Math.min(1, 0.4 + frac * 2) });
        if (heavy) { ADV.Portraits.motion(this, v.img, 'recoil', { side: v.u.side === 'a' ? -1 : 1, amount: 1 }); if (frac >= 0.28) v.u.__wound = true; }
        // the attacker enjoys it — or grins, if that is who they are
        const by = e.by ? this.view(e.by) : null;
        if (by && by.u.side !== v.u.side && heavy) this.reactAt(by, this.laughsAtKills(by.u.ch) ? 'laughing' : 'smug', { ms: 500, intensity: 0.6 });
        this.redrawUnit(v);
        if (heavy && V.hitStop) V.hitStop(this, 60);
        return heavy ? 210 : 150;
      }
      case 'heal': {
        if (v && e.tick) {
          // a regeneration / druid tick: a couple of crosses and the number, no ceremony
          if (V.healCrosses) V.healCrosses(this, v.x, v.y, 'basic', { w: v.img.displayWidth * 0.6, h: v.img.displayHeight * 0.6, druid: !!(e.by && this.view(e.by) && this.isDruidUnit(this.view(e.by).u)) });
          V.damageNumber(this, v.x, v.y - 20, '+' + e.amount, '#83b56b');
          this.redrawUnit(v);
          return 120;
        }
        if (v) {
          const frac = e.amount / Math.max(1, v.u.maxHp || 40);
          const tier = frac >= 1.2 ? 'advanced' : frac >= 0.8 ? 'intermediate' : 'basic';
          const by = e.by ? this.view(e.by) : null;
          const druid = !!(by && this.isDruidUnit(by.u));
          const ms = V.healCrosses ? V.healCrosses(this, v.x, v.y, tier, { w: v.img.displayWidth, h: v.img.displayHeight, druid }) : 0;
          this.time.delayedCall(ms, () => { if (v.img && v.img.active) V.damageNumber(this, v.x, v.y - 20, '+' + e.amount, '#83b56b'); });
          if (!V.healCrosses) { V.healSparkle(this, v.x, v.y); V.damageNumber(this, v.x, v.y - 20, '+' + e.amount, '#83b56b'); }
          this.reactAt(v, 'content', { ms: 600, intensity: 0.9 });
          if (by && by !== v && this.isKin(by.u.ch, v.u.ch)) { this.reactAt(by, 'tender', { ms: 700, intensity: 0.8 }); this.reactAt(v, 'tender', { ms: 700, intensity: 0.6 }); }
          this.redrawUnit(v);
          return tier === 'advanced' ? 260 : 180;
        }
        return 140;
      }
      case 'down': {
        if (v) {
          V.shake(this, v.img); this.redrawUnit(v); V.camShake(this, 0.004);
          ADV.Portraits.motion(this, v.img, 'slump');
          // the field reacts: allies flinch, kin grieve, the killer savours it
          for (const o of this.unitViews.values()) {
            if (o === v || o.u.downed || o.u.fled) continue;
            if (o.u.side === v.u.side) this.reactAt(o, this.isKin(o.u.ch, v.u.ch) ? 'grief' : 'afraid', { ms: this.isKin(o.u.ch, v.u.ch) ? 1400 : 800, intensity: this.isKin(o.u.ch, v.u.ch) ? 1 : 0.5 });
          }
          const by = e.by ? this.view(e.by) : null;
          if (by && by.u.side !== v.u.side) this.reactAt(by, this.laughsAtKills(by.u.ch) ? 'laughing' : 'smug', { ms: 900, intensity: 0.9 });
        }
        return 220;
      }
      case 'npcSmite': {
        const by = e.by ? this.view(e.by) : null;
        const speakerCh = by && by.u ? by.u.ch : null;
        const victim = (this.view(e.uid) && this.view(e.uid).u && this.view(e.uid).u.ch.name) || 'you';
        return (next) => {
          if (speakerCh && ADV.DialogueBox) {
            const ctx = ADV.DialogueBox.ctxFor
              ? ADV.DialogueBox.ctxFor(this.game_, speakerCh, { target: victim })
              : { target: victim };
            let started = false;
            const done = () => { if (started) return; started = true; next(); };
            const box = ADV.DialogueBox.show(this, this.game_, speakerCh, 'hatred', ctx, done);
            if (!box) {
              ADV.DialogueBox.showText(this, this.game_, speakerCh, 'Judgment.', done);
            }
            return;
          }
          next();
        };
      }
      case 'godJudgment': {
        const victim = e.targetName || 'you';
        const godId = e.who;
        const smite = godId && ADV.DATA.GOD_LINE_SMITE && ADV.DATA.GOD_LINE_SMITE[godId];
        const by = e.by ? this.view(e.by) : null;
        const speakerCh = by && by.u ? by.u.ch : null;
        return (next) => {
          if (smite && ADV.CampaignUI && ADV.CampaignUI.playBeats) {
            const lines = smite.slice(0, 1).map(line => Object.assign({}, line, {
              t: String(line.t).replace(/\{target\}/g, victim),
            }));
            ADV.CampaignUI.playBeats(this, this.game_, [{ who: godId, key: 'smite', lines }], next);
            return;
          }
          if (speakerCh && ADV.DialogueBox) {
            const ctx = ADV.DialogueBox.ctxFor
              ? ADV.DialogueBox.ctxFor(this.game_, speakerCh, { target: victim })
              : { target: victim };
            let started = false;
            const done = () => { if (started) return; started = true; next(); };
            const box = ADV.DialogueBox.show(this, this.game_, speakerCh, 'hatred', ctx, done);
            if (!box) done();
            return;
          }
          next();
        };
      }
      case 'execute': {
        if (v) {
          V.scalePunch(this, v.img); V.camShake(this, 0.008); V.flashOverlay(this, 0xa8352c);
          this.reactAt(v, 'surprised', { ms: 200, intensity: 1 });
          this.reactAt(v, 'pain', { ms: 900, intensity: 1 });
          v.u.__wound = true;
          this.cameraPunch();
          const by = e.by ? this.view(e.by) : null;
          if (by) this.reactAt(by, this.laughsAtKills(by.u.ch) ? 'laughing' : 'smug', { ms: 900, intensity: 1 });
          this.redrawUnit(v);
        }
        return 260;
      }
      case 'evade': {
        if (v) { V.damageNumber(this, v.x, v.y - 30, 'miss', '#a89a7c'); this.reactAt(v, 'smug', { ms: 450, intensity: 0.5 }); }
        const by = e.by ? this.view(e.by) : null;
        if (by) this.reactAt(by, 'angry', { ms: 500, intensity: 0.5 });
        return 100;
      }
      case 'counter': { if (v) V.damageNumber(this, v.x, v.y - 30, 'counter!', '#6fa0bf'); return 140; }
      case 'ward': { if (v) V.damageNumber(this, v.x, v.y - 30, 'blocked', '#d4a94e'); return 100; }
      case 'status': { if (v) this.redrawUnit(v); return 60; }
      case 'taunted': { if (v) { V.damageNumber(this, v.x, v.y - 30, 'taunted', '#9a70c0'); this.reactAt(v, 'furious', { ms: 700, intensity: 1 }); this.redrawUnit(v); } return 90; }
      case 'sundered': { if (v) V.damageNumber(this, v.x, v.y - 30, 'armor torn', '#d4a94e'); return 100; }
      case 'flee': {
        if (v) { this.reactAt(v, 'afraid', { ms: 900, intensity: 1 }); if (e.success) { this.tweens.add({ targets: v.img, alpha: 0.15, x: v.x + (v.u.side === 'a' ? -60 : 60), duration: 300 }); } else V.damageNumber(this, v.x, v.y - 30, 'cornered!', '#d8574a'); }
        const l = ADV.Game.prompt(this.game_, 'firstFlee');
        if (l) ADV.Notices.toast(this, l);
        return 260;
      }
      case 'levelUp': {
        if (v && v.u.ch.isPlayer) {
          const sk = ADV.DATA.SKILLS[e.skillId];
          const tname = sk.tiers[e.tier].name;
          ADV.Notices.toast(this, `${sk.name} rises to L${e.level}${e.tier !== 'basic' ? ' — it is ' + tname + ' now' : ''}`);
          const l = ADV.Game.prompt(this.game_, 'firstSkillLevel');
          if (l) this.time.delayedCall(400, () => ADV.Notices.toast(this, l));
        }
        return 60;
      }
      case 'reserveIn': {
        const u = st.units.find(x => x.uid === e.uid);
        if (u && !this.unitViews.has(e.uid)) this.makeUnitView(u);
        return 160;
      }
      case 'revive': {
        if (!v) return 200;
        v.img.clearTint(); v.frame.setAlpha(1); v.name.setAlpha(1);
        const by = e.by ? this.view(e.by) : null;
        if (e.arch === 'healer') {
          // white flash, the wings unfold (the `wings` status mark draws them), crosses, faces
          V.flashOverlay(this, 0xffffff, 0.25);
          if (V.hitStop) V.hitStop(this, 40);
          if (V.healCrosses) V.healCrosses(this, v.x, v.y, 'advanced', { w: v.img.displayWidth, h: v.img.displayHeight });
          this.reactAt(v, 'surprised', { ms: 400, intensity: 1 });
          this.time.delayedCall(450, () => this.reactAt(v, 'content', { ms: 900, intensity: 0.9 }));
          if (by) this.reactAt(by, 'tender', { ms: 900, intensity: 1 });
        } else if (e.arch === 'druid') {
          // the grove grows (the `grove` status mark), the risen comes round slowly
          if (V.lightField) V.lightField(this, v.x, v.y, 0x2fbf71, 120, 600);
          this.reactAt(v, 'dazed', { ms: 500, intensity: 1 });
          this.time.delayedCall(550, () => this.reactAt(v, 'content', { ms: 800, intensity: 0.7 }));
          if (by) this.reactAt(by, 'resolve', { ms: 900, intensity: 0.9 });
        } else ADV.VFX.healSparkle(this, v.x, v.y);
        this.redrawUnit(v);
        return e.arch ? 520 : 200;
      }
      // the reviver's word over the one they brought back (B4 / C4): a short, blocking beat
      case 'line': {
        if (!v || !ADV.DialogueBox || !ADV.DialogueBox.showText) return 10;
        const raw = e.tag ? '[' + e.tag + '] ' + e.text : e.text;
        return (next) => {
          let done = false; const go = () => { if (!done) { done = true; next(); } };
          try {
            const closer = ADV.DialogueBox.showText(this, this.game_, v.u.ch, e.text, go, { raw });
            this.time.delayedCall(1600, () => { try { if (closer && closer.close) closer.close(); } catch (err) {} go(); });
          } catch (err) { go(); }
        };
      }
      // C1: the beast where the portrait was, then whatever the skill does
      case 'shapeshift': {
        if (!v) return 10;
        const key = this.unitKey(v.u);
        const ms = V.transform ? V.transform(this, v, key) : 0;
        if (!V.transform) { try { v.img.setTexture(key); } catch (err) {} }
        this.reactAt(v, 'furious', { ms: 900, intensity: 1 });
        for (const o of this.unitViews.values()) if (o !== v && !o.u.downed && o.u.side !== v.u.side) this.reactAt(o, 'afraid', { ms: 700, intensity: 0.6 });
        if (V.camShake) V.camShake(this, 0.004);
        return ms || 300;
      }
      case 'thornShield': { if (v) this.redrawUnit(v); return 120; }
      case 'shieldAbsorb': {
        if (v) {
          V.damageNumber(this, v.x + 20, v.y - 40, 'absorbed ' + e.absorbed, '#5d9a4a');
          const by = e.by ? this.view(e.by) : null;
          if (v.__lifeTree && v.__lifeTree.flash) v.__lifeTree.flash(by ? Math.sign(by.x - v.x) : (v.u.side === 'a' ? 1 : -1));
        }
        return 120;
      }
      case 'shieldBreak': { if (v) { V.damageNumber(this, v.x, v.y - 40, 'shield broken', '#a8352c'); this.redrawUnit(v); } return 150; }
      case 'trueRest': { if (v) { ADV.VFX.flashOverlay(this, 0xf4eee0, 0.35); this.redrawUnit(v); } return 300; }
      case 'surviveLethal': { if (v) ADV.VFX.damageNumber(this, v.x, v.y - 30, 'refuses to fall', '#83b56b'); return 200; }
      case 'permGain': { if (v) ADV.VFX.damageNumber(this, v.x, v.y - 40, '+1 ALL', '#9a70c0'); return 160; }
      case 'immune': { if (v) ADV.VFX.damageNumber(this, v.x, v.y - 30, 'immune', '#9a70c0'); return 90; }
      case 'end': return 200;
      case 'survivalGrowth': { if (v) V.damageNumber(this, v.x, v.y - 44, `+${e.gain} MAX HP (${e.total})`, '#83b56b'); return 240; }
      case 'extraTurn': { if (v) V.damageNumber(this, v.x, v.y - 40, 'storm speed — again!', '#6fc0e8'); return 260; }
      case 'arenaChampion': { if (v) { V.scalePunch(this, v.img); V.damageNumber(this, v.x, v.y - 44, `ARENA CHAMPION ×${e.stacks}`, '#d4a94e'); this.redrawUnit(v); } return 320; }
      case 'poisonHop': {
        const dest = e.to ? this.view(e.to) : null;
        if (v) V.damageNumber(this, v.x, v.y - 30, 'poison leaps', '#5d8a4a');
        if (dest) {
          V.damageNumber(this, dest.x, dest.y - 30, 'caught it', '#5d8a4a');
          this.redrawUnit(dest);
        }
        return 180;
      }
      default: return 10;
    }
  }

  // ------------------------------------------------------------ player turn
  clearActionBar() {
    if (this.autoTimer) { try { this.autoTimer.remove(false); } catch (e) {} this.autoTimer = null; }
    for (const o of this.actionObjs) { try { o.destroy(); } catch (e) {} }
    this.actionObjs = [];
    this.targeting = null;
  }

  autoSkillName(u, action) {
    if (action.isAttack) return 'Attack';
    const m = ADV.Combat.manifestFor(u, action.skillId);
    if (!m) return action.skillId;
    if (action.off && m.data.offensive) return m.data.offensive.name;
    return m.data.name;
  }

  queuePlayerAuto(u) {
    if (this._autoPaused) { this._autoPaused = false; return false; }
    const ready = ADV.Combat.autoReadyAction(this.st(), u);
    if (ready) {
      this.showAutoStrip(u, ready);
      this.autoTimer = this.time.delayedCall(this.autoGap(360), () => {
        this.autoTimer = null;
        if (this.ended) return;
        this.commitAction(u, ready.action, ready.tgt);
      });
      return true;
    }
    if (!ADV.Combat.ensureAutoRepeat(u.ch)) return false;
    // Rotation is armed but nothing in it can fire. If the player still has a
    // legal skill, hand the turn back so they can pick. Only auto-wait when
    // the field itself is empty (smoke, stealth, no reach).
    if (ADV.Combat.hasLegalCombatAction(this.st(), u)) return false;
    this.showAutoWaitStrip(u);
    this.autoTimer = this.time.delayedCall(this.autoGap(360), () => {
      this.autoTimer = null;
      if (this.ended) return;
      const again = ADV.Combat.autoReadyAction(this.st(), u);
      if (again) { this.commitAction(u, again.action, again.tgt); return; }
      this.commitHold(u);
    });
    return true;
  }

  autoRotationLabel(u) {
    const list = ADV.Combat.autoList(u.ch);
    return list.map(r => this.autoSkillName(u, { skillId: r.skillId, off: r.off, isAttack: r.skillId === 'basic_attack' })).join(' → ') || 'none';
  }

  // One reserved top-right column for fight options. Fullscreen used to sit
  // on the same origin as Enemy turn, so the button ate the label.
  hudChrome() {
    const w = 188, h = 34, gap = 8, y0 = 10;
    const x = T().W - w - 12;
    return { x, w, h, gap, y0, left: x - gap - w };
  }

  paintHudChrome() {
    this.paintEnemyHoldToggle();
    this.paintAutoHaltToggle();
    this.paintFullscreenToggle();
  }

  paintEnemyHoldToggle() {
    const box = this.hudChrome();
    if (this._enemyHoldBtn) {
      try { this._enemyHoldBtn.destroy(); } catch (e) {}
      this._enemyHoldBtn = null;
    }
    const on = !!(ADV.Prefs && ADV.Prefs.pauseEnemy());
    const b = T().button(this, box.x, box.y0, box.w, box.h, on ? 'Enemy turn: hold' : 'Enemy turn: auto', () => {
      ADV.Prefs.setPauseEnemy(!on);
      this.paintEnemyHoldToggle();
    }, { size: 12, fill: on ? 0x2a3a22 : undefined, color: on ? T().css.gold : T().css.inkDim, edge: on ? T().c.gold : undefined });
    this._enemyHoldBtn = b;
  }

  paintAutoHaltToggle() {
    const box = this.hudChrome();
    if (this._autoHaltBtn) {
      try { this._autoHaltBtn.destroy(); } catch (e) {}
      this._autoHaltBtn = null;
    }
    const halted = !!this._autoHalted;
    const b = T().button(this, box.x, box.y0 + box.h + box.gap, box.w, box.h, halted ? 'Skills auto: off' : 'Skills auto: on', () => {
      this._autoHalted = !this._autoHalted;
      if (this._autoHalted && this.autoTimer) {
        try { this.autoTimer.remove(false); } catch (e) {}
        this.autoTimer = null;
        const t = ADV.Combat.currentTurn(this.st());
        if (t && t.isPlayer) this.showActionBar(t.unit);
      }
      this.paintAutoHaltToggle();
    }, { size: 12, fill: halted ? 0x3a2218 : 0x2a3a22, color: halted ? T().css.blood : T().css.green, edge: halted ? T().c.blood : T().c.green });
    this._autoHaltBtn = b;
  }

  paintFullscreenToggle() {
    if (this._fsBtn) {
      try { this._fsBtn.destroy(); } catch (e) {}
      this._fsBtn = null;
    }
    if (!ADV.Display) return;
    const box = this.hudChrome();
    const full = !!ADV.Display.active();
    const b = T().button(this, box.left, box.y0, box.w, box.h, ADV.Display.label(), () => {
      ADV.Display.toggle();
    }, { size: 12, bold: true, color: T().css.gold, edge: T().c.gold, fill: full ? 0x2a3a22 : 0x2b261f });
    ADV.Display.watch((s) => { try { if (b.txt && b.txt.active) b.txt.setText(s); } catch (e) {} });
    this._fsBtn = b;
  }

  showEnemyHold(u, go) {
    this.clearActionBar();
    const W = T().W, H = T().H;
    const keep = o => { this.actionObjs.push(o); return o; };
    const intent = (u.planned && u.planned.label) || 'act';
    keep(T().panel(this, 40, H - 110, W - 80, 96));
    keep(T().text(this, 56, H - 88, (u.ch.name || 'Enemy') + ' is about to ' + intent, { size: 16, color: T().css.gold }));
    keep(T().text(this, 56, H - 62, 'Enemy auto is off. Continue when you have read the field.', { size: 12, color: T().css.inkDim, wrap: W - 280 }));
    const goBtn = T().button(this, W - 360, H - 86, 140, 60, 'Continue', go, { size: 15, color: T().css.gold });
    const play = T().button(this, W - 200, H - 86, 140, 60, 'Auto enemy', () => {
      ADV.Prefs.setPauseEnemy(false);
      this.paintEnemyHoldToggle();
      go();
    }, { size: 13, sub: 'let them play' });
    for (const b of [goBtn, play]) { keep(b.g); keep(b.txt); if (b.sub) keep(b.sub); keep(b.zone); }
  }

  showAutoStrip(u, ready) {
    this.clearActionBar();
    const W = T().W, H = T().H;
    const keep = o => { this.actionObjs.push(o); return o; };
    const name = this.autoSkillName(u, ready.action);
    const rot = this.autoRotationLabel(u);
    keep(T().panel(this, 40, H - 110, W - 80, 96));
    keep(T().text(this, 56, H - 88, 'AUTO · ' + name, { size: 16, color: T().css.green }));
    keep(T().text(this, 56, H - 62, 'Rotation: ' + rot + '. Weakest target each swing.', { size: 12, color: T().css.inkDim, wrap: W - 360 }));
    const stop = T().button(this, W - 348, H - 86, 128, 60, 'PAUSE', () => {
      this._autoPaused = true;
      this.showActionBar(u);
    }, { size: 13, color: T().css.gold, sub: 'keep rotation' });
    const wipe = T().button(this, W - 200, H - 86, 128, 60, 'CLEAR', () => {
      ADV.Combat.clearAutoFlags(u.ch);
      ADV.Save.saveGame(this.game_);
      this.showActionBar(u);
    }, { size: 13, color: T().css.inkDim, sub: 'end auto' });
    for (const b of [stop, wipe]) { keep(b.g); keep(b.txt); if (b.sub) keep(b.sub); keep(b.zone); }
  }

  showAutoWaitStrip(u) {
    this.clearActionBar();
    const W = T().W, H = T().H;
    const keep = o => { this.actionObjs.push(o); return o; };
    keep(T().panel(this, 40, H - 110, W - 80, 96));
    keep(T().text(this, 56, H - 88, 'AUTO · waiting', { size: 16, color: T().css.green }));
    keep(T().text(this, 56, H - 62, 'No target right now (smoke, stealth, or out of reach). Auto will swing when one appears.', { size: 12, color: T().css.inkDim, wrap: W - 360 }));
    const stop = T().button(this, W - 348, H - 86, 128, 60, 'PAUSE', () => {
      this._autoPaused = true;
      this.showActionBar(u);
    }, { size: 13, color: T().css.gold, sub: 'pick yourself' });
    const wipe = T().button(this, W - 200, H - 86, 128, 60, 'CLEAR', () => {
      ADV.Combat.clearAutoFlags(u.ch);
      ADV.Save.saveGame(this.game_);
      this.showActionBar(u);
    }, { size: 13, color: T().css.inkDim, sub: 'end auto' });
    for (const b of [stop, wipe]) { keep(b.g); keep(b.txt); if (b.sub) keep(b.sub); keep(b.zone); }
  }

  showActionBar(u) {
    this.clearActionBar();
    const st = this.st();
    const W = T().W, H = T().H;
    const keep = o => { this.actionObjs.push(o); return o; };
    keep(T().panel(this, 40, H - 110, W - 80, 96));
    const rot = ADV.Combat.autoList(u.ch);
    keep(T().text(this, 56, H - 104, rot.length ? ('AUTO · ' + this.autoRotationLabel(u)) : 'Your move', { size: 12, color: T().css.gold }));
    let x = 56;
    const mkBtn = (label, sub, fn, disabled, tipSkillId) => {
      const w = Math.max(96, label.length * 8 + 22);
      const b = T().button(this, x, H - 86, w, 60, label, fn, { size: 13, sub, disabled });
      if (tipSkillId) ADV.Tooltip.attach(this, b.zone, () => ADV.SkillInfo.describe(u.ch, tipSkillId));
      keep(b.g); keep(b.txt); if (b.sub) keep(b.sub); keep(b.zone);
      x += w + 8;
    };
    const seal = u.statuses.find(x => x.kind === 'sealed');
    const actions = [];
    for (const e of u.ch.actives) {
      const sk = ADV.DATA.SKILLS[e.skillId];
      if (!sk || sk.target === 'postVictory') continue;
      const m = ADV.Combat.manifestFor(u, e.skillId);
      if (m && m.data.selfRevive) continue;
      const sealed = !!(seal && (seal.tiers || []).includes(m.tier));
      const cd = ADV.Combat.cooldownLeft ? ADV.Combat.cooldownLeft(u, e.skillId) : 0;
      const pool = sealed || cd > 0 ? [] : ADV.Combat.validTargets(st, u, e.skillId, false);
      const stance = m.data.freeBuff
        ? (u.statuses.some(s => s.kind === 'beastShape') ? 'UP · free' : 'free')
        : ('L' + e.level);
      actions.push({ label: m.data.name, sub: sealed ? 'SEALED' : cd > 0 ? ('recovering · ' + cd) : stance, skillId: e.skillId, off: false, pool });
      if (m.data.offensive) {
        const opool = sealed ? [] : ADV.Combat.validTargets(st, u, e.skillId, true);
        actions.push({ label: m.data.offensive.name, sub: sealed ? 'SEALED' : 'hostile', skillId: e.skillId, off: true, pool: opool });
      }
    }
    // Charm's bribe: buy off hostile named enemies (request 6)
    const offers = {};
    for (const foe of ADV.Combat.living(st, u.side === 'a' ? 'b' : 'a')) {
      const offer = ADV.Game.bribeOffer(this.game_, foe.ch);
      if (offer && (u.ch.inventory.gold || 0) >= offer.fee) offers[foe.uid] = offer;
    }
    const bribePool = Object.keys(offers).map(uid => st.units.find(x => x.uid === uid));
    if (bribePool.length) {
      actions.push({ label: 'Bribe', sub: 'gold buys peace', isBribe: true, offers, pool: bribePool });
    }
    const basicPool = ADV.Combat.validTargets(st, u, 'basic_attack', false);
    actions.push({ label: 'Attack', sub: 'always', skillId: 'basic_attack', off: false, pool: basicPool, isAttack: true });
    for (const a of actions) {
      const autoable = !a.isBribe && ADV.Combat.skillNeedsAuto(u.ch, a.skillId, a.off);
      const autoOn = autoable && ADV.Combat.skillAutoOn(u.ch, a.skillId, a.off);
      const conscriptDry = a.skillId === 'conscript' && !a.pool.length;
      const sub = conscriptDry ? 'guild NPC under 60%' : (autoOn ? (a.sub + ' · AUTO') : a.sub);
      mkBtn(a.label, sub, () => {
        if (!a.pool.length) {
          if (a.skillId === 'conscript') ADV.Notices.toast(this, 'Conscript only works on a living guild member below 60% health — not monsters.');
          return;
        }
        this.beginTargeting(u, a);
      }, conscriptDry ? false : !a.pool.length, a.skillId);
      if (autoable) {
        const on = autoOn;
        const ab = T().button(this, x, H - 86, 40, 60, 'AUTO', () => this.toggleSkillAuto(u, a), {
          size: 10, sub: on ? 'on' : 'off',
          fill: on ? 0x2a3a22 : undefined,
          color: on ? T().css.green : T().css.inkDim,
          edge: on ? T().c.green : undefined,
        });
        keep(ab.g); keep(ab.txt); if (ab.sub) keep(ab.sub); keep(ab.zone);
        ADV.Tooltip.attach(this, ab.zone, () => {
          const heal = !a.off && ADV.DATA.SKILLS[a.skillId] && ADV.DATA.SKILLS[a.skillId].heal;
          return on
            ? 'This skill is in the auto rotation. Tap AUTO off to drop it; the others keep going.'
            : (heal
              ? 'Add this heal to the auto rotation. Combat walks your auto skills in order and skips a heal nobody needs.'
              : 'Add this skill to the auto rotation. Combat walks them in order and skips one that cannot fire.');
        });
        x += 48;
      }
    }

    if (rot.length) {
      mkBtn('GO', 'auto next', () => {
        const ready = ADV.Combat.autoReadyAction(this.st(), u);
        if (ready) this.commitAction(u, ready.action, ready.tgt);
        else ADV.Notices.toast(this, 'Nothing in the rotation can fire — pick a skill.');
      });
    }

    if (!ADV.Combat.hasLegalCombatAction(st, u)) {
      mkBtn('Wait', 'no target', () => this.commitHold(u));
    }
    mkBtn('Flee', 'costs the turn', () => {
      this.clearActionBar();
      ADV.Combat.act(st, u, { kind: 'flee' });
      ADV.Combat.advance(st);
      this.loop();
    });
  }

  commitHold(u) {
    const st = this.st();
    this.clearActionBar();
    ADV.Combat.act(st, u, { kind: 'hold' });
    ADV.Combat.advance(st);
    this.loop();
  }

  toggleSkillAuto(u, action) {
    const had = ADV.Combat.autoList(u.ch).length > 0;
    const on = !ADV.Combat.skillAutoOn(u.ch, action.skillId, action.off);
    ADV.Combat.setSkillAuto(u.ch, action.skillId, on, action.off);
    const line = ADV.Game.prompt(this.game_, 'firstSkillAuto');
    if (line) ADV.Notices.toast(this, line);
    ADV.Save.saveGame(this.game_);
    // First skill into an empty rotation starts walking. Adding more just
    // joins the list — PAUSE if you want the bar back mid-rotation.
    if (on && !had) {
      const ready = ADV.Combat.autoReadyAction(this.st(), u);
      if (ready) { this.commitAction(u, ready.action, ready.tgt); return; }
    }
    this.showActionBar(u);
  }

  beginTargeting(u, action) {
    if (!action.pool.length) return;
    if (!action.isBribe && ADV.Combat.skillAutoOn(u.ch, action.skillId, action.off)) {
      const tgt = ADV.Combat.lowestHealth(action.pool);
      if (tgt) return this.commitAction(u, action, tgt);
    }
    if (action.pool.length === 1 || (action.pool.length && action.pool[0] === u)) {
      return this.commitAction(u, action, action.pool[0]);
    }
    // highlight valid targets
    this.targeting = { u, action, marks: [] };
    for (const tgt of action.pool) {
      const v = this.view(tgt.uid);
      if (!v) continue;
      const ring = this.add.rectangle(v.x, v.y, v.img.displayWidth + 10, v.img.displayHeight + 10)
        .setStrokeStyle(3, 0xd4a94e).setFillStyle(0xd4a94e, 0.08).setDepth(700)
        .setInteractive({ useHandCursor: true });
      ring.on('pointerdown', () => this.commitAction(u, action, tgt));
      this.targeting.marks.push(ring);
      this.actionObjs.push(ring);
    }
    const cancel = T().text(this, T().W / 2, 100, 'choose a target (click elsewhere to cancel)', { size: 13, ox: 0.5, color: T().css.gold }).setDepth(700);
    this.actionObjs.push(cancel);
  }

  commitAction(u, action, tgt) {
    const st = this.st();
    this.clearActionBar();
    const act = action.isBribe
      ? Object.assign({ kind: 'bribe', targetUid: tgt.uid }, action.offers[tgt.uid])
      : action.isAttack ? { kind: 'attack', targetUid: tgt.uid }
      : { kind: 'skill', skillId: action.skillId, targetUid: tgt.uid, offensiveMode: action.off };
    const res = ADV.Combat.act(st, u, act);
    if (res && res.refund) {
      this.drainEvents(() => {
        if (!this._autoHalted && this.queuePlayerAuto(u)) return;
        this.showActionBar(u);
      });
      return;
    }
    ADV.Combat.advance(st);
    this.loop();
  }

  // ------------------------------------------------------------ end of combat
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.clearActionBar();
    const game = this.game_;
    this.time.delayedCall(400, () => {
      if (this.mode === 'quest') {
        const r = ADV.Game.finishCombat(game);
        if (r.playerDead) { ADV.Game.onPlayerDeath(game, null); this.scene.start('Death'); return; }
        if (r.won && game.quest.defeatedNamed.length) { this.namedChoices(game.quest.defeatedNamed.filter(c => c.alive), () => this.scene.start('Quest')); return; }
        this.scene.start('Quest');
      } else if (this.mode === 'ambush') {
        const r = ADV.Game.finishAmbush(game);
        if (r.playerDead) { ADV.Game.onPlayerDeath(game, r.attacker ? r.attacker.id : null); this.scene.start('Death'); return; }
        this.namedChoices((r.defeatedNamed || []).filter(c => c.alive), () => this.scene.start('Town'));
      } else if (this.mode === 'rescue') {
        const r = ADV.Game.finishRescue(game);
        if (r.playerDead) { ADV.Game.onPlayerDeath(game, r.attacker ? r.attacker.id : null); this.scene.start('Death'); return; }
        this.namedChoices((r.defeatedNamed || []).filter(c => c.alive), () => this.scene.start('Town'));
      } else if (this.mode === 'assassination') {
        const r = ADV.Game.finishAssassination(game);
        if (r.playerDead) { ADV.Game.onPlayerDeath(game, r.target ? r.target.id : null); this.scene.start('Death'); return; }
        this.namedChoices((r.defeatedNamed || []).filter(c => c.alive), () => this.scene.start('Town'));
      }
    });
  }

  // Post-battle choices for defeated named characters (§3a): kill / KO /
  // conscript / necromancy. Conscript and raise take the whole beaten
  // field at once — one hatred line, then the next fight.
  namedChoices(list, done) {
    const game = this.game_;
    const p = ADV.Game.player(game);
    const queue = (list || []).slice();
    const next = () => {
      const c = queue.shift();
      if (!c) { ADV.Save.saveGame(game); done(); return; }
      if (!c.alive) return next();
      const many = queue.some(x => x && x.alive);
      const opts = [
        { label: 'Kill — take what they carry', value: 'kill' },
        { label: 'Knock out — hospitalized 3 quests', value: 'knockout' },
      ];
      if (ADV.SkillSys.entryFor(p, 'conscript')) opts.push({ label: many ? 'Conscript them all' : 'Conscript them', value: 'conscript' });
      if (ADV.SkillSys.entryFor(p, 'necromancy')) opts.push({ label: many ? 'Raise them all' : 'Raise them', value: 'necromancy' });
      ADV.DialogueBox.show(this, game, c, 'general', ADV.DialogueBox.ctxFor(game, c), () => {
        ADV.Notices.pickOne(this, c.name + ' is beaten', 'The choice is the victor\'s.', opts, (v) => {
          if (v === 'conscript' || v === 'necromancy') {
            const batch = [c].concat(queue.splice(0, queue.length));
            const before = (p.conscriptIds || []).slice();
            const bound = ADV.Game.resolveDefeatedNamedAll(game, batch, v);
            const speaker = bound[0] || null;
            const releasedId = v === 'conscript' ? before.find(id => (p.conscriptIds || []).indexOf(id) < 0) : null;
            const released = releasedId ? ADV.World.byId(game.world, releasedId) : null;
            if (v === 'conscript' && speaker && ADV.Cutscenes && ADV.Cutscenes.conscription) {
              ADV.Cutscenes.conscription(this, game, p, speaker, next, { released, townRemember: true, count: bound.length });
              return;
            }
            if (v === 'necromancy' && speaker && ADV.Cutscenes && ADV.Cutscenes.raising) {
              const mourners = [];
              for (const o of this.unitViews.values()) {
                if (!o.u || o.u.downed || o.u.ch === speaker) continue;
                if (this.isKin(o.u.ch, speaker)) mourners.push({ img: o.img, ch: o.u.ch });
              }
              ADV.Cutscenes.raising(this, game, p, speaker, next, { mourners, count: bound.length });
              return;
            }
            next();
            return;
          }
          const r = ADV.Game.resolveDefeatedNamed(game, c, v || 'knockout');
          if (r && r.error) { ADV.Notices.toast(this, r.error); next(); return; }
          next();
        });
      });
    };
    if (!queue.length) { done(); return; }
    next();
  }
}

ADV.CombatScene = CombatScene;
})();
