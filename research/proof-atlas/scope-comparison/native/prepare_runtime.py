"""Add official Lean-core IR and signatures to the minimal theorem runtime."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile

RELEASE_SHA256 = '88c45aad985b5d2a8d925fe10bd1296bd35f66f408480ab182d3facccd065a9d'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--core', type=Path, required=True)
    args = parser.parse_args()
    archive, core = args.archive.resolve(), args.core.resolve()
    assert json.loads((core/'core-install.json').read_text())['release']['sha256'] == RELEASE_SHA256
    with archive.open('rb') as source:
        assert hashlib.file_digest(source, 'sha256').hexdigest() == RELEASE_SHA256
    assert shutil.disk_usage(core).free >= 21*1024**3
    process = subprocess.Popen([shutil.which('zstd'), '-dc', str(archive)], stdout=subprocess.PIPE)
    count = size = 0
    with tarfile.open(fileobj=process.stdout, mode='r|') as bundle:
        for member in bundle:
            parts = PurePosixPath(member.name).parts
            assert parts[0] == 'lean-4.33.1-darwin_aarch64' and '..' not in parts
            relative = PurePosixPath(*parts[1:])
            if not str(relative).startswith('lib/lean/') or not relative.name.endswith(('.ir', '.ir.sig')):
                continue
            assert member.isfile()
            size += member.size
            assert size <= 1024**3
            target = core/str(relative)
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.extractfile(member) as source:
                raw = source.read()
            if target.exists():
                assert target.read_bytes() == raw
            else:
                target.write_bytes(raw)
            count += 1
    assert process.wait(timeout=10) == 0 and count > 0
    assert shutil.disk_usage(core).free >= 20*1024**3
    report = dict(status='PASS', officialArchiveSha256=RELEASE_SHA256, files=count, bytes=size,
                  originalProofProjectsRead=False, mathlibRestored=False)
    (core/'runtime-ir-install.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
