// Boot + Title scene (§20): New / Continue, visible password field (§14a),
// pre-game tutorial cards (§12).
(function () {
'use strict';
const T = () => ADV.T;

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = T().W, H = T().H;
    this.add.rectangle(W / 2, H / 2, W, H, T().c.bg);
    ADV.Music.play('title');
    ADV.Music.button(this, W - 44, 44);
    // decorative frame
    const g = this.add.graphics();
    g.lineStyle(2, T().c.goldDim, 0.8); g.strokeRect(28, 28, W - 56, H - 56);
    g.lineStyle(1, T().c.panelEdge, 1); g.strokeRect(36, 36, W - 72, H - 72);

    T().text(this, W / 2, 150, 'ADVENTURER', { size: 64, display: true, ox: 0.5, color: T().css.gold, bold: true });
    T().text(this, W / 2, 218, 'a life, several times over', { size: 18, display: true, italic: true, ox: 0.5, color: T().css.inkDim });
    T().text(this, W / 2, 268, 'Stats never change. Skills are everything. Death is not the end of what you know.', { size: 14, ox: 0.5, color: T().css.inkFaint });

    const hasSave = ADV.Save.hasSave();
    let y = 340;
    if (hasSave) {
      T().button(this, W / 2 - 130, y, 260, 46, 'Continue', () => {
        const game = ADV.Game.load();
        if (game) { this.registry.set('game', game); this.scene.start('Town'); }
        else this.msg('The saved life could not be recalled.');
      }, { display: true, bold: true });
      y += 60;
    }
    T().button(this, W / 2 - 130, y, 260, 46, hasSave ? 'New Game' : 'Begin', () => {
      if (hasSave) {
        this.confirmNew();
      } else this.startCards();
    }, { display: true, bold: true, sub: hasSave ? 'wipes everything — journal, levels, lives' : null, subColor: T().css.inkFaint });
    y += 60;

    // visible password field (§14a — honor system by design)
    T().text(this, W / 2, y + 16, 'password', { size: 12, ox: 0.5, color: T().css.inkFaint });
    // A real <input> (mobile pass): canvas text never opens a phone keyboard.
    // Plain text by design (§14a) — the border turns purple on a known name.
    this.password = '';
    if (this.pwField) this.pwField.destroy();
    this.pwField = ADV.UI.textField(this, {
      x: W / 2, y: y + 44, w: 220, h: 32, size: 16, maxLen: 16, color: 'purple',
      pattern: /^[a-zA-Z0-9]$/, autocapitalize: 'none',
      onChange: (v) => {
        this.password = v;
        this.pwField.el.style.borderColor = ADV.DATA.REGISTRY[v.toLowerCase()] ? '#b48ee0' : '';
      },
    });

    T().text(this, W / 2, H - 70, 'save data lives in this browser · reset from the town codex', { size: 11, ox: 0.5, color: T().css.inkFaint });
  }

  confirmNew() {
    const W = T().W, H = T().H;
    if (this.pwField) this.pwField.hide();
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(50).setInteractive();
    T().panel(this, W / 2 - 240, H / 2 - 90, 480, 180).setDepth(51);
    const t1 = T().text(this, W / 2, H / 2 - 56, 'Start a brand new game?', { size: 20, display: true, ox: 0.5, color: T().css.blood }).setDepth(52);
    const t2 = T().text(this, W / 2, H / 2 - 24, 'Everything goes: the world, the journal, every skill level, every life. A new life after death happens on its own — this is the clean slate.', { size: 13, ox: 0.5, color: T().css.inkDim, wrap: 420, align: 'center' }).setDepth(52);
    const b1 = T().button(this, W / 2 - 190, H / 2 + 20, 170, 40, 'Wipe it all', () => { ADV.Save.reset(); this.startCards(); }, { color: T().css.blood });
    const b2 = T().button(this, W / 2 + 20, H / 2 + 20, 170, 40, 'Keep playing', () => { [dim, t1, t2].forEach(x => x.destroy()); b1.destroy(); b2.destroy(); if (this.pwField) this.pwField.show(); });
    b1.g.setDepth(52); b1.txt.setDepth(53); b1.zone.setDepth(54);
    b2.g.setDepth(52); b2.txt.setDepth(53); b2.zone.setDepth(54);
  }

  // Pre-game: 5 cards, skippable (§12)
  startCards() {
    const W = T().W, H = T().H;
    if (this.pwField) { this.pwField.destroy(); this.pwField = null; }
    const cards = ADV.DATA.PREGAME_CARDS;
    let idx = 0;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a08, 0.92).setDepth(60).setInteractive();
    const panel = T().panel(this, W / 2 - 300, H / 2 - 110, 600, 200).setDepth(61);
    const num = T().text(this, W / 2, H / 2 - 74, '', { size: 13, ox: 0.5, color: T().css.gold }).setDepth(62);
    const txt = T().text(this, W / 2, H / 2 - 20, '', { size: 21, display: true, ox: 0.5, oy: 0.5, wrap: 520, align: 'center' }).setDepth(62);
    const hint = T().text(this, W / 2, H / 2 + 54, 'click to continue', { size: 12, ox: 0.5, color: T().css.inkFaint }).setDepth(62);
    const skip = T().button(this, W / 2 - 60, H / 2 + 120, 120, 34, 'Skip all', () => finish(), { size: 13 });
    skip.g.setDepth(62); skip.txt.setDepth(63); skip.zone.setDepth(64);
    const render = () => { num.setText((idx + 1) + ' / ' + cards.length); txt.setText(cards[idx]); };
    const finish = () => {
      [dim, panel, num, txt, hint].forEach(x => x.destroy()); skip.destroy();
      this.scene.start('Creation', { password: this.password });
    };
    dim.on('pointerdown', () => { idx++; if (idx >= cards.length) finish(); else render(); });
    render();
  }

  msg(s) {
    const t = T().text(this, T().W / 2, T().H - 40, s, { size: 13, ox: 0.5, color: T().css.blood });
    this.time.delayedCall(2200, () => t.destroy());
  }
}

ADV.TitleScene = TitleScene;
})();
