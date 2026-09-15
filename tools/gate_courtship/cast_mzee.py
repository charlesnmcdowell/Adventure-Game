"""Fill the missing Mzee casting using his existing project voice profile.
Design/save requests are never automatically retried. Responses are persisted
before the next operation so an interrupted run can be reconciled without paying twice.
"""
import base64, hashlib, json, runpy, sys, time, urllib.request
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
KENJI = Path(r'C:\Users\charl\OneDrive\Documents\TTRPG\Kenji')
KEY = json.loads((KENJI/'Game init files/tts_config.json').read_text(encoding='utf-8'))['api_key']
STATE = HERE/'mzee-casting.json'
state = json.loads(STATE.read_text()) if STATE.exists() else {}
def save():
    tmp=STATE.with_suffix('.tmp');tmp.write_text(json.dumps(state,indent=2),encoding='utf-8');tmp.replace(STATE)
def request(path, body=None):
    headers={'xi-api-key':KEY}
    if body is not None: headers['Content-Type']='application/json'
    with urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io/v1/'+path,
            data=None if body is None else json.dumps(body).encode(),headers=headers),timeout=120) as response:
        return json.load(response)

sys.argv=[str(ROOT/'tools/audition_c3_voices.py'),str(ROOT),str(KENJI),'--only','thornwise']
author=runpy.run_path(str(ROOT/'tools/audition_c3_voices.py'),run_name='mzee_profile')
character=next(c for c in author['cast']() if c['id']=='thornwise')
description=author['description'](character)
text=author['audition_text'](character)
sub=request('user/subscription')
assert sub['character_limit']-sub['character_count']>5000, 'Leave a conservative budget for design and five clips'
state.setdefault('startingCount',sub['character_count'])
state.update({'description':description,'text':text,'name':character['name']})
cast_path=ROOT/'tools/voice_casting.json'; audition_path=ROOT/'tools/c3_auditions.json'
casting=json.loads(cast_path.read_text(encoding='utf-8'))
assert not casting.get('thornwise') or casting['thornwise']==state.get('voiceId'), 'Do not overwrite an existing cast'
if not state.get('previews'):
    assert not state.get('designAttempt'), 'Reconcile the previous design request before retrying'
    used,limit=sub.get('voice_slots_used'),sub.get('voice_limit')
    assert used is None or limit is None or used<limit, 'No free voice slot; do not delete another voice'
    state['designAttempt']=time.time();save()
    result=request('text-to-voice/design',{'voice_description':description,'text':text,'model_id':'eleven_ttv_v3','auto_generate_text':False})
    previews=result['previews'];assert previews
    state['previews']=[{k:p.get(k) for k in ('generated_voice_id','duration_secs')} for p in previews]
    for i,p in enumerate(previews):
        data=base64.b64decode(p['audio_base_64']);assert len(data)>1000
        dest=HERE/f'mzee-audition-{i+1}.mp3';dest.write_bytes(data)
        state['previews'][i]['audioHash']=hashlib.sha256(data).hexdigest()
    save()
if not state.get('voiceId'):
    assert not state.get('saveAttempt'), 'Reconcile the previous library save request before retrying'
    state['saveAttempt']=time.time();save()
    result=request('text-to-voice',{'voice_name':'VG: Mzee Kamau','voice_description':description,'generated_voice_id':state['previews'][0]['generated_voice_id']})
    state['voiceId']=result['voice_id'];save()
voice=request('voices/'+state['voiceId'])
assert voice['name']=='VG: Mzee Kamau' and voice['category']=='generated'
casting['thornwise']=state['voiceId']
auditions=json.loads(audition_path.read_text(encoding='utf-8'))
auditions['thornwise']={'name':'Mzee Kamau','voice_id':state['voiceId'],'description':description,'text':text,
    'alternates':[p['generated_voice_id'] for p in state['previews'][1:]],'designed_at':time.strftime('%Y-%m-%d %H:%M')}
cast_path.write_text(json.dumps(casting,indent=1,ensure_ascii=False),encoding='utf-8')
audition_path.write_text(json.dumps(auditions,indent=1,ensure_ascii=False),encoding='utf-8')
audition=ROOT/'audio/vo/campaign/_auditions/thornwise.mp3';audition.parent.mkdir(exist_ok=True,parents=True)
audition.write_bytes((HERE/'mzee-audition-1.mp3').read_bytes())
after=request('user/subscription');state['endingCount']=after['character_count'];state['accountDelta']=after['character_count']-state['startingCount'];save()
print(json.dumps({'voiceId':state['voiceId'],'name':voice['name'],'profile':description,'designAccountDelta':state['accountDelta']}))
