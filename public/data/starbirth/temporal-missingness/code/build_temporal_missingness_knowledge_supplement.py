"""Additive typed graph supplement from an inspected diagnostic Git revision."""
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--revision',required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
def blob(path):return subprocess.check_output(['git','show',args.revision+':'+path],cwd=ROOT)
paths=['docs/TEMPORAL_MISSINGNESS_PROTOCOL_20261012.md','docs/TEMPORAL_MISSINGNESS_SCHEMA_AMENDMENT_20261012.md','docs/TEMPORAL_MISSINGNESS_RESULTS_20261012.md','artifacts/temporal_missingness_schema_amendment_20261012.json','artifacts/temporal_missingness_schema_adapted_20261012/summary.json','artifacts/temporal_missingness_verification_schema_adapted_20261012/verification.json','artifacts/temporal_missingness_checkpoint_20261012.json','artifacts/graph/research_graph.json','artifacts/graph/multisurvey_reviewed_supplement_20261012.json']
inputs={name:blob(name) for name in paths};summary=json.loads(inputs[paths[4]]);check=json.loads(inputs[paths[5]]);final=json.loads(inputs[paths[6]])
assert check['verified'] and final['verified'] and check['summary_sha256']==hashlib.sha256(inputs[paths[4]]).hexdigest()
assert summary['primary_count']==3 and summary['primary_denominator']==27 and summary['majority_gate_passed'] is False
prior=json.loads(inputs[paths[8]]);assert hashlib.sha256(inputs[paths[7]]).hexdigest()==prior['core_graph_unchanged']['sha256']
prior_ids={n['id'] for n in prior['nodes']}
nodes=[dict(id='Q:TM20261012',type='question',status='post_read_diagnostic_completed',label='Temporal missingness: query versus anchor',text='Separately frozen after the 27 consumed positive cases were known to lack anchored temporal support. Count original-query cadence without asserting emitter identity.',sources=paths[:3]),
 dict(id='F:TM20261012:support',type='finding',status='verified_scoped_negative',label='Only 3 of 27 positives have query-level cadence',metrics=dict(positive=summary['proxy_groups']['positive'],primary_gate=14,majority_gate_passed=False,parent=19328,parent_query_support=3013,parent_anchored_support=761),text='The query-level majority gate failed: 11 positives have no cached rows, 9 no screened query rows, 4 insufficient cadence, 2 supported queries without anchors and 1 insufficient anchored cadence. Original comparison remains unchanged.',sources=[paths[2],paths[4],paths[5],paths[6]]),
 dict(id='C:TM20261012:identity',type='qualification',status='unmet_emitter_identity',label='Query cadence is not a single-source light curve',text='All three support cases remain consumed references with unresolved source identity and full reliability. No temporal feature repair, classifier benefit, physical validation or stellar birth follows.',sources=[paths[0],paths[2]]),
 dict(id='C:TM20261012:selection',type='qualification',status='verified_selection_limit',label='Positive proxies occupy high-mass/high-surface-density support',metrics=dict(parent_medians=summary['parent_medians'],positive_above_mass_median=27,positive_above_surface_density_median=27),text='All 27 positives are above parent mass and surface-density medians. Neither low-mass/low-surface-density validity nor representative independent truth is established.',sources=[paths[2],paths[4],paths[5]])]
for field in ('mass','surf_dens'):assert summary['covariate_support_tables'][field]['high/positive']['count']==27
edges=[dict(source='Q:TM20261012',target='F:TM20261012:support',relation='answered_by'),dict(source='F:TM20261012:support',target='C:MV20261012:temporal',relation='qualifies',text='Absent anchored positive overlap is not predominantly explained by the anchor alone.'),dict(source='C:TM20261012:identity',target='F:TM20261012:support',relation='limits'),dict(source='C:TM20261012:selection',target='F:TM20261012:support',relation='limits')]
ids=prior_ids|{n['id'] for n in nodes};assert all(e['source'] in ids and e['target'] in ids for e in edges)
record=dict(schema='reviewed-temporal-missingness-knowledge-supplement/1',source_revision=args.revision,post_read_consumed_proxy_diagnosis=True,core_and_prior_supplement_unchanged=True,nodes=nodes,edges=edges,source_blobs=[dict(path=k,revision=args.revision,bytes=len(v),sha256=hashlib.sha256(v).hexdigest()) for k,v in inputs.items()],physical_validation=False,new_stars=0,new_births=0)
args.output.parent.mkdir(parents=True,exist_ok=True)
with args.output.open('x') as f:json.dump(record,f,indent=2);f.write('\n')
print(json.dumps(dict(nodes=len(nodes),edges=len(edges),source_revision=args.revision)))
