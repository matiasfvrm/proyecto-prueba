"""Match each downloaded file to its Wikimedia Commons source by image similarity."""
import json, re, subprocess, time, urllib.parse, glob, io
import numpy as np
from PIL import Image
UA = "BurrowDocBot/1.0 (educational; matiasfvrm)"
def curl(u):
    for k in range(8):
        r = subprocess.run(["curl", "-sSfL", "--max-time", "60", "-A", UA, u], capture_output=True)
        if r.returncode == 0 and r.stdout: return r.stdout
        time.sleep(3 * (k + 1))
def api(**kw):
    kw.update(action="query", format="json")
    return json.loads(curl("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(kw)))
def sig(im): return np.asarray(im.convert("L").resize((16, 16), Image.BILINEAR), np.float32)
def meta(p):
    ii = p["imageinfo"][0]; md = ii.get("extmetadata", {})
    return {"title": p["title"], "license": md.get("LicenseShortName", {}).get("value", ""),
            "artist": re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()[:90],
            "src": ii.get("descriptionurl", "")}
SEARCH = {"burrow": "Joe Burrow", "lsu": "GA VS LSU E101318", "tiger": "Tiger Stadium LSU night",
          "ohio": "Ohio Stadium Columbus", "heisman": "Heisman Trophy"}
NAMED = {"sb_00.jpg": "Super Bowl LVI Flyover.jpg", "sb_01.jpg": "PBS lit up for the Superbowl (51859154407).jpg",
         "vid_draft.webm": "2021 NFL Draft (51173334206).webm", "vid_enter.webm": "University of Notre Dame Football entering the stadium.webm",
         "vid_fans.webm": "Football supporters.webm"}
used = json.load(open("media/used.json"))
out = {}
for tag, q in SEARCH.items():
    files = [u for u in used if u.split("/")[-1].startswith(tag + "_")]
    if not files: continue
    pages = list(api(generator="search", gsrsearch=q, gsrnamespace=6, gsrlimit=50, prop="imageinfo",
                     iiprop="url|extmetadata", iiurlwidth=160)["query"]["pages"].values())
    cands = []
    for p in pages:
        t = p["imageinfo"][0].get("thumburl")
        if not t: continue
        b = curl(t)
        if b:
            try: cands.append((sig(Image.open(io.BytesIO(b))), p))
            except Exception: pass
    for f in files:
        s = sig(Image.open(f))
        d, p = min(((np.abs(s - c).mean(), p) for c, p in cands), key=lambda x: x[0])
        out[f] = meta(p); out[f]["match"] = round(float(d), 2)
        print(f, p["title"], round(float(d), 2), flush=True)
for fn, title in NAMED.items():
    p = list(api(titles="File:" + title, prop="imageinfo", iiprop="url|extmetadata")["query"]["pages"].values())[0]
    out["media/raw/" + fn] = meta(p)
json.dump(out, open("media/credits.json", "w"), indent=1)
L = ["# Credits", "", "Narration: synthetic voice (Piper TTS, voice `en_US-ryan-high`).",
     "Music and sound effects: synthesized procedurally for this video (`make_music.py`, `make_sfx.py`).",
     "Fonts: Anton, Inter, Oswald (SIL Open Font License).", "", "## Images and video (Wikimedia Commons)", ""]
for f in used:
    m = out[f]
    L.append(f"- [{m['title'][5:]}]({m['src']}) by {m['artist'] or 'unknown'}, {m['license']}")
open("CREDITS.md", "w").write("\n".join(L) + "\n")
