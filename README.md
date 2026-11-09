# EpiDetective

Source for **epidetective.com** — a platform of open instruments for reading
epidemiological evidence, built by Wenxin Wan (IARC / WHO, Lyon).

Static site. No build dependencies beyond Python 3 and no JavaScript framework.

## Build

```bash
python3 build_site.py
```

Renders `templates/*.html` once per language into:

```
index.html  explorer.html  chronic.html  about.html  games.html   # en
reading.html  how-we-check.html  work.html  blog.html  blog/
zh/  fr/  es/  ru/                                                # one directory per language
```

The build **fails loudly** if any language is missing a key, carries an unknown
key, or has an empty value — a half-finished translation cannot silently ship
English.

## Content

All copy lives in `i18n/<lang>.json`, 524 keys each. `en.json` is the source of
truth for key parity. To change wording, edit the JSON and rebuild — never edit
the generated HTML, it is overwritten.

Language switching is plain links between real pages, with full `hreflang`
alternates. No JavaScript is required for it to work.

## Typography

The site sets in one face, **Source Serif 4** (Adobe, OFL; November 2026,
replacing Sofia Sans): running text, display, the small labels, figures, menus
and the wordmark. Its optical sizes do the work two faces did before: the
small capitals labels, the map's names and other interface text use the
caption size (`font-variation-settings: "opsz" 8`, the `--caption` token), the
large headings the display size (`--display`, opsz 60), and running text takes
the size it is set at (`font-optical-sizing: auto`). Emphasis in a heading
(`<b>` in the copy) is the italic, as on the share cards; in Chinese it is
weight.

The files are self-hosted woff2 subsets in `assets/` (`sourceserif4-*.woff2`,
roman and italic, each cut into Latin, Latin-ext, Cyrillic and Greek and
declared with `unicode-range`, so a page loads only the files its characters
need; every page preloads the Latin roman). They were cut from Google Fonts'
subsets and trimmed with fontTools' instancer to fit the home page's budget
(first screen at most 9 requests and about 300 KB): the roman keeps the
optical-size axis (8 to 60) and weights 400 to 600, the italic the
optical-size axis at weight 400 (Latin roman 80 KB, Latin italic 50 KB,
Cyrillic 61 KB and 34 KB). To recut them:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
f = TTFont("google-latin-roman.woff2")     # css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700
f = instancer.instantiateVariableFont(f, {"wght": (400, 600), "opsz": (8, 60)})   # italic: {"wght": 400, "opsz": (8, 60)}
f.flavor = "woff2"; f.save("assets/sourceserif4-latin.woff2")
```

`font-synthesis: none` keeps the browser from faking a bold or a slant. A
metric fallback (`Source Serif 4 Fallback`, Times New Roman scaled to Source
Serif 4's measure) keeps the swap from reflowing the page.

Chinese sets its Latin letters and figures in Source Serif 4 and Han in the
system's CJK sans, since no CJK webfont is viable at this file size; there the
display tracking is neutralised, measures are set in `em`, and emphasis is
weight, never a synthesised oblique.

`Literata` and `IBM Plex Mono` stay in `assets/` because the timeline, the
games, the chronic tool and the share cards (`scripts/og-template.html`) still
use them. The Code Against Cancer page sets in Source Serif 4 like the rest of
the site (see below).

## Layout

The container runs up to 1680 px with fluid gutters (`--max`, `--pad`:
`clamp(20px, 4vw, 72px)`), so on a wide monitor the sections use the width
(the two explorers side by side, the blog row, How we check) while running
text keeps a readable measure. The blog index and every post set in one
centred reading column of about 66 characters.

The home page shows only the author's own work (November 2026). After the
cover: the two explorers, the newest posts, How we check and What's new, then
the footer. Each explorer's sheet gives the question it answers, two key
figures (`FIG_T1_M1`/`M2`, `FIG_T2_M1`/`M2`: exposures and cancer types,
risk factors and diseases), the source of its evidence in a ruled panel (its
name, a short note on who produces it and how, taken from what How we check
and the About pages say, and a link to How we check `#cancer` / `#chronic`),
a few places to start, the two actions and the network inset. The other counts
(links, languages, the agents and related outcomes beyond the map) are on the
About pages. The blog section (`BLOG_LATEST`, up to three posts) has the same
section head as the tools and sets its posts left, in a row of up to three; a
single post spans the row, on the columns of How we check. The Code Against
Cancer band and the games row left the home page; both pages stay in the menu.
The labels both tools print and the questions answered from them live on the
tools' About pages: `explorer.html` (IARC's groups, the two link labels,
three questions) and `chronic.html` (the five grades, the older names, the
stroke question), which the chronic tool's "About this tool" button opens.

## The menu

Every page's header and footer carry the same menu: Tools, Code Against
Cancer, Games, Blog, About, Contact. "Reading the evidence" left the menu in
November 2026 (its labels and questions now live on the tools' About pages);
`reading.html` itself stays, and the About pages, Work and cancer, the games
page and the games still link to it. Besides the templates, three
hand-written pages carry the menu and must be kept in step: `404.html`,
`code-against-cancer/index.html` (`SITE_NAV`) and `timeline/index.html` (its
`nav` arrays).

## The Code Against Cancer page

`code-against-cancer/index.html` is written by hand, outside the build: one
file with its five languages inside (`STRINGS`, `REGIONS`), read from
`?lang=` (English has no query) and remembered in `localStorage`. It looks
like every other page: its header is the built pages' header in markup, size,
position and behaviour (the wordmark with the logo, the menu, then the
languages, the current one as text and the others as links to `?lang=xx`,
which switch in place), and it sets in Source Serif 4 on the site's paper, ink
and 1680 px container, with the inner pages' contour still behind its title.
The fonts, tokens and header rules are copied from `site.css` into the page's
own `<style>`, so a change to the site's header must be copied there too. The
region tabs, the `#europe`, `#lac`, `#asia` and `#europe-3` addresses and the
per-language meta tags work as before; the recommendation cards run in two
columns from 1100 px, read across in order.

## The cover

The home page opens on a contour map drawn by `assets/terrain.js` (no
libraries), full bleed under the header's hairline, with no frame: marching
squares on seeded simplex noise, drifting very slowly, the field offset a
little as the page scrolls, paused off screen and in a hidden tab, drawn once
with `prefers-reduced-motion`. The title block sits over it as a quiet panel
of paper. Small labels sit on the field's summits: names from both explorers
(`tn_*` keys), each fading in as its summit rises and out as it sinks, never
over the title block or another label. Causes (exposures, risk factors) are
set in the map's brown with a filled triangle, outcomes (cancers, diseases) in
a deep water blue (`--water-deep`, 7.0:1 on the paper), in italic, with an
outlined triangle, both at Source Serif 4's caption size (the canvas sets the
optical size from the font size, so the names are drawn at 8 px and scaled).

Selecting a label (click, tap, or the keyboard list) draws thin dashed arcs to
every other label on the map that the data link to it, each with its grade
written on it; a line appears when a linked label rises while the selection
lasts and fades with it. A small card beside the label gives its kind and the
way into its entry in the tool(s); a polite live region reads the links
("Tobacco smoking: linked on the map to Lung cancer (Established link), ...").
Escape, the card's close button or a click elsewhere clears it. For keyboards,
one tab stop after the search opens a list of the 24 names (arrow keys between
them). The links are computed at build time (`build_site.py`
`TERRAIN_POOL`, `terrain_model`, `terrain_json`) and written into the page as
an inline JSON script: cancer links from `graph.json` (Established or
Suspected), chronic links from the data embedded in
`chronic-disease-explorer/index.html` (version 2.0 grades, counted links
only, as the tool's own map draws them; `chronic-graph.json` is the fallback
if that data cannot be read). The build stops if a mapped name is missing from
the data.

Without JavaScript the cover shows `assets/contours.svg`, a still of the same
field, which the inner pages also use behind their titles;
`scripts/make_contours.js` writes it (`node scripts/make_contours.js
assets/contours.svg`).

## The tools

Two are live.

| | Where it lives | Languages |
|---|---|---|
| **Cancer Evidence Explorer** | its own repo, linked out | 10 |
| **Chronic Disease Evidence Explorer** | `chronic-disease-explorer/` in this repo | en, zh |

Each has an About page on this site: `explorer.html` for the cancer tool and
`chronic.html` for the chronic one (both with hreflang, sitemap entries,
WebPage JSON-LD and a share card: `explorer.png`, and the tool's own
`chronic.png`).

The second one is a single self-contained HTML file — data, styles and the
force simulation all embedded — generated by the separate
`chronic-disease-evidence-explorer` project and dropped in whole.
`build_site.py` does not touch it; to update the tool, rebuild it there and copy
the file over. It carries its own language switch, which is why it gets one
plain sitemap entry rather than one per language.

## The games

Three cancer awareness games live under `games/`, each a self-contained
directory that `build_site.py` does not touch. They are English-only, so every
language's games page links the same builds.

| Game | Directory | Made of |
|---|---|---|
| **Sol & the UV Shield Quest** | `games/sun-safety/` | a React + canvas bundle (`game.js`), built from source |
| **The Lung Detective** | `games/lung-detective/` | plain JavaScript and SVG scenes, edited in place |
| **A Town of 1,000** | `games/town-of-1000/` | plain JavaScript (`game.js`) with its art in `art.js`, edited in place |

Sol's source is the `sun-safety-adventure` repository. Its bundle is rebuilt
with the small esbuild script kept beside this repo:

```bash
cd ../games-src/build && npm install     # once
node build-sol.mjs                       # writes games/sun-safety/game.js
```

`games/sun-safety/game.css` is that repository's `app/globals.css` without the
Tailwind import; keep the two in step. The screenshots the games page shows
(`assets/games/*-shot.{jpg,webp}`, 1200×780) and the card art
(`assets/games/*-card.jpg`, 960×540) are captured from the running games, so
retake them when a game's look changes.

Every fact a game states carries its source, and the European Code Against
Cancer is quoted word for word. Check any new game text against its source
before publishing.

## The network backgrounds

Both pictures (the map insets on the home page's tool sheets, written inline
by the build) are static renders of the real graphs, not decoration.

```bash
python3 make_network_svg.py     # assets/network.svg          185 exposures, 68 cancers, 469 links
python3 make_chronic_svg.py     # assets/chronic-network.svg   124 risk factors, 45 diseases, 356 graded links
```

Each runs a seeded force-directed layout, so the result is reproducible, and
asserts the layout has not collapsed before writing. The two are deliberately
different pictures: the cancer graph settles free-floating, while the chronic
graph is clustered — risk factors pulled into their category on an outer ring,
diseases into their body system on an inner one — because that clustering is
the second tool's signature and the thing that tells the two cards apart.
`make_chronic_svg.py` reads `chronic-graph.json`, a node/link skeleton exported
from the tool's dataset purely to bake this image.

## Scrolling

`scroll.js` adds Luxy-style inertial scrolling, matching the Cancer Evidence
Explorer. It is a progressive enhancement: desktop only, disabled under
`prefers-reduced-motion`, and if the file never loads the page falls back to CSS
`scroll-behavior: smooth`, which still handles anchor links.

## Not yet real

The homepage lists two instruments because two exist. The `inst.t2.*` slot
originally described a planned Occupational Exposure Atlas and now holds the
chronic-disease explorer, which is live. A third card (`inst.t3.*`) and a second
Note (`notes.n2.*`) were drafted during design and **removed before launch** —
they described things that do not exist. Their translation keys were dropped in
the August 2026 CMS cleanup; `templates/index.html` carries a comment showing
where to reinstate the markup (re-add the keys to every `i18n` file and to the
CMS via `scripts/generate_pages_yml.py`) once there is something real to announce.
