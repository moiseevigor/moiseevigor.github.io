import csv,hashlib,json,shutil,subprocess
from pathlib import Path
B=Path('/Users/igor/Work/me/moiseevigor.github.io');R=Path('/Users/igor/Work/me/starbirth-search')
REV='70c33bcc9017f994e1a51c2dfe8d150ef7614650'
def blob(path):return subprocess.check_output(['git','show',REV+':'+path],cwd=R)
def sha(data):return hashlib.sha256(data).hexdigest()
assert shutil.disk_usage(B).free>5*1024**3
c=json.loads(blob('artifacts/native_mmb_position_checkpoint_20261013.json'))
assert c['independent_verification_passed'] and c['unit_complete'] and not c['physical_validation']
assert c['fixed_best_projected_support']==0 and c['fixed_best_denominator']==3
assert c['all_infrared_alternatives_within_1_arcsec']==0 and c['infrared_alternative_denominator']==6
folder=B/'public/data/starbirth/radio-context';folder.mkdir(exist_ok=True)
entries=[]
for item in c['evidence']+[{'path':c['report_path']},{'path':'artifacts/native_mmb_position_checkpoint_20261013.json'}]:
 path=item['path'];data=blob(path);assert data==(R/path).read_bytes(),path
 if 'sha256' in item:assert sha(data)==item['sha256'] and len(data)==item['bytes']
 parts=Path(path).parts;name=parts[-1]
 if name=='NATIVE_MMB_POSITION_RESULTS_20261013.md':name='results.md'
 elif name=='NATIVE_MMB_POSITION_PROTOCOL_20261013.md':name='protocol.md'
 elif name=='native_mmb_position_checkpoint_20261013.json':name='starbirth-mmb-checkpoint.json'
 elif name=='native_mmb_position_registration_20261013.json':name='starbirth-mmb-registration.json'
 elif name=='native_glimpse_registration_20261012.json':name='starbirth-mmb-original-glimpse-registration.json'
 elif 'artifacts' in parts and name not in ['radio_records.json.gz','catalog.dat']:
  stage=parts[-2].removeprefix('native_mmb_position_').removesuffix('_20261013')
  name='starbirth-mmb-'+stage+'-'+name
 if (folder/name).exists():assert (folder/name).read_bytes()==data,name
 else:(folder/name).write_bytes(data)
 entries.append(dict(public_file=name,source_path=path,source_revision=REV,bytes=len(data),sha256=sha(data)))
with (folder/'source-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(entries[0]),lineterminator='\n');w.writeheader();w.writerows(entries)
readme='''# Native radio-marker context: projected separation, not physical classification

Exact exports from research revision `'''+REV+'''`.
The separately registered research compared original native MMB coordinates with three
fixed Hi-GAL cases and all six retained infrared Catalog alternatives. Independent
recomputation checked 707 native rows and 6,363 angular pairs. The frozen one-arcsecond
criterion failed: 0/3 fixed best points and 0/6 alternatives have a catalogue marker
within that scale. A historical marker is 12.520 arcsec from the first clump centre
and 17.501 arcsec from its best infrared record. Membership and physical stage are
unknown; this is not evidence of starlessness, a new star or a birth.

The earlier 12-arcsecond infrared cone's coverage qualification is post-read context,
not a changed primary criterion. All previous failed gates and source alternatives
are preserved. Creation-time unpublished flags in source exports remain historical;
blog deployment is verified separately. The historical catalogue is not all modern
masers. It gives no source error/epoch contract for calibrated match probabilities.

The compact public packet contains original catalogue bytes, parsed native fields,
readout, independent verification, resource receipts, frozen code and authoring
controls. Original paths in downloaded research reports refer to the research repo;
use the mapping below and source inventory for these public downloads. This upkeep
ran no research or acquisition. No source was substituted and no model changed.

## Complete downloads

'''
for i in entries:readme+='- ['+i['public_file']+']('+i['public_file']+') — `'+i['source_path']+'`\n'
readme+='\n[Complete source inventory and SHA-256 hashes](source-inventory.csv).\n'
(folder/'README.md').write_text(readme)
assert sum(p.stat().st_size for p in folder.iterdir())<1024**2
config=B/'_config.yml';s=config.read_text()
addition='  # Verified native radio context: exact JSON/log basename exceptions.\n'
for i in entries:
 if i['public_file'].endswith(('.json','.log')):addition+='  - "'+i['public_file']+'"\n'
needle='  - "starbirth-ic-alternative-knowledge-note.json"\n'
assert s.count(needle)==1 and 'starbirth-mmb-checkpoint.json' not in s
s=s.replace(needle,needle+addition);config.write_text(s)
article=B/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';s=article.read_text();assert 'id="radio-context"' not in s
s=s.replace('<a href="#unknowns">The unknown denominator</a>','<a href="#radio-context">Nearby radio activity</a><a href="#unknowns">The unknown denominator</a>')
section='''<h2 id="radio-context">Nearby radio activity belongs to a different position</h2>

**Native-position check · 13 October 2026.** A historical radio maser record, **330.878-0.367**, lies **12.520 arcseconds** from the first dust-clump centre. But it is **17.501 arcseconds** from the best infrared counterpart, `SSTGLMC G330.8829-00.3661`. A region can contain a useful radio marker without that marker supporting the infrared point selected by a clump-level rank.

The separately frozen comparison used original equatorial positions for **707** historical MMB catalogue records, the same three consumed cases and **all six** retained infrared Catalog alternatives. **0 / 3** fixed best points meet the declared one-arcsecond radio criterion; **0 / 6** alternatives have any catalogue maser position within that radius. The criterion required at least one of the three best points. It failed.

<div class="sb-ledger" role="region" aria-label="Native radio-marker separations for the three fixed counterpart cases" tabindex="0" markdown="1">

| Fixed best infrared record | Nearest catalogue maser | Point-to-maser separation |
|:--|:--|--:|
| `SSTGLMC G330.8829-00.3661` | `330.878-0.367` | **17.501″** |
| `SSTGLMC G351.2258+00.6940` | `351.242+0.670` | **104.881″** |
| `SSTGLMC G353.4273-00.3723` | `353.410-0.360` | **76.937″** |

</div>

The separate red alternative `SSTGLMC G353.4284-00.3731` is **81.837 arcseconds** from its nearest catalogue maser. It remains distinct from the blue temporal counterpart. **No close radio association is established, and absence of one does not establish starlessness.** This historical snapshot is not a complete census of modern masers. Positional agreement alone would not establish emitter ownership, clump membership, stellar stage or birth. Neither the nearby marker nor the infrared record is a new discovery.

There is also a coverage limit: the first radio position falls just outside the earlier **12-arcsecond infrared query** centred on the clump. A counterpart outside that cone was not tested by the earlier selection. This is **post-read coverage context**, not a relaxed match radius or a substitute candidate. The 15/30-arcsecond context circles are not physical clump boundaries. No new infrared counterpart was acquired or assigned the existing time series.

Independent recomputation verified **all 707 records and 6,363 angular pairs**, preserving literal coordinates, names, native flags and every alternative. It verifies the software geometry, not physical association probabilities. The frozen selection and historical MMB references are consumed evidence; no fresh representative physical validation was supplied. All earlier ranking, colour, cadence and uncertainty gates stay unchanged.

Download [the verified source assessment](/public/data/starbirth/radio-context/results.md), [every nearest match and contextual pair](/public/data/starbirth/radio-context/starbirth-mmb-analysis-summary.json), [all native radio records](/public/data/starbirth/radio-context/radio_records.json.gz), [independent verification](/public/data/starbirth/radio-context/starbirth-mmb-verification-verification.json) and [frozen protocol, original catalogue, code and complete hashes](/public/data/starbirth/radio-context/README.md). The packet binds research revision `'''+REV+'''`. **No new star, confirmed stellar birth or validated detector follows from this result.**

'''
s=s.replace('<h2 id="unknowns">',section+'<h2 id="unknowns">');article.write_text(s)
program=B/'_posts/2026-10-11-hidden-protostars-research-program.md';s=program.read_text()
paragraph='''The native radio-position check now separates regional activity from a specific infrared point: historical maser **330.878-0.367** is **12.520″** from the first clump centre but **17.501″** from its best infrared counterpart. **0/3** fixed best points and **0/6** alternatives have a catalogue maser within the frozen one-arcsecond criterion. This limits point-specific interpretation; it does not establish starlessness, clump membership or a birth. [Read the radio context and coverage limit](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#radio-context).

'''
s=s.replace('<h3 id="historical-week">',paragraph+'<h3 id="historical-week">');program.write_text(s)
series=B/'_data/series.yml';s=series.read_text();needle='No confirmed birth or validated physical detector; the earlier 333/800 occurrence gate remains failed.'
assert s.count(needle)==1
s=s.replace(needle,'Native radio positions: 0/3 fixed best points and 0/6 alternatives meet the one-arcsecond check; nearby first-field activity is separate from the infrared point. '+needle);series.write_text(s)
# Match the accepted editorial simplification, retaining scientific gates rather
# than requiring deleted operational prose or the former title's capitalization.
p=B/'research/starbirth/check_publication.py';s=p.read_text()
s=s.replace("['Hidden protostars', '19,219', '16,754', '64 MiB',\n                 'The measurement protocol is frozen', 'invented values',", "['Hidden Protostars', '19,219', '16,754', '939', '333', '800',\n                 'The primary compact-source excess remains', 'invented values',")
p.write_text(s)
print(json.dumps({'source_revision':REV,'exact_exports':len(entries),'packet_bytes':sum(p.stat().st_size for p in folder.iterdir()),'new_science_executed':False}))
