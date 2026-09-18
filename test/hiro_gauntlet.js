// "If Hiro can't do it, no one can." Plays the secret character solo on Hard, all the way
// through an ordinary career and then Varenholm's Iron War, and writes a readable blow-by-blow.
// A death is a failure of the balance, not of the run.
//
//   node test/hiro_gauntlet.js                  # full run, log to test/reports/hiro-gauntlet/
//   node test/hiro_gauntlet.js --quiet          # verdict only
//   node test/hiro_gauntlet.js --campaign-only
'use strict';
const fs = require('fs'), path = require('path');
const { load, memBackend } = require('./harness');
const A = load();
globalThis.ADV = A;                                   // re-pin: nothing below may swap the global
const D = A.DATA, C3 = A.Campaign3;

const args = process.argv.slice(2).reduce((o, a) => { const m = /^--([^=]+)=(.*)$/.exec(a); if (m) o[m[1]] = m[2]; else if (a.startsWith('--')) o[a.slice(2)] = true; return o; }, {});
const QUIET = !!args.quiet;
const SEED = +(args.seed || 20260917);

const lines = [];
const say = (s = '') => { lines.push(s); if (!QUIET) console.log(s); };

// ---------------------------------------------------------------- the blow-by-blow
const bar = (u) => {
  const cur = Math.max(0, u.chp), max = Math.max(1, u.maxHp);
  const n = Math.round((cur / max) * 12);
  return '[' + '#'.repeat(Math.max(0, n)) + '.'.repeat(Math.max(0, 12 - n)) + '] ' + cur + '/' + max + (u.tempHp ? ' (+' + u.tempHp + ')' : '');
};
const who = (st, uid) => { const u = st.units.find(x => x.uid === uid); return u ? u.ch.name : '?'; };

function renderEvents(st, from) {
  const out = [];
  for (let i = from; i < st.events.length; i++) {
    const e = st.events[i];
    switch (e.t) {
      case 'use': out.push(`      ${who(st, e.uid)} uses ${e.name || e.skillId}`); break;
      case 'attack': out.push(`      ${who(st, e.uid)} attacks ${who(st, e.target)}`); break;
      case 'damage': out.push(`        ${who(st, e.uid)} takes ${e.dmg}${e.tag && e.tag !== 'attack' ? ' (' + e.tag + ')' : ''}${e.by && e.by !== e.uid ? ' from ' + who(st, e.by) : ''}`); break;
      case 'heal': out.push(`        ${who(st, e.uid)} heals ${e.amount != null ? e.amount : (e.hp != null ? e.hp : '')}`); break;
      case 'miss': out.push(`        ${who(st, e.uid)} evades`); break;
      case 'execute': out.push(`        ${who(st, e.uid)} is cut down${e.clean ? ' outright' : ''}${e.riposte ? ' on the riposte' : ''}`); break;
      case 'down': out.push(`        ${who(st, e.uid)} falls`); break;
      case 'counter': out.push(`        ${who(st, e.uid)} turns the blow aside`); break;
      case 'riposte': out.push(`        ${who(st, e.uid)} answers with ${e.name || e.skillId}`); break;
      case 'selfRevive': out.push(`        ${who(st, e.uid)} gets back up${e.why === 'demigod' ? ' — Demigod' : ''}`); break;
      case 'immune': out.push(`        ${who(st, e.uid)} shrugs off ${e.kind}`); break;
      case 'permGain': out.push(`        ${who(st, e.uid)} swells with the kill`); break;
      case 'flee': out.push(`        ${who(st, e.uid)} tries to run`); break;
      default: break;
    }
  }
  return out;
}

function playFight(st, label, verbose) {
  const hu = st.units.find(u => u.side === 'a' && u.ch.registryId === 'hiro') || st.units.find(u => u.side === 'a');
  if (verbose) {
    say(`   ${label}`);
    say(`   against: ${st.units.filter(u => u.side === 'b').map(u => `${u.ch.name} (lv${u.ch.level || '?'}, ${u.lane})`).join(', ')}`);
  }
  let guard = 0, round = 0, seen = st.events.length;
  while (!st.over && guard++ < 900) {
    const t = A.Combat.currentTurn(st); if (!t) break;
    if (verbose && st.round !== round) {
      round = st.round;
      say(`    round ${round} — Hiro ${bar(hu)}`);
    }
    A.Combat.aiTakeTurn(st, t.unit);
    A.Combat.advance(st);
    if (verbose) { for (const l of renderEvents(st, seen)) say(l); }
    seen = st.events.length;
  }
  if (verbose) say(`    -> ${st.winner === 'a' ? 'won' : 'LOST'}, Hiro ${bar(hu)}`);
  return st.winner;
}

// ---------------------------------------------------------------- setup
function hiroGame(seed) {
  A.Save.setBackend(memBackend());
  const g = A.Game.newGame({ password: 'hiro', name: 'Hiro', seed, portraitSlot: 1, portraitSeed: seed });
  A.Difficulty.set(g, 'hard');
  const p = A.Game.player(g);
  p.homeId = 'cottage'; p.inventory.gold = 5000;
  return g;
}
function keepFed(g) {
  const p = A.Game.player(g);
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 8 } };
  if (p.inventory.gold < 500) p.inventory.gold = 500;
  const s = A.Survival.state(p); s.hunger = 0; s.sick = false; s.sickStacks = 0; s.questsSinceShelter = 0;
}

function runQuest(g, label, verbose) {
  const p = A.Game.player(g);
  let guard = 0, i = 0;
  while (guard++ < 40) {
    const enc = A.Game.currentEncounter(g);
    if (!enc) break;
    const st = A.Game.startCombat(g, false);
    playFight(st, `${label} — encounter ${++i}`, verbose);
    const r = A.Game.finishCombat(g);
    if (r.playerDead) return { won: false, died: true, at: label + ' enc ' + i };
    if (!r.won) return { won: false, died: false, at: label + ' enc ' + i };
    if (g.quest.readyToComplete) break;
  }
  const hp = p.combatHp == null ? 1 : p.combatHp / Math.max(1, A.Character.maxHp(p));
  A.Game.completeQuest(g);
  return { won: true, died: false, hp };
}

// ---------------------------------------------------------------- the run
const results = { career: [], campaign: [], deaths: [] };
say('=========================================================');
say('  HIRO GAUNTLET — solo, HARD, seed ' + SEED);
say('=========================================================');
{
  const g = hiroGame(SEED);
  const p = A.Game.player(g);
  say(`Hiro: ${A.Character.maxHp(p)} HP, atk ${A.Character.effStat(p, 'atk')}, def ${A.Character.effStat(p, 'def')}`);
  say(`kit: ${p.perks.concat(p.actives).map(e => (D.SKILLS[e.skillId] || {}).name || e.skillId).join(', ')}`);
  say(`difficulty: ${A.Difficulty.id()} — ${A.Difficulty.def().tagline}`);
  say('');
}

const g = hiroGame(SEED);
const p = A.Game.player(g);
if (!args['campaign-only']) {
  say('--- ORDINARY CAREER (solo contracts, tiers 1-3) ---');
  for (let i = 0; i < 12; i++) {
    keepFed(g);
    const cap = i < 4 ? 1 : i < 8 ? 2 : 3;
    const board = g.board.filter(q => q.track === 'solo' && !q.isBoss && q.tier <= cap && A.Quests.repGate(q, p).ok);
    if (!board.length) break;
    board.sort((a, b) => b.tier - a.tier || a.payout - b.payout);
    const q = board[0];
    if (!A.Game.startQuest(g, q, {}).ok) break;
    const res = runQuest(g, `contract ${i + 1} (tier ${q.tier})`, i < 2);
    results.career.push(Object.assign({ n: i + 1, tier: q.tier }, res));
    say(`  contract ${i + 1} (tier ${q.tier}): ${res.won ? 'won' : (res.died ? 'DIED' : 'lost')}${res.hp != null ? ' — ' + Math.round(res.hp * 100) + '% health left' : ''}`);
    if (res.died) { results.deaths.push(res.at); break; }
    if (!res.won) { p.alive = true; p.combatHp = A.Character.maxHp(p); g.pendingDeath = null; }
  }
  say('');
}

say(`--- after the career: ${A.Character.maxHp(p)} HP, atk ${A.Character.effStat(p, 'atk')}, def ${A.Character.effStat(p, 'def')} ---`);
say('');
say('--- VARENHOLM\'S IRON WAR (all 14, solo, same character) ---');
{
  p.reputation = Math.max(p.reputation || 0, 20); p.rank = 3;
  for (let n = 1; n <= 14; n++) {
    keepFed(g);
    C3.debugJump(g, n);
    const quest = C3.buildQuest(g, n);
    if (!A.Game.startQuest(g, quest, {}).ok) { say(`  q${n}: could not start`); break; }
    const verbose = !!args.watch || n >= 13;
    const res = runQuest(g, `q${n}`, verbose);
    results.campaign.push(Object.assign({ n }, res));
    say(`  q${n}: ${res.won ? 'won' : (res.died ? 'DIED' : 'lost')}${res.hp != null ? ' — ' + Math.round(res.hp * 100) + '% health left' : ''}`);
    if (res.died) { results.deaths.push(res.at); break; }
    if (!res.won) { p.alive = true; p.combatHp = A.Character.maxHp(p); g.pendingDeath = null; }
  }
}

say('');
say('=========================================================');
const died = results.deaths.length > 0;
const lost = results.career.concat(results.campaign).filter(r => !r.won).length;
say(`  VERDICT: ${died ? 'FAIL — Hiro died at ' + results.deaths.join(', ') : 'PASS — Hiro survived the gauntlet'}`);
say(`  contracts: ${results.career.filter(r => r.won).length}/${results.career.length} won`);
say(`  campaign:  ${results.campaign.filter(r => r.won).length}/${results.campaign.length} won`);
say(`  non-fatal losses: ${lost}`);
say('=========================================================');

const dir = path.join(__dirname, 'reports', 'hiro-gauntlet');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'run.log'), lines.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(results, null, 2));
if (QUIET) console.log(lines.slice(-8).join('\n'));
console.log('\nlog: test/reports/hiro-gauntlet/run.log');
process.exit(died ? 1 : 0);
