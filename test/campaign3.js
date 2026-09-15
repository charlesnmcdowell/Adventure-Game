// Varenholm's Gate (campaign3): plays all fourteen quests headlessly through
// real combat on three scripted paths — hero / monster / mercy — checking that
// every choice applies, companions join and leave when the story says, the
// endings resolve, and progress survives death (meta.c3).
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();
let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const C3 = ADV.Campaign3;
const D = ADV.DATA;

function strong(p) {
  // Story-route fixture: a complete ranged kit, including recovery and anti-heal.
  // The separate gate_balance check uses ordinary trained-party stats for wolves.
  p.stats = { hp: 520, atk: 420, def: 60, spd: 26 };
  p.archetypeInclination = ['ranger']; // use Marksman's back-lane reflect protection
  for (const id of ['aimed_shot', 'cleave', 'mend', 'cleanse', 'marksman', 'sniper']) if (!ADV.SkillSys.knows(p, id)) ADV.SkillSys.learn(p, id, { free: true });
  for (const e of p.perks.concat(p.actives)) e.level = 40;
  p.homeId = 'brick';
  p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 8 } };
  p.inventory.gold = 5000;
}
function keepFed(game) { const p = ADV.Game.player(game); p.homeId = 'brick'; p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 8 } }; p.inventory.gold = Math.max(p.inventory.gold, 3000); }

// Emulates the UI: play a prepared beat headlessly (apply effects, answer choices by policy).
function playBeat(game, beat, policy, log) {
  if (!beat || !beat.c3) return;
  log.beats.push(beat.who + ':' + beat.key);
  C3.applyBeat(game, beat);
  if (beat.choice) {
    const opts = C3.options(game, beat.choice);
    if (!opts.length) { log.emptyChoices.push(beat.choice); return; }
    // policy: an option id, or an array of ids to walk (questions first, then the answer);
    // a question already asked, or no policy at all, falls to the first non-question option
    let want = policy[beat.choice];
    if (Array.isArray(want)) { want = want.find(id => opts.some(o => o.id === id)); }
    const opt = opts.find(o => o.id === want) || opts.find(o => !o.ask) || opts[0];
    log.choices.push(beat.choice + '=' + opt.id);
    C3.applyOption(game, beat.choice, opt);
    if (opt.reply) playBeat(game, C3.replyBeat(opt.reply, beat.who, game, opt, beat.choice), policy, log);
  } else if (beat.dynamic) {
    const opts = C3.dynamicOptions(game, beat.dynamic);
    log.romanceOffers = opts.map(o => o.romance);
    const want = policy.romance;
    const opt = opts.find(o => o.romance === want);
    if (opt) C3.applyOption(game, 'romance', opt);
  }
}
function fight(game, log) {
  const st = ADV.Game.startCombat(game, false);
  let guard = 0;
  while (!st.over && guard++ < 400) {
    const t = ADV.Combat.currentTurn(st); if (!t) break;
    const b = ADV.Campaign.banter(game, st); if (b) log.banter.push(b.who);
    if (t.unit.ch.isPlayer) {
      const av = ADV.Combat.validTargets(st, t.unit, 'aimed_shot', false);
      const cv = ADV.Combat.validTargets(st, t.unit, 'cleave', false);
      const bv = ADV.Combat.validTargets(st, t.unit, 'basic_attack');
      const boss = (av.length ? av : bv).find(u => u.ch && (u.ch.boss || u.ch.isBossFight));
      const smite = ADV.Combat.validTargets(st, t.unit, 'cleanse');
      const heals = ADV.Combat.validTargets(st, t.unit, 'mend');
      if (t.unit.chp < t.unit.maxHp * 0.65 && heals.includes(t.unit) && ADV.Combat.cooldownLeft(t.unit, 'mend') === 0) ADV.Combat.act(st, t.unit, { kind: 'skill', skillId: 'mend', targetUid: t.unit.uid });
      else if (boss && smite.includes(boss) && boss.ch.actives.some(e => ['mend', 'blood_pact'].includes(e.skillId)) && !boss.statuses.some(s => s.kind === 'withering')) ADV.Combat.act(st, t.unit, { kind: 'skill', skillId: 'cleanse', targetUid: boss.uid });
      else if (boss && av.includes(boss)) ADV.Combat.act(st, t.unit, { kind: 'skill', skillId: 'aimed_shot', targetUid: boss.uid });
      else if (boss) ADV.Combat.act(st, t.unit, { kind: 'attack', targetUid: boss.uid });
      else if (av.length) ADV.Combat.act(st, t.unit, { kind: 'skill', skillId: 'aimed_shot', targetUid: av[0].uid });
      else if (cv.length) ADV.Combat.act(st, t.unit, { kind: 'skill', skillId: 'cleave', targetUid: cv[0].uid });
      else if (bv.length) ADV.Combat.act(st, t.unit, { kind: 'attack', targetUid: bv[0].uid });
      else ADV.Combat.act(st, t.unit, { kind: 'defend' });
    } else ADV.Combat.aiTakeTurn(st, t.unit);
    ADV.Combat.advance(st);
  }
  log.exits += st.events.filter(e => e.t === 'campaignExit').length;
  const r = ADV.Game.finishCombat(game);
  if (!r.won) log.lost = true;
  return r;
}
function runQuest(game, n, policy) {
  keepFed(game);
  if (policy.company && policy.company[n]) C3.state(game).company = policy.company[n].filter(id => C3.isRecruited(game, id));
  const log = { n, beats: [], choices: [], banter: [], emptyChoices: [], exits: 0, fights: 0, bypasses: 0 };
  const quest = C3.buildQuest(game, n);
  const p = ADV.Game.player(game);
  const info = ADV.Game.departureInfo(game, quest);
  p.inventory.gold = Math.max(p.inventory.gold, info.tuition + (info.travel ? info.travel.total : 0) + 500);
  const r = ADV.Game.startQuest(game, quest, {});
  if (!r.ok) throw new Error('startQuest: ' + r.error);
  for (const b of game.quest.departureBeats || []) playBeat(game, b, policy, log);
  let guard = 0;
  while (!game.quest.readyToComplete && !game.quest.over && guard++ < 30) {
    const before = game.quest.encIdx;
    const enc = ADV.Game.currentEncounter(game);
    if (!enc) break;
    log.allies = ADV.Game.partyRoster(game).filter(c => c.campaign).map(c => c.campaignId);
    for (const b of enc.openerBeats || []) { playBeat(game, b, policy, log); if (game.quest.encIdx !== before) break; }
    if (game.quest.encIdx !== before) { log.bypasses++; continue; }
    log.fights++;
    fight(game, log);
    if (game.quest.over) break;
  }
  if (game.quest.readyToComplete) {
    const closing = game.quest.closingBeats || [];
    for (const b of closing) playBeat(game, b, policy, log);
  }
  log.failed = !!(game.quest.failed || game.quest.playerDead);
  ADV.Game.completeQuest(game);
  // town arrival: drain the queue the way CampaignUI.arrival does
  for (const b of ADV.Campaign.takeBeats(game)) playBeat(game, b, policy, log);
  return log;
}
function fresh(seed) {
  ADV.Save.setBackend(memBackend());
  const g = ADV.Game.newGame({ seed, name: 'Ward', sex: 'f', portraitSlot: 1, portraitSeed: 1, startingSkills: ['bulwark', 'aimed_shot', 'cleave'] });
  strong(ADV.Game.player(g));
  return g;
}

// ---------------------------------------------------------------- data sanity
console.log('-- data --');
eq(D.CAMPAIGN3_QUESTS.length, 14, 'fourteen quests');
ok(D.FACTIONS.gate && D.FACTIONS.gate.campaign3, 'faction registered');
ok(Object.values(D.CAMPAIGN_CHARS).filter(c => c.companion).length === 15, 'fifteen companions');
ok(ADV.Campaign3.menuVisible({}), 'story menu visible from the start');

// ---------------------------------------------------------------- hero path
console.log('\n-- hero path --');
{
  const g = fresh(11);
  const s = C3.state(g);
  eq(s.stage, 0, 'fresh story');
  const policy = {
    q1_nib: 'run', q1_wren: 'kind', q2_pair: 'no', q2_cassian: 'join', q2_morwin: 'name', q2_selene: 'trust',
    q3_ithrel: 'yes', q3_bramm: 'rescue', q3_tollan: 'yes', q4_grukhar: 'walk', q4_dream: 'reject',
    q5_torvald: 'why', q5_verlan: 'pocket', q5_ilvara: 'walk', q5_camp: 'quiet', q5_ithrel_shot: 'shoot',
    q6_faelen: 'cut', q6_nettle: 'talk', q6_selene_fire: 'warm', q7_dorran: 'with', q7_durnik: 'free', q7_flood: 'wait', q7_dream: 'reject',
    q8_halloran: 'yes', q8_door: 'wren_ward', q8_halvard: 'city', q9_lobby: 'talk', q9_lysandra: 'arrest', romance: 'cassian',
    q10_sarn: 'refuse', q10_summit: 'arrest', q10_letter: 'grief', q10_double: 'question', q10_dream: 'reject',
    q11_allegiance: 'gauntlet', q11_amara: 'refuse', q12_dukes: 'mira', q12_face: 'evidence', q13_maze: 'follow', q13_amara_gate: 'fight', q14_last: 'aldric', q14_resolution: 'kill',
    company: { 5: ['wren_ward', 'selene', 'ithrel'], 6: ['wren_ward', 'selene', 'faelen'], 7: ['wren_ward', 'dorran', 'selene'], 8: ['wren_ward', 'dorran', 'selene'], 9: ['wren_ward', 'selene', 'cassian'], 10: ['wren_ward', 'selene', 'ithrel'], 13: ['wren_ward', 'selene', 'faelen'], 14: ['wren_ward', 'selene', 'cassian'] },
  };
  const logs = [];
  for (let n = 1; n <= 14; n++) {
    const log = runQuest(g, n, policy); logs.push(log);
    ok(!log.failed && !log.lost, `Q${n} ${D.CAMPAIGN3_QUESTS[n - 1].name}: won (${log.fights} fights, ${log.bypasses} bypassed)`, log.lost ? 'combat lost' : '');
    eq(C3.state(g).stage, n, `Q${n}: stage advanced`);
    ok(!log.emptyChoices.length, `Q${n}: every choice offered at least one option`, log.emptyChoices.join(','));
  }
  ok(logs[0].beats.includes('aldric:q1_death'), 'Q1 closing plays Aldric\'s death');
  ok(C3.isRecruited(g, 'wren_ward'), 'Wren joined after Q1');
  eq(logs[0].bypasses, 1, 'Q1: letting Nib run bypassed the storehouse fight');
  ok(C3.isRecruited(g, 'cassian') && !s.gone.includes('cassian'), 'Cassian recruited on the road and never left (no Umbral pair, no Ilvara)');
  ok(C3.isRecruited(g, 'dorran') && C3.isRecruited(g, 'selene'), 'Dorran and Selene joined at the inn');
  ok(C3.isRecruited(g, 'ithrel') && C3.flag(g, 'gorrukDead'), 'Ithrel took the shot; Gorruk died at Q5');
  ok(logs[4].beats.includes('ithrel:q5_dead'), 'Q5 closing: Ithrel\'s line after the kill');
  ok(C3.isRecruited(g, 'bramm') && C3.isRecruited(g, 'ysolde'), 'Ysolde rescued, both joined');
  ok(C3.isRecruited(g, 'nettle') && C3.flag(g, 'druidsPeace'), 'druids talked down, Nettle joined');
  ok(C3.isRecruited(g, 'durnik') && C3.flag(g, 'waitedForDorran') && C3.isAlive(g, 'dorran'), 'waited at the valve: Dorran lives, Durnik freed');
  ok(logs[6].fights >= 5, 'Q7: waiting for Dorran meant fighting the valve room');
  eq(s.allegiance, 'gauntlet', 'allegiance: the Gauntlet');
  ok(logs[8].romanceOffers && logs[8].romanceOffers.includes('cassian'), 'Santiago offered romance after Q9', JSON.stringify(logs[8].romanceOffers));
  ok(!(logs[8].romanceOffers || []).includes('selene'), 'Delphine does not court while Beau lives');
  eq(s.romance, 'cassian', 'romanced Santiago');
  ok(C3.flag(g, 'wrenKept') && C3.isRecruited(g, 'wren_ward'), 'Wren kept in the catacombs');
  ok(logs[12].beats.some(b => b === 'amara:q13_gate') && s.dead.includes('amara'), 'Amara fought and killed at the gate');
  ok(!logs[12].beats.includes('gorruk:q13_again'), 'no Gorruk rematch when he died at Q5');
  ok(s.heritage <= -2, 'heritage rejected', s.heritage);
  eq(s.ending, 'hero', 'ending: hero');
  ok(s.epilogue && s.epilogue.length >= 8, 'epilogue assembled', s.epilogue && s.epilogue.length);
  ok(s.epilogue.some(t => /his knighting/.test(t)) && s.epilogue.some(t => /the right ending/.test(t)), 'epilogue carries the romance and the favoured-ending line');
  ok(ADV.Game.player(g).ownedSets.includes('wardens_gear'), 'Warden\'s Gear issued');
  ok(logs.some(l => l.banter.length), 'companions bantered in combat');
  const shot = logs[4].allies || [];
  ok(shot.length <= 3, 'never more than three companions ride along', shot.join(','));
  // persistence: a reincarnation resumes with the ending intact
  const meta = g.meta;
  ADV.Save.saveGame(g);
  const g2 = ADV.Game.newGame({ seed: 12, name: 'Heir', sex: 'm', portraitSlot: 1, portraitSeed: 2, startingSkills: ['bulwark', 'aimed_shot', 'cleave'] });
  eq(C3.state(g2).stage, 14, 'reincarnation: story progress survives death');
  eq(C3.state(g2).ending, 'hero', 'reincarnation: ending survives death');
  ok(meta === g.meta, 'meta object stable');
}

// ---------------------------------------------------------------- monster path
console.log('\n-- monster path --');
{
  const g = fresh(21);
  const s = C3.state(g);
  const policy = {
    q1_nib: 'draw', q1_wren: 'dark', q2_pair: 'yes', q2_cassian: 'join', q2_morwin: 'kill', q2_selene: 'alone',
    q3_ithrel: 'no', q3_bramm: 'coin', q3_tollan: 'fee', q4_grukhar: 'kill', q4_dream: 'embrace',
    q5_torvald: 'go', q5_verlan: 'beat', q5_ilvara: 'defend', q5_camp: 'recruits',
    q6_faelen: 'leave', q6_nettle: 'fight', q7_dorran: 'mission', q7_durnik: 'leave', q7_flood: 'now', q7_dream: 'embrace', q7_vess_papers: 'refuse',
    q8_halloran: 'pay', q8_door: 'force', q8_halvard: 'blood', q9_lobby: 'fight', q9_lysandra: 'deal', romance: 'ilvara',
    q10_sarn: 'threat', q10_summit: 'kill', q10_letter: 'hunger', q10_double: 'strike', q10_dream: 'embrace',
    q11_allegiance: 'consortium', q11_amara: 'lie', q12_dukes: 'korvath', q12_face: 'throne', q13_maze: 'cut', q13_amara_gate: 'lie', q14_last: 'throne', q14_resolution: 'usurp',
    company: { 3: ['wren_ward', 'vess', 'fennick'], 5: ['wren_ward', 'vess', 'fennick'], 7: ['wren_ward', 'dorran', 'selene'], 8: ['wren_ward', 'ilvara', 'aurelius'], 9: ['wren_ward', 'ilvara', 'selene'], 10: ['wren_ward', 'ilvara', 'selene'], 13: ['ilvara', 'selene', 'aurelius'], 14: ['wren_ward', 'ilvara', 'selene'] },
  };
  const logs = [];
  for (let n = 1; n <= 14; n++) {
    const log = runQuest(g, n, policy); logs.push(log);
    ok(!log.failed && !log.lost, `Q${n}: won (${log.fights} fights, ${log.bypasses} bypassed)`);
    ok(!log.emptyChoices.length, `Q${n}: choices never empty`, log.emptyChoices.join(','));
  }
  ok(C3.flag(g, 'umbralRecruited'), 'Umbral pair recruited');
  ok(s.gone.includes('cassian'), 'Cassian left over the Hand / Ilvara');
  ok(C3.isRecruited(g, 'aurelius') && !C3.isRecruited(g, 'bramm'), 'took Aurelius\' coin; Bramm blocked the road');
  ok(logs[2].beats.includes('bramm:q3_road_block'), 'Q3 variant: Bramm as the last encounter');
  ok(!C3.flag(g, 'gorrukDead'), 'Gorruk escaped');
  ok(logs[12].beats.includes('gorruk:q13_again'), 'Gorruk rematch in the Undercity');
  ok(s.dead.includes('dorran') && C3.flag(g, 'floodedEarly'), 'flooded early: Dorran dead');
  ok(logs[6].beats.includes('selene:q7_after_dead'), 'Selene\'s grief line after the flood');
  ok(s.gone.includes('vess') && s.gone.includes('fennick') && C3.flag(g, 'umbralBetrayed'), 'refused the papers: the Hand left');
  ok(logs[8].beats.includes('vess:q9_betrayal'), 'Q9 variant: the Umbral pair guards the counting floor');
  ok(C3.flag(g, 'lysandraBargain') && s.allegiance === 'consortium', 'Lysandra\'s bargain taken');
  eq(s.romance, 'ilvara', 'romanced Ilvara');
  ok(C3.flag(g, 'wrenHurt') && logs[12].beats.includes('wren_ward:q13_return'), 'Wren hurt in the catacombs, returned for the Undercity');
  ok(s.heritage >= 2, 'heritage embraced', s.heritage);
  eq(s.ending, 'usurper', 'ending: usurper');
  ok(s.epilogue.some(t => /not a warm smile/.test(t)), 'Ilvara\'s favoured-ending line');
  ok(s.epilogue.some(t => /Beau is buried/.test(t)), 'Beau\'s grave in the epilogue');
  ok(!(logs[8].romanceOffers || []).includes('selene'), 'Delphine will not court the one who drowned Beau', JSON.stringify(logs[8].romanceOffers));
  ok(logs[11].beats.includes('lysandra:q12_council_dead'), 'both dukes died when the ward ran at Kolade');
}

// ---------------------------------------------------------------- mercy path
console.log('\n-- mercy path --');
{
  const g = fresh(31);
  const s = C3.state(g);
  const policy = {
    q1_nib: 'who', q1_wren: 'cold', q2_pair: 'who', q2_cassian: 'tease', q2_morwin: 'how', q2_selene: 'why',
    q3_ithrel: 'why', q3_bramm: 'both', q3_tollan: 'crews', q4_grukhar: 'who', q4_dream: 'ask',
    q5_torvald: 'help', q5_verlan: 'pay', q5_ilvara: 'sell', q5_camp: 'storm', q5_ithrel_shot: 'hold',
    q6_faelen: 'price', q6_nettle: 'ask', q6_selene_fire: 'dorran', q7_dorran: 'with', q7_durnik: 'free', q7_flood: 'wait', q7_dream: 'reject', q7_vess_papers: 'give',
    q8_halloran: 'why', q8_door: 'fennick', q8_halvard: 'pay', q9_lobby: 'wren_ward', q9_lysandra: 'arrest', romance: 'faelen',
    q10_sarn: 'take', q10_summit: 'talk', q10_letter: 'anger', q10_double: 'question', q10_dream: 'reject',
    q11_allegiance: 'thieves', q11_amara: 'promise', q12_dukes: 'orlan', q12_face: 'brother', q13_maze: 'follow', q13_amara_gate: 'join', q14_last: 'brother', q14_resolution: 'gauntlet',
    company: { 3: ['wren_ward', 'dorran', 'cassian'], 5: ['wren_ward', 'ithrel', 'fennick'], 6: ['wren_ward', 'selene', 'dorran'], 7: ['wren_ward', 'dorran', 'selene'], 8: ['wren_ward', 'fennick', 'faelen'], 9: ['wren_ward', 'faelen', 'selene'], 10: ['wren_ward', 'faelen', 'selene'], 13: ['wren_ward', 'faelen', 'selene'], 14: ['wren_ward', 'faelen', 'amara'] },
  };
  // nested choices answer through the same policy ids
  Object.assign(policy, { q2_pair_who: 'yes', q2_cassian_tease: 'join', q3_ithrel_why: 'yes', q4_grukhar_who: 'walk', q4_dream_ask: 'reject', q6_faelen_price: 'cut', q6_nettle_ask: 'talk' });
  const logs = [];
  for (let n = 1; n <= 14; n++) {
    const log = runQuest(g, n, policy); logs.push(log);
    ok(!log.failed && !log.lost, `Q${n}: won (${log.fights} fights, ${log.bypasses} bypassed)`);
  }
  ok(C3.isRecruited(g, 'vess') && C3.flag(g, 'umbralPapers'), 'gave the Hand its copies; they stayed');
  ok(s.gone.includes('ithrel') && C3.flag(g, 'ithrelHeld'), 'held Ithrel back: he left');
  ok(C3.flag(g, 'ilvaraSold'), 'sold Ilvara');
  ok(logs[4].beats.includes('cassian:q5_cassian_leaves') && s.gone.includes('cassian'), 'Cassian left over the Umbral pair');
  ok(logs[4].fights === 2 && logs[4].bypasses === 2, 'paid Femi, sold Layla, stormed the camp, fought the tent', logs[4].fights + '/' + logs[4].bypasses);
  ok(logs[11].beats.includes('orlan:q12_council'), 'Folasade died when Olumide was shielded');
  eq(s.allegiance, 'thieves', 'allegiance: the Undervault');
  eq(s.romance, 'faelen', 'romanced Faelen');
  ok(C3.flag(g, 'promisedAmara') && C3.isRecruited(g, 'amara') && logs[12].bypasses >= 2, 'Amara promised, then joined at the gate');
  ok(logs[13].beats.includes('amara:q14_plea'), 'Amara pleads at the altar');
  eq(s.ending, 'mercy', 'ending: mercy');
  ok(s.epilogue.some(t => /brings bread/.test(t)), 'Amara visits the cell');
  ok(s.epilogue.some(t => /debt, paid/.test(t)), 'Faelen favours the thieves\' road');
  // restart wipes only the story
  const lives = g.meta.lives;
  C3.restart(g);
  eq(C3.state(g).stage, 0, 'restart: story forgotten');
  eq(g.meta.lives, lives, 'restart: the rest of meta untouched');
}

// ---------------------------------------------------------------- the other campaigns still work
console.log('\n-- fall-through --');
{
  const g = fresh(41);
  ADV.Campaign.debugJump(g, 'maw', 1);
  const q = ADV.Campaign.buildQuest(g, 1);
  ok(q && !q.campaign3, 'campaign1 quests untouched');
  const roster = ADV.Campaign.spawnEncounter(g, q, 0);
  ok(roster.length > 0, 'campaign1 spawner still answers');
  ADV.Campaign2.debugJump(g, 'bell', 1);
  const q2 = ADV.Campaign2.buildQuest(g, 'bell', 1);
  ok(ADV.Campaign.spawnEncounter(g, q2, 0).length > 0, 'campaign2 spawner still answers');
  ok(ADV.Campaign.finalOpener(g, 'bell').length === 1, 'campaign2 final opener untouched');
}

// ---------------------------------------------------------------- no stock personality voices (request)
console.log('\n-- every speaking part is cast --');
{
  const g = fresh(43);
  let spawned = 0, stock = 0;
  for (let n = 1; n <= C3.QUEST_COUNT; n++) {
    C3.debugJump(g, n);
    const q = C3.buildQuest(g, n);
    for (let e = 0; e < q.cEnc.length; e++) for (const ch of C3.spawnEncounter(g, q, e)) { spawned++; if (ch.personalityId || !ch.noCombatVoice) stock++; }
  }
  ok(spawned > 100, 'spawned every encounter of every quest (' + spawned + ' units)');
  eq(stock, 0, 'no campaign enemy or mini-boss carries a stock personality voice');
  ok(!C3.actor(g, 'verlan').personalityId && !C3.actor(g, 'korvath').personalityId, 'cast actors never carry one either');
  // Nib's fight: the engine's hatred/roar picker must never choose a campaign enemy
  C3.debugJump(g, 1);
  const nibFight = C3.spawnEncounter(g, C3.buildQuest(g, 1), 0);
  ok(nibFight.some(ch => ch.name === 'Nib'), 'Nib is in the storehouse fight');
  const st = { units: nibFight.map(ch => ({ ch, side: 'b' })), turnsSinceHatred: 99, hatredSpoken: {} };
  eq(ADV.Combat.hatredRemarkDue(st, { foeSide: 'b' }), null, 'no combat remark (stock voice or monster roar) is ever due from Nib or his knives');
  // a save from before the fix: Nib already spawned with a stock voice
  const saved = g.quest = { quest: C3.buildQuest(g, 1), encIdx: 0, enemies: nibFight.map(ch => Object.assign({}, ch, { personalityId: 'M02', noCombatVoice: false })), verbs: null, openerBeats: [] };
  ADV.Game.currentEncounter(g);
  ok(saved.enemies.every(ch => !ch.personalityId && ch.noCombatVoice), 'an older save has its stock voices stripped when the encounter loads');
  g.quest = null;
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
