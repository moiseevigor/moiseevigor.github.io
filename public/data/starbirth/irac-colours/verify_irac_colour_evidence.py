"""Independent raw-response/fraction audit; imports no colour worker functions."""
import argparse,csv,hashlib,json,math,itertools,subprocess
from fractions import Fraction
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REG=ROOT/'artifacts/irac_colour_registration_20261012.json'
FIELDS=[('3_6','mag3_6','d3_6m','f3_6','df3_6'),('4_5','mag4_5','d4_5m','f4_5','df4_5'),('5_8','mag5_8','d5_8m','f5_8','df5_8'),('8_0','mag8_0','d8_0m','f8_0','df8_0')]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def equal(actual,expected):
 if isinstance(expected,float):assert actual is not None and math.isclose(actual,expected,rel_tol=1e-12,abs_tol=1e-12),(actual,expected)
 else:assert actual==expected,(actual,expected)
def native_band(r,fields):
 try:
  q=[Fraction(r[f]) for f in fields[1:]]
  return q[:2] if all(x>0 for x in q[1:]) else None
 except (ValueError,ZeroDivisionError):return None
def run(stage,output):
 reg=json.loads(REG.read_text())
 for x in reg['inputs']:
  p=ROOT/x['path'];assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],p
 generated=json.loads((stage/'all_records.json').read_text());summary=json.loads((stage/'summary.json').read_text());cards=json.loads((ROOT/reg['cards_path']).read_text())['evidence_cases'];native_csv=list(csv.DictReader((ROOT/reg['sources_path']).open()))
 originals={}
 for key in range(6):
  p=ROOT/f'artifacts/native_glimpse_acquisition_20261012/q{key:02}.csv'
  for ordinal,row in enumerate(csv.DictReader(p.open()),1):originals[(f'q{key:02}',str(ordinal))]=row
 assert len(originals)==len(generated)==len(native_csv)==12
 decisions={};verified_pairs=0
 for item in generated:
  row=originals[(item['response_key'],item['source_row'])];assert row['designation']==item['designation'] and row['cntr']==item['cntr'] and isinstance(item['cntr'],str)
  linked=[r for r in native_csv if (r['response_key'],r['source_row'])==(item['response_key'],item['source_row'])];assert len(linked)==1
  assert all(linked[0][k]==value for k,value in row.items()) and linked[0]['case']==item['case_id'] and linked[0]['kind']==item['kind']
  assert item['native']=={k:row[k] for band in FIELDS for k in band[1:]} and item['native_sqf_4_5']==row['sqf_4_5']
  bands={f[0]:native_band(row,f) for f in FIELDS};lookup={};assert len(item['colours'])==6
  for result,(a,b) in zip(item['colours'],itertools.combinations(bands,2),strict=True):
   assert (result['band_a'],result['band_b'])==(a,b);x,y=bands[a],bands[b];valid=x is not None and y is not None;assert result['available']==valid
   if not valid:
    assert all(result[k] is None for k in ['colour_mag','sigma_min','sigma_max','sigma_independent_reference','envelopes']);lookup[(a,b)]=None;continue
   c=x[0]-y[0];maximum=x[1]+y[1];minimum=abs(x[1]-y[1]);reference=math.sqrt(float(x[1]*x[1]+y[1]*y[1]))
   for k,v in [('colour_mag',float(c)),('sigma_min',float(minimum)),('sigma_max',float(maximum)),('sigma_independent_reference',reference)]:equal(result[k],v)
   for factor in [1,3]:
    assert len(result['envelopes'][str(factor)])==2
    for actual,expected in zip(result['envelopes'][str(factor)],[c-factor*maximum,c+factor*maximum],strict=True):equal(actual,float(expected))
   lookup[(a,b)]=(c,maximum);verified_pairs+=1
  necessary=[lookup[('3_6','4_5')],lookup[('4_5','5_8')]];cut=Fraction(7,10)
  central=False if any(x is not None and x[0]<=cut for x in necessary) else (True if all(x is not None for x in necessary) else None)
  support=all(x is not None and x[0]-3*x[1]>cut for x in necessary);incompatible=any(x is not None and x[0]+3*x[1]<=cut for x in necessary)
  available=all(x is not None and x[1]<Fraction(1,5) for x in bands.values())
  expected=dict(four_band_photometric_availability=available,missing_or_invalid_bands=[k for k,v in bands.items() if v is None],central_necessary_colours=central,robust_necessary_colour_support=support,quoted_error_incompatibility=incompatible,assessment='incompatible_with_necessary_colour_in_quoted_error_sensitivity' if incompatible else ('robust_necessary_colours_only' if support else 'unresolved_necessary_colour'),full_standard_classification='not_evaluated',physical_stage='unknown',calibrated_probability=None)
  assert item['decision']==expected;decisions[(item['case_id'],item['kind'],item['cntr'])]=(expected,item['colours'])
 counts=dict(photometric_availability=0,central_necessary_support=0,robust_necessary_support=0,quoted_error_incompatible=0,unresolved_necessary_colours=0)
 for case,card,registered in zip(summary['case_assessments'],cards,reg['cases'],strict=True):
  best=card['geometrically_best_catalogue_record'];assert case['case_id']==card['case_id']==registered['case_id'] and case['native_source_id']==best['designation']==registered['native_source_id'] and case['cntr']==best['cntr']
  decision,colours=decisions[(case['case_id'],'Catalog',case['cntr'])];assert case['decision']==decision and case['colours']==colours and case['historical_system']==card['historical_system']
  assert case['physical_stage']=='unknown' and case['birth_status']=='not_established' and case['positional_matches']==card['matched_visits'] and case['positional_visits']==card['total_supported_visits']
  for key,value in [('photometric_availability',decision['four_band_photometric_availability']),('central_necessary_support',decision['central_necessary_colours'] is True),('robust_necessary_support',decision['robust_necessary_colour_support']),('quoted_error_incompatible',decision['quoted_error_incompatibility']),('unresolved_necessary_colours',decision['assessment']=='unresolved_necessary_colour')]:counts[key]+=value
 assert all(summary[k]==v for k,v in counts.items())
 assert summary['selected_cases']==3 and summary['native_records_retained']==12 and summary['independent_native_objects']==6 and summary['consumed_and_post_read']
 assert all(summary[k] is False for k in ['full_standard_classification_evaluated','physical_validation','original_ranking_changed','envelopes_are_confidence_intervals','missing_values_imputed']) and summary['new_stars']==summary['new_births']==0
 record=dict(schema='independent-irac-necessary-colour-verification/1',verified=True,code_revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),registration_sha256=sha(REG),summary_sha256=sha(stage/'summary.json'),all_records_sha256=sha(stage/'all_records.json'),counts=counts,native_records_verified=12,calculable_band_pairs_verified=verified_pairs,method='Exact Fraction arithmetic from original six native responses, no generator imports',physical_validation=False,full_classifier_implemented=False,new_stars=0,new_births=0)
 with output.open('x') as f:json.dump(record,f,indent=2);f.write('\n')
 print(json.dumps(record,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.stage,a.output)
