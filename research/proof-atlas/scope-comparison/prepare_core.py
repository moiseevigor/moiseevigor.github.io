"""Extract only the pinned macOS ARM Lean core runtime from an official archive."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile

RELEASE = dict(url='https://github.com/leanprover/lean4/releases/download/v4.33.1/lean-4.33.1-darwin_aarch64.tar.zst',
               bytes=556491708, sha256='88c45aad985b5d2a8d925fe10bd1296bd35f66f408480ab182d3facccd065a9d')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    archive, output = args.archive.resolve(), args.output.resolve()
    assert archive.stat().st_size == RELEASE['bytes']
    with archive.open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == RELEASE['sha256']
    assert shutil.disk_usage(output.parent).free >= 23*1024**3
    output.mkdir(exist_ok=False)
    zstd = shutil.which('zstd')
    assert zstd
    process = subprocess.Popen([zstd, '-dc', str(archive)], stdout=subprocess.PIPE)
    count = size = 0
    try:
        with tarfile.open(fileobj=process.stdout, mode='r|') as bundle:
            for member in bundle:
                parts = PurePosixPath(member.name).parts
                assert parts and parts[0] == 'lean-4.33.1-darwin_aarch64' and '..' not in parts
                relative = PurePosixPath(*parts[1:])
                selected = (str(relative) in ['bin/lean', 'LICENSE', 'LICENSES'] or
                            str(relative).startswith('lib/') and
                            ('.dylib' in relative.name or relative.name.endswith(('.olean', '.olean.private', '.olean.server'))))
                if not selected or member.isdir():
                    continue
                assert member.isfile(), 'Only regular runtime files are selected: '+member.name
                size += member.size
                assert size <= 3*1024**3
                target = output/str(relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                with bundle.extractfile(member) as source, target.open('xb') as destination:
                    shutil.copyfileobj(source, destination)
                target.chmod(0o755 if str(relative) == 'bin/lean' else 0o644)
                count += 1
        assert process.wait(timeout=10) == 0
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
    assert shutil.disk_usage(output).free >= 20*1024**3
    version = subprocess.check_output([str(output/'bin/lean'), '--version'], text=True).strip()
    assert 'version 4.33.1,' in version
    report = dict(format='ProofAtlasTemporaryLeanCore/1', status='PASS', release=RELEASE,
                  compiler=version, retainedFiles=count, retainedBytes=size,
                  mathlibRestored=False, staticLibrariesAndOtherToolBinariesOmitted=True)
    (output/'core-install.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
