"""Check frozen immediate-use application sites with bounded native Lean.

Recovered checking binaries are hash-verified, with their cache attribution
explicitly distinguished from independent Git/rebuild verification. Private
Riccati sources, compiler entries and raw logs stay in the private workdir.
"""
import argparse, hashlib, importlib.util, json, os, shutil, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

REV = '0df444a360eaa60ab8c11dca51a86af692955474'
def sha(b): return hashlib.sha256(b).hexdigest()
def write(p, value): p.write_text(json.dumps(value, separators=(',', ':')) + '\n')

def recovered(cache):
    raw = (cache / 'restoration.json').read_bytes()
    restoration = json.loads(raw)
    assert restoration['status'] == 'PASS' and restoration['attribution'] == 'git=mathlib4@' + REV
    assert restoration['attributionIsCacheCommentNotIndependentRebuild'] is True
    files = restoration['files']; assert len(files) > 8000
    seen = set()
    for row in files:
        path = (cache / 'artifacts' / row['file']).resolve()
        path.relative_to((cache / 'artifacts').resolve())
        assert path not in seen; seen.add(path)
        assert path.stat().st_size == row['bytes'] and sha(path.read_bytes()) == row['sha256'], 'Recovered binary changed'
    paths = [Path(p).resolve() for p in (cache / 'lean-env-path.txt').read_text().strip().split(os.pathsep)]
    assert all(p.is_dir() and p.is_relative_to(cache / 'artifacts') for p in paths)
    return paths, {'kind': 'mathlib-cache-attribution/1', 'mathlibRevision': REV,
        'archiveComment': restoration['attribution'], 'restorationManifestSha256': sha(raw),
        'binaryInventorySha256': sha(json.dumps(files, separators=(',', ':')).encode()),
        'artifactCount': len(files), 'allBinaryHashesVerified': True,
        'originalGitCheckoutsVerified': False, 'independentlyRebuilt': False}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--cache', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True, help='Private directory prepared by prepare.cjs')
    p.add_argument('--mode', choices=['riccati', 'ai'], required=True)
    p.add_argument('--snapshot', type=Path, help='Private source snapshot, Riccati mode only')
    args = p.parse_args(); folder = args.workdir.resolve(); lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler and Path('/usr/bin/sandbox-exec').is_file()
    plan_bytes = (folder / 'plan.json').read_bytes(); plan = json.loads(plan_bytes)
    assert plan['format'] == 'ProofAtlasImmediateUseSites/1'
    paths, recovery = recovered(args.cache.resolve())
    (folder / 'scratch').mkdir(exist_ok=True)
    selected = [r for r in plan['rows'] if
        (r['source']['name'] == 'JacobiData.slope_bound_abs' and r['source']['edition'] in ['published-15', 'working-26'])
        if args.mode == 'riccati'] if args.mode == 'riccati' else [r for r in plan['rows'] if r['source']['edition'] == 'goedel-sample-4331']
    assert len(selected) == (2 if args.mode == 'riccati' else 20)
    producer_files = [BASE / 'verify.py', BASE / 'prepare.cjs', RESEARCH / 'ExportLibrary.lean', RESEARCH / 'ExportOccurrenceTypes.lean']
    if args.mode == 'ai':
        producer_files += [RESEARCH / 'LevelTransportControls.lean', RESEARCH / 'compiled-replay/Replay.lean', RESEARCH / 'packet-typing/PacketTyping.lean', RESEARCH / 'packet-typing/verify.py']
    sources = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in producer_files}
    resources = []; modules = {}; source_inputs = {}
    if args.mode == 'riccati':
        assert args.snapshot
        module_dir = folder / 'SE2Conjugate'; module_dir.mkdir(exist_ok=True)
        for name in ['Jacobi', 'Identities', 'Riccati']:
            original = args.snapshot.resolve() / 'SE2Conjugate' / (name + '.lean')
            raw = original.read_bytes(); source_inputs[original] = sha(raw)
            dest = module_dir / (name + '.lean'); dest.write_bytes(raw)
            env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str, [folder] + paths)), 'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
            out = dest.with_suffix('.olean')
            assert not out.exists(), 'Do not overwrite a compiled module'
            resources.append(run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, paths), str(lean), '-o', str(out), str(dest)], folder, 'compile-' + name, env))
            modules['SE2Conjugate.' + name] = {'sourceSha256': sha(raw), 'compiledModuleSha256': sha(out.read_bytes())}
        assert all(row['source']['sourceSha256'] == modules['SE2Conjugate.Riccati']['sourceSha256'] for row in selected)
        stable = (RESEARCH / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import SE2Conjugate.Riccati') + '\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n' + (RESEARCH / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    else:
        spec = importlib.util.spec_from_file_location('packet_typing_verify', RESEARCH / 'packet-typing/verify.py')
        replay = importlib.util.module_from_spec(spec); spec.loader.exec_module(replay)
        stable = replay.runtime()
    print(json.dumps({'phase': 'native', 'mode': args.mode, 'profiles': len(selected)}), flush=True)
    for item in selected:
        source, record = item['source'], item['record']
        target = folder / (source['edition'] + '-' + ''.join(c if c.isalnum() or c in '_-' else '_' for c in source['name']))
        output, verification = target / 'observations.json', target / 'verification.json'
        assert not output.exists() and not verification.exists(), 'Do not overwrite native evidence'
        raw = (target / 'packet.json').read_bytes(); assert sha(raw) == source['indexSha256']
        routes = [s['route'] for s in item['sites']]
        assert 0 < len(routes) <= 512 and all(len(r['slots']) <= 512 for r in routes)
        request = {'packetFile': str(target / 'packet.json'), 'source': source, 'routes': routes}
        if args.mode == 'ai': request.update(name=record['name'], module=record['module'])
        write(target / 'request.json', [request] if args.mode == 'riccati' else request)
        if args.mode == 'ai':
            write(target / 'proof-request.json', [{**{k: record[k] for k in ['name', 'module', 'indexSha256', 'axioms']}, 'file': request['packetFile']}])
            commands = '\n#atlas_packet_replay ' + json.dumps(str(target / 'proof-request.json')) + ' => ' + json.dumps(str(target / 'proof.ndjson')) + '\n#atlas_packet_types '
        else: commands = '\n#atlas_occurrence_types '
        entry = target / 'Queries.lean'; entry.write_text(stable + commands + json.dumps(str(target / 'request.json')) + ' => ' + json.dumps(str(output)) + '\n')
        env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str, [folder] + paths)), 'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
        native = run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, paths), str(lean), str(entry)], target, 'native', env)
        evidence = json.loads(output.read_text()); evidence = evidence[0] if args.mode == 'riccati' else evidence
        assert evidence['source'] == source and evidence['nativeDagMatchesPacket'] is True
        assert [e['route'] for e in evidence['entries']] == routes
        observed = {json.dumps(e['route'], sort_keys=True): e for e in evidence['entries']}
        for site in item['sites']:
            e = observed[json.dumps(site['route'], sort_keys=True)]
            if e['status'] == 'checked': assert e['node'] == site['node']
        baseline = None
        if args.mode == 'ai':
            rows = [json.loads(line) for line in (target / 'proof.ndjson').read_text().splitlines()]; assert len(rows) == 1
            baseline = rows[0]; assert baseline['name'] == record['name'] and baseline['indexSha256'] == source['indexSha256']
            assert set(baseline['axioms']) == set(record['axioms']) and 'sorryAx' not in baseline['axioms']
            for k in ['kernelExpectedType', 'kernelProof', 'kernelExpectedTypeIsProposition', 'kernelExpectedTypeConversion']: assert baseline[k] == 'PASS'
            for k in ['originalTheoremAbsentFromEnvironment', 'originalModuleAbsentFromEnvironment', 'wrongProofRejectedByKernel', 'illTypedBinderRejectedByKernel']: assert baseline[k] is True
            assert evidence['kernelDeclarationTyping'] == 'PASS' and evidence['invalidRouteRejected'] is True
        assert sources == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in producer_files}
        v = {'status': 'PASS', 'mode': args.mode, 'source': source, 'compiler': compiler,
             'dependencyRecovery': recovery, 'sourceModules': modules,
             'nativeOutputSha256': sha(output.read_bytes()), 'runtimeSha256': sha(stable.encode()),
             'producerFiles': sources, 'planSha256': sha(plan_bytes),
             'queryInventorySha256': sha(json.dumps(routes, separators=(',', ':')).encode()),
             'queries': len(routes), 'checked': sum(e['status'] == 'checked' for e in evidence['entries']),
             'applicationTraces': sum(e.get('applicationJudgment', {}).get('status') == 'checked' for e in evidence['entries']),
             'resources': native}
        if baseline is not None: v.update(baselineProof=baseline, baselineProofSha256=sha((target / 'proof.ndjson').read_bytes()))
        write(verification, v)
        print(json.dumps({k: v[k] for k in ['status', 'source', 'queries', 'checked', 'applicationTraces']}), flush=True)
    assert sha((folder / 'plan.json').read_bytes()) == sha(plan_bytes)
    assert all(sha(f.read_bytes()) == h for f, h in source_inputs.items())
    write(folder / (args.mode + '-verification.json'), {'status': 'PASS', 'profiles': len(selected), 'dependencyRecovery': recovery, 'sourceModules': modules, 'compileResources': resources})

if __name__ == '__main__': main()
