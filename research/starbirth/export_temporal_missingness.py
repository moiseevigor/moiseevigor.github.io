"""Exact inspected Git exports; no scientific execution or observations."""
import argparse,csv,hashlib,json,shutil,subprocess
from pathlib import Path
BLOG=Path(__file__).resolve().parents[2];RESEARCH=Path('/Users/igor/Work/me/starbirth-search')
p=argparse.ArgumentParser();p.add_argument('--revision',required=True);a=p.parse_args()
OUT=BLOG/'public/data/starbirth/temporal-missingness';assert not OUT.exists();assert shutil.disk_usage(BLOG).free>5*1024**3
pairs=[('protocol.md','docs/TEMPORAL_MISSINGNESS_PROTOCOL_20261012.md'),('schema-amendment.md','docs/TEMPORAL_MISSINGNESS_SCHEMA_AMENDMENT_20261012.md'),('results.md','docs/TEMPORAL_MISSINGNESS_RESULTS_20261012.md'),('starbirth-tmd-original-registration.json','artifacts/temporal_missingness_registration_20261012.json'),('starbirth-tmd-schema-amendment.json','artifacts/temporal_missingness_schema_amendment_20261012.json'),('sources.csv.gz','artifacts/temporal_missingness_schema_adapted_20261012/sources.csv.gz'),('positive-raw-evidence.csv.gz','artifacts/temporal_missingness_schema_adapted_20261012/positive_raw_evidence.csv.gz'),('starbirth-tmd-summary.json','artifacts/temporal_missingness_schema_adapted_20261012/summary.json'),('starbirth-tmd-generation-checkpoint.json','artifacts/temporal_missingness_schema_adapted_20261012/checkpoint.json'),('starbirth-tmd-checkpoint.json','artifacts/temporal_missingness_checkpoint_20261012.json'),('starbirth-tmd-verification.json','artifacts/temporal_missingness_verification_schema_adapted_20261012/verification.json'),('starbirth-tmd-worker-resources.json','artifacts/temporal_missingness_schema_adapted_20261012/resource_monitor.json'),('starbirth-tmd-verification-resources.json','artifacts/temporal_missingness_verification_schema_adapted_20261012/resource_monitor.json'),('failed-worker.txt','artifacts/temporal_missingness_20261012/worker.log'),('starbirth-tmd-failed-resources.json','artifacts/temporal_missingness_20261012/resource_monitor.json'),('starbirth-tmd-knowledge-supplement.json','artifacts/graph/temporal_missingness_reviewed_supplement_20261012.json')]
for name in ('audit_temporal_missingness','verify_temporal_missingness','audit_temporal_missingness_schema_adapted','verify_temporal_missingness_schema_adapted','finalize_temporal_missingness','build_temporal_missingness_knowledge_supplement'):pairs.append(('code/'+name+'.py','research/'+name+'.py'))
entries=[];total=0
for dest,src in pairs:
 data=subprocess.check_output(['git','show',a.revision+':'+src],cwd=RESEARCH);total+=len(data);assert total<16*1024**2
 path=OUT/dest;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data);entries.append(dict(public_file=dest,source_path=src,source_revision=a.revision,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
with (OUT/'source-inventory.csv').open('x',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(entries[0]));w.writeheader();w.writerows(entries)
readme=f'''# Temporal missingness: query cadence is not emitter identity

Exact source blobs from research revision `{a.revision}`.
Only **3 of 27** consumed positives have original-query cadence; the frozen
**14-of-27** majority gate failed. The original anchored view remains absent
in all 27. No quality/association/cadence rule or prior model was changed.
All **19,328** parent identities, native proxy-state strings, **19,066** unknown
proxy states and **1,072** raw query rows for the positive cases remain retained.
Query-level support cannot establish a single emitter, a young star or a birth.

The source snapshot's unpublished/pending flags describe its creation time.
A separate live deployment receipt confirms publication and independent checking.
Source code is for inspection/reproduction in the original checkout with the
registered raw inputs; the public packet alone does not duplicate bulk data.
The original schema stop and separately frozen lossless amendment are preserved.
No physical precision/recall, classifier increment or new observation is claimed.

'''
for e in entries:readme+=f"- [{e['public_file']}]({e['public_file']})\n"
readme+='\n[Complete size, SHA-256 and source revision inventory](source-inventory.csv).\n'
(OUT/'README.md').write_text(readme)
assert sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())<16*1024**2
print(json.dumps(dict(source_revision=a.revision,exports=len(entries),source_bytes=total)))
