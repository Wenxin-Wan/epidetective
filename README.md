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
index.html          explorer.html          # en
zh/  fr/  es/  ru/                         # one directory per language
```

The build **fails loudly** if any language is missing a key, carries an unknown
key, or has an empty value — a half-finished translation cannot silently ship
English.

## Content

All copy lives in `i18n/<lang>.json`, 94 keys each. `en.json` is the source of
truth for key parity. To change wording, edit the JSON and rebuild — never edit
the generated HTML, it is overwritten.

Language switching is plain links between real pages, with full `hreflang`
alternates. No JavaScript is required for it to work.

## Typography

`Fraunces` (display) and `DM Sans` (body) carry Latin. Neither contains a single
Cyrillic glyph, so Russian substitutes `Playfair Display` and `Golos Text` —
Golos being Cyrillic-first, so it reads native rather than bolted-on. Chinese
uses a system CJK stack, since no CJK webfont is viable at this file size; there
the display tracking is neutralised and `<em>` drops italic, because synthesised
oblique on Han characters is a typographic error.

Fonts in `assets/` are subset to the ranges actually used.

## The network background

`assets/network.svg` is a static render of the real evidence graph — 185
exposures, 68 cancer types, 460 links. Regenerate with:

```bash
python3 make_network_svg.py
```

It runs a seeded force-directed layout, so the result is reproducible, and
asserts the layout has not collapsed before writing.

## Scrolling

`scroll.js` adds Luxy-style inertial scrolling, matching the Cancer Evidence
Explorer. It is a progressive enhancement: desktop only, disabled under
`prefers-reduced-motion`, and if the file never loads the page falls back to CSS
`scroll-behavior: smooth`, which still handles anchor links.

## Not yet real

The homepage lists one instrument because one exists. Two further instrument
cards and a second Note were drafted during design and **removed before launch**
— they described things that do not exist. Their translation keys (`inst.t2.*`,
`inst.t3.*`, `notes.n2.*`) remain in every `i18n` file, and `templates/index.html`
carries comments showing where to reinstate the markup once there is something
real to announce.
