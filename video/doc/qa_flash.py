"""Find flash frames / micro-shots: segments of <=4 frames that differ strongly from both neighbours."""
import subprocess, sys, numpy as np
path = sys.argv[1]; w, h = 96, 54
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)[:, 6:-6]
d = np.abs(np.diff(f, axis=0)).mean((1, 2))           # change between consecutive frames
cuts = np.nonzero(d > 14)[0] + 1                         # frame index where a new picture starts
out = []
for a, b in zip(cuts, cuts[1:]):
    if b - a <= 4:                                       # picture lasted <= 4 frames (~0.13 s)
        before, after = f[a - 1], f[min(b, len(f) - 1)]
        if np.abs(f[a] - before).mean() > 14 and np.abs(f[b - 1] - after).mean() > 14:
            out.append((a / 30, (b - a)))
print(f"{len(f)} frames, {len(cuts)} hard changes, {len(out)} micro-shots")
for t, n in out: print("  t=%7.2fs  %d frame(s)" % (t, n))
