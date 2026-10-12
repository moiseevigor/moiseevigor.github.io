"""Reproduce the source-bound radio diagnostic report and complete checkpoint."""
import argparse,gzip,hashlib,json,re,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REG='artifacts/native_mmb_position_registration_20261013.json'
PREFIX='artifacts/native_mmb_position_'
REPORT='docs/NATIVE_MMB_POSITION_RESULTS_20261013.md'
CHECKPOINT='artifacts/native_mmb_position_checkpoint_20261013.json'
CODE='research/finalize_native_mmb_positions_20261013.py'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def load(path):return json.loads((ROOT/path).read_text())
def produce():
 assert shutil.disk_usage(ROOT).free>5*1024**3
 registration=load(REG);summary=load(PREFIX+'analysis_20261013/summary.json')
 verification=load(PREFIX+'verification_20261013/verification.json')
 acquisition=load(PREFIX+'acquisition_20261013/acquisition.json')
 freeze=subprocess.check_output(['git','rev-parse','bc23a8c7'],cwd=ROOT,text=True).strip()
 for p in [REG,'docs/NATIVE_MMB_POSITION_PROTOCOL_20261013.md',
           'research/acquire_native_mmb_positions_20261013.py','research/analyze_native_mmb_positions_20261013.py',
           'research/verify_native_mmb_positions_20261013.py']:
  assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',freeze+':'+p],cwd=ROOT),p
 for item in registration['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256']
 assert acquisition['complete'] and acquisition['response_bytes']==69855 and acquisition['native_rows']==707
 assert verification['verified'] and verification['angular_pairs_recomputed']==6363
 assert acquisition['registration_sha256']==summary['registration_sha256']==verification['registration_sha256']==sha(ROOT/REG)
 raw_path=ROOT/(PREFIX+'acquisition_20261013/catalog.dat')
 assert acquisition['sha256']==summary['catalogue_sha256']==verification['catalogue_sha256']==sha(raw_path)
 assert verification['summary_sha256']==sha(ROOT/(PREFIX+'analysis_20261013/summary.json'))
 assert summary['radio_records_sha256']==verification['radio_records_sha256']==sha(ROOT/(PREFIX+'analysis_20261013/radio_records.json.gz'))
 assert verification['fixed_best_projected_support']==summary['fixed_best_projected_support']==0
 assert summary['fixed_best_denominator']==3 and not summary['primary_geometric_criterion_met']
 assert not summary['physical_validation'] and not summary['independent_held_out_physical_truth']
 # Bind prior cone metadata as post-read interpretive context, not a new test.
 old_query_path='artifacts/native_glimpse_registration_20261012.json'
 assert (ROOT/old_query_path).read_bytes()==subprocess.check_output(['git','show',freeze+':'+old_query_path],cwd=ROOT)
 old_query=load(old_query_path)['requests'][0]
 assert old_query['case']==registration['cases'][0]['id'] and old_query['kind']=='Catalog'
 cone=re.search(r"CIRCLE\('ICRS',([0-9.]+),(-?[0-9.]+),([0-9.e+-]+)\)",old_query['query'])
 assert cone is not None
 a,b,radius=map(float,cone.groups())
 assert a==float(registration['cases'][0]['ra']) and b==float(registration['cases'][0]['dec']) and abs(radius*3600-12)<1e-12
 records=json.loads(gzip.decompress((ROOT/(PREFIX+'analysis_20261013/radio_records.json.gz')).read_bytes()))['records']
 lookup={r['row_id']:r for r in records};assert len(lookup)==707
 guards={}
 stages=['registration_controls','acquisition','analysis','verification']
 for name in stages:
  stage=PREFIX+name+'_20261013';guard=load(stage+'/resource_monitor.json')
  assert guard['completed'] and guard['child_exit_code']==0 and guard['stop_reason'] is None
  assert guard['minimum_observed_free_bytes']>5*1024**3+1024**2
  assert guard['peak_sampled_worker_rss_bytes']<=256*1024**2 and guard['elapsed_seconds']<=600
  size=sum(p.stat().st_size for p in (ROOT/stage).rglob('*') if p.is_file());assert size<1024**2
  guards[name]={k:guard[k] for k in ['elapsed_seconds','peak_sampled_worker_rss_bytes','minimum_observed_free_bytes']}
  guards[name]['retained_stage_bytes']=size
 table=[]
 for case in summary['cases']:
  centre=next(p for p in case['assessments'] if p['point_kind']=='clump_centre')
  best=next(p for p in case['assessments'] if p['fixed_best'])
  nearest=lookup[best['nearest_maser']['maser_row_id']]
  table.append(f"| {case['case_id']} | {best['point_id']} | {nearest['name']} | {best['nearest_maser']['separation_arcsec']:.3f} | {centre['nearest_maser']['separation_arcsec']:.3f} |")
 first=summary['cases'][0];centre=first['assessments'][0];best=next(p for p in first['assessments'] if p['fixed_best'])
 radio=lookup[centre['nearest_maser']['maser_row_id']]
 assert radio['row_id']=='VIII/96/catalog.dat:000307' and radio['name']=='330.878-0.367'
 assert sum(len(p['masers_within_1_arcsec']) for case in summary['cases'] for p in case['assessments'])==0
 red=next(p for p in summary['cases'][2]['assessments'] if p['point_id']=='SSTGLMC G353.4284-00.3731')
 report=f'''# Nearby radio activity does not identify the best infrared counterpart

13 October 2026. The frozen three-case comparison is independently verified:
**0/3 fixed best infrared records** have a qualifying original MMB maser position
within one arcsecond. **None of the six retained infrared alternatives** has any
native catalogue maser position within that radius. The predefined projected-
geometry criterion is not met. This is no physical starlessness result or
exclusion of embedded protostars.

The first field has useful, separate positive context: historical radio maser
**{radio['name']}** is **{centre['nearest_maser']['separation_arcsec']:.3f} arcsec**
from the dust-clump centre, but **{best['nearest_maser']['separation_arcsec']:.3f}
arcsec** from the best infrared point. Regional molecular/radio activity cannot
be assigned to that point merely because the region received a high clump rank.

## Same cases, native coordinate fields

| Clump | Fixed best infrared record | Nearest native maser name | Point-to-maser, arcsec | Clump-centre-to-nearest-maser, arcsec |
| --- | --- | --- | ---: | ---: |
{chr(10).join(table)}

For the third field, the distinct red alternative's nearest radio record is
{red['nearest_maser']['separation_arcsec']:.3f} arcsec away. It is still separate from
the blue best counterpart and its time-series measurements; neither gains a
close maser association. Every alternative, nearest radio record, native flag
and pair within 1/15/30 arcsec is retained in the source assessment.

The earlier cone is bound by its [original query registration](../{old_query_path});
this metadata is separately identified as post-read interpretive context.

The first radio record is native ordinal string `{radio['row_id']}` in the
hash-bound historical catalogue, at literal J2000 coordinates
**RA {radio['ra_degrees']:.9f} deg, Dec {radio['dec_degrees']:.9f} deg**. Its original
reference field is retained. Radio positions describe emitting gas; ordinal/name
aliases are not identifiers of independently confirmed stars. Epoch-dependent
activity, physical membership and stellar identity are not measured here.

## Post-read coverage qualification and interpretation

The 12.520-arcsec first-field offset is just outside the earlier **12-arcsec
GLIMPSE query around the clump centre**. This is a post-read coverage observation,
not a new primary criterion, changed search radius or substitute source. The old
catalogue selection/negative gates remain frozen. A catalogue counterpart outside
that original cone was not tested in the earlier infrared selection, and this
unit has not acquired one. The first field has a nearby published radio marker;
we have not established that it belongs to this Hi-GAL clump or caused its
molecular activity or the matched infrared point's temporal measurements.

Neither the 15/30-arcsec contextual circles nor a large molecular beam is a
physical clump boundary. This potential confusion explanation still needs a
separate source-specific test. Positional proximity alone cannot attribute
emission, establish a star's evolutionary stage or count a discovery.

Radio absence at an infrared point does not exclude young stars: the historical
maser sample traces a selected activity window, has finite sensitivity, and gas
can be displaced from the star. This 707-record I–IV snapshot is not all modern
masers. Blank position flags supplied only the registered geometric eligibility;
no quoted position-error or source-epoch contract was available. We performed no
frame/proper-motion transformation, calibrated probability or parental-velocity
membership comparison. Native velocity/flux/reference fields remain exact context.

## Independent verification and resources

The protocol, code, exact cases and synthetic controls were frozen at
`{freeze}` before any native catalogue position readout. One public static-file
GET returned **69,855 bytes / 707 records**, with no coordinate query/upload,
retry, redirect, image/cube request, paid compute or new survey. Every registered
existing input remains hash-identical. The terminal NEOWISE request, N20 and
c6828 remain closed; none was restarted or repaired by this radio comparison.

The worker used Astropy angles and separations. The independent checker imports
no worker/Astropy code: direct raw slices, Decimal sexagesimal conversion and
vector cross-product distances recomputed **all 707 records and 6,363 angular
pairs**, native flags/fields, nearest/radius lists and the primary decision.
Maximum coordinate difference is {verification['maximum_coordinate_difference_degrees']:.3g} degree,
a software consistency value, not scientific positional accuracy.

All four guarded stages (synthetic registration controls, acquisition, readout
and independent check) exited zero without a resource stop, each in about one
second, with at least {min(g['minimum_observed_free_bytes'] for g in guards.values())/1024**3:.2f} GiB observed free disk.
Their short lifetimes mean RSS samples miss possible transient peaks; do not
claim small actual peak memory from them. Each stage is below 1 MiB and the
complete code/data/report/receipt packet below 4 MiB. Original inputs are preserved.

Evidence: [frozen protocol](NATIVE_MMB_POSITION_PROTOCOL_20261013.md),
[registration](../{REG}), [complete original catalogue](../{PREFIX}acquisition_20261013/catalog.dat),
[all parsed native fields](../{PREFIX}analysis_20261013/radio_records.json.gz),
[source assessment](../{PREFIX}analysis_20261013/summary.json),
[independent check](../{PREFIX}verification_20261013/verification.json),
[final checkpoint](../{CHECKPOINT}). Primary schema/reference sources are linked
in the frozen protocol; original names/flags and repeated native instances remain intact.

## Position against the full goal and stop

The measured conclusion is source-specific: nearby historical radio-marker
context in the first field does **not** coincide with its best infrared record
at the frozen scale. The other best/alternative points also lack such a match.
This qualifies the use of coarse molecular activity and clump scores as apparent
support for a particular point source. It supplies no independent held-out youth
label, physical class or physical negative. MMB references and case selection are
consumed, and the global 19,328-parent/19,066-unknown ledger remains unchanged.

All original models and gates stay fixed: embedding 14/27 versus nonlinear 15/27
at 18 reviews on consumed chemistry proxies; failed original Spitzer 0/3,
cadence-majority 3/27 and uncertainty 333/800 gates. The new radio criterion is
distinct from them. Infrared occurrence remains unmeasured, hypothetical 814
independent-bin support unvalidated, and 9–25%/45–55% scenarios descriptive
sensitivity rather than confidence bounds or lifetimes. No new star, stellar
birth, physical precision/recall or robust detector is established.

This unit stops with its verified projected comparison and qualifications.
No expanded infrared cone, source substitution, relaxed match/flag criterion,
new fit or automatic successor experiment follows. The full goal stays active
and unmet. Results are local until a separate publication/deployment receipt
exists; no private Atlas action is authorized.
'''
 paths=[REG,'docs/NATIVE_MMB_POSITION_PROTOCOL_20261013.md',CODE,old_query_path,
        'research/acquire_native_mmb_positions_20261013.py','research/analyze_native_mmb_positions_20261013.py',
        'research/verify_native_mmb_positions_20261013.py']
 for suffix in ['registration_controls','acquisition','analysis','verification','authoring']:
  paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT/(PREFIX+suffix+'_20261013')).rglob('*')) if p.is_file()]
 evidence=[{'path':p,'bytes':(ROOT/p).stat().st_size,'sha256':sha(ROOT/p)} for p in sorted(paths)]
 checkpoint={'schema':'native-mmb-position-final-checkpoint/1','registration_revision':freeze,
             'unit_complete':True,'goal_status':'active_unmet','independent_verification_passed':True,
             'physical_validation':False,'new_stars':0,'new_births':0,'models_changed':False,
             'fixed_best_projected_support':0,'fixed_best_denominator':3,'primary_geometric_criterion_met':False,
             'all_infrared_alternatives_within_1_arcsec':0,'infrared_alternative_denominator':6,
             'first_field_known_radio_record':radio,'first_field_clump_offset_arcsec':centre['nearest_maser']['separation_arcsec'],
             'first_field_best_infrared_offset_arcsec':best['nearest_maser']['separation_arcsec'],
             'first_field_radio_outside_original_12_arcsec_infrared_query':True,
             'coverage_qualification_is_post_read':True,'radio_absence_is_not_physical_negative':True,
             'post_read_coverage_context':{'path':old_query_path,'revision':freeze,'sha256':sha(ROOT/old_query_path),'role':'Original 12-arcsec query metadata, not a new primary measurement'},
             'source_membership_stage_and_birth_unestablished':True,'reported_cases':summary['cases'],
             'native_rows':707,'angular_pairs_checked':6363,'selection_and_references_consumed':True,
             'neowise_request_restarted':False,'n20_restarted':False,'old_scientific_gates_preserved':True,
             'report_path':REPORT,'report_sha256':hashlib.sha256(report.encode()).hexdigest(),
             'evidence':evidence,'resources':guards,'publication':'local_unpublished',
             'automatic_successor_experiment_authorized':False}
 checkpoint_bytes=(json.dumps(checkpoint,indent=2)+'\n').encode()
 packet=sum(item['bytes'] for item in evidence)+len(report.encode())+len(checkpoint_bytes)
 assert packet<4*1024**2
 return report.encode(),checkpoint_bytes,packet
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');a=p.parse_args();report,checkpoint,packet=produce()
 for name,data in [(REPORT,report),(CHECKPOINT,checkpoint)]:
  target=ROOT/name
  if a.write:assert not target.exists();target.write_bytes(data)
  else:assert target.read_bytes()==data
 print(json.dumps({'complete_radio_report_verified':True,'packet_bytes':packet,'physical_validation':False}))
