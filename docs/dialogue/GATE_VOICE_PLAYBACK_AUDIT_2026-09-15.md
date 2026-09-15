# Varenholm Gate late-campaign voice audit — September 15, 2026

## Findings

All 81 quest 12–14 dialogue recordings exist and decode successfully. The public GitHub Pages game serving the Neverendingnarratives iframe returned HTTP 200 and matching local SHA-256 hashes for every clip, including its cache-version URL. The public music, campaign UI and dialogue sources also matched the local sources at the start of the audit. No missing late-campaign recording or incorrect Segun speaker mapping was found.

| Quest | Recordings checked |
| --- | ---: |
| 12 | 27 |
| 13 | 23 |
| 14 | 31 |

Segun Marr is internally `lucan`, with casting voice ID `ouilM4BVCVF7fxKGukKI`. His Q13 temple-steps opener has two recordings, followed by `q13_steps_selene_reply_1.mp3` for his answer to Delphine. All three files contain healthy audible samples and were served correctly. The actual temple-steps cutscene played correctly in fresh Chromium and WebKit contexts.

The player's original intermittent silence was not reproduced in those fresh contexts. Device/browser details remain unconfirmed; desktop WebKit is not a physical iPhone or Messenger test. Do not describe this as proof of the original device-specific cause.

## Playback defects repaired

- Unmuting resumed music but could leave the current spoken line paused. The current unfinished line now resumes, including a line first displayed while sound was muted.
- Backgrounding while voice playback was pending could lose its resume state. A requested unfinished clip is now retained through a soft pause.
- An older `play()` promise could resolve after a newer resume and pause that newer playback. Stale completion now leaves a newer requested playback alone, while stopped/hidden/muted audio remains stopped.
- Rejected playback promises were swallowed. Failures now retain the reason and report the exact audio URL to the browser console; failed speech also releases music ducking.
- Recorded Gate dialogue now has a touch-sized **Replay voice** control. Its direct user gesture can recover from browser autoplay rejection or reload a failed media request without advancing dialogue. It restarts only the current line, respects mute, and cannot resurrect a dismissed speaker.
- Music retains its gesture listener to recover a blocked score after returning to a webview. Campaign voice replay is deliberately separate from advancing dialogue.
- Updated the three changed runtime script URLs so a refreshed page requests the new code.

Dialogue text, casting IDs and audio files are unchanged. Mzee Kamau's five intentionally unvoiced lines remain unvoiced and have no replay button. No ElevenLabs request or credit expenditure occurred.

## Validation

- `node test/gate_voice_assets.js --live`: 81/81 public recordings matched local bytes before the runtime edits; inventory saved under `test/reports/gate-voice/`.
- Decoded every clip using Chromium Web Audio; all had nontrivial duration and healthy sample levels. Segun's three clips run 6.32, 4.8 and 4.48 seconds.
- `node test/browser_gate_voice.js` and `node test/browser_gate_voice.js --webkit`: isolated 844×390 mobile-sized contexts, genuine Segun encounter opener and Delphine exchange, then all 81 clips through their actual speaker/key/index and dialogue UI. Each assertion checks media time progressing, rather than merely counting playback calls or successful downloads. Both engines passed without page errors.
- The browser tests also reject one voice request deliberately and verify recovery with the real Replay voice button, retaining the same dialogue line. The exhaustive clip sweep bypasses scene-art loading; the Segun encounter exercises the real art transition.
- `node tools/test_runner.js headless music_score music_voice_recovery gate_voice_assets campaign3_lines campaign3_courtship vo_usage`: six suites passed. The recovery regression covers mute, background, pending promises, autoplay denial, failed loading, finished clips and stale references.
- New inventory/recovery tests are registered in the headless gate; the Chromium playback regression is registered in the browser gate. WebKit remains available through `--webkit`.
- Existing private-courtship browser regression passed at 1280×760 and 844×390 after the replay control was added; selected speakers, choices and scene transitions remain intact. Targeted ESLint completed without warnings or errors.

These changes are local and have not been committed, pushed or published. Concurrent difficulty work was preserved. Publishing should use the repository's safe-publish workflow.
