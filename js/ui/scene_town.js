// Town Hub (§8/§20): storybook menu screen. Persistent character panel on the
// left, menu column beside it, content pane on the right. No traversable map.
(function () {
'use strict';
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.game_ = this.registry.get('game');
    const W = T().W, H = T().H;
    // Phaser reuses this scene — leftover embark/talk flags would keep the
    // hub menus hidden (and the tutorial would highlight empty air).
    this._chromeHidden = 0;
    this.__embarking = false;
    this._arrivalChrome = false;
    this.clearChromeFailsafe();
    if (ADV.HousingArt) ADV.HousingArt.paint(this, ADV.Housing.of(this.player()).id);
    else this.add.rectangle(W / 2, H / 2, W, H, T().c.bg);
    this.contentObjs = [];
    this.noticeQueue = [];
    this.campaignArrivalDone = false;
    this.tutorDone = false; this.tutorObjs = [];
    ADV.Music.play('town');
    this.musicBtn = ADV.Music.button(this, W - 26, T().H - 30);

    this.buildCharacterPanel();
    this.buildMenu();
    this.openPanel('board');

    // arrival notices: jilt choice, rescues, divine offers, withdrawals, prompts
    this.queueArrivalNotices();
    // A won contract earns the walk back before the town starts talking at you.
    // The cutscene restores the chrome itself, and the guided tutorial keeps
    // the floor rather than being interrupted by it.
    const tutorRunning = ADV.Tutor && ADV.Tutor.active(this.game_);
    if (this.game_.rideHomeDue && ADV.Cutscenes && !tutorRunning) {
      this.game_.rideHomeDue = false;
      this.time.delayedCall(120, () => ADV.Cutscenes.rideHome(this, () => this.nextNotice()));
    } else {
      this.game_.rideHomeDue = false;
      this.time.delayedCall(150, () => this.nextNotice());
    }
  }

  g() { return this.game_; }
  player() { return ADV.Game.player(this.game_); }

  // ---------------------------------------------------------------- left panel
  buildCharacterPanel() {
    const p = this.player();
    const x = 16, y = 16, w = 250, h = T().H - 32;
    if (this.charObjs) this.charObjs.forEach(o => { try { o.destroy(); } catch (e) {} });
    this.charObjs = [];
    const add = (o) => { this.charObjs.push(o); return o; };
    add(T().panel(this, x, y, w, h, { alpha: T().chromeAlpha }));
    const key = ADV.Portraits.key(this, p);
    const pimg = add(this.add.image(x + w / 2, y + 92, key).setDisplaySize(140, 168));
    if (ADV.Portraits.animate) ADV.Portraits.animate(this, pimg, p, key);
    if (ADV.Portraits.express) {
      const sv = ADV.Survival ? ADV.Survival.state(p) : null;
      const mood = sv && sv.sick ? 'hurt' : (sv && sv.hunger) ? 'sad' : 'neutral';
      ADV.Portraits.express(this, pimg, p, key, mood);
    }
    const fg = add(this.add.graphics());
    fg.lineStyle(2, T().c.gold, 0.7); fg.strokeRect(x + w / 2 - 70, y + 8, 140, 168);
    add(T().text(this, x + w / 2, y + 186, p.name, { size: 19, display: true, ox: 0.5, color: T().css.gold, bold: true }));
    const ft = ADV.Campaign ? ADV.Campaign.titleName(p) : null;
    const titleLine = [p.title, ft].filter(Boolean).join(' · ');
    if (titleLine) add(T().text(this, x + w / 2, y + 208, titleLine, { size: 12, ox: 0.5, italic: true, color: T().css.purple, wrap: w - 16, align: 'center' }));
    const stage = ADV.Game.careerStage(this.game_);
    const wr = p.sex === 'm' && ADV.Courtship ? ADV.Courtship.wealthRank(this.game_.world, p) : 0;
    const gender = p.sex === 'f' ? 'woman' : 'man';
    let infoY = y + (titleLine ? 226 : 210);
    add(T().text(this, x + w / 2, infoY, `${gender} · ${stage} · rank ${p.rank} · rep ${p.reputation}`, { size: 12, ox: 0.5, color: T().css.inkDim, wrap: w - 20, align: 'center' }));
    if (wr) {
      infoY += 16;
      add(T().text(this, x + w / 2, infoY, 'wealth #' + wr, { size: 12, ox: 0.5, color: wr <= C().COURT.wealthTop ? T().css.gold : T().css.inkDim }));
    }

    let yy = infoY + 22;
    const S = (k) => ADV.Character.effStat(p, k);
    add(T().text(this, x + 16, yy, `HP ${S('hp')}   ATK ${S('atk')}   DEF ${S('def')}   SPD ${S('spd')}`, { size: 13 }));
    yy += 24;
    add(T().text(this, x + 16, yy, `Gold carried: ${p.inventory.gold}`, { size: 13, color: T().css.gold }));
    const v = ADV.Vault.of(this.game_.world, p);
    yy += 20;
    add(T().text(this, x + 16, yy, v ? `Vault: ${v.gold}${v.sharedWithId || (v.holderId !== p.id) ? ' (shared)' : ''}` : 'Vault: none yet', { size: 13, color: T().css.inkDim }));
    yy += 20;
    add(T().text(this, x + 16, yy, p.equippedSet ? `Set: ${ADV.DATA.GEAR_SETS[p.equippedSet].name}` : 'No gear set', { size: 13, color: p.equippedSet ? T().css.green : T().css.inkFaint }));
    if (p.meal) { yy += 20; add(T().text(this, x + 16, yy, `Fed: ${p.meal.name} (${Object.entries(p.meal.bonus).map(([k, v]) => '+' + v + ' ' + k.toUpperCase()).join(', ')})`, { size: 12, color: T().css.green, wrap: w - 32 })); }
    if (ADV.Survival) {
      for (const wln of ADV.Survival.warnings(this.game_)) {
        yy += 18;
        add(T().text(this, x + 16, yy, wln.text, { size: 11, color: T().css.blood, wrap: w - 32 }));
      }
    }
    yy += 28;
    add(T().text(this, x + 16, yy, `Perks (${p.perks.filter(e => !ADV.DATA.SKILLS[e.skillId].noSlot).length}/${ADV.SkillSys.capFor(p, 'perk')})`, { size: 13, color: T().css.inkDim }));
    yy += 20;
    for (const e of p.perks) {
      const m = ADV.SkillSys.manifest(p, e);
      const t = add(T().text(this, x + 22, yy, `${m.data.name} · L${e.level}`, { size: 12, color: m.tier !== 'basic' ? T().css.gold : T().css.ink }));
      t.setInteractive({ useHandCursor: true });
      ADV.Tooltip.attach(this, t, () => ADV.SkillInfo.describe(p, e.skillId));
      yy += 17;
    }
    yy += 8;
    add(T().text(this, x + 16, yy, `Actives (${p.actives.filter(e => !ADV.DATA.SKILLS[e.skillId].noSlot).length}/${ADV.SkillSys.capFor(p, 'active')})`, { size: 13, color: T().css.inkDim }));
    yy += 20;
    for (const e of p.actives) {
      const m = ADV.SkillSys.manifest(p, e);
      const t = add(T().text(this, x + 22, yy, `${m.data.name} · L${e.level}`, { size: 12, color: m.tier !== 'basic' ? T().css.gold : T().css.ink }));
      t.setInteractive({ useHandCursor: true });
      ADV.Tooltip.attach(this, t, () => ADV.SkillInfo.describe(p, e.skillId));
      if (ADV.Combat.skillNeedsAuto(p, e.skillId, false)) {
        const on = ADV.Combat.skillAutoOn(p, e.skillId, false);
        const b = T().button(this, x + 186, yy - 1, 52, 16, on ? 'AUTO' : 'auto', () => {
          const next = !on;
          ADV.Combat.setSkillAuto(p, e.skillId, next, false);
          const line = ADV.Game.prompt(this.game_, 'firstSkillAuto');
          if (line) ADV.Notices.toast(this, line);
          ADV.Save.saveGame(this.game_);
          this.buildCharacterPanel();
        }, { size: 10, color: on ? T().css.green : T().css.inkFaint, fill: on ? 0x2a3a22 : 0x211d18 });
        add(b.g); add(b.txt); add(b.zone);
      }
      yy += 17;
    }
    {
      const on = ADV.Combat.skillAutoOn(p, 'basic_attack', false);
      add(T().text(this, x + 22, yy, 'Attack', { size: 12, color: T().css.inkDim }));
      const b = T().button(this, x + 186, yy - 1, 52, 16, on ? 'AUTO' : 'auto', () => {
        ADV.Combat.setSkillAuto(p, 'basic_attack', !on, false);
        const line = ADV.Game.prompt(this.game_, 'firstSkillAuto');
        if (line) ADV.Notices.toast(this, line);
        ADV.Save.saveGame(this.game_);
        this.buildCharacterPanel();
      }, { size: 10, color: on ? T().css.green : T().css.inkFaint, fill: on ? 0x2a3a22 : 0x211d18 });
      add(b.g); add(b.txt); add(b.zone);
      yy += 17;
    }
    const kids = (p.dependents || []);
    if (kids.length) {
      yy += 8;
      add(T().text(this, x + 16, yy, `Children: ${kids.map(d => d.age >= C().CHILD_SELF_SUFFICIENT ? '◉' : '◎').join(' ')}  (${kids.length})`, { size: 13, color: T().css.blue }));
    }
    const home = ADV.Housing.of(p);
    yy += 20;
    add(T().text(this, x + 16, yy, home.id === 'camp' ? 'No home — sleeping outside the walls' : home.name, { size: 12, color: home.id === 'camp' ? T().css.inkFaint : T().css.gold, wrap: w - 32 }));
    const spouses = ADV.Rel.partnerIds(p).map(id => this.game_.world.characters.find(c => c.id === id)).filter(Boolean);
    if (spouses.length) {
      yy += 20;
      add(T().text(this, x + 16, yy, (spouses.length === 1 ? 'Partner: ' : 'Spouses: ') + spouses.map(s => s.name.split(' ')[0]).join(', '), { size: 13, color: T().css.purple, wrap: w - 32 }));
    }
    add(T().text(this, x + 16, T().H - 44, `world clock: quest ${this.game_.world.questClock} · life ${this.game_.life}`, { size: 11, color: T().css.inkFaint }));
    if (this._chromeHidden) this.applyChromeHidden(false);
  }

  // ---------------------------------------------------------------- menu
  buildMenu() {
    const x = 282, y = 16, w = 190;
    const p = this.player();
    if (this.menuObjs) this.menuObjs.forEach(o => { try { o.destroy(); } catch (e) {} });
    this.menuObjs = [];
    const add = (o) => { this.menuObjs.push(o); return o; };
    add(T().panel(this, x, y, w, T().H - 32, { alpha: T().chromeAlpha }));
    add(T().text(this, x + w / 2, y + 20, ADV.Housing.of(p).title || 'THE TOWN', { size: 16, display: true, ox: 0.5, color: T().css.gold }));
    const stage = ADV.Game.careerStage(this.game_);
    const items = [
      ['board', 'Quest Board'],
      ...(ADV.Campaign && ADV.Campaign.menuVisible(this.game_) ? [['campaign', ADV.Campaign.faction(this.game_) ? ADV.Campaign.faction(this.game_).name : 'Campaign']] : []),
      ...(ADV.Campaign2 && ADV.Campaign2.menuVisible(this.game_)
        ? [['campaign2', ADV.Campaign2.joined(this.game_).length === 1
            ? ADV.Campaign2.faction(ADV.Campaign2.joined(this.game_)[0]).short
            : 'Allegiances']]
        : []),
      ['store', 'Grocer'],
      ['blacksmith', 'Blacksmith'],
      ['home', 'Home'],
      ['trainer', 'Trainer'],
      ['insurance', 'Insurance'],
      ['maw', 'The Maw'],
      ['apply', 'Apply for Party'],
      ['create', 'Create Party', stage === 'leader' ? null : (p.inventory.gold < C().GOLD.partyStartupCapital ? `${C().GOLD.partyStartupCapital}g` : null)],
      ['roster', 'Guild Roster'],
      ['graveyard', 'Graveyard'],
      ['rel', 'Relationships'],
      ['vault', 'Vault'],
      ['faction', 'Faction Status'],
      ['journal', 'Skill Journal'],
      ['codex', 'Codex'],
      ['settings', 'Settings'],
    ];
    const listTop = y + 46;
    const listH = T().H - 32 - listTop - 52;
    const menuScroll = ADV.UI.scrollArea(this, { x: x + 4, y: listTop, w: w - 8, h: listH }, { keep: add });
    let yy = listTop;
    this.menuButtons = {};
    const tut = ADV.Tutor && ADV.Tutor.active(this.game_);
    for (const [id, label, lock] of items) {
      const tutLocked = tut && !ADV.Tutor.allowed(this.game_, id);
      const locked = !!lock || tutLocked;
      const b = T().button(this, x + 10, yy, w - 20, 38, label, () => {
        if (locked) return;
        this.openPanel(id);
      }, { size: 14, disabled: locked, sub: lock ? 'needs ' + lock : null, subColor: T().css.blood });
      menuScroll.addBtn(b);
      this.menuButtons[id] = b;
      yy += locked ? 44 : 40;
    }
    menuScroll.extend(yy);
    // notices badge
    const n = this.pendingCount();
    if (n > 0 && !tut) {
      const nb = T().button(this, x + 10, T().H - 62, w - 20, 34, `Notices (${n})`, () => { this.queueArrivalNotices(true); this.nextNotice(); }, { size: 13, color: T().css.blood });
      add(nb.g); add(nb.txt); add(nb.zone);
    }
    if (this._chromeHidden) this.applyChromeHidden(false);
  }

  pendingCount() {
    const w = this.game_.world;
    return (w.pendingRescues || []).length + (w.divineOffers || []).filter(o => o.candidateId === w.playerId).length +
      (w.pendingHeroInvites || []).length + (w.pendingPlayerJilt ? 1 : 0) + (w.pendingProposals || []).length + (w.pendingRaises || []).length +
      ((ADV.Vault.of(w, this.player()) || {}).pendingWithdrawals || []).length;
  }

  // ---------------------------------------------------------------- content
  clearContent() {
    for (const o of this.contentObjs) { try { o.destroy(); } catch (e) {} }
    this.contentObjs = [];
  }
  keep(o) { this.contentObjs.push(o); return o; }
  contentRect() { return { x: 488, y: 16, w: T().W - 488 - 16, h: T().H - 32 }; }

  openPanel(id) {
    this.currentPanel = id;
    this.panelScrolls = [];
    this.boardScroll = null;
    this.clearContent();
    const r = this.contentRect();
    this.keep(T().panel(this, r.x, r.y, r.w, r.h, { alpha: T().chromeAlpha }));
    const P = ADV.Panels;
    const panel = { board: P.questBoard, store: P.store, grocer: P.grocer, blacksmith: P.blacksmith,
       insurance: P.insurance, maw: P.maw, trainer: P.trainer, apply: P.applyParty,
       create: P.createParty, roster: P.roster, graveyard: P.graveyard, rel: P.relationships,
       faction: P.factions, journal: P.journal, codex: P.codex, settings: P.settings, campaign: P.campaign,
       campaign2: P.campaign2, vault: P.vault, home: P.home }[id];
    if (panel) panel(this, r);
    if (ADV.Tutor && ADV.Tutor.active(this.game_)) ADV.Tutor.panel(this, this.game_, id, r);
    if (this._chromeHidden) this.applyChromeHidden(false);
  }

  refreshAll() {
    if (ADV.HousingArt) ADV.HousingArt.paint(this, ADV.Housing.of(this.player()).id);
    this.buildCharacterPanel();
    if (this._chromeHidden) this.applyChromeHidden(false);
  }

  chromeObjs() {
    const list = [].concat(this.charObjs || [], this.menuObjs || [], this.contentObjs || []);
    if (this.musicBtn) list.push(this.musicBtn);
    return list;
  }

  applyChromeHidden(animate) {
    for (const o of this.chromeObjs()) {
      if (!o) continue;
      try { if (o.disableInteractive) o.disableInteractive(); } catch (e) {}
      if (animate) {
        try {
          this.tweens.add({
            targets: o, alpha: 0, duration: 280,
            onComplete: () => { try { if (o.setVisible) o.setVisible(false); } catch (e) {} },
          });
        } catch (e) {
          try { if (o.setVisible) o.setVisible(false); } catch (e2) {}
        }
      } else {
        try { if (o.setAlpha) o.setAlpha(0); } catch (e) {}
        try { if (o.setVisible) o.setVisible(false); else o.visible = false; } catch (e) {}
      }
    }
  }

  fadeChromeIn() {
    this.clearChromeFailsafe();
    for (const o of this.chromeObjs()) {
      if (!o) continue;
      try { if (o.setVisible) o.setVisible(true); else o.visible = true; } catch (e) {}
      try { if (o.input) o.input.enabled = true; } catch (e) {}
      try {
        if (o.setAlpha) o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 320 });
      } catch (e) {}
    }
  }

  clearChromeFailsafe() {
    if (this._chromeFailsafe) {
      try { this._chromeFailsafe.remove(false); } catch (e) {}
      this._chromeFailsafe = null;
    }
  }

  armChromeFailsafe() {
    this.clearChromeFailsafe();
    if (this.__embarking || !this.time) return;
    this._chromeFailsafe = this.time.delayedCall(6000, () => {
      this._chromeFailsafe = null;
      if (this.__embarking) return;
      this._chromeHidden = 0;
      this._arrivalChrome = false;
      this.fadeChromeIn();
    });
  }

  // Hide the hub panels so house art and the speaker are the only things on screen.
  // Conversations and the embark beat hide them. Notices do not. The tutorial keeps them.
  hideChrome() {
    if (!this.__embarking && !this.__cutscene && ADV.Tutor && ADV.Tutor.active(this.game_)) return;
    this._chromeHidden = (this._chromeHidden || 0) + 1;
    if (this._chromeHidden === 1) this.applyChromeHidden(true);
    this.armChromeFailsafe();
  }

  showChrome() {
    this._chromeHidden = Math.max(0, (this._chromeHidden || 0) - 1);
    if (this._chromeHidden > 0 || this.__embarking || this.__cutscene) return;
    this.fadeChromeIn();
  }

  // ---------------------------------------------------------------- notices
  queueArrivalNotices(force) {
    const w = this.game_.world;
    const p = this.player();
    this.noticeQueue = [];
    if (ADV.Tutor && ADV.Tutor.active(this.game_)) return;   // the guide has the floor
    if (w.pendingLeaderDeath) this.noticeQueue.push({ kind: 'leaderDeath' });
    if (w.pendingPlayerJilt) this.noticeQueue.push({ kind: 'jilt' });
    for (const rsc of (w.pendingRescues || [])) this.noticeQueue.push({ kind: 'rescue', rescue: rsc });
    for (const o of (w.divineOffers || []).filter(o => o.candidateId === w.playerId)) this.noticeQueue.push({ kind: 'divine', offer: o });
    for (const inv of (w.pendingHeroInvites || [])) this.noticeQueue.push({ kind: 'heroInvite', invite: inv });
    for (const pr of (w.pendingProposals || [])) this.noticeQueue.push({ kind: 'proposal', proposal: pr });
    for (const rz of (w.pendingRaises || [])) this.noticeQueue.push({ kind: 'raise', raise: rz });
    const v = ADV.Vault.of(w, p);
    if (v) for (let i = 0; i < v.pendingWithdrawals.length; i++) this.noticeQueue.push({ kind: 'withdrawal', vault: v });
    if (w.theftFlag) { w.theftFlag = false; this.promptOnce('firstTheft'); }
    if (this.game_.newChildFlag) { this.game_.newChildFlag = false; this.promptOnce(p.sex === 'f' ? 'firstChildbirth' : 'firstPregnancy'); }
    if (this.game_.pendingChildNaming) this.noticeQueue.unshift({ kind: 'nameChild', child: this.game_.pendingChildNaming });
    if (this.game_.childJustSelfSufficient) { this.game_.childJustSelfSufficient = false; this.promptOnce('childSelfSufficient'); }
    if (ADV.Rel.hatredEdgeCount(w, p.id) > 0) this.promptOnce('firstHatred');
    if (ADV.Survival) {
      const s = ADV.Survival.state(p);
      if (s.hunger > 0) this.promptOnce('firstHunger');
      if (ADV.Survival.shelterDeadline(p) <= 2) this.promptOnce('firstShelterWarning');
      if (s.sick) this.promptOnce('firstSickness');
      if (w.pendingPlayerJilt && s.sick) this.promptOnce('firstSicknessJilt');
    }
  }

  nextNotice() {
    const n = this.noticeQueue.shift();
    if (!n) {
      const finishArrival = () => {
        if (this._arrivalChrome) { this._arrivalChrome = false; this.showChrome(); }
        this.refreshAll();
      };
      if (ADV.Tutor && !this.tutorDone) {
        this.tutorDone = true;
        const st = ADV.Tutor.state(this.game_);
        if (st.step !== 'done') { ADV.Tutor.town(this, this.game_); return; }
        if (st.finished && !st.finalShown) { st.finalShown = true; ADV.Save.saveGame(this.game_); ADV.Tutor.finalWords(this, this.game_); return; }
      }
      if (ADV.CampaignUI && !this.campaignArrivalDone) {
        this.campaignArrivalDone = true;
        const hadMenu = !!this.menuButtons.campaign;
        const hadMenu2 = !!this.menuButtons.campaign2;
        const settle = () => {
          finishArrival();
          const gained = (!hadMenu && ADV.Campaign.menuVisible(this.game_)) ||
                         (!hadMenu2 && ADV.Campaign2 && ADV.Campaign2.menuVisible(this.game_));
          if (gained) this.scene.restart();
        };
        ADV.CampaignUI.arrival(this, this.game_, () => {
          if (ADV.Campaign2UI) ADV.Campaign2UI.arrival(this, this.game_, settle); else settle();
        });
        return;
      }
      finishArrival();
      return;
    }
    const P = ADV.Notices;
    ({ jilt: P.jilt, rescue: P.rescue, divine: P.divine, heroInvite: P.heroInvite, withdrawal: P.withdrawal, nameChild: P.nameChild, proposal: P.proposal, raise: P.raise, leaderDeath: P.leaderDeath }[n.kind])(this, n, () => this.nextNotice());
  }

  promptOnce(id) {
    const line = ADV.Game.prompt(this.game_, id);
    if (!line) return;
    ADV.Notices.toast(this, line);
  }

  // Menus hide so the painted house (or the roadside) and the people taking
  // the road can be seen. Click skips; then the quest scene starts as usual.
  playEmbark(quest, done) {
    if (this.__embarking) { if (done) done(); return; }
    this.__embarking = true;
    // Kill the home theme as soon as the party leaves the lawn — do not wait
    // for Quest.create, or a late home play() can keep looping under the run.
    const qstate = this.game_ && this.game_.quest;
    if (ADV.Music) {
      if (qstate && !qstate.musicStarted) {
        qstate.musicStarted = true;
        ADV.Music.startRun(!!(qstate.quest && qstate.quest.isBoss));
      } else if (ADV.Music.leaveHome) ADV.Music.leaveHome();
    }
    const W = T().W, H = T().H;
    const D = 420;
    if (ADV.Tutor) ADV.Tutor.clear(this);
    this.children.list.forEach(o => {
      if (o && o.depth >= 900) {
        try { if (o.disableInteractive) o.disableInteractive(); } catch (e) {}
        this.tweens.add({ targets: o, alpha: 0, duration: 200 });
      }
    });

    this.hideChrome();

    const p = this.player();
    let roster = [];
    try { roster = ADV.Game.partyRoster(this.game_).filter(c => c && c.alive !== false); } catch (e) { roster = []; }
    if (!roster.length) roster = [p];
    roster = roster.slice(0, ADV.Party.companyCap ? ADV.Party.companyCap() : 8);
    const party = roster.length > 1;
    const short = (c) => (c.name || 'Someone').split(' ')[0];
    const line1 = party
      ? `${short(p)} and company gather at the gate.`
      : `${p.name} checks the packs and the road.`;
    const line2 = party
      ? `They set out — ${quest.name}.`
      : `${p.name} sets out — ${quest.name}.`;

    const actors = [];
    const keep = (o) => { actors.push(o); return o; };
    keep(this.add.rectangle(W / 2, H - 54, W, 108, 0x0c0a08, 0.58).setDepth(D));
    const cap = keep(T().text(this, W / 2, H - 68, line1, {
      size: 18, display: true, ox: 0.5, oy: 0.5, color: T().css.gold, wrap: W - 80, align: 'center',
    }).setDepth(D + 1));
    keep(T().text(this, W / 2, H - 30, 'click to skip', {
      size: 12, ox: 0.5, italic: true, color: T().css.inkFaint,
    }).setDepth(D + 1).setAlpha(0.75));

    const n = roster.length;
    const mid = (n - 1) / 2;
    roster.forEach((c, i) => {
      const isLead = c.id === p.id;
      const bw = isLead ? 100 : 82;
      const bh = isLead ? 128 : 104;
      const x0 = 390 + (i - mid) * 54;
      const y0 = 548 + (i % 2) * 14;
      const cont = keep(this.add.container(x0, y0).setDepth(D + 2 + (isLead ? n : i)).setAlpha(0));
      const img = this.add.image(0, 0, ADV.Portraits.key(this, c)).setDisplaySize(bw, bh);
      const rim = this.add.rectangle(0, 0, bw + 4, bh + 4, 0x000000, 0)
        .setStrokeStyle(2, isLead ? T().c.gold : T().c.panelEdge, 0.95);
      const nm = T().text(this, 0, bh / 2 + 10, short(c), {
        size: 12, ox: 0.5, display: true, color: isLead ? T().css.gold : T().css.ink,
      });
      cont.add([rim, img, nm]);
      this.tweens.add({ targets: cont, alpha: 1, duration: 280, delay: 140 + i * 90 });
      this.tweens.add({
        targets: cont,
        x: 700 + (i - mid) * 118,
        y: 538 + (i % 2) * 12,
        duration: 1750,
        delay: 400 + i * 80,
        ease: 'Cubic.easeInOut',
      });
    });

    this.time.delayedCall(1380, () => { try { if (cap.active) cap.setText(line2); } catch (e) {} });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const veil = keep(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a08, 0).setDepth(D + 80));
      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 320,
        onComplete: () => {
          actors.forEach(o => { try { o.destroy(); } catch (e) {} });
          const qstate = this.game_ && this.game_.quest;
          const beats = qstate && qstate.departureBeats;
          if (beats && beats.length && !qstate.departureShown && ADV.CampaignUI) {
            qstate.departureShown = true;
            ADV.CampaignUI.playBeats(this, this.game_, beats, () => { if (done) done(); });
            return;
          }
          if (done) done();
        },
      });
    };
    this.time.delayedCall(450, () => {
      if (finished) return;
      keep(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(D + 70).setInteractive())
        .on('pointerdown', finish);
    });
    this.time.delayedCall(2480, finish);
  }

  // Speak helper: NPC dialogue box on interactions (§17a trigger points)
  speak(npc, band, extra, done) {
    ADV.DialogueBox.show(this, this.game_, npc, band || ADV.DialogueBox.bandFor(this.game_, npc),
      ADV.DialogueBox.ctxFor(this.game_, npc, extra), done);
  }
}

ADV.TownScene = TownScene;
})();
