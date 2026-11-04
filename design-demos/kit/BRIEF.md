# Brief for the EpiDetective design demos (round 3)

## The site and the owner
EpiDetective (epidetective.com) is a personal project by Wenxin Wan, a cancer epidemiologist in Lyon. It publishes free tools that show what causes cancer and other chronic diseases and how sure the evidence is (IARC Monographs, published reviews). Readers: the curious public, clinicians, students, journalists; three games serve schools and families.

The owner rejected two earlier rounds as crowded, template-like and "not elegant". What they want now, in their words: simple but informative and powerful; they like nature; they like design that feels expensive, and believe there are lessons in how luxury brands design their sites.

Your job: build home-page demos that a demanding art director would call beautiful. Quality is the whole point. One excellent page beats three adequate ones.

## What makes a page feel expensive (apply all of these)
1. Space. Generous margins and section spacing (sections commonly clamp(96px, 12vw, 200px) apart). One idea per screen. Nothing touches anything it does not need to.
2. Restraint. Two typefaces at most. Three to five colours. One accent, used rarely. At most one filled button style; secondary actions are text links.
3. Typography with intent. A clear scale (for example 12 / 15 / 18 / 24 / 36 / 56 / 88). Body 17–19 px with line-height 1.55–1.7 and a 60–70 character measure. Display sizes with tight leading (0.95–1.1) and optical tracking (negative for large sans and Didones, slightly positive for small caps). Real italics, never fake. Old-style numerals in prose where the font has them, lining tabular numerals for figures. `text-wrap: balance` on headings, `pretty` on paragraphs. Small uppercase labels only where they carry information, at 11–12 px with 0.12–0.2em tracking, never above every block.
4. Imagery as the hero. Use the media/ photographs and plates large: full-bleed, tall crops, or framed with a wide passe-partout. Never small thumbnails in bordered boxes. Choose `object-position` so the subject sits well. Overlays only to keep text legible, and subtle.
5. Slow, purposeful motion. Durations 700–1600 ms, easing cubic-bezier(.2,.7,.1,1). Elements reveal once. One signature moment per page (given in the direction). No bounce, no spin, no parallax on text. Everything works and is fully visible with JavaScript off and with prefers-reduced-motion.
6. Fine details. Hairline rules (1px, low contrast). Aligned baselines and edges. Hover states that are quiet (underline that grows, colour shift). Visible keyboard focus that matches the design. Consistent spacing tokens.
7. The tools are the flagship products. Present the two explorers the way a luxury house presents its signature product: large, named, with their three key figures and an image, and one clear "Open the explorer" action.

## What to avoid (these read as AI-generated or cheap)
- Tiny monospace uppercase "eyebrow" labels above every section; an italic phrase in every headline; everything centred; rounded cards with drop shadows everywhere; chips and pills; emoji; icon rows; gradient blobs; purple-blue gradients; glassmorphism.
- Inter, Space Grotesk, Poppins, Montserrat, Raleway.
- Crowding: more than one primary action per section; paragraphs longer than the content needs.
- Bright cartoon game screenshots dominating a calm page (present them small, consistently cropped, or in a quiet frame).
- Inventing facts, numbers, dates, awards, issue numbers or quotes. Use only kit/CONTENT.md content.

## Content
Use design-demos/kit/CONTENT.md. You may shorten further and restructure, but keep every number exact, keep the disclaimer and credits, and keep the wordmark "EpiDetective".

## Technical rules
- One self-contained HTML file per demo at design-demos/NN-slug.html (slug from kit/kit.js DEMOS list). Start with <!doctype html>, <html lang="en">, charset and viewport meta (`width=device-width, initial-scale=1, viewport-fit=cover`), a <title> "NN · Name — EpiDetective demo".
- Fonts: Google Fonts <link> only (with preconnect), with real fallback stacks. Only the families named in your direction (you may add one if truly needed; say why in the meta file).
- Include the kit: `<link rel="stylesheet" href="kit/kit.css">` and `<script src="kit/kit.js" defer></script>`. Use its attributes (data-reveal="fade|rise|scale|mask|wipe", data-split on headings, style="--d:200ms" for stagger, data-parallax, data-progress (gives --p 0..1), data-count). Do not edit kit files.
- Images only from media/ (relative paths like media/photo-....webp). No other hosts, no hotlinking. Use `loading="lazy"` below the fold, width/height attributes, meaningful alt text (or alt="" for decoration). Use the -1000 variants for anything displayed under ~900px wide.
- Credits: in the footer, list each image used: title or subject, author, licence (from media/credits.json).
- Your own JS inline at the end of body, small, no libraries (canvas drawing is fine). Respect reduced motion.
- Every colour defined as a CSS custom property in :root. Each demo is a single deliberate look (light or dark as the direction says); set body background explicitly. No dark-mode variant needed.
- Responsive: must look designed at 1440, 1024, 768 and 390 px wide. No horizontal scroll at any width (watch long words, grids without minmax(0,1fr), wide canvases, 100vw). Give flex/grid children min-width:0 where text lives. Navigation collapses gracefully on phones (a simple row that wraps, or a few links; no hamburger needed).
- Accessibility: landmarks (header, main, footer), one h1, logical headings, contrast at least WCAG AA for text, focus-visible styles, form label for the search (visually hidden is fine), skip link optional.
- Search: a real <form role="search"> with <label>, input id="q" and a submit button; onsubmit="return false". Try links are plain links.
- Links go to "#" (they are demos).
- Performance: keep each page light; at most two large images above the fold.

## Quality process (mandatory)
1. Read BRIEF.md, CONTENT.md and your directions in DIRECTIONS.md, and media/credits.json.
2. Before coding each demo, write the token block (colours, type scale, spacing) at the top of its <style>, then build.
3. Check with the QA script (server at http://127.0.0.1:8765 already serves the repository):
   `node /tmp/claude-0/-home-user-epidetective/ed00db8a-2618-5cc9-a780-66d0704d3a90/scratchpad/qa/qa.js 05-fibre`
   It writes one contact sheet per demo (desktop at four scroll depths, phone at two) to
   /tmp/claude-0/-home-user-epidetective/ed00db8a-2618-5cc9-a780-66d0704d3a90/scratchpad/qa/out/05-fibre.jpg and prints horizontal overflow and console errors. Look at the sheet with the Read tool.
4. Critique it honestly like an art director: spacing, hierarchy, alignment, type sizes, image crops, contrast, anything that looks cheap, crowded or broken. Fix and re-run. Do at least two improvement passes per demo, at most four.
5. Write design-demos/kit/meta/NN.json: {"n":NN,"slug":"…","name":"…","line":"one sentence: what it is and its signature moment","palette":["#…",…],"fonts":["…","…"],"images":["media/…"],"notes":"anything the owner should know (for example a typeface without Cyrillic)"}.

## Report back
For each demo: file name, one sentence on the result, and any compromise you made. Keep the report short.
