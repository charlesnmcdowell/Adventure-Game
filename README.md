# Adventurer

A browser RPG built with Phaser. This folder contains the editable game, art and audio, development tools, and project documents.

## Play the game locally

**[Open Adventurer](http://127.0.0.1:8734/index.html)** while the local server is running.

If the page does not open, run these commands in PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\charl\The Sorcerer Sword ARPG\adventurer'
py -m http.server 8734 --bind 127.0.0.1
```

Keep that terminal open while playing. Press Ctrl+C to stop the server. If port 8734 is already in use, try the game link first; the server may already be running.

The entry file is [index.html](index.html). Use the local web address so the browser can load the game's assets correctly. No build step is required. The public website is hosted separately and does not depend on this local server.

[Varenholm's Gate art viewer](http://127.0.0.1:8734/index.html?gateArtPreview=1) · [Character art preview](http://127.0.0.1:8734/index.html?artPreview=1)

## Find things

| Folder | Contents |
| --- | --- |
| [docs](docs/README.md) | Game design, campaigns, dialogue, art plans, prompts, and update reports |
| `js/` | Game systems, story data, scenes, and rendering code |
| [assets](assets/README.md) | Original art and the optimized art used by the game |
| `audio/` | Voices, music, and sound effects |
| `lib/` | Browser libraries, including Phaser |
| `tools/` | Exporters, voice tooling and state, art production tools, and QA captures |
| `test/` | Automated checks; older text results are in `test/reports/` |
| `marketing/ads/` | Advertising videos, audio, source clips, and production scripts |
| [archive](archive/README.md) | Project snapshots, retained voice backups, legacy exports, and superseded art |
| `node_modules/` | Installed development dependencies |

The root also keeps `package.json`, its lockfile, and the ESLint/Git configuration. Run development commands from this root folder. Use Node 20 or newer (CI uses Node 24) and Python 3.

## Development and release checks

```powershell
npm ci
npm test
python tools/safe_publish.py --check-only
```

`test/suites.json` is the test registry. Every command gets a result and a log in `test/reports/`; a failure keeps the overall gate red. CI uses the same check-only publisher and uploads the reports.

Browser checks require the local server above and Playwright browsers (`npx playwright install chromium webkit`; on Linux CI, use `--with-deps`). Windows browser checks use the installed Chrome when present. Run `npm run test:browser` for game UI checks, or `python tools/safe_publish.py --check-only --mobile` for Chromium and WebKit mobile launch/host checks. Phone emulation verifies layout and event handling; it is not a claim of testing an actual iPhone or the Messenger app.

To repeat a focused check: `node tools/test_runner.js headless persistence campaign_retry`. To profile long-running world lookup without a timing pass/fail threshold: `node test/world_profile.js --ticks=150`.

`npm run test:smoke` checks the current creation/voice/difficulty flow, saves, artwork loading/recovery, battle transitions, Gate chapter/dialogue routing and phone launch. The broader `test:browser` suite also retains legacy UI checks; some fail on expectations from older interfaces. They have not been removed or silently treated as passing. See the implementation record for the baseline comparison and release blockers.

Publication uses `tools/safe_publish.py` and `tools/release_manifest.json`; do not hand-copy the game. The publisher freezes runtime files before validation and refuses changed inputs. Source art, caches and archives stay out of new releases. It never pushes automatically. For the existing public website wrapper, retain the `site-shell` profile and its existing game origin.

See [architecture and save/retry contracts](docs/maintenance/ARCHITECTURE.md) and the [September 14 implementation record](docs/maintenance/REFACTOR_2026-09-14.md). Save backup controls are available from the mobile More sheet and Settings.

## Organization record

The September 11 folder cleanup moved 161 files without deleting their contents. See the [cleanup notes](docs/maintenance/FOLDER_ORGANIZATION.md) and [old-to-new file index](docs/maintenance/organization-2026-09-11.json).

The previous long README is preserved as [project history](docs/history/PROJECT_HISTORY.md). Its older launch instructions and development notes are historical; use this page to start the current game.
