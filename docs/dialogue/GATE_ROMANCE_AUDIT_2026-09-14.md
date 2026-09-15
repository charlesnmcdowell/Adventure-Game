# Varenholm Gate romance audit

Implementation follow-up: the approved fixes are now recorded in [GATE_COURTSHIP_CHANGES_2026-09-14.md](GATE_COURTSHIP_CHANGES_2026-09-14.md). The findings below preserve the pre-fix audit for comparison.

14 September 2026. Scope: all six authored campaign romance routes, their introductions, approval gains, offers, responses, endings, save state and cutscene playback. Delphine's removal is implemented locally. Recommendations for the other five characters are proposals; their dialogue and courtship requirements have not been rewritten by this audit. No recordings were generated and nothing was published.

## Assessment

The main problem is that approval is being used as evidence of romantic interest. None of the five remaining routes requires flirting, personal conversations, time spent together, or an explicit decision to pursue that companion. Their confessions therefore describe relationships the player may never have developed. Rewording the offers without changing their prerequisites would preserve the underlying problem.

The ordinary world relationship system and campaign relationships are separate. The campaign checks neither player gender nor existing world partners. Its current options are the same for male and female protagonists. The world system, by contrast, currently rejects same-sex pairings in `Rel.canRomance`. This is a design inconsistency to resolve explicitly, not grounds to silently assign preferences to the campaign cast. The game's existing permission for multiple spouses also means a blanket ban on married protagonists would be an inappropriate assumption.

## Findings and priorities

| Priority | Finding | Evidence and consequence | Recommended correction |
|---|---|---|---|
| High | Ordinary quest decisions unlock every romance | `C3.dynamicOptions` requires only a living recruited romanceable companion, approval of at least 3, any character-specific condition, and no existing campaign romance. Ten isolated scenarios, covering both player sexes and all five remaining routes, qualified without courtship. | Track friendship and romantic interest separately. Require player-initiated interest and meaningful personal conversations on separate occasions. |
| High | Multiple companions confess before the player can choose whom to approach | `UI3.dynamicChoice` plays every eligible offer sequentially, then presents one acceptance menu. | Let the player choose a private conversation first. Unselected companions should not confess or require rejection. |
| High | Refusal is not remembered | The sole decline is “Not now. Not with the city ahead of us.” It plays rejection replies without saving a refusal. Itsuki confessed in both Q9 and Q13 in the reproduction. | Distinguish “Not now” from “I only want friendship.” Record both, prevent repeated offers, and allow only the player to reopen a rejected courtship. |
| High | Amara's existing relationship has no resolution before a new romance | Q11: “I love Kolade Adeyinka.” Q13 recruitment gives enough approval for an immediate confession to the protagonist. Her ending still centers on visiting Kolade. | Keep the main-campaign relationship about trust and accountability. Defer any romance until after her relationship with Kolade is resolved and the player deliberately pursues her. |
| Medium | Itsuki's timing is wrong | Both his offer and acceptance refer to entering/surviving “the city,” but the first offer is after the tower investigation. The same wording can recur after Q13. | Use wording that does not depend on an obsolete destination. |
| Medium | Shared writing patterns make different personalities sound alike | Indirect declarations, “I am not asking … I am telling,” repeated claims about what a line “means,” and elaborate endings obscure simple requests. | State the desire directly. Preserve individual temperament through what each person wants and how readily they admit it. |
| Medium | Endings overstate or obscure relationships | Itsuki's tree explanation and “mine” callback are indirect; Layla's chair imagery assumes a particular outcome; Amara's romance ending still reads as devotion to Kolade. | Describe a concrete shared activity or decision. Gate outcome-specific details to the relevant ending. |

## Route-by-route review

### Delphine — removed, family friend only

She is Tesfaye's longtime friend and Beau's wife. His death should not unlock a romance with the ward she promised to protect. No exact numerical age is specified, but her established family role is clear.

Implemented locally:

- Removed her romance eligibility, offer, acceptance, rejection and romantic ending.
- Added a separate family reassurance, gated on recruitment, survival, non-negative approval, and the player not having flooded the mine early.
- Cleared her retired romance state and romantic ending paragraphs in existing saves while preserving friendship, recruitment, money and campaign progress.
- Blocked stale acceptance options and queued romantic dialogue.

New family line, one unvoiced segment:

> [warm] You're family, honey. You don't have to face this alone. Get some rest. We leave for Lanternhold in the morning.

### Santiago — preserve his earnestness, reduce the intensity

**Current qualification:** recruiting him (+1), agreeing to Emeka's jobs (+1), and agreeing to help the Duke (+1). The latter two decisions are public duties, not personal attention.

The nervous delivery fits him. “I have written this out four times and burned it three” and “I am not the sort who looks” make the admission harder to understand. His acceptance promises to be “very good at this,” which feels like a sudden commitment after the player has only said yes.

**Better development:** an optional conversation about his first real battle; later, a player-initiated invitation to spend time together. Helping the city should improve his respect without starting courtship.

**Sample offer after that development:**

> [nervous] I enjoy the time we spend together. More than I know how to say properly.
>
> [earnest] When we have a quiet evening, may I take you to supper? Just the two of us.

An acceptance should agree to the evening, without promising a lifelong relationship. His existing respectful rejection can largely remain.

### Itsuki — grief and gratitude need room to remain platonic

**Current qualification:** recruiting him (+2) and allowing his shot at Gorruk (+2). Alternatively, recruiting him and asking his wife's name already reaches 3. Neither path establishes romance.

His quiet manner and grief are appropriate. The confession jumps from mourning his wife to loving the protagonist without intermediate scenes. “I would, though. With you” also depends on the player decoding what “this” means. The city references are outdated.

**Better development:** an optional conversation about life after his hunt, with a supportive friendship response and a separately labeled romantic response. A later conversation should confirm mutual interest. Asking about his dead wife must not itself count as flirting.

**Sample offer only after mutual interest:**

> [low] I still miss my wife. I always will.
>
> [quiet] But I have come to care for you too. If you feel the same, I would like us to be together.

**Sample acceptance:**

> [quiet] Then we will take our time. I am glad you told me.

Without that courtship, his response should remain gratitude and loyalty. It must not set a romance flag.

### Layla — keep her sharpness, clarify desire and respect a refusal

**Current qualification:** defending her (+2) and making a deal with Folake (+1). This establishes an alliance and compatible tactics, not romantic interest.

Her offer describes standing beside the protagonist's throne. That is as easily a political arrangement as romance, and it does not fit a player who rejects the throne. “If you do [regret it], I will mend that” is ambiguous; “the offer keeps” contradicts a clear rejection if the system then repeats her approach.

**Better development:** let her test whether the player respects her autonomy, then give the player an explicit opportunity to reciprocate her interest. She can remain proud, blunt and sexually direct without treating refusal as temporary consent.

**Sample offer:**

> [dry] I enjoy your company when you stop trying to give me orders.
>
> [direct] I would like some time alone with you. Interested?

**Sample refusal response:**

> [cool] Very well. I will not ask again.

That promise needs an actual persistent refusal flag. Her harsh language and personality elsewhere should remain intact.

### Kaito — flirting fits him; commitment needs an explicit invitation

**Current qualification:** rescuing him (+1), using him to distract the doorman (+1), and asking the Duke for payment (+1). This is gratitude, usefulness and shared mercenary values.

His playful manner makes light flirting less surprising than the other offers. The problem is the sudden escalation: “I have not meant a word of it since the web. I mean this one” never names what he is offering. “Written down. Framed” and being insufferable “for years” overstate a single acceptance.

**Better development:** offer an unmistakable opportunity to flirt back, followed by a later private conversation where he drops the performance. Friendly banter must remain available without opting into romance.

**Sample offer after reciprocated flirting:**

> [smiling] I like you. I'd like to spend an evening with you, without the rest of this lot.

His reply can be pleased and playful without assuming years of commitment. The existing “Friends, then” rejection is worth retaining, with a persistent friendship-only state behind it.

### Amara — defer romance beyond the current campaign

**Current qualification:** promising to spare Kolade (+3), then inviting her into the company (+2). She can confess on the same quest she joins.

Her emotional conflict is valuable story material. An immediate romance makes the protagonist appear to replace Kolade because they agreed not to kill him. The plant/window metaphor is another example of the strained language the user has flagged.

A related continuity problem appears in `q11_loved_tesfaye`: “Kolade has never lied to anyone in his life.” That conflicts with the Sanni deception and his manipulation of the Consortium. If this is intended as Amara's denial, the scene needs to challenge it; as written it reads like an accidental contradiction.

**Recommendation:** retain her recruitment and moral conflict, but make her campaign response gratitude for keeping the promise. Any post-campaign romance requires a separate decision about her relationship with Kolade and deliberate interest from the player. Do not turn saving her lover into a courtship action.

**Possible nonromantic Q13 line:**

> [quiet] You kept your word. Thank you for letting me help.

## Recommended relationship flow

1. Ordinary helpful decisions build approval and trust only.
2. At the inn or another appropriate pause, the player may choose a personal conversation. Every conversation retains a clear friendship option.
3. Romantic interest is an explicit player choice. It is not inferred from kindness, agreement, rescue, or a question about bereavement.
4. Require at least two meaningful personal interactions on different occasions before an intimate declaration. A repeated scene or retry cannot count as new development.
5. The player chooses whom to approach privately. Only that companion's scene plays.
6. Distinguish friendship, deferred interest, courtship, and an established relationship. Record refusals and prevent repeated unsolicited offers.
7. Old saves keep approval, but must not retroactively invent courtship from that score. Preserve valid existing romances while stopping new automatic confessions.
8. Define gender/preference and existing-partner behavior explicitly, in keeping with the intended game relationship rules. Those choices remain design decisions, not assumptions made by this audit.

## Voice scope

Trigger, refusal, scene-selection and save changes do not themselves require new recordings. Most recruitment dialogue and several respectful refusal responses can be kept. Budget new personal-conversation lines separately from surgical corrections to offers and acceptances. Keep the existing voice IDs for every character.

No bulk regeneration is recommended. The samples above are proposed wording, not installed voice scripts. Delphine's single new family line is pending recording. Four earlier Lanternhold revisions also need replacement recordings; the ten unvoiced Q6/Q7 segments remain outstanding. Retired Delphine MP3s have not been deleted or reused for different text.

## Verification and limits

- Full existing campaign playthrough regression: **161 passed**, covering three complete story paths and other-campaign dispatch.
- Campaign dialogue/reference validation after the Delphine change: **4,645 checks passed**.
- New family regression covers male/female protagonists, Beau alive/dead, high and negative approval, absence, death, existing saves, cached epilogues, stale queued dialogue, stale choices and the actual playback functions with drawing/audio outputs replaced by test doubles.
- Both Q9 and Q13 dynamic wrappers now dispatch before dialogue playback. This fixes the default-speaker confession and duplication, including old saved wrappers. It does not implement the proposed courtship system.
- An isolated Chromium browser at 1280×760 also verified the old Delphine wrapper finishes without a confession and the new family line displays in the actual night scene outside the Nine Lanterns. No browser script errors occurred. Audio calls were observed without playing a recording, because the family line remains unvoiced.
- `tools/audit_gate_romances.js` reproduced all five remaining romances without courtship for both player sexes: **10 of 10 scenarios**. It also reproduced Itsuki confessing again after a Q9 refusal at Q13.
- The evidence is `GATE_ROMANCE_AUDIT_2026-09-14.json`. These are isolated state and playback scenarios, not a claim that every possible campaign branch was manually played.
- Other characters' offers, acceptance/rejection wording and romantic endings remain unchanged for review. No voice credits were spent, and no deployment occurred.
