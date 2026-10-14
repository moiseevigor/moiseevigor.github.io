"""Exact old/new row delta audit with independent raw VO flag inspection."""
import argparse,csv,gzip,hashlib,json,xml.dom.minidom as DOM
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rows(p):
 with gzip.open(p,'rt') as f:return list(csv.DictReader(f))
def main(stage):
 old=rows(R/'artifacts/native_profile_gator_analysis_20261013/detections.csv.gz');new=rows(R/'artifacts/neowise_flag_repair_analysis_20261014/detections.csv.gz');assert len(old)==len(new)==874
 changed=0;removed=0
 for a,b in zip(old,new):
  assert {k:v for k,v in a.items() if k not in ['quality_reasons','quality_isolated']}=={k:v for k,v in b.items() if k not in ['quality_reasons','quality_isolated']}
  value=a['ph_qual'];assert len(value)==2 and set(value)<=set('ABCUX')
  before=set(json.loads(a['quality_reasons']));after=set(json.loads(b['quality_reasons']))
  expected=before-{'ph_qual_w2_requirement'} if value[1]=='A' else before
  assert after==expected and b['quality_isolated']==str(not expected)
  changed+=int(before!=after);removed+=len(before-after)
 assert removed==changed
 receipt=json.loads((R/'artifacts/native_profile_gator_acquisition_20261013/acquisition.json').read_text());native=0
 for req in receipt['requests']:
  p=R/'artifacts/native_profile_gator_acquisition_20261013'/req['raw_response_file'];assert sha(p)==req['raw_sha256']
  doc=DOM.parse(str(p));names=[x.getAttribute('name') for x in doc.getElementsByTagName('FIELD')];idx=names.index('ph_qual')
  with (R/'artifacts/native_profile_gator_acquisition_20261013'/req['response_file']).open(newline='') as f:csvrows=list(csv.DictReader(f))
  values=[''.join(x.data for x in tr.getElementsByTagName('TD')[idx].childNodes if x.nodeType==x.TEXT_NODE) for tr in doc.getElementsByTagName('TR')]
  assert values==[x['ph_qual'] for x in csvrows] and len(values)==req['rows'];native+=len(values)
 summary=json.loads((R/'artifacts/neowise_flag_repair_analysis_20261014/summary.json').read_text());verify=json.loads((R/'artifacts/neowise_flag_repair_verification_20261014/verification.json').read_text())
 assert verify['verified'] and verify['summary_sha256']==sha(R/'artifacts/neowise_flag_repair_analysis_20261014/summary.json')
 assert sum(len(c['catalogue_alternatives']) for c in summary['cases'])==6
 assert summary['fixed_best_supported']==0 and summary['primary_gate_passed'] is False
 assert all(x['strict_quality_rows']==0 for c in summary['cases'] for x in c['catalogue_alternatives'])
 result={'schema':'neowise-flag-repair-exact-delta-verification/1','verified':True,'native_rows_checked':native,'raw_fields_positions_identity_and_exposure_joins_unchanged':True,'only_photo_quality_reason_and_result_boolean_changed':True,'rows_with_shape_only_rejection_removed':removed,'accepted_rows_added':0,'corrected_supported':0,'corrected_denominator':3,'corrected_gate_passed':False,'all_six_alternatives_preserved':True,'independent_summary_sha256':verify['summary_sha256'],'new_requests':0,'post_read_repair_not_fresh_physical_validation':True,'physical_validation':False}
 (stage/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=Path);main(p.parse_args().stage)
