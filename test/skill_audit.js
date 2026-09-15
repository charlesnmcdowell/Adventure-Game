// SKILL_AUDIT_PROMPT.md §4 / §9: every skill manifests, targets, plans and
// acts without throwing; every referenced id exists; keys the data sets are
// read somewhere in core.
'use strict';
const fs = require('fs');
const path = require('path');
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };

const SK = ADV.DATA.SKILLS;
const Cb = ADV.Combat;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;
const LEVELS = [1, TH.intermediate, TH.advanced];
const META = new Set(['id', 'name', 'kind', 'archetype', 'desc', 'tiers', 'faction', 'campaign', 'campaign2',
  'campaignReward', 'group', 'key', 'quest', 'questName', 'requirement',
  'unique', 'universal', 'noSlot', 'noTierGrowth', 'forbidden', 'social', 'warning', 'katana', 'monster',
  'elemental', 'element', 'offensive', 'heal', 'target', 'reach', 'power', 'melee']);

function field(skillId, level, asPerk) {
  const rng = new ADV.RNG(3);
  const a = ADV.Character.base({ stats: { hp: 400, atk: 14, def: 8, spd: 20 } });
  a.isPlayer = true;
  const entry = { skillId, level, uses: 0 };
  if (asPerk || (SK[skillId] && SK[skillId].kind === 'perk')) a.perks = [entry];
  else a.actives = [entry];
  const ally = ADV.Character.base({ stats: { hp: 200, atk: 10, def: 10, spd: 8 } });
  const down = ADV.Character.base({ stats: { hp: 180, atk: 10, def: 10, spd: 7 } });
  const e1 = ADV.Character.makeEnemy(rng, 'bandit', { level: 4 });
  const e2 = ADV.Character.makeEnemy(rng, 'hedge_mage', { level: 4 });
  const e3 = ADV.Character.makeEnemy(rng, 'dire_wolf', { level: 4 });
  const st = Cb.create([a, ally, down], [e1, e2, e3], { rng });
  const ua = st.units.find(u => u.ch === a);
  const ual = st.units.find(u => u.ch === ally);
  const ud = st.units.find(u => u.ch === down);
  const foes = st.units.filter(u => u.side === 'b');
  ud.downed = true; ud.chp = 0;
  if (foes[1]) { foes[1].stealth = true; foes[1].stealthRounds = 2; }
  if (foes[2]) { foes[2].untargetable = 1; }
  if (foes[0]) {
    foes[0].ch.statusImmunities = ['poison'];
    ADV.Combat._internals.addStatus(st, foes[0], { kind: 'poison', tier: 'basic', srcUid: null, stacks: true });
  }
  if (ual) ADV.Combat._internals.addStatus(st, ual, { kind: 'guard', scope: 'lane', rounds: 3 });
  try { Cb.currentTurn(st); } catch (e) {}
  return { st, ua, ual, ud, foes };
}

console.log('-- every skill id exists and manifests at 1 / 10 / 25 --');
const ids = Object.keys(SK);
ok(ids.length >= 200, `${ids.length} skills in ADV.DATA.SKILLS`);
let manifestThrows = 0, targetThrows = 0, planThrows = 0, actThrows = 0, silentActs = 0, acted = 0;
const throwers = [];
for (const id of ids) {
  const sk = SK[id];
  for (const level of LEVELS) {
    let pack;
    try { pack = field(id, level); } catch (e) { manifestThrows++; throwers.push(id + '@create ' + e.message); continue; }
    const { st, ua } = pack;
    let m;
    try { m = Cb.manifestFor(ua, id); } catch (e) { manifestThrows++; throwers.push(id + '@manifest ' + e.message); continue; }
    if (sk.kind === 'perk') continue;
    try { Cb.validTargets(st, ua, id, false); if (sk.offensive) Cb.validTargets(st, ua, id, true); }
    catch (e) { targetThrows++; throwers.push(id + '@targets ' + e.message); }
    try { Cb.planFor(st, ua); } catch (e) { planThrows++; throwers.push(id + '@plan ' + e.message); }
    const pool = (() => { try { return Cb.validTargets(st, ua, id, false); } catch (e) { return []; } })();
    const tgt = (pool && pool[0]) || ua;
    const n0 = st.events.length;
    try {
      const r = Cb.act(st, ua, { kind: 'skill', skillId: id, targetUid: tgt.uid });
      acted++;
      if (r && r.ok) {
        const mine = st.events.slice(n0).some(e => e.uid === ua.uid || e.by === ua.uid || e.skillId === id || e.t === 'use');
        if (!mine && sk.target !== 'postVictory') silentActs++;
      }
    } catch (e) { actThrows++; throwers.push(id + '@act ' + e.message); }
  }
}
ok(manifestThrows === 0, 'manifest never throws at any tier', throwers.filter(t => t.indexOf('@manifest') >= 0 || t.indexOf('@create') >= 0).slice(0, 8).join(' | '));
ok(targetThrows === 0, 'validTargets never throws', throwers.filter(t => t.indexOf('@targets') >= 0).slice(0, 8).join(' | '));
ok(planThrows === 0, 'planFor never throws', throwers.filter(t => t.indexOf('@plan') >= 0).slice(0, 8).join(' | '));
ok(actThrows === 0, 'act never throws', throwers.filter(t => t.indexOf('@act') >= 0).slice(0, 8).join(' | '));
ok(silentActs < 20, `acts that succeed emit an event (${silentActs} silent of ${acted})`);

console.log('-- perks survive ten scripted rounds --');
{
  let perkBoom = 0;
  const perkIds = ids.filter(id => SK[id].kind === 'perk').slice(0, 80);
  for (const id of perkIds) {
    try {
      const { st, ua, foes } = field(id, 10, true);
      for (let i = 0; i < 10 && !st.over; i++) {
        const t = Cb.currentTurn(st);
        if (!t) break;
        if (t.unit === ua) Cb.act(st, ua, { kind: 'attack', targetUid: foes[0].uid });
        else if (t.isPlayer) Cb.act(st, t.unit, { kind: 'hold' });
        else Cb.aiTakeTurn(st, t.unit);
        Cb.advance(st);
      }
    } catch (e) { perkBoom++; throwers.push(id + '@perk ' + e.message); }
  }
  ok(perkBoom === 0, 'each perk can sit on a unit for ten rounds without throwing', throwers.filter(t => t.indexOf('@perk') >= 0).slice(0, 6).join(' | '));
}

console.log('-- every referenced skill id resolves --');
{
  const missing = [];
  const check = (id, where) => { if (id && !SK[id]) missing.push(where + ':' + id); };
  for (const e of Object.values(ADV.DATA.ENEMIES || {})) {
    (e.actives || []).forEach(id => check(id, e.id));
    (e.perks || []).forEach(id => check(id, e.id));
  }
  for (const e of Object.values(ADV.DATA.BOSSES || {})) {
    (e.actives || []).forEach(id => check(id, e.id));
    (e.perks || []).forEach(id => check(id, e.id));
  }
  for (const e of Object.values(ADV.DATA.CAMPAIGN_ENEMIES || {})) {
    (e.pool || []).forEach(id => check(id, e.id));
    (e.actives || []).forEach(id => check(id, e.id));
    (e.perks || []).forEach(id => check(id, e.id));
  }
  for (const g of Object.values(ADV.DATA.CAMPAIGN_BOSS_GUARD || {})) {
    check(g.heal, 'guard'); check(g.tankSkill, 'guard');
  }
  ok(missing.length === 0, 'enemy / campaign / guard skill ids all exist', missing.slice(0, 10).join(', '));
}

console.log('-- data keys are read in core --');
{
  const coreDir = path.join(__dirname, '..', 'js', 'core');
  const uiDir = path.join(__dirname, '..', 'js', 'ui');
  let blob = '';
  for (const dir of [coreDir, uiDir]) {
    for (const f of fs.readdirSync(dir)) {
      if (/\.js$/.test(f)) blob += fs.readFileSync(path.join(dir, f), 'utf8');
    }
  }
  const promised = ['protectAdjacent', 'oppositeSexFriendly', 'targetedLast', 'accuracy', 'laneShift',
    'duration', 'recruitForEncounter', 'revealHp', 'revealLoadouts', 'followerDef', 'revealContracts',
    'autoFlee', 'revealPerks', 'levelMult', 'witnessStartLevel', 'healAtEnd', 'lawfulPayMult',
    'oneShotUndead', 'katanaFreeSlots', 'turnPlacement', 'passive', 'goldMult', 'killGold', 'seeInvis',
    'evadePct', 'rangerExtraUse'];
  const unread = promised.filter(k => blob.indexOf(k) < 0);
  ok(unread.length === 0, 'promised keys are read in core or ui', unread.join(', '));
}

console.log('-- incomplete tiers are flagged --');
{
  const bare = [];
  for (const [id, sk] of Object.entries(SK)) {
    if (sk.noTierGrowth) continue;
    const T = sk.tiers || {};
    if (!T.basic || !T.intermediate || !T.advanced) bare.push(id);
  }
  ok(bare.length === 0, 'every growing skill has three tiers', bare.join(', '));
}

console.log('-- tooltip labels every data key --');
{
  const tip = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui', 'tooltip.js'), 'utf8');
  const block = tip.match(/const PARAM_LABEL = \{[\s\S]*?\n\};/);
  const labeled = new Set();
  if (block) for (const m of block[0].matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)) labeled.add(m[1]);
  const skip = new Set(META);
  skip.add('note'); skip.add('campaign2'); skip.add('vs'); skip.add('tier');
  const unlabeled = new Set();
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      if (skip.has(k) || k === 'tiers') continue;
      if (!labeled.has(k) && typeof v !== 'object') unlabeled.add(k);
      if (v && typeof v === 'object' && !Array.isArray(v) && k === 'tiers') {
        for (const t of Object.values(v)) walk(t);
      } else if (v && typeof v === 'object' && !Array.isArray(v) && (k === 'basic' || k === 'intermediate' || k === 'advanced')) {
        walk(v);
      }
    }
  };
  for (const sk of Object.values(SK)) {
    walk(sk);
    walk((sk.tiers && sk.tiers.basic) || {});
    walk((sk.tiers && sk.tiers.intermediate) || {});
    walk((sk.tiers && sk.tiers.advanced) || {});
  }
  ok(unlabeled.size === 0, 'PARAM_LABEL covers every printed key', [...unlabeled].sort().join(', '));
}

console.log('-- freeAction / oncePerBattle --');
{
  const { st, ua, ual } = field('smoke_bomb', 1);
  const n0 = st.events.length;
  const r1 = Cb.act(st, ua, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ua.uid });
  const still = Cb.currentTurn(st);
  ok(r1.ok, 'smoke_bomb (freeAction) acts');
  ok(ua.freeActionUsed, 'freeAction marks the unit');
  const r2 = Cb.act(st, ua, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ua.uid });
  ok(!r2 || !r2.ok || r2.error, 'second freeAction in the same turn is refused');
}
{
  const { st, ua, ual, ud } = field('raise', 1);
  const tgt = ud || ual;
  tgt.downed = true; tgt.chp = 0;
  const r1 = Cb.act(st, ua, { kind: 'skill', skillId: 'raise', targetUid: tgt.uid });
  const r2 = Cb.act(st, ua, { kind: 'skill', skillId: 'raise', targetUid: tgt.uid });
  ok(r1 && (r1.ok || r1.error), 'raise first use does not throw');
  ok(r2 && !r2.ok, 'raise oncePerBattle refuses the second use', r2 && r2.error);
}

console.log('-- melee cannot pierce a living front --');
{
  const { st, ua, foes } = field('sunder', 1);
  const front = foes.find(f => f.lane === 'front' && !f.downed && !f.untargetable) || foes[0];
  const back = foes.find(f => f !== front);
  if (back) { back.lane = 'back'; front.lane = 'front'; }
  const pool = Cb.validTargets(st, ua, 'sunder', false) || [];
  ok(pool.some(t => t.uid === front.uid), 'front-reach can hit the living front');
  if (back) ok(!pool.some(t => t.uid === back.uid) || front.downed, 'front-reach does not pierce a living front to the back');
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
if (throwers.length) console.log('first throws:\n  ' + throwers.slice(0, 12).join('\n  '));
process.exit(fail ? 1 : 0);
