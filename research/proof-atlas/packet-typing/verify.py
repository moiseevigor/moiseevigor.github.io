"""Replay a frozen occurrence construction inventory from public compiled data."""
import argparse, gzip, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import verify_dependencies, sandbox_profile

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

FILES = [BASE / 'PacketTyping.lean', BASE / 'prepare.cjs', BASE / 'verify.py',
         RESEARCH / 'ExportLibrary.lean', RESEARCH / 'ExportOccurrenceTypes.lean',
         RESEARCH / 'LevelTransportControls.lean', RESEARCH / 'compiled-replay/Replay.lean']

def runtime():
    exporter = (RESEARCH / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import Mathlib\nimport Aesop')
    occurrence = (RESEARCH / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    levels = (RESEARCH / 'LevelTransportControls.lean').read_text().split('def compactGraph')[0] + '\nend AtlasLevelTransport\n'
    return exporter + '\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n' + occurrence + '\n' + levels + '\n' + (RESEARCH / 'compiled-replay/Replay.lean').read_text() + '\n' + (BASE / 'PacketTyping.lean').read_text()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--dependency-reference', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--name', default='lean_workbook_plus_6206')
    policy = parser.add_mutually_exclusive_group()
    policy.add_argument('--proof-frontier', action='store_true', help='One frozen native proof-premise layer beyond the initial seed')
    policy.add_argument('--frontier-seed', type=Path, help='Explicit frozen proof-premise seed configuration under this repository')
    args = parser.parse_args()
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler and Path('/usr/bin/sandbox-exec').is_file()
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    files = list(FILES)
    frontier_seed = args.frontier_seed.resolve() if args.frontier_seed else BASE / 'proof-premise-seed.json'
    use_frontier = args.proof_frontier or args.frontier_seed is not None
    if use_frontier:
        frontier_seed.relative_to(ROOT)
        files += [BASE / 'frontier.cjs', frontier_seed]
        files += [ROOT / ('public/js/proof-atlas-' + name + '.js') for name in ['library-data', 'occurrence-types', 'judgment-geometry', 'let-reduction', 'let-pools', 'beta-reduction', 'elimination', 'geometry-core', 'projections']]
    sources = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    stable = runtime()
    paths, dependencies = verify_dependencies(args.dependency_reference.resolve())
    manifest = json.loads((ROOT / 'public/data/proof-atlas/goedel-sample-manifest.js').read_text().split('=', 1)[1].strip().rstrip(';'))
    assert dependencies == manifest['provenance']['environment']
    summary = json.loads(subprocess.check_output(['node', str(BASE / 'prepare.cjs'), str(folder), args.name] + (['--frontier-seed', str(frontier_seed)] if args.frontier_seed else ['--proof-frontier'] if args.proof_frontier else []), cwd=ROOT, text=True))
    inventory = json.loads((folder / 'inventory.json').read_text())
    expected_summary = {'primary': 17, 'proofRoots': 14, 'union': 19, 'added': 2}
    if use_frontier:
        expected = json.loads(frontier_seed.read_text())['expected']
        expected_summary.update(union=expected['totalQueries'], added=expected['totalQueries']-17, frontier={k: expected[k] for k in ['seedQueries', 'newQueries', 'totalQueries']})
    assert summary == expected_summary
    request, proof, output = folder / 'request.json', folder / 'proof.ndjson', folder / 'observations.json'
    entry = folder / 'PacketTypes.lean'
    entry.write_text(stable + '\n#atlas_packet_replay ' + json.dumps(str(folder / 'proof-request.json')) + ' => ' + json.dumps(str(proof)) + '\n#atlas_packet_types ' + json.dumps(str(request)) + ' => ' + json.dumps(str(output)) + '\n')
    inputs = [entry, request, folder / 'proof-request.json', folder / 'inventory.json', folder / 'packet.json']
    hashes = {p.name: sha(p.read_bytes()) for p in inputs}
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str, [folder] + paths)), 'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    resources = run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, paths), str(lean), str(entry)], folder, 'native', env, 30, 120)
    assert dependencies == verify_dependencies(args.dependency_reference.resolve())[1] and stable == runtime()
    assert sources == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    assert hashes == {p.name: sha(p.read_bytes()) for p in inputs}
    rows = [json.loads(line) for line in proof.read_text().splitlines()]
    assert len(rows) == 1
    baseline, record = rows[0], inventory['record']
    assert baseline['name'] == record['name'] and baseline['indexSha256'] == record['indexSha256']
    assert set(baseline['axioms']) == set(record['axioms']) and 'sorryAx' not in baseline['axioms']
    for key in ['kernelExpectedType', 'kernelProof', 'kernelExpectedTypeIsProposition', 'kernelExpectedTypeConversion']:
        assert baseline[key] == 'PASS'
    for key in ['originalTheoremAbsentFromEnvironment', 'originalModuleAbsentFromEnvironment', 'wrongProofRejectedByKernel', 'illTypedBinderRejectedByKernel']:
        assert baseline[key] is True
    evidence = json.loads(output.read_text())
    assert evidence['source'] == inventory['source'] and evidence['name'] == record['name']
    assert evidence['nativeDagMatchesPacket'] is True and evidence['kernelDeclarationTyping'] == 'PASS'
    assert evidence['originalTheoremAbsentFromEnvironment'] is True and evidence['originalModuleAbsentFromEnvironment'] is True and evidence['invalidRouteRejected'] is True
    assert [e['route'] for e in evidence['entries']] == inventory['routes']
    assert len(evidence['entries']) == summary['union'] and all(e['status'] == 'checked' for e in evidence['entries'])
    target = next(e for e in evidence['entries'] if e['route'] == {'root': 1, 'slots': [1] * 9})
    assert target['node'] == 30853 and target['role'] == 'proof' and target['lambdaJudgment']['status'] == 'checked'
    for key in ['kernelDomainSort', 'kernelBinderConversion', 'kernelBodyConversion', 'kernelFunctionConversion']:
        assert target['lambdaJudgment'][key] == 'PASS'
    result = {'status': 'PASS', 'source': inventory['source'], 'inventory': summary, 'queryInventorySha256': sha(json.dumps(inventory['routes'], separators=(',', ':')).encode()), 'compiler': compiler, 'environment': dependencies, 'imports': ['Mathlib', 'Aesop'], 'originalProofModulesImported': False, 'privateProofProjectsOrDependenciesBuilt': False, 'baselineProof': baseline, 'baselineProofSha256': sha(proof.read_bytes()), 'nativeOutputSha256': sha(output.read_bytes()), 'runtimeSha256': sha(stable.encode()), 'producerFiles': sources, 'targetLambda': {'route': target['route'], 'node': target['node'], 'typeText': target['typeText'], 'status': target['lambdaJudgment']['status']}, 'resources': resources}
    if use_frontier:
        frontier = inventory['frontier']
        assert len(frontier['snapshot']['pending']) == summary['frontier']['newQueries']
        by_route = {json.dumps(e['route'], sort_keys=True): e for e in evidence['entries']}
        for pending in frontier['snapshot']['pending']:
            observed = by_route[json.dumps(pending['route'], sort_keys=True)]
            assert observed['node'] == pending['node'] and observed['role'] == 'proof'
            kind = 'lambdaJudgment' if pending['kind'] == 'lam' else 'applicationJudgment' if pending['kind'] == 'app' else 'projectionJudgment'
            assert observed.get(kind, {}).get('status') == 'checked'
        result['frontier'] = frontier
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'inventory': summary, 'internalLambda': target['lambdaJudgment']['status']}))

if __name__ == '__main__':
    main()
