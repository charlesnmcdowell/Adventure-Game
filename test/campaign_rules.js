// Campaign doc §0b-0f + §13d-2: the base-game rule changes.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const mkCh = (o) => ADV.Character.base(Object.assign({ stats: { hp: 100, atk: 10, def: 10, spd: 10 } }, o));
function give(ch, id, level) { const sk = ADV.DATA.SKILLS[id]; (sk.kind === 'perk' ? ch.perks : ch.actives).push({ skillId: id, level: level || 1, uses: 0 }); }
function fight(a, b, seed) { for (const c of [].concat(a, b)) c.combatHp = null; return ADV.Combat.create([].concat(a), [].concat(b), { rng: new ADV.RNG(seed || 1) }); }
const unit = (st, ch) => st.units.find(u => u.ch === ch);
const mem = memBackend;

(function () {
  console.log('\n-- §13d-2 perks start at basic, level by use, gold-only, never witnessed --');
  const t = mkCh({}); give(t, 'bulwark', 1);
  const m = ADV.SkillSys.manifest(t, t.perks[0]);
  eq(m.tier, 'basic', 'a level-1 perk manifests at basic');
  eq(m.data.reflectPct, 0.25, 'Bulwark reflects 25% at level 1');
  ok(ADV.SkillSys.witness(t, 'marksman', 'basic') === null && !t.journal.marksman, 'perks cannot be witnessed');
  t.freeSkillsUsed = 3;
  eq(ADV.SkillSys.trainerCost(t, 'marksman'), 150, 'perks cost gold even if seen');
  t.perks[0].uses = 9;
  const lv = ADV.SkillSys.recordUse(t, 'bulwark');
  ok(lv && lv.leveled && lv.level === 2, 'perks level from use like actives');
})();

(function () {
  console.log('\n-- §0d Backstab: opener or stealth only, any lane; Exposed --');
  const rogue = mkCh({ stats: { hp: 100, atk: 12, def: 10, spd: 14 } }); give(rogue, 'backstab', 10); give(rogue, 'smoke_bomb'); give(rogue, 'cleave');
  const foe = ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', { level: 3 }); foe.stats.hp = 400; foe.stats.def = 10;
  const st = fight(rogue, foe, 5);
  const ur = unit(st, rogue), uf = unit(st, foe);
  ok(ADV.Combat.validTargets(st, ur, 'backstab').includes(uf), 'Backstab reaches a FRONT-lane enemy as the opener');
  const hp0 = uf.chp;
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'backstab', targetUid: uf.uid });
  const d1 = hp0 - uf.chp;
  ok(d1 >= 60, 'Backstab power 6.0 hits like a double attack', d1);
  ok(uf.statuses.some(x => x.kind === 'exposed' && x.stacks === 1), 'melee applies 1 Exposed');
  eq(ADV.Combat.validTargets(st, ur, 'backstab').length, 0, 'Backstab greyed out after the opener');
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ur.uid });
  ok(ur.stealth, 'Smoke Bomb grants stealth');
  ok(ADV.Combat.validTargets(st, ur, 'backstab').includes(uf), 'Backstab usable again from stealth');
  const hp1 = uf.chp;
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'cleave', targetUid: uf.uid });
  const cleaveDmg = hp1 - uf.chp;
  ok(!uf.statuses.some(x => x.kind === 'exposed' && x.stacks > 1), 'melee consumed the Exposed stack');
  ok(!ur.stealth, 'attacking broke stealth');
  // exposed bonus check: same cleave without stacks
  const st2 = fight(mkCh({ stats: { hp: 100, atk: 12, def: 10, spd: 14 } }), (() => { const f = ADV.Character.makeEnemy(new ADV.RNG(3), 'bandit', { level: 3 }); f.stats.hp = 400; f.stats.def = 10; return f; })(), 5);
  give(st2.units[0].ch, 'cleave');
  const hp2 = st2.units[1].chp;
  ADV.Combat.act(st2, st2.units[0], { kind: 'skill', skillId: 'cleave', targetUid: st2.units[1].uid });
  ok(cleaveDmg > hp2 - st2.units[1].chp, 'a hit into Exposed does more than a clean hit', cleaveDmg + ' vs ' + (hp2 - st2.units[1].chp));
})();

(function () {
  console.log('\n-- §0c Marksman: back-lane attacks take no reflect --');
  const ranger = mkCh({ name: 'R', archetypeInclination: ['ranger'] }); give(ranger, 'marksman'); give(ranger, 'aimed_shot');
  const tankF = mkCh({ name: 'T', archetypeInclination: ['tank'] });
  const thornFoe = mkCh({ name: 'Thorny' }); give(thornFoe, 'thorn_skin');
  const st = fight([tankF, ranger], [thornFoe], 9);
  const ur = unit(st, ranger), ut = unit(st, thornFoe);
  eq(ur.lane, 'back', 'ranger stands in back');
  ADV.Combat.act(st, ut, { kind: 'skill', skillId: 'thorn_skin', targetUid: ut.uid });
  const before = ur.chp;
  ADV.Combat.act(st, ur, { kind: 'skill', skillId: 'aimed_shot', targetUid: ut.uid });
  eq(ur.chp, before, 'no thorn reflect against a Deadeye in the back lane');
})();

(function () {
  console.log('\n-- §0e withdrawal caps --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 5, name: 'Wife', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['charm', 'mend', 'triage'] });
  const world = g.world; const wife = ADV.Game.player(g);
  const hus = world.characters.find(c => c.sex === 'm' && !c.isPlayer);
  ADV.Rel.move(world, hus.id, wife.id, 60, 'romance'); ADV.Rel.move(world, wife.id, hus.id, 60, 'romance');
  ADV.Rel.commit(world, wife.id, hus.id);
  const v = ADV.Vault.of(world, wife); v.gold = 1000;
  v.sharedQuestStreak = 3; v.questsSinceShared = 0;
  let cap = ADV.Vault.withdrawalCap(world, v, wife);
  eq(cap.state, 'happy', 'three shared quests = Happy');
  eq(cap.pct, 1.0, 'charming woman + happy husband = the whole vault');
  const r = ADV.Vault.requestWithdrawal(world, g.rng, wife, 1000);
  eq(r.amount, 1000, 'full withdrawal granted');
  v.gold = 1000;
  const blocked = ADV.Vault.requestWithdrawal(world, g.rng, wife, 1000);
  ok(blocked.waited && blocked.amount === 0, 'second draw the same stay is refused');
  world.questClock++;
  v.sharedQuestStreak = 0; v.questsSinceShared = 3;
  cap = ADV.Vault.withdrawalCap(world, v, wife);
  eq(cap.state, 'neutral', 'three quests apart = Neutral');
  eq(cap.pct, 0.45, 'neutral husband 35% + Charm 10%');
  const r2 = ADV.Vault.requestWithdrawal(world, g.rng, wife, 1000);
  eq(r2.amount, 450, 'request trimmed to the cap, not refused');
})();

(function () {
  console.log('\n-- §0f killing generates no Hatred --');
  const world = ADV.World.create(77);
  const [a, b, k] = world.characters;
  ADV.Rel.move(world, b.id, a.id, 80, 'quest'); // b loves a
  ADV.Death.finalize(world, a, k.id, 'killed');
  ok(!ADV.Rel.hates(world, b.id, k.id), "the victim's friend does not hate the killer");
  eq(world.edges.filter(e => e.toId === k.id && e.score < 0).length, 0, 'no negative edges created by a killing');
})();

(function () {
  console.log('\n-- §0b heroes & villains --');
  const world = ADV.World.create(31337);
  const rng = new ADV.RNG(2);
  const feed = () => {};
  const necro = world.characters[0];
  necro.divineMarked = true; necro.divineMarkQuest = 0; world.questClock = 10;
  ADV.Divine.assignHeroes(world, rng, feed);
  const rec = world.activeHeroes[0];
  ok(rec, 'a hero is named');
  const hero = ADV.World.byId(world, rec.heroId);
  ok(ADV.Divine.heroEligible(world, hero, necro.id) || hero.status === 'hero', 'named hero passed eligibility');
  // target dies -> hero stays empowered and idle
  ADV.Death.finalize(world, necro, hero.id, 'killed');
  eq(hero.status, 'hero', 'grants are permanent: still a hero');
  ok(hero.grantsHeld && hero.actives.some(a => a.skillId === 'true_rest'), 'idle hero keeps True Rest');
  ok(!hero.heroTargetId, 'idle: no target');
  // someone kills the hero -> villain with grants; two heroes owed at 2x after 3 quests
  const killer = world.characters.find(c => c.alive && c !== hero && !c.isPlayer);
  const helper = world.characters.find(c => c.alive && c !== hero && c !== killer);
  hero.__killedByParty = [helper.id];
  ADV.Death.finalize(world, hero, killer.id, 'killed');
  eq(killer.status, 'villain', 'killer becomes a Villain');
  eq(killer.villainLevel, 1, 'Villain level 1');
  ok(killer.actives.some(a => a.skillId === 'true_rest') && killer.perks.some(p => p.skillId === 'hero'), "the hero's grants transfer");
  eq(helper.status, 'villain', 'assisting party member is a Villain too — no bystander clause');
  eq(killer.heroesOwed, 2, 'two heroes will be named');
  eq(killer.nextHeroPower, 4, 'each at twice the bonus');
  eq(killer.heroReprieveUntil - world.questClock, 3, 'after the standard 3-quest reprieve');
  // ineligibility: a forbidden user is never a hero
  const dirty = world.characters.find(c => c.alive && c.status === 'normal');
  dirty.usedForbidden = true;
  ok(!ADV.Divine.heroEligible(world, dirty, killer.id), 'forbidden-art users are never named hero');
})();

(function () {
  console.log('\n-- leader fall records a funeral --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 44, name: 'Hire', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'fire_bolt'] });
  const world = g.world;
  const me = ADV.Game.player(g);
  const lead = world.characters.find(c => c.alive && !c.isPlayer && c.sex === 'm');
  const mate = world.characters.find(c => c.alive && !c.isPlayer && c !== lead);
  const party = ADV.Party.create(world, lead.id);
  party.memberIds.push(me.id, mate.id);
  me.partyId = party.id; mate.partyId = party.id;
  me.leaderId = lead.id; mate.leaderId = lead.id;
  ADV.Rel.move(world, mate.id, lead.id, 80, 'romance', { set: true });
  ADV.Rel.commit(world, mate.id, lead.id);
  g.quest = { quest: { name: 'A road job', encounters: [{}] }, encIdx: 0, over: false, failed: false, defeatedNamed: [], witnessedNew: [] };
  ADV.Game.resolveLeaderFall(g, { leaderFell: true });
  const rec = world.pendingLeaderDeath;
  ok(rec && rec.leaderId === lead.id, 'the funeral remembers the lead');
  ok(!ADV.Party.of(world, me), 'the company is gone');
  ok(!lead.alive, 'the lead is dead');
  const word = rec.words.find(w => w.id === mate.id);
  ok(word && (word.band === 'romantic' || word.band === 'friendly'), 'the spouse speaks from their standing with the lead');
})();

(function () {
  console.log('\n-- graveyard obituaries --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 51, name: 'Pat', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const spouse = world.characters.find(c => c.sex === 'f' && !c.isPlayer && c.alive);
  ADV.Rel.commit(world, p.id, spouse.id);
  const child = ADV.Character.makeDependent(g.rng, world, spouse, p.id);
  child.name = 'Ryn'; child.age = 8;
  spouse.dependents.push(child);
  spouse.childIds.push(child.id); p.childIds.push(child.id);
  give(spouse, 'mend', 4);
  ADV.Death.finalize(world, spouse, p.id, 'killed');
  const ob = spouse.obituary;
  ok(ob && ob.text, 'finalize stores a composed obituary');
  ok(ob.skills.indexOf('Mend') >= 0, 'skills are listed');
  ok(ob.spouses.indexOf(p.name) >= 0, 'surviving spouse is named');
  ok(ob.children.indexOf('Ryn') >= 0, 'surviving child is named');
  ok(/fell to/.test(ob.text) && /Ryn/.test(ob.text), 'the eulogy names the killer and the child');
  const rebuilt = ADV.Death.composeObituary(world, spouse, null, 'quest');
  ok(rebuilt && rebuilt.name === spouse.name, 'the graveyard can compose a stone for an old grave');
})();

(function () {
  console.log('\n-- jilt a second spouse --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 9, name: 'Pat', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const me = ADV.Game.player(g);
  me.inventory.gold = 400;
  ADV.Housing.buy(g, 'brick');
  const wives = world.characters.filter(c => c.alive && c.sex === 'f' && !c.isPlayer).slice(0, 2);
  ok(wives.length === 2, 'two women to marry');
  ADV.Rel.commit(world, me.id, wives[0].id);
  ADV.Rel.commit(world, me.id, wives[1].id);
  ok(ADV.Rel.isPartner(me, wives[0]) && ADV.Rel.isPartner(me, wives[1]), 'both wives held');
  ADV.Rel.jilt(world, me, wives[1]);
  ok(!ADV.Rel.isPartner(me, wives[1]), 'the second wife is gone');
  ok(ADV.Rel.isPartner(me, wives[0]), 'the first wife stays');
  ok(ADV.Rel.hates(world, wives[1].id, me.id), 'the jilted wife hates him');
})();

(function () {
  console.log('\n-- employer parties refill after a leader dies --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 12, name: 'Pat', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const pid = world.playerId;
  const npcParties = () => world.parties.filter(p => p.leaderId !== pid && ADV.Party.leader(world, p) && ADV.Party.leader(world, p).alive);
  for (const p of world.parties.slice()) {
    if (p.leaderId === pid) continue;
    ADV.Party.disband(world, p);
  }
  eq(npcParties().length, 0, 'the town companies are gone');
  ADV.World.tick(world, g.rng, {});
  ok(npcParties().length >= 3, 'new companies form on the next clock', npcParties().length);
})();

(function () {
  console.log('\n-- wages: apply 30–200 by reputation, raises to 300 (player +100) --');
  const G = ADV.DATA.CONST.GOLD;
  eq(G.hirelingWage, 30, 'wages start at 30');
  eq(G.typicalWage, 30, 'offers start at 30');
  eq(G.wageAcceptMin, 30, 'floor is 30');
  eq(G.wageAcceptMax, 100, 'leaders still offer NPCs 30–100');
  eq(G.wageApplyMax, 200, 'apply ceiling is 200');
  eq(G.wageRaiseMax, 300, 'raise ceiling is 300');
  eq(ADV.Party.clampWage(20), 30, 'offers below 30 snap up');
  eq(ADV.Party.clampWage(200), 100, 'leader offers above 100 snap down');
  eq(ADV.Party.applyAskMax({ reputation: -20 }), 30, 'unknown names can only ask the floor');
  eq(ADV.Party.applyAskMax({ reputation: 0 }), 115, 'a new name opens 115g');
  eq(ADV.Party.applyAskMax({ reputation: 20 }), 200, 'fame opens 200g');
  eq(ADV.Party.clampApplyWage({ reputation: 0 }, 200), 115, 'apply asks snap to reputation');
  eq(ADV.Party.clampApplyWage({ reputation: 20 }, 10), 30, 'apply floor is 30');
  eq(ADV.Party.clampRaiseWage(400), 300, 'raises snap to 300');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 3, name: 'Hire', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const party = world.parties[0];
  ok(party, 'a company exists to serve');
  party.memberIds.push(p.id); party.wages[p.id] = 30;
  p.partyId = party.id; p.leaderId = party.leaderId; p.wage = 30;
  p.reputation = 20;
  const yes = ADV.Party.requestRaise(world, { chance: () => true }, p);
  ok(yes.ok && yes.accepted && yes.wage === 40, 'a raise is granted after hire');
  const twice = ADV.Party.requestRaise(world, { chance: () => true }, p);
  eq(twice.ok, false, 'a second ask the same stay is refused');
  world.questClock++;
  p.reputation = -15;
  ok(ADV.Party.raiseChance(p, 40, 50) < ADV.Party.raiseChance({ reputation: 20 }, 40, 50), 'reputation moves the odds');
  const no = ADV.Party.requestRaise(world, { chance: () => false }, p);
  ok(no.ok && !no.accepted && p.wage === 40, 'a refused raise leaves the wage');
  world.questClock++;
  const named = ADV.Party.requestRaise(world, { chance: () => true }, p, 70);
  ok(named.ok && named.accepted && named.wage === 70, 'you can name the next raise');
  world.questClock++;
  party.wages[p.id] = 400; p.wage = 400;
  const top = ADV.Party.requestRaise(world, { chance: () => true }, p, 410);
  eq(top.ok, false, '400g is the player raise ceiling');
})();

(function () {
  console.log('\n-- quit then found a party, even after id counter resets --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 8, name: 'Found', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const old = world.parties[0];
  ok(old, 'an employer exists');
  old.memberIds.push(p.id); old.wages[p.id] = 30;
  p.partyId = old.id; p.leaderId = old.leaderId; p.wage = 30;
  ADV.Party.removeMember(world, old, p.id);
  eq(p.partyId, null, 'quit clears the party');
  ok(!old.memberIds.includes(p.id), 'the old roster does not keep them');
  ADV.Party.resetIds(1);
  p.inventory.gold = 100;
  const before = world.parties.length;
  const mine = ADV.Party.create(world, p.id);
  ok(mine && mine.leaderId === p.id, 'they lead the new company');
  ok(mine !== old, 'it is not the company they quit');
  ok(mine.id !== old.id, 'the new company has its own id');
  eq(world.parties.length, before + 1, 'a new company was recorded');
  eq(ADV.Party.of(world, p), mine, 'Party.of finds the company they lead');
  eq(ADV.Game.careerStage(g), 'leader', 'career stage is leader');
  const fold = ADV.Party.foldByLeader(world, p);
  ok(fold.ok, 'they can disband');
  eq(p.inventory.gold, 200, 'the founding purse comes back');
  eq(ADV.Party.of(world, p), null, 'they are free after the fold');
})();

(function () {
  console.log('\n-- repair a save that reused p1 --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 9, name: 'Fix', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const old = world.parties[0];
  const ghost = { id: old.id, leaderId: p.id, memberIds: [], wages: {} };
  world.parties.push(ghost);
  p.partyId = old.id; p.leaderId = null; p.wage = 0;
  ADV.Party.repairWorld(world);
  const mine = ADV.Party.of(world, p);
  ok(mine && mine.leaderId === p.id, 'repair keeps the company they lead');
  ok(mine.id !== old.id, 'the ghost no longer shares the old id');
  ok(!old.memberIds.includes(p.id), 'they are not still on the old roster');
})();

(function () {
  console.log('\n-- party alignment is visible and leaders keep to it --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 11, name: 'Align', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const party = world.parties[0];
  const leader = ADV.Party.leader(world, party);
  leader.factionLeaning = 'law';
  leader.factionStanding = { law: 0, criminal: 0, neutral: 0 };
  eq(ADV.Party.alignment(world, party), 'law', 'a lawful leader reads lawful');
  eq(ADV.Party.alignmentLabel('law'), 'lawful', 'law labels as lawful');
  eq(ADV.Party.alignmentLabel('criminal'), 'criminal', 'criminal labels as criminal');
  party.memberIds.push(p.id); party.wages[p.id] = 30;
  p.partyId = party.id; p.leaderId = leader.id; p.wage = 30;
  g.tutorial = { step: 'done' };
  g.board = [
    { id: 'c1', track: 'party', tier: 1, payout: 200, factionAlignment: 'criminal', isBoss: false },
    { id: 'l1', track: 'party', tier: 1, payout: 180, factionAlignment: 'law', isBoss: false },
    { id: 'n1', track: 'party', tier: 1, payout: 190, factionAlignment: 'neutral', isBoss: false },
  ];
  const pick = ADV.Game.leaderPick(g);
  eq(pick && pick.factionAlignment, 'law', 'a lawful leader takes a lawful contract');
  leader.factionLeaning = 'criminal';
  const crim = ADV.Game.leaderPick(g);
  eq(crim && crim.factionAlignment, 'criminal', 'a criminal leader takes a criminal contract');
})();

(function () {
  console.log('\n-- contacts: shared quests and a 2-quest gap --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 19, name: 'Gap', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const world = g.world;
  const p = ADV.Game.player(g);
  const stranger = world.characters.find(c => c.alive && !c.isPlayer && c.sex === 'f');
  ok(stranger, 'a stranger exists');
  ok(!ADV.World.rodeWithPlayer(world, stranger), 'a random has not ridden with you');
  world.pendingRescues = [{ targetId: stranger.id, kind: 'failed', expiresAtQuest: 99 }];
  world.pendingProposals = [{ fromId: stranger.id, at: 0 }];
  ADV.World.pruneStrangerContacts(world);
  eq((world.pendingRescues || []).length, 0, 'a stranger rescue is dropped');
  eq((world.pendingProposals || []).length, 0, 'a stranger proposal is dropped');
  ADV.Courtship.recordShared(world, [stranger.id, p.id]);
  ok(ADV.World.rodeWithPlayer(world, stranger), 'a shared contract makes them known');
  ADV.Rel.move(world, stranger.id, p.id, 80, 'quest', { set: true });
  ADV.World.tryOfferRescue(world, g.rng, stranger, null, 'failed');
  eq((world.pendingRescues || []).length, 1, 'a friend in trouble can ask');
  const other = world.characters.find(c => c.alive && !c.isPlayer && c !== stranger);
  ADV.Courtship.recordShared(world, [other.id, p.id]);
  ADV.Rel.move(world, other.id, p.id, 80, 'quest', { set: true });
  ADV.World.tryOfferRescue(world, g.rng, other, null, 'failed');
  eq((world.pendingRescues || []).length, 1, 'only one help request at a time');
  world.pendingRescues = [];
  ADV.World.tryOfferRescue(world, g.rng, other, null, 'failed');
  eq((world.pendingRescues || []).length, 0, 'help waits at least two quests');
  world.questClock += 2;
  ADV.World.tryOfferRescue(world, g.rng, other, null, 'failed');
  eq((world.pendingRescues || []).length, 1, 'after two quests another friend can ask');

  const g2 = ADV.Game.newGame({ seed: 23, name: 'Rival', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  g2.tutorial = { step: 'done' };
  const me = ADV.Game.player(g2);
  const soloJob = (g2.board || []).find(q => !q.campaign && q.track === 'solo') || { track: 'solo', encounters: [{}, {}], factionAlignment: 'neutral', payout: 80 };
  if (!soloJob.encounters) soloJob.encounters = [{}, {}];
  const partyJob = (g2.board || []).find(q => !q.campaign && q.track === 'party') || { track: 'party', encounters: [{}, {}], factionAlignment: 'neutral', payout: 500 };
  if (!partyJob.encounters) partyJob.encounters = [{}, {}];
  partyJob.payout = Math.max(partyJob.payout || 0, 500);
  me.questsCompleted = 0; me.questsFailed = 0;
  ok(!ADV.Game.shouldMeetRival(g2, soloJob), 'the first outings have no rival company');
  ok(!ADV.Game.shouldMeetRival(g2, partyJob), 'a party job is also quiet on the first outings');
  me.questsCompleted = 5;
  g2.rng.chance = () => true; // Exercise an eligible encounter, independently of its 22% roll.
  ok(!ADV.Game.shouldMeetRival(g2, soloJob), 'solo work never draws a rival company');
  const soloStart = ADV.Game.startQuest(g2, soloJob, {});
  ok(soloStart.ok && !soloStart.quest.rival, 'a solo outing has no rival');
  g2.quest = null;
  const company = ADV.Party.create(g2.world, me.id);
  const hire = g2.world.characters.find(c => c.alive && !c.isPlayer && !c.partyId);
  company.memberIds.push(hire.id); company.wages[hire.id] = 30; hire.partyId = company.id; hire.leaderId = me.id;
  ok(ADV.Game.shouldMeetRival(g2, partyJob), 'after the five-contract grace a rival can appear on a party job');
  const started = ADV.Game.startQuest(g2, partyJob, {});
  ok(started.ok && started.quest.rival, 'that outing meets another company');
  ok(!ADV.Game.shouldMeetRival(g2, partyJob), 'the next outing is too soon for another rival');
  g2.world.questClock += 2;
  me.questsCompleted += 2;
  ok(!ADV.Game.shouldMeetRival(g2, partyJob), 'the next two completed contracts are raid-free');
  me.questsCompleted++;
  ok(ADV.Game.shouldMeetRival(g2, partyJob), 'the following contract can meet a rival again');
  ok(!ADV.Game.shouldMeetRival(g2, soloJob), 'solo work still never intercepts');
  ok(!ADV.Game.shouldMeetRival(g2, Object.assign({}, partyJob, { campaign: true })), 'campaign jobs skip the intercept');
})();

(function () {
  console.log('\n-- campaign faction jobs pay enough for a party --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 44, name: 'MawPay', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const p = ADV.Game.player(g);
  ADV.Campaign.accept(g, 'maw');
  const q1 = ADV.Campaign.buildQuest(g, 1);
  ok(q1.payout >= 500, 'the Maw\'s first contract pays at least 500g');
  const party = ADV.Party.create(g.world, p.id);
  const hire = g.world.characters.find(c => c.alive && !c.isPlayer && !c.partyId);
  party.memberIds.push(hire.id); party.wages[hire.id] = 200; hire.partyId = party.id; hire.leaderId = p.id;
  ok(ADV.Game.contractCoversPayroll(g, q1), 'that covers a 200g hire');
  const started = ADV.Game.startQuest(g, q1, {});
  ok(started.ok, 'a party can take the first Maw job');
  const q5 = ADV.Campaign.buildQuest(g, 5);
  ok(q5.payout >= 500, 'the finale still pays at least 500g');
})();

(function () {
  console.log('\n-- hireling rival intercept is the lead\'s call --');
  ADV.Save.setBackend(mem());
  const g = ADV.Game.newGame({ seed: 77, name: 'Hire', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: ['cleave', 'mend', 'triage'] });
  const me = ADV.Game.player(g);
  const party = g.world.parties.find(x => x.leaderId !== me.id && ADV.Party.leader(g.world, x));
  ok(!!party, 'a company exists to hire into');
  const leader = ADV.Party.leader(g.world, party);
  party.memberIds.push(me.id); party.wages[me.id] = 30;
  me.partyId = party.id; me.leaderId = party.leaderId; me.wage = 30;
  eq(ADV.Game.careerStage(g), 'hireling', 'player is a hireling');
  g.tutorial = { step: 'done' };
  me.questsCompleted = 5;
  g.rng.chance = () => true;
  const q = g.board.find(x => x.track === 'party' && !x.campaign) || { track: 'party', encounters: [{}, {}], factionAlignment: 'neutral', payout: 200 };
  if (!q.encounters) q.encounters = [{}, {}];
  const started = ADV.Game.startQuest(g, q, {});
  ok(started.ok && g.quest.rival, 'the outing meets a rival company');
  g.quest.readyToComplete = true;
  g.quest.encIdx = g.quest.quest.encounters.length;
  ok(ADV.Game.maybeStartRivalFinale(g), 'the finale starts after the last encounter');
  const enc = ADV.Game.currentEncounter(g);
  ok(enc && enc.rival && enc.verbs.some(v => v.verb === 'fight' && v.ok), 'steel is a legal call');
  const pick = ADV.Game.leadRivalChoice(leader);
  ok(pick === 'fight' || pick === 'abandon', 'the lead picks fight or abandon');
  leader.personality = { aggression: 80, caution: 20, greed: 20, loyalty: 40, pride: 40 };
  eq(ADV.Game.leadRivalChoice(leader), 'fight', 'an aggressive lead fights');
  const r = ADV.Game.resolveHirelingRival(g);
  eq(r.choice, 'fight', 'the hireling does not vote');
  ok(!g.quest.over, 'the contract is still on');
  leader.personality = { aggression: 10, caution: 80, greed: 20, loyalty: 40, pride: 40 };
  g.quest.over = false; g.quest.failed = false; g.quest.fled = false;
  const walk = ADV.Game.resolveHirelingRival(g);
  eq(walk.choice, 'abandon', 'a cautious lead walks');
  ok(g.quest.failed && g.quest.fled, 'the company leaves the contract');
})();

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
