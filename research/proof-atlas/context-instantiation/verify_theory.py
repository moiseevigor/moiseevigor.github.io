"""Recheck the general Lean.Expr laws using an installed Lean core, including CI."""
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
    folder, lean = args.workdir.resolve(), args.lean.resolve()
    assert shutil.disk_usage(folder.parent).free >= 5*1024**3
    folder.mkdir(exist_ok=False)
    version = subprocess.check_output([str(lean), '--version'], text=True)
    assert 'version 4.33.1,' in version
    for name, path in [('ContextFrame', BASE.parent/'occurrence-constructions/ContextFrame.lean'),
                       ('Instantiation', BASE.parent/'context-modules/Instantiation.lean')]:
        shutil.copyfile(path, folder/(name+'.lean'))
    env = dict(os.environ, LEAN_PATH=str(folder))

    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE, (64*1024**2,)*2)

    for name in ['ContextFrame', 'Instantiation']:
        result = subprocess.run([str(lean), '-j1', '-M2048', '-o', name+'.olean', name+'.lean'],
                                cwd=folder, env=env, text=True, capture_output=True, timeout=120,
                                preexec_fn=limits)
        (folder/(name+'.log')).write_text(result.stdout+result.stderr)
        assert result.returncode == 0, 'Theory compile failed: '+str(folder/(name+'.log'))
    actual = {}
    for name, _, values in re.findall(
            r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$",
            (folder/'Instantiation.log').read_text(), re.MULTILINE):
        assert name not in actual
        actual[name] = [v.strip() for v in values.split(',') if v.strip()]
        assert set(actual[name]) <= {'propext', 'Quot.sound'}
    expected = json.loads(gzip.decompress((BASE/'verification.json.gz').read_bytes()))['axioms']
    expected = {k:v for k,v in expected.items() if k.startswith('ProofAtlas.ContextInstantiation.')}
    assert len(actual) == 33 and actual == expected
    print(json.dumps({'status':'PASS', 'proofDeclarations':len(actual), 'generalAndHelperLaws':27, 'boundaryEquations':6, 'maximumHeapMiB':2048,
                      'scope':'General explicit-binder syntax laws; no mathematical source typing.'}))


if __name__ == '__main__':
    main()
