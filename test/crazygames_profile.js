'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), { spawnSync } = require('node:child_process');
const build = fs.readFileSync('tools/crazygames/release_config.js', 'utf8');
assert(build.includes("target: 'crazygames'"));
const bundled = spawnSync(process.env.PYTHON || 'python', ['-c', String.raw`
import sys, json, tempfile
from pathlib import Path
sys.path.insert(0,'tools')
from release_files import collect, delivery_summary, CG_VOICE_BASE, CG_LOCAL_VOICE_PREFIXES
import safe_publish
with tempfile.TemporaryDirectory(prefix='adventurer-cg-') as tmp:
 r=Path(tmp)/'source'; r.mkdir()
 for folder in ('tools/crazygames','js/core','audio/vo/M01','audio/vo/campaign/thornwise','audio/music'):
  (r/folder).mkdir(parents=True)
 (r/'index.html').write_text('game')
 (r/'js/core/release_config.js').write_text('website')
 (r/'tools/crazygames/release_config.js').write_text('locked')
 (r/'audio/vo/M01/general_1.mp3').write_bytes(b'voice')
 (r/'audio/vo/campaign/thornwise/new_1.mp3').write_bytes(b'local voice')
 (r/'audio/music/title.mp3').write_bytes(b'music')
 (r/'tools/release_manifest.json').write_text(json.dumps({'required':['index.html','js','audio'],'extensions':{'js':['.js'],'audio':['.mp3']},'excludedDirectories':[]}))
 web=collect(r); cg=collect(r,'crazygames')
 voice='audio/vo/M01/general_1.mp3'
 assert 'delivery' not in web[voice]
 assert cg[voice]['delivery']=='external' and cg[voice]['url']==CG_VOICE_BASE+'M01/general_1.mp3'
 assert cg['js/core/release_config.js']['source']=='tools/crazygames/release_config.js'
 assert delivery_summary(cg)['bundleFiles']==4
 safe_publish.ROOT=r
 base=Path(tmp)/'output'; base.mkdir()
 assert safe_publish.publish(base,'candidate','crazygames',cg)
 assert (base/'candidate/js/core/release_config.js').read_text()=='locked'
 assert not (base/'candidate'/voice).exists()
 assert (base/'candidate/audio/vo/campaign/thornwise/new_1.mp3').read_bytes()==b'local voice'
 assert (base/'candidate/audio/music/title.mp3').read_bytes()==b'music'
 assert (base/'candidate-media-manifest.json').exists()
 try: safe_publish.publish(base,'candidate','crazygames',cg)
 except ValueError: pass
 else: raise AssertionError('accepted a non-empty portal output directory')
print('CrazyGames profile: immutable policy, explicit external voices, local music, manifest and clean output enforced.')
print('LOCAL_PREFIXES=' + json.dumps(CG_LOCAL_VOICE_PREFIXES))
`], { encoding: 'utf8' });
process.stdout.write(bundled.stdout || ''); process.stderr.write(bundled.stderr || '');
assert.equal(bundled.status, 0);
const policy = vm.createContext({}); vm.runInContext(build, policy);
assert.deepEqual(Array.from(policy.ADV.Release.localVoicePrefixes), JSON.parse(bundled.stdout.split('LOCAL_PREFIXES=')[1].trim()), 'runtime and packager agree on local voice packs');
async function portal(active, unavailable = false) {
  const events = [], scripts = [];
  const ctx = vm.createContext({ ADV: { Release: { target: active ? 'crazygames' : 'website' } },
    Phaser: { Scenes: { RUNNING: 5 } }, setTimeout, clearTimeout, console: { warn() {} },
    window: { CrazyGames: { SDK: { init: async () => events.push('init'), game: Object.fromEntries(['loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop'].map(k => [k, () => events.push(k)])) } } },
    document: { createElement: () => ({}), head: { append: script => { scripts.push(script.src); if (unavailable) script.onerror(); else script.onload(); } } },
  });
  vm.runInContext(fs.readFileSync('js/ui/portal.js', 'utf8'), ctx);
  const P = ctx.ADV.Portal; await P.prepare();
  return { P, events, scripts };
}
(async () => {
  const web = await portal(false); assert.equal(web.scripts.length, 0);
  const { P, events } = await portal(true);
  const scene = (key, rest = {}) => ({ sys: { settings: { key, status: 5 } }, ...rest });
  P.sync([scene('Title')]); P.sync([scene('Creation')]);
  assert.deepEqual(events, ['init', 'loadingStart', 'loadingStop'], 'menus do not report gameplay');
  P.sync([scene('Town', { _arrivalPending: true })]); assert.equal(events.length, 3);
  P.sync([scene('Town', { currentPanel: 'board' })]); P.sync([scene('Town', { currentPanel: 'board' })]);
  P.sync([scene('Town', { currentPanel: 'settings' })]); P.sync([scene('Combat')]);
  assert.deepEqual(events.slice(3), ['gameplayStart', 'gameplayStop', 'gameplayStart']);
  const unavailable = await portal(true, true); assert.equal(unavailable.P.ready, false); assert(unavailable.P.error);
  console.log('CrazyGames adapter: website isolation, initialize-before-use, loading/gameplay lifecycle, deduplication and SDK failure fallback passed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
