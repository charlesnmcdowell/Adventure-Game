// Every spoken quest / event / tutorial / personality line must have a clip.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./harness');
const ADV = load();
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/ui/narrator.js'), 'utf8'), { filename: 'narrator.js' });

const ROOT = path.join(__dirname, '..');
const VO = path.join(ROOT, 'audio', 'vo');
let pass = 0, fail = 0, missing = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}
function need(rel, label) {
  if (exists(rel)) { pass++; return true; }
  fail++;
  missing.push((label || rel) + '  →  ' + rel);
  return false;
}

// Campaign 1 + 2 beats: audio/vo/campaign/{who}/{key}_{n}.mp3 (1-based)
function walkCampaign(bag, tag) {
  if (!bag) return;
  for (const [fid, chars] of Object.entries(bag)) {
    if (!chars || typeof chars !== 'object') continue;
    for (const [who, beats] of Object.entries(chars)) {
      if (!beats || typeof beats !== 'object') continue;
      for (const [key, lines] of Object.entries(beats)) {
        if (!Array.isArray(lines)) continue;
        lines.forEach((_, i) => {
          need('audio/vo/campaign/' + who + '/' + key + '_' + (i + 1) + '.mp3',
            tag + ' ' + fid + '/' + who + '/' + key + '[' + (i + 1) + ']');
        });
      }
    }
  }
}

walkCampaign(ADV.DATA.CAMPAIGN_DIALOGUE, 'campaign1');
walkCampaign(ADV.DATA.CAMPAIGN2_DIALOGUE, 'campaign2');
walkCampaign(ADV.DATA.CAMPAIGN3_DIALOGUE, 'campaign3');

function walkNamed(bag, key, tag) {
  if (!bag) return;
  for (const [who, lines] of Object.entries(bag)) {
    if (!Array.isArray(lines)) continue;
    lines.forEach((_, i) => {
      need('audio/vo/campaign/' + who + '/' + key + '_' + (i + 1) + '.mp3',
        tag + ' ' + who + '/' + key + '[' + (i + 1) + ']');
    });
  }
}
walkNamed(ADV.DATA.GOD_LINE_DIALOGUE, 'open', 'god');
walkNamed(ADV.DATA.GOD_LINE_HATRED, 'hatred', 'god');
walkNamed(ADV.DATA.GOD_LINE_SMITE, 'smite', 'god');

const chars = ADV.DATA.CAMPAIGN_CHARS || {};
for (const [id, ch] of Object.entries(chars)) {
  const exits = (ch && ch.exitLines) || [];
  exits.forEach((_, i) => {
    need('audio/vo/campaign/' + id + '/exit_' + (i + 1) + '.mp3',
      'exit ' + id + '[' + (i + 1) + ']');
  });
}

const war = ADV.DATA.FACTION_WAR_DIALOGUE || {};
for (const [fid, pack] of Object.entries(war)) {
  if (!pack || !pack.who) continue;
  (pack.open || []).forEach((_, i) => {
    need('audio/vo/campaign/' + pack.who + '/waropen_' + (i + 1) + '.mp3',
      'war ' + fid + '/waropen[' + (i + 1) + ']');
  });
  (pack.boss || []).forEach((_, i) => {
    need('audio/vo/campaign/' + pack.who + '/warboss_' + (i + 1) + '.mp3',
      'war ' + fid + '/warboss[' + (i + 1) + ']');
  });
}

// Monster / miniboss roars
const monsters = ADV.DATA.MONSTER_VO || {};
for (const [id, rec] of Object.entries(monsters)) {
  const roars = (rec && rec.roar) || [];
  roars.forEach((_, i) => {
    need('audio/vo/campaign/' + id + '/roar_' + (i + 1) + '.mp3', 'roar ' + id + '[' + (i + 1) + ']');
  });
}

// Tutorial narrator
const tutor = ADV.DATA.TUTORIAL_VO || {};
for (const id of Object.keys(tutor)) {
  need('audio/vo/tutorial/' + id + '.mp3', 'tutorial ' + id);
}

const narrator = (ADV.Narrator && ADV.Narrator.lines) || {};
for (const id of Object.keys(narrator)) {
  need('audio/vo/narrator/' + id + '.mp3', 'narrator ' + id);
}

// Town / event personality lines (join, romance, hatred, general)
const dlg = ADV.DATA.DIALOGUE || {};
for (const [pid, p] of Object.entries(dlg)) {
  if (!p || p.hidden) continue;
  for (const band of ['general', 'friendly', 'hatred', 'romantic']) {
    const lines = p[band];
    if (!Array.isArray(lines)) continue;
    lines.forEach((_, i) => {
      need('audio/vo/' + pid + '/' + band + '_' + (i + 1) + '.mp3',
        pid + ' ' + band + '[' + (i + 1) + ']');
    });
  }
  for (const band of Object.keys(p)) {
    if (!/^travel/.test(band) || !Array.isArray(p[band])) continue;
    p[band].forEach((_, i) => {
      need('audio/vo/' + pid + '/' + band + '_' + (i + 1) + '.mp3',
        pid + ' ' + band + '[' + (i + 1) + ']');
    });
  }
}

console.log('\n-- voice coverage --');
console.log('  ok   ' + pass + ' clips present');
if (fail) {
  console.log('  FAIL ' + fail + ' missing\n');
  const shown = missing.slice(0, 80);
  for (const m of shown) console.log('    ' + m);
  if (missing.length > shown.length) console.log('    … +' + (missing.length - shown.length) + ' more');
  console.log('\nVOICE COVERAGE FAIL');
  process.exit(1);
}
console.log('\nVOICE COVERAGE OK');
process.exit(0);
