"""Independent compact-evidence arithmetic and rendered-publication checks."""
import csv
import hashlib
import json
import sys
from fractions import Fraction
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public/data/starbirth'
ARTICLE = '/astrophysics/2026/10/11/hidden-protostars-research-program/'

def check_evidence():
    entries = list(csv.DictReader((PUBLIC / 'source-inventory.csv').open()))
    assert len(entries) == 9
    for item in entries:
        data = (PUBLIC / item['public_file']).read_bytes()
        assert len(data) == int(item['bytes'])
        assert hashlib.sha256(data).hexdigest() == item['sha256']
        assert item['source_revision'] == '3ae8c22bbd4bf73c68074e0cc44d63094c509e0e'
    load = lambda name: json.loads((PUBLIC / name).read_text())
    e15 = load('starbirth-e15.json')
    assert e15['n_searched'] == 19219 and e15['n_mir_bright'] == 2465
    assert e15['E15a']['table'] == [[230, 2235], [63, 16691]]
    assert round(100 * Fraction(2465, 19219), 1) == Fraction("12.8")
    assert round(100 * Fraction(230, 2465), 1) == Fraction("9.3")
    assert round(100 * Fraction(63, 16754), 2) == Fraction("0.38")
    for name, p in [('starbirth-e27.json', .4886), ('starbirth-e28.json', .528)]:
        evidence = load(name)
        assert evidence['lr_p'] == p
        lo, hi = evidence['clip_coef_ci95_bootstrap']
        assert lo < 0 < hi
    witness = load('starbirth-n20-witness.json')
    observed = list(map(Fraction, witness['observable']))
    assert sum(observed) == 1
    for alternative in witness['alternatives']:
        pi = Fraction(alternative['prevalence'])
        p0 = list(map(Fraction, alternative['p0']))
        p1 = list(map(Fraction, alternative['p1']))
        assert sum(p0) == sum(p1) == 1 and min(p0 + p1) >= 0
        assert [(1-pi)*a + pi*b for a,b in zip(p0,p1)] == observed
    assert witness['alternatives'][0]['prevalence'] != witness['alternatives'][1]['prevalence']
    assert witness['alternatives'][0]['p1'] == witness['alternatives'][1]['p1']
    checkpoint = load('starbirth-c6828-checkpoint.json')
    assert checkpoint['status'] == 'complete_unit_insufficient_evidence'
    assert checkpoint['physical_birth_confirmed'] is False
    assert checkpoint['source_separation_fit_performed'] is False
    core = load('starbirth-core-verification.json')
    assert core['new_births'] == 0 and core['physical_fraction_or_lifetime_identified'] is False
    assert (PUBLIC / 'README.md').read_bytes() == (ROOT / 'research/starbirth/README.md').read_bytes()
    return entries

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            assert attrs['id'] not in self.ids, 'Duplicate id: ' + attrs['id']
            self.ids.add(attrs['id'])
        for key in ['href', 'src']:
            if attrs.get(key):
                self.urls.append(attrs[key])

def check_rendered(destination, entries):
    html = (destination / ARTICLE.strip('/') / 'index.html').read_text()
    assert '{{' not in html and '{%' not in html
    for term in ['Hidden protostars', '19,219', '16,754', '64 MiB',
                 'The measurement protocol is frozen', 'invented values',
                 'No confirmed stellar birth', '9–25%', '45–55%']:
        assert term in html, 'Missing claim/qualification: ' + term
    page = Page()
    page.feed(html)
    for url in page.urls:
        parts = urlsplit(url)
        if url.startswith('#') and parts.fragment:
            assert parts.fragment in page.ids, 'Broken anchor: ' + url
        if url.startswith('/'):
            path = destination / unquote(parts.path).lstrip('/')
            assert path.exists() or (path / 'index.html').exists(), 'Missing internal asset: ' + url
    for entry in entries:
        assert (destination / 'public/data/starbirth' / entry['public_file']).read_bytes() == \
               (PUBLIC / entry['public_file']).read_bytes()
    for path in ['index.html', 'lab/index.html', 'atom.xml', 'sitemap.xml']:
        rendered = (destination / path).read_text()
        assert ARTICLE in rendered, 'Program missing from ' + path
    print('PASS: 9 complete evidence hashes, independently recomputed counts and exact witness, '
          'qualifications, internal links, assets, homepage/Lab/feed/sitemap.')

if __name__ == '__main__':
    entries = check_evidence()
    if len(sys.argv) > 1:
        check_rendered(Path(sys.argv[1]), entries)
    else:
        print('PASS: compact evidence hashes and independent arithmetic.')
