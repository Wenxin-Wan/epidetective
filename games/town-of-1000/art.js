/* A Town of 1,000 — illustration. Flat vector in the paper-and-ink palette, all inline SVG.
   Exposes window.TownArt = { defs, title, skyline, vignette }. No raster, no external requests. */
(() => {
'use strict';
const P = {
  paper: '#F5F4F0', paperDeep: '#EBEAE3', cream: '#F0E6D2', ink: '#161713', inkSoft: '#454740',
  terra: '#ba4c38', terraLight: '#D9836F', ochre: '#d27a35', gold: '#E9B96B', teal: '#315f5a', tealLight: '#5E8A82',
  sage: '#9DB48F', sageLight: '#C9D3B8', sageDeep: '#7F9B79', dusty: '#7E97A6', dustyLight: '#DCE6EA', dustyMid: '#A9BFCB',
  rose: '#E8B4A6', plum: '#6B5B7B', wood: '#B48A5A', stone: '#B9B4A9', skin: '#E9C9A8', skin2: '#C99A72', skin3: '#8D5A3C',
};
const SKINS = [P.skin, P.skin2, P.skin3];

/* ------------------------------------------------------------------ shared defs (one per document) */
function defs() {
  return `<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
    <filter id="tg-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="tg-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="tg-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="tg-glow-sm" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs></svg>`;
}
const grain = (w, h, op = .07) => `<rect width="${w}" height="${h}" filter="url(#tg-grain)" opacity="${op}" style="mix-blend-mode:multiply" pointer-events="none"/>`;
const lg = (id, c1, c2, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;

/* ------------------------------------------------------------------ small shapes */
// Long soft shadow on the ground from a footprint (x, y) of width w, thrown to the left (dir -1) or right (+1).
function shadow(x, y, w, len, dir = -1, op = .10, blur = true) {
  return `<path d="M${x} ${y} h${w} l${dir * len} ${len * .16} h${-w}z" fill="${P.ink}" opacity="${op}" ${blur ? 'filter="url(#tg-soft)"' : ''}/>`;
}
// A woman, feet at (x, y). kind: young | mother | mid | older. About 38 units tall at scale 1.
function woman(x, y, s, o = {}) {
  const kind = o.kind || 'young', coat = o.coat || P.terra, hair = o.hair || P.ink, skin = o.skin || P.skin;
  let hairShape, body, extra = '', lean = '';
  if (kind === 'young') hairShape = `<path d="M-5.5 -35 q5.5 -7 11 0 v3 q-2 -1.5 -4 -1.5 l1.5 11 h-2.5 l-1 -10 q-2.5 .5 -5 0z" fill="${hair}"/>`;
  else if (kind === 'mother') hairShape = `<path d="M-6 -35 q6 -7.5 12 0 v6.5 q-3 -1 -6 -1 t-6 1z" fill="${hair}"/>`;
  else if (kind === 'mid') hairShape = `<path d="M-6 -35 q6 -7.5 12 0 v3 q-6 -3 -12 0z" fill="${hair}"/>`;
  else { hairShape = `<path d="M-6 -35 q6 -7.5 12 0 v4 q-6 -2.5 -12 0z" fill="#CFCAC0"/>`; lean = ' rotate(5)'; }
  if (kind === 'mid') body = `<path d="M-5.5 -27 h11 l1.5 14 h-14z" fill="${coat}"/><rect x="-5" y="-13" width="4.2" height="13" fill="${P.inkSoft}"/><rect x="1" y="-13" width="4.2" height="13" fill="${P.inkSoft}"/><path d="M6 -22 l4 1 v8 h-4z" fill="${P.wood}"/>`;
  else body = `<path d="M-5.5 -27 h11 l3 19 h-17z" fill="${coat}"/><rect x="-4" y="-8" width="3.2" height="8" fill="${P.inkSoft}"/><rect x="1" y="-8" width="3.2" height="8" fill="${P.inkSoft}"/>`;
  if (kind === 'mother') extra = `<g transform="translate(12 0)"><path d="M7 -22 l-3 8" stroke="${P.ink}" stroke-width="1.3" stroke-linecap="round"/><path d="M-7 -14 h14 v5 a7 7 0 0 1 -7 7 h-7z" fill="${o.pram || P.dusty}"/><path d="M-7 -14 a7 7 0 0 1 7 -7 h7 v7z" fill="${P.ink}" opacity=".75"/><circle cx="-4" cy="-1" r="2.2" fill="${P.ink}"/><circle cx="4" cy="-1" r="2.2" fill="${P.ink}"/></g>`;
  if (kind === 'older') extra = `<path d="M7 -21 v21" stroke="${P.wood}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})${lean}"><circle cx="0" cy="-31.5" r="4.6" fill="${skin}"/>${hairShape}${body}${extra}</g>`;
}
function cyclist(x, y, s, coat = P.terra, skin = P.skin) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-9" cy="-5" r="5" fill="none" stroke="${P.ink}" stroke-width="1.5"/><circle cx="9" cy="-5" r="5" fill="none" stroke="${P.ink}" stroke-width="1.5"/>
    <path d="M-9 -5 l5 -9 h9 l4 9 M-4 -14 l-2 -3 h5 M5 -14 l-1 -3 h4 M0 -14 l4 9" stroke="${P.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <circle cx="1" cy="-25.5" r="3.8" fill="${skin}"/><path d="M-3 -28.5 q4 -5.5 8 0 v3 h-8z" fill="${P.ink}"/>
    <path d="M-2 -22 l7 1.5 l3 7 l-4 1.2 l-3 -5 l-3 6 l-3.5 -1.2z" fill="${coat}"/></g>`;
}
function tree(x, y, s, c = P.sage, o = {}) {
  if (o.bare) return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 v-22 m0 -6 l-8 -9 m8 9 l7 -10 m-7 2 l-5 -9 m5 9 l4 -8" stroke="${P.inkSoft}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  const bloom = o.bloom ? `<circle cx="-5" cy="-24" r="2" fill="${o.bloom}"/><circle cx="6" cy="-28" r="1.8" fill="${o.bloom}"/><circle cx="1" cy="-18" r="1.6" fill="${o.bloom}"/>` : '';
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.6" y="-12" width="3.2" height="12" fill="${P.wood}"/><circle cx="-6" cy="-19" r="8" fill="${c}"/><circle cx="6" cy="-21" r="8.5" fill="${c}"/><circle cx="0" cy="-27" r="8" fill="${c}"/><circle cx="2" cy="-22" r="6" fill="${P.paper}" opacity=".12"/>${bloom}</g>`;
}
function pine(x, y, s, c = P.teal) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.5" y="-8" width="3" height="8" fill="${P.wood}"/><path d="M0 -34 l9 13 h-5 l7 10 h-6 l6 9 h-22 l6 -9 h-6 l7 -10 h-5z" fill="${c}"/></g>`;
}
// House with bottom-left corner at (x, y). Roof: gable (default), flat, or hip. Windows grid.
function house(x, y, w, h, wall, roof, o = {}) {
  const rh = o.roofH != null ? o.roofH : Math.round(w * .32);
  const sh = o.shadow === false ? '' : shadow(x, y, w, o.shadowLen || w * .8, o.dir || -1, o.shadowOp || .09, o.blur !== false);
  let top;
  if (o.roof === 'flat') top = `<rect x="${x - 2}" y="${y - h - 4}" width="${w + 4}" height="5" rx="1" fill="${roof}"/>`;
  else if (o.roof === 'hip') top = `<path d="M${x - 3} ${y - h} L${x + w * .25} ${y - h - rh} H${x + w * .75} L${x + w + 3} ${y - h}z" fill="${roof}"/>`;
  else top = `<path d="M${x - 3} ${y - h} L${x + w / 2} ${y - h - rh} L${x + w + 3} ${y - h}z" fill="${roof}"/>`;
  const chimney = o.chimney ? `<rect x="${x + w * .68}" y="${y - h - rh * .8}" width="${Math.max(3, w * .09)}" height="${rh * .7}" fill="${P.inkSoft}"/>` : '';
  let win = '';
  const cols = o.cols || Math.max(1, Math.floor(w / 14)), rows = o.rows || Math.max(1, Math.floor(h / 16));
  const ww = Math.min(7, w / (cols * 2.2)), wh = Math.min(9, h / (rows * 1.9));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = x + (w / cols) * (c + .5) - ww / 2, wy = y - h + (h / rows) * (r + .5) - wh / 2;
    win += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${ww.toFixed(1)}" height="${wh.toFixed(1)}" rx=".8" fill="${o.lit ? P.gold : P.ink}" opacity="${o.lit ? .95 : .22}"/>`;
  }
  const door = o.door ? `<rect x="${x + w * .42}" y="${y - 11}" width="${Math.max(5, w * .16)}" height="11" rx="2" fill="${o.door}"/>` : '';
  return `${sh}<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/>${top}${chimney}${win}${door}`;
}
function tower(x, y, w, h, wall, roof, o = {}) {
  return `${shadow(x, y, w, w * 1.6, -1, .09)}<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/>
    <path d="M${x - 2} ${y - h} L${x + w / 2} ${y - h - w * 1.1} L${x + w + 2} ${y - h}z" fill="${roof}"/>
    <circle cx="${x + w / 2}" cy="${y - h + w * .55}" r="${w * .28}" fill="${P.paper}" stroke="${P.ink}" stroke-width="1"/>
    <path d="M${x + w / 2} ${y - h + w * .55} v-${w * .2} m0 ${w * .2} h${w * .14}" stroke="${P.ink}" stroke-width="1"/>
    <rect x="${x + w * .38}" y="${y - h * .55}" width="${w * .24}" height="${h * .18}" rx="${w * .12}" fill="${P.ink}" opacity=".25"/>`;
}
function birds(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${P.inkSoft}" stroke-width="1.2" stroke-linecap="round"><path d="M0 0 q4 -4 8 0 M14 -6 q4 -4 8 0 M26 2 q3 -3 6 0"/></g>`;
}
function lamp(x, y, s, lit) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1" y="-30" width="2" height="30" fill="${P.inkSoft}"/><path d="M-4 -30 h8 l-1.5 -5 h-5z" fill="${P.ink}"/>${lit ? `<circle cx="0" cy="-33" r="7" fill="${P.gold}" opacity=".55" filter="url(#tg-glow-sm)"/>` : ''}</g>`;
}

/* ------------------------------------------------------------------ title illustration */
function title() {
  const W = 800, H = 560;
  const farHouses = [];
  const wallC = [P.cream, P.paper, P.rose, P.dustyLight, P.paperDeep, '#E6D7C3'];
  const roofC = [P.terra, P.ochre, P.teal, P.terraLight, P.plum, P.inkSoft];
  // three rows of houses, back to front
  const rows = [
    { y: 318, s: .62, xs: [150, 195, 232, 280, 318, 356, 402, 450, 500, 545, 590, 640] },
    { y: 350, s: .82, xs: [120, 176, 236, 300, 470, 530, 594, 660] },
    { y: 386, s: 1,   xs: [96, 170, 246, 522, 612, 690] },
  ];
  rows.forEach((row, ri) => row.xs.forEach((x, i) => {
    const w = (26 + ((i * 7 + ri * 5) % 18)) * row.s, h = (30 + ((i * 11 + ri * 3) % 26)) * row.s;
    const roofs = ['gable', 'gable', 'hip', 'flat', 'gable'];
    farHouses.push(house(x, row.y, w, h, wallC[(i + ri) % wallC.length], roofC[(i * 2 + ri) % roofC.length],
      { roof: roofs[(i + ri) % roofs.length], chimney: (i + ri) % 3 === 0, shadowLen: 26 * row.s, shadowOp: .08 - ri * .01, blur: ri === 2 }));
  }));
  const path = 'M790 486 C 660 470, 560 500, 440 478 S 200 452, 60 470';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tg-title-t" preserveAspectRatio="xMidYMid slice">
    <title id="tg-title-t">A small town seen from a hill: rooftops around a church tower, a river, a park, and women of different ages walking along a path in the foreground.</title>
    <defs>${lg('tg-sky', '#CFDDE4', '#F4EEE2')}${lg('tg-hill', '#B4C6A5', '#8FA98A')}${lg('tg-river', '#9FB6C2', '#7E97A6', false)}${lg('tg-park', '#B9CBA6', '#9DB48F')}</defs>
    <rect width="${W}" height="${H}" fill="url(#tg-sky)"/>
    <circle cx="640" cy="118" r="62" fill="${P.gold}" opacity=".45" filter="url(#tg-glow)"/>
    <circle cx="640" cy="118" r="34" fill="#F3DCA4"/>
    ${birds(150, 120, 1.1)}${birds(300, 90, .8)}
    <path d="M0 262 C 120 214, 260 236, 380 226 S 640 196, 800 236 V330 H0z" fill="#D8DFD1" opacity=".9"/>
    <path d="M0 292 C 160 256, 300 280, 460 262 S 700 236, 800 270 V340 H0z" fill="#C6D1BD"/>
    <path d="M-10 336 C 120 322, 240 344, 380 336 S 660 322, 810 338 V420 H-10z" fill="#DCD5C0"/>
    <path d="M-10 330 C 140 380, 300 372, 420 400 S 640 440, 810 456 V560 H-10z" fill="url(#tg-river)"/>
    <path d="M40 350 C 180 386, 320 380, 460 410 S 660 444, 760 452" fill="none" stroke="${P.paper}" stroke-width="3" opacity=".45"/>
    <path d="M120 366 C 240 392, 380 396, 520 424" fill="none" stroke="${P.paper}" stroke-width="1.5" opacity=".35"/>
    ${farHouses.join('')}
    ${tower(422, 386, 30, 104, P.cream, P.teal)}
    <path d="M292 396 h64 v6 h-64z" fill="${P.stone}"/><path d="M296 402 q28 -24 56 0" fill="none" stroke="${P.stone}" stroke-width="5"/>
    <path d="M560 420 C 600 396, 720 396, 780 424 S 700 446, 640 442 S 560 440, 560 420z" fill="url(#tg-park)"/>
    ${tree(590, 428, 1.1, P.sageDeep)}${tree(640, 436, 1.3, P.sage)}${tree(700, 432, 1.15, P.teal)}${pine(748, 434, 1.05)}${tree(670, 418, .9, P.sageDeep)}
    <path d="M-10 450 C 120 400, 300 470, 470 452 S 700 410, 810 460 V560 H-10z" fill="url(#tg-hill)"/>
    <path d="M-10 480 C 140 452, 260 500, 420 486 S 660 456, 810 494 V560 H-10z" fill="#95AC88"/>
    <path d="${path}" fill="none" stroke="#B8B59B" stroke-width="15" stroke-linecap="round" opacity=".35"/>
    <path d="${path}" fill="none" stroke="#EFE9D8" stroke-width="12" stroke-linecap="round"/>
    <path d="${path}" fill="none" stroke="#D3CBB2" stroke-width="1.2" stroke-dasharray="6 8" opacity=".8"/>
    ${tree(56, 462, 1.9, P.sageDeep)}${tree(770, 470, 1.6, P.teal)}
    <rect x="600" y="458" width="26" height="4" rx="1" fill="${P.wood}"/><rect x="603" y="462" width="3" height="8" fill="${P.wood}"/><rect x="620" y="462" width="3" height="8" fill="${P.wood}"/>
    ${shadow(690, 488, 9, 34, -1, .12)}${woman(694, 488, 1.45, { kind: 'young', coat: P.terra, skin: SKINS[0] })}
    ${shadow(548, 496, 9, 30, -1, .12)}${woman(548, 496, 1.4, { kind: 'mother', coat: P.teal, pram: P.ochre, skin: SKINS[2] })}
    ${shadow(428, 482, 9, 28, -1, .12)}${woman(430, 482, 1.3, { kind: 'mid', coat: P.ochre, skin: SKINS[1] })}
    ${shadow(298, 468, 9, 26, -1, .12)}${woman(300, 468, 1.22, { kind: 'older', coat: P.plum, skin: SKINS[0] })}
    ${shadow(166, 464, 18, 26, -1, .1)}${cyclist(176, 464, 1.2, P.teal, SKINS[1])}
    ${shadow(234, 462, 8, 20, -1, .1)}${woman(238, 462, 1.08, { kind: 'young', coat: P.dusty, hair: '#5B3A2A', skin: SKINS[1] })}
    ${grain(W, H, .08)}
  </svg>`;
}

/* ------------------------------------------------------------------ skyline behind the dot array, one per chapter */
const SEASONS = [
  { name: 'spring morning',    sky: ['#D6E3E9', '#F5F1E6'], sun: { x: 960, y: 62, c: '#F3DCA4', glow: .5 }, far: '#D9E0D2', mid: '#C7D3BC', ground: '#B9CBA4', tree: P.sage, bloom: P.rose, lit: false, road: '#BDB8AC' },
  { name: 'summer noon',       sky: ['#C9DDE6', '#F3EEDF'], sun: { x: 640, y: 44, c: '#F2CE7A', glow: .55 }, far: '#CBD6C1', mid: '#B7C7A8', ground: '#A9BF94', tree: P.sageDeep, lit: false, road: '#B9B4A9' },
  { name: 'late summer',       sky: ['#E3E0D3', '#F6EFDF'], sun: { x: 330, y: 72, c: '#EBB964', glow: .5 }, far: '#D6D0B8', mid: '#C4BD9E', ground: '#BEB58F', tree: '#B29A5C', lit: false, road: '#B7B0A3' },
  { name: 'autumn afternoon',  sky: ['#E8D3C2', '#F5E4D0'], sun: { x: 250, y: 96, c: P.ochre, glow: .55 }, far: '#D2C3A6', mid: '#BFAD8C', ground: '#B8A47C', tree: '#C46A3E', lit: true, road: '#B3ACA0' },
  { name: 'winter dusk',       sky: ['#8593A8', '#DCCBCB'], sun: { x: 250, y: 124, c: '#E9A070', glow: .6 }, far: '#9EA6AC', mid: '#848F97', ground: '#A3A8A0', tree: P.inkSoft, bare: true, lit: true, road: '#8E8A84' },
];
function skyline(chapter, f = {}) {
  const S = SEASONS[Math.max(0, Math.min(SEASONS.length - 1, chapter))];
  const W = 1200, H = 232, G = 172; // ground line for the house row
  const wallC = [P.cream, P.paper, P.rose, P.dustyLight, '#E6D7C3', P.paperDeep];
  const roofC = [P.terra, P.ochre, P.teal, P.terraLight, P.plum, P.inkSoft];
  const xs = [40, 104, 150, 214, 262, 330, 392, 452, 720, 790, 846, 910, 980, 1050, 1110, 1160];
  const houses = xs.map((x, i) => house(x, G, 34 + ((i * 7) % 26), 42 + ((i * 13) % 40), wallC[i % wallC.length], roofC[(i * 2) % roofC.length],
    { roof: ['gable', 'hip', 'gable', 'flat', 'gable'][i % 5], chimney: i % 3 === 1, lit: S.lit, shadowLen: 28, blur: false, dir: S.sun.x > 600 ? -1 : 1 })).join('');
  const treesX = [22, 128, 240, 300, 430, 500, 700, 780, 880, 1040, 1180];
  const trees = treesX.map((x, i) => tree(x, G + 2, .9 + (i % 3) * .15, S.tree, { bare: S.bare, bloom: S.bloom })).join('');
  // the civic centre in the middle: clinic, square with a fountain, a market, the road in front
  const clinic = `${house(560, G, 120, 70, P.paper, P.teal, { roof: 'flat', cols: 5, rows: 2, lit: S.lit, blur: false, shadowLen: 40, dir: S.sun.x > 600 ? -1 : 1 })}
    <rect x="600" y="${G - 12}" width="40" height="12" rx="1" fill="${P.teal}"/>
    ${f.clinic ? `<rect x="566" y="${G - 84}" width="108" height="12" rx="2" fill="${P.terra}"/><rect x="574" y="${G - 81}" width="52" height="6" rx="1" fill="${P.paper}" opacity=".9"/><rect x="632" y="${G - 81}" width="34" height="6" rx="1" fill="${P.paper}" opacity=".9"/>` : ''}
    <circle cx="620" cy="${G - 42}" r="9" fill="${P.paper}"/><path d="M620 ${G - 47} v10 M615 ${G - 42} h10" stroke="${P.teal}" stroke-width="2.4" stroke-linecap="round"/>`;
  const van = f.van ? `<g transform="translate(696 ${G + 14})">${shadow(-2, 0, 74, 40, S.sun.x > 600 ? -1 : 1, .12, false)}
    <rect x="0" y="-30" width="72" height="30" rx="4" fill="${P.paper}"/><rect x="0" y="-30" width="72" height="8" rx="4" fill="${P.teal}"/><rect x="0" y="-22" width="72" height="4" fill="${P.terra}"/>
    <rect x="48" y="-26" width="18" height="10" rx="2" fill="${P.dustyLight}"/><rect x="8" y="-16" width="24" height="12" rx="2" fill="${P.dustyLight}"/>
    <path d="M40 -10 q6 -8 12 0" fill="none" stroke="${P.terra}" stroke-width="2.2"/>
    <circle cx="16" cy="1" r="5" fill="${P.ink}"/><circle cx="58" cy="1" r="5" fill="${P.ink}"/><circle cx="16" cy="1" r="2" fill="${P.paper}"/><circle cx="58" cy="1" r="2" fill="${P.paper}"/></g>` : '';
  const fountain = f.fountain ? `<g transform="translate(524 ${G + 10})"><ellipse cx="0" cy="0" rx="20" ry="6" fill="${P.dustyMid}"/><ellipse cx="0" cy="-1" rx="15" ry="4" fill="${P.dustyLight}"/><rect x="-2" y="-16" width="4" height="15" fill="${P.stone}"/><path d="M0 -16 q-8 -8 -12 2 M0 -16 q8 -8 12 2 M0 -17 v-6" fill="none" stroke="${P.dustyLight}" stroke-width="2" stroke-linecap="round"/></g>` : '';
  const market = f.market ? `<g transform="translate(446 ${G + 6})">${shadow(-6, 0, 52, 24, S.sun.x > 600 ? -1 : 1, .1, false)}
    <rect x="-6" y="-14" width="52" height="14" fill="${P.wood}"/><path d="M-10 -14 h60 l-4 -14 h-52z" fill="${P.terra}"/><path d="M-10 -14 h60" stroke="${P.paper}" stroke-width="2" stroke-dasharray="6 6"/>
    <rect x="-8" y="-40" width="2.4" height="26" fill="${P.wood}"/><rect x="46" y="-40" width="2.4" height="26" fill="${P.wood}"/>
    <circle cx="4" cy="-17" r="3.4" fill="${P.ochre}"/><circle cx="12" cy="-17" r="3.4" fill="${P.terraLight}"/><circle cx="20" cy="-17" r="3.4" fill="${P.sageDeep}"/><circle cx="28" cy="-17" r="3.4" fill="${P.ochre}"/><circle cx="36" cy="-17" r="3.4" fill="${P.terra}"/></g>` : '';
  const sport = f.sport ? `<g transform="translate(812 ${G - 96})"><rect x="0" y="0" width="2.4" height="40" fill="${P.inkSoft}"/><path d="M2 2 l26 6 l-26 6z" fill="${P.teal}"/></g>` : '';
  const laneY = G + 30;
  const cycle = f.cycle ? `<rect x="0" y="${laneY}" width="${W}" height="8" fill="${P.teal}" opacity=".85"/><path d="M0 ${laneY + 4} H${W}" stroke="${P.paper}" stroke-width="1.2" stroke-dasharray="14 12" opacity=".8"/>
    ${cyclist(340, laneY + 8, .8, P.terra, SKINS[1])}${cyclist(880, laneY + 8, .8, P.plum, SKINS[0])}` : '';
  const walkers = f.walkers ? `${woman(846, G + 16, .78, { kind: 'older', coat: P.plum, skin: SKINS[0] })}${woman(866, G + 16, .8, { kind: 'older', coat: P.teal, skin: SKINS[1] })}${woman(888, G + 16, .78, { kind: 'older', coat: P.ochre, skin: SKINS[2] })}` : '';
  const people = `${woman(650, G + 16, .8, { kind: 'young', coat: P.terra, skin: SKINS[2] })}${woman(390, G + 16, .82, { kind: 'mother', coat: P.dusty, pram: P.ochre, skin: SKINS[0] })}${woman(770, G + 16, .78, { kind: 'mid', coat: P.teal, skin: SKINS[1] })}`;
  const lamps = `${lamp(500, G + 16, .9, S.lit)}${lamp(740, G + 16, .9, S.lit)}${lamp(1000, G + 16, .9, S.lit)}${lamp(240, G + 16, .9, S.lit)}`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice" role="img" aria-label="The town skyline, ${S.name}">
    <defs>${lg('tg-sk-sky', S.sky[0], S.sky[1])}</defs>
    <rect width="${W}" height="${H}" fill="url(#tg-sk-sky)"/>
    <circle cx="${S.sun.x}" cy="${S.sun.y}" r="70" fill="${S.sun.c}" opacity="${S.sun.glow}" filter="url(#tg-glow)"/>
    <circle cx="${S.sun.x}" cy="${S.sun.y}" r="30" fill="${S.sun.c}"/>
    ${chapter < 4 ? birds(760, 60, .9) + birds(200, 44, .7) : ''}
    <path d="M0 122 C 150 92, 300 114, 460 100 S 760 72, 900 98 S 1100 84, 1200 106 V190 H0z" fill="${S.far}" opacity=".9"/>
    <path d="M0 146 C 200 124, 360 142, 560 130 S 900 108, 1200 140 V190 H0z" fill="${S.mid}"/>
    <rect x="0" y="${G - 2}" width="${W}" height="${H - G + 2}" fill="${S.ground}"/>
    ${houses}${clinic}${sport}${trees}
    <rect x="0" y="${G + 18}" width="${W}" height="24" fill="${S.road}"/>
    ${lamps}${fountain}${market}${people}${walkers}${cycle}${van}
    ${grain(W, H, .07)}
  </svg>`;
}

/* ------------------------------------------------------------------ card vignettes, 120 × 80 */
function vig(inner, sky1, sky2, label) {
  const id = 'tg-v-' + Math.random().toString(36).slice(2, 7);
  return `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" class="vig" preserveAspectRatio="xMidYMid slice"><defs>${lg(id, sky1, sky2)}</defs><rect width="120" height="80" fill="url(#${id})"/>${inner}${grain(120, 80, .08)}</svg>`;
}
const VIGNETTES = {
  alcohol: () => vig(`
    <rect x="0" y="58" width="120" height="22" fill="#4A4A48"/>
    ${shadow(30, 58, 60, 40, 1, .18, false)}
    <rect x="30" y="14" width="60" height="44" fill="#2E2E2B"/><path d="M26 14 h68 v-4 h-68z" fill="${P.terra}"/>
    <rect x="36" y="20" width="18" height="16" rx="1" fill="${P.gold}" opacity=".95"/><rect x="66" y="20" width="18" height="16" rx="1" fill="${P.gold}" opacity=".95"/>
    <rect x="52" y="40" width="16" height="18" rx="1" fill="${P.gold}" opacity=".9"/><rect x="34" y="40" width="14" height="10" rx="1" fill="${P.paper}"/><rect x="72" y="40" width="14" height="10" rx="1" fill="${P.paper}"/>
    <path d="M38 48 h6 M40 43 v5 M76 48 h6 M78 43 v5" stroke="${P.terra}" stroke-width="1.4"/>
    <rect x="40" y="24" width="10" height="8" fill="#2E2E2B" opacity=".35"/><rect x="70" y="24" width="10" height="8" fill="#2E2E2B" opacity=".35"/>
    ${lamp(14, 58, 1, true)}${lamp(106, 58, 1, true)}
    ${woman(96, 62, .7, { kind: 'young', coat: P.terra, skin: SKINS[2] })}${woman(20, 63, .7, { kind: 'young', coat: P.plum, skin: SKINS[0] })}
    <circle cx="20" cy="10" r="4" fill="${P.paper}" opacity=".9"/>`, '#2F3A4B', '#6B5B7B', 'A bar on the high street at night, windows lit'),
  moving: () => vig(`
    <path d="M0 36 C 30 26, 60 34, 120 28 V60 H0z" fill="${P.sageLight}"/>
    ${tree(18, 46, .8, P.sageDeep)}${tree(100, 44, .9, P.sage)}${tree(62, 42, .7, P.teal)}
    <rect x="0" y="48" width="120" height="32" fill="${P.stone}"/>
    <rect x="0" y="60" width="120" height="8" fill="${P.teal}"/><path d="M0 64 H120" stroke="${P.paper}" stroke-width="1" stroke-dasharray="6 5" opacity=".8"/>
    ${shadow(40, 70, 18, 24, -1, .14, false)}${cyclist(48, 70, .95, P.terra, SKINS[1])}
    ${lamp(88, 60, .8, false)}${woman(106, 62, .6, { kind: 'mid', coat: P.ochre, skin: SKINS[0] })}`, '#DCE6EA', '#F5F4F0', 'A road with a teal cycle lane, a cyclist and trees'),
  parents: () => vig(`
    <rect x="0" y="60" width="120" height="20" fill="${P.sageLight}"/>
    ${shadow(26, 60, 68, 30, -1, .12, false)}
    <rect x="26" y="16" width="68" height="44" fill="${P.cream}"/><rect x="22" y="12" width="76" height="5" rx="1" fill="${P.teal}"/>
    <rect x="34" y="24" width="14" height="12" rx="1" fill="${P.dustyLight}"/><rect x="54" y="24" width="14" height="12" rx="1" fill="${P.dustyLight}"/><rect x="74" y="24" width="14" height="12" rx="1" fill="${P.dustyLight}"/>
    <rect x="52" y="44" width="16" height="16" rx="2" fill="${P.teal}"/><circle cx="60" cy="40" r="6" fill="${P.paper}"/><path d="M57 40 q3 -4 6 0 q-3 4 -6 0z" fill="${P.terra}"/>
    ${tree(12, 62, .8, P.sage, { bloom: P.rose })}${tree(110, 62, .75, P.sageDeep)}
    ${woman(90, 68, .72, { kind: 'mother', coat: P.terra, pram: P.dusty, skin: SKINS[1] })}`, '#E3E9E1', '#F5F1E6', 'A maternity unit with a mother and pram outside'),
  viral: () => vig(`
    <g transform="translate(46 8) rotate(-6)">${shadow(2, 70, 34, 30, 1, .14, false)}
      <rect x="0" y="0" width="36" height="66" rx="6" fill="${P.ink}"/><rect x="3" y="5" width="30" height="56" rx="3" fill="${P.paper}"/>
      <circle cx="10" cy="14" r="3.4" fill="${P.dusty}"/><rect x="16" y="11" width="14" height="2.2" rx="1" fill="${P.inkSoft}"/><rect x="16" y="15" width="9" height="2" rx="1" fill="${P.stone}"/>
      <rect x="6" y="22" width="24" height="16" rx="2" fill="${P.rose}"/><rect x="9" y="25" width="18" height="2" rx="1" fill="${P.paper}"/><rect x="9" y="29" width="14" height="2" rx="1" fill="${P.paper}"/><rect x="9" y="33" width="16" height="2" rx="1" fill="${P.paper}"/>
      <rect x="6" y="42" width="22" height="2.2" rx="1" fill="${P.stone}"/><rect x="6" y="46" width="18" height="2.2" rx="1" fill="${P.stone}"/>
      <path d="M8 55 l2.5 -3 h5 l2.5 3 l-5 5z" fill="${P.terra}"/><path d="M20 55 h8 M20 58 h6" stroke="${P.stone}" stroke-width="2"/></g>
    <path d="M22 26 q0 -5 5 -5 q5 0 5 5 q0 5 -5 9 q-5 -4 -5 -9z" fill="${P.terra}" opacity=".9"/>
    <path d="M94 40 q0 -4 4 -4 q4 0 4 4 q0 4 -4 7 q-4 -3 -4 -7z" fill="${P.terra}" opacity=".7"/>
    <path d="M100 18 l8 6 l-8 6 v-4 h-8 v-4 h8z" fill="${P.dusty}"/><path d="M14 50 l7 5 l-7 5 v-3 h-7 v-4 h7z" fill="${P.dusty}" opacity=".8"/>
    <circle cx="30" cy="66" r="2.4" fill="${P.ochre}"/><circle cx="106" cy="64" r="2" fill="${P.ochre}"/>`, '#EBEAE3', '#F5F4F0', 'A phone showing a viral post, with hearts and share arrows'),
  food: () => vig(`
    <rect x="0" y="0" width="120" height="52" fill="${P.cream}"/><rect x="0" y="52" width="120" height="28" fill="${P.stone}"/>
    <rect x="14" y="10" width="24" height="18" rx="1" fill="${P.dustyLight}"/><path d="M26 10 v18 M14 19 h24" stroke="${P.cream}" stroke-width="1.5"/>
    <rect x="84" y="8" width="24" height="44" rx="2" fill="${P.dustyLight}"/><rect x="86" y="10" width="20" height="40" rx="1" fill="${P.dustyMid}" opacity=".6"/>
    <rect x="89" y="14" width="4" height="9" rx="1" fill="${P.terra}"/><rect x="95" y="14" width="4" height="9" rx="1" fill="${P.ochre}"/><rect x="101" y="14" width="4" height="9" rx="1" fill="${P.terra}"/>
    <rect x="89" y="28" width="4" height="9" rx="1" fill="${P.dusty}"/><rect x="95" y="28" width="4" height="9" rx="1" fill="${P.dusty}"/><rect x="101" y="28" width="4" height="9" rx="1" fill="${P.dusty}"/>
    ${shadow(10, 58, 62, 26, 1, .12, false)}
    <rect x="10" y="40" width="62" height="6" rx="1" fill="${P.wood}"/><rect x="14" y="46" width="4" height="14" fill="${P.wood}"/><rect x="64" y="46" width="4" height="14" fill="${P.wood}"/>
    <rect x="18" y="34" width="18" height="6" rx="1" fill="${P.paper}"/><rect x="42" y="34" width="18" height="6" rx="1" fill="${P.paper}"/>
    <circle cx="24" cy="32" r="3.5" fill="${P.terra}"/><circle cx="31" cy="33" r="3" fill="${P.ochre}"/><path d="M45 34 h12 l-2 -6 h-8z" fill="${P.gold}"/>
    <circle cx="52" cy="26" r="3" fill="${P.sageDeep}"/>
    ${woman(38, 74, .6, { kind: 'young', coat: P.dusty, skin: SKINS[2] })}${woman(58, 74, .58, { kind: 'mid', coat: P.terra, skin: SKINS[0] })}`, '#F0E6D2', '#F5F4F0', 'A school canteen with a fruit table and a drinks fridge'),
  beach: () => vig(`
    <rect x="0" y="34" width="120" height="22" fill="${P.dusty}"/><path d="M0 40 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="${P.dustyLight}" stroke-width="1.5" opacity=".8"/>
    <path d="M0 52 C 30 46, 70 60, 120 50 V80 H0z" fill="#EBDBB8"/>
    ${shadow(74, 72, 6, 30, -1, .12, false)}
    <path d="M52 44 a20 20 0 0 1 40 0z" fill="${P.terra}"/><path d="M60 44 a12 20 0 0 1 24 0z" fill="${P.paper}"/><path d="M66 44 a6 20 0 0 1 12 0z" fill="${P.terra}"/><rect x="71" y="44" width="2" height="28" fill="${P.inkSoft}"/>
    <rect x="24" y="40" width="2.4" height="32" fill="${P.wood}"/><rect x="14" y="30" width="22" height="16" rx="2" fill="${P.paper}" stroke="${P.ink}" stroke-width="1"/>
    <circle cx="25" cy="38" r="5" fill="none" stroke="${P.terra}" stroke-width="1.8"/><path d="M21 34 l8 8" stroke="${P.terra}" stroke-width="1.8"/><rect x="22" y="37" width="6" height="2" fill="${P.ink}"/>
    <circle cx="100" cy="12" r="9" fill="${P.gold}"/>
    ${woman(100, 72, .62, { kind: 'young', coat: P.dusty, skin: SKINS[1] })}${woman(44, 70, .55, { kind: 'mid', coat: P.ochre, skin: SKINS[2] })}
    ${birds(40, 14, .7)}`, '#CFE0EA', '#F3EEDF', 'A beach with an umbrella and a no-smoking sign'),
  clinic: () => vig(`
    <rect x="0" y="60" width="120" height="20" fill="${P.sageLight}"/>
    ${shadow(22, 60, 76, 30, -1, .12, false)}
    <rect x="22" y="14" width="76" height="46" fill="${P.paper}"/><rect x="18" y="10" width="84" height="5" rx="1" fill="${P.teal}"/>
    <rect x="30" y="22" width="14" height="12" rx="1" fill="${P.dustyLight}"/><rect x="76" y="22" width="14" height="12" rx="1" fill="${P.dustyLight}"/>
    <rect x="52" y="34" width="16" height="26" rx="2" fill="${P.teal}"/><rect x="55" y="38" width="10" height="8" rx="1" fill="${P.dustyLight}"/>
    <rect x="48" y="16" width="24" height="12" rx="2" fill="${P.cream}" stroke="${P.teal}" stroke-width="1"/><path d="M60 18 v8 M56 22 h8" stroke="${P.teal}" stroke-width="2" stroke-linecap="round"/>
    <rect x="30" y="52" width="8" height="8" rx="1" fill="${P.terra}"/><path d="M34 52 q-4 -6 0 -10 q4 4 0 10z" fill="${P.sageDeep}"/>
    ${tree(10, 62, .8, P.sage)}
    ${woman(88, 68, .72, { kind: 'mid', coat: P.terra, skin: SKINS[0] })}${woman(104, 66, .6, { kind: 'older', coat: P.plum, skin: SKINS[2] })}`, '#DCE6EA', '#F5F1E6', 'A clinic with a teal door and two women outside'),
  screening: () => vig(`
    <rect x="0" y="58" width="120" height="22" fill="${P.stone}"/>
    ${tree(10, 60, .9, P.sage)}${tree(112, 60, .8, P.sageDeep)}
    ${shadow(24, 66, 72, 34, -1, .14, false)}
    <g transform="translate(24 36)"><rect x="0" y="0" width="72" height="30" rx="4" fill="${P.paper}"/><rect x="0" y="0" width="72" height="8" rx="4" fill="${P.teal}"/><rect x="0" y="8" width="72" height="4" fill="${P.terra}"/>
      <rect x="48" y="4" width="18" height="10" rx="2" fill="${P.dustyLight}"/><rect x="8" y="14" width="24" height="12" rx="2" fill="${P.dustyLight}"/>
      <path d="M40 20 q6 -8 12 0" fill="none" stroke="${P.terra}" stroke-width="2.2"/>
      <circle cx="16" cy="31" r="5" fill="${P.ink}"/><circle cx="58" cy="31" r="5" fill="${P.ink}"/><circle cx="16" cy="31" r="2" fill="${P.paper}"/><circle cx="58" cy="31" r="2" fill="${P.paper}"/></g>
    <g fill="${P.paper}" stroke="${P.inkSoft}" stroke-width=".8"><rect x="14" y="10" width="14" height="9" rx="1" transform="rotate(-8 21 14)"/><rect x="40" y="6" width="14" height="9" rx="1" transform="rotate(6 47 10)"/><rect x="66" y="12" width="14" height="9" rx="1" transform="rotate(-4 73 16)"/></g>
    <path d="M14 10 l7 5 l7 -5" fill="none" stroke="${P.inkSoft}" stroke-width=".8" transform="rotate(-8 21 14)"/><path d="M40 6 l7 5 l7 -5" fill="none" stroke="${P.inkSoft}" stroke-width=".8" transform="rotate(6 47 10)"/><path d="M66 12 l7 5 l7 -5" fill="none" stroke="${P.inkSoft}" stroke-width=".8" transform="rotate(-4 73 16)"/>
    ${woman(106, 70, .62, { kind: 'mid', coat: P.terra, skin: SKINS[1] })}`, '#D6E3E9', '#F5F4F0', 'A screening van with invitation letters in the air'),
  active60: () => vig(`
    <path d="M0 30 C 30 22, 70 32, 120 26 V50 H0z" fill="${P.sageLight}"/>
    <rect x="70" y="30" width="44" height="14" rx="2" fill="${P.dustyLight}"/><path d="M72 37 h40" stroke="${P.paper}" stroke-width="1.2" stroke-dasharray="4 3"/>
    ${tree(14, 40, .9, P.sageDeep)}${tree(58, 36, .8, P.sage)}${tree(112, 34, .7, P.teal)}
    <rect x="0" y="48" width="120" height="32" fill="${P.sage}"/><path d="M0 62 C 30 56, 80 68, 120 60" fill="none" stroke="#EDE7D6" stroke-width="9" stroke-linecap="round"/>
    ${shadow(28, 72, 30, 22, -1, .12, false)}
    ${woman(34, 72, .78, { kind: 'older', coat: P.plum, skin: SKINS[0] })}${woman(52, 70, .8, { kind: 'older', coat: P.teal, skin: SKINS[2] })}${woman(70, 71, .78, { kind: 'older', coat: P.ochre, skin: SKINS[1] })}
    ${woman(92, 66, .62, { kind: 'mid', coat: P.terra, skin: SKINS[0] })}`, '#DCE6EA', '#F5F1E6', 'A walking group of older women in a park with a pool behind'),
  normal: () => vig(`
    <rect x="0" y="0" width="120" height="80" fill="${P.dustyLight}"/><rect x="0" y="56" width="120" height="24" fill="${P.paperDeep}"/>
    <rect x="14" y="44" width="92" height="3" rx="1" fill="${P.stone}"/>
    <rect x="18" y="32" width="5" height="12" rx="1.5" fill="${P.teal}"/><rect x="26" y="35" width="4" height="9" rx="1.5" fill="${P.ochre}"/><rect x="92" y="34" width="6" height="10" rx="2" fill="${P.terra}"/>
    <path d="M100 44 q-3 -8 3 -12 q5 4 2 12z" fill="${P.sageDeep}"/>
    <circle cx="60" cy="30" r="22" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.4"/><circle cx="60" cy="30" r="19" fill="${P.paper}" stroke="${P.stone}" stroke-width="1"/>
    <path d="M60 22 a5.5 5.5 0 1 1 -.1 0z" fill="${P.skin2}"/><path d="M53 22 q7 -8 14 0 v5 q-7 -4 -14 0z" fill="${P.ink}"/><path d="M49 49 q11 -14 22 0z" fill="${P.terra}"/>
    <path d="M44 16 q10 -8 20 -4" fill="none" stroke="${P.paper}" stroke-width="2" opacity=".9"/>
    ${woman(30, 78, .68, { kind: 'mid', coat: P.terra, hair: '#5B3A2A', skin: SKINS[1] })}`, '#DCE6EA', '#EBEAE3', 'A round mirror on a bathroom wall with a woman looking into it'),
};
function vignette(id) { const f = VIGNETTES[id]; return f ? f() : ''; }

window.TownArt = { defs, title, skyline, vignette, seasons: SEASONS.map(s => s.name) };
})();
