// Varenholm's Gate story campaign — every line, choice and epilogue paragraph.
// Text only in this pass: no clips exist yet, so nothing here is walked by
// vo_coverage. VARENHOLMS_GATE_VOICE_SCRIPT.md is generated from this file.
//
// Bracketed tags are ElevenLabs v3 delivery cues (spoken, never shown).
// {target} is the listener's name (the player, unless the beat says otherwise).
// The player is silent: the only lines they "say" are the options they pick.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};
const D = ADV.DATA;
const DLG = D.CAMPAIGN3_DIALOGUE = { gate: {} };
const CHOICES = D.CAMPAIGN3_CHOICES = {};
const SCRIPT = D.CAMPAIGN3_SCRIPT = {};

// lines(who, key, 'a|b|c') — one beat, in order.
function L(who, key, text) {
  const t = DLG.gate[who] = DLG.gate[who] || {};
  t[key] = text.split('|').map(s => ({ t: s.trim() }));
}
// choice(id, [option, ...]) — option: { id, text, reply:{who,key}, set, aff, heritage,
//   allegiance, recruit, dismiss, kill, bypass, noEscape, romanceOffer, ending, when }
function CH(id, options) { CHOICES[id] = { id, options }; }
// beat helpers
const B = (who, key, extra) => Object.assign({ who, key }, extra || {});
const Q = (n, script) => { SCRIPT[n] = script; };

// =====================================================================
// Q1 — The Road from Lanternhold
// =====================================================================
L('aldric', 'q1_wake', '[quietly] {target}. Up. Dress for the road, not the library.|[calm] We are leaving tonight, and I will tell you why when we are past the gate. Not before. Not here.|[warmly] Take whatever coin you have and buy a real weapon from the storehouse. The wooden ones stay.');
L('aldric', 'q1_tutorial', '[calm] Three things before we go.|[calm] One: a fight is lanes. Front holds, back hurts, the middle heals. Keep your feet in the right one.|[calm] Two: you learn by watching. Every skill you see used is a skill you can learn later. Look at everything.|[quietly] Three: if I say run, you run. Do not argue with me tonight.');
L('aldric', 'q1_nib', '[alarmed] Behind you. That man does not work here.');
CH('q1_nib', [
  { id: 'who', text: 'Who paid you?', reply: B('aldric', 'q1_nib_who') },
  { id: 'draw', text: 'Draw, then.', reply: B('aldric', 'q1_nib_draw') },
  { id: 'run', text: 'Run. I will let you.', heritage: -1, bypass: true, reply: B('aldric', 'q1_nib_run') },
]);
L('aldric', 'q1_nib_who', '[quietly] He will not say. They never know the name. Put him down and we will ask the next one.');
L('aldric', 'q1_nib_draw', '[calm] Good. Front lane. I will watch the door.');
L('aldric', 'q1_nib_run', '[thoughtful] He went. That was kinder than I would have been. Remember that it cost us nothing tonight; it will not always.');
L('aldric', 'q1_cobb', '[angry] Two of them, inside these walls. Someone bought a keeper\'s silence.|[calm] Finish it. We go the moment the gate opens.');
L('aldric', 'q1_road', '[quietly] Stay close. The road is empty and I do not like empty.|[thoughtful] If I do not get the chance later: I was proud of you. I am proud of you.');
L('aldric', 'q1_ambush', '[alarmed] Torches ahead. Off the road, now.');
// closing cutscene: the armoured giant
L('korvath', 'q1_appear', '[calm] Hand the child over, old man. You know what I am. You know I will not ask twice.', );
L('aldric', 'q1_refuse', '[angry] You will have to take them, and you will have to go through me.|[quietly] {target}. Run. Do not look back. RUN.');
L('aldric', 'q1_death', '[strained] Find the Open Hand. Find Dorran and Selene. Go—');
L('korvath', 'q1_after', '[calm] Let the child run. The road is long and I own most of it.');
// arrival: Wren catches up
L('wren_ward', 'q1_catchup', '[panting] {target}! Gods. I followed you both out — I saw the torches — I saw him.|[shaky] Aldric is dead. He is actually dead. What do we do. Tell me what we do.');
CH('q1_wren', [
  { id: 'kind', text: "We do what he said. The Open Hand. Stay close to me.", aff: { wren_ward: 1 }, reply: B('wren_ward', 'q1_wren_kind') },
  { id: 'cold', text: "Keep your voice down. Crying gets us found.", aff: { wren_ward: -1 }, reply: B('wren_ward', 'q1_wren_cold') },
  { id: 'dark', text: "We find the man in the black armour, and I take him apart.", heritage: 1, reply: B('wren_ward', 'q1_wren_dark') },
]);
L('wren_ward', 'q1_wren_kind', '[sniffs] Close. Yes. I can do close.|[trying to smile] I brought his letter. It was in his coat. There is an inn on it and two names.');
L('wren_ward', 'q1_wren_cold', '[quietly] Right. Fine. I am fine.|[flatly] I brought his letter. Two names and an inn. You can read it when you are done being a wall.');
L('wren_ward', 'q1_wren_dark', '[uneasy] You sounded like him just then. The armour one.|[quietly] There is a letter. An inn, two names. Let us go and be alive first.');
L('wren_ward', 'q1_join', '[calm] I am coming. Do not argue. I am the only one here who can open a lock, and you know it.');
Q(1, {
  departure: [B('aldric', 'q1_wake'), B('aldric', 'q1_tutorial')],
  openers: {
    0: [B('aldric', 'q1_nib', { choice: 'q1_nib' })],
    1: [B('aldric', 'q1_cobb')],
    2: [B('aldric', 'q1_road'), B('aldric', 'q1_ambush')],
  },
  closing: [
    B('korvath', 'q1_appear', { caption: 'A giant in black plate steps into the torchlight. Aldric puts himself in front of you.' }),
    B('aldric', 'q1_refuse'),
    B('aldric', 'q1_death', { death: true, caption: 'The sword goes through him. You run because he told you to.' }),
    B('korvath', 'q1_after', { to: 'aldric' }),
  ],
  arrival: [
    B('wren_ward', 'q1_catchup', { choice: 'q1_wren' }),
    B('wren_ward', 'q1_join', { recruit: ['wren_ward'] }),
  ],
});

// =====================================================================
// Q2 — The Open Hand
// =====================================================================
L('vess', 'q2_pair', '[giggling] Two orphans on a road at night. How sad. How convenient.|[sing-song] We are going the same way, you and we. The Open Hand. Then south, to where the iron goes bad.');
L('fennick', 'q2_pair', '[flatly] Ignore him. He is like this.|[calm] We are paid to look at the mines. You are going there. Four swords walk safer than two. That is the whole offer.');
CH('q2_pair', [
  { id: 'yes', text: "Walk with us, then. Keep the mage away from my sister.", recruit: ['vess', 'fennick'], set: { umbralRecruited: true }, reply: B('fennick', 'q2_pair_yes') },
  { id: 'no', text: "No. I don't know you and I don't like him.", set: { umbralRefused: true }, reply: B('vess', 'q2_pair_no') },
  { id: 'who', text: "Who pays you to look at mines?", reply: B('fennick', 'q2_pair_who') },
]);
L('fennick', 'q2_pair_yes', '[dry] Sister. Noted. Vess, you heard.|[calm] We will not be trouble until we are. I will tell you before then.');
L('vess', 'q2_pair_no', '[pouting] So rude. So lonely.|[cheerful] We will see you on the road anyway. Everyone ends up on the road.');
L('fennick', 'q2_pair_who', '[flatly] People who do not like their names said on roads.|[calm] The offer stands whether you like the answer. Yes or no.');
CH('q2_pair_who', [
  { id: 'yes', text: "Fine. Yes. But you answer to me out here.", recruit: ['vess', 'fennick'], set: { umbralRecruited: true }, reply: B('fennick', 'q2_pair_yes') },
  { id: 'no', text: "Then no.", set: { umbralRefused: true }, reply: B('vess', 'q2_pair_no') },
]);
L('wren_ward', 'q2_wolves', '[nervous] Wolves. Actual wolves. Aldric said the road was empty, not that it was hungry.|[quick] Front lane is you. I go behind and stab things. That is the plan. That is the whole plan.');
L('cassian', 'q2_squire', '[formal] Hold! I am Cassian, squire of the Order of the Dawning Flame, and these wolves are mine to clear.|[earnest] There is a den past the ridge. I would not refuse help. I would also not refuse a witness, if I am honest.');
CH('q2_cassian', [
  { id: 'join', text: "Then help us and we'll help you. Fall in.", recruit: ['cassian'], set: { cassianRecruited: true }, reply: B('cassian', 'q2_cassian_join') },
  { id: 'no', text: "We don't need a squire. Clear your own wolves.", reply: B('cassian', 'q2_cassian_no') },
  { id: 'tease', text: "A witness. So the Order sends you out alone and wants proof?", aff: { cassian: 1 }, reply: B('cassian', 'q2_cassian_tease') },
]);
L('cassian', 'q2_cassian_join', '[bright] You will not regret it. Well. You may. I am new. But you will not regret my trying.');
L('cassian', 'q2_cassian_no', '[stiff] As you say. Watch the den. They come in threes.');
L('cassian', 'q2_cassian_tease', '[flustered] It — that is exactly what they do, yes.|[recovering] I would still rather do it beside people than in front of a report. Fall in?');
CH('q2_cassian_tease', [
  { id: 'join', text: "Fall in.", recruit: ['cassian'], set: { cassianRecruited: true }, reply: B('cassian', 'q2_cassian_join') },
  { id: 'no', text: "Not this time.", reply: B('cassian', 'q2_cassian_no') },
]);
L('morwin', 'q2_steps', '[smug] There you are. Younger than the notice said. Poorer, too.|[casual] Nothing personal. A man in the city is paying very well for your head, and I have expenses.');
CH('q2_morwin', [
  { id: 'name', text: "Whose name is on the notice?", reply: B('morwin', 'q2_morwin_name') },
  { id: 'how', text: "How much am I worth?", reply: B('morwin', 'q2_morwin_how') },
  { id: 'kill', text: "Enough talking.", heritage: 1, reply: B('morwin', 'q2_morwin_kill') },
]);
L('morwin', 'q2_morwin_name', '[laughs] No name. There is never a name. A seal, a purse, a description. That is how it works.');
L('morwin', 'q2_morwin_how', '[mock-sad] Two hundred. Which is insulting, frankly, for the trouble of the road.');
L('morwin', 'q2_morwin_kill', '[cold] Agreed.');
L('wren_ward', 'q2_notice', '[reading] "Wanted. The ward of Aldric of Lanternhold. Two hundred gold, alive or otherwise." There is a seal. I do not know it.|[quietly] Somebody knew Aldric\'s name, and yours, before we left the keep.');
L('dorran', 'q2_meet', '[stammering] You — you are Aldric\'s. He wrote. He said — he said if you came alone, he was dead.|[quietly] I am Dorran. This is Selene. We knew him twenty years. I am sorry. I am so sorry.');
L('selene', 'q2_meet', '[calm] Grief later. Questions now. You were hunted inside Lanternhold — that means money and reach.|[calm] The iron goes bad at Dunmere. Whoever is fouling it has money and reach. We start there.');
CH('q2_selene', [
  { id: 'trust', text: "He said to find you. That's enough for me.", aff: { selene: 1, dorran: 1 }, reply: B('selene', 'q2_selene_trust') },
  { id: 'why', text: "Why would iron have anything to do with me?", reply: B('selene', 'q2_selene_why') },
  { id: 'alone', text: "I don't need minders. I need the man in black armour.", aff: { selene: -1 }, heritage: 1, reply: B('selene', 'q2_selene_alone') },
]);
L('selene', 'q2_selene_trust', '[softly] Then it is enough for us. Eat something. We leave at first light.');
L('selene', 'q2_selene_why', '[thoughtful] I do not know yet. I know Aldric asked us to be here the same month the ore turned. He did not believe in coincidence and neither do I.');
L('selene', 'q2_selene_alone', '[flatly] You need a healer, a shield, and someone who knows the road south. You have all three whether you want them or not.|[calm] Hate me on the way. It is a long way.');
L('dorran', 'q2_join', '[warm] We are w-with you. Both of us. He would have wanted it, and — and we want it.');
Q(2, {
  departure: [B('vess', 'q2_pair'), B('fennick', 'q2_pair', { choice: 'q2_pair' })],
  openers: {
    0: [B('wren_ward', 'q2_wolves')],
    1: [B('cassian', 'q2_squire', { choice: 'q2_cassian' })],
    2: [B('morwin', 'q2_steps', { choice: 'q2_morwin' })],
  },
  closing: [B('wren_ward', 'q2_notice')],
  arrival: [
    B('dorran', 'q2_meet'),
    B('selene', 'q2_meet', { choice: 'q2_selene' }),
    B('dorran', 'q2_join', { recruit: ['dorran', 'selene'] }),
  ],
});

// =====================================================================
// Q3 — South to Dunmere
// =====================================================================
L('ithrel', 'q3_thornbury', '[quietly] You are going south. So am I.|[flat] There is a bandit lord in the Gnashing Wood named Gorruk. He killed my wife on this road a year ago. You will meet him before I do, and I would rather be there when you do.');
CH('q3_ithrel', [
  { id: 'yes', text: "Ride with us. When we find him, he's yours.", recruit: ['ithrel'], set: { ithrelRecruited: true }, aff: { ithrel: 1 }, reply: B('ithrel', 'q3_ithrel_yes') },
  { id: 'no', text: "I have enough grief in this company already.", reply: B('ithrel', 'q3_ithrel_no') },
  { id: 'why', text: "Why would a bandit lord come to me?", reply: B('ithrel', 'q3_ithrel_why') },
]);
L('ithrel', 'q3_ithrel_yes', '[quietly] Mine. Yes. Thank you. I will not be pleasant company, but I will be useful.');
L('ithrel', 'q3_ithrel_no', '[flat] Then I will follow at a distance. You will not see me. You may hear the shots.');
L('ithrel', 'q3_ithrel_why', '[thoughtful] Because the same coin pays him and the men who want you dead. I have watched the couriers for a year. The seals match.');
CH('q3_ithrel_why', [
  { id: 'yes', text: "Then ride with us.", recruit: ['ithrel'], set: { ithrelRecruited: true }, aff: { ithrel: 1 }, reply: B('ithrel', 'q3_ithrel_yes') },
  { id: 'no', text: "Follow if you must. Not with us.", reply: B('ithrel', 'q3_ithrel_no') },
]);
L('lessa', 'q3_inn', '[pleasant] Sit. Have a drink. It is the last one, so make it a good one.|[smiling] Do not look for the door. I paid the boy to bar it.');
L('bramm', 'q3_plea', '[booming] YOU. You have swords and a face I trust. Pip trusts it too. Pip is my hamster. Pip is a good judge.|[urgent] Gnolls took my witch, Ysolde, to their fortress on the river. I am one man and one hamster. Help me get her back.');
L('aurelius', 'q3_offer', '[dripping] Do not listen to the ox. The woman is a Kalden witch and a menace, and the Crimson Wizards of Vashk will pay a hundred gold to have her — hm — permanently retired.|[bored] I would do it myself, but the gnolls are numerous and I am precious.');
CH('q3_bramm', [
  { id: 'rescue', text: "We're getting her out. Bramm, with me.", recruit: ['bramm'], set: { rescuedYsolde: true }, aff: { bramm: 2 }, reply: B('bramm', 'q3_bramm_yes') },
  { id: 'coin', text: "A hundred gold. Aurelius, you're hired.", recruit: ['aurelius'], set: { aurelius: true, brammEnemy: true }, heritage: 1, reply: B('aurelius', 'q3_aurelius_yes') },
  { id: 'both', text: "Bramm gets his witch. Then you and I talk about a hundred gold.", recruit: ['bramm'], set: { rescuedYsolde: true, aureliusStrung: true }, aff: { bramm: 1 }, reply: B('aurelius', 'q3_aurelius_strung') },
]);
L('bramm', 'q3_bramm_yes', '[roaring] Go for the EYES, {target}! Pip, hold on to something!');
L('aurelius', 'q3_aurelius_yes', '[delighted] Sensible. The ox will try to stop us on the river road. Do try not to let him.');
L('aurelius', 'q3_aurelius_strung', '[sour] You are stringing me along. Fine. I will follow and be unimpressed.');
L('bramm', 'q3_road_block', '[wounded] You took HIS coin? Over her? Then you go through me, and Pip will REMEMBER this.');
L('ysolde', 'q3_freed', '[formal] I am Ysolde of the Kalden lodges. You have my thanks and, it seems, my guard.|[quietly] You should know: I read auras. Yours has something old in it, and it is not asleep.');
L('bramm', 'q3_joined', '[cheerful] Ysolde says we go where you go. Pip agrees. So that is that.');
L('ysolde', 'q3_join', '[calm] Where the ward goes, we go. I would like to see what wakes in you.');
L('tollan', 'q3_mayor', '[harried] You are the ones from the north? Good. Good. The mine. Nobody will go down. Two crews vanished, the ore comes up rotten, the town is dying.|[pleading] Find what is fouling it. Kill it if it can be killed. Dunmere will pay what it has.');
CH('q3_tollan', [
  { id: 'fee', text: "Half up front. We've been paid in promises all week.", aff: { wren_ward: 1 }, set: { tollanPaid: true }, reply: B('tollan', 'q3_tollan_fee') },
  { id: 'yes', text: "We'll go down. Pay us when we come up.", aff: { selene: 1 }, reply: B('tollan', 'q3_tollan_yes') },
  { id: 'crews', text: "What happened to the crews?", reply: B('tollan', 'q3_tollan_crews') },
]);
L('tollan', 'q3_tollan_fee', '[wincing] Half. Fine. Fifty now. Do not tell the council I agreed to that.');
L('tollan', 'q3_tollan_yes', '[relieved] Bless you. Bless you. There is a temple of Aegis by the square if you come up bleeding.');
L('tollan', 'q3_tollan_crews', '[quietly] One man came back. He said there were kobolds, more than kobolds, and a voice below the third level giving them orders. Then he drank himself into the river.');
Q(3, {
  departure: [B('ithrel', 'q3_thornbury', { choice: 'q3_ithrel' })],
  openers: {
    0: [B('lessa', 'q3_inn')],
    1: [B('bramm', 'q3_plea'), B('aurelius', 'q3_offer', { choice: 'q3_bramm' })],
    2: [B('bramm', 'q3_road_block', { when: { flag: 'brammEnemy' } })],
  },
  closing: [
    B('ysolde', 'q3_freed', { when: { flag: 'rescuedYsolde' } }),
    B('bramm', 'q3_joined', { when: { flag: 'rescuedYsolde' } }),
    B('ysolde', 'q3_join', { when: { flag: 'rescuedYsolde' }, recruit: ['ysolde'] }),
  ],
  arrival: [B('tollan', 'q3_mayor', { choice: 'q3_tollan' })],
});

// =====================================================================
// Q4 — The Dunmere Mines
// =====================================================================
L('wren_ward', 'q4_down', '[whispering] It smells like a wet dog died in a forge. Four levels of this.|[quietly] If I go quiet down here it is not because I am scared. It is because I am scared.');
L('selene', 'q4_flooded', '[calm] Water on the second level. Somebody opened a channel on purpose.|[thoughtful] Kobolds do not plan. Whoever is below them does.');
L('grukhar', 'q4_chamber', '[hoarse] You. You are the ward. They said you would come, and they said I would be paid before you did.|[bitter] They lied about the second part. Listen — I have letters. Names. The whole rotten business. Let me walk and they are yours.');
CH('q4_grukhar', [
  { id: 'walk', text: "Leave the letters on the altar and walk. Now.", bypass: true, set: { grukharSpared: true }, aff: { ithrel: -1, cassian: -1 }, heritage: -1, reply: B('grukhar', 'q4_grukhar_walk') },
  { id: 'kill', text: "I'll take the letters off your body.", heritage: 1, reply: B('grukhar', 'q4_grukhar_kill') },
  { id: 'who', text: "Who lied to you? Say the name and you walk.", reply: B('grukhar', 'q4_grukhar_who') },
]);
L('grukhar', 'q4_grukhar_walk', '[relieved] Done. Done. The altar. Read the one with the ogre\'s mark. It names the courier.|[muttering] Veylan keep me. I am done with iron.');
L('grukhar', 'q4_grukhar_kill', '[snarling] Then come and take them, orphan.');
L('grukhar', 'q4_grukhar_who', '[laughing] A courier named Verlan in Thornbury, and above him something that calls itself Gorruk. Above THAT, I never met. Nobody meets it.|[wary] I said the names. Do I walk?');
CH('q4_grukhar_who', [
  { id: 'walk', text: "Walk.", bypass: true, set: { grukharSpared: true }, aff: { ithrel: -1 }, heritage: -1, reply: B('grukhar', 'q4_grukhar_walk') },
  { id: 'kill', text: "No.", heritage: 1, reply: B('grukhar', 'q4_grukhar_kill') },
]);
L('selene', 'q4_letters', '[reading] "Verlan. Hollister\'s Inn, Thornbury. The priest is to keep the ore fouled until the spring shipment. Gorruk has the north road."|[calm] A courier and a bandit lord. The mine is only the bottom of this.');
L('wren_ward', 'q4_letters', '[reading] "Verlan. Hollister\'s Inn, Thornbury. Keep the ore fouled until spring. Gorruk has the north road."|[quietly] A courier and a bandit lord. Aldric died over a shipping schedule. That cannot be all of it.');
L('tollan', 'q4_thanks', '[overjoyed] The crews went down this morning. Clean ore. Clean! Dunmere owes you more than it can pay, and here is what it can.');
// Dream 1
L('aldric', 'q4_dream', '[echoing] You are dreaming, and I am dead, and both of those are true at once.|[gentle] There is a throne in this dream. Do not sit in it. Do not look at it too long. I will tell you why when you are ready.|[fading] Something in your blood is waking. You can feed it or you can starve it. Choose.');
CH('q4_dream', [
  { id: 'reject', text: "I don't want whatever this is. Starve it.", heritage: -1, set: { dream1: 'reject' }, reply: B('aldric', 'q4_dream_reject') },
  { id: 'embrace', text: "Show me the throne.", heritage: 1, set: { dream1: 'embrace' }, reply: B('aldric', 'q4_dream_embrace') },
  { id: 'ask', text: "What am I, Aldric?", reply: B('aldric', 'q4_dream_ask') },
]);
L('aldric', 'q4_dream_reject', '[warm] Good. That is the harder road and the right one. You wake with a gift for closing wounds. Use it on others.');
L('aldric', 'q4_dream_embrace', '[sorrowful] I cannot stop you here. Only you can. You wake with a gift for opening wounds. Mind what it makes you want.');
L('aldric', 'q4_dream_ask', '[sad] The child of something that should have stayed dead. And mine. Both. The second is the one that matters, if you let it.|[fading] Choose, {target}. Feed it or starve it.');
CH('q4_dream_ask', [
  { id: 'reject', text: "Starve it.", heritage: -1, set: { dream1: 'reject' }, reply: B('aldric', 'q4_dream_reject') },
  { id: 'embrace', text: "Feed it.", heritage: 1, set: { dream1: 'embrace' }, reply: B('aldric', 'q4_dream_embrace') },
]);
Q(4, {
  departure: [B('wren_ward', 'q4_down')],
  openers: {
    1: [B('selene', 'q4_flooded', { when: { company: 'selene' } })],
    3: [B('grukhar', 'q4_chamber', { choice: 'q4_grukhar' })],
  },
  closing: [B('selene', 'q4_letters', { anyOf: ['selene', 'wren_ward'] })],
  arrival: [
    B('tollan', 'q4_thanks'),
    B('aldric', 'q4_dream', { choice: 'q4_dream', caption: 'That night you dream of a stone throne in a field of ash. Aldric stands beside it.', dream: true }),
  ],
});

// =====================================================================
// Q5 — The Bandit Camp
// =====================================================================
L('torvald', 'q5_sage', '[amused] You have been looking at me all week and deciding I am nobody. Good instinct, wrong man.|[calm] I am Torvald. Aldric was my friend for longer than this town has had walls. The courier is in Thornbury. The bandits are north, in the Gnashing Wood.|[dry] Do not ask me to come. I am far more use being mysterious somewhere else.');
CH('q5_torvald', [
  { id: 'why', text: "Why did Aldric die? You know. Say it.", reply: B('torvald', 'q5_torvald_why') },
  { id: 'help', text: "Then help. Actually help.", reply: B('torvald', 'q5_torvald_help') },
  { id: 'go', text: "North, then. Stay out of my way.", heritage: 1, reply: B('torvald', 'q5_torvald_go') },
]);
L('torvald', 'q5_torvald_why', '[gently] He died so you would live long enough to be told properly, by the right person, in the right place. That place is not a stable in Thornbury.|[calm] North. Find the letters. The letters will bring you to the truth faster than I would.');
L('torvald', 'q5_torvald_help', '[dry] I have. Twice. You did not see either time. That is what help from me looks like.|[warm] Go north. Bring the letters out. That is the help I need from you.');
L('torvald', 'q5_torvald_go', '[chuckling] Aldric said you would be like that. He said it fondly, mostly.');
L('verlan', 'q5_inn', '[nervous] I do not know you. I do not know any Grukhar. I am a wine merchant and I would like you to leave my table.');
CH('q5_verlan', [
  { id: 'beat', text: "Wrong answer.", reply: B('verlan', 'q5_verlan_beat') },
  { id: 'pay', text: "Fifty gold for the camp's location. Then you leave town.", gold: -50, bypass: true, set: { verlanPaid: true }, reply: B('verlan', 'q5_verlan_pay') },
  { id: 'pocket', text: "Wren. His coat.", when: { company: 'wren_ward' }, bypass: true, aff: { wren_ward: 1 }, reply: B('wren_ward', 'q5_verlan_pocket') },
]);
L('verlan', 'q5_verlan_beat', '[panicking] Wait — wait —');
L('verlan', 'q5_verlan_pay', '[greedy] Fifty. Yes. There is a map in my boot. The camp is past Holloway Vale, under the old oak line.|[scurrying] I was never here.');
L('wren_ward', 'q5_verlan_pocket', '[smug] Got it. Map, seal, and — ugh — a very old sausage.|[bright] Past Holloway Vale. Under the oaks. He did not even feel it.');
L('cassian', 'q5_patrol', '[uneasy] Burning Gauntlet. A patrol, this far south. They have someone at sword-point.');
L('ilvara', 'q5_patrol', '[cold] Yes, stare. Dark elf. Priestess. Fugitive. The bounty is real and these three would like to collect it.|[contemptuous] I healed a village of the coughing sickness on the way here. They are arresting me for having the wrong face. Decide what that makes you.');
CH('q5_ilvara', [
  { id: 'defend', text: "Let her go. She's under my protection.", set: { ilvaraSaved: true }, recruit: ['ilvara'], aff: { ilvara: 2, cassian: -2 }, reply: B('ilvara', 'q5_ilvara_defend') },
  { id: 'walk', text: "Not my fight. We keep moving.", bypass: true, aff: { cassian: 1, ilvara: -1 }, reply: B('ilvara', 'q5_ilvara_walk') },
  { id: 'sell', text: "There's a bounty? Then I'll take her in myself.", bypass: true, gold: 100, heritage: 1, set: { ilvaraSold: true }, aff: { cassian: -1, selene: -2 }, reply: B('ilvara', 'q5_ilvara_sell') },
]);
L('ilvara', 'q5_ilvara_defend', '[surprised] Protection. From you. How strange, and how useful.|[dry] Very well. I go where you go until I decide otherwise. Try to be interesting.');
L('ilvara', 'q5_ilvara_walk', '[flat] Of course. Walk on. Everyone does.');
L('ilvara', 'q5_ilvara_sell', '[venomous] You will remember this. I will make sure of it from wherever they put me.');
L('cassian', 'q5_cassian_leaves', '[quietly] I cannot ride beside a company that shelters that. Or beside those two from the Hand. I am sorry. I thought I could.|[formal] Find me at the Open Hand if you change your company. I hope you do.');
L('fennick', 'q5_camp', '[calm] There are three ways into a camp. Loud, quiet, or invited.|[dry] Vess and I can be invited. Recruiters do not look closely at faces that scare them.');
L('wren_ward', 'q5_camp', '[whispering] Or I go over the palisade and open the back gate while everyone is looking at the front.');
CH('q5_camp', [
  { id: 'recruits', text: "Get us invited.", when: { flag: 'umbralRecruited' }, bypass: true, set: { campInvited: true }, aff: { fennick: 1 }, reply: B('fennick', 'q5_camp_recruits') },
  { id: 'quiet', text: "Wren, the back gate.", when: { company: 'wren_ward' }, bypass: true, set: { campQuiet: true }, aff: { wren_ward: 1 }, reply: B('wren_ward', 'q5_camp_quiet') },
  { id: 'storm', text: "Loud. Front gate. Now.", heritage: 1, reply: B('wren_ward', 'q5_camp_storm') },
]);
L('fennick', 'q5_camp_recruits', '[flat] Walk like you have already killed someone today. Vess, do not smile.|[murmuring] We are in. The big tent is Gorruk\'s. The chained man is a spy. Do not look at him yet.');
L('wren_ward', 'q5_camp_quiet', '[breathless] Back gate is open. Two sentries are sleeping and one of them is going to have a headache.|[quiet] The big tent. There is a chained man in it who looks like he has jokes.');
L('wren_ward', 'q5_camp_storm', '[resigned] Loud it is. Gods. Go for the one with the horns first.');
L('cael', 'q5_tent', '[hoarse] Oh, wonderful. Visitors. Are you here for me or for the ogre? Say me. Say me.|[urgent] Cael Voss, Warden. The chest by the cot has letters with the Consortium\'s seal on every one. Take the chest. Take ME. In that order if you must.');
L('gorruk', 'q5_tent', '[booming] The orphan. In MY tent. Someone in the city is going to be very embarrassed when I send them your head.');
L('ithrel', 'q5_shot', '[very quietly] {target}. I have him. Clean line, no cover. Say yes.');
CH('q5_ithrel_shot', [
  { id: 'shoot', text: "Yes. Take it.", noEscape: true, set: { gorrukDead: true }, aff: { ithrel: 2 }, reply: B('ithrel', 'q5_shot_yes') },
  { id: 'hold', text: "Hold. I want him alive to answer questions.", aff: { ithrel: -2 }, set: { ithrelHeld: true }, reply: B('ithrel', 'q5_shot_no') },
]);
L('ithrel', 'q5_shot_yes', '[exhaling] Thank you. Whatever happens after this, thank you.');
L('ithrel', 'q5_shot_no', '[tight] Alive. Right. I have waited a year. I can wait for the end of a fight.');
L('gorruk', 'q5_escape', '[snarling] Not today, orphan. Not for you. The city will finish this.');
L('cael', 'q5_letters', '[grinning] Told you. Every one of them sealed. The Iron Consortium — the trading house in the city — is paying for the mine, the bandits, and you.|[serious] There is a name under theirs. A mage named Malvane, in the Mirkhollow. They call it "the other mine." I heard it twice.');
L('ithrel', 'q5_gone', '[cold] He walked out of that tent because you wanted him to. I will find him myself.|[flat] Do not follow me.');
L('ithrel', 'q5_dead', '[quietly] It is done. I thought I would feel taller. I feel like sleeping for a year.|[soft] I will stay, if you will have me. There is nothing else I was for.');
Q(5, {
  departure: [B('torvald', 'q5_sage', { choice: 'q5_torvald' })],
  openers: {
    0: [B('verlan', 'q5_inn', { choice: 'q5_verlan' })],
    1: [B('cassian', 'q5_patrol', { when: { company: 'cassian' } }), B('ilvara', 'q5_patrol', { choice: 'q5_ilvara' })],
    2: [B('fennick', 'q5_camp', { when: { company: 'fennick' } }), B('wren_ward', 'q5_camp', { choice: 'q5_camp' })],
    3: [B('cael', 'q5_tent'), B('gorruk', 'q5_tent'), B('ithrel', 'q5_shot', { when: { company: 'ithrel' }, choice: 'q5_ithrel_shot' })],
  },
  closing: [
    B('gorruk', 'q5_escape', { when: { not: 'gorrukDead' } }),
    B('cael', 'q5_letters'),
    B('ithrel', 'q5_gone', { when: { flag: 'ithrelHeld' }, dismiss: ['ithrel'], gone: ['ithrel'] }),
    B('ithrel', 'q5_dead', { when: { flag: 'gorrukDead' } }),
  ],
  arrival: [
    B('cassian', 'q5_cassian_leaves', { when: { recruited: 'cassian', any: [{ flag: 'ilvaraSaved' }, { recruited: 'vess' }] }, dismiss: ['cassian'], gone: ['cassian'] }),
  ],
});

// =====================================================================
// Q6 — Mirkhollow
// =====================================================================
L('selene', 'q6_forest', '[calm] The Mirkhollow. Old wood. It has its own druids and they do not like the Wardens either.|[quiet] Keep to the deer paths. Anything that looks like a road was made by something with a lot of legs.');
L('faelen', 'q6_web', '[cheerful] Hello! Yes, up here. In the web. It is exactly as embarrassing as it looks.|[charming] Faelen. Bounty hunter, mostly. I was after a wyvern head and the spiders took offence. Cut me down and I will owe you, and I am lovely to be owed to.');
CH('q6_faelen', [
  { id: 'cut', text: "Hold still.", recruit: ['faelen'], set: { faelenRecruited: true }, aff: { faelen: 1 }, reply: B('faelen', 'q6_faelen_cut') },
  { id: 'leave', text: "Spiders have to eat too.", heritage: 1, set: { faelenLeft: true }, reply: B('faelen', 'q6_faelen_leave') },
  { id: 'price', text: "What's the wyvern head worth?", aff: { faelen: 1 }, reply: B('faelen', 'q6_faelen_price') },
]);
L('faelen', 'q6_faelen_cut', '[relieved] Oh, you are my favourite person. I say that to everyone. This time I mean it.|[grinning] I will come along. Wyverns are that way and so, I suspect, is whatever you are looking for.');
L('faelen', 'q6_faelen_leave', '[calling after] Fair! Fair. If you change your mind I will be — well. Here.');
L('faelen', 'q6_faelen_price', '[delighted] Three hundred in Thornbury and a kiss from the magistrate. I am negotiating on the kiss.|[hopeful] Cut me down and we split it. Two hundred for you, the kiss for me.');
CH('q6_faelen_price', [
  { id: 'cut', text: "Deal.", recruit: ['faelen'], set: { faelenRecruited: true }, aff: { faelen: 1 }, reply: B('faelen', 'q6_faelen_cut') },
  { id: 'leave', text: "Keep the kiss. Keep the web.", heritage: 1, set: { faelenLeft: true }, reply: B('faelen', 'q6_faelen_leave') },
]);
L('nettle', 'q6_grove', '[fierce] Far enough. This wood is not a road. The Umbra hold it, and the Umbra say you turn around.|[low] Thornwise would rather you bled here. I would rather you spoke first. Speak.');
CH('q6_nettle', [
  { id: 'talk', text: "We're here for the men fouling the river with a mine. Same enemy as yours.", when: { any: [{ company: 'selene' }, { heritageMax: 0 }] }, bypass: true, recruit: ['nettle'], set: { druidsPeace: true }, aff: { nettle: 2, selene: 1 }, reply: B('nettle', 'q6_nettle_talk') },
  { id: 'fight', text: "Move, or be moved.", heritage: 1, set: { druidsFought: true }, reply: B('nettle', 'q6_nettle_fight') },
  { id: 'ask', text: "What has the mine done to the wood?", reply: B('nettle', 'q6_nettle_ask') },
]);
L('nettle', 'q6_nettle_talk', '[grudging] The mine. Yes. They poison the river and chain the men who dig. Thornwise wants to kill you; I want to kill THEM.|[decisive] I am coming with you. Thornwise can argue with the trees about it.');
L('nettle', 'q6_nettle_fight', '[snarling] Then the roots will have you. THORNWISE!');
L('nettle', 'q6_nettle_ask', '[bitter] Dead fish for a mile. Stags with sores. Men in chains walking to a hole in the hill every dawn.|[hard] Say you are here for the mine and I will believe you. Say anything else and I will not.');
CH('q6_nettle_ask', [
  { id: 'talk', text: "We're here for the mine.", when: { any: [{ company: 'selene' }, { heritageMax: 0 }] }, bypass: true, recruit: ['nettle'], set: { druidsPeace: true }, aff: { nettle: 2 }, reply: B('nettle', 'q6_nettle_talk') },
  { id: 'fight', text: "I'm here for whoever is in my way.", heritage: 1, set: { druidsFought: true }, reply: B('nettle', 'q6_nettle_fight') },
]);
L('faelen', 'q6_wyverns', '[bright] There she is. The matriarch. That head is worth three hundred and a kiss, and I am taking both.');
L('wren_ward', 'q6_wyverns', '[appalled] It has TEETH on its TAIL.');
L('selene', 'q6_gate', '[calm] Consortium livery on the guards. Kestrel — I know him. A mercenary who will guard anything for anyone.|[flat] He will not talk. Do not waste breath.');
L('selene', 'q6_fire', '[quiet] Sit. The forest is loud tonight and I want to say something before I lose the nerve.|[soft] Aldric wrote to us about you every year. Twenty letters. I feel like I have known you since you could walk, and I only met you a month ago. It is strange. It is not unwelcome.');
CH('q6_selene_fire', [
  { id: 'warm', text: "He wrote about you too. Not twenty letters. But enough.", aff: { selene: 2 }, reply: B('selene', 'q6_fire_warm') },
  { id: 'deflect', text: "You should sleep. It's a long walk to the mine.", reply: B('selene', 'q6_fire_deflect') },
  { id: 'dorran', text: "Dorran's a lucky man.", aff: { selene: 1, dorran: 1 }, reply: B('selene', 'q6_fire_dorran') },
]);
L('selene', 'q6_fire_warm', '[laughing softly] Enough. Yes. That is a very Aldric amount.|[warm] Goodnight, {target}. Wake me if the trees start walking.');
L('selene', 'q6_fire_deflect', '[dry] I should. You should. Neither of us will.|[calm] Goodnight.');
L('selene', 'q6_fire_dorran', '[fond] He is. He also snores like a bear in a barrel, so the luck goes both ways.|[warm] Goodnight, {target}. Do not tell him I said that.');
Q(6, {
  departure: [B('selene', 'q6_forest', { anyOf: ['selene', 'wren_ward'] })],
  openers: {
    0: [B('faelen', 'q6_web', { choice: 'q6_faelen' })],
    1: [B('nettle', 'q6_grove', { choice: 'q6_nettle' })],
    2: [B('faelen', 'q6_wyverns', { when: { company: 'faelen' } }), B('wren_ward', 'q6_wyverns', { when: { company: 'wren_ward', noCompany: 'faelen' } })],
    3: [B('selene', 'q6_gate', { when: { company: 'selene' } })],
  },
  closing: [],
  arrival: [B('selene', 'q6_fire', { when: { recruited: 'selene', alive: 'selene' }, choice: 'q6_selene_fire' })],
});
L('wren_ward', 'q6_forest', '[nervous] Old wood. Big trees. Things in the big trees.|[brave] I will go first. No I will not. You go first.');

// =====================================================================
// Q7 — The Iron Mine
// =====================================================================
L('dorran', 'q7_gate', '[grim] Slaves. They are working s-slaves down there. I can hear the chains from here.|[steady] I am going to the bottom for them, {target}. Whatever else we do. Tell me you are with me.');
CH('q7_dorran', [
  { id: 'with', text: "We're with you. Everyone comes out.", aff: { dorran: 2, selene: 1 }, reply: B('dorran', 'q7_dorran_with') },
  { id: 'mission', text: "The mage first. Then the slaves, if there's time.", aff: { dorran: -1 }, reply: B('dorran', 'q7_dorran_mission') },
]);
L('dorran', 'q7_dorran_with', '[fierce] Good. G-good. Front lane is mine. Nothing gets past me today.');
L('dorran', 'q7_dorran_mission', '[quiet] There will be time. I will m-make time.');
L('wren_ward', 'q7_cages', '[sick] They keep them in cages between shifts. Like dogs. Worse than dogs; I have seen dogs kept better.');
L('durnik', 'q7_cage', '[gravelly] Well. Either you are the new drivers or the old ones are dead. Which?|[hopeful] Durnik. Priest of the deep places. My clan dug this mine before the Consortium took it with paper and knives. I know every valve in it, including the one that drowns the bottom.');
CH('q7_durnik', [
  { id: 'free', text: "The old ones are dead. Get up; you're with us.", recruit: ['durnik'], set: { durnikFreed: true }, aff: { durnik: 2 }, reply: B('durnik', 'q7_durnik_free') },
  { id: 'leave', text: "Stay put. We'll be back for you.", set: { durnikLeft: true }, heritage: 1, reply: B('durnik', 'q7_durnik_leave') },
]);
L('durnik', 'q7_durnik_free', '[grunting up] With you. Aye. Mind the third level; Malvane keeps his study there and he does not like knocking.');
L('durnik', 'q7_durnik_leave', '[flat] Back for me. Aye. Everyone says that.');
L('malvane', 'q7_study', '[irritated] You have tracked mud through the ledgers. Do you know how long a clean ledger takes?|[cold] Guards. The Consortium has paid for this mine three times over. It will not pay for a fourth.');
L('durnik', 'q7_valve', '[urgent] The valve room. Turn the great wheel and the river takes the bottom two levels in the time it takes to say a prayer.|[hard] Your fighter went below for the chain-gang. He is not up yet.');
L('selene', 'q7_valve', '[tight] Dorran is still down there. {target}. Dorran is still DOWN THERE.');
CH('q7_flood', [
  { id: 'now', text: "Turn the wheel. Now.", bypass: true, set: { floodedEarly: true }, kill: ['dorran'], aff: { selene: -3, durnik: -1, wren_ward: -1 }, heritage: 1, reply: B('selene', 'q7_flood_now') },
  { id: 'wait', text: "Nobody touches that wheel until Dorran is up. Hold the room.", set: { waitedForDorran: true }, aff: { selene: 1, dorran: 1 }, reply: B('dorran', 'q7_flood_wait') },
]);
L('selene', 'q7_flood_now', '[screaming] NO — |[broken] He was coming up. He was coming UP. You heard the chains. You heard him.');
L('dorran', 'q7_flood_wait', '[shouting from below] Coming up! Nineteen of them and me! Hold the d-door, they are right behind us!');
L('dorran', 'q7_after', '[exhausted] Nineteen. All of them. Not one left in the dark.|[quiet] Thank you for holding. I heard you say it. I will not forget it.');
L('selene', 'q7_after_dead', '[hollow] Malvane\'s papers. Names in the city. Take them. I do not care.|[cold] I will finish this road because Aldric asked. Do not speak to me until it is done.');
L('selene', 'q7_papers', '[reading] Malvane wrote to three men at the Consortium\'s tower in Varenholm\'s Gate. Maddox Dreyne. Dorin Vask. Rennick.|[calm] The bandits are broken, the mine is drowned. The road to the city is open, and so are we.');
L('wren_ward', 'q7_papers', '[reading] Three names in the city. Maddox Dreyne, Dorin Vask, Rennick. The Consortium\'s tower.|[quiet] The road north is open now. Nothing between us and the Gate but the Gate.');
L('vess', 'q7_papers', '[sly] Those papers. Names, seals, routes. The Hand would pay a great deal to read them before the Gauntlet does.|[soft] Give them to Fennick tonight, and we stay quiet and useful for as long as you like.');
L('fennick', 'q7_papers', '[flat] He means it. So do I. It is the only thing we were ever here for.');
CH('q7_vess_papers', [
  { id: 'give', text: "Copy them tonight. The originals go to the city.", set: { umbralPapers: true }, aff: { vess: 2, fennick: 2, selene: -1, cassian: -1 }, reply: B('fennick', 'q7_papers_give') },
  { id: 'refuse', text: "No. And if either of you touches them, you leave.", set: { umbralBetrayed: true }, dismiss: ['vess', 'fennick'], gone: ['vess', 'fennick'], reply: B('vess', 'q7_papers_refuse') },
]);
L('fennick', 'q7_papers_give', '[nodding] Copies. Fair. You will not regret keeping us.|[dry] You may regret Vess. That is separate.');
L('vess', 'q7_papers_refuse', '[icy] Then we leave. And you will see us again, {target}, and it will not be as friends.|[giggling] It never was, really. Bye!');
// Dream 2
L('aldric', 'q7_dream', '[echoing] Closer to the throne this time. You did not walk here; it walked to you.|[grave] There are others like you. More than you would believe. All of you dreaming of the same chair.|[fading] Feed it or starve it. Same question. Harder answer.');
CH('q7_dream', [
  { id: 'reject', text: "Starve it. I'm not sitting in anyone's chair.", heritage: -1, set: { dream2: 'reject' }, reply: B('aldric', 'q7_dream_reject') },
  { id: 'embrace', text: "If there are others, I'd better be the strongest.", heritage: 1, set: { dream2: 'embrace' }, reply: B('aldric', 'q7_dream_embrace') },
]);
L('aldric', 'q7_dream_reject', '[proud] Twice now. It gets harder each time and you keep saying no. That is what courage is; nobody tells you it is boring.');
L('aldric', 'q7_dream_embrace', '[grieving] The strongest of them is waiting for you at the end of this road, and he thinks exactly that.|[fading] Please, {target}. Please be careful what you become on the way.');
Q(7, {
  departure: [B('dorran', 'q7_gate', { when: { company: 'dorran' }, choice: 'q7_dorran' })],
  openers: {
    1: [B('wren_ward', 'q7_cages', { when: { company: 'wren_ward' } })],
    2: [B('durnik', 'q7_cage', { choice: 'q7_durnik' })],
    3: [B('malvane', 'q7_study')],
    4: [B('durnik', 'q7_valve', { when: { company: 'dorran', flag: 'durnikFreed' } }), B('selene', 'q7_valve', { when: { company: 'dorran' }, anyOf: ['selene', 'wren_ward'], choice: 'q7_flood' })],
  },
  closing: [
    B('dorran', 'q7_after', { when: { flag: 'waitedForDorran' } }),
    B('selene', 'q7_after_dead', { when: { flag: 'floodedEarly', company: 'selene' } }),
    B('selene', 'q7_papers', { when: { not: 'floodedEarly' }, anyOf: ['selene', 'wren_ward'] }),
    B('wren_ward', 'q7_papers', { when: { flag: 'floodedEarly' } }),
  ],
  arrival: [
    B('vess', 'q7_papers', { when: { recruited: 'vess', not: 'umbralBetrayed' } }),
    B('fennick', 'q7_papers', { when: { recruited: 'fennick', not: 'umbralBetrayed' }, choice: 'q7_vess_papers' }),
    B('aldric', 'q7_dream', { choice: 'q7_dream', caption: 'The throne again. Nearer. Other figures stand in the ash now, hundreds of them, all looking at the same chair.', dream: true }),
  ],
});
L('wren_ward', 'q7_valve', '[frantic] Dorran is still down there with the chain-gang. If you turn that wheel he drowns with them.');

// =====================================================================
// Q8 — Varenholm's Gate
// =====================================================================
L('halloran', 'q8_span', '[gruff] Serpent\'s Span. Papers. — Oh. You are the company from the south. The one that drowned the Consortium\'s mine.|[plain] Halloran, Burning Gauntlet. Duke Halvard wants a word, but first I want two things done, and I would rather they were done by people the Consortium already hates.');
L('halloran', 'q8_jobs', '[plain] One: something in the sewers under the docks is eating dock-workers. Two: the Nine Lanterns trading house has stopped being the Nine Lanterns. Same faces, wrong people.|[flat] Do both. Then the Duke.');
CH('q8_halloran', [
  { id: 'yes', text: "Consider it done.", aff: { cassian: 1 }, reply: B('halloran', 'q8_halloran_yes') },
  { id: 'pay', text: "The Gauntlet pays for this, I assume.", aff: { wren_ward: 1 }, reply: B('halloran', 'q8_halloran_pay') },
  { id: 'why', text: "Why does the Duke want me?", reply: B('halloran', 'q8_halloran_why') },
]);
L('halloran', 'q8_halloran_yes', '[approving] Good answer. The docks are that way. Hold your breath.');
L('halloran', 'q8_halloran_pay', '[snorting] It pays. Not well. Nobody in this city pays well except the people you are fighting.');
L('halloran', 'q8_halloran_why', '[quiet] Because the iron crisis has a name now and it is the Iron Consortium, and you are the only people alive who have proof. Do the jobs. Bring the proof.');
L('wren_ward', 'q8_sewers', '[gagging] I have been in a mine, a fortress, and a spider nest this month and THIS is the worst. This is the worst place.');
L('durnik', 'q8_sewers', '[approving] Good stonework. Dwarven, some of it. Shame about the smell.');
L('faelen', 'q8_door', '[murmuring] Doorman. Big. Bored. I can talk us past him; bored men love a story.');
L('wren_ward', 'q8_door', '[whispering] Doorman. I can get us past him. He will not even remember we were here.');
L('fennick', 'q8_door', '[flat] Doorman. Leave him to me. Everyone has a price and his is written on his face.');
CH('q8_door', [
  { id: 'faelen', text: "Faelen. Talk.", when: { company: 'faelen' }, bypass: true, aff: { faelen: 1 }, reply: B('faelen', 'q8_door_faelen') },
  { id: 'wren_ward', text: "Wren. Quietly.", when: { company: 'wren_ward' }, bypass: true, aff: { wren_ward: 1 }, reply: B('wren_ward', 'q8_door_wren') },
  { id: 'fennick', text: "Fennick. Pay him.", when: { company: 'fennick' }, bypass: true, gold: -30, reply: B('fennick', 'q8_door_fennick') },
  { id: 'force', text: "We go through him.", reply: B('wren_ward', 'q8_door_force') },
]);
L('faelen', 'q8_door_faelen', '[pleased] — and that is how I lost the boot. He is still laughing. In, in, before he thinks about it.');
L('wren_ward', 'q8_door_wren', '[smug] Side window. He is asleep on his feet. Told you.');
L('fennick', 'q8_door_fennick', '[flat] Thirty gold and he has gone for a very long lunch.');
L('wren_ward', 'q8_door_force', '[sighing] Loud again. I am keeping a list.');
L('selene', 'q8_faces', '[disturbed] That is the merchant\'s face and it is not the merchant. Look at the eyes. Nothing lives behind them.|[hard] Shape-thieves. They wear you after they kill you. Do not let one get behind you.');
L('wren_ward', 'q8_faces', '[horrified] That is the merchant\'s face. That is his FACE and it is not him. Nothing is behind the eyes.');
L('halvard', 'q8_duke', '[weary] So. The company that drowned a mine. Halloran says you are rude and effective. I have use for both.|[precise] The Iron Consortium has been strangling this city\'s iron for a year and blaming Calder for it. War with Calder would kill ten thousand. I need their papers before the Council votes on the war.');
CH('q8_halvard', [
  { id: 'city', text: "Then we'll get them. For the city.", allegianceLean: 'gauntlet', aff: { cassian: 1, selene: 1 }, reply: B('halvard', 'q8_halvard_city') },
  { id: 'pay', text: "For the city, and for a price.", aff: { wren_ward: 1, faelen: 1 }, reply: B('halvard', 'q8_halvard_pay') },
  { id: 'blood', text: "The Consortium has been trying to kill me since Lanternhold. Why me, Duke?", set: { askedHalvard: true }, reply: B('halvard', 'q8_halvard_blood') },
]);
L('halvard', 'q8_halvard_city', '[nodding] Good. I will remember that when this is over. Dukes remember more than people think.');
L('halvard', 'q8_halvard_pay', '[dry] Five hundred on delivery. Halloran will scowl. Ignore him; he scowls at me too.');
L('halvard', 'q8_halvard_blood', '[careful] I do not know. I know they were hunting Aldric\'s ward before they were hunting anyone else, and Aldric was a Warden who spent twenty years hiding something in a library.|[quiet] Bring me the papers. Whatever they are hiding, it will be in them.');
Q(8, {
  departure: [B('halloran', 'q8_span'), B('halloran', 'q8_jobs', { choice: 'q8_halloran' })],
  openers: {
    0: [B('wren_ward', 'q8_sewers', { when: { company: 'wren_ward' } }), B('durnik', 'q8_sewers', { when: { company: 'durnik', noCompany: 'wren_ward' } })],
    1: [B('faelen', 'q8_door', { anyOf: ['faelen', 'wren_ward', 'fennick'], choice: 'q8_door' })],
    2: [B('selene', 'q8_faces', { when: { company: 'selene' } }), B('wren_ward', 'q8_faces', { when: { company: 'wren_ward', noCompany: 'selene' } })],
  },
  closing: [],
  arrival: [B('halvard', 'q8_duke', { choice: 'q8_halvard' })],
});

// =====================================================================
// Q9 — The Consortium Tower
// =====================================================================
L('halvard', 'q9_plan', '[precise] The Consortium is hiring swords. You walk in the front door as swords. The ledgers are on the top floor with three men who never leave it.|[dry] If you can do it without burning the tower down, the city would appreciate it. If you cannot, the city will understand.');
L('wren_ward', 'q9_lobby', '[whispering] Clerk. Two guards. A very long list of names on his desk and we are not on it.');
CH('q9_lobby', [
  { id: 'talk', text: "We're the company from the south. Malvane sent for us before the mine flooded.", when: { not: 'umbralBetrayed' }, bypass: true, set: { toweredQuiet: true }, reply: B('$speaker', 'q9_lobby_talk') },
  { id: 'fight', text: "Guards first. Clerk if he runs.", heritage: 1, reply: B('$speaker', 'q9_lobby_fight') },
  { id: 'wren_ward', text: "Wren, go see what's on that list.", when: { company: 'wren_ward' }, bypass: true, aff: { wren_ward: 1 }, reply: B('wren_ward', 'q9_lobby_wren') },
]);
L('wren_ward', 'q9_lobby_talk', '[impressed] He BELIEVED you. Malvane\'s name still opens doors. Third floor, he says. Do not touch anything.');
L('wren_ward', 'q9_lobby_fight', '[flat] So much for quiet. Stairs. Go.');
L('wren_ward', 'q9_lobby_wren', '[hushed] Got it. There is a name at the bottom in red: "the ward — as agreed." Whatever we do up there, somebody upstairs already knows we are coming.');
L('vess', 'q9_betrayal', '[bright] {target}! You found us! We work here now. It pays better than you did.|[giggling] Fennick says we should kill you quickly. I would like to take my time.');
L('fennick', 'q9_betrayal', '[flat] Nothing personal. You said that yourself once.');
L('lysandra', 'q9_floor', '[silken] Put the swords down; you will not need them on my floor. I am Lysandra. I keep Korvath Dreyne\'s bed warm and the Consortium\'s secrets warmer.|[calm] He is going to be a Grand Duke by month\'s end, and he is going to have you killed for it. I would rather the reverse. Shall we talk?');
CH('q9_lysandra', [
  { id: 'deal', text: "Talk. Quickly.", set: { lysandraBargain: true }, aff: { faelen: 1, ilvara: 1, cassian: -1 }, reply: B('lysandra', 'q9_lysandra_deal') },
  { id: 'arrest', text: "You'll talk to Duke Halvard. In chains.", set: { lysandraArrested: true }, aff: { cassian: 1 }, reply: B('lysandra', 'q9_lysandra_arrest') },
  { id: 'kill', text: "You share his bed. You share his end.", heritage: 1, set: { lysandraDead: true }, aff: { selene: -1, amara: -1 }, reply: B('lysandra', 'q9_lysandra_kill') },
]);
L('lysandra', 'q9_lysandra_deal', '[pleased] Korvath is not a merchant\'s son. He is something older, and he thinks you are the same. He wants a war so a great many people die at once. He believes that makes him a god.|[soft] When you need a way into the palace, come to me. I will have one. The price is his head and the Consortium afterward — for me.');
L('lysandra', 'q9_lysandra_arrest', '[amused] Chains. How lawful. Fine. I will tell Halvard everything and he will hang me for it, and Korvath will still be sworn in on time.|[bitter] Go upstairs. The top floor is where he keeps the truth about you.');
L('lysandra', 'q9_lysandra_kill', '[whispering] He will feel this. That is the only thing I am sorry for.');
L('selene', 'q9_top', '[reading] Maddox Dreyne, Dorin Vask, Rennick. Gone to Lanternhold — to LANTERNHOLD — for a summit with the Knights of the Lantern.|[cold] The three men behind all of this are sitting in the library you grew up in.');
L('wren_ward', 'q9_top', '[stunned] Lanternhold. They went HOME. The three men who paid to kill Aldric are sitting in his library.');
L('halvard', 'q9_book', '[grave] Then you go to Lanternhold. The keep takes a book as its toll; here is one worth the toll. Do not lose it.|[quiet] Find them. Bring me proof I can read to the Council. And {target} — whatever they are hiding about you, I would rather you heard it from a friend than from them.');
// Romance closer (dynamic options: every romanceable companion with aff >= 3)
L('selene', 'q9_romance', '[quiet] The road is nearly done and I have been putting this off. I am not good at this. Aldric would have laughed.|[steady] I am not asking for anything. I am telling you that if you asked, I would say yes. That is all. That is a great deal, for me.');
L('selene', 'q9_romance_yes', '[soft laugh] Then that is settled and I am going to sleep before I say anything foolish.|[warm] Goodnight. Actually goodnight.');
L('selene', 'q9_romance_no', '[gentle] Then it is said and it is done, and nothing between us changes. Sleep well.');
L('cassian', 'q9_romance', '[stumbling] I have written this out four times and burned it three. I — {target}. I have not stopped looking at you since the wolves, and I am not the sort who looks.|[earnest] If the Order asks I will say it was duty. It was not.');
L('cassian', 'q9_romance_yes', '[overwhelmed] Truly? I — yes. Yes. I will be a very good — I will be very GOOD at this, I promise.');
L('cassian', 'q9_romance_no', '[bravely] Then I am glad I said it and I will not say it again. Thank you for hearing it.');
L('ithrel', 'q9_romance', '[low] I buried the last person I loved on a road. I said I would not do this again.|[quiet] I would, though. With you. I wanted you to know it before the city, in case the city is the end of me.');
L('ithrel', 'q9_romance_yes', '[exhaling] Then I will try to live through the city. That is new. Thank you for giving me a reason.');
L('ithrel', 'q9_romance_no', '[calm] I understand. It was enough to say it. Sleep.');
L('ilvara', 'q9_romance', '[dry] Do not look so alarmed. I am not asking you to love me; surface-dwellers are terrible at it.|[soft] I am telling you that I have decided to stay, and that when you sit on that throne I mean to be standing beside it. Make of that what you will.');
L('ilvara', 'q9_romance_yes', '[satisfied] Good. You will not regret it, and if you do I will fix that.');
L('ilvara', 'q9_romance_no', '[shrugging] As you like. The offer keeps. I am patient in a way your kind is not.');
L('faelen', 'q9_romance', '[grinning] So. I flirt with everything. Trees. Wyverns. That doorman. You have noticed.|[suddenly serious] I have not meant a word of it since the web. I mean this one. Tell me to stop or tell me not to.');
L('faelen', 'q9_romance_yes', '[delighted] Do not stop. Noted. Written down. Framed.|[soft] Thank you. I will be insufferable about this for years.');
L('faelen', 'q9_romance_no', '[light] Stop it is. Friends, then, and I am very good at that too.');
L('amara', 'q9_romance', '[quiet] I loved a man who wanted to be a god. I am not proud of it, and I am not sorry for it.|[steady] I do not know what I want from you. I know that when you kept your word at the gate, something in me turned toward you like a plant toward a window. Say something, or do not.');
L('amara', 'q9_romance_yes', '[exhaling] Then we will find out what it is together. After the altar. If there is an after.');
L('amara', 'q9_romance_no', '[calm] That is fair. I have asked enough of you for one life. The altar, then.');
L('wren_ward', 'q9_romance_none', '[teasing] Nobody is in love with you. Good. It would have been unbearable.|[fond] Sleep. Lanternhold in the morning.');
Q(9, {
  departure: [B('halvard', 'q9_plan')],
  openers: {
    0: [B('wren_ward', 'q9_lobby', { anyOf: ['wren_ward', 'selene', 'faelen', 'durnik'], choice: 'q9_lobby' })],
    1: [B('vess', 'q9_betrayal', { when: { flag: 'umbralBetrayed' } }), B('fennick', 'q9_betrayal', { when: { flag: 'umbralBetrayed' } })],
    2: [B('lysandra', 'q9_floor', { choice: 'q9_lysandra' })],
  },
  closing: [B('selene', 'q9_top', { anyOf: ['selene', 'wren_ward'] })],
  arrival: [B('halvard', 'q9_book'), B('selene', 'q9_romance', { dynamic: 'romance' })],
});
L('selene', 'q9_lobby', '[murmuring] A clerk with a list and two guards who are paid to believe him.');
L('faelen', 'q9_lobby', '[murmuring] Clerk. List. Guards. I love a lobby.');
L('durnik', 'q9_lobby', '[gravelly] Clerk with a list. Two guards. Good stone, again. Shame.');
L('selene', 'q9_lobby_talk', '[quiet] He believed it. Third floor. Do not touch anything.');
L('selene', 'q9_lobby_fight', '[flat] Stairs, then.');
L('faelen', 'q9_lobby_talk', '[grinning] He believed it! Third floor. Touch nothing, he says, as if.');
L('faelen', 'q9_lobby_fight', '[cheerful] Stairs it is.');
L('durnik', 'q9_lobby_talk', '[grunting] Third floor. Do not touch anything. Good advice for a tower.');
L('durnik', 'q9_lobby_fight', '[grim] Stairs.');

// =====================================================================
// Q10 — Return to Lanternhold
// =====================================================================
L('sarn', 'q10_ring', '[quiet] You are Aldric\'s ward. I knew him. Not well; well enough to be sorry.|[calm] Take this ring. It was his, once. And know this: the three men inside deserve whatever you decide to give them. Nobody will weep.');
CH('q10_sarn', [
  { id: 'take', text: "...Thank you. Who are you?", set: { sarnRing: true }, reply: B('sarn', 'q10_sarn_take') },
  { id: 'refuse', text: "I don't take gifts from strangers on roads.", aff: { wren_ward: 1 }, reply: B('sarn', 'q10_sarn_refuse') },
  { id: 'threat', text: "If this is a trick, I'll find you.", heritage: 1, set: { sarnRing: true }, reply: B('sarn', 'q10_sarn_threat') },
]);
L('sarn', 'q10_sarn_take', '[soft] Sarn. Nobody. Wear it inside; the keepers will know it. Go well.');
L('sarn', 'q10_sarn_refuse', '[amused] Wise. Aldric taught you that. Go well anyway.');
L('sarn', 'q10_sarn_threat', '[pleased] I believe you would. Go well, {target}.');
L('hadrian', 'q10_gate', '[cold] A book buys you the door. It does not buy you my good opinion. Aldric left this keep with you and came back as a corpse. Do not make a habit of it.');
L('ambrose', 'q10_gate', '[kind] Ignore him. He mourns like a wall. — Come and find me in the upper reading room before you do anything else. Aldric left something with me. For you. For now.');
L('wren_ward', 'q10_home', '[strange] It smells the same. Ink and dust and the priests\' soup. I thought it would feel like home and it feels like a trap.');
L('maddox', 'q10_summit', '[startled] Guards — no. No, hold. I know who you are.|[shaking] Maddox Dreyne. I run the Consortium\'s Gate office. I did not order Aldric killed. I did not order YOU killed. That was — that was my son. My foster-son. He does not answer to me anymore.');
L('vask', 'q10_summit', '[bluster] Kill them, Maddox, they have swords in a LIBRARY —');
CH('q10_summit', [
  { id: 'kill', text: "Three names on a letter. Three men in a room. Easy arithmetic.", heritage: 1, set: { leadersKilled: true }, aff: { cassian: -1, selene: -1, ilvara: 1 }, reply: B('maddox', 'q10_summit_kill') },
  { id: 'talk', text: "Your son. Say his name.", bypass: true, set: { leadersSpared: true }, reply: B('maddox', 'q10_summit_talk') },
  { id: 'arrest', text: "You'll answer to Halvard. All three of you. Nobody dies in a library.", bypass: true, set: { leadersSpared: true, leadersArrested: true }, aff: { cassian: 1 }, heritage: -1, reply: B('maddox', 'q10_summit_arrest') },
]);
L('maddox', 'q10_summit_kill', '[terrified] He will not stop when we are dead. He will not STOP —');
L('maddox', 'q10_summit_talk', '[whispering] Korvath. Korvath Dreyne. I found him in a gutter and I raised him to count money, and he has been counting something else since a tutor filled his head with prophecies.|[broken] He is in this keep tonight. I do not know what face he is wearing.');
L('maddox', 'q10_summit_arrest', '[relieved] Yes. Yes. Halvard. Anything. Take us out of here before he —');
L('ambrose', 'q10_letter', '[gently] Sit. Read it. I will stay.|[quiet] Aldric wrote it the year he brought you here. He made me swear to give it to you only when someone had already tried to tell you the wrong way.');
L('aldric', 'q10_letter', '[echoing, read aloud] "If you are reading this, I failed to tell you myself, and I am sorry. Your mother was one of many. Your father was Morrak, the god of murder, in the last year before he died — and he sired children so that one of them might one day take his place. You are one. So is the man who killed me. He is your brother. He believes the throne is his. It is not, unless you decide it is."');
CH('q10_letter', [
  { id: 'grief', text: "He raised a monster and loved it anyway.", heritage: -1, aff: { selene: 1, wren_ward: 1 }, set: { letter: 'grief' }, reply: B('ambrose', 'q10_letter_grief') },
  { id: 'anger', text: "Twenty years and he never said a word. He should have told me.", aff: { wren_ward: -1 }, set: { letter: 'anger' }, reply: B('ambrose', 'q10_letter_anger') },
  { id: 'hunger', text: "A throne. And a brother sitting in my seat.", heritage: 1, set: { letter: 'hunger' }, reply: B('ambrose', 'q10_letter_hunger') },
]);
L('ambrose', 'q10_letter_grief', '[soft] He raised a child. What the child became was always going to be the child\'s own work. He knew that. He hoped.');
L('ambrose', 'q10_letter_anger', '[sad] He tried, every year. He wrote it out and burned it. He thought one more year of not knowing was one more year of you being only his.');
L('ambrose', 'q10_letter_hunger', '[frightened] Do not — {target}. He wrote the last line for exactly that look on your face. Read it again.');
L('hadrian', 'q10_arrest', '[thundering] Three men are dead in my reading room and this — this THING was seen leaving it. Take them. Take all of them.');
L('hadrian', 'q10_arrest_spared', '[thundering] Three men are dead in my reading room — found at midnight, throats opened — and this company was the last to speak to them. Take them. Take all of them.');
L('ambrose', 'q10_escape', '[urgent] The catacombs. There is a way to the shore under the old tombs. Hadrian does not know it; Aldric did. Go, and do not trust any face you meet down there. Not even mine.');
L('grell', 'q10_catacombs', '[bored] Down here, then. Good. Fewer witnesses and no keepers.|[professional] Grell. Your brother sends his regards and would like this finished before breakfast.');
L('wren_ward', 'q10_double', '[Wren\'s voice, wrong] {target}. Thank the gods. I got separated — come here, come HERE, we have to go —');
L('aldric', 'q10_double', '[Aldric\'s voice, wrong] {target}. I am not dead. It was a trick — a Warden trick — come to me, child, come here —');
CH('q10_double', [
  { id: 'strike', text: "Wrong voice. Strike first.", set: { wrenHurt: true }, dismiss: ['wren_ward'], reply: B(['selene', 'ilvara', 'faelen'], 'q10_double_strike') },
  { id: 'question', text: "What did I steal from the priests' kitchen when I was nine?", when: { company: 'wren_ward' }, aff: { wren_ward: 2 }, set: { wrenKept: true }, reply: B('wren_ward', 'q10_double_question') },
  { id: 'listen', text: "...Aldric?", when: { noCompany: 'wren_ward' }, heritage: 1, set: { listenedToDouble: true }, reply: B(['selene', 'ilvara', 'faelen'], 'q10_double_listen') },
]);
L('selene', 'q10_double_strike', '[sharp] Two of them — and the real Wren was BEHIND it, {target}, you cut her — she is breathing. She is breathing. She is not walking out of here on her own.|[grim] I will get her to the surface. Go on without us.');
L('wren_ward', 'q10_double_question', '[real Wren, furious] The HONEY. It was the honey, and Brother Tobbin still blames the cat — that thing wearing my face does not know that, so STAB IT.');
L('selene', 'q10_double_listen', '[urgent] That is not him. {target}. That is NOT HIM. It is already reaching for your throat — move!');
L('ilvara', 'q10_double_strike', '[approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.');
L('ilvara', 'q10_double_listen', '[sharp] That is not your father. Kill it before it kisses you.');
L('faelen', 'q10_double_strike', '[wincing] Right call, wrong result — the real Wren was behind it. She is breathing. I will carry her out; go.');
L('faelen', 'q10_double_listen', '[shouting] Not him! NOT him! It has teeth, {target}!');
L('selene', 'q10_shore', '[weary] The shore. Air. We are out.|[hard] Every keeper in Lanternhold thinks we killed three men tonight, and the man who did it was inside those walls wearing someone\'s face.');
L('wren_ward', 'q10_shore', '[shaking] Out. We are out. I am never going home again, am I.|[small] He was IN there. He was in the library, with us.');
// Dream 3
L('aldric', 'q10_dream', '[echoing] You know now. I am sorry it was a letter.|[grave] He is your brother and he will be a god if enough people die at once. That is the whole of his plan. It is not a stupid plan.|[fading] Last time I ask. Feed it, or starve it.');
CH('q10_dream', [
  { id: 'reject', text: "Starve it. I'll stop him as me.", heritage: -1, set: { dream3: 'reject' }, reply: B('aldric', 'q10_dream_reject') },
  { id: 'embrace', text: "If it takes a god to stop a god, then feed it.", heritage: 1, set: { dream3: 'embrace' }, reply: B('aldric', 'q10_dream_embrace') },
]);
L('aldric', 'q10_dream_reject', '[at peace] Then I did enough. Go and finish it, and come home to whoever is waiting.');
L('aldric', 'q10_dream_embrace', '[quiet] Then I hope I am wrong about what that costs. I have been wrong before. Not about this. Go.');
Q(10, {
  departure: [B('sarn', 'q10_ring', { choice: 'q10_sarn' })],
  openers: {
    0: [B('hadrian', 'q10_gate'), B('ambrose', 'q10_gate'), B('wren_ward', 'q10_home', { when: { company: 'wren_ward' } })],
    1: [B('maddox', 'q10_summit'), B('vask', 'q10_summit', { choice: 'q10_summit' })],
    2: [
      B('ambrose', 'q10_letter', { caption: 'The upper reading room. Ambrose sets a sealed letter in front of you. The wax is twenty years old.' }),
      B('aldric', 'q10_letter', { choice: 'q10_letter', caption: 'You read it twice. Then you read the last line a third time.' }),
      B('hadrian', 'q10_arrest', { when: { flag: 'leadersKilled' } }),
      B('hadrian', 'q10_arrest_spared', { when: { flag: 'leadersSpared' } }),
      B('ambrose', 'q10_escape'),
      B('grell', 'q10_catacombs'),
    ],
    3: [B('wren_ward', 'q10_double', { when: { company: 'wren_ward' }, choice: 'q10_double' }), B('aldric', 'q10_double', { when: { noCompany: 'wren_ward' }, choice: 'q10_double' })],
  },
  closing: [B('selene', 'q10_shore', { anyOf: ['selene', 'wren_ward'] })],
  arrival: [
    B('aldric', 'q10_dream', { choice: 'q10_dream', caption: 'The throne is close enough to touch. A man in black armour is already sitting in it, and he is smiling at you like a brother.', dream: true }),
  ],
});

// =====================================================================
// Q11 — The Hunted City
// =====================================================================
L('wren_ward', 'q11_posters', '[reading] "Wanted, for the murder of Grand Duke Edran Silverbrook and the Consortium summit at Lanternhold: the ward of Aldric and company." That is your face. That is a BAD drawing of your face.|[quiet] Halloran is dead. Lucan Marr commands the Gauntlet now, and he is the one who signed this.');
L('selene', 'q11_posters', '[cold] Grand Duke Silverbrook was murdered last night and they have put your name on it. Halloran is dead too. A man named Lucan Marr runs the Gauntlet now.|[calm] Korvath will be sworn in as the new Duke within days. He has moved everything into place while we were underground.');
L('selene', 'q11_doors', '[calm] Three ways into that palace, and we will not get a second try.|[measured] Halvard is dying; cure him and the Gauntlet is ours. Lysandra offered a way in, for a price. And the thieves under the Undervault will sell us a door if we owe them after.');
CH('q11_allegiance', [
  { id: 'gauntlet', text: "We find Halvard and we save him. We do this lawfully.", allegiance: 'gauntlet', aff: { cassian: 2, selene: 1, faelen: -1 }, reply: B('$speaker', 'q11_alleg_gauntlet') },
  { id: 'consortium', text: "Lysandra. Korvath's head for her Consortium. I can live with that.", when: { flag: 'lysandraBargain' }, allegiance: 'consortium', aff: { ilvara: 1, cassian: -2 }, heritage: 1, reply: B('$speaker', 'q11_alleg_consortium') },
  { id: 'thieves', text: "The thieves. A debt is cheaper than a Duke.", allegiance: 'thieves', aff: { faelen: 2, wren_ward: 1, cassian: -1 }, reply: B('$speaker', 'q11_alleg_thieves') },
]);
L('selene', 'q11_alleg_gauntlet', '[approving] Lawfully. Aldric would have said the same, and then he would have cheated a little. Let us find the Duke.');
L('selene', 'q11_alleg_consortium', '[flat] Her. Fine. I will hold my nose. Do not let her hold anything of yours.');
L('selene', 'q11_alleg_thieves', '[dry] Fen Nightstep never forgets a debt. Neither will you. Very well — the Undervault.');
L('wren_ward', 'q11_alleg_gauntlet', '[nodding] The Duke. All right. I like a Duke who owes us.');
L('wren_ward', 'q11_alleg_consortium', '[uneasy] Lysandra. I do not trust her smile. I do not trust anything about her. But she does have a door.');
L('wren_ward', 'q11_alleg_thieves', '[grinning] Fen! Yes. I was hoping you would say that. Thieves are honest about what they are.');
L('idris', 'q11_healer', '[oily] The Duke is resting. He must not be disturbed. I am his physician and I will thank you to —|[dropping the voice] — ah. You. The face on the posters. How very tiresome.');
L('halvard', 'q11_cured', '[weak] Poison. Slow. He was — the physician was — I could not make my mouth work to say it.|[rallying] Korvath. It was always Korvath. Get me to my own guard and I will get you into that coronation.');
L('amara', 'q11_docks', '[steady] Put the swords away. If I wanted you dead I would have done it from the rooftop.|[grave] I am Amara. I love Korvath Dreyne, and I helped him kill your father, and I am asking you to stop him. Not kill him. Stop him. There is a difference, and it matters to me more than my own life.');
CH('q11_amara', [
  { id: 'promise', text: "If it can be done without killing him, I'll do it that way. You have my word.", bypass: true, set: { promisedAmara: true }, aff: { amara: 3, ithrel: -1 }, heritage: -1, reply: B('amara', 'q11_amara_promise') },
  { id: 'refuse', text: "He killed Aldric. He dies.", bypass: true, aff: { amara: -2, ithrel: 1 }, reply: B('amara', 'q11_amara_refuse') },
  { id: 'lie', text: "Of course. You have my word.", bypass: true, set: { liedToAmara: true }, heritage: 1, aff: { amara: 1 }, reply: B('amara', 'q11_amara_lie') },
]);
L('amara', 'q11_amara_promise', '[exhaling] Thank you. I did not expect that.|[quiet] The coronation is in three nights. Two people called Ravel and Kessa hold the invitations in the Undervault. Take them from them; they will not give them up.');
L('amara', 'q11_amara_refuse', '[cold] Then we will meet at the gate of the Undercity, and one of us will not walk past the other.|[flat] Ravel and Kessa hold the invitations. Undervault. Take them; it does not change what I said.');
L('amara', 'q11_amara_lie', '[searching] ...Your word. Yes. — Ravel and Kessa, the Undervault. The invitations. Go.');
L('ravel', 'q11_undervault', '[grinning] Kessa. Kessa, look. It is the poster. In person! Do we get the reward if we kill it ourselves?');
L('kessa', 'q11_undervault', '[bored] The reward is a thousand and the invitations are worth more. Stop talking and start bleeding them.');
L('halvard', 'q11_way', '[stronger] Two invitations and a Duke who owes you his life. Belt — Orlan — will hold the doors. Mira will hold the Council. You hold the evidence.|[grave] He will not go quietly. He will run for the Undercity. When he does, do not let him reach the altar first.');
L('fen', 'q11_way', '[soft] Two invitations, and a debt to the Undervault that you will pay when I say. Fair?|[softer] Fair. Here is what nobody told you: under the palace is the old city. Under the old city is a temple. He is going there when it falls apart. So are you.');
L('lysandra', 'q11_way', '[silken] Two invitations and a bargain kept. His head; my Consortium. I will have a carriage at the palace steps.|[cool] When it goes wrong — and it will — he will run for the Undercity. I will show you the way down. Nobody else knows it but Amara.');
Q(11, {
  departure: [B('wren_ward', 'q11_posters', { anyOf: ['wren_ward', 'selene'] }), B('selene', 'q11_doors', { anyOf: ['selene', 'wren_ward'], choice: 'q11_allegiance' })],
  openers: {
    1: [B('idris', 'q11_healer')],
    2: [B('amara', 'q11_docks', { choice: 'q11_amara' })],
    3: [B('ravel', 'q11_undervault'), B('kessa', 'q11_undervault')],
  },
  closing: [B('halvard', 'q11_cured', { when: { allegiance: 'gauntlet' } })],
  arrival: [
    B('halvard', 'q11_way', { when: { allegiance: 'gauntlet' } }),
    B('fen', 'q11_way', { when: { allegiance: 'thieves' } }),
    B('lysandra', 'q11_way', { when: { allegiance: 'consortium' } }),
  ],
});
L('wren_ward', 'q11_doors', '[thinking] Three doors. Halvard, if we can save him. Lysandra, if you can stand her. Or Fen Nightstep and a debt.');

// =====================================================================
// Q12 — The Coronation
// =====================================================================
L('selene', 'q12_steps', '[low] Borrowed silks, real steel, two invitations. Everyone in that hall is either a guest or a shape-thief and there is no way to tell which until the knives come out.|[calm] Stay near the dukes. He needs them dead more than he needs you.');
L('wren_ward', 'q12_steps', '[itching] I hate silk. I hate silk SO much. — There he is. On the dais. Smiling. He has a lovely smile. I want to put it through a wall.');
L('orlan', 'q12_hall', '[booming] Blades! Blades in the hall! Mira — Mira, to me —');
CH('q12_dukes', [
  { id: 'orlan', text: "Orlan first. He's the one with the sword.", set: { protectedOrlan: true }, reply: B('orlan', 'q12_dukes_orlan') },
  { id: 'mira', text: "Mira first. She's the one who'll believe us.", set: { protectedMira: true }, reply: B('mira', 'q12_dukes_mira') },
  { id: 'korvath', text: "Neither. Korvath. Now, while he's on the dais.", heritage: 1, set: { wentForKorvath: true }, reply: B('selene', 'q12_dukes_korvath') },
]);
L('orlan', 'q12_dukes_orlan', '[roaring] HA! With me, then! Mira, get BEHIND something!');
L('mira', 'q12_dukes_mira', '[sharp] Good. Keep them off me and I will keep the Council listening. That is the only thing that matters in this room.');
L('selene', 'q12_dukes_korvath', '[shouting] The dukes are DYING, {target} — we cannot hold both if you run at him —');
L('korvath', 'q12_reveal', '[calm, unmasked] Enough. Put it down, all of you. Let the child speak. I would like to hear what my brother — my sister — my BLOOD has to say to a hall full of the dead.');
CH('q12_face', [
  { id: 'evidence', text: "Malvane's ledgers. Maddox's confession. Lysandra's letters. Every duke here can read.", aff: { cassian: 1, selene: 1 }, reply: B('korvath', 'q12_face_evidence') },
  { id: 'aldric', text: "You killed the only father either of us ever had.", heritage: -1, aff: { wren_ward: 1 }, reply: B('korvath', 'q12_face_aldric') },
  { id: 'throne', text: "You're sitting in my seat, brother.", heritage: 1, aff: { ilvara: 1, cassian: -1 }, reply: B('korvath', 'q12_face_throne') },
]);
L('korvath', 'q12_face_evidence', '[amused] Paper. Of course. Aldric\'s child brings paper to a coronation.|[cold] It does not matter. The war is already in their mouths. Ostwin — take me down.');
L('korvath', 'q12_face_aldric', '[quiet] He was never mine. He chose you. He could have chosen both of us and he chose you.|[cold] Ostwin. Take me down.');
L('korvath', 'q12_face_throne', '[delighted] THERE you are. I knew it. I KNEW it was in you.|[warm] Come and take it, then. Come to the altar and take it from me. Ostwin — take me down.');
L('ostwin', 'q12_teleport', '[dry] My boy. This way. — You lot: enjoy the rear-guard. They were expensive.');
L('mira', 'q12_council', '[shaken] The Council has read it. The vote on the war is dead, and so is his claim.|[steady] He went into the ground. Orlan is bleeding but standing. Go and finish it, and bring me a head or a prisoner; I will take either.');
L('orlan', 'q12_council', '[wheezing] Mira is dead. He put a knife in her while the whole hall watched.|[grim] The vote is dead too; she made sure of that first. Go and finish him. I will hold the door until you come back or he does.');
L('fen', 'q12_council', '[soft] Two dead dukes and a hall full of witnesses. The Undervault will take you down; the Gauntlet is too busy counting bodies.|[softer] The debt grows, {target}. It always does.');
Q(12, {
  departure: [B('selene', 'q12_steps', { anyOf: ['selene', 'wren_ward'] })],
  openers: {
    0: [B('orlan', 'q12_hall', { choice: 'q12_dukes' })],
    1: [B('korvath', 'q12_reveal', { choice: 'q12_face', caption: 'The armoured giant from the Griffon Road pulls off the face of a Grand Duke\'s guest. Under it is a man who looks like you.' })],
    2: [B('ostwin', 'q12_teleport', { caption: 'A ring of frost. He and his tutor are gone. The rear-guard is not.' })],
  },
  closing: [],
  arrival: [
    B('mira', 'q12_council', { when: { not: 'dukeDead' } }),
    B('orlan', 'q12_council', { when: { flag: 'dukeDead', not: 'bothDukesDead' } }),
    B('fen', 'q12_council', { when: { flag: 'bothDukesDead' } }),
  ],
});

// =====================================================================
// Q13 — The Undercity
// =====================================================================
L('faelen', 'q13_maze', '[hushed] The thieves\' maze. Every third flagstone is a trap and every fourth is a thief. I know the path; follow my feet exactly.');
L('wren_ward', 'q13_maze', '[hushed] The thieves\' maze. I can read it — half of it is Lanternhold locks, the cheap kind. Follow me exactly.');
CH('q13_maze', [
  { id: 'follow', text: "Lead.", bypass: true, aff: { faelen: 1, wren_ward: 1 }, reply: B('$speaker', 'q13_maze_follow') },
  { id: 'cut', text: "No time. Straight through.", heritage: 1, reply: B('$speaker', 'q13_maze_cut') },
]);
L('faelen', 'q13_maze_follow', '[murmuring] Left. Left. Do not step there. — And we are through, and nobody even bled. I love being right.');
L('faelen', 'q13_maze_cut', '[sighing] Straight through. Watch the flagstones, then, and try to bleed on the thieves and not on me.');
L('wren_ward', 'q13_maze_follow', '[murmuring] Left. Again. Not that one. — Through. Nobody bled. Tell Aldric I was paying attention.');
L('wren_ward', 'q13_maze_cut', '[groaning] Straight through. Fine. Loud list is getting long.');
L('amara', 'q13_gate', '[quiet] I said one of us would not walk past the other.|[steady] I am still asking. Stop him. Do not kill him. And if you cannot promise me that, then draw, because I will not let you reach him without it.');
CH('q13_amara_gate', [
  { id: 'fight', text: "Then draw.", set: { amaraDead: true }, kill: ['amara'], aff: { ithrel: 1 }, heritage: 1, reply: B('amara', 'q13_gate_fight') },
  { id: 'pass', text: "Stand aside. I keep my promises.", when: { flag: 'promisedAmara' }, bypass: true, set: { amaraPassed: true }, reply: B('amara', 'q13_gate_pass') },
  { id: 'join', text: "Come with us. Help me stop him the way you want him stopped.", when: { flag: 'promisedAmara', affMin: ['amara', 3] }, bypass: true, recruit: ['amara'], set: { amaraJoined: true }, aff: { amara: 2 }, reply: B('amara', 'q13_gate_join') },
  { id: 'lie', text: "Stand aside. He'll live.", when: { not: 'promisedAmara' }, bypass: true, set: { amaraPassed: true, liedToAmara: true }, heritage: 1, reply: B('amara', 'q13_gate_lie') },
]);
L('amara', 'q13_gate_fight', '[sad] Then draw.');
L('amara', 'q13_gate_pass', '[stepping aside] Go. I will be at the altar before you, on my knees, asking him the same thing. He will not listen to me. He might listen to you.');
L('amara', 'q13_gate_join', '[startled] With — yes. Yes. I know the way; I have walked it a hundred times. Stay behind me at the stairs.');
L('amara', 'q13_gate_lie', '[searching your face] ...Go, then. If you are lying, I will know it at the altar.');
L('jarem', 'q13_street', '[sneering] The brother. Or the sister. It does not matter which — Korvath says the blood is the same and the blood is what burns.|[cold] Cultists! Light the street!');
L('gorruk', 'q13_again', '[roaring] YOU. Twice. TWICE you walk into my tent. There is no city to run to this time, orphan.');
L('ithrel', 'q13_gorruk', '[very quietly] Mine. You said. Say it again.');
L('lucan', 'q13_steps', '[sneering] The Gauntlet stands with the new Duke. The old one is dying and the Council is a room full of corpses.|[cold] I signed your poster myself. Let me sign the rest of it.');
Q(13, {
  departure: [B('wren_ward', 'q13_return', { when: { flag: 'wrenHurt' }, recruit: ['wren_ward'] })],
  openers: {
    0: [B('faelen', 'q13_maze', { anyOf: ['faelen', 'wren_ward'], choice: 'q13_maze' })],
    1: [B('amara', 'q13_gate', { when: { not: 'amaraDead' }, choice: 'q13_amara_gate' })],
    2: [B('jarem', 'q13_street')],
    3: [B('gorruk', 'q13_again', { when: { not: 'gorrukDead' } }), B('ithrel', 'q13_gorruk', { when: { not: 'gorrukDead', company: 'ithrel' } })],
    4: [B('lucan', 'q13_steps')],
  },
  closing: [],
  arrival: [B('amara', 'q9_romance', { dynamic: 'romance', when: { company: 'amara' }, quiet: true })],
});
L('wren_ward', 'q13_return', '[stiff, bandaged] I heard you were going under the city without me. Absolutely not.|[fierce] I am stitched, I am furious, and I still open locks better than anyone here. Move over.');

// =====================================================================
// Q14 — The Temple of Morrak
// =====================================================================
L('selene', 'q14_sanctum', '[low] A temple to a dead god, still swept, still lit. Somebody has been praying here for twenty years.|[steady] Whatever he says at the altar, {target}, remember who raised you. Then do what you have to.');
L('wren_ward', 'q14_sanctum', '[whispering] It is warm down here. It should not be warm.|[fierce] Whatever he says in there — you are Aldric\'s. Not his. Aldric\'s.');
L('ilvara', 'q14_sanctum', '[reverent] Do you feel it? The stone remembers him. Morrak. It would remember you too, if you let it.');
L('wren_ward', 'q14_mirrors', '[horrified] That is ME. That is all of us. They are wearing US.');
L('selene', 'q14_mirrors', '[cold] Our faces. Every one. Kill them quickly; do not look at the eyes.');
L('korvath', 'q14_altar', '[warm] You came. I hoped you would. Every other one of us I have found, I have had to hunt; you walked here on your own feet.|[calm] Sit with me a moment before we do this. Sit — there, in that chair. It has been waiting for one of us since before we were born.');
L('amara', 'q14_plea', '[kneeling] Korvath. Please. Look at me. It does not have to be the altar. It can be a cell and a window and me visiting every week for the rest of your life.');
L('korvath', 'q14_plea_answer', '[gently] Amara. My love. Get up; you are kneeling in ash.|[cold] No.');
CH('q14_last', [
  { id: 'aldric', text: "Aldric chose me. He would have chosen you too, if you had let him.", heritage: -1, reply: B('korvath', 'q14_last_aldric') },
  { id: 'brother', text: "Brother. I'm sorry for what they did to you. I'm still going to stop you.", aff: { amara: 1, selene: 1 }, reply: B('korvath', 'q14_last_brother') },
  { id: 'throne', text: "Get out of my chair.", heritage: 1, aff: { ilvara: 1 }, reply: B('korvath', 'q14_last_throne') },
]);
L('korvath', 'q14_last_aldric', '[flinching] He did not know me. He had a choice between two children in a gutter and he took the one that cried less.|[rising] Enough. Draw.');
L('korvath', 'q14_last_brother', '[very quiet] Sorry. Nobody has said that to me in thirty years.|[rising] It changes nothing. Draw, brother. Sister. Blood.');
L('korvath', 'q14_last_throne', '[laughing] YES. Yes. Come and take it. Whichever of us stands up from this floor gets to be a god.');
// resolution
L('korvath', 'q14_beaten', '[on his knees, bleeding] Well. Well. There it is.|[strangely calm] The chair is right there, {target}. Someone is going to sit in it. You, me, or the next one of us who walks down those stairs. Choose.');
CH('q14_resolution', [
  { id: 'kill', text: "Nobody sits in it. Starting with you.", ending: 'kill', reply: B('korvath', 'q14_res_kill') },
  { id: 'gauntlet', text: "You go up those stairs in chains. Amara asked. I promised.", when: { any: [{ allegiance: 'gauntlet' }, { flag: 'promisedAmara' }, { company: 'amara' }] }, ending: 'gauntlet', reply: B('korvath', 'q14_res_gauntlet') },
  { id: 'usurp', text: "I sit in it. Move.", when: { heritageMin: 2 }, ending: 'usurp', reply: B('korvath', 'q14_res_usurp') },
  { id: 'walk', text: "Sit in it, then. Alone. I'm going home.", when: { heritageMax: -2 }, ending: 'walk', reply: B('korvath', 'q14_res_walk') },
]);
L('korvath', 'q14_res_kill', '[closing his eyes] He chose right, then. Good. Good. I am so tired of choosing.');
L('korvath', 'q14_res_gauntlet', '[laughing weakly] Chains. Amara — Amara, you have won, do you hear me — you have —|[quiet] Fine. A window. Every week. Fine.');
L('korvath', 'q14_res_usurp', '[grinning through blood] THERE. There it is. I was right about you.|[dying] It is warm, is it not. The chair. It is so warm.');
L('korvath', 'q14_res_walk', '[bewildered] You — no. No, you cannot just — it is RIGHT THERE —|[alone, as you climb] ...it is right there.');
Q(14, {
  departure: [B('selene', 'q14_sanctum', { anyOf: ['selene', 'wren_ward', 'ilvara'] })],
  openers: {
    1: [B('wren_ward', 'q14_mirrors', { anyOf: ['wren_ward', 'selene'] })],
    2: [B('korvath', 'q14_altar', { caption: 'The altar is a throne of black stone. Your brother sits in it with his helmet in his lap.' }), B('amara', 'q14_plea', { when: { any: [{ company: 'amara' }, { flag: 'amaraPassed' }] } }), B('korvath', 'q14_plea_answer', { when: { any: [{ company: 'amara' }, { flag: 'amaraPassed' }] }, to: 'amara' }), B('korvath', 'q14_altar_last', { choice: 'q14_last' })],
  },
  closing: [B('korvath', 'q14_beaten', { choice: 'q14_resolution', caption: 'It is over. He is on his knees between you and the chair.' })],
  arrival: [],
});
L('korvath', 'q14_altar_last', '[patient] Say what you came to say. I have waited thirty years to hear it.');

// =====================================================================
// Companion banter (round 2 of a fight) and travel lines — text only
// =====================================================================
L('wren_ward', 'banter', '[shouting] Left one! The left one is looking at YOU!|[breathless] I am fine! I am behind a thing! Keep going!|[gleeful] Got his purse. And his knife. And his — never mind, keep fighting.');
L('dorran', 'banter', '[steady] H-hold the line. Hold it. Nothing gets past.|[grunting] Shield is up. Hit them while they hit me.|[shouting] Selene! Behind you!');
L('selene', 'banter', '[calm] Breathe. The one in front is slower than he looks.|[sharp] Mind the mage. I will mind the rest.|[dry] If you die, I will be very annoyed. Do not.');
L('vess', 'banter', '[giggling] Oh, he is BURNING. Look at him go.|[sing-song] More, more, more — |[delighted] I love this company. Nobody screams at me.');
L('fennick', 'banter', '[flat] Back lane. Poison. Done.|[calm] The big one has a bad knee. Use it.|[dry] Vess, stop laughing, it puts them off.');
L('cassian', 'banter', '[shouting] For the Dawning Flame! — sorry. Habit.|[earnest] On me! I can take it!|[strained] I am fine! I am — mostly fine!');
L('ithrel', 'banter', '[quiet] Loosing.|[flat] The archer is mine. Leave him.|[cold] Again.');
L('bramm', 'banter', '[roaring] PIP SAYS GO FOR THE EYES!|[booming] Nobody touches the witch! NOBODY!|[gleeful] Ha HA! Did you SEE that?');
L('ysolde', 'banter', '[calm] Frost. Hold him still.|[formal] Your aura flares when you fight. Interesting.|[cool] Bramm, the left. Pip, be quiet.');
L('aurelius', 'banter', '[bored] Do try to keep them off me; I am the expensive one.|[smug] Burning. Obviously.|[sneering] Barely worth the spell.');
L('ilvara', 'banter', '[contemptuous] Bleed, then, if you must.|[cool] Wound them. I will decide who heals.|[dry] Surface-dwellers. Always the front lane.');
L('faelen', 'banter', '[grinning] Loosing, loosing, — got him, and he was handsome, too.|[cheerful] Behind them! I am behind them!|[light] If I die, tell the magistrate I was thinking of her.');
L('nettle', 'banter', '[snarling] The roots have him.|[fierce] Trees do not forgive. Neither do I.|[low] Bleed into the soil. Good.');
L('durnik', 'banter', '[gravelly] Wall. I am the wall.|[grunting] Hit them. I have them.|[calm] The deep places keep me. Keep going.');
L('amara', 'banter', '[exact] Two blades. Two throats. Next.|[steady] Watch the flank. I have the front.|[quiet] Not like this. Quickly. Clean.');

// =====================================================================
// Epilogue paragraphs (§5) — assembled by C3.epilogue(game)
// =====================================================================
D.CAMPAIGN3_EPILOGUE = {
  ending: {
    hero: 'Korvath Dreyne died — or was dragged up the stairs — in the last hour before dawn. The Council read the ledgers aloud in the square. The war with Calder was never declared. Nobody in Varenholm\'s Gate knows what you are, and the ones who suspect have decided not to say.',
    monster: 'Korvath Dreyne died at the altar and the city cheered you for it. They did not see what you saw in his eyes when the chair was empty, and they do not know that some nights you go back down the stairs alone to look at it.',
    usurper: 'You sat down. It was warm. Amara left the city; Ilvara did not. The Council thanked you, the war was never declared, and the shape-thieves in the sewers have started calling you by a title you did not choose.',
    mercy: 'Korvath Dreyne lives in a cell under the Gauntlet\'s hall with one window and one visitor a week. The ledgers were read aloud, the war died with the vote, and the chair under the city is still empty. You made sure of that.',
    ascetic: 'You left him in the chair and climbed. Halfway up you heard him start to laugh, and then stop. The keepers of the altar found the throne empty at dawn and nobody knows where he went. You went home. You did not look back.',
  },
  allegiance: {
    gauntlet: 'Duke Halvard recovered. He kept his word: the wanted posters came down in a day and the company\'s name went up in the Gauntlet\'s hall in their place.',
    consortium: 'Lysandra took the Consortium, kept her bargain, and has written to you twice about "opportunities." You have not answered. Yet.',
    thieves: 'Fen Nightstep has not called in the debt. He says the Undervault is patient. You have started checking the shadows in your own room.',
    none: 'The Council gave you a medal and a pension and would prefer you left the city. You have not decided.',
  },
  dukes: {
    both: 'Both dukes lived to see the vote. Orlan tells the story with more blood in it every time.',
    one: 'Duke Mira Vashti was buried with the honours of the city. Orlan has not spoken of the hall since.',
    none: 'The Council of Four is a Council of One. Halvard governs alone and badly, and blames nobody but Korvath.',
  },
  companion: {
    wren_ward: { present: 'Wren opened a lockshop on the harbour road. She has never once locked the door.', gone: 'Wren went back to Lanternhold with a scar under her ribs and a story that Brother Tobbin still does not believe.', dead: '' },
    dorran: { present: 'Dorran stopped stammering the day the mine slaves were freed. He has not started again.', gone: '', dead: 'Dorran is buried in the Mirkhollow above the drowned mine. Selene chose the stone. Nineteen names are cut under his.' },
    selene: { present: 'Selene is rebuilding the Warden house on the Shore Road. She says the letters Aldric wrote were mostly about you, and mostly right.', gone: 'Selene returned to the Wardens. She does not write.', dead: '' },
    vess: { present: 'Vess and Fennick sent the Umbral Hand a copy of everything and then, oddly, stayed. Fennick says the pay is worse and the company is better.', gone: 'Vess and Fennick were found in the Consortium tower with the guards\' pay in their pockets. The Umbral Hand has not asked after them.', dead: '' },
    fennick: { present: '', gone: '', dead: '' },
    cassian: { present: 'Cassian was knighted by the Order of the Dawning Flame. He wrote the report himself, and left out nothing, and the Order has not stopped talking about it.', gone: 'Cassian went back to the Order. He sends a letter every solstice and never mentions Ilvara or the Hand.', dead: '' },
    ithrel: { present: 'Ithrel planted a tree over his wife\'s grave on the north road and then, to everyone\'s surprise, stayed. He hunts now. Only game.', gone: 'Ithrel is somewhere north, still hunting an ogre-mage who may or may not still be alive. He does not want to be found.', dead: '' },
    bramm: { present: 'Bramm and Ysolde took a house by the river. Pip has a room. Pip has a very small bed.', gone: '', dead: '' },
    ysolde: { present: '', gone: '', dead: '' },
    aurelius: { present: 'Aurelius returned to Vashk with a hundred gold and an insufferable story. The Crimson Wizards have promoted him. They will regret it.', gone: '', dead: '' },
    ilvara: { present: 'Ilvara stayed. She has a chapel now, of a kind, and the bounty on her was quietly torn up by someone who owed you a favour.', gone: 'Ilvara was taken in chains toward the coast. The wagon did not arrive. Nobody has looked very hard.', dead: '' },
    faelen: { present: 'Faelen collected the wyvern bounty and, he claims, the kiss. He has opened a very small, very profitable business finding things people lost on purpose.', gone: 'Faelen is still in the web, in a sense. He was last seen in Thornbury telling the story with himself as the hero.', dead: '' },
    nettle: { present: 'Nettle went back to the Mirkhollow. The druids have not forgiven her. The trees, she says, have.', gone: '', dead: '' },
    durnik: { present: 'Durnik went back to the Mirkhollow mine with a charter and forty of his clan. It is called the Nineteen now.', gone: 'Durnik is presumed to have died in the cages. The mine is closed.', dead: '' },
    amara: { present: 'Amara visits the cell every week. She brings bread. He eats it.', gone: 'Amara left the city on the morning tide. She did not say where. She did not look at you.', dead: 'Amara is buried at the gate of the Undercity, where she stood.' },
  },
  romance: {
    selene: { line: 'Selene is at the Warden house. So are you, most nights.', favoured: 'She says Aldric would have liked how it ended. Then she says he would have cheated a little. Then she laughs.' },
    cassian: { line: 'Cassian asked you to attend his knighting. You did. The Order pretended not to notice you.', favoured: 'He calls it the right ending. He calls everything the right ending. This time you agree with him.' },
    ithrel: { line: 'Ithrel sleeps through the night now. He says it is the tree. You suspect it is not the tree.', favoured: 'He said "mine" once more, at the altar, and then never again. He did not need to.' },
    ilvara: { line: 'Ilvara sleeps in the chapel and, when it suits her, elsewhere. She is very clear that it suits her.', favoured: 'She was standing beside the chair when you sat in it. She has not stopped smiling. It is not a warm smile. It is yours.' },
    faelen: { line: 'Faelen still flirts with everything. He says it is professional courtesy. He comes home to one door.', favoured: 'The Undervault knows his face now, and yours, and treats you both as family. Fen says that is the debt, paid.' },
    amara: { line: 'Amara brings bread to the cell every week. You walk her there and wait outside. She has never once asked you to come in.', favoured: 'She said you kept your word. She said it like it was the strangest thing anyone had ever done for her.' },
  },
  heritage: {
    reject: 'The dreams stopped. The chair is a chair.',
    neutral: 'You still dream of ash, some nights. Less often. You have stopped counting.',
    embrace: 'You dream of the chair every night now. Some nights it is empty. Some nights it is not, and the one sitting in it has your face.',
  },
};
})();
