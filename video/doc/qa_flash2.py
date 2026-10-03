"""Find content that pops in for a split second: short segments (<= 8 frames) bounded by two hard cuts,
and single frames that differ from both neighbours while the neighbours match each other."""
import subprocess, sys, numpy as np
path = sys.argv[1]; w, h = 64, 36
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                     capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.r_[0, np.abs(np.diff(F, axis=0)).mean((1, 2))]
cut = [i for i in range(1, len(F) - 1) if d[i] > 16 and d[i] > 2.5 * max(d[i - 1], d[i + 1], 2)]
out = []
for a, b in zip(cut, cut[1:]):
    if b - a <= 8:
        out.append((a, b - a, "short segment"))
for i in range(1, len(F) - 1):
    for k in range(1, 4):
        if i + k >= len(F): break
        inside = np.abs(F[i:i + k] - F[i - 1]).mean()
        bridge = np.abs(F[i + k] - F[i - 1]).mean()
        if inside > 20 and bridge < 0.35 * inside:
            out.append((i, k, "inserted frame(s)")); break
fps = 30
for i, n, why in sorted(set(out)):
    print(f"t={i / fps:7.2f}s  frame {i}  {n} frame(s)  {why}")
print(len(F), "frames,", len(cut), "hard cuts,", len(out), "suspects")
