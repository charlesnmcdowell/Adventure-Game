// Skill balance audit: measures every active and perk in the live combat engine.
//
//   node tools/balance_audit.js                # table of every skill, sorted by tier index
//   node tools/balance_audit.js --json out.json
//   node tools/balance_audit.js --only=cleave,fire_bolt
//
// Method. A fixed caster (900 hp, 20 atk, 10 def, 20 spd) with ONE
// skill — plus basic attack — stands in a fixed arena against three fixed dummies
// (900 hp, 22 atk, 10 def) who attack the caster and the hurt ally, with one hurt ally and one downed ally
// beside it. It uses the skill whenever it can for ROUNDS rounds (basic attack when
// it cannot), and we total what the fight is worth: damage dealt to enemies,
// healing done to the party, and damage the caster/party avoided compared with the
// same fight with basic attacks only. Each skill is measured at every tier; a perk
// is measured on a basic-attacking caster. The score is "value per fight", so
// once-per-battle skills, cooldowns and multi-round statuses count for what they
// actually do. Bosses, gods and Hiro's katana kit are skipped.
'use strict';
(function main() {
const fs = require('fs');
const { load } = require('../test/harness.js');
const ADV = load();
const SK = ADV.DATA.SKILLS;
const Cb = ADV.Combat;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const TIERS = [['basic', 1], ['intermediate', TH.intermediate], ['advanced', TH.advanced]];
const ROUNDS = 6;

const args = process.argv.slice(2).reduce((o, a) => { const m = /^--([^=]+)=(.*)$/.exec(a); if (m) o[m[1]] = m[2]; else if (a.startsWith('--')) o[a.slice(2)] = true; return o; }, {});
const ONLY = args.only ? new Set(args.only.split(',')) : null;

const HIRO = new Set(['katana_slash', 'counter_attack', 'finisher']);

function arena(skillId, level, asPerk, mode) {
  const rng = new ADV.RNG(11);
  const a = ADV.Character.base({ name: 'Caster', stats: { hp: 900, atk: 20, def: 10, spd: 20 } });
  a.isPlayer = true;
  const entry = { skillId, level, uses: level * 10 };
  if (skillId) { if (asPerk) a.perks = [entry]; else a.actives = [entry]; }
  if (mode === 'monster') { a.isMonster = true; a.isPlayer = false; a.species = 'beast'; }
  const ally = ADV.Character.base({ name: 'Ally', stats: { hp: 300, atk: 12, def: 12, spd: 8 } });
  const down = ADV.Character.base({ name: 'Down', stats: { hp: 200, atk: 10, def: 10, spd: 7 } });
  const foes = [0, 1, 2].map(i => { const e = ADV.Character.base({ name: 'Dummy' + i, stats: { hp: 900, atk: 22, def: 10, spd: 6 + i } }); e.isMonster = true; e.enemyTypeId = 'dummy'; return e; });
  const st = Cb.create([a, ally, down], foes, { rng });
  const ua = st.units.find(u => u.ch === a);
  const ual = st.units.find(u => u.ch === ally);
  const ud = st.units.find(u => u.ch === down);
  ual.chp = Math.round(ual.maxHp * 0.4);       // a hurt ally to heal
  ud.downed = true; ud.chp = 0;                 // a fallen ally to raise
  return { st, ua, ual, ud, foes: st.units.filter(u => u.side === 'b') };
}

// Run the arena for ROUNDS rounds. Enemies attack the caster; the caster uses the
// skill when legal (offensive mode when that is what the skill has), else attacks.
function run(skillId, level, asPerk, mode) {
  const { st, ua, ual, ud, foes } = arena(skillId, level, asPerk, mode);
  const startEnemyHp = foes.reduce((s, u) => s + u.chp, 0);
  const startAllyHp = ual.chp + ua.chp;
  let healed = 0, raised = 0, uses = 0, taken = 0, guard = 0, usedOnce = false;
  const last = { [ua.uid]: ua.chp, [ual.uid]: ual.chp, [ud.uid]: 0 };
  const n0 = st.events.length;
  while (!st.over && st.round <= ROUNDS && guard++ < 400) {
    const t = Cb.currentTurn(st); if (!t) break;
    const u = t.unit;
    if (u === ua) {
      let done = false;
      if (skillId && !asPerk) {
        const sk = SK[skillId];
        const m = Cb.manifestFor(ua, skillId);
        const d = m ? m.data : {};
        const offensiveTarget = /enemy/i.test(sk.target || '') || /enemy/i.test(d.target || '');
        const isHeal = !!(d.heal || d.revive || sk.heal);
        // policy: attack skills every turn; heals when someone is hurt; buffs, stances,
        // wards and forms once at the start (then basic attacks under their effect)
        const want = offensiveTarget || (isHeal ? (ual.chp < ual.maxHp * 0.7 || ud.downed) : !usedOnce);
        let pool = [];
        if (want) { try { pool = Cb.validTargets(st, ua, skillId, false); } catch (e) { pool = []; } }
        let off = false;
        if (want && !pool.length && sk.offensive) { try { pool = Cb.validTargets(st, ua, skillId, true); off = true; } catch (e) { pool = []; } }
        if (pool.length) {
          let tgt = pool[0];
          if (d.revive && pool.includes(ud)) tgt = ud;
          else if (isHeal && pool.includes(ual)) tgt = ual;
          else { const foe = pool.find(x => x.side === 'b' && !x.downed); if (foe) tgt = foe; }
          try { const r = Cb.act(st, ua, { kind: 'skill', skillId, targetUid: tgt.uid, offensiveMode: off }); if (r && r.ok) { done = true; uses++; usedOnce = true; } } catch (e) { done = false; }
        }
      }
      if (!done) {
        const bv = Cb.validTargets(st, ua, 'basic_attack');
        if (bv.length) Cb.act(st, ua, { kind: 'attack', targetUid: bv[0].uid }); else Cb.act(st, ua, { kind: 'defend' });
      }
    } else if (u.side === 'a') {
      Cb.act(st, u, { kind: 'defend' });
    } else {
      const wantT = u.uid === 'b1' ? ual : ua;
      const bv = Cb.validTargets(st, u, 'basic_attack');
      const pick = bv.includes(wantT) ? wantT : bv[0];
      if (pick) Cb.act(st, u, { kind: 'attack', targetUid: pick.uid }); else Cb.act(st, u, { kind: 'defend' });
    }
    // healing is what actually landed: every rise in the party's health
    for (const x of [ua, ual, ud]) { const now = x.downed ? 0 : x.chp; if (now > (last[x.uid] || 0)) healed += now - (last[x.uid] || 0); last[x.uid] = now; }
    Cb.advance(st);
  }
  for (const e of st.events.slice(n0)) {
    if (e.t === 'revive' && e.uid === ud.uid) raised++;
    if (e.t === 'damage' && (e.uid === ua.uid || e.uid === ual.uid)) taken += e.dmg || 0;
  }
  const dealt = startEnemyHp - foes.reduce((s, u) => s + Math.max(0, u.chp), 0);
  const kills = foes.filter(u => u.downed).length;
  return { dealt, healed, raised, taken, uses, kills, endHp: ua.chp, startAllyHp };
}

// Baseline: the same caster with no skill at all.
const BASE = {};
for (const mode of ['player', 'monster']) BASE[mode] = run(null, 1, false, mode);
module.exports = { run, score, BASE, TIERS, HIRO };
if (require.main !== module) return;

function score(r, base) {
  // value per fight: damage dealt over the baseline, healing done, damage avoided, a raise
  const avoided = Math.max(0, base.taken - r.taken);
  return { dmg: r.dealt - base.dealt, heal: r.healed, avoid: avoided, raise: r.raised, total: (r.dealt - base.dealt) + r.healed + avoided + r.raised * 150 };
}

const rows = [];
for (const id of Object.keys(SK)) {
  if (ONLY && !ONLY.has(id)) continue;
  const sk = SK[id];
  if (HIRO.has(id)) continue;
  if (sk.target === 'postVictory') continue;
  const mode = sk.monster ? 'monster' : 'player';
  const row = { id, name: sk.name, kind: sk.kind, archetype: sk.archetype || (sk.faction ? 'faction:' + sk.faction : sk.monster ? 'monster' : sk.universal ? 'universal' : '-'),
    src: sk.campaign2 ? 'campaign2' : sk.campaign ? 'campaign' : sk.monster ? 'monster' : 'core', tiers: {} };
  for (const [tier, level] of TIERS) {
    let r;
    try { r = run(id, level, sk.kind === 'perk', mode); } catch (e) { row.tiers[tier] = { error: e.message.slice(0, 60) }; continue; }
    row.tiers[tier] = Object.assign({ level, uses: r.uses, kills: r.kills }, score(r, BASE[mode]));
  }
  rows.push(row);
}

// Group medians per kind/tier over skills that did something.
const med = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
// category from what the skill mostly does at its advanced tier
for (const row of rows) {
  const a = row.tiers.advanced || row.tiers.intermediate || row.tiers.basic || {};
  row.cat = row.kind === 'perk' ? 'perk' : (a.heal > Math.max(a.dmg, a.avoid) ? 'heal' : a.avoid > Math.max(a.dmg, a.heal) ? 'guard' : a.dmg > 0 ? 'damage' : 'other');
}
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
const num = (v) => (v == null ? '-' : Math.round(v)).toString().padStart(5);
console.log('baseline (no skill): dealt %d taken %d', BASE.player.dealt, BASE.player.taken);
console.log('medians:', JSON.stringify(medians));
console.log(pad('skill', 22) + pad('kind', 7) + pad('src', 10) + '  basic (dmg/heal/avoid) tot rel | inter tot rel | adv tot rel');
for (const row of rows.sort((a, b) => (a.cat + a.src + a.id).localeCompare(b.cat + b.src + b.id))) {
  const cell = (t) => t ? (t.error ? 'ERR ' + t.error.slice(0, 18) : `${num(t.dmg)}/${num(t.heal)}/${num(t.avoid)} ${num(t.total)} ${String(t.rel).padStart(5)}`) : '-';
  console.log(pad(row.id, 22) + pad(row.cat, 7) + pad(row.src, 10) + cell(row.tiers.basic) + ' | ' + cell(row.tiers.intermediate) + ' | ' + cell(row.tiers.advanced));
}
})();
