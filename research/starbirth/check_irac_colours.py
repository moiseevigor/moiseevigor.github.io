"""Check complete committed colour evidence, conditional scope and program-only presentation."""
import csv,hashlib,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACKET=ROOT/'public/data/starbirth/irac-colours';REV='106e2f842a903469f7529c54272cbf033509ba43';URL='/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/';PROGRAM='/astrophysics/2026/10/11/hidden-protostars-research-program/'
NOTE_REV='2d098311d6cb089455bc83bbad895fab635c8d8e';NOTE_NAMES={'alternative-note.md','starbirth-ic-secondary-alternative.json','summarize_irac_colour_alternative.py','starbirth-ic-alternative-knowledge-note.json','build_irac_alternative_knowledge_note.py'}
items=list(csv.DictReader((PACKET/'source-inventory.csv').open()));assert len(items)==len({r['public_file'] for r in items})==28
for r in items:
 data=(PACKET/r['public_file']).read_bytes();assert len(data)==int(r['bytes']) and hashlib.sha256(data).hexdigest()==r['sha256'] and r['source_revision']==(NOTE_REV if r['public_file'] in NOTE_NAMES else REV)
load=lambda name:json.loads((PACKET/('starbirth-ic-'+name+'.json')).read_text())
alt=load('secondary-alternative');assert alt['matched_visits']==0 and alt['supported_visits']==6 and alt['central_necessary_colours'] and not alt['robust_necessary_colour_support'] and alt['physical_stage']=='unknown'
s=load('summary');v=load('verification');c=load('checkpoint');cards=load('comparison-cards')['cards']
assert v['verified'] and c['verified'] and v['summary_sha256']==hashlib.sha256((PACKET/'starbirth-ic-summary.json').read_bytes()).hexdigest()
assert [s[k] for k in ['selected_cases','photometric_availability','central_necessary_support','robust_necessary_support','quoted_error_incompatible','unresolved_necessary_colours']]==[3,0,0,0,2,1]
assert not s['full_standard_classification_evaluated'] and not s['physical_validation'] and not s['original_ranking_changed'] and not s['envelopes_are_confidence_intervals'] and not s['missing_values_imputed'] and s['consumed_and_post_read']
assert c['original_parent']==19328 and c['original_unknown_proxy_states']==19066 and c['new_stars']==c['new_births']==0
assert len(load('all-records'))==12 and v['calculable_band_pairs_verified']==34
assert [next(x['colour_mag'] for x in case['colours'] if (x['band_a'],x['band_b'])==('3_6','4_5')) for case in s['case_assessments']]==[-.089,.134,-.011]
assert len(cards)==3 and all(x['physical_stage']=='unknown' and x['clump_membership']=='unestablished' and x['birth_status']=='not_established' for x in cards)
for x in cards:assert not x['historical_clump_proxy_rank']['new_glimpse_input_used'] and all(not m['calibrated_probability'] for m in x['historical_clump_proxy_rank']['models'].values())
stopped=load('pre-spawn-guard');assert not stopped['completed'] and stopped['child_exit_code'] is None and all(not x['workers'] for x in stopped['samples'])
assert load('analysis-resources')['completed'] and load('verification-resources')['completed'] and load('resume-amendment')['scientific_inputs_methods_thresholds_unchanged']
assert '\nlisted: false\n' in (ROOT/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md').read_text()
if len(sys.argv)>1:
 site=Path(sys.argv[1]);article=(site/URL.strip('/')/'index.html').read_text();program=(site/PROGRAM.strip('/')/'index.html').read_text()
 for term in ['id="irac-colours"','−0.089','+0.134','−0.011','0.292','1.124','0.208','quoted-error sensitivity, not a confidence bound','not upper limits or physical nondetections','clump chemistry proxies','consumed, post-read evidence','Zero of three','21 / 21','333-of-800',REV]:assert term in article,term
 assert 'id="red-alternative"' in article and '0 / 6' in article and '0.529–1.051' in article and NOTE_REV in article
 assert article.count('Published colour component:')==3 and URL+'#irac-colours' in program
 assert URL not in (site/'index.html').read_text()
 for entry in ET.fromstring((site/'atom.xml').read_text()).findall('{http://www.w3.org/2005/Atom}entry'):
  assert not any(link.get('href','').endswith(URL) for link in entry.findall('{http://www.w3.org/2005/Atom}link'))
 for name in [r['public_file'] for r in items]+['source-inventory.csv','README.md']:
  rel=Path('public/data/starbirth/irac-colours')/name;assert (site/rel).read_bytes()==(ROOT/rel).read_bytes(),name
print('PASS: 28 exact primary/secondary colour exports, three unchanged system/comparator cards, conditional two/one sensitivity, zero full-band availability and preserved gates/unknown physical stages.')
