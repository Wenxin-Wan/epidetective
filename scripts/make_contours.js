// Writes assets/contours.svg: a still of the cover's contour field (same noise
// and levels as assets/terrain.js), for the cover without JavaScript and the
// inner-page headers. Run: node scripts/make_contours.js assets/contours.svg [W] [H]
const fs = require('fs');
const out = process.argv[2];
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 720), cell = 8, scale = 420;
const STEP = 0.065, WATER = -0.47, LOW = -0.2;
const perm = new Uint8Array(512), G = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]], p = [];
let i, s = 7;
for (i = 0; i < 256; i++) p[i] = i;
for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const r = s % (i + 1), t = p[i]; p[i] = p[r]; p[r] = t; }
for (i = 0; i < 512; i++) perm[i] = p[i & 255];
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
function n2(x, y) {
  let k = (x + y) * F2, a = Math.floor(x + k), b = Math.floor(y + k), q = (a + b) * G2, x0 = x - (a - q), y0 = y - (b - q),
      i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1, x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2, n = 0, u, g;
  a &= 255; b &= 255;
  u = 0.5 - x0 * x0 - y0 * y0; if (u > 0) { g = G[perm[a + perm[b]] & 7]; u *= u; n += u * u * (g[0] * x0 + g[1] * y0); }
  u = 0.5 - x1 * x1 - y1 * y1; if (u > 0) { g = G[perm[a + i1 + perm[b + j1]] & 7]; u *= u; n += u * u * (g[0] * x1 + g[1] * y1); }
  u = 0.5 - x2 * x2 - y2 * y2; if (u > 0) { g = G[perm[a + 1 + perm[b + 1]] & 7]; u *= u; n += u * u * (g[0] * x2 + g[1] * y2); }
  return 70 * n;
}
const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1, val = new Float32Array(cols * rows);
const ox = 0.6, oy = 0.35;
for (let y = 0, k = 0; y < rows; y++) for (let x = 0; x < cols; x++, k++) {
  const nx = x * cell / scale, ny = y * cell / scale + oy;
  const wx = n2(nx * 0.55 + 5.2 + ox * 0.4, ny * 0.55 - 1.3), wy = n2(nx * 0.55 - 7.9, ny * 0.55 + 3.1 - ox * 0.3);
  const ux = nx + 0.85 * wx, uy = ny + 0.85 * wy;
  val[k] = 0.66 * n2(ux + ox, uy) + 0.25 * n2(ux * 2.03 + 11.3 - ox * 0.7, uy * 2.03 - 4.1) + 0.09 * n2(ux * 4.3 + 3.7, uy * 4.3 + 9.2 + ox * 0.5)
           + 0.16 * (x * cell / W) - 0.056;
}
function segs(L) {
  const out = [];
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
    const i = y * cols + x, a = val[i], b = val[i + 1], c = val[i + cols + 1], e = val[i + cols];
    const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (e > L ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const X = x * cell, Y = y * cell;
    const T = [X + cell * (L - a) / (b - a), Y], R = [X + cell, Y + cell * (L - b) / (c - b)],
          B = [X + cell * (L - e) / (c - e), Y + cell], Lf = [X, Y + cell * (L - a) / (e - a)];
    switch (idx) {
      case 1: case 14: out.push([Lf, B]); break; case 2: case 13: out.push([B, R]); break;
      case 3: case 12: out.push([Lf, R]); break; case 4: case 11: out.push([T, R]); break;
      case 6: case 9: out.push([T, B]); break; case 7: case 8: out.push([T, Lf]); break;
      case 5: out.push([T, R], [Lf, B]); break; case 10: out.push([T, Lf], [B, R]); break;
    }
  }
  return out;
}
const key = p => Math.round(p[0] * 100) + ',' + Math.round(p[1] * 100);
function join(list) {
  const ends = new Map(), used = new Array(list.length).fill(false), lines = [];
  list.forEach((sg, j) => { for (const e of [0, 1]) { const k = key(sg[e]); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(j); } });
  function next(pt) { const c = ends.get(key(pt)) || []; for (const j of c) if (!used[j]) return j; return -1; }
  for (let j = 0; j < list.length; j++) {
    if (used[j]) continue;
    used[j] = true;
    let line = [list[j][0], list[j][1]];
    for (let dir = 0; dir < 2; dir++) {
      for (;;) {
        const end = line[line.length - 1], n = next(end);
        if (n < 0) break;
        used[n] = true;
        const sg = list[n];
        line.push(key(sg[0]) === key(end) ? sg[1] : sg[0]);
      }
      line.reverse();
    }
    lines.push(line);
  }
  return lines;
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  let max = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let j = 1; j < pts.length - 1; j++) {
    const d = Math.abs(dy * pts[j][0] - dx * pts[j][1] + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = j; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(dp(pts.slice(idx), tol));
}
const r = v => Math.round(v);
function d(lines) {
  return lines.filter(l => l.length > 3).map(l => {
    const q = dp(l, 0.9);
    let s = 'M' + r(q[0][0]) + ' ' + r(q[0][1]), px = r(q[0][0]), py = r(q[0][1]);
    for (let j = 1; j < q.length; j++) { const x = r(q[j][0]), y = r(q[j][1]); if (x === px && y === py) continue; s += 'l' + (x - px) + ' ' + (y - py); px = x; py = y; }
    return s;
  }).join('');
}
const groups = { brown: [], index: [], green: [], water: [] };
for (let k = -15; k <= 15; k++) {
  const L = k * STEP;
  if (L < WATER - 0.36 || Math.abs(L - WATER) < STEP / 2) continue;
  const g = L < WATER ? 'water' : k % 5 === 0 ? 'index' : L < LOW ? 'green' : 'brown';
  groups[g].push(d(join(segs(L))));
}
const shore = d(join(segs(WATER)));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
  `<path stroke="#A7835A" stroke-opacity=".5" stroke-width=".7" d="${groups.brown.join('')}"/>` +
  `<path stroke="#6E8B5B" stroke-opacity=".55" stroke-width=".7" d="${groups.green.join('')}"/>` +
  `<path stroke="#8C6840" stroke-opacity=".7" stroke-width="1.1" d="${groups.index.join('')}"/>` +
  `<path stroke="#5B88A6" stroke-opacity=".5" stroke-width=".6" d="${groups.water.join('')}"/>` +
  `<path stroke="#5B88A6" stroke-opacity=".9" stroke-width="1.1" d="${shore}"/></svg>\n`;
fs.writeFileSync(out, svg);
console.log(out, svg.length, 'bytes');
