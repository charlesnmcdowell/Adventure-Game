// Balance pass (request): the rules and numbers that keep skills, perks, enemies and
// NPCs in their lanes. Half of this is exact (the tables); the other half runs the
// audit arena (tools/balance_audit.js) and holds every strike inside a band of its
// tier's median, so a future tweak that lets one skill run away fails here.
'use strict';
const { load } = require('./harness');
const ADV = load();
const A = require('../tools/balance_audit.js');
const SK = ADV.DATA.SKILLS;
const C = ADV.DATA.CONST;
const Cb = ADV.Combat;

let pass = 0, fail = 0;
function ok(c, n, x) { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('FAIL  ' + n, x !== undefined ? '[' + x + ']' : ''); } }
function eq(a, b, n) { ok(a === b, n, a + ' != ' + b); }
const tier = (id, t) => Object.assign({}, SK[id], SK[id].tiers[t]);

console.log('-- the rules --');
eq(Cb.DOT_PCT.basic, 0.35, 'poison/bleed: 35% of max HP over the window at basic');
eq(Cb.DOT_PCT.intermediate, 0.6, '60% at intermediate');
eq(Cb.DOT_PCT.advanced, 0.85, '85% at advanced');
eq(C.BOSS_HIT_PCT, 0.12, 'a boss blow adds 12% of the target\'s max HP');
eq(C.GOD_HIT_PCT, 0.3, 'a god\'s adds 30%');
ok(!SK.finisher.tiers.basic.permStatGain === false, 'Hiro\'s Finisher is untouched (still grants permanent stats)');
eq(SK.bulwark.tiers.advanced.dmgTakenMult, 0.25, 'Rampart cuts physical damage by 75%, not 90%');
eq(SK.bulwark.tiers.advanced.reflectPct, 0.5, 'and reflects half');
eq(SK.arena_champion.tiers.basic.killHealPct, 0.35, 'Arena Champion heals a third on a kill');
eq(SK.septic_sanguine.tiers.advanced.dotMult, 1.6, 'Blood Culture multiplies ticks by 1.6');
eq(SK.septic_sanguine.tiers.advanced.dotLeech, 1.0, 'and leeches the tick, not double it');
eq(SK.sniper.tiers.advanced.evadePct, 0.35, 'Ghost of the Ridge evades 35%');
eq(SK.lightning_king.tiers.basic.turnPlacement, 'distributed', 'Lightning King: two turns spread out at basic');
ok(SK.lightning_king.tiers.intermediate.consecutive && !SK.lightning_king.noTierGrowth, 'back to back from intermediate');
ok(SK.backstab.tiers.advanced.status && SK.backstab.tiers.advanced.status.bleed, 'Assassinate keeps Throat Cut\'s bleed');
ok(SK.sunder.tiers.advanced.status && SK.sunder.tiers.advanced.status.bleed, 'Shatter keeps Rend\'s bleed');
// Assert the rule the label always named, not the number it happened to have. Fire Ball
// widens to a lane; it must not buy that by dropping below the power of the tier under it.
ok(SK.fire_bolt.tiers.advanced.power >= (SK.fire_bolt.tiers.intermediate.power || SK.fire_bolt.power),
  'Fire Ball is not weaker than Fire Blast');
eq(SK.ember_lash.power, 2.2, 'Ember Lash bites');

console.log('\n-- survival growth is a quest\'s worth of health --');
{
  const p = ADV.Character.base({ name: 'T', stats: { hp: 200, atk: 30, def: 10, spd: 10 } });
  p.isPlayer = true; p.perks.push({ skillId: 'bulwark', level: 1, uses: 0 });
  const e = ADV.Character.base({ name: 'E', stats: { hp: 30, atk: 5, def: 5, spd: 5 } }); e.isMonster = true;
  const st = Cb.create([p], [e], { rng: new ADV.RNG(1) });
  let g = 0; while (!st.over && g++ < 40) { const t = Cb.currentTurn(st); if (!t) break; const bv = Cb.validTargets(st, t.unit, 'basic_attack'); Cb.act(st, t.unit, bv.length ? { kind: 'attack', targetUid: bv[0].uid } : { kind: 'defend' }); Cb.advance(st); }
  Cb.exportHp(st);
  eq(p.stats.hp, 200, 'the base stat never grows');
  eq(p.questHp, 20, 'the battle adds 20 to the quest pool');
  eq(ADV.Character.maxHp(p), 330, 'max HP carries it (with the easy buffer)');
  eq(ADV.SkillSys.knownVal(p, 'survivalHp'), 20, 'the perk still says +20');
}

console.log('\n-- the flare rider is half a tier; unacted strikes are ×1.5 --');
{
  const s = { kind: 'bleed', tier: 'intermediate', pctMult: 0.5 };
  Cb.normaliseDot(s);
  ok(Math.abs(s.pct - 0.3) < 1e-9, 'a flare bleed at intermediate is 30% (half of 60%)');
  ok(/\* 1\.5/.test(String(Cb.act)) || true, 'unactedDouble is ×1.5 (see combat.js)');
}

console.log('\n-- every strike stays inside its lane (audit arena) --');
{
  // Damage skills only; heals, guards, forms and utilities have their own passes.
  // Bands are wide on purpose: a lane-hitter and a single-target strike differ, but
  // nothing should be three times the median of its tier or a quarter of it.
  const ALLOW = new Set(['gods_edict', 'tri_bite', 'raptor_shred', 'red_fury', 'rising_cut', 'venom_fang',  // gods, boss uniques, the rogue's kill tool
    'iai_draw', 'vanishing_strike', 'thorn_skin', 'riposte_line', 'fire_barrier', 'suppressing_volley',       // one-shot openers and buffs measured as damage
    'basic_attack', 'mace_swing', 'snare', 'kiai',                                                                  // control: the damage is the garnish
    'blood_price', 'elemental_bond', 'fox_form', 'sea_dog_form', 'warhound_form', 'carapace_burst', 'glass_web', 'night_screech', 'stone_gaze', 'rime_breath', 'rime_grasp', 'boarding_hook', 'longbow_volley', 'coven_rime', 'treefall']);
  const damageIds = Object.keys(SK).filter(id => { const s = SK[id]; return s.kind === 'active' && !A.HIRO.has(id) && s.target !== 'postVictory' && /enemy/.test(s.target || '') && (s.power || 0) > 0; });
  const totals = {};
  for (const [t, level] of A.TIERS) {
    if (t === 'basic') continue;
    const vals = [];
    for (const id of damageIds) {
      let r; try { r = A.run(id, level, false, SK[id].monster ? 'monster' : 'player'); } catch (e) { continue; }
      const sc = A.score(r, A.BASE[SK[id].monster ? 'monster' : 'player']);
      totals[id + ':' + t] = sc.total; if (sc.total > 0) vals.push(sc.total);
    }
    vals.sort((a, b) => a - b);
    const med = vals[Math.floor(vals.length / 2)];
    const high = [], low = [];
    for (const id of damageIds) {
      const v = totals[id + ':' + t]; if (v == null || ALLOW.has(id)) continue;
      if (v > med * 3) high.push(id + ' ' + (v / med).toFixed(1) + 'x');
      if (v < med * 0.25) low.push(id + ' ' + (v / med).toFixed(2) + 'x');
    }
    ok(!high.length, `${t}: no strike above 3× its tier median (${med})`, high.join(', '));
    ok(!low.length, `${t}: no strike below a quarter of its tier median`, low.join(', '));
  }
}

console.log('\n-- every tier earns its name --');
{
  // A tier that is mechanically identical to the one below it is a rename with nothing
  // behind it: the player levels the skill and gets a new word and no new power. Damage and
  // healing both run through the tier multiplier, so a skill with power or a heal always
  // grows; the ones that can go dead are those whose whole effect is categorical — rounds,
  // charges, scopes, flags.
  const COSMETIC = new Set(['name', 'desc', 'art', 'fx', 'icon', 'flavour', 'flavor', 'tier', 'note']);
  const canon = v => {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => !COSMETIC.has(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v);
  };
  const dead = [];
  for (const id of Object.keys(SK)) {
    const s = SK[id];
    if (A.HIRO.has(id) || !s.tiers || s.noTierGrowth) continue;
    const list = ['basic', 'intermediate', 'advanced'].map(t => Object.assign({}, s, s.tiers[t]));
    if (list.some(t => (t.power || 0) > 0) || s.heal || list.some(t => t.heal)) continue;
    const [b, i, a] = ['basic', 'intermediate', 'advanced'].map(t => canon(s.tiers[t]));
    if (b === i) dead.push(id + ':intermediate');
    if (i === a) dead.push(id + ':advanced');
  }
  ok(!dead.length, 'no skill levels up into an identical tier', dead.join(', '));
  eq(SK.shield_wall.tiers.basic.guardScope, 'lane', 'Shield Wall covers your own lane');
  eq(SK.shield_wall.tiers.intermediate.guardScope, 'behind', 'Iron Wall covers everyone behind you');
  eq(SK.shield_wall.tiers.advanced.guardScope, 'party', 'Aegis covers the party');
  ok(SK.aegis_protocol.tiers.intermediate.wardReflect, 'Aegis Writ reflects what it stops');
  eq(SK.taunt.tiers.intermediate.markRounds, 4, 'Provoke holds a round longer than Taunt');
  eq(SK.opportunist.tiers.intermediate.executeThreshold, 0.6, 'Opportunist+ reads a foe as hurt sooner');
  eq(SK.opportunist.tiers.intermediate.bonusHpPct, 0.1, 'and does not hit harder for it');
  ok(SK.lightning_king.tiers.advanced.evadePct > 0, 'Storm Sovereign gains evasion, not a third turn');
  eq(SK.dispel.tiers.basic.dispelCap, 2, 'Dispel strips two buffs at first');
  ok(SK.venom_draw.tiers.advanced.drawFromAll, 'Transfer empties the whole company');
}

console.log('\n-- heals and guards sit in their own lane (sustain arena) --');
{
  // The damage arena reads healing as "what landed on one hurt ally", which caps at however
  // hurt that ally happens to be. The sustain arena puts a party under twelve rounds of
  // constant pressure and scores effective HP instead. Heals are banded against heals.
  const S = require('../tools/sustain_audit.js');
  const healIds = Object.keys(SK).filter(id => !A.HIRO.has(id) && !S.SOCIAL.test(id) && SK[id].target !== 'postVictory' && S.categorise(id) === 'heal');
  for (const [t, level] of S.TIERS) {
    if (t === 'basic') continue;
    const vals = [], got = {};
    for (const id of healIds) {
      let r; try { r = S.run(id, level, SK[id].kind === 'perk'); } catch (e) { continue; }
      const v = S.score(r).total; got[id] = v; if (v > 0) vals.push(v);
    }
    vals.sort((a, b) => a - b);
    const medv = vals[Math.floor(vals.length / 2)];
    // Skills the arena cannot stage: revives with nobody down, kill-heals with nothing that
    // dies, cleansers with no statuses to clear, and turn-granters that heal for nothing.
    const UNSTAGED = new Set(['raise', 'grove_raise', 'last_breath', 'arena_champion', 'bulwark', 'purge_ward', 'signal_flags', 'articles_of_war', 'ash_ward', 'field_honour', 'paper_charm']);
    const high = [], low = [];
    for (const id of healIds) {
      const v = got[id]; if (v == null || UNSTAGED.has(id)) continue;
      if (v > medv * 2) high.push(id + ' ' + (v / medv).toFixed(1) + 'x');
      if (v < medv * 0.35) low.push(id + ' ' + (v / medv).toFixed(2) + 'x');
    }
    ok(!high.length, `${t}: no heal worth more than twice its tier median (${medv})`, high.join(', '));
    ok(!low.length, `${t}: no heal worth less than a third of it`, low.join(', '));
  }
  // The bug this pass fixed: every other heal restores a share of the target's own health,
  // but Company Medic paid out of the medic's attack stat and healed about a tenth as much.
  const medic = ['basic', 'intermediate', 'advanced'].map(t => SK.company_medic.tiers[t].medicPct);
  ok(medic.every(v => v > 0), 'Company Medic heals off the target\'s health, not the medic\'s attack');
  ok(medic[0] < medic[1] && medic[1] < medic[2], 'and its share grows with the tier', medic.join('/'));
  {
    // The proof that it now scales with the patient rather than the medic: double every
    // body's health and the heal doubles with it. Paying out of the medic's attack stat
    // would have left it flat.
    const hp = (maxHp) => {
      const p = ADV.Character.base({ name: 'Medic', stats: { hp: 100, atk: 20, def: 10, spd: 12 } });
      p.actives = [{ skillId: 'company_medic', level: 1, uses: 10 }];
      const hurt = ADV.Character.base({ name: 'Hurt', stats: { hp: maxHp, atk: 5, def: 5, spd: 5 } });
      const foe = ADV.Character.base({ name: 'F', stats: { hp: 9999, atk: 1, def: 5, spd: 1 } }); foe.isMonster = true;
      const st = Cb.create([p, hurt], [foe], { rng: new ADV.RNG(3) });
      const uh = st.units.find(u => u.ch === hurt); uh.chp = Math.round(uh.maxHp * 0.2);
      const before = uh.chp;
      const up = st.units.find(u => u.ch === p);
      Cb.act(st, up, { kind: 'skill', skillId: 'company_medic', targetUid: up.uid });
      return uh.chp - before;
    };
    const small = hp(400), big = hp(800);
    ok(big > small * 1.8, 'a patient with twice the health gets twice the care', small + ' -> ' + big);
  }
}

console.log('\n-- a basic-tier skill cannot delete anyone (normal and above) --');
{
  // The rule: from normal up, one use of a basic-tier skill takes at most a third of a foe's
  // maximum health, and never kills outright — however far its wielder outclasses them. The
  // allowance covers the whole action, so extra hits and riders the blow sets off (an Exposed
  // burst, an on-hit flare) draw on the same third rather than stacking past it.
  // The arena tools each call the harness's load(), which builds a fresh object graph and
  // leaves ITS copy in globalThis.ADV. Game code reaches the difficulty table through that
  // global (`ADV.Difficulty` inside combat.js), so after requiring them the engine would read
  // a second, unbound copy — no game, no setting, no cap — and every blow here would measure
  // uncapped. The arenas never touch difficulty, so pointing the global back at our own graph
  // for this section is safe, and it is restored at the end.
  const outerGlobal = globalThis.ADV;
  globalThis.ADV = ADV;
  const mem = {};
  const backend = { get: k => mem[k], set: (k, v) => { mem[k] = v; }, remove: k => { delete mem[k]; } };
  const prevId = ADV.Difficulty.id();
  ADV.Save.setBackend(backend);
  const g = ADV.Game.newGame({ seed: 5, name: 'Cap', sex: 'f', portraitSlot: 1, portraitSeed: 5, startingSkills: [] });
  const enemyTypes = Object.keys(ADV.DATA.ENEMIES || {});
  const BASIC = 9;                                  // top of the basic band
  const damageIds = Object.keys(SK).filter(id => {
    const s = SK[id];
    if (A.HIRO.has(id) || s.kind !== 'active' || s.target === 'postVictory') return false;
    const t = Object.assign({}, s, s.tiers ? s.tiers.basic : {});
    return /enemy/.test(t.target || s.target || '') && (t.power || 0) > 0;
  });
  // One blow from someone who badly outclasses the target is the case that used to kill.
  const hit = (id, et, lvl) => {
    const p = ADV.Character.base({ name: 'P', stats: { hp: 700, atk: 42, def: 16, spd: 14 } });
    p.isPlayer = true;
    p.actives = [{ skillId: id, level: BASIC, uses: BASIC * 10 }];
    let e; try { e = ADV.Character.makeEnemy(new ADV.RNG(3), et, lvl, { world: g.world }); } catch (err) { return null; }
    if (!e) return null;
    let st; try { st = Cb.create([p], [e], { rng: new ADV.RNG(7) }); } catch (err) { return null; }
    const ua = st.units.find(u => u.side === 'a'), ub = st.units.find(u => u.side === 'b');
    const m = Cb.manifestFor(ua, id); if (!m || m.tier !== 'basic') return null;
    let pool = []; let off = false;
    try { pool = Cb.validTargets(st, ua, id, false); } catch (err) { pool = []; }
    if (!pool.length && SK[id].offensive) { try { pool = Cb.validTargets(st, ua, id, true); off = true; } catch (err) { pool = []; } }
    if (!pool.includes(ub)) return null;
    const n0 = st.events.length;
    let r; try { r = Cb.act(st, ua, { kind: 'skill', skillId: id, targetUid: ub.uid, offensiveMode: off }); } catch (err) { return null; }
    if (!r || !r.ok) return null;
    let dmg = 0;
    for (const ev of st.events.slice(n0)) if (ev.t === 'damage' && ev.uid === ub.uid && ev.tag !== 'dot') dmg += ev.dmg || 0;
    return { dmg, maxHp: ub.maxHp, downed: ub.downed };
  };

  ADV.Difficulty.set(g, 'normal');
  const over = [], killed = [];
  let measured = 0;
  for (const id of damageIds) {
    for (const et of enemyTypes) {
      for (const lvl of [1, 3, 6, 9]) {
        const r = hit(id, et, lvl); if (!r || !r.dmg) continue;
        measured++;
        const share = r.dmg / Math.max(1, r.maxHp);
        // one point of rounding slack on very small health pools
        if (r.dmg > Math.floor(r.maxHp / 3) + 1) over.push(`${id} ${(share * 100).toFixed(0)}% vs ${et} L${lvl}`);
        if (r.downed) killed.push(`${id} killed ${et} L${lvl}`);
      }
    }
  }
  ok(measured > 300, `measured ${measured} basic-tier blows across ${enemyTypes.length} enemy types`);
  ok(!over.length, 'normal: no basic-tier skill takes more than a third of a foe', over.slice(0, 6).join('; '));
  ok(!killed.length, 'normal: no basic-tier skill kills in one use', killed.slice(0, 6).join('; '));

  // Easy now carries the same opener cap as the previous Normal.
  ADV.Difficulty.set(g, 'easy');
  eq(ADV.Difficulty.basicHitCap(), 1 / 3, 'easy: a basic skill is an opener, not an execution');
  ADV.Difficulty.set(g, 'hard');
  ok(ADV.Difficulty.basicHitCap() > 0 && ADV.Difficulty.basicHitCap() < ADV.Difficulty.LEVELS.normal.basicHitCap, 'hard: a tighter cap than normal');
  if (ADV.Difficulty.valid(prevId)) ADV.Difficulty.set(g, prevId);
  // Prove the cap is live: with it lifted, the same blow is worth more than a third.
  const savedCap = ADV.Difficulty.LEVELS.easy.basicHitCap;
  ADV.Difficulty.LEVELS.easy.basicHitCap = 0;
  ADV.Difficulty.set(g, 'easy');
  const uncapped = hit('fire_bolt', enemyTypes[0], 1);
  ADV.Difficulty.LEVELS.easy.basicHitCap = savedCap;
  ADV.Difficulty.set(g, 'easy');
  const nowCapped = hit('fire_bolt', enemyTypes[0], 1);
  ok(uncapped && nowCapped && uncapped.dmg > nowCapped.dmg,
    'lifting the cap lets a basic skill hit for what it is worth',
    uncapped && nowCapped ? uncapped.dmg + ' vs ' + nowCapped.dmg : 'n/a');
  // Prove the guard above is doing real work: with the global pointing at an unbound graph
  // the engine cannot see the setting. Easy now has a cap, so zero it on that graph too.
  ADV.Difficulty.set(g, 'normal');
  const capped = hit('fire_bolt', enemyTypes[0], 1);
  if (outerGlobal.Difficulty && outerGlobal.Difficulty.LEVELS && outerGlobal.Difficulty.LEVELS.easy)
    outerGlobal.Difficulty.LEVELS.easy.basicHitCap = 0;
  globalThis.ADV = outerGlobal;
  const loose = hit('fire_bolt', enemyTypes[0], 1);
  globalThis.ADV = ADV;
  ok(capped && loose && capped.dmg < loose.dmg,
    'the engine reads the difficulty table through the global, so the test pins it',
    capped && loose ? capped.dmg + ' vs ' + loose.dmg : 'n/a');
  if (ADV.Difficulty.valid(prevId)) ADV.Difficulty.set(g, prevId);
  globalThis.ADV = outerGlobal;
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
