"""Check the general source-indexed union laws using core Lean only."""
import argparse
import gzip
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    lean, work = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(work.parent).free >= 30 * 1024**3
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    sources = [ROOT / 'research/proof-atlas' / file for file in [
        'cut-refinement/Cut.lean', 'source-reference-laws/References.lean',
        'local-cut-context/LocalContext.lean', 'cut-union/Union.lean', 'cut-union/Export.lean']]
    hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in [*sources, Path(__file__)]}
    # Only suppress diagnostic print commands from the unchanged parent module.
    text = '\n'.join('\n'.join(line for line in f.read_text().splitlines()
        if not line.startswith('#print axioms ')) for f in sources)
    text = text.replace('import Lean\n', '', 1)
    runtime = 'import Lean\nset_option linter.unusedVariables false\n' + text
    work.mkdir(exist_ok=False)
    output = work / 'native.json'
    entry = work / 'Check.lean'
    entry.write_text(runtime + '\n#atlas_cut_union_export ' + json.dumps(str(output)) + '\n')
    result = subprocess.run([str(lean), '-j1', '-M2048', str(entry)],
        cwd=work, text=True, capture_output=True, timeout=120)
    (work / 'compile.log').write_text(result.stdout + result.stderr)
    assert result.returncode == 0, (result.stdout + result.stderr)[-6000:]
    raw = output.read_bytes()
    data = json.loads(raw)
    assert len(data['laws']) == 15
    for law in data['laws']:
        assert set(law['axioms']) <= {'propext', 'Quot.sound'}
        assert all(law[k] == 'PASS' for k in ['kernelType', 'kernelProof', 'kernelExpectedType'])
    assert hashes == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in [*sources, Path(__file__)]}
    report = {'format': 'ProofAtlasCutUnionVerification/1', 'status': 'PASS',
        'compiler': compiler, 'leanExecutableSha256': sha(lean.read_bytes()),
        'runtimeSha256': sha(runtime.encode()), 'producerFiles': hashes,
        'nativeSha256': sha(raw), 'imports': ['Lean'], 'privateProofSourcesRead': False,
        'scope': 'Fifteen general laws on cuts indexed by one fixed Lean.Expr. '
                 'No general JavaScript refinement proof, typing preservation or scope-owner authentication claim.'}
    if args.check:
        assert gzip.decompress((BASE / 'native.json.gz').read_bytes()) == raw
        assert json.loads(gzip.decompress((BASE / 'verification.json.gz').read_bytes())) == report
    else:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(raw, mtime=0))
        (BASE / 'verification.json.gz').write_bytes(gzip.compress(
            (json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'laws': 15, 'imports': ['Lean']}))


if __name__ == '__main__':
    main()
