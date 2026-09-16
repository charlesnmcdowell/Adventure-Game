"""Declared runtime inputs and immutable hash manifests; no publication side effects."""
import hashlib
import json
from pathlib import Path

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as src:
        for chunk in iter(lambda: src.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def collect(root, profile='game'):
    root = Path(root).resolve()
    if profile == 'site-shell':
        mapping = {'index.html': 'tools/mobile_site/index.html', 'manifest.webmanifest': 'manifest.webmanifest'}
        mapping.update({f'assets/app/icon-{n}.png': f'assets/app/icon-{n}.png' for n in (180,192,512)})
    else:
        rules = json.loads((root / 'tools/release_manifest.json').read_text())
        mapping = {}
        for top in rules['required']:
            source = root / top
            if not source.exists():
                raise ValueError(f'Missing required release input: {top}')
            if source.is_file():
                mapping[top] = top
                continue
            for p in sorted(source.rglob('*')):
                if not p.is_file():
                    continue
                relative = p.relative_to(root)
                if p.name in rules.get('excludedFileNames', []):
                    continue
                if any(d in rules['excludedDirectories'] for d in relative.parts):
                    continue
                if p.suffix.lower() in rules['extensions'][top]:
                    mapping[relative.as_posix()] = relative.as_posix()
    frozen = {}
    for destination, source in mapping.items():
        p = root / source
        if not p.is_file() or not p.resolve().is_relative_to(root):
            raise ValueError(f'Missing or external release input: {source}')
        frozen[destination] = {'source': source, 'sha256': digest(p), 'bytes': p.stat().st_size}
    return frozen

def verify(root, frozen):
    root = Path(root)
    for row in frozen.values():
        p = root / row['source']
        if not p.is_file() or digest(p) != row['sha256']:
            raise ValueError(f'Release input changed after validation: {row["source"]}')

def checked_bytes(root, row):
    data = (Path(root) / row['source']).read_bytes()
    if hashlib.sha256(data).hexdigest() != row['sha256']:
        raise ValueError(f'Release input changed before copy: {row["source"]}')
    return data
