"""Narration bridges for the documentary cut: same Kokoro blend and processing as the previous versions."""
import json, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("voices/model.onnx", "voices/voices.npz")
v = np.load("voices/voices.npz"); voice = v["am_michael"] * 0.6 + v["am_fenrir"] * 0.4
LINES = {
 "v01": "Athens, Ohio. A small college town, where his father, Jim, coached football for decades.",
 "v02": "By 2014, he was Ohio's Mister Football. And the only school he wanted... was Ohio State.",
 "v03": "In Columbus, he waited. Behind J.T. Barrett. Year after year.",
 "v04": "He never started a game there. In 2017, he broke his throwing hand. In 2018, the job went to someone else.",
 "v05": "So he graduated early. And he left.",
 "v06": "At LSU, he won the job. Then, in 2019, he had a season nobody saw coming.",
 "v07": "Five thousand, six hundred and seventy-one yards. Sixty touchdowns. The Heisman Trophy.",
 "v08": "And a perfect season. Fifteen and oh. National champions.",
 "v09": "In April 2020, Cincinnati made him the first pick in the draft.",
 "v10": "Ten games into his rookie season, his knee gave out. A torn ACL. A torn MCL.",
 "v11": "He came back the next year, and took the Bengals all the way to the Super Bowl.",
 "v12": "They lost by three. Twenty-three to twenty.",
 "v13": "Then, in 2023, his throwing wrist. Another season, cut short.",
 "v14": "In 2024, he led the entire league in passing yards and touchdowns. Comeback Player of the Year. Again.",
 "v15": "Off the field, he's always been a little different.",
 "v16": "The kid who just wanted the ball. The backup who never started. The quarterback who keeps getting back up.",
 "v17": "His story isn't finished yet.",
}
SLOW = {"v05", "v12", "v17", "v16"}
meta = {}
for key, text in LINES.items():
    a, sr = k.create(text, voice=voice, speed=0.88 if key in SLOW else 0.94, lang="en-us")
    nz = np.nonzero(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1500]
    sf.write(f"doc/vo/{key}_raw.wav", a, sr)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"doc/vo/{key}_raw.wav", "-af",
        "aresample=48000,asetrate=48000*0.917,aresample=48000,atempo=1.0905,highpass=f=60,"
        "equalizer=f=140:t=q:w=1:g=3,equalizer=f=3200:t=q:w=1.5:g=-2,equalizer=f=9000:t=h:w=1:g=2,"
        "acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120:makeup=4,aecho=0.8:0.4:35|60:0.12|0.07,"
        "loudnorm=I=-16:TP=-1.5", "-ar", "44100", f"doc/vo/{key}.wav"], check=True)
    meta[key] = {"text": text, "dur": round(len(a) / sr, 2)}
json.dump(meta, open("doc/vo/vo.json", "w"), indent=1)
print(sum(m["dur"] for m in meta.values()), "s of narration")
