#!/usr/bin/env python3
"""Derive graph.json and chronic-graph.json from the published tools.

The network pictures behind the site's text (assets/network.svg,
assets/chronic-network.svg) are baked from these two skeleton files by
make_network_svg.py and make_chronic_svg.py. Deriving them from the tools'
own data keeps the pictures in step with the counts the site states.

Run after publishing either tool:
  python3 make_graph_json.py && python3 make_network_svg.py && python3 make_chronic_svg.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DEPLOY = os.path.join(HERE, '..', 'deploy')


def page_data(path):
    text = open(path, encoding='utf-8').read()
    m = re.search(r'const DATA\s*=\s*', text)
    return json.JSONDecoder().raw_decode(text[m.end():])[0]


# Cancer Evidence Explorer: exposures, then cancer sites; e = 1 for an established link
C = page_data(os.path.join(DEPLOY, 'index.html'))
nodes = [{'n': e['name'], 't': 'e', 'g': e['group'], 'c': e['category']} for e in C['exposures']]
nodes += [{'n': c['name'], 't': 'c', 'o': c['organ']} for c in C['cancers']]
idx = {('e', e['id']): i for i, e in enumerate(C['exposures'])}
idx.update({('c', c['id']): len(C['exposures']) + i for i, c in enumerate(C['cancers'])})
links = [{'s': idx[('e', l['exposure'])], 't': idx[('c', l['cancer'])], 'e': int(l['evidence'] == 'Sufficient')}
         for l in C['links']]
est = sum(l['e'] for l in links)
with open(os.path.join(HERE, 'graph.json'), 'w', encoding='utf-8') as fh:
    json.dump({'nodes': nodes, 'links': links,
               'stats': {'exposures': len(C['exposures']), 'cancers': len(C['cancers']), 'links': len(links),
                         'established': est, 'suspected': len(links) - est}}, fh, ensure_ascii=False)

# Chronic Disease Evidence Explorer: diseases, then risk factors
K = page_data(os.path.join(DEPLOY, 'chronic', 'index.html'))
nodes = [{'n': d['name'], 't': 'd', 'g': d['system']} for d in K['diseases']]
nodes += [{'n': r['name'], 't': 'r', 'g': r['category']} for r in K['risks']]
idx = {('d', d['id']): i for i, d in enumerate(K['diseases'])}
idx.update({('r', r['id']): len(K['diseases']) + i for i, r in enumerate(K['risks'])})
links = [{'s': idx[('r', l['risk'])], 't': idx[('d', l['disease'])], 'g': l['grade'], 'e': l['ess'],
          'p': int(l['direction'] == 'protective')} for l in K['links']]
with open(os.path.join(HERE, 'chronic-graph.json'), 'w', encoding='utf-8') as fh:
    json.dump({'note': 'Node/link skeleton of the Chronic Disease Evidence Explorer (version %s), used only to bake '
                       'the static picture. The tool itself carries the full dataset.' % K['meta']['version'],
               'nodes': nodes, 'links': links}, fh, ensure_ascii=False)
print('graph.json: %d links (%d established); chronic-graph.json: %d links' % (len(C['links']), est, len(K['links'])))
