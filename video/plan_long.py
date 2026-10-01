"""Edit decision list for the 5-minute cut. Same look and rules as plan3 (render3/mix3), chaptered."""
import json, re

OFF = 1.0
R1, R2, FX, MUS = "media/raw/", "media/raw2/", "media/sfx2/cut/", "media/music/"
VO_FILE = "audio/voiceover_long.wav"
_TL = json.load(open("audio/timings_long.json"))
T, CH = _TL["lines"], _TL["chapters"]
WORDS = json.load(open("audio/words_long.json"))
HIT = json.load(open(FX + "hitpoints.json"))
def L(i): return T[i]["start"] + OFF
def E(i): return T[i]["end"] + OFF
def lw(i): return [w for w in WORDS if w["line"] == i]
def WS(i, k): return lw(i)[k]["start"] + OFF
TAIL = E(len(T) - 1) + 0.6
DUR = round(TAIL + 4.6, 2)

IP, IP_FINAL_CHORD = MUS + "Impact_Prelude.mp3", 190.57
REWIND_BEATS = [181.553, 182.133, 182.691, 183.248, 183.828, 184.386, 184.92, 185.5, 186.057, 186.615, 187.195]

# first line index of each chapter
CH_FIRST = [next(l["i"] for l in T if l["chapter"] == c["title"]) for c in CH]
def card_span(n):
    """Black chapter card between chapter n-1 and n."""
    i = CH_FIRST[n]
    return E(i - 1) + 0.35, L(i) - 0.1

KEYWORDS = {"overlooked", "lost", "injuries", "prove", "superstar", "easily", "lose", "athens", "life", "best",
            "waiting", "broke", "zero", "different", "left", "unstoppable", "heisman", "hungry", "champion",
            "losses", "first", "stopped", "acl", "mcl", "over", "wonder", "sacked", "division", "overtime",
            "comeback", "ahead", "seven", "minutes", "richest", "wrist", "rebuilt", "fight", "finished",
            "doubted", "himself", "extraordinary", "next", "dream", "graduated"}

def build_plan():
    shots, trans, ovl, acc, sfx = [], [], [], [], []
    sid = [0]
    def shot(t0, t1, src, kind="photo", look="teal", z=(1.0, 1.07), **kw):
        sid[0] += 1
        s = dict(id=sid[0], t0=t0, t1=t1, src=src, kind=kind, look=look, z0=z[0], z1=z[1], **kw)
        shots.append(s); return s
    def tr(t, type_, d=0.4, **kw): trans.append(dict(t=t, type=type_, d=d, **kw))
    def ov(t0, t1, type_, **kw): ovl.append(dict(t0=t0, t1=t1, type=type_, **kw))
    def fx(t, name, gain=0.4, at="hit", pan=0.0, **kw):
        sfx.append(dict(t=t - (HIT.get(name, 0) if at == "hit" else 0), file=FX + name + ".wav", gain=gain, pan=pan, **kw))

    # ---------------------------------------------------------------- media
    JB = lambda n: R2 + f"jb_{n:02d}.jpg"
    X = lambda name: R2 + name + ".jpg"
    portrait, portrait2 = R1 + "burrow_02.jpg", R1 + "burrow_06.jpg"
    qb_pose, running, on_cart = JB(4), JB(35), JB(10)
    action1, action2, action3, action4 = JB(36), JB(37), JB(9), JB(1)
    hurt = [JB(12), JB(11), JB(13), JB(24), JB(19), JB(27), JB(21), JB(31)]
    sb_fly, pbs_sb = R1 + "sb_00.jpg", R1 + "sb_01.jpg"
    heisman, tiger = R1 + "heisman_02.jpg", R1 + "tiger_00.jpg"
    lsu_crowd, lsu_crowd2, lsu_band = R1 + "lsu_13.jpg", R1 + "lsu_11.jpg", R1 + "lsu_02.jpg"
    lsu_helmet, lsu_champs = X("lsu19_00"), X("lsu19_13")
    ohio_air = R1 + "ohio_00.jpg"
    OSU = lambda n: X(f"osu_{n:02d}")
    BG = lambda n: X(f"bengals_{n:02d}")
    superdome, helmet_ball, helmet_solo = X("superdome_02"), X("helmet_04"), X("helmet_03")
    sofi_sunset, sofi_in, vintage, vintage2, pbs_night = X("sofi_05"), X("sofi_04"), X("qb_03"), X("qb_05"), X("pbs_00")
    locker, gloves = X("bengals24_08"), X("bengals24_09")
    v_draft, v_enter, v_fans = R1 + "vid_draft.webm", R1 + "vid_enter.webm", R1 + "vid_fans.webm"
    v_game, v_wsu = R2 + "vfb_06.webm", R2 + "vfb_08.webm"
    v_arrow, v_nfl, v_sbtunnel, v_trophy = R2 + "vkc_06.webm", R2 + "vkc_07.webm", R2 + "vsb_00.webm", R2 + "vsb_01.webm"

    def seq(t0, t1, items, i=None, tdefault="cross", td=0.45):
        """Lay items across [t0, t1], cutting on word starts of line i when possible."""
        n = len(items); cuts = [t0]
        ws = [w["start"] + OFF for w in lw(i)] if i is not None else []
        for k in range(1, n):
            target = t0 + (t1 - t0) * k / n
            c = min(ws, key=lambda x: abs(x - target)) if ws else target
            if c <= cuts[-1] + 0.5 or c >= t1 - 0.5: c = target
            cuts.append(c)
        cuts.append(t1)
        for k, it in enumerate(items):
            it = dict(it) if isinstance(it, dict) else {"src": it}
            src = it.pop("src"); tt = it.pop("tr", tdefault if k else None)
            if src.endswith(".webm"):
                it.setdefault("cz", 1.15); it.setdefault("speed", 0.7)
                shot(cuts[k], cuts[k + 1], src, kind="clip", **it)
            else:
                it.setdefault("par", 0.9); it.setdefault("z", (1.0, 1.07) if k % 2 == 0 else (1.07, 1.0))
                shot(cuts[k], cuts[k + 1], src, **it)
            if tt: tr(cuts[k], tt, td if tt != "flash" else 0.25)
        return cuts

    def line(i, items, **kw):
        nxt = L(i + 1) - 0.1 if i + 1 < len(T) and (i + 1) not in CH_FIRST else E(i) + 0.35
        return seq(L(i) - 0.1, nxt, items, i, **kw)

    # ================= COLD OPEN (as in v3) =================
    fx(0.0, "room_tone_dark", 0.22, at="start", dur=38.0)
    shot(0.0, L(1) - 0.1, qb_pose, z=(1.0, 1.08), focus=(0.5, 0.36), look="warm", par=1.0)
    ov(1.2, L(1) - 0.15, "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  CINCINNATI BENGALS  ·  2023")
    fx(1.2, "impact_intro", 0.5); fx(0.2, "crowd_stadium_joy", 0.1, at="start", dur=3.8)
    t1 = WS(1, 5)
    shot(L(1) - 0.1, t1, v_wsu, kind="clip", ss=36, speed=0.6, cz=1.35, cy=0.3, look="muted")
    tr(L(1) - 0.1, "cross", 0.6); fx(L(1) - 0.1, "whoosh_air_deep", 0.2)
    shot(t1, L(2) - 0.1, on_cart, z=(1.04, 1.12), focus=(0.5, 0.36), look="cold", par=1.0)
    tr(t1, "cross", 0.5)
    sp_end = L(5) - 0.1
    shot(L(2) - 0.1, sp_end, None, kind="split", panels=[
        dict(kind="photo", src=OSU(4), t_in=L(2) - 0.1, z0=1.0, z1=1.06, focus=(0.5, 0.5)),
        dict(kind="photo", src=sb_fly, t_in=L(3) - 0.1, z0=1.02, z1=1.08, focus=(0.5, 0.65)),
        dict(kind="photo", src=hurt[0], t_in=L(4) - 0.1, z0=1.0, z1=1.06, focus=(0.5, 0.4))])
    tr(L(2) - 0.1, "dip", 0.4)
    fx(L(2) - 0.3, "heartbeat_ambience", 0.35, at="start"); fx(L(4) - 0.6, "heartbeat_ambience", 0.35, at="start")
    for i, lab in ((2, "OHIO STATE  ·  2015–17"), (3, "SUPER BOWL LVI"), (4, "ACL + MCL  ·  2020")):
        fx(L(i) - 0.1, "drum_subtle", 0.45); fx(L(i) - 0.1, "sub_knock", 0.25)
        ov(L(i) + 0.2, sp_end, "text", text=lab, size=22, x=(i - 1.5) / 3, y=0.17, track=4)
    c5 = [sp_end, WS(5, 7), WS(5, 12), E(5) + 0.4]
    shot(c5[0], c5[1], action1, z=(1.0, 1.08), look="teal", par=1.0, pan=1)
    tr(c5[0], "zoom", 0.5); fx(c5[0], "whoosh_cine_fast", 0.35)
    shot(c5[1], c5[2], v_game, kind="clip", ss=137.5, speed=0.5, cz=1.4, cy=0.35, look="teal")
    tr(c5[1], "cross", 0.35)
    shot(c5[2], c5[3], action2, z=(1.02, 1.1), look="teal", par=1.0, pan=-1)
    ov(WS(5, -3), c5[3] - 0.05, "title", text="THE HIGHEST LEVEL", size=140, y=0.45, line=True, dim=0.25, hide_subs=True)
    fx(WS(5, -3), "impact_trailer_epic", 0.4)
    t0 = c5[3]
    shot(t0, WS(6, 9), portrait, z=(1.0, 1.06), focus=(0.5, 0.33), look="warm", par=1.0)
    tr(t0, "leak", 0.8, v=0); fx(t0 - 0.3, "whoosh_tunnel", 0.22, at="start")
    ov(WS(6, 2), WS(6, 9), "title", text="JOE BURROW", size=250, y=0.5, mode="diff", line=True, track=18)
    fx(WS(6, 2), "impact_epic", 0.45)
    shot(WS(6, 9), L(7) - 0.1, OSU(0), z=(1.08, 1.0), look="teal", focus=(0.5, 0.55), par=0.8)
    tr(WS(6, 9), "cross", 0.6); fx(WS(6, 9), "crowd_sports_ambient", 0.12, at="start", dur=7.0)
    shot(L(7) - 0.1, WS(7, 7), v_enter, kind="clip", ss=6, speed=0.55, look="muted")
    tr(L(7) - 0.1, "cross", 0.6)
    shot(WS(7, 7), L(8) - 0.1, hurt[1], z=(1.0, 1.06), look="bw", focus=(0.5, 0.4), par=0.9)
    tr(WS(7, 7), "dip", 0.4); ov(WS(7, 7), L(8) - 0.1, "dust", amt=0.35)
    c8 = [L(8) - 0.1, WS(8, 5), WS(8, 9), WS(8, 12), E(8) + 0.2]
    for k, (src, kind, look) in enumerate([(pbs_sb, "photo", "cold"), (lsu_crowd2, "photo", "muted"),
                                           (v_wsu, "clip", "teal"), (sofi_in, "photo", "cold")]):
        if kind == "clip": shot(c8[k], c8[k + 1], src, kind="clip", ss=150, speed=0.7, cz=1.3, cy=0.2, look=look)
        else: shot(c8[k], c8[k + 1], src, z=(1.0, 1.06) if k % 2 == 0 else (1.06, 1.0), look=look, par=0.8)
        tr(c8[k], "cross" if k else "zoom", 0.45 if k else 0.5)
    fx(c8[0], "whoosh_air_fast", 0.25); fx(c8[2], "crowd_cheer_victory", 0.22)
    fx(L(8), "heartbeat_slow", 0.3, at="start", dur=8.0)
    shot(E(8) + 0.2, E(9) + 0.35, None, kind="black"); tr(E(8) + 0.2, "dip", 0.5)
    ov(L(9) - 0.1, E(9) + 0.3, "text", text="IT'S WHAT YOU DO AFTER YOU LOSE.", size=50, weight="x", typing=1.0, track=8)
    fx(L(9) + 0.2, "heartbeat_impact", 0.5); fx(L(9) + 1.2, "heartbeat_impact", 0.45)

    # ================= CHAPTER CARDS =================
    NUM = ["", "CHAPTER ONE", "CHAPTER TWO", "CHAPTER THREE", "CHAPTER FOUR", "CHAPTER FIVE", "CHAPTER SIX",
           "CHAPTER SEVEN", "CHAPTER EIGHT", ""]
    for n in range(1, len(CH)):
        a, b = card_span(n)
        title = CH[n]["title"].split("·")[-1].strip()
        if n != 1: shot(a, b, None, kind="black"); tr(a, "dip", 0.5)
        else: shot(E(9) + 0.35, b, None, kind="black")
        if NUM[n]: ov(a + 0.1, b - 0.05, "text", text=NUM[n], size=24, y=0.40, track=12, weight="x",
                       color=(1.0, 0.45, 0.2))
        ov(a + 0.25, b - 0.05, "title", text=title, size=118, y=0.51, line=True, track=8)
        fx(a + 0.3, "drum_deep", 0.5); fx(a + 0.3, "rumble_bass", 0.25); fx(a, "whoosh_tunnel", 0.16, at="start")
    def first_tr(i, ty="dip", d=0.5): tr(L(i) - 0.1, ty, d)

    # ================= CH1 · ATHENS =================
    first_tr(10)
    fx(L(10) - 0.2, "wind_hum_cine", 0.12, at="start", dur=26)
    line(10, [{"src": X("athens_02"), "look": "warm"}, {"src": X("athens_05"), "look": "warm"}, X("athens_06")])
    ov(L(10) + 0.4, WS(10, 8), "text", text="ATHENS, OHIO", size=26, y=0.17, track=10, weight="x")
    line(11, [{"src": X("peden_05"), "look": "teal"}, X("peden_03"), {"src": X("peden_02"), "look": "warm"}])
    ov(WS(11, 5), E(11), "tag", year="JIM BURROW", label="HIS FATHER  ·  A LIFETIME OF COACHING", stat=None)
    line(12, [{"src": X("hsfb_00"), "look": "teal"}, {"src": helmet_ball, "look": "warm"}])
    line(13, [{"src": v_enter, "ss": 20, "look": "muted"}, X("hsfb_02")])
    fx(L(13), "crowd_sports_ambient", 0.1, at="start", dur=4)
    line(14, [{"src": helmet_solo, "look": "warm", "z": (1.05, 1.15)}])
    ov(WS(14, 3), E(14) + 0.2, "title", text="MR. FOOTBALL", size=170, y=0.45, line=True, dim=0.3, hide_subs=True)
    ov(WS(14, 3), E(14) + 0.2, "tag", year="2014", label="OHIO'S BEST HIGH SCHOOL PLAYER", stat=None)
    fx(WS(14, 3), "impact_epic", 0.4); fx(WS(14, 3), "crowd_cheer_victory", 0.15)
    line(15, [OSU(13), {"src": X("osu2_03"), "look": "teal"}], tdefault="zoom")

    # ================= CH2 · THE BACKUP =================
    first_tr(16)
    line(16, [{"src": ohio_air, "look": "bw"}, {"src": OSU(2), "look": "muted"}])
    line(17, [{"src": X("columbus_00"), "look": "cold"}, X("osu2_00"), {"src": OSU(8), "look": "muted"}])
    ov(L(17) + 0.2, E(17), "tag", year="2015–2017", label="OHIO STATE  ·  BACKUP QB", stat="BEHIND J.T. BARRETT")
    line(18, [{"src": OSU(10), "look": "bw"}, {"src": OSU(12), "look": "bw"}], td=0.7)
    fx(L(18), "heartbeat_slow", 0.2, at="start", dur=5)
    line(19, [{"src": helmet_solo, "look": "bw", "z": (1.05, 1.15)}])
    ov(WS(19, 4), E(19) + 0.3, "stamp", text="BROKEN HAND", size=100, x=0.6, y=0.42)
    fx(WS(19, 4), "slowmo_impact", 0.45)
    line(20, [{"src": OSU(14), "look": "muted"}, {"src": vintage2, "look": "bw"}])
    line(21, [{"src": OSU(6), "look": "bw", "z": (1.1, 1.18)}])
    ov(L(21), E(21) + 0.35, "title", text="3 YEARS · 0 STARTS", size=150, y=0.47, mode="diff", dim=0.45, hide_subs=True)
    fx(L(21), "drum_bass_trailer", 0.45)
    line(22, [{"src": X("ohiou_07"), "look": "muted"}, {"src": X("columbus_02"), "look": "warm"}])
    line(23, [{"src": X("ohiou_02"), "look": "warm"}])
    ov(L(23), E(23) + 0.3, "tag", year="MAY 2018", label="GRADUATES IN THREE YEARS", stat=None)

    # ================= CH3 · BATON ROUGE =================
    first_tr(24, "leak", 0.8)
    line(24, [{"src": tiger, "look": "teal"}])
    ov(L(24) + 0.1, E(24) + 0.2, "tag", year="2018", label="TRANSFERS TO LSU", stat="A FRESH START")
    fx(L(24), "impact_whoosh_deep", 0.35)
    line(25, [X("miketiger_02"), X("lsufb_00"), lsu_band], tdefault="flash")
    fx(WS(25, 3), "whoosh_fast", 0.18); fx(WS(25, 6), "whoosh_fast", 0.18)
    line(26, [lsu_crowd2, {"src": X("lsufb_01"), "look": "teal"}])
    ov(WS(26, 5), E(26) + 0.2, "tag", year="2018", label="LSU STARTER", stat="10 WINS  ·  FIESTA BOWL CHAMPIONS")
    fx(L(26), "crowd_stadium_joy", 0.14, at="start", dur=3)
    line(27, [{"src": X("lsufb_00"), "look": "cold", "z": (1.0, 1.12)}])
    fx(E(27), "riser_trailer", 0.4)

    # ================= CH4 · THE PERFECT SEASON =================
    first_tr(28, "flash", 0.3)
    line(28, [{"src": lsu_crowd, "look": "teal"}, {"src": v_game, "ss": 70, "speed": 0.6, "cz": 1.4, "cy": 0.35},
              {"src": X("lsufb_02"), "look": "teal"}], tdefault="cross")
    ov(L(28), WS(28, 3), "title", text="2019", size=330, mode="diff", y=0.42, dim=0.15)
    fx(L(28), "impact_trailer_epic", 0.4)
    line(29, [{"src": X("lsufb_08"), "look": "teal"}])
    ov(L(29), E(29) + 0.3, "counter", value=5671, fmt="{:,} YDS", sub="PASSING YARDS  ·  2019", size=200, count=2.4)
    fx(L(29), "drum_bass_hit", 0.35)
    line(30, [{"src": lsu_crowd2, "look": "teal"}, {"src": X("lsufb_13"), "look": "teal"}])
    ov(L(30), WS(30, 3), "counter", value=60, fmt="{} TD", sub="TOUCHDOWN PASSES", size=220, count=1.0)
    ov(WS(30, 3), E(30) + 0.3, "counter", value=6, fmt="{} INT", sub="INTERCEPTIONS", size=220, count=0.4)
    fx(L(30), "drum_bass_hit", 0.35); fx(WS(30, 3), "drum_bass_hit", 0.3)
    line(31, [{"src": X("nyc_01"), "look": "teal"}, {"src": heisman, "look": "warm", "focus": (0.62, 0.35)}])
    ov(WS(31, 3), E(31) + 0.3, "title", text="HEISMAN TROPHY", size=170, y=0.45, line=True, dim=0.3, hide_subs=True)
    fx(WS(31, 3), "impact_epic", 0.5); fx(WS(31, 3), "crowd_cheer_victory", 0.2)
    line(32, [{"src": X("nyc_02"), "look": "cold"}])
    line(33, [{"src": X("athens_05"), "look": "bw"}, {"src": X("athens_00"), "look": "bw"}], td=0.7)
    fx(L(33), "wind_hum_cine", 0.12, at="start", dur=8)
    line(34, [{"src": X("pantry_00"), "look": "warm"}, {"src": X("athens_06"), "look": "warm"}])
    ov(WS(34, 3), E(34) + 0.3, "tag", year="DEC 2019", label="ATHENS COUNTY FOOD PANTRY", stat="HUNDREDS OF THOUSANDS DONATED")
    line(35, [{"src": superdome, "look": "teal"}, {"src": X("cfp_01"), "look": "warm", "focus": (0.62, 0.62), "z": (1.25, 1.18)}])
    ov(WS(35, 5), E(35) + 0.3, "score", a="LSU", sa=42, b="CLEMSON", sb=25, sub="CFP NATIONAL CHAMPIONSHIP  ·  JAN 13, 2020")
    fx(WS(35, 5), "crowd_stadium_joy", 0.2, at="start", dur=4)
    line(36, [{"src": lsu_helmet, "look": "warm", "focus": (0.34, 0.44), "z": (1.5, 1.42)}])
    ov(L(36), E(36) + 0.3, "title", text="15 – 0", size=300, y=0.44, dim=0.35, hide_subs=True)
    fx(L(36), "impact_trailer_epic", 0.55)
    line(37, [{"src": lsu_champs, "look": "warm"}, {"src": lsu_crowd, "look": "teal"}], tdefault="leak", td=0.7)

    # ================= CH5 · NUMBER ONE =================
    first_tr(38)
    line(38, [{"src": v_draft, "ss": 8, "speed": 0.8, "cz": 1.1}, {"src": X("cincy_06"), "look": "teal"}])
    ov(WS(38, 7), E(38) + 0.1, "title", text="#1", size=420, y=0.43, mode="diff", dim=0.2)
    ov(WS(38, 7), E(38) + 0.1, "tag", year="APR 2020", label="FIRST OVERALL PICK", stat="CINCINNATI BENGALS")
    fx(WS(38, 7), "impact_epic", 0.5); fx(L(38), "reporters_flashes", 0.22, at="start", dur=3.5)
    line(39, [{"src": pbs_night, "look": "bw"}, {"src": locker, "look": "warm", "z": (1.0, 1.08)}, {"src": qb_pose, "look": "warm"}])
    line(40, [{"src": action4, "look": "teal", "z": (1.0, 1.05)}, {"src": action3, "look": "teal"}])
    ov(WS(40, 3), E(40) + 0.2, "tag", year="NOV 22, 2020", label="GAME 10  ·  vs WASHINGTON", stat=None)
    acc.append(dict(t=WS(40, 5), type="white", d=0.3, amt=0.6)); fx(WS(40, 5), "slowmo_impact", 0.55)
    line(41, [{"src": hurt[0], "look": "bw"}, {"src": hurt[1], "look": "bw"}, {"src": hurt[2], "look": "duo"}], tdefault="dip", td=0.3)
    fx(L(41), "heartbeat_ambience", 0.4, at="start")
    ov(WS(41, 5), E(41) + 0.3, "stamp", text="ACL + MCL", size=110, x=0.62, y=0.4, rot=-6)
    fx(WS(41, 5), "heartbeat_impact", 0.45)
    line(42, [{"src": hurt[3], "look": "duo"}])
    ov(L(42) + 0.2, E(42) + 0.3, "stamp", text="SEASON OVER", size=104, x=0.62, y=0.42, rot=-7)
    fx(L(42) + 0.2, "drum_deep", 0.45)
    line(43, [{"src": on_cart, "look": "cold", "z": (1.04, 1.12), "focus": (0.5, 0.36)}, {"src": v_fans, "ss": 4, "look": "bw"}])
    ov(L(41) - 0.1, E(43) + 0.3, "dust", amt=0.3)

    # ================= CH6 · THE COMEBACK =================
    first_tr(44, "leak", 0.8)
    line(44, [{"src": portrait, "look": "warm", "focus": (0.5, 0.33), "z": (1.05, 1.12)}])
    fx(L(44), "impact_whoosh_deep", 0.4)
    line(45, [{"src": locker, "look": "warm"}, BG(12), BG(14)], tdefault="flash")
    ov(L(45) + 0.2, E(45), "tag", year="2021", label="THE RETURN", stat=None)
    fx(L(45), "crowd_stadium_joy", 0.15, at="start", dur=3.5)
    line(46, [{"src": action1, "look": "teal"}, {"src": action2, "look": "teal", "kick": 8}])
    ov(WS(46, 2), E(46) + 0.2, "counter", value=51, fmt="{} SACKS", sub="MOST IN THE NFL  ·  2021", size=190, count=1.0)
    fx(WS(46, 2), "drum_bass_hit", 0.35); fx(WS(46, -3), "impact_cool", 0.3)
    line(47, [{"src": X("cincy_07"), "look": "teal"}])
    ov(L(47) + 0.1, E(47) + 0.3, "tag", year="2021", label="AFC NORTH CHAMPIONS", stat=None)
    line(48, [{"src": pbs_sb, "look": "warm"}])
    ov(WS(48, 5), E(48) + 0.3, "title", text="31 YEARS", size=230, y=0.45, mode="diff", dim=0.25, hide_subs=True)
    fx(WS(48, 5), "impact_epic", 0.45); fx(WS(48, 5), "crowd_cheer_victory", 0.22)
    line(49, [{"src": v_arrow, "ss": 3, "speed": 0.75}, {"src": X("arrowhead_08"), "look": "teal"},
              {"src": v_arrow, "ss": 18, "speed": 0.7}], tdefault="cross")
    ov(WS(49, 7), E(49) + 0.3, "score", a="BENGALS", sa=27, b="CHIEFS", sb=24, sub="AFC CHAMPIONSHIP  ·  OT  ·  JAN 30, 2022")
    fx(L(49), "crowd_chant_stadium", 0.18, at="start", dur=4); fx(WS(49, 7), "crowd_stadium_joy", 0.22, at="start", dur=4)
    line(50, [{"src": qb_pose, "look": "warm", "z": (1.04, 1.12), "focus": (0.5, 0.33)}])
    ov(WS(50, 4), E(50) + 0.35, "title", text="COMEBACK PLAYER OF THE YEAR", size=110, y=0.45, line=True, dim=0.3, hide_subs=True)
    fx(WS(50, 4), "impact_trailer_epic", 0.55)

    # ================= CH7 · SO CLOSE =================
    first_tr(51)
    line(51, [{"src": X("la_01"), "look": "cold"}, {"src": sofi_sunset, "look": "warm"}, {"src": v_trophy, "ss": 9, "speed": 0.7}])
    ov(WS(51, 4), E(51) + 0.2, "tag", year="FEB 13, 2022", label="SUPER BOWL LVI", stat="LOS ANGELES")
    line(52, [{"src": sb_fly, "look": "teal", "focus": (0.5, 0.8)}])
    ov(L(52) + 0.1, E(52) + 0.3, "score", a="BENGALS", sa=20, b="RAMS", sb=16, sub="4TH QUARTER")
    line(53, [{"src": sofi_in, "look": "cold"}])
    ov(WS(53, 5), E(53) + 0.3, "title", text="1:25", size=320, y=0.44, mode="diff", dim=0.3)
    fx(WS(53, 5), "drum_trailer_mystery", 0.35)
    line(54, [{"src": v_sbtunnel, "ss": 56, "speed": 0.6, "look": "cold"}])
    ov(L(54), E(54) + 0.4, "score", a="RAMS", sa=23, b="BENGALS", sb=20, sub="FINAL  ·  SUPER BOWL LVI")
    fx(L(54), "impact_big", 0.45)
    line(55, [{"src": action2, "look": "bw"}])
    ov(L(55), E(55) + 0.3, "counter", value=7, fmt="{} SACKS", sub="SUPER BOWL LVI", size=200, count=0.6)
    line(56, [{"src": on_cart, "look": "bw", "focus": (0.5, 0.36), "z": (1.1, 1.18)}])
    fx(L(56), "heartbeat_slow", 0.2, at="start", dur=4)

    # ================= CH8 · AGAIN =================
    first_tr(57)
    line(57, [{"src": X("kcsnow_00"), "look": "cold"}, {"src": X("arrowhead_09"), "look": "teal"}])
    ov(L(57) + 0.2, E(57), "tag", year="JAN 2023", label="AFC CHAMPIONSHIP", stat="KANSAS CITY")
    fx(L(57), "crowd_sports_ambient", 0.12, at="start", dur=4)
    line(58, [{"src": v_arrow, "ss": 19, "speed": 0.6}, {"src": X("arrowhead_07"), "look": "cold"}])
    ov(WS(58, 3), E(58) + 0.3, "score", a="CHIEFS", sa=23, b="BENGALS", sb=20, sub="AFC CHAMPIONSHIP  ·  JAN 29, 2023")
    fx(WS(58, 3), "drum_deep", 0.4)
    line(59, [{"src": X("cincy_06"), "look": "teal"}, {"src": qb_pose, "look": "warm"}])
    ov(WS(59, 3), E(59) + 0.3, "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  SEPT 2023", size=170, count=1.6)
    fx(WS(59, 3), "impact_intro", 0.4)
    line(60, [{"src": hurt[7], "look": "bw"}, {"src": hurt[4], "look": "bw"}])
    ov(WS(60, 5), E(60) + 0.3, "stamp", text="WRIST · NOV 2023", size=90, x=0.6, y=0.42)
    fx(WS(60, 5), "slowmo_impact", 0.45)
    line(61, [{"src": hurt[6], "look": "duo"}])
    ov(L(61) + 0.1, E(61) + 0.3, "stamp", text="SEASON OVER", size=104, x=0.62, y=0.42, rot=-7)
    fx(L(61) + 0.1, "drum_deep", 0.4)
    line(62, [{"src": gloves, "look": "warm", "z": (1.0, 1.1)}])
    fx(L(62), "impact_whoosh_deep", 0.35)
    line(63, [{"src": v_nfl, "ss": 3, "speed": 0.7}, {"src": action1, "look": "teal"}, {"src": locker, "look": "warm"},
              {"src": qb_pose, "look": "warm", "focus": (0.5, 0.33)}], tdefault="cross")
    ov(WS(63, 6), WS(63, 13), "counter", value=4918, fmt="{:,} YDS", sub="#1 IN THE NFL  ·  2024", size=190, count=1.4)
    ov(WS(63, 13), WS(63, -8), "counter", value=43, fmt="{} TD", sub="#1 IN THE NFL  ·  2024", size=220, count=0.8)
    ov(WS(63, -8), E(63) + 0.35, "title", text="COMEBACK PLAYER OF THE YEAR", size=106, y=0.42, line=True, dim=0.3, hide_subs=True)
    ov(WS(63, -8), E(63) + 0.35, "text", text="FOR THE SECOND TIME", size=30, y=0.56, track=10, weight="x", color=(1.0, 0.45, 0.2))
    fx(WS(63, 6), "drum_bass_hit", 0.35); fx(WS(63, 13), "drum_bass_hit", 0.35); fx(WS(63, -8), "impact_trailer_epic", 0.55)

    # ================= EPILOGUE (v3 ending) =================
    first_tr(64, "zoom", 0.45)
    a, b = L(64) - 0.1, E(64) + 0.5; v1 = WS(64, 3); mid = v1 + 0.6
    shot(a, v1, action1, z=(1.05, 1.12), look="teal", par=1.0, pan=1)
    shot(v1, mid, vintage, z=(1.0, 1.05), look="bw", par=0.6)
    shot(mid, b, action2, z=(1.08, 1.16), look="teal", par=1.0, pan=-1, kick=10)
    fx(a, "whoosh_cine_fast", 0.3)
    ov(WS(64, 3), b, "title", text="BACK INTO THE FIGHT", size=180, style="slam", dim=0.3, hide_subs=True)
    acc.append(dict(t=WS(64, 3), type="white", d=0.2, amt=0.5))
    fx(WS(64, 3), "impact_trailer_epic", 0.65); fx(WS(64, 3), "crowd_chant_stadium", 0.22, at="start", dur=3.5)
    fx(b, "impact_big", 0.6); acc.append(dict(t=b, type="white", d=0.35, amt=0.5))
    shot(b, L(66) - 0.1, pbs_night, z=(1.0, 1.06), look="cold", par=0.8); tr(b, "dip", 0.6)
    fx(b + 0.2, "wind_hum_cine", 0.14, at="start", dur=12)
    shot(L(66) - 0.1, L(67) - 0.1, running, z=(1.0, 1.08), focus=(0.5, 0.3), look="teal", par=1.0, pan=1)
    tr(L(66) - 0.1, "cross", 0.6)
    shot(L(67) - 0.1, L(68) - 0.1, qb_pose, z=(1.04, 1.12), focus=(0.5, 0.3), look="warm", par=1.0)
    tr(L(67) - 0.1, "leak", 0.7, v=1)
    ov(WS(67, 5), L(68) - 0.15, "title", text="SOMETHING LEFT TO PROVE", size=130, y=0.47, line=True, dim=0.2)
    fx(WS(67, 5), "impact_cool", 0.4)
    shot(L(68) - 0.1, L(69) - 0.1, v_fans, kind="clip", ss=12, speed=0.6, look="bw"); tr(L(68) - 0.1, "cross", 0.45)
    c22 = [L(69) - 0.1, WS(69, 4), WS(69, 6), L(70) - 0.1]
    for k, src in enumerate([hurt[4], hurt[5], hurt[6]]):
        shot(c22[k], c22[k + 1], src, z=(1.0, 1.05), look="bw", par=0.8)
        tr(c22[k], "cross", 0.35); fx(c22[k], "shutter_classic", 0.18)
    ov(L(68) - 0.1, L(70) - 0.1, "dust", amt=0.35)
    shot(L(70) - 0.1, L(71) - 0.1, portrait, z=(1.08, 1.2), focus=(0.5, 0.33), look="warm", par=1.2)
    tr(L(70) - 0.1, "leak", 0.7, v=2); fx(L(70) - 0.1, "impact_whoosh_deep", 0.4)
    # tape-rewind recap locked to the score
    fx(L(71) - 0.15, "tape_rewind", 0.4, at="start")
    t, end = L(71) - 0.1, L(72) - 0.1
    src0 = IP_FINAL_CHORD - (TAIL - t)
    RB = [t + (bb - src0) for bb in REWIND_BEATS]
    bt = [rb for rb in RB if t + 0.3 < rb < end - 0.7]
    cuts = [t] + bt[:4] + [x for i in range(3, len(bt) - 1) for x in (bt[i] + (bt[i + 1] - bt[i]) / 2, bt[i + 1])]
    recap = [(locker, "2024"), (X("arrowhead_09"), "2023"), (sofi_sunset, "2022"), (X("arrowhead_08"), "2022"),
             (hurt[2], "2020"), (v_draft, "2020"), (superdome, "2020"), (heisman, "2019"), (lsu_crowd, "2019"),
             (tiger, "2018"), (OSU(13), "2017"), (OSU(2), "2016"), (ohio_air, "2015"), (X("hsfb_00"), "2014"),
             (X("athens_02"), "ATHENS")]
    for k, (src, yr) in enumerate(recap[:len(cuts) - 1]):
        a_, b_ = cuts[k], cuts[k + 1]
        if src.endswith(".webm"): shot(a_, b_, src, kind="clip", ss=8, speed=0.8, look="teal")
        else: shot(a_, b_, src, z=(1.08, 1.0), look="bw" if k % 2 else "teal", par=0.6)
        if k: fx(a_, "shutter_nikon", 0.16, pan=0.3 * (-1) ** k)
        ov(a_, b_, "rewind_year", year=yr, first=(k == 0))
    ov(cuts[0], cuts[-1], "vhs")
    t = cuts[-1]
    shot(t, end, qb_pose, z=(1.0, 1.05), focus=(0.5, 0.35), look="warm", par=1.0)
    tr(t, "zoom", 0.45); fx(t, "impact_epic", 0.5)
    ov(t, end - 0.05, "title", text="EXTRAORDINARY", size=160, mode="diff", y=0.45, track=10, hide_subs=True)
    shot(end, TAIL, portrait2, z=(1.04, 1.14), focus=(0.5, 0.33), look="cold", par=1.0); tr(end, "cross", 0.7)
    shot(TAIL, DUR, None, kind="black"); tr(TAIL, "glitch", 0.25)
    fx(TAIL, "impact_trailer_epic", 0.75); fx(TAIL, "glitch_cine", 0.25)
    ov(TAIL, DUR - 0.2, "title", text="WHAT COMES NEXT?", size=160, style="slam", y=0.46)
    ov(TAIL + 0.9, DUR - 0.2, "text", text="JOE BURROW", size=30, y=0.6, track=16, weight="x")

    shots.sort(key=lambda s: s["t0"])
    for x in trans:
        x["a"] = max((s for s in shots if s["t0"] < x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[0])
        x["b"] = min((s for s in shots if s["t0"] >= x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[-1])
    trans[:] = [x for x in trans if x["type"] != "cut"]

    subs, cur = [], []
    def flush():
        if cur:
            subs.append(dict(t0=cur[0]["t0"] - 0.06, t1=cur[-1]["t1"] + 0.15, words=list(cur), y=0.79)); cur.clear()
    for w in WORDS:
        if w["line"] == 9: flush(); continue
        word = re.sub(r"[.…,]+$", "", w["w"]).upper().replace("...", "")
        cur.append(dict(w=word, t0=w["start"] + OFF, t1=w["end"] + OFF, line=w["line"],
                        key=re.sub(r"[^a-z]", "", w["w"].lower()) in KEYWORDS))
        if re.search(r"[.,…?]$", w["w"]) or len(cur) >= 3 or len("".join(c["w"] for c in cur)) > 15: flush()
    flush()
    for i in range(len(subs) - 1): subs[i]["t1"] = min(subs[i]["t1"], subs[i + 1]["t0"])
    return dict(shots=shots, trans=trans, overlays=ovl, subs=subs, accents=acc, sfx=sfx)

def music_plan():
    cards = [card_span(n) for n in range(1, len(CH))]
    starts = [0.0] + [b - 0.35 for a, b in cards]
    ends = [a + 0.5 for a, b in cards] + [DUR]
    # (file, source start) per chapter; the epilogue aligns the final chord with the end title
    secs = [(IP, 0.0), (MUS + "Lightless_Dawn.mp3", 0.0), (MUS + "Impact_Lento.mp3", 0.0),
            (MUS + "Rising_Game.mp3", 8.0), (MUS + "Heroic_Age.mp3", None), (MUS + "Lightless_Dawn.mp3", 60.0),
            (MUS + "Five_Armies.mp3", 100.0), (MUS + "Unanswered_Questions.mp3", 0.0), (IP, 95.0), (IP, None)]
    out = []
    for n, (f, src) in enumerate(secs):
        d0, d1 = starts[n], ends[n]
        if n == 4: src = 53.61 - (L(29) - d0)                   # Heroic Age entrance on the stats
        if n == len(secs) - 1: src = IP_FINAL_CHORD - (TAIL - d0)
        out.append(dict(file=f, src=src, dst0=d0, dst1=d1, fin=0.9 if n else 2.0, fout=1.0 if n < len(secs) - 1 else 1.0,
                        gain={1: 1.6, 5: 1.8, 6: 0.75, 7: 1.0}.get(n, 0.95)))
    return out
