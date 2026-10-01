"""Edit decision list for the v2 cut: shots, transitions, overlays, subtitles, SFX, music.

Everything is timed from the narration (audio/timings.json + audio/words.json,
offset by OFF) and from the beat grid of the montage cue.
"""
import glob, json, os, re

OFF = 1.0
DUR = 91.0
R1, R2 = "media/raw/", "media/raw2/"
SFX = "media/sfx/cut/"
MUS = "media/music/"

T = json.load(open("audio/timings.json"))
WORDS = json.load(open("audio/words.json"))
def L(i): return T[i]["start"] + OFF
def E(i): return T[i]["end"] + OFF
def lw(i):  return [w for w in WORDS if w["line"] == i]
def WS(i, k): return lw(i)[k]["start"] + OFF     # start of k-th word in line i
def WE(i, k): return lw(i)[k]["end"] + OFF

# montage cue: Heroic Age onset 53.61 s lands on the start of line 10; beat 0.4645 s
HA_SRC = 53.61
BEAT0, BEAT = None, 0.4645
def snap(t):
    k = round((t - BEAT0) / BEAT); return BEAT0 + k * BEAT

def ex(path):
    return path if os.path.exists(path) else None
def first(*paths):
    for p in paths:
        if p and os.path.exists(p): return p
    raise FileNotFoundError(paths)

KEYWORDS = {"massive", "overlooked", "lost", "injuries", "prove", "superstar", "easily", "win", "lose",
            "transfer", "heisman", "champion", "first", "injured", "super", "bowl", "fight", "finished",
            "doubted", "himself", "extraordinary", "next", "nfl"}

def build_plan():
    global BEAT0
    BEAT0 = L(10)
    shots, trans, ovl, flash, sfx = [], [], [], [], []
    sid = [0]

    def shot(t0, t1, src, kind="photo", look="teal", z=(1.0, 1.1), **kw):
        sid[0] += 1
        s = dict(id=sid[0], t0=t0, t1=t1, src=src, kind=kind, look=look, z0=z[0], z1=z[1], **kw)
        shots.append(s); return s

    def tr(t, type_, d=0.3, **kw):
        trans.append(dict(t=t, type=type_, d=d, **kw))

    def fx(t, f, gain=0.5, pan=0.0, **kw):
        sfx.append(dict(t=t, file=SFX + f, gain=gain, pan=pan, **kw))

    def ov(t0, t1, type_, **kw):
        ovl.append(dict(t0=t0, t1=t1, type=type_, **kw))

    WH = ["whoosh_1796_0.wav", "whoosh_1801_0.wav", "whoosh_1795_0.wav", "whoosh_1800_0.wav",
          "whoosh_0127_0.wav", "whoosh_1799_0.wav", "whoosh_1798_0.wav", "whoosh_0128_0.wav"]
    HIT = ["impact_0964_0.wav", "impact_0965_0.wav", "impact_1084_0.wav", "impact_0964_1.wav", "impact_0965_1.wav"]
    BOOM = ["boom_1023_0.wav", "boom_2672_0.wav", "boom_1137_0.wav", "boom_1140_0.wav", "boom_1050_1.wav"]
    wi = [0]
    def whoosh(t, gain=0.35):
        f = WH[wi[0] % len(WH)]; wi[0] += 1
        fx(t - 0.18, f, gain, pan=(-0.4 if wi[0] % 2 else 0.4))

    # ---------------- media shortcuts
    JB = lambda n: R2 + f"jb_{n:02d}.jpg"
    BG = lambda n: R2 + f"bengals_{n:02d}.jpg"
    OSU = lambda n: R2 + f"osu_{n:02d}.jpg"
    portrait = R1 + "burrow_02.jpg"      # white tee close-up (Joe Burrow 2021.jpg)
    portrait2 = R1 + "burrow_06.jpg"     # white tee, second angle
    qb_pose = JB(4)          # Bengals pose with ball
    running = JB(35)         # running with ball, close
    helmetless = JB(10)      # sitting on the cart after the injury, no helmet
    action1, action2 = JB(36), JB(37)   # throwing under pressure
    action3, action4 = JB(9), JB(1)
    hurt = [JB(12), JB(11), JB(13), JB(24), JB(19), JB(27), JB(21), JB(31)]
    sb_fly, pbs_sb = R1 + "sb_00.jpg", R1 + "sb_01.jpg"
    heisman = R1 + "heisman_02.jpg"
    tiger = R1 + "tiger_00.jpg"
    lsu_crowd, lsu_crowd2 = R1 + "lsu_13.jpg", R1 + "lsu_11.jpg"
    lsu_helmet = R2 + "lsu19_00.jpg"
    ohio_air = R1 + "ohio_00.jpg"
    v_draft, v_enter, v_fans = R1 + "vid_draft.webm", R1 + "vid_enter.webm", R1 + "vid_fans.webm"
    v_game, v_wsu = R2 + "vfb_06.webm", R2 + "vfb_08.webm"
    helmet_ball = R2 + "helmet_04.jpg"
    sofi_sunset, sofi_in = R2 + "sofi_05.jpg", R2 + "sofi_04.jpg"
    superdome = R2 + "superdome_02.jpg"
    lsu_champs = R2 + "lsu19_13.jpg"
    vintage = [R2 + "qb_03.jpg", R2 + "qb_05.jpg"]
    extra = sorted(glob.glob(R2 + "qb_*.jpg")) + sorted(glob.glob(R2 + "field_*.jpg"))

    # ================= INTRO =================
    ov(0, 21.0, "letterbox")
    fx(0.0, "projector_0071_0.wav", 0.12, dur=4.0)
    s = shot(0.0, L(1) - 0.05, qb_pose, z=(1.25, 1.04), focus=(0.5, 0.38), look="warm", punch=True)
    ov(1.25, L(1) - 0.1, "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  CINCINNATI BENGALS  ·  2023", size=190)
    fx(1.2, BOOM[0], 0.55); fx(1.25, "stadium_2524_0.wav", 0.25, dur=3.0)
    flash.append(dict(t=1.22, type="white", d=0.14, amt=0.7))
    # line 1: the other side
    t1 = WS(1, 5)            # "...experienced"
    shot(L(1) - 0.05, t1, v_wsu, kind="clip", ss=36, speed=0.7, cz=1.35, cy=0.3, look="muted")
    tr(L(1) - 0.05, "whip", 0.32, dir=1); whoosh(L(1) - 0.05)
    shot(t1, L(2) - 0.05, helmetless, z=(1.08, 1.16), focus=(0.5, 0.35), look="cold")
    tr(t1, "cross", 0.25)
    # lines 2-4: split-screen triad, one panel per line
    fx(L(2) - 0.4, "heart_0218_0.wav", 0.35, dur=7.5)
    sp = shot(L(2) - 0.05, L(5) - 0.05, None, kind="split", look="bw", panels=[
        dict(kind="photo", src=OSU(4), t_in=L(2) - 0.05, z0=1.0, z1=1.12, focus=(0.5, 0.5)),
        dict(kind="photo", src=sb_fly, t_in=L(3) - 0.05, z0=1.05, z1=1.15, focus=(0.5, 0.65)),
        dict(kind="photo", src=hurt[0], t_in=L(4) - 0.05, z0=1.0, z1=1.12, focus=(0.5, 0.4))])
    tr(L(2) - 0.05, "glitch", 0.2); fx(L(2) - 0.05, "reverse_2690_0.wav", 0.3)
    for i, lab in ((2, "OHIO STATE · 2015–17"), (3, "SUPER BOWL LVI"), (4, "2020 · ACL + MCL")):
        fx(L(i) - 0.05, HIT[i % len(HIT)], 0.55); flash.append(dict(t=L(i) - 0.05, type="rgb", d=0.15))
        ov(L(i) + 0.15, L(5) - 0.1, "text", text=lab, size=26, x=(i - 1.5) / 3, y=0.2, track=3)
    # line 5: prove — fast cuts on words
    w5 = lw(5); cuts = [L(5) - 0.05, WS(5, 4), WS(5, 7), WS(5, 10), WS(5, 13), E(5) + 0.4]
    imgs = [action1, action3, "GAME", action2, action4]
    for k in range(5):
        if imgs[k] == "GAME":
            shot(cuts[k], cuts[k + 1], v_game, kind="clip", ss=137.5, speed=0.6, cz=1.4, cy=0.35, look="teal", punch=True)
        else:
            shot(cuts[k], cuts[k + 1], imgs[k], z=(1.18, 1.04) if k % 2 else (1.04, 1.18), dx=(-1) ** k,
                 look="teal", punch=k > 0, shake=5 if k == 4 else 0)
        if k == 0: tr(cuts[0], "zoom", 0.36); fx(cuts[0] - 0.2, "whoosh_0573_0.wav", 0.4)
        else:
            tp = ["whip", "flash", "whip", "glitch"][k - 1]; tr(cuts[k], tp, 0.22 if tp != "flash" else 0.16, dir=(-1) ** k)
            whoosh(cuts[k], 0.32)
    fx(WS(5, -2), HIT[2], 0.5)
    ov(WS(5, -3), E(5) + 0.4, "title", text="THE HIGHEST LEVEL", size=150, style="slam", rgb=True, dim=0.3, y=0.45)

    # ================= WHY =================
    t0 = E(5) + 0.4
    shot(t0, WS(6, 9), portrait, z=(1.0, 1.12), focus=(0.5, 0.33), look="warm")
    tr(t0, "zoom", 0.4); fx(t0 - 0.25, "whoosh_0573_0.wav", 0.35); fx(t0, BOOM[2], 0.45)
    ov(L(6) + 0.6, WS(6, 9), "title", text="JOE BURROW", size=270, style="expand", mode="diff", y=0.5)
    ov(t0, L(7) + 1.0, "leak", v=0, amt=0.55)
    shot(WS(6, 9), L(7) - 0.05, R2 + "osu_00.jpg", z=(1.12, 1.0), look="teal", focus=(0.5, 0.55))
    tr(WS(6, 9), "wipe", 0.4); whoosh(WS(6, 9))
    # line 7: slow crowd clip + dust, film feel
    shot(L(7) - 0.05, WS(7, 7), v_enter, kind="clip", ss=6, speed=0.6, look="muted")
    tr(L(7) - 0.05, "cross", 0.4)
    shot(WS(7, 7), L(8) - 0.05, hurt[1], z=(1.0, 1.1), look="bw", focus=(0.5, 0.4))
    tr(WS(7, 7), "flash", 0.14); fx(WS(7, 7), HIT[1], 0.4)
    ov(L(7), L(8), "dust", amt=0.5)
    # line 8: sometimes the biggest part of a career...
    c8 = [L(8) - 0.05, WS(8, 5), WS(8, 9), WS(8, 12), E(8) + 0.15]
    for k, (src, look) in enumerate([(pbs_sb, "teal"), (lsu_crowd2, "muted"), ("CELEB", "teal"), (sofi_in, "cold")]):
        if src == "CELEB":
            shot(c8[k], c8[k + 1], v_wsu, kind="clip", ss=150, speed=0.8, cz=1.3, cy=0.2, look="teal")
        else:
            shot(c8[k], c8[k + 1], src, z=(1.0, 1.1) if k % 2 == 0 else (1.1, 1.0), dx=(-1) ** k, look=look)
        tr(c8[k], ["slide", "whip", "glitch", "whip"][k], 0.3, dir=-1); whoosh(c8[k], 0.3)
    fx(L(8) - 0.2, "heart_0218_0.wav", 0.3, dur=6.0)
    # line 9: black card with typed text
    shot(E(8) + 0.15, L(10) - 0.0, None, kind="black")
    tr(E(8) + 0.15, "dip", 0.3)
    ov(L(9) - 0.1, L(10) - 0.15, "text", text="IT'S WHAT YOU DO AFTER YOU LOSE.", size=54, weight="x", typing=0.9, track=6)
    for k in range(6): fx(L(9) - 0.1 + k * 0.15, "shutter_0307_0.wav", 0.12, lp=2500)
    fx(L(10) - 1.6, "reverse_1298_0.wav", 0.55)

    # ================= MONTAGE (Heroic Age) =================
    steps = ["OHIO ST", "LSU", "HEISMAN", "CHAMPION", "#1 PICK", "INJURY", "SUPER BOWL", "FIGHT"]
    def beat_cut(t): return snap(t)
    flash.append(dict(t=L(10), type="white", d=0.25, amt=1.0))
    fx(L(10), BOOM[1], 0.8); fx(L(10), "stadium_2524_0.wav", 0.35)
    M = [  # (line, images, year, label, stat)
        (10, [OSU(13), OSU(2), OSU(8), ohio_air], "2015–2017", "OHIO STATE", "BACKUP QB  ·  0 STARTS"),
        (11, [tiger, lsu_crowd, R1 + "lsu_02.jpg"], "MAY 2018", "TRANSFERS TO LSU", "A FRESH START"),
        (12, [heisman], "DEC 2019", "HEISMAN TROPHY", "60 TD  ·  5,671 YDS  ·  6 INT"),
        (13, [superdome, lsu_helmet, lsu_champs], "JAN 2020", "NATIONAL CHAMPION", "15–0  ·  PERFECT SEASON"),
        (14, ["CLIP", helmet_ball, BG(6)], "APR 2020", "#1 OVERALL PICK", "CINCINNATI BENGALS"),
        (15, [hurt[2], hurt[3]], "NOV 2020", "INJURED ROOKIE", "TORN ACL + MCL"),
        (16, [sofi_sunset, sb_fly, pbs_sb], "FEB 2022", "SUPER BOWL LVI", None),
    ]
    for n, (li, imgs, yr, lab, stat) in enumerate(M):
        a = L(10) if n == 0 else beat_cut(L(li) - 0.05)
        b = beat_cut(L(li + 1) - 0.05)
        cuts = [a + (b - a) * k / len(imgs) for k in range(len(imgs))] + [b]
        cuts = [cuts[0]] + [beat_cut(c) for c in cuts[1:-1]] + [b]
        for k, src in enumerate(imgs):
            look = "duo" if li == 15 else ("bw" if li == 10 and k == 0 else "teal")
            if src == "CLIP":
                shot(cuts[k], cuts[k + 1], v_draft, kind="clip", ss=8, speed=1.0, look="teal", punch=True)
            else:
                foc = (0.3, 0.5) if src == lsu_helmet else (0.5, 0.45)
                shot(cuts[k], cuts[k + 1], src, z=(1.35, 1.2) if src == lsu_helmet else ((1.22, 1.04) if (n + k) % 2 else (1.03, 1.2)), focus=foc,
                     dx=(-1) ** (n + k), look=look, punch=True, shake=4 if li == 15 else 0)
            if n or k:
                tp = ["flash", "whip", "zoom", "glitch", "whip", "neg", "wipe"][(n + k) % 7]
                tr(cuts[k], tp, 0.2 if tp in ("flash", "neg") else 0.28, dir=(-1) ** k)
                whoosh(cuts[k], 0.32); fx(cuts[k], HIT[(n + k) % len(HIT)], 0.3)
        ov(a + 0.05, b, "tag", year=yr, label=lab, stat=stat)
        ov(a, b, "timeline", steps=steps, n=n)
        if li == 15:
            ov(L(15) + 0.25, b, "stamp", text="SEASON OVER", size=110, x=0.62, y=0.4, rot=-9)
            fx(L(15) + 0.25, BOOM[3], 0.5); flash.append(dict(t=L(15) + 0.25, type="neg", d=0.1))
        if li == 16:
            ov(L(16) + 0.3, b, "score", a="RAMS", sa=23, b="BENGALS", sb=20, sub="SUPER BOWL LVI  ·  FEB 13, 2022")
        if li == 12:
            ov(L(12), b, "title", text="2019", size=420, style="slam", mode="diff", dim=0.2, y=0.42)
    # line 17: back into the fight
    a = beat_cut(L(17) - 0.05); mid = beat_cut(WS(17, 3)); b = E(17) + 0.55
    vm = beat_cut(a + (mid - a) / 2)
    shot(a, vm, action1, z=(1.3, 1.1), look="teal", punch=True, shake=7)
    shot(vm, mid, vintage[0], z=(1.0, 1.15), look="bw", punch=True, shake=6)
    tr(vm, "neg", 0.12); fx(vm, HIT[3], 0.4)
    shot(mid, b, action2, z=(1.15, 1.3), look="teal", punch=True, shake=9)
    tr(a, "zoom", 0.3); whoosh(a); tr(mid, "flash", 0.16); fx(mid, BOOM[4], 0.55)
    ov(WS(17, 3), b, "title", text="BACK INTO THE FIGHT", size=190, style="slam", rgb=True, glitch=True, dim=0.35)
    ov(a, b, "timeline", steps=steps, n=7)
    fx(WS(17, 3), "stadium_2521_0.wav", 0.5); fx(WS(17, 3) + 0.4, "stadium_2522_0.wav", 0.4)
    flash.append(dict(t=WS(17, 3), type="white", d=0.2, amt=0.9))
    fx(b - 0.05, BOOM[1], 0.75)
    flash.append(dict(t=b - 0.05, type="white", d=0.3, amt=1.0))

    # ================= OUTRO =================
    ov(b, DUR, "letterbox")
    shot(b, L(19) - 0.05, R2 + "pbs_00.jpg" if ex(R2 + "pbs_00.jpg") else pbs_sb, z=(1.0, 1.1), look="cold")
    tr(b, "dip", 0.5)
    ov(b, L(19) + 0.5, "leak", v=1, amt=0.45)
    shot(L(19) - 0.05, L(20) - 0.05, running, z=(1.0, 1.14), focus=(0.5, 0.22), look="teal")
    tr(L(19) - 0.05, "cross", 0.45); whoosh(L(19) - 0.05, 0.22)
    shot(L(20) - 0.05, L(21) - 0.05, qb_pose, z=(1.05, 1.2), focus=(0.5, 0.3), look="warm")
    tr(L(20) - 0.05, "zoom", 0.36); whoosh(L(20) - 0.05, 0.3)
    ov(WS(20, 5), L(21) - 0.1, "title", text="SOMETHING LEFT TO PROVE", size=150, style="expand", mode="diff", y=0.47)
    fx(WS(20, 5), HIT[0], 0.4)
    shot(L(21) - 0.05, L(22) - 0.05, v_fans, kind="clip", ss=12, speed=0.75, look="bw")
    tr(L(21) - 0.05, "glitch", 0.22); fx(L(21) - 0.05, "reverse_2690_1.wav", 0.3)
    c22 = [L(22) - 0.05, WS(22, 4), WS(22, 6), L(23) - 0.05]
    for k, src in enumerate([hurt[4], hurt[5], hurt[6]]):
        shot(c22[k], c22[k + 1], src, z=(1.0, 1.1), look="bw", dx=(-1) ** k)
        tr(c22[k], "flash" if k else "whip", 0.16 if k else 0.26); fx(c22[k], "shutter_2392_0.wav", 0.35)
    ov(L(21) - 0.05, L(23) - 0.05, "dust", amt=0.6)
    fx(L(21) - 0.2, "projector_2828_0.wav", 0.12, dur=4.5)
    # line 23: but to himself — color returns
    shot(L(23) - 0.05, L(24) - 0.05, portrait, z=(1.1, 1.3), focus=(0.5, 0.33), look="warm")
    tr(L(23) - 0.05, "neg", 0.18); fx(L(23) - 0.05, BOOM[2], 0.5)
    ov(L(23), L(24), "leak", v=2, amt=0.5)
    # line 24: recap flicker, accelerating
    recap = [OSU(0), tiger, heisman, superdome, BG(13), hurt[2], sb_fly, action1, OSU(13), lsu_crowd,
             BG(12), hurt[7], pbs_sb, action3, BG(2), helmetless]
    t, end = L(24) - 0.05, L(25) - 0.05
    durs = [0.62 * (0.86 ** k) + 0.12 for k in range(len(recap))]
    scale = (end - 0.9 - t) / sum(durs); durs = [d * scale for d in durs]
    for k, src in enumerate(recap):
        shot(t, t + durs[k], src, z=(1.0, 1.08), look="bw" if k % 3 else "teal", punch=True)
        if k: tr(t, "flash" if k % 2 else "neg", 0.08); fx(t, "shutter_0307_0.wav", 0.32, pan=0.3 * (-1) ** k)
        t += durs[k]
    shot(t, end, qb_pose, z=(1.0, 1.06), focus=(0.5, 0.35), look="warm")
    tr(t, "zoom", 0.3); fx(t, BOOM[0], 0.55)
    ov(WS(24, -3), end, "title", text="EXTRAORDINARY", size=170, style="expand", mode="diff", y=0.45)
    # line 25: what comes next
    shot(end, E(25) + 0.6, portrait2, z=(1.05, 1.22), focus=(0.5, 0.33), look="cold")
    tr(end, "cross", 0.5)
    fx(E(25) - 1.4, "reverse_1298_1.wav", 0.4)
    tail = E(25) + 0.6
    shot(tail, DUR, None, kind="black")
    tr(tail, "glitch", 0.25); fx(tail, BOOM[1], 0.8)
    ov(tail, DUR - 0.3, "title", text="WHAT COMES NEXT?", size=170, style="slam", rgb=True, glitch=True, y=0.46)
    ov(tail + 0.8, DUR - 0.3, "text", text="JOE BURROW", size=34, y=0.62, track=14, weight="x")

    shots.sort(key=lambda s: s["t0"])
    # attach a/b shots to transitions
    for x in trans:
        prev = [s for s in shots if s["kind"] != "split" or True]
        a_ = max((s for s in shots if s["t0"] < x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[0])
        b_ = min((s for s in shots if s["t0"] >= x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[-1])
        x["a"], x["b"] = a_, b_

    # subtitles: 1-3 word chunks, broken at punctuation; none over the black card
    subs = []
    skip = {9}
    cur = []
    def flush():
        if cur:
            subs.append(dict(t0=cur[0]["t0"] - 0.05, t1=cur[-1]["t1"] + 0.12, words=list(cur),
                             y=0.66 if 10 <= cur[0]["line"] <= 17 else 0.79))
            cur.clear()
    for w in WORDS:
        if w["line"] in skip: flush(); continue
        word = re.sub(r"[.…,]+$", "", w["w"]).upper().replace("...", "")
        cur.append(dict(w=word, t0=w["start"] + OFF, t1=w["end"] + OFF, line=w["line"],
                        key=re.sub(r"[^a-z]", "", w["w"].lower()) in KEYWORDS))
        if re.search(r"[.,…]$", w["w"]) or len(cur) >= 3 or (cur and len("".join(c["w"] for c in cur)) > 16):
            flush()
    flush()
    for i in range(len(subs) - 1):          # no overlaps
        subs[i]["t1"] = min(subs[i]["t1"], subs[i + 1]["t0"])
    # keyword punch: tiny negative flash + hit
    for ch in subs:
        for w in ch["words"]:
            if w["key"] and w["line"] not in (10, 11, 12, 13, 14, 15, 16):
                fx(w["t0"], "boom_1807_0.wav", 0.25)
    return dict(shots=shots, trans=trans, overlays=ovl, subs=subs, flash=flash, sfx=sfx)

MUSIC = []
def _music():
    tl = json.load(open("audio/timings.json"))
    m0 = tl[10]["start"] + OFF                    # montage start
    b_end = tl[17]["end"] + OFF + 0.55
    MUSIC.extend([
        dict(file=MUS + "Lightless_Dawn.mp3", src=0.0, dst0=0.0, dst1=m0 - 1.2, fin=1.5, fout=1.2, gain=0.95),
        dict(file=MUS + "Heroic_Age.mp3", src=HA_SRC - 0.05, dst0=m0 - 0.05, dst1=b_end, fin=0.02, fout=0.6, gain=1.0),
        dict(file=MUS + "Lightless_Dawn.mp3", src=325.5, dst0=b_end + 0.3, dst1=DUR, fin=1.5, fout=2.5, gain=1.0),
    ])
_music()
