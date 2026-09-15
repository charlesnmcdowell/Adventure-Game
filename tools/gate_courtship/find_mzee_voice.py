"""Read-only search of the account library for the missing archdruid casting."""
import json, urllib.request
from pathlib import Path
key = json.loads(Path(r'C:\Users\charl\OneDrive\Documents\TTRPG\Kenji\Game init files\tts_config.json').read_text(encoding='utf-8'))['api_key']
req = urllib.request.Request('https://api.elevenlabs.io/v1/voices', headers={'xi-api-key': key})
with urllib.request.urlopen(req, timeout=45) as response:
    data = json.load(response)
matches = [{k:v.get(k) for k in ('voice_id','name','category','description','labels')} for v in data.get('voices',[]) if any(term in (v.get('name','')+' '+v.get('description','')).lower() for term in ('mzee','kamau','thornwise','archdruid'))]
print(json.dumps({'libraryCount':len(data.get('voices',[])), 'matches':matches}, indent=2))
Path(__file__).with_name('mzee-library-search.json').write_text(json.dumps({'matches':matches},indent=2),encoding='utf-8')
