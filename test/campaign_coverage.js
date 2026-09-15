// §14 hard rule: every faction ACTIVE appears in at least one of that
// faction's enemy or mini-boss pools. Also validates every referenced id.
'use strict';
const { load } = require('./harness');
const ADV = load();
let fail = 0;
const S = ADV.DATA.SKILLS;
for (const [fid, f] of Object.entries(ADV.DATA.FACTIONS)) {
  const actives = ADV.DATA.CAMPAIGN_SKILL_IDS.filter(id => S[id].faction === fid && S[id].kind === 'active');
  const pools = new Set();
  for (const e of Object.values(ADV.DATA.CAMPAIGN_ENEMIES)) if (e.faction === fid) e.pool.forEach(x => pools.add(x));
  for (const m of Object.values(ADV.DATA.CAMPAIGN_MINIBOSSES)) if (m.faction === fid) { if (m.signature) pools.add(m.signature); ADV.DATA.CAMPAIGN_ENEMIES[m.base].pool.forEach(x => pools.add(x)); }
  const missing = actives.filter(id => !pools.has(id));
  if (missing.length) { fail++; console.log('FAIL coverage', fid, 'missing:', missing.join(', ')); }
  else console.log('  ok  coverage', fid, actives.length + ' actives all witnessable');
  for (const role of ['recruiter', 'rival', 'boss', 'antagonist']) {
    const c = ADV.DATA.CAMPAIGN_CHARS[f[role]];
    if (!c) { fail++; console.log('FAIL missing char', f[role]); continue; }
    for (const id of (c.perks || []).concat(c.actives || [])) if (!S[id]) { fail++; console.log('FAIL unknown skill on', c.id, id); }
  }
}
for (const e of Object.values(ADV.DATA.CAMPAIGN_ENEMIES)) for (const id of e.pool) if (!S[id]) { fail++; console.log('FAIL unknown pool skill', e.id, id); }
for (const [fid, qs] of Object.entries(ADV.DATA.CAMPAIGN_QUESTS)) for (const q of qs) for (const enc of q.enc) {
  for (const t of (enc.types || []).concat(enc.with || [])) if (!ADV.DATA.CAMPAIGN_ENEMIES[t]) { fail++; console.log('FAIL unknown enemy', fid, q.n, t); }
  if (enc.mini && !ADV.DATA.CAMPAIGN_MINIBOSSES[enc.mini]) { fail++; console.log('FAIL unknown mini', enc.mini); }
}
console.log(fail ? `\n${fail} FAILURES` : '\nCOVERAGE OK');
process.exit(fail ? 1 : 0);
