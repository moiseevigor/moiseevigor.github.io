"""Independent four-shard replay; no generator imports or scientific fits."""
import argparse,csv,gzip,hashlib,json,math,statistics,subprocess
from collections import Counter,defaultdict
from itertools import groupby
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/temporal_missingness_registration_20261012.json'
STAGE=ROOT/'artifacts/temporal_missingness_20261012'

def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  while chunk:=f.read(2**20):h.update(chunk)
 return h.hexdigest()
def rows(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:yield from csv.DictReader(f)
def finite(x):
 try:v=float(x)
 except (TypeError,ValueError):return None
 return v if math.isfinite(v) else None
def valid(a,b):
 return finite(a) is not None and finite(b) is not None and 0<=float(a)<360 and -90<=float(b)<=90
def angle(a,b,c,d):
 def unit(x,y):
  x,y=float(x)*math.pi/180,float(y)*math.pi/180
  return math.cos(y)*math.cos(x),math.cos(y)*math.sin(x),math.sin(y)
 u,v=unit(a,b),unit(c,d);cross=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
 return math.atan2(math.sqrt(sum(x*x for x in cross)),sum(x*y for x,y in zip(u,v)))*180/math.pi*3600
def accepted(r):
 if not valid(r['ra'],r['dec']):return False
 for k in ('mjd','w2mpro','w2sigmpro','w2snr','qual_frame','nb'):
  if finite(r[k]) is None:return False
 return float(r['w2sigmpro'])>0 and float(r['w2snr'])>=5 and float(r['qual_frame'])>0 and float(r['nb'])==1 and len(r['cc_flags'])==4 and r['cc_flags'][1]=='0'
def epochs(keys):
 dates=sorted(float(k[0]) for k in keys)
 boundaries=[0]+[i for i in range(1,len(dates)) if dates[i]-dates[i-1]>30]+([len(dates)] if dates else [])
 sizes=[b-a for a,b in zip(boundaries,boundaries[1:])];span=dates[-1]-dates[0] if dates else 0.0;supported=sum(s>=5 for s in sizes)
 return dict(unique_rows=len(dates),visit_count=len(sizes),supported_visit_count=supported,span_days=span,support=int(supported>=3 and span>=365))
def state(r):
 if r['requested']==0:return 'not_requested'
 if r['raw_rows']==0:return 'requested_no_rows'
 if r['query_rows']==0:return 'no_screened_in_query'
 if r['query_support']==0:return 'query_cadence_insufficient'
 if r['anchor_valid']==0:return 'query_supported_anchor_missing'
 if r['anchored_support']==0:return 'query_supported_anchor_cadence_insufficient'
 return 'anchored_supported'
def verify(out):
 reg=json.loads(REG.read_text())
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and digest(p)==item['sha256'],p
 checkpoint=json.loads((STAGE/'checkpoint.json').read_text());assert checkpoint['registration_sha256']==digest(REG)
 for name,item in checkpoint['outputs'].items():
  p=STAGE/name;assert p.stat().st_size==item['bytes'] and digest(p)==item['sha256']
 parent={}
 for r in rows(ROOT/'cache/higal360clump.csv'):
  if r['evol_flag']=='1' and finite(r['dist']) is not None and 0<float(r['dist'])<=4:
   assert r['designation'] not in parent
   parent[r['designation']]={k:r[k] for k in ('ra','dec','glon','mass','temp','dist','surf_dens','diam')}
 assert len(parent)==19328
 keep=('wise_ra','wise_dec','malt90_shared_position_30','one_record_unshared','neowise_rows','screen_rows','anchored_rows','anchored_unique_rows','visit_count','supported_visit_count','span_days','temporal_support','duplicate_anchored_tuples')
 old={r['designation']:{k:r[k] for k in keep} for r in rows(ROOT/'artifacts/multisurvey_association_compact_20261012/sources.csv.gz')}
 labels={r['designation']:r['proxy_state'] for r in rows(ROOT/'artifacts/multisurvey_missing_view_20261012/sources.csv.gz')}
 assert set(old)==set(labels)==set(parent) and Counter(labels.values())==Counter(positive=27,negative=235,unknown=19066)
 anchors={}
 for r in rows(ROOT/'artifacts/e12b/allwise_features.csv.gz'):
  n=r['designation']
  if n in parent and valid(r['a_ra'],r['a_dec']) and angle(parent[n]['ra'],parent[n]['dec'],r['a_ra'],r['a_dec'])<=3:anchors[n]=(r['a_ra'],r['a_dec'])
 targets=list(rows(ROOT/'artifacts/e1_full/pilot_targets.csv'));ids={r['designation']:i for i,r in enumerate(targets)};assert len(ids)==len(targets)==19219
 for t in targets:
  assert t['designation'] in parent and all(abs(float(t[k])-float(parent[t['designation']][k]))<=1e-6 for k in ('ra','dec'))
 positive_rows={int(r['source_row']):r for r in rows(STAGE/'positive_raw_evidence.csv.gz')};seen_positive=set();metrics={};seen_sources=set()
 for shard in range(4):
  selected={n for n in parent if ids.get(n,3)%4==shard};stats=defaultdict(Counter);events=defaultdict(set);hashers={n:{p:hashlib.sha256() for p in ('raw','query','anchored')} for n in selected}
  raw_count=0
  for ordinal,r in enumerate(rows(ROOT/'artifacts/e1_full/neowise_rows_on.csv'),1):
   raw_count+=1;i=int(r['tid']);assert str(i)==r['tid'] and 0<=i<len(targets)
   if i%4!=shard:continue
   t=targets[i];n=t['designation'];assert n in selected
   assert all(finite(r[k]) is not None and abs(float(r[k])-float(t[q]))<=1e-6 for k,q in (('t_ra','ra'),('t_dec','dec')))
   c=stats[n];c['raw_rows']+=1;token=(str(ordinal)+'\n').encode();hashers[n]['raw'].update(token)
   okpos=valid(r['ra'],r['dec']);distance=angle(t['ra'],t['dec'],r['ra'],r['dec']) if okpos else None
   inside=okpos and distance<=6;quality=accepted(r);query=quality and inside;anchor=quality and n in anchors and angle(*anchors[n],r['ra'],r['dec'])<=2
   c['invalid_position_rows']+=not okpos;c['outside_cone_rows']+=okpos and not inside;c['screen_rows']+=quality
   for p,flag in (('query',query),('anchored',anchor)):
    if flag:
     c[p+'_rows']+=1;events[(n,p)].add(tuple(r[k] for k in ('mjd','ra','dec','w2mpro','w2sigmpro')));hashers[n][p].update(token)
   if labels[n]=='positive':
    saved=positive_rows[ordinal];seen_positive.add(ordinal);assert saved['designation']==n and all(saved[k]==v for k,v in r.items())
    for k,v in dict(screen_pass=quality,inside_query=inside,query_pass=query,anchored_pass=anchor).items():assert int(saved[k])==int(v)
    assert saved['query_separation_arcsec']=='' if distance is None else abs(float(saved['query_separation_arcsec'])-distance)<1e-7
  assert raw_count==1250385
  for saved in rows(STAGE/'sources.csv.gz'):
   n=saved['designation']
   if n not in selected:continue
   assert n not in seen_sources;seen_sources.add(n);c=stats[n];prior=old[n]
   expected=dict(designation=n,**parent[n],proxy_state=labels[n],requested=int(n in ids),anchor_valid=int(n in anchors),wise_ra=prior['wise_ra'],wise_dec=prior['wise_dec'],malt90_shared_position_30=prior['malt90_shared_position_30'],one_record_unshared=prior['one_record_unshared'])
   for k in ('raw_rows','screen_rows','invalid_position_rows','outside_cone_rows','query_rows','anchored_rows'):expected[k]=c[k]
   for p in ('query','anchored'):
    v=epochs(events.pop((n,p),set()));expected.update({p+'_'+k:x for k,x in v.items()});expected[p+'_duplicate_rows']=c[p+'_rows']-v['unique_rows']
   for p in ('raw','query','anchored'):expected[p+'_membership_sha256']=hashers[n][p].hexdigest()
   assert expected['raw_rows']==int(prior['neowise_rows']) and expected['screen_rows']==int(prior['screen_rows'])
   for k,q in [('anchored_rows','anchored_rows'),('anchored_unique_rows','anchored_unique_rows'),('anchored_visit_count','visit_count'),('anchored_supported_visit_count','supported_visit_count'),('anchored_span_days','span_days'),('anchored_support','temporal_support'),('anchored_duplicate_rows','duplicate_anchored_tuples')]:assert float(expected[k])==float(prior[q])
   assert not expected['anchored_support'] or expected['query_support']
   expected.update(outcome=state(expected),emitter_identity='unestablished',full_reliability='unverified',physical_truth='unestablished')
   assert set(expected)==set(saved),(n,set(expected)^set(saved))
   for k,v in expected.items():
    if isinstance(v,(int,float)):assert float(saved[k])==v,(n,k)
    else:assert saved[k]==v,(n,k)
   metrics[n]={k:expected[k] for k in ('proxy_state','query_support','anchored_support','outcome')}
  print(f'Independent shard {shard} passed',flush=True)
 assert seen_sources==set(parent) and seen_positive==set(positive_rows)
 summary=json.loads((STAGE/'summary.json').read_text());groups={}
 for label in ('positive','negative','unknown'):
  sample=[r for r in metrics.values() if r['proxy_state']==label]
  groups[label]=dict(count=len(sample),query_support=sum(r['query_support'] for r in sample),anchored_support=sum(r['anchored_support'] for r in sample),outcomes=dict(sorted(Counter(r['outcome'] for r in sample).items())))
 assert summary['proxy_groups']==groups
 medians={};strata={};tiles={}
 for k in ('mass','temp','dist','surf_dens','diam'):
  usable=[finite(r[k]) for r in parent.values() if finite(r[k]) is not None and (k=='temp' or float(r[k])>0)]
  medians[k]=statistics.median(usable);table={}
  for n,r in parent.items():
   v=finite(r[k]);level='unknown' if v is None or (k!='temp' and v<=0) else 'low' if v<=medians[k] else 'high';m=metrics[n];key=level+'/'+m['proxy_state'];x=table.setdefault(key,dict(count=0,query_support=0,anchored_support=0));x['count']+=1;x['query_support']+=m['query_support'];x['anchored_support']+=m['anchored_support']
  strata[k]=table
 for n,r in parent.items():
  m=metrics[n];key=str(int(float(r['glon'])//10))+'/'+m['proxy_state'];x=tiles.setdefault(key,dict(count=0,query_support=0,anchored_support=0));x['count']+=1;x['query_support']+=m['query_support'];x['anchored_support']+=m['anchored_support']
 assert summary['parent_medians']==medians and summary['covariate_support_tables']==strata and summary['longitude_support_tables']==tiles
 primary=groups['positive']['query_support'];assert groups['positive']['anchored_support']==0 and summary['primary_count']==primary and summary['primary_denominator']==27 and summary['majority_gate']==14 and summary['majority_gate_passed']==(primary>=14)
 assert summary['status']==('query_cadence_present_anchor_path_excludes_majority' if primary>=14 else 'query_support_below_majority')
 assert summary['parent']==19328 and summary['raw_input_rows']==1250385 and summary['positive_raw_evidence_rows']==len(positive_rows)
 for k in ('model_rerun','original_comparison_changed','emitter_association_established','full_reliability_verified','physical_validation','occurrence_measured'):assert summary[k] is False
 assert summary['new_stars']==summary['new_births']==0 and summary['post_read_consumed_proxy_diagnosis'] is True
 receipt=dict(schema='independent-temporal-missingness-verification/1',verified=True,registration_sha256=digest(REG),summary_sha256=digest(STAGE/'summary.json'),requested_identities=19328,positive_raw_rows=len(positive_rows),primary_count=primary,primary_denominator=27,independent_geometry='unit-vector atan2',independent_visits='exact tuple sets and gap-index boundaries',raw_passes=4,all_fields_strata_membership_hashes_verified=True,physical_validation=False)
 out.parent.mkdir(parents=True,exist_ok=True)
 with out.open('x') as f:json.dump(receipt,f,indent=2);f.write('\n')
 print(json.dumps(receipt,indent=2))
def synthetic():
 assert abs(angle(0,0,6/3600,0)-6)<1e-10
 keys={(str(57000+j*180+i),'0','0','12','0.1') for j in range(3) for i in range(5)}
 assert epochs(keys)['support']==0
 keys.add(('57365','0','0','12','0.1'));assert epochs(keys)['support']==1
 keys.add(('57365.0','0','0','12','0.1'));assert epochs(keys)['unique_rows']==17
 print('Independent synthetic geometry, cadence and string identity checks passed')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:synthetic()
 else:assert a.output;verify(a.output)
