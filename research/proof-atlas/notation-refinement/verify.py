"""Core-only native reconstruction of finite notation-refinement source cuts."""
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
    exporter = (RESEARCH / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import Lean')
    occurrence = (RESEARCH / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    levels = (RESEARCH / 'LevelTransportControls.lean').read_text().split('def compactGraph')[0] + '\nend AtlasLevelTransport\n'
    files = ['compiled-replay/Replay.lean', 'cut-refinement/Cut.lean',
             'source-reference-laws/References.lean', 'local-cut-context/LocalContext.lean',
             'cut-union/Union.lean']
    source = exporter + '\nset_option maxRecDepth 8192\nset_option maxHeartbeats 10000000\nset_option linter.unusedVariables false\n' + occurrence + '\n' + levels
    for file in files:
        fragment = (RESEARCH / file).read_text().replace('import Lean\n', '')
        if file == 'compiled-replay/Replay.lean':
            marker = 'def decode (packet : Json)'
            assert fragment.count(marker) == 1 and fragment.count('(← metadata p)') == 1
            fragment = fragment.replace(marker, (BASE / 'Metadata.lean').read_text() + '\n' + marker)
            fragment = fragment.replace('(← metadata p)', '(← refinementMetadata p)')
        source += '\n' + fragment
    # Keep the established dependent decoder and test_sound theorem. Its command
    # handler belongs to the separate older BindingWire experiment.
    source += '\n' + (RESEARCH / 'cut-records/NativeCut.lean').read_text().split('syntax "#atlas_source_cuts ')[0] + '\nend ProofAtlas.SourceCut.Bridge\n'
    source += '\n' + (BASE / 'Native.lean').read_text()
    return '\n'.join(line for line in source.splitlines() if not line.startswith('#print axioms ')) + '\n'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--check', action='store_true')
    a = p.parse_args()
    lean, folder = a.lean.resolve(), a.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= 30 * 1024**3
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    files = [BASE / 'Native.lean', BASE / 'Metadata.lean', Path(__file__), RESEARCH / 'ExportLibrary.lean',
             RESEARCH / 'ExportOccurrenceTypes.lean', RESEARCH / 'LevelTransportControls.lean',
             RESEARCH / 'compiled-replay/Replay.lean', RESEARCH / 'cut-refinement/Cut.lean',
             RESEARCH / 'source-reference-laws/References.lean', RESEARCH / 'local-cut-context/LocalContext.lean',
             RESEARCH / 'cut-union/Union.lean', RESEARCH / 'cut-records/NativeCut.lean',
             RESEARCH / 'build_recursion_examples.py', RESEARCH / 'evaluate_goedel.py',
             BASE / 'native-input.json.gz', BASE / 'model.json.gz']
    hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    model = json.loads(gzip.decompress((BASE / 'model.json.gz').read_bytes()))
    assert model['status'] == 'PASS'
    for f, h in model['files'].items():
        assert sha((ROOT / f).read_bytes()) == h, f
    raw_input = gzip.decompress((BASE / 'native-input.json.gz').read_bytes())
    assert len(raw_input) <= 64 * 1024**2
    source = runtime()
    entry = folder / 'Check.lean'
    entry.write_text(source)
    (folder / 'input.json').write_bytes(raw_input)
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder / 'scratch'))
    resources = {}
    resources['compile'] = run_checked([str(lean), '-j1', '-M4096', '-c', str(folder / 'Check.c'), str(entry)], folder, 'compile', env, 30, 120)
    resources['object'] = run_checked([str(lean.parent / 'leanc'), '-O0', '-c', str(folder / 'Check.c'), '-o', str(folder / 'Check.o'), '-mmacosx-version-min=11.0'], folder, 'object', env, 30, 120)
    libraries = lean.parent.parent / 'lib/lean'
    executable = folder / 'checker'
    resources['link'] = run_checked(['/usr/bin/clang', '-o', str(executable), str(folder / 'Check.o'), '-L'+str(libraries), '-lInit_shared', '-lleanshared', '-Wl,-rpath,'+str(libraries), '-mmacosx-version-min=11.0'], folder, 'link', env, 30, 120)
    command = [str(executable), str(folder / 'input.json'), str(folder / 'output.json')]
    if sys.platform == 'darwin':
        profile = sandbox_profile(lean, folder, []).replace('(allow process-exec (literal '+json.dumps(str(lean))+'))', '(allow process-exec (literal '+json.dumps(str(executable))+'))')
        command = ['/usr/bin/sandbox-exec', '-p', profile, *command]
    resources['replay'] = run_checked(command, folder, 'replay', env, 30, 120)
    native_raw = (folder / 'output.json').read_bytes()
    native = json.loads(native_raw)
    records = sum(r['records'] for r in native['results'])
    joins = sum(r['joins'] for r in native['results'])
    refs = sum(r['referenceCoefficients'] for r in native['results'])
    assert records == model['nativeRecords'] and joins == model['nativeJoins']
    assert len(native['results']) == 162 and refs > 0 and native['metadataControls'] == 10
    assert source == runtime() and hashes == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    report = {'format': 'ProofAtlasNotationRefinementVerification/1', 'status': 'PASS',
        'compiler': compiler, 'leanExecutableSha256': sha(lean.read_bytes()),
        'runtimeSha256': sha(source.encode()), 'producerFiles': hashes, 'resources': resources,
        'nativeSha256': sha(native_raw), 'requests': 162, 'records': records, 'joins': joins,
        'referenceCoefficients': refs, 'metadataControls': 10,
        'metadataScope': ['Boolean', 'canonical JSON-compatible string repr'],
        'imports': ['Lean'], 'privateProofSourcesRead': False,
        'scope': 'Finite actual Expr-indexed reconstruction, constructor payload/count/reference checks and union/intersection evaluation. '
                 'Existing type judgments unchanged. No general JS-refinement proof, new mathematical typing or owner authentication.'}
    if a.check:
        assert gzip.decompress((BASE / 'native.json.gz').read_bytes()) == native_raw
    else:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(native_raw, mtime=0))
    name = 'replay.json.gz' if a.check else 'verification.json.gz'
    (BASE / name).write_bytes(gzip.compress((json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'records': records, 'joins': joins, 'referenceCoefficients': refs}))


if __name__ == '__main__':
    main()
