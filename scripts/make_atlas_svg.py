#!/usr/bin/env python3
"""Draw the Carcinogen Exposure Atlas inset for the home page: a small globe
shaded by one of the atlas's own layers (outdoor fine particles, PM2.5, 2023).

Reads  exposure-atlas/geo/world.geojson and exposure-atlas/data/layers/pm25.json
       (the published copies in this repo)
Writes assets/atlas-map.svg (read by build_site.py like the two network insets)

Orthographic projection centred on Africa and Europe. Points on the far side of
the globe are pulled onto the horizon, which is close enough at inset size.
Re-run this script, then build_site.py, when the atlas map or layer changes.
"""
import json, math, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = os.path.join(HERE, "exposure-atlas", "geo", "world.geojson")
LAYER = os.path.join(HERE, "exposure-atlas", "data", "layers", "pm25.json")
OUT = os.path.join(HERE, "assets", "atlas-map.svg")

LON0, LAT0, R, C = 18.0, 18.0, 480.0, 500.0     # centre of view, radius and centre in SVG units
RAMP = ["#DCE2EB", "#B9C6D8", "#94A8C3", "#6E87A9", "#4A6389", "#2A4068"]   # the atlas's exposure ramp
NODATA, DISPUTED = "#ECEBE5", "#D6D4CC"

geo = json.load(open(GEO, encoding="utf-8"))
lay = json.load(open(LAYER, encoding="utf-8"))
cuts = lay["bins"] if isinstance(lay["bins"], list) else lay["bins"]["total"]


def value(iso):
    rows = [r for r in lay["data"].get(iso, {}).get("total", []) if r[1] is not None and r[0] <= 2023]
    return rows[-1][1] if rows else None


def colour(v):
    if v is None:
        return NODATA
    i = sum(1 for c in cuts if v >= c)
    return RAMP[min(len(RAMP) - 1, round(i * (len(RAMP) - 1) / len(cuts)))]


l0, p0 = math.radians(LON0), math.radians(LAT0)


def project(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    cosc = math.sin(p0) * math.sin(p) + math.cos(p0) * math.cos(p) * math.cos(l - l0)
    x = math.cos(p) * math.sin(l - l0)
    y = math.cos(p0) * math.sin(p) - math.sin(p0) * math.cos(p) * math.cos(l - l0)
    if cosc < 0:                                   # far side: onto the horizon
        n = math.hypot(x, y) or 1.0
        x, y = x / n, y / n
    return C + R * x, C - R * y, cosc >= 0


def simplify(pts, tol=3.0):
    """Douglas-Peucker in SVG units; enough detail for a picture about 150 px wide."""
    if len(pts) < 4:
        return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, idx = -1.0, None
        for i in range(a + 1, b):
            px, py = pts[i]
            dist = abs(dy * px - dx * py + bx * ay - by * ax) / L if L > 1e-9 else math.hypot(px - ax, py - ay)
            if dist > best:
                best, idx = dist, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [q for q, k in zip(pts, keep) if k]


def area(q):
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(q, q[1:] + q[:1]))) / 2


def rings(g):
    if not g:
        return []
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    return [ring for poly in polys for ring in poly[:1]]   # outer rings only at this size


paths = []
for f in geo["features"]:
    p = f["properties"]
    fill = DISPUTED if p.get("disputed") else colour(value(p["iso3"]))
    d = []
    for ring in rings(f["geometry"]):
        pts = [project(lon, lat) for lon, lat in ring]
        if not any(v for _, _, v in pts):
            continue
        out, last = [], None
        for x, y, _ in pts:
            q = (round(x), round(y))
            if q != last:
                out.append(q)
                last = q
        out = simplify(out)
        if len(out) >= 3 and area(out) >= 40:
            d.append("M" + "L".join("%d %d" % q for q in out) + "Z")
    if d:
        paths.append('<path fill="%s" d="%s"/>' % (fill, "".join(d)))

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" '
       'aria-label="Globe shaded by outdoor fine-particle pollution, from the Carcinogen Exposure Atlas">'
       '<circle cx="500" cy="500" r="480" fill="#F5F4F0" stroke="#8C8B83" stroke-width="3"/>'
       '<g stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round">' + "".join(paths) + '</g></svg>')
open(OUT, "w", encoding="utf-8").write(svg)
print("atlas-map.svg: %d shapes, %.0f KB" % (len(paths), os.path.getsize(OUT) / 1024))
