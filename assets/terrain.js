/* EpiDetective cover: a contour map that drifts very slowly, with summit
   labels drawn from both explorers (templates/index.html, .map).

   Marching squares on seeded simplex noise. The labels sit on the field's
   local maxima: a label fades in as its summit rises and out as the summit
   sinks, drifts under the title block or meets another label, and its name
   then goes back to the end of the pool, so the map shows a changing
   selection. Labels never overlap each other or the title block. Causes
   (exposures, risk factors) are set in the map's brown with a filled
   triangle; outcomes (cancers, diseases) in its water blue, in italic, with
   an outlined triangle. Both at the caption optical size of Source Serif 4:
   the canvas sets the optical size from the font size, so the names are
   drawn at 8 px and scaled up.

   Selecting a label (click, tap, or the list of buttons a keyboard reaches)
   highlights it and draws a thin dashed line to every other label on the map
   that the data link to it; a line appears when such a label rises while the
   selection lasts and fades with it. A small card beside the label gives its
   kind, its links on the map and the entry in the tool(s); a polite live
   region says the same. Clicking empty map, the card's close button or
   Escape clears it. Nothing here blocks the page's scroll.

   Data: the inline JSON #terrain-data (build_site.py terrain_json): items
   {n name, o 1 for an outcome, u [[tool, url]]}, links [i, j, grade in words],
   t strings. With prefers-reduced-motion the map is drawn once, labels
   included, and selecting still works. Without JavaScript the page shows a
   still of the field (site.css). No libraries. */
(function () {
  'use strict';
  var cv = document.querySelector('canvas[data-terrain]');
  if (!cv || !cv.getContext || !window.requestAnimationFrame) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  var map = cv.closest ? cv.closest('.map') || cv.parentNode : cv.parentNode;
  var avoidEls = map.querySelectorAll('[data-terrain-avoid]');
  var motionQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = !!(motionQ && motionQ.matches);
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var DATA = {items: [], links: [], t: {}};
  try { DATA = JSON.parse(document.getElementById('terrain-data').textContent); } catch (e) { /* labels without links */ }
  var T = DATA.t || {};
  document.documentElement.classList.add('terrain-on');      /* site.css hides the static pattern */

  /* palette (site.css tokens): contour brown, its index lines, contour green,
     water, the two label inks (causes #6E5A3D, outcomes #2D5470: 5.8:1 and
     7.0:1 on the paper), paper halo */
  var BROWN = 'rgba(167,131,90,.5)', INDEX = 'rgba(140,104,64,.72)', GREEN = 'rgba(110,139,91,.55)',
      WATER_LINE = 'rgba(91,136,166,.5)', SHORE = 'rgba(91,136,166,.9)',
      INK = ['#6E5A3D', '#2D5470'], RGB = [[110, 90, 61], [45, 84, 112]],
      HALO = 'rgba(241,240,234,.92)', PAPER_HI = 'rgba(247,246,241,.96)';
  var STEP = 0.065, WATER = -0.47, LOW = -0.2;   /* contour interval; shoreline; top of the green lowland */
  var SPEED = 0.0000105;                         /* drift, noise units per millisecond */
  var SCROLL_PX = 0.25;                          /* scrolling, the map lags a quarter behind the page */
  var PEAK_MIN = 0.16, RISE = 0.12, TAU = 0.7;   /* a summit shows above PEAK_MIN, fully RISE higher; fade time (s) */
  var OPSZ = 8;                                  /* the labels' optical size: Caption */

  /* seeded 2D simplex noise */
  var perm = new Uint8Array(512), G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], p = [], i, s = 7;
  for (i = 0; i < 256; i++) p[i] = i;
  for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var r = s % (i + 1), t = p[i]; p[i] = p[r]; p[r] = t; }
  for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  function n2(x, y) {
    var k = (x + y) * F2, a = Math.floor(x + k), b = Math.floor(y + k), q = (a + b) * G2, x0 = x - (a - q), y0 = y - (b - q),
        i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1, x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2, n = 0, u, g;
    a &= 255; b &= 255;
    u = 0.5 - x0 * x0 - y0 * y0; if (u > 0) { g = G[perm[a + perm[b]] & 7]; u *= u; n += u * u * (g[0] * x0 + g[1] * y0); }
    u = 0.5 - x1 * x1 - y1 * y1; if (u > 0) { g = G[perm[a + i1 + perm[b + j1]] & 7]; u *= u; n += u * u * (g[0] * x1 + g[1] * y1); }
    u = 0.5 - x2 * x2 - y2 * y2; if (u > 0) { g = G[perm[a + 1 + perm[b + 1]] & 7]; u *= u; n += u * u * (g[0] * x2 + g[1] * y2); }
    return 70 * n;
  }

  /* the pool: causes and outcomes interleaved, each list shuffled with a seed */
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function shuffle(a) { for (var j = a.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), x = a[j]; a[j] = a[k]; a[k] = x; } return a; }
  var ITEMS = (DATA.items || []).map(function (it, idx) { return {t: it.n, k: it.o ? 1 : 0, i: idx, u: it.u || []}; });
  var causes = shuffle(ITEMS.filter(function (x) { return !x.k; })),
      outcomes = shuffle(ITEMS.filter(function (x) { return x.k; })), queue = [];
  for (i = 0; i < Math.max(causes.length, outcomes.length); i++) {
    if (causes[i]) queue.push(causes[i]);
    if (outcomes[i]) queue.push(outcomes[i]);
  }
  /* links by item: [[other item, grade in words]] */
  var LINKS = ITEMS.map(function () { return []; });
  (DATA.links || []).forEach(function (l) {
    if (!LINKS[l[0]] || !LINKS[l[1]]) return;
    LINKS[l[0]].push([l[1], l[2]]);
    LINKS[l[1]].push([l[0], l[2]]);
  });

  var W = 0, H = 0, dpr = 1, cell = 8, scale = 420, cols = 0, rows = 0, small = false, maxN = 18, sep = 120,
      val = null, tint = null, tctx = null, img = null, avoid = [], tracks = [], widths = {}, fonts = ['', ''],
      size_px = 12.5, k_px = 1.5, fontsOk = false,
      visible = true, running = false, last = 0, t0 = performance.now(), oyPrev = null, dirty = true,
      sel = -1, hover = -1, drawn = [], arcs = [], cardPick = -1, cardSet = '';

  function rects() {
    var b = cv.getBoundingClientRect();
    avoid = [];
    Array.prototype.forEach.call(avoidEls, function (el) {
      var r = el.getBoundingClientRect();
      if (r.width && r.height) avoid.push([r.left - b.left - 18, r.top - b.top - 14, r.right - b.left + 18, r.bottom - b.top + 14]);
    });
  }
  function size() {
    var b = cv.getBoundingClientRect();
    W = Math.max(1, Math.round(b.width)); H = Math.max(1, Math.round(b.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    small = W < 560;
    cell = small ? 6 : 8;
    scale = small ? 190 : Math.max(300, Math.min(440, W * 0.3));
    maxN = small ? 6 : W > 1500 ? 20 : 18;
    sep = small ? 92 : 136;
    cols = Math.ceil(W / cell) + 2; rows = Math.ceil(H / cell) + 2;
    val = new Float32Array(cols * rows);
    tint = document.createElement('canvas'); tint.width = cols; tint.height = rows;
    tctx = tint.getContext('2d'); img = tctx.createImageData(cols, rows);
    /* the canvas's CSS font gives the family and the size the names appear at */
    var cs = window.getComputedStyle(cv), fam = cs.fontFamily || 'serif';
    size_px = parseFloat(cs.fontSize) || 12;
    if (small) size_px = Math.max(11.5, size_px - 0.5);
    k_px = size_px / OPSZ;
    fonts = ['500 ' + OPSZ + 'px ' + fam, (lang === 'zh' ? '' : 'italic ') + '400 ' + OPSZ + 'px ' + fam];
    widths = {};
    rects();
    dirty = true;
  }

  function field(ms, oy) {
    var ox = ms * SPEED, x, y, nx, ny, v, k = 0, d = img.data, tilt = small ? 0 : 0.16, w;
    for (y = 0; y < rows; y++) {
      ny = y * cell / scale + oy;
      for (x = 0; x < cols; x++) {
        nx = x * cell / scale;
        var wx = n2(nx * 0.55 + 5.2 + ox * 0.4, ny * 0.55 - 1.3), wy = n2(nx * 0.55 - 7.9, ny * 0.55 + 3.1 - ox * 0.3),
            ux = nx + 0.85 * wx, uy = ny + 0.85 * wy;
        v = 0.66 * n2(ux + ox, uy) + 0.25 * n2(ux * 2.03 + 11.3 - ox * 0.7, uy * 2.03 - 4.1) + 0.09 * n2(ux * 4.3 + 3.7, uy * 4.3 + 9.2 + ox * 0.5);
        v += tilt * (x * cell / W) - tilt * 0.35;   /* the high ground leans away from the title block */
        val[k] = v;
        if (v < WATER) { w = Math.min(1, (WATER - v) * 9); d[k * 4] = 91; d[k * 4 + 1] = 136; d[k * 4 + 2] = 166; d[k * 4 + 3] = Math.round(w * 44); }
        else if (v < LOW) { w = Math.min(1, (v - WATER) * 8) * Math.min(1, (LOW - v) * 8); d[k * 4] = 110; d[k * 4 + 1] = 139; d[k * 4 + 2] = 91; d[k * 4 + 3] = Math.round(w * 16); }
        else d[k * 4 + 3] = 0;
        k++;
      }
    }
    tctx.putImageData(img, 0, 0);
  }

  /* marching squares: one level into a path */
  function contour(L, path) {
    var x, y, i, a, b, c, e, X, Y, X1, Y1, idx;
    for (y = 0; y < rows - 1; y++) {
      Y = y * cell; Y1 = Y + cell; i = y * cols;
      for (x = 0; x < cols - 1; x++, i++) {
        a = val[i]; b = val[i + 1]; c = val[i + cols + 1]; e = val[i + cols];
        idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (e > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        X = x * cell; X1 = X + cell;
        var tx = X + cell * (L - a) / (b - a), ry = Y + cell * (L - b) / (c - b),
            bx = X + cell * (L - e) / (c - e), ly = Y + cell * (L - a) / (e - a);
        switch (idx) {
          case 1: case 14: path.moveTo(X, ly); path.lineTo(bx, Y1); break;
          case 2: case 13: path.moveTo(bx, Y1); path.lineTo(X1, ry); break;
          case 3: case 12: path.moveTo(X, ly); path.lineTo(X1, ry); break;
          case 4: case 11: path.moveTo(tx, Y); path.lineTo(X1, ry); break;
          case 6: case 9: path.moveTo(tx, Y); path.lineTo(bx, Y1); break;
          case 7: case 8: path.moveTo(tx, Y); path.lineTo(X, ly); break;
          case 5: path.moveTo(tx, Y); path.lineTo(X1, ry); path.moveTo(X, ly); path.lineTo(bx, Y1); break;
          case 10: path.moveTo(tx, Y); path.lineTo(X, ly); path.moveTo(bx, Y1); path.lineTo(X1, ry); break;
        }
      }
    }
  }

  /* summits: grid maxima, refined between cells so a label glides with its hill */
  function peaks() {
    var out = [], keep = [], x, y, i, c, l, rr, u, d, dx, dy, den;
    for (y = 1; y < rows - 1; y++) {
      for (x = 1; x < cols - 1; x++) {
        i = y * cols + x; c = val[i];
        if (c < PEAK_MIN) continue;
        if (c < val[i - 1] || c <= val[i + 1] || c < val[i - cols] || c <= val[i + cols] ||
            c < val[i - cols - 1] || c < val[i - cols + 1] || c <= val[i + cols - 1] || c <= val[i + cols + 1]) continue;
        l = val[i - 1]; rr = val[i + 1]; u = val[i - cols]; d = val[i + cols];
        den = l - 2 * c + rr; dx = den < 0 ? Math.max(-0.5, Math.min(0.5, (l - rr) / (2 * den))) : 0;
        den = u - 2 * c + d; dy = den < 0 ? Math.max(-0.5, Math.min(0.5, (u - d) / (2 * den))) : 0;
        out.push({x: (x + dx) * cell, y: (y + dy) * cell, v: c, t: null});
      }
    }
    out.sort(function (a, b) { return b.v - a.v; });
    out.forEach(function (q) {
      for (var j = 0; j < keep.length; j++) if (Math.abs(keep[j].x - q.x) < sep && Math.abs(keep[j].y - q.y) < sep * 0.62) return;
      keep.push(q);
    });
    return keep;
  }

  function width(n) {
    var key = n.k + n.t;
    if (!(key in widths)) { ctx.font = fonts[n.k]; widths[key] = ctx.measureText(n.t).width * k_px; }
    return widths[key];
  }
  /* a label's box: the triangle on the summit, the name on its right (side 0) or left (side 1) */
  function box(x, y, w, side) {
    return side ? [x - 10 - w, y - 9, x + 7, y + 9] : [x - 7, y - 9, x + 10 + w, y + 9];
  }
  function free(bx, others) {
    var j, o;
    if (bx[0] < 10 || bx[1] < 10 || bx[2] > W - 10 || bx[3] > H - 10) return false;
    for (j = 0; j < avoid.length; j++) { o = avoid[j]; if (bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1]) return false; }
    for (j = 0; j < others.length; j++) { o = others[j]; if (bx[0] < o[2] + 10 && bx[2] > o[0] - 10 && bx[1] < o[3] + 4 && bx[3] > o[1] - 4) return false; }
    return true;
  }
  function place(tr, others) {
    var w = width(tr.n), first = tr.side || 0, bx = box(tr.x, tr.y, w, first);
    if (free(bx, others)) { tr.side = first; return bx; }
    bx = box(tr.x, tr.y, w, 1 - first);
    if (free(bx, others)) { tr.side = 1 - first; return bx; }
    return null;
  }

  function update(peakList, dt, oy) {
    var pairs = [], j, k, tr, dy = oyPrev === null ? 0 : (oy - oyPrev) * scale;
    oyPrev = oy;
    tracks.forEach(function (tr) { tr.m = null; tr.y -= dy; });          /* a scroll moves the whole field */
    tracks.forEach(function (tr) {
      if (!tr.alive) return;
      peakList.forEach(function (q) {
        var d = Math.hypot(tr.x - q.x, tr.y - q.y);
        if (d < 40) pairs.push([d, tr, q]);
      });
    });
    pairs.sort(function (a, b) { return a[0] - b[0]; });
    pairs.forEach(function (pr) { if (!pr[1].m && !pr[2].t) { pr[1].m = pr[2]; pr[2].t = pr[1]; } });
    tracks.forEach(function (tr) {
      if (tr.m) { tr.x = tr.m.x; tr.y = tr.m.y; tr.v = tr.m.v; }
      else if (!(tr.n.i === sel && tr.a > 0.05)) tr.alive = false;       /* a selected label holds its place */
    });
    /* new summits take the next name, if a label could stand there at all */
    peakList.forEach(function (q) {
      if (q.t || !queue.length) return;
      var w = width(queue[0]);
      if (!free(box(q.x, q.y, w, 0), []) && !free(box(q.x, q.y, w, 1), [])) return;
      tracks.push({x: q.x, y: q.y, v: q.v, n: queue.shift(), a: 0, alive: true, side: 0, hid: 0, bx: null});
    });
    /* placement: the selected label, then labels already showing, then the highest summits */
    var placed = [], shown = 0, order = tracks.slice().sort(function (a, b) {
      return (b.n.i === sel) - (a.n.i === sel) || (b.a > 0.02) - (a.a > 0.02) || b.v - a.v;
    });
    order.forEach(function (tr) {
      tr.ok = false;
      if (tr.a <= 0.02) return;
      var bx = tr.alive && shown < maxN ? place(tr, placed) : null;
      if (bx) { tr.ok = true; shown++; tr.bx = bx; }
      else tr.bx = box(tr.x, tr.y, width(tr.n), tr.side);               /* fading out: still an obstacle */
      placed.push(tr.bx);
    });
    order.forEach(function (tr) {
      if (tr.a > 0.02 || !tr.alive || shown >= maxN) return;
      var bx = place(tr, placed);
      if (bx) { tr.ok = true; shown++; tr.bx = bx; placed.push(bx); }
    });
    /* fade toward the summit's height (a selected label at full strength); release names that have gone */
    var f = dt < 0 ? 1 : 1 - Math.exp(-dt / TAU);
    for (j = tracks.length - 1; j >= 0; j--) {
      tr = tracks[j];
      k = tr.ok ? (tr.n.i === sel ? 1 : Math.max(0, Math.min(1, (tr.v - PEAK_MIN) / RISE))) : 0;
      tr.a += (k - tr.a) * f;
      tr.hid = tr.ok ? 0 : tr.hid + Math.max(dt, 0);
      if (tr.a < 0.02 && (!tr.alive || tr.hid > 2.5)) { queue.push(tr.n); tracks.splice(j, 1); }
    }
  }

  /* the track of an item while its label shows on the map, else null */
  function shown(i) {
    for (var j = 0; j < tracks.length; j++) if (tracks[j].n.i === i && tracks[j].a > 0.05 && tracks[j].bx) return tracks[j];
    return null;
  }
  function anchor(tr) { return [tr.x, tr.y - 0.2]; }

  function tri(x, y, kind, a) {
    ctx.beginPath(); ctx.moveTo(x, y - 4.4); ctx.lineTo(x + 4.8, y + 3.7); ctx.lineTo(x - 4.8, y + 3.7); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = HALO; ctx.stroke();
    if (kind) { ctx.fillStyle = HALO; ctx.fill(); ctx.lineWidth = 1.15; ctx.strokeStyle = INK[1]; ctx.stroke(); }
    else { ctx.fillStyle = INK[0]; ctx.fill(); }
  }
  function name(tr, w) {
    var tx = tr.side ? tr.x - 9 - w : tr.x + 9;
    ctx.save();
    ctx.translate(tx, tr.y + 0.5);
    ctx.scale(k_px, k_px);
    ctx.font = fonts[tr.n.k];
    ctx.lineWidth = 3.6 / k_px; ctx.strokeStyle = HALO; ctx.strokeText(tr.n.t, 0, 0);
    ctx.fillStyle = INK[tr.n.k]; ctx.fillText(tr.n.t, 0, 0);
    ctx.restore();
    return tx;
  }
  function rgba(k, a) { var c = RGB[k]; return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* a link: a gentle arc of short dashes from one triangle to the other, in a
     blend of the two labels' inks, on a paper halo, a small dot at each end.
     Returns the arc's midpoint, where the grade is written. */
  /* where a line leaves a label: past its triangle and clear of its name */
  function exit(tr, ux, uy, pad) {
    var p = anchor(tr), b = tr.bx, x = p[0], y = p[1], d = 0;
    for (; d < 600; d += 1.5) {
      x = p[0] + ux * d; y = p[1] + uy * d;
      if (d >= 9 && (!b || x < b[0] - pad || x > b[2] + pad || y < b[1] - pad || y > b[3] + pad)) break;
    }
    return [x, y, d];
  }
  function link(A, B, a) {
    var p = anchor(A), q = anchor(B), dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
    if (len < 24) return null;
    var ux = dx / len, uy = dy / len, s = exit(A, ux, uy, 6), e = exit(B, -ux, -uy, 3);
    if (s[2] + e[2] > len - 16) return null;
    s = p;                                             /* from under the selected label's tag, which hides the start */
    var bend = Math.min(60, len * 0.12) * (ux >= 0 ? -1 : 1),
        c = [(s[0] + e[0]) / 2 - uy * bend, (s[1] + e[1]) / 2 + ux * bend],
        g = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
    g.addColorStop(0, rgba(A.n.k, 0.92 * a)); g.addColorStop(1, rgba(B.n.k, 0.92 * a));
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo(c[0], c[1], e[0], e[1]);
    ctx.setLineDash([]); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(241,240,234,' + (0.8 * a) + ')'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.setLineDash([3.2, 3]); ctx.lineCap = 'butt';
    ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(B.n.k, a); ctx.beginPath(); ctx.arc(e[0], e[1], 1.8, 0, 6.2832); ctx.fill();
    return [s, c, e];
  }
  function at(L, t) {
    var u = 1 - t;
    return [u * u * L[0][0] + 2 * u * t * L[1][0] + t * t * L[2][0], u * u * L[0][1] + 2 * u * t * L[1][1] + t * t * L[2][1]];
  }
  /* the grade, small, on its line, like a route's name on a map: at the
     middle, or a little either side where a label or another grade stands */
  function grade(L, text, a, taken) {
    var f = k_px * 0.9, j, k, m = null, bx = null;
    ctx.font = fonts[1];
    var w = ctx.measureText(text).width * f, ts = [0.5, 0.4, 0.6, 0.32, 0.68];
    for (j = 0; j < ts.length && !m; j++) {
      var q = at(L, ts[j]), r = [q[0] - w / 2 - 3, q[1] - 7, q[0] + w / 2 + 3, q[1] + 7], ok = true;
      for (k = 0; ok && k < taken.length; k++) {
        var o = taken[k];
        if (r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]) ok = false;
      }
      if (ok) { m = q; bx = r; }
    }
    if (!m) { m = at(L, 0.5); bx = [m[0] - w / 2 - 3, m[1] - 7, m[0] + w / 2 + 3, m[1] + 7]; }
    taken.push(bx);
    ctx.save();
    ctx.globalAlpha = a;
    roundRect(bx[0], bx[1] + 1, bx[2] - bx[0], bx[3] - bx[1] - 2, 3);
    ctx.fillStyle = 'rgba(241,240,234,.82)'; ctx.fill();
    ctx.font = fonts[1];
    ctx.translate(m[0] - w / 2, m[1]);
    ctx.scale(f, f);
    ctx.lineWidth = 4 / f; ctx.strokeStyle = HALO; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#4A4C44'; ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function draw(ms, dt, keep) {
    if (!val) return;
    var oy = still ? 0 : -(window.scrollY || window.pageYOffset || 0) * SCROLL_PX / scale;
    field(ms, oy);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tint, 0, 0, cols * cell, rows * cell);
    /* one path per line style: five strokes a frame; butt caps rasterise a
       third faster than round ones and look the same at these widths */
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    var water = new Path2D(), index = new Path2D(), green = new Path2D(), brown = new Path2D(), shore = new Path2D();
    for (var k = -15; k <= 15; k++) {
      var L = k * STEP;
      if (L < WATER - 0.36 || Math.abs(L - WATER) < STEP / 2) continue;
      contour(L, L < WATER ? water : k % 5 === 0 ? index : L < LOW ? green : brown);
    }
    contour(WATER, shore);
    ctx.strokeStyle = WATER_LINE; ctx.lineWidth = 0.6; ctx.stroke(water);
    ctx.strokeStyle = GREEN; ctx.lineWidth = 0.65; ctx.stroke(green);
    ctx.strokeStyle = BROWN; ctx.lineWidth = 0.62; ctx.stroke(brown);
    ctx.strokeStyle = INDEX; ctx.lineWidth = 1.1; ctx.stroke(index);
    ctx.strokeStyle = SHORE; ctx.lineWidth = 1.15; ctx.stroke(shore);
    if (!fontsOk || !queue.length && !tracks.length) return;
    if (!keep) update(peaks(), dt, oy);
    ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    /* the selection's lines, under every label */
    var S = sel >= 0 ? shown(sel) : null, near = {}, mids = [];
    drawn = []; arcs = [];
    if (S) {
      LINKS[sel].forEach(function (l) {
        var B = shown(l[0]);
        if (!B) return;
        near[l[0]] = 1;
        var a = Math.min(S.a, B.a), L = link(S, B, a);
        if (L) mids.push([L, l[1], a]);
        drawn.push({to: B.n.t, grade: l[1]});
      });
      arcs = mids.map(function (g) { return g[0]; });
      var taken = tracks.filter(function (tr) { return tr.a > 0.05 && tr.bx; }).map(function (tr) { return tr.bx; });
      mids.forEach(function (g) { grade(g[0], g[1], g[2], taken); });
    }
    tracks.forEach(function (tr) {
      if (tr.a < 0.01) return;
      var w = width(tr.n), on = tr.n.i === sel, dim = S && !on && !near[tr.n.i] ? 0.42 : 1, bx = tr.bx;
      ctx.globalAlpha = tr.a * dim;
      if (on && bx) {                                    /* the selected label: a small paper tag */
        roundRect(bx[0] - 5, bx[1] - 3, bx[2] - bx[0] + 10, bx[3] - bx[1] + 6, 3);
        ctx.fillStyle = PAPER_HI; ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(tr.n.k, 0.55); ctx.stroke();
      }
      var tx = name(tr, w);
      if (tr.n.i === hover && !on && tr.a > 0.3) {       /* hover: a hairline under the name */
        ctx.fillStyle = rgba(tr.n.k, 0.6);
        ctx.fillRect(tx, tr.y + 0.5 + size_px * 0.62, w, 0.75);
      }
      tri(tr.x, tr.y, tr.n.k);
    });
    ctx.globalAlpha = 1;
    after();
  }

  /* reduced motion: one still map, labels at full strength where they stand */
  function drawStill() { tracks.forEach(function (tr) { queue.push(tr.n); }); tracks = []; oyPrev = null; draw(0, -1); }
  /* a change of hover or selection: the next frame, or (still map) a redraw as it stands */
  function refresh() { dirty = true; if (still || !running) draw(still ? 0 : performance.now() - t0, 0, true); }

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (!visible || document.hidden) { last = now; return; }
    if (now - last < (dirty ? 33 : 80)) return;
    var dt = Math.min(0.2, (now - last) / 1000);
    last = now; dirty = false;
    draw(now - t0, dt);
  }
  function start() {
    if (still) { running = false; drawStill(); return; }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }

  /* ---- the selection: list of buttons, card, announcement ---- */
  var SVG = 'http://www.w3.org/2000/svg';
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }
  function triIcon(k) {
    var s = document.createElementNS(SVG, 'svg'), p = document.createElementNS(SVG, 'path');
    s.setAttribute('class', 'tri ' + (k ? 'tri-o' : 'tri-c'));
    s.setAttribute('viewBox', '0 0 10 9');
    s.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', 'M5 .9 9.2 8.1H.8z');
    s.appendChild(p);
    return s;
  }
  function fill(s, o) { return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return k in o ? o[k] : m; }); }

  /* the keyboard's way in: one tab stop, arrow keys between the names */
  var pick = el('div', 'tn-pick'), pickList = el('ul'), buttons = [];
  pick.setAttribute('role', 'group');
  pick.setAttribute('aria-label', T.list || '');
  var pickHead = el('p', '', T.list || '');
  pickHead.setAttribute('aria-hidden', 'true');
  pick.appendChild(pickHead);
  ITEMS.forEach(function (it, idx) {
    var li = el('li'), b = el('button', it.k ? 'o' : 'c');
    b.type = 'button';
    b.tabIndex = idx ? -1 : 0;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('data-on', '0');
    b.appendChild(triIcon(it.k));
    b.appendChild(document.createTextNode(it.t));
    b.addEventListener('click', function () { select(sel === idx ? -1 : idx); });
    li.appendChild(b);
    pickList.appendChild(li);
    buttons.push(b);
  });
  pick.appendChild(pickList);
  pick.addEventListener('keydown', function (e) {
    var i = buttons.indexOf(document.activeElement), n = buttons.length, to = -1;
    if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = (i + n - 1) % n;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    buttons[i].tabIndex = -1;
    buttons[to].tabIndex = 0;
    buttons[to].focus();
  });

  /* the card: the name, its kind and the way into the tool(s); the lines on
     the map show the links and their grades, the announcement reads them */
  var card = el('div', 'tn-card'), cardHead = el('p', 'tn-h'), cardName = el('span'), cardKind = el('p', 'tn-k'),
      cardGo = el('div', 'tn-go'), cardX = el('button', 'tn-x', '\u00d7'), cardW = 0, cardH = 0;
  card.hidden = true;
  card.setAttribute('role', 'group');
  cardX.type = 'button';
  cardX.setAttribute('aria-label', T.close || 'Close');
  cardX.addEventListener('click', function () { var was = sel; select(-1); if (buttons[was]) buttons[was].focus(); });
  cardHead.appendChild(cardName);
  card.appendChild(cardHead);
  card.appendChild(cardKind);
  card.appendChild(cardGo);
  card.appendChild(cardX);

  /* what a screen reader hears */
  var say = el('p', 'vh');
  say.setAttribute('role', 'status');
  say.setAttribute('aria-live', 'polite');

  map.appendChild(pick);
  map.appendChild(card);
  map.appendChild(say);

  function onMap() {
    var out = {};
    tracks.forEach(function (tr) { if (tr.a > 0.05 && tr.bx) out[tr.n.i] = tr; });
    return out;
  }
  function linkedNow(i, on) {
    return (LINKS[i] || []).filter(function (l) { return on[l[0]]; });
  }
  function fillCard(i) {
    var it = ITEMS[i];
    card.className = 'tn-card ' + (it.k ? 'o' : 'c');
    card.setAttribute('aria-label', it.t);
    while (cardHead.firstChild !== cardName) cardHead.removeChild(cardHead.firstChild);
    cardHead.insertBefore(triIcon(it.k), cardName);
    cardName.textContent = it.t;
    cardKind.textContent = it.k ? T.key_outcome : T.key_cause;
    cardGo.textContent = '';
    if (it.u.length > 1) {
      cardGo.appendChild(el('p', '', T.open_in));
      it.u.forEach(function (u) { var a = el('a', '', u[0] + '\u00a0\u2192'); a.href = u[1]; cardGo.appendChild(a); });
    } else if (it.u.length) {
      var a = el('a', '', T.open); a.href = it.u[0][1]; a.title = it.u[0][0]; cardGo.appendChild(a);
    }
  }
  function announce(i) {
    var it = ITEMS[i], on = onMap();
    if (!on[i]) { say.textContent = fill(T.say_off, {name: it.t}); return; }
    var list = linkedNow(i, on);
    say.textContent = list.length
      ? fill(T.say, {name: it.t, list: list.map(function (l) { return ITEMS[l[0]].t + ' (' + l[1] + ')'; }).join(T.sep || ', ')})
      : fill(T.say_none, {name: it.t});
  }
  function select(i) {
    if (sel >= 0 && buttons[sel]) buttons[sel].setAttribute('aria-pressed', 'false');
    sel = i;
    cardPick = -1; cardSet = '';
    if (i < 0) { card.hidden = true; say.textContent = ''; refresh(); return; }
    buttons[i].setAttribute('aria-pressed', 'true');
    buttons.forEach(function (b, j) { b.tabIndex = j === i ? 0 : -1; });
    fillCard(i);
    card.hidden = false;
    cardW = 0;
    refresh();
    after();
    announce(i);
  }

  /* after each frame: the buttons' state and the card's place */
  function after() {
    var on = onMap(), j;
    for (j = 0; j < buttons.length; j++) {
      var v = on[j] ? '1' : '0';
      if (buttons[j].getAttribute('data-on') !== v) buttons[j].setAttribute('data-on', v);
    }
    if (sel < 0 || card.hidden) return;
    if (!cardW) { cardW = card.offsetWidth; cardH = card.offsetHeight; }
    var tr = on[sel], x, y, gap = 10, keys = pick.matches && pick.matches(':focus-within'), stacked = W < 760;
    if (!tr || keys) {                                 /* from the keyboard, or not on the map: under the list */
      x = keys ? pick.offsetLeft + pick.offsetWidth - cardW : W - cardW - Math.max(16, Math.min(72, W * 0.04));
      y = keys ? pick.offsetTop + pick.offsetHeight + gap : 16;
    } else {
      /* beside the label, where it hides the fewest lines and linked names; it
         keeps its side while the same lines show, so it does not jump about */
      var b = tr.bx, cands = [[b[0] - 4, b[3] + gap], [b[0] - 4, b[1] - gap - cardH], [b[2] + gap + 4, b[1] - 6],
                              [b[0] - gap - 4 - cardW, b[1] - 6], [b[2] + 4 - cardW, b[3] + gap], [b[2] + 4 - cardW, b[1] - gap - cardH],
                              [b[2] + gap + 4, b[3] - cardH + 6], [b[0] - gap - 4 - cardW, b[3] - cardH + 6]];
      var fits = function (c) {
        var r = [c[0], c[1], c[0] + cardW, c[1] + cardH], ok = r[0] >= 8 && r[1] >= 8 && r[2] <= W - 8 && r[3] <= H - 8;
        for (var k = 0; ok && !stacked && k < avoid.length; k++) {   /* a phone's card may cover the title block */
          var o = avoid[k];
          if (r[0] < o[2] - 18 && r[2] > o[0] + 18 && r[1] < o[3] - 14 && r[3] > o[1] + 14) ok = false;
        }
        return ok;
      };
      var sig = sel + ':' + drawn.map(function (d) { return d.to; }).join('|');
      if (sig !== cardSet || cardPick < 0 || !fits(cands[cardPick])) {
        var bestScore = 1e9;
        cardSet = sig; cardPick = -1;
        for (j = 0; j < cands.length; j++) {
          if (!fits(cands[j])) continue;
          var c = cands[j], r = [c[0] - 6, c[1] - 6, c[0] + cardW + 6, c[1] + cardH + 6], score = j * 0.1;
          arcs.forEach(function (L) {
            for (var t = 0.08; t < 1; t += 0.12) { var q = at(L, t); if (q[0] > r[0] && q[0] < r[2] && q[1] > r[1] && q[1] < r[3]) score += 1; }
          });
          Object.keys(on).forEach(function (n) {
            if (+n === sel || !(LINKS[sel] || []).some(function (l) { return l[0] === +n; })) return;
            var o = on[n].bx;
            if (o && r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]) score += 4;
          });
          if (score < bestScore) { bestScore = score; cardPick = j; }
        }
      }
      var best = cands[cardPick < 0 ? 0 : cardPick];
      x = best[0]; y = best[1];
    }
    x = Math.max(8, Math.min(W - cardW - 8, x));
    y = Math.max(8, Math.min(H - cardH - 8, y));
    card.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  /* pointer: a label under the pointer, with a target at least 32 px tall */
  function hit(e) {
    var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, pad = e.pointerType === 'touch' ? 10 : 5;
    for (var j = tracks.length - 1; j >= 0; j--) {
      var tr = tracks[j], bx = tr.bx;
      if (!bx || tr.a < 0.3) continue;
      var cy = (bx[1] + bx[3]) / 2, hh = Math.max(16, (bx[3] - bx[1]) / 2 + pad);
      if (x >= bx[0] - pad && x <= bx[2] + pad && y >= cy - hh && y <= cy + hh) return tr.n.i;
    }
    return -1;
  }
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var h = hit(e);
    if (h !== hover) { hover = h; cv.style.cursor = h >= 0 ? 'pointer' : ''; refresh(); }
  });
  cv.addEventListener('pointerleave', function () { if (hover >= 0) { hover = -1; cv.style.cursor = ''; refresh(); } });
  cv.addEventListener('click', function (e) {
    var h = hit(e);
    select(h >= 0 && h !== sel ? h : -1);
  });
  /* a click or tap anywhere else on the page clears it; so does Escape */
  document.addEventListener('click', function (e) {
    if (sel < 0 || e.target === cv || card.contains(e.target) || pick.contains(e.target)) return;
    select(-1);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || sel < 0 || e.defaultPrevented) return;
    var t = document.activeElement;
    if (t && t.closest && t.closest('[data-search]')) return;     /* the search box's own Escape */
    var was = sel;
    select(-1);
    if (card.contains(t) && buttons[was]) buttons[was].focus();
  });

  size();
  draw(0, 0);
  function fontsReady() { if (fontsOk) return; fontsOk = true; size(); if (still) drawStill(); else draw(performance.now() - t0, 0); }
  if (document.fonts && document.fonts.load) {
    var words = ITEMS.map(function (x) { return x.t; }).join(' ');
    Promise.all([document.fonts.load(fonts[0], words), document.fonts.load(fonts[1], words)]).then(fontsReady, fontsReady);
    setTimeout(fontsReady, 2500);
  } else fontsReady();

  var rt;
  function resized() { clearTimeout(rt); rt = setTimeout(function () { size(); cardW = 0; if (still) drawStill(); else draw(performance.now() - t0, 0); }, 120); }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(resized);
    ro.observe(map);
    Array.prototype.forEach.call(avoidEls, function (el) { ro.observe(el); });
  } else window.addEventListener('resize', resized);
  window.addEventListener('scroll', function () { dirty = true; }, {passive: true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
  }
  if (motionQ && motionQ.addEventListener) {
    motionQ.addEventListener('change', function (e) { still = e.matches; if (still) running = false; start(); });
  }
  start();
  /* read-only views for checks: what is on the map now, and the lines drawn */
  cv.terrainLabels = function () {
    return tracks.filter(function (tr) { return tr.a > 0.05; }).map(function (tr) {
      return {name: tr.n.t, kind: tr.n.k ? 'outcome' : 'cause', x: Math.round(tr.x), y: Math.round(tr.y), a: +tr.a.toFixed(2),
              box: tr.bx, selected: tr.n.i === sel};
    });
  };
  cv.terrainLines = function () { return drawn.slice(); };
})();
