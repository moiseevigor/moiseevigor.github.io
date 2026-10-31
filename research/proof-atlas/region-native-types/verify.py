"""Stream fresh kernel queries into compressed evidence, one native case at a time."""
import argparse, gzip, hashlib, json, os, resource, shutil, subprocess, sys, threading, time
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from evaluate_goedel import sandbox_profile


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def run_stream(command, folder, env, output, expected):
    digest, lines, faults = hashlib.sha256(), [], []
    limit, reserve = 64 * 1024**2, 30 * 1024**3
    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE, (limit, limit))
    with (folder / 'native.stderr').open('wb') as log:
        process = subprocess.Popen(command, cwd=folder, env=env, stdout=subprocess.PIPE,
                                   stderr=log, preexec_fn=limits)
        def consume():
            try:
                with output.open('wb') as raw_output, gzip.GzipFile(filename='', mode='wb',
                        fileobj=raw_output, mtime=0) as compressed:
                    while True:
                        line = process.stdout.readline(limit + 1)
                        if not line:
                            break
                        assert len(line) <= limit and line.endswith(b'\n'), 'Native record size'
                        row = json.loads(line)
                        assert row['format'] == 'ProofAtlasRegionNativeQuery/1' and row['status'] == 'PASS'
                        assert len(lines) < len(expected) and row['query'] == expected[len(lines)]
                        assert all(row[k] == 'PASS' for k in ['kernelOriginalTyping',
                            'kernelClosedExpectedType', 'kernelProjectedOpenTyping', 'kernelRecoveryConversion',
                            'kernelEqualityWitness', 'literalInverse'])
                        assert len(row['types']['kind']) <= 32768 and len(row['graph']['kind']) <= 262144
                        compressed.write(line)
                        digest.update(line)
                        lines.append({'id': row['query']['id'], 'typeRows': len(row['types']['kind']),
                                      'rows': len(row['graph']['kind']), 'rawSha256': sha(line)})
            except BaseException as error:
                faults.append(str(error))
        reader = threading.Thread(target=consume, daemon=True)
        reader.start()
        began, peak, minimum, reason = time.monotonic(), 0, shutil.disk_usage(folder).free, None
        try:
            while process.poll() is None:
                q = subprocess.run(['ps', '-o', 'rss=', '-p', str(process.pid)], capture_output=True, text=True)
                if q.returncode and process.poll() is None:
                    reason = 'Memory monitor unavailable'
                peak = max(peak, int(q.stdout.strip() or 0) * 1024)
                minimum = min(minimum, shutil.disk_usage(folder).free)
                if peak > 8 * 1024**3:
                    reason = '8 GiB RSS bound'
                elif minimum < reserve:
                    reason = '30 GiB disk reserve'
                elif time.monotonic() - began > 120:
                    reason = '120 second bound'
                elif faults:
                    reason = 'Native stream: ' + faults[0]
                if reason:
                    break
                time.sleep(.2)
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            reader.join(timeout=15)
            assert not reader.is_alive(), 'Native stream did not finish'
            process.stdout.close()
    report = {'exitCode': process.returncode, 'stopReason': reason, 'maxRssBytes': peak,
              'minimumFreeBytes': minimum, 'seconds': round(time.monotonic() - began, 2),
              'queries': lines, 'rawStreamSha256': digest.hexdigest(), 'streamErrors': faults}
    (folder / 'resources.json').write_text(json.dumps(report, indent=2) + '\n')
    assert process.returncode == 0 and reason is None and not faults, 'Native run failed; inspect ' + str(folder)
    assert len(lines) == len(expected)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--runtime', type=Path, required=True)
    parser.add_argument('--checker', type=Path, required=True)
    parser.add_argument('--support', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    lean, folder, runtime, checker, support = (p.resolve() for p in
        [args.lean, args.workdir, args.runtime, args.checker, args.support])
    plan_raw = (folder / 'plan.json').read_bytes()
    plan = json.loads(plan_raw)
    assert plan['format'] == 'ProofAtlasRegionNativePlan/1' and len(plan['profiles']) == 11
    assert plan['queryCount'] == 150
    assert not (folder / 'outputs').exists(), 'Use a fresh prepared workdir'
    recovery_raw = (runtime / 'recovery.json').read_bytes()
    recovery = json.loads(recovery_raw)
    assert recovery['status'] == 'PASS' and recovery['executableIrRestored'] is False
    def verify_data():
        for row in recovery['files']:
            p = runtime / 'artifacts' / row['file']
            assert p.stat().st_size == row['bytes'] and sha(p.read_bytes()) == row['sha256']
    verify_data()
    paths = [Path(p) for p in (runtime / 'lean-env-path.txt').read_text().strip().split(os.pathsep)]
    private = json.loads((support / 'private-modules.json').read_bytes())
    def verify_support():
        assert all(sha((support / 'SE2Conjugate' / n).read_bytes()) == h for n, h in private['modules'].items())
    verify_support()
    build = json.loads((checker.parent / 'build.json').read_bytes())
    assert build['status'] == 'PASS' and sha(checker.read_bytes()) == build['outputs']['checker']
    for f, h in {**build['sourceFiles'], **plan['files']}.items():
        assert sha((ROOT / f).read_bytes()) == h, f
    sources = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in
               [BASE / 'verify.py', BASE / 'recover.py']}
    bundle = json.loads(gzip.decompress((ROOT / 'research/proof-atlas/corpus-definition-boundaries/native-check.json.gz').read_bytes()))
    (folder / 'outputs').mkdir()
    (folder / 'scratch').mkdir()
    rows = []
    for pi, profile in enumerate(plan['profiles']):
        original = next(p for p in bundle['profiles'] if p['source'] == profile['source'])
        case = next(c for c in original['cases'] if c['plan']['id'] == profile['id'])
        graph_raw = (json.dumps(case['native']['result']['graph'], separators=(',', ':'), ensure_ascii=False) + '\n').encode()
        graph_path = folder / 'input-graph.json'
        graph_path.write_bytes(graph_raw)
        is_riccati = profile['source']['name'] == 'JacobiData.slope_bound_abs'
        imports = ['Mathlib', 'Aesop'] + (['SE2Conjugate.Riccati'] if is_riccati else [])
        request = {**profile, 'imports': imports, 'graphFile': str(graph_path)}
        request_path = folder / 'request.json'
        request_path.write_text(json.dumps(request, separators=(',', ':')) + '\n')
        baseline = folder / 'baseline.json'
        assert not baseline.exists()
        read_paths = paths + ([support] if is_riccati else []) + [checker.parent]
        env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str, [folder] + read_paths)),
               'LANG': 'en_US.UTF-8', 'TMPDIR': str(folder / 'scratch')}
        sandbox = sandbox_profile(lean, folder, read_paths).replace(
            '(literal ' + json.dumps(str(lean)) + ')', '(literal ' + json.dumps(str(checker)) + ')', 1)
        output = folder / 'outputs' / (str(pi) + '.ndjson.gz')
        stats = run_stream(['/usr/bin/sandbox-exec', '-p', sandbox, str(checker), str(lean.parents[1]),
            str(request_path), str(baseline)], folder, env, output, profile['queries'])
        original_check = json.loads(baseline.read_bytes())
        assert original_check['status'] == 'PASS' and original_check['originalTargetImported'] == is_riccati
        assert original_check['kernelRootAssignments'] == 5 and original_check['wrongProofRejected'] is True
        assert original_check['loadExts'] is False and original_check['executableIrRestored'] is False
        assert graph_path.read_bytes() == graph_raw
        rows.append({'profile': pi, 'source': profile['source'], 'id': profile['id'],
            'nativeCaseSha256': profile['nativeCaseSha256'], 'graphSha256': sha(graph_raw),
            'baseline': original_check, 'outputFile': 'outputs/' + output.name,
            'outputSha256': sha(output.read_bytes()), 'resources': stats})
        baseline.unlink()
        graph_path.unlink()
        (folder / 'progress.json').write_text(json.dumps({'completed': rows}, indent=2) + '\n')
        print(json.dumps({'profile': pi, 'id': profile['id'], 'source': profile['source']['name'],
                          'queries': len(profile['queries']), 'status': 'PASS'}), flush=True)
    verify_data()
    verify_support()
    assert (folder / 'plan.json').read_bytes() == plan_raw and (runtime / 'recovery.json').read_bytes() == recovery_raw
    assert sha(checker.read_bytes()) == build['outputs']['checker']
    for f, h in {**build['sourceFiles'], **plan['files'], **sources}.items():
        assert sha((ROOT / f).read_bytes()) == h, f
    report = {'format': 'ProofAtlasRegionNativeVerification/1', 'status': 'PASS',
        'planSha256': sha(plan_raw), 'build': build, 'kernelDataRecoverySha256': sha(recovery_raw),
        'kernelDataReferenceSha256': recovery['referenceSha256'], 'allKernelDataHashesVerified': True,
        'kernelDataAttribution': recovery['attribution'], 'independentDependencyRebuild': False,
        'sourceFiles': sources, 'profiles': rows, 'queries': 150,
        'scope': 'Fresh finite original and projected-closure kernel typing with literal inverses and recovery witnesses. '
                 'Constant-data-only imports with extensions disabled; exact pinned Riccati support reused, original AI proof absent. '
                 'No general typing-preservation theorem, arbitrary-region coverage or comprehension result.'}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'profiles': 11, 'queries': 150}), flush=True)


if __name__ == '__main__':
    main()
