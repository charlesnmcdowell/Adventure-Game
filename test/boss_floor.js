// DOT_PROMPT.md §11: campaign bosses are never softer than the player, and
// every boss / mini-boss fight fields a tank and a healer of the faction.
'use strict';
const { load } = require('./harness.js');
load();
ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const D = ADV.DATA, S = D.SKILLS;
const restores = (id) => { const d = S[id]; return !!(d && d.heal && (d.power || d.hotRounds || d.healFromTaken || d.revive) && d.target !== 'enemy'); };
const guardish = (id) => ADV.Campaign.isTankSkill(id);
const skillsOf = (ch) => (ch.actives || []).concat(ch.perks || []).map(a => a.skillId);

console.log('-- the guard table --');
for (const [fid, g] of Object.entries(D.CAMPAIGN_BOSS_GUARD)) {
  const t = D.CAMPAIGN_ENEMIES[g.tank], h = D.CAMPAIGN_ENEMIES[g.healer];
  ok(t && h && t.faction === fid && h.faction === fid, `${fid}: tank ${g.tank} and healer ${g.healer} exist and belong to the faction`);
  ok(h && h.pool.includes(g.heal) && restores(g.heal), `${fid}: the healer's forced skill ${g.heal} is in its pool and restores HP`);
  ok(t && t.pool.includes(g.tankSkill) && guardish(g.tankSkill), `${fid}: the tank's forced skill ${g.tankSkill} is in its pool and guards`);
}

function freshGame(hp) {
  const game = ADV.Game.newGame({ seed: 4242, name: 'Sable', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] });
  const p = ADV.Game.player(game);
  p.stats.hp = hp;
  return game;
}

function encountersFor(game, fid) {
  const out = [];
  const isC2 = !D.CAMPAIGN_QUESTS[fid] || !!(D.FACTIONS[fid] && D.FACTIONS[fid].campaign2) || ['bell', 'green', 'tally', 'navy'].includes(fid);
  for (let n = 1; n <= 5; n++) {
    let quest;
    if (isC2) { quest = ADV.Campaign2.buildQuest(game, fid, n); }
    else { ADV.Campaign.debugJump(game, fid, n); quest = ADV.Campaign.buildQuest(game, n); }
    if (!quest || !quest.cEnc) continue;
    quest.cEnc.forEach((spec, i) => {
      if (!(spec.mini || spec.boss || spec.boardBoss)) return;
      let roster;
      try { roster = ADV.Campaign.spawnEncounter(game, quest, i); } catch (e) { roster = null; out.push({ fid, n, i, spec, error: e.message }); return; }
      out.push({ fid, n, i, spec, roster });
    });
  }
  return out;
}

console.log('-- every boss fight, player at 90 HP and at 900 HP --');
const factions = Object.keys(D.CAMPAIGN_BOSS_GUARD);
let checked = 0, grew = 0;
for (const hp of [90, 900]) {
  const game = freshGame(hp);
  const playerMax = ADV.Character.maxHp(ADV.Game.player(game));
  for (const fid of factions) {
    const encs = encountersFor(game, fid);
    ok(encs.length >= 4 && encs.every(e => !e.error), `${fid} @${hp}: ${encs.length} boss/mini encounters build`, encs.filter(e => e.error).map(e => e.error).join(' | '));
    for (const e of encs) {
      if (!e.roster) continue;
      checked++;
      const bosses = e.roster.filter(ch => ch.boss || ch.isBossFight || ch.godLineBoss);
      const st = ADV.Combat.create([ADV.Game.player(game)], e.roster, { rng: new ADV.RNG(1) });
      const bossUnits = st.units.filter(u => bosses.includes(u.ch));
      const floor = playerMax / 2;
      const under = bossUnits.filter(u => u.maxHp < floor);
      if (under.length) ok(false, `${fid} q${e.n} enc${e.i}: a boss unit is under the player's unbuffed ${floor} max HP`, under.map(u => u.ch.name + ':' + u.maxHp).join(','));
      const escorts = e.roster.filter(ch => !bosses.includes(ch));
      const hasHealer = escorts.some(ch => skillsOf(ch).some(restores));
      const hasTank = escorts.some(ch => skillsOf(ch).some(guardish));
      if (!hasHealer || !hasTank) ok(false, `${fid} q${e.n} enc${e.i}: escort lacks ${!hasTank ? 'a tank ' : ''}${!hasHealer ? 'a healer' : ''}`, escorts.map(ch => ch.name).join(','));
      // authored escorts still present, growth capped at two
      const authored = (e.spec.with || []).length + (e.spec.types || []).length + (e.spec.mini ? (((D.CAMPAIGN_MINIBOSSES[e.spec.mini] || {}).count) || ((D.CAMPAIGN_MINIBOSSES[e.spec.mini] || {}).pair ? 2 : 1)) : 0) + (e.spec.boss ? 1 : 0) + (e.spec.boardBoss ? 1 : 0);
      const added = e.roster.length - authored;
      if (added > 2 || added < 0) ok(false, `${fid} q${e.n} enc${e.i}: roster grew by ${added} (max 2)`);
      if (added > 0) grew++;
      for (const w of (e.spec.with || [])) if (!e.roster.some(ch => ch.enemyTypeId === w)) ok(false, `${fid} q${e.n} enc${e.i}: authored escort ${w} is missing`);
    }
  }
}
ok(checked >= 60, `${checked} boss encounters checked across both HP levels`);
ok(grew > 0, `the guard appended escorts where the author's list lacked a role (${grew} encounters)`);
{
  // never lowered: a boss already above the player keeps its HP
  const game = freshGame(50);
  const rng = new ADV.RNG(3);
  const big = ADV.Campaign.spawnEnemy(rng, 'house_guard', 20, { boss: true });
  big.stats.hp = 5000;
  const out = [big];
  ADV.Campaign.guardBoss(game, out, 'maw', 20, rng);
  const st = ADV.Combat.create([ADV.Game.player(game)], out, { rng });
  ok(st.units.find(u => u.ch === big).maxHp >= 5000, 'a boss above the player is never lowered');
  ok(out.length === 3 && out.some(ch => ch.enemyTypeId === 'house_guard' && !ch.boss) && out.some(ch => ch.enemyTypeId === 'candle_bearer'), 'a lone boss gets exactly a tank and a healer appended');
  ok(out.find(ch => ch.enemyTypeId === 'candle_bearer').actives.some(a => a.skillId === 'stitch_and_run'), 'the appended healer carries its heal');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
