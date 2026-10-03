"""Renderer v3 — calmer, more cinematic finish.

- 2.5D parallax on stills from monocular depth (depth.py), slow eased camera moves
- no random shake: only a single damped "kick" on two story beats
- restrained transitions: beat cuts, dissolves, light-leak dissolves, smooth zoom, dip
- constant 2.35:1 letterbox, highlight bloom, fine grain, vignette
- masked title reveals, karaoke subtitles with negative keyword capsules

Usage: python3 render3.py [--preview] [--part i/n] [--frames t1,t2,... --out sheet.jpg]
"""
import math, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import importlib
_plan = importlib.import_module(os.environ.get("PLAN", "plan3"))
build_plan, DUR = _plan.build_plan, _plan.DUR
TAG = os.environ.get("TAG", "v3")
from depth import depth as depth_map

ARGS = sys.argv[1:]
PREVIEW = "--preview" in ARGS
W, H = (960, 540) if PREVIEW else (1920, 1080)
FPS = 15 if PREVIEW else 30
S = W / 1920
BAR = int(H * 0.105)                      # letterbox bar height
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts") + "/"
_fonts = {}
def font(name, size):
    k = (name, int(size * S))
    if k not in _fonts: _fonts[k] = ImageFont.truetype(F + name, max(6, int(size * S)))
    return _fonts[k]
ANTON = lambda s: font("anton-latin-400-normal.ttf", s)
INTERX = lambda s: font("inter-latin-900-normal.ttf", s)
INTERB = lambda s: font("inter-latin-700-normal.ttf", s)
ORANGE = np.array([251, 79, 20], np.float32) / 255

def clamp(x, a=0.0, b=1.0): return min(max(x, a), b)
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in(x): x = clamp(x); return x ** 3
def ease_io(x): x = clamp(x); return 0.5 - 0.5 * math.cos(math.pi * x)

PLAN = build_plan()
SHOTS, TRANS, OVL, SUBS, ACC = PLAN["shots"], PLAN["trans"], PLAN["overlays"], PLAN["subs"], PLAN["accents"]

# ------------------------------------------------------------------ stills with parallax
_img = {}
def base(path, w, h):
    k = (path, w, h)
    if k not in _img:
        im = Image.open(path).convert("RGB")
        r = max(w * 1.3 / im.width, h * 1.3 / im.height)
        im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
        a = np.asarray(im, np.float32) / 255
        d = cv2.resize(depth_map(path), (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LINEAR)
        _img[k] = (a, d)
        while len(_img) > 14:                       # keep memory bounded on long timelines
            _img.pop(next(iter(_img)))
    return _img[k]

_grid = {}
def grid(w, h):
    if (w, h) not in _grid:
        u, v = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
        _grid[(w, h)] = (u - w / 2, v - h / 2)
    return _grid[(w, h)]

def photo_frame(sh, p, w=W, h=H):
    """Ken Burns + depth parallax. Camera eases slowly; near layers move/scale more than far ones."""
    a, d = base(sh["src"], w, h)
    q = ease_io(p) if sh.get("ease", True) else p
    z = sh["z0"] + (sh["z1"] - sh["z0"]) * q
    sc = min(a.shape[1] / w, a.shape[0] / h) / z
    fx, fy = sh.get("focus", (0.5, 0.45))
    cx = a.shape[1] * fx + sh.get("dx", 0) * (q - 0.5) * a.shape[1] * 0.05
    cy = a.shape[0] * fy + sh.get("dy", 0) * (q - 0.5) * a.shape[0] * 0.05
    cx = clamp(cx, w * sc / 2, a.shape[1] - w * sc / 2); cy = clamp(cy, h * sc / 2, a.shape[0] - h * sc / 2)
    U, V = grid(w, h)
    xs, ys = cx + U * sc, cy + V * sc
    par = sh.get("par", 1.0)
    if par > 0:
        D = cv2.remap(d, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        dolly = 0.07 * par * (q - 0.5)                 # near pixels grow faster than far ones
        lat = sh.get("pan", 0.0) * par * (q - 0.5) * 40 * S * sc
        k = 1.0 / (1.0 + dolly * (D - 0.35))
        xs = cx + U * sc * k + lat * (D - 0.5)
        ys = cy + V * sc * k
    return cv2.remap(a, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

class Clip:
    def __init__(self, path, ss, speed, w, h, cz=1.1, cy=0.5):
        vf = (f"setpts={1/speed}*PTS,fps={FPS},scale={int(w*cz)}:{int(h*cz)}:force_original_aspect_ratio=increase,"
              f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{cy}")
        self.w, self.h = w, h
        self.p = subprocess.Popen(["ffmpeg", "-v", "quiet", "-ss", f"{ss:.3f}", "-i", path, "-an", "-vf", vf,
                                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last, self.t = np.zeros((h, w, 3), np.float32), None
    def read(self, t):
        if self.t is not None and abs(t - self.t) < 1e-6: return self.last
        b = self.p.stdout.read(self.w * self.h * 3)
        if len(b) == self.w * self.h * 3:
            self.last = np.frombuffer(b, np.uint8).reshape(self.h, self.w, 3).astype(np.float32) / 255
        self.t = t
        return self.last
_clips = {}
def clip_frame(sh, t, w=W, h=H):
    key = (sh["id"], w)
    if key not in _clips:
        _clips[key] = Clip(sh["src"], sh.get("ss", 0) + (t - sh["t0"]) * sh.get("speed", 1.0),
                           sh.get("speed", 1.0), w, h, sh.get("cz", 1.1), sh.get("cy", 0.5))
    return _clips[key].read(t)

# ------------------------------------------------------------------ look
LUM = np.array([0.299, 0.587, 0.114], np.float32)
def grade(a, look):
    lum = (a @ LUM)[..., None]
    if look == "bw":
        a = np.repeat(lum, 3, 2); return np.clip((a - 0.5) * 1.25 + 0.5, 0, 1) * np.array([1.0, 0.99, 0.96], np.float32)
    if look == "duo":
        l = np.clip((lum - 0.06) * 1.25, 0, 1)
        return l * ORANGE * 1.1 + (l ** 2) * (1 - ORANGE) * 0.85
    sat = {"warm": 0.95, "teal": 0.88, "muted": 0.62, "cold": 0.55}.get(look, 0.88)
    a = lum + (a - lum) * sat
    a = np.clip((a - 0.5) * 1.12 + 0.5, 0, 1)
    sh_, hi = (1 - lum) ** 2, lum ** 2
    if look == "cold":
        a = a + sh_ * np.array([-0.03, 0.01, 0.07], np.float32) + hi * np.array([-0.01, 0.01, 0.03], np.float32)
    else:
        warm = 1.3 if look == "warm" else 1.0
        a = a + sh_ * np.array([-0.03, 0.012, 0.055], np.float32) + hi * np.array([0.055, 0.02, -0.04], np.float32) * warm
    return a

_y, _x = np.mgrid[0:H, 0:W]
_d = np.sqrt(((_x - W / 2) / (W / 2)) ** 2 + ((_y - H / 2) / (H / 2)) ** 2)
VIG = np.clip(1.08 - 0.42 * _d ** 2.0, 0.35, 1.0)[..., None].astype(np.float32)
del _x, _y, _d
_rng = np.random.default_rng(5)
GRAIN = [_rng.normal(0, 0.018, (H // 2, W // 2, 1)).astype(np.float32) for _ in range(10)]

def bloom(a, amt=0.22):
    small = cv2.resize(a, (W // 6, H // 6), interpolation=cv2.INTER_AREA)
    hi = np.clip((small @ LUM - 0.72) / 0.28, 0, 1)[..., None] * small
    streak = cv2.blur(np.clip((small @ LUM - 0.8) / 0.2, 0, 1)[..., None] * small, (max(3, int(W / 6 * 0.5)) | 1, 1))
    hi = cv2.GaussianBlur(hi, (0, 0), 6 * S + 1)
    hi = cv2.resize(hi, (W, H), interpolation=cv2.INTER_LINEAR)
    st = cv2.resize(streak, (W, H), interpolation=cv2.INTER_LINEAR)
    a = 1 - (1 - a) * (1 - hi * amt * np.array([1.0, 0.85, 0.7], np.float32))
    return 1 - (1 - a) * (1 - st * 0.8 * np.array([0.55, 0.75, 1.0], np.float32))     # anamorphic streak

def _leak(seed):
    r = np.random.default_rng(seed); lw, lh = 64, 36
    yy, xx = np.mgrid[0:lh, 0:lw]; out = np.zeros((lh, lw, 3), np.float32)
    for _ in range(4):
        cx, cy, rad = r.uniform(0, lw), r.uniform(0, lh), r.uniform(9, 24)
        col = np.array(r.choice([[1, .5, .15], [1, .7, .3], [1, .35, .15], [1, .82, .55]]), np.float32)
        out += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad ** 2))[..., None] * col
    return cv2.resize(np.clip(out, 0, 1), (int(W * 1.6), int(H * 1.6)), interpolation=cv2.INTER_CUBIC)
LEAKS = [_leak(s) for s in (1, 2, 3)]
def leak_layer(v, k, prog):
    L = LEAKS[v % len(LEAKS)]
    ox = int((0.1 + 0.45 * prog) * (L.shape[1] - W)); oy = int(0.25 * (L.shape[0] - H))
    return L[oy:oy + H, ox:ox + W] * k

# ------------------------------------------------------------------ text helpers
def text_mask(txt, fnt, tracking=0):
    if tracking <= 0:
        l, t, r, b = fnt.getbbox(txt)
        m = Image.new("L", (r - l + 4, b - t + 4), 0)
        ImageDraw.Draw(m).text((2 - l, 2 - t), txt, font=fnt, fill=255)
        return m
    ws = [fnt.getbbox(c)[2] - fnt.getbbox(c)[0] if c != " " else fnt.getbbox("n")[2] for c in txt]
    l, t, r, b = fnt.getbbox(txt)
    m = Image.new("L", (max(4, int(sum(ws) + tracking * (len(txt) - 1)) + 8), b - t + 8), 0); d = ImageDraw.Draw(m); x = 4
    for c, w_ in zip(txt, ws):
        bb = fnt.getbbox(c); d.text((x - bb[0], 4 - t), c, font=fnt, fill=255); x += w_ + tracking
    return m

def paste_mask(canvas, m, cx, cy, scale=1.0):
    if scale != 1.0:
        m = m.resize((max(1, int(m.width * scale)), max(1, int(m.height * scale))), Image.BICUBIC)
    canvas.paste(m, (int(cx - m.width / 2), int(cy - m.height / 2)), m)
    return int(cx - m.width / 2), int(cy - m.height / 2), m.width, m.height

def fill(a, mask, mode="solid", color=(1, 1, 1), alpha=1.0):
    m = (np.asarray(mask, np.float32) / 255 * alpha)[..., None]
    if mode == "neg": f = 1 - a
    elif mode == "diff": f = np.abs(np.array(color, np.float32) - a)
    else: f = np.array(color, np.float32)
    return a * (1 - m) + f * m

def shadow(a, mask, strength=0.6, blur=10, off=(0, 6)):
    sm = mask.filter(ImageFilter.GaussianBlur(blur * S))
    arr = np.roll(np.roll(np.asarray(sm), int(off[1] * S), 0), int(off[0] * S), 1)
    return a * (1 - (arr.astype(np.float32) / 255 * strength)[..., None])

def env_alpha(lt, dur, fin=0.25, fout=0.25):
    return ease(lt / fin) * (1 - ease((lt - dur + fout) / fout))

# ------------------------------------------------------------------ overlays
def draw_subs(a, t):
    """Words build on as they are spoken: each rises in and settles; the live word is orange with a
    growing underline; keywords open a negative capsule with a left-to-right wipe; the phrase lifts out."""
    if any(o.get("hide_subs") and o["t0"] <= t < o["t1"] for o in OVL): return a
    for ch in SUBS:
        if not (ch["t0"] <= t < ch["t1"]): continue
        words = ch["words"]; fnt = ANTON(80); gap = 20 * S
        boxes = [fnt.getbbox(w["w"]) for w in words]
        widths = [b[2] - b[0] + (34 * S if w.get("key") else 0) for b, w in zip(boxes, words)]
        x = W / 2 - (sum(widths) + gap * (len(words) - 1)) / 2
        k_out = 1 - ease((t - (ch["t1"] - 0.14)) / 0.14)
        y0 = H * ch.get("y", 0.79) - (1 - k_out) * 14 * S
        layers = []                                   # (mask, color, alpha, kind)
        shadow_m = Image.new("L", (W, H), 0)
        for w, wd in zip(words, widths):
            cx = x + wd / 2; x += wd + gap
            lt = t - w["t0"]
            if lt < 0: continue                        # not spoken yet: hidden
            k_in = ease_out(lt / 0.16)
            sc = 1.0 + 0.14 * (1 - ease_out(lt / 0.2))
            y = y0 + (1 - k_in) * 24 * S
            m = text_mask(w["w"], fnt)
            wm = Image.new("L", (W, H), 0); x0_, y0_, mw, mh = paste_mask(wm, m, cx, y, sc)
            paste_mask(shadow_m, m, cx, y, sc)
            live = t < w["t1"] + 0.05
            settle = ease((t - w["t1"] - 0.05) / 0.25)          # orange -> white after the word ends
            col = tuple(np.clip(ORANGE * 1.15 * (1 - settle) + np.ones(3) * settle, 0, 1))
            if w.get("key") and (live or settle < 1):
                wipe = ease_out(lt / 0.14) * (1 - settle)
                pad = 15 * S; bw_, bh_ = mw + 2 * pad, mh + pad
                bm = Image.new("L", (W, H), 0)
                ImageDraw.Draw(bm).rounded_rectangle([cx - bw_ / 2, y - bh_ / 2, cx - bw_ / 2 + bw_ * max(0.02, wipe),
                                                      y + bh_ / 2], radius=8 * S, fill=255)
                layers.append((bm, None, k_in * k_out, "neg"))
            elif live:
                ul = Image.new("L", (W, H), 0); grow = ease_out(lt / max(0.12, w["t1"] - w["t0"]))
                ImageDraw.Draw(ul).rectangle([cx - mw / 2, y + mh / 2 + 4 * S, cx - mw / 2 + mw * grow,
                                              y + mh / 2 + 9 * S], fill=255)
                layers.append((ul, tuple(ORANGE), k_in * k_out, "solid"))
            layers.append((wm, col, k_in * k_out, "solid"))
        a = shadow(a, shadow_m, 0.7 * k_out, 8, (0, 4))
        for m, col, al, kind in layers:
            a = fill(a, m, kind, col or (1, 1, 1), al)
    return a

def ov_title(a, o, t):
    """Masked reveal: the line rises from behind a hard edge, tracking opens slightly."""
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    style = o.get("style", "reveal"); fnt = ANTON(o.get("size", 220))
    track = (o.get("track", 4) + 10 * ease_out(lt / dur)) * S
    m = text_mask(o["text"], fnt, int(track))
    cx, cy = W * o.get("x", 0.5), H * o.get("y", 0.5)
    canvas = Image.new("L", (W, H), 0)
    if style == "slam":
        sc = 1.18 - 0.18 * ease_out(lt / 0.22) + 0.03 * lt / dur
        paste_mask(canvas, m, cx, cy, sc)
    else:
        rise = (1 - ease_out(lt / 0.55)) * m.height * 0.9
        x0, y0, mw, mh = paste_mask(canvas, m, cx, cy + rise)
        clipm = Image.new("L", (W, H), 0)
        ImageDraw.Draw(clipm).rectangle([0, cy - m.height / 2 - 4, W, cy + m.height / 2 + 4], fill=255)
        canvas = Image.fromarray(np.minimum(np.asarray(canvas), np.asarray(clipm)))
    k = 1 - ease((lt - dur + 0.3) / 0.3)
    if o.get("dim"): a = a * (1 - o["dim"] * ease(lt / 0.3) * k)
    if o.get("line"):          # thin accent line under the title
        ln = Image.new("L", (W, H), 0); half = m.width / 2 * ease_out((lt - 0.15) / 0.6)
        ImageDraw.Draw(ln).rectangle([cx - half, cy + m.height / 2 + 14 * S, cx + half, cy + m.height / 2 + 18 * S], fill=255)
        a = fill(a, ln, "solid", tuple(ORANGE), k)
    a = shadow(a, canvas, 0.5 * k, 18, (0, 8))
    a = fill(a, canvas, o.get("mode", "solid"), o.get("color", (1, 1, 1)), k)
    gl = (lt - 0.25) / 0.7                               # light glint sweeping across the letters
    if 0 < gl < 1 and o.get("mode", "solid") == "solid":
        xs = np.arange(W, dtype=np.float32)[None, :] + np.arange(H, dtype=np.float32)[:, None] * 0.4
        cxg = (cx - m.width / 2 - 100 * S) + (m.width + 200 * S) * ease_io(gl)
        band = np.exp(-((xs - cxg) / (38 * S)) ** 2).astype(np.float32)
        gm = np.asarray(canvas, np.float32) / 255 * band * 0.85 * k
        a = a + gm[..., None] * np.array([1.0, 0.9, 0.75], np.float32)
    return a

def ov_text(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = env_alpha(lt, dur, 0.35, 0.3)
    fnt = (INTERX if o.get("weight") == "x" else INTERB)(o.get("size", 38))
    txt = o["text"]
    if o.get("typing"):
        txt = txt[:int(len(txt) * clamp(lt / o["typing"]))]
        if not txt: return a
    m = text_mask(txt, fnt, int(o.get("track", 0) * S))
    canvas = Image.new("L", (W, H), 0)
    paste_mask(canvas, m, W * o.get("x", 0.5), H * o.get("y", 0.5) - (1 - ease_out(lt / 0.4)) * 10 * S)
    a = shadow(a, canvas, 0.45 * k, 6, (0, 3))
    return fill(a, canvas, o.get("mode", "solid"), o.get("color", (1, 1, 1)), k)

def ov_tag(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = ease_out(lt / 0.35); out = 1 - ease((lt - dur + 0.15) / 0.15)
    grad = np.clip((np.linspace(0, 1, H) - 0.5) / 0.4, 0, 1)[:, None, None].astype(np.float32) ** 1.5
    a = a * (1 - 0.7 * grad * ease(lt / 0.3) * out)
    x0 = 120 * S - (1 - k) * 60 * S; y0 = H - BAR - 250 * S
    bar = Image.new("L", (W, H), 0)
    ImageDraw.Draw(bar).rectangle([x0, y0 + (1 - k) * 140 * S, x0 + 8 * S, y0 + 140 * S], fill=255)
    a = fill(a, bar, "solid", tuple(ORANGE), out)
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    d.text((x0 + 34 * S, y0 - 12 * S), o["year"], font=ANTON(88), fill=255)
    d.text((x0 + 37 * S, y0 + 96 * S), o["label"], font=INTERX(30), fill=255)
    a = shadow(a, can, 0.45 * out * k, 6, (0, 3))
    a = fill(a, can, "solid", (1, 1, 1), out * k)
    if o.get("stat"):
        cs = Image.new("L", (W, H), 0)
        ImageDraw.Draw(cs).text((x0 + 37 * S, y0 + 140 * S), o["stat"], font=INTERB(24), fill=255)
        a = fill(a, cs, "solid", tuple(np.clip(ORANGE * 1.3, 0, 1)), out * ease((lt - 0.25) / 0.4))
    return a

def ov_timeline(a, o, t):
    """Career timeline drawn on the bottom letterbox bar."""
    steps, n = o["steps"], o["n"]; lt = t - o["t0"]; p = ease_out(lt / 0.5)
    can, acc = Image.new("L", (W, H), 0), Image.new("L", (W, H), 0)
    d, da = ImageDraw.Draw(can), ImageDraw.Draw(acc)
    x0, x1, y = 340 * S, W - 340 * S, H - BAR / 2 + 10 * S
    d.line([x0, y, x1, y], fill=70, width=max(1, int(2 * S)))
    fx = x0 + (x1 - x0) * clamp((n - 1 + p) / (len(steps) - 1)) if n > 0 else x0
    da.line([x0, y, fx, y], fill=255, width=max(1, int(3 * S)))
    for i, s in enumerate(steps):
        x = x0 + (x1 - x0) * i / (len(steps) - 1); on = i <= n; r = (7 if i == n else 4) * S
        (da if on else d).ellipse([x - r, y - r, x + r, y + r], fill=255 if on else 110)
        d.text((x, y - 22 * S), s, font=INTERB(15), fill=230 if on else 90, anchor="mm")
    a = fill(a, can, "solid", (1, 1, 1))
    return fill(a, acc, "solid", tuple(ORANGE))

def ov_counter(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    v = int(o["value"] * ease_out(clamp(lt / o.get("count", 1.4))))
    k = 1 - ease((lt - dur + 0.25) / 0.25)
    a = a * (1 - 0.4 * ease(lt / 0.3) * k)
    can = Image.new("L", (W, H), 0)
    paste_mask(can, text_mask(o["fmt"].format(v), ANTON(o.get("size", 180))), W / 2, H * 0.45)
    a = shadow(a, can, 0.55 * k, 14, (0, 8)); a = fill(a, can, "solid", (1, 1, 1), k * ease(lt / 0.2))
    bar = Image.new("L", (W, H), 0); prog = ease_out(clamp(lt / o.get("count", 1.4)))
    bw_ = 520 * S; ImageDraw.Draw(bar).rectangle([W / 2 - bw_ / 2, H * 0.535, W / 2 - bw_ / 2 + bw_ * prog, H * 0.535 + 4 * S], fill=255)
    a = fill(a, bar, "solid", tuple(ORANGE), k)
    sub = Image.new("L", (W, H), 0)
    paste_mask(sub, text_mask(o["sub"], INTERX(28), int(5 * S)), W / 2, H * 0.6)
    return fill(a, sub, "solid", tuple(np.clip(ORANGE * 1.3, 0, 1)), k * ease((lt - 0.3) / 0.5))

def ov_score(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = ease_out(lt / 0.4) * (1 - ease((lt - dur + 0.25) / 0.25))
    w_, h_ = 700 * S, 104 * S; x0 = W / 2 - w_ / 2; y0 = BAR + 40 * S - (1 - k) * 30 * S
    box = Image.new("L", (W, H), 0); ImageDraw.Draw(box).rectangle([x0, y0, x0 + w_, y0 + h_], fill=255)
    a = fill(a, box, "solid", (0.04, 0.04, 0.05), 0.85 * k)
    hl = Image.new("L", (W, H), 0); ImageDraw.Draw(hl).rectangle([x0 + w_ / 2, y0, x0 + w_, y0 + h_], fill=255)
    a = fill(a, hl, "solid", tuple(ORANGE * 0.85), 0.9 * k)
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    d.text((x0 + 36 * S, y0 + h_ / 2), o["a"], font=ANTON(52), fill=255, anchor="lm")
    d.text((x0 + w_ / 2 - 28 * S, y0 + h_ / 2), str(o["sa"]), font=ANTON(64), fill=255, anchor="rm")
    d.text((x0 + w_ / 2 + 28 * S, y0 + h_ / 2), str(o["sb"]), font=ANTON(64), fill=255, anchor="lm")
    d.text((x0 + w_ - 36 * S, y0 + h_ / 2), o["b"], font=ANTON(52), fill=255, anchor="rm")
    d.text((W / 2, y0 + h_ + 28 * S), o["sub"], font=INTERB(22), fill=255, anchor="mm")
    return fill(a, can, "solid", (1, 1, 1), k)

def ov_stamp(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = (1 - ease((lt - dur + 0.2) / 0.2)) * ease(lt / 0.06)
    sc = 1.25 - 0.25 * ease_out(lt / 0.2)
    m = text_mask(o["text"], ANTON(o.get("size", 110)), int(6 * S)); pad = int(24 * S)
    box = Image.new("L", (m.width + 2 * pad, m.height + 2 * pad), 0); lw = max(2, int(7 * S))
    ImageDraw.Draw(box).rectangle([lw, lw, box.width - lw, box.height - lw], outline=255, width=lw)
    box.paste(m, (pad, pad), m); box = box.rotate(o.get("rot", -7), expand=True, resample=Image.BICUBIC)
    can = Image.new("L", (W, H), 0); paste_mask(can, box, W * o.get("x", 0.5), H * o.get("y", 0.5), sc)
    return fill(a, can, "solid", (0.9, 0.13, 0.12), k * 0.95)

def ov_leak(a, o, t):
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = math.sin(math.pi * clamp(lt / dur)) * o.get("amt", 0.5)
    return 1 - (1 - a) * (1 - leak_layer(o.get("v", 0), k, lt / dur))

def ov_dust(a, o, t):
    r = np.random.default_rng(int(t * 24))
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    for _ in range(r.integers(2, 8)):
        x, y, rr = r.uniform(0, W), r.uniform(0, H), r.uniform(1, 3) * S
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=int(r.uniform(60, 160)))
    m = np.asarray(can, np.float32)[..., None] / 255 * o.get("amt", 0.45)
    return a * (1 - m) + 0.85 * m

def ov_vhs(a, o, t):
    """Tape-rewind look: rolling tracking band, scanlines, slight chroma offset and lift."""
    lt = t - o["t0"]
    a = a.copy()
    sh = max(1, int(5 * S)); a[..., 0] = np.roll(a[..., 0], sh, 1); a[..., 2] = np.roll(a[..., 2], -sh, 1)
    band_y = int((1 - (lt * 0.9) % 1) * H); bh = int(46 * S)
    y0, y1 = max(0, band_y - bh), min(H, band_y + bh)
    if y1 > y0:
        a[y0:y1] = np.roll(a[y0:y1], int(28 * S), 1) * 0.8 + 0.12
    a[::3] *= 0.9
    return a

def ov_rewind_year(a, o, t):
    """Big year that steps backwards on every cut, with a REWIND badge and running timecode."""
    lt = t - o["t0"]
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    x0, y0 = W - 120 * S, BAR + 34 * S
    pop = 1 + 0.12 * (1 - ease_out(lt / 0.12))
    m = text_mask(o["year"], ANTON(120))
    paste_mask(can, m, x0 - m.width / 2, y0 + m.height / 2 + 30 * S, pop)
    d.text((x0, y0), "<< REWIND", font=INTERX(26), fill=255, anchor="ra")
    a = shadow(a, can, 0.6, 8, (0, 4))
    a = fill(a, can, "solid", (1, 1, 1), 0.95)
    dot = Image.new("L", (W, H), 0)
    if int(t * 4) % 2 == 0: ImageDraw.Draw(dot).ellipse([120 * S, BAR + 40 * S, 138 * S, BAR + 58 * S], fill=255)
    a = fill(a, dot, "solid", (0.95, 0.15, 0.12), 0.9)
    tc = Image.new("L", (W, H), 0); f = t * 30
    ImageDraw.Draw(tc).text((150 * S, BAR + 36 * S), "PLAY  %02d:%02d:%02d" % (int(f // 1800) % 60, int(f // 30) % 60, int(f) % 30),
                            font=INTERB(22), fill=255)
    return fill(a, tc, "solid", (1, 1, 1), 0.85)

def ov_lower(a, o, t):
    """Documentary lower third: accent bar wipes in, name + descriptor slide up from a mask."""
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = ease_out(lt / 0.5); out = 1 - ease((lt - dur + 0.35) / 0.35)
    x0, y0 = 120 * S, H - BAR - 210 * S
    grad = np.clip((np.linspace(0, 1, W) - 0.0) / 0.55, 0, 1)[None, :, None].astype(np.float32)
    vg = np.clip((np.linspace(0, 1, H) - 0.62) / 0.3, 0, 1)[:, None, None].astype(np.float32)
    a = a * (1 - 0.55 * (1 - grad) * vg * k * out)
    bar = Image.new("L", (W, H), 0)
    ImageDraw.Draw(bar).rectangle([x0, y0 + 8 * S, x0 + 6 * S, y0 + 8 * S + 118 * S * k], fill=255)
    a = fill(a, bar, "solid", tuple(ORANGE), out)
    for txt, fnt, dy, col, delay in ((o["name"], ANTON(64), 0, (1, 1, 1), 0.1), (o["role"], INTERB(26), 78, (0.85, 0.85, 0.85), 0.25),
                                      (o.get("date", ""), INTERX(20), 116, tuple(np.clip(ORANGE * 1.3, 0, 1)), 0.4)):
        if not txt: continue
        kk = ease_out((lt - delay) / 0.45)
        can = Image.new("L", (W, H), 0)
        ImageDraw.Draw(can).text((x0 + 26 * S, y0 + dy * S + (1 - kk) * 30 * S), txt, font=fnt, fill=255)
        clipm = Image.new("L", (W, H), 0); ImageDraw.Draw(clipm).rectangle([0, y0 + dy * S - 6 * S, W, y0 + dy * S + 80 * S], fill=255)
        can = Image.fromarray(np.minimum(np.asarray(can), np.asarray(clipm)))
        a = shadow(a, can, 0.4 * kk * out, 5, (0, 3)); a = fill(a, can, "solid", col, kk * out)
    return a

def ov_credit(a, o, t):
    """Small source credit (attribution for CC BY material)."""
    lt, dur = t - o["t0"], o["t1"] - o["t0"]
    k = env_alpha(lt, dur, 0.4, 0.4) * 0.8
    can = Image.new("L", (W, H), 0)
    ImageDraw.Draw(can).text((W - 60 * S, BAR + 26 * S), o["text"], font=INTERB(17), fill=255, anchor="ra")
    return fill(a, can, "solid", (1, 1, 1), k)

OVF = {"title": ov_title, "text": ov_text, "tag": ov_tag, "timeline": ov_timeline, "counter": ov_counter,
       "score": ov_score, "stamp": ov_stamp, "leak": ov_leak, "dust": ov_dust, "vhs": ov_vhs,
       "rewind_year": ov_rewind_year, "lower": ov_lower, "credit": ov_credit}

# ------------------------------------------------------------------ shots & transitions
_map = {}
def map_frame(sh, t, p):
    """Animated journey map. sh: legs=[(cityA, cityB)], views=[(x0,y0,x1,y1) start, end], labels."""
    import mapgen
    v0, v1 = sh["views"]
    legs = sh.get("legs", [])
    if legs:   # camera travels together with the route so the drawing head never leaves the frame
        cam = sh.get("leg_t", 0.4) + (len(legs) - 1) * sh.get("leg_gap", 1.2) + sh.get("leg_len", 1.1)
        q = ease_io(clamp((t - sh["t0"]) / cam))
    else:
        q = ease_io(p)
    view = tuple(v0[i] + (v1[i] - v0[i]) * q for i in range(4))
    st_name = {"OH": "Ohio", "LA": "Louisiana"}
    hi = tuple(sorted({st_name[c.split(", ")[1]] for c in list(sh.get("cities_on", [])) + [x for l in legs for x in l]}))
    key = tuple(round(x, 1) for x in view) + hi
    if key not in _map:
        if len(_map) > 40: _map.clear()
        _map[key] = mapgen.base_map(W, H, view, hi=hi)
    base, m = _map[key]
    a = base.copy()
    can = Image.new("L", (W, H), 0); glow = Image.new("L", (W, H), 0)
    d, dg = ImageDraw.Draw(can), ImageDraw.Draw(glow)
    lt = t - sh["t0"]
    shown = set(sh.get("cities_on", []))
    for i, (ca, cb) in enumerate(sh.get("legs", [])):
        t_start, t_len = sh.get("leg_t", 0.4) + i * sh.get("leg_gap", 1.2), sh.get("leg_len", 1.1)
        f = clamp((lt - t_start) / t_len)
        if f <= 0: continue
        pa, pb = m(mapgen.albers_usa(*mapgen.CITIES[ca])), m(mapgen.albers_usa(*mapgen.CITIES[cb]))
        mx, my = (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - abs(pb[0] - pa[0]) * 0.18 - 30 * S
        n = 40; pts = []
        for j in range(int(n * ease_io(f)) + 1):
            u = j / n; pts.append(((1 - u) ** 2 * pa[0] + 2 * u * (1 - u) * mx + u * u * pb[0], (1 - u) ** 2 * pa[1] + 2 * u * (1 - u) * my + u * u * pb[1]))
        if len(pts) > 1:
            d.line(pts, fill=255, width=max(2, int(6 * S))); dg.line(pts, fill=255, width=max(4, int(20 * S)))
            hx, hy = pts[-1]; dg.ellipse([hx - 16 * S, hy - 16 * S, hx + 16 * S, hy + 16 * S], fill=255)
        shown.add(ca)
        if f >= 1: shown.add(cb)
    gm = np.asarray(glow.filter(ImageFilter.GaussianBlur(10 * S)), np.float32)[..., None] / 255
    a = 1 - (1 - a) * (1 - gm * 0.7 * ORANGE)
    a = fill(a, can, "solid", tuple(ORANGE))
    st = Image.new("L", (W, H), 0); ds = ImageDraw.Draw(st)
    for name, (lo, la) in mapgen.STATE_LABELS.items():
        x, y = m(mapgen.albers_usa(lo, la))
        if 0 < x < W and BAR < y < H - BAR:
            ds.text((x, y), name.upper(), font=INTERX(int(22 if name in ("Ohio", "Louisiana") else 15)), fill=255, anchor="mm")
    a = fill(a, st, "solid", (1, 1, 1), 0.16)
    labs = Image.new("L", (W, H), 0); dl = ImageDraw.Draw(labs); dots = Image.new("L", (W, H), 0); dd = ImageDraw.Draw(dots)
    pills = Image.new("L", (W, H), 0); dp = ImageDraw.Draw(pills); rings = Image.new("L", (W, H), 0); dr_ = ImageDraw.Draw(rings)
    order = sorted(shown, key=lambda c: (c not in sh.get("years", {}), c == "ATHENS, OH"))
    placed = []
    for c in order:
        x, y = m(mapgen.albers_usa(*mapgen.CITIES[c]))
        crowded = any(math.hypot(x - px, y - py) < 70 * S for px, py in placed)
        placed.append((x, y))
        pulse = 0.5 + 0.5 * math.sin(lt * 4)
        r_ = 9 * S; rr = (14 + 22 * ((lt * 0.8) % 1)) * S
        dd.ellipse([x - r_, y - r_, x + r_, y + r_], fill=255)
        dr_.ellipse([x - rr, y - rr, x + rr, y + rr], outline=int(255 * (1 - (lt * 0.8) % 1)), width=max(1, int(3 * S)))
        yr = sh.get("years", {}).get(c, "")
        side = -1 if c in sh.get("left", []) else 1
        if crowded: continue                     # nearby city already labelled: keep only its dot
        f1, f2 = INTERX(30), ANTON(40)
        w1 = f1.getbbox(c)[2]; w2 = f2.getbbox(yr)[2] if yr else 0
        bx = x + side * 26 * S if side > 0 else x - 26 * S - max(w1, w2) - 28 * S
        dp.rounded_rectangle([bx, y - 40 * S, bx + max(w1, w2) + 28 * S, y + (50 if yr else 6) * S], radius=8 * S, fill=255)
        dl.text((bx + 14 * S, y - 34 * S), c, font=f1, fill=255)
        if yr: dl.text((bx + 14 * S, y + 0 * S), yr, font=f2, fill=255)
    a = fill(a, rings, "solid", tuple(ORANGE), 0.9)
    a = fill(a, dots, "solid", (1, 1, 1))
    a = fill(a, pills, "solid", (0.03, 0.03, 0.04), 0.72)
    labs_np = np.asarray(labs)
    a = fill(a, labs, "solid", (1, 1, 1))
    return a

def shot_frame(sh, t):
    p = clamp((t - sh["t0"]) / max(1e-6, sh["t1"] - sh["t0"]))
    kind = sh["kind"]
    if kind == "map": return map_frame(sh, t, p)
    if kind == "black": return np.zeros((H, W, 3), np.float32) + 0.015
    if kind == "split":
        a = np.zeros((H, W, 3), np.float32) + 0.015
        n = len(sh["panels"]); gap = max(2, int(6 * S)); pw = (W - gap * (n - 1)) // n
        for i, pn in enumerate(sh["panels"]):
            if t < pn["t_in"]: continue
            k = ease_out((t - pn["t_in"]) / 0.5)
            sub = dict(pn, t0=sh["t0"], t1=sh["t1"], id=f'{sh["id"]}_{i}', par=0.6)
            img = grade(photo_frame(sub, p, pw, H), pn.get("look", "bw"))
            x = i * (pw + gap)
            a[:, x:x + pw] = a[:, x:x + pw] * (1 - k) + img * k          # fade up, no sliding
        return a
    if sh.get("blur"):
        small = photo_frame(dict(sh, par=0), p, W // 4, H // 4)
        img = cv2.resize(cv2.GaussianBlur(small, (0, 0), 6), (W, H), interpolation=cv2.INTER_CUBIC)
        return grade(img, sh.get("look", "muted")) * sh.get("dark", 0.32)
    img = photo_frame(sh, p) if kind == "photo" else clip_frame(sh, t)
    img = grade(img, sh.get("look", "teal"))
    lt = t - sh["t0"]
    if sh.get("kick") and lt < 0.4:                                       # single damped bump
        off = int(sh["kick"] * S * math.exp(-lt * 9) * math.sin(lt * 30))
        img = np.roll(img, off, 0)
    return img

def shot_at(t):
    cur = None
    for s in SHOTS:
        if s["t0"] <= t < s["t1"]: cur = s
    return cur or SHOTS[-1]

def zoom(a, z):
    if abs(z - 1) < 1e-3: return a
    M = np.float32([[z, 0, (1 - z) * W / 2], [0, z, (1 - z) * H / 2]])
    return cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def zoom_blur(a, z, n=4):
    acc = np.zeros_like(a)
    for i in range(n): acc += zoom(a, 1 + (z - 1) * i / (n - 1))
    return acc / n

def compose(t):
    cur = shot_at(t)
    a = shot_frame(cur, t)
    for tr in TRANS:
        c, d = tr["t"], tr["d"]
        if not (c - d / 2 <= t < c + d / 2): continue
        q = (t - (c - d / 2)) / d
        A, B = tr["a"], tr["b"]
        fa = a if cur is A else shot_frame(A, t)
        fb = a if cur is B else shot_frame(B, t)
        ty = tr["type"]
        if ty == "cross":
            a = fa * (1 - ease_io(q)) + fb * ease_io(q)
        elif ty == "leak":
            a = fa * (1 - ease_io(q)) + fb * ease_io(q)
            a = 1 - (1 - a) * (1 - leak_layer(tr.get("v", 0), math.sin(math.pi * q) * 0.9, q))
        elif ty == "burn":
            k = math.sin(math.pi * q)
            a = fa * (1 - ease_io(q)) + fb * ease_io(q)
            lk = leak_layer(tr.get("v", 1), 1.0, q) * 0.5
            a = 1 - (1 - a) * (1 - np.clip(lk * k, 0, 1))
            a = a + (k ** 4) * 0.12 * np.array([1.0, 0.7, 0.4], np.float32)
        elif ty == "dip":
            a = (fa if q < 0.5 else fb) * abs(q - 0.5) * 2
        elif ty == "flash":
            a = (fa if q < 0.5 else fb) + (1 - abs(q - 0.5) * 2) ** 2 * 0.65
        elif ty == "zoom":
            if q < 0.5: a = zoom_blur(zoom(fa, 1 + 0.35 * ease_in(q * 2)), 1 + 0.08 * ease_in(q * 2))
            else: a = zoom_blur(zoom(fb, 1.2 - 0.2 * ease_out((q - 0.5) * 2)), 1 + 0.08 * (1 - ease_out((q - 0.5) * 2)))
        elif ty == "whip":
            sgn = tr.get("dir", 1); blur = int(90 * S * math.sin(math.pi * q)) * 2 + 1
            src = fa if q < 0.5 else fb
            off = int(sgn * W * 0.25 * (ease_in(q * 2) if q < 0.5 else -(1 - ease_out((q - 0.5) * 2))))
            a = cv2.blur(np.roll(src, -off, 1), (blur, 1))
        elif ty == "glitch":
            r = np.random.default_rng(int(t * 1000)); src = (fa if q < 0.5 else fb).copy(); k = math.sin(math.pi * q)
            for _ in range(int(4 + 6 * k)):
                y = r.integers(0, H - 10); hh = r.integers(4, int(40 * S) + 5)
                src[y:y + hh] = np.roll(src[y:y + hh], int(r.uniform(-60, 60) * S * k), 1)
            sh = int(8 * S * k) + 1; src[..., 0] = np.roll(src[..., 0], sh, 1); src[..., 2] = np.roll(src[..., 2], -sh, 1)
            a = src
    for o in OVL:
        if o["t0"] <= t < o["t1"] and o["type"] in ("leak", "dust", "vhs"): a = OVF[o["type"]](a, o, t)
    a = bloom(np.clip(a, 0, 1))
    a = a * VIG
    for ac in ACC:                                  # story accents
        lt = t - ac["t"]
        if 0 <= lt < ac.get("d", 0.15):
            if ac["type"] == "white": a = a + (1 - lt / ac.get("d", 0.15)) ** 2 * ac.get("amt", 0.6)
            elif ac["type"] == "neg": a = 1 - np.clip(a, 0, 1)
    a[:BAR] = 0.0; a[H - BAR:] = 0.0                # letterbox (graphics may draw on it)
    for o in OVL:
        if o["t0"] <= t < o["t1"] and o["type"] not in ("leak", "dust", "vhs"): a = OVF[o["type"]](a, o, t)
    a = draw_subs(a, t)
    g = GRAIN[int(t * 24) % len(GRAIN)]
    a = a + cv2.resize(g, (W, H), interpolation=cv2.INTER_NEAREST)[..., None]
    if t < 0.8: a = a * ease(t / 0.8)
    if t > DUR - 1.5: a = a * clamp((DUR - t) / 1.5)
    return np.uint8(np.clip(a, 0, 1) * 255)

def main():
    if "--frames" in ARGS:
        ts = [float(x) for x in ARGS[ARGS.index("--frames") + 1].split(",")]
        out = ARGS[ARGS.index("--out") + 1]
        ims = [Image.fromarray(compose(t)).resize((640, 360)) for t in ts]
        cols = 3; sheet = Image.new("RGB", (640 * cols, 360 * ((len(ims) + cols - 1) // cols)))
        for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 640, (i // cols) * 360))
        sheet.save(out); return
    part, nparts = 0, 1
    if "--part" in ARGS: part, nparts = map(int, ARGS[ARGS.index("--part") + 1].split("/"))
    n = int(DUR * FPS); a0, a1 = n * part // nparts, n * (part + 1) // nparts
    if "--range" in ARGS: a0, a1 = map(int, ARGS[ARGS.index("--range") + 1].split(":"))
    os.makedirs("output", exist_ok=True)
    out = f"output/{TAG}_part{part}.mp4" if not PREVIEW else f"output/{TAG}_preview{part}.mp4"
    if "--out" in ARGS: out = ARGS[ARGS.index("--out") + 1]
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
                           "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for fi in range(a0, a1):
        ff.stdin.write(compose(fi / FPS).tobytes())
        if (fi - a0) % 90 == 0: print(f"part{part} {fi - a0}/{a1 - a0}", flush=True)
    ff.stdin.close(); ff.wait(); print("wrote", out, flush=True)

if __name__ == "__main__":
    main()
