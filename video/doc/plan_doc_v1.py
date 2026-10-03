"""Documentary cut (licensed-only): real CC BY interview audio drives the story, short narration bridges.

Builds sequentially from beats: each beat places its audio on the dialogue track (real bite or narration)
and lays visuals under it. Exposes the same interface as plan3/plan_long for render3.py and mix3.py.
"""
import json, os, re, subprocess
import numpy as np, soundfile as sf

R1, R2, RV, FX, MUS = "media/raw/", "media/raw2/", "media/real/", "media/sfx2/cut/", "media/music/"
VO_DIR = "doc/vo/"
VO_FILE = "audio/doc_dialogue.wav"
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

def build():
    shots, trans, ovl, acc, sfx, segs = [], [], [], [], [], []
    sid = [0]; T = [0.0]
    def shot(t0, t1, src, kind="photo", look="teal", z=(1.0, 1.07), **kw):
        sid[0] += 1; s = dict(id=sid[0], t0=t0, t1=t1, src=src, kind=kind, look=look, z0=z[0], z1=z[1], **kw)
        shots.append(s); return s
    def tr(t, type_, d=0.45, **kw): trans.append(dict(t=t, type=type_, d=d, **kw))
    def ov(t0, t1, type_, **kw): ovl.append(dict(t0=t0, t1=t1, type=type_, **kw))
    def fx(t, name, gain=0.4, at="hit", **kw):
        sfx.append(dict(t=t - (HIT.get(name, 0) if at == "hit" else 0), file=FX + name + ".wav", gain=gain, **kw))

    def lay(t0, t1, items, tdefault="cross", td=0.5):
        """Spread visual items across [t0, t1] (equal parts unless item has 'frac')."""
        fr = [it.get("frac", 1.0) if isinstance(it, dict) else 1.0 for it in items]
        cuts = [t0]
        for f in fr: cuts.append(cuts[-1] + (t1 - t0) * f / sum(fr))
        for k, it in enumerate(items):
            it = dict(it) if isinstance(it, dict) else {"src": it}
            it.pop("frac", None); src = it.pop("src"); tt = it.pop("tr", tdefault if k else None)
            if src is None: shot(cuts[k], cuts[k + 1], None, kind="black")
            elif src.endswith((".webm", ".mp4")):
                it.setdefault("cz", 1.12); it.setdefault("speed", 1.0)
                shot(cuts[k], cuts[k + 1], src, kind="clip", **it)
            else:
                it.setdefault("par", 0.9); it.setdefault("z", (1.0, 1.07) if k % 2 == 0 else (1.07, 1.0))
                shot(cuts[k], cuts[k + 1], src, **it)
            if tt and tt != "cut": tr(cuts[k], tt, td if tt != "flash" else 0.25)
        return cuts

    def vo(key, items, pre=0.15, post=0.35, **kw):
        t0 = T[0]; a = vo_audio(key); start = t0 + pre
        segs.append(dict(kind="vo", key=key, t=start, y=a))
        t1 = start + len(a) / SR + post
        cuts = lay(t0, t1, items, **kw); T[0] = t1
        return start, t1, cuts

    def real(src, parts, cover=None, look="teal", cz=1.12, cy=0.45, post=0.35, lower=None, credit=True, pre=0.1):
        """Real bite(s) from the same interview; visuals are the interview itself (synced),
        with optional cutaways cover=[(rel_start, rel_end, item), ...] that hide jump cuts."""
        t0 = T[0]; t = t0 + pre; mine = []
        for k, (a, b) in enumerate(parts):
            y = bite_audio(src, a, b)
            segs.append(dict(kind="real", src=src, t=t, y=y))
            mine.append(shot(t if k else t0, t + (b - a), src, kind="clip", ss=a - (t - (t if k else t0)), speed=1.0,
                            cz=cz if k % 2 == 0 else cz + 0.22, cy=cy, look=look))
            if k: tr(t, "cut", 0.1)
            t += (b - a) + 0.05
        t1 = t + post
        shots[-1]["t1"] = t1
        for (ra, rb, it) in (cover or []):
            it = dict(it) if isinstance(it, dict) else {"src": it}
            src_ = it.pop("src"); it.setdefault("par", 0.9)
            cv = shot(t0 + pre + ra, t0 + pre + rb, src_, cover=True, **it)
            under = lambda tt: max((m for m in mine if m["t0"] <= tt), key=lambda m: m["t0"])
            tr(cv["t0"], "cross", 0.35, a=under(cv["t0"]), b=cv)
            tr(cv["t1"], "cross", 0.35, a=cv, b=under(cv["t1"]))
        if lower: ov(t0 + 0.3, min(t1 - 0.2, t0 + 4.8), "lower", **lower)
        if credit: ov(t0, t1, "credit", text=CRED[src])
        T[0] = t1
        return t0, t1

    def gap(dur, items, **kw):
        t0 = T[0]; t1 = t0 + dur; cuts = lay(t0, t1, items, **kw); T[0] = t1; return t0, t1, cuts

    # ---------------------------------------------------------------- media
    JB = lambda n: R2 + f"jb_{n:02d}.jpg"; X = lambda n: R2 + n + ".jpg"
    portrait, portrait2 = R1 + "burrow_02.jpg", R1 + "burrow_06.jpg"
    qb_pose, on_cart, action1, action2 = JB(4), JB(10), JB(36), JB(37)
    hurt = [JB(12), JB(11), JB(13), JB(24), JB(19), JB(27), JB(21), JB(31)]
    sb_fly, pbs_sb, heisman, tiger = R1 + "sb_00.jpg", R1 + "sb_01.jpg", R1 + "heisman_02.jpg", R1 + "tiger_00.jpg"
    lsu_crowd, lsu_crowd2, lsu_band = R1 + "lsu_13.jpg", R1 + "lsu_11.jpg", R1 + "lsu_02.jpg"
    ohio_air, OSU, BG = R1 + "ohio_00.jpg", (lambda n: X(f"osu_{n:02d}")), (lambda n: X(f"bengals_{n:02d}"))
    superdome, helmet_solo, lsu_helmet, lsu_champs = X("superdome_02"), X("helmet_03"), X("lsu19_00"), X("lsu19_13")
    sofi_sunset, sofi_in, locker, pbs_night = X("sofi_05"), X("sofi_04"), X("bengals24_08"), X("pbs_00")
    v_draft, v_nfl, v_arrow = R1 + "vid_draft.webm", R2 + "vkc_07.webm", R2 + "vkc_06.webm"
    MAP_OH = (650, 225, 790, 315)
    MAP_WIDE = (520, 200, 800, 520)
    sp = {}

    # ================= COLD OPEN =================
    fx(0.0, "room_tone_dark", 0.2, at="start", dur=14)
    t0, t1, _ = gap(2.0, [None])
    ov(0.2, 2.0, "text", text="OHIO STATE  ·  SPRING GAME  ·  APRIL 16, 2016", size=30, weight="x", typing=0.9, track=8, y=0.5)
    for k in range(24): fx(0.25 + 0.9 * k / 24, "type_click", 0.12, at="start")
    a0, a1 = real(WOSN, [(68.30, 73.12)], cz=1.28, cy=0.4, look="muted", pre=0.05)
    tr(a0, "dip", 0.4)
    t0, t1, _ = gap(3.0, [None])
    ov(t0 + 0.1, t1, "title", text="JOE BURROW", size=230, style="slam", y=0.46)
    ov(t0 + 0.9, t1, "text", text="“…BUT I THINK A LOT OF PEOPLE DID.”", size=28, y=0.6, track=6, weight="x", color=(1.0, 0.45, 0.2))
    fx(t0 + 0.1, "impact_trailer_epic", 0.7); acc.append(dict(t=t0 + 0.1, type="white", d=0.25, amt=0.5))
    sp["intro_end"] = T[0]
    # teaser: one beat per chapter of what is coming
    t0, t1, cuts = gap(3.2, [{"src": heisman, "look": "warm"}, {"src": hurt[0], "look": "bw"}, {"src": sofi_sunset, "look": "teal"},
                             {"src": qb_pose, "look": "warm"}], tdefault="flash")
    for c in cuts[:-1]: fx(c, "whoosh_fast", 0.2); fx(c, "drum_bass_hit", 0.3)
    for c, yr in zip(cuts[:-1], ["2019", "2020", "2022", "2024"]): ov(c, c + 0.8, "rewind_year", year=yr)

    # ================= 1 · WHERE HE CAME FROM =================
    sp["ch1"] = T[0]
    t0, t1, _ = gap(3.0, [{"src": "MAP", "kind": "map"}])
    shots[-1].update(kind="map", src=None, views=[(500, 180, 860, 420), MAP_OH], cities_on=["ATHENS, OH"], years={"ATHENS, OH": "HOMETOWN"})
    tr(t0, "burn", 0.7); fx(t0, "whoosh_wind_cine", 0.25); fx(t0 + 1.4, "ui_click", 0.25)
    fx(t0, "wind_hum_cine", 0.12, at="start", dur=30)
    vo("v01", [{"src": X("athens_02"), "look": "warm"}, {"src": X("athens_05"), "look": "warm"}, {"src": X("peden_05"), "look": "teal"}])
    a0, a1 = real(LQ, [(230.85, 244.70)], cover=[(8.6, 11.3, {"src": X("peden_03"), "look": "warm"})],
                  lower=dict(name="JOE BURROW", role="On becoming a quarterback", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.5)
    a0, a1 = real(LQ, [(254.10, 255.85), (257.05, 259.65)], cover=[(1.6, 3.4, {"src": X("hsfb_00"), "look": "teal"})], credit=False)
    vo("v02", [{"src": X("hsfb_00"), "look": "teal"}, {"src": helmet_solo, "look": "warm", "z": (1.05, 1.14)}, OSU(13)])
    ov(T[0] - 3.6, T[0] - 1.4, "tag", year="2014", label="OHIO MR. FOOTBALL", stat=None)
    t0, t1, _ = gap(3.0, [{"src": "MAP"}]); shots[-1].update(kind="map", src=None, views=[MAP_OH, MAP_OH],
        legs=[("ATHENS, OH", "COLUMBUS, OH")], cities_on=["ATHENS, OH"], years={"COLUMBUS, OH": "2015"}, leg_t=0.3)
    tr(t0, "cross", 0.5); fx(t0 + 0.3, "whoosh_air_deep", 0.25); fx(t0 + 1.4, "ui_click", 0.25)

    # ================= 2 · THE BACKUP =================
    sp["ch2"] = T[0]
    vo("v03", [{"src": ohio_air, "look": "bw"}, {"src": X("osu2_00"), "look": "muted"}])
    a0, a1 = real(WOSN, [(46.55, 49.92)], cz=1.12, cy=0.4,
                  lower=dict(name="JOE BURROW", role="Redshirt freshman  ·  Ohio State", date="SPRING GAME  ·  APRIL 16, 2016"))
    tr(a0, "cross", 0.4); fx(a0, "crowd_sports_ambient", 0.06, at="start", dur=14)
    a0, a1 = real(WOSN, [(59.00, 65.40)], cz=1.38, cy=0.38, credit=True)
    tr(a0, "cut", 0.1)
    a0, a1 = real(WOSN, [(73.30, 78.80)], cz=1.12, cy=0.4, credit=True,
                  cover=[(2.4, 5.4, {"src": X("osu2_03"), "look": "muted"})])
    tr(a0, "cut", 0.1)
    vo("v04", [{"src": OSU(10), "look": "bw"}, {"src": helmet_solo, "look": "bw", "z": (1.05, 1.15)}, {"src": OSU(14), "look": "muted"}])
    ov(T[0] - 4.2, T[0] - 2.4, "stamp", text="BROKEN HAND", size=96, x=0.6, y=0.42)
    fx(T[0] - 4.2, "slowmo_impact", 0.4)
    t0, t1, _ = gap(2.4, [{"src": OSU(6), "look": "bw", "z": (1.1, 1.18)}])
    ov(t0, t1, "title", text="3 YEARS · 0 STARTS", size=150, y=0.47, mode="diff", dim=0.45)
    fx(t0, "drum_bass_trailer", 0.45)
    vo("v05", [{"src": X("ohiou_07"), "look": "muted"}, {"src": X("columbus_00"), "look": "cold"}])
    t0, t1, _ = gap(3.2, [{"src": "MAP"}]); shots[-1].update(kind="map", src=None, views=[MAP_OH, MAP_WIDE],
        legs=[("COLUMBUS, OH", "BATON ROUGE, LA")], cities_on=["ATHENS, OH", "COLUMBUS, OH"], years={"BATON ROUGE, LA": "2018"}, leg_t=0.5, leg_len=1.6)
    tr(t0, "burn", 0.7); fx(t0 + 0.5, "whoosh_tunnel", 0.25); fx(t0 + 2.1, "ui_click", 0.25)

    # ================= 3 · THE RISE =================
    sp["ch3"] = T[0]
    vo("v05b", [{"src": tiger, "look": "teal"}])
    vo("v06", [{"src": X("lsufb_00"), "look": "teal"}, {"src": lsu_band, "look": "teal"}])
    ov(T[0] - 3.0, T[0] - 0.4, "tag", year="2019", label="LSU TIGERS", stat=None)
    s0, s1, cuts = vo("v07", [{"src": X("lsufb_08"), "look": "teal", "frac": 1.2}, {"src": lsu_crowd2, "look": "teal", "frac": 0.8},
                              {"src": heisman, "look": "warm", "focus": (0.62, 0.35)}], tdefault="flash")
    ov(cuts[0], cuts[1], "counter", value=5671, fmt="{:,} YDS", sub="PASSING YARDS  ·  2019", size=200, count=2.2)
    ov(cuts[1], cuts[2], "counter", value=60, fmt="{} TD", sub="TOUCHDOWN PASSES", size=220, count=0.8)
    ov(cuts[2], cuts[3] + 0.2, "title", text="HEISMAN TROPHY", size=170, y=0.45, line=True, dim=0.3)
    fx(cuts[2], "impact_epic", 0.5); fx(cuts[2], "crowd_cheer_victory", 0.2)
    a0, a1 = real(LQ, [(135.90, 143.90), (148.62, 151.95)], cover=[(8.05, 9.6, {"src": heisman, "look": "warm", "focus": (0.62, 0.35)})])
    tr(a0, "cross", 0.5)
    vo("v07b", [{"src": X("nyc_01"), "look": "cold"}, {"src": X("athens_05"), "look": "bw"}, {"src": X("athens_00"), "look": "bw"},
                {"src": X("pantry_00"), "look": "warm"}], td=0.7)
    ov(T[0] - 3.8, T[0] - 0.3, "tag", year="DEC 2019", label="ATHENS COUNTY FOOD PANTRY", stat="HUNDREDS OF THOUSANDS DONATED")
    s0, s1, cuts = vo("v08", [{"src": superdome, "look": "teal"}, {"src": lsu_helmet, "look": "warm", "focus": (0.34, 0.44), "z": (1.5, 1.42)}])
    ov(cuts[0] + 0.6, cuts[1], "score", a="LSU", sa=42, b="CLEMSON", sb=25, sub="CFP NATIONAL CHAMPIONSHIP  ·  JAN 13, 2020")
    ov(cuts[1], cuts[2] + 0.2, "title", text="15 – 0", size=300, y=0.44, dim=0.35)
    fx(cuts[1], "impact_trailer_epic", 0.5); fx(cuts[0], "crowd_stadium_joy", 0.18, at="start", dur=4)
    a0, a1 = real(LN, [(70.25, 80.90)], cover=[(6.0, 10.6, {"src": lsu_champs, "look": "warm"})],
                  lower=dict(name="JOE BURROW", role="On the nickname “Smokin' Joe”", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.5)
    t0, t1, _ = gap(3.0, [{"src": "MAP"}]); shots[-1].update(kind="map", src=None, views=[MAP_WIDE, MAP_WIDE],
        legs=[("BATON ROUGE, LA", "CINCINNATI, OH")], cities_on=["ATHENS, OH", "COLUMBUS, OH", "BATON ROUGE, LA"],
        years={"CINCINNATI, OH": "2020"}, leg_t=0.3, leg_len=1.5)
    tr(t0, "burn", 0.7); fx(t0 + 0.3, "whoosh_tunnel", 0.25); fx(t0 + 1.8, "ui_click", 0.25)

    # ================= 4 · NUMBER ONE =================
    sp["ch4"] = T[0]
    s0, s1, cuts = vo("v09", [{"src": v_draft, "ss": 8, "speed": 0.8, "cz": 1.1}, {"src": X("cincy_06"), "look": "teal"}])
    ov(cuts[1], cuts[2], "title", text="#1", size=400, y=0.43, mode="diff", dim=0.2)
    ov(cuts[1], cuts[2], "tag", year="APR 2020", label="FIRST OVERALL PICK", stat="CINCINNATI BENGALS")
    fx(cuts[1], "impact_epic", 0.5); fx(s0, "reporters_flashes", 0.2, at="start", dur=3)
    a0, a1 = real(LN, [(54.50, 62.98)])
    tr(a0, "cross", 0.45)
    vo("v09b", [{"src": pbs_night, "look": "bw"}, {"src": locker, "look": "warm", "z": (1.0, 1.08)}])

    # ================= 5 · THE SETBACKS =================
    sp["ch5"] = T[0]
    s0, s1, cuts = vo("v10", [{"src": action1, "look": "teal"}, {"src": hurt[0], "look": "bw"}, {"src": hurt[1], "look": "duo"}], tdefault="dip", td=0.35)
    ov(cuts[0] + 0.3, cuts[1], "tag", year="NOV 22, 2020", label="GAME 10  ·  vs WASHINGTON", stat=None)
    ov(cuts[2] + 0.2, cuts[3], "stamp", text="ACL + MCL", size=110, x=0.62, y=0.4, rot=-6)
    fx(cuts[1], "thunder_impact", 0.4); fx(cuts[2] + 0.2, "heartbeat_impact", 0.4); fx(cuts[1], "heartbeat_ambience", 0.35, at="start")
    t0, t1, _ = gap(1.8, [{"src": on_cart, "look": "cold", "z": (1.06, 1.12), "focus": (0.5, 0.36)}])
    tr(t0, "cross", 0.5)
    s0, s1, cuts = vo("v11", [{"src": locker, "look": "warm"}, {"src": BG(12), "look": "teal"}, {"src": action2, "look": "teal", "kick": 6}])
    ov(cuts[2], cuts[3], "counter", value=51, fmt="{} SACKS", sub="MOST IN THE NFL  ·  2021", size=190, count=1.0)
    s0, s1, cuts = vo("v11b", [{"src": pbs_sb, "look": "warm"}, {"src": v_arrow, "ss": 3, "speed": 0.75}, {"src": X("arrowhead_08"), "look": "teal"}])
    ov(cuts[1] + 0.3, cuts[3], "score", a="BENGALS", sa=27, b="CHIEFS", sb=24, sub="AFC CHAMPIONSHIP  ·  OT  ·  JAN 30, 2022")
    fx(cuts[1], "stadium_drums_chants", 0.16, at="start", dur=6)
    s0, s1, cuts = vo("v12a", [{"src": sofi_sunset, "look": "warm"}, {"src": sofi_in, "look": "cold"}])
    ov(cuts[0] + 0.3, cuts[1], "score", a="BENGALS", sa=20, b="RAMS", sb=16, sub="SUPER BOWL LVI  ·  4TH QUARTER")
    fx(s0, "bass_pulse", 0.2, at="start", dur=5); fx(cuts[1], "clock_tick", 0.2, at="start", dur=3)
    s0, s1, cuts = vo("v12", [{"src": sb_fly, "look": "cold", "focus": (0.5, 0.8)}])
    ov(s0, s1, "score", a="RAMS", sa=23, b="BENGALS", sb=20, sub="FINAL  ·  SUPER BOWL LVI  ·  FEB 13, 2022")
    fx(s0, "impact_big", 0.45)
    s0, s1, cuts = vo("v13", [{"src": X("cincy_06"), "look": "teal"}, {"src": hurt[7], "look": "bw"}, {"src": hurt[6], "look": "duo"}])
    ov(cuts[0] + 0.2, cuts[1], "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  SEPT 2023", size=160, count=1.4)
    ov(cuts[1] + 0.4, cuts[3], "stamp", text="WRIST · NOV 2023", size=90, x=0.6, y=0.42)
    fx(cuts[1] + 0.4, "thunder_impact", 0.35)
    s0, s1, cuts = vo("v14", [{"src": v_nfl, "ss": 3, "speed": 0.7}, {"src": action1, "look": "teal"}, {"src": qb_pose, "look": "warm", "focus": (0.5, 0.33)}])
    ov(cuts[0] + 0.2, cuts[1], "counter", value=4918, fmt="{:,} YDS", sub="#1 IN THE NFL  ·  2024", size=190, count=1.3)
    ov(cuts[1], cuts[2], "counter", value=43, fmt="{} TD", sub="#1 IN THE NFL  ·  2024", size=220, count=0.8)
    ov(cuts[2], cuts[3] + 0.3, "title", text="COMEBACK PLAYER OF THE YEAR", size=104, y=0.42, line=True, dim=0.3)
    fx(cuts[2], "impact_trailer_epic", 0.55)

    # ================= 6 · WHO HE IS =================
    sp["ch6"] = T[0]
    vo("v15", [{"src": portrait, "look": "warm", "focus": (0.5, 0.33), "z": (1.04, 1.12)}])
    a0, a1 = real(LN, [(65.30, 69.95)], lower=dict(name="JOE BURROW", role="On his nicknames", date="LORDSTOWN MOTORS INTERVIEW  ·  2022"))
    tr(a0, "cross", 0.45)
    a0, a1 = real(LN, [(99.50, 110.20)], credit=True)
    tr(a0, "cut", 0.1)
    a0, a1 = real(LN, [(86.94, 91.75)], credit=True)
    tr(a0, "cut", 0.1)
    a0, a1 = real(LQ, [(179.18, 186.74)], credit=True)          # SpongeBob
    tr(a0, "cut", 0.1)
    a0, a1 = real(LQ, [(206.09, 214.41)], credit=True)          # Kid Cudi
    tr(a0, "cut", 0.1)

    # ================= ENDING =================
    sp["end"] = T[0]
    s0, s1, cuts = vo("v16", [
        {"src": X("hsfb_00"), "look": "bw"}, {"src": OSU(13), "look": "bw"}, {"src": hurt[2], "look": "bw"},
        {"src": qb_pose, "look": "warm", "focus": (0.5, 0.33)}], tdefault="cross", td=0.6)
    a0, a1 = real(WOSN, [(71.40, 73.12)], cz=1.5, cy=0.38, look="bw", credit=False, pre=0.3, post=0.6)
    tr(a0, "dip", 0.5)
    vo("v17", [{"src": portrait2, "look": "cold", "focus": (0.5, 0.33), "z": (1.04, 1.14)}], post=0.8)
    t0, t1, _ = gap(6.0, [None])
    tr(t0, "dip", 0.6)
    ov(t0 + 0.2, t1 - 0.2, "title", text="JOE BURROW", size=150, y=0.36, line=True)
    for k, line_ in enumerate(["INTERVIEW FOOTAGE  ·  WOSN (2016), LORDSTOWN MOTORS (2022)  ·  CC BY 3.0",
                               "PHOTOS & CLIPS  ·  WIKIMEDIA COMMONS CONTRIBUTORS (SEE DESCRIPTION)",
                               "MUSIC  ·  KEVIN MACLEOD (INCOMPETECH.COM)  ·  CC BY 4.0"]):
        ov(t0 + 0.8 + 0.2 * k, t1 - 0.2, "text", text=line_, size=19, y=0.56 + 0.045 * k, track=3)
    fx(t0, "impact_trailer_epic", 0.6)
    dur = T[0]

    shots.sort(key=lambda s: (s["t0"], s.get("cover", False)))
    # cutaways sit on top: shot_at picks the latest-starting shot covering t, so covers win inside their span
    for x in trans:
        if "a" in x: continue
        x["a"] = max((s for s in shots if s["t0"] < x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[0])
        x["b"] = min((s for s in shots if s["t0"] >= x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[-1])
    trans[:] = [x for x in trans if x["type"] != "cut"]
    # whoosh on transitions without a sound nearby
    starts = [e["t"] for e in sfx]
    WH = {"burn": "whoosh_wind_cine", "flash": "sweep_air", "dip": "whoosh_air_deep", "cross": "whoosh_air"}
    for k, x in enumerate(sorted(trans, key=lambda x: x["t"])):
        n = WH.get(x["type"])
        if n and not any(abs(s - (x["t"] - HIT.get(n, 0))) < 0.35 for s in starts):
            fx(x["t"], n, 0.07 if x["type"] == "cross" else 0.14, pan=0.3 * (-1) ** k)
    return dict(shots=shots, trans=trans, overlays=ovl, accents=acc, sfx=sfx, segs=segs, dur=dur, sections=sp)

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

SUBS_FILE = "doc/subs_words.json"
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
    s = SECTIONS
    return [
        dict(file=MUS + "Impact_Lento.mp3", src=0.0, dst0=0.0, dst1=s["ch1"] + 0.6, fin=1.5, fout=1.2, gain=1.3),
        dict(file=MUS + "Lightless_Dawn.mp3", src=0.0, dst0=s["ch1"] - 0.2, dst1=s["ch2"] + 0.5, fin=1.0, fout=1.2, gain=1.6),
        dict(file=MUS + "Impact_Lento.mp3", src=60.0, dst0=s["ch2"] - 0.3, dst1=s["ch3"] + 0.5, fin=1.0, fout=1.2, gain=1.2),
        dict(file=MUS + "Heroic_Age.mp3", src=40.0, dst0=s["ch3"] - 0.3, dst1=s["ch4"] + 0.5, fin=1.0, fout=1.2, gain=0.85),
        dict(file=MUS + "Lightless_Dawn.mp3", src=60.0, dst0=s["ch4"] - 0.3, dst1=s["ch5"] + 0.8, fin=1.0, fout=1.2, gain=1.7),
        dict(file=MUS + "Five_Armies.mp3", src=100.0, dst0=s["ch5"] + 0.5, dst1=s["ch6"] + 0.5, fin=1.5, fout=1.5, gain=0.7),
        dict(file=MUS + "Rising_Game.mp3", src=0.0, dst0=s["ch6"] - 0.3, dst1=s["end"] + 0.5, fin=1.0, fout=1.2, gain=0.9),
        dict(file=MUS + "Impact_Prelude.mp3", src=190.57 - ((DUR - 6.0) - (s["end"] - 0.3)), dst0=s["end"] - 0.3, dst1=DUR,
             fin=1.2, fout=1.5, gain=1.0),
    ]

if __name__ == "__main__":
    write_dialogue()
    print("DUR", DUR, "shots", len(_B["shots"]), "trans", len(_B["trans"]), "ovl", len(_B["overlays"]), "sfx", len(_B["sfx"]))
    real = sum(s["dur"] for s in json.load(open("doc/segments.json")) if s["kind"] == "real")
    vo_ = sum(s["dur"] for s in json.load(open("doc/segments.json")) if s["kind"] == "vo")
    print("real audio %.1fs  narration %.1fs" % (real, vo_)); print(SECTIONS)
