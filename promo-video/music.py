# Synthesizes the original soundtrack for promo.html (48 s, 120 BPM) with SFX synced to the cuts.
# Usage: python3 music.py music.wav
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
DUR = 48.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(3)
dry = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send

def T(n): return np.arange(n) / SR
def env(n, a=0.002, d=0.2): t = T(n); return np.minimum(t / a, 1) * np.exp(-t / d)
def lp(x, f): b, a = butter(2, min(f / (SR / 2), 0.99)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, min(f / (SR / 2), 0.99), 'high'); return lfilter(b, a, x)
def saw(f, n, ph=0.0): t = T(n); return 2 * ((t * f + ph) % 1) - 1
def note(m): return 440 * 2 ** ((m - 69) / 12)

def add(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i] * gain
    l, r = sig * (1 - max(pan, 0)), sig * (1 + min(pan, 0))
    dry[i:i + len(sig), 0] += l; dry[i:i + len(sig), 1] += r
    if rev:
        send[i:i + len(sig), 0] += l * rev; send[i:i + len(sig), 1] += r * rev

# ---------------- instruments
def kick(hard=False):
    n = int(0.5 * SR); t = T(n)
    f = 42 + (160 if hard else 120) * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.22 if hard else 0.17)
    click = hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.004) * 0.4
    return np.tanh((body + click) * (1.6 if hard else 1.2))
def clap():
    n = int(0.35 * SR); x = hp(rng.standard_normal(n), 900)
    e = sum(env(n, 0.001, 0.012) * (np.arange(n) >= int(k * SR)) for k in (0, 0.01, 0.02)) + env(n, 0.001, 0.09)
    return lp(x, 7000) * e * 0.6
def hat(open_=False):
    n = int((0.3 if open_ else 0.07) * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.001, 0.09 if open_ else 0.018)
def supersaw(freqs, length, cutoff=3500):
    n = int(length * SR); x = np.zeros(n)
    for f in freqs:
        for d in (-0.18, -0.08, 0, 0.08, 0.18):
            x += saw(f * 2 ** (d / 12), n, rng.random())
    x = lp(x / (len(freqs) * 5), cutoff)
    t = T(n); return x * np.minimum(t / 0.01, 1) * np.minimum((length - t) / 0.05, 1).clip(0, 1)
def bass(f, length, growl=False):
    n = int(length * SR); t = T(n)
    if growl:
        x = saw(f, n) + saw(f * 1.01, n) + 0.6 * np.sin(2 * np.pi * f / 2 * t)
        lfo = 400 + 1400 * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * t))
        y = np.zeros(n); seg = 256  # time-varying lowpass, in blocks
        for s in range(0, n, seg): y[s:s + seg] = lp(x[max(0, s - 2048):s + seg], lfo[s])[-len(x[s:s + seg]):]
        return np.tanh(y * 1.5) * env(n, 0.005, length)
    return (0.4 * lp(saw(f, n), 900) + 0.9 * np.sin(2 * np.pi * f * t)) * env(n, 0.004, length * 0.7)
def pluck(f, length=0.25):
    n = int(length * SR); return lp(saw(f, n) + 0.5 * saw(f * 2, n), 5000) * env(n, 0.002, 0.08)
def pad(freqs, length):
    n = int(length * SR); t = T(n); x = np.zeros(n)
    for f in freqs:
        for d in (-0.1, 0.1): x += np.sin(2 * np.pi * f * 2 ** (d / 12) * t) + 0.3 * np.sin(4 * np.pi * f * t)
    a = np.minimum(t / 0.6, 1) * np.minimum((length - t) / 0.6, 1).clip(0, 1)
    return lp(x / len(freqs), 2500) * a
def impact(big=1.0):
    n = int(1.8 * SR); t = T(n)
    boom = np.sin(2 * np.pi * np.cumsum(28 + 100 * np.exp(-t / 0.07)) / SR) * env(n, 0.001, 0.5)
    crack = lp(rng.standard_normal(n), 5000) * env(n, 0.001, 0.08)
    return np.tanh((boom + crack * 0.6) * 1.5) * big
def riser(length, up=True):
    n = int(length * SR); t = T(n); x = rng.standard_normal(n)
    y = np.zeros(n); seg = 512
    for s in range(0, n, seg):
        f = 300 + 9000 * (s / n) ** 2 if up else 9000 - 8700 * (s / n) ** 0.5
        y[s:s + seg] = lp(x[max(0, s - 2048):s + seg], f)[-len(x[s:s + seg]):]
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / length) ** 2) / SR) * 0.25
    return (y + sweep) * ((t / length) ** 2 if up else (1 - t / length) ** 2)
def whoosh(length=0.45):
    n = int(length * SR); t = T(n); x = rng.standard_normal(n)
    y = np.zeros(n); seg = 512
    for s in range(0, n, seg):
        f = 400 + 5000 * np.sin(np.pi * s / n)
        y[s:s + seg] = lp(x[max(0, s - 2048):s + seg], f)[-len(x[s:s + seg]):]
    return y * np.sin(np.pi * t / length) ** 2
def zap():
    n = int(0.12 * SR); t = T(n)
    return np.sign(np.sin(2 * np.pi * np.cumsum(2000 * np.exp(-t / 0.03) + 80) / SR)) * env(n, 0.001, 0.04) * 0.5
def pop():
    n = int(0.12 * SR); t = T(n)
    return np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-t / 0.01)) / SR) * env(n, 0.001, 0.05)
def tick():
    n = int(0.03 * SR); return hp(rng.standard_normal(n), 4000) * env(n, 0.0005, 0.006)
def click():
    n = int(0.08 * SR); t = T(n)
    return (np.sin(2 * np.pi * 1800 * t) * env(n, 0.0005, 0.01) + hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.005))
def sparkle():
    n = int(1.2 * SR); x = np.zeros(n)
    for k in range(10):
        s = int(k * 0.08 * SR); m = n - s; f = note(84 + [0, 4, 7, 12, 16][k % 5])
        x[s:] += np.sin(2 * np.pi * f * T(m)) * env(m, 0.001, 0.15) * (1 - k / 12)
    return x * 0.4

# ---------------- arrangement
PROG = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [67, 72, 76]), (55, [67, 71, 74])]  # Am F C G
ARP = [0, 12, 7, 12, 3, 12, 7, 15]

# 0-2 s: montage stutters on each 1/4-second cut + low drone
for k in range(8):
    add(impact(0.5), k * 0.25, 0.55); add(zap(), k * 0.25, 0.35, pan=(-0.5 if k % 2 else 0.5))
add(lp(saw(note(33), int(2.2 * SR)) + saw(note(33) * 1.005, int(2.2 * SR)), 300) * 0.5, 0.0, 0.6)
# 2-4 s: build: riser + accelerating snare roll + rising pluck
add(riser(2.0), 2.0, 0.9)
for k in range(16):
    t = 2.0 + 1.9 * (1 - (1 - k / 16) ** 1.6)
    add(clap(), t, 0.25 + 0.4 * k / 16, rev=0.2)
for k in range(8): add(pluck(note(69 + k)), 2.0 + k * 0.25, 0.25, pan=0.3 * (-1) ** k, rev=0.3)

def drop(a, b, heavy=False, arp=False, filt=None):
    t = a; bar = 0
    while t < b - 1e-6:
        root, ch = PROG[bar % 4]
        blen = min(2.0, b - t)
        add(supersaw([note(m) for m in ch], blen, cutoff=filt or (5000 if heavy else 3800)), t, 0.32, rev=0.35)
        for k in range(4):
            tk = t + k * BEAT
            if tk >= b - 1e-6: break
            add(kick(heavy), tk, 0.95)
            if k in (1, 3): add(clap(), tk, 0.55, rev=0.25)
            for s in range(4):
                add(hat(s == 2), tk + s * BEAT / 4, (0.2 if s == 2 else 0.1), pan=0.35 if s % 2 else -0.35)
            add(bass(note(root - 12), BEAT * 0.45, growl=heavy), tk + BEAT / 2, 0.55 if heavy else 0.5)
            if arp:
                for s in range(2): add(pluck(note(root + 12 + ARP[(k * 2 + s) % 8])), tk + s * BEAT / 2, 0.16, pan=0.4 * (-1) ** s, rev=0.4)
        t += 2.0; bar += 1

drop(4, 14)
drop(14, 22, heavy=True, arp=True)
drop(22, 30, arp=True)
drop(30, 36, filt=2500)
add(riser(1.0), 35.0, 0.7)
# 36-41: breakdown (pads, soft pulse) + chat SFX
for k, (root, ch) in enumerate(PROG[:3]):
    add(pad([note(m - 12) for m in ch] + [note(root - 12)], 2.1), 36 + k * 1.7, 0.12, rev=0.5)
for k in range(10): add(kick() * 0.5, 36 + k * 0.5, 0.35); add(hat(), 36.25 + k * 0.5, 0.1)
for t in (36.7, 37.8, 38.4, 39.3, 39.8): add(pop(), t, 0.5, rev=0.3)
for t0, t1 in ((37.2, 37.8), (38.8, 39.3)):
    for k in range(int((t1 - t0) / 0.07)): add(tick(), t0 + k * 0.07, 0.3, pan=0.3)
add(riser(1.4), 39.6, 0.9)
# 41-46.5: final drop, then tail
drop(41, 46.5, heavy=True, arp=True)
add(pad([note(m - 12) for m in PROG[0][1]], 2.2), 46.5, 0.14, rev=0.6)
add(impact(1.0), 46.5, 0.6)

# cut SFX: whoosh into each cut, impact on it
for t in (4, 8, 14, 22, 30, 36, 41):
    add(whoosh(), t - 0.4, 0.55, rev=0.2); add(impact(), t, 0.75, rev=0.3)
for t in (15, 16, 17, 18):  # game cuts + hype slams
    add(impact(0.6), t, 0.4); add(impact(0.8), t + 0.45, 0.45); add(zap(), t + 0.45, 0.3)
for t in (8.95, 10.05, 11.35, 12.65, 24.6, 26.4, 28.2, 31.7, 34.4):
    add(whoosh(0.35), t - 0.2, 0.45)
# color grade: rising sweep while grading, hit on the 'after' reveal
add(riser(0.6), 32.7, 0.55); add(impact(0.8), 33.3, 0.5); add(sparkle(), 33.3, 0.35, rev=0.4)
add(click(), 44.1, 0.8); add(sparkle(), 44.1, 0.6, rev=0.5); add(impact(0.7), 44.1, 0.4)

# ---------------- mix
ir_n = int(1.8 * SR)
ir = rng.standard_normal((ir_n, 2)) * np.exp(-T(ir_n) / 0.45)[:, None]
ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1)
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], 1)
mix = dry + wet * 0.08
fade = np.ones(N); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
mix *= fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) / np.tanh(1.6) * 0.92  # soft-clip "master"
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
