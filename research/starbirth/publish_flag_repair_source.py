import csv,hashlib,json,shutil,subprocess
from pathlib import Path
B=Path('/Users/igor/Work/me/moiseevigor.github.io');R=Path('/Users/igor/Work/me/starbirth-search');REV=subprocess.check_output(['git','rev-parse','b38a93ad'],cwd=R,text=True).strip()
def blob(p):return subprocess.check_output(['git','show',REV+':'+p],cwd=R)
def sha(b):return hashlib.sha256(b).hexdigest()
assert shutil.disk_usage(B).free>5*2**30
c=json.loads(blob('artifacts/neowise_flag_repair_checkpoint_20261014.json'));assert c['unit_complete'] and c['independent_verification_passed'] and c['exact_delta_verification_passed']
folder=B/'public/data/starbirth/flag-repair';assert not folder.exists();folder.mkdir()
paths=[e['path'] for e in c['evidence']]+['artifacts/neowise_flag_repair_checkpoint_20261014.json','artifacts/graph/neowise_flag_repair_reviewed_supplement_20261014.json','research/build_neowise_flag_repair_checkpoint_20261014.py']
entries=[]
for i,p in enumerate(paths):
 data=blob(p);assert data==(R/p).read_bytes(),p
 name='starbirth-nfr-'+str(i).zfill(2)+'-'+Path(p).name
 if p==c['report_path']:name='results.md'
 if p=='artifacts/neowise_flag_repair_checkpoint_20261014.json':name='checkpoint.json'
 (folder/name).write_bytes(data);entries.append(dict(public_file=name,source_path=p,source_revision=REV,bytes=len(data),sha256=sha(data)))
with (folder/'source-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(entries[0]),lineterminator='\n');w.writeheader();w.writerows(entries)
text='# Offline NEOWISE repair: corrected quality gate fails\n\nExact source revision `'+REV+'`. Same 874 rows and six alternatives, zero new observation requests. 645 erroneous shape-only rejections removed; zero accepted extractions added. Corrected support is 0/3 against required 2/3. Native strings and every numerical threshold are unchanged. This post-read repair does not establish physical starlessness, ownership, youth or birth. The earlier unresolved-contract result remains historical.\n\n'
for e in entries:text+='- ['+e['public_file']+']('+e['public_file']+') — `'+e['source_path']+'`\n'
text+='\n[Exact source mapping and hashes](source-inventory.csv). Prior raw VO/CSV and original attempts remain in [native-quality](../native-quality/README.md). Source creation-time publication flags are historical; current deployment requires a separate receipt.\n';(folder/'README.md').write_text(text)
p=B/'_config.yml';s=p.read_text();needle='  # Native quality: exact source bytes and independently qualified unresolved result.\n';assert s.count(needle)==1
addition='  # Offline native flag repair: exact independently verified source exports.\n'
for e in entries:
 if e['public_file'].endswith(('.json','.log')):addition+='  - "'+e['public_file']+'"\n'
p.write_text(s.replace(needle,addition+needle))
p=B/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';s=p.read_text();s=s.replace('<a href="#native-quality">The native quality contract</a>','<a href="#native-quality">The original quality contract</a><a href="#flag-repair">The verified flag repair</a>')
s=s.replace('<h2 id="native-quality">The measurements arrived. Their quality verdict is still unresolved.</h2>','<h2 id="native-quality">Historical first readout: the unresolved flag contract</h2>\n\n**Historical state, before the separately approved offline repair below.** Preserve this original attempt; the current quality-gate result is now measured and failed. [Read the corrected result](#flag-repair).')
s=s.replace('The bounded unit stops here. No corrected scientific rerun or further request followed automatically.','The original bounded unit stopped here. No corrected scientific rerun or further request followed automatically; the later offline repair received a separate explicit human instruction.')
section='''<h2 id="flag-repair">The flag repair worked. The quality gate still fails.</h2>

The approved offline repair reads the W2 grade from the same 874 downloaded rows. Two-character W1/W2 values and four-character W1/W2XX values expose the same active slots; raw strings stay unchanged. No missing bands were imputed, no new observations requested, and no numerical cut relaxed.

**645 rows lose an erroneous flag-shape rejection. Zero rows become accepted.** A separate checker recomputes all identities, geometry, quality cuts and epochs; a raw-VO delta audit confirms every field except that single rejection and its resulting boolean is unchanged.

<div class="sb-result sb-result--negative"><strong>Corrected quality/cadence gate: failed, 0/3 versus required 2/3.</strong> The contract ambiguity is repaired for this packet. Other quality cuts still reject every matched extraction. This does not establish an absence of protostars, physical membership, youth or stellar birth.</div>

| Fixed clump | Unique rows at best point | Corrected accepted rows | Supported epochs |
|---|---:|---:|---:|
| G330.8814−0.3656 | 307 | 0 | 0 |
| G351.2258+0.6937 | 75 | 0 | 0 |
| G353.4272−0.3734 | 68 | 0 | 0 |

The first and third best points fail the declared reduced profile-fit criterion in 307/307 and 68/68 matched rows. The second fails SNR in 61/75, profile fit in 24/75, image quality in 45/75 and the now correctly read W2 grade in 60/75. Counts overlap; they are not independent failure probabilities. All six alternatives remain separate, including the red third point with zero unique matched rows.

This is a **post-read repair on consumed cases**, not fresh physical validation. Fifty valid synthetic encodings, fourteen malformed/null encodings and nine unchanged quality-boundary controls passed before execution. Independent Decimal/vector and exact old/new checks agree. The parser correction succeeds; the measurement route under the fixed criteria fails. The earlier unresolved readout remains visible as history above.

The repair used cached data only and about 4.3 seconds of guarded work, with at least 48.34 GiB free. Short-lived workers make RSS sampling incomplete; we do not claim those samples bound the true peak. The initial sandbox process-priority refusal occurred before the synthetic worker started and is preserved. No model or physical truth changed. All earlier ranking, colour, control and radio/gas limits remain; no star or birth is confirmed.

Read [the corrected result](/public/data/starbirth/flag-repair/results.md), [the checked conclusion](/public/data/starbirth/flag-repair/checkpoint.json), and [all corrected rows, independent checks, exact delta, protocol, code and hashes](/public/data/starbirth/flag-repair/README.md). Source revision: `'''+REV+'''`.

'''
needle='<h2 id="unknowns">';assert s.count(needle)==1;s=s.replace(needle,section+needle);p.write_text(s)
p=B/'_posts/2026-10-11-hidden-protostars-research-program.md';s=p.read_text();i=s.index('**14 October update:**');j=s.index('\n',i)
s=s[:i]+'''**14 October corrected update:** the approved offline NEOWISE flag repair removes 645 shape-only rejections from the same 874 rows, but adds **zero accepted measurements**. Independent recomputation now establishes a failed **0/3 quality/cadence gate**, below required 2/3. All numerical cuts and raw strings are unchanged; no new observations or physical birth are claimed. [Read the corrected result and retained original attempt](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#flag-repair).'''+s[j:];p.write_text(s)
p=B/'_data/series.yml';s=p.read_text();i=s.index('- id: hidden-protostars');head,tail=s[:i],s[i:];lines=tail.splitlines();lines=[('  latest_result: "Offline NEOWISE flag repair removes 645 shape-only rejections but adds zero accepted rows. Corrected quality/cadence support 0/3 versus required 2/3; physical stage remains unknown."' if line.startswith('  latest_result:') else line) for line in lines];p.write_text(head+'\n'.join(lines)+'\n')
print(json.dumps({'exact_exports':len(entries),'packet_bytes':sum(p.stat().st_size for p in folder.iterdir()),'source_revision':REV}))
