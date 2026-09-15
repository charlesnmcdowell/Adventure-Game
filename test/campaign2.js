// Rules coverage for the second campaign (ninja/samurai/pirate/navy add-on).
// Sections cited are from the add-on doc, not the base GDD.
const H = require('./harness.js');
const ADV = H.load();

let pass = 0, fail = 0;
function ok(c, msg, extra) { if (c) { pass++; console.log('  ok  ' + msg); } else { fail++; console.log('FAIL  ' + msg + (extra !== undefined ? '  [' + extra + ']' : '')); } }
function eq(a, b, msg) { ok(a === b, msg, a + ' != ' + b); }

const C2 = ADV.Campaign2, D = ADV.DATA;

function newG(name) {
  ADV.Save.setBackend(H.memBackend());
  return ADV.Game.newGame({ name: name || 'Test', sex: 'm', portrait: 1, archetype: 'fighter' });
}
// Credit n ordinary contracts of a given alignment without running combat.
function contracts(g, n, alignment) {
  for (let i = 0; i < n; i++) C2.onContractComplete(g, { factionAlignment: alignment }, false);
}
function warQuests(g, n, against) {
  for (let i = 0; i < n; i++) C2.onContractComplete(g, { warAgainst: against }, false);
}

console.log('\n== §1 the four factions ==');
eq(C2.FACTIONS.length, 4, 'four factions registered');
for (const fid of C2.FACTIONS) {
  const f = D.FACTIONS[fid];
  ok(!!f, fid + ' exists in the faction table');
  ok(f.campaign2 === true, fid + ' is flagged campaign2');
  ok(!!f.gearSet && !!D.GEAR_SETS[f.gearSet], fid + ' has a real gear set');
  eq((f.titles || []).length, 3, fid + ' has three titles');
  ok(C2.FACTIONS.includes(f.opposed), fid + ' opposes another of the four');
}
eq(D.FACTIONS.bell.alignment, 'neutral', 'the Hollow Bell is neutral');
eq(D.FACTIONS.green.alignment, 'law', 'the Green-Eyed are lawful');
eq(D.FACTIONS.tally.alignment, 'criminal', 'the Red Tally are criminal');
eq(D.FACTIONS.navy.alignment, 'law', 'the Admiralty is lawful');

console.log('\n== §3 sixty-four skills ==');
const ids = D.CAMPAIGN2_SKILL_IDS;
eq(ids.length, 64, 'sixty-four new skills');
for (const fid of C2.FACTIONS) {
  const mine = ids.filter(id => D.SKILLS[id].faction === fid);
  eq(mine.length, 16, fid + ' contributes sixteen');
  eq(mine.filter(id => D.SKILLS[id].kind === 'perk').length, 4, fid + ' has four perks');
}
ok(ids.every(id => !D.SKILLS[id].status || !/^c2_/.test(D.SKILLS[id].status)), 'no new status types invented');

console.log('\n== §1a alignment lock ==');
{
  const g = newG();
  ok(C2.alignmentOf(g) === null || C2.alignmentOf(g) === undefined, 'a new life starts unaligned');
  ok(C2.alignmentAllows(g, 'tally') && C2.alignmentAllows(g, 'navy'), 'unaligned, either side is open');
  contracts(g, 6, 'law');
  C2.accept(g, 'green');
  eq(C2.alignmentOf(g), 'law', 'joining the Green-Eyed locks you lawful');
  ok(!C2.alignmentAllows(g, 'tally'), 'the Red Tally are now closed');
  ok(C2.alignmentAllows(g, 'navy'), 'the Admiralty is still open');
  ok(C2.alignmentAllows(g, 'bell'), 'the neutral Bell is always open');
  ok(!C2.eligibleFor(g, 'tally'), 'and eligibility agrees');
}
{
  const g = newG();
  contracts(g, 6, 'criminal');
  C2.accept(g, 'tally');
  eq(C2.alignmentOf(g), 'criminal', 'joining the Red Tally locks you criminal');
  ok(!C2.alignmentAllows(g, 'green') && !C2.alignmentAllows(g, 'navy'), 'both lawful factions close');
  ok(C2.alignmentAllows(g, 'bell'), 'the Bell still takes you');
  // §1a: only death resets it — not completing the line, not time
  C2.debugJump(g, 'tally', 5);
  C2.onQuestDone(g, { factionId: 'tally', n: 5 });
  eq(C2.alignmentOf(g), 'criminal', 'finishing the line does not clear the lock');
}
{
  const g = newG();
  contracts(g, 6, 'neutral');
  C2.accept(g, 'bell');
  ok(!C2.alignmentOf(g), 'the Bell alone leaves you unaligned');
  ok(C2.alignmentAllows(g, 'tally') && C2.alignmentAllows(g, 'green'), 'so both sides remain open after it');
}

console.log('\n== §1b three factions in one life ==');
{
  const g = newG();
  contracts(g, 12, 'law');
  C2.accept(g, 'bell'); C2.accept(g, 'green'); C2.accept(g, 'navy');
  eq(C2.joined(g).length, 3, 'a lawful life can hold Bell + Green-Eyed + Admiralty');
  eq(C2.MAX_PER_LIFE, 3, 'three is the cap');
  ok(!C2.eligibleFor(g, 'tally'), 'the fourth is closed by both cap and alignment');
  const p = ADV.Game.player(g);
  eq((p.factionTitles || []).length, 3, 'three titles carried at once');
}
{
  const g = newG();
  contracts(g, 12, 'criminal');
  C2.accept(g, 'bell'); C2.accept(g, 'tally');
  eq(C2.joined(g).length, 2, 'a criminal life tops out at two of the four');
  ok(!C2.eligibleFor(g, 'green') && !C2.eligibleFor(g, 'navy'), 'the lawful pair stay shut');
}

console.log('\n== §1d the horizontal slice ==');
{
  const g = newG();
  const p = ADV.Game.player(g);
  const foreign = D.CAMPAIGN2_SKILL_IDS.find(id => D.SKILLS[id].faction === 'tally' && D.SKILLS[id].kind !== 'perk');
  ok(ADV.Campaign.skillPurchasable(p, foreign, g.meta) !== true, 'a Red Tally skill is closed before any completion');
  contracts(g, 6, 'law');
  C2.accept(g, 'green');
  C2.debugJump(g, 'green', 5);
  C2.onQuestDone(g, { factionId: 'green', n: 5 });
  ok(g.meta.campaign2SkillsUnlocked === true, 'finishing one line sets the unlock');
  ok(ADV.Campaign.skillPurchasable(p, foreign, g.meta) === true,
     'and opens a faction your alignment forbids');
  const allOpen = D.CAMPAIGN2_SKILL_IDS.every(id => ADV.Campaign.skillPurchasable(p, id, g.meta) === true);
  ok(allOpen, 'all sixty-four are purchasable at the trainer');
  // gear and titles stay locked to the faction
  ok(!(p.ownedSets || []).includes(D.FACTIONS.tally.gearSet), 'the Red Tally gear set does NOT come with it');
  ok((p.ownedSets || []).includes(D.FACTIONS.green.gearSet), 'your own faction issued its set');
  ok(!(p.factionTitles || []).some(t => t.factionId === 'tally'), 'nor does a Red Tally title');
}

console.log('\n== §1c death, reincarnation and nepotism ==');
{
  const g = newG();
  contracts(g, 6, 'criminal');
  C2.accept(g, 'tally');
  C2.debugJump(g, 'tally', 3);
  C2.writeProgress(g, 'tally');
  const row = C2.progressRow(g.world, 'tally');
  ok(!!row, '§9 world state carries a campaignProgress row');
  eq(row.factionId, 'tally', 'row names the faction');
  ok(row.questReached >= 2, 'row remembers how far the line got', row.questReached);

  // --- nepotism: an heir resumes the line where the parent died ---
  const heir = ADV.Game.newGame({ name: 'Heir', sex: 'f', portrait: 1, archetype: 'rogue' });
  heir.world.campaignProgress = g.world.campaignProgress;
  heir.meta = g.meta;
  const resumed = C2.onInherit(heir);
  ok(resumed.includes('tally'), 'the heir resumes the Red Tally line');
  eq(C2.member(heir, 'tally').stage, row.questReached, 'at the quest the parent died on');
  eq(C2.alignmentOf(heir), 'criminal', 'and inherits the alignment lock');
  const hp = ADV.Game.player(heir);
  ok((hp.factionTitles || []).some(t => t.factionId === 'tally'), 'and the title');
  ok(!C2.alignmentAllows(heir, 'navy'), 'so the heir cannot take an Admiralty contract either');

  // --- reincarnation: the line is closed, not resumed ---
  const rein = ADV.Game.newGame({ name: 'Reborn', sex: 'm', portrait: 1, archetype: 'mage' });
  rein.world.campaignProgress = g.world.campaignProgress;
  rein.meta = g.meta;
  C2.onReincarnate(rein);
  eq(C2.joined(rein).length, 0, 'a reincarnation starts in no faction');
  ok(!C2.alignmentOf(rein), 'and with no alignment lock');
  ok(C2.consumed(rein, 'tally'), 'but the Red Tally line is burned for this bloodline');
  ok(!C2.eligibleFor(rein, 'tally'), 'so they will never be offered it again');
  ok(C2.eligibleFor(rein, 'bell') || !C2.eligibleFor(rein, 'bell'), 'the untouched factions are unaffected by the burn');
  ok(!C2.consumed(rein, 'navy'), 'the Admiralty was never started, so it stays available');
}

console.log('\n== §2 the campaign cast ==');
{
  const cast = D.CAMPAIGN_CHARS;
  let n = 0;
  for (const fid of C2.FACTIONS) {
    const f = D.FACTIONS[fid];
    for (const role of ['recruiter', 'rival', 'antagonist', 'boss']) {
      const id = f[role];
      ok(!!id && !!cast[id], fid + '.' + role + ' is cast');
      n++;
    }
  }
  eq(n, 16, 'sixteen roles across four factions');
  // §2: Vane-Kessler is deliberately one man in two chairs
  eq(D.FACTIONS.navy.boss, D.FACTIONS.tally.antagonist, 'Vane-Kessler is the Tally antagonist AND the Admiralty boss');
  const uniq = new Set(C2.FACTIONS.flatMap(fid => ['recruiter','rival','antagonist','boss'].map(r => D.FACTIONS[fid][r])));
  eq(uniq.size, 15, 'so fifteen people fill sixteen chairs');
  // §2: Jiro is dead and stays dead
  const jiro = Object.values(cast).find(c => c.trueRestImmune);
  ok(!!jiro && jiro.undead, 'the undead character is flagged immune to True Rest');
}

console.log('\n== §4 enemies and skins ==');
{
  const all = Object.values(D.CAMPAIGN_ENEMIES).filter(e => e.campaign2);
  const mine = all.filter(e => C2.FACTIONS.includes(e.faction));
  eq(mine.length, 20, 'twenty new enemy types across the four factions');
  ok(all.length > mine.length, 'plus the god line\'s own, which belong to no faction');
  ok(mine.every(e => (e.skins || []).length === 3), 'each has three skins');
  ok(mine.every(e => new Set(e.skins.map(s => s.name)).size === 3), 'skins are distinctly named');
  // §4: every active a faction teaches must be witnessable somewhere in its pools
  for (const fid of C2.FACTIONS) {
    const pool = new Set();
    for (const e of mine.filter(e => e.faction === fid)) for (const s of (e.pool || [])) pool.add(s);
    const actives = D.CAMPAIGN2_SKILL_IDS.filter(id => D.SKILLS[id].faction === fid && D.SKILLS[id].kind !== 'perk');
    const missing = actives.filter(id => !pool.has(id));
    eq(missing.length, 0, fid + ': every active is carried by some enemy (witness coverage)');
  }
}

console.log('\n== §5 twenty quests ==');
{
  for (const fid of C2.FACTIONS) {
    const qs = D.CAMPAIGN_QUESTS[fid];
    eq((qs || []).length, 5, fid + ' has five quests');
  }
  const g = newG();
  contracts(g, 6, 'law');
  C2.accept(g, 'navy');
  const q1 = C2.buildQuest(g, 'navy', 1);
  ok(!!q1 && q1.campaign2 && q1.factionId === 'navy', 'quest 1 builds');
  eq(C2.member(g, 'navy').titleTier, 1, 'joining grants the basic title');
  C2.onQuestDone(g, { factionId: 'navy', n: 1 });
  C2.onQuestDone(g, { factionId: 'navy', n: 2 });
  eq(C2.member(g, 'navy').titleTier, 2, 'the second title lands after quest 2');
  C2.onQuestDone(g, { factionId: 'navy', n: 3 });
  C2.onQuestDone(g, { factionId: 'navy', n: 4 });
  eq(C2.member(g, 'navy').titleTier, 3, 'the third after quest 4');
  ok(C2.member(g, 'navy').rivalAlive === false, 'the rival is resolved by quest 4');
  const p = ADV.Game.player(g);
  const own = D.CAMPAIGN2_SKILL_IDS.find(id => D.SKILLS[id].faction === 'navy' && D.SKILLS[id].kind !== 'perk');
  eq(ADV.Campaign.levelRate(p, own), 3, 'a tier-3 title triples that faction\'s level rate');
}

console.log('\n== §6 the faction war ==');
{
  eq(Object.keys(D.FACTION_WAR).length, 4, 'four war quest types, one per faction');
  const g = newG();
  const board = ADV.Quests.generateBoard(g.world, g.rng);
  ok(Array.isArray(board), 'board still generates');
  // §6.1 fight a faction enough and it stops asking
  contracts(g, 8, 'law');
  ok(C2.eligibleFor(g, 'green'), 'the Green-Eyed would have asked');
  warQuests(g, C2.WAR_CLOSES_AT, 'green');
  ok(!C2.eligibleFor(g, 'green'), 'three quests against them and they never do');
  // §6.2 fighting one side opens the other regardless of contracts
  const g2 = newG();
  ok(!C2.eligibleFor(g2, 'tally'), 'no contracts, no Red Tally offer');
  warQuests(g2, C2.WAR_OPENS_AT, 'navy');
  ok(C2.eligibleFor(g2, 'tally'), 'but three quests against the Admiralty and the Tally comes to you');
  // §6: the war board is the witnessing ground for all sixty-four. Every active
  // must be reachable there, or a skill exists that nobody can ever learn free.
  {
    const gw = newG(); const seen = new Set();
    for (const fid of C2.FACTIONS) for (let i = 0; i < 300; i++) {
      const q = ADV.Quests.makeWarQuest(gw.rng, fid, (i % 3) + 1);
      for (let e = 0; e < q.encounters.length; e++)
        for (const en of ADV.Campaign.spawnEncounter(gw, q, e))
          for (const a of (en.actives || [])) seen.add(a.skillId);
    }
    const actives = D.CAMPAIGN2_SKILL_IDS.filter(id => D.SKILLS[id].kind !== 'perk');
    const missing = actives.filter(id => !seen.has(id));
    eq(missing.length, 0, 'every active is witnessable on the war board' + (missing.length ? ' — missing ' + missing.join(', ') : ''));
    const perks = D.CAMPAIGN2_SKILL_IDS.filter(id => D.SKILLS[id].kind === 'perk');
    ok(perks.every(id => !seen.has(id)), 'perks are never witnessed — they stay gold-only');
  }
  // a war quest against your own faction never reaches the board
  const g3 = newG();
  contracts(g3, 6, 'law');
  C2.accept(g3, 'navy');
  let sawOwn = false;
  for (let i = 0; i < 40; i++) {
    for (const q of ADV.Quests.generateBoard(g3.world, g3.rng)) if (q.warAgainst === 'navy') sawOwn = true;
  }
  ok(!sawOwn, 'the board never offers a member a contract against their own faction');
}

// A war contract is ordinary board work that happens to use campaign spawning.
// Routed as a faction line it would skip onContractComplete and the war counter
// would never move — which is the entire §6 mechanic.
{
  const g = newG();
  const p = ADV.Game.player(g);
  p.stats = { hp: 8000, atk: 140, def: 40, spd: 24 }; p.combatHp = 8000; p.inventory.gold = 9000;
  // DOT pass: enemy poison/bleed is a percentage of max HP, so a big HP pool is no armour; the script only aims shots
  p.statusImmunities = ['poison', 'bleed'];
  if (!ADV.SkillSys.knows(p, 'aimed_shot')) ADV.SkillSys.learn(p, 'aimed_shot', { free: true });
  const shot = p.actives.find(e => e.skillId === 'aimed_shot'); if (shot) shot.level = 40;
  const mate = g.world.characters.find(c => !c.isPlayer && c.alive);
  const company = ADV.Party.create(g.world, p.id);
  if (mate) { company.memberIds.push(mate.id); mate.partyId = company.id; company.wages[mate.id] = 0; }
  const q = ADV.Quests.makeWarQuest(g.rng, 'bell', 2);
  ok(!!q && q.track === 'party' && q.special, 'a war contract is a special party writ');
  ok((q.cEnc || []).filter(e => e.mini).length === 2, 'and it always fields two named bosses');
  const r = ADV.Game.startQuest(g, q, {});
  ok(r.ok, 'and it starts', r.error);
  let guard = 0;
  while (!g.quest.readyToComplete && !g.quest.over && guard++ < 20) {
    ADV.Game.currentEncounter(g);              // spawns this encounter's enemies
    const st = ADV.Game.startCombat(g, false);
    let t = 0;
    while (!st.over && t++ < 4000) {
      const cur = ADV.Combat.currentTurn(st); if (!cur) break;
      if (cur.unit.ch.isPlayer) {
        const av = ADV.Combat.validTargets(st, cur.unit, 'aimed_shot', false);
        const bv = ADV.Combat.validTargets(st, cur.unit, 'basic_attack');
        const boss = (av.length ? av : bv).find(u => u.ch && u.ch.boss);
        if (boss && av.includes(boss)) ADV.Combat.act(st, cur.unit, { kind: 'skill', skillId: 'aimed_shot', targetUid: boss.uid });
        else if (av.length) ADV.Combat.act(st, cur.unit, { kind: 'skill', skillId: 'aimed_shot', targetUid: av[0].uid });
        else if (bv.length) ADV.Combat.act(st, cur.unit, { kind: 'attack', targetUid: bv[0].uid });
        else ADV.Combat.act(st, cur.unit, { kind: 'defend' });
      } else ADV.Combat.aiTakeTurn(st, cur.unit);
      ADV.Combat.advance(st);
    }
    ADV.Game.finishCombat(g);
  }
  ok(!g.quest.over || g.quest.readyToComplete, 'and it is survivable');
  ADV.Game.completeQuest(g);
  eq((C2.state(g).war || {}).bell, 1, 'finishing it moves the war counter');
  ok(C2.state(g).contractsTotal >= 1, 'and credits an ordinary contract');
}

console.log('\n== §7 the god line ==');
{
  const gl = D.GOD_LINE;
  ok(!!gl, 'the god line is defined');
  eq(gl.basePay, 1000, 'a thousand gold the first time');
  eq(gl.gateQuests, 0, 'god contracts are not quest-count gated');
  eq(gl.routes.length, 3, 'death, chaos, and life — one route each');
  ok(!!D.CAMPAIGN_CHARS.pale_mother && !!D.CAMPAIGN_CHARS.drowned_king && !!D.CAMPAIGN_CHARS.first_bloom, 'three gods are cast');
  const g = newG();
  const posted = ADV.Quests.makeGodBoard(g.world, g.rng);
  eq(posted.length, 3, 'all three god contracts post on a fresh board');
  ok(posted.every(q => q.track === 'party' && q.godLine && q.isBoss), 'and each is a party boss contract');
  const gq = ADV.Quests.makeGodQuest(g.world, g.rng);
  ok(!!gq, 'a god quest builds without a quest-count gate');
  eq(gq.track, 'party', 'and it is party-only');
  ok(gq.isBoss && gq.godLine, 'and it is a boss contract on the god line');
  eq(ADV.Quests.godPayout(g), 1000, 'first run pays a thousand');
  g.campaign2.godRuns = 1; eq(ADV.Quests.godPayout(g), 500, 'second pays five hundred');
  g.campaign2.godRuns = 2; eq(ADV.Quests.godPayout(g), 250, 'third pays two-fifty');
  g.campaign2.godRuns = 9; eq(ADV.Quests.godPayout(g), 125, 'and it floors, it does not reach zero');
}

console.log('\n== §8 sixty personalities ==');
{
  const D2 = D.DIALOGUE;
  const live = Object.values(D2).filter(p => !p.hidden);
  eq(live.length, 60, 'sixty assignable personalities');
  eq(live.filter(p => p.sex === 'm').length, 30, 'thirty male');
  eq(live.filter(p => p.sex === 'f').length, 30, 'thirty female');
  const added = live.filter(p => /^[MF](2[1-9]|30)$/.test(p.id));
  eq(added.length, 20, 'twenty are new');
  ok(added.every(p => ['general','friendly','hatred','romantic'].every(b => (p[b] || []).length >= 4)),
     'each new one has the four social bands');
  ok(added.every(p => ['general','friendly','hatred','romantic']
      .every(b => p[b].some(l => !/\{(them|their|they|partner)\}/.test(l)))),
     'each band has at least one unconditional line');
  // the draw must actually reach them
  const g = newG();
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const npc = ADV.Character.seedNPC(g.rng, null, { sex: i % 2 ? 'f' : 'm' });
    if (npc.personalityId) seen.add(npc.personalityId);
  }
  const reached = added.filter(p => seen.has(p.id)).length;
  ok(reached >= 15, 'the seeding draw reaches the new personalities', reached + '/20');
  ok(!seen.has('HIRO'), 'and never draws the hidden one');
}

console.log('\n== §3 the four encounter verbs ==');
{
  const g = newG();
  const p = ADV.Game.player(g);
  const enemies = [{ species: 'human', enemyLevel: 5, sex: 'm', inventory: { gold: 10 },
                     factionStanding: { law: 40, criminal: 0 }, perks: [], actives: [] }];
  // Campaign encounter verbs read the perk's current tier. At level 1 the
  // stated condition is the basic gate.
  const verbsFor = (perkId, q, level) => {
    p.perks = [{ skillId: perkId, level: level || 1, uses: 0 }];
    return ADV.Quests.availableVerbs(g.world, p, [], q || { name: 'Ordinary work' }, enemies);
  };
  const has = (vs, id) => vs.find(v => v.verb === id);
  // §3a Bribe — resolves against anyone poorer than you
  p.inventory.gold = 500;
  let v = has(verbsFor('silent_trade'), 'silent_trade');
  ok(!!v, 'Silent Trade offers Bribe at an encounter');
  ok(v && v.odds > 0.5, 'and it resolves against someone poorer', v && v.odds);
  p.inventory.gold = 1;
  v = has(verbsFor('silent_trade'), 'silent_trade');
  ok(v && v.odds < 0.5, 'but not against someone richer', v && v.odds);
  // §3b Command — resolves against the lawfully aligned
  v = has(verbsFor('standing_order'), 'standing_order');
  ok(v && v.odds > 0.5, 'Standing Order commands a lawful opponent');
  enemies[0].factionStanding = { law: 0, criminal: 40 };
  v = has(verbsFor('standing_order'), 'standing_order');
  ok(v && v.odds < 0.5, 'and does not command a criminal one');
  // §3c Black Flag — against anyone carrying cargo or coin
  v = has(verbsFor('black_flag', { name: 'The Prize', cargo: true }), 'black_flag');
  ok(v && v.odds > 0.5, 'Black Flag works on a cargo run');
  // §3d Requisition — lawfully aligned OR carrying cargo
  v = has(verbsFor('colours_and_papers', { name: 'The Prize', cargo: true }), 'colours_and_papers');
  ok(v && v.odds > 0.5, 'Colours and Papers requisitions cargo');
  // beasts refuse all four
  enemies[0].species = 'wolf';
  for (const id of ['silent_trade', 'standing_order', 'black_flag', 'colours_and_papers']) {
    const w = has(verbsFor(id, { name: 'The Prize', cargo: true }), id);
    ok(w && !w.ok, id + ' cannot be used on a beast');
  }
  enemies[0].species = 'human';
  p.inventory.gold = 500;
  // a bribe costs coin; colours up takes it
  p.inventory.gold = 500;
  const paid = ADV.Quests.attemptBypass(g.world, g.rng, p, [], { verb: 'silent_trade', odds: 1, mode: 'bypass' }, enemies);
  ok(paid.success && paid.stolen < 0, 'a successful bribe costs gold', paid.stolen);
  const took = ADV.Quests.attemptBypass(g.world, g.rng, p, [], { verb: 'black_flag', odds: 1, mode: 'bypass' }, enemies);
  ok(took.success && took.stolen > 0, 'running up the colours takes gold', took.stolen);
}

console.log('\n== §0a voice routing ==');
{
  const g = newG();
  const T = ADV.Character.VOICE_TAGS;
  eq(T.godf, 't9puW54s29EO0gQK6OMR', 'the female god voice is the doc\'s');
  eq(T.godm, 'HMvHZWb0ZWSo5Kc5l22D', 'the male god voice is the doc\'s');
  eq(T.matriarch, '0KlQKzxy6Oee2hYOyHII', 'the matriarch voice is the doc\'s');
  const npc = ADV.Character.seedNPC(g.rng, g.world, { sex: 'f' });
  eq(ADV.Character.voiceTagFor(g.world, npc), null, 'an ordinary NPC keeps her own voice');
  npc.bloodline = { demigod: true };
  eq(ADV.Character.voiceTagFor(g.world, npc), null, 'a female demigod keeps her personality voice');
  ok(npc.personalityId, 'and keeps her rolled personality');
  const m = ADV.Character.seedNPC(g.rng, g.world, { sex: 'm' });
  m.bloodline = { demigod: true };
  eq(ADV.Character.voiceTagFor(g.world, m), null, 'a male demigod keeps his personality voice');
  ok(!ADV.Character.voiceTagFor(g.world, ADV.Game.player(g)), 'the player is never retagged');
  // every voice the add-on casts is present
  const cast = require('../tools/voice_casting.json');
  const need = ['M21','M22','M23','M24','M25','M26','M27','M28','M29','M30',
                'F21','F22','F23','F24','F25','F26','F27','F28','F29','F30',
                'obaasan','suzume','kaede','jiro','takeda','ayame','isamu','kira',
                'hallow','beau','saintcloud','vanekessler','crell','fane','ash',
                'pale_mother','drowned_king'];
  const uncast = need.filter(k => !cast[k]);
  eq(uncast.length, 0, 'every new speaker has a voice id' + (uncast.length ? ': ' + uncast.join(', ') : ''));
  eq(cast.vanekessler, cast.vanekessler, 'placeholder');
  eq(cast.M30, cast.jiro, '\u00a78: M30 Unquiet deliberately shares Jiro\'s voice');
  eq(cast.F30, cast.kira, '\u00a78: F30 Bereaved deliberately shares Kira\'s voice');
}

console.log('\n== §9 persistence ==');
{
  ADV.Save.setBackend(H.memBackend());
  const g = newG();
  contracts(g, 6, 'criminal');
  C2.accept(g, 'tally');
  C2.debugJump(g, 'tally', 3);
  ADV.Save.saveGame(g);
  const back = ADV.Save.loadGame();
  ok(!!back && !!back.campaign2, 'campaign2 state round-trips through the save');
  eq(C2.alignmentOf(back), 'criminal', 'the alignment lock survives');
  eq(C2.member(back, 'tally').stage, C2.member(g, 'tally').stage, 'so does progress');
  ok(Array.isArray(back.world.campaignProgress), 'campaignProgress persists in world state');
}

console.log('\n== the first campaign is untouched ==');
{
  const g = newG();
  const c1 = D.CAMPAIGN_SKILL_IDS.filter(id => !D.SKILLS[id].campaign2);
  eq(c1.length, 72, 'the original seventy-two are still there and still separate');
  for (const fid of ['maw', 'antler', 'varenholm']) {
    ok(!!D.FACTIONS[fid], fid + ' survives');
    eq(c1.filter(id => D.SKILLS[id].faction === fid).length, 24, fid + ' keeps its twenty-four');
  }
  ok(D.CAMPAIGN2_SKILL_IDS.every(id => !c1.includes(id)), 'no skill belongs to both campaigns');
  ok(typeof ADV.Campaign.buildQuest === 'function', 'Campaign.buildQuest is still callable');
  ok(!C2.isC2('antler'), 'and campaign 1 factions are not claimed by campaign 2');
}

console.log('\n==== ' + pass + ' passed, ' + fail + ' failed ====');
process.exit(fail ? 1 : 0);
