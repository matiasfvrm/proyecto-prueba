# Synthesizes an original 120 BPM electronic beat with impacts synced to the scene cuts.
import numpy as np, wave, sys

SR = 44100
DUR = 27.0
N = int(SR * DUR)
out = np.zeros((N, 2))
rng = np.random.default_rng(7)
BEAT = 0.5  # 120 BPM

def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    out[i:i + len(sig), 0] += sig * (1 - max(pan, 0))
    out[i:i + len(sig), 1] += sig * (1 + min(pan, 0))

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 120 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18)

def snare():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return (rng.standard_normal(n) * 0.7 + np.sin(2 * np.pi * 190 * t) * 0.5) * env(n, 0.001, 0.07)

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    x = rng.standard_normal(n); x = np.diff(x, prepend=0)  # crude highpass
    return x * env(n, 0.001, 0.08 if open_ else 0.015)

def bass(freq, length):
    n = int(length * SR); t = np.arange(n) / SR
    saw = 2 * ((t * freq) % 1) - 1
    sub = np.sin(2 * np.pi * freq * t)
    return (0.35 * saw + 0.8 * sub) * env(n, 0.005, length * 0.6)

def chord(freqs, length):
    n = int(length * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t + 0.3) for f in freqs)
    return s / len(freqs) * env(n, 0.03, length * 0.7)

def impact():
    n = int(1.2 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t / 0.08)) / SR) * env(n, 0.001, 0.4)
    return boom + rng.standard_normal(n) * env(n, 0.001, 0.12) * 0.5

def riser(length):
    n = int(length * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    k = np.ones(40) / 40; x = x - np.convolve(x, k, 'same')
    return x * (t / length) ** 2 * 0.5

def whoosh():
    n = int(0.5 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = x - np.convolve(x, np.ones(20) / 20, 'same')
    return x * np.sin(np.pi * t / 0.5) ** 2 * 0.5

# --- intro (0 - 3.1): slams on each word, riser into the drop
for t in (0.15, 0.65, 1.15, 1.6):
    add(impact(), t, 0.55)
add(riser(1.1), 2.0, 0.8)

# --- main groove from the drop at 3.1s
start = 3.1
roots = [55.0, 43.65, 65.41, 49.0]            # A1, F1, C2, G1
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
bar = 4 * BEAT
t = start
b = 0
while t < DUR - 0.2:
    ci = (b // 1) % 4
    for k in range(4):
        tk = t + k * BEAT
        add(kick(), tk, 0.9)
        if k in (1, 3): add(snare(), tk, 0.45)
        add(hat(), tk + BEAT / 2, 0.18, pan=0.3)
        add(hat(), tk, 0.10, pan=-0.3)
        add(bass(roots[ci], BEAT * 0.9), tk + BEAT / 2, 0.35)
    add(chord(chords[ci], bar * 0.95), t, 0.18)
    t += bar; b += 1

# --- scene transitions & game hit
for t in (3.1, 6.9, 11.8, 16.9, 21.0):
    add(impact(), t, 0.5)
    add(whoosh(), t - 0.3, 0.6)
add(impact(), 13.62, 0.6)
add(whoosh(), 14.3, 0.5)

# fade out the last 1.5s, normalize
fade = np.ones(N); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl)
out *= fade[:, None]
out /= np.max(np.abs(out)) * 1.12
pcm = (out * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
