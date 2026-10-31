"""Core-only kernel audit and raw-syntax/native controls for projection fusion."""
import argparse, gzip, hashlib, json, shutil, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

SOURCES = [RESEARCH / name for name in [
    'ExportLibrary.lean', 'context-projection/Projection.lean',
    'context-projection/Fixtures.lean', 'expr-reference-laws/Reference.lean',
    'projection-substitution/Fusion.lean', 'projection-substitution/Controls.lean']]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def runtime():
    return 'import Lean\n' + '\n'.join(
        p.read_text().replace('import Lean\n', '', 1).replace('import SE2Conjugate', '')
        for p in SOURCES)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--publish', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    files = SOURCES + [Path(__file__), RESEARCH / 'build_recursion_examples.py',
                       RESEARCH / 'evaluate_goedel.py']
    hashes = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    executable = sha(lean.read_bytes())
    stable = runtime()
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    (folder / 'scratch').mkdir()
    output = folder / 'controls.json'
    entry = folder / 'Check.lean'
    entry.write_text(stable + '\n#atlas_projection_fusion ' + json.dumps(str(output)) + '\n')
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder),
           'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    command = [str(lean), '-j1', '-M4096', str(entry)]
    if sys.platform == 'darwin':
        command = ['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, []), *command]
    resources = run_checked(command, folder, 'native', env, 30, 120)
    raw = output.read_bytes()
    assert len(raw) <= 32 * 1024**2
    data = json.loads(raw)
    assert data['format'] == 'ProofAtlasProjectionFusionControls/1'
    assert len(data['lifts']) == 18492 and len(data['substitutions']) == 30820
    assert len(data['maps']) == 67 and len(data['sampleLabels']) == 23
    assert sorted(set(data['graph']['kind'])) == list(range(12))
    assert data['typingClaim'] is False and data['generalNativeRefinementClaim'] is False
    assert [row['label'] for row in data['typedControls']] == ['Nat-value', 'dependent-family']
    for row in data['typedControls']:
        assert all(row[k] == 'PASS' for k in
                   ['kernelTyping', 'kernelRecoveryConversion', 'kernelEqualityWitness'])
    assert [row['name'] for row in data['laws']] == ['ProofAtlas.Projection.' + name for name in
        ['project_lift', 'project_substitute', 'project_instantiate', 'unused_replacement_counterexample']]
    for row in data['laws']:
        assert set(row['axioms']) <= {'propext', 'Quot.sound'}
        assert all(row[k] == 'PASS' for k in ['kernelType', 'kernelProof', 'kernelExpectedTypeConversion'])
    assert hashes == {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    assert runtime() == stable and sha(lean.read_bytes()) == executable
    report = {'format': 'ProofAtlasProjectionFusionVerification/1', 'status': 'PASS',
              'compiler': compiler, 'leanExecutableSha256': executable,
              'runtimeSha256': sha(stable.encode()), 'producerFiles': hashes,
              'controlsSha256': sha(raw), 'controlsDecodedBytes': len(raw),
              'lifts': len(data['lifts']), 'substitutions': len(data['substitutions']),
              'typedControls': len(data['typedControls']),
              'laws': data['laws'], 'resources': resources,
              'scope': 'Three general structural composition laws and one counterexample on actual Lean.Expr. '
                       'Finite native-extern comparisons on raw syntax; no general extern refinement, '
                       'typing preservation, arbitrary graph-region module or comprehension claim.'}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    if args.publish:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(raw, mtime=0))
        (BASE / 'verification.json.gz').write_bytes(gzip.compress(
            (json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    else:
        assert gzip.decompress((BASE / 'native.json.gz').read_bytes()) == raw
        frozen = json.loads(gzip.decompress((BASE / 'verification.json.gz').read_bytes()))
        assert {k: v for k, v in frozen.items() if k != 'resources'} == {
            k: v for k, v in report.items() if k != 'resources'}
    print(json.dumps({'status': 'PASS', 'lifts': report['lifts'],
                      'substitutions': report['substitutions'], 'controlsSha256': sha(raw)}))


if __name__ == '__main__':
    main()
