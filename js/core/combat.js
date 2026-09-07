// Three-lane turn-based tactical combat (§4, §15a).
// Pure logic: emits an event list the UI animates. No Phaser here.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const SK = () => ADV.DATA.SKILLS;
const Sys = () => ADV.SkillSys;
const Ch = () => ADV.Character;

const Combat = {};

// Status taxonomy — one authority for "what counts as negative" (Demigod
// immunity, Cleanse) vs "what ticks as damage over time".
const NEG_STATUSES = ['reactionLock', 'rooted', 'burn', 'bleed', 'poison', 'healcut', 'frozen', 'shocked', 'sealed',
  'withering', 'exposed', 'shock', 'suppressed', 'marked', 'contractMark', 'shadowDot'];
const DOT_STATUSES = ['burn', 'bleed', 'poison', 'shadowDot'];
// Buffs and wards — what Dispel/Ward Thief can strip (perks are never statuses, §13d-2)
const POS_STATUSES = ['guard', 'ward', 'atkBuff', 'thorns', 'aura', 'hot', 'iceArmor', 'takenReduce', 'purified', 'thornShield', 'grove', 'wings', 'form',
  'cloak', 'bloodPrice', 'serpent', 'storm', 'bond', 'spellblade', 'warhound', 'fireBarrier',
  'absorb', 'anchor', 'advance', 'lifesteal', 'holdRoad', 'countersign', 'runic',
  'elemGuard', 'volley', 'closed', 'laneGuard', 'immovable', 'charmWard', 'railGuard',
  'venomTouch', 'openingTouch', 'beastShape'];
Combat.NEG_STATUSES = NEG_STATUSES; Combat.POS_STATUSES = POS_STATUSES;
Combat.isGod = isGod;

// ---------------------------------------------------------------- unit wrap
function makeUnit(ch, side, idx) {
  const maxHp = Math.max(Ch().maxHp(ch), ch.hpFloor || 0);   // boss floor (DOT_PROMPT.md §11)
  return {
    uid: side + idx, ch, side,
    lane: null, slot: 0,
    chp: ch.combatHp != null ? ch.combatHp : maxHp,
    maxHp, tempHp: 0,
    downed: false, fled: false, reserved: false,
    statuses: [],           // {kind, rounds, power, stacks, srcUid, scope...}
    marksBy: [],            // taunt marks: uids this unit MUST attack
    momentumTarget: null, momentumStacks: 0, consecutiveCount: 0, momentumArmed: false,
    guard: null,            // {scope, srcUid} shield wall
    evade: 0, untargetable: 0, counter: 0,
    usedOncePerBattle: {},
    planned: null,          // intent {skillId, targetUid, label}
    witnessedHere: [],      // [{skillId, tier}] skills seen this battle
    turnsPerRound: rankTurns(ch).n,
    consecutiveTurns: rankTurns(ch).consecutive,
    delayed: 0,             // frost/snare turn-order penalty (acts later)
    loseNextAction: false,
    survivedLethal: false,  // wild form advanced once/battle
    // campaign primitives
    stealth: false, stealthRounds: 0, actedThisEncounter: false, reflectImmuneNext: false,
    killStreak: 0, idleRounds: 0, castsThisBattle: 0, laneStreak: { lane: null, n: 0 },
    preventedStored: 0, attackedThisRoundBy: [], lastElementTaken: null,
    // ninja/pirate primitives (add-on §3)
    reloadLock: {},            // skillId -> true while it needs reloading
    laneFocus: { lane: null, n: 0 },  // Ranging Cannon: consecutive rounds on a lane
    damageTaken: 0,            // Clan Blood heals from this
    grantedTurns: 0,
    freeActionUsed: false,
  };
}

function isGod(ch) {
  return !!(ch && (ch.isGod || ch.role === 'god' || ch.godLine));
}
function rankTurns(ch) {
  const perkN = Math.max(Sys().knownVal(ch, 'turnsPerRound') || 1, 1);
  const consecPerk = !!Sys().knownVal(ch, 'consecutive');
  const place = Sys().knownVal(ch, 'turnPlacement');
  if (isGod(ch)) return { n: Math.max(3, perkN), consecutive: true };
  if (ch && ch.boss) return { n: Math.max(2, perkN), consecutive: true };
  return { n: perkN, consecutive: consecPerk && place !== 'distributed' };
}

function perkVal(ch, perkId, key) {
  const p = ch.perks.find(e => e.skillId === perkId);
  if (!p) return null;
  const sk = SK()[perkId];
  if (!sk) return null;
  const m = Sys().manifest(ch, p);
  const data = m ? m.data : Object.assign({}, sk, (sk.tiers && (sk.tiers.basic || sk.tiers.advanced)) || {});
  return key ? data[key] : data;
}


// ---- lane geometry & positional casting rules -------------------------------
const LANE_IDX = { front: 0, mid: 1, back: 2 };
// Restorative healing on OTHERS requires standing exactly one lane behind the
// target (self-healing works anywhere).
// Healing reaches any ally in any lane (request: allies must be healable).
function canHealOther(caster, tgt) { return true; }
// Protective (tank-style) support requires being on the target's lane or a
// lane ahead of them — you shield what stands behind you.
function canWard(caster, tgt) {
  // Wards reach any ally in any lane, same as heals.
  return !!(caster && tgt);
}

// -------------------------------------------------------------- lane layout
function layoutSide(units) {
  // Prefer: tanks/fighters front, healers/mages/rangers back, rest mid.
  const backish = ['mage', 'ranger'];
  const midish = ['healer'];      // healing reaches exactly one lane ahead
  const frontish = ['tank', 'fighter', 'druid'];
  const lanes = { front: [], mid: [], back: [] };
  const solo = units.length === 1;
  for (const u of units) {
    if (u.reserved) continue;
    let lane = 'mid';
    const inc = (u.ch.archetypeInclination && u.ch.archetypeInclination[0]) ||
                mainArchetype(u.ch);
    if (solo) lane = 'front';                       // a solo character occupies the front lane (§15a)
    else if (frontish.includes(inc)) lane = 'front';
    else if (midish.includes(inc)) lane = 'mid';
    else if (backish.includes(inc)) lane = 'back';
    // overflow to adjacent lanes
    const order = lane === 'front' ? ['front', 'mid', 'back'] :
                  lane === 'back' ? ['back', 'mid', 'front'] : ['mid', 'front', 'back'];
    for (const L of order) {
      if (lanes[L].length < C().LANE_CAP) { lanes[L].push(u); u.lane = L; u.slot = lanes[L].length - 1; break; }
    }
    if (!u.lane) { u.reserved = true; }              // field cap: 9 per side (§15a)
  }
  // guarantee front occupancy: if front empty but others occupied, pull forward
  if (!lanes.front.length) {
    const src = lanes.mid.length ? 'mid' : 'back';
    const u = lanes[src].shift();
    if (u) { lanes.front.push(u); u.lane = 'front'; u.slot = 0; }
  }
  return lanes;
}

function mainArchetype(ch) {
  const counts = {};
  for (const e of ch.actives.concat(ch.perks)) {
    const sk = SK()[e.skillId];
    if (sk && sk.archetype) counts[sk.archetype] = (counts[sk.archetype] || 0) + 1;
  }
  let best = null, n = 0;
  for (const [k, v] of Object.entries(counts)) if (v > n) { best = k; n = v; }
  return best || 'fighter';
}

// ---------------------------------------------------------------- creation
// sideA/sideB: arrays of characters. opts: {ambushBy: characterId, rng}
Combat.create = function (charsA, charsB, opts) {
  opts = opts || {};
  if (ADV.Character.syncNpcHeroFloor) ADV.Character.syncNpcHeroFloor((charsA || []).concat(charsB || []));
  const rng = opts.rng || new ADV.RNG(12345);
  const st = {
    rng, round: 0, events: [], over: false, winner: null,
    units: [], reservesA: [], reservesB: [],
    ambushUid: null, turnQueue: [], turnIdx: 0,
    context: opts.context || 'quest',
    hazards: [],                              // lane hazards: {side, lane, kind, power, rounds, srcUid, srcAtk}
    questTier: opts.questTier || 1,           // Paid Shot scaling
    encounterIndex: opts.encounterIndex || 0, // Veteran's Cut scaling
    leaderId: opts.leaderId || null,
    leaderFell: false,
    leaderFled: false,
    dotHopDone: false,
    turnsSinceHatred: 99,
    hatredSpoken: {},
  };
  let i = 0;
  for (const ch of charsA) st.units.push(makeUnit(ch, 'a', i++));
  i = 0;
  for (const ch of charsB) st.units.push(makeUnit(ch, 'b', i++));
  // field cap
  for (const side of ['a', 'b']) {
    const mine = st.units.filter(u => u.side === side);
    mine.slice(C().FIELD_CAP).forEach(u => { u.reserved = true; });
    layoutSide(mine);
  }
  if (opts.ambushBy) {
    const u = st.units.find(x => x.ch.id === opts.ambushBy);
    if (u) st.ambushUid = u.uid;
  }
  ev(st, { t: 'start', ambush: !!st.ambushUid });
  startRound(st);
  for (const u of st.units) refreshFreeBuffs(st, u);
  return st;
};

function ev(st, e) { st.events.push(e); return e; }

function livingUnits(st, side) {
  return st.units.filter(u => u.side === side && !u.downed && !u.fled && !u.reserved);
}

function battleUseCount(u, skillId) {
  const v = u && u.usedOncePerBattle && u.usedOncePerBattle[skillId];
  if (!v) return 0;
  return v === true ? 1 : v;
}

function battleUseLimit(d) {
  if (!d) return 0;
  if (d.reviveUses != null) return d.reviveUses;
  if (d.oncePerBattle) return 1;
  return 0;
}

function canSpendBattleUse(u, skillId, d) {
  const limit = battleUseLimit(d);
  if (!limit) return true;
  return battleUseCount(u, skillId) < limit;
}

function spendBattleUse(u, skillId) {
  u.usedOncePerBattle = u.usedOncePerBattle || {};
  u.usedOncePerBattle[skillId] = battleUseCount(u, skillId) + 1;
}

function downedAllies(st, side) {
  return st.units.filter(x => x.side === side && x.downed && !x.fled && !x.reserved);
}

function pickReviveTargets(st, side, preferred, n) {
  const downed = downedAllies(st, side);
  const out = [];
  if (preferred && preferred.downed && downed.includes(preferred)) out.push(preferred);
  for (const x of downed) {
    if (out.length >= n) break;
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

function applyRevive(st, src, tgt, d, skillId) {
  const pct = d.reviveHp != null ? d.reviveHp : 0.4;
  tgt.downed = false;
  tgt.chp = Math.max(1, Math.round(tgt.maxHp * pct));
  if (d.shieldHits) addStatus(st, tgt, { kind: 'ward', hits: d.shieldHits, reflect: !!d.wardReflect });
  if (d.reviveAtkMult) addStatus(st, tgt, { kind: 'atkBuff', mult: d.reviveAtkMult, rounds: d.reviveBuffRounds || 2 });
  if (d.reviveStealthRounds) {
    tgt.stealth = true;
    tgt.stealthRounds = d.reviveStealthRounds;
    ev(st, { t: 'stealth', uid: tgt.uid });
  }
  if (d.reviveEvade) tgt.evade += d.reviveEvade;
  if (d.grantSelfTurn) Combat.grantTurn(st, src || tgt, tgt, d.grantSelfTurn);
  // Part B3/C3: the mark the risen wears, and the reviver's word (once per fight, guaranteed)
  const arch = skillArchetype(skillId);
  if (arch === 'druid' || arch === 'healer') healCleanse(st, tgt, 'all', src ? src.uid : null);
  if (arch === 'druid') addStatus(st, tgt, { kind: 'grove', rounds: d.buffRounds || d.reviveBuffRounds || 3, srcUid: src ? src.uid : null });
  else if (arch === 'healer') addStatus(st, tgt, { kind: 'wings', rounds: d.reviveBuffRounds || 2, srcUid: src ? src.uid : null });
  ev(st, { t: 'revive', uid: tgt.uid, by: src ? src.uid : tgt.uid, skillId: skillId || null, arch });
  if (src && (arch === 'druid' || arch === 'healer')) {
    st.revLines = st.revLines || {};
    const first = !st.revLines[src.uid];
    if (first || st.rng.chance(0.35)) {
      st.revLines[src.uid] = (st.revLines[src.uid] || 0) + 1;
      const table = (ADV.DATA.REVIVE_LINES && ADV.DATA.REVIVE_LINES[arch]) || [];
      if (table.length) {
        const text = table[Math.abs(((src.ch.id || '').length * 31 + st.round)) % table.length];
        ev(st, { t: 'line', uid: src.uid, target: tgt.uid, kind: arch, text, tag: arch === 'healer' ? 'warm' : 'flat' });
      }
    }
  }
}

function trySelfRevive(st, u) {
  if (!u || !u.ch) return false;
  for (const e of (u.ch.actives || [])) {
    const m = manifestFor(u, e.skillId);
    if (!m || !m.data.selfRevive) continue;
    if (!canSpendBattleUse(u, e.skillId, m.data)) continue;
    spendBattleUse(u, e.skillId);
    applyRevive(st, u, u, m.data, e.skillId);
    const lv = Sys().recordUse(u.ch, e.skillId);
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId: e.skillId, level: lv.level, tier: lv.tier });
    recordSighting(st, u, e.skillId, m.tier);
    return true;
  }
  return false;
}
Combat.living = livingUnits;

// ---- lane movement (add-on §3) --------------------------------------------
// Pulls, hooks and shoves all come through here. Sea Legs, Bear Stance, Close
// Order and Stone Stance make a unit immovable; Chain-and-Weight roots it.
function isImmovable(u) {
  if (u.statuses.some(x => x.kind === 'immovable')) return true;
  for (const e of u.ch.perks) { const sk = SK()[e.skillId]; if (sk && sk.immovable) return true; }
  return false;
}
function laneClosed(st, u) {
  return livingUnits(st, u.side).some(x => x.lane === u.lane && x.statuses.some(y => y.kind === 'closed'));
}
Combat.moveLane = function (st, u, toLane) {
  if (!toLane || toLane === u.lane) return false;
  if (isImmovable(u) || laneClosed(st, u) || u.statuses.some(x => x.kind === 'rooted')) {
    ev(st, { t: 'heldFast', uid: u.uid }); return false;
  }
  const occupants = laneUnits(st, u.side, toLane).length;
  if (occupants >= C().LANE_CAP) return false;
  u.lane = toLane; u.slot = occupants;
  ev(st, { t: 'moved', uid: u.uid, lane: toLane });
  return true;
};
// Drag a unit `n` lanes toward the front of its own side.
Combat.pullForward = function (st, u, n) {
  const order = ['back', 'mid', 'front'];
  let idx = order.indexOf(u.lane);
  let moved = false;
  for (let i = 0; i < (n || 1) && idx < order.length - 1; i++) {
    if (!Combat.moveLane(st, u, order[idx + 1])) break;
    idx++; moved = true;
  }
  return moved;
};

function laneUnits(st, side, lane) {
  return livingUnits(st, side).filter(u => u.lane === lane);
}

// -------------------------------------------------------- turn order (§15)
function buildTurnQueue(st) {
  const q = [];
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    let spd = Ch().effStat(u.ch, 'spd') - (u.delayed || 0);
    // Naval Discipline: nothing puts this lane at the back of the round
    const noDelay = livingUnits(st, u.side).some(x => x.lane === u.lane && Sys().knownVal(x.ch, 'laneNoDelay'));
    if (u.statuses.some(x => x.kind === 'shock') && !noDelay) spd -= 100;   // Shock: acts last
    if (Sys().knownVal(u.ch, 'firstInRoundOne') && st.round === 1) spd += 1000;
    const laneRank = { front: 0, mid: 1, back: 2 }[u.lane] || 0;
    const n = u.turnsPerRound;
    const consecutive = !!u.consecutiveTurns;
    for (let k = 0; k < n; k++) {
      // Lone Wolf distributed: spread extra turns through the round via phantom
      // speeds; Lightning King's extra turn comes straight after the first
      q.push({ uid: u.uid, spd: spd - k * (consecutive ? 0.01 : 6), laneRank, ord: u.uid, extra: k > 0 });
    }
  }
  q.sort((x, y) => y.spd - x.spd || x.laneRank - y.laneRank || (x.ord < y.ord ? -1 : 1));
  // Lightning King: the extra turn follows the first immediately, whatever ties say
  for (let i = q.length - 1; i >= 0; i--) {
    const e = q[i];
    if (!e.extra) continue;
    const u = st.units.find(x => x.uid === e.uid);
    if (!u || !u.consecutiveTurns) continue;
    q.splice(i, 1);
    const first = q.findIndex(x => x.uid === e.uid);
    q.splice(first + 1, 0, e);
  }
  // One Lightning King extra turn per side. Five kings is still one storm.
  const lkExtra = { a: false, b: false };
  for (let i = q.length - 1; i >= 0; i--) {
    const e = q[i];
    if (!e.extra) continue;
    const u = st.units.find(x => x.uid === e.uid);
    if (!u || !perkVal(u.ch, 'lightning_king', null)) continue;
    if (lkExtra[u.side]) q.splice(i, 1);
    else lkExtra[u.side] = true;
  }
  // Ambush: sneaking character gets 2 consecutive turns at the very top of round 1 (§15a)
  if (st.round === 1 && st.ambushUid) {
    const rest = q.filter(e => e.uid !== st.ambushUid);
    const own = q.filter(e => e.uid === st.ambushUid);
    q.length = 0;
    q.push({ uid: st.ambushUid, spd: 999, laneRank: 0, ord: '!' });
    q.push({ uid: st.ambushUid, spd: 998, laneRank: 0, ord: '!' });
    q.push(...rest, ...own.slice(0)); // ambusher keeps normal turns too? No — replace:
    // GDD: "two consecutive turns at the top of round one", normal order otherwise excluded
    st.turnQueue = q.filter(e => {
      if (e.uid !== st.ambushUid) return true;
      if (e.spd >= 998) return true;
      return false;
    });
    return;
  }
  st.turnQueue = q;
}

// Signal Flags / Fleet Order: splice an ally in right after the current turn.
Combat.grantTurn = function (st, u, ally, n) {
  const at = st.turnIdx + 1;
  for (let i = 0; i < (n || 1); i++) {
    st.turnQueue.splice(at + i, 0, { uid: ally.uid, spd: 0, laneRank: 0, ord: '>' + i, granted: true });
  }
  ally.grantedTurns = (ally.grantedTurns || 0) + (n || 1);
  ev(st, { t: 'grantTurn', uid: ally.uid, by: u.uid });
};

function beastShapeUp(u) {
  return !!(u && u.statuses.some(s => s.kind === 'beastShape'));
}

const BEASTS = ['werewolf', 'werebear', 'panther'];
Combat.BEASTS = BEASTS;
// C1: the portrait becomes the beast. Some forms have a fixed animal; the rest roll.
function beastFor(st, skillId) {
  if (skillId === 'bear_stance') return 'werebear';
  if (skillId === 'warhound_form') return 'werewolf';
  if (skillId === 'serpent_form' || skillId === 'fox_form') return 'panther';
  return st.rng.pick(BEASTS);
}
function applyForm(st, u, skillId, rounds) {
  const beast = beastFor(st, skillId);
  const old = u.statuses.find(x => x.kind === 'form');
  if (old) removeStatus(u, old);
  u.form = beast;
  addStatus(st, u, { kind: 'form', beast, rounds: rounds || 3, skillId });
  ev(st, { t: 'shapeshift', uid: u.uid, beast, skillId });
  return beast;
}
Combat.applyForm = applyForm;
Combat.isShapeshift = function (skillId) { const d = SK()[skillId]; return !!(d && (d.shapeshift || skillId === 'beast_shape' || /_form$|bear_stance|storm_shape/.test(skillId))); };
function applyBeastShape(st, u, m, skillId) {
  if (!u || !m) return false;
  const d = m.data || {};
  const already = beastShapeUp(u);
  if (!already) applyForm(st, u, skillId || 'beast_shape', d.rounds || 3);
  addStatus(st, u, {
    kind: 'beastShape',
    mult: d.atkMult || 1.25,
    lifeSteal: d.lifeSteal || 0,
    splashAdjacent: !!d.splashAdjacent,
    rounds: d.rounds || 3,
  });
  if (!already) {
    const lv = Sys().recordUse(u.ch, skillId || 'beast_shape');
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId: skillId || 'beast_shape', level: lv.level, tier: lv.tier });
  }
  return !already;
}

function refreshFreeBuffs(st, u) {
  if (!u || u.downed || u.fled || u.reserved) return;
  for (const e of u.ch.actives || []) {
    const m = manifestFor(u, e.skillId);
    if (!m || !m.data.freeBuff) continue;
    const seal = u.statuses.find(x => x.kind === 'sealed');
    if (seal && (seal.tiers || []).includes(m.tier)) continue;
    if (e.skillId === 'beast_shape' || m.data.atkMult) {
      if (!beastShapeUp(u)) applyBeastShape(st, u, m, e.skillId);
    }
  }
}
Combat.refreshFreeBuffs = refreshFreeBuffs;

function startRound(st) {
  st.round++;
  tickCooldowns(st);
  for (const u of st.units) { u.delayed = 0; u.attackedThisRoundBy = []; } // per-round trackers
  // scripted reinforcements (The Quiet raises the Risen mid-fight, §6a)
  if (st.spawnQueue) {
    for (const spec of st.spawnQueue.filter(x => x.round === st.round)) Combat.spawnReinforcement(st, spec.ch, spec.side || 'b');
  }
  buildTurnQueue(st);
  st.turnIdx = 0;
  // plan intents for everyone (telegraphed ally intent, §4)
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    if (!u.ch.isPlayer) u.planned = Combat.planFor(st, u);
  }
  ev(st, { t: 'round', n: st.round, order: st.turnQueue.map(e => e.uid) });
}

// Whose turn is it? Returns {unit, isPlayer} or advances rounds; null if over.
Combat.currentTurn = function (st) {
  if (st.over) return null;
  while (true) {
    if (st.turnIdx >= st.turnQueue.length) {
      endRoundTicks(st);
      if (st.over) return null;
      startRound(st);
    }
    const entry = st.turnQueue[st.turnIdx];
    const u = st.units.find(x => x.uid === entry.uid);
    if (!u || u.downed || u.fled || u.reserved) { st.turnIdx++; continue; }
    if (entry.extra && !entry.extraShown) { entry.extraShown = true; ev(st, { t: 'extraTurn', uid: u.uid }); }
    if (u.loseNextAction) {
      u.loseNextAction = false;
      breakMomentum(u);
      ev(st, { t: 'skip', uid: u.uid, reason: 'bound' });
      st.turnIdx++; tickHatredClock(st); continue;
    }
    const fz = u.statuses.find(x => x.kind === 'frozen');
    if (fz) {
      fz.skips = (fz.skips || 1) - 1;
      breakMomentum(u);
      ev(st, { t: 'skip', uid: u.uid, reason: 'frozen' });
      if (fz.skips <= 0) {
        removeStatus(u, fz);
        // thaw immunity: no re-freeze stunlock (3 rounds)
        u.statuses.push({ kind: 'freezeImmune', rounds: 3 });
      }
      st.turnIdx++; tickHatredClock(st); continue;
    }
    refreshFreeBuffs(st, u);
    return { unit: u, isPlayer: !!u.ch.isPlayer };
  }
};

function tickHatredClock(st) {
  st.turnsSinceHatred = (st.turnsSinceHatred == null ? 99 : st.turnsSinceHatred) + 1;
}

Combat.advance = function (st) {
  const entry = st.turnQueue[st.turnIdx];
  const u = entry && st.units.find(x => x.uid === entry.uid);
  if (u) u.freeActionUsed = false;
  st.turnIdx++;
  tickHatredClock(st);
  checkEnd(st);
};

// Named guild foes (assassination, ambush, rival intercept) each get one
// hatred line. After anyone speaks, the next speaker waits two turns.
Combat.hatredRemarkDue = function (st, opts) {
  opts = opts || {};
  if (!st) return null;
  const since = st.turnsSinceHatred == null ? 99 : st.turnsSinceHatred;
  const spoken = st.hatredSpoken || {};
  const foeSide = opts.foeSide || 'b';
  const cands = (st.units || []).filter(u => {
    const ch = u.ch;
    if (!ch || u.downed || u.fled || u.reserved) return false;
    if (u.side !== foeSide) return false;
    if (ch.isPlayer || ch.isQuestThrall) return false;
    if (ch.isUndead && !ch.boss && !isGod(ch)) return false;
    if (ch.isMonster && !ch.boss && !isGod(ch)) return false;
    if (spoken[ch.id]) return false;
    return true;
  });
  if (!cands.length) return null;
  const acting = opts.acting;
  const pick = acting && cands.indexOf(acting) >= 0 ? acting : cands[0];
  const already = Object.keys(spoken).length;
  if (!already) return pick;
  if (since < 2) return null;
  return pick;
};

Combat.noteHatredRemark = function (st, ch) {
  if (!st || !ch) return;
  st.hatredSpoken = st.hatredSpoken || {};
  st.hatredSpoken[ch.id] = true;
  st.turnsSinceHatred = 0;
};

// -------------------------------------------------------------- targeting
function canMelee(st, attacker, target) {
  // Cover: a lane cannot be melee-targeted while a lane in front of it is occupied (§4)
  const enemySide = target.side;
  const laneOrder = ['front', 'mid', 'back'];
  const ti = laneOrder.indexOf(target.lane);
  for (let i = 0; i < ti; i++) {
    if (laneUnits(st, enemySide, laneOrder[i]).length > 0) return false;
  }
  return true;
}

Combat.validTargets = function (st, u, skillId, offensiveMode) {
  const m = manifestFor(u, skillId);
  if (!m) return [];
  const d = m.data;
  const foeSide = u.side === 'a' ? 'b' : 'a';
  const seeInvis = !!(perkVal(u.ch, 'see_invisibility', null) || Sys().knownVal(u.ch, 'seeInvis'));
  const foes = livingUnits(st, foeSide).filter(x => !x.untargetable && (!x.stealth || seeInvis));
  const allies = livingUnits(st, u.side);
  let target = d.target;
  if (offensiveMode && d.offensive) target = d.offensive.target || 'enemy';
  const isHeal = d.heal && !offensiveMode;
  if (d.selfRevive) return [];
  if (target === 'self') return [u];
  if (target === 'party') return isHeal || d.auraAtk ? allies : foes;
  if (isHeal || target === 'ally' || target === 'allyLane') {
    if (d.revive) {
      const downed = downedAllies(st, u.side);
      if (downed.length) return downed;
      if (!d.power) return [];
    }
    let pool2 = allies;
    if (d.healBehind) pool2 = allies.filter(x => canHealOther(u, x));
    else if (d.wardAhead) pool2 = allies.filter(x => canWard(u, x));
    return pool2;
  }
  let pool = foes;
  if (d.openerOnly && u.actedThisEncounter) return [];
  if (d.openerOrStealth) {
    // Backstab rework (campaign §0d): any lane, but ONLY as the opening action
    // of an encounter or from stealth. Otherwise greyed out.
    pool = (u.stealth || !u.actedThisEncounter) ? foes : [];
  } else if (d.reach === 'back') {
    // Rearmost occupied non-front lane (a solo front-liner is never reachable)
    const backs = foes.filter(x => x.lane === 'back');
    const mids = foes.filter(x => x.lane === 'mid');
    pool = backs.length ? backs : mids;
  } else if (d.reach === 'front') {
    if (d.laneShift || Sys().knownVal(u.ch, 'laneShift')) pool = foes;
    else pool = foes.filter(x => canMelee(st, u, x));
  }
  // Hold the Road: a held lane cannot be flanked/bypassed — back-reach skills
  // can't single it out (front-reach and any-lane skills still can)
  if (d.reach === 'back') pool = pool.filter(x => !x.statuses.some(s => s.kind === 'holdRoad'));
  if (d.instantKillIfMaxHp) pool = pool.filter(x => (x.maxHp || 0) > d.instantKillIfMaxHp);
  // Taunt marks force targeting (§3a)
  if (u.marksBy.length) {
    const forced = pool.filter(x => u.marksBy.includes(x.uid));
    if (forced.length && !isHeal && target !== 'self') return forced;
  }
  return pool;
};

// Lowest current health in a target pool (temp HP counts). Ties keep the
// first unit so auto-target is deterministic.
Combat.lowestHealth = function (pool) {
  if (!pool || !pool.length) return null;
  let best = pool[0];
  let bestHp = best.chp + (best.tempHp || 0);
  for (let i = 1; i < pool.length; i++) {
    const u = pool[i];
    const hp = u.chp + (u.tempHp || 0);
    if (hp < bestHp) { best = u; bestHp = hp; }
  }
  return best;
};

Combat.skillNeedsAuto = function (ch, skillId, offensiveMode) {
  if (skillId === 'basic_attack') return true;
  const sk = SK()[skillId];
  if (!sk || sk.target === 'postVictory') return false;
  const entry = ch && Sys().entryFor(ch, skillId);
  const data = entry ? Sys().manifest(ch, entry).data : sk;
  let tgt = data.target;
  if (offensiveMode && data.offensive) tgt = data.offensive.target || 'enemy';
  if (data.freeBuff) return false;
  if (data.selfRevive) return false;
  return !!tgt;
};

Combat.clearAutoFlags = function (ch) {
  if (!ch) return;
  ch.autoAttack = false;
  ch.autoRepeat = null;
  ch.autoOrder = [];
  ch.autoIdx = 0;
  for (const e of (ch.actives || []).concat(ch.perks || [])) {
    if (e.auto || e.autoOff) {
      e.auto = false;
      e.autoOff = false;
      Sys().storeProgress(ch, e);
    }
  }
};

function sameAuto(a, skillId, off) {
  return a && a.skillId === skillId && !!a.off === !!off;
}

// Queue of auto skills, oldest first. Older saves only have a single
// autoRepeat / per-skill flag — fold those in so combat still fires.
Combat.autoList = function (ch) {
  if (!ch) return [];
  let stored = (ch.autoOrder || []).filter(x => x && x.skillId);
  if (!stored.length) {
    if (ch.autoRepeat && ch.autoRepeat.skillId) stored.push({ skillId: ch.autoRepeat.skillId, off: !!ch.autoRepeat.off });
    if (ch.autoAttack && !stored.some(x => sameAuto(x, 'basic_attack', false))) stored.push({ skillId: 'basic_attack', off: false });
    for (const e of ch.actives || []) {
      if (e.autoOff && !stored.some(x => sameAuto(x, e.skillId, true))) stored.push({ skillId: e.skillId, off: true });
      else if (e.auto && !stored.some(x => sameAuto(x, e.skillId, false))) stored.push({ skillId: e.skillId, off: false });
    }
    ch.autoOrder = stored;
  }
  const list = stored.filter(x => x.skillId === 'basic_attack' || Sys().entryFor(ch, x.skillId));
  ch.autoAttack = list.some(x => sameAuto(x, 'basic_attack', false));
  ch.autoRepeat = list[0] || null;
  return list;
};

Combat.ensureAutoRepeat = function (ch) {
  const list = Combat.autoList(ch);
  return list[0] || null;
};

Combat.skillAutoOn = function (ch, skillId, offensiveMode) {
  return Combat.autoList(ch).some(x => sameAuto(x, skillId, offensiveMode));
};

Combat.setSkillAuto = function (ch, skillId, on, offensiveMode) {
  Combat.autoList(ch);
  const list = ch.autoOrder || (ch.autoOrder = []);
  const off = !!offensiveMode;
  const i = list.findIndex(x => sameAuto(x, skillId, off));
  if (on && i < 0) list.push({ skillId, off });
  if (!on && i >= 0) list.splice(i, 1);
  const live = Combat.autoList(ch);
  ch.autoIdx = live.length ? ((ch.autoIdx || 0) % live.length) : 0;
  if (skillId === 'basic_attack') return;
  const e = Sys().entryFor(ch, skillId);
  if (!e) return;
  e.auto = list.some(x => sameAuto(x, skillId, false));
  e.autoOff = list.some(x => sameAuto(x, skillId, true));
  Sys().storeProgress(ch, e);
};

function autoUsable(st, u, r) {
  if (!r) return null;
  if (r.skillId !== 'basic_attack' && !Sys().entryFor(u.ch, r.skillId)) return null;
  const m = manifestFor(u, r.skillId);
  if (!m) return null;
  const d = m.data;
  const seal = u.statuses.find(x => x.kind === 'sealed');
  if (seal && r.skillId !== 'basic_attack' && (seal.tiers || []).includes(m.tier)) return null;
  if (d.interrupt && u.statuses.some(x => x.kind === 'shock' || x.kind === 'shocked')) return null;
  if (d.reload && u.reloadLock[r.skillId] && !perkVal(u.ch, 'powder_discipline', 'noReload')) return null;
  if (d.openerOnly && u.actedThisEncounter) return null;
  if (d.freeBuff) return null;
  if (d.freeAction && u.freeActionUsed) return null;
  if (cooldownLeft(u, r.skillId) > 0) return null;
  if (d.selfRevive) return null;
  if (d.revive && !canSpendBattleUse(u, r.skillId, d)) return null;
  let pool = Combat.validTargets(st, u, r.skillId, r.off);
  if (!pool.length) return null;
  const off = r.off && d.offensive;
  if (!off && d.heal && (d.power || d.hotRounds || d.healFromTaken) && !d.shieldHits && !d.shieldRounds) {
    const needy = pool.filter(x => x.downed || x.chp < x.maxHp);
    if (!needy.length) return null;
    pool = needy;
  }
  const tgt = Combat.lowestHealth(pool);
  if (!tgt) return null;
  return {
    action: { skillId: r.skillId, off: !!r.off, isAttack: r.skillId === 'basic_attack', pool },
    tgt,
  };
}

// NPC heroes and villains (never the player) smite the healthiest foe once
// per battle: leave them at 10% of the HP they had, after a hatred line.
Combat.tryNpcSmite = function (st, u) {
  if (!u || !u.ch || u.ch.isPlayer) return false;
  if (u.ch.status !== 'hero' && u.ch.status !== 'villain') return false;
  if (u.usedOncePerBattle && u.usedOncePerBattle.npcSmite) return false;
  const foes = livingUnits(st, u.side === 'a' ? 'b' : 'a').filter(x => !x.untargetable);
  if (!foes.length) return false;
  let tgt = foes[0];
  let best = tgt.chp + (tgt.tempHp || 0);
  for (let i = 1; i < foes.length; i++) {
    const hp = foes[i].chp + (foes[i].tempHp || 0);
    if (hp > best) { tgt = foes[i]; best = hp; }
  }
  u.usedOncePerBattle = u.usedOncePerBattle || {};
  u.usedOncePerBattle.npcSmite = true;
  const leave = Math.max(1, Math.ceil(best * 0.1));
  const dmg = Math.max(0, best - leave);
  ev(st, { t: 'npcSmite', uid: tgt.uid, by: u.uid, dmg });
  if (dmg > 0) applyRawDamage(st, u, tgt, dmg, 'smite');
  return true;
};

// Ready-to-fire player auto: the next skill in the rotation that has a target.
Combat.autoReadyAction = function (st, u) {
  const list = Combat.autoList(u.ch);
  if (!list.length) return null;
  const n = list.length;
  const start = ((u.ch.autoIdx || 0) % n + n) % n;
  for (let k = 0; k < n; k++) {
    const ready = autoUsable(st, u, list[(start + k) % n]);
    if (!ready) continue;
    u.ch.autoIdx = (start + k + 1) % n;
    return ready;
  }
  return null;
};

// True if the unit can spend the turn on a skill or a basic attack. Smoke and
// cover can empty every pool; the UI must still let the turn pass.
Combat.hasLegalCombatAction = function (st, u) {
  const seal = u.statuses.find(x => x.kind === 'sealed');
  for (const e of u.ch.actives || []) {
    const sk = SK()[e.skillId];
    if (!sk || sk.target === 'postVictory') continue;
    const m = manifestFor(u, e.skillId);
    if (!m) continue;
    if (seal && (seal.tiers || []).includes(m.tier)) continue;
    if (Combat.validTargets(st, u, e.skillId, false).length) return true;
    if (m.data.offensive && Combat.validTargets(st, u, e.skillId, true).length) return true;
  }
  return Combat.validTargets(st, u, 'basic_attack', false).length > 0;
};

function manifestFor(u, skillId) {
  if (skillId === 'basic_attack') {
    const sk = SK().basic_attack;
    return { skill: sk, tier: 'basic', level: 1, data: Object.assign({}, sk, sk.tiers.basic) };
  }
  const entry = u.ch.actives.find(a => a.skillId === skillId) || u.ch.perks.find(p => p.skillId === skillId);
  if (!entry) return null;
  return Sys().manifest(u.ch, entry);
}
Combat.manifestFor = manifestFor;
Combat.canSpendBattleUse = canSpendBattleUse;
Combat.battleUseCount = battleUseCount;

// ------------------------------------------------------------- damage core
function computeDamage(st, atkUnit, defUnit, m, opts) {
  opts = opts || {};
  const ch = atkUnit.ch;
  const atk = Ch().effStat(ch, 'atk');
  let power = opts.power != null ? opts.power : (m.data.power || 0);
  if (opts.power == null && m.data.fullHpBackstabPct && defUnit && defUnit.chp >= defUnit.maxHp) {
    const bsM = Sys().manifest(ch, { skillId: 'backstab', level: m.level || 1 });
    const bsPower = (bsM && bsM.data && bsM.data.power) || (SK().backstab && SK().backstab.power);
    if (bsPower) power = bsPower * m.data.fullHpBackstabPct;
  }
  if (power <= 0) return 0;
  const tierMult = m.data.noTierGrowth ? 1.0 : C().TIER_MULT[m.tier];
  const lvl = m.level;
  let dmg = atk * power * tierMult * (1 + lvl * C().LEVEL_DAMAGE_SCALAR);

  // Perk modifiers
  const flare = m.flare;
  if (flare && flare.shockBonus && defUnit && defUnit.statuses
    && defUnit.statuses.some(s => s.kind === 'shocked' || s.kind === 'shock')) {
    dmg *= (1 + flare.shockBonus);
  }
  if (atkUnit.stormMark && ((m.data.element === 'lightning') || m.data.shock)) {
    dmg *= (1 + atkUnit.stormMark);
    atkUnit.stormMark = 0;
  }
  const af = perkVal(ch, 'arcane_focus', null);
  if (af && m.data.elemental) dmg *= af.eleDmgMult;
  const wf = perkVal(ch, 'wild_form', null);
  if (wf) dmg *= wf.dmgMult;
  const mk = perkVal(ch, 'marksman', null);
  if (mk && atkUnit.lane === 'back' && m.data.target !== 'allEnemies' && m.data.target !== 'enemyLane') {
    dmg *= mk.backLaneBonus;
  }
  // Fifty Names: the clan writes down every kill, and the tally never resets
  const fn = perkVal(ch, 'fifty_names', 'lifeKillScale');
  if (fn) dmg *= 1 + (ch.lifeKills || 0) * fn;
  // Rising Cut / Before the Breath: doubled on anyone who has not moved yet
  if (m.data.unactedDouble && defUnit && !defUnit.attackedThisRound && !defUnit.actedThisRound) dmg *= 2;
  // Ranging Cannon: every consecutive round on the same lane finds the range
  if (m.data.laneFocusScale && defUnit) {
    if (atkUnit.laneFocus.lane === defUnit.lane) atkUnit.laneFocus.n++;
    else atkUnit.laneFocus = { lane: defUnit.lane, n: 0 };
    dmg *= 1 + atkUnit.laneFocus.n * m.data.laneFocusScale;
  }
  const ac = perkVal(ch, 'arena_champion', null);
  if (ac && atkUnit.arenaStacks) dmg *= 1 + atkUnit.arenaStacks * ac.stackPct;
  const mo = perkVal(ch, 'momentum', null);
  if (mo && defUnit) {
    dmg *= (1 + (atkUnit.momentumStacks || 0) * mo.stackMult);
  }
  // Beast shape / auras / campaign self-buffs
  for (const s of atkUnit.statuses) {
    if (s.kind === 'atkBuff' || s.kind === 'beastShape') dmg *= s.mult;
    if (s.kind === 'aura') dmg *= s.atk;
    if (s.kind === 'suppressed') dmg *= s.mult;        // Suppressing Volley
    if (s.kind === 'advance') dmg *= s.mult;           // Line Advance
    if (s.kind === 'bond') dmg *= s.mult;              // Elemental Bond
    if (s.kind === 'warhound') dmg *= s.mult;          // Warhound Form
    if (s.kind === 'spellblade') dmg *= (1 + m.level * 0.02); // Spellblade: scales with skill level
  }
  // ---- campaign scalers (§13) ----
  const D = m.data;
  if (D.killStreakScale) dmg *= 1 + atkUnit.killStreak * D.killStreakScale;         // Executioner's Rhythm
  if (D.idleScale) dmg *= 1 + atkUnit.idleRounds * D.idleScale;                     // Spider's Patience
  if (D.encounterScale) dmg *= 1 + (st.encounterIndex || 0) * D.encounterScale;    // Veteran's Cut
  if (D.castScale) dmg *= 1 + atkUnit.castsThisBattle * D.castScale;               // Arcane Cascade
  if (D.tierScale) dmg *= 1 + ((st.questTier === 'boss' ? 4 : (st.questTier || 1)) - 1) * D.tierScale; // Paid Shot
  if (D.alliesBetweenScale && defUnit) {                                            // Killing Angle
    const a = LANE_IDX[atkUnit.lane];
    const between = livingUnits(st, atkUnit.side).filter(x => x !== atkUnit && LANE_IDX[x.lane] < a).length;
    dmg *= 1 + between * D.alliesBetweenScale;
  }
  if (D.buffCountScale && defUnit) {                                                // Focal Shot
    const n = defUnit.statuses.filter(x => POS_STATUSES.includes(x.kind)).length;
    dmg *= 1 + n * D.buffCountScale;
  }
  if (D.flankScale && defUnit) {                                                    // Flanking Pay
    if (defUnit.attackedThisRoundBy.some(uid => uid !== atkUnit.uid)) dmg *= 1 + D.flankScale;
  }
  if (D.laneStreakScale && defUnit) {                                               // Ranged Discipline
    dmg *= 1 + (atkUnit.laneStreak.lane === defUnit.lane ? atkUnit.laneStreak.n : 0) * D.laneStreakScale;
  }
  if (D.distanceScale && defUnit) {                                                 // Shadow Lance
    const dist = LANE_IDX[defUnit.lane] + LANE_IDX[atkUnit.lane];
    dmg *= 1 + dist * D.distanceScale;
  }
  // Contract Mark: every ally deals bonus damage to the marked target
  if (defUnit && defUnit.statuses.some(x => x.kind === 'contractMark' && x.side === atkUnit.side)) dmg *= 1.25;
  dmg = Math.round(dmg);
  if (defUnit && atkUnit && atkUnit.ch) {
    if (isGod(atkUnit.ch)) dmg += Math.round((defUnit.maxHp || 0) * 0.5);
    else if (atkUnit.ch.boss) dmg += Math.round((defUnit.maxHp || 0) * 0.2);
  }
  let def = defUnit ? Ch().effStat(defUnit.ch, 'def') + (defUnit.armorBonus || 0) - (defUnit.defStripped || 0) : 0;
  if (defUnit) {
    // Marked for the Knife: the marker ignores 50% of the target's Defence
    if (defUnit.statuses.some(x => x.kind === 'marked' && x.srcUid === atkUnit.uid)) def = Math.round(def * 0.5);
    // Saber Thrust: through the guard — ignores a set fraction of Defence
    if (m.data.defIgnorePct) def = Math.round(def * (1 - m.data.defIgnorePct));
    // Burning: reduces Defence while active (campaign §13e)
    if (defUnit.statuses.some(x => x.kind === 'burn')) def -= 4;
    // Beast Handler: followers gain their handler's Defence bonus
    if ((defUnit.ch.isConscript || defUnit.ch.isUndead) &&
        livingUnits(st, defUnit.side).some(x => x !== defUnit && perkVal(x.ch, 'beast_handler', null))) def += 4;
  }
  return Math.max(C().MIN_DAMAGE, dmg - Math.max(0, def));
}

// Apply damage with all defensive triggers. Returns actual damage dealt to hp.
function dealDamage(st, src, tgt, amount, tag, opts) {
  opts = opts || {};
  if (tgt.downed || tgt.fled) return 0;
  if (src && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') {
    if (!tgt.attackedThisRoundBy.includes(src.uid)) tgt.attackedThisRoundBy.push(src.uid);
  }
  // Reflect immunity: Ghoststep's next attack, and Marksman firing from the
  // back lane, take no reflect damage from ANY source (campaign §0c/§13a)
  const mkA = src ? perkVal(src.ch, 'marksman', null) : null;
  const noReflect = !!(opts.noReflect || (src && (src.reflectImmuneNext || (mkA && mkA.noReflect && src.lane === 'back'))));
  const bounce = (owner, victim, dmgBack, kind) => { if (!noReflect) applyRawDamage(st, owner, victim, dmgBack, kind || 'reflect'); };
  // Shocked (lightning): the target takes more damage from EVERY source
  const sh = tgt.statuses.find(x => x.kind === 'shocked');
  if (sh && tag !== 'dot') amount = Math.round(amount * (1 + sh.pct));
  // Constructs / undead: no blood to spoil. Ice and lightning bite steel harder.
  if (tag !== 'dot' && !Ch().isOrganic(tgt.ch)) {
    const el = opts.element;
    if (el === 'lightning' || el === 'ice') {
      amount = Math.round(amount * (C().ICE_LIGHTNING_INORGANIC || 1.75));
    } else if (!el || el === 'physical') {
      amount = Math.round(amount * (C().NON_ORGANIC_WEAK || 1.35));
    }
  }
  // Exposed (campaign §13e): melee hits consume every stack for +20% each
  if (opts.melee && tag === 'attack') {
    const ex = tgt.statuses.find(x => x.kind === 'exposed');
    if (ex && ex.stacks > 0) { amount = Math.round(amount * (1 + 0.2 * ex.stacks)); removeStatus(tgt, ex); ev(st, { t: 'exposedBurst', uid: tgt.uid, stacks: ex.stacks }); }
  }
  // Evade / counter
  if (tgt.evade > 0 && src && !opts.cannotMiss && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') {
    tgt.evade--;
    ev(st, { t: 'evade', uid: tgt.uid, by: src.uid });
    return 0;
  }
  const locked = tgt.statuses.some(x => x.kind === 'reactionLock');   // Bell-Silence
  if (tgt.counter > 0 && src && tag === 'attack' && !locked) {
    tgt.counter--;
    ev(st, { t: 'counter', uid: tgt.uid, by: src.uid, dmg: amount });
    bounce(tgt, src, amount);
    return 0;
  }
  let dmg = amount;
  const prismatic = opts.element === 'prismatic';   // Prismatic Bolt: no resistance applies
  // Fire Barrier: party fire resistance + Burning on attackers
  const fb = tgt.statuses.find(x => x.kind === 'fireBarrier');
  if (fb) {
    if (opts.element === 'fire' && !prismatic) dmg = Math.round(dmg * (1 - fb.resist));
    if (src && tag === 'attack') addStatus(st, src, { kind: 'burn', power: 0.8, rounds: 3, srcAtk: Ch().effStat(tgt.ch, 'atk'), srcLevel: 1 });
  }
  // Ash Ward / Cinder Screen: the company takes less from every element
  const eg = tgt.statuses.find(x => x.kind === 'elemGuard');
  if (eg && opts.element && !prismatic) dmg = Math.round(dmg * eg.mult);
  // The Clan Watches / Hold Fast: an ally in the lane shelters the rest
  if (src) {
    for (const a of livingUnits(st, tgt.side)) {
      if (a === tgt || a.lane !== tgt.lane) continue;
      let g = perkVal(a.ch, 'the_clan_watches', 'laneAllyGuard');
      if (!g) { const cl = a.statuses.find(x => x.kind === 'laneGuard'); if (cl) g = cl.mult; }
      if (g) { dmg = Math.round(dmg * g); break; }
    }
  }
  // Absorption Field: elemental damage reduced for the party, the caster healed by it
  const ab = tgt.statuses.find(x => x.kind === 'absorb');
  if (ab && opts.element && !prismatic) {
    const cut = Math.round(dmg * ab.pct); dmg -= cut;
    const owner = st.units.find(x => x.uid === ab.srcUid);
    if (owner && !owner.downed && cut > 0) healUnit(st, null, owner, cut);
  }
  // Cloak of Shadows: reduction + reflect using Backstab's calculation
  const ck = tgt.statuses.find(x => x.kind === 'cloak');
  if (ck && tag === 'attack') {
    dmg = Math.round(dmg * (1 - ck.reduce));
    if (src) {
      const back = Math.max(1, Math.round(Ch().effStat(tgt.ch, 'atk') * 6.0 * C().TIER_MULT[ck.tier || 'basic'] * 0.5) - Math.max(0, Ch().effStat(src.ch, 'def')));
      bounce(tgt, src, back);
    }
  }
  // Pyromaniac: fire resistance on the defender (request 4)
  if (opts.element === 'fire' && !prismatic) {
    const py = perkVal(tgt.ch, 'pyromaniac', null);
    if (py && py.fireResist) dmg = Math.round(dmg * (1 - py.fireResist));
  }
  // Bulwark reflect is calculated here; the reduction itself lands in
  // applyTakenReduction after the hit (including % HP) is finalized.
  const bw = perkVal(tgt.ch, 'bulwark', null);
  let reflectPct = 0;
  if (bw && tag !== 'dot') reflectPct += bw.reflectPct;
  // Aura defense
  for (const s of tgt.statuses) if (s.kind === 'aura') dmg = Math.round(dmg / s.def);
  // Guard (Shield Wall): absorb fraction of incoming strikes, spells, and
  // percent-HP ticks; prevented damage is dealt to the attacker.
  let prevented = 0;
  const guarded = opts.ignoreGuards ? null : findGuard(st, tgt);
  if (guarded && (tag === 'attack' || tag === 'spell' || tag === 'dot')) {
    const absorb = guarded.absorb != null ? guarded.absorb : 0.5;
    prevented = Math.ceil(dmg * absorb);
    dmg -= prevented;
    guarded.owner.preventedStored += prevented;               // Paid in Full ledger
    if (src) bounce(guarded.owner, src, prevented);
    // Unseen Guard: the interceptor is unseen and the attacker bleeds
    if (guarded.unseen && src) { const ug = manifestFor(guarded.owner, 'unseen_guard'); addStatus(st, src, { kind: 'bleed', tier: ug ? ug.tier : 'basic', power: 0.6, rounds: 3, stacks: true, srcAtk: Ch().effStat(guarded.owner.ch, 'atk'), srcUid: guarded.owner.uid }); }
  }
  // Ward shields (Guardian Ward): the next hit, strike or spell
  const ward = tgt.statuses.find(s => s.kind === 'ward' && (s.hits > 0 || s.rounds > 0));
  if (ward && (tag === 'attack' || tag === 'spell')) {
    if (ward.hits > 0) ward.hits--;
    tgt.preventedStored += dmg;
    ev(st, { t: 'ward', uid: tgt.uid, blocked: dmg });
    if (ward.reflect && src) bounce(tgt, src, dmg);
    // Warding Stance: when the ward breaks it discharges into the attacker's lane
    if (ward.discharge && ward.hits <= 0 && src) {
      for (const x of laneUnits(st, src.side, src.lane)) bounce(tgt, x, Math.round(ward.discharge));
      removeStatus(tgt, ward);
    }
    return 0;
  }
  // Thorn shield (druid heal, A3): a pool that drinks the hit and gives half of it back
  const tsh = (tag === 'attack' || tag === 'spell') ? tgt.statuses.find(s => s.kind === 'thornShield' && s.pool > 0) : null;
  if (tsh) {
    const absorbed = Math.min(dmg, tsh.pool);
    tsh.pool -= absorbed; dmg -= absorbed;
    tgt.preventedStored += absorbed;
    ev(st, { t: 'shieldAbsorb', uid: tgt.uid, absorbed, left: tsh.pool, by: src ? src.uid : null });
    if (src && absorbed > 0) bounce(tgt, src, Math.max(1, Math.round(absorbed * (tsh.reflectPct || 0.5))));
    if (tsh.pool <= 0) { removeStatus(tgt, tsh); ev(st, { t: 'shieldBreak', uid: tgt.uid }); }
    if (dmg <= 0) return 0;
  }
  // Thorns
  const thorn = tgt.statuses.some(x => x.kind === 'reactionLock') ? null : tgt.statuses.find(s => s.kind === 'thorns');
  if (thorn && src && tag === 'attack') bounce(tgt, src, Math.round(dmg * thorn.pct));
  if (reflectPct > 0 && src && (tag === 'attack' || tag === 'spell')) bounce(tgt, src, Math.round(dmg * reflectPct));
  // Blood Price: one-shot 200% reflect, stacks additively on top of everything
  const bp = tgt.statuses.find(s => s.kind === 'bloodPrice');
  if (bp && src && tag === 'attack') { removeStatus(tgt, bp); bounce(tgt, src, Math.round(dmg * bp.pct)); }
  // Taunt retaliation: marked attacker strikes the marker (§3a)
  if (src && (tag === 'attack' || tag === 'spell') && src.marksBy.length) {
    for (const markerUid of src.marksBy) {
      if (markerUid === tgt.uid) {
        const marker = st.units.find(x => x.uid === markerUid);
        if (marker && !marker.downed && !marker.fled) {
          const tm = manifestFor(marker, 'taunt');
          const rp = (tm ? tm.data.retaliationPower : 1.5) || 1.5;
          // Fixed retaliation — no DEF subtraction (§15a worked check: ATK 9 -> 14)
          const rdmg = Math.max(1, Math.round(Ch().effStat(marker.ch, 'atk') * rp *
            C().TIER_MULT[tm ? tm.tier : 'basic']));
          applyRawDamage(st, marker, src, rdmg, 'retaliation');
          addExposed(st, src, 1);                                // retaliation is melee (§0d)
        }
      }
    }
  }
  // Bulwark Formation / Contract Bound: damage shared equally across the group
  const share = tgt.statuses.find(s => s.kind === 'share');
  let dealt;
  if (share && tag !== 'dot') {
    const group = livingUnits(st, tgt.side).filter(x => x.statuses.some(s => s.kind === 'share' && s.group === share.group));
    if (group.length > 1) {
      const each = Math.max(1, Math.round(dmg / group.length));
      dealt = 0;
      for (const g of group) dealt += applyRawDamage(st, src, g, each, tag, opts);
    } else dealt = applyRawDamage(st, src, tgt, dmg, tag, opts);
  } else dealt = applyRawDamage(st, src, tgt, dmg, tag, opts);
  if (opts.element) tgt.lastElementTaken = opts.element;
  if (src && src.reflectImmuneNext && tag !== 'dot') src.reflectImmuneNext = false;
  if (src && dealt > 0 && opts.element === 'fire') {
    const py = perkVal(src.ch, 'pyromaniac', null);
    if (py && py.fireLeech) healUnit(st, null, src, Math.max(1, Math.round(dealt * py.fireLeech)));
  }
  if (src && dealt > 0 && opts.element === 'ice') {
    const iq = perkVal(src.ch, 'ice_queen', null);
    if (iq && iq.iceArmorPerHit) {
      let armor = src.statuses.find(x => x.kind === 'iceArmor');
      if (!armor) { armor = { kind: 'iceArmor', pct: 0 }; src.statuses.push(armor); }
      armor.pct = Math.min(0.5, Math.round((armor.pct + iq.iceArmorPerHit) * 100) / 100);
      ev(st, { t: 'status', uid: src.uid, kind: 'iceArmor' });
    }
  }
  return dealt;
}

// Exposed stacks (campaign §13e): applied by every melee hit, consumed by the next one.
function addExposed(st, tgt, n) {
  if (!tgt || tgt.downed || tgt.fled) return;
  if (tgt.statuses.some(x => x.kind === 'purified')) return;
  const ex = tgt.statuses.find(x => x.kind === 'exposed');
  if (ex) ex.stacks += n; else tgt.statuses.push({ kind: 'exposed', stacks: n });
  ev(st, { t: 'status', uid: tgt.uid, kind: 'exposed' });
}
Combat.addExposed = addExposed;

function applyRankRiders(st, src, tgt) {
  if (!src || !tgt || tgt.downed) return;
  const list = [];
  if (src.ch.hitStatus) list.push(src.ch.hitStatus);
  for (const s of (src.ch.hitStatuses || [])) list.push(s);
  const atk = Ch().effStat(src.ch, 'atk');
  for (const s of list) {
    if (!s || !s.kind) continue;
    addStatus(st, tgt, Object.assign({ srcAtk: atk, srcUid: src.uid, srcLevel: src.ch.enemyLevel || 1 }, s, { ticks: undefined, dealt: undefined, ticksTotal: undefined }));
  }
}

function applyOpportunist(src, tgt, dmg, opts) {
  if (!src || !src.ch || !tgt || src === tgt) return dmg;
  if (opts && opts.noExecute) return dmg;
  const opp = perkVal(src.ch, 'opportunist', null);
  if (!opp) return dmg;
  const thresh = opp.executeThreshold != null ? opp.executeThreshold : 0.5;
  if ((tgt.chp / tgt.maxHp) >= thresh) return dmg;
  if (opp.bonusHpPct) return dmg + Math.round(tgt.maxHp * opp.bonusHpPct);
  if (opp.bonusMult) return Math.round(dmg * opp.bonusMult);
  return dmg;
}

// Personal damage reduction — after the hit is calculated (atk, def, % HP
// riders, Opportunist). A 50% HP blow still eats Bulwark / Frost Armor.
function isPhysicalTaken(opts) {
  const tag = opts && opts.tag;
  if (opts && opts.melee) return true;
  return tag === 'attack' || tag === 'dot' || tag === 'retaliation';
}

function applyTakenReduction(tgt, dmg, opts) {
  if (!tgt || dmg <= 0) return dmg;
  opts = opts || {};
  let mult = 1;
  for (const e of (tgt.ch.perks || [])) {
    const m = manifestFor(tgt, e.skillId);
    if (!m || !m.data || typeof m.data.dmgTakenMult !== 'number') continue;
    if (m.data.physicalTaken && !isPhysicalTaken(opts)) continue;
    mult *= m.data.dmgTakenMult;
  }
  const prismatic = opts.element === 'prismatic';
  for (const s of tgt.statuses || []) {
    if (typeof s.dmgTakenMult === 'number') mult *= s.dmgTakenMult;
    if (s.kind === 'iceArmor' && s.pct && !prismatic) mult *= (1 - s.pct);
  }
  if (mult === 1) return dmg;
  return Math.max(0, Math.round(dmg * mult));
}
Combat.applyTakenReduction = applyTakenReduction;

function applyRawDamage(st, src, tgt, dmg, tag, opts) {
  if (!tgt || tgt.downed || tgt.fled) return 0;
  // Hollow Discipline: being hit does not break stealth. Only attacking does.
  if (tgt.stealth && !perkVal(tgt.ch, 'hollow_discipline', 'stealthKeepsOnHit')) { /* base rules elsewhere */ }
  dmg = applyOpportunist(src, tgt, dmg, opts);
  dmg = applyTakenReduction(tgt, dmg, Object.assign({}, opts, { tag }));
  if (dmg <= 0) return 0;
  // Temp HP consumed first — still counts as damage taken for reflect/retaliation (§15a),
  // which is honored because those triggers fire in dealDamage before this point.
  let remaining = dmg;
  if (tgt.tempHp > 0) {
    const absorbed = Math.min(tgt.tempHp, remaining);
    tgt.tempHp -= absorbed; remaining -= absorbed;
  }
  tgt.chp -= remaining;
  tgt.damageTaken = (tgt.damageTaken || 0) + remaining;
  // Paper Charm / Sealed: whoever strikes the warded ally is poisoned for it
  const pc = tgt.statuses.find(x => x.kind === 'charmWard');
  if (pc && src && tag !== 'dot' && tag !== 'reflect') {
    addStatus(st, src, { kind: 'poison', tier: pc.tier || 'basic', power: pc.power, rounds: pc.rounds, stacks: true, srcAtk: Ch().effStat(tgt.ch, 'atk'), srcUid: tgt.uid });
  }
  // Come Aboard: the next one to swing at you comes over the rail
  const bp = tgt.statuses.find(x => x.kind === 'railGuard');
  if (bp && src && tag === 'attack') { removeStatus(tgt, bp); Combat.moveLane(st, src, tgt.lane); }
  if (src && src.ch && tag !== 'dot' && tag !== 'reflect' && tag !== 'retaliation') applyRankRiders(st, src, tgt);
  ev(st, { t: 'damage', uid: tgt.uid, by: src ? src.uid : null, dmg, tag });
  if (tgt.chp <= 0) {
    // Vital Anchor: cannot drop below 1 HP
    // Vital Anchor: holds at 1 HP — but an anchor is spent by the blow it
    // catches, and each unit can be anchored only once per battle (no 45-round
    // stalemates against a re-casting healer)
    const anc = tgt.statuses.find(x => x.kind === 'anchor');
    if (anc) { removeStatus(tgt, anc); tgt.anchorSpent = true; tgt.chp = 1; ev(st, { t: 'anchored', uid: tgt.uid }); return dmg; }
    // Wild Form advanced: survive one lethal blow per battle at 1 HP
    const wf = perkVal(tgt.ch, 'wild_form', null);
    if (wf && wf.surviveLethal && !tgt.survivedLethal) {
      tgt.survivedLethal = true; tgt.chp = 1;
      ev(st, { t: 'surviveLethal', uid: tgt.uid });
    } else if (tgt.ch.campaignExit && !tgt.ch.__scriptedDeath) {
      // Campaign rivals/bosses cannot die in combat (§5a): they exit the
      // encounter with their signature line and return next encounter.
      tgt.chp = 0; tgt.fled = true; tgt.exited = true;
      ev(st, { t: 'campaignExit', uid: tgt.uid, name: tgt.ch.name });
      checkEnd(st);
      return dmg;
    } else {
      tgt.chp = 0; tgt.downed = true;
      ev(st, { t: 'down', uid: tgt.uid, by: src ? src.uid : null });
      onUnitDown(st, tgt);
      if (src && tgt.downed) {
        src.killStreak++;                                        // Executioner's Rhythm
        src.ch.lifeKills = (src.ch.lifeKills || 0) + 1;          // Fifty Names' tally
        if (src.stealthOnKillPending) { src.stealth = true; src.stealthRounds = 2; src.stealthOnKillPending = false; ev(st, { t: 'stealth', uid: src.uid }); }
        // Opportunist advanced: kills refund your action
        const opp = perkVal(src.ch, 'opportunist', null);
        if (opp && opp.killRefundsAction && (tag === 'attack' || tag === 'spell')) src.refundAction = true;
        // Arena Champion: every kill heals half, stacks damage, and taunts the field
        const ac = perkVal(src.ch, 'arena_champion', null);
        if (ac) {
          healUnit(st, null, src, Math.max(1, Math.round(src.maxHp * ac.killHealPct)));
          src.arenaStacks = (src.arenaStacks || 0) + 1;
          for (const f of livingUnits(st, tgt.side)) {
            if (!f.marksBy.includes(src.uid)) f.marksBy.push(src.uid);
            const existing = f.statuses.find(x => x.kind === 'taunted' && x.srcUid === src.uid);
            if (existing) existing.rounds = ac.tauntRounds; else addStatus(st, f, { kind: 'taunted', srcUid: src.uid, rounds: ac.tauntRounds });
          }
          ev(st, { t: 'arenaChampion', uid: src.uid, stacks: src.arenaStacks });
        }
      }
    }
  }
  checkEnd(st);
  return dmg;
}

Combat.spawnReinforcement = function (st, ch, side) {
  const idx = st.units.filter(x => x.side === side).length;
  ch.combatHp = null;
  const u = makeUnit(ch, side, idx);
  st.units.push(u);
  const lanes = { front: laneUnits(st, side, 'front'), mid: laneUnits(st, side, 'mid'), back: laneUnits(st, side, 'back') };
  for (const L of ['front', 'mid', 'back']) {
    if (lanes[L].length < C().LANE_CAP) { u.lane = L; u.slot = lanes[L].length; break; }
  }
  if (!u.lane) u.reserved = true;
  ev(st, { t: 'reinforce', uid: u.uid, lane: u.lane, name: ch.name });
  return u;
};

function noteLeaderOut(st, u, died) {
  if (!st.leaderId || !u.ch || u.ch.id !== st.leaderId || u.ch.isPlayer) return;
  if (died) st.leaderFell = true;
  else st.leaderFled = true;
  if (st.over) return;
  st.over = true;
  st.winner = u.side === 'a' ? 'b' : 'a';
  Combat.applySurvivalGrowth(st);
  ev(st, { t: 'end', winner: st.winner, reason: died ? 'leaderFell' : 'leaderFled' });
}

const DOT_HOP = { basic: 0, intermediate: 1, advanced: 3 };
Combat.DOT_HOP = DOT_HOP;
function hopDots(st, dead) {
  if (st.dotHopDone) return;
  const dots = (dead.statuses || []).filter(s => isPctDot(s.kind) && !s.__hopped);
  if (!dots.length) return;
  const rank = { basic: 0, intermediate: 1, advanced: 2 };
  let best = 'basic';
  for (const s of dots) if ((rank[s.tier] || 0) > (rank[best] || 0)) best = s.tier;
  const n = DOT_HOP[best] || 0;
  if (n <= 0) return;
  const order = { front: 0, mid: 1, back: 2 };
  const cand = livingUnits(st, dead.side).filter(x => {
    if (x === dead) return false;
    if (x.statuses.some(s => s.kind === 'purified')) return false;
    const dm = perkVal(x.ch, 'demigod', null);
    if (dm && dm.statusImmune) return false;
    return true;
  }).filter(x => {
    const imm = x.ch.statusImmunities || [];
    return dots.some(s => !imm.includes(s.kind));
  });
  if (!cand.length) return;
  cand.sort((a, b) => {
    const da = Math.abs((order[a.lane] || 0) - (order[dead.lane] || 0));
    const db = Math.abs((order[b.lane] || 0) - (order[dead.lane] || 0));
    if (da !== db) return da - db;
    return (a.slot || 0) - (b.slot || 0);
  });
  const tgts = cand.slice(0, n);
  st.dotHopDone = true;
  for (const s of dots) s.__hopped = true;
  for (const tgt of tgts) {
    const imm = tgt.ch.statusImmunities || [];
    let hopped = 0;
    for (const s of dots) {
      if (imm.includes(s.kind)) continue;
      addStatus(st, tgt, reseatDot(Object.assign({}, s, { fresh: true, __hopped: true, _spread: true }), tgt));
      hopped++;
    }
    if (hopped) ev(st, { t: 'poisonHop', from: dead.uid, to: tgt.uid, n: hopped, kinds: dots.map(s => s.kind) });
  }
}
function hopPoison(st, dead) { hopDots(st, dead); }

function pickAdjacentFoe(st, primary) {
  if (!primary) return null;
  const mates = laneUnits(st, primary.side, primary.lane).filter(x => x !== primary);
  return mates[0] || null;
}

function bulwarkOnEnemyDown(st, dead) {
  const foeSide = dead.side === 'a' ? 'b' : 'a';
  for (const u of livingUnits(st, foeSide)) {
    const bw = perkVal(u.ch, 'bulwark', null);
    if (!bw || !bw.killHealPct) continue;
    healUnit(st, null, u, Math.max(1, Math.round(u.maxHp * bw.killHealPct)), { noCleanse: true });
    if (bw.killCleanse) healCleanse(st, u, 'all', u.uid);
    ev(st, { t: 'bulwarkKill', uid: u.uid, from: dead.uid });
  }
}

function onUnitDown(st, u) {
  if (trySelfRevive(st, u)) return;
  hopDots(st, u);
  bulwarkOnEnemyDown(st, u);
  noteLeaderOut(st, u, true);
  // step a reserve into the field on the following turn (§15a)
  const side = u.side;
  const res = st.units.find(x => x.side === side && x.reserved && !x.downed && !x.fled);
  if (res) {
    res.reserved = false;
    const lanes = { front: laneUnits(st, side, 'front'), mid: laneUnits(st, side, 'mid'), back: laneUnits(st, side, 'back') };
    for (const L of ['front', 'mid', 'back']) {
      if (lanes[L].length < C().LANE_CAP) { res.lane = L; res.slot = lanes[L].length; break; }
    }
    ev(st, { t: 'reserveIn', uid: res.uid, lane: res.lane });
  }
}

function findGuard(st, tgt) {
  for (const u of livingUnits(st, tgt.side)) {
    const g = u.statuses.find(s => s.kind === 'guard' || s.kind === 'warhound');
    if (!g) continue;
    if (u === tgt && g.kind === 'guard') return { owner: u, absorb: g.absorb };
    if (g.kind === 'warhound') { if (u !== tgt && u.lane === tgt.lane) return { owner: u, absorb: g.absorb }; continue; }
    // Unseen Guard: guards one named ally; the interceptor is not seen
    if (g.scope === 'ally') { if (g.targetUid === tgt.uid) return { owner: u, unseen: true, absorb: g.absorb }; continue; }
    // a guard covers only those on the tank's lane or behind it (request 3)
    if (g.scope === 'party' && canWard(u, tgt)) return { owner: u, absorb: g.absorb };
    if (g.scope === 'behind' && (LANE_IDX[tgt.lane] || 0) >= (LANE_IDX[u.lane] || 0)) return { owner: u, absorb: g.absorb };
    if (g.scope === 'lane' && u.lane === tgt.lane) return { owner: u, absorb: g.absorb };
  }
  // Bulwark+ / Rampart: cover an ally in an adjacent lane with no extra stance
  for (const u of livingUnits(st, tgt.side)) {
    const bw = perkVal(u.ch, 'bulwark', null);
    if (!bw || !bw.protectAdjacent || u === tgt) continue;
    if (Math.abs((LANE_IDX[u.lane] || 0) - (LANE_IDX[tgt.lane] || 0)) === 1) return { owner: u, absorb: 0.5 };
  }
  return null;
}

// ---------------------------------------------------------------- healing
// Heals cleanse (DOT_PROMPT.md §9). `scope`: 'stack' (one poison + one bleed,
// oldest first), 'dots' (every poison + bleed), 'dots+' (plus burn, healcut),
// 'all' (the full negative list). Emits `cleansed` with byHeal so the field shows it.
function healCleanse(st, tgt, scope, byUid) {
  if (!tgt || !scope) return 0;
  let cured = 0;
  const kill = (s) => {
    if (s.kind === 'withering' && !tgt.statuses.some(x => x.kind === 'witherImmune')) {
      tgt.statuses.push({ kind: 'witherImmune', rounds: 3 });
    }
    if (s.kind === 'healcut' && !tgt.statuses.some(x => x.kind === 'healcutImmune')) {
      tgt.statuses.push({ kind: 'healcutImmune', rounds: 3 });
    }
    removeStatus(tgt, s);
    cured++;
  };
  if (scope === 'stack') {
    for (const kind of ['poison', 'bleed']) { const s = tgt.statuses.find(x => x.kind === kind); if (s) kill(s); }
  } else {
    const kinds = scope === 'all' ? NEG_STATUSES : scope === 'dots+' ? ['poison', 'bleed', 'burn', 'healcut', 'withering'] : ['poison', 'bleed', 'withering'];
    for (const x of tgt.statuses.slice()) if (kinds.includes(x.kind)) kill(x);
  }
  if (cured) ev(st, { t: 'cleansed', uid: tgt.uid, cured, byHeal: true, by: byUid || null });
  return cured;
}
Combat.healCleanse = healCleanse;
// what a healer's restoring heal strips, by tier
function healerCleanseScope(tier) { return tier === 'advanced' ? 'all' : tier === 'intermediate' ? 'dots+' : 'dots'; }

function healUnit(st, src, tgt, amount, opts) {
  opts = opts || {};
  // self-heals (leech, lifesteal, kill heals, drains): ≥10% of max HP clears one stack of each DoT, ≥25% clears them all
  if (!opts.noCleanse && (src == null || src === tgt) && amount > 0 && tgt.maxHp) {
    const frac = amount / tgt.maxHp;
    if (frac >= 0.25) healCleanse(st, tgt, 'dots', tgt.uid);
    else if (frac >= 0.10) healCleanse(st, tgt, 'stack', tgt.uid);
  }
  if (tgt.statuses.some(x => x.kind === 'withering')) { ev(st, { t: 'withered', uid: tgt.uid }); return 0; }
  const hc = tgt.statuses.find(x => x.kind === 'healcut');
  if (hc) amount = Math.round(amount * (1 - (hc.pct || 0.5)));
  const dm = perkVal(tgt.ch, 'demigod', null);
  if (dm) amount *= dm.healReceivedMult;
  const dev = src ? perkVal(src.ch, 'devoted', null) : null;
  if (dev) amount = Math.round(amount * dev.healMult);
  amount = Math.round(amount);
  const missing = tgt.maxHp - tgt.chp;
  const applied = Math.min(missing, amount);
  tgt.chp += applied;
  let over = amount - applied;
  if (over > 0) {
    // Overheal -> temp HP, cap 50% of max (universal, §15a); Demigod uncapped; Devoted+ doubles
    if (dev && dev.tempHpDouble) over *= 2;
    let cap = Math.round(tgt.maxHp * ((dev && dev.tempHpCap) || C().OVERHEAL_CAP_PCT));
    if (dm && SK().demigod.overhealUncapped) cap = Infinity;
    tgt.tempHp = Math.min(cap, tgt.tempHp + over);
  }
  ev(st, { t: 'heal', uid: tgt.uid, by: src ? src.uid : null, amount, temp: tgt.tempHp, tick: !!opts.tick });
  // Devoted advanced: healing also damages the nearest enemy
  if (dev && dev.healSplashPct && src) {
    const foes = livingUnits(st, src.side === 'a' ? 'b' : 'a');
    if (foes.length) {
      const near = foes.sort((x, y) => ({ front: 0, mid: 1, back: 2 }[x.lane]) - ({ front: 0, mid: 1, back: 2 }[y.lane]))[0];
      dealDamage(st, src, near, Math.max(1, Math.round(amount * dev.healSplashPct) - Ch().effStat(near.ch, 'def')), 'spell');
    }
  }
  return amount;
}

// Healer & druid pass (HEALER_DRUID_PROMPT.md Part A): every restoring heal is
// a fraction of the TARGET's max HP. Nothing else computes a heal amount.
const HEAL_PCT = { basic: 0.5, intermediate: 1.0, advanced: 1.5 };
const HEAL_TARGETS = { basic: 1, intermediate: 2, advanced: 4 };
const REGEN_TICKS = 5, REGEN_COOLDOWN = 3, DRUID_TICKS = 3, DRUID_REFLECT = 0.5;
Combat.HEAL_PCT = HEAL_PCT; Combat.HEAL_TARGETS = HEAL_TARGETS;
Combat.REGEN_TICKS = REGEN_TICKS; Combat.REGEN_COOLDOWN = REGEN_COOLDOWN; Combat.DRUID_TICKS = DRUID_TICKS;
function healPct(st, src, tgt, skillId, tier, d) {
  d = d || (skillId && SK()[skillId]) || {};
  const pct = (HEAL_PCT[tier] || HEAL_PCT.basic) * (d.healMult || 1);
  return Math.max(1, Math.round((tgt.maxHp || 1) * pct));
}
Combat.healPct = healPct;
function skillArchetype(skillId) { const d = skillId && SK()[skillId]; return d ? d.archetype : null; }
Combat.skillArchetype = skillArchetype;
// intermediate heals reach two allies, advanced four: the chosen one, then the lowest
function pickHealTargets(st, u, tgt, tier) {
  const n = HEAL_TARGETS[tier] || 1;
  const out = tgt ? [tgt] : [];
  if (n > 1) {
    const rest = livingUnits(st, u.side).filter(x => x !== tgt && !x.downed)
      .sort((a, b) => (a.chp / a.maxHp) - (b.chp / b.maxHp));
    for (const x of rest) { if (out.length >= n) break; if (x.chp < x.maxHp) out.push(x); }
  }
  return out;
}
Combat.pickHealTargets = pickHealTargets;
function applyDruidHeal(st, u, t, tier, amt) {
  healCleanse(st, t, 'dots', u.uid);
  const old = t.statuses.find(x => x.kind === 'hot' && x.druid);
  if (old) removeStatus(t, old);
  addStatus(st, t, { kind: 'hot', druid: true, ticks: DRUID_TICKS, perTick: Math.max(1, Math.round(amt / DRUID_TICKS)), srcUid: u.uid, tier });
  const oldS = t.statuses.find(x => x.kind === 'thornShield');
  if (oldS) removeStatus(t, oldS);
  const pool = Math.round(t.maxHp * (HEAL_PCT[tier] || 0.5));
  addStatus(st, t, { kind: 'thornShield', pool, max: pool, reflectPct: DRUID_REFLECT, rounds: DRUID_TICKS, tier, srcUid: u.uid });
  ev(st, { t: 'thornShield', uid: t.uid, by: u.uid, tier });
}
Combat.applyDruidHeal = applyDruidHeal;
function cooldownLeft(u, skillId) { return (u && u.cooldowns && u.cooldowns[skillId]) || 0; }
Combat.cooldownLeft = cooldownLeft;
function tickCooldowns(st) {
  for (const u of st.units) {
    if (!u.cooldowns) continue;
    for (const k of Object.keys(u.cooldowns)) { if (u.cooldowns[k] > 0) u.cooldowns[k]--; if (u.cooldowns[k] <= 0) delete u.cooldowns[k]; }
  }
}

// Poison & bleed: a tick is a percentage of the TARGET's max HP by the
// applying skill's tier, spread evenly over DOT_TICKS (8) so the full
// amount never lands in one turn.
const DOT_PCT = { basic: 0.5, intermediate: 1.0, advanced: 1.25 };
const DOT_TICKS = 8;
Combat.DOT_PCT = DOT_PCT;
Combat.DOT_TICKS = DOT_TICKS;
function isPctDot(kind) { return kind === 'poison' || kind === 'bleed'; }
function dotWindow(rounds) {
  return DOT_TICKS;
}
Combat.dotWindow = dotWindow;
function normaliseDot(status) {
  if (!isPctDot(status.kind)) return status;
  status.tier = DOT_PCT[status.tier] != null ? status.tier : 'basic';
  status.pct = DOT_PCT[status.tier];
  if (status.ticks == null) status.ticks = dotWindow(status.rounds);
  if (status.ticksTotal == null) status.ticksTotal = status.ticks;
  if (status.dealt == null) status.dealt = 0;
  delete status.rounds; delete status.fresh;
  return status;
}
// A transferred DoT keeps its remaining ticks; the leftover fraction is of the NEW target's max HP.
function reseatDot(status, tgt) {
  if (!isPctDot(status.kind) || !tgt) return status;
  normaliseDot(status);
  const total = Math.round((tgt.maxHp || 1) * status.pct);
  const elapsed = Math.max(0, (status.ticksTotal || status.ticks) - status.ticks);
  status.dealt = Math.round(total * elapsed / Math.max(1, status.ticksTotal));
  return status;
}
Combat.reseatDot = reseatDot;
function dotTick(st, status, tgt) {
  if (!isPctDot(status.kind)) return 0;
  normaliseDot(status);
  const total = Math.round((tgt.maxHp || 1) * status.pct);
  // even ticks; the remainder rides on the last one so the total is exact
  let dmg = status.ticks <= 1 ? Math.max(0, total - status.dealt) : Math.round(total / status.ticksTotal);
  const src = status.srcUid ? st.units.find(x => x.uid === status.srcUid) : null;
  if (src && src.side === 'b' && tgt.side === 'a') dmg = Math.round(dmg * (C().DOT_ENEMY_MULT == null ? 1 : C().DOT_ENEMY_MULT));
  return Math.max(1, dmg);
}
Combat.dotTick = dotTick;
Combat.normaliseDot = normaliseDot;

// --------------------------------------------------------------- statuses
function addStatus(st, tgt, status) {
  normaliseDot(status);
  if (status.kind === 'anchor' && (tgt.anchorSpent || tgt.statuses.some(x => x.kind === 'anchor'))) return;
  if (status.rounds != null) status.fresh = true; // survives the round it was cast
  const dm = perkVal(tgt.ch, 'demigod', null);
  const negative = NEG_STATUSES.includes(status.kind);
  if (dm && dm.statusImmune && negative) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  // Purify/Absolution: blanket immunity to everything negative (request 7)
  if (negative && tgt.statuses.some(x => x.kind === 'purified')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  // thawed targets cannot be re-frozen for 2 rounds (request 4)
  if (status.kind === 'frozen' && tgt.statuses.some(x => x.kind === 'freezeImmune' || x.kind === 'frozen')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'frozen' });
    return;
  }
  // Wither / heal-cut: one lock, then a gap — a row of smiters cannot shut
  // healing off for the rest of the fight.
  if (status.kind === 'withering' && tgt.statuses.some(x => x.kind === 'withering' || x.kind === 'witherImmune')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'withering' });
    return;
  }
  if (status.kind === 'healcut' && tgt.statuses.some(x => x.kind === 'healcut' || x.kind === 'healcutImmune')) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: 'healcut' });
    return;
  }
  if (tgt.ch.statusImmunities && tgt.ch.statusImmunities.includes(status.kind)) {
    ev(st, { t: 'immune', uid: tgt.uid, kind: status.kind });
    return;
  }
  const existing = tgt.statuses.find(s => s.kind === status.kind);
  if (existing) Object.assign(existing, status);
  else tgt.statuses.push(status);
  ev(st, { t: 'status', uid: tgt.uid, kind: status.kind });
  spreadSeptic(st, tgt, status);
}

function endRoundTicks(st) {
  // lane hazards: Ashfall / Ranging Ward damage, Growth Field heals
  for (const h of st.hazards.slice()) {
    if (h.delay > 0) { h.delay--; continue; }              // Powder Keg: one round to burn down
    for (const u of laneUnits(st, h.side, h.lane)) {
      if (h.heal) healUnit(st, null, u, Math.max(1, Math.round(h.srcAtk * h.power)));
      else {
        const srcH = h.srcUid ? st.units.find(x => x.uid === h.srcUid) : null;
        applyRawDamage(st, srcH || null, u, Math.max(1, Math.round(h.srcAtk * h.power * 0.5)), 'dot');
      }
    }
    if (h.fresh) h.fresh = false; else { h.rounds--; if (h.rounds <= 0) st.hazards.splice(st.hazards.indexOf(h), 1); }
  }
  for (const u of st.units) {
    if (u.downed || u.fled || u.reserved) continue;
    // Last Breath: the borrowed round ends
    const lb = u.statuses.find(x => x.kind === 'lastBreath');
    if (lb && !lb.fresh) { removeStatus(u, lb); u.chp = 0; u.downed = true; ev(st, { t: 'down', uid: u.uid, by: null }); onUnitDown(st, u); continue; }
    if (u.stealthRounds > 0) { u.stealthRounds--; if (u.stealthRounds <= 0 && u.untargetable <= 0) u.stealth = false; }
    u.reloadLock = {};                       // a round is long enough to reload
    if (u.grantedTurns) u.grantedTurns = 0;
    if (!u.attackedThisRound) u.idleRounds++; else u.idleRounds = 0;
    u.attackedThisRound = false;
    if (u.statuses.some(x => x.kind === 'serpent')) u.evade = Math.max(u.evade, 1);
    for (const s of u.statuses.slice()) {
      if (DOT_STATUSES.includes(s.kind)) {
        let dot = isPctDot(s.kind) ? dotTick(st, s, u) : Math.max(1, Math.round((s.srcAtk || 8) * s.power * 0.5 * (1 + (s.srcLevel || 1) * 0.015)));
        const srcU = s.srcUid ? st.units.find(x => x.uid === s.srcUid) : null;
        const srcSeptic = srcU && (s.kind === 'bleed' || s.kind === 'poison') ? perkVal(srcU.ch, 'septic_sanguine', null) : null;
        if (srcSeptic) dot = Math.round(dot * srcSeptic.dotMult);
        const dealt = applyRawDamage(st, srcU, u, dot, 'dot');
        if ((s.kind === 'bleed' || s.kind === 'poison') && dealt > 0) feedSepticLeech(st, dealt, srcU, u);
        if (srcU && s.kind === 'burn' && dealt > 0 && !srcU.downed) {
          const py = perkVal(srcU.ch, 'pyromaniac', null);                     // burns feed the Pyromaniac too
          if (py && py.fireLeech) healUnit(st, null, srcU, Math.max(1, Math.round(dealt * py.fireLeech)));
        }
        if (isPctDot(s.kind)) {
          s.dealt += dot; s.ticks--;
          if (s.ticks <= 0) removeStatus(u, s);
          if (u.downed) break;
          continue;
        }
      }
      if (s.kind === 'hot') {
        if (s.ticks != null) {
          const srcU = s.srcUid ? st.units.find(x => x.uid === s.srcUid) : null;
          healUnit(st, srcU && !srcU.downed ? srcU : null, u, s.perTick || 1, { tick: true, noCleanse: true });
          healCleanse(st, u, 'dots', s.srcUid || null);   // every heal tick strips poison and bleed
          s.ticks--; if (s.ticks <= 0) removeStatus(u, s);
          continue;
        }
        healUnit(st, null, u, Math.max(1, Math.round((s.srcAtk || 8) * s.power)));
      }
      if (s.rounds != null) {
        if (s.fresh) { s.fresh = false; }        // first end-of-round: still active next round
        else {
          s.rounds--;
          if (s.rounds <= 0) {
            if (s.kind === 'share' && s.healAtEnd) healUnit(st, null, u, Math.max(1, Math.round(u.maxHp * s.healAtEnd)));
            if (s.kind === 'withering') u.statuses.push({ kind: 'witherImmune', rounds: 3 });
            if (s.kind === 'healcut') u.statuses.push({ kind: 'healcutImmune', rounds: 3 });
            removeStatus(u, s);
          }
        }
      }
    }
    if (u.untargetable > 0) { u.untargetable--; if (u.untargetable <= 0 && u.stealthRounds <= 0) u.stealth = false; }
  }
  checkEnd(st);
}

function removeStatus(u, s) {
  const i = u.statuses.indexOf(s);
  if (i >= 0) u.statuses.splice(i, 1);
  if (s.kind === 'form' && !u.statuses.some(x => x.kind === 'form')) u.form = null;
  if (s.kind === 'beastShape' && !u.statuses.some(x => x.kind === 'beastShape')) { const f = u.statuses.find(x => x.kind === 'form'); if (f) removeStatus(u, f); }
  if (s.kind === 'taunted' && s.srcUid) {
    const j = u.marksBy.indexOf(s.srcUid);
    if (j >= 0 && !u.statuses.some(x => x.kind === 'taunted' && x.srcUid === s.srcUid)) u.marksBy.splice(j, 1);
  }
}

function breakMomentum(u) {
  if (!u) return;
  u.momentumArmed = false;
  u.momentumStacks = 0;
  u.momentumTarget = null;
  u.consecutiveCount = 0;
}

function noteMomentumAttack(u) {
  const mo = perkVal(u.ch, 'momentum', null);
  if (!mo) return;
  if (u.momentumArmed) {
    u.momentumStacks = Math.min(mo.maxStacks, (u.momentumStacks || 0) + 1);
    u.consecutiveCount = (u.consecutiveCount || 0) + 1;
  } else {
    u.momentumStacks = 0;
    u.consecutiveCount = 1;
  }
  u.momentumArmed = true;
}

function meleeExtraCap(m) {
  const d = m && m.data;
  if (!d) return 0;
  if (d.id === 'cleave' || d.id === 'basic_attack') return 0;
  if (d.stun || d.critSecondAdjacent) return 0;
  if (d.cleaveRows || d.hitScale) return 0;
  if (d.elemental) return 0;
  if (!d.power || d.power <= 0) return 0;
  if (d.target === 'allEnemies' || d.target === 'enemyLane' || d.spreadLanes) return 0;
  if (!(d.melee || d.reach === 'front')) return 0;
  return m.tier === 'advanced' ? 3 : m.tier === 'intermediate' ? 2 : 1;
}

function fillMeleeExtras(st, targets, cap, side, attacker) {
  if (targets.length >= cap) return targets;
  const have = new Set(targets.map(x => x.uid));
  const foes = livingUnits(st, side).filter(x => !have.has(x.uid) && (!attacker || canMelee(st, attacker, x)));
  const prim = targets[0];
  foes.sort((a, b) => {
    const da = Math.abs(LANE_IDX[a.lane] - LANE_IDX[prim.lane]);
    const db = Math.abs(LANE_IDX[b.lane] - LANE_IDX[prim.lane]);
    return da - db;
  });
  for (const x of foes) {
    if (targets.length >= cap) break;
    targets.push(x);
  }
  return targets;
}

function feedSepticLeech(st, dealt, srcU, tgtU) {
  if (!(dealt > 0)) return;
  for (const unit of st.units) {
    if (unit.downed || unit.fled || unit.reserved) continue;
    const septic = perkVal(unit.ch, 'septic_sanguine', null);
    if (!septic || !septic.dotLeech) continue;
    const involved = unit === srcU || unit === tgtU;
    if (!septic.leechAny && !involved) continue;
    healUnit(st, null, unit, Math.max(1, Math.round(dealt * septic.dotLeech)));
  }
}

function offensiveDotVictims(st, u, tgt, skillId, o) {
  const pool = Combat.validTargets(st, u, skillId, true).filter(x => x.side !== u.side && !x.downed);
  if (!pool.length) return [];
  const mode = (o && o.target) || 'enemy';
  if (mode === 'allEnemies') return pool;
  if (mode === 'enemyLane') {
    const primary = tgt && pool.includes(tgt) ? tgt : pool[0];
    return pool.filter(x => x.lane === primary.lane);
  }
  if (tgt && pool.includes(tgt)) return [tgt];
  return [pool[0]];
}

function spreadSeptic(st, origin, status) {
  if (!st || !origin || !status || status._spread) return;
  if (status.kind !== 'bleed' && status.kind !== 'poison') return;
  const src = status.srcUid && st.units.find(x => x.uid === status.srcUid);
  if (!src || !perkVal(src.ch, 'septic_sanguine', null)) return;
  const li = LANE_IDX[origin.lane];
  const cand = livingUnits(st, origin.side).filter(o => {
    if (o.uid === origin.uid) return false;
    return Math.abs(LANE_IDX[o.lane] - li) <= 2;
  });
  if (!cand.length) return;
  cand.sort((a, b) => Math.abs(LANE_IDX[a.lane] - li) - Math.abs(LANE_IDX[b.lane] - li));
  const copy = Object.assign({}, status, { _spread: true, ticks: status.ticksTotal, dealt: 0 });
  addStatus(st, cand[0], copy);
}

// ---------------------------------------------------------------- actions
// action: {kind:'skill', skillId, targetUid, offensiveMode} | {kind:'flee'} | {kind:'attack', targetUid} | {kind:'hold'}
Combat.act = function (st, u, action) {
  u.planned = null;
  if (action.kind === 'hold') { breakMomentum(u); ev(st, { t: 'hold', uid: u.uid }); return { ok: true }; }
  if (action.kind === 'skill') {
    const pre = manifestFor(u, action.skillId);
    if (pre && pre.data && pre.data.passive) { ev(st, { t: 'use', uid: u.uid, skillId: action.skillId, tier: pre.tier, name: pre.data.name, target: u.uid }); return { ok: true }; }
  }
  if (action.kind === 'flee') return doFlee(st, u);
  if (action.kind === 'bribe') return doBribe(st, u, action);
  const skillId = action.kind === 'attack' ? 'basic_attack' : action.skillId;
  const m = manifestFor(u, skillId);
  if (!m) return { ok: false, error: 'unknown skill' };
  // Bind/Root Field seal: skills of the sealed tiers are unusable; the
  // universal Basic Attack never seals (no unit may be left without a move)
  if (skillId !== 'basic_attack') {
    const seal = u.statuses.find(x => x.kind === 'sealed');
    if (seal && (seal.tiers || []).includes(m.tier)) {
      ev(st, { t: 'sealedBlock', uid: u.uid, skillId });
      return { ok: false, error: 'sealed' };
    }
  }
  const d = Object.assign({}, m.data);
  const off = action.offensiveMode && d.offensive;
  const tgt = st.units.find(x => x.uid === action.targetUid) || u;
  if (d.freeAction && u.freeActionUsed) return { ok: false, error: 'already used a free action' };
  if (cooldownLeft(u, skillId) > 0) return { ok: false, error: 'recovering (' + cooldownLeft(u, skillId) + ')' };
  if (battleUseLimit(d) && !canSpendBattleUse(u, skillId, d)) return { ok: false, error: 'once per battle' };
  // Shock: cannot use interrupt skills
  if (d.interrupt && u.statuses.some(x => x.kind === 'shock')) return { ok: false, error: 'shocked' };
  // Flintlock Shot: you are holding an empty gun (Powder Discipline cancels it)
  if (d.reload && u.reloadLock[skillId] && !Sys().knownVal(u.ch, 'noReload')) {
    return { ok: false, error: 'needs reloading' };
  }
  // Iai Draw: one motion, sheath to sheath — the opening action only
  if (d.openerOnly && u.actedThisEncounter) return { ok: false, error: 'opening action only' };

  // witness: everyone on the field sees this use (registered for survivors at end)
  recordSighting(st, u, skillId, m.tier);

  ev(st, { t: 'use', uid: u.uid, skillId, tier: m.tier, name: off ? d.offensive.name : d.name, target: tgt.uid, offensive: !!off });
  // flush any first-sighting the player just got, so the beat lands after the blow
  if (st.__witnessPending && st.__witnessPending.length) {
    for (const w of st.__witnessPending) ev(st, { t: 'witness', skillId: w.skillId, tier: w.tier, from: w.from, uid: w.uid });
    st.__witnessPending = null;
  }

  // Countersign: a lane holding an interrupt negates the next enemy skill aimed at it
  if (skillId !== 'basic_attack' && tgt.side !== u.side) {
    const holder = laneUnits(st, tgt.side, tgt.lane).find(x => x.statuses.some(y => y.kind === 'countersign'));
    if (holder) {
      removeStatus(holder, holder.statuses.find(y => y.kind === 'countersign'));
      ev(st, { t: 'interrupted', uid: u.uid, by: holder.uid, skillId });
      return finishAction(st, u, skillId);
    }
  }
  // stealth bookkeeping: any non-silent hostile act breaks stealth
  if (tgt.side !== u.side && !d.silent && u.stealth) { u.stealth = false; u.stealthRounds = 0; }
  if (d.stealthOnUse) { u.stealth = true; u.stealthRounds = d.stealthRounds || 2; ev(st, { t: 'stealth', uid: u.uid }); }
  if (d.stealthOnKill) u.stealthOnKillPending = true;
  if (d.reflectImmuneNext) u.reflectImmuneNext = true;

  // ----- bespoke campaign effects (js/core/combat_effects.js) -----
  if (d.effect && Combat.EFFECTS && Combat.EFFECTS[d.effect]) {
    const r = Combat.EFFECTS[d.effect](Combat._internals, st, u, tgt, d, m);
    if (r !== undefined) return r;
    return finishAction(st, u, skillId);
  }
  // ----- generic status placements -----
  if (d.selfStatus) {
    const self = Object.assign({ tier: m.tier, srcUid: u.uid }, d.selfStatus);
    if (d.dmgTakenMult != null) self.dmgTakenMult = d.dmgTakenMult;
    addStatus(st, u, self);
    if (Combat.isShapeshift(skillId) && !u.form) applyForm(st, u, skillId, d.selfStatus.rounds || d.rounds || 3);
    if (!d.power) return finishAction(st, u, skillId);
  } else if (d.dmgTakenMult != null) {
    addStatus(st, u, { kind: 'takenReduce', dmgTakenMult: d.dmgTakenMult, rounds: d.rounds || 4, srcUid: u.uid });
  }
  if (d.partyStatus) { for (const x of livingUnits(st, u.side)) addStatus(st, x, Object.assign({ srcUid: u.uid }, d.partyStatus)); return finishAction(st, u, skillId); }
  if (d.allyStatus) { addStatus(st, tgt.side === u.side ? tgt : u, Object.assign({ srcUid: u.uid }, d.allyStatus)); return finishAction(st, u, skillId); }
  if (d.laneStatus) { for (const x of laneUnits(st, u.side, u.lane)) addStatus(st, x, Object.assign({ srcUid: u.uid }, d.laneStatus)); return finishAction(st, u, skillId); }
  if (d.hazard) {
    const h = d.hazard;
    const side = h.on === 'allyLane' ? u.side : tgt.side;
    const lane = h.on === 'allyLane' ? (tgt.side === u.side ? tgt.lane : u.lane) : tgt.lane;
    st.hazards = st.hazards.filter(x => !(x.side === side && x.lane === lane && x.kind === h.kind));
    st.hazards.push({ side, lane, kind: h.kind, power: h.power * C().TIER_MULT[m.tier], heal: !!h.heal, rounds: h.rounds || 3, fresh: true, srcUid: u.uid, srcAtk: Ch().effStat(u.ch, 'atk') });
    ev(st, { t: 'hazard', side, lane, kind: h.kind });
    // a druid's healing terrain also lays the heal-over-time and thorn shield on the lane (A3)
    if (d.archetype === 'druid' && d.heal && h.heal) {
      for (const t of laneUnits(st, side, lane)) if (!t.downed) applyDruidHeal(st, u, t, m.tier, healPct(st, u, t, skillId, m.tier, d));
    }
    return finishAction(st, u, skillId);
  }

  if (skillId === 'true_rest') {
    // Jiro is undead but no longer animated by the working that raised him
    // (add-on §2a): True Rest has nothing to switch off.
    if (tgt.ch.trueRestImmune) { ev(st, { t: 'immune', uid: tgt.uid, kind: 'trueRest' }); return finishAction(st, u, skillId); }
    if (tgt.ch.isUndead) {
      tgt.chp = 0; tgt.downed = true;
      ev(st, { t: 'trueRest', uid: tgt.uid });
      onUnitDown(st, tgt); checkEnd(st);
    }
    return finishAction(st, u, skillId);
  }

  // ----- healing family -----
  if (d.heal && !off) {
    const atk = Ch().effStat(u.ch, 'atk');
    const restores = !!(d.power || d.hotRounds || d.healFromTaken);
    const druid = d.archetype === 'druid';
    if (cooldownLeft(u, skillId) > 0) return { ok: false, error: 'recovering (' + cooldownLeft(u, skillId) + ')' };
    // percentage of each target's max HP (Part A1); the flare and Clan Blood still shape it
    const pctOf = (t) => {
      let a = healPct(st, u, t, skillId, m.tier, d);
      if (m.flare && m.flare.healMult) a = Math.round(a * m.flare.healMult);
      if (d.healFromTaken) a = Math.max(1, Math.round((u.damageTaken || 0) * d.healFromTaken));
      return a;
    };
    let targets = d.target === 'party' ? livingUnits(st, u.side)
      : d.target === 'allyLane' ? laneUnits(st, u.side, tgt.lane)
      : (restores ? pickHealTargets(st, u, tgt, m.tier) : [tgt]);
    // Breath of the Bell: only those who have not moved yet this round
    if (d.unactedOnly) targets = targets.filter(x => !x.attackedThisRound);
    // Clan Blood's share of damage-taken is applied inside pctOf
    if (d.healBehind) targets = targets.filter(x => canHealOther(u, x));
    else if (d.wardAhead) targets = targets.filter(x => canWard(u, x));
    if (d.revive && !d.selfRevive && (tgt.downed || downedAllies(st, u.side).length)) {
      if (!canSpendBattleUse(u, skillId, d)) return { ok: false, error: 'once per battle' };
      const picks = pickReviveTargets(st, u.side, tgt, d.reviveCount || 1);
      if (!picks.length) return { ok: false, error: 'no fallen allies' };
      spendBattleUse(u, skillId);
      for (const t of picks) applyRevive(st, u, t, d, skillId);
      return finishAction(st, u, skillId);
    }
    for (const t of targets) {
      if (t.downed) continue;
      let amt = restores ? pctOf(t) : 0;
      if (d.doubleBelow && (t.chp / t.maxHp) < d.doubleBelow) amt *= 2;
      if (d.fullHealBelow && (t.chp / t.maxHp) < d.fullHealBelow) amt = t.maxHp;
      if (d.shieldHits) { addStatus(st, t, { kind: 'ward', hits: d.shieldHits, reflect: !!d.wardReflect }); continue; }
      if (d.shieldRounds) { addStatus(st, t, { kind: 'ward', rounds: d.shieldRounds, hits: 999, reflect: !!d.wardReflect, all: !!d.wardAll }); continue; }
      if (d.purifyRounds && !d.power) { addStatus(st, t, { kind: 'purified', rounds: d.purifyRounds }); continue; }
      if (d.grantEvade) t.evade += d.grantEvade;
      // Field Suture: closed up and put somewhere nobody is looking
      if (d.allyStealth) { t.stealth = true; t.stealthRounds = d.allyStealth; ev(st, { t: 'stealth', uid: t.uid }); }
      // Paper Charm: the ward answers with poison
      if (d.wardPoison) addStatus(st, t, { kind: 'charmWard', tier: m.tier, power: d.wardPoison.power, rounds: d.wardPoison.rounds });
      // Signal Flags: this ally moves the moment you are done
      if (d.grantTurn && t !== u && !t.grantedTurns) Combat.grantTurn(st, u, t, d.grantTurn);
      // Surgeon's Saw: it works, and they will bleed for a while
      if (d.selfBleedOnTarget) addStatus(st, t, { kind: 'bleed', tier: m.tier, power: d.selfBleedOnTarget.power, rounds: d.selfBleedOnTarget.rounds, srcAtk: atk, srcUid: u.uid });
      // Regeneration (A2): double the tier value over 5 ticks; refreshes, never stacks; 3-turn cooldown
      if (d.hotRounds) {
        healCleanse(st, t, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
        const old = t.statuses.find(x => x.kind === 'hot' && x.regen);
        if (old) removeStatus(t, old);
        addStatus(st, t, { kind: 'hot', regen: true, ticks: REGEN_TICKS, perTick: Math.max(1, Math.round(amt * 2 / REGEN_TICKS)), srcUid: u.uid, tier: m.tier });
        u.cooldowns = u.cooldowns || {}; u.cooldowns[skillId] = REGEN_COOLDOWN;
        continue;
      }
      // Druid heals (A3): the same total over 3 ticks, plus a thorn shield that absorbs and reflects
      if (druid && amt > 0) { applyDruidHeal(st, u, t, m.tier, amt); continue; }
      if (d.cureCount) {
        let cured = 0;
        for (const s of t.statuses.slice()) {
          if (NEG_STATUSES.includes(s.kind) && cured < d.cureCount) { removeStatus(t, s); cured++; }
        }
        if (!cured && amt <= 0) continue;
      }
      if (d.cures) for (const kind of d.cures) { const s = t.statuses.find(x => x.kind === kind); if (s) removeStatus(t, s); }
      if (amt > 0) {
        healCleanse(st, t, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
        healUnit(st, u, t, amt, { noCleanse: true });
      }
    }
    return finishAction(st, u, skillId);
  }

  // ----- offensive modes of healing skills -----
  if (off) {
    const o = d.offensive;
    const atk = Ch().effStat(u.ch, 'atk');
    const tierMult = C().TIER_MULT[m.tier];
    if (o.statusTransfer) {
      const mine = u.statuses.find(s => DOT_STATUSES.includes(s.kind));
      if (mine) { removeStatus(u, mine); addStatus(st, tgt, reseatDot(Object.assign({}, mine), tgt)); }
      else dealDamage(st, u, tgt, Math.max(1, Math.round(atk * 1.0 * tierMult) - Ch().effStat(tgt.ch, 'def')), 'spell');
      return finishAction(st, u, skillId);
    }
    if (o.dotRounds) {
      const victims = offensiveDotVictims(st, u, tgt, skillId, o);
      for (const v of victims) {
        addStatus(st, v, { kind: 'poison', tier: m.tier, rounds: o.dotRounds, power: o.power, srcAtk: atk, srcUid: u.uid });
      }
      return finishAction(st, u, skillId);
    }
    if (o.wardReflect) {
      addStatus(st, tgt, { kind: 'ward', hits: 1, reflect: true });
      return finishAction(st, u, skillId);
    }
    if (o.healReduction) {
      addStatus(st, tgt, { kind: 'healcut', rounds: 3, pct: o.healReduction });
    }
    if (o.power) {
      const dmg = computeDamage(st, u, tgt, m, { power: o.power });
      const dealt = dealDamage(st, u, tgt, dmg, 'spell');
      if (o.lifeSteal) healUnit(st, null, u, Math.round(dealt * o.lifeSteal));
    }
    return finishAction(st, u, skillId);
  }

  // ----- blood pact: damage + heal same amount (§3a) -----
  if (d.dualHeal) {
    const targets = d.target === 'enemyLane' ? laneUnits(st, tgt.side, tgt.lane) : [tgt];
    let total = 0;
    for (const t of targets) {
      const dmg = computeDamage(st, u, t, m);
      total += dealDamage(st, u, t, dmg, 'spell');
    }
    const allies = livingUnits(st, u.side).sort((x, y) => (x.chp / x.maxHp) - (y.chp / y.maxHp));
    const healTargets = d.healTargets === 'party' ? allies : allies.slice(0, d.healTargets || 1);
    for (const a of healTargets) {
      const amt = Math.round(total / Math.max(1, healTargets.length));
      healCleanse(st, a, d.archetype === 'healer' ? healerCleanseScope(m.tier) : 'dots', u.uid);
      healUnit(st, u, a, amt, { noCleanse: true });
    }
    return finishAction(st, u, skillId);
  }

  // ----- self buffs / guards -----
  if (d.guardScope) {
    addStatus(st, u, {
      kind: 'guard', scope: d.guardScope, rounds: d.guardRounds || 3,
      absorb: d.guardAbsorb != null ? d.guardAbsorb : 0.5,
    });
    return finishAction(st, u, skillId);
  }
  if (d.thornPct) {
    const targets = d.thornScope === 'party' ? livingUnits(st, u.side)
      : d.thornScope === 'lane' ? laneUnits(st, u.side, u.lane) : [u];
    for (const t of targets) addStatus(st, t, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 3 });
    return finishAction(st, u, skillId);
  }
  if (d.atkMult) {
    if (d.freeBuff) applyBeastShape(st, u, m, skillId);
    else {
      addStatus(st, u, { kind: 'atkBuff', mult: d.atkMult, rounds: d.rounds || 3 });
      if (d.lifeSteal) addStatus(st, u, { kind: 'lifesteal', pct: d.lifeSteal, rounds: d.rounds || 3 });
    }
    return finishAction(st, u, skillId);
  }
  if (d.auraAtk) {
    for (const t of livingUnits(st, u.side)) addStatus(st, t, { kind: 'aura', atk: d.auraAtk, def: d.auraDef, evadePct: d.auraEvade, rounds: d.rounds || 3 });
    return finishAction(st, u, skillId);
  }
  if (d.evadeNext) { addStatus(st, u, { kind: 'evadeS' }); u.evade += d.evadeNext; return finishAction(st, u, skillId); }
  if (d.untargetableRounds) {
    u.untargetable += d.untargetableRounds;
    if (d.freeStrike && tgt && tgt.side !== u.side) {
      const dmg = computeDamage(st, u, tgt, m, { power: 2.0 });
      dealDamage(st, u, tgt, dmg, 'attack');
    }
    return finishAction(st, u, skillId);
  }
  if (d.counterNext) {
    u.counter += d.counterNext;
    if (d.thornPct) addStatus(st, u, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 1 });
    return finishAction(st, u, skillId);
  }
  // ---- ninja/pirate party and lane states (add-on §3) ----
  if (d.partyStatus && !d.heal) {
    for (const t of livingUnits(st, u.side)) {
      if (d.partyStatus.elemGuard) addStatus(st, t, { kind: 'elemGuard', mult: d.partyStatus.elemGuard.mult, rounds: d.partyStatus.elemGuard.rounds });
      if (d.partyStatus.volley) addStatus(st, t, { kind: 'volley', extra: d.partyStatus.volley.extra, rounds: d.partyStatus.volley.rounds });
    }
    ev(st, { t: 'status', uid: u.uid, kind: 'party' });
    return finishAction(st, u, skillId);
  }
  if (d.laneStatus && d.laneStatus.closed) {
    const R = d.laneStatus.closed.rounds;
    for (const t of laneUnits(st, u.side, u.lane)) {
      addStatus(st, t, { kind: 'closed', rounds: R });
      if (d.laneAllyGuard && t !== u) addStatus(st, t, { kind: 'laneGuard', mult: d.laneAllyGuard, rounds: R });
    }
    if (d.immovable) addStatus(st, u, { kind: 'immovable', rounds: R });
    ev(st, { t: 'status', uid: u.uid, kind: 'closed' });
    return finishAction(st, u, skillId);
  }
  if (d.pullAttacker) {
    addStatus(st, u, { kind: 'guard', scope: d.guardScope || 'self', rounds: d.rounds || 2 });
    addStatus(st, u, { kind: 'railGuard', rounds: d.rounds || 2 });
    if (d.thornPct) addStatus(st, u, { kind: 'thorns', pct: d.thornPct, rounds: d.rounds || 2 });
    return finishAction(st, u, skillId);
  }

  // ----- taunt -----
  if (d.marks != null) {
    const allFoes = livingUnits(st, tgt.side);
    const list = d.marks === 'all' ? allFoes
      : d.marks === 'lane' ? laneUnits(st, tgt.side, tgt.lane)
      : (tgt ? [tgt].concat(allFoes.filter(f => f !== tgt)).slice(0, d.marks) : allFoes.slice(0, d.marks));
    for (const f of list) {
      if (!f.marksBy.includes(u.uid)) f.marksBy.push(u.uid);
      // timed mark: expires via the status clock, then unhooks from marksBy
      const existing = f.statuses.find(x => x.kind === 'taunted' && x.srcUid === u.uid);
      if (existing) existing.rounds = d.markRounds || 3;
      else f.statuses.push({ kind: 'taunted', srcUid: u.uid, rounds: d.markRounds || 3 });
      ev(st, { t: 'taunted', uid: f.uid, by: u.uid });
    }
    return finishAction(st, u, skillId);
  }

  // ----- damaging actives & basic attack -----
  let targets = [tgt];
  if (d.cleaveRows) {
    const rows = d.cleaveRows;
    const li = LANE_IDX[tgt.lane];
    targets = livingUnits(st, tgt.side).filter(x => Math.abs(LANE_IDX[x.lane] - li) < rows && canMelee(st, u, x));
  } else if (d.spreadLanes) {
    const li = LANE_IDX[tgt.lane];
    targets = livingUnits(st, tgt.side).filter(x => Math.abs(LANE_IDX[x.lane] - li) <= 1);
  } else if (d.target === 'enemyLane') targets = laneUnits(st, tgt.side, tgt.lane);
  else if (d.target === 'allEnemies') targets = livingUnits(st, tgt.side);
  else if (d.multiTarget) {
    const foes = livingUnits(st, tgt.side).filter(x => x !== tgt);
    targets = [tgt].concat(foes.slice(0, d.multiTarget - 1));
  } else if (d.adjacent) {
    const laneMates = laneUnits(st, tgt.side, tgt.lane).filter(x => x !== tgt);
    targets = [tgt].concat(laneMates.slice(0, d.adjacent));
  }
  if (d.pierceBehind) {
    const laneOrder = ['front', 'mid', 'back'];
    const behindLane = laneOrder[laneOrder.indexOf(tgt.lane) + 1];
    if (behindLane) {
      const behind = laneUnits(st, tgt.side, behindLane)[0];
      if (behind) targets.push(behind);
    }
  }
  const af = perkVal(u.ch, 'arcane_focus', null);
  if (af && af.splashAdjacent && d.elemental && targets.length === 1) {
    const extra = laneUnits(st, tgt.side, tgt.lane).find(x => x !== tgt);
    if (extra) targets.push(extra);
  }
  // Chain Lightning (campaign): jumps to every enemy, losing power each jump
  if (d.chainDecay) targets = [tgt].concat(livingUnits(st, tgt.side).filter(x => x !== tgt));
  // Primal Form: splash one more enemy in the same lane
  const shape = u.statuses.find(x => x.kind === 'beastShape');
  if (shape && shape.splashAdjacent && targets.length === 1) {
    const extra = laneUnits(st, tgt.side, tgt.lane).find(x => x !== tgt);
    if (extra) targets.push(extra);
  }
  // Storm Shape: attacks also hit one enemy in an adjacent lane
  if (u.statuses.some(x => x.kind === 'storm') && targets.length === 1) {
    const li = LANE_IDX[tgt.lane];
    const extra = livingUnits(st, tgt.side).find(x => x !== tgt && Math.abs(LANE_IDX[x.lane] - li) === 1);
    if (extra) targets.push(extra);
  }
  // spells: elemental, or ranged non-katana. attacks: melee & katana (these
  // trigger guards/thorns/counters; both feed Taunt retaliation).
  const isSpell = d.elemental || (d.reach === 'any' && !d.katana && !d.melee);
  const tag = isSpell ? 'spell' : 'attack';
  const isMelee = !isSpell;                      // §0d: every melee skill applies Exposed
  u.attackedThisRound = true;
  if (isSpell) u.castsThisBattle++;
  if (d.laneStreakScale) { if (u.laneStreak.lane === tgt.lane) u.laneStreak.n++; else u.laneStreak = { lane: tgt.lane, n: 0 }; }
  if (d.randomElemental) {
    const pick = st.rng.pick(['burn', 'frozen', 'shocked']);
    d.status = Object.assign({}, d.status, pick === 'burn' ? { burn: { power: 0.8, rounds: 2 } } : {});
    if (pick === 'frozen') d.freeze = 1;
    if (pick === 'shocked') { d.shock = 0.1; d.shockRounds = 2; }
  }
  const hits = d.hits || 1;
  const aoe = !!(d.cleaveRows || d.hitScale || d.target === 'allEnemies' || d.target === 'enemyLane'
    || d.spreadLanes || (d.multiTarget && d.multiTarget > 1));
  const flareHits = aoe ? 0 : ((m.flare && (m.flare.bonusHits || m.flare.extraHit)) || 0);
  const flareHitMult = m.flare && (m.flare.hitPowerMult || m.flare.extraHitMult);
  if (d.reload) u.reloadLock[skillId] = true;             // Flintlock Shot is now empty
  // Volley Fire / Broadside Doctrine: one more body in the same lane
  const vol = u.statuses.find(x => x.kind === 'volley');
  const bsd = perkVal(u.ch, 'broadside_doctrine', 'rangedExtraTarget');
  const extraTargets = (vol ? vol.extra : 0) + ((bsd && isSpell) ? bsd : 0);
  if (extraTargets > 0 && targets.length) {
    const li = LANE_IDX[targets[0].lane];
    const more = livingUnits(st, targets[0].side)
      .filter(x => !targets.includes(x) && LANE_IDX[x.lane] === li)
      .slice(0, extraTargets);
    if (more.length) targets = targets.concat(more);
    if (vol) removeStatus(u, vol);
  }
  const meleeCap = meleeExtraCap(m);
  if (meleeCap > 1) targets = fillMeleeExtras(st, targets, meleeCap, tgt.side, u);
  // Taunt: marked attackers dump only on the marker — no splash onto the back line.
  if (u.marksBy.length) {
    const locked = targets.filter(t => u.marksBy.includes(t.uid));
    if (locked.length) targets = locked;
  }
  noteMomentumAttack(u);
  const hitScale = (d.hitScale && targets.length) ? (1 + (targets.length - 1) * 0.5) : 1;
  const felled = new Set();
  for (let hi = 0; hi < hits + flareHits; hi++) {
    let wave = targets;
    if (d.critSecondAdjacent && hi === 1) {
      noteMomentumAttack(u);
      const adj = pickAdjacentFoe(st, tgt);
      wave = [adj || tgt];
    }
    for (const t of wave) {
    if (t.downed || felled.has(t.uid)) continue;
    if (d.chainDecay && targets.indexOf(t) > 0) { /* decayed power handled below */ }
    if (d.oneShotUndead && t.ch && (t.ch.isUndead || t.ch.isMonster && t.ch.undead)) {
      applyRawDamage(st, u, t, Math.max(t.chp, 1), 'spell');
      continue;
    }
    if (d.instantKillIfMaxHp && (t.maxHp || 0) > d.instantKillIfMaxHp) {
      ev(st, { t: 'godJudgment', uid: t.uid, by: u.uid, who: u.ch.campaignId || u.ch.enemyTypeId, targetName: t.ch.name, skillId });
      t.chp = 0; t.tempHp = 0; t.downed = true;
      ev(st, { t: 'execute', uid: t.uid, by: u.uid, skillId });
      onUnitDown(st, t); checkEnd(st);
      continue;
    }
    // Executes
    if (d.executeBelow && (t.chp + t.tempHp) / t.maxHp < d.executeBelow && !t.ch.boss) {
      t.chp = 0; t.tempHp = 0; t.downed = true;
      ev(st, { t: 'execute', uid: t.uid, by: u.uid, skillId });
      onUnitDown(st, t); checkEnd(st);
      if (!t.downed) continue;
      if (d.healOnKillPct) healUnit(st, null, u, Math.round(u.maxHp * d.healOnKillPct));
      if (d.permStatGain) {
        for (const k of ['hp', 'atk', 'def', 'spd']) u.ch.bonusStats[k] = (u.ch.bonusStats[k] || 0) + d.permStatGain;
        u.maxHp = Ch().maxHp(u.ch);
        ev(st, { t: 'permGain', uid: u.uid });
      }
      continue;
    }
    const powerOverride = d.chainDecay ? (d.power || 2.0) * Math.pow(d.chainDecay, targets.indexOf(t)) : undefined;
    const flarePower = (hi >= hits && flareHitMult) ? (d.power || 0) * flareHitMult : undefined;
    let dmg = computeDamage(st, u, t, m, flarePower != null ? { power: flarePower }
      : (powerOverride != null ? { power: powerOverride } : undefined));
    if (hitScale > 1) dmg *= hitScale;
    if (d.critSecondAdjacent && hi === 1 && t !== tgt) dmg *= 2;
    const dealt = dealDamage(st, u, t, dmg, tag, { element: d.element, melee: isMelee,
      cannotMiss: !!d.cannotMiss || !!(Sys().knownVal(u.ch, 'accuracy') && u.momentumArmed), ignoreGuards: !!d.ignoreGuards, noReflect: !!d.noReflect,
      noExecute: hi >= hits });
    for (let ei = st.events.length - 1; ei >= 0 && ei >= st.events.length - 8; ei--) {
      if (st.events[ei].t === 'down' && st.events[ei].uid === t.uid) { felled.add(t.uid); break; }
    }
    if (isMelee && !t.downed) addExposed(st, t, 1);
    // ---- ninja/pirate on-hit riders (add-on §3) ----
    if (dealt > 0 && !t.downed) {
      if (d.reactionLock) addStatus(st, t, { kind: 'reactionLock', rounds: d.reactionLock });
      if (d.pull) Combat.pullForward(st, t, d.pull);
      if (d.rootRounds) addStatus(st, t, { kind: 'rooted', rounds: d.rootRounds });
      if (d.exposedOnSecond && hi === 1) addExposed(st, t, d.exposedOnSecond);
      const vt = u.statuses.find(x => x.kind === 'venomTouch');          // Fox Form
      if (vt) addStatus(st, t, { kind: 'poison', tier: vt.tier || 'basic', power: vt.power, rounds: vt.dot.rounds, stacks: true, srcAtk: Ch().effStat(u.ch, 'atk'), srcUid: u.uid });
      const ot = u.statuses.find(x => x.kind === 'openingTouch');        // Marine Form
      if (ot) addExposed(st, t, ot.stacks);
    }
    if (dealt > 0 && !t.downed && d.stripGuards) {
      for (const x of t.statuses.slice()) if (x.kind === 'guard' || x.kind === 'ward' || x.kind === 'warhound') removeStatus(t, x);
      t.armorBonus = 0; ev(st, { t: 'sundered', uid: t.uid });
    }
    if (dealt > 0 && !t.downed && d.stealBuff) {
      const b = t.statuses.find(x => POS_STATUSES.includes(x.kind));
      if (b) { removeStatus(t, b); addStatus(st, u, Object.assign({}, b)); ev(st, { t: 'stolen', uid: t.uid, by: u.uid, kind: b.kind }); }
    }
    if (dealt > 0 && !t.downed && d.silence) addStatus(st, t, { kind: 'sealed', tiers: ['basic', 'intermediate', 'advanced'], rounds: d.silence });
    if (dealt > 0 && !t.downed && d.withering) addStatus(st, t, { kind: 'withering', rounds: d.withering });
    if (dealt > 0 && !t.downed && d.healcutRounds) addStatus(st, t, { kind: 'healcut', rounds: d.healcutRounds, pct: 0.5 });
    if (dealt > 0 && !t.downed && d.runic) { t.evade = 0; addStatus(st, t, { kind: 'runic', rounds: 2, srcUid: u.uid }); }
    if (dealt > 0 && !t.downed) { const sp = u.statuses.find(x => x.kind === 'serpent'); if (sp) addStatus(st, t, { kind: 'poison', tier: sp.tier || 'basic', power: 0.6, rounds: 3, stacks: true, srcAtk: Ch().effStat(u.ch, 'atk'), srcUid: u.uid }); }
    if (dealt > 0 && u.statuses.some(x => x.kind === 'storm') && !t.downed) addStatus(st, t, { kind: 'shock', rounds: 1 });
    if (d.selfWardPct && dealt > 0) addStatus(st, u, { kind: 'ward', hits: 1, pool: Math.round(dealt * d.selfWardPct) });
    if (d.laneBuff) for (const x of laneUnits(st, u.side, u.lane)) addStatus(st, x, Object.assign({}, d.laneBuff));
    if (d.reveal) st.revealNext = true;
    if (d.immovable) addStatus(st, u, { kind: 'immovable', rounds: (d.selfStatus && d.selfStatus.rounds) || d.rounds || 4 });
    if (d.selfRoot) addStatus(st, u, { kind: 'rooted', rounds: d.rounds || 2 });
    if (d.onHitPoison) addStatus(st, u, { kind: 'venomTouch', power: d.onHitPoison.power, rounds: d.onHitPoison.rounds + 2, dot: d.onHitPoison });
    if (d.onHitExposed) addStatus(st, u, { kind: 'openingTouch', stacks: d.onHitExposed, rounds: 4 });
    if (d.revealIntents) st.revealIntents = Math.max(st.revealIntents || 0, d.revealIntents);
    if (d.revealGold) st.revealGold = true;
    // Momentum advanced: every third consecutive attacking turn strikes twice
    // (single-target only — whirlwinds already scale with bodies hit)
    const mo = perkVal(u.ch, 'momentum', null);
    if (mo && mo.thirdHitTwice && u.consecutiveCount % 3 === 0 && !t.downed && targets.length === 1 && hitScale <= 1) {
      let extra = computeDamage(st, u, t, m);
      if (hitScale > 1) extra *= hitScale;
      dealDamage(st, u, t, extra, tag, { element: d.element, melee: isMelee,
        cannotMiss: !!d.cannotMiss || !!(Sys().knownVal(u.ch, 'accuracy') && u.momentumArmed), ignoreGuards: !!d.ignoreGuards, noReflect: !!d.noReflect });
    }
    // riders
    if (d.status && dealt > 0) {
      for (const [kind, sdef] of Object.entries(d.status)) {
        addStatus(st, t, Object.assign({ kind, tier: m.tier, srcAtk: Ch().effStat(u.ch, 'atk'), srcLevel: m.level, srcUid: u.uid }, sdef));
      }
      // A killing blow still leaves its poison on the corpse so it can leap.
      if (t.downed) hopPoison(st, t);
    }
    if ((d.freeze || d.stun) && !t.downed) addStatus(st, t, { kind: 'frozen', skips: d.freeze || d.stun });
    if (d.shock && !t.downed) addStatus(st, t, { kind: 'shocked', pct: d.shock, rounds: d.shockRounds || 3 });
    if (d.seal && !t.downed) addStatus(st, t, { kind: 'sealed', tiers: d.seal.slice(), rounds: d.sealRounds || 2 });
    if (d.defStrip && !t.downed) { t.defStripped = Math.max(t.defStripped || 0, d.defStrip); ev(st, { t: 'sundered', uid: t.uid }); }
    if (d.defStripAll && !t.downed) { t.defStripped = 999; ev(st, { t: 'sundered', uid: t.uid }); }
    if (d.delayTarget && !t.downed) { t.delayed += 4; ev(st, { t: 'delayed', uid: t.uid }); }
    if (d.loseAction && !t.downed) { t.loseNextAction = true; ev(st, { t: 'bound', uid: t.uid }); }
    const ls = u.statuses.find(s => s.kind === 'lifesteal');
    if (ls && dealt > 0) healUnit(st, null, u, Math.round(dealt * ls.pct));
    const bs = u.statuses.find(s => s.kind === 'beastShape');
    if (bs && bs.lifeSteal && dealt > 0) healUnit(st, null, u, Math.round(dealt * bs.lifeSteal));
    // Finisher-like heal riders on damage
    if (d.lifeSteal && dealt > 0) healUnit(st, null, u, Math.round(dealt * d.lifeSteal));
    if (hi === 0 && dealt > 0) applyFlareOnHit(st, u, t, m);
    }
  }
  return finishAction(st, u, skillId);
}

function applyFlareOnHit(st, u, t, m) {
  const f = m && m.flare;
  if (!f || !t || t.downed) return;
  const atk = Ch().effStat(u.ch, 'atk');
  if (f.poison) addStatus(st, t, { kind: 'poison', tier: m.tier, power: f.poison.power, rounds: f.poison.rounds, stacks: true, srcAtk: atk, srcUid: u.uid });
  if (f.bleed) addStatus(st, t, { kind: 'bleed', tier: m.tier, power: f.bleed.power, rounds: f.bleed.rounds, stacks: true, srcAtk: atk, srcUid: u.uid });
  if (f.rootRounds) addStatus(st, t, { kind: 'rooted', rounds: f.rootRounds });
  if (f.defStrip) { t.defStripped = Math.max(t.defStripped || 0, f.defStrip); ev(st, { t: 'sundered', uid: t.uid }); }
}

function applyFlareSelf(st, u, m) {
  const f = m && m.flare;
  if (!f) return;
  if (f.guardRounds) addStatus(st, u, { kind: 'guard', scope: 'self', rounds: f.guardRounds });
  if (f.markStorm) u.stormMark = Math.max(u.stormMark || 0, f.markStorm);
  if (f.thornPct) addStatus(st, u, { kind: 'thorns', pct: f.thornPct, rounds: f.thornRounds || 2 });
}

function finishAction(st, u, skillId) {
  const m = skillId && skillId !== 'basic_attack' ? manifestFor(u, skillId) : null;
  if (skillId !== 'basic_attack' && m && m.data && !(m.data.power > 0) && !m.data.hitScale && !m.data.cleaveRows) {
    breakMomentum(u);
  }
  applyFlareSelf(st, u, m);
  if (m && m.data && m.data.cooldown) {
    u.cooldowns = u.cooldowns || {};
    u.cooldowns[skillId] = m.data.cooldown;
  }
  const freeBuff = !!(m && m.data && m.data.freeBuff);
  const freeAction = !!(m && m.data && m.data.freeAction) && !u.freeActionUsed;
  if (freeAction) u.freeActionUsed = true;
  const free = freeBuff || freeAction;
  if (!free) u.actedThisEncounter = true;
  if (!freeBuff && skillId && skillId !== 'basic_attack') {
    const lv = Sys().recordUse(u.ch, skillId);
    if (lv) ev(st, { t: 'levelUp', uid: u.uid, skillId, level: lv.level, tier: lv.tier });
  }
  if (free || u.refundAction) {
    u.refundAction = false;
    ev(st, { t: 'refund', uid: u.uid });
    return { ok: true, refund: true };
  }
  return { ok: true };
}

// Charm's battlefield bribe (request 6): pay a hostile named enemy to walk.
// The fee is spent whether they take it or not; heroes, conscripts and the
// undead cannot be bought. Fee/chance are computed by Game.bribeOffer.
function doBribe(st, u, action) {
  const tgt = st.units.find(x => x.uid === action.targetUid);
  if (!tgt || tgt.downed || tgt.fled) return { ok: false, error: 'no target' };
  const fee = action.fee || 0;
  if ((u.ch.inventory.gold || 0) < fee) return { ok: false, error: 'cannot afford the bribe' };
  u.ch.inventory.gold -= fee;
  tgt.ch.inventory.gold = (tgt.ch.inventory.gold || 0) + fee;
  const success = st.rng.chance(action.chance || 0.5);
  ev(st, { t: 'bribe', uid: u.uid, target: tgt.uid, fee, success });
  if (success) {
    if (Sys().knownVal(u.ch, 'recruitForEncounter')) {
      tgt.side = u.side;
      tgt.ch.recruitedThisEncounter = true;
      ev(st, { t: 'recruit', uid: tgt.uid, by: u.uid });
    } else tgt.fled = true;
    checkEnd(st);
  }
  return { ok: true, success, fee };
}

function doFlee(st, u) {
  const foes = livingUnits(st, u.side === 'a' ? 'b' : 'a');
  const fastest = Math.max(...foes.map(f => Ch().effStat(f.ch, 'spd')), 0);
  let p = C().FLEE_BASE + (Ch().effStat(u.ch, 'spd') - fastest) * C().FLEE_PER_SPD;
  // rogues' instincts: Opportunist and Sneak make getting out drastically likelier
  const fleeB = Sys().knownSum(u.ch, 'fleeBonus');
  if (fleeB) p += fleeB;
  p = Math.max(C().FLEE_MIN, Math.min(C().FLEE_MAX, p));
  // conscripts/undead/heroes cannot flee (§15a)
  if (u.ch.isConscript || u.ch.isUndead || (u.ch.status === 'hero' && u.ch.grantsHeld)) {
    ev(st, { t: 'fleeBlocked', uid: u.uid });
    return { ok: true, fled: false };
  }
  let success = st.rng.chance(p);
  if (!success && Sys().knownVal(u.ch, 'autoFlee') && !u.ch.__fallbackUsed) { success = true; u.ch.__fallbackUsed = true; }
  ev(st, { t: 'flee', uid: u.uid, success, chance: p });
  if (success) { u.fled = true; noteLeaderOut(st, u, false); checkEnd(st); }
  return { ok: true, fled: success };
}

// -------------------------------------------------------- sighting/witness
function recordSighting(st, user, skillId, tier) {
  const sk = SK()[skillId];
  if (!sk || sk.universal || sk.unique) return;
  const teacher = (user && user.ch && user.ch.name) || '';
  for (const u of st.units) {
    if (u === user || u.reserved) continue;
    if (!u.witnessedHere.some(w => w.skillId === skillId && w.tier === tier)) {
      u.witnessedHere.push({ skillId, tier, from: teacher });
      // The player learns by being shown. That moment is the whole hook, so it
      // gets announced live instead of being banked silently until the fight
      // ends — the UI drains this right after the 'use' beat.
      if (u.ch && u.ch.isPlayer && !ADV.SkillSys.isWitnessed(u.ch, skillId)) {
        st.__witnessShown = st.__witnessShown || 0;
        if (st.__witnessShown < 2) {
          st.__witnessPending = st.__witnessPending || [];
          if (!st.__witnessPending.some(w => w.skillId === skillId)) {
            st.__witnessShown++;
            st.__witnessPending.push({ skillId, tier, from: teacher, uid: user.uid });
          }
        }
      }
    }
  }
}

// Called by the quest layer when the encounter resolves: survivors register sightings.
// Survival, not consciousness: downed-but-alive still witnessed everything (§3).
Combat.registerWitnesses = function (st) {
  const out = [];
  for (const u of st.units) {
    if (u.fled && u.witnessedHere.length === 0) continue;
    if (u.ch.isMonster && u.downed) continue;              // dead monsters learn nothing
    if (u.downed && !u.survivor) { /* downed units survive if their side didn't wipe — handled by caller flag */ }
    for (const w of u.witnessedHere) {
      const before = ADV.SkillSys.isWitnessed(u.ch, w.skillId);
      ADV.SkillSys.witness(u.ch, w.skillId, w.tier, w.from);
      if (!before && u.ch.isPlayer) out.push(w);
    }
  }
  return out;
};

// ---------------------------------------------------------------- end check
function checkEnd(st) {
  if (st.over) return;
  const a = livingUnits(st, 'a').length + st.units.filter(u => u.side === 'a' && u.reserved && !u.downed && !u.fled).length;
  const b = livingUnits(st, 'b').length + st.units.filter(u => u.side === 'b' && u.reserved && !u.downed && !u.fled).length;
  // Combat ends only when one side is entirely dead or fled (§15a)
  if (a === 0 || b === 0) {
    st.over = true;
    st.winner = a > 0 ? 'a' : (b > 0 ? 'b' : null);
    Combat.applySurvivalGrowth(st);
    ev(st, { t: 'end', winner: st.winner });
  }
}

// Post-victory recovery (§15a): winners restore 50% max HP between encounters.
Combat.applyPostVictoryRecovery = function (chars) {
  for (const ch of chars) {
    if (ch.combatHp == null) continue;
    const max = Ch().maxHp(ch);
    ch.combatHp = Math.min(max, ch.combatHp + Math.round(max * C().POST_VICTORY_RECOVERY_PCT));
  }
};

// Export end-of-encounter HP back onto characters for attrition across the quest (§8).
// Survival growth (request): Bulwark and Arena Champion holders gain 20 max HP
// for every battle they come out of alive — each encounter of a quest counts.
// Applied once per battle, on export.
Combat.applySurvivalGrowth = function (st) {
  if (st.__growthApplied) return [];
  st.__growthApplied = true;
  const grown = [];
  for (const u of st.units) {
    const ch = u.ch;
    if (ch.isMonster || ch.campaign) continue;
    const alive = !u.downed || st.winner === u.side;       // downed on the winning side gets up at 1 HP
    if (!alive) continue;
    let gain = 0;
    for (const e of ch.perks) { const sk = SK()[e.skillId]; if (sk && sk.survivalHp) gain += sk.survivalHp; }
    if (!gain) continue;
    ch.stats.hp += gain;
    ch.survivalBattles = (ch.survivalBattles || 0) + 1;
    if (!u.downed) u.chp += gain;                           // the new headroom is real at once
    ev(st, { t: 'survivalGrowth', uid: u.uid, gain, total: ch.survivalBattles });
    grown.push({ ch, gain });
  }
  return grown;
};

Combat.exportHp = function (st) {
  Combat.applySurvivalGrowth(st);
  for (const u of st.units) {
    u.ch.combatHp = u.downed ? 0 : u.chp;
    u.ch.wasDowned = u.downed;
    u.ch.hasFled = u.fled;
    // Purify's ward outlasts the battle just long enough to refuse the chains (request 7)
    u.ch.__purifiedAtEnd = u.statuses.some(x => x.kind === 'purified');
  }
};

// Internals handed to js/core/combat_effects.js (bespoke campaign skills).
Combat._internals = {
  dealDamage, computeDamage, healUnit, addStatus, removeStatus, livingUnits, laneUnits,
  applyTakenReduction,
  ev, perkVal, LANE_IDX, checkEnd, onUnitDown, finishAction, addExposed, canHealOther, canWard,
  NEG_STATUSES, POS_STATUSES, DOT_STATUSES, endRoundTicks, applyRawDamage, applyDruidHeal,
  hopDots, hopPoison, pickAdjacentFoe,
};
ADV.Combat = Combat;
})();
