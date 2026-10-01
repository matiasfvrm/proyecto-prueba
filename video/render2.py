"""Renderer v2 for the Joe Burrow short.

Faster, denser edit: shots cut on words and music beats, a library of
transitions (whip pan, zoom-through, glitch, light leak, wipe, flash, dip),
karaoke subtitles whose words invert the picture underneath (negative),
animated titles/data cards, split screens, letterbox, grain, dust.

Usage: python3 render2.py [--preview] [--part i/n] [--frames t1,t2,...]
"""
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from plan2 import build_plan, OFF, DUR

ARGS = sys.argv[1:]
PREVIEW = "--preview" in ARGS
W, H = (960, 540) if PREVIEW else (1920, 1080)
FPS = 15 if PREVIEW else 30
S = W / 1920
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts") + "/"
_fonts = {}
def font(name, size):
    k = (name, int(size * S))
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(F + name, max(6, int(size * S)))
    return _fonts[k]
ANTON = lambda s: font("anton-latin-400-normal.ttf", s)
INTERX = lambda s: font("inter-latin-900-normal.ttf", s)
INTERB = lambda s: font("inter-latin-700-normal.ttf", s)
ORANGE = np.array([251, 79, 20], np.float32) / 255

def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def ease_out(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3
def ease_in(x): x = min(max(x, 0.0), 1.0); return x ** 3
def back_out(x, k=1.9):
    x = min(max(x, 0.0), 1.0) - 1; return 1 + (k + 1) * x ** 3 + k * x ** 2

PLAN = build_plan()
SHOTS, TRANS, OVL, SUBS, FLASH = PLAN["shots"], PLAN["trans"], PLAN["overlays"], PLAN["subs"], PLAN["flash"]

# ------------------------------------------------------------------ sources
_img = {}
def photo_base(path):
    if path not in _img:
        im = Image.open(path).convert("RGB")
        tw, th = int(W * 1.45), int(H * 1.45)
        r = max(tw / im.width, th / im.height)
        _img[path] = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    return _img[path]

def photo_frame(sh, p, w=W, h=H):
    im = photo_base(sh["src"])
    z = sh["z0"] + (sh["z1"] - sh["z0"]) * ease(p)
    scale = min(im.width / w, im.height / h) / z
    cw, ch = w * scale, h * scale
    fx, fy = sh.get("focus", (0.5, 0.45))
    cx = im.width * fx + sh.get("dx", 0) * (p - 0.5) * im.width * 0.10
    cy = im.height * fy + sh.get("dy", 0) * (p - 0.5) * im.height * 0.10
    cx = min(max(cx, cw / 2), im.width - cw / 2); cy = min(max(cy, ch / 2), im.height - ch / 2)
    out = im.transform((w, h), Image.EXTENT, (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2), Image.BILINEAR)
    return np.asarray(out, np.float32) / 255

class Clip:
    def __init__(self, path, ss, speed, w, h, cz=1.1, cy=0.5):
        vf = (f"setpts={1/speed}*PTS,fps={FPS},scale={int(w*cz)}:{int(h*cz)}:force_original_aspect_ratio=increase,"
              f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{cy}")
        self.w, self.h = w, h
        self.p = subprocess.Popen(["ffmpeg", "-v", "quiet", "-ss", f"{ss:.3f}", "-i", path, "-an", "-vf", vf,
                                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((h, w, 3), np.float32)
    def read(self):
        b = self.p.stdout.read(self.w * self.h * 3)
        if len(b) == self.w * self.h * 3:
            self.last = np.frombuffer(b, np.uint8).reshape(self.h, self.w, 3).astype(np.float32) / 255
        return self.last
_clips = {}
def clip_frame(sh, t, w=W, h=H):
    key = (sh["id"], w)
    if key not in _clips:
        _clips[key] = Clip(sh["src"], sh.get("ss", 0) + (t - sh["t0"]) * sh.get("speed", 1.0),
                           sh.get("speed", 1.0), w, h, sh.get("cz", 1.1), sh.get("cy", 0.5))
    return _clips[key].read()

# ------------------------------------------------------------------ grading
LUM = np.array([0.299, 0.587, 0.114], np.float32)
def grade(a, look):
    lum = (a @ LUM)[..., None]
    if look == "bw":
        a = np.repeat(lum, 3, 2); a = np.clip((a - 0.5) * 1.35 + 0.5, 0, 1); return a
    if look == "duo":                       # orange/black duotone
        l = np.clip((lum - 0.08) * 1.3, 0, 1)
        return l * ORANGE * 1.15 + (l ** 2) * (1 - ORANGE) * 0.9
    if look == "cold":
        a = lum + (a - lum) * 0.55
        a = a * np.array([0.88, 0.98, 1.1], np.float32)
        return np.clip((a - 0.5) * 1.2 + 0.47, 0, 1)
    sat = {"warm": 0.95, "teal": 0.9, "muted": 0.65}.get(look, 0.9)
    a = lum + (a - lum) * sat
    a = np.clip((a - 0.5) * 1.18 + 0.5, 0, 1)
    sh = (1 - lum) ** 2; hi = lum ** 2
    a = a + sh * np.array([-0.035, 0.015, 0.06], np.float32) + hi * np.array([0.06, 0.02, -0.045], np.float32)
    return a

yy, xx = np.mgrid[0:H, 0:W]
_d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = np.clip(1.12 - 0.5 * _d ** 1.9, 0.3, 1.0)[..., None].astype(np.float32)
del yy, xx, _d
_rng = np.random.default_rng(5)
GRAIN = [_rng.normal(0, 0.028, (H // 2, W // 2, 1)).astype(np.float32) for _ in range(8)]

# light leak textures (soft warm blobs), animated by translation
def _leak(seed):
    r = np.random.default_rng(seed); lw, lh = 64, 36
    yy, xx = np.mgrid[0:lh, 0:lw]; out = np.zeros((lh, lw, 3), np.float32)
    for _ in range(4):
        cx, cy, rad = r.uniform(0, lw), r.uniform(0, lh), r.uniform(8, 22)
        col = np.array(r.choice([[1, .45, .1], [1, .7, .25], [1, .25, .15], [1, .85, .6]]), np.float32)
        out += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad ** 2))[..., None] * col
    im = Image.fromarray(np.uint8(np.clip(out, 0, 1) * 255)).resize((int(W * 1.6), int(H * 1.6)), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255
LEAKS = [_leak(s) for s in (1, 2, 3)]

# ------------------------------------------------------------------ text
def text_mask(txt, fnt, tracking=0):
    """Return L-mode mask image sized to the text, with optional tracking."""
    if tracking == 0:
        l, t, r, b = fnt.getbbox(txt)
        m = Image.new("L", (r - l + 4, b - t + 4), 0)
        ImageDraw.Draw(m).text((2 - l, 2 - t), txt, font=fnt, fill=255)
        return m
    ws = [fnt.getbbox(c)[2] - fnt.getbbox(c)[0] if c != " " else fnt.getbbox("n")[2] for c in txt]
    l, t, r, b = fnt.getbbox(txt)
    tw = int(sum(ws) + tracking * (len(txt) - 1)) + 8
    m = Image.new("L", (max(4, tw), b - t + 8), 0); d = ImageDraw.Draw(m); x = 4
    for c, w_ in zip(txt, ws):
        bb = fnt.getbbox(c); d.text((x - bb[0], 4 - t), c, font=fnt, fill=255); x += w_ + tracking
    return m

def paste_mask(canvas, m, cx, cy, scale=1.0):
    if scale != 1.0:
        m = m.resize((max(1, int(m.width * scale)), max(1, int(m.height * scale))), Image.BILINEAR)
    canvas.paste(m, (int(cx - m.width / 2), int(cy - m.height / 2)), m)
    return (int(cx - m.width / 2), int(cy - m.height / 2), m.width, m.height)

def apply_fill(a, mask, mode, color=(1, 1, 1), alpha=1.0):
    m = (np.asarray(mask, np.float32) / 255 * alpha)[..., None]
    if mode == "neg":
        fill = 1 - a
    elif mode == "diff":
        fill = np.abs(np.array(color, np.float32) - a)
    else:
        fill = np.array(color, np.float32)
    return a * (1 - m) + fill * m

def shadow(a, mask, strength=0.65, blur=10, off=(4, 6)):
    sm = mask.filter(ImageFilter.GaussianBlur(blur * S))
    sm = Image.fromarray(np.roll(np.roll(np.asarray(sm), int(off[1] * S), 0), int(off[0] * S), 1))
    m = (np.asarray(sm, np.float32) / 255 * strength)[..., None]
    return a * (1 - m)

# ------------------------------------------------------------------ overlays
def draw_subs(a, t):
    for ch in SUBS:
        if not (ch["t0"] <= t < ch["t1"]): continue
        words = ch["words"]; fnt = ANTON(84)
        gap = 22 * S
        sizes = [fnt.getbbox(w["w"]) for w in words]
        widths = [b[2] - b[0] + (40 * S if w.get("key") else 0) for b, w in zip(sizes, words)]
        total = sum(widths) + gap * (len(words) - 1)
        x = W / 2 - total / 2; y = H * ch.get("y", 0.80)
        k_in = ease_out((t - ch["t0"]) / 0.12)
        y += (1 - k_in) * 30 * S
        fill_m = Image.new("L", (W, H), 0); act_m = Image.new("L", (W, H), 0)
        box_m = Image.new("L", (W, H), 0); dbox = ImageDraw.Draw(box_m)
        active_key = False
        for w, wd in zip(words, widths):
            cx = x + wd / 2
            on = w["t0"] <= t < w["t1"] + 0.05
            spoken = t >= w["t0"]
            sc = 1.0
            if on: sc = 1.0 + 0.18 * (1 - ease_out((t - w["t0"]) / 0.14))
            m = text_mask(w["w"], fnt)
            if on and w.get("key"):
                active_key = True
                pad = 16 * S
                bw_, bh_ = m.width * sc + 2 * pad, m.height * sc + pad
                dbox.rounded_rectangle([cx - bw_ / 2, y - bh_ / 2, cx + bw_ / 2, y + bh_ / 2], radius=10 * S, fill=255)
                paste_mask(act_m, m, cx, y, sc)
            elif on:
                paste_mask(act_m, m, cx, y, sc)
            else:
                mm = m if spoken else m.point(lambda v: v * 0.55)
                paste_mask(fill_m, mm, cx, y, sc)
            x += wd + gap
        allm = Image.fromarray(np.maximum(np.asarray(fill_m), np.asarray(act_m)))
        a = shadow(a, allm, 0.75, 9, (3, 5))
        a = apply_fill(a, fill_m, "solid", (1, 1, 1))
        if active_key:
            # negative capsule: inside the box the picture is inverted, the word punches through in orange
            a = apply_fill(a, box_m, "neg")
            a = apply_fill(a, act_m, "solid", tuple(ORANGE * 1.05))
        else:
            a = apply_fill(a, act_m, "solid", tuple(np.clip(ORANGE * 1.15, 0, 1)))
    return a

def ov_title(a, o, t):
    p = (t - o["t0"]) / (o["t1"] - o["t0"]); lt = t - o["t0"]
    size = o.get("size", 260); style = o.get("style", "slam")
    fnt = ANTON(size)
    track = o.get("track", 0) * S
    if style == "expand": track = (6 + 40 * ease_out(p)) * S
    m = text_mask(o["text"], fnt, int(track))
    sc = 1.0
    if style == "slam": sc = 1 + 0.9 * (1 - back_out(lt / 0.28, 1.2)) if lt < 0.28 else 1 + 0.04 * p
    else: sc = 1 + 0.05 * p
    canvas = Image.new("L", (W, H), 0)
    cx, cy = W * o.get("x", 0.5), H * o.get("y", 0.5)
    if o.get("glitch") and lt < 0.3 and int(lt * 30) % 2 == 0:
        cx += _rng.uniform(-25, 25) * S
    paste_mask(canvas, m, cx, cy, sc)
    out_a = 1 - ease((t - (o["t1"] - 0.2)) / 0.2)
    alpha = min(1, lt / 0.06) * out_a
    if o.get("dim"): a = a * (1 - o["dim"] * min(1, lt / 0.15) * out_a)
    a = shadow(a, canvas, 0.6 * alpha, 16, (0, 8))
    mode = o.get("mode", "solid")
    if o.get("rgb") and lt < 0.35:          # chromatic split on the slam
        sh = int(14 * S * (1 - lt / 0.35)) + 1
        for ch_i, dx in ((0, sh), (2, -sh)):
            mm = Image.fromarray(np.roll(np.asarray(canvas), dx, 1))
            m_ = (np.asarray(mm, np.float32) / 255 * alpha * 0.8)
            a[..., ch_i] = a[..., ch_i] * (1 - m_) + m_
    return apply_fill(a, canvas, mode, o.get("color", (1, 1, 1)), alpha)

def ov_text(a, o, t):
    """Small caption line (reference style black-card text, or labels)."""
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = ease(lt / 0.25) * (1 - ease((lt - dur + 0.25) / 0.25))
    fnt = (INTERB if o.get("weight", "b") == "b" else INTERX)(o.get("size", 38))
    txt = o["text"]
    if o.get("typing"):                   # typewriter
        n = int(len(txt) * min(1, lt / o["typing"])); txt = txt[:n]
        if not txt: return a
    m = text_mask(txt, fnt, int(o.get("track", 0) * S))
    canvas = Image.new("L", (W, H), 0)
    paste_mask(canvas, m, W * o.get("x", 0.5), H * o.get("y", 0.5) - (1 - ease_out(lt / 0.3)) * 12 * S)
    a = shadow(a, canvas, 0.5 * k, 6, (2, 3))
    return apply_fill(a, canvas, o.get("mode", "solid"), o.get("color", (1, 1, 1)), k)

def ov_tag(a, o, t):
    """Lower-left timeline chip: big year + label, with accent bar and gradient."""
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = ease_out(lt / 0.3); out = 1 - ease((lt - dur + 0.15) / 0.15)
    grad = np.clip((np.linspace(0, 1, H) - 0.55) / 0.45, 0, 1)[:, None, None].astype(np.float32) ** 1.4
    a = a * (1 - 0.75 * grad * k * out)
    x0 = 110 * S - (1 - k) * 420 * S; y0 = H - 300 * S
    bar = Image.new("L", (W, H), 0); ImageDraw.Draw(bar).rectangle([x0, y0, x0 + 12 * S, y0 + 150 * S], fill=255)
    a = apply_fill(a, bar, "solid", tuple(ORANGE), out)
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    d.text((x0 + 38 * S, y0 - 14 * S), o["year"], font=ANTON(96), fill=255)
    d.text((x0 + 42 * S, y0 + 104 * S), o["label"], font=INTERX(34), fill=255)
    a = shadow(a, can, 0.5 * out, 6, (2, 3))
    a = apply_fill(a, can, "solid", (1, 1, 1), out)
    if o.get("stat"):
        cs = Image.new("L", (W, H), 0)
        ImageDraw.Draw(cs).text((x0 + 42 * S, y0 + 150 * S), o["stat"], font=INTERB(26), fill=255)
        a = apply_fill(a, cs, "solid", tuple(np.clip(ORANGE * 1.3, 0, 1)), out * ease(lt / 0.5))
    return a

def ov_timeline(a, o, t):
    steps = o["steps"]; n = o["n"]; lt = t - o["t0"]
    p = ease_out(lt / 0.5)
    can = Image.new("L", (W, H), 0); acc = Image.new("L", (W, H), 0)
    d, da = ImageDraw.Draw(can), ImageDraw.Draw(acc)
    x0, x1, y = 300 * S, W - 300 * S, H - 56 * S
    d.line([x0, y, x1, y], fill=90, width=max(1, int(3 * S)))
    fx = x0 + (x1 - x0) * min(1, (n - 1 + p) / (len(steps) - 1)) if n > 0 else x0
    da.line([x0, y, fx, y], fill=255, width=max(1, int(5 * S)))
    for i, s in enumerate(steps):
        x = x0 + (x1 - x0) * i / (len(steps) - 1); on = i <= n
        r = (12 if i == n else 7) * S
        (da if on else d).ellipse([x - r, y - r, x + r, y + r], fill=255 if on else 120)
        d.text((x, y - 28 * S), s, font=INTERB(17), fill=235 if on else 110, anchor="mm")
    a = apply_fill(a, can, "solid", (1, 1, 1))
    return apply_fill(a, acc, "solid", tuple(ORANGE))

def ov_counter(a, o, t):
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    v = int(o["value"] * ease_out(min(1, lt / o.get("count", 1.3))))
    k = 1 - ease((lt - dur + 0.2) / 0.2)
    a = a * (1 - 0.45 * k)
    can = Image.new("L", (W, H), 0)
    sc = 1 + 0.06 * (1 - ease_out(lt / 0.2))
    paste_mask(can, text_mask(o["fmt"].format(v), ANTON(o.get("size", 200))), W / 2, H * 0.45, sc)
    a = shadow(a, can, 0.6 * k, 14, (0, 8))
    a = apply_fill(a, can, "solid", (1, 1, 1), k)
    sub = Image.new("L", (W, H), 0)
    paste_mask(sub, text_mask(o["sub"], INTERX(32), int(4 * S)), W / 2, H * 0.62)
    return apply_fill(a, sub, "solid", tuple(np.clip(ORANGE * 1.3, 0, 1)), k * ease(lt / 0.5))

def ov_score(a, o, t):
    """TV-style scoreboard bug."""
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = ease_out(lt / 0.35) * (1 - ease((lt - dur + 0.2) / 0.2))
    w_, h_ = 760 * S, 120 * S; x0 = W / 2 - w_ / 2; y0 = H * o.get("y", 0.16) - (1 - k) * 60 * S
    box = Image.new("L", (W, H), 0); ImageDraw.Draw(box).rectangle([x0, y0, x0 + w_, y0 + h_], fill=255)
    a = apply_fill(a, box, "solid", (0.04, 0.04, 0.06), 0.88 * k)
    hl = Image.new("L", (W, H), 0); ImageDraw.Draw(hl).rectangle([x0 + w_ / 2 + 4 * S, y0, x0 + w_, y0 + h_], fill=255)
    a = apply_fill(a, hl, "solid", tuple(ORANGE * 0.85), 0.9 * k)
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    d.text((x0 + 40 * S, y0 + h_ / 2), o["a"], font=ANTON(58), fill=255, anchor="lm")
    d.text((x0 + w_ / 2 - 30 * S, y0 + h_ / 2), str(o["sa"]), font=ANTON(70), fill=255, anchor="rm")
    d.text((x0 + w_ / 2 + 40 * S, y0 + h_ / 2), str(o["sb"]), font=ANTON(70), fill=255, anchor="lm")
    d.text((x0 + w_ - 40 * S, y0 + h_ / 2), o["b"], font=ANTON(58), fill=255, anchor="rm")
    d.text((W / 2, y0 + h_ + 34 * S), o["sub"], font=INTERB(26), fill=255, anchor="mm")
    return apply_fill(a, can, "solid", (1, 1, 1), k)

def ov_stamp(a, o, t):
    """Red rubber-stamp style label that slams in, rotated."""
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = 1 - ease((lt - dur + 0.15) / 0.15)
    sc = 1 + 1.4 * (1 - ease_out(lt / 0.18))
    fnt = ANTON(o.get("size", 120))
    m = text_mask(o["text"], fnt, int(6 * S))
    pad = int(26 * S)
    box = Image.new("L", (m.width + 2 * pad, m.height + 2 * pad), 0)
    db = ImageDraw.Draw(box); lw = max(2, int(9 * S))
    db.rectangle([lw, lw, box.width - lw, box.height - lw], outline=255, width=lw)
    box.paste(m, (pad, pad), m)
    box = box.rotate(o.get("rot", -8), expand=True, resample=Image.BICUBIC)
    can = Image.new("L", (W, H), 0); paste_mask(can, box, W * o.get("x", 0.5), H * o.get("y", 0.5), sc)
    return apply_fill(a, can, "solid", (0.92, 0.12, 0.12), k * min(1, lt / 0.05))

def ov_letterbox(a, o, t):
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = ease_out(lt / 0.6) * (1 - ease((lt - dur + 0.5) / 0.5))
    bh = int(H * 0.115 * k)
    if bh > 0: a[:bh] *= 0.0; a[H - bh:] *= 0.0
    return a

def ov_leak(a, o, t):
    lt = t - o["t0"]; dur = o["t1"] - o["t0"]
    k = math.sin(math.pi * min(1, max(0, lt / dur))) * o.get("amt", 0.6)
    L = LEAKS[o.get("v", 0) % len(LEAKS)]
    ox = int((0.05 + 0.5 * lt / dur) * (L.shape[1] - W)); oy = int(0.2 * (L.shape[0] - H))
    leak = L[oy:oy + H, ox:ox + W]
    return 1 - (1 - a) * (1 - leak * k)          # screen blend

def ov_dust(a, o, t):
    r = np.random.default_rng(int(t * 30))
    can = Image.new("L", (W, H), 0); d = ImageDraw.Draw(can)
    for _ in range(r.integers(4, 14)):
        x, y, rr = r.uniform(0, W), r.uniform(0, H), r.uniform(1, 4) * S
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=int(r.uniform(90, 200)))
    if r.random() < 0.35:
        x = r.uniform(0, W); d.line([x, 0, x + r.uniform(-8, 8), H], fill=int(r.uniform(40, 110)), width=1)
    m = np.asarray(can, np.float32)[..., None] / 255 * o.get("amt", 0.6)
    return a * (1 - m) + (0.9 if r.random() < 0.5 else 0.05) * m

OVF = {"title": ov_title, "text": ov_text, "tag": ov_tag, "timeline": ov_timeline, "counter": ov_counter,
       "score": ov_score, "stamp": ov_stamp, "letterbox": ov_letterbox, "leak": ov_leak, "dust": ov_dust}

# ------------------------------------------------------------------ shots
def shot_frame(sh, t):
    p = (t - sh["t0"]) / max(1e-6, sh["t1"] - sh["t0"])
    kind = sh["kind"]
    if kind == "black":
        return np.zeros((H, W, 3), np.float32) + 0.02
    if kind == "split":
        a = np.zeros((H, W, 3), np.float32)
        n = len(sh["panels"]); pw = W // n
        for i, pn in enumerate(sh["panels"]):
            if t < pn["t_in"]: continue
            k = ease_out((t - pn["t_in"]) / 0.35)
            sub = dict(pn, t0=sh["t0"], t1=sh["t1"], id=f'{sh["id"]}_{i}')
            img = photo_frame(sub, p, pw, H) if pn["kind"] == "photo" else clip_frame(sub, t, pw, H)
            img = grade(img, pn.get("look", sh.get("look", "teal")))
            off = int((1 - k) * H * (1 if i % 2 else -1))
            img = np.roll(img, off, 0)
            if off > 0: img[:off] = 0
            elif off < 0: img[off:] = 0
            a[:, i * pw:(i + 1) * pw] = img
            if i: a[:, i * pw - max(1, int(3 * S)):i * pw + max(1, int(3 * S))] = 0.02
        return a
    z0, z1 = sh["z0"], sh["z1"]
    lt = t - sh["t0"]
    if sh.get("punch") and lt < 0.22:
        bump = 0.14 * (1 - ease_out(lt / 0.22)); sh = dict(sh, z0=z0 * (1 + bump), z1=z1 * (1 + bump))
    img = photo_frame(sh, p) if kind == "photo" else clip_frame(sh, t)
    img = grade(img, sh.get("look", "teal"))
    if sh.get("shake"):
        amp = sh["shake"] * S * (1.0 if lt > 0.5 else 1 + 2 * (1 - lt / 0.5))
        dx = int(amp * math.sin(t * 37.0) + amp * 0.6 * math.sin(t * 53.0))
        dy = int(amp * 0.7 * math.sin(t * 41.0 + 1))
        img = np.roll(np.roll(img, dx, 1), dy, 0)
    return img

def find_shots(t):
    return [s for s in SHOTS if s["t0"] - 0.6 <= t < s["t1"] + 0.6]

def shot_at(t):
    cur = None
    for s in SHOTS:
        if s["t0"] <= t < s["t1"]: cur = s
    return cur or SHOTS[-1]

def motion_blur(a, dx):
    if abs(dx) < 2: return np.roll(a, int(dx), 1)
    acc = np.zeros_like(a); n = 6
    for i in range(n):
        acc += np.roll(a, int(dx * i / (n - 1)), 1)
    return acc / n

def zoom(a, z):
    if abs(z - 1) < 1e-3: return a
    im = Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255))
    cw, ch = W / z, H / z
    im = im.transform((W, H), Image.EXTENT, ((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2), Image.BILINEAR)
    return np.asarray(im, np.float32) / 255

def radial_blur(a, z):
    acc = np.zeros_like(a)
    for i in range(4): acc += zoom(a, 1 + (z - 1) * i / 3)
    return acc / 4

def glitch(a, k, seed):
    r = np.random.default_rng(seed); out = a.copy()
    for _ in range(int(6 + 10 * k)):
        y = r.integers(0, H - 10); h_ = r.integers(4, int(60 * S) + 5); dx = int(r.uniform(-120, 120) * S * k)
        out[y:y + h_] = np.roll(out[y:y + h_], dx, 1)
    sh = int(14 * S * k) + 1
    out[..., 0] = np.roll(out[..., 0], sh, 1); out[..., 2] = np.roll(out[..., 2], -sh, 1)
    return out

def compose(t):
    cur = shot_at(t)
    a = shot_frame(cur, t)
    for tr in TRANS:
        c, d = tr["t"], tr["d"]
        if not (c - d / 2 <= t < c + d / 2): continue
        q = (t - (c - d / 2)) / d                  # 0..1 across the transition
        A, B = tr["a"], tr["b"]
        fa = shot_frame(A, min(t, A["t1"] - 1e-3)) if t >= A["t1"] else (a if cur is A else shot_frame(A, t))
        fb = shot_frame(B, max(t, B["t0"])) if t < B["t0"] else (a if cur is B else shot_frame(B, t))
        ty = tr["type"]
        if ty == "whip":
            sgn = tr.get("dir", 1); off = W * ease_in(q) if q < 0.5 else W * (1 - ease_out(q))
            if q < 0.5: a = motion_blur(np.roll(fa, int(-sgn * off * 0.5), 1), -sgn * 160 * S * math.sin(math.pi * q))
            else: a = motion_blur(np.roll(fb, int(sgn * off * 0.5), 1), -sgn * 160 * S * math.sin(math.pi * q))
        elif ty == "zoom":
            if q < 0.5: a = radial_blur(zoom(fa, 1 + 0.6 * ease_in(q * 2)), 1 + 0.25 * q)
            else: a = radial_blur(zoom(fb, 1.35 - 0.35 * ease_out((q - 0.5) * 2)), 1 + 0.25 * (1 - q))
        elif ty == "glitch":
            a = glitch(fa if q < 0.5 else fb, math.sin(math.pi * q), int(t * 1000))
        elif ty == "flash":
            a = (fa if q < 0.5 else fb); a = a + (1 - abs(q - 0.5) * 2) ** 1.5
        elif ty == "dip":
            a = (fa if q < 0.5 else fb) * abs(q - 0.5) * 2
        elif ty == "wipe":                         # diagonal orange-edged wipe
            edge = (np.arange(W)[None, :] + np.arange(H)[:, None] * 0.35) / (W + H * 0.35)
            m = (edge < ease(q) * 1.15 - 0.05).astype(np.float32)[..., None]
            band = ((edge > ease(q) * 1.15 - 0.09) & (edge < ease(q) * 1.15 - 0.05)).astype(np.float32)[..., None]
            a = fb * m + fa * (1 - m); a = a * (1 - band) + ORANGE * band
        elif ty == "slide":                        # push up
            off = int(H * ease(q)); a = np.concatenate([fa[off:], fb[:off]], 0) if off else fa
        elif ty == "cross":
            a = fa * (1 - ease(q)) + fb * ease(q)
        elif ty == "neg":
            a = (fa if q < 0.5 else fb); a = 1 - a if 0.3 < q < 0.7 else a
    for o in OVL:
        if o["t0"] <= t < o["t1"]:
            a = OVF[o["type"]](a, o, t)
    a = draw_subs(a, t)
    for fl in FLASH:                               # hit accents
        lt = t - fl["t"]
        if 0 <= lt < fl.get("d", 0.12):
            if fl["type"] == "white": a = a + (1 - lt / fl.get("d", 0.12)) * fl.get("amt", 0.8)
            elif fl["type"] == "neg": a = 1 - a
            elif fl["type"] == "rgb":
                sh = int(18 * S * (1 - lt / fl.get("d", 0.12))) + 1
                a = a.copy(); a[..., 0] = np.roll(a[..., 0], sh, 1); a[..., 2] = np.roll(a[..., 2], -sh, 1)
    a = a * VIG
    g = GRAIN[int(t * 24) % len(GRAIN)]
    a = a + np.repeat(np.repeat(g, 2, 0), 2, 1)
    if t < 0.5: a = a * (t / 0.5)
    if t > DUR - 1.0: a = a * max(0, (DUR - t) / 1.0)
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
    os.makedirs("output", exist_ok=True)
    out = f"output/v2_part{part}.mp4" if not PREVIEW else f"output/v2_preview{part}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
                           "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for fi in range(a0, a1):
        ff.stdin.write(compose(fi / FPS).tobytes())
        if (fi - a0) % 60 == 0: print(f"part{part} {fi - a0}/{a1 - a0}", flush=True)
    ff.stdin.close(); ff.wait(); print("wrote", out, flush=True)

if __name__ == "__main__":
    main()
