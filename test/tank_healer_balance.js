// Tank + healer vs a full enemy party: no 4-skill kit at the same tier
// should drop the tank before turn 7.
'use strict';
const { load } = require('./harness.js');
load();

const HOLD_ROUNDS = 7;
const PARTY_SIZE = 4;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const LVL = { basic: 1, intermediate: TH.intermediate, advanced: TH.advanced };
const TANK_SKILLS = ['bulwark', 'shield_wall', 'taunt', 'stand_fast'];
const HEALER_SKILLS = ['devoted', 'mend', 'cleanse', 'regenerate', 'guardian_ward', 'triage', 'raise', 'blood_pact'];

const args = process.argv.slice(2).reduce((o, a) => {
  const m = /^--([^=]+)=(.*)$/.exec(a);
  if (m) o[m[1]] = m[2];
  else if (a.startsWith('--')) o[a.slice(2)] = true;
  return o;
}, {});
const ONLY_TIER = args.tier || null;
const QUICK = !!args.quick;

function give(ch, ids, level) {
  ch.perkCap = 8;
  ch.activeCap = 12;
  for (const id of ids) {
    const sk = ADV.DATA.SKILLS[id];
    if (!sk) continue;
    const bag = sk.kind === 'perk' ? ch.perks : ch.actives;
    if (!bag.some(e => e.skillId === id)) bag.push({ skillId: id, level, uses: 0 });
  }
}

function persona(ch) {
  ch.personality = { aggression: 95, greed: 20, caution: 0, loyalty: 80, pride: 80 };
  ch.status = 'hero';
  ch.isPlayer = true; // we drive every act; skip Combat.planFor
}

function makeTank(level) {
  const ch = ADV.Character.base({
    name: 'Bulwark', sex: 'm',
    stats: { hp: 110, atk: 8, def: 12, spd: 10 },
    archetypeInclination: ['tank'],
  });
  persona(ch);
  give(ch, TANK_SKILLS, level);
  return ch;
}

function makeHealer(level) {
  const ch = ADV.Character.base({
    name: 'Chantry', sex: 'f',
    stats: { hp: 100, atk: 10, def: 10, spd: 11 },
    archetypeInclination: ['healer'],
  });
  persona(ch);
  give(ch, HEALER_SKILLS, level);
  return ch;
}

function makeEnemy(i, skills, level) {
  const ch = ADV.Character.base({
    name: 'Foe' + (i + 1), sex: 'm',
    stats: { hp: 100, atk: 10, def: 10, spd: 10 },
    archetypeInclination: [((ADV.DATA.SKILLS[skills[0]] || {}).archetype) || 'fighter'],
  });
  persona(ch);
  give(ch, skills, level);
  return ch;
}

function isKillSkill(id) {
  const sk = ADV.DATA.SKILLS[id];
  if (!sk || sk.unique || sk.universal || sk.forbidden || sk.social) return false;
  if (sk.turnsPerRound > 1) return true;
  if (sk.kind === 'perk') {
    const t = Object.assign({}, sk, sk.tiers && sk.tiers.basic);
    return !!(t.eleDmgMult || t.dotMult || t.executeThreshold || t.backLaneBonus
      || t.stackMult || t.dmgMult || t.fireLeech || t.bonusHpPct || sk.turnsPerRound);
  }
  if (sk.power > 0 || sk.stun) return true;
  if (sk.offensive && (sk.offensive.power || sk.offensive.dotRounds || sk.offensive.healReduction)) return true;
  const t = Object.assign({}, sk, sk.tiers && sk.tiers.basic);
  return !!(t.status || t.freeze || t.stun || t.shock || t.withering || t.healcutRounds || t.atkMult);
}

function coreSkillIds() {
  const ids = new Set();
  for (const pack of Object.values(ADV.DATA.ARCHETYPE_SKILLS || {})) {
    if (pack.perk) ids.add(pack.perk);
    for (const id of pack.actives || []) ids.add(id);
  }
  for (const id of ['pyromaniac', 'ice_queen', 'lightning_king', 'septic_sanguine',
    'arena_champion', 'venom_fang', 'ember_lash', 'rime_grasp', 'wither_touch']) ids.add(id);
  return [...ids].filter(id => ADV.DATA.SKILLS[id]);
}

function combosOf(list, k) {
  const out = [];
  const n = list.length;
  const idx = Array.from({ length: k }, (_, i) => i);
  function push() { out.push(idx.map(i => list[i])); }
  if (n < k) return out;
  push();
  while (true) {
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    push();
  }
  return out;
}

function dotted(u) { return u.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'); }
function locked(u) { return u.statuses.some(s => s.kind === 'frozen'); }
function antiHeal(u) { return u.statuses.some(s => s.kind === 'withering' || s.kind === 'healcut'); }

function trySkill(st, u, id, prefer, offensive) {
  if (!u.ch.actives.some(e => e.skillId === id) && !u.ch.perks.some(e => e.skillId === id)) return null;
  if (ADV.Combat.cooldownLeft(u, id) > 0) return null;
  const m = ADV.Combat.manifestFor(u, id);
  if (!m || !m.data || m.data.selfRevive) return null;
  const pool = ADV.Combat.validTargets(st, u, id, !!offensive);
  if (!pool.length) return null;
  const t = prefer && pool.includes(prefer) ? prefer : pool[0];
  return { kind: 'skill', skillId: id, targetUid: t.uid, offensiveMode: !!offensive };
}

function allyAct(st, u, tank) {
  const ids = u.ch.actives.map(e => e.skillId);
  const healer = st.units.find(x => x.side === 'a' && x !== tank && !x.downed);
  if (ids.includes('raise') && tank && tank.downed) {
    const a = trySkill(st, u, 'raise', tank);
    if (a) return a;
  }
  if (ids.includes('taunt')) {
    const foes = ADV.Combat.living(st, 'b').filter(f => !f.marksBy.includes(u.uid));
    if (foes.length) {
      const a = trySkill(st, u, 'taunt', foes[0]);
      if (a) return a;
    }
  }
  if (ids.includes('shield_wall') && !u.statuses.some(s => s.kind === 'guard')) {
    const a = trySkill(st, u, 'shield_wall', u);
    if (a) return a;
  }
  const patients = [tank, healer].filter(x => x && !x.downed);
  const needHelp = patients.filter(p => p.chp / p.maxHp < 0.85 || dotted(p) || antiHeal(p) || locked(p));
  needHelp.sort((a, b) => (a.chp / a.maxHp) - (b.chp / b.maxHp));
  if (needHelp.length) {
    for (const id of ['mend', 'triage', 'regenerate', 'blood_pact', 'guardian_ward']) {
      const a = trySkill(st, u, id, needHelp[0], false);
      if (a) return a;
    }
  }
  if (tank && !tank.downed && !tank.statuses.some(s => s.kind === 'ward' || s.kind === 'guard')) {
    const a = trySkill(st, u, 'guardian_ward', tank);
    if (a) return a;
  }
  const melee = ADV.Combat.validTargets(st, u, 'basic_attack', false);
  if (melee.length) return { kind: 'attack', targetUid: melee[0].uid };
  return { kind: 'hold' };
}

function enemyAct(st, u, tank, healer) {
  const ids = u.ch.actives.map(e => e.skillId);
  const focus = (tank && !tank.downed) ? tank : healer;
  if (healer && !healer.downed && !locked(healer)) {
    for (const id of ids) {
      const m = ADV.Combat.manifestFor(u, id);
      if (m && m.data && (m.data.freeze || m.data.stun)) {
        const a = trySkill(st, u, id, healer);
        if (a) return a;
      }
    }
  }
  if (focus && !antiHeal(focus)) {
    for (const id of ids) {
      const m = ADV.Combat.manifestFor(u, id);
      if (m && m.data && (m.data.withering || m.data.healcutRounds)) {
        const a = trySkill(st, u, id, focus);
        if (a) return a;
      }
    }
  }
  if (focus && !dotted(focus)) {
    for (const id of ids) {
      const m = ADV.Combat.manifestFor(u, id);
      const hasDot = m && m.data && m.data.status && (m.data.status.poison || m.data.status.bleed);
      const offDot = m && m.data && m.data.offensive && /poison|bleed/i.test(m.data.offensive.name || '');
      if (hasDot) {
        const a = trySkill(st, u, id, focus);
        if (a) return a;
      }
      if (offDot) {
        const a = trySkill(st, u, id, focus, true);
        if (a) return a;
      }
    }
  }
  if (ids.includes('beast_shape') && !u.statuses.some(s => s.kind === 'beastShape' || s.kind === 'atkBuff')) {
    const a = trySkill(st, u, 'beast_shape', u);
    if (a) return a;
  }
  let best = null, bestPower = -1;
  for (const id of ids) {
    const m = ADV.Combat.manifestFor(u, id);
    if (!m || !m.data) continue;
    const d = m.data;
    const off = d.heal && d.offensive;
    const power = off ? (d.offensive.power || 0) : (d.power || 0);
    if (power <= 0 && !d.shock && !d.executeBelow) continue;
    const a = trySkill(st, u, id, focus, !!off);
    if (a && power >= bestPower) { best = a; bestPower = power; }
  }
  if (best) return best;
  if (focus) {
    const pool = ADV.Combat.validTargets(st, u, 'basic_attack', false);
    if (pool.includes(focus)) return { kind: 'attack', targetUid: focus.uid };
    if (pool.length) return { kind: 'attack', targetUid: pool[0].uid };
  }
  return { kind: 'hold' };
}

function play(st, tank) {
  let downRound = null;
  let guard = 0;
  const healer = st.units.find(u => u.side === 'a' && u !== tank);
  while (!st.over && guard++ < 400) {
    if (st.round > HOLD_ROUNDS) break;
    const turn = ADV.Combat.currentTurn(st);
    if (!turn) break;
    if (tank.downed) { downRound = downRound == null ? st.round : downRound; break; }
    const hp0 = tank.chp;
    const act = turn.unit.side === 'a' ? allyAct(st, turn.unit, tank) : enemyAct(st, turn.unit, tank, healer);
    const r = ADV.Combat.act(st, turn.unit, act || { kind: 'hold' });
    if (args.kit) {
      const dots = (u) => (u.statuses || []).filter(s => s.kind === 'poison' || s.kind === 'bleed').length;
      console.log('   R' + st.round, turn.unit.ch.name, (act && (act.skillId || act.kind)), 'T', hp0 + '->' + tank.chp + (tank.downed ? ' DOWN' : ''), 'Td' + dots(tank), healer ? ('H' + healer.chp + ' Hd' + dots(healer)) : '');
    }
    if (r && r.refund) {
      const again = turn.unit.side === 'a' ? allyAct(st, turn.unit, tank) : enemyAct(st, turn.unit, tank, healer);
      ADV.Combat.act(st, turn.unit, again || { kind: 'hold' });
    }
    if (tank.downed) { downRound = st.round; break; }
    ADV.Combat.advance(st);
  }
  return downRound;
}

function fight(tier, skills) {
  const level = LVL[tier];
  const tank = makeTank(level);
  const healer = makeHealer(level);
  const foes = [];
  for (let i = 0; i < PARTY_SIZE; i++) foes.push(makeEnemy(i, skills, level));
  const st = ADV.Combat.create([tank, healer], foes, { rng: new ADV.RNG(7) });
  const tankU = st.units.find(u => u.ch === tank);
  const downRound = play(st, tankU);
  return { downRound, over: st.over, winner: st.winner, round: st.round, tankHp: tankU.chp, tankDown: tankU.downed };
}

function runTier(tier, kits) {
  const fails = [];
  let worst = null;
  const t0 = Date.now();
  for (let i = 0; i < kits.length; i++) {
    const r = fight(tier, kits[i]);
    if (args.kit) console.log('   result', tier, r);
    if (r.downRound != null && r.downRound < HOLD_ROUNDS) {
      const rec = { skills: kits[i].slice(), downRound: r.downRound };
      fails.push(rec);
      if (!worst || rec.downRound < worst.downRound) worst = rec;
    }
    if (!QUICK && (i + 1) % 3000 === 0) {
      console.log('   … ' + tier + ' ' + (i + 1) + '/' + kits.length + ' (' + (Date.now() - t0) + 'ms, fails ' + fails.length + ')');
    }
  }
  return { fails, worst, n: kits.length };
}

const pool = coreSkillIds().filter(isKillSkill).sort();
const allKits = combosOf(pool, 4);
const deadly = [
  ['lightning_king', 'backstab', 'aimed_shot', 'fire_bolt'],
  ['lightning_king', 'cleave', 'dual_swords', 'mace_swing'],
  ['frost_touch', 'rime_grasp', 'wither_touch', 'cleanse'],
  ['venom_fang', 'septic_sanguine', 'opportunist', 'backstab'],
  ['spark', 'arcane_focus', 'lightning_king', 'fire_bolt'],
  ['cleanse', 'wither_touch', 'aimed_shot', 'sunder'],
  ['mace_swing', 'frost_touch', 'wither_touch', 'venom_fang'],
  ['cleave', 'momentum', 'dual_swords', 'sunder'],
  ['aimed_shot', 'marksman', 'snare', 'ember_lash'],
  ['blood_pact', 'regenerate', 'mend', 'cleanse'],
  ['beast_shape', 'wild_form', 'cleave', 'dual_swords'],
  ['aimed_shot', 'beast_shape', 'lightning_king', 'opportunist'],
  ['aimed_shot', 'beast_shape', 'marksman', 'opportunist'],
  ['aimed_shot', 'beast_shape', 'dual_swords', 'marksman'],
  ['aimed_shot', 'marksman', 'momentum', 'wild_form'],
  ['arcane_focus', 'beast_shape', 'dual_swords', 'lightning_king'],
  ['mace_swing', 'marksman', 'septic_sanguine', 'venom_fang'],
  ['beast_shape', 'dual_swords', 'lightning_king', 'momentum'],
  ['frost_touch', 'momentum', 'regenerate', 'septic_sanguine'],
  ['aimed_shot', 'cleave', 'marksman', 'momentum'],
  ['aimed_shot', 'beast_shape', 'frost_touch', 'marksman'],
  ['beast_shape', 'cleave', 'momentum', 'rime_grasp'],
  ['cleave', 'momentum', 'opportunist', 'wild_form'],
  ['frost_touch', 'marksman', 'momentum', 'snare'],
  ['aimed_shot', 'beast_shape', 'opportunist', 'venom_fang'],
  ['aimed_shot', 'marksman', 'opportunist', 'venom_fang'],
  ['beast_shape', 'dual_swords', 'opportunist', 'venom_fang'],
  ['dual_swords', 'lightning_king', 'opportunist', 'venom_fang'],
].filter(s => s.every(id => ADV.DATA.SKILLS[id]));

const kits = args.kit ? [String(args.kit).split(',')] : (QUICK ? deadly : allKits);
const tiers = ONLY_TIER ? [ONLY_TIER] : ['basic', 'intermediate', 'advanced'];

let pass = 0, fail = 0;
function ok(c, m, extra) {
  if (c) { pass++; console.log('  ok  ' + m); }
  else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); }
}

console.log('kill-skill pool (' + pool.length + '): ' + pool.join(', '));
console.log('kits this run: ' + kits.length + (QUICK ? ' (quick deadly set)' : ''));

const report = {};
for (const tier of tiers) {
  const t0 = Date.now();
  const r = runTier(tier, kits);
  report[tier] = r;
  const ms = Date.now() - t0;
  ok(r.fails.length === 0,
    tier + ': tank lives 7 rounds vs every 4-skill kit (' + r.n + ' fights, ' + ms + 'ms)',
    r.fails.length + ' failed; fastest kill R' + (r.worst && r.worst.downRound) + ' ' + (r.worst && r.worst.skills.join('+')));
  if (r.fails.length) {
    const shown = r.fails.slice().sort((a, b) => a.downRound - b.downRound).slice(0, 12);
    for (const f of shown) console.log('    R' + f.downRound + '  ' + f.skills.join(' + '));
    if (r.fails.length > shown.length) console.log('    … ' + (r.fails.length - shown.length) + ' more');
  }
}

if (typeof process !== 'undefined') {
  process.exitCode = fail ? 1 : 0;
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  console.log('BALANCE_FAIL');
  for (const tier of tiers) {
    const r = report[tier];
    if (r && r.worst) console.log(tier + '_worst=' + r.worst.skills.join(',') + ' R' + r.worst.downRound + ' n=' + r.fails.length);
  }
}
