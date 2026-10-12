"""Prospective registration and synthetic controls; no native line velocity readout."""
import hashlib,json,shutil,subprocess,sys
from pathlib import Path
ROOT=Path('/Users/igor/Work/me/starbirth-search')
assert shutil.disk_usage(ROOT).free>5*1024**3
sys.path.insert(0,str(ROOT/'research'))
import analyze_radio_gas_velocity_20261013 as worker
base={'DN2HP':'Y','NGN2HP':'3','VlsrN2HP':'-50.0','e_VlsrN2HP':'0.1','FWHMN2HP':'2','e_FWHMN2HP':'0.2','PfitN2HP':'','IISNRN2HP':'','DH13COP':'Y','NGH13COP':'1','VlsrH13COP':'-50.0','e_VlsrH13COP':'0.1','FWHMH13COP':'2','e_FWHMH13COP':'0.2','PfitH13COP':'','IISNRH13COP':''}
lines=[worker.line(base,t,m) for t,m in worker.TRACERS.items()]
assert all(x['eligible'] for x in lines)
assert worker.compatibility(lines,[-50.5,-49.5],0)['compatible'] is True
assert worker.compatibility(lines,[-40.5,-39.5],0)['compatible'] is False
missing=dict(base,e_VlsrN2HP='');assert not worker.line(missing,'N2HP',3)['eligible']
wrong=dict(base,NGN2HP='1');assert not worker.line(wrong,'N2HP',3)['eligible']
zero=dict(base,e_VlsrN2HP='0',e_FWHMN2HP='0');assert worker.line(zero,'N2HP',3)['zero_quoted_error_retained'] and worker.line(zero,'N2HP',3)['eligible']
# Pairwise radio overlaps alone can falsely combine two disjoint gas bands.
pairwise=[{'eligible':True,'velocity_band_km_s':[-6,-4]},{'eligible':True,'velocity_band_km_s':[4,6]}]
assert worker.compatibility(pairwise,[-5,5],0)['compatible'] is False
assert abs(worker.separation(359.999,0,.001,0)-7.2)<1e-6
cards=json.loads((ROOT/'artifacts/native_glimpse_association_20261012/evidence_cards.json').read_text())['evidence_cases']
summary=json.loads((ROOT/'artifacts/native_mmb_position_analysis_20261013/summary.json').read_text())
radio=json.loads(__import__('gzip').decompress((ROOT/'artifacts/native_mmb_position_analysis_20261013/radio_records.json.gz').read_bytes()))['records'];lookup={x['row_id']:x for x in radio}
cases=[]
for card,old in zip(cards,summary['cases']):
 assert card['case_id']==old['case_id']
 centre=next(x for x in old['assessments'] if x['point_kind']=='clump_centre');marker=lookup[centre['nearest_maser']['maser_row_id']]
 cases.append({'case_id':card['case_id'],'ra':centre['ra'],'dec':centre['dec'],'malt90_id':card['catalogue_statements']['malt90_native_id'],'radio_row_id':marker['row_id'],'radio_name':marker['name'],'radio_to_clump_arcsec':centre['nearest_maser']['separation_arcsec'],'primary_case':len(cases)==0})
assert [x['malt90_id'] for x in cases]==['AG1532','AG3005','AG3227']
assert cases[0]['radio_row_id']=='VIII/96/catalog.dat:000307'
paths=['docs/RESEARCH_GOAL.md','docs/ADVERSARIAL_REVIEW_20261006.md','docs/MULTISURVEY_RESEARCH_PROGRAM_20261012.md','cache/n1/malt90_rathborne2016.csv','artifacts/native_glimpse_association_20261012/evidence_cards.json','artifacts/native_mmb_position_acquisition_20261013/catalog.dat','artifacts/native_mmb_position_analysis_20261013/radio_records.json.gz','artifacts/native_mmb_position_analysis_20261013/summary.json','artifacts/native_mmb_position_checkpoint_20261013.json','artifacts/native_profile_quality_checkpoint_20261013.json','artifacts/graph/native_mmb_position_reviewed_supplement_20261013.json']
inputs=[]
for name in paths:
 p=ROOT/name;h=hashlib.sha256()
 with p.open('rb') as f:
  while block:=f.read(1024**2):h.update(block)
 inputs.append(dict(path=name,bytes=p.stat().st_size,sha256=h.hexdigest()))
columns=['ID','Name','Vc','_RA_icrs','_DE_icrs']+[key+tracer for tracer in ['N2HP','H13COP'] for key in ['D','NG','Vlsr','e_Vlsr','FWHM','e_FWHM','Pfit','IISNR']]
reg={'schema':'radio-gas-velocity-registration/1','date':'2026-10-13','source_revision_before_registration':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'question':'For fixed nearby historical radio marker 330.878-0.367, do two registered native dense-gas bands in AG1532 have a common literal-velocity intersection with the maser range?','primary_case':cases[0]['case_id'],'primary_denominator':1,'cases':cases,'inputs':inputs,'malt90_path':'cache/n1/malt90_rathborne2016.csv','radio_records_path':'artifacts/native_mmb_position_analysis_20261013/radio_records.json.gz','raw_radio_path':'artifacts/native_mmb_position_acquisition_20261013/catalog.dat','required_columns':columns,'tracers':{'N2HP':{'detection':'Y','fit_mode':3},'H13COP':{'detection':'Y','fit_mode':1}},'line_band_halfwidth':'0.5*FWHM+3*e_Vlsr+1.5*e_FWHM+0.06 km/s','radio_band':'[VL-0.14+shift,VH+0.14+shift] km/s','zero_point_shift_sensitivity_km_s':[-1,0,1],'zero_point_shifts_are_calibration_bounds':False,'primary_rule':'Positive common intersection of all three eligible bands at shift zero; numerical boundary abs(overlap)<=1e-10 is indeterminate','quoted_errors_zero_retained_as_rounded_values':True,'eligibility':'Native D=Y; registered NG; finite Vlsr, nonnegative quoted errors, positive FWHM; unique exact fixed ID and within30arcsec of case','missing_eligibility_rule':'Primary compatible/gate null, not false or starlessness','native_molecular_alternatives':'Retain all original rows within30arcsec of each fixed centre plus every fixed-ID instance; exact original fields and string ordinals','case_and_data_consumption':'Retrospective source-specific diagnosis. Existing radio selection, line products and model-feature widths consumed; no fresh held-out physical truth. Comparison rule frozen before this new join/readout.','stellar_velocity':'unmeasured','systematic_velocity_calibration':'not validated; literal published numeric comparison only','physical_membership_from_compatibility':False,'models_changed':False,'resources':{'cpu_threads':1,'gpu':False,'per_stage_mib':1,'per_stage_seconds':600,'sampled_rss_mib':256,'reserve_gib':5,'complete_packet_mib':4,'cumulative_seconds':1800},'stop':'One verified offline report; no fit, new observations, network retry, model update, N20/c6828/archive restart or automatic successor.'}
for path,content in [('artifacts/radio_gas_velocity_registration_20261013.json',reg),('artifacts/radio_gas_velocity_authoring_20261013/synthetic_controls.json',{'synthetic_controls_passed':True,'checks':['resolved_hyperfine_mode_not_multiple_velocity_clouds','two_tracer_common_intersection','disjoint_velocity_rejection','pairwise_only_false_positive_rejection','missing_errors_unmeasured','wrong_fit_mode_unsupported','rounded_zero_errors_retained','RA_wrap'],'native_measurement_readout':False})]:
 p=ROOT/path;assert not p.exists();p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(content,indent=2)+'\n')
print(json.dumps({'registration_created':True,'primary_denominator':1,'context_cases':3,'synthetic_controls_passed':True,'native_line_velocities_read':False}))
