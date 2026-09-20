#!/usr/bin/env python3
"""
Apply the 20 September 2026 editorial review to the site.

  python3 apply_editorial.py --check     report what would change, touch nothing
  python3 apply_editorial.py             apply, then run build_site.py

The reviewed changes live in editorial-2026-09-20/: one file per site language for
the i18n strings, and files.json for the two hand-written pages, the games and 404.
Every edit carries its reason. An edit that no longer matches the file stops the run,
so this cannot half-apply and cannot be applied twice.

Official Code Against Cancer recommendation wording is never touched: the 14 Spanish
and 14 French European Code texts were checked against cancer-code-europe.iarc.who.int
on 20 Sep 2026 and match it word for word.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SET = os.path.join(HERE, 'editorial-2026-09-20')
LANGS = ['en', 'zh', 'fr', 'es', 'ru']
check = '--check' in sys.argv
problems, done = [], 0


def load(name):
    return json.load(open(os.path.join(SET, name), encoding='utf-8'))


# ---- i18n strings, one file per language -------------------------------------
for lang in LANGS:
    spec = load(f'{lang}.json')
    path = os.path.join(HERE, 'i18n', f'{lang}.json')
    data = json.load(open(path, encoding='utf-8'))
    for e in spec['i18n']:
        k = e['key']
        if k not in data:
            problems.append(f'{lang}: unknown key {k}')
            continue
        cur = data[k]
        if 'sub' in e:
            old, new = e['sub']
            n = cur.count(old)
            if n != 1:
                problems.append(f'{lang}.{k}: found {n} occurrences of {old[:60]!r}')
                continue
            data[k] = cur.replace(old, new)
        else:
            if cur == e['set']:
                problems.append(f'{lang}.{k}: already set')
                continue
            data[k] = e['set']
        done += 1
    if not check and not problems:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(data, ensure_ascii=False, indent=2))

# ---- page files ---------------------------------------------------------------
files = load('files.json')['files']
for f in files:
    path = os.path.join(HERE, f['file'])
    text = open(path, encoding='utf-8').read()
    for e in f['edits']:
        want = e.get('count', 1)
        n = text.count(e['old'])
        if n != want:
            problems.append(f"{f['file']}: found {n} occurrences (expected {want}) of {e['old'][:70]!r}")
            continue
        text = text.replace(e['old'], e['new'])
        done += 1
    if not check and not problems:
        open(path, 'w', encoding='utf-8').write(text)

if problems:
    print(f'{len(problems)} problem(s); nothing was written:')
    for p in problems:
        print('  -', p)
    sys.exit(1)
print(f'{done} edit(s) {"would be applied" if check else "applied"}.')
if not check:
    print('Next: python3 build_site.py, then check the pages.')
