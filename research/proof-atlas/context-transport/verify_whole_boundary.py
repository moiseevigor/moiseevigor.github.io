"""Isolate the whole-function limit using already compiled own controls."""
from pathlib import Path
import json, sys, os, hashlib

BASE = Path(__file__).resolve().parent
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'research/proof-atlas'))
from build_recursion_examples import run_checked

folder = Path(sys.argv[1]).resolve()
queries = json.loads((folder / 'requests.json').read_text())
for query in queries:
    query['routes'] = [dict(root=1, slots=[])]
body = (folder / 'Export.lean').read_text().split('\n#atlas_context_transport ')[0]
groups = {'whole-small': [q for q in queries if '.large' not in q['source']['name']]}
groups.update({q['source']['name'].split('.')[-1] + '-whole': [q]
               for q in queries if '.large' in q['source']['name']})
rows = []
for name, batch in groups.items():
    request = folder / (name + '-request.json')
    request.write_text(json.dumps(batch, separators=(',', ':')))
    output = folder / (name + '.json')
    entry = folder / (name + '.lean')
    entry.write_text(body + '\n#atlas_context_transport ' + json.dumps(str(request))
                     + ' => ' + json.dumps(str(output)) + '\n')
    expect_bound = name != 'whole-small'
    try:
        resources = run_checked(
            [os.environ.get('ATLAS_LEAN','lean'), str(entry)],
            folder, name, dict(os.environ, LEAN_PATH=str(folder)), 30)
        assert not expect_bound, 'Large whole type unexpectedly supported; review the boundary'
        rows.append(dict(name=name, status='EXTRACTED', resources=resources,
                         packages=len(json.loads(output.read_text()))))
    except RuntimeError:
        log = (folder / (name + '.log')).read_text()
        resources = json.loads((folder / (name + '.resources.json')).read_text())
        assert expect_bound and resources['exitCode'] == 1
        assert resources['stopReason'] is None and 'error: Context template table bound' in log
        rows.append(dict(name=name, status='EXPECTED_TEMPLATE_BOUND', resources=resources,
                         nativeError='Context template table bound',
                         requestSha256=hashlib.sha256(request.read_bytes()).hexdigest(),
                         sourcePacket=batch[0]['source']))
result = dict(status='PASS_WITH_EXPLICIT_BOUNDARY', cases=rows,
              interpretation='Ambient-prefix anchors recover selected inner types. Whole large '
              'function types still exceed the template bound. This is a representation '
              'limitation, not a failed Lean judgment.')
(folder / 'whole-boundary-checks.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
