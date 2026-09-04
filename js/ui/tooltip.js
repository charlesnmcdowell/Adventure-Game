// Hover tooltips + backend skill inspector.
// SkillInfo.describe dumps exactly what the engine will do with a skill —
// every tier parameter, the damage formula with the character's real numbers,
// riders, offensive modes — so a broken skill is diagnosable on sight.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
const T = () => ADV.T;
const C = () => ADV.DATA.CONST;

// ---------------------------------------------------------------- Tooltip
const Tooltip = {
  current: null,

  show(scene, textLines, px, py) {
    Tooltip.hide();
    const body = Array.isArray(textLines) ? textLines.join('\n') : textLines;
    const txt = scene.add.text(0, 0, body, {
      fontFamily: T().font.mono, fontSize: '12px', color: T().css.ink,
      lineSpacing: 3, wordWrap: { width: 430 },
    }).setDepth(1502);
    const w = txt.width + 24, h = txt.height + 20;
    let x = px + 18, y = py + 12;
    if (x + w > T().W - 8) x = px - w - 12;
    if (y + h > T().H - 8) y = T().H - 8 - h;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    const bg = scene.add.graphics().setDepth(1501);
    bg.fillStyle(0x0f0d0a, 0.97);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1.5, T().c.gold, 0.8);
    bg.strokeRoundedRect(x, y, w, h, 5);
    txt.setPosition(x + 12, y + 10);
    Tooltip.current = { bg, txt, scene };
    scene.events.once('shutdown', Tooltip.hide);
  },

  move(scene, px, py) {
    if (!Tooltip.current || Tooltip.current.scene !== scene) return;
    const { bg, txt } = Tooltip.current;
    const w = txt.width + 24, h = txt.height + 20;
    let x = px + 18, y = py + 12;
    if (x + w > T().W - 8) x = px - w - 12;
    if (y + h > T().H - 8) y = T().H - 8 - h;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    bg.clear();
    bg.fillStyle(0x0f0d0a, 0.97);
    bg.fillRoundedRect(x, y, w, h, 5);
    bg.lineStyle(1.5, T().c.gold, 0.8);
    bg.strokeRoundedRect(x, y, w, h, 5);
    txt.setPosition(x + 12, y + 10);
  },

  hide() {
    if (!Tooltip.current) return;
    try { Tooltip.current.bg.destroy(); Tooltip.current.txt.destroy(); } catch (e) {}
    Tooltip.current = null;
  },

  // Wire hover on any interactive zone/object. textFn is lazy (built on hover).
  attach(scene, obj, textFn) {
    obj.on('pointerover', (p) => { const t = textFn(); if (t) Tooltip.show(scene, t, p.x, p.y); });
    obj.on('pointermove', (p) => Tooltip.move(scene, p.x, p.y));
    obj.on('pointerout', () => Tooltip.hide());
    obj.on('pointerdown', () => Tooltip.hide());
  },
};

// Scenes call this on shutdown-ish moments; cheap safety.
Tooltip.attachZone = function (scene, x, y, w, h, textFn) {
  const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive();
  Tooltip.attach(scene, z, textFn);
  return z;
};

// ---------------------------------------------------------------- SkillInfo
// Human labels for every engine parameter a tier can carry. Anything not
// listed still prints raw as `key: value` so nothing is ever hidden.
const PARAM_LABEL = {
  // ---- second campaign (add-on §3): the new engine primitives -------------
  immovable: () => 'cannot be moved, pulled or pushed out of this lane',
  laneNoDelay: () => 'ignores Shock and any effect that delays your place in the order',
  firstInRoundOne: () => 'acts first in round 1, before anything else on the field',
  grantTurn: v => `gives an ally ${v} extra action(s) this round`,
  pull: v => `drags the target ${v} lane(s) toward you`,
  pullAttacker: () => 'anyone who attacks you is dragged one lane forward',
  rootRounds: v => `roots the target for ${v} round(s): it cannot change lane`,
  selfRoot: () => 'you cannot change lane while this holds',
  reactionLock: () => 'the target cannot counter, reflect or retaliate',
  defIgnorePct: v => `ignores ${Math.round(v * 100)}% of the target's DEF`,
  laneFocusScale: v => `+${Math.round(v * 100)}% per previous hit into the same lane this round`,
  lifeKillScale: v => `scales with everyone this character has ever killed (+${Math.round(v * 100)}% each)`,
  laneAllyGuard: () => 'guards every ally sharing your lane',
  allyStealth: () => 'hides an ally as well as yourself',
  stealthRounds: v => `stealth holds for ${v} round(s)`,
  stealthKeepsOnHit: () => 'attacking does not break stealth',
  revealIntents: () => 'shows every hidden enemy and the skills they carry, all battle',
  onHitExposed: () => 'hits apply Exposed',
  onHitPoison: () => 'hits apply poison',
  wardPoison: () => 'anyone who strikes you is poisoned',
  exposedOnSecond: () => 'the second hit on the same target applies Exposed',
  selfBleedOnTarget: v => `costs you ${v} HP per use`,
  healAtEnd: v => `heals ${v}× at the end of the round instead of now`,
  healFromTaken: v => `heals ${Math.round(v * 100)}% of the damage you have taken this battle`,
  noReload: () => 'no reload lock: usable every round',
  rangedExtraTarget: () => 'ranged attacks strike one extra target',
  lawfulPayMult: v => `×${v} gold from lawful contracts`,
  witnessStartLevel: v => `skills you witness start at level ${v}`,
  power: v => `power ${v} (damage/heal multiplier in the formula)`,
  eleDmgMult: v => `elemental damage ×${v} (applies to elemental actives)`,
  dmgTakenMult: v => `damage taken ×${v}`,
  reflectPct: v => `reflects ${Math.round(v * 100)}% of damage taken to the attacker`,
  protectAdjacent: () => 'also covers adjacent lane allies',
  guardScope: v => `Shield Wall guard scope: ${v} — halves incoming; 100% of prevented damage hits the attacker`,
  marks: v => `marks ${v === 'lane' ? 'a whole lane' : v + ' enemy(s)'} — marked enemies must attack you`,
  retaliationPower: v => `retaliation ${v}× ATK each time a marked enemy attacks (ignores DEF)`,
  executeThreshold: v => `bonus vs targets under ${Math.round(v * 100)}% HP`,
  bonusMult: v => `bonus damage ×${v}`,
  killRefundsAction: () => 'kills refund the action (act again)',
  backLaneBonus: v => `×${v} damage while you stand in the back lane`,
  ignoreCover: () => 'ignores lane cover',
  noReflect: () => 'back-lane attacks take NO reflect damage from any source',
  openerOrStealth: () => 'usable ONLY as the opening action of an encounter, or from stealth',
  stealthOnUse: () => 'enters stealth (untargetable without See Invisibility; broken by attacking)',
  melee: () => 'counts as melee: applies and consumes Exposed',
  stackMult: v => `+${Math.round(v * 100)}% per consecutive hit on the same target`,
  maxStacks: v => `max ${v} stacks`,
  thirdHitTwice: () => 'every 3rd consecutive attack strikes twice',
  status: v => 'inflicts: ' + Object.entries(v).map(([k, s]) =>
    `${k}${s.stacks ? ' (STACKS)' : ''} ${s.power}× ATK/2 per round, ${s.rounds} rounds`).join('; '),
  defStrip: v => `strips ${v} DEF for the battle (counters Armored +${C().ARMORED_BONUS_DEF})`,
  defStripAll: () => 'strips ALL DEF for the battle',
  delayTarget: () => 'target acts later this round (SPD −4 in the order)',
  loseAction: () => 'target loses its next action',
  multiTarget: v => `chains to ${v} targets`,
  adjacent: v => `hits +${v} adjacent enemy in the lane`,
  pierceBehind: () => 'also hits the first enemy in the lane behind',
  splashAdjacent: () => 'splashes to one adjacent enemy',
  evadeNext: v => `evades the next ${v} attack(s)`,
  untargetableRounds: v => `untargetable for ${v} round(s)`,
  freeStrike: () => 'plus a free 2.0-power strike',
  counterNext: v => `negates the next ${v} attack(s) and reflects the damage`,
  thornPct: v => `reflects ${Math.round(v * 100)}% of damage taken`,
  thornScope: v => `thorns cover: ${v}`,
  rounds: v => `lasts ${v} rounds`,
  atkMult: v => `ATK ×${v}`,
  lifeSteal: v => `heals ${Math.round(v * 100)}% of damage dealt`,
  surviveLethal: () => 'survives one lethal blow per battle at 1 HP',
  laneShift: () => 'may shift lanes freely',
  dmgMult: v => `all damage dealt ×${v}`,
  healMult: v => `healing you perform ×${v}`,
  tempHpDouble: () => 'overheal converts to temp HP at DOUBLE value',
  tempHpCap: v => `temp HP cap raised to ${Math.round(v * 100)}% of max`,
  healSplashPct: v => `${Math.round(v * 100)}% of each heal also damages the nearest enemy`,
  hotRounds: v => `heal over time, ${v} rounds`,
  cures: v => `cures: ${v.join(', ')}`,
  cureCount: v => `removes ${v >= 99 ? 'ALL' : v} negative status(es)`,
  shieldHits: v => `ward blocks the next ${v} hit(s)`,
  shieldRounds: v => `ward blocks everything for ${v} round(s)`,
  wardReflect: () => 'ward reflects the blocked damage',
  doubleBelow: v => `doubled on targets under ${Math.round(v * 100)}% HP`,
  fullHealBelow: v => `FULL heal on targets under ${Math.round(v * 100)}% HP`,
  revive: () => 'revives a downed ally at 40% HP',
  oncePerBattle: () => 'once per battle',
  dualHeal: () => 'damages the enemy AND heals allies for the same amount',
  healTargets: v => `heals ${v === 'party' ? 'the whole party' : v + ' most-wounded ally(s)'}`,
  duration: v => `holds ${v} quests, then they escape at permanent Hatred`,
  cap: v => `cap ${v} — exceeding it releases/kills the oldest`,
  undeadKeepSkills: () => 'raised undead keep their skills',
  vs: v => `works against: ${v}`,
  partyApplicationBonus: () => 'bonus to party application odds',
  recruitForEncounter: () => 'charmed target fights for you this encounter',
  fleersDropLoot: () => 'frightened enemies drop loot',
  stealAll: () => 'steals from EVERY enemy in the encounter',
  executeBelow: v => `EXECUTES targets under ${Math.round(v * 100)}% HP (not bosses)`,
  healOnKillPct: v => `heals ${Math.round(v * 100)}% max HP on kill`,
  permStatGain: v => `+${v} to ALL stats permanently per kill (lost on death)`,
  turnsPerRound: v => `${v} turns per round (never shared with allies)`,
  goldMult: v => `all gold earned ×${v}`,
  healReceivedMult: v => `all healing received ×${v}`,
  overhealUncapped: () => 'overheal temp HP has NO cap',
  statusImmune: () => 'immune to all negative statuses',
  katanaFreeSlots: () => 'katana skills use no active slots',
  auraAtk: v => `party ATK ×${v}`,
  auraDef: v => `party incoming damage ÷${v}`,
  auraEvade: v => `party evade +${Math.round(v * 100)}%`,
  element: v => `element: ${v}`,
  guardRounds: v => `guard lasts ${v} rounds`,
  markRounds: v => `marks last ${v} rounds`,
  freeze: v => `FREEZES the target: loses ${v} whole turn(s); thawed targets can't re-freeze for 3 rounds`,
  shock: v => `SHOCKS: target takes +${Math.round(v * 100)}% damage from ALL sources`,
  shockRounds: v => `shock lasts ${v} rounds`,
  seal: v => `SEALS the target's ${v.join(' + ')} skills (Basic Attack never seals)`,
  sealRounds: v => `seal lasts ${v} rounds`,
  spreadLanes: () => "hits the target's lane AND both adjacent lanes",
  wardAhead: () => 'usable on allies in your lane or behind you — you shield what stands behind you',
  undeadPower: v => `vs undead: holy damage at power ${v} instead`,
  purifyRounds: v => `grants immunity to ALL negative statuses (and post-battle conscription) for ${v} rounds`,
  unraise: () => 'cast on a walking undead: restores them to LIFE, undoing the true death (never revives the ordinary dead)',
  bribeChance: v => `in battle: bribe a hostile named enemy to flee — ${Math.round(v * 100)}% odds, fee 30 + 20×rank, spent either way`,
  fireResist: v => `takes ${Math.round(v * 100)}% less fire damage`,
  fireLeech: v => `heals for ${Math.round(v * 100)}% of fire damage dealt`,
  survivalHp: v => `+${v} max HP, permanently, for every battle you come out of alive (each encounter counts)`,
  consecutive: () => 'the extra turn comes immediately after the first',
  fleeBonus: v => `+${Math.round(v * 100)}% chance to flee`,
  killHealPct: v => `each kill restores ${Math.round(v * 100)}% of max HP`,
  stackPct: v => `each kill adds +${Math.round(v * 100)}% damage for the rest of the battle (stacking)`,
  tauntRounds: v => `each kill taunts EVERY enemy onto you for ${v} rounds`,
  dotMult: v => `bleed and poison damage ×${v}`,
  dotLeech: v => `heals you for ${Math.round(v * 100)}% of bleed/poison damage dealt`,
  wageEdge: v => `hired ${v}g above your price; your hires accept ${v}g below theirs`,
  oppositeSexFriendly: () => 'the opposite sex starts at Friendly toward you',
  softJilt: () => 'people you leave stay Friendly instead of hating you',
  targetedLast: () => 'enemies attack your party before you whenever they can',
  iceArmorPerHit: v => `each ice hit dealt: +${Math.round(v * 100)}% stacking damage reduction (cap 50%, whole battle)`,
  // ---- campaign primitives (campaign doc §13)
  effect: v => ({ mark: 'MARK: the target takes extra damage from you while marked', contractMark: 'CONTRACT MARK: every ally deals bonus damage to the target',
    ghoststep: 'GHOSTSTEP: enter stealth and shift lanes', unseenGuard: 'UNSEEN GUARD: the warded ally cannot be targeted while you stay in stealth',
    venomDraw: 'VENOM DRAW: pulls every DOT off the target and re-applies them all at once', lastBreath: 'LAST BREATH: revive at low HP with a burst of temp HP',
    share: 'SHARE: damage taken is split with the linked ally(s)', paidInFull: 'PAID IN FULL: bonus damage scaled by the gold you carry (x ATK)',
    companyMedic: 'COMPANY MEDIC: heals the party, most wounded first', dispel: 'DISPEL: strips every buff from the target' }[v] || `effect: ${v}`),
  stealthOnKill: () => 'a kill re-enters stealth for 2 rounds',
  silent: () => 'silent: does not break stealth',
  hits: v => `${v} separate hits`,
  chainDecay: v => `each chained hit does ×${v} of the last`,
  randomElemental: () => 'element rolled each cast (fire/ice/lightning) with its status',
  stripGuards: () => 'removes guards, wards and taunts from the target',
  stealBuff: () => 'steals one buff from the target',
  silence: v => `SILENCE: target cannot use actives for ${v} round(s)`,
  withering: v => `WITHERING: healing received ×${v.mult || 0.5} for ${v.rounds} round(s)`,
  healcutRounds: v => `target receives NO healing for ${v} round(s)`,
  runic: () => 'runic: ignores wards',
  selfWardPct: v => `wards yourself for ${Math.round(v * 100)}% of the damage dealt`,
  laneBuff: v => `lane buff: ${v.kind} ×${v.mult} for ${v.rounds} round(s) on your whole lane`,
  reveal: () => "reveals the next encounter's composition (Scout's Cut)",
  revealHp: () => 'shows exact enemy HP numbers',
  revealLoadouts: () => 'shows enemy skill loadouts before the encounter (Case the Room)',
  revealPerks: () => 'shows enemy perks',
  revealContracts: () => 'shows exact payouts and every encounter before accepting a contract',
  seeInvis: () => 'sees stealthed enemies',
  selfStatus: v => `on self: ${v.kind} ×${v.mult || ''} ${v.rounds} round(s)`,
  partyStatus: v => `on the party: ${Object.keys(v).join(', ')}`,
  allyStatus: v => `on the ally: ${Object.keys(v).join(', ')}`,
  laneStatus: v => `on the lane: ${Object.keys(v).join(', ')}`,
  hazard: v => `lays a ${v.kind} hazard on the lane (${v.rounds} rounds, ${v.power}× ATK)`,
  interrupt: () => 'INTERRUPT: cancels the target\'s planned action this round',
  grantEvade: v => `the healed ally evades the next ${v} attack(s)`,
  wardAll: () => 'wards the whole party',
  shareWith: v => `shares with: ${v}`,
  mult: v => `×${v}`,
  levelMult: v => `levels ${v}× faster`,
  passive: () => 'passive: costs no action',
  betweenHealPct: v => `+${Math.round(v * 100)}% max HP healed between encounters for the whole party`,
  autoFlee: () => 'fleeing succeeds automatically once per quest',
  wageDiscount: v => `hires accept wages as if ${Math.round(v * 100)}% richer`,
  followerDef: v => `conscripts and summons gain +${v} DEF`,
  killGold: v => `+${v}g per kill (Corpse Work)`,
  // scalers: how the number grows
  killStreakScale: v => `+${Math.round(v * 100)}% per kill this battle`,
  idleScale: v => `+${Math.round(v * 100)}% per round the target has not acted`,
  encounterScale: v => `+${Math.round(v * 100)}% per encounter into the quest`,
  castScale: v => `+${Math.round(v * 100)}% per previous cast this battle`,
  tierScale: v => `+${Math.round(v * 100)}% per quest tier`,
  alliesBetweenScale: v => `+${Math.round(v * 100)}% per ally standing between you and the target`,
  buffCountScale: v => `+${Math.round(v * 100)}% per buff on the target`,
  flankScale: v => `+${Math.round(v * 100)}% per ally attacking the same target this round`,
  laneStreakScale: v => `+${Math.round(v * 100)}% per round you have held your lane`,
  distanceScale: v => `+${Math.round(v * 100)}% per lane of distance to the target`,
};
const SKIP_KEYS = new Set(['name', 'note', 'tiers', 'id', 'kind', 'archetype', 'desc',
  'target', 'reach', 'offensive', 'heal', 'elemental', 'universal', 'unique', 'noSlot',
  'forbidden', 'social', 'warning', 'katana', 'noTierGrowth', 'faction', 'campaign', 'tier']);

function paramLines(data) {
  const out = [];
  for (const [k, v] of Object.entries(data)) {
    if (SKIP_KEYS.has(k) || v == null || v === false) continue;
    const f = PARAM_LABEL[k];
    out.push('  · ' + (f ? f(v) : `${k}: ${JSON.stringify(v)}`));
  }
  return out;
}

const SkillInfo = {
  // ch may be null (creation screen): formula shown with example ATK 10.
  describe(ch, skillId) {
    const sk = ADV.DATA.SKILLS[skillId];
    if (!sk) return null;
    const L = [];
    const entry = ch ? (ch.perks.find(e => e.skillId === skillId) || ch.actives.find(e => e.skillId === skillId)) : null;
    const rec = ch && !entry ? (ch.skillLevels || {})[skillId] : null;
    const level = entry ? entry.level : rec ? rec.level : 1;
    const effLevel = ch ? ADV.SkillSys.effectiveLevel(ch, skillId, level) : level;
    const tier = ADV.SkillSys.tierForLevel(effLevel);
    const tierMult = sk.noTierGrowth ? 1.0 : C().TIER_MULT[tier];
    const data = Object.assign({}, sk, sk.tiers[tier]);

    L.push(`${sk.name}  [${sk.kind}${sk.archetype ? ' · ' + sk.archetype : sk.social ? ' · social (' + sk.social + ')' : ''}${sk.unique ? ' · UNIQUE' : ''}${sk.forbidden ? ' · FORBIDDEN' : ''}]`);
    L.push(sk.desc || '');
    L.push('');
    if (entry || rec) {
      const uses = entry ? entry.uses : rec.uses;
      const toNext = C().USES_PER_LEVEL - (uses % C().USES_PER_LEVEL);
      L.push(`level ${level} (${uses} uses, ${toNext} to next) → manifests as ${tier.toUpperCase()}: ${data.name}`);
      if (effLevel > level) L.push(`  gear set floors this to level ${effLevel}`);
    } else {
      L.push(`unlearned — starts level 1 (BASIC). ${C().USES_PER_LEVEL} uses per level; Intermediate at ${C().TIER_THRESHOLDS.intermediate}, Advanced at ${C().TIER_THRESHOLDS.advanced}.`);
    }

    // targeting
    if (sk.kind === 'active') {
      const tgt = data.target || 'enemy';
      const reach = data.reach === 'front' ? 'front lane only (melee, blocked by cover)' :
        data.reach === 'back' ? 'rearmost non-front enemy lane only' : 'any lane';
      L.push(`targets: ${tgt} · reach: ${reach}`);
    }

    // formula with real numbers
    const atk = ch ? ADV.Character.effStat(ch, 'atk') : 10;
    if (data.power > 0 && !data.heal) {
      const raw = Math.round(atk * data.power * tierMult * (1 + effLevel * C().LEVEL_DAMAGE_SCALAR));
      L.push(`damage = round(ATK ${atk} × power ${data.power} × tier ×${tierMult} × (1 + ${effLevel}×0.015)) − targetDEF`);
      L.push(`       = ${raw} − DEF  (vs DEF 10 → ${Math.max(1, raw - 10)}; minimum 1)`);
    }
    if (data.heal && data.power > 0) {
      const raw = Math.round(atk * data.power * tierMult * (1 + effLevel * C().LEVEL_DAMAGE_SCALAR));
      L.push(`heal = round(ATK ${atk} × ${data.power} × ×${tierMult} × (1 + ${effLevel}×0.015)) = ${raw} (no DEF; overheal → temp HP, cap ${Math.round(C().OVERHEAL_CAP_PCT * 100)}%)`);
    }

    // current-tier parameters (the backend truth)
    const pl = paramLines(data);
    if (pl.length) { L.push('this tier does:'); L.push(...pl); }

    // offensive mode
    if (sk.offensive) {
      L.push(`hostile mode — ${sk.offensive.name}:`);
      const ol = paramLines(sk.offensive);
      L.push(...(ol.length ? ol : ['  · ' + JSON.stringify(sk.offensive)]));
    }

    // other tiers, compact
    for (const tname of ['basic', 'intermediate', 'advanced']) {
      if (tname === tier || sk.noTierGrowth) continue;
      const td = Object.assign({}, sk, sk.tiers[tname]);
      const diffs = paramLines(sk.tiers[tname]);
      L.push(`${tname} (×${C().TIER_MULT[tname]}): ${td.name}${diffs.length ? ' — ' + diffs.map(s => s.replace('  · ', '')).join('; ') : ''}`);
    }

    if (sk.forbidden) L.push(`⚠ ${sk.warning} Using it builds toward Divine Intervention.`);
    if (sk.universal) L.push('universal: no slot, never learned, never witnessed, never improves.');
    if (sk.unique) L.push('unique tier: never witnessable, never learnable.');
    return L.filter(s => s !== null).join('\n');
  },
};

ADV.Tooltip = Tooltip;
ADV.SkillInfo = SkillInfo;
})();
