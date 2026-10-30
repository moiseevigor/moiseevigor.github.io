"""Check the source-reference laws using pinned core Lean and no proof project."""
import argparse
import gzip
import hashlib
import json
import shutil
import sys
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
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    lean = args.lean.resolve()
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    source_files = [RESEARCH / 'cut-refinement/Cut.lean',
                    RESEARCH / 'cut-refinement/Fixtures.lean',
                    BASE / 'References.lean', BASE / 'Fixtures.lean',
                    BASE / 'verify.py', RESEARCH / 'build_recursion_examples.py',
                    RESEARCH / 'evaluate_goedel.py']
    hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in source_files}
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin',
           'LEAN_PATH': str(folder), 'TMPDIR': str(folder / 'scratch'),
           'LANG': 'en_US.UTF-8'}
    version_resources = run_checked([str(lean), '--version'], folder,
                                    'compiler-version', env, 30, 120)
    compiler = (folder / 'compiler-version.log').read_text().strip()
    assert 'version 4.33.1,' in compiler
    output = folder / 'laws.json'
    source = '\n'.join(f.read_text() for f in source_files[:4])
    source += '\n#atlas_reference_laws ' + json.dumps(str(output)) + '\n'
    entry = folder / 'References.lean'
    entry.write_text(source)
    command = [str(lean), str(entry)]
    if sys.platform == 'darwin':
        command = ['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, []), *command]
    resources = run_checked(command, folder, 'native', env, 30, 120)
    raw = output.read_bytes()
    data = json.loads(raw)
    assert data['format'] == 'ProofAtlasSourceReferenceLaws/1'
    assert data['leanVersion'] == '4.33.1'
    assert len(data['theorems']) == 10 and len(data['cases']) == 52
    assert all(len(c['rows']) == 6 for c in data['cases'])
    assert sum(len(r['coefficients']) for c in data['cases'] for r in c['rows']) == 2496
    for theorem in data['theorems']:
        assert set(theorem['axioms']) <= {'propext', 'Quot.sound'}
        assert all(theorem[k] == 'PASS' for k in
                   ['kernelType', 'kernelProof', 'kernelExpectedTypeConversion'])
    assert hashes == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in source_files}
    producer = {'sourceFiles': hashes, 'compiler': compiler,
                'compilerBinarySha256': sha(lean.read_bytes()), 'runtimeSha256': sha(source.encode()),
                'originalPrivateProofModulesImported': False, 'coreLeanOnly': True}
    # Output paths differ between isolated runs; source hashes and the exact
    # native payload must agree. Runtime hashes preserve that path distinction.
    record = {'producer': {k: v for k, v in producer.items() if k != 'runtimeSha256'}, **data}
    published = BASE / 'native.json.gz'
    if args.check:
        assert json.loads(gzip.decompress(published.read_bytes())) == record
    else:
        published.write_bytes(gzip.compress((json.dumps(record, indent=2) + '\n').encode(), mtime=0))
    result = {'status': 'PASS', **producer, 'nativeOutputSha256': sha(raw),
              'recordSha256': sha(published.read_bytes()), 'theorems': 10, 'fixtures': 52,
              'coefficientRows': 2496,
              'scope': 'General syntactic laws on actual Lean.Expr and source-indexed cuts. '
                       'No theorem about JavaScript, typing, fvar dependence or premise necessity.'}
    # Operational resource samples and raw compiler output remain private.
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
