"""Complete temporal diagnostic byte, identity, failed-gate and presentation checks."""
import csv,gzip,hashlib,json,sys,xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACKET=ROOT/'public/data/starbirth/temporal-missingness'
REV='3332eb8530fafcf442d191f96efe5149ca989ac8';URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/';PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
items=list(csv.DictReader((PACKET/'source-inventory.csv').open()));assert len(items)==len({r['public_file'] for r in items})==22
for r in items:
 data=(PACKET/r['public_file']).read_bytes();assert len(data)==int(r['bytes']) and hashlib.sha256(data).hexdigest()==r['sha256'] and r['source_revision']==REV
s=json.loads((PACKET/'starbirth-tmd-summary.json').read_text());v=json.loads((PACKET/'starbirth-tmd-verification.json').read_text());c=json.loads((PACKET/'starbirth-tmd-checkpoint.json').read_text())
assert s['primary_count']==c['primary_count']==v['primary_count']==3 and s['primary_denominator']==27 and s['majority_gate']==14 and not s['majority_gate_passed'] and v['verified'] and c['verified']
assert v['summary_sha256']==hashlib.sha256((PACKET/'starbirth-tmd-summary.json').read_bytes()).hexdigest()
assert s['proxy_groups']['positive']['outcomes']==dict(requested_no_rows=11,no_screened_in_query=9,query_cadence_insufficient=4,query_supported_anchor_missing=2,query_supported_anchor_cadence_insufficient=1)
assert s['covariate_support_tables']['mass']['high/positive']['count']==s['covariate_support_tables']['surf_dens']['high/positive']['count']==27
assert not s['model_rerun'] and not s['original_comparison_changed'] and not s['physical_validation'] and s['new_stars']==s['new_births']==0
with gzip.open(PACKET/'sources.csv.gz','rt') as f:rows=list(csv.DictReader(f))
assert len(rows)==len({r['designation'] for r in rows})==19328
assert Counter(r['proxy_state'] for r in rows)==Counter(qualifying_positive=27,qualifying_proxy_negative=235,unknown=19066)
assert sum(int(r['query_support']) for r in rows)==3013 and sum(int(r['anchored_support']) for r in rows)==761
assert all(r['emitter_identity']==r['physical_truth']=='unestablished' and r['full_reliability']=='unverified' for r in rows)
with gzip.open(PACKET/'positive-raw-evidence.csv.gz','rt') as f:evidence=list(csv.DictReader(f))
assert len(evidence)==len({r['source_row'] for r in evidence})==1072
assert {r['designation'] for r in evidence}<={r['designation'] for r in rows if r['proxy_state']=='qualifying_positive'}
assert not json.loads((PACKET/'starbirth-tmd-failed-resources.json').read_text())['completed']
assert 'AssertionError' in (PACKET/'failed-worker.txt').read_text()
assert json.loads((PACKET/'starbirth-tmd-worker-resources.json').read_text())['completed'] and json.loads((PACKET/'starbirth-tmd-verification-resources.json').read_text())['completed']
kg=json.loads((PACKET/'starbirth-tmd-knowledge-supplement.json').read_text());assert kg['core_and_prior_supplement_unchanged'] and not kg['physical_validation']
assert '\nlisted: false\n' in (ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md').read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);article=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for word in ['id="temporal-diagnosis"','3 / 27','14-of-27','3,013','761','1,072','19,328','19,066','not a single-source light curve','evidence cases, not discoveries','333-of-800',REV]:assert word in article,word
 assert 'query-level cadence' in program and URL+'#temporal-diagnosis' in program
 assert 'sbf-timeline' in program and 'sbf-expand' in program
 assert URL not in (site/'index.html').read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(link.get('href','').endswith(URL) for link in entry.findall('{http://www.w3.org/2005/Atom}link'))
 for name in [r['public_file'] for r in items]+['source-inventory.csv','README.md']:
  rel=Path('public/data/starbirth/temporal-missingness')/name;assert (site/rel).read_bytes()==(ROOT/rel).read_bytes(),name
print('PASS: 22 exact diagnostic exports, all IDs/native states, 1072 raw evidence rows, failed 3/27 majority gate, unchanged scientific rules and program-only presentation.')
