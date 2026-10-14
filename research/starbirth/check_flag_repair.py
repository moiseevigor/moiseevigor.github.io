"""Verify corrected publication and preserved historical attempt; no research execution."""
import csv,hashlib,json,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];P=R/'public/data/starbirth/flag-repair';items=list(csv.DictReader((P/'source-inventory.csv').open()));assert len(items)==25
for x in items:
 b=(P/x['public_file']).read_bytes();assert len(b)==int(x['bytes']) and hashlib.sha256(b).hexdigest()==x['sha256']
c=json.loads((P/'checkpoint.json').read_text());assert c['independent_verification_passed'] and c['exact_delta_verification_passed'] and c['native_rows']==874
assert c['corrected_supported']==0 and c['corrected_gate_passed'] is False and c['shape_only_rejections_removed']==645 and c['accepted_rows_added']==0
assert not c['scientific_thresholds_changed'] and c['new_observation_requests']==0 and not c['physical_validation']
if len(sys.argv)>1:
 site=Path(sys.argv[1]);url='astrophysics/2026/10/12/hidden-protostars-missing-view-ranking';page=(site/url/'index.html').read_text()
 for term in ['id="flag-repair"','645','Zero rows become accepted','failed, 0/3 versus required 2/3','post-read repair on consumed cases','no numerical cut relaxed','id="native-quality"','Historical state','60/75','b38a93adaf95f3ee38fad04610ccfca061cfb3fa']:assert term in page,term
 program=(site/'astrophysics/2026/10/11/hidden-protostars-research-program/index.html').read_text();assert '#flag-repair' in program and '#native-quality' in program and 'sbf-expand' in program
 for x in items:
  rel=Path('public/data/starbirth/flag-repair')/x['public_file'];assert (site/rel).read_bytes()==(R/rel).read_bytes()
 for n in ['source-inventory.csv','README.md']:assert (site/'public/data/starbirth/flag-repair'/n).read_bytes()==(P/n).read_bytes()
print('PASS: 25 exact repair exports; 645 shape-only rejections removed, zero accepted rows; corrected 0/3 quality gate failed, no physical negative; original attempt preserved.')
