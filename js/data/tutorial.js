// Tutorial & onboarding (§12). Five pre-game cards + fire-once contextual
// prompts. Every line is one sentence; everything lands in the Codex.
(function () {
'use strict';
globalThis.ADV = globalThis.ADV || {};
ADV.DATA = ADV.DATA || {};

ADV.DATA.PREGAME_CARDS = [
  'There are no classes — your skills are your build.',
  'Your stats never change; only your skills grow.',
  'You learn skills at the trainer, and seeing one used in battle makes it free.',
  'You can only carry so many, so learning something new means letting something go.',
  'Death is permanent, but your skills follow you into your next life.',
];

// id -> one-sentence line. Fired once on first occurrence, dismissible, kept in Codex.
ADV.DATA.PROMPTS = {
  firstWitness:        'You saw something new — the trainer will teach it to you for free.',
  firstAdvWitness:     "You can't learn that yet, but you can learn what it grew from.",
  firstSkillLevel:     'Skills get stronger with use, and change form entirely at high levels.',
  firstCarriedDamage:  'You only heal when you return to town.',
  firstNonCombat:      'Not every encounter has to be a fight.',
  firstPartyQuest:     'You control only yourself — the others decide for themselves.',
  firstSkillAuto:      'Turn AUTO on as many skills as you want. Combat walks them in order, weakest target each time.',
  firstHome:           'A roof of your own changes the town behind the menus, and a brick house, a mansion, or a castle will hold two, three, or five spouses without anyone being left.',
  firstIntentIcon:     'Their portraits show what they plan to do before you act.',
  firstAffordableSet:  'A full set makes all your matching skills stronger.',
  firstFactionShift:   'The quests you accept decide who trusts you.',
  firstDeparture:      "Anything you carry is lost if you die — leave what you can't replace.",
  firstWeightLimit:    'Gold weighs something; your payouts go to the vault by default.',
  firstTheft:          "They can only take what you're carrying, never what you're wearing.",
  firstAmbush:         "You can't hide a whole party — but you can strike first, twice.",
  firstFlee:           "Running takes your turn, and it doesn't always work.",
  firstRoster:         "Everyone here is questing while you are, and some of them won't survive it.",
  firstDanger:         'Someone you know is in trouble, and this offer expires.',
  firstDivineInvite:   "They can't take normal work — join one in three and that's enough.",
  firstForbiddenSeen:  "Whoever used that is making enemies who don't exist yet.",
  firstDivineCalled:   'Too many people want them dead, and the world has chosen a champion.',
  firstHeroDefeated:   'Three quests of quiet, then someone twice as strong.',
  firstSpare:          'You keep everything they gave you, and now they come for you too.',
  firstDivineEx:       "Finish it and you're still a hero. Walk away and you're not.",
  firstRescue:         'Taking a side makes their enemy your enemy.',
  firstRomanceOption:  'A family is the only way to keep this world after you die.',
  familyRomance:       'Court someone to Friendly and propose — a partner shares your vault and quests at your side.',
  familyMarriage:      'Marriage always brings children, and it is the mother who names each child at birth.',
  familyNepotism:      "A child carries their father's strength as a growing title, and if you die with an heir you continue the game as them — skills and all.",
  firstPregnancy:      'Every relationship gives you a child — there is no avoiding it.',
  firstWithdrawal:     'You may draw your share once per stay. Quest together and they grant more; drift apart and they grant less.',
  firstJilting:        "Check what he can afford before you leave him — he'll come for you at your weakest.",
  firstJilted:         'You can hate them for this, or you can let it go — only you get that choice.',
  firstReconciliation: "Taking them back means they leave someone, and that someone won't forget.",
  firstChildbirth:     'Every trip out now costs you tuition or a stay at home.',
  firstStayHome:       "The world keeps moving while you don't.",
  childSelfSufficient: 'Your child can look after themselves now — go freely.',
  firstHatred:         'Someone hates you now, and they may come for you at the end of a quest.',
  firstProposalReceived: 'Someone wants you. Men ask after riding with you twice; women ask the five richest men in town. A no costs three quests of their regard, not their friendship.',
  firstCampaign:       'A faction has you now. Five contracts in the hall — their skills can only be learned by watching them used, and your title makes their kind of skill level faster.',
  firstCampaignExit:   'They walked off, not down. Campaign companions never die in your fights — they come back for the next encounter.',
  firstTitle:          'Your standing rose. The faction\'s skills level faster still; at the top, they manifest a whole tier above their level.',
  firstBlockedHire:    "People who hate you won't take your gold.",
  firstAssassination:  'Whoever loses this fight is gone for good.',
  firstAvenger:        'They have every skill you have, and more besides.',
  firstDeathReincarnation: 'Generations have passed; your skills remain, but everyone you knew is gone.',
  firstDeathNepotism:  'You play as your child now, and everyone your parent knew is still out there.',
  firstHunger:         'You came back Hungry — a quarter of your strength is gone, and four nights without a meal will kill you.',
  firstShelterWarning: 'Two more nights on this roof and you will be Sick; Sick stacks with Hungry, and a spouse will not stay.',
  firstSickness:       'You slept rough too long — you are Sick, and anyone who married you has left.',
  firstSicknessJilt:   'They left because you could not house them; you may hate them for it, or you may not.',
  firstInsuranceOffer: 'Fifty gold now, five hundred to the survivor if you or your spouse dies, and the policy burns when it pays.',
  firstMealCure:       'One meal and the hunger is gone — it does not linger.',
};
})();
