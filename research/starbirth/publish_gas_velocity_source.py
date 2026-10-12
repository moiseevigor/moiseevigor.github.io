"""Export existing verified gas/radio evidence; never execute research or acquisition."""
import csv,hashlib,json,shutil,subprocess
from pathlib import Path
B=Path('/Users/igor/Work/me/moiseevigor.github.io');R=Path('/Users/igor/Work/me/starbirth-search')
REV='dc8d8ca3';REV=subprocess.check_output(['git','rev-parse',REV],cwd=R,text=True).strip()
def blob(p):return subprocess.check_output(['git','show',REV+':'+p],cwd=R)
def sha(b):return hashlib.sha256(b).hexdigest()
assert shutil.disk_usage(B).free>5*1024**3
c=json.loads(blob('artifacts/radio_gas_velocity_checkpoint_20261013.json'))
assert c['unit_complete'] and c['independent_verification_passed'] and c['primary_rule_met']
assert c['primary_denominator']==1 and c['primary_shift_support']==[True,True,False]
assert not c['robust_all_declared_shifts'] and not c['physical_validation'] and not c['models_changed']
assert c['new_stars']==c['new_births']==0
folder=B/'public/data/starbirth/gas-velocity';assert not folder.exists();folder.mkdir()
extra=[c['report_path'],c['corrected_assessment_path'],'artifacts/radio_gas_velocity_checkpoint_20261013.json','artifacts/graph/radio_gas_velocity_reviewed_supplement_20261013.json','docs/RESEARCH_STATE_20261013_GAS_VELOCITY.md','research/build_radio_gas_velocity_note_20261013.py']
entries=[]
for item in c['evidence']+[{'path':p} for p in extra]:
 p=item['path'];data=blob(p);assert data==(R/p).read_bytes(),p
 if 'sha256' in item:assert sha(data)==item['sha256'] and len(data)==item['bytes']
 parts=Path(p).parts;name=parts[-1]
 if p==c['report_path']:name='results.md'
 elif name=='RADIO_GAS_VELOCITY_PROTOCOL_20261013.md':name='protocol.md'
 elif name=='RESEARCH_STATE_20261013_GAS_VELOCITY.md':name='creation-checkpoint.md'
 elif p.startswith('artifacts/radio_gas_velocity_') and len(parts)>2:
  stage=parts[-2].removeprefix('radio_gas_velocity_').removesuffix('_20261013')
  name='starbirth-rgv-'+stage+'-'+name
 elif p.startswith('artifacts/'):
  name='starbirth-rgv-'+name.removeprefix('radio_gas_velocity_').removesuffix('_20261013.json')+'.json'
 assert name not in [x['public_file'] for x in entries]
 (folder/name).write_bytes(data)
 entries.append(dict(public_file=name,source_path=p,source_revision=REV,bytes=len(data),sha256=sha(data)))
with (folder/'source-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(entries[0]),lineterminator='\n');w.writeheader();w.writerows(entries)
text='''# Marginal gas/radio overlap: regional context, unresolved membership

Exact source exports from research revision `'''+REV+'''`.
One fixed primary, HIGALBM330.8814-0.3656 / AG1532 / historical MMB
330.878-0.367, meets the declared common-band criterion with 0.1970 km/s overlap.
The +1 km/s radio-shift sensitivity removes overlap. Declared broadened bands and
shifts are descriptive conventions, not confidence bounds or measured calibration
errors. Maser peaks lie outside both gas bands. No physical membership, point-source
ownership, stellar velocity, young-star classification, precision/recall or birth
is established. The other two fixed cases are secondary context, not substituted
primaries or verified unrelated controls. Original ranking and failed gates remain.

The original output mislabels Vc. The separately corrected assessment identifies
consensus gas velocity and the native Name suffix; no equation, selection or result
changed. Original summary, code and verification remain byte-identical. Cases and
catalogue measurements are consumed evidence, not fresh physical validation.
The independently checked unit used cached records only. Publication performs no
new research, observation request, fitting, threshold change or stopped-query retry.
Creation-time local/unpublished flags remain historical; deployment has a separate
receipt. Original report links point into the research repo. Use this complete
mapping to find the exact public copies; bulk inputs remain local and hash-bound
in the registration, while compact native records are downloadable.

## Complete downloads

'''
for x in entries:text+='- ['+x['public_file']+']('+x['public_file']+') — `'+x['source_path']+'`\n'
text+='\n[Complete hashes and exact source mapping](source-inventory.csv).\n'
(folder/'README.md').write_text(text)
config=B/'_config.yml';s=config.read_text();needle='  # Verified native radio context: exact JSON/log basename exceptions.\n';assert s.count(needle)==1
addition='  # Verified offline gas-velocity comparison: exact evidence basename exceptions.\n'
for x in entries:
 if x['public_file'].endswith(('.json','.log')):addition+='  - "'+x['public_file']+'"\n'
config.write_text(s.replace(needle,addition+needle))
assert sum(p.stat().st_size for p in folder.iterdir())<1024**2
print(json.dumps({'research_revision':REV,'exact_exports':len(entries),'packet_bytes':sum(p.stat().st_size for p in folder.iterdir()),'new_research_executed':False}))
