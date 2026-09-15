# Delphine and the return to Lanternhold

Local script revision, 14 September 2026. Recording and publishing are pending. No voice credits were used for this revision.

## Problems addressed

- Delphine is a family friend, never a romance option. Her offer, acceptance, rejection and romantic ending are removed. A separate friendly line plays only when she is recruited, alive, non-hostile, and the player did not flood the mine early. Existing saves lose only her retired romantic state and cached romantic ending paragraphs; campaign progress and friendship remain.
- Adebayo's tower briefing said the Consortium leaders never left their offices, immediately before the party learned they had left for Lanternhold.
- The summit had no clear purpose or reason to take place in the keep's library. The revised explanation establishes a hearing over the iron shortage, using shipping records held by the keepers and trusted by both kingdoms. This archival role is a clarification added by this revision.
- Following Adigun appeared to abandon the hunt for Kolade. Adebayo now explains that his officers will continue searching the city while the party questions Adigun.

The murder, false accusation, imprisonment, letter and escape already occur in quest 10. Their location and branch logic are unchanged. If the player spares the leaders, Sanni and his retainers kill them; if the player kills them, the second murder does not play. The accusation and arrest follow either outcome. The reading-room caption now places the confrontation before the hearing, explaining why the three partners are together without the hearing's other participants.

## Exact replacement recordings

Four existing Lanternhold segments need replacement, using their existing casting IDs and clip numbers. Delphine has one new family line with a new clip key, so her old romantic audio cannot play over it. The five retired Delphine romance recordings are no longer referenced by active dialogue.

### Delphine: `selene/q9_family_1` (new, unvoiced)

> [warm] You're family, honey. You don't have to face this alone. Get some rest. We leave for Lanternhold in the morning.

### Adebayo: `halvard/q9_plan_1`

> [precise] The Consortium is hiring swords. Go in as hired guards and search the top-floor offices. We need the orders bearing Adigun's seal.

### Sanni: `sarn/q9_tower_2`

> [low] Adigun Adeyinka is my father. Those orders from the mine carry his seal. He and his partners have gone to Lanternhold for a hearing over the iron shortage. He means to persuade the keepers that Calder is to blame.

Sanni's following claim that Adigun wants war remains his deliberate deception. Later scenes distinguish Adigun's commercial scheme from Kolade's war plan.

### Adebayo: `halvard/q9_book_1`

> [grave] The keepers hold shipping records both kingdoms trust. They are hearing the dispute over the iron shortage. Take Adigun's orders to Lanternhold and show them who caused it.

### Adebayo: `halvard/q9_book_2`

> [quiet] I will have my officers keep looking for Kolade here. His father may know where he is. Question Adigun, and bring him back alive if you can. This book will pay your way into the keep.

## Unvoiced presentation changes

Quest 10 briefing:

> The keepers are hearing the dispute over poisoned iron. Take the Consortium's orders to Lanternhold, confront Adigun and his partners, and find out where Kolade has gone.

Reading-room caption:

> Before the hearing, you find the three Consortium partners in the great reading room. Maps and shipping records cover their table.

## Release status

The four existing Lanternhold MP3 files still contain the previous wording; Delphine's family line is unvoiced. No audio files or playback hashes were changed. Record and verify these five segments before publishing. The ten previously identified unvoiced quest 6/7 segments are a separate outstanding recording batch.

The local implementation also routes dynamic choices before dialogue playback. Quest 9 and quest 13 no longer have a default companion who confesses before eligibility is checked. Old queued Delphine offers and replies are suppressed. The existing campaign romance system still needs the courtship and refusal improvements described in `GATE_ROMANCE_AUDIT_2026-09-14.md`.
