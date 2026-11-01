"""Core-only kernel checks of occurrence paths, image suffixes and binder owners."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import shutil
import signal
import subprocess
import time

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sha = lambda b: hashlib.sha256(b).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--reserve-gib', type=int, default=20)
    p.add_argument('--publish', action='store_true')
    args = p.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert args.reserve_gib >= 5
    assert shutil.disk_usage(folder.parent).free >= args.reserve_gib*1024**3
    folder.mkdir(exist_ok=False)
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    modules = [('ContextFrame', BASE.parent/'occurrence-constructions/ContextFrame.lean'),
               ('Instantiation', BASE.parent/'context-modules/Instantiation.lean'),
               ('Certified', BASE.parent/'certified-substitution/Certified.lean'),
               ('Paths', BASE/'Paths.lean')]
    producers = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for _, f in modules}
    producers[str(Path(__file__).relative_to(ROOT))] = sha(Path(__file__).read_bytes())
    source = (BASE/'Paths.lean').read_text()
    assert not re.search(r'\b(sorry|admit|axiom|unsafe|partial)\b', source)
    names = re.findall(r'^(?:def|theorem) (\w+)', source, re.MULTILINE)
    env = dict(os.environ, LEAN_PATH=str(folder))
    runs = []

    def compile_file(name, content, accepted):
        (folder/(name+'.lean')).write_text(content)
        def limits():
            resource.setrlimit(resource.RLIMIT_FSIZE, (64*1024**2,)*2)
        start = time.monotonic()
        with (folder/(name+'.log')).open('w') as log:
            process = subprocess.Popen([str(lean), '-j1', '-M2048', '-o', name+'.olean', name+'.lean'],
                                       cwd=folder, env=env, stdout=log, stderr=subprocess.STDOUT,
                                       preexec_fn=limits, start_new_session=True)
            try:
                code = process.wait(timeout=120)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                raise RuntimeError('Theory command time bound: '+name)
        output = (folder/(name+'.log')).read_text()
        assert len(output.encode()) <= 64*1024**2
        assert shutil.disk_usage(folder).free >= args.reserve_gib*1024**3
        assert sum(f.stat().st_size for f in folder.rglob('*') if f.is_file()) <= 256*1024**2
        assert (code == 0) == accepted, name+'; inspect '+str(folder/(name+'.log'))
        if not accepted:
            assert 'error:' in output and not re.search(r'unknown (identifier|constant)|unexpected token|maximum recursion|heartbeats|out of memory', output, re.I), name
        runs.append({'name': name, 'exitCode': code, 'logSha256': sha(output.encode()),
                     'seconds': round(time.monotonic()-start, 2)})
        return output

    for name, file in modules:
        output = compile_file(name, file.read_text(), True)
    axioms = {}
    for name, _, values in re.findall(r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$", output, re.MULTILINE):
        axioms[name] = [v.strip() for v in values.split(',') if v.strip()]
        assert set(axioms[name]) <= {'propext', 'Quot.sound'}
    assert set(axioms) == {'ProofAtlas.SubstitutionPaths.'+n for n in names}
    mutations = [
        ('let-value-acquires-own-binder', '| .letE _ _ v _ _, 1 => some (v,0)', '| .letE _ _ v _ _, 1 => some (v,1)'),
        ('lambda-body-loses-binder', '| .lam _ _ b _, 1 => some (b,1)', '| .lam _ _ b _, 1 => some (b,0)'),
        ('source-path-omits-lift', 'some (subst (liftSubst σ depth) out,depth)', 'some (subst σ out,depth)'),
        ('expr-port-disagrees-with-graph', '| .app f _, 0 => some (f,0)', '| .app _ a, 0 => some (a,0)')]
    refusals = []
    for index, (name, before, after) in enumerate(mutations):
        assert before in source
        damaged = source.replace(before, after, 1)
        output = compile_file('Bad'+str(index), damaged, False)
        refusals.append({'name': name, 'kernelAccepted': False, 'sourceSha256': sha(damaged.encode()),
                         'diagnosticSha256': sha(output.encode())})
    assert producers == {f: sha((ROOT/f).read_bytes()) for f in producers}
    report = {'format': 'ProofAtlasSubstitutionPathTheory/1', 'status': 'PASS',
              'compiler': compiler, 'leanExecutableSha256': sha(lean.read_bytes()),
              'producerFiles': producers, 'axioms': axioms, 'theorems': len(re.findall(r'^theorem ', source, re.MULTILINE)),
              'declarations': len(names), 'refusals': refusals, 'runs': runs,
              'originalProofProjectsRead': False, 'dependencyCacheRestored': False,
              'scope': 'General syntax laws on actual Lean.Expr: valid source paths, image suffixes, graph-path refinement and local binder-owner preservation. No JavaScript/JSON refinement or mathematical typing theorem.'}
    local = folder/'theory.json'
    local.write_text(json.dumps(report, indent=2)+'\n')
    target = BASE/'theory.json.gz'
    if args.publish:
        target.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':'))+'\n').encode(), mtime=0))
    else:
        previous = json.loads(gzip.decompress(target.read_bytes()))
        assert previous['axioms'] == report['axioms'] and previous['producerFiles'] == report['producerFiles']
    print(json.dumps({'status': 'PASS', 'theorems': report['theorems'], 'declarations': len(names),
                      'refusals': len(refusals), 'scope': report['scope']}))


if __name__ == '__main__':
    main()
