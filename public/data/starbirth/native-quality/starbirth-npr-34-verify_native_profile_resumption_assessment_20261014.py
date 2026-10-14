"""Independent literal native-table audit; no worker import or revised quality calculation."""
import hashlib,json,xml.dom.minidom as DOM
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
p=ROOT/'artifacts/native_profile_resumption_assessment_20261014.json';a=json.loads(p.read_text())
for e in a['evidence']:
 f=ROOT/e['path'];assert sha(f)==e['sha256'] and f.stat().st_size==e['bytes']
assert a['frozen_computational_supported']==0 and a['frozen_computational_gate_passed'] is False
assert not a['native_contract_compatible'] and a['scientifically_validated_quality_gate_passed'] is None
assert a['scientifically_validated_quality_supported'] is None and not a['physical_validation']
r=json.load(open(ROOT/'artifacts/native_profile_gator_acquisition_20261013/acquisition.json'))
count=0
for request,case in zip(r['requests'],a['cases']):
 doc=DOM.parse(str(ROOT/'artifacts/native_profile_gator_acquisition_20261013'/request['raw_response_file']))
 fields=[x.getAttribute('name') for x in doc.getElementsByTagName('FIELD')];idx=fields.index('ph_qual')
 values=[''.join(x.data for x in tr.getElementsByTagName('TD')[idx].childNodes if x.nodeType==x.TEXT_NODE) for tr in doc.getElementsByTagName('TR')]
 assert all(len(x)==2 for x in values) and len(values)==case['native_rows']
 assert request['case_id']==case['case_id'];count+=len(values)
assert count==a['native_rows']==874 and sum(len(x['case']['catalogue_alternatives']) for x in a['cases'])==6
assert a['guards']['cumulative_acquisition_elapsed_seconds']<600 and a['guards']['minimum_free_bytes']>5*1024**3
out=ROOT/'artifacts/native_profile_resumption_assessment_verification_20261014.json'
assert not out.exists();out.write_text(json.dumps({'schema':'native-profile-resumption-independent-qualification/1','verified':True,'assessment_sha256':sha(p),'report_sha256':sha(ROOT/'docs/NATIVE_PROFILE_RESUMPTION_RESULTS_20261014.md'),'native_vo_ph_qual_two_character_rows_checked':count,'all_six_alternatives_preserved':True,'no_corrected_rerun':True,'scientifically_validated_gate':None,'physical_validation':False},indent=2)+'\n')
print('Independent native VO qualification verified for 874 rows and six alternatives')
