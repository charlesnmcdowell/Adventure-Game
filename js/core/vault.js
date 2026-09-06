// Shared vault, estate, insurance, death claims (§7, §10).
(function () {
'use strict';
const C = () => ADV.DATA.CONST;

const Vault = {};
let NEXT = 1;
Vault.resetIds = function (n) { NEXT = n || 1; };

Vault.create = function (world, holderId) {
  const v = { id: 'v' + (NEXT++), holderId, gold: 0, items: [],
    sharedWithId: null, insuranceActive: false,
    pendingWithdrawals: [], sharedQuestStreak: 0, questsSinceShared: 0,
    lastWithdrawAt: {} };
  world.vaults.push(v);
  return v;
};

function stillPartners(world, a, b) {
  if (!a || !b || !a.alive || !b.alive) return false;
  if (ADV.Rel && ADV.Rel.partnerIds) return ADV.Rel.partnerIds(a).includes(b.id);
  return a.partnerId === b.id || b.partnerId === a.id;
}

// Living spouse who still shares this vault, or null if they died or were jilted.
Vault.livingShare = function (world, v) {
  if (!v || !v.sharedWithId) return null;
  const other = ADV.World.byId(world, v.sharedWithId);
  const holder = ADV.World.byId(world, v.holderId);
  return stillPartners(world, holder, other) ? other : null;
};

// Drop a dead or jilted key-holder. A remaining living husband still shares.
Vault.reconcile = function (world, v) {
  if (!v || !world) return v;
  const holder = ADV.World.byId(world, v.holderId);
  const other = v.sharedWithId ? ADV.World.byId(world, v.sharedWithId) : null;
  if (holder && !holder.alive) {
    if (other && other.vaultId === v.id && other.id !== v.holderId) other.vaultId = null;
    v.sharedWithId = null;
    return v;
  }
  if (v.sharedWithId && !stillPartners(world, holder, other)) {
    if (other && other.vaultId === v.id && v.holderId !== other.id) other.vaultId = null;
    let next = null;
    if (holder && holder.alive && ADV.Rel && ADV.Rel.partnerIds) {
      next = ADV.Rel.partnerIds(holder).map(id => ADV.World.byId(world, id))
        .find(c => c && c.alive && c.sex === 'm');
    }
    v.sharedWithId = next ? next.id : null;
    if (next) next.vaultId = v.id;
    v.pendingWithdrawals = [];
    if (!v.sharedWithId) { v.sharedQuestStreak = 0; v.questsSinceShared = 0; }
  }
  return v;
};

Vault.sharePartner = function (world, v, viewer) {
  if (!v || !viewer) return null;
  Vault.reconcile(world, v);
  if (v.holderId === viewer.id) return Vault.livingShare(world, v);
  if (v.sharedWithId === viewer.id) {
    const holder = ADV.World.byId(world, v.holderId);
    return holder && holder.alive ? holder : null;
  }
  return null;
};

Vault.of = function (world, ch) {
  if (!ch || !ch.vaultId) return null;
  const v = (world.vaults || []).find(x => x.id === ch.vaultId) || null;
  if (!v) { ch.vaultId = null; return null; }
  Vault.reconcile(world, v);
  if (ch.vaultId !== v.id) return null;
  if (v.holderId !== ch.id && v.sharedWithId !== ch.id) {
    ch.vaultId = null;
    return null;
  }
  return v;
};

Vault.ensureOwn = function (world, ch) {
  // A woman holds her own vault; an unpartnered man banks into his own too —
  // custody transfers on commitment (§7).
  let v = Vault.of(world, ch);
  if (!v) { v = Vault.create(world, ch.id); ch.vaultId = v.id; }
  return v;
};

Vault.wealthOf = function (world, ch) {
  let g = ch.inventory.gold || 0;
  const v = Vault.of(world, ch);
  if (v && (v.holderId === ch.id || v.sharedWithId === ch.id)) g += v.gold;
  return g;
};

// On commitment: all of the male partner's assets transfer into her vault (§7).
Vault.onCommit = function (world, woman, man) {
  const hers = Vault.ensureOwn(world, woman);
  const his = Vault.of(world, man);
  if (his && his.holderId === man.id) {
    hers.gold += his.gold; hers.items.push(...his.items);
    his.gold = 0; his.items = [];
    const i = world.vaults.indexOf(his);
    if (i >= 0) world.vaults.splice(i, 1);
  }
  hers.gold += man.inventory.gold; man.inventory.gold = 0;
  hers.sharedWithId = man.id;
  man.vaultId = hers.id;
  hers.sharedQuestStreak = 0; hers.questsSinceShared = 0;
};

// On breakup: he loses access permanently; she keeps everything (§7).
// A remaining spouse still shares — Rel.jilt has already unlinked this pair.
Vault.onBreakup = function (world, a, b) {
  const woman = a.sex === 'f' ? a : b;
  const man = a.sex === 'f' ? b : a;
  const still = (ch) => (ADV.Rel ? ADV.Rel.partnerIds(ch) : []).map(id => ADV.World.byId(world, id)).filter(c => c && c.alive);
  const v = Vault.of(world, woman);
  const nextMan = still(woman).find(c => c.sex === 'm');
  if (v && v.holderId === woman.id) {
    v.sharedWithId = nextMan ? nextMan.id : null;
    v.pendingWithdrawals = [];
    v.lastWithdrawAt = {};
  }
  if (man.vaultId && v && man.vaultId === v.id) man.vaultId = null;
  if (nextMan) nextMan.vaultId = v ? v.id : nextMan.vaultId;
  const nextWife = still(man).find(c => c.sex === 'f');
  if (nextWife) {
    const hers = Vault.ensureOwn(world, nextWife);
    hers.sharedWithId = man.id;
    if (!man.vaultId) man.vaultId = hers.id;
  }
  if (v) Vault.reconcile(world, v);
};

// Deposits are always free (§7).
Vault.deposit = function (world, ch, gold, items) {
  let v = Vault.of(world, ch);
  if (!v) v = Vault.ensureOwn(world, ch);
  v.gold += gold || 0;
  if (items) v.items.push(...items);
  return v;
};

// ---- Withdrawal caps (campaign §0e) ---------------------------------------
// Replaces the coin-flip: a partner says HOW MUCH, not yes/no. The cap is set
// by partner happiness (shared questing) and the partner's sex; Charm adds 10%.
Vault.partnerState = function (v) {
  if (v.sharedQuestStreak >= C().SHARED_STREAK_TARGET) return 'happy';
  if (v.questsSinceShared >= 3 || (v.sharedQuestStreak === 0 && v.questsSinceShared === 0)) return 'neutral';
  return 'content';
};
const CAPS = { f: { happy: 0.8, content: 0.5, neutral: 0.25 }, m: { happy: 0.9, content: 0.6, neutral: 0.35 } };
Vault.withdrawalCap = function (world, v, requester) {
  Vault.reconcile(world, v);
  const partner = Vault.sharePartner(world, v, requester);
  if (!partner) return { pct: 1, state: 'own', partner: null };
  const state = Vault.partnerState(v);
  let pct = CAPS[partner.sex === 'm' ? 'm' : 'f'][state];
  const charm = requester.perks.some(e => e.skillId === 'charm');
  if (charm) pct = Math.min(1, pct + 0.10);
  pct = Math.round(pct * 100) / 100;
  return { pct, state, partner, charm };
};
// Legacy shim (older callers): the cap expressed as a probability of a full grant.
Vault.approvalChance = function (world, v, requester, amount) {
  return Vault.withdrawalCap(world, v, requester).pct;
};

// One draw per stay in a shared vault. The next quest (clock tick) unlocks another.
Vault.withdrawnThisStay = function (world, v, requester) {
  if (!v || !requester) return false;
  const stamp = (v.lastWithdrawAt || {})[requester.id];
  return stamp != null && stamp >= (world.questClock | 0);
};

// Request by an NPC or the player. Gold only — items can never be withdrawn
// by a spouse (§7). Shared vaults resolve up to the cap, once per stay.
Vault.requestWithdrawal = function (world, rng, requester, amount) {
  const v = Vault.of(world, requester);
  if (!v) return { ok: false, error: 'no vault' };
  amount = Math.min(amount, v.gold);
  if (amount <= 0) return { ok: false, error: 'empty' };
  const cap = Vault.withdrawalCap(world, v, requester);
  if (cap.partner && Vault.withdrawnThisStay(world, v, requester)) {
    return { ok: true, approved: false, waited: true, amount: 0, cap: cap.pct, state: cap.state };
  }
  const allowed = Math.min(amount, Math.floor(v.gold * cap.pct));
  if (allowed <= 0) return { ok: true, approved: false, amount: 0, cap: cap.pct, state: cap.state };
  v.gold -= allowed; requester.inventory.gold += allowed;
  if (cap.partner) {
    v.lastWithdrawAt = v.lastWithdrawAt || {};
    v.lastWithdrawAt[requester.id] = world.questClock | 0;
  }
  return { ok: true, approved: true, amount: allowed, trimmed: allowed < amount, cap: cap.pct, state: cap.state };
};

// Queued requests no longer occur (caps resolve instantly); kept for save compatibility.
Vault.resolvePending = function (world, v, idx, approve) {
  const req = v.pendingWithdrawals[idx];
  if (!req) return null;
  v.pendingWithdrawals.splice(idx, 1);
  const requester = ADV.World.byId(world, req.requesterId);
  if (!requester || !requester.alive) return null;
  const player = ADV.World.byId(world, world.playerId);
  if (approve) {
    const amt = Math.min(req.amount, v.gold);
    v.gold -= amt; requester.inventory.gold += amt;
    ADV.Rel.move(world, requester.id, player.id, C().REL_MOVE.withdrawalApproved, 'quest');
  } else {
    ADV.Rel.move(world, requester.id, player.id, C().REL_MOVE.withdrawalRefused, 'quest');
  }
  return { requester, approved: approve, amount: req.amount };
};

// Shared quest bookkeeping, called on quest resolution.
Vault.onQuestResolved = function (world, ch, questedWithPartner) {
  const v = Vault.of(world, ch);
  if (!v || !Vault.livingShare(world, v)) return;
  if (questedWithPartner) { v.sharedQuestStreak++; v.questsSinceShared = 0; }
  else { v.sharedQuestStreak = 0; v.questsSinceShared++; }
};

// ---- Insurance (§7/§16) -----------------------------------------------------
Vault.payPremium = function (world, ch) {
  const v = Vault.ensureOwn(world, ch);
  if (ch.inventory.gold >= C().GOLD.insurancePremium) {
    ch.inventory.gold -= C().GOLD.insurancePremium;
    v.insuranceActive = true;
    return true;
  }
  return false;
};

// ---- Death claims (§7) ------------------------------------------------------
// Returns {vaultTo: 'killerEx'|'eldestChild'|'lost', payoutTo}
Vault.onDeath = function (world, deceased, killerId) {
  const v = Vault.of(world, deceased);
  const killer = killerId ? ADV.World.byId(world, killerId) : null;
  for (const xv of (world.vaults || [])) {
    if (xv.holderId === deceased.id || xv.sharedWithId === deceased.id) Vault.reconcile(world, xv);
  }
  if (deceased.vaultId && v && v.holderId !== deceased.id) deceased.vaultId = null;
  const out = { vaultTo: 'lost', gold: v ? v.gold : 0 };
  // insurance covers the household: whichever of the pair dies, the
  // survivor is paid — the policy may sit on either partner's vault
  const spouse = ADV.World.byId(world, deceased.partnerId);
  const policies = [v, spouse ? Vault.of(world, spouse) : null].filter((x, i, a) => x && a.indexOf(x) === i && x.insuranceActive);
  if (policies.length) {
    if (spouse && spouse.alive) {
      spouse.inventory.gold += C().GOLD.insurancePayout;
      out.payoutTo = spouse.id;
    }
    for (const pol of policies) pol.insuranceActive = false;
  }
  if (!v || v.holderId !== deceased.id) return out;
  // An ex (or husband) who kills her takes the entire vault — outranks every heir (§7)
  const wasEx = killer && killer.sex === 'm' &&
    (deceased.exIds || []).includes(killer.id);
  const isSpouse = killer && deceased.partnerId === killer.id;
  if (killer && (wasEx || isSpouse)) {
    killer.inventory.gold += v.gold;
    killer.inventory.items = (killer.inventory.items || []).concat(v.items);
    v.gold = 0; v.items = [];
    out.vaultTo = 'killerEx'; out.claimantId = killer.id;
    return out;
  }
  // Otherwise: eldest surviving child (adult heir preferred, else recorded for maturation)
  const heir = Vault.eldestHeir(world, deceased);
  if (heir) {
    if (heir.adult) {
      const hv = Vault.ensureOwn(world, heir.ch);
      hv.gold += v.gold; hv.items.push(...v.items);
    } else {
      heir.child.pendingEstate = { gold: v.gold, items: v.items.slice() };
    }
    v.gold = 0; v.items = [];
    out.vaultTo = 'eldestChild'; out.claimantId = heir.adult ? heir.ch.id : heir.child.id;
    return out;
  }
  return out; // no children survive: the estate is lost (§7)
};

Vault.eldestHeir = function (world, deceased) {
  // Adult children first (by maturation order), then oldest self-sufficient dependent.
  const adults = world.characters.filter(c => c.alive && !c.isMonster &&
    (c.motherId === deceased.id || c.fatherId === deceased.id));
  if (adults.length) return { adult: true, ch: adults[0] };
  const deps = (deceased.dependents || []).filter(d => d.age >= C().CHILD_SELF_SUFFICIENT);
  if (deps.length) return { adult: false, child: deps.sort((a, b) => b.age - a.age)[0] };
  return null;
};

ADV.Vault = Vault;
})();
