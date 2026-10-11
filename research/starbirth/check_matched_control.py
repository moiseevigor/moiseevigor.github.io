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
audit_dir=ROOT/'public/data/starbirth/covariance-audit'
audit_entries=list(csv.DictReader((audit_dir/'source-inventory.csv').open()))
assert len(audit_entries)==4
for e in audit_entries:
    data=(audit_dir/e['public_file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==e['sha256'] and len(data)==int(e['bytes'])
    assert e['source_revision']=='eeaf9440252aeac4d6502b416d2315d4ca98ecbd'
audit=json.loads((audit_dir/'starbirth-covariance-audit.json').read_text())
audit_verify=json.loads((audit_dir/'starbirth-covariance-verification.json').read_text())
assert audit_verify['independently_verified'] and audit_verify['audit_sha256']==hashlib.sha256((audit_dir/'starbirth-covariance-audit.json').read_bytes()).hexdigest()
assert audit_verify['integrated_variance']=='182/101' and audit_verify['quadrature_variance']=='152/101'
assert audit['covariance_estimated'] is False and audit['source_occurrence_measured'] is False
source_dir=ROOT/'public/data/starbirth/source-audit'
source_entries=list(csv.DictReader((source_dir/'source-inventory.csv').open()))
assert len(source_entries)==4
for e in source_entries:
    data=(source_dir/e['public_file']).read_bytes()
    assert len(data)==int(e['bytes']) and hashlib.sha256(data).hexdigest()==e['sha256']
    assert e['source_revision']=='712d7aeeab27e23163c5ff7b3b0c9d63bd180434'
source_audit=json.loads((source_dir/'starbirth-source-audit.json').read_text())
source_verify=json.loads((source_dir/'starbirth-source-verification.json').read_text())
assert source_verify['verified'] and source_verify['requests']==9
assert source_verify['source_commit']==source_audit['source_commit']=='30445cabe3416c6ca0acc33d2138cf80f531442c'
assert source_audit['archive_release_binding_established'] is False
assert source_audit['integrated_column_uncertainty_validated'] is False
assert source_audit['primary_supported']==333 and source_audit['primary_required']==800
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
    for e in audit_entries:
        assert (site/'public/data/starbirth/covariance-audit'/e['public_file']).read_bytes()==(audit_dir/e['public_file']).read_bytes()
    for e in source_entries:
        assert (site/'public/data/starbirth/source-audit'/e['public_file']).read_bytes()==(source_dir/e['public_file']).read_bytes()
    assert 'implementation-audit' in html and '333-of-800 gate remains failed' in html
    assert 'not an actual Herschel response' in html and '125 distinct cached native files' in html
    for path in ['lab/index.html','sitemap.xml']:
        assert ARTICLE in (site/path).read_text(), path
    assert ARTICLE in (site/'astrophysics/2026/10/11/hidden-protostars-research-program/index.html').read_text()
    for home in [site/'index.html',*site.glob('page*/index.html')]:
        assert ARTICLE not in home.read_text(), 'Program-only update appears on '+str(home)
    import xml.etree.ElementTree as ET
    feed=ET.fromstring((site/'atom.xml').read_text())
    ns={'a':'http://www.w3.org/2005/Atom'}
    for entry in feed.findall('a:entry',ns):
        assert not any(link.get('href','').endswith(ARTICLE) for link in entry.findall('a:link',ns)), 'Program-only update has standalone feed entry'

print('PASS: twelve full source hashes, 1,000 exact identities, 939/333 gates, verified covariance scenarios, qualifications and publication links.')
