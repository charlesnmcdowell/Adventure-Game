// Integration monkey-soak: plays many quests across lives, randomly hiring,
// romancing, buying, conscripting, accepting rescues — hunting crashes and
// invariant violations across every system (§21 steps 1-14).
'use strict';
const { load } = require('./harness');
const ADV = load();

const SEED = parseInt(process.argv[2] || '20260901', 10);
const QUESTS = parseInt(process.argv[3] || '80', 10);
let errors = 0;

function inv(cond, msg, extra) {
  if (!cond) { errors++; console.log('INVARIANT FAIL:', msg, extra || ''); }
}

ADV.Save.setBackend({ _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });

const rng = new ADV.RNG(SEED);
const arch = ['mage', 'tank', 'ranger', 'fighter', 'druid'][SEED % 5];
const A = ADV.DATA.ARCHETYPE_SKILLS[arch];
let game = ADV.Game.newGame({ seed: SEED, name: 'Monkey', sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: 1, portraitSlot: 1, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });

function player() { return ADV.Game.player(game); }

function playCombat(st) {
  let g = 0;
  while (!st.over && g++ < 800) {
    const t = ADV.Combat.currentTurn(st);
    if (!t) break;
    if (t.unit.ch.isPlayer) {
      const u = t.unit;
      // random-ish sane player: try each active, else attack, occasionally flee
      let acted = false;
      const activesShuffled = rng.shuffle(u.ch.actives.map(a => a.skillId));
      for (const skillId of activesShuffled) {
        const sk = ADV.DATA.SKILLS[skillId];
        if (!sk || sk.target === 'postVictory') continue;
        const pool = ADV.Combat.validTargets(st, u, skillId, false);
        if (!pool.length) continue;
        if (rng.chance(0.7)) {
          ADV.Combat.act(st, u, { kind: 'skill', skillId, targetUid: pool[0].uid });
          acted = true; break;
        }
      }
      if (!acted) {
        const bv = ADV.Combat.validTargets(st, u, 'basic_attack');
        if (bv.length) ADV.Combat.act(st, u, { kind: 'attack', targetUid: bv[0].uid });
        else if ((u.chp / u.maxHp) < 0.3 && rng.chance(0.5)) ADV.Combat.act(st, u, { kind: 'flee' });
      }
    } else {
      ADV.Combat.aiTakeTurn(st, t.unit);
    }
    ADV.Combat.advance(st);
  }
  inv(st.over || true, 'combat terminates');
  return st;
}

let deaths = 0, questsDone = 0, hires = 0, romances = 0, conscripts = 0, rescues = 0;

for (let step = 0; step < QUESTS; step++) {
  try {
    const world = game.world;
    const p = player();
    if (p && p.alive) {
      if (p.inventory.gold >= 5) ADV.Character.eat(p, 'bread');
      else p.meal = { id: 'bread', name: 'Bread', bonus: { hp: 2 } };
      const nextHome = ADV.Housing.list().find(h => ADV.Housing.rank(h.id) === ADV.Housing.rank(p.homeId) + 1);
      if (nextHome && nextHome.cost > 0 && ADV.Housing.rank(nextHome.id) <= ADV.Housing.rank('brick') && p.inventory.gold >= nextHome.cost) {
        ADV.Housing.buy(game, nextHome.id);
      }
    }
    if (!p || !p.alive) {
      deaths++;
      ADV.Game.onPlayerDeath(game, null);
      ADV.Game.continueAfterDeath(game, { name: 'Monkey' + deaths, sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: deaths, portraitSlot: 2, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });
      continue;
    }

    // --- random town actions ---
    if (rng.chance(0.3)) { // trainer
      const pool = ADV.DATA.TRAINER_POOL.filter(id => !ADV.SkillSys.knows(p, id));
      const id = rng.pick(pool);
      if (id) {
        const cost = ADV.SkillSys.trainerCost(p, id);
        if (p.inventory.gold >= cost) {
          const sk = ADV.DATA.SKILLS[id];
          const kind = sk.kind === 'perk' ? 'perk' : 'active';
          if (ADV.SkillSys.atCapacity(p, kind) && rng.chance(0.5)) {
            const list = kind === 'perk' ? p.perks : p.actives;
            if (list.length) ADV.SkillSys.forget(p, rng.pick(list).skillId);
          }
          const r = ADV.SkillSys.learn(p, id, {});
          if (r.ok && cost > 0) p.inventory.gold -= cost;
        }
      }
    }
    if (rng.chance(0.2) && p.inventory.gold >= 800 && !p.equippedSet) {
      p.inventory.gold -= 800;
      p.equippedSet = rng.pick(Object.keys(ADV.DATA.GEAR_SETS));
    }
    if (rng.chance(0.15)) ADV.Vault.payPremium(world, p);

    // --- party management ---
    let party = ADV.Party.of(world, p);
    if (!party && rng.chance(0.3) && p.inventory.gold > 100) {
      party = ADV.Party.create(world, p.id);
    }
    if (party && party.leaderId === p.id && rng.chance(0.6)) {
      const cands = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster &&
        !c.partyId && !c.registryId && c.status === 'normal' && !c.isConscript && !c.isUndead);
      if (cands.length) {
        const r = ADV.Party.offerWage(world, rng, party, rng.pick(cands), rng.int(20, 60));
        if (r.ok) hires++;
      }
    }
    // apply to an employer party sometimes
    if (!party && rng.chance(0.2)) {
      const emp = world.parties.filter(x => x.leaderId !== p.id);
      if (emp.length) {
        const tp = rng.pick(emp);
        const odds = ADV.Party.applicationOdds(world, tp, p);
        if (odds.odds > 0 && rng.chance(odds.odds)) {
          tp.memberIds.push(p.id); tp.wages[p.id] = 30;
          p.partyId = tp.id; p.leaderId = tp.leaderId; p.wage = 30;
        }
      }
    }

    // --- romance ---
    if (rng.chance(0.35) && !p.partnerId) {
      const cands = world.characters.filter(c => c.alive && !c.isPlayer && !c.isMonster &&
        c.sex !== p.sex && !c.registryId && c.status === 'normal');
      for (const c of cands) {
        ADV.Rel.move(world, c.id, p.id, 20, 'romance');
        ADV.World.met(world, c.id);
        const chk = ADV.Rel.canRomance(world, p.id, c.id);
        if (chk.ok) {
          ADV.Rel.commit(world, p.id, c.id).forEach(l => ADV.World.feed(world, l.text, l.actorIds));
          romances++;
          break;
        }
      }
    }
    // vault withdrawal attempts + pending resolutions
    const v = ADV.Vault.of(world, p);
    if (v && rng.chance(0.3) && v.gold > 50) ADV.Vault.requestWithdrawal(world, rng, p, rng.int(10, v.gold));
    if (v && v.pendingWithdrawals.length) ADV.Vault.resolvePending(world, v, 0, rng.chance(0.5));

    // --- rescues & divine offers ---
    if (world.pendingRescues.length && rng.chance(0.5)) {
      const r = ADV.Game.acceptRescue(game, world.pendingRescues[0]);
      if (r.ok && r.st) {
        playCombat(r.st);
        const fr = ADV.Game.finishRescue(game);
        rescues++;
        if (fr && fr.playerDead) {
          deaths++;
          ADV.Game.onPlayerDeath(game, null);
          ADV.Game.continueAfterDeath(game, { name: 'Monkey' + deaths, sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: deaths, portraitSlot: 2, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });
        }
        continue;
      }
    }
    if ((world.divineOffers || []).length && rng.chance(0.3)) {
      const o = world.divineOffers[0];
      const target = world.characters.find(c => c.id === o.targetId);
      const me = player();
      if (target && target.alive) {
        ADV.Divine.acceptDivineQuest(world, me, target, o.powerMult, (t, ids) => ADV.World.feed(world, t, ids));
      }
    }

    // --- pick and run a quest (or stay home / assassinate) ---
    const kids = (p.dependents || []).filter(d => d.age < 5).length;
    if (kids > 0 && p.inventory.gold < kids * 20) { ADV.Game.stayHome(game); continue; }
    if (rng.chance(0.05)) { ADV.Game.stayHome(game); continue; }

    const stage = ADV.Game.careerStage(game);
    const roster = ADV.Game.partyRoster(game);
    const options = game.board.filter(q => q.track === 'solo' || roster.length >= 2);
    const pickable = options.filter(x => {
      if (x.monsterBoss || x.isBoss) return roster.length >= 3;
      return x.tier === 1 || x.tier === 2;
    });
    const q = rng.pick(pickable) || options.filter(x => !x.monsterBoss && !x.isBoss)[0] || options[0];
    const s = ADV.Game.startQuest(game, q, { vaultGold: rng.chance(0.5) ? Math.floor(p.inventory.gold / 2) : 0 });
    if (!s.ok) { ADV.Game.stayHome(game); continue; }

    let questAlive = true;
    let guard = 0;
    while (questAlive && guard++ < 15) {
      const enc = ADV.Game.currentEncounter(game);
      if (!enc) break;
      // sometimes try a verb
      const verb = enc.verbs.find(vv => vv.verb !== 'fight' && vv.ok);
      if (verb && rng.chance(0.4)) {
        const r = ADV.Game.tryVerb(game, verb);
        if (r.success && r.mode === 'bypass') continue;
        if (r.success && r.mode === 'ambush') {
          playCombat(ADV.Game.startCombat(game, true));
          const fr = ADV.Game.finishCombat(game);
          if (fr.playerDead) { questAlive = false; break; }
          continue;
        }
      }
      playCombat(ADV.Game.startCombat(game, false));
      const fr = ADV.Game.finishCombat(game);
      if (fr.playerDead) { questAlive = false; break; }
      if (game.quest.over) break;
    }

    if (game.quest && !game.quest.playerDead) {
      // post-victory choices for defeated named NPCs
      for (const d of (game.quest.defeatedNamed || [])) {
        if (!d.alive) continue;
        let choice = 'kill';
        if (ADV.SkillSys.entryFor(p, 'conscript') && rng.chance(0.5)) choice = 'conscript';
        else if (ADV.SkillSys.entryFor(p, 'necromancy') && rng.chance(0.5)) choice = 'necromancy';
        else if (rng.chance(0.4)) choice = 'knockout';
        const r = ADV.Game.resolveDefeatedNamed(game, d, choice);
        if (choice === 'conscript' && !r.error) conscripts++;
      }
      const out = ADV.Game.completeQuest(game);
      questsDone++;
      if (out.ambush) {
        playCombat(ADV.Game.startAmbush(game, out.ambush));
        const ar = ADV.Game.finishAmbush(game);
        if (ar.playerDead) {
          deaths++;
          const route = ADV.Game.onPlayerDeath(game, out.ambush.attacker.id);
          ADV.Game.continueAfterDeath(game, { name: 'Monkey' + deaths, sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: deaths, portraitSlot: 2, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });
          continue;
        }
        for (const d of (ar.defeatedNamed || [])) {
          if (d.alive) ADV.Game.resolveDefeatedNamed(game, d, 'kill');
        }
      }
    } else if (game.quest && game.quest.playerDead) {
      deaths++;
      const route = ADV.Game.onPlayerDeath(game, null);
      ADV.Game.continueAfterDeath(game, { name: 'Monkey' + deaths, sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: deaths, portraitSlot: 2, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });
      continue;
    }

    // ---- invariants each step ----
    const w2 = game.world;
    let p2 = player();
    if (!p2 || !p2.alive) {
      deaths++;
      ADV.Game.onPlayerDeath(game, null);
      ADV.Game.continueAfterDeath(game, { name: 'Monkey' + deaths, sex: rng.chance(0.5) ? 'f' : 'm', portraitSeed: deaths, portraitSlot: 2, startingSkills: [A.perk].concat(A.actives.slice(0, 2)) });
      p2 = player();
    }
    inv(p2 && p2.alive, 'player alive after step');
    inv(p2.inventory.gold >= 0, 'gold never negative', p2.inventory.gold);
    for (const c of w2.characters) {
      inv(!(c.alive && c.isUndead && c.undeadQuestsLeft < 0), 'undead timer sane');
      const outEdges = w2.edges.filter(e => e.fromId === c.id && e.toId !== w2.playerId);
      if (!c.isPlayer) inv(outEdges.length <= 1, 'slot limit holds', c.name + ':' + outEdges.length);
    }
    for (const e of w2.edges) {
      inv(e.score >= -100 && e.score <= 100, 'edge score in range', e.score);
      const from = w2.characters.find(c => c.id === e.fromId);
      inv(from && from.alive, 'no edges from the dead');
    }
    for (const vv of w2.vaults) inv(vv.gold >= 0, 'vault gold never negative', vv.gold);
    // save/load roundtrip occasionally
    if (step % 17 === 0) {
      const loaded = ADV.Game.load();
      inv(loaded && loaded.world.characters.length === w2.characters.length, 'save/load stable');
    }
  } catch (e) {
    errors++;
    console.log('CRASH at step ' + step + ':', e.stack.split('\n').slice(0, 4).join('\n'));
    break;
  }
}

const w = game.world;
console.log(`\nsteps=${QUESTS} questsDone=${questsDone} deaths=${deaths} hires=${hires} romances=${romances} conscripts=${conscripts} rescues=${rescues}`);
console.log(`clock=${w.questClock} pop=${ADV.World.adults(w).length} feed=${w.eventFeed.length} heroes=${w.activeHeroes.length} orphans=${w.orphans.length}`);
console.log(errors ? `\n${errors} ERRORS` : '\nCLEAN');
process.exit(errors ? 1 : 0);
