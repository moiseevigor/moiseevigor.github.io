"""Independent relational check of cohort construction; imports no builder."""
import csv,gzip,hashlib,json,math
from collections import Counter,defaultdict
from pathlib import Path
R=Path(__file__).resolve().parents[1]
S=R/'artifacts/validation_cohort_20261014'
V=R/'artifacts/validation_cohort_verification3_20261014'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(65536),b''):h.update(block)
 return h.hexdigest()
def read(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:yield from csv.DictReader(f)
def main():
 reg=json.loads((R/'artifacts/validation_cohort_registration_20261014.json').read_text())
 for item in reg['inputs']:assert sha(R/item['path'])==item['sha256'] and (R/item['path']).stat().st_size==item['bytes']
 outcome=json.loads((S/'summary.json').read_text())
 for item in outcome['outputs']:assert sha(R/item['path'])==item['sha256'] and (R/item['path']).stat().st_size==item['bytes']
 actual=list(read(S/'population.csv.gz')); ids=[x['designation'] for x in actual]
 assert ids==sorted(set(ids)) and len(ids)==19328
 parent={}
 for x in read(R/'cache/higal360clump.csv'):
  try: distance=float(x['dist'])
  except ValueError: continue
  if x['evol_flag']=='1' and math.isfinite(distance) and 0<distance<=4:parent[x['designation']]={k:x[k] for k in ['ra','dec','glon','glat','dist','mass','temp','surf_dens','diam']}
 assert set(parent)==set(ids)
 by_group=defaultdict(list);info={};native={x['case_id']:x['geometrically_best_catalogue_record']['designation'] for x in json.load((R/'tools/review/backend/evidence_v5/native-cards.json').open())['evidence_cases']}
 for file,keys in [(reg['ranking'],['group','tile','fold','proxy_state','temporal_observed_features','molecular_observed_features','embedding_all_requested_review','nonlinear_all_requested_review']), (reg['identity'],['e13_sample','malt90_consumed','almagal_consumed','control_sample','spicy_ids']), (reg['coverage'],['fir_state','wise_anchor_present','neowise_requested','neowise_rows','temporal_support','malt90_records','one_record_unshared'])]:
  visited=set()
  for x in read(R/file):
   n=x['designation'];assert n not in visited;visited.add(n)
   info.setdefault(n,{}).update({k:x[k] for k in keys})
  assert visited==set(ids)
 for n,x in info.items():by_group[x['group']].append(n)
 strata={};exclusion={};state={}
 for g,members in by_group.items():
  why=set()
  for n in members:
   x=info[n]
   why.update(k for k in ['e13_sample','malt90_consumed','almagal_consumed','control_sample'] if x[k]=='1')
   if x['spicy_ids']:why.add('spicy_candidate_consumed')
   if x['proxy_state']!='unknown':why.add('qualifying_proxy_consumed')
  exclusion[g]=';'.join(sorted(why))
  E=any(info[n]['embedding_all_requested_review']=='1' for n in members);B=any(info[n]['nonlinear_all_requested_review']=='1' for n in members)
  label={(False,False):'neither',(True,False):'embedding_only',(False,True):'nonlinear_only',(True,True):'both'}[E,B]
  label+='|temporal' if any(int(info[n]['temporal_observed_features'])==4 for n in members) else '|no_temporal'
  state[g]=label
  if not why:strata.setdefault(label,[]).append(g)
 selected=set();stratum_summary={}
 for label in outcome['strata']:
  ordered=sorted(strata.get(label,[]),key=lambda g:(hashlib.sha256((reg['seed']+'|'+g).encode()).hexdigest(),g));sample=ordered[:min(30,len(ordered))];selected.update(sample)
  expected={'groups':len(ordered),'sampled_groups':len(sample),'frame_members':sum(len(by_group[g]) for g in ordered),'sampled_members':sum(len(by_group[g]) for g in sample)}
  assert expected==outcome['strata'][label];stratum_summary[label]=expected
 counts=Counter();cross=Counter()
 for x in actual:
  n=x['designation'];r=info[n];g=r['group'];temporal=int(r['temporal_observed_features'])==4
  for k,value in parent[n].items():assert x[k]==value
  for k in ['group','tile','fold','proxy_state','spicy_ids','wise_anchor_present','neowise_requested','neowise_rows']:assert x[k]==r[k]
  assert x['stratum']==state[g] and x['exclusion_reasons']==exclusion[g] and int(x['group_members'])==len(by_group[g])
  assert int(x['prospective_frame'])==int(not exclusion[g]) and int(x['review_sample'])==int(g in selected)
  assert x['native_infrared_id']==native.get(n,'')
  geometry='none_retained' if int(r['malt90_records'])==0 else 'geometric_unique_unshared' if int(r['one_record_unshared'])==1 else 'ambiguous_or_shared'
  ownership='native_id_retained_association_gate_failed' if n in native else 'projected_anchor_native_id_missing' if r['wise_anchor_present']=='1' else 'no_retained_anchor'
  assert x['molecular_ownership']==geometry and x['infrared_ownership']==ownership
  assert x['molecular_records']==r['malt90_records'] and x['model_molecular_features']==r['molecular_observed_features'] and x['embedding_review']==r['embedding_all_requested_review'] and x['nonlinear_review']==r['nonlinear_all_requested_review']
  assert int(x['fir_value_error_support'])==int(r['fir_state']=='OOOOEE') and int(x['model_temporal_support'])==int(temporal) and x['screened_temporal_support']==r['temporal_support']
  N=stratum_summary[state[g]]['groups'] if not exclusion[g] else 0;k=stratum_summary[state[g]]['sampled_groups'] if g in selected else 0
  assert int(x['stratum_groups'])==int(x['inclusion_denominator'])==N and int(x['sampled_stratum_groups'])==int(x['inclusion_numerator'])==k
  assert (not x['inverse_inclusion_weight']) if not k else float(x['inverse_inclusion_weight'])==N/k
  for field in ['physical_membership','independent_truth']:assert x[field]=='unknown'
  assert x['certified_validation_eligible']=='0' and x['footprint_completeness']=='unverified' and x['adjudication_status']=='external_evidence_required' and x['prior_feature_readout']=='consumed_unlabelled_features'
  counts['parent']+=1;counts['prospective_frame_members']+=int(x['prospective_frame']);counts['sampled_members']+=int(x['review_sample'])
  for field in ['fir_value_error_support','wise_anchor_present','screened_temporal_support','model_temporal_support']:counts[field]+=int(x[field])
  counts['molecular_'+geometry]+=1;counts['infrared_'+ownership]+=1;cross[(x['proxy_state'],x['model_temporal_support'],geometry)]+=1
 assert dict(counts)==outcome['counts']
 expected_cross=[dict(proxy_state=k[0],model_temporal_support=k[1],molecular_geometry=k[2],parents=str(v)) for k,v in sorted(cross.items())]
 assert list(read(S/'coverage.csv'))==expected_cross
 queue=list(read(S/'review-cohort.csv.gz'));assert queue==[x for x in actual if x['review_sample']=='1'] and len(queue)<=480 and len(selected)<=240
 assert list(read(S/'molecular-alternatives.csv.gz'))==list(read(R/reg['edges']))
 assert outcome['groups']==len(by_group) and outcome['frame_groups']==sum(len(v) for v in strata.values()) and outcome['sampled_groups']==len(selected) and outcome['excluded_groups']==sum(bool(v) for v in exclusion.values())
 assert outcome['truth_unknown']==19328 and outcome['certified_validation_eligible']==0 and outcome['independent_truth_manifest'] is None
 for flag in ['physical_validation','models_fitted','rankings_changed','new_stars','new_births']:assert not outcome[flag]
 record={'schema':'cohort-independent-verification/1','verified':True,'method':'Separate raw-parent reconstruction, relational joins, group exclusions, hexadecimal seeded priority order, complete ledgers and upstream alternatives','sources':len(actual),'cohort_members':len(queue),'sampled_groups':len(selected),'summary_sha256':sha(S/'summary.json'),'population_sha256':sha(S/'population.csv.gz'),'queue_sha256':sha(S/'review-cohort.csv.gz'),'registration_sha256':sha(R/'artifacts/validation_cohort_registration_20261014.json'),'physical_validation':False,'outputs':outcome['outputs']}
 (V/'verification.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
if __name__=='__main__':main()
