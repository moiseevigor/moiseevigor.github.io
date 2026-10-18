"""Kernel-check segmented focusing laws. JavaScript encoding is a separate finite check."""
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
spec = importlib.util.spec_from_file_location('source_native', BASE.parent/'cut-records/verify_native.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
sha = lambda b: hashlib.sha256(b).hexdigest()
NAMES = ['follow_append', 'source_from_follow', 'source_in_segments', 'follow_route', 'oldest_target_agrees']


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--reserve-gib', type=int, default=30)
    p.add_argument('--compare', type=Path)
    a = p.parse_args()
    assert a.reserve_gib >= 1
    folder = a.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder/'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= a.reserve_gib*1024**3
    lean = a.lean.resolve()
    env = dict(PATH=str(lean.parent)+os.pathsep+os.defpath, LEAN_PATH=str(folder), TMPDIR=str(folder/'scratch'), LANG='en_US.UTF-8')
    native.run_checked([str(lean), '--version'], folder, 'version', env, a.reserve_gib, 120)
    version = (folder/'version.log').read_text().strip()
    assert 'version 4.33.1,' in version
    files = [BASE.parent/'cut-refinement/Cut.lean', BASE.parent/'cut-records/Binding.lean', BASE/'Focus.lean', Path(__file__),
             BASE.parent/'cut-records/verify_native.py', BASE.parent/'build_recursion_examples.py']
    hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    source = '\n'.join(f.read_text() for f in files[:3])
    entry = folder/'Focus.lean'
    entry.write_text(source)
    cmd = [str(lean), '--root='+str(folder), str(entry)]
    if sys.platform == 'darwin':
        cmd = ['/usr/bin/sandbox-exec', '-p', native.sandbox_profile(lean, folder, []), *cmd]
    native.run_checked(cmd, folder, 'native', env, a.reserve_gib, 120)
    log = (folder/'native.log').read_text()
    assert 'sorryAx' not in log and ': error:' not in log
    parsed = {n: sorted(v.strip() for v in values.split(',') if v.strip())
              for n, values in re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", log)}
    laws = {'ProofAtlas.SourceCut.Binding.'+name: parsed['ProofAtlas.SourceCut.Binding.'+name] for name in NAMES}
    assert all(set(v) <= {'propext', 'Quot.sound'} for v in laws.values())
    assert hashes == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    result = dict(status='PASS', format='ProofAtlasOccurrenceFocusLaws/1', toolchain='leanprover/lean4:v4.33.1',
                  sourceFiles=hashes, runtimeSha256=sha(source.encode()), theorems=laws,
                  codecFormallyVerified=False, browserRendererVerified=False, mathematicalTypingChecked=False,
                  scope='Structural focusing over actual Lean.Expr and arbitrary finite paths. Segments preserve the original lexical target. No JavaScript, resource, decoder or typing theorem.')
    raw = (json.dumps(result, sort_keys=True, separators=(',', ':'))+'\n').encode()
    (folder/'verification.json').write_bytes(raw)
    if a.compare:
        assert a.compare.read_bytes() == raw, 'Compiled law summary differs'
    print(json.dumps(dict(status='PASS', theorems=len(laws), sha256=sha(raw), report=str(folder/'verification.json'))))


if __name__ == '__main__':
    main()
