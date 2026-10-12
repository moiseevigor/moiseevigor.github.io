"""Frozen cache-only query/anchor temporal missingness diagnostic; no emitter inference."""
import argparse
from collections import Counter, defaultdict
import csv,gzip,hashlib,io,json,math,statistics,struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/temporal_missingness_schema_amendment_20261012.json'
FIELDS=('mjd','ra','dec','w2mpro','w2sigmpro')
OUTCOMES=('not_requested','requested_no_rows','no_screened_in_query','query_cadence_insufficient','query_supported_anchor_missing','query_supported_anchor_cadence_insufficient','anchored_supported')

def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024**2),b''):h.update(b)
 return h.hexdigest()
def read(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:yield from csv.DictReader(f)
def num(x):
 try:v=float(x);return v if math.isfinite(v) else None
 except (TypeError,ValueError):return None
def pos(a,b):
 a,b=num(a),num(b);return a is not None and b is not None and 0<=a<360 and -90<=b<=90
def sep(a,b,c,d):
 a,b,c,d=map(math.radians,map(float,(a,b,c,d)))
 h=math.sin((d-b)/2)**2+math.cos(b)*math.cos(d)*math.sin((c-a)/2)**2
 return math.degrees(2*math.asin(math.sqrt(min(1,max(0,h)))))*3600
def screen(r):
 checks=[pos(r['ra'],r['dec']),num(r['mjd']) is not None,num(r['w2mpro']) is not None,
 num(r['w2sigmpro']) is not None and float(r['w2sigmpro'])>0,num(r['w2snr']) is not None and float(r['w2snr'])>=5,
 num(r['qual_frame']) is not None and float(r['qual_frame'])>0,num(r['nb'])==1,len(r['cc_flags'])==4 and r['cc_flags'][1]=='0']
 return all(checks)
def add(buffer,r):
 key='\x1f'.join(r[k] for k in FIELDS).encode()
 assert len(key)<65536 and all('\x1f' not in r[k] for k in FIELDS)
 buffer.extend(struct.pack('<H',len(key)));buffer.extend(key)
def cadence(buffer):
 unique=set();off=0
 while off<len(buffer):
  n=struct.unpack_from('<H',buffer,off)[0];off+=2;unique.add(bytes(buffer[off:off+n]));off+=n
 times=sorted(float(k.split(b'\x1f',1)[0]) for k in unique);bins=[]
 for t in times:
  if not bins or t-bins[-1][-1]>30:bins.append([])
  bins[-1].append(t)
 span=times[-1]-times[0] if times else 0.0;good=sum(len(b)>=5 for b in bins)
 return dict(unique_rows=len(times),visit_count=len(bins),supported_visit_count=good,span_days=span,support=int(good>=3 and span>=365))
def write(p,fields,records):
 with p.open('xb') as raw:
  with gzip.GzipFile(filename='',fileobj=raw,mode='wb',mtime=0) as z:
   with io.TextIOWrapper(z,encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(records)
def save(p,obj):
 with p.open('x') as f:json.dump(obj,f,indent=2);f.write('\n')
def classify(r):
 if not r['requested']:return OUTCOMES[0]
 if not r['raw_rows']:return OUTCOMES[1]
 if not r['query_rows']:return OUTCOMES[2]
 if not r['query_support']:return OUTCOMES[3]
 if not r['anchor_valid']:return OUTCOMES[4]
 if not r['anchored_support']:return OUTCOMES[5]
 return OUTCOMES[6]
def tables(records):
 states=('positive','negative','unknown');summary={}
 for state in states:
  group=[r for r in records if r['proxy_group']==state]
  summary[state]=dict(count=len(group),query_support=sum(r['query_support'] for r in group),anchored_support=sum(r['anchored_support'] for r in group),outcomes=dict(sorted(Counter(r['outcome'] for r in group).items())))
 medians={};strata={}
 for k in ('mass','temp','dist','surf_dens','diam'):
  valid=[num(r[k]) for r in records if num(r[k]) is not None and (k=='temp' or float(r[k])>0)]
  medians[k]=statistics.median(valid);counts={}
  for r in records:
   v=num(r[k]);level='unknown' if v is None or (k!='temp' and v<=0) else 'low' if v<=medians[k] else 'high'
   key=level+'/'+r['proxy_group'];c=counts.setdefault(key,dict(count=0,query_support=0,anchored_support=0));c['count']+=1;c['query_support']+=r['query_support'];c['anchored_support']+=r['anchored_support']
  strata[k]=dict(sorted(counts.items()))
 tiles={}
 for r in records:
  key=str(int(float(r['glon'])//10))+'/'+r['proxy_group'];c=tiles.setdefault(key,dict(count=0,query_support=0,anchored_support=0));c['count']+=1;c['query_support']+=r['query_support'];c['anchored_support']+=r['anchored_support']
 return summary,medians,strata,dict(sorted(tiles.items()))
def run(stage):
 reg=json.loads(REG.read_text())
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256'],p
 parent={r['designation']:{k:r[k] for k in ('ra','dec','glon','mass','temp','dist','surf_dens','diam')} for r in read(ROOT/'cache/higal360clump.csv') if r['evol_flag']=='1' and num(r['dist']) is not None and 0<float(r['dist'])<=4}
 assert len(parent)==19328
 keep=('wise_ra','wise_dec','malt90_shared_position_30','one_record_unshared','neowise_rows','screen_rows','anchored_rows','anchored_unique_rows','visit_count','supported_visit_count','span_days','temporal_support','duplicate_anchored_tuples')
 old={r['designation']:{k:r[k] for k in keep} for r in read(ROOT/'artifacts/multisurvey_association_compact_20261012/sources.csv.gz')}
 rawstates={r['designation']:r['proxy_state'] for r in read(ROOT/'artifacts/multisurvey_missing_view_20261012/sources.csv.gz')}
 labels={n:{'qualifying_positive':'positive','qualifying_proxy_negative':'negative','unknown':'unknown'}[v] for n,v in rawstates.items()}
 assert set(parent)==set(old)==set(labels) and Counter(labels.values())==Counter(positive=27,negative=235,unknown=19066)
 anchors={}
 for r in read(ROOT/'artifacts/e12b/allwise_features.csv.gz'):
  n=r['designation']
  if n in parent and pos(r['a_ra'],r['a_dec']) and sep(parent[n]['ra'],parent[n]['dec'],r['a_ra'],r['a_dec'])<=3:anchors[n]=(r['a_ra'],r['a_dec'])
 targets=list(read(ROOT/'artifacts/e1_full/pilot_targets.csv'));assert len(targets)==19219 and len({r['designation'] for r in targets})==19219
 for t in targets:
  assert t['designation'] in parent and all(abs(float(t[k])-float(parent[t['designation']][k]))<=1e-6 for k in ('ra','dec'))
 counts=defaultdict(Counter);buffers=defaultdict(bytearray);hashes={};evidence=[]
 for n in parent:hashes[n]={k:hashlib.sha256() for k in ('raw','query','anchored')}
 total=0
 for ordinal,r in enumerate(read(ROOT/'artifacts/e1_full/neowise_rows_on.csv'),1):
  total+=1;i=int(r['tid']);assert str(i)==r['tid'] and 0<=i<len(targets)
  t=targets[i];n=t['designation'];assert all(num(r[k]) is not None and abs(float(r[k])-float(t[q]))<=1e-6 for k,q in (('t_ra','ra'),('t_dec','dec')))
  c=counts[n];c['raw_rows']+=1;token=f'{ordinal}\n'.encode();hashes[n]['raw'].update(token)
  valid=pos(r['ra'],r['dec']);d=sep(t['ra'],t['dec'],r['ra'],r['dec']) if valid else None
  inside=valid and d<=6;good=screen(r);anchored=good and n in anchors and sep(*anchors[n],r['ra'],r['dec'])<=2;query=good and inside
  c['invalid_position_rows']+=int(not valid);c['outside_cone_rows']+=int(valid and not inside);c['screen_rows']+=int(good)
  for path,flag in (('query',query),('anchored',anchored)):
   if flag:c[path+'_rows']+=1;add(buffers[(n,path)],r);hashes[n][path].update(token)
  if labels[n]=='positive':evidence.append(dict(designation=n,source_row=ordinal,**r,screen_pass=int(good),inside_query=int(inside),query_pass=int(query),anchored_pass=int(anchored),query_separation_arcsec=d if d is not None else ''))
 assert total==1250385
 records=[]
 requested={t['designation'] for t in targets}
 for n in sorted(parent):
  c=counts[n];prior=old[n]
  rec=dict(designation=n,**parent[n],proxy_state=rawstates[n],proxy_group=labels[n],requested=int(n in requested),anchor_valid=int(n in anchors),wise_ra=prior['wise_ra'],wise_dec=prior['wise_dec'],malt90_shared_position_30=prior['malt90_shared_position_30'],one_record_unshared=prior['one_record_unshared'])
  for k in ('raw_rows','screen_rows','invalid_position_rows','outside_cone_rows','query_rows','anchored_rows'):rec[k]=c[k]
  for path in ('query','anchored'):
   v=cadence(buffers.pop((n,path),bytearray()));rec.update({path+'_'+k:value for k,value in v.items()});rec[path+'_duplicate_rows']=c[path+'_rows']-v['unique_rows']
  for k in ('raw','query','anchored'):rec[k+'_membership_sha256']=hashes[n][k].hexdigest()
  assert rec['raw_rows']==int(prior['neowise_rows']) and rec['screen_rows']==int(prior['screen_rows'])
  for k,p in [('anchored_rows','anchored_rows'),('anchored_unique_rows','anchored_unique_rows'),('anchored_visit_count','visit_count'),('anchored_supported_visit_count','supported_visit_count'),('anchored_span_days','span_days'),('anchored_support','temporal_support'),('anchored_duplicate_rows','duplicate_anchored_tuples')]:assert float(rec[k])==float(prior[p]),(n,k)
  assert not rec['anchored_support'] or rec['query_support']
  rec['outcome']=classify(rec);rec['emitter_identity']='unestablished';rec['full_reliability']='unverified';rec['physical_truth']='unestablished';records.append(rec)
 groups,medians,strata,tiles=tables(records);p=groups['positive'];assert p['anchored_support']==0
 primary=p['query_support'];summary=dict(schema='temporal-missingness-diagnosis/1',post_read_consumed_proxy_diagnosis=True,parent=19328,raw_input_rows=total,proxy_groups=groups,primary_count=primary,primary_denominator=27,majority_gate=14,majority_gate_passed=primary>=14,status='query_cadence_present_anchor_path_excludes_majority' if primary>=14 else 'query_support_below_majority',parent_medians=medians,covariate_support_tables=strata,longitude_support_tables=tiles,positive_raw_evidence_rows=len(evidence),model_rerun=False,original_comparison_changed=False,emitter_association_established=False,full_reliability_verified=False,physical_validation=False,new_stars=0,new_births=0,occurrence_measured=False)
 write(stage/'sources.csv.gz',list(records[0]),records)
 fields=['designation','source_row']+list(next(read(ROOT/'artifacts/e1_full/neowise_rows_on.csv')))+['screen_pass','inside_query','query_pass','anchored_pass','query_separation_arcsec']
 write(stage/'positive_raw_evidence.csv.gz',fields,evidence)
 save(stage/'summary.json',summary);outputs={p.name:dict(bytes=p.stat().st_size,sha256=sha(p)) for p in stage.iterdir() if p.name in ('sources.csv.gz','positive_raw_evidence.csv.gz','summary.json')}
 save(stage/'checkpoint.json',dict(registration_sha256=sha(REG),outputs=outputs,independent_verification_pending=True));print(json.dumps(summary,indent=2),flush=True)
def test():
 r=dict(mjd='57000',ra='0',dec='0',w2mpro='12',w2sigmpro='0.1',w2snr='5',qual_frame='1',nb='1',cc_flags='0000')
 assert screen(r) and not screen(r|{'cc_flags':'0D00'}) and not screen(r|{'nb':'2'})
 b=bytearray()
 for t in [57000+j*180+i for j in range(3) for i in range(5)]:add(b,r|{'mjd':str(t)})
 assert cadence(b)['support']==0
 add(b,r|{'mjd':'57365'});assert cadence(b)['support']==1
 add(b,r|{'mjd':'57365'});assert cadence(b)['unique_rows']==16
 assert abs(sep(0,0,6/3600,0)-6)<1e-10
 assert sep(359.9999,0,.0001,0)<1
 print('Synthetic screen, exact dedup, span and geometry checks passed')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:test()
 else:assert a.stage and a.stage.is_dir();run(a.stage)
