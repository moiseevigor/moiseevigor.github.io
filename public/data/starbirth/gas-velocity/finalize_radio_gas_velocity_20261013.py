"""Source-bound final report and explicit post-read metadata correction; no new experiment."""
import argparse,copy,gzip,hashlib,json,math,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REV='74a45269'
REG='artifacts/radio_gas_velocity_registration_20261013.json'
ANALYSIS='artifacts/radio_gas_velocity_analysis_20261013'
VERIFY='artifacts/radio_gas_velocity_verification_20261013'
REPORT='docs/RADIO_GAS_VELOCITY_RESULTS_20261013.md'
CORRECTED='artifacts/radio_gas_velocity_corrected_assessment_20261013.json'
CHECKPOINT='artifacts/radio_gas_velocity_checkpoint_20261013.json'
CODE='research/finalize_radio_gas_velocity_20261013.py'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads((ROOT/p).read_text())
def produce():
 assert shutil.disk_usage(ROOT).free>5*1024**3
 freeze=subprocess.check_output(['git','rev-parse',REV],cwd=ROOT,text=True).strip()
 reg=load(REG);s=load(ANALYSIS+'/summary.json');v=load(VERIFY+'/verification.json')
 for p in [REG,'docs/RADIO_GAS_VELOCITY_PROTOCOL_20261013.md','research/analyze_radio_gas_velocity_20261013.py','research/verify_radio_gas_velocity_20261013.py']:
  assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',freeze+':'+p],cwd=ROOT),p
 for x in reg['inputs']:
  p=ROOT/x['path'];assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],x['path']
 assert v['verified'] and v['fixed_case_line_assessments_checked']==6 and v['shift_scenarios_checked']==9
 assert s['registration_sha256']==v['registration_sha256']==sha(ROOT/REG)
 assert v['summary_sha256']==sha(ROOT/(ANALYSIS+'/summary.json')) and s['native_records_sha256']==v['native_records_sha256']==sha(ROOT/(ANALYSIS+'/native_records.json.gz'))
 assert s['primary_eligible'] and s['primary_compatible'] is True and not s['physical_validation'] and not s['models_changed']
 records=json.loads(gzip.decompress((ROOT/(ANALYSIS+'/native_records.json.gz')).read_bytes()))['native_rows']
 corrected=[]
 for case in s['cases']:
  matches=[r for r in records if r['source_row_ordinal']==case['source_row_ordinal']];assert len(matches)==1
  row=matches[0]['native_fields'];assert case['native_velocity_component']==row['Vc'] and case['native_name']==row['Name']
  # Explicitly correct only the metadata label. Consensus velocity did not enter
  # any line band or primary/sensitivity calculation in the frozen worker.
  assert math.isfinite(float(row['Vc'])) and row['Name'].endswith(('_S','_A','_B'))
  item=copy.deepcopy(case);item['native_consensus_velocity_field']=item.pop('native_velocity_component');item['native_velocity_component_suffix']=row['Name'][-1];corrected.append(item)
 annotation={'schema':'radio-gas-velocity-corrected-assessment/1','frozen_summary_sha256':sha(ROOT/(ANALYSIS+'/summary.json')),'original_summary_preserved':True,'correction_timing':'post-read metadata correction','changed_measurements_or_equations':False,'mistyped_field':'native_velocity_component','literal_source_field':'Vc','correct_meaning':'catalogue consensus gas velocity in km/s; physical component designation comes from native Name suffix','definition_source':'https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf#page=7','cases':corrected,'physical_validation':False,'new_stars':0,'new_births':0}
 guards={}
 for name in ['registration_controls','analysis','verification']:
  path='artifacts/radio_gas_velocity_'+name+'_20261013';g=load(path+'/resource_monitor.json')
  assert g['completed'] and g['child_exit_code']==0 and g['stop_reason'] is None
  assert g['minimum_observed_free_bytes']>5*1024**3 and g['peak_sampled_worker_rss_bytes']<=256*1024**2 and g['elapsed_seconds']<=600
  size=sum(p.stat().st_size for p in (ROOT/path).rglob('*') if p.is_file());assert size<1024**2
  guards[name]={k:g[k] for k in ['elapsed_seconds','peak_sampled_worker_rss_bytes','minimum_observed_free_bytes']};guards[name]['stage_bytes']=size
 p=corrected[0];assert p['case_id']=='HIGALBM330.8814-0.3656' and p['primary_case']
 assert [x['compatible'] for x in p['scenarios']]==[True,True,False]
 table=[]
 for x in corrected:
  for t in x['lines']:
   f=t['native_fields'];band=t['velocity_band_km_s']
   table.append(f"| {x['malt90_id']} | {t['tracer']} | {f['Vlsr']} | {f['e_Vlsr']} | {f['FWHM']} | {f['e_FWHM']} | [{band[0]:.4f}, {band[1]:.4f}] |")
 scenarios='\n'.join(f"| {x['case_id']} | {x['radio_to_clump_arcsec']:.3f} | "+' | '.join(('overlap ' if r['compatible'] else 'gap ')+f"{abs(r['overlap_km_s']):.4f}" for r in x['scenarios'])+' |' for x in corrected)
 report=f'''# A marginal gas-velocity overlap does not establish the radio marker's membership

13 October 2026. The independently checked frozen **one-case literal velocity
criterion passes**, but its scientific interpretation is weak: only **0.1970 km/s**
of common overlap connects the historical maser interval and both broadened
dense-gas bands. The declared +1 km/s radio-shift scenario removes that overlap.
This is tentative regional gas context, not confirmed physical association,
source ownership, a young-star classification or independent detector validation.

## Fixed primary and measured values

The primary remains HIGALBM330.8814-0.3656, its original molecular record
AG1532 (`AGAL330.879-00.367_S`) and known maser 330.878-0.367, ordinal
`VIII/96/catalog.dat:000307`. The maser is 12.520 arcsec from the Hi-GAL centre
and 17.501 arcsec from the fixed best infrared point. AG1532 is
{p['malt90_to_clump_arcsec']:.3f} arcsec from the centre. Neither this context radius
nor the molecular beam establishes a physical clump boundary or ownership.

The maser's native range is [-60.0, -58.0] km/s; its MX/SC peaks are -59.2/-59.3.
N2H+ and H13CO+ centroids are **-62.443 and -62.566 km/s** with quoted errors
0.077 and 0.133; widths are 4.004 and 3.938 km/s. The peaks differ from the
centroids by 3.243/3.366 km/s. Both tracer centroids agree closely with each other,
but the maser peak lies outside both registered gas bands. The passing statistic
is **edge overlap**, not equality of peak or systemic velocities.

| Native molecular ID | Tracer | Centroid km/s | Quoted error | FWHM km/s | Width error | Declared band km/s |
| --- | --- | ---: | ---: | ---: | ---: | --- |
{chr(10).join(table)}

All six fixed-case line fits meet the registered availability/fit rules: native
Y detections, resolved-hyperfine NG=3 for N2H+ and single-Gaussian NG=1 for
H13CO+. Resolved hyperfine structure is not three separate gas clouds.
Every nearby molecular row and full original native field remains retained;
**{v['native_molecular_records_checked']}** distinct native rows enter the context ledger.
The third/second cases remain secondary; they were never substituted as primary.

## Primary versus sensitivity and secondary context

The frozen gas halfwidth was FWHM/2 + 3×quoted centroid error + 1.5×quoted width
error + 0.06 km/s. The radio range was padded by 0.14 km/s. These are declared
linewidth/error/channel/rounding conventions, **not confidence bounds** or
validated systematic errors. We require a common intersection of all three
bands, not merely two pairwise radio matches. In the first field the common
interval is [-60.1400, -59.9430] km/s. All original comparison rules remain fixed.

| Case | Radio-centre offset arcsec | Radio shift -1 km/s | Zero shift (primary convention) | Radio shift +1 km/s |
| --- | ---: | --- | --- | --- |
{scenarios}

The ±1 shifts were declared sensitivity scenarios before readout; they are
**not measured calibration offsets or guaranteed uncertainty bounds**. The first
field fails the +1 scenario, so no all-scenario robustness is established. The
third field shows a tiny 0.0685-km/s zero-shift overlap, despite its nearest marker
being 79.066 arcsec from the centre. That secondary result illustrates why a
velocity overlap cannot replace spatial or physical association. The second
field's bands do not overlap in any declared scenario; this is no starlessness
result or exclusion of unobserved radio/young sources.

No stellar velocity was measured. Doppler/LSR zero points, source errors,
rest-frequency/epoch conventions, gas displacement, distance and chance
alignment were not independently calibrated. The catalogue fits summarize a
large beam and cannot assign gas to the selected infrared point. No spectrum,
new observation or native image ownership measurement was acquired or fitted.

## Explicit metadata correction, original output retained

The frozen worker labelled literal `Vc` as `native_velocity_component`; that
name is wrong. Rathborne et al., catalogue section 4, defines Vc as **consensus
gas velocity**, while the S/A/B component designation is the native Name suffix.
The report generator independently checks exact raw fields and supplies an
[additive corrected assessment](../{CORRECTED}): consensus values remain the same
literal strings and suffixes are reported separately. Original summary/code/check
bytes remain intact. This post-read label correction changes no measurement,
selection, band, scenario, primary decision or model. Vc did not enter the test.
It is a correction of presentation semantics, not a new scientific amendment.

## Verification, resources and place against the goal

The registration and both implementations were committed at `{freeze}` before
this new velocity join. All inputs remain hash-identical. Cases, historical
radio fields, chemistry references and line-width features are consumed evidence;
this is a retrospective source-specific diagnosis, not untouched physical truth.
The worker used raw cached CSV and floating-point arithmetic. A separate checker
used original fixed-width radio fields, raw molecular rows, Decimal interval
arithmetic and independent Astropy angles, importing no worker. It verified all
{v['native_molecular_records_checked']} retained native rows, six line assessments and nine shift scenarios.
This establishes software reproduction, not new physical validation.

Controls/readout/check guards completed with exit zero and no resource stop.
Observed minimum free disk was {min(g['minimum_observed_free_bytes'] for g in guards.values())/1024**3:.2f} GiB;
independent checking took {guards['verification']['elapsed_seconds']:.2f} seconds with
{guards['verification']['peak_sampled_worker_rss_bytes']/1024**2:.2f} MiB sampled RSS.
Short-worker samples may miss transient peaks. Each stage stayed below 1 MiB;
the complete code/report/evidence packet is below 4 MiB. No network acquisition,
paid cloud work, model fit, other-process cancellation or original-input deletion
occurred. The NEOWISE transport stop, N20/c6828 and E29–E160 remain closed.

All old results remain: embedding 14/27 versus nonlinear 15/27 at equal 18
reviews on consumed chemistry proxies; original Spitzer 0/3, cadence 3/27 versus
14 and uncertainty 333/800 failed gates. All 19,328 IDs and 19,066 unknowns,
models/scores and every prior alternative remain unchanged. Infrared occurrence
is unmeasured; hypothetical 814 support is unvalidated; 9–25%/45–55% scenarios
remain descriptive sensitivity, not confidence bounds or physical lifetimes.
**No new star, confirmed birth, physical precision/recall or robust detector**
is established. The full goal remains active and unmet.

This unit ends with the verified marginal-overlap conclusion and semantic
correction. It authorizes no relaxed threshold, tracer substitution, acquisition,
fit or automatic successor. Results are local/unpublished until a separate
publication or app receipt exists; the earlier radio-position article stays valid.

Evidence: [frozen protocol](RADIO_GAS_VELOCITY_PROTOCOL_20261013.md),
[registration](../{REG}), [all original nearby native rows](../{ANALYSIS}/native_records.json.gz),
[unchanged original readout](../{ANALYSIS}/summary.json),
[independent verification](../{VERIFY}/verification.json),
[corrected field semantics](../{CORRECTED}), [final checkpoint](../{CHECKPOINT}).
Definitions: [MALT90 catalogue sections 3–4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf),
[MMB III](https://doi.org/10.1111/j.1365-2966.2011.19383.x),
[native field contract](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VIII/96?format=html&tex=true).
'''
 paths=[REG,'docs/RADIO_GAS_VELOCITY_PROTOCOL_20261013.md',CODE,'research/analyze_radio_gas_velocity_20261013.py','research/verify_radio_gas_velocity_20261013.py']
 for name in ['authoring','registration_controls','analysis','verification']:
  paths.extend(str(p.relative_to(ROOT)) for p in sorted((ROOT/('artifacts/radio_gas_velocity_'+name+'_20261013')).rglob('*')) if p.is_file())
 evidence=[dict(path=p,bytes=(ROOT/p).stat().st_size,sha256=sha(ROOT/p)) for p in paths]
 annotated=(json.dumps(annotation,indent=2)+'\n').encode();reported=report.encode()
 checkpoint={'schema':'radio-gas-velocity-final-checkpoint/1','registration_revision':freeze,'unit_complete':True,'independent_verification_passed':True,'primary_denominator':1,'primary_eligible':True,'primary_rule_met':True,'primary_common_overlap_km_s':corrected[0]['scenarios'][1]['overlap_km_s'],'primary_shift_support':[True,True,False],'robust_all_declared_shifts':False,'physical_validation':False,'models_changed':False,'new_stars':0,'new_births':0,'consumed_source_diagnosis':True,'stellar_velocity':'unmeasured','metadata_label_correction_post_read':True,'original_readout_preserved':True,'report_path':REPORT,'report_sha256':hashlib.sha256(reported).hexdigest(),'corrected_assessment_path':CORRECTED,'corrected_assessment_sha256':hashlib.sha256(annotated).hexdigest(),'frozen_inputs':reg['inputs'],'evidence':evidence,'resources':guards,'goal_status':'active_unmet','publication':'local_unpublished','automatic_successor_authorized':False}
 checked=(json.dumps(checkpoint,indent=2)+'\n').encode();size=len(annotated)+len(reported)+len(checked)+sum(x['bytes'] for x in evidence);assert size<4*1024**2
 return {REPORT:reported,CORRECTED:annotated,CHECKPOINT:checked},size
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args();outputs,size=produce()
 for path,data in outputs.items():
  p=ROOT/path
  if args.write:assert not p.exists();p.write_bytes(data)
  else:assert p.read_bytes()==data,path
 print(json.dumps({'final_report_and_metadata_correction_verified':True,'complete_packet_bytes':size,'physical_validation':False}))
