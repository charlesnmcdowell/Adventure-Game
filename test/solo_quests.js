// Regular solo foes are halved. Reputation opens 300g and 600g solo bounties;
// the 600g finale fields a mini-boss with the usual tank + healer guard.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Q = ADV.Quests;
const C = ADV.DATA.CONST;

function gameOf(rep) {
  const g = ADV.Game.newGame({ seed: 44, name: 'Sable', sex: 'f', portraitSlot: 2, portraitSeed: 3, startingSkills: ['devoted', 'mend', 'raise'] });
  g.tutorial = { step: 'done' };
  const p = ADV.Game.player(g);
  p.reputation = rep;
  return { g, p };
}

console.log('-- regular solo foes are halved --');
{
  const raw = ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', { level: 8 });
  const half = ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', { level: 8 });
  Q.scaleSoloMook(half);
  ok(half.stats.hp === Math.max(8, Math.round(raw.stats.hp * 0.5)), 'solo mook HP is 50%');
  ok(half.stats.atk === Math.max(1, Math.round(raw.stats.atk * 0.5)), 'solo mook ATK is 50%');
  ok(half.stats.def === Math.max(1, Math.round(raw.stats.def * 0.5)), 'solo mook DEF is 50%');
  ok(half.stats.spd === Math.max(1, Math.round(raw.stats.spd * 0.5)), 'solo mook SPD is 50%');
  ok(C.SOLO_STAT_MULT === 0.5, 'SOLO_STAT_MULT is 50%');
}
{
  const solo = { track: 'solo', tier: 1, enemyLevels: [8, 8], encounters: [{ enemyTypeIds: ['bandit'], boss: false }] };
  const party = { track: 'party', tier: 1, enemyLevels: [8, 8], encounters: [{ enemyTypeIds: ['bandit'], boss: false }] };
  const a = Q.spawnEncounter(new ADV.RNG(5), solo, 0);
  const b = Q.spawnEncounter(new ADV.RNG(5), party, 0);
  ok(a[0].stats.hp <= Math.round(b[0].stats.hp * 0.5) + 1, 'spawned solo bandit is weaker than the same party spawn');
  ok(a[0].stats.atk < b[0].stats.atk, 'solo ATK is lower than the party spawn');
}

console.log('-- board posts 300g and 600g solo bounties --');
{
  const { g } = gameOf(0);
  const s300 = g.board.filter(q => q.track === 'solo' && (q.soloKind === 'solo300' || (q.soloPremium && q.minRep === 10 && !q.monsterBoss)));
  const s600 = g.board.filter(q => q.track === 'solo' && (q.soloKind === 'solo600' || (q.soloPremium && q.minRep === 15 && q.monsterBoss)));
  ok(s300.length === 1 && s300[0].payout === 400, 'one 300g-tier solo bounty is posted at 400g');
  ok(s600.length === 1 && s600[0].payout === 700, 'one 600g-tier solo bounty is posted at 700g');
  ok(s300[0].minRep === 10 && s300[0].soloPremium, '300g bounty asks for reputation 10');
  ok(s600[0].minRep === 15 && s600[0].soloPremium && s600[0].monsterBoss, '600g bounty asks for reputation 15 and is a mini-boss hunt');
  ok(!s300[0].monsterBoss && !s300[0].isBoss, '300g bounty is not a mini-boss fight');
  const last = s600[0].encounters[s600[0].encounters.length - 1];
  const bossId = last.enemyTypeIds[0];
  ok(last.boss && ADV.DATA.BOSSES[bossId] && ADV.DATA.BOSSES[bossId].miniboss, '600g finale is a wild mini-boss');
}

console.log('-- reputation gates the purse --');
{
  const q300 = { track: 'solo', minRep: 10, payout: 300, encounters: [{ enemyTypeIds: ['dire_wolf'], boss: false }] };
  const q600 = { track: 'solo', minRep: 15, payout: 600, encounters: [{ enemyTypeIds: ['dire_wolf'], boss: false }] };
  const low = gameOf(9);
  const mid = gameOf(10);
  const high = gameOf(15);
  ok(!Q.repGate(q300, low.p).ok && Q.repGate(q300, mid.p).ok, '300g opens at reputation 10');
  ok(!Q.repGate(q600, mid.p).ok && Q.repGate(q600, high.p).ok, '600g opens at reputation 15');
  ok(!ADV.Game.startQuest(low.g, q300).ok, 'startQuest refuses the 300g bounty below reputation 10');
  ok(ADV.Game.startQuest(mid.g, q300).ok, 'startQuest accepts the 300g bounty at reputation 10');
  ok(!ADV.Game.startQuest(mid.g, q600).ok, 'startQuest refuses the 600g bounty at reputation 10');
  ok(ADV.Game.startQuest(high.g, q600).ok, 'startQuest accepts the 600g bounty at reputation 15');
}

console.log('-- 600g finale uses mini-boss setup rules --');
{
  const { g, p } = gameOf(15);
  p.stats.hp = 400;
  const q = g.board.find(x => x.soloKind === 'solo600');
  const last = q.encounters.length - 1;
  const foes = Q.spawnEncounter(new ADV.RNG(8), q, last, g.world, g);
  const bosses = foes.filter(ch => ch.boss);
  const healers = foes.filter(ch => !ch.boss && ((ch.actives || []).some(a => {
    const d = ADV.DATA.SKILLS[a.skillId];
    return d && d.heal && d.target !== 'enemy';
  }) || (ADV.DATA.ENEMIES[ch.enemyTypeId] && ADV.DATA.ENEMIES[ch.enemyTypeId].healer)));
  const tanks = foes.filter(ch => !ch.boss && (ch.armored || (ch.actives || []).concat(ch.perks || []).some(a => ADV.Campaign.isTankSkill(a.skillId))));
  ok(bosses.length >= 1 && bosses[0].hpFloor >= ADV.Character.maxHp(p) / 2, 'mini-boss HP floors at the player without the safety buffer');
  ok(healers.length >= 1, 'a healer stands with the mini-boss');
  ok(tanks.length >= 1, 'a tank stands with the mini-boss');
  const premium = { track: 'solo', soloPremium: true, enemyLevels: [16, 16], encounters: [{ enemyTypeIds: ['dire_wolf'], boss: false }] };
  const regular = { track: 'solo', enemyLevels: [16, 16], encounters: [{ enemyTypeIds: ['dire_wolf'], boss: false }] };
  const fat = Q.spawnEncounter(new ADV.RNG(2), premium, 0)[0];
  const thin = Q.spawnEncounter(new ADV.RNG(2), regular, 0)[0];
  ok(fat.stats.hp > thin.stats.hp, 'premium solo mooks are not halved');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
