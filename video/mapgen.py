"""Journey map: US states (us-atlas, Albers USA pre-projected) + projected city points."""
import json, math
import numpy as np
from PIL import Image, ImageDraw
T = json.load(open(__import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "doc/map/package/states-albers-10m.json")))
ARCS = []
tx = T.get("transform")
for arc in T["arcs"]:
    pts, x, y = [], 0, 0
    for p in arc:
        if tx: x += p[0]; y += p[1]; pts.append((x * tx["scale"][0] + tx["translate"][0], y * tx["scale"][1] + tx["translate"][1]))
        else: pts.append(tuple(p))
    ARCS.append(pts)
def ring(idx):
    out = []
    for i in idx:
        a = ARCS[i] if i >= 0 else ARCS[~i][::-1]
        out += a if not out else a[1:]
    return out
STATES = {}
for g in T["objects"]["states"]["geometries"]:
    polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]
    STATES[g["properties"]["name"]] = [[ring(r) for r in poly] for poly in polys]

def albers_usa(lon, lat):
    """d3.geoAlbersUsa().scale(1300).translate([487.5,305]) for the lower 48."""
    rad = math.pi / 180
    p0, p1 = 29.5 * rad, 45.5 * rad
    n = (math.sin(p0) + math.sin(p1)) / 2
    c = 1 + math.sin(p0) * (2 * n - math.sin(p0))
    r0 = math.sqrt(c) / n
    def raw(l, p):
        r = math.sqrt(c - 2 * n * math.sin(p)) / n
        return r * math.sin(l * n), r0 - r * math.cos(l * n)
    lam = (lon + 96) * rad; phi = lat * rad
    x, y = raw(lam, phi)
    # d3 center([-0.6, 38.7]) after rotate([96,0])
    cx, cy = raw(-0.6 * rad, 38.7 * rad)
    k = 1300
    return 487.5 + (x - cx) * k, 305 - (y - cy) * k

CITIES = {"ATHENS, OH": (-82.1013, 39.3292), "COLUMBUS, OH": (-83.0007, 39.9612),
          "BATON ROUGE, LA": (-91.1403, 30.4515), "CINCINNATI, OH": (-84.512, 39.1031)}

def base_map(W, H, view, hi=("Ohio", "Louisiana")):
    """Render states inside view=(x0,y0,x1,y1) in Albers px space; returns RGB float array and a px mapper."""
    x0, y0, x1, y1 = view; sx, sy = W / (x1 - x0), H / (y1 - y0); s = min(sx, sy)
    ox, oy = (W - (x1 - x0) * s) / 2 - x0 * s, (H - (y1 - y0) * s) / 2 - y0 * s
    m = lambda p: (p[0] * s + ox, p[1] * s + oy)
    im = Image.new("RGB", (W, H), (10, 11, 14)); d = ImageDraw.Draw(im)
    for name, polys in STATES.items():
        fillc = (34, 36, 42) if name not in hi else (52, 40, 34)
        for poly in polys:
            d.polygon([m(p) for p in poly[0]], fill=fillc)
    for name, polys in STATES.items():
        for poly in polys:
            for r in poly:
                d.line([m(p) for p in r] + [m(r[0])], fill=(70, 74, 84) if name not in hi else (150, 95, 60), width=max(1, int(W / 900)))
    return np.asarray(im, np.float32) / 255, m

if __name__ == "__main__":
    from shapely.geometry import Point, Polygon
    for c, (lon, lat) in CITIES.items():
        p = albers_usa(lon, lat); st = c.split(", ")[1]
        name = {"OH": "Ohio", "LA": "Louisiana"}[st]
        inside = any(Polygon(poly[0]).contains(Point(p)) for poly in STATES[name])
        print(c, [round(v, 1) for v in p], "inside", name, inside)
    a, m = base_map(1920, 1080, (430, 180, 900, 560))
    Image.fromarray(np.uint8(a * 255)).save("/tmp/claude-0/-home-user-proyecto-prueba/1107b7b9-3ce4-5542-b88b-85fbda77bfa7/scratchpad/map_test.jpg")
