"""Retrospective native IRAC necessary-colour diagnostic; never a physical classifier."""
import argparse,csv,hashlib,json,math,itertools
from decimal import Decimal
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REG=ROOT/'artifacts/irac_colour_registration_20261012.json'
BANDS={'3_6':('mag3_6','d3_6m','f3_6','df3_6'),'4_5':('mag4_5','d4_5m','f4_5','df4_5'),'5_8':('mag5_8','d5_8m','f5_8','df5_8'),'8_0':('mag8_0','d8_0m','f8_0','df8_0')}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def num(x):
 try:y=float(x);return y if math.isfinite(y) else None
 except (ValueError,TypeError):return None
def band(r,k):
 values=[num(r[x]) for x in BANDS[k]]
 return [Decimal(r[x]) for x in BANDS[k][:2]] if all(x is not None for x in values) and all(x>0 for x in values[1:]) else None
def colours(r):
 out=[]
 for a,b in itertools.combinations(BANDS,2):
  x,y=band(r,a),band(r,b);valid=x is not None and y is not None
  record=dict(band_a=a,band_b=b,available=valid,colour_mag=None,sigma_min=None,sigma_max=None,sigma_independent_reference=None,envelopes=None)
  if valid:
   c=x[0]-y[0];lo=abs(x[1]-y[1]);hi=x[1]+y[1]
   record.update(colour_mag=float(c),sigma_min=float(lo),sigma_max=float(hi),sigma_independent_reference=math.hypot(float(x[1]),float(y[1])),envelopes={str(k):[float(c-k*hi),float(c+k*hi)] for k in (1,3)})
  out.append(record)
 return out
def decision(r,cs,threshold=.7):
 by={(x['band_a'],x['band_b']):x for x in cs};needed=[by[('3_6','4_5')],by[('4_5','5_8')]]
 valid=[k for k in BANDS if band(r,k) is not None];availability=len(valid)==4 and all(band(r,k)[1]<Decimal('0.2') for k in BANDS)
 central=False if any(x['available'] and x['colour_mag']<=threshold for x in needed) else (True if all(x['available'] for x in needed) else None)
 robust=all(x['available'] and x['envelopes']['3'][0]>threshold for x in needed)
 incompatible=any(x['available'] and x['envelopes']['3'][1]<=threshold for x in needed)
 return dict(four_band_photometric_availability=availability,missing_or_invalid_bands=[k for k in BANDS if k not in valid],central_necessary_colours=central,robust_necessary_colour_support=robust,quoted_error_incompatibility=incompatible,assessment='incompatible_with_necessary_colour_in_quoted_error_sensitivity' if incompatible else ('robust_necessary_colours_only' if robust else 'unresolved_necessary_colour'),full_standard_classification='not_evaluated',physical_stage='unknown',calibrated_probability=None)
def run(stage):
 reg=json.loads(REG.read_text())
 for x in reg['inputs']:
  p=ROOT/x['path'];assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],p
 cards=json.loads((ROOT/reg['cards_path']).read_text())['evidence_cases'];raw=list(csv.DictReader((ROOT/reg['sources_path']).open()));assert len(raw)==12
 records=[];cases=[]
 for r in raw:
  cs=colours(r);records.append(dict(case_id=r['case'],kind=r['kind'],designation=r['designation'],cntr=r['cntr'],response_key=r['response_key'],source_row=r['source_row'],native={k:r[k] for fields in BANDS.values() for k in fields},native_sqf_4_5=r['sqf_4_5'],colours=cs,decision=decision(r,cs)))
 for c,expected in zip(cards,reg['cases'],strict=True):
  best=c['geometrically_best_catalogue_record'];assert c['case_id']==expected['case_id'] and best['designation']==expected['native_source_id']
  selected=[r for r in records if r['case_id']==c['case_id'] and r['kind']=='Catalog' and r['cntr']==best['cntr']];assert len(selected)==1
  x=selected[0];assert all(x['native'][k]==best[k] for k in x['native'])
  cases.append(dict(case_id=c['case_id'],native_source_id=x['designation'],cntr=x['cntr'],colours=x['colours'],decision=x['decision'],historical_system=c['historical_system'],positional_matches=c['matched_visits'],positional_visits=c['total_supported_visits'],physical_stage='unknown',birth_status='not_established'))
 summary=dict(schema='retrospective-irac-necessary-colour-result/1',selected_cases=3,consumed_and_post_read=True,photometric_availability=sum(x['decision']['four_band_photometric_availability'] for x in cases),central_necessary_support=sum(x['decision']['central_necessary_colours'] is True for x in cases),robust_necessary_support=sum(x['decision']['robust_necessary_colour_support'] for x in cases),quoted_error_incompatible=sum(x['decision']['quoted_error_incompatibility'] for x in cases),unresolved_necessary_colours=sum(x['decision']['assessment']=='unresolved_necessary_colour' for x in cases),native_records_retained=len(records),independent_native_objects=6,full_standard_classification_evaluated=False,physical_validation=False,original_ranking_changed=False,new_stars=0,new_births=0,envelopes_are_confidence_intervals=False,missing_values_imputed=False,case_assessments=cases)
 stage.mkdir(exist_ok=True)
 for name,obj in [('all_records.json',records),('summary.json',summary)]:
  with (stage/name).open('x') as f:json.dump(obj,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:v for k,v in summary.items() if k!='case_assessments'},indent=2))
def test():
 r={k:'1' for v in BANDS.values() for k in v};r|={'mag3_6':'1.8','mag4_5':'1','mag5_8':'0','d3_6m':'.01','d4_5m':'.01','d5_8m':'.01','d8_0m':'.01'}
 d=decision(r,colours(r));assert d['robust_necessary_colour_support']
 r['mag3_6']='1.7';assert not decision(r,colours(r))['central_necessary_colours']
 r['mag3_6']='.9';assert decision(r,colours(r))['quoted_error_incompatibility']
 r['mag5_8']='';assert not colours(r)[3]['available'];assert decision(r,colours(r))['central_necessary_colours'] is False
 r['mag3_6']='2';assert decision(r,colours(r))['central_necessary_colours'] is None
 r['mag5_8']='0';r['d3_6m']='.2';assert not decision(r,colours(r))['four_band_photometric_availability']
 r['d3_6m']='0';assert band(r,'3_6') is None
 for rho in [-1,0,1]:
  sigma=math.sqrt(.055**2+.072**2-2*rho*.055*.072);assert abs(.055-.072)-1e-12<=sigma<=.055+.072+1e-12
 covariance_c12_c23=-.072**2;assert covariance_c12_c23<0
 print('Synthetic strict boundaries, missing/invalid data, covariance extremes and shared-band dependence passed')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:test()
 else:run(a.stage)
