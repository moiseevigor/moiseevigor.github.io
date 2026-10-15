"""Recompile a pinned, predetermined AI-proof sample without repairing its scripts.

The original files, compiler logs and resource records stay in a private workdir.
This driver does not download dependencies, rebuild Mathlib or publish anything.
External Lean scripts run with no network, subprocess execution or write access
outside the workdir. The available compiled dependencies are revision checked.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import shutil
import subprocess
import time

REVISION = 'b731852af8d8ab11498fda27bce9020738c01c59'
PARQUET_SHA = '24fcb50eecc2ccbcc52a58c6412c6d10edbeaa9483a97d30e207fb20ef6e2677'
HEADER = ('import Mathlib\nimport Aesop\n\nset_option maxHeartbeats 0\n\n'
          'open BigOperators Real Nat Topology Rat\n\n')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def without_comments_and_strings(source):
    output, offset, depth = [], 0, 0
    while offset < len(source):
        if source.startswith('/-', offset):
            depth += 1
            offset += 2
        elif depth and source.startswith('-/', offset):
            depth -= 1
            offset += 2
        elif depth:
            offset += 1
        elif source.startswith('--', offset):
            end = source.find('\n', offset)
            offset = len(source) if end < 0 else end
        elif source[offset] == '"':
            offset += 1
            while offset < len(source):
                if source[offset] == '\\':
                    offset += 2
                elif source[offset] == '"':
                    offset += 1
                    break
                else:
                    offset += 1
            output.append(' ')
        else:
            output.append(source[offset])
            offset += 1
    assert depth == 0, 'Unclosed source comment'
    return ''.join(output)


def review_source(row):
    source = row['full_proof']
    assert sha(source.encode()) == row['sourceSha256'], 'Changed dataset source'
    text = without_comments_and_strings(source)
    assert text.startswith(HEADER), 'Unsupported imports or command header'
    body = text[len(HEADER):]
    assert re.findall(r'\btheorem\s+(\w+)', body) == [row['problem_id']], 'Theorem identity'
    forbidden = (r'\b(?:run_tac|run_elab|native_decide|unsafe|axiom|sorry|admit|elab|'
                 r'macro|syntax|initialize|attribute|instance|opaque|def|lemma|import|'
                 r'set_option|IO|System|Lean)\b|#')
    assert not re.search(forbidden, body), 'Unsupported metaprogramming/source command'
    assert len(source.encode()) <= 65536, 'Source size bound'
    return source


def verify_dependencies(snapshot):
    raw = (snapshot / 'lake-manifest.json').read_bytes()
    expected = {p['name']: p['rev'] for p in json.loads(raw)['packages']}
    paths, revisions = [], {}
    for item in (snapshot / 'lean-env-path.txt').read_text().strip().split(os.pathsep):
        path = Path(item)
        if '/.lake/packages/' not in item or not item.endswith('/.lake/build/lib/lean'):
            continue
        package = path.parents[3]
        actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=package, text=True).strip()
        assert expected.get(package.name) == actual, 'Dependency revision mismatch'
        assert path.is_dir(), 'Missing compiled dependency'
        paths.append(path)
        revisions[package.name] = actual
    assert revisions.get('mathlib') == '0df444a360eaa60ab8c11dca51a86af692955474'
    return paths, {'lakeManifestSha256': sha(raw), 'dependencyRevisions': revisions}


def sandbox_profile(lean, folder, paths):
    read_paths = [lean.parents[1], folder, Path('/System'), Path('/usr/lib'),
                  Path('/usr/share'), Path('/private/var/db/dyld'), Path('/private/var/db/timezone')]
    read_paths += [p.parent.resolve() for p in paths]
    reads = ' '.join('(subpath ' + json.dumps(str(p.resolve())) + ')' for p in read_paths)
    return ('(version 1)(deny default)(allow process-exec (literal ' + json.dumps(str(lean)) + '))'
            '(allow sysctl-read)(allow mach-lookup)(allow file-read-metadata)'
            '(allow file-read* ' + reads + ' (literal "/") (literal "/dev/null") (literal "/dev/urandom"))'
            '(allow file-write* (subpath ' + json.dumps(str(folder)) + '))')


def run_lean(lean, folder, paths, source, label, timeout=60):
    assert shutil.disk_usage(folder).free >= 30 * 1024**3, 'Free-space reserve'
    profile = sandbox_profile(lean, folder, paths)
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin',
           'LEAN_PATH': os.pathsep.join(map(str, [folder] + paths)),
           'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    command = ['/usr/bin/sandbox-exec', '-p', profile, str(lean), '-o',
               str(source.with_suffix('.olean')), str(source)]
    start, peak, reason = time.monotonic(), 0, None

    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE, (64 * 1024**2, 64 * 1024**2))

    with (folder / (label + '.log')).open('w') as log:
        process = subprocess.Popen(command, cwd=folder, env=env, stdout=log,
                                   stderr=subprocess.STDOUT, preexec_fn=limits)
        try:
            while process.poll() is None:
                check = subprocess.run(['ps', '-o', 'rss=', '-p', str(process.pid)],
                                       capture_output=True, text=True)
                if check.returncode and process.poll() is None:
                    reason = 'Memory monitor unavailable'
                    break
                peak = max(peak, int(check.stdout.strip() or 0) * 1024)
                size = sum(p.stat().st_size for p in folder.rglob('*') if p.is_file())
                if peak > 8 * 1024**3:
                    reason = '8 GiB memory bound'
                elif shutil.disk_usage(folder).free < 30 * 1024**3:
                    reason = '30 GiB free-space reserve'
                elif size > 512 * 1024**2:
                    reason = '512 MiB workdir bound'
                elif time.monotonic() - start > timeout:
                    reason = 'Time bound'
                if reason:
                    break
                time.sleep(.2)
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
    result = {'exitCode': process.returncode, 'stopReason': reason,
              'maxRssBytes': peak, 'seconds': round(time.monotonic() - start, 2)}
    (folder / (label + '.resources.json')).write_text(json.dumps(result, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset-dir', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--lean', type=Path, required=True)
    args = parser.parse_args()
    assert shutil.which('sandbox-exec'), 'This evaluation driver requires the macOS sandbox'
    rows = json.loads((args.dataset_dir / 'selected.json').read_text())
    selection = json.loads(Path(__file__).with_name('goedel-selection.json').read_text())
    fields = ['row', 'problem_id', 'bytes', 'sourceSha256']
    assert [{k:r[k] for k in fields} for r in rows] == [{k:r[k] for k in fields} for r in selection['entries']], 'Fixed sample identity'
    driver_sha = sha(Path(__file__).read_bytes())
    assert sha((args.dataset_dir / 'train-00000-of-00001.parquet').read_bytes()) == PARQUET_SHA
    paths, environment = verify_dependencies(args.snapshot)
    compiler = subprocess.check_output([str(args.lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    folder = args.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder / 'scratch').mkdir()
    control = folder / 'Control.lean'
    control.write_text('import Mathlib\nimport Aesop\ntheorem ProofAtlasAIControl_20261015 (x : ℝ) : x+x=2*x := by ring\n')
    check = run_lean(args.lean, folder, paths, control, 'control')
    assert check['exitCode'] == 0 and not check['stopReason'], 'Environment/control failure'
    results = []
    for row in rows:
        label = 'row-' + str(row['row'])
        source = folder / 'ProofAtlasAI' / 'Goedel' / ('WB' + str(row['row']) + '.lean')
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text(review_source(row))
        result = run_lean(args.lean, folder, paths, source, label)
        assert sha(source.read_bytes()) == row['sourceSha256'], 'Source changed during compilation'
        result.update({k: row[k] for k in ['row', 'problem_id', 'bytes', 'sourceSha256']})
        result['module'] = 'ProofAtlasAI.Goedel.WB' + str(row['row'])
        result['compiledModuleSha256'] = sha(source.with_suffix('.olean').read_bytes()) if result['exitCode'] == 0 and not result['stopReason'] else None
        results.append(result)
        (folder / 'compilation.json').write_text(json.dumps(results, indent=2) + '\n')
        print(json.dumps({k: result[k] for k in ['row', 'problem_id', 'exitCode', 'stopReason']}), flush=True)
        if result['stopReason'] in ['Memory monitor unavailable', '30 GiB free-space reserve', '512 MiB workdir bound']:
            raise RuntimeError('Evaluation stopped: ' + result['stopReason'])
    record = {'status': 'COMPILED_SAMPLE', 'publisher': 'Goedel-LM/Lean-workbook-proofs',
              'revision': REVISION, 'parquetSha256': PARQUET_SHA, 'compiler': compiler,
              'environment': environment, 'control': check, 'results': results, 'driverSha256': driver_sha,
              'scope': 'Predetermined sample, unmodified source scripts under a newer Lean/Mathlib environment. Failures are not attributed to version drift without further evidence.'}
    assert sha(Path(__file__).read_bytes()) == driver_sha, 'Driver changed during evaluation'
    (folder / 'evaluation.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps({'status': record['status'], 'attempted': len(results),
                      'compiled': sum(r['compiledModuleSha256'] is not None for r in results)}))


if __name__ == '__main__':
    main()
