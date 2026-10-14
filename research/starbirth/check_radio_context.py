"""Check exact exports and the conditional source-specific publication; no science execution."""
import csv,hashlib,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACKET=ROOT/'public/data/starbirth/radio-context'
REV='70c33bcc9017f994e1a51c2dfe8d150ef7614650';URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/'
PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
items=list(csv.DictReader((PACKET/'source-inventory.csv').open()))
assert len(items)==len({x['public_file'] for x in items})==25
for x in items:
 b=(PACKET/x['public_file']).read_bytes()
 assert len(b)==int(x['bytes']) and hashlib.sha256(b).hexdigest()==x['sha256'] and x['source_revision']==REV
c=json.loads((PACKET/'starbirth-mmb-checkpoint.json').read_text())
v=json.loads((PACKET/'starbirth-mmb-verification-verification.json').read_text())
s=json.loads((PACKET/'starbirth-mmb-analysis-summary.json').read_text())
assert c['unit_complete'] and c['independent_verification_passed'] and v['verified']
assert [c[k] for k in ['fixed_best_projected_support','fixed_best_denominator','all_infrared_alternatives_within_1_arcsec','infrared_alternative_denominator']]==[0,3,0,6]
assert not c['primary_geometric_criterion_met'] and not c['physical_validation'] and not c['models_changed']
assert c['new_stars']==c['new_births']==0 and c['coverage_qualification_is_post_read'] and c['radio_absence_is_not_physical_negative']
assert v['native_rows_checked']==707 and v['angular_pairs_recomputed']==6363
assert v['summary_sha256']==hashlib.sha256((PACKET/'starbirth-mmb-analysis-summary.json').read_bytes()).hexdigest()
assert len(s['cases'])==3 and sum(sum(p['point_kind']=='catalogue_alternative' for p in x['assessments']) for x in s['cases'])==6
assert c['first_field_known_radio_record']['row_id']=='VIII/96/catalog.dat:000307'
assert round(c['first_field_clump_offset_arcsec'],3)==12.520 and round(c['first_field_best_infrared_offset_arcsec'],3)==17.501
assert '\nlisted: false\n' in (ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md').read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);article=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for term in ['id="radio-context"','104.881','76.937','81.837','0 / 3','0 / 6','6,363','707','post-read coverage context','absence of one does not establish starlessness','consumed evidence','No new star','333-of-800',REV]:assert term in article,term
 assert URL+'#radio-context' in program and '0/3' in program and 'physical classification' in program and 'sbf-timeline' in program and 'sbf-expand' in program
 for name in [x['public_file'] for x in items]+['README.md','source-inventory.csv']:
  path=Path('public/data/starbirth/radio-context')/name;assert (site/path).read_bytes()==(ROOT/path).read_bytes(),name
 for home in [site/'index.html',*site.glob('page*/index.html')]:assert URL not in home.read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(x.get('href','').endswith(URL) for x in entry.findall('{http://www.w3.org/2005/Atom}link'))
print('PASS: 25 exact radio-context exports, failed 0/3 and 0/6 geometry, known-marker context, no physical negative/classification, original gates and formation retained.')
