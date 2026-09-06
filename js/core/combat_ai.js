// Combat AI (§4 ally autonomy, §3 manifestation conditions, §15a flee rules).
// Split from combat.js: this module decides WHAT a non-player unit does;
// combat.js remains the authority on what actions DO. Everything here goes
// through the same public Combat API the player UI uses — the AI cannot
// reach mechanics the player cannot.
(function () {
'use strict';
const SK = () => ADV.DATA.SKILLS;
const Combat = ADV.Combat;

const livingUnits = Combat.living;
const manifestFor = Combat.manifestFor;
function ev(st, e) { st.events.push(e); return e; }

function planAction(st, u) {
  const act = chooseAction(st, u);
  if (!act) return null;
  const tgt = st.units.find(x => x.uid === act.targetUid);
  const skillName = act.kind === 'flee' ? 'Fleeing' :
    act.kind === 'attack' ? 'Attack' :
    (manifestFor(u, act.skillId) || { data: { name: act.skillId } }).data.name;
  return Object.assign({}, act, {
    label: act.kind === 'flee' ? 'fleeing' :
      (tgt && tgt.side !== u.side ? `${skillName} → ${tgt.ch.name}` :
       tgt && tgt !== u ? `${skillName} → ${tgt.ch.name}` : skillName),
  });
}
Combat.planFor = planAction;

function chooseAction(st, u) {
  const p = u.ch.personality || {};
  const foes = livingUnits(st, u.side === 'a' ? 'b' : 'a').filter(x => !x.untargetable);
  const allies = livingUnits(st, u.side);
  if (!foes.length) return null;
  const edict = (u.ch.actives || []).find(e => e.skillId === 'gods_edict');
  if (edict) {
    const marked = Combat.validTargets(st, u, 'gods_edict', false);
    if (marked.length) {
      const pl = marked.find(x => x.ch.isPlayer);
      return { kind: 'skill', skillId: 'gods_edict', targetUid: (pl || marked[0]).uid };
    }
  }
  // Flee decision: Caution-driven (§15a)
  const hpPct = (u.chp + u.tempHp) / u.maxHp;
  if (!u.ch.isPlayer && !u.ch.isGod && hpPct < 0.25 && !u.ch.isConscript && !u.ch.isUndead && u.ch.status !== 'hero') {
    const fleeDrive = (p.caution || 50) / 100 - (p.pride || 50) / 300 - (p.aggression || 50) / 300;
    if (st.rng.chance(Math.max(0, fleeDrive * 0.8))) return { kind: 'flee' };
  }
  // Build candidate list from actives with valid targets, weighted by conditions (§3 manifestation conditions)
  const candidates = [];
  for (const e of u.ch.actives) {
    const sk = SK()[e.skillId];
    if (!sk || sk.target === 'postVictory') continue;
    const m = manifestFor(u, e.skillId);
    const d = m.data;
    if (d.freeBuff) continue;
    if (d.selfRevive) continue;
    if (d.freeAction && u.freeActionUsed) continue;
    const seal = u.statuses.find(x => x.kind === 'sealed');
    if (seal && (seal.tiers || []).includes(m.tier)) continue;
    let offensiveMode = false;
    let pool = Combat.validTargets(st, u, e.skillId, false);
    if (d.heal) {
      const hurt = allies.filter(a => a.chp / a.maxHp < 0.7).sort((x, y) => x.chp / x.maxHp - y.chp / y.maxHp);
      const downed = st.units.filter(x => x.side === u.side && x.downed && !x.fled && !x.reserved);
      if (d.revive && downed.length && ADV.Combat.canSpendBattleUse(u, e.skillId, d)) {
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: downed[0].uid, weight: 50 });
        continue;
      }
      let reachable = hurt.filter(h => pool.includes(h));
      // NPC healers always look to the player first (request)
      const pl = reachable.find(h => h.ch.isPlayer);
      if (pl) reachable = [pl].concat(reachable.filter(h => h !== pl));
      if (reachable.length) {
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: reachable[0].uid, weight: 6 * (1 - reachable[0].chp / reachable[0].maxHp) + 2 });
      }
      if (d.offensive && (u.ch.usesOffensiveModes || !hurt.length)) {
        const t = st.rng.pick(foes);
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: t.uid, offensiveMode: true, weight: 2.5 });
      }
      continue;
    }
    if (d.guardScope || d.thornPct || d.counterNext) {
      if (!u.statuses.some(s => s.kind === 'guard' || s.kind === 'thorns') && hpPct < 0.85) {
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: u.uid, weight: hpPct < 0.5 ? 4 : 2 });
      }
      continue;
    }
    if (d.evadeNext || d.untargetableRounds) {
      // Smoke Escape manifestation condition: near death (§3) — once, not a stall loop
      if (hpPct < 0.35 && u.evade === 0 && u.untargetable === 0 && !u.marksBy.length) {
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: u.uid, weight: 5 });
      } else if (d.freeAction && !u.freeActionUsed && !u.stealth) {
        const opener = u.ch.actives.some(a => {
          const md = manifestFor(u, a.skillId);
          return md && md.data.openerOrStealth;
        });
        if (opener) candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: u.uid, weight: 4 });
      }
      continue;
    }
    if (d.atkMult || d.auraAtk) {
      if (!u.statuses.some(s => s.kind === 'atkBuff' || s.kind === 'aura')) {
        candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: u.uid, weight: 3 });
      }
      continue;
    }
    if (d.marks != null) {
      if (allies.length > 1 || true) { // Taunt works solo too (§3a)
        const unmarked = foes.filter(f => !f.marksBy.includes(u.uid));
        if (unmarked.length) candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: unmarked[0].uid, weight: allies.length > 1 ? 3.5 : 2 });
      }
      continue;
    }
    if (!pool.length) continue;
    pool = avoidLookism(pool);
    // Nameless mooks never Backstab (campaign §0d makes it a 6.0 any-lane burst;
    // §11a: the first two minutes matter). Bosses and named rogues still do —
    // that is where the player witnesses it.
    if (d.openerOrStealth && u.ch.isMonster && !u.ch.boss) continue;
    // damaging active: prefer wounded targets, back-lane for backstab handled by pool
    const t = pool.sort((x, y) => (x.chp / x.maxHp) - (y.chp / y.maxHp))[0];
    let w = 3 + (d.power || 0) * 0.5 + (p.aggression || 50) / 50;
    if (d.executeBelow && (t.chp / t.maxHp) < d.executeBelow) w += 20;
    candidates.push({ kind: 'skill', skillId: e.skillId, targetUid: t.uid, weight: w, offensiveMode });
  }
  // Basic attack always legal against the front (§15a)
  const meleePool = avoidLookism(Combat.validTargets(st, u, 'basic_attack', false));
  if (meleePool.length) {
    const t = meleePool.sort((x, y) => (x.chp / x.maxHp) - (y.chp / y.maxHp))[0];
    // Taunt marks compel attacking (§3a): "it must attack you"
    candidates.push({ kind: 'attack', targetUid: t.uid, weight: u.marksBy.length ? 10 : 1.5 });
  }
  if (!candidates.length) {
    // nothing legal at all — basic attack unreachable (cover): hold
    return meleePool.length ? { kind: 'attack', targetUid: meleePool[0].uid } : { kind: 'hold' };
  }
  // weighted pick
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = st.rng.float() * total;
  for (const c of candidates) { r -= c.weight; if (r <= 0) return c; }
  return candidates[candidates.length - 1];
}

// Lookism: enemies would rather hit anyone else on the field (request 16)
function avoidLookism(list) {
  const rest = list.filter(x => !x.ch.perks.some(p => p.skillId === 'lookism'));
  return rest.length ? rest : list;
}

Combat.aiTakeTurn = function (st, u) {
  if (Combat.tryNpcSmite && Combat.tryNpcSmite(st, u)) return { ok: true };
  let act = u.planned || chooseAction(st, u);
  u.planned = null;
  if (!act || act.kind === 'hold') { ev(st, { t: 'hold', uid: u.uid }); return { ok: true }; }
  // re-validate target
  if (act.targetUid) {
    const t = st.units.find(x => x.uid === act.targetUid);
    if (!t || t.downed || t.fled || t.reserved) {
      const fresh = chooseAction(st, u);
      if (!fresh || fresh.kind === 'hold') { ev(st, { t: 'hold', uid: u.uid }); return { ok: true }; }
      act = fresh;
    }
  }
  const res = Combat.act(st, u, act);
  if (res && res.refund) {
    const again = chooseAction(st, u);
    if (again && again.kind !== 'hold') return Combat.act(st, u, again);
  }
  return res;
};

})();
