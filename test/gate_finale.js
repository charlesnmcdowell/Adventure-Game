'use strict';
const assert = require('node:assert/strict'), { load, memBackend } = require('./harness');
const A = load(), C = A.Campaign3, F = A.GateFinale, W = 'wren_ward';
function fresh(n = 14) {
 A.Save.setBackend(memBackend());
 const g = A.Game.newGame({ seed: 1514, name: 'Ward', sex: 'f' });
 g.player.inventory.gold = 50000; C.debugJump(g, n);
 assert.ok(A.Game.startQuest(g, C.buildQuest(g, n), {}).ok);
 return g;
}
function won(g) {
 A.Game.currentEncounter(g);
 const st = A.Game.startCombat(g, false);
 for (const u of st.units.filter(u => u.side === 'b')) { u.downed = true; u.chp = 0; }
 st.over = true; st.winner = 'a';
 const r = A.Game.finishCombat(g); assert.ok(r.won);
}
for (const mode of ['company', 'inn', 'dead', 'absent']) for (const ending of ['restore', 'ascend']) {
 const g = fresh(), s = C.state(g);
 if (mode === 'inn') C.dismiss(g, W);
 if (mode === 'dead') C.kill(g, W);
 if (mode === 'absent') { C.dismiss(g, W); s.recruited = s.recruited.filter(id => id !== W); }
 g.quest.encIdx = 2;
 const open = A.Game.currentEncounter(g);
 assert.ok(open.openerBeats.some(b => b.key === 'q14_final_open'));
 assert.equal(F.captureSister(g).state, mode);
 assert.equal(C.resolveEnding(g, ending), null, 'no unearned ending');
 won(g);
 assert.equal(g.quest.encIdx, 3); assert.ok(!g.quest.readyToComplete, 'mortal win is not quest completion');
 const realm = A.Game.currentEncounter(g);
 assert.ok(realm.enemies.some(ch => ch.gateAscendant));
 assert.ok(realm.verbs.every(v => ['fight', 'flee'].includes(v.verb)));
 assert.ok(!A.Game.partyRoster(g).some(ch => ch.campaignId === W), 'soul cannot fight beside player');
 const death = realm.openerBeats.find(b => b.finaleEvent === 'takeSoul');
 assert.ok(death); assert.equal(!!death.death, mode !== 'dead');
 C.applyBeat(g, death); C.applyBeat(g, death);
 assert.equal(s.dead.filter(id => id === W).length, 1, 'idempotent sacrifice');
 assert.ok(F.state(g).soulTaken);
 won(g);
 assert.ok(F.state(g).realmWon && g.quest.readyToComplete);
 assert.equal(g.quest.closingBeats[0].choice, 'q14_final_resolution');
 const opt = C.options(g, 'q14_final_resolution').find(o => o.id === ending);
 C.applyOption(g, 'q14_final_resolution', opt);
 assert.equal(s.ending, ending === 'restore' ? 'restored' : 'ascended');
 assert.equal(C.isAlive(g, W), ending === 'restore');
 assert.equal(C.inCompany(g, W), ending === 'restore' && mode === 'company');
 const first = s.ending; C.resolveEnding(g, ending === 'restore' ? 'ascend' : 'restore');
 assert.equal(s.ending, first, 'ending cannot be switched after committing');
 A.Game.completeQuest(g); assert.equal(s.stage, 14); assert.ok(g.player.ownedSets.includes('wardens_gear'));
 A.Save.saveGame(g); const loaded = A.Game.load();
 assert.equal(C.state(loaded).ending, first); assert.equal(F.state(loaded).soulTaken, true);
}
{
 const g = fresh(), s = C.state(g); g.quest.encIdx = 3;
 F.takeSoul(g); g.quest.failed = g.quest.fled = g.quest.over = true;
 A.Game.completeQuest(g);
 assert.ok(A.Game.startQuest(g, C.buildQuest(g, 14), {}).ok);
 assert.equal(g.quest.encIdx, 3);
 assert.ok(!A.Game.currentEncounter(g).openerBeats.some(b => b.finaleEvent === 'takeSoul'));
 assert.ok(s.dead.includes(W));
}
for (const index of [0, 2, 3]) {
 const g = fresh(); g.quest.quest.encounters.pop(); g.quest.quest.cEnc.pop();
 delete g.quest.quest.finaleVersion; g.quest.encIdx = index;
 if (index === 3) { g.quest.readyToComplete = true; g.quest.__c3closed = true; g.quest.closingBeats = [{ key: 'q14_beaten' }]; }
 A.Game.currentEncounter(g);
 assert.equal(g.quest.quest.encounters.length, 4); assert.equal(g.quest.encIdx, index);
 assert.ok(!g.quest.readyToComplete); assert.ok(!g.quest.closingBeats?.some(b => b.key === 'q14_beaten'));
}
for (const ending of ['hero', 'monster', 'mercy', 'usurper', 'ascetic']) {
 const g = fresh(); C.state(g).ending = ending;
 g.quest.quest.encounters.pop(); g.quest.quest.cEnc.pop(); delete g.quest.quest.finaleVersion;
 F.upgradeQuest(g); assert.equal(g.quest.quest.encounters.length, 3); assert.equal(C.state(g).ending, ending);
}
{
 const g = fresh(13); g.quest.encIdx = 1;
 A.Game.currentEncounter(g);
 C.applyOption(g, 'q13_amara_gate', C.options(g, 'q13_amara_gate').find(o => o.id === 'fight'));
 assert.ok(!C.flag(g, 'amaraDead') && C.isAlive(g, 'amara'), 'choosing fight is not a kill');
 C.bypassEncounter(g);
 assert.ok(!C.flag(g, 'amaraDead')); assert.equal(F.state(g).outcomes['13:1'].mode, 'bypass');
 assert.ok(F.history(g).some(b => b.key === 'q14_final_amara_spared'));
}
{
 const g = fresh(13); g.quest.encIdx = 1; A.Game.currentEncounter(g);
 C.applyOption(g, 'q13_amara_gate', C.options(g, 'q13_amara_gate').find(o => o.id === 'fight'));
 won(g); assert.ok(C.flag(g, 'amaraDead')); assert.ok(!C.isAlive(g, 'amara'));
 assert.ok(F.history(g).some(b => b.key === 'q14_final_amara_dead'));
}
{
 const g = fresh(6); g.quest.encIdx = 1; won(g);
 assert.equal(F.state(g).outcomes['6:1'].actors.thornwise, 'withdrew');
 assert.ok(F.history(g).some(b => b.key === 'q14_final_grove_retreat'));
}
{
 const g = fresh(); C.setFlag(g, 'druidsFought', true); C.setFlag(g, 'amaraDead', true);
 const h = F.history(g);
 assert.ok(!h.some(b => /amara_dead|grove_retreat|accuse/.test(b.key)), 'unknown legacy outcomes never invent kills');
 for (const killed of [true, false]) {
  C.setFlag(g, 'leadersKilled', killed); C.setFlag(g, 'leadersSpared', !killed);
  const b = C.replyBeat({who:'korvath',key:'q14_final_trap'}, 'korvath', g);
  assert.equal(b.key, 'q14_final_trap_' + (killed ? 'killed' : 'spared'));
 }
 const main = C.options(g, 'q14_final_questions'); assert.ok(main.length <= 4);
 const opt = main.find(o => o.id === 'plans'); C.applyOption(g, 'q14_final_questions', opt);
 const b = C.replyBeat(opt.reply, 'korvath', g, opt, 'q14_final_questions');
 assert.equal(b.choice, 'q14_final_plans'); assert.ok(C.options(g, b.choice).length <= 4);
}
for(const [key,fate] of [['kill','dead'],['arrest','arrested'],['deal','bargain']]) {
 const g=fresh(9);
 C.setFlag(g,'lysandraDead',true);
 assert.ok(!F.history(g).some(b=>/folake/.test(b.key)),'an unplayed hostile option is not a resolved fate');
 C.applyBeat(g,{who:'lysandra',key:'q9_lysandra_'+key});
 assert.ok(F.history(g).some(b=>b.key==='q14_final_folake_'+fate));
}
{
 const g=fresh(); F.takeSoul(g); F.state(g).realmWon=true;
 g.quest.encIdx=4; g.quest.readyToComplete=true; g.quest.__c3closed=true; g.quest.closingBeats=null;
 C.queueClosing(g); assert.equal(g.quest.closingBeats[0].choice,'q14_final_resolution','reload recovers an interrupted decision');
}
console.log('Gate finale: resolved history, both boss phases/endings, four Hiwot states, persistence, checkpoint and legacy migration passed.');
