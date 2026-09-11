// Varenholm's Gate story campaign — content data (VARENHOLMS_GATE_CAMPAIGN.md §3-§4).
// Extends the shared campaign tables so ADV.Campaign's generic spawner / actor
// helpers work on this cast unchanged. Dialogue and choices live in
// campaign3_dialogue.js; the engine in js/core/campaign3.js.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const D = ADV.DATA;

// ---------------------------------------------------------------- the faction (§0)
// One "faction" so every generic table has a home. The story is linear; the
// recruiter/rival/boss/antagonist slots satisfy the shared coverage tests.
Object.assign(D.FACTIONS, {
  gate: {
    id: 'gate', name: "Varenholm's Gate", short: 'the Gate', alignment: 'neutral', campaign3: true,
    hall: 'The Open Hand Inn', archetypes: ['fighter', 'rogue'],
    recruiter: 'aldric', rival: 'wren_ward', boss: 'korvath', antagonist: 'korvath',
    titles: ["Aldric's Ward", 'The Hunted', 'Child of the Gate'],
    gearSet: 'wardens_gear', gate: { contracts: 0, alignment: null },
    blurb: 'A road that starts at a library and ends under a city. Someone on it has been paying to have you killed since before you could hold a sword.',
  },
});
D.CAMPAIGN3_FACTION_ID = 'gate';

// Issued at the ending, never sold.
Object.assign(D.GEAR_SETS, {
  wardens_gear: { name: "Warden's Gear", archetypes: ['fighter', 'rogue', 'healer'], cost: 0, floor: 15, advanceTier: true, campaign: 'gate' },
});

// ---------------------------------------------------------------- characters (§3)
const CH = D.CAMPAIGN_CHARS;
function chr(o) { o.campaign3 = true; o.faction = o.faction || 'gate'; CH[o.id] = o; }

// 3a — companions. `companion:true`; `romance:true` where courting is possible;
// `favours` names the ending they hope for (§5). Levels scale per quest (§3a).
chr({ id: 'wren_ward', name: 'Wren', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: 'Your foster-sister from Lanternhold. Quick hands, quicker mouth, hides fear behind jokes.',
  perks: ['opportunist'], actives: ['backstab', 'smoke_bomb', 'shadow_rise', 'aimed_shot'],
  portrait: { skin: 'fair', hair: 'sidecut', wardrobe: 'hiking', color: '#b04a8a' } });
chr({ id: 'dorran', name: 'Dorran', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: "A Warden fighter with a stammer he hates and a shield he never puts down. Selene's husband.",
  perks: ['bulwark'], actives: ['cleave', 'shield_wall', 'sunder', 'taunt'],
  portrait: { skin: 'tan', hair: 'fringe', wardrobe: 'armor', color: '#4e5a3a' } });
chr({ id: 'selene', name: 'Selene', role: 'companion', companion: true, sex: 'f', campaignExit: true, romance: true, favours: 'hero',
  desc: "A Warden druid, Aldric's old friend. Blunt, protective, allergic to self-pity. Speaks for the balance of things.",
  perks: ['wild_form'], actives: ['thorn_skin', 'mend', 'beast_shape', 'grove_raise'],
  portrait: { skin: 'brown', hair: 'braids', wardrobe: 'hide', color: '#3a5a3a' } });
chr({ id: 'vess', name: 'Vess', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'An Umbral Hand necromancer who giggles at wounds. Unstable, brilliant, always listening for the Hand.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'spark', 'ember_lash', 'wither_touch'],
  portrait: { skin: 'pale', hair: 'long', wardrobe: 'robe', color: '#3a2a4a' } });
chr({ id: 'fennick', name: 'Fennick', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: "Vess's halfling minder. Sour, practical, would sell you for a good boot. Umbral Hand.",
  perks: ['septic_sanguine'], actives: ['backstab', 'venom_fang', 'smoke_bomb', 'aimed_shot'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hiking', color: '#5a4a2a' } });
chr({ id: 'cassian', name: 'Cassian', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'hero',
  desc: 'A squire of the Order of the Dawning Flame on his first errand. Earnest, rigid, secretly terrified of failing.',
  perks: ['bulwark'], actives: ['shield_wall', 'taunt', 'cleanse', 'stand_fast'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'armor', color: '#d8d2c2' } });
chr({ id: 'ithrel', name: 'Ithrel', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'kill',
  desc: 'An elf ranger who has hunted the bandit lord Gorruk for a year. Grief made him quiet; the quiet made him precise.',
  perks: ['marksman'], actives: ['aimed_shot', 'snare', 'beast_shape', 'cleave'],
  portrait: { skin: 'pale', hair: 'long', wardrobe: 'hide', color: '#2f3a2f' } });
chr({ id: 'bramm', name: 'Bramm', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A huge, loud ranger with a hamster named Pip on his shoulder and a witch to protect. Loyal to the bone.',
  perks: ['momentum'], actives: ['aimed_shot', 'cleave', 'defiant_stand', 'snare'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hide', color: '#6a3a5a' } });
chr({ id: 'ysolde', name: 'Ysolde', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: "A Kalden witch under Bramm's guard. Formal, watchful, sees the bloodline in you before you do.",
  perks: ['arcane_focus'], actives: ['frost_touch', 'rime_grasp', 'spark', 'fire_bolt'],
  portrait: { skin: 'dark', hair: 'twists', wardrobe: 'robe', color: '#4a3a6a' } });
chr({ id: 'aurelius', name: 'Aurelius', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A Crimson Wizard of Vashk who narrates his own superiority under his breath. Wants Ysolde dead; wants you useful.',
  perks: ['pyromaniac'], actives: ['fire_bolt', 'ember_lash', 'spark', 'frost_touch'],
  portrait: { skin: 'brown', hair: 'bald', wardrobe: 'robe', color: '#7a2a2a' } });
chr({ id: 'ilvara', name: 'Ilvara', role: 'companion', companion: true, sex: 'f', campaignExit: true, romance: true, favours: 'usurper',
  desc: 'A dark-elf priestess fleeing her own people and a bounty. Contemptuous, curious, thinks mercy is a luxury the strong buy.',
  perks: ['devoted'], actives: ['mend', 'wither_touch', 'blood_pact', 'cleanse'],
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'dress', color: '#2a2438' } });
chr({ id: 'faelen', name: 'Faelen', role: 'companion', companion: true, sex: 'm', campaignExit: true, romance: true, favours: 'thieves',
  desc: 'An elf bounty-hunter who flirts with anything and finishes every job. Cheerful, mercenary, surprisingly loyal.',
  perks: ['opportunist'], actives: ['aimed_shot', 'backstab', 'snare', 'smoke_bomb'],
  portrait: { skin: 'fair', hair: 'ponytail', wardrobe: 'hide', color: '#5a6a3a' } });
chr({ id: 'nettle', name: 'Nettle', role: 'companion', companion: true, sex: 'f', campaignExit: true,
  desc: 'An Umbra druid who believes the forest is owed blood. Fierce, literal, no patience for cities.',
  perks: ['wild_form'], actives: ['beast_shape', 'thorn_skin', 'grove_raise', 'wither_touch'],
  portrait: { skin: 'tan', hair: 'locs', wardrobe: 'hide', color: '#2a4a2a' } });
chr({ id: 'durnik', name: 'Durnik', role: 'companion', companion: true, sex: 'm', campaignExit: true,
  desc: 'A dwarf priest whose clan dug the Mirkhollow mine before the Consortium stole it. Slow to anger, impossible to move.',
  perks: ['bulwark'], actives: ['shield_wall', 'mend', 'taunt', 'regenerate'],
  portrait: { skin: 'tan', hair: 'bald', wardrobe: 'armor', color: '#6a5a3a' } });
chr({ id: 'amara', name: 'Amara', role: 'companion', companion: true, sex: 'f', campaignExit: true, romance: true, favours: 'mercy',
  desc: "Korvath's lover and sword-hand. A monk of the fire temples who wants him stopped, not slaughtered. Grave, exact, tired.",
  perks: ['momentum'], actives: ['dual_swords', 'counter_attack', 'defiant_stand', 'cleave'],
  portrait: { skin: 'tan', hair: 'bun', wardrobe: 'armor', color: '#7a3a2a' } });

// 3b — principals who never fight beside you (display-only actors)
chr({ id: 'aldric', name: 'Aldric', role: 'recruiter', sex: 'm', fights: false, level: 30,
  desc: 'Your foster-father, a retired Warden mage. Gentle voice, iron patience, a man who has planned for this night for twenty years.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'guardian_ward'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'robe', color: '#5a5a6a' } });
chr({ id: 'torvald', name: 'Torvald', role: 'sage', sex: 'm', fights: false, level: 40,
  desc: 'The sage in the grey cloak. Old beyond reason, amused by everything, tells you exactly as much as he decides you can carry.',
  perks: ['arcane_focus'], actives: ['spark', 'frost_touch'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'robe', color: '#4a4a5a' } });
chr({ id: 'tollan', name: 'Tollan Ashgrave', role: 'mayor', sex: 'm', fights: false, level: 8,
  desc: 'Mayor of Dunmere. Sweating, harried, honest enough. Would pay anyone to make the mine problem someone else\'s.',
  perks: [], actives: ['basic_attack'],
  portrait: { skin: 'tan', hair: 'fringe', wardrobe: 'suit', color: '#5a4a3a' } });
chr({ id: 'halloran', name: 'Halloran', role: 'officer', sex: 'm', fights: false, level: 22,
  desc: 'A Burning Gauntlet officer with a burn-scarred jaw. Plain-spoken, fair, dead by the eleventh chapter.',
  perks: ['bulwark'], actives: ['shield_wall', 'cleave'],
  portrait: { skin: 'brown', hair: 'buzz', wardrobe: 'armor', color: '#8a3a2a' } });
chr({ id: 'halvard', name: 'Duke Halvard', role: 'duke', sex: 'm', fights: false, level: 28,
  desc: 'Grand Duke and commander of the Burning Gauntlet. Tired, precise, poisoned by the end.',
  perks: ['bulwark'], actives: ['cleave', 'shield_wall'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'suit', color: '#8a2a2a' } });
chr({ id: 'orlan', name: 'Duke Orlan', role: 'duke', sex: 'm', fights: false, level: 26,
  desc: 'A Grand Duke who was a soldier first and still stands like one. Loud, decent, easily bored.',
  perks: ['momentum'], actives: ['cleave'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'suit', color: '#3a3a6a' } });
chr({ id: 'mira', name: 'Duke Mira Vashti', role: 'duke', sex: 'f', fights: false, level: 26,
  desc: 'A Grand Duke and a mage. Watches everyone, trusts nobody, and is usually right.',
  perks: ['arcane_focus'], actives: ['spark'],
  portrait: { skin: 'brown', hair: 'bun', wardrobe: 'dress', color: '#6a3a6a' } });
chr({ id: 'ambrose', name: 'Ambrose', role: 'keeper', sex: 'm', fights: false, level: 20,
  desc: "A keeper of Lanternhold and Aldric's friend. Kind eyes, careful hands, keeps the letter you were never supposed to read.",
  perks: [], actives: ['mend'],
  portrait: { skin: 'pale', hair: 'bald', wardrobe: 'robe', color: '#5a5a5a' } });
chr({ id: 'hadrian', name: 'Hadrian', role: 'keeper', sex: 'm', fights: false, level: 20,
  desc: 'First Keeper of Lanternhold. Proud of the library and suspicious of everyone who leaves it, you most of all.',
  perks: [], actives: ['spark'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'robe', color: '#4a4a4a' } });
chr({ id: 'cael', name: 'Cael Voss', role: 'spy', sex: 'm', fights: false, level: 14,
  desc: 'A Warden spy who was caught. Half-starved, still joking, remembers every name he heard in the tent.',
  perks: [], actives: ['aimed_shot'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'hiking', color: '#4a4a3a' } });
chr({ id: 'fen', name: 'Fen Nightstep', role: 'thief', sex: 'm', fights: false, level: 24,
  desc: "The thieves' guild's voice in the Undervault. Soft-spoken, keeps ledgers of favours, never forgets a debt.",
  perks: ['opportunist'], actives: ['backstab', 'smoke_bomb'],
  portrait: { skin: 'brown', hair: 'cornrows', wardrobe: 'suit', color: '#2a2a2a' } });
chr({ id: 'lysandra', name: 'Lysandra', role: 'mistress', sex: 'f', fights: false, level: 24,
  desc: "Korvath's mistress and the Consortium's cleverest survivor. Silk voice, ledger heart, offers a deal in every sentence.",
  perks: ['charm'], actives: ['spark'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'dress', color: '#7a2a4a' } });
chr({ id: 'ostwin', name: 'Ostwin Verlaine', role: 'tutor', sex: 'm', fights: false, level: 30,
  desc: "Korvath's tutor in the old prophecies. Dry, doting, the only one who calls Korvath 'my boy'.",
  perks: ['arcane_focus'], actives: ['frost_touch', 'spark'],
  portrait: { skin: 'pale', hair: 'bald', wardrobe: 'robe', color: '#3a3a4a' } });
chr({ id: 'sarn', name: 'Sarn', role: 'stranger', sex: 'm', fights: false, level: 30,
  desc: 'A quiet stranger with a ring to give away. The disguise Korvath wears when he wants to watch you choose.',
  perks: [], actives: ['cleave'],
  portrait: { skin: 'fair', hair: 'hood', wardrobe: 'hiking', color: '#3a3a3a' } });

// 3c — bosses and named enemies (they fight against you)
chr({ id: 'korvath', name: 'Korvath Dreyne', epithet: 'the Armoured', role: 'antagonist', sex: 'm', level: 30,
  desc: 'Your half-brother. A giant in spiked black plate who believes bloodshed is a ladder. Calm, courteous, absolutely certain.',
  perks: ['momentum', 'bulwark'], actives: ['cleave', 'sunder', 'defiant_stand', 'shield_wall', 'finisher', 'taunt'],
  statMult: 1.35, hitStatus: { kind: 'bleed', power: 0.6, rounds: 3, stacks: true },
  portrait: { skin: 'pale', hair: 'bald', wardrobe: 'armor', color: '#1a1a1e' } });
chr({ id: 'morwin', name: 'Morwin', role: 'boss', sex: 'm', level: 8,
  desc: 'A hired mage-assassin with a bounty notice in his coat. Talks too much before he casts.',
  perks: ['arcane_focus'], actives: ['fire_bolt', 'spark', 'frost_touch', 'ember_lash'],
  portrait: { skin: 'tan', hair: 'fringe', wardrobe: 'robe', color: '#4a2a2a' } });
chr({ id: 'lessa', name: 'Lessa', role: 'boss', sex: 'f', level: 9,
  desc: 'A knife for hire who takes her work personally. Smiles when she is losing.',
  perks: ['opportunist'], actives: ['backstab', 'venom_fang', 'smoke_bomb', 'shadow_rise'],
  portrait: { skin: 'brown', hair: 'ponytail', wardrobe: 'hiking', color: '#3a2a3a' } });
chr({ id: 'verlan', name: 'Verlan', role: 'boss', sex: 'm', level: 10,
  desc: "The Consortium's courier in Thornbury, posing as a wine merchant. Sweats when questioned, folds when paid.",
  perks: ['arcane_focus'], actives: ['frost_touch', 'spark'],
  portrait: { skin: 'fair', hair: 'fringe', wardrobe: 'suit', color: '#5a3a5a' } });
chr({ id: 'grukhar', name: 'Grukhar', role: 'boss', sex: 'm', level: 12,
  desc: 'A half-orc priest of Veylan poisoning the Dunmere ore for pay he has not been paid. Bitter, frightened, dangerous.',
  perks: ['devoted'], actives: ['wither_touch', 'blood_pact', 'mend', 'mace_swing', 'raise'],
  portrait: { skin: 'ashen', hair: 'bald', wardrobe: 'robe', color: '#3a3a2a' } });
chr({ id: 'gorruk', name: 'Gorruk', epithet: 'the Bandit Lord', role: 'boss', sex: 'm', level: 16,
  desc: 'An ogre-mage who runs the bandit companies for the Consortium. Cruel for sport, cowardly when it counts.',
  perks: ['momentum', 'arcane_focus'], actives: ['cleave', 'sunder', 'fire_bolt', 'defiant_stand', 'taunt'],
  statMult: 1.3,
  portrait: { skin: 'ashen', hair: 'long', wardrobe: 'armor', color: '#4a3a2a' } });
chr({ id: 'thornwise', name: 'Thornwise', epithet: 'Archdruid', role: 'boss', sex: 'm', level: 15,
  desc: 'The Umbra archdruid. Believes every axe-holder deserves a root through the chest.',
  perks: ['wild_form'], actives: ['thorn_skin', 'grove_raise', 'wither_touch', 'beast_shape', 'snare'],
  portrait: { skin: 'tan', hair: 'long', wardrobe: 'hide', color: '#2a4a2a' } });
chr({ id: 'malvane', name: 'Malvane', role: 'boss', sex: 'm', level: 17,
  desc: "The Consortium mage running the Mirkhollow mine. Fussy, meticulous, keeps the slaves' names in a ledger.",
  perks: ['ice_queen', 'arcane_focus'], actives: ['frost_touch', 'rime_grasp', 'spark', 'fire_bolt', 'ember_lash'],
  portrait: { skin: 'pale', hair: 'fringe', wardrobe: 'robe', color: '#2a3a5a' } });
chr({ id: 'grell', name: 'Grell', role: 'boss', sex: 'm', level: 20,
  desc: "Korvath's best knife, sent into the catacombs to finish it. Professional, bored, unbothered by tombs.",
  perks: ['opportunist', 'sniper'], actives: ['backstab', 'aimed_shot', 'shadow_rise', 'venom_fang', 'smoke_bomb'],
  portrait: { skin: 'brown', hair: 'buzz', wardrobe: 'hiking', color: '#2a2a2a' } });
chr({ id: 'idris', name: 'Idris', role: 'boss', sex: 'm', level: 21,
  desc: "The 'healer' at Duke Halvard's bedside. A doppelganger wearing a physician.",
  perks: ['devoted'], actives: ['wither_touch', 'blood_pact', 'backstab', 'shadow_rise', 'mend'],
  portrait: { skin: 'pale', hair: 'fringe', wardrobe: 'robe', color: '#4a4a5a' } });
chr({ id: 'ravel', name: 'Ravel', role: 'boss', sex: 'm', level: 22,
  desc: "Half of Korvath's pet assassins. Loud, vain, deadly with two blades.",
  perks: ['momentum'], actives: ['dual_swords', 'backstab', 'smoke_bomb', 'cleave', 'venom_fang'],
  portrait: { skin: 'fair', hair: 'long', wardrobe: 'suit', color: '#5a2a3a' } });
chr({ id: 'kessa', name: 'Kessa', role: 'boss', sex: 'f', level: 22,
  desc: "The other half. Quiet, a mage, the one who actually plans.",
  perks: ['lightning_king'], actives: ['spark', 'frost_touch', 'rime_grasp', 'ember_lash', 'fire_bolt'],
  portrait: { skin: 'pale', hair: 'bun', wardrobe: 'dress', color: '#3a2a5a' } });
chr({ id: 'jarem', name: 'Jarem', role: 'boss', sex: 'm', level: 24,
  desc: "Korvath's court mage. Serves because Korvath is winning; would serve anyone who was.",
  perks: ['arcane_focus', 'pyromaniac'], actives: ['fire_bolt', 'ember_lash', 'spark', 'frost_touch', 'rime_grasp'],
  portrait: { skin: 'tan', hair: 'bald', wardrobe: 'robe', color: '#5a3a2a' } });
chr({ id: 'lucan', name: 'Lucan Marr', role: 'boss', sex: 'm', level: 25,
  desc: 'The Burning Gauntlet officer who sold the company to Korvath. Commands it now. Sneers to hide the shame.',
  perks: ['bulwark', 'momentum'], actives: ['cleave', 'shield_wall', 'sunder', 'taunt', 'defiant_stand'],
  portrait: { skin: 'brown', hair: 'fringe', wardrobe: 'armor', color: '#7a3a2a' } });
chr({ id: 'maddox', name: 'Maddox Dreyne', role: 'boss', sex: 'm', level: 18,
  desc: "Head of the Iron Consortium's Gate office and Korvath's foster-father. A merchant who thinks he is still in charge.",
  perks: ['rich'], actives: ['mace_swing', 'cleave'],
  portrait: { skin: 'pale', hair: 'fringe', wardrobe: 'suit', color: '#2a2a3a' } });
chr({ id: 'vask', name: 'Dorin Vask', role: 'boss', sex: 'm', level: 18,
  desc: "A Consortium leader; Maddox's partner. Louder than he is clever.",
  perks: ['momentum'], actives: ['cleave', 'sunder'],
  portrait: { skin: 'tan', hair: 'buzz', wardrobe: 'suit', color: '#3a2a2a' } });
chr({ id: 'rennick', name: 'Rennick', role: 'boss', sex: 'm', level: 18,
  desc: "A Consortium leader; the accountant. Would like to survive this meeting.",
  perks: ['arcane_focus'], actives: ['spark', 'frost_touch'],
  portrait: { skin: 'brown', hair: 'bald', wardrobe: 'suit', color: '#2a3a3a' } });

// ---------------------------------------------------------------- enemies (§4)
const EN = D.CAMPAIGN_ENEMIES;
function en(o) { o.campaign3 = true; o.faction = 'gate'; EN[o.id] = o; }
// humans
en({ id: 'hired_knife', name: 'Hired Knife', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Road Cloak', tint: '#3a3028' }, { name: 'Ash Cloak', tint: '#2a2a2a' }, { name: 'Wet Cloak', tint: '#2a3038' }],
  pool: ['backstab', 'smoke_bomb', 'venom_fang', 'aimed_shot', 'shadow_rise'] });
en({ id: 'gate_bandit', name: 'Road Bandit', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Frostbite', tint: '#3a4a5a' }, { name: 'Ashtalon', tint: '#4a3a2a' }, { name: 'Freeblade', tint: '#3a3a3a' }],
  pool: ['cleave', 'aimed_shot', 'snare', 'sunder', 'mace_swing'] });
en({ id: 'bandit_archer', name: 'Bandit Archer', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Treeline', tint: '#2a3a2a' }, { name: 'Ridge', tint: '#3a3a2a' }, { name: 'Ford', tint: '#2a3a3a' }],
  pool: ['aimed_shot', 'snare', 'marksman', 'venom_fang', 'smoke_bomb'] });
en({ id: 'hob_sergeant', name: 'Hobgoblin Sergeant', species: 'human', portrait: 'orc', equips: 3,
  skins: [{ name: 'Frostbite Company', tint: '#3a4a5a' }, { name: 'Ashtalon Company', tint: '#4a3a2a' }, { name: 'Deserter', tint: '#3a3a3a' }],
  pool: ['dual_swords', 'cleave', 'shield_wall', 'taunt', 'defiant_stand'] });
en({ id: 'consortium_guard', name: 'Consortium Guard', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Iron Livery', tint: '#4a4a52' }, { name: 'Black Livery', tint: '#2a2a2e' }, { name: 'Mine Detail', tint: '#4a3a2a' }],
  pool: ['shield_wall', 'sunder', 'taunt', 'defiant_stand', 'mace_swing'] });
en({ id: 'consortium_mage', name: 'Consortium Mage', species: 'human', portrait: 'hedge_mage', equips: 2,
  skins: [{ name: 'Ledger Cowl', tint: '#2a3a5a' }, { name: 'Seal Cowl', tint: '#3a2a4a' }, { name: 'Ash Cowl', tint: '#3a3a3a' }],
  pool: ['fire_bolt', 'frost_touch', 'spark', 'ember_lash', 'rime_grasp'] });
en({ id: 'slave_driver', name: 'Slave Driver', species: 'human', portrait: 'bandit', equips: 2,
  skins: [{ name: 'Whip Hand', tint: '#4a3a2a' }, { name: 'Chain Hand', tint: '#3a3a3a' }, { name: 'Lamp Hand', tint: '#5a4a2a' }],
  pool: ['cleave', 'snare', 'taunt', 'mace_swing', 'sunder'] });
en({ id: 'veylan_acolyte', name: 'Acolyte of Veylan', species: 'human', portrait: 'grave_acolyte', equips: 2,
  skins: [{ name: 'Black Sun', tint: '#2a2a2a' }, { name: 'Bone Cowl', tint: '#3a3a32' }, { name: 'Rust Cowl', tint: '#4a2a2a' }],
  pool: ['mend', 'wither_touch', 'cleanse', 'blood_pact', 'regenerate'] });
en({ id: 'umbra_druid', name: 'Umbra Druid', species: 'human', portrait: 'hedge_mage', equips: 2,
  skins: [{ name: 'Moss Robe', tint: '#2a4a2a' }, { name: 'Bark Robe', tint: '#3a3a2a' }, { name: 'Fern Robe', tint: '#2a3a2a' }],
  pool: ['thorn_skin', 'beast_shape', 'grove_raise', 'wither_touch', 'snare'] });
en({ id: 'gauntlet_soldier', name: 'Burning Gauntlet Soldier', species: 'human', portrait: 'plated_sentinel', equips: 2,
  skins: [{ name: 'Flame Tabard', tint: '#8a3a2a' }, { name: 'Ash Tabard', tint: '#5a3a2a' }, { name: 'Night Watch', tint: '#3a2a2a' }],
  pool: ['shield_wall', 'cleave', 'taunt', 'stand_fast', 'sunder'] });
en({ id: 'gauntlet_traitor', name: 'Gauntlet Turncoat', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: "Marr's Own", tint: '#5a2a2a' }, { name: 'Bought Blade', tint: '#3a2a2a' }, { name: 'Late Loyalty', tint: '#4a3a3a' }],
  pool: ['cleave', 'sunder', 'shield_wall', 'defiant_stand', 'taunt'] });
en({ id: 'morrak_cultist', name: 'Cultist of Morrak', species: 'human', portrait: 'grave_acolyte', equips: 3,
  skins: [{ name: 'Blood Cowl', tint: '#4a1a1a' }, { name: 'Skull Cowl', tint: '#2a2a2a' }, { name: 'Ash Cowl', tint: '#3a3a3a' }],
  pool: ['wither_touch', 'blood_pact', 'raise', 'spark', 'fire_bolt'] });
en({ id: 'palace_doppelganger', name: 'Palace Guard', species: 'human', portrait: 'plated_sentinel', equips: 3,
  skins: [{ name: 'Ducal Livery', tint: '#3a3a6a' }, { name: 'Hall Livery', tint: '#5a5a3a' }, { name: 'Gate Livery', tint: '#4a4a4a' }],
  pool: ['backstab', 'shadow_rise', 'cleave', 'smoke_bomb', 'frost_touch'] });
en({ id: 'tomb_ghoul', name: 'Tomb Ghoul', species: 'human', portrait: 'grave_acolyte', equips: 2, undead: true,
  skins: [{ name: 'Dust', tint: '#3a3a32' }, { name: 'Wrapped', tint: '#4a4a3a' }, { name: 'Split', tint: '#2a2a2a' }],
  pool: ['venom_fang', 'cleave', 'wither_touch', 'backstab', 'snare'], statusImmunities: ['poison', 'bleed'] });
// creatures (illustrated creature ids)
en({ id: 'road_wolf', name: 'Road Wolf', species: 'beast', portrait: 'dire_wolf', equips: 2,
  skins: [{ name: 'Grey', tint: '#5a5a5a' }, { name: 'Black', tint: '#2a2a2a' }, { name: 'Scarred', tint: '#4a3a3a' }],
  pool: ['cleave', 'venom_fang', 'snare', 'defiant_stand', 'counter_attack'] });
en({ id: 'tunnel_kobold', name: 'Tunnel Kobold', species: 'beast', portrait: 'goblin', equips: 2,
  skins: [{ name: 'Pick Team', tint: '#4a3a2a' }, { name: 'Lamp Team', tint: '#5a4a2a' }, { name: 'Poison Team', tint: '#3a4a2a' }],
  pool: ['aimed_shot', 'venom_fang', 'smoke_bomb', 'snare', 'backstab'] });
en({ id: 'kobold_shaman', name: 'Kobold Shaman', species: 'beast', portrait: 'goblin', equips: 3,
  skins: [{ name: 'Bone Mask', tint: '#5a5a3a' }, { name: 'Ash Mask', tint: '#3a3a3a' }, { name: 'Ore Mask', tint: '#4a3a5a' }],
  pool: ['fire_bolt', 'spark', 'wither_touch', 'mend', 'snare'] });
en({ id: 'gnoll_raider', name: 'Gnoll Raider', species: 'beast', portrait: 'hound', equips: 2,
  skins: [{ name: 'Yellow', tint: '#6a5a2a' }, { name: 'Brindle', tint: '#4a3a2a' }, { name: 'Grey', tint: '#4a4a4a' }],
  pool: ['cleave', 'mace_swing', 'defiant_stand', 'snare', 'taunt'] });
en({ id: 'web_spider', name: 'Giant Spider', species: 'beast', portrait: 'spider', equips: 2,
  skins: [{ name: 'Web-Black', tint: '#2a2a2a' }, { name: 'Bark', tint: '#4a3a2a' }, { name: 'Bone', tint: '#5a5a4a' }],
  pool: ['venom_fang', 'snare', 'backstab', 'smoke_bomb', 'cleave'] });
en({ id: 'wyvern', name: 'Wyvern', species: 'beast', portrait: 'drake', equips: 3, statMult: 1.15,
  skins: [{ name: 'Green', tint: '#2a4a2a' }, { name: 'Brown', tint: '#4a3a2a' }, { name: 'Grey', tint: '#4a4a4a' }],
  pool: ['venom_fang', 'cleave', 'sunder', 'defiant_stand', 'counter_attack'] });
en({ id: 'sewer_crawler', name: 'Sewer Crawler', species: 'beast', portrait: 'beetle', equips: 2,
  skins: [{ name: 'Wet', tint: '#2a3a3a' }, { name: 'Pale', tint: '#5a5a4a' }, { name: 'Oil', tint: '#1a1a1a' }],
  pool: ['venom_fang', 'snare', 'cleave', 'counter_attack', 'backstab'] });
en({ id: 'sewer_ogre', name: 'Sewer Ogre', species: 'beast', portrait: 'troll', equips: 3, statMult: 1.2,
  skins: [{ name: 'Green', tint: '#3a4a2a' }, { name: 'Grey', tint: '#4a4a4a' }, { name: 'Scab', tint: '#4a2a2a' }],
  pool: ['cleave', 'sunder', 'mace_swing', 'defiant_stand', 'taunt'] });
en({ id: 'phase_spider', name: 'Phase Spider', species: 'beast', portrait: 'spider', equips: 3, statMult: 1.1,
  skins: [{ name: 'Blue', tint: '#2a3a6a' }, { name: 'Violet', tint: '#4a2a6a' }, { name: 'Pale', tint: '#5a5a6a' }],
  pool: ['venom_fang', 'shadow_rise', 'smoke_bomb', 'backstab', 'snare'] });
en({ id: 'shadow_double', name: 'Shape-Thief', species: 'human', portrait: 'shadow', equips: 3,
  skins: [{ name: 'Wearing a Face', tint: '#2a2a3a' }, { name: 'Between Faces', tint: '#1a1a2a' }, { name: 'Half-Turned', tint: '#3a2a3a' }],
  pool: ['backstab', 'shadow_rise', 'smoke_bomb', 'cleave', 'frost_touch'] });

// ---------------------------------------------------------------- mini-bosses (§4)
const MB = D.CAMPAIGN_MINIBOSSES;
function mb(o) { o.campaign3 = true; o.faction = 'gate'; MB[o.id] = o; }
mb({ id: 'nib', name: 'Nib', base: 'hired_knife', signature: 'backstab', equips: 3 });
mb({ id: 'cobb', name: 'Cobb', base: 'hired_knife', signature: 'venom_fang', equips: 3 });
mb({ id: 'kobold_chief', name: 'Kobold Chief', base: 'kobold_shaman', signature: 'fire_bolt', equips: 4 });
mb({ id: 'gnoll_warleader', name: 'Snarl, Gnoll Warleader', base: 'gnoll_raider', signature: 'cleave', equips: 4 });
mb({ id: 'verlan', name: 'Verlan', base: 'consortium_mage', signature: 'frost_touch', equips: 4 });
mb({ id: 'skarn', name: 'Skarn Maul', base: 'hob_sergeant', signature: 'dual_swords', equips: 4 });
mb({ id: 'hroth', name: 'Hroth Ironbark', base: 'hob_sergeant', signature: 'shield_wall', equips: 4 });
mb({ id: 'silksa', name: 'Silksa, Spider Queen', base: 'web_spider', signature: 'venom_fang', equips: 4 });
mb({ id: 'kestrel', name: 'Kestrel', base: 'consortium_guard', signature: 'sunder', equips: 4 });
mb({ id: 'wyvern_matriarch', name: 'Wyvern Matriarch', base: 'wyvern', signature: 'venom_fang', equips: 4 });
mb({ id: 'sewer_ogre_mage', name: 'The Ogre Under the Docks', base: 'sewer_ogre', signature: 'cleave', equips: 4 });
mb({ id: 'lantern_master', name: 'The Master of Lanterns', base: 'shadow_double', signature: 'shadow_rise', equips: 5 });
mb({ id: 'tower_captain', name: 'Captain of the Tower', base: 'consortium_guard', signature: 'shield_wall', equips: 5 });
mb({ id: 'family_double', name: 'A Face You Know', base: 'shadow_double', signature: 'backstab', equips: 4, count: 2 });
mb({ id: 'hall_doubles', name: 'Ducal Guard', base: 'palace_doppelganger', signature: 'shadow_rise', equips: 4, count: 2 });
mb({ id: 'bought_sergeants', name: "Marr's Sergeants", base: 'gauntlet_traitor', signature: 'cleave', equips: 4, count: 2 });
mb({ id: 'altar_keepers', name: 'Keepers of the Altar', base: 'morrak_cultist', signature: 'raise', equips: 4, count: 2 });
mb({ id: 'your_own_faces', name: 'Your Own Faces', base: 'shadow_double', signature: 'backstab', equips: 5, count: 3 });
mb({ id: 'umbral_pair', name: 'The Umbral Hand', base: 'hired_knife', signature: 'venom_fang', equips: 4, count: 2 });

// ---------------------------------------------------------------- quests (§4)
// tier drives enemy levels / pay; `enc` are spawn specs read by C3.spawnEncounter.
// Spec fields beyond campaign2's: `variants` (flag -> spec, resolved at spawn),
// `escapes` (the named boss walks off at 0 HP instead of dying), `label`.
// Beats and choices are wired in campaign3_dialogue.js (CAMPAIGN3_SCRIPT).
D.CAMPAIGN3_QUESTS = [
  { n: 1, name: 'The Road from Lanternhold', tier: 1, chapter: 'Prologue', travel: 'road',
    brief: 'Aldric says the two of you leave before dawn. He does not say why. Two men in the keep have already tried to make sure you never find out.',
    enc: [
      { mini: 'nib', label: 'The storehouse' },
      { mini: 'cobb', with: ['hired_knife'], label: 'The priests\' quarters' },
      { types: ['hired_knife', 'hired_knife', 'consortium_mage'], label: 'The Griffon Road, after dark' },
    ] },
  { n: 2, name: 'The Open Hand', tier: 1, chapter: 'Chapter 1', travel: 'road',
    brief: "Aldric's letter names an inn and two friends. The road there has wolves, a squire hunting them, and a mage on the steps who knows your face.",
    enc: [
      { types: ['road_wolf', 'road_wolf'], label: 'The Shore Road' },
      { types: ['road_wolf', 'road_wolf', 'road_wolf'], label: 'The wolf den' },
      { boss: 'morwin', with: ['hired_knife'], label: 'The steps of the Open Hand' },
    ] },
  { n: 3, name: 'South to Dunmere', tier: 1, chapter: 'Chapter 2', travel: 'road',
    brief: 'The tainted iron comes from the Dunmere mines. Between here and there: Thornbury, an elf with a grudge, a knife in an inn, and a gnoll fortress with a witch in it.',
    enc: [
      { boss: 'lessa', with: ['hired_knife'], label: 'The Dunmere inn' },
      { types: ['gnoll_raider', 'gnoll_raider', 'bandit_archer'], label: 'The river crossing' },
      { variants: { aurelius: { boss: 'bramm', with: ['gnoll_raider', 'gnoll_raider'], escapes: true, label: 'Bramm blocks the road' } },
        mini: 'gnoll_warleader', with: ['gnoll_raider', 'gnoll_raider'], label: 'The gnoll fortress' },
    ] },
  { n: 4, name: 'The Dunmere Mines', tier: 2, chapter: 'Chapter 2', travel: 'crypt',
    brief: 'The miners will not go down. Whatever is fouling the ore is four levels below, and it has a priest.',
    enc: [
      { types: ['tunnel_kobold', 'tunnel_kobold', 'tunnel_kobold'], label: 'The first level' },
      { types: ['tunnel_kobold', 'kobold_shaman', 'tunnel_kobold'], label: 'The flooded level' },
      { mini: 'kobold_chief', with: ['tunnel_kobold', 'veylan_acolyte'], label: 'The third level' },
      { boss: 'grukhar', with: ['veylan_acolyte', 'tunnel_kobold', 'tunnel_kobold'], label: "Grukhar's chamber" },
    ] },
  { n: 5, name: 'The Bandit Camp', tier: 2, chapter: 'Chapter 3', travel: 'forest',
    brief: "Grukhar's letters name a courier in Thornbury and a lord of bandits in the Gnashing Wood. Torvald says go north. He does not say it will be pleasant.",
    enc: [
      { mini: 'verlan', with: ['hired_knife'], label: "Hollister's Inn" },
      { types: ['gauntlet_soldier', 'gauntlet_soldier', 'gauntlet_soldier'], label: 'Holloway Vale' },
      { mini: 'skarn', with: ['hob_sergeant', 'gate_bandit', 'bandit_archer'], label: 'The palisade' },
      { boss: 'gorruk', with: ['hob_sergeant', 'bandit_archer', 'gate_bandit'], escapes: true, label: "Gorruk's tent" },
    ] },
  { n: 6, name: 'Mirkhollow', tier: 2, chapter: 'Chapter 4', travel: 'forest',
    brief: 'The letters point into the Mirkhollow: spiders, druids who consider you trespass, wyverns, and a mine that is not on any map.',
    enc: [
      { mini: 'silksa', with: ['web_spider', 'web_spider'], label: 'The nest' },
      { boss: 'thornwise', with: ['umbra_druid', 'umbra_druid'], label: 'The druid grove' },
      { mini: 'wyvern_matriarch', with: ['wyvern'], label: 'The wyvern cliffs' },
      { mini: 'kestrel', with: ['consortium_guard', 'consortium_mage'], label: 'The mine gate' },
    ] },
  { n: 7, name: 'The Iron Mine', tier: 2, chapter: 'Chapter 4', travel: 'crypt',
    brief: "The Consortium's secret mine, worked by slaves under a mage named Malvane. There is a valve at the bottom that can drown all of it.",
    enc: [
      { types: ['consortium_guard', 'slave_driver', 'consortium_guard'], label: 'The upper works' },
      { types: ['slave_driver', 'slave_driver', 'consortium_mage'], label: 'The cages' },
      { types: ['consortium_guard', 'consortium_mage', 'veylan_acolyte'], label: 'The third level' },
      { boss: 'malvane', with: ['consortium_guard', 'consortium_guard', 'consortium_mage'], label: "Malvane's study" },
      { types: ['consortium_guard', 'consortium_guard', 'consortium_mage', 'slave_driver'], label: 'The valve room' },
    ] },
  { n: 8, name: "Varenholm's Gate", tier: 3, chapter: 'Chapter 5', travel: 'city',
    brief: "Serpent's Span, the checkpoint, and the city at last. A Burning Gauntlet officer wants something in the sewers dead and a trading house looked at.",
    enc: [
      { mini: 'sewer_ogre_mage', with: ['sewer_crawler', 'sewer_crawler'], label: 'The sewers' },
      { types: ['consortium_guard', 'hired_knife'], label: 'The Nine Lanterns door' },
      { types: ['shadow_double', 'shadow_double', 'hired_knife'], label: 'The counting room' },
      { mini: 'lantern_master', with: ['shadow_double', 'shadow_double'], label: 'The upper office' },
    ] },
  { n: 9, name: 'The Consortium Tower', tier: 3, chapter: 'Chapter 5', travel: 'city',
    brief: "Duke Halvard wants the Iron Consortium's papers. You go in as a mercenary looking for work and come out with the top floor's secrets.",
    enc: [
      { types: ['consortium_guard', 'consortium_guard'], label: 'The lobby' },
      { variants: { umbralBetrayed: { mini: 'umbral_pair', with: ['consortium_guard'], label: 'The counting floor — old friends' } },
        types: ['consortium_guard', 'consortium_mage', 'consortium_guard'], label: 'The counting floor' },
      { types: ['consortium_mage', 'consortium_guard', 'hired_knife'], label: "Lysandra's floor" },
      { mini: 'tower_captain', with: ['consortium_mage', 'consortium_mage', 'consortium_guard'], label: 'The top floor' },
    ] },
  { n: 10, name: 'Return to Lanternhold', tier: 3, chapter: 'Chapter 6', travel: 'crypt',
    brief: 'The Consortium leaders have gone to the library you grew up in. Halvard gives you a book to buy your way through the gate. Something is waiting inside that is not the Consortium.',
    enc: [
      { types: ['consortium_guard', 'consortium_guard', 'hired_knife'], label: 'The reading rooms' },
      { boss: 'maddox', with: ['vask', 'rennick', 'consortium_guard'], label: 'The summit', named: ['vask', 'rennick'] },
      { boss: 'grell', with: ['hired_knife', 'hired_knife'], label: 'The catacombs' },
      { mini: 'family_double', with: ['shadow_double'], label: 'The crypt of faces' },
      { types: ['phase_spider', 'tomb_ghoul', 'tomb_ghoul'], label: 'The way out' },
    ] },
  { n: 11, name: 'The Hunted City', tier: 3, chapter: 'Chapter 7', travel: 'alley',
    brief: 'Wanted posters carry your face. Halloran is dead, Lucan Marr commands the Gauntlet, and Duke Halvard is dying under the care of a physician who is not a physician.',
    enc: [
      { types: ['gauntlet_soldier', 'gauntlet_soldier', 'gauntlet_traitor'], label: 'The patrol' },
      { boss: 'idris', with: ['shadow_double', 'gauntlet_traitor'], label: "Halvard's sick-room" },
      { boss: 'amara', with: [], escapes: true, label: 'The docks' },
      { boss: 'ravel', with: ['kessa', 'hired_knife'], label: 'The Undervault', named: ['kessa'] },
    ] },
  { n: 12, name: 'The Coronation', tier: 3, chapter: 'Chapter 7', travel: 'city',
    brief: "Korvath will be sworn in as Grand Duke tonight and declare war on Calder by morning. You have an invitation, the evidence, and a company in borrowed clothes.",
    enc: [
      { mini: 'hall_doubles', with: ['palace_doppelganger'], label: 'The great hall' },
      { types: ['palace_doppelganger', 'palace_doppelganger', 'shadow_double'], label: 'The dais' },
      { types: ['consortium_mage', 'consortium_mage', 'hired_knife'], label: "Verlaine's rear-guard" },
    ] },
  { n: 13, name: 'The Undercity', tier: 3, chapter: 'Chapter 7', travel: 'ruins',
    brief: "Under the thieves' maze is an older city, and under that is a temple. Korvath's people are between you and it. So is the one who loves him.",
    enc: [
      { types: ['hired_knife', 'hired_knife', 'bandit_archer'], label: "The thieves' maze" },
      { boss: 'amara', with: [], escapes: true, label: 'The gate of the Undercity' },
      { boss: 'jarem', with: ['morrak_cultist', 'morrak_cultist'], label: 'The buried street' },
      { variants: { gorrukDead: { types: ['consortium_guard', 'consortium_mage', 'hired_knife'], label: 'Consortium remnants' } },
        boss: 'gorruk', with: ['hob_sergeant', 'hob_sergeant'], label: 'Gorruk, again' },
      { boss: 'lucan', with: ['gauntlet_traitor', 'gauntlet_traitor'], label: 'The temple steps' },
    ] },
  { n: 14, name: 'The Temple of Morrak', tier: 'boss', chapter: 'Chapter 7', travel: 'crypt',
    brief: 'The last room. Your brother is waiting at the altar of a dead god, and he is glad you came.',
    enc: [
      { mini: 'altar_keepers', with: ['morrak_cultist'], label: 'The outer sanctum' },
      { mini: 'your_own_faces', label: 'The hall of mirrors' },
      { boss: 'korvath', with: ['morrak_cultist', 'morrak_cultist', 'consortium_mage'], label: 'The altar' },
    ] },
];

// Map quest travel keys to TRAVEL_LOCATIONS ids that exist (travel.js falls back to road).
D.CAMPAIGN3_TRAVEL = { road: 'road', crypt: 'crypt', forest: 'forest', city: 'city', alley: 'alley', ruins: 'ruins' };

// The mirror table the shared coverage test walks (every id must be ours).
const enemyOnly = ids => (ids || []).filter(id => !D.CAMPAIGN_CHARS[id]);   // named actors ride in `with` too
D.CAMPAIGN_QUESTS.gate = D.CAMPAIGN3_QUESTS.map(q => ({ n: q.n, name: q.name, tier: q.tier === 'boss' ? 3 : q.tier, brief: q.brief,
  enc: q.enc.map(e => Object.assign({}, e, { with: enemyOnly((e.with || []).concat(...Object.values(e.variants || {}).map(v => (v.with || []).concat(v.types || [])))) })) }));

// Ending headlines (§5). Bodies are assembled in campaign3_dialogue.js (CAMPAIGN3_EPILOGUE).
D.CAMPAIGN3_ENDINGS = {
  hero:    { title: 'The Gate Stands',        line: 'You are its shadow no longer.' },
  monster: { title: 'A Thing the City Cheers', line: 'They should have burned you with him.' },
  usurper: { title: 'The Altar Has a Keeper', line: 'It was always going to be one of you.' },
  mercy:   { title: 'Chains, Not Blood',       line: 'Amara was right, and you let her be.' },
  ascetic: { title: 'An Empty Throne',         line: 'You left it, and it let you.' },
};
})();
