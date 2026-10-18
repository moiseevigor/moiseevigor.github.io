"""Core-only counterexample to treating a proof-premise frontier as whole-proof coverage."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    lean = args.lean.resolve()
    inputs = [RESEARCH / f for f in ['ProjectionControls.lean', 'ExportLibrary.lean',
              'ExportOccurrenceTypes.lean', 'verify_projection_controls.py', 'build_recursion_examples.py']]
    inputs.append(Path(__file__).resolve())
    hashes = {str(p.relative_to(ROOT)): sha(p) for p in inputs}
    env = dict(os.environ, TMPDIR=str(folder))
    subprocess.run(['python3', str(RESEARCH / 'verify_projection_controls.py'), str(lean),
                    '--reserve-gib', '30'], cwd=ROOT, env=env, check=True)
    controls = list(folder.glob('atlas-projection-controls-*'))
    assert len(controls) == 1
    native = controls[0]
    requests = json.loads((native / 'requests.json').read_text())
    request = next(r for r in requests if r['source']['name'] == 'AtlasProjectionControl.hugeProofProjection')
    request['routes'] = [{'root': 1, 'slots': [1, 0, 1]}]
    query = native / 'witness-request.json'
    query.write_text(json.dumps([request], separators=(',', ':')))
    core = (RESEARCH / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import ProjectionFixture')
    core += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
    core += (RESEARCH / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    output = native / 'witness-types.json'
    entry = native / 'Witness.lean'
    entry.write_text(core + '\n#atlas_occurrence_types ' + json.dumps(str(query)) + ' => ' + json.dumps(str(output)) + '\n')
    resources = run_checked([str(lean), str(entry)], native, 'witness', dict(env, LEAN_PATH=str(native)), 30, 120)
    baseline = next(r for r in json.loads((native / 'types.json').read_text()) if r['name'] == request['source']['name'])
    witness = json.loads(output.read_text())
    assert len(witness) == 1 and len(witness[0]['entries']) == 1
    observed = witness[0]['entries'][0]
    assert observed['status'] == 'checked' and observed['role'] == 'proof'
    assert observed['applicationJudgment']['status'] == 'checked'
    witness[0].update(environment=baseline['environment'], sourceModuleHashVerified=True,
                      producerSha256=hashlib.sha256(core.encode()).hexdigest(), requestSha256=sha(query))
    output.write_text(json.dumps(witness, separators=(',', ':')))
    assert hashes == {str(p.relative_to(ROOT)): sha(p) for p in inputs}
    result = {'status': 'PASS', 'nativeFolder': str(native), 'producerFiles': hashes,
              'witnessResources': resources, 'originalPrivateProofProjectsRead': False,
              'scope': 'Fresh assistant-authored core-only controls. Contextual native judgments, not a whole-proof coverage certificate.'}
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'nativeFolder': str(native), 'witnessRoute': observed['route']}))


if __name__ == '__main__':
    main()
