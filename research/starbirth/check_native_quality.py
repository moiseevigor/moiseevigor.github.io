"""Verify exact compact exports and qualified publication; no research execution."""
import csv,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];P=ROOT/'public/data/starbirth/native-quality'
items=list(csv.DictReader((P/'source-inventory.csv').open()));assert len(items)==35
for x in items:
 b=(P/x['public_file']).read_bytes();assert len(b)==int(x['bytes']) and hashlib.sha256(b).hexdigest()==x['sha256']
a=json.loads((P/'assessment.json').read_text());assert a['native_rows']==874 and a['frozen_computational_supported']==0 and not a['frozen_computational_gate_passed']
assert not a['native_contract_compatible'] and a['scientifically_validated_quality_supported'] is None and a['scientifically_validated_quality_gate_passed'] is None
assert not a['physical_validation'] and a['new_stars']==a['new_births']==0
assert [x['native_rows'] for x in a['cases']]==[312,273,289]
assert sum(len(x['case']['catalogue_alternatives']) for x in a['cases'])==6
post=ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';assert '\nlisted: false\n' in post.read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);url='astrophysics/2026/10/12/hidden-protostars-missing-view-ranking';page=(site/url/'index.html').read_text()
 for term in ['id="native-quality"','874','312 / 273 / 289','0/3','two characters','unmeasured','No corrected scientific rerun','92ece66f0d3a3b927a5146df7b6b90c5f361fae9']:assert term in page,term
 program=(site/'astrophysics/2026/10/11/hidden-protostars-research-program/index.html').read_text();assert '#native-quality' in program and 'sbf-timeline' in program and 'sbf-expand' in program
 for x in items:
  rel=Path('public/data/starbirth/native-quality')/x['public_file'];assert (site/rel).read_bytes()==(ROOT/rel).read_bytes()
 for n in ['source-inventory.csv','README.md']:assert (site/'public/data/starbirth/native-quality'/n).read_bytes()==(P/n).read_bytes()
print('PASS: 35 exact NEOWISE exports; all six alternatives; frozen computational failure qualified by native flag mismatch; scientifically validated verdict unmeasured.')
