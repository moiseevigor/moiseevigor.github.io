"""Check scope-range laws with Lean core; reject false scope conventions."""
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
import sys
import time

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
POLICY = dict(minimumFreeBytes=20*1024**3, scratchBytes=256*1024**2,
              fileBytes=64*1024**2, commandSeconds=120, leanMemoryMiB=2048)
sha = lambda value: hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--publish', action='store_true', help='Save compressed technical evidence, not a blog post.')
    args = parser.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert sys.platform == 'darwin', 'This verifier requires the recorded macOS no-network sandbox.'
    assert shutil.disk_usage(folder.parent).free >= POLICY['minimumFreeBytes']
    folder.mkdir(exist_ok=False)
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    sources = {name: (BASE/(name+'.lean')).read_text() for name in ['Ranges', 'Graph']}
    for text in sources.values():
        assert not re.search(r'\b(sorry|admit|axiom|unsafe|partial)\b', text)
    assert re.findall(r'^import (.+)$', sources['Ranges'], re.M) == ['Lean']
    assert re.findall(r'^import (.+)$', sources['Graph'], re.M) == ['Ranges']
    producers = {str(file.relative_to(ROOT)): sha(file.read_bytes())
                 for file in [BASE/'Ranges.lean', BASE/'Graph.lean', BASE/'prepare_core.py', Path(__file__)]}
    profile = '\n'.join(['(version 1)', '(allow default)', '(deny network*)', '(deny file-write*)',
                         '(allow file-write* (subpath '+json.dumps(str(folder))+') (literal "/dev/null"))', ''])
    (folder/'confinement.sb').write_text(profile)
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder))
    runs, axioms, diagnostics = [], {}, {}

    def compile_file(label, source, accepted):
        (folder/(label+'.lean')).write_text(source)

        def limits():
            resource.setrlimit(resource.RLIMIT_FSIZE, (POLICY['fileBytes'],)*2)

        start = time.monotonic()
        command = ['/usr/bin/sandbox-exec', '-f', str(folder/'confinement.sb'),
                   str(lean), '-j1', '-M'+str(POLICY['leanMemoryMiB']),
                   '-o', label+'.olean', label+'.lean']
        with (folder/(label+'.log')).open('w') as log:
            process = subprocess.Popen(command, cwd=folder, env=env, stdout=log,
                                       stderr=subprocess.STDOUT, preexec_fn=limits, start_new_session=True)
            try:
                code = process.wait(timeout=POLICY['commandSeconds'])
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                raise RuntimeError('Theory command time limit: '+label)
        output = (folder/(label+'.log')).read_text()
        diagnostics[label] = output
        assert len(output.encode()) <= POLICY['fileBytes']
        assert shutil.disk_usage(folder).free >= POLICY['minimumFreeBytes']
        used = sum(file.stat().st_size for file in folder.rglob('*') if file.is_file())
        assert used <= POLICY['scratchBytes']
        assert (code == 0) == accepted, label+'; inspect '+str(folder/(label+'.log'))
        if accepted:
            assert 'declaration uses' not in output and 'sorryAx' not in output
        else:
            assert code > 0 and 'error:' in output
            assert not re.search(r'unknown (identifier|constant)|unexpected token|maximum recursion|heartbeats|out of memory|failed to (load|open)|operation not permitted', output, re.I), label
        runs.append(dict(name=label, exitCode=code, seconds=round(time.monotonic()-start, 3),
                         sourceSha256=sha(source.encode()), logSha256=sha(output.encode()), scratchBytes=used))
        print(json.dumps(dict(name=label, accepted=accepted, exitCode=code)), flush=True)
        return output

    for label, text in sources.items():
        output = compile_file(label, text, True)
        found = {}
        for name, _, values in re.findall(r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$", output, re.M):
            found[name] = [value.strip() for value in values.split(',') if value.strip()]
            assert set(found[name]) <= {'propext', 'Quot.sound'}
        expected = {'ProofAtlas.ScopeComparison.'+name for name in re.findall(r'^theorem (\w+)', text, re.M)}
        assert set(found) == expected and not set(found).intersection(axioms)
        axioms.update(found)
    assert len(axioms) == 13
    mutations = [
        ('minimum-replaced-by-maximum', 'Ranges', 'i = j ∧ i < lo', 'i = j ∧ i < hi'),
        ('lambda-body-loses-binder', 'Ranges', '(body : Match amount b b\' (lo+1) (hi+1))', '(body : Match amount b b\' lo hi)'),
        ('let-value-acquires-own-binder', 'Ranges', '(value : Match amount v v\' lo hi)', '(value : Match amount v v\' (lo+1) (hi+1))'),
        ('graph-let-value-acquires-own-binder', 'Graph', 'Covers bounds parent val 0', 'Covers bounds parent val 1'),
        ('graph-upper-cover-reversed', 'Graph', '(bounds parent).2 + increment ≤ (bounds child.val).2', '(bounds child.val).2 ≤ (bounds parent).2 + increment'),
    ]
    refusals = []
    for index, (name, module, before, after) in enumerate(mutations):
        assert before in sources[module]
        damaged = sources[module].replace(before, after, 1)
        output = compile_file('Bad'+str(index), damaged, False)
        refusals.append(dict(name=name, module=module, kernelAccepted=False,
                             sourceSha256=sha(damaged.encode()), diagnosticSha256=sha(output.encode())))
    assert producers == {file: sha((ROOT/file).read_bytes()) for file in producers}
    libraries = lean.parents[1]/'lib/lean'
    core = [libraries/name for name in ['Lean.olean', 'libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    report = dict(format='ProofAtlasScopeComparisonTheory/1', status='PASS', compiler=compiler,
                  leanExecutableSha256=sha(lean.read_bytes()), coreIdentities={file.name: sha(file.read_bytes()) for file in core},
                  producerFiles=producers, theorems=len(axioms), axioms=axioms, refusals=refusals, runs=runs,
                  resourcePolicy=POLICY, noNetwork=True, writesConfinedToScratch=True,
                  sandboxProfileSha256=sha(profile.encode()), originalProofProjectsRead=False,
                  dependencyCacheRestored=False, generalJavaScriptOrDecoderRefinementProved=False,
                  scope='Exact endpoint criterion for uniform de Bruijn weakening, compositional certificates over all twelve Lean.Expr constructors, and sound postorder paired-graph certificates. An injective reordered-context counterexample bounds the rule. No general JS/JSON refinement or mathematical typing theorem.')
    raw = (json.dumps(report, indent=2)+'\n').encode()
    (folder/'theory.json').write_bytes(raw)
    if args.publish:
        (BASE/'theory.json.gz').write_bytes(gzip.compress(raw, mtime=0))
        (BASE/'theory-diagnostics.json.gz').write_bytes(gzip.compress(
            (json.dumps(diagnostics, indent=2)+'\n').encode(), mtime=0))
    print(json.dumps(dict(status='PASS', theorems=len(axioms), refusals=len(refusals))))


if __name__ == '__main__':
    main()
