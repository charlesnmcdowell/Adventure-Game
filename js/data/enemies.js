// Enemy roster (§17) — types + bosses. All loadouts draw from the
// shared 31-skill pool. Bosses reuse the type portrait, palette-shifted + scaled.
// camp is who they ARE: law / criminal / wild. A quest of one alignment
// never fields foes of the same camp (criminal jobs do not fight bandits;
// law jobs do not fight sentinels; neutral jobs field only beasts and monsters).
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.ENEMIES = {
  bandit: {
    id: 'bandit', name: 'Bandit', plural: 'Bandits', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['opportunist'], actives: ['backstab', 'smoke_bomb'],
    levels: [1, 16],
  },
  hedge_mage: {
    id: 'hedge_mage', name: 'Hedge Mage', plural: 'Hedge Mages', species: 'human', portrait: 'hedge_mage', camp: 'criminal',
    perks: ['arcane_focus'], actives: ['fire_bolt', 'frost_touch'],
    levels: [1, 16], hpMult: 0.55, // glass cannon: hits hard, dies fast
  },
  dire_wolf: {
    id: 'dire_wolf', name: 'Dire Wolf', plural: 'Dire Wolves', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['cleave'],
    levels: [1, 16], atkMult: 0.8, // fast and vicious but not a boss
  },
  town_watch: {
    id: 'town_watch', name: 'Town Watch', plural: 'Town Watch', species: 'human', portrait: 'plated_sentinel', camp: 'law',
    perks: ['bulwark'], actives: ['cleave', 'taunt'],
    levels: [1, 12],
  },
  plated_sentinel: {
    id: 'plated_sentinel', name: 'Plated Sentinel', plural: 'Plated Sentinels', species: 'construct', portrait: 'plated_sentinel', camp: 'law',
    perks: ['bulwark'], actives: ['cleave', 'taunt'],
    levels: [10, 24], armored: true,
  },
  grave_acolyte: {
    id: 'grave_acolyte', name: 'Grave Acolyte', plural: 'Grave Acolytes', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['regenerate', 'necromancy'],
    levels: [10, 20], usesOffensiveModes: true, hpMult: 0.8, // Regenerate cast as poison
  },
  // ---- debuff specialists (request 14): what the 300g/600g contracts field
  marsh_stalker: {
    id: 'marsh_stalker', name: 'Marsh Stalker', plural: 'Marsh Stalkers', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'smoke_bomb'],
    levels: [10, 24], hpMult: 0.85,
  },
  ember_cultist: {
    id: 'ember_cultist', name: 'Ember Cultist', plural: 'Ember Cultists', species: 'human', portrait: 'hedge_mage', camp: 'criminal',
    perks: ['pyromaniac'], actives: ['ember_lash', 'fire_bolt'],
    levels: [10, 24], hpMult: 0.6,
  },
  frost_hag: {
    id: 'frost_hag', name: 'Frost Hag', plural: 'Frost Hags', species: 'human', portrait: 'hedge_mage', camp: 'wild',
    perks: ['ice_queen'], actives: ['rime_grasp', 'frost_touch'],
    levels: [10, 24], hpMult: 0.7,
  },
  gravewarden: {
    id: 'gravewarden', name: 'Gravewarden', plural: 'Gravewardens', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['wither_touch', 'regenerate'],
    levels: [10, 24], usesOffensiveModes: true, hpMult: 0.9,
  },
  shadow_beast: {
    id: 'shadow_beast', name: 'Shadow Beast', plural: 'Shadow Beasts', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['cleave', 'thorn_skin'],
    levels: [14, 24], atkMult: 0.9,
  },
};

ADV.DATA.BOSSES = {
  bandit_king: {
    id: 'bandit_king', name: 'Bandit King', species: 'human', portrait: 'bandit', boss: true, camp: 'criminal',
    perks: ['opportunist', 'momentum'], actives: ['backstab', 'smoke_bomb', 'cleave', 'sunder'],
    levels: [25, 32],
  },
  archmagister: {
    id: 'archmagister', name: 'Archmagister', species: 'human', portrait: 'hedge_mage', boss: true, camp: 'law',
    perks: ['arcane_focus', 'bulwark'], actives: ['fire_bolt', 'frost_touch', 'shield_wall', 'taunt'],
    levels: [25, 32],
  },
  alpha: {
    id: 'alpha', name: 'Alpha', species: 'beast', portrait: 'dire_wolf', boss: true, camp: 'wild',
    perks: ['momentum', 'wild_form'], actives: ['cleave', 'beast_shape', 'thorn_skin'],
    levels: [25, 32],
  },
  sentinel_prime: {
    id: 'sentinel_prime', name: 'Sentinel Prime', species: 'construct', portrait: 'plated_sentinel', boss: true, camp: 'law',
    perks: ['bulwark', 'momentum'], actives: ['cleave', 'taunt', 'shield_wall', 'sunder'],
    levels: [25, 32], armored: true,
  },
  grave_bishop: {
    id: 'grave_bishop', name: 'Grave Bishop', species: 'human', portrait: 'grave_acolyte', boss: true, camp: 'criminal',
    perks: ['devoted', 'arcane_focus'], actives: ['regenerate', 'blood_pact', 'necromancy', 'conscript'],
    levels: [25, 32], usesOffensiveModes: true,
  },
};

function idsOf(book, camp) {
  return Object.keys(book).filter(id => book[id].camp === camp);
}

// Which types appear at which quest tier (skill level ranges align with §15a).
// Generation uses camp + level overlap; this table stays as a fallback hint.
ADV.DATA.TIER_ENEMY_TABLE = {
  1: ['bandit', 'hedge_mage', 'dire_wolf', 'town_watch'],
  2: ['bandit', 'hedge_mage', 'dire_wolf', 'plated_sentinel', 'town_watch', 'frost_hag'],
  3: ['dire_wolf', 'plated_sentinel', 'grave_acolyte', 'shadow_beast', 'frost_hag'],
  boss: ['bandit_king', 'archmagister', 'alpha', 'sentinel_prime', 'grave_bishop'],
  // the debuff contracts (request 14): poison / fire / frozen / heal-cancel
  debuff: ['marsh_stalker', 'ember_cultist', 'frost_hag', 'gravewarden'],
};

// Who a quest of that alignment is allowed to field (the opposing camp).
ADV.DATA.FACTION_ENEMIES = {
  law:      idsOf(ADV.DATA.ENEMIES, 'criminal'),
  criminal: idsOf(ADV.DATA.ENEMIES, 'law'),
  neutral:  idsOf(ADV.DATA.ENEMIES, 'wild'),
};
ADV.DATA.FACTION_BOSSES = {
  law:      idsOf(ADV.DATA.BOSSES, 'criminal'),
  criminal: idsOf(ADV.DATA.BOSSES, 'law'),
  neutral:  idsOf(ADV.DATA.BOSSES, 'wild'),
};
})();
