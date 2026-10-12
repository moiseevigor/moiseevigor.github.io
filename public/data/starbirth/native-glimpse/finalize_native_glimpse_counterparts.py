"""Retain three evidence cards and independently audit their descriptive fields."""
import csv,gzip,hashlib,json,math,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];STAGE=ROOT/'artifacts/native_glimpse_association_20261012';CHECK=ROOT/'artifacts/native_glimpse_verification_20261012/verification.json'
def read(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:return list(csv.DictReader(f))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
verification=json.loads(CHECK.read_text());assert verification['verified'] and verification['summary_sha256']==sha(STAGE/'summary.json')
summary=json.loads((STAGE/'summary.json').read_text());sources=read(STAGE/'sources.csv');edges=read(STAGE/'visit_source_edges.csv');aliases=read(STAGE/'catalog_archive_aliases.csv')
ranking={r['designation']:r for r in read(ROOT/'artifacts/multisurvey_missing_view_20261012/sources.csv.gz')};parent={r['designation']:r for r in read(ROOT/'artifacts/temporal_missingness_schema_adapted_20261012/sources.csv.gz')}
assert len(ranking)==len(parent)==19328 and len({r['case'] for r in sources})==3
cards=[];methods=('embedding','linear','nonlinear','infrared_only')
for case in summary['case_results']:
 name=case['case'];old=ranking[name];p=parent[name];records=[r for r in sources if r['case']==name];catalog=[r for r in records if r['kind']=='Catalog'];best=max(catalog,key=lambda r:int(r['supported_visit_matches']));ranges=[float(e['separation_arcsec']) for e in edges if e['case']==name and e['response_key']==best['response_key'] and e['source_row']==best['source_row']]
 assert len(ranges)==case['supported_visits'] and sum(d<=2 for d in ranges)==int(best['supported_visit_matches'])
 bits=[i+1 for i in range(31) if int(best['sqf_4_5']) & (1<<i)]
 alias_records=[r for r in aliases if r['case']==name and r['catalog_row']==best['source_row'] and r['inside_half_arcsec']=='1'];assert len(alias_records)==1
 scores={m:dict(raw_ranking_score=old[m+'_score'],selected_at_original_all_requested_budget=bool(int(old[m+'_all_requested_review'])),calibrated_probability=False) for m in methods};assert all(r['selected_at_original_all_requested_budget'] for r in scores.values())
 card=dict(case_id=name,case_selection='previously consumed chemistry-positive original-query cadence support',physical_stage='unknown',birth_status='not_established',novelty='native counterparts already catalogued; not discoveries',catalogue_statements=dict(higal='catalogue-prestellar clump; not independent physical starlessness',malt90_native_id=old['native_malt90_id'],consumed_proxy_flags=old['consumed_proxy_flags'],proxy_tracer_order=['DHC3N','DHNCO404','DCH3CN','DSIO'],glimpse='point-source catalogue record; no inferred youth or clump membership'),parent_fields={k:p[k] for k in ('ra','dec','mass','temp','dist','surf_dens','diam')},historical_system=dict(source_revision='c6618258f56047aee306e915290ddcebcf7906be',tile=old['tile'],fold=old['fold'],all_requested_review_budget=982,models=scores,new_glimpse_input_used=False),native_case_decision=case,geometrically_best_catalogue_record=best,reciprocal_alias=alias_records[0],all_native_alternatives=records,matched_visits=int(best['supported_visit_matches']),total_supported_visits=case['supported_visits'],separation_range_arcsec=[min(ranges),max(ranges)],sqf_one_based_bits=bits,primary_gate_passed=False,interpretation='A tight projected position is not emitter identity; the frozen zero-flag result does not determine physical reliability, stage or birth.',why_interesting='All supported medians align with an offset prior infrared source outside the original clump-centred search.' if int(best['supported_visit_matches'])==case['supported_visits'] else 'Partial positional coverage leaves the source association unresolved; every native alternative remains retained.')
 assert card['physical_stage']=='unknown' and card['birth_status']=='not_established' and isinstance(card['geometrically_best_catalogue_record']['cntr'],str);cards.append(card)
first=cards[0];assert first['matched_visits']==first['total_supported_visits']==21 and first['sqf_one_based_bits']==[10,11] and first['separation_range_arcsec'][1]<.336
assert sum(r['inside_half_arcsec']=='1' for r in aliases)==6 and len(sources)==12
packet=dict(schema='source-bound-native-glimpse-evidence-cards/1',evidence_cases=cards,no_physical_probabilities=True,independent_source_validation=False,original_comparison_changed=False,new_stars=0,new_births=0)
with (STAGE/'evidence_cards.json').open('x') as f:json.dump(packet,f,indent=2);f.write('\n')
folders=['artifacts/native_glimpse_metadata_20261012','artifacts/native_glimpse_acquisition_20261012','artifacts/native_glimpse_association_20261012','artifacts/native_glimpse_verification_20261012'];files={}
for folder in folders:
 for p in (ROOT/folder).iterdir():
  if p.is_file():files[str(p.relative_to(ROOT))]=dict(bytes=p.stat().st_size,sha256=sha(p))
report=ROOT/'docs/NATIVE_GLIMPSE_ASSOCIATION_RESULTS_20261012.md';files[str(report.relative_to(ROOT))]=dict(bytes=report.stat().st_size,sha256=sha(report))
assert sum(v['bytes'] for v in files.values())<16*1024**2 and shutil.disk_usage(ROOT).free>5*1024**3
for folder in folders[1:]:
 m=json.loads((ROOT/folder/'resource_monitor.json').read_text());assert m['completed'] and m['stop_reason'] is None
record=dict(schema='verified-native-glimpse-association-checkpoint/1',verified=True,frozen_protocol_commit='b408f9e3',acquisition_commit='4e028085',code_revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),primary_support_cases=0,primary_case_denominator=3,primary_gate_failed=True,descriptive_tight_alignment=dict(case_id=first['case_id'],native_source_id=first['geometrically_best_catalogue_record']['designation'],matched_visits=21,total_visits=21,separation_range_arcsec=first['separation_range_arcsec'],clump_separation_arcsec=float(first['geometrically_best_catalogue_record']['clump_separation_arcsec']),sqf_one_based_bits=[10,11],physical_stage='unknown'),native_catalog_records=6,native_archive_alias_records=6,evidence_cards=3,original_population=19328,unknown_proxy_states=19066,old_models_unchanged=True,physical_validation=False,new_stars=0,new_births=0,local_result_unpublished=True,bytes_before_final_checkpoint=sum(v['bytes'] for v in files.values()),files=files)
out=ROOT/'artifacts/native_glimpse_checkpoint_20261012.json'
with out.open('x') as f:json.dump(record,f,indent=2);f.write('\n')
assert out.stat().st_size+record['bytes_before_final_checkpoint']<16*1024**2
print(json.dumps({k:v for k,v in record.items() if k!='files'},indent=2))
