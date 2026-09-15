# Varenholm Gate courtship fixes

Implemented locally on 14 September 2026. Not published or pushed.

## Player-facing changes

- **Varenholm's Gate → Talk at the inn** opens a private companion picker. Choosing a companion does not start a confession.
- Santiago, Itsuki, Layla and Kaito each have two new optional personal conversations, with distinct subjects and friendly responses. Leaving a conversation before answering does not count as completing it.
- The conversations must happen after different completed campaign quests. Reopening menus or retrying a failed quest cannot accelerate courtship. After the campaign ends, another ordinary adventure supplies the next occasion.
- Friendly conversation builds familiarity and a little approval. It does **not** mean romantic interest. An explicitly labeled interest choice becomes available after both conversations, provided approval is at least 3.
- After expressing interest, return on another occasion and choose **Could we talk about us?** Only that companion speaks. Acceptance begins the relationship; “need more time” and “remain friends” save distinct states. They never trigger another invitation automatically. Only a later player-initiated choice can reopen the subject.
- All private menus have a leave/back option. Benched living companions are available at the inn. Dead, departed or hostile companions are unavailable; conversations cannot run during an active quest.
- Accepted campaign relationships still use the existing one-partner rule. Availability remains the same for either player gender. World spouses, multiple-spouse rules and the world's separate orientation checks are unchanged.
- Existing saves retain accepted relationships with the four active routes and Amara. Their prior approval does not invent past courtship. Delphine's retired romance is cleared while preserving her friendship, recruitment and other progress. Obsolete queued confessions are silent.

## Writing changes

| Companion | Personal development | Later romantic invitation |
|---|---|---|
| Santiago | Fear in real battle; his mother's bakery and the home he misses. | A nervous, explicit invitation to supper. Acceptance agrees to an evening, without lifelong promises. |
| Itsuki | Uncertainty about life beyond the hunt; his former work guiding travellers. | Acknowledges that he still misses his wife, then plainly says he cares for the player. His reply agrees to take time. No obsolete warning about entering the city. |
| Layla | Her freedom to choose whom she serves; the shrine and private life she misses. | A direct invitation to spend time alone. Her refusal reply promises not to ask again, backed by saved state. Her sharp personality elsewhere remains intact. |
| Kaito | His fear while trapped; music and the inns where he played for supper. | Clearly asks for an evening together. Playfulness remains; acceptance no longer assumes years of commitment. |
| Delphine | Family friend only. | No romance, including after Beau's death. Her separate family reassurance now has a recording. |
| Amara | Trust and accountability during the campaign. | Her immediate recruitment romance is retired. A future new romance needs a separate post-campaign story resolving her relationship with Kolade; that story has not been invented here. Previously accepted saves are preserved. |

Amara now acknowledges Kolade's lies and harm rather than claiming he has never lied. Her Q13 arrival thanks the player for keeping their word and allowing her to help. Romantic epilogues describe concrete shared activities without assuming an inappropriate throne outcome. Exact old cached romance paragraphs are replaced on load; unrelated paragraphs remain intact.

The earlier Q6/Q7 plain-speech edits and four Lanternhold plot-clarity changes are retained. The generated **VARENHOLMS_GATE_VOICE_SCRIPT.md** contains the current complete dialogue, personal conversations, player choices, conditions and casting appendix. Player responses remain unvoiced.

## Recordings and budget

- 57 new/replacement recordings installed, each using its existing character voice ID, verified against both casting and audition records.
- Conservative estimate: **5,298 credits**. Individual recording receipts total **2,911 credits**. A subsequent account check confirms that total and **118,089 credits remaining**.
- No duplicate paid requests: completed clips were reused by hash after an account-read rate limit. Only read-only metadata calls retry automatically.
- All 57 files decode successfully and pass duration and signal checks. Source text, voice ID, audio hash and cache hash are verified before installation. Replaced originals are backed up under `archive/dialogue/2026-09-14-gate-courtship`.
- Mzee Kamau's five lines intentionally remain unvoiced at the user's request. Their text stays in the campaign. No voice was created and no credits were spent on Mzee; recording is deferred until the user requests it again. All romance recordings are installed.
- Recording scope and receipts: `tools/gate_courtship/patch.json`, `recording.json`, `validation.json`.

## Verification

- Three complete campaign paths: **161 checks passed**, with the test player deliberately pursuing courtship through the new APIs.
- Dialogue/reference validator, family migration regression, and courtship regression pass. Courtship scenarios cover all four routes, both player sexes, distinct occasions, friendly responses, refusal, deferral, reopening, saves, absence/death, post-campaign progress, and selected-speaker playback.
- Original audit reproduction now finds **0 of 10** romances triggered by quest approval alone, and no unsolicited Itsuki confessions from old arrival wrappers. Before/after evidence is retained separately.
- Conspiracy flow regression passes: branching confrontation, staged murder, custody, escape and reveal are preserved.
- Isolated Chromium browser tests pass at **1280×760** and **844×390** with mobile/touch emulation: opening the inn picker, approaching Itsuki, night inn art/weather, actual dialogue/audio requests, choosing friendship, and saving that response. No page errors or failed asset requests. These are emulated browsers, not a physical iPhone test.
- Browser screenshots and evidence: `test/reports/gate-courtship/`.

Full regression: **68 of 69 suites passed**. The sole failure is voice coverage for the five Mzee lines above, which the user has approved leaving unvoiced for now (4,738 other clips are present). The complete result is recorded in `test/reports/headless/results.json`. Publishing remains a separate action; no website files have been deployed by this work.
