'use strict';
const fs=require('fs'),path=require('path');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const A=require('../../test/harness').load(),D=A.DATA,before=read('before.json'),patch=read('patch.json'),changes=read('changes.json');
const production=fs.existsSync(path.join(__dirname,'recording.json'))?read('recording.json'):null;
const validated=fs.existsSync(path.join(__dirname,'validation.json'))?read('validation.json'):null;
const gatePath=path.join(__dirname,'safe-check.log'),gate=fs.existsSync(gatePath)?fs.readFileSync(gatePath,'utf8'):'';
const totals=gate.match(/(\d+) passed, (\d+) failed/),gatePassed=gate.includes('[4/4] gate passed; nothing published');
const lines=[
 '# Iron War epilogue review and rewrite',
 '',
 '16 September 2026. Covers the two current finales, five legacy saved endings, and their companion and faction paragraphs. No quests, endings, rewards, skill effects or romance eligibility were redesigned.',
 '',
 '## Findings',
 '',
 '- The current soul-choice endings explained Hiwot’s fate but barely resolved the iron conspiracy and threatened war. A shared aftermath now explains publication of the ledgers, the Council’s rejection of war with Calder, reopening trade, and the families still awaiting justice.',
 '- Several older paragraphs used vague objects and contrived punch lines: “The chair is a chair,” “You sat down. It was warm,” and “Kaito is still in the web, in a sense.” The revised prose names the throne, decisions and consequences directly.',
 '- The hero ending could say Kolade either died or was arrested, despite those being separate endings. Each legacy ending now states its own outcome. The harsh “They should have burned you with him” heading is replaced with a description of the player’s continuing divine inheritance.',
 '- Beau’s stammer inexplicably disappeared as a reward for heroism. His new paragraph describes his service to others. His death paragraph no longer assumes Delphine survived to arrange his grave; drowning with the nineteen prisoners is a separate recorded outcome.',
 '- A generic departure could imply Layla was sold, Dai was abandoned to die, or Kaito remained trapped. Those claims now require the relevant saved choices. Unknown fates remain unknown.',
 '- Desmond/Winston and Bahadır/Yasemin were treated as inseparable pairs in the prose. They now have individual paragraphs, so a surviving companion does not imply the other survived. This also gives Winston and Yasemin their own conclusions.',
 '- Amara’s prison visits now appear only when Kolade was actually imprisoned. Other endings use mourning, uncertainty, departure or death as appropriate.',
 '- The ten recently revised romance passages, the clear Amara mourning paragraph, and the two current ending headings were retained. Humor stays with the characters: Fındık obstructs the front steps, Devendra exaggerates his importance, and Kaito would prefer to omit the spiders from his songs.',
 '',
 '## Save and playback behavior',
 '',
 '- Opening the epilogue refreshes recognized old prose in completed saves and records the text revision. Progress, selected ending, choices, relationships, skills and inventory are preserved. Unknown/custom paragraphs are retained.',
 '- Each narration clip is selected by exact displayed text. Missing or deliberately suppressed audio advances safely instead of crashing the end card.',
 '- Earlier recordings are backed up under `archive/dialogue/2026-09-16-gate-epilogue/`. Updated voice and script hashes prevent old browser caches from being selected.',
 '',
 '## Voice production',
 '',
 `Tesfaye: **${patch.entries[0].voice}**, confirmed in both casting records and the ElevenLabs account as **VG: Tesfaye**. Model: **${patch.model}**.`,
 '',
 `**${patch.entries.length} changed/new clips**, **${D.GATE_EPILOGUE_VO.entries.length-patch.entries.length} reused clips**, **${D.GATE_EPILOGUE_VO.entries.length} total variants**. A player hears only the variants selected by their choices. Conservative character estimate: **${patch.entries.reduce((sum,e)=>sum+e.characters,0)} credits**, plus a 500-credit reserve. The account audit found 109,384 credits before generation. Paid requests are never automatically retried if their result is uncertain.`,
 '',
 production?.reportedClipCosts!=null?`Per-request receipts total **${production.reportedClipCosts.toLocaleString('en-US')} credits**. A later account check settled at **${production.settlement?.remainingCredits?.toLocaleString('en-US')||'pending'} remaining credits**; ${production.settlement?.matchesReceiptTotal?'the account usage change matches the receipts.':'settlement verification is pending.'} No paid request was retried.`:'Recording and final billing are pending.',
 '',
 validated?`All **${validated.checks.length}** new recordings passed hash/casting checks, browser audio decoding, duration, peak/RMS and basic speech-rate sanity checks before installation. This is technical audio validation, not independent transcription of every spoken word. The changed variants total **${validated.checks.reduce((sum,c)=>sum+c.duration,0).toFixed(2)} seconds** across mutually exclusive outcomes.`:'Audio validation is pending.',
 '',
 '## Verification',
 '',
 '- Before editing: the existing end-card voice coverage, finale state and campaign dialogue tests passed.',
 '- The first full run passed 75 groups and failed one stale assertion expecting the exact old wording “Beau is buried.” The new drowning paragraph was correctly selected. That assertion now requires the drowning outcome; it was not removed. The first log and result set are preserved as `safe-check-first-pass.log` and `headless-first-pass.json`.',
 '- The revised end-card tests cover 1,512 outcome combinations, plus specific mixed companion fates, sold/abandoned versus departed states, Beau’s mine death, Amara’s ending-dependent reaction, and narration suppressed by censorship.',
 '- Completed-save migration is idempotent and survives the real save/load API. It preserves progression, choices, relationships, rewards, skills and inventory, and retains unknown/custom paragraphs.',
 '- Chromium and WebKit passed real voice playback, both endings, migrated cached text, motion settings, mute/replay, autoplay recovery and scene cleanup at 1280×760 and 844×390. Desktop and phone screenshots were visually checked. These are browser emulations, not physical-phone tests.',
 gatePassed&&totals?`- The complete safe-publish check passed: **${totals[1]} test groups passed, ${totals[2]} failed**; 402 JavaScript files parsed and 8,451 asset references resolved. Runtime inputs were hash-verified after tests. Nothing was published by the check.`:'- The final full safe-publish gate is still pending.',
 '- Evidence: `tools/gate_epilogue_review/safe-check.log`, `headless-results.json`, `validation.json`, `recording.json`, `browser-chromium.log`, `browser-webkit.log`, and screenshots/reports under `test/reports/gate-endcard/`. The generation evidence ledger was refreshed.',
 '',
 '## Current finale text',
 '',
];
for(const id of ['restored','ascended'])lines.push('### '+D.CAMPAIGN3_ENDINGS[id].title,'',D.CAMPAIGN3_ENDINGS[id].line,'',D.CAMPAIGN3_EPILOGUE.ending[id],'');
lines.push('### The city after either current ending','',D.CAMPAIGN3_EPILOGUE.finale.cityAftermath,'');
lines.push('## All edited text','');
for(const row of changes)lines.push('### '+row.section,'',row.before?'**Before:** '+row.before:'**Before:** No separate paragraph.','','**After:** '+row.after,'');
lines.push('## Retained passages','',...D.GATE_EPILOGUE_VO.entries.filter(row=>before.voice.entries.some(old=>old.key===row.key&&old.text===row.text)).flatMap(row=>['- **'+row.key+'**: '+row.text]),'');
lines.push('## Release note','','This update is local until it passes the normal safe-publish flow and is deployed. The earlier `dist/crazygames-candidate-20260916/` is a frozen snapshot of the previous epilogue. Do not submit it as the current version. Before a new CrazyGames build is submitted, its externally hosted voice files must be updated and verified against the new manifest; otherwise new text could play an older recording.','');
fs.writeFileSync('docs/dialogue/IRON_WAR_EPILOGUE_REVIEW_2026-09-16.md',lines.join('\n'));
console.log('Wrote review, revised endings and every before/after change.');
