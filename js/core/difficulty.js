// Difficulty (request). Easy is the game exactly as it shipped — it is there for
// people short on time who still want to make progress, not a lesser way to play.
// Normal and Hard are for a challenge: the challenge is more enemies in every
// fight and better ones — veterans with higher-tier skills and their perks — with
// only a modest stat edge, a thinner health buffer for the player, and less health
// back between fights. One setting per player, kept in meta so it survives a
// death and a new life. The levers, in order of weight:
//   extraFoes   more enemies per encounter (copies of the encounter's own kinds;
//               never more adds than the player has companions)
//   foeLevel    enemy level offset: skills climb a tier, tier-1 mooks bring perks
//   foeHp/Atk/Def a small stat edge on top
//   playerHp    the player's health buffer (easy doubles HP; hard has none)
//   recoverPct  health back after each won encounter
//   payBonus/payMult   contract pay (the flat +100 shrinks; hard pays 85%)
//   autoStopPct auto-combat safety stop (50% easy, 30% normal, off on hard)
// test/difficulty_sim.js is the yardstick behind the numbers; change them there first.
(function () {
'use strict';
const A = globalThis.ADV = globalThis.ADV || {};

const ORDER = ['easy', 'normal', 'hard'];
const LEVELS = {
  easy: {
    id: 'easy', name: 'Easy', tagline: 'Short on time? This road moves.',
    blurb: 'The game as it has always played. Fights are quick, pay is generous, and auto combat stops for you below half health so progress comes fast in a short session.',
    extraFoes: 0, foeLevel: 0, foeHp: 1.0, foeAtk: 1.0, foeDef: 1.0,
    playerHp: 2.0, recoverPct: 0.5, payBonus: 100, payMult: 1.0, autoStopPct: 0.5, fleeWarn: true,
  },
  normal: {
    id: 'normal', name: 'Normal', tagline: 'A fair fight.',
    blurb: 'One more enemy in every fight and better ones — seasoned, with their perks and a little more bite. Your health buffer is smaller and less of it comes back between fights. Auto combat stops below 30%.',
    extraFoes: 1, foeLevel: 2, foeHp: 1.05, foeAtk: 1.05, foeDef: 1.0,
    playerHp: 1.5, recoverPct: 0.35, payBonus: 50, payMult: 1.0, autoStopPct: 0.3, fleeWarn: true,
  },
  hard: {
    id: 'hard', name: 'Hard', tagline: 'Outnumbered and outclassed.',
    blurb: 'Two more enemies in every fight, all of them veterans with full kits. No health buffer, little rest between fights, leaner pay, and auto combat never stops itself.',
    extraFoes: 2, foeLevel: 4, foeHp: 1.1, foeAtk: 1.1, foeDef: 1.0,
    playerHp: 1.0, recoverPct: 0.2, payBonus: 0, payMult: 0.85, autoStopPct: 0, fleeWarn: false,
  },
};

const Difficulty = { ORDER, LEVELS, DEFAULT: 'easy' };
let bound = null;          // the game whose meta holds the setting
let cached = null;         // the id in force when no game is bound (title / creation)

Difficulty.valid = id => !!LEVELS[id];
Difficulty.stored = function () {
  try { const m = A.Save && A.Save.loadMeta && A.Save.loadMeta(); if (m && LEVELS[m.difficulty]) return m.difficulty; } catch (e) {}
  return Difficulty.DEFAULT;
};
Difficulty.bind = function (game) {
  bound = game || null;
  if (bound) { if (!bound.meta) bound.meta = {}; if (!LEVELS[bound.meta.difficulty]) bound.meta.difficulty = cached || Difficulty.DEFAULT; cached = bound.meta.difficulty; }
  return Difficulty.id();
};
Difficulty.id = function () {
  if (bound && bound.meta && LEVELS[bound.meta.difficulty]) return bound.meta.difficulty;
  return cached || Difficulty.DEFAULT;
};
Difficulty.def = function (id) { return LEVELS[id || Difficulty.id()] || LEVELS[Difficulty.DEFAULT]; };
Difficulty.name = function (id) { return Difficulty.def(id).name; };

// Choose a level. With a game bound it is written to meta and saved; the player's
// current health is re-fitted to the new maximum so a smaller buffer never leaves
// them "over full" and a larger one never leaves them short of the same fraction.
Difficulty.set = function (game, id) {
  if (!LEVELS[id]) return Difficulty.id();
  const g = game || bound;
  if (g) {
    if (!g.meta) g.meta = {};
    const p = A.Game && A.Game.player ? A.Game.player(g) : null;
    const beforeMax = p ? A.Character.maxHp(p) : 0;
    const frac = p && p.combatHp != null && beforeMax > 0 ? Math.max(0, Math.min(1, p.combatHp / beforeMax)) : null;
    g.meta.difficulty = id;
    bound = g; cached = id;
    if (p && frac != null) p.combatHp = Math.max(1, Math.round(A.Character.maxHp(p) * frac));
    if (A.Save && A.Save.saveMeta) { try { A.Save.saveMeta(g); } catch (e) {} }
  } else {
    cached = id;
    try { const m = A.Save.loadMeta(); m.difficulty = id; A.Save.saveMeta({ meta: m }); } catch (e) {}
  }
  return id;
};

// ---- the levers ----------------------------------------------------------------
Difficulty.playerHpMult = function () { return Difficulty.def().playerHp; };
// Opponents the setting scales. Allies of any kind are excluded even when they
// began life as a monster (conscripts, the risen, quest thralls).
Difficulty.isFoe = function (ch) {
  if (!ch || ch.isPlayer) return false;
  if (ch.isConscript || ch.raisedById || ch.isQuestThrall || ch.conscriptorId) return false;
  return !!(ch.isMonster || ch.campaignEnemy || ch.enemyTypeId || ch.hostileScale);
};
Difficulty.foeMult = function (key) {
  const d = Difficulty.def();
  return key === 'hp' ? d.foeHp : key === 'atk' ? d.foeAtk : key === 'def' ? d.foeDef : 1;
};
Difficulty.foeLevel = function () { return Difficulty.def().foeLevel || 0; };
Difficulty.extraFoes = function () { return Difficulty.def().extraFoes || 0; };
Difficulty.autoStopPct = function () { return Difficulty.def().autoStopPct; };
Difficulty.recoverPct = function () { const d = Difficulty.def(); return d.recoverPct != null ? d.recoverPct : 0.5; };
Difficulty.fleeWarn = function () { return !!Difficulty.def().fleeWarn; };
Difficulty.pay = function (base) { const d = Difficulty.def(); return Math.round((base + d.payBonus) * d.payMult); };

// A freshly spawned enemy becomes a veteran: every skill it carries climbs by the
// level offset (that is what moves a kit up a tier), and a tier-1 mook that the
// base game sends out perkless picks up its type's perks once it is a veteran.
// Called by Character.makeEnemy and Campaign.spawnEnemy; idempotent per unit.
Difficulty.toughen = function (ch, type) {
  const off = Difficulty.foeLevel();
  if (!ch || !off || ch.__toughened || !Difficulty.isFoe(ch)) return ch;
  ch.__toughened = true;
  const uses = (A.DATA.CONST && A.DATA.CONST.USES_PER_LEVEL) || 10;
  for (const e of (ch.perks || []).concat(ch.actives || [])) { e.level = (e.level || 1) + off; e.uses = Math.max(e.uses || 0, e.level * uses); }
  if (type && type.perks && !(ch.perks || []).length) {
    const lvl = (ch.enemyLevel || 1) + off;
    for (const p of type.perks) if (A.DATA.SKILLS[p]) ch.perks.push({ skillId: p, level: lvl, uses: lvl * uses });
  }
  if (ch.enemyLevel) ch.enemyLevel += off;
  return ch;
};

// More enemies: the encounter's own non-boss kinds, spawned again at the same
// level through the same spawner, so a bandit road adds bandits and a kobold
// warren adds kobolds. A lone boss stays a lone boss.
// A lone fighter is never simply swarmed: the adds never outnumber the player's
// own companions (solo work gets the veterans and the stat edge, not the crowd).
Difficulty.reinforce = function (rng, quest, enemies, world, allies) {
  let n = Difficulty.extraFoes();
  if (allies != null) n = Math.min(n, Math.max(0, allies - 1));
  if (!n || !enemies || !enemies.length || !rng) return enemies;
  const templates = enemies.filter(e => e && !e.boss && !e.isBossFight && e.enemyTypeId && !e.campaignExit);
  if (!templates.length) return enemies;
  const solo = quest && quest.track === 'solo';
  for (let i = 0; i < n; i++) {
    const t = templates[i % templates.length];
    const level = Math.max(1, (t.enemyLevel || 1) - Difficulty.foeLevel());   // spawners add the offset again
    let e = null;
    try {
      if (A.DATA.CAMPAIGN_ENEMIES && A.DATA.CAMPAIGN_ENEMIES[t.enemyTypeId]) {
        e = A.Campaign.spawnEnemy(rng, t.enemyTypeId, level, { world });
        if (A.Campaign2 && A.Campaign2.applySkin) A.Campaign2.applySkin(rng, e, t.enemyTypeId);
      } else if (A.DATA.ENEMIES && A.DATA.ENEMIES[t.enemyTypeId]) {
        e = A.Character.makeEnemy(rng, t.enemyTypeId, { level, world });
        if (e.armored) e.armorBonus = A.DATA.CONST.ARMORED_BONUS_DEF;
        if (solo && !quest.soloPremium && A.Quests.scaleSoloMook) A.Quests.scaleSoloMook(e);
      }
    } catch (err) { e = null; }
    if (!e) continue;
    e.reinforcement = true;
    if (t.noCombatVoice) { e.noCombatVoice = true; delete e.personalityId; }
    enemies.push(e);
  }
  return enemies;
};

// Bind on every new life and every load, so the setting is in force before the
// first stat is read.
for (const [owner, name] of [[A.Save, 'loadGame'], [A.Game, 'newGame']]) {
  if (!owner || !owner[name]) continue;
  const original = owner[name];
  owner[name] = function (...args) { const g = original.apply(this, args); if (g) Difficulty.bind(g); return g; };
}

A.Difficulty = Difficulty;
})();
