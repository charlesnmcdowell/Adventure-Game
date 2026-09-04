// Town content panels, part 2: parties, roster + event feed, relationships +
// vault. Plus the Notices modal library.
(function () {
'use strict';
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

const Panels = ADV.Panels = ADV.Panels || {};

const header = (scene, r, title, sub) => ADV.UI.header(scene, r, title, sub);

function wageStepper(scene, x, y, onDelta) {
  let bx = x;
  for (const [d, lbl] of [[-10, '−10'], [-5, '−5'], [5, '+5'], [10, '+10']]) {
    ADV.UI.keepBtn(scene, T().button(scene, bx, y, 48, 34, lbl, () => onDelta(d), { size: 13 }));
    bx += 54;
  }
}

// ============================================================== APPLY FOR PARTY
Panels.applyParty = function (scene, r) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  const tut = ADV.Tutor && ADV.Tutor.step(game) === 'party';
  const applyMin = C().GOLD.wageAcceptMin;
  const applyMax = ADV.Party.applyAskMax(p);
  const raiseMax = C().GOLD.wageRaiseMax || 300;
  header(scene, r, 'Apply for Party', 'Name a wage before they hire you. Reputation opens the range; raises come after you sign.');
  const myParty = ADV.Party.of(world, p);
  const isLeader = !!(myParty && myParty.leaderId === p.id);
  const canAsk = !myParty;
  let listTop = r.y + 88;
  if (canAsk) {
    const seed = tut && ADV.Tutor && ADV.Tutor.wage ? ADV.Tutor.wage() : ADV.Party.hirelingWageFor(p);
    if (scene.askWage == null) scene.askWage = seed;
    scene.askWage = ADV.Party.clampApplyWage(p, scene.askWage);
    scene.keep(T().text(scene, r.x + 24, r.y + 96, `Ask ${scene.askWage}g a quest`, { size: 16, color: T().css.gold }));
    wageStepper(scene, r.x + r.w - 248, r.y + 88, d => {
      scene.askWage = ADV.Party.clampApplyWage(p, scene.askWage + d);
      scene.openPanel('apply');
    });
    scene.keep(T().text(scene, r.x + 24, r.y + 132, `Your reputation opens ${applyMin}–${applyMax}g. A high ask is harder to land; after you sign, raises can climb to ${raiseMax}g.`, { size: 12, italic: true, color: T().css.inkFaint, wrap: r.w - 48 }));
    listTop = r.y + 172;
  } else if (myParty && !isLeader) {
    const cur = p.wage || C().GOLD.hirelingWage;
    const leader = ADV.Party.leader(world, myParty);
    const asked = p.raiseAskedAt != null && p.raiseAskedAt >= (world.questClock | 0);
    const atCap = cur >= raiseMax;
    if (scene.raiseAsk == null || scene.raiseAsk <= cur) scene.raiseAsk = Math.min(raiseMax, cur + (C().GOLD.wageRaiseStep || 10));
    scene.raiseAsk = Math.max(cur + 5, Math.min(raiseMax, scene.raiseAsk | 0));
    scene.keep(T().text(scene, r.x + 24, r.y + 96, `You ride with ${leader ? leader.name : 'a party'} for ${cur}g a quest.`, { size: 15 }));
    if (!atCap) {
      scene.keep(T().text(scene, r.x + 24, r.y + 124, `Ask a raise to ${scene.raiseAsk}g`, { size: 16, color: T().css.gold }));
      wageStepper(scene, r.x + r.w - 248, r.y + 116, d => {
        scene.raiseAsk = Math.max(cur + 5, Math.min(raiseMax, (scene.raiseAsk | 0) + d));
        scene.openPanel('apply');
      });
      ADV.UI.keepBtn(scene, T().button(scene, r.x + 24, r.y + 158, 260, 36, asked ? 'Raise asked this stay' : `Ask for ${scene.raiseAsk}g`, () => {
        if (asked) { ADV.Notices.toast(scene, 'You already asked this stay. Ride a quest first.'); return; }
        const res = ADV.Party.requestRaise(world, game.rng, p, scene.raiseAsk);
        if (!res.ok) { ADV.Notices.toast(scene, res.error); return; }
        ADV.Notices.toast(scene, res.accepted
          ? `${leader ? leader.name : 'They'} agreed. ${res.wage}g a quest now.`
          : `${leader ? leader.name : 'They'} refused. Reputation talks.`);
        if (res.accepted) scene.raiseAsk = Math.min(raiseMax, res.wage + (C().GOLD.wageRaiseStep || 10));
        ADV.Save.saveGame(game);
        scene.refreshAll(); scene.openPanel('apply');
      }, { size: 14, disabled: asked }));
    } else {
      scene.keep(T().text(scene, r.x + 24, r.y + 124, `You are at the ${raiseMax}g ceiling.`, { size: 13, italic: true, color: T().css.inkFaint }));
    }
    listTop = r.y + 204;
  }
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  let y = listTop + 4;
  if (myParty) {
    const leader = ADV.Party.leader(world, myParty);
    if (isLeader) {
      scroll.add(T().text(scene, r.x + 24, y, 'You lead your own party.', { size: 15 }));
      y += 30;
      scroll.addBtn(T().button(scene, r.x + 24, y, 280, 38, `Disband — ${C().GOLD.partyStartupCapital}g back`, () => Panels.foldParty(scene), { size: 14 }));
      y += 50;
    } else {
      scroll.addBtn(T().button(scene, r.x + 24, y, 200, 38, 'Quit the party', () => {
        ADV.Party.removeMember(world, myParty, p.id);
        p.raiseAskedAt = null;
        ADV.Save.saveGame(game);
        scene.buildMenu();
        scene.refreshAll(); scene.openPanel('apply');
      }, { size: 14 }));
      y += 50;
    }
  }
  const parties = world.parties.filter(x => x.leaderId !== p.id && !x.memberIds.includes(p.id));
  if (!parties.length) scroll.add(T().text(scene, r.x + 24, y, 'No party is hiring today.', { size: 14, italic: true, color: T().css.inkFaint }));
  for (const party of parties) {
    const leader = ADV.Party.leader(world, party);
    if (!leader || !leader.alive) continue;
    const members = ADV.Party.members(world, party);
    const odds = ADV.Party.applicationOdds(world, party, p);
    const cap = ADV.Party.maxAffordableWage(world, party, game.board);
    const ask = ADV.Party.clampApplyWage(p, scene.askWage != null ? scene.askWage
      : (p.wage || (tut && ADV.Tutor ? ADV.Tutor.wage() : ADV.Party.hirelingWageFor(p))));
    // a high ask costs odds; an ask past the purse is refused outright
    let finalOdds = odds.odds;
    const askFloor = C().GOLD.hirelingWage;
    const askCeil = Math.max(askFloor + 1, applyMax);
    if (!tut && finalOdds > 0) finalOdds = ask > cap ? 0 : Math.max(0.05, finalOdds * (1 - Math.max(0, ask - askFloor) / (askCeil - askFloor)));
    const archs = new Set();
    for (const m of [leader].concat(members)) for (const e of m.actives) {
      const sk = ADV.DATA.SKILLS[e.skillId];
      if (sk && sk.archetype) archs.add(sk.archetype);
    }
    const align = ADV.Party.alignment(world, party);
    const alignLabel = ADV.Party.alignmentLabel(align);
    const bond = Panels.hireBond(world, p, leader);
    const alignColor = bond ? bond.color : ({ law: T().css.blue, criminal: T().css.purple, neutral: T().css.green }[align] || T().css.inkDim);
    const sub = `${alignLabel}${bond ? ' · ' + bond.label : ''} · ${members.length + 1}/${C().PARTY_MAX} · runs ${[...archs].join(', ') || 'nothing'} · odds ${finalOdds ? Math.round(finalOdds * 100) + '%' : '—'}${odds.why === 'hatred' ? ' (bad blood)' : ''}${!tut && ask > cap ? ` · can pay at most ${cap}g` : ''}`;
    scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 240, 46, `${leader.name}'s party — ${alignLabel}`, () => {
      if (isLeader) { ADV.Notices.toast(scene, 'You already have a party.'); return; }
      if (ADV.Party.roster(world, party).length >= C().PARTY_MAX) { ADV.Notices.toast(scene, 'They are full.'); return; }
      const askNow = () => {
        let accepted, wage = ask;
        const scripted = ADV.Tutor ? ADV.Tutor.application(game, party, ask) : null;
        if (scripted) { accepted = scripted.accepted; if (scripted.wage != null) wage = scripted.wage; }
        else {
          if (odds.odds <= 0) { scene.promptOnce('firstBlockedHire'); ADV.Notices.toast(scene, 'They will not have you.'); return; }
          if (ask > cap) { ADV.Notices.toast(scene, `${leader.name} cannot pay that. ${cap}g at most.`); return; }
          accepted = Math.random() < finalOdds;
        }
        scene.speak(leader, accepted ? ADV.DialogueBox.bandFor(game, leader) : 'general', {}, () => {
          if (accepted) {
            const cur = ADV.Party.of(world, p);
            if (cur && cur.leaderId !== p.id) ADV.Party.removeMember(world, cur, p.id);
            wage = ADV.Party.clampApplyWage(p, wage);
            party.memberIds.push(p.id); party.wages[p.id] = wage;
            p.partyId = party.id; p.leaderId = leader.id; p.wage = wage;
            ADV.World.met(world, leader.id);
            if (ADV.Tutor) ADV.Tutor.onHired(game);
            ADV.Notices.toast(scene, `Hired at ${wage}g a quest. The take is the leader's — you go where they go.`);
            ADV.Save.saveGame(game);
            scene.refreshAll();
            if (ADV.Tutor && ADV.Tutor.active(game)) { scene.buildMenu(); scene.openPanel('apply'); ADV.Tutor.town(scene, game); }
            else scene.openPanel('apply');
          } else {
            ADV.Notices.toast(scene, scripted ? 'Turned away. It happens — ask another party.' : 'Turned away. Reputation opens this door.');
            ADV.Save.saveGame(game);
            scene.refreshAll(); scene.openPanel('apply');
          }
        });
      };
      if (myParty && !isLeader && !tut) {
        const curLead = ADV.Party.leader(world, myParty);
        ADV.Notices.confirm(scene, 'Leave ' + (curLead ? curLead.name : 'this party') + '?',
          `Walk away and ask ${leader.name} at ${ask}g a quest.`,
          'Leave and ask', askNow);
        return;
      }
      askNow();
    }, { size: 15, display: true, sub, subColor: alignColor }));
    y += 56;
  }
  scroll.extend(y);
};

// ============================================================== CREATE PARTY / HIRING
Panels.createParty = function (scene, r) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  let party = ADV.Party.of(world, p);
  const isLeader = party && party.leaderId === p.id;
  header(scene, r, isLeader ? 'Your Party' : 'Create Party',
    'Negotiate the wage before they sign — 30g to start, 100g at most. Raises come later. Payroll is owed win or lose.');
  const listTop = r.y + 92;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  let y = listTop;
  if (!isLeader) {
    if (party) { scroll.add(T().text(scene, r.x + 24, y, 'You already serve in someone else\'s party.', { size: 14 })); return; }
    scroll.addBtn(T().button(scene, r.x + 24, y, 280, 44, `Found a party — ${C().GOLD.partyStartupCapital}g`, () => {
      if (p.inventory.gold < C().GOLD.partyStartupCapital) { ADV.Notices.toast(scene, 'Not enough capital.'); return; }
      const before = world.parties.length;
      const founded = ADV.Party.create(world, p.id);
      if (!founded || founded.leaderId !== p.id) { ADV.Notices.toast(scene, 'The guild would not record the company.'); return; }
      if (world.parties.length > before) p.inventory.gold -= C().GOLD.partyStartupCapital;
      ADV.Save.saveGame(game);
      scene.buildMenu();
      scene.refreshAll(); scene.openPanel('create');
    }, { size: 15, display: true, disabled: p.inventory.gold < C().GOLD.partyStartupCapital }));
    return;
  }
  // roster
  const members = ADV.Party.members(world, party);
  const bound = ADV.Party.followers(world, party).length;
  const extra = C().FORBIDDEN_EXTRA_SLOTS || 3;
  scroll.add(T().text(scene, r.x + 24, y, `Payroll: ${ADV.Party.payroll(world, party)}g per quest · ${members.length + 1}/${C().PARTY_MAX}` + (bound ? ` + ${bound} bound (up to ${extra} extra)` : ` · ${extra} extra seats for the bound`), { size: 14, color: T().css.gold }));
  y += 28;
  scroll.addBtn(T().button(scene, r.x + 24, y, 300, 38, `Disband — ${C().GOLD.partyStartupCapital}g back`, () => Panels.foldParty(scene), { size: 14 }));
  y += 48;
  for (const m of members) {
    const followers = (m.conscriptIds || []).length + (m.undeadIds || []).length;
    const relTier = ADV.Rel.tierBetween(world, m.id, p.id);
    const sub = `wage ${party.wages[m.id]}g · ${relTier}${followers ? ' · commands ' + followers : ''}`;
    scroll.addBtn(T().button(scene, r.x + 24, y, 320, 44, m.name, () => {
      ADV.Notices.confirm(scene, 'Dismiss ' + m.name + '?', 'They keep what they were paid, and they remember.', 'Dismiss', () => {
        ADV.Party.removeMember(world, party, m.id);
        ADV.Rel.move(world, m.id, p.id, -15, 'quest');
        ADV.Save.saveGame(game);
        scene.refreshAll(); scene.openPanel('create');
      });
    }, { size: 14, sub, subColor: T().relColor(relTier) }));
    y += 52;
  }
  y += 8;
  scroll.add(T().text(scene, r.x + 24, y, 'FOR HIRE', { size: 12, color: T().css.inkDim })); y += 24;
  const cands = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster && !c.partyId &&
    !c.registryId && c.status === 'normal' && !c.isConscript && !c.isUndead && c.hospitalizedQuestsLeft <= 0);
  for (const cand of cands) {
    const blocked = ADV.Party.hatredConflict(world, party, cand.id);
    const skills = cand.actives.slice(0, 3).map(e => ADV.DATA.SKILLS[e.skillId].name).join(', ');
    const knowsForbidden = ['conscript', 'necromancy'].some(id => ADV.SkillSys.knows(cand, id));
    const bond = Panels.hireBond(world, p, cand);
    const sub = `${skills}${bond ? ' · ' + bond.label : ''}${knowsForbidden ? ' · knows forbidden arts' : ''}${blocked ? ' · WILL NOT SERVE' : ''}`;
    scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 240, 44, `${cand.name} (rank ${cand.rank})`, () => {
      if (blocked) { scene.promptOnce('firstBlockedHire'); ADV.Notices.toast(scene, 'Bad blood. No wage fixes it.'); return; }
      if (bond) ADV.Notices.toast(scene, `${cand.name} is ${bond.label}.`);
      Panels.wageDialog(scene, party, cand);
    }, { size: 14, sub, subColor: blocked ? T().css.blood : (bond ? bond.color : (knowsForbidden ? T().css.purple : T().css.inkDim)), disabled: members.length + 1 >= C().PARTY_MAX }));
    y += 52;
  }
  scroll.extend(y);
};

Panels.foldParty = function (scene) {
  const game = scene.g();
  const p = scene.player();
  const cap = C().GOLD.partyStartupCapital;
  ADV.Notices.confirm(scene, 'Disband the party?',
    'Everyone you hired walks free. They keep what they were paid. The ' + cap + 'g founding purse comes back so you can hire on with someone else.',
    'Disband — ' + cap + 'g back', () => {
      const r = ADV.Party.foldByLeader(game.world, p);
      if (!r.ok) { ADV.Notices.toast(scene, r.error); return; }
      ADV.Notices.toast(scene, cap + 'g returned. You are free to apply.');
      ADV.Save.saveGame(game);
      scene.buildMenu();
      scene.refreshAll();
      scene.openPanel('apply');
    });
};

Panels.hireBond = function (world, p, c) {
  if (!p || !c) return null;
  if (ADV.Rel.isPartner(p, c)) {
    return { kind: 'partner', label: c.sex === 'f' ? 'your wife' : 'your husband', color: T().css.purple };
  }
  const theirs = ADV.Rel.tierBetween(world, c.id, p.id);
  const yours = ADV.Rel.tierBetween(world, p.id, c.id);
  if (theirs === 'romantic' || yours === 'romantic') return { kind: 'romantic', label: 'in a romance with you', color: T().css.purple };
  if (ADV.Courtship && ADV.Courtship.wants(world, c, p) && ADV.Courtship.shared(world, c.id, p.id) >= 1) return { kind: 'courting', label: 'has their eye on you', color: T().css.purple };
  if (theirs === 'friendly' || yours === 'friendly') return { kind: 'friendly', label: 'friendly with you', color: T().css.green };
  return null;
};

Panels.wageDialog = function (scene, party, cand) {
  const game = scene.g();
  const bond = Panels.hireBond(game.world, scene.player(), cand);
  let wage = C().GOLD.typicalWage;
  ADV.Notices.custom(scene, (keep, D, close) => {
    const W = T().W;
    keep(T().text(scene, W / 2, 240, `Offer ${cand.name} a wage`, { size: 20, display: true, ox: 0.5, color: T().css.gold }).setDepth(D));
    if (bond) keep(T().text(scene, W / 2, 268, bond.label, { size: 14, ox: 0.5, color: bond.color }).setDepth(D));
    const rowY = bond ? 312 : 296;
    const amount = keep(T().text(scene, W / 2, rowY, '', { size: 28, display: true, ox: 0.5 }).setDepth(D));
    const render = () => amount.setText(wage + 'g / quest');
    render();
    for (const [dx, lbl, d] of [[-180, '−5', -5], [-100, '−1', -1], [60, '+1', 1], [140, '+5', 5]]) {
      ADV.UI.modalBtn(keep, D, T().button(scene, W / 2 + dx, rowY, 56, 30, lbl, () => { wage = ADV.Party.clampWage(wage + d); render(); }, { size: 13 }));
    }
    const go = T().button(scene, W / 2 - 190, rowY + 52, 180, 40, 'Make the offer', () => {
      close();
      const r = ADV.Party.offerWage(game.world, game.rng, party, cand, wage);
      scene.speak(cand, r.ok ? ADV.DialogueBox.bandFor(game, cand) : 'general', {}, () => {
        ADV.Notices.toast(scene, r.ok
          ? `${cand.name} signs on at ${wage}g.${bond ? ' They are ' + bond.label + '.' : ''}`
          : r.why === 'declined' ? 'They pass. Pride or greed — hard to say.' : 'They cannot: ' + r.why);
        if (r.ok) ADV.World.met(game.world, cand.id);
        ADV.Save.saveGame(game);
        scene.refreshAll(); scene.openPanel('create');
      });
    }, { size: 14, bold: true });
    const no = T().button(scene, W / 2 + 10, rowY + 52, 180, 40, 'Never mind', close, { size: 14 });
    for (const b of [go, no]) ADV.UI.modalBtn(keep, D, b);
  });
};

// ============================================================== GUILD ROSTER + FEED
// One human fact per roster row, by priority. Everything here is already in the
// simulation — it has simply never reached the screen.
Panels.rosterLine = function (world, p, c, ctx) {
  const R = ADV.Rel;
  const name = (x) => (x && x.name) || 'someone';
  const first = (x) => name(x).split(' ')[0];
  const kinWord = (dead) => {
    if (!dead) return 'kin';
    if (c.motherId === dead.id) return 'mother';
    if (c.fatherId === dead.id) return 'father';
    if ((c.childIds || []).includes(dead.id)) return dead.sex === 'f' ? 'daughter' : 'son';
    const sib = (c.motherId && c.motherId === dead.motherId) || (c.fatherId && c.fatherId === dead.fatherId);
    if (sib) return dead.sex === 'f' ? 'sister' : 'brother';
    if ((c.exIds || []).includes(dead.id)) return dead.sex === 'f' ? 'wife' : 'husband';
    return 'kin';
  };

  if (!c.alive) return 'dead — the roster keeps the name';
  if (c.isUndead) return 'raised, and still answering';
  if (c.isConscript) return 'bound to service, and counting the quests';
  if (c.hospitalizedQuestsLeft > 0) return `laid up for ${c.hospitalizedQuestsLeft} more ${c.hospitalizedQuestsLeft === 1 ? 'quest' : 'quests'}`;

  // 1. money between this person and the player
  if (c.partyId && c.leaderId === p.id && c.wage) return `you owe them ${c.wage}g a quest`;
  if (p.partyId && p.leaderId === c.id && p.wage) return `owes you ${p.wage}g a quest`;

  // 2. hatred toward the player
  if (ctx.tier === 'hatred') return 'has not forgiven you';

  // 3. romantic with the player
  if (ctx.tier === 'romantic') return 'yours';
  if (ADV.Courtship && ADV.Courtship.wants(world, c, p) && !R.isPartner(c, p) && ADV.Courtship.shared(world, c.id, p.id) >= 1) return 'has their eye on you';

  // 4. courting or married to another NPC
  const spouses = (ctx.spouses || []).filter(s => s && s.id !== p.id);
  if (spouses.length) {
    const who = spouses.map(first).join(' and ');
    const kids = ctx.kids || 0;
    const pick = (ADV.hashStr ? ADV.hashStr(c.id) : (c.id || 0)) >>> 0;
    if (kids) {
      const k = `${kids} ${kids === 1 ? 'child' : 'children'}`;
      return [`married to ${who} · ${k} at home`,
              `${k} with ${who}`,
              `keeps a house with ${who} and ${k}`][pick % 3];
    }
    return [`married to ${who}`,
            `keeps a house with ${who}`,
            `${who} waits up for them`][pick % 3];
  }
  if (ADV.Courtship) {
    const crush = ADV.World.adults(world).find(o => o.id !== c.id && o.id !== p.id && !o.isPlayer && ADV.Courtship.wants(world, c, o) && !R.isPartner(c, o));
    if (crush) return `courting ${first(crush)}`;
  }

  // 5. recently bereaved
  if (ADV.Death && ADV.Death.graves) {
    const recent = ADV.Death.graves(world).filter(g => ((world.questClock || 0) - (g.deadAtQuest || 0)) <= 8);
    const lost = recent.find(g =>
      c.motherId === g.id || c.fatherId === g.id || (c.childIds || []).includes(g.id) ||
      (c.exIds || []).includes(g.id) ||
      ((c.motherId && c.motherId === g.motherId) || (c.fatherId && c.fatherId === g.fatherId)));
    if (lost) return `lost a ${kinWord(lost)} on the road`;
  }

  // 6. in a party
  if (c.partyId) {
    const lead = c.leaderId ? ADV.World.byId(world, c.leaderId) : null;
    if (lead && lead.id === p.id) return `rides with you${c.wage ? ` for ${c.wage}g` : ''}`;
    if (lead) return `rides with ${first(lead)}`;
    const mates = ADV.World.adults(world).filter(x => x.partyId === c.partyId && x.id !== c.id);
    return mates.length ? `rides with ${first(mates[0])}'s company` : 'signed to a company';
  }

  // 7. ambition
  const per = c.personality || {};
  if ((per.pride || 0) > 75) return 'wants a company of their own';

  if (c.status === 'hero') return 'the guild calls them a hero, and means it';
  if (c.status === 'villain') return 'gone bad, and everyone knows';
  if (c.pregnantBy) {
    const f = ADV.World.byId(world, c.pregnantBy);
    return f ? `carrying ${first(f)}'s child` : 'expecting';
  }
  if ((c.childIds || []).length && !spouses.length) return 'raising a child alone';
  if (c.jiltCount > 0) return c.jiltCount > 1 ? 'has left more than one at the door' : 'left someone at the door';
  if (c.badActor) return 'people are careful around them';
  const haters = R.hatersOf ? R.hatersOf(world, c.id) : [];
  if (haters.length) {
    const h = ADV.World.byId(world, haters[0].fromId || haters[0]);
    if (h && h.id !== p.id) return `${first(h)} cannot stand them`;
  }
  if (ctx.tier === 'friendly') return 'would ride with you again';
  if ((per.greed || 0) > 78) return 'works for coin and says so';
  if ((per.caution || 0) > 78) return 'picks their contracts carefully';
  if ((per.aggression || 0) > 78) return 'looking for a fight';
  if ((per.loyalty || 0) > 78) return 'sticks with whoever hired them';
  if (c.reputation >= 10) return 'a name people know';
  if (c.reputation <= -10) return 'a name people avoid';
  if (c.questsCompleted === 0) return 'has never taken a contract';
  return null;
};

Panels.roster = function (scene, r) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  scene.promptOnce('firstRoster');
  header(scene, r, 'Guild Roster', null);
  const half = Math.floor(r.w * 0.52);
  const left = ADV.UI.scrollArea(scene, { x: r.x + 8, y: r.y + 56, w: half - 20, h: r.h - 68 });
  const right = ADV.UI.scrollArea(scene, { x: r.x + half, y: r.y + 80, w: r.w - half - 16, h: r.h - 92 });
  let y = r.y + 60;
  const adults = ADV.World.adults(world).filter(c => !c.isPlayer)
    .sort((a, b) => (!!b.hiroNpc) - (!!a.hiroNpc));
  for (const c of adults) {
    const tier = ADV.Rel.tierBetween(world, c.id, p.id);
    const status = !c.alive ? 'dead' : c.isUndead ? 'undead' : c.isConscript ? 'conscripted' :
      c.status === 'hero' ? 'HERO' : c.status === 'villain' ? 'VILLAIN' :
      c.hospitalizedQuestsLeft > 0 ? 'hospitalized' : c.partyId ? 'in a party' : 'active';
    const trend = c.reputation >= 10 ? 'famous' : c.reputation <= -10 ? 'infamous' : c.reputation >= 3 ? 'rising' : c.reputation <= -3 ? 'falling' : 'steady';
    const known = world.metIds.includes(c.id);
    const skills = known ? c.actives.slice(0, 3).map(e => {
      const m = ADV.SkillSys.manifest(c, e);
      return m.data.name;
    }).join(', ') : 'unknown skills';
    const spouses = ADV.Rel.partnerIds(c).map(id => ADV.World.byId(world, id)).filter(Boolean);
    const kids = (c.dependents || []).length;
    const family = spouses.length
      ? ` · with ${spouses.map(s => s.name).join(', ')}${kids ? ` · ${kids} ${kids === 1 ? 'child' : 'children'}` : ''}`
      : '';
    const label = `${c.name}${c.title ? ' · ' + c.title : ''}`;
    // A roster of fifteen rows reading "rank 1 · steady · active" is a
    // spreadsheet. The simulation already knows who owes whom, who is courting
    // whom and who has not forgiven you — so lead with the human fact and let
    // the stat line be the footnote.
    const human = Panels.rosterLine(world, p, c, { tier, spouses, kids, status });
    const sub = human || `rank ${c.rank} · ${trend} · ${status}${family} · ${skills}`;
    left.addBtn(T().button(scene, r.x + 16, y, half - 24, 42, label, () => {
      ADV.World.met(world, c.id);
      Panels.personDialog(scene, c);
    }, { size: 13, sub, subColor: T().relColor(tier), color: c.status === 'hero' ? T().css.gold : c.status === 'villain' ? T().css.blood : T().css.ink }));
    // the stats stay, one step quieter, under the human line
    // the button is 42 tall and renders the human line inside it; the stat line
    // sits BELOW the button, not on top of its subtitle
    if (human) left.add(T().text(scene, r.x + 22, y + 44, `rank ${c.rank} · ${trend} · ${status} · ${skills}`,
      { size: 10, color: T().css.inkFaint, wrap: half - 44 }));
    y += human ? 66 : 48;
  }
  left.extend(y);
  // event feed (§6): the emotional engine
  const fx = r.x + half + 4;
  scene.keep(T().text(scene, fx, r.y + 60, 'WHAT HAPPENED WHILE YOU WERE OUT', { size: 12, color: T().css.inkDim }));
  let fy = r.y + 84;
  const feed = Panels.digestFeed(world, world.eventFeed.slice(-60)).reverse();
  if (!feed.length) right.add(T().text(scene, fx, fy, 'Nothing yet. The world is holding its breath.', { size: 12, italic: true, color: T().css.inkFaint }));
  for (const ev of feed) {
    const st = Panels.FEED_STYLE[ev.kind] || Panels.FEED_STYLE.other;
    // a death should not read like someone buying boots
    right.add(T().text(scene, fx + 10, fy, `q${ev.questClock} · ${ev.text}`,
      { size: st.size, wrap: r.w - half - 38, color: ev.known === false ? T().css.inkFaint : st.color, italic: ev.known === false, bold: !!st.bold }));
    const dot = scene.add.graphics();
    dot.fillStyle(st.dot, ev.known === false ? 0.35 : 0.95);
    dot.fillCircle(fx + 3, fy + 7, ev.kind === 'death' ? 3.5 : 2.5);
    right.add(dot);
    const wrapW = r.w - half - 38;
    const cw = st.size * (st.bold ? 0.62 : 0.54);
    const perLine = Math.max(1, Math.floor(wrapW / cw));
    fy += Math.ceil((ev.text.length + 8) / perLine) * (st.size + 7) + 8;
  }
  right.extend(fy);
};

// ---- event feed: hierarchy and collapsing ---------------------------------
// Eight world ticks produce ~68 entries, overwhelmingly births and comings-of-age.
// Rendered flat they are a grey wall. Classify them, weight the ones that matter,
// and fold runs of the boring kind into a single line.
Panels.FEED_STYLE = {
  death:    { color: T().css.blood,  dot: 0xa8352c, size: 13, bold: true },
  violence: { color: T().css.blood,  dot: 0xd8574a, size: 12 },
  danger:   { color: T().css.gold,   dot: 0xd4a94e, size: 12, bold: true },
  romance:  { color: T().css.gold,   dot: 0xd4a94e, size: 12 },
  birth:    { color: T().css.inkDim, dot: 0x5d8a4a, size: 11 },
  comeOfAge:{ color: T().css.inkDim, dot: 0x5d8a4a, size: 11 },
  company:  { color: T().css.blue,   dot: 0x4a6f8a, size: 12 },
  grudge:   { color: T().css.purple, dot: 0x6a4a8a, size: 12 },
  wealth:   { color: T().css.inkDim, dot: 0x8a6f36, size: 11 },
  other:    { color: T().css.ink,    dot: 0x6b6151, size: 12 },
};

Panels.feedKind = function (text) {
  const t = String(text || '');
  if (/did not return|was found in an alley|is dead|has died|buried/i.test(t)) return 'death';
  if (/killed|ended (him|her|them)|ambush|assassinat/i.test(t)) return 'violence';
  if (/in danger|coming for/i.test(t)) return 'danger';
  if (/married|are together|proposed|jilted|left .* at the (door|altar)/i.test(t)) return 'romance';
  if (/had a child|was born/i.test(t)) return 'birth';
  if (/come of age/i.test(t)) return 'comeOfAge';
  if (/has come to hate|cannot stand|blames|turned on/i.test(t)) return 'grudge';
  if (/hired|quit|started a party|company|party of/i.test(t)) return 'company';
  if (/bought|sold|paid|gold|vault/i.test(t)) return 'wealth';
  return 'other';
};

// Fold consecutive runs of the same low-value kind — but never fold a line about
// someone the player has actually met.
Panels.digestFeed = function (world, entries) {
  const FOLDABLE = { birth: 'children were born in the quarter', comeOfAge: 'young ones came of age and joined the roster' };
  const out = [];
  let run = null;
  const flush = () => {
    if (!run) return;
    if (run.items.length >= 3) {
      out.push({ questClock: run.items[run.items.length - 1].questClock, kind: run.kind,
        known: false, text: `${run.items.length} ${FOLDABLE[run.kind]}.` });
    } else out.push(...run.items);
    run = null;
  };
  for (const e of entries) {
    const kind = Panels.feedKind(e.text);
    const ev = Object.assign({}, e, { kind });
    const foldable = FOLDABLE[kind] && ev.known === false;
    if (!foldable) { flush(); out.push(ev); continue; }
    if (run && run.kind === kind) run.items.push(ev);
    else { flush(); run = { kind, items: [ev] }; }
  }
  flush();
  return out;
};

// ============================================================== GRAVEYARD
Panels.graveyard = function (scene, r) {
  const world = scene.g().world;
  header(scene, r, 'Graveyard', 'Those who died on the road, and those who did not come home. The guild roster is for the living.');
  const graves = ADV.Death.graves(world);
  const listTop = r.y + 84;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  let y = listTop;
  if (!graves.length) {
    scroll.add(T().text(scene, r.x + 24, y, 'No one lies here yet.', { size: 14, italic: true, color: T().css.inkFaint }));
    scroll.extend(y + 30);
    return;
  }
  for (const c of graves) {
    const raw = c.obituary || (ADV.Death.composeObituary && ADV.Death.composeObituary(world, c, null, 'quest'));
    const ob = raw && typeof raw === 'object' ? raw : { name: c.name, title: c.title || c.epithet || null, rank: c.rank || 1, skills: [], spouses: [], children: [], text: typeof raw === 'string' ? raw : '', deadAtQuest: c.deadAtQuest };
    const label = `${ob.name}${ob.title ? ' · ' + ob.title : ''}`;
    const skills = (ob.skills && ob.skills.length) ? ob.skills.join(', ') : 'no recorded skills';
    const family = [];
    if (ob.spouses && ob.spouses.length) family.push('spouse: ' + ob.spouses.join(', '));
    if (ob.children && ob.children.length) family.push('children: ' + ob.children.join(', '));
    const sub = `rank ${ob.rank} · died q${ob.deadAtQuest != null ? ob.deadAtQuest : (c.deadAtQuest || '?')} · ${skills}`;
    const img = scene.add.image(r.x + 52, y + 38, ADV.Portraits.key(scene, c)).setDisplaySize(56, 70);
    scroll.add(img);
    scroll.add(T().text(scene, r.x + 92, y, label, { size: 15, color: T().css.gold }));
    y += 22;
    scroll.add(T().text(scene, r.x + 92, y, sub, { size: 12, color: T().css.inkDim, wrap: r.w - 120 }));
    y += 20;
    if (family.length) {
      scroll.add(T().text(scene, r.x + 92, y, family.join(' · '), { size: 12, color: T().css.ink, wrap: r.w - 120 }));
      y += 18;
    }
    scroll.add(T().text(scene, r.x + 92, y, ob.text, { size: 13, italic: true, wrap: r.w - 120, color: T().css.ink }));
    y += Math.max(42, Math.ceil((ob.text || '').length / 48) * 17 + 18);
  }
  scroll.extend(y);
};

// ============================================================== RELATIONSHIPS + VAULT
// ============================================================== VAULT
Panels.vault = function (scene, r) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  header(scene, r, 'Vault', 'What you carry is lost when you die. What is here is not — it passes to your heirs. Couples share one. You may draw your share once per stay; after a quest you can ask again.');
  const listTop = r.y + 92;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  let y = listTop;
  const v = ADV.Vault.of(world, p);
  scroll.add(T().text(scene, r.x + 24, y, `Carrying: ${p.inventory.gold}g`, { size: 15, color: T().css.gold })); y += 26;
  if (!v) {
    scroll.add(T().text(scene, r.x + 24, y, 'No vault yet. Your first deposit at a departure opens one.', { size: 14, italic: true, color: T().css.inkFaint })); y += 30;
    scroll.addBtn(T().button(scene, r.x + 24, y, 240, 36, 'Open a vault (deposit 0g)', () => { ADV.Vault.ensureOwn(world, p); ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('vault'); }, { size: 13 }));
    return;
  }
  const shared = v.sharedWithId || v.holderId !== p.id;
  const other = world.characters.find(c => c.id === (v.holderId === p.id ? v.sharedWithId : v.holderId));
  scroll.add(T().text(scene, r.x + 24, y, `In the vault: ${v.gold}g${shared && other ? ` · shared with ${other.name}` : ''}${shared ? ` · shared-quest streak ${v.sharedQuestStreak}` : ''}`, { size: 15, color: T().css.gold })); y += 30;
  if (p.inventory.gold > 0) {
    scroll.addBtn(T().button(scene, r.x + 24, y, 240, 34, `Deposit all (${p.inventory.gold}g)`, () => { ADV.Vault.deposit(world, p, p.inventory.gold); p.inventory.gold = 0; ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('vault'); }, { size: 13 }));
    y += 42;
  }
  if (shared && other) {
    const cap = ADV.Vault.withdrawalCap ? ADV.Vault.withdrawalCap(world, v, p) : null;
    if (cap) { scroll.add(T().text(scene, r.x + 24, y, `${other.name} is ${cap.state}: you may draw up to ${Math.round(cap.pct * 100)}% of the vault at once.`, { size: 12, color: T().css.inkDim })); y += 22; }
    const waited = ADV.Vault.withdrawnThisStay(world, v, p);
    scroll.addBtn(T().button(scene, r.x + 24, y, 240, 34, waited ? 'Already drew this stay' : 'Request a withdrawal', () => {
      if (waited) { ADV.Notices.toast(scene, 'You already took your share this stay. Come back after the next quest.'); return; }
      const amt = Math.min(v.gold, Math.max(20, Math.floor(v.gold / 3)));
      if (amt <= 0) { ADV.Notices.toast(scene, 'The vault is empty.'); return; }
      scene.promptOnce('firstWithdrawal');
      const res = ADV.Vault.requestWithdrawal(world, game.rng, p, amt);
      ADV.Notices.toast(scene, res.approved ? `Approved. ${res.amount}g withdrawn.` : res.waited ? 'You already took your share this stay. Come back after the next quest.' : res.queued ? 'Queued for their return.' : `Refused. ${other.name} said no.`);
      ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('vault');
    }, { size: 13, disabled: waited }));
    y += 42;
  } else if (v.holderId === p.id && v.gold > 0) {
    scroll.addBtn(T().button(scene, r.x + 24, y, 240, 34, `Take gold out (up to 200g)`, () => {
      const amt = Math.min(v.gold, 200);
      v.gold -= amt; p.inventory.gold += amt;
      ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('vault');
    }, { size: 13 }));
    y += 42;
  }
  scroll.add(T().text(scene, r.x + 24, y, v.insuranceActive ? 'Insurance: active — the survivor is paid if either of you dies.' : 'Insurance: none (the Insurance desk sells it).', { size: 12, color: v.insuranceActive ? T().css.green : T().css.inkFaint }));
  scroll.extend(y + 24);
};

Panels.relationships = function (scene, r) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  header(scene, r, 'Relationships', 'Regard moves with shared quests, money and how you treat people. The vault has its own door now.');
  const listTop = r.y + 84;
  const scroll = ADV.UI.scrollArea(scene, { x: r.x + 8, y: listTop, w: r.w - 16, h: r.y + r.h - listTop - 8 });
  let y = listTop;
  // relationship list: everyone met, ordered by |score|
  const rows = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster && (!c.registryId || c.hiroNpc || ADV.Rel.isPartner(p, c)))
    .map(c => ({ c, out: ADV.Rel.score(world, p.id, c.id), inn: ADV.Rel.score(world, c.id, p.id) }))
    .sort((a, b) => {
      const ap = ADV.Rel.isPartner(p, a.c) ? 1 : 0;
      const bp = ADV.Rel.isPartner(p, b.c) ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return Math.abs(b.inn) + Math.abs(b.out) - Math.abs(a.inn) - Math.abs(a.out);
    });
  for (const row of rows) {
    const c = row.c;
    const tier = ADV.Rel.tierBetween(world, c.id, p.id);
    const isPartner = ADV.Rel.isPartner(p, c);
    const shared = ADV.Courtship.shared(world, p.id, c.id);
    const rank = c.sex === 'm' ? ADV.Courtship.wealthRank(world, c) : 0;
    const gender = c.sex === 'f' ? 'woman' : 'man';
    const sub = `${gender} · ${isPartner ? 'your partner' : tier} · their regard ${row.inn} · yours ${row.out} · ${shared} quest${shared === 1 ? '' : 's'} together`;
    scroll.addBtn(T().button(scene, r.x + 24, y, r.w - 320, 44, c.name + (c.title ? ' · ' + c.title : ''), () => {
      Panels.personDialog(scene, c);
    }, { size: 14, sub, subColor: T().relColor(isPartner ? 'romantic' : tier) }));
    if (rank) {
      scroll.add(T().text(scene, r.x + r.w - 300, y + 14, 'wealth #' + rank, {
        size: 12, color: rank <= C().COURT.wealthTop ? T().css.gold : T().css.inkDim,
      }));
    }
    y += 50;
  }
  if (!rows.length) scroll.add(T().text(scene, r.x + 24, y, 'You know nobody yet. Quest beside people, and they will remember it.', { size: 14, italic: true, color: T().css.inkFaint }));
  scroll.extend(y);
};

Panels.personDialog = function (scene, c) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  ADV.World.met(world, c.id);
  // First live prospect of romance: explain family/marriage/nepotism, one
  // sentence each (jilting stays unexplained until it happens).
  const prospect = !ADV.Rel.isPartner(p, c) && ADV.Rel.canRomance(world, p.id, c.id).ok;
  if (prospect) {
    const lines = ['familyRomance', 'familyMarriage', 'familyNepotism']
      .map(id => ADV.Game.prompt(game, id)).filter(Boolean);
    if (lines.length) {
      ADV.Notices.custom(scene, (keep, D, close) => {
        const W = T().W;
        keep(T().text(scene, W / 2, 240, 'On family', { size: 20, display: true, ox: 0.5, color: T().css.gold }).setDepth(D));
        keep(T().text(scene, W / 2, 300, lines.join('\n\n'), { size: 14, ox: 0.5, oy: 0.5, wrap: 560, align: 'center' }).setDepth(D));
        ADV.UI.modalBtn(keep, D, T().button(scene, W / 2 - 90, 400, 180, 38, 'Understood', () => { close(); Panels.personDialog(scene, c); }, { size: 14 }));
      });
      return;
    }
  }
  scene.speak(c, null, {}, () => {
    const isPartner = ADV.Rel.isPartner(p, c);
    const canProp = !isPartner && ADV.Housing.canTakeSpouse(p) && ADV.Housing.canTakeSpouse(c) && ADV.Rel.canRomance(world, p.id, c.id);
    const iHate = ADV.Rel.hates(world, p.id, c.id);
    const buttons = [];
    if (canProp && canProp.ok) buttons.push({ label: 'Propose', value: 'propose' });
    if (isPartner) buttons.push({ label: 'Leave them (jilt)', value: 'jilt' });
    if (!iHate && !isPartner) buttons.push({ label: 'Declare hatred', value: 'hate' });
    if (iHate) buttons.push({ label: 'Attempt assassination', value: 'kill' });
    buttons.push({ label: 'Walk away', value: null });
    ADV.Notices.pickOne(scene, c.name, `${c.sex === 'f' ? 'Woman' : 'Man'} · rank ${c.rank} · ${c.sex === 'f' ? 'she' : 'he'} thinks of you as ${ADV.Rel.tierBetween(world, c.id, p.id)}.`, buttons, (val) => {
      if (val === 'propose') {
        scene.promptOnce('firstRomanceOption');
        if (c.hiroNpc && !ADV.Hiro.acceptsProposal(p)) {
          scene.speak(c, 'general', {}, () => {
            ADV.Notices.confirm(scene, 'Not yet', `${c.name} only takes a proposal from a woman with a reputation of ${ADV.Hiro.RULES.minRep} or better. Yours is ${p.reputation}. Earn it on the road.`, 'Understood', () => {}, T().css.purple);
          });
          return;
        }
        const accept = ADV.Rel.score(world, c.id, p.id) >= C().REL.FRIENDLY_MIN;
        if (accept) {
          const lines = ADV.Rel.commit(world, p.id, c.id);
          lines.forEach(l => ADV.World.feed(world, l.text, l.actorIds));
          scene.speak(c, 'romantic', {}, () => {
            ADV.Save.saveGame(game); scene.refreshAll(); scene.openPanel('rel');
          });
        } else {
          ADV.Courtship.decline(world, c, p);   // refusal: Neutral for three quests, then the rules again
          scene.speak(c, 'general', {}, () => {
            ADV.Notices.toast(scene, 'Refused. Three quests before they will hear it again.');
            ADV.Save.saveGame(game); scene.openPanel('rel');
          });
        }
      } else if (val === 'jilt') {
        scene.promptOnce('firstJilting');
        ADV.Notices.confirm(scene, 'Leave ' + c.name + '?',
          'There are no clean breakups. They will hate you for the rest of one of your lives — check what they can afford before you do this.',
          'Leave them', () => {
            const lines = ADV.Rel.jilt(world, p, c);
            lines.forEach(l => ADV.World.feed(world, l.text, l.actorIds));
            ADV.Save.saveGame(game);
            scene.speak(c, 'hatred', {}, () => { scene.refreshAll(); scene.openPanel('rel'); });
          }, T().css.blood);
      } else if (val === 'hate') {
        ADV.Rel.move(world, p.id, c.id, -100, 'murder', { set: true, decays: false });
        ADV.Notices.toast(scene, 'So be it. Assassination is now open to you — and to them.');
        ADV.Save.saveGame(game); scene.openPanel('rel');
      } else if (val === 'kill') {
        ADV.Notices.confirm(scene, 'Kill ' + c.name + '?',
          'One battle. The loser dies for good, and the winner takes what they carried. This consumes world time like a quest.',
          'Do it', () => {
            const res = ADV.Game.beginAssassination(game, c.id);
            if (!res.ok) { ADV.Notices.toast(scene, res.error); return; }
            scene.promptOnce('firstAssassination');
            scene.scene.start('Combat', { mode: 'assassination' });
          }, T().css.blood);
      }
    });
  });
};

// ============================================================== NOTICES (modals)
const Notices = ADV.Notices = {};

// One compact toast at a time, docked in a corner so it never covers a
// modal or the character sheet. Click it to dismiss.
Notices.TOAST_HOLD_MS = 2800;
Notices.TOAST_FADE_MS = 350;
Notices.TOAST_MAX_W = 300;

function msgState(scene) {
  if (!scene.__msg) scene.__msg = { blocked: 0, showing: null, queue: [] };
  return scene.__msg;
}

Notices.block = function (scene) {
  if (!scene) return;
  const st = msgState(scene);
  st.blocked++;
  Notices.dismissToast(scene, true);
};

Notices.unblock = function (scene) {
  if (!scene || !scene.__msg) return;
  const st = scene.__msg;
  st.blocked = Math.max(0, st.blocked - 1);
  if (!st.blocked && scene.time) scene.time.delayedCall(40, () => Notices.flush(scene));
  else if (!st.blocked) Notices.flush(scene);
};

Notices.dismissToast = function (scene, requeue) {
  if (!scene || !scene.__msg) return;
  const st = scene.__msg;
  const cur = st.showing;
  if (!cur) return;
  st.showing = null;
  try { if (cur.tween) cur.tween.stop(); } catch (e) {}
  try { if (cur.t) cur.t.destroy(); } catch (e) {}
  try { if (cur.bg) cur.bg.destroy(); } catch (e) {}
  if (requeue && cur.text) st.queue.unshift(cur.text);
};

Notices.flush = function (scene) {
  if (!scene || !scene.sys || !scene.sys.isActive()) return;
  const st = msgState(scene);
  if (st.blocked || st.showing) return;
  const next = st.queue.shift();
  if (next) Notices._paintToast(scene, next);
};

Notices.toast = function (scene, text) {
  if (!scene || !text) return;
  const st = msgState(scene);
  if (st.showing && st.showing.text === text) return;
  if (st.queue.length && st.queue[st.queue.length - 1] === text) return;
  if (st.blocked || st.showing) { st.queue.push(text); return; }
  Notices._paintToast(scene, text);
};

function toastAnchor(scene) {
  const W = T().W, H = T().H;
  const key = scene.sys && scene.sys.settings && scene.sys.settings.key;
  // Combat/quest and open dialogue use the top-right so we stay off the
  // bottom verb bar. Town uses the empty bottom-right beside the board.
  if (key === 'Combat' || key === 'Quest' || (scene.__msg && scene.__msg.blocked)) {
    return { x: W - 18, y: 18, ox: 1, oy: 0 };
  }
  return { x: W - 18, y: H - 18, ox: 1, oy: 1 };
}

function toastBoxSize(scene, text, maxW) {
  const probe = T().text(scene, 0, 0, text, { size: 13, wrap: maxW });
  let tw = 0;
  const lines = (probe.getWrappedText && probe.getWrappedText()) || [text];
  const ctx = probe.context;
  if (ctx && ctx.measureText) {
    for (const line of lines) tw = Math.max(tw, ctx.measureText(line).width);
  } else tw = Math.min(maxW, probe.width);
  const th = probe.height;
  try { probe.destroy(); } catch (e) {}
  return { w: Math.ceil(Math.min(maxW, Math.max(80, tw))), h: Math.ceil(th) };
}

Notices._paintToast = function (scene, text) {
  const st = msgState(scene);
  const a = toastAnchor(scene);
  const scale = (ADV.Prefs && ADV.Prefs.textScale()) || 1;
  const box = toastBoxSize(scene, text, Math.round(Notices.TOAST_MAX_W * Math.max(1, scale)));
  const padX = 14, padY = 10;
  const bw = box.w + padX * 2, bh = box.h + padY * 2;
  const cx = a.ox === 1 ? a.x - bw / 2 : a.x + bw / 2;
  const cy = a.oy === 1 ? a.y - bh / 2 : a.y + bh / 2;
  const t = T().text(scene, cx, cy, text, { size: 13, ox: 0.5, oy: 0.5, color: T().css.gold, wrap: box.w, align: 'center' }).setDepth(241);
  const bg = scene.add.rectangle(cx, cy, bw, bh, 0x14110d, 0.94).setDepth(240).setStrokeStyle(1.5, T().c.gold, 0.75);
  bg.setInteractive({ useHandCursor: true });
  const entry = { text, t, bg, tween: null };
  st.showing = entry;
  st.lastText = text;
  const finish = () => {
    if (st.showing !== entry) return;
    st.showing = null;
    try { if (entry.tween) entry.tween.stop(); } catch (e) {}
    try { t.destroy(); } catch (e) {}
    try { bg.destroy(); } catch (e) {}
    Notices.flush(scene);
  };
  bg.on('pointerdown', finish);
  entry.tween = scene.tweens.add({
    targets: [t, bg], alpha: 0, delay: Notices.TOAST_HOLD_MS, duration: Notices.TOAST_FADE_MS,
    onComplete: finish,
  });
};

Notices.custom = function (scene, build) {
  const W = T().W, H = T().H;
  const objs = [];
  const keep = o => { objs.push(o); return o; };
  const D = 930;
  Notices.block(scene);
  keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(D - 2).setInteractive());
  keep(T().panel(scene, W / 2 - 320, 220, 640, 240)).setDepth(D - 1);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    objs.forEach(o => { try { o.destroy(); } catch (e) {} });
    Notices.unblock(scene);
  };
  build(keep, D, close);
  return close;
};

Notices.confirm = function (scene, title, body, yesLabel, onYes, color) {
  Notices.custom(scene, (keep, D, close) => {
    const W = T().W;
    keep(T().text(scene, W / 2, 244, title, { size: 20, display: true, ox: 0.5, color: color || T().css.gold }).setDepth(D));
    keep(T().text(scene, W / 2, 280, body, { size: 14, ox: 0.5, wrap: 560, align: 'center', color: T().css.ink }).setDepth(D));
    const yb = T().button(scene, W / 2 - 200, 396, 190, 40, yesLabel, () => { close(); if (onYes) onYes(); }, { size: 14, bold: true, color: color || T().css.ink });
    const nb = T().button(scene, W / 2 + 10, 396, 190, 40, 'Not now', close, { size: 14 });
    for (const b of [yb, nb]) ADV.UI.modalBtn(keep, D, b);
  });
};

Notices.pickOne = function (scene, title, body, options, onPick) {
  Notices.custom(scene, (keep, D, close) => {
    const W = T().W;
    keep(T().text(scene, W / 2, 240, title, { size: 20, display: true, ox: 0.5, color: T().css.gold }).setDepth(D));
    keep(T().text(scene, W / 2, 272, body, { size: 13, ox: 0.5, wrap: 560, align: 'center', color: T().css.inkDim }).setDepth(D));
    let y = 306;
    for (const opt of options) {
      ADV.UI.modalBtn(keep, D, T().button(scene, W / 2 - 180, y, 360, 34, opt.label, () => { close(); if (onPick) onPick(opt.value); }, { size: 13 }));
      y += 40;
    }
  });
};

// ---- arrival notices --------------------------------------------------------
// Only mothers name children (request): the female player names hers at
// birth; a male player's child is named by its NPC mother.
Notices.nameChild = function (scene, n, next) {
  const game = scene.g();
  const child = n.child;
  if (game.pendingChildNaming !== child) return next();
  game.pendingChildNaming = null;
  let name = '';
  Notices.custom(scene, (keep, D, close) => {
    const W = T().W;
    keep(T().text(scene, W / 2, 244, child.sex === 'f' ? 'A daughter is born' : 'A son is born', { size: 22, display: true, ox: 0.5, color: T().css.gold }).setDepth(D));
    keep(T().text(scene, W / 2, 280, (child.sex === 'f' ? 'She' : 'He') + ' is yours to name — only a mother has that right. Type it.', { size: 13, ox: 0.5, color: T().css.inkDim }).setDepth(D));
    keep(scene.add.rectangle(W / 2, 322, 280, 36, 0x211d18).setStrokeStyle(1, T().c.gold).setDepth(D));
    const txt = keep(T().text(scene, W / 2, 322, '', { size: 18, ox: 0.5, oy: 0.5 }).setDepth(D + 1));
    const onKey = (ev) => {
      if (ev.key === 'Backspace') name = name.slice(0, -1);
      else if (/^[a-zA-Z '\-]$/.test(ev.key) && name.length < 14) name += ev.key;
      txt.setText(name);
    };
    scene.input.keyboard.on('keydown', onKey);
    const done = () => {
      scene.input.keyboard.off('keydown', onKey);
      child.name = name.trim() || null;   // empty = let fate (the seed roll) pick
      ADV.Save.saveGame(game);
      close(); next();
    };
    const b = T().button(scene, W / 2 - 110, 380, 220, 42, 'So be it', done, { size: 15, display: true, bold: true });
    ADV.UI.modalBtn(keep, D, b);
  });
};

Notices.jilt = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const j = world.pendingPlayerJilt;
  world.pendingPlayerJilt = null;
  const who = world.characters.find(c => c.id === j.byId);
  if (!who) return next();
  scene.promptOnce('firstJilted');
  Notices.pickOne(scene, who.name + ' left you.',
    'You can hate them for this, or you can let it go — only you get that choice.',
    [{ label: 'Hate them', value: 'hate' }, { label: 'Let it go', value: 'no' }],
    (v) => {
      if (v === 'hate') ADV.Rel.move(world, world.playerId, who.id, -100, 'jilt', { set: true, decays: false });
      ADV.Save.saveGame(game);
      next();
    });
};

// Someone asks the player (courtship rules): accept, or decline and they cool
// to Neutral for 3 quests.
Notices.proposal = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  const pr = n.proposal;
  const c = ADV.World.byId(world, pr.fromId);
  if (!c || !c.alive || ADV.Rel.isPartner(p, c) || !ADV.Housing.canTakeSpouse(c) || !ADV.Housing.canTakeSpouse(p) || !(world.pendingProposals || []).includes(pr)) {
    world.pendingProposals = (world.pendingProposals || []).filter(x => x !== pr);
    return next();
  }
  scene.promptOnce('firstProposalReceived');
  scene.speak(c, 'romantic', {}, () => {
    const rich = c.sex === 'f' ? ADV.Courtship.wealthRank(world, p) : 0;
    Notices.pickOne(scene, `${c.name} asks you`, c.sex === 'f'
      ? `You are one of the wealthiest men in town (rank ${rich}) and she knows it. Say yes and you are together; say no and she cools for three quests.`
      : `You have ridden together ${ADV.Courtship.shared(world, c.id, p.id)} times and he has made up his mind. Say yes and you are together; say no and he cools for three quests.`,
      [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], (v) => {
        world.pendingProposals = (world.pendingProposals || []).filter(x => x !== pr);
        if (v === 'yes') {
          const lines = ADV.Rel.commit(world, p.id, c.id);
          lines.forEach(l => ADV.World.feed(world, l.text, l.actorIds));
          scene.speak(c, 'romantic', {}, () => { ADV.Save.saveGame(game); scene.refreshAll(); next(); });
        } else {
          ADV.Courtship.decline(world, p, c);
          scene.speak(c, 'general', {}, () => { ADV.Save.saveGame(game); next(); });
        }
      });
  });
};

// A hire wants more pay (request 15): meet it or lose them.
Notices.raise = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const p = scene.player();
  const rz = n.raise;
  world.pendingRaises = (world.pendingRaises || []).filter(x => x !== rz);
  const m = ADV.World.byId(world, rz.memberId);
  const party = ADV.Party.of(world, p);
  if (!m || !m.alive || !party || party.leaderId !== p.id || !party.memberIds.includes(m.id)) return next();
  scene.speak(m, null, {}, () => {
    Notices.pickOne(scene, `${m.name} wants ${rz.ask}g a quest`, `Up from ${party.wages[m.id] || 0}g. Refuse and ${m.sex === 'f' ? 'she' : 'he'} walks.`,
      [{ label: `Pay ${rz.ask}g`, value: 'pay' }, { label: 'Let them go', value: 'no' }], (v) => {
        if (v === 'pay') { const pay = ADV.Party.clampWage(rz.ask); party.wages[m.id] = pay; m.wage = pay; ADV.Notices.toast(scene, 'Agreed.'); }
        else { ADV.Party.removeMember(world, party, m.id); ADV.Rel.move(world, m.id, p.id, -10, 'quest'); ADV.World.feed(world, `${m.name} quit your party over pay.`, [m.id]); }
        ADV.Save.saveGame(game); scene.refreshAll(); next();
      });
  });
};

Notices.rescue = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const rsc = n.rescue;
  if (!world.pendingRescues.includes(rsc)) return next();
  const target = world.characters.find(c => c.id === rsc.targetId);
  const attacker = rsc.attackerId ? world.characters.find(c => c.id === rsc.attackerId) : null;
  if (!target || !target.alive) { world.pendingRescues = world.pendingRescues.filter(x => x !== rsc); return next(); }
  scene.promptOnce('firstDanger');
  scene.speak(target, null, {}, () => {
    Notices.pickOne(scene, target.name + ' is in danger',
      attacker ? `${attacker.name} is coming for ${target.sex === 'f' ? 'her' : 'him'}. Helping makes their enemy yours, and the offer expires.` :
        `A contract went wrong. ${target.sex === 'f' ? 'She' : 'He'} needs someone, now.`,
      [{ label: 'Go to them', value: 'go' }, { label: 'Look away', value: 'no' }],
      (v) => {
        if (v === 'go') {
          scene.promptOnce('firstRescue');
          const res = ADV.Game.acceptRescue(game, rsc);
          if (res.ok && res.st) { scene.scene.start('Combat', { mode: 'rescue' }); return; }
          ADV.Notices.toast(scene, res.abstract ? 'You brought them home.' : (res.error || ''));
          scene.refreshAll();
          next();
        } else {
          ADV.Game.refuseRescue(game, rsc);
          next();
        }
      });
  });
};

Notices.divine = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const o = n.offer;
  if (!(world.divineOffers || []).includes(o)) return next();
  const target = world.characters.find(c => c.id === o.targetId);
  if (!target || !target.alive) { world.divineOffers = world.divineOffers.filter(x => x !== o); return next(); }
  scene.promptOnce('firstDivineCalled');
  const isEx = (scene.player().exIds || []).includes(target.id) || scene.player().partnerId === target.id;
  if (isEx) scene.promptOnce('firstDivineEx');
  Notices.pickOne(scene, 'The world names ' + target.name,
    `A divine quest. You would carry True Rest and the Hero's strength — and take no other work until ${target.name} is dead. Refusal is allowed. Failure is someone else's chance.`,
    [{ label: 'Take up the call', value: 'yes' }, { label: 'Refuse', value: 'no' }],
    (v) => {
      if (v === 'yes') {
        ADV.Divine.acceptDivineQuest(world, scene.player(), target, o.powerMult, ADV.World.feeder(world));
        ADV.Save.saveGame(game);
      } else {
        world.divineOffers = world.divineOffers.filter(x => x !== o);
      }
      next();
    });
};

Notices.heroInvite = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const inv = n.invite;
  if (!(world.pendingHeroInvites || []).includes(inv)) return next();
  const hero = world.characters.find(c => c.id === inv.heroId);
  const target = world.characters.find(c => c.id === inv.targetId);
  if (!hero || !hero.alive || !target || !target.alive) {
    world.pendingHeroInvites = world.pendingHeroInvites.filter(x => x !== inv);
    return next();
  }
  scene.promptOnce('firstDivineInvite');
  scene.speak(hero, null, { themName: target.name }, () => {
    Notices.pickOne(scene, hero.name + ' asks for your blade',
      `The divine quest names ${target.name}. Accepting counts as a shared quest — it is the only work a hero can offer.`,
      [{ label: 'Ride with them', value: 'yes' }, { label: 'Refuse', value: 'no' }],
      (v) => {
        world.pendingHeroInvites = world.pendingHeroInvites.filter(x => x !== inv);
        hero.divineInvitesWindow.push(v === 'yes');
        if (v === 'yes') {
          ADV.Rel.move(world, hero.id, world.playerId, C().REL_MOVE.sharedQuestWin, 'quest');
          const hv = ADV.Vault.of(world, hero) || ADV.Vault.of(world, scene.player());
          if (hv) { hv.sharedQuestStreak = Math.max(hv.sharedQuestStreak, 1); hv.questsSinceShared = 0; }
          // resolve abstractly alongside the hero (the target is an NPC)
          ADV.World.tick(world, game.rng, { playerQuested: true });
          const alive = world.characters.find(c => c.id === target.id && c.alive);
          ADV.Notices.toast(scene, alive ? 'You rode together. The hunt continues.' : 'It is done. Divine quests pay nothing but standing.');
          ADV.Save.saveGame(game);
        } else {
          ADV.World.checkHeroInviteWindow(world, hero, ADV.World.feeder(world));
          ADV.Save.saveGame(game);
        }
        next();
      });
  });
};

Notices.leaderDeath = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const rec = world.pendingLeaderDeath;
  world.pendingLeaderDeath = null;
  if (!rec) return next();
  scene.promptOnce('firstLeaderFall');
  const after = () => {
    ADV.Notices.toast(scene, (rec.leaderName || 'The lead') + ' is buried. The party is gone.');
    next();
  };
  if (ADV.Cutscenes && ADV.Cutscenes.funeral) { ADV.Cutscenes.funeral(scene, rec, after); return; }
  const words = (rec.words || []).slice();
  const speakNext = () => {
    const w = words.shift();
    if (!w) return after();
    const c = ADV.World.byId(world, w.id);
    if (!c || !c.alive) return speakNext();
    scene.speak(c, w.band || 'general', { target: rec.leaderName, them: rec.leaderName, score: w.score }, speakNext);
  };
  speakNext();
};

Notices.withdrawal = function (scene, n, next) {
  const game = scene.g();
  const world = game.world;
  const v = n.vault;
  const req = v.pendingWithdrawals[0];
  if (!req) return next();
  const who = world.characters.find(c => c.id === req.requesterId);
  if (!who || !who.alive) { v.pendingWithdrawals.shift(); return next(); }
  scene.speak(who, null, {}, () => {
    Notices.pickOne(scene, who.name + ' asks for ' + req.amount + 'g',
      'From the shared vault. Refusal is a real defense — and a slow poison.',
      [{ label: 'Approve it', value: true }, { label: 'Refuse', value: false }],
      (approve) => {
        ADV.Vault.resolvePending(world, v, 0, approve);
        ADV.Save.saveGame(game);
        next();
      });
  });
};

})();
