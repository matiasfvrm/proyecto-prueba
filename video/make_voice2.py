"""Narration v2: Kokoro (michael+fenrir blend), dramatic pacing, documentary processing."""
import json, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("voices/model.onnx", "voices/voices.npz")
v = np.load("voices/voices.npz")
voice = v["am_michael"] * 0.6 + v["am_fenrir"] * 0.4
lines = [l.strip().replace("…", "...") for l in open("script.txt") if l.strip()]
# pause after each line (seconds): longer on dramatic beats, short in the montage run
PAUSE = {0: .55, 1: .45, 2: .35, 3: .35, 4: .35, 5: .8, 6: .45, 7: .9, 8: .35, 9: 1.1,
         10: .25, 11: .2, 12: .15, 13: .15, 14: .15, 15: .15, 16: .2, 17: 1.0, 18: .5,
         19: .6, 20: .7, 21: .3, 22: .45, 23: 1.0, 24: .6, 25: 0}
SPEED = {i: 0.9 for i in range(len(lines))}
for i in range(10, 18): SPEED[i] = 0.98          # montage reads with more drive
for i in (9, 23, 25): SPEED[i] = 0.84             # land the key lines slowly
out, segs, t = [], [], 0.0
for i, l in enumerate(lines):
    a, sr = k.create(l, voice=voice, speed=SPEED[i], lang="en-us")
    nz = np.nonzero(np.abs(a) > 0.01)[0]          # trim edge silence
    a = a[max(0, nz[0] - 600): nz[-1] + 1500]
    segs.append({"i": i, "text": l, "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
    out += [a, np.zeros(int(PAUSE[i] * sr), np.float32)]
    t += len(a) / sr + PAUSE[i]
sf.write("audio/vo_raw.wav", np.concatenate(out), sr)
json.dump(segs, open("audio/timings.json", "w"), indent=1)
# deeper + warmer: -1.5 semitone pitch, low-mid warmth, de-harsh, compression, short room
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "audio/vo_raw.wav", "-af",
    "aresample=48000,asetrate=48000*0.917,aresample=48000,atempo=1.0905,"
    "highpass=f=60,equalizer=f=140:t=q:w=1:g=3,equalizer=f=3200:t=q:w=1.5:g=-2,equalizer=f=9000:t=h:w=1:g=2,"
    "acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120:makeup=4,"
    "aecho=0.8:0.4:35|60:0.12|0.07,loudnorm=I=-16:TP=-1.5",
    "-ar", "44100", "audio/voiceover.wav"], check=True)
print("total", round(t, 2))
