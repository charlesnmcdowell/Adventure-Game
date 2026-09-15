# Adventurer code audit and proposed refactoring

Date: September 14, 2026. Reviewed revision: `c31c73c55256f4c347d955fb8f27d4eadf3f4b7a`.

**Recommendation: address save integrity and identity allocation before undertaking broad structural refactoring.** The existing game has substantial automated coverage and useful separation between data, simulation, and Phaser presentation. It does not need an engine rewrite. Its greatest risks are at the boundaries: loading saves, committing quest effects, managing scene lifetimes, and reproducing a release from source control.

This was an audit only. No runtime code, game data, art, audio, existing tests, publishing tools, or save files were edited. Nothing was committed or published. The files created in this directory are audit documentation, reproducible diagnostics, logs, and screenshots. All diagnostic saves used memory or disposable browser contexts.

Final verification found the same Git revision, no staged or tracked changes, and unchanged hashes for all 119 inventoried runtime files. See [integrity results](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/final-integrity.json>).

## Coverage and verification

The inventory covered 119 runtime files totaling 42,035 lines, including JavaScript, the entry page, manifest, and mobile stylesheet. Detailed review focused on startup, persistence, character and family identity, parties and vaults, quest orchestration, campaign extension points, combat, rendering lifetimes, mobile launch, and release tooling. Generated content catalogs were inspected through their consumers and validation tests; this was not a line-by-line editorial review of every dialogue entry.

| Check | Result |
|---|---|
| `py tools/safe_publish.py --check-only` | Blocked by a stale test; nothing published |
| JavaScript syntax gate | 336 files passed |
| Data/core script order against browser entry page | Passed |
| Headless commands before the failure | 7 passed |
| Remaining headless commands, executed separately without editing the suite | All 51 passed |
| Overall headless command results | **58 passed, 1 failed** out of 59 commands; these are test-file commands, not individual assertions |
| Disposable Chrome desktop browser, 1280×760 | Title loaded; no captured JavaScript errors or failed HTTP responses |
| Disposable Chrome iPhone/Messenger emulation, 375×667 and 390×844 | Title loaded without horizontal overflow; creation rotation reminder dismissed with deliberately stale visual-viewport dimensions |
| In-memory save/reload diagnostics | Reproduced ID collisions, mixed-generation backups, false restoration success, repeated campaign choice rewards, and RNG divergence |

The successful checks include all fourteen Varenholm Gate chapters on the existing three scripted story routes, campaign coverage, music routing, family and household vault rules, personality distinction, voice coverage, travel, population, integration, and quick difficulty/tank-healer simulations. The integration run completed 31 quests across 80 steps, including five deaths, and ended with a population of 106. This supports the current lifecycle behavior under that fixture; it does not negate the cold-reload ID defect below.

Limits: browser tests used Chrome emulation on Windows, not physical iPhones or the actual Messenger WKWebView. The complete legacy browser suite, exhaustive combat combinations, extended balance simulations, production deployment, and an independent security penetration test were not run. Story-route fixtures deliberately use a strong character; their success is not proof of ordinary-player campaign balance. No real player saves were inspected.

## Priority list

P1 means address before the next substantial release. P2 means a targeted follow-up. P3 means maintainability or measured optimization work after the correctness problems.

| ID | Priority | Finding | Evidence |
|---|---|---|---|
| A01 | P1 | Character and vault identifiers collide after a full reload | Reproduced |
| A02 | P1 | Partial saves can replace the backup with inconsistent state | Reproduced |
| A03 | P1 | The required regression gate stops at a removed API | Reproduced |
| A04 | P1 | Tests, dependency lockfile, and publishing tools are excluded from Git | Verified source-control state |
| A05 | P2 | Campaign choice payments and affection can repeat after reloading | Reproduced with chapter-three content |
| A06 | P2 | Title startup loads the entire portrait atlas catalog | Measured assets and traced loading path |
| A07 | P2 | Fullscreen subscriptions retain destroyed controls | Reproduced with inactive control fixtures |
| A08 | P2 | Publishing accepts mutable, overly broad input | Verified tool behavior |
| A09 | P2 | Saving does not preserve the simulation RNG position | Reproduced; gameplay policy decision needed |
| A10 | P2 | Campaign and feature extensions depend on chained global replacements | Structural risk, not a claim that every wrapper is broken |
| A11 | P3 | Some visible rules and comments contradict current mechanics | Confirmed example |
| A12 | P3 | Long-running world lookup costs need profiling and an indexing plan | Optimization candidate, no measured slowdown claimed |

## Findings and proposed changes

### A01 — Allocate unique character and vault IDs across reloads

References: [character.js:7](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/character.js:7>), [vault.js:9](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/vault.js:9>), [save.js:109](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/save.js:109>), [world.js:61](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/world.js:61>).

Character and vault factories use module-local counters starting at one. Loading a saved world does not advance them past existing IDs. Party IDs already have a synchronization and collision-avoidance mechanism in [party.js:14](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/party.js:14>); characters and vaults lack the equivalent protection.

**Reproduction:** create and save a world containing `c1` and vault `v1`; reload the modules with the same storage; create an NPC and a vault. The new objects are again `c1` and `v1`. After appending the NPC, `World.byId` returns the earlier character. Browser title startup also leaves the character counter at one, so ordinary boot does not provide an intervening synchronization step.

This can attach relationships, inheritance, party references, or vault access to the wrong object. Cold reload is the missing dimension in many otherwise successful lifecycle tests.

**Proposal:** introduce a world-owned ID allocator, or first extend the existing party synchronization pattern to characters and vaults. Synchronize during hydration and reject collisions during allocation. Inspect nested dependents, stored encounter references, and other ID namespaces before choosing the complete allocator scope. Validate existing saves for duplicates; do not automatically rename ambiguous historical IDs without a reference-repair strategy and backup.

**Acceptance:** a fresh JavaScript process loads an old world, matures children, adds residents, creates households and vaults, and repeatedly saves/reloads without duplicate identities. Parent/child, party, and vault references must still resolve to the intended object.

### A02 — Make saves coherent and report failures

Reference: [save.js:48](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/save.js:48>).

`put()` returns a success flag, but `saveGame()` ignores it while writing world, characters, relationships, vaults, and metadata separately. It then builds the backup from whatever is currently stored. `restoreBackup()` also ignores failed writes and returns `true`.

**Reproduction:** reject only the character write after advancing the clock and adding 123 gold. The backup advances from clock zero to one while retaining the old character gold, replacing the previously coherent backup. The caller receives `undefined`, with no failure signal. Rejecting all restoration writes still returns `true`.

**Proposal:** serialize one versioned snapshot, validate it, then commit using a two-slot journal with a committed revision, or an IndexedDB transaction. Preserve a last-known-good snapshot until a replacement is successfully committed. Return a structured result that the UI can use for a small save-failure notice and retry/export controls. Keep compatibility migrations separate from corrupt-data recovery. Preserve the intentional distinction between life state and permanent progression.

**Acceptance:** inject failure at every persistence step; reload must produce either the complete previous snapshot or the complete new one, never a mixture. Backup restoration must report failed writes. Add malformed-data validation, unavailable-storage coverage, and a save export/import round trip. Do not introduce another wipe as part of this repair.

### A03 — Restore a meaningful regression gate

References: [courtesy2.js:20](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/test/courtesy2.js:20>), [package.json:10](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/package.json:10>), [browser_mobile.js:55](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/test/browser_mobile.js:55>).

The required headless gate stops at `ADV.Game.offerHomeReload is not a function`. That API is no longer present. The 51 commands after it all passed when executed separately. This is a stale-test failure, not evidence that forced home reload should be restored.

There is also a static mismatch in the old mobile suite: `test:mobile` and the aggregate browser suite still use a test expecting `body.portrait`, `touch-action: none`, and the previous title interaction. The current mobile launch uses different visibility state and `touch-action: manipulation`. New launch tests exist separately, leaving inconsistent entry points.

**Proposal:** update obsolete assertions to current behavior, retire superseded mobile checks while retaining distinct coverage, and use one named test registry to produce a complete result summary. Keep failures blocking publication. Add cold-process reload and interrupted-save coverage rather than only testing save/load within one module instance.

**Acceptance:** the unchanged production build passes the corrected gate; deliberately breaking orientation dismissal, save coherence, or identifier allocation makes its corresponding test fail. One failed command must not hide the report for all later commands.

### A04 — Put the development and release contract under version control

Reference: [.gitignore](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/.gitignore>).

The repository ignores `test/`, `tools/`, `package.json`, `package-lock.json`, `.eslintrc.json`, and all Markdown files. `git ls-files` confirms the package files, harness, publisher, and `.github` workflow paths are absent. A fresh checkout therefore cannot reproduce the local regression or publishing process from tracked files alone.

**Proposal:** track selected tests, dependency declarations and lockfile, safe-publish code, lint configuration, and maintenance documentation. Narrow ignores to generated output, caches, local configuration, credentials, and working assets. Do not broadly add every file from `tools/`, which also contains generated media and outputs. Add CI using the same documented gate and isolate concurrent editing work in separate branches/worktrees.

**Acceptance:** a clean checkout can install locked dependencies, run the documented gate, and build a dry-run release without relying on files left on this laptop. Secret-bearing configuration remains outside Git.

### A05 — Commit campaign effects once, with a clear retry policy

References: [campaign3.js:518](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/campaign3.js:518>), [campaign3.js:540](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/campaign3.js:540>), [game.js:63](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/game.js:63>).

Choice application immediately saves gold, affection, and flags. `Game.load()` resumes with `quest: null`; it does not restore the active encounter/beat position. The choice filter removes already-asked questions but does not prevent repeating the side effects of ordinary answers.

**Reproduction:** at campaign stage two, start chapter three and select the actual `q3_tollan` / `fee` option. It awards 100 gold and one affection point. Reload before completing the chapter: stage remains two and no quest is active. Restart chapter three; the same answer remains available and awards another 100 gold and another affection point.

**Proposal:** choose explicit checkpoint semantics. Either persist and resume the quest transaction or roll back attempt-local effects to the departure checkpoint. Keep intended permanent story progression separately. Give committed story effects stable occurrence IDs so re-rendering or replaying a conversation cannot repeat money, affection, recruits, perks, or deaths. Preserve the ability to retry failed quests and make deliberate alternate choices where intended.

**Acceptance:** reload, flee, fail, and retry around each choice; payouts and relationship effects follow the chosen policy exactly once. Test the real chapter-three fee option, negative-gold choices, recruitment overflow, campaign perks, and ending rewards.

### A06 — Load portrait assets according to the current screen

References: [scene_boot.js:10](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/ui/scene_boot.js:10>), [anime_world.js:39](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/ui/anime_world.js:39>).

Title preload requests all 40 portrait part atlases before presenting the title, plus four druid-form images. The atlas files alone total **35.7 MiB compressed**. Their actual dimensions represent approximately **154.1 MiB of RGBA pixel data** before other images, canvases, GPU resources, or browser overhead. That is a size estimate, not a measured browser peak-memory reading. Source images remain referenced in the `sources` map.

**Proposal:** load the title independently, then load creation-visible heads and equipment on demand. Preload the current party, upcoming enemies, and known next scene in bounded batches. Retain the existing composited-portrait and part caches, and extend their explicit asset ownership to original atlas images where useful. Do not lower art quality globally before measuring device limits.

**Acceptance:** a network trace shows title interaction without downloading the entire wardrobe. Record cold-launch transferred bytes, time to interactive, frame time, and memory on representative phones. Compare every skin tone, equipped set, reserved story appearance, and druid form visually after introducing lazy loading.

### A07 — Unsubscribe scene-owned display listeners

References: [prefs.js:80](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/prefs.js:80>), [scene_combat.js:1018](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/ui/scene_combat.js:1018>).

`Display.watch()` appends a callback to a permanent array and returns no disposer. Button callbacks retain their old display object, then silently do nothing when it is inactive. The removal-on-exception logic never removes these callbacks because the button callback catches errors itself.

**Reproduction:** register 100 inactive button fixtures in a disposable browser page. Both the first and second fullscreen notifications read all 100 inactive objects. Destroying or replacing a button does not remove its subscription.

**Proposal:** return an unsubscribe function and attach it to the owning control's destruction or scene shutdown. Introduce a small scene-lifetime helper for external listeners, timers, voice callbacks, and asset leases. Avoid changing all existing scene code in one pass.

**Acceptance:** repeatedly enter/leave combat and town and rebuild controls; active subscriber counts return to baseline. Trigger fullscreen changes after shutdown and verify old objects are not touched.

### A08 — Publish a declared snapshot of runtime files

Reference: [safe_publish.py:99](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/tools/safe_publish.py:99>).

The default publisher recursively copies everything under `assets`, `audio`, `js`, and `lib`; the scan exclusion list is not a publication filter. The current asset tree contains **211 files under `source` directories totaling 352.5 MiB** that this profile would copy. This does not mean those files are currently deployed or unused. It means production inclusion is controlled by folder location rather than an explicit runtime dependency list.

The tool also silently skips missing top-level inputs and reads a mutable working tree after tests run. Byte verification compares each copied file with its source at that moment; it does not prove the release is the exact revision that passed the gate. Concurrent edits can therefore produce an inconsistent candidate.

**Proposal:** define a runtime allowlist/dependency manifest, fail on missing required files and references, freeze input hashes before testing, and refuse to publish if they change. Build the candidate from that snapshot. Retain the existing path containment guard and hash verification. Preserve the website wrapper and game origin, since changing the origin changes browser save storage. Have a separately reviewed stale-file cleanup plan rather than deleting destination files opportunistically.

**Acceptance:** remove a required fixture asset, modify a fixture during validation, and place a source-only fixture under assets: the first two must fail and the third must not enter the release. Validate icon, script, image, audio, and manifest references. The tool should still never push automatically. A website commit/deployment remains separate from its local copy operation.

### A09 — Preserve simulation randomness across save/load

References: [rng.js:8](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/rng.js:8>), [game.js:69](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/game.js:69>).

The RNG stores its evolving position in a closure, while only its starting seed is exposed. Reload reconstructs a stream from world seed and quest clock. The next draw after an otherwise identical save was `0.5007059085` without reloading and `0.1672079323` after reloading.

**Proposal:** if reload is meant to resume the same simulation, persist an explicit RNG state and separate world, combat, and cosmetic streams. If rerolling on reload is intentional, document that policy instead. This is a confirmed reproducibility gap, not a claim that randomized replay is inherently incorrect.

**Acceptance:** run the same decisions uninterrupted and with save/reload boundaries; their simulation results match under a resume policy. Cosmetic changes must not alter combat or family randomness.

### A10 — Replace implicit extension chains with explicit interfaces

References: [campaign3.js:681](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/campaign3.js:681>), [balance_support.js:8](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/balance_support.js:8>), [scene_anime_preview.js:28](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/ui/scene_anime_preview.js:28>).

Campaign2, Campaign3, travel, difficulty, balance support, and presentation layers capture and replace previously defined global functions. The art preview also wraps production save functions to protect its sandbox. Existing order checks help, but behavior still depends on which wrapper installed first and whether it delegates correctly.

Large modules compound this: `combat.js` is 2,947 lines, `portraits.js` 2,247, `game.js` 1,437, and `scene_combat.js` 1,363. File size alone is not a defect; the concern is overlapping responsibilities and implicit control flow.

**Proposal, incrementally:**

1. Add JSDoc contracts for persistent characters, campaign progress, quest attempts, combat units, dialogue beats, and combat events. Distinguish saved data from scene-local objects and transient caches.
2. Define a campaign provider interface for encounters, companions, beats, completion, music, and art. Select the provider once by quest type instead of installing another global replacement per expansion.
3. Extract a quest lifecycle coordinator: departure validation, travel, dialogue, combat, rewards, failure, and return. Make completion idempotent and define checkpoint boundaries alongside A05.
4. Split combat by responsibility while preserving its API: targeting/range, damage/healing, statuses, turn resolution, and event emission. Keep AI selection and VFX consumption outside those rule modules.
5. Pass explicit simulation context for difficulty and RNG. Inject a memory-only save service into previews instead of making preview scripts responsible for production save policy.
6. Once interfaces are stable, consider ES modules or a small build step to enforce imports. Do not combine module conversion with balance, narrative, and renderer rewrites.

**Acceptance:** characterize current event order and outcomes first. Move one responsibility per reviewable change, retaining seeded combat, gear/skill, campaign-route, and visual regression coverage. Each campaign should work through the common interface without mutating another campaign's methods.

### A11 — Derive player-facing rules from current mechanics

References: [scene_quest.js:79](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/ui/scene_quest.js:79>), [combat.js:2885](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/combat.js:2885>), [difficulty.js:38](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/difficulty.js:38>).

The quest screen says the player only heals back in town. Winning encounters actually restores health between fights, with difficulty-dependent recovery. Nearby combat comments still describe a universal 50% recovery even though the difficulty table varies it. Other legacy comments should be treated as explanations to verify, not as authoritative specifications.

**Proposal:** use small shared rule-formatting helpers for recovery, armor-supported skill levels, costs, and caps. Keep dialogue text separate from calculated mechanical explanations. Document the intended rule next to its data definition and validate key UI descriptions against that data.

**Acceptance:** each difficulty displays the correct recovery rule. Gear previews, trainer text, and combat behavior agree. This requires no broad dialogue rewrite or voice regeneration.

### A12 — Profile world queries before adding indexes

Reference: [world.js:61](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/js/core/world.js:61>).

`World.byId` scans the character array, and many family, party, and social operations repeatedly use it. Retaining deceased relatives is meaningful game history, so the working data can grow across generations even when the living population is bounded. Existing courtship caching and the capped event feed are useful foundations.

**Proposal:** after A01, profile long-running worlds and add a derived `Map` for ID lookup if measurements justify it. Centralize insertion/removal and invalidate indexes on load and mutations. Use tick-scoped query results for frequently repeated population/household calculations. Do not erase genealogy or reduce the requested population merely to simplify performance.

**Acceptance:** a long-run benchmark records time spent by subsystem and lookup counts. An index must return the same objects as the canonical world data through births, adulthood, marriage, death, recruitment, and reload.

## Suggested implementation sequence

| Phase | Proposed work | Completion criterion |
|---|---|---|
| 1 — Establish trustworthy verification | A03 and A04; add focused reproductions for A01/A02/A05 | A clean checkout can reproduce the gate and known failures |
| 2 — Protect existing progress | A01, A02, A05; decide RNG/checkpoint policy | Cold reload and interrupted-save/retry tests preserve identity and coherent progression |
| 3 — Reduce release and device risk | A08, A07, then A06 | Release inputs are fixed; scene subscriptions are bounded; title payload is measured and reduced |
| 4 — Refactor behind stable behavior | A10 in small extractions; A11 as mechanical text is touched | Existing campaign/combat outcomes and presentation remain covered |
| 5 — Optimize proven bottlenecks | A09 implementation if selected; A12 after profiling | Reproducible simulation and measured long-run improvements |

Phases 1–2 should be a series of focused fixes, each with its own save compatibility review. Phase 4 is a multi-change architectural effort, not a single giant cleanup commit. The ID and save repairs have relatively small code surfaces but high verification requirements; the campaign/checkpoint work has a broader behavioral scope.

## Preserve these existing foundations

- Keep the Phaser renderer and the current art direction. This audit found no reason to replace the engine.
- Keep the separation between authored data, headless rules, and scene presentation; make those boundaries more explicit.
- Reuse the existing party ID synchronization pattern, campaign route tests, difficulty simulations, personality/voice checks, and family/vault tests.
- Preserve reference-counted background leases and shutdown cleanup in `anime_environments.js` and `gate_cinema.js`. The portrait system also already limits cropped-part and composited-portrait caches. The startup issue is separate from those working controls.
- Preserve early departure validation. A reputation-gated rejection with a dependent and a requested vault deposit left carried gold unchanged in the current revision; it is not an outstanding charging bug in this audit.
- Preserve player saves, intended permanent campaign progression, casting IDs, existing recorded dialogue, and current gameplay tuning while refactoring. Bulk renaming assets, deleting source art, generating new voices, and wholesale formatting changes are outside this recommendation.

## Reproduction and evidence files

- [Snapshot and source hashes](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/snapshot.json>)
- [Test summary](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/test-summary.json>) and [gate log](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/headless-gate.log>)
- [All separately executed checks](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/remaining-checks.json>); individual `check-*.log` files are in this directory
- [Diagnostic source](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/reproduce.cjs>) and [results](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/reproductions.json>)
- [Browser diagnostic source](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/browser-smoke.cjs>) and [results](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/browser-smoke.json>)
- [Asset measurements](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/asset-metrics.json>) and [atlas inventory](<C:/Users/charl/The Sorcerer Sword ARPG/adventurer/docs/maintenance/code-audit-2026-09-14/portrait-atlases.json>)

To repeat the isolated diagnostics from the game directory, run `node docs/maintenance/code-audit-2026-09-14/reproduce.cjs`. The browser diagnostic additionally requires the local game server on port 8734, installed Playwright, and Chrome at its configured Windows path. Neither diagnostic attaches to the user's playing tab.
