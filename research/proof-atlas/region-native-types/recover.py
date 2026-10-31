"""Recover hash-inventoried kernel data only; never modify the cache archives.

No Mathlib executable IR is restored. This is for importModules loadExts=false
and direct kernel operations, not an executable replacement for Mathlib.
"""
import argparse, hashlib, json, math, os, shutil, subprocess, sys, time
from pathlib import Path


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--reference', type=Path, required=True)
    parser.add_argument('--index', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    lean, reference = args.lean.resolve(), args.reference.resolve()
    root = args.workdir.resolve()
    root.mkdir(exist_ok=False)
    raw = reference.read_bytes()
    manifest = json.loads(raw)
    index_raw = args.index.read_bytes()
    index = json.loads(index_raw)
    assert manifest['status'] == 'PASS'
    assert manifest['attribution'] == 'git=mathlib4@0df444a360eaa60ab8c11dca51a86af692955474'
    expected = {r['file']: r for r in manifest['files'] if r['file'].endswith(
        ('.olean', '.olean.private', '.olean.server'))}
    assert len(expected) == 26070 and len(index) == 8690
    dirs = {str(p) for f in expected for p in Path(f).parents if str(p) != '.'}
    estimated = sum(math.ceil(r['bytes'] / 4096) * 4096 for r in expected.values()) + 4096 * len(dirs)
    reserve = 30 * 1024**3
    assert shutil.disk_usage(root).free >= reserve + estimated + 128 * 1024**2
    artifacts, stage = root / 'artifacts', root / 'stage'
    artifacts.mkdir()
    leantar = lean.parent / 'leantar'
    archives = {r['file']: r for r in manifest['archives']}
    archive_dir = Path(index[0]['file']).resolve().parent
    assert all(Path(r['file']).resolve().parent == archive_dir for r in index)
    allowed = [root, archive_dir, lean.parents[1], Path('/System'), Path('/usr/lib'),
               Path('/private/var/db/dyld')]
    profile = '(version 1)(deny default)(allow process-exec (literal ' + json.dumps(str(leantar)) + '))' + \
        '(allow sysctl-read)(allow mach-lookup)(allow file-read-metadata)(allow file-read* ' + \
        ' '.join('(subpath ' + json.dumps(str(p)) + ')' for p in allowed) + \
        ' (literal "/") (literal "/dev/null"))(allow file-write* (subpath ' + json.dumps(str(root)) + '))'
    count = retained = 0
    minimum = shutil.disk_usage(root).free
    files = []
    try:
        for start in range(0, len(index), 8):
            batch = index[start:start + 8]
            for row in batch:
                original = archives[Path(row['file']).name]
                assert original['module'] == row['module']
                assert sha(Path(row['file']).read_bytes()) == original['sha256']
                comment = subprocess.check_output([str(leantar), '-k', row['file']], text=True).strip()
                assert comment == manifest['attribution']
            stage.mkdir()
            with (root / 'extract.log').open('ab') as log:
                process = subprocess.Popen(['/usr/bin/sandbox-exec', '-p', profile, str(leantar),
                    '-x', '--jobs', '2', '-C', str(stage), *[r['file'] for r in batch]],
                    stdout=log, stderr=subprocess.STDOUT)
                began = time.monotonic()
                try:
                    while process.poll() is None:
                        free = shutil.disk_usage(root).free
                        minimum = min(minimum, free)
                        assert free >= reserve, 'Disk reserve'
                        assert time.monotonic() - began <= 120, 'Batch time bound'
                        status = subprocess.run(['ps', '-o', 'rss=', '-p', str(process.pid)],
                            capture_output=True, text=True)
                        assert status.returncode == 0 or process.poll() is not None, 'Memory monitor'
                        assert int(status.stdout.strip() or 0) * 1024 <= 2 * 1024**3, 'Extractor RSS bound'
                        time.sleep(.05)
                    assert process.returncode == 0
                finally:
                    if process.poll() is None:
                        process.terminate()
                        process.wait(timeout=15)
            for file in stage.rglob('*'):
                if not file.is_file():
                    continue
                rel = str(file.relative_to(stage))
                if rel not in expected:
                    continue
                record = expected[rel]
                content = file.read_bytes()
                assert len(content) == record['bytes'] and sha(content) == record['sha256']
                dest = artifacts / rel
                assert not dest.exists()
                dest.parent.mkdir(exist_ok=True, parents=True)
                file.rename(dest)
                count += 1
                retained += len(content)
                files.append(record)
            shutil.rmtree(stage)
            assert shutil.disk_usage(root).free >= reserve
            if start % 400 == 0:
                print(json.dumps({'modules': start + len(batch), 'files': count,
                                  'retainedBytes': retained}), flush=True)
        assert count == len(expected)
        assert reference.read_bytes() == raw and args.index.read_bytes() == index_raw
        files.sort(key=lambda r: r['file'])
        old_root = reference.parent / 'artifacts'
        paths = [artifacts / Path(p).resolve().relative_to(old_root)
                 for p in (reference.parent / 'lean-env-path.txt').read_text().strip().split(os.pathsep)]
        assert all(p.is_dir() for p in paths)
        (root / 'lean-env-path.txt').write_text(os.pathsep.join(map(str, paths)) + '\n')
        report = {'format': 'ProofAtlasKernelDataRecovery/1', 'status': 'PASS',
                  'referenceSha256': sha(raw), 'indexSha256': sha(index_raw),
                  'attribution': manifest['attribution'], 'independentRebuild': False,
                  'facets': ['olean', 'olean.server', 'olean.private'], 'files': files,
                  'retainedBytes': retained, 'minimumFreeBytes': minimum,
                  'reserveBytes': reserve, 'executableIrRestored': False}
        (root / 'recovery.json').write_text(json.dumps(report, separators=(',', ':')) + '\n')
        print(json.dumps({k: v for k, v in report.items() if k != 'files'}), flush=True)
    except BaseException:
        if stage.exists():
            shutil.rmtree(stage)
        shutil.rmtree(artifacts)
        raise


if __name__ == '__main__':
    main()
