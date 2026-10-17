"""Replay authenticated public packets in existing compiled dependencies.

No original proof module is imported or exposed to the child sandbox. This
driver builds no dependency or project. Raw logs remain in the private workdir.
"""
import argparse
import gzip
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import verify_dependencies, sandbox_profile


def sha(data):
    return hashlib.sha256(data).hexdigest()


def manifest():
    text = (ROOT / 'public/data/proof-atlas/goedel-sample-manifest.js').read_text()
    return json.loads(text.split('=', 1)[1].strip().rstrip(';'))


def runtime_source():
    exporter = (RESEARCH / 'ExportLibrary.lean').read_text()
    assert exporter.count('import SE2Conjugate') == 1
    exporter = exporter.replace('import SE2Conjugate', 'import Mathlib\nimport Aesop')
    levels = (RESEARCH / 'LevelTransportControls.lean').read_text()
    assert levels.count('def compactGraph') == 1
    levels = levels.split('def compactGraph')[0].replace(' AtlasOccurrenceTypes', '')
    return (exporter + '\n' + levels + '\nend AtlasLevelTransport\n'
            'set_option maxRecDepth 8192\nset_option maxHeartbeats 10000000\n' +
            (BASE / 'Replay.lean').read_text() + '\n' +
            (BASE / 'Controls.lean').read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', required=True, type=Path)
    parser.add_argument('--dependency-reference', required=True, type=Path,
                        help='Existing pinned lake-manifest.json and lean-env-path.txt; no builds are run.')
    parser.add_argument('--workdir', required=True, type=Path)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--all', action='store_true')
    group.add_argument('--name', action='append')
    args = parser.parse_args()
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler, 'Pinned Lean version required'
    assert Path('/usr/bin/sandbox-exec').is_file(), 'This bounded runner currently requires macOS sandbox-exec'
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    assert shutil.disk_usage(folder).free >= 30 * 1024**3, 'Free-space reserve'
    (folder / 'scratch').mkdir()
    inventory = manifest()
    paths, environment = verify_dependencies(args.dependency_reference.resolve())
    assert environment == inventory['provenance']['environment'], 'Compiled dependency environment changed'
    records = inventory['edition']['declarations']
    if args.name:
        assert len(set(args.name)) == len(args.name), 'Duplicate requested theorem'
        records = [r for r in records if r['name'] in args.name]
        assert len(records) == len(args.name), 'Unknown requested theorem'
    requests = []
    for record in records:
        assert record['kind'] == 'theorem' and record['bodyAvailable']
        assert not record['unsafe'] and not record['partial'] and record['levelParams'] == []
        source = (ROOT / record['indexFile'].lstrip('/')).resolve()
        assert ROOT.resolve() in source.parents
        with gzip.open(source, 'rb') as handle:
            raw = handle.read(64 * 1024**2 + 1)
        assert len(raw) <= 64 * 1024**2, 'Decoded packet bound'
        assert sha(raw) == record['indexSha256'], 'Public packet digest changed'
        packet = json.loads(raw)
        assert packet['declaration']['name'] == record['name']
        target = folder / (record['indexSha256'] + '.json')
        target.write_bytes(raw)
        requests.append({k: record[k] for k in ['name', 'module', 'indexSha256', 'axioms']})
        requests[-1]['file'] = str(target)
    request = folder / 'requests.json'
    request.write_text(json.dumps(requests, separators=(',', ':')))
    stable = runtime_source()
    output, controls = folder / 'replayed.ndjson', folder / 'controls.json'
    entry = folder / 'Replay.lean'
    entry.write_text(stable + '\n#atlas_packet_controls ' + json.dumps(str(controls)) +
                     '\n#atlas_packet_replay ' + json.dumps(str(request)) +
                     ' => ' + json.dumps(str(output)) + '\n')
    profile = sandbox_profile(lean, folder, paths)
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin',
           'LEAN_PATH': os.pathsep.join(map(str, [folder] + paths)),
           'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    resources = run_checked(['/usr/bin/sandbox-exec', '-p', profile, str(lean), str(entry)],
                            folder, 'native', env, 30, 120)
    assert verify_dependencies(args.dependency_reference.resolve())[1] == environment
    rows = [json.loads(line) for line in output.read_text().splitlines()]
    assert len(rows) == len(records)
    for row, record in zip(rows, records):
        assert row['name'] == record['name'] and row['indexSha256'] == record['indexSha256']
        assert row['storedNodes'] == record['uniqueNodes']
        assert set(row['axioms']) == set(record['axioms']) and 'sorryAx' not in row['axioms']
        for key in ['kernelExpectedType', 'kernelProof', 'kernelExpectedTypeConversion']:
            assert row[key] == 'PASS'
        for key in ['originalTheoremAbsentFromEnvironment', 'originalModuleAbsentFromEnvironment',
                    'wrongProofRejectedByKernel', 'illTypedBinderRejectedByKernel']:
            assert row[key] is True
    result = {'status': 'PASS', 'compiler': compiler, 'environment': environment,
              'imports': ['Mathlib', 'Aesop'], 'originalProofModulesImported': False,
              'originalProofProjectsOrDependenciesBuilt': False,
              'runtimeSourceSha256': sha(stable.encode()), 'driverSha256': sha(Path(__file__).read_bytes()),
              'entrySha256': sha(entry.read_bytes()),
              'requestSha256': sha(request.read_bytes()), 'nativeOutputSha256': sha(output.read_bytes()),
              'controlsSha256': sha(controls.read_bytes()), 'rows': rows,
              'controls': json.loads(controls.read_text()), 'resources': resources,
              'scope': 'Frozen 20-proof AI-attributed sample or explicit subset. Exact Boolean metadata only; '
                       'other metadata is rejected. Native checks trust the pinned compiled dependencies; '
                       'no general decoder theorem or portable kernel certificate.'}
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'packets': len(rows), 'workdir': str(folder),
                      'runtimeSourceSha256': result['runtimeSourceSha256']}))


if __name__ == '__main__':
    main()
