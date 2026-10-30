#!/usr/bin/env python3
"""Write data/work.json, the data behind the Work and cancer page (work.html).

Run it locally, from anywhere:

    python3 design/scripts/build_work_data.py

It reads files outside this repository, so the GitHub Action never runs it.
build_site.py reads only the committed output, data/work.json. Run this again
after the cancer or the chronic tool is republished, then python3 build_site.py.

Inputs (read only):
  ../data/evidence_graph.json      the cancer dataset: the agents in category
                                   Occupational, their links, names (name_i18n)
                                   and the volume and year of each evaluation
  ../data/classification.json      cross-check of that volume and year
  ../deploy/index.html             the published cancer page: every id this page
                                   links to must exist in its DATA, with the same
                                   group, links and names
  ../deploy/chronic/index.html     the published chronic page: the risk factors in
                                   category Occupational and their graded links
  ../app/chronic_template.html     NAMES (fr, es, ru names of risks and diseases),
                                   read with ../tools/ui_strings.mjs
  scripts/work_sectors.json        the sector grouping (EpiDetective's, owner-reviewed)
  code-against-cancer/index.html   REGIONS: European Code recommendation 9, verbatim
  ../review-2026-10-28/records/research.json
                                   the justification paper of recommendation 9

It stops with an error when an Occupational agent is missing from the grouping
or listed twice, when the grouping names an agent that is not Occupational, or
when an id, a name or a link differs from the published pages.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile

DESIGN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(DESIGN)
LANGS = ["en", "zh", "fr", "es", "ru"]
SRC = {
    "graph": os.path.join(ROOT, "data", "evidence_graph.json"),
    "classification": os.path.join(ROOT, "data", "classification.json"),
    "cancer_page": os.path.join(ROOT, "deploy", "index.html"),
    "chronic_page": os.path.join(ROOT, "deploy", "chronic", "index.html"),
    "chronic_template": os.path.join(ROOT, "app", "chronic_template.html"),
    "sectors": os.path.join(DESIGN, "scripts", "work_sectors.json"),
    "code_page": os.path.join(DESIGN, "code-against-cancer", "index.html"),
    "research": os.path.join(ROOT, "review-2026-10-28", "records", "research.json"),
}
UI_STRINGS = os.path.join(ROOT, "tools", "ui_strings.mjs")
OUT = os.path.join(DESIGN, "data", "work.json")

OCCUPATIONAL = "Occupational"
EXPECTED_AGENTS = 68
EXPECTED_SECTORS = ["construction", "metals", "fuels", "chemicals", "cleaning", "printing",
                    "beauty", "emergency", "shift", "farming", "parents"]
EXPECTED_CHRONIC = 8
REC = 9                      # European Code recommendation 9, "Protect yourself at work"
REC_DOI = "10.1002/1878-0261.70174"
GRADES = ["Strong", "Moderate", "Suggestive", "Weak", "Conflicting"]


def fail(msg):
    sys.exit("build_work_data.py: " + msg)


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def embedded(path, marker):
    """The JSON value that follows `marker` in a page (const DATA = ..., var REGIONS = ...)."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    i = text.find(marker)
    if i < 0:
        fail("%s has no %r" % (path, marker))
    value, _ = json.JSONDecoder().raw_decode(text[i + len(marker):])
    return value


def tool_names(template):
    """NAMES of the chronic template (fr, es, ru ...), through tools/ui_strings.mjs."""
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "names.json")
        run = subprocess.run(["node", UI_STRINGS, "extract", template, "NAMES", out],
                             capture_output=True, text=True)
        if run.returncode != 0:
            fail("ui_strings.mjs extract NAMES failed:\n" + run.stdout + run.stderr)
        return read_json(out)


def localised(base, i18n, what):
    """{en, zh, fr, es, ru} from an English name and a name_i18n object."""
    names = {"en": base}
    for lang in LANGS[1:]:
        value = (i18n or {}).get(lang)
        if not value:
            fail("%s has no %s name" % (what, lang))
        names[lang] = value
    return names


def established(link):
    # the cancer tool's own rule (bucket() in app_template.html): sufficient
    # evidence in people is an established link, anything else a suspected one.
    # The tool files a Group 3 link apart, so build_sectors() refuses one.
    return link["evidence"] == "Sufficient"


def build_sectors(graph, classification, page):
    exposures = {e["id"]: e for e in graph["exposures"]}
    cancers = {c["id"]: c for c in graph["cancers"]}
    occupational = {i for i, e in exposures.items() if e["category"] == OCCUPATIONAL}
    if len(occupational) != EXPECTED_AGENTS:
        fail("expected %d Occupational agents, found %d" % (EXPECTED_AGENTS, len(occupational)))

    grouping = read_json(SRC["sectors"])["sectors"]
    ids = [s["id"] for s in grouping]
    if ids != EXPECTED_SECTORS:
        fail("sectors must be, in order, %s; found %s" % (EXPECTED_SECTORS, ids))
    listed = [a for s in grouping for a in s["agents"]]
    seen, twice = set(), []
    for a in listed:
        if a in seen:
            twice.append(a)
        seen.add(a)
    missing = sorted(occupational - seen)
    stray = sorted(seen - occupational)
    if twice or missing or stray:
        fail("sector grouping is not a partition of the %d Occupational agents:\n"
             "  listed twice: %s\n  missing: %s\n  not Occupational: %s"
             % (EXPECTED_AGENTS, twice, missing, stray))

    # the published page: deep links must resolve, and the page must show what
    # the panel shows
    p_exp = {e["id"]: e for e in page["exposures"]}
    p_can = {c["id"]: c for c in page["cancers"]}
    p_links = {}
    for l in page["links"]:
        p_links.setdefault(l["exposure"], []).append((l["cancer"], l["evidence"], l["group"]))
    links = {}
    for l in graph["links"]:
        links.setdefault(l["exposure"], []).append(l)

    sectors = []
    for s in grouping:
        rows = []
        for aid in s["agents"]:
            e = exposures[aid]
            pe = p_exp.get(aid)
            if pe is None:
                fail("%r is not in the published cancer DATA" % aid)
            for field in ("name", "name_i18n", "group", "category", "classification"):
                if pe.get(field) != e.get(field):
                    fail("%r: field %s differs between data/evidence_graph.json and "
                         "deploy/index.html; publish the tool first" % (aid, field))
            mine = sorted((l["cancer"], l["evidence"], l["group"]) for l in links.get(aid, []))
            if mine != sorted(p_links.get(aid, [])):
                fail("%r: links differ from the published page" % aid)
            if e["group"] not in ("1", "2A", "2B", "3"):
                fail("%r: unexpected group %r" % (aid, e["group"]))
            cl = e.get("classification") or {}
            ref = classification["exposures"].get(aid) or {}
            if not cl.get("volume") or not cl.get("year"):
                fail("%r has no volume or year" % aid)
            if (cl.get("volume"), cl.get("year")) != (ref.get("volume"), ref.get("year")):
                fail("%r: volume/year %s differ from data/classification.json %s"
                     % (aid, (cl.get("volume"), cl.get("year")), (ref.get("volume"), ref.get("year"))))
            est, sus = [], []
            for l in sorted(links.get(aid, []), key=lambda l: cancers[l["cancer"]]["name"].casefold()):
                if l["group"] == "3":
                    fail("%r: link to %r is in Group 3, which the tool lists apart; "
                         "this page has no column for it" % (aid, l["cancer"]))
                c = cancers[l["cancer"]]
                if c["id"] not in p_can:
                    fail("cancer %r is not in the published cancer DATA" % c["id"])
                item = {"id": c["id"], "name": localised(c["name"], c.get("name_i18n"), c["id"])}
                (est if established(l) else sus).append(item)
            if not est and not sus:
                fail("%r has no link" % aid)
            rows.append({
                "id": aid,
                "name": localised(e["name"], e.get("name_i18n"), aid),
                "group": e["group"],
                "volume": str(cl["volume"]),
                "year": int(cl["year"]),
                "established": est,
                "suspected": sus,
            })
        sectors.append({"id": s["id"], "agents": rows})
    return sectors


def build_chronic(page, names):
    risks = [r for r in page["risks"] if r["category"] == OCCUPATIONAL]
    if len(risks) != EXPECTED_CHRONIC:
        fail("expected %d Occupational chronic risk factors, found %d" % (EXPECTED_CHRONIC, len(risks)))
    diseases = {d["id"]: d for d in page["diseases"]}

    def names_of(kind, obj):
        out = {"en": obj["name"], "zh": obj.get("name_zh")}
        for lang in ("fr", "es", "ru"):
            out[lang] = (names.get(lang, {}).get(kind, {}) or {}).get(obj["id"])
        empty = [l for l in LANGS if not out.get(l)]
        if empty:
            fail("chronic %s %r has no name in %s" % (kind, obj["id"], empty))
        return out

    out = []
    for r in risks:
        counted, related = [], 0
        for l in page["links"]:
            if l["risk"] != r["id"]:
                continue
            if l.get("related_outcome"):
                related += 1
                continue
            if l["grade"] not in GRADES:
                fail("link %s|%s has grade %r" % (r["id"], l["disease"], l["grade"]))
            d = diseases.get(l["disease"])
            if d is None:
                fail("link %s|%s names an unknown disease" % (r["id"], l["disease"]))
            counted.append({"disease": d["id"], "name": names_of("d", d), "grade": l["grade"]})
        if len(counted) != r.get("n_links") or related != r.get("n_related"):
            fail("chronic %r: %d counted and %d related links, DATA says %s and %s"
                 % (r["id"], len(counted), related, r.get("n_links"), r.get("n_related")))
        counted.sort(key=lambda x: (GRADES.index(x["grade"]), x["name"]["en"].casefold()))
        out.append({"id": r["id"], "name": names_of("r", r), "links": counted, "n_related": related})
    return out


def build_rec9():
    regions = embedded(SRC["code_page"], "var REGIONS = ")
    europe = next((r for r in regions if r.get("id") == "europe"), None)
    if not europe or len(europe.get("recs", [])) < REC:
        fail("the Code page has no European recommendation %d" % REC)
    title, text = europe["recs"][REC - 1]
    for part, what in ((title, "title"), (text, "text")):
        empty = [l for l in LANGS if not part.get(l)]
        if empty:
            fail("European recommendation %d has no %s in %s" % (REC, what, empty))
    if title["en"] != "Protect yourself at work":
        fail("European recommendation %d is %r; expected the work recommendation" % (REC, title["en"]))

    research = read_json(SRC["research"])["item4_ecac5_justification_dois"]
    if research["recommendation_to_doi"][str(REC)]["doi"] != REC_DOI:
        fail("research.json gives another DOI for recommendation %d" % REC)
    paper = next(p for p in research["papers"] if p["doi"] == REC_DOI)
    return {
        "number": REC,
        "title": {l: title[l] for l in LANGS},
        "text": {l: text[l] for l in LANGS},
        "official_langs": list(europe.get("officialLangs", [])),
        "official": europe["official"],
        "official_by_lang": dict(europe.get("officialByLang", {})),
        "justification": {
            "doi": paper["doi"],
            "title": paper["justification_page_link_text"],
            "journal": paper["journal"],
            "volume": paper["volume"],
            "issue": paper["issue"],
            "pages": paper["pages"],
            "year": paper["issued"][0][0],
        },
    }


def main():
    for key, path in SRC.items():
        if not os.path.exists(path):
            fail("missing input %s (%s)" % (key, path))
    graph = read_json(SRC["graph"])
    classification = read_json(SRC["classification"])
    cancer_page = embedded(SRC["cancer_page"], "const DATA = ")
    chronic_page = embedded(SRC["chronic_page"], "const DATA = ")

    work = {
        "_about": "Generated by scripts/build_work_data.py; do not edit by hand. "
                  "Edit scripts/work_sectors.json and run the script again.",
        # no run date here: the same inputs give the same file, byte for byte
        "meta": {
            "cancer_version": cancer_page["meta"].get("version"),
            "cancer_built": cancer_page["meta"].get("built"),
            "chronic_version": chronic_page["meta"].get("version"),
            "chronic_built": chronic_page["meta"].get("built"),
            "sources": {k: {"path": os.path.relpath(p, ROOT), "sha256": sha256(p)}
                        for k, p in SRC.items()},
        },
        "sectors": build_sectors(graph, classification, cancer_page),
        "ecac5_rec9": build_rec9(),
        "chronic": build_chronic(chronic_page, tool_names(SRC["chronic_template"])),
    }
    n = sum(len(s["agents"]) for s in work["sectors"])
    work["meta"]["counts"] = {"agents": n, "sectors": len(work["sectors"]),
                              "chronic_risks": len(work["chronic"])}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(work, ensure_ascii=False, indent=1) + "\n")
    print("Wrote %s: %d agents in %d sectors, %d chronic workplace risks."
          % (os.path.relpath(OUT, ROOT), n, len(work["sectors"]), len(work["chronic"])))


if __name__ == "__main__":
    main()
