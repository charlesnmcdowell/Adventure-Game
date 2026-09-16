#!/usr/bin/env python3
"""safe_publish.py — the gated ship command for Adventurer.

Runs, in order:
  1. `node --check` on every JS file under js/, test/ and tools/ — catches the
     OneDrive / FUSE tail-truncation that silently ships a broken file.
  2. The harness script-order check (test/harness.js must mirror index.html).
  3. The headless suite (`npm test`); with --browser also `npm run test:browser`.
  4. Only if everything passes: copies the playable build into
     <site-repo>/<dest> (default play/adventurer) in place, then re-verifies
     every published file byte for byte. Never runs git push.

Usage:
  python3 tools/safe_publish.py --check-only
  python3 tools/safe_publish.py <path-to-Neverendingnarratives-repo> [--dest play/adventurer] [--browser]
"""
import argparse, hashlib, json, os, subprocess, sys
from release_files import collect, verify, checked_bytes, delivery_summary
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {'node_modules', '.git', 'archive', 'docs', 'marketing', 'reports', 'baseline', '__pycache__'}

def say(msg): print(msg, flush=True)

def js_files():
    for top in ('js', 'test', 'tools'):
        for directory, dirs, files in os.walk(ROOT / top, followlinks=False):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for name in files:
                if name.endswith('.js'): yield Path(directory) / name

def node_check():
    bad = []
    for p in js_files():
        r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
        if r.returncode != 0:
            bad.append((p, r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'syntax error'))
        elif p.stat().st_size == 0:
            bad.append((p, 'EMPTY FILE (truncated?)'))
    if bad:
        say('BROKEN/TRUNCATED files:')
        for p, why in bad: say(f'  {p.relative_to(ROOT)}: {why}')
        return False
    say(f'  node --check: {sum(1 for _ in js_files())} files clean')
    return True

def order_check():
    r = subprocess.run(['node', '-e', "const h=require('./test/harness');const o=h.checkScriptOrder();console.log(JSON.stringify(o));process.exit(o.ok?0:1)"], cwd=ROOT, capture_output=True, text=True)
    say('  script order: ' + (r.stdout.strip() or r.stderr.strip()))
    return r.returncode == 0

def run_tests(browser, mobile=False):
    r = subprocess.run('npm test', shell=True, cwd=ROOT)
    if r.returncode != 0: say('HEADLESS SUITE FAILED'); return False
    if browser:
        r = subprocess.run('npm run test:browser', shell=True, cwd=ROOT)
        if r.returncode != 0: say('BROWSER SUITE FAILED'); return False
    if mobile:
        for engine in ('0', '1'):
            env = dict(os.environ, MOBILE_WEBKIT=engine)
            for script in ('test/browser_mobile_launch.js', 'test/browser_mobile_host.js'):
                r = subprocess.run(['node', script], cwd=ROOT, env=env)
                if r.returncode != 0: say('MOBILE BROWSER SUITE FAILED'); return False
    return True

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()

def asset_check(frozen):
    r = subprocess.run(['node', 'tools/validate_assets.js', '--json'], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        say(r.stdout or r.stderr); return False
    result = json.loads(r.stdout)
    excluded = []
    for ref in result['references']:
        p = (ROOT / ref).resolve()
        relative = p.relative_to(ROOT).as_posix()
        if relative not in frozen: excluded.append(relative)
    if excluded:
        say(f'Runtime references excluded from release: {excluded}'); return False
    say(f"  asset references: {len(result['references'])} present in release")
    return True


def publish(site, dest, profile='game', frozen=None):
    if frozen is None: raise ValueError('Publication requires the snapshot that passed validation')
    base = Path(site).resolve()
    target = (base / dest).resolve()
    if target != base and base not in target.parents:
        say('destination must stay inside the specified repository'); return False
    if not base.is_dir(): say(f'site repo not found: {site}'); return False
    if profile == 'crazygames' and target == base:
        raise ValueError('CrazyGames output must be a subdirectory so its companion manifest stays inside the output base')
    if profile == 'crazygames' and target.exists() and any(target.iterdir()):
        raise ValueError('Use a fresh CrazyGames output directory so old assets cannot enter the upload bundle')
    verify(ROOT, frozen)
    if collect(ROOT, profile) != frozen:
        raise ValueError('Release file list changed during validation')
    target.mkdir(parents=True, exist_ok=True)
    for relative, row in frozen.items():
        if row.get('delivery') == 'external': continue
        out = (target / relative).resolve()
        if not out.is_relative_to(target): raise ValueError('Output escapes release directory')
        data = checked_bytes(ROOT, row)
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open('wb') as f: f.write(data); f.flush(); os.fsync(f.fileno())
        if sha(out) != row['sha256']: raise ValueError(f'Published hash mismatch: {relative}')
    verify(ROOT, frozen)
    summary = delivery_summary(frozen)
    if profile == 'crazygames':
        # Keep source hashes in the companion report, outside the upload folder.
        report = target.with_name(target.name + '-media-manifest.json')
        report.write_text(json.dumps({'profile': profile, 'delivery': summary, 'files': frozen}, indent=2), encoding='utf-8')
    say(f"  wrote {summary['bundleFiles']} frozen, verified files -> {target}")
    if summary['externalFiles']: say(f"  {summary['externalFiles']} voice clips load from the existing game host; portal acceptance is still required")
    say('  existing files outside this manifest were preserved; commit/push remains a separate action.')
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('site', nargs='?', help='path to the Neverendingnarratives site repo')
    ap.add_argument('--dest', default='play/adventurer')
    ap.add_argument('--profile', choices=['game', 'site-shell', 'crazygames'], default='game', help='site-shell preserves the iframe; crazygames emits a locked-censorship bundle with externally hosted voices')
    ap.add_argument('--check-only', action='store_true')
    ap.add_argument('--browser', action='store_true', help='also run the Playwright suite')
    ap.add_argument('--mobile', action='store_true', help='run the mobile launch and host checks in Chromium and WebKit (requires local server on 8734)')
    ap.add_argument('--skip-tests', action='store_true')
    a = ap.parse_args()
    if a.skip_tests and a.site and not a.check_only:
        ap.error('--skip-tests cannot be used to publish')
    frozen=collect(ROOT,a.profile)
    game_frozen=frozen if a.profile in ('game', 'crazygames') else collect(ROOT,'game')
    if a.profile == 'crazygames':
        summary = delivery_summary(frozen)
        say('CrazyGames delivery plan: ' + json.dumps(summary))
        if summary['bundleFiles'] > 1500 or summary['bundleBytes'] > 250_000_000:
            say('CrazyGames bundle exceeds the published upload limits'); sys.exit(2)
        say('Initial-load timing, external-media approval and PEGI 12 content review remain separate portal checks.')
    say('[1/4] syntax + truncation gate');
    if not node_check(): sys.exit(2)
    say('[2/4] script order');
    if not order_check(): sys.exit(3)
    if not asset_check(game_frozen): sys.exit(3)
    if a.skip_tests: say('[3/4] tests skipped (--skip-tests)')
    else:
        say('[3/4] test suites')
        if not run_tests(a.browser, a.mobile or a.profile == 'site-shell'): sys.exit(4)
    verify(ROOT,frozen)
    if collect(ROOT,a.profile)!=frozen: raise ValueError('Release file list changed during validation')
    if a.profile=='site-shell':
        verify(ROOT,game_frozen)
        if collect(ROOT,'game')!=game_frozen: raise ValueError('Game release file list changed during shell validation')
    if a.check_only or not a.site:
        say('[4/4] gate passed; nothing published' + ('' if a.check_only else ' (no site repo given)')); return
    say('[4/4] publish')
    if not publish(a.site, a.dest, a.profile, frozen): sys.exit(5)

if __name__ == '__main__':
    main()
