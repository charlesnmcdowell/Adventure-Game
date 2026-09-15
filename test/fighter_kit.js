// Mace Swing, Dual Swords, and Bulwark's kill heal.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const eq = (a, b, m) => ok(a === b, m, a + ' != ' + b);
const Cb = ADV.Combat;
const I = Cb._internals;
const endRound = (st) => { st.turnIdx = st.turnQueue.length; Cb.currentTurn(st); };

function field(actives, perks, nFoes) {
  const rng = new ADV.RNG(8);
  const a = ADV.Character.base({ stats: { hp: 200, atk: 12, def: 4, spd: 40 } });
  a.actives = (actives || []).map(id => ({ skillId: id, level: 1, uses: 0 }));
  a.perks = (perks || []).map(id => ({ skillId: id, level: 1, uses: 0 }));
  const foes = [];
  for (let i = 0; i < (nFoes || 1); i++) {
    const e = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
    e.stats.def = 0;
    foes.push(e);
  }
  const st = Cb.create([a], foes, { rng });
  const ua = st.units.find(u => u.ch === a);
  const ub = st.units.filter(u => u.side === 'b');
  for (const u of ub) { u.evade = 0; u.maxHp = 800; u.chp = 800; }
  Cb.currentTurn(st);
  return { st, ua, ub };
}

console.log('-- mace swing --');
{
  const { st, ua, ub } = field(['mace_swing', 'basic_attack']);
  const ue = ub[0];
  const r = Cb.act(st, ua, { kind: 'skill', skillId: 'mace_swing', targetUid: ue.uid });
  ok(r.ok, 'mace swing lands');
  const fz = ue.statuses.find(s => s.kind === 'frozen');
  ok(fz && fz.skips === 1, 'stuns the target for one turn');
  eq(Cb.cooldownLeft(ua, 'mace_swing'), 2, 'then needs a turn to recover');
  const refused = Cb.act(st, ua, { kind: 'skill', skillId: 'mace_swing', targetUid: ue.uid });
  ok(!refused.ok && /recover/.test(refused.error), 'cannot swing again on the same turn');
  endRound(st);
  ok(Cb.cooldownLeft(ua, 'mace_swing') === 1, 'still recovering the next round');
  endRound(st);
  eq(Cb.cooldownLeft(ua, 'mace_swing'), 0, 'ready the round after that');
}

console.log('-- dual swords --');
{
  const { st, ua, ub } = field(['dual_swords'], ['momentum'], 2);
  const ue = ub[0], ue2 = ub[1];
  ue.lane = 'front'; ue.slot = 0;
  ue2.lane = 'front'; ue2.slot = 1;
  const n0 = st.events.length;
  const r = Cb.act(st, ua, { kind: 'skill', skillId: 'dual_swords', targetUid: ue.uid });
  ok(r.ok, 'dual swords acts');
  eq(ua.consecutiveCount, 2, 'counts as two Momentum attacks');
  eq(ua.momentumStacks, 1, 'the second swing arms a Momentum stack');
  const hits = st.events.slice(n0).filter(e => e.t === 'damage' && e.by === ua.uid && e.tag === 'attack');
  ok(hits.length >= 2, `two attacks land (${hits.length})`);
  const onFirst = hits.filter(e => e.uid === ue.uid);
  const onAdj = hits.filter(e => e.uid === ue2.uid);
  ok(onFirst.length >= 1 && onAdj.length >= 1, 'the second strike goes to the adjacent enemy');
  ok(onAdj[0].dmg >= onFirst[0].dmg * 2 - 1, `the adjacent hit is a critical (${onAdj[0] && onAdj[0].dmg} vs ${onFirst[0] && onFirst[0].dmg})`);
}

console.log('-- bulwark on any enemy death --');
{
  const rng = new ADV.RNG(8);
  const tank = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 10, spd: 10 } });
  tank.perks = [{ skillId: 'bulwark', level: 1, uses: 0 }];
  const mate = ADV.Character.base({ stats: { hp: 200, atk: 20, def: 4, spd: 30 } });
  mate.actives = [{ skillId: 'basic_attack', level: 1, uses: 0 }];
  const e1 = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const e2 = ADV.Character.makeEnemy(rng, 'bandit', { level: 1 });
  const st = Cb.create([tank, mate], [e1, e2], { rng });
  const ut = st.units.find(u => u.ch === tank);
  const um = st.units.find(u => u.ch === mate);
  const ue = st.units.find(u => u.ch === e1);
  ut.chp = 100;
  I.addStatus(st, ut, { kind: 'poison', tier: 'basic', srcUid: null });
  I.addStatus(st, ut, { kind: 'bleed', tier: 'basic', srcUid: null });
  I.addStatus(st, ut, { kind: 'burn', power: 0.8, rounds: 3, srcAtk: 10 });
  ue.chp = 5; ue.evade = 0;
  I.applyRawDamage(st, um, ue, 50, 'attack');
  ok(ue.downed, 'the mate dropped an enemy');
  eq(ut.chp, 100 + Math.round(ut.maxHp * 0.15), 'Bulwark heals 15% when any enemy dies');
  ok(!ut.statuses.some(s => ['poison', 'bleed', 'burn'].includes(s.kind)), 'and clears every status');
  ok(st.events.some(e => e.t === 'bulwarkKill' && e.uid === ut.uid), 'and announces the heal');
}

console.log('-- bulwark physical / health reduction --');
{
  const rng = new ADV.RNG(2);
  const tank = ADV.Character.base({ stats: { hp: 200, atk: 8, def: 0, spd: 5 } });
  tank.perks = [{ skillId: 'bulwark', level: 1, uses: 0 }];
  const foe = ADV.Character.base({ stats: { hp: 200, atk: 20, def: 0, spd: 20 } });
  const st = Cb.create([tank], [foe], { rng });
  const ut = st.units.find(u => u.ch === tank);
  const ue = st.units.find(u => u.ch === foe);
  const raw = I.applyRawDamage(st, ue, ut, 40, 'attack');
  eq(raw, 20, 'basic Bulwark halves a physical 40');
  ut.chp = 200;
  const hpHit = I.applyRawDamage(st, ue, ut, 40, 'dot');
  eq(hpHit, 20, 'and halves a percent-HP / DoT tick the same way');
  tank.perks[0].level = 10;
  ut.chp = 200;
  eq(I.applyRawDamage(st, ue, ut, 40, 'attack'), 14, 'intermediate Bulwark leaves 35%');
  tank.perks[0].level = 25;
  ut.chp = 200;
  eq(I.applyRawDamage(st, ue, ut, 40, 'attack'), 10, 'advanced Bulwark leaves 25%');
}

console.log('-- shield wall negates for 2 turns --');
{
  const rng = new ADV.RNG(2);
  const tank = ADV.Character.base({ stats: { hp: 200, atk: 8, def: 0, spd: 40 } });
  tank.actives = [{ skillId: 'shield_wall', level: 1, uses: 0 }];
  const foe = ADV.Character.base({ stats: { hp: 400, atk: 20, def: 0, spd: 5 } });
  foe.actives = [{ skillId: 'backstab', level: 1, uses: 0 }, { skillId: 'venom_fang', level: 1, uses: 0 }];
  const st = Cb.create([tank], [foe], { rng });
  const ut = st.units.find(u => u.ch === tank);
  const ue = st.units.find(u => u.ch === foe);
  ue.evade = 0;
  Cb.currentTurn(st);
  ok(Cb.act(st, ut, { kind: 'skill', skillId: 'shield_wall', targetUid: ut.uid }).ok, 'Shield Wall goes up');
  const hp0 = ut.chp;
  I.dealDamage(st, ue, ut, 80, 'attack');
  eq(ut.chp, hp0, 'the wall negates a physical blow');
  I.dealDamage(st, ue, ut, 30, 'dot');
  eq(ut.chp, hp0, 'and a health tick');
  endRound(st);
  I.dealDamage(st, ue, ut, 80, 'attack');
  eq(ut.chp, hp0, 'still negated the next turn');
  endRound(st);
  I.dealDamage(st, ue, ut, 80, 'attack');
  ok(ut.chp < hp0, 'the wall is gone after two turns');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
