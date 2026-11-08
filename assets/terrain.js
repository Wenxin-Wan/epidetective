/* EpiDetective cover: a contour map that drifts very slowly, with summit
   labels drawn from both explorers (templates/index.html, .map).

   Marching squares on seeded simplex noise. The labels sit on the field's
   local maxima: a label fades in as its summit rises and out as the summit
   sinks, drifts under the title block or meets another label, and its name
   then goes back to the end of the pool, so the map shows a changing
   selection. Labels never overlap each other or the title block.

   Decorative: the canvas is aria-hidden and the page reads the same without
   it (site.css draws a static contour pattern when this script does not run).
   With prefers-reduced-motion the map is drawn once, labels included.
   Names: data-causes (filled triangle) and data-outcomes (outlined
   triangle) on the canvas, separated by "|". No libraries. */
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
  document.documentElement.classList.add('terrain-on');      /* site.css hides the static pattern */

  /* palette (site.css tokens): contour brown, its index lines, contour green,
     water, label ink #6E5A3D (5.3:1 on the paper), paper halo */
  var BROWN = 'rgba(167,131,90,.5)', INDEX = 'rgba(140,104,64,.72)', GREEN = 'rgba(110,139,91,.55)',
      WATER_LINE = 'rgba(91,136,166,.5)', SHORE = 'rgba(91,136,166,.9)',
      INK = '#6E5A3D', HALO = 'rgba(241,240,234,.92)';
  var STEP = 0.065, WATER = -0.47, LOW = -0.2;   /* contour interval; shoreline; top of the green lowland */
  var SPEED = 0.0000105;                         /* drift, noise units per millisecond */
  var SCROLL_PX = 0.25;                          /* the field moves a quarter of a pixel per pixel scrolled */
  var PEAK_MIN = 0.16, RISE = 0.12, TAU = 0.7;   /* a summit shows above PEAK_MIN, fully RISE higher; fade time (s) */

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
  function list(attr) {
    return (cv.getAttribute(attr) || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
  }
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function shuffle(a) { for (var j = a.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), x = a[j]; a[j] = a[k]; a[k] = x; } return a; }
  var causes = shuffle(list('data-causes')), outcomes = shuffle(list('data-outcomes')), queue = [];
  for (i = 0; i < Math.max(causes.length, outcomes.length); i++) {
    if (causes[i]) queue.push({t: causes[i], k: 0});
    if (outcomes[i]) queue.push({t: outcomes[i], k: 1});
  }

  var W = 0, H = 0, dpr = 1, cell = 8, scale = 420, cols = 0, rows = 0, small = false, maxN = 18, sep = 120,
      val = null, tint = null, tctx = null, img = null, avoid = [], tracks = [], widths = {}, font = '', fontsOk = false,
      visible = true, running = false, last = 0, t0 = performance.now(), oyPrev = null, dirty = true;

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
    maxN = small ? 6 : 18;
    sep = small ? 84 : 128;
    cols = Math.ceil(W / cell) + 2; rows = Math.ceil(H / cell) + 2;
    val = new Float32Array(cols * rows);
    tint = document.createElement('canvas'); tint.width = cols; tint.height = rows;
    tctx = tint.getContext('2d'); img = tctx.createImageData(cols, rows);
    var cs = window.getComputedStyle(cv);
    font = (cs.fontWeight || '500') + ' ' + (cs.fontSize || '11.5px') + ' ' + (cs.fontFamily || 'sans-serif');
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
    if (!(n.t in widths)) { ctx.font = font; widths[n.t] = ctx.measureText(n.t).width; }
    return widths[n.t];
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
    var pairs = [], j, k, tr, q, dy = oyPrev === null ? 0 : (oy - oyPrev) * scale;
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
      if (tr.m) { tr.x = tr.m.x; tr.y = tr.m.y; tr.v = tr.m.v; } else tr.alive = false;
    });
    /* new summits take the next name, if a label could stand there at all */
    peakList.forEach(function (q) {
      if (q.t || !queue.length) return;
      var w = width(queue[0]);
      if (!free(box(q.x, q.y, w, 0), []) && !free(box(q.x, q.y, w, 1), [])) return;
      tracks.push({x: q.x, y: q.y, v: q.v, n: queue.shift(), a: 0, alive: true, side: 0, hid: 0, bx: null});
    });
    /* placement: labels already showing first, then the highest summits */
    var placed = [], shown = 0, order = tracks.slice().sort(function (a, b) {
      return (b.a > 0.02) - (a.a > 0.02) || b.v - a.v;
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
    /* fade toward the summit's height; release names that have gone */
    var f = dt < 0 ? 1 : 1 - Math.exp(-dt / TAU);
    for (j = tracks.length - 1; j >= 0; j--) {
      tr = tracks[j];
      k = tr.ok ? Math.max(0, Math.min(1, (tr.v - PEAK_MIN) / RISE)) : 0;
      tr.a += (k - tr.a) * f;
      tr.hid = tr.ok ? 0 : tr.hid + Math.max(dt, 0);
      if (tr.a < 0.02 && (!tr.alive || tr.hid > 2.5)) { queue.push(tr.n); tracks.splice(j, 1); }
    }
  }

  function tri(x, y, kind) {
    ctx.beginPath(); ctx.moveTo(x, y - 4.4); ctx.lineTo(x + 4.8, y + 3.7); ctx.lineTo(x - 4.8, y + 3.7); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = HALO; ctx.stroke();
    if (kind) { ctx.fillStyle = HALO; ctx.fill(); ctx.lineWidth = 1.15; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ctx.fillStyle = INK; ctx.fill(); }
  }

  function draw(ms, dt) {
    if (!val) return;
    var oy = still ? 0 : (window.scrollY || window.pageYOffset || 0) * SCROLL_PX / scale;
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
    update(peaks(), dt, oy);
    ctx.font = font; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    tracks.forEach(function (tr) {
      if (tr.a < 0.01) return;
      var w = width(tr.n), tx = tr.side ? tr.x - 9 - w : tr.x + 9;
      ctx.globalAlpha = tr.a;
      ctx.lineWidth = 3.5; ctx.strokeStyle = HALO; ctx.strokeText(tr.n.t, tx, tr.y + 0.5);
      ctx.fillStyle = INK; ctx.fillText(tr.n.t, tx, tr.y + 0.5);
      tri(tr.x, tr.y, tr.n.k);
    });
    ctx.globalAlpha = 1;
  }

  /* reduced motion: one still map, labels at full strength where they stand */
  function drawStill() { tracks.forEach(function (tr) { queue.push(tr.n); }); tracks = []; oyPrev = null; draw(0, -1); }

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

  size();
  draw(0, 0);
  function fontsReady() { if (fontsOk) return; fontsOk = true; size(); if (still) drawStill(); else draw(performance.now() - t0, 0); }
  if (document.fonts && document.fonts.load) {
    document.fonts.load(font, causes.concat(outcomes).join(' ')).then(fontsReady, fontsReady);
    setTimeout(fontsReady, 2500);
  } else fontsReady();

  var rt;
  function resized() { clearTimeout(rt); rt = setTimeout(function () { size(); if (still) drawStill(); else draw(performance.now() - t0, 0); }, 120); }
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
  /* read-only view for checks: what is on the map now */
  cv.terrainLabels = function () {
    return tracks.filter(function (tr) { return tr.a > 0.05; }).map(function (tr) {
      return {name: tr.n.t, kind: tr.n.k ? 'outcome' : 'cause', x: Math.round(tr.x), y: Math.round(tr.y), a: +tr.a.toFixed(2), box: tr.bx};
    });
  };
})();
