# Thirty directions

Each entry gives the feeling, palette, type, layout, one signature moment and motion.
Follow it closely, but use your judgement to make the page beautiful; if something in the spec would look clumsy, solve the intent more elegantly.
Image names refer to files in media/ (see media/credits.json: pick by `suggested_use`, `mood`, `orientation`).

---------------------------------------------------------------------------------------------------
## 01 · Apothecary — lessons from Aesop
Feeling: an apothecary's quiet shop; warm, tactile, literary. Long, well-set sentences; botanical still life.
Palette: stone #E8E2D6 (ground) · parchment #F3EFE7 (panels) · ink #2A2722 · umber #6B5A44 · olive #59603F (links, accent).
Type: Cormorant Garamond (display 300–500, true italic for small emphasis) + Instrument Sans (text 15–16px; nav and labels in small size with modest tracking).
Layout: asymmetric editorial. Hero: tall 4:5 still-life or leaf photograph on one side, headline and search on the other. Tools are presented like formulations: name, one sentence, and a fine "composition" table of the three figures with hairline rules.
Signature: a slow cross-fade between two botanical photographs in the hero frame.
Motion: slow fades (1.2–1.6 s); hero headline words rise.

## 02 · Sanctuary — lessons from Aman
Feeling: arriving at a remote retreat; silence; landscape first. (Aman's site is often praised for its muted palette and understated type.)
Palette: mist #EEEDEA · slate #2F3437 · sand #B7AA94 (accent) · shadow #1B1E20.
Type: Newsreader (display, light 300, large optical size) + Tenor Sans (tracked caps for nav and tiny labels only, 11px, .2em).
Layout: full-viewport misty mountain photograph; headline low in the frame, light serif, white; wordmark in tracked caps centred in a minimal top bar. Then generous light sections with narrow centred columns separated by a short thin rule. Tools as two large landscape panels.
Signature: hero image breathes (slow scale 1.08 → 1 over ~6 s on load) and, further down, a second landscape is revealed behind the "one idea" section as a fixed background between two light sections.
Motion: very slow; nothing quick.

## 03 · Calibre — lessons from haute horlogerie (Patek Philippe, A. Lange & Söhne)
Feeling: precision and heritage; "how sure" as a calibrated dial.
Palette: midnight #0E1A2B (ground) · ivory #F1EDE4 (text) · champagne #C9B37E (hairlines, accent) · slate-blue #2A3A52.
Type: Bodoni Moda (display, use the optical-size axis) + Manrope (text).
Layout: dark. Hero: a large, finely engraved SVG dial (four sectors labelled Group 1, 2A, 2B, 3 with labels Known, Probable, Possible, Not classifiable; fine tick marks) beside the headline. The "one idea" shows two sub-dials (like watch complications): 100–120 per 1,000 smokers and 4–5 per 1,000 non-smokers, arcs drawn to scale on the same 0–1,000 scale... use 0–150 per 1,000 if needed so both are visible, and label the scale. Tools set like reference numbers: "185 · 68 · 469".
Signature: the dial's hand sweeps from Group 3 to Group 1 as the hero scrolls (use data-progress).
Motion: precise, smooth.

## 04 · Verde — lessons from Bottega Veneta
Feeling: confident, modern, unmistakable; nature through one colour.
Palette: bottle green #12382B (ground) · leaf #2E6B4F · paper #F4F1EA · ink #0B1A14 · chartreuse #C8D96F (tiny accent only).
Type: Familjen Grotesk for everything; display bold with tight tracking; very large.
Layout: hero full-bleed deep green with an enormous headline in paper colour and one leaf/fern macro photograph cropped tightly, bleeding off the right edge. Sections alternate green and paper. Tool names huge, one line each, figures in a single row.
Signature: on scroll, a green frame closes in around the leaf photograph (clip-path inset driven by --p).
Motion: bold but slow.

## 05 · Fibre — lessons from Loro Piana and Brunello Cucinelli
Feeling: tactile, quiet wealth; texture is the luxury.
Palette: oat #E6E0D4 · linen #F2EEE6 · taupe #8C8172 · charcoal #33302B · moss #6E7357 (accent).
Type: Libre Bodoni (display, italic for one phrase) + Figtree (text).
Layout: full-width textured image bands (dried grasses, stone, meadow) between text sections; text in a centred 60ch column with a large first line; tools as two borderless blocks each topped by a texture image; figures in small caps or old-style numerals.
Signature: texture bands drift slowly against the scroll (data-parallax) and the headline has an elegant italic turn.
Motion: gentle.

## 06 · Monochrome — lessons from The Row and Celine
Feeling: gallery-like radical reduction; one image, perfect type.
Palette: white #FFFFFF · black #0A0A0A · grey #8A8A8A · hairline #E6E6E6. No other colour.
Type: Noto Serif Display (thin and light at huge sizes) + Geist (small text).
Layout: hero: very large thin serif headline left, a single black-and-white Blossfeldt plant photograph right, tall. Navigation as tiny text in the corners. Each later section is about one screen with one sentence and one action. Tools as two lines with large numerals.
Signature: the plant photograph reveals with a slow vertical mask; headline words rise.
Motion: minimal and slow.

## 07 · Aluminium — lessons from Leica and Bang & Olufsen
Feeling: engineering precision; product pages; cool and exact.
Palette: aluminium #E4E6E8 · white #F7F8F9 · graphite #1E2125 · steel #6B7178 · signal red #D52B1E (one small dot only).
Type: Red Hat Display + Red Hat Text.
Layout: each tool presented as a product hero: name above, the network drawing large and crisp on a soft radial "plinth", a spec row of three figures below with hairline separators, then Open. The one idea is a precise two-column specification comparison (smokers vs non-smokers).
Signature: the tool object scales and settles as it scrolls into view (data-progress), figures count up (data-count).
Motion: crisp, medium.

## 08 · Journal — lessons from Kinfolk and Cereal magazines
Feeling: slow editorial magazine; photography, wide margins, calm reading.
Palette: paper #F6F4EF · ink #262624 · grey #7A776F · sage #8A9A7E (accent).
Type: Brygada 1918 (serif, Cyrillic) + Albert Sans (captions and nav).
Layout: magazine grid. Hero like a cover: one editorial nature photograph (grasses, sea or still life) with the headline as the cover line. Later sections as spreads: image on one side, text on the other, captions with credits. Do not invent issue numbers or dates.
Signature: spreads reveal like turning pages (image wipe, data-reveal="wipe").
Motion: calm.

## 09 · Herbarium — lessons from the Royal Botanic Gardens, Kew herbarium
Feeling: botanical archive; specimen sheets; museum labels.
Palette: sheet #F1EEE5 · mount board #E3DDCF · ink #2B2B26 · label #FBFAF5 · faded green #5F6F52 · archival red #8E3B2F (one tiny stamp).
Type: Castoro (serif; italic for names) + Karla (labels).
Layout: each section is a specimen sheet: a herbarium plate on a sheet with a label block in the lower right, like a real herbarium label (Name, Collection, Notes). For the tools the label lists the figures. Hero: large herbarium specimen with the headline set as the label.
Signature: sheets slide up and settle one over another as you scroll (sticky stacking).
Motion: gentle.

## 10 · Urformen — Karl Blossfeldt, Urformen der Kunst (1928)
Feeling: modernist, monumental, sculptural nature in black and white.
Palette: bone #EDEBE6 · carbon #121212 · silver #9A9893 · deep green #23372B (links only).
Type: Jost (geometric; light for large text, medium for small headings).
Layout: hero: a single Blossfeldt plant at full height beside the headline. Further down, a strict grid of three or four Blossfeldt photographs at monumental scale with text in the gutters; each tool paired with one plant photograph, Bauhaus-poster style.
Signature: the hero plant scales down into its place in the grid as you scroll (data-progress).
Motion: architectural.

## 11 · Cyanotype — Anna Atkins, Photographs of British Algae (1843)
Feeling: Prussian blue prints; science and nature; the first photographically illustrated book.
Palette: Prussian #10357A · cyan wash #1F4E9C · paper #F4F6F8 · pale #DCE6F2.
Type: Spectral (light serif) + IBM Plex Sans (small text).
Layout: full-bleed cyanotype plates as hero and section breaks with white type; text sections on paper with blue ink. Recolour the tool network drawings blue (CSS filter) so they read as cyanotypes.
Signature: the hero plate "develops" from white to blue on load like a print being exposed.
Motion: slow.

## 12 · Kunstformen — Ernst Haeckel, Kunstformen der Natur (1904)
Feeling: wonder at natural geometry; an elegant print gallery.
Palette: plate paper #F2EEE3 · ink #20211F · verdigris #3E6E68 · ochre #B08A3E (tiny).
Type: Gloock (display) + Source Sans 3 (text).
Layout: Haeckel plates framed with generous passe-partout like a print room; each tool paired with a plate. Hero: one symmetric plate centred with the headline beneath.
Signature: a circular "loupe" window over a plate that zooms into detail as you scroll (scale driven by --p).
Motion: slow.

## 13 · Fern Print — Henry Bradbury's nature-printed ferns (1855)
Feeling: a Victorian scientific book; green fern impressions on white; extremely elegant.
Palette: page #FAFAF6 · fern #3F6B3A · dark ink #1E2B1C · rule #D9DCD2.
Type: EB Garamond throughout (use font-feature-settings "smcp", "onum"; Cyrillic).
Layout: a book page: wide margins, a running head, one fern plate per section labelled Plate I, II…, text in one column with sidenotes for sources.
Signature: each fern plate grows in from stem to tip (clip-path from bottom to top, data-reveal="mask" variant or custom).
Motion: slow.

## 14 · Terrain — topographic maps (Swiss topo, Patagonia)
Feeling: exploration and maps; informative.
Palette: topo paper #F1F0EA · contour brown #A7835A · contour green #6E8B5B · water #5B88A6 · ink #22241F.
Type: Sofia Sans and Sofia Sans Semi Condensed (Cyrillic).
Layout: generative contour lines (canvas; marching squares on smooth noise) as the hero ground with a few spot heights; the headline in a map title block; tools as map sheets with legends listing the figures. The four groups appear as an elevation legend (Group 1 = highest certainty).
Signature: contours shift very slowly; scrolling offsets the noise field.
Motion: ambient slow (respect reduced motion: draw once).

## 15 · Understory — misty forest
Feeling: forest bathing; deep green calm; fog.
Palette: fog #DCE0DA · moss #3E5A45 · deep #16241C · pale #EEF1EC · birch #C9C4B5.
Type: Instrument Serif (display) + Instrument Sans (text).
Layout: full-bleed forest photograph hero with the headline in pale type; content on fog ground; a second forest image appears between sections as a fixed background band. Tools as two tall panels.
Signature: soft fog layers (gradients) drift over the hero at different parallax speeds.
Motion: slow.

## 16 · Tide — the sea horizon
Feeling: horizon, vastness, calm blue.
Palette: sea #1E3D52 · foam #F2F4F3 · horizon grey #AEB8BE · deep #0E2231 · sand #D8CFC0.
Type: Ibarra Real Nova (display) + Hanken Grotesk (text).
Layout: one thin horizon line organises the page: it sits at the same height in each section and text sits above or below it. Hero: full-bleed sea photograph with the horizon at about 55%.
Signature: the page colour shifts from day to dusk as you scroll (CSS variables interpolated from a progress value on body).
Motion: slow.

## 17 · Mineral — stone and inscription
Feeling: monumental and permanent; museum stone.
Palette: limestone #E7E4DE · granite #4A4C4E · basalt #1C1D1F · travertine #CFC4B2 · oxide #8B5A3C (tiny).
Type: Marcellus (inscriptional display) + Manrope (text).
Layout: large stone texture photograph as hero; headline set like an inscription. Sections as stone tablets with subtly engraved type (a soft inset text-shadow, used with taste). Tools as two monoliths.
Signature: inscription reveal: letters sharpen from a slight blur as they appear.
Motion: slow.

## 18 · Ma — Japanese emptiness (Kenya Hara, Muji, Tadao Ando)
Feeling: space as luxury; quiet; a single stone and moss.
Palette: washi #F5F3EE · sumi #1E1E1C · moss #5C6B4A · stone grey #A8A69F.
Type: Shippori Mincho (serif) + Zen Kaku Gothic New (small text). Both carry Han glyphs, which matters for the Chinese site.
Layout: extreme whitespace; one moss or zen-garden photograph; content in a narrow column far from the image; each section about one screen. Do not add Japanese words.
Signature: a thin brush-like circle (SVG stroke) draws itself around the search field.
Motion: very slow.

## 19 · Collection — lessons from museum sites (Rijksmuseum, Wellcome Collection)
Feeling: a museum of life and health; objects first; confident.
Palette: white #FFFFFF · ink #111111 · warm grey #F2F0EC · oxblood #7A1F1F (accent).
Type: Wix Madefor Display + Wix Madefor Text (Cyrillic).
Layout: image-first. Large plates (Hooke's Micrographia, Merian or Redouté) shown as objects with museum object labels; a horizontal scroll-snap row of objects; the tools as "permanent galleries" with large images.
Signature: full-width object hero with a museum label; a calm horizontal row of objects.
Motion: medium.

## 20 · Laureate — lessons from the Nobel Prize
Feeling: gravitas and scientific excellence.
Palette: black #0B0B0B · gold #B8975A · ivory #F4EFE6 · grey #77736B.
Type: Libre Caslon Display + Libre Franklin.
Layout: alternating black and ivory sections; a medal-like circular emblem in thin gold line holding the four groups; tools as plaques within thin gold frames.
Signature: gold hairlines draw themselves in (stroke-dashoffset).
Motion: stately.

## 21 · Cabinet — the natural history cabinet
Feeling: museum drawers, specimens in rows, discovery.
Palette: walnut #3B2A1E · drawer paper #F3EFE6 · label #FFFDF8 · ink #222222 · brass #A88B5A.
Type: Alegreya + Alegreya Sans (Cyrillic).
Layout: a grid of specimen drawers: each cell holds a plate crop with a small label. The hero is a drawer that slides out as you scroll (translateY driven by --p). Tools as two large drawers.
Signature: drawer pull-out.
Motion: medium.

## 22 · Transactions — the scientific journal, and John Snow's 1854 map
Feeling: classic scientific publishing; authority; the history of epidemiology.
Palette: page #FBFAF7 · ink #1A1A1A · rule #D8D6D0 · journal red #9B1C1C (sparingly).
Type: Source Serif 4 (large optical size for display + text) + Source Sans 3 (figures, captions).
Layout: a journal article: title block, an abstract box (the hero summary and search), two-column body on desktop, Figure 1 (Snow's map) full width with caption, Table 1 for the tools' figures, a short references list.
Signature: Figure 1 zooms towards the Broad Street pump as you scroll (scale and translate from --p).
Motion: minimal.

## 23 · Observatory — the night sky and the real map
Feeling: wonder; exploration; a star chart.
Palette: night #0A0F1A · ink blue #121A2B · starlight #EDE8DC · dim #8E97A8 · ember #E07A5F · amber #E9B872.
Type: Gilda Display + Jost.
Layout: hero: night-sky photograph with the real cancer network (media/graph.json; force layout in JS) drawn over it as constellations; hover shows names. Tools as "charts"; the one idea as two fields of 1,000 stars.
Signature: constellations draw line by line on load.
Motion: ambient.

## 24 · Field Guide — the naturalist's field guide (Peterson, Sibley)
Feeling: practical and friendly; plates and identification marks; good for the public and schools.
Palette: page #F7F5EE · ink #222320 · field green #4E6B3F · sky #6E8FA6 · marker #E3B23C · red #B5442F.
Type: Besley (headings) + Atkinson Hyperlegible (text).
Layout: identification spread: a plate on one side and "field marks" on the other, with callout lines pointing to features. Use it to teach the four evidence labels ("How to identify a Group 1 claim"). Tools as two field guides; games as junior guides.
Signature: callout lines draw to marks on the plate.
Motion: medium.

## 25 · Thousand — refined icon-array scrollytelling (The Pudding, NYT Upshot, Harding Center fact boxes)
Feeling: elegant explanatory journalism; light, calm, nature-tinted.
Palette: paper #FBFAF7 · ink #1B1D1F · dot #D8D6CF · case #B5432F · range #E7B3A6 · sage #7C8C6E.
Type: Crimson Pro (serif) + Public Sans (figures, captions).
Layout: hero, then a pinned canvas of 1,000 dots arranged beautifully (10 blocks of 100, or a seed-like phyllotaxis field), with steps scrolling past: 1,000 people → 100–120 smokers with lung cancer by 75 → 4–5 non-smokers → same label, very different risk. Labels annotate the chart directly. Then the tools.
Signature: the 1,000-dot field re-forms at each step.
Motion: scroll-driven.

## 26 · Populations — a light Powers of Ten (Charles and Ray Eames, 1977)
Feeling: dawn light; scale; the population caveat made physical.
Palette: dawn #F4EFE8 → sky #DCE6EE · ink #1F2328 · dot #3B4A5A · case #C2553D.
Type: Young Serif + Onest.
Layout: hero, then a pinned zoom from one person (one labelled dot) to 10, 1,000 and a million; captions as elegant overlay cards; the background brightens from dawn to day as you zoom out.
Signature: continuous zoom.
Motion: scroll-linked.

## 27 · Spectrum — the evidence scale as light
Feeling: luminous, scientific, simple.
Palette: white #FFFFFF · ink #111317 · a continuous spectrum from deep red #9E2A2B (Group 1) through amber #D98C2B to pale grey #C9CCD1 (Group 3), used only as the scale.
Type: Funnel Display + Funnel Sans.
Layout: hero: a wide spectrum band like light through a prism, the four groups marked along it, headline above. On scroll the band becomes a slim sticky scale at the left edge showing which group the current section is about. Tools below.
Signature: light sweeps across the band; the band docks to the side.
Motion: medium.

## 28 · Charted — lessons from Our World in Data (Lovie Award 2019)
Feeling: academic, trustworthy, data-first.
Palette: white #FFFFFF · navy #002147 · grey #5B5B5B · rule #E7E7E7 · data red #C0392B · data blue #2E6FA7.
Type: Playfair Display (headings) + Lato (text): the pairing Our World in Data is known for.
Layout: headline and search, then a proper chart card: "Lung cancer by age 75, per 1,000 people" bars to scale (smokers 100–120 as a range, non-smokers 4–5), axis, source line. Tools as explorers with small bar summaries of their counts. Clean structured grid.
Signature: bars grow in from zero when visible.
Motion: minimal.

## 29 · Index — the Swiss typographic index (Josef Müller-Brockmann, Experimental Jetset)
Feeling: rigorous, neutral, exact; typographic power.
Palette: white #FFFFFF · black #0D0D0D · red #E1251B (one use) · grey #8C8C8C.
Type: Host Grotesk throughout.
Layout: strict 12-column grid; giant numerals (185, 68, 469, 124, 45, 356) are the imagery; thick rules; rows invert on hover.
Signature: the giant numerals drift horizontally as a scroll-linked row.
Motion: medium.

## 30 · Living Network — the evidence network grown like a plant
Feeling: organic, botanical, alive.
Palette: paper #F5F4EE · ink #23261F · leaf #4F7A4A · bloom #C4573A · pollen #D9A441 · grey #B9B8AE.
Type: Hedvig Letters Serif + Hedvig Letters Sans.
Layout: hero: canvas drawing of the real cancer network from media/graph.json laid out radially like a plant (for example cancers grouped by organ system as branches, exposures as leaves), coloured by evidence (Group 1 bloom, 2A/2B pollen). It grows outward on load and sways very slightly. Tools below, each with its own small "plant".
Signature: the network grows.
Motion: ambient.
