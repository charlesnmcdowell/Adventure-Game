// Balance soak (§15a targets): every archetype solo-viable on its free three
// skills, tier-1 solo contracts survivable, ending HP in the 15-30% band-ish.
'use strict';
const { load } = require('./harness');
const ADV = load();

const ARCH = ADV.DATA.ARCHETYPE_SKILLS;

function playFight(st, player, kit) {
  let g = 0;
  while (!st.over && g++ < 600) {
    const t = ADV.Combat.currentTurn(st);
    if (!t) break;
    if (t.unit.ch === player) {
      const u = t.unit;
      let acted = false;
      // naive but sane: heal self if hurt (healer), buff once, else best damage skill, else attack
      for (const skillId of kit.order) {
        const sk = ADV.DATA.SKILLS[skillId];
        if (!sk) continue;
        const m = ADV.Combat.manifestFor(u, skillId);
        if (!m) continue;
        const d = m.data;
        if (d.heal && (u.chp / u.maxHp) > 0.6 && !d.dualHeal) continue;
        if ((d.evadeNext || d.untargetableRounds || d.counterNext) &&
            (u.evade > 0 || u.untargetable > 0 || (u.chp / u.maxHp) > 0.5)) continue;
        if ((d.atkMult || d.guardScope || d.thornPct) && u.statuses.some(s => ['atkBuff', 'guard', 'thorns'].includes(s.kind))) continue;
        if (d.marks != null && ADV.Combat.living(st, 'b').every(f => f.marksBy.includes(u.uid))) continue;
        let off = false;
        let pool = ADV.Combat.validTargets(st, u, skillId, false);
        if (d.heal && !d.dualHeal && (u.chp / u.maxHp) > 0.6 && d.offensive) { off = true; pool = ADV.Combat.validTargets(st, u, skillId, true); }
        if (d.heal && !d.dualHeal && !off) pool = [u];
        if (!pool.length) continue;
        const tgt = pool[0];
        ADV.Combat.act(st, u, { kind: 'skill', skillId, targetUid: tgt.uid, offensiveMode: off });
        acted = true; break;
      }
      if (!acted) {
        const bv = ADV.Combat.validTargets(st, u, 'basic_attack');
        if (bv.length) ADV.Combat.act(st, u, { kind: 'attack', targetUid: bv[0].uid });
      }
    } else ADV.Combat.aiTakeTurn(st, t.unit);
    ADV.Combat.advance(st);
  }
  return st.winner;
}

const KITS = {
  mage:    { order: ['fire_bolt', 'frost_touch'] },
  tank:    { order: ['taunt', 'shield_wall'] },
  rogue:   { order: ['backstab'] },
  ranger:  { order: ['aimed_shot', 'snare'] },
  fighter: { order: ['sunder', 'cleave'] },
  druid:   { order: ['beast_shape', 'thorn_skin'] },
  healer:  { order: ['blood_pact', 'mend'] },
};

console.log('archetype | wins/20 | avg end HP% (winners)');
for (const [arch, kit] of Object.entries(KITS)) {
  let wins = 0, hpSum = 0;
  for (let seed = 1; seed <= 20; seed++) {
    ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
    const a = ARCH[arch];
    const skills = [a.perk].concat(a.actives.slice(0, 2));
    const game = ADV.Game.newGame({ seed: seed * 101 + 7, name: 'B', sex: 'f', portraitSeed: seed, portraitSlot: 1, startingSkills: skills });
    const player = ADV.Game.player(game);
    const q = game.board.find(x => x.tier === 1 && x.track === 'solo');
    ADV.Game.startQuest(game, q, {});
    let ok = true;
    while (true) {
      const enc = ADV.Game.currentEncounter(game);
      if (!enc) break;
      const st = ADV.Game.startCombat(game, false);
      const w = playFight(st, player, kit);
      const r = ADV.Game.finishCombat(game);
      if (r.playerDead || !r.won) { ok = false; break; }
      if (game.quest.readyToComplete) break;
    }
    if (ok && game.quest && game.quest.readyToComplete) {
      wins++;
      hpSum += player.combatHp / ADV.Character.maxHp(player);
    }
  }
  console.log(`${arch.padEnd(9)} | ${String(wins).padStart(2)}/20  | ${wins ? Math.round(hpSum / wins * 100) + '%' : '-'}`);
}

// Survival gold tax: meals + shelter against the same purse that buys skills.
(function () {
  const T1 = ADV.DATA.CONST.QUEST_TIERS[1].soloPay;
  const T2 = ADV.DATA.CONST.QUEST_TIERS[2].soloPay;
  const meal = 5;
  const goldAt = (n, pay) => n * pay - n * meal;
  console.log('\n-- survival gold vs shelter (T1 solo, 5g meals) --');
  console.log('  Q5  net', goldAt(5, T1), ' inn 100  leftover', goldAt(5, T1) - 100);
  console.log('  Q10 net', goldAt(10, T1), ' inn+cottage 300  leftover', goldAt(10, T1) - 300);
  console.log('  Q15 net', goldAt(15, T1), ' full ladder 650  leftover', goldAt(15, T1) - 650);
  if (goldAt(5, T1) < 100) console.log('  CONCERN: T1 opening cannot afford the inn');
  if (goldAt(15, T1) < 650) console.log('  CONCERN: T1-only cannot settle (brick) by quest 15 — need T2 or party pay');

  ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
  const eatGame = ADV.Game.newGame({ seed: 21, name: 'Eat', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const ep = ADV.Game.player(eatGame);
  for (let i = 0; i < 40; i++) {
    ep.inventory.gold += i < 5 ? T1 : T2;
    ADV.Character.eat(ep, 'bread');
    ADV.Survival.onQuestResolved(eatGame);
    const next = ADV.Housing.list().find(h => ADV.Housing.rank(h.id) === ADV.Housing.rank(ep.homeId) + 1);
    if (next && ep.inventory.gold >= next.cost) ADV.Housing.buy(eatGame, next.id);
  }
  const eatDead = !!eatGame.pendingDeath || !ep.alive;
  const settled = ADV.Housing.rank(ep.homeId) >= ADV.Housing.rank('brick');
  console.log('  eat+shelter 40q: alive=' + (!eatDead) + ' home=' + ep.homeId + ' gold=' + ep.inventory.gold + ' sick=' + !!ADV.Survival.state(ep).sick);
  if (eatDead) console.log('  CONCERN: the eat-and-shelter path died — design is too tight');
  if (!settled) console.log('  CONCERN: eat+shelter did not reach brick in 40 quests');

  const starveGame = ADV.Game.newGame({ seed: 22, name: 'Starve', sex: 'm', portraitSlot: 1, portraitSeed: 2, startingSkills: ['cleave', 'mend', 'triage'] });
  const sp = ADV.Game.player(starveGame);
  let starveAt = 0;
  for (let i = 0; i < 10; i++) {
    const r = ADV.Survival.onQuestResolved(starveGame);
    if (r.died) { starveAt = i + 1; break; }
  }
  console.log('  starve path died at quest', starveAt || 'never');
  if (!starveAt) console.log('  CONCERN: hunger death is not reachable');

  const npc = eatGame.world.characters.find(c => !c.isPlayer && c.alive);
  npc.survival = { hunger: 4, questsSinceShelter: 9, sick: true, sickStacks: 4 };
  if (ADV.Survival.statMult(npc) !== 1) console.log('  CONCERN: NPCs are affected by hunger');
  console.log('  NPC statMult at four stacks:', ADV.Survival.statMult(npc));
})();
