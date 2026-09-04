// Death scene (§7/§20): reincarnation or nepotism resolution + inheritance summary.
(function () {
'use strict';
const T = () => ADV.T;

class DeathScene extends Phaser.Scene {
  constructor() { super('Death'); }

  create() {
    this.game_ = this.registry.get('game');
    const game = this.game_;
    const W = T().W, H = T().H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0908);
    ADV.Music.play('death');
    // Permadeath plus inheritance is the strongest idea in the game and it used
    // to be a wall of text. Play the burial first, then show the ledger.
    if (!game.__deathBeatShown) {
      game.__deathBeatShown = true;
      this.playWake(() => { this.scene.restart(); });
      return;
    }
    this.showSummary();
  }

  // ---- the burial ---------------------------------------------------------
  playWake(done) {
    const game = this.game_;
    const world = game.world;
    const W = T().W, H = T().H;
    const dead = ADV.Game.deadPlayerRecord(game);
    const objs = [];
    const keep = (o) => { objs.push(o); return o; };

    // same tableau as Cutscenes.funeral, one size up
    keep(ADV.Cutscenes.grave(this, { x: W / 2, y: 470, scale: 1.185, depth: 1 }));

    const lines = this.obituaryFor(dead);
    let y = 108;
    const shown = [];
    const put = (str, opts) => {
      const t = keep(T().text(this, W / 2, y, str, Object.assign({ ox: 0.5, wrap: 860, align: 'center' }, opts)).setDepth(3).setAlpha(0));
      shown.push(t); y += (opts && opts.size ? opts.size : 15) + 16;
      return t;
    };
    put(`${dead.name} is dead.`, { size: 40, display: true, color: T().css.blood });
    for (const l of lines) put(l, { size: 15, color: T().css.inkDim, italic: true });

    const lost = (dead.actives || []).concat(dead.perks || [])
      .map(e => (ADV.DATA.SKILLS[e.skillId] || {}).name).filter(Boolean);
    if (lost.length) put('Buried with them: ' + lost.slice(0, 8).join(' · '), { size: 13, color: T().css.gold });

    // mourners: whoever actually cared, in their own voice
    const mourners = (dead.mournerIds || [])
      .map(m => ({ c: ADV.World.byId(world, m.id), tier: m.tier }))
      .filter(m => m.c && m.c.alive)
      .slice(0, 4);

    const conts = mourners.map((m, i) => {
      const mid = (mourners.length - 1) / 2;
      const cont = keep(this.add.container(W / 2 + (i - mid) * 232, 528).setDepth(4).setAlpha(0));
      const img = this.add.image(0, 0, ADV.Portraits.key(this, m.c)).setDisplaySize(84, 106);
      try { img.setTint(0x9aa0aa); } catch (e) {}
      const rim = this.add.rectangle(0, 0, 88, 110, 0x000000, 0)
        .setStrokeStyle(2, m.tier === 'romantic' ? T().c.gold : T().c.panelEdge, 0.9);
      const nm = T().text(this, 0, 64, (m.c.name || '').split(' ')[0], { size: 12, ox: 0.5, display: true, color: T().css.ink });
      cont.add([rim, img, nm]);
      // their own line, in the band their standing with the dead earned, drawn
      // with them rather than through a chain of timed modals
      let said = '';
      try {
        const r = ADV.util.speakEx(world, m.c, m.tier === 'romantic' ? 'romantic' : 'friendly',
          { target: dead.name, them: null, partner: null, rand: Math.random() });
        said = (r && r.text) || '';
      } catch (e) { said = ''; }
      if (said) {
        const say = T().text(this, 0, 86, '\u201c' + said + '\u201d',
          { size: 12, ox: 0.5, wrap: 200, align: 'center', italic: true,
            color: m.tier === 'romantic' ? T().css.gold : T().css.inkDim });
        cont.add(say);
      }
      return cont;
    });

    // fade the words in, then the mourners, then let them speak
    let i = 0;
    const revealNext = () => {
      if (i >= shown.length) { revealMourners(); return; }
      const t = shown[i++];
      this.tweens.add({ targets: t, alpha: 1, duration: 260 });
      this.time.delayedCall(230, revealNext);
    };
    const revealMourners = () => {
      if (!conts.length) { this.time.delayedCall(900, finish); return; }
      conts.forEach((c, n) => this.tweens.add({ targets: c, alpha: 1, duration: 500, delay: n * 260 }));
      // hold on the graveside long enough to read them, then close
      this.time.delayedCall(1400 + conts.length * 260 + 1800, finish);
    };
    let ended = false;
    const finish = () => {
      if (ended) return; ended = true;
      const veil = keep(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0908, 0).setDepth(900));
      this.tweens.add({ targets: veil, alpha: 1, duration: 340, onComplete: () => { if (done) done(); } });
    };
    // click to skip the whole burial
    this.time.delayedCall(600, () => {
      if (ended) return;
      keep(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setDepth(880).setInteractive())
        .on('pointerdown', finish);
    });
    keep(T().text(this, W / 2, H - 24, 'click to skip', { size: 12, ox: 0.5, italic: true, color: T().css.inkFaint }).setDepth(901));
    revealNext();
  }

  // A stored obituary if one was written, otherwise composed from the life.
  obituaryFor(ch) {
    if (ch.obituary && typeof ch.obituary === 'object' && ch.obituary.text) return [ch.obituary.text];
    if (ch.obituary) return String(ch.obituary).split('\n').filter(Boolean);
    const world = this.game_.world;
    const out = [];
    const q = ch.questsCompleted || 0;
    out.push(q === 0 ? 'Took no contracts. The board never learned the name.'
      : `${q} ${q === 1 ? 'contract' : 'contracts'} taken, and the last one kept.`);
    const partners = (ADV.Rel.partnerIds(ch) || []).map(id => ADV.World.byId(world, id)).filter(Boolean);
    if (partners.length) out.push(`Survived by ${partners.map(p2 => p2.name).join(' and ')}.`);
    const kids = (ch.childIds || []).length + (ch.dependents || []).length;
    if (kids) out.push(`${kids} ${kids === 1 ? 'child' : 'children'} left behind.`);
    const haters = (ADV.Rel.hatersOf ? ADV.Rel.hatersOf(world, ch.id) : []).length;
    if (haters) out.push(`${haters} ${haters === 1 ? 'person' : 'people'} will not mourn.`);
    if (ch.title) out.push(`Died holding the title: ${ch.title}.`);
    return out;
  }

  showSummary() {
    const game = this.game_;
    const W = T().W;
    const route = game.pendingDeath ? game.pendingDeath.route : { mode: 'reincarnation' };
    const dead = ADV.Game.deadPlayerRecord(game);

    T().text(this, W / 2, 130, 'You died.', { size: 48, display: true, ox: 0.5, color: T().css.blood, bold: true });
    T().text(this, W / 2, 190, `${dead.name} — ${dead.questsCompleted} contracts, rank ${dead.rank}, life ${game.life}.`, { size: 15, ox: 0.5, color: T().css.inkDim });

    const journalCount = Object.keys(game.meta.journal || {}).length;
    const levels = Object.entries(game.meta.skillLevels || {}).filter(([, v]) => v.level > 1);

    let y = 250;
    const line = (s, c) => { T().text(this, W / 2, y, s, { size: 15, ox: 0.5, color: c || T().css.ink, wrap: 700, align: 'center' }); y += 28; };

    line('Carried gold and gear are gone — taken, or scattered on the field.', T().css.inkFaint);
    line(`The journal survives: ${journalCount} skills witnessed across your lives.`, T().css.blue);
    const carried = game.meta.lastLifeSkills;
    if (carried && carried.perks.length + carried.actives.length) {
      line(`Your learned skills follow you: ${carried.perks.concat(carried.actives).map(id => ADV.DATA.SKILLS[id] ? ADV.DATA.SKILLS[id].name : id).join(' · ')}`, T().css.gold);
    } else if (levels.length) {
      line(`Skill levels survive: ${levels.slice(0, 5).map(([id, v]) => `${ADV.DATA.SKILLS[id] ? ADV.DATA.SKILLS[id].name : id} L${v.level}`).join(' · ')}${levels.length > 5 ? ' …' : ''}`, T().css.gold);
    }
    y += 12;

    if (route.mode === 'nepotism') {
      ADV.Game.prompt(game, 'firstDeathNepotism');
      line('But the world does not reset.', T().css.gold);
      const heirName = route.heir.adult ? route.heir.ch.name : 'your child';
      line(`Your eldest, ${heirName}, inherits the vault and your learned skills, and carries their father's name and strength as a title.`, T().css.ink);
      line('Everyone your parent knew is still out there. So is everyone they wronged.', T().css.inkDim);
      // the campaign consequence, said plainly rather than discovered later
      const resumable = (game.world.campaignProgress || []).filter(r => r && r.factionId);
      if (resumable.length) {
        const names = resumable.map(r => (ADV.DATA.FACTIONS[r.factionId] || {}).name || r.factionId);
        line(`Your parent's work continues: ${names.join(', ')} hands the heir the next contract.`, T().css.gold);
      }
      T().button(this, W / 2 - 140, y + 30, 280, 50, 'Continue as your child', () => {
        ADV.Game.continueAfterDeath(game, {});
        this.registry.set('game', game);
        this.scene.start('Town');
      }, { display: true, bold: true, size: 17, color: T().css.purple });
    } else {
      ADV.Game.prompt(game, 'firstDeathReincarnation');
      line('Generations pass. Everyone you knew is gone; every grudge died with them.', T().css.inkDim);
      line('What you witnessed and what you mastered follows you into the next life.', T().css.ink);
      const started = (game.world.campaignProgress || []).filter(r => r && r.factionId);
      if (started.length) {
        const names = started.map(r => (ADV.DATA.FACTIONS[r.factionId] || {}).name || r.factionId);
        line(`Closed for good: ${names.join(', ')}. A reincarnation is never offered a campaign the line has already started.`, T().css.blood);
      }
      T().button(this, W / 2 - 140, y + 30, 280, 50, 'Begin the next life', () => {
        game.pendingDeath = null;
        this.scene.start('Creation', { password: '' });
      }, { display: true, bold: true, size: 17 });
    }
  }
}

ADV.DeathScene = DeathScene;
})();
