// The core skill pool (§3a) + universal moves + unique-tier registry skills.
// One entry, three manifestations by level. Enemies, NPCs and the player all
// draw from this identical pool. Handlers live in js/core/combat.js keyed by id.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

// target: enemy | enemyLane | enemyBack | allEnemies | ally | allyLane | party | self
// reach:  front (melee, front lane only) | any | back (enemy back lane only)
const S = {};

function def(o) { S[o.id] = o; }

// ============ MAGE ============
def({ id: 'arcane_focus', name: 'Arcane Focus', kind: 'perk', archetype: 'mage',
  desc: 'Elemental actives deal increased damage.',
  tiers: {
    basic:        { name: 'Arcane Focus',   eleDmgMult: 1.15 },
    intermediate: { name: 'Arcane Focus+',  eleDmgMult: 1.2, note: 'reduced cost' },
    advanced:     { name: 'Arcane Mastery', eleDmgMult: 1.25, splashAdjacent: true },
  } });
def({ id: 'fire_bolt', name: 'Fire Bolt', kind: 'active', archetype: 'mage',
  elemental: true, element: 'fire', power: 3.0, reach: 'any', target: 'enemy',
  desc: 'Single-target fire damage. Always leaves the target Burning; the burn grows with the skill.',
  tiers: {
    basic:        { name: 'Fire Bolt', status: { burn: { power: 0.8, rounds: 3 } } },
    intermediate: { name: 'Fire Blast', status: { burn: { power: 1.1, rounds: 3 } } },
    advanced:     { name: 'Fire Ball', target: 'enemyLane', power: 2.2, status: { burn: { power: 1.4, rounds: 3 } } },
  } });
def({ id: 'frost_touch', name: 'Frost Touch', kind: 'active', archetype: 'mage',
  elemental: true, element: 'ice', power: 2.4, reach: 'any', target: 'enemy', delayTarget: true,
  desc: 'Cold damage; the target acts later, and is Frozen — losing whole turns. A thawed target cannot be re-frozen for 3 rounds.',
  tiers: {
    basic:        { name: 'Frost Touch', freeze: 1 },
    intermediate: { name: 'Frost Chain', multiTarget: 2, freeze: 1 },
    advanced:     { name: 'Blizzard', target: 'enemyLane', freeze: 2 },
  } });

def({ id: 'spark', name: 'Spark', kind: 'active', archetype: 'mage',
  elemental: true, element: 'lightning', power: 2.7, reach: 'any', target: 'enemy',
  desc: 'Lightning damage. Leaves the target Shocked — taking increased damage from every source.',
  tiers: {
    basic:        { name: 'Spark',           shock: 0.05, shockRounds: 3 },
    intermediate: { name: 'Chain Lightning', shock: 0.15, shockRounds: 3, multiTarget: 2 },
    advanced:     { name: 'Thunderstorm',    shock: 0.25, shockRounds: 3, target: 'allEnemies', power: 1.9 },
  } });
def({ id: 'pyromaniac', name: 'Pyromaniac', kind: 'perk', archetype: 'mage',
  desc: 'Fire answers to you: resist fire damage, and heal for a share of the fire damage you deal.',
  tiers: {
    basic:        { name: 'Pyromaniac',   fireResist: 0.05, fireLeech: 0.05 },
    intermediate: { name: 'Pyromaniac+',  fireResist: 0.15, fireLeech: 0.15 },
    advanced:     { name: 'Fire Lord',    fireResist: 0.25, fireLeech: 0.25 },
  } });
def({ id: 'ice_queen', name: 'Ice Queen', kind: 'perk', archetype: 'mage',
  desc: 'Every strike of ice you land layers frost armor on you — stacking damage reduction from all sources, applied after the hit is calculated (including percent-of-HP blows).',
  tiers: {
    basic:        { name: 'Ice Queen',    iceArmorPerHit: 0.05 },
    intermediate: { name: 'Ice Queen+',   iceArmorPerHit: 0.15 },
    advanced:     { name: 'Winter Court', iceArmorPerHit: 0.25 },
  } });
def({ id: 'lightning_king', name: 'Lightning King', kind: 'perk', noTierGrowth: true, archetype: 'mage',
  desc: 'You move at storm speed: two turns every round, back to back.',
  turnsPerRound: 2, consecutive: true,
  tiers: {
    basic:        { name: 'Lightning King' },
    intermediate: { name: 'Lightning King' },
    advanced:     { name: 'Storm Sovereign' },
  } });

// ============ TANK — every skill has an offensive component ============
def({ id: 'bulwark', name: 'Bulwark', kind: 'perk', archetype: 'tank', survivalHp: 20,
  desc: 'Reduces all incoming damage 20% after the hit is calculated — including percent-of-HP blows — and reflects part of it back. Every battle you walk out of adds 20 max HP, permanently.',
  tiers: {
    basic:        { name: 'Bulwark',   dmgTakenMult: 0.8, reflectPct: 0.25 },
    intermediate: { name: 'Bulwark+',  dmgTakenMult: 0.8, reflectPct: 0.40, protectAdjacent: true },
    advanced:     { name: 'Rampart',   dmgTakenMult: 0.8, reflectPct: 0.60, protectAdjacent: true },
  } });
def({ id: 'shield_wall', name: 'Shield Wall', kind: 'active', archetype: 'tank',
  power: 0, target: 'self', reach: 'any',
  desc: 'Halves incoming damage for several rounds; all damage prevented is dealt to the attacker. Guards those behind or beside you, never ahead.',
  tiers: {
    basic:        { name: 'Shield Wall', guardScope: 'self',  guardRounds: 3 },
    intermediate: { name: 'Iron Wall',   guardScope: 'lane',  guardRounds: 4 },
    advanced:     { name: 'Aegis',       guardScope: 'party', guardRounds: 5 },
  } });
def({ id: 'taunt', name: 'Taunt', kind: 'active', archetype: 'tank',
  power: 0, target: 'enemy', reach: 'any', retaliationPower: 1.5,
  desc: 'Marks enemies: they must attack you and take retaliation each time they do.',
  tiers: {
    basic:        { name: 'Taunt',     marks: 1, markRounds: 3 },
    intermediate: { name: 'Provoke',   marks: 2, markRounds: 3 },
    advanced:     { name: 'Challenge', marks: 'lane', markRounds: 4 },
  } });
def({ id: 'stand_fast', name: 'Stand Fast', kind: 'active', archetype: 'tank',
  power: 0, target: 'self', reach: 'any', selfRevive: true,
  desc: 'When you fall, you stand back up. Once per battle at first; more charges and a fuller return as the skill grows.',
  tiers: {
    basic:        { name: 'Stand Fast',  reviveHp: 0.25, reviveUses: 1 },
    intermediate: { name: 'Rise Again',  reviveHp: 0.50, reviveUses: 2 },
    advanced:     { name: 'Undying',     reviveHp: 0.80, reviveUses: 3 },
  } });

// ============ ROGUE ============
def({ id: 'opportunist', name: 'Opportunist', kind: 'perk', archetype: 'rogue',
  desc: 'When a foe is below half health, every wound you deal — strikes, bleed, and poison — hits for an extra 10% of their max HP.',
  tiers: {
    basic:        { name: 'Opportunist',  executeThreshold: 0.50, bonusHpPct: 0.10 },
    intermediate: { name: 'Opportunist+', executeThreshold: 0.50, bonusHpPct: 0.10 },
    advanced:     { name: 'Predator',     executeThreshold: 0.50, bonusHpPct: 0.10, killRefundsAction: true, fleeBonus: 0.35 },
  } });
def({ id: 'arena_champion', name: 'Arena Champion', kind: 'perk', noTierGrowth: true, archetype: 'fighter', survivalHp: 20,
  desc: 'Every enemy you put down restores half your health, stacks +10% damage for the battle, and taunts every enemy onto you for 2 rounds. Every battle you walk out of adds 20 max HP, permanently.',
  tiers: {
    basic:        { name: 'Arena Champion', killHealPct: 0.5, stackPct: 0.10, tauntRounds: 2 },
    intermediate: { name: 'Arena Champion', killHealPct: 0.5, stackPct: 0.10, tauntRounds: 2 },
    advanced:     { name: 'Crowd Favourite', killHealPct: 0.5, stackPct: 0.10, tauntRounds: 2 },
  } });
def({ id: 'septic_sanguine', name: 'Septic Sanguine', kind: 'perk', archetype: 'rogue',
  desc: 'Your bleeds and poisons hit harder and feed you, and they leap to everyone within two rows of the first victim. Advanced doubles the ticks and triples the feast; Intermediate and Basic are half of the tier above.',
  tiers: {
    basic:        { name: 'Septic Sanguine', dotMult: 1.25, dotLeech: 0.5 },
    intermediate: { name: 'Septic Sanguine+', dotMult: 1.5, dotLeech: 1.0 },
    advanced:     { name: 'Blood Culture',   dotMult: 2.0, dotLeech: 2.0 },
  } });
def({ id: 'lookism', name: 'Lookism', kind: 'perk', noTierGrowth: true, archetype: null,
  desc: 'A face that opens doors: hired for 10g over your price, your hires take 10g under theirs, the opposite sex starts out Friendly, the ones you leave stay Friendly, and enemies would rather hit anyone but you.',
  tiers: {
    basic:        { name: 'Lookism', wageEdge: 10, oppositeSexFriendly: true, softJilt: true, targetedLast: true },
    intermediate: { name: 'Lookism', wageEdge: 10, oppositeSexFriendly: true, softJilt: true, targetedLast: true },
    advanced:     { name: 'Adored',  wageEdge: 10, oppositeSexFriendly: true, softJilt: true, targetedLast: true },
  } });
def({ id: 'backstab', name: 'Backstab', kind: 'active', archetype: 'rogue',
  power: 6.0, reach: 'any', target: 'enemy', melee: true, openerOrStealth: true,
  desc: 'A burst from nowhere — any lane, but ONLY as the opening action of an encounter or from stealth. Basic hits like a standard attack; Throat Cut and Assassinate hit twice as hard.',
  tiers: {
    basic:        { name: 'Backstab', power: 3.0 },
    intermediate: { name: 'Throat Cut', status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    advanced:     { name: 'Assassinate', executeBelow: 0.25 },
  } });
def({ id: 'smoke_bomb', name: 'Smoke Bomb', kind: 'active', archetype: 'rogue',
  power: 0, target: 'self', reach: 'any', freeAction: true,
  desc: 'A free action: evade, slip into stealth, and still take your turn — the way back to another Backstab. Basic once every three turns; Vanish every two; Shadowstep has no wait.',
  tiers: {
    basic:        { name: 'Smoke Bomb', evadeNext: 1, stealthOnUse: true, stealthRounds: 2, cooldown: 3 },
    intermediate: { name: 'Vanish', untargetableRounds: 2, stealthOnUse: true, stealthRounds: 2, cooldown: 2 },
    advanced:     { name: 'Shadowstep', untargetableRounds: 3, freeStrike: true, stealthOnUse: true, stealthRounds: 3 },
  } });
def({ id: 'shadow_rise', name: 'Shadow Rise', kind: 'active', archetype: 'rogue',
  power: 0, target: 'self', reach: 'any', selfRevive: true,
  desc: 'Death is a vanishing act. You come back thin, unseen, and hard to hit. Advanced can pull the same trick twice.',
  tiers: {
    basic:        { name: 'Shadow Rise', reviveHp: 0.05, reviveUses: 1, reviveStealthRounds: 2, reviveEvade: 2 },
    intermediate: { name: 'Fade Back',   reviveHp: 0.25, reviveUses: 1, reviveStealthRounds: 3, reviveEvade: 3 },
    advanced:     { name: 'Cheat Death', reviveHp: 0.50, reviveUses: 2, reviveStealthRounds: 3, reviveEvade: 3 },
  } });

// ============ RANGER ============
def({ id: 'marksman', name: 'Marksman', kind: 'perk', archetype: 'ranger',
  desc: 'Bonus damage from the back lane; back-lane attacks take no reflect damage from any source.',
  tiers: {
    basic:        { name: 'Marksman',   backLaneBonus: 1.3 },
    intermediate: { name: 'Marksman+',  backLaneBonus: 1.3, ignoreCover: true },
    advanced:     { name: 'Deadeye',    backLaneBonus: 1.3, ignoreCover: true, noReflect: true },
  } });
def({ id: 'aimed_shot', name: 'Aimed Shot', kind: 'active', archetype: 'ranger',
  power: 3.0, reach: 'any', target: 'enemy',
  desc: 'Single-target ranged damage, any lane.',
  tiers: {
    basic:        { name: 'Aimed Shot' },
    intermediate: { name: 'Piercing Shot', pierceBehind: true },
    advanced:     { name: 'Volley', target: 'allEnemies', power: 2.0 },
  } });
def({ id: 'snare', name: 'Snare', kind: 'active', archetype: 'ranger',
  power: 1.2, reach: 'any', target: 'enemy', delayTarget: true,
  desc: 'The target acts later in the order.',
  tiers: {
    basic:        { name: 'Snare' },
    intermediate: { name: 'Bind', loseAction: true, seal: ['basic'], sealRounds: 2 },
    advanced:     { name: 'Root Field', spreadLanes: true, loseAction: true, seal: ['basic', 'intermediate'], sealRounds: 2 },
  } });

// ============ FIGHTER ============
def({ id: 'momentum', name: 'Momentum', kind: 'perk', archetype: 'fighter',
  desc: 'Damage rises with each consecutive attacking turn, whoever you swing at. Skip or hold and the chain breaks.',
  tiers: {
    basic:        { name: 'Momentum',  stackMult: 0.15, maxStacks: 4 },
    intermediate: { name: 'Momentum+', stackMult: 0.15, maxStacks: 4, accuracy: true },
    advanced:     { name: 'Avalanche', stackMult: 0.15, maxStacks: 4, thirdHitTwice: true },
  } });
def({ id: 'cleave', name: 'Cleave', kind: 'active', archetype: 'fighter',
  power: 2.2, reach: 'front', target: 'enemy', hitScale: true,
  desc: 'Hits the target\'s row. Higher tiers add rows. Damage is multiplied by how many enemies you hit.',
  tiers: {
    basic:        { name: 'Cleave',     cleaveRows: 1 },
    intermediate: { name: 'Sweep',      cleaveRows: 2 },
    advanced:     { name: 'Whirlwind',  cleaveRows: 3 },
  } });
def({ id: 'sunder', name: 'Sunder', kind: 'active', archetype: 'fighter',
  power: 2.0, reach: 'front', target: 'enemy',
  desc: 'Reduces target armor for the battle. The answer to Armored enemies.',
  tiers: {
    basic:        { name: 'Sunder', defStrip: 12 },
    intermediate: { name: 'Rend', defStrip: 12, status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    advanced:     { name: 'Shatter', defStripAll: true },
  } });
def({ id: 'defiant_stand', name: 'Defiant Stand', kind: 'active', archetype: 'fighter',
  power: 0, target: 'self', reach: 'any', selfRevive: true,
  desc: 'You refuse the ground. You rise with 15% less health than a tank would, but double damage for two turns and an extra action.',
  tiers: {
    basic:        { name: 'Defiant Stand', reviveHp: 0.2125, reviveUses: 1, reviveAtkMult: 2, reviveBuffRounds: 2, grantSelfTurn: 1 },
    intermediate: { name: 'Deathwish',     reviveHp: 0.425,  reviveUses: 2, reviveAtkMult: 2, reviveBuffRounds: 2, grantSelfTurn: 1 },
    advanced:     { name: 'Blood Rise',    reviveHp: 0.68,   reviveUses: 3, reviveAtkMult: 2, reviveBuffRounds: 2, grantSelfTurn: 1 },
  } });

// ============ DRUID / SHAPESHIFTER ============
def({ id: 'wild_form', name: 'Wild Form', kind: 'perk', archetype: 'druid',
  desc: 'Passive damage and defense bonus.',
  tiers: {
    basic:        { name: 'Wild Form',  dmgMult: 1.15, dmgTakenMult: 0.9 },
    intermediate: { name: 'Wild Form+', dmgMult: 1.15, dmgTakenMult: 0.9, laneShift: true },
    advanced:     { name: 'Primal Ward', dmgMult: 1.15, dmgTakenMult: 0.9, surviveLethal: true },
  } });
def({ id: 'thorn_skin', name: 'Thorn Skin', kind: 'active', archetype: 'druid',
  power: 0, target: 'self', reach: 'any',
  desc: 'Reflects damage taken back at attackers.',
  tiers: {
    basic:        { name: 'Thorn Skin', thornPct: 0.5, thornScope: 'self', rounds: 3 },
    intermediate: { name: 'Bramble Hide', thornPct: 0.5, thornScope: 'lane', rounds: 3 },
    advanced:     { name: 'Barkflesh', thornPct: 0.5, thornScope: 'party', rounds: 3 },
  } });
def({ id: 'beast_shape', name: 'Beast Shape', kind: 'active', archetype: 'druid',
  power: 0, target: 'self', reach: 'any', freeBuff: true,
  desc: 'A free shapeshift. Applied at the start of battle and again whenever it falls off. Does not cost a turn. Can be stripped like any buff.',
  tiers: {
    basic:        { name: 'Beast Shape', atkMult: 1.5, rounds: 3 },
    intermediate: { name: 'Greater Beast', atkMult: 1.5, rounds: 3, lifeSteal: 0.3 },
    advanced:     { name: 'Primal Form', atkMult: 1.5, rounds: 3, lifeSteal: 0.3, splashAdjacent: true },
  } });
def({ id: 'grove_raise', name: 'Grove Rise', kind: 'active', archetype: 'druid',
  power: 0, target: 'ally', reach: 'any', heal: true, revive: true, oncePerBattle: true, buffRounds: 3,
  desc: 'Calls fallen allies back through the green. Restores 15% less health than a healer\'s Raise, but each risen body wears a two-hit ward.',
  tiers: {
    basic:        { name: 'Grove Rise',        reviveHp: 0.2125, reviveCount: 1, shieldHits: 2 },
    intermediate: { name: 'Grove Call',        reviveHp: 0.425,  reviveCount: 2, shieldHits: 2 },
    advanced:     { name: 'Wild Resurrection', reviveHp: 0.68,   reviveCount: 3, shieldHits: 2 },
  } });

// ============ HEALING — each with an offensive mode ============
def({ id: 'devoted', name: 'Devoted', kind: 'perk', archetype: 'healer',
  desc: 'Healing you perform is increased.',
  tiers: {
    basic:        { name: 'Devoted',   healMult: 1.3 },
    intermediate: { name: 'Devoted+',  healMult: 1.3, tempHpDouble: true, tempHpCap: 1.0 },
    advanced:     { name: 'Radiant',   healMult: 1.3, tempHpDouble: true, tempHpCap: 1.0, healSplashPct: 0.5 },
  } });
def({ id: 'mend', name: 'Mend', kind: 'active', archetype: 'healer',
  power: 2.5, target: 'ally', reach: 'any', heal: true,
  offensive: { name: 'Life Drain', power: 2.0, lifeSteal: 1.0, target: 'enemy' },
  desc: 'Heals one ally. Offensive: drains the target and heals you.',
  tiers: {
    basic:        { name: 'Mend' },
    intermediate: { name: 'Restore', power: 2.6, cures: ['bleed'], target: 'party' },
    advanced:     { name: 'Renewal', target: 'party', power: 3.0 },
  } });
def({ id: 'cleanse', name: 'Holy Smite', kind: 'active', archetype: 'healer',
  power: 2.2, reach: 'any', target: 'enemy', elemental: true, element: 'holy',
  desc: 'A holy strike that burns and withers. The target cannot receive healing for two turns.',
  tiers: {
    basic:        { name: 'Holy Smite',    status: { burn: { power: 0.8, rounds: 3 } }, withering: 2 },
    intermediate: { name: 'Holy Brand',    power: 2.6, status: { burn: { power: 1.1, rounds: 3 } }, withering: 2 },
    advanced:     { name: 'Holy Judgment', power: 3.0, status: { burn: { power: 1.4, rounds: 3 } }, withering: 2 },
  } });
def({ id: 'regenerate', name: 'Regenerate', kind: 'active', archetype: 'healer',
  power: 1.0, hotRounds: 3, cooldown: 3, target: 'ally', reach: 'any', heal: true,
  offensive: { name: 'Poison', power: 1.2, dotRounds: 3, target: 'enemy' },
  desc: 'Heal over time: double a heal, spread over five turns. Castable every three turns. Offensive: damage over time instead.',
  tiers: {
    basic:        { name: 'Regenerate' },
    intermediate: { name: 'Sustain', power: 1.2, hotRounds: 4, target: 'party' },
    advanced:     { name: 'Everbloom', power: 1.4, hotRounds: 4, target: 'party' },
  } });
def({ id: 'guardian_ward', name: 'Guardian Ward', kind: 'active', archetype: 'healer',
  power: 0, target: 'ally', reach: 'any', heal: true, wardAhead: true,
  offensive: { name: 'Retribution Ward', wardReflect: true, target: 'ally' },
  desc: 'Shields an ally from the next hit. Offensive mode adds damage reflect to the ward.',
  tiers: {
    basic:        { name: 'Guardian Ward', shieldHits: 1 },
    intermediate: { name: 'Sanctuary', shieldRounds: 1 },
    advanced:     { name: 'Divine Aegis', shieldRounds: 1, target: 'allyLane' },
  } });
def({ id: 'triage', name: 'Triage', kind: 'active', archetype: 'healer',
  power: 1.5, healMult: 1.5, target: 'ally', reach: 'any', heal: true, doubleBelow: 0.25,
  offensive: { name: 'Open Wounds', healReduction: 0.5, power: 1.0, target: 'enemy' },
  desc: 'Small heal, doubled under 25%. Offensive: the target receives reduced healing.',
  tiers: {
    basic:        { name: 'Triage' },
    intermediate: { name: 'Field Surgery', fullHealBelow: 0.25, target: 'party' },
    advanced:     { name: 'Mass Triage', fullHealBelow: 0.35, target: 'party', power: 1.8 },
  } });
def({ id: 'raise', name: 'Raise', kind: 'active', archetype: 'healer',
  power: 0, target: 'ally', reach: 'any', heal: true, revive: true, oncePerBattle: true,
  desc: 'Lifts fallen allies. One body at a quarter of their health; more souls, and a fuller return, as the working deepens.',
  tiers: {
    basic:        { name: 'Raise',         reviveHp: 0.25, reviveCount: 1 },
    intermediate: { name: 'Mass Raise',    reviveHp: 0.50, reviveCount: 2 },
    advanced:     { name: 'Resurrection',  reviveHp: 0.80, reviveCount: 3 },
  } });
def({ id: 'blood_pact', name: 'Blood Pact', kind: 'active', archetype: 'healer',
  power: 2.5, target: 'enemy', reach: 'any', dualHeal: true,
  desc: 'Damages an enemy and heals an ally for the same amount. Already dual by design.',
  tiers: {
    basic:        { name: 'Blood Pact', healTargets: 1 },
    intermediate: { name: 'Blood Tithe', healTargets: 2 },
    advanced:     { name: 'Crimson Covenant', target: 'enemyLane', healTargets: 'party' },
  } });

// ============ FORBIDDEN ============
def({ id: 'conscript', name: 'Conscript', kind: 'active', archetype: null, forbidden: true,
  power: 0, target: 'postVictory', reach: 'any',
  warning: 'This skill will cost you. Not today.',
  desc: 'Take every defeated named opponent into your service.',
  tiers: {
    basic:        { name: 'Conscript',   duration: 3, cap: 2 },
    intermediate: { name: 'Conscript+',  duration: 4, cap: 3 },
    advanced:     { name: 'Impressment', duration: 5, cap: 4 },
  } });
def({ id: 'necromancy', name: 'Necromancy', kind: 'active', archetype: null, forbidden: true,
  power: 0, target: 'postVictory', reach: 'any',
  warning: 'This skill will cost you. Not today.',
  desc: 'Raise every fallen foe to fight the rest of this contract. They crumble when the quest ends — they do not walk to the next one.',
  tiers: {
    basic:        { name: 'Necromancy',    cap: 1, risenPower: 1.5 },
    intermediate: { name: 'Necromancy+',   cap: 2, risenPower: 2.0 },
    advanced:     { name: 'Dread Calling', cap: 3, risenPower: 2.6 },
  } });

// ============ SOCIAL & STEALTH PERKS (§3a) ============
def({ id: 'persuade', name: 'Persuade', kind: 'perk', archetype: null, social: 'talk',
  desc: 'Resolve encounters by talking.',
  tiers: {
    basic:        { name: 'Persuade',      vs: 'lowerRank' },
    intermediate: { name: 'Persuade+',     vs: 'equalRank' },
    advanced:     { name: 'Silver Tongue', vs: 'any', partyApplicationBonus: true },
  } });
def({ id: 'charm', name: 'Charm', kind: 'perk', archetype: null, social: 'charm',
  desc: 'Resolve encounters by charm. In battle, bribe a named hater to walk — or, at Beguile, to fight for you this encounter.',
  tiers: {
    basic:        { name: 'Charm',      vs: 'oppositeSex', bribeChance: 0.4 },
    intermediate: { name: 'Charm+',     vs: 'any',         bribeChance: 0.6 },
    advanced:     { name: 'Beguile',    vs: 'any', recruitForEncounter: true, bribeChance: 0.8 },
  } });
def({ id: 'intimidate', name: 'Intimidate', kind: 'perk', archetype: null, social: 'intimidate',
  desc: 'Resolve encounters by fear.',
  tiers: {
    basic:        { name: 'Intimidate',  vs: 'lowerLevel' },
    intermediate: { name: 'Intimidate+', vs: 'equalLevel' },
    advanced:     { name: 'Dread Presence', vs: 'equalLevel', fleersDropLoot: true },
  } });
def({ id: 'sneak', name: 'Sneak', kind: 'perk', archetype: null, social: 'sneak', fleeBonus: 0.35,
  desc: 'Bypass encounters alone; ambush with a party. A successful Sneak always steals.',
  tiers: {
    basic:        { name: 'Sneak',   vs: 'lowerLevel' },
    intermediate: { name: 'Sneak+',  vs: 'equalLevel' },
    advanced:     { name: 'Ghost',   vs: 'any', stealAll: true },
  } });

// ============ UNIVERSAL (no slot, never learned, never witnessed) ============
def({ id: 'basic_attack', name: 'Attack', kind: 'active', universal: true,
  power: 2.0, reach: 'front', target: 'enemy', noTierGrowth: true,
  desc: 'Every character can always attack.' ,
  tiers: { basic: { name: 'Attack' }, intermediate: { name: 'Attack' }, advanced: { name: 'Attack' } } });

// ============ UNIQUE TIER — divine grants & Hiro (§3a, §14a) ============
def({ id: 'true_rest', name: 'True Rest', kind: 'active', unique: true, noSlot: true, noTierGrowth: true,
  power: 0, reach: 'any', target: 'enemy', oneShotUndead: true,
  desc: 'One-shot kills any undead.',
  tiers: { basic: { name: 'True Rest' }, intermediate: { name: 'True Rest' }, advanced: { name: 'True Rest' } } });
def({ id: 'gods_edict', name: "God's Edict", kind: 'active', unique: true, noSlot: true, noTierGrowth: true,
  power: 0, reach: 'any', target: 'enemy', instantKillIfMaxHp: 800,
  desc: 'Ends anyone whose health pool is over 800. The god names them first.',
  tiers: { basic: { name: "God's Edict" }, intermediate: { name: "God's Edict" }, advanced: { name: "God's Edict" } } });
def({ id: 'hero', name: 'Hero', kind: 'perk', unique: true, noSlot: true, noTierGrowth: true,
  desc: 'Vastly increased base stats.',
  tiers: { basic: { name: 'Hero' }, intermediate: { name: 'Hero' }, advanced: { name: 'Hero' } } });

def({ id: 'demigod', name: 'Demigod', kind: 'perk', unique: true, noSlot: true, noTierGrowth: true,
  desc: 'Healing received ×10. Overheal converts to temporary HP with no cap. Immune to all negative statuses.',
  healReceivedMult: 10, overhealUncapped: true, statusImmune: true,
  tiers: { basic: { name: 'Demigod' }, intermediate: { name: 'Demigod' }, advanced: { name: 'Demigod' } } });
def({ id: 'master_swordsman', name: 'Master Swordsman', kind: 'perk', unique: true, noTierGrowth: true,
  desc: 'Katana skills do not consume active skill slots.', katanaFreeSlots: true,
  tiers: { basic: { name: 'Master Swordsman' }, intermediate: { name: 'Master Swordsman' }, advanced: { name: 'Master Swordsman' } } });
def({ id: 'lone_wolf', name: 'Lone Wolf', kind: 'perk', unique: true, noTierGrowth: true,
  desc: 'Takes 3 turns per round instead of 1. Never applies to party members.',
  turnsPerRound: 3, turnPlacement: 'distributed',
  tiers: { basic: { name: 'Lone Wolf' }, intermediate: { name: 'Lone Wolf' }, advanced: { name: 'Lone Wolf' } } });
def({ id: 'rich', name: 'Rich', kind: 'perk', unique: true, noTierGrowth: true,
  desc: 'All gold earned ×10.', goldMult: 10,
  tiers: { basic: { name: 'Rich' }, intermediate: { name: 'Rich' }, advanced: { name: 'Rich' } } });

def({ id: 'katana_slash', name: 'Katana Slash', kind: 'active', unique: true, katana: true, noTierGrowth: true,
  power: 2.6, reach: 'front', target: 'enemy',
  desc: 'Basic katana attack. Inflicts stacking Bleed.',
  tiers: {
    basic:        { name: 'Katana Slash', status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    intermediate: { name: 'Katana Slash', status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
    advanced:     { name: 'Katana Slash', status: { bleed: { power: 0.6, rounds: 3, stacks: true } } },
  } });
def({ id: 'god_aura', name: 'God Aura', kind: 'active', unique: true, noTierGrowth: true,
  power: 0, reach: 'any', target: 'party',
  desc: 'Team-wide buff: attack, evasion and defense.',
  tiers: {
    basic:        { name: 'God Aura', auraAtk: 1.3, auraDef: 1.3, auraEvade: 0.15, rounds: 3 },
    intermediate: { name: 'God Aura', auraAtk: 1.3, auraDef: 1.3, auraEvade: 0.15, rounds: 3 },
    advanced:     { name: 'God Aura', auraAtk: 1.3, auraDef: 1.3, auraEvade: 0.15, rounds: 3 },
  } });
def({ id: 'counter_attack', name: 'Counter Attack', kind: 'active', unique: true, katana: true, noTierGrowth: true,
  power: 0, reach: 'any', target: 'self',
  desc: 'Negates the next attack against you and reflects its damage.',
  tiers: {
    basic:        { name: 'Counter Attack', counterNext: 1 },
    intermediate: { name: 'Counter Attack', counterNext: 1 },
    advanced:     { name: 'Counter Attack', counterNext: 1 },
  } });
def({ id: 'finisher', name: 'Finisher', kind: 'active', unique: true, katana: true, noTierGrowth: true,
  power: 0, reach: 'front', target: 'enemy',
  desc: 'Executes targets below 40%, heals Hiro, and permanently raises all his stats by 1. Lost on death.',
  tiers: {
    basic:        { name: 'Finisher', executeBelow: 0.40, healOnKillPct: 0.3, permStatGain: 1 },
    intermediate: { name: 'Finisher', executeBelow: 0.40, healOnKillPct: 0.3, permStatGain: 1 },
    advanced:     { name: 'Finisher', executeBelow: 0.40, healOnKillPct: 0.3, permStatGain: 1 },
  } });

ADV.DATA.SKILLS = S;

// Skill sets by archetype for seeding / trainer grouping
// ---- Debuff kit (request 14): the four things the new contracts throw at you
def({ id: 'venom_fang', name: 'Venom Fang', kind: 'active', archetype: 'rogue',
  power: 1.6, reach: 'front', target: 'enemy', melee: true, fullHpBackstabPct: 0.8,
  desc: 'A shallow, dirty cut: Poison and Bleed in one stab, both stacking. Against a target at full health it hits like most of a Backstab.',
  tiers: {
    basic:        { name: 'Venom Fang',  status: { poison: { power: 0.6, rounds: 3, stacks: true }, bleed: { power: 0.6, rounds: 3, stacks: true } } },
    intermediate: { name: 'Black Fang',  status: { poison: { power: 0.8, rounds: 3, stacks: true }, bleed: { power: 0.8, rounds: 3, stacks: true } } },
    advanced:     { name: 'Plague Fang', status: { poison: { power: 1.0, rounds: 4, stacks: true }, bleed: { power: 1.0, rounds: 4, stacks: true } }, adjacent: 1 },
  } });
def({ id: 'ember_lash', name: 'Ember Lash', kind: 'active', archetype: 'mage',
  elemental: true, element: 'fire', power: 1.8, reach: 'any', target: 'enemy',
  desc: 'A whip of coals: less bite than Fire Bolt, but the Burn is the point.',
  tiers: {
    basic:        { name: 'Ember Lash', status: { burn: { power: 1.0, rounds: 3 } } },
    intermediate: { name: 'Cinder Lash', status: { burn: { power: 1.3, rounds: 3 } }, adjacent: 1 },
    advanced:     { name: 'Pyre Lash', status: { burn: { power: 1.6, rounds: 4 } }, target: 'enemyLane', power: 1.4 },
  } });
def({ id: 'rime_grasp', name: 'Rime Grasp', kind: 'active', archetype: 'mage',
  elemental: true, element: 'ice', power: 1.5, reach: 'any', target: 'enemy',
  desc: 'Cold that closes like a hand: the target is Frozen and loses a turn.',
  tiers: {
    basic:        { name: 'Rime Grasp', freeze: 1 },
    intermediate: { name: 'Hoarfrost Grasp', freeze: 1, delayTarget: true },
    advanced:     { name: 'Glacial Grasp', freeze: 2, multiTarget: 2 },
  } });
def({ id: 'wither_touch', name: 'Wither Touch', kind: 'active', archetype: 'druid',
  power: 1.4, reach: 'front', target: 'enemy',
  desc: 'Rot in the wound: the target cannot be healed for a while (heal cancel).',
  tiers: {
    basic:        { name: 'Wither Touch', healcutRounds: 2 },
    intermediate: { name: 'Blight Touch', healcutRounds: 3, status: { poison: { power: 0.5, rounds: 2 } } },
    advanced:     { name: 'Grave Touch', healcutRounds: 4, status: { poison: { power: 0.8, rounds: 3, stacks: true } }, adjacent: 1 },
  } });

ADV.DATA.ARCHETYPE_SKILLS = {
  mage:    { perk: 'arcane_focus', actives: ['fire_bolt', 'frost_touch', 'spark'] },
  tank:    { perk: 'bulwark',      actives: ['shield_wall', 'taunt', 'stand_fast'] },
  rogue:   { perk: 'opportunist',  actives: ['backstab', 'smoke_bomb', 'shadow_rise'] },
  ranger:  { perk: 'marksman',     actives: ['aimed_shot', 'snare'] },
  fighter: { perk: 'momentum',     actives: ['cleave', 'sunder', 'defiant_stand'] },
  druid:   { perk: 'wild_form',    actives: ['thorn_skin', 'beast_shape', 'grove_raise'] },
  healer:  { perk: 'devoted',      actives: ['mend', 'cleanse', 'regenerate', 'guardian_ward', 'triage', 'blood_pact', 'raise'] },
};

// Gear sets (§10) — floor matching-archetype skills at level 10.
// 800g sets also advance those skills one manifestation tier.
ADV.DATA.GEAR_SETS = {
  warrior: { name: 'Warrior Set', archetypes: ['tank', 'fighter'], cost: 800, advanceTier: true },
  ranger:  { name: 'Ranger Set',  archetypes: ['ranger', 'rogue'], cost: 800, advanceTier: true },
  mage:    { name: 'Mage Set',    archetypes: ['mage', 'druid'],   cost: 800, advanceTier: true },
  healer:  { name: 'Healer Set',  archetypes: ['healer'],          cost: 800, advanceTier: true },
  // Single-class: cheaper, one silhouette. Cross-class: you pay for breadth.
  plate:      { name: 'Plate Harness',   archetypes: ['tank'],            cost: 400 },
  duelist:    { name: "Duelist's Kit",   archetypes: ['fighter'],         cost: 400 },
  leathers:   { name: 'Night Leathers',  archetypes: ['rogue'],           cost: 400 },
  adept:      { name: 'Adept Robes',     archetypes: ['mage'],            cost: 400 },
  wildhide:   { name: 'Wildhide',        archetypes: ['druid'],           cost: 400 },
  hunter:     { name: "Hunter's Rig",    archetypes: ['ranger'],          cost: 400 },
  street:     { name: 'Street Steel',    archetypes: ['fighter', 'rogue'], cost: 600 },
  oath:       { name: 'Oath Plate',      archetypes: ['tank', 'healer'],   cost: 600 },
  chantry:    { name: 'Chantry Robes',   archetypes: ['mage', 'healer'],   cost: 600 },
  greenward:  { name: 'Greenward Kit',   archetypes: ['ranger', 'druid'],  cost: 600 },
  shadowweave:{ name: 'Shadowweave',     archetypes: ['rogue', 'mage'],    cost: 600 },
};

// Trainer-listed pool: the 31 (perks + actives), excludes universal/unique.
ADV.DATA.TRAINER_POOL = Object.keys(S).filter(id => {
  const sk = S[id];
  return !sk.universal && !sk.unique;
});
})();
