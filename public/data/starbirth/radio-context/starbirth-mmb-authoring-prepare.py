"""Register a distinct radio/infrared position diagnostic before catalogue readout."""
import ast,hashlib,importlib.util,json,shutil,subprocess
from datetime import datetime,timezone
from pathlib import Path
root=Path('/Users/igor/Work/me/starbirth-search');temp=Path('/private/tmp')
assert shutil.disk_usage(root).free>5*1024**3+4*1024**2
names=['acquire_native_mmb_positions_20261013.py','analyze_native_mmb_positions_20261013.py','verify_native_mmb_positions_20261013.py']
modules={}
for name in names:
 p=temp/name;ast.parse(p.read_text());spec=importlib.util.spec_from_file_location(name[:-3],p)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);modules[name]=module
worker=modules[names[1]];checker=modules[names[2]]
# Width-aligned synthetic positions, including a negative zero degree field.
for ra,dec in [('23 59 59.99','-00 00 00.1'),('00 00 00.00','+89 59 59.9'),('16 10 20.98','-52 05 54.6')]:
 line=[' ']*114;line[:14]=list('000.001-00.001')
 for start,value in [(16,ra[:2]),(19,ra[3:5]),(22,ra[6:]),(28,dec[0]),(29,dec[1:3]),(32,dec[4:6]),(35,dec[7:])]:
  line[start:start+len(value)]=list(value)
 raw=''.join(line);parsed=worker.parse((raw+'\n').encode())[0];a,b=checker.coordinates(raw)
 assert abs(a-parsed['ra_degrees'])<1e-10 and abs(b-parsed['dec_degrees'])<1e-10
 assert parsed['native_name_field']==raw[:14] and parsed['row_id']=='VIII/96/catalog.dat:000001'
 if dec.startswith('-00'):assert b<0
 for flag in ['+','a']:
  flagged=raw[:14]+flag+raw[15:];assert worker.parse((flagged+'\n').encode())[0]['position_or_thermal_flag']==flag
 coord=worker.SkyCoord(ra=a*worker.u.deg,dec=b*worker.u.deg)
 assert abs(coord.separation(worker.SkyCoord(ra=0*worker.u.deg,dec=0*worker.u.deg)).arcsec-checker.angle(a,b,0,0))<0.000002
cards_path='artifacts/native_glimpse_association_20261012/evidence_cards.json'
cards=json.loads((root/cards_path).read_text())['evidence_cases'];cases=[]
for card in cards:
 cases.append({'id':card['case_id'],'ra':card['parent_fields']['ra'],'dec':card['parent_fields']['dec'],
               'fixed_best_designation':card['geometrically_best_catalogue_record']['designation'],
               'alternatives':[{key:row[key] for key in ['designation','cntr','ra','dec']} for row in card['all_native_alternatives'] if row['kind']=='Catalog']})
inputs=[cards_path,'cache/e16/mmb_billington2019.csv','docs/RESEARCH_GOAL.md',
        'docs/MULTISURVEY_RESEARCH_PROGRAM_20261012.md','docs/ADVERSARIAL_REVIEW_20261006.md',
        'artifacts/native_profile_quality_checkpoint_20261013.json']
inventory=[{'path':p,'bytes':(root/p).stat().st_size,'sha256':hashlib.sha256((root/p).read_bytes()).hexdigest()} for p in inputs]
reg={'schema':'native-mmb-position-registration/1','created_utc':datetime.now(timezone.utc).isoformat(),
     'source_revision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
     'inputs':inventory,'cases':cases,'url':'https://cdsarc.cds.unistra.fr/ftp/VIII/96/catalog.dat',
     'metadata_head_preflight':{'http_status':200,'content_length':69855,'etag':'"110df-4f9bccb21cb00"','last_modified':'Mon, 19 May 2014 08:46:04 GMT','catalogue_body_read':False},
     'native_catalogue_positions_read_before_registration':False,'selection_consumed':True,
     'catalogue_consumption_history':'MMB/Billington references previously consumed; no claim of fresh held-out truth',
     'expected_native_rows':707,'maximum_native_row_width':114,
     'primary':'At least one of the three fixed best Catalog points has a flag-blank native MMB position within 1 arcsec, outside numeric boundary guard',
     'primary_is_projected_geometry_not_physical_validation':True,
     'rules':{'point_radius_arcsec':1,'numeric_boundary_guard_arcsec':0.00001,
              'secondary_context_radii_arcsec':[15,30],'native_primary_allowed_flag':' ',
              'independent_coordinate_tolerance_degrees':1e-10,'independent_angle_tolerance_arcsec':0.000002},
     'limits':{'requests':1,'retries':0,'response_bytes':131072,'timeout_seconds':60,'cpu_threads':1,
               'acquisition_stage_mib':1,'analysis_stage_mib':1,'verification_stage_mib':1,
               'combined_packet_mib':4,'worker_wall_seconds':600,'worker_rss_mib':256,'free_reserve_gib':5},
     'metadata_sources':['https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VIII/96?format=html&tex=true',
                         'https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/J/MNRAS/490/2779?format=html&tex=true'],
     'synthetic_controls_passed':['Native field offsets and string row identity','Negative zero declination',
                                  'Single-dish and possibly-thermal flags retained','Independent sexagesimal conversion and RA-wrap/polar separation'],
     'new_survey':False,'new_model_fit':False,'new_stars':0,'new_births':0,'restart_neowise_request':False,'restart_n20':False}
for name in names:
 p=root/'research'/name;assert not p.exists();shutil.copyfile(temp/name,p)
target=root/'artifacts/native_mmb_position_registration_20261013.json';assert not target.exists();target.write_text(json.dumps(reg,indent=2)+'\n')
protocol='''# Native MMB radio-marker comparison for the three retained infrared cases

13 October 2026. A distinct, bounded complementary-source diagnostic in the
accepted nine-stream program. The NEOWISE reliability request stays terminal
and unanswered; this does not retry it. The cached Billington table has only
Name/Clump/Dist, and its rounded Galactic names cannot establish one-arcsecond
counterpart geometry. Use the original MMB equatorial positions instead, retaining
all native instances/flags. Do not restart N20 or rerun E16's whole-parent maser
rates, CLIP validation or any archival E29–E160 branch.

## Question and fixed domain

Can a precise-position published radio star-formation marker distinguish the
same fixed infrared alternatives? Primary descriptive criterion: **at least one
of the three fixed best Catalog points** has a flag-blank native MMB catalogue
position within <=1 arcsec, outside a 0.00001-arcsec numerical boundary guard.
This is a projected-position criterion, not a significance test, calibrated
association probability, physical class, clump membership, discovery or birth.

Keep HIGALBM330.8814-0.3656, HIGALBM351.2258+0.6937 and
HIGALBM353.4272-0.3734, their original best records and all six distinct Catalog
alternatives. Archive aliases remain in the registered source cards; they are
not independent physical stars. The red alternative stays secondary and cannot
replace the best blue record after readout. Cases/old colours and MMB references
are consumed; this is no fresh representative validation cohort or new ranking
comparison. Native positions from the requested file have not been read before
registration. All 19,328 parent IDs, 19,066 unknowns, models/ranks and previous
primary gates remain unchanged. No feature or evaluation label is added to them.

## Exact original catalogue and acquisition

The official CDS VIII/96 native catalog.dat contains 707 rows, covering the
MMB catalogue instalments I–IV; I and III include the longitudes of these three
cases. It is a historical snapshot, not all present-day masers or proof of
complete detectability. A pre-registration HEAD returned HTTP 200 and a 69,855-
byte file; it read no source positions or body. Metadata fields/format and flags
were consulted from the official ReadMe before registration.

One GET of the exact registered static URL, no coordinate query/upload, retries,
redirects, fallbacks or pagination. TLS verification stays enabled. Preserve
complete raw bytes (cap 128 KiB), expected 707 ASCII rows, at most 114 characters
per row and >=39 characters for native coordinates. Timeout 60 seconds; corrupt
schema, contradictory coordinates, response cap, missing verification or resource
failure stops the unit and retains the prefix/terminal receipt. All registered
existing inputs must hash-identically match before execution. No image, spectrum
cube, new survey or paid cloud job is acquired. The 2019 Name/Clump/Dist cache is
hash-bound context only, not a source of precise positions or new labels.

## Measurement, identity and uncertainties

Parse the documented fixed-width J2000 sexagesimal positions and every native
flag/reference/velocity/flux field. Keep exact raw name fields, line hashes and
ordinal string IDs tied to the complete catalogue hash. Duplicate names remain
separate native instances; never choose a single record using Name as a unique
key or infer accurate coordinates from Galactic names. Multiple maser entries
are not multiple independently confirmed stars.

Compare all 707 rows to each of the six infrared Catalog points and three clump
centres. Preserve nearest row and all pairs within 1/15/30 arcsec, including flags.
For the primary one-arcsec marker, exclude '+' (only single-dish position) and
'a' (possibly thermal). A blank flag supplies only this conservative catalogue
eligibility, not a validated error bound. Coordinates describe radio-emitting
gas, not necessarily a star's centre. Numerical literal-sphere comparison does
not transform frames, propagate proper motion or calibrate positional errors.

No explicit position errors/epoch contract or parental velocity is available
in these registered inputs. Native radio velocity fields remain literal context;
there is no kinematic-membership comparison. The three clump-centre 15/30-arcsec
summaries and all non-best infrared alternatives are secondary positional context,
not assignments of radio emission to a star or proof of clump membership.

A missing close match does not exclude a young source: masers have a selected
activity window and finite sensitivity, and their gas can be displaced from a
stellar source. A close match adds projected radio evidence, but chance alignment,
cluster membership and physical youth still require source-specific assessment.
Report K/3 and the predefined geometric criterion alongside every ambiguity.
Do not infer a lifetime, physical precision/recall or a stellar birth, use radio
absence as a negative label, or count Catalogue/Archive/maser aliases as discoveries.

## Independent checks, bounds and stop

Freeze code/protocol/registration in Git before native catalogue readout. Synthetic
controls cover raw field offsets/string identity, negative-zero declination,
position/thermal flags and independent sexagesimal/RA-wrap/polar geometry. The
worker uses Astropy angles/separations. The checker imports neither Astropy nor
worker: raw field slices, Decimal sexagesimal coordinates and vector cross-product
angles verify all 707 records, every nearest/radius pair, flags and K/3. Coordinate
agreement must be <1e-10 degree and angular agreement <0.000002 arcsec; these are
software tolerances, not physical uncertainties. Check complete input/output hashes.

One CPU, no GPU; separate guarded acquisition/analysis/check stages at 1 MiB each,
600 seconds each, 256 MiB sampled RSS and 5 GiB reserve. Combined code/raw data/
receipts/report <=4 MiB and cumulative work <=30 minutes. Keep stops and all
original scientific inputs. Stop after the verified radio-position report.
No automatic query repair, relaxed radius/flag rule, source substitution, model
sweep or successor experiment follows. The full goal remains active and unmet.

## Primary sources

[Original MMB field/flag contract](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VIII/96?format=html&tex=true)
defines native positions, table dimensions, references and special flags.
[Billington catalogue context](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/J/MNRAS/490/2779?format=html&tex=true)
binds the already used radio stream to its dust-clump associations. This is a
source-specific contextual check, not independent held-out physical adjudication.
'''
target=root/'docs/NATIVE_MMB_POSITION_PROTOCOL_20261013.md';assert not target.exists();target.write_text(protocol)
author=root/'artifacts/native_mmb_position_authoring_20261013';assert not author.exists();author.mkdir()
shutil.copyfile(temp/'prepare_native_mmb_positions_20261013.py',author/'prepare.py')
(author/'README.md').write_text('Historical registration authoring and synthetic controls. The script retains its original absolute workspace/temporary source paths; use an isolated checkout and copies of the three retained research implementations for deliberate reproduction. Do not overwrite existing registrations or receipts. Only HTTP headers, not native source positions, were inspected before registration.\n')
(author/'synthetic_controls.json').write_text(json.dumps({'passed':True,'native_catalogue_body_read':False,'checks':reg['synthetic_controls_passed'],'source_sha256':{name:hashlib.sha256((root/'research'/name).read_bytes()).hexdigest() for name in names}},indent=2)+'\n')
print(json.dumps({'native_readout':False,'cases':3,'catalogue_alternatives':6,'planned_response_bytes_ceiling':131072,'synthetic_controls_passed':True}))
