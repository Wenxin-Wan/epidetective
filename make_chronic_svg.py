#!/usr/bin/env python3
"""Render the chronic-disease evidence graph to a static SVG thumbnail.

The companion to make_network_svg.py. That one bakes the cancer explorer's
free-floating layout; this one bakes the chronic explorer's *clustered* layout,
because the clustering is what distinguishes the second tool at a glance —
risk factors gathered into their category on an outer ring, diseases into their
body system on an inner one, with a shaded blob behind each cluster.

Deterministic: seeded, so re-running gives the identical layout.

Run:  python3 make_chronic_svg.py   ->  assets/chronic-network.svg
"""
import json
import math
import random

SEED = 11
random.seed(SEED)

R_INNER, R_OUTER = 250.0, 580.0

GRADE_HEX = {"Convincing": "#A33526", "Probable": "#B96B2E", "Suggestive": "#B39537",
             "Limited": "#8C9A8E", "Contested": "#6E5F99"}
SYS_HEX = {"Cardiovascular": "#A85440", "Metabolic": "#B9762F", "Renal": "#55779E",
           "Respiratory": "#4A8074", "Neurological & mental": "#6E5F99",
           "Musculoskeletal": "#837551", "Cancer": "#1F5B55", "Digestive": "#688A50",
           "Sensory": "#8F6491"}
CAT_HEX = {"Tobacco": "#835446", "Alcohol": "#A33526", "Metabolic": "#B9762F",
           "Diet": "#688A50", "Physical activity": "#4A8074",
           "Sleep & circadian": "#55779E", "Environment": "#68855A",
           "Occupational": "#67739E", "Psychosocial": "#8F6491", "Infection": "#4A8074",
           "Reproductive & hormonal": "#A96C90", "Medicines": "#6E5F99",
           "Clinical": "#5A6B68"}

with open("chronic-graph.json", encoding="utf-8") as fh:
    G = json.load(fh)
nodes, links = G["nodes"], G["links"]


# --- groups: systems on an inner ring, categories on an outer one -----------
sys_keys = sorted({n["g"] for n in nodes if n["t"] == "d"})
cat_keys = sorted({n["g"] for n in nodes if n["t"] == "r"})

groups = {}
for i, s in enumerate(sys_keys):
    a = i / len(sys_keys) * math.tau - math.pi / 2
    groups["d|" + s] = {"ang": a, "ax": math.cos(a) * R_INNER, "ay": math.sin(a) * R_INNER,
                        "hex": SYS_HEX.get(s, "#5A6B68"), "members": []}

# Order the categories by the circular mean angle of the systems they link to,
# so a category sits beside the diseases it actually explains. Alphabetical
# ordering sends every edge straight across the middle.
acc = {c: [0.0, 0.0] for c in cat_keys}
for l in links:
    a = groups["d|" + nodes[l["t"]]["g"]]["ang"]
    v = acc[nodes[l["s"]]["g"]]
    v[0] += math.cos(a)
    v[1] += math.sin(a)
ordered = sorted(cat_keys, key=lambda c: math.atan2(acc[c][1], acc[c][0]))
for i, c in enumerate(ordered):
    a = i / len(ordered) * math.tau - math.pi / 2
    groups["r|" + c] = {"ang": a, "ax": math.cos(a) * R_OUTER, "ay": math.sin(a) * R_OUTER,
                        "hex": CAT_HEX.get(c, "#B9762F"), "members": []}

deg = [0] * len(nodes)
for l in links:
    deg[l["s"]] += 1
    deg[l["t"]] += 1

P = []
for i, n in enumerate(nodes):
    gk = n["t"] + "|" + n["g"]
    g = groups[gk]
    a, d = random.random() * math.tau, 20 + random.random() * 60
    P.append({"x": g["ax"] + math.cos(a) * d, "y": g["ay"] + math.sin(a) * d,
              "vx": 0.0, "vy": 0.0, "g": gk, "t": n["t"], "deg": deg[i],
              "R": (7 + min(11, deg[i] * 0.26)) if n["t"] == "d"
                   else (5 + min(9, deg[i] * 0.34))})
    g["members"].append(i)

E = [(P[l["s"]], P[l["t"]], l) for l in links]

# --- settle. Same force constants as the live simulation, so the thumbnail is
#     the layout a visitor actually lands on rather than a lookalike.
REP, SPRING, ANCHOR, DAMP = 4200.0, 0.009, 0.020, 0.82
for _ in range(700):
    for i in range(len(P)):
        p = P[i]
        for j in range(i + 1, len(P)):
            q = P[j]
            dx, dy = p["x"] - q["x"], p["y"] - q["y"]
            d2 = dx * dx + dy * dy
            if d2 > 420000:
                continue
            if d2 < 0.5:
                d2 = 0.5
            d = math.sqrt(d2)
            f = REP / d2
            mind = p["R"] + q["R"] + 5
            if d < mind:
                f += (mind - d) * 0.34
            fx, fy = f * dx / d, f * dy / d
            p["vx"] += fx; p["vy"] += fy
            q["vx"] -= fx; q["vy"] -= fy
    for a, b, l in E:
        dx, dy = b["x"] - a["x"], b["y"] - a["y"]
        d = math.hypot(dx, dy) + 0.01
        rest = 78 + (100 - min(100.0, l["e"])) * 0.85
        k = (d - rest) * SPRING
        fx, fy = k * dx / d, k * dy / d
        a["vx"] += fx; a["vy"] += fy
        b["vx"] -= fx; b["vy"] -= fy
    for p in P:
        g = groups[p["g"]]
        p["vx"] += (g["ax"] - p["x"]) * ANCHOR
        p["vy"] += (g["ay"] - p["y"]) * ANCHOR
        p["x"] += max(-30, min(30, p["vx"]))
        p["y"] += max(-30, min(30, p["vy"]))
        p["vx"] *= DAMP
        p["vy"] *= DAMP


def hull(pts, pad):
    """Monotone-chain convex hull, pushed outward — the cluster blob."""
    if len(pts) < 3:
        return None
    pts = sorted(pts)
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo = []
    for q in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], q) <= 0:
            lo.pop()
        lo.append(q)
    up = []
    for q in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], q) <= 0:
            up.pop()
        up.append(q)
    h = lo[:-1] + up[:-1]
    if len(h) < 3:
        return None
    cx = sum(p[0] for p in h) / len(h)
    cy = sum(p[1] for p in h) / len(h)
    out = []
    for x, y in h:
        dx, dy = x - cx, y - cy
        d = math.hypot(dx, dy) or 1
        out.append((x + dx / d * pad, y + dy / d * pad))
    return out


def smooth_path(pl, k):
    """Closed quadratic path through the midpoints — same curve the canvas draws."""
    n = len(pl)
    def X(i): return round(pl[i % n][0] * k[0] + k[2], 1)
    def Y(i): return round(pl[i % n][1] * k[1] + k[3], 1)
    def MX(i): return round((pl[i % n][0] + pl[(i + 1) % n][0]) / 2 * k[0] + k[2], 1)
    def MY(i): return round((pl[i % n][1] + pl[(i + 1) % n][1]) / 2 * k[1] + k[3], 1)
    d = ["M %s %s" % (round((pl[n - 1][0] + pl[0][0]) / 2 * k[0] + k[2], 1),
                      round((pl[n - 1][1] + pl[0][1]) / 2 * k[1] + k[3], 1))]
    for i in range(n):
        d.append("Q %s %s %s %s" % (X(i), Y(i), MX(i), MY(i)))
    d.append("Z")
    return " ".join(d)


# --- fit to a 16:10 frame, matching the card's aspect-ratio ------------------
W, H, PAD = 1600, 1000, 34
xs = [p["x"] for p in P]
ys = [p["y"] for p in P]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
k = min(W / (x1 - x0 + 90), H / (y1 - y0 + 90))
dx = W / 2 - (x0 + x1) / 2 * k
dy = H / 2 - (y0 + y1) / 2 * k
KK = (k, k, dx, dy)
for p in P:
    p["sx"] = round(p["x"] * k + dx, 1)
    p["sy"] = round(p["y"] * k + dy, 1)

spread_x = max(p["sx"] for p in P) - min(p["sx"] for p in P)
spread_y = max(p["sy"] for p in P) - min(p["sy"] for p in P)
assert spread_x > W * 0.5 and spread_y > H * 0.5, \
    "layout collapsed (spread %.0fx%.0f)" % (spread_x, spread_y)

# The viewBox hugs the content: as a background-size:cover image, empty margin
# is scaled up along with everything else and only makes the graph smaller.
vx0 = min(p["sx"] - p["R"] * k for p in P) - PAD
vy0 = min(p["sy"] - p["R"] * k for p in P) - PAD
vw = max(p["sx"] + p["R"] * k for p in P) + PAD - vx0
vh = max(p["sy"] + p["R"] * k for p in P) + PAD - vy0
out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" '
       'width="%.0f" height="%.0f" '
       'role="img" aria-label="Clustered network of 359 graded links between 95 risk '
       'factors and 31 chronic diseases">' % (vx0, vy0, vw, vh, vw, vh)]

# cluster blobs
for gk, g in groups.items():
    pts = [(P[i]["x"], P[i]["y"]) for i in g["members"]]
    if len(pts) == 1:
        out.append('<circle cx="%s" cy="%s" r="%s" fill="%s" opacity=".13"/>'
                   % (round(pts[0][0] * k + dx, 1), round(pts[0][1] * k + dy, 1),
                      round(34 * k, 1), g["hex"]))
        continue
    h = hull(pts, 30)
    if h:
        out.append('<path d="%s" fill="%s" opacity=".13"/>' % (smooth_path(h, KK), g["hex"]))

# edges, faintest grade first so the strong evidence reads on top
order = ["Limited", "Contested", "Suggestive", "Probable", "Convincing"]
for grade in order:
    seg = [(a, b, l) for a, b, l in E if l["g"] == grade]
    if not seg:
        continue
    out.append('<g stroke="%s" fill="none" opacity=".3">' % GRADE_HEX[grade])
    for a, b, l in seg:
        w = round(max(0.6, 0.5 + l["e"] / 24) * 1.15, 2)
        dash = ' stroke-dasharray="6 5"' if l["p"] else ''
        out.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke-width="%s"%s/>'
                   % (a["sx"], a["sy"], b["sx"], b["sy"], w, dash))
    out.append("</g>")

# nodes: squares for risk factors, circles for diseases — the tool's own legend
for p in P:
    if p["t"] != "r":
        continue
    r = round(p["R"] * k, 1)
    out.append('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" opacity=".9"/>'
               % (round(p["sx"] - r, 1), round(p["sy"] - r, 1), round(r * 2, 1),
                  round(r * 2, 1), round(min(5 * k, r * 0.4), 1), groups[p["g"]]["hex"]))
for p in P:
    if p["t"] != "d":
        continue
    out.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>'
               % (p["sx"], p["sy"], round(p["R"] * k, 1), groups[p["g"]]["hex"]))
out.append("</svg>")

svg = "".join(out)
with open("assets/chronic-network.svg", "w", encoding="utf-8") as fh:
    fh.write(svg)

print("wrote assets/chronic-network.svg  %.1f KB" % (len(svg) / 1024))
print("spread: %.0f x %.0f  (frame %dx%d)" % (spread_x, spread_y, W, H))
print("clusters: %d systems + %d categories" % (len(sys_keys), len(cat_keys)))
