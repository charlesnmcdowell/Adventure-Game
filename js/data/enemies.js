// Enemy roster (§17) — types + bosses. All loadouts draw from the
// shared 31-skill pool plus unique monster skills. Bosses reuse the
// type portrait, palette-shifted + scaled.
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
    perks: ['septic_sanguine'], actives: ['venom_fang', 'wither_touch'],
    levels: [1, 16], hpMult: 0.6,
  },
  cutthroat: {
    id: 'cutthroat', name: 'Cutthroat', plural: 'Cutthroats', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb'],
    levels: [6, 20],
  },
  plague_knave: {
    id: 'plague_knave', name: 'Plague Knave', plural: 'Plague Knaves', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'wither_touch', 'smoke_bomb'],
    levels: [8, 22], hpMult: 0.8,
  },
  bleed_sister: {
    id: 'bleed_sister', name: 'Bleed Sister', plural: 'Bleed Sisters', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['opportunist'], actives: ['sunder', 'backstab', 'venom_fang'],
    levels: [8, 20],
  },
  dire_wolf: {
    id: 'dire_wolf', name: 'Dire Wolf', plural: 'Dire Wolves', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['pack_snap'],
    levels: [1, 16], atkMult: 0.8,
  },
  cave_boar: {
    id: 'cave_boar', name: 'Cave Boar', plural: 'Cave Boars', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['tusk_gore'],
    levels: [4, 18],
  },
  thorn_lurker: {
    id: 'thorn_lurker', name: 'Thorn Lurker', plural: 'Thorn Lurkers', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['wild_form'], actives: ['thorn_lash', 'thorn_skin'],
    levels: [6, 20],
  },
  cliff_raptor: {
    id: 'cliff_raptor', name: 'Cliff Raptor', plural: 'Cliff Raptors', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['opportunist'], actives: ['raptor_shred', 'pack_snap'],
    levels: [8, 22], atkMult: 0.9,
  },
  town_watch: {
    id: 'town_watch', name: 'Town Watch', plural: 'Town Watch', species: 'human', portrait: 'plated_sentinel', camp: 'law',
    perks: ['arcane_focus'], actives: ['fire_bolt', 'spark'],
    levels: [1, 12],
  },
  plated_sentinel: {
    id: 'plated_sentinel', name: 'Plated Sentinel', plural: 'Plated Sentinels', species: 'construct', portrait: 'plated_sentinel', camp: 'law',
    perks: ['arcane_focus'], actives: ['frost_touch', 'spark'],
    levels: [10, 24], armored: true,
  },
  storm_bailiff: {
    id: 'storm_bailiff', name: 'Storm Bailiff', plural: 'Storm Bailiffs', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['lightning_king'], actives: ['spark', 'frost_touch'],
    levels: [8, 22], hpMult: 0.7,
  },
  pyre_justicar: {
    id: 'pyre_justicar', name: 'Pyre Justicar', plural: 'Pyre Justicars', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['pyromaniac'], actives: ['fire_bolt', 'ember_lash'],
    levels: [8, 22], hpMult: 0.65,
  },
  rime_justicar: {
    id: 'rime_justicar', name: 'Rime Justicar', plural: 'Rime Justicars', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['ice_queen'], actives: ['frost_touch', 'rime_grasp'],
    levels: [10, 24], hpMult: 0.7,
  },
  grave_acolyte: {
    id: 'grave_acolyte', name: 'Grave Acolyte', plural: 'Grave Acolytes', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['regenerate', 'necromancy', 'wither_touch'],
    levels: [10, 20], usesOffensiveModes: true, hpMult: 0.8,
  },
  marsh_stalker: {
    id: 'marsh_stalker', name: 'Marsh Stalker', plural: 'Marsh Stalkers', species: 'human', portrait: 'bandit', camp: 'criminal',
    perks: ['septic_sanguine'], actives: ['venom_fang', 'smoke_bomb'],
    levels: [10, 24], hpMult: 0.85,
  },
  ember_cultist: {
    id: 'ember_cultist', name: 'Ember Cultist', plural: 'Ember Cultists', species: 'human', portrait: 'hedge_mage', camp: 'law',
    perks: ['pyromaniac'], actives: ['ember_lash', 'fire_bolt'],
    levels: [10, 24], hpMult: 0.6,
  },
  frost_hag: {
    id: 'frost_hag', name: 'Frost Hag', plural: 'Frost Hags', species: 'beast', portrait: 'hedge_mage', camp: 'wild',
    perks: ['ice_queen'], actives: ['coven_rime', 'rime_grasp'],
    levels: [10, 24], hpMult: 0.7,
  },
  gravewarden: {
    id: 'gravewarden', name: 'Gravewarden', plural: 'Gravewardens', species: 'human', portrait: 'grave_acolyte', camp: 'criminal',
    perks: ['devoted'], actives: ['wither_touch', 'regenerate', 'venom_fang'],
    levels: [10, 24], usesOffensiveModes: true, hpMult: 0.9,
  },
  shadow_beast: {
    id: 'shadow_beast', name: 'Shadow Beast', plural: 'Shadow Beasts', species: 'beast', portrait: 'dire_wolf', camp: 'wild',
    perks: ['momentum'], actives: ['umbral_rake', 'thorn_skin'],
    levels: [14, 24], atkMult: 0.9,
  },
};

ADV.DATA.BOSSES = {
  bandit_king: {
    id: 'bandit_king', name: 'Bandit King', species: 'human', portrait: 'bandit', boss: true, camp: 'criminal',
    perks: ['opportunist', 'septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb', 'sunder'],
    levels: [25, 32],
    hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  },
  archmagister: {
    id: 'archmagister', name: 'Archmagister', species: 'human', portrait: 'hedge_mage', boss: true, camp: 'law',
    perks: ['arcane_focus', 'ice_queen'], actives: ['fire_bolt', 'frost_touch', 'spark', 'rime_grasp'],
    levels: [25, 32],
    hitStatus: { kind: 'burn', power: 0.8, rounds: 2 },
  },
  alpha: {
    id: 'alpha', name: 'Alpha', species: 'beast', portrait: 'dire_wolf', boss: true, camp: 'wild',
    perks: ['momentum', 'wild_form'], actives: ['pack_snap', 'cleave', 'beast_shape', 'thorn_skin'],
    levels: [25, 32],
    hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  },
  sentinel_prime: {
    id: 'sentinel_prime', name: 'Sentinel Prime', species: 'construct', portrait: 'plated_sentinel', boss: true, camp: 'law',
    perks: ['arcane_focus', 'ice_queen'], actives: ['frost_touch', 'spark', 'fire_bolt', 'shield_wall'],
    levels: [25, 32], armored: true,
  },
  grave_bishop: {
    id: 'grave_bishop', name: 'Grave Bishop', species: 'human', portrait: 'grave_acolyte', boss: true, camp: 'criminal',
    perks: ['devoted', 'septic_sanguine'], actives: ['regenerate', 'wither_touch', 'venom_fang', 'conscript'],
    levels: [25, 32], usesOffensiveModes: true,
    hitStatus: { kind: 'poison', power: 0.7, rounds: 3, stacks: true },
  },
};

function idsOf(book, camp) {
  return Object.keys(book).filter(id => book[id].camp === camp);
}

ADV.DATA.TIER_ENEMY_TABLE = {
  1: ['bandit', 'hedge_mage', 'dire_wolf', 'town_watch', 'cave_boar', 'cutthroat'],
  2: ['bandit', 'hedge_mage', 'dire_wolf', 'plated_sentinel', 'town_watch', 'frost_hag',
      'cutthroat', 'plague_knave', 'storm_bailiff', 'pyre_justicar', 'thorn_lurker', 'cliff_raptor'],
  3: ['dire_wolf', 'plated_sentinel', 'grave_acolyte', 'shadow_beast', 'frost_hag',
      'bleed_sister', 'rime_justicar', 'cave_boar', 'cliff_raptor'],
  boss: ['bandit_king', 'archmagister', 'alpha', 'sentinel_prime', 'grave_bishop'],
  debuff: ['marsh_stalker', 'plague_knave', 'frost_hag', 'gravewarden', 'ember_cultist'],
};

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
