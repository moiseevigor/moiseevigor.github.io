"""Additional exact-output cardinality and bounded final checkpoint audit."""
from collections import Counter
import csv,gzip,hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAMES=('temporal_missingness_20261012','temporal_missingness_schema_adapted_20261012','temporal_missingness_verification_schema_adapted_20261012')
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024**2),b''):h.update(b)
 return h.hexdigest()
verification=json.loads((ROOT/'artifacts'/NAMES[2]/'verification.json').read_text());assert verification['verified']
with gzip.open(ROOT/'artifacts'/NAMES[1]/'sources.csv.gz','rt') as f:records=list(csv.DictReader(f))
with gzip.open(ROOT/'artifacts/multisurvey_missing_view_20261012/sources.csv.gz','rt') as f:original={r['designation']:r['proxy_state'] for r in csv.DictReader(f)}
assert len(records)==len({r['designation'] for r in records})==19328 and {r['designation'] for r in records}==set(original)
assert all(r['proxy_state']==original[r['designation']] for r in records)
assert Counter(r['proxy_group'] for r in records)==Counter(positive=27,negative=235,unknown=19066)
with gzip.open(ROOT/'artifacts'/NAMES[1]/'positive_raw_evidence.csv.gz','rt') as f:evidence=list(csv.DictReader(f))
assert len(evidence)==len({r['source_row'] for r in evidence})==1072
positive={n for n,v in original.items() if v=='qualifying_positive'};assert {r['designation'] for r in evidence}<=positive
assert sum(r['query_support']=='1' for r in records if r['designation'] in positive)==3
summary=ROOT/'artifacts'/NAMES[1]/'summary.json';assert digest(summary)==verification['summary_sha256']
files={}
for name in NAMES:
 for p in (ROOT/'artifacts'/name).iterdir():
  if p.is_file():files[str(p.relative_to(ROOT))]=dict(bytes=p.stat().st_size,sha256=digest(p))
report=ROOT/'docs/TEMPORAL_MISSINGNESS_RESULTS_20261012.md';files[str(report.relative_to(ROOT))]=dict(bytes=report.stat().st_size,sha256=digest(report))
monitors=[json.loads((ROOT/'artifacts'/n/'resource_monitor.json').read_text()) for n in NAMES[1:]]
assert all(m['completed'] and m['stop_reason'] is None for m in monitors)
assert all(sum(p.stat().st_size for p in (ROOT/'artifacts'/n).iterdir() if p.is_file())<8*1024**2 for n in NAMES[1:])
assert sum(v['bytes'] for v in files.values())<16*1024**2 and shutil.disk_usage(ROOT).free>5*1024**3
record=dict(schema='verified-temporal-missingness-checkpoint/1',verified=True,original_freeze='ed114aad',schema_amendment='e75ad9ed',current_code_revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),primary_count=3,primary_denominator=27,majority_gate=14,majority_gate_passed=False,outcome='query_support_below_majority',requested_identities=19328,exact_native_proxy_labels_retained=True,unknown_proxy_count=19066,positive_raw_evidence_rows=1072,independent_software_verification=True,physical_validation=False,original_comparison_changed=False,model_rerun=False,new_stars=0,new_births=0,occurrence_measured=False,local_result_unpublished=True,free_gib=round(shutil.disk_usage(ROOT).free/1024**3,2),bytes_before_final_checkpoint=sum(v['bytes'] for v in files.values()),files=files)
out=ROOT/'artifacts/temporal_missingness_checkpoint_20261012.json'
with out.open('x') as f:json.dump(record,f,indent=2);f.write('\n')
assert record['bytes_before_final_checkpoint']+out.stat().st_size<16*1024**2
print(json.dumps({k:v for k,v in record.items() if k!='files'},indent=2))
