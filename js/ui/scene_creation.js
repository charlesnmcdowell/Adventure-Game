// Character creation (§20): name entry, a scrolling grid of looks
// (classic 5 + extra faces + faction kits, each as woman and man),
// rolled stats, then a free pick of ANY 3 skills from the full pool.
// There are no classes — the portrait is only a look (§1).
(function () {
'use strict';
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

class CreationScene extends Phaser.Scene {
  constructor() { super('Creation'); }
  init(data) { this.password = (data && data.password) || ''; }

  create() {
    const W = T().W, H = T().H;
    this.add.rectangle(W / 2, H / 2, W, H, T().c.bg);
    this.done = false;             // scene instances are reused — reset run flags
    this.beginBtn = null;
    this.sel = { slot: 1, sex: 'f', name: '', skills: [] };
    // Later lives carry the previous life's learned set — no fresh free picks.
    const meta = ADV.Save.loadMeta();
    this.carried = meta.lastLifeSkills &&
      (meta.lastLifeSkills.perks.length + meta.lastLifeSkills.actives.length) > 0
      ? meta.lastLifeSkills : null;
    this.isHiro = !!(this.password && ADV.DATA.REGISTRY[this.password.toLowerCase()]);
    this.phase = 1;
    ADV.Music && ADV.Music.play('creation');
    if (this.isHiro) { this.buildHiro(); return; }
    this.buildPhase1();
  }

  // ---------------------------------------------------- phase 1: look + fate
  buildPhase1() {
    const W = T().W;
    T().text(this, W / 2, 30, 'Who are you this time?', { size: 30, display: true, ox: 0.5, color: T().css.gold });

    // name entry
    T().text(this, 100, 62, 'Name', { size: 13, color: T().css.inkDim });
    this.add.rectangle(230, 92, 260, 34, 0x211d18).setStrokeStyle(1, T().c.panelEdge);
    this.nameText = T().text(this, 230, 92, this.sel.name, { size: 18, ox: 0.5, oy: 0.5 });
    this.caret = T().text(this, 230, 92, '_', { size: 18, ox: 0.5, oy: 0.5, color: T().css.gold });
    this.tweens.add({ targets: this.caret, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
    this.input.keyboard.removeAllListeners('keydown');
    this.input.keyboard.on('keydown', (ev) => {
      if (this.done || this.phase !== 1) return;
      if (ev.key === 'Backspace') this.sel.name = this.sel.name.slice(0, -1);
      else if (/^[a-zA-Z '\-]$/.test(ev.key) && this.sel.name.length < 14) this.sel.name += ev.key;
      this.nameText.setText(this.sel.name);
      this.caret.setX(230 + this.nameText.width / 2 + 6);
      this.drawNextButton();
    });
    T().text(this, 380, 92, '(type it — NPCs will use it)', { size: 11, oy: 0.5, color: T().css.inkFaint });
    this.firstGame = (ADV.Save.loadMeta().lives || 0) === 0;

    // portrait grid — a look, nothing more (no classes, §1). Classic five
    // stay in the original 2×5 slots so the first screen still matches;
    // extra faces and faction kits sit below and the pane scrolls.
    T().text(this, 80, 118, 'Pick a face. It changes nothing but the mirror. Scroll for more.', { size: 13, italic: true, color: T().css.inkDim });
    this.faceHint = T().text(this, 780, 118, '', { size: 13, ox: 1, color: T().css.gold });
    this.cards = [];
    const gx = 80, gy = 140, cw = 128, chh = 170, gap = 14;
    const px = gx + 5 * (cw + gap) + 14;
    const scrollBottom = this.carried ? 492 : 548;
    const faceScroll = ADV.UI.scrollArea(this, { x: 64, y: 128, w: px - 72, h: scrollBottom - 128 });
    this.faceScroll = faceScroll;
    const sections = [
      { label: null, slots: [1, 2, 3, 4, 5] },
      { label: 'More faces', slots: [6, 7, 8, 9] },
      { label: 'Shinobi', slots: [10, 11] },
      { label: 'Samurai', slots: [12, 13] },
      { label: 'Privateers', slots: [14, 15] },
      { label: 'Admiralty', slots: [16, 17] },
    ];
    let y = gy;
    for (const sec of sections) {
      if (sec.label) {
        faceScroll.add(T().text(this, gx, y + 2, sec.label, { size: 14, display: true, color: T().css.gold }));
        y += 26;
      }
      for (const [row, sex] of [[0, 'f'], [1, 'm']].values()) {
        for (let i = 0; i < sec.slots.length; i++) {
          const slot = sec.slots[i];
          const x = gx + i * (cw + gap);
          const cy = y + row * (chh + gap);
          const key = ADV.Portraits.creationKey(this, slot, sex);
          const img = this.add.image(x + cw / 2, cy + 78, key).setDisplaySize(cw - 16, 148);
          const frame = this.add.graphics();
          const zone = this.add.zone(x, cy, cw, chh).setOrigin(0).setInteractive({ useHandCursor: true });
          const tag = ADV.Portraits.slotTag(slot);
          const sexLabel = this.add.text(x + cw / 2, cy + chh - 10, sex === 'f' ? 'Woman' : 'Man', { fontFamily: 'Georgia, serif', fontSize: '12px', color: sex === 'f' ? '#d4a0c0' : '#9ab0d0' }).setOrigin(0.5, 0.5);
          zone.on('pointerdown', () => { this.sel.slot = slot; this.sel.sex = sex; this.refresh(); });
          zone.on('pointerover', () => {
            if (this.faceHint) this.faceHint.setText(`${sex === 'f' ? 'A woman' : 'A man'} — ${tag} #${slot}`);
          });
          // Images use the texture size for height, which would over-extend
          // the pane and clip the last row. Seat them without measuring.
          faceScroll.container.add(img);
          faceScroll.add(frame);
          faceScroll.add(zone);
          faceScroll.add(sexLabel);
          this.cards.push({ slot, sex, frame, x, y: cy, cw, chh });
        }
      }
      y += 2 * (chh + gap);
    }
    faceScroll.extend(y + 12);

    // stats panel (fixed — not inside the face scroller)
    T().panel(this, px, 140, T().W - px - 60, 354);
    T().text(this, px + 18, 156, 'The dice are cast', { size: 17, display: true, color: T().css.gold });
    this.statsText = T().text(this, px + 18, 188, '', { size: 15 });
    this.rolled = this.rollStats();
    T().button(this, px + 18, 296, 130, 34, 'Reroll fate', () => { this.rolled = this.rollStats(); this.refresh(); }, { size: 13 });
    T().text(this, px + 18, 346, this.carried
      ? 'Stats are fixed for life.\nYour skills return from the\nlast one. There are no classes.'
      : 'Stats are fixed for life.\nOnly skills grow — and you\nchoose those next, freely.\nThere are no classes.', { size: 12, italic: true, color: T().css.inkFaint });

    this.nextBtn = null;
    this.drawNextButton();
    if (this.carried) {
      const names = this.carried.perks.concat(this.carried.actives)
        .map(id => ADV.DATA.SKILLS[id] ? ADV.DATA.SKILLS[id].name : id);
      T().panel(this, 80, 502, 5 * 142 - 14, 96);
      T().text(this, 98, 514, 'What you knew follows you', { size: 14, display: true, color: T().css.gold });
      T().text(this, 98, 538, names.join(' · '), { size: 13, wrap: 5 * 142 - 50, color: T().css.ink });
      T().text(this, 98, 566, 'No new free picks — new skills are witnessed in battle or bought at the trainer.', { size: 11, italic: true, color: T().css.inkFaint });
    }
    this.refresh();
    if (this.firstGame) {
      // pause here: the name is required, and this is where it goes
      ADV.Tutor.callout(this, { x: 100, y: 75, w: 260, h: 34 }, 'Your name', 'Type a name for your character — the world will use it when it speaks to you. A name is required before you go on. Then pick a face: each one says whether it is a woman or a man.', { onNext: () => {}, label: 'Got it' });
    }
  }

  drawNextButton() {
    const W = T().W, H = T().H;
    if (this.nextBtn) { this.nextBtn.destroy(); this.nextBtn = null; }
    const named = this.sel.name.trim().length > 0;
    this.nextBtn = this.carried
      ? T().button(this, W / 2 - 150, H - 90, 300, 50, named ? 'Step into the world' : 'Name yourself first', () => { if (named) this.begin(); }, { display: true, bold: true, size: 17, disabled: !named })
      : T().button(this, W / 2 - 150, H - 90, 300, 50, named ? 'Next — choose your three skills' : 'Name yourself first', () => { if (named) this.buildPhase2(); }, { display: true, bold: true, size: 17, disabled: !named });
  }

  rollStats() {
    const rng = new ADV.RNG(Math.floor(Math.random() * 1e9));
    return ADV.Character.rollStats(rng, 'human');
  }

  refresh() {
    for (const c of this.cards) {
      c.frame.clear();
      const on = c.slot === this.sel.slot && c.sex === this.sel.sex;
      c.frame.lineStyle(on ? 3 : 1.5, on ? T().c.gold : T().c.panelEdge, 1);
      c.frame.strokeRect(c.x + 4, c.y + 2, c.cw - 8, 154);
    }
    const s = this.rolled;
    this.statsText.setText(`HP ${s.hp}    Attack ${s.atk}\nDefense ${s.def}    Speed ${s.spd}\n\n${this.sel.sex === 'f' ? 'A woman' : 'A man'}, look #${this.sel.slot}`);
  }

  // ---------------------------------------------------- phase 2: free skills
  buildPhase2() {
    this.phase = 2;
    this.children.removeAll();
    const W = T().W, H = T().H;
    this.add.rectangle(W / 2, H / 2, W, H, T().c.bg);
    T().text(this, W / 2, 28, 'Your first three skills — any three', { size: 28, display: true, ox: 0.5, color: T().css.gold });
    T().text(this, W / 2, 64, `Free, from the whole pool. ◆ marks perks (${C().PLAYER_PERK_SLOTS} slots); the rest are actives (${C().PLAYER_ACTIVE_SLOTS} slots). Everything else waits at the trainer.`, { size: 13, ox: 0.5, color: T().css.inkDim });

    this.counter = T().text(this, W / 2, 92, '', { size: 16, display: true, ox: 0.5, color: T().css.gold });
    this.descText = T().text(this, W / 2, H - 128, '', { size: 13, ox: 0.5, color: T().css.inkDim, wrap: 900, align: 'center' });

    this.skillButtons = [];
    const pool = ADV.DATA.TRAINER_POOL.filter(id => !ADV.DATA.SKILLS[id].forbidden && !ADV.DATA.SKILLS[id].campaign);
    const cols = 3, cw = 340, rh = 44;
    const gx = W / 2 - (cols * cw + (cols - 1) * 16) / 2;
    let i = 0;
    for (const id of pool) {
      const sk = ADV.DATA.SKILLS[id];
      const col = i % cols, row = Math.floor(i / cols);
      const x = gx + col * (cw + 16), y = 120 + row * rh;
      const b = { id, x, y, w: cw, h: rh - 8 };
      b.g = this.add.graphics();
      b.txt = T().text(this, x + 14, y + (rh - 8) / 2, `${sk.name}${sk.kind === 'perk' ? ' ◆' : ''}`, { size: 14, oy: 0.5 });
      b.tag = T().text(this, x + cw - 14, y + (rh - 8) / 2, sk.archetype || 'social', { size: 11, ox: 1, oy: 0.5, color: T().css.inkFaint });
      const zone = this.add.zone(x, y, cw, rh - 8).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.toggleSkill(id));
      zone.on('pointerover', () => this.descText.setText(sk.name + ' — ' + sk.desc));
      ADV.Tooltip.attach(this, zone, () => ADV.SkillInfo.describe(null, id));
      this.skillButtons.push(b);
      i++;
    }

    this.beginBtn = null;
    this.backBtn = T().button(this, 60, H - 76, 150, 42, '← Back', () => { this.phase = 1; this.children.removeAll(); this.create(); }, { size: 14 });
    this.drawSkillButtons();
  }

  toggleSkill(id) {
    const sel = this.sel.skills;
    const idx = sel.indexOf(id);
    if (idx >= 0) sel.splice(idx, 1);
    else {
      if (sel.length >= C().FREE_STARTING_SKILLS) return;
      // respect slot shape: at most 3 perks, at most 3 actives of the three
      const sk = ADV.DATA.SKILLS[id];
      const perks = sel.filter(s => ADV.DATA.SKILLS[s].kind === 'perk').length;
      if (sk.kind === 'perk' && perks >= C().PLAYER_PERK_SLOTS) return;
      sel.push(id);
    }
    this.drawSkillButtons();
  }

  drawSkillButtons() {
    const n = this.sel.skills.length;
    this.counter.setText(`${n} of ${C().FREE_STARTING_SKILLS} chosen` + (n ? ' — ' + this.sel.skills.map(id => ADV.DATA.SKILLS[id].name).join(' · ') : ''));
    for (const b of this.skillButtons) {
      const on = this.sel.skills.includes(b.id);
      b.g.clear();
      b.g.fillStyle(on ? 0x33402a : 0x2b261f, 1);
      b.g.fillRoundedRect(b.x, b.y, b.w, b.h, 5);
      b.g.lineStyle(on ? 2 : 1.2, on ? T().c.gold : T().c.panelEdge, 1);
      b.g.strokeRoundedRect(b.x, b.y, b.w, b.h, 5);
      b.txt.setColor(on ? T().css.gold : T().css.ink);
    }
    if (this.beginBtn) { this.beginBtn.destroy(); this.beginBtn = null; }
    const ready = n === C().FREE_STARTING_SKILLS;
    this.beginBtn = T().button(this, T().W / 2 - 130, T().H - 84, 260, 50, 'Step into the world', () => { if (ready) this.begin(); }, { display: true, bold: true, size: 18, disabled: !ready });
  }

  // ---------------------------------------------------- Hiro
  buildHiro() {
    const W = T().W, H = T().H;
    T().text(this, 100, 62, 'Name', { size: 13, color: T().css.inkDim });
    this.add.rectangle(230, 92, 260, 34, 0x211d18).setStrokeStyle(1, T().c.panelEdge);
    this.nameText = T().text(this, 230, 92, '', { size: 18, ox: 0.5, oy: 0.5 });
    const key = ADV.Portraits.hiroKey(this);
    this.add.image(W / 2 - 220, 350, key).setDisplaySize(260, 330);
    T().text(this, W / 2 - 40, 190, 'The password is spoken.', { size: 24, display: true, color: T().css.purple });
    T().text(this, W / 2 - 40, 230, 'HIRO', { size: 40, display: true, bold: true, color: T().css.gold });
    const def = ADV.DATA.REGISTRY[this.password.toLowerCase()];
    const lines = def.perks.concat(def.actives).map(id => {
      const sk = ADV.DATA.SKILLS[id];
      return `${sk.name} — ${sk.desc}`;
    });
    T().text(this, W / 2 - 40, 280, lines.join('\n'), { size: 13, wrap: 520, color: T().css.inkDim });
    T().button(this, W / 2 - 130, H - 90, 260, 50, 'Walk as a god', () => this.begin(), { display: true, bold: true, size: 18, color: T().css.purple });
  }

  begin() {
    if (this.done) return;
    this.done = true;
    const opts = {
      seed: Math.floor(Math.random() * 1e9),
      name: this.sel.name.trim() || (this.isHiro ? 'Hiro' : 'Rook'),
      sex: this.sel.sex,
      portraitSlot: this.sel.slot,
      portraitSeed: this.sel.slot * 7919 + (this.sel.sex === 'f' ? 13 : 29),
      startingSkills: this.sel.skills,
      password: this.isHiro ? this.password : null,
    };
    const game = ADV.Game.newGame(opts);
    if (!this.isHiro && this.rolled) {
      const p = ADV.Game.player(game);
      p.stats = this.rolled;
      ADV.Save.saveGame(game);
    }
    this.registry.set('game', game);
    this.scene.start('Town');
  }
}

ADV.CreationScene = CreationScene;
})();
