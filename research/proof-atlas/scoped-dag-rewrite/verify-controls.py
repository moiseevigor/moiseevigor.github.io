"""Core-only row/depth evaluator checks against frozen raw constructor outputs."""
import argparse, gzip, hashlib, importlib.util, json, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    spec = importlib.util.spec_from_file_location('reference_runtime', RESEARCH / 'expr-reference-laws/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    files = [BASE / name for name in ['NodeRewrite.lean', 'Pruning.lean', 'Controls.lean', 'verify-controls.py']]
    files += [RESEARCH / name for name in ['expr-reference-laws/verify.py', 'expr-reference-laws/Reference.lean',
        'expr-reference-laws/Bridge.lean', 'packet-typing/verify.py', 'packet-typing/PacketTyping.lean',
        'ExportLibrary.lean', 'ExportOccurrenceTypes.lean', 'LevelTransportControls.lean',
        'compiled-replay/Replay.lean', 'build_recursion_examples.py', 'evaluate_goedel.py']]
    producer_files = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    inventory = RESEARCH / 'expr-reference-laws/native-check.json.gz'
    inventory_raw = inventory.read_bytes()
    controls = json.loads(gzip.decompress(inventory_raw))['controls']
    invalid = []
    def altered(name, change):
        graph = json.loads(json.dumps(controls['graph']))
        change(graph)
        invalid.append({'name': name, 'graph': graph})
    altered('wrong-format', lambda g: g.update(serialization='ExprDAG/0'))
    altered('wrong-scope', lambda g: g['neededScope'].__setitem__(0, 0))
    altered('wrong-count', lambda g: g['expanded'].__setitem__(0, '2'))
    altered('oversized-count', lambda g: g['expanded'].__setitem__(0, '1' * 4097))
    altered('bad-root', lambda g: g['roots'].__setitem__(0, len(g['kind'])))
    app = controls['graph']['kind'].index(5)
    altered('cyclic-child', lambda g: g['children'][app].__setitem__(0, app))
    controls['invalidGraphs'] = invalid
    input_path = folder / 'controls.json'
    input_raw = json.dumps(controls, separators=(',', ':')).encode()
    input_path.write_bytes(input_raw)
    output = folder / 'output.json'
    entry = folder / 'Controls.lean'
    entry.write_text(module.runtime() + '\n' + '\n'.join((BASE / name).read_text()
        for name in ['Pruning.lean', 'NodeRewrite.lean', 'Controls.lean']) +
        '\n#atlas_scoped_dag_controls ' + json.dumps(str(input_path)) + ' => ' + json.dumps(str(output)) + '\n')
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder),
           'LANG': 'en_US.UTF-8', 'TMPDIR': str(folder / 'scratch')}
    binary = sha(lean.read_bytes())
    resources = run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, [folder]),
        str(lean), '-j1', '-M4096', str(entry)], folder, 'native', env, timeout=120)
    raw = output.read_bytes()
    data = json.loads(raw)
    assert len(data['observations']) == 476 and data['typedProofs'] is False
    assert len(data['protectedLaws']) == 3
    assert data['metadataRefusals'] == [row['name'] for row in invalid]
    assert data['addressDepthRefusals'] == 2
    assert all(law['kernelTyping'] == 'PASS' and 'sorryAx' not in law['axioms'] for law in data['protectedLaws'])
    assert all(row['rawEquality'] == 'PASS' and row['stats']['states'] <= 262144 and row['stats']['visits'] <= 1048577 and row['stats']['peakPending'] <= 4096 for row in data['observations'])
    assert producer_files == {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    assert inventory_raw == inventory.read_bytes() and binary == sha(lean.read_bytes())
    report = {'format': 'ProofAtlasScopedDagControlEvidence/1', 'status': 'PASS', 'compiler': compiler,
        'leanExecutableSha256': binary, 'producerFiles': producer_files,
        'inventory': {'file': str(inventory.relative_to(ROOT)), 'sha256': sha(inventory_raw)},
        'inputSha256': sha(input_raw), 'outputSha256': sha(raw), 'runtimeSha256': sha(entry.read_bytes()),
        'resources': resources, 'observation': data,
        'scope': 'Three general protected-subtree laws and 476 finite raw-constructor evaluator comparisons; no typing claim for the raw syntax fixtures.'}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'protectedLaws': 3, 'rawTransforms': 476}), flush=True)

if __name__ == '__main__':
    main()
