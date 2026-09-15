'use strict';
const {spawnSync}=require('child_process');
const r=spawnSync(process.env.PYTHON||'python',['-c',String.raw`
import sys, json, tempfile
from pathlib import Path
sys.path.insert(0, 'tools')
from release_files import collect, verify, checked_bytes
with tempfile.TemporaryDirectory(prefix='adventurer-release-') as tmp:
 r=Path(tmp)
 (r/'tools').mkdir()
 (r/'tools/release_manifest.json').write_text(json.dumps({'required':['index.html','assets'], 'extensions':{'assets':['.png']}, 'excludedDirectories':['source']}))
 (r/'index.html').write_text('valid')
 (r/'assets/source').mkdir(parents=True)
 (r/'assets/hero.png').write_bytes(b'art')
 (r/'assets/source/working.png').write_bytes(b'source')
 frozen=collect(r)
 assert set(frozen)=={'index.html','assets/hero.png'}
 verify(r,frozen)
 (r/'index.html').write_text('changed')
 for action in [lambda:verify(r,frozen),lambda:checked_bytes(r,frozen['index.html'])]:
  try: action()
  except ValueError: pass
  else: raise AssertionError('changed release accepted')
 (r/'index.html').unlink()
 try: collect(r)
 except ValueError: pass
 else: raise AssertionError('missing entry accepted')
print('Release manifest: source exclusion, missing input and changed snapshot checks passed.')
`],{encoding:'utf8'});
process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)console.error(r.error);if(r.status!==0)process.exitCode=1;
