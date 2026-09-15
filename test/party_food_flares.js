// Hire roster repair, grocer auto-buy, and class flares on twin skills.
'use strict';
const { load, memBackend } = require('./harness');
const ADV = load();

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra != null ? '  [' + extra + ']' : '')); }
}
function eq(a, b, name) { ok(a === b, name, a + ' != ' + b); }

const yes = { chance: () => true };

(function () {
  console.log('\n-- Hire: ghost fourth seat stays on the player company --');
  ADV.Character.resetIds(1);
  ADV.Party.resetIds(1);
  const world = { parties: [], characters: [], edges: [] };
  const lead = ADV.Character.base({ name: 'Lead', isPlayer: true, personality: { greed: 10, pride: 10, aggression: 50, caution: 50, loyalty: 50 } });
  const npcLead = ADV.Character.base({ name: 'Boss' });
  const ghost = ADV.Character.base({ name: 'Ghost', personality: { greed: 80, pride: 10, aggression: 50, caution: 50, loyalty: 50 } });
  world.characters.push(lead, npcLead, ghost);
  const party = ADV.Party.create(world, lead.id);
  const npc = { id: 'p99', leaderId: npcLead.id, memberIds: [ghost.id], wages: {} };
  npcLead.partyId = npc.id;
  world.parties.push(npc);
  ghost.partyId = null;
  ghost.leaderId = null;
  ok(ADV.Party.takenIds(world).has(ghost.id), 'takenIds sees a body still on an NPC roster');
  const stale = { id: party.id, leaderId: party.leaderId, memberIds: party.memberIds.slice(), wages: Object.assign({}, party.wages) };
  const r = ADV.Party.offerWage(world, yes, stale, ghost, 80);
  ok(r.ok, 'offer against a stale party object still writes the live company', r.why);
  ok(party.memberIds.indexOf(ghost.id) >= 0, 'live party gained the hire');
  ok(stale.memberIds.indexOf(ghost.id) < 0, 'the stale copy was not the seat that kept them');
  eq(ghost.partyId, party.id, 'hire partyId points at the player company');
  ADV.Party.repairWorld(world);
  ok(party.memberIds.indexOf(ghost.id) >= 0, 'repairWorld keeps the player hire');
  ok(npc.memberIds.indexOf(ghost.id) < 0, 'repairWorld drops them from the NPC roster');
  eq(ghost.partyId, party.id, 'repairWorld partyId stays on the player company');
  const again = ADV.Party.offerWage(world, yes, party, ghost, 80);
  ok(!again.ok && again.why === 'already hired', 'second offer does not double-seat');
})();

(function () {
  console.log('\n-- Grocer: favorite auto-buys every other quest --');
  ADV.Save.setBackend(memBackend());
  const ch = ADV.Character.base({ name: 'P', isPlayer: true, inventory: { gold: 40, items: [], weightCap: 40 } });
  const game = { world: { characters: [ch], playerId: ch.id }, player: ch, quest: null };
  const s = ADV.Survival.state(ch);
  s.favoriteFoodId = 'bread';
  s.autoBuyFood = true;
  const a = ADV.Survival.onQuestResolved(game);
  ok(a.autoBought && a.autoBought.id === 'bread', 'first return buys the favorite (ticks start even)');
  eq(ch.inventory.gold, 35, 'bread costs 5g');
  ok(ch.meal && ch.meal.id === 'bread', 'meal is packed for the next quest');
  eq(s.hunger, 0, 'the purchase cures hunger from that night');
  const b = ADV.Survival.onQuestResolved(game);
  ok(!b.autoBought, 'second return skips — every other quest');
  ok(!ch.meal, 'the packed meal was digested');
  const c = ADV.Survival.onQuestResolved(game);
  ok(c.autoBought && c.autoBought.id === 'bread', 'third return buys again');
  ch.inventory.gold = 0;
  ADV.Character.digest(ch);
  const d = ADV.Survival.onQuestResolved(game);
  ok(!d.autoBought, 'even tick with no gold does not invent a meal');
  // fourth resolve: ticks was 3 (odd) so no attempt; fifth is even and broke
  const e = ADV.Survival.onQuestResolved(game);
  ok(e.autoBuyFailed === 'not enough gold', 'short purse is reported', e.autoBuyFailed);
})();

(function () {
  console.log('\n-- Class flares: twins get extras, base power stays --');
  const cleave = ADV.DATA.SKILLS.cleave;
  const scout = ADV.DATA.SKILLS.scouts_cut;
  ok(ADV.SkillSys.mechKey(cleave) === ADV.SkillSys.mechKey(scout), 'Cleave and Scout\'s Cut share a mechanical key');
  const cf = ADV.SkillSys.classFlare(cleave);
  const sf = ADV.SkillSys.classFlare(scout);
  ok(cf && cf.kind === 'press', 'fighter twin gets the press flare');
  ok(sf && sf.kind === 'openVein', 'rogue twin gets the open-vein flare');
  ok(!ADV.SkillSys.classFlare(ADV.DATA.SKILLS.taunt), 'unique 0-power Taunt is not flared');
  ok(!ADV.SkillSys.classFlare(ADV.DATA.SKILLS.shield_wall), 'unique 0-power Shield Wall is not flared');

  const aimed = ADV.DATA.SKILLS.aimed_shot;
  const bolt = ADV.DATA.SKILLS.fire_bolt;
  ok(ADV.SkillSys.mechKey(aimed) === ADV.SkillSys.mechKey(bolt), 'Aimed Shot and Fire Bolt are power twins');
  ok(ADV.SkillSys.classFlare(aimed) && ADV.SkillSys.classFlare(aimed).bonusHits === 1, 'ranger twin grows a follow-up arrow');
  ok(ADV.SkillSys.classFlare(bolt) && ADV.SkillSys.classFlare(bolt).shockBonus, 'mage twin threads shock');

  const fighter = ADV.Character.base({ name: 'F', stats: { hp: 100, atk: 11, def: 10, spd: 10 } });
  fighter.actives.push({ skillId: 'cleave', level: 1, uses: 0 });
  const foe = ADV.Character.base({ name: 'E', stats: { hp: 200, atk: 10, def: 10, spd: 9 } });
  const st = ADV.Combat.create([fighter], [foe], { rng: new ADV.RNG(3) });
  const ua = st.units[0], ud = st.units[1];
  ADV.Combat.act(st, ua, { kind: 'skill', skillId: 'cleave', targetUid: ud.uid });
  const hits = st.events.filter(e => e.t === 'damage' && e.uid === ud.uid);
  const first = hits[0] && hits[0].dmg;
  const expected = Math.max(1, Math.round(11 * 2.2 * 1.0 * (1 + 1 * ADV.DATA.CONST.LEVEL_DAMAGE_SCALAR)) - 10);
  eq(first, expected, 'Cleave first hit is still the base formula');
  eq(hits.length, 1, 'Cleave does not get a fighter follow-through (already hits a row)');
  ok(ud.defStripped >= 6, 'fighter flare still strips a little armor');

  const ranger = ADV.Character.base({ name: 'R', stats: { hp: 100, atk: 11, def: 10, spd: 10 } });
  ranger.actives.push({ skillId: 'aimed_shot', level: 1, uses: 0 });
  const foe2 = ADV.Character.base({ name: 'E2', stats: { hp: 400, atk: 10, def: 10, spd: 9 } });
  const st2 = ADV.Combat.create([ranger], [foe2], { rng: new ADV.RNG(4) });
  ADV.Combat.act(st2, st2.units[0], { kind: 'skill', skillId: 'aimed_shot', targetUid: st2.units[1].uid });
  const rHits = st2.events.filter(e => e.t === 'damage' && e.uid === st2.units[1].uid);
  eq(rHits[0].dmg, 23, 'Aimed Shot first hit is still 23');
  eq(rHits.length, 2, 'one follow-up arrow lands after the shot');

  const mage = ADV.Character.base({ name: 'M', stats: { hp: 100, atk: 11, def: 10, spd: 10 } });
  mage.actives.push({ skillId: 'fire_bolt', level: 1, uses: 0 });
  mage.actives.push({ skillId: 'spark', level: 1, uses: 0 });
  const foe3 = ADV.Character.base({ name: 'E3', stats: { hp: 400, atk: 10, def: 10, spd: 9 } });
  const st3 = ADV.Combat.create([mage], [foe3], { rng: new ADV.RNG(5) });
  const um = st3.units[0], ue = st3.units[1];
  ADV.Combat.act(st3, um, { kind: 'skill', skillId: 'fire_bolt', targetUid: ue.uid });
  ok(um.stormMark > 0, 'mage flare marks the next lightning');
  const marked = um.stormMark;
  const before = ue.chp;
  ADV.Combat.act(st3, um, { kind: 'skill', skillId: 'spark', targetUid: ue.uid });
  ok(ue.chp < before, 'spark still deals after the mark');
  const sparkHit = st3.events.filter(e => e.t === 'damage' && e.uid === ue.uid).pop();
  const sparkPlain = Math.max(1, Math.round(11 * 2.7 * 1.0 * (1 + 1 * ADV.DATA.CONST.LEVEL_DAMAGE_SCALAR)) - 10);
  ok(sparkHit && sparkHit.dmg > sparkPlain, 'the spent storm mark made Spark hit harder', sparkHit && sparkHit.dmg);
  ok(marked > 0, 'mark was armed before Spark');
})();

(function () {
  console.log('\n-- Hatred remarks: one each, two turns apart --');
  const p = ADV.Character.base({ name: 'Cap', isPlayer: true, stats: { hp: 200, atk: 10, def: 10, spd: 10 } });
  const a = ADV.Character.base({ name: 'Ava', personalityId: 'F01', stats: { hp: 200, atk: 10, def: 10, spd: 8 } });
  const b = ADV.Character.base({ name: 'Bea', personalityId: 'F02', stats: { hp: 200, atk: 10, def: 10, spd: 7 } });
  const st = ADV.Combat.create([p], [a, b], { rng: new ADV.RNG(9) });
  const ua = st.units.find(u => u.ch === a);
  const ub = st.units.find(u => u.ch === b);
  const first = ADV.Combat.hatredRemarkDue(st, { acting: ua });
  ok(first === ua, 'first remark prefers the acting foe');
  ADV.Combat.noteHatredRemark(st, first.ch);
  eq(st.turnsSinceHatred, 0, 'clock resets when someone speaks');
  ok(!ADV.Combat.hatredRemarkDue(st, { acting: ub }), 'the next speaker is held on the same turn');
  ADV.Combat.advance(st);
  ok(!ADV.Combat.hatredRemarkDue(st, { acting: ub }), 'still held after one turn');
  ADV.Combat.advance(st);
  const second = ADV.Combat.hatredRemarkDue(st, { acting: ub });
  ok(second === ub, 'after two turns the other foe may speak');
  ADV.Combat.noteHatredRemark(st, second.ch);
  ok(!ADV.Combat.hatredRemarkDue(st), 'nobody speaks twice');
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
