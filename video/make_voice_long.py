"""Long-form narration: same Kokoro blend and processing as make_voice2.py, chapter-aware pacing."""
import json, re, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("voices/model.onnx", "voices/voices.npz")
v = np.load("voices/voices.npz")
voice = v["am_michael"] * 0.6 + v["am_fenrir"] * 0.4
items, chapter = [], None
for raw in open("script_long.txt"):
    raw = raw.strip()
    if not raw: continue
    if raw.startswith("#CH"): chapter = raw[3:].strip(); items.append(("CH", chapter)); continue
    items.append(("L", raw.replace("…", "...")))
PUNCHY = re.compile(r"^(Three years|Fifteen wins|Twenty-three to twenty|Sixty touchdown|Five thousand|One season|"
                    r"A torn ACL|Another season|So he rebuilt|Joe Burrow didn't wonder|But to himself|It's what you do)")
out, segs, chaps, t, sr = [], [], [], 0.0, 24000
li = 0
for kind, text in items:
    if kind == "CH":
        gap = 0.6 if not segs else 1.9                 # room for the chapter card
        out.append(np.zeros(int(gap * sr), np.float32)); t += gap
        chaps.append({"title": text, "t": round(t - gap + (0.3 if segs else 0), 3)}); continue
    spd = 0.9 if PUNCHY.match(text) else 0.96
    a, sr = k.create(text, voice=voice, speed=spd, lang="en-us")
    nz = np.nonzero(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1500]
    segs.append({"i": li, "text": text, "chapter": chaps[-1]["title"], "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
    pause = 0.75 if (PUNCHY.match(text) or len(text) < 28) else 0.42
    out += [a, np.zeros(int(pause * sr), np.float32)]
    t += len(a) / sr + pause; li += 1
sf.write("audio/vo_long_raw.wav", np.concatenate(out), sr)
json.dump({"lines": segs, "chapters": chaps}, open("audio/timings_long.json", "w"), indent=1)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "audio/vo_long_raw.wav", "-af",
    "aresample=48000,asetrate=48000*0.917,aresample=48000,atempo=1.0905,"
    "highpass=f=60,equalizer=f=140:t=q:w=1:g=3,equalizer=f=3200:t=q:w=1.5:g=-2,equalizer=f=9000:t=h:w=1:g=2,"
    "acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120:makeup=4,"
    "aecho=0.8:0.4:35|60:0.12|0.07,loudnorm=I=-16:TP=-1.5", "-ar", "44100", "audio/voiceover_long.wav"], check=True)
print("lines", li, "total", round(t, 1), "s")
