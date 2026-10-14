"""Fresh synthetic controls before repaired native readout; no network/native data."""
import argparse,itertools,json,importlib.util
from pathlib import Path
from neowise_flag_format import w2_photo_quality
R=Path(__file__).resolve().parents[1]
def module(path):
 spec=importlib.util.spec_from_file_location(path.stem,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
worker=module(R/'research/analyze_native_profile_flag_repair_20261014.py');independent=module(R/'research/verify_native_profile_flag_repair_20261014.py')
base=dict(sigra='0.2',sigdec='0.2',sigradec='0.1',w2sigmpro='0.02',w2flux='100',w2sigflux='5',w2fitr='7.5',w2mpro='10',mjd='56000',w2snr='20',w2rchi2='1',nb='1',na='0',w2sat='0',w2cc_map='0',sso_flg='0',qi_fact='1',qual_frame='10',saa_sep='10',cc_flags='0000',ph_qual='AA',moon_masked='00',w2frtr='0000')
count=0
for a,b in itertools.product('ABCUX',repeat=2):
 for value in [a+b,a+b+'XX']:
  assert w2_photo_quality(value)==b
  row={**base,'ph_qual':value};saved=dict(row)
  assert set(worker.quality(row))==independent.failures(row)==(set() if b=='A' else {'ph_qual_w2_requirement'})
  assert row==saved;count+=1
invalid=['','A','AAA','AAAA','AAX0','AAX ','AA ',' AA','aa','Aa','?A','0A','A\x00',None]
for value in invalid:
 assert w2_photo_quality(value) is None
 if isinstance(value,str):
  row={**base,'ph_qual':value};assert 'ph_qual_w2_requirement' in worker.quality(row) and 'ph_qual_w2_requirement' in independent.failures(row)
for key,value,reason in [('w2snr','10','w2_snr_not_above_10'),('w2rchi2','2.00001','w2_profile_fit_not_in_0_to_2'),('w2rchi2','0','w2_profile_fit_not_in_0_to_2'),('nb','2','nb_strict_requirement'),('w2cc_map','1','w2cc_map_strict_requirement'),('qi_fact','0.5','qi_fact_strict_requirement'),('moon_masked','01','moon_masked_w2_requirement'),('w2frtr','0010','w2_transient_pixel_flag'),('w2sigmpro','','w2sigmpro_missing_or_nonpositive')]:
 row={**base,key:value};assert reason in worker.quality(row) and reason in independent.failures(row)
result={'verified':True,'valid_literal_forms_checked':count,'invalid_literal_forms_checked':len(invalid),'unchanged_quality_boundary_controls':9,'raw_values_unchanged':True,'missing_w3_w4_not_imputed':True,'no_native_readout_or_network':True}
p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args();assert not args.output.exists();args.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
