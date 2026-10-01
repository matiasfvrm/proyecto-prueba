"""Render the Joe Burrow documentary short.

Style (from the reference NTMShorts video): teal/orange cinematic grade,
vignette + grain, hard cuts with zoom punches and white flashes, black
narration cards with small centered text, huge condensed titles, and
data/timeline graphics. Frames are drawn with PIL/numpy and piped to ffmpeg.
"""
import glob, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
OFF = 0.8                      # voiceover starts at 0.8 s
DUR = 84.0
PREVIEW = "--preview" in sys.argv
if PREVIEW:
    W, H = 960, 540
S = W / 1920
T = json.load(open("audio/timings.json"))
st = [s["start"] + OFF for s in T]
en = [s["end"] + OFF for s in T]

F = "fonts/"
def font(name, size): return ImageFont.truetype(F + name, int(size * S))
ANTON = lambda s: font("anton-latin-400-normal.ttf", s)
INTER = lambda s: font("inter-latin-400-normal.ttf", s)
INTERB = lambda s: font("inter-latin-700-normal.ttf", s)
INTERX = lambda s: font("inter-latin-900-normal.ttf", s)
OSW = lambda s: font("oswald-latin-700-normal.ttf", s)

# ---------------------------------------------------------------- media
def pick(tag, i=0):
    fs = sorted(glob.glob(f"media/raw/{tag}_*.jpg"))
    return fs[i % len(fs)] if fs else None

FALLBACK = {"heisman": "lsu", "cfp": "lsu", "draft": "bengals", "bengals": "burrow",
            "sb": "sofi", "sofi": "burrow", "tiger": "lsu", "ohio": "buckeyes"}
def img(tag, i=0):
    p = pick(tag, i)
    while p is None and tag in FALLBACK:
        tag = FALLBACK[tag]; p = pick(tag, i)
    return p

_cache = {}
def load(path, bw=False):
    key = (path, bw)
    if key not in _cache:
        im = Image.open(path).convert("RGB")
        # cover-fit to 1.25x frame so we can push/pan
        tw, th = int(W * 1.25), int(H * 1.25)
        r = max(tw / im.width, th / im.height)
        im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1), Image.LANCZOS)
        if bw:
            im = im.convert("L").convert("RGB")
        _cache[key] = im
    return _cache[key]

def kenburns(path, p, z0=1.0, z1=1.12, dx=0.0, dy=0.0, bw=False, focus=(0.5, 0.45)):
    im = load(path, bw)
    z = z0 + (z1 - z0) * ease(p)
    # crop box in image coords sized to frame aspect
    scale = min(im.width / W, im.height / H) / z
    cw, ch = W * scale, H * scale
    cx = im.width * focus[0] + dx * p * im.width * 0.08
    cy = im.height * focus[1] + dy * p * im.height * 0.08
    cx = min(max(cx, cw / 2), im.width - cw / 2)
    cy = min(max(cy, ch / 2), im.height - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return im.transform((W, H), Image.EXTENT, box, Image.BILINEAR)

class Clip:
    """Sequential ffmpeg frame reader, cover-fit and slightly zoomed."""
    readers = {}
    def __init__(self, path, ss, fps):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(ss), "-i", path, "-vf",
            f"fps={fps},scale={int(W*1.08)}:{int(H*1.08)}:force_original_aspect_ratio=increase,crop={W}:{H}",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = None
    def next(self):
        b = self.p.stdout.read(W * H * 3)
        if len(b) == W * H * 3:
            self.last = Image.frombytes("RGB", (W, H), b)
        return self.last

def clip_frame(key, path, ss, fps):
    if key not in Clip.readers:
        Clip.readers[key] = Clip(path, ss, fps)
    return Clip.readers[key].next()

def ease(x): x = min(max(x, 0), 1); return x * x * (3 - 2 * x)

# ---------------------------------------------------------------- grade
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = np.clip(1.15 - 0.55 * d ** 1.8, 0.25, 1.0)[..., None].astype(np.float32)
rng = np.random.default_rng(3)
GRAIN = [rng.normal(0, 7, (H, W, 1)).astype(np.float32) for _ in range(6)]

def grade(arr, warm=1.0, sat=1.0):
    a = arr.astype(np.float32) / 255
    lum = (a @ np.array([0.299, 0.587, 0.114], np.float32))[..., None]
    a = lum + (a - lum) * (0.85 * sat)
    a = np.clip((a - 0.5) * 1.18 + 0.5, 0, 1)                 # contrast
    sh = (1 - lum) ** 2; hi = lum ** 2
    a += sh * np.array([-0.03, 0.02, 0.06], np.float32)        # teal shadows
    a += hi * np.array([0.05, 0.015, -0.04], np.float32) * warm  # warm highs
    return a

def finish(a, fi, vig=True):
    if vig: a = a * VIG
    a = a * 255 + GRAIN[fi % len(GRAIN)]
    return np.clip(a, 0, 255).astype(np.uint8)

# ---------------------------------------------------------------- text helpers
def text_c(dr, xy, s, f, fill=(255, 255, 255), anchor="mm", shadow=True, spacing=0):
    if shadow:
        dr.text((xy[0] + 3 * S, xy[1] + 4 * S), s, font=f, fill=(0, 0, 0, 170), anchor=anchor)
    dr.text(xy, s, font=f, fill=fill, anchor=anchor)

def overlay(base, draw_fn):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(ov), ov)
    base = base.convert("RGBA"); base.alpha_composite(ov); return base.convert("RGB")

def big_title(im, s, p, size=330, y=0.5, color=(255, 255, 255), behind_alpha=235):
    """Huge condensed title that slowly scales up (reference: '2020', 'MONZA')."""
    def fn(dr, ov):
        f = ANTON(size * (1 + 0.06 * p))
        a = int(behind_alpha * min(1, p * 6))
        text_c(dr, (W / 2, H * y), s, f, fill=color + (a,), shadow=False)
    t = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fn(ImageDraw.Draw(t), t)
    glow = t.filter(ImageFilter.GaussianBlur(18 * S))
    base = im.convert("RGBA")
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); shadow.putalpha(glow.getchannel("A").point(lambda v: v * 0.6))
    base.alpha_composite(shadow); base.alpha_composite(t)
    return base.convert("RGB")

def lower_tag(im, year, label, p, accent=(251, 79, 20)):
    """Timeline chip, like the reference's championship/standings graphics."""
    def fn(dr, ov):
        for i in range(60):
            y = H - (i + 1) * 7 * S
            dr.rectangle([0, y, W, y + 7 * S], fill=(0, 0, 0, int(200 * (1 - i / 60) ** 1.5)))
        k = ease(p * 5)
        x0 = 110 * S - (1 - k) * 500 * S; y0 = H - 250 * S
        dr.rectangle([x0, y0, x0 + 14 * S, y0 + 130 * S], fill=accent + (255,))
        dr.text((x0 + 40 * S, y0 - 6 * S), year, font=ANTON(78), fill=(255, 255, 255, int(255 * k)))
        dr.text((x0 + 42 * S, y0 + 92 * S), label, font=INTERX(36), fill=(255, 255, 255, int(235 * k)))
    return overlay(im, fn)

def caption(im, s, a=1.0, y=0.9, size=34):
    def fn(dr, ov):
        text_c(dr, (W / 2, H * y), s, INTERB(size), fill=(255, 255, 255, int(255 * a)))
    return overlay(im, fn)

def timeline_bar(im, n, p):
    """Bottom progress timeline that fills one node per montage step."""
    steps = ["OHIO ST", "LSU", "HEISMAN", "CHAMPION", "#1 PICK", "INJURY", "SUPER BOWL"]
    def fn(dr, ov):
        x0, x1, y = 260 * S, W - 260 * S, H - 60 * S
        dr.line([x0, y, x1, y], fill=(255, 255, 255, 90), width=max(1, int(3 * S)))
        fillx = x0 + (x1 - x0) * min(1, (n + ease(p)) / (len(steps) - 1))
        dr.line([x0, y, fillx, y], fill=(251, 79, 20, 255), width=max(1, int(5 * S)))
        for i, s in enumerate(steps):
            x = x0 + (x1 - x0) * i / (len(steps) - 1)
            on = i <= n
            r = (11 if i == n else 7) * S
            dr.ellipse([x - r, y - r, x + r, y + r], fill=(251, 79, 20, 255) if on else (90, 90, 90, 255))
            dr.text((x, y - 26 * S), s, font=INTERB(17), fill=(255, 255, 255, 230 if on else 110), anchor="mm")
    return overlay(im, fn)

def money(im, p):
    v = int(275_000_000 * ease(min(1, p * 1.6)))
    def fn(dr, ov):
        text_c(dr, (W / 2, H * 0.47), f"${v:,}", ANTON(190), fill=(255, 255, 255, 255))
        text_c(dr, (W / 2, H * 0.62), "5-YEAR EXTENSION  ·  CINCINNATI BENGALS  ·  2023", INTERB(30), fill=(255, 210, 160, 240))
    return overlay(im, fn)

def black_card(s, p, size=40):
    im = Image.new("RGB", (W, H), (6, 6, 8))
    a = ease(p * 5) * (1 - ease((p - 0.85) * 6.6))
    return caption(im, s, a=a, y=0.5, size=size)

# ---------------------------------------------------------------- scene list
# each: (start, end, kind, params)
sc = []
def add(t0, t1, kind, **kw): sc.append((t0, t1, kind, kw))

cut = lambda i: st[i] - 0.15
add(0, cut(1), "photo", src=img("burrow", 5), z=(1.18, 1.05), fx="money", punch=True)
add(cut(1), cut(2), "photo", src=img("burrow", 2), z=(1.0, 1.1), focus=(0.5, 0.35))
add(cut(2), cut(3), "clip", src="media/raw/vid_enter.webm", ss=18, bw=True, tag=("2015–2017", "OHIO STATE · BACKUP QB"))
add(cut(3), cut(4), "photo", src=img("sb", 0), z=(1.12, 1.0), tag=("SUPER BOWL LVI", "RAMS 23 – BENGALS 20"))
add(cut(4), cut(4) + 1.1, "photo", src=img("burrow", 12), z=(1.0, 1.08), bw=True, flash=True)
add(cut(4) + 1.1, cut(5), "photo", src=img("burrow", 11), z=(1.1, 1.18), bw=True, tag=("NOV 2020", "TORN ACL & MCL"))
add(cut(5), st[5] + 1.6, "photo", src=img("burrow", 34), z=(1.0, 1.1), dx=1, punch=True)
add(st[5] + 1.6, cut(6), "photo", src=img("burrow", 7), z=(1.15, 1.05), dx=-1)
add(cut(6), cut(7), "photo", src=img("burrow", 6), z=(1.0, 1.1), focus=(0.5, 0.4), title="JOE BURROW", punch=True)
add(cut(7), cut(8), "card", text="It's the story of what happens when success doesn't come easily.")
add(cut(8), st[8] + 2.0, "clip", src="media/raw/vid_enter.webm", ss=2, sat=0.6)
add(st[8] + 2.0, cut(9), "photo", src=img("burrow", 35), z=(1.12, 1.02))
add(cut(9), st[10] - 0.05, "card", text="It's what you do after you lose.", size=50)
# montage — one beat per career step
M = [("ohio", 0, "2015", "OHIO STATE · FIGHTING FOR A CHANCE", {}),
     ("tiger", 0, "2018", "TRANSFERS TO LSU", {}),
     ("heisman", 2, "2019", "HEISMAN TROPHY WINNER", {"focus": (0.62, 0.35)}),
     ("lsu", 13, "JAN 2020", "NATIONAL CHAMPION", {}),
     ("CLIP:media/raw/vid_draft.webm:8", 0, "APR 2020", "#1 OVERALL PICK", {}),
     ("burrow", 17, "NOV 2020", "INJURED ROOKIE", {"bw": True}),
     ("sb", 1, "FEB 2022", "SUPER BOWL QUARTERBACK", {})]
for k, (tag, i, yr, lab, kw) in enumerate(M):
    t0 = st[10] - 0.05 if k == 0 else cut(10 + k)
    t1 = cut(11 + k)
    kind, src, extra = "photo", img(tag, i), {}
    if tag.startswith("CLIP:"):
        _, path, ss = tag.split(":"); kind, src, extra = "clip", path, {"ss": float(ss)}
    add(t0, t1, kind, src=src, **extra, z=(1.12, 1.0) if k % 2 else (1.0, 1.12), tag=(yr, lab),
        step=k, punch=True, flash=k > 0, **kw)
add(cut(17), cut(18), "photo", src=img("burrow", 34), z=(1.25, 1.05), title="BACK IN THE FIGHT",
    punch=True, flash=True, shake=True)
add(cut(18), cut(19), "photo", src=img("sb", 1), z=(1.0, 1.08), sat=0.8)
add(cut(19), cut(20), "photo", src=img("burrow", 19), z=(1.0, 1.12), focus=(0.5, 0.22))
add(cut(20), cut(21), "photo", src=img("burrow", 9), z=(1.0, 1.1), title="SOMETHING LEFT TO PROVE", tsize=170)
add(cut(21), cut(22), "clip", src="media/raw/vid_fans.webm", ss=12, bw=True, cap="Not to the people who doubted him.")
add(cut(22), cut(23), "photo", src=img("burrow", 22), z=(1.1, 1.0), bw=True, cap="Not to the people who questioned his injuries.")
add(cut(23), cut(24), "photo", src=img("burrow", 6), z=(1.1, 1.25), focus=(0.5, 0.35), punch=True, flash=True)
recap = [img("ohio", 0), img("lsu", 11), img("heisman", 2), img("lsu", 13), img("tiger", 0),
         img("burrow", 11), img("sb", 0), img("burrow", 5)]
t = cut(24); step = (st[25] - 0.15 - t - 1.6) / len(recap)
for k, s in enumerate(recap):
    add(t, t + step, "photo", src=s, z=(1.0, 1.06), bw=k < len(recap) - 1, flash=True)
    t += step
add(t, cut(25), "photo", src=img("burrow", 5), z=(1.0, 1.08), sat=0.8)
add(cut(25), en[25] + 0.2, "photo", src=img("burrow", 2), z=(1.05, 1.2), focus=(0.5, 0.33), sat=0.6, dark=0.55)
add(en[25] + 0.2, DUR, "end")

json.dump([{"t0": round(a, 3), "t1": round(b, 3), "kind": k, "flash": kw.get("flash", False),
            "punch": kw.get("punch", False)} for a, b, k, kw in sc], open("edit_decisions.json", "w"), indent=1)

# ---------------------------------------------------------------- render
def frame(t, fi):
    for t0, t1, kind, kw in sc:
        if t0 <= t < t1: break
    p = (t - t0) / max(1e-6, t1 - t0)
    if kind == "card":
        a = grade(np.asarray(black_card(kw["text"], p, kw.get("size", 40))))
        return finish(a, fi, vig=False)
    if kind == "end":
        im = Image.new("RGB", (W, H), (0, 0, 0))
        k = ease((t - t0) / 0.8)
        im = big_title(im, "WHAT COMES NEXT?", min(1, (t - t0) / 3), size=150, y=0.47)
        im = caption(im, "JOE BURROW", a=ease((t - t0 - 1.0) / 0.8), y=0.62, size=30)
        a = np.asarray(im).astype(np.float32) / 255 * k
        if t > DUR - 1.2: a *= max(0, (DUR - t) / 1.2)
        return finish(a, fi, vig=False)
    if kind == "clip":
        im = clip_frame(id(kw), kw["src"], kw.get("ss", 0), FPS_CUR[0])
    z0, z1 = kw.get("z", (1.0, 1.1))
    if kw.get("punch") and (t - t0) < 0.25:
        z0 = z0 * (1 + 0.12 * (1 - (t - t0) / 0.25))
    if kind == "photo":
        im = kenburns(kw["src"], p, z0, z1, kw.get("dx", 0), kw.get("dy", 0), kw.get("bw", False),
                      kw.get("focus", (0.5, 0.45)))
    if kw.get("shake") and (t - t0) < 0.6:
        amp = 18 * S * (1 - (t - t0) / 0.6)
        im = im.transform((W, H), Image.AFFINE, (1, 0, rng.uniform(-amp, amp), 0, 1, rng.uniform(-amp, amp)))
    if kw.get("fx") == "money":
        im = Image.blend(im, Image.new("RGB", (W, H)), 0.45); im = money(im, p)
    if kw.get("title"):
        im = Image.blend(im, Image.new("RGB", (W, H)), 0.35)
        im = big_title(im, kw["title"], p, size=kw.get("tsize", 250))
    if kw.get("tag"):
        im = lower_tag(im, *kw["tag"], p)
    if "step" in kw:
        im = timeline_bar(im, kw["step"], p)
    if kw.get("cap"):
        im = caption(im, kw["cap"], a=ease(p * 6), y=0.88, size=38)
    a = grade(np.asarray(im), sat=0.0 if kw.get("bw") else kw.get("sat", 1.0))
    if kw.get("dark"): a *= kw["dark"] + (1 - kw["dark"]) * (1 - p)
    # chromatic split on cut-in
    if kw.get("punch") and (t - t0) < 0.12:
        sh = int(10 * S)
        a[..., 0] = np.roll(a[..., 0], sh, 1); a[..., 2] = np.roll(a[..., 2], -sh, 1)
    if kw.get("flash") and (t - t0) < 0.12:
        a = a + (1 - (t - t0) / 0.12) * 0.85
    # fade in from black at the very start
    if t < 0.4: a *= t / 0.4
    return finish(a, fi)

FPS_CUR = [FPS]

def main():
    out = "output/preview.mp4" if PREVIEW else "output/video_silent.mp4"
    os.makedirs("output", exist_ok=True)
    fps = 15 if PREVIEW else FPS
    FPS_CUR[0] = fps
    n = int(DUR * fps)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "libx264",
                           "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out],
                          stdin=subprocess.PIPE)
    for fi in range(n):
        ff.stdin.write(frame(fi / fps, fi).tobytes())
        if fi % 150 == 0: print(f"{fi}/{n}", flush=True)
    ff.stdin.close(); ff.wait(); print("wrote", out)

if __name__ == "__main__":
    main()
