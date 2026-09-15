// Voice usage: clips exist (vo_coverage.js) AND the living roster / line picker
// actually reach more than the first Stoic / first roar.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

console.log('-- eighty-person starting town uses the full voice cast before repeats --');
{
  const game = ADV.Game.newGame({ seed: 11, name: 'Auden', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['mend'] });
  const living = (game.world.characters || []).filter(c => c && c.alive && !c.isPlayer && c.personalityId);
  const ids = living.map(c => c.personalityId);
  ok(ids.length >= 8, `roster has ${ids.length} voiced NPCs`);
  ok(new Set(ids).size === 60, 'all sixty personality voices appear in the larger town', ids.join(','));
  const men = living.filter(c => c.sex === 'm').map(c => c.personalityId);
  const women = living.filter(c => c.sex === 'f').map(c => c.personalityId);
  ok(new Set(men.slice(0,30)).size === 30, 'each male voice is used before any is repeated');
  ok(new Set(women.slice(0,30)).size === 30, 'each female voice is used before any is repeated');
}

console.log('-- speakEx rotates inside a warmth band --');
{
  const game = ADV.Game.newGame({ seed: 4, name: 'Bryn', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['mend'] });
  const npc = game.world.characters.find(c => !c.isPlayer && c.personalityId && c.sex === 'm');
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const r = ADV.util.speakEx(game.world, npc, 'friendly', { target: 'Bryn', score: 70, rand: (i * 0.17) % 1 });
    if (r) seen.add(r.idx);
  }
  ok(seen.size >= 2, `Friendly-70 uses more than one clip (${[...seen].join(',')})`);
}

console.log('-- campaign bosses are not all Stoic --');
{
  const rng = new ADV.RNG(19);
  const ids = [];
  for (let i = 0; i < 8; i++) {
    const ch = ADV.Campaign.spawnEnemy(rng, 'bonded_courier', 14, { boss: true });
    if (ch && ch.personalityId) ids.push(ch.personalityId);
  }
  ok(ids.length === 8, 'bosses received a personality');
  ok(new Set(ids).size > 1, 'campaign bosses are not all M01', ids.join(','));
}

console.log('-- monster roar pack has two lines --');
{
  const pack = ADV.DATA.MONSTER_VO && ADV.DATA.MONSTER_VO.goblin_king;
  ok(pack && pack.roar && pack.roar.length >= 2, 'goblin_king has two roar lines');
}

console.log('-- god combat lines are not a single clip --');
{
  const hate = ADV.DATA.GOD_LINE_HATRED || {};
  const smite = ADV.DATA.GOD_LINE_SMITE || {};
  ok((hate.pale_mother || []).length >= 2, 'Pale Mother has two hatred lines');
  ok((smite.pale_mother || []).length >= 2, 'Pale Mother has two smite lines');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
