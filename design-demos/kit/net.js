/* EpiDetective design demos: shared network data and layout helpers (no dependencies).
   EpiNet.load("cancer" | "chronic") -> Promise<graph>
     graph.nodes: {i, name, short, kind: "exposure"|"cancer"|"risk"|"disease", group, groupLabel, cat, degree, links:[]}
       cancer graph: exposures carry group "1" | "2A" | "2B" (IARC); cat = exposure category; cancers carry cat = organ system
       chronic graph: risk factors and diseases carry cat = their category; no group
     graph.links: {source, target (node objects), grade, est (true = strongest grade), related (chronic only)}
       cancer grades: "Established" (sufficient evidence in people) | "Suspected" (limited evidence in people)
       chronic grades (version 2.0 names): "Strong" | "Moderate" | "Suggestive" | "Weak" | "Conflicting"
   EpiNet.layout(graph, {iterations, seed, linkDistance, charge, gravity}) sets node.x, node.y around (0,0); deterministic.
   EpiNet.fit(graph, width, height, pad) -> {k, tx, ty} to map x,y into a box: X = x*k + tx.
   EpiNet.neighbours(node) -> [{node, link}]
   EpiNet.search(graph, text) -> nodes whose name contains text (case-insensitive), best first.
   EpiNet.LABELS -> plain-language labels used by the tools.
   Counts to print come from the content brief (185 / 68 / 469 and 124 / 45 / 356), not from these files:
   the chronic file is an older skeleton (version 1.4) kept only for drawing. */
(function () {
  "use strict";
  var BASE = (document.currentScript && document.currentScript.src || "").replace(/kit\/net\.js.*$/, "");
  var LABELS = {
    group: { "1": "Known cause", "2A": "Probable cause", "2B": "Possible cause", "3": "Not classifiable" },
    groupLong: { "1": "Group 1 · Known cause", "2A": "Group 2A · Probable cause", "2B": "Group 2B · Possible cause" },
    cancerLink: { Established: "Established link: studies in people show that it causes this cancer.",
                  Suspected: "Suspected link: studies in people show a link, and a causal link is credible." },
    chronicGrade: ["Strong", "Moderate", "Suggestive", "Weak", "Conflicting"]
  };
  var V2 = { Convincing: "Strong", Probable: "Moderate", Suggestive: "Suggestive", Limited: "Weak", Contested: "Conflicting" };
  function short(name) { return name.replace(/\s*\((a |an )[^)]*\)\s*$/i, "").trim(); }

  function build(raw, which) {
    var nodes = raw.nodes.map(function (n, i) {
      var kind = which === "cancer" ? (n.t === "e" ? "exposure" : "cancer") : (n.t === "r" ? "risk" : "disease");
      var group = which === "cancer" && n.t === "e" ? n.g : null;
      return { i: i, name: n.n, short: short(n.n), kind: kind, group: group,
        groupLabel: group ? LABELS.group[group] : null,
        cat: which === "cancer" ? (n.t === "e" ? n.c : n.o) : n.g, degree: 0, links: [] };
    });
    var links = raw.links.map(function (l) {
      var s = nodes[l.s], t = nodes[l.t];
      var grade = which === "cancer" ? (l.e ? "Established" : "Suspected") : (V2[l.g] || l.g);
      var link = { source: s, target: t, grade: grade, est: which === "cancer" ? !!l.e : grade === "Strong", related: !!l.p };
      s.degree++; t.degree++; s.links.push(link); t.links.push(link);
      return link;
    });
    return { which: which, nodes: nodes, links: links };
  }

  var cache = {};
  function load(which) {
    which = which === "chronic" ? "chronic" : "cancer";
    if (!cache[which]) {
      var url = BASE + (which === "cancer" ? "media/graph.json" : "media/chronic-graph.json");
      cache[which] = fetch(url).then(function (r) { if (!r.ok) throw new Error("Could not load " + url); return r.json(); })
        .then(function (raw) { return build(raw, which); });
    }
    return cache[which];
  }

  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* simple deterministic force layout: repulsion (all pairs), springs on links, gravity to centre */
  function layout(g, o) {
    o = o || {};
    var it = o.iterations || 320, r = rng(o.seed || 7), L = o.linkDistance || 34, C = o.charge || 900, G = o.gravity || 0.012;
    var N = g.nodes, n = N.length;
    N.forEach(function (d, i) { var a = i * 2.399963, rad = 12 * Math.sqrt(i + 1); d.x = Math.cos(a) * rad + r() - .5; d.y = Math.sin(a) * rad + r() - .5; d.vx = 0; d.vy = 0; });
    for (var k = 0; k < it; k++) {
      var alpha = 1 - k / it;
      for (var i = 0; i < n; i++) { var p = N[i];
        for (var j = i + 1; j < n; j++) { var q = N[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy + .01;
          if (d2 > 90000) continue; var f = C / d2 * alpha; dx *= f; dy *= f; p.vx += dx; p.vy += dy; q.vx -= dx; q.vy -= dy; } }
      g.links.forEach(function (l) { var s = l.source, t = l.target, dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - L) * .06 * alpha / d;
        dx *= f; dy *= f; s.vx += dx; s.vy += dy; t.vx -= dx; t.vy -= dy; });
      N.forEach(function (d) { d.vx -= d.x * G * alpha; d.vy -= d.y * G * alpha; d.x += d.vx; d.y += d.vy; d.vx *= .55; d.vy *= .55; });
    }
    return g;
  }

  function fit(g, w, h, pad) {
    pad = pad == null ? 24 : pad;
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    g.nodes.forEach(function (d) { x0 = Math.min(x0, d.x); x1 = Math.max(x1, d.x); y0 = Math.min(y0, d.y); y1 = Math.max(y1, d.y); });
    var k = Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
    return { k: k, tx: w / 2 - (x0 + x1) / 2 * k, ty: h / 2 - (y0 + y1) / 2 * k };
  }

  function neighbours(node) { return node.links.map(function (l) { return { node: l.source === node ? l.target : l.source, link: l }; }); }

  function search(g, text) {
    var q = (text || "").trim().toLowerCase(); if (!q) return [];
    return g.nodes.filter(function (d) { return d.name.toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q) || b.degree - a.degree; });
  }

  window.EpiNet = { load: load, layout: layout, fit: fit, neighbours: neighbours, search: search, LABELS: LABELS };
})();
