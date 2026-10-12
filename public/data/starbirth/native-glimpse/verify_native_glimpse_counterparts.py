"""Independent native-response, projected-position, alias and full-ledger replay."""
import argparse,csv,gzip,hashlib,json,math
from collections import Counter,defaultdict
from pathlib import Path
import numpy as np
import astropy.units as u
from astropy.coordinates import SkyCoord
ROOT=Path(__file__).resolve().parents[1];REG=ROOT/'artifacts/native_glimpse_registration_20261012.json';ACQ=ROOT/'artifacts/native_glimpse_acquisition_20261012';OUT=ROOT/'artifacts/native_glimpse_association_20261012'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024**2),b''):h.update(b)
 return h.hexdigest()
def read(p):
 with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:return list(csv.DictReader(f))
def number(x):
 try:v=float(x)
 except (ValueError,TypeError):return None
 return v if np.isfinite(v) else None
def valid(r):return number(r['ra']) is not None and number(r['dec']) is not None and 0<=float(r['ra'])<360 and -90<=float(r['dec'])<=90
def separation(a,b):return SkyCoord(float(a['ra'])*u.deg,float(a['dec'])*u.deg).separation(SkyCoord(float(b['ra'])*u.deg,float(b['dec'])*u.deg)).arcsec
def accepted(r,c):
 if not valid(r):return False
 for k in ('mjd','w2mpro','w2sigmpro','w2snr','qual_frame','nb'):
  if number(r[k]) is None:return False
 return float(r['w2sigmpro'])>0 and float(r['w2snr'])>=5 and float(r['qual_frame'])>0 and float(r['nb'])==1 and len(r['cc_flags'])==4 and r['cc_flags'][1]=='0' and separation(r,c)<=6
def quality(r):
 flags=[('position',valid(r)),('errors',all(number(r[k]) is not None and 0<float(r[k])<=1 for k in ('dra','ddec'))),('flux',all(number(r[k]) is not None and float(r[k])>0 for k in ('f4_5','df4_5'))),('snr',number(r['sn_4_5']) is not None and float(r['sn_4_5'])>=5),('detections',number(r['m4_5']) is not None and float(r['m4_5'])>=2),('close_flag',number(r['csf'])==0),('quality_flag',number(r['sqf_4_5'])==0)]
 return int(all(v for k,v in flags)),';'.join(k for k,v in flags if not v)
def compare(got,want,token):
 assert set(got)==set(want),(token,'keys',set(got)^set(want))
 for k,v in want.items():
  if isinstance(v,(int,float,np.number)):assert np.isclose(float(got[k]),v,rtol=0,atol=1e-7),(token,k,got[k],v)
  else:assert got[k]==v,(token,k)
def run(path):
 reg=json.loads(REG.read_text())
 for r in reg['inputs']:
  p=ROOT/r['path'];assert p.stat().st_size==r['bytes'] and sha(p)==r['sha256']
 acq=json.loads((ACQ/'acquisition.json').read_text());assert acq['complete'] and acq['registration_sha256']==sha(REG) and len(acq['requests'])==6
 assert acq['coordinate_uploads']==acq['retries']==0 and acq['total_response_bytes']<=6*1024**2
 checkpoint=json.loads((OUT/'checkpoint.json').read_text());assert checkpoint['registration_sha256']==sha(REG) and checkpoint['acquisition_sha256']==sha(ACQ/'acquisition.json')
 for name,b in checkpoint['outputs'].items():assert (OUT/name).stat().st_size==b['bytes'] and sha(OUT/name)==b['sha256']
 prior={r['designation']:r for r in read(ROOT/'artifacts/temporal_missingness_schema_adapted_20261012/sources.csv.gz')};measure=read(ROOT/'artifacts/temporal_missingness_schema_adapted_20261012/positive_raw_evidence.csv.gz')
 assert len(prior)==19328 and Counter(r['proxy_state'] for r in prior.values())==Counter(qualifying_positive=27,qualifying_proxy_negative=235,unknown=19066)
 published=read(OUT/'sources.csv');source_lookup={(r['case'],r['response_key'],int(r['source_row'])):r for r in published};assert len(source_lookup)==len(published)
 all_edges=read(OUT/'visit_source_edges.csv');edge_lookup={(r['case'],int(r['visit']),r['response_key'],int(r['source_row'])):r for r in all_edges};assert len(edge_lookup)==len(all_edges)
 aliases=read(OUT/'catalog_archive_aliases.csv');alias_lookup={(r['case'],int(r['catalog_row']),int(r['archive_row'])):r for r in aliases};assert len(alias_lookup)==len(aliases)
 pv=read(OUT/'visits.csv');pv_lookup={(r['case'],int(r['visit'])):r for r in pv};assert len(pv_lookup)==len(pv)
 pc=read(OUT/'cases.csv');assert len(pc)==3 and {r['case'] for r in pc}=={r['designation'] for r in reg['cases']};case_lookup={r['case']:r for r in pc}
 seen_sources=set();seen_edges=set();seen_aliases=set();seen_visits=set();outcomes=[];raw_bytes=0
 for c in reg['cases']:
  name=c['designation'];assert all(c[k]==prior[name][k] for k in ('ra','dec')) and prior[name]['proxy_state']=='qualifying_positive'
  selected=[r for r in measure if r['designation']==name]
  assert all(int(r['query_pass'])==int(accepted(r,c)) for r in selected)
  keys=sorted(set(tuple(r[k] for k in ('mjd','ra','dec','w2mpro','w2sigmpro')) for r in selected if accepted(r,c)),key=lambda k:(float(k[0]),k));times=np.array([float(k[0]) for k in keys]);starts=[0]+(np.flatnonzero(np.diff(times)>30)+1).tolist();ends=starts[1:]+[len(times)];vs=[]
  base_ra,base_dec=float(c['ra']),float(c['dec']);cos=np.cos(np.deg2rad(base_dec))
  for i,(lo,hi) in enumerate(zip(starts,ends),1):
   block=keys[lo:hi]
   if len(block)<5:continue
   x=float(np.median([(((float(k[1])-base_ra+180)%360)-180)*cos*3600 for k in block]));y=float(np.median([(float(k[2])-base_dec)*3600 for k in block]));vv=dict(case=name,visit=i,count=len(block),first_mjd=float(times[lo]),last_mjd=float(times[hi-1]),mean_mjd=float(np.mean(times[lo:hi])),ra=(base_ra+x/(cos*3600))%360,dec=base_dec+y/3600,x_arcsec=x,y_arcsec=y);vs.append(vv);token=(name,i);seen_visits.add(token);compare(pv_lookup[token],vv,token)
  V=len(vs);assert V==int(prior[name]['query_supported_visit_count']);high=(9*V+9)//10;low=(V+9)//10;span=vs[-1]['mean_mjd']-vs[0]['mean_mjd'] if vs else 0;both={}
  for plan in [r for r in reg['requests'] if r['case']==name]:
   item=next(r for r in acq['requests'] if r['key']==plan['key']);assert all(item[k]==plan[k] for k in plan) and item['status']=='complete_native_csv' and item['http_status']==200
   f=ACQ/plan['response_file'];assert f.stat().st_size==item['bytes'] and sha(f)==item['sha256'] and item['bytes']<=1024**2;raw_bytes+=item['bytes'];rs=read(f);assert len(rs)==item['rows']<1001 and len({r['cntr'] for r in rs})==len(rs) and len({r['designation'] for r in rs})==len(rs)
   records=[]
   for ordinal,r in enumerate(rs,1):
    assert set(r)==set(reg['columns']) and valid(r) and separation(r,c)<=12+1e-7;ok,why=quality(r);s=dict(case=name,release=c['release'],kind=plan['kind'],table=plan['table'],response_key=plan['key'],source_row=ordinal,**r,quality_pass=ok,quality_failures=why,clump_separation_arcsec=separation(r,c));count=0
    for v in vs:
     d=separation(r,v);flag=int(d<=2);count+=flag;token=(name,v['visit'],plan['key'],ordinal);seen_edges.add(token);compare(edge_lookup[token],dict(case=name,visit=v['visit'],response_key=plan['key'],source_row=ordinal,native_cntr=r['cntr'],native_designation=r['designation'],separation_arcsec=d,inside_2arcsec=flag),token)
    s.update(supported_visit_matches=count,high_coverage=int(count>=high),competitor_coverage=int(count>=low),physical_class='unknown');token=(name,plan['key'],ordinal);seen_sources.add(token);compare(source_lookup[token],s,token);records.append(s)
   both[plan['kind']]=records
  cats,archive=both['Catalog'],both['Archive'];pairs={}
  for cat in cats:
   for ar in archive:
    d=separation(cat,ar);inside=int(d<=.5);pairs[(cat['source_row'],ar['source_row'])]=inside;token=(name,cat['source_row'],ar['source_row']);seen_aliases.add(token);compare(alias_lookup[token],dict(case=name,catalog_row=cat['source_row'],archive_row=ar['source_row'],catalog_cntr=cat['cntr'],archive_cntr=ar['cntr'],separation_arcsec=d,inside_half_arcsec=inside),token)
  candidates=[r for r in cats if r['quality_pass'] and r['high_coverage']];chosen=None;alias=None;competitors=[];passed=False
  if V>=3 and span>=365 and len(candidates)==1:
   chosen=candidates[0];matches=[r for r in archive if pairs[(chosen['source_row'],r['source_row'])]]
   if len(matches)==1 and sum(pairs[(r['source_row'],matches[0]['source_row'])] for r in cats)==1:
    alias=matches[0];competitors=[r for r in archive if r['source_row']!=alias['source_row'] and r['competitor_coverage']];passed=len(competitors)==0
  outcome=dict(case=name,ra=c['ra'],dec=c['dec'],supported_visits=V,visit_mean_span_days=span,required_high_coverage=high,competitor_threshold=low,catalog_records=len(cats),archive_records=len(archive),qualifying_high_coverage_catalogs=len(candidates),selected_catalog_cntr=chosen['cntr'] if chosen else '',selected_catalog_designation=chosen['designation'] if chosen else '',reciprocal_archive_cntr=alias['cntr'] if alias else '',competitors=len(competitors),projected_support=int(passed),emitter_identity='unestablished',physical_membership='unestablished',physical_class='unknown',selection='consumed_positive_query_cadence_cases');compare(case_lookup[name],outcome,name);outcomes.append(outcome)
 assert seen_sources==set(source_lookup) and seen_edges==set(edge_lookup) and seen_aliases==set(alias_lookup) and seen_visits==set(pv_lookup) and raw_bytes==acq['total_response_bytes']
 s=json.loads((OUT/'summary.json').read_text());count=sum(r['projected_support'] for r in outcomes);assert s['selected_cases']==3 and s['projected_support_cases']==count and s['primary_gate']==1 and s['primary_gate_passed']==(count>=1)
 
 for got,want in zip(s['case_results'],outcomes):compare(got,want,'summary case')
 assert len(s['case_results'])==3
 assert s['native_records']==len(published) and s['native_response_bytes']==raw_bytes and s['status']==('scoped_projected_counterpart_support' if count else 'no_unique_isolated_projected_counterpart_demonstrated')
 assert not s['original_ranking_changed'] and not s['physical_validation'] and not s['emitter_identity_established'] and s['new_stars']==s['new_births']==0
 proof=dict(schema='independent-native-glimpse-counterpart-verification/1',verified=True,registration_sha256=sha(REG),acquisition_sha256=sha(ACQ/'acquisition.json'),summary_sha256=sha(OUT/'summary.json'),selected_cases=3,projected_support_cases=count,native_records=len(published),visit_source_edges=len(all_edges),catalog_archive_pairs=len(aliases),all_ids_rows_fields_pairs_verified=True,geometry='Astropy angular separation',physical_validation=False)
 with path.open('x') as f:json.dump(proof,f,indent=2);f.write('\n')
 print(json.dumps(proof,indent=2))
def test():
 assert abs(separation(dict(ra=0,dec=0),dict(ra=2/3600,dec=0))-2)<1e-10
 assert (9*21+9)//10==19 and (21+9)//10==3
 print('Independent geometry and integer coverage rounding passed')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:test()
 else:run(a.output)
