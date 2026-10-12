"""Three-case projected radio-marker comparison; no stellar class or birth inference."""
import argparse,gzip,hashlib,json
from pathlib import Path
from astropy.coordinates import Angle,SkyCoord
import astropy.units as u
ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/native_mmb_position_registration_20261013.json'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def parse(raw):
 result=[]
 for index,line in enumerate(raw.decode('ascii').splitlines(),1):
  padded=line.ljust(114)
  ra=Angle(f'{line[16:18]}h{line[19:21]}m{line[22:27]}s').degree
  dec=Angle(f'{line[28:31]}d{line[32:34]}m{line[35:39]}s').degree
  result.append({'row_id':f'VIII/96/catalog.dat:{index:06d}','native_name_field':line[:14],
                 'name':line[:14].rstrip(),'position_or_thermal_flag':line[14],
                 'ra_degrees':ra,'dec_degrees':dec,
                 'native_ra_fields':[line[16:18],line[19:21],line[22:27]],
                 'native_dec_fields':[line[28],line[29:31],line[32:34],line[35:39]],
                 'velocity_low_field':padded[40:46],'velocity_high_field':padded[48:54],
                 'peak_velocity_mx_field':padded[56:62],'peak_flux_mx_limit':padded[63],
                 'peak_flux_mx_field':padded[64:71],'peak_flux_mx_flag':padded[71],
                 'peak_velocity_sc_field':padded[73:79],'peak_flux_sc_limit':padded[80],
                 'peak_flux_sc_field':padded[81:88],'references_field':padded[89:114],
                 'raw_line_sha256':hashlib.sha256(line.encode()).hexdigest()})
 return result
def run(acquisition,stage):
 reg=json.loads(REG.read_text());receipt=json.loads((acquisition/'acquisition.json').read_text())
 assert receipt['complete'] and receipt['registration_sha256']==sha(REG)
 raw=(acquisition/'catalog.dat').read_bytes();assert hashlib.sha256(raw).hexdigest()==receipt['sha256']
 for item in reg['inputs']:
  path=ROOT/item['path'];assert path.stat().st_size==item['bytes'] and sha(path)==item['sha256']
 masers=parse(raw);assert len(masers)==707
 catalogue=SkyCoord(ra=[row['ra_degrees'] for row in masers]*u.deg,dec=[row['dec_degrees'] for row in masers]*u.deg)
 cases=[];primary=0
 for case in reg['cases']:
  points=[{'point_id':case['id'],'point_kind':'clump_centre','ra':case['ra'],'dec':case['dec'],'fixed_best':False}]
  points += [dict(row,point_id=row['designation'],point_kind='catalogue_alternative',fixed_best=row['designation']==case['fixed_best_designation']) for row in case['alternatives']]
  assessments=[]
  for point in points:
   coordinate=SkyCoord(ra=float(point['ra'])*u.deg,dec=float(point['dec'])*u.deg)
   distances=coordinate.separation(catalogue).arcsec
   pairs=[{'maser_row_id':row['row_id'],'separation_arcsec':float(distance),'flag':row['position_or_thermal_flag']} for row,distance in zip(masers,distances)]
   pairs.sort(key=lambda row:(row['separation_arcsec'],row['maser_row_id']))
   literal=[pair for pair in pairs if pair['separation_arcsec']<=1]
   conservative=[pair for pair in literal if pair['flag']==' ' and abs(pair['separation_arcsec']-1)>0.00001]
   support=bool(conservative)
   if point['fixed_best'] and support:primary+=1
   assessments.append(dict(point,nearest_maser=pairs[0],masers_within_1_arcsec=literal,
                           conservative_projected_radio_support=support,
                           conservative_radio_rows=conservative,
                           masers_within_15_arcsec=[pair for pair in pairs if pair['separation_arcsec']<=15],
                           masers_within_30_arcsec=[pair for pair in pairs if pair['separation_arcsec']<=30],
                           physical_stage='unknown',clump_membership='unestablished',birth_status='not_established'))
  cases.append({'case_id':case['id'],'assessments':assessments})
 path=stage/'radio_records.json.gz';assert not path.exists()
 path.write_bytes(gzip.compress((json.dumps({'schema':'native-mmb-position-records/1','records':masers},indent=2)+'\n').encode(),mtime=0))
 summary={'schema':'native-mmb-three-case-projected-marker/1','registration_sha256':sha(REG),
          'catalogue_sha256':receipt['sha256'],'radio_records_sha256':sha(path),'native_radio_records':707,
          'cases':cases,'fixed_best_projected_support':primary,'fixed_best_denominator':3,
          'primary_geometric_criterion_met':primary>=1,'physical_validation':False,'new_stars':0,'new_births':0,
          'selection_consumed':True,'independent_held_out_physical_truth':False,'models_changed':False,
          'radio_absence_means_starless':False,'association_probabilities_calibrated':False,
          'scope':'Published radio positions versus literal fixed infrared alternatives; no proper-motion/frame/error calibration or velocity membership'}
 with (stage/'summary.json').open('x') as f:json.dump(summary,f,indent=2);f.write('\n')
 print(json.dumps({k:v for k,v in summary.items() if k!='cases'},indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('acquisition',type=Path);p.add_argument('stage',type=Path);a=p.parse_args();run(a.acquisition,a.stage)
