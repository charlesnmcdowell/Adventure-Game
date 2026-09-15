// Melee extra targets, cleave rows + hit-scale, momentum across targets,
// septic spread, ice/lightning vs constructs, and wild mini-bosses.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

const mk = (o) => ADV.Character.base(Object.assign({ stats: { hp: 400, atk: 10, def: 0, spd: 10 } }, o));
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }
function dmgOn(st, uid) {
  return st.events.filter(e => e.t === 'damage' && e.uid === uid).reduce((s, e) => s + (e.dmg || 0), 0);
}

console.log('\n-- Cleave rows and hit-scale --');
{
  const hero = mk({ name: 'Cleave' });
  give(hero, 'cleave', 1);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' }), c = mk({ name: 'C' });
  const st = fight(hero, [a, b, c], 2);
  const uh = unit(st, hero);
  const ua = unit(st, a), ub = unit(st, b), uc = unit(st, c);
  ua.lane = 'front'; ub.lane = 'mid'; uc.lane = 'back';
  const before = { a: ua.chp, b: ub.chp, c: uc.chp };
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'cleave', targetUid: ua.uid });
  ok(ua.chp < before.a, 'basic Cleave hits the target row');
  ok(ub.chp === before.b && uc.chp === before.c, 'basic Cleave does not reach other rows');
}

{
  const hero = mk({ name: 'Whirl' });
  give(hero, 'cleave', 25);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' }), c = mk({ name: 'C' });
  const st = fight(hero, [a, b, c], 3);
  const uh = unit(st, hero);
  const ua = unit(st, a), ub = unit(st, b), uc = unit(st, c);
  ua.lane = 'front'; ub.lane = 'mid'; uc.lane = 'back';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'cleave', targetUid: ua.uid });
  ok(ua.chp < ua.maxHp, 'advanced Cleave still hits the front');
  ok(ub.chp === ub.maxHp && uc.chp === uc.maxHp, 'advanced Cleave does not cut through a standing front line');
}

{
  const hero = mk({ name: 'Scale' });
  give(hero, 'cleave', 1);
  const one = mk({ name: 'Solo' });
  const st1 = fight(hero, one, 4);
  const uh1 = unit(st1, hero), u1 = unit(st1, one);
  ADV.Combat.act(st1, uh1, { kind: 'skill', skillId: 'cleave', targetUid: u1.uid });
  const soloDmg = dmgOn(st1, u1.uid);

  const hero2 = mk({ name: 'Scale2' });
  give(hero2, 'cleave', 1);
  const p = mk({ name: 'P' }), q = mk({ name: 'Q' });
  const st2 = fight(hero2, [p, q], 5);
  const uh2 = unit(st2, hero2), up = unit(st2, p), uq = unit(st2, q);
  up.lane = 'front'; uq.lane = 'front';
  ADV.Combat.act(st2, uh2, { kind: 'skill', skillId: 'cleave', targetUid: up.uid });
  const pairDmg = dmgOn(st2, up.uid);
  ok(pairDmg >= Math.round(soloDmg * 1.5) - 1, 'Cleave damage grows with enemies hit', pairDmg + ' vs solo ' + soloDmg);
  ok(uq.chp < uq.maxHp, 'same-row mate is also hit');
}

console.log('\n-- Melee extra targets by tier --');
{
  const hero = mk({ name: 'Stab' });
  give(hero, 'sunder', 1);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' });
  const st = fight(hero, [a, b], 6);
  const uh = unit(st, hero), ua = unit(st, a), ub = unit(st, b);
  ua.lane = 'front'; ub.lane = 'front';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'sunder', targetUid: ua.uid });
  ok(ua.chp < ua.maxHp, 'basic Sunder hits the target');
  ok(ub.chp === ub.maxHp, 'basic Sunder does not splash');
}

{
  const hero = mk({ name: 'Rend' });
  give(hero, 'sunder', 10);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' }), c = mk({ name: 'C' });
  const st = fight(hero, [a, b, c], 7);
  const uh = unit(st, hero);
  const ua = unit(st, a), ub = unit(st, b), uc = unit(st, c);
  ua.lane = 'front'; ub.lane = 'front'; uc.lane = 'mid';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'sunder', targetUid: ua.uid });
  const hit = [ua, ub, uc].filter(u => u.chp < u.maxHp).length;
  eq(hit, 2, 'intermediate Sunder hits two enemies');
}

{
  const hero = mk({ name: 'Shatter' });
  give(hero, 'sunder', 25);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' }), c = mk({ name: 'C' });
  const st = fight(hero, [a, b, c], 8);
  const uh = unit(st, hero);
  const ua = unit(st, a), ub = unit(st, b), uc = unit(st, c);
  ua.lane = 'front'; ub.lane = 'front'; uc.lane = 'front';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'sunder', targetUid: ua.uid });
  const hit = [ua, ub, uc].filter(u => u.chp < u.maxHp).length;
  eq(hit, 3, 'advanced Sunder hits three reachable enemies');
}

{
  const hero = mk({ name: 'Cover' });
  give(hero, 'sunder', 25);
  const a = mk({ name: 'A' }), mid = mk({ name: 'Mid' }), back = mk({ name: 'Back' });
  const st = fight(hero, [a, mid, back], 8);
  const uh = unit(st, hero), ua = unit(st, a), um = unit(st, mid), ubk = unit(st, back);
  ua.lane = 'front'; um.lane = 'mid'; ubk.lane = 'back';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'sunder', targetUid: ua.uid });
  ok(ua.chp < ua.maxHp && um.chp === um.maxHp && ubk.chp === ubk.maxHp, 'melee extras do not swing through cover');
}

console.log('\n-- Momentum stacks across different targets --');
{
  const hero = mk({ name: 'Mom', stats: { hp: 200, atk: 20, def: 0, spd: 20 } });
  give(hero, 'momentum', 1);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' });
  const st = fight(hero, [a, b], 9);
  const uh = unit(st, hero), ua = unit(st, a), ub = unit(st, b);
  ADV.Combat.act(st, uh, { kind: 'attack', targetUid: ua.uid });
  const first = dmgOn(st, ua.uid);
  ADV.Combat.act(st, uh, { kind: 'attack', targetUid: ub.uid });
  const second = dmgOn(st, ub.uid);
  ok(second > first, 'second attacking turn hits harder even on a new target', first + ' then ' + second);
  eq(uh.momentumStacks, 1, 'one stack after the second attacking turn');
}

{
  const hero = mk({ name: 'HoldMom' });
  give(hero, 'momentum', 1);
  const a = mk({ name: 'A' });
  const st = fight(hero, a, 10);
  const uh = unit(st, hero), ua = unit(st, a);
  ADV.Combat.act(st, uh, { kind: 'attack', targetUid: ua.uid });
  ADV.Combat.act(st, uh, { kind: 'hold' });
  eq(uh.momentumStacks, 0, 'holding breaks the momentum chain');
  ok(!uh.momentumArmed, 'hold clears the armed flag');
}

console.log('\n-- Septic Sanguine leaps to the nearest ally --');
{
  const hero = mk({ name: 'Septic' });
  give(hero, 'septic_sanguine', 1);
  give(hero, 'venom_fang', 1);
  const a = mk({ name: 'A' }), b = mk({ name: 'B' }), c = mk({ name: 'C' });
  const st = fight(hero, [a, b, c], 11);
  const uh = unit(st, hero);
  const ua = unit(st, a), ub = unit(st, b), uc = unit(st, c);
  ua.lane = 'front'; ub.lane = 'mid'; uc.lane = 'back';
  ADV.Combat.act(st, uh, { kind: 'skill', skillId: 'venom_fang', targetUid: ua.uid });
  ok(ua.statuses.some(s => s.kind === 'bleed') && ua.statuses.some(s => s.kind === 'poison'), 'primary is bled and poisoned');
  ok(ub.statuses.some(s => s.kind === 'bleed') && ub.statuses.some(s => s.kind === 'poison'), 'the nearest row is also tagged');
  ok(!uc.statuses.some(s => s.kind === 'bleed' || s.kind === 'poison'), 'the leap is one body, not the whole field');
}

console.log('\n-- Ice and lightning bite constructs harder --');
{
  const mage = mk({ name: 'Mage', stats: { hp: 100, atk: 20, def: 0, spd: 10 } });
  give(mage, 'spark', 1);
  give(mage, 'frost_touch', 1);
  const man = mk({ name: 'Man', organic: true, species: 'human', stats: { hp: 400, atk: 1, def: 0, spd: 1 } });
  const bot = mk({ name: 'Bot', organic: false, species: 'construct', stats: { hp: 400, atk: 1, def: 0, spd: 1 } });
  const st = fight(mage, [man, bot], 12);
  const um = unit(st, mage), uh = unit(st, man), ub = unit(st, bot);
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'spark', targetUid: uh.uid });
  const flesh = dmgOn(st, uh.uid);
  ADV.Combat.act(st, um, { kind: 'skill', skillId: 'spark', targetUid: ub.uid });
  const steel = dmgOn(st, ub.uid);
  ok(steel > flesh, 'lightning deals more to a construct than to flesh', flesh + ' vs ' + steel);
  ok(steel >= Math.round(flesh * 1.7) - 2, 'the construct multiplier is the ice/lightning bonus', steel + ' / ' + flesh);
}

console.log('\n-- Neutral 300g+ contracts finish on a mini-boss --');
{
  const n = Object.keys(ADV.DATA.MINIBOSSES || {}).length;
  eq(n, 30, 'thirty mini-bosses are registered');
  const uniqueSkills = Object.values(ADV.DATA.MINIBOSSES).map(e => e.actives[0]);
  ok(uniqueSkills.every(id => ADV.DATA.SKILLS[id] && ADV.DATA.SKILLS[id].unique), 'each mini-boss leads with an unlearnable skill');
  const learn = ADV.SkillSys.learn(mk({}), uniqueSkills[0]);
  ok(!learn.ok, 'the unique mini-boss skill cannot be learned');

  const rng = new ADV.RNG(20260917);
  let stamped = 0, missing = 0;
  for (let i = 0; i < 8; i++) {
    const q = ADV.Quests.makeHazard(rng, 'hazard2', 'neutral');
    if (q.payout < 300) continue;
    const last = q.encounters[q.encounters.length - 1];
    const lead = last.enemyTypeIds[0];
    if (last.boss && ADV.DATA.BOSSES[lead] && ADV.DATA.BOSSES[lead].miniboss) stamped++;
    else missing++;
  }
  const q600 = ADV.Quests.makeHazard(rng, 'hazard3', 'neutral');
  const last600 = q600.encounters[q600.encounters.length - 1];
  ok(stamped >= 1 && missing === 0, '300g neutral hazards finish on a mini-boss', stamped + ' stamped, ' + missing + ' missed');
  ok(last600.boss && ADV.DATA.BOSSES[last600.enemyTypeIds[0]].miniboss, '600g neutral hazards finish on a mini-boss');
  ok(q600.monsterBoss && q600.isBoss, 'those contracts carry boss rules');

  const q500 = ADV.Quests.make(rng, 3, 'party', 'neutral');
  const last500 = q500.encounters[q500.encounters.length - 1];
  ok(q500.payout >= 300 && last500.boss && ADV.DATA.BOSSES[last500.enemyTypeIds[0]].miniboss,
    'high-pay neutral party jobs also finish on a mini-boss');
}

console.log('\n-- Faction kits --');
{
  ok(ADV.DATA.ENEMIES.hedge_mage.actives.includes('frost_touch'), 'criminal hedge mage casts frost');
  ok(ADV.DATA.ENEMIES.town_watch.actives.includes('sunder') && ADV.DATA.ENEMIES.town_watch.actives.includes('taunt'), 'town watch holds the line');
  ok(ADV.DATA.ENEMIES.plated_sentinel.actives.includes('mace_swing') && ADV.DATA.ENEMIES.plated_sentinel.actives.includes('shield_wall'), 'sentinels fight in plate');
  ok(ADV.DATA.ENEMIES.dire_wolf.actives.includes('pack_snap'), 'wolves have a unique melee');
  ok(ADV.DATA.SKILLS.pack_snap.unique, 'pack snap cannot be learned');
  ok(ADV.DATA.ENEMIES.ember_cultist.camp === 'law', 'ember cultists stand with the law');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
