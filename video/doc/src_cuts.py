import subprocess, numpy as np, json, sys
out = {}
for src in ["media/real/lordstown_questions.mp4", "media/real/lordstown_nicknames.mp4", "media/real/wosn_2016.mp4"]:
    fr = subprocess.run(["ffprobe","-v","error","-select_streams","v","-show_entries","stream=r_frame_rate","-of","csv=p=0",src],capture_output=True,text=True).stdout.strip()
    n, d = map(int, fr.split("/")); fps = n / d
    raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-vf","scale=64:36","-f","rawvideo","-pix_fmt","gray","-"],capture_output=True).stdout
    F = np.frombuffer(raw, np.uint8).reshape(-1,36,64).astype(np.float32)
    dd = np.r_[0, np.abs(np.diff(F,axis=0)).mean((1,2))]
    cuts = [round(i / fps, 4) for i in range(1, len(F)-1) if dd[i] > 10 and dd[i] > 2.5*max(dd[i-1], dd[i+1], 1.5)]
    out[src] = dict(fps=fps, cuts=cuts); print(src, fps, len(cuts), cuts[:80])
json.dump(out, open("doc/src_cuts.json","w"))
