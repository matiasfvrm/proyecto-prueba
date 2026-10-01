"""Audio v3: score from one track (+ tempo-matched drum layer), hit-point-aligned SFX, smooth ducking, master."""
import subprocess, sys, tempfile, os
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
import importlib
_plan = importlib.import_module(os.environ.get("PLAN", "plan3"))
build_plan, music_plan, OFF, DUR = _plan.build_plan, _plan.music_plan, _plan.OFF, _plan.DUR
TAG = os.environ.get("TAG", "v3")
VO = getattr(_plan, "VO_FILE", "audio/voiceover.wav")

SR = 44100
N = int(DUR * SR)
def load(path, offset=0.0, dur=None, tempo=None):
    if tempo:
        tmp = tempfile.mktemp(suffix=".wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(offset), "-i", path, "-t", str(dur / tempo + 1),
                        "-af", f"atempo={tempo}", "-ar", str(SR), "-ac", "2", tmp], check=True)
        y, _ = sf.read(tmp, dtype="float32"); os.remove(tmp)
        y = y.T[:, :int(dur * SR)]
    else:
        y, _ = librosa.load(path, sr=SR, mono=False, offset=offset, duration=dur)
        if y.ndim == 1: y = np.stack([y, y])
    return y.astype(np.float32)
def place(buf, y, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i < 0: y = y[:, -i:]; i = 0
    if i >= N: return
    j = min(N, i + y.shape[1]); y = y[:, :j - i]
    l, r = np.sqrt(1 - pan) if pan > 0 else 1.0, np.sqrt(1 + pan) if pan < 0 else 1.0
    buf[0, i:j] += y[0] * gain * l; buf[1, i:j] += y[1] * gain * r
def fade(y, fin=0.0, fout=0.0):
    y = y.copy(); n = y.shape[1]
    if fin > 0: k = min(n, max(1, int(fin * SR))); y[:, :k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    if fout > 0: k = min(n, max(1, int(fout * SR))); y[:, n - k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    return y
def lp(y, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), y, axis=1).astype(np.float32)
def hp(y, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), y, axis=1).astype(np.float32)

plan = build_plan()
music = np.zeros((2, N), np.float32)
for seg in music_plan():
    dur = seg["dst1"] - seg["dst0"] + seg.get("fout", 0)
    y = load(seg["file"], seg["src"], dur, seg.get("tempo"))
    place(music, fade(y, seg.get("fin", 0), seg.get("fout", 0)), seg["dst0"], seg.get("gain", 1.0))

sfx = np.zeros((2, N), np.float32)
cache = {}
for e in plan["sfx"]:
    if e["file"] not in cache: cache[e["file"]] = load(e["file"])
    y = cache[e["file"]]
    if e.get("dur"): y = fade(y[:, :int(e["dur"] * SR)], 0.3, min(1.0, e["dur"] / 3))
    place(sfx, y, e["t"], e["gain"], e.get("pan", 0.0))
sfx = hp(sfx, 30)

vo, _ = librosa.load(VO, sr=SR, mono=True)
voice = np.zeros((2, N), np.float32); place(voice, np.stack([vo, vo]), OFF, 0.95)

# smooth voice-keyed ducking (attack 60 ms, release 600 ms), only what is needed for clarity
env = np.abs(voice[0]); env = np.maximum.reduceat(env, np.arange(0, N, 441)); env = np.repeat(env, 441)[:N]
g = np.ones(N, np.float32); level = 0.0
a_att, a_rel = np.exp(-1 / (0.06 * 100)), np.exp(-1 / (0.6 * 100))
env_s = np.zeros(len(env) // 441 + 1, np.float32)
e100 = env[::441]
for i, v in enumerate(e100):
    level = max(v, level * (a_rel if v < level else a_att))
    env_s[i] = level
env_s = np.repeat(env_s, 441)[:N]
duck = 1 - 0.5 * np.clip(env_s / (np.percentile(e100[e100 > 0], 90) + 1e-9), 0, 1)
# leave a little "air" in the mids of the music under the voice (simple dynamic EQ: duck mids more)
mus_low, mus_rest = lp(music, 250), music - lp(music, 250)
music = mus_low * (0.35 + 0.65 * duck)[None] + mus_rest * duck[None]

mix = voice + music * 0.7 + sfx * 0.85
peak = np.abs(mix).max(); mix = mix / max(1.0, peak / 0.97)
sf.write(f"audio/mix_{TAG}.wav", mix.T, SR)
sf.write(f"audio/music_{TAG}.wav", (music / max(1e-6, np.abs(music).max())).T, SR)
sf.write(f"audio/sfx_{TAG}.wav", (sfx / max(1e-6, np.abs(sfx).max())).T, SR)
print("mixed")
if "--mux" in sys.argv:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "output/v3_silent.mp4", "-i", "audio/mix_v3.wav",
                    "-af", "acompressor=threshold=-14dB:ratio=2:attack=20:release=250,loudnorm=I=-14:TP=-1.2:LRA=11",
                    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "21",
                    "-maxrate", "7500k", "-bufsize", "15M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k",
                    "-ar", "48000", "-movflags", "+faststart", "-shortest", "output/joe_burrow_v3.mp4"], check=True)
    print("muxed")
