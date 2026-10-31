#!/usr/bin/env node
/*
  make_og.mjs: the share images and the game card images of epidetective.com.

    node scripts/make_og.mjs                  14 share images + 3 game cards
    node scripts/make_og.mjs og               the 14 share images (assets/og/*.png)
    node scripts/make_og.mjs games            the 3 game cards (assets/games/*-card.webp)
    node scripts/make_og.mjs og --only home-fr,cancer
    node scripts/make_og.mjs --out DIR        write the share images to DIR instead of assets/og (a trial run)
    node scripts/make_og.mjs --sheet DIR      also write contact sheets (of assets/og) to DIR
    node scripts/make_og.mjs --report FILE    also write the layout measurements as JSON
    node scripts/make_og.mjs --home-from-i18n take the five home titles from i18n/<lang>.json (home_h1)
    node scripts/make_og.mjs --check          no rendering: report where the home titles here and in
                                              i18n/<lang>.json home_h1 differ
    node scripts/make_og.mjs map --map FILE   no rendering: write the page -> image map with the alt texts
                                              in five languages (JSON) that build_site.py's OG_IMAGES follows

  Share images: scripts/og-template.html rendered with Playwright (Chrome) at 1200x630,
  one PNG per card, then reduced to a palette PNG with libimagequant (through sharp)
  so each file stays under 200 KB. Every card carries the wordmark, the page title,
  "A personal project by Wenxin Wan" and, where the page shows data, the source line.
  It carries no audience line. The home card exists in the five site languages; the
  other pages share one English card, as the plan says.

  Game cards: the 960x540 *-card.jpg art (captured from the running games) scaled to
  720x405 and written as WebP next to it, under 60 KB each. Retake the JPEG when a
  game's look changes, then run `node scripts/make_og.mjs games`.

  Run it from anywhere; it needs Playwright and sharp. It looks for them in the
  normal module path, then in ../presentation-assets/scripts/node_modules (override
  with EPI_NODE_MODULES=/path/to/node_modules). The images are committed, so the
  site build and the GitHub Action never run this script.

  The only fixed inputs besides the games' JPEGs are the site's fonts and the two
  network SVGs under assets/, which the template loads from a private local server.
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');                       // design/
const OG_DIR = process.argv.includes('--out') ? path.resolve(process.argv[process.argv.indexOf('--out') + 1]) : path.join(SITE, 'assets', 'og');
const GAMES_DIR = path.join(SITE, 'assets', 'games');
const MAX_PNG = 200 * 1000;                                  // "under 200 KB", in bytes
const MAX_WEBP = 60 * 1000;
const W = 1200, H = 630;

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n);
const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const mode = ['og', 'games', 'sheet', 'map', 'all'].find((m) => argv.includes(m)) || 'all';
const only = val('--only') ? new Set(val('--only').split(',')) : null;

/* ------------------------------------------------------------------ text -- */

const LANGS = ['en', 'zh', 'fr', 'es', 'ru'];
const NB = String.fromCharCode(0xa0);                      // no-break space, as the site's French strings use before : ? ;

const PERSONAL = {
  en: 'A personal project by Wenxin Wan',
  zh: '万汶鑫的个人项目',
  fr: 'Un projet personnel de Wenxin Wan',
  es: 'Un proyecto personal de Wenxin Wan',
  ru: 'Личный проект Вэньсинь Вань',
};

/* The data-source line. The IARC and review lines are the ones the tools' own gate
   shows (gateWho in app/app_template.html and app/chronic_template.html). */
const SRC = {
  iarc: {
    en: 'Data: IARC Monographs', zh: '数据：《IARC 致癌物专论》', fr: `Données${NB}: Monographies du CIRC`,
    es: 'Datos: Monografías del CIIC', ru: 'Данные: Монографии МАИР',
  },
  reviews: {
    en: 'Data: published reviews and meta-analyses', zh: '数据：已发表的综述和荟萃分析',
    fr: `Données${NB}: revues et méta-analyses publiées`, es: 'Datos: revisiones y metaanálisis publicados',
    ru: 'Данные: опубликованные обзоры и метаанализы',
  },
  both: {
    en: 'Data: IARC Monographs, published reviews and meta-analyses',
    zh: '数据：《IARC 致癌物专论》、已发表的综述和荟萃分析',
    fr: `Données${NB}: Monographies du CIRC, revues et méta-analyses publiées`,
    es: 'Datos: Monografías del CIIC, revisiones y metaanálisis publicados',
    ru: 'Данные: Монографии МАИР, опубликованные обзоры и метаанализы',
  },
  games: {
    en: 'Sources: IARC, WHO, the European Code Against Cancer and published studies',
    zh: '来源：IARC、WHO、《欧洲防癌守则》和已发表的研究',
    fr: `Sources${NB}: CIRC, OMS, Code européen contre le cancer et études publiées`,
    es: 'Fuentes: CIIC, OMS, Código Europeo contra el Cáncer y estudios publicados',
    ru: 'Источники: МАИР, ВОЗ, Европейский кодекс против рака и опубликованные исследования',
  },
  code: {
    en: 'Source: the official Codes Against Cancer (IARC and partners)',
    zh: '来源：官方防癌守则（IARC 及其合作伙伴）',
    fr: `Source${NB}: les Codes officiels contre le cancer (CIRC et partenaires)`,
    es: 'Fuente: los Códigos oficiales contra el Cáncer (CIIC y socios)',
    ru: 'Источник: официальные кодексы против рака (МАИР и партнёры)',
  },
};

/* The home title is the home page's h1 (plan, Batch 6: home_h1). <i> marks the
   emphasised words, which the page sets in italic (bold in Chinese). */
const HOME_TITLE = {
  en: 'What causes cancer and other chronic diseases, and <i>how sure the evidence is</i>',
  zh: '什么会导致癌症和其他慢性病，<br>以及<i>证据有多可靠</i>',
  fr: 'Ce qui provoque le cancer et d’autres maladies chroniques, et <i>la solidité des preuves</i>',
  es: 'Qué causa el cáncer y otras enfermedades crónicas, y <i>qué solidez tiene la evidencia</i>',
  ru: 'Что вызывает рак и другие хронические заболевания, и <i>насколько надёжны доказательства</i>',
};

/* The other pages: kicker (small label above the title) and title, by language.
   The image shows the English text; the other languages are for the alt texts. */
const PAGES = [
  { id: 'explorer', file: 'explorer.png', page: 'explorer.html', art: 'cancer', src: 'iarc',
    t: {
      en: ['', 'Cancer Evidence Explorer'],
      zh: ['', '癌症证据探索器'],
      fr: ['', 'Explorateur des preuves sur le cancer'],
      es: ['', 'Explorador de evidencia sobre el cáncer'],
      ru: ['', 'Атлас доказательств: рак'],
    } },
  { id: 'reading', file: 'reading.png', page: 'reading.html', art: 'cancer', src: 'both',
    t: {
      en: ['Seven ideas', 'How to read health evidence'],
      zh: ['七个概念', '如何读懂健康证据'],
      fr: ['Sept idées', 'Comment lire les preuves en santé'],
      es: ['Siete ideas', 'Cómo leer la evidencia en salud'],
      ru: ['Семь идей', 'Как читать научные данные о здоровье'],
    } },
  { id: 'about', file: 'about.png', page: 'about.html', art: 'cancer', src: 'both',
    t: {
      en: ['Cancer epidemiologist', 'About Wenxin Wan'],
      zh: ['癌症流行病学研究者', '关于万汶鑫'],
      fr: ['Épidémiologiste du cancer', 'À propos de Wenxin Wan'],
      es: ['Epidemiólogo del cáncer', 'Sobre Wenxin Wan'],
      ru: ['Онкоэпидемиолог', 'О Вэньсинь Вань'],
    } },
  { id: 'games', file: 'games.png', page: 'games.html', art: 'games', src: 'games', titleMax: 1056, maxLines: 1, maxSize: 76, air: 24,
    row: ['/assets/games/sun-safety-card.webp', '/assets/games/lung-detective-card.webp', '/assets/games/town-of-1000-card.webp'],
    t: {
      en: ['Skin, lung and breast', 'Cancer awareness games'],
      zh: ['皮肤癌、肺癌与乳腺癌', '防癌小游戏'],
      fr: ['Peau, poumon et sein', 'Jeux de sensibilisation au cancer'],
      es: ['Piel, pulmón y mama', 'Juegos sobre el cáncer'],
      ru: ['Кожа, лёгкие и грудь', 'Игры о профилактике рака'],
    } },
  { id: 'code', file: 'code.png', page: 'code-against-cancer/index.html', art: 'cancer', src: 'code',
    t: {
      en: ['Summary of the official Codes', 'Code Against Cancer'],
      zh: ['官方防癌守则摘要', '防癌守则'],
      fr: ['Résumé des Codes officiels', 'Code contre le cancer'],
      es: ['Resumen de los Códigos oficiales', 'Código contra el cáncer'],
      ru: ['Краткое изложение официальных кодексов', 'Кодекс против рака'],
    } },
  { id: 'work', file: 'work.png', page: 'work.html', art: 'cancer', src: 'iarc',
    t: {
      en: ['What IARC has found, sector by sector', 'Work and cancer'],
      zh: ['IARC 的结论，按行业一览', '工作与癌症'],
      fr: ['Ce que le CIRC a établi, secteur par secteur', 'Travail et cancer'],
      es: ['Lo que ha encontrado el CIIC, sector por sector', 'Trabajo y cáncer'],
      ru: ['Что установило МАИР, отрасль за отраслью', 'Работа и рак'],
    } },
  { id: 'how-we-check', file: 'how-we-check.png', page: 'how-we-check.html', art: 'cancer', src: 'both',
    t: {
      en: ['Sources, versions and corrections', 'How we check'],
      zh: ['来源、版本与更正', '我们如何核查'],
      fr: ['Sources, versions et corrections', 'Comment nous vérifions'],
      es: ['Fuentes, versiones y correcciones', 'Cómo verificamos'],
      ru: ['Источники, версии и исправления', 'Как мы проверяем данные'],
    } },
  /* the two tools: their own titles (docTitle) and their own address */
  { id: 'cancer', file: 'cancer.png', page: 'tools:cancer', art: 'cancer', src: 'iarc', domain: 'tools.epidetective.com',
    t: {
      en: ['Cancer Evidence Explorer', 'What’s linked to cancer?'],
      zh: ['癌症证据探索器', '什么与癌症有关？'],
      fr: ['Explorateur des preuves sur le cancer', `Qu’est-ce qui est lié au cancer${NB}?`],
      es: ['Explorador de evidencia sobre el cáncer', '¿Qué está relacionado con el cáncer?'],
      ru: ['Атлас доказательств: рак', 'Что связано с раком?'],
    } },
  { id: 'chronic', file: 'chronic.png', page: 'tools:chronic', art: 'chronic', src: 'reviews', domain: 'tools.epidetective.com',
    t: {
      en: ['Chronic Disease Evidence Explorer', 'What affects the risk of chronic disease'],
      zh: ['慢性病证据图谱', '影响慢性病风险的因素'],
      fr: [`Atlas des preuves${NB}: maladies chroniques`, 'Ce qui influence le risque de maladie chronique'],
      es: ['Atlas de evidencia: enfermedades crónicas', 'Qué influye en el riesgo de las enfermedades crónicas'],
      ru: ['Атлас доказательств: хронические болезни', 'От чего зависит риск хронических болезней'],
    } },
];

const plain = (html) => html.replace(/<[^>]+>/g, '');
const lead = 'EpiDetective';

/* Alt text = the words on the card, in reading order, in the page's language. */
function altText(lang, kicker, title, srcKey) {
  const zh = lang === 'zh';
  const parts = [lead, kicker, plain(title), PERSONAL[lang], SRC[srcKey][lang]].filter(Boolean).map((p) => p.trim());
  const end = /[.!?。！？]$/;
  return parts.map((p, i) => {
    const last = i === parts.length - 1;
    if (end.test(p)) return p + (last || zh ? '' : ' ');
    return p + (zh ? '。' : last ? '.' : '. ');
  }).join('');
}

/* ---- the card list: 5 home cards, then the 9 others ---- */
function buildCards(homeTitles) {
  const cards = [];
  for (const lang of LANGS) {
    cards.push({
      id: `home-${lang}`, file: `home-${lang}.png`, lang, art: 'cancer', kicker: '',
      title: homeTitles[lang], personal: PERSONAL[lang], source: SRC.both[lang], domain: 'epidetective.com',
      page: 'index.html', src: 'both',
      /* Chinese breaks after the comma, so it takes two lines and a wider box */
      ...(lang === 'zh' ? { maxLines: 2, titleMax: 1056 } : {}),
    });
  }
  for (const p of PAGES) {
    const [k, t] = p.t.en;
    cards.push({
      id: p.id, file: p.file, lang: 'en', art: p.art, kicker: k, title: t, personal: PERSONAL.en,
      source: SRC[p.src].en, domain: p.domain || 'epidetective.com', titleMax: p.titleMax, maxLines: p.maxLines,
      maxSize: p.maxSize, row: p.row, air: p.air, page: p.page, src: p.src,
    });
  }
  return cards;
}

/* The words on the cards and in the alt texts follow the site's writing rules: no audience
   line, no em dash, no "X, not Y". The build stops when one slips in. */
function guardText(cards) {
  const bad = [[/curious public|clinicians|journalists|patients|关心健康的普通读者|临床医生|public curieux|público curioso|любознательных/i, 'an audience line'],
    [/\u2014/, 'an em dash'], [/,\s+not\s+/i, '"X, not Y"']];
  const seen = [];
  for (const c of cards) seen.push([c.id, [c.kicker, plain(c.title), c.personal, c.source, c.domain].join(' | ')]);
  for (const p of PAGES) for (const l of LANGS) seen.push([`${p.id} alt ${l}`, altText(l, p.t[l][0], p.t[l][1], p.src)]);
  for (const g of GAME_CARDS) for (const l of LANGS) seen.push([`${g.id} alt ${l}`, g.alt[l]]);
  const hits = [];
  for (const [id, text] of seen) for (const [re, what] of bad) if (re.test(text)) hits.push(`${id}: ${what}`);
  if (hits.length) throw new Error('writing rules broken:\n  ' + hits.join('\n  '));
}

/* ------------------------------------------------------------ game cards -- */

const GAME_CARDS = [
  { id: 'sun-safety', jpg: 'sun-safety-card.jpg', webp: 'sun-safety-card.webp', name: 'Sol & the UV Shield Quest',
    alt: {
      en: 'Sol & the UV Shield Quest: Sol, a child with spiky orange hair, stands on a grassy platform among sun coins and a star, with a straw hat on a post nearby and a big yellow sun in the sky.',
      zh: 'Sol & the UV Shield Quest：小主角 Sol 有一头根根竖起的橙色头发，站在草地平台上，周围是太阳金币和一颗星星，旁边立着一顶草帽，天上挂着一轮大太阳。',
      fr: 'Sol & the UV Shield Quest : Sol, un enfant aux cheveux orange dressés, se tient sur une plateforme herbeuse parmi des pièces-soleil et une étoile, avec un chapeau de paille sur un poteau tout près et un grand soleil jaune dans le ciel.',
      es: 'Sol & the UV Shield Quest: Sol, un personaje infantil de pelo naranja de punta, está sobre una plataforma de hierba entre monedas de sol y una estrella, con un sombrero de paja en un poste cercano y un gran sol amarillo en el cielo.',
      ru: 'Sol & the UV Shield Quest: Сол, ребёнок с рыжими торчащими волосами, стоит на травянистой платформе среди солнечных монет и звезды; рядом на столбике соломенная шляпа, а в небе большое жёлтое солнце.',
    } },
  { id: 'lung-detective', jpg: 'lung-detective-card.jpg', webp: 'lung-detective-card.webp', name: 'The Lung Detective',
    alt: {
      en: 'The Lung Detective: a cosy flat with a person on a sofa holding a phone, an ashtray on the coffee table, a pan on the stove and a door marked Basement.',
      zh: 'The Lung Detective：一间温馨的公寓，沙发上的人拿着手机，茶几上有烟灰缸，炉灶上有一口锅，还有一扇写着“Basement”（地下室）的门。',
      fr: 'The Lung Detective : un appartement chaleureux avec une personne sur un canapé, téléphone à la main, un cendrier sur la table basse, une poêle sur la cuisinière et une porte marquée « Basement » (sous-sol).',
      es: 'The Lung Detective: un piso acogedor con una persona en el sofá con un teléfono en la mano, un cenicero en la mesa baja, una sartén en los fogones y una puerta con el letrero «Basement» (sótano).',
      ru: 'The Lung Detective: уютная квартира, где на диване сидит человек с телефоном, на журнальном столике стоит пепельница, на плите сковорода, а дверь подписана «Basement» (подвал).',
    } },
  { id: 'town-of-1000', jpg: 'town-of-1000-card.jpg', webp: 'town-of-1000-card.webp', name: 'A Town of 1,000',
    alt: {
      en: 'A Town of 1,000: a small town of pastel houses around a clock tower beside a river, with people on a footpath in front, including a cyclist and a person with a pushchair.',
      zh: 'A Town of 1,000：河边的一座小镇，淡彩色的房子围着一座钟楼，前景的小路上有行人，其中有骑自行车的人和推婴儿车的人。',
      fr: 'A Town of 1,000 : une petite ville aux maisons pastel autour d’un clocher, au bord d’une rivière, avec des habitants sur un chemin au premier plan, dont un cycliste et une personne avec une poussette.',
      es: 'A Town of 1,000: un pueblo de casas en tonos pastel alrededor de una torre con reloj junto a un río, con gente en un sendero en primer plano, entre ella una persona en bicicleta y otra con un cochecito.',
      ru: 'A Town of 1,000: небольшой город с пастельными домами вокруг башни с часами на берегу реки; на дорожке впереди люди, среди них велосипедист и человек с коляской.',
    } },
];

/* ------------------------------------------------------------- libraries -- */

async function loadTools() {
  const roots = [process.env.EPI_NODE_MODULES,
    path.resolve(SITE, '..', 'presentation-assets', 'scripts', 'node_modules')].filter(Boolean);
  let playwright = null, sharp = null;
  try { playwright = await import('playwright'); } catch { /* fall through to the project copy */ }
  for (const r of roots) {
    if (!playwright) {
      const f = path.join(r, 'playwright', 'index.mjs');
      if (fs.existsSync(f)) playwright = await import(pathToFileURL(f).href);
    }
  }
  try { sharp = createRequire(import.meta.url)('sharp'); } catch { /* idem */ }
  for (const r of roots) {
    if (!sharp && fs.existsSync(path.join(r, 'sharp'))) sharp = createRequire(path.join(r, 'x.js'))('sharp');
  }
  if (!playwright || !sharp) throw new Error('Playwright and sharp are needed; set EPI_NODE_MODULES to a node_modules folder that has them.');
  return { chromium: playwright.chromium, sharp };
}

/* A static server for design/, on a private port, so the template can use the
   site's own root-relative URLs (/assets/...). */
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const f = path.join(SITE, u);
    if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, origin: `http://127.0.0.1:${srv.address().port}` })));
}

/* --------------------------------------------------------------- checks --- */

/* Where the text really is: the card is rendered twice, with and without its text, and the
   pixels that differ are the text. Their bounding box, band by band, is what has to sit
   inside the margins, so nothing is judged from line boxes and nothing can be clipped
   without showing here. */
const HD = 96, FT = 140;
const BANDS = { header: [0, HD - 1], main: [HD + 1, H - FT - 2], footer: [H - FT + 1, H - 1] };

function inkBoxes(shotRaw, bareRaw) {
  const A = shotRaw.data, B = bareRaw.data;
  const { width, channels } = shotRaw.info;
  const out = {};
  for (const [name, [ya, yb]] of Object.entries(BANDS)) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let y = ya; y <= yb; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]));
        if (d > 24) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    out[name] = n ? { x0, y0, x1, y1, n } : null;
  }
  return out;
}

/* The text has to sit inside 60 px side margins, 20 px clear of its band edges, and clear of
   the 15 px that a 2:1 crop takes off the top and bottom. */
function qc(card, m, ink) {
  const P = [];
  const need = (name, b, y0, y1, x1 = 1140) => {
    if (!b) { P.push(`no ${name} text was painted`); return; }
    if (b.x0 < 60 || b.x1 > x1) P.push(`${name} leaves the side margins (x ${b.x0}..${b.x1}, allowed 60..${x1})`);
    if (b.y0 < y0 || b.y1 > y1) P.push(`${name} leaves its band (y ${b.y0}..${b.y1}, allowed ${y0}..${y1})`);
  };
  need('header', ink.header, 15, HD - 15);
  need('title block', ink.main, HD + 1 + 20, H - FT - 2 - 20);
  need('footer', ink.footer, H - FT + 1 + 14, H - 15);
  if (!m.fits) P.push(`the title does not fit at the minimum size (${m.size}px, ${m.lines} lines)`);
  if (m.lines > (card.maxLines || 4)) P.push(`the title takes ${m.lines} lines`);
  if (m.titleScrollW > m.titleClientW + 1) P.push('the title is wider than its box');
  if (card.art === 'games') {
    if (m.row.length !== 3 || m.row.some((f) => !f.ok)) P.push('a games image did not load');
    for (const f of m.row) if (f.x < 70 || f.r > 1130 || f.y < HD + 1 + 20 || f.b > H - FT - 2 - 20) P.push('a games image leaves the picture area');
  }
  /* the fonts the text needs have to have loaded */
  const has = (re) => m.fonts.some((f) => re.test(f));
  if (!has(/^Literata normal/)) P.push('Literata did not load');
  if (/<i>/.test(card.title) && !/^zh/.test(card.lang) && !has(/^Literata italic/)) P.push('Literata italic did not load');
  if (card.lang === 'ru' && !has(/^"?Literata"? normal [\d ]+ U\+301,/)) P.push('Cyrillic Literata did not load');
  if (!has(/^PlexMono/)) P.push('IBM Plex Mono did not load');
  return P;
}

/* --------------------------------------------------------- png / webp out -- */

async function writePng(sharp, buf, file) {
  let best = null;
  for (const colours of [256, 192, 128, 96, 64, 48, 32]) {
    const out = await sharp(buf).removeAlpha().png({ palette: true, colours, quality: 96, effort: 10, dither: 0.5, compressionLevel: 9 }).toBuffer();
    best = { out, colours };
    if (out.length < MAX_PNG * 0.85) break;                   // some headroom under the limit
  }
  fs.writeFileSync(file, best.out);
  return { bytes: best.out.length, colours: best.colours };
}

/* how far the palette PNG strays from the render it came from, per colour channel (0..255) */
async function fidelity(sharp, shot, file) {
  const raw = async (b) => sharp(b).removeAlpha().raw().toBuffer();
  const [a, b] = [await raw(shot), await raw(file)];
  let sum = 0, max = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); sum += d; if (d > max) max = d; }
  return { mean: sum / a.length, max };
}

async function renderOg(tools, origin, cards) {
  const { chromium, sharp } = tools;
  fs.mkdirSync(OG_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push('request failed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.addInitScript(() => { window.__host = true; });
  await page.goto(`${origin}/scripts/og-template.html`, { waitUntil: 'load' });
  const report = [];
  let failed = 0;
  for (const card of cards) {
    const m = await page.evaluate((c) => window.renderCard(c), card);
    const clip = { x: 0, y: 0, width: W, height: H };
    const shot = await page.screenshot({ type: 'png', clip });
    await page.evaluate(() => document.body.classList.add('notext'));
    const bare = await page.screenshot({ type: 'png', clip });
    await page.evaluate(() => document.body.classList.remove('notext'));
    const raw = async (b) => sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const ink = inkBoxes(await raw(shot), await raw(bare));
    const problems = qc(card, m, ink);
    const file = path.join(OG_DIR, card.file);
    const w = await writePng(sharp, shot, file);
    const meta = await sharp(file).metadata();
    const fid = await fidelity(sharp, shot, file);
    if (fid.mean > 0.5 || fid.max > 60) problems.push(`the palette PNG differs from the render (mean ${fid.mean.toFixed(2)}, max ${fid.max})`);
    if (meta.width !== W || meta.height !== H || meta.format !== 'png') problems.push(`bad image ${meta.format} ${meta.width}x${meta.height}`);
    if (w.bytes >= MAX_PNG) problems.push(`${w.bytes} bytes is not under 200 KB`);
    if (problems.length) failed++;
    report.push({ id: card.id, file: card.file, bytes: w.bytes, colours: w.colours, width: meta.width, height: meta.height,
      titleSize: m.size, titleLines: m.lines, emphasisKeptWhole: m.keep, ink, row: m.row,
      paletteError: { mean: +fid.mean.toFixed(3), max: fid.max }, problems });
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${card.file.padEnd(18)} ${String(w.bytes).padStart(7)} B  ${w.colours} colours  title ${m.size}px x ${m.lines} lines` +
      (problems.length ? '\n       - ' + problems.join('\n       - ') : ''));
  }
  if (errors.length) { console.log('page errors:\n  ' + [...new Set(errors)].join('\n  ')); failed++; }
  await browser.close();
  return { report, failed };
}

async function renderGames(tools) {
  const { sharp } = tools;
  const out = [];
  let failed = 0;
  for (const g of GAME_CARDS) {
    const src = path.join(GAMES_DIR, g.jpg), dst = path.join(GAMES_DIR, g.webp);
    let best = null;
    for (const quality of [84, 80, 76, 72, 66, 60]) {
      const buf = await sharp(src).resize(720, 405, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
      best = { buf, quality };
      if (buf.length < MAX_WEBP * 0.8) break;
    }
    fs.writeFileSync(dst, best.buf);
    const meta = await sharp(dst).metadata();
    const bad = meta.width !== 720 || meta.height !== 405 || meta.format !== 'webp' || best.buf.length >= MAX_WEBP;
    if (bad) failed++;
    out.push({ id: g.id, file: g.webp, bytes: best.buf.length, quality: best.quality, width: meta.width, height: meta.height });
    console.log(`${bad ? 'FAIL' : 'ok  '} ${g.webp.padEnd(26)} ${String(best.buf.length).padStart(6)} B  q${best.quality}  ${meta.width}x${meta.height}`);
  }
  return { out, failed };
}

/* -------------------------------------------------------- contact sheets --- */

async function sheets(tools, origin, dir, cards) {
  const { chromium, sharp } = tools;
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const tile = async (name, items, cols, tileW, tileH, caption) => {
    const cells = items.map((it) => `<figure><img src="${origin}/${it.rel}?v=${Date.now()}" width="${tileW}" height="${tileH}"><figcaption>${caption(it)}</figcaption></figure>`).join('');
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#d9d8d2;font:12px/1.3 ui-monospace,Menlo,monospace;color:#161713}
      .g{display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:14px;padding:14px;width:max-content}
      figure{margin:0}img{display:block;outline:1px solid rgba(0,0,0,.25)}figcaption{padding:4px 0 0}</style><div class="g">${cells}</div>`);
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete));
    await page.setViewportSize({ width: cols * (tileW + 14) + 14, height: 400 });
    const f = path.join(dir, name);
    await page.locator('.g').screenshot({ path: f });
    console.log('sheet', f);
  };
  const ogItems = cards.map((c) => ({ rel: `assets/og/${c.file}`, c, bytes: fs.statSync(path.join(OG_DIR, c.file)).size }));
  const cap = (it) => `${it.c.file}  ${it.bytes} B`;
  await tile('contact-og.png', ogItems, 2, 576, 302, cap);
  await tile('contact-og-small.png', ogItems, 4, 300, 158, (it) => it.c.file);
  const gItems = GAME_CARDS.map((g) => ({ rel: `assets/games/${g.webp}`, g, bytes: fs.statSync(path.join(GAMES_DIR, g.webp)).size }));
  await tile('contact-games.png', gItems, 3, 480, 270, (it) => `${it.g.webp}  ${it.bytes} B  720x405`);
  await browser.close();
}

/* ------------------------------------------------------------------- map --- */

/* Which image each page uses, and the alt text of every image in the five site languages.
   Keys under "pages" are the template files build_site.py renders (its PAGES dict); the
   image of a page is files[lang], its alt text alt[lang], its URL urls[lang]. */
function buildMap(homeTitles) {
  const base = 'https://epidetective.com/assets/og/';
  const per = (fn) => Object.fromEntries(LANGS.map((l) => [l, fn(l)]));
  const entry = (id, fileOf, altOf, note) => ({
    id, files: per(fileOf), urls: per((l) => base + fileOf(l)), alt: per(altOf), ...(note ? { note } : {}),
  });
  const map = {
    about: 'Page -> share image map written by design/scripts/make_og.mjs (node scripts/make_og.mjs map --map FILE). ' +
      'Every image is 1200x630 PNG under 200 KB in design/assets/og/. Use width/height/type/alt as below for og:image:width, ' +
      'og:image:height, og:image:type and og:image:alt (and the same alt for twitter:image:alt).',
    image: { width: W, height: H, type: 'image/png', base_url: base, max_bytes: MAX_PNG },
    usage: [
      'Site pages: og:image = pages[<template file>].urls[lang]; og:image:width = 1200; og:image:height = 630; og:image:type = image/png; ' +
        'og:image:alt = pages[<template file>].alt[lang]; twitter:image = the same URL; twitter:image:alt = the same alt text.',
      'The Code page (static_pages) and the two tools (tools.cancer, tools.chronic) use the same fields. The tools live on tools.epidetective.com, ' +
        'so their static head needs the absolute URLs; their head is English.',
      'games/*/index.html keep their own og:image (their 960x540 JPEG cards); only games.html uses games.png.',
      'Game cards: <img src="{PREFIX}assets/games/<slug>-card.webp" width="720" height="405" loading="lazy" alt="game_cards[<slug>].alt[lang]"> ' +
        'inside the existing card link. The 960x540 JPEGs stay where they are.',
      'home_h1_on_cards holds the five home h1 strings the home cards show, in i18n form (<b> marks the emphasised words). Using them for home_h1 ' +
        'keeps each page and its card in step. If the h1 changes later, run node scripts/make_og.mjs --check, then --home-from-i18n.',
      'assets/og.png (a screenshot of the former home page, with the former audience line) is the old image. Delete it once nothing refers to it.',
    ],
    pages: {}, static_pages: {}, tools: {}, game_cards: {},
    home_h1_on_cards: per((l) => homeTitles[l].replace(/<br>/g, '').replace(/<(\/?)i>/g, '<$1b>')),
  };
  map.pages['index.html'] = entry('home', (l) => `home-${l}.png`, (l) => altText(l, '', homeTitles[l], 'both'),
    'One image per language; the card shows the home h1 of that language (see home_h1_on_cards).');
  for (const p of PAGES) {
    const e = entry(p.id, () => p.file, (l) => altText(l, p.t[l][0], p.t[l][1], p.src),
      'The image has English text on every language page; only the alt text is translated.');
    if (p.page.startsWith('tools:')) map.tools[p.page.slice(6)] = e;
    else if (p.page.includes('/')) map.static_pages[p.page] = e;
    else map.pages[p.page] = e;
  }
  /* pages outside the build that can use an existing card */
  const aboutE = map.pages['about.html'];
  map.static_pages['timeline/index.html'] = { ...aboutE, id: 'about', note: 'Optional: the timeline is a page about Wenxin Wan and has no card of its own; it can use the About card instead of the old assets/og.png.' };
  map.static_pages['chronic-disease-explorer/index.html'] = { ...map.tools.chronic, note: 'The site copy of the chronic tool page (written by scripts/build_chronic_page.py) takes the same image as the tool.' };
  for (const g of GAME_CARDS) {
    const f = path.join(GAMES_DIR, g.webp);
    map.game_cards[g.id] = {
      name: g.name, file: `assets/games/${g.webp}`, width: 720, height: 405, type: 'image/webp',
      bytes: fs.existsSync(f) ? fs.statSync(f).size : null, source_jpg: `assets/games/${g.jpg}`, alt: g.alt,
    };
  }
  return map;
}

/* ----------------------------------------------------------------- drift --- */

function drift() {
  let n = 0;
  for (const lang of LANGS) {
    const f = path.join(SITE, 'i18n', `${lang}.json`);
    const h1 = plain(JSON.parse(fs.readFileSync(f, 'utf8')).home_h1 || '').replace(/\s+/g, ' ').trim();
    const mine = plain(HOME_TITLE[lang]).replace(/\s+/g, ' ').trim();
    if (h1 !== mine) { n++; console.log(`${lang}: home_h1 differs\n   i18n: ${h1}\n   card: ${mine}`); }
  }
  console.log(n ? `${n} home title(s) differ: re-run with --home-from-i18n to follow the site.` : 'The five home titles equal home_h1 in i18n.');
  return n;
}

function homeFromI18n() {
  const t = {};
  for (const lang of LANGS) {
    const h1 = JSON.parse(fs.readFileSync(path.join(SITE, 'i18n', `${lang}.json`), 'utf8')).home_h1;
    t[lang] = h1.replace(/<\/?b>/g, (m) => (m === '<b>' ? '<i>' : '</i>')).replace(/<(?!\/?i>)[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (lang === 'zh') t[lang] = t[lang].replace('，', '，<br>');
  }
  return t;
}

/* ----------------------------------------------------------------- main ---- */

if (has('--check')) process.exit(drift() ? 1 : 0);

const homeTitles = has('--home-from-i18n') ? homeFromI18n() : HOME_TITLE;
if (val('--map')) {
  fs.mkdirSync(path.dirname(path.resolve(val('--map'))), { recursive: true });
  fs.writeFileSync(path.resolve(val('--map')), JSON.stringify(buildMap(homeTitles), null, 2) + '\n');
  console.log('map', path.resolve(val('--map')));
}
if (mode === 'map') { guardText(buildCards(homeTitles)); process.exit(0); }

const tools = await loadTools();
let cards = buildCards(homeTitles);
guardText(cards);
if (only) cards = cards.filter((c) => only.has(c.id));
const { srv, origin } = await serve();
let failed = 0;
const all = { og: [], games: [] };
try {
  if (mode === 'all' || mode === 'games') { const g = await renderGames(tools); all.games = g.out; failed += g.failed; }   // before the og run: the games card uses them
  if (mode === 'all' || mode === 'og') { const r = await renderOg(tools, origin, cards); all.og = r.report; failed += r.failed; }
  if (val('--sheet')) await sheets(tools, origin, path.resolve(val('--sheet')), buildCards(homeTitles));
  if (val('--report')) fs.writeFileSync(path.resolve(val('--report')), JSON.stringify(all, null, 1));
} finally { srv.close(); }
console.log(failed ? `\n${failed} problem group(s). See above.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
