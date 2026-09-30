# Turns real clips into frame sequences the video uses instead of the animated stand-ins.
#
# 1. Put clips in media/clips/ named after the slot they replace:
#      rpg.mp4 (Undertale)   br.mp4 (Fortnite)   fps.mp4 (Valorant)   craft.mp4 (Minecraft)
#      vlog.mp4  ad.mp4  music.mp4  podcast.mp4  city.mp4
#    Optional: start offsets in media/clips/starts.txt, e.g. "fps 12.5" (a third value limits the loop length)
# 2. python3 prep_media.py
# 3. Re-render (see README). Game name tags switch automatically to the real game names.
import json, os, subprocess, sys
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))
CLIPS, FRAMES = os.path.join(HERE, 'media/clips'), os.path.join(HERE, 'media/frames')
SLOTS = ['rpg', 'br', 'fps', 'craft', 'hk', 'amongus', 'vlog', 'ad', 'music', 'podcast', 'city',
         'skate', 'car', 'food', 'dance', 'fashion', 'travel', 'drone']
SECONDS = 8  # enough for every use in the timeline (clips loop if shorter)

starts, lengths = {}, {}
p = os.path.join(CLIPS, 'starts.txt')
if os.path.exists(p):
    for line in open(p):
        parts = line.split()
        if parts:
            starts[parts[0]] = float(parts[1])
            if len(parts) > 2: lengths[parts[0]] = float(parts[2])  # optional: loop only this many seconds

manifest = {}
for slot in SLOTS:
    src = next((os.path.join(CLIPS, f) for f in sorted(os.listdir(CLIPS)) if os.path.splitext(f)[0] == slot), None) if os.path.isdir(CLIPS) else None
    if not src:
        continue
    out = os.path.join(FRAMES, slot)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(os.path.join(out, f))
    subprocess.run([FF, '-loglevel', 'error', '-y', '-ss', str(starts.get(slot, 0)), '-i', src, '-t', str(lengths.get(slot, SECONDS)),
                    '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080', '-q:v', '2',
                    os.path.join(out, '%05d.jpg')], check=True)
    n = len(os.listdir(out))
    manifest[slot] = {'frames': n}
    print(f'{slot}: {n} frames from {os.path.basename(src)}')

with open(os.path.join(HERE, 'media/manifest.js'), 'w') as f:
    f.write('window.MEDIA = ' + json.dumps(manifest, indent=2) + ';\n')
print('wrote media/manifest.js' + ('' if manifest else ' (no clips found: stand-ins will be used)'))
