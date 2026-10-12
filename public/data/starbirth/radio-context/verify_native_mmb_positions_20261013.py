"""Independent fixed-width/Decimal coordinate and vector-geometry verification."""
import argparse,gzip,hashlib,json,math
from decimal import Decimal
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/native_mmb_position_registration_20261013.json'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def coordinates(line):
 hours,minutes,seconds=(Decimal(line[a:b].strip()) for a,b in [(16,18),(19,21),(22,27)])
 degrees,arcminutes,arcseconds=(Decimal(line[a:b].strip()) for a,b in [(29,31),(32,34),(35,39)])
 ra=15*(hours+minutes/60+seconds/3600)
 dec=(degrees+arcminutes/60+arcseconds/3600)*(-1 if line[28]=='-' else 1)
 return float(ra),float(dec)
def angle(a,b,c,d):
 vectors=[]
 for ra,dec in [(a,b),(c,d)]:
  ra,dec=math.radians(ra),math.radians(dec)
  vectors.append((math.cos(dec)*math.cos(ra),math.cos(dec)*math.sin(ra),math.sin(dec)))
 u,v=vectors;cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
 return math.atan2(math.hypot(*cross),sum(x*y for x,y in zip(u,v)))*206264.80624709636
def pair_list_equal(expected,stored):
 assert len(expected)==len(stored)
 for e,s in zip(expected,stored):
  assert e['maser_row_id']==s['maser_row_id'] and e['flag']==s['flag']
  assert abs(e['separation_arcsec']-s['separation_arcsec'])<0.000002
def run(acquisition,analysis,stage):
 reg=json.loads(REG.read_text());receipt=json.loads((acquisition/'acquisition.json').read_text());summary=json.loads((analysis/'summary.json').read_text())
 assert receipt['complete'] and receipt['registration_sha256']==summary['registration_sha256']==sha(REG)
 assert receipt['url']==reg['url'] and receipt['retries']==0 and receipt['coordinate_uploads']==0
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256']
 lines=(acquisition/'catalog.dat').read_text(encoding='ascii').splitlines();assert len(lines)==707
 assert sha(acquisition/'catalog.dat')==receipt['sha256']==summary['catalogue_sha256']
 native=json.loads(gzip.decompress((analysis/'radio_records.json.gz').read_bytes()))['records']
 assert len(native)==707 and sha(analysis/'radio_records.json.gz')==summary['radio_records_sha256']
 known=[];maximum_coordinate_error=0.
 slices={'velocity_low_field':(40,46),'velocity_high_field':(48,54),'peak_velocity_mx_field':(56,62),
         'peak_flux_mx_limit':(63,64),'peak_flux_mx_field':(64,71),'peak_flux_mx_flag':(71,72),
         'peak_velocity_sc_field':(73,79),'peak_flux_sc_limit':(80,81),'peak_flux_sc_field':(81,88),'references_field':(89,114)}
 for i,(line,row) in enumerate(zip(lines,native),1):
  assert row['row_id']==f'VIII/96/catalog.dat:{i:06d}' and row['raw_line_sha256']==hashlib.sha256(line.encode()).hexdigest()
  assert row['native_name_field']==line[:14] and row['name']==line[:14].rstrip() and row['position_or_thermal_flag']==line[14]
  assert row['native_ra_fields']==[line[16:18],line[19:21],line[22:27]]
  assert row['native_dec_fields']==[line[28],line[29:31],line[32:34],line[35:39]]
  for key,(a,b) in slices.items():assert row[key]==line.ljust(114)[a:b]
  a,b=coordinates(line);assert abs(a-row['ra_degrees'])<1e-10 and abs(b-row['dec_degrees'])<1e-10
  maximum_coordinate_error=max(maximum_coordinate_error,abs(a-row['ra_degrees']),abs(b-row['dec_degrees']))
  known.append((row['row_id'],a,b,line[14]))
 primary=0;comparisons=0
 for case,returned in zip(reg['cases'],summary['cases']):
  assert case['id']==returned['case_id']
  expected_points=[{'point_id':case['id'],'point_kind':'clump_centre','ra':case['ra'],'dec':case['dec'],'fixed_best':False}]
  expected_points += [dict(alt,point_id=alt['designation'],point_kind='catalogue_alternative',fixed_best=alt['designation']==case['fixed_best_designation']) for alt in case['alternatives']]
  assert len(expected_points)==len(returned['assessments'])
  for point,item in zip(expected_points,returned['assessments']):
   assert all(item[key]==value for key,value in point.items())
   pairs=[{'maser_row_id':ident,'separation_arcsec':angle(float(point['ra']),float(point['dec']),a,b),'flag':flag} for ident,a,b,flag in known]
   comparisons+=len(pairs);pairs.sort(key=lambda pair:(pair['separation_arcsec'],pair['maser_row_id']))
   pair_list_equal(pairs[:1],[item['nearest_maser']])
   for radius,key in [(1,'masers_within_1_arcsec'),(15,'masers_within_15_arcsec'),(30,'masers_within_30_arcsec')]:
    pair_list_equal([p for p in pairs if p['separation_arcsec']<=radius],item[key])
   qualified=[p for p in pairs if p['separation_arcsec']<=1 and p['flag']==' ' and abs(p['separation_arcsec']-1)>0.00001]
   pair_list_equal(qualified,item['conservative_radio_rows'])
   assert item['conservative_projected_radio_support']==bool(qualified)
   assert item['physical_stage']=='unknown' and item['clump_membership']=='unestablished' and item['birth_status']=='not_established'
   if point['fixed_best'] and qualified:primary+=1
 assert summary['fixed_best_projected_support']==primary and summary['fixed_best_denominator']==3
 assert summary['primary_geometric_criterion_met']==(primary>=1)
 assert not summary['physical_validation'] and not summary['radio_absence_means_starless'] and not summary['independent_held_out_physical_truth']
 result={'schema':'native-mmb-position-independent-verification/1','verified':True,
         'registration_sha256':sha(REG),'summary_sha256':sha(analysis/'summary.json'),
         'catalogue_sha256':receipt['sha256'],'radio_records_sha256':summary['radio_records_sha256'],
         'native_rows_checked':707,'angular_pairs_recomputed':comparisons,'maximum_coordinate_difference_degrees':maximum_coordinate_error,
         'fixed_best_projected_support':primary,'fixed_best_denominator':3,'primary_geometric_criterion_met':primary>=1,
         'method':'Independent raw field slices, Decimal sexagesimal conversion and vector cross-product geometry; no Astropy/worker import',
         'physical_validation':False,'new_stars':0,'new_births':0}
 with (stage/'verification.json').open('x') as f:json.dump(result,f,indent=2);f.write('\n')
 print(json.dumps(result,indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('acquisition',type=Path);p.add_argument('analysis',type=Path);p.add_argument('stage',type=Path);a=p.parse_args();run(a.acquisition,a.analysis,a.stage)
