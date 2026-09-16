// Poison & bleed pass (DOT_PROMPT.md §6, headless): the tick is a percentage.
'use strict';
const fs = require('fs'), path = require('path');
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat, I = Cb._internals;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const lvl = { basic: 1, intermediate: TH.intermediate, advanced: TH.advanced };

function duel(skills, levels, perks, seed, enemyHp) {
  const rng = new ADV.RNG(seed || 3);
  const a = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } });
  a.actives = skills.map(id => ({ skillId: id, level: levels[id] || 1, uses: 0 }));
  a.perks = (perks || []).map(id => ({ skillId: id, level: levels[id] || 1, uses: 0 }));
  const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([a], [e], { rng });
  const ua = st.units.find(u => u.ch === a), ue = st.units.find(u => u.ch === e), ue2 = null;
  for (const u of [ue]) { u.maxHp = enemyHp || 300; u.chp = u.maxHp; u.evade = 0; }
  ue.stats && (ue.stats.def = 0);
  Cb.currentTurn(st);
  return { st, ua, ue, ue2 };
}
// Finish the action through the public API before entering a new round. Merely
// assigning turnIdx left the previous attack's damage allowance active in tests.
const endRound = (st) => { st.turnIdx = st.turnQueue.length - 1; Cb.advance(st); Cb.currentTurn(st); };
const dots = (st, from, uid) => st.events.slice(from).filter(e => e.t === 'damage' && e.tag === 'dot' && e.uid === uid);

console.log('-- §1 the rule: venom_fang at each tier on a 300 HP target --');
for (const tier of ['basic', 'intermediate', 'advanced']) {
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl[tier] });
  ue.maxHp = 30000; ue.chp = 30000;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  ue.chp = ue.maxHp * 10;
  const p = ue.statuses.find(s => s.kind === 'poison'), b = ue.statuses.find(s => s.kind === 'bleed');
  const wantN = Cb.dotWindow(tier === 'advanced' ? 4 : 3);
  ok(p && b && p.tier === tier && p.pct === Cb.DOT_PCT[tier] && p.ticks === wantN && b.ticks === wantN, `${tier}: poison + bleed applied with tier, pct ${Cb.DOT_PCT[tier]}, ${wantN} ticks`);
  const n0 = st.events.length;
  for (let i = 0; i < wantN; i++) endRound(st);
  const ticks = dots(st, n0, ue.uid);
  const total = ticks.reduce((a, e) => a + e.dmg, 0);
  const want = Math.round(30000 * Cb.DOT_PCT[tier]) * 2;
  ok(ticks.length === wantN * 2 && total === want, `${tier}: ${wantN * 2} ticks total exactly ${Cb.DOT_PCT[tier] * 100}% each = ${want} (${total})`);
  ok(!ue.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), `${tier}: both gone after their ticks`);
  endRound(st);
  ok(dots(st, n0, ue.uid).length === wantN * 2, `${tier}: no extra tick`);
}
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.intermediate });
  ue.maxHp = 91; ue.chp = 1000; // odd number: the remainder rides on the last tick
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  const n0 = st.events.length; for (let i = 0; i < Cb.DOT_TICKS; i++) endRound(st);
  const total = dots(st, n0, ue.uid).filter((e, i) => i % 2 === 0).reduce((a, e) => a + e.dmg, 0);
  const perStatus = Math.round(91 * Cb.DOT_PCT.intermediate);
  ok(dots(st, n0, ue.uid).reduce((a, e) => a + e.dmg, 0) === perStatus * 2, `rounding: the window total lands exactly on ${perStatus} per status (${dots(st, n0, ue.uid).map(e => e.dmg).join('+')})`);
}

console.log('-- §2 duration follows the skill; power/srcAtk/srcLevel do nothing --');
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.advanced });
  ue.maxHp = 30000; ue.chp = 30000;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });   // Plague Fang: rounds 4
  ue.chp = ue.maxHp * 10;
  const p = ue.statuses.find(s => s.kind === 'poison');
  ok(p.ticks === 8, `Plague Fang's four authored rounds stretch to eight ticks (${p.ticks})`);
  const n0 = st.events.length; for (let i = 0; i < 8; i++) endRound(st);
  const total = dots(st, n0, ue.uid).filter(e => e.dmg).reduce((a, e) => a + e.dmg, 0);
  ok(total === Math.round(30000 * Cb.DOT_PCT.advanced) * 2 && dots(st, n0, ue.uid).length === 16, `same ${Cb.DOT_PCT.advanced * 100}% total over eight ticks (${total})`);
  const { st: s2, ue: e2 } = duel(['venom_fang'], {});
  const a = { kind: 'poison', tier: 'basic', power: 9.9, srcAtk: 999, srcLevel: 99, srcUid: null };
  I.addStatus(s2, e2, a);
  ok(Cb.dotTick(s2, a, e2) === Math.round(300 * Cb.DOT_PCT.basic / Cb.DOT_TICKS), `power 9.9 / srcAtk 999 / srcLevel 99 change nothing (${Cb.dotTick(s2, a, e2)})`);
}

console.log('-- §2 every source carries ticks (no permanent poisons) --');
{
  const all = Object.assign({}, ADV.DATA.SKILLS);
  const bad = [];
  let n = 0;
  for (const [id, d] of Object.entries(all)) {
    const tiers = d.tiers ? Object.values(d.tiers) : [];
    for (const t of [d].concat(tiers)) {
      const stt = t.status || (t.selfStatus && t.selfStatus.dot ? { poison: t.selfStatus.dot } : null);
      if (!stt) continue;
      for (const kind of ['poison', 'bleed']) if (stt[kind]) { n++; const s = Object.assign({ kind }, stt[kind]); Cb.normaliseDot(s); if (!(s.ticks > 0 && s.rounds === undefined)) bad.push(id); }
    }
  }
  ok(n > 20 && bad.length === 0, `${n} poison/bleed definitions across the skill data normalise to a finite tick count`, bad.join(','));
  // the once-permanent serpent poison
  const { st, ua, ue } = duel(['serpent_form', 'basic_attack'], { serpent_form: 1 });
  Cb.act(st, ua, { kind: 'skill', skillId: 'serpent_form', targetUid: ua.uid });
  ue.evade = 0;
  Cb.act(st, ua, { kind: 'attack', targetUid: ue.uid });
  const sp = ue.statuses.find(s => s.kind === 'poison');
  ok(sp && sp.ticks === Cb.DOT_TICKS && sp.rounds === undefined, `Serpent Form's on-hit poison now expires (ticks ${sp && sp.ticks})`);
}

console.log('-- §3 tier resolution and DOT_ENEMY_MULT --');
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.intermediate });
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  ok(ue.statuses.find(s => s.kind === 'poison').tier === 'intermediate', 'an active skill stamps its manifest tier');
  // enemy → player scaled by DOT_ENEMY_MULT
  const C = ADV.DATA.CONST;
  const s = { kind: 'bleed', tier: 'basic', srcUid: ue.uid };
  I.addStatus(st, ua, s);
  const one = Cb.dotTick(st, s, ua);
  C.DOT_ENEMY_MULT = 0.5;
  const half = Cb.dotTick(st, s, ua);
  C.DOT_ENEMY_MULT = 1.0;
  ok(one === Math.round(ua.maxHp * Cb.DOT_PCT.basic / Cb.DOT_TICKS) && half === Math.round(one * 0.5), `DOT_ENEMY_MULT halves enemy→player ticks (${one} → ${half})`);
  const p2 = { kind: 'bleed', tier: 'basic', srcUid: ua.uid };
  I.addStatus(st, ue, p2);
  C.DOT_ENEMY_MULT = 0.5;
  ok(Cb.dotTick(st, p2, ue) === Math.round(ue.maxHp * Cb.DOT_PCT.basic / Cb.DOT_TICKS), 'and leaves player→enemy ticks alone');
  C.DOT_ENEMY_MULT = 1.0;
}

console.log('-- §4 stacking, Septic Sanguine, Opportunist, transfer --');
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.basic });
  ue.maxHp = 3000; ue.chp = 3000;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  ok(ue.statuses.filter(s => s.kind === 'poison').length === 1, 'basic poison refreshes instead of stacking');
  ok(ue.statuses.filter(s => s.kind === 'bleed').length === 1, 'basic bleed refreshes instead of stacking');
}
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.intermediate });
  ue.maxHp = 3000; ue.chp = 3000;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  ok(ue.statuses.filter(s => s.kind === 'poison').length === 1, 'intermediate poison still does not stack');
}
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.advanced });
  ue.maxHp = 3000; ue.chp = 3000;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  ok(ue.statuses.filter(s => s.kind === 'poison').length === 1, 'advanced poison refreshes instead of stacking');
  const n0 = st.events.length; endRound(st);
  ok(dots(st, n0, ue.uid).length === 2, 'one poison tick and one bleed tick a round');
}
{
  const { st, ua, ue } = duel(['venom_fang'], { venom_fang: lvl.basic, septic_sanguine: lvl.advanced }, ['septic_sanguine']);
  ue.maxHp = 3000; ue.chp = 3000; ua.chp = 50;
  Cb.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ue.uid });
  const n0 = st.events.length; endRound(st);
  const t = dots(st, n0, ue.uid)[0];
  const septicMult = ADV.DATA.SKILLS.septic_sanguine.tiers.advanced.dotMult;
  ok(t.dmg === Math.round(Math.round(3000 * Cb.DOT_PCT.basic / Cb.DOT_TICKS) * septicMult), `Septic Sanguine (advanced, dotMult ${septicMult}) scales the percentage tick (${t.dmg})`);
  ok(ua.chp > 50, 'and feeds the owner');
  const { st: s2, ua: a2, ue: e2 } = duel(['venom_fang'], { venom_fang: lvl.basic, opportunist: 1 }, ['opportunist']);
  e2.maxHp = 3000; e2.chp = 1000;
  Cb.act(s2, a2, { kind: 'skill', skillId: 'venom_fang', targetUid: e2.uid });
  const n1 = s2.events.length; endRound(s2);
  const t2 = dots(s2, n1, e2.uid)[0];
  ok(t2.dmg === Math.round(3000 * Cb.DOT_PCT.basic / Cb.DOT_TICKS) + 300, `Opportunist adds 10% of max HP to each tick under half (${t2.dmg})`);
}
{
  const { st, ua, ue } = duel(['venom_fang'], { septic_sanguine: lvl.basic }, ['septic_sanguine']);
  ua.chp = 40;
  I.addStatus(st, ua, { kind: 'poison', tier: 'basic', srcUid: ue.uid });
  const n0 = st.events.length; endRound(st);
  const tick = dots(st, n0, ua.uid)[0];
  const heals = st.events.slice(n0).filter(e => e.t === 'heal' && e.uid === ua.uid);
  ok(tick && heals.length && heals[0].amount === Math.max(1, Math.round(tick.dmg * 0.5)), 'basic septic also heals from poison you suffer');
}
{
  const rng = new ADV.RNG(3);
  const a = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } });
  a.perks = [{ skillId: 'septic_sanguine', level: lvl.advanced, uses: 0 }];
  const ally = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 10, spd: 5 } });
  const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([a, ally], [e], { rng });
  const ua = st.units.find(u => u.ch === a), ual = st.units.find(u => u.ch === ally), ue = st.units.find(u => u.ch === e);
  ua.chp = 40;
  I.addStatus(st, ual, { kind: 'bleed', tier: 'basic', srcUid: ue.uid });
  const n0 = st.events.length; endRound(st);
  const tick = dots(st, n0, ual.uid)[0];
  const heal = st.events.slice(n0).find(e => e.t === 'heal' && e.uid === ua.uid);
  const leech = ADV.DATA.SKILLS.septic_sanguine.tiers.advanced.dotLeech;
  ok(tick && heal && heal.amount === Math.max(1, Math.round(tick.dmg * leech)), 'advanced septic heals from any poison or bleed on the field');
}
{
  // venom_draw moves the poison and it recomputes on the new target's max HP
  const rng = new ADV.RNG(9);
  const h = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } }); h.actives = [{ skillId: 'venom_draw', level: 1, uses: 0 }];
  const ally = ADV.Character.base({ stats: { hp: 60, atk: 10, def: 10, spd: 5 } });
  const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([h, ally], [e], { rng });
  const uh = st.units.find(u => u.ch === h), ual = st.units.find(u => u.ch === ally), ue = st.units.find(u => u.ch === e);
  ue.maxHp = 300; ue.chp = 300; Cb.currentTurn(st);
  I.addStatus(st, ual, { kind: 'poison', tier: 'intermediate', srcUid: ue.uid });
  const r = Cb.act(st, uh, { kind: 'skill', skillId: 'venom_draw', targetUid: ue.uid });
  const moved = ue.statuses.find(s => s.kind === 'poison');
  ok(r.ok && !ual.statuses.some(s => s.kind === 'poison') && moved && moved.tier === 'intermediate', 'venom_draw moves the poison with its tier');
  ok(Cb.dotTick(st, moved, ue) === Math.round(300 * Cb.DOT_PCT.intermediate / Cb.DOT_TICKS), `and the tick recomputes on the enemy's 300 HP (${Cb.dotTick(st, moved, ue)})`);
}

console.log('-- death hop: poison and bleed by tier --');
{
  const field = (tier) => {
    const rng = new ADV.RNG(4);
    const a = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } });
    const foes = [];
    for (let i = 0; i < 5; i++) foes.push(ADV.Character.makeEnemy(rng, 'bandit', { level: 1 }));
    const st = Cb.create([a], foes, { rng });
    const dead = st.units.find(u => u.side === 'b');
    const others = st.units.filter(u => u.side === 'b' && u !== dead);
    others.forEach(u => { u.maxHp = 400; u.chp = 400; });
    I.addStatus(st, dead, { kind: 'poison', tier, srcUid: null });
    I.addStatus(st, dead, { kind: 'bleed', tier, srcUid: null });
    dead.chp = 0; dead.downed = true;
    I.onUnitDown(st, dead);
    const hopped = others.filter(u => u.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'));
    return { hopped, want: Cb.DOT_HOP[tier] };
  };
  for (const tier of ['basic', 'intermediate', 'advanced']) {
    const r = field(tier);
    ok(r.hopped.length === r.want, `${tier}: hops to ${r.want} extra enem${r.want === 1 ? 'y' : 'ies'} (${r.hopped.length})`);
    if (r.want > 0) ok(r.hopped.every(u => u.statuses.some(s => s.kind === 'poison') && u.statuses.some(s => s.kind === 'bleed')), `${tier}: both poison and bleed leap`);
  }
}
{
  const rng = new ADV.RNG(4);
  const a = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } });
  const foes = [];
  for (let i = 0; i < 5; i++) foes.push(ADV.Character.makeEnemy(rng, 'bandit', { level: 1 }));
  const st = Cb.create([a], foes, { rng });
  const side = st.units.filter(u => u.side === 'b');
  const first = side[0], rest = side.slice(1);
  rest.forEach(u => { u.maxHp = 400; u.chp = 400; });
  I.addStatus(st, first, { kind: 'poison', tier: 'advanced', srcUid: null });
  first.chp = 0; first.downed = true;
  I.onUnitDown(st, first);
  const afterFirst = rest.filter(u => u.statuses.some(s => s.kind === 'poison'));
  ok(afterFirst.length === 3, `advanced hop infects 3 extras once (${afterFirst.length})`);
  const second = rest.find(u => u.statuses.some(s => s.kind === 'poison'));
  second.chp = 0; second.downed = true;
  I.onUnitDown(st, second);
  const afterSecond = rest.filter(u => u !== second && u.statuses.some(s => s.kind === 'poison'));
  ok(afterSecond.length === 2, 'a second death does not hop again');
}

console.log('-- §9 heals cleanse --');
{
  const mk = (skill, level) => {
    const rng = new ADV.RNG(21);
    const h = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 10, spd: 30 } }); h.actives = [{ skillId: skill, level, uses: 0 }];
    const ally = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 10, spd: 5 } });
    const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
    const st = Cb.create([h, ally], [e], { rng });
    const uh = st.units.find(u => u.ch === h), ual = st.units.find(u => u.ch === ally), ue = st.units.find(u => u.ch === e);
    Cb.currentTurn(st);
    return { st, uh, ual, ue };
  };
  const poisoned = (u, extra) => { for (const k of ['poison', 'poison', 'bleed']) I.addStatus(u.__st, u, { kind: k, tier: 'advanced', srcUid: null }); for (const k of (extra || [])) I.addStatus(u.__st, u, { kind: k, rounds: 3 }); };
  // healer basic: all poison + bleed stacks, burn stays
  let c = mk('mend', 1); c.ual.__st = c.st; poisoned(c.ual, ['burn']); c.ual.chp = 50;
  Cb.act(c.st, c.uh, { kind: 'skill', skillId: 'mend', targetUid: c.ual.uid });
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed') && c.ual.statuses.some(s => s.kind === 'burn'), 'healer basic heal strips every poison and bleed stack, leaves burn');
  ok(c.st.events.some(e => e.t === 'cleansed' && e.byHeal && e.uid === c.ual.uid), 'and emits cleansed{byHeal}');
  // healer intermediate: burn + healcut too
  c = mk('mend', lvl.intermediate); c.ual.__st = c.st; poisoned(c.ual, ['burn', 'healcut', 'rooted']); c.ual.chp = 50;
  Cb.act(c.st, c.uh, { kind: 'skill', skillId: 'mend', targetUid: c.ual.uid });
  ok(!c.ual.statuses.some(s => ['poison', 'bleed', 'burn', 'healcut'].includes(s.kind)) && c.ual.statuses.some(s => s.kind === 'rooted'), 'intermediate also clears burn and heal-cut, leaves rooted');
  // healer advanced: everything negative
  c = mk('mend', lvl.advanced); c.ual.__st = c.st; poisoned(c.ual, ['burn', 'rooted', 'frozen']); c.ual.chp = 50;
  Cb.act(c.st, c.uh, { kind: 'skill', skillId: 'mend', targetUid: c.ual.uid });
  ok(!c.ual.statuses.some(s => Cb.NEG_STATUSES.includes(s.kind)), 'advanced clears the whole negative list');
  // druid: on application and on each tick
  c = mk('growth_field', 1); c.ual.__st = c.st; poisoned(c.ual); c.ual.chp = 50;
  Cb.act(c.st, c.uh, { kind: 'skill', skillId: 'growth_field', targetUid: c.ual.uid });
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'a druid heal clears poison and bleed on application');
  I.addStatus(c.st, c.ual, { kind: 'poison', tier: 'basic', srcUid: null });
  endRound(c.st);
  ok(!c.ual.statuses.some(s => s.kind === 'poison'), 'and again on each tick');
  // regen cast and tick: every poison and bleed
  c = mk('regenerate', 1); c.ual.__st = c.st; c.ual.chp = 50; poisoned(c.ual);
  Cb.act(c.st, c.uh, { kind: 'skill', skillId: 'regenerate', targetUid: c.ual.uid });
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'regenerate clears poison and bleed on cast');
  for (const k of ['poison', 'poison', 'bleed', 'bleed']) I.addStatus(c.st, c.ual, { kind: k, tier: 'advanced', srcUid: null });
  c.ual.chp = 5000;   // survive the tick
  endRound(c.st);
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'a regeneration tick strips every poison and bleed');
  // self-heal thresholds via healUnit(null/self)
  c = mk('mend', 1); c.ual.__st = c.st; c.ual.maxHp = 200; c.ual.chp = 20;
  poisoned(c.ual);
  I.healUnit(c.st, null, c.ual, 10);   // 5%: nothing
  ok(c.ual.statuses.filter(s => s.kind === 'poison').length === 1 && c.ual.statuses.filter(s => s.kind === 'bleed').length === 1, 'a 5% self-heal clears nothing');
  I.healUnit(c.st, null, c.ual, 20);   // 10%: one of each
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'a 10% self-heal clears one poison and one bleed');
  I.addStatus(c.st, c.ual, { kind: 'bleed', tier: 'basic', srcUid: null, stacks: true }); I.addStatus(c.st, c.ual, { kind: 'poison', tier: 'basic', srcUid: null, stacks: true });
  I.healUnit(c.st, null, c.ual, 60);   // 30%: all
  ok(!c.ual.statuses.some(s => s.kind === 'poison' || s.kind === 'bleed'), 'a 25%+ self-heal clears them all');
  // AI: a poisoned ally above 70% still draws the heal
  c = mk('mend', 1); c.ual.__st = c.st; c.ual.chp = c.ual.maxHp; I.addStatus(c.st, c.ual, { kind: 'poison', tier: 'basic', srcUid: c.ue.uid });
  c.uh.ch.isPlayer = false;
  const plan = Cb.planFor(c.st, c.uh);
  ok(plan && plan.skillId === 'mend' && plan.targetUid === c.ual.uid, `the AI heals a poisoned ally at full HP (${plan && plan.skillId} → ${plan && plan.targetUid === c.ual.uid})`);
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
