"""Publication fidelity for the fixed gas/radio result; no science or acquisition execution."""
import csv,gzip,hashlib,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACKET=ROOT/'public/data/starbirth/gas-velocity'
REV='dc8d8ca3349d68f6c1d9b0aa5431ac894383ac10'
URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/'
PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
def sha(b):return hashlib.sha256(b).hexdigest()
items=list(csv.DictReader((PACKET/'source-inventory.csv').open()));assert len(items)==len({x['public_file'] for x in items})==22
for x in items:
 b=(PACKET/x['public_file']).read_bytes();assert len(b)==int(x['bytes']) and sha(b)==x['sha256'] and x['source_revision']==REV
c=json.loads((PACKET/'starbirth-rgv-checkpoint.json').read_text());v=json.loads((PACKET/'starbirth-rgv-verification-verification.json').read_text());a=json.loads((PACKET/'starbirth-rgv-corrected_assessment.json').read_text())
assert c['unit_complete'] and c['independent_verification_passed'] and c['primary_rule_met'] and c['primary_denominator']==1 and c['primary_eligible']
assert abs(c['primary_common_overlap_km_s']-.197)<1e-12 and c['primary_shift_support']==[True,True,False] and not c['robust_all_declared_shifts']
assert not c['physical_validation'] and not c['models_changed'] and c['new_stars']==c['new_births']==0
assert c['stellar_velocity']=='unmeasured' and c['consumed_source_diagnosis'] and c['metadata_label_correction_post_read'] and c['original_readout_preserved']
assert v['verified'] and [v[k] for k in ['native_molecular_records_checked','fixed_case_line_assessments_checked','shift_scenarios_checked']]==[3,6,9]
assert v['summary_sha256']==a['frozen_summary_sha256']==sha((PACKET/'starbirth-rgv-analysis-summary.json').read_bytes())
assert v['native_records_sha256']==sha((PACKET/'starbirth-rgv-analysis-native_records.json.gz').read_bytes())
assert a['original_summary_preserved'] and not a['changed_measurements_or_equations'] and a['literal_source_field']=='Vc'
assert len(a['cases'])==3 and [x['primary_case'] for x in a['cases']]==[True,False,False]
assert [x['malt90_id'] for x in a['cases']]==['AG1532','AG3005','AG3227']
assert all('native_velocity_component' not in x and x['native_velocity_component_suffix']=='S' and x['physical_membership']=='unestablished' and x['birth_status']=='not_established' for x in a['cases'])
p=a['cases'][0];assert p['case_id']=='HIGALBM330.8814-0.3656' and p['radio_row_id']=='VIII/96/catalog.dat:000307'
assert p['native_consensus_velocity_field']=='-62.71' and p['native_radio_velocity_fields']['velocity_low_field']==' -60.0'
assert [x['native_fields']['Vlsr'] for x in p['lines']]==['-62.443','-62.566']
assert [x['velocity_band_km_s'] for x in p['lines']]==[[-64.943,-59.943],[-65.462,-59.67]]
assert [round(x['overlap_km_s'],4) for x in p['scenarios']]==[1.197,.197,-.803]
assert round(a['cases'][2]['scenarios'][1]['overlap_km_s'],4)==.0685
kg=json.loads((PACKET/'starbirth-rgv-reviewed_supplement.json').read_text());assert kg['archive_not_merged'] and not kg['physical_validation'] and len(kg['preserved_prior_graph_blobs'])==9
assert '\nlisted: false\n' in (ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md').read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);page=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for term in ['id="gas-velocity"','0.1970','1.1970','0.8030','0.0685','79.066','−62.443','−62.566','−64.9430','−59.9430','−65.4620','−59.6700','−60.1400','−57.8600','consensus gas velocity','S/A/B','not confidence bounds','not measured calibration offsets','secondary context','six tracer fits','nine shift scenarios',REV]:assert term in page,term
 for term in ['physical membership remains unestablished','wing overlap, not agreement','no ownership, stellar youth, birth','no measurement, selection, equation or decision changed']:
  assert term in page.lower(),term
 assert URL+'#gas-velocity' in program and 'physical' in program
 assert 'sbf-timeline' in program and 'sbf-expand' in program
 for name in [x['public_file'] for x in items]+['README.md','source-inventory.csv']:
  path=Path('public/data/starbirth/gas-velocity')/name;assert (site/path).read_bytes()==(ROOT/path).read_bytes(),name
 for home in [site/'index.html',*site.glob('page*/index.html')]:assert URL not in home.read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(x.get('href','').endswith(URL) for x in entry.findall('{http://www.w3.org/2005/Atom}link'))
print('PASS: 22 exact gas/radio exports; one fixed primary with marginal overlap and failed sensitivity; original output/correction preserved; no physical validation; program-only article and formation retained.')
