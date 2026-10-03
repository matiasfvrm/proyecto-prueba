"""Documentary cut (licensed-only): real CC BY interview audio drives the story, short narration bridges.

Builds sequentially from beats: each beat places its audio on the dialogue track (real bite or narration)
and lays visuals under it. Exposes the same interface as plan3/plan_long for render3.py and mix3.py.
"""
import json, os, re, subprocess
import numpy as np, soundfile as sf

R1, R2, RV, FX, MUS = "media/raw/", "media/raw2/", "media/real/", "media/sfx2/cut/", "media/music/"
VO_DIR = "doc/vo/"
VO_FILE = "audio/doc_dialogue.wav"
SUBS_FILE = "doc/subs_words.json"
MUSIC_RMS = -21.0          # dBFS per cue before ducking/bus gain
SR = 44100
OFF = 0.0
HIT = json.load(open(FX + "hitpoints.json"))
VO = json.load(open(VO_DIR + "vo.json"))

WOSN, LQ, LN = RV + "wosn_2016.mp4", RV + "lordstown_questions.mp4", RV + "lordstown_nicknames.mp4"
CRED = {WOSN: "FOOTAGE  ·  WOSN (2016)  ·  CC BY", LQ: "FOOTAGE  ·  LORDSTOWN MOTORS (2022)  ·  CC BY",
        LN: "FOOTAGE  ·  LORDSTOWN MOTORS (2022)  ·  CC BY"}

_cache = {}
def bite_audio(src, a, b):
    """Extract and clean a real interview bite (gentle denoise, de-rumble, level match)."""
    key = (src, a, b)
    if key not in _cache:
        out = f"doc/bites/{os.path.basename(src)}_{a:.2f}_{b:.2f}.wav"
        if not os.path.exists(out):
            os.makedirs("doc/bites", exist_ok=True)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", src, "-vn",
                            "-af", "highpass=f=80,afftdn=nf=-28,equalizer=f=3000:t=q:w=1.2:g=2,"
                                   "acompressor=threshold=-22dB:ratio=3:attack=6:release=120:makeup=3,"
                                   "loudnorm=I=-16:TP=-1.5,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse",
                            "-ar", str(SR), "-ac", "1", out], check=True)
        y, _ = sf.read(out, dtype="float32"); _cache[key] = y
    return _cache[key]

def vo_audio(key):
    if key not in _cache:
        y, sr = sf.read(VO_DIR + key + ".wav", dtype="float32"); _cache[key] = y
    return _cache[key]

VW = json.load(open(VO_DIR + "words.json"))
SRCW = {s: json.load(open(s.replace(".mp4", ".whisper.json")))["words"] for s in (WOSN, LQ, LN)}
SRC_CUTS = {LQ: [3.5, 6.63, 12.97, 15.17, 16.97, 18.7, 30.7, 33.23, 36.07, 40.9, 43.63, 44.93, 47.83, 55.33, 64.3, 65.87, 70.27,
                 73.2, 77.0, 79.5, 82.97, 85.37, 90.27, 95.8, 102.97, 106.93, 114.1, 119.33, 120.97, 121.5, 123.97, 126.3,
                 131.2, 134.13, 135.63, 137.6, 140.73, 142.47, 143.63, 145.6, 147.73, 148.6, 150.1, 151.73, 152.6, 154.53,
                 159.5, 162.63, 168.67, 171.3, 174.2, 176.63, 179.13, 182.4, 184.3, 186.87, 189.23, 190.57, 192.17, 193.6,
                 201.0, 202.73, 204.37, 205.7, 210.3, 213.13, 216.1, 218.23, 219.43, 221.33, 222.67, 227.13, 230.8, 236.2,
                 237.83, 240.07, 244.87, 248.37, 250.97, 256.1, 260.0, 263.47],
            LN: [3.5, 6.63, 12.97, 22.27, 24.57, 30.57, 35.63, 37.8, 39.9, 44.67, 48.3, 50.43, 51.9, 53.33, 56.6, 60.37, 62.63,
                 65.1, 65.27, 67.2, 70.0, 72.87, 75.23, 78.3, 81.73, 83.37, 84.53, 86.53, 87.53, 88.47, 94.9, 97.47, 99.33,
                 103.07, 104.4, 106.3, 111.37, 114.83], WOSN: []}

def vo_word(key, pat, n=0):
    """Start time (relative to the VO clip) of the n-th word matching pat."""
    hits = [w for w in VW[key] if re.search(pat, w["w"], re.I)]
    if len(hits) <= n:
        raise KeyError(f"vo_word: {key!r} has no match #{n} for {pat!r}")
    return hits[n]["s"]

def build():
    shots, trans, ovl, acc, sfx, segs = [], [], [], [], [], []
    sid = [0]; T = [0.0]
    def shot(t0, t1, src, kind="photo", look="teal", z=(1.0, 1.07), **kw):
        sid[0] += 1; s = dict(id=sid[0], t0=t0, t1=t1, src=src, kind=kind, look=look, z0=z[0], z1=z[1], **kw)
        shots.append(s); return s
    def tr(t, type_, d=0.35, **kw): trans.append(dict(t=t, type=type_, d=d, **kw))
    def ov(t0, t1, type_, **kw): ovl.append(dict(t0=t0, t1=t1, type=type_, **kw))
    def fx(t, name, gain=0.4, at="hit", **kw):
        sfx.append(dict(t=t - (HIT.get(name, 0) if at == "hit" else 0), file=FX + name + ".wav", gain=gain, **kw))
    def item_shot(t0, t1, it, k=0):
        it = dict(it) if isinstance(it, dict) else {"src": it}
        src = it.pop("src"); it.pop("tr", None)
        if src is None: return shot(t0, t1, None, kind="black")
        if src.endswith((".webm", ".mp4")):
            it.setdefault("cz", 1.12); it.setdefault("speed", 1.0); return shot(t0, t1, src, kind="clip", **it)
        it.setdefault("par", 0.9); it.setdefault("z", (1.0, 1.08) if k % 2 == 0 else (1.08, 1.0))
        return shot(t0, t1, src, **it)

    def cutseq(t0, t1, first, anchors, ttype="cut", td=0.3):
        """first item from t0; each (abs_time, item) starts at its anchor; transitions default to straight cuts."""
        pts = [(t0, first)] + sorted(anchors, key=lambda x: x[0])
        for k, (ta, it) in enumerate(pts):
            tb = pts[k + 1][0] if k + 1 < len(pts) else t1
            s = item_shot(ta, tb, it, k)
            tt = (it.get("tr") if isinstance(it, dict) else None) or (ttype if k else None)
            if tt and tt != "cut": tr(ta, tt, td)
            elif k: fx(ta, "whoosh_air", 0.05, pan=0.3 * (-1) ** k)
        return pts

    def vo(key, first, anchors=(), pre=0.12, post=0.3, ttype="cut"):
        """Narration line; anchors = [(word_pattern, item) or (word_pattern, n, item)] cut exactly on that word."""
        t0 = T[0]; a = vo_audio(key); start = t0 + pre
        segs.append(dict(kind="vo", key=key, t=start, y=a)); t1 = start + len(a) / SR + post
        ab = []
        for an in anchors:
            pat, n, it = (an[0], 0, an[1]) if len(an) == 2 else an
            ab.append((start + vo_word(key, pat, n) - 0.06, it))
        cutseq(t0, t1, first, ab, ttype); T[0] = t1
        return start, t1, {an[0]: start + vo_word(key, an[0], an[1] if len(an) == 3 else 0) for an in anchors}

    def real(src, parts, cover=(), crops=(), look="teal", cz=1.12, cy=0.42, post=0.3, lower=None, credit=True, pre=0.1, titles=()):
        """Real interview bite(s). Video stays in sync with the voice. crops=[(src_time, cz)] fakes a second camera
        on a sentence boundary; cover=[(src_t0, src_t1, item)] are cutaways (J-cuts) that also hide jump cuts."""
        t0 = T[0]; t = t0 + pre; mine = []; mapping = []
        for k, (a, b) in enumerate(parts):
            y = bite_audio(src, a, b); segs.append(dict(kind="real", src=src, t=t, y=y, a=a, b=b))
            mapping.append((a, b, t))
            pts = [a] + [c for c, _ in crops if a < c < b] + [b]
            czs = [cz] + [z for c, z in crops if a < c < b]
            for j in range(len(pts) - 1):
                sa, sb = pts[j], pts[j + 1]
                ta = t + (sa - a) if (k or j) else t0
                tb = t + (sb - a)
                mine.append(shot(ta, tb, src, kind="clip", ss=sa - (t + (sa - a) - ta), speed=1.0, cz=czs[j] if not k % 2 else czs[j] + 0.2, cy=cy, look=look))
            t += (b - a) + 0.05
        t1 = t + post; mine[-1]["t1"] = t1
        def abs_t(st):
            for a, b, tt in mapping:
                if a - 0.2 <= st <= b + 0.2: return tt + (st - a)
            raise ValueError(st)
        for (sa, sb, it) in cover:
            ca, cb = abs_t(sa), abs_t(sb)
            cv = item_shot(ca, cb, it); cv["cover"] = True
            tr(ca, "cross", 0.3, a=mine[0], b=cv); tr(cb, "cross", 0.3, a=cv, b=mine[-1])
        for (st, et, it) in titles:
            it = dict(it); ov(abs_t(st), abs_t(et), it.pop("type"), **it)
        if lower: ov(t0 + 0.3, min(t1 - 0.2, t0 + 4.6), "lower", **lower); fx(t0 + 0.35, "ui_click", 0.2)
        if credit: ov(t0, t1, "credit", text=CRED[src])
        T[0] = t1
        return t0, t1, abs_t

    def gap(dur, first, anchors=(), ttype="cut"):
        t0 = T[0]; t1 = t0 + dur; cutseq(t0, t1, first, [(t0 + a, it) for a, it in anchors], ttype); T[0] = t1; return t0, t1

    def mapscene(dur, cities_on, legs, years, v_from, v_to, left=(), leg_len=1.3):
        t0 = T[0]; t1 = t0 + dur
        shot(t0, t1, None, kind="map", views=[v_from, v_to], cities_on=list(cities_on), legs=list(legs), years=years,
             leg_t=0.35, leg_len=leg_len, left=list(left))
        T[0] = t1
        fx(t0 + 0.2, "whoosh_tunnel", 0.18, at="start")
        for i, _ in enumerate(legs): fx(t0 + 0.35 + leg_len + i * 1.2, "ui_click", 0.3)
        return t0, t1

    # ---------------------------------------------------------------- media
    JB = lambda n: R2 + f"jb_{n:02d}.jpg"; X = lambda n: R2 + n + ".jpg"
    portrait, portrait2 = R1 + "burrow_02.jpg", R1 + "burrow_06.jpg"
    qb_pose, on_cart, action1, action2, action3 = JB(4), JB(10), JB(36), JB(37), JB(9)
    hurt = [JB(12), JB(11), JB(13), JB(24), JB(19), JB(27), JB(21), JB(31)]
    sb_fly, pbs_sb, heisman, tiger = R1 + "sb_00.jpg", R1 + "sb_01.jpg", R1 + "heisman_02.jpg", R1 + "tiger_00.jpg"
    lsu_crowd, lsu_crowd2, lsu_band = R1 + "lsu_13.jpg", R1 + "lsu_11.jpg", R1 + "lsu_02.jpg"
    ohio_air, OSU, BG = R1 + "ohio_00.jpg", (lambda n: X(f"osu_{n:02d}")), (lambda n: X(f"bengals_{n:02d}"))
    superdome, helmet_solo, lsu_helmet, lsu_champs = X("superdome_02"), X("helmet_03"), X("lsu19_00"), X("lsu19_13")
    sofi_sunset, sofi_in, locker = X("sofi_05"), X("sofi_04"), X("bengals24_08")
    v_draft, v_nfl, v_arrow = R1 + "vid_draft.webm", R2 + "vkc_07.webm", R2 + "vkc_06.webm"
    import mapgen
    FV = lambda cs: mapgen.fit_view(cs, 1920, 1080)
    US = (330, 120, 1000, 560)
    sp = {}

    # ================= COLD OPEN =================
    fx(0.0, "room_tone_dark", 0.2, at="start", dur=12)
    gap(2.0, None)
    ov(0.2, 2.0, "text", text="OHIO STATE  ·  SPRING GAME  ·  APRIL 16, 2016", size=30, weight="x", typing=0.9, track=8, y=0.5)
    for k in range(24): fx(0.25 + 0.9 * k / 24, "type_click", 0.12, at="start")
    a0, a1, _ = real(WOSN, [(68.30, 73.12)], crops=[(71.45, 1.42)], cz=1.2, cy=0.4, look="muted", pre=0.05)
    tr(a0, "dip", 0.4)
    t0, t1 = gap(2.8, None)
    ov(t0 + 0.05, t1, "title", text="JOE BURROW", size=230, style="slam", y=0.46)
    ov(t0 + 0.8, t1, "text", text="“…BUT I THINK A LOT OF PEOPLE DID.”", size=28, y=0.6, track=6, weight="x", color=(1.0, 0.45, 0.2))
    fx(t0 + 0.05, "impact_trailer_epic", 0.7)
    sp["intro_end"] = T[0]
    # teaser: beat-cut glimpses of what is coming, each with its year
    t0, t1 = gap(3.2, {"src": heisman, "look": "warm"}, [(0.8, {"src": hurt[0], "look": "bw"}), (1.6, {"src": sofi_sunset, "look": "teal"}),
                                                        (2.4, {"src": qb_pose, "look": "warm"})])
    for k, yr in enumerate(["2019", "2020", "2022", "2024"]):
        ov(t0 + 0.8 * k, t0 + 0.8 * (k + 1), "rewind_year", year=yr); fx(t0 + 0.8 * k, "drum_bass_hit", 0.3); fx(t0 + 0.8 * k, "whoosh_fast", 0.18)

    # ================= 1 · WHERE HE CAME FROM =================
    sp["ch1"] = T[0]
    t0, t1 = mapscene(3.2, ["ATHENS, OH"], [], {"ATHENS, OH": "HOMETOWN"}, US, FV(["ATHENS, OH"]))
    tr(t0, "burn", 0.7); fx(t0, "wind_hum_cine", 0.12, at="start", dur=30)
    vo("v01", {"src": X("athens_02"), "look": "warm"},
       [("small", {"src": X("athens_05"), "look": "warm"}), ("father", {"src": X("peden_05"), "look": "teal"}),
        ("decades", {"src": X("peden_03"), "look": "teal"})], ttype="cross")
    a0, a1, at = real(LQ, [(230.85, 244.70)],
                      cover=[(232.05, 235.85, {"src": X("kidsfb_04"), "look": "warm"}), (239.4, 241.9, {"src": X("kidsfb_02"), "look": "warm"})],
                      lower=dict(name="JOE BURROW", role="On becoming a quarterback", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.4)
    a0, a1, at = real(LQ, [(254.10, 255.85), (257.05, 259.65)], credit=False,
                      cover=[(255.2, 258.6, {"src": X("kidsfb_02"), "look": "teal", "z": (1.1, 1.0)})])
    s0, s1, A = vo("v02", {"src": X("hsfb_00"), "look": "teal"},
                   [("Mr", {"src": helmet_solo, "look": "warm", "z": (1.05, 1.14)}), ("Ohio", 1, OSU(13))])
    ov(A["Mr"], A["Ohio"], "title", text="MR. FOOTBALL", size=160, y=0.44, line=True, dim=0.35)
    ov(A["Mr"], A["Ohio"], "tag", year="2014", label="OHIO'S BEST HIGH SCHOOL PLAYER", stat=None)
    fx(A["Mr"], "impact_epic", 0.4)
    mapscene(3.0, ["ATHENS, OH"], [("ATHENS, OH", "COLUMBUS, OH")], {"COLUMBUS, OH": "2015"}, FV(["ATHENS, OH"]), FV(["ATHENS, OH", "COLUMBUS, OH"]))
    tr(T[0] - 3.0, "cross", 0.4)

    # ================= 2 · THE BACKUP =================
    sp["ch2"] = T[0]
    s0, s1, A = vo("v03", {"src": ohio_air, "look": "bw"}, [("Barrett", {"src": X("jtb_00"), "look": "muted", "z": (1.05, 1.15)}),
                                                            ("Year", 1, {"src": OSU(10), "look": "bw"})])
    ov(A["Barrett"], A["Barrett"] + 2.0, "tag", year="J.T. BARRETT", label="OHIO STATE STARTER", stat=None)
    a0, a1, at = real(WOSN, [(46.55, 49.92)], cz=1.12, cy=0.4,
                      lower=dict(name="JOE BURROW", role="Redshirt freshman  ·  Ohio State", date="SPRING GAME  ·  APRIL 16, 2016"))
    tr(a0, "cross", 0.35); fx(a0, "crowd_sports_ambient", 0.05, at="start", dur=20)
    a0, a1, at = real(WOSN, [(59.00, 65.40)], crops=[(61.95, 1.4)], cz=1.15, cy=0.4)
    tr(a0, "cut", 0.1)
    a0, a1, at = real(WOSN, [(73.30, 78.80)], cz=1.3, cy=0.38, cover=[(75.6, 78.6, {"src": X("osu2_03"), "look": "muted"})])
    s0, s1, A = vo("v04", {"src": OSU(14), "look": "bw"},
                   [("broke", {"src": X("xrayhand_00"), "look": "cold", "z": (1.0, 1.12)}),
                    ("someone", {"src": X("haskins_00"), "look": "muted", "z": (1.05, 1.14)})])
    ov(A["broke"] + 0.3, A["someone"], "stamp", text="BROKEN HAND · 2017", size=86, x=0.6, y=0.42)
    ov(A["someone"], s1, "tag", year="2018", label="DWAYNE HASKINS WINS THE JOB", stat=None)
    fx(A["broke"] + 0.3, "slowmo_impact", 0.4)
    t0, t1 = gap(2.4, {"src": OSU(6), "look": "bw", "z": (1.1, 1.18)})
    ov(t0, t1, "title", text="3 YEARS · 0 STARTS", size=150, y=0.47, mode="diff", dim=0.45)
    fx(t0, "drum_bass_trailer", 0.45)
    s0, s1, A = vo("v05", {"src": X("grad_01"), "look": "warm"}, [("left", {"src": X("columbus_00"), "look": "cold"})])
    ov(s0 + 0.2, A["left"], "tag", year="MAY 2018", label="GRADUATES IN THREE YEARS", stat=None)
    mapscene(3.4, ["ATHENS, OH", "COLUMBUS, OH"], [("COLUMBUS, OH", "BATON ROUGE, LA")], {"BATON ROUGE, LA": "2018"},
             FV(["ATHENS, OH", "COLUMBUS, OH"]), FV(["COLUMBUS, OH", "BATON ROUGE, LA"]), leg_len=1.7)
    tr(T[0] - 3.4, "burn", 0.7)

    # ================= 3 · THE RISE =================
    sp["ch3"] = T[0]
    vo("v05b", {"src": tiger, "look": "teal"}, [("chance", {"src": X("miketiger_02"), "look": "warm"})])
    s0, s1, A = vo("v06", {"src": X("lsufb_00"), "look": "teal"}, [("2019", {"src": lsu_band, "look": "teal"}),
                                                                    ("nobody", {"src": X("lsufb_01"), "look": "teal"})])
    ov(A["2019"], s1, "tag", year="2019", label="LSU TIGERS", stat=None)
    s0, s1, A = vo("v07", {"src": X("lsufb_08"), "look": "teal"},
                   [("^60", {"src": lsu_crowd2, "look": "teal"}), ("Heisman", {"src": heisman, "look": "warm", "focus": (0.62, 0.35)})])
    ov(s0, A["^60"], "counter", value=5671, fmt="{:,} YDS", sub="PASSING YARDS  ·  2019", size=200, count=2.0)
    ov(A["^60"], A["Heisman"], "counter", value=60, fmt="{} TD", sub="TOUCHDOWN PASSES", size=220, count=0.7)
    ov(A["Heisman"], s1 + 0.3, "title", text="HEISMAN TROPHY", size=170, y=0.45, line=True, dim=0.3)
    fx(A["Heisman"], "impact_epic", 0.55); fx(A["Heisman"], "crowd_cheer_victory", 0.22)
    for k_ in ("^60",): fx(A[k_], "drum_bass_hit", 0.3)
    a0, a1, at = real(LQ, [(135.90, 143.90), (148.62, 151.95)], cover=[(143.2, 149.6, {"src": X("trophycase_02"), "look": "warm"})])
    tr(a0, "cross", 0.35)
    s0, s1, A = vo("v07b", {"src": X("nyc_01"), "look": "cold"},
                   [("kids", {"src": X("schoollunch_04"), "look": "warm"}), ("Athens", {"src": X("appalachia_00"), "look": "muted"}),
                    ("hungry", {"src": X("schoollunch_05"), "look": "muted"}), ("days", {"src": X("pantry_00"), "look": "warm"}),
                    ("thousands", {"src": X("athens_06"), "look": "warm"})], ttype="cross")
    ov(A["days"], s1, "tag", year="DEC 2019", label="ATHENS COUNTY FOOD PANTRY", stat="HUNDREDS OF THOUSANDS DONATED")
    fx(A["days"], "ui_click", 0.25)
    s0, s1, A = vo("v08", {"src": superdome, "look": "teal"},
                   [("^15", {"src": lsu_helmet, "look": "warm", "focus": (0.34, 0.44), "z": (1.5, 1.42)}),
                    ("National", {"src": X("cfp_01"), "look": "warm", "focus": (0.62, 0.62), "z": (1.25, 1.18)})])
    ov(s0 + 0.4, A["^15"], "score", a="LSU", sa=42, b="CLEMSON", sb=25, sub="CFP NATIONAL CHAMPIONSHIP  ·  JAN 13, 2020")
    ov(A["^15"], A["National"], "title", text="15 – 0", size=300, y=0.44, dim=0.35)
    fx(A["^15"], "impact_trailer_epic", 0.5); fx(s0, "crowd_stadium_joy", 0.18, at="start", dur=4)
    a0, a1, at = real(LN, [(70.25, 80.90)], cover=[(76.0, 80.6, {"src": lsu_champs, "look": "warm"})],
                      titles=[(71.2, 75.3, dict(type="title", text="“SMOKIN' JOE”", size=120, y=0.3, line=True))],
                      lower=dict(name="JOE BURROW", role="On his nicknames", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.35)
    mapscene(3.0, ["ATHENS, OH", "COLUMBUS, OH", "BATON ROUGE, LA"], [("BATON ROUGE, LA", "CINCINNATI, OH")], {"CINCINNATI, OH": "2020"},
             FV(["COLUMBUS, OH", "BATON ROUGE, LA"]), FV(["BATON ROUGE, LA", "CINCINNATI, OH"]), left=["CINCINNATI, OH"], leg_len=1.5)
    tr(T[0] - 3.0, "burn", 0.7)

    # ================= 4 · NUMBER ONE =================
    sp["ch4"] = T[0]
    s0, s1, A = vo("v09", {"src": v_draft, "ss": 8, "speed": 0.8, "cz": 1.1}, [("first", {"src": X("cincy_06"), "look": "teal"})])
    ov(A["first"], s1, "title", text="#1", size=400, y=0.43, mode="diff", dim=0.2)
    ov(A["first"], s1, "tag", year="APR 2020", label="FIRST OVERALL PICK", stat="CINCINNATI BENGALS")
    fx(A["first"], "impact_epic", 0.5); fx(s0, "reporters_flashes", 0.2, at="start", dur=3)
    a0, a1, at = real(LN, [(54.50, 62.98)], titles=[(54.6, 58.0, dict(type="title", text="“JOEY FRANCHISE”", size=120, y=0.3, line=True))],
                      cover=[(60.4, 62.9, {"src": locker, "look": "warm"})])
    tr(a0, "cross", 0.35)
    s0, s1, A = vo("v09b", {"src": X("pbs_00"), "look": "bw"}, [("franchise", {"src": qb_pose, "look": "warm", "z": (1.0, 1.08)})])

    # ================= 5 · THE SETBACKS =================
    sp["ch5"] = T[0]
    s0, s1, A = vo("v10", {"src": action1, "look": "teal"},
                   [("knee", {"src": hurt[0], "look": "bw"}), ("torn", 0, {"src": X("acl_02"), "look": "cold", "z": (1.0, 1.1)}),
                    ("torn", 1, {"src": hurt[1], "look": "duo"})])
    ov(s0 + 0.3, A["knee"], "tag", year="NOV 22, 2020", label="GAME 10  ·  vs WASHINGTON", stat=None)
    ov(A["torn"] + 0.1, s1, "stamp", text="ACL + MCL", size=110, x=0.62, y=0.4, rot=-6)
    fx(A["knee"], "thunder_impact", 0.4); fx(A["knee"], "heartbeat_ambience", 0.35, at="start")
    gap(1.6, {"src": on_cart, "look": "cold", "z": (1.06, 1.12), "focus": (0.5, 0.36)}); tr(T[0] - 1.6, "cross", 0.4)
    s0, s1, A = vo("v11", {"src": locker, "look": "warm"}, [("sacked", {"src": action2, "look": "teal", "kick": 6}),
                                                            ("kept", {"src": action3, "look": "teal"})])
    ov(A["sacked"], A["kept"] + 0.4, "counter", value=51, fmt="{} SACKS", sub="MOST IN THE NFL  ·  2021", size=190, count=0.9)
    fx(A["sacked"], "impact_cool", 0.35)
    s0, s1, A = vo("v11b", {"src": pbs_sb, "look": "warm"},
                   [("Kansas", {"src": v_arrow, "ss": 3, "speed": 0.75}), ("^18", {"src": X("arrowhead_08"), "look": "teal"}),
                    ("Super", {"src": X("lombardi_02"), "look": "warm", "z": (1.05, 1.15)})])
    ov(s0, A["Kansas"], "tag", year="JAN 2022", label="FIRST PLAYOFF WIN IN 31 YEARS", stat=None)
    ov(A["^18"], A["Super"], "score", a="BENGALS", sa=27, b="CHIEFS", sb=24, sub="AFC CHAMPIONSHIP  ·  OT  ·  JAN 30, 2022")
    fx(A["Kansas"], "stadium_drums_chants", 0.16, at="start", dur=6); fx(A["Super"], "impact_epic", 0.4)
    s0, s1, A = vo("v12a", {"src": sofi_sunset, "look": "warm"}, [("Rams", {"src": X("clock_02"), "look": "cold", "z": (1.1, 1.25)})])
    ov(s0 + 0.3, A["Rams"], "score", a="BENGALS", sa=20, b="RAMS", sb=16, sub="SUPER BOWL LVI  ·  4TH QUARTER")
    ov(A["Rams"] + 0.6, s1, "title", text="1:25", size=300, y=0.44, mode="diff", dim=0.3)
    fx(s0, "bass_pulse", 0.22, at="start", dur=5); fx(A["Rams"], "clock_tick", 0.24, at="start", dur=3)
    s0, s1, A = vo("v12", {"src": sb_fly, "look": "bw", "focus": (0.5, 0.8)}, post=0.8)
    ov(s0, s1, "score", a="RAMS", sa=23, b="BENGALS", sb=20, sub="FINAL  ·  SUPER BOWL LVI  ·  FEB 13, 2022")
    fx(s0, "heartbeat_impact", 0.5); sp["silence"] = (s0 - 0.25, s1)
    s0, s1, A = vo("v13", {"src": X("contract_00"), "look": "warm"},
                   [("months", {"src": X("wristbrace_01"), "look": "cold"}), ("Another", {"src": hurt[7], "look": "bw"})])
    ov(s0 + 0.2, A["months"], "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  SEPT 2023", size=160, count=1.3)
    ov(A["Another"], s1, "stamp", text="SEASON OVER", size=100, x=0.6, y=0.42)
    fx(A["months"], "thunder_impact", 0.3); fx(s0 + 0.2, "impact_intro", 0.3)
    s0, s1, A = vo("v14", {"src": v_nfl, "ss": 3, "speed": 0.7},
                   [("touchdowns", {"src": action1, "look": "teal"}), ("Comeback", {"src": qb_pose, "look": "warm", "focus": (0.5, 0.33)})])
    ov(s0 + 0.3, A["touchdowns"], "counter", value=4918, fmt="{:,} YDS", sub="#1 IN THE NFL  ·  2024", size=190, count=1.2)
    ov(A["touchdowns"], A["Comeback"], "counter", value=43, fmt="{} TD", sub="#1 IN THE NFL  ·  2024", size=220, count=0.7)
    ov(A["Comeback"], s1 + 0.3, "title", text="COMEBACK PLAYER OF THE YEAR", size=104, y=0.42, line=True, dim=0.3)
    fx(A["Comeback"], "impact_trailer_epic", 0.55)

    # ================= 6 · WHO HE IS =================
    sp["ch6"] = T[0]
    vo("v15", {"src": portrait, "look": "warm", "focus": (0.5, 0.33), "z": (1.04, 1.12)})
    a0, a1, at = real(LN, [(65.30, 69.95)], titles=[(65.3, 69.9, dict(type="title", text="“JOE COOL”", size=120, y=0.3, line=True))],
                      lower=dict(name="JOE BURROW", role="On his nicknames", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.35)
    a0, a1, at = real(LN, [(99.50, 110.20)], cover=[(103.3, 107.6, {"src": X("phone_01"), "look": "cold"})],
                      titles=[(101.5, 103.2, dict(type="title", text="“JOE SHIESTY”", size=120, y=0.3, line=True))])
    a0, a1, at = real(LN, [(86.94, 91.75)], cover=[(88.9, 91.7, {"src": X("tigercage_04"), "look": "muted"})])
    a0, a1, at = real(LQ, [(179.18, 186.74)])
    for k, (st, word) in enumerate([(179.5, "SOCKS"), (180.8, "POCKET SQUARE"), (183.2, "SHOES")]):
        ov(at(st), at(186.7), "text", text=word, size=44, weight="x", x=0.78, y=0.3 + 0.08 * k, track=6, color=(1.0, 0.45, 0.2))
        fx(at(st), "ui_click", 0.22)
    a0, a1, at = real(LQ, [(206.09, 214.41)], cover=[(206.4, 209.2, {"src": X("cudi_01"), "look": "warm", "z": (1.05, 1.15)})])
    ov(at(206.4), at(209.2), "tag", year="KID CUDI", label="ON STAGE · CINCINNATI", stat=None)

    # ================= ENDING =================
    sp["end"] = T[0]
    s0, s1, A = vo("v16", {"src": X("kidsfb_04"), "look": "bw"},
                   [("backup", {"src": OSU(13), "look": "bw"}), ("quarterback", {"src": hurt[2], "look": "bw"}),
                    ("getting", {"src": qb_pose, "look": "warm", "focus": (0.5, 0.33)})], ttype="cross")
    a0, a1, at = real(WOSN, [(71.40, 73.12)], cz=1.5, cy=0.38, look="bw", credit=False, pre=0.3, post=0.6)
    tr(a0, "dip", 0.5)
    vo("v17", {"src": portrait2, "look": "cold", "focus": (0.5, 0.33), "z": (1.04, 1.14)}, post=0.8)
    t0, t1 = gap(6.0, None)
    tr(t0, "dip", 0.6)
    ov(t0 + 0.2, t1 - 0.2, "title", text="JOE BURROW", size=150, y=0.36, line=True)
    for k, line_ in enumerate(["INTERVIEW FOOTAGE  ·  WOSN (2016), LORDSTOWN MOTORS (2022)  ·  CC BY 3.0",
                               "PHOTOS & CLIPS  ·  WIKIMEDIA COMMONS CONTRIBUTORS (SEE DESCRIPTION)",
                               "MUSIC  ·  KEVIN MACLEOD (INCOMPETECH.COM)  ·  CC BY 4.0"]):
        ov(t0 + 0.8 + 0.2 * k, t1 - 0.2, "text", text=line_, size=19, y=0.56 + 0.045 * k, track=3)
    fx(t0, "impact_trailer_epic", 0.6)
    dur = T[0]

    shots.sort(key=lambda s: (s["t0"], s.get("cover", False)))
    snap_to_source_cuts(shots)
    for x in trans:
        if "a" in x: continue
        x["a"] = max((s for s in shots if s["t0"] < x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[0])
        x["b"] = min((s for s in shots if s["t0"] >= x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[-1])
    trans[:] = [x for x in trans if x["type"] != "cut"]
    return dict(shots=shots, trans=trans, overlays=ovl, accents=acc, sfx=sfx, segs=segs, dur=dur, sections=sp)

def snap_to_source_cuts(shots, tol=0.45):
    """Avoid micro-shots: if a clip shot begins/ends within `tol` of one of the source video's own cuts,
    move that boundary onto the source cut (keeping lip-sync by shifting ss) and stretch the neighbour."""
    clips = [s for s in shots if s["kind"] == "clip" and s["src"] in SRC_CUTS]
    for s in clips:
        cuts = SRC_CUTS[s["src"]]
        src_t = lambda t: s["ss"] + (t - s["t0"]) * s.get("speed", 1.0)
        for c in cuts:
            tl = s["t0"] + (c - s["ss"]) / s.get("speed", 1.0)          # timeline time of the source cut
            if s["t0"] < tl < s["t0"] + tol and s["t1"] - s["t0"] > tol + 0.3:
                nb = [o for o in shots if abs(o["t1"] - s["t0"]) < 1e-3 and not o.get("cover")]
                for o in nb: o["t1"] = tl
                s["ss"] += (tl - s["t0"]) * s.get("speed", 1.0); s["t0"] = tl
            elif s["t1"] - tol < tl < s["t1"] and s["t1"] - s["t0"] > tol + 0.3:
                nb = [o for o in shots if abs(o["t0"] - s["t1"]) < 1e-3 and not o.get("cover")]
                for o in nb:
                    if o["kind"] == "clip": o["ss"] -= (o["t0"] - tl) * o.get("speed", 1.0)
                    o["t0"] = tl
                s["t1"] = tl

_B = build()
DUR = round(_B["dur"], 2)
SECTIONS = _B["sections"]

def write_dialogue():
    n = int(DUR * SR) + SR
    y = np.zeros(n, np.float32)
    for s in _B["segs"]:
        g = 1.32 if s["kind"] == "real" else 1.0          # real voices sit slightly above the narrator
        i = int(s["t"] * SR); y[i:i + len(s["y"])] += g * s["y"][: max(0, n - i)]
    sf.write(VO_FILE, y, SR)
    json.dump([dict(kind=s["kind"], t=round(s["t"], 3), dur=round(len(s["y"]) / SR, 3), key=s.get("key"), src=s.get("src"))
               for s in _B["segs"]], open("doc/segments.json", "w"), indent=0)
    # subtitle words straight from the known timings (narrator TTS alignment + source Whisper), no re-transcription
    words = []
    for s in _B["segs"]:
        if s["kind"] == "vo":
            words += [dict(word=w["w"], start=s["t"] + w["s"], end=s["t"] + w["e"]) for w in VW[s["key"]]]
        else:
            last = s["t"]
            sw = SRCW[s["src"]]
            for i, w in enumerate(sw):
                lead = (i and re.search(r"[.?!]$", sw[i - 1]["word"]) and w["start"] >= s["a"] - 0.6
                        and w["end"] > s["a"] + 0.1)   # sentence start Whisper placed slightly early
                if lead or s["a"] - 0.15 <= w["start"] < s["b"] - 0.2:
                    st = max(last, s["t"] + max(0.0, w["start"] - s["a"]))   # keep source word order monotonic
                    en = min(st + 1.0, max(st + 0.08, s["t"] + min(w["end"], s["b"]) - s["a"]))
                    words.append(dict(word=w["word"], start=st, end=en)); last = st + 0.02
    json.dump(words, open(SUBS_FILE, "w"))

KEYWORDS = {"overlooked", "people", "quarterback", "ball", "waited", "never", "left", "chance", "heisman", "hungry",
            "perfect", "first", "franchise", "acl", "mcl", "kept", "super", "three", "wrist", "again", "different",
            "cool", "cages", "finished", "basement", "championship"}
FIX = {"Uzama": "Uzomah", "Joe Burr": "Joe Burr"}
def build_subs():
    if not os.path.exists(SUBS_FILE): return []
    W = json.load(open(SUBS_FILE)); subs, cur = [], []
    def flush():
        if cur: subs.append(dict(t0=cur[0]["t0"] - 0.05, t1=cur[-1]["t1"] + 0.15, words=list(cur), y=0.79)); cur.clear()
    prev_end = 0
    for w in W:
        word = FIX.get(w["word"].strip(), w["word"].strip())
        clean = re.sub(r"[.,…?!]+$", "", word).upper()
        if not clean: continue
        if cur and w["start"] - prev_end > 0.6: flush()
        cur.append(dict(w=clean, t0=w["start"], t1=w["end"], key=re.sub(r"[^a-z]", "", word.lower()) in KEYWORDS))
        prev_end = w["end"]
        if re.search(r"[.,…?!]$", word) or len(cur) >= 3 or len("".join(c["w"] for c in cur)) > 15: flush()
    flush()
    for i in range(len(subs) - 1): subs[i]["t1"] = min(subs[i]["t1"], subs[i + 1]["t0"])
    return subs

def build_plan():
    p = dict(_B); p["subs"] = build_subs()
    # hide subtitles while big titles carry the words
    return p

def music_plan():
    s = SECTIONS; sil0, sil1 = s["silence"]
    return [
        dict(file=MUS + "Impact_Lento.mp3", src=0.0, dst0=0.0, dst1=s["ch1"] + 0.6, fin=1.5, fout=1.2, gain=1.0),
        dict(file=MUS + "Lightless_Dawn.mp3", src=0.0, dst0=s["ch1"] - 0.2, dst1=s["ch2"] + 0.5, fin=1.0, fout=1.2, gain=0.9),
        dict(file=MUS + "Impact_Lento.mp3", src=60.0, dst0=s["ch2"] - 0.3, dst1=s["ch3"] + 0.5, fin=1.0, fout=1.2, gain=0.95),
        dict(file=MUS + "Heroic_Age.mp3", src=30.0, dst0=s["ch3"] - 0.3, dst1=s["ch4"] + 0.5, fin=1.0, fout=1.2, gain=0.9),
        dict(file=MUS + "Lightless_Dawn.mp3", src=60.0, dst0=s["ch4"] - 0.3, dst1=s["ch5"] + 0.8, fin=1.0, fout=1.2, gain=0.9),
        dict(file=MUS + "Five_Armies.mp3", src=100.0, dst0=s["ch5"] + 0.5, dst1=sil0, fin=1.5, fout=0.25, gain=1.1),
        dict(file=MUS + "Unanswered_Questions.mp3", src=0.0, dst0=sil1 - 0.2, dst1=s["ch6"] + 0.5, fin=1.5, fout=1.2, gain=0.85),
        dict(file=MUS + "Rising_Game.mp3", src=0.0, dst0=s["ch6"] - 0.3, dst1=s["end"] + 0.5, fin=1.0, fout=1.2, gain=0.95),
        dict(file=MUS + "Impact_Prelude.mp3", src=190.57 - ((DUR - 6.0) - (s["end"] - 0.3)), dst0=s["end"] - 0.3, dst1=DUR,
             fin=1.2, fout=1.5, gain=1.15),
    ]

if __name__ == "__main__":
    write_dialogue()
    print("DUR", DUR, "shots", len(_B["shots"]), "trans", len(_B["trans"]), "ovl", len(_B["overlays"]), "sfx", len(_B["sfx"]))
    real = sum(s["dur"] for s in json.load(open("doc/segments.json")) if s["kind"] == "real")
    vo_ = sum(s["dur"] for s in json.load(open("doc/segments.json")) if s["kind"] == "vo")
    print("real audio %.1fs  narration %.1fs" % (real, vo_)); print(SECTIONS)
