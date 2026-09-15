// Hiro as an NPC (request): arrival, the party with one open seat, slow warmth,
// the reputation-15 rule, his lines.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const C = ADV.DATA.CONST;
const mem = memBackend;
function newGame(seed, sex, opts) { ADV.Save.setBackend(mem()); return ADV.Game.newGame(Object.assign({ seed, name: 'T', sex: sex || 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'cleave', 'mend'] }, opts || {})); }
function contract(game) {
  const q = ADV.Quests.make(game.rng, 1, 'solo', 'neutral');
  q.encounters = [{ enemyTypeIds: ['bandit'], boss: false }];
  const p = ADV.Game.player(game); p.stats = { hp: 900, atk: 40, def: 30, spd: 20 };
  p.homeId = 'brick';
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 8 } };
  const info = ADV.Game.departureInfo(game, q);
  p.inventory.gold = Math.max(p.inventory.gold, info.tuition + ((info.travel && info.travel.total) || 0));
  const started = ADV.Game.startQuest(game, q, {});
  if (!started.ok) throw new Error('startQuest: ' + started.error);
  while (!game.quest.readyToComplete && !game.quest.over) {
    ADV.Game.currentEncounter(game); const st = ADV.Game.startCombat(game, false);
    let n = 0; while (!st.over && n++ < 500) { const t = ADV.Combat.currentTurn(st); if (!t) break; if (t.unit.ch.isPlayer) { const bv = ADV.Combat.validTargets(st, t.unit, 'basic_attack'); ADV.Combat.act(st, t.unit, bv.length ? { kind: 'attack', targetUid: bv[0].uid } : { kind: 'defend' }); } else ADV.Combat.aiTakeTurn(st, t.unit); ADV.Combat.advance(st); }
    ADV.Game.finishCombat(game);
  }
  ADV.Game.completeQuest(game);
}

(function () {
  console.log('\n-- arrival --');
  const g = newGame(5, 'f'); const world = g.world;
  contract(g);
  ok(!world.hiroId, 'not after one contract');
  contract(g);
  const h = ADV.Hiro.npc(world);
  ok(h && h.alive && h.hiroNpc && h.registryId === 'hiro', 'Hiro arrives after the second contract');
  eq(h.personalityId, 'HIRO', 'his own voice');
  ok(h.inventory.gold <= 1000 && h.inventory.gold >= 1000 - 3 * 45 * 2, 'started with 1000g (wages already offered from it)');
  ok(world.metIds.includes(h.id), 'on the roster');
  const party = ADV.Party.of(world, h);
  ok(party && party.leaderId === h.id && party.reserveForPlayer, 'he leads a party');
  eq(ADV.Party.roster(world, party).length, C.PARTY_MAX - 1, 'hired up to one open seat');
  for (let i = 0; i < 8; i++) ADV.World.tick(world, g.rng, {});
  ok(ADV.Party.roster(world, party).length <= C.PARTY_MAX - 1, 'the seat stays open on the clock');
  ok(ADV.Party.applicationOdds(world, party, ADV.Game.player(g)).odds > 0, 'the player can apply');
  // not when Hiro is being played
  ADV.Save.setBackend(mem());
  const gh = ADV.Game.newGame({ seed: 6, name: 'Hiro', sex: 'm', portraitSlot: 1, portraitSeed: 1, startingSkills: [], password: 'hiro' });
  contract(gh); contract(gh); contract(gh);
  ok(!gh.world.hiroId, 'no NPC Hiro while Hiro is the player');
  // never drawn as a random personality
  ok(!world.characters.some(c => !c.hiroNpc && c.personalityId === 'HIRO'), 'his lines are his alone');
})();

(function () {
  console.log('\n-- death: he gets back up and founds a new party --');
  const g = newGame(8, 'f'); const world = g.world;
  contract(g); contract(g);
  const h = ADV.Hiro.npc(world);
  const oldParty = ADV.Party.of(world, h);
  const oldId = oldParty.id;
  const hires = ADV.Party.members(world, oldParty).slice();
  ADV.Death.finalize(world, h, null, 'killed');
  ok(h.alive && !h.obituary, 'he does not stay dead');
  eq(world.hiroId, h.id, 'same Hiro, not a second one');
  eq(world.characters.filter(c => c.hiroNpc).length, 1, 'only one Hiro on the roster');
  ok(!ADV.Death.graves(world).some(c => c.id === h.id), 'he is not in the graveyard');
  const party = ADV.Party.of(world, h);
  ok(party && party.leaderId === h.id && party.id !== oldId, 'he leads a new party');
  ok(party.reserveForPlayer, 'the open seat is still reserved');
  ok(ADV.Party.roster(world, party).length >= 1 && ADV.Party.roster(world, party).length <= C.PARTY_MAX - 1, 'new company leaves a seat open');
  ok(!world.parties.some(p => p.id === oldId), 'the old company is gone');
  ok(hires.every(c => !c.partyId || c.partyId === party.id), 'old hires were released or rehired');
  ok(h.inventory.gold >= ADV.Hiro.RULES.gold, 'he has gold enough to hire again');
  ok(world.eventFeed.some(e => e.actorIds && e.actorIds.includes(h.id) && /new company/.test(e.text)), 'the town hears he got back up');
  ADV.Game.wipeParty(world, party, ADV.Game.player(g).id);
  const again = ADV.Hiro.npc(world);
  ok(again && again.alive && again.id === h.id, 'a rival wipe still cannot keep him down');
  const rebuilt = ADV.Party.of(world, again);
  ok(rebuilt && rebuilt.leaderId === again.id && rebuilt.reserveForPlayer, 'and he founds another company');
  ADV.Hiro.maybeArrive(world, g.rng, () => {});
  eq(world.characters.filter(c => c.hiroNpc).length, 1, 'arrival does not spawn a second Hiro');
})();

(function () {
  console.log('\n-- slow warmth, the two-quest rule, reputation 15 --');
  const g = newGame(7, 'f'); const world = g.world; const me = ADV.Game.player(g);
  contract(g); contract(g);
  const h = ADV.Hiro.npc(world);
  const other = world.characters.find(c => c.alive && !c.isPlayer && !c.hiroNpc && c.sex === 'm');
  ok(ADV.Rel.socialRate(world, h, me) <= ADV.Rel.socialRate(world, other, me) / 2.9, 'a third of the usual warmth rate');
  ADV.Courtship.recordShared(world, [h.id, me.id]);
  ok(ADV.Rel.score(world, h.id, me.id) < C.REL.FRIENDLY_MIN, 'one shared quest: still Neutral');
  ADV.Courtship.recordShared(world, [h.id, me.id]);
  ok(ADV.Rel.score(world, h.id, me.id) >= C.REL.FRIENDLY_MIN, 'two shared quests: Friendly');
  ADV.Courtship.recordShared(world, [h.id, me.id]);
  ok(!ADV.Courtship.wouldAsk(world, h, me), 'he never asks');
  me.reputation = 10;
  ok(!ADV.Hiro.acceptsProposal(me), 'reputation 10: refused');
  me.reputation = 15;
  ok(ADV.Hiro.acceptsProposal(me), 'reputation 15: accepted');
  // NPC women asking the rich man: only reputation 15+ get through
  const w = world.characters.find(c => c.alive && !c.isPlayer && c.sex === 'f' && !c.hiroNpc);
  for (const id of ADV.Rel.partnerIds(w).slice()) {
    const o = ADV.World.byId(world, id);
    ADV.Rel.removePartner(w, id);
    if (o) ADV.Rel.removePartner(o, w.id);
  }
  w.reputation = 3; me.inventory.gold = 0;
  for (const m of ADV.Courtship.richestMen(world)) {
    if (m !== h && !m.isPlayer) ADV.Rel.setPartners(m, ['taken']);
  }
  ADV.Courtship.invalidate(world);
  ADV.Courtship.tick(world, g.rng, () => {}, false);
  ok(!ADV.Rel.isPartner(h, w), 'a low-reputation woman is turned down');
  ok(ADV.Courtship.onCooldown(world, w.id, h.id), 'and cools for three quests');
})();

(function () {
  console.log('\n-- lines --');
  const L = ADV.DATA.DIALOGUE.HIRO;
  eq(L.general.length + L.friendly.length + L.hatred.length + L.romantic.length, 16, 'sixteen lines');
  const shown = ADV.util.renderLine(L.general[0], { target: 'Sable' });
  eq(shown, 'What it do Sable. Enjoying the game?', 'delivery cues are stripped from the text box');
  ok(/\[tired\]/.test(L.general[0]), 'but kept in the data for the voice');
  const fs = require('fs'); const path = require('path');
  const dir = path.join(__dirname, '..', 'audio', 'vo', 'HIRO');
  ok(fs.existsSync(dir) && fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).length === 16, 'sixteen clips generated');
})();

(function () {
  console.log('\n-- kit, name, ronin gear --');
  const named = ADV.Character.makeRegistry(new ADV.RNG(1), 'hiro', 'Blade');
  eq(named.name, 'Blade', 'the creation name is kept');
  eq(ADV.Character.makeRegistry(new ADV.RNG(2), 'hiro', '   ').name, 'Hiro', 'blank name falls back to Hiro');
  eq(named.equippedSet, 'ronin', 'starts in Ronin Gear');
  ok(ADV.DATA.GEAR_SETS.ronin && ADV.DATA.GEAR_SETS.ronin.campaign, 'Ronin Gear exists and is not sold');
  ok(ADV.DATA.GEAR_SETS.ronin.extraSkills.includes('katana_slash'), 'the set carries the katana kit');
  ok(named.bloodline && named.bloodline.demigod, 'demigod bloodline is set');
  const ids = named.perks.map(e => e.skillId).concat(named.actives.map(e => e.skillId));
  ok(['demigod', 'master_swordsman', 'lone_wolf', 'rich', 'katana_slash', 'god_aura', 'counter_attack', 'finisher'].every(id => ids.includes(id)), 'full unique kit');
  ok(ADV.SkillSys.slotExempt(named, ADV.DATA.SKILLS.katana_slash), 'Master Swordsman parks katana skills outside the active cap');
  ok(ADV.SkillSys.countsTowardCap(named, 'god_aura'), 'God Aura still uses an active slot');
  const g = newGame(5, 'f');
  contract(g); contract(g);
  const npc = ADV.Hiro.npc(g.world);
  eq(npc.name, 'Hiro', 'the town NPC keeps the registry name');
  eq(npc.equippedSet, 'ronin', 'the town NPC wears Ronin Gear');
})();

(function () {
  console.log('\n-- combat: bleed, aura evade, demigod heal, finisher --');
  const Cb = ADV.Combat;
  const I = Cb._internals;
  function duel(h, foe, seed) {
    for (const c of [h, foe]) c.combatHp = null;
    return Cb.create([h], [foe], { rng: new ADV.RNG(seed || 3) });
  }
  const h = ADV.Character.makeRegistry(new ADV.RNG(9), 'hiro', 'Hiro');
  h.stats = { hp: 200, atk: 24, def: 10, spd: 40 };
  const foe = ADV.Character.base({ stats: { hp: 400, atk: 8, def: 0, spd: 4 } });
  const st = duel(h, foe, 3);
  const uh = st.units.find(u => u.ch === h), ue = st.units.find(u => u.ch === foe);
  ue.evade = 0;
  ok(uh.turnsPerRound === 3, 'Lone Wolf takes three turns');
  ok(st.turnQueue.filter(t => t.uid === uh.uid).length === 3, 'those turns sit in the round');
  Cb.currentTurn(st);
  Cb.act(st, uh, { kind: 'skill', skillId: 'katana_slash', targetUid: ue.uid });
  const bleed = ue.statuses.find(s => s.kind === 'bleed');
  ok(bleed && bleed.pct === Cb.DOT_PCT.basic && bleed.ticks === Cb.DOT_TICKS, 'Katana Slash applies the modern bleed (% of max HP over ticks)');
  ok(bleed.stacks, 'the bleed is marked stacking (refresh on reapply)');
  I.addStatus(st, uh, { kind: 'poison', tier: 'basic', rounds: 3, stacks: true });
  ok(!uh.statuses.some(s => s.kind === 'poison'), 'Demigod is immune to poison');
  ok(st.events.some(e => e.t === 'immune' && e.uid === uh.uid), 'immunity is announced');
  uh.chp = uh.maxHp - 50;
  I.healUnit(st, null, uh, 10);
  ok(uh.chp === uh.maxHp && uh.tempHp === 50, 'Demigod multiplies healing received ×10 and banks the rest as uncapped overheal');
  Cb.act(st, uh, { kind: 'skill', skillId: 'god_aura', targetUid: uh.uid });
  const aura = uh.statuses.find(s => s.kind === 'aura');
  ok(aura && aura.atk === 1.3 && aura.def === 1.3 && aura.evadePct === 0.15, 'God Aura writes ATK, DEF, and 15% evade');
  ok(Math.abs(Cb.evadeChance(st, uh) - 0.15) < 0.001, 'the aura evade is a live percentage roll');
  const maxBefore = uh.maxHp;
  uh.tempHp = 0;
  uh.chp = Math.round(maxBefore * 0.5);
  ue.chp = Math.round(ue.maxHp * 0.2);
  const missing = uh.maxHp - uh.chp;
  Cb.act(st, uh, { kind: 'skill', skillId: 'finisher', targetUid: ue.uid });
  ok(ue.downed, 'Finisher executes under 40%');
  ok(uh.chp === maxBefore, 'the kill heal fills the pool he had when the blow landed');
  ok(uh.tempHp === Math.round(maxBefore * 0.3) * 10 - missing, 'Demigod turns the rest into uncapped overheal');
  ok(h.bonusStats.atk === 1 && h.bonusStats.hp === 1 && h.finisherGains === 1 && uh.maxHp === maxBefore + 2, 'Finisher permanently raises all stats by 1');
})();

(function () {
  console.log('\n-- Finisher gains die with him --');
  const g = newGame(11, 'f');
  contract(g); contract(g);
  const h = ADV.Hiro.npc(g.world);
  h.bonusStats = { hp: 4, atk: 4, def: 4, spd: 4 };
  h.finisherGains = 4;
  ADV.Death.finalize(g.world, h, null, 'killed');
  ok(h.alive && h.finisherGains === 0, 'resurrection clears the Finisher tally');
  eq(h.bonusStats.atk, 0, 'and strips those stat gains');
  eq(h.equippedSet, 'ronin', 'he still wears Ronin Gear when he stands up');
})();

(function () {
  console.log('\n-- rival intercepts stay rare and usually not Hiro --');
  const g = newGame(13, 'f');
  contract(g); contract(g);
  g.tutorial = { step: 'done' };
  const p = ADV.Game.player(g);
  const world = g.world;
  const q = { track: 'party', campaign: false, factionAlignment: 'neutral' };
  const origChance = C.RIVAL_CHANCE, origHiro = C.HIRO_RIVAL_CHANCE;
  const origGrace = C.RIVAL_GRACE_QUESTS, origCool = C.RIVAL_COOLDOWN_QUESTS;
  function restore() {
    C.RIVAL_CHANCE = origChance; C.HIRO_RIVAL_CHANCE = origHiro;
    C.RIVAL_GRACE_QUESTS = origGrace; C.RIVAL_COOLDOWN_QUESTS = origCool;
  }
  try {
    C.RIVAL_CHANCE = 1;
    world.lastRivalOuting = null;
    for (let i = 0; i < 5; i++) {
      p.questsCompleted = i; p.questsFailed = 0;
      ok(!ADV.Game.shouldMeetRival(g, q), 'no rival during the first five contracts (' + i + ')');
    }
    p.questsCompleted = 5;
    ok(ADV.Game.shouldMeetRival(g, q), 'a rival can appear after five contracts');

    world.lastRivalOuting = 5;
    p.questsCompleted = 6;
    ok(!ADV.Game.shouldMeetRival(g, q), 'the next contract after a raid cannot be raided');
    p.questsCompleted = 7;
    ok(!ADV.Game.shouldMeetRival(g, q), 'the second contract after a raid still cannot be raided');
    p.questsCompleted = 8;
    ok(ADV.Game.shouldMeetRival(g, q), 'a rival can return after two raid-free contracts');

    for (const party of world.parties) {
      const lead = ADV.Party.leader(world, party);
      if (lead) { lead.factionLeaning = 'neutral'; lead.factionStanding = {}; }
    }
    const hiroParty = ADV.Party.of(world, ADV.Hiro.npc(world));
    ok(hiroParty, 'Hiro still leads a company');
    const otherLeads = world.parties.filter(x => x !== hiroParty && ADV.Party.leader(world, x));
    ok(otherLeads.length > 0, 'other companies exist to raid');
    let hiroHits = 0, otherHits = 0, noneHits = 0;
    for (let i = 0; i < 400; i++) {
      const picked = ADV.Game.pickRivalParty(g, q);
      if (!picked) noneHits++;
      else if (ADV.Hiro.isHiro(ADV.Party.leader(world, picked))) hiroHits++;
      else otherHits++;
    }
    ok(noneHits === 0, 'a rival is chosen when another company is available');
    ok(hiroHits >= 3 && hiroHits <= 45, 'Hiro is about 5% of intercepts', hiroHits);
    ok(otherHits > hiroHits * 5, 'other party leads take most intercepts', otherHits + ' vs ' + hiroHits);

    world.parties = world.parties.filter(x => x === hiroParty);
    C.HIRO_RIVAL_CHANCE = 0.05;
    let onlyHiro = 0, onlyNone = 0;
    for (let i = 0; i < 200; i++) {
      const picked = ADV.Game.pickRivalParty(g, q);
      if (!picked) onlyNone++;
      else if (ADV.Hiro.isHiro(ADV.Party.leader(world, picked))) onlyHiro++;
    }
    ok(onlyNone > 150, 'Hiro alone usually skips the raid', onlyNone);
    ok(onlyHiro > 0 && onlyHiro < 30, 'Hiro alone still rarely intercepts', onlyHiro);

    C.HIRO_RIVAL_CHANCE = 0;
    p.questsCompleted = 12;
    world.lastRivalOuting = null;
    C.RIVAL_CHANCE = 1;
    const skipped = ADV.Game.attachRival(g, q);
    ok(!skipped, 'a Hiro-only skip does not attach a rival');
    ok(world.lastRivalOuting == null, 'a skipped raid does not start the cooldown');
  } finally {
    restore();
  }
})();

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
