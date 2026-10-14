"""Registered extraction-identity, geometry and conservative PSF-quality diagnostic."""
import argparse,csv,gzip,hashlib,io,json,math,re
from collections import Counter,defaultdict
from pathlib import Path
from neowise_flag_format import w2_photo_quality

ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/native_profile_quality_registration_20261013.json'

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def number(row,key):
 try:
  value=float(row[key]);return value if math.isfinite(value) else None
 except (KeyError,ValueError,TypeError):return None
def angle(a,b,c,d):
 a,b,c,d=map(math.radians,(a,b,c,d))
 h=math.sin((b-d)/2)**2+math.cos(b)*math.cos(d)*math.sin((a-c)/2)**2
 return 2*math.asin(math.sqrt(min(1,max(0,h))))*180/math.pi*3600
def groups(values):
 result=[]
 for value in sorted(values):
  if not result or value-result[-1][-1]>30:result.append([])
  result[-1].append(value)
 return result
def quality(row):
 reasons=[]
 for key in ('sigra','sigdec','w2sigmpro','w2flux','w2sigflux','w2fitr'):
  value=number(row,key)
  if value is None or value<=0:reasons.append(key+'_missing_or_nonpositive')
 sigma_a,sigma_d,cov=number(row,'sigra'),number(row,'sigdec'),number(row,'sigradec')
 if cov is None:reasons.append('positional_cosigma_missing')
 elif sigma_a is not None and sigma_d is not None and cov*cov>sigma_a*sigma_d+1e-12:reasons.append('positional_covariance_invalid')
 for key in ('w2mpro','mjd'):
  if number(row,key) is None:reasons.append(key+'_missing')
 snr=number(row,'w2snr');chi=number(row,'w2rchi2')
 if snr is None or snr<=10:reasons.append('w2_snr_not_above_10')
 if chi is None or not 0<chi<=2:reasons.append('w2_profile_fit_not_in_0_to_2')
 for key,wanted in [('nb',1),('na',0),('w2sat',0),('w2cc_map',0),('sso_flg',0),('qi_fact',1)]:
  if number(row,key)!=wanted:reasons.append(key+'_strict_requirement')
 q=number(row,'qual_frame');saa=number(row,'saa_sep')
 if q is None or q<=0:reasons.append('frame_quality_not_positive')
 if saa is None or saa<5:reasons.append('saa_separation_below_5_or_missing')
 for key,index,wanted,length in [('cc_flags',1,'0',4),('moon_masked',1,'0',2)]:
  value=row.get(key,'')
  if len(value)!=length or value[index]!=wanted:reasons.append(key+'_w2_requirement')
 if w2_photo_quality(row.get('ph_qual'))!='A':reasons.append('ph_qual_w2_requirement')
 if row.get('w2frtr')!='0000':reasons.append('w2_transient_pixel_flag')
 return reasons
def validate_identity(row):
 match=re.fullmatch(r'([0-9]{5}[a-z])([0-9]{3})-([0-9]{6})',row['source_id']);assert match
 scan,frame,src=match.groups()
 assert row['scan_id']==scan and row['frame_num'].isdigit() and int(row['frame_num'])==int(frame)
 cntr=scan[:5]+f'{ord(scan[-1])-96:02d}'+frame+src
 assert row['cntr'].isdigit() and int(row['cntr'])==int(cntr)
 return scan,frame

def run(acquisition,stage):
 reg=json.loads(REG.read_text());receipt=json.loads((acquisition/'acquisition.json').read_text())
 amendment=ROOT/'artifacts/neowise_flag_format_registration_20261014.json'
 for item in json.loads(amendment.read_text())['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256']
 assert receipt['complete'] and receipt['registration_sha256']==sha(REG)
 for item in reg['inputs']:
  path=ROOT/item['path'];assert path.stat().st_size==item['bytes'] and sha(path)==item['sha256']
 frames=json.loads(gzip.decompress((ROOT/reg['header_ledger']).read_bytes()))['frames']
 exposure={(r['case_id'],r['scan_id'],r['frame_num']):r for r in frames}
 assert len(exposure)==len(frames)
 output=[];summaries=[];best_supported=0
 for case,request in zip(reg['cases'],receipt['requests']):
  assert case['id']==request['case_id']
  raw=acquisition/request['response_file'];assert sha(raw)==request['sha256'] and raw.stat().st_size==request['bytes']
  reader=csv.DictReader(io.StringIO(raw.read_text(encoding='utf-8-sig')));assert reader.fieldnames==reg['columns']
  rows=list(reader);assert len(rows)==request['rows']<5001
  converted=[];collisions=Counter()
  for row in rows:
   scan,frame=validate_identity(row)
   assert None not in row and None not in row.values()
   a,b,mjd=(number(row,key) for key in ['ra','dec','mjd']);assert None not in (a,b,mjd)
   assert angle(a,b,float(case['ra']),float(case['dec']))<=12.001,'Returned target geometry'
   distances={alt['designation']:angle(a,b,float(alt['ra']),float(alt['dec'])) for alt in case['catalogue_alternatives']}
   hits=[name for name,distance in distances.items() if distance<=1]
   boundary=any(abs(distance-1)<1e-5 for distance in distances.values())
   unique=hits[0] if len(hits)==1 and not boundary else ''
   if unique:collisions[(scan,frame,unique)]+=1
   native=exposure.get((case['id'],scan,frame));offset=''
   if native:
    offset=repr((mjd-float(native['header']['MJD_OBS']))*86400)
    assert abs(float(offset))<=60,'Native reported-time consistency'
   record=dict(row,case_id=case['id'],canonical_frame_num=frame,
               separations_arcsec=json.dumps(distances,sort_keys=True),
               matching_catalogue_ids=json.dumps(hits),geometric_boundary=str(boundary),
               unique_associated_catalogue_id=unique,
               cached_intensity_path=native['path'] if native else '',reported_mjd_offset_seconds=offset)
   record['quality_reasons']=quality(row);converted.append(record)
  for row in converted:
   if not row['unique_associated_catalogue_id']:row['quality_reasons'].append('no_unique_literal_catalogue_geometry')
   elif collisions[(row['scan_id'],row['canonical_frame_num'],row['unique_associated_catalogue_id'])]>1:
    row['quality_reasons'].append('multiple_compatible_extractions_in_exposure')
   row['quality_isolated']=str(not row['quality_reasons']);row['quality_reasons']=json.dumps(row['quality_reasons'])
  alternatives=[]
  for alt in case['catalogue_alternatives']:
   matched=[r for r in converted if r['unique_associated_catalogue_id']==alt['designation']]
   accepted=[r for r in matched if r['quality_isolated']=='True']
   clusters=groups(float(r['mjd']) for r in accepted)
   supported=[group for group in clusters if len(group)>=5]
   span=supported[-1][-1]-supported[0][0] if supported else None
   ready=len(supported)>=3 and span is not None and span>=365
   is_best=alt['designation']==case['fixed_best_designation']
   if ready and is_best:best_supported+=1
   alternatives.append({'designation':alt['designation'],'cntr':alt['cntr'],'fixed_best':is_best,
                        'unique_geometric_rows':len(matched),'strict_quality_rows':len(accepted),
                        'supported_epoch_groups':len(supported),'supported_reported_span_days':span,
                        'conservative_pipeline_cadence_support':ready,
                        'rejection_counts':dict(Counter(reason for r in matched for reason in json.loads(r['quality_reasons']))),
                        'physical_stage':'unknown','emitter_ownership':'unestablished'})
  summaries.append({'case_id':case['id'],'native_rows':len(rows),
                    'image_exposure_joined_rows':sum(bool(r['cached_intensity_path']) for r in converted),
                    'geometry_ambiguous_or_unmatched_rows':sum(not r['unique_associated_catalogue_id'] for r in converted),
                    'catalogue_alternatives':alternatives})
  output+=converted
 fields=reg['columns']+['case_id','canonical_frame_num','separations_arcsec','matching_catalogue_ids',
          'geometric_boundary','unique_associated_catalogue_id','cached_intensity_path',
          'reported_mjd_offset_seconds','quality_reasons','quality_isolated']
 buffer=io.StringIO(newline='');writer=csv.DictWriter(buffer,fieldnames=fields);writer.writeheader();writer.writerows(output)
 path=stage/'detections.csv.gz';assert not path.exists();path.write_bytes(gzip.compress(buffer.getvalue().encode(),mtime=0))
 summary={'schema':'native-profile-quality-flag-repair/1','flag_format_registration_sha256':sha(amendment),'representation_repair_post_read':True,'scientific_thresholds_changed':False,'registration_sha256':sha(REG),
          'acquisition_sha256':sha(acquisition/'acquisition.json'),'detections_sha256':sha(path),
          'cases':summaries,'native_rows':len(output),'fixed_best_supported':best_supported,
          'fixed_best_denominator':3,'required_supported_best':2,'primary_gate_passed':best_supported>=2,
          'selection_consumed':True,'full_goal_achieved':False,'physical_validation':False,
          'new_stars':0,'new_births':0,'new_model_fitted':False,
          'scope':'Conservative native pipeline quality and literal geometry; no calibrated ownership or physical class'}
 with (stage/'summary.json').open('x') as f:json.dump(summary,f,indent=2);f.write('\n')
 print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('acquisition',type=Path);parser.add_argument('stage',type=Path)
 args=parser.parse_args();run(args.acquisition,args.stage)
