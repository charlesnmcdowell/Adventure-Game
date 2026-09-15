# Difficulty modes

Three roads, chosen on a new life and changeable any time in town under **Difficulty**. The
choice lives in `meta`, so it follows the player through deaths and new lives.

Easy is the previous Normal: one extra enemy, better kits, a smaller health buffer. It is
still the road for people short on time. Normal is the previous Hard. Hard goes further —
another body, veterans from the first contract, a little more bite, and almost no rest.

## The levers

| Lever | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Extra enemies per fight (the encounter's own kinds; never more adds than you have companions) | +1 | +2 | +3 |
| Enemy skill levels (kits climb tiers; tier-1 mooks bring their perks) | +2 | +4 | +6 |
| Enemy kit floor (no skill below this level) | 10 — intermediate kits | 10 — intermediate kits | 10 — the +6 carries seasoned kits to advanced |
| Lowest enemy level the kit floor reaches | level 8 | level 4 | level 4 |
| Enemy health / attack / defence | ×1 / ×1 / ×1 | ×1 / ×1 / ×1 | ×1.1 / ×1.1 / ×1 |
| Most a basic-tier skill can take in one use | a third of the foe | a third of the foe | a quarter of the foe |
| Your health buffer | ×1.5 | natural | natural |
| Health back after a won encounter | 35% | 20% | 10% |
| Contract pay | +50g | no bonus, ×0.85 | no bonus, ×0.7 |
| Auto combat stops itself | below 30% | never | never |
| Solo flee warning (naval narrator) | yes | no | no |

The kit floor reaches only enemies that are already seasoned. A wolf on an Easy first contract is still a wolf: below the
threshold a creature fights with the kit it was written with. Better enemies are meant to
be enemies that are already something.

A basic-tier skill is an opener, not an execution: one use takes at most a third of a foe's
maximum health on Easy and Normal (a quarter on Hard) and never kills outright, however far
the wielder outclasses them. The allowance covers the whole action, so extra hits and
anything the blow sets off draw on the same cap.

What never changes: stories, companions, choices, rewards in kind, loot, and the stats of
anyone on your side — conscripts, the risen, hired hands and story companions fight with the
stats you can read on them. Rival guild parties (ambushes, raids) are not scaled either.

A lone boss stays a lone boss: reinforcements copy only the non-boss kinds already in the
encounter, and solo work gets no adds at all — a lone fighter meets veterans, not a crowd.
On the Varenholm's Gate road the adds are as silent as the rest of the cast. Easy still
softens the first two Gate quests; Normal and Hard do not.

## Where it lives

- `js/core/difficulty.js` — the table, `Difficulty.set/id/def`, `toughen` (veterans),
  `reinforce` (adds), `pay`, `recoverPct`, `autoStopPct`. Binds on every new game and load.
- `js/core/character.js` — `effStat` applies the player buffer and the enemy edge;
  `makeEnemy` toughens.  `js/core/campaign.js` — `spawnEnemy` toughens.
- `js/core/game.js` — `currentEncounter` reinforces after the spawn.
- `js/core/combat.js` — post-victory recovery.  `js/core/balance_support.js` — pay.
- `js/ui/scene_combat.js` — the safety stop and flee warning.
- `js/ui/difficulty_ui.js` — the town panel and the new-life modal;
  `scene_creation.js` asks after the personality pick; `scene_town.js` lists the panel.

## Calibration

`test/difficulty_sim.js` plays the game headlessly on each setting with the game's own enemy
AI driving the player — a competent but unspectacular policy that never tanks a boss — and
reports win rates and health left. `npm test` runs a quick pass and fails if the ladder breaks:
each step down must cost wins and health, Easy must stay winnable in ordinary work, Normal
must keep at least half of Easy's party wins, and Hard must keep at least a quarter of them
while costing real wins.

The 15 September 2026 retune moved the previous Normal onto Easy, the previous Hard onto
Normal, and added a further Hard step. Re-run `node test/difficulty_sim.js` for a fresh
table. Read Gate rows as relative, not absolute: the Gate gives every enemy five times the
health and twice the attack and defence (`CAMPAIGN3_COMBAT`), and the AI player never
guards, taunts, retreats or brings the scripted company's full kit — a person does.
`node test/difficulty_sim.js --only=hard --scenario=party --override='{"hard":{"foeLevel":8}}'`
tries a lever without editing the table.
