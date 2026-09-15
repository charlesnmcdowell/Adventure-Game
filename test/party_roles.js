// NPC leaders fill healer + tank seats; personal DR lands after the hit.
'use strict';
const { load } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n + (x !== undefined ? '  [' + x + ']' : '')); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function mk(o) { return ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 10, def: 0, spd: 10 } }, o)); }
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}
const yes = { chance: () => true, pick: a => a[0], int: (a, b) => a, float: () => 0 };

console.log('\n-- Role detection uses skills, not just inclination --');
{
  const fighter = mk({ name: 'Fighter' });
  fighter.archetypeInclination = ['fighter'];
  give(fighter, 'mend', 1);
  ok(ADV.Party.isHealer(fighter), 'a fighter who learned Mend counts as a healer');
  ok(!ADV.Party.isTank(fighter), 'Mend does not make them a tank');

  const tank = mk({ name: 'Tank' });
  tank.archetypeInclination = ['rogue'];
  give(tank, 'bulwark', 1);
  ok(ADV.Party.isTank(tank), 'Bulwark perk counts as tank');
  ok(!ADV.Party.isHealer(tank), 'Bulwark does not make them a healer');
}

console.log('\n-- Leaders pick the missing seat first --');
{
  const world = { parties: [], characters: [], edges: [] };
  const lead = mk({ name: 'Lead' });
  lead.archetypeInclination = ['fighter'];
  const healer = mk({ name: 'Healer' });
  healer.archetypeInclination = ['healer'];
  give(healer, 'mend', 1);
  const tank = mk({ name: 'Tank' });
  tank.archetypeInclination = ['tank'];
  give(tank, 'bulwark', 1);
  const rogue = mk({ name: 'Rogue' });
  rogue.archetypeInclination = ['rogue'];
  give(rogue, 'backstab', 1);
  world.characters.push(lead, healer, tank, rogue);
  const p = ADV.Party.create(world, lead.id);
  eq(ADV.Party.missingRoles(world, p).join(','), 'healer,tank', 'a fighter lead is missing both seats');

  const first = ADV.Party.pickMember(yes, [rogue, tank, healer], ADV.Party.missingRoles(world, p));
  eq(first.name, 'Healer', 'missing healer is hired before a tank or rogue');
  p.memberIds.push(first.id); first.partyId = p.id; first.leaderId = lead.id;
  eq(ADV.Party.missingRoles(world, p).join(','), 'tank', 'healer seated, tank still missing');

  const second = ADV.Party.pickMember(yes, [rogue, tank], ADV.Party.missingRoles(world, p));
  eq(second.name, 'Tank', 'the leftover seat prefers the tank');
  p.memberIds.push(second.id); second.partyId = p.id;
  ok(!ADV.Party.missingRoles(world, p).length, 'both seats filled');
  ok(ADV.Party.hasHealer(world, p) && ADV.Party.hasTank(world, p), 'roster reports healer and tank');
}

console.log('\n-- Starting town companies try to field both --');
{
  let complete = 0;
  for (const seed of [3, 7, 11, 19, 23]) {
    const game = ADV.Game.newGame({ seed, name: 'Auden', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['mend'] });
    const npcParties = game.world.parties.filter(p => {
      const l = ADV.Party.leader(game.world, p);
      return l && l.alive && !l.isPlayer;
    });
    if (npcParties.some(p => !ADV.Party.missingRoles(game.world, p).length)) complete++;
  }
  ok(complete >= 3, 'most starting towns field at least one healer+tank company', complete + '/5');
}

console.log('\n-- Bulwark and frost armor cut finalized hits, including % HP --');
{
  const I = ADV.Combat._internals;
  const tank = mk({ name: 'Wall' });
  give(tank, 'bulwark', 1);
  const foe = mk({ name: 'Boss', stats: { hp: 80, atk: 10, def: 0, spd: 10 } });
  foe.boss = true;
  const st = ADV.Combat.create([tank], [foe], { rng: new ADV.RNG(3) });
  const ut = st.units.find(u => u.ch === tank);
  const uf = st.units.find(u => u.ch === foe);

  const raw = I.applyRawDamage(st, uf, ut, 100, 'attack');
  eq(raw, 50, 'Bulwark halves a 100 hit after the number is set');
  eq(ut.chp, ut.maxHp - 50, 'the HP loss matches');

  ut.chp = ut.maxHp;
  ut.statuses.push({ kind: 'iceArmor', pct: 0.5 });
  const iced = I.applyRawDamage(st, uf, ut, 100, 'attack');
  eq(iced, 25, 'Frost Armor 50% stacks with Bulwark on the same finalized 100 (0.5 × 0.5)');

  function godHit(defender) {
    const god = mk({ name: 'God', stats: { hp: 80, atk: 10, def: 0, spd: 20 } });
    god.isGod = true; god.role = 'god'; god.boss = true;
    const stG = ADV.Combat.create([defender], [god], { rng: new ADV.RNG(4) });
    const ug = stG.units.find(u => u.ch === god);
    const uv = stG.units.find(u => u.ch === defender);
    ADV.Combat.act(stG, ug, { kind: 'attack', targetUid: uv.uid });
    return stG.events.find(e => e.t === 'damage' && e.uid === uv.uid);
  }
  const hitBare = godHit(mk({ name: 'Bare' }));
  const wall = mk({ name: 'Wall2' });
  give(wall, 'bulwark', 1);
  const hitWall = godHit(wall);
  const godShare = ADV.DATA.CONST.GOD_HIT_PCT;
  ok(hitBare && hitBare.dmg >= Math.round(hitBare.maxHp || 200) * godShare, `god blow includes ${Math.round(godShare * 100)}% of max HP`, hitBare && hitBare.dmg);
  eq(hitWall && hitWall.dmg, Math.round(hitBare.dmg * 0.5), 'Bulwark halves that same % HP blow');
}

console.log('\n-- DoTs also eat personal reduction --');
{
  const tank = mk({ name: 'Wall' });
  give(tank, 'bulwark', 1);
  const foe = mk({ name: 'Dotter' });
  const st = ADV.Combat.create([tank], [foe], { rng: new ADV.RNG(5) });
  const ut = st.units.find(u => u.ch === tank);
  const uf = st.units.find(u => u.ch === foe);
  const dealt = ADV.Combat._internals.applyRawDamage(st, uf, ut, 50, 'dot');
  eq(dealt, 25, 'a 50-point DoT tick is halved by Bulwark');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
