// A heal never crosses the line (reported bug): a healer build on auto was helping the
// enemy. Every targeting path is checked here, including the one that takes the caller's
// word for the target, plus a broad auto sweep over every healing kit in the game.
'use strict';
const { load } = require('./harness');
const ADV = load();
globalThis.ADV = ADV;
const SK = ADV.DATA.SKILLS, Cb = ADV.Combat, Ch = ADV.Character;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }

function arena(skillId, level, opts) {
  opts = opts || {};
  const p = Ch.base({ name: 'Healer', stats: { hp: 300, atk: 18, def: 10, spd: 12 } });
  p.isPlayer = true;
  p.actives = [{ skillId, level, uses: level * 10 }];
  const ally = Ch.base({ name: 'Ally', stats: { hp: 300, atk: 14, def: 10, spd: 9 } });
  const foes = [0, 1].map(i => {
    const e = Ch.base({ name: 'Foe' + i, stats: { hp: 400, atk: 14, def: 10, spd: 7 + i } });
    e.isMonster = true; e.enemyTypeId = 'bandit';
    return e;
  });
  const st = Cb.create([p, ally], foes, { rng: new ADV.RNG(opts.seed || 3) });
  const ua = st.units.find(u => u.ch === p);
  const ub = st.units.filter(u => u.side === 'b');
  const ual = st.units.find(u => u.ch === ally);
  if (opts.hurtFoes !== false) for (const f of ub) f.chp = Math.round(f.maxHp * 0.2);
  if (opts.hurtAlly) ual.chp = Math.round(ual.maxHp * 0.4);
  return { st, ua, ual, foes: ub };
}

console.log('-- a heal aimed straight at an enemy --');
{
  // Every healing active in the game, pointed deliberately at a wounded enemy.
  const healIds = Object.keys(SK).filter(id => {
    const s = SK[id];
    return s.kind === 'active' && (s.heal || (s.tiers && ['basic', 'intermediate', 'advanced'].some(t => s.tiers[t] && s.tiers[t].heal)));
  });
  const helped = [];
  let tried = 0;
  for (const id of healIds) {
    for (const level of [1, 12, 26]) {
      for (const off of [false, true]) {
        const { st, ua, foes } = arena(id, level);
        const before = foes.map(f => f.chp);
        const beforeStatus = foes.map(f => f.statuses.length);
        let r; try { r = Cb.act(st, ua, { kind: 'skill', skillId: id, targetUid: foes[0].uid, offensiveMode: off }); } catch (e) { continue; }
        tried++;
        foes.forEach((f, i) => {
          if (f.chp > before[i]) helped.push(id + ' L' + level + (off ? ' (offensive)' : '') + ' healed a foe by ' + (f.chp - before[i]));
          // an offensive mode is allowed to put a debuff on; a protective ward is not
          if (!off && f.statuses.length > beforeStatus[i]) {
            const added = f.statuses.slice(beforeStatus[i]).filter(s => (Cb.POS_STATUSES || []).includes(s.kind));
            if (added.length) helped.push(id + ' L' + level + ' put ' + added.map(s => s.kind).join('/') + ' on a foe');
          }
        });
      }
    }
  }
  ok(tried > 100, `pointed ${tried} healing casts at an enemy`);
  ok(!helped.length, 'no healing skill ever helps the enemy it is aimed at', helped.slice(0, 5).join('; '));
}

console.log('\n-- the picker does not take the caller\'s word for it --');
{
  // pickHealTargets seeds its list with whatever target it is handed. Hand it a foe.
  const { st, ua, foes, ual } = arena('mend', 12, { hurtAlly: true });
  const picked = Cb.pickHealTargets(st, ua, foes[0], 'advanced') || [];
  ok(!picked.some(x => x.side !== ua.side), 'a foe handed in as the seed target is dropped', picked.map(x => x.ch.name).join(','));
  const good = Cb.pickHealTargets(st, ua, ual, 'advanced') || [];
  ok(good.length > 0 && good.every(x => x.side === ua.side), 'an ally seed still works', good.map(x => x.ch.name).join(','));
}

console.log('\n-- nobody heals the enemy over a full auto battle --');
{
  const healIds = Object.keys(SK).filter(id => {
    const s = SK[id];
    return s.kind === 'active' && (s.heal || (s.tiers && ['basic', 'intermediate', 'advanced'].some(t => s.tiers[t] && s.tiers[t].heal)));
  });
  const helped = [];
  let fights = 0;
  for (const id of healIds) {
    for (const level of [1, 26]) {
      for (let seed = 1; seed <= 3; seed++) {
        const { st, ua, foes } = arena(id, level, { seed, hurtFoes: true });
        // the ally heals too, so an NPC companion's kit is exercised as well
        ua.ch.autoAttack = true;
        fights++;
        const hp = {}; for (const f of foes) hp[f.uid] = f.chp;
        let guard = 0;
        while (!st.over && st.round <= 6 && guard++ < 80) {
          const t = Cb.currentTurn(st); if (!t) break;
          const u = t.unit;
          try { Cb.aiTakeTurn(st, u); } catch (e) { /* keep the sweep going */ }
          if (u.side === 'a') {
            for (const f of foes) {
              if (f.chp > hp[f.uid]) helped.push(id + ': a foe gained ' + (f.chp - hp[f.uid]) + ' on our turn');
              hp[f.uid] = f.chp;
            }
          } else { for (const f of foes) hp[f.uid] = f.chp; }
          Cb.advance(st);
        }
      }
    }
  }
  ok(fights > 100, `played ${fights} auto battles with a healer in the party`);
  ok(!helped.length, 'an enemy never gains health on our side\'s turn', helped.slice(0, 5).join('; '));
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
