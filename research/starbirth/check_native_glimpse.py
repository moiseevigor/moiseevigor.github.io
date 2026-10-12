"""Check exact evidence, unknown stage, fixed failed gates and program-only presentation."""
import csv,hashlib,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACKET=ROOT/'public/data/starbirth/native-glimpse';REV='4e4a9b13c199a7d035a3728d7390d754d9773e89'
URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/';PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
items=list(csv.DictReader((PACKET/'source-inventory.csv').open()));assert len(items)==len({r['public_file'] for r in items})==35
for r in items:
 data=(PACKET/r['public_file']).read_bytes();assert len(data)==int(r['bytes']) and hashlib.sha256(data).hexdigest()==r['sha256'] and r['source_revision']==REV
load=lambda name:json.loads((PACKET/('starbirth-ng-'+name+'.json')).read_text())
s=load('summary');v=load('verification');c=load('checkpoint');cards=load('evidence-cards')['evidence_cases']
assert s['projected_support_cases']==v['projected_support_cases']==c['primary_support_cases']==0 and s['selected_cases']==c['primary_case_denominator']==3 and not s['primary_gate_passed'] and c['primary_gate_failed'] and v['verified'] and c['verified']
assert v['summary_sha256']==hashlib.sha256((PACKET/'starbirth-ng-summary.json').read_bytes()).hexdigest()
assert not s['original_ranking_changed'] and not s['physical_validation'] and s['new_stars']==s['new_births']==0
assert c['original_population']==19328 and c['unknown_proxy_states']==19066
assert len(cards)==3 and [x['geometrically_best_catalogue_record']['supported_visit_matches'] for x in cards]==['21','14','4']
assert [x['native_case_decision']['supported_visits'] for x in cards]==[21,19,6]
assert cards[0]['geometrically_best_catalogue_record']['designation']=='SSTGLMC G330.8829-00.3661'
assert cards[0]['geometrically_best_catalogue_record']['sqf_4_5']=='1536'
for x in cards:
 assert x['physical_stage']=='unknown' and x['birth_status']=='not_established'
 assert not x['historical_system']['new_glimpse_input_used'] and x['historical_system']['all_requested_review_budget']==982
 assert all(m['selected_at_original_all_requested_budget'] and not m['calibrated_probability'] for m in x['historical_system']['models'].values())
raw=list(csv.DictReader((PACKET/'sources.csv').open()));assert len(raw)==12 and sum(x['kind']=='Catalog' for x in raw)==6
assert len(list(csv.DictReader((PACKET/'visit-source-edges.csv').open())))==180
assert len(list(csv.DictReader((PACKET/'catalog-archive-aliases.csv').open())))==14
assert sum((PACKET/f'q{i:02}.csv').stat().st_size for i in range(6))==4696
assert sum(p.stat().st_size for p in PACKET.iterdir())<16*1024**2
assert '\nlisted: false\n' in (ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md').read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);article=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for term in ['id="native-counterparts"','21 / 21','0.168–0.336','5.719','Zero of three','1536','10 and 11','14 / 19','4 / 6','not twelve independent objects','No new star','333-of-800',REV,'starbirth-ranking.css?v=20261012-4']:
  assert term in article,term
 assert article.count('class="sb-native-card"')==3
 assert '**982-review' not in article
 for x in cards:assert x['case_id'] in article and x['geometrically_best_catalogue_record']['designation'] in article
 assert URL+'#native-counterparts' in program and 'sbf-timeline' in program and 'sbf-expand' in program
 assert URL not in (site/'index.html').read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(link.get('href','').endswith(URL) for link in entry.findall('{http://www.w3.org/2005/Atom}link'))
 for name in [r['public_file'] for r in items]+['source-inventory.csv','README.md']:
  rel=Path('public/data/starbirth/native-glimpse')/name;assert (site/rel).read_bytes()==(ROOT/rel).read_bytes(),name
print('PASS: 35 exact native exports, three assessment cards, tight 21/21 geometry and failed 0/3 gate, unchanged models and unknown physical stage.')
