"""Correct population design probabilities, preserving the original realization."""
from pathlib import Path
import csv,gzip,hashlib,io,json
R=Path(__file__).resolve().parents[1];S=R/'artifacts/validation_design_correction2_20261014'
reg=json.loads((R/'artifacts/validation_design_registration_20261014.json').read_text())
for item in reg['inputs']:assert hashlib.sha256((R/item['path']).read_bytes()).hexdigest()==item['sha256']
summary=json.loads((R/reg['summary']).read_text());changed=0
with gzip.open(R/reg['population'],'rt') as f:reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
for row in records:
 if row['prospective_frame']=='1':
  x=summary['strata'][row['stratum']];n=x['sampled_groups'];N=x['groups'];assert int(row['inclusion_denominator'])==N
  if row['review_sample']=='0':changed+=1
  row['sampled_stratum_groups']=str(n);row['inclusion_numerator']=str(n);row['inverse_inclusion_weight']=str(N/n)
with (S/'population-design.csv.gz').open('xb') as raw:
 with gzip.GzipFile(filename='',fileobj=raw,mtime=0,mode='wb') as z:
  with io.TextIOWrapper(z,newline='') as f:w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows(records)
data=(S/'population-design.csv.gz').read_bytes();(S/'correction.json').write_text(json.dumps(dict(corrected_unsampled_members=changed,population=19328,selected=223,changed_fields=['sampled_stratum_groups','inclusion_numerator','inverse_inclusion_weight'],source_population_sha256=next(x['sha256'] for x in reg['inputs'] if x['path']==reg['population']),corrected_population_sha256=hashlib.sha256(data).hexdigest(),corrected_population_bytes=len(data),selection_or_outcome_changed=False,physical_validation=False),indent=2)+'\n');print('Corrected design probability fields on',changed,'unsampled frame members; selected cases unchanged')
