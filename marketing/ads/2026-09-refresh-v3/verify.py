"""Decode the deliverable and verify duration, end-card boundary, motion and sound."""
from pathlib import Path
import hashlib, io, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from compose import FF, PROBE, ROOT, ADS, OUT, CUTS, SECONDS, END_START, run

def frame(t):
    return Image.open(io.BytesIO(run([FF,'-v','error','-ss',str(t),'-i',OUT,'-frames:v','1','-f','image2pipe','-vcodec','png','-']))).convert('RGB')

def main():
    meta=json.loads(run([PROBE,'-v','error','-show_streams','-show_format','-of','json',OUT]))
    video=next(s for s in meta['streams'] if s['codec_type']=='video')
    assert float(meta['format']['duration'])==SECONDS
    assert video['avg_frame_rate']=='30/1' and int(video['nb_frames'])==round(SECONDS*30)
    assert (video['width'],video['height'])==(1080,1920)
    # Decode every video and audio packet, treating decoding errors as failures.
    run([FF,'-v','error','-xerror','-i',OUT,'-f','null','-'])
    original=np.asarray(Image.open(ADS/'work/still_end.png').convert('RGB')).astype(float)
    end_errors={str(t):float(np.abs(np.asarray(frame(t)).astype(float)-original).mean()) for t in [END_START,END_START+.5,SECONDS-.1]}
    assert max(end_errors.values())<5,end_errors
    before=float(np.abs(np.asarray(frame(END_START-.05)).astype(float)-original).mean())
    assert before>15,before
    times=[1,3,5.5,8,10.8,12,14,17,19.5,20.8,22.4,24.4,26.5,28,30.2,31.8,33.7,36.2,39.2,43]
    sheet=Image.new('RGB',(5*216,4*414),(11,14,20));d=ImageDraw.Draw(sheet)
    for i,t in enumerate(times):
        im=frame(t);sheet.paste(im.resize((216,384)),(i%5*216,i//5*414+27))
        d.text((i%5*216+8,i//5*414+7),f'{t:05.1f}s',fill='white')
    sheet.save(ROOT/'review/final_contact_sheet.jpg',quality=94)
    # Independent motion checks for each captured location and animated outfit.
    motion={}
    for name,t in [('mage_purchase',19.2),('rogue_purchase',21.4),('ranger_purchase',23.4),('warrior_purchase',25.4),('house_purchase',28.7),('samurai',30.9),('quest2_travel',33),('hiwot_illustration',35.5),('father_illustration',38.5)]:
        a=np.asarray(frame(t).crop((0,570,1080,1212))).astype(float)
        b=np.asarray(frame(t+.6).crop((0,570,1080,1212))).astype(float)
        motion[name]=float(np.abs(a-b).mean())
        assert motion[name]>.03,(name,motion[name])
    pcm=np.frombuffer(run([FF,'-v','error','-i',OUT,'-map','0:a:0','-f','f32le','-ac','2','-ar','48000','-']),dtype='<f4')
    peak=float(np.abs(pcm).max());assert peak<1,peak
    source_pcm=np.frombuffer(run([FF,'-v','error','-i',ADS/'Adventurer_Facebook_Reel.mp4','-map','0:a:0','-f','f32le','-ac','2','-ar','48000','-']),dtype='<f4')
    assert np.array_equal(pcm,source_pcm),'Final audio differs from original ad'
    assert all(list(cut[2])==[0,0,1280,760] for cut in CUTS)
    evidence=json.loads((ROOT/'capture_evidence.json').read_text())
    assert [p['set'] for p in evidence['purchases']]==['mage','leathers','ranger','warrior']
    assert all(p['set']==p['equipped'] and p['before']-p['after']==p['cost'] for p in evidence['purchases'])
    assert evidence['house']=={'from':'cottage','to':'brick','cost':350}
    assert evidence['cutscenes']==['q2_notice:bounty','q1_death:death']
    report={'format':meta['format'],'video':video,'fullDecode':'passed','endCardStart':END_START,'endCardSeconds':5,
      'endCardMeanAbsolutePixelErrors':end_errors,'precedingSceneDifference':before,'motionMeanPixelDifferences':motion,
      'audioPeak':peak,'originalVoiceSha256':hashlib.sha256((ADS/'vo.mp3').read_bytes()).hexdigest(),
      'originalMusicSha256':hashlib.sha256((ADS/'battle_theme.wav').read_bytes()).hexdigest(),
      'audioIdenticalToOriginalAd':True,'gameDialogueAudioIncluded':False,
      'fullGameCanvasEveryShot':True,'captureEvidence':evidence,
      'originalEndCardSha256':hashlib.sha256((ADS/'work/still_end.png').read_bytes()).hexdigest(),
      'newVoiceCreditsUsed':0,'finalSha256':hashlib.sha256(OUT.read_bytes()).hexdigest()}
    (ROOT/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'duration':meta['format']['duration'],'frames':video['nb_frames'],'endCard':end_errors,'motion':motion,'audioIdenticalToOriginalAd':True,'audioPeak':peak},indent=2))

if __name__=='__main__':main()
