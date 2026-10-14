"""Qualify an unchanged frozen readout with a lossless native flag-length audit."""
import csv,gzip,hashlib,json,shutil
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
A=ROOT/'artifacts/native_profile_gator_acquisition_20261013';S=ROOT/'artifacts/native_profile_gator_analysis_20261013';V=ROOT/'artifacts/native_profile_gator_quality_verification_20261013'
r=json.loads((A/'acquisition.json').read_text());s=json.loads((S/'summary.json').read_text());v=json.loads((V/'verification.json').read_text())
t=json.loads((ROOT/'artifacts/native_profile_gator_transport_verification_20261013/verification.json').read_text())
assert r['complete'] and t['verified'] and t['complete_delivery'] and v['verified']
assert v['summary_sha256']==sha(S/'summary.json') and v['detections_sha256']==sha(S/'detections.csv.gz')
assert s['native_rows']==v['native_rows_checked']==t['native_vo_rows_byte_field_equivalent_to_csv']==874
with gzip.open(S/'detections.csv.gz','rt') as f:rows=list(csv.DictReader(f))
audit=[]
for q,c in zip(r['requests'],s['cases']):
 with (A/q['response_file']).open(newline='') as f:native=list(csv.DictReader(f))
 assert c['case_id']==q['case_id'] and len(native)==c['native_rows']==q['rows']
 lengths=dict(Counter(str(len(x['ph_qual'])) for x in native));assert lengths=={'2':len(native)}
 matched=[x for x in rows if x['case_id']==q['case_id'] and x['unique_associated_catalogue_id']]
 assert all('ph_qual_w2_requirement' in json.loads(x['quality_reasons']) for x in matched)
 assert all(x['strict_quality_rows']==0 for x in c['catalogue_alternatives'])
 audit.append({'case_id':c['case_id'],'native_rows':len(native),'ph_qual_literal_length_counts':lengths,'ph_qual_literal_values':dict(Counter(x['ph_qual'] for x in native)),'matched_rows_rejected_by_flag_shape':len(matched),'case':c})
assert sum(len(c['case']['catalogue_alternatives']) for c in audit)==6
stages=[A,ROOT/'artifacts/native_profile_gator_transport_verification_20261013',S,V]
guards=[json.loads((p/'resource_monitor.json').read_text()) for p in stages]
assert all(g['completed'] and g['stop_reason'] is None and g['samples'][-1]['workers']==[] for g in guards)
assert all(g['minimum_observed_free_bytes']>5*1024**3 for g in guards)
old=json.loads((ROOT/'artifacts/native_profile_quality_acquisition_20261013/resource_monitor.json').read_text())
paths=[p for d in stages for p in sorted(d.iterdir()) if p.is_file()]
for path in ['artifacts/native_profile_human_authorization_20261014.json','artifacts/native_profile_gator_amendment_20261013.json','artifacts/native_profile_quality_registration_20261013.json','docs/NATIVE_PROFILE_GATOR_AMENDMENT_20261013.md','docs/NATIVE_PROFILE_HUMAN_RESUMPTION_20261014.md','docs/NATIVE_PROFILE_QUALITY_PROTOCOL_20261013.md','research/acquire_native_profile_gator_20261013.py','research/verify_native_profile_gator_transport_20261013.py','research/analyze_native_profile_quality_20261013.py','research/verify_native_profile_quality_20261013.py']:
 paths.append(ROOT/path)
result={'schema':'native-profile-resumption-reviewed-assessment/1','unit_complete':True,'requests_attempted':3,'cumulative_requests_including_original':4,'native_rows':874,'independent_transport_verification_passed':True,'independent_frozen_recomputation_passed':True,'frozen_computational_supported':s['fixed_best_supported'],'frozen_computational_denominator':3,'frozen_computational_required':2,'frozen_computational_gate_passed':s['primary_gate_passed'],'native_contract_compatible':False,'scientifically_validated_quality_supported':None,'scientifically_validated_quality_gate_passed':None,'interpretation':'insufficient evidence: all delivered ph_qual strings have length 2; frozen analyzer and checker require length 4, matching the official supplement. Preserve literal flags and the computational failure; no padding, changed filter or corrected rerun is authorized automatically. Cause of delivery/documentation discrepancy remains unknown.','official_flag_contract_source':'https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html#ph_qual','official_contract':'Four characters W1/W2/W3/W4; third and fourth X. Observed native delivery has two characters in all 874 rows.','cases':audit,'guards':{'new_elapsed_seconds':sum(g['elapsed_seconds'] for g in guards),'cumulative_acquisition_elapsed_seconds':old['elapsed_seconds']+guards[0]['elapsed_seconds'],'minimum_free_bytes':min(g['minimum_observed_free_bytes'] for g in guards),'peak_sampled_rss_bytes':max(g['peak_sampled_worker_rss_bytes'] for g in guards),'new_stage_bytes':sum(p.stat().st_size for d in stages for p in d.iterdir() if p.is_file())},'evidence':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in paths],'all_original_outputs_preserved':True,'automatic_successor_authorized':False,'physical_validation':False,'new_stars':0,'new_births':0,'models_changed':False,'full_goal_achieved':False,'publication_status_at_creation':'local; separate publication receipts required'}
assert result['frozen_computational_supported']==0 and not result['frozen_computational_gate_passed']
assert result['guards']['cumulative_acquisition_elapsed_seconds']<600 and result['guards']['new_stage_bytes']<8*1024**2
out=ROOT/'artifacts/native_profile_resumption_assessment_20261014.json'
assert not out.exists();out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['native_rows','native_contract_compatible','frozen_computational_supported','scientifically_validated_quality_gate_passed','guards']}))
