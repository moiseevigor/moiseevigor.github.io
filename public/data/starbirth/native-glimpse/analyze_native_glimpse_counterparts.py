"""Frozen native-catalogue projected-counterpart analysis; no physical source assignment."""
import argparse,csv,gzip,hashlib,io,json,math,statistics
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REG=ROOT/'artifacts/native_glimpse_registration_20261012.json';ACQ=ROOT/'artifacts/native_glimpse_acquisition_20261012'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rows(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:yield from csv.DictReader(f)
def val(x):
 try:v=float(x);return v if math.isfinite(v) else None
 except (ValueError,TypeError):return None
def position(a,b):return val(a) is not None and val(b) is not None and 0<=float(a)<360 and -90<=float(b)<=90
def distance(a,b,c,d):
 a,b,c,d=map(math.radians,map(float,(a,b,c,d)));h=math.sin((d-b)/2)**2+math.cos(b)*math.cos(d)*math.sin((c-a)/2)**2
 return math.degrees(2*math.asin(math.sqrt(min(1,max(0,h)))))*3600
def screen(r,c):
 return position(r['ra'],r['dec']) and all(val(r[k]) is not None for k in ('mjd','w2mpro','w2sigmpro','w2snr','qual_frame','nb')) and float(r['w2sigmpro'])>0 and float(r['w2snr'])>=5 and float(r['qual_frame'])>0 and float(r['nb'])==1 and len(r['cc_flags'])==4 and r['cc_flags'][1]=='0' and distance(c['ra'],c['dec'],r['ra'],r['dec'])<=6
def visits(case,measurements):
 keys=sorted({tuple(r[k] for k in ('mjd','ra','dec','w2mpro','w2sigmpro')) for r in measurements if screen(r,case)},key=lambda k:(float(k[0]),k));bins=[]
 for key in keys:
  if not bins or float(key[0])-float(bins[-1][-1][0])>30:bins.append([])
  bins[-1].append(key)
 out=[];base_ra=float(case['ra']);base_dec=float(case['dec']);cos=math.cos(math.radians(base_dec))
 for i,b in enumerate(bins,1):
  if len(b)<5:continue
  x=statistics.median((((float(k[1])-base_ra+180)%360)-180)*cos*3600 for k in b);y=statistics.median((float(k[2])-base_dec)*3600 for k in b)
  out.append(dict(case=case['designation'],visit=i,count=len(b),first_mjd=min(float(k[0]) for k in b),last_mjd=max(float(k[0]) for k in b),mean_mjd=statistics.mean(float(k[0]) for k in b),ra=(base_ra+x/(cos*3600))%360,dec=base_dec+y/3600,x_arcsec=x,y_arcsec=y))
 return out
def qualify(r):
 checks=dict(position=position(r['ra'],r['dec']),errors=all(val(r[k]) is not None and 0<float(r[k])<=1 for k in ('dra','ddec')),flux=all(val(r[k]) is not None and float(r[k])>0 for k in ('f4_5','df4_5')),snr=val(r['sn_4_5']) is not None and float(r['sn_4_5'])>=5,detections=val(r['m4_5']) is not None and float(r['m4_5'])>=2,close_flag=val(r['csf'])==0,quality_flag=val(r['sqf_4_5'])==0)
 return int(all(checks.values())),';'.join(k for k,v in checks.items() if not v)
def write(p,records,fields=None):
 fields=fields or list(records[0])
 with p.open('x',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows(records)
def save(p,obj):
 with p.open('x') as f:json.dump(obj,f,indent=2);f.write('\n')
def run(stage):
 reg=json.loads(REG.read_text())
 for r in reg['inputs']:
  p=ROOT/r['path'];assert p.stat().st_size==r['bytes'] and sha(p)==r['sha256'],p
 acq=json.loads((ACQ/'acquisition.json').read_text());assert acq['complete'] and acq['registration_sha256']==sha(REG)
 assert acq['coordinate_uploads']==acq['retries']==0
 measurements=list(rows(ROOT/'artifacts/temporal_missingness_schema_adapted_20261012/positive_raw_evidence.csv.gz'))
 ledgers={r['designation']:r for r in rows(ROOT/'artifacts/temporal_missingness_schema_adapted_20261012/sources.csv.gz')}
 sources=[];all_visits=[];edges=[];aliases=[];cases=[]
 for case in reg['cases']:
  name=case['designation'];expected=ledgers[name];assert expected['proxy_state']=='qualifying_positive' and all(case[k]==expected[k] for k in ('ra','dec'))
  for r in measurements:
   if r['designation']==name:assert int(r['query_pass'])==int(screen(r,case))
  vs=visits(case,[r for r in measurements if r['designation']==name]);all_visits+=vs;V=len(vs);assert V==int(expected['query_supported_visit_count'])
  high=math.ceil(.9*V);low=math.ceil(.1*V);span=vs[-1]['mean_mjd']-vs[0]['mean_mjd'] if vs else 0
  both={}
  for plan in [p for p in reg['requests'] if p['case']==name]:
   record=next(x for x in acq['requests'] if x['key']==plan['key']);assert all(record[k]==plan[k] for k in plan)
   p=ACQ/plan['response_file'];assert p.stat().st_size==record['bytes'] and sha(p)==record['sha256']
   rs=list(rows(p));assert len(rs)==record['rows'] and len({r['cntr'] for r in rs})==len(rs)
   records=[]
   for ordinal,r in enumerate(rs,1):
    assert set(r)==set(reg['columns']) and position(r['ra'],r['dec']) and distance(case['ra'],case['dec'],r['ra'],r['dec'])<=12+1e-7
    ok,fail=qualify(r);source=dict(case=name,release=case['release'],kind=plan['kind'],table=plan['table'],response_key=plan['key'],source_row=ordinal,**r,quality_pass=ok,quality_failures=fail,clump_separation_arcsec=distance(case['ra'],case['dec'],r['ra'],r['dec']))
    support=0
    for v in vs:
     d=distance(v['ra'],v['dec'],r['ra'],r['dec']);inside=int(d<=2);support+=inside;edges.append(dict(case=name,visit=v['visit'],response_key=plan['key'],source_row=ordinal,native_cntr=r['cntr'],native_designation=r['designation'],separation_arcsec=d,inside_2arcsec=inside))
    source['supported_visit_matches']=support;source['high_coverage']=int(support>=high);source['competitor_coverage']=int(support>=low);source['physical_class']='unknown';records.append(source);sources.append(source)
   both[plan['kind']]=records
  cs,ars=both['Catalog'],both['Archive'];catalog_to_archive=defaultdict(list);archive_to_catalog=defaultdict(list)
  for c in cs:
   for a in ars:
    d=distance(c['ra'],c['dec'],a['ra'],a['dec']);inside=int(d<=.5)
    aliases.append(dict(case=name,catalog_row=c['source_row'],archive_row=a['source_row'],catalog_cntr=c['cntr'],archive_cntr=a['cntr'],separation_arcsec=d,inside_half_arcsec=inside))
    if inside:catalog_to_archive[c['source_row']].append(a);archive_to_catalog[a['source_row']].append(c)
  candidates=[c for c in cs if c['quality_pass'] and c['high_coverage']];passcase=False;chosen=None;alias=None;competitors=[]
  if V>=3 and span>=365 and len(candidates)==1:
   chosen=candidates[0];aa=catalog_to_archive[chosen['source_row']]
   if len(aa)==1 and len(archive_to_catalog[aa[0]['source_row']])==1:
    alias=aa[0];competitors=[a for a in ars if a['source_row']!=alias['source_row'] and a['competitor_coverage']];passcase=not competitors
  cases.append(dict(case=name,ra=case['ra'],dec=case['dec'],supported_visits=V,visit_mean_span_days=span,required_high_coverage=high,competitor_threshold=low,catalog_records=len(cs),archive_records=len(ars),qualifying_high_coverage_catalogs=len(candidates),selected_catalog_cntr=chosen['cntr'] if chosen else '',selected_catalog_designation=chosen['designation'] if chosen else '',reciprocal_archive_cntr=alias['cntr'] if alias else '',competitors=len(competitors),projected_support=int(passcase),emitter_identity='unestablished',physical_membership='unestablished',physical_class='unknown',selection='consumed_positive_query_cadence_cases'))
 write(stage/'cases.csv',cases);write(stage/'sources.csv',sources,['case','release','kind','table','response_key','source_row']+reg['columns']+['quality_pass','quality_failures','clump_separation_arcsec','supported_visit_matches','high_coverage','competitor_coverage','physical_class'])
 write(stage/'visits.csv',all_visits);write(stage/'visit_source_edges.csv',edges,['case','visit','response_key','source_row','native_cntr','native_designation','separation_arcsec','inside_2arcsec']);write(stage/'catalog_archive_aliases.csv',aliases,['case','catalog_row','archive_row','catalog_cntr','archive_cntr','separation_arcsec','inside_half_arcsec'])
 count=sum(c['projected_support'] for c in cases);summary=dict(schema='native-glimpse-projected-counterpart/1',selected_cases=3,projected_support_cases=count,primary_gate=1,primary_gate_passed=count>=1,status='scoped_projected_counterpart_support' if count else 'no_unique_isolated_projected_counterpart_demonstrated',native_records=len(sources),native_response_bytes=acq['total_response_bytes'],original_ranking_changed=False,physical_validation=False,emitter_identity_established=False,new_stars=0,new_births=0,case_results=cases)
 save(stage/'summary.json',summary);files={p.name:dict(bytes=p.stat().st_size,sha256=sha(p)) for p in stage.iterdir() if p.suffix in ('.csv','.json')};save(stage/'checkpoint.json',dict(registration_sha256=sha(REG),acquisition_sha256=sha(ACQ/'acquisition.json'),outputs=files,independent_verification_pending=True));print(json.dumps(summary,indent=2),flush=True)
def test():
 r=dict(ra='1',dec='2',dra='.3',ddec='.3',f4_5='1',df4_5='.1',sn_4_5='10',m4_5='2',csf='0',sqf_4_5='0');assert qualify(r)[0] and not qualify(r|{'csf':'1'})[0]
 assert abs(distance(0,0,2/3600,0)-2)<1e-10 and distance(359.9999,0,.0001,0)<1
 assert math.ceil(.9*21)==19 and math.ceil(.1*21)==3
 print('Synthetic geometry, native quality and fixed rounding passed')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:test()
 else:assert a.stage.is_dir();run(a.stage)
