"""Additive typed result/qualification record, preserving all previous scientific graphs."""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REV='65af1125'
NOTE='artifacts/graph/radio_gas_velocity_reviewed_supplement_20261013.json';STATE='docs/RESEARCH_STATE_20261013_GAS_VELOCITY.md'
def source(p,rev):
 b=subprocess.check_output(['git','show',rev+':'+p],cwd=ROOT);assert b==(ROOT/p).read_bytes(),p
 return dict(path=p,revision=rev,bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def run(write):
 assert shutil.disk_usage(ROOT).free>5*1024**3
 revision=subprocess.check_output(['git','rev-parse',REV],cwd=ROOT,text=True).strip()
 paths=['docs/RADIO_GAS_VELOCITY_RESULTS_20261013.md','artifacts/radio_gas_velocity_checkpoint_20261013.json','artifacts/radio_gas_velocity_corrected_assessment_20261013.json','artifacts/radio_gas_velocity_analysis_20261013/summary.json','artifacts/radio_gas_velocity_verification_20261013/verification.json','docs/RADIO_GAS_VELOCITY_PROTOCOL_20261013.md','artifacts/radio_gas_velocity_registration_20261013.json']
 c=json.loads((ROOT/paths[1]).read_text());assert c['unit_complete'] and c['independent_verification_passed'] and c['primary_rule_met'] and not c['robust_all_declared_shifts']
 prior=['artifacts/graph/'+p for p in ['research_graph.json','multisurvey_reviewed_supplement_20261012.json','temporal_missingness_reviewed_supplement_20261012.json','native_glimpse_reviewed_supplement_20261012.json','irac_colour_reviewed_supplement_20261012.json','irac_colour_alternative_reviewed_note_20261012.json','native_neowise_header_operational_note_20261013.json','native_profile_quality_transport_note_20261013.json','native_mmb_position_reviewed_supplement_20261013.json']]
 note={'schema':'radio-gas-velocity-reviewed-supplement/1','source_revision':revision,'source_blobs':[source(p,revision) for p in paths],'preserved_prior_graph_blobs':[source(p,revision) for p in prior],
 'nodes':[{'id':'F:RGV20261013:conditional-overlap','type':'measured_result','status':'verified_literal_criterion_passed','label':'One fixed regional marker has only a narrow common velocity-band overlap','metrics':{'primary_denominator':1,'primary_eligible':True,'primary_rule_met':True,'common_overlap_km_s':c['primary_common_overlap_km_s'],'radio_shift_scenarios_km_s':[-1,0,1],'primary_shift_compatibility':c['primary_shift_support'],'robust_all_declared_shifts':False},'sources':paths[:5]},
 {'id':'C:RGV20261013:limits','type':'qualification','status':'physical_association_and_youth_unestablished','label':'Wing overlap is sensitive, not a confirmed clump or stellar association','text':'The +1 km/s declared shift removes overlap. Shifts are arbitrary sensitivity scenarios, not calibration bounds. The maser peak is outside both registered gas bands. No stellar velocity, calibrated association probability, physical youth, membership, birth or representative truth is established. Other two cases are secondary contextual examples, not verified unrelated controls. Case selection, radio and molecular measurements are consumed; no scores or old gates changed.','sources':paths[:5]},
 {'id':'C:RGV20261013:metadata','type':'metadata_correction','status':'verified_additive_post_read_correction','label':'Vc is consensus gas velocity; S/A/B designation is the native Name suffix','text':'The original output mislabels the literal Vc string as native_velocity_component. The additive corrected assessment fixes field meaning and preserves original summary/code/check bytes. Vc never entered any primary band or decision; no measurement or rule changed.','sources':paths[:5]}],
 'edges':[{'source':'C:RGV20261013:limits','target':'F:RGV20261013:conditional-overlap','relation':'qualifies'},{'source':'C:RGV20261013:metadata','target':'F:RGV20261013:conditional-overlap','relation':'qualifies'},{'source':'F:RGV20261013:conditional-overlap','target':'F:NMP20261013:regional-marker','relation':'qualifies','text':'Adds conditional velocity context to the already distinct radio position, never ownership of the best infrared point.'}],
 'core_and_prior_graphs_unchanged':True,'archive_not_merged':True,'models_changed':False,'physical_validation':False,'new_stars':0,'new_births':0,'goal_status':'active_unmet','publication':'local_unpublished','automatic_successor_authorized':False}
 state=f'''# Research checkpoint — marginal gas/radio velocity overlap, 13 October 2026

The previous goal turn was progress: source-specific native radio geometry was
completed and then published by separate upkeep. This turn adds a distinct
prospectively frozen offline gas-velocity comparison, independently verified
from the original cached CSV and raw radio fields. The complete long-term goal
remains active and unmet; operational delivery is not detector success.

[The new result](RADIO_GAS_VELOCITY_RESULTS_20261013.md), source revision
`{revision}`, has one fixed primary: HIGALBM330.8814-0.3656, AG1532 and
historical maser 330.878-0.367. Its declared literal common-band criterion passes
with only **0.1970 km/s** overlap. The +1 km/s shift scenario removes overlap.
Two gas centroids (-62.443/-62.566 km/s) differ from the maser peak (-59.2 km/s),
which lies outside both registered gas bands. This is marginal wing overlap,
not demonstrated agreement of peak/systemic velocities or physical membership.

All six registered tracer fits across three fixed contextual cases are available;
three exact original native records and nine shift scenarios were independently
checked. The other two cases are secondary and cannot replace the primary.
Intervals/shifts are descriptive, not confidence or calibration bounds. No
stellar velocity, source ownership, youth or fresh representative truth is known.
The radio marker still lies 17.501 arcsec from the best infrared point; its nearby
regional context cannot be assigned to that point from the old clump rank.

The original output's Vc label was wrong. Its exact strings and frozen code/output
remain preserved; the separate corrected assessment identifies consensus gas
velocity and the actual native Name suffix. No test or measurement changed.
[The reviewed KG supplement](../{NOTE}) binds full sources and preserves all
nine earlier core/supplement/operational graphs and the closed archive.

Controls/readout/check completed without a resource stop. Independent checking
used about 79 MiB sampled RSS and 3.10 seconds; at least 62.33 GiB free was observed.
The complete new packet is about 91 KiB. RSS sampling does not guarantee actual
peaks. No observations, paid cloud work, fit, network retry or source deletion.
Only byte-identical authoring copies may be removed after their code is retained.

Old models/19,328 identities/19,066 unknowns remain unchanged. Embedding 14/27
versus nonlinear 15/27 at equal 18 reviews still fails the benefit gate. Original
Spitzer 0/3, cadence 3/27 versus14 and uncertainty333/800 gates remain failed;
occurrence is unmeasured, 814 hypothetical support unvalidated and 9–25%/45–55%
scenarios descriptive. No physical precision/recall, confirmed new star/birth
or robust detector has been achieved. NEOWISE quality transport, N20/c6828 and
E29–E160 remain closed. Atlas/E155/E121 restrictions remain unchanged.

This completed bounded unit stops here. Its new results are local/unpublished
until a separate source-bound blog/app receipt exists. Continued work needs a
distinct justified frozen question that can change source ownership/physical
assessment, not more scores or an automatic threshold/tracer/data expansion.
The unavailable representative physical validation remains an actual goal gap.
'''
 for p,b in [(NOTE,(json.dumps(note,indent=2)+'\n').encode()),(STATE,state.encode())]:
  target=ROOT/p
  if write:assert not target.exists();target.write_bytes(b)
  else:assert target.read_bytes()==b,p
 print(json.dumps({'source_bound_reviewed_gas_note_verified':True,'prior_graphs_preserved':9,'physical_membership_unestablished':True}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');a=p.parse_args();run(a.write)
