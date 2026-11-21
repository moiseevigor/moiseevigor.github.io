"""Replay the selected call from the published AI term in the sample dependency environment."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'compiled-replay'))
from verify import manifest, runtime_source

p = argparse.ArgumentParser()
p.add_argument('--lean', required=True, type=Path)
p.add_argument('--packages', required=True, type=Path)
p.add_argument('--declaration', default='lean_workbook_20418')
p.add_argument('--route', action='append',
               help='Constructor field slots from the proof root, one digit per field')
p.add_argument('--output', required=True, type=Path)
args = p.parse_args()
inventory = manifest()
provenance = inventory['provenance']
assert subprocess.check_output([args.lean, '--version'], text=True).strip() == provenance['compiler']
paths = []
for name, rev in provenance['environment']['dependencyRevisions'].items():
    package = args.packages / name
    assert subprocess.check_output(['git', '-C', package, 'rev-parse', 'HEAD'], text=True).strip() == rev
    paths.append(str((package / '.lake/build/lib/lean').resolve()))
owner = next(r for r in inventory['edition']['declarations'] if r['name'] == args.declaration)
raw = gzip.decompress((here.parents[2] / owner['indexFile'].lstrip('/')).read_bytes())
assert hashlib.sha256(raw).hexdigest() == owner['indexSha256']
packet = json.loads(raw)
def prepare(route):
    slots = [int(c) for c in route]
    node = packet['roots'][1]
    for slot in slots:
        assert 0 <= slot < len(packet['children'][node])
        node = packet['children'][node][slot]
    head, arity = node, 0
    while packet['kind'][head] == 5:
        arity += 1
        head = packet['children'][head][0]
    assert arity > 0, 'Select an application occurrence'
    request = dict(edition=inventory['edition']['id'], declaration=owner['name'], indexSha256=owner['indexSha256'],
                   node=node, root=1, slots=slots)
    return request, head, arity

routes = args.route or ['11111112111111110110101010010100100110011']
cases = [prepare(route) for route in routes]
requests = [case[0] for case in cases]
with tempfile.TemporaryDirectory() as folder:
    work = Path(folder)
    (work / 'packet.json').write_bytes(raw)
    (work / 'request.json').write_text(json.dumps(requests if len(cases)>1 else requests[0]))
    source = runtime_source() + (here.parent / 'ExportOccurrenceTypes.lean').read_text().removeprefix('import ExportLibrary')
    source += (here / 'CallerDomains.lean').read_text() + '\n#caller_domains "packet.json" "request.json" "out.json"\n'
    (work / 'Call.lean').write_text(source)
    subprocess.run([args.lean.resolve(), 'Call.lean'], cwd=work, env={**os.environ, 'LEAN_PATH':os.pathsep.join(paths)}, check=True)
    result = (work / 'out.json').read_bytes()
    decoded = json.loads(result)
    reports = decoded if len(cases)>1 else [decoded]
    for report, (request, head, arity) in zip(reports, cases, strict=True):
        assert report['call'] == request and report['kernelDomainConversions'] == arity
        returned = report.get('returnedFunction')
        if returned:
            count = returned['declaredBinders']
            assert packet['payloads'][head]['name'] == returned['head'] and 0 <= count < arity
            boundary = request['node']
            for _ in range(arity - count):
                boundary = packet['children'][boundary][0]
            assert boundary == returned['node']
        for row in report['arguments']:
            assert row['structurallyIdentical'] == (row['expectedRoot'] == row['inferredRoot'])
    args.output.write_bytes(result)
