"""Separate invariant check: every eligible stratum shares its design probability."""
import csv,gzip,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];S=R/'artifacts/validation_design_correction2_20261014';V=R/'artifacts/validation_design_verification_20261014'
reg=json.loads((R/'artifacts/validation_design_registration_20261014.json').read_text())
for x in reg['inputs']:assert hashlib.sha256((R/x['path']).read_bytes()).hexdigest()==x['sha256']
def read(p):
 with gzip.open(p,'rt') as f:return list(csv.DictReader(f))
original=read(R/reg['population']);corrected=read(S/'population-design.csv.gz');assert len(original)==len(corrected)==19328
summary=json.loads((R/reg['summary']).read_text());changes=0;fields={'sampled_stratum_groups','inclusion_numerator','inverse_inclusion_weight'}
for old,new in zip(original,corrected):
 assert {k:v for k,v in old.items() if k not in fields}=={k:v for k,v in new.items() if k not in fields}
 if old['review_sample']=='1' or old['prospective_frame']=='0':assert old==new
 else:assert set(k for k in old if old[k]!=new[k])==fields;changes+=1
 if new['prospective_frame']=='1':
  N=summary['strata'][new['stratum']]['groups'];n=min(30,N)
  assert int(new['sampled_stratum_groups'])==int(new['inclusion_numerator'])==n and int(new['inclusion_denominator'])==N and float(new['inverse_inclusion_weight'])==N/n
 else:assert new['inclusion_numerator']=='0' and new['inclusion_denominator']=='0' and new['inverse_inclusion_weight']==''
assert [r for r in corrected if r['review_sample']=='1']==read(R/reg['queue'])
c=json.loads((S/'correction.json').read_text());assert c['corrected_unsampled_members']==changes==14980-223 and c['corrected_population_sha256']==hashlib.sha256((S/'population-design.csv.gz').read_bytes()).hexdigest()
record=dict(verified=True,uniform_stratum_probability_checked=True,selection_and_all_other_fields_unchanged=True,corrected_unsampled_members=changes,population=19328,queue=223,physical_validation=False,source_population_sha256=hashlib.sha256((R/reg['population']).read_bytes()).hexdigest(),corrected_population_sha256=c['corrected_population_sha256'],queue_sha256=hashlib.sha256((R/reg['queue']).read_bytes()).hexdigest(),correction_sha256=hashlib.sha256((S/'correction.json').read_bytes()).hexdigest());(V/'verification.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
