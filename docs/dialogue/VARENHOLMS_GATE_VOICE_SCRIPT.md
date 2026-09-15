# Varenholm's Gate — Voice Script

The story campaign in playing order: every scene, caption, spoken line and pick-a-line choice, quest by quest. The player is silent — their picked lines are shown on screen and never recorded. Bracketed tags are ElevenLabs v3 delivery cues and stay in the text sent to the API. Names are never spoken: the game shows the name; the recorded "spoken" form drops {target}. Conditions in _italics_ say when a line plays; most scenes have alternatives depending on who is riding along and what the player chose earlier.

Part 2 is the casting appendix: one section per character with who they are, where they are from, how they speak (region and accent notes for picking a voice), and every clip in one place. Fill in the **Voice ID** for each character in `tools/voice_casting.json` (key = character id). Clips land at `audio/vo/campaign/<id>/<beat>_<n>.mp3`; `tools/c3_voice_lines.json` lists every clip to generate.

## The regions and their voices

Every named person comes from somewhere, and the somewhere is written into how they talk — word choice, rhythm and idiom, never phonetic spelling. Use these when casting.

| Region | Real-world flavour | Names | How they speak |
|---|---|---|---|
| Lanternhold and the hill keeps | Ethiopian highlands | Amharic (Tesfaye, Hiwot, Dawit, Abba Gebre, Yohannes) | Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder. |
| Thornbury, the Shore Road and the Wardens' country | Georgia, USA | Southern American (Beau, Delphine, Cal Boone, Lurleen, Merle) | Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers. |
| Dunmere and the dwarf clans | Welsh valleys | Welsh (Gethin Pryce, Dai Morgan) | Sing-song cadence, sentences that end where they started ("I'll go down, I will"). "Bach", "now then", "there's lovely", "duw". Understatement about danger. |
| The Mirkhollow and the Umbra circle | Kenyan | Kikuyu and Swahili (Wanjiru, Mzee Kamau) | Direct and rhythmic. "Sawa", "pole pole", "eh?" at the end of a challenge, "Mzee" for elders. Swahili proverbs in translation ("haste has no blessing"). |
| Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves | Nigerian (Yoruba and Igbo) | Yoruba / Igbo (Adebayo, Olumide, Folasade, Emeka, Kolade, Folake, Tunde) | Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama". |
| The elves of the eastern woods | Japanese | Japanese (Itsuki, Kaito) | Understated and exact. Apology before request, gratitude after. Few words; the pause carries the feeling. "-san" for strangers of standing; never contractions when serious. |
| The deep cities of the dark elves | Arabic | Arabic (Layla) | Elevated, poetic, unhurried contempt. "By the deep", "ya" before a name, "God willing" said without belief. Images from stone, night and water. |
| Kalden, the witch-country beyond the steppe | Turkish | Turkish (Bahadır, Yasemin, the hamster Fındık) | Warm and emphatic. "Abla" / "abi" for elder sister and brother, "canım" for the beloved, "vallahi" as an oath, "inşallah" for hope. Hospitality as a rule of war. |
| Vashk and its Crimson Wizards | Indian | Sanskrit-derived (Devendra) | Ornate, formal, self-satisfied. "Kindly", "most assuredly", "it is quite evident". Compliments that are insults; never raises his voice. |
| The Umbral Hand | Jamaican | Caribbean (Desmond, Winston) | Light patois rhythm through word order and idiom, not spelling: "man", "you see it?", "no worry yourself", "one-one coco full basket". Dry warmth from Winston; sing-song from Desmond. |
| The Order of the Dawning Flame (chapter house in the sun-lands) | Mexican | Spanish (Santiago) | Courtly and earnest. "Señor", "señora", "with respect", "God keep you". Formal address to everyone, including enemies; oaths sworn on the Flame. |
| Monsters | invented | orcish / ogrish (Grukhar, Gorruk) | Guttural, no real-world accent. |

---

# Part 1 — The script in playing order

## Quest 1 — The Road from Lanternhold  *(Prologue)*

_Tesfaye says the two of you leave before dawn. He does not say why. Two men in the keep have already tried to make sure you never find out._

### Setting out

*Lanternhold, after the last bell. Tesfaye is standing in your doorway with a lamp, dressed for the road.*

**TESFAYE**  `q1_wake`

> [low, urgent] Wake, my child, and dress. Not the library robe — the travelling coat, and your boots. We leave Lanternhold tonight.
>
> [calm] I know you have questions. I have dreaded them for twenty years, and I will answer every one once we are past the gate and out of the hearing of these walls. Not before. Trust me in this as you have trusted me in everything.
>

> **What do you say?**
> 1. "Why tonight? What has happened?" — _question — the choice returns_
> 2. "You have never been afraid of anything. You are afraid now." — _question — the choice returns_
> 3. "I will get my things."
>

**TESFAYE** *(reply to 1)*  `q1_wake_why`

> [quietly] A message came at dusk, of the kind that is not written down. It said that people who wish you harm know where you are. Lanternhold, which I chose because nothing here changes and no one ever comes, has stopped being safe. That is all I will say inside these walls.
>

**TESFAYE** *(reply to 2)*  `q1_wake_afraid`

> [a breath] Yes. I am afraid. I have never lied to you and I will not begin tonight. Fear is not shameful, my child; it is a messenger. Mine says to have you on the road before the moon is up.
>

**TESFAYE** *(reply to 3)*  `q1_wake_go`

> [warm] Good.
>

**TESFAYE**  `q1_wake_ask`

> [careful] One thing before you go, and answer it truly. Has anyone spoken to you today whom you did not know? A pilgrim, a pedlar, a man asking directions. Anyone.
>

> **What do you say?**
> 1. "No one. The same faces as every day."
> 2. "A pilgrim at the well asked my name. I told him." — _sets toldName_
> 3. "Why? Who would come here?"
>

**TESFAYE** *(reply to 1)*  `q1_seen_nobody`

> [relieved] Then they are not inside the walls yet, and we have the hours I hoped for. Take what coin you have to Dawit at the storehouse and buy a true blade; the practice swords stay behind. Meet me at the gate at the second bell, and if anyone stops you between here and there — anyone — do not argue with them. Come to me.
>

**TESFAYE** *(reply to 2)*  `q1_seen_pilgrim`

> [very quiet] You told him. — No. It is not your fault; you had no reason not to. It means they are inside already, and it means we go now, not at the bell. Take your coin to Dawit at the storehouse and buy a true blade, and come straight back to me. Do not stop for anyone.
>

**TESFAYE** *(reply to 3)*  `q1_seen_why`

> [gently] Because the people I have feared for twenty years have found the one place I hoped they never would. That is the whole answer, and I will give you the rest on the road. Take your coin to Dawit at the storehouse and buy a true blade. Then the gate, at the second bell.
>

### Scene 1: The storehouse

*The storehouse. A stranger in a road-cloak is standing between the shelves. He is not one of the keepers.*

**NIB**  `q1_store`

> [easy] Evening. You'd be the old man's ward, then. Younger than I was told, and about to make somebody a good deal richer.
>
> [almost kindly] No call to make this hard. I've a purse to earn and a road to be on before sun-up, and you've got — what, a practice sword? Stand still and I'll make it quick.
>

> **What do you say?**
> 1. "Who paid you? Say the name and I let you walk." — _question — the choice returns; sets nibSeal_
> 2. "Richer for whom?" — _question — the choice returns_
> 3. "You have picked the wrong storehouse."
> 4. "Go. Run, and I will not follow." — _no fight; blood -1; sets nibSpared_
>

**NIB** *(reply to 1)*  `q1_nib_who`

> [a shrug] There's never a name, friend. A seal on a letter, a purse left at an inn, a description of a face. That's how it's done, and it's done that way so men like me can't answer questions like yours.
>

**NIB** *(reply to 2)*  `q1_nib_richer`

> [amused] For somebody who don't want to be spoken of. Two hundred in gold for the ward of Tesfaye of Lanternhold, alive or otherwise. That's a heap of money for a scholar's foundling, and I'll be honest, I did wonder why.
>

**NIB** *(reply to 3)*  `q1_nib_draw`

> [flat] Reckon I have.
>

**NIB** *(reply to 4)*  `q1_nib_run`

> [backing away] ...You're either real kind or real foolish, and I ain't paid enough to find out which.
>

### Scene 2: The priests' quarters

_(if not nibSpared)_

**TESFAYE**  `q1_cobb`

> [hard] Two of them, inside the keep, on the same night. Somebody bought a keeper's silence for that, and I mean to know whose. Later.
>
> [urgent] The one in the storehouse. Did he say anything before it ended? Who sent him — a name, a house, a mark?
>

> **What do you say?**
> 1. "No name. He said there is only ever a seal on a letter and a purse at an inn." — _if flag nibSeal_
> 2. "Two hundred in gold for me, alive or otherwise. He wondered why."
> 3. "I did not ask. There was no time."
>

**TESFAYE** *(reply to 1)*  `q1_cobb_seal`

> [grim] A seal. Then it is a house that wants you, not a man, and houses keep ledgers and ledgers keep names. That is the first useful thing anyone has told me in twenty years. Finish this one; we go the moment the gate opens.
>

**TESFAYE** *(reply to 2)*  `q1_cobb_bounty`

> [quiet] Two hundred. That is not a grudge; that is a budget. Somebody with money has decided you are worth it, and I would give a great deal to know how they came to that sum. Finish this one; we go the moment the gate opens.
>

**TESFAYE** *(reply to 3)*  `q1_cobb_nothing`

> [gently] No. There would not have been. It is a thing you learn: ask first, strike after, when you can. Finish this one; we go the moment the gate opens.
>

_(if flag nibSpared)_

**TESFAYE**  `q1_cobb_spared`

> [thoughtful] He went. That was kinder than I would have been in your place. Remember that it cost us nothing tonight; it will not always.
>
> [urgent] And here is a second one, in the brothers' quarters. Before you finish him — the first one. Did he say who sent him? A name, a house, a mark?
>

> **What do you say?**
> 1. "No name. He said there is only ever a seal on a letter and a purse at an inn." — _if flag nibSeal_
> 2. "Two hundred in gold for me, alive or otherwise. He wondered why."
> 3. "I did not ask. There was no time."
>

**TESFAYE** *(reply to 1)*  `q1_cobb_seal`

> [grim] A seal. Then it is a house that wants you, not a man, and houses keep ledgers and ledgers keep names. That is the first useful thing anyone has told me in twenty years. Finish this one; we go the moment the gate opens.
>

**TESFAYE** *(reply to 2)*  `q1_cobb_bounty`

> [quiet] Two hundred. That is not a grudge; that is a budget. Somebody with money has decided you are worth it, and I would give a great deal to know how they came to that sum. Finish this one; we go the moment the gate opens.
>

**TESFAYE** *(reply to 3)*  `q1_cobb_nothing`

> [gently] No. There would not have been. It is a thing you learn: ask first, strike after, when you can. Finish this one; we go the moment the gate opens.
>

### Scene 3: The Griffon Road, after dark

*The Griffon Road, after dark.*

**TESFAYE**  `q1_road`

> [quiet] Stay close, and keep to the shadow of the trees. This road is empty at night, and I have learned to dislike empty roads.
>
> [after a silence] {target}. In case I do not find a better moment — I have been proud of you every day since I carried you through that gate. Whatever you hear about yourself in the days to come, hold to that. A tree with deep roots laughs at the wind.
>
> [sharp] Torches. Ahead, and closing. Off the road — now.
>

### After the last fight

*A man in spiked black plate steps into the torchlight, taller than any man should be. Tesfaye puts himself between the giant and you.*

**KOLADE ADEYINKA**  `q1_appear`

> [calm, courteous] Tesfaye of Lanternhold. You have run a very long way to end up on a road at night with the one thing I want.
>
> [measured] Give the child to me, and you may keep your life and your library. It is not a small thing I offer. I will not offer it twice.
>

**TESFAYE**  `q1_refuse`

> [steady] You know my name; I do not know yours, and I find I do not care to. You will not have this child while I stand. Take that as my answer.
>

**KOLADE ADEYINKA**  `q1_question`

> [curious, unhurried] Before you die for it, old man, satisfy me on one point. Does the child know? Have you told it what it is, or have you let it grow up believing it is yours?
>

**TESFAYE**  `q1_answer`

> [level] It knows what I taught it. Letters, kindness, and how to hold a blade. That is all the knowing it needs, and more than you were ever given.
>
> [to the ward, fierce and low] Run. Do not look back, whatever you hear. Find the Open Hand Inn on the Shore Road. Ask for Beau and Delphine. Run!
>

**TESFAYE**  `q1_death`

> [struck through] Go —
>

_He dies._

**KOLADE ADEYINKA**  `q1_after`

> [unhurried, to the dark] Then it will learn the rest from me. Let the child run. The road is long, my friends, and I own most of it.
>

### Back in town

*A village at the edge of the hills, an hour before dawn. Someone small is running up the road behind you.*

**HIWOT**  `q1_catchup`

> [breathless] {target}! Oh, thank every saint that listens. I saw you both leave and I followed — yes, I know, I was not supposed to — and then I saw the torches, and the big one in the black armour, and I ran the other way, because I am not brave. I am only fast.
>
> [quieter] He is dead. Tesfaye. I saw him fall. I can't believe we left him there. He should be with us.
>
> [urgent] Tell me what the big one said to him. I was too far; I saw his mouth move and Tesfaye shake his head. What did he want?
>

> **What do you say?**
> 1. "Me. Tesfaye said no. We do what he told us — the Open Hand. Stay close to me." — _Hiwot +1_
> 2. "Later. Keep your voice down; grief will not help us, and it will get us found."
> 3. "He asked whether I knew what I am. I will find him, ask him what he meant, and take him apart." — _blood +1_
>

**HIWOT** *(reply to 1)*  `q1_wren_kind`

> [steadying] He wanted you. By name. Then it was never about Tesfaye at all. — Close. Yes. I can do close. I have his letter; it was in his coat. An inn on the Shore Road, and two names, Beau and Delphine. He must have meant for us to go to them.
>

**HIWOT** *(reply to 2)*  `q1_wren_cold`

> [stung, then flat] Right. I am fine. — I have his letter. An inn and two names. You may read it when you have finished being a wall.
>

**HIWOT** *(reply to 3)*  `q1_wren_dark`

> [uneasy] "What you are." He said that? — You sounded like him just then. Not Tesfaye. The other one. [softer] There is a letter. An inn, two names. Let us go and be alive first. You can be terrible later.
>

**HIWOT**  `q1_join`

> [firm] I am coming with you. I can pick locks and keep watch while you sleep. Besides, if you leave me here, I will only have to follow you again.
>

_Hiwot joins the company._

---

## Quest 2 — The Open Hand  *(Chapter 1)*

_Tesfaye's letter names an inn and two friends. The road there has wolves, a squire hunting them, and a mage on the steps who knows your face._

### Setting out

_(if Hiwot in company)_

**HIWOT**  `q2_road`

> [reading] "The Open Hand, on the Shore Road, past the salt-flats. Ask for Beau and Delphine. They are Wardens, and they were my friends before you were born. Trust them as you would trust me." — That is all it says. He never wasted ink.
>
> [thinking] Wardens. He never once said that word in twenty years, and now it is the first thing he wants us to know. That is the first thing I am asking them.
>

### Scene 1: The Shore Road

*The Shore Road. Two men are sitting on a milestone: one pale and long-haired, laughing at nothing; the other small and sour, watching you.*

**DESMOND**  `q2_pair`

> [bright] Well now — look at this, Winston. Two little travellers on a big empty road, and one of them holding a sword like it might bite.
>
> [delighted] Desmond. This is Winston. We are going the same way as you, which is a coincidence, and we are very good in a fight, which is not.
>

**WINSTON**  `q2_pair`

> [flat] He talks. I do the rest.
>

_(if Hiwot in company)_

**HIWOT**  `q2_pair_hiwot`

> [low, to you] Do not tell them anything. We do not know them.
>

**WINSTON**  `q2_pair_ask`

> [level] Before anybody says yes or no: where are two children walking so fast, with one blade between them and no pack? People with a reason walk like that. I want the reason.
>

> **What do you say?**
> 1. "An inn called the Open Hand. Friends of my father's. He is dead." — _sets toldPair_
> 2. "South. Family."
> 3. "That is my business."
>

**WINSTON** *(reply to 1)*  `q2_where_truth`

> [thoughtful] The Open Hand. That's a Warden house; everybody on this coast knows it. So you are walking toward trouble, not away from it, and you are honest about it. Both of those are useful to me.
>

**DESMOND** *(reply to 2)*  `q2_where_lie`

> [gleeful] Lying. Look at the hands, Winston — the hands always know. I like them already.
>
> [sing-song] No worry yourself. Everybody lies to us. We are used to it.
>

**WINSTON** *(reply to 3)*  `q2_where_refuse`

> [unbothered] Fair. It is. Then here is mine, so we are even.
>

**WINSTON**  `q2_pair_offer`

> [flat] We are hired blades between hirings, and the road is bad for two and better for four. Say yes or say no, but say it before the light goes. I do not like this stretch after dark.
>

> **What do you say?**
> 1. "Who are you, really? Nobody walks this road for the pleasure of it." — _question — the choice returns_
> 2. "Your friend is laughing at nothing. Is he well?" — _question — the choice returns_
> 3. "Four is better than two. Walk with us." — _Desmond +1; Winston +1; Desmond joins; Winston joins; sets umbralRecruited_
> 4. "We travel alone. Good road to you." — _sets umbralRefused_
>

**WINSTON** *(reply to 1)*  `q2_pair_who`

> [dry] You want the true answer or the polite one? Polite: two men with skills and no master this month. True: we work for people who pay to know things, and right now they would like to know why iron costs three times what it did last year. You are not the thing we are looking for. You are on the road to it.
>

**WINSTON** *(reply to 2)*  `q2_pair_vess`

> [a sigh] Desmond is well the way a fire is well. He can raise the dead for a little while and he laughs when the dead fall down again. I keep him pointed the right way. I have done it since we were boys and I am tired, but I am still doing it.
>

**DESMOND** *(reply to 3)*  `q2_pair_yes`

> [sing-song] You hear that, Winston? We have friends now. — No worry yourself, {target}. I bite only the ones you tell me to.
>

**WINSTON** *(reply to 4)*  `q2_pair_no`

> [unbothered] Then go easy. If you change your mind, we will be the ones ahead of you with the fire lit. — Desmond. Walk.
>

### Scene 2: The wolf den

_(if Hiwot in company)_

**HIWOT**  `q2_wolves`

> [low] Wolves. Road wolves, the big grey kind — Tesfaye said they only come down to the road when the hills are hungry.
>
> [very quiet] Something has made the hills hungry.
>

*A young man in a white tabard, running down the road towards you with his hand up.*

**SANTIAGO**  `q2_cassian`

> [formal, out of breath] Hold — with respect, hold! Do not go into the den, señor — señora — forgive me, I do not know which, and I have run a long way.
>
> [straightening] Santiago, squire of the Order of the Dawning Flame. I have been sent to clear these wolves from the road, and I have been sent alone.
>

_(if Hiwot in company)_

**HIWOT**  `q2_cassian_hiwot`

> [sceptical] Alone. Who sends one squire to a wolf den? What did you do to your Order?
>

_(if Hiwot in company)_

**SANTIAGO**  `q2_cassian_answer`

> [reddening, honest] Nothing. That is the difficulty. A knight who has done nothing is sent to do something, and a wolf den on a road nobody uses is the something. I will confess to you, as I would to no one in the Order, that I am not certain I can.
>

> **What do you say?**
> 1. "The Dawning Flame. What is that?" — _question — the choice returns_
> 2. "Then we clear them together, and you may tell your Order whatever you like." — _Santiago +1; Santiago joins_
> 3. "A knight who cannot manage wolves. What do they teach in that Order?" — _question — the choice returns; Santiago +1_
> 4. "We are in a hurry. Manage your own wolves."
>

**SANTIAGO** *(reply to 1)*  `q2_cassian_order`

> [earnest] An order of knights sworn to the sun and the sunrise: to be first into the dark and last out of it. Our chapter house is far south of here, in the sun-lands, where I was born. The Order sent me north to learn what the roads are like. I am learning.
>

**SANTIAGO** *(reply to 2)*  `q2_cassian_join`

> [relieved] God keep you for it. Then I will take the front, because that is what I am for, and you will tell me if I am doing it wrong.
>

**SANTIAGO** *(reply to 3)*  `q2_cassian_tease`

> [reddening, then honest] Prayers, mostly. And the sword, and how to stand still while people say unkind things — which, with respect, you are doing very well.
>

**SANTIAGO** *(reply to 4)*  `q2_cassian_no`

> [formal, hurt] Of course. God go with you, then. I will — I will manage.
>

_(if Hiwot not in company)_

**SANTIAGO**  `q2_cassian_alone`

> [honest] I will confess to you, as I would to no one in the Order, that I am not certain I can. I have never fought anything that was not a straw man.
>

> **What do you say?**
> 1. "The Dawning Flame. What is that?" — _question — the choice returns_
> 2. "Then we clear them together, and you may tell your Order whatever you like." — _Santiago +1; Santiago joins_
> 3. "A knight who cannot manage wolves. What do they teach in that Order?" — _question — the choice returns; Santiago +1_
> 4. "We are in a hurry. Manage your own wolves."
>

**SANTIAGO** *(reply to 1)*  `q2_cassian_order`

> [earnest] An order of knights sworn to the sun and the sunrise: to be first into the dark and last out of it. Our chapter house is far south of here, in the sun-lands, where I was born. The Order sent me north to learn what the roads are like. I am learning.
>

**SANTIAGO** *(reply to 2)*  `q2_cassian_join`

> [relieved] God keep you for it. Then I will take the front, because that is what I am for, and you will tell me if I am doing it wrong.
>

**SANTIAGO** *(reply to 3)*  `q2_cassian_tease`

> [reddening, then honest] Prayers, mostly. And the sword, and how to stand still while people say unkind things — which, with respect, you are doing very well.
>

**SANTIAGO** *(reply to 4)*  `q2_cassian_no`

> [formal, hurt] Of course. God go with you, then. I will — I will manage.
>

### Scene 3: The steps of the Open Hand

*The Open Hand Inn. A lean man in a patched coat sits on the steps with a sheet of paper in one hand and a wand in the other.*

**MERLE**  `q2_morwin`

> [drawling, on the inn steps] Well, look here. Two of you, and a paper in my pocket with one face on it. Now which one's the ward of Tesfaye of Lanternhold? Don't all shout at once.
>

_(if Hiwot in company)_

**HIWOT**  `q2_morwin_hiwot`

> [quickly] Neither. We are pilgrims. Going to the shrine at — the shrine.
>

_(if Hiwot in company)_

**MERLE**  `q2_morwin_hiwot_reply`

> [amused] Pilgrims. With that face, that the paper's got drawn near perfect. Nice try, little sister.
>
> [unhurried] Merle. I'm the fella they send when the first fella don't come back. Now I'll say this once: I'd sooner do this out here than in Delphine's yard. That woman scares me.
>

> **What do you say?**
> 1. "Whose name is on that paper? Who is paying?" — _question — the choice returns_
> 2. "How did you know to wait here?" — _question — the choice returns_
> 3. "You should have stayed home, Merle." — _blood +1_
> 4. "Delphine! Beau! There is a man on your steps who means murder!"
>

**MERLE** *(reply to 1)*  `q2_morwin_name`

> [chuckling] Same as always. A seal, no name. Iron hand on red wax, pressed hard, like whoever did it was angry at the wax. If you want a name you'll have to go up the road a good deal further than me.
>

**MERLE** *(reply to 2)*  `q2_morwin_how`

> [a shrug] The old man had two friends in the whole world, and they run this inn. Anybody who knew him knew that. Whoever's paying knew him.
>

**MERLE** *(reply to 3)*  `q2_morwin_kill`

> [grinning] Now there's the temper the paper warned me about.
>

**MERLE** *(reply to 4)*  `q2_morwin_inn`

> [cursing] Oh, that's low. That's — I hear the door. All right. All right, quick then.
>

_(if Hiwot not in company)_

**MERLE**  `q2_morwin_alone`

> [unhurried] Merle. I'm the fella they send when the first fella don't come back. I'd sooner do this out here than in Delphine's yard. That woman scares me.
>

> **What do you say?**
> 1. "Whose name is on that paper? Who is paying?" — _question — the choice returns_
> 2. "How did you know to wait here?" — _question — the choice returns_
> 3. "You should have stayed home, Merle." — _blood +1_
> 4. "Delphine! Beau! There is a man on your steps who means murder!"
>

**MERLE** *(reply to 1)*  `q2_morwin_name`

> [chuckling] Same as always. A seal, no name. Iron hand on red wax, pressed hard, like whoever did it was angry at the wax. If you want a name you'll have to go up the road a good deal further than me.
>

**MERLE** *(reply to 2)*  `q2_morwin_how`

> [a shrug] The old man had two friends in the whole world, and they run this inn. Anybody who knew him knew that. Whoever's paying knew him.
>

**MERLE** *(reply to 3)*  `q2_morwin_kill`

> [grinning] Now there's the temper the paper warned me about.
>

**MERLE** *(reply to 4)*  `q2_morwin_inn`

> [cursing] Oh, that's low. That's — I hear the door. All right. All right, quick then.
>

### After the last fight

_(if Hiwot in company)_

**HIWOT**  `q2_notice`

> [picking up the paper] He was carrying this. Your face, and a bounty, and a seal of an iron hand in red wax. No name.
>
> [quiet] Somebody with a great deal of money wants you dead badly enough to send two men in one night and a third to wait at the one door Tesfaye trusted. I am keeping this. Somebody at that inn will know the mark.
>

### Back in town

*The inn door opens. A broad man with a shield on his back, and behind him a woman with grey in her braids and a look that has already counted you.*

**BEAU**  `q2_selene`

> [stammering, warm] You're — y-you're his. Tesfaye's. I'd know that coat anywhere; he w-wore it the day we met. Come in. Come in out of the road.
>
> [quiet] Del. It's the ward. He sent the ward.
>

*Delphine — Beau’s wife, a Warden druid and an old friend of your late stepfather, Tesfaye.*

**DELPHINE**  `q2_selene`

> [warm, gentle] I'm Delphine, Beau's wife. Your late stepfather, Tesfaye, was an old friend of ours. Sit down, honey. Beau, get the good bread.
>
> [steady] He wrote to us from Lanternhold every year for twenty years. Said you and Hiwot were growing up in that keepers' library, getting into everything he tried to keep you out of. His last letter said if you came here without him, we were to keep you safe.
>
> [quiet, direct] So. How did he die? All of it. Don't you spare me.
>

> **What do you say?**
> 1. "A man in black plate, taller than a man should be. He asked for me by name. Tesfaye said no." — _sets toldArmour_
> 2. "Quickly. He did not suffer."
> 3. "I cannot. Not tonight."
>

**DELPHINE** *(reply to 1)*  `q2_how_armour`

> [very still] Black plate. Asked for you by name.
>
> [to Beau] Beau. The letter from the spring. He said if a big man in black iron ever came asking, we weren't to fight him, we were to run with the child and ask questions after. I thought he'd gone strange.
>

**DELPHINE** *(reply to 2)*  `q2_how_quick`

> [gently] That's a kindness, and a lie, and I'll take both. Thank you, sugar.
>
> [to Beau] Beau. Whoever did it knew where Tesfaye was, and Tesfaye chose that library because nobody knew. Somebody talked.
>

**DELPHINE** *(reply to 3)*  `q2_how_refuse`

> [soft] Then don't. But you'll tell Beau when you can; he loved him too, and he's worse at waiting than I am.
>

**BEAU**  `q2_beau_seal`

> [low] Del. The p-paper the man on the steps had. Look at the seal. Iron hand, red wax.
>
> [steadier] That's the mark on the ore wagons. The ones that come up from Dunmere and go north. I've seen it a hundred times at the ford.
>

**DELPHINE**  `q2_selene_seal`

> [looking] It is. The Iron Consortium's mark — the trading house out of the Gate that's been buying every bar on this coast since the ore went bad.
>
> [slowly] So the folks paying to kill Tesfaye's ward are the folks who own the iron. That ain't two stories, honey. That's one. Now you ask me whatever you need to, and then we decide what he'd have done.
>

> **What do you say?**
> 1. "What are the Wardens? He never told me." — _question — the choice returns_
> 2. "Why would a trading house pay two hundred in gold for a scholar's foundling?" — _question — the choice returns_
> 3. "He trusted you. So will I. Tell me what he would have done." — _Delphine +1; Beau +1_
> 4. "I did not come for bread. Tell me who killed him and I will go alone." — _blood +1; Delphine -1_
>

**DELPHINE** *(reply to 1)*  `q2_selene_wardens`

> [matter-of-fact] Folks who keep the balance between the towns and the wild, and between the strong and the weak, when the law's too far off to do it. Tesfaye was one, before the library. So are we. It don't pay, and nobody thanks you, and you do it anyway. That's the whole of the oath.
>

**DELPHINE** *(reply to 2)*  `q2_selene_why`

> [carefully] I don't know, and I won't pretend I do. I know Tesfaye hid you like a man hides a lit candle in a wind, and never said from what. A trading house don't spend two hundred on spite. They think you're worth it, or they think you're dangerous, and I can't tell you which from here.
>

**DELPHINE** *(reply to 3)*  `q2_selene_trust`

> [softening] He'd have followed the money. The iron's gone bad since spring — tools snapping, blades cracking, every smith from here to the Gate cussing — and the ore comes up out of Dunmere. The Consortium's mark is on the wagons and on your bounty. So we go to Dunmere and find out what's wrong with that ore, and I'd bet my house we find out who wants you dead the same day.
>

**DELPHINE** *(reply to 4)*  `q2_selene_alone`

> [flat] You'll go with us or you'll go over my husband, and he's a big man. Tesfaye asked. I don't break a promise to a dead friend because a child is grieving and rude about it.
>

**DELPHINE**  `q2_join`

> [decisive] Beau, get the shields. We're going to Dunmere.
>
> [to you] I'll tell you what: you're Tesfaye's, and Tesfaye's is ours. That's all the reason we need, and it's all the reason you're getting tonight.
>

_Beau, Delphine join the company._

---

## Quest 3 — South to Dunmere  *(Chapter 2)*

_The tainted iron comes from the Dunmere mines. Between here and there: Thornbury, an elf with a grudge, a knife in an inn, and a gnoll fortress with a witch in it._

### Setting out

_(if Delphine in company)_

**DELPHINE**  `q3_south`

> [calm] Dunmere's two days south. Mining town, hard folk, honest as far as it goes. The mayor's a man called Gethin Pryce; he'll be sweating, and he'll pay.
>
> [dry] Stay off the river road after dark. Gnolls come down it. I know because I've buried the people who didn't listen.
>

**DELPHINE**  `q3_south_hiwot`

> [casual, not casual] Hiwot. You grew up in that library with him. Did he keep letters? Anything from the Gate, anything with that iron seal on it?
>

**HIWOT**  `q3_south_hiwot`

> [thinking] A locked drawer in his study. I never got it open, and I tried twice, which he knew, because he moved the key. He never moved anything else.
>
> [quiet] It is still there. Whatever it is.
>

**DELPHINE**  `q3_south_hiwot_reply`

> [nodding] Then it's still there. Remember that, both of you. If this road ever bends back toward Lanternhold, that drawer's the first door we open.
>

### Scene 1: The Dunmere inn

*The road south. An elf in grey steps out of the trees with his hands where you can see them.*

**ITSUKI**  `q3_ithrel`

> [quiet, from the treeline] Forgive me. I do not mean to alarm you. I have walked beside your road for an hour, deciding whether to speak.
>
> [level] You are going north to the Gate, by the river road? — Then I will be plain. I am Itsuki. A year ago an ogre called Gorruk, who leads the bandit companies in the north, burned a wagon on this road. My wife was in it. I have hunted him since, alone, and alone I cannot reach him.
>

_(if Delphine in company)_

**DELPHINE**  `q3_ithrel_selene`

> [sharp] A year hunting one ogre alone, and the Wardens never heard of you. Why didn't you come to us?
>

_(if Delphine in company)_

**ITSUKI**  `q3_ithrel_selene_reply`

> [calm] I did. A man at a Warden house on the coast told me the north road is not the Wardens' road. He was polite about it.
>

_(if Delphine in company)_

**DELPHINE**  `q3_ithrel_selene_after`

> [a beat] ...It ain't. Damn it. It should be.
>

**ITSUKI**  `q3_ithrel_ask`

> [level] You are going towards him. I would go with you. I ask nothing else.
>

> **What do you say?**
> 1. "Gorruk. Does he use a seal? An iron hand in red wax?" — _question — the choice returns_
> 2. "Your wife. I am sorry. What was her name?" — _question — the choice returns; Itsuki +1_
> 3. "Walk with us. When we find him, he is yours." — _Itsuki +2; Itsuki joins_
> 4. "I have enough grief in this company. I do not need yours." — _Itsuki -1_
>

**ITSUKI** *(reply to 1)*  `q3_ithrel_seal`

> [thinking] I have seen letters carried to his camp. Sealed. I did not read them; I was too far, and I am no thief. The seal was red, and pressed hard. That is all I can say honestly.
>

**ITSUKI** *(reply to 2)*  `q3_ithrel_wife`

> [a long pause] Hana. Thank you for asking. No one asks. They ask about him.
>

**ITSUKI** *(reply to 3)*  `q3_ithrel_yes`

> [a small bow] Then I am in your debt before I have earned my place. I will keep the rear. You will not hear me unless you need to.
>

**ITSUKI** *(reply to 4)*  `q3_ithrel_no`

> [calm] I understand. I will walk on ahead of you, then. If our roads cross again, I will not ask twice.
>

*The Dunmere inn, first night. A woman at a corner table raises her cup to you.*

**LURLEEN**  `q3_lessa`

> [smiling, from a corner table] There you are, sugar. I've been nursing this cider an hour, waiting on you. Lurleen. You don't know me, but I know that face; I've got it on paper in my pocket.
>
> [light] Three sent before me, I hear. And one of them Merle, who I liked. So this ain't only money now. Just so you know.
>

_(if Winston in company)_

**WINSTON**  `q3_lessa_winston`

> [flat] Before the knives, girl. What's the rate? Two hundred, still, or has it gone up since Merle?
>

_(if Winston in company)_

**LURLEEN**  `q3_lessa_winston_reply`

> [amused] Three now. It goes up every time one of us don't come back. You thinking of switching sides, halfling?
>

_(if Winston in company)_

**WINSTON**  `q3_lessa_winston_after`

> [dry] Thinking about who can afford to keep raising it. Carry on.
>

**LURLEEN**  `q3_lessa_ask`

> [light] Well? You going to say something clever, or are we going to get on with it?
>

> **What do you say?**
> 1. "Why do you do this work?" — _question — the choice returns_
> 2. "Then let it be personal."
>

**LURLEEN** *(reply to 1)*  `q3_lessa_why`

> [a shrug] Because I'm good at it, and because nobody else in this country pays a woman to be good at anything. You'd know, if you'd grown up anywhere but a library.
>

**LURLEEN** *(reply to 2)*  `q3_lessa_fight`

> [pleased] There she is. — There he is. Whichever. Come on, then.
>

### Scene 2: The river crossing

*The river crossing below the gnoll fortress. A huge man with a hamster on his shoulder is shouting at a wizard in red at the ford.*

**BAHADIR**  `q3_bramm`

> [booming] — and I say AGAIN, red man, you touch that cage and I will fold you into it!
>
> [turning] VALLAHI. Strangers. Good. Strangers, listen: Bahadır, ranger of Kalden, and this is Fındık, who is small but very brave. There is a woman in that fortress, in a cage. Yasemin. A witch of my country, and a good one.
>

**DEVENDRA**  `q3_bramm`

> [disdainful] Kindly disregard the large gentleman; his enthusiasms are exhausting. Devendra, Crimson Wizard of Vashk. The woman in the cage is a Kalden witch, and it is quite evident that a Kalden witch loose in these hills is a calamity waiting for a date.
>

**BAHADIR**  `q3_bramm_argue`

> [hot] Tell them why Vashk burns women, wizard! Tell them what your Crimson masters do with a witch's bones!
>

**DEVENDRA**  `q3_bramm_argue`

> [coolly] Vashk and Kalden have been at war, in one form or another, since before these strangers' grandparents were born. I do not expect the large gentleman to understand policy. I expect him to understand a hundred in gold — which I am offering to you, not to him. A hundred to see her burned, and my considerable talents beside you until the Gate.
>

> **What do you say?**
> 1. "Why would a Crimson Wizard care what happens to one witch?" — _question — the choice returns_
> 2. "We are freeing her. Bahadır, with me." — _blood -1; Bahadır +2; Bahadır joins; Yasemin joins_
> 3. "A hundred gold, and your staff until the Gate. Done." — _blood +1; gold +100; Devendra +1; Devendra joins; sets brammEnemy_
> 4. "The witch lives, and the wizard walks with us and holds his tongue about it." — _Bahadır +1; Devendra -1; Bahadır joins; Devendra joins; Yasemin joins_
>

**DEVENDRA** *(reply to 1)*  `q3_bramm_why`

> [coolly] Because one witch becomes a coven, and a coven becomes a border dispute, and a border dispute becomes my problem. That I am polite about it is a courtesy, not a change of policy.
>

**BAHADIR** *(reply to 2)*  `q3_bramm_rescue`

> [overjoyed] With you! Yes! Fındık, did you hear? We have friends, and they are good ones. Come — the gate is that way, and I am going through it.
>

**DEVENDRA** *(reply to 3)*  `q3_bramm_coin`

> [satisfied] A sensible arrangement. The large gentleman will object; I recommend we not be near him when he does.
>

**DEVENDRA** *(reply to 4)*  `q3_bramm_both`

> [thin] Hold my tongue. Very well. I shall hold it most eloquently. Do not expect me to be happy about it.
>

### Scene 3: The gnoll fortress — or Bahadır blocks the road (if aurelius)

_(if flag brammEnemy)_

**BAHADIR**  `q3_road_block`

> [wounded, roaring] You TOOK his coin. You looked at me and you took his coin! Then you go through me, and Fındık, and every tree in this valley — come on! COME ON!
>

### After the last fight

*The cage in the fortress yard. A woman in a dark robe waits inside it, quite calm.*

_(if Bahadır recruited)_

**YASEMIN**  `q3_freed`

> [cold, from the cage] Thank you. I would kneel, but the bars have made it difficult.
>
> [looking at you] You. Come closer. Something in your blood woke when you came through the fortress gate; I felt it through the bars like heat from a stove in the next room. I have read auras all my life and I have never felt one like it.
>
> [direct] So tell me, before I decide what to do about it. When it woke — what did it want?
>

> **What do you say?**
> 1. "The warleader's throat. I gave it that." — _blood +1_
> 2. "I felt nothing. I fought, and it ended."
> 3. "You tell me. What is it? Say it plainly." — _question — the choice returns_
> 4. "Whatever you felt, keep it to yourself in front of the others."
>

**YASEMIN** *(reply to 1)*  `q3_ysolde_blood`

> [a slow nod] Honest. Good. Then I know what kind of thing it is, if not its name: something that was worshipped once, and fed. I would sooner walk beside it than behind it. Bahadır goes where I go, and Fındık goes where Bahadır goes, and so you have three. Two and a half.
>

**YASEMIN** *(reply to 2)*  `q3_ysolde_nothing`

> [dry] You felt nothing. Canım, I watched your hand. — Very well; you are not ready to say it, and that is your right. I will walk beside you anyway, and I will keep watching the hand. Bahadır goes where I go.
>

**YASEMIN** *(reply to 3)*  `q3_ysolde_what`

> [precise] Something that was worshipped once, and should not have been. That is as plain as I can be without lying to you. I read auras, not histories. Now answer mine.
>

**YASEMIN** *(reply to 4)*  `q3_ysolde_quiet`

> [dry] As you like. I am a witch. Keeping things to myself is most of the work. I will walk beside you, and I will not say it again in front of the others. Bahadır goes where I go.
>

_(if Bahadır recruited)_

**BAHADIR**  `q3_joined`

> [emphatic] We are yours, {target}. Vallahi. Where you go, we go, and anyone who says otherwise answers to Fındık.
>

_Yasemin joins the company._

### Back in town

*Dunmere. The mayor meets you in the square, mopping his face with a handkerchief.*

**GETHIN PRYCE**  `q3_tollan`

> [harried, Welsh sing-song] Now then. You'll be Delphine's lot, is it? She sent a boy ahead with a note. Duw, I've been praying somebody would come, and I'm not a praying man.
>
> [wiping his face] Gethin Pryce, mayor of Dunmere, for my sins. The ore's gone bad — comes up grey and brittle and the smiths won't touch it, and my crews won't go below the second level, and I don't blame them.
>

_(if Delphine in company)_

**DELPHINE**  `q3_tollan_selene`

> [level] Gethin. Before the crews. Who's been buying your bad ore since spring, and who's been selling the smiths good iron since?
>

_(if Delphine in company)_

**GETHIN PRYCE**  `q3_tollan_selene_reply`

> [bitter] Same hand, bach, and you know it or you wouldn't ask. The Iron Consortium out of the Gate takes every wagon — they've the roads. They've been very sorry about the bad ore. Very sorry, and very quick to sell the smiths their own stock instead, at a price.
>

_(if Delphine in company)_

**DELPHINE**  `q3_tollan_selene_after`

> [to Beau, quiet] Same hand. Beau, I told you. Buy the ore cheap because it's bad, sell the iron dear because it's the only good iron left. Somebody's making that ore bad on purpose.
>

_(if Winston in company, Delphine not in company)_

**WINSTON**  `q3_tollan_winston`

> [flat] Mayor. Who takes your wagons north? One buyer, or many?
>

_(if Winston in company, Delphine not in company)_

**GETHIN PRYCE**  `q3_tollan_winston_reply`

> [bitter] One. The Iron Consortium out of the Gate. They've the roads, so they've the ore, and they've been very sorry about it being bad, and very quick to sell the smiths good iron of their own instead.
>

_(if Winston in company, Delphine not in company)_

**WINSTON**  `q3_tollan_winston_after`

> [low, to himself] One buyer. That's what they wanted to know. — Go on, man.
>

**GETHIN PRYCE**  `q3_tollan_ask`

> [hopeful] So. Will you go down, and what will it cost me? Say it plain; I've no head for haggling today.
>

> **What do you say?**
> 1. "What did your crews see, before they stopped going down?" — _question — the choice returns_
> 2. "Who profits when your iron goes bad?" — _question — the choice returns_
> 3. "We will go down. Two hundred in gold, and the town's thanks." — _gold +100; Hiwot +1; sets tollanFee_
> 4. "We will go down. Pay what the town can spare." — _Delphine +1; Santiago +1_
>

**GETHIN PRYCE** *(reply to 1)*  `q3_tollan_crews`

> [low] Lights, on the fourth level, where there's no lamps. Chanting. And a man — the last crew that came up swore it was a man, big, in a robe, standing by something like an altar. They didn't stay to ask him his business, and I don't blame them for that either.
>

**GETHIN PRYCE** *(reply to 2)*  `q3_tollan_iron`

> [bitter] Whoever's selling good iron while mine's bad. There's one house doing that on this coast, and it's the Consortium, and I've said so to the magistrate twice and got a shrug both times.
>

**GETHIN PRYCE** *(reply to 3)*  `q3_tollan_fee`

> [wincing] Two hundred. There's lovely. — Fine. Fine! Half now and half when you come up, and if you come up with clean ore I'll carry you round the square myself.
>

**GETHIN PRYCE** *(reply to 4)*  `q3_tollan_yes`

> [nearly weeping] Bless you. Bless you, I mean it. It won't be much, but it'll be everything we've got, and the whole town will know your name.
>

---

## Quest 4 — The Dunmere Mines  *(Chapter 2)*

_The miners will not go down. Whatever is fouling the ore is four levels below, and it has a priest._

### Scene 1: The first level

_One of the following, whoever is riding along:_

**HIWOT**  `q4_down`

> [low] It smells like wet dog and hot metal. Four levels of that, going down.
>
> [quiet] Keep your light up. I can't see where these stairs end.
>

**DELPHINE**  `q4_down`

> [calm] Mind the timbers; half of them are rotten. If the kobolds are as thick as the mayor says, we go slow and we keep the healer in the middle. That's me, honey. Don't argue.
>

### Scene 2: The flooded level

_(if Delphine in company)_

**DELPHINE**  `q4_flooded`

> [calm] Water on the second level, and not from any spring. Somebody opened a channel and let the river in on purpose.
>
> [thoughtful] Kobolds don't plan. Kobolds dig where they're pointed. Whoever's pointing them is below us, and has been for weeks.
>

### Scene 3: The third level

_(combat, no dialogue)_

_During combat, once: Winston must be present and successfully apply Whisper of Ending after the chief has healed._

**WINSTON**  `q4_healing`

> [firm] That chief keeps healing. I've shut it off for now. Hit him before it wears off.
>

### Scene 4: Grukhar's chamber

*The fourth level opens into a chamber with a black altar. A half-orc in a priest's robe stands behind it, and he has been waiting a long time.*

**GRUKHAR**  `q4_chamber`

> [hoarse] So. Somebody finally came down. The crews have been whispering about a company from the coast for a week; I hoped you were bringing my pay.
>
> [bitter] They lied about that part. I have not seen a coin since spring. I have letters — orders, names, the whole rotten trade. Let me walk out of this hole and they are yours.
>

_(if Delphine in company)_

**DELPHINE**  `q4_grukhar_selene`

> [flat] Your orders. Sealed how? Iron hand, red wax, pressed hard.
>

_(if Delphine in company)_

**GRUKHAR**  `q4_grukhar_selene_reply`

> [a grunt] You've seen it, then.
>

_(if Delphine in company)_

**DELPHINE**  `q4_grukhar_selene_after`

> [to you, low] On a wagon, on a bounty, and now on an altar. That's three. — Go on, honey. He's yours to deal with.
>

> **What do you say?**
> 1. "Who lied to you? Say the names." — _question — the choice returns_
> 2. "Why foul the ore at all? Who profits from a town starving?" — _question — the choice returns_
> 3. "Leave the letters on the altar and walk. Now, before I change my mind." — _no fight; blood -1; Itsuki -1; Santiago -1; sets grukharSpared_
> 4. "I will take the letters off your body." — _blood +1_
>

**GRUKHAR** *(reply to 1)*  `q4_grukhar_who`

> [hoarse] A courier called Femi, who keeps a room at the inn in Thornbury and calls himself a wine merchant. Above him, something that signs itself Gorruk and holds the north road. Above THAT, I never met. Nobody meets it. The money used to come down the same way the orders do.
>

**GRUKHAR** *(reply to 2)*  `q4_grukhar_why`

> [a laugh like a cough] You think I asked? Somebody wants iron dear this year. Somebody wants the smiths of the Gate buying from one hand. I was told to keep this mine useless until the spring shipment, and I did, and I was to be paid for it, and I was not.
>

**GRUKHAR** *(reply to 3)*  `q4_grukhar_walk`

> [relieved, backing away] The altar. Read the one with the ogre's mark first; it names the courier and the inn.
>
> [muttering] Veylan keep me. I am finished with iron.
>

**GRUKHAR** *(reply to 4)*  `q4_grukhar_kill`

> [snarling] Then come and take them, foundling.
>

_(if Winston in company, Delphine not in company)_

**WINSTON**  `q4_grukhar_winston`

> [flat] Which spring shipment, priest? Whose wagons?
>

_(if Winston in company, Delphine not in company)_

**GRUKHAR**  `q4_grukhar_winston_reply`

> [hoarse] The Consortium's. They're the ones who hired me. You'll find the details in those letters.
>

_(if Delphine not in company)_

**GRUKHAR**  `q4_chamber_ask`

> [hoarse] Well? The letters for my life. It is a fair trade and you know it.
>

> **What do you say?**
> 1. "Who lied to you? Say the names." — _question — the choice returns_
> 2. "Why foul the ore at all? Who profits from a town starving?" — _question — the choice returns_
> 3. "Leave the letters on the altar and walk. Now, before I change my mind." — _no fight; blood -1; Itsuki -1; Santiago -1; sets grukharSpared_
> 4. "I will take the letters off your body." — _blood +1_
>

**GRUKHAR** *(reply to 1)*  `q4_grukhar_who`

> [hoarse] A courier called Femi, who keeps a room at the inn in Thornbury and calls himself a wine merchant. Above him, something that signs itself Gorruk and holds the north road. Above THAT, I never met. Nobody meets it. The money used to come down the same way the orders do.
>

**GRUKHAR** *(reply to 2)*  `q4_grukhar_why`

> [a laugh like a cough] You think I asked? Somebody wants iron dear this year. Somebody wants the smiths of the Gate buying from one hand. I was told to keep this mine useless until the spring shipment, and I did, and I was to be paid for it, and I was not.
>

**GRUKHAR** *(reply to 3)*  `q4_grukhar_walk`

> [relieved, backing away] The altar. Read the one with the ogre's mark first; it names the courier and the inn.
>
> [muttering] Veylan keep me. I am finished with iron.
>

**GRUKHAR** *(reply to 4)*  `q4_grukhar_kill`

> [snarling] Then come and take them, foundling.
>

### After the last fight

_One of the following, whoever is riding along:_

**DELPHINE**  `q4_letters`

> [reading] "To the priest, from Femi at the Thornbury inn. Keep the ore fouled until the spring shipment. Gorruk holds the north road; do not use it without his mark."
>
> [calm] A courier, and a bandit lord above him, and above them somebody who buys with a seal instead of a name. The mine was only the bottom of this.
>

**HIWOT**  `q4_letters`

> [reading] "Keep the ore fouled until the spring shipment. Gorruk holds the north road." And a name — Femi, at the inn in Thornbury.
>
> [quiet] Tesfaye died over a shipping schedule. That cannot be the whole of it. It cannot.
>

### Back in town

**GETHIN PRYCE**  `q4_thanks`

> [overjoyed] The crews went down at dawn and came up with clean ore. Clean! I haven't heard a bar ring true on that anvil since winter. Duw, I could sing.
>
> [earnest] Dunmere owes you more than it can pay, bach. Here's what it can. And — if you go north after the people who did this, the town would take it kindly if you didn't come back alone.
>

**HIWOT**  `q4_camp_hiwot`

> [quiet, at the fire] Delphine. Was he a good Warden? Tesfaye. He never talked about it, and I have been wondering all day whether that was because it was bad, or because it was good.
>

**DELPHINE**  `q4_camp_selene`

> [after a moment] He was the best of us, sugar. And he quit. Those ain't two different stories either.
>

*That night you dream of a field of ash, and a throne of black stone standing in it. Tesfaye is beside it, as though he has always been there.*

**TESFAYE**  `q4_dream`

> [echoing] You are dreaming, my child, and I am dead, and both of those things are true at once.
>
> [gentle] That throne belonged to Morrak, the god of murder. He died before you were born. You are one of his children, and part of his power lives in you.
>
> [grave] He intended his children to kill one another and take that power for themselves, until one could claim his throne. You can refuse, my child. You do not have to kill for him.
>

> **What do you say?**
> 1. "You knew what I was when you brought me to Lanternhold?" — _question — the choice returns_
> 2. "I do not want whatever this is. Starve it." — _blood -1; sets dream1_
> 3. "Show me the throne." — _blood +1; sets dream1_
>

**TESFAYE** *(reply to 1)*  `q4_dream_ask`

> [sorrowful] I did. I brought you there to keep you out of Morrak's followers' reach. I should have told you while I was alive. I was afraid of what it would do to you.
>

**TESFAYE** *(reply to 2)*  `q4_dream_reject`

> [warm] Good. That is the harder road, and the right one. You will wake with a gift for closing wounds. Spend it on other people.
>

**TESFAYE** *(reply to 3)*  `q4_dream_embrace`

> [grieving] I cannot stop you here; only you can. You will wake with a gift for opening wounds. Mind what it makes you want.
>

---

## Quest 5 — The Bandit Camp  *(Chapter 3)*

_Grukhar's letters name a courier in Thornbury and a lord of bandits in the Gnashing Wood. Yohannes says go north. He does not say it will be pleasant._

### Setting out

*An old man in a grey cloak sits on the stable wall in Thornbury, eating an apple. You have seen him three times this week.*

**YOHANNES**  `q5_sage`

> [amused] You have looked at me three times this week, my child, and decided each time that I was nobody. That is a good instinct. It is wrong this once.
>
> [calm] I am called Yohannes. Tesfaye was my friend before this town had a wall, and I have watched his ward from a distance because that is what he asked of me, and because I am a coward about goodbyes.
>
> [quiet, exact] Now. Before I tell you anything, tell me something. The man in black on the Griffon Road. What did he say to Tesfaye? Word for word, if you can.
>

> **What do you say?**
> 1. ""Give the child to me and you may keep your life and your library."" — _sets toldYohannes_
> 2. "I did not hear it. I was running, as I was told."
> 3. "Ask him yourself, old man. I am going to." — _blood +1_
>

**YOHANNES** *(reply to 1)*  `q5_test_word`

> [very still] "Your library." He knew about the library. Then he has known where you were for years, and waited, and chose his night. That is worse than I feared and better than I guessed: a patient man can be found. — Ask me what you like. I will answer what I can.
>

**YOHANNES** *(reply to 2)*  `q5_test_forget`

> [gently] Then you did as you were told, and you are alive to be asked, and that is the whole of what Tesfaye wanted from that night. Ask me what you like. I will answer what I can.
>

**YOHANNES** *(reply to 3)*  `q5_test_refuse`

> [chuckling] Tesfaye said you would be like this. He said it fondly, mostly. — Ask me what you like, before you go and do it.
>

**YOHANNES**  `q5_sage_ask`

> [dry] Well? I can see you are not satisfied. Tell me what you want to know.
>

> **What do you say?**
> 1. "Why did Tesfaye die? You know. Say it." — _question — the choice returns_
> 2. "The man in black armour. Who is he?" — _question — the choice returns_
> 3. "Then help. Not riddles — help."
> 4. "North, then. Stay out of my way, old man." — _blood +1_
>

**YOHANNES** *(reply to 1)*  `q5_torvald_why`

> [gently] He died so that you would live long enough to be told properly, by the right person, in the right place. That place is not a stable yard in Thornbury, and I am not the right person; I am only the one who knew him longest.
>
> [calm] Go north. Find the letters. Paper will bring you to the truth faster than I would, and you will believe paper where you would not believe me.
>

**YOHANNES** *(reply to 2)*  `q5_torvald_armour`

> [carefully] I have not seen his face. I have seen his work. He does not want you dead for anything you have done; he wants you dead for what you are, and he is not the only one who will. That is as much as I will say before you have earned the rest.
>

**YOHANNES** *(reply to 3)*  `q5_torvald_help`

> [dry] I have helped. Twice. You did not see either time, which is what help from me looks like.
>
> [warm] The courier you want keeps a room at the inn here; the bandits are north, in the Gnashing Wood. Bring the letters out alive. That is the help I need from you.
>

**YOHANNES** *(reply to 4)*  `q5_torvald_go`

> [calm] The inn, for the courier. The Gnashing Wood, for the rest. Go well, child, since you will go anyway.
>

### Scene 1: Hollister's Inn

*Hollister's Inn. A soft man in a merchant's coat has a table to himself and a cup he has not touched.*

**FEMI**  `q5_inn`

> [nervous, city-polished] I do not know you. I do not know any priest, or any mine. I am a wine merchant, my friend, and I should like you to leave my table.
>

_(if Delphine in company)_

**DELPHINE**  `q5_inn_selene`

> [pleasant, deadly] Hollister says you've had that room since the spring, Femi. Now I'll tell you what puzzles me. What does a wine merchant sell for six months in a town with one inn, that already has a cellar?
>

_(if Delphine in company)_

**FEMI**  `q5_inn_selene_reply`

> [sweating] Ah-ah — madam, I do not answer to — I have a licence, I have papers —
>

_(if Delphine in company)_

**DELPHINE**  `q5_inn_selene_after`

> [to you] He's got papers, honey. I'd like to see them.
>

> **What do you say?**
> 1. "A priest under Dunmere had your letters. Your name, your inn, your hand." — _question — the choice returns_
> 2. "Wrong answer."
> 3. "Fifty in gold for the camp's location. Then you leave this town tonight." — _no fight; gold -50; sets verlanPaid_
> 4. "Hiwot. His coat." — _if Hiwot in company · no fight; Hiwot +1_
>

**FEMI** *(reply to 1)*  `q5_verlan_letters`

> [sweating] Then the priest is a liar. Or dead. Or both. I carry wine. I carry what I am given to carry, and I do not read it, and nobody has ever asked me to.
>

**FEMI** *(reply to 2)*  `q5_verlan_beat`

> [panicking] Wait — wait —
>

**FEMI** *(reply to 3)*  `q5_verlan_pay`

> [greedy, low] Fifty. Yes. There is a map in my boot: past Holloway Vale, under the old oak line. Do not use the road; they watch the road.
>
> [scurrying] I was never here, o.
>

**HIWOT** *(reply to 4)*  `q5_verlan_pocket`

> [murmuring] Map, seal, and a very old sausage. He did not feel a thing.
>
> [low] Past Holloway Vale, under the oaks. There is a note about the road being watched.
>

_(if Delphine not in company)_

**FEMI**  `q5_inn_ask`

> [stiff] Well? Leave my table, or say what you came to say.
>

> **What do you say?**
> 1. "A priest under Dunmere had your letters. Your name, your inn, your hand." — _question — the choice returns_
> 2. "Wrong answer."
> 3. "Fifty in gold for the camp's location. Then you leave this town tonight." — _no fight; gold -50; sets verlanPaid_
> 4. "Hiwot. His coat." — _if Hiwot in company · no fight; Hiwot +1_
>

**FEMI** *(reply to 1)*  `q5_verlan_letters`

> [sweating] Then the priest is a liar. Or dead. Or both. I carry wine. I carry what I am given to carry, and I do not read it, and nobody has ever asked me to.
>

**FEMI** *(reply to 2)*  `q5_verlan_beat`

> [panicking] Wait — wait —
>

**FEMI** *(reply to 3)*  `q5_verlan_pay`

> [greedy, low] Fifty. Yes. There is a map in my boot: past Holloway Vale, under the old oak line. Do not use the road; they watch the road.
>
> [scurrying] I was never here, o.
>

**HIWOT** *(reply to 4)*  `q5_verlan_pocket`

> [murmuring] Map, seal, and a very old sausage. He did not feel a thing.
>
> [low] Past Holloway Vale, under the oaks. There is a note about the road being watched.
>

### Scene 2: Holloway Vale

*Following the courier’s map north toward the bandit camp, you reach Holloway Vale. A patrol blocks the crossing.*

_(if Santiago in company)_

**SANTIAGO**  `q5_patrol`

> [uneasy] Burning Gauntlet. A patrol, this far south of the city. They have someone at sword-point — and with respect, by her look, she is not from anywhere near here.
>

*Holloway Vale, on the way to the bandit camp. You come upon a Burning Gauntlet patrol holding a dark-elf priestess at sword-point.*

**LAYLA**  `q5_patrol`

> [cold] Yes. Stare. A dark elf, above ground, in daylight. You will not see another.
>
> [contemptuous] I am a priestess, and a fugitive, and there is a bounty on me that these three would like to collect. I cured a village of the coughing sickness on my way here. They are arresting me for having the wrong face. Decide what that makes you.
>

_(if Santiago in company)_

**SANTIAGO**  `q5_patrol_cassian`

> [formal, tight] A priestess of what, señora? Say it. I would know what I am deciding about.
>

_(if Santiago in company)_

**LAYLA**  `q5_patrol_cassian_reply`

> [level] Of a goddess your Order has no name for, boy, and would not like if it did. Does it change your sword arm?
>

_(if Santiago in company)_

**SANTIAGO**  `q5_patrol_cassian_after`

> [quietly] It might. — {target}. Your word decides it. Not mine.
>

> **What do you say?**
> 1. "What are you fleeing?" — _question — the choice returns_
> 2. "Let her go. She is under my protection." — _Layla +2; Santiago -2; Layla joins; sets ilvaraSaved_
> 3. "This is not my fight. We keep moving." — _no fight; Santiago +1; Layla -1_
> 4. "There is a bounty? Then I will take her in myself." — _no fight; blood +1; gold +100; Santiago -1; Delphine -2; sets ilvaraSold_
>

**LAYLA** *(reply to 1)*  `q5_ilvara_why`

> [flat] My own people. I refused a thing that was asked of me, and among my kind refusal is answered with a knife. I came up into the light because there was nowhere left to go down. I have not found the light kinder, ya stranger. Only brighter.
>

**LAYLA** *(reply to 2)*  `q5_ilvara_defend`

> [surprised] Protection. From you. How strange, and how useful.
>
> [dry] Very well. By the deep, I go where you go, until I decide otherwise. Try to be interesting.
>

**LAYLA** *(reply to 3)*  `q5_ilvara_walk`

> [flat] Of course. Walk on. Everyone does.
>

**LAYLA** *(reply to 4)*  `q5_ilvara_sell`

> [venomous] You will remember this. I will see that you do, from wherever they put me.
>

_(if Santiago not in company)_

**LAYLA**  `q5_patrol_ask`

> [cold] Well? You have looked long enough to decide.
>

> **What do you say?**
> 1. "What are you fleeing?" — _question — the choice returns_
> 2. "Let her go. She is under my protection." — _Layla +2; Santiago -2; Layla joins; sets ilvaraSaved_
> 3. "This is not my fight. We keep moving." — _no fight; Santiago +1; Layla -1_
> 4. "There is a bounty? Then I will take her in myself." — _no fight; blood +1; gold +100; Santiago -1; Delphine -2; sets ilvaraSold_
>

**LAYLA** *(reply to 1)*  `q5_ilvara_why`

> [flat] My own people. I refused a thing that was asked of me, and among my kind refusal is answered with a knife. I came up into the light because there was nowhere left to go down. I have not found the light kinder, ya stranger. Only brighter.
>

**LAYLA** *(reply to 2)*  `q5_ilvara_defend`

> [surprised] Protection. From you. How strange, and how useful.
>
> [dry] Very well. By the deep, I go where you go, until I decide otherwise. Try to be interesting.
>

**LAYLA** *(reply to 3)*  `q5_ilvara_walk`

> [flat] Of course. Walk on. Everyone does.
>

**LAYLA** *(reply to 4)*  `q5_ilvara_sell`

> [venomous] You will remember this. I will see that you do, from wherever they put me.
>

### Scene 3: The palisade

**WINSTON**  `q5_camp`

> [calm] Three ways into a camp like that, man. Loud, quiet, or invited.
>
> [dry] Desmond and I can be invited. Recruiters never look too close at faces that frighten them.
>

_(if Hiwot in company)_

**HIWOT**  `q5_camp`

> [whispering] Or I go over the palisade and open the back gate while every eye is on the front.
>

> **What do you say?**
> 1. "Get us invited." — _if flag umbralRecruited · no fight; Winston +1; sets campInvited_
> 2. "Hiwot. The back gate." — _if Hiwot in company · no fight; Hiwot +1; sets campQuiet_
> 3. "Loud. The front gate, now." — _blood +1_
>

**WINSTON** *(reply to 1)*  `q5_camp_recruits`

> [murmuring] Walk like you already killed somebody today. Desmond — no smiling.
>
> [low] We are in. The big tent is Gorruk's. There is a chained man inside; don't look at him yet.
>

**HIWOT** *(reply to 2)*  `q5_camp_quiet`

> [breathless] The back gate is open. Two sentries were sleeping, and one of them is going to wake with a headache and no boots.
>
> [low] The big tent is the lord's. There is a man chained in it who looks as though he still has jokes left.
>

**HIWOT** *(reply to 3)*  `q5_camp_storm`

> [resigned] Loud, then. Go for the one with the horns first; the rest will look to him.
>

_(if Winston in company, Hiwot not in company)_

**WINSTON**  `q5_camp`

> [calm] Three ways into a camp like that, man. Loud, quiet, or invited.
>
> [dry] Desmond and I can be invited. Recruiters never look too close at faces that frighten them.
>

> **What do you say?**
> 1. "Get us invited." — _if flag umbralRecruited · no fight; Winston +1; sets campInvited_
> 2. "Hiwot. The back gate." — _if Hiwot in company · no fight; Hiwot +1; sets campQuiet_
> 3. "Loud. The front gate, now." — _blood +1_
>

**WINSTON** *(reply to 1)*  `q5_camp_recruits`

> [murmuring] Walk like you already killed somebody today. Desmond — no smiling.
>
> [low] We are in. The big tent is Gorruk's. There is a chained man inside; don't look at him yet.
>

**HIWOT** *(reply to 2)*  `q5_camp_quiet`

> [breathless] The back gate is open. Two sentries were sleeping, and one of them is going to wake with a headache and no boots.
>
> [low] The big tent is the lord's. There is a man chained in it who looks as though he still has jokes left.
>

**WINSTON** *(reply to 3)*  `q5_camp_storm`

> [flat] Loud. Sawa — fine. The one with the horns is a sergeant; the rest look to him. Kill him first and they look to nobody.
>

### Scene 4: Gorruk's tent

*The lord's tent. A man in chains, a chest, and an ogre in a mage's coat rising from the cot.*

**CAL BOONE**  `q5_tent`

> [hoarse, drawling] Visitors. Well, ain't that fine. Y'all here for me, or for the ogre? Say me. Please say me.
>
> [urgent] Cal Boone — Warden, or I was 'fore the chain. That chest by the cot is full of letters, and every last one of 'em carries the same seal. Take the chest. Take me. In that order, if it's got to be.
>

_(if Itsuki in company)_

**ITSUKI**  `q5_tent_ithrel`

> [very quiet] Gorruk. Where does he sleep?
>

_(if Itsuki in company)_

**CAL BOONE**  `q5_tent_ithrel_reply`

> [a nod at the cot] Right there, friend. And he's waking up.
>

**GORRUK**  `q5_tent`

> [booming] The foundling. In my own tent. Somebody in the city is going to be very embarrassed when I send them your head in a bag.
>

_(if Itsuki in company)_

**ITSUKI**  `q5_shot`

> [very quietly] {target}. I have him. A clean line, no cover. Say yes.
>

> **What do you say?**
> 1. "Yes. Take it." — _boss cannot flee; Itsuki +2; sets gorrukDead_
> 2. "Hold. I want him alive to answer questions." — _Itsuki -2; sets ithrelHeld_
>

**ITSUKI** *(reply to 1)*  `q5_shot_yes`

> [exhaling] Thank you. Whatever comes after this — thank you.
>

**ITSUKI** *(reply to 2)*  `q5_shot_no`

> [tight] Alive. I have waited a year. I can wait until the end of a fight.
>

### After the last fight

_(if not gorrukDead)_

**GORRUK**  `q5_escape`

> [snarling] Not today, foundling. Not for you. The city will finish what I started.
>

> **What do you say?**
> 1. "Break Cal’s chains first. Then take the chest." — _sets caelFreed; sets lettersRecovered_
> 2. "Secure the chest first. Then break Cal’s chains." — _sets caelFreed; sets lettersRecovered_
>

**CAL BOONE** *(reply to 1)*  `q5_letters`

> [grinning through a split lip] Told you. Every one sealed with the iron hand. The Iron Consortium — the trading house in the Gate — pays for the mine, for these bandits, and for you.
>
> [serious] There's a second name under theirs. A mage called Olamide, in the Mirkhollow. They call his place "the other mine." I heard it twice through that tent wall, and men don't say a thing twice unless it matters.
>

**CAL BOONE** *(reply to 2)*  `q5_letters`

> [grinning through a split lip] Told you. Every one sealed with the iron hand. The Iron Consortium — the trading house in the Gate — pays for the mine, for these bandits, and for you.
>
> [serious] There's a second name under theirs. A mage called Olamide, in the Mirkhollow. They call his place "the other mine." I heard it twice through that tent wall, and men don't say a thing twice unless it matters.
>

_(if Delphine in company)_

**DELPHINE**  `q5_letters_selene`

> [level] A name, Cal. Not a seal. Somebody at the Consortium signs for this. Who?
>

_(if Delphine in company)_

**CAL BOONE**  `q5_letters_selene_reply`

> [thinking] No name on the paper, Del, I'll swear to that. But the ogre said "the Gate office" like it was one man, and once — only once — "Adeyinka." Said it the way a fella says a name he's scared of.
>

_(if flag ithrelHeld)_

**ITSUKI**  `q5_gone`

> [cold] He walked out of that tent because you wished it. I will find him myself.
>
> [flat] Do not follow me.
>

_(if flag gorrukDead)_

**ITSUKI**  `q5_dead`

> [quietly] It is done. I thought I would feel taller. I feel as though I could sleep for a year.
>
> [soft] I will stay, if you will have me. There is nothing else I was for.
>

### Back in town

_(if any of: flag ilvaraSaved / Desmond recruited, Santiago recruited)_

**SANTIAGO**  `q5_cassian_leaves`

> [quietly] I cannot ride beside a company that shelters what this one shelters. I have prayed on it, and I have tried to find a way, and I cannot.
>
> [formal] If your company changes, you will find me at the Open Hand. I hope it does. I hope that very much. God keep you, {target}.
>

---

## Quest 6 — Mirkhollow  *(Chapter 4)*

_The letters point into the Mirkhollow: spiders, druids who consider you trespass, wyverns, and a mine that is not on any map._

### Setting out

_One of the following, whoever is riding along:_

**DELPHINE**  `q6_forest`

> [calm] The Mirkhollow. Old wood — older than the Wardens, older than the Gate. It's got its own druids, and they ain't friends of ours; we keep the balance by law and they keep it by blood.
>
> [quiet] Keep to the deer paths. Anything down here that looks like a road was made by something with a great many legs.
>

**HIWOT**  `q6_forest`

> [low] Old trees. Very old, very big. Things in the branches that stop moving when we look.
>
> [a breath] I will go first. No. I will not. You go first.
>

### Scene 1: The nest

*The nest: white web thick as sailcloth between the trunks, and a man hanging in it upside down, apparently at his ease.*

**KAITO**  `q6_web`

> [cheerful, from above] Ah — hello. Yes. Up here. In the web. It is exactly as embarrassing as it looks, and I apologise for it.
>
> [appraising] Not bounty hunters; you walk too close together. A green sash — Wardens, then, or with Wardens. Good. Wardens cut people down for nothing. Kaito. I hunt bounties, mostly, and I was hunting a wyvern's head when the spiders took offence.
>

> **What do you say?**
> 1. "Who pays a bounty on a wyvern?" — _question — the choice returns_
> 2. "Wardens cut for nothing. I am not a Warden. What is your debt worth?" — _question — the choice returns; Kaito +1_
> 3. "Hold still. I’ll cut you free. You can ride with us." — _Kaito +1; Kaito joins; sets faelenRecruited_
> 4. "Spiders have to eat too." — _blood +1; sets faelenLeft_
>

**KAITO** *(reply to 1)*  `q6_faelen_wyvern`

> [bright] The magistrate of Thornbury, whose sheep keep disappearing. Three hundred in gold, and — I am told — the gratitude of a woman with a very fine face. I am still negotiating the second part.
>

**KAITO** *(reply to 2)*  `q6_faelen_price`

> [delighted] Ah. Now we are talking properly. My bow, until your road ends. And a thing I saw, which I think you will want: east of here, past the wyvern cliffs, there is a mine under the hill. Men in iron livery go in at dawn and men in chains come out at dusk. I did not go closer. I hunt beasts. That did not look like a beast.
>

**KAITO** *(reply to 3)*  `q6_faelen_cut`

> [relieved] You are my favourite person. I say that to everyone. This once, forgive me, I mean it.
>
> [smiling] I will come along, if you will have me. The wyverns are that way, and so, I suspect, is whatever you came into these woods to find.
>

**KAITO** *(reply to 4)*  `q6_faelen_leave`

> [calling after you] Fair enough! If you change your mind, I will be — well. Here.
>

### Scene 2: The druid grove

*A ring of standing stones in a clearing. A woman in bark and hide steps out of nothing and puts a staff across the path.*

**WANJIRU**  `q6_grove`

> [fierce] Far enough. This wood is not a road, and you are not welcome on it. The Umbra hold this grove, and the Umbra say turn around. Eh?
>
> [sniffing] You carry iron from the Gate. The wood smells it on you. Which of you is theirs?
>

*An old man is sitting against the nearest stone. He does not get up.*

**MZEE KAMAU**  `q6_grove_mzee`

> [old, unhurried] Wanjiru. They have been told to leave.
>
> [flat] I have buried nine of ours since that mine opened. If these people work for the Consortium, they will get no mercy from me.
>
> [cold] Hear them out if you must. They stay where they are.
>

_(if Delphine in company)_

**DELPHINE**  `q6_grove_selene`

> [steady] None of us. The iron's what we took off the men who are poisoning your river. We're here to shut their mine.
>

_(if Delphine in company)_

**WANJIRU**  `q6_grove_selene_reply`

> [narrowing] A Warden says so. Wardens said so about the last mine, and the last mine is still there.
>
> [low] Mzee Kamau would sooner have you bleed than speak. I would sooner hear you first. So. Speak.
>

> **What do you say?**
> 1. "What has been done to this wood?" — _question — the choice returns; sets heardTheWood_
> 2. "We are here for the men who poison your river with their mine. Your enemy is ours." — _if any of: Delphine in company / blood ≤ 0 / flag heardTheWood · no fight; Wanjiru +2; Delphine +1; Wanjiru joins; sets druidsPeace_
> 3. "Move, or be moved." — _blood +1; sets druidsFought_
>

**WANJIRU** *(reply to 1)*  `q6_nettle_ask`

> [bitter] Dead fish for a mile downstream. Stags with sores on their flanks. And men — men in chains, walking into a hole in the hill every dawn, and fewer walking out. The wood knows what is being done to it. It does not know how to stop it. I do.
>

**WANJIRU** *(reply to 2)*  `q6_nettle_talk`

> [grudging] Then we want the same thing, and I would rather kill them beside you than argue with the Mzee about killing you.
>
> [decisive] Sawa. I am coming. He can take it up with the trees.
>

**WANJIRU** *(reply to 3)*  `q6_nettle_fight`

> [snarling] Then the roots will have you. MZEE! Kamau! They have chosen!
>

_(if Delphine not in company)_

**WANJIRU**  `q6_grove_ask`

> [low] No answer. Then hear this: the Mzee would sooner have you bleed than speak. I would sooner hear you first. Speak, or turn around.
>

> **What do you say?**
> 1. "What has been done to this wood?" — _question — the choice returns; sets heardTheWood_
> 2. "We are here for the men who poison your river with their mine. Your enemy is ours." — _if any of: Delphine in company / blood ≤ 0 / flag heardTheWood · no fight; Wanjiru +2; Delphine +1; Wanjiru joins; sets druidsPeace_
> 3. "Move, or be moved." — _blood +1; sets druidsFought_
>

**WANJIRU** *(reply to 1)*  `q6_nettle_ask`

> [bitter] Dead fish for a mile downstream. Stags with sores on their flanks. And men — men in chains, walking into a hole in the hill every dawn, and fewer walking out. The wood knows what is being done to it. It does not know how to stop it. I do.
>

**WANJIRU** *(reply to 2)*  `q6_nettle_talk`

> [grudging] Then we want the same thing, and I would rather kill them beside you than argue with the Mzee about killing you.
>
> [decisive] Sawa. I am coming. He can take it up with the trees.
>

**WANJIRU** *(reply to 3)*  `q6_nettle_fight`

> [snarling] Then the roots will have you. MZEE! Kamau! They have chosen!
>

### Scene 3: The wyvern cliffs

_(if flag druidsPeace)_

**MZEE KAMAU**  `q6_grove_mzee_peace`

> [flat, from the trees] Wanjiru. If they are lying, you are the one who let them in.
>
> [grudging] Go with them, then. Make sure they shut that mine. I expect you back when it is done.
>

_(if Kaito in company)_

**KAITO**  `q6_wyverns`

> [bright] There she is. The matriarch. That head is worth three hundred in gold and a magistrate's gratitude, and I intend, respectfully, to collect both.
>

_(if Hiwot in company, Kaito not in company)_

**HIWOT**  `q6_wyverns`

> [appalled] It has a sting on its tail. Its tail has a sting.
>

### Scene 4: The mine gate

_(if Delphine in company)_

**DELPHINE**  `q6_gate`

> [calm] Iron livery on the guards. Consortium men. And the tall one — Kestrel. A sword for hire who'll guard anything for anybody. I've crossed him before.
>
> [flat] He won't talk. Don't waste your breath on it.
>

### Back in town

*Delphine, Beau’s wife and Tesfaye’s old friend, sits beside you at the fire.*

_(if Delphine recruited, Delphine alive)_

**DELPHINE**  `q6_fire`

> [quiet] Sit a minute. The forest's loud tonight and I want to say a thing before I lose the nerve.
>
> [soft] Tesfaye wrote to us every year about you. Twenty letters. I feel like I've known you since you could walk, and I met you a month ago. It's a strange thing. It ain't an unwelcome one.
>

> **What do you say?**
> 1. "What did he write?" — _question — the choice returns_
> 2. "He wrote to me about you, too. Not twenty letters. But enough." — _Delphine +2_
> 3. "You should sleep. It is a long walk to the mine."
> 4. "Beau is a fortunate man." — _Delphine +1; Beau +1_
>

**DELPHINE** *(reply to 1)*  `q6_fire_letters`

> [fond] The first year, that you'd learned to walk and walked straight into the library. The seventh, that you'd stolen honey from the brothers and let a cat take the blame. The last — that you were ready, and that he wasn't.
>

**DELPHINE** *(reply to 2)*  `q6_fire_warm`

> [a soft laugh] Enough. Yeah. That's a very Tesfaye amount.
>
> [warm] Goodnight, {target}. Wake me if the trees start walking.
>

**DELPHINE** *(reply to 3)*  `q6_fire_deflect`

> [quiet] All right. Get some rest. We can talk another time.
>
> [calm] Goodnight.
>

**DELPHINE** *(reply to 4)*  `q6_fire_dorran`

> [fond] He is. He also snores like a bear in a barrel, so the fortune runs both ways.
>
> [warm] Goodnight, {target}. Don't you tell him I said that.
>

---

## Quest 7 — The Iron Mine  *(Chapter 4)*

_The Consortium's secret mine, worked by slaves under a mage named Olamide. There is a valve at the bottom that can drown all of it._

### Setting out

_(if Beau in company)_

**BEAU**  `q7_gate`

> [grim] Slaves. They're w-working slaves in there. I can hear the chains from here.
>
> [steady] I'm going to the bottom for 'em, {target}. Whatever else we do today. Tell me you're with me.
>

> **What do you say?**
> 1. "We are with you. Everyone comes out." — _Beau +2; Delphine +1_
> 2. "The mage first. Then the slaves, if there is time." — _Beau -1_
>

**BEAU** *(reply to 1)*  `q7_dorran_with`

> [fierce] Good. G-good. The front's mine. Nothing gets past me today.
>

**BEAU** *(reply to 2)*  `q7_dorran_mission`

> [quiet] There'll be time. I'll m-make time.
>

### Scene 1: The upper works

_(if Wanjiru in company)_

**WANJIRU**  `q7_mine_umbra`

> [quiet] So this is the mine.
>
> [hard] For two years, I have watched the river get worse. Dead fish, sick animals. All because of this place.
>
> [firm] I want this mine shut before we leave.
>

_(if flag druidsFought, Hiwot in company)_

**HIWOT**  `q7_mine_umbra_none`

> [low] The druids wanted this mine shut down too.
>
> [dry] We could have had their help. Instead, we picked a fight with them. That was clever of us.
>

### Scene 2: The cages

_(if Hiwot in company)_

**HIWOT**  `q7_cages`

> [sick] They keep them in cages between shifts. Like dogs. Worse than dogs; I have seen dogs kept better than this.
>

### Scene 3: The third level

*A cage of iron bars at the end of the second level. The dwarf inside has been waiting in the dark long enough to be polite about it.*

**DAI MORGAN**  `q7_cage`

> [gravelly, Welsh] Well now. Either you're the new drivers or the old ones are dead. Which is it, then? — No, don't tell me; you're too muddy for drivers, and they'd have shot me by now.
>
> [hopeful] Dai Morgan. Priest of the deep places, and the last of the clan that cut this mine before the Consortium took it with paper and knives. I know every valve in it — including the one at the bottom that lets the river in.
>

_(if Beau in company)_

**BEAU**  `q7_cage_beau`

> [urgent] The ch-chain-gang. Where do they keep them between shifts?
>

_(if Beau in company)_

**DAI MORGAN**  `q7_cage_beau_reply`

> [grim] Bottom level, by the valve room, so the drivers can drown them if the mine's ever taken. Mind that, shield-man. Whoever turns that wheel turns it on them.
>

> **What do you say?**
> 1. "Paper and knives? How does a trading house take a dwarven mine?" — _question — the choice returns_
> 2. "The old ones are dead. Get up; you are with us." — _Dai Morgan +2; Dai Morgan joins; sets durnikFreed_
> 3. "Stay where you are. We will come back for you." — _blood +1; sets durnikLeft_
>

**DAI MORGAN** *(reply to 1)*  `q7_durnik_paper`

> [grim] A debt we didn't owe, bought off a man who didn't own it, and enforced by men with swords while the magistrate looked at the ceiling. My cousins argued. My cousins are on the lowest level now, and they don't argue anymore.
>

**DAI MORGAN** *(reply to 2)*  `q7_durnik_free`

> [grunting to his feet] With you. Aye. There's lovely. Mind the third level; the mage keeps his study there, and he doesn't care for knocking.
>

**DAI MORGAN** *(reply to 3)*  `q7_durnik_leave`

> [flat] Come back for me. Aye. Everybody says that, bach.
>

_(if Beau not in company)_

**DAI MORGAN**  `q7_cage_ask`

> [hopeful] So. Are you letting me out, or are you the polite sort of drivers?
>

> **What do you say?**
> 1. "Paper and knives? How does a trading house take a dwarven mine?" — _question — the choice returns_
> 2. "The old ones are dead. Get up; you are with us." — _Dai Morgan +2; Dai Morgan joins; sets durnikFreed_
> 3. "Stay where you are. We will come back for you." — _blood +1; sets durnikLeft_
>

**DAI MORGAN** *(reply to 1)*  `q7_durnik_paper`

> [grim] A debt we didn't owe, bought off a man who didn't own it, and enforced by men with swords while the magistrate looked at the ceiling. My cousins argued. My cousins are on the lowest level now, and they don't argue anymore.
>

**DAI MORGAN** *(reply to 2)*  `q7_durnik_free`

> [grunting to his feet] With you. Aye. There's lovely. Mind the third level; the mage keeps his study there, and he doesn't care for knocking.
>

**DAI MORGAN** *(reply to 3)*  `q7_durnik_leave`

> [flat] Come back for me. Aye. Everybody says that, bach.
>

### Scene 4: Olamide's study

*A study cut into the rock, warm and dry, with shelves of ledgers. A man in a good coat does not look up from his writing.*

**OLAMIDE**  `q7_study`

> [irritated] Get away from my desk. Those ledgers are Consortium property.
>
> [cold] Guards, kill them. The Consortium wants this mine kept running.
>

_(if Dai Morgan in company)_

**DAI MORGAN**  `q7_study_dai`

> [very level] Morgan. Bryn and Gareth Morgan. My cousins. Which ledger are they in, mage?
>

_(if Dai Morgan in company)_

**OLAMIDE**  `q7_study_dai_reply`

> [without looking up] Ledger four. The deceased column, I should think; the deep levels take the dwarves first. Guards!
>

_(if Dai Morgan in company)_

**DAI MORGAN**  `q7_study_dai_after`

> [quiet] ...Then I'll be having ledger four. Go on, {target}.
>

> **What do you say?**
> 1. "Who do you answer to? Say the name and I may let you keep your ledgers." — _question — the choice returns_
> 2. "Enough. We’re freeing the prisoners."
>

**OLAMIDE** *(reply to 1)*  `q7_malvane_who`

> [contemptuous] To the Gate office, and the Gate office answers to the men whose names are on the letters you have not yet found. You will not find them, my friend. Guards!
>

**OLAMIDE** *(reply to 2)*  `q7_malvane_fight`

> [cold] So be it.
>

_(if Winston in company, Dai Morgan not in company)_

**WINSTON**  `q7_study_winston`

> [flat] Two sets of books, mage. Which one goes to the Gate?
>

_(if Winston in company, Dai Morgan not in company)_

**OLAMIDE**  `q7_study_winston_reply`

> [contemptuous] Both. One to each partner, and neither to you. Guards!
>

_(if Dai Morgan not in company)_

**OLAMIDE**  `q7_study_ask`

> [cold] Well? You have interrupted my afternoon. Say why.
>

> **What do you say?**
> 1. "Who do you answer to? Say the name and I may let you keep your ledgers." — _question — the choice returns_
> 2. "Enough. We’re freeing the prisoners."
>

**OLAMIDE** *(reply to 1)*  `q7_malvane_who`

> [contemptuous] To the Gate office, and the Gate office answers to the men whose names are on the letters you have not yet found. You will not find them, my friend. Guards!
>

**OLAMIDE** *(reply to 2)*  `q7_malvane_fight`

> [cold] So be it.
>

### Scene 5: The valve room

_(if flag durnikFreed, Beau in company)_

**DAI MORGAN**  `q7_valve`

> [urgent] The valve room. Turn the great wheel and the river takes the bottom two levels in the time it takes to say a prayer.
>
> [hard] Your shield-man went below for the chain-gang. He isn't up yet.
>

_(if Beau in company)_

_One of the following, whoever is riding along:_

**DELPHINE**  `q7_valve`

> [tight] Beau's still down there. {target}. Beau is still down there.
>

**HIWOT**  `q7_valve`

> [frantic] Beau is below with the chain-gang. If you turn that wheel he drowns with them.
>

> **What do you say?**
> 1. "Turn the wheel. Now." — _no fight; blood +1; Delphine -3; Dai Morgan -1; Hiwot -1; Beau dies; sets floodedEarly_
> 2. "No one touches that wheel until Beau is up. Hold this room." — _Delphine +1; Beau +1; sets waitedForDorran_
>

**DELPHINE** *(reply to 1, when Delphine is the one speaking)*  `q7_flood_now`

> [screaming] NO —
>
> [broken] He was coming up. He was coming up. You heard the chains. You heard him.
>

**HIWOT** *(reply to 1, when Hiwot is the one speaking)*  `q7_flood_now`

> [shouting] NO —
>
> [hollow] He was coming up. We could hear the chains.
>

**BEAU** *(reply to 2)*  `q7_flood_wait`

> [shouting from below] Coming up! Nineteen of 'em and me! Hold the d-door — they're right behind us!
>

### After the last fight

_(if flag waitedForDorran)_

**BEAU**  `q7_after`

> [exhausted] Nineteen. Every one. Not one left in the dark.
>
> [quiet] Thank you for holding. I heard you say it. I won't forget it.
>

_(if flag floodedEarly, Delphine in company)_

**DELPHINE**  `q7_after_dead`

> [hollow] Olamide's papers. Names in the city. Take them. I don't care.
>
> [cold] I'll finish this road because Tesfaye asked it of me. Don't you speak to me until it's done.
>

_(if not floodedEarly)_

_One of the following, whoever is riding along:_

**DELPHINE**  `q7_papers`

> [reading] Olamide wrote to three men at the Consortium's tower in Varenholm's Gate. Adigun Adeyinka. Bankole. Rotimi.
>
> [calm] Adeyinka. Cal heard right. The bandits are broke and the mine's drowned, and the road north is open, and so, at last, are the names.
>

**HIWOT**  `q7_papers`

> [reading] Three names at the Consortium's tower in the city. Adigun Adeyinka, Bankole, Rotimi.
>
> [quiet] The road north is open now. There is nothing between us and the Gate but the Gate.
>

_(if flag floodedEarly)_

**HIWOT**  `q7_papers`

> [reading] Three names at the Consortium's tower in the city. Adigun Adeyinka, Bankole, Rotimi.
>
> [quiet] The road north is open now. There is nothing between us and the Gate but the Gate.
>

### Back in town

_(if not umbralBetrayed, Desmond recruited)_

**DESMOND**  `q7_papers`

> [soft] Those papers. Names, seals, routes. The people we answer to would pay plenty to read them before the Gauntlet does.
>
> [softer] Let Winston copy them tonight, and we stay quiet and useful for as long as you like.
>

_(if not umbralBetrayed, Winston recruited)_

**WINSTON**  `q7_papers`

> [flat] He means it. So do I. It is the only thing we were ever on this road for, and I told you I would say so before the day came. This is the day.
>

> **What do you say?**
> 1. "Who are the people you answer to?" — _question — the choice returns_
> 2. "Copy them tonight. The originals go to the city." — _Desmond +2; Winston +2; Delphine -1; Santiago -1; sets umbralPapers_
> 3. "No. And if either of you touches them, you leave this company." — _Desmond leaves the company; Winston leaves the company; Desmond gone for good; Winston gone for good; sets umbralBetrayed_
>

**WINSTON** *(reply to 1)*  `q7_papers_who`

> [level] The Umbral Hand. You have heard the name; everybody has, and everybody pretends they haven't. Merchants, mostly, of a kind. They want to know who is cornering iron on this coast, and why, and they don't much care who dies of the knowing.
>

**WINSTON** *(reply to 2)*  `q7_papers_give`

> [nodding] Copies. Fair. You won't regret keeping us.
>
> [dry] You may regret Desmond. That is a separate matter.
>

**DESMOND** *(reply to 3)*  `q7_papers_refuse`

> [very calm] Then we go, and you will see us again, and it won't be as friends.
>
> [light] It never was, really. I did tell you stories like yours get told badly.
>

*The throne again, nearer. Figures stand in the ash now, hundreds of them, and every one of them is looking at the chair.*

**TESFAYE**  `q7_dream`

> [echoing] The throne is closer this time, my child. You'll keep seeing it as your power grows.
>
> [grave] Morrak, the god of murder, left many children. You are one of them. Some of your kin have begun killing the others for his power. The man who hunts you is using the Consortium's money and hired killers to find them.
>
> [fading] Each child he kills makes him stronger and removes another rival for the throne. That is why he wants you dead. You can stop him without claiming Morrak's throne yourself.
>

> **What do you say?**
> 1. "Others. How many? Who?" — _question — the choice returns_
> 2. "I will stop him. I will not claim Morrak's throne." — _blood -1; sets dream2_
> 3. "If there are others, I had better be the strongest." — _blood +1; sets dream2_
>

**TESFAYE** *(reply to 1)*  `q7_dream_others`

> [quiet] I do not know how many are still alive. Most were raised by mortal families, as you were. Some may not know what they are. The man in black has been searching for them for years.
>

**TESFAYE** *(reply to 2)*  `q7_dream_reject`

> [proud] Twice now. It grows harder each time and you keep saying no. That is what courage is. No one warns you that it is dull.
>

**TESFAYE** *(reply to 3)*  `q7_dream_embrace`

> [grieving] The strongest of them is waiting for you at the end of this road, and he thinks exactly that.
>
> [fading] Please, my child. Be careful what you become on the way to him.
>

---

## Quest 8 — Varenholm's Gate  *(Chapter 5)*

_Serpent's Span, the checkpoint, and the city at last. A Burning Gauntlet officer wants something in the sewers dead and a trading house looked at._

### Setting out

*Serpent's Span: a bridge of black stone, a checkpoint, and behind it the towers of Varenholm's Gate. An officer with a burn-scarred jaw is reading your papers.*

**EMEKA OBI**  `q8_span`

> [gruff] Serpent's Span. Papers. — Ah. You are the company from the south. The one that drowned the Consortium's mine; half the city has heard it, the Consortium made sure of that when they went crying to the Council.
>
> [plain] Emeka Obi, Burning Gauntlet. One question before anything, and I want a number, not a story. The Consortium told the Council there were no slaves in that mine. How many did you see in chains?
>

> **What do you say?**
> 1. "Nineteen. I counted them out." — _if flag waitedForDorran · sets toldNineteen_
> 2. "Cages of them. I did not count."
> 3. "That is between me and the Duke."
>

**EMEKA OBI** *(reply to 1)*  `q8_count_nineteen`

> [writing] Nineteen. Good. A number a man can read aloud to a room of merchants. I will remember it when they tell me again that there were none.
>

**EMEKA OBI** *(reply to 2)*  `q8_count_many`

> [grunting] Cages. Ah-ah. "Cages" is a word the Council can argue with; a number they cannot. Next time, count. — It is not a small thing, what you did down there. I will say that once.
>

**EMEKA OBI** *(reply to 3)*  `q8_count_none`

> [flat] Between you and the Duke. Very well. The Duke will ask the same question, and he does not like "between" any more than I do.
>

**EMEKA OBI**  `q8_jobs`

> [plain] Duke Adebayo wants a word with you, but first I want two things done, and I would rather they were done by people the Consortium already hates. One: something under the docks is eating dock-workers, and the sewer-men will not go down. Two: the Nine Lanterns trading house has stopped being the Nine Lanterns. Same faces, wrong people; I cannot explain it better than that, and I have tried.
>
> [flat] Do both. Then the Duke.
>

> **What do you say?**
> 1. "Why does the Duke want me? He does not know me." — _question — the choice returns_
> 2. "Consider it done." — _Santiago +1_
> 3. "The Gauntlet pays for this, I assume." — _Hiwot +1_
>

**EMEKA OBI** *(reply to 1)*  `q8_halloran_why`

> [quiet] Because the iron trouble has a name now, and the name is the Iron Consortium, and you are the only people alive who walked out of their mine with proof. He does not know you. He knows that. Do the jobs, my friend. Bring the proof.
>

**EMEKA OBI** *(reply to 2)*  `q8_halloran_yes`

> [approving] Good answer. The docks are that way. Hold your breath.
>

**EMEKA OBI** *(reply to 3)*  `q8_halloran_pay`

> [snorting] It pays. Not well. Nobody in this city pays well except the people you are fighting.
>

### Scene 1: The sewers

_(if Hiwot in company)_

**HIWOT**  `q8_sewers`

> [gagging] I have been in a mine, a fortress and a spider nest this month, and THIS is the worst. This is the worst place.
>

_(if Dai Morgan in company, Hiwot not in company)_

**DAI MORGAN**  `q8_sewers`

> [approving] Good stonework, mind. Dwarven, some of it, and old. Shame about the smell.
>

### Scene 2: The Nine Lanterns door

_One of the following, whoever is riding along:_

**KAITO**  `q8_door`

> [murmuring] Doorman. Big. Bored. I can talk us past him; bored men love a story, and I have several.
>

**HIWOT**  `q8_door`

> [whispering] Doorman. I can get us past him. He will not even remember we were here.
>

**WINSTON**  `q8_door`

> [flat] Doorman. Leave him to me. Everybody has a price, and his is written on his face.
>

> **What do you say?**
> 1. "Kaito. Talk." — _if Kaito in company · no fight; Kaito +1_
> 2. "Hiwot. Quietly." — _if Hiwot in company · no fight; Hiwot +1_
> 3. "Winston. Pay him." — _if Winston in company · no fight; gold -30_
> 4. "We go through him."
>

**KAITO** *(reply to 1)*  `q8_door_faelen`

> [pleased] — and that is how I lost the boot. He is still laughing. In, in, before he thinks about it.
>

**HIWOT** *(reply to 2)*  `q8_door_wren`

> [smug] Side window. He is asleep on his feet. I told you.
>

**WINSTON** *(reply to 3)*  `q8_door_fennick`

> [flat] Thirty gold and the man has gone for a very long lunch.
>

**KAITO** *(reply to 4, when Kaito is the one speaking)*  `q8_door_force`

> [resigned] Through him. Very well. I will apologise to him afterwards; it seems only polite.
>

**HIWOT** *(reply to 4, when Hiwot is the one speaking)*  `q8_door_force`

> [sighing] Loud again. I am keeping a list.
>

**WINSTON** *(reply to 4, when Winston is the one speaking)*  `q8_door_force`

> [dry] Through him, then. Mind — a man that size falls slow.
>

### Scene 3: The counting room

_(if Delphine in company)_

**DELPHINE**  `q8_faces`

> [disturbed] That's the merchant's face and it ain't the merchant. Look at the eyes, honey. Nothing lives behind 'em.
>
> [hard] Shape-thieves. They wear you after they kill you. Don't let one get behind you.
>

_(if Hiwot in company, Delphine not in company)_

**HIWOT**  `q8_faces`

> [horrified] That is the merchant's face. That is his FACE and it is not him. Nothing is behind the eyes.
>

### Scene 4: The upper office

_(combat, no dialogue)_

### Back in town

*The Ducal Palace. A tired man in a red coat sits at a table covered in maps and does not get up.*

**DUKE ADEBAYO**  `q8_duke`

> [weary] So. The company that drowned a mine. Obi says you are rude and effective. I have use for both.
>
> [precise] Before I say anything worth hearing: the papers you carried out of that mine. Who else has seen them? Every name. I do not enjoy surprises in Council.
>

> **What do you say?**
> 1. "My company, and now you."
> 2. "The Umbral Hand has copies. I allowed it." — _if flag umbralPapers_
> 3. "Wardens. Delphine of the Open Hand read them first." — _if Delphine recruited_
>

**DUKE ADEBAYO** *(reply to 1)*  `q8_seen_nobody`

> [a nod] Good. Keep it so. A paper nobody has read is worth twice one everybody has argued about.
>

**DUKE ADEBAYO** *(reply to 2)*  `q8_seen_hand`

> [a long breath] The Umbral Hand. Then the whole market will have read them by the week's end, and the Council will hear it from fishwives before it hears it from me. Ah-ah. — Fine. Faster than my clerks, at least. It is not a small thing you have done, and I am not yet sure whether it was a good one.
>

**DUKE ADEBAYO** *(reply to 3)*  `q8_seen_wardens`

> [dry] Wardens. Then they are honest and nobody in this city will believe them. Good. That is one problem I already know how to solve.
>

**DUKE ADEBAYO**  `q8_duke_work`

> [precise] The Consortium poisoned its rivals' ore and kept its own iron to sell at a higher price. Adigun blames Calder for the shortage. Now someone is demanding we settle it with a war. The Council votes in a fortnight. I need the orders from their tower to prove who caused this, before ten thousand people die over a shortage those men arranged.
>

> **What do you say?**
> 1. "Then we will get them. For the city." — _Santiago +1; Delphine +1; leans gauntlet_
> 2. "For the city, and for a price." — _Hiwot +1; Kaito +1_
> 3. "The Consortium has been trying to kill me since Lanternhold. Why me, Duke?" — _sets askedHalvard_
>

**DUKE ADEBAYO** *(reply to 1)*  `q8_halvard_city`

> [nodding] Good. I will remember that when this is over. Dukes remember more than people think, my friend.
>

**DUKE ADEBAYO** *(reply to 2)*  `q8_halvard_pay`

> [dry] Five hundred on delivery. Obi will scowl. Ignore him; he scowls at me too.
>

**DUKE ADEBAYO** *(reply to 3)*  `q8_halvard_blood`

> [careful] I do not know, and I will not insult you with a guess. I know they were hunting Tesfaye's ward before they were hunting anyone else, and Tesfaye was a Warden who spent twenty years hiding something in a library.
>
> [quiet] Bring me the papers. Whatever they are hiding, it will be in them.
>

---

## Quest 9 — The Consortium Tower  *(Chapter 5)*

_The mine's orders lead to the Iron Consortium's headquarters. Adebayo wants their records. Inside, a well-dressed merchant offers help and asks you to stop his father._

### Setting out

**DUKE ADEBAYO**  `q9_plan`

> [precise] The Consortium is hiring swords. Go in as hired guards and search the top-floor offices. We need the orders bearing Adigun's seal.
>
> [dry] If you can do it without burning the tower down, the city would appreciate it. If you cannot, the city will understand.
>

*Inside the Consortium headquarters, a man in a fine merchant's coat draws you aside before the clerk can ask your business. He introduces himself as Sanni.*

**SANNI**  `q9_tower`

> [quiet, city-formal] Tesfaye's ward. I am Sanni. I knew him through the keep's book trade. He wrote about you and Hiwot. I was sorry to hear what happened on the Griffon Road.
>
> [low] Adigun Adeyinka is my father. Those orders from the mine carry his seal. He and his partners have gone to Lanternhold for a hearing over the iron shortage. He means to persuade the keepers that Calder is to blame.
>
> [urgent] He is preparing a war with Calder. Kill him before he buys the Council's vote and you could save thousands of lives. Go to the summit at Lanternhold. Read the evidence first, and hear what he has to say. I will meet you there.
>

### Scene 1: The lobby

_One of the following, whoever is riding along:_

**HIWOT**  `q9_lobby`

> [whispering] A clerk. Two guards. A very long list of names on his desk, and we are not on it.
>

**DELPHINE**  `q9_lobby`

> [murmuring] A clerk with a list and two guards who are paid to believe him.
>

**KAITO**  `q9_lobby`

> [murmuring] A clerk. A list. Two guards. Forgive me — I love a lobby.
>

**DAI MORGAN**  `q9_lobby`

> [gravelly] Clerk with a list. Two guards. Good stone, again. Shame.
>

> **What do you say?**
> 1. "We are the company from the south. Olamide sent for us before the mine flooded." — _if not umbralBetrayed · no fight; sets toweredQuiet_
> 2. "Guards first. The clerk if he runs." — _blood +1_
> 3. "Hiwot, go and see what is on that list." — _if Hiwot in company · no fight; Hiwot +1_
>

**HIWOT** *(reply to 1, when Hiwot is the one speaking)*  `q9_lobby_talk`

> [impressed] He BELIEVED you. Olamide's name still opens doors. Third floor, he says. Do not touch anything.
>

**DELPHINE** *(reply to 1, when Delphine is the one speaking)*  `q9_lobby_talk`

> [quiet] He believed it. Third floor. Don't touch anything.
>

**KAITO** *(reply to 1, when Kaito is the one speaking)*  `q9_lobby_talk`

> [smiling] He believed it. Third floor. Touch nothing, he says — as if.
>

**DAI MORGAN** *(reply to 1, when Dai Morgan is the one speaking)*  `q9_lobby_talk`

> [grunting] Third floor. Don't touch anything. Good advice for a tower, that.
>

**HIWOT** *(reply to 2, when Hiwot is the one speaking)*  `q9_lobby_fight`

> [flat] So much for quiet. Stairs. Go.
>

**DELPHINE** *(reply to 2, when Delphine is the one speaking)*  `q9_lobby_fight`

> [flat] Stairs, then.
>

**KAITO** *(reply to 2, when Kaito is the one speaking)*  `q9_lobby_fight`

> [cheerful] Stairs it is.
>

**DAI MORGAN** *(reply to 2, when Dai Morgan is the one speaking)*  `q9_lobby_fight`

> [grim] Stairs.
>

**HIWOT** *(reply to 3)*  `q9_lobby_wren`

> [hushed] Got it. There is a name at the bottom in red: "the ward — as agreed." Whatever we do up there, somebody upstairs already knows we are coming.
>

### Scene 2: The counting floor — or The counting floor — old friends (if umbralBetrayed)

_(if flag umbralBetrayed)_

**DESMOND**  `q9_betrayal`

> [bright] {target}! You found us! We work here now, you see it? It pays better than you did.
>
> [giggling] Winston says we should kill you quick. Me, I would like to take my time.
>

_(if flag umbralBetrayed)_

**WINSTON**  `q9_betrayal`

> [flat] Nothing personal, man. You said that yourself once.
>

### Scene 3: Folake's floor

*A floor of silk hangings and one desk. The woman behind it has been expecting you, and has poured two cups.*

**FOLAKE**  `q9_floor`

> [silken] Put the swords down; you will not need them on my floor, and I have poured two cups. I am Folake. I keep Kolade Adeyinka's bed warm and the Consortium's secrets warmer.
>
> [pleasant] I have given you his name. Now tell me what happened on the Griffon Road. Before Tesfaye died, did Kolade offer him a bargain? He usually does. I want to know what he offered.
>

_(if Santiago in company)_

**SANTIAGO**  `q9_floor_cassian`

> [low] With respect. You do not have to answer her. She is bargaining.
>

_(if Layla in company)_

**LAYLA**  `q9_floor_ilvara`

> [low, amused] Answer her. She is the only person in this tower telling the truth, and she is doing it for money. I respect that.
>

**FOLAKE**  `q9_floor_wait`

> [patient, smiling] I can wait. I am very good at waiting; it is most of what I do up here.
>

> **What do you say?**
> 1. "His life and his library, in exchange for me." — _sets toldFolake_
> 2. "Nothing. He simply took."
> 3. "Tell me what you are selling first, and I will decide what it costs."
>

**FOLAKE** *(reply to 1)*  `q9_offer_library`

> [satisfied] His library. Not gold, not the child's life — the old man's books. Kolade knew what Tesfaye loved and offered him exactly that. That is how he does everything, my dear, and it is why he will win unless somebody who understands him is on the other side. Which brings us to business.
>

**FOLAKE** *(reply to 2)*  `q9_offer_nothing`

> [a small smile] A lie, and a loyal one. He offered. He always offers; it is the only thing about him I still find beautiful. Keep your lie; it tells me you loved the old man, which is also useful. Now, business.
>

**FOLAKE** *(reply to 3)*  `q9_offer_price`

> [delighted] Oh, good. Somebody taught you. — I am selling a way into the palace, and the truth about what you are, and I want his head and the Consortium afterward. That is the whole shop. Now you know the price; pay me the answer, or do not, and we go on to business either way.
>

**FOLAKE**  `q9_floor_business`

> [brisk, pleasant] Now. He is going to be a Grand Duke by month's end, and he is going to have you killed for it. I would rather the reverse. Shall we talk, my dear?
>

> **What do you say?**
> 1. "Kolade Adeyinka. Who is he to this city? Say it as if I had never heard the name." — _question — the choice returns_
> 2. "Talk. Quickly." — _Kaito +1; Layla +1; Santiago -1; sets lysandraBargain_
> 3. "You will talk to Duke Adebayo. In chains." — _Santiago +1; sets lysandraArrested_
> 4. "You share his bed. You share his end." — _blood +1; Delphine -1; Amara -1; sets lysandraDead_
>

**FOLAKE** *(reply to 1)*  `q9_lysandra_kolade`

> [precise] Adigun Adeyinka's foster-son, and the head of the Consortium in everything but the ledger. The man in the black armour on your road; he told me about the road himself, and he told it fondly. He collects people like you. He says you are family. He does not mean it kindly, and he does not mean it as a threat either, which is the frightening part.
>

**FOLAKE** *(reply to 2)*  `q9_lysandra_deal`

> [pleased] Adigun wants high iron prices. A frightened city pays them. Kolade wants the war to happen. He has been using his father's couriers to hunt Morrak's children behind his back, and his tutor promises him godhood through mass murder. His father would stop the war if he knew how close it was.
>
> [soft] When you need a way into the palace, come to me. I will have one. The price is his head, and the Consortium afterward — for me.
>

**FOLAKE** *(reply to 3)*  `q9_lysandra_arrest`

> [amused] Chains. How lawful. Fine. I will tell Adebayo everything and he will hang me for it, and Kolade will still be sworn in on time.
>
> [bitter] Go upstairs. The top floor is where he keeps the truth about you.
>

**FOLAKE** *(reply to 4)*  `q9_lysandra_kill`

> [whispering] He will feel this. That is the only thing I am sorry for.
>

### Scene 4: The top floor

_(combat, no dialogue)_

### After the last fight

_One of the following, whoever is riding along:_

**DELPHINE**  `q9_top`

> [reading] Adigun Adeyinka, Bankole, Rotimi. Gone to Lanternhold — to LANTERNHOLD — for a summit with the keepers.
>
> [cold] The three men behind all of this are sitting in the library you grew up in.
>

**HIWOT**  `q9_top`

> [stunned] Lanternhold. They went HOME. The three men who paid to kill Tesfaye are sitting in his library. — The drawer. Delphine, the locked drawer. We are going to be in that room.
>

### Back in town

**DUKE ADEBAYO**  `q9_book`

> [grave] The keepers hold shipping records both kingdoms trust. They are hearing the dispute over the iron shortage. Take Adigun's orders to Lanternhold and show them who caused it.
>
> [quiet] I will have my officers keep looking for Kolade here. His father may know where he is. Question Adigun, and bring him back alive if you can. This book will pay your way into the keep.
>

_(if not floodedEarly, Delphine recruited, Delphine alive, Delphine affinity ≥ 0)_

**DELPHINE**  `q9_family`

> [warm] You're family, honey. You don't have to face this alone. Get some rest. We leave for Lanternhold in the morning.
>

---

## Quest 10 — Return to Lanternhold  *(Chapter 6)*

_The keepers are hearing the dispute over poisoned iron. Take the Consortium's orders to Lanternhold, confront Adigun and his partners, and find out where Kolade has gone._

### Setting out

*The hill road to Lanternhold. Sanni, the merchant you met at the Consortium headquarters, is waiting at the milestone with a ring in his hand.*

**SANNI**  `q10_ring`

> [quiet, city-formal] You found the papers, then. My father is in the reading room with Bankole and Rotimi. Before you go in, I have something of Tesfaye's for you.
>
> [calm] Take this ring. It was his once, before it was mine. And know this, my friend: the three men inside deserve whatever you decide to give them. Nobody will weep.
>

_(if Hiwot in company)_

**HIWOT**  `q10_ring_hiwot`

> [suspicious] How did you know Tesfaye? I lived in that keep twenty years and I never once saw you.
>

_(if Hiwot in company)_

**SANNI**  `q10_ring_hiwot_reply`

> [a warm, easy smile] He had dealings outside the keep, young lady. Some of them were confidential. I gave him my word that they would stay that way.
>

_(if Hiwot in company)_

**HIWOT**  `q10_ring_hiwot_after`

> [flat] That is not an answer.
>

_(if Hiwot in company)_

**SANNI**  `q10_ring_hiwot_end`

> [pleasantly] No. It is not. — The ring, {target}. Take it or do not; I have a long walk either way.
>

> **What do you say?**
> 1. "If it was Tesfaye's, I want it back." — _sets sarnRing_
> 2. "Keep it. I have not decided whether to trust you." — _Hiwot +1_
> 3. "If this is a trick, I will find you." — _blood +1; sets sarnRing_
>

**SANNI** *(reply to 1)*  `q10_sarn_take`

> [soft] Wear it inside. The keepers will know it. Find my father before he leaves the reading room.
>

**SANNI** *(reply to 2)*  `q10_sarn_refuse`

> [amused] Wise. Tesfaye taught you that. Go well anyway.
>

**SANNI** *(reply to 3)*  `q10_sarn_threat`

> [pleased] I believe you would. Go well, {target}.
>

_(if Hiwot not in company)_

**SANNI**  `q10_ring_ask`

> [pleasantly] Take it or do not, my friend; I have a long walk either way.
>

> **What do you say?**
> 1. "If it was Tesfaye's, I want it back." — _sets sarnRing_
> 2. "Keep it. I have not decided whether to trust you." — _Hiwot +1_
> 3. "If this is a trick, I will find you." — _blood +1; sets sarnRing_
>

**SANNI** *(reply to 1)*  `q10_sarn_take`

> [soft] Wear it inside. The keepers will know it. Find my father before he leaves the reading room.
>

**SANNI** *(reply to 2)*  `q10_sarn_refuse`

> [amused] Wise. Tesfaye taught you that. Go well anyway.
>

**SANNI** *(reply to 3)*  `q10_sarn_threat`

> [pleased] I believe you would. Go well, {target}.
>

### Scene 1: The reading rooms

**ABBA GEBRE**  `q10_gate`

> [cold] A book buys you the door. It does not buy you my good opinion.
>
> [stiff] Where did he die? On what road, and on what night? The keep's book of the dead wants a road and a night, and nobody has given me either.
>

> **What do you say?**
> 1. "The Griffon Road, the night we left. He stood between me and the man who killed him."
> 2. "Write "on the road." It is all you need."
>

**ABBA GEBRE** *(reply to 1)*  `q10_where_road`

> [writing, not looking up] "The Griffon Road. Standing." — Tesfaye left this keep with you and came back to it as a line in my book. Do not make a habit of it.
>

**ABBA GEBRE** *(reply to 2)*  `q10_where_refuse`

> [cold] "On the road." Very well. It is what he would have wanted written; he never cared for particulars. Do not make a habit of this, child.
>

**DAWIT**  `q10_gate`

> [kind] Pay him no mind. He mourns like a wall. — Come and find me in the upper reading room before you do anything else, my child. Tesfaye left something with me. For you. For now.
>

_(if Hiwot in company)_

**HIWOT**  `q10_home`

> [strange] It smells the same. Ink and dust and the brothers' lentils. I thought it would feel like home, and it feels like a trap.
>

### Scene 2: The summit

*Before the hearing, you find the three Consortium partners in the great reading room. Maps and shipping records cover their table.*

**ADIGUN ADEYINKA**  `q10_summit`

> [startled] Guards — no. No, hold. I know who you are.
>
> [shaking] Adigun Adeyinka. The mines, the bandits, the lies about Calder — we paid for those. I wanted higher prices, not a war that would close our trade routes. My foster-son is buying votes to send the army across the border. He used my seal to order your death, and Tesfaye's. My own couriers obey him now.
>

_(if Delphine in company)_

**DELPHINE**  `q10_summit_selene`

> [flat] Then answer me this, Adeyinka, before anybody decides anything. The iron hand in red wax on the ore wagons. Whose seal is that?
>

_(if Delphine in company)_

**ADIGUN ADEYINKA**  `q10_summit_selene_reply`

> [miserable] Mine. The house's. — He took it off my desk in the spring, and my couriers with it, and I have been signing for a man who no longer asks me.
>

_(if Delphine in company)_

**DELPHINE**  `q10_summit_selene_after`

> [to you, quiet] Your seal on the wagons and his on the bounty. Same wax. I've been right since the inn, honey, and I ain't glad of it.
>

**BANKOLE**  `q10_summit`

> [bluster] Kill them, Adigun, they have swords in a LIBRARY —
>

> **What do you say?**
> 1. "You paid for the mines and the bandits. You will not leave this room alive." — _blood +1; Santiago -1; Delphine -1; Layla +1; sets leadersKilled_
> 2. "I will not kill you. Tell me what your son has been doing." — _no fight; sets leadersSpared_
> 3. "You will answer to Adebayo. All three of you. Nobody dies in a library." — _no fight; blood -1; Santiago +1; sets leadersSpared; sets leadersArrested_
>

**ADIGUN ADEYINKA** *(reply to 1)*  `q10_summit_kill`

> [terrified] He will not stop when we are dead. He will not STOP —
>

**ADIGUN ADEYINKA** *(reply to 2)*  `q10_summit_talk`

> [whispering] Kolade. Kolade Adeyinka. His tutor told him who his real father was. Then he started paying for reports on other children, all over the coast. I thought he was looking for relatives. I found the death notices with the bounty payments.
>
> [broken] He is in this keep tonight. I do not know what face he is wearing.
>

**ADIGUN ADEYINKA** *(reply to 3)*  `q10_summit_arrest`

> [relieved] Yes. Yes. Adebayo. Anything. Take us out of here before he —
>

### Scene 3: The catacombs

*Before you can escort the merchants out, Sanni enters and bars the door. Two of his retainers seize Bankole and Rotimi. Sanni draws a knife and steps toward Adigun.*

_(if not leadersKilled)_

**SANNI**  `q10_murder`

> [cold] You were supposed to kill him. Very well. Father, your couriers brought me your letter to the Council. You will not be calling off my war.
>

*Sanni drives the knife into Adigun. Behind him, his retainers cut the other two merchants' throats. Sanni wipes the blade inside his sleeve and opens the door.*

_(if not leadersKilled)_

**ADIGUN ADEYINKA**  `q10_summit_kill`

> [terrified] He will not stop when we are dead. He will not STOP —
>

_He dies._

*Sanni calls the keep's guards into the reading room. He points at your company, standing beside the three bodies. His retainers step aside to let the guards through.*

**SANNI**  `q10_accuse`

> [shouting] Guards! In here! Tesfaye's ward has murdered my father and his partners. Take their weapons. Do not let this company leave the keep!
>

_(if flag leadersKilled)_

**ABBA GEBRE**  `q10_arrest`

> [thundering] Three men dead in my reading room. Put down your weapons. You and your whole company are under arrest. To the cells. Now.
>

_(if not leadersKilled)_

**ABBA GEBRE**  `q10_arrest_spared`

> [thundering] You say you spared them. Sanni says he found you over their bodies. I will hear you separately, under guard. Put down your weapons. To the cells.
>

*The lock turns behind your company. Your weapons are taken to a chest outside the cell. Hours later, Dawit comes to the bars with Tesfaye's sealed letter.*

**DAWIT**  `q10_letter`

> [gently] Sit. I have Tesfaye's letter here. Before you read it... did he say anything at the end? I need to know.
>

> **What do you say?**
> 1. "That he had been proud of me every day since he carried me through the gate."
> 2. "Only "run." And two names."
> 3. "I did not hear. I was doing as I was told."
>

**DAWIT** *(reply to 1)*  `q10_end_proud`

> [closing his eyes] Then he managed it. He practised that sentence on me for a year, my child, and never once got through it without stopping. — Here. Read it. I will stay.
>

**DAWIT** *(reply to 2)*  `q10_end_run`

> [softly] "Run." Yes. He was a practical man to the last breath. He wrote the rest down, so that he would not have to trust the last breath to carry it. — Here. Read it. I will stay.
>

**DAWIT** *(reply to 3)*  `q10_end_nothing`

> [gently] Then you did the only thing he asked, and it is the reason I can give you this at all. — Here. Read it. I will stay.
>

**DAWIT**  `q10_letter_give`

> [quiet] Tesfaye wrote it the year he brought you here. He made me swear to give it to you only when someone had already tried to tell you the wrong way.
>

*You read it twice. Then you read the last line a third time.*

**TESFAYE**  `q10_letter`

> [echoing, read aloud] "If you are reading this, my child, I failed to tell you myself, and I am sorry. Your mother was one of many. Your father was Morrak, the god of murder, in the last year before he died — and he sired children so that one of them might one day take his place. You are one. So is the man who killed me. He is your brother. He believes the throne is his. It is not, unless you decide it is."
>

> **What do you say?**
> 1. "He raised a monster and loved it anyway." — _blood -1; Delphine +1; Hiwot +1; sets letter_
> 2. "Twenty years and he never said a word. He should have told me." — _Hiwot -1; sets letter_
> 3. "A throne. And a brother sitting in my seat." — _blood +1; sets letter_
>

**DAWIT** *(reply to 1)*  `q10_letter_grief`

> [soft] He raised a child. What the child became was always going to be the child's own work. He knew that. He hoped.
>

**DAWIT** *(reply to 2)*  `q10_letter_anger`

> [sad] He tried, every year. He wrote it out and burned it. He thought one more year of not knowing was one more year of you being only his.
>

**DAWIT** *(reply to 3)*  `q10_letter_hunger`

> [frightened] Do not — {target}. He wrote the last line for exactly that look on your face. Read it again.
>

*Dawit opens the cell. You reclaim your gear while he uncovers a narrow passage behind the wall. Footsteps are already coming down the stairs.*

**DAWIT**  `q10_escape`

> [urgent] I brought the cell key. Your gear is in the chest outside; take it. Sanni has ordered your transfer to the Gate at dawn. I do not trust him. The old passage behind this wall leads through the catacombs to the shore. Go, and do not trust any face you meet down there.
>

**GBENGA**  `q10_catacombs`

> [bored] Down here, then. Good. Fewer witnesses and no keepers.
>
> [professional] Gbenga. Your brother sends his regards and would like this finished before breakfast. — Which of you is the ward? I was given a face, not a name, and it is dark.
>

_(if Layla in company)_

**LAYLA**  `q10_catacombs_ilvara`

> [amused] Guess.
>

_(if Hiwot in company, Layla not in company)_

**HIWOT**  `q10_catacombs_hiwot`

> [brightly] None of us. We are pilgrims.
>

**GBENGA**  `q10_catacombs_end`

> [sighing] Then all of you. It costs me nothing extra.
>

### Scene 4: The crypt of faces

_(if Hiwot in company)_

**HIWOT**  `q10_double`

> [Hiwot's voice, wrong] {target}. Thank the saints. I got separated — come here, come HERE, we have to go —
>

> **What do you say?**
> 1. "Wrong voice. Strike first." — _if Hiwot in company · Hiwot leaves the company; sets wrenHurt_
> 2. "Wrong voice. Strike first." — _if Hiwot not in company_
> 3. "What did I steal from the brothers' kitchen when I was nine?" — _if Hiwot in company · Hiwot +2; sets wrenKept_
> 4. "...Come here, then. Slowly." — _blood +1; sets listenedToDouble_
>

**DELPHINE** *(reply to 1, when Delphine is the one speaking)*  `q10_double_strike`

> [sharp] Two of 'em — and the real Hiwot was BEHIND it, {target}, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own.
>
> [grim] I'll get her to the surface. Go on without us.
>

**LAYLA** *(reply to 1, when Layla is the one speaking)*  `q10_double_strike`

> [approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.
>

**KAITO** *(reply to 1, when Kaito is the one speaking)*  `q10_double_strike`

> [wincing] Right call, wrong result — the real Hiwot was behind it. She is breathing. I will carry her out; go.
>

**DELPHINE** *(reply to 2, when Delphine is the one speaking)*  `q10_double_strike_alone`

> [grim] That wasn't him, and you knew it before I did. It's dead. There's two more behind it wearing faces I don't know — keep moving.
>

**LAYLA** *(reply to 2, when Layla is the one speaking)*  `q10_double_strike_alone`

> [approving] Good. You did not even let it finish. There are more behind it; kill them the same way.
>

**KAITO** *(reply to 2, when Kaito is the one speaking)*  `q10_double_strike_alone`

> [breathless] Not him — and you knew. It is down. Two more behind it, and I do not like their faces either.
>

**HIWOT** *(reply to 3)*  `q10_double_question`

> [the real Hiwot, furious] The HONEY. It was the honey, and Brother Yonas still blames the cat — that thing wearing my face does not know that, so STAB IT.
>

**DELPHINE** *(reply to 4, when Delphine is the one speaking)*  `q10_double_listen`

> [urgent] That ain't who it looks like. {target}. That is NOT them. It's already reaching for your throat — move!
>

**LAYLA** *(reply to 4, when Layla is the one speaking)*  `q10_double_listen`

> [sharp] That is not your kin. Kill it before it kisses you.
>

**KAITO** *(reply to 4, when Kaito is the one speaking)*  `q10_double_listen`

> [shouting] Not them! NOT them! It has teeth, {target}!
>

_(if Hiwot not in company)_

**TESFAYE**  `q10_double`

> [Tesfaye's voice, wrong] {target}. I am not dead. It was a trick — a Warden trick — come to me, child, come here —
>

> **What do you say?**
> 1. "Wrong voice. Strike first." — _if Hiwot in company · Hiwot leaves the company; sets wrenHurt_
> 2. "Wrong voice. Strike first." — _if Hiwot not in company_
> 3. "What did I steal from the brothers' kitchen when I was nine?" — _if Hiwot in company · Hiwot +2; sets wrenKept_
> 4. "...Come here, then. Slowly." — _blood +1; sets listenedToDouble_
>

**DELPHINE** *(reply to 1, when Delphine is the one speaking)*  `q10_double_strike`

> [sharp] Two of 'em — and the real Hiwot was BEHIND it, {target}, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own.
>
> [grim] I'll get her to the surface. Go on without us.
>

**LAYLA** *(reply to 1, when Layla is the one speaking)*  `q10_double_strike`

> [approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.
>

**KAITO** *(reply to 1, when Kaito is the one speaking)*  `q10_double_strike`

> [wincing] Right call, wrong result — the real Hiwot was behind it. She is breathing. I will carry her out; go.
>

**DELPHINE** *(reply to 2, when Delphine is the one speaking)*  `q10_double_strike_alone`

> [grim] That wasn't him, and you knew it before I did. It's dead. There's two more behind it wearing faces I don't know — keep moving.
>

**LAYLA** *(reply to 2, when Layla is the one speaking)*  `q10_double_strike_alone`

> [approving] Good. You did not even let it finish. There are more behind it; kill them the same way.
>

**KAITO** *(reply to 2, when Kaito is the one speaking)*  `q10_double_strike_alone`

> [breathless] Not him — and you knew. It is down. Two more behind it, and I do not like their faces either.
>

**HIWOT** *(reply to 3)*  `q10_double_question`

> [the real Hiwot, furious] The HONEY. It was the honey, and Brother Yonas still blames the cat — that thing wearing my face does not know that, so STAB IT.
>

**DELPHINE** *(reply to 4, when Delphine is the one speaking)*  `q10_double_listen`

> [urgent] That ain't who it looks like. {target}. That is NOT them. It's already reaching for your throat — move!
>

**LAYLA** *(reply to 4, when Layla is the one speaking)*  `q10_double_listen`

> [sharp] That is not your kin. Kill it before it kisses you.
>

**KAITO** *(reply to 4, when Kaito is the one speaking)*  `q10_double_listen`

> [shouting] Not them! NOT them! It has teeth, {target}!
>

### Scene 5: The way out

_(combat, no dialogue)_

### After the last fight

_One of the following, whoever is riding along:_

**DELPHINE**  `q10_shore`

> [weary] The shore. Air. We're out.
>
> [hard] Sanni sent us after his father. Then he called the guards on us. With Adigun dead and us wanted for murder, who is left to stop him?
>

**HIWOT**  `q10_shore`

> [shaking] Out. We are out. I am never going home again, am I.
>
> [small] Sanni sent us into that room. Then he told the guards we'd murdered his father. He had this planned before we ever left the city.
>

### Back in town

*Back at the Consortium tower, away from your company: Sanni has set aside his merchant's coat. He wears the spiked black armour from the Griffon Road. His tutor calls him Kolade.*

**BABA OLUSEGUN** *(to Kolade Adeyinka)*  `q10_unmasked`

> [dry] Your father is dead, Kolade. The ward has escaped the keep. I take it we are continuing with the war?
>

**KOLADE ADEYINKA** *(to Baba Olusegun)*  `q10_unmasked`

> [calm] Of course. Adigun wanted frightened customers paying twice the price. He would never have let the armies march. Now the Consortium is mine, and the ward will be hunted as a murderer.
>
> [pleased] Let them run. We know where to look for the other children. Once the war begins, nobody will spare soldiers to protect them. I will deal with Tesfaye's ward when I choose.
>

*The throne is close enough to touch. A man in black armour is already sitting in it, and he is smiling at you like a brother.*

**TESFAYE**  `q10_dream`

> [echoing] Now you have my letter. I should have told you about your brother myself, when I could still help you face him.
>
> [grave] Kolade plans to murder the other children and take their power. His tutor means to use the deaths in the war as an offering to Morrak, to make Kolade a god. Stop the war and you deny him that sacrifice.
>
> [fading] The last time I ask. Feed it, or starve it.
>

> **What do you say?**
> 1. "Starve it. I will stop him as myself." — _blood -1; sets dream3_
> 2. "If it takes a god to stop a god, then feed it." — _blood +1; sets dream3_
>

**TESFAYE** *(reply to 1)*  `q10_dream_reject`

> [at peace] Then I did enough. Go and finish it, my child, and come home to whoever is waiting.
>

**TESFAYE** *(reply to 2)*  `q10_dream_embrace`

> [quiet] Then I hope I am wrong about what that costs. I have been wrong before. Not about this. Go.
>

---

## Quest 11 — The Hunted City  *(Chapter 7)*

_Wanted posters carry your face. Emeka Obi is dead, Segun Marr commands the Gauntlet, and Duke Adebayo is dying under the care of a physician who is not a physician._

### Setting out

*The Gate, at dawn. Your face is nailed to every post on the street.*

_One of the following, whoever is riding along:_

**HIWOT**  `q11_posters`

> [reading] "Wanted, for the murder of Grand Duke Ayodele and of the Consortium summit at Lanternhold: the ward of Tesfaye, and company." That is your face. That is a BAD drawing of your face.
>
> [quiet] The street is full of it: Emeka Obi is dead. A man called Segun Marr commands the Gauntlet now, and he is the one who signed this.
>

**DELPHINE**  `q11_posters`

> [cold] Grand Duke Ayodele was murdered last night and they've put your name on it. Obi's dead too. A man called Segun Marr runs the Gauntlet now.
>
> [calm] Kolade will be sworn in as the new Duke within days. He's moved everything into place while we were underground.
>

_One of the following, whoever is riding along:_

**DELPHINE**  `q11_doors`

> [calm] Three ways into that palace, and we won't get a second try.
>
> [measured] Adebayo's dying; cure him and the Gauntlet is ours. Folake offered a way in, for a price. And the thieves under the Undervault will sell us a door if we owe 'em after.
>

**HIWOT**  `q11_doors`

> [thinking] Three doors. Adebayo, if we can save him. Folake, if you can stand her. Or Tunde Softfoot and a debt.
>

> **What do you say?**
> 1. "We find Adebayo and we save him. We do this lawfully." — _Santiago +2; Delphine +1; Kaito -1; allegiance: gauntlet_
> 2. "Folake. Kolade's head for her Consortium. I can live with that." — _if flag lysandraBargain · blood +1; Layla +1; Santiago -2; allegiance: consortium_
> 3. "The thieves. A debt is cheaper than a Duke." — _Kaito +2; Hiwot +1; Santiago -1; allegiance: thieves_
>

**DELPHINE** *(reply to 1, when Delphine is the one speaking)*  `q11_alleg_gauntlet`

> [approving] Lawfully. Tesfaye would've said the same, and then he'd have cheated a little. Let's go find the Duke.
>

**HIWOT** *(reply to 1, when Hiwot is the one speaking)*  `q11_alleg_gauntlet`

> [nodding] The Duke. All right. I like a Duke who owes us.
>

**DELPHINE** *(reply to 2, when Delphine is the one speaking)*  `q11_alleg_consortium`

> [flat] Her. Fine. I'll hold my nose. Don't you let her hold anything of yours.
>

**HIWOT** *(reply to 2, when Hiwot is the one speaking)*  `q11_alleg_consortium`

> [uneasy] Folake. I do not trust her smile. I do not trust anything about her. But she does have a door.
>

**DELPHINE** *(reply to 3, when Delphine is the one speaking)*  `q11_alleg_thieves`

> [dry] Tunde Softfoot never forgets a debt. Neither will you. All right — the Undervault.
>

**HIWOT** *(reply to 3, when Hiwot is the one speaking)*  `q11_alleg_thieves`

> [grinning] Tunde! Yes. I was hoping you would say that. Thieves are honest about what they are.
>

### Scene 1: The patrol

_(combat, no dialogue)_

### Scene 2: Adebayo's sick-room

*The Duke's sick-room. A man in a physician's coat stands between you and the bed with a cup in his hand.*

**IDRIS**  `q11_healer`

> [oily] The Duke is resting. He must not be disturbed. I am his physician, and I will thank you to —
>
> [dropping the voice] — ah. You. The face on the posters. How very tiresome.
>

### Scene 3: The docks

*The docks, at dusk. A woman with two swords across her back is waiting at the end of the pier, alone.*

**AMARA**  `q11_docks`

> [steady] Put the swords away. If I wanted you dead I would have done it from the rooftop.
>
> [grave] I am Amara. I love Kolade Adeyinka. I also helped him kill the man who raised you. I know what that makes me to you. But I need you to hear me. Have you ever loved someone even after you knew what they'd done?
>

> **What do you say?**
> 1. "Yes." — _Amara +1_
> 2. "I loved a man who lied to me for twenty years. Does that count?"
> 3. "No. And I do not intend to start."
>

**AMARA** *(reply to 1)*  `q11_loved_yes`

> [a slow nod] Then you know the shape of it. Good. I will not have to explain the rest, only ask it.
>

**AMARA** *(reply to 2)*  `q11_loved_tesfaye`

> [quiet] Yes. Kolade has lied to me too. I know he has hurt people. I still care for him, but I cannot let him go on killing.
>

**AMARA** *(reply to 3)*  `q11_loved_no`

> [level] Then you will think what I ask is weakness. Hear it anyway; you may need it later, when you are older and less certain.
>

_(if Itsuki in company)_

**ITSUKI**  `q11_docks_ithrel`

> [very quiet] The north road. A year ago. Were you there when the wagons burned?
>

_(if Itsuki in company)_

**AMARA**  `q11_docks_ithrel_reply`

> [without flinching] No. I was not. But I did not stop him sending Gorruk north, and I could have. Put that on my account with the rest, ranger. I will not argue the sum.
>

**AMARA**  `q11_docks_ask`

> [grave] Here is what I ask. Stop him. Not kill him. Stop him. There is a difference, and it matters to me more than my own life.
>

> **What do you say?**
> 1. "How does one stop a man like that without killing him?" — _question — the choice returns_
> 2. "If it can be done without killing him, I will do it that way. You have my word." — _no fight; blood -1; Amara +3; Itsuki -1; sets promisedAmara_
> 3. "He killed Tesfaye. He dies." — _no fight; Amara -2; Itsuki +1_
> 4. "Of course. You have my word." — _no fight; blood +1; Amara +1; sets liedToAmara_
>

**AMARA** *(reply to 1)*  `q11_amara_how`

> [exact] Chains, and a cell, and the Council's law. He is not a god yet. He bleeds, he tires, he can be beaten to his knees; I have seen it done, once, in the fire temple where we met. On his knees he can be bound. It is not a small thing I ask. I know that.
>

**AMARA** *(reply to 2)*  `q11_amara_promise`

> [exhaling] Thank you. I did not expect that.
>
> [quiet] The coronation is in three nights. Two people called Rasheed and Kemi hold the invitations in the Undervault. Take them from them; they will not give them up.
>

**AMARA** *(reply to 3)*  `q11_amara_refuse`

> [cold] Then we will meet at the gate of the Undercity, and one of us will not walk past the other.
>
> [flat] Rasheed and Kemi hold the invitations. Undervault. Take them; it does not change what I said.
>

**AMARA** *(reply to 4)*  `q11_amara_lie`

> [searching] ...Your word. Yes. — Rasheed and Kemi, the Undervault. The invitations. Go.
>

### Scene 4: The Undervault

**RASHEED**  `q11_undervault`

> [grinning] Kemi. Kemi, look. It is the poster. In person! Ah-ah — do we get the reward if we kill it ourselves?
>

**KEMI**  `q11_undervault`

> [bored] The reward is a thousand and the invitations are worth more. Stop talking and start bleeding them.
>

### After the last fight

_(if allegiance gauntlet)_

**DUKE ADEBAYO**  `q11_cured`

> [weak] Poison. Slow. He was — the physician was — I could not make my mouth work to say it.
>
> [rallying] Kolade. It was always Kolade. Get me to my own guard and I will get you into that coronation.
>

### Back in town

_(if allegiance gauntlet)_

**DUKE ADEBAYO**  `q11_way`

> [stronger] Two invitations and a Duke who owes you his life. Olumide will hold the doors. Folasade will hold the Council. You hold the evidence.
>
> [grave] He will not go quietly. He will run for the Undercity. When he does, do not let him reach the altar first.
>

_(if allegiance thieves)_

**TUNDE SOFTFOOT**  `q11_way`

> [soft] Two invitations, and a debt to the Undervault that you will pay when I say. Fair?
>
> [softer] Fair. Here is what nobody told you, my friend: under the palace is the old city. Under the old city is a temple. He is going there when it falls apart. So are you.
>

_(if allegiance consortium)_

**FOLAKE**  `q11_way`

> [silken] Two invitations and a bargain kept. His head; my Consortium. I will have a carriage at the palace steps.
>
> [cool] When it goes wrong — and it will — he will run for the Undercity. I will show you the way down. Nobody else knows it but Amara.
>

---

## Quest 12 — The Coronation  *(Chapter 7)*

_Kolade will be sworn in as Grand Duke tonight and declare war on Calder by morning. You have an invitation, the evidence, and a company in borrowed clothes._

### Setting out

*The palace steps, at night. Every window is lit.*

_One of the following, whoever is riding along:_

**DELPHINE**  `q12_steps`

> [low] Borrowed silks, real steel, two invitations. Everybody in that hall is either a guest or a shape-thief, and there's no way to tell which till the knives come out.
>
> [calm] Stay near the dukes. He needs them dead more than he needs you.
>

**HIWOT**  `q12_steps`

> [itching] I hate silk. I hate silk SO much. — There he is. On the dais. Smiling. He has a lovely smile. I want to put it through a wall.
>

### Scene 1: The great hall

*The great hall. Halfway through the oath, the guests nearest the dukes draw knives.*

**DUKE OLUMIDE**  `q12_hall`

> [booming] Blades! Blades in the hall! Folasade — Folasade, to me —
>

> **What do you say?**
> 1. "Olumide first. He is the one with the sword." — _sets protectedOrlan; sets dukeDead_
> 2. "Folasade first. She is the one who will believe us." — _sets protectedMira_
> 3. "Neither. Kolade. Now, while he is on the dais." — _blood +1; sets wentForKorvath; sets dukeDead; sets bothDukesDead_
>

**DUKE OLUMIDE** *(reply to 1)*  `q12_dukes_orlan`

> [roaring] HA! With me, then! Folasade — Folasade, get BEHIND something!
>

**DUKE FOLASADE** *(reply to 2)*  `q12_dukes_mira`

> [sharp] Good. Keep them off me and I will keep the Council listening. That is the only thing that matters in this room.
>

**DELPHINE** *(reply to 3, when Delphine is the one speaking)*  `q12_dukes_korvath`

> [shouting] The dukes are DYING, {target} — we can't hold both if you run at him —
>

**HIWOT** *(reply to 3, when Hiwot is the one speaking)*  `q12_dukes_korvath`

> [shouting] The dukes — {target}, the DUKES — we cannot hold them if you run at him —
>

### Scene 2: The dais

*The armoured giant from the Griffon Road pulls off the face of a Grand Duke's guest. Under it is a man who looks like you.*

**KOLADE ADEYINKA**  `q12_reveal`

> [calm, pleasant, to the hall] Enough. Put it down, all of you; nobody in this room is going to be paid tonight, and I would rather not lose good people to bad timing.
>
> [warm, to you] There you are. I have wanted to hear my brother's voice — my sister's — for a year, and I have only ever had it second-hand, from frightened men. Say something. The hall can wait; it is mostly dead.
>

> **What do you say?**
> 1. "Olamide's ledgers. Adigun's confession. Folake's letters. Every duke here can read." — _Santiago +1; Delphine +1_
> 2. "You killed the only father either of us ever had." — _blood -1; Hiwot +1_
> 3. "You are sitting in my seat, brother." — _blood +1; Layla +1; Santiago -1_
>

**KOLADE ADEYINKA** *(reply to 1)*  `q12_face_evidence`

> [delighted] Paper! Tesfaye's child brings paper to a coronation. That is the most charming thing I have seen in a year, and I mean that; he taught you well.
>
> [gently] It does not matter. Look at their faces: the war is already in their mouths, and paper does not take words back out. Baba — take me down.
>

**KOLADE ADEYINKA** *(reply to 2)*  `q12_face_aldric`

> [quiet, honest] He was never mine. He chose you. He could have chosen both of us, and he chose you, and I have made my peace with it in a way I do not think you have.
>
> [courteous] Baba. Take me down.
>

**KOLADE ADEYINKA** *(reply to 3)*  `q12_face_throne`

> [a slow, real smile] THERE you are. I knew it. I said to Amara, I said, it will be in the child too, wait and see.
>
> [warm] Come and take it, then. Not here — this is a hall for merchants. Come to the altar and take it from me properly. Baba — take me down.
>

### Scene 3: Olusegun's rear-guard

*A ring of frost. He and his tutor are gone. The rear-guard is not.*

**BABA OLUSEGUN**  `q12_teleport`

> [dry] My boy. This way. — You people: enjoy the rear-guard. They were expensive, o.
>

### Back in town

_(if not dukeDead)_

**DUKE FOLASADE**  `q12_council`

> [shaken] The Council has read it. The vote on the war is dead, and so is his claim.
>
> [steady] He went into the ground. Olumide is bleeding but standing. Go and finish it, and bring me a head or a prisoner; I will take either.
>

_(if flag dukeDead, not bothDukesDead)_

**DUKE OLUMIDE**  `q12_council`

> [wheezing] Folasade is dead. He put a knife in her while the whole hall watched.
>
> [grim] The vote is dead too; she made sure of that first. Go and finish him. I will hold the door until you come back or he does.
>

_(if flag bothDukesDead, allegiance gauntlet)_

**DUKE ADEBAYO**  `q12_council_dead`

> [hoarse, from a chair] Two Grand Dukes dead in their own hall, and the Council is me and a room full of ghosts. It is not a small thing you did, running at him.
>
> [hard] The vote is dead with them; nobody will vote for his war now. Go down and finish it. I will hold what is left.
>

_(if flag bothDukesDead, allegiance thieves)_

**TUNDE SOFTFOOT**  `q12_council_dead`

> [soft] Two dead dukes and a hall full of witnesses. The Undervault will take you down; the Gauntlet is too busy counting bodies.
>
> [softer] The debt grows, {target}. It always does.
>

_(if flag bothDukesDead, allegiance consortium)_

**FOLAKE**  `q12_council_dead`

> [cool] Two dead dukes. You do not do things by halves, my dear; I will remember that when I am counting what is left of the Council.
>
> [silken] The carriage is at the steps. The way down is under the palace kitchens. Bring me his head.
>

---

## Quest 13 — The Undercity  *(Chapter 7)*

_Under the thieves' maze is an older city, and under that is a temple. Kolade's people are between you and it. So is the one who loves him._

### Setting out

_(if flag wrenHurt)_

**HIWOT**  `q13_return`

> [stiff, bandaged] I heard you were going under the city without me. Absolutely not.
>
> [fierce] I am stitched, I am furious, and I still open locks better than anyone here. Move over.
>

_Hiwot joins the company._

### Scene 1: The thieves' maze

_One of the following, whoever is riding along:_

**KAITO**  `q13_maze`

> [hushed] The thieves' maze. Every third flagstone is a trap and every fourth is a thief. I know the path; follow my feet exactly, please.
>

**HIWOT**  `q13_maze`

> [hushed] The thieves' maze. I can read it — half of it is Lanternhold locks, the cheap kind. Follow me exactly.
>

> **What do you say?**
> 1. "Lead." — _no fight; Kaito +1; Hiwot +1_
> 2. "No time. Straight through." — _blood +1_
>

**KAITO** *(reply to 1, when Kaito is the one speaking)*  `q13_maze_follow`

> [murmuring] Left. Left. Do not step there. — And we are through, and nobody even bled. I love being right.
>

**HIWOT** *(reply to 1, when Hiwot is the one speaking)*  `q13_maze_follow`

> [murmuring] Left. Again. Not that one. — Through. Nobody bled. Tell Tesfaye I was paying attention.
>

**KAITO** *(reply to 2, when Kaito is the one speaking)*  `q13_maze_cut`

> [sighing] Straight through. Watch the flagstones, then, and try to bleed on the thieves and not on me.
>

**HIWOT** *(reply to 2, when Hiwot is the one speaking)*  `q13_maze_cut`

> [groaning] Straight through. Fine. The loud list is getting long.
>

### Scene 2: The gate of the Undercity

*The gate of the Undercity: an arch of old stone under the thieves' maze. Amara stands in it with both swords drawn.*

_(if not amaraDead)_

**AMARA**  `q13_gate`

> [quiet] I said one of us would not walk past the other.
>
> [steady] I am still asking. Stop him. Do not kill him. And if you cannot promise me that, then draw, because I will not let you reach him without it.
>

> **What do you say?**
> 1. "Then draw." — _blood +1; Itsuki +1; Amara dies; sets amaraDead_
> 2. "Stand aside. I keep my promises." — _if flag promisedAmara · no fight; sets amaraPassed_
> 3. "Come with us. Help me stop him the way you want him stopped." — _if flag promisedAmara, Amara affinity ≥ 3 · no fight; Amara +2; Amara joins; sets amaraJoined_
> 4. "Stand aside. He will live." — _if not promisedAmara · no fight; blood +1; sets amaraPassed; sets liedToAmara_
>

**AMARA** *(reply to 1)*  `q13_gate_fight`

> [sad] Then draw.
>

**AMARA** *(reply to 2)*  `q13_gate_pass`

> [stepping aside] Go. I will be at the altar before you, on my knees, asking him the same thing. He will not listen to me. He might listen to you.
>

**AMARA** *(reply to 3)*  `q13_gate_join`

> [startled] With — yes. Yes. I know the way; I have walked it a hundred times. Stay behind me at the stairs.
>

**AMARA** *(reply to 4)*  `q13_gate_lie`

> [searching your face] ...Go, then. If you are lying, I will know it at the altar.
>

### Scene 3: The buried street

*A buried street, lit by torches that should have gone out a thousand years ago.*

**JELANI**  `q13_street`

> [sneering] The brother. Or the sister. It does not matter which — Kolade says the blood is the same, and the blood is what burns.
>
> [cold] Cultists! Light the street!
>

### Scene 4: Gorruk, again — or Consortium remnants (if gorrukDead)

_(if not gorrukDead)_

**GORRUK**  `q13_again`

> [roaring] YOU. Twice. TWICE you walk into my tent. There is no city to run to this time, orphan.
>

_(if not gorrukDead, Itsuki in company)_

**ITSUKI**  `q13_gorruk`

> [very quietly] Mine. You said. Say it again.
>

### Scene 5: The temple steps

*The temple steps. A Gauntlet officer in a new cloak stands at the top with the men he sold.*

**SEGUN MARR**  `q13_steps`

> [sneering] The Gauntlet stands with the new Duke. Whatever is left of the Council can argue about it afterwards.
>
> [cold] I signed your poster myself, my friend. Let me sign the rest of it.
>

_(if Delphine in company)_

**DELPHINE**  `q13_steps_selene`

> [flat] Where's Emeka Obi, Marr? He had a wife on Tanner Street. She'd like to know where to put the flowers.
>

_(if Delphine in company)_

**SEGUN MARR**  `q13_steps_selene_reply`

> [cold] In the river, where the old Duke's friends go. Tell her to look downstream.
>

### Back in town

_(if flag promisedAmara, Amara in company)_

**AMARA**  `q13_trust`

> [quiet] You kept your word. Thank you for letting me help.
>

---

## Quest 14 — The Temple of Morrak  *(Chapter 7)*

_The last room. Your brother is waiting at the altar of a dead god, and he is glad you came._

### Setting out

*The Temple of Morrak. The stairs end in a hall of black stone, and the braziers are lit.*

_One of the following, whoever is riding along:_

**DELPHINE**  `q14_sanctum`

> [low] A temple to a dead god, still swept, still lit. Somebody's been praying here for twenty years.
>
> [steady] Whatever he says at that altar, {target}, you remember who raised you. Then you do what you have to.
>

**HIWOT**  `q14_sanctum`

> [whispering] It is warm down here. It should not be warm.
>
> [fierce] Whatever he says in there — you are Tesfaye's. Not his. Tesfaye's.
>

**LAYLA**  `q14_sanctum`

> [reverent] Do you feel it? The stone remembers him. Morrak. By the deep — it would remember you too, if you let it.
>

### Scene 1: The outer sanctum

_(combat, no dialogue)_

### Scene 2: The hall of mirrors

_One of the following, whoever is riding along:_

**HIWOT**  `q14_mirrors`

> [horrified] That is ME. That is all of us. They are wearing US.
>

**DELPHINE**  `q14_mirrors`

> [cold] Our faces. Every one. Kill 'em quick; don't look at the eyes.
>

### Scene 3: The altar

*The altar is a throne of black stone. Your brother sits in it with his helmet in his lap.*

**KOLADE ADEYINKA**  `q14_altar`

> [warm] You came. I hoped you would. Every other one of us I have found, I have had to hunt; you walked here on your own feet, and I find I am proud of that, which is a strange thing to feel about someone I mean to kill.
>
> [calm] Sit with me a moment. Did Tesfaye ever speak of me? In all those years he raised you, did he mention my name? I've waited thirty years to hear that he remembered me.
>

> **What do you say?**
> 1. "Never. Not once. He did not know you existed."
> 2. "Only in a letter, after he was dead. He called you my brother."
> 3. "There was nothing to say about you. There still is not." — _blood +1_
>

**KOLADE ADEYINKA** *(reply to 1)*  `q14_spoke_never`

> [a long quiet] Not once. — Thank you. I would rather that than a lie, and you could have lied; I would have believed you. It is easier, somehow. A man cannot be refused by someone who never knew he was at the door.
>

**KOLADE ADEYINKA** *(reply to 2)*  `q14_spoke_letter`

> [very still] "Brother." In his own hand. — He could have written it to me. He knew where I was; he made a point of never coming. I have wondered for thirty years what he would call me, and it turns out he called me the right thing and sent it to you.
>
> [gently] Thank you. That was not a kindness, but it was the truth, and I have had little enough of either.
>

**KOLADE ADEYINKA** *(reply to 3)*  `q14_spoke_nothing`

> [laughing softly] Oh, that is his. That is his exactly; he could put a whole man in a sentence and leave the sentence out. — Good. Then we understand each other, and I do not have to be gentle.
>

_(if any of: Amara in company / flag amaraPassed)_

**AMARA**  `q14_plea`

> [kneeling] Kolade. Please. Look at me. It does not have to be the altar. It can be a cell and a window and me visiting every week for the rest of your life.
>

_(if any of: Amara in company / flag amaraPassed)_

**KOLADE ADEYINKA** *(to Amara)*  `q14_plea_answer`

> [gently] Amara. My love. Get up; you are kneeling in ash.
>
> [cold] No.
>

**KOLADE ADEYINKA**  `q14_altar_last`

> [patient] Now. Say what you came to say. I have waited thirty years to hear it, and I would like to hear it properly, before we begin.
>

> **What do you say?**
> 1. "Tesfaye chose me. He would have chosen you too, if you had let him." — _blood -1_
> 2. "Brother. I am sorry for what they did to you. I am still going to stop you." — _Amara +1; Delphine +1_
> 3. "Get out of my chair." — _blood +1; Layla +1_
>

**KOLADE ADEYINKA** *(reply to 1)*  `q14_last_aldric`

> [flinching, then smooth] He did not know me. He had a choice between two children in a gutter and he took the one that cried less; I have never held it against him. I hold it against the gutter.
>
> [rising] Enough. Draw.
>

**KOLADE ADEYINKA** *(reply to 2)*  `q14_last_brother`

> [very quiet] Sorry. Nobody has said that to me in thirty years, and you say it as if it cost nothing.
>
> [rising] It changes nothing. Draw, brother. Sister. Blood.
>

**KOLADE ADEYINKA** *(reply to 3)*  `q14_last_throne`

> [laughing] YES. Yes. Come and take it. Whichever of us stands up from this floor gets to be a god, and I would honestly be content either way.
>

### After the last fight

*It is over. He is on his knees between you and the chair.*

**KOLADE ADEYINKA**  `q14_beaten`

> [on his knees, bleeding] Well. Well. There it is.
>
> [strangely calm] The chair is right there, {target}. Someone is going to sit in it. You, me, or the next one of us who walks down those stairs. Choose. I am curious, even now; I think I will be curious to the end.
>

> **What do you say?**
> 1. "Nobody sits in it. Starting with you." — _ending: kill_
> 2. "You go up those stairs in chains. Amara asked. I promised." — _if any of: allegiance gauntlet / flag promisedAmara / Amara in company · ending: gauntlet_
> 3. "I sit in it. Move." — _if blood ≥ 2 · ending: usurp_
> 4. "Sit in it, then. Alone. I am going home." — _if blood ≤ -2 · ending: walk_
>

**KOLADE ADEYINKA** *(reply to 1)*  `q14_res_kill`

> [closing his eyes] He chose right, then. Good. Good. I am so tired of choosing.
>

**KOLADE ADEYINKA** *(reply to 2)*  `q14_res_gauntlet`

> [laughing weakly] Chains. Amara — Amara, you have won, do you hear me — you have —
>
> [quiet] Fine. A window. Every week. Fine.
>

**KOLADE ADEYINKA** *(reply to 3)*  `q14_res_usurp`

> [grinning through blood] THERE. There it is. I was right about you.
>
> [dying] It is warm, is it not. The chair. It is so warm.
>

**KOLADE ADEYINKA** *(reply to 4)*  `q14_res_walk`

> [bewildered] You — no. No, you cannot simply — it is RIGHT THERE —
>
> [alone, as you climb] ...it is right there.
>

---

## Optional private conversations at the inn

Two personal conversations on different completed-quest occasions build familiarity. Friendly answers do not start romance. The player must explicitly express romantic interest, then return on a later occasion and choose to discuss the relationship. Only the selected companion speaks. “Not now” and “friends only” are saved; only the player can reopen courtship. Delphine stays familial. Amara has no new romance until a later story resolves Kolade.

### Santiago

**SANTIAGO**  `bond_first`

> [hesitant] The training yard was easy. You knew the other man would stop.
>
> [honest] In a real fight, I still want to run. I worry that one day I will.
>

> **Friendly response:** You held your ground. Being afraid does not change that.
> **Leave:** I should go. We can talk another time.

**SANTIAGO** *(only after choosing the friendly response; counts once)*  `bond_first_reply`

> [relieved] Thank you. I needed to hear that from someone who had actually seen me fight.
>

**SANTIAGO**  `bond_second`

> [easier] I wrote home. Mostly about the people I have met. My mother would worry if I described the fighting.
>
> [fond] She runs a bakery. I used to get up before dawn to carry flour. I complained every morning. Now I miss it.
>

> **Friendly response:** I would like to hear about your home. Tell me more.
> **Leave:** I should go. We can talk another time.

**SANTIAGO** *(only after choosing the friendly response; counts once)*  `bond_second_reply`

> [warm] There is a stool by the oven where I used to sleep between deliveries. Mother still keeps it there. She says my room is too far from the work.
>

> **Explicit interest:** I would like to be more than friends.

**SANTIAGO**  `bond_interest`

> [shy] I would like that too. May we take a little time? I want to know you better.
>

**SANTIAGO** *(on a later occasion, only if the player chooses to discuss courtship)*  `q9_romance`

> [nervous] I enjoy the time we spend together. More than I know how to say properly.
>
> [earnest] When we have a quiet evening, may I take you to supper? Just the two of us.
>

**SANTIAGO** *(accept)*  `q9_romance_yes`

> [pleased] Supper, then. I know a decent place. I will try to get through the evening without saluting you.
>

**SANTIAGO** *(need more time)*  `bond_later`

> [gentle] Of course. Tell me when you are ready. We can still enjoy each other's company.
>

**SANTIAGO** *(friendship only)*  `q9_romance_no`

> [bravely] Then I am glad I said it, and I will not say it again. Thank you for hearing it.
>

### Itsuki

**ITSUKI**  `bond_first`

> [low] I have spent so long following tracks that I have given little thought to what comes after.
>
> [tired] I cannot go back to the life I had with my wife. I do not yet know what else I want.
>

> **Friendly response:** You can stay with us while you decide what comes next.
> **Leave:** I should go. We can talk another time.

**ITSUKI** *(only after choosing the friendly response; counts once)*  `bond_first_reply`

> [quiet] I would like to stay. It helps to have people expecting me back.
>

**ITSUKI**  `bond_second`

> [thoughtful] I used to guide travellers through the woods. Some had never slept outside. They would wake me over every rustle.
>
> [faintly amused] One paid me extra to keep the owls away. I gave him something to plug his ears.
>

> **Friendly response:** I would like to see the woods with you sometime.
> **Leave:** I should go. We can talk another time.

**ITSUKI** *(only after choosing the friendly response; counts once)*  `bond_second_reply`

> [warm] I would enjoy that. There are places worth visiting without a bounty to collect.
>

> **Explicit interest:** I would like to be more than friends.

**ITSUKI**  `bond_interest`

> [careful] I care for you. I need time before I can promise more. If you are willing to wait, I would like to try.
>

**ITSUKI** *(on a later occasion, only if the player chooses to discuss courtship)*  `q9_romance`

> [low] I still miss my wife. I always will.
>
> [quiet] But I have come to care for you too. If you feel the same, I would like us to be together.
>

**ITSUKI** *(accept)*  `q9_romance_yes`

> [quiet] Then we will take our time. I am glad you told me.
>

**ITSUKI** *(need more time)*  `bond_later`

> [calm] Take the time you need. You know where to find me.
>

**ITSUKI** *(friendship only)*  `q9_romance_no`

> [calm] I understand. It was enough to say it. Sleep.
>

### Layla

**LAYLA**  `bond_first`

> [direct] I appreciate what you did for me. Understand something, though. You did not buy my loyalty by keeping me alive.
>
> [firm] I choose where I go and whom I serve.
>

> **Friendly response:** You owe me no service. Stay because you want to.
> **Leave:** I should go. We can talk another time.

**LAYLA** *(only after choosing the friendly response; counts once)*  `bond_first_reply`

> [approving] Good. I prefer travelling with someone who understands that.
>

**LAYLA**  `bond_second`

> [unguarded] I miss the quiet of the shrine. Before the petitions began, I had an hour to myself.
>
> [dry] Up here, someone is always shouting, selling something, or telling me what a lovely morning it is. Usually in the rain.
>

> **Friendly response:** Tell me about the shrine. What was your life there like?
> **Leave:** I should go. We can talk another time.

**LAYLA** *(only after choosing the friendly response; counts once)*  `bond_second_reply`

> [measured] The work was demanding. I liked that. I knew what was expected of me, and I was good at it. I miss having a place of my own.
>

> **Explicit interest:** I would like to be more than friends.

**LAYLA**  `bond_interest`

> [interested] You have my attention. Let us spend more time together before deciding anything.
>

**LAYLA** *(on a later occasion, only if the player chooses to discuss courtship)*  `q9_romance`

> [dry] I enjoy your company when you stop trying to give me orders.
>
> [direct] I would like some time alone with you. Interested?
>

**LAYLA** *(accept)*  `q9_romance_yes`

> [pleased] Good. Come and sit with me. Your duties can wait for an evening.
>

**LAYLA** *(need more time)*  `bond_later`

> [level] Then leave it for now. You can bring it up when you know what you want.
>

**LAYLA** *(friendship only)*  `q9_romance_no`

> [cool] Very well. I will not ask again.
>

### Kaito

**KAITO**  `bond_first`

> [quieter] I know I make a performance of everything. It is easier than admitting I was scared.
>
> [honest] When you found me, I thought I was going to die there. I have been sleeping badly since.
>

> **Friendly response:** You do not have to entertain me. I am glad you are here.
> **Leave:** I should go. We can talk another time.

**KAITO** *(only after choosing the friendly response; counts once)*  `bond_first_reply`

> [soft] Thank you. I might be rather poor company tonight, but I would like you to stay.
>

**KAITO**  `bond_second`

> [cheerful] I used to play for supper at roadside inns. I know six songs well and about forty badly.
>
> [smiling] I still have the lute. I sold the feathered hat. A man has to improve himself somehow.
>

> **Friendly response:** I would enjoy hearing you play. Leave the hat at home.
> **Leave:** I should go. We can talk another time.

**KAITO** *(only after choosing the friendly response; counts once)*  `bond_second_reply`

> [amused] Cruel, but fair. I will play you the good six. You can request the others after enough wine.
>

> **Explicit interest:** I would like to be more than friends.

**KAITO**  `bond_interest`

> [pleased] I was hoping you might say that. Let us have a little time together and see how we get on.
>

**KAITO** *(on a later occasion, only if the player chooses to discuss courtship)*  `q9_romance`

> [smiling] I like you. I'd like to spend an evening with you, without the rest of this lot.
>

**KAITO** *(accept)*  `q9_romance_yes`

> [delighted] Excellent. A decent meal, some wine, and no work.
>
> [warm] I have been looking forward to this.
>

**KAITO** *(need more time)*  `bond_later`

> [easy] All right. Let me know if you want to try again. No awkwardness between us.
>

**KAITO** *(friendship only)*  `q9_romance_no`

> [light] Stop it is. Friends, then, and I am very good at that as well.
>

## In combat — companion banter

_One suitable line from a standing ally in round two. Unheard lines rotate before repeats; named listeners must be present, and status remarks require that status on a living enemy. Consecutive repeats stay silent._

**HIWOT**  `banter`

> [shouting] The left one! The left one is looking at YOU!
>
> [breathless] Still with you. Keep going!
>
> [gleeful] Got his purse. And his knife. And his — never mind, keep fighting.
>

**BEAU**  `banter`

> [steady] H-hold the line. Hold it. Nothing gets past.
>
> [grunting] Shield's up. Hit 'em while they hit me.
>
> [shouting] Del! Behind you!
>

**DELPHINE**  `banter`

> [calm] Breathe, honey. The one in front's slower than he looks.
>
> [sharp] Mind the mage. I'll mind the rest.
>
> [dry] If you die, I will be very put out. Don't.
>

**DESMOND**  `banter`

> [giggling] Oh, he is BURNING. Look at him go, man.
>
> [sing-song] More, more, more —
>
> [delighted] Come on, then. I'm right here.
>

**WINSTON**  `banter`

> [flat] Back lane. Poison. Done.
>
> [calm] Stay close. Don't give them a gap.
>
> [dry] Desmond, stop laughing, it puts them off.
>

**SANTIAGO**  `banter`

> [shouting] For the Dawning Flame! — forgive me. Habit.
>
> [earnest] On me! I can take it!
>
> [strained] I am fine! I am — mostly fine!
>

**ITSUKI**  `banter`

> [quiet] Loosing.
>
> [flat] The archer is mine. Leave him.
>
> [cold] Again.
>

**BAHADIR**  `banter`

> [roaring] FINDIK SAYS GO FOR THE EYES!
>
> [booming] Nobody touches the witch! NOBODY! Vallahi!
>
> [gleeful] Ha HA! Did you SEE that, canım?
>

**YASEMIN**  `banter`

> [calm] Frost. Hold him still.
>
> [formal] Your aura flares when you fight. Interesting.
>
> [cool] Keep them in front of us.
>

**DEVENDRA**  `banter`

> [bored] Do kindly keep them off me; I am the expensive one.
>
> [smug] Burning. Obviously.
>
> [sneering] Barely worth the spell.
>

**LAYLA**  `banter`

> [contemptuous] Bleed, then, if you must.
>
> [cool] Wound them. I will decide who heals.
>
> [dry] Surface-dwellers. Always the front lane.
>

**KAITO**  `banter`

> [smiling] Loosing, loosing — got him, and he was handsome, too. A pity.
>
> [cheerful] Behind them! I am behind them!
>
> [light] If I die, tell the magistrate I was thinking of her.
>

**WANJIRU**  `banter`

> [snarling] The roots have him.
>
> [fierce] Trees do not forgive. Neither do I.
>
> [low] Bleed into the soil. Good. Sawa.
>

**DAI MORGAN**  `banter`

> [gravelly] Wall. I'm the wall, I am.
>
> [grunting] Hit 'em. I've got 'em.
>
> [calm] The deep places keep me. Keep going, bach.
>

**AMARA**  `banter`

> [exact] Two blades. Two throats. Next.
>
> [steady] Watch the flank. I have the front.
>
> [quiet] Not like this. Quickly. Clean.
>

---

## The ending card (on-screen text, not voiced)

**Ending — hero:** Kolade Adeyinka died — or was dragged up the stairs — in the last hour before dawn. The Council read the ledgers aloud in the square. The war with Calder was never declared. Nobody in Varenholm's Gate knows what you are, and the ones who suspect have decided not to say.

**Ending — monster:** Kolade Adeyinka died at the altar and the city cheered you for it. They did not see what you saw in his eyes when the chair was empty, and they do not know that some nights you go back down the stairs alone to look at it.

**Ending — usurper:** You sat down. It was warm. Amara left the city; Layla did not. The Council thanked you, the war was never declared, and the shape-thieves in the sewers have started calling you by a title you did not choose.

**Ending — mercy:** Kolade Adeyinka lives in a cell under the Gauntlet's hall with one window and one visitor a week. The ledgers were read aloud, the war died with the vote, and the chair under the city is still empty. You made sure of that.

**Ending — ascetic:** You left him in the chair and climbed. Halfway up you heard him start to laugh, and then stop. The keepers of the altar found the throne empty at dawn, and nobody knows where he went. You went home. You did not look back.

**Allegiance — gauntlet:** Duke Adebayo recovered. He kept his word: the wanted posters came down in a day, and the company's name went up in the Gauntlet's hall in their place.

**Allegiance — consortium:** Folake took the Consortium, kept her bargain, and has written to you twice about "opportunities." You have not answered. Yet.

**Allegiance — thieves:** Tunde Softfoot has not called in the debt. He says the Undervault is patient. You have started checking the shadows in your own room.

**Allegiance — none:** The Council gave you a medal and a pension and would prefer that you left the city. You have not decided.

**The dukes — both:** Both dukes lived to see the vote. Olumide tells the story with more blood in it every time.

**The dukes — one:** Duke Folasade was buried with the honours of the city. Olumide has not spoken of the hall since.

**The dukes — none:** Two Grand Dukes were buried on the same morning. The Council that is left is one chair and a great many empty ones, and the city has learned to lower its voice.

**Hiwot — present:** Hiwot opened a lockshop on the harbour road. She has never once locked the door.

**Hiwot — gone:** Hiwot went back to Lanternhold with a scar under her ribs and a story that Brother Yonas still does not believe.

**Beau — present:** Beau stopped stammering the day the mine slaves were freed. He has not started again.

**Beau — dead:** Beau is buried in the Mirkhollow above the drowned mine. Delphine chose the stone. Nineteen names are cut under his.

**Delphine — present:** Delphine is rebuilding the Warden house on the Shore Road. She says the letters Tesfaye wrote were mostly about you, and mostly right.

**Delphine — gone:** Delphine went back to the Wardens. She does not write.

**Desmond — present:** Desmond and Winston sent the Umbral Hand a copy of everything and then, oddly, stayed. Winston says the pay is worse and the company is better.

**Desmond — gone:** Desmond and Winston were found in the Consortium tower with the guards' pay in their pockets. The Umbral Hand has not asked after them.

**Santiago — present:** Santiago was knighted by the Order of the Dawning Flame. He wrote the report himself, and left out nothing, and the Order has not stopped talking about it.

**Santiago — gone:** Santiago went back to the Order. He sends a letter every solstice and never mentions Layla or the Hand.

**Itsuki — present:** Itsuki planted a tree over his wife's grave on the north road and then, to everyone's surprise, stayed. He hunts now. Only game.

**Itsuki — gone:** Itsuki is somewhere north, still hunting an ogre-mage who may or may not still be alive. He does not want to be found.

**Bahadır — present:** Bahadır and Yasemin took a house by the river. Fındık has a room. Fındık has a very small bed.

**Devendra — present:** Devendra returned to Vashk with a hundred gold and an insufferable story. The Crimson Wizards have promoted him. They will regret it.

**Layla — present:** Layla stayed. She has a chapel now, of a kind, and the bounty on her was quietly torn up by someone who owed you a favour.

**Layla — gone:** Layla was taken in chains toward the coast. The wagon did not arrive. Nobody has looked very hard.

**Kaito — present:** Kaito collected the wyvern bounty and, he claims, the kiss. He has opened a very small, very profitable business finding things people lost on purpose.

**Kaito — gone:** Kaito is still in the web, in a sense. He was last seen in Thornbury telling the story with himself as the hero.

**Wanjiru — present:** Wanjiru went back to the Mirkhollow. The druids have not forgiven her. The trees, she says, have.

**Wanjiru — gone:** Wanjiru left when the road reached the Gate. She said she had been away from the wood long enough, and that she would know if the river ever ran clean again.

**Dai Morgan — present:** Dai Morgan went back to the Mirkhollow mine with a charter and forty of his clan. It is called the Nineteen now, and ledger four is buried under the first shaft.

**Dai Morgan — gone:** Dai Morgan is presumed to have died in the cages. The mine is closed.

**Amara — present:** Amara visits the cell every week. She brings bread. He eats it.

**Amara — gone:** Amara left the city on the morning tide. She did not say where. She did not look at you.

**Amara — dead:** Amara is buried at the gate of the Undercity, where she stood.

**Romance — Santiago:** Santiago asked you to attend his knighting. You went together, then slipped away for supper before the speeches had finished.

**Romance — Santiago, favoured ending:** He asked to help rebuild the damaged streets. You spent several mornings working beside him.

**Romance — Itsuki:** You and Itsuki make time to walk outside the city. Some days he speaks about his wife. On others, you plan where to travel next.

**Romance — Itsuki, favoured ending:** After the hunt was over, he asked you to visit the woods where he once worked as a guide.

**Romance — Layla:** Layla invites you to her chapel after the day's work. You share meals, argue over the wine, and make plans together.

**Romance — Layla, favoured ending:** She insists on keeping her own duties. The two of you arrange time together around them.

**Romance — Kaito:** Kaito takes you to the inns where he once played for his supper. He remembers the songs better than he claims.

**Romance — Kaito, favoured ending:** His work with the Undervault keeps him busy, but he always makes time for an evening with you.

**Romance — Amara:** You and Amara agree to take your relationship slowly. There is much still to discuss, including her feelings for Kolade.

**Romance — Amara, favoured ending:** She thanks you for hearing her out. Neither of you pretends that the road ahead will be easy.

**The blood — reject:** The dreams stopped. The chair is a chair.

**The blood — neutral:** You still dream of ash, some nights. Less often. You have stopped counting.

**The blood — embrace:** You dream of the chair every night now. Some nights it is empty. Some nights it is not, and the one sitting in it has your face.

---

# Part 2 — Casting appendix

| # | Character | Role | From | Lines | Voice ID |
|---|---|---|---|---|---|
| 1 | Amara | companion | Nigerian (Yoruba and Igbo) | 24 | nlQtoxiWTYC3witBlK1H |
| 2 | Bahadır | companion | Turkish | 9 | ZZKBkhKNX9bfxn63cQTM |
| 3 | Beau | companion | Georgia, USA | 15 | 7ma36jg9JC0d1pfrWXMw |
| 4 | Dai Morgan | companion | Welsh valleys | 18 | QZU5JP2C26gx328DNBza |
| 5 | Delphine | companion | Georgia, USA | 89 | a3tSl2M9CVI359Oy7H6v |
| 6 | Desmond | companion | Jamaican | 14 | 5OtKrUz8y0NUBuMW6YcK |
| 7 | Devendra | companion | Indian | 8 | Sm4AUh4ykvT9ljuZ5Uy8 |
| 8 | Hiwot | companion | Ethiopian highlands | 77 | 0F4ybvRD5Lm0AIt5almW |
| 9 | Itsuki | companion | Japanese | 33 | EqIniNyrvzFcbGecFyI5 |
| 10 | Kaito | companion | Japanese | 35 | O5EDsXljBLA6l3KfYEde |
| 11 | Layla | companion | Arabic | 30 | 7nj1jqrTE7EDXPyxWBhY |
| 12 | Santiago | companion | Mexican | 29 | xHLnsxqUy4cc16VOmSD4 |
| 13 | Wanjiru | companion | Kenyan | 15 | U1NXjHF5ene7Eze10d5J |
| 14 | Winston | companion | Jamaican | 31 | R7jdv6H5bZOU3sQIMhbd |
| 15 | Yasemin | companion | Turkish | 10 | E7IRB2a3OVqRb6T7du39 |
| 16 | Kolade Adeyinka (the Armoured) | antagonist | Nigerian (Yoruba and Igbo) | 37 | CmD1sSN0Gj3pJq3OxRyg |
| 17 | Abba Gebre | keeper | Ethiopian highlands | 6 | k1pVjlfHqGzrko6MqjgN |
| 18 | Baba Olusegun | tutor | Nigerian (Yoruba and Igbo) | 2 | TRPEspiEsb4Zif6sGonu |
| 19 | Cal Boone | spy | Georgia, USA | 6 | svSvKKBdngsY0ysEx6yS |
| 20 | Dawit | keeper | Ethiopian highlands | 10 | jDMhBWlFSleqsyqVHw2R |
| 21 | Duke Adebayo | duke | Nigerian (Yoruba and Igbo) | 20 | 1N3Ubm5NzIILaxKqZSWn |
| 22 | Duke Folasade | duke | Nigerian (Yoruba and Igbo) | 3 | MWtIvoi54McT7xb5USQh |
| 23 | Duke Olumide | duke | Nigerian (Yoruba and Igbo) | 4 | R6Aoacs81lnwJOkdYTvh |
| 24 | Emeka Obi | officer | Nigerian (Yoruba and Igbo) | 10 | IGMfg4ZRwOnenZgljHpm |
| 25 | Folake | mistress | Nigerian (Yoruba and Igbo) | 17 | 6ILPXNE4jEAfwjCvmbEz |
| 26 | Gethin Pryce | mayor | Welsh valleys | 11 | iUOf0Teoe8GQ6633Uazp |
| 27 | Nib | knife | Georgia, USA | 6 | aiHuPZx6mGgpzcNDwtX2 |
| 28 | Sanni | stranger | Nigerian (Yoruba and Igbo) | 13 | pL61gpUJHGbG1ctjcpcm |
| 29 | Tesfaye | recruiter | Ethiopian highlands | 43 | EFtnObJs7ex53VSB3niw |
| 30 | Tunde Softfoot | thief | Nigerian (Yoruba and Igbo) | 4 | Xazy5XB2Ls4qYhmhvhLy |
| 31 | Yohannes | sage | Ethiopian highlands | 13 | efEXUGgwSIpGeDUw4Vx0 |
| 32 | Adigun Adeyinka | boss | Nigerian (Yoruba and Igbo) | 7 | KZpCMq3CCfA6P6hsnSvp |
| 33 | Bankole | boss | Nigerian (Yoruba and Igbo) | 1 | 4cHt9cX9ngcPiEaw8Kud |
| 34 | Femi | boss | Nigerian (Yoruba and Igbo) | 7 | 1V8ftW86u2NXoV2QR76J |
| 35 | Gbenga | boss | Nigerian (Yoruba and Igbo) | 3 | brlt4NQGEVKYUPZHGlMp |
| 36 | Gorruk (the Bandit Lord) | boss | invented | 3 | fHJkS6rGX3KuLo1kf0wn |
| 37 | Grukhar | boss | invented | 10 | d9QexFKeaE8pDBNegABG |
| 38 | Idris | boss | Nigerian (Yoruba and Igbo) | 2 | Zjllzaofqu5CuNshWGwW |
| 39 | Jelani | boss | Nigerian (Yoruba and Igbo) | 2 | 68X70AB3zrqH7rtaQUHH |
| 40 | Kemi | boss | Nigerian (Yoruba and Igbo) | 1 | zzp11mPTUa7yKugVGfwD |
| 41 | Lurleen | boss | Georgia, USA | 6 | xWbXI06Q9UpLaSG8TVpw |
| 42 | Merle | boss | Georgia, USA | 8 | al2GsnInvOnScFc93vu6 |
| 43 | Mzee Kamau (Archdruid) | boss | Kenyan | 5 | _unassigned_ |
| 44 | Olamide | boss | Nigerian (Yoruba and Igbo) | 7 | qY77JO62oGpUeMUDF7bS |
| 45 | Rasheed | boss | Nigerian (Yoruba and Igbo) | 1 | SwayIXZEQHYPgOU8ZLVO |
| 46 | Segun Marr | boss | Nigerian (Yoruba and Igbo) | 3 | ouilM4BVCVF7fxKGukKI |

## Amara  `amara`

**Sex:** female · **Role:** companion (romanceable) · **Voice ID:** nlQtoxiWTYC3witBlK1H

**Who they are:** Kolade's lover and sword-hand. A monk of the Gate's fire temples who wants him stopped, not slaughtered. Grave, exact, tired.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q11_amara_how**

- `q11_amara_how_1` — [exact] Chains, and a cell, and the Council's law. He is not a god yet. He bleeds, he tires, he can be beaten to his knees; I have seen it done, once, in the fire temple where we met. On his knees he can be bound. It is not a small thing I ask. I know that.

**q11_amara_lie**

- `q11_amara_lie_1` — [searching]...Your word. Yes. — Rasheed and Kemi, the Undervault. The invitations. Go.

**q11_amara_promise**

- `q11_amara_promise_1` — [exhaling] Thank you. I did not expect that.
- `q11_amara_promise_2` — [quiet] The coronation is in three nights. Two people called Rasheed and Kemi hold the invitations in the Undervault. Take them from them; they will not give them up.

**q11_amara_refuse**

- `q11_amara_refuse_1` — [cold] Then we will meet at the gate of the Undercity, and one of us will not walk past the other.
- `q11_amara_refuse_2` — [flat] Rasheed and Kemi hold the invitations. Undervault. Take them; it does not change what I said.

**q11_docks**

- `q11_docks_1` — [steady] Put the swords away. If I wanted you dead I would have done it from the rooftop.
- `q11_docks_2` — [grave] I am Amara. I love Kolade Adeyinka. I also helped him kill the man who raised you. I know what that makes me to you. But I need you to hear me. Have you ever loved someone even after you knew what they'd done?

**q11_docks_ask**

- `q11_docks_ask_1` — [grave] Here is what I ask. Stop him. Not kill him. Stop him. There is a difference, and it matters to me more than my own life.

**q11_docks_ithrel_reply**

- `q11_docks_ithrel_reply_1` — [without flinching] No. I was not. But I did not stop him sending Gorruk north, and I could have. Put that on my account with the rest, ranger. I will not argue the sum.

**q11_loved_no**

- `q11_loved_no_1` — [level] Then you will think what I ask is weakness. Hear it anyway; you may need it later, when you are older and less certain.

**q11_loved_tesfaye**

- `q11_loved_tesfaye_1` — [quiet] Yes. Kolade has lied to me too. I know he has hurt people. I still care for him, but I cannot let him go on killing.

**q11_loved_yes**

- `q11_loved_yes_1` — [a slow nod] Then you know the shape of it. Good. I will not have to explain the rest, only ask it.

**q13_gate**

- `q13_gate_1` — [quiet] I said one of us would not walk past the other.
- `q13_gate_2` — [steady] I am still asking. Stop him. Do not kill him. And if you cannot promise me that, then draw, because I will not let you reach him without it.

**q13_gate_fight**

- `q13_gate_fight_1` — [sad] Then draw.

**q13_gate_join**

- `q13_gate_join_1` — [startled] With — yes. Yes. I know the way; I have walked it a hundred times. Stay behind me at the stairs.

**q13_gate_lie**

- `q13_gate_lie_1` — [searching your face]...Go, then. If you are lying, I will know it at the altar.

**q13_gate_pass**

- `q13_gate_pass_1` — [stepping aside] Go. I will be at the altar before you, on my knees, asking him the same thing. He will not listen to me. He might listen to you.

**q13_trust**

- `q13_trust_1` — [quiet] You kept your word. Thank you for letting me help.

**q14_plea**

- `q14_plea_1` — [kneeling] Kolade. Please. Look at me. It does not have to be the altar. It can be a cell and a window and me visiting every week for the rest of your life.

**banter**

- `banter_1` — [exact] Two blades. Two throats. Next.
- `banter_2` — [steady] Watch the flank. I have the front.
- `banter_3` — [quiet] Not like this. Quickly. Clean.

## Bahadır  `bramm`

**Sex:** male · **Role:** companion · **Voice ID:** ZZKBkhKNX9bfxn63cQTM

**Who they are:** A huge, loud ranger of Kalden with a hamster named Fındık on his shoulder and a witch to protect. Loyal to the bone.

**From:** Kalden, the witch-country beyond the steppe — Turkish. **Voice:** Warm and emphatic. "Abla" / "abi" for elder sister and brother, "canım" for the beloved, "vallahi" as an oath, "inşallah" for hope. Hospitality as a rule of war.

**q3_bramm**

- `q3_bramm_1` — [booming] — and I say AGAIN, red man, you touch that cage and I will fold you into it!
- `q3_bramm_2` — [turning] VALLAHI. Strangers. Good. Strangers, listen: Bahadır, ranger of Kalden, and this is Fındık, who is small but very brave. There is a woman in that fortress, in a cage. Yasemin. A witch of my country, and a good one.

**q3_bramm_argue**

- `q3_bramm_argue_1` — [hot] Tell them why Vashk burns women, wizard! Tell them what your Crimson masters do with a witch's bones!

**q3_bramm_rescue**

- `q3_bramm_rescue_1` — [overjoyed] With you! Yes! Fındık, did you hear? We have friends, and they are good ones. Come — the gate is that way, and I am going through it.

**q3_joined**

- `q3_joined_1` — [emphatic] We are yours. Vallahi. Where you go, we go, and anyone who says otherwise answers to Fındık.

**q3_road_block**

- `q3_road_block_1` — [wounded, roaring] You TOOK his coin. You looked at me and you took his coin! Then you go through me, and Fındık, and every tree in this valley — come on! COME ON!

**banter**

- `banter_1` — [roaring] FINDIK SAYS GO FOR THE EYES!
- `banter_2` — [booming] Nobody touches the witch! NOBODY! Vallahi!
- `banter_3` — [gleeful] Ha HA! Did you SEE that, canım?

## Beau  `dorran`

**Sex:** male · **Role:** companion · **Voice ID:** 7ma36jg9JC0d1pfrWXMw

**Who they are:** A Warden fighter from the Shore Road with a stammer he hates and a shield he never puts down. Delphine's husband.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q2_beau_seal**

- `q2_beau_seal_1` — [low] Del. The p-paper the man on the steps had. Look at the seal. Iron hand, red wax.
- `q2_beau_seal_2` — [steadier] That's the mark on the ore wagons. The ones that come up from Dunmere and go north. I've seen it a hundred times at the ford.

**q2_selene**

- `q2_selene_1` — [stammering, warm] You're — y-you're his. Tesfaye's. I'd know that coat anywhere; he w-wore it the day we met. Come in. Come in out of the road.
- `q2_selene_2` — [quiet] Del. It's the ward. He sent the ward.

**q7_after**

- `q7_after_1` — [exhausted] Nineteen. Every one. Not one left in the dark.
- `q7_after_2` — [quiet] Thank you for holding. I heard you say it. I won't forget it.

**q7_cage_beau**

- `q7_cage_beau_1` — [urgent] The ch-chain-gang. Where do they keep them between shifts?

**q7_dorran_mission**

- `q7_dorran_mission_1` — [quiet] There'll be time. I'll m-make time.

**q7_dorran_with**

- `q7_dorran_with_1` — [fierce] Good. G-good. The front's mine. Nothing gets past me today.

**q7_flood_wait**

- `q7_flood_wait_1` — [shouting from below] Coming up! Nineteen of 'em and me! Hold the d-door — they're right behind us!

**q7_gate**

- `q7_gate_1` — [grim] Slaves. They're w-working slaves in there. I can hear the chains from here.
- `q7_gate_2` — [steady] I'm going to the bottom for 'em. Whatever else we do today. Tell me you're with me.

**banter**

- `banter_1` — [steady] H-hold the line. Hold it. Nothing gets past.
- `banter_2` — [grunting] Shield's up. Hit 'em while they hit me.
- `banter_3` — [shouting] Del! Behind you!

## Dai Morgan  `durnik`

**Sex:** male · **Role:** companion · **Voice ID:** QZU5JP2C26gx328DNBza

**Who they are:** A dwarf priest whose clan dug the Mirkhollow mine before the Consortium stole it. Slow to anger, impossible to move.

**From:** Dunmere and the dwarf clans — Welsh valleys. **Voice:** Sing-song cadence, sentences that end where they started ("I'll go down, I will"). "Bach", "now then", "there's lovely", "duw". Understatement about danger.

**q7_cage**

- `q7_cage_1` — [gravelly, Welsh] Well now. Either you're the new drivers or the old ones are dead. Which is it, then? — No, don't tell me; you're too muddy for drivers, and they'd have shot me by now.
- `q7_cage_2` — [hopeful] Dai Morgan. Priest of the deep places, and the last of the clan that cut this mine before the Consortium took it with paper and knives. I know every valve in it — including the one at the bottom that lets the river in.

**q7_cage_ask**

- `q7_cage_ask_1` — [hopeful] So. Are you letting me out, or are you the polite sort of drivers?

**q7_cage_beau_reply**

- `q7_cage_beau_reply_1` — [grim] Bottom level, by the valve room, so the drivers can drown them if the mine's ever taken. Mind that, shield-man. Whoever turns that wheel turns it on them.

**q7_durnik_free**

- `q7_durnik_free_1` — [grunting to his feet] With you. Aye. There's lovely. Mind the third level; the mage keeps his study there, and he doesn't care for knocking.

**q7_durnik_leave**

- `q7_durnik_leave_1` — [flat] Come back for me. Aye. Everybody says that, bach.

**q7_durnik_paper**

- `q7_durnik_paper_1` — [grim] A debt we didn't owe, bought off a man who didn't own it, and enforced by men with swords while the magistrate looked at the ceiling. My cousins argued. My cousins are on the lowest level now, and they don't argue anymore.

**q7_study_dai**

- `q7_study_dai_1` — [very level] Morgan. Bryn and Gareth Morgan. My cousins. Which ledger are they in, mage?

**q7_study_dai_after**

- `q7_study_dai_after_1` — [quiet]...Then I'll be having ledger four. Go on.

**q7_valve**

- `q7_valve_1` — [urgent] The valve room. Turn the great wheel and the river takes the bottom two levels in the time it takes to say a prayer.
- `q7_valve_2` — [hard] Your shield-man went below for the chain-gang. He isn't up yet.

**q8_sewers**

- `q8_sewers_1` — [approving] Good stonework, mind. Dwarven, some of it, and old. Shame about the smell.

**q9_lobby**

- `q9_lobby_1` — [gravelly] Clerk with a list. Two guards. Good stone, again. Shame.

**q9_lobby_fight**

- `q9_lobby_fight_1` — [grim] Stairs.

**q9_lobby_talk**

- `q9_lobby_talk_1` — [grunting] Third floor. Don't touch anything. Good advice for a tower, that.

**banter**

- `banter_1` — [gravelly] Wall. I'm the wall, I am.
- `banter_2` — [grunting] Hit 'em. I've got 'em.
- `banter_3` — [calm] The deep places keep me. Keep going, bach.

## Delphine  `selene`

**Sex:** female · **Role:** companion · **Voice ID:** a3tSl2M9CVI359Oy7H6v

**Who they are:** Beau's wife and an old friend of your late stepfather, Tesfaye. She regards you as family. A Warden druid of the Shore Road: blunt, protective, allergic to self-pity. Speaks for the balance of things.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q2_how_armour**

- `q2_how_armour_1` — [very still] Black plate. Asked for you by name.
- `q2_how_armour_2` — [to Beau] Beau. The letter from the spring. He said if a big man in black iron ever came asking, we weren't to fight him, we were to run with the child and ask questions after. I thought he'd gone strange.

**q2_how_quick**

- `q2_how_quick_1` — [gently] That's a kindness, and a lie, and I'll take both. Thank you, sugar.
- `q2_how_quick_2` — [to Beau] Beau. Whoever did it knew where Tesfaye was, and Tesfaye chose that library because nobody knew. Somebody talked.

**q2_how_refuse**

- `q2_how_refuse_1` — [soft] Then don't. But you'll tell Beau when you can; he loved him too, and he's worse at waiting than I am.

**q2_join**

- `q2_join_1` — [decisive] Beau, get the shields. We're going to Dunmere.
- `q2_join_2` — [to you] I'll tell you what: you're Tesfaye's, and Tesfaye's is ours. That's all the reason we need, and it's all the reason you're getting tonight.

**q2_selene**

- `q2_selene_1` — [warm, gentle] I'm Delphine, Beau's wife. Your late stepfather, Tesfaye, was an old friend of ours. Sit down, honey. Beau, get the good bread.
- `q2_selene_2` — [steady] He wrote to us from Lanternhold every year for twenty years. Said you and Hiwot were growing up in that keepers' library, getting into everything he tried to keep you out of. His last letter said if you came here without him, we were to keep you safe.
- `q2_selene_3` — [quiet, direct] So. How did he die? All of it. Don't you spare me.

**q2_selene_alone**

- `q2_selene_alone_1` — [flat] You'll go with us or you'll go over my husband, and he's a big man. Tesfaye asked. I don't break a promise to a dead friend because a child is grieving and rude about it.

**q2_selene_seal**

- `q2_selene_seal_1` — [looking] It is. The Iron Consortium's mark — the trading house out of the Gate that's been buying every bar on this coast since the ore went bad.
- `q2_selene_seal_2` — [slowly] So the folks paying to kill Tesfaye's ward are the folks who own the iron. That ain't two stories, honey. That's one. Now you ask me whatever you need to, and then we decide what he'd have done.

**q2_selene_trust**

- `q2_selene_trust_1` — [softening] He'd have followed the money. The iron's gone bad since spring — tools snapping, blades cracking, every smith from here to the Gate cussing — and the ore comes up out of Dunmere. The Consortium's mark is on the wagons and on your bounty. So we go to Dunmere and find out what's wrong with that ore, and I'd bet my house we find out who wants you dead the same day.

**q2_selene_wardens**

- `q2_selene_wardens_1` — [matter-of-fact] Folks who keep the balance between the towns and the wild, and between the strong and the weak, when the law's too far off to do it. Tesfaye was one, before the library. So are we. It don't pay, and nobody thanks you, and you do it anyway. That's the whole of the oath.

**q2_selene_why**

- `q2_selene_why_1` — [carefully] I don't know, and I won't pretend I do. I know Tesfaye hid you like a man hides a lit candle in a wind, and never said from what. A trading house don't spend two hundred on spite. They think you're worth it, or they think you're dangerous, and I can't tell you which from here.

**q3_ithrel_selene**

- `q3_ithrel_selene_1` — [sharp] A year hunting one ogre alone, and the Wardens never heard of you. Why didn't you come to us?

**q3_ithrel_selene_after**

- `q3_ithrel_selene_after_1` — [a beat]...It ain't. Damn it. It should be.

**q3_south**

- `q3_south_1` — [calm] Dunmere's two days south. Mining town, hard folk, honest as far as it goes. The mayor's a man called Gethin Pryce; he'll be sweating, and he'll pay.
- `q3_south_2` — [dry] Stay off the river road after dark. Gnolls come down it. I know because I've buried the people who didn't listen.

**q3_south_hiwot**

- `q3_south_hiwot_1` — [casual, not casual] Hiwot. You grew up in that library with him. Did he keep letters? Anything from the Gate, anything with that iron seal on it?

**q3_south_hiwot_reply**

- `q3_south_hiwot_reply_1` — [nodding] Then it's still there. Remember that, both of you. If this road ever bends back toward Lanternhold, that drawer's the first door we open.

**q3_tollan_selene**

- `q3_tollan_selene_1` — [level] Gethin. Before the crews. Who's been buying your bad ore since spring, and who's been selling the smiths good iron since?

**q3_tollan_selene_after**

- `q3_tollan_selene_after_1` — [to Beau, quiet] Same hand. Beau, I told you. Buy the ore cheap because it's bad, sell the iron dear because it's the only good iron left. Somebody's making that ore bad on purpose.

**q4_camp_selene**

- `q4_camp_selene_1` — [after a moment] He was the best of us, sugar. And he quit. Those ain't two different stories either.

**q4_down**

- `q4_down_1` — [calm] Mind the timbers; half of them are rotten. If the kobolds are as thick as the mayor says, we go slow and we keep the healer in the middle. That's me, honey. Don't argue.

**q4_flooded**

- `q4_flooded_1` — [calm] Water on the second level, and not from any spring. Somebody opened a channel and let the river in on purpose.
- `q4_flooded_2` — [thoughtful] Kobolds don't plan. Kobolds dig where they're pointed. Whoever's pointing them is below us, and has been for weeks.

**q4_grukhar_selene**

- `q4_grukhar_selene_1` — [flat] Your orders. Sealed how? Iron hand, red wax, pressed hard.

**q4_grukhar_selene_after**

- `q4_grukhar_selene_after_1` — [to you, low] On a wagon, on a bounty, and now on an altar. That's three. — Go on, honey. He's yours to deal with.

**q4_letters**

- `q4_letters_1` — [reading] "To the priest, from Femi at the Thornbury inn. Keep the ore fouled until the spring shipment. Gorruk holds the north road; do not use it without his mark."
- `q4_letters_2` — [calm] A courier, and a bandit lord above him, and above them somebody who buys with a seal instead of a name. The mine was only the bottom of this.

**q5_inn_selene**

- `q5_inn_selene_1` — [pleasant, deadly] Hollister says you've had that room since the spring, Femi. Now I'll tell you what puzzles me. What does a wine merchant sell for six months in a town with one inn, that already has a cellar?

**q5_inn_selene_after**

- `q5_inn_selene_after_1` — [to you] He's got papers, honey. I'd like to see them.

**q5_letters_selene**

- `q5_letters_selene_1` — [level] A name, Cal. Not a seal. Somebody at the Consortium signs for this. Who?

**q6_fire**

- `q6_fire_1` — [quiet] Sit a minute. The forest's loud tonight and I want to say a thing before I lose the nerve.
- `q6_fire_2` — [soft] Tesfaye wrote to us every year about you. Twenty letters. I feel like I've known you since you could walk, and I met you a month ago. It's a strange thing. It ain't an unwelcome one.

**q6_fire_deflect**

- `q6_fire_deflect_1` — [quiet] All right. Get some rest. We can talk another time.
- `q6_fire_deflect_2` — [calm] Goodnight.

**q6_fire_dorran**

- `q6_fire_dorran_1` — [fond] He is. He also snores like a bear in a barrel, so the fortune runs both ways.
- `q6_fire_dorran_2` — [warm] Goodnight. Don't you tell him I said that.

**q6_fire_letters**

- `q6_fire_letters_1` — [fond] The first year, that you'd learned to walk and walked straight into the library. The seventh, that you'd stolen honey from the brothers and let a cat take the blame. The last — that you were ready, and that he wasn't.

**q6_fire_warm**

- `q6_fire_warm_1` — [a soft laugh] Enough. Yeah. That's a very Tesfaye amount.
- `q6_fire_warm_2` — [warm] Goodnight. Wake me if the trees start walking.

**q6_forest**

- `q6_forest_1` — [calm] The Mirkhollow. Old wood — older than the Wardens, older than the Gate. It's got its own druids, and they ain't friends of ours; we keep the balance by law and they keep it by blood.
- `q6_forest_2` — [quiet] Keep to the deer paths. Anything down here that looks like a road was made by something with a great many legs.

**q6_gate**

- `q6_gate_1` — [calm] Iron livery on the guards. Consortium men. And the tall one — Kestrel. A sword for hire who'll guard anything for anybody. I've crossed him before.
- `q6_gate_2` — [flat] He won't talk. Don't waste your breath on it.

**q6_grove_selene**

- `q6_grove_selene_1` — [steady] None of us. The iron's what we took off the men who are poisoning your river. We're here to shut their mine.

**q7_after_dead**

- `q7_after_dead_1` — [hollow] Olamide's papers. Names in the city. Take them. I don't care.
- `q7_after_dead_2` — [cold] I'll finish this road because Tesfaye asked it of me. Don't you speak to me until it's done.

**q7_flood_now**

- `q7_flood_now_1` — [screaming] NO —
- `q7_flood_now_2` — [broken] He was coming up. He was coming up. You heard the chains. You heard him.

**q7_papers**

- `q7_papers_1` — [reading] Olamide wrote to three men at the Consortium's tower in Varenholm's Gate. Adigun Adeyinka. Bankole. Rotimi.
- `q7_papers_2` — [calm] Adeyinka. Cal heard right. The bandits are broke and the mine's drowned, and the road north is open, and so, at last, are the names.

**q7_valve**

- `q7_valve_1` — [tight] Beau's still down there. Beau is still down there.

**q8_faces**

- `q8_faces_1` — [disturbed] That's the merchant's face and it ain't the merchant. Look at the eyes, honey. Nothing lives behind 'em.
- `q8_faces_2` — [hard] Shape-thieves. They wear you after they kill you. Don't let one get behind you.

**q9_family**

- `q9_family_1` — [warm] You're family, honey. You don't have to face this alone. Get some rest. We leave for Lanternhold in the morning.

**q9_lobby**

- `q9_lobby_1` — [murmuring] A clerk with a list and two guards who are paid to believe him.

**q9_lobby_fight**

- `q9_lobby_fight_1` — [flat] Stairs, then.

**q9_lobby_talk**

- `q9_lobby_talk_1` — [quiet] He believed it. Third floor. Don't touch anything.

**q9_top**

- `q9_top_1` — [reading] Adigun Adeyinka, Bankole, Rotimi. Gone to Lanternhold — to LANTERNHOLD — for a summit with the keepers.
- `q9_top_2` — [cold] The three men behind all of this are sitting in the library you grew up in.

**q10_double_listen**

- `q10_double_listen_1` — [urgent] That ain't who it looks like. That is NOT them. It's already reaching for your throat — move!

**q10_double_strike**

- `q10_double_strike_1` — [sharp] Two of 'em — and the real Hiwot was BEHIND it, you cut her — she's breathing. She's breathing. She ain't walking out of here on her own.
- `q10_double_strike_2` — [grim] I'll get her to the surface. Go on without us.

**q10_double_strike_alone**

- `q10_double_strike_alone_1` — [grim] That wasn't him, and you knew it before I did. It's dead. There's two more behind it wearing faces I don't know — keep moving.

**q10_shore**

- `q10_shore_1` — [weary] The shore. Air. We're out.
- `q10_shore_2` — [hard] Sanni sent us after his father. Then he called the guards on us. With Adigun dead and us wanted for murder, who is left to stop him?

**q10_summit_selene**

- `q10_summit_selene_1` — [flat] Then answer me this, Adeyinka, before anybody decides anything. The iron hand in red wax on the ore wagons. Whose seal is that?

**q10_summit_selene_after**

- `q10_summit_selene_after_1` — [to you, quiet] Your seal on the wagons and his on the bounty. Same wax. I've been right since the inn, honey, and I ain't glad of it.

**q11_alleg_consortium**

- `q11_alleg_consortium_1` — [flat] Her. Fine. I'll hold my nose. Don't you let her hold anything of yours.

**q11_alleg_gauntlet**

- `q11_alleg_gauntlet_1` — [approving] Lawfully. Tesfaye would've said the same, and then he'd have cheated a little. Let's go find the Duke.

**q11_alleg_thieves**

- `q11_alleg_thieves_1` — [dry] Tunde Softfoot never forgets a debt. Neither will you. All right — the Undervault.

**q11_doors**

- `q11_doors_1` — [calm] Three ways into that palace, and we won't get a second try.
- `q11_doors_2` — [measured] Adebayo's dying; cure him and the Gauntlet is ours. Folake offered a way in, for a price. And the thieves under the Undervault will sell us a door if we owe 'em after.

**q11_posters**

- `q11_posters_1` — [cold] Grand Duke Ayodele was murdered last night and they've put your name on it. Obi's dead too. A man called Segun Marr runs the Gauntlet now.
- `q11_posters_2` — [calm] Kolade will be sworn in as the new Duke within days. He's moved everything into place while we were underground.

**q12_dukes_korvath**

- `q12_dukes_korvath_1` — [shouting] The dukes are DYING — we can't hold both if you run at him —

**q12_steps**

- `q12_steps_1` — [low] Borrowed silks, real steel, two invitations. Everybody in that hall is either a guest or a shape-thief, and there's no way to tell which till the knives come out.
- `q12_steps_2` — [calm] Stay near the dukes. He needs them dead more than he needs you.

**q13_steps_selene**

- `q13_steps_selene_1` — [flat] Where's Emeka Obi, Marr? He had a wife on Tanner Street. She'd like to know where to put the flowers.

**q14_mirrors**

- `q14_mirrors_1` — [cold] Our faces. Every one. Kill 'em quick; don't look at the eyes.

**q14_sanctum**

- `q14_sanctum_1` — [low] A temple to a dead god, still swept, still lit. Somebody's been praying here for twenty years.
- `q14_sanctum_2` — [steady] Whatever he says at that altar, you remember who raised you. Then you do what you have to.

**banter**

- `banter_1` — [calm] Breathe, honey. The one in front's slower than he looks.
- `banter_2` — [sharp] Mind the mage. I'll mind the rest.
- `banter_3` — [dry] If you die, I will be very put out. Don't.

## Desmond  `vess`

**Sex:** male · **Role:** companion · **Voice ID:** 5OtKrUz8y0NUBuMW6YcK

**Who they are:** An Umbral Hand necromancer who giggles at wounds. Unstable, brilliant, always listening for the Hand.

**From:** The Umbral Hand — Jamaican. **Voice:** Light patois rhythm through word order and idiom, not spelling: "man", "you see it?", "no worry yourself", "one-one coco full basket". Dry warmth from Winston; sing-song from Desmond.

**q2_pair**

- `q2_pair_1` — [bright] Well now — look at this, Winston. Two little travellers on a big empty road, and one of them holding a sword like it might bite.
- `q2_pair_2` — [delighted] Desmond. This is Winston. We are going the same way as you, which is a coincidence, and we are very good in a fight, which is not.

**q2_pair_yes**

- `q2_pair_yes_1` — [sing-song] You hear that, Winston? We have friends now. — No worry yourself. I bite only the ones you tell me to.

**q2_where_lie**

- `q2_where_lie_1` — [gleeful] Lying. Look at the hands, Winston — the hands always know. I like them already.
- `q2_where_lie_2` — [sing-song] No worry yourself. Everybody lies to us. We are used to it.

**q7_papers**

- `q7_papers_1` — [soft] Those papers. Names, seals, routes. The people we answer to would pay plenty to read them before the Gauntlet does.
- `q7_papers_2` — [softer] Let Winston copy them tonight, and we stay quiet and useful for as long as you like.

**q7_papers_refuse**

- `q7_papers_refuse_1` — [very calm] Then we go, and you will see us again, and it won't be as friends.
- `q7_papers_refuse_2` — [light] It never was, really. I did tell you stories like yours get told badly.

**q9_betrayal**

- `q9_betrayal_1` — [bright] You found us! We work here now, you see it? It pays better than you did.
- `q9_betrayal_2` — [giggling] Winston says we should kill you quick. Me, I would like to take my time.

**banter**

- `banter_1` — [giggling] Oh, he is BURNING. Look at him go, man.
- `banter_2` — [sing-song] More, more, more —
- `banter_3` — [delighted] Come on, then. I'm right here.

## Devendra  `aurelius`

**Sex:** male · **Role:** companion · **Voice ID:** Sm4AUh4ykvT9ljuZ5Uy8

**Who they are:** A Crimson Wizard of Vashk who narrates his own superiority under his breath. Wants Yasemin dead; wants you useful.

**From:** Vashk and its Crimson Wizards — Indian. **Voice:** Ornate, formal, self-satisfied. "Kindly", "most assuredly", "it is quite evident". Compliments that are insults; never raises his voice.

**q3_bramm**

- `q3_bramm_1` — [disdainful] Kindly disregard the large gentleman; his enthusiasms are exhausting. Devendra, Crimson Wizard of Vashk. The woman in the cage is a Kalden witch, and it is quite evident that a Kalden witch loose in these hills is a calamity waiting for a date.

**q3_bramm_argue**

- `q3_bramm_argue_1` — [coolly] Vashk and Kalden have been at war, in one form or another, since before these strangers' grandparents were born. I do not expect the large gentleman to understand policy. I expect him to understand a hundred in gold — which I am offering to you, not to him. A hundred to see her burned, and my considerable talents beside you until the Gate.

**q3_bramm_both**

- `q3_bramm_both_1` — [thin] Hold my tongue. Very well. I shall hold it most eloquently. Do not expect me to be happy about it.

**q3_bramm_coin**

- `q3_bramm_coin_1` — [satisfied] A sensible arrangement. The large gentleman will object; I recommend we not be near him when he does.

**q3_bramm_why**

- `q3_bramm_why_1` — [coolly] Because one witch becomes a coven, and a coven becomes a border dispute, and a border dispute becomes my problem. That I am polite about it is a courtesy, not a change of policy.

**banter**

- `banter_1` — [bored] Do kindly keep them off me; I am the expensive one.
- `banter_2` — [smug] Burning. Obviously.
- `banter_3` — [sneering] Barely worth the spell.

## Hiwot  `wren_ward`

**Sex:** female · **Role:** companion · **Voice ID:** 0F4ybvRD5Lm0AIt5almW

**Who they are:** Your foster-sister from Lanternhold, raised beside you in the keepers' library. Quick hands, quicker mouth, hides fear behind jokes.

**From:** Lanternhold and the hill keeps — Ethiopian highlands. **Voice:** Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.

**q1_catchup**

- `q1_catchup_1` — [breathless] Oh, thank every saint that listens. I saw you both leave and I followed — yes, I know, I was not supposed to — and then I saw the torches, and the big one in the black armour, and I ran the other way, because I am not brave. I am only fast.
- `q1_catchup_2` — [quieter] He is dead. Tesfaye. I saw him fall. I can't believe we left him there. He should be with us.
- `q1_catchup_3` — [urgent] Tell me what the big one said to him. I was too far; I saw his mouth move and Tesfaye shake his head. What did he want?

**q1_join**

- `q1_join_1` — [firm] I am coming with you. I can pick locks and keep watch while you sleep. Besides, if you leave me here, I will only have to follow you again.

**q1_wren_cold**

- `q1_wren_cold_1` — [stung, then flat] Right. I am fine. — I have his letter. An inn and two names. You may read it when you have finished being a wall.

**q1_wren_dark**

- `q1_wren_dark_1` — [uneasy] "What you are." He said that? — You sounded like him just then. Not Tesfaye. The other one. [softer] There is a letter. An inn, two names. Let us go and be alive first. You can be terrible later.

**q1_wren_kind**

- `q1_wren_kind_1` — [steadying] He wanted you. By name. Then it was never about Tesfaye at all. — Close. Yes. I can do close. I have his letter; it was in his coat. An inn on the Shore Road, and two names, Beau and Delphine. He must have meant for us to go to them.

**q2_cassian_hiwot**

- `q2_cassian_hiwot_1` — [sceptical] Alone. Who sends one squire to a wolf den? What did you do to your Order?

**q2_morwin_hiwot**

- `q2_morwin_hiwot_1` — [quickly] Neither. We are pilgrims. Going to the shrine at — the shrine.

**q2_notice**

- `q2_notice_1` — [picking up the paper] He was carrying this. Your face, and a bounty, and a seal of an iron hand in red wax. No name.
- `q2_notice_2` — [quiet] Somebody with a great deal of money wants you dead badly enough to send two men in one night and a third to wait at the one door Tesfaye trusted. I am keeping this. Somebody at that inn will know the mark.

**q2_pair_hiwot**

- `q2_pair_hiwot_1` — [low, to you] Do not tell them anything. We do not know them.

**q2_road**

- `q2_road_1` — [reading] "The Open Hand, on the Shore Road, past the salt-flats. Ask for Beau and Delphine. They are Wardens, and they were my friends before you were born. Trust them as you would trust me." — That is all it says. He never wasted ink.
- `q2_road_2` — [thinking] Wardens. He never once said that word in twenty years, and now it is the first thing he wants us to know. That is the first thing I am asking them.

**q2_wolves**

- `q2_wolves_1` — [low] Wolves. Road wolves, the big grey kind — Tesfaye said they only come down to the road when the hills are hungry.
- `q2_wolves_2` — [very quiet] Something has made the hills hungry.

**q3_south_hiwot**

- `q3_south_hiwot_1` — [thinking] A locked drawer in his study. I never got it open, and I tried twice, which he knew, because he moved the key. He never moved anything else.
- `q3_south_hiwot_2` — [quiet] It is still there. Whatever it is.

**q4_camp_hiwot**

- `q4_camp_hiwot_1` — [quiet, at the fire] Delphine. Was he a good Warden? Tesfaye. He never talked about it, and I have been wondering all day whether that was because it was bad, or because it was good.

**q4_down**

- `q4_down_1` — [low] It smells like wet dog and hot metal. Four levels of that, going down.
- `q4_down_2` — [quiet] Keep your light up. I can't see where these stairs end.

**q4_letters**

- `q4_letters_1` — [reading] "Keep the ore fouled until the spring shipment. Gorruk holds the north road." And a name — Femi, at the inn in Thornbury.
- `q4_letters_2` — [quiet] Tesfaye died over a shipping schedule. That cannot be the whole of it. It cannot.

**q5_camp**

- `q5_camp_1` — [whispering] Or I go over the palisade and open the back gate while every eye is on the front.

**q5_camp_quiet**

- `q5_camp_quiet_1` — [breathless] The back gate is open. Two sentries were sleeping, and one of them is going to wake with a headache and no boots.
- `q5_camp_quiet_2` — [low] The big tent is the lord's. There is a man chained in it who looks as though he still has jokes left.

**q5_camp_storm**

- `q5_camp_storm_1` — [resigned] Loud, then. Go for the one with the horns first; the rest will look to him.

**q5_verlan_pocket**

- `q5_verlan_pocket_1` — [murmuring] Map, seal, and a very old sausage. He did not feel a thing.
- `q5_verlan_pocket_2` — [low] Past Holloway Vale, under the oaks. There is a note about the road being watched.

**q6_forest**

- `q6_forest_1` — [low] Old trees. Very old, very big. Things in the branches that stop moving when we look.
- `q6_forest_2` — [a breath] I will go first. No. I will not. You go first.

**q6_wyverns**

- `q6_wyverns_1` — [appalled] It has a sting on its tail. Its tail has a sting.

**q7_cages**

- `q7_cages_1` — [sick] They keep them in cages between shifts. Like dogs. Worse than dogs; I have seen dogs kept better than this.

**q7_flood_now**

- `q7_flood_now_1` — [shouting] NO —
- `q7_flood_now_2` — [hollow] He was coming up. We could hear the chains.

**q7_mine_umbra_none**

- `q7_mine_umbra_none_1` — [low] The druids wanted this mine shut down too.
- `q7_mine_umbra_none_2` — [dry] We could have had their help. Instead, we picked a fight with them. That was clever of us.

**q7_papers**

- `q7_papers_1` — [reading] Three names at the Consortium's tower in the city. Adigun Adeyinka, Bankole, Rotimi.
- `q7_papers_2` — [quiet] The road north is open now. There is nothing between us and the Gate but the Gate.

**q7_valve**

- `q7_valve_1` — [frantic] Beau is below with the chain-gang. If you turn that wheel he drowns with them.

**q8_door**

- `q8_door_1` — [whispering] Doorman. I can get us past him. He will not even remember we were here.

**q8_door_force**

- `q8_door_force_1` — [sighing] Loud again. I am keeping a list.

**q8_door_wren**

- `q8_door_wren_1` — [smug] Side window. He is asleep on his feet. I told you.

**q8_faces**

- `q8_faces_1` — [horrified] That is the merchant's face. That is his FACE and it is not him. Nothing is behind the eyes.

**q8_sewers**

- `q8_sewers_1` — [gagging] I have been in a mine, a fortress and a spider nest this month, and THIS is the worst. This is the worst place.

**q9_lobby**

- `q9_lobby_1` — [whispering] A clerk. Two guards. A very long list of names on his desk, and we are not on it.

**q9_lobby_fight**

- `q9_lobby_fight_1` — [flat] So much for quiet. Stairs. Go.

**q9_lobby_talk**

- `q9_lobby_talk_1` — [impressed] He BELIEVED you. Olamide's name still opens doors. Third floor, he says. Do not touch anything.

**q9_lobby_wren**

- `q9_lobby_wren_1` — [hushed] Got it. There is a name at the bottom in red: "the ward — as agreed." Whatever we do up there, somebody upstairs already knows we are coming.

**q9_top**

- `q9_top_1` — [stunned] Lanternhold. They went HOME. The three men who paid to kill Tesfaye are sitting in his library. — The drawer. Delphine, the locked drawer. We are going to be in that room.

**q10_catacombs_hiwot**

- `q10_catacombs_hiwot_1` — [brightly] None of us. We are pilgrims.

**q10_double**

- `q10_double_1` — [Hiwot's voice, wrong] Thank the saints. I got separated — come here, come HERE, we have to go —

**q10_double_question**

- `q10_double_question_1` — [the real Hiwot, furious] The HONEY. It was the honey, and Brother Yonas still blames the cat — that thing wearing my face does not know that, so STAB IT.

**q10_home**

- `q10_home_1` — [strange] It smells the same. Ink and dust and the brothers' lentils. I thought it would feel like home, and it feels like a trap.

**q10_ring_hiwot**

- `q10_ring_hiwot_1` — [suspicious] How did you know Tesfaye? I lived in that keep twenty years and I never once saw you.

**q10_ring_hiwot_after**

- `q10_ring_hiwot_after_1` — [flat] That is not an answer.

**q10_shore**

- `q10_shore_1` — [shaking] Out. We are out. I am never going home again, am I.
- `q10_shore_2` — [small] Sanni sent us into that room. Then he told the guards we'd murdered his father. He had this planned before we ever left the city.

**q11_alleg_consortium**

- `q11_alleg_consortium_1` — [uneasy] Folake. I do not trust her smile. I do not trust anything about her. But she does have a door.

**q11_alleg_gauntlet**

- `q11_alleg_gauntlet_1` — [nodding] The Duke. All right. I like a Duke who owes us.

**q11_alleg_thieves**

- `q11_alleg_thieves_1` — [grinning] Tunde! Yes. I was hoping you would say that. Thieves are honest about what they are.

**q11_doors**

- `q11_doors_1` — [thinking] Three doors. Adebayo, if we can save him. Folake, if you can stand her. Or Tunde Softfoot and a debt.

**q11_posters**

- `q11_posters_1` — [reading] "Wanted, for the murder of Grand Duke Ayodele and of the Consortium summit at Lanternhold: the ward of Tesfaye, and company." That is your face. That is a BAD drawing of your face.
- `q11_posters_2` — [quiet] The street is full of it: Emeka Obi is dead. A man called Segun Marr commands the Gauntlet now, and he is the one who signed this.

**q12_dukes_korvath**

- `q12_dukes_korvath_1` — [shouting] The dukes — the DUKES — we cannot hold them if you run at him —

**q12_steps**

- `q12_steps_1` — [itching] I hate silk. I hate silk SO much. — There he is. On the dais. Smiling. He has a lovely smile. I want to put it through a wall.

**q13_maze**

- `q13_maze_1` — [hushed] The thieves' maze. I can read it — half of it is Lanternhold locks, the cheap kind. Follow me exactly.

**q13_maze_cut**

- `q13_maze_cut_1` — [groaning] Straight through. Fine. The loud list is getting long.

**q13_maze_follow**

- `q13_maze_follow_1` — [murmuring] Left. Again. Not that one. — Through. Nobody bled. Tell Tesfaye I was paying attention.

**q13_return**

- `q13_return_1` — [stiff, bandaged] I heard you were going under the city without me. Absolutely not.
- `q13_return_2` — [fierce] I am stitched, I am furious, and I still open locks better than anyone here. Move over.

**q14_mirrors**

- `q14_mirrors_1` — [horrified] That is ME. That is all of us. They are wearing US.

**q14_sanctum**

- `q14_sanctum_1` — [whispering] It is warm down here. It should not be warm.
- `q14_sanctum_2` — [fierce] Whatever he says in there — you are Tesfaye's. Not his. Tesfaye's.

**banter**

- `banter_1` — [shouting] The left one! The left one is looking at YOU!
- `banter_2` — [breathless] Still with you. Keep going!
- `banter_3` — [gleeful] Got his purse. And his knife. And his — never mind, keep fighting.

## Itsuki  `ithrel`

**Sex:** male · **Role:** companion (romanceable) · **Voice ID:** EqIniNyrvzFcbGecFyI5

**Who they are:** An elf ranger of the eastern woods who has hunted the bandit lord Gorruk for a year. Grief made him quiet; the quiet made him precise.

**From:** The elves of the eastern woods — Japanese. **Voice:** Understated and exact. Apology before request, gratitude after. Few words; the pause carries the feeling. "-san" for strangers of standing; never contractions when serious.

**q3_ithrel**

- `q3_ithrel_1` — [quiet, from the treeline] Forgive me. I do not mean to alarm you. I have walked beside your road for an hour, deciding whether to speak.
- `q3_ithrel_2` — [level] You are going north to the Gate, by the river road? — Then I will be plain. I am Itsuki. A year ago an ogre called Gorruk, who leads the bandit companies in the north, burned a wagon on this road. My wife was in it. I have hunted him since, alone, and alone I cannot reach him.

**q3_ithrel_ask**

- `q3_ithrel_ask_1` — [level] You are going towards him. I would go with you. I ask nothing else.

**q3_ithrel_no**

- `q3_ithrel_no_1` — [calm] I understand. I will walk on ahead of you, then. If our roads cross again, I will not ask twice.

**q3_ithrel_seal**

- `q3_ithrel_seal_1` — [thinking] I have seen letters carried to his camp. Sealed. I did not read them; I was too far, and I am no thief. The seal was red, and pressed hard. That is all I can say honestly.

**q3_ithrel_selene_reply**

- `q3_ithrel_selene_reply_1` — [calm] I did. A man at a Warden house on the coast told me the north road is not the Wardens' road. He was polite about it.

**q3_ithrel_wife**

- `q3_ithrel_wife_1` — [a long pause] Hana. Thank you for asking. No one asks. They ask about him.

**q3_ithrel_yes**

- `q3_ithrel_yes_1` — [a small bow] Then I am in your debt before I have earned my place. I will keep the rear. You will not hear me unless you need to.

**q5_dead**

- `q5_dead_1` — [quietly] It is done. I thought I would feel taller. I feel as though I could sleep for a year.
- `q5_dead_2` — [soft] I will stay, if you will have me. There is nothing else I was for.

**q5_gone**

- `q5_gone_1` — [cold] He walked out of that tent because you wished it. I will find him myself.
- `q5_gone_2` — [flat] Do not follow me.

**q5_shot**

- `q5_shot_1` — [very quietly] I have him. A clean line, no cover. Say yes.

**q5_shot_no**

- `q5_shot_no_1` — [tight] Alive. I have waited a year. I can wait until the end of a fight.

**q5_shot_yes**

- `q5_shot_yes_1` — [exhaling] Thank you. Whatever comes after this — thank you.

**q5_tent_ithrel**

- `q5_tent_ithrel_1` — [very quiet] Gorruk. Where does he sleep?

**q9_romance**

- `q9_romance_1` — [low] I still miss my wife. I always will.
- `q9_romance_2` — [quiet] But I have come to care for you too. If you feel the same, I would like us to be together.

**q9_romance_no**

- `q9_romance_no_1` — [calm] I understand. It was enough to say it. Sleep.

**q9_romance_yes**

- `q9_romance_yes_1` — [quiet] Then we will take our time. I am glad you told me.

**q11_docks_ithrel**

- `q11_docks_ithrel_1` — [very quiet] The north road. A year ago. Were you there when the wagons burned?

**q13_gorruk**

- `q13_gorruk_1` — [very quietly] Mine. You said. Say it again.

**bond_first**

- `bond_first_1` — [low] I have spent so long following tracks that I have given little thought to what comes after.
- `bond_first_2` — [tired] I cannot go back to the life I had with my wife. I do not yet know what else I want.

**bond_first_reply**

- `bond_first_reply_1` — [quiet] I would like to stay. It helps to have people expecting me back.

**bond_interest**

- `bond_interest_1` — [careful] I care for you. I need time before I can promise more. If you are willing to wait, I would like to try.

**bond_later**

- `bond_later_1` — [calm] Take the time you need. You know where to find me.

**bond_second**

- `bond_second_1` — [thoughtful] I used to guide travellers through the woods. Some had never slept outside. They would wake me over every rustle.
- `bond_second_2` — [faintly amused] One paid me extra to keep the owls away. I gave him something to plug his ears.

**bond_second_reply**

- `bond_second_reply_1` — [warm] I would enjoy that. There are places worth visiting without a bounty to collect.

**banter**

- `banter_1` — [quiet] Loosing.
- `banter_2` — [flat] The archer is mine. Leave him.
- `banter_3` — [cold] Again.

## Kaito  `faelen`

**Sex:** male · **Role:** companion (romanceable) · **Voice ID:** O5EDsXljBLA6l3KfYEde

**Who they are:** An elf bounty-hunter of the eastern woods who flirts with anything and finishes every job. Cheerful, mercenary, surprisingly loyal.

**From:** The elves of the eastern woods — Japanese. **Voice:** Understated and exact. Apology before request, gratitude after. Few words; the pause carries the feeling. "-san" for strangers of standing; never contractions when serious.

**q6_faelen_cut**

- `q6_faelen_cut_1` — [relieved] You are my favourite person. I say that to everyone. This once, forgive me, I mean it.
- `q6_faelen_cut_2` — [smiling] I will come along, if you will have me. The wyverns are that way, and so, I suspect, is whatever you came into these woods to find.

**q6_faelen_leave**

- `q6_faelen_leave_1` — [calling after you] Fair enough! If you change your mind, I will be — well. Here.

**q6_faelen_price**

- `q6_faelen_price_1` — [delighted] Ah. Now we are talking properly. My bow, until your road ends. And a thing I saw, which I think you will want: east of here, past the wyvern cliffs, there is a mine under the hill. Men in iron livery go in at dawn and men in chains come out at dusk. I did not go closer. I hunt beasts. That did not look like a beast.

**q6_faelen_wyvern**

- `q6_faelen_wyvern_1` — [bright] The magistrate of Thornbury, whose sheep keep disappearing. Three hundred in gold, and — I am told — the gratitude of a woman with a very fine face. I am still negotiating the second part.

**q6_web**

- `q6_web_1` — [cheerful, from above] Ah — hello. Yes. Up here. In the web. It is exactly as embarrassing as it looks, and I apologise for it.
- `q6_web_2` — [appraising] Not bounty hunters; you walk too close together. A green sash — Wardens, then, or with Wardens. Good. Wardens cut people down for nothing. Kaito. I hunt bounties, mostly, and I was hunting a wyvern's head when the spiders took offence.

**q6_wyverns**

- `q6_wyverns_1` — [bright] There she is. The matriarch. That head is worth three hundred in gold and a magistrate's gratitude, and I intend, respectfully, to collect both.

**q8_door**

- `q8_door_1` — [murmuring] Doorman. Big. Bored. I can talk us past him; bored men love a story, and I have several.

**q8_door_faelen**

- `q8_door_faelen_1` — [pleased] — and that is how I lost the boot. He is still laughing. In, in, before he thinks about it.

**q8_door_force**

- `q8_door_force_1` — [resigned] Through him. Very well. I will apologise to him afterwards; it seems only polite.

**q9_lobby**

- `q9_lobby_1` — [murmuring] A clerk. A list. Two guards. Forgive me — I love a lobby.

**q9_lobby_fight**

- `q9_lobby_fight_1` — [cheerful] Stairs it is.

**q9_lobby_talk**

- `q9_lobby_talk_1` — [smiling] He believed it. Third floor. Touch nothing, he says — as if.

**q9_romance**

- `q9_romance_1` — [smiling] I like you. I'd like to spend an evening with you, without the rest of this lot.

**q9_romance_no**

- `q9_romance_no_1` — [light] Stop it is. Friends, then, and I am very good at that as well.

**q9_romance_yes**

- `q9_romance_yes_1` — [delighted] Excellent. A decent meal, some wine, and no work.
- `q9_romance_yes_2` — [warm] I have been looking forward to this.

**q10_double_listen**

- `q10_double_listen_1` — [shouting] Not them! NOT them! It has teeth!

**q10_double_strike**

- `q10_double_strike_1` — [wincing] Right call, wrong result — the real Hiwot was behind it. She is breathing. I will carry her out; go.

**q10_double_strike_alone**

- `q10_double_strike_alone_1` — [breathless] Not him — and you knew. It is down. Two more behind it, and I do not like their faces either.

**q13_maze**

- `q13_maze_1` — [hushed] The thieves' maze. Every third flagstone is a trap and every fourth is a thief. I know the path; follow my feet exactly, please.

**q13_maze_cut**

- `q13_maze_cut_1` — [sighing] Straight through. Watch the flagstones, then, and try to bleed on the thieves and not on me.

**q13_maze_follow**

- `q13_maze_follow_1` — [murmuring] Left. Left. Do not step there. — And we are through, and nobody even bled. I love being right.

**bond_first**

- `bond_first_1` — [quieter] I know I make a performance of everything. It is easier than admitting I was scared.
- `bond_first_2` — [honest] When you found me, I thought I was going to die there. I have been sleeping badly since.

**bond_first_reply**

- `bond_first_reply_1` — [soft] Thank you. I might be rather poor company tonight, but I would like you to stay.

**bond_interest**

- `bond_interest_1` — [pleased] I was hoping you might say that. Let us have a little time together and see how we get on.

**bond_later**

- `bond_later_1` — [easy] All right. Let me know if you want to try again. No awkwardness between us.

**bond_second**

- `bond_second_1` — [cheerful] I used to play for supper at roadside inns. I know six songs well and about forty badly.
- `bond_second_2` — [smiling] I still have the lute. I sold the feathered hat. A man has to improve himself somehow.

**bond_second_reply**

- `bond_second_reply_1` — [amused] Cruel, but fair. I will play you the good six. You can request the others after enough wine.

**banter**

- `banter_1` — [smiling] Loosing, loosing — got him, and he was handsome, too. A pity.
- `banter_2` — [cheerful] Behind them! I am behind them!
- `banter_3` — [light] If I die, tell the magistrate I was thinking of her.

## Layla  `ilvara`

**Sex:** female · **Role:** companion (romanceable) · **Voice ID:** 7nj1jqrTE7EDXPyxWBhY

**Who they are:** A dark-elf priestess of the deep cities, fleeing her own people and a bounty. Contemptuous, curious, thinks mercy is a luxury the strong buy.

**From:** The deep cities of the dark elves — Arabic. **Voice:** Elevated, poetic, unhurried contempt. "By the deep", "ya" before a name, "God willing" said without belief. Images from stone, night and water.

**q5_ilvara_defend**

- `q5_ilvara_defend_1` — [surprised] Protection. From you. How strange, and how useful.
- `q5_ilvara_defend_2` — [dry] Very well. By the deep, I go where you go, until I decide otherwise. Try to be interesting.

**q5_ilvara_sell**

- `q5_ilvara_sell_1` — [venomous] You will remember this. I will see that you do, from wherever they put me.

**q5_ilvara_walk**

- `q5_ilvara_walk_1` — [flat] Of course. Walk on. Everyone does.

**q5_ilvara_why**

- `q5_ilvara_why_1` — [flat] My own people. I refused a thing that was asked of me, and among my kind refusal is answered with a knife. I came up into the light because there was nowhere left to go down. I have not found the light kinder, ya stranger. Only brighter.

**q5_patrol**

- `q5_patrol_1` — [cold] Yes. Stare. A dark elf, above ground, in daylight. You will not see another.
- `q5_patrol_2` — [contemptuous] I am a priestess, and a fugitive, and there is a bounty on me that these three would like to collect. I cured a village of the coughing sickness on my way here. They are arresting me for having the wrong face. Decide what that makes you.

**q5_patrol_ask**

- `q5_patrol_ask_1` — [cold] Well? You have looked long enough to decide.

**q5_patrol_cassian_reply**

- `q5_patrol_cassian_reply_1` — [level] Of a goddess your Order has no name for, boy, and would not like if it did. Does it change your sword arm?

**q9_floor_ilvara**

- `q9_floor_ilvara_1` — [low, amused] Answer her. She is the only person in this tower telling the truth, and she is doing it for money. I respect that.

**q9_romance**

- `q9_romance_1` — [dry] I enjoy your company when you stop trying to give me orders.
- `q9_romance_2` — [direct] I would like some time alone with you. Interested?

**q9_romance_no**

- `q9_romance_no_1` — [cool] Very well. I will not ask again.

**q9_romance_yes**

- `q9_romance_yes_1` — [pleased] Good. Come and sit with me. Your duties can wait for an evening.

**q10_catacombs_ilvara**

- `q10_catacombs_ilvara_1` — [amused] Guess.

**q10_double_listen**

- `q10_double_listen_1` — [sharp] That is not your kin. Kill it before it kisses you.

**q10_double_strike**

- `q10_double_strike_1` — [approving] Ruthless. Correct. The real one is breathing behind it; someone drag her out.

**q10_double_strike_alone**

- `q10_double_strike_alone_1` — [approving] Good. You did not even let it finish. There are more behind it; kill them the same way.

**q14_sanctum**

- `q14_sanctum_1` — [reverent] Do you feel it? The stone remembers him. Morrak. By the deep — it would remember you too, if you let it.

**bond_first**

- `bond_first_1` — [direct] I appreciate what you did for me. Understand something, though. You did not buy my loyalty by keeping me alive.
- `bond_first_2` — [firm] I choose where I go and whom I serve.

**bond_first_reply**

- `bond_first_reply_1` — [approving] Good. I prefer travelling with someone who understands that.

**bond_interest**

- `bond_interest_1` — [interested] You have my attention. Let us spend more time together before deciding anything.

**bond_later**

- `bond_later_1` — [level] Then leave it for now. You can bring it up when you know what you want.

**bond_second**

- `bond_second_1` — [unguarded] I miss the quiet of the shrine. Before the petitions began, I had an hour to myself.
- `bond_second_2` — [dry] Up here, someone is always shouting, selling something, or telling me what a lovely morning it is. Usually in the rain.

**bond_second_reply**

- `bond_second_reply_1` — [measured] The work was demanding. I liked that. I knew what was expected of me, and I was good at it. I miss having a place of my own.

**banter**

- `banter_1` — [contemptuous] Bleed, then, if you must.
- `banter_2` — [cool] Wound them. I will decide who heals.
- `banter_3` — [dry] Surface-dwellers. Always the front lane.

## Santiago  `cassian`

**Sex:** male · **Role:** companion (romanceable) · **Voice ID:** xHLnsxqUy4cc16VOmSD4

**Who they are:** A squire of the Order of the Dawning Flame, from its chapter house in the sun-lands, on his first errand. Earnest, rigid, secretly terrified of failing.

**From:** The Order of the Dawning Flame (chapter house in the sun-lands) — Mexican. **Voice:** Courtly and earnest. "Señor", "señora", "with respect", "God keep you". Formal address to everyone, including enemies; oaths sworn on the Flame.

**q2_cassian**

- `q2_cassian_1` — [formal, out of breath] Hold — with respect, hold! Do not go into the den, señor — señora — forgive me, I do not know which, and I have run a long way.
- `q2_cassian_2` — [straightening] Santiago, squire of the Order of the Dawning Flame. I have been sent to clear these wolves from the road, and I have been sent alone.

**q2_cassian_alone**

- `q2_cassian_alone_1` — [honest] I will confess to you, as I would to no one in the Order, that I am not certain I can. I have never fought anything that was not a straw man.

**q2_cassian_answer**

- `q2_cassian_answer_1` — [reddening, honest] Nothing. That is the difficulty. A knight who has done nothing is sent to do something, and a wolf den on a road nobody uses is the something. I will confess to you, as I would to no one in the Order, that I am not certain I can.

**q2_cassian_join**

- `q2_cassian_join_1` — [relieved] God keep you for it. Then I will take the front, because that is what I am for, and you will tell me if I am doing it wrong.

**q2_cassian_no**

- `q2_cassian_no_1` — [formal, hurt] Of course. God go with you, then. I will — I will manage.

**q2_cassian_order**

- `q2_cassian_order_1` — [earnest] An order of knights sworn to the sun and the sunrise: to be first into the dark and last out of it. Our chapter house is far south of here, in the sun-lands, where I was born. The Order sent me north to learn what the roads are like. I am learning.

**q2_cassian_tease**

- `q2_cassian_tease_1` — [reddening, then honest] Prayers, mostly. And the sword, and how to stand still while people say unkind things — which, with respect, you are doing very well.

**q5_cassian_leaves**

- `q5_cassian_leaves_1` — [quietly] I cannot ride beside a company that shelters what this one shelters. I have prayed on it, and I have tried to find a way, and I cannot.
- `q5_cassian_leaves_2` — [formal] If your company changes, you will find me at the Open Hand. I hope it does. I hope that very much. God keep you.

**q5_patrol**

- `q5_patrol_1` — [uneasy] Burning Gauntlet. A patrol, this far south of the city. They have someone at sword-point — and with respect, by her look, she is not from anywhere near here.

**q5_patrol_cassian**

- `q5_patrol_cassian_1` — [formal, tight] A priestess of what, señora? Say it. I would know what I am deciding about.

**q5_patrol_cassian_after**

- `q5_patrol_cassian_after_1` — [quietly] It might. — Your word decides it. Not mine.

**q9_floor_cassian**

- `q9_floor_cassian_1` — [low] With respect. You do not have to answer her. She is bargaining.

**q9_romance**

- `q9_romance_1` — [nervous] I enjoy the time we spend together. More than I know how to say properly.
- `q9_romance_2` — [earnest] When we have a quiet evening, may I take you to supper? Just the two of us.

**q9_romance_no**

- `q9_romance_no_1` — [bravely] Then I am glad I said it, and I will not say it again. Thank you for hearing it.

**q9_romance_yes**

- `q9_romance_yes_1` — [pleased] Supper, then. I know a decent place. I will try to get through the evening without saluting you.

**bond_first**

- `bond_first_1` — [hesitant] The training yard was easy. You knew the other man would stop.
- `bond_first_2` — [honest] In a real fight, I still want to run. I worry that one day I will.

**bond_first_reply**

- `bond_first_reply_1` — [relieved] Thank you. I needed to hear that from someone who had actually seen me fight.

**bond_interest**

- `bond_interest_1` — [shy] I would like that too. May we take a little time? I want to know you better.

**bond_later**

- `bond_later_1` — [gentle] Of course. Tell me when you are ready. We can still enjoy each other's company.

**bond_second**

- `bond_second_1` — [easier] I wrote home. Mostly about the people I have met. My mother would worry if I described the fighting.
- `bond_second_2` — [fond] She runs a bakery. I used to get up before dawn to carry flour. I complained every morning. Now I miss it.

**bond_second_reply**

- `bond_second_reply_1` — [warm] There is a stool by the oven where I used to sleep between deliveries. Mother still keeps it there. She says my room is too far from the work.

**banter**

- `banter_1` — [shouting] For the Dawning Flame! — forgive me. Habit.
- `banter_2` — [earnest] On me! I can take it!
- `banter_3` — [strained] I am fine! I am — mostly fine!

## Wanjiru  `nettle`

**Sex:** female · **Role:** companion · **Voice ID:** U1NXjHF5ene7Eze10d5J

**Who they are:** An Umbra druid of the Mirkhollow who believes the forest is owed blood. Fierce, literal, no patience for cities.

**From:** The Mirkhollow and the Umbra circle — Kenyan. **Voice:** Direct and rhythmic. "Sawa", "pole pole", "eh?" at the end of a challenge, "Mzee" for elders. Swahili proverbs in translation ("haste has no blessing").

**q6_grove**

- `q6_grove_1` — [fierce] Far enough. This wood is not a road, and you are not welcome on it. The Umbra hold this grove, and the Umbra say turn around. Eh?
- `q6_grove_2` — [sniffing] You carry iron from the Gate. The wood smells it on you. Which of you is theirs?

**q6_grove_ask**

- `q6_grove_ask_1` — [low] No answer. Then hear this: the Mzee would sooner have you bleed than speak. I would sooner hear you first. Speak, or turn around.

**q6_grove_selene_reply**

- `q6_grove_selene_reply_1` — [narrowing] A Warden says so. Wardens said so about the last mine, and the last mine is still there.
- `q6_grove_selene_reply_2` — [low] Mzee Kamau would sooner have you bleed than speak. I would sooner hear you first. So. Speak.

**q6_nettle_ask**

- `q6_nettle_ask_1` — [bitter] Dead fish for a mile downstream. Stags with sores on their flanks. And men — men in chains, walking into a hole in the hill every dawn, and fewer walking out. The wood knows what is being done to it. It does not know how to stop it. I do.

**q6_nettle_fight**

- `q6_nettle_fight_1` — [snarling] Then the roots will have you. MZEE! Kamau! They have chosen!

**q6_nettle_talk**

- `q6_nettle_talk_1` — [grudging] Then we want the same thing, and I would rather kill them beside you than argue with the Mzee about killing you.
- `q6_nettle_talk_2` — [decisive] Sawa. I am coming. He can take it up with the trees.

**q7_mine_umbra**

- `q7_mine_umbra_1` — [quiet] So this is the mine.
- `q7_mine_umbra_2` — [hard] For two years, I have watched the river get worse. Dead fish, sick animals. All because of this place.
- `q7_mine_umbra_3` — [firm] I want this mine shut before we leave.

**banter**

- `banter_1` — [snarling] The roots have him.
- `banter_2` — [fierce] Trees do not forgive. Neither do I.
- `banter_3` — [low] Bleed into the soil. Good. Sawa.

## Winston  `fennick`

**Sex:** male · **Role:** companion · **Voice ID:** R7jdv6H5bZOU3sQIMhbd

**Who they are:** Desmond's halfling minder. Sour, practical, would sell you for a good boot. Umbral Hand.

**From:** The Umbral Hand — Jamaican. **Voice:** Light patois rhythm through word order and idiom, not spelling: "man", "you see it?", "no worry yourself", "one-one coco full basket". Dry warmth from Winston; sing-song from Desmond.

**q2_pair**

- `q2_pair_1` — [flat] He talks. I do the rest.

**q2_pair_ask**

- `q2_pair_ask_1` — [level] Before anybody says yes or no: where are two children walking so fast, with one blade between them and no pack? People with a reason walk like that. I want the reason.

**q2_pair_no**

- `q2_pair_no_1` — [unbothered] Then go easy. If you change your mind, we will be the ones ahead of you with the fire lit. — Desmond. Walk.

**q2_pair_offer**

- `q2_pair_offer_1` — [flat] We are hired blades between hirings, and the road is bad for two and better for four. Say yes or say no, but say it before the light goes. I do not like this stretch after dark.

**q2_pair_vess**

- `q2_pair_vess_1` — [a sigh] Desmond is well the way a fire is well. He can raise the dead for a little while and he laughs when the dead fall down again. I keep him pointed the right way. I have done it since we were boys and I am tired, but I am still doing it.

**q2_pair_who**

- `q2_pair_who_1` — [dry] You want the true answer or the polite one? Polite: two men with skills and no master this month. True: we work for people who pay to know things, and right now they would like to know why iron costs three times what it did last year. You are not the thing we are looking for. You are on the road to it.

**q2_where_refuse**

- `q2_where_refuse_1` — [unbothered] Fair. It is. Then here is mine, so we are even.

**q2_where_truth**

- `q2_where_truth_1` — [thoughtful] The Open Hand. That's a Warden house; everybody on this coast knows it. So you are walking toward trouble, not away from it, and you are honest about it. Both of those are useful to me.

**q3_lessa_winston**

- `q3_lessa_winston_1` — [flat] Before the knives, girl. What's the rate? Two hundred, still, or has it gone up since Merle?

**q3_lessa_winston_after**

- `q3_lessa_winston_after_1` — [dry] Thinking about who can afford to keep raising it. Carry on.

**q3_tollan_winston**

- `q3_tollan_winston_1` — [flat] Mayor. Who takes your wagons north? One buyer, or many?

**q3_tollan_winston_after**

- `q3_tollan_winston_after_1` — [low, to himself] One buyer. That's what they wanted to know. — Go on, man.

**q4_grukhar_winston**

- `q4_grukhar_winston_1` — [flat] Which spring shipment, priest? Whose wagons?

**q4_healing**

- `q4_healing_1` — [firm] That chief keeps healing. I've shut it off for now. Hit him before it wears off.

**q5_camp**

- `q5_camp_1` — [calm] Three ways into a camp like that, man. Loud, quiet, or invited.
- `q5_camp_2` — [dry] Desmond and I can be invited. Recruiters never look too close at faces that frighten them.

**q5_camp_recruits**

- `q5_camp_recruits_1` — [murmuring] Walk like you already killed somebody today. Desmond — no smiling.
- `q5_camp_recruits_2` — [low] We are in. The big tent is Gorruk's. There is a chained man inside; don't look at him yet.

**q5_camp_storm**

- `q5_camp_storm_1` — [flat] Loud. Sawa — fine. The one with the horns is a sergeant; the rest look to him. Kill him first and they look to nobody.

**q7_papers**

- `q7_papers_1` — [flat] He means it. So do I. It is the only thing we were ever on this road for, and I told you I would say so before the day came. This is the day.

**q7_papers_give**

- `q7_papers_give_1` — [nodding] Copies. Fair. You won't regret keeping us.
- `q7_papers_give_2` — [dry] You may regret Desmond. That is a separate matter.

**q7_papers_who**

- `q7_papers_who_1` — [level] The Umbral Hand. You have heard the name; everybody has, and everybody pretends they haven't. Merchants, mostly, of a kind. They want to know who is cornering iron on this coast, and why, and they don't much care who dies of the knowing.

**q7_study_winston**

- `q7_study_winston_1` — [flat] Two sets of books, mage. Which one goes to the Gate?

**q8_door**

- `q8_door_1` — [flat] Doorman. Leave him to me. Everybody has a price, and his is written on his face.

**q8_door_fennick**

- `q8_door_fennick_1` — [flat] Thirty gold and the man has gone for a very long lunch.

**q8_door_force**

- `q8_door_force_1` — [dry] Through him, then. Mind — a man that size falls slow.

**q9_betrayal**

- `q9_betrayal_1` — [flat] Nothing personal, man. You said that yourself once.

**banter**

- `banter_1` — [flat] Back lane. Poison. Done.
- `banter_2` — [calm] Stay close. Don't give them a gap.
- `banter_3` — [dry] Desmond, stop laughing, it puts them off.

## Yasemin  `ysolde`

**Sex:** female · **Role:** companion · **Voice ID:** E7IRB2a3OVqRb6T7du39

**Who they are:** A Kalden witch under Bahadır's guard. Formal, watchful, sees the bloodline in you before you do.

**From:** Kalden, the witch-country beyond the steppe — Turkish. **Voice:** Warm and emphatic. "Abla" / "abi" for elder sister and brother, "canım" for the beloved, "vallahi" as an oath, "inşallah" for hope. Hospitality as a rule of war.

**q3_freed**

- `q3_freed_1` — [cold, from the cage] Thank you. I would kneel, but the bars have made it difficult.
- `q3_freed_2` — [looking at you] You. Come closer. Something in your blood woke when you came through the fortress gate; I felt it through the bars like heat from a stove in the next room. I have read auras all my life and I have never felt one like it.
- `q3_freed_3` — [direct] So tell me, before I decide what to do about it. When it woke — what did it want?

**q3_ysolde_blood**

- `q3_ysolde_blood_1` — [a slow nod] Honest. Good. Then I know what kind of thing it is, if not its name: something that was worshipped once, and fed. I would sooner walk beside it than behind it. Bahadır goes where I go, and Fındık goes where Bahadır goes, and so you have three. Two and a half.

**q3_ysolde_nothing**

- `q3_ysolde_nothing_1` — [dry] You felt nothing. Canım, I watched your hand. — Very well; you are not ready to say it, and that is your right. I will walk beside you anyway, and I will keep watching the hand. Bahadır goes where I go.

**q3_ysolde_quiet**

- `q3_ysolde_quiet_1` — [dry] As you like. I am a witch. Keeping things to myself is most of the work. I will walk beside you, and I will not say it again in front of the others. Bahadır goes where I go.

**q3_ysolde_what**

- `q3_ysolde_what_1` — [precise] Something that was worshipped once, and should not have been. That is as plain as I can be without lying to you. I read auras, not histories. Now answer mine.

**banter**

- `banter_1` — [calm] Frost. Hold him still.
- `banter_2` — [formal] Your aura flares when you fight. Interesting.
- `banter_3` — [cool] Keep them in front of us.

## Kolade Adeyinka, the Armoured  `korvath`

**Sex:** male · **Role:** antagonist · **Voice ID:** CmD1sSN0Gj3pJq3OxRyg

**Who they are:** Your half-brother, raised in the Gate by a Consortium merchant. A giant in spiked black plate who believes bloodshed is a ladder. Calm, courteous, absolutely certain.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q1_after**

- `q1_after_1` — [unhurried, to the dark] Then it will learn the rest from me. Let the child run. The road is long, my friends, and I own most of it.

**q1_appear**

- `q1_appear_1` — [calm, courteous] Tesfaye of Lanternhold. You have run a very long way to end up on a road at night with the one thing I want.
- `q1_appear_2` — [measured] Give the child to me, and you may keep your life and your library. It is not a small thing I offer. I will not offer it twice.

**q1_question**

- `q1_question_1` — [curious, unhurried] Before you die for it, old man, satisfy me on one point. Does the child know? Have you told it what it is, or have you let it grow up believing it is yours?

**q10_unmasked**

- `q10_unmasked_1` — [calm] Of course. Adigun wanted frightened customers paying twice the price. He would never have let the armies march. Now the Consortium is mine, and the ward will be hunted as a murderer.
- `q10_unmasked_2` — [pleased] Let them run. We know where to look for the other children. Once the war begins, nobody will spare soldiers to protect them. I will deal with Tesfaye's ward when I choose.

**q12_face_aldric**

- `q12_face_aldric_1` — [quiet, honest] He was never mine. He chose you. He could have chosen both of us, and he chose you, and I have made my peace with it in a way I do not think you have.
- `q12_face_aldric_2` — [courteous] Baba. Take me down.

**q12_face_evidence**

- `q12_face_evidence_1` — [delighted] Paper! Tesfaye's child brings paper to a coronation. That is the most charming thing I have seen in a year, and I mean that; he taught you well.
- `q12_face_evidence_2` — [gently] It does not matter. Look at their faces: the war is already in their mouths, and paper does not take words back out. Baba — take me down.

**q12_face_throne**

- `q12_face_throne_1` — [a slow, real smile] THERE you are. I knew it. I said to Amara, I said, it will be in the child too, wait and see.
- `q12_face_throne_2` — [warm] Come and take it, then. Not here — this is a hall for merchants. Come to the altar and take it from me properly. Baba — take me down.

**q12_reveal**

- `q12_reveal_1` — [calm, pleasant, to the hall] Enough. Put it down, all of you; nobody in this room is going to be paid tonight, and I would rather not lose good people to bad timing.
- `q12_reveal_2` — [warm, to you] There you are. I have wanted to hear my brother's voice — my sister's — for a year, and I have only ever had it second-hand, from frightened men. Say something. The hall can wait; it is mostly dead.

**q14_altar**

- `q14_altar_1` — [warm] You came. I hoped you would. Every other one of us I have found, I have had to hunt; you walked here on your own feet, and I find I am proud of that, which is a strange thing to feel about someone I mean to kill.
- `q14_altar_2` — [calm] Sit with me a moment. Did Tesfaye ever speak of me? In all those years he raised you, did he mention my name? I've waited thirty years to hear that he remembered me.

**q14_altar_last**

- `q14_altar_last_1` — [patient] Now. Say what you came to say. I have waited thirty years to hear it, and I would like to hear it properly, before we begin.

**q14_beaten**

- `q14_beaten_1` — [on his knees, bleeding] Well. Well. There it is.
- `q14_beaten_2` — [strangely calm] The chair is right there. Someone is going to sit in it. You, me, or the next one of us who walks down those stairs. Choose. I am curious, even now; I think I will be curious to the end.

**q14_last_aldric**

- `q14_last_aldric_1` — [flinching, then smooth] He did not know me. He had a choice between two children in a gutter and he took the one that cried less; I have never held it against him. I hold it against the gutter.
- `q14_last_aldric_2` — [rising] Enough. Draw.

**q14_last_brother**

- `q14_last_brother_1` — [very quiet] Sorry. Nobody has said that to me in thirty years, and you say it as if it cost nothing.
- `q14_last_brother_2` — [rising] It changes nothing. Draw, brother. Sister. Blood.

**q14_last_throne**

- `q14_last_throne_1` — [laughing] YES. Yes. Come and take it. Whichever of us stands up from this floor gets to be a god, and I would honestly be content either way.

**q14_plea_answer**

- `q14_plea_answer_1` — [gently] Amara. My love. Get up; you are kneeling in ash.
- `q14_plea_answer_2` — [cold] No.

**q14_res_gauntlet**

- `q14_res_gauntlet_1` — [laughing weakly] Chains. Amara — Amara, you have won, do you hear me — you have —
- `q14_res_gauntlet_2` — [quiet] Fine. A window. Every week. Fine.

**q14_res_kill**

- `q14_res_kill_1` — [closing his eyes] He chose right, then. Good. Good. I am so tired of choosing.

**q14_res_usurp**

- `q14_res_usurp_1` — [grinning through blood] THERE. There it is. I was right about you.
- `q14_res_usurp_2` — [dying] It is warm, is it not. The chair. It is so warm.

**q14_res_walk**

- `q14_res_walk_1` — [bewildered] You — no. No, you cannot simply — it is RIGHT THERE —
- `q14_res_walk_2` — [alone, as you climb]...it is right there.

**q14_spoke_letter**

- `q14_spoke_letter_1` — [very still] "Brother." In his own hand. — He could have written it to me. He knew where I was; he made a point of never coming. I have wondered for thirty years what he would call me, and it turns out he called me the right thing and sent it to you.
- `q14_spoke_letter_2` — [gently] Thank you. That was not a kindness, but it was the truth, and I have had little enough of either.

**q14_spoke_never**

- `q14_spoke_never_1` — [a long quiet] Not once. — Thank you. I would rather that than a lie, and you could have lied; I would have believed you. It is easier, somehow. A man cannot be refused by someone who never knew he was at the door.

**q14_spoke_nothing**

- `q14_spoke_nothing_1` — [laughing softly] Oh, that is his. That is his exactly; he could put a whole man in a sentence and leave the sentence out. — Good. Then we understand each other, and I do not have to be gentle.

## Abba Gebre  `hadrian`

**Sex:** male · **Role:** keeper · **Voice ID:** k1pVjlfHqGzrko6MqjgN

**Who they are:** First Keeper of Lanternhold. Proud of the library and suspicious of everyone who leaves it, you most of all.

**From:** Lanternhold and the hill keeps — Ethiopian highlands. **Voice:** Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.

**q10_arrest**

- `q10_arrest_1` — [thundering] Three men dead in my reading room. Put down your weapons. You and your whole company are under arrest. To the cells. Now.

**q10_arrest_spared**

- `q10_arrest_spared_1` — [thundering] You say you spared them. Sanni says he found you over their bodies. I will hear you separately, under guard. Put down your weapons. To the cells.

**q10_gate**

- `q10_gate_1` — [cold] A book buys you the door. It does not buy you my good opinion.
- `q10_gate_2` — [stiff] Where did he die? On what road, and on what night? The keep's book of the dead wants a road and a night, and nobody has given me either.

**q10_where_refuse**

- `q10_where_refuse_1` — [cold] "On the road." Very well. It is what he would have wanted written; he never cared for particulars. Do not make a habit of this, child.

**q10_where_road**

- `q10_where_road_1` — [writing, not looking up] "The Griffon Road. Standing." — Tesfaye left this keep with you and came back to it as a line in my book. Do not make a habit of it.

## Baba Olusegun  `ostwin`

**Sex:** male · **Role:** tutor · **Voice ID:** TRPEspiEsb4Zif6sGonu

**Who they are:** Kolade's tutor in the old prophecies. Dry, doting, the only one who calls Kolade 'my boy'.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q10_unmasked**

- `q10_unmasked_1` — [dry] Your father is dead, Kolade. The ward has escaped the keep. I take it we are continuing with the war?

**q12_teleport**

- `q12_teleport_1` — [dry] My boy. This way. — You people: enjoy the rear-guard. They were expensive, o.

## Cal Boone  `cael`

**Sex:** male · **Role:** spy · **Voice ID:** svSvKKBdngsY0ysEx6yS

**Who they are:** A Warden spy from the Shore Road who was caught. Half-starved, still joking, remembers every name he heard in the tent.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q5_letters**

- `q5_letters_1` — [grinning through a split lip] Told you. Every one sealed with the iron hand. The Iron Consortium — the trading house in the Gate — pays for the mine, for these bandits, and for you.
- `q5_letters_2` — [serious] There's a second name under theirs. A mage called Olamide, in the Mirkhollow. They call his place "the other mine." I heard it twice through that tent wall, and men don't say a thing twice unless it matters.

**q5_letters_selene_reply**

- `q5_letters_selene_reply_1` — [thinking] No name on the paper, Del, I'll swear to that. But the ogre said "the Gate office" like it was one man, and once — only once — "Adeyinka." Said it the way a fella says a name he's scared of.

**q5_tent**

- `q5_tent_1` — [hoarse, drawling] Visitors. Well, ain't that fine. Y'all here for me, or for the ogre? Say me. Please say me.
- `q5_tent_2` — [urgent] Cal Boone — Warden, or I was 'fore the chain. That chest by the cot is full of letters, and every last one of 'em carries the same seal. Take the chest. Take me. In that order, if it's got to be.

**q5_tent_ithrel_reply**

- `q5_tent_ithrel_reply_1` — [a nod at the cot] Right there, friend. And he's waking up.

## Dawit  `ambrose`

**Sex:** male · **Role:** keeper · **Voice ID:** jDMhBWlFSleqsyqVHw2R

**Who they are:** A keeper of Lanternhold and Tesfaye's friend. Kind eyes, careful hands, keeps the letter you were never supposed to read.

**From:** Lanternhold and the hill keeps — Ethiopian highlands. **Voice:** Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.

**q10_end_nothing**

- `q10_end_nothing_1` — [gently] Then you did the only thing he asked, and it is the reason I can give you this at all. — Here. Read it. I will stay.

**q10_end_proud**

- `q10_end_proud_1` — [closing his eyes] Then he managed it. He practised that sentence on me for a year, my child, and never once got through it without stopping. — Here. Read it. I will stay.

**q10_end_run**

- `q10_end_run_1` — [softly] "Run." Yes. He was a practical man to the last breath. He wrote the rest down, so that he would not have to trust the last breath to carry it. — Here. Read it. I will stay.

**q10_escape**

- `q10_escape_1` — [urgent] I brought the cell key. Your gear is in the chest outside; take it. Sanni has ordered your transfer to the Gate at dawn. I do not trust him. The old passage behind this wall leads through the catacombs to the shore. Go, and do not trust any face you meet down there.

**q10_gate**

- `q10_gate_1` — [kind] Pay him no mind. He mourns like a wall. — Come and find me in the upper reading room before you do anything else, my child. Tesfaye left something with me. For you. For now.

**q10_letter**

- `q10_letter_1` — [gently] Sit. I have Tesfaye's letter here. Before you read it... did he say anything at the end? I need to know.

**q10_letter_anger**

- `q10_letter_anger_1` — [sad] He tried, every year. He wrote it out and burned it. He thought one more year of not knowing was one more year of you being only his.

**q10_letter_give**

- `q10_letter_give_1` — [quiet] Tesfaye wrote it the year he brought you here. He made me swear to give it to you only when someone had already tried to tell you the wrong way.

**q10_letter_grief**

- `q10_letter_grief_1` — [soft] He raised a child. What the child became was always going to be the child's own work. He knew that. He hoped.

**q10_letter_hunger**

- `q10_letter_hunger_1` — [frightened] Do not — He wrote the last line for exactly that look on your face. Read it again.

## Duke Adebayo  `halvard`

**Sex:** male · **Role:** duke · **Voice ID:** 1N3Ubm5NzIILaxKqZSWn

**Who they are:** Grand Duke and commander of the Burning Gauntlet. Tired, precise, poisoned by the end.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q8_duke**

- `q8_duke_1` — [weary] So. The company that drowned a mine. Obi says you are rude and effective. I have use for both.
- `q8_duke_2` — [precise] Before I say anything worth hearing: the papers you carried out of that mine. Who else has seen them? Every name. I do not enjoy surprises in Council.

**q8_duke_work**

- `q8_duke_work_1` — [precise] The Consortium poisoned its rivals' ore and kept its own iron to sell at a higher price. Adigun blames Calder for the shortage. Now someone is demanding we settle it with a war. The Council votes in a fortnight. I need the orders from their tower to prove who caused this, before ten thousand people die over a shortage those men arranged.

**q8_halvard_blood**

- `q8_halvard_blood_1` — [careful] I do not know, and I will not insult you with a guess. I know they were hunting Tesfaye's ward before they were hunting anyone else, and Tesfaye was a Warden who spent twenty years hiding something in a library.
- `q8_halvard_blood_2` — [quiet] Bring me the papers. Whatever they are hiding, it will be in them.

**q8_halvard_city**

- `q8_halvard_city_1` — [nodding] Good. I will remember that when this is over. Dukes remember more than people think, my friend.

**q8_halvard_pay**

- `q8_halvard_pay_1` — [dry] Five hundred on delivery. Obi will scowl. Ignore him; he scowls at me too.

**q8_seen_hand**

- `q8_seen_hand_1` — [a long breath] The Umbral Hand. Then the whole market will have read them by the week's end, and the Council will hear it from fishwives before it hears it from me. Ah-ah. — Fine. Faster than my clerks, at least. It is not a small thing you have done, and I am not yet sure whether it was a good one.

**q8_seen_nobody**

- `q8_seen_nobody_1` — [a nod] Good. Keep it so. A paper nobody has read is worth twice one everybody has argued about.

**q8_seen_wardens**

- `q8_seen_wardens_1` — [dry] Wardens. Then they are honest and nobody in this city will believe them. Good. That is one problem I already know how to solve.

**q9_book**

- `q9_book_1` — [grave] The keepers hold shipping records both kingdoms trust. They are hearing the dispute over the iron shortage. Take Adigun's orders to Lanternhold and show them who caused it.
- `q9_book_2` — [quiet] I will have my officers keep looking for Kolade here. His father may know where he is. Question Adigun, and bring him back alive if you can. This book will pay your way into the keep.

**q9_plan**

- `q9_plan_1` — [precise] The Consortium is hiring swords. Go in as hired guards and search the top-floor offices. We need the orders bearing Adigun's seal.
- `q9_plan_2` — [dry] If you can do it without burning the tower down, the city would appreciate it. If you cannot, the city will understand.

**q11_cured**

- `q11_cured_1` — [weak] Poison. Slow. He was — the physician was — I could not make my mouth work to say it.
- `q11_cured_2` — [rallying] Kolade. It was always Kolade. Get me to my own guard and I will get you into that coronation.

**q11_way**

- `q11_way_1` — [stronger] Two invitations and a Duke who owes you his life. Olumide will hold the doors. Folasade will hold the Council. You hold the evidence.
- `q11_way_2` — [grave] He will not go quietly. He will run for the Undercity. When he does, do not let him reach the altar first.

**q12_council_dead**

- `q12_council_dead_1` — [hoarse, from a chair] Two Grand Dukes dead in their own hall, and the Council is me and a room full of ghosts. It is not a small thing you did, running at him.
- `q12_council_dead_2` — [hard] The vote is dead with them; nobody will vote for his war now. Go down and finish it. I will hold what is left.

## Duke Folasade  `mira`

**Sex:** female · **Role:** duke · **Voice ID:** MWtIvoi54McT7xb5USQh

**Who they are:** A Grand Duke and a mage. Watches everyone, trusts nobody, and is usually right.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q12_council**

- `q12_council_1` — [shaken] The Council has read it. The vote on the war is dead, and so is his claim.
- `q12_council_2` — [steady] He went into the ground. Olumide is bleeding but standing. Go and finish it, and bring me a head or a prisoner; I will take either.

**q12_dukes_mira**

- `q12_dukes_mira_1` — [sharp] Good. Keep them off me and I will keep the Council listening. That is the only thing that matters in this room.

## Duke Olumide  `orlan`

**Sex:** male · **Role:** duke · **Voice ID:** R6Aoacs81lnwJOkdYTvh

**Who they are:** A Grand Duke who was a soldier first and still stands like one. Loud, decent, easily bored.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q12_council**

- `q12_council_1` — [wheezing] Folasade is dead. He put a knife in her while the whole hall watched.
- `q12_council_2` — [grim] The vote is dead too; she made sure of that first. Go and finish him. I will hold the door until you come back or he does.

**q12_dukes_orlan**

- `q12_dukes_orlan_1` — [roaring] HA! With me, then! Folasade — Folasade, get BEHIND something!

**q12_hall**

- `q12_hall_1` — [booming] Blades! Blades in the hall! Folasade — Folasade, to me —

## Emeka Obi  `halloran`

**Sex:** male · **Role:** officer · **Voice ID:** IGMfg4ZRwOnenZgljHpm

**Who they are:** A Burning Gauntlet officer with a burn-scarred jaw. Plain-spoken, fair, dead by the eleventh chapter.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q8_count_many**

- `q8_count_many_1` — [grunting] Cages. Ah-ah. "Cages" is a word the Council can argue with; a number they cannot. Next time, count. — It is not a small thing, what you did down there. I will say that once.

**q8_count_nineteen**

- `q8_count_nineteen_1` — [writing] Nineteen. Good. A number a man can read aloud to a room of merchants. I will remember it when they tell me again that there were none.

**q8_count_none**

- `q8_count_none_1` — [flat] Between you and the Duke. Very well. The Duke will ask the same question, and he does not like "between" any more than I do.

**q8_halloran_pay**

- `q8_halloran_pay_1` — [snorting] It pays. Not well. Nobody in this city pays well except the people you are fighting.

**q8_halloran_why**

- `q8_halloran_why_1` — [quiet] Because the iron trouble has a name now, and the name is the Iron Consortium, and you are the only people alive who walked out of their mine with proof. He does not know you. He knows that. Do the jobs, my friend. Bring the proof.

**q8_halloran_yes**

- `q8_halloran_yes_1` — [approving] Good answer. The docks are that way. Hold your breath.

**q8_jobs**

- `q8_jobs_1` — [plain] Duke Adebayo wants a word with you, but first I want two things done, and I would rather they were done by people the Consortium already hates. One: something under the docks is eating dock-workers, and the sewer-men will not go down. Two: the Nine Lanterns trading house has stopped being the Nine Lanterns. Same faces, wrong people; I cannot explain it better than that, and I have tried.
- `q8_jobs_2` — [flat] Do both. Then the Duke.

**q8_span**

- `q8_span_1` — [gruff] Serpent's Span. Papers. — Ah. You are the company from the south. The one that drowned the Consortium's mine; half the city has heard it, the Consortium made sure of that when they went crying to the Council.
- `q8_span_2` — [plain] Emeka Obi, Burning Gauntlet. One question before anything, and I want a number, not a story. The Consortium told the Council there were no slaves in that mine. How many did you see in chains?

## Folake  `lysandra`

**Sex:** female · **Role:** mistress · **Voice ID:** 6ILPXNE4jEAfwjCvmbEz

**Who they are:** Kolade's mistress and the Consortium's cleverest survivor. Silk voice, ledger heart, offers a deal in every sentence.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q9_floor**

- `q9_floor_1` — [silken] Put the swords down; you will not need them on my floor, and I have poured two cups. I am Folake. I keep Kolade Adeyinka's bed warm and the Consortium's secrets warmer.
- `q9_floor_2` — [pleasant] I have given you his name. Now tell me what happened on the Griffon Road. Before Tesfaye died, did Kolade offer him a bargain? He usually does. I want to know what he offered.

**q9_floor_business**

- `q9_floor_business_1` — [brisk, pleasant] Now. He is going to be a Grand Duke by month's end, and he is going to have you killed for it. I would rather the reverse. Shall we talk, my dear?

**q9_floor_wait**

- `q9_floor_wait_1` — [patient, smiling] I can wait. I am very good at waiting; it is most of what I do up here.

**q9_lysandra_arrest**

- `q9_lysandra_arrest_1` — [amused] Chains. How lawful. Fine. I will tell Adebayo everything and he will hang me for it, and Kolade will still be sworn in on time.
- `q9_lysandra_arrest_2` — [bitter] Go upstairs. The top floor is where he keeps the truth about you.

**q9_lysandra_deal**

- `q9_lysandra_deal_1` — [pleased] Adigun wants high iron prices. A frightened city pays them. Kolade wants the war to happen. He has been using his father's couriers to hunt Morrak's children behind his back, and his tutor promises him godhood through mass murder. His father would stop the war if he knew how close it was.
- `q9_lysandra_deal_2` — [soft] When you need a way into the palace, come to me. I will have one. The price is his head, and the Consortium afterward — for me.

**q9_lysandra_kill**

- `q9_lysandra_kill_1` — [whispering] He will feel this. That is the only thing I am sorry for.

**q9_lysandra_kolade**

- `q9_lysandra_kolade_1` — [precise] Adigun Adeyinka's foster-son, and the head of the Consortium in everything but the ledger. The man in the black armour on your road; he told me about the road himself, and he told it fondly. He collects people like you. He says you are family. He does not mean it kindly, and he does not mean it as a threat either, which is the frightening part.

**q9_offer_library**

- `q9_offer_library_1` — [satisfied] His library. Not gold, not the child's life — the old man's books. Kolade knew what Tesfaye loved and offered him exactly that. That is how he does everything, my dear, and it is why he will win unless somebody who understands him is on the other side. Which brings us to business.

**q9_offer_nothing**

- `q9_offer_nothing_1` — [a small smile] A lie, and a loyal one. He offered. He always offers; it is the only thing about him I still find beautiful. Keep your lie; it tells me you loved the old man, which is also useful. Now, business.

**q9_offer_price**

- `q9_offer_price_1` — [delighted] Oh, good. Somebody taught you. — I am selling a way into the palace, and the truth about what you are, and I want his head and the Consortium afterward. That is the whole shop. Now you know the price; pay me the answer, or do not, and we go on to business either way.

**q11_way**

- `q11_way_1` — [silken] Two invitations and a bargain kept. His head; my Consortium. I will have a carriage at the palace steps.
- `q11_way_2` — [cool] When it goes wrong — and it will — he will run for the Undercity. I will show you the way down. Nobody else knows it but Amara.

**q12_council_dead**

- `q12_council_dead_1` — [cool] Two dead dukes. You do not do things by halves, my dear; I will remember that when I am counting what is left of the Council.
- `q12_council_dead_2` — [silken] The carriage is at the steps. The way down is under the palace kitchens. Bring me his head.

## Gethin Pryce  `tollan`

**Sex:** male · **Role:** mayor · **Voice ID:** iUOf0Teoe8GQ6633Uazp

**Who they are:** Mayor of Dunmere. Sweating, harried, honest enough. Would pay anyone to make the mine problem someone else's.

**From:** Dunmere and the dwarf clans — Welsh valleys. **Voice:** Sing-song cadence, sentences that end where they started ("I'll go down, I will"). "Bach", "now then", "there's lovely", "duw". Understatement about danger.

**q3_tollan**

- `q3_tollan_1` — [harried, Welsh sing-song] Now then. You'll be Delphine's lot, is it? She sent a boy ahead with a note. Duw, I've been praying somebody would come, and I'm not a praying man.
- `q3_tollan_2` — [wiping his face] Gethin Pryce, mayor of Dunmere, for my sins. The ore's gone bad — comes up grey and brittle and the smiths won't touch it, and my crews won't go below the second level, and I don't blame them.

**q3_tollan_ask**

- `q3_tollan_ask_1` — [hopeful] So. Will you go down, and what will it cost me? Say it plain; I've no head for haggling today.

**q3_tollan_crews**

- `q3_tollan_crews_1` — [low] Lights, on the fourth level, where there's no lamps. Chanting. And a man — the last crew that came up swore it was a man, big, in a robe, standing by something like an altar. They didn't stay to ask him his business, and I don't blame them for that either.

**q3_tollan_fee**

- `q3_tollan_fee_1` — [wincing] Two hundred. There's lovely. — Fine. Fine! Half now and half when you come up, and if you come up with clean ore I'll carry you round the square myself.

**q3_tollan_iron**

- `q3_tollan_iron_1` — [bitter] Whoever's selling good iron while mine's bad. There's one house doing that on this coast, and it's the Consortium, and I've said so to the magistrate twice and got a shrug both times.

**q3_tollan_selene_reply**

- `q3_tollan_selene_reply_1` — [bitter] Same hand, bach, and you know it or you wouldn't ask. The Iron Consortium out of the Gate takes every wagon — they've the roads. They've been very sorry about the bad ore. Very sorry, and very quick to sell the smiths their own stock instead, at a price.

**q3_tollan_winston_reply**

- `q3_tollan_winston_reply_1` — [bitter] One. The Iron Consortium out of the Gate. They've the roads, so they've the ore, and they've been very sorry about it being bad, and very quick to sell the smiths good iron of their own instead.

**q3_tollan_yes**

- `q3_tollan_yes_1` — [nearly weeping] Bless you. Bless you, I mean it. It won't be much, but it'll be everything we've got, and the whole town will know your name.

**q4_thanks**

- `q4_thanks_1` — [overjoyed] The crews went down at dawn and came up with clean ore. Clean! I haven't heard a bar ring true on that anvil since winter. Duw, I could sing.
- `q4_thanks_2` — [earnest] Dunmere owes you more than it can pay, bach. Here's what it can. And — if you go north after the people who did this, the town would take it kindly if you didn't come back alone.

## Nib  `nib`

**Sex:** male · **Role:** knife · **Voice ID:** aiHuPZx6mGgpzcNDwtX2

**Who they are:** The first hired knife, a Shore Road man in a road-cloak with a purse to earn. Easy-going about murder; not paid enough to be brave.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q1_nib_draw**

- `q1_nib_draw_1` — [flat] Reckon I have.

**q1_nib_richer**

- `q1_nib_richer_1` — [amused] For somebody who don't want to be spoken of. Two hundred in gold for the ward of Tesfaye of Lanternhold, alive or otherwise. That's a heap of money for a scholar's foundling, and I'll be honest, I did wonder why.

**q1_nib_run**

- `q1_nib_run_1` — [backing away]...You're either real kind or real foolish, and I ain't paid enough to find out which.

**q1_nib_who**

- `q1_nib_who_1` — [a shrug] There's never a name, friend. A seal on a letter, a purse left at an inn, a description of a face. That's how it's done, and it's done that way so men like me can't answer questions like yours.

**q1_store**

- `q1_store_1` — [easy] Evening. You'd be the old man's ward, then. Younger than I was told, and about to make somebody a good deal richer.
- `q1_store_2` — [almost kindly] No call to make this hard. I've a purse to earn and a road to be on before sun-up, and you've got — what, a practice sword? Stand still and I'll make it quick.

## Sanni  `sarn`

**Sex:** male · **Role:** stranger · **Voice ID:** pL61gpUJHGbG1ctjcpcm

**Who they are:** Sanni, a courteous merchant who claims to know Tesfaye and steers the ward against Adigun. Kolade's civilian identity, used to engineer the murder and arrest.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q9_tower**

- `q9_tower_1` — [quiet, city-formal] Tesfaye's ward. I am Sanni. I knew him through the keep's book trade. He wrote about you and Hiwot. I was sorry to hear what happened on the Griffon Road.
- `q9_tower_2` — [low] Adigun Adeyinka is my father. Those orders from the mine carry his seal. He and his partners have gone to Lanternhold for a hearing over the iron shortage. He means to persuade the keepers that Calder is to blame.
- `q9_tower_3` — [urgent] He is preparing a war with Calder. Kill him before he buys the Council's vote and you could save thousands of lives. Go to the summit at Lanternhold. Read the evidence first, and hear what he has to say. I will meet you there.

**q10_accuse**

- `q10_accuse_1` — [shouting] Guards! In here! Tesfaye's ward has murdered my father and his partners. Take their weapons. Do not let this company leave the keep!

**q10_murder**

- `q10_murder_1` — [cold] You were supposed to kill him. Very well. Father, your couriers brought me your letter to the Council. You will not be calling off my war.

**q10_ring**

- `q10_ring_1` — [quiet, city-formal] You found the papers, then. My father is in the reading room with Bankole and Rotimi. Before you go in, I have something of Tesfaye's for you.
- `q10_ring_2` — [calm] Take this ring. It was his once, before it was mine. And know this, my friend: the three men inside deserve whatever you decide to give them. Nobody will weep.

**q10_ring_ask**

- `q10_ring_ask_1` — [pleasantly] Take it or do not, my friend; I have a long walk either way.

**q10_ring_hiwot_end**

- `q10_ring_hiwot_end_1` — [pleasantly] No. It is not. — The ring. Take it or do not; I have a long walk either way.

**q10_ring_hiwot_reply**

- `q10_ring_hiwot_reply_1` — [a warm, easy smile] He had dealings outside the keep, young lady. Some of them were confidential. I gave him my word that they would stay that way.

**q10_sarn_refuse**

- `q10_sarn_refuse_1` — [amused] Wise. Tesfaye taught you that. Go well anyway.

**q10_sarn_take**

- `q10_sarn_take_1` — [soft] Wear it inside. The keepers will know it. Find my father before he leaves the reading room.

**q10_sarn_threat**

- `q10_sarn_threat_1` — [pleased] I believe you would. Go well.

## Tesfaye  `aldric`

**Sex:** male · **Role:** recruiter · **Voice ID:** EFtnObJs7ex53VSB3niw

**Who they are:** Your foster-father, a retired Warden mage who keeps the library at Lanternhold. Gentle voice, iron patience, a man who has planned for this night for twenty years.

**From:** Lanternhold and the hill keeps — Ethiopian highlands. **Voice:** Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.

**q1_answer**

- `q1_answer_1` — [level] It knows what I taught it. Letters, kindness, and how to hold a blade. That is all the knowing it needs, and more than you were ever given.
- `q1_answer_2` — [to the ward, fierce and low] Run. Do not look back, whatever you hear. Find the Open Hand Inn on the Shore Road. Ask for Beau and Delphine. Run!

**q1_cobb**

- `q1_cobb_1` — [hard] Two of them, inside the keep, on the same night. Somebody bought a keeper's silence for that, and I mean to know whose. Later.
- `q1_cobb_2` — [urgent] The one in the storehouse. Did he say anything before it ended? Who sent him — a name, a house, a mark?

**q1_cobb_bounty**

- `q1_cobb_bounty_1` — [quiet] Two hundred. That is not a grudge; that is a budget. Somebody with money has decided you are worth it, and I would give a great deal to know how they came to that sum. Finish this one; we go the moment the gate opens.

**q1_cobb_nothing**

- `q1_cobb_nothing_1` — [gently] No. There would not have been. It is a thing you learn: ask first, strike after, when you can. Finish this one; we go the moment the gate opens.

**q1_cobb_seal**

- `q1_cobb_seal_1` — [grim] A seal. Then it is a house that wants you, not a man, and houses keep ledgers and ledgers keep names. That is the first useful thing anyone has told me in twenty years. Finish this one; we go the moment the gate opens.

**q1_cobb_spared**

- `q1_cobb_spared_1` — [thoughtful] He went. That was kinder than I would have been in your place. Remember that it cost us nothing tonight; it will not always.
- `q1_cobb_spared_2` — [urgent] And here is a second one, in the brothers' quarters. Before you finish him — the first one. Did he say who sent him? A name, a house, a mark?

**q1_death**

- `q1_death_1` — [struck through] Go —

**q1_refuse**

- `q1_refuse_1` — [steady] You know my name; I do not know yours, and I find I do not care to. You will not have this child while I stand. Take that as my answer.

**q1_road**

- `q1_road_1` — [quiet] Stay close, and keep to the shadow of the trees. This road is empty at night, and I have learned to dislike empty roads.
- `q1_road_2` — [after a silence] In case I do not find a better moment — I have been proud of you every day since I carried you through that gate. Whatever you hear about yourself in the days to come, hold to that. A tree with deep roots laughs at the wind.
- `q1_road_3` — [sharp] Torches. Ahead, and closing. Off the road — now.

**q1_seen_nobody**

- `q1_seen_nobody_1` — [relieved] Then they are not inside the walls yet, and we have the hours I hoped for. Take what coin you have to Dawit at the storehouse and buy a true blade; the practice swords stay behind. Meet me at the gate at the second bell, and if anyone stops you between here and there — anyone — do not argue with them. Come to me.

**q1_seen_pilgrim**

- `q1_seen_pilgrim_1` — [very quiet] You told him. — No. It is not your fault; you had no reason not to. It means they are inside already, and it means we go now, not at the bell. Take your coin to Dawit at the storehouse and buy a true blade, and come straight back to me. Do not stop for anyone.

**q1_seen_why**

- `q1_seen_why_1` — [gently] Because the people I have feared for twenty years have found the one place I hoped they never would. That is the whole answer, and I will give you the rest on the road. Take your coin to Dawit at the storehouse and buy a true blade. Then the gate, at the second bell.

**q1_wake**

- `q1_wake_1` — [low, urgent] Wake, my child, and dress. Not the library robe — the travelling coat, and your boots. We leave Lanternhold tonight.
- `q1_wake_2` — [calm] I know you have questions. I have dreaded them for twenty years, and I will answer every one once we are past the gate and out of the hearing of these walls. Not before. Trust me in this as you have trusted me in everything.

**q1_wake_afraid**

- `q1_wake_afraid_1` — [a breath] Yes. I am afraid. I have never lied to you and I will not begin tonight. Fear is not shameful, my child; it is a messenger. Mine says to have you on the road before the moon is up.

**q1_wake_ask**

- `q1_wake_ask_1` — [careful] One thing before you go, and answer it truly. Has anyone spoken to you today whom you did not know? A pilgrim, a pedlar, a man asking directions. Anyone.

**q1_wake_go**

- `q1_wake_go_1` — [warm] Good.

**q1_wake_why**

- `q1_wake_why_1` — [quietly] A message came at dusk, of the kind that is not written down. It said that people who wish you harm know where you are. Lanternhold, which I chose because nothing here changes and no one ever comes, has stopped being safe. That is all I will say inside these walls.

**q4_dream**

- `q4_dream_1` — [echoing] You are dreaming, my child, and I am dead, and both of those things are true at once.
- `q4_dream_2` — [gentle] That throne belonged to Morrak, the god of murder. He died before you were born. You are one of his children, and part of his power lives in you.
- `q4_dream_3` — [grave] He intended his children to kill one another and take that power for themselves, until one could claim his throne. You can refuse, my child. You do not have to kill for him.

**q4_dream_ask**

- `q4_dream_ask_1` — [sorrowful] I did. I brought you there to keep you out of Morrak's followers' reach. I should have told you while I was alive. I was afraid of what it would do to you.

**q4_dream_embrace**

- `q4_dream_embrace_1` — [grieving] I cannot stop you here; only you can. You will wake with a gift for opening wounds. Mind what it makes you want.

**q4_dream_reject**

- `q4_dream_reject_1` — [warm] Good. That is the harder road, and the right one. You will wake with a gift for closing wounds. Spend it on other people.

**q7_dream**

- `q7_dream_1` — [echoing] The throne is closer this time, my child. You'll keep seeing it as your power grows.
- `q7_dream_2` — [grave] Morrak, the god of murder, left many children. You are one of them. Some of your kin have begun killing the others for his power. The man who hunts you is using the Consortium's money and hired killers to find them.
- `q7_dream_3` — [fading] Each child he kills makes him stronger and removes another rival for the throne. That is why he wants you dead. You can stop him without claiming Morrak's throne yourself.

**q7_dream_embrace**

- `q7_dream_embrace_1` — [grieving] The strongest of them is waiting for you at the end of this road, and he thinks exactly that.
- `q7_dream_embrace_2` — [fading] Please, my child. Be careful what you become on the way to him.

**q7_dream_others**

- `q7_dream_others_1` — [quiet] I do not know how many are still alive. Most were raised by mortal families, as you were. Some may not know what they are. The man in black has been searching for them for years.

**q7_dream_reject**

- `q7_dream_reject_1` — [proud] Twice now. It grows harder each time and you keep saying no. That is what courage is. No one warns you that it is dull.

**q10_double**

- `q10_double_1` — [Tesfaye's voice, wrong] I am not dead. It was a trick — a Warden trick — come to me, child, come here —

**q10_dream**

- `q10_dream_1` — [echoing] Now you have my letter. I should have told you about your brother myself, when I could still help you face him.
- `q10_dream_2` — [grave] Kolade plans to murder the other children and take their power. His tutor means to use the deaths in the war as an offering to Morrak, to make Kolade a god. Stop the war and you deny him that sacrifice.
- `q10_dream_3` — [fading] The last time I ask. Feed it, or starve it.

**q10_dream_embrace**

- `q10_dream_embrace_1` — [quiet] Then I hope I am wrong about what that costs. I have been wrong before. Not about this. Go.

**q10_dream_reject**

- `q10_dream_reject_1` — [at peace] Then I did enough. Go and finish it, my child, and come home to whoever is waiting.

**q10_letter**

- `q10_letter_1` — [echoing, read aloud] "If you are reading this, my child, I failed to tell you myself, and I am sorry. Your mother was one of many. Your father was Morrak, the god of murder, in the last year before he died — and he sired children so that one of them might one day take his place. You are one. So is the man who killed me. He is your brother. He believes the throne is his. It is not, unless you decide it is."

## Tunde Softfoot  `fen`

**Sex:** male · **Role:** thief · **Voice ID:** Xazy5XB2Ls4qYhmhvhLy

**Who they are:** The thieves' guild's voice in the Undervault. Soft-spoken, keeps ledgers of favours, never forgets a debt.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q11_way**

- `q11_way_1` — [soft] Two invitations, and a debt to the Undervault that you will pay when I say. Fair?
- `q11_way_2` — [softer] Fair. Here is what nobody told you, my friend: under the palace is the old city. Under the old city is a temple. He is going there when it falls apart. So are you.

**q12_council_dead**

- `q12_council_dead_1` — [soft] Two dead dukes and a hall full of witnesses. The Undervault will take you down; the Gauntlet is too busy counting bodies.
- `q12_council_dead_2` — [softer] The debt grows. It always does.

## Yohannes  `torvald`

**Sex:** male · **Role:** sage · **Voice ID:** efEXUGgwSIpGeDUw4Vx0

**Who they are:** The sage in the grey cloak, a hill-man of the old highland school. Old beyond reason, amused by everything, tells you exactly as much as he decides you can carry.

**From:** Lanternhold and the hill keeps — Ethiopian highlands. **Voice:** Formal, unhurried, proverb-rich. Blessings and "my child". Sentences finish; nothing is clipped. Anger comes out quieter, not louder.

**q5_sage**

- `q5_sage_1` — [amused] You have looked at me three times this week, my child, and decided each time that I was nobody. That is a good instinct. It is wrong this once.
- `q5_sage_2` — [calm] I am called Yohannes. Tesfaye was my friend before this town had a wall, and I have watched his ward from a distance because that is what he asked of me, and because I am a coward about goodbyes.
- `q5_sage_3` — [quiet, exact] Now. Before I tell you anything, tell me something. The man in black on the Griffon Road. What did he say to Tesfaye? Word for word, if you can.

**q5_sage_ask**

- `q5_sage_ask_1` — [dry] Well? I can see you are not satisfied. Tell me what you want to know.

**q5_test_forget**

- `q5_test_forget_1` — [gently] Then you did as you were told, and you are alive to be asked, and that is the whole of what Tesfaye wanted from that night. Ask me what you like. I will answer what I can.

**q5_test_refuse**

- `q5_test_refuse_1` — [chuckling] Tesfaye said you would be like this. He said it fondly, mostly. — Ask me what you like, before you go and do it.

**q5_test_word**

- `q5_test_word_1` — [very still] "Your library." He knew about the library. Then he has known where you were for years, and waited, and chose his night. That is worse than I feared and better than I guessed: a patient man can be found. — Ask me what you like. I will answer what I can.

**q5_torvald_armour**

- `q5_torvald_armour_1` — [carefully] I have not seen his face. I have seen his work. He does not want you dead for anything you have done; he wants you dead for what you are, and he is not the only one who will. That is as much as I will say before you have earned the rest.

**q5_torvald_go**

- `q5_torvald_go_1` — [calm] The inn, for the courier. The Gnashing Wood, for the rest. Go well, child, since you will go anyway.

**q5_torvald_help**

- `q5_torvald_help_1` — [dry] I have helped. Twice. You did not see either time, which is what help from me looks like.
- `q5_torvald_help_2` — [warm] The courier you want keeps a room at the inn here; the bandits are north, in the Gnashing Wood. Bring the letters out alive. That is the help I need from you.

**q5_torvald_why**

- `q5_torvald_why_1` — [gently] He died so that you would live long enough to be told properly, by the right person, in the right place. That place is not a stable yard in Thornbury, and I am not the right person; I am only the one who knew him longest.
- `q5_torvald_why_2` — [calm] Go north. Find the letters. Paper will bring you to the truth faster than I would, and you will believe paper where you would not believe me.

## Adigun Adeyinka  `maddox`

**Sex:** male · **Role:** boss · **Voice ID:** KZpCMq3CCfA6P6hsnSvp

**Who they are:** Head of the Iron Consortium's Gate office and Kolade's foster-father. A merchant who thinks he is still in charge.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q10_summit**

- `q10_summit_1` — [startled] Guards — no. No, hold. I know who you are.
- `q10_summit_2` — [shaking] Adigun Adeyinka. The mines, the bandits, the lies about Calder — we paid for those. I wanted higher prices, not a war that would close our trade routes. My foster-son is buying votes to send the army across the border. He used my seal to order your death, and Tesfaye's. My own couriers obey him now.

**q10_summit_arrest**

- `q10_summit_arrest_1` — [relieved] Yes. Yes. Adebayo. Anything. Take us out of here before he —

**q10_summit_kill**

- `q10_summit_kill_1` — [terrified] He will not stop when we are dead. He will not STOP —

**q10_summit_selene_reply**

- `q10_summit_selene_reply_1` — [miserable] Mine. The house's. — He took it off my desk in the spring, and my couriers with it, and I have been signing for a man who no longer asks me.

**q10_summit_talk**

- `q10_summit_talk_1` — [whispering] Kolade. Kolade Adeyinka. His tutor told him who his real father was. Then he started paying for reports on other children, all over the coast. I thought he was looking for relatives. I found the death notices with the bounty payments.
- `q10_summit_talk_2` — [broken] He is in this keep tonight. I do not know what face he is wearing.

## Bankole  `vask`

**Sex:** male · **Role:** boss · **Voice ID:** 4cHt9cX9ngcPiEaw8Kud

**Who they are:** A Consortium leader; Adigun's partner. Louder than he is clever.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q10_summit**

- `q10_summit_1` — [bluster] Kill them, Adigun, they have swords in a LIBRARY —

## Femi  `verlan`

**Sex:** male · **Role:** boss · **Voice ID:** 1V8ftW86u2NXoV2QR76J

**Who they are:** The Consortium's courier in Thornbury, a city man posing as a wine merchant. Sweats when questioned, folds when paid.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q5_inn**

- `q5_inn_1` — [nervous, city-polished] I do not know you. I do not know any priest, or any mine. I am a wine merchant, my friend, and I should like you to leave my table.

**q5_inn_ask**

- `q5_inn_ask_1` — [stiff] Well? Leave my table, or say what you came to say.

**q5_inn_selene_reply**

- `q5_inn_selene_reply_1` — [sweating] Ah-ah — madam, I do not answer to — I have a licence, I have papers —

**q5_verlan_beat**

- `q5_verlan_beat_1` — [panicking] Wait — wait —

**q5_verlan_letters**

- `q5_verlan_letters_1` — [sweating] Then the priest is a liar. Or dead. Or both. I carry wine. I carry what I am given to carry, and I do not read it, and nobody has ever asked me to.

**q5_verlan_pay**

- `q5_verlan_pay_1` — [greedy, low] Fifty. Yes. There is a map in my boot: past Holloway Vale, under the old oak line. Do not use the road; they watch the road.
- `q5_verlan_pay_2` — [scurrying] I was never here, o.

## Gbenga  `grell`

**Sex:** male · **Role:** boss · **Voice ID:** brlt4NQGEVKYUPZHGlMp

**Who they are:** Kolade's best knife, sent into the catacombs to finish it. Professional, bored, unbothered by tombs.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q10_catacombs**

- `q10_catacombs_1` — [bored] Down here, then. Good. Fewer witnesses and no keepers.
- `q10_catacombs_2` — [professional] Gbenga. Your brother sends his regards and would like this finished before breakfast. — Which of you is the ward? I was given a face, not a name, and it is dark.

**q10_catacombs_end**

- `q10_catacombs_end_1` — [sighing] Then all of you. It costs me nothing extra.

## Gorruk, the Bandit Lord  `gorruk`

**Sex:** male · **Role:** boss · **Voice ID:** fHJkS6rGX3KuLo1kf0wn

**Who they are:** An ogre-mage who runs the bandit companies for the Consortium. Cruel for sport, cowardly when it counts.

**From:** Monsters — invented. **Voice:** Guttural, no real-world accent.

**q5_escape**

- `q5_escape_1` — [snarling] Not today, foundling. Not for you. The city will finish what I started.

**q5_tent**

- `q5_tent_1` — [booming] The foundling. In my own tent. Somebody in the city is going to be very embarrassed when I send them your head in a bag.

**q13_again**

- `q13_again_1` — [roaring] YOU. Twice. TWICE you walk into my tent. There is no city to run to this time, orphan.

## Grukhar  `grukhar`

**Sex:** male · **Role:** boss · **Voice ID:** d9QexFKeaE8pDBNegABG

**Who they are:** A half-orc priest of Veylan poisoning the Dunmere ore for pay he has not been paid. Bitter, frightened, dangerous.

**From:** Monsters — invented. **Voice:** Guttural, no real-world accent.

**q4_chamber**

- `q4_chamber_1` — [hoarse] So. Somebody finally came down. The crews have been whispering about a company from the coast for a week; I hoped you were bringing my pay.
- `q4_chamber_2` — [bitter] They lied about that part. I have not seen a coin since spring. I have letters — orders, names, the whole rotten trade. Let me walk out of this hole and they are yours.

**q4_chamber_ask**

- `q4_chamber_ask_1` — [hoarse] Well? The letters for my life. It is a fair trade and you know it.

**q4_grukhar_kill**

- `q4_grukhar_kill_1` — [snarling] Then come and take them, foundling.

**q4_grukhar_selene_reply**

- `q4_grukhar_selene_reply_1` — [a grunt] You've seen it, then.

**q4_grukhar_walk**

- `q4_grukhar_walk_1` — [relieved, backing away] The altar. Read the one with the ogre's mark first; it names the courier and the inn.
- `q4_grukhar_walk_2` — [muttering] Veylan keep me. I am finished with iron.

**q4_grukhar_who**

- `q4_grukhar_who_1` — [hoarse] A courier called Femi, who keeps a room at the inn in Thornbury and calls himself a wine merchant. Above him, something that signs itself Gorruk and holds the north road. Above THAT, I never met. Nobody meets it. The money used to come down the same way the orders do.

**q4_grukhar_why**

- `q4_grukhar_why_1` — [a laugh like a cough] You think I asked? Somebody wants iron dear this year. Somebody wants the smiths of the Gate buying from one hand. I was told to keep this mine useless until the spring shipment, and I did, and I was to be paid for it, and I was not.

**q4_grukhar_winston_reply**

- `q4_grukhar_winston_reply_1` — [hoarse] The Consortium's. They're the ones who hired me. You'll find the details in those letters.

## Idris  `idris`

**Sex:** male · **Role:** boss · **Voice ID:** Zjllzaofqu5CuNshWGwW

**Who they are:** The 'healer' at Duke Adebayo's bedside. A doppelganger wearing a physician.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q11_healer**

- `q11_healer_1` — [oily] The Duke is resting. He must not be disturbed. I am his physician, and I will thank you to —
- `q11_healer_2` — [dropping the voice] — ah. You. The face on the posters. How very tiresome.

## Jelani  `jarem`

**Sex:** male · **Role:** boss · **Voice ID:** 68X70AB3zrqH7rtaQUHH

**Who they are:** Kolade's court mage. Serves because Kolade is winning; would serve anyone who was.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q13_street**

- `q13_street_1` — [sneering] The brother. Or the sister. It does not matter which — Kolade says the blood is the same, and the blood is what burns.
- `q13_street_2` — [cold] Cultists! Light the street!

## Kemi  `kessa`

**Sex:** female · **Role:** boss · **Voice ID:** zzp11mPTUa7yKugVGfwD

**Who they are:** The other half. Quiet, a mage, the one who actually plans.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q11_undervault**

- `q11_undervault_1` — [bored] The reward is a thousand and the invitations are worth more. Stop talking and start bleeding them.

## Lurleen  `lessa`

**Sex:** female · **Role:** boss · **Voice ID:** xWbXI06Q9UpLaSG8TVpw

**Who they are:** A knife for hire from the Shore Road who takes her work personally. Smiles when she is losing.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q3_lessa**

- `q3_lessa_1` — [smiling, from a corner table] There you are, sugar. I've been nursing this cider an hour, waiting on you. Lurleen. You don't know me, but I know that face; I've got it on paper in my pocket.
- `q3_lessa_2` — [light] Three sent before me, I hear. And one of them Merle, who I liked. So this ain't only money now. Just so you know.

**q3_lessa_ask**

- `q3_lessa_ask_1` — [light] Well? You going to say something clever, or are we going to get on with it?

**q3_lessa_fight**

- `q3_lessa_fight_1` — [pleased] There she is. — There he is. Whichever. Come on, then.

**q3_lessa_why**

- `q3_lessa_why_1` — [a shrug] Because I'm good at it, and because nobody else in this country pays a woman to be good at anything. You'd know, if you'd grown up anywhere but a library.

**q3_lessa_winston_reply**

- `q3_lessa_winston_reply_1` — [amused] Three now. It goes up every time one of us don't come back. You thinking of switching sides, halfling?

## Merle  `morwin`

**Sex:** male · **Role:** boss · **Voice ID:** al2GsnInvOnScFc93vu6

**Who they are:** A hired mage-assassin from the Thornbury country with a bounty notice in his coat. Talks too much before he casts.

**From:** Thornbury, the Shore Road and the Wardens' country — Georgia, USA. **Voice:** Warm drawl. "I reckon", "I'll tell you what", "y'all", "fixing to", "bless him". Plain-spoken courtesy; ma'am and sir to strangers. Long vowels, short tempers.

**q2_morwin**

- `q2_morwin_1` — [drawling, on the inn steps] Well, look here. Two of you, and a paper in my pocket with one face on it. Now which one's the ward of Tesfaye of Lanternhold? Don't all shout at once.

**q2_morwin_alone**

- `q2_morwin_alone_1` — [unhurried] Merle. I'm the fella they send when the first fella don't come back. I'd sooner do this out here than in Delphine's yard. That woman scares me.

**q2_morwin_hiwot_reply**

- `q2_morwin_hiwot_reply_1` — [amused] Pilgrims. With that face, that the paper's got drawn near perfect. Nice try, little sister.
- `q2_morwin_hiwot_reply_2` — [unhurried] Merle. I'm the fella they send when the first fella don't come back. Now I'll say this once: I'd sooner do this out here than in Delphine's yard. That woman scares me.

**q2_morwin_how**

- `q2_morwin_how_1` — [a shrug] The old man had two friends in the whole world, and they run this inn. Anybody who knew him knew that. Whoever's paying knew him.

**q2_morwin_inn**

- `q2_morwin_inn_1` — [cursing] Oh, that's low. That's — I hear the door. All right. All right, quick then.

**q2_morwin_kill**

- `q2_morwin_kill_1` — [grinning] Now there's the temper the paper warned me about.

**q2_morwin_name**

- `q2_morwin_name_1` — [chuckling] Same as always. A seal, no name. Iron hand on red wax, pressed hard, like whoever did it was angry at the wax. If you want a name you'll have to go up the road a good deal further than me.

## Mzee Kamau, Archdruid  `thornwise`

**Sex:** male · **Role:** boss · **Voice ID:** _unassigned_

**Who they are:** The Umbra archdruid of the Mirkhollow. Believes every axe-holder deserves a root through the chest.

**From:** The Mirkhollow and the Umbra circle — Kenyan. **Voice:** Direct and rhythmic. "Sawa", "pole pole", "eh?" at the end of a challenge, "Mzee" for elders. Swahili proverbs in translation ("haste has no blessing").

**q6_grove_mzee**

- `q6_grove_mzee_1` — [old, unhurried] Wanjiru. They have been told to leave.
- `q6_grove_mzee_2` — [flat] I have buried nine of ours since that mine opened. If these people work for the Consortium, they will get no mercy from me.
- `q6_grove_mzee_3` — [cold] Hear them out if you must. They stay where they are.

**q6_grove_mzee_peace**

- `q6_grove_mzee_peace_1` — [flat, from the trees] Wanjiru. If they are lying, you are the one who let them in.
- `q6_grove_mzee_peace_2` — [grudging] Go with them, then. Make sure they shut that mine. I expect you back when it is done.

## Olamide  `malvane`

**Sex:** male · **Role:** boss · **Voice ID:** qY77JO62oGpUeMUDF7bS

**Who they are:** The Consortium mage running the Mirkhollow mine. Fussy, meticulous, keeps the slaves' names in a ledger.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q7_malvane_fight**

- `q7_malvane_fight_1` — [cold] So be it.

**q7_malvane_who**

- `q7_malvane_who_1` — [contemptuous] To the Gate office, and the Gate office answers to the men whose names are on the letters you have not yet found. You will not find them, my friend. Guards!

**q7_study**

- `q7_study_1` — [irritated] Get away from my desk. Those ledgers are Consortium property.
- `q7_study_2` — [cold] Guards, kill them. The Consortium wants this mine kept running.

**q7_study_ask**

- `q7_study_ask_1` — [cold] Well? You have interrupted my afternoon. Say why.

**q7_study_dai_reply**

- `q7_study_dai_reply_1` — [without looking up] Ledger four. The deceased column, I should think; the deep levels take the dwarves first. Guards!

**q7_study_winston_reply**

- `q7_study_winston_reply_1` — [contemptuous] Both. One to each partner, and neither to you. Guards!

## Rasheed  `ravel`

**Sex:** male · **Role:** boss · **Voice ID:** SwayIXZEQHYPgOU8ZLVO

**Who they are:** Half of Kolade's pet assassins. Loud, vain, deadly with two blades.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q11_undervault**

- `q11_undervault_1` — [grinning] Kemi. Kemi, look. It is the poster. In person! Ah-ah — do we get the reward if we kill it ourselves?

## Segun Marr  `lucan`

**Sex:** male · **Role:** boss · **Voice ID:** ouilM4BVCVF7fxKGukKI

**Who they are:** The Burning Gauntlet officer who sold the company to Kolade. Commands it now. Sneers to hide the shame.

**From:** Varenholm's Gate — dukes, Gauntlet, Consortium, temples, thieves — Nigerian (Yoruba and Igbo). **Voice:** Grand, formal city English. "It is not a small matter", "my friend", "ah-ah!", "I am telling you", "o" softening the end of a line. Titles matter; elders are "Baba" and "Mama".

**q13_steps**

- `q13_steps_1` — [sneering] The Gauntlet stands with the new Duke. Whatever is left of the Council can argue about it afterwards.
- `q13_steps_2` — [cold] I signed your poster myself, my friend. Let me sign the rest of it.

**q13_steps_selene_reply**

- `q13_steps_selene_reply_1` — [cold] In the river, where the old Duke's friends go. Tell her to look downstream.

---

**Totals:** 46 characters · 709 clips · 82,993 characters of text (ElevenLabs bills per character).
