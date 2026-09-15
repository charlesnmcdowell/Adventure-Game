# Varenholm Gate finale — local implementation

The user approved the sacrifice/realm-battle route, the resurrection-versus-ascension decision, additional Kolade dialogue, and the childhood truth that Tesfaye believed Kolade was dead. This supersedes the earlier proposal to retain a wholly mortal final duel.

## Story and play changes

- Q10: Dawit explains that Tesfaye began the letter years earlier and updated it before leaving. A new passage establishes Hiwot as another of Morrak's children and explains the danger of a soul bound to an altar. Players already beyond Q10 receive the essential explanation from Kolade in Q14.
- Q14: the angry player response explicitly addresses Tesfaye's murder. Kolade accepts responsibility. Optional questions cover the temple raid, mistaken death report, Baba's records, the first divine murder, Adigun's profiteering versus Kolade's war, and the staged arrest. Questions are grouped into menus of at most four options, with exits.
- The failed war matters: Kolade loses the army and the intended mass sacrifice. Hiwot's soul can force entry into Morrak's realm, but does not instantly complete his ascension. The player reaches him before the binding is complete.
- Up to three callbacks use resolved history: Amara, Folake, Grukhar, the grove, the flooded mine/prisoners and Segun. More than one avoidable killing can provoke an accusation; demonstrated mercy gets recognition. The player may reject his comparison or acknowledge regret. Private intentions are not treated as things Kolade knows.
- Druids withdraw in the existing combat system. They are never described as killed simply because the player fought them. Amara's death is now committed only after her actual combat defeat, not when selecting the hostile option. A subsequent bypass records that she survived.
- Hiwot can be present, waiting at the inn, absent, or already dead. Each path accounts for her whereabouts. The soul-binding transition happens once. A benched/absent Hiwot is explicitly brought through the servants' passage by Kolade's guards. An already dead Hiwot's bound soul replaces a second death scene.
- The mortal altar fight is followed by a fourth encounter in Morrak's realm. The new phase retains Kolade's identity and portrait, uses offensive fire/melee skills, removes Bulwark and the defensive active rotation, and has 75% of his corresponding base-phase HP. It does not add healing or regeneration. Normal campaign/difficulty tuning still applies.
- Hiwot cannot fight on the player's side while her soul is bound. Losing the realm encounter returns the player to a checkpoint at that encounter; the sacrifice does not repeat. A victory interrupted before the final decision resumes that decision on retry.
- The final choice clearly states its cost: release the divine power and restore Hiwot, or retain it and claim Morrak's throne while Hiwot cannot return. Both remain playable campaign endings. Learned skills, awarded campaign perks and normal world play remain available; the story's divine essence is not an extra hidden combat stat system.
- Epilogues match the new outcomes. Amara does not visit an imprisoned Kolade after his death. Relevant established companion relationships remain intact. Existing completed legacy endings are preserved.

## Assets and playback

- Added `assets/anime/gate/v1/runtime/environment_morrak_realm.webp` (1774 × 887), generated against the existing temple style. It is registered for the fourth battle and soul/decision scenes. Authored blue fire, mist and glow overlays animate independently of the painting.
- 61 voice clips recorded with the existing IDs: Kolade `CmD1sSN0Gj3pJq3OxRyg`, Hiwot `0F4ybvRD5Lm0AIt5almW`, Tesfaye `EFtnObJs7ex53VSB3niw`, Dawit `jDMhBWlFSleqsyqVHw2R`.
- Estimated upper budget: 7,724 character credits. Generation receipts total **4,246 credits**. A subsequent read-only subscription check confirmed **113,843 remaining**, exactly 4,246 below the starting balance of 118,089. The service's immediate counters lagged; those original receipts and the later budget check are retained. No uncertain paid requests were retried.
- Clips were checked against casting and exact current text, decoded, checked for audible signal/duration, installed, and added to the cache manifest. Only the replaced Dawit clip needed archival backup. Old Q14 clips remain available for already-queued legacy endings.
- Mzee Kamau's five deliberately unvoiced lines remain untouched.

## Opening movie: prepared, rendering blocked

The Runway plugin is installed and authenticated to the personal `charles` workspace. Its Free plan exposes no video models. The plan/credits card has been shown. No Runway generation has been submitted and no plan has been purchased.

The native video player is wired ahead of Q1's chapter card and dialogue, but its source remains `null` until a completed movie is inspected and installed. It does not request a nonexistent file in the shipped game. It contains a tap-to-play gesture, inline playback, safe-area padding, a continue/escape control, background pause, scene-shutdown cleanup, and suppression/restoration of game audio so only the movie's mix plays. A failed or skipped movie does not mark the movie completed. The finished movie must use the approved continuous full-body animation format, not illustrated stills.

See `GATE_ROOFTOP_MOVIE_SHOT_PLAN_2026-09-15.md` for the production plan. The dramatic movie score is still pending with the render. Existing temple/boss/ending music continues to support the implemented game finale.

## Verification and publication

The test reports in `test/reports/gate-finale/` and `test/reports/headless/` are the detailed evidence. Three real-combat, fourteen-quest story routes passed all 161 assertions after updating their ending expectations. Dialogue validation passes 5,331 checks. Focused finale checks cover both endings, four Hiwot states, checkpoint/reload/migration, actual deaths versus retreats and bypasses, and submenu wiring. Existing campaign-family, courtship, conspiracy, rescue/roster, party-isolation, music recovery and late-voice asset checks have been run. Chromium and WebKit both passed the real realm scene, animation, voice, four-option menu, battlefield restoration and missing-movie escape at 1280×760 and 844×390. These are browser tests, not physical-device tests.

Two old test expectations already fail on HEAD, confirmed using a read-only load of the committed runtime. `gate_mercy` expects Normal Q1 to retain Easy's damage reduction despite the separately committed difficulty revision. `campaign3_perks` expects a 15-point flee bonus in a solo fixture where fleeing is already guaranteed. These are recorded separately from story behavior; this patch does not roll back those existing rules.

These are local changes. No commit, push or publication has been performed for this update.
