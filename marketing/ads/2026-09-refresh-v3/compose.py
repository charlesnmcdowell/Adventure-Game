"""45.6-second Facebook Reel: complete game canvas and unchanged original audio."""
from pathlib import Path
import argparse, concurrent.futures, json, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ADS = ROOT.parent
WORK = ROOT / 'work'
WORK.mkdir(exist_ok=True)
FF = r'C:\Program Files (x86)\Steam\steamapps\common\SpellForceThree\editor\tools\ffmpeg\bin\ffmpeg.exe'
PROBE = str(Path(FF).with_name('ffprobe.exe'))
OUT = ROOT / 'Adventurer_Gameplay_45s6.mp4'
RAW = ROOT / 'raw/gameplay.webm'
GOLD = (219, 183, 109, 255)
WHITE = (245, 240, 227, 255)

# Duration in output frames. Crop coordinates are in the game's 1280x760 space.
# Names identify markers written by capture.js, not timestamps guessed by hand.
CUTS = [
 ('appearance',45,(0,0,1280,760),'CREATE YOUR CHARACTER',''),
 ('creation',75,(0,0,1280,760),'CHOOSE YOUR NAME',''),
 ('party',90,(0,0,1280,760),'JOIN A PARTY',''),
 ('mage',90,(0,0,1280,760),'FIRE BALL',''),
 ('necromancy',48,(0,0,1280,760),'NECROMANCY',''),
 ('thralls_spawned',30,(0,0,1280,760),'THE FALLEN FIGHT FOR YOU',''),
 ('relationship',90,(0,0,1280,760),'BUILD RELATIONSHIPS',''),
 ('child_name',90,(0,0,1280,760),'START A FAMILY',''),
 ('buy_mage',75,(0,0,1280,760),'VISIT THE BLACKSMITH','Buy the Mage Set'),
 ('buy_leathers',60,(0,0,1280,760),'CHANGE YOUR EQUIPMENT','Rogue: Night Leathers'),
 ('buy_ranger',60,(0,0,1280,760),'CHANGE YOUR EQUIPMENT','Ranger Set'),
 ('buy_warrior',60,(0,0,1280,760),'CHANGE YOUR EQUIPMENT','Warrior Set'),
 ('buy_brick',105,(0,0,1280,760),'BUY A BRICK HOUSE',''),
 ('samurai',60,(0,0,1280,760),'THE GREEN-EYED PASS',''),
 ('gate_quest2',60,(0,0,1280,760),"VARENHOLM’S GATE",'Quest 2: The Open Hand'),
 ('gate_scroll',90,(0,0,1280,760),"VARENHOLM’S GATE",''),
 ('gate_father',90,(0,0,1280,760),"VARENHOLM’S GATE",''),
]
SECONDS=45.6
END_START=40.6
assert sum(x[1] for x in CUTS) == round(END_START*30)

def run(args):
    r = subprocess.run([str(x) for x in args], capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr.decode(errors='replace')[-6000:])
    return r.stdout

def font(size, serif=False):
    return ImageFont.truetype(str(Path('C:/Windows/Fonts') / ('georgiab.ttf' if serif else 'segoeui.ttf')), size)

def graphics(name, title, sub, fh, fy):
    im=Image.new('RGBA',(1080,1920));d=ImageDraw.Draw(im)
    def center(txt,y,size,color=WHITE,serif=False):
        f=font(size,serif)
        while d.textlength(txt,font=f)>960:
            size-=1;f=font(size,serif)
        d.text(((1080-d.textlength(txt,font=f))/2,y),txt,font=f,fill=color,stroke_width=2,stroke_fill=(0,0,0,210))
    center('ADVENTURER',195,74,GOLD,True)
    center('A LIFE. SEVERAL TIMES OVER.',297,26)
    center(title,440,42,GOLD,True)
    # No opaque overlays, inset borders, zooms, or crops over the game screen.
    if sub:center(sub,1290,34)
    center('neverendingnarratives.com/adventurer',1640,31,GOLD)
    dest=WORK/(name+'_overlay.png');im.save(dest);return dest

def render_clip(i, cut, mark):
    name,frames,box,title,sub=cut
    # Source capture is 150% of the game's logical canvas.
    x,y,w,h=[round(n*1.5/2)*2 for n in box]
    fh=round(1080*h/w/2)*2
    fy=570
    overlay=graphics(name,title,sub,fh,fy)
    dur=frames/30
    # Use the whole selected action, avoiding scene switches around each marker.
    srcdur=min(mark['duration']-.10,dur)
    if name in ['relationship','child_name'] or name.startswith('buy_'):srcdur=mark['duration']-.15
    if name=='necromancy':srcdur=2.6
    # Playwright starts its video clock after page creation. Frame inspection
    # identified this 0.3s lead-in as safely including each action's wind-up.
    start=mark['start']-.30
    scale=dur/srcdur
    dest=WORK/f'clip_{i:02d}_{name}.mp4'
    graph=(f'[0:v]trim=duration={srcdur:.6f},setpts={scale:.9f}*(PTS-STARTPTS),fps=30,split=2[a][b];'
      '[a]crop=640:1140:640:0,scale=180:320,boxblur=10:2,scale=1080:1920,'
      'eq=brightness=-0.17:saturation=0.55,setsar=1[bg];'
      f'[b]crop={w}:{h}:{x}:{y},scale=1080:{fh}:flags=lanczos,setsar=1[fg];'
      f'[bg][fg]overlay=0:{fy}:shortest=1[scene];'
      '[scene][1:v]overlay=0:0:shortest=1,format=yuv420p[v]')
    run([FF,'-hide_banner','-loglevel','error','-y','-threads','2','-ss',f'{start:.6f}','-i',RAW,
       '-loop','1','-i',overlay,'-filter_complex_threads','2','-filter_complex',graph,'-map','[v]',
       '-frames:v',frames,'-r','30','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18','-an',dest])
    print('Rendered',name,frames,'frames',flush=True)
    return dest

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--render-only',nargs='*');args=parser.parse_args()
    data=json.loads((ROOT/'marks.json').read_text());assert not data['errors'],data['errors']
    marks={x['name']:x for x in data['marks']}
    missing=[x[0] for x in CUTS if x[0] not in marks];assert not missing,missing
    soundtrack=ADS/'Adventurer_Facebook_Reel.mp4'
    def render_or_keep(im):
        i,cut=im;dest=WORK/f'clip_{i:02d}_{cut[0]}.mp4'
        if args.render_only is not None and cut[0] not in args.render_only:
            assert dest.exists(),dest
            return dest
        return render_clip(i,cut,marks[cut[0]])
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        clips=list(pool.map(render_or_keep,enumerate(CUTS)))
    end=WORK/'clip_end.mp4'
    run([FF,'-v','error','-y','-loop','1','-i',ADS/'work/still_end.png','-vf','setsar=1',
         '-frames:v','150','-r','30','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-an',end])
    clips.append(end)
    concat=WORK/'concat.txt';concat.write_text(''.join(f"file '{p.as_posix()}'\n" for p in clips),encoding='utf-8')
    # Keep the original ad's audio packets unchanged: its narration and music
    # only, at the original timing. The video retains the five-second end card.
    run([FF,'-v','error','-y','-f','concat','-safe','0','-i',concat,'-i',soundtrack,
       '-map','0:v:0','-map','1:a:0','-vf','setpts=N/(30*TB),fps=30','-r','30',
       '-c:v','libx264','-threads','4','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',
       '-video_track_timescale','30000','-c:a','copy','-t',str(SECONDS),'-movflags','+faststart',OUT])
    probe=json.loads(run([PROBE,'-v','error','-show_streams','-show_format','-of','json',OUT]))
    v=next(x for x in probe['streams'] if x['codec_type']=='video')
    assert (v['width'],v['height'])==(1080,1920)
    assert int(v['nb_frames'])==round(SECONDS*30),v
    assert abs(float(probe['format']['duration'])-SECONDS)<.001,probe['format']
    t=0;timeline=[]
    for name,frames,box,title,sub in CUTS:
        timeline.append({'start':t,'end':t+frames/30,'name':name,'title':title,'description':sub});t+=frames/30
    timeline.append({'start':END_START,'end':SECONDS,'name':'original_end_card'})
    (ROOT/'edit_manifest.json').write_text(json.dumps({'timeline':timeline,'video':probe,'originalAdPreserved':True},indent=2))
    print('WROTE',OUT,OUT.stat().st_size,flush=True)

if __name__=='__main__':main()
