"""Core-only notation signatures, general Expr laws and a typed glyph collision."""
import argparse, gzip, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def runtime():
    exporter = (RESEARCH / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', '')
    occurrence = (RESEARCH / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    levels = (RESEARCH / 'LevelTransportControls.lean').read_text().split('def compactGraph')[0] + '\nend AtlasLevelTransport\n'
    return exporter + '\n' + occurrence + '\n' + levels + '\n' + (RESEARCH / 'compiled-replay/Replay.lean').read_text() + '\n' + \
        (BASE / 'Spines.lean').read_text().replace('import Lean\n', '', 1) + '\n' + (BASE / 'Export.lean').read_text()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument('--publish', action='store_true')
    mode.add_argument('--check', action='store_true')
    a = p.parse_args()
    lean, folder = a.lean.resolve(), a.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    sources = [BASE / 'Spines.lean', BASE / 'Export.lean', Path(__file__),
        RESEARCH / 'ExportLibrary.lean', RESEARCH / 'ExportOccurrenceTypes.lean', RESEARCH / 'LevelTransportControls.lean',
        RESEARCH / 'compiled-replay/Replay.lean', RESEARCH / 'build_recursion_examples.py', RESEARCH / 'evaluate_goedel.py']
    fingerprints = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in sources}
    stable, output = runtime(), folder / 'native.json'
    entry = folder / 'Check.lean'
    entry.write_text(stable + '\n#atlas_notation_export ' + json.dumps(str(output)) + '\n')
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'TMPDIR': str(folder / 'scratch'),
           'LEAN_PATH': str(folder), 'LANG': 'en_US.UTF-8'}
    command = [str(lean), '-j1', '-M4096', str(entry)]
    if sys.platform == 'darwin':
        command = ['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, []), *command]
    resources = run_checked(command, folder, 'native', env, 30, 120)
    raw = output.read_bytes()
    assert len(raw) < 1048576
    data = json.loads(raw)
    assert data['format'] == 'ProofAtlasNotationNative/1'
    assert len(data['laws']) == 7 and len(data['signatures']) == 20 and len(data['controls']) == 2
    for law in data['laws']:
        assert set(law['axioms']) <= {'propext', 'Quot.sound'}
        assert all(law[k] == 'PASS' for k in ['kernelType', 'kernelProof', 'kernelExpectedType'])
    assert stable == runtime()
    assert fingerprints == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in sources}
    report = {'format': 'ProofAtlasNotationVerification/1', 'status': 'PASS', 'compiler': compiler,
        'leanExecutableSha256': sha(lean.read_bytes()), 'runtimeSha256': sha(stable.encode()),
        'producerFiles': fingerprints, 'nativeSha256': sha(raw), 'nativeBytes': len(raw), 'resources': resources,
        'imports': ['Lean'], 'privateProofSourcesRead': False, 'mathlibArtifactsRestored': False,
        'scope': 'Four general structural Expr laws; twenty literal core signatures; two typed values with different instances. No general JS-refinement, semantic compression or comprehension claim.'}
    if a.publish:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(raw, mtime=0))
    else:
        old = gzip.decompress((BASE / 'native.json.gz').read_bytes())
        assert old == raw, 'Native signature/control payload changed'
    name = 'verification.json.gz' if a.publish else 'replay.json.gz'
    (BASE / name).write_bytes(gzip.compress((json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'laws': 7, 'signatures': 20, 'typedControls': 2}))


if __name__ == '__main__':
    main()
