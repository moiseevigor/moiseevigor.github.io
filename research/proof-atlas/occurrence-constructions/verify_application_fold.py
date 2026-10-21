"""Check application-spine structural laws; keep compiler logs outside the site."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import sys

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
spec = importlib.util.spec_from_file_location('native', BASE.parent/'cut-records/verify_native.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
NAMES = ['split_roundtrip', 'split_argument_bound', 'join_occurrences', 'split_partition']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--reserve-gib', type=int, default=30)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--write-summary', action='store_true')
    args = parser.parse_args()
    assert args.reserve_gib >= 1
    folder = args.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder/'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= args.reserve_gib*1024**3
    lean = args.lean.resolve()
    env = dict(PATH=str(lean.parent)+os.pathsep+os.defpath, LEAN_PATH=str(folder),
               TMPDIR=str(folder/'scratch'), LANG='en_US.UTF-8')
    native.run_checked([str(lean), '--version'], folder, 'version', env, args.reserve_gib, 120)
    version = (folder/'version.log').read_text().strip()
    assert 'version 4.33.1,' in version
    source = BASE/'ApplicationFold.lean'
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    entry = folder/'ApplicationFold.lean'
    entry.write_bytes(source.read_bytes())
    command = [str(lean), '--root='+str(folder), str(entry)]
    if sys.platform == 'darwin':
        command = ['/usr/bin/sandbox-exec', '-p', native.sandbox_profile(lean, folder, []), *command]
    native.run_checked(command, folder, 'native', env, args.reserve_gib, 120)
    log = (folder/'native.log').read_text()
    assert 'sorryAx' not in log and ': error:' not in log
    parsed = {name: sorted(a.strip() for a in axioms.split(',') if a.strip())
              for name, axioms in re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", log)}
    laws = {'ProofAtlas.ApplicationFold.'+name: parsed['ProofAtlas.ApplicationFold.'+name] for name in NAMES}
    assert all(set(axioms) <= {'propext', 'Quot.sound'} for axioms in laws.values())
    assert hashlib.sha256(source.read_bytes()).hexdigest() == sha
    summary = dict(format='ProofAtlasApplicationSpineLaws/1', status='PASS',
                   toolchain='leanprover/lean4:v4.33.1', sourceFile=str(source.relative_to(ROOT)),
                   sourceSha256=sha, theorems=laws, javascriptFormallyVerified=False,
                   typingAlgorithmFormallyVerified=False, rendererVerified=False,
                   scope='Exact Lean.Expr split/reassembly, bounded argument count and occurrence partition for every fuel and expression. No native typing, serialized cut or browser theorem.')
    raw = (json.dumps(summary, sort_keys=True, indent=2)+'\n').encode()
    (folder/'verification.json').write_bytes(raw)
    published = BASE/'application-fold-laws.json'
    if args.check:
        assert published.read_bytes() == raw, 'Application-fold law summary differs'
    if args.write_summary:
        published.write_bytes(raw)
    print(json.dumps(dict(status='PASS', theorems=len(laws), report=str(folder/'verification.json'))))


if __name__ == '__main__':
    main()
