"""Frozen cached gas/maser interval comparison; no stellar classification or fit."""
import argparse,csv,gzip,hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REG='artifacts/radio_gas_velocity_registration_20261013.json'
TRACERS={'N2HP':3,'H13COP':1}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def number(value):
 try:
  result=float(value);return result if math.isfinite(result) else None
 except (ValueError,TypeError):return None
def separation(a,b,c,d):
 a,b,c,d=map(math.radians,map(float,(a,b,c,d)))
 h=math.sin((b-d)/2)**2+math.cos(b)*math.cos(d)*math.sin((a-c)/2)**2
 return math.degrees(2*math.asin(math.sqrt(min(1,max(0,h)))))*3600
def line(row,tracer,mode):
 fields={k:row.get(k+tracer,'') for k in ['D','NG','Vlsr','e_Vlsr','FWHM','e_FWHM','Pfit','IISNR']}
 v,e,w,dw=[number(fields[k]) for k in ['Vlsr','e_Vlsr','FWHM','e_FWHM']]
 reasons=[]
 if fields['D']!='Y':reasons.append('not_native_Y_detection')
 if number(fields['NG'])!=mode:reasons.append('fit_mode_not_registered')
 if any(x is None for x in (v,e,w,dw)):reasons.append('missing_nonfinite_fit_values')
 elif e<0 or w<=0 or dw<0:reasons.append('invalid_width_or_error')
 band=None
 if not reasons:
  half=w/2+3*e+1.5*dw+.06
  band=[v-half,v+half]
 return {'tracer':tracer,'native_fields':fields,'eligible':not reasons,'reasons':reasons,'velocity_band_km_s':band,'zero_quoted_error_retained':e==0 or dw==0,'band_is_confidence_interval':False}
def compatibility(lines,radio,shift):
 if not all(x['eligible'] for x in lines):return {'shift_km_s':shift,'compatible':None,'overlap_km_s':None,'boundary':False}
 intervals=[x['velocity_band_km_s'] for x in lines]+[[radio[0]-.14+shift,radio[1]+.14+shift]]
 width=min(x[1] for x in intervals)-max(x[0] for x in intervals)
 boundary=abs(width)<=1e-10
 return {'shift_km_s':shift,'compatible':None if boundary else width>0,'overlap_km_s':width,'boundary':boundary}
def run(stage):
 reg=json.loads((ROOT/REG).read_text())
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256'],item['path']
 cases=reg['cases'];retained=[];fixed={x['malt90_id']:[] for x in cases}
 with (ROOT/reg['malt90_path']).open() as f:
  reader=csv.DictReader(f);assert all(k in reader.fieldnames for k in reg['required_columns'])
  for ordinal,row in enumerate(reader,1):
   assert None not in row and None not in row.values()
   a,b=number(row['_RA_icrs']),number(row['_DE_icrs']);hits=[]
   if a is not None and b is not None:
    hits=[{'case_id':c['case_id'],'separation_arcsec':separation(a,b,c['ra'],c['dec'])} for c in cases if separation(a,b,c['ra'],c['dec'])<=30]
   if hits or row['ID'] in fixed:
    record={'source_row_ordinal':str(ordinal),'native_fields':row,'nearby_cases':hits}
    retained.append(record)
    if row['ID'] in fixed:fixed[row['ID']].append(record)
 records=json.loads(gzip.decompress((ROOT/reg['radio_records_path']).read_bytes()))['records'];lookup={r['row_id']:r for r in records};assert len(lookup)==707
 assessments=[]
 for case in cases:
  assert len(fixed[case['malt90_id']])==1,'Keep ambiguous fixed ID as terminal schema/identity failure'
  record=fixed[case['malt90_id']][0];row=record['native_fields'];maser=lookup[case['radio_row_id']]
  assert maser['name']==case['radio_name'] and maser['position_or_thermal_flag']==' '
  radio=[number(maser[k]) for k in ['velocity_low_field','velocity_high_field']];assert all(x is not None for x in radio) and radio[0]<=radio[1]
  tests=[line(row,t,m) for t,m in TRACERS.items()]
  geometry=separation(row['_RA_icrs'],row['_DE_icrs'],case['ra'],case['dec'])
  scenarios=[compatibility(tests,radio,s) for s in [-1,0,1]]
  value=scenarios[1]['compatible'] if geometry<=30 else None
  assessments.append({'case_id':case['case_id'],'primary_case':case['primary_case'],'malt90_id':row['ID'],'native_name':row['Name'],'native_velocity_component':row['Vc'],'source_row_ordinal':record['source_row_ordinal'],'malt90_to_clump_arcsec':geometry,'nearby_molecular_records':[r['source_row_ordinal'] for r in retained if any(h['case_id']==case['case_id'] for h in r['nearby_cases'])],'radio_row_id':maser['row_id'],'radio_name':maser['name'],'radio_to_clump_arcsec':case['radio_to_clump_arcsec'],'native_radio_velocity_fields':{k:maser[k] for k in ['velocity_low_field','velocity_high_field','peak_velocity_mx_field','peak_velocity_sc_field']},'lines':tests,'scenarios':scenarios,'native_projected_and_velocity_eligible':all(t['eligible'] for t in tests) and geometry<=30,'zero_shift_compatible':value,'physical_membership':'unestablished','stellar_velocity':'unmeasured','stellar_youth':'unknown','birth_status':'not_established'})
 primary=next(x for x in assessments if x['primary_case']);assert primary['radio_to_clump_arcsec']<=30
 packet={'schema':'radio-gas-velocity-native-records/1','registration_sha256':sha(ROOT/REG),'native_rows':retained}
 path=stage/'native_records.json.gz';path.write_bytes(gzip.compress((json.dumps(packet,indent=2)+'\n').encode(),mtime=0))
 summary={'schema':'radio-gas-velocity-descriptive-comparison/1','registration_sha256':sha(ROOT/REG),'native_records_sha256':sha(path),'cases':assessments,'primary_case':primary['case_id'],'primary_denominator':1,'primary_eligible':primary['native_projected_and_velocity_eligible'],'primary_compatible':primary['zero_shift_compatible'],'primary_rule_met':primary['zero_shift_compatible'],'velocity_calibration_validated':False,'error_bands_are_confidence_intervals':False,'case_selection_and_measurements_consumed':True,'physical_validation':False,'new_stars':0,'new_births':0,'models_changed':False,'radio_absence_is_physical_negative':False,'automatic_successor_authorized':False}
 (stage/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(json.dumps({k:v for k,v in summary.items() if k!='cases'},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=Path);a=p.parse_args();run(a.stage)
