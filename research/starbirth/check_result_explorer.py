"""Check explanatory graphics against the unchanged published source evidence."""
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public/data/starbirth'
ARTICLE = Path('astrophysics/2026/10/11/hidden-protostars-research-program/index.html')

class Panels(HTMLParser):
    def __init__(self):
        super().__init__()
        self.panels = []
        self.widths = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, attrs['id']
            self.ids.add(attrs['id'])
        if 'data-result' in attrs:
            assert 'hidden' not in attrs, 'All results must be readable without JS'
            self.panels.append(attrs['data-result'])
        if tag == 'span' and attrs.get('style', '').startswith('width:'):
            self.widths.append(float(attrs['style'].split(':')[1].strip('%')))

def check(site=None):
    e15 = json.loads((PUBLIC/'starbirth-e15.json').read_text())
    rank = json.loads((PUBLIC/'missing-view/starbirth-mvr-summary.json').read_text())
    gate = json.loads((PUBLIC/'matched-control/starbirth-mc-profile-gate.json').read_text())
    source = (ROOT/'_includes/starbirth-results.html').read_text()
    parser = Panels(); parser.feed(source)
    assert parser.panels == ['counterparts', 'enrichment', 'ranking', 'controls']
    assert rank['qualifying_positives'] == 27
    assert all(v['reviews'] == 18 for v in rank['primary'].values())
    assert [rank['primary'][m]['selected_proxy_positive'] for m in ['embedding','linear','nonlinear','infrared_only']] == [14,14,15,13]
    assert e15['n_searched'] == 19219 and e15['n_mir_bright'] == 2465
    assert e15['E15a']['table'] == [[230,2235],[63,16691]]
    assert [gate[k] for k in ['requested','targets_with_profile_control','targets_with_profile_uncertainty_control','minimum_required']] == [1000,939,333,800]
    expected = [100*2465/19219, 1000*230/2465, 1000*63/16754] + [100*n/27 for n in [14,14,15,13]] + [93.9,33.3]
    assert len(expected) == len(parser.widths)
    for actual, wanted in zip(parser.widths, expected):
        assert abs(actual-wanted) < .0001, (actual, wanted)
    assert 'physical truth' in source and 'Physical membership remains unverified' in source
    assert 'not physical protostar precision or recall' in source
    assert 'insufficient evidence' in source and 'unmeasured' in source
    if site:
        rendered = (site/ARTICLE).read_text()
        assert '{% include' not in rendered and '&lt;h3 id="ranking-result"' not in rendered
        page = Panels(); page.feed(rendered)
        assert page.panels == parser.panels
        assert '<h3 id="ranking-result">' in rendered
        assert 'Full historical findings and exact sources' in rendered
        assert '20261026' in rendered and 'sbf-expand' in rendered
        for asset in ['public/js/starbirth-program.js','public/css/starbirth-program.css']:
            assert (site/asset).read_bytes() == (ROOT/asset).read_bytes()
    print('PASS: four source-bound results; common-scale bar arithmetic; unchanged denominators; no-JS content; scoped rendered controls and real heading.')

if __name__ == '__main__':
    check(Path(sys.argv[1]) if len(sys.argv)>1 else None)
