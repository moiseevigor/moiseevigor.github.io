"""Independent raw CSV, Decimal quality checks and vector-sphere geometry."""
import argparse,csv,gzip,hashlib,io,json,math,re
from collections import Counter
from decimal import Decimal,InvalidOperation
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/native_profile_quality_registration_20261013.json'
def hash_file(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def dec(row,key):
 try:
  value=Decimal(row[key]);return value if value.is_finite() else None
 except (KeyError,InvalidOperation,TypeError):return None
def separation(a,b,c,d):
 vectors=[]
 for ra,de in [(a,b),(c,d)]:
  ra,de=math.radians(ra),math.radians(de)
  vectors.append((math.cos(de)*math.cos(ra),math.cos(de)*math.sin(ra),math.sin(de)))
 u,v=vectors
 cross=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
 return math.atan2(math.sqrt(sum(x*x for x in cross)),sum(x*y for x,y in zip(u,v)))*206264.80624709636
def failures(row):
 result=set()
 for key in ['sigra','sigdec','w2sigmpro','w2flux','w2sigflux','w2fitr']:
  value=dec(row,key)
  if value is None or value<=0:result.add(key+'_missing_or_nonpositive')
 a,d,c=dec(row,'sigra'),dec(row,'sigdec'),dec(row,'sigradec')
 if c is None:result.add('positional_cosigma_missing')
 elif a is not None and d is not None and c*c>a*d+Decimal('0.000000000001'):result.add('positional_covariance_invalid')
 for key in ['w2mpro','mjd']:
  if dec(row,key) is None:result.add(key+'_missing')
 snr=dec(row,'w2snr');fit=dec(row,'w2rchi2')
 if snr is None or snr<=10:result.add('w2_snr_not_above_10')
 if fit is None or fit<=0 or fit>2:result.add('w2_profile_fit_not_in_0_to_2')
 for key,expected in {'nb':1,'na':0,'w2sat':0,'w2cc_map':0,'sso_flg':0,'qi_fact':1}.items():
  if dec(row,key)!=expected:result.add(key+'_strict_requirement')
 frame,saa=dec(row,'qual_frame'),dec(row,'saa_sep')
 if frame is None or frame<=0:result.add('frame_quality_not_positive')
 if saa is None or saa<5:result.add('saa_separation_below_5_or_missing')
 for key,required in {'cc_flags':(4,'0'),'ph_qual':(4,'A'),'moon_masked':(2,'0')}.items():
  length,value=required
  if len(row[key])!=length or row[key][1]!=value:result.add(key+'_w2_requirement')
 if row['w2frtr']!='0000':result.add('w2_transient_pixel_flag')
 return result
def supported_epochs(times):
 times=sorted(times)
 breaks=[0]+[i for i in range(1,len(times)) if times[i]-times[i-1]>30]+[len(times)]
 usable=[times[a:b] for a,b in zip(breaks,breaks[1:]) if b-a>=5]
 span=usable[-1][-1]-usable[0][0] if usable else None
 return len(usable),span
def run(acquisition,analysis,stage):
 reg=json.loads(REG.read_text());receipt=json.loads((acquisition/'acquisition.json').read_text())
 summary=json.loads((analysis/'summary.json').read_text())
 assert receipt['complete'] and receipt['registration_sha256']==summary['registration_sha256']==hash_file(REG)
 assert summary['acquisition_sha256']==hash_file(acquisition/'acquisition.json')
 assert summary['detections_sha256']==hash_file(analysis/'detections.csv.gz')
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and hash_file(p)==item['sha256']
 ledger=list(csv.DictReader(io.StringIO(gzip.decompress((analysis/'detections.csv.gz').read_bytes()).decode())))
 assert len({(r['case_id'],r['source_id']) for r in ledger})==len(ledger)
 saved={(r['case_id'],r['source_id']):r for r in ledger}
 headers=json.loads(gzip.decompress((ROOT/reg['header_ledger']).read_bytes()))['frames']
 header_map={(x['case_id'],x['scan_id'],int(x['frame_num'])):x for x in headers}
 reconstructed=[];best_count=0;count=0;max_distance_error=0.
 for case,request in zip(reg['cases'],receipt['requests']):
  assert case['id']==request['case_id']
  path=acquisition/request['response_file'];assert hash_file(path)==request['sha256'] and path.stat().st_size==request['bytes']
  reader=csv.DictReader(io.StringIO(path.read_text(encoding='utf-8-sig')));assert reader.fieldnames==reg['columns']
  native=list(reader);assert len(native)==request['rows']<5001
  links=[];exposure_counts=Counter()
  for row in native:
   count+=1;entry=saved[(case['id'],row['source_id'])]
   assert all(entry[key]==row[key] for key in reg['columns'])
   source=row['source_id'];assert len(source)==16 and source[9]=='-' and source[:5].isdigit() and source[5].islower() and source[6:9].isdigit() and source[10:].isdigit()
   assert row['scan_id']==source[:6] and int(row['frame_num'])==int(source[6:9])
   expected_counter=int(source[:5]+str(ord(source[5])-ord('a')+1).zfill(2)+source[6:9]+source[10:])
   assert int(row['cntr'])==expected_counter and row['cntr'].isdigit()
   assert entry['canonical_frame_num']==source[6:9]
   a,b=float(row['ra']),float(row['dec'])
   assert separation(a,b,float(case['ra']),float(case['dec']))<=12.001
   calculated={alt['designation']:separation(a,b,float(alt['ra']),float(alt['dec'])) for alt in case['catalogue_alternatives']}
   for name,value in calculated.items():
    error=abs(value-json.loads(entry['separations_arcsec'])[name]);assert error<0.000002;max_distance_error=max(max_distance_error,error)
   hits=[name for name,value in calculated.items() if value<=1]
   boundary=any(abs(value-1)<0.00001 for value in calculated.values())
   unique=hits[0] if len(hits)==1 and not boundary else ''
   assert json.loads(entry['matching_catalogue_ids'])==hits and entry['unique_associated_catalogue_id']==unique
   assert entry['geometric_boundary']==str(boundary)
   frame=header_map.get((case['id'],row['scan_id'],int(row['frame_num'])))
   assert entry['cached_intensity_path']==(frame['path'] if frame else '')
   if frame:
    offset=(float(row['mjd'])-float(frame['header']['MJD_OBS']))*86400
    assert abs(offset)<=60 and abs(offset-float(entry['reported_mjd_offset_seconds']))<0.00001
   else:assert entry['reported_mjd_offset_seconds']==''
   if unique:exposure_counts[(row['scan_id'],int(row['frame_num']),unique)]+=1
   links.append((row,entry,unique,failures(row)))
  for row,entry,unique,reasons in links:
   if not unique:reasons.add('no_unique_literal_catalogue_geometry')
   elif exposure_counts[(row['scan_id'],int(row['frame_num']),unique)]>1:reasons.add('multiple_compatible_extractions_in_exposure')
   assert reasons==set(json.loads(entry['quality_reasons']))
   assert entry['quality_isolated']==str(not reasons)
  alternatives=[]
  for alt in case['catalogue_alternatives']:
   matched=[x for x in links if x[2]==alt['designation']]
   good=[x for x in matched if not x[3]]
   epochs,span=supported_epochs(float(x[0]['mjd']) for x in good)
   ready=epochs>=3 and span is not None and span>=365
   best=alt['designation']==case['fixed_best_designation']
   best_count+=int(ready and best)
   alternatives.append({'designation':alt['designation'],'cntr':alt['cntr'],'fixed_best':best,
                        'unique_geometric_rows':len(matched),'strict_quality_rows':len(good),
                        'supported_epoch_groups':epochs,'supported_reported_span_days':span,
                        'conservative_pipeline_cadence_support':ready,
                        'rejection_counts':dict(Counter(reason for x in matched for reason in x[3])),
                        'physical_stage':'unknown','emitter_ownership':'unestablished'})
  reconstructed.append({'case_id':case['id'],'native_rows':len(native),
                        'image_exposure_joined_rows':sum(bool(x[1]['cached_intensity_path']) for x in links),
                        'geometry_ambiguous_or_unmatched_rows':sum(not x[2] for x in links),
                        'catalogue_alternatives':alternatives})
 assert count==len(ledger)==summary['native_rows']
 assert reconstructed==summary['cases'] and best_count==summary['fixed_best_supported']
 assert summary['primary_gate_passed']==(best_count>=2)
 result={'schema':'native-profile-quality-independent-verification/1','verified':True,
         'scope':'Native extraction identities and conservative pipeline-quality/literal-geometry diagnostic only',
         'registration_sha256':hash_file(REG),'summary_sha256':hash_file(analysis/'summary.json'),
         'detections_sha256':hash_file(analysis/'detections.csv.gz'),'native_rows_checked':count,
         'fixed_best_supported':best_count,'fixed_best_denominator':3,'primary_gate_passed':best_count>=2,
         'maximum_geometry_implementation_difference_arcsec':max_distance_error,
         'method':'Independent raw CSV and ID slicing, Decimal thresholds and vector cross-product spherical distance; no worker import',
         'physical_validation':False,'new_stars':0,'new_births':0,'full_goal_achieved':False}
 with (stage/'verification.json').open('x') as f:json.dump(result,f,indent=2);f.write('\n')
 print(json.dumps(result,indent=2),flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('acquisition',type=Path);p.add_argument('analysis',type=Path);p.add_argument('stage',type=Path)
 a=p.parse_args();run(a.acquisition,a.analysis,a.stage)
