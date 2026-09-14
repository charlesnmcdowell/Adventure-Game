// Varenholm's Gate story campaign core (VARENHOLMS_GATE_CAMPAIGN.md §0-§2, §6).
//
// Differs from the two faction campaigns in three ways:
//   1. Progress lives in game.meta.c3 — the cross-life journal — so a later
//      life (reincarnation or nepotism) resumes the story at the chapter reached.
//      A wipe on this road is not that death: the company walks home as if it fled.
//   2. Branching happens INSIDE quests through choice beats, never by
//      unlocking alternate quests; the hall stays a straight list of fourteen.
//   3. The company is a picked subset (max 5 companions, 6 people with you) built as
//      campaign actors at the quest's level, not world NPCs.
//
// Installation at the bottom wraps the same ADV.Campaign entry points campaign2
// wraps, dispatching on quest.campaign3; everything else falls through.
(function () {
'use strict';
const C = () => ADV.DATA.CONST;
const D = () => ADV.DATA;
const C3 = {};

C3.FID = 'gate';
C3.MAX_COMPANY = 5;                       // companions who ride; 6 people with you
C3.QUEST_COUNT = 14;
C3.LEVEL_BY_TIER = { 1: 6, 2: 12, 3: 18, boss: 24 };

// ---------------------------------------------------------------- state (§1)
C3.fresh = function () {
  return {
    stage: 0, started: false,
    flags: {}, heritage: 0, aff: {}, romance: null, allegiance: null,
    company: [], recruited: [], gone: [], dead: [],
    ending: null, epilogue: null, endCardDue: false,
    beats: [], choices: {}, asked: {}, gearIssued: false,
    banterHeard: [], lastBanter: null, lastBanterSpeaker: null,
    partyNoticeSeen: false,
  };
};
C3.state = function (game) {
  if (!game.meta) game.meta = {};
  if (!game.meta.c3) game.meta.c3 = C3.fresh();
  const s = game.meta.c3;
  // forward-compatible defaults
  for (const [k, v] of Object.entries(C3.fresh())) if (s[k] === undefined) s[k] = v;
  return s;
};
C3.save = function (game) { if (ADV.Save && ADV.Save.saveMeta) ADV.Save.saveMeta(game); };
C3.restart = function (game) { game.meta.c3 = C3.fresh(); game.__c3actors = null; C3.save(game); };
C3.started = function (game) { return C3.state(game).started; };
C3.completed = function (game) { return !!C3.state(game).ending; };
C3.menuVisible = function () { return true; };   // §0: visible from the first minute

// ---------------------------------------------------------------- flags & conditions (§2)
C3.flag = function (game, k) { return !!C3.state(game).flags[k]; };
C3.setFlag = function (game, k, v) { C3.state(game).flags[k] = v === undefined ? true : v; };
C3.aff = function (game, who) { return C3.state(game).aff[who] || 0; };
C3.isRecruited = function (game, who) { const s = C3.state(game); return s.recruited.includes(who) && !s.gone.includes(who) && !s.dead.includes(who); };
C3.inCompany = function (game, who) { return C3.state(game).company.includes(who) && C3.isRecruited(game, who); };
C3.isAlive = function (game, who) { return !C3.state(game).dead.includes(who); };
C3.companyIds = function (game) { const s = C3.state(game); return s.company.filter(id => C3.isRecruited(game, id)); };
C3.roster = function (game) { const s = C3.state(game); return s.recruited.filter(id => C3.isRecruited(game, id)); };
C3.charName = function (id) { return ((D().CAMPAIGN_CHARS || {})[id] || {}).name || id; };
C3.companyFull = function (game) { return C3.companyIds(game).length >= C3.MAX_COMPANY; };

// when: { flag, not, company, noCompany, companyAll:[...], recruited, notRecruited, alive, dead,
//         heritageMin, heritageMax, affMin:[who,n], allegiance, romance, any:[...] }
C3.test = function (game, when) {
  if (!when) return true;
  const s = C3.state(game);
  if (when.any) { if (!when.any.some(w => C3.test(game, w))) return false; }
  if (when.flag && !C3.flag(game, when.flag)) return false;
  if (when.not && C3.flag(game, when.not)) return false;
  if (when.company && !C3.inCompany(game, when.company)) return false;
  if (when.noCompany && C3.inCompany(game, when.noCompany)) return false;
  if (when.companyAll && !when.companyAll.every(id => C3.inCompany(game, id))) return false;
  if (when.recruited && !C3.isRecruited(game, when.recruited)) return false;
  if (when.notRecruited && C3.isRecruited(game, when.notRecruited)) return false;
  if (when.alive && !C3.isAlive(game, when.alive)) return false;
  if (when.dead && C3.isAlive(game, when.dead)) return false;
  if (when.heritageMin != null && s.heritage < when.heritageMin) return false;
  if (when.heritageMax != null && s.heritage > when.heritageMax) return false;
  if (when.affMin && C3.aff(game, when.affMin[0]) < when.affMin[1]) return false;
  if (when.allegiance && s.allegiance !== when.allegiance) return false;
  if (when.romance && s.romance !== when.romance) return false;
  return true;
};

// ---------------------------------------------------------------- company (§3a)
C3.recruit = function (game, who) {
  const s = C3.state(game);
  const def = D().CAMPAIGN_CHARS[who];
  if (!def || !def.companion) return false;
  if (!s.recruited.includes(who)) s.recruited.push(who);
  s.gone = s.gone.filter(x => x !== who);
  if (!s.company.includes(who) && !C3.companyFull(game)) s.company.push(who);
  game.__c3actors = null;
  return true;
};
// Recruits a list. `joined` took an open seat; `overflow` is recruited but
// waiting at the inn because the company is already at MAX_COMPANY.
C3.applyRecruits = function (game, ids) {
  const joined = [], overflow = [];
  for (const id of ids || []) {
    const wasIn = C3.inCompany(game, id);
    if (!C3.recruit(game, id)) continue;
    if (C3.inCompany(game, id)) { if (!wasIn) joined.push(id); }
    else overflow.push(id);
  }
  return { joined, overflow };
};
C3.dismiss = function (game, who) {          // leaves the company; stays recruited unless also `gone`
  const s = C3.state(game);
  s.company = s.company.filter(x => x !== who);
  game.__c3actors = null;
};
C3.seat = function (game, who) {
  const s = C3.state(game);
  if (!C3.isRecruited(game, who)) return false;
  if (s.company.includes(who)) return true;
  if (C3.companyFull(game)) return false;
  s.company.push(who);
  game.__c3actors = null;
  C3.save(game);
  return true;
};
C3.replaceCompany = function (game, outId, inId) {
  if (outId && outId !== inId) C3.dismiss(game, outId);
  return C3.seat(game, inId);
};
C3.gone = function (game, who) { const s = C3.state(game); if (!s.gone.includes(who)) s.gone.push(who); C3.dismiss(game, who); };
C3.kill = function (game, who) { const s = C3.state(game); if (!s.dead.includes(who)) s.dead.push(who); C3.dismiss(game, who); };
C3.toggleCompany = function (game, who) {
  const s = C3.state(game);
  if (!C3.isRecruited(game, who)) return false;
  if (s.company.includes(who)) s.company = s.company.filter(x => x !== who);
  else if (!C3.companyFull(game)) s.company.push(who);
  else return false;
  game.__c3actors = null;
  C3.save(game);
  return true;
};

// ---------------------------------------------------------------- actors (§6)
// Companions are rebuilt per quest at the quest's level; principals and bosses
// keep their authored level. Never saved — meta holds the truth.
C3.levelFor = function (game) {
  const q = game.quest && game.quest.quest;
  const tier = q && q.campaign3 ? q.tier : (D().CAMPAIGN3_QUESTS[Math.min(C3.state(game).stage, C3.QUEST_COUNT - 1)] || {}).tier || 1;
  return C3.LEVEL_BY_TIER[tier] || 12;
};
C3.actor = function (game, id) {
  const def = D().CAMPAIGN_CHARS[id];
  if (!def) return null;
  game.__c3actors = game.__c3actors || {};
  const lvl = def.companion ? C3.levelFor(game) : (def.level || 18);
  const cacheKey = id + '@' + lvl;
  if (!game.__c3actors[cacheKey]) {
    const ch = ADV.Campaign.makeActor(Object.assign({}, def, { level: lvl }));
    if (def.statMult && !def.godLine) for (const k of ['hp', 'atk', 'def', 'spd']) ch.stats[k] = Math.round(ch.stats[k] * def.statMult);
    game.__c3actors[cacheKey] = ch;
  }
  return game.__c3actors[cacheKey];
};
C3.alliesFor = function (game, q) {
  // Hiwot joins after the prologue. Even a restarted/debugged Q1 begins alone.
  if (!q || !q.campaign3 || q.n === 1) return [];
  return C3.companyIds(game).filter(id => D().CAMPAIGN_CHARS[id]?.faction === C3.FID && D().CAMPAIGN_CHARS[id]?.companion)
    .slice(0, C3.MAX_COMPANY).map(id => C3.actor(game, id)).filter(Boolean);
};
C3.departureNotice = function (game, q) {
  if (!q?.campaign3 || C3.state(game).partyNoticeSeen) return null;
  const player = ADV.Game.player(game);
  if (!ADV.Party.of(game.world, player) && ADV.Party.battleRoster(game.world, player).length < 2) return null;
  return 'Your regular party and followers wait at home during Varenholm’s Gate. '
    + (q.n === 1 ? 'You begin this quest alone and recruit companions through the story. ' : 'Only companions recruited in this campaign travel with you. ')
    + 'Your regular party stays intact, and you won’t owe them wages for this quest.';
};

// ---------------------------------------------------------------- quests (§4)
C3.questDef = function (n) { return D().CAMPAIGN3_QUESTS[n - 1]; };
C3.questStatus = function (game, n) {
  const s = C3.state(game);
  if (n <= s.stage) return 'done';
  return n === s.stage + 1 ? 'open' : 'locked';
};
C3.buildQuest = function (game, n) {
  const src = C3.questDef(n);
  const T = C().QUEST_TIERS;
  const tier = src.tier === 'boss' ? 'boss' : src.tier;
  const pay = tier === 'boss' ? T.boss.partyPay : T[tier].partyPay;
  const q = {
    id: 'c3_' + n, campaign: true, campaign3: true, factionId: C3.FID, n,
    name: src.name, brief: src.brief, chapter: src.chapter, tier, track: 'campaign',
    factionAlignment: 'neutral',
    payout: Math.max(C().CAMPAIGN_MIN_PAY || 500, pay),
    enemyLevels: (tier === 'boss' ? T.boss : T[tier]).enemyLevels,
    encounters: src.enc.map(e => ({ enemyTypeIds: [], boss: !!e.boss, mini: !!e.mini, campaign: true, label: e.label })),
    cEnc: src.enc.map(e => Object.assign({}, e)),
    isBoss: n === C3.QUEST_COUNT,
    travelLocation: (D().CAMPAIGN3_TRAVEL || {})[src.travel] || 'road',
  };
  if (ADV.BalanceSupport && ADV.BalanceSupport.quest) ADV.BalanceSupport.quest(q);
  return q;
};
// The scored run for a quest (Music.startRun's second argument): the quest's
// underscore, the battle cue for its half of the road, Kolade's theme only on
// the last quest. Null for anything that is not ours.
C3.musicFor = function (quest) {
  const M = D().CAMPAIGN3_MUSIC;
  if (!M || !quest || !quest.campaign3) return null;
  const n = quest.n;
  const combat = n >= M.cityFrom ? M.combat.city : M.combat.road;
  return { quest: M.quest[n] || M.quest[1], combat, boss: n === C3.QUEST_COUNT ? M.boss : combat };
};
// The hub plays the camp cue while the road is still open.
C3.hubMusic = function (game) {
  const M = D().CAMPAIGN3_MUSIC;
  if (!M || !M.camp) return null;
  const s = C3.state(game);
  return s.started && !s.ending ? M.camp : null;
};
C3.hallView = function (game) {
  const s = C3.state(game);
  return {
    stage: s.stage, started: s.started, ending: s.ending,
    quests: D().CAMPAIGN3_QUESTS.map(q => ({ n: q.n, name: q.name, chapter: q.chapter, tier: q.tier, brief: q.brief, enc: q.enc, status: C3.questStatus(game, q.n) })),
    company: C3.companyIds(game), roster: C3.roster(game), heritage: s.heritage, allegiance: s.allegiance, romance: s.romance,
  };
};
C3.start = function (game) { const s = C3.state(game); s.started = true; C3.save(game); };

// Resolve a spawn spec against the flags: `variants` win when their flag is set.
C3.resolveSpec = function (game, spec) {
  if (!spec) return {};
  if (spec.variants) for (const [flag, alt] of Object.entries(spec.variants)) if (C3.flag(game, flag)) return Object.assign({}, alt);
  const out = Object.assign({}, spec); delete out.variants; return out;
};
C3.spawnEnemy = function (rng, typeId, level, opts) {
  const ch = ADV.Campaign.spawnEnemy(rng, typeId, level, opts);
  if (ADV.Campaign2 && (!opts || !opts.name)) ADV.Campaign2.applySkin(rng, ch, typeId);
  // No personality voices in this campaign (request): every speaking part is a
  // cast character with a designed voice, and a mini-boss taunting in a random
  // stock voice broke that. Without a personalityId the combat taunts stay silent.
  delete ch.personalityId;
  return ch;
};
C3.spawnEncounter = function (game, quest, encIdx) {
  const rng = game.rng.fork('c3q' + quest.n + ':' + encIdx);
  const spec = C3.resolveSpec(game, quest.cEnc && quest.cEnc[encIdx]);
  const [lo, hi] = quest.enemyLevels;
  const lvl = Math.round(lo + (hi - lo) * (encIdx / Math.max(1, quest.cEnc.length - 1)));
  const out = [];
  const world = game.world;
  // A companion can appear on the opposing side of a later story branch.
  // Combat tuning and damage must never change the cached dialogue/ally actor.
  const enemyActor = id => JSON.parse(JSON.stringify(C3.actor(game, id)));
  for (const t of spec.types || []) {
    if (D().CAMPAIGN_ENEMIES[t]) out.push(C3.spawnEnemy(rng, t, lvl, { world }));
    else out.push(ADV.Character.makeEnemy(rng, t, { level: lvl, world }));
  }
  if (spec.mini) {
    const mbd = D().CAMPAIGN_MINIBOSSES[spec.mini];
    if (mbd) {
      const count = mbd.count || 1;
      for (let i = 0; i < count; i++) {
        out.push(C3.spawnEnemy(rng, mbd.base, hi, {
          boss: count === 1, name: mbd.name + (count > 1 ? ' ' + (i + 1) : ''),
          signature: mbd.signature, equips: mbd.equips, undead: mbd.undead, world,
        }));
      }
    }
  }
  for (const t of spec.with || []) {
    if (D().CAMPAIGN_ENEMIES[t]) out.push(C3.spawnEnemy(rng, t, lvl, { world }));
    else if (D().CAMPAIGN_CHARS[t]) { const a = enemyActor(t); a.combatHp = null; a.campaignExit = !!spec.escapes; out.push(a); }
  }
  if (spec.boss) {
    const boss = enemyActor(spec.boss);
    boss.combatHp = null; boss.boss = true; boss.isBossFight = true;
    // §6: a boss that `escapes` walks off at 0 HP; the engine still scores the win
    boss.campaignExit = !!spec.escapes;
    out.unshift(boss);
  }
  if (spec.mini || spec.boss) ADV.Campaign.guardBoss(game, out, quest.factionId, hi, rng, (t, l, o) => C3.spawnEnemy(rng, t, l, Object.assign({ world }, o || {})));
  const strength = D().CAMPAIGN3_COMBAT;
  for (const ch of out) {
    // Include the previous boss floor and undead rounding in the HP guarantee.
    const hp = Math.max(ADV.Character.maxHp(ch), ch.hpFloor || 0);
    for (const k of ['hp', 'atk', 'def']) {
      ch.stats[k] *= strength[k];
      ch.bonusStats[k] = (ch.bonusStats[k] || 0) * strength[k];
    }
    ch.hpFloor = Math.ceil(hp * strength.hp);
  }
  // Nobody spawned into this campaign barks in a fight: no stock personality voice and no
  // monster roar (Nib was roaring in the hired knife's voice). The scripted openers carry the scene.
  for (const ch of out) { if (ch.campaignEnemy || ch.isMonster) delete ch.personalityId; ch.noCombatVoice = true; }
  C3.limitRecovery(out);
  C3.tuneMineChief(quest, encIdx, out);
  C3.markEarlyFoes(game, quest, out);
  return out;
};

// Also applied when loading an already spawned encounter from a save. Idempotent,
// and changes existing enemies in place without respawning defeated ones.
C3.limitRecovery = function (enemies) {
  for (const ch of enemies || []) if (ch) ch.c3RecoveryMax = D().CAMPAIGN3_RECOVERY_MAX;
};
// Easy and Normal open the road softer: the first two quests hit at 70% of the
// campaign's usual output. Hard is the full blow from the first knife.
C3.earlyFoeDmg = function (game, quest) {
  const q = quest || game?.quest?.quest;
  if (!q?.campaign3 || (q.n || 0) > 2) return 1;
  const id = ADV.Difficulty && ADV.Difficulty.id ? ADV.Difficulty.id() : 'easy';
  if (id === 'hard') return 1;
  const n = D().CAMPAIGN3_EARLY_FOE_DMG;
  return n != null ? n : 0.7;
};
C3.markEarlyFoes = function (game, quest, enemies) {
  const mult = C3.earlyFoeDmg(game, quest);
  for (const ch of enemies || []) if (ch) ch.c3FoeDmg = mult;
};
// A wipe on this road is a retreat, not a death. The player and anyone riding
// with them stand up at one health and the quest ends the same way a flee does.
C3.retreatFromDefeat = function (game) {
  const q = game && game.quest;
  if (!q?.quest?.campaign3) return false;
  const p = ADV.Game.player(game);
  q.failed = true;
  q.fled = true;
  q.over = true;
  q.playerDead = false;
  q.leaderDied = false;
  if (p) {
    p.hasFled = true;
    p.wasDowned = false;
    if (p.combatHp == null || p.combatHp <= 0) p.combatHp = 1;
  }
  for (const ch of ADV.Game.partyRoster(game, q.quest)) {
    if (!ch) continue;
    ch.wasDowned = false;
    if (ch.combatHp == null || ch.combatHp <= 0) ch.combatHp = 1;
  }
  return true;
};
C3.tuneMineChief = function (quest, encIdx, enemies) {
  if (!quest || !quest.campaign3 || quest.cEnc?.[encIdx]?.mini !== 'kobold_chief') return;
  const tuning = D().CAMPAIGN3_MINE_CHIEF;
  for (const ch of enemies || []) {
    if (!ch || ch.__c3MineTuned) continue;
    const chief = ch.boss && ch.enemyTypeId === 'kobold_shaman';
    if (chief) {
      const oldHp = Math.max(ADV.Character.maxHp(ch), ch.hpFloor || 0);
      ch.stats.hp *= tuning.hp; ch.bonusStats.hp = (ch.bonusStats.hp || 0) * tuning.hp;
      ch.hpFloor = Math.ceil(oldHp * tuning.hp);
      ch.stats.def *= tuning.def; ch.bonusStats.def = (ch.bonusStats.def || 0) * tuning.def;
      if (ch.combatHp != null) ch.combatHp = Math.max(0, Math.round(ch.combatHp * tuning.hp));
      ch.c3MineChief = true;
    }
    // Consistent kits: no random regeneration/drain loop or party-wide full heal.
    if (chief || ch.enemyTypeId === 'veylan_acolyte') {
      const level = ch.enemyLevel || quest.enemyLevels[1];
      const skills = chief ? ['fire_bolt', 'spark', 'mend', 'snare'] : ['mend', 'wither_touch'];
      ch.actives = skills.map(skillId => ({ skillId, level, uses: level * 10 }));
      ch.c3MineRecovery = true;
    }
    ch.__c3MineTuned = true;
  }
};

// The existing Mend animation/skill remains, with limited supplies in this encounter.
C3.combatManifest = function (u, skillId, m) {
  if (!u.ch.c3MineRecovery || skillId !== 'mend') return m;
  const t = D().CAMPAIGN3_MINE_CHIEF;
  return Object.assign({}, m, { data: Object.assign({}, m.data, {
    healMult: t.healPct / ADV.Combat.HEAL_PCT[m.tier], target: 'ally', healTargets: 1,
    noCleanse: true, cures: [], cooldown: t.healCooldown, usesPerBattle: t.healUses,
    desc: 'Restores 12% health to one ally. Two uses per battle; three-round recovery. Does not remove Withering.',
  }) });
};

C3.counterHealingAction = function (st, u) {
  if (u.side !== 'a' || u.ch.campaignId !== 'fennick' || u.downed || u.fled || u.reserved) return null;
  const skillId = 'whisper_of_ending', m = ADV.Combat.manifestFor(u, skillId);
  if (!m || ADV.Combat.cooldownLeft(u, skillId) || u.statuses.some(s => s.kind === 'sealed' && (s.tiers || []).includes(m.tier))) return null;
  const chief = ADV.Combat.validTargets(st, u, skillId).find(t => t.side !== u.side && t.ch.c3MineChief &&
    t.healingReceived > 0 && !t.statuses.some(s => ['withering', 'witherImmune', 'purified'].includes(s.kind)));
  return chief ? { kind: 'skill', skillId, targetUid: chief.uid, c3CounterHeal: true } : null;
};
C3.afterCounterHealing = function (st, u, act, result) {
  if (!act.c3CounterHeal || !result?.ok || st.__c3HealWarning) return;
  const target = st.units.find(t => t.uid === act.targetUid);
  if (!target?.statuses.some(s => s.kind === 'withering')) return;
  st.__c3HealWarning = true;
  st.events.push({ t: 'campaignBanter', beat: { c3: true, combat: true, to: 'company', fid: C3.FID, who: 'fennick', key: 'q4_healing' } });
};
// Mirrors Game.tryVerb's success branch: this encounter is talked past.
C3.spareSummit = function (game) {
  // A successful bribe/intimidation is mercy even after choosing a hostile
  // dialogue answer. The following scene must not describe a fight that never happened.
  C3.setFlag(game, 'leadersKilled', false);
  C3.setFlag(game, 'leadersSpared', true);
};
C3.bypassEncounter = function (game) {
  const q = game.quest; if (!q) return false;
  if (q.quest?.campaign3 && q.quest.n === 10 && q.encIdx === 1) C3.spareSummit(game);
  q.encIdx++; q.enemies = null; q.verbs = null; q.openerBeats = [];
  if (q.encIdx >= q.quest.encounters.length) {
    q.readyToComplete = true;
    // talking past the last room still earns the closing scene
    C3.queueClosing(game);
  }
  return true;
};
// The inn's map points through the vale. Layla is a roadside encounter on that
// journey, not a contact the company already knows. No extra encounter or cost.
C3.travelBridge = function (game) {
  const q = game.quest;
  if (!q?.quest?.campaign3 || q.quest.n !== 5 || q.encIdx !== 1 || q.__q5ValeJourney || q.over || q.failed || q.playerDead) return null;
  const choice = C3.state(game).choices.q5_verlan;
  const lead = choice === 'pay' ? 'Femi’s map marks a camp beyond Holloway Vale, under the old oak line.'
    : choice === 'pocket' ? 'The map Hiwot lifted marks a camp beyond Holloway Vale, under the old oak line.'
    : 'Among the courier’s papers you find a map to the bandit camp, beyond Holloway Vale.';
  return {
    key: 'gate:q5:inn-to-holloway:v1', heading: 'Thornbury → Holloway Vale',
    caption: lead + ' You leave the inn and follow the river north, keeping off the watched road.',
    arrivalCaption: 'At the crossing, soldiers block the path. A dark-elf woman is kneeling between them. You stop to see what is happening.',
    location: 'gate_holloway', durationMs: 11000,
  };
};
// A reply beat, with a same-named follow-up choice attached when one exists.
// opt / choiceId: an `ask` option's reply re-presents the same choice (minus the question).
C3.replyBeat = function (reply, speaker, game, opt, choiceId) {
  if (!reply) return null;
  const b = Object.assign({ c3: true, fid: C3.FID }, reply);
  if (opt && opt.ask && choiceId) b.choice = choiceId;
  if (b.who === '$speaker') b.who = speaker;
  if (Array.isArray(b.who)) {
    const list = b.who;
    b.who = list.find(id => game && C3.inCompany(game, id) && C3.lines(C3.FID, id, b.key).length) || list.find(id => C3.lines(C3.FID, id, b.key).length) || list[0];
  }
  if (!b.choice && D().CAMPAIGN3_CHOICES[b.key]) b.choice = b.key;
  return b;
};

// ---------------------------------------------------------------- beats (§2)
C3.lines = function (fid, who, key) {
  const dlg = (D().CAMPAIGN3_DIALOGUE || {})[fid || C3.FID];
  return (dlg && dlg[who] && dlg[who][key]) ? dlg[who][key] : [];
};
// A script beat becomes a playable beat: speaker resolved (anyOf → first in
// company with lines for the key), conditions tested, tagged c3.
C3.prepareBeats = function (game, beats) {
  const out = [];
  for (const raw of beats || []) {
    if (!C3.test(game, raw.when)) continue;
    let who = raw.who;
    if (raw.anyOf) {
      who = raw.anyOf.find(id => C3.inCompany(game, id) && C3.lines(C3.FID, id, raw.key).length) || null;
      if (!who) continue;
    }
    if (!D().CAMPAIGN_CHARS[who]) continue;
    // a recruited companion who is benched at the inn does not speak from the
    // road (arrival beats are fine — they are at the inn too); strangers not yet
    // recruited may always speak; the dead never do.
    const def = D().CAMPAIGN_CHARS[who];
    const s = C3.state(game);
    if (s.dead.includes(who) && !raw.force) continue;
    if (def.companion && !raw.anyOf && !raw.arrival && !raw.force && !raw.recruit && C3.isRecruited(game, who) && !C3.inCompany(game, who)) continue;
    if (raw.choice && !D().CAMPAIGN3_CHOICES[raw.choice]) continue;
    out.push(Object.assign({}, raw, { who, fid: C3.FID, c3: true }));
  }
  return out;
};
C3.script = function (n) { return D().CAMPAIGN3_SCRIPT[n] || {}; };
C3.departureBeats = function (game, q) { return C3.prepareBeats(game, C3.script(q.n).departure); };
C3.openerBeats = function (game, q, encIdx) { const o = C3.script(q.n).openers || {}; return C3.prepareBeats(game, o[encIdx]); };
C3.closingBeats = function (game, q) { return C3.prepareBeats(game, C3.script(q.n).closing); };
C3.queueClosing = function (game) {
  const q = game.quest;
  if (!q?.quest?.campaign3 || !q.readyToComplete || q.failed || q.playerDead || q.fled || q.__c3closed) return;
  q.__c3closed = true;
  q.closingBeats = C3.closingBeats(game, q.quest);
};
C3.arrivalBeats = function (game, n) { return C3.prepareBeats(game, (C3.script(n).arrival || []).map(b => Object.assign({ arrival: true }, b))); };
C3.pushBeat = function (game, beat) { C3.state(game).beats.push(beat); };
C3.takeBeats = function (game) { const s = C3.state(game); const b = s.beats; s.beats = []; return b; };

// Applies a beat's side effects (recruit / dismiss / gone / kill) when it plays.
C3.applyBeat = function (game, beat) {
  const seats = C3.applyRecruits(game, beat.recruit);
  for (const id of beat.dismiss || []) C3.dismiss(game, id);
  for (const id of beat.gone || []) C3.gone(game, id);
  for (const id of beat.kill || []) C3.kill(game, id);
  if (beat.set) for (const [k, v] of Object.entries(beat.set)) C3.setFlag(game, k, v);
  if (ADV.GatePerks) ADV.GatePerks.reconcile(game);
  C3.save(game);
  return seats;
};

// ---------------------------------------------------------------- choices (§2)
// Options the player has already asked (ask-and-return questions) drop out of the list.
C3.options = function (game, choiceId) {
  const ch = D().CAMPAIGN3_CHOICES[choiceId];
  if (!ch) return [];
  const s = C3.state(game);
  const asked = (s.asked && s.asked[choiceId]) || [];
  return ch.options.filter(o => C3.test(game, o.when) && !(o.ask && asked.includes(o.id)));
};
// The romance closer builds its options from the state (§4 Q9).
C3.dynamicOptions = function (game, kind) {
  if (kind !== 'romance') return [];
  const s = C3.state(game);
  if (s.romance) return [];
  const out = [];
  for (const id of C3.roster(game)) {
    const def = D().CAMPAIGN_CHARS[id];
    if (!def || !def.romance || C3.aff(game, id) < 3) continue;
    if (def.romanceWhen && !C3.test(game, def.romanceWhen)) continue;
    if (!C3.lines(C3.FID, id, 'q9_romance').length) continue;
    out.push({ id: 'romance_' + id, text: `(${def.name}) Yes.`, romance: id, speaker: id, prompt: { who: id, key: 'q9_romance' }, reply: { who: id, key: 'q9_romance_yes' } });
  }
  return out;
};
C3.applyOption = function (game, choiceId, opt) {
  const s = C3.state(game);
  if (opt.ask) { s.asked = s.asked || {}; s.asked[choiceId] = (s.asked[choiceId] || []).concat(opt.id); }
  else s.choices[choiceId] = opt.id;
  if (opt.set) for (const [k, v] of Object.entries(opt.set)) C3.setFlag(game, k, v);
  if (choiceId === 'q10_summit') {
    // Replaying a failed quest may leave the previous attempt's choice flags.
    C3.setFlag(game, 'leadersKilled', opt.id === 'kill');
    C3.setFlag(game, 'leadersSpared', opt.id !== 'kill');
    C3.setFlag(game, 'leadersArrested', opt.id === 'arrest');
  }
  if (opt.aff) for (const [who, n] of Object.entries(opt.aff)) s.aff[who] = (s.aff[who] || 0) + n;
  if (opt.heritage) s.heritage = Math.max(-3, Math.min(3, s.heritage + opt.heritage));
  if (opt.allegiance) s.allegiance = opt.allegiance;
  if (opt.allegianceLean) C3.setFlag(game, 'lean_' + opt.allegianceLean);
  if (opt.romance) s.romance = opt.romance;
  if (opt.gold) { const p = ADV.Game.player(game); if (p) p.inventory.gold = Math.max(0, (p.inventory.gold || 0) + opt.gold); }
  const seats = C3.applyRecruits(game, opt.recruit);
  for (const id of opt.dismiss || []) C3.dismiss(game, id);
  for (const id of opt.gone || []) C3.gone(game, id);
  for (const id of opt.kill || []) C3.kill(game, id);
  if (opt.noEscape && game.quest && game.quest.enemies) for (const e of game.quest.enemies) if (e.campaign) e.campaignExit = false;
  if (opt.bypass) C3.bypassEncounter(game);
  if (opt.ending) C3.resolveEnding(game, opt.ending);
  C3.save(game);
  if (ADV.Save && game.world) ADV.Save.saveGame(game);
  return seats;
};

// ---------------------------------------------------------------- combat hooks
C3.banter = function (game, st, roundN) {
  const q = game.quest && game.quest.quest;
  if (!q || !q.campaign3) return null;
  if ((roundN || st.round) !== 2 || st.__bantered) return null;
  st.__bantered = true;
  const standing = C3.companyIds(game).filter(id => !st || !st.units || st.units.some(u => u.side === 'a' && u.ch && u.ch.campaignId === id && !u.downed && !u.fled && !u.reserved));
  if (!standing.length) return null;
  const candidates = standing.flatMap(who => C3.lines(C3.FID, who, 'banter').map((line, voOffset) => ({
    who, line, voOffset, id: who + ':' + voOffset,
  }))).filter(b => (!b.line.withCompany || b.line.withCompany.every(id => standing.includes(id))) &&
    (!b.line.foeStatus || (st.units || []).some(u => u.side === 'b' && !u.downed && !u.fled && (u.statuses || []).some(s => s.kind === b.line.foeStatus))));
  if (!candidates.length) return null;
  const s = C3.state(game);
  let pool = candidates.filter(b => !s.banterHeard.includes(b.id));
  if (!pool.length) { s.banterHeard = s.banterHeard.filter(id => !candidates.some(b => b.id === id)); pool = candidates; }
  const varied = pool.filter(b => b.who !== s.lastBanterSpeaker);
  if (varied.length) pool = varied;
  const fresh = pool.filter(b => b.id !== s.lastBanter);
  if (!fresh.length) return null; // silence is better than repeating the only suitable remark
  const chosen = game.rng.pick(fresh);
  s.banterHeard.push(chosen.id); s.lastBanter = chosen.id; s.lastBanterSpeaker = chosen.who;
  C3.save(game);
  return Object.assign({ key: 'banter', fid: C3.FID, c3: true, combat: true, to: 'company' }, chosen);
};

// ---------------------------------------------------------------- progression (§4-§5)
C3.onQuestDone = function (game, q) {
  const s = C3.state(game);
  if (!q.campaign3 || q.n !== s.stage + 1) return;
  s.stage = q.n;
  for (const b of C3.arrivalBeats(game, q.n)) C3.pushBeat(game, b);
  if (q.n === C3.QUEST_COUNT) C3.finish(game);
  if (ADV.GatePerks) ADV.GatePerks.reconcile(game);
  C3.save(game);
  ADV.Save.saveGame(game);
};
C3.resolveEnding = function (game, resolution) {
  const s = C3.state(game);
  s.resolution = resolution;
  let id;
  if (resolution === 'usurp') id = 'usurper';
  else if (resolution === 'walk') id = 'ascetic';
  else if (resolution === 'gauntlet') id = 'mercy';
  else id = s.heritage >= 1 ? 'monster' : 'hero';
  s.ending = id;
  s.epilogue = C3.epilogue(game);
  s.endCardDue = true;
  return id;
};
C3.finish = function (game) {
  const s = C3.state(game);
  if (!s.ending) C3.resolveEnding(game, 'kill');
  const p = ADV.Game.player(game);
  if (p && !s.gearIssued) {
    const set = D().FACTIONS[C3.FID].gearSet;
    p.ownedSets = (p.ownedSets || []).concat(set);
    if (!p.equippedSet) p.equippedSet = set;
    s.gearIssued = true;
  }
  if (ADV.World && ADV.World.feed && p) ADV.World.feed(game.world, 'Something ended under the city last night. The Council will not say what. The people who were there will not say either.', [p.id]);
};
// Every paragraph in reading order (§5).
C3.epilogue = function (game) {
  const s = C3.state(game);
  const E = D().CAMPAIGN3_EPILOGUE;
  const paras = [];
  paras.push(E.ending[s.ending] || '');
  paras.push(E.allegiance[s.allegiance || 'none']);
  const dukes = C3.flag(game, 'bothDukesDead') ? 'none' : C3.flag(game, 'dukeDead') ? 'one' : 'both';
  paras.push(E.dukes[dukes]);
  for (const id of Object.keys(E.companion)) {
    const c = E.companion[id];
    let key = null;
    if (s.dead.includes(id)) key = 'dead';
    else if (s.recruited.includes(id) && s.gone.includes(id)) key = 'gone';
    else if (s.recruited.includes(id)) key = 'present';
    else if (id === 'faelen' && C3.flag(game, 'faelenLeft')) key = 'gone';
    else if (id === 'durnik' && C3.flag(game, 'durnikLeft')) key = 'gone';
    else if (id === 'ilvara' && C3.flag(game, 'ilvaraSold')) key = 'gone';
    else if (id === 'amara' && C3.flag(game, 'amaraPassed')) key = s.ending === 'mercy' ? 'present' : 'gone';
    if (key && c[key]) paras.push(c[key]);
  }
  if (s.romance && E.romance[s.romance]) {
    const r = E.romance[s.romance];
    const def = D().CAMPAIGN_CHARS[s.romance];
    if (!s.dead.includes(s.romance)) {
      paras.push(r.line);
      const fav = def && def.favours;
      const matches = fav === s.ending || (fav === 'kill' && ['hero', 'monster'].includes(s.ending) && s.resolution === 'kill') || (fav === 'thieves' && s.allegiance === 'thieves');
      if (matches) paras.push(r.favoured);
    }
  }
  paras.push(s.heritage <= -1 ? E.heritage.reject : s.heritage >= 1 ? E.heritage.embrace : E.heritage.neutral);
  return paras.filter(Boolean);
};

// ---------------------------------------------------------------- debug
C3.debugJump = function (game, n) {
  const s = C3.state(game);
  s.started = true; s.stage = n - 1;
  if (n >= 2 && !s.recruited.includes('wren_ward')) C3.recruit(game, 'wren_ward');
  if (n >= 3) { C3.recruit(game, 'dorran'); C3.recruit(game, 'selene'); }
  C3.save(game);
  return s;
};

ADV.Campaign3 = C3;

// =====================================================================
// Installation: dispatch on quest.campaign3, fall through otherwise.
// =====================================================================
(function install() {
  const O = {};
  for (const k of ['spawnEncounter', 'alliesFor', 'departureBeats', 'banter', 'takeBeats',
                   'onCampaignQuestDone', 'rivalDeathSequence', 'finalOpener', 'afterBossBeats', 'lines']) O[k] = ADV.Campaign[k];
  const isC3 = (q) => !!(q && q.campaign3);
  const cur = (game) => game.quest && game.quest.quest;

  ADV.Campaign.spawnEncounter = (game, quest, encIdx) => isC3(quest) ? C3.spawnEncounter(game, quest, encIdx) : O.spawnEncounter(game, quest, encIdx);
  ADV.Campaign.alliesFor = (game, q) => isC3(q) ? C3.alliesFor(game, q) : O.alliesFor(game, q);
  ADV.Campaign.departureBeats = (game, q) => isC3(q) ? C3.departureBeats(game, q) : O.departureBeats(game, q);
  ADV.Campaign.banter = (game, st, roundN) => isC3(cur(game)) ? C3.banter(game, st, roundN) : O.banter(game, st, roundN);
  ADV.Campaign.takeBeats = (game) => O.takeBeats(game).concat(C3.takeBeats(game));
  ADV.Campaign.onCampaignQuestDone = (game, q) => isC3(q) ? C3.onQuestDone(game, q) : O.onCampaignQuestDone(game, q);
  // game.js calls these with no fid for anything that is not campaign2; ours are empty —
  // C3 sets its own closing / opener beats through the Game wrappers below.
  ADV.Campaign.rivalDeathSequence = (game, fid) => isC3(cur(game)) ? [] : O.rivalDeathSequence(game, fid);
  ADV.Campaign.finalOpener = (game, fid) => isC3(cur(game)) ? [] : O.finalOpener(game, fid);
  ADV.Campaign.afterBossBeats = (game, fid) => isC3(cur(game)) ? [] : O.afterBossBeats(game, fid);
  ADV.Campaign.lines = (fid, who, key) => fid === C3.FID ? C3.lines(fid, who, key) : O.lines(fid, who, key);

  // Opener beats on ANY encounter, and closing beats from the script.
  const G = ADV.Game;
  const oCurrent = G.currentEncounter, oFinish = G.finishCombat, oVerb = G.tryVerb;
  G.currentEncounter = function (game) {
    const q = game.quest;
    const fresh = q && isC3(q.quest) && !q.enemies && !q.readyToComplete && !q.over && q.encIdx < q.quest.encounters.length;
    const enc = oCurrent(game);
    if (enc && q && isC3(q.quest)) { C3.limitRecovery(q.enemies); C3.tuneMineChief(q.quest, q.encIdx, q.enemies); C3.markEarlyFoes(game, q.quest, q.enemies); }
    // enemies already sitting in an older save keep no stock voice either
    if (q && isC3(q.quest) && q.enemies) for (const ch of q.enemies) { if (ch && (ch.campaignEnemy || ch.isMonster)) delete ch.personalityId; if (ch) ch.noCombatVoice = true; }
    if (enc && fresh && q.__c3openerFor !== q.encIdx) {
      q.__c3openerFor = q.encIdx;
      q.openerBeats = C3.openerBeats(game, q.quest, q.encIdx);
      enc.openerBeats = q.openerBeats;
    }
    return enc;
  };
  G.finishCombat = function (game) {
    const r = oFinish(game);
    if (r && r.won) C3.queueClosing(game);
    if (r && !r.won && (r.playerDead || game.quest?.playerDead || game.quest?.leaderDied) && C3.retreatFromDefeat(game)) {
      r.playerDead = false;
    }
    return r;
  };
  G.tryVerb = function (game, verb) {
    const summit = game.quest?.quest?.campaign3 && game.quest.quest.n === 10 && game.quest.encIdx === 1;
    const r = oVerb(game, verb);
    if (r && r.success && r.mode === 'bypass') {
      if (summit) {
        C3.spareSummit(game);
        C3.save(game);
        ADV.Save.saveGame(game);
      }
      C3.queueClosing(game);
    }
    return r;
  };
})();
})();
