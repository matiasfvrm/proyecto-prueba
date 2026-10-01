"""Edit decision list v3: calmer cinematic cut, beat-locked montage, scene-aware sound design."""
import json, os, re

OFF = 1.0
DUR = 91.0
R1, R2, FX = "media/raw/", "media/raw2/", "media/sfx2/cut/"
MUS = "media/music/"

T = json.load(open("audio/timings.json"))
WORDS = json.load(open("audio/words.json"))
def L(i): return T[i]["start"] + OFF
def E(i): return T[i]["end"] + OFF
def lw(i): return [w for w in WORDS if w["line"] == i]
def WS(i, k): return lw(i)[k]["start"] + OFF

# --- score: "Impact Prelude" sections, montage locked to its beat grid
IP = MUS + "Impact_Prelude.mp3"
IP_CLIMAX = 140.69                          # downbeat that lands on the start of the montage
IP_BEATS = [140.69, 141.25, 141.8, 142.38, 142.94, 143.5, 144.06, 144.61, 145.19, 145.75, 146.33, 147.05,
            147.63, 148.19, 148.77, 149.33, 149.88, 150.44, 151.0, 151.58, 152.14, 152.69, 153.25, 153.83,
            154.39, 154.95, 155.53, 156.06, 156.62, 157.18, 157.76, 158.31, 158.8, 159.27, 159.82, 160.38,
            160.96, 161.52, 162.08]
IP_FINAL_CHORD = 190.57
# beats of the final section (source time) used to lock the rewind recap
REWIND_BEATS = [181.553, 182.133, 182.691, 183.248, 183.828, 184.386, 184.92, 185.5, 186.057, 186.615, 187.195]
M0 = L(10)
BEATS = [M0 + (b - IP_CLIMAX) for b in IP_BEATS]
def snap(t): return min(BEATS, key=lambda b: abs(b - t))

KEYWORDS = {"overlooked", "lost", "injuries", "prove", "superstar", "easily", "lose", "heisman", "champion",
            "injured", "fight", "finished", "doubted", "himself", "extraordinary", "next"}

HIT = json.load(open(FX + "hitpoints.json"))

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
        """Place a sound so its hit point lands on t (at='hit') or so it starts at t (at='start')."""
        start = t - (HIT.get(name, 0) if at == "hit" else 0)
        sfx.append(dict(t=start, file=FX + name + ".wav", gain=gain, pan=pan, **kw))

    # ---- media
    JB = lambda n: R2 + f"jb_{n:02d}.jpg"
    portrait, portrait2 = R1 + "burrow_02.jpg", R1 + "burrow_06.jpg"
    qb_pose, running, on_cart = JB(4), JB(35), JB(10)
    action1, action2, action3 = JB(36), JB(37), JB(9)
    hurt = [JB(12), JB(11), JB(13), JB(24), JB(19), JB(27), JB(21), JB(31)]
    sb_fly, pbs_sb = R1 + "sb_00.jpg", R1 + "sb_01.jpg"
    heisman, tiger = R1 + "heisman_02.jpg", R1 + "tiger_00.jpg"
    lsu_crowd, lsu_crowd2, lsu_band = R1 + "lsu_13.jpg", R1 + "lsu_11.jpg", R1 + "lsu_02.jpg"
    lsu_helmet, lsu_champs = R2 + "lsu19_00.jpg", R2 + "lsu19_13.jpg"
    ohio_air = R1 + "ohio_00.jpg"
    OSU = lambda n: R2 + f"osu_{n:02d}.jpg"
    BG = lambda n: R2 + f"bengals_{n:02d}.jpg"
    superdome, helmet_ball = R2 + "superdome_02.jpg", R2 + "helmet_04.jpg"
    sofi_sunset, sofi_in = R2 + "sofi_05.jpg", R2 + "sofi_04.jpg"
    vintage = R2 + "qb_03.jpg"
    pbs_night = R2 + "pbs_00.jpg"
    v_draft, v_enter, v_fans = R1 + "vid_draft.webm", R1 + "vid_enter.webm", R1 + "vid_fans.webm"
    v_game, v_wsu = R2 + "vfb_06.webm", R2 + "vfb_08.webm"

    # ================= INTRO =================
    fx(0.0, "room_tone_dark", 0.22, at="start", dur=38.5)
    shot(0.0, L(1) - 0.1, qb_pose, z=(1.0, 1.08), focus=(0.5, 0.36), look="warm", par=1.0)
    ov(1.2, L(1) - 0.15, "counter", value=275_000_000, fmt="${:,}", sub="5 YEARS  ·  CINCINNATI BENGALS  ·  2023")
    fx(1.2, "impact_intro", 0.5); fx(0.2, "crowd_stadium_joy", 0.1, at="start", dur=3.8)
    # the other side
    t1 = WS(1, 5)
    shot(L(1) - 0.1, t1, v_wsu, kind="clip", ss=36, speed=0.6, cz=1.35, cy=0.3, look="muted")
    tr(L(1) - 0.1, "cross", 0.6); fx(L(1) - 0.1, "whoosh_air_deep", 0.2)
    shot(t1, L(2) - 0.1, on_cart, z=(1.04, 1.12), focus=(0.5, 0.36), look="cold", par=1.0)
    tr(t1, "cross", 0.5)
    # split-screen triad, panels fade up one per line
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
    # prove it
    c5 = [sp_end, WS(5, 7), WS(5, 12), E(5) + 0.4]
    shot(c5[0], c5[1], action1, z=(1.0, 1.08), look="teal", par=1.0, pan=1)
    tr(c5[0], "zoom", 0.5); fx(c5[0], "whoosh_cine_fast", 0.35)
    shot(c5[1], c5[2], v_game, kind="clip", ss=137.5, speed=0.5, cz=1.4, cy=0.35, look="teal")
    tr(c5[1], "cross", 0.35)
    shot(c5[2], c5[3], action2, z=(1.02, 1.1), look="teal", par=1.0, pan=-1)
    ov(WS(5, -3), c5[3] - 0.05, "title", text="THE HIGHEST LEVEL", size=140, y=0.45, line=True, dim=0.25, hide_subs=True)
    fx(WS(5, -3), "impact_trailer_epic", 0.4)

    # ================= WHY =================
    t0 = c5[3]
    shot(t0, WS(6, 9), portrait, z=(1.0, 1.06), focus=(0.5, 0.33), look="warm", par=1.0)
    tr(t0, "leak", 0.8, v=0); fx(t0 - 0.3, "whoosh_tunnel", 0.22, at="start")
    ov(WS(6, 2), WS(6, 9), "title", text="JOE BURROW", size=250, y=0.5, mode="diff", line=True, track=18)
    fx(WS(6, 2), "impact_epic", 0.45)
    shot(WS(6, 9), L(7) - 0.1, OSU(0), z=(1.08, 1.0), look="teal", focus=(0.5, 0.55), par=0.8)
    tr(WS(6, 9), "cross", 0.6)
    fx(WS(6, 9), "crowd_sports_ambient", 0.12, at="start", dur=7.0)
    shot(L(7) - 0.1, WS(7, 7), v_enter, kind="clip", ss=6, speed=0.55, look="muted")
    tr(L(7) - 0.1, "cross", 0.6)
    shot(WS(7, 7), L(8) - 0.1, hurt[1], z=(1.0, 1.06), look="bw", focus=(0.5, 0.4), par=0.9)
    tr(WS(7, 7), "dip", 0.4)
    ov(WS(7, 7), L(8) - 0.1, "dust", amt=0.35)
    c8 = [L(8) - 0.1, WS(8, 5), WS(8, 9), WS(8, 12), E(8) + 0.2]
    plan8 = [(pbs_sb, "photo", "cold"), (lsu_crowd2, "photo", "muted"), (v_wsu, "clip", "teal"), (sofi_in, "photo", "cold")]
    for k, (src, kind, look) in enumerate(plan8):
        if kind == "clip": shot(c8[k], c8[k + 1], src, kind="clip", ss=150, speed=0.7, cz=1.3, cy=0.2, look=look)
        else: shot(c8[k], c8[k + 1], src, z=(1.0, 1.06) if k % 2 == 0 else (1.06, 1.0), look=look, par=0.8)
        tr(c8[k], "cross" if k else "zoom", 0.45 if k else 0.5)
    fx(c8[0], "whoosh_air_fast", 0.25); fx(c8[2], "crowd_cheer_victory", 0.22)
    fx(L(8), "heartbeat_slow", 0.3, at="start", dur=8.0)
    # black card
    shot(E(8) + 0.2, M0, None, kind="black")
    tr(E(8) + 0.2, "dip", 0.5)
    ov(L(9) - 0.1, M0 - 0.2, "text", text="IT'S WHAT YOU DO AFTER YOU LOSE.", size=50, weight="x", typing=1.0, track=8)
    fx(L(9) + 0.2, "heartbeat_impact", 0.5); fx(L(9) + 1.2, "heartbeat_impact", 0.45)
    fx(M0, "riser_trailer", 0.55)

    # ================= MONTAGE (beat-locked) =================
    acc.append(dict(t=M0, type="white", d=0.35, amt=0.7))
    fx(M0, "impact_big", 0.75); fx(M0, "crowd_stadium_joy", 0.18, at="start", dur=6)
    steps = ["OHIO ST", "LSU", "HEISMAN", "CHAMPION", "#1 PICK", "INJURY", "SUPER BOWL", "FIGHT"]
    M = [  # line, media list, year, label, stat, step transition
        (10, [ohio_air, OSU(13), OSU(2), OSU(8)], "2015–2017", "OHIO STATE", "BACKUP QB  ·  0 STARTS", None),
        (11, [tiger, lsu_band, lsu_crowd], "MAY 2018", "TRANSFERS TO LSU", "A FRESH START", "zoom"),
        (12, [heisman], "DEC 2019", "HEISMAN TROPHY", "60 TD  ·  5,671 YDS  ·  6 INT", "leak"),
        (13, [superdome, lsu_helmet, lsu_champs], "JAN 2020", "NATIONAL CHAMPION", "15–0  ·  PERFECT SEASON", "flash"),
        (14, ["DRAFT", helmet_ball], "APR 2020", "#1 OVERALL PICK", "CINCINNATI BENGALS", "zoom"),
        (15, [hurt[2], hurt[3]], "NOV 2020", "INJURED ROOKIE", "TORN ACL + MCL", "dip"),
        (16, [sofi_sunset, sb_fly, pbs_sb], "FEB 2022", "SUPER BOWL LVI", None, "flash"),
    ]
    for n, (li, imgs, yr, lab, stat, ttype) in enumerate(M):
        a = M0 if n == 0 else snap(L(li) - 0.05)
        b = snap(L(li + 1) - 0.05)
        cuts = [a] + [snap(a + (b - a) * k / len(imgs)) for k in range(1, len(imgs))] + [b]
        for k, src in enumerate(imgs):
            look = "duo" if li == 15 else ("bw" if (li == 10 and k == 0) else "teal")
            if src == "DRAFT":
                shot(cuts[k], cuts[k + 1], v_draft, kind="clip", ss=8, speed=0.8, look="teal")
            else:
                foc = (0.34, 0.44) if src == lsu_helmet else ((0.5, 0.8) if src == sb_fly else (0.5, 0.45))
                zz = (1.5, 1.42) if src == lsu_helmet else ((1.0, 1.07) if (n + k) % 2 == 0 else (1.07, 1.0))
                shot(cuts[k], cuts[k + 1], src, z=zz, focus=foc, look=look, par=1.0, pan=(-1) ** (n + k))
            if k == 0 and ttype:
                tr(cuts[k], ttype, {"zoom": 0.45, "leak": 0.6, "flash": 0.25, "dip": 0.35}[ttype])
                fx(cuts[k], "whoosh_fast", 0.18); fx(cuts[k], "drum_bass_hit", 0.3)
        ov(a + 0.05, b, "tag", year=yr, label=lab, stat=stat)
        ov(a, b, "timeline", steps=steps, n=n)
        if li == 12:
            ov(L(12) - 0.05, b, "title", text="2019", size=360, mode="diff", y=0.42, dim=0.15)
            fx(L(12), "crowd_cheer_victory", 0.25)
        if li == 13: fx(L(13), "crowd_stadium_joy", 0.2, at="start", dur=3)
        if li == 14:
            fx(L(14) - 0.1, "reporters_flashes", 0.3, at="start", dur=3.0)
            for k in range(3): fx(L(14) + 0.35 * k, "shutter_nikon", 0.2, pan=(-0.4, 0.3, 0.0)[k])
        if li == 15:
            ov(L(15) + 0.3, b, "stamp", text="SEASON OVER", size=104, x=0.63, y=0.42, rot=-7)
            fx(L(15) + 0.3, "slowmo_impact", 0.55); fx(L(15) + 0.3, "heartbeat_impact", 0.35)
        if li == 16:
            ov(L(16) + 0.3, b, "score", a="RAMS", sa=23, b="BENGALS", sb=20, sub="SUPER BOWL LVI  ·  FEB 13, 2022")
            fx(L(16), "crowd_yell_stadium", 0.2)
    # back into the fight
    a = snap(L(17) - 0.05); b = E(17) + 0.55; v1 = snap(WS(17, 3)); mid = snap(v1 + 0.6)
    shot(a, v1, action1, z=(1.05, 1.12), look="teal", par=1.0, pan=1)
    shot(v1, mid, vintage, z=(1.0, 1.05), look="bw", par=0.6)
    shot(mid, b, action2, z=(1.08, 1.16), look="teal", par=1.0, pan=-1, kick=10)
    tr(a, "zoom", 0.45); fx(a, "whoosh_cine_fast", 0.3)
    ov(WS(17, 3), b, "title", text="BACK INTO THE FIGHT", size=180, style="slam", dim=0.3, hide_subs=True)
    acc.append(dict(t=WS(17, 3), type="white", d=0.2, amt=0.5))
    fx(WS(17, 3), "impact_trailer_epic", 0.65); fx(WS(17, 3), "crowd_chant_stadium", 0.22, at="start", dur=3.5)
    ov(a, b, "timeline", steps=steps, n=7)
    fx(b, "impact_big", 0.7); acc.append(dict(t=b, type="white", d=0.4, amt=0.6))

    # ================= OUTRO =================
    shot(b, L(19) - 0.1, pbs_night, z=(1.0, 1.06), look="cold", par=0.8)
    tr(b, "dip", 0.8)
    fx(b + 0.3, "wind_hum_cine", 0.16, at="start", dur=14.0)
    shot(L(19) - 0.1, L(20) - 0.1, running, z=(1.0, 1.08), focus=(0.5, 0.3), look="teal", par=1.0, pan=1)
    tr(L(19) - 0.1, "cross", 0.6)
    shot(L(20) - 0.1, L(21) - 0.1, qb_pose, z=(1.04, 1.12), focus=(0.5, 0.3), look="warm", par=1.0)
    tr(L(20) - 0.1, "leak", 0.7, v=1)
    ov(WS(20, 5), L(21) - 0.15, "title", text="SOMETHING LEFT TO PROVE", size=130, y=0.47, line=True, dim=0.2)
    fx(WS(20, 5), "impact_cool", 0.4)
    shot(L(21) - 0.1, L(22) - 0.1, v_fans, kind="clip", ss=12, speed=0.6, look="bw")
    tr(L(21) - 0.1, "cross", 0.45)
    c22 = [L(22) - 0.1, WS(22, 4), WS(22, 6), L(23) - 0.1]
    for k, src in enumerate([hurt[4], hurt[5], hurt[6]]):
        shot(c22[k], c22[k + 1], src, z=(1.0, 1.05), look="bw", par=0.8)
        tr(c22[k], "cross", 0.35); fx(c22[k], "shutter_classic", 0.18)
    ov(L(21) - 0.1, L(23) - 0.1, "dust", amt=0.35)
    shot(L(23) - 0.1, L(24) - 0.1, portrait, z=(1.08, 1.2), focus=(0.5, 0.33), look="warm", par=1.2)
    tr(L(23) - 0.1, "leak", 0.7, v=2); fx(L(23) - 0.1, "impact_whoosh_deep", 0.4)
    # the journey: tape-rewind recap, cuts locked to the score (beats, then half-beats), reverse chronology
    fx(L(24) - 0.15, "tape_rewind", 0.4, at="start")
    t, end = L(24) - 0.1, L(25) - 0.1
    src0 = IP_FINAL_CHORD - (E(25) + 0.6 - t)
    RB = [t + (b - src0) for b in REWIND_BEATS]           # score beats in video time
    cuts = [t] + RB[:5] + [x for i in range(4, 9) for x in (RB[i] + (RB[i + 1] - RB[i]) / 2, RB[i + 1])]
    recap = [(pbs_sb, "2022"), (sofi_sunset, "2022"), (sb_fly, "2022"), (hurt[7], "2020"), (hurt[2], "2020"),
             (helmet_ball, "2020"), (superdome, "2020"), (lsu_crowd, "2019"), (heisman, "2019"),
             (lsu_crowd2, "2019"), (tiger, "2018"), (lsu_band, "2018"), (OSU(13), "2017"), (OSU(2), "2016"),
             (ohio_air, "2015")]
    for k, (src, yr) in enumerate(recap):
        a_, b_ = cuts[k], cuts[k + 1]
        shot(a_, b_, src, z=(1.08, 1.0), look="bw" if k % 2 else "teal", par=0.6)
        if k: fx(a_, "shutter_nikon", 0.16, pan=0.3 * (-1) ** k)
        ov(a_, b_, "rewind_year", year=yr, first=(k == 0))
    ov(cuts[0], cuts[-1], "vhs")
    t = cuts[-1]
    shot(t, end, qb_pose, z=(1.0, 1.05), focus=(0.5, 0.35), look="warm", par=1.0)
    tr(t, "zoom", 0.45); fx(t, "impact_epic", 0.5)
    ov(t, end - 0.05, "title", text="EXTRAORDINARY", size=160, mode="diff", y=0.45, track=10, hide_subs=True)
    shot(end, E(25) + 0.6, portrait2, z=(1.04, 1.14), focus=(0.5, 0.33), look="cold", par=1.0)
    tr(end, "cross", 0.7)
    tail = E(25) + 0.6
    shot(tail, DUR, None, kind="black")
    tr(tail, "glitch", 0.25)
    fx(tail, "impact_trailer_epic", 0.75); fx(tail, "glitch_cine", 0.25)
    ov(tail, DUR - 0.2, "title", text="WHAT COMES NEXT?", size=160, style="slam", y=0.46)
    ov(tail + 0.9, DUR - 0.2, "text", text="JOE BURROW", size=30, y=0.6, track=16, weight="x")

    shots.sort(key=lambda s: s["t0"])
    for x in trans:
        x["a"] = max((s for s in shots if s["t0"] < x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[0])
        x["b"] = min((s for s in shots if s["t0"] >= x["t"] - 1e-4), key=lambda s: s["t0"], default=shots[-1])

    # subtitles
    subs, cur = [], []
    def flush():
        if cur:
            subs.append(dict(t0=cur[0]["t0"] - 0.06, t1=cur[-1]["t1"] + 0.15, words=list(cur),
                             y=0.68 if 10 <= cur[0]["line"] <= 17 else 0.79))
            cur.clear()
    for w in WORDS:
        if w["line"] == 9: flush(); continue
        word = re.sub(r"[.…,]+$", "", w["w"]).upper().replace("...", "")
        cur.append(dict(w=word, t0=w["start"] + OFF, t1=w["end"] + OFF, line=w["line"],
                        key=re.sub(r"[^a-z]", "", w["w"].lower()) in KEYWORDS))
        if re.search(r"[.,…]$", w["w"]) or len(cur) >= 3 or len("".join(c["w"] for c in cur)) > 15: flush()
    flush()
    for i in range(len(subs) - 1): subs[i]["t1"] = min(subs[i]["t1"], subs[i + 1]["t0"])
    return dict(shots=shots, trans=trans, overlays=ovl, subs=subs, accents=acc, sfx=sfx)

def music_plan():
    b_end = T[17]["end"] + OFF + 0.55
    tail = T[25]["end"] + OFF + 0.6
    d0 = L(24) - 0.1
    return [
        dict(file=IP, src=0.0, dst0=0.0, dst1=L(9) + 0.6, fin=2.0, fout=1.8, gain=0.9),
        dict(file=IP, src=IP_CLIMAX, dst0=M0, dst1=b_end, fin=0.01, fout=0.5, gain=1.0),
        dict(file=MUS + "mkm_686.mp3", src=1.695, dst0=M0 - 0.041, dst1=b_end, fin=0.01, fout=0.4, gain=0.55, tempo=0.75),
        dict(file=IP, src=50.0, dst0=b_end + 0.4, dst1=d0 + 0.8, fin=1.5, fout=1.5, gain=0.95),
        dict(file=IP, src=IP_FINAL_CHORD - (tail - d0), dst0=d0, dst1=DUR, fin=1.2, fout=1.0, gain=1.0),
    ]
