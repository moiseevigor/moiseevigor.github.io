"""Exact cohort exports, unknown preservation, and program-only placement."""
from pathlib import Path
import sys,csv,gzip,hashlib,json
S=Path(sys.argv[1]);D=S/'public/data/starbirth/validation-cohort'
for r in csv.DictReader((D/'source-inventory.csv').open()):
 b=(D/r['public_file']).read_bytes();assert len(b)==int(r['bytes']) and hashlib.sha256(b).hexdigest()==r['sha256']
summary=json.loads((D/'summary.json').read_text());assert summary['counts']['parent']==19328 and summary['counts']['prospective_frame_members']==14980 and summary['sampled_groups']==223 and summary['certified_validation_eligible']==0
with gzip.open(D/'population.csv.gz','rt') as f: parents=list(csv.DictReader(f))
with gzip.open(D/'review-cohort.csv.gz','rt') as f: queue=list(csv.DictReader(f))
assert len(parents)==len({r['designation'] for r in parents})==19328 and queue==[r for r in parents if r['review_sample']=='1'] and len(queue)==223
assert all(r['independent_truth']=='unknown' and r['certified_validation_eligible']=='0' for r in parents)
assert all(r['molecular_ownership']=='none_retained' for r in queue)
assert sum(r['model_temporal_support']=='1' for r in queue)==103 and sum(r['wise_anchor_present']=='1' for r in queue)==105 and sum(r['fir_value_error_support']=='1' for r in queue)==168
page=(S/'astrophysics/2026/10/14/hidden-protostars-ablation/index.html').read_text()
for text in ['id="validation-cohort"','223-clump','14,980','zero has independently certified physical truth','30 of 13,603','exposure-footprint completeness remains unverified']:assert text in page,text
program=(S/'astrophysics/2026/10/11/hidden-protostars-research-program/index.html').read_text();assert '#validation-cohort' in program
home=(S/'index.html').read_text();assert 'Independent evidence: a cohort with explicit limits' not in home
print('Verified exact cohort exports, all unknown labels, review allocation and program placement')
