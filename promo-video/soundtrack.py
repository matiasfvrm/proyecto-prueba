# Builds soundtrack.wav for promo.html from a licensed music track plus a few transition sounds.
#
# Track: "House Vibes" (Mixkit music #129, exactly 120 BPM), free under the Mixkit Stock Music license.
#   python3 soundtrack.py media/music/129.mp3 soundtrack.wav
#
# The video's cuts sit on the bar lines of the track:
#   video 0-4 s   = the 2 bars leading into the first drop
#   video 4-36 s  = the first 16 bars of the main section
#   video 36-40 s = the last 2 bars of the breakdown (one clean splice on a bar line)
#   video 40-48 s = the second drop
import sys, wave
import numpy as np
import librosa
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
DUR = 48.0
N = int(SR * DUR)
GRID = 0.148           # time of the track's first beat
DROP1 = GRID + 16.0    # first drop
BREAK_END = GRID + 64.0  # second drop

src = sys.argv[1] if len(sys.argv) > 1 else 'media/music/129.mp3'
dst = sys.argv[2] if len(sys.argv) > 2 else 'soundtrack.wav'
y, _ = librosa.load(src, sr=SR, mono=False)
if y.ndim == 1: y = np.stack([y, y])
y = y.T  # (samples, 2)

def cut(t0, length): i = int(round(t0 * SR)); return y[i:i + int(round(length * SR))].copy()

XF = int(0.03 * SR)  # 30 ms crossfade at the splice
a = cut(DROP1 - 4.0, 36.0 + 0.03)
b = cut(BREAK_END - 4.0 - 0.0, 12.0)
ramp = np.linspace(0, 1, XF)[:, None]
music = np.zeros((N, 2))
music[:len(a) - XF] = a[:-XF]
s = int(36.0 * SR)
music[s:s + XF] = a[-XF:] * (1 - ramp) + b[:XF] * ramp
music[s + XF:s + len(b)] = b[XF:N - s]

# ---------------- transition sounds (synthesized, kept low under the music)
rng = np.random.default_rng(5)
def T(n): return np.arange(n) / SR
def env(n, a=0.002, d=0.2): t = T(n); return np.minimum(t / a, 1) * np.exp(-t / d)
def lp(x, f): bb, aa = butter(2, min(f / (SR / 2), 0.99)); return lfilter(bb, aa, x)
def hp(x, f): bb, aa = butter(2, min(f / (SR / 2), 0.99), 'high'); return lfilter(bb, aa, x)
def sweep(length, f0, f1, shape):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n); seg = 512
    for i in range(0, n, seg):
        f = f0 + (f1 - f0) * shape(i / n)
        out[i:i + seg] = lp(x[max(0, i - 2048):i + seg], f)[-len(x[i:i + seg]):]
    return out
def whoosh(length=0.5):
    n = int(length * SR); return sweep(length, 500, 5500, lambda u: np.sin(np.pi * u)) * np.sin(np.pi * T(n) / length) ** 2
def riser(length):
    n = int(length * SR); return sweep(length, 300, 9000, lambda u: u * u) * (T(n) / length) ** 2
def impact():
    n = int(1.6 * SR); t = T(n)
    boom = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t / 0.07)) / SR) * env(n, 0.001, 0.45)
    return np.tanh(boom * 1.4 + lp(rng.standard_normal(n), 4000) * env(n, 0.001, 0.07) * 0.5)
def tick():
    n = int(0.05 * SR); return hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.008)
def click():
    n = int(0.08 * SR); t = T(n); return np.sin(2 * np.pi * 1700 * t) * env(n, 0.0005, 0.012) + hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.005)
def pop():
    n = int(0.12 * SR); t = T(n); return np.sin(2 * np.pi * np.cumsum(500 + 800 * np.exp(-t / 0.012)) / SR) * env(n, 0.001, 0.05)

fx = np.zeros((N, 2)); send = np.zeros((N, 2))
def add(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = int(t * SR)
    if i < 0: sig = sig[-i:]; i = 0
    if i >= N: return
    sig = sig[:N - i] * gain
    l, r = sig * (1 - max(pan, 0)), sig * (1 + min(pan, 0))
    fx[i:i + len(sig), 0] += l; fx[i:i + len(sig), 1] += r
    send[i:i + len(sig), 0] += l * rev; send[i:i + len(sig), 1] += r * rev

for k in range(8): add(tick(), k * 0.25, 0.5, pan=0.4 * (-1) ** k); add(impact(), k * 0.25, 0.10)   # cold-open cuts
add(riser(1.6), 2.4, 0.32)
for t in (4, 14, 30, 40): add(impact(), t, 0.42, rev=0.3)                 # section changes
for t in (4, 8, 22, 30, 36): add(whoosh(), t - 0.3, 0.3, rev=0.2)        # moving transitions
for t in (10.15, 11.4, 12.65): add(whoosh(0.35), t - 0.17, 0.22)          # platform whip-pans
for t in (15, 16, 17, 18): add(tick(), t, 0.5); add(impact(), t + 0.5, 0.16)
for t in (24.6, 26.4, 28.2, 31.7): add(whoosh(0.3), t - 0.12, 0.2)
add(riser(0.6), 32.7, 0.22); add(impact(), 33.3, 0.3, rev=0.3)           # colour grade reveal
add(whoosh(0.9), 34.75, 0.3)                                             # speed ramp
for t in (36.58, 37.5, 38.0, 38.75, 39.17): add(pop(), t, 0.3, rev=0.2)  # chat bubbles
add(riser(1.2), 38.8, 0.3)
add(click(), 43.5, 0.55); add(impact(), 43.5, 0.22, rev=0.3)             # button click

ir_n = int(1.5 * SR)
ir = rng.standard_normal((ir_n, 2)) * np.exp(-T(ir_n) / 0.4)[:, None]
ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1)
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], 1)

# ---------------- mix
music /= np.max(np.abs(music)) + 1e-9
mix = music * 0.85 + fx * 0.5 + wet * 0.04
fade = np.ones(N)
fi = int(0.05 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo = int(1.6 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None]
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= 0.94 / np.max(np.abs(mix))
with wave.open(dst, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', dst)
