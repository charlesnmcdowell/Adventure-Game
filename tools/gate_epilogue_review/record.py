"""Record only the reviewed dialogue patch, using existing casting and a hard cap.
Default mode audits account/model/voices. --generate stages audio without installing it.
No automatic retry of uncertain paid requests; credentials never enter the report.
"""
import argparse, concurrent.futures, hashlib, json, time, urllib.request, urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
KEY = Path(r'C:\Users\charl\OneDrive\Documents\TTRPG\Kenji\Game init files\tts_config.json')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true')
    args = parser.parse_args()
    key = json.loads(KEY.read_text(encoding='utf-8'))['api_key']
    patch = json.loads((HERE/'patch.json').read_text(encoding='utf-8'))
    casting = json.loads((ROOT/'tools/voice_casting.json').read_text(encoding='utf-8'))
    auditions = json.loads((ROOT/'tools/c3_auditions.json').read_text(encoding='utf-8'))
    state_path = HERE/'recording.json'
    state = json.loads(state_path.read_text()) if state_path.exists() else {'reserved': 0, 'completed': {}, 'attempts': []}

    def save():
        temp = state_path.with_suffix('.tmp')
        temp.write_text(json.dumps(state, indent=2), encoding='utf-8')
        temp.replace(state_path)

    def request(path, body=None):
        headers = {'xi-api-key': key}
        if body is not None:
            headers['Content-Type'] = 'application/json'
        return urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io/v1/'+path,
            data=None if body is None else json.dumps(body).encode(), headers=headers), timeout=90)

    def get(path):
        # Retry only read-only account/model metadata. Paid speech requests are
        # never retried here, and completed files are reused by verified hash.
        for attempt in range(3):
            try:
                with request(path) as response:
                    return json.load(response)
            except urllib.error.HTTPError as exc:
                if exc.code != 429 or attempt == 2:
                    raise
                time.sleep(30)

    for e in patch['entries']:
        assert e['voice'] == casting[e['speaker']] == auditions[e['speaker']]['voice_id'], 'Casting mismatch'
        assert e['characters'] == len(e['text']) and len(e['text']) < 5000
    sub = get('user/subscription')
    model = next(m for m in get('models') if m['model_id'] == patch['model'])
    rates = model.get('model_rates') or {}
    multiplier = rates.get('character_cost_multiplier', 1)*rates.get('cost_discount_multiplier', 1)
    assert multiplier == 1, 'Recalculate estimate for changed model rates'

    def voice_audit(voice):
        v = get('voices/'+voice)
        share = v.get('sharing') or {}
        return {'voice': voice, 'name': v.get('name'), 'category': v.get('category'), 'isOwner': v.get('is_owner'),
                'rate': share.get('rate'), 'financialRewards': share.get('financial_rewards_enabled')}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        voices = list(pool.map(voice_audit, sorted({e['voice'] for e in patch['entries']})))
    assert all(v['category'] in ('generated', 'cloned', 'premade') and
               not (v['financialRewards'] and v['isOwner'] is not True) for v in voices), 'Unverified voice rate'
    pending = []
    for e in patch['entries']:
        record = state['completed'].get(e['hash'])
        dest = HERE/'audio'/e['speaker']/Path(e['path']).name
        if not (record and dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() == record['audioHash']):
            if any(a['hash'] == e['hash'] for a in state['attempts']):
                raise RuntimeError('Uncertain previous attempt requires reconciliation, not a paid retry')
            pending.append(e)
    remaining = sub['character_limit']-sub['character_count']
    estimate = sum(e['characters'] for e in pending)
    assert state['reserved']+estimate+patch['reserve'] <= min(40000, patch['creditCeiling'])
    assert estimate+patch['reserve'] <= remaining, 'Insufficient credits; no new speech requested'
    report = {'remainingCredits': remaining, 'pendingClips': len(pending), 'estimatedCredits': estimate,
              'reserve': patch['reserve'], 'voices': voices, 'checkedAt': time.time()}
    (HERE/'budget.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report), flush=True)
    if not args.generate:
        return
    state.setdefault('startingCount', sub['character_count'])
    for e in pending:
        current = get('user/subscription')
        assert current['character_limit']-current['character_count'] >= e['characters']+patch['reserve']
        state['reserved'] += e['characters']
        state['attempts'].append({'hash': e['hash'], 'path': e['path'], 'voice': e['voice'], 'at': time.time()})
        save()
        with request('text-to-speech/'+e['voice']+'?output_format=mp3_44100_128',
            {'text': e['text'], 'model_id': patch['model'], 'voice_settings': {'stability': .5, 'similarity_boost': .8}}) as response:
            data = response.read()
            assert 'audio' in response.headers.get('Content-Type', '') and len(data) > 1000, 'Invalid recording'
            cost = response.headers.get('character-cost')
            receipt = {'voice': e['voice'], 'model': patch['model'], 'audioHash': hashlib.sha256(data).hexdigest(),
                       'bytes': len(data), 'cost': float(cost) if cost is not None else None,
                       'requestId': response.headers.get('request-id'), 'textHash': e['hash']}
        dest = HERE/'audio'/e['speaker']/Path(e['path']).name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        state['completed'][e['hash']] = receipt
        save()
        print(json.dumps({'recorded': e['path'], 'voice': e['voice'], 'cost': receipt['cost']}), flush=True)
        if receipt['cost'] is not None and receipt['cost'] > e['characters']:
            raise RuntimeError('Unexpected billing; stopped before the next clip')
    after = get('user/subscription')
    state['endingCount'] = after['character_count']
    state['accountDelta'] = after['character_count']-state['startingCount']
    state['remainingCredits'] = after['character_limit']-after['character_count']
    state['reportedClipCosts'] = sum(r['cost'] or 0 for r in state['completed'].values())
    save()
    print(json.dumps({k: state[k] for k in ['accountDelta', 'reportedClipCosts', 'remainingCredits']}), flush=True)

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(json.dumps({'error': type(exc).__name__, 'message': str(exc)}), flush=True)
        raise SystemExit(1)
