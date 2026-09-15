# Adventurer architecture and maintenance contracts

Updated 2026-09-14. The game remains a static Phaser application: `index.html` is the runtime entry point, without a bundler. `test/harness.js` loads the same data and core scripts in the same order. A missing script or order mismatch must fail verification.

## Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| `js/data/` | Authored rules, dialogue, manifests and content IDs | Live scene objects or mutable game sessions |
| `js/core/` | Characters, world, relationships, quest rules, combat and persistence | Phaser textures, DOM controls or paid media generation |
| `js/ui/` | Scenes, input, artwork, sound and rendering rule events | Applying combat damage a second time |
| `SaveStore` | Committed serialized snapshots | Phaser state or decoded assets |
| `Game` | The player's live session and resolution sequence | Persistent rendering caches |
| `CampaignRoutes` | Dispatch to the selected campaign provider | Capturing/replacing another campaign's implementation |

The documentation-only typedefs in `js/core/contracts.js` describe saved characters, Gate progress, quest attempts, dialogue beats, combat units/events and campaign providers. Optional legacy fields remain compatible with existing saves.

## Saves and identity

`Save` captures world, characters, relationships, vaults, meta and world RNG as one payload. `SaveStore` writes the inactive `adv:slot:0` or `adv:slot:1`, verifies it, then atomically updates `adv:commit`. The commit record names exact revisions of the current and previous snapshots. Readers never select an uncommitted slot just because its revision is newer.

If the current slot is corrupt, the reader may use the previous referenced revision. Once a journal exists, it never silently resurrects an old legacy life. Current-art legacy saves migrate on the next successful save; legacy keys are removed only after commit. The original approved art-version migration remains in place. There is no new art-version wipe in this refactor.

Save methods return a result (`ok`, optional error/detail). UI subscribers offer retry and a downloadable backup for failed writes. Downloads can capture unsaved live progress. An unreadable journal can be exported as raw recovery data. Normal exported snapshots can be imported after validation and explicit replacement confirmation; raw corrupt recovery dumps are for diagnosis, not normal import. A successful import reloads the page before old in-memory state can autosave over it.

`Save.bind(game, memoryBackend)` isolates previews without replacing the production save methods. Ordinary play uses its existing browser origin/localStorage. Hosting the game in a different origin or replacing the public iframe remains a separate migration decision.

On hydration, reserve character and vault ID counters from saved data, including nested character references. Use `World.addCharacter` for roster insertions. Duplicate historical IDs are reported, not blindly renumbered: family links may already be ambiguous. Preserve an export before any manual repair.

The world ID index is a derived WeakMap cache, never serialized. Array replacement, length changes and cached-position validation trigger rebuilds. Death retains the character and genealogy. The first historical duplicate retains the prior `Array.find` behavior.

## Quest and campaign boundaries

`QuestLifecycle.planDeparture` validates capacity, travel/childcare affordability, reputation, party eligibility and payroll before `Game.startQuest` moves money. `Game.completeQuest` sequences rewards/failure, progression, family/world ticks and saving. A repeated callback after completion returns the existing outcome without paying or ticking again.

Campaign providers register as `original`, `factions` and `gate`. The facade routes encounter creation, companions, departure beats, banter, completion and dialogue to the provider selected by quest type. Gate encounter/combat/verb hooks consume the already-resolved core result. Cinematic decoration must remain visible to routed calls; the Gate departure adapter deliberately reads the current decorated method.

**Retry policy:** active quest/scene/combat position is transient. Reloading returns to town and restarts the current chapter when selected again. Persistent story facts, committed choices, paid costs, rewards and companion affection remain. `choiceEffects` prevents replaying ordinary answers from repeating those effects. The chosen answer remains available to replay its dialogue and attempt-local bypass/no-escape transition. Asked questions remain filtered. Chapter ten's summit is explicitly revisable after failure; its recorded affection/heritage delta is replaced rather than stacked. Older settled choices migrate as already committed.

This is not a mid-combat checkpoint format. Adding one requires a separate schema for encounter units, turn queue, statuses, pending beats and presentation handoff. Do not serialize Phaser scenes to implement it.

## Combat modules

`combat.js` assembles modules with explicit dependencies and retains the existing public API and `_internals` used by effects. Responsibilities extracted in this pass:

- `combat_events.js`: ordered rule-event emission.
- `combat_turns.js`: initiative and turn queue construction.
- `combat_targeting.js`: range and target selection.
- `combat_damage.js`: damage calculations, defensive reactions and damage resolution.
- `combat_healing.js`: healing, shields and healing reactions.
- `combat_statuses.js`: status application and ticking.

`combat_ai.js` still selects actions; `combat_effects.js` implements effect handlers. Presentation consumes events. Before changing event order or rules, compare the 24 seeded traces in `test/fixtures/combat-traces.json`. `--capture` intentionally replaces the baseline and must not be used merely to make a failing refactor pass.

World RNG snapshots contain the generator algorithm, original seed and current state. Legacy saves use the previous deterministic seed fallback. Combat already receives an encounter RNG; cosmetic randomness must not consume the world stream.

## Artwork and lifecycle

The title does not preload portrait atlases. `ArtAssets` shares requests and limits concurrent image decoding to four. `AnimeWorld` loads sheets needed by requested identities/gear, pins sources during composition, then bounds retained sources to 12. Cropped cells remain bounded to 20; unused composed portraits are trimmed by the existing cache policy.

Existing Phaser canvas textures are updated in place when artwork arrives. Placeholder metadata allows animation attachment before loading finishes. Props, campaign icons and the four illustrated druid forms also load on demand. Network failures get bounded automatic retries and an explicit retry control; reconnecting also retries failed artwork.

Scene-owned display subscriptions have idempotent disposers attached to their owner's destruction. Use the same ownership pattern for new listeners. Background leases and weather/cinematic cleanup remain with their existing scene owners.

## Release contract

`tools/release_manifest.json` specifies runtime roots, extensions and excluded source/archive directories. `safe_publish.py` freezes names, sizes and SHA-256 hashes before tests. It validates script order and known local asset references, then runs the regression gate. A publication must copy the exact validated file set, verify source and destination hashes, and reject files changed/added/removed during verification. `--skip-tests` is diagnostic-only and cannot publish.

The `site-shell` profile retains the existing public iframe and save origin. It is a distinct profile, not a replacement game entry point. Publisher output outside the manifest is preserved; it is not an automatic cleanup/delete operation. Committing and pushing are separate steps.

## Further architectural work

This pass establishes boundaries without an engine or module-format migration. Some legacy extension wrappers remain in difficulty, support systems and presentation. Difficulty is still bound to one live game; parallel simulations in the same JavaScript runtime must bind it deliberately or use separate harness contexts. Fully injecting difficulty through every stat/skill calculation is a later behavioral isolation step, with interleaved-session tests required first.

The quest coordinator currently owns departure planning; reward/failure sequencing remains in `Game`, with idempotent completion. Further extraction of travel, dialogue and return phases should follow dedicated transition fixtures. Converting all scripts to ES modules, replacing all UI decorators, and storing mid-quest checkpoints were not bundled into this change.
