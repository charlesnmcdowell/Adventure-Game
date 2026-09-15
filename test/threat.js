// Threat table, lane reading, heal/damage share, taunt reset, AI pick (THREAT_PROMPT.md).
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat;

function kit(ids, extra) {
  const ch = ADV.Character.base(Object.assign({ stats: { hp: 220, atk: 12, def: 10, spd: 10 } }, extra || {}));
  ch.archetypeInclination = extra && extra.archetypeInclination ? extra.archetypeInclination : [];
  for (const id of ids) {
    const sk = ADV.DATA.SKILLS[id];
    if (!sk) throw new Error('missing skill ' + id);
    (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: extra && extra.level || 1, uses: 0 });
  }
  return ch;
}
function fight(a, b, seed) {
  for (const c of [].concat(a, b)) c.combatHp = null;
  return Cb.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) });
}
function unit(st, ch) { return st.units.find(u => u.ch === ch); }

console.log('-- threatBaseFor reads the kit --');
{
  const tank = kit(['shield_wall', 'taunt', 'bulwark']);
  const fighter = kit(['cleave', 'sunder', 'momentum']);
  const mixed = kit(['cleave', 'fire_bolt', 'mend']);
  const rogue = kit(['backstab', 'smoke_bomb', 'opportunist']);
  const tB = Cb.threatBaseFor(tank), fB = Cb.threatBaseFor(fighter);
  const mB = Cb.threatBaseFor(mixed), rB = Cb.threatBaseFor(rogue);
  ok(tB > fB && fB > mB && mB > rB, 'tank > fighter > mixed > rogue', [tB, fB, mB, rB].join(' > '));
  const noGuard = kit(['cleave', 'sunder', 'momentum']);
  const withGuard = kit(['cleave', 'sunder', 'shield_wall']);
  ok(Cb.threatBaseFor(withGuard) > Cb.threatBaseFor(noGuard), 'Campaign.isTankSkill adds the guard bonus');
  const boss = kit(['cleave', 'sunder', 'momentum']); boss.boss = true;
  ok(Cb.threatBaseFor(boss) === Math.round(Cb.threatBaseFor(fighter) * 1.3), 'bosses get ×1.3');
  const hero = kit(['cleave']); hero.status = 'hero';
  ok(Cb.threatBaseFor(hero) > Cb.threatBaseFor(kit(['cleave'])), 'heroes get ×1.3');
}

console.log('-- lane layout follows threat, inclination still wins --');
{
  const tank = kit(['shield_wall', 'taunt', 'bulwark']);
  const rogue = kit(['backstab', 'smoke_bomb', 'opportunist']);
  const mage = kit(['fire_bolt', 'frost_touch', 'arcane_focus']);
  const st = fight([tank, rogue, mage], kit(['cleave']), 4);
  ok(unit(st, tank).lane === 'front', 'tank-kit lands front');
  ok(unit(st, rogue).lane !== 'front', 'rogue-kit does not take front', unit(st, rogue).lane);
  const forced = kit(['shield_wall', 'taunt', 'bulwark'], { archetypeInclination: ['ranger'] });
  const dummy = kit(['cleave']);
  const st2 = fight([forced, dummy], kit(['mend']), 5);
  ok(unit(st2, forced).lane === 'back', 'explicit archetypeInclination still wins');
}

console.log('-- healing, cleanse, self-heal, revive --');
{
  const healer = kit(['mend', 'regenerate']);
  const ally = kit(['cleave']);
  const foe = kit(['cleave']);
  const st = fight([healer, ally], foe, 6);
  const uh = unit(st, healer), ua = unit(st, ally);
  const base = uh.threat;
  ua.chp = Math.round(ua.maxHp * 0.2);
  Cb.act(st, uh, { kind: 'skill', skillId: 'mend', targetUid: ua.uid });
  ok(uh.threat > base, 'healing generates threat');
  const full = Math.round(1 * 60);
  const gained = uh.threat - base;
  ok(gained > 20 && gained <= full + 16, 'heal threat is a fraction of max HP restored', gained);
  const self = kit(['mend']);
  const foe2 = kit(['cleave']);
  const stS = fight(self, foe2, 7);
  const us = unit(stS, self);
  const b2 = us.threat;
  us.chp = Math.round(us.maxHp * 0.2);
  Cb.act(stS, us, { kind: 'skill', skillId: 'mend', targetUid: us.uid });
  const selfGain = us.threat - b2;
  ok(selfGain < gained, 'self-heal counts at half', selfGain + ' vs ' + gained);
  ua.statuses.push({ kind: 'poison', power: 0.6, rounds: 3, srcAtk: 10 });
  const beforeC = uh.threat;
  Cb.healCleanse(st, ua, 'dots', uh.uid);
  ok(uh.threat >= beforeC + 8, 'cleanse credits +8 per status');
}

console.log('-- damage share, decay, stealth, killShot --');
{
  const a = kit(['cleave']); const b = kit(['cleave']); const e = kit(['cleave']);
  const st = fight([a, b], e, 8);
  const ua = unit(st, a), ub = unit(st, b), ue = unit(st, e);
  ok((ua.threatDamage || 0) === 0, 'opens at zero damage-threat');
  Cb._internals.dealDamage(st, ua, ue, 80, 'attack');
  ok(ua.threatDamage > 0, 'over-share writes threatDamage');
  const first = ua.threatDamage;
  Cb._internals.dealDamage(st, ub, ue, 80, 'attack');
  ok(ua.threatDamage < first, 'the component falls when others catch up', ua.threatDamage + ' < ' + first);
  ua.damageDealt = 4000;
  Cb._internals.dealDamage(st, ua, ue, 10, 'attack');
  ok(ua.threatDamage <= 90, 'damage-threat caps at 90');
  const burst = ua.threat = ua.threatBase + 80;
  Cb._internals.endRoundTicks(st);
  ok(ua.threat < burst && ua.threat >= ua.threatBase, 'decay moves toward base and never past it', ua.threat);
  ua.threat = 99; ua.stealth = true;
  ok(Cb.threatOf(ua) === 0, 'stealth contributes 0');
  ok(ua.threat === 99, 'stealth holds the stored value');
  ua.stealth = false;
  ok(Cb.threatOf(ua) === 99 + (ua.threatDamage || 0), 'threat resumes when stealth breaks');
  const glass = kit(['cleave']); glass.stats.hp = 20;
  const wall = kit(['shield_wall', 'taunt', 'bulwark']);
  const shooter = kit(['aimed_shot']);
  const stK = fight([shooter], [glass, wall], 2);
  const ug = stK.units.find(u => u.ch === glass), uw = stK.units.find(u => u.ch === wall);
  const us = stK.units.find(u => u.ch === shooter);
  ug.chp = 4; uw.chp = uw.maxHp;
  stK.rng = { float: () => 0.5 };
  const pick = Cb.threatTargets(stK, us, [ug, uw])[0];
  ok(pick === ug, 'finishable targets are still taken');
}

console.log('-- taunt resets the side --');
{
  const tank = kit(['taunt', 'shield_wall']);
  const healer = kit(['mend']);
  const foe = kit(['cleave']);
  const st = fight([tank, healer], foe, 9);
  const ut = unit(st, tank), uh = unit(st, healer), ue = unit(st, foe);
  Cb.addThreat(st, uh, 80, 'healing');
  ok(uh.threat > ut.threat, 'healer can climb above the tank');
  Cb.act(st, ut, { kind: 'skill', skillId: 'taunt', targetUid: ue.uid });
  ok(uh.threat === uh.threatBase, 'taunt resets allies to base');
  ok(ut.threat === ut.threatBase + 40, 'taunter sits +40 on top');
  ok(st.events.some(e => e.t === 'threatReset'), 'emits threatReset');
}

console.log('-- threatLeader hides a tie --');
{
  const a = kit(['cleave']); const b = kit(['cleave']); const e = kit(['cleave']);
  const st = fight([a, b], e, 2);
  const ua = unit(st, a), ub = unit(st, b);
  ua.threat = ub.threat = 80;
  ua.threatDamage = ub.threatDamage = 0;
  ok(Cb.threatLeader(st, 'a') == null, 'no crown when two units share the top');
  Cb.addThreat(st, ua, 10, 'taunt');
  ok(Cb.threatLeader(st, 'a') === ua, 'a unique lead returns that unit');
}

console.log('-- headline: tank holds the room --');
{
  const seeds = [3, 7, 11, 19, 29, 41, 53, 67];
  const totals = { Tank: 0, Fighter: 0, Healer: 0, Mage: 0, Rogue: 0 };
  const seen = { Tank: 0, Fighter: 0, Healer: 0, Mage: 0, Rogue: 0 };
  for (const seed of seeds) {
    const tank = kit(['shield_wall', 'taunt', 'bulwark']); tank.name = 'Tank';
    const fighter = kit(['cleave', 'sunder', 'momentum']); fighter.name = 'Fighter';
    const healer = kit(['mend', 'regenerate', 'devoted']); healer.name = 'Healer';
    const mage = kit(['fire_bolt', 'frost_touch', 'arcane_focus']); mage.name = 'Mage';
    const rogue = kit(['backstab', 'venom_fang', 'opportunist']); rogue.name = 'Rogue';
    const foes = [1, 2, 3, 4, 5].map(i => {
      const e = i <= 3 ? kit(['cleave', 'sunder']) : kit(['fire_bolt']);
      e.name = 'E' + i;
      return e;
    });
    const st = fight([tank, fighter, healer, mage, rogue], foes, seed);
    let guard = 0;
    while (st.round <= 12 && !st.over && guard++ < 400) {
      const t = Cb.currentTurn(st);
      if (!t) break;
      if (t.unit.side === 'a') {
        if (t.unit.ch.name === 'Healer' && t.unit.chp < t.unit.maxHp * 0.7) {
          const ally = st.units.find(u => u.side === 'a' && !u.downed && u.chp < u.maxHp) || t.unit;
          Cb.act(st, t.unit, { kind: 'skill', skillId: 'mend', targetUid: ally.uid });
        } else if (t.unit.ch.name === 'Tank' && st.round === 2) {
          const foe = st.units.find(u => u.side === 'b' && !u.downed);
          if (foe) Cb.act(st, t.unit, { kind: 'skill', skillId: 'taunt', targetUid: foe.uid });
          else Cb.aiTakeTurn(st, t.unit);
        } else Cb.aiTakeTurn(st, t.unit);
      } else Cb.aiTakeTurn(st, t.unit);
      Cb.advance(st);
    }
    const hit = { Tank: 0, Fighter: 0, Healer: 0, Mage: 0, Rogue: 0 };
    for (const e of st.events) {
      if ((e.t !== 'damage' && e.t !== 'evade') || !e.by || !e.uid) continue;
      if (e.tag === 'dot' || e.tag === 'reflect' || e.tag === 'retaliation') continue;
      const src = st.units.find(u => u.uid === e.by);
      const tgt = st.units.find(u => u.uid === e.uid);
      if (!src || !tgt || src.side !== 'b' || tgt.side !== 'a') continue;
      if (hit[tgt.ch.name] != null) hit[tgt.ch.name]++;
    }
    for (const k of Object.keys(hit)) {
      totals[k] += hit[k];
      if (hit[k] > 0) seen[k]++;
    }
  }
  ok(totals.Tank > totals.Healer && totals.Tank > totals.Rogue, 'tank takes more incoming than healer and rogue', JSON.stringify(totals));
  ok(totals.Tank >= totals.Fighter, 'tank holds at least as much as the fighter', JSON.stringify(totals));
  ok(seen.Tank === seeds.length, 'the tank is found in every seed');
  const tank = kit(['shield_wall', 'taunt', 'bulwark']); tank.name = 'Tank';
  const fighter = kit(['cleave', 'sunder', 'momentum']); fighter.name = 'Fighter';
  const healer = kit(['mend', 'regenerate', 'devoted']); healer.name = 'Healer';
  const mage = kit(['fire_bolt', 'frost_touch', 'arcane_focus']); mage.name = 'Mage';
  const rogue = kit(['backstab', 'venom_fang', 'opportunist']); rogue.name = 'Rogue';
  const caster = kit(['fire_bolt']); caster.name = 'Caster';
  const stF = fight([tank, fighter, healer, mage, rogue], caster, 13);
  const us = unit(stF, caster);
  const pool = Cb.validTargets(stF, us, 'fire_bolt', false);
  const floorHits = { Tank: 0, Fighter: 0, Healer: 0, Mage: 0, Rogue: 0 };
  for (let i = 0; i < 200; i++) {
    const pick = Cb.threatTargets(stF, us, pool)[0];
    if (pick && floorHits[pick.ch.name] != null) floorHits[pick.ch.name]++;
  }
  ok(Object.values(floorHits).every(n => n > 0), 'the 8% floor still finds every kit', JSON.stringify(floorHits));
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
