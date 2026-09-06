// Guided first hour (request): name → menu tour → an easy solo contract →
// gold & the trainer → the vault → joining a party (declined once, then hired
// at the wage you named) → the leader's quest → free play. State is game.tutorial,
// saved with the world; later lives and Hiro skip it.
(function () {
'use strict';
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

const ALLOWED = { tour: [], firstQuest: ['board'], trainer: ['trainer'], vault: ['vault'], party: ['apply'], partyQuest: ['board'] };
const TUTORIAL_WAGE = 45;

const TOUR = [
  ['board',    'Quest Board',     'Contracts are posted here. Solo work pays less; party work pays full. The contract IS the difficulty — nothing scales to you.'],
  ['store',    'Grocer',          'Eat before every contract. Skip a meal and you come back Hungry; four Hungry nights kill you. One meal wipes the stack.'],
  ['blacksmith','Blacksmith',     'A set parks its skills in free armor slots. The 800g sets also advance those skills a whole tier. One set at a time; sell the one you wear for what you paid.'],
  ['insurance','Insurance',       'Fifty gold now. If you or your spouse dies, the survivor is paid five hundred, and the policy is gone.'],
  ['trainer',  'Trainer',         'Every skill lives here. Your first three were free; witnessed skills are free; the rest cost gold. Tutoring lifts a skill a whole tier for gold.'],
  ['apply',    'Apply for Party', 'Hire on with an existing party. Name your wage first — reputation opens 30g to 200g. The leader picks the contracts and keeps the take.'],
  ['create',   'Create Party',    'With 100g you can lead your own: hire people, set wages, take the whole payout — and owe payroll win or lose.'],
  ['roster',   'Guild Roster',    'Everyone in town: what they run, who they ride with, what they think of you.'],
  ['rel',      'Relationships',   'Regard moves with shared quests, money and how you treat people. Friendly opens romance; Hatred opens knives.'],
  ['vault',    'Vault',           'Gold you carry is lost when you die. Gold in the vault is not. Married couples share one.'],
  ['faction',  'Faction Status',  'Law, criminal, neutral — the contracts you take decide who trusts you, and who comes recruiting.'],
  ['journal',  'Skill Journal',   'Every skill you have ever seen used, across every life. The journal is the real save file.'],
  ['codex',    'Codex',           'Everything the world has explained to you so far, kept for reference.'],
];

const Tutor = {};
Tutor.fresh = function () { return { step: 'tour', tourIdx: 0, declined: false, seenGold: false }; };
Tutor.state = function (game) { if (!game.tutorial) game.tutorial = { step: 'done' }; return game.tutorial; };
Tutor.step = function (game) { return Tutor.state(game).step; };
Tutor.active = function (game) { return Tutor.step(game) !== 'done'; };
Tutor.set = function (game, step) { Tutor.state(game).step = step; ADV.Save.saveGame(game); };
Tutor.allowed = function (game, id) {
  const step = Tutor.step(game);
  if (step === 'done') return true;
  if (id === 'settings') return true;
  return (ALLOWED[step] || []).includes(id);
};
// Which contracts may be taken right now
Tutor.questAllowed = function (game, q) {
  const step = Tutor.step(game);
  if (step === 'done' || step === 'partyQuest') return true;
  if (step === 'firstQuest') return q.track === 'solo' && q.tier === 1 && q.factionAlignment === 'neutral';
  return false;
};
Tutor.wage = () => TUTORIAL_WAGE;

// ---------------------------------------------------------------- drawing
// A highlight ring around a rect plus a caption panel. `pass`: clicks fall
// through to the highlighted thing (the player must click it); otherwise a
// Next button advances.
Tutor.callout = function (scene, rect, title, body, opts) {
  opts = opts || {};
  if (ADV.Tooltip) ADV.Tooltip.hide();
  if (ADV.UI && ADV.UI.holdCard && !ADV.UI.holdCard('tutor', () => Tutor.clear(scene))) {
    return { close: function () {} };
  }
  const W = T().W, H = T().H, D = 980;
  const objs = [];
  const k = o => { objs.push(o); return o; };
  if (!opts.pass) k(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(D - 2).setInteractive());
  if (rect) {
    const ring = k(scene.add.graphics().setDepth(D - 1));
    ring.lineStyle(3, T().c.gold, 1); ring.strokeRoundedRect(rect.x - 6, rect.y - 6, rect.w + 12, rect.h + 12, 7);
    scene.tweens.add({ targets: ring, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }
  // Compact card. Prefer below/above the highlight; fall back to the empty
  // bottom-right so we never sit on the character sheet or a modal.
  const pw = 300;
  const bodyWrap = pw - 28;
  const probe = T().text(scene, 0, 0, body, { size: 12, wrap: bodyWrap });
  const ph = Math.min(176, 36 + probe.height + (opts.pass ? 22 : 58));   // room for a 44px-tall button (mobile pass)
  try { probe.destroy(); } catch (e) {}
  const pad = 14;
  const fits = (x, y) => x >= pad && y >= pad && x + pw <= W - pad && y + ph <= H - pad;
  const hits = (x, y) => rect && x < rect.x + rect.w && x + pw > rect.x && y < rect.y + rect.h && y + ph > rect.y;
  const candidates = [];
  if (rect) {
    candidates.push({ x: Math.min(W - pw - pad, Math.max(pad, rect.x)), y: rect.y + rect.h + 10 });
    candidates.push({ x: Math.min(W - pw - pad, Math.max(pad, rect.x)), y: rect.y - ph - 10 });
    candidates.push({ x: rect.x + rect.w + 12, y: rect.y });
  } else {
    candidates.push({ x: W / 2 - pw / 2, y: H / 2 - ph / 2 });
  }
  candidates.push({ x: W - pw - pad, y: H - ph - pad });
  let px = W - pw - pad, py = H - ph - pad;
  for (const c of candidates) {
    if (fits(c.x, c.y) && !hits(c.x, c.y)) { px = c.x; py = c.y; break; }
  }
  const panel = k(scene.add.graphics().setDepth(D));
  panel.fillStyle(0x14110d, 0.97); panel.fillRoundedRect(px, py, pw, ph, 8);
  panel.lineStyle(2, T().c.gold, 0.9); panel.strokeRoundedRect(px, py, pw, ph, 8);
  k(T().text(scene, px + 12, py + 8, title, { size: 14, display: true, color: T().css.gold }).setDepth(D + 1));
  k(T().text(scene, px + 12, py + 28, body, { size: 12, wrap: bodyWrap, color: T().css.ink }).setDepth(D + 1));
  const close = () => {
    objs.forEach(o => { try { o.destroy(); } catch (e) {} });
    scene.tutorObjs = (scene.tutorObjs || []).filter(o => objs.indexOf(o) < 0);
    if (!(scene.tutorObjs && scene.tutorObjs.length) && ADV.UI && ADV.UI.releaseCard) ADV.UI.releaseCard('tutor');
    if (ADV.Music && ADV.Music.stopTutorial) ADV.Music.stopTutorial();
  };
  if (!opts.pass) {
    const b = T().button(scene, px + pw - 160, py + ph - 54, 146, 44, opts.label || 'Next', () => { close(); if (opts.onNext) opts.onNext(); }, { size: 13, bold: true, color: T().css.gold });
    b.g.setDepth(D + 1); b.txt.setDepth(D + 2); b.zone.setDepth(D + 3); objs.push(b.g, b.txt, b.zone);
  } else {
    k(T().text(scene, px + 12, py + ph - 20, opts.hint || '↑ click it to continue', { size: 11, italic: true, color: T().css.inkDim }).setDepth(D + 1));
  }
  scene.tutorObjs = (scene.tutorObjs || []).concat(objs);
  // Wage +/- rebuilds the apply panel and would restart the same clip.
  // Speak a line once until the callout itself changes (ask_join → try_another).
  // Never talk over an NPC dialogue box — that is how join lines went silent.
  const dialogueUp = ADV.UI && ADV.UI.cardIs && ADV.UI.cardIs('dialogue');
  if (opts.vo && ADV.Music && ADV.Music.speakTutorial && scene._tutorVo !== opts.vo && !dialogueUp) {
    scene._tutorVo = opts.vo;
    ADV.Music.speakTutorial(opts.vo);
  }
  return { close };
};
Tutor.clear = function (scene) {
  for (const o of (scene.tutorObjs || [])) { try { o.destroy(); } catch (e) {} }
  scene.tutorObjs = [];
  if (ADV.UI && ADV.UI.releaseCard) ADV.UI.releaseCard('tutor');
  if (ADV.Music && ADV.Music.stopTutorial) ADV.Music.stopTutorial();
};

// ---------------------------------------------------------------- town hooks
// Called by the Town scene once the arrival notices are done.
Tutor.town = function (scene, game) {
  const s = Tutor.state(game);
  if (s.step === 'done') return false;
  const btnRect = (id) => { const b = scene.menuButtons[id]; return b ? { x: b.zone.x, y: b.zone.y, w: b.zone.width, h: b.zone.height } : null; };
  if (s.step === 'tour') {
    const next = () => {
      const item = TOUR[s.tourIdx];
      if (!item) {
        s.step = 'firstQuest'; ADV.Save.saveGame(game);
        scene.buildMenu();
        scene.openPanel('board');     // redraws with the Tier 1 solo contracts live, and the board callout
        return;
      }
      s.tourIdx++;
      Tutor.callout(scene, btnRect(item[0]), item[1], item[2], { onNext: next, label: s.tourIdx >= TOUR.length ? 'Got it' : 'Next', vo: 'tour_' + s.tourIdx });
    };
    Tutor.callout(scene, null, 'Welcome to the town', 'This is home between contracts. Nothing here moves until you do — take a moment, and I will show you what each door is for.', { onNext: next, label: 'Show me', vo: 'welcome' });
    return true;
  }
  if (s.step === 'firstQuest') {
    if (scene.currentPanel === 'board') { Tutor.panel(scene, game, 'board', scene.contentRect()); return true; }
    Tutor.callout(scene, btnRect('board'), 'Your first contract', 'Open the Quest Board and take a Tier 1 solo contract. Come back alive and we go on.', { pass: true, vo: 'first_contract' });
    return true;
  }
  if (s.step === 'trainer') {
    scene.openPanel('board');
    Tutor.callout(scene, null, 'Gold', `You came home with ${ADV.Game.player(game).inventory.gold}g. Gold buys skills at the trainer and lifts the ones you have a whole tier. Gear, food and insurance too — but skills first.`, { onNext: () => {
      Tutor.callout(scene, btnRect('trainer'), 'The Trainer', 'Open the Trainer to see what is for sale.', { pass: true, vo: 'trainer_door' });
    }, vo: 'gold' });
    return true;
  }
  if (s.step === 'vault') {
    Tutor.callout(scene, btnRect('vault'), 'The Vault', 'Gold you carry dies with you. Open the Vault to see where it is kept safe.', { pass: true, vo: 'vault_door' });
    return true;
  }
  if (s.step === 'party') {
    Tutor.callout(scene, btnRect('apply'), 'A party', 'Solo work is thin. Open Apply for Party and hire on with someone — the leader takes the risk, you take a wage.', { pass: true, vo: 'party_door' });
    return true;
  }
  if (s.step === 'partyQuest') {
    if (scene.currentPanel === 'board') { Tutor.panel(scene, game, 'board', scene.contentRect()); return true; }
    Tutor.callout(scene, btnRect('board'), 'Ride with them', 'You are hired. Open the Quest Board and queue up — the leader decides the contract, not you.', { pass: true, vo: 'ride' });
    return true;
  }
  return false;
};

// Panel-level callouts (the panel calls these after it draws)
Tutor.panel = function (scene, game, id, r) {
  const s = Tutor.state(game);
  Tutor.clear(scene);
  if (s.step === 'firstQuest' && id === 'board') {
    const b = scene.tutorFirstQuestBtn;
    Tutor.callout(scene, b ? { x: b.zone.x, y: b.zone.y, w: b.zone.width, h: b.zone.height } : null, 'Take this one', 'A neutral Tier 1 solo: beasts on the road, no banners. Vault nothing and set out.', { pass: true, vo: 'take_this' });
  }
  if (s.step === 'partyQuest' && id === 'board') {
    Tutor.callout(scene, { x: r.x + 24, y: r.y + 84, w: r.w - 220, h: 48 }, 'Queue up', 'Click Ready. The leader picks the contract; you take your wage either way.', { pass: true, hint: '↑ Ready for the quest', vo: 'queue' });
  }
  if (s.step === 'trainer' && id === 'trainer') {
    Tutor.callout(scene, { x: r.x + 24, y: r.y + 122, w: r.w - 48, h: 200 }, 'Skills for sale', 'Gold-priced skills you have never seen; free ones you witnessed in battle. Click a skill you already own to buy tutoring — 300g to Intermediate, 600g to Advanced. Nothing to buy yet? Come back richer.', { onNext: () => { s.step = 'vault'; ADV.Save.saveGame(game); scene.buildMenu(); Tutor.town(scene, game); }, label: 'Understood', vo: 'skills_sale' });
  }
  if (s.step === 'vault' && id === 'vault') {
    Tutor.callout(scene, { x: r.x + 24, y: r.y + 84, w: r.w - 48, h: 120 }, 'Safe keeping', 'This is your vault. Gold here survives your death and passes to your heirs. Before every quest you choose what to leave behind. When you marry, the two of you share one — you may draw your share once per stay.', { onNext: () => { s.step = 'party'; ADV.Save.saveGame(game); scene.buildMenu(); Tutor.town(scene, game); }, label: 'Understood', vo: 'safe_keeping' });
  }
  if (s.step === 'party' && id === 'apply') {
    Tutor.callout(scene, { x: r.x + 24, y: r.y + 84, w: r.w - 48, h: 80 }, s.declined ? 'Try another' : 'Ask to join', s.declined
      ? 'Turned away — that happens; reputation and what your sheet fills decide it. Ask the next party.'
      : 'Set your asking wage, then pick a party. Reputation opens 30g to 200g; a high ask is harder to land. After you hire on you can keep asking for raises, up to 300g.', { pass: true, hint: '↑ set a wage, then click a party', vo: s.declined ? 'try_another' : 'ask_join' });
  }
};

// The scripted application during the tutorial: first ask fails, second succeeds.
Tutor.application = function (game, party, ask) {
  const s = Tutor.state(game);
  if (s.step !== 'party') return null;
  // Do not flip declined until the leader finishes speaking — otherwise the
  // apply panel can rebuild mid-line and start try_another over their VO.
  if (!s.declined) return { accepted: false };
  const world = game.world;
  const cap = ADV.Party.maxAffordableWage(world, party, game.board);
  const named = ask != null ? ask : TUTORIAL_WAGE;
  return { accepted: true, wage: Math.max(C().GOLD.wageAcceptMin, Math.min(named, cap || C().GOLD.wageAcceptMin)) };
};
Tutor.onHired = function (game) { const s = Tutor.state(game); if (s.step === 'party') { s.step = 'partyQuest'; ADV.Save.saveGame(game); } };

// Quest outcomes move the tutorial along.
Tutor.onQuestDone = function (game, failed) {
  const s = Tutor.state(game);
  if (s.step === 'firstQuest' && !failed) s.step = 'trainer';
  else if (s.step === 'partyQuest' && !failed) { s.step = 'done'; s.finished = true; }
  ADV.Save.saveGame(game);
};
Tutor.finalWords = function (scene, game) {
  Tutor.callout(scene, null, 'That is the whole loop', 'Contracts, gold, skills, people. From here it is yours: quit the party when you want to lead or go solo, name your wage when you join the next, marry, buy knives. Death is not the end of what you know.', { label: 'Go on', vo: 'final_words' });
};

ADV.Tutor = Tutor;
})();
