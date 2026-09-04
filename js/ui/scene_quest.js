// Quest run scene (§8): encounter-by-encounter, with resolution verbs.
(function () {
'use strict';
const T = () => ADV.T;

class QuestScene extends Phaser.Scene {
  constructor() { super('Quest'); }

  create() {
    this.game_ = this.registry.get('game');
    const game = this.game_;
    const W = T().W, H = T().H;
    this.add.rectangle(W / 2, H / 2, W, H, T().c.bg);
    if (!game.quest) { this.scene.start('Town'); return; }
    // one track per quest: chosen on the first screen of the run, kept until town
    if (!game.quest.musicStarted) { game.quest.musicStarted = true; ADV.Music.startRun(!!game.quest.quest.isBoss); }
    else ADV.Music.play('quest');

    const q = game.quest;
    if (q.playerDead) { this.scene.start('Death'); return; }
    if (ADV.Game.maybeStartRivalFinale && ADV.Game.maybeStartRivalFinale(game)) {
      const finale = ADV.Game.currentEncounter(game);
      if (finale) { this.buildEncounter(finale); return; }
    }
    if (q.readyToComplete || q.over || (q.encIdx >= q.quest.encounters.length && !q.rivalFight)) { this.completeFlow(); return; }

    const enc = ADV.Game.currentEncounter(game);
    if (!enc) { this.completeFlow(); return; }
    // campaign beats (§8): departure lines once, the antagonist's opener before the last fight
    if (q.quest.campaign && ADV.CampaignUI) {
      const pending = [];
      if (!q.departureShown) { q.departureShown = true; pending.push(...(q.departureBeats || [])); }
      if (enc.openerBeats.length && q.openerShownIdx !== enc.encIdx) { q.openerShownIdx = enc.encIdx; pending.push(...enc.openerBeats); }
      if (pending.length) { this.buildEncounter(enc); ADV.CampaignUI.playBeats(this, game, pending, () => this.scene.restart()); return; }
    }
    this.buildEncounter(enc);
  }

  buildEncounter(enc) {
    const game = this.game_;
    const q = game.quest;
    const W = T().W, H = T().H;

    const tint = T().factionTint[q.quest.factionAlignment] || T().c.green;
    const g = this.add.graphics();
    g.lineStyle(3, tint, 0.5); g.strokeRect(20, 20, W - 40, H - 40);

    T().text(this, W / 2, 60, q.quest.name, { size: 26, display: true, ox: 0.5, color: T().css.gold });
    T().text(this, W / 2, 96, enc.rival
      ? 'Another company wants the same contract'
      : `Encounter ${enc.encIdx + 1} of ${enc.total} · ${q.quest.factionAlignment} country`, { size: 14, ox: 0.5, color: enc.rival ? T().css.gold : T().css.inkDim });
    const p = ADV.Game.player(game);
    T().text(this, W / 2, 120, `Your health: ${p.combatHp}/${ADV.Character.maxHp(p)} — you only heal back in town.`, { size: 13, ox: 0.5, color: p.combatHp < ADV.Character.maxHp(p) * 0.4 ? T().css.blood : T().css.inkDim });
    if (p.combatHp < ADV.Character.maxHp(p)) {
      const line = ADV.Game.prompt(game, 'firstCarriedDamage');
      if (line) ADV.Notices.toast(this, line);
    }

    // the opposition
    let x = W / 2 - (enc.enemies.length * 130) / 2 + 65;
    for (const e of enc.enemies) {
      const key = ADV.Portraits.key(this, e);
      const img = this.add.image(x, 240, key).setDisplaySize(110, 140);
      if (e.boss) img.setDisplaySize(134, 170);
      const f = this.add.graphics();
      f.lineStyle(2, e.boss ? T().c.blood : T().c.panelEdge, 1);
      f.strokeRect(x - img.displayWidth / 2, 240 - img.displayHeight / 2, img.displayWidth, img.displayHeight);
      const lvl = e.enemyLevel || Math.round(e.actives.concat(e.perks).reduce((a, b) => a + b.level, 0) / Math.max(1, e.actives.length + e.perks.length));
      T().text(this, x, 240 + img.displayHeight / 2 + 8, `${e.name} · L${lvl}`, { size: 12, ox: 0.5, color: e.boss ? T().css.blood : T().css.ink });
      if (e.armored) T().text(this, x, 240 + img.displayHeight / 2 + 24, 'armored', { size: 11, ox: 0.5, color: T().css.gold });
      if (e.isUndead) T().text(this, x, 240 + img.displayHeight / 2 + 24, 'undead', { size: 11, ox: 0.5, color: T().css.purple });
      // Case the Room / Scout's Cut (§13): loadouts on hover
      if (enc.revealed && e.campaignEnemy) {
        T().text(this, x, 240 + img.displayHeight / 2 + 40, 'loadout known', { size: 10, ox: 0.5, color: T().css.blue });
        img.setInteractive({ useHandCursor: true });
        ADV.Tooltip.attach(this, img, () => e.perks.concat(e.actives).map(en => ADV.SkillSys.manifest(e, en).data.name + ' L' + en.level).join('\n') || 'no skills');
      }
      x += 130;
    }

    // verbs (§8): every route the player owns is offered at every encounter.
    // A hireling does not call the rival intercept — the lead does.
    if (enc.rival && ADV.Game.careerStage(game) === 'hireling') {
      this.showHirelingRivalWait(enc);
      return;
    }
    if (enc.verbs.length > 1) {
      const line = ADV.Game.prompt(game, 'firstNonCombat');
      if (line) ADV.Notices.toast(this, line);
    }
    let y = 420;
    T().text(this, W / 2, y - 30, 'How does this go?', { size: 16, display: true, ox: 0.5, color: T().css.inkDim });
    const bw = 380;
    for (const v of enc.verbs) {
      let label, sub;
      if (v.verb === 'fight') { label = 'Fight'; sub = 'steel answers everything'; }
      else if (v.verb === 'alignment') { label = v.label; sub = `standing opens the road · ${Math.round(v.odds * 100)}%`; }
      else if (v.verb === 'quiet_word') { label = 'Threaten'; sub = v.note || `${Math.round(v.odds * 100)}% · a quiet word works best on the isolated`; }
      else {
        const names = { persuade: 'Talk your way past', charm: 'Charm them', intimidate: 'Frighten them off', sneak: v.mode === 'ambush' ? 'Sneak — ambush them' : 'Sneak past (and steal)' };
        // the four campaign-2 verbs carry their own labels from availableVerbs
        label = v.label || names[v.verb];
        const c2sub = { silent_trade: 'coin, not steel — and it costs you some',
                        standing_order: 'authority, if they recognise it',
                        black_flag: 'they give up the cargo rather than the fight',
                        colours_and_papers: 'take it by the king\'s word' }[v.verb];
        sub = v.note || `${Math.round(v.odds * 100)}% · ${c2sub || (v.mode === 'ambush' ? "a party can't hide — strike first, twice" : 'witnessing nothing is the price')}`;
      }
      T().button(this, W / 2 - bw / 2, y, bw, 44, label, () => this.chooseVerb(v), {
        size: 15, display: v.verb === 'fight', sub, subColor: v.ok ? T().css.inkDim : T().css.blood, disabled: !v.ok,
      });
      y += 54;
    }
    // give up
    T().button(this, W / 2 - 90, y + 10, 180, 34, 'Abandon the quest', () => {
      game.quest.failed = true; game.quest.fled = true; game.quest.over = true;
      this.completeFlow();
    }, { size: 12, color: T().css.inkFaint });
  }

  showHirelingRivalWait(enc) {
    const game = this.game_;
    const q = game.quest;
    const W = T().W;
    const party = ADV.Party.of(game.world, ADV.Game.player(game));
    const leader = party ? ADV.Party.leader(game.world, party) : null;
    const name = (leader && leader.name) || 'The lead';
    T().text(this, W / 2, 400, name + ' is choosing whether to fight or abandon the contract.', {
      size: 16, display: true, ox: 0.5, wrap: W - 160, align: 'center', color: T().css.gold,
    });
    T().text(this, W / 2, 444, 'You wait.', { size: 13, ox: 0.5, italic: true, color: T().css.inkDim });
    if (q.leaderRivalDeciding) return;
    q.leaderRivalDeciding = true;
    this.time.delayedCall(5000, () => {
      if (!game.quest || game.quest.over || game.quest.playerDead) return;
      const r = ADV.Game.resolveHirelingRival(game);
      if (r.choice === 'abandon') { this.completeFlow(); return; }
      ADV.Game.startCombat(game, false);
      this.scene.start('Combat', { mode: 'quest' });
    });
  }

  chooseVerb(v) {
    const game = this.game_;
    if (v.verb === 'fight') {
      const roster = ADV.Game.partyRoster(game);
      if (roster.length > 1) {
        const l = ADV.Game.prompt(game, 'firstPartyQuest');
        if (l) ADV.Notices.toast(this, l);
      }
      ADV.Game.startCombat(game, false);
      this.scene.start('Combat', { mode: 'quest' });
      return;
    }
    const res = ADV.Game.tryVerb(game, v);
    if (res.success && res.mode === 'bypass') {
      ADV.Notices.toast(this, res.stolen ? `You slip past — ${res.stolen}g lighter for them.` : 'You pass without a fight. And learn nothing.');
      this.time.delayedCall(900, () => this.scene.restart());
    } else if (res.success && res.mode === 'ambush') {
      const l = ADV.Game.prompt(game, 'firstAmbush');
      if (l) ADV.Notices.toast(this, l);
      ADV.Game.startCombat(game, true);
      this.scene.start('Combat', { mode: 'quest' });
    } else {
      ADV.Notices.toast(this, 'It fails. Steel it is.');
      this.time.delayedCall(700, () => {
        ADV.Game.startCombat(game, false);
        this.scene.start('Combat', { mode: 'quest' });
      });
    }
  }

  completeFlow() {
    const game = this.game_;
    const q = game.quest;
    if (q.closingBeats && q.closingBeats.length && ADV.CampaignUI) {
      const beats = q.closingBeats; q.closingBeats = null;
      const W = T().W;
      const tint = T().factionTint[q.quest.factionAlignment] || T().c.green;
      const g = this.add.graphics(); g.lineStyle(3, tint, 0.5); g.strokeRect(20, 20, W - 40, T().H - 40);
      T().text(this, W / 2, 60, q.quest.name, { size: 26, display: true, ox: 0.5, color: T().css.gold });
      T().text(this, W / 2, 100, q.quest.rivalDies ? 'The last door. Someone else is already there.' : 'It is over. Someone wants a word.', { size: 15, ox: 0.5, italic: true, color: T().css.inkDim });
      const roster = ADV.Game.partyRoster(game).filter(c => c.campaign || c.isPlayer);
      let x = W / 2 - (roster.length * 130) / 2 + 65;
      for (const c of roster) { this.add.image(x, 300, ADV.Portraits.key(this, c)).setDisplaySize(110, 140); const f = this.add.graphics(); f.lineStyle(2, T().c.panelEdge, 1); f.strokeRect(x - 55, 230, 110, 140); T().text(this, x, 380, c.name, { size: 12, ox: 0.5 }); x += 130; }
      ADV.CampaignUI.playBeats(this, game, beats, () => this.scene.restart());
      return;
    }
    const failed = q.failed;
    const out = ADV.Game.completeQuest(game);
    if (ADV.Tutor) ADV.Tutor.onQuestDone(game, failed || q.playerDead);
    const W = T().W;
    T().panel(this, W / 2 - 280, 180, 560, 320);
    T().text(this, W / 2, 210, failed ? (q.leaderDied ? 'The lead fell.' : q.fled ? 'You fled.' : 'The contract failed.') : (q.quest.campaign && !q.quest.factionRepeatable ? `${q.quest.name} — done` : 'Contract complete'), { size: 26, display: true, ox: 0.5, color: failed ? T().css.blood : T().css.gold });
    let y = 260;
    const line = (s, c) => { T().text(this, W / 2, y, s, { size: 15, ox: 0.5, color: c || T().css.ink }); y += 26; };
    if (!failed) {
      if (out.wage) { line(`Your wage: ${out.wage}g`, T().css.gold); if (out.leaderTake != null) line(`The leader pockets ${out.leaderTake}g.`, T().css.inkDim); }
      else if (out.gold) { line(`Payout: ${out.gold}g${out.payroll ? ` (after ${out.payroll}g payroll)` : ''}`, T().css.gold); }
      if (out.loot) line(`Loot scraped from the field: ${out.loot}g`, T().css.inkDim);
      const newly = (q.witnessedNew || []);
      if (newly.length) {
        const l = ADV.Game.prompt(game, 'firstWitness');
        if (l) ADV.Notices.toast(this, l);
        for (const w of newly.slice(0, 3)) {
          const sk = ADV.DATA.SKILLS[w.skillId];
          line(`Witnessed: ${sk.tiers[w.tier].name}${w.tier !== 'basic' ? ` — the trainer can teach you ${sk.name}` : ''}`, T().css.blue);
          if (w.tier !== 'basic') { const l2 = ADV.Game.prompt(game, 'firstAdvWitness'); if (l2) ADV.Notices.toast(this, l2); }
          if (sk.forbidden) { const l3 = ADV.Game.prompt(game, 'firstForbiddenSeen'); if (l3) ADV.Notices.toast(this, l3); }
        }
      }
    } else {
      if (q.leaderDied) line('The company is broken. They will bury the lead in town.', T().css.inkDim);
      else line('Reputation suffers. Payroll was owed anyway.', T().css.inkDim);
      if (out.fired) line('You have been let go from the party.', T().css.blood);
    }
    const fl = ADV.Game.prompt(game, 'firstFactionShift');
    if (fl) ADV.Notices.toast(this, fl);
    if (!failed && q.quest.campaign && game.campaign && (q.quest.n === 2 || q.quest.n === 4)) {
      line(`Standing: ${ADV.Campaign.titleName(ADV.Game.player(game))}`, T().css.purple);
      const tl = ADV.Game.prompt(game, 'firstTitle'); if (tl) ADV.Notices.toast(this, tl);
    }

    T().button(this, W / 2 - 110, 430, 220, 44, 'Head back to town', () => {
      // The ride home plays in Town, where the housing art is the backdrop —
      // the mirror of the embark beat, which plays in Town on the way out.
      if (!failed) game.rideHomeDue = true;
      if (out.ambush) this.ambushIntro(out.ambush);
      else this.scene.start('Town');
    }, { display: true, bold: true, size: 16 });
  }

  ambushIntro(ambush) {
    const game = this.game_;
    const a = ambush.attacker;
    const isHero = ambush.kind === 'hero';
    const l = ADV.Game.prompt(game, 'firstAssassination');
    if (l) ADV.Notices.toast(this, l);
    ADV.DialogueBox.show(this, game, a, isHero ? 'general' : 'hatred', ADV.DialogueBox.ctxFor(game, a), () => {
      ADV.Game.startAmbush(game, ambush);
      this.scene.start('Combat', { mode: 'ambush' });
    });
  }
}

ADV.QuestScene = QuestScene;
})();
