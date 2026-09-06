// Bespoke campaign skill effects (§13). Each handler receives the combat
// internals and returns undefined to let Combat.act finish the action.
// Everything expressible as generic data stays in skills data; only skills
// whose behaviour needs real logic live here.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Ch = () => ADV.Character;
const Combat = ADV.Combat;
const E = {};

// Marked for the Knife: your damage ignores 50% of the target's Defence
E.mark = (I, st, u, tgt, d) => { I.addStatus(st, tgt, { kind: 'marked', srcUid: u.uid, rounds: d.rounds || 4 }); };

// Contract Mark: every ally deals +25% to the marked target
E.contractMark = (I, st, u, tgt, d) => { I.addStatus(st, tgt, { kind: 'contractMark', side: u.side, rounds: d.rounds || 3 }); };

// Ghoststep: reposition to any lane free; next attack takes no reflect
E.ghoststep = (I, st, u, tgt, d) => {
  const want = d.toLane || (u.lane === 'front' ? 'back' : 'front');
  if (I.laneUnits(st, u.side, want).length < C().LANE_CAP) { u.lane = want; u.slot = I.laneUnits(st, u.side, want).length - 1; }
  u.reflectImmuneNext = true; u.stealth = true; u.stealthRounds = 2;
  I.ev(st, { t: 'stealth', uid: u.uid });
};

// Unseen Guard: guard one ally; attackers can't see the interceptor and bleed
E.unseenGuard = (I, st, u, tgt, d) => {
  const ally = tgt.side === u.side ? tgt : u;
  I.addStatus(st, u, { kind: 'guard', scope: 'ally', targetUid: ally.uid, rounds: d.rounds || 3 });
};

// Venom Draw: strip all Poison from an ally and put the total on one enemy
E.venomDraw = (I, st, u, tgt, d) => {
  const allies = I.livingUnits(st, u.side);
  const donor = allies.filter(x => x.statuses.some(s => s.kind === 'poison'))
    .sort((a, b) => b.statuses.filter(s => s.kind === 'poison').length - a.statuses.filter(s => s.kind === 'poison').length)[0];
  const foe = tgt.side !== u.side ? tgt : I.livingUnits(st, u.side === 'a' ? 'b' : 'a')[0];
  if (!donor || !foe) return;
  const drawn = donor.statuses.filter(s => s.kind === 'poison');
  for (const s of drawn) { I.removeStatus(donor, s); I.addStatus(st, foe, (ADV.Combat.reseatDot || ((x) => x))(Object.assign({}, s), foe)); }
  I.ev(st, { t: 'venomDraw', from: donor.uid, to: foe.uid, n: drawn.length });
};

// Last Breath: a downed ally rises for one round, then falls
E.lastBreath = (I, st, u, tgt, d) => {
  const downed = st.units.filter(x => x.side === u.side && x.downed && !x.fled && !x.reserved);
  const t = downed.includes(tgt) ? tgt : downed[0];
  if (!t) return;
  t.downed = false; t.chp = 1;
  I.addStatus(st, t, { kind: 'lastBreath', rounds: 1 });
  I.ev(st, { t: 'revive', uid: t.uid, by: u.uid });
};

// Bulwark Formation / Contract Bound: share incoming damage across a group
E.share = (I, st, u, tgt, d) => {
  const group = 'g' + u.uid + st.round;
  let members;
  if (d.shareWith === 'adjacent') {
    members = [u].concat(I.livingUnits(st, u.side).filter(x => x !== u && Math.abs(I.LANE_IDX[x.lane] - I.LANE_IDX[u.lane]) <= 1).slice(0, 2));
  } else members = [u, tgt.side === u.side && tgt !== u ? tgt : null].filter(Boolean);
  for (const m of members) I.addStatus(st, m, { kind: 'share', group, rounds: d.rounds || 3, healAtEnd: d.healAtEnd });
};

// Paid in Full: everything you prevented this battle, dealt to one enemy at once
E.paidInFull = (I, st, u, tgt, d) => {
  const foe = tgt.side !== u.side ? tgt : I.livingUnits(st, u.side === 'a' ? 'b' : 'a')[0];
  if (!foe) return;
  const amt = Math.max(1, Math.round(u.preventedStored * (d.mult || 1)));
  u.preventedStored = 0;
  I.dealDamage(st, u, foe, amt, 'attack', { melee: true });
};

// Company Medic: heal every ally below 50% for a reduced amount
E.companyMedic = (I, st, u, tgt, d) => {
  const atk = Ch().effStat(u.ch, 'atk');
  const amt = Math.round(atk * (d.power || 1.2) * C().TIER_MULT[d.tier || 'basic']);
  for (const x of I.livingUnits(st, u.side)) if (x.chp / x.maxHp < 0.5) I.healUnit(st, u, x, amt);
};

// Dispel: strip all buffs and wards from one enemy (perks are untouchable, §13d-2)
E.dispel = (I, st, u, tgt, d) => {
  let n = 0;
  for (const s of tgt.statuses.slice()) if (I.POS_STATUSES.includes(s.kind)) { I.removeStatus(tgt, s); n++; }
  I.ev(st, { t: 'dispelled', uid: tgt.uid, n });
};

Combat.EFFECTS = E;
})();
