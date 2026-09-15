// Sustain audit: measures heals, guards, wards, forms and defensive utility in the live
// combat engine — the half of the roster the damage arena (tools/balance_audit.js) reads badly.
//
//   node tools/sustain_audit.js                  # table of every sustain skill, by tier
//   node tools/sustain_audit.js --json out.json
//   node tools/sustain_audit.js --only=mend,triage
//   node tools/sustain_audit.js --cat=heal        # heal | guard | form | util | perk
//
// Why a second arena. The damage arena scores healing as "HP that actually landed", which
// caps at however hurt the one ally happens to be — a 600-point heal and a 200-point heal
// both read as 180 when the ally is only missing 180. It scores guarding as damage the
// CASTER avoided, so a skill that protects the party reads as zero. And it ends when the
// dummies die, which flatters anything that kills fast and starves anything that pays off
// over time.
//
// Method. A party of four (a caster and three allies, all 600 HP, all starting at half
// health so heals always have room) stands against three attackers with effectively
// unlimited health, so the beating is constant and the fight never ends early. Everyone on
// the party's side fights: allies basic-attack, the caster uses its one skill whenever it
// can and basic-attacks otherwise. Twelve rounds, fixed.
//
// The score is effective HP: health the skill put back (counted as it lands, so overheal is
// worth nothing) plus health that never came off compared with the same fight run with no
// skill at all, less a flat charge for every body that still hit the floor. Healing, wards,
// evasion, damage reduction, a taunt that moves blows onto someone who can take them, and a
// revive all reduce to the same unit: HP the party got out of the skill. Damage dealt is
// reported alongside from the same run, so forms and hybrid kits read on both axes without a
// second fight.
'use strict';
(function main() {
const fs = require('fs');
const { load } = require('../test/harness.js');
const ADV = load();
const SK = ADV.DATA.SKILLS;
const Cb = ADV.Combat;
const Ch = ADV.Character;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const TIERS = [['basic', 1], ['intermediate', TH.intermediate], ['advanced', TH.advanced]];
// Calibrated so the baseline party survives all twelve rounds on fumes (288 of 3000 HP,
// one body down): enough beating that healing always has room, not so much that the fight
// ends early and flatters whatever happened before the wipe.
let ROUNDS = 12;
let PARTY_HP = 600;
let START_PCT = 0.5;
let FOE_ATK = 16;
let FOE_COUNT = 3;

const args = process.argv.slice(2).reduce((o, a) => { const m = /^--([^=]+)=(.*)$/.exec(a); if (m) o[m[1]] = m[2]; else if (a.startsWith('--')) o[a.slice(2)] = true; return o; }, {});
const ONLY = args.only ? new Set(args.only.split(',')) : null;
if (args.rounds) ROUNDS = +args.rounds;
if (args.foeatk) FOE_ATK = +args.foeatk;
if (args.foes) FOE_COUNT = +args.foes;
if (args.startpct) START_PCT = +args.startpct;

const HIRO = new Set(['katana_slash', 'counter_attack', 'finisher']);

// Which skills this arena is the right instrument for. Social and economic perks (persuade,
// rich, silent_trade) have no combat lane and are not measured here or anywhere.
const SOCIAL = /^(lookism|devoted|persuade|charm|intimidate|sneak|rich|case_the_room|quiet_word|silent_trade|fifty_names|sixty_years|the_clan_watches|shares_and_plunder|colours_and_papers|kings_commission|paid_in_full|contract_mark|contract_bound|conscript|true_rest|reading_the_tally|chart_the_water|corpse_work|carrion_sense)$/;
function categorise(id) {
  const s = SK[id];
  const tiers = s.tiers ? TIERS.map(([t]) => Object.assign({}, s, s.tiers[t])) : [s];
  const any = k => tiers.some(t => t[k] != null && t[k] !== false);
  if (any('heal') || any('revive') || any('hotRounds') || any('healFromTaken') || any('killHealPct') || any('healOnKillPct') || any('healPct')) return 'heal';
  if (/_form$|bond$|_shape$|_stance$/.test(id) || any('form')) return 'form';
  if (any('dmgTakenMult') || any('reflectPct') || any('guardRounds') || any('shieldPct') || any('wardPct') || any('evadePct') || any('protectAdjacent') || any('tauntRounds') || any('barrier') || any('absorb')) return 'guard';
  if (tiers.some(t => (t.power || 0) > 0)) return 'damage';
  return 'util';
}

function arena(skillId, level, asPerk) {
  const rng = new ADV.RNG(17);
  const mk = (name, atk, spd) => {
    const c = Ch.base({ name, stats: { hp: PARTY_HP, atk, def: 10, spd } });
    c.isPlayer = name === 'Caster';
    return c;
  };
  const a = mk('Caster', 18, 15);
  const entry = { skillId, level, uses: level * 10 };
  if (skillId) { if (asPerk) a.perks = [entry]; else a.actives = [entry]; }
  const allies = [mk('Ally1', 12, 12), mk('Ally2', 12, 9), mk('Ally3', 12, 7)];
  a.stats.hp = PARTY_HP / 2;            // the caster is the player: easy doubles it back to PARTY_HP
  // Three attackers that never fall over: the pressure is the constant, not the clock.
  const foes = Array.from({ length: FOE_COUNT }, (_, i) => {
    const e = Ch.base({ name: 'Striker' + i, stats: { hp: 999999, atk: FOE_ATK, def: 10, spd: 6 + i } });
    e.isMonster = true; e.enemyTypeId = 'dummy';
    return e;
  });
  const st = Cb.create([a].concat(allies), foes, { rng });
  for (const u of st.units) if (u.side === 'a') u.chp = Math.round(u.maxHp * START_PCT);
  return { st, ua: st.units.find(u => u.ch === a), party: st.units.filter(u => u.side === 'a'), foes: st.units.filter(u => u.side === 'b') };
}

function run(skillId, level, asPerk) {
  const { st, ua, party, foes } = arena(skillId, level, asPerk);
  const startFoeHp = foes.reduce((s, u) => s + u.chp, 0);
  let uses = 0, usedOnce = false, guard = 0;
  // Effective healing is measured as it lands, unit by unit, so overheal counts for nothing
  // and a long fight does not flatten into "everyone ended full".
  let restored = 0;
  const seen = {};
  for (const u of party) seen[u.uid] = u.downed ? 0 : u.chp;
  const tally = () => { for (const u of party) { const now = u.downed ? 0 : Math.max(0, u.chp); if (now > seen[u.uid]) restored += now - seen[u.uid]; seen[u.uid] = now; } };
  const n0 = st.events.length;
  while (!st.over && st.round <= ROUNDS && guard++ < 600) {
    const t = Cb.currentTurn(st); if (!t) break;
    const u = t.unit;
    if (u === ua) {
      let done = false;
      if (skillId && !asPerk) {
        const sk = SK[skillId];
        const m = Cb.manifestFor(ua, skillId);
        const d = m ? m.data : {};
        const offensive = /enemy/i.test(sk.target || '') || /enemy/i.test(d.target || '');
        const isHeal = !!(d.heal || d.revive || sk.heal || d.hotRounds);
        // policy: attacks and heals every turn they are legal; stances, wards, forms and
        // buffs once, then the caster fights on under them — that is how they are played.
        const sticky = !offensive && !isHeal;
        const want = sticky ? !usedOnce : true;
        let pool = [];
        if (want) { try { pool = Cb.validTargets(st, ua, skillId, false); } catch (e) { pool = []; } }
        let off = false;
        if (want && !pool.length && sk.offensive) { try { pool = Cb.validTargets(st, ua, skillId, true); off = true; } catch (e) { pool = []; } }
        if (pool.length) {
          let tgt = pool[0];
          const downed = pool.find(x => x.side === 'a' && x.downed);
          const hurt = pool.filter(x => x.side === 'a' && !x.downed).sort((x, y) => (x.chp / x.maxHp) - (y.chp / y.maxHp))[0];
          if (d.revive && downed) tgt = downed;
          else if (isHeal && hurt) tgt = hurt;
          else if (offensive) { const foe = pool.find(x => x.side === 'b' && !x.downed); if (foe) tgt = foe; }
          try { const r = Cb.act(st, ua, { kind: 'skill', skillId, targetUid: tgt.uid, offensiveMode: off }); if (r && r.ok) { done = true; uses++; usedOnce = true; } } catch (e) { done = false; }
        }
      }
      if (!done) {
        const bv = Cb.validTargets(st, ua, 'basic_attack');
        if (bv.length) Cb.act(st, ua, { kind: 'attack', targetUid: bv[0].uid }); else Cb.act(st, ua, { kind: 'defend' });
      }
    } else if (u.side === 'a') {
      const bv = Cb.validTargets(st, u, 'basic_attack');
      if (bv.length) Cb.act(st, u, { kind: 'attack', targetUid: bv[0].uid }); else Cb.act(st, u, { kind: 'defend' });
    } else {
      // spread the beating across the party so guarding one body is not the whole answer
      const alive = st.units.filter(x => x.side === 'a' && !x.downed);
      const bv = Cb.validTargets(st, u, 'basic_attack');
      const want = alive.length ? alive[(st.round + foes.indexOf(u)) % alive.length] : null;
      const pick = want && bv.includes(want) ? want : bv[0];
      if (pick) Cb.act(st, u, { kind: 'attack', targetUid: pick.uid }); else Cb.act(st, u, { kind: 'defend' });
    }
    tally();
    Cb.advance(st);
  }
  tally();
  const partyHp = party.reduce((s, u) => s + (u.downed ? 0 : Math.max(0, u.chp)), 0);
  const downs = party.filter(u => u.downed).length;
  const dealt = startFoeHp - foes.reduce((s, u) => s + Math.max(0, u.chp), 0);
  const ids = new Set(party.map(u => u.uid));
  let taken = 0;
  for (const e of st.events.slice(n0)) if (e.t === 'damage' && ids.has(e.uid)) taken += e.dmg || 0;
  return { partyHp, downs, dealt, uses, restored, taken, rounds: st.round };
}

const BASE = run(null, 1, false);
// Effective HP a skill is worth over a fight: health it put back (overheal excluded) plus
// health that never came off, less a flat charge for every body that still hit the floor.
const DOWN_COST = 400;
function score(r) {
  const avoided = BASE.taken - r.taken;
  return { restored: r.restored, avoided, downs: r.downs,
    total: r.restored + avoided - (r.downs - BASE.downs) * DOWN_COST,
    dealt: r.dealt - BASE.dealt };
}
module.exports = { run, score, BASE, TIERS, HIRO, categorise, SOCIAL, ROUNDS, PARTY_HP, DOWN_COST };
if (require.main !== module) return;

const rows = [];
for (const id of Object.keys(SK)) {
  if (ONLY && !ONLY.has(id)) continue;
  const sk = SK[id];
  if (HIRO.has(id) || sk.target === 'postVictory' || SOCIAL.test(id)) continue;
  const cat = categorise(id);
  if (args.cat && cat !== args.cat) continue;
  const row = { id, name: sk.name, kind: sk.kind, cat, src: sk.campaign2 ? 'campaign2' : sk.campaign ? 'campaign' : sk.monster ? 'monster' : 'core', tiers: {} };
  for (const [tier, level] of TIERS) {
    let r;
    try { r = run(id, level, sk.kind === 'perk'); } catch (e) { row.tiers[tier] = { error: e.message.slice(0, 50) }; continue; }
    row.tiers[tier] = Object.assign({ level, uses: r.uses }, score(r));
  }
  rows.push(row);
}

const med = arr => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const groups = {};
for (const row of rows) for (const [tier] of TIERS) {
  const t = row.tiers[tier]; if (!t || t.error) continue;
  const key = row.cat + ':' + tier;
  (groups[key] = groups[key] || []).push(t.total);
}
const medians = {}; for (const k of Object.keys(groups)) medians[k] = med(groups[k].filter(v => v > 0));
for (const row of rows) for (const [tier] of TIERS) { const t = row.tiers[tier]; if (t && !t.error) t.rel = medians[row.cat + ':' + tier] ? +(t.total / medians[row.cat + ':' + tier]).toFixed(2) : 0; }

if (args.json) fs.writeFileSync(args.json, JSON.stringify({ base: BASE, medians, rows }, null, 1));

const pad = (s, n) => String(s).padEnd(n);
const num = v => (v == null ? '-' : Math.round(v)).toString().padStart(6);
console.log('baseline: party ends on %d hp (%d down), took %d, restored %d, dealt %d, over %d rounds', BASE.partyHp, BASE.downs, BASE.taken, BASE.restored, BASE.dealt, ROUNDS);
console.log('medians (effective hp):', JSON.stringify(medians));
console.log('\n' + pad('skill', 24) + pad('cat', 7) + pad('src', 10) + '  basic: heal+avoid=tot rel |  inter  rel |   adv  rel');
for (const row of rows.sort((a, b) => (a.cat + a.src + a.id).localeCompare(b.cat + b.src + b.id))) {
  const cell = t => t ? (t.error ? 'ERR ' + t.error.slice(0, 14) : `${num(t.restored)}+${num(t.avoided)}=${num(t.total)} ${String(t.rel).padStart(5)}`) : '-';
  console.log(pad(row.id, 24) + pad(row.cat, 7) + pad(row.src, 10) + cell(row.tiers.basic) + ' | ' + cell(row.tiers.intermediate) + ' | ' + cell(row.tiers.advanced));
}
})();
