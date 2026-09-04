// Quest board, encounter verbs, payouts, faction shifts (§8, §15a, §16).
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const Sys = () => ADV.SkillSys;

const Quests = {};
let QID = 1;
Quests.resetIds = function (n) { QID = n || 1; };

Quests.generateBoard = function (world, rng) {
  const board = [];
  const factions = ['law', 'criminal', 'neutral'];
  for (const tier of [1, 2, 3]) {
    for (const track of ['solo', 'party']) {
      const n = tier === 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        board.push(Quests.make(rng, tier, track, rng.pick(factions)));
      }
    }
  }
  board.push(Quests.make(rng, 'boss', 'party', rng.pick(factions)));
  // the debuff contracts (request 14): poison, fire, frozen, heal-cancel crews
  for (const hz of ['hazard2', 'hazard2', 'hazard3', 'hazard3']) board.push(Quests.makeHazard(rng, hz, rng.pick(factions)));
  // the faction war (add-on §6): two rotating contracts against the four
  // ninja/pirate factions — the only place most players ever see them
  for (const q of Quests.makeWarBoard(world, rng)) board.push(q);
  // the god line (add-on §7): one route offered at a time, from rank 25
  const god = Quests.makeGodQuest(world, rng);
  if (god) board.push(god);
  return board;
};

// ---- The faction war (add-on §6) -------------------------------------------
// Ordinary contracts in every respect; the enemies are faction members with
// their full pools, so these are the witnessing ground for all 64 skills.
// A member never sees a contract against their own faction.
Quests.makeWarBoard = function (world, rng) {
  const W = ADV.DATA.FACTION_WAR;
  if (!W) return [];
  const player = ADV.World.byId(world, world.playerId);
  const joined = (player && player.factionTitles || []).map(t => t.factionId);
  const open = Object.keys(W).filter(fid => !joined.includes(fid));
  if (!open.length) return [];
  const pick = rng.shuffle(open).slice(0, 2);
  return pick.map(fid => Quests.makeWarQuest(rng, fid, rng.chance(0.5) ? 1 : 2));
};
Quests.makeWarQuest = function (rng, fid, tier) {
  const w = ADV.DATA.FACTION_WAR[fid];
  const T = C().QUEST_TIERS[tier];
  const track = rng.chance(0.4) ? 'solo' : 'party';
  const encN = track === 'solo' ? rng.int(2, 3) : rng.int(3, 4);
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const n = track === 'solo' ? (i === encN - 1 && tier > 1 ? 2 : 1) : rng.int(2, 3);
    const ids = [];
    for (let k = 0; k < n; k++) ids.push(rng.pick(w.types));
    encounters.push({ enemyTypeIds: ids, boss: false, campaign: true });
  }
  return {
    id: 'war' + (QID++), tier, track, factionAlignment: w.shift,
    warAgainst: fid, campaign: true, campaign2: true, war: true,
    name: w.quest, brief: w.brief,
    payout: track === 'solo' ? T.soloPay : T.partyPay,
    enemyLevels: T.enemyLevels,
    encounters, cEnc: encounters.map(e => ({ types: e.enemyTypeIds })), isBoss: false,
  };
};

// ---- The god line (add-on §7) ----------------------------------------------
// Party-only, rank 25+, 1000g halving per clear. Two bosses, two routes each:
// one is a healing-denial check, the other a reflect-immunity check.
Quests.godPayout = function (game) {
  const G = ADV.DATA.GOD_LINE;
  const runs = (game.campaign2 && game.campaign2.godRuns) || 0;
  return Math.max(G.minPay, Math.round(G.basePay / Math.pow(2, runs)));
};
Quests.makeGodQuest = function (world, rng) {
  const G = ADV.DATA.GOD_LINE;
  if (!G) return null;
  const player = ADV.World.byId(world, world.playerId);
  if (!player || player.questsCompleted < G.gateQuests) return null;
  const route = rng.pick(G.routes);
  const T = C().QUEST_TIERS.boss;
  const encounters = route.enc.map(e => ({ enemyTypeIds: e.types.slice(), boss: false, campaign: true }));
  encounters.push({ enemyTypeIds: [], boss: true, campaign: true });
  return {
    id: 'god_' + route.id, tier: 'boss', track: 'party', factionAlignment: 'neutral',
    campaign: true, campaign2: true, godLine: true, routeId: route.id, godBoss: route.boss,
    name: route.name, brief: route.brief, isBoss: true,
    payout: G.basePay, enemyLevels: T.enemyLevels,
    encounters, cEnc: route.enc.concat([{ boss: route.boss }]),
  };
};

const HAZARD_NAMES = {
  marsh_stalker: ['Drain the {e} marsh', 'Bounty: the {e} nest'],
  ember_cultist: ['Put out the {e} fires', 'The {e} pyre'],
  frost_hag: ['Break the {e} coven', 'Thaw the {e} pass'],
  gravewarden: ['Unseal the {e} crypt', 'The {e} vigil'],
};
// A party contract built around one debuff crew (with a second type mixed in)
Quests.makeHazard = function (rng, hz, faction) {
  const T = C().QUEST_TIERS[hz];
  const lead = rng.pick(ADV.DATA.TIER_ENEMY_TABLE.debuff);
  const other = rng.pick(ADV.DATA.TIER_ENEMY_TABLE.debuff.filter(t => t !== lead));
  const filler = rng.pick(ADV.DATA.TIER_ENEMY_TABLE[T.tier]);
  const encN = rng.int(3, 4);
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const n = rng.int(3, 4);
    const ids = [lead];
    for (let k = 1; k < n; k++) ids.push(rng.chance(0.5) ? lead : rng.chance(0.5) ? other : filler);
    encounters.push({ enemyTypeIds: rng.shuffle(ids), boss: false });
  }
  const e = ADV.DATA.ENEMIES[lead];
  return {
    id: 'q' + (QID++), tier: T.tier, track: 'party', factionAlignment: faction, hazard: lead,
    name: rng.pick(HAZARD_NAMES[lead]).replace('{e}', e.name),
    payout: T.partyPay, enemyLevels: T.enemyLevels, encounters, isBoss: false,
  };
};

const QUEST_NAMES = {
  law: ['Bounty: {e} raids', 'Escort the magistrate', 'Clear the {e} road', 'Warrant: {e} den'],
  criminal: ['Job: {e} problem', 'Quiet delivery past the {e}', 'Take the {e} stash', 'Settle the {e} matter'],
  neutral: ['Cull the {e}', 'Caravan guard: {e} country', 'Lost cargo in {e} territory', 'Survey the {e} ruin'],
};

Quests.make = function (rng, tier, track, faction) {
  const T = C().QUEST_TIERS[tier];
  const isBoss = tier === 'boss';
  const encN = isBoss ? 3 : (track === 'solo' ? rng.int(C().SOLO_ENCOUNTERS[0], C().SOLO_ENCOUNTERS[1])
                                              : rng.int(C().PARTY_ENCOUNTERS[0], C().PARTY_ENCOUNTERS[1]));
  const table = isBoss ? ADV.DATA.TIER_ENEMY_TABLE[3] : (ADV.DATA.TIER_ENEMY_TABLE[tier] || ADV.DATA.TIER_ENEMY_TABLE[1]);
  const flavor = ADV.DATA.FACTION_ENEMIES[faction] || [];
  const encounters = [];
  for (let i = 0; i < encN; i++) {
    const last = i === encN - 1;
    if (isBoss && last) {
      const bossId = rng.pick(ADV.DATA.TIER_ENEMY_TABLE.boss);
      // the boss brings one top-tier mook (the boss table itself holds only bosses)
      const escortPool = ADV.DATA.TIER_ENEMY_TABLE[3].filter(t => ADV.DATA.ENEMIES[t]);
      encounters.push({ enemyTypeIds: [bossId, rng.pick(escortPool)], boss: true });
      continue;
    }
    // Solo: single enemies at tier 1; pairs only in tier 2+ finales (§15a curve)
    const nEnemies = track === 'solo'
      ? ((last && tier !== 1) ? rng.int(C().SOLO_ENEMIES[0], C().SOLO_ENEMIES[1]) : 1)
      : rng.int(C().PARTY_ENEMIES[0], C().PARTY_ENEMIES[1]);
    // Half the time a faction-flavored contract draws only its faction's
    // enemies; otherwise (or when the flavored pool is empty) the full tier
    // table. (Replaces a precedence bug that could filter the pool to empty
    // and spawn an undefined enemy type.)
    let pool = table;
    if (flavor.length && rng.chance(0.5)) {
      const flavored = table.filter(t => flavor.includes(t));
      if (flavored.length) pool = flavored;
    }
    const ids = [];
    for (let k = 0; k < nEnemies; k++) ids.push(rng.pick(pool));
    encounters.push({ enemyTypeIds: ids, boss: false });
  }
  const mainEnemy = ADV.DATA.ENEMIES[encounters[0].enemyTypeIds[0]] || ADV.DATA.BOSSES[encounters[0].enemyTypeIds[0]];
  const name = rng.pick(QUEST_NAMES[faction]).replace('{e}', mainEnemy ? mainEnemy.name : 'beast');
  return {
    id: 'q' + (QID++), tier, track, factionAlignment: faction,
    name: isBoss ? 'BOSS: ' + name : name,
    payout: isBoss ? C().QUEST_TIERS.boss.partyPay : (track === 'solo' ? T.soloPay : T.partyPay),
    enemyLevels: (isBoss ? C().QUEST_TIERS.boss : T).enemyLevels,
    encounters, isBoss,
  };
};

// Guided first party job: two single bandits so the NPC lead does not die
// on a 3–5 enemy board contract before the player has learned the ropes.
Quests.makeTutorialParty = function () {
  const T = C().QUEST_TIERS[1];
  return {
    id: 'q_tut_party',
    tier: 1, track: 'party', factionAlignment: 'neutral',
    name: 'A short road job',
    payout: T.partyPay,
    enemyLevels: [1, 2],
    encounters: [
      { enemyTypeIds: ['bandit'], boss: false },
      { enemyTypeIds: ['bandit'], boss: false },
    ],
    isBoss: false, tutorialEasy: true,
  };
};

// Spawn enemy characters for one encounter.
Quests.spawnEncounter = function (rng, quest, encIdx) {
  const enc = quest.encounters[encIdx];
  // Difficulty curve inside the quest: early encounters sit near the tier's
  // low bound, the finale reaches its high bound (keeps first fights fair
  // while the tier's top level still appears — §15a levels are the dial).
  const n = quest.encounters.length;
  const t01 = n > 1 ? encIdx / (n - 1) : 0.5;
  const [lo, hi] = quest.enemyLevels;
  let mid = lo + (hi - lo) * t01;
  // A solo finale that fields two enemies fields two LESSER enemies —
  // total threat stays near one top-of-tier opponent (§15a balance targets).
  if (quest.track === 'solo' && enc.enemyTypeIds.length > 1) {
    mid = lo + (hi - lo) * t01 * 0.5;
  }
  return enc.enemyTypeIds.map(tid => {
    const t = ADV.DATA.ENEMIES[tid] || ADV.DATA.BOSSES[tid];
    const lvl = Math.round(Math.max(t.levels[0], Math.min(t.levels[1],
      Math.max(lo, Math.min(hi, mid + rng.int(-1, 1))))));
    const e = ADV.Character.makeEnemy(rng, tid, { level: lvl });
    if (e.armored) e.armorBonus = C().ARMORED_BONUS_DEF;
    return e;
  });
};

// ---- Encounter verbs (§8) ---------------------------------------------------
// If the player owns a bypass perk, that route is offered at EVERY encounter.
// What varies is cost/odds, never availability.
Quests.availableVerbs = function (world, player, party, quest, enemies) {
  const verbs = [{ verb: 'fight', ok: true }];
  const lead = enemies[0];
  const enemyRank = Math.ceil((lead.enemyLevel || 1) / 8);
  const enemyLevel = lead.enemyLevel || 1;
  const playerRank = player.rank;
  const playerLevel = avgSkillLevel(player);
  for (const perkId of ['persuade', 'charm', 'intimidate', 'sneak', 'quiet_word']) {
    const entry = player.perks.find(p => p.skillId === perkId);
    if (!entry) continue;
    const m = Sys().manifest(player, entry);
    const vs = m.data.vs;
    let odds = 0.85;
    let note = '';
    if (perkId === 'quiet_word') {                       // Threaten (§13 Maw): works on the isolated
      odds = enemies.length === 1 ? 0.85 : 0.3;
      if (enemies.length > 1) note = 'too many ears';
    }
    if (perkId === 'persuade') {
      odds = vs === 'any' ? 0.9 : vs === 'equalRank' ? (enemyRank <= playerRank ? 0.85 : 0.35) : (enemyRank < playerRank ? 0.85 : 0.3);
    } else if (perkId === 'charm') {
      const anySex = vs !== 'oppositeSex';
      const applies = anySex || lead.sex !== player.sex;
      odds = applies ? 0.8 : 0.25;
      if (!applies) note = 'they seem unmoved';
    } else if (perkId === 'intimidate' || perkId === 'sneak') {
      odds = vs === 'any' ? 0.9 : vs === 'equalLevel' ? (enemyLevel <= playerLevel + 3 ? 0.8 : 0.35)
        : (enemyLevel < playerLevel ? 0.8 : 0.3);
    }
    // monsters can't be talked to — social verbs need a human opponent; sneak works on anything
    if (['persuade', 'charm', 'intimidate', 'quiet_word'].includes(perkId) && lead.species !== 'human') {
      note = 'beasts do not bargain'; odds = 0;
    }
    const soloSneak = perkId === 'sneak' && party.length === 0;
    verbs.push({
      verb: perkId, ok: odds > 0, odds, note, label: perkId === 'quiet_word' ? 'Threaten' : undefined,
      mode: perkId === 'sneak' ? (soloSneak ? 'bypass' : 'ambush') : 'bypass',
      tier: m.tier,
    });
  }
  // ---- Second campaign's four encounter verbs (add-on §3) ------------------
  // Each is a perk with its own stated resolution condition, so they are not
  // reskins of Persuade: Bribe reads wealth, Command and Requisition read the
  // opponent's alignment, Black Flag reads what they are carrying.
  const carriedGold = (lead.inventory && lead.inventory.gold) || 0;
  const enemyAlign = lead.factionAlignment
    || (lead.factionStanding && lead.factionStanding.law >= 30 ? 'law'
      : lead.factionStanding && lead.factionStanding.criminal >= 30 ? 'criminal' : null);
  const hasCargo = !!(quest && (quest.cargo || /cargo|prize|smuggl|merchant|blockade/i.test(quest.name || ''))) || carriedGold >= 25;
  const C2VERBS = {
    // §3a Silent Trade — Bribe: resolves against anyone poorer than you
    silent_trade: { label: 'Bribe them', test: () => player.inventory.gold > carriedGold,
      fail: 'they have more coin than you do' },
    // §3b Standing Order — Command: resolves against anyone lawfully aligned
    standing_order: { label: 'Give them an order', test: () => enemyAlign === 'law',
      fail: 'they answer to no lawful authority' },
    // §3c Black Flag — Intimidate at Sea: against anyone carrying cargo or coin
    black_flag: { label: 'Run up the colours', test: () => hasCargo,
      fail: 'they are carrying nothing worth losing' },
    // §3d Colours and Papers — Requisition: lawfully aligned, or carrying cargo
    colours_and_papers: { label: 'Requisition it', test: () => enemyAlign === 'law' || hasCargo,
      fail: 'nothing here answers to papers' },
  };
  for (const [perkId, spec] of Object.entries(C2VERBS)) {
    const entry = player.perks.find(p => p.skillId === perkId);
    if (!entry) continue;
    const m = Sys().manifest(player, entry);
    const applies = spec.test();
    let odds = applies ? 0.85 : 0.25;
    let note = applies ? '' : spec.fail;
    if (lead.species !== 'human') { odds = 0; note = 'beasts do not bargain'; }
    verbs.push({ verb: perkId, ok: odds > 0, odds, note, label: spec.label, mode: 'bypass', tier: m.tier });
  }

  // Alignment pass (§8): criminal standing talks past bandits, law past guards
  const fs = player.factionStanding;
  const lawEnemies = ['plated_sentinel'];
  const crimEnemies = ['bandit', 'grave_acolyte'];
  const tid = lead.enemyTypeId;
  if (crimEnemies.includes(tid) && fs.criminal >= 30) {
    verbs.push({ verb: 'alignment', ok: true, odds: 0.95, label: 'Flash criminal standing', mode: 'bypass' });
  }
  if (lawEnemies.includes(tid) && fs.law >= 30) {
    verbs.push({ verb: 'alignment', ok: true, odds: 0.95, label: 'Show the law\'s writ', mode: 'bypass' });
  }
  return verbs;
};

function avgSkillLevel(ch) {
  const all = ch.perks.concat(ch.actives);
  if (!all.length) return 1;
  return Math.round(all.reduce((s, e) => s + e.level, 0) / all.length);
}
Quests.avgSkillLevel = avgSkillLevel;

// Attempt a bypass. Returns {success, stolen, mode}.
// Bypassing witnesses nothing (§8) — that's the core tradeoff.
Quests.attemptBypass = function (world, rng, player, party, verbInfo, enemies) {
  const success = rng.chance(verbInfo.odds);
  const out = { success, mode: verbInfo.mode, verb: verbInfo.verb, stolen: 0 };
  if (!success) return out; // failed bypass -> fight, enemies unimpressed
  if (verbInfo.verb === 'sneak') {
    // A successful Sneak always steals (§3a) — inventory only, never equipped (§10)
    const entry = player.perks.find(p => p.skillId === 'sneak');
    const m = Sys().manifest(player, entry);
    const targets = m.data.stealAll ? enemies : [enemies[0]];
    for (const e of targets) {
      const g = rng.int(5, 15) + (e.enemyLevel || 1) * 2;
      out.stolen += g;
    }
    player.inventory.gold += out.stolen;
  }
  if (verbInfo.verb === 'silent_trade') {
    // A bribe is paid, not threatened: it costs, which is what separates it
    // from Persuade and why it works on people stronger than you.
    const cost = Math.min(player.inventory.gold, rng.int(10, 20) + (enemies[0].enemyLevel || 1) * 2);
    player.inventory.gold -= cost;
    out.stolen = -cost;
  }
  if (verbInfo.verb === 'black_flag') {
    // Colours up: they hand over what they were carrying rather than fight for it.
    out.stolen = rng.int(15, 30) + (enemies[0].enemyLevel || 1) * 3;
    player.inventory.gold += out.stolen;
  }
  if (verbInfo.verb === 'intimidate') {
    const entry = player.perks.find(p => p.skillId === 'intimidate');
    const m = Sys().manifest(player, entry);
    if (m.data.fleersDropLoot) {
      out.stolen = rng.int(10, 25);
      player.inventory.gold += out.stolen;
    }
  }
  return out;
};

// ---- Payout & reputation (§16, §9) -----------------------------------------
Quests.payout = function (world, quest, leader, hires) {
  const goldMult = leader.registryId && ADV.DATA.REGISTRY[leader.registryId] &&
    leader.perks.some(p => p.skillId === 'rich') ? 10 : 1;
  const gross = quest.payout * goldMult;
  let payroll = 0;
  for (const h of hires) payroll += h.wage || 0;
  return { gross, payroll, net: gross - payroll };
};

Quests.applyFactionShift = function (world, ch, quest) {
  const f = quest.factionAlignment;
  const amt = C().FACTION_SHIFT_PER_QUEST;
  if (f === 'law') { ch.factionStanding.law += amt; ch.factionStanding.criminal -= Math.round(amt / 2); }
  else if (f === 'criminal') { ch.factionStanding.criminal += amt; ch.factionStanding.law -= Math.round(amt / 2); }
  else ch.factionStanding.neutral += amt;
  for (const k of Object.keys(ch.factionStanding)) {
    ch.factionStanding[k] = Math.max(-100, Math.min(100, ch.factionStanding[k]));
  }
};

ADV.Quests = Quests;
})();
