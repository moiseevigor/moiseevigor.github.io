"""Portable kernel check of the certified postorder executor, without corpus imports."""
import argparse
import gzip
import json
import os
from pathlib import Path
import re
import resource
import shutil
import subprocess

BASE = Path(__file__).resolve().parent


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    args = p.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= 5*1024**3
    folder.mkdir(exist_ok=False)
    assert 'version 4.33.1,' in subprocess.check_output([str(lean), '--version'], text=True)
    files = [('ContextFrame', BASE.parent/'occurrence-constructions/ContextFrame.lean'),
             ('Instantiation', BASE.parent/'context-modules/Instantiation.lean'),
             ('Certified', BASE/'Certified.lean')]

    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE, (64*1024**2,)*2)

    env = dict(os.environ, LEAN_PATH=str(folder))
    for name, file in files:
        shutil.copyfile(file, folder/(name+'.lean'))
        result = subprocess.run([str(lean), '-j1', '-M2048', '-o', name+'.olean', name+'.lean'],
                                cwd=folder, env=env, text=True, capture_output=True,
                                timeout=120, preexec_fn=limits)
        (folder/(name+'.log')).write_text(result.stdout+result.stderr)
        assert result.returncode == 0, 'Theory compilation failed: '+str(folder/(name+'.log'))
    axioms = {}
    for name, _, values in re.findall(r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$", (folder/'Certified.log').read_text(), re.MULTILINE):
        assert name not in axioms
        axioms[name] = [v.strip() for v in values.split(',') if v.strip()]
        assert set(axioms[name]) <= {'propext', 'Quot.sound'}
    assert len(axioms) == 11
    expected = json.loads(gzip.decompress((BASE/'verification.json.gz').read_bytes()))['axioms']
    expected = {n:a for n,a in expected.items() if n.startswith('ProofAtlas.CertifiedSubstitution.')}
    assert axioms == expected
    print(json.dumps({'status':'PASS', 'checkedDeclarations':11,
                      'statement':'Successful memoized DAG outputs equal Lean.Expr substitution.',
                      'scope':'The total executor and its return proofs; decoder and mathematical typing are separate.'}))


if __name__ == '__main__':
    main()
