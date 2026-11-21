"""Replay the endpoint comparisons from public compiled packets using existing dependencies."""
import argparse
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

base = Path(__file__).resolve().parent
root = base.parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--lean', type=Path, required=True)
parser.add_argument('--project', type=Path, required=True, help='Existing Lake project with the pinned compiled dependencies')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
manifest = json.loads((root / 'public/data/proof-atlas/goedel-sample-manifest.js').read_text().split('=', 1)[1].strip().rstrip(';'))
environment = manifest['provenance']['environment']
digest = lambda data: hashlib.sha256(data).hexdigest()
assert digest((args.project / 'lake-manifest.json').read_bytes()) == environment['lakeManifestSha256']
paths = []
for name, revision in environment['dependencyRevisions'].items():
    package = args.project / '.lake/packages' / name
    assert subprocess.check_output(['git', '-C', package, 'rev-parse', 'HEAD'], text=True).strip() == revision
    paths.append(str((package / '.lake/build/lib/lean').resolve()))
version = subprocess.check_output([args.lean, '--version'], text=True).strip()
assert 'version 4.33.1,' in version
spec = importlib.util.spec_from_file_location('packet_runtime', base.parent / 'packet-typing/verify.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
runtime = module.runtime() + '\n' + (base / 'EndpointConversion.lean').read_text()
with tempfile.TemporaryDirectory() as workdir:
    work = Path(workdir)
    requests = work / 'requests.json'
    subprocess.run(['node', str(base / 'check-equality-sides.cjs'), '--conversion-requests', requests], cwd=root, check=True)
    queries = json.loads(requests.read_bytes())
    assert queries
    results = []
    for record in manifest['edition']['declarations']:
        group = [q for q in queries if q['name'] == record['name']]
        if not group:
            continue
        raw = gzip.decompress((root / record['indexFile'].lstrip('/')).read_bytes())
        assert all(q['indexSha256'] == digest(raw) == record['indexSha256'] for q in group)
        packet, batch, result = [work / s for s in ['packet.json', 'batch.json', 'result.json']]
        packet.write_bytes(raw)
        batch.write_text(json.dumps(group))
        command = '#atlas_endpoints ' + ' '.join(json.dumps(str(p)) for p in [packet, batch, result])
        source = work / 'Runtime.lean'
        source.write_text(runtime + '\n' + command + '\n')
        subprocess.run([args.lean, source], cwd=work, env={**os.environ, 'LEAN_PATH':os.pathsep.join(paths)}, check=True)
        entries = json.loads(result.read_bytes())
        assert [{k:e[k] for k in q} for e,q in zip(entries,group,strict=True)] == group
        assert all(e['kernelReflexivity'] == 'PASS' for e in entries)
        results.extend(entries)
    assert len(results) == len(queries)
    args.output.write_text(json.dumps(dict(compiler=version,environment=environment,entries=results), indent=2)+'\n')
