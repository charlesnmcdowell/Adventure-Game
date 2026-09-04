// Enemy roster (§17) — 5 types + 5 boss variants. All loadouts draw from the
// shared 31-skill pool. Bosses reuse the type portrait, palette-shifted + scaled.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.ENEMIES = {
  bandit: {
    id: 'bandit', name: 'Bandit', species: 'human', portrait: 'bandit',
    perks: ['opportunist'], actives: ['backstab', 'smoke_bomb'],
    levels: [1, 9],
  },
  hedge_mage: {
    id: 'hedge_mage', name: 'Hedge Mage', species: 'human', portrait: 'hedge_mage',
    perks: ['arcane_focus'], actives: ['fire_bolt', 'frost_touch'],
    levels: [1, 9], hpMult: 0.55, // glass cannon: hits hard, dies fast
  },
  dire_wolf: {
    id: 'dire_wolf', name: 'Dire Wolf', species: 'beast', portrait: 'dire_wolf',
    perks: ['momentum'], actives: ['cleave'],
    levels: [5, 14], atkMult: 0.8, // fast and vicious but not a boss
  },
  plated_sentinel: {
    id: 'plated_sentinel', name: 'Plated Sentinel', species: 'construct', portrait: 'plated_sentinel',
    perks: ['bulwark'], actives: ['cleave', 'taunt'],
    levels: [5, 14], armored: true,
  },
  grave_acolyte: {
    id: 'grave_acolyte', name: 'Grave Acolyte', species: 'human', portrait: 'grave_acolyte',
    perks: ['devoted'], actives: ['regenerate', 'necromancy'],
    levels: [10, 20], usesOffensiveModes: true, hpMult: 0.8, // Regenerate cast as poison
  },
  // ---- debuff specialists (request 14): what the 300g/600g contracts field
  marsh_stalker: {
    id: 'marsh_stalker', name: 'Marsh Stalker', species: 'human', portrait: 'bandit',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'smoke_bomb'],
    levels: [10, 24], hpMult: 0.85,
  },
  ember_cultist: {
    id: 'ember_cultist', name: 'Ember Cultist', species: 'human', portrait: 'hedge_mage',
    perks: ['pyromaniac'], actives: ['ember_lash', 'fire_bolt'],
    levels: [10, 24], hpMult: 0.6,
  },
  frost_hag: {
    id: 'frost_hag', name: 'Frost Hag', species: 'human', portrait: 'hedge_mage',
    perks: ['ice_queen'], actives: ['rime_grasp', 'frost_touch'],
    levels: [10, 24], hpMult: 0.7,
  },
  gravewarden: {
    id: 'gravewarden', name: 'Gravewarden', species: 'human', portrait: 'grave_acolyte',
    perks: ['devoted'], actives: ['wither_touch', 'regenerate'],
    levels: [10, 24], usesOffensiveModes: true, hpMult: 0.9,
  },
};

ADV.DATA.BOSSES = {
  bandit_king: {
    id: 'bandit_king', name: 'Bandit King', species: 'human', portrait: 'bandit', boss: true,
    perks: ['opportunist', 'momentum'], actives: ['backstab', 'smoke_bomb', 'cleave', 'sunder'],
    levels: [25, 32],
  },
  archmagister: {
    id: 'archmagister', name: 'Archmagister', species: 'human', portrait: 'hedge_mage', boss: true,
    perks: ['arcane_focus', 'bulwark'], actives: ['fire_bolt', 'frost_touch', 'shield_wall', 'taunt'],
    levels: [25, 32],
  },
  alpha: {
    id: 'alpha', name: 'Alpha', species: 'beast', portrait: 'dire_wolf', boss: true,
    perks: ['momentum', 'wild_form'], actives: ['cleave', 'beast_shape', 'thorn_skin'],
    levels: [25, 32],
  },
  sentinel_prime: {
    id: 'sentinel_prime', name: 'Sentinel Prime', species: 'construct', portrait: 'plated_sentinel', boss: true,
    perks: ['bulwark', 'momentum'], actives: ['cleave', 'taunt', 'shield_wall', 'sunder'],
    levels: [25, 32], armored: true,
  },
  grave_bishop: {
    id: 'grave_bishop', name: 'Grave Bishop', species: 'human', portrait: 'grave_acolyte', boss: true,
    perks: ['devoted', 'arcane_focus'], actives: ['regenerate', 'blood_pact', 'necromancy', 'conscript'],
    levels: [25, 32], usesOffensiveModes: true,
  },
};

// Which types appear at which quest tier (skill level ranges align with §15a).
ADV.DATA.TIER_ENEMY_TABLE = {
  1: ['bandit', 'hedge_mage', 'dire_wolf'],
  2: ['bandit', 'hedge_mage', 'dire_wolf', 'plated_sentinel'],
  3: ['dire_wolf', 'plated_sentinel', 'grave_acolyte'],
  boss: ['bandit_king', 'archmagister', 'alpha', 'sentinel_prime', 'grave_bishop'],
  // the debuff contracts (request 14): poison / fire / frozen / heal-cancel
  debuff: ['marsh_stalker', 'ember_cultist', 'frost_hag', 'gravewarden'],
};

// Faction flavor: which enemy families a quest's alignment leans toward.
ADV.DATA.FACTION_ENEMIES = {
  law:      ['bandit', 'grave_acolyte'],     // law contracts hunt criminals
  criminal: ['plated_sentinel', 'hedge_mage'], // criminal contracts hit guarded targets
  neutral:  ['dire_wolf', 'plated_sentinel', 'bandit'],
};
})();
