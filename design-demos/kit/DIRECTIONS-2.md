# Directions 31–50

The owner's feedback on round 3: too much nature. They want covers where the visitor can interact with the web of causation directly, on the first screen, and keep interacting with it while they scroll down. Directions 31–41 do exactly that. Directions 42–50 rebuild the best concepts from earlier rounds at the round-3 quality bar.

Everything in BRIEF.md still applies (quality bar, content, QA process, meta files), with these changes:
- No nature photographs or botanical plates in 31–41. Each needs its own refined, expensive-feeling visual language that is not "nature".
- JavaScript is essential for the cover in 31–41, but the page must still read fully without it (show media/tool-cancer-network.svg as a still picture and all text).

---------------------------------------------------------------------------------------------------
## Common rules for the network covers (31–41)

Data and helpers
- Include `<script src="kit/net.js"></script>` before your own script and use `EpiNet` (read kit/net.js: load("cancer"|"chronic"), layout, fit, neighbours, search, LABELS). You may write your own layouts (bipartite, radial, matrix, 3D) from the same data.
- Cancer network: 185 exposures (group "1" | "2A" | "2B", category), 68 cancers (organ system), 469 links ("Established" | "Suspected"). Chronic network (older skeleton, drawing only): 124 risk factors, 45 diseases, links graded "Strong" | "Moderate" | "Suggestive" | "Weak" | "Conflicting".
- Print counts only from CONTENT.md (185 · 68 · 469 and 124 · 45 · 356). Never compute and print other totals as facts.
- Wording: exposures are "Known cause" (Group 1), "Probable cause" (2A), "Possible cause" (2B); links are "Established link" or "Suspected link" (use EpiNet.LABELS). Do not invent risk sizes.

The cover must
1. Fill the first screen with the network itself, interactive at once: hover (desktop) or tap (touch) a node to light it and its links and show its name; click or tap to select it and open a small entry card (name, what it is, its group label for exposures, how many links, a scrollable list of linked items each marked Established or Suspected, and "Open in the explorer →" linking to #).
2. Carry the search: the hero search box highlights matching nodes live as you type and offers a short result list (keyboard navigable: arrows, Enter, Escape). The Try links (aspartame · stroke · coffee) run the search. If a search matches nothing on this map (for example coffee, or stroke on the cancer map), say: "Not on this map. The explorers list every agent and risk factor they cover." Do not claim anything else about it.
3. Keep the headline, the one-line "who" and the caveat on the cover, set so they never fight the network (a quiet column, an overlay with a calm backdrop, or a band).
4. Stay pinned (position: sticky) while a short guided story scrolls past in 3–5 steps, and change state at each step: for example select Tobacco smoking (one exposure, many cancers), select Lung cancer (one cancer, many causes), show only Group 1, then the one lesson "Same certainty, very different size" with its exact figures. The visitor can still hover, tap and search at every step. After the story, the page continues normally with the two explorers, Code Against Cancer, the games and the footer.
5. Work on phones: tap to select, a close button on the card, nothing that needs hover. Never hijack page scrolling (`touch-action: pan-y` on canvases; no wheel capture). Keep the network legible at 390 px wide (fewer labels, larger hit targets).
6. Be fast and calm: canvas 2D (or SVG if under about 800 elements), crisp on high-DPI screens, redraw on demand, resize correctly. With prefers-reduced-motion, transitions are instant and nothing drifts.
7. Be accessible: the search and its result list are fully keyboard operable; selection is announced in an aria-live region; colours carry text labels too.

---------------------------------------------------------------------------------------------------
## 31 · Web of Causation — the reference network cover
Feeling: an editorial science feature; light, exact, generous.
Palette: paper #FAF9F6 · ink #17181B · grey #8B8D92 · Group 1 #B3261E · Group 2A #D9822B · Group 2B #CDB27A · cancer #23324A.
Type: Lora (display and text) + Work Sans (labels, UI).
Layout: full-viewport force layout of the cancer network. Exposures are small dots in group colours; cancers are ink rings sized by number of links; established links solid, suspected links dashed and fainter. Headline and search sit in a quiet column on the left over a soft paper gradient.
Story (pinned): every line is a link IARC has evaluated → Tobacco smoking: one exposure, many cancers → Lung cancer: one cancer, many causes → Group 1 only → same certainty, very different size.
References: the Barabási Lab and Kim Albrecht's network visualisations; "The Human Disease Network" (Goh et al., PNAS, 2007); Zoonotic Web (Information is Beautiful Awards 2024, gold, science, technology and health).

## 32 · Two Shores — the bipartite web
Feeling: Swiss, rigorous, beautifully ordered.
Palette: white #FFFFFF · black #111111 · grey #9A9A9A · one red #D7261E (Group 1 / selection).
Type: Schibsted Grotesk throughout.
Layout: exposures on the left shore (grouped by category, short ticks with labels on hover), cancers on the right shore (grouped by organ system), links as smooth curves between them at low opacity. Hover a node: its curves darken and the names on the far shore appear. Click pins it and opens the card.
Story: scrolling re-sorts the left shore (by category → by IARC group → by number of links) with smooth transitions, then filters to Group 1.
References: Robert Kosara's Parallel Sets; Sankey diagrams; Swiss information design.

## 33 · Certainty Filter — the web you can sharpen
Feeling: a precise laboratory instrument; light and clinical.
Palette: white #FFFFFF · cool grey #E9ECEF · graphite #1D2125 · teal #1F6F6A (controls) · Group 1 #C2362B · 2A #E08A2E · 2B #B9A27A.
Type: IBM Plex Sans (+ IBM Plex Mono only for small numeric readouts).
Layout: the network fills the cover with an instrument-like control bar: a segmented control (Group 1 · + 2A · + 2B) and a toggle (Established only · + Suspected). Changing the filter animates the layout between precomputed states (interpolate positions), showing how the web thins as certainty rises. A live readout states what is shown in words.
Story: scrolling moves the controls from "everything" to "Group 1, established links only", then to the lesson.
References: laboratory instruments; Our World in Data's explorer controls.

## 34 · Wheel — bundled causation
Feeling: an astrolabe or rose window; ivory and ink, very fine lines.
Palette: ivory #F7F3EA · ink #1F1B16 · oxblood #7E1F23 · gold #B08D57 · grey #A59E92.
Type: Libre Baskerville + Hanken Grotesk.
Layout: hierarchical edge bundling. Outer ring: the 68 cancers grouped by organ system with arc labels. Inner ring: the 185 exposures grouped by category. Links bundled through the centre as smooth curves. Hover a cancer or exposure: its bundle lights. Click: the card.
Story: scrolling rotates the wheel so that one organ system after another comes to the reading position, with a short caption each (respiratory, digestive, lymphoid and haematopoietic), then the lesson.
References: Danny Holten, Hierarchical Edge Bundles (IEEE InfoVis, 2006); Martin Krzywinski's Circos.

## 35 · Matrix — every pair at a glance
Feeling: a periodic table or a beautiful ledger; monochrome with one red.
Palette: white #FFFFFF · ink #121212 · grid #EDEDED · established #B3261E · suspected (outlined) #B3261E · grey #8C8C8C.
Type: Geist + Geist Mono (mono only for small indices).
Layout: the cover is the adjacency matrix: rows are the 185 exposures, columns the 68 cancers; filled cell = established link, outlined cell = suspected. A crosshair follows the pointer and names the pair ("Tobacco smoking × Lung cancer: Established link"). Click a row or column label for the card. On phones the matrix stays in a horizontally scrollable frame of its own (the page itself must not scroll sideways).
Story: scrolling reorders rows (by category → by group → by number of links) and columns (by organ system), animated, then highlights Tobacco smoking and Processed meat for the lesson.
References: Jacques Bertin's reorderable matrices (Semiology of Graphics, 1967); Mike Bostock's co-occurrence matrix.

## 36 · Start Anywhere — the web around one thing
Feeling: a calm, premium search product.
Palette: white #FFFFFF · mist #F3F5F7 · ink #14181D · grey #6B7480 · deep teal #0E5E6F · Group colours as in 31.
Type: Golos Text throughout (Cyrillic).
Layout: a large search field is the cover's centre, with starting points beneath it (Tobacco smoking, Processed meat, Aspartame, Lung cancer, Night-shift work, Alcoholic drinks). The network around the chosen node is drawn as an ego network: the node in the middle, its direct links arranged around it (established inner ring, suspected outer ring), second-degree nodes as a faint halo. Choosing another node re-centres smoothly.
Story: scrolling steps through three starts (Aspartame → Processed meat → Lung cancer) and then the lesson.
References: Apple product pages; Spotlight-style search; ego networks in network science.

## 37 · Two Webs — cancer and chronic disease side by side
Feeling: an editorial diptych; ivory and deep ink-blue.
Palette: ivory #F6F2EA · ink blue #14213D · ink #1B1B1B · Group colours for cancer; for chronic grades a single blue ramp (Strong darkest → Weak lightest; Conflicting as a hatched or dashed line).
Type: Fraunces (display, use optical size) + Mulish (text).
Layout: the cover shows both networks: cancer on the ivory half, chronic disease on the ink-blue half. One search box searches both and highlights matches in each. Hover and tap work on both.
Story: scrolling first focuses the cancer web, then the chronic web (with the chronic grade names), then both, then the explorers.
References: editorial diptychs; The Economist and FT side-by-side graphics.

## 38 · Galaxy — a navigable 3D web
Feeling: a planetarium of evidence; dark and luminous, pure data (no photographs).
Palette: deep #070A12 · ink blue #0F1626 · star white #EAF0FF · dim #7C879C · Group 1 #FF6B5B · 2A #FFB547 · 2B #E8D9A8.
Type: Sora throughout.
Layout: a 3D layout of the cancer network (for example the 2D layout plus a depth from category, or a 3D force pass) projected in perspective on canvas with depth fade. Drag to rotate (pointer only; never block page scroll on touch: use a two-finger or explicit rotate control on phones), slow auto-rotation that stops on interaction and with reduced motion. Hover and tap select as elsewhere.
Story: scrolling flies the camera towards Tobacco smoking, then Lung cancer, then pulls back to the whole web for the lesson.
References: Google Arts & Culture experiments; Igloo Inc (Awwwards Site of the Year 2024, scroll-led 3D).

## 39 · Wordweb — the web written in words
Feeling: a typographic poster; black on white, one red.
Palette: white #FFFFFF · black #0E0E0E · grey #B3B3B3 · red #E0301E.
Type: Archivo (use its width axis: condensed for long names).
Layout: every node is drawn as its short name, sized by number of links; links are hairlines behind the words. A collision-aware layout keeps words apart. Hover a word: its linked words turn black and their lines draw; the rest fade. Click: the card.
Story: scrolling steps through exposure categories (Occupational, Lifestyle & diet, Infections, Radiation, Environmental, Medical & pharmaceutical), re-laying out to bring each forward, then the lesson.
References: Experimental Jetset; typographic posters; Moritz Stefaner's label-led graphics.

## 40 · Territories — a map of causes
Feeling: an abstract atlas; muted cartographic tints, not nature.
Palette: paper #F4F2EE · ink #1E2024 · six muted tints for exposure categories (for example #D9C9B6, #C9D3DE, #D7CFE2, #CFDCCF, #E6D2CC, #D8D6C4) · Group 1 #A8322D.
Type: Fira Sans + Fira Sans Condensed (Cyrillic).
Layout: a clustered layout: each exposure category forms a territory, drawn as a soft rounded region behind its nodes, with map-like spaced capital labels; cancers sit along the borders between the territories they link. Hover and click as elsewhere.
Story: scrolling pans and zooms territory by territory (Occupational → Lifestyle & diet → Infections), then pulls back for the lesson.
References: Katy Börner's "Places & Spaces: Mapping Science"; subway-map and atlas design.

## 41 · Ledger — scroll the index, the web answers
Feeling: a fine reference book: an index on one side, the living web on the other.
Palette: paper #FBFAF7 · ink #1A1A1A · rule #E2DFD8 · Group colours as in 31 · selection #1F3A5F.
Type: Source Serif 4 (display and text) + Source Sans 3 (index and labels).
Layout: the cover is split: a long alphabetical index of exposures and cancers on the left (with group marks), the network pinned on the right. As the visitor scrolls down the index, the entry at the reading line becomes selected and the network answers: that node and its links light up. Clicking any index entry or node selects it. The search filters the index.
Story: the index itself is the scroll interaction; before it, a short intro; after the index, the lesson and the explorers. Keep the index scroll to the cover section only (about 2–3 screens; show a representative selection with "Show all" if needed).
References: book indexes; Wikipedia-style reference design; linked views in data visualisation.

---------------------------------------------------------------------------------------------------
## Rebuilds of earlier concepts (42–50)

Open the old file to understand the concept, then build it again from scratch at the round-3 quality bar with CONTENT.md, the kit, and a QA process. Keep the concept and its signature moment; improve everything else (type, spacing, imagery, motion, responsiveness). Do not reuse old CSS wholesale. Avoid nature photographs unless the concept needs them.

## 42 · Quiet Clinic — calm health product (old: 3-quiet-clinic.html)
Search-first and calm; one action per screen; the four evidence labels folded as an accordion under the one lesson. Palette pine and linen (#2D5B4F, #EFF2F0, #FFFFFF, #1B2621). Type: Newsreader + Public Sans. References: Apple Health, One Medical, GOV.UK and NHS.UK service design.

## 43 · Focus — the microscope (old: 8-focus.html)
Round microscope fields that sharpen at the middle of the screen; the four IARC groups shown as four levels of focus (Group 3 must read as "not classifiable", never as "harmless"). Stain palette (haematoxylin purple #2B2150, eosin pink #E07BA5, slide #FBF9FC). Type: Petrona + Onest. Draw the cells yourself (canvas), as before, but more refined.

## 44 · Ladder — one colour field per group (old: 9-ladder.html)
One full screen per IARC group, flat colour fields (red, orange, yellow, grey), each saying what the label claims and what it does not; gentle scroll-snap; a slim progress rail. Then the explorers. Make it feel like a luxury campaign, not a slideshow. Type: Epilogue.

## 45 · Exhibition — walk through the rooms (old: 10-exhibition.html)
A title wall, then vertical scrolling walks sideways through five rooms with framed objects and museum wall labels; stacks vertically on phones and with reduced motion. Objects: the two network drawings, Hooke's cork plate (media/plate-hooke-cork) and John Snow's map (media/plate-snow-map) as framed works, the games as a small trio. Type: Sofia Sans + Sofia Sans Extra Condensed.

## 46 · Manifesto — three statements (old: 11-manifesto.html)
"A hazard is not a risk." "Sure is not big." "A population is not a person." Each set huge in a Didone and assembled word by word as it scrolls; then the explorers as a typographic index with large rows. Type: Bodoni Moda + Karla. Palette white, black, ultramarine #2337C6.

## 47 · Card Stack — one card at a time (old: 12-card-stack.html)
Each section is a card that slides up and settles over the last (sticky stacking, the one behind shrinks a little). Cards: hero with search, the lesson (bars to scale), each explorer, Code Against Cancer, games. Type: Lexend. Make the card colours sophisticated (not candy).

## 48 · Instrument — hardware modules (old: 13-instrument.html)
The page as precision hardware modules with dot-matrix readouts and a dial that turns to show which module you are on. Type: Albert Sans + Doto. Palette warm grey, graphite, signal orange #FF5B14. Lessons: Dieter Rams, Teenage Engineering.

## 49 · Explorable — the annotated notebook (old: 14-explorable.html)
One reading column on fine graph paper; highlights, circles and handwritten margin notes draw themselves as each passage arrives. Type: Alegreya + Alegreya Sans + Caveat for notes. Handwriting used sparingly and elegantly. Lessons: Bret Victor's Explorable Explanations, Nicky Case, Distill.

## 50 · Illustrated — the friendly explainer (old: 15-illustrated.html)
Flat, considered illustration (drawn in SVG yourself) that pops in as you scroll: a magnifying glass over a network, two boxes with the same "Group 1" tag, a shield for Code Against Cancer. Warm and approachable for the public and schools, but crafted like a premium editorial illustration, not clip-art. Type: Bricolage Grotesque + Atkinson Hyperlegible.
