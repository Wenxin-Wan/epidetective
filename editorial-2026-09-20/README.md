# Editorial review of epidetective.com, 20 September 2026

One reviewer per site language (English, Chinese, French, Spanish, Russian) read every
page against the English source, against the two tools' own wording, and against the
conventions of the language. A separate structural pass covered links, page furniture,
headings, rendering at phone and desktop width, and every figure the site quotes.

- `findings/` — the five reviewers' raw findings, 362 in all (66 high, 188 medium, 85 low, 23 notes).
- `en.json`, `zh.json`, `fr.json`, `es.json`, `ru.json` — the changes applied to `i18n/<lang>.json`, each with its reason.
- `files.json` — the changes applied to the pages that are written by hand (Code Against Cancer, timeline, the three games, 404).
- `../apply_editorial.py` — applies them. Every edit asserts its anchor, so it cannot half-apply or run twice.

Applied: 198 changes, live in commit `2c30acd`.

## Verified rather than changed

- **Official Code Against Cancer wording.** All 14 Spanish and all 14 French European
  Code recommendations were compared with cancer-code-europe.iarc.who.int on 20 Sep 2026
  and match it word for word. Four Spanish recommendations that a reviewer suspected of
  being softened ("Si fuma, procure dejarlo", "Tome medidas para evitar o reducir",
  "Restrinja la carne roja", "No utilice camas solares") are the official text.
- **Every figure on the English pages.** 185 exposures, 68 cancer types, 469 links,
  249/220 evidence split, 124 risk factors, 45 diseases, 434 graded links, v1.4,
  513 sources, and each game's own numbers all match the tools' own data.
- **The Chinese About section.** Checked by Wenxin personally; left untouched, including
  its wording on the doctorate.

## Left open

- The Chinese About section still says the doctorate was obtained, while the other four
  languages now say the research is complete with the defence on 28 September 2026.
- The two tools carry their interface in ten languages. This review covered the five
  languages of the site itself; the other five (Arabic, German, Italian, Japanese,
  Portuguese) have not been read by a native reviewer.
- The tools' preview banner is written in English and Chinese only.
- Spanish uses *evidencia* on the site and in both tools, where IARC's own Spanish
  releases say *pruebas*. Changing it would mean changing the tools too.
