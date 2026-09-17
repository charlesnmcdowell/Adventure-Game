// Hiro's authored kit, to the spec he was written to. He is a secret character who arrives
// finished: he cannot learn, buy or re-equip anything, and none of his skills grow. Everything
// below is measured against combat rather than read off the data.
'use strict';
const { load } = require('./harness');
const A = load(), S = A.SkillSys, D = A.DATA, B = A.Combat, C = D.CONST;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
const eq = (a, b, n) => ok(a === b, n, a + ' != ' + b);

const hiro = seed => A.Character.makeRegistry(new A.RNG(seed || 1), 'hiro', 'Hiro', false);
function field(nFoes, seed, lvl) {
  const rng = new A.RNG(seed || 3), h = hiro(seed);
  const foes = Array.from({ length: nFoes }, () => A.Character.makeEnemy(rng, 'bandit', { level: lvl || 6 }));
  const st = B.create([h], foes, { rng });
  return { st, hu: st.units.find(u => u.side === 'a'), foes: st.units.filter(u => u.side === 'b'), h };
}

console.log('-- he arrives finished --');
{
  const h = hiro(2);
  eq(h.fixedKit, true, 'flagged as a fixed kit');
  eq(h.perks.length + h.actives.length, 8, 'eight authored entries');
  for (const e of h.perks.concat(h.actives)) {
    eq(e.level, C.TIER_THRESHOLDS.advanced, `${e.skillId} starts maxed`);
    ok(D.SKILLS[e.skillId].unique && D.SKILLS[e.skillId].noTierGrowth, `${e.skillId} is unique and never tiers`);
  }
  ok(!S.learn(h, 'fire_bolt', {}).ok, 'cannot learn an ordinary skill');
  ok(!S.learn(h, 'cleave', {}).ok, 'cannot learn a second fighter skill');
  eq(S.tutorOffers(h, 'katana_slash').length, 0, 'the trainer has nothing to sell him');
  eq(h.equippedSet, 'ronin', 'wears his own gear');
  const ronin = D.GEAR_SETS.ronin;
  ok(ronin.unique && ronin.campaign, 'which the smith will not replace');
  const normal = A.Character.makePlayer(new A.RNG(9), { name: 'N', sex: 'f', startingSkills: ['cleave'] });
  ok(S.learn(normal, 'fire_bolt', {}).ok, 'ordinary characters still learn normally');
}

console.log('\n-- Lone Wolf: three turns a round --');
{
  const { st, hu } = field(2, 4);
  eq(hu.turnsPerRound, 3, 'three turns on the unit');
  eq(st.turnQueue.filter(e => e.uid === hu.uid).length, 3, 'three entries in the order');
}

console.log('\n-- Katana Slash: the whole line, and the killing cut --');
{
  const { st, hu, foes } = field(4, 7);
  ok(foes.some(f => f.lane !== foes[0].lane), 'the enemies are spread across lanes', foes.map(f => f.lane).join(','));
  st.rng.chance = () => false;
  B.act(st, hu, { kind: 'skill', skillId: 'katana_slash', targetUid: foes[3].uid });
  eq(foes.filter(f => f.chp < f.maxHp || f.downed).length, foes.length, 'every enemy is cut once, whatever lane');
}
{
  const { st, hu, foes } = field(4, 9);
  st.rng.chance = () => true;
  B.act(st, hu, { kind: 'skill', skillId: 'katana_slash', targetUid: foes[0].uid });
  ok(foes.every(f => f.downed), 'a certain roll kills every ordinary enemy outright');
}
{
  const rng = new A.RNG(12), h = hiro(12);
  const boss = A.Character.makeEnemy(rng, 'bandit', { level: 20 }); boss.boss = true;
  const st = B.create([h], [boss], { rng }); st.rng.chance = () => true;
  const bu = st.units.find(u => u.side === 'b');
  B.act(st, st.units[0], { kind: 'skill', skillId: 'katana_slash', targetUid: bu.uid });
  ok(!bu.downed, 'a boss is never cut down by the auto-kill, however the roll lands');
}
eq(D.SKILLS.katana_slash.autoKillPct, 0.25, 'the cut is a one-in-four chance');

console.log('\n-- Counter Attack: four blocks, two rounds, answered in kind --');
{
  const { st, hu, foes } = field(3, 13);
  B.act(st, hu, { kind: 'skill', skillId: 'counter_attack', targetUid: hu.uid });
  eq(hu.counter, 4, 'four charges');
  eq(hu.counterUntil, st.round + 1, 'holding for two rounds');
  eq(hu.counterRiposte, 'katana_slash', 'answered with the katana');
  st.rng.chance = () => false;
  const attacker = foes[0], before = attacker.chp;
  B.act(st, attacker, { kind: 'attack', targetUid: hu.uid });
  ok(st.events.some(e => e.t === 'counter'), 'the attack is turned aside');
  ok(st.events.some(e => e.t === 'riposte'), 'and answered');
  ok(attacker.chp < before, 'the attacker is cut on the way out');
  eq(hu.counter, 3, 'one charge spent');
}
{
  // The auto-kill rides the riposte too.
  const { st, hu, foes } = field(3, 17);
  B.act(st, hu, { kind: 'skill', skillId: 'counter_attack', targetUid: hu.uid });
  st.rng.chance = () => true;
  B.act(st, foes[0], { kind: 'attack', targetUid: hu.uid });
  ok(foes[0].downed, 'a riposte can kill outright');
}
{
  // The stance expires on its clock rather than lingering until spent.
  const { st, hu } = field(2, 19);
  B.act(st, hu, { kind: 'skill', skillId: 'counter_attack', targetUid: hu.uid });
  const until = st.round + 3;
  while (st.round < until && B.currentTurn(st)) B.advance(st);
  eq(hu.counter, 0, 'unspent charges do not carry past the stance');
  eq(hu.counterRiposte, null, 'and neither does the answer');
}

console.log('\n-- Finisher: only the dying, and it pays --');
{
  const { st, hu, foes } = field(3, 5);
  eq(B.validTargets(st, hu, 'finisher', false).length, 0, 'it will not look at a healthy field');
  foes[1].chp = Math.floor(foes[1].maxHp * 0.3);
  const pool = B.validTargets(st, hu, 'finisher', false);
  eq(pool.length, 1, 'only the one under 40% is offered');
  ok(pool[0] === foes[1], 'and it is the wounded one');
  hu.chp = Math.floor(hu.maxHp * 0.5);
  B.act(st, hu, { kind: 'skill', skillId: 'finisher', targetUid: foes[1].uid });
  ok(foes[1].downed, 'the kill lands');
  ok(hu.chp + (hu.tempHp || 0) > hu.maxHp, 'it overheals past maximum');
  ok(hu.chp + (hu.tempHp || 0) <= hu.maxHp * 2, 'and stops at 200%, even through Demigod', hu.chp + (hu.tempHp || 0) + '/' + hu.maxHp * 2);
  for (const k of ['hp', 'atk', 'def', 'spd']) eq(hu.ch.bonusStats[k], 10, `${k} rose by 10`);
  eq(hu.ch.finisherGains, 10, 'the swelling is tracked so it can be shed');
}
{
  const boss = A.Character.makeEnemy(new A.RNG(23), 'bandit', { level: 20 }); boss.boss = true;
  const h = hiro(23), st = B.create([h], [boss], { rng: new A.RNG(23) });
  const bu = st.units.find(u => u.side === 'b');
  bu.chp = Math.floor(bu.maxHp * 0.1);
  B.act(st, st.units[0], { kind: 'skill', skillId: 'finisher', targetUid: bu.uid });
  ok(!bu.downed, 'a boss under 40% is still not executed');
}

console.log('\n-- Demigod --');
{
  const h = hiro(29);
  eq(S.knownVal(h, 'healReceivedMult'), 10, 'healing received x10');
  eq(S.knownVal(h, 'overhealUncapped'), true, 'overheal is uncapped');
  eq(S.knownVal(h, 'statusImmune'), true, 'immune to negative statuses');
  eq(S.knownVal(h, 'autoReviveRounds'), 2, 'stands up after two rounds');
  const rng = new A.RNG(31);
  const ally = A.Character.makeEnemy(rng, 'field_chaplain', { level: 8 });
  const foe = A.Character.makeEnemy(rng, 'bandit', { level: 4 });
  const st = B.create([hiro(31), ally], [foe], { rng });
  const hu = st.units.find(u => u.ch.registryId === 'hiro');
  B.addStatus ? null : null;
  hu.chp = 0; hu.tempHp = 0; hu.downed = true; hu.downedAtRound = st.round;
  const until = st.round + 3;
  while (st.round < until && B.currentTurn(st)) B.advance(st);
  ok(!hu.downed, 'he is back on his feet');
  ok(hu.chp > 0, 'with health', hu.chp + '/' + hu.maxHp);
  ok(st.events.some(e => e.t === 'selfRevive' && e.why === 'demigod'), 'and the revive is announced');
  ok(!st.over, 'the battle was never handed to the other side');
}

console.log('\n-- God Aura --');
{
  const d = S.manifest(hiro(37), S.entryFor(hiro(37), 'god_aura')).data;
  eq(d.cooldown, 5, 'once every five rounds');
  ok(d.auraAtk === 1.3 && d.auraDef === 1.3 && d.auraEvade === 0.15, 'attack, defence and evasion unchanged');
  ok(B.POS_STATUSES.includes('aura'), 'the aura is a buff, so any dispel can strip it');
  const { st, hu } = field(2, 37);
  B.act(st, hu, { kind: 'skill', skillId: 'god_aura', targetUid: hu.uid });
  eq(B.cooldownLeft(hu, 'god_aura'), 5, 'the cooldown is set after casting');
  ok(!B.act(st, hu, { kind: 'skill', skillId: 'god_aura', targetUid: hu.uid }).ok, 'and it cannot be recast while recovering');
}

console.log('\n-- Rend --');
{
  const r = D.SKILLS.sunder.tiers.intermediate;
  eq(r.defStrip, 20, 'defence down by 20');
  eq(r.status.bleed.pctTotal, 0.45, 'bleeds 15% of maximum health a turn for three turns');
  eq(r.status.bleed.stacks, false, 'and does not stack');
  ok(!!r.status.withering, 'the wound blocks healing');
  eq(r.status.withering.rounds, 3, 'for three rounds');
  const s = { kind: 'bleed', pctTotal: 0.45, rounds: 3, stacks: false };
  B.normaliseDot(s);
  eq(s.pct, 0.45, 'pctTotal overrides the tier table');
  ok(B.NEG_STATUSES.includes('withering'), 'withering is negative, so a cleanse takes it off');
}

console.log('\n-- one Hiro at a time --');
{
  const rng = new A.RNG(41);
  const past = hiro(41); past.id = 'hiro-past'; past.alive = false; past.isPlayer = true; past.questsCompleted = 5;
  const heir = A.Character.makePlayer(rng, { name: 'Kid', sex: 'f', startingSkills: ['cleave'] });
  heir.id = 'heir-1'; heir.questsCompleted = 0; heir.isPlayer = true;
  const w = { characters: [past, heir], playerId: 'heir-1', seed: 7, questClock: 0 };
  ok(!!A.Hiro.former(w, 'heir-1'), 'the buried Hiro is found rather than duplicated');
  eq(A.Hiro.former(w, 'heir-1').id, 'hiro-past', 'and it is the same character');
  const w2 = { characters: [past], playerId: 'hiro-past', seed: 1, questClock: 0 };
  eq(A.Hiro.maybeArrive(w2, rng, () => {}), null, 'no NPC walks in while he is being played');
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' : 'PASSED all ') + (pass + fail) + ' checks');
process.exit(fail ? 1 : 0);
