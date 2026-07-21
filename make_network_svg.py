#!/usr/bin/env python3
"""Render the evidence graph to a static SVG.

WordPress.com Simple strips JavaScript, so the live canvas simulation cannot run
there. This bakes the same force-directed layout to an SVG that can be uploaded
to the media library and used as a background image.

Deterministic: seeded, so re-running gives the identical layout.
"""
import json
import math
import random

SEED = 7
random.seed(SEED)

W, H = 1600, 1000
PAL = {
    "established": "#A33526",
    "suspected": "#8C9A8E",
    "cancer": "#1F5B55",
    "exposure": "#171814",
}

with open("graph.json") as fh:
    G = json.load(fh)

nodes, links = G["nodes"], G["links"]
deg = [0] * len(nodes)
for l in links:
    deg[l["s"]] += 1
    deg[l["t"]] += 1

# --- initial placement: uniform disc (a ring keyed to index bakes in fake structure)
P = []
for i, n in enumerate(nodes):
    a = random.random() * math.tau
    r = math.sqrt(random.random()) * 420
    P.append({
        "x": math.cos(a) * r, "y": math.sin(a) * r, "vx": 0.0, "vy": 0.0,
        "t": n["t"], "deg": deg[i], "name": n["n"],
        "R": (3.0 + min(deg[i], 26) * 0.20) if n["t"] == "c"
             else (1.7 + min(deg[i], 14) * 0.16),
    })

E = [(P[l["s"]], P[l["t"]], l["e"]) for l in links]

# --- settle. Repulsion must outweigh the springs or the layout implodes.
ITERS = 500
REP, SPRING, GRAV, DAMP = 9000.0, 0.0055, 0.0020, 0.88

for it in range(ITERS):
    t = it / ITERS
    cap = 34 * (1 - t) + 1.5                      # cooling
    for i in range(len(P)):
        p = P[i]
        for j in range(i + 1, len(P)):
            q = P[j]
            dx, dy = q["x"] - p["x"], q["y"] - p["y"]
            d2 = dx * dx + dy * dy
            if d2 < 36:
                d2 = 36
            d = math.sqrt(d2)
            f = REP / d2
            fx, fy = dx / d * f, dy / d * f
            p["vx"] -= fx; p["vy"] -= fy
            q["vx"] += fx; q["vy"] += fy
    for a, b, ev in E:
        dx, dy = b["x"] - a["x"], b["y"] - a["y"]
        d = math.hypot(dx, dy) or 0.01
        rest = 74 if ev else 132                  # established sit closer
        k = SPRING * (d - rest)
        fx, fy = dx / d * k, dy / d * k
        a["vx"] += fx; a["vy"] += fy
        b["vx"] -= fx; b["vy"] -= fy
    for p in P:
        p["vx"] -= p["x"] * GRAV
        p["vy"] -= p["y"] * GRAV
        p["vx"] *= DAMP
        p["vy"] *= DAMP
        s = math.hypot(p["vx"], p["vy"])
        if s > cap:
            p["vx"] = p["vx"] / s * cap
            p["vy"] = p["vy"] / s * cap
        p["x"] += p["vx"]
        p["y"] += p["vy"]

# --- fit to viewBox
xs = [p["x"] for p in P]
ys = [p["y"] for p in P]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
k = min(W / (x1 - x0 + 120), H / (y1 - y0 + 120))
dx = W / 2 - (x0 + x1) / 2 * k
dy = H / 2 - (y0 + y1) / 2 * k
for p in P:
    p["sx"] = round(p["x"] * k + dx, 1)
    p["sy"] = round(p["y"] * k + dy, 1)

spread_x = max(p["sx"] for p in P) - min(p["sx"] for p in P)
spread_y = max(p["sy"] for p in P) - min(p["sy"] for p in P)
assert spread_x > W * 0.5 and spread_y > H * 0.5, \
    "layout collapsed (spread %.0fx%.0f)" % (spread_x, spread_y)

# --- emit. viewBox hugs the content: margin is wasted density in a background image.
PAD = 24
vx0 = min(p["sx"] - p["R"] for p in P) - PAD
vy0 = min(p["sy"] - p["R"] for p in P) - PAD
vw = max(p["sx"] + p["R"] for p in P) + PAD - vx0
vh = max(p["sy"] + p["R"] for p in P) + PAD - vy0
out = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" '
    'width="%.0f" height="%.0f" role="img" '
    'aria-label="Network of 460 documented links between 185 exposures and 68 cancer types">'
    % (vx0, vy0, vw, vh, vw, vh)
]
out.append('<g stroke="%s" stroke-width="1.5" opacity=".5" fill="none">' % PAL["suspected"])
for a, b, ev in E:
    if not ev:
        out.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke-dasharray="5 6"/>'
                   % (a["sx"], a["sy"], b["sx"], b["sy"]))
out.append("</g>")
out.append('<g stroke="%s" stroke-width="1.9" opacity=".62" fill="none">' % PAL["established"])
for a, b, ev in E:
    if ev:
        out.append('<line x1="%s" y1="%s" x2="%s" y2="%s"/>'
                   % (a["sx"], a["sy"], b["sx"], b["sy"]))
out.append("</g>")
out.append('<g fill="%s" opacity=".46">' % PAL["exposure"])
for p in P:
    if p["t"] == "e":
        out.append('<circle cx="%s" cy="%s" r="%s"/>' % (p["sx"], p["sy"], round(p["R"] * 1.5, 1)))
out.append("</g>")
out.append('<g fill="%s" opacity=".82">' % PAL["cancer"])
for p in P:
    if p["t"] == "c":
        out.append('<circle cx="%s" cy="%s" r="%s"/>' % (p["sx"], p["sy"], round(p["R"] * 1.5, 1)))
out.append("</g>")
out.append("</svg>")

svg = "".join(out)
with open("assets/network.svg", "w") as fh:
    fh.write(svg)

print("wrote assets/network.svg  %.1f KB" % (len(svg) / 1024))
print("spread: %.0f x %.0f  (viewBox %dx%d)" % (spread_x, spread_y, W, H))
print("edges: %d established, %d suspected" % (sum(1 for e in E if e[2]),
                                               sum(1 for e in E if not e[2])))
