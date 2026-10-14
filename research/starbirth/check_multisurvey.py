"""Publication checks for source-bound data readiness, not detector performance."""
import csv
import gzip
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public/data/starbirth/multisurvey'
REV = 'a1c389e90dde1aeb7539bc314ffa21963f551dbe'
ARTICLE = 'astrophysics/2026/10/11/hidden-protostars-research-program/index.html'
entries = list(csv.DictReader((PUBLIC / 'source-inventory.csv').open()))
assert len(entries) == len({e['public_file'] for e in entries}) == 15
for entry in entries:
    data = (PUBLIC / entry['public_file']).read_bytes()
    assert len(data) == int(entry['bytes']) and hashlib.sha256(data).hexdigest() == entry['sha256']
    assert entry['source_revision'] == REV
load = lambda name: json.loads((PUBLIC / name).read_text())
summary = load('starbirth-mv-summary.json')
verified = load('starbirth-mv-verification.json')
assert summary['parent_rows'] == 19328 and verified['verified']
assert verified['summary_sha256'] == hashlib.sha256((PUBLIC / 'starbirth-mv-summary.json').read_bytes()).hexdigest()
assert verified['ledger_sha256'] == hashlib.sha256((PUBLIC / 'sources.csv.gz').read_bytes()).hexdigest()
assert verified['parent_counts'] == summary['parent_counts']
assert not summary['independent_test_eligible'] and not summary['model_fit_performed']
assert not summary['physical_inference_performed'] and not summary['stopped_occurrence_rows_opened']
assert summary['fresh_physical_truth_registered'] == 0
with gzip.open(PUBLIC / 'sources.csv.gz', 'rt') as stream:
    rows = list(csv.DictReader(stream))
assert len(rows) == len({r['designation'] for r in rows}) == 19328
assert [r['designation'] for r in rows] == sorted(r['designation'] for r in rows)
assert all(r['truth_role'] == 'no_registered_fresh_physical_truth' for r in rows)
for key, count in [('wise_coordinates', 1231), ('malt90_consumed', 303), ('almagal_consumed', 52)]:
    assert sum(int(r[key]) for r in rows) == summary['parent_counts'][key] == count
assert sum(int(r['neowise_rows']) > 0 for r in rows) == 11845
assert sum(int(r['wise_coordinates']) > 0 and int(r['neowise_rows']) > 0 for r in rows) == 1098
assert sum(int(r['malt90_consumed']) > 0 and int(r['almagal_consumed']) > 0 for r in rows) == 22
assert load('starbirth-mv-audit-resources.json')['completed']
assert not load('starbirth-mv-failed-resources.json')['completed']
assert load('starbirth-mv-verification-resources.json')['completed']
assert 'ModuleNotFoundError' in (PUBLIC / 'starbirth-mv-failed-verifier.log').read_text()
if len(sys.argv) > 1:
    site = Path(sys.argv[1])
    page = (site / ARTICLE).read_text()
    for term in ['19,328', 'No model was fitted', '939', '333', '800',
                 'historical-week', 'id="multisurvey"', 'id="sbf-timeline"', 'id="sbf-expand"',
                 '/public/data/starbirth/multisurvey/README.md']:
        assert term in page, term
    assert REV in (site / 'public/data/starbirth/multisurvey/README.md').read_text()
    for entry in entries:
        path = Path('public/data/starbirth/multisurvey') / entry['public_file']
        assert (site / path).read_bytes() == (ROOT / path).read_bytes(), path
    assert (site / 'public/data/starbirth/multisurvey/source-inventory.csv').read_bytes() == (PUBLIC / 'source-inventory.csv').read_bytes()
    assert 'shared infrared' in (site / 'lab/index.html').read_text().lower()
    assert {p.name for p in (ROOT / '_posts').iterdir() if p.name.startswith('2026-10-12-hidden-protostars')} == {'2026-10-12-hidden-protostars-missing-view-ranking.md'}, 'Only the separately verified ranking result may extend this program'
print('PASS: 15 complete evidence bindings, 19,328 exact IDs and unknowns, presence counts, preserved failure, original gates and formation assets. No detector validation.')
