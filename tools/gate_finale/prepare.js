// Build only the current campaign patch. No network requests or audio mutation.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), crypto = require('crypto');
const A = require('../../test/harness').load();
const old = { ADV: { DATA: {} } };
// Dialogue registration needs the existing campaign character table and quests.
old.ADV.DATA = { ...A.DATA };
vm.runInNewContext(cp.execFileSync('git', ['show', 'HEAD:js/data/campaign3_dialogue.js'], { encoding: 'utf8' }), old);
const before = old.ADV.DATA.CAMPAIGN3_DIALOGUE.gate;
const current = A.DATA.CAMPAIGN3_DIALOGUE.gate;
const casting = JSON.parse(fs.readFileSync('tools/voice_casting.json', 'utf8'));
const spoken = t => t.replace(/,\s*\{target\}/g, '').replace(/\{target\}[.!?—]\s*/g, '').replace(/\{target\},?\s*/g, '')
 .replace(/\{they\}/g,'they').replace(/\{them\}/g,'them').replace(/\{their\}/g,'their').replace(/\s+([,.!?])/g,'$1').replace(/\s+/g,' ').trim();
const entries = [], needsCasting = [];
for (const [who, keys] of Object.entries(current)) for (const [key, lines] of Object.entries(keys)) for (const [i, line] of lines.entries()) {
 const dest = `audio/vo/campaign/${who}/${key}_${i+1}.mp3`, prior = before[who]?.[key]?.[i]?.t;
 if (prior === line.t && fs.existsSync(dest)) continue;
 const allowed = /^q14_final_/.test(key) || ['ambrose:q10_letter_give','aldric:q10_blood_of_two'].includes(who+':'+key);
 if (!allowed) continue; // Mzee and other deliberately unvoiced lines are outside this patch.
 const text = spoken(line.t), voice = casting[who];
 if (!voice) { needsCasting.push({ path:dest, speaker:who, shown:line.t }); continue; }
 const hash = crypto.createHash('sha256').update(JSON.stringify([voice,'eleven_v3',text])).digest('hex');
 entries.push({ path:dest,speaker:who,key,index:i+1,shown:line.t,text,voice,characters:[...text].length,hash,before:prior||null });
}
const patch = { model:'eleven_v3',creditCeiling:16000,reserve:500,entries,needsCasting };
fs.writeFileSync(path.join(__dirname,'patch.json'), JSON.stringify(patch,null,2)+'\n');
console.log(JSON.stringify({ clips:entries.length,characters:entries.reduce((n,e)=>n+e.characters,0),speakers:[...new Set(entries.map(e=>e.speaker))] }));
