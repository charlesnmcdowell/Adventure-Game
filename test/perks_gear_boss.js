// Perks level from 1, gear-set inspect, boss/god combat, war + god boards.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load, memBackend } = require('./harness');
const ADV = load();
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/tooltip.js'), 'utf8'), { filename: 'tooltip.js' });

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n + (x !== undefined ? '  [' + x + ']' : '')); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }

function mk(o) { return ADV.Character.base(Object.assign({ stats: { hp: 100, atk: 10, def: 0, spd: 10 } }, o)); }
function give(ch, id, level) {
  const sk = ADV.DATA.SKILLS[id];
  (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 });
}

console.log('\n-- Perks start at level 1 and level like actives --');
{
  const t = mk({});
  give(t, 'bulwark', 1);
  const m = ADV.SkillSys.manifest(t, t.perks[0]);
  eq(m.tier, 'basic', 'L1 Bulwark is basic');
  const BW = ADV.DATA.SKILLS.bulwark.tiers;
  eq(m.data.reflectPct, BW.basic.reflectPct, `L1 Bulwark reflects ${Math.round(BW.basic.reflectPct * 100)}%`);
  t.perks[0].uses = 9;
  const lv = ADV.SkillSys.recordUse(t, 'bulwark');
  ok(lv && lv.leveled && lv.level === 2, 'a perk levels after enough uses');
  t.perks[0].level = 10;
  eq(ADV.SkillSys.manifest(t, t.perks[0]).tier, 'intermediate', 'L10 is intermediate');
  eq(ADV.SkillSys.manifest(t, t.perks[0]).data.reflectPct, BW.intermediate.reflectPct, `L10 Bulwark reflects ${Math.round(BW.intermediate.reflectPct * 100)}%`);
  t.perks[0].level = 25;
  eq(ADV.SkillSys.manifest(t, t.perks[0]).tier, 'advanced', 'L25 is advanced');
  eq(ADV.SkillSys.manifest(t, t.perks[0]).data.reflectPct, BW.advanced.reflectPct, `L25 Bulwark reflects ${Math.round(BW.advanced.reflectPct * 100)}%`);
  const offers = ADV.SkillSys.tutorOffers(t, 'bulwark');
  eq(offers.length, 0, 'a maxed perk has nothing left to tutor');
  const fresh = mk({});
  give(fresh, 'bulwark', 1);
  fresh.inventory = { gold: 9999 };
  const tut = ADV.SkillSys.tutor(fresh, 'bulwark', 'intermediate');
  ok(tut.ok && fresh.perks[0].level >= 10, 'the trainer can lift a perk to intermediate');
}

console.log('\n-- Gear set hover lists the skills it floors --');
{
  const text = ADV.GearSetInfo.describe('warrior', mk({}));
  ok(!!text, 'warrior set has a description');
  ok(/tank/i.test(text) && /fighter/i.test(text), 'it names the archetypes');
  ok(/Bulwark/.test(text) && /Cleave/.test(text), 'it lists skills the player does not have to know');
  ok(/do not need to know/i.test(text) || /do not need to know them yet/i.test(text), 'it says unknown skills still count');
}

console.log('\n-- A worn set parks matching skills in armor slots --');
{
  const mage = mk({ equippedSet: 'mage' });
  give(mage, 'arcane_focus', 1);
  give(mage, 'fire_bolt', 1);
  give(mage, 'mend', 1);
  give(mage, 'raise', 1);
  ok(ADV.SkillSys.inArmorSlot(mage, 'arcane_focus'), 'Mage Set parks Arcane Focus');
  ok(ADV.SkillSys.inArmorSlot(mage, 'fire_bolt'), 'Mage Set parks Fire Bolt');
  ok(!ADV.SkillSys.inArmorSlot(mage, 'mend'), 'Mage Set leaves Mend in a skill slot');
  ok(!ADV.SkillSys.inArmorSlot(mage, 'raise'), 'Mage Set leaves Raise in a skill slot');
  eq(ADV.SkillSys.slottedCount(mage, 'perk'), 0, 'the parked perk frees a perk slot');
  eq(ADV.SkillSys.slottedCount(mage, 'active'), 2, 'only healer actives still consume slots');
  const packed = mk({ equippedSet: 'mage' });
  give(packed, 'cleave', 1); give(packed, 'sunder', 1); give(packed, 'mend', 1); give(packed, 'aimed_shot', 1);
  ok(ADV.SkillSys.atCapacity(packed, 'active'), 'four unmatched actives fill the cap');
  const learn = ADV.SkillSys.learn(packed, 'spark', {});
  ok(learn.ok, 'a matching mage active still fits because the set parks it');
  ok(ADV.SkillSys.inArmorSlot(packed, 'spark'), 'Spark sits under the Mage Set');

  const healer = mk({ equippedSet: 'healer' });
  give(healer, 'devoted', 1);
  give(healer, 'mend', 1);
  give(healer, 'fire_bolt', 1);
  ok(ADV.SkillSys.inArmorSlot(healer, 'mend') && ADV.SkillSys.inArmorSlot(healer, 'devoted'), 'Healer Set parks health skills');
  ok(!ADV.SkillSys.inArmorSlot(healer, 'fire_bolt'), 'Healer Set does not park Fire Bolt');
  eq(ADV.SkillSys.slottedCount(healer, 'active'), 1, 'Fire Bolt still spends an active slot');

  const hiro = mk({ equippedSet: 'ronin' });
  give(hiro, 'katana_slash', 1);
  give(hiro, 'cleave', 1);
  ok(ADV.SkillSys.inArmorSlot(hiro, 'katana_slash'), 'Ronin Gear parks its extra katana skill');
  ok(ADV.SkillSys.inArmorSlot(hiro, 'cleave'), 'Ronin Gear also parks fighter skills');
}

console.log('\n-- Losing a set forces extras back onto the slot cap --');
{
  const ch = mk({ equippedSet: 'mage' });
  give(ch, 'mend', 1);
  give(ch, 'raise', 1);
  give(ch, 'cleave', 1);
  give(ch, 'aimed_shot', 1);
  const parked = ADV.SkillSys.learn(ch, 'spark', {});
  const parked2 = ADV.SkillSys.learn(ch, 'fire_bolt', {});
  ok(parked.ok && parked2.ok, 'matching mage actives learn past the cap while parked');
  eq(ADV.SkillSys.slottedCount(ch, 'active'), 4, 'parked skills do not count while the set is worn');
  ok(!ADV.SkillSys.isOverCapacity(ch), 'wearing the set is not over capacity');
  ch.equippedSet = null;
  eq(ADV.SkillSys.slottedCount(ch, 'active'), 6, 'unequipping puts parked skills back on the cap');
  eq(ADV.SkillSys.overBy(ch, 'active'), 2, 'two extras must be set down');
  ok(ADV.SkillSys.isOverCapacity(ch), 'the loadout is over capacity after the set comes off');
  const kept = ADV.SkillSys.learn(ch, 'frost_touch', {});
  ok(!kept.ok && kept.needForget, 'learning is still blocked while over the cap');
  const dropped = ADV.SkillSys.trimToCap(ch);
  eq(dropped.length, 2, 'trimToCap forgets only the extras');
  eq(ADV.SkillSys.slottedCount(ch, 'active'), 4, 'actives fit the cap after the trim');
  ok(!ADV.SkillSys.isOverCapacity(ch), 'trimToCap clears the overflow');
  ok(dropped.every(id => ch.skillLevels && ch.skillLevels[id]), 'dropped skills keep their level in the journal');
  ok(dropped.every(id => !ADV.SkillSys.knows(ch, id)), 'dropped skills are no longer slotted');

  const perks = mk({ equippedSet: 'mage' });
  give(perks, 'bulwark', 1);
  give(perks, 'devoted', 1);
  give(perks, 'septic_sanguine', 1);
  ok(ADV.SkillSys.learn(perks, 'arcane_focus', {}).ok, 'a matching perk parks past the perk cap');
  ok(ADV.SkillSys.learn(perks, 'pyromaniac', {}).ok, 'a second matching perk also parks');
  eq(ADV.SkillSys.slottedCount(perks, 'perk'), 3, 'three unmatched perks fill the cap while two sit in armor');
  perks.equippedSet = 'hunter';
  eq(ADV.SkillSys.overBy(perks, 'perk'), 2, 'a ranger set does not park the mage perks');
  const perkDrop = ADV.SkillSys.trimToCap(perks);
  eq(perkDrop.length, 2, 'two perks come off after the armor swap');
  eq(ADV.SkillSys.slottedCount(perks, 'perk'), 3, 'perks fit the cap after the trim');

  const back = mk({ equippedSet: 'mage' });
  give(back, 'mend', 1); give(back, 'raise', 1); give(back, 'cleave', 1); give(back, 'aimed_shot', 1);
  ADV.SkillSys.learn(back, 'spark', {});
  back.equippedSet = null;
  ok(ADV.SkillSys.isOverCapacity(back), 'selling the set overflows');
  back.equippedSet = 'mage';
  ok(!ADV.SkillSys.isOverCapacity(back), 'buying a matching set again parks the extra');
}

console.log('\n-- Campaign armours advance three archetypes --');
{
  const want = {
    assassins_gear: ['rogue', 'ranger', 'fighter'],
    mercenarys_gear: ['tank', 'ranger', 'fighter'],
    battle_mages_gear: ['druid', 'mage', 'healer'],
    shinobi_gear: ['rogue', 'druid', 'mage'],
    green_eyed_armour: ['fighter', 'tank', 'ranger'],
    privateers_kit: ['rogue', 'fighter', 'druid'],
    kings_uniform: ['ranger', 'tank', 'healer'],
  };
  for (const [id, arches] of Object.entries(want)) {
    const set = ADV.DATA.GEAR_SETS[id];
    ok(!!set && set.advanceTier, id + ' advances a tier');
    eq((set.archetypes || []).join(','), arches.join(','), id + ' covers ' + arches.join('/'));
  }
  const sam = mk({ equippedSet: 'green_eyed_armour' });
  give(sam, 'cleave', 10);
  give(sam, 'aimed_shot', 10);
  give(sam, 'mend', 10);
  eq(ADV.SkillSys.tierFor(sam, 'cleave', 10), 'advanced', 'samurai armour advances fighter skills');
  eq(ADV.SkillSys.tierFor(sam, 'aimed_shot', 10), 'advanced', 'samurai armour advances ranger skills');
  eq(ADV.SkillSys.tierFor(sam, 'mend', 10), 'intermediate', 'samurai armour does not advance healer skills');
}

console.log('\n-- Bosses take two turns and add 20% max-HP damage --');
{
  const boss = mk({ stats: { hp: 80, atk: 10, def: 0, spd: 20 } });
  boss.boss = true;
  boss.hitStatus = { kind: 'bleed', power: 0.6, rounds: 3, stacks: true };
  const vic = mk({ stats: { hp: 200, atk: 1, def: 0, spd: 1 } });
  const st = ADV.Combat.create([vic], [boss], { rng: new ADV.RNG(3) });
  const ub = st.units.find(u => u.ch === boss);
  const uv = st.units.find(u => u.ch === vic);
  eq(ub.turnsPerRound, 2, 'a boss is queued for two turns');
  ok(ub.consecutiveTurns, 'and those turns are consecutive');
  const q = st.turnQueue.filter(e => e.uid === ub.uid);
  ok(q.length >= 2, 'the first round holds two boss turns');
  ADV.Combat.act(st, ub, { kind: 'attack', targetUid: uv.uid });
  const hit = st.events.find(e => e.t === 'damage' && e.uid === uv.uid);
  ok(hit && hit.dmg >= 40, 'boss damage includes 20% of target max HP', hit && hit.dmg);
  ok(uv.statuses.some(s => s.kind === 'bleed'), 'the boss applies its hit status');
}

console.log('\n-- Gods take three turns and add 50% max-HP damage --');
{
  const god = mk({ stats: { hp: 80, atk: 10, def: 0, spd: 20 } });
  god.isGod = true; god.role = 'god'; god.boss = true;
  god.hitStatuses = [
    { kind: 'bleed', power: 0.6, rounds: 3 },
    { kind: 'poison', power: 0.6, rounds: 3 },
    { kind: 'burn', power: 0.8, rounds: 2 },
  ];
  const vic = mk({ stats: { hp: 200, atk: 1, def: 0, spd: 1 } });
  const st = ADV.Combat.create([vic], [god], { rng: new ADV.RNG(4) });
  const ug = st.units.find(u => u.ch === god);
  const uv = st.units.find(u => u.ch === vic);
  eq(ug.turnsPerRound, 3, 'a god is queued for three turns');
  eq(ADV.Character.voiceTagFor(null, god), 'godm', 'a male god uses the marked god voice');
  ADV.Combat.act(st, ug, { kind: 'attack', targetUid: uv.uid });
  const hit = st.events.find(e => e.t === 'damage' && e.uid === uv.uid);
  const godShare = ADV.DATA.CONST.GOD_HIT_PCT;
  ok(hit && hit.dmg >= Math.round(200 * godShare), `god damage includes ${Math.round(godShare * 100)}% of target max HP`, hit && hit.dmg);
  const kinds = uv.statuses.map(s => s.kind);
  ok(kinds.includes('bleed') && kinds.includes('poison') && kinds.includes('burn'), 'a god applies bleed, poison, and burn');
}

console.log('\n-- Faction war and god contracts post on the board --');
{
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ name: 'Board', sex: 'm', portrait: 1, archetype: 'fighter' });
  const board = ADV.Quests.generateBoard(g.world, g.rng, g);
  const wars = board.filter(q => q.war);
  const gods = board.filter(q => q.godLine);
  eq(wars.length, 2, 'the board posts two faction-war contracts');
  eq(gods.length, 3, 'and three god-tier contracts');
  ok(wars.every(q => q.special && q.track === 'party'), 'war contracts are special party writs');
  ok(wars.every(q => (q.cEnc || []).filter(e => e.mini).length === 2), 'each war contract fields two bosses');
  ok(gods.every(q => q.special && q.track === 'party' && q.isBoss), 'god contracts are special party bosses');
  const domains = gods.map(q => q.godDomain).sort();
  eq(domains.join(','), 'chaos,death,life', 'death, chaos, and life all post');
  for (const q of gods) {
    ok(q.cEnc.every(e => e.boardBoss), q.name + ' has a boss in every fight');
    const last = q.cEnc[q.cEnc.length - 1];
    ok(last.boss && last.boardBoss, q.name + ' ends with a god and a boss');
  }
  const bloom = gods.find(q => q.godBoss === 'first_bloom');
  const foes = ADV.Campaign.spawnEncounter(g, bloom, bloom.cEnc.length - 1);
  ok(foes.some(ch => ch.isGod || ch.campaignId === 'first_bloom'), 'the life finale spawns the First Bloom');
  ok(foes.some(ch => ch.enemyTypeId === 'alpha' && ch.boss), 'and an Alpha beside her');
  ok(foes.filter(ch => !ch.boss && !ch.isGod).length >= 1, 'plus ordinary enemies');
  ok(foes.some(ch => ch.isGod && ch.actives.some(e => e.skillId === 'gods_edict')), 'the god brings the edict');
  ok(foes.some(ch => ch.godLineBoss && ch.actives.some(e => e.skillId === 'gods_edict')), 'and so does the escort boss');
}

console.log('\n-- God-tier bosses carry an edict for anyone over 800 max HP --');
{
  const mother = ADV.Campaign.makeActor(ADV.DATA.CAMPAIGN_CHARS.pale_mother);
  ok(mother.actives.some(e => e.skillId === 'gods_edict'), "a god learns God's Edict");
  const fat = mk({ name: 'Fat', isPlayer: true, stats: { hp: 801, atk: 1, def: 0, spd: 5 } });
  const thin = mk({ name: 'Thin', stats: { hp: 800, atk: 1, def: 0, spd: 5 } });
  const st = ADV.Combat.create([fat, thin], [mother], { rng: new ADV.RNG(9) });
  const ug = st.units.find(u => u.ch === mother);
  const uf = st.units.find(u => u.ch === fat);
  const ut = st.units.find(u => u.ch === thin);
  const pool = ADV.Combat.validTargets(st, ug, 'gods_edict', false);
  ok(pool.includes(uf) && !pool.includes(ut), 'edict only marks a health pool over 800');
  ADV.Combat.act(st, ug, { kind: 'skill', skillId: 'gods_edict', targetUid: uf.uid });
  ok(uf.downed && uf.chp === 0, 'the edict drops that target');
  ok(st.events.some(e => e.t === 'godJudgment' && e.targetName === 'Fat'), 'and names them first');
  const smite = ADV.DATA.GOD_LINE_SMITE.pale_mother[0].t;
  ok(smite.indexOf('{target}') >= 0, 'the hatred line names the victim');
  const planned = ADV.Combat.planFor(st, ug);
  ok(!planned || planned.skillId !== 'gods_edict' || planned.targetUid !== ut.uid, 'AI will not edict a 800 HP pool');
  const st2 = ADV.Combat.create([fat, thin], [mother], { rng: new ADV.RNG(11) });
  const ug2 = st2.units.find(u => u.ch === mother);
  const uf2 = st2.units.find(u => u.ch === fat);
  const pick = ADV.Combat.planFor(st2, ug2);
  eq(pick && pick.skillId, 'gods_edict', 'AI casts the edict when someone is over 800');
  eq(pick && pick.targetUid, uf2.uid, 'and prefers the player if they qualify');
}

console.log('\n-- Retired title notice; Continue still validates saves --');
{
  ADV.Save.setBackend(memBackend());
  ok(!ADV.TitleNotice, 'the retired wipe announcement is removed');
  ADV.Game.newGame({ name: 'Keep', sex: 'm', portrait: 1, archetype: 'fighter' });
  ok(ADV.Save.hasValidContinue(), 'a valid save can still Continue');
  ok(!ADV.Save.hasVoicedContinue(), 'a life with no personality is not a voiced Continue');
  const unvoiced = ADV.Game.load();
  ok(!!unvoiced && ADV.Game.player(unvoiced).name === 'Keep', 'an unvoiced living save still loads');
  ADV.Game.newGame({ name: 'Keep', sex: 'm', portrait: 1, archetype: 'fighter', personalityId: 'M01' });
  ok(ADV.Save.hasVoicedContinue(), 'a voiced life can Continue');
  const broken = memBackend();
  broken.setItem('adv:world', JSON.stringify({ seed: 1, playerId: 'c1' }));
  ADV.Save.setBackend(broken);
  ok(!ADV.Save.hasSave() && !ADV.Save.hasValidContinue(), 'a legacy world key is reset by the art release gate');
  ok(!ADV.TitleNotice, 'legacy saves do not restore the announcement');
}

console.log('\n-- Saves survive a missing key and come back from backup --');
{
  const mem = memBackend();
  ADV.Save.setBackend(mem);
  ADV.Game.newGame({ name: 'Keep', sex: 'm', portrait: 1, archetype: 'fighter' });
  mem.removeItem('adv:edges');
  mem.removeItem('adv:vaults');
  ok(!!ADV.Save.loadGame() && ADV.Save.hasValidContinue(), 'edges and vaults can be missing');
  mem.removeItem('adv:world');
  mem.removeItem('adv:characters');
  const back = ADV.Save.loadGame();
  ok(!!back && ADV.World.byId(back.world, back.world.playerId).name === 'Keep', 'a backup restores the life after the primary keys vanish');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
