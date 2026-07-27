#!/usr/bin/env python3
"""Render the EpiDetective site once per language.

WordPress.com Simple strips JavaScript, so a live language switcher cannot run
there. Instead each language gets its own real page and the switcher is plain
links -- which also gives correct URLs and hreflang for search engines.

  design/index.html          en
  design/zh/index.html       zh
  design/fr/index.html       fr   ... etc

Run:  python3 build_site.py
"""
import json
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
I18N = os.path.join(HERE, "i18n")
TPL = os.path.join(HERE, "templates")

# en first: it is the source of truth for key parity
LANGS = ["en", "zh", "fr", "es", "ru"]
PAGES = {"index.html": "home", "explorer.html": "explorer"}
TOOL_URL = "https://wenxin-wan.github.io/cancer-evidence-explorer/"
# The one genuine Note currently published, still living on the WordPress site
NOTE1_URL = "https://epidetective.com/2026/02/28/how-to-know-the-unknown/"

PLACEHOLDER = re.compile(r"\{\{([a-zA-Z0-9_.]+)\}\}")


def load(lang):
    with open(os.path.join(I18N, "%s.json" % lang), encoding="utf-8") as fh:
        return json.load(fh)


def url(lang, page, from_lang):
    """Relative URL to `page` in `lang`, seen from a page in `from_lang`.

    Links within the same language must stay bare filenames. Emitting
    "../zh/index.html" from inside zh/ resolves to the same file, but the
    browser treats it as a different URL and reloads the whole page, so
    in-page anchors stop working.
    """
    if lang == from_lang:
        return page
    prefix = "" if from_lang == "en" else "../"
    sub = "" if lang == "en" else lang + "/"
    return prefix + sub + page


def main():
    data = {l: load(l) for l in LANGS}

    # --- key parity: a missing key must fail the build, not silently ship English
    base = set(data["en"])
    problems = []
    for l in LANGS[1:]:
        missing = base - set(data[l])
        extra = set(data[l]) - base
        if missing:
            problems.append("%s missing %d: %s" % (l, len(missing), sorted(missing)[:6]))
        if extra:
            problems.append("%s has %d unknown: %s" % (l, len(extra), sorted(extra)[:6]))
        empty = [k for k, v in data[l].items() if not str(v).strip()]
        if empty:
            problems.append("%s empty values: %s" % (l, empty[:6]))
    if problems:
        raise SystemExit("Translation key problems:\n  " + "\n  ".join(problems))

    templates = {}
    for page in PAGES:
        with open(os.path.join(TPL, page), encoding="utf-8") as fh:
            templates[page] = fh.read()

    written = []
    for lang in LANGS:
        d = data[lang]
        outdir = HERE if lang == "en" else os.path.join(HERE, lang)
        os.makedirs(outdir, exist_ok=True)

        # language switcher: plain links, no JavaScript required
        switch = []
        for other in LANGS:
            label = data[other]["lang.name"]
            if other == lang:
                switch.append('<span class="lang-cur" aria-current="true">%s</span>' % label)
            else:
                switch.append('<a href="%s" hreflang="%s">%s</a>'
                              % (url(other, "index.html", lang), other, label))
        switch_html = "".join(switch)

        for page in PAGES:
            # hreflang alternates for this page across every language
            alts = ['<link rel="alternate" hreflang="%s" href="%s">'
                    % (o, url(o, page, lang)) for o in LANGS]
            alts.append('<link rel="alternate" hreflang="x-default" href="%s">'
                        % url("en", page, lang))

            ctx = dict(d)
            ctx["LANG"] = lang
            ctx["DIR"] = d.get("lang.dir", "ltr")
            ctx["PREFIX"] = "" if lang == "en" else "../"
            ctx["URL_HOME"] = url(lang, "index.html", lang)
            ctx["URL_EXPLORER"] = url(lang, "explorer.html", lang)
            ctx["URL_TOOL"] = TOOL_URL
            ctx["URL_NOTE1"] = NOTE1_URL
            ctx["LANGSWITCH"] = switch_html
            ctx["HREFLANG"] = "\n".join(alts)

            missing = []

            def sub(m):
                k = m.group(1)
                if k not in ctx:
                    missing.append(k)
                    return m.group(0)
                return str(ctx[k])

            html = PLACEHOLDER.sub(sub, templates[page])
            if missing:
                raise SystemExit("%s/%s: unresolved placeholders %s"
                                 % (lang, page, sorted(set(missing))))

            path = os.path.join(outdir, page)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html)
            written.append(os.path.relpath(path, HERE))

    print("Built %d pages across %d languages:" % (len(written), len(LANGS)))
    for w in written:
        print("   ", w)
    print("\nKey count: %d strings x %d languages" % (len(base), len(LANGS)))


if __name__ == "__main__":
    main()
