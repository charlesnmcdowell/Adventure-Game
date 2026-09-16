// Reviewed end-card prose only. The original snapshot is retained beside this file.
'use strict';
const fs = require('fs'), path = require('path');
const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before.json'), 'utf8'));
const E = structuredClone(before.epilogue), H = structuredClone(before.endings);
Object.assign(E.ending, {
 hero: "Kolade Adeyinka died beneath the city. The Council made the Consortium's ledgers public and rejected war with Calder. The people of Varenholm knew you had stopped the conspiracy. Few knew that the man you defeated was your brother.",
 monster: "Kolade Adeyinka died at the altar. The Council exposed the Consortium's conspiracy and halted preparations for war. The city celebrated your victory. It knew nothing of Morrak's children, or of the power that had drawn both you and Kolade to the throne.",
 usurper: "You claimed the throne beneath the city after defeating Kolade. The Council halted preparations for war and honored you for exposing the conspiracy. Most of the people who cheered had no idea what you had taken for yourself.",
 mercy: "Kolade Adeyinka was imprisoned beneath the Gauntlet's hall. The Consortium's ledgers were made public, and the Council rejected war with Calder. You had stopped him without killing him. He would face trial for the people he had ordered murdered.",
 ascetic: "You refused the throne and left Kolade alive beneath the city. By dawn, he had disappeared. You returned home, knowing that he might yet come after you. What became of him remained unknown.",
 restored: "Kolade died in Morrak's realm. You released the souls he had bound and gave up the divine power in your blood to bring Hiwot back. She woke beside you on the temple floor, alive and mortal. The passage closed behind you. You had lost your claim to the throne, but you could take your sister home.",
 ascended: "Kolade died in Morrak's realm, and you claimed the power he had tried to take. Hiwot could not return with you. Her soul passed beyond your reach as you became Morrak's successor. You could still walk the mortal world, but you would return to it without your sister.",
});
Object.assign(E.allegiance, {
 gauntlet: "Duke Adebayo recovered and kept his promise to you. The wanted posters came down, and the Gauntlet publicly cleared your company's name. Its hall recorded your part in exposing Kolade.",
 consortium: "Folake took control of the Consortium and honored her bargain with you. She began reopening trade routes and hiring new guards. Her letters made it clear that she hoped to employ you again.",
 thieves: "Tunde Softfoot had given you a way into the palace when you needed one. Afterwards, he reminded you that the favor had not been a gift. He had yet to name his price.",
 none: "The Council publicly cleared your name and thanked you for exposing the conspiracy. You left without entering the service of any of the city's factions.",
});
Object.assign(E.dukes, {
 both: "Olumide and Folasade survived the attack on the Council. Together, they began restoring order and investigating the officials Kolade had paid.",
 one: "Folasade was buried with the city's honors. Olumide survived, but the attack left the Council badly weakened.",
 none: "Olumide and Folasade were buried on the same morning. Their deaths left the surviving councillors to choose new leaders and settle a frightened city.",
});
Object.assign(E.companion.wren_ward, {
 present: "Hiwot opened a small locksmith's shop on the harbour road. She repaired locks by day and declined to explain where she had learned to open the difficult ones.",
 gone: "Hiwot returned to Lanternhold. Brother Yonas listened to her account of the journey, then asked her to write it down for the archives.",
});
Object.assign(E.companion.dorran, {
 present: "Beau helped the people driven from their homes by the fighting. When there was heavy work to do, he was usually the first to volunteer. He never had much patience for being called a hero.",
 dead: "Beau's companions raised a memorial for him near Mirkhollow. They remembered his loyalty, his patience, and how readily he had put himself in danger for others.",
});
Object.assign(E.companion.selene, {
 present: "Delphine helped rebuild the Warden house on the Shore Road. She kept Tesfaye's letters there, along with a room you could use whenever you visited.",
 gone: "Delphine returned to the Wardens. News of the campaign reached her through their reports.",
});
Object.assign(E.companion.vess, {
 present: "Desmond stayed in Varenholm and found work trading information. He was careful about who knew his clients' names.",
 gone: "No reliable news of Desmond reached you after Kolade's defeat. The Umbral Hand refused to discuss its agents.",
});
E.companion.fennick.present = "Winston took work guarding merchant caravans. He insisted on seeing the route, the cargo and the full payment before agreeing to leave town.";
E.companion.fennick.gone = "No further word of Winston reached you after Kolade's defeat.";
Object.assign(E.companion.cassian, {
 present: "Santiago was knighted by the Order of the Dawning Flame. His report named the companions who had helped him, including those his superiors would rather have left out.",
 gone: "Santiago returned to the Order of the Dawning Flame. He sent occasional letters, keeping his account of the journey brief.",
});
Object.assign(E.companion.ithrel, {
 present: "Itsuki visited his wife's grave before settling outside the city. He began taking work as a guide again, and made plans that had nothing to do with revenge.",
 gone: "Itsuki travelled north after leaving the company. Little news of him reached Varenholm.",
});
E.companion.bramm.present = "Bahadır settled by the river with Fındık. The tiger liked to sleep across the front steps. Visitors soon learned to call from the gate.";
E.companion.ysolde.present = "Yasemin stayed in Varenholm to continue her studies. She kept in touch with the people who had helped free her.";
E.companion.aurelius.present = "Devendra returned to Vashk and secured a promotion from the Crimson Wizards. He sent you a copy of his report. Your name appeared in it, though not nearly as often as his.";
Object.assign(E.companion.ilvara, {
 present: "Layla opened a small chapel in Varenholm. People who would once have crossed the street to avoid her began coming to her for healing. She made them wait their turn like everyone else.",
 gone: "Layla left Varenholm after the fighting ended. She gave no destination and made no promise to return.",
});
Object.assign(E.companion.faelen, {
 present: "Kaito found steady work as a tracker. Between jobs, he performed in the inns. He asked you not to mention the spiders during his songs about the campaign.",
 gone: "Kaito returned to the inns of Thornbury. His songs about the campaign gave him a considerably larger role than you remembered.",
});
Object.assign(E.companion.nettle, {
 present: "Wanjiru returned to Mirkhollow to help restore the riverbanks and woodland damaged by the mine. She had little interest in the celebrations in Varenholm; she wanted to see the river run clear again.",
 gone: "Wanjiru returned to Mirkhollow after leaving your company. She sent word that the river was beginning to clear.",
});
Object.assign(E.companion.durnik, {
 present: "Dai Morgan obtained permission to reclaim his clan's mine. Before work began, he made copies of the prisoners' names and arranged a memorial for those who had died there.",
 gone: "Dai Morgan left the company to seek help reclaiming his clan's mine.",
});
Object.assign(E.companion.amara, {
 present: "Amara visited Kolade in prison. She still cared for him, but no longer excused what he had done.",
 gone: "Amara left Varenholm by sea. She asked for privacy and gave no address where she could be reached.",
 dead: "Amara was buried near the entrance to the Undercity, where she had tried to stop you from reaching Kolade.",
});
Object.assign(E.heritage, {
 reject: "The dreams of Morrak's throne ceased. You had refused his succession and meant to keep that promise.",
 neutral: "The dreams of Morrak's realm became less frequent, but they did not stop. You still had to decide what your heritage would mean for the rest of your life.",
 embrace: "The dreams continued, and you welcomed them. You still wanted to know how much of Morrak's power you could claim.",
});
Object.assign(E.finale, {
 cityAftermath: "In Varenholm, the Consortium's ledgers were made public. The Council rejected war with Calder. Caravans began using the roads again, and iron returned to the markets. The families who had lost people to the mines and the hired killers were still waiting for justice.",
 amaraWaiting: "Amara stayed in Varenholm for a time, hoping for news of Kolade. She would not say what she would do if he returned.",
});
E.outcome = {
 beauDrowned: "Beau and nineteen prisoners died when the mine flooded. Their names were carved into a memorial above the sealed entrance.",
 daiAbandoned: "Dai Morgan was never rescued from the mine. No one could confirm that he had escaped before it flooded.",
 laylaSold: "The patrol took Layla toward the coast in chains. After that, you heard nothing certain about her fate.",
 kaitoAbandoned: "You left Kaito trapped in the spiders' web. After the campaign, no word reached you of whether he had escaped.",
};
Object.assign(H, {
 hero: { title: 'The Gate Stands', line: 'You stopped Kolade and prevented the war.' },
 monster: { title: 'A Dangerous Inheritance', line: "Kolade is dead. Morrak's power remains within you." },
 usurper: { title: 'The Throne Claimed', line: 'You defeated Kolade and took the throne for yourself.' },
 mercy: { title: 'Kolade in Chains', line: 'You brought him back alive to answer for his crimes.' },
 ascetic: { title: 'An Unfinished Reckoning', line: 'You refused the throne and left Kolade alive.' },
});
// The existing clear romance passages, mourning paragraph and two new headings stay.
let dialogue = fs.readFileSync('js/data/campaign3_dialogue.js', 'utf8');
const legacyE = structuredClone(E); delete legacyE.ending.restored; delete legacyE.ending.ascended; delete legacyE.finale;
dialogue = dialogue.replace(/D\.CAMPAIGN3_EPILOGUE = \{[\s\S]*?\n\};\n\/\/ Exact old paragraphs/, 'D.CAMPAIGN3_EPILOGUE = '+JSON.stringify(legacyE,null,2)+';\n// Exact old paragraphs');
fs.writeFileSync('js/data/campaign3_dialogue.js', dialogue);
let data = fs.readFileSync('js/data/campaign3_data.js','utf8');
const legacyH = structuredClone(H); delete legacyH.restored; delete legacyH.ascended;
data = data.replace(/D\.CAMPAIGN3_ENDINGS = \{[\s\S]*?\n\};/, 'D.CAMPAIGN3_ENDINGS = '+JSON.stringify(legacyH,null,2)+';');
fs.writeFileSync('js/data/campaign3_data.js',data);
let finale = fs.readFileSync('js/data/gate_finale.js','utf8');
finale = finale.replace(/D\.CAMPAIGN3_EPILOGUE\.finale = [^\n]+/, 'D.CAMPAIGN3_EPILOGUE.finale = '+JSON.stringify(E.finale)+';');
for(const id of ['restored','ascended'])finale=finale.replace(new RegExp('D\\.CAMPAIGN3_EPILOGUE\\.ending\\.'+id+' = [^\\n]+'), 'D.CAMPAIGN3_EPILOGUE.ending.'+id+' = '+JSON.stringify(E.ending[id])+';');
fs.writeFileSync('js/data/gate_finale.js',finale);
const changes=[];
function diff(old,value,keys=[]){for(const [key,text]of Object.entries(value)){const at=keys.concat(key);if(typeof text==='string'){if(text!==old?.[key])changes.push({section:at.join('.'),before:old?.[key]||null,after:text});}else diff(old?.[key],text,at);}}
diff(before.epilogue,E,['epilogue']);diff(before.endings,H,['heading']);
fs.writeFileSync(path.join(__dirname,'changes.json'),JSON.stringify(changes,null,2)+'\n');
console.log(JSON.stringify({changedTextFields:changes.length}));
