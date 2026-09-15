// Auto on self skills, conscript joining the company, quest-only risen
// strength, NPC hero HP floor, and once-per-battle NPC smite.
'use strict';
const { load, memBackend } = require('./harness');
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
function newGame(seed, skills) {
  ADV.Save.setBackend(memBackend());
  return ADV.Game.newGame({ seed: seed || 11, name: 'Pat', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: skills || ['cleave', 'mend', 'smoke_bomb'] });
}

console.log('\n-- Auto: self skills and rotation --');
{
  const ch = mk({ name: 'Rogue' });
  give(ch, 'smoke_bomb', 1);
  ok(ADV.Combat.skillNeedsAuto(ch, 'smoke_bomb', false), 'Smoke Bomb can be set to auto');
  ok(!ADV.Combat.skillNeedsAuto(ch, 'beast_shape', false), 'Beast Shape stays off auto (free buff)');
  ok(!ADV.Combat.skillNeedsAuto(ch, 'conscript', false), 'Conscript stays off auto (post-victory)');
  ADV.Combat.setSkillAuto(ch, 'smoke_bomb', true, false);
  ok(ADV.Combat.skillAutoOn(ch, 'smoke_bomb', false), 'Smoke Bomb joins the rotation');
}

console.log('\n-- Conscript: joins roster, travel, and party list --');
{
  const g = newGame(21, ['cleave', 'mend', 'conscript']);
  const p = ADV.Game.player(g);
  const foe = ADV.World.adults(g.world).find(c => !c.isPlayer && c.status === 'normal');
  ok(!!foe, 'a guild NPC exists to conscript');
  if (foe) {
    const r = ADV.Game.resolveDefeatedNamed(g, foe, 'conscript');
    ok(!r.error, 'conscript resolve succeeds');
    ok(foe.isConscript && (p.conscriptIds || []).indexOf(foe.id) >= 0, 'NPC is bound to the player');
    const roster = ADV.Game.partyRoster(g);
    ok(roster.some(c => c.id === foe.id), 'conscript walks in travel / battle roster');
    const bound = ADV.Party.followers(g.world, p);
    ok(bound.some(c => c.id === foe.id), 'conscript appears as a bound follower in the party menu');
  }
}

console.log('\n-- Conscript / raise take the whole beaten field --');
{
  const g = newGame(24, ['cleave', 'mend', 'conscript']);
  const p = ADV.Game.player(g);
  ADV.SkillSys.entryFor(p, 'conscript').level = 25;
  const foes = ADV.World.adults(g.world).filter(c => !c.isPlayer && c.status === 'normal').slice(0, 3);
  eq(foes.length, 3, 'three guild NPCs to bind');
  const bound = ADV.Game.resolveDefeatedNamedAll(g, foes, 'conscript');
  eq(bound.length, 3, 'one conscript choice binds all three');
  ok(foes.every(c => c.isConscript && c.conscriptorId === p.id), 'each beaten foe is in service');
}

{
  const g = newGame(25, ['cleave', 'mend', 'necromancy']);
  const p = ADV.Game.player(g);
  ADV.SkillSys.entryFor(p, 'necromancy').level = 25;
  const foes = ADV.World.adults(g.world).filter(c => !c.isPlayer && c.status === 'normal').slice(0, 3);
  g.quest = { thralls: [], quest: { encounters: [{}, {}] }, encIdx: 0 };
  const risen = ADV.Game.resolveDefeatedNamedAll(g, foes, 'necromancy');
  eq(risen.length, 3, 'one raise choice raises all three');
  ok(foes.every(c => c.isUndead && c.isQuestThrall), 'each beaten foe is a quest thrall');
  eq((g.quest.thralls || []).length, 3, 'all three stay for the rest of this contract');
}

console.log('\n-- Necromancy: stronger risen, gone at quest end --');
{
  const g = newGame(22, ['cleave', 'mend', 'necromancy']);
  const p = ADV.Game.player(g);
  give(p, 'necromancy', 25);
  const src = ADV.Character.makeEnemy(g.rng, 'dire_wolf', { level: 8 });
  const basic = ADV.Game.makeQuestThrall(src, mk({}));
  const caster = mk({ name: 'Necro' });
  give(caster, 'necromancy', 25);
  const adv = ADV.Game.makeQuestThrall(src, caster);
  ok(adv.risenPower > (basic.risenPower || 1.5), 'advanced risen are stronger than a basic raise');
  ok(ADV.Character.maxHp(adv) > ADV.Character.maxHp(basic), 'advanced risen have more HP');
  g.quest = { thralls: [adv], quest: { encounters: [] }, encIdx: 0 };
  ADV.Game.releaseQuestThralls(g);
  ok(!(g.quest.thralls || []).length, 'thralls are gone when the contract ends');
  ok(adv.alive === false, 'a monster thrall does not walk to the next quest');
}

{
  const g = newGame(23, ['cleave', 'mend', 'necromancy']);
  const p = ADV.Game.player(g);
  const foe = ADV.World.adults(g.world).find(c => !c.isPlayer && c.status === 'normal');
  g.quest = { thralls: [], quest: { encounters: [{}, {}] }, encIdx: 0 };
  ADV.Game.resolveDefeatedNamed(g, foe, 'necromancy');
  ok(foe.isUndead && foe.isQuestThrall, 'a named raise is a quest thrall');
  eq(foe.undeadQuestsLeft, 0, 'named risen do not carry a multi-quest timer');
  ok((g.quest.thralls || []).indexOf(foe) >= 0, 'named risen stay for the rest of this contract');
}

console.log('\n-- NPC hero/villain floor and smite --');
{
  const player = mk({ name: 'You', isPlayer: true, stats: { hp: 160, atk: 12, def: 8, spd: 10 } });
  const hero = mk({ name: 'Champion', status: 'hero', heroPowerMult: 1, grantsHeld: true, stats: { hp: 40, atk: 10, def: 4, spd: 8 } });
  const dummy = mk({ name: 'Mook', stats: { hp: 80, atk: 4, def: 0, spd: 6 } });
  const st = fight(player, [hero, dummy], 7);
  const uh = unit(st, hero);
  ok(uh.maxHp >= ADV.Character.effStat(player, 'hp') / 2, 'NPC hero HP matches the player without the safety buffer');
  ok(unit(st, player).maxHp === ADV.Character.effStat(player, 'hp'), 'the player is not raised to a hero floor');
}

{
  const player = mk({ name: 'You', isPlayer: true, stats: { hp: 200, atk: 8, def: 8, spd: 10 } });
  const villain = mk({ name: 'Villain', status: 'villain', heroPowerMult: 1, stats: { hp: 180, atk: 14, def: 6, spd: 12 } });
  const fat = mk({ name: 'Fat', stats: { hp: 300, atk: 4, def: 0, spd: 4 } });
  const thin = mk({ name: 'Thin', stats: { hp: 80, atk: 4, def: 0, spd: 4 } });
  const st = fight([player, villain], [fat, thin], 8);
  const uv = unit(st, villain);
  const uf = unit(st, fat);
  const before = uf.chp;
  ok(ADV.Combat.tryNpcSmite(st, uv), 'villain smites once');
  ok(uf.chp <= Math.ceil(before * 0.1) + 1, 'highest-HP foe is cut to about 10%');
  ok(unit(st, thin).chp === unit(st, thin).maxHp, 'the weaker foe is not the smite target');
  ok(!ADV.Combat.tryNpcSmite(st, uv), 'smite is once per battle');
  ok(!ADV.Combat.tryNpcSmite(st, unit(st, player)), 'the player never gets the NPC smite');
}

console.log('\n-- 800g sets, armor slots, septic, venom fang, smoke --');
{
  const ch = mk({ name: 'Set' });
  give(ch, 'cleave', 1);
  give(ch, 'sunder', 12);
  ch.equippedSet = 'warrior';
  eq(ADV.SkillSys.manifest(ch, ch.actives.find(e => e.skillId === 'cleave')).tier, 'intermediate', '800g set floors a basic matching skill to Intermediate');
  eq(ADV.SkillSys.manifest(ch, ch.actives.find(e => e.skillId === 'sunder')).tier, 'advanced', '800g set advances an Intermediate matching skill to Advanced');
  ch.equippedSet = 'duelist';
  eq(ADV.SkillSys.manifest(ch, ch.actives.find(e => e.skillId === 'sunder')).tier, 'intermediate', '400g set does not advance an Intermediate skill');
}

{
  const ch = mk({ name: 'Slots' });
  give(ch, 'mend', 1);
  give(ch, 'fire_bolt', 1);
  give(ch, 'frost_touch', 1);
  give(ch, 'spark', 1);
  ok(ADV.SkillSys.atCapacity(ch, 'active'), 'four unmatched actives fill the cap');
  ch.equippedSet = 'warrior';
  const learned = ADV.SkillSys.learn(ch, 'cleave');
  ok(learned.ok, 'a matching armor skill learns past the active cap');
  ok(ADV.SkillSys.inArmorSlot(ch, 'cleave'), 'cleave sits in the armor slot');
  eq(ADV.SkillSys.slottedCount(ch, 'active'), 4, 'armor skills do not count toward the cap');
  ch.equippedSet = null;
  ok(ADV.SkillSys.isOverCapacity(ch), 'losing the set puts the extra active over the cap');
  eq(ADV.SkillSys.overBy(ch, 'active'), 1, 'one extra must be forgotten');
  eq(ADV.SkillSys.trimToCap(ch).length, 1, 'trimToCap forgets the overflow');
  ok(!ADV.SkillSys.isOverCapacity(ch), 'the loadout fits after the trim');

  const g = newGame(21);
  const p = ADV.Game.player(g);
  p.inventory.gold = 500;
  p.actives = [];
  give(p, 'mend', 1); give(p, 'fire_bolt', 1); give(p, 'frost_touch', 1); give(p, 'spark', 1);
  p.equippedSet = 'warrior';
  ADV.SkillSys.learn(p, 'cleave');
  p.equippedSet = null;
  const q = (g.board || []).find(x => x.track === 'solo') || (g.board || [])[0];
  const blocked = ADV.Game.startQuest(g, q, {});
  ok(!blocked.ok, 'startQuest refuses a loadout over the skill cap');
}

{
  const ch = mk({ name: 'Septic' });
  give(ch, 'septic_sanguine', 1);
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotMult, 1.2, 'basic septic is +20% bleed/poison');
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotLeech, 0.5, 'basic septic heals 50% of those ticks');
  ch.perks[0].level = 10;
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotMult, 1.4, 'intermediate septic is +40%');
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotLeech, 0.75, 'intermediate septic heals 75% of those ticks');
  ch.perks[0].level = 25;
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotMult, 1.6, 'advanced septic increases bleed/poison by 60%');
  eq(ADV.SkillSys.manifest(ch, ch.perks[0]).data.dotLeech, 1, 'advanced septic heals 100% of those ticks');
}

{
  const a = mk({ name: 'Fang', stats: { hp: 400, atk: 10, def: 0, spd: 10 } });
  give(a, 'venom_fang', 1);
  const b = mk({ name: 'Full', stats: { hp: 400, atk: 4, def: 0, spd: 5 } });
  const st = fight(a, b, 3);
  const ua = unit(st, a), ub = unit(st, b);
  const before = ub.chp;
  ADV.Combat.act(st, ua, { kind: 'skill', skillId: 'venom_fang', targetUid: ub.uid });
  const fang = before - ub.chp;
  const c = mk({ name: 'Stab', stats: { hp: 400, atk: 10, def: 0, spd: 10 } });
  give(c, 'backstab', 1);
  const d = mk({ name: 'Mark', stats: { hp: 400, atk: 4, def: 0, spd: 5 } });
  const st2 = fight(c, d, 3);
  const uc = unit(st2, c), ud = unit(st2, d);
  const before2 = ud.chp;
  ADV.Combat.act(st2, uc, { kind: 'skill', skillId: 'backstab', targetUid: ud.uid });
  const stab = before2 - ud.chp;
  ok(Math.abs(fang - Math.round(stab * 0.8)) <= 2, 'Venom Fang on full HP is 80% of a Backstab');
}

{
  const a = mk({ name: 'Smoke', stats: { hp: 200, atk: 10, def: 4, spd: 12 } });
  give(a, 'smoke_bomb', 1);
  give(a, 'backstab', 1);
  const b = mk({ name: 'Foe', stats: { hp: 200, atk: 6, def: 2, spd: 8 } });
  const st = fight(a, b, 4);
  const ua = unit(st, a), ub = unit(st, b);
  const res = ADV.Combat.act(st, ua, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ua.uid });
  ok(res.ok && res.refund, 'Smoke Bomb is a free action');
  ok(ua.stealth, 'Smoke Bomb still grants stealth');
  const res2 = ADV.Combat.act(st, ua, { kind: 'skill', skillId: 'backstab', targetUid: ub.uid });
  ok(res2.ok && !res2.refund, 'another skill can follow Smoke Bomb on the same turn');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
