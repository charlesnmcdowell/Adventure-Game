// Varenholm's Gate: every beat the script references has lines, every reply
// exists, every choice is reachable, tokens resolve, option texts fit the
// modal, gates name real flags / companions, and no speaker repeats a line.
'use strict';
const { load } = require('./harness');
const ADV = load();
const D = ADV.DATA;
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + m + (x !== undefined ? '  [' + x + ']' : '')); } };

const DLG = D.CAMPAIGN3_DIALOGUE.gate, CH = D.CAMPAIGN3_CHOICES, SCRIPT = D.CAMPAIGN3_SCRIPT, QUESTS = D.CAMPAIGN3_QUESTS;
const has = (who, key) => !!(DLG[who] && DLG[who][key] && DLG[who][key].length);
const usedChoices = new Set();
const usedBeats = new Set();
// Triggered by a successful anti-healing action in combat, not a cutscene list.
usedBeats.add('fennick:q4_healing');
for (const [who, route] of Object.entries(D.CAMPAIGN3_COURTSHIP)) {
  ok(route.conversations.length >= 2, `${who}: two personal conversations`);
  for (const key of [...route.conversations.flatMap(c => [c.key, c.reply]), route.interest, route.later, 'q9_romance', 'q9_romance_yes', 'q9_romance_no']) {
    ok(has(who, key), `${who}: private conversation ${key} exists`);
    usedBeats.add(who + ':' + key);
  }
  for (const c of route.conversations) ok(c.text.length <= 96, `${who}: personal reply fits the choice modal`);
}
const speakersOf = {};   // choice id -> speakers whose beat carries it (for $speaker replies)
const companions = Object.values(D.CAMPAIGN_CHARS).filter(c => c.companion).map(c => c.id);

// flags that the data may set (choices + beats) — gates must name one of these
const settable = new Set(['lean_gauntlet', 'dukeDead', 'bothDukesDead']);
for (const c of Object.values(CH)) for (const o of c.options) for (const k of Object.keys(o.set || {})) settable.add(k);
for (const n of Object.keys(SCRIPT)) for (const list of [SCRIPT[n].departure, SCRIPT[n].closing, SCRIPT[n].arrival, ...Object.values(SCRIPT[n].openers || {})]) for (const b of list || []) for (const k of Object.keys(b.set || {})) settable.add(k);

function checkWhen(when, where) {
  if (!when) return;
  for (const k of ['flag', 'not']) if (when[k]) ok(settable.has(when[k]), `${where}: gate names a flag something sets (${when[k]})`);
  for (const k of ['company', 'noCompany', 'recruited', 'notRecruited', 'alive', 'dead']) if (when[k]) ok(companions.includes(when[k]), `${where}: gate names a companion (${when[k]})`);
  if (when.affMin) ok(companions.includes(when.affMin[0]), `${where}: affMin names a companion`);
  if (when.companyAll) ok(when.companyAll.every(id => companions.includes(id)), `${where}: companyAll names companions`);
  if (when.any) when.any.forEach((w, i) => checkWhen(w, where + '.any' + i));
}
function checkBeat(b, where) {
  if (b.dynamic) {
    ok(b.dynamic === 'romance', `${where}: dynamic choice type is supported`);
    ok(!b.who && !b.key, `${where}: dynamic choices do not preselect a speaker or recording`);
    checkWhen(b.when, where);
    return;
  }
  const who = b.who;
  ok(!!D.CAMPAIGN_CHARS[who], `${where}: speaker ${who} exists`);
  const speakers = b.anyOf ? b.anyOf : [who];
  if (b.anyOf) ok(b.anyOf.every(id => companions.includes(id)), `${where}: anyOf names companions only`);
  const withLines = speakers.filter(id => has(id, b.key));
  const silentChoice = Array.isArray(b.lines) && b.lines.length === 0 && b.choice && b.promptText;
  ok(withLines.length > 0 || silentChoice, `${where}: ${speakers.join('/')} has lines or an explicit silent choice for ${b.key}`);
  if (b.anyOf) ok(withLines.length === speakers.length, `${where}: every anyOf speaker has lines for ${b.key}`, speakers.filter(id => !has(id, b.key)).join(','));
  for (const id of withLines) usedBeats.add(id + ':' + b.key);
  if (b.choice) { ok(!!CH[b.choice], `${where}: choice ${b.choice} exists`); usedChoices.add(b.choice); speakersOf[b.choice] = (speakersOf[b.choice] || []).concat(speakers); }
  for (const k of ['recruit', 'dismiss', 'gone', 'kill']) for (const id of b[k] || []) ok(companions.includes(id), `${where}: ${k} names a companion (${id})`);
  checkWhen(b.when, where);
}
function checkOption(o, cid) {
  const where = `choice ${cid}/${o.id}`;
  ok(typeof o.text === 'string' && o.text.length <= 96, `${where}: option text fits the modal`, o.text && o.text.length);
  ok(!/\{/.test(o.text), `${where}: the player's line carries no tokens`);
  if (o.reply) {
    const whos = Array.isArray(o.reply.who) ? o.reply.who : o.reply.who === '$speaker' ? (speakersOf[cid] || []) : [o.reply.who];
    ok(whos.length && whos.every(w => has(w, o.reply.key)), `${where}: reply ${whos.join('/')}:${o.reply.key} exists`, whos.filter(w => !has(w, o.reply.key)).join(','));
    for (const w of whos) usedBeats.add(w + ':' + o.reply.key);
    if (CH[o.reply.key]) { usedChoices.add(o.reply.key); speakersOf[o.reply.key] = (speakersOf[o.reply.key] || []).concat(whos); }
  }
  for (const k of ['recruit', 'dismiss', 'gone', 'kill']) for (const id of o[k] || []) ok(companions.includes(id), `${where}: ${k} names a companion (${id})`);
  for (const id of Object.keys(o.aff || {})) ok(companions.includes(id), `${where}: aff names a companion (${id})`);
  if (o.ending) ok(['kill', 'gauntlet', 'usurp', 'walk'].includes(o.ending), `${where}: ending is a known resolution`);
  checkWhen(o.when, where);
}

// script coverage
for (const q of QUESTS) {
  const s = SCRIPT[q.n];
  ok(!!s, `Q${q.n} has a script`);
  if (!s) continue;
  (s.departure || []).forEach((b, i) => checkBeat(b, `Q${q.n} departure[${i}]`));
  for (const [idx, list] of Object.entries(s.openers || {})) {
    ok(+idx < q.enc.length, `Q${q.n} opener index ${idx} is inside the encounter list`);
    list.forEach((b, i) => checkBeat(b, `Q${q.n} opener ${idx}[${i}]`));
  }
  (s.closing || []).forEach((b, i) => checkBeat(b, `Q${q.n} closing[${i}]`));
  (s.arrival || []).forEach((b, i) => checkBeat(b, `Q${q.n} arrival[${i}]`));
  // every quest but the last has an arrival beat OR the next quest's departure carries the story
  ok(q.n === 14 || (s.arrival || []).length || (SCRIPT[q.n + 1] && (SCRIPT[q.n + 1].departure || []).length), `Q${q.n}: the story continues after the debrief`);
  for (const e of q.enc) {
    for (const t of (e.types || []).concat(e.with || [])) ok(!!(D.CAMPAIGN_ENEMIES[t] || D.CAMPAIGN_CHARS[t]), `Q${q.n}: enemy ${t} exists`);
    if (e.mini) ok(!!D.CAMPAIGN_MINIBOSSES[e.mini], `Q${q.n}: mini ${e.mini} exists`);
    if (e.boss) ok(!!D.CAMPAIGN_CHARS[e.boss], `Q${q.n}: boss ${e.boss} exists`);
    ok(!!e.label, `Q${q.n}: encounter has a label`);
    for (const v of Object.values(e.variants || {})) { for (const t of (v.types || []).concat(v.with || [])) ok(!!(D.CAMPAIGN_ENEMIES[t] || D.CAMPAIGN_CHARS[t]), `Q${q.n}: variant enemy ${t} exists`); }
  }
}
for (const [cid, c] of Object.entries(CH)) {
  ok(c.options.length >= 2 && c.options.length <= 4, `choice ${cid}: two to four options`, c.options.length);
  ok(new Set(c.options.map(o => o.id)).size === c.options.length, `choice ${cid}: option ids unique`);
  ok(c.options.some(o => !o.when), `choice ${cid}: at least one ungated option`);
  c.options.forEach(o => checkOption(o, cid));
}
for (const cid of Object.keys(CH)) ok(usedChoices.has(cid) || cid === 'romance', `choice ${cid} is reachable from a beat or a reply`);
// the ending choice covers every resolution
ok(['kill', 'gauntlet', 'usurp', 'walk'].every(e => CH.q14_resolution.options.some(o => o.ending === e)), 'every ending resolution is offered somewhere');

// lines: tokens, duplicates, cues
const seen = new Map();
let lineCount = 0;
for (const [who, keys] of Object.entries(DLG)) {
  ok(!!D.CAMPAIGN_CHARS[who], `speaker ${who} in dialogue exists in the cast`);
  for (const [key, lines] of Object.entries(keys)) {
    for (const l of lines) {
      lineCount++;
      ok(!/\{(?!target\}|they\}|them\}|their\})/.test(l.t), `${who}:${key}: only known tokens`, l.t);
      ok(l.t.replace(/\[[^\]]+\]/g, '').trim().length > 0, `${who}:${key}: line has words after the cue`);
      const norm = l.t.replace(/\[[^\]]+\]\s*/g, '').toLowerCase();
      const k = who + '|' + norm;
      ok(!seen.has(k), `${who}:${key}: no duplicate line (also at ${seen.get(k)})`);
      seen.set(k, key);
    }
    if (key !== 'banter' && !/_none$/.test(key)) ok(usedBeats.has(who + ':' + key) || /^q9_romance/.test(key), `${who}:${key} is used by a beat, a reply or a dynamic prompt`);
  }
}
for (const id of companions) ok(has(id, 'banter') && DLG[id].banter.length >= 3, `${id} has three banter lines`);
for (const id of companions) { const c = D.CAMPAIGN_CHARS[id]; if (c.romance && !c.romanceDeferred) ok(has(id, 'q9_romance') && has(id, 'q9_romance_yes') && has(id, 'q9_romance_no'), `${id}: romance offer, yes and no`); ok(!!D.CAMPAIGN3_EPILOGUE.companion[id], `${id}: has an epilogue entry`); }
for (const id of Object.keys(D.CAMPAIGN3_EPILOGUE.romance)) ok(D.CAMPAIGN_CHARS[id] && D.CAMPAIGN_CHARS[id].romance, `epilogue romance ${id} is a romanceable companion`);
for (const e of Object.keys(D.CAMPAIGN3_ENDINGS)) ok(!!D.CAMPAIGN3_EPILOGUE.ending[e], `ending ${e} has an epilogue paragraph`);
for (const c of Object.values(D.CAMPAIGN_CHARS)) if (c.campaign3) ok(!!c.desc, `${c.id} has a description for the voice script`);

const mineGame = { meta: { c3: ADV.Campaign3.fresh() }, world: { characters: [] } };
ADV.Campaign3.recruit(mineGame, 'wren_ward');
ADV.Campaign3.recruit(mineGame, 'bramm');
ADV.Campaign3.dismiss(mineGame, 'wren_ward');
const mineOpen = ADV.Campaign3.prepareBeats(mineGame, SCRIPT[4].openers[0]);
ok(mineOpen.some(b => b.key === 'q4_down' && b.who === 'wren_ward'), 'Q4 mine descent still plays when Hiwot is recruited but benched');

console.log(`${lineCount} lines · ${Object.keys(CH).length} choices`);
console.log(fail ? `\n${fail} FAILURES (${pass} ok)` : `\nLINES OK (${pass} checks)`);
process.exit(fail ? 1 : 0);
