// Town content panels (§20): quest board + departure, store, trainer,
// journal, codex, factions.
(function () {
'use strict';
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

const Panels = ADV.Panels = ADV.Panels || {};

const header = (scene, r, title, sub) => ADV.UI.header(scene, r, title, sub);
const keepBtn = (scene, b) => ADV.UI.keepBtn(scene, b);

// ============================================================== QUEST BOARD
Panels.questBoard = function (scene, r) {
  const game = scene.g();
  const p = scene.player();
  const stage = ADV.Game.careerStage(game);
  const roster = ADV.Game.partyRoster(game);
  const party = ADV.Party.of(game.world, p);
  const tut = ADV.Tutor && ADV.Tutor.active(game);
  const footer = tut ? 8 : 56;
  const listTop = r.y + 84;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - footer });
  scene.boardScroll = scroll;
  let y = listTop;
  if (stage === 'hireling' && party) {
    // A hireling goes where the leader goes (request 1)
    const leader = ADV.Party.leader(game.world, party);
    header(scene, r, 'Quest Board', `${leader ? leader.name : 'The leader'} picks the contract. You get paid ${p.wage || C().GOLD.hirelingWage}g a quest to be there when it starts.`);
    const pick = ADV.Game.leaderPick(game);
    if (!pick) scroll.add(T().text(scene, r.x + 24, y, 'No party contract is posted today. The leader waits.', { size: 14, italic: true, color: T().css.inkFaint }));
    else {
      scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 220, 48, 'Ready for the quest', () => Panels.departure(scene, pick),
        { size: 15, display: true, sub: 'the leader has a contract in mind — you will see it at the door', subColor: T().css.inkDim }));
    }
    scroll.extend(y + 56);
  } else {
    header(scene, r, 'Quest Board', party
      ? 'Party contracts only — a party does not take solo work. The contract must cover payroll.'
      : 'Solo contracts pay 40% for lighter work. Party contracts need bodies and pay full. The contract is the difficulty.');
    const tutOk = (q) => !ADV.Tutor || ADV.Tutor.questAllowed(game, q);
    scene.tutorFirstQuestBtn = null;
    // two columns: solo work on the left, party work on the right
    const colW = Math.floor((r.w - 56) / 2);
    const left = { x: r.x, w: colW + 24 }, right = { x: r.x + colW + 32, w: colW + 24 };
    let yl = y, yr = y;
    if (!party) {
      scroll.add(T().text(scene, left.x + 24, yl, 'SOLO CONTRACTS', { size: 13, color: T().css.inkDim })); yl += 24;
      const solo = game.board.filter(q => q.track === 'solo');
      for (const q of solo) { const b = questRow(scene, left, q, yl, tutOk(q), null, scroll); if (!scene.tutorFirstQuestBtn && tutOk(q) && q.tier === 1) scene.tutorFirstQuestBtn = b.btn; yl = b.y; }
    } else {
      scroll.add(T().text(scene, left.x + 24, yl, 'SOLO CONTRACTS', { size: 13, color: T().css.inkDim })); yl += 24;
      scroll.add(T().text(scene, left.x + 24, yl, 'A party does not take solo work.', { size: 12, italic: true, color: T().css.inkFaint, wrap: colW })); yl += 30;
    }
    scroll.add(T().text(scene, right.x + 24, yr, `PARTY CONTRACTS${roster.length < 2 ? ' (you need a party)' : ''}`, { size: 13, color: T().css.inkDim })); yr += 24;
    for (const q of game.board.filter(x => x.track === 'party')) {
      const covers = ADV.Game.contractCoversPayroll(game, q);
      yr = questRow(scene, right, q, yr, roster.length >= 2 && covers && tutOk(q), covers ? null : 'cannot cover payroll', scroll).y;
    }
    scroll.extend(Math.max(yl, yr));
  }

  if (tut) return;
  const kids = ADV.Game.youngDependents(p);
  const stayY = r.y + r.h - 48;
  const stayLabel = kids > 0 ? `Stay home with the ${kids > 1 ? 'children' : 'child'}` : 'Stay home';
  keepBtn(scene, T().button(scene, r.x + 24, stayY, 260, 38, stayLabel, () => {
    ADV.Game.stayHome(game);
    scene.promptOnce('firstStayHome');
    scene.scene.restart();
  }, { size: 14 }));
  scene.keep(T().text(scene, r.x + 300, stayY + 10, 'The world moves whether you do or not.', { size: 12, italic: true, color: T().css.inkFaint }));
};

function questRow(scene, r, q, y, enabled, note, scroll) {
  const tierLabel = q.isBoss ? 'BOSS' : 'Tier ' + q.tier;
  const fColor = note ? T().css.blood : { law: T().css.blue, criminal: T().css.purple, neutral: T().css.green }[q.factionAlignment];
  const label = `${q.name}`;
  let extra = null;
  if (ADV.Campaign2UI) { try { extra = ADV.Campaign2UI.questNote(scene.g(), q); } catch (e) { extra = null; } }
  if (!extra && q.brief) extra = q.brief;
  const themeBit = q.theme ? ' · ' + q.theme : '';
  const sub = `${tierLabel} · ${q.encounters.length} enc · ${q.payout}g · ${q.factionAlignment}${themeBit}${note ? ' · ' + note : ''}`;
  const mk = scroll ? (b) => scroll.addBtn(b) : (b) => keepBtn(scene, b);
  const btnW = r.w - 48;
  const btn = mk(T().button(scene, r.x + 24, y, btnW, 42, label, () => {
    if (!enabled) return;
    Panels.departure(scene, q);
  }, { size: 13, disabled: !enabled, sub, subColor: fColor, display: true }));
  let nextY = y + 48;
  if (extra) {
    const noteTxt = T().text(scene, r.x + 28, y + 44, extra, { size: 11, wrap: btnW - 8, color: T().css.gold });
    if (scroll) scroll.add(noteTxt); else scene.keep(noteTxt);
    const lines = Math.max(1, Math.ceil(extra.length / Math.max(1, Math.floor((btnW - 8) / 6.4))));
    nextY = y + 48 + lines * 15 + 4;
  }
  return { y: nextY, btn };
}

// Departure confirmation (§8): the carry-vs-vault decision at the moment of risk.
Panels.departure = function (scene, q) {
  const game = scene.g();
  const p = scene.player();
  const W = T().W, H = T().H;
  const info = ADV.Game.departureInfo(game, q);
  const objs = [];
  const keep = o => { objs.push(o); return o; };
  if (ADV.Tutor) ADV.Tutor.clear(scene);
  if (ADV.Notices && ADV.Notices.block) ADV.Notices.block(scene);
  keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(200).setInteractive());
  keep(T().panel(scene, W / 2 - 300, 110, 600, 520)).setDepth(201);
  const D = 202;
  const tx = (x, y2, s, o) => { const t = T().text(scene, x, y2, s, o); t.setDepth(D); return keep(t); };
  tx(W / 2, 130, 'Departure: ' + q.name, { size: 22, display: true, ox: 0.5, color: T().css.gold });
  tx(W / 2, 164, q.brief || 'Anything you carry is lost if you die. Leave what you can\'t replace.', { size: 13, ox: 0.5, italic: true, wrap: 540, color: T().css.inkDim });
  scene.promptOnce('firstDeparture');

  let vaultAmt = 0;
  const gold = p.inventory.gold;
  const goldLine = tx(W / 2 - 240, 210, '', { size: 15 });
  const render = () => goldLine.setText(`Carrying ${gold - vaultAmt}g · vaulting ${vaultAmt}g`);
  render();
  const mk = (dx, label, fn) =>
    ADV.UI.modalBtn(keep, D, T().button(scene, W / 2 - 240 + dx, 240, 108, 32, label, fn, { size: 12 }));
  mk(0, 'Vault none', () => { vaultAmt = 0; render(); });
  mk(120, 'Vault half', () => { vaultAmt = Math.floor(gold / 2); render(); });
  mk(240, 'Vault all', () => { vaultAmt = gold; render(); });

  let yy = 300;
  if (info.dependents > 0) {
    tx(W / 2 - 240, yy, `Childcare tuition: ${info.tuition}g (${info.dependents} ${info.dependents > 1 ? 'children' : 'child'})`, { size: 14, color: info.tuition > gold ? T().css.blood : T().css.blue });
    yy += 26;
  }
  if (info.payroll > 0) {
    tx(W / 2 - 240, yy, `Payroll owed on return, win or lose: ${info.payroll}g`, { size: 14, color: T().css.gold });
    yy += 26;
  }
  const going = info.roster.concat(ADV.Campaign ? ADV.Campaign.alliesFor(game, q).filter(c => !info.roster.includes(c)) : []);
  tx(W / 2 - 240, yy, 'Going: ' + going.map(c => c.name + (c.campaign ? ' (' + (c.title || 'campaign') + ')' : '')).join(', '), { size: 13, color: T().css.inkDim, wrap: 480 });
  yy += 40;
  const v = info.vault;
  if (v && v.sharedWithId) {
    const along = info.roster.some(c => c.id === (v.holderId === p.id ? v.sharedWithId : v.holderId));
    tx(W / 2 - 240, yy, along ? 'Your partner rides with you — the vault will remember it.' : 'Questing without your partner. The vault drifts toward locking.', { size: 12, italic: true, color: along ? T().css.green : T().css.inkFaint, wrap: 480 });
    yy += 26;
  }
  const insured = v && v.insuranceActive;
  tx(W / 2 - 240, yy, insured ? 'Insurance is active.' : 'No insurance on this life.', { size: 12, color: insured ? T().css.green : T().css.inkFaint });
  if (p.meal) { yy += 22; tx(W / 2 - 240, yy, `Fed: ${p.meal.name} — the bonus lasts this quest.`, { size: 12, color: T().css.green }); }
  if (ADV.Survival) {
    const sv = ADV.Survival.state(p);
    const sickNext = !sv.sick && ADV.Survival.shelterDeadline(p) <= 1;
    if (sickNext || sv.sick) {
      yy += 22;
      tx(W / 2 - 240, yy, sv.sick
        ? 'You are already Sick — another night on this roof stacks it.'
        : 'This contract is the last night on this roof. Come back Sick, and a spouse will not stay.',
        { size: 12, color: T().css.blood, wrap: 480 });
    }
  }

  const finish = () => {
    objs.forEach(o => { try { o.destroy(); } catch (e) {} });
    if (ADV.Notices && ADV.Notices.unblock) ADV.Notices.unblock(scene);
  };
  const go = T().button(scene, W / 2 - 250, 560, 240, 46, 'Set out', () => {
    const res = ADV.Game.startQuest(game, q, { vaultGold: vaultAmt });
    if (!res.ok) { ADV.Notices.toast(scene, res.error); return; }
    finish();
    if (scene.playEmbark) scene.playEmbark(q, () => scene.scene.start('Quest'));
    else scene.scene.start('Quest');
  }, { display: true, bold: true, size: 17 });
  const stay = T().button(scene, W / 2 + 10, 560, 240, 46, 'Think better of it', () => {
    finish();
    if (ADV.Tutor && ADV.Tutor.active(game)) ADV.Tutor.town(scene, game);
  }, { size: 15 });
  for (const b of [go, stay]) ADV.UI.modalBtn(keep, D, b);
};

// ============================================================== STORE
// The old Store is four doors now. Panels.store stays as the Grocer alias so
// openPanel('store') and the tutorial's 'store' tour stop keep working.
Panels.grocer = function (scene, r) {
  header(scene, r, 'Grocer', 'Eat before a contract or you come back Hungry. Star a favorite and turn Auto Buy on — the grocer sends it every other quest so the stack does not run away.');
  Panels.storeFood(scene, r);
};
Panels.store = function (scene, r) { return Panels.grocer(scene, r); };

Panels.blacksmith = function (scene, r) {
  header(scene, r, 'Blacksmith', 'A set floors matching skills at Intermediate. One set at a time — sell the one you wear for what you paid.');
  Panels.storeGear(scene, r);
};

Panels.insurance = function (scene, r) {
  header(scene, r, 'Insurance', 'Fifty gold now. If you or your spouse dies, the survivor is paid five hundred, and the policy burns when it pays.');
  scene.promptOnce('firstInsuranceOffer');
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 100, w: r.w - 16, h: r.h - 108 });
  Panels.storeInsurance(scene, r, r.y + 108, scroll);
};

Panels.maw = function (scene, r) {
  header(scene, r, 'The Maw', 'A name and a purse. They collect on the next quest. Fail, and the target knows who paid.');
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 100, w: r.w - 16, h: r.h - 108 });
  Panels.assassinsDesk(scene, r, r.y + 108, scroll);
};

Panels.storeFood = function (scene, r) {
  const game = scene.g();
  const p = scene.player();
  const s = ADV.Survival.state(p);
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 100, w: r.w - 16, h: r.h - 108 });
  let y = r.y + 104;
  if (p.meal) { scroll.add(T().text(scene, r.x + 24, y, `You have eaten: ${p.meal.name}. Buying another replaces it.`, { size: 13, color: T().css.green })); y += 22; }
  const fav = s.favoriteFoodId && ADV.DATA.FOODS.find(f => f.id === s.favoriteFoodId);
  scroll.add(T().text(scene, r.x + 24, y,
    fav ? (s.autoBuyFood ? `Auto Buy sends ${fav.name} every other quest.` : `Favorite: ${fav.name}. Turn Auto Buy on to have it sent every other quest.`)
      : 'Star a favorite, then Auto Buy — the grocer sends it every other return.',
    { size: 12, color: T().css.inkDim, wrap: r.w - 56 }));
  y += 24;
  scroll.addBtn(T().button(scene, r.x + 24, y, 220, 34, s.autoBuyFood ? 'AUTO BUY · ON' : 'AUTO BUY · OFF', () => {
    if (!s.favoriteFoodId) { ADV.Notices.toast(scene, 'Star a favorite first.'); return; }
    s.autoBuyFood = !s.autoBuyFood;
    ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel(scene.currentPanel || 'grocer');
  }, { size: 13, color: s.autoBuyFood ? T().css.green : T().css.ink, display: true }));
  y += 44;
  const cw = Math.floor((r.w - 56) / 2);
  let col = 0, colY = [y, y];
  for (const f of ADV.DATA.FOODS) {
    const bonus = Object.entries(f.bonus).map(([k, v]) => '+' + v + ' ' + k.toUpperCase()).join(' ');
    const x = r.x + 24 + col * (cw + 8);
    const isFav = s.favoriteFoodId === f.id;
    const isMeal = p.meal && p.meal.id === f.id;
    const bw = cw - 52;
    const b = T().button(scene, x, colY[col], bw, 46, `${isFav ? '★ ' : ''}${f.name} — ${f.cost}g`, () => {
      const res = ADV.Character.eat(p, f.id);
      if (!res.ok) { ADV.Notices.toast(scene, res.error === 'not enough gold' ? 'You cannot afford it.' : res.error); return; }
      if (res.cured) scene.promptOnce('firstMealCure');
      ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel(scene.currentPanel || 'grocer');
    }, { size: 14, sub: `${bonus} for one quest · ${f.blurb}`, subColor: isMeal ? T().css.green : (isFav ? T().css.gold : T().css.inkDim), disabled: p.inventory.gold < f.cost, display: true });
    scroll.addBtn(b);
    scroll.addBtn(T().button(scene, x + bw + 6, colY[col], 42, 46, isFav ? '★' : '☆', () => {
      s.favoriteFoodId = isFav ? null : f.id;
      if (!s.favoriteFoodId) s.autoBuyFood = false;
      ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel(scene.currentPanel || 'grocer');
    }, { size: 18, color: isFav ? T().css.gold : T().css.inkDim, display: true }));
    colY[col] += 54;
    col = colY.indexOf(Math.min(...colY));
  }
  scroll.extend(Math.max(...colY));
};

Panels.storeGear = function (scene, r) {
  const game = scene.g();
  const p = scene.player();
  const world = game.world;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 100, w: r.w - 16, h: r.h - 108 });
  let y = r.y + 104;
  const spouse = p.partnerId ? ADV.World.byId(world, p.partnerId) : null;
  for (const [id, set] of Object.entries(ADV.DATA.GEAR_SETS)) {
    if (set.campaign) continue;   // faction sets are issued by their halls, never sold
    // show which of the player's skills the set would actually raise (§20)
    const affected = p.perks.concat(p.actives).filter(e => {
      const sk = ADV.DATA.SKILLS[e.skillId];
      return sk && sk.archetype && set.archetypes.includes(sk.archetype) && e.level < C().GEAR_SET_FLOOR_LEVEL;
    }).map(e => ADV.DATA.SKILLS[e.skillId].name);
    const owned = p.equippedSet === id;
    const sub = owned ? 'worn now' : p.equippedSet ? 'sell your current set first — one set at a time' : affected.length ? 'would raise: ' + affected.join(', ') : 'raises nothing you carry — ' + set.cost + 'g wasted';
    const b = T().button(scene, r.x + 24, y, r.w - 320, 46, `${set.name} — ${set.cost}g`, () => {
      if (owned || p.equippedSet) return;
      if (p.inventory.gold < set.cost) { ADV.Notices.toast(scene, 'You cannot afford it.'); return; }
      p.inventory.gold -= set.cost;
      p.equippedSet = id;
      ADV.Save.saveGame(game);
      scene.promptOnce('firstAffordableSet');
      scene.refreshAll(); scene.openPanel(scene.currentPanel || 'blacksmith');
    }, { size: 15, sub, subColor: affected.length && !owned && !p.equippedSet ? T().css.green : T().css.inkFaint, disabled: owned || !!p.equippedSet, display: true });
    scroll.addBtn(b);
    // the spouse shops with their own purse (request 10)
    if (spouse && spouse.alive && !spouse.equippedSet) {
      scroll.addBtn(T().button(scene, r.x + r.w - 280, y, 250, 46, `${spouse.name.split(' ')[0]} buys it (${spouse.inventory.gold}g)`, () => {
        if (spouse.inventory.gold < set.cost) { ADV.Notices.toast(scene, `${spouse.name} cannot afford it.`); return; }
        spouse.inventory.gold -= set.cost; spouse.equippedSet = id;
        ADV.World.feed(world, `${spouse.name} bought a ${set.name}.`, [spouse.id]);
        ADV.Save.saveGame(game); scene.openPanel(scene.currentPanel || 'blacksmith');
      }, { size: 12, disabled: spouse.inventory.gold < set.cost, color: T().css.purple }));
    }
    y += 52;
  }
  if (p.equippedSet) {
    const cur = ADV.DATA.GEAR_SETS[p.equippedSet];
    const back = (cur && cur.cost) || C().GOLD.gearSet;
    scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 320, 40, `Sell the ${cur.name} — ${back}g back`, () => {
      ADV.Notices.confirm(scene, 'Sell ' + cur.name + '?', `You get ${back}g and lose the level-${cur.floor || C().GEAR_SET_FLOOR_LEVEL} floor it gave your skills.`, 'Sell it', () => {
        p.equippedSet = null; p.inventory.gold += back;
        ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel(scene.currentPanel || 'blacksmith');
      });
    }, { size: 14, color: T().css.gold }));
    y += 48;
  }
  if (spouse && spouse.alive && spouse.equippedSet) { scroll.add(T().text(scene, r.x + 24, y, `${spouse.name} wears the ${ADV.DATA.GEAR_SETS[spouse.equippedSet].name}.`, { size: 12, italic: true, color: T().css.inkDim })); y += 24; }
  scroll.extend(y + 24);
};

// Insurance desk — cut out of the old Store gear tab, not rewritten.
Panels.storeInsurance = function (scene, r, y, scroll) {
  const game = scene.g();
  const p = scene.player();
  const put = scroll || { add: o => scene.keep(o), addBtn: b => keepBtn(scene, b), extend: () => {} };
  const v = ADV.Vault.of(game.world, p);
  const insured = v && v.insuranceActive;
  const bi = T().button(scene, r.x + 24, y, r.w - 48, 44,
    insured ? 'Insurance active' : `Insurance premium — ${C().GOLD.insurancePremium}g`, () => {
      if (insured) return;
      if (ADV.Vault.payPremium(game.world, p)) { ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel(scene.currentPanel || 'insurance'); }
      else ADV.Notices.toast(scene, 'You cannot afford the premium.');
    }, { size: 15, disabled: insured, sub: `pays ${C().GOLD.insurancePayout}g to the survivor if you or your spouse dies`, display: true });
  put.addBtn(bi);
  put.extend(y + 56);
};

// The Maw takes contracts on anyone (request): 100g per point of the
// target's reputation level. Resolved on the world clock like any NPC hit.
Panels.assassinsDesk = function (scene, r, y, scroll) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  const put = scroll || { add: o => scene.keep(o), addBtn: b => keepBtn(scene, b), extend: () => {} };
  put.add(T().text(scene, r.x + 24, y, "THE MAW'S DESK", { size: 13, color: T().css.purple })); y += 18;
  put.add(T().text(scene, r.x + 24, y, 'A name and a purse. 100g per reputation level of the target. They collect on the next quest.', { size: 12, color: T().css.inkDim, wrap: r.w - 48 })); y += 26;
  const targets = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster && !c.registryId && !c.campaign && world.metIds.includes(c.id) && c.id !== p.partnerId)
    .sort((a, b) => ADV.Rel.score(world, p.id, a.id) - ADV.Rel.score(world, p.id, b.id));
  const pending = world.mawContracts || [];
  for (const c of targets) {
    const fee = ADV.Game.assassinFee(c);
    const has = pending.some(k => k.targetId === c.id);
    put.addBtn(T().button(scene, r.x + 24, y, 300, 34, `${c.name} — ${fee}g`, () => {
      if (has) return;
      if (p.inventory.gold < fee) { ADV.Notices.toast(scene, 'The Maw does not extend credit.'); return; }
      ADV.Notices.confirm(scene, 'Send the Maw after ' + c.name + '?', `${fee}g, paid now. They attempt it on the world clock; if it fails, ${c.name} will know who paid.`, 'Pay them', () => {
        ADV.Game.hireAssassins(game, c.id);
        ADV.Notices.toast(scene, 'A knife has been bought.');
        scene.refreshAll(); scene.openPanel(scene.currentPanel || 'maw');
      }, T().css.blood);
    }, { size: 12, disabled: has, sub: has ? 'contract out' : `rep ${c.reputation} · ${ADV.Rel.tierBetween(world, c.id, p.id)}`, subColor: T().css.inkFaint }));
    y += 40;
  }
  if (!targets.length) put.add(T().text(scene, r.x + 24, y, 'You know nobody worth the price yet.', { size: 12, italic: true, color: T().css.inkFaint }));
  put.extend(y + 24);
};

Panels.trainer = function (scene, r) {
  const game = scene.g();
  const p = scene.player();
  header(scene, r, 'Trainer', null);
  scene.keep(T().text(scene, r.x + 24, r.y + 50,
    `First ${C().FREE_STARTING_SKILLS} are free. Witnessed skills are free. The rest cost ${C().GOLD.skillUnwitnessed}g. Click a known active to buy tutoring: ${C().GOLD.tutorIntermediate}g to Intermediate, ${C().GOLD.tutorAdvanced}g to Advanced.`,
    { size: 13, color: T().css.inkDim, wrap: r.w - 48 }));
  // tabs sit below the wrapped blurb so "600g to Advanced" is never under Core
  const tabs = [{ id: 'core', label: 'Core' }];
  for (const fid of ['maw', 'antler', 'varenholm', 'bell', 'green', 'tally', 'navy']) {
    const f = ADV.DATA.FACTIONS[fid];
    if (!f) continue;
    const any = ADV.DATA.TRAINER_POOL.some(id => { const sk = ADV.DATA.SKILLS[id]; return sk.faction === fid && (ADV.SkillSys.knows(p, id) || ADV.SkillSys.purchasable(p, id, game.meta)); });
    const unlocked = f.campaign2 ? game.meta.campaign2SkillsUnlocked : game.meta.campaignSkillsUnlocked;
    if (any || unlocked) tabs.push({ id: fid, label: f.short ? f.short.replace(/^the /i, '') : f.name });
  }
  scene.trainerTab = tabs.some(t => t.id === scene.trainerTab) ? scene.trainerTab : 'core';
  let tx = r.x + 24;
  const tabW = tabs.length > 5 ? 112 : 150;
  const tabY = r.y + 96;
  for (const t of tabs) {
    const active = scene.trainerTab === t.id;
    keepBtn(scene, T().button(scene, tx, tabY, tabW, 30, t.label, () => { scene.trainerTab = t.id; scene.openPanel('trainer'); },
      { size: tabs.length > 5 ? 11 : 12, fill: active ? 0x3a3020 : undefined, color: active ? T().css.gold : T().css.inkDim }));
    tx += tabW + 8;
  }
  const gridTop = r.y + 136;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: gridTop, w: r.w - 16, h: r.y + r.h - gridTop - 8 });
  const cw3 = Math.floor((r.w - 64) / 3);
  const cols = [r.x + 24, r.x + 32 + cw3, r.x + 40 + cw3 * 2];
  let col = 0, colY = [gridTop + 4, gridTop + 4, gridTop + 4];
  const ARCH_ORDER = ['fighter', 'tank', 'rogue', 'ranger', 'mage', 'druid', 'healer'];
  const ARCH_LABEL = { fighter: 'Fighter', tank: 'Tank', rogue: 'Rogue', ranger: 'Ranger', mage: 'Mage', druid: 'Druid', healer: 'Healer', other: 'Other' };
  const pool = ADV.DATA.TRAINER_POOL.filter(id => { const sk = ADV.DATA.SKILLS[id]; return scene.trainerTab === 'core' ? !sk.faction : sk.faction === scene.trainerTab; });
  const grouped = [];
  const buckets = {};
  for (const id of pool) {
    const arch = ADV.DATA.SKILLS[id].archetype || 'other';
    if (!buckets[arch]) { buckets[arch] = []; grouped.push(arch); }
    buckets[arch].push(id);
  }
  grouped.sort((a, b) => {
    const ia = ARCH_ORDER.indexOf(a), ib = ARCH_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  for (const arch of grouped) {
    const rowY = Math.max(...colY);
    scroll.add(T().text(scene, r.x + 24, rowY + 6, ARCH_LABEL[arch] || arch, { size: 12, color: T().css.gold }));
    colY = [rowY + 26, rowY + 26, rowY + 26];
    col = 0;
    for (const id of buckets[arch]) {
    const sk = ADV.DATA.SKILLS[id];
    const known = ADV.SkillSys.knows(p, id);
    const cost = ADV.SkillSys.trainerCost(p, id);
    const state = ADV.SkillSys.journalState(p, id);
    const locked = !known && !ADV.SkillSys.purchasable(p, id, game.meta);
    let label = sk.name + (sk.kind === 'perk' ? ' ◆' : '');
    let sub, subColor = T().css.inkFaint;
    if (known) { sub = 'known'; subColor = T().css.green; }
    else if (locked) { sub = sk.kind === 'perk' ? 'join the faction' : 'witness it in their campaign'; subColor = T().css.inkFaint; }
    else if (sk.forbidden) { sub = sk.warning; subColor = T().css.blood; }
    else if (cost === 0) {
      const seen = state === 'Witnessed' || state === 'Eligible';
      const je = (p.journal && p.journal[id]) || {};
      sub = seen ? (je.from ? 'seen in battle · ' + je.from : 'seen in battle — free') : 'free';
      subColor = T().css.gold;
    }
    else sub = cost + 'g';
    // a witnessed skill wears a gold border: you took a hit for this one
    const witnessedFree = !known && !locked && cost === 0 && (state === 'Witnessed' || state === 'Eligible');
    const x = cols[col];
    const b = T().button(scene, x, colY[col], cw3 - 6, 40, label, () => {
      if (known) { Panels.forgetDialog(scene, id); return; }
      if (locked) { ADV.Notices.toast(scene, sub); return; }
      Panels.learnDialog(scene, id, cost);
    }, { size: 12, sub, subColor, fill: known ? 0x232a20 : witnessedFree ? 0x2e2718 : undefined,
         edge: witnessedFree ? T().c.gold : undefined, disabled: locked });
    ADV.Tooltip.attach(scene, b.zone, () => ADV.SkillInfo.describe(p, id));
    scroll.addBtn(b);
    colY[col] += 46;
    col = colY.indexOf(Math.min(...colY));
    }
  }
  scroll.extend(Math.max(...colY));
};

Panels.learnDialog = function (scene, id, cost) {
  const game = scene.g();
  const p = scene.player();
  const sk = ADV.DATA.SKILLS[id];
  const kind = sk.kind === 'perk' ? 'perk' : 'active';
  const atCap = ADV.SkillSys.atCapacity(p, kind);
  const je = p.journal[id];
  const lines = [sk.desc];
  if (je && je.sawTier && je.sawTier !== 'basic') {
    lines.push(`You saw it become ${sk.tiers[je.sawTier].name}. This is what it grows into.`);
  }
  if (sk.forbidden) lines.push(sk.warning);
  ADV.Notices.confirm(scene, sk.name, lines.join('\n\n') + (cost ? `\n\nCost: ${cost}g` : '\n\nFree.'),
    atCap ? 'Choose what to forget' : 'Learn it', () => {
      if (cost > p.inventory.gold) { ADV.Notices.toast(scene, 'Not enough gold.'); return; }
      if (atCap) { Panels.forgetToLearn(scene, id, cost, kind); return; }
      const res = ADV.SkillSys.learn(p, id, {});
      if (res.ok) { if (cost) p.inventory.gold -= cost; ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('trainer'); }
      else ADV.Notices.toast(scene, res.error);
    }, sk.forbidden ? T().css.blood : null);
};

Panels.forgetToLearn = function (scene, newId, cost, kind) {
  const game = scene.g();
  const p = scene.player();
  const list = (kind === 'perk' ? p.perks : p.actives).filter(e => !ADV.DATA.SKILLS[e.skillId].noSlot);
  ADV.Notices.pickOne(scene, 'Let something go', 'A dropped skill returns to your journal, and keeps its level forever.',
    list.map(e => ({ label: `${ADV.DATA.SKILLS[e.skillId].name} · L${e.level}`, value: e.skillId })),
    (skillId) => {
      ADV.SkillSys.forget(p, skillId);
      const res = ADV.SkillSys.learn(p, newId, {});
      if (res.ok && cost) p.inventory.gold -= cost;
      ADV.Save.saveGame(game);
      scene.refreshAll(); scene.openPanel('trainer');
    });
};

Panels.forgetDialog = function (scene, id) {
  const game = scene.g();
  const p = scene.player();
  const sk = ADV.DATA.SKILLS[id];
  const entry = p.perks.concat(p.actives).find(e => e.skillId === id);
  const offers = ADV.SkillSys.tutorOffers(p, id);
  const opts = offers.map(o => ({ label: `Tutoring to ${sk.tiers[o.tier].name} (L${o.level}) — ${o.cost}g`, value: 'tutor:' + o.tier }));
  opts.push({ label: 'Forget it (keeps its level in the journal)', value: 'forget' });
  opts.push({ label: 'Leave it', value: null });
  ADV.Notices.pickOne(scene, sk.name + ' · L' + (entry ? entry.level : 1), offers.length ? 'The trainer can lift it a whole tier for gold, or you can set it down.' : 'Forget this skill? It returns to Eligible in your journal and keeps its level.', opts, (v) => {
    if (!v) return;
    if (v === 'forget') { ADV.SkillSys.forget(p, id); }
    else {
      const r = ADV.SkillSys.tutor(p, id, v.split(':')[1]);
      if (!r.ok) { ADV.Notices.toast(scene, r.error === 'not enough gold' ? 'Not enough gold.' : r.error); return; }
      ADV.Notices.toast(scene, `${sk.name} is L${r.level} now.`);
    }
    ADV.Save.saveGame(game);
    scene.refreshAll(); scene.openPanel('trainer');
  });
};

// ============================================================== JOURNAL
Panels.journal = function (scene, r) {
  const p = scene.player();
  header(scene, r, 'Skill Journal', 'Every sighting is permanent, across every life. The journal is the real save file.');
  const listTop = r.y + 88;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  const states = { Mastered: T().css.purple, Learned: T().css.green, Eligible: T().css.gold, Witnessed: T().css.blue };
  const all = ADV.DATA.TRAINER_POOL;
  const cols = [r.x + 24, r.x + Math.floor(r.w / 2) + 8];
  let colY = [listTop, listTop], col = 0;
  let shown = 0;
  for (const id of all) {
    const st = ADV.SkillSys.journalState(p, id);
    if (!st) continue;
    shown++;
    const sk = ADV.DATA.SKILLS[id];
    const je = p.journal[id] || {};
    const lvl = (p.skillLevels[id] || {}).level || (ADV.SkillSys.entryFor(p, id) || {}).level || 0;
    let line = `${sk.name}`;
    if (je.sawTier && je.sawTier !== 'basic') line = `${sk.tiers[je.sawTier].name} → ${sk.name} (root)`;
    scroll.add(T().text(scene, cols[col], colY[col], line, { size: 14 }));
    const seenFrom = je.from ? ' · seen at ' + je.from : '';
    scroll.add(T().text(scene, cols[col], colY[col] + 17, `${st}${lvl ? ' · L' + lvl : ''}${seenFrom}`, { size: 11, color: states[st] }));
    scroll.add(ADV.Tooltip.attachZone(scene, cols[col], colY[col], Math.floor(r.w / 2) - 40, 36, () => ADV.SkillInfo.describe(p, id)));
    colY[col] += 42;
    col = colY[0] <= colY[1] ? 0 : 1;
  }
  if (!shown) scroll.add(T().text(scene, r.x + 24, listTop, 'Nothing witnessed yet. Fight things, and watch what they do.', { size: 14, italic: true, color: T().css.inkFaint }));
  scroll.extend(Math.max(...colY));
};

// ============================================================== CODEX
Panels.codex = function (scene, r) {
  const game = scene.g();
  header(scene, r, 'Codex', 'Everything the world has taught you so far.');
  const listTop = r.y + 84;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.h - 84 - 64 });
  let y = listTop;
  for (const c of ADV.DATA.PREGAME_CARDS) {
    scroll.add(T().text(scene, r.x + 24, y, '· ' + c, { size: 13, wrap: r.w - 60 }));
    y += 24;
  }
  y += 8;
  const unlocked = game.meta.codexUnlocked || [];
  if (unlocked.length) {
    scroll.add(T().text(scene, r.x + 24, y, 'LEARNED THE HARD WAY', { size: 12, color: T().css.inkDim })); y += 22;
    for (const id of unlocked) {
      scroll.add(T().text(scene, r.x + 24, y, '· ' + ADV.DATA.PROMPTS[id], { size: 13, wrap: r.w - 60, color: T().css.gold }));
      y += 24;
    }
  }
  scroll.extend(y);
  const b = T().button(scene, r.x + 24, r.y + r.h - 56, 220, 36, 'Erase all save data', () => {
    ADV.Notices.confirm(scene, 'Erase everything?', 'The journal, every life, every skill level. This is the true death.', 'Erase it', () => {
      ADV.Save.reset();
      scene.scene.start('Title');
    }, T().css.blood);
  }, { size: 13, color: T().css.blood });
  keepBtn(scene, b);
};

// ============================================================== SETTINGS
Panels.settings = function (scene, r) {
  header(scene, r, 'Settings', 'These stay in this browser. A new life keeps them.');
  const scale = (ADV.Prefs && ADV.Prefs.textScale()) || 1;
  const pause = !!(ADV.Prefs && ADV.Prefs.pauseEnemy());
  let y = r.y + 96;
  scene.keep(T().text(scene, r.x + 24, y, 'Text and notifications', { size: 16, color: T().css.gold })); y += 28;
  scene.keep(T().text(scene, r.x + 24, y, 'Larger type for menus, toasts, and combat labels.', { size: 13, color: T().css.inkDim, wrap: r.w - 48 })); y += 36;
  const scales = [[1, 'Normal'], [1.2, 'Large'], [1.35, 'Larger']];
  let x = r.x + 24;
  for (const [n, lbl] of scales) {
    const on = Math.abs(scale - n) < 0.05;
    ADV.UI.keepBtn(scene, T().button(scene, x, y, 120, 40, lbl, () => {
      ADV.Prefs.setTextScale(n);
      scene.buildMenu();
      scene.buildCharacterPanel();
      scene.openPanel('settings');
    }, { size: 14, fill: on ? 0x2a3a22 : undefined, color: on ? T().css.green : T().css.ink, edge: on ? T().c.green : undefined }));
    x += 132;
  }
  y += 64;
  scene.keep(T().text(scene, r.x + 24, y, 'Enemy turns', { size: 16, color: T().css.gold })); y += 28;
  scene.keep(T().text(scene, r.x + 24, y, 'When on, each enemy waits for you before they act — auto does not rush their turn.', { size: 13, color: T().css.inkDim, wrap: r.w - 48 })); y += 40;
  ADV.UI.keepBtn(scene, T().button(scene, r.x + 24, y, 280, 42, pause ? 'Pause enemy turns — on' : 'Pause enemy turns — off', () => {
    ADV.Prefs.setPauseEnemy(!pause);
    scene.openPanel('settings');
  }, { size: 14, fill: pause ? 0x2a3a22 : undefined, color: pause ? T().css.green : T().css.ink, edge: pause ? T().c.green : undefined }));
};

// ============================================================== FACTIONS
Panels.factions = function (scene, r) {
  const p = scene.player();
  header(scene, r, 'Faction Status', 'The quests you accept decide who trusts you. Standing opens roads that skills cannot.');
  let y = r.y + 100;
  const rows = [['Law', 'law', T().c.blue], ['Criminal', 'criminal', T().c.purple], ['Neutral', 'neutral', T().c.green]];
  for (const [label, key, color] of rows) {
    const v = p.factionStanding[key];
    scene.keep(T().text(scene, r.x + 24, y, label, { size: 16, display: true }));
    scene.keep(T().bar(scene, r.x + 150, y + 2, 360, 16, (v + 100) / 200, color));
    scene.keep(T().text(scene, r.x + 524, y, String(v), { size: 14, color: T().css.inkDim }));
    if (v >= 30) scene.keep(T().text(scene, r.x + 24, y + 22, key === 'law' ? 'Guards and sentinels stand aside for you.' : key === 'criminal' ? 'Bandits and cultists let you pass.' : 'You are welcome at most fires.', { size: 12, italic: true, color: T().css.inkFaint }));
    y += 62;
  }
  scene.keep(T().text(scene, r.x + 24, y + 10, 'Committing to one side locks you out of the other\'s company — and the skills you would have seen them use.', { size: 13, italic: true, color: T().css.inkDim, wrap: r.w - 60 }));
};

// ============================================================== HOME
Panels.homeFamily = function (scene, scroll, r, y, p, game) {
  const world = game.world;
  const family = ADV.Rel.familyOf(world, p);
  scroll.add(T().text(scene, r.x + 24, y, 'YOUR FAMILY', { size: 12, color: T().css.gold }));
  y += 22;
  if (!family.length) {
    scroll.add(T().text(scene, r.x + 36, y, 'No spouse or children yet. The people you marry and raise will be listed here, living and dead.', {
      size: 13, italic: true, color: T().css.inkFaint, wrap: r.w - 80,
    }));
    return y + 40;
  }
  for (const f of family) {
    const face = f.ch || { sex: f.role === 'wife' || f.role === 'daughter' ? 'f' : 'm', portraitSeed: ADV.hashStr ? ADV.hashStr(f.id || f.name) : 1 };
    try {
      const pk = ADV.Portraits.key(scene, face);
      const img = scene.add.image(r.x + 48, y + 22, pk).setDisplaySize(28, 36);
      if (!f.alive) img.setTint(0x777777);
      scroll.add(img);
    } catch (e) { /* portrait optional for unnamed young */ }
    const age = f.young && f.age != null ? `, age ${f.age}` : '';
    const mark = f.alive ? '' : '  ·  deceased';
    scroll.add(T().text(scene, r.x + 72, y + 4, `${f.name} · ${f.role}${age}${mark}`, {
      size: 14, color: f.alive ? T().css.ink : T().css.inkFaint,
    }));
    y += 44;
  }
  y += 10;
  return y;
};

Panels.home = function (scene, r) {
  const game = scene.g();
  const p = scene.player();
  const cur = ADV.Housing.of(p);
  header(scene, r, 'Home', cur.id === 'camp'
    ? 'You sleep outside the walls. Gold buys a roof, and a finer roof changes the town behind these menus.'
    : ('You keep ' + cur.name + '. Paying more upgrades the house — you never move backwards.'));
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 96, w: r.w - 16, h: r.h - 108 });
  let y = r.y + 100;
  y = Panels.homeFamily(scene, scroll, r, y, p, game);
  for (const h of ADV.Housing.list()) {
    const owned = cur.id === h.id;
    const worse = ADV.Housing.rank(h.id) < ADV.Housing.rank(cur.id);
    const can = !owned && !worse && h.cost > 0 && p.inventory.gold >= h.cost;
    let sub = owned ? 'where you live'
      : (worse ? 'you have moved on'
        : (h.cost ? h.cost + 'g' + (h.spouses > 1 ? ' · ' + h.spouses + ' spouses' : '') : 'the roadside'));
    if (ADV.Survival && !worse) {
      const left = ADV.Survival.shelterDeadline(p);
      if (owned && left !== Infinity) sub += ' · ' + (left === 1 ? '1 night left before sickness' : left + ' nights left before sickness');
      else if (owned && left === Infinity) sub += ' · the clock ended here';
      else if (!owned && h.cost > 0) sub += ' · buying this starts the clock over';
    }
    const label = h.name;
    scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 56, 52, label, () => {
      if (!can) return;
      const res = ADV.Housing.buy(game, h.id);
      if (!res.ok) { ADV.Notices.toast(scene, res.error); return; }
      if (res.first) {
        const line = ADV.Game.prompt(game, 'firstHome');
        if (line) ADV.Notices.toast(scene, line);
      }
      ADV.Save.saveGame(game);
      scene.scene.restart();
    }, { size: 16, display: true, disabled: !can && !owned, sub, subColor: owned ? T().css.gold : (can ? T().css.green : T().css.inkFaint) }));
    y += 58;
    scroll.add(T().text(scene, r.x + 36, y, h.blurb, { size: 12, color: T().css.inkDim, wrap: r.w - 80 }));
    y += 32;
  }
  scroll.extend(y);
};

})();
