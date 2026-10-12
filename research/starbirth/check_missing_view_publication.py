"""Exact evidence and presentation gates for the retrospective negative result."""
import csv,gzip,hashlib,json,sys,xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[2];PUBLIC=ROOT/'public/data/starbirth/missing-view'
REV='6a44759b5a5948d9177335ef9a25b51d68ff9309'
URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/'
PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
entries=list(csv.DictReader((PUBLIC/'source-inventory.csv').open()))
assert len(entries)==len({r['public_file'] for r in entries})==39
for r in entries:
 b=(PUBLIC/r['public_file']).read_bytes();assert len(b)==int(r['bytes']) and hashlib.sha256(b).hexdigest()==r['sha256'];assert r['source_revision']==REV
r=json.loads((PUBLIC/'starbirth-mvr-summary.json').read_text());v=json.loads((PUBLIC/'starbirth-mvr-verification.json').read_text());c=json.loads((PUBLIC/'starbirth-mvr-checkpoint.json').read_text())
assert r['status']==v['status']=='no_retrospective_gain_demonstrated' and v['verified']
assert v['summary_sha256']==hashlib.sha256((PUBLIC/'starbirth-mvr-summary.json').read_bytes()).hexdigest()
assert v['sources_sha256']==hashlib.sha256((PUBLIC/'sources.csv.gz').read_bytes()).hexdigest()
assert r['requested']==19328 and r['qualifying_positives']==27 and r['qualifying_proxy_negatives']==235 and r['unknown']==19066
for method,tp in [('embedding',14),('linear',14),('nonlinear',15),('infrared_only',13)]:
 assert r['primary'][method]['reviews']==18 and r['primary'][method]['selected_proxy_positive']==tp
 assert r['all_requested'][method]['reviews']==982
assert r['all_requested']['embedding']['selected_unknown']==884
assert r['strata']['temporal_present']['qualifying']==3 and r['strata']['temporal_present']['positives']==0
assert r['primary_minimum_recovery_difference']<0 and r['spatial_bootstrap_ci95']==[-1/9,0]
assert not r['physical_validation'] and not r['calibrated_probabilities'] and r['new_stars']==r['new_births']==0
assert not c['full_goal_achieved'] and not c['benefit_gate_passed']
with gzip.open(PUBLIC/'sources.csv.gz','rt') as f:
 rows=list(csv.DictReader(f))
assert len(rows)==len({x['designation'] for x in rows})==19328
assert all(x['physical_stage']=='unknown' and x['birth_status']=='not_established' for x in rows)
assert sum(x['proxy_state']=='unknown' for x in rows)==19066
assert sum(int(x['embedding_primary_review']) for x in rows)==18
assert sum(int(x['embedding_all_requested_review']) for x in rows)==982
assert json.loads((PUBLIC/'starbirth-mvr-association-memory-stop.json').read_text())['stop_reason']=='worker_memory'
assert json.loads((PUBLIC/'starbirth-mvr-worker-resources.json').read_text())['completed'] and json.loads((PUBLIC/'starbirth-mvr-verification-resources.json').read_text())['completed']
kg=json.loads((PUBLIC/'starbirth-mvr-knowledge-supplement.json').read_text());assert kg['source_revision']=='c6618258f56047aee306e915290ddcebcf7906be'
assert not kg['archive_merged'] and not kg['physical_detector_validated']
post=ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';assert '\nlisted: false\n' in post.read_text()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:assert a['id'] not in self.ids;self.ids.add(a['id'])
  self.links.extend(a[k] for k in ('href','src') if k in a)
if len(sys.argv)>1:
 site=Path(sys.argv[1]);html=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for phrase in ['14 / 27','15 / 27','19,328','19,066','982','884','−3.70','−11.11','0.00','18 / 262','6.87%',REV,'none of the 27','No new star','333-of-800','consumed','not calibrated']:
  assert phrase.lower() in html.lower(),phrase
 assert URL in program and 'ranking-result' in program and '14/27' in program and '15/27' in program
 assert 'sbf-timeline' in program and 'sbf-expand' in program and 'historical-week' in program and 'No model was fitted.' in program
 parser=Links();parser.feed(html)
 for link in parser.links:
  parts=urlsplit(link)
  if link.startswith('#') and parts.fragment:assert parts.fragment in parser.ids,link
  elif link.startswith('/'):
   p=site/unquote(parts.path).lstrip('/');assert p.exists() or (p/'index.html').exists(),link
 assert URL not in (site/'index.html').read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(x.get('href','').endswith(URL) for x in entry.findall('{http://www.w3.org/2005/Atom}link'))
 assert URL in (site/'lab/index.html').read_text() and URL in (site/'sitemap.xml').read_text()
 for item in entries:
  p=Path('public/data/starbirth/missing-view')/item['public_file'];assert (site/p).read_bytes()==(ROOT/p).read_bytes()
 assert (site/'public/data/starbirth/missing-view/source-inventory.csv').read_bytes()==(PUBLIC/'source-inventory.csv').read_bytes()
print('PASS: 39 full evidence hashes, all 19,328 identities/unknowns, failed benefit gate, equal reviews, preserved memory stop, internal links, program-only listing and retained formation controls.')
