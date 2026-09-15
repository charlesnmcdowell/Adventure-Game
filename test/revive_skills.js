// Revive skills: healer/druid ally raise, tank/warrior/rogue self-rise.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

const mk = (o) => ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 12, def: 4, spd: 10 } }, o));
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }
function drop(u) { u.chp = 0; u.downed = true; }
function kill(st, src, tgt) {
  tgt.evade = 0;
  tgt.statuses = (tgt.statuses || []).filter(s => s.kind !== 'ward' && s.kind !== 'anchor');
  ADV.Combat._internals.dealDamage(st, src, tgt, 99999, 'attack');
}

console.log('\n-- Raise: healer ally revive --');
{
  const h = mk({ name: 'Healer' }); give(h, 'raise', 1);
  const a1 = mk({ name: 'A1' }), a2 = mk({ name: 'A2' }), a3 = mk({ name: 'A3' });
  const e = mk({ name: 'E', stats: { hp: 400, atk: 8, def: 2, spd: 8 } });
  const st = fight([h, a1, a2, a3], e, 11);
  const uh = unit(st, h), u1 = unit(st, a1), u2 = unit(st, a2), u3 = unit(st, a3);
  drop(u1); drop(u2); drop(u3);
  const pool = ADV.Combat.validTargets(st, uh, 'raise', false);
  eq(pool.length, 3, 'Raise only targets fallen allies');
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'raise', targetUid: u1.uid });
  ok(!u1.downed && u1.chp === Math.round(u1.maxHp * 0.25), 'basic Raise returns one ally at 25%');
  ok(u2.downed && u3.downed, 'basic Raise leaves the other fallen down');
  const again = ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'raise', targetUid: u2.uid });
  ok(again && again.ok === false, 'Raise is once per battle');
}

{
  const h = mk({ name: 'Healer' }); give(h, 'raise', 25);
  const a1 = mk({ name: 'A1' }), a2 = mk({ name: 'A2' }), a3 = mk({ name: 'A3' });
  const e = mk({ name: 'E', stats: { hp: 400, atk: 8, def: 2, spd: 8 } });
  const st = fight([h, a1, a2, a3], e, 12);
  const uh = unit(st, h), u1 = unit(st, a1), u2 = unit(st, a2), u3 = unit(st, a3);
  drop(u1); drop(u2); drop(u3);
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'raise', targetUid: u2.uid });
  ok(!u1.downed && !u2.downed && !u3.downed, 'advanced Resurrection raises three');
  eq(u2.chp, Math.round(u2.maxHp * 0.80), 'clicked ally returns at 80%');
  eq(u1.chp, Math.round(u1.maxHp * 0.80), 'second fallen returns at 80%');
}

console.log('\n-- Grove Rise: 15% less HP than healer, two-hit ward --');
{
  const d = mk({ name: 'Druid' }); give(d, 'grove_raise', 1);
  const a1 = mk({ name: 'A1' });
  const e = mk({ name: 'E', stats: { hp: 400, atk: 8, def: 2, spd: 8 } });
  const st = fight([d, a1], e, 13);
  const ud = unit(st, d), u1 = unit(st, a1);
  drop(u1);
  ADV.Combat.act(st, ud, { kind: 'skill', skillId: 'grove_raise', targetUid: u1.uid });
  eq(u1.chp, Math.round(u1.maxHp * 0.2125), 'Grove Rise is 15% less than 25%');
  const ward = u1.statuses.find(s => s.kind === 'ward');
  ok(ward && ward.hits === 2, 'Grove Rise grants a 2-hit ward');
}

console.log('\n-- Stand Fast: tank self-revive charges --');
{
  const t = mk({ name: 'Tank' }); give(t, 'stand_fast', 1);
  const e = mk({ name: 'E', stats: { hp: 400, atk: 40, def: 2, spd: 8 } });
  const st = fight(t, e, 14);
  const ut = unit(st, t), ue = unit(st, e);
  ok(!ADV.Combat.skillNeedsAuto(t, 'stand_fast', false), 'self-revive is not an auto skill');
  eq(ADV.Combat.validTargets(st, ut, 'stand_fast', false).length, 0, 'self-revive has no click targets');
  kill(st, ue, ut);
  ok(!ut.downed, 'tank stands back up');
  eq(ut.chp, Math.round(ut.maxHp * 0.25), 'basic Stand Fast returns at 25%');
  ok(!st.over, 'the fight continues after a self-revive');
  kill(st, ue, ut);
  ok(ut.downed, 'basic Stand Fast is spent after one rise');
}

{
  const t = mk({ name: 'Tank' }); give(t, 'stand_fast', 25);
  const e = mk({ name: 'E', stats: { hp: 800, atk: 40, def: 2, spd: 8 } });
  const st = fight(t, e, 15);
  const ut = unit(st, t), ue = unit(st, e);
  kill(st, ue, ut);
  kill(st, ue, ut);
  kill(st, ue, ut);
  ok(!ut.downed && ut.chp === Math.round(ut.maxHp * 0.80), 'advanced Undying rises three times at 80%');
  kill(st, ue, ut);
  ok(ut.downed, 'the fourth fall stays down');
}

console.log('\n-- Defiant Stand: weaker rise, damage buff, extra turn --');
{
  const w = mk({ name: 'Warrior' }); give(w, 'defiant_stand', 1);
  const e = mk({ name: 'E', stats: { hp: 400, atk: 40, def: 2, spd: 8 } });
  const st = fight(w, e, 16);
  const uw = unit(st, w), ue = unit(st, e);
  ADV.Combat.currentTurn(st);
  kill(st, ue, uw);
  ok(!uw.downed, 'warrior stands back up');
  eq(uw.chp, Math.round(uw.maxHp * 0.2125), 'warrior rises with 15% less than the tank');
  const buff = uw.statuses.find(s => s.kind === 'atkBuff');
  ok(buff && buff.mult === 2 && buff.rounds === 2, 'warrior gets +100% damage for 2 turns');
  ok(st.events.some(x => x.t === 'grantTurn' && x.uid === uw.uid), 'warrior is granted an extra turn');
}

console.log('\n-- Shadow Rise: thin, unseen, evasive; advanced twice --');
{
  const r = mk({ name: 'Rogue' }); give(r, 'shadow_rise', 1);
  const e = mk({ name: 'E', stats: { hp: 400, atk: 40, def: 2, spd: 8 } });
  const st = fight(r, e, 17);
  const ur = unit(st, r), ue = unit(st, e);
  kill(st, ue, ur);
  ok(!ur.downed, 'rogue fades back');
  eq(ur.chp, Math.round(ur.maxHp * 0.05), 'basic Shadow Rise returns at 5%');
  ok(ur.stealth && ur.stealthRounds === 2, 'invisible for 2 turns');
  eq(ur.evade, 2, 'evasive for 2 attacks');
  kill(st, ue, ur);
  ok(ur.downed, 'basic Shadow Rise does not trigger again');
}

{
  const r = mk({ name: 'Rogue' }); give(r, 'shadow_rise', 25);
  const e = mk({ name: 'E', stats: { hp: 800, atk: 40, def: 2, spd: 8 } });
  const st = fight(r, e, 18);
  const ur = unit(st, r), ue = unit(st, e);
  kill(st, ue, ur);
  eq(ur.chp, Math.round(ur.maxHp * 0.50), 'advanced Cheat Death returns at 50%');
  ok(ur.stealth && ur.stealthRounds === 2, 'advanced stays unseen for 2 turns');
  kill(st, ue, ur);
  ok(!ur.downed, 'advanced Cheat Death can trigger a second time');
  kill(st, ue, ur);
  ok(ur.downed, 'no third rise');
}

console.log('\n-- Raise still has a turn after the lead falls --');
{
  const lead = mk({ name: 'Lead' });
  const h = mk({ name: 'Healer' }); give(h, 'raise', 1);
  const e = mk({ name: 'E', stats: { hp: 400, atk: 8, def: 2, spd: 8 } });
  const st = ADV.Combat.create([lead, h], [e], { rng: new ADV.RNG(21), leaderId: lead.id });
  const ul = unit(st, lead), uh = unit(st, h), ue = unit(st, e);
  kill(st, ue, ul);
  ok(ul.downed, 'lead is down');
  ok(!st.over, 'the fight stays open for a raise');
  ok(!st.leaderFell, 'the company is not broken yet');
  ok(st.leaderDowned, 'the lead is waiting on a raise');
  const pool = ADV.Combat.validTargets(st, uh, 'raise', false);
  ok(pool.includes(ul), 'the healer can target the lead');
  const planned = ADV.Combat.planFor(st, uh);
  eq(planned && planned.skillId, 'raise', 'AI healer raises the lead');
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'raise', targetUid: ul.uid });
  ok(!ul.downed, 'the lead stands');
  ok(!st.leaderDowned && !st.leaderFell, 'raising the lead saves the company');
}

{
  const lead = mk({ name: 'Lead' });
  const h = mk({ name: 'Healer' }); give(h, 'raise', 1);
  const e = mk({ name: 'E', stats: { hp: 800, atk: 80, def: 2, spd: 8 } });
  const st = ADV.Combat.create([lead, h], [e], { rng: new ADV.RNG(22), leaderId: lead.id });
  const ul = unit(st, lead), uh = unit(st, h), ue = unit(st, e);
  kill(st, ue, ul);
  ok(!st.over, 'a downed lead does not end the fight by itself');
  kill(st, ue, uh);
  ok(st.over && st.winner === 'b', 'the field is lost');
  ok(st.leaderFell, 'a wipe with the lead still down breaks the company');
}

{
  const lead = mk({ name: 'Lead', stats: { hp: 200, atk: 12, def: 4, spd: 40 } });
  const h = mk({ name: 'Healer' }); give(h, 'raise', 1);
  const e = mk({ name: 'E', stats: { hp: 400, atk: 8, def: 2, spd: 1 } });
  const st = ADV.Combat.create([lead, h], [e], { rng: new ADV.RNG(23), leaderId: lead.id });
  const ul = unit(st, lead);
  st.rng.chance = () => true;
  const fled = ADV.Combat.act(st, ul, { kind: 'flee' });
  ok(fled && fled.fled, 'the lead gets away');
  ok(st.over && st.leaderFled, 'flight still voids the contract at once');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
