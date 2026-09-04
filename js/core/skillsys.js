// Skill system (§3): journal, witness rule, trainer, tiers, capacity & forgetting.
// Works on any character object — player, NPC, monster.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const SK = () => ADV.DATA.SKILLS;

const SkillSys = {};

// ---- Tiers -----------------------------------------------------------------
SkillSys.tierForLevel = function (level) {
  const t = C().TIER_THRESHOLDS;
  if (level >= t.advanced) return 'advanced';
  if (level >= t.intermediate) return 'intermediate';
  return 'basic';
};

// Effective level after gear floor (§3/§10): a matching complete set floors at 10.
SkillSys.effectiveLevel = function (ch, skillId, level) {
  const sk = SK()[skillId];
  if (!sk || sk.noTierGrowth) return level;
  const floor = SkillSys.gearFloor(ch, sk);
  return Math.max(level, floor);
};

SkillSys.gearFloor = function (ch, sk) {
  if (!ch || !ch.equippedSet) return 0;
  const set = ADV.DATA.GEAR_SETS[ch.equippedSet];
  if (!set) return 0;
  const floor = set.floor || C().GEAR_SET_FLOOR_LEVEL;
  if (!sk) return floor;                                   // the set's own floor
  if (sk.archetype && set.archetypes.includes(sk.archetype)) return floor;
  if (set.extraSkills && set.extraSkills.includes(sk.id)) return floor;   // faction sets name extra skills (§10)
  return 0;
};

// Tier data (name + params) as it manifests in this character's hands.
// Campaign §13d-2: perks exist only in their advanced form — bought whole, at
// full strength, never levelled. Actives tier by level, then an advanced
// faction title (§10) lifts the manifestation one tier above actual level.
SkillSys.tierFor = function (ch, skillId, level) {
  const sk = SK()[skillId];
  if (sk && sk.kind === 'perk') return 'advanced';
  let tier = SkillSys.tierForLevel(level);
  if (ch && ADV.Campaign && ADV.Campaign.titleLifts(ch, skillId)) {
    tier = tier === 'basic' ? 'intermediate' : 'advanced';
  }
  return tier;
};

SkillSys.manifest = function (ch, entry) {
  const sk = SK()[entry.skillId];
  const lvl = SkillSys.effectiveLevel(ch, entry.skillId, entry.level);
  const tier = SkillSys.tierFor(ch, entry.skillId, lvl);
  return { skill: sk, tier, level: lvl, data: Object.assign({}, sk, sk.tiers[tier]) };
};

// ---- Journal (§3) — uncapped, survives death --------------------------------
// journal: { [skillId]: { witnessed: bool, sawTier: 'basic'|'intermediate'|'advanced', eligible: bool } }
SkillSys.ensureJournal = function (ch) { if (!ch.journal) ch.journal = {}; return ch.journal; };

// Record a sighting. Advanced sightings reveal the root and make the BASIC learnable free.
SkillSys.witness = function (ch, skillId, tierSeen, from) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return null; // unique tier is never witnessable (§14)
  if (sk.kind === 'perk') return null;               // perks are gold-only, never witnessed (§13d-2)
  const j = SkillSys.ensureJournal(ch);
  const e = j[skillId] || (j[skillId] = { witnessed: false, sawTier: 'basic', eligible: false });
  const order = { basic: 0, intermediate: 1, advanced: 2 };
  e.witnessed = true;
  e.eligible = true;
  if (order[tierSeen] > order[e.sawTier || 'basic']) e.sawTier = tierSeen;
  if (from && !e.from) e.from = from;   // who showed you — shown in the journal
  return e;
};

SkillSys.isWitnessed = function (ch, skillId) {
  return !!(ch.journal && ch.journal[skillId] && ch.journal[skillId].witnessed);
};

// ---- Trainer cost (§3/§16) --------------------------------------------------
SkillSys.trainerCost = function (ch, skillId) {
  if (SkillSys.freeSkillsRemaining(ch) > 0) return 0;
  const sk = SK()[skillId];
  if (sk && sk.kind === 'perk') return C().GOLD.skillUnwitnessed; // gold only (§13d-2)
  if (SkillSys.isWitnessed(ch, skillId)) return 0;
  return C().GOLD.skillUnwitnessed;
};

// Can this character buy/learn this skill at the trainer right now?
// Campaign skills are witness-only until a campaign is completed; campaign
// perks open the moment the player joins that faction (§13, §13d-2).
SkillSys.purchasable = function (ch, skillId, meta) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return false;
  if (!sk.faction) return true;
  if (ADV.Campaign) return ADV.Campaign.skillPurchasable(ch, skillId, meta);
  return false;
};

SkillSys.freeSkillsRemaining = function (ch) {
  const used = ch.freeSkillsUsed || 0;
  return Math.max(0, C().FREE_STARTING_SKILLS - used);
};

// ---- Capacity, learn, forget (§3) -------------------------------------------
SkillSys.capFor = function (ch, kind) {
  if (kind === 'perk') return ch.perkCap != null ? ch.perkCap : C().PLAYER_PERK_SLOTS;
  return ch.activeCap != null ? ch.activeCap : C().PLAYER_ACTIVE_SLOTS;
};

SkillSys.slotList = function (ch, kind) { return kind === 'perk' ? ch.perks : ch.actives; };

SkillSys.knows = function (ch, skillId) {
  return ch.perks.some(p => p.skillId === skillId) || ch.actives.some(a => a.skillId === skillId);
};

// Master Swordsman: katana skills don't consume active slots.
SkillSys.slotExempt = function (ch, sk) {
  if (sk.kind !== 'active' || !sk.katana) return false;
  return ch.perks.some(p => p.skillId === 'master_swordsman');
};

SkillSys.atCapacity = function (ch, kind) {
  const list = SkillSys.slotList(ch, kind);
  const counted = list.filter(e => {
    const sk = SK()[e.skillId];
    return !(sk && (sk.noSlot || SkillSys.slotExempt(ch, sk)));
  });
  return counted.length >= SkillSys.capFor(ch, kind);
};

// Learn a basic skill. Returns {ok, cost, error}. Caller pays gold beforehand via canLearn.
SkillSys.learn = function (ch, skillId, opts) {
  opts = opts || {};
  const sk = SK()[skillId];
  if (!sk) return { ok: false, error: 'unknown skill' };
  if (sk.unique && !opts.allowUnique) return { ok: false, error: 'unique tier — cannot be learned' };
  if (SkillSys.knows(ch, skillId)) return { ok: false, error: 'already known' };
  const kind = sk.kind === 'perk' ? 'perk' : 'active';
  if (!sk.noSlot && !SkillSys.slotExempt(ch, sk) && SkillSys.atCapacity(ch, kind) && !opts.forgetting) {
    return { ok: false, error: 'at capacity', needForget: true };
  }
  // Levels survive drops (§3): restore prior level from the meta record if present.
  const prior = (ch.skillLevels && ch.skillLevels[skillId]) || { level: 1, uses: 0 };
  const entry = { skillId, level: prior.level, uses: prior.uses };
  if (prior.auto) entry.auto = true;
  if (prior.autoOff) entry.autoOff = true;
  SkillSys.slotList(ch, kind).push(entry);
  const j = SkillSys.ensureJournal(ch);
  const je = j[skillId] || (j[skillId] = { witnessed: false, sawTier: 'basic', eligible: false });
  je.learned = true;
  if (!opts.free && !SkillSys.isWitnessed(ch, skillId) && SkillSys.freeSkillsRemaining(ch) > 0) {
    ch.freeSkillsUsed = (ch.freeSkillsUsed || 0) + 1;
  }
  return { ok: true, entry };
};

// Forget: returns to Eligible in the journal; level preserved in ch.skillLevels.
SkillSys.forget = function (ch, skillId) {
  for (const kind of ['perk', 'active']) {
    const list = SkillSys.slotList(ch, kind);
    const i = list.findIndex(e => e.skillId === skillId);
    if (i >= 0) {
      const e = list[i];
      SkillSys.storeProgress(ch, e);
      list.splice(i, 1);
      if (ch.journal && ch.journal[skillId]) ch.journal[skillId].learned = false;
      return { ok: true };
    }
  }
  return { ok: false, error: 'not known' };
};

// Paid tutoring (request): the trainer lifts a known active straight to a
// tier's threshold — 300g to Intermediate, 600g to Advanced. Perks are
// advanced-only already, so there is nothing to buy for them.
SkillSys.tutorOffers = function (ch, skillId) {
  const entry = ch.actives.find(a => a.skillId === skillId);
  const sk = SK()[skillId];
  if (!entry || !sk || sk.kind === 'perk' || sk.noTierGrowth) return [];
  const T = C().TIER_THRESHOLDS, G = C().GOLD;
  const out = [];
  if (entry.level < T.intermediate) out.push({ tier: 'intermediate', level: T.intermediate, cost: G.tutorIntermediate });
  if (entry.level < T.advanced) out.push({ tier: 'advanced', level: T.advanced, cost: G.tutorAdvanced });
  return out;
};
SkillSys.tutor = function (ch, skillId, tier) {
  const offer = SkillSys.tutorOffers(ch, skillId).find(o => o.tier === tier);
  if (!offer) return { ok: false, error: 'nothing to teach' };
  if (ch.inventory.gold < offer.cost) return { ok: false, error: 'not enough gold' };
  const entry = ch.actives.find(a => a.skillId === skillId);
  ch.inventory.gold -= offer.cost;
  entry.level = offer.level; entry.uses = Math.max(entry.uses, (offer.level - 1) * C().USES_PER_LEVEL);
  SkillSys.storeProgress(ch, entry);
  return { ok: true, level: entry.level };
};

// ---- Use & leveling (§15) ---------------------------------------------------
SkillSys.recordUse = function (ch, skillId) {
  const entry = ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId);
  if (!entry) return null;
  const sk = SK()[skillId];
  if (sk && sk.noTierGrowth) return null;
  if (sk && sk.kind === 'perk') return null;          // perks never level (§13d-2)
  let rate = 1;
  if (ADV.Campaign) rate *= ADV.Campaign.levelRate(ch, skillId);   // faction title 2x/3x
  const prodigy = ch.perks.find(e => e.skillId === 'prodigy');
  if (prodigy) rate *= 5;                              // Prodigy (advanced-only perk): 5x
  entry.uses += rate;
  const newLevel = 1 + Math.floor(entry.uses / C().USES_PER_LEVEL);
  const leveled = newLevel > entry.level;
  entry.level = Math.max(entry.level, newLevel);
  // Mirror into the persistent record so death/drops keep levels (§3).
  SkillSys.storeProgress(ch, entry);
  return leveled ? { leveled: true, level: entry.level, tier: SkillSys.tierForLevel(entry.level) } : null;
};

SkillSys.storeProgress = function (ch, entry) {
  if (!ch || !entry) return;
  ch.skillLevels = ch.skillLevels || {};
  const rec = ch.skillLevels[entry.skillId] || {};
  rec.level = entry.level;
  rec.uses = entry.uses;
  rec.auto = !!entry.auto;
  rec.autoOff = !!entry.autoOff;
  ch.skillLevels[entry.skillId] = rec;
};

// Journal view for the UI: Witnessed / Eligible / Learned / Mastered.
SkillSys.journalState = function (ch, skillId) {
  const j = (ch.journal && ch.journal[skillId]) || null;
  const entry = ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId);
  const lvl = entry ? entry.level : ((ch.skillLevels && ch.skillLevels[skillId]) || {}).level || 0;
  if (lvl >= C().TIER_THRESHOLDS.advanced) return 'Mastered';
  if (entry) return 'Learned';
  if (j && j.eligible) return 'Eligible';
  if (j && j.witnessed) return 'Witnessed';
  return null;
};

// Highest tier this character's version of the skill has reached (for enemy authoring).
SkillSys.entryFor = function (ch, skillId) {
  return ch.perks.find(p => p.skillId === skillId) || ch.actives.find(a => a.skillId === skillId) || null;
};

ADV.SkillSys = SkillSys;
})();
