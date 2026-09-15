// Healer & druid pass (HEALER_DRUID_PROMPT.md §8, headless half): the numbers.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const eq = (a, b, m) => ok(a === b, m, a + ' != ' + b);
const Cb = ADV.Combat;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const lvl = { basic: 1, intermediate: TH.intermediate, advanced: TH.advanced };

function party(skills, levels, n, seed) {
  const rng = new ADV.RNG(seed || 11);
  const h = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } });
  h.actives = skills.map(id => ({ skillId: id, level: levels[id] || 1, uses: 0 }));
  const allies = [];
  for (let i = 0; i < (n || 4); i++) { const a = ADV.Character.base({ stats: { hp: 100 + i * 100, atk: 10, def: 10, spd: 5 - i } }); allies.push(a); }
  const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([h].concat(allies), [e], { rng });
  const uh = st.units.find(u => u.ch === h);
  const ua = allies.map(a => st.units.find(u => u.ch === a));
  const ue = st.units.find(u => u.ch === e);
  Cb.currentTurn(st);
  return { st, uh, ua, ue, h };
}
const hp = (u, frac) => { u.chp = Math.round(u.maxHp * frac); };
const heals = (st, from) => st.events.slice(from).filter(e => e.t === 'heal');
const endRound = (st) => { st.turnIdx = st.turnQueue.length; Cb.currentTurn(st); };

console.log('-- A1 percentage heals --');
for (const tier of ['basic', 'intermediate', 'advanced']) {
  const { st, uh, ua } = party(['mend'], { mend: lvl[tier] });
  hp(ua[0], 0.05); const before = ua[0].chp; const n0 = st.events.length;
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'mend', targetUid: ua[0].uid });
  const got = heals(st, n0).find(e => e.uid === ua[0].uid);
  const want = Math.round(ua[0].maxHp * Cb.HEAL_PCT[tier]);
  ok(r.ok && got && got.amount === want, `mend ${tier} heals ${Cb.HEAL_PCT[tier] * 100}% of max HP (${got && got.amount} of ${ua[0].maxHp}; want ${want})`);
  ok(ua[0].chp === Math.min(ua[0].maxHp, before + want), 'applied, capped at max');
}
{
  const { st, uh, ua } = party(['triage'], { triage: 1 });
  hp(ua[0], 0.5); let n0 = st.events.length;
  Cb.act(st, uh, { kind: 'skill', skillId: 'triage', targetUid: ua[0].uid });
  eq(heals(st, n0)[0].amount, Math.round(ua[0].maxHp * 0.75), 'triage basic = 75% (healMult 1.5)');
  const { st: st2, uh: uh2, ua: ua2 } = party(['triage'], { triage: 1 });
  hp(ua2[0], 0.1); n0 = st2.events.length;
  Cb.act(st2, uh2, { kind: 'skill', skillId: 'triage', targetUid: ua2[0].uid });
  eq(heals(st2, n0)[0].amount, Math.round(ua2[0].maxHp * 0.75) * 2, 'triage under 25% doubles to 150%');
}

console.log('-- A4 targets --');
{
  const { st, uh, ua } = party(['field_suture'], { field_suture: lvl.intermediate }, 5);
  ua.forEach((u, i) => hp(u, 0.3 + i * 0.1)); const n0 = st.events.length;
  Cb.act(st, uh, { kind: 'skill', skillId: 'field_suture', targetUid: ua[3].uid });
  const hit = heals(st, n0).map(e => e.uid);
  ok(hit.length === 2 && hit.includes(ua[3].uid) && hit.includes(ua[0].uid), `intermediate single-target heal reaches 2: the chosen + the lowest (${hit.length})`);
  const { st: s2, uh: h2, ua: a2 } = party(['field_suture'], { field_suture: lvl.advanced }, 5);
  a2.forEach((u, i) => hp(u, 0.3 + i * 0.1)); const n1 = s2.events.length;
  Cb.act(s2, h2, { kind: 'skill', skillId: 'field_suture', targetUid: a2[4].uid });
  const hit2 = heals(s2, n1).map(e => e.uid);
  ok(hit2.length === 4 && hit2.includes(a2[4].uid) && hit2.includes(a2[0].uid) && hit2.includes(a2[1].uid) && hit2.includes(a2[2].uid), `advanced reaches 4, lowest first (${hit2.length})`);
  ok(!hit2.includes(a2[3].uid), 'the fifth, healthiest ally is not touched');
}

console.log('-- A2 regeneration --');
for (const tier of ['basic', 'intermediate', 'advanced']) {
  const { st, uh, ua } = party(['regenerate'], { regenerate: lvl[tier] });
  ua[0].maxHp = 1000; hp(ua[0], 0.01);
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua[0].uid });
  const hot = ua[0].statuses.find(s => s.kind === 'hot');
  ok(r.ok && hot && hot.ticks === Cb.REGEN_TICKS, `${tier}: hot with ${Cb.REGEN_TICKS} ticks`);
  const n0 = st.events.length;
  for (let i = 0; i < 7; i++) endRound(st);
  const ticks = heals(st, n0).filter(e => e.uid === ua[0].uid && e.tick);
  const total = ticks.reduce((a, e) => a + e.amount, 0);
  const want = Math.round(1000 * Cb.HEAL_PCT[tier] * 2);
  ok(ticks.length === Cb.REGEN_TICKS && Math.abs(total - want) <= 5, `${tier}: exactly 5 ticks totalling ${Cb.HEAL_PCT[tier] * 200}% (${total} vs ${want})`);
  ok(!ua[0].statuses.some(s => s.kind === 'hot'), 'the hot is gone after its ticks');
}
{
  const { st, uh, ua } = party(['regenerate'], { regenerate: 1 });
  hp(ua[0], 0.1);
  Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua[0].uid });
  eq(Cb.cooldownLeft(uh, 'regenerate'), Cb.REGEN_COOLDOWN, 'regenerate goes on a 3-turn cooldown');
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua[0].uid });
  ok(!r.ok && /recover/.test(r.error), `recast refused while recovering (${r.error})`);
  endRound(st); endRound(st); endRound(st);
  eq(Cb.cooldownLeft(uh, 'regenerate'), 0, 'cooldown clears after 3 rounds');
  hp(ua[0], 0.1);
  Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua[0].uid });
  ok(ua[0].statuses.filter(s => s.kind === 'hot').length === 1, 'recast refreshes, never stacks');
}
{
  const { st, uh, ua } = party(['regenerate'], { regenerate: 1 });
  Cb._internals.addStatus(st, ua[0], { kind: 'poison', tier: 'basic', srcUid: null });
  Cb._internals.addStatus(st, ua[0], { kind: 'bleed', tier: 'basic', srcUid: null });
  hp(ua[0], 0.2);
  Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: ua[0].uid });
  ok(!ua[0].statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'regenerate clears poison and bleed on cast');
  ok(st.events.some(e => e.t === 'cleansed' && e.byHeal && e.uid === ua[0].uid), 'and emits cleansed{byHeal}');
}
{
  const { st, uh, ua, ue } = party(['regenerate'], { regenerate: 1 });
  const pool = Cb.validTargets(st, uh, 'regenerate', true);
  ok(pool.every(t => t.side !== uh.side) && pool.includes(ue), 'Poison targets enemies, never the healer');
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'regenerate', targetUid: uh.uid, offensiveMode: true });
  ok(r.ok, 'Poison still fires if the healer is passed as the target');
  ok(!uh.statuses.some(s => s.kind === 'poison'), 'and does not poison the caster');
  ok(ue.statuses.some(s => s.kind === 'poison'), 'it poisons the enemy instead');
  const { st: s2, uh: h2, ue: e2 } = party(['regenerate'], { regenerate: 1 });
  Cb.act(s2, h2, { kind: 'skill', skillId: 'regenerate', targetUid: e2.uid, offensiveMode: true });
  ok(e2.statuses.some(s => s.kind === 'poison') && !h2.statuses.some(s => s.kind === 'poison'), 'a chosen enemy is poisoned, the healer is not');
}

console.log('-- A3 druid heals + thorn shield --');
for (const tier of ['basic', 'intermediate', 'advanced']) {
  const { st, uh, ua, ue } = party(['growth_field'], { growth_field: lvl[tier] });
  ua[0].maxHp = 1000; hp(ua[0], 0.01);
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'growth_field', targetUid: ua[0].uid });
  const hot = ua[0].statuses.find(s => s.kind === 'hot'), sh = ua[0].statuses.find(s => s.kind === 'thornShield');
  ok(r.ok && hot && hot.druid && hot.ticks === Cb.DRUID_TICKS, `${tier}: druid hot with 3 ticks`);
  ok(sh && sh.pool === Math.round(1000 * Cb.HEAL_PCT[tier]) && sh.reflectPct === 0.5, `${tier}: thorn shield pool ${Cb.HEAL_PCT[tier] * 100}% of max HP, reflects 50%`);
  const n0 = st.events.length;
  for (let i = 0; i < 5; i++) endRound(st);
  const total = heals(st, n0).filter(e => e.uid === ua[0].uid && e.tick).reduce((a, e) => a + e.amount, 0);
  ok(Math.abs(total - 1000 * Cb.HEAL_PCT[tier]) <= 5, `${tier}: heals the healer's total over 3 ticks (${total})`);
  ok(!ua[0].statuses.some(s => s.kind === 'thornShield'), 'the shield expires with its rounds');
}
{
  const { st, uh, ua, ue } = party(['growth_field'], { growth_field: lvl.basic });
  ua[0].maxHp = 400; hp(ua[0], 0.5);
  Cb.act(st, uh, { kind: 'skill', skillId: 'growth_field', targetUid: ua[0].uid });
  const sh = ua[0].statuses.find(s => s.kind === 'thornShield');
  const eh = ue.chp; const before = ua[0].chp; const n0 = st.events.length;
  Cb._internals.dealDamage(st, ue, ua[0], 120, 'attack');
  const abs = st.events.slice(n0).find(e => e.t === 'shieldAbsorb');
  ok(abs && abs.absorbed === 120 && ua[0].chp === before, 'a hit inside the pool is fully absorbed');
  eq(sh.pool, 200 - 120, 'the pool drains by the absorbed amount');
  const refl = st.events.slice(n0).find(e => e.t === 'damage' && e.uid === ue.uid && e.tag === 'reflect');
  ok(refl && refl.dmg === 60 && ue.chp === eh - 60, `50% of the absorbed damage is reflected (${refl && refl.dmg})`);
  const n1 = st.events.length;
  Cb._internals.dealDamage(st, ue, ua[0], 150, 'attack');
  ok(!ua[0].statuses.some(s => s.kind === 'thornShield') && st.events.slice(n1).some(e => e.t === 'shieldBreak'), 'a hit past the pool breaks the shield');
  ok(ua[0].chp === before - 70, `the overflow lands (${before - ua[0].chp} of 150 after 80 absorbed)`);
}

console.log('-- C1 shapeshift --');
{
  const { st, uh } = party(['beast_shape'], { beast_shape: 1 });
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'beast_shape', targetUid: uh.uid });
  ok(Cb.BEASTS.includes(uh.form), `beast_shape sets a form (${uh.form})`);
  ok(st.events.some(e => e.t === 'shapeshift' && e.beast === uh.form), 'and announces it');
  const f = uh.statuses.find(s => s.kind === 'form');
  ok(!!f, 'form status carried');
  for (const s of uh.statuses.slice()) if (s.kind === 'beastShape' || s.kind === 'form') Cb._internals.removeStatus(uh, s);
  ok(uh.form == null, 'the form clears with its status');
  const seen = new Set();
  for (let i = 0; i < 12; i++) { const p = party(['beast_shape'], { beast_shape: 1 }, 4, 100 + i); Cb.act(p.st, p.uh, { kind: 'skill', skillId: 'beast_shape', targetUid: p.uh.uid }); seen.add(p.uh.form); }
  ok(seen.size >= 2, `the beast is random across seeds (${[...seen].join(',')})`);
  const { st: s2, uh: h2 } = party(['bear_stance'], { bear_stance: 1 });
  Cb.act(s2, h2, { kind: 'skill', skillId: 'bear_stance', targetUid: h2.uid });
  eq(h2.form, 'werebear', 'bear_stance is always the bear');
}

console.log('-- revive marks + lines --');
{
  const tables = ADV.DATA.REVIVE_LINES;
  ok(tables && tables.healer.length >= 12 && tables.druid.length >= 12, `line tables: ${tables.healer.length} healer / ${tables.druid.length} druid`);
  const run = (skill) => {
    const { st, uh, ua } = party([skill], { [skill]: 1 });
    ua[0].downed = true; ua[0].chp = 0;
    const n0 = st.events.length;
    const r = Cb.act(st, uh, { kind: 'skill', skillId: skill, targetUid: ua[0].uid });
    return { r, st, uh, ua, evs: st.events.slice(n0) };
  };
  const d = run('grove_raise');
  ok(d.r.ok && !d.ua[0].downed, 'grove_raise revives');
  ok(d.ua[0].statuses.some(s => s.kind === 'grove' && s.rounds === 3), 'the risen wears a grove for buffRounds (3)');
  const dl = d.evs.find(e => e.t === 'line');
  ok(dl && dl.kind === 'druid' && dl.uid === d.uh.uid && tables.druid.includes(dl.text), `the druid speaks a neutral line on the first revive ("${dl && dl.text}")`);
  const h = run('raise');
  ok(h.r.ok && h.ua[0].statuses.some(s => s.kind === 'wings'), 'a healer revive puts wings on the risen');
  const hl = h.evs.find(e => e.t === 'line');
  ok(hl && hl.kind === 'healer' && tables.healer.includes(hl.text) && hl.tag === 'warm', `the healer speaks a friendly line ("${hl && hl.text}")`);
  ok(h.evs.find(e => e.t === 'revive').arch === 'healer', 'the revive event names the archetype');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
