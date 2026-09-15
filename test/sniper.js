// Sniper perk, extra ranger use, percentage evasion (THREAT_PROMPT.md).
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat;
const SK = ADV.DATA.SKILLS;

function withPerk(id, level, extras) {
  const ch = ADV.Character.base(Object.assign({ stats: { hp: 220, atk: 14, def: 8, spd: 14 } }, extras || {}));
  ch.archetypeInclination = [];
  ch.perks = [{ skillId: id, level: level || 1, uses: 0 }];
  return ch;
}
function give(ch, id, level) {
  const sk = SK[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return Cb.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }

console.log('-- tier table --');
{
  ok(!!SK.sniper && SK.sniper.kind === 'perk' && SK.sniper.archetype === 'ranger', 'sniper is a ranger perk');
  const T = SK.sniper.tiers;
  const lv = { 1: T.basic.evadePct, 10: T.intermediate.evadePct, 25: T.advanced.evadePct };
  const ch = withPerk('sniper', 1);
  for (const [level, pct] of Object.entries(lv)) {
    ch.perks[0].level = +level;
    ok(ADV.SkillSys.knownVal(ch, 'evadePct') === pct, 'tier ' + level + ' evadePct ' + pct);
    ok(ADV.SkillSys.knownVal(ch, 'rangerExtraUse') === 1, 'tier ' + level + ' has one extra use');
  }
}

console.log('-- extra ranger use refunds once per round --');
{
  const r = withPerk('sniper', 1);
  give(r, 'aimed_shot', 1);
  give(r, 'smoke_bomb', 1);
  const foe = ADV.Character.base({ stats: { hp: 400, atk: 8, def: 4, spd: 6 } });
  const st = fight(r, foe, 3);
  const ur = unit(st, r), ue = unit(st, foe);
  Cb.currentTurn(st);
  ok(ur.rangerUsesLeft === 1, 'startRound grants one extra use');
  const r1 = Cb.act(st, ur, { kind: 'skill', skillId: 'aimed_shot', targetUid: ue.uid });
  ok(r1 && r1.refund, 'first ranger skill refunds');
  ok(ur.rangerUsesLeft === 0, 'the extra use is spent');
  const r2 = Cb.act(st, ur, { kind: 'skill', skillId: 'aimed_shot', targetUid: ue.uid });
  ok(r2 && r2.ok && !r2.refund, 'second ranger skill spends the turn');
  const smoke = withPerk('sniper', 1);
  give(smoke, 'smoke_bomb', 1);
  const stS = fight(smoke, foe, 4);
  const us = unit(stS, smoke);
  Cb.currentTurn(stS);
  const rs = Cb.act(stS, us, { kind: 'skill', skillId: 'smoke_bomb', targetUid: us.uid });
  ok(rs && rs.refund && us.rangerUsesLeft === 1, 'rogue freeAction refunds without spending the Sniper use');
  const blocked = withPerk('sniper', 1);
  give(blocked, 'aimed_shot', 1);
  const stB = fight(blocked, foe, 5);
  const ub = unit(stB, blocked), ufoe = unit(stB, foe);
  ufoe.statuses.push({ kind: 'countersign', rounds: 2 });
  Cb.currentTurn(stB);
  const rb = Cb.act(stB, ub, { kind: 'skill', skillId: 'aimed_shot', targetUid: ufoe.uid });
  ok(stB.events.some(e => e.t === 'interrupted'), 'countersign interrupts the shot');
  ok(ub.rangerUsesLeft === 1 && !(rb && rb.refund), 'an interrupted shot does not spend the Sniper use');
}

console.log('-- evadeChance sums, caps, and respects exemptions --');
{
  const sn = withPerk('sniper', 25);
  const foe = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 8, spd: 8 } });
  const st = fight(sn, foe, 5);
  const us = unit(st, sn), ue = unit(st, foe);
  const ghost = SK.sniper.tiers.advanced.evadePct;
  ok(Math.abs(Cb.evadeChance(st, us) - ghost) < 0.001, `Ghost of the Ridge is ${Math.round(ghost * 100)}%`);
  us.statuses.push({ kind: 'aura', evadePct: 0.15, rounds: 3 });
  ok(Math.abs(Cb.evadeChance(st, us) - (ghost + 0.15)) < 0.001, 'perk + aura sum');
  us.statuses.push({ kind: 'aura', evadePct: 0.40, rounds: 3 });
  ok(Cb.evadeChance(st, us) === 0.75, 'caps at 0.75');
  ok(Cb.evadeChance(st, us, { cannotMiss: true }) === 0, 'cannotMiss suppresses the roll');
  us.statuses.push({ kind: 'runic', rounds: 2 });
  ok(Cb.evadeChance(st, us) === 0, 'runic suppresses the roll');
  us.statuses = [{ kind: 'aura', evadePct: 0.15, rounds: 3 }];
  ok(Cb.evadeChance(st, us, { tag: 'dot' }) === 0, 'dots do not roll evade');
}

console.log('-- percentage rolls before the charge; God Aura is live --');
{
  const sn = withPerk('sniper', 1);
  const foe = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 8, spd: 8 } });
  const st = fight(sn, foe, 6);
  const us = unit(st, sn), ue = unit(st, foe);
  us.evade = 1;
  st.rng = { float: () => 0.0 };
  const n0 = st.events.length;
  const dealt = Cb._internals.applyRawDamage(st, ue, us, 20, 'attack', {});
  ok(dealt === 0, 'percentage evade stops the hit');
  ok(us.evade === 1, 'a charge is not spent on a hit already read');
  ok(st.events.slice(n0).some(e => e.t === 'evade' && e.pct), 'emits evade { pct: true }');
  st.rng = { float: () => 0.99 };
  const n1 = st.events.length;
  const dealt2 = Cb._internals.applyRawDamage(st, ue, us, 20, 'attack', {});
  ok(dealt2 === 0 && us.evade === 0, 'failed pct roll still spends the charge');
  ok(st.events.slice(n1).some(e => e.t === 'evade' && !e.pct), 'charge dodge is not marked pct');
  const aura = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 8, spd: 10 } });
  give(aura, 'god_aura', 1);
  const pal = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 10, spd: 8 } });
  const stA = fight([aura, pal], foe, 7);
  const ua = unit(stA, aura), up = unit(stA, pal);
  Cb.act(stA, ua, { kind: 'skill', skillId: 'god_aura', targetUid: ua.uid });
  ok(up.statuses.some(s => s.kind === 'aura' && s.evadePct === 0.15), 'God Aura writes evadePct onto the aura');
  ok(Math.abs(Cb.evadeChance(stA, up) - 0.15) < 0.001, 'God Aura 15% party evade applies');
  const sure = Cb._internals.applyRawDamage(stA, unit(stA, foe), up, 12, 'attack', { cannotMiss: true });
  ok(sure > 0, 'cannotMiss still lands');
}

console.log('-- NPC sniper spends the extra use --');
{
  const npc = withPerk('sniper', 1); npc.isPlayer = false;
  give(npc, 'aimed_shot', 1);
  const foe = ADV.Character.base({ stats: { hp: 300, atk: 8, def: 4, spd: 6 }, isPlayer: true });
  const st = fight(npc, foe, 11);
  const un = unit(st, npc);
  let refunds = 0, guard = 0;
  while (!st.over && st.round <= 2 && guard++ < 40) {
    const t = Cb.currentTurn(st);
    if (!t) break;
    if (t.unit === un) {
      const n0 = st.events.length;
      Cb.aiTakeTurn(st, un);
      if (st.events.slice(n0).some(e => e.t === 'refund')) refunds++;
    } else Cb.act(st, t.unit, { kind: 'hold' });
    Cb.advance(st);
  }
  ok(refunds >= 1, 'an NPC ranger with Sniper spends its extra use', refunds);
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
