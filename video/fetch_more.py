"""Fetch more Commons media in parallel, with license metadata, into media/raw2/."""
import json, subprocess, time, urllib.parse, re, os, sys
from concurrent.futures import ThreadPoolExecutor
UA = "BurrowDocBot/1.0 (educational; matiasfvrm)"
def curl(u, out=None, tries=7):
    for k in range(tries):
        a = ["curl", "-sSfL", "--max-time", "240", "-A", UA, u] + (["-o", out] if out else [])
        r = subprocess.run(a, capture_output=True)
        if r.returncode == 0 and (out or r.stdout[:1] == b"{"): return r.stdout if not out else True
        time.sleep(2 * (k + 1))
def search(q, n):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json",
        "generator": "search", "gsrsearch": q, "gsrnamespace": 6, "gsrlimit": n, "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1280})
    d = curl(u); 
    return sorted(json.loads(d).get("query", {}).get("pages", {}).values(), key=lambda p: p["index"]) if d else []
Q = json.load(open(sys.argv[1]))
os.makedirs("media/raw2", exist_ok=True)
cr = json.load(open("media/credits2.json")) if os.path.exists("media/credits2.json") else {}
jobs = []
for tag, q, n, kind in Q:
    k = 0
    for p in search(q, 50):
        if k >= n: break
        ii = p["imageinfo"][0]; mime = ii["mime"]
        if kind == "image" and (mime not in ("image/jpeg", "image/png") or ii["width"] < 1000): continue
        if kind == "video" and not mime.startswith(("video", "application/ogg")): continue
        if kind == "video" and ii.get("duration", 0) and ii["duration"] > 900: continue
        md = ii.get("extmetadata", {})
        title = p["title"][5:]
        if kind == "image":
            url, fn = ii.get("thumburl"), f"media/raw2/{tag}_{k:02d}.jpg"
        else:
            n_ = title.replace(" ", "_"); import hashlib; h = hashlib.md5(n_.encode()).hexdigest(); e = urllib.parse.quote(n_)
            url, fn = f"https://upload.wikimedia.org/wikipedia/commons/transcoded/{h[0]}/{h[:2]}/{e}/{e}.720p.vp9.webm", f"media/raw2/{tag}_{k:02d}.webm"
        cr[fn] = {"title": p["title"], "license": md.get("LicenseShortName", {}).get("value", ""),
                  "artist": re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()[:90],
                  "src": ii.get("descriptionurl", ""), "desc": re.sub("<[^>]+>", "", md.get("ImageDescription", {}).get("value", ""))[:200]}
        jobs.append((url, fn)); k += 1
json.dump(cr, open("media/credits2.json", "w"), indent=1)
print("jobs", len(jobs), flush=True)
def dl(j):
    url, fn = j
    if os.path.exists(fn) and os.path.getsize(fn) > 5000: return
    ok = curl(url, fn)
    if not ok or os.path.getsize(fn) < 5000:
        if os.path.exists(fn): os.remove(fn)
        print("FAIL", fn, flush=True)
with ThreadPoolExecutor(4) as ex: list(ex.map(dl, jobs))
print("done", len(os.listdir("media/raw2")))
