// Ninja vs Pirates campaign dialogue (add-on §2, §5). Same rules as the first
// campaign: every line carries backstory, a want, a regret, a read on the
// player, or tactical information. Short sentences. Nothing hides the point.
// {target} is vocative and dropped in voice; {they}/{them}/{their} name the
// rival on screen and read as pronouns in audio.
// Bracketed tags are ElevenLabs v3 delivery cues — spoken, never shown.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {}; ADV.DATA = ADV.DATA || {};
const L = (t) => ({ t });

ADV.DATA.CAMPAIGN2_DIALOGUE = {

// =====================================================================
// THE HOLLOW BELL — neutral. Old, patient, and it remembers everything.
// =====================================================================
bell: {
  obaasan: {
    offer: [
      L('[calm] Come in. The cheap paper is on the left. The work I want to talk about is behind the counter.'),
      L('[flatly] I have kept this shop for sixty years. I also keep the Hollow Bell. We take contracts from anyone who pays, and we keep every name.'),
      L('[thoughtful] You finish jobs and you walk back into town. That is rarer than people think, and it is why I asked for you.'),
      L('[calm] Come and work for us, {target}. Do the jobs I hand you. Do not ask who paid.'),
    ],
    tutorial: [
      L('[calm] Your work comes from me now. Come to the shop. Do not take jobs off the town board while you are ours.'),
      L('[flatly] Five contracts. They get worse in order. Do them in order.'),
      L('[quietly] Watch our people fight. You cannot buy what they do — you have to see it done, and then it is yours.'),
      L('[calm] Finish all five and you keep a full set of our gear. Everything you saw stays with you as well.'),
    ],
    decline: [L('[flatly] Then take a sheet on your way out. I will still be here when you change your mind.')],
    debrief1: [
      L('[impressed] The scribe has stopped writing and he is still breathing. That is harder than killing him and worth more.'),
      L('[calm] The Paper-Keeper works for me. I sent him to find out whether you would check. You did not, and now you will.'),
    ],
    debrief2: [
      L('[calm] Ren was dead for six years before you met him. Somebody paid a necromancer to keep him useful and did not tell me.'),
      L('[thoughtful] That is the second time this year. Someone is raising our dead and putting them behind us.'),
    ],
    debrief3: [
      L('[warmly] You brought {them} home whole. {they} will not thank you for it, so I am doing it instead.'),
      L('[quietly] The Left Hand said you fight like someone who expects to lose and has decided not to. He meant it kindly.'),
    ],
    debrief4: [
      L('[sorrowful] Suzume is dead. Sit down. No — sit down.'),
      L('[sad] I took {them} off a roof as a child, stealing lamp oil. {they} told me {their} name was a number for a month.'),
      L('[flatly] The thing that killed {them} did not decay. It should have. Three quests and a raised body comes apart — that is the rule and it did not happen.'),
      L('[quietly] Kaede wants you upstairs. She has known his name for twenty years and she has never once said it out loud.'),
    ],
    why: [
      L('[tired] They think the paper is a front. It is not. People need it. I sell it, and I am good at it.'),
      L('[quietly] I have never held a knife. I have sent four hundred people out with one, and I sleep through the night.'),
      L('[calm] That is the work. Not the killing. Coming back, and sleeping after. You will learn it, and you will not notice the day you did.'),
    ],
  },
  suzume: {
    after1: [
      L('[flatly] You are the new one. I am Suzume. I have been the fastest in this clan for four years and I have the tally to prove it.'),
      L('[impressed] Your first job was ugly and you closed it anyway. Most of them freeze at the door. You did not.'),
      L('[calm] The jobs that pay real money would kill you today. I take those. Get better and I will take you on one.'),
    ],
    after2: [L('[impressed] Two for two. Fine. I am watching now, which is more than I give most people.')],
    join3: [L('[flatly] I am coming. You are not ready to go alone and I would rather be there than hear about it.')],
    banter: [
      L('[quietly] Take the left one. {they} watches a doorway all day and has never once been flanked.'),
      L('[impressed] Good. Kaede hears about every contract, and she will hear about that.'),
      L('[calm] Stop counting them. Count the exits.'),
    ],
    after3: [
      L('[impressed] You did not need me on that one. I want it noted that I noticed.'),
      L('[thoughtful] Everyone Obaa-San brings in wants my place. You are the first who might actually take it.'),
    ],
    before4: [
      L('[quietly] I have never worked twice with the same person. Not once in four years. It is a rule and I made it for a reason.'),
      L('[softly] This is twice, {target}. Do not make a speech about it.'),
    ],
    death: [L('[desperately] {target} — go. Do not look at him, just go.')],
  },
  jiro: {
    appear: [
      L('[flatly] Do not stop. Let {them} finish opening the girl first. It has to be our clan that did it or none of this works.'),
    ],
    afterKill: [
      L('[calm] Twenty years ago Kaede signed my name on a slate and someone cut my throat in a stairwell. Nobody remembers why. I have asked.'),
      L('[flatly] A necromancer raised me for three quests of work. The three ran out. I did not come apart. I have been walking ever since and nothing has switched me off.'),
      L('[quietly] Your priest is no use to me. True Rest ends a working, and there is no working left in me to end.'),
      L('[dismissive] Go and tell her I am close. That is the whole reason you are still standing, {target}.'),
    ],
    final: [
      L('[flatly] Kaede. Twenty years and you sent children to do it.'),
      L('[calm] I am not angry. That is the part nobody believes. I am simply still here, and everything I had went away.'),
      L('[quietly] You cannot kill me the ordinary way, so put everything you own into it at once. I would like it to be finished.'),
    ],
  },
  kaede: {
    first: [
      L('[quietly] I am Kaede. I keep the bell. Every name that goes out of this shop goes out because I said it could.'),
      L('[calm] I have ordered more deaths than anyone in this city, and I have never once raised my voice to do it.'),
      L('[flatly] Obaa-San says you are careful. Do the five contracts. When you have, we will talk about what you are for.'),
    ],
    hunt: [
      L('[quietly] Twenty years ago I ordered a man killed. I had a reason. I have forgotten it and that is the part I cannot forgive myself.'),
      L('[calm] He is undead and he does not decay, so nothing holy will help us. He has to be taken apart the way anything is taken apart.'),
      L('[flatly] He will lock you out of your reactions before he swings. Do not save anything for later. There is no later in this.'),
    ],
    fight: [
      L('[quietly] Behind him. The dead ones do not turn.'),
      L('[calm] Keep hitting. He does not heal, he only continues.'),
    ],
    afterFall: [
      L('[quietly] Twenty years. Thank you.'),
      L('[sad] He asked me why, at the end, and I still do not know. I want you to understand that I looked for the answer.'),
    ],
    ending: [
      L('[calm] The bell rang once tonight. It has not done that since before you were born and it will not again while I keep it.'),
      L('[quietly] You are the Bell\'s own hand now, {target}. Everything you saw on those five contracts is yours to keep.'),
    ],
  },
},

// =====================================================================
// THE GREEN-EYED — lawful. Correct about everything, right about less.
// =====================================================================
green: {
  takeda: {
    offer: [
      L('[flatly] Stand straight. I am not going to ask you twice and I am not going to pretend this is a favour.'),
      L('[calm] I train blades for the Green-Eyed. We serve the city\'s law, we are paid by the city, and we do what it writes down.'),
      L('[thoughtful] I have failed two hundred people at that door. I remember all of them. You have a bad guard and good feet, and feet are harder to teach.'),
      L('[calm] Five contracts, {target}. Do them and you will be a Sworn Blade with a clan behind you.'),
    ],
    tutorial: [
      L('[flatly] Your contracts come from this hall now. Not the town board. Here.'),
      L('[calm] Five, in order, each worse than the last. That is how we find out what you are.'),
      L('[thoughtful] Watch our blades work. You will see forms you cannot buy at any trainer. Seeing them is how you take them.'),
      L('[calm] Finish and the clan arms you. That armour is not a gift — it is a statement about who you belong to.'),
    ],
    decline: [L('[flatly] Then you are not a Green Cord and I will not remember your name. The door does not lock behind you.')],
    debrief1: [
      L('[impressed] Your footing was wrong twice and you corrected it once. Sagara told me. He does not compliment people.'),
      L('[calm] The road is clear and nobody has complained. That is the whole job.'),
    ],
    debrief2: [
      L('[flatly] The man is in a cell. The summons was lawful. He was also right, and I am not going to pretend otherwise to you.'),
      L('[quietly] This clan does that sometimes. You will decide for yourself what to do with it.'),
    ],
    debrief3: [
      L('[impressed] Ayame filed two lines about you and both were positive. She has never done that since I put her on the roster.'),
      L('[calm] Doi says you read the field instead of the blade. He is the best of us and he does not flatter.'),
    ],
    debrief4: [
      L('[sorrowful] Ayame is dead. Do not stand there.'),
      L('[sad] I admitted her myself, against the clan, the year of the fire. She was the only woman we have ever formally sworn and she was better than any of us.'),
      L('[flatly] The woman who killed her used an Iai draw. That is our form. She learned it without a teacher, and she learned it well enough to kill our best.'),
      L('[quietly] Lord Isamu is waiting. He believes he has never done anything wrong. Watch his face when he says her husband\'s name.'),
    ],
    why: [
      L('[tired] I was a bad swordsman and a worse man, and this clan gave me a rule to stand inside. That is all it is.'),
      L('[flatly] I have failed hundreds and told every one of them why. Nobody else in this hall will do that for you.'),
      L('[quietly] We serve the law. The law is written by people. I have made my peace with the arithmetic there and you will have to make your own.'),
    ],
  },
  ayame: {
    after1: [
      L('[formal] Ayame. Sworn Blade. I am the best in this clan and it is not a boast, it is the record.'),
      L('[calm] I am also the only woman this clan has ever formally admitted, in a generation, and I had to be twice as good to get the same cord.'),
      L('[impressed] Your report was clean. Sagara does not write clean reports about people he expects to bury.'),
    ],
    after2: [L('[calm] Two contracts, no complaints filed. I have started reading your reports first.')],
    join3: [L('[formal] I requested you. Do not embarrass either of us — I had to argue for it.')],
    banter: [
      L('[calm] Hold the line. Chase them and you are somewhere the clan did not send you.'),
      L('[flatly] Their archer draws on the second round. Take him on the second round.'),
      L('[impressed] Correct. Again, exactly like that.'),
    ],
    after3: [
      L('[thoughtful] I had you wrong. I said you would take three contracts and go home, and you are past that and still standing here.'),
      L('[calm] I would swear beside you again. Write that down, because I will not say it twice.'),
    ],
    before4: [
      L('[quietly] Escort work. Isamu\'s cousin, a good road, and nothing has ever happened on it.'),
      L('[formal] Stay on my left, {target}. I have never asked anyone that before and I do not intend to explain it.'),
    ],
    death: [L('[desperately] Guard — {target}, guard! She is already drawing —')],
  },
  kira: {
    appear: [
      L('[quietly] Not the girl. The one in the green cord. I have waited a long time for a Sworn Blade to stand still.'),
    ],
    afterKill: [
      L('[flatly] Isamu\'s clan burned my husband\'s house on the city\'s authority. My two children were inside it. Every part of that was lawful.'),
      L('[calm] Women are not admitted to the Green-Eyed. So I learned their forms alone, in a shed, off a book and a dead man\'s memory.'),
      L('[quietly] I have just killed the best blade they had, with their own draw, and she never touched me.'),
      L('[dismissive] I am not hunting your clan, {target}. I am hunting Isamu. Everyone standing in front of him is weather.'),
    ],
    final: [
      L('[angry] Say their names. You signed the order — say the names on it.'),
      L('[flatly] You will not, because you never read it. That is what I have hated since the fire. Not the flame. The paperwork.'),
      L('[calm] I draw first. I always draw first. Put something between us or put me down.'),
    ],
  },
  isamu: {
    first: [
      L('[formal] I am Isamu. I hold this clan and I answer to the city, which answers to no one.'),
      L('[calm] We are not mercenaries. Every blade in this hall is sworn, and a sworn blade does not ask whether the order is wise.'),
      L('[thoughtful] Takeda tells me you have promise. Takeda tells me that about one in forty. Complete the five.'),
    ],
    hunt: [
      L('[calm] Her name is Tomoe. Her husband held a clan we destroyed on the city\'s authority, and her children died in it.'),
      L('[flatly] She has trained in our forms without a teacher since that fire, to reach me. Today she reaches me.'),
      L('[quietly] She opens with an Iai draw and it goes through any guard you set. Do not set one. Be somewhere else instead.'),
    ],
    fight: [
      L('[formal] Hold the line and let her come to it.'),
      L('[calm] She is fast and she is alone. Those are the same fact.'),
    ],
    afterFall: [
      L('[quietly] She was better than Ayame. I want that said in this hall while the body is still warm.'),
      L('[thoughtful] I have never done anything wrong. I have signed orders that killed children. I do not know how to hold both of those and I have stopped trying.'),
    ],
    ending: [
      L('[formal] The clan buried her under her husband\'s name. I attended. Nobody asked me to.'),
      L('[calm] You are a Blade of the Clan now, {target}. The forms are yours, and so is the arithmetic.'),
    ],
  },
},

// =====================================================================
// THE RED TALLY — criminal. Piracy as accounting, with weather.
// =====================================================================
tally: {
  hallow: {
    offer: [
      L('[happily] Sit down, have a drink, do not touch the ledger. I am Cask and I keep the tally for the Red Tally fleet.'),
      L('[calm] We are pirates. I write down every share and every crime, because a fleet that argues about money sinks faster than one that gets shot at.'),
      L('[impressed] You did a job last week that paid badly and you did it properly anyway. That is rarer than nerve and worth more to me.'),
      L('[playfully] Come on the tally, {target}. Full share, honest arithmetic, and nothing lawful will ever speak to you again.'),
    ],
    tutorial: [
      L('[calm] Your work comes off my ledger now, not the town board. Five jobs, and they get bigger.'),
      L('[flatly] One thing before you sign. On the tally you are a criminal for the rest of your life. No navy, no clan of lawful swords, not ever. That door shuts tonight.'),
      L('[happily] Watch the crew fight. Half of what they do you cannot buy anywhere — you have to see it and then it is yours.'),
      L('[calm] Five jobs and you get a privateer\'s kit and a full share written in my hand.'),
    ],
    decline: [L('[calm] Sensible. Half the people who sign wish they had said that. The offer stays open — I do not chase.')],
    debrief1: [
      L('[impressed] Teague had fourteen shares written down as nine. You found it in a day and you left him breathing, which is what I wanted.'),
      L('[calm] Everyone on four decks now knows the tally gets read. That was the actual job.'),
    ],
    debrief2: [
      L('[happily] The Factor paid, apologised, and asked for terms. I gave him terms. I am not a monster, I am a quartermaster.'),
      L('[thoughtful] I have kept this ledger since the first prize. Most people who sign are gone by their fourth job. You are not.'),
    ],
    debrief3: [
      L('[impressed] Ordell\'s fleet took the prize and lost it inside an hour. Beau says you were faster than him. Beau has never said that about anyone.'),
      L('[calm] {they} came home with all his fingers, which for {them} counts as a good week.'),
    ],
    debrief4: [
      L('[sorrowful] Beau is dead. Put that down and sit.'),
      L('[sad] Fourteen years he shot for this fleet and he was insufferable for all of them, and he was exactly as good as he said he was.'),
      L('[flatly] Kessler killed him, took nothing, and let you go on purpose. He wanted the story delivered and he used you to do it.'),
      L('[quietly] Saint-Cloud is on deck. She has a letter from that man for every captain he has hanged. She keeps them in order.'),
    ],
    why: [
      L('[calm] People ask how I square it. I do not. I keep a ledger. The ledger is honest even when the fleet is not.'),
      L('[thoughtful] I have written down four hundred robberies and six murders and every share was correct to the coin.'),
      L('[quietly] That is what I am for. Not the taking — the arithmetic. Somebody has to be trustworthy or the whole thing eats itself.'),
    ],
  },
  beau: {
    after1: [
      L('[playfully] Beau Castell. Best gun in the fleet. You will want to argue with that and you will lose.'),
      L('[impressed] Your first job was a mess and you finished it standing. I have watched better people run.'),
      L('[calm] The jobs with real money on them would put you in the water. I take those. Improve and I will let you carry something.'),
    ],
    after2: [L('[playfully] Two out of two. I have started saying your name on purpose. Enjoy it, it will not happen often.')],
    join3: [L('[calm] I am coming. Not because you need me — because I want the prize and you are slow.')],
    banter: [
      L('[playfully] Left one, then the one behind him. He is reloading and he is proud of it.'),
      L('[impressed] Fine. That was good. I am saying it once.'),
      L('[calm] Do not stand in front of a gun captain. Stand in front of the boy loading for him.'),
    ],
    after3: [
      L('[calm] You did not need covering on that. I did not fire twice and I am not happy about it.'),
      L('[thoughtful] I have shot beside forty people on this fleet. You are the first one I would pick on purpose.'),
    ],
    before4: [
      L('[playfully] Fat merchantman, light escort, no complications. I have said that four times in my life and been wrong twice.'),
      L('[softly] Stay behind me going over the rail, {target}. I have never said that to anybody and I would like it forgotten.'),
    ],
    death: [L('[desperately] Down — {target}, get down, he has already —')],
  },
  vanekessler: {
    appear: [
      L('[calm] Marines, hold. Let the man with the pistol raise it first. I will not have this written down as anything but what it is.'),
    ],
    afterKill: [
      L('[flatly] Admiral August Kessler. A foreign empire pays me to make these waters safe for trade, and that is the whole of my instruction.'),
      L('[calm] I have hanged captains. I did not enjoy any of them and I did not hesitate at any of them either.'),
      L('[thoughtful] That man was the best shot in your fleet and he died covering someone he had known for three weeks. Tell them that part. It is true.'),
      L('[dismissive] Go back to Saint-Cloud, {target}. Tell her the last rope is cut and hanging. She will know what I mean — I have written to her about every one.'),
    ],
    final: [
      L('[calm] Captain Saint-Cloud. Every letter, and you never answered one.'),
      L('[flatly] I am not corrupt, I am not cruel, and I am not wrong. That is what makes this difficult for you and it does not make it any easier for me.'),
      L('[quietly] I will answer every blade that touches me with its own force, so come at me with something that does not touch me. I would rather you learned that now than after.'),
    ],
  },
  saintcloud: {
    first: [
      L('[calm] Meriel Saint-Cloud. I command this fleet. I have never raised my voice on a deck and I have never needed to.'),
      L('[quietly] There is an admiral out there who writes to me. Courteous letters. He has hanged my captains and described each one.'),
      L('[calm] Do Cask\'s five jobs. Then we will talk about the letter he has not sent yet.'),
    ],
    hunt: [
      L('[quietly] He has hanged my captains and written to me about each one, by name, in his own hand. I have them in order in my cabin.'),
      L('[calm] He is not a villain. He is a professional with a fleet and an instruction, which is far worse and much harder to kill.'),
      L('[flatly] He turns steel back on whoever swings it. Shoot him. Shoot him from the back of the deck and do not go near him.'),
    ],
    fight: [
      L('[calm] Keep off his reach. Everything you give him he gives back.'),
      L('[quietly] The marines break if the officer does. Take the officer.'),
    ],
    afterFall: [
      L('[quietly] All those letters. I never answered one and now I never will.'),
      L('[sad] He was the only honest man who ever came for me. I would have liked him on a different sea.'),
    ],
    ending: [
      L('[calm] The Admiralty has lost its admiral and the shallows are ours for a season. That is all anyone ever gets — a season.'),
      L('[quietly] Captain\'s Portion, {target}. Written in Cask\'s hand, which means it is true.'),
    ],
  },
},

// =====================================================================
// THE ADMIRALTY — lawful. Funded, uniformed, and slower than what it hunts.
// =====================================================================
navy: {
  crell: {
    offer: [
      L('[calm] Boatswain Crell. I sign on anyone with two hands and I have signed on worse than you, which is meant kindly.'),
      L('[flatly] The Admiralty is a navy. We treat the sea as a jurisdiction, which the sea does not care about, so we do a lot of paperwork and a lot of shooting.'),
      L('[tired] I have drowned twice. Properly drowned, both times, and they got me back. I mention it because it is the most interesting thing about me.'),
      L('[calm] Sign on, {target}. Rated hand, King\'s pay, and lawful work only — which closes some doors and you should know that before you make your mark.'),
    ],
    tutorial: [
      L('[calm] Your orders come from this room now. Not the town board. Here, from me, in order.'),
      L('[flatly] Five commissions. They get worse. Do not skip and do not volunteer.'),
      L('[tired] Watch the officers work. Half of what they do is not written in any manual you can buy — you learn it by being there when it happens.'),
      L('[calm] Finish the five and you are warranted, with a King\'s uniform and everything you saw along the way.'),
    ],
    decline: [L('[calm] Right you are. The book stays open on the desk and I am always here. I have nowhere else to be and no sea legs left to take me.')],
    debrief1: [
      L('[impressed] Shallows are clear, smugglers are in irons, and Holt says you took orders without arguing. That last part is the rare one.'),
      L('[calm] Nobody drowned. I keep count of that personally.'),
    ],
    debrief2: [
      L('[tired] Ship taken, papers filed. The captain was feeding a village with that cargo and he said so, in front of everyone, and it was all still lawful.'),
      L('[quietly] That is going to happen again. I am telling you now so it is not a surprise the second time.'),
    ],
    debrief3: [
      L('[impressed] Nairn lost the command and Merrow got it. She asked for you by name, which surprised the whole wardroom including me.'),
      L('[calm] {they} filed a report on you three pages long. All of it good, all of it in the passive voice.'),
    ],
    debrief4: [
      L('[sorrowful] Merrow is dead. Sit down, lad. Sit down.'),
      L('[sad] Youngest officer in the fleet and the only one who read the whole standing order before signing it. She wanted a command so badly she never once asked for one.'),
      L('[flatly] Ash complimented her by name while he did it. Witnesses agree on that. He meant it, which is the part I cannot get past.'),
      L('[quietly] The Admiral wants you. Nine engagements, nine losses, and he has read every report twice.'),
    ],
    why: [
      L('[tired] I have drowned twice and signed on again both times. People find that funny and it is not a joke.'),
      L('[quietly] The sea does not care about jurisdiction. We pretend it does, and because we pretend hard enough, cargo moves and people eat.'),
      L('[calm] That is worth two drownings. I have not worked out whether it is worth a third and I would rather not find out.'),
    ],
  },
  fane: {
    after1: [
      L('[formal] Lieutenant Isolde Merrow. Youngest officer in this fleet. I have read the standing orders in full, which puts me in a minority of one.'),
      L('[calm] Your commission was executed correctly and reported accurately. I checked both. I check everything.'),
      L('[flatly] The engagements that matter would kill you at your present rate. I intend to have a command before I am thirty and I cannot take passengers.'),
    ],
    after2: [L('[impressed] Two commissions, no irregularities. I have stopped double-checking your reports, which from me is a decoration.')],
    join3: [L('[formal] I asked for you. The wardroom found that funny. Do not make them right.')],
    banter: [
      L('[formal] Hold your position. The formation is the weapon, not you.'),
      L('[calm] Their gunner reloads on the second round. Take him on the second round.'),
      L('[impressed] Correctly done. Noted for the report.'),
    ],
    after3: [
      L('[calm] You held the line without being told twice. Do you know how rarely that happens? I have the figures.'),
      L('[quietly] For as long as I have worn this coat I have been measured against everyone in this fleet. Nobody has ever simply stood next to me and done the work.'),
    ],
    before4: [
      L('[formal] Routine patrol. Nobody has sighted Ash in the shallows for a month, which is itself a data point I do not like.'),
      L('[quietly] Stay on the rail beside me, {target}. That is not in the standing orders. I am aware.'),
    ],
    death: [L('[desperately] Boarders — {target}, the rail, the rail —')],
  },
  ash: {
    appear: [
      L('[playfully] Good evening. Nobody move quickly and nobody has to be brave about anything.'),
    ],
    afterKill: [
      L('[warmly] Dorian Ash. The Tide-Taker, if you read broadsheets. Nine engagements against this navy and nine of them mine.'),
      L('[calm] That was Lieutenant Isolde Merrow and she was the finest officer in the Admiralty. I knew her name before tonight. I said it while I did it and I meant it.'),
      L('[playfully] I would genuinely rather talk to you than fight you. That is not mercy, it is preference — I find conversation more useful and I am extremely good at it.'),
      L('[calm] Go home, {target}. Tell them exactly what you saw. I would rather have the story out there than another body in the water.'),
    ],
    final: [
      L('[warmly] Admiral. Ten times now. You keep reading the reports and I keep writing them.'),
      L('[playfully] You know what I do and it has never once helped you. That is the charming part, and I do know it is charming.'),
      L('[calm] Board me then. I have taken nine of your ships by being the man they wanted to talk to first.'),
    ],
  },
  vanekessler: {
    first: [
      L('[calm] Admiral August Kessler. A foreign empire pays this fleet to make these waters safe for trade. That is the entire instruction and I have never needed another.'),
      L('[flatly] I have hanged pirate captains. I did not enjoy it. I did not hesitate either, and you should decide now whether you can serve under that.'),
      L('[thoughtful] Crell says you can take an order. Do the five commissions. Then we will discuss the man who has beaten this fleet nine times.'),
    ],
    hunt: [
      L('[calm] Nine engagements, nine losses. I have read every report twice and I know exactly what he does.'),
      L('[flatly] He talks first. He is very good at it, and every officer who listened lost a ship. Do not answer him. Do not answer him even once.'),
      L('[quietly] He will hook you off the back of the deck and into his reach. Stand where being pulled forward does not matter, and shoot.'),
    ],
    fight: [
      L('[calm] Close order. Nothing gets between the lanes.'),
      L('[flatly] Do not listen to him. Shoot him.'),
    ],
    afterFall: [
      L('[quietly] The tenth engagement. Somebody write that down properly.'),
      L('[thoughtful] He was the most likeable man I have ever hunted and he drowned my sailors for cargo. Both of those are true and I have stopped needing them to fit.'),
    ],
    ending: [
      L('[calm] The shallows are open, trade is moving, and a village on the north coast will eat this winter. That is what the instruction meant.'),
      L('[flatly] King\'s Own, {target}. Wear it where people can see it — the uniform does more work than the sword.'),
    ],
  },
},
};

// God-line cutscenes. Each god speaks once in the last room.
ADV.DATA.GOD_LINE_DIALOGUE = {
  pale_mother: [
    L('[quietly] I have been called a great many things and I answer to none of them.'),
    L('[calm] Do you know how many died to make this room? I do. I know every name, and I will know yours.'),
    L('[flatly] You may leave. I will not stop you and I will not follow. Nobody has ever taken it.'),
    L('[quietly] No. Nobody ever does.'),
  ],
  drowned_king: [
    L('[calm] Sit down. You have walked a long way and I have been patient for longer than your city has existed.'),
    L('[flatly] I was a king. Then the water came in through the windows and I found out precisely what that was worth.'),
    L('[quietly] I am not angry. That is the part people never believe. I am simply still here, and everything else went away.'),
    L('[calm] Draw. I would like to see whether the world has learned anything.'),
  ],
  first_bloom: [
    L('[calm] Everything that lives wants to keep living. I am only the part that will not apologize for it.'),
    L('[quietly] They cut the woods back every spring. Every spring the woods come through the walls anyway.'),
    L('[flatly] You may go. I will not chase you. The green will find the place you sleep.'),
    L('[calm] Stay, then. Let me see whether you can kill a thing that refuses to end.'),
  ],
};

ADV.DATA.GOD_LINE_SMITE = {
  pale_mother: [
    L('[flatly] {target}. I have decided you have lived long enough.'),
    L('[quietly] {target}. Your name is already written. I am only finishing the page.'),
  ],
  drowned_king: [
    L('[calm] {target}. The tide does not argue with what it takes.'),
    L('[flatly] {target}. You grew too large for this water. I am correcting that.'),
  ],
  first_bloom: [
    L('[calm] {target}. That much life is a wound. I will close it.'),
    L('[quietly] {target}. You have taken more than a body should hold. Give it back.'),
  ],
};

ADV.DATA.GOD_LINE_HATRED = {
  pale_mother: [
    L('[flatly] I already have your name. The rest is housekeeping.'),
    L('[quietly] You are not the first to come down here armed. You will not be the last I keep.'),
  ],
  drowned_king: [
    L('[calm] The water does not hate the stone. It simply outlasts it.'),
    L('[flatly] Your city taught you order. I am what is left when that lesson drowns.'),
  ],
  first_bloom: [
    L('[calm] I will grow through your ribs if I must. That is still a kindness.'),
    L('[quietly] Put the steel down. Living is the only argument I respect, and you are wasting yours.'),
  ],
};

ADV.DATA.FACTION_WAR_DIALOGUE = {
  bell: {
    who: 'jiro',
    open: [
      L('[quietly] The Bell does not hold streets. We hold names. Yours just went on the paper.'),
      L('[flatly] The city hired a knife. We have hired worse. Come and be written down.'),
    ],
    boss: [
      L('[quietly] Two of ours. That is what they paid you for. Take them if you can still see.'),
      L('[flatly] The Bell forgets no contract. Remember that when you sleep.'),
    ],
  },
  green: {
    who: 'kira',
    open: [
      L('[calm] The Green-Eyed keep the law you were paid to break. That is the whole of it.'),
      L('[flatly] Honour is a blade. You will meet two of them before this writ is done.'),
    ],
    boss: [
      L('[calm] Instructor and captain. If you walk over them, the clan will still be the clan.'),
      L('[flatly] Law does not end because a bounty was posted.'),
    ],
  },
  tally: {
    who: 'vanekessler',
    open: [
      L('[calm] The Tally is a ledger. Your name is a line item now, and lines get collected.'),
      L('[flatly] Cargo, coin, and the two men who count it. That is the patrol. Keep up.'),
    ],
    boss: [
      L('[calm] Bosun and captain. Cut the page if you like. The book has copies.'),
      L('[flatly] We drown people for less than this writ. I am being polite.'),
    ],
  },
  navy: {
    who: 'ash',
    open: [
      L('[calm] The Admiralty closed the channel because it could. You are here because someone could not live with that.'),
      L('[flatly] Uniforms, guns, and two officers who think the sea is a courtroom. Run them.'),
    ],
    boss: [
      L('[calm] A mate and a commander. The blockade does not care about your reasons.'),
      L('[flatly] I have taken cargo through worse. Draw, and we will see if you have.'),
    ],
  },
};

// Spoken form: {target} dropped; third-person tokens read as the rival's
// pronouns. The text box carries the names; the audio never does.
ADV.DATA.campaign2VoiceText = function (fid, who, line) {
  if (line.v) return line.v;
  const f = ADV.DATA.FACTIONS[fid];
  const rival = ADV.DATA.CAMPAIGN_CHARS[f.rival];
  const self = who === f.rival;
  const P = self ? ['they', 'them', 'their'] : rival.sex === 'f' ? ['she', 'her', 'her'] : ['he', 'him', 'his'];
  return line.t.replace(/,\s*\{target\}/g, '').replace(/\{target\}[.!?]\s*/g, '').replace(/\{target\},?\s*/g, '')
    .replace(/\{they\}/g, P[0]).replace(/\{them\}/g, P[1]).replace(/\{their\}/g, P[2])
    .replace(/\s+([,.!?])/g, '$1').replace(/^\s+/, '');
};
})();
