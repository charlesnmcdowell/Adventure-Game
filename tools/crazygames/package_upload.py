"""Zip a completed gated candidate, checking every bundled byte against its manifest."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
NAME = 'crazygames-upload-20260916-r2'
candidate = ROOT / 'dist' / NAME
manifest = json.loads((ROOT / 'dist' / (NAME + '-media-manifest.json')).read_text())
expected = {p: row for p, row in manifest['files'].items() if row.get('delivery') != 'external'}
actual = {p.relative_to(candidate).as_posix() for p in candidate.rglob('*') if p.is_file()}
assert actual == set(expected), 'Candidate contains missing or unexpected files'
assert 'index.html' in actual
for p, row in expected.items():
    assert hashlib.sha256((candidate / p).read_bytes()).hexdigest() == row['sha256'], p
dest = Path.home() / 'Downloads' / 'Adventurer-CrazyGames-Upload-20260916-r2.zip'
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(expected):
        z.write(candidate / p, p)
with zipfile.ZipFile(dest) as z:
    assert set(z.namelist()) == set(expected)
    for p, row in expected.items():
        assert hashlib.sha256(z.read(p)).hexdigest() == row['sha256'], p
report = {'zip': str(dest), 'zipBytes': dest.stat().st_size,
          'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
          'files': len(expected), 'uncompressedBytes': sum(r['bytes'] for r in expected.values()),
          'indexAtRoot': True, 'manifestExcluded': True, 'everyFileHashVerified': True}
(ROOT / 'test/reports/crazygames-upload/zip-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
