import csv,hashlib,json,shutil,subprocess
from pathlib import Path
B=Path('/Users/igor/Work/me/moiseevigor.github.io');R=Path('/Users/igor/Work/me/starbirth-search')
REV=subprocess.check_output(['git','rev-parse','92ece66f'],cwd=R,text=True).strip()
def blob(p):return subprocess.check_output(['git','show',REV+':'+p],cwd=R)
def sha(b):return hashlib.sha256(b).hexdigest()
assert shutil.disk_usage(B).free>5*2**30
folder=B/'public/data/starbirth/native-quality';assert not folder.exists();folder.mkdir()
a=json.loads(blob('artifacts/native_profile_resumption_assessment_20261014.json'))
paths=[x['path'] for x in a['evidence']]+['artifacts/native_profile_resumption_assessment_20261014.json','artifacts/native_profile_resumption_assessment_verification_20261014.json','docs/NATIVE_PROFILE_RESUMPTION_RESULTS_20261014.md','artifacts/graph/native_profile_resumption_reviewed_supplement_20261014.json','research/build_native_profile_resumption_assessment_20261014.py','research/verify_native_profile_resumption_assessment_20261014.py']
assert len(paths)==len(set(paths));entries=[]
for i,p in enumerate(paths):
 data=blob(p);assert data==(R/p).read_bytes(),p
 name='starbirth-npr-'+str(i).zfill(2)+'-'+Path(p).name
 if p=='docs/NATIVE_PROFILE_RESUMPTION_RESULTS_20261014.md':name='results.md'
 if p=='artifacts/native_profile_resumption_assessment_20261014.json':name='assessment.json'
 (folder/name).write_bytes(data);entries.append(dict(public_file=name,source_path=p,source_revision=REV,bytes=len(data),sha256=sha(data)))
with (folder/'source-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(entries[0]),lineterminator='\n');w.writeheader();w.writerows(entries)
text='# NEOWISE: exact delivery, unresolved flag contract\n\nExact inspected source revision `'+REV+'`. Three explicitly approved requests delivered 874 rows. Both original implementations reproduce 0/3 under a four-character flag contract, but every delivered native photo-quality flag has two characters. Scientifically validated quality support and its gate remain unmeasured. No altered filter, padding or corrected rerun was performed. Ownership, youth and stellar birth remain unresolved. All six counterparts and the earlier failed attempt stay preserved.\n\n## Complete exact downloads\n\n'
for e in entries:text+='- ['+e['public_file']+']('+e['public_file']+') — `'+e['source_path']+'`\n'
text+='\n[Complete source hashes](source-inventory.csv). Original report-relative links refer to the research repository; this inventory maps the public copies. Source creation-time publication flags remain historical; delivery has a separate receipt.\n'
(folder/'README.md').write_text(text)
p=B/'_config.yml';s=p.read_text();needle='  # Verified offline gas-velocity comparison: exact evidence basename exceptions.\n';assert s.count(needle)==1
addition='  # Native quality: exact source bytes and independently qualified unresolved result.\n'
for e in entries:
 if e['public_file'].endswith(('.json','.log')):addition+='  - "'+e['public_file']+'"\n'
p.write_text(s.replace(needle,addition+needle))
p=B/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';s=p.read_text().replace('last_modified_at: 2026-10-13','last_modified_at: 2026-10-14')
s=s.replace('<a href="#gas-velocity">Does the gas velocity agree?</a>','<a href="#gas-velocity">Does the gas velocity agree?</a><a href="#native-quality">The native quality contract</a>')
s=s.replace('The native NEOWISE quality retry remains stopped pending explicit human approval; this publication acquired no observations or measurements.','This gas comparison used cached data. The separate NEOWISE resumption was subsequently explicitly approved; its qualified result appears below. Publication itself does not acquire measurements.')
section='''<h2 id="native-quality">The measurements arrived. Their quality verdict is still unresolved.</h2>

The three explicitly approved NEOWISE requests completed on 14 October: **874 native extraction rows**, split **312 / 273 / 289** across the same three clumps. Every raw VO cell agrees with the exported CSV; an independent checker reproduces the unchanged registered analysis. This resolves delivery, not source ownership.

The frozen rule returns **0/3**, against the required 2/3. But the exact delivered `ph_qual` values contain **two characters in all 874 rows**, while the code and [official NEOWISE field description](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html) specify four. The cause of this discrepancy remains unknown. The raw strings were preserved without adding missing characters or relaxing a cut.

<div class="sb-result sb-result--negative"><strong>Insufficient evidence.</strong> The computational failure is reproducible; a scientifically validated quality/cadence verdict is still <strong>unmeasured</strong>. Two implementations can agree while sharing an incompatible input contract. This does not establish an absence of usable observations, young stars or births.</div>

| Fixed clump | Native rows | Unique literal rows at best counterpart | Frozen accepted rows |
|---|---:|---:|---:|
| G330.8814−0.3656 | 312 | 307 | 0 |
| G351.2258+0.6937 | 273 | 75 | 0 |
| G353.4272−0.3734 | 289 | 68 | 0 |

The first and third best points also fail the original profile-fit criterion in every matched row. The second has overlapping SNR and fit-quality rejections. These are descriptive tallies under the unchanged rule, not a revised cadence verdict. All six alternatives remain available; the separate red third point has zero unique matched extractions and cannot inherit the blue point’s history.

The bounded unit stops here. No corrected scientific rerun or further request followed automatically. A future contract repair must be explicit, separately frozen and tested on now-consumed evidence. No ownership, physical classification, representative precision/recall, new star or stellar birth is established. The earlier ranking, control, colour and radio/gas failures remain unchanged.

The new acquisition used 14.61 seconds; including the earlier 91.19-second failed TAP attempt, acquisition consumed 105.80 of the original 600 seconds. Three new requests means four cumulative attempts. The new research packet is about 1.3 MiB; sampled acquisition RSS peaked at 34.94 MiB with at least 50.65 GiB free. Monitoring is sampled process-group evidence and may miss shorter peaks.

Download [the qualified result](/public/data/starbirth/native-quality/results.md), [all cases and exact flag audit](/public/data/starbirth/native-quality/assessment.json), and [every raw response, unchanged analysis, independent receipt, protocol and source hash](/public/data/starbirth/native-quality/README.md). Exact source revision: `'''+REV+'''`.

'''
needle='<h2 id="unknowns">';assert s.count(needle)==1;s=s.replace(needle,section+needle);p.write_text(s)
p=B/'_posts/2026-10-11-hidden-protostars-research-program.md';s=p.read_text().replace('last_modified_at: 2026-10-13','last_modified_at: 2026-10-14')
needle='The fixed first-field gas–radio comparison';i=s.index(needle);end=s.index('\n',i)
s=s[:end]+'''\n\n**14 October update:** all three approved NEOWISE requests returned **874 rows**. The frozen implementation yields **0/3**, but every delivered photo-quality flag has two characters while the registered contract requires four. The scientific quality verdict remains **unmeasured**; literal flags and the original failure are preserved. No corrected rerun or stellar birth is claimed. [Read the independent audit and full native evidence](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#native-quality).'''+s[end:];p.write_text(s)
p=B/'_data/series.yml';s=p.read_text();i=s.index('- id: hidden-protostars');head,tail=s[:i],s[i:]
# Add latest result without overwriting historical status or other series.
tail=tail.replace('  status:', '  latest_result: "874 NEOWISE rows delivered; frozen 0/3 is qualified by a two-versus-four-character photo-quality flag contract mismatch. Scientific quality support remains unmeasured; no birth is established."\n  status:',1);p.write_text(head+tail)
assert sum(p.stat().st_size for p in folder.iterdir())<2*2**20
print(json.dumps({'revision':REV,'exact_exports':len(entries),'new_packet_bytes':sum(p.stat().st_size for p in folder.iterdir())}))
