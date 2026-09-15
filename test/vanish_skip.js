// Cobb Vanish (and any stealth / untargetable window): the player cannot
// swing, so the turn skips until someone can be hit again.
'use strict';
const { load } = require('./harness.js');
load();
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('FAIL  ' + m + (extra ? '  [' + extra + ']' : '')); } };
const Cb = ADV.Combat;
const TH = ADV.DATA.CONST.TIER_THRESHOLDS;

function mk(o) {
  return ADV.Character.base(Object.assign({ stats: { hp: 200, atk: 14, def: 6, spd: 12 } }, o));
}
function give(ch, id, level) {
  ch.actives.push({ skillId: id, level: level || 1, uses: 0 });
}
function field() {
  const kia = mk({ name: 'Kia' });
  kia.isPlayer = true;
  give(kia, 'dual_swords', TH.advanced);
  give(kia, 'mend', 1);
  ADV.Combat.setSkillAuto(kia, 'dual_swords', true, false);
  const cobb = mk({ name: 'Cobb', stats: { hp: 180, atk: 12, def: 4, spd: 8 } });
  give(cobb, 'smoke_bomb', TH.intermediate);
  give(cobb, 'backstab', TH.intermediate);
  give(cobb, 'venom_fang', TH.intermediate);
  const st = Cb.create([kia], [cobb], { rng: new ADV.RNG(4) });
  const ua = st.units.find(u => u.ch === kia);
  const ue = st.units.find(u => u.ch === cobb);
  ue.evade = 0;
  Cb.currentTurn(st);
  return { st, ua, ue };
}
function nextTurn(st) {
  for (let i = 0; i < 30; i++) {
    const t = Cb.currentTurn(st);
    if (!t || st.over) return t;
    return t;
  }
  return null;
}

console.log('\n-- Vanish empties the swing pool but leaves self skills --');
{
  const { st, ua, ue } = field();
  const r = Cb.act(st, ue, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ue.uid });
  ok(r && r.ok, 'Cobb can Vanish');
  ok(ue.untargetable === 1 && ue.stealth, 'Vanish hides for one round (' + ue.untargetable + '/' + ue.stealthRounds + ')');
  ok(!Cb.hasOffensiveTarget(st, ua), 'player has no offensive target while Cobb is vanished');
  ok(Cb.hasLegalCombatAction(st, ua), 'Mend is still legal — that used to hide Wait and stall auto');
  ok(!Cb.autoReadyAction(st, ua), 'auto rotation (Blade Storm) cannot fire at a vanished foe');
  const swing = Cb.act(st, ua, { kind: 'attack', targetUid: ue.uid });
  ok(swing && !swing.ok, 'a named swing at vanished Cobb is rejected');
}

console.log('\n-- Skip holds until Cobb can be hit --');
{
  const { st, ua, ue } = field();
  Cb.act(st, ue, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ue.uid });
  let holds = 0;
  let hit = false;
  for (let i = 0; i < 24 && !st.over; i++) {
    const t = nextTurn(st);
    if (!t) break;
    if (t.unit === ua) {
      if (!Cb.hasOffensiveTarget(st, ua)) {
        Cb.act(st, ua, { kind: 'hold' });
        Cb.advance(st);
        holds++;
        continue;
      }
      ok(Cb.hasOffensiveTarget(st, ua), 'Cobb is targetable on the second round');
      ok(ue.evade >= 1 && !ue.untargetable, 'Vanish left 1 free evade instead of another hide');
      const n0 = st.events.length;
      const r = Cb.act(st, ua, { kind: 'attack', targetUid: ue.uid });
      ok(r && r.ok, 'Attack is legal once Vanish drops');
      ok(st.events.slice(n0).some(e => e.t === 'evade' && e.uid === ue.uid), 'the first swing is evaded');
      hit = !!(r && r.ok);
      break;
    }
    Cb.act(st, t.unit, { kind: 'hold' });
    Cb.advance(st);
  }
  ok(holds === 1, 'player skipped exactly one vanished turn (' + holds + ')');
  ok(hit, 'fight resumes after that one skip');
}

console.log('\n-- Vanish does not stack; stealth never sticks --');
{
  const longU = [];
  for (const [id, sk] of Object.entries(ADV.DATA.SKILLS)) {
    const rows = [sk].concat(sk.tiers ? Object.values(sk.tiers) : []);
    for (const row of rows) {
      if (row.untargetableRounds > Cb.VANISH_CAP) longU.push(id + '=' + row.untargetableRounds);
      if ((row.stealthRounds || row.allyStealth || row.reviveStealthRounds) > Cb.HIDE_CAP) longU.push(id + ' stealth');
    }
  }
  ok(!longU.length, 'no authored Vanish longer than 1 round', longU.join(', '));

  const { st, ua, ue } = field();
  Cb.applyUntargetable(ue);
  Cb.applyUntargetable(ue);
  Cb.applyUntargetable(ue);
  ok(ue.untargetable === 1, 'repeated Vanish still lasts one round');

  const endRound = () => { st.turnIdx = st.turnQueue.length; Cb.currentTurn(st); };
  endRound();
  ok(!ue.untargetable && Cb.hasOffensiveTarget(st, ua), 'next round they can be hit');
  ok(ue.evade >= 1, 'that round they have 1 free evade');

  ue.stealth = true;
  ue.stealthRounds = 0;
  endRound();
  ok(!ue.stealth && ue.stealthRounds === 0, 'stealth with no timer dies at the next round tick');

  give(ua.ch, 'smoke_bomb', TH.advanced);
  const r = Cb.act(st, ua, { kind: 'skill', skillId: 'smoke_bomb', targetUid: ua.uid });
  ok(r && r.ok, 'Shadowstep still fires');
  ok(ua.untargetable === 1, 'Shadowstep is also one vanished round');
}

if (fail) { console.log('\n' + fail + ' FAILED, ' + pass + ' passed'); process.exit(1); }
console.log('\n' + pass + ' passed');
