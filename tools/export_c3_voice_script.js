// Writes VARENHOLMS_GATE_VOICE_SCRIPT.md — the story campaign as a screenplay
// in the order the player meets it (quest by quest, scene by scene, with the
// captions, the player's pick-a-line choices and every reply), followed by a
// casting appendix (one section per character: who they are, where they are
// from, how they speak, every clip) — and tools/c3_voice_lines.json (one row
// per clip: path, speaker, spoken text) so the ElevenLabs pass can be run
// later without re-parsing the game.
//
//   node tools/export_c3_voice_script.js
'use strict';
const fs = require('fs'), path = require('path');
const { load } = require('../test/harness');
const A = load();
const D = A.DATA;
const ROOT = path.resolve(__dirname, '..');
const casting = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'voice_casting.json'), 'utf8')); } catch (e) { return {}; } })();

// Spoken form: names never in audio (GDD §17a) — {target} dropped, third-party tokens as pronouns.
function spoken(t) {
  return String(t).replace(/,\s*\{target\}/g, '').replace(/\{target\}[.!?—]\s*/g, '').replace(/\{target\},?\s*/g, '')
    .replace(/\{they\}/g, 'they').replace(/\{them\}/g, 'them').replace(/\{their\}/g, 'their')
    .replace(/\s+([,.!?])/g, '$1').replace(/\s+/g, ' ').trim();
}
const DLG = D.CAMPAIGN3_DIALOGUE.gate;
const CH = D.CAMPAIGN_CHARS;
const CHOICES = D.CAMPAIGN3_CHOICES;
const SCRIPT = D.CAMPAIGN3_SCRIPT;
const QUESTS = D.CAMPAIGN3_QUESTS;
const REGIONS = D.CAMPAIGN3_REGIONS || {};
const name = id => (CH[id] && CH[id].name) || id;
const has = (who, key) => !!(DLG[who] && DLG[who][key]);
const companions = Object.values(CH).filter(c => c.campaign3 && c.companion).map(c => c.id);
const romanceable = Object.keys(D.CAMPAIGN3_COURTSHIP);

// ---------------------------------------------------------------- condition text
function cond(when) {
  if (!when) return '';
  const parts = [];
  if (when.any) parts.push('any of: ' + when.any.map(w => cond(w).replace(/^if /, '')).join(' / '));
  if (when.flag) parts.push(`flag ${when.flag}`);
  if (when.not) parts.push(`not ${when.not}`);
  if (when.company) parts.push(`${name(when.company)} in company`);
  if (when.noCompany) parts.push(`${name(when.noCompany)} not in company`);
  if (when.recruited) parts.push(`${name(when.recruited)} recruited`);
  if (when.notRecruited) parts.push(`${name(when.notRecruited)} never recruited`);
  if (when.alive) parts.push(`${name(when.alive)} alive`);
  if (when.dead) parts.push(`${name(when.dead)} dead`);
  if (when.heritageMin != null) parts.push(`blood ≥ ${when.heritageMin}`);
  if (when.heritageMax != null) parts.push(`blood ≤ ${when.heritageMax}`);
  if (when.affMin) parts.push(`${name(when.affMin[0])} affinity ≥ ${when.affMin[1]}`);
  if (when.allegiance) parts.push(`allegiance ${when.allegiance}`);
  if (when.romance) parts.push(`romance ${name(when.romance)}`);
  return parts.length ? 'if ' + parts.join(', ') : '';
}
function effects(o) {
  const e = [];
  if (o.ask) e.push('question — the choice returns');
  if (o.bypass) e.push('no fight');
  if (o.noEscape) e.push('boss cannot flee');
  if (o.heritage) e.push(`blood ${o.heritage > 0 ? '+' : ''}${o.heritage}`);
  if (o.gold) e.push(`gold ${o.gold > 0 ? '+' : ''}${o.gold}`);
  for (const [k, v] of Object.entries(o.aff || {})) e.push(`${name(k)} ${v > 0 ? '+' : ''}${v}`);
  for (const k of o.recruit || []) e.push(`${name(k)} joins`);
  for (const k of o.dismiss || []) e.push(`${name(k)} leaves the company`);
  for (const k of o.gone || []) e.push(`${name(k)} gone for good`);
  for (const k of o.kill || []) e.push(`${name(k)} dies`);
  if (o.allegiance) e.push(`allegiance: ${o.allegiance}`);
  if (o.allegianceLean) e.push(`leans ${o.allegianceLean}`);
  if (o.ending) e.push(`ending: ${o.ending}`);
  for (const k of Object.keys(o.set || {})) e.push(`sets ${k}`);
  return e.join('; ');
}

// ---------------------------------------------------------------- the screenplay
const rows = [];
const printed = new Set();
const clipIndex = {};   // who -> key -> [n]
function clipRows(who, key) {
  return (DLG[who][key] || []).map((l, idx) => {
    const id = who + ':' + key + ':' + (idx + 1);
    if (!clipIndex[id]) {
      const rel = `audio/vo/campaign/${who}/${key}_${idx + 1}.mp3`;
      const sp = spoken(l.t);
      clipIndex[id] = rows.length;
      rows.push({ path: rel, speaker: who, key, n: idx + 1, text: sp, shown: l.t, characters: [...sp].length });
    }
    return l;
  });
}
let md = '';
function speech(who, key, note) {
  if (!has(who, key)) return;
  printed.add(who + ':' + key);
  const lines = clipRows(who, key);
  md += `**${name(who).toUpperCase()}**${note ? ` *(${note})*` : ''}  \`${key}\`\n\n`;
  for (const l of lines) md += `> ${l.t}\n>\n`;
  md += '\n';
}
function speakersOf(beat) {
  if (beat.anyOf) return beat.anyOf.filter(id => has(id, beat.key));
  return [beat.who];
}
function replySpeakers(reply, beat) {
  if (Array.isArray(reply.who)) return reply.who.filter(id => has(id, reply.key));
  if (reply.who === '$speaker') return speakersOf(beat).filter(id => has(id, reply.key));
  return [reply.who];
}
const choiceDepth = new Set();
function choiceBlock(cid, beat, depth) {
  const ch = CHOICES[cid];
  if (!ch) return;
  const pad = '  '.repeat(depth);
  md += `${pad}> **What do you say?**\n`;
  ch.options.forEach((o, i) => {
    const tags = [cond(o.when), effects(o)].filter(Boolean).join(' · ');
    md += `${pad}> ${i + 1}. "${o.text}"${tags ? ` — _${tags}_` : ''}\n`;
  });
  md += `${pad}>\n\n`;
  ch.options.forEach((o, i) => {
    if (!o.reply) return;
    const whos = replySpeakers(o.reply, beat);
    for (const w of whos) {
      speech(w, o.reply.key, `reply to ${i + 1}${whos.length > 1 ? ', when ' + name(w) + ' is the one speaking' : ''}`);
    }
    // a reply that opens its own choice (nested)
    const nested = CHOICES[o.reply.key];
    if (nested && !choiceDepth.has(o.reply.key)) { choiceDepth.add(o.reply.key); choiceBlock(o.reply.key, { who: whos[0], anyOf: whos.length > 1 ? whos : undefined, key: o.reply.key }, depth + 1); }
  });
}
function beatBlock(beat) {
  if (beat.caption) md += `*${beat.caption}*\n\n`;
  const c = cond(beat.when);
  if (c) md += `_(${c})_\n\n`;
  if (beat.dynamic === 'romance') {
    md += '_Retired automatic arrival control: silent in existing saves. Approach companions at the inn instead._\n\n';
    return;
  }
  const whos = speakersOf(beat);
  if (whos.length > 1) md += `_One of the following, whoever is riding along:_\n\n`;
  for (const w of whos) speech(w, beat.key, beat.to ? 'to ' + name(beat.to) : undefined);
  if (beat.recruit) md += `_${beat.recruit.map(name).join(', ')} join${beat.recruit.length > 1 ? '' : 's'} the company._\n\n`;
  if (beat.death) md += `_He dies._\n\n`;
  if (beat.choice) { choiceDepth.add(beat.choice); choiceBlock(beat.choice, beat, 0); }
}

md += '# Varenholm\'s Gate — Voice Script\n\n';
md += 'The story campaign in playing order: every scene, caption, spoken line and pick-a-line choice, quest by quest. ';
md += 'The player is silent — their picked lines are shown on screen and never recorded. Bracketed tags are ElevenLabs v3 delivery cues and stay in the text sent to the API. ';
md += 'Names are never spoken: the game shows the name; the recorded "spoken" form drops {target}. ';
md += 'Conditions in _italics_ say when a line plays; most scenes have alternatives depending on who is riding along and what the player chose earlier.\n\n';
md += 'Part 2 is the casting appendix: one section per character with who they are, where they are from, how they speak (region and accent notes for picking a voice), and every clip in one place. ';
md += 'Fill in the **Voice ID** for each character in `tools/voice_casting.json` (key = character id). Clips land at `audio/vo/campaign/<id>/<beat>_<n>.mp3`; `tools/c3_voice_lines.json` lists every clip to generate.\n\n';

// regions up front so a reader hears the voices before the first line
md += '## The regions and their voices\n\n';
md += 'Every named person comes from somewhere, and the somewhere is written into how they talk — word choice, rhythm and idiom, never phonetic spelling. Use these when casting.\n\n';
md += '| Region | Real-world flavour | Names | How they speak |\n|---|---|---|---|\n';
for (const r of Object.values(REGIONS)) md += `| ${r.name} | ${r.flavour} | ${r.names} | ${r.voice} |\n`;
md += '\n---\n\n# Part 1 — The script in playing order\n\n';

for (const q of QUESTS) {
  const s = SCRIPT[q.n] || {};
  md += `## Quest ${q.n} — ${q.name}  *(${q.chapter})*\n\n_${q.brief}_\n\n`;
  if ((s.departure || []).length) { md += `### Setting out\n\n`; for (const b of s.departure) beatBlock(b); }
  q.enc.forEach((e, idx) => {
    const list = (s.openers || {})[idx];
    const variants = Object.entries(e.variants || {}).map(([flag, v]) => `${v.label} (if ${flag})`);
    md += `### Scene ${idx + 1}: ${e.label}${variants.length ? ' — or ' + variants.join(' / ') : ''}\n\n`;
    if (list && list.length) for (const b of list) beatBlock(b); else md += `_(combat, no dialogue)_\n\n`;
    if (q.n === 4 && e.mini === 'kobold_chief') {
      md += '_During combat, once: Winston must be present and successfully apply Whisper of Ending after the chief has healed._\n\n';
      speech('fennick', 'q4_healing');
    }
  });
  if ((s.closing || []).length) { md += `### After the last fight\n\n`; for (const b of s.closing) beatBlock(b); }
  if ((s.arrival || []).length) { md += `### Back in town\n\n`; for (const b of s.arrival) beatBlock(b); }
  md += '---\n\n';
}

md += '## Optional private conversations at the inn\n\n';
md += 'Two personal conversations on different completed-quest occasions build familiarity. Friendly answers do not start romance. The player must explicitly express romantic interest, then return on a later occasion and choose to discuss the relationship. Only the selected companion speaks. “Not now” and “friends only” are saved; only the player can reopen courtship. Delphine stays familial. Amara has no new romance until a later story resolves Kolade.\n\n';
for (const who of romanceable) {
  const route = D.CAMPAIGN3_COURTSHIP[who];
  md += `### ${name(who)}\n\n`;
  for (const c of route.conversations) {
    speech(who, c.key);
    md += `> **Friendly response:** ${c.text}\n> **Leave:** I should go. We can talk another time.\n\n`;
    speech(who, c.reply, 'only after choosing the friendly response; counts once');
  }
  md += '> **Explicit interest:** I would like to be more than friends.\n\n';
  speech(who, route.interest);
  speech(who, 'q9_romance', 'on a later occasion, only if the player chooses to discuss courtship');
  speech(who, 'q9_romance_yes', 'accept');
  speech(who, route.later, 'need more time');
  speech(who, 'q9_romance_no', 'friendship only');
}
// banter
md += '## In combat — companion banter\n\n_One suitable line from a standing ally in round two. Unheard lines rotate before repeats; named listeners must be present, and status remarks require that status on a living enemy. Consecutive repeats stay silent._\n\n';
for (const id of companions) speech(id, 'banter');
md += '---\n\n';

// anything the walk did not reach (should be empty)
const missed = [];
for (const who of Object.keys(DLG)) for (const key of Object.keys(DLG[who])) if (!printed.has(who + ':' + key)) missed.push(who + ':' + key);
if (missed.length) {
  md += '## Lines not reached by the walk\n\n';
  for (const m of missed) { const [who, key] = m.split(':'); speech(who, key); }
  md += '---\n\n';
}

// ---------------------------------------------------------------- epilogue (on-screen text, not voiced)
md += '## The ending card (on-screen text, not voiced)\n\n';
const E = D.CAMPAIGN3_EPILOGUE;
for (const [k, v] of Object.entries(E.ending)) md += `**Ending — ${k}:** ${v}\n\n`;
for (const [k, v] of Object.entries(E.allegiance)) md += `**Allegiance — ${k}:** ${v}\n\n`;
for (const [k, v] of Object.entries(E.dukes)) md += `**The dukes — ${k}:** ${v}\n\n`;
for (const [id, v] of Object.entries(E.companion)) for (const [state, t] of Object.entries(v)) if (t) md += `**${name(id)} — ${state}:** ${t}\n\n`;
for (const [id, v] of Object.entries(E.romance)) { md += `**Romance — ${name(id)}:** ${v.line}\n\n**Romance — ${name(id)}, favoured ending:** ${v.favoured}\n\n`; }
for (const [k, v] of Object.entries(E.heritage)) md += `**The blood — ${k}:** ${v}\n\n`;
md += '---\n\n';

// ---------------------------------------------------------------- casting appendix
const order = Object.keys(DLG).sort((a, b) => {
  const ra = CH[a].companion ? 0 : CH[a].role === 'antagonist' ? 1 : CH[a].fights === false ? 2 : 3;
  const rb = CH[b].companion ? 0 : CH[b].role === 'antagonist' ? 1 : CH[b].fights === false ? 2 : 3;
  return ra - rb || CH[a].name.localeCompare(CH[b].name);
});
const questOf = k => { const m = /^q(\d+)_/.exec(k); return m ? +m[1] : k === 'banter' ? 99 : 98; };
md += '# Part 2 — Casting appendix\n\n';
md += '| # | Character | Role | From | Lines | Voice ID |\n|---|---|---|---|---|---|\n';
let i = 0;
for (const who of order) {
  const c = CH[who];
  const n = Object.values(DLG[who]).reduce((a, l) => a + l.length, 0);
  const r = REGIONS[c.region] || {};
  md += `| ${++i} | ${c.name}${c.epithet ? ' (' + c.epithet + ')' : ''} | ${c.companion ? 'companion' : c.role} | ${r.flavour || '—'} | ${n} | ${casting[who] || '_unassigned_'} |\n`;
}
md += '\n';
for (const who of order) {
  const c = CH[who];
  const r = REGIONS[c.region] || {};
  md += `## ${c.name}${c.epithet ? ', ' + c.epithet : ''}  \`${who}\`\n\n`;
  md += `**Sex:** ${c.sex === 'f' ? 'female' : 'male'} · **Role:** ${c.companion ? 'companion' + (c.romance ? ' (romanceable)' : '') : c.role} · **Voice ID:** ${casting[who] || '_unassigned_'}\n\n`;
  md += `**Who they are:** ${c.desc || ''}\n\n`;
  if (r.name) md += `**From:** ${r.name} — ${r.flavour}. **Voice:** ${r.voice}\n\n`;
  const keys = Object.keys(DLG[who]).sort((a, b) => questOf(a) - questOf(b) || a.localeCompare(b));
  for (const key of keys) {
    md += `**${key}**\n\n`;
    clipRows(who, key).forEach((l, idx) => { md += `- \`${key}_${idx + 1}\` — ${spoken(l.t)}\n`; });
    md += '\n';
  }
}
const total = rows.reduce((a, r) => a + r.characters, 0);
md += `---\n\n**Totals:** ${order.length} characters · ${rows.length} clips · ${total.toLocaleString()} characters of text (ElevenLabs bills per character).\n`;
fs.mkdirSync(path.join(ROOT, 'docs/dialogue'), {recursive:true});
fs.writeFileSync(path.join(ROOT, 'docs/dialogue/VARENHOLMS_GATE_VOICE_SCRIPT.md'), md);
rows.sort((a, b) => a.speaker.localeCompare(b.speaker) || a.key.localeCompare(b.key) || a.n - b.n);
fs.writeFileSync(path.join(__dirname, 'c3_voice_lines.json'), JSON.stringify(rows, null, 1));
console.log(`${order.length} characters, ${rows.length} clips, ${total} characters${missed.length ? ', ' + missed.length + ' lines not reached by the walk' : ''} -> docs/dialogue/VARENHOLMS_GATE_VOICE_SCRIPT.md, tools/c3_voice_lines.json`);
