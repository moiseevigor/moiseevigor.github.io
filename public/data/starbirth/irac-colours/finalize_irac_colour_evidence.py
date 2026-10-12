"""Bind verified colour evidence, unchanged historical ranks and precise claim limits."""
import csv,hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];STAGE=ROOT/'artifacts/irac_colour_resource_resumed_20261012';VERIFY=ROOT/'artifacts/irac_colour_resource_resumed_verification_20261012'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
s=json.loads((STAGE/'summary.json').read_text());v=json.loads((VERIFY/'verification.json').read_text());assert v['verified'] and v['summary_sha256']==sha(STAGE/'summary.json') and v['all_records_sha256']==sha(STAGE/'all_records.json')
assert [s[k] for k in ['selected_cases','photometric_availability','central_necessary_support','robust_necessary_support','quoted_error_incompatible','unresolved_necessary_colours']]==[3,0,0,0,2,1]
old=json.loads((ROOT/'artifacts/native_glimpse_association_20261012/evidence_cards.json').read_text())['evidence_cases'];all_records=json.loads((STAGE/'all_records.json').read_text());cards=[]
for c,prior in zip(s['case_assessments'],old,strict=True):
 assert c['case_id']==prior['case_id'] and c['historical_system']==prior['historical_system']
 assert c['physical_stage']=='unknown' and c['birth_status']=='not_established' and c['decision']['full_standard_classification']=='not_evaluated'
 cards.append(dict(case_id=c['case_id'],native_source_id=c['native_source_id'],native_cntr=c['cntr'],evidence_role='consumed, post-read selected positional counterpart; not independent physical validation',historical_clump_proxy_rank=c['historical_system'],system_predicts='historical clump chemistry-proxy ranking; not native point-source evolutionary stage',positional_evidence=dict(matched_visits=c['positional_matches'],supported_visits=c['positional_visits'],prior_source=prior['geometrically_best_catalogue_record'],frozen_original_gate_passed=False),published_baseline_component=dict(reference='Gutermuth et al. (2009) Appendix A.1',literature_contract='artifacts/irac_colour_literature_contract_20261012.json',colours=c['colours'],assessment=c['decision'],full_standard_consensus_classification='not available; full four-band method not evaluated',covariance='unmeasured; sum-of-quoted-error envelopes are sensitivity, not confidence',alternative_method_inputs='near-IR/24-micron photometry and ownership not verified by this unit'),all_native_alternative_colours=[r for r in all_records if r['case_id']==c['case_id']],physical_stage='unknown',clump_membership='unestablished',birth_status='not_established',new_discovery=False))
packet=dict(schema='source-bound-irac-comparator-evidence-cards/1',cards=cards,no_physical_probabilities=True,full_classifier_implemented=False,original_models_unchanged=True,new_stars=0,new_births=0)
out=STAGE/'comparison_cards.json'
with out.open('x') as f:json.dump(packet,f,indent=2);f.write('\n')
rows=[]
for c in s['case_assessments']:
 col=next(x for x in c['colours'] if (x['band_a'],x['band_b'])==('3_6','4_5'))
 rows.append(dict(case_id=c['case_id'],native_source_id=c['native_source_id'],colour_36_45=col['colour_mag'],quoted_sigma_max=col['sigma_max'],upper_three_quoted_errors=col['envelopes']['3'][1],missing_bands='|'.join(c['decision']['missing_or_invalid_bands']),quoted_error_incompatible=c['decision']['quoted_error_incompatibility'],four_band_photometric_availability=c['decision']['four_band_photometric_availability'],physical_stage='unknown'))
with (STAGE/'case_table.csv').open('x',newline='') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
folders=['artifacts/irac_colour_diagnostic_20261012','artifacts/irac_colour_resource_resumed_20261012','artifacts/irac_colour_resource_resumed_verification_20261012']
files={}
for name in folders:
 for p in (ROOT/name).iterdir():
  if p.is_file():files[str(p.relative_to(ROOT))]=dict(bytes=p.stat().st_size,sha256=sha(p))
for name in ['docs/IRAC_COLOUR_DIAGNOSTIC_PROTOCOL_20261012.md','docs/IRAC_COLOUR_RESOURCE_RESUME_20261012.md','docs/IRAC_COLOUR_DIAGNOSTIC_RESULTS_20261012.md','artifacts/irac_colour_literature_contract_20261012.json','artifacts/irac_colour_registration_20261012.json','artifacts/irac_colour_resource_stop_20261012.json','artifacts/irac_colour_resume_amendment_20261012.json','research/analyze_irac_colour_evidence.py','research/verify_irac_colour_evidence.py','research/finalize_irac_colour_evidence.py']:
 p=ROOT/name;files[name]=dict(bytes=p.stat().st_size,sha256=sha(p))
for name in folders[1:]:
 m=json.loads((ROOT/name/'resource_monitor.json').read_text());assert m['completed'] and m['child_exit_code']==0 and m['stop_reason'] is None
stopped=json.loads((ROOT/folders[0]/'resource_monitor.json').read_text());assert not stopped['completed'] and stopped['child_exit_code'] is None
assert sum(x['bytes'] for x in files.values())<4*1024**2 and shutil.disk_usage(ROOT).free>5*1024**3
record=dict(schema='verified-retrospective-irac-colour-checkpoint/1',verified=True,code_revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),registration_sha256=sha(ROOT/'artifacts/irac_colour_registration_20261012.json'),summary_sha256=sha(STAGE/'summary.json'),verification_sha256=sha(VERIFY/'verification.json'),cases=3,four_band_available=0,central_necessary_colour_support=0,robust_necessary_colour_support=0,quoted_error_incompatible=2,unresolved_necessary_colour=1,complete_standard_classification=False,physical_validation=False,all_models_unchanged=True,original_parent=19328,original_unknown_proxy_states=19066,new_stars=0,new_births=0,first_preflight_worker_never_launched=True,external_build_finished_without_cancellation=True,consumed_post_read_diagnostic=True,local_result_unpublished=True,bytes_before_checkpoint=sum(x['bytes'] for x in files.values()),files=files)
with (ROOT/'artifacts/irac_colour_checkpoint_20261012.json').open('x') as f:json.dump(record,f,indent=2);f.write('\n')
print(json.dumps({k:v for k,v in record.items() if k!='files'},indent=2))
