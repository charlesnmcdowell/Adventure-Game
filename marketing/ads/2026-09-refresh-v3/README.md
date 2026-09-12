# Adventurer — Facebook Reel, full game view

**Adventurer_Gameplay_45s6.mp4** is a vertical **1080 × 1920**, **30 fps**, **45.6-second** Facebook Reel. The complete 1280 × 760 game canvas is visible at full video width in every gameplay shot, including the left player portrait, navigation, and right menu. The original end card occupies the final **five seconds, 40.6–45.6**.

The audio stream is copied directly from the original `Adventurer_Facebook_Reel.mp4`. Its narration, music, timing, and mix are unchanged. No game dialogue, extra voice recordings, or gameplay sound effects are mixed in. Verification compares every decoded audio sample with the original. No ElevenLabs credits are used.

| Time | Actual game footage |
|---|---|
| 0–4 | Creating and naming Lyra, a Black woman with swept locs |
| 4–7 | Joining Ronan's party |
| 7–10 | Fire Ball in Quest 2 alongside Hiwot |
| 10–11.6 | Necromancy raising cutscene |
| 11.6–12.6 | Risen wolves join the next encounter |
| 12.6–15.6 | Relationship request and acceptance |
| 15.6–18.6 | Naming daughter Aria |
| 18.6–21.1 | Clicking Blacksmith and buying the Mage Set |
| 21.1–23.1 | Buying and switching to rogue Night Leathers |
| 23.1–25.1 | Buying and switching to Ranger Set |
| 25.1–27.1 | Buying and switching to Warrior Set |
| 27.1–30.6 | Home menu, Brick house purchase, and background change |
| 30.6–32.6 | Samurai travel at The Green-Eyed Pass |
| 32.6–34.6 | Quest 2 travel with Hiwot |
| 34.6–37.6 | Hiwot's illustrated paper-reading scene in the tavern |
| 37.6–40.6 | Tesfaye being stabbed, with the actual cutscene UI |
| 40.6–45.6 | Original clickbait end card and website |

The illustrated Hiwot scene is the existing Quest 2 `q2_notice` beat and `still_bounty.webp` art. The father's scene is `q1_death` and `still_death.webp`. Both are recorded through the shipped campaign cutscene renderer; the original dialogue remains visible but is not audible in the Reel.

Blacksmith changes use real menu clicks and gold deductions. The game requires selling the previous set before buying another; those sales happen between the selected purchase shots, and each purchase is verified. The brick-house purchase deducts 350 gold and restarts Town using the new home background. All gear shots retain the normal town portrait and menus. Pointer highlights track real clicks, and the pointer moves away afterward so gear tooltips do not obscure the portrait.

Production portrait correction: generic outfit layers now compensate for empty space above their collar; asymmetrical hunting coats and the female plain outfit align their neck openings with the head. This complements the earlier neck blending and clothing tint corrections. Fullscreen checks cover Canvas/WebGL, 1080p/1440p and the native game resolution, including 34 creation cards and animated portraits.

Capture uses an isolated browser and staged game state. No live save is changed. The finishing combat shot stages weakened Quest 2 wolves so Fire Ball and the real raising sequence fit the edit; production combat rules and enemy stats are unchanged. Earlier ad exports remain intact.

Rebuild with `node capture.js`, then Python with Pillow/NumPy for `compose.py` and `verify.py`, with the local game server running on port 8734. The scripts use the locally installed Chrome and FFmpeg. `capture_evidence.json` records purchases and cutscene IDs; `marks.json` identifies footage; `edit_manifest.json` records timing; `verification.json` records output checks; `review/` contains visual QA. The source video and intermediate clips live in `raw/` and `work/`.
