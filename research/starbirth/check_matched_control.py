"""Check exact public bindings, all identities, later verification and publication."""
import csv, hashlib, json, sys
from pathlib import Path
from check_publication import Page
from urllib.parse import urlsplit, unquote
ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT/'public/data/starbirth/matched-control'
ARTICLE = '/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/'
REV = 'b0bbc8d89e06cfa812a5b91e5d863b7355750bd9'
entries=list(csv.DictReader((PUBLIC/'source-inventory.csv').open()))
assert len(entries)==12 and len({e['public_file'] for e in entries})==12
for e in entries:
    data=(PUBLIC/e['public_file']).read_bytes()
    assert len(data)==int(e['bytes']) and hashlib.sha256(data).hexdigest()==e['sha256']
    assert e['source_revision']==REV
load=lambda name:json.loads((PUBLIC/name).read_text())
gate=load('starbirth-mc-profile-gate.json'); verify=load('starbirth-mc-profile-verification.json')
assert verify['independently_verified'] and verify['readout_sha256']==hashlib.sha256((PUBLIC/'starbirth-mc-profile-gate.json').read_bytes()).hexdigest()
assert gate['targets_with_profile_control']==verify['profile_supported']==939
assert gate['targets_with_profile_uncertainty_control']==verify['profile_uncertainty_supported']==333
assert gate['minimum_required']==800 and gate['infrared_excess_measured'] is False
rows=list(csv.DictReader((PUBLIC/'profile-support.csv').open()))
assert len(rows)==len({r['designation'] for r in rows})==1000
assert sum(int(r['profile_controls'])>0 for r in rows)==939
assert sum(int(r['profile_uncertainty_controls'])>0 for r in rows)==333
diagnosis=load('starbirth-mc-covariance-diagnostic.json'); independent=load('starbirth-mc-covariance-verification.json')
counts=[s['targets_with_possible_control'] for s in diagnosis['scenarios']]
assert counts==independent['scenario_supported_targets']==[814,650,514,418,333]
assert independent['independently_verified'] and independent['covariance_estimated'] is False
assert independent['diagnostic_sha256']==hashlib.sha256((PUBLIC/'starbirth-mc-covariance-diagnostic.json').read_bytes()).hexdigest()
assert diagnosis['covariance_identified'] is False and diagnosis['original_gate_changed'] is False
if len(sys.argv)>1:
    site=Path(sys.argv[1]); html=(site/ARTICLE.strip('/')/'index.html').read_text()
    for term in ['939','333','814','800','hypothetical','post-read diagnostic','unmeasured','No stellar birth','b0bbc8d89e06cfa812a5b91e5d863b7355750bd9']:
        assert term in html, term
    page=Page();page.feed(html)
    for url in page.urls:
        parts=urlsplit(url)
        if url.startswith('#') and parts.fragment: assert parts.fragment in page.ids
        if url.startswith('/'):
            path=site/unquote(parts.path).lstrip('/')
            assert path.exists() or (path/'index.html').exists(), url
    for e in entries:
        assert (site/'public/data/starbirth/matched-control'/e['public_file']).read_bytes()==(PUBLIC/e['public_file']).read_bytes()
    for path in ['index.html','lab/index.html','atom.xml','sitemap.xml']:
        assert ARTICLE in (site/path).read_text(), path
print('PASS: twelve full source hashes, 1,000 exact identities, 939/333 gates, verified covariance scenarios, qualifications and publication links.')
