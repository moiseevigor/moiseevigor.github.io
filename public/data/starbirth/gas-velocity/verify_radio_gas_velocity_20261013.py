"""Independent raw-CSV/Decimal interval checker; imports no worker implementation."""
import argparse,csv,gzip,hashlib,json,math
from decimal import Decimal,InvalidOperation
from pathlib import Path
from astropy.coordinates import SkyCoord
import astropy.units as u
ROOT=Path(__file__).resolve().parents[1];REG='artifacts/radio_gas_velocity_registration_20261013.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def number(value):
 try:
  x=Decimal(value);return x if x.is_finite() else None
 except (InvalidOperation,TypeError):return None
def distance(a,b,c,d):return SkyCoord(float(a)*u.deg,float(b)*u.deg).separation(SkyCoord(float(c)*u.deg,float(d)*u.deg)).arcsec
D=Decimal
def main(stage,analysis):
 reg=json.loads((ROOT/REG).read_text());out=json.loads((analysis/'summary.json').read_text());native=json.loads(gzip.decompress((analysis/'native_records.json.gz').read_bytes()))
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256']
 assert out['registration_sha256']==native['registration_sha256']==sha(ROOT/REG) and out['native_records_sha256']==sha(analysis/'native_records.json.gz')
 selected=[];rows={}
 with (ROOT/reg['malt90_path']).open() as f:
  for ordinal,row in enumerate(csv.DictReader(f),1):
   hits=[]
   if number(row['_RA_icrs']) is not None and number(row['_DE_icrs']) is not None:
    hits=[{'case_id':c['case_id'],'separation_arcsec':float(distance(row['_RA_icrs'],row['_DE_icrs'],c['ra'],c['dec']))} for c in reg['cases'] if distance(row['_RA_icrs'],row['_DE_icrs'],c['ra'],c['dec'])<=30]
   if hits or row['ID'] in {c['malt90_id'] for c in reg['cases']}:
    selected.append({'source_row_ordinal':str(ordinal),'native_fields':row,'nearby_cases':hits})
   if row['ID'] in {c['malt90_id'] for c in reg['cases']}:rows.setdefault(row['ID'],[]).append((str(ordinal),row))
 assert len(selected)==len(native['native_rows'])
 for a,b in zip(selected,native['native_rows']):
  assert a['native_fields']==b['native_fields'] and a['source_row_ordinal']==b['source_row_ordinal']
  assert len(a['nearby_cases'])==len(b['nearby_cases'])
  for i,j in zip(a['nearby_cases'],b['nearby_cases']):assert i['case_id']==j['case_id'] and abs(i['separation_arcsec']-j['separation_arcsec'])<2e-6
 # Independent raw fixed-width radio parsing, not the earlier parsed helper.
 radio_lines=(ROOT/reg['raw_radio_path']).read_text().splitlines();assert len(radio_lines)==707
 total=0
 for case,result in zip(reg['cases'],out['cases']):
  assert case['case_id']==result['case_id'] and len(rows[case['malt90_id']])==1
  ordinal,row=rows[case['malt90_id']][0];assert result['source_row_ordinal']==ordinal and result['malt90_id']==row['ID'] and result['native_name']==row['Name'] and result['native_velocity_component']==row['Vc']
  raw=radio_lines[int(case['radio_row_id'].split(':')[-1])-1].ljust(114)
  assert raw[:14].rstrip()==case['radio_name'] and raw[14]==' '
  fields={'velocity_low_field':raw[40:46],'velocity_high_field':raw[48:54],'peak_velocity_mx_field':raw[56:62],'peak_velocity_sc_field':raw[73:79]};assert result['native_radio_velocity_fields']==fields
  expected_bands=[]
  for tracer,mode in [('N2HP',3),('H13COP',1)]:
   r=next(x for x in result['lines'] if x['tracer']==tracer)
   assert r['native_fields']=={k:row[k+tracer] for k in ['D','NG','Vlsr','e_Vlsr','FWHM','e_FWHM','Pfit','IISNR']}
   v,e,w,dw=[number(row[k+tracer]) for k in ['Vlsr','e_Vlsr','FWHM','e_FWHM']]
   eligible=row['D'+tracer]=='Y' and number(row['NG'+tracer])==mode and all(x is not None for x in (v,e,w,dw)) and e>=0 and w>0 and dw>=0
   assert r['eligible']==eligible and not r['band_is_confidence_interval']
   if eligible:
    half=w/D(2)+D(3)*e+D('1.5')*dw+D('.06');band=[v-half,v+half]
    assert max(abs(float(x)-y) for x,y in zip(band,r['velocity_band_km_s']))<1e-9
    expected_bands.append(band)
   else:assert r['velocity_band_km_s'] is None
   total+=1
  geo=distance(row['_RA_icrs'],row['_DE_icrs'],case['ra'],case['dec']);assert abs(geo-result['malt90_to_clump_arcsec'])<2e-6
  assert result['native_projected_and_velocity_eligible']==(len(expected_bands)==2 and geo<=30)
  for shift,scenario in zip([-1,0,1],result['scenarios']):
   assert scenario['shift_km_s']==shift
   if len(expected_bands)<2:assert scenario['compatible'] is None and scenario['overlap_km_s'] is None;continue
   bands=expected_bands+[[number(fields['velocity_low_field'])-D('.14')+D(shift),number(fields['velocity_high_field'])+D('.14')+D(shift)]]
   overlap=min(x[1] for x in bands)-max(x[0] for x in bands);boundary=abs(overlap)<=D('1e-10')
   assert scenario['boundary']==boundary and scenario['compatible']==(None if boundary else overlap>0) and abs(float(overlap)-scenario['overlap_km_s'])<1e-9
  assert result['zero_shift_compatible']==(result['scenarios'][1]['compatible'] if geo<=30 else None)
 primary=next(x for x in out['cases'] if x['primary_case'])
 assert out['primary_eligible']==primary['native_projected_and_velocity_eligible'] and out['primary_rule_met']==out['primary_compatible']==primary['zero_shift_compatible'] and out['primary_denominator']==1
 assert not out['physical_validation'] and not out['models_changed'] and out['new_stars']==out['new_births']==0
 result={'schema':'radio-gas-velocity-independent-verification/1','verified':True,'registration_sha256':sha(ROOT/REG),'summary_sha256':sha(analysis/'summary.json'),'native_records_sha256':sha(analysis/'native_records.json.gz'),'native_molecular_records_checked':len(selected),'fixed_case_line_assessments_checked':total,'shift_scenarios_checked':9,'primary_eligible':out['primary_eligible'],'primary_compatible':out['primary_compatible'],'method':'Raw CSV/Decimal native interval arithmetic; original fixed-width maser velocity fields; independent Astropy angular geometry. No worker import.','physical_validation':False}
 (stage/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=Path);p.add_argument('analysis',type=Path);a=p.parse_args();main(a.stage,a.analysis)
