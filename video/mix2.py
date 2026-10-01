"""Audio v2: assemble the score from Kevin MacLeod cues, place SFX from the edit plan,
duck under the narration and master. Then mux with the rendered picture."""
import subprocess, sys
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
from plan2 import build_plan, OFF, DUR, MUSIC

SR = 44100
N = int(DUR * SR)
def load(path, offset=0.0, dur=None):
    y, _ = librosa.load(path, sr=SR, mono=False, offset=offset, duration=dur)
    if y.ndim == 1: y = np.stack([y, y])
    return y.astype(np.float32)
def place(buf, y, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + y.shape[1]); y = y[:, :j - max(i, 0)]
    if i < 0: y = y[:, -i:]; i = 0
    l, r = np.sqrt(0.5 * (1 - pan)) * 1.414, np.sqrt(0.5 * (1 + pan)) * 1.414
    buf[0, i:j] += y[0] * gain * l; buf[1, i:j] += y[1] * gain * r
def fade(y, fin=0.0, fout=0.0):
    y = y.copy(); n = y.shape[1]
    if fin: k = min(n, int(fin * SR)); y[:, :k] *= np.linspace(0, 1, k) ** 2
    if fout: k = min(n, int(fout * SR)); y[:, n - k:] *= np.linspace(1, 0, k) ** 1.5
    return y

plan = build_plan()
music = np.zeros((2, N), np.float32)
for seg in MUSIC:   # each: file, src_start, dst_start, dst_end, fade_in, fade_out, gain
    y = load(seg["file"], seg["src"], seg["dst1"] - seg["dst0"] + seg.get("fout", 0))
    place(music, fade(y, seg.get("fin", 0), seg.get("fout", 0)), seg["dst0"], seg.get("gain", 1.0))

sfx = np.zeros((2, N), np.float32)
_cache = {}
for e in plan["sfx"]:
    if e["file"] not in _cache: _cache[e["file"]] = load(e["file"])
    y = _cache[e["file"]]
    if e.get("dur"): y = fade(y[:, :int(e["dur"] * SR)], 0.01, min(0.4, e["dur"] / 3))
    if e.get("rev"): y = y[:, ::-1].copy()
    if e.get("lp"):
        y = sosfilt(butter(2, e["lp"], "low", fs=SR, output="sos"), y, axis=1).astype(np.float32)
    place(sfx, y, e["t"], e.get("gain", 0.5), e.get("pan", 0.0))

vo, _ = librosa.load("audio/voiceover.wav", sr=SR, mono=True)
vo = np.stack([vo, vo]) * 0.92
voice = np.zeros((2, N), np.float32); place(voice, vo, OFF, 1.0)

# sidechain-style ducking of music under the voice (smoothed envelope)
env = np.abs(voice[0]); win = int(0.25 * SR)
env = np.convolve(env, np.ones(win) / win, mode="same")
duck = 1 - 0.55 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
music *= duck[None, :]
sfx_duck = 1 - 0.25 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
mix = voice + music * 0.62 + sfx * sfx_duck[None, :] * 0.8
mix /= max(1.0, np.abs(mix).max() / 0.98)
sf.write("audio/mix_v2.wav", mix.T, SR)
sf.write("audio/music_v2.wav", (music / max(1e-6, np.abs(music).max())).T, SR)
print("mixed")
if "--mux" in sys.argv:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "output/v2_silent.mp4", "-i", "audio/mix_v2.wav",
                    "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-map", "0:v", "-map", "1:a",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "9M", "-bufsize", "18M",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart",
                    "-shortest", "output/joe_burrow_v2.mp4"], check=True)
    print("muxed")
