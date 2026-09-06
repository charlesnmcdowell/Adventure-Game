// Save state (§19): five keys, adv:meta survives permadeath, all writes
// wrapped in try/catch — a failed write must never block play.
(function () {
'use strict';

const Save = {};
const KEYS = ['adv:world', 'adv:characters', 'adv:edges', 'adv:vaults', 'adv:meta', 'adv:backup'];
Save.VERSION = 1;

// storage backend: localStorage in the browser, injectable for tests
let store = null;
function backend() {
  if (store) return store;
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
  // in-memory fallback
  store = { _m: {}, getItem(k) { return this._m[k] != null ? this._m[k] : null; },
    setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
  return store;
}
Save.setBackend = function (b) { store = b; };

function put(key, obj) {
  try { backend().setItem(key, JSON.stringify(obj)); return true; }
  catch (e) { return false; }
}
function get(key) {
  try { const v = backend().getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}

// Write once per quest resolution and on town transactions (§19).
Save.saveGame = function (game) {
  const w = game.world;
  put('adv:world', {
    seed: w.seed, questClock: w.questClock,
    eventFeed: w.eventFeed, activeHeroes: w.activeHeroes,
    pendingRescues: w.pendingRescues, pendingPopulation: w.pendingPopulation,
    orphans: w.orphans, divineOffers: w.divineOffers,
    pendingHeroInvites: w.pendingHeroInvites, pendingPlayerJilt: w.pendingPlayerJilt,
    playerId: w.playerId, metIds: w.metIds,
    parties: w.parties, campaignWorld: w.campaignWorld || null, mawContracts: w.mawContracts || [], pendingRaises: w.pendingRaises || [], hiroId: w.hiroId || null,
    sharedQuests: w.sharedQuests || {}, pendingProposals: w.pendingProposals || [], cooldowns: w.cooldowns || {},
    lastPlayerHelpAt: w.lastPlayerHelpAt, lastPlayerProposalAt: w.lastPlayerProposalAt, lastRivalAt: w.lastRivalAt,
    friendlyAskWait: w.friendlyAskWait || 0,
    board: game.board, life: game.life, campaign: game.campaign || null, campaign2: game.campaign2 || null, tutorial: game.tutorial || null,
    campaignProgress: w.campaignProgress || [],
  });
  put('adv:characters', w.characters);
  put('adv:edges', w.edges || []);
  put('adv:vaults', w.vaults || []);
  Save.saveMeta(game);
  Save.writeBackup();
};

Save.writeBackup = function () {
  const world = get('adv:world');
  const characters = get('adv:characters');
  if (!world || !characters) return false;
  return put('adv:backup', {
    v: Save.VERSION,
    world, characters,
    edges: get('adv:edges') || [],
    vaults: get('adv:vaults') || [],
    meta: get('adv:meta') || null,
  });
};

Save.restoreBackup = function () {
  const bak = get('adv:backup');
  if (!bak || !bak.world || !bak.characters) return false;
  put('adv:world', bak.world);
  put('adv:characters', bak.characters);
  put('adv:edges', bak.edges || []);
  put('adv:vaults', bak.vaults || []);
  if (bak.meta) put('adv:meta', bak.meta);
  return true;
};

Save.saveMeta = function (game) {
  put('adv:meta', game.meta);
};

Save.loadMeta = function () {
  return get('adv:meta') || { journal: {}, skillLevels: {}, promptsSeen: {}, codexUnlocked: [], hiroUnlocked: false, lives: 0 };
};

Save.loadGame = function () {
  let ws = get('adv:world');
  let characters = get('adv:characters');
  if (!ws || !characters) {
    if (!Save.restoreBackup()) return null;
    ws = get('adv:world');
    characters = get('adv:characters');
    if (!ws || !characters) return null;
  }
  const edges = get('adv:edges') || [];
  const vaults = get('adv:vaults') || [];
  const world = {
    seed: ws.seed, questClock: ws.questClock,
    characters, edges, vaults,
    parties: ws.parties || [],
    eventFeed: ws.eventFeed || [], activeHeroes: ws.activeHeroes || [],
    pendingRescues: ws.pendingRescues || [], pendingPopulation: ws.pendingPopulation || [],
    orphans: ws.orphans || [], divineOffers: ws.divineOffers || [],
    pendingHeroInvites: ws.pendingHeroInvites || [], pendingPlayerJilt: ws.pendingPlayerJilt || null,
    playerId: ws.playerId, metIds: ws.metIds || [],
    campaignWorld: ws.campaignWorld || null, campaignProgress: ws.campaignProgress || [], mawContracts: ws.mawContracts || [], pendingRaises: ws.pendingRaises || [], hiroId: ws.hiroId || null,
    sharedQuests: ws.sharedQuests || {}, pendingProposals: ws.pendingProposals || [], cooldowns: ws.cooldowns || {},
    lastPlayerHelpAt: ws.lastPlayerHelpAt != null ? ws.lastPlayerHelpAt : -99,
    lastPlayerProposalAt: ws.lastPlayerProposalAt != null ? ws.lastPlayerProposalAt : -99,
    lastRivalAt: ws.lastRivalAt != null ? ws.lastRivalAt : -99,
    friendlyAskWait: ws.friendlyAskWait || 0,
  };
  const loaded = { world, board: ws.board || null, life: ws.life || 1, meta: Save.loadMeta(), campaign: ws.campaign || null, campaign2: ws.campaign2 || null, tutorial: ws.tutorial || null };
  if (ADV.Survival) {
    for (const c of characters) {
      if (c && c.isPlayer) ADV.Survival.state(c);
    }
  }
  if (ADV.Party && ADV.Party.repairWorld) ADV.Party.repairWorld(world);
  else if (ADV.Party && ADV.Party.syncIds) ADV.Party.syncIds(world);
  if (ADV.World && ADV.World.pruneStrangerContacts) ADV.World.pruneStrangerContacts(world);
  return loaded;
};

Save.hasSave = function () { return !!get('adv:world'); };

// Continue is only real if the full save loads and the player is still alive.
// A leftover world key must not hide the title notice or offer a dead Continue.
Save.hasValidContinue = function () {
  try {
    const data = Save.loadGame();
    if (!data || !data.world) return false;
    const player = ADV.World && ADV.World.byId
      ? ADV.World.byId(data.world, data.world.playerId)
      : (data.world.characters || []).find(c => c && c.id === data.world.playerId);
    return !!(player && player.alive);
  } catch (e) {
    return false;
  }
};

ADV.TitleNotice = {
  text: 'All characters and data will be wiped at 8 PM CST. Sorry for the inconvenience — a new expansion has released. Create a new character and let me know if you like it.',
  visible: () => !Save.hasValidContinue(),
};

Save.reset = function () {
  for (const k of KEYS) { try { backend().removeItem(k); } catch (e) {} }
};

ADV.Save = Save;
})();
