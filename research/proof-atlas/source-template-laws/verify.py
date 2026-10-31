"""Check general recovery laws and their finite, shared Expr certificates."""
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
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
POLICY = {'kind': 'installed-core-only/1', 'minimumFreeBytes': 20 * 1024**3,
          'maximumScratchBytes': 256 * 1024**2, 'maximumFileBytes': 64 * 1024**2,
          'maximumProcessGroupRssBytes': 8 * 1024**3, 'timeoutSeconds': 120,
          'networkAllowed': False, 'dependencyRestorationAllowed': False}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def scratch_bytes(folder):
    files = [file for file in folder.rglob('*') if file.is_file()]
    assert len(files) <= 4096, 'Scratch file-count bound'
    return sum(file.stat().st_size for file in files)


def profile(lean, folder):
    reads = [lean.parents[1], folder, Path('/System'), Path('/usr'), Path('/bin'),
             Path('/Library/Developer'), Path('/Applications/Xcode.app'),
             Path('/private/var/db/dyld'), Path('/private/var/db/timezone'),
             Path('/private/var/db/xcode_select_link')]
    expressions = ' '.join('(subpath ' + json.dumps(str(p.resolve())) + ')' for p in reads)
    executions = [lean.parents[1], folder, Path('/usr/bin'), Path('/bin'),
                  Path('/Library/Developer'), Path('/Applications/Xcode.app')]
    execs = ' '.join('(subpath ' + json.dumps(str(p.resolve())) + ')' for p in executions)
    return ('(version 1)(deny default)(allow process-fork)'
            '(allow process-exec ' + execs + ')'
            '(allow sysctl-read)(allow mach-lookup)(allow file-read-metadata)'
            '(allow file-read* ' + expressions +
            ' (literal "/") (literal "/dev/null") (literal "/dev/urandom"))'
            '(allow file-write* (subpath ' + json.dumps(str(folder)) +
            ') (literal "/dev/null"))')


def run_checked(command, folder, label, env, sandbox):
    assert shutil.disk_usage(folder).free >= POLICY['minimumFreeBytes'], 'Core free-space reserve'
    assert scratch_bytes(folder) <= POLICY['maximumScratchBytes'], 'Scratch ceiling'
    start = time.monotonic()
    peak = size = 0
    reason = None

    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE, (POLICY['maximumFileBytes'],) * 2)

    with (folder / (label + '.log')).open('w') as log:
        process = subprocess.Popen(['/usr/bin/sandbox-exec', '-p', sandbox, *command],
                                   cwd=folder, env=env, stdout=log, stderr=subprocess.STDOUT,
                                   preexec_fn=limits, start_new_session=True)
        try:
            while process.poll() is None:
                stat = subprocess.run(['ps', '-axo', 'pgid=,rss='], text=True,
                                      capture_output=True, check=True)
                current = sum(int(row.split()[1]) * 1024 for row in stat.stdout.splitlines()
                              if len(row.split()) == 2 and int(row.split()[0]) == process.pid)
                peak = max(peak, current)
                size = max(size, scratch_bytes(folder))
                if peak > POLICY['maximumProcessGroupRssBytes']:
                    reason = 'Process-group RSS bound'
                elif size > POLICY['maximumScratchBytes']:
                    reason = 'Scratch ceiling'
                elif shutil.disk_usage(folder).free < POLICY['minimumFreeBytes']:
                    reason = 'Core free-space reserve'
                elif time.monotonic() - start > POLICY['timeoutSeconds']:
                    reason = 'Time bound'
                if reason:
                    break
                time.sleep(.2)
        finally:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait(timeout=5)
    size = max(size, scratch_bytes(folder))
    result = {'exitCode': process.returncode, 'stopReason': reason,
              'maxProcessGroupRssBytes': peak, 'maxScratchBytes': size,
              'seconds': round(time.monotonic() - start, 2)}
    (folder / (label + '.resources.json')).write_text(json.dumps(result, indent=2) + '\n')
    if reason or process.returncode or size > POLICY['maximumScratchBytes']:
        raise RuntimeError(label + ' failed; inspect ' + str(folder / (label + '.log')))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    lean = args.lean.resolve()
    folder = args.workdir.resolve()
    # This core-only protocol restores no corpus dependencies. Its sandbox and
    # monitored scratch ceiling are separate from full-corpus replay policies.
    free = shutil.disk_usage(folder.parent).free
    if free < POLICY['minimumFreeBytes']:
        raise SystemExit('Native checks stopped: less than the 20 GiB core-only reserve.')
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    files = [BASE / name for name in ['Recovery.lean', 'Native.lean', 'prepare.cjs',
                                     'check.cjs', 'verify.py', 'instances.json.gz', 'model-check.json.gz']]
    files += [RESEARCH / 'ExportLibrary.lean', RESEARCH / 'build_recursion_examples.py',
              RESEARCH / 'method-context/catalogue.cjs', ROOT / 'public/js/proof-atlas-library-data.js',
              RESEARCH / 'source-template-inputs/native.json.gz',
              RESEARCH / 'source-template-inputs/controls.json.gz',
              RESEARCH / 'projection-substitution/native.json.gz']
    hashes = {str(file.relative_to(ROOT)): sha(file.read_bytes()) for file in files}
    subprocess.run(['node', str(BASE / 'check.cjs'), '--check'], cwd=ROOT, check=True,
                   stdout=subprocess.PIPE)
    subprocess.run(['node', str(BASE / 'prepare.cjs'), '--workdir', str(folder)], cwd=ROOT,
                   check=True, stdout=subprocess.PIPE)
    source = folder / 'Check.lean'
    stable = source.read_bytes()
    assert re.findall(rb'^import\s+([^\n]+)', stable, re.MULTILINE) == [b'Lean']
    sandbox = profile(lean, folder)
    instances = json.loads(gzip.decompress((BASE / 'instances.json.gz').read_bytes()))['instances']
    assert len(instances) == 8
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder / 'scratch'))
    libraries = lean.parents[1] / 'lib/lean'
    core = [libraries / 'Lean.olean']
    core += [libraries / name for name in ['libInit_shared.dylib', 'libleanshared.dylib',
                                          'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    dependencies = {file.name: sha(file.read_bytes()) for file in core}
    # Use the installed compiler directly: /usr/bin/clang is an xcrun shim
    # which attempts to write a cache outside the confined scratch directory.
    link_clang = Path('/Library/Developer/CommandLineTools/usr/bin/clang')
    sdk = Path('/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk').resolve()
    assert link_clang.is_file() and sdk.is_dir()
    c_tools = [lean.parent / 'leanc', lean.parent / 'clang', link_clang]
    c_identities = {str(file): sha(file.read_bytes()) for file in c_tools}
    commands = [
        [str(lean), '-j1', '-M4096', '-c', 'Check.c', '-o', 'Check.olean', 'Check.lean'],
        [str(lean.parent / 'leanc'), '-O0', '-c', 'Check.c', '-o', 'Check.o',
         '-mmacosx-version-min=11.0'],
        [str(link_clang), '-isysroot', str(sdk), '-o', 'checker', 'Check.o', '-L' + str(libraries),
         '-lInit_shared', '-lleanshared', '-Wl,-rpath,' + str(libraries),
         '-mmacosx-version-min=11.0']]
    resources = [run_checked(command, folder, 'build-' + str(i), env, sandbox)
                 for i, command in enumerate(commands)]
    transcript = (folder / 'build-0.log').read_text()
    axioms = {}
    for name, _, values in re.findall(
            r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$",
            transcript, re.MULTILINE):
        assert name not in axioms
        axioms[name] = [s.strip() for s in values.split(',') if s.strip()]
        assert set(axioms[name]) <= {'propext'}, (name, axioms[name])
    assert len(axioms) == 15 + 3 * len(instances)
    output = folder / 'native.json'
    resources.append(run_checked([str(folder / 'checker'), str(output)], folder,
                                 'native', env, sandbox))
    native = json.loads(output.read_bytes())
    assert native['status'] == 'PASS' and len(native['instances']) == len(instances)
    total_rows = 0
    for expected, result in zip(instances, native['instances']):
        graph = expected['graph']
        assert all(result[field] == 'PASS' for field in
                   ['contextOpening', 'memoRecovery', 'nativeReplaceFVars'])
        for field in ['kind', 'children', 'payloads', 'expanded', 'neededScope']:
            assert result['rows'][field] == graph[field], (result['index'], field)
        assert result['rows']['roots'] == list(range(len(graph['kind'])))
        assert result['sourceOccurrences'] == expected['counts']['source']
        assert result['templateOccurrences'] == expected['counts']['template']
        assert result['weightedOccurrences'] == expected['counts']['weighted']
        assert result['recoveryStates'] == expected['counts']['templateDAGRows']
        assert result['weightedCountStates'] <= 262144
        total_rows += len(graph['kind'])

    # Require real elaboration failures for changed certificate assumptions.
    # Raw compiler diagnostics remain private; publish the mutation and result.
    text = stable.decode()
    first = instances[0]
    target = first['groups'][first['selectedGroups'][0]]
    wrong_image = 'then e' + str(target['source']) + ' else'
    start = text.index('def sigma (id : FVarId) : Expr :=')
    position = text.index(wrong_image, start)
    changed_image = text[:position] + text[position:].replace(
        wrong_image, 'then e' + str(first['graph']['roots'][0]) + ' else', 1)
    row = next(row for row in first['records'] if row['rule'] == 'frame'
               and row['source'] != row['output'] and first['graph']['kind'][row['source']] == 6)
    line_start = text.index('def e' + str(row['output']) + ' : Expr :=', text.index('namespace Instance0'), start)
    line_end = text.index('\n', line_start)
    old_line = text[line_start:line_end]
    assert 'BinderInfo.default' in old_line
    changed_flag = text[:line_start] + old_line.replace('BinderInfo.default', 'BinderInfo.instImplicit') + text[line_end:]
    bad_root = text.replace('theorem recovered : plug sigma e' + str(first['graph']['roots'][1]) +
                            ' = e' + str(first['graph']['roots'][0]),
                            'theorem recovered : plug sigma e' + str(first['graph']['roots'][1]) +
                            ' = e' + str(target['source']), 1)
    refusals = []
    for i, (name, damaged) in enumerate([('wrong-recovery-image', changed_image),
                                       ('changed-binder-annotation', changed_flag),
                                       ('wrong-source-root', bad_root)]):
        assert damaged != text
        file = folder / ('Bad' + str(i) + '.lean')
        file.write_text(damaged)
        label = 'refusal-' + str(i)
        try:
            run_checked([str(lean), '-j1', '-M4096', file.name], folder, label, env, sandbox)
        except RuntimeError:
            result = json.loads((folder / (label + '.resources.json')).read_bytes())
            diagnostic = (folder / (label + '.log')).read_text()
            assert result['stopReason'] is None and result['exitCode'] != 0
            assert 'error:' in diagnostic and 'sorryAx' in diagnostic
            refusals.append({'mutation': name, 'leanCertificateAccepted': False,
                             'diagnosticSha256': sha(diagnostic.encode()), 'resources': result})
        else:
            raise AssertionError('Damaged certificate accepted: ' + name)
    assert source.read_bytes() == stable
    assert dependencies == {file.name: sha(file.read_bytes()) for file in core}
    assert c_identities == {str(file): sha(file.read_bytes()) for file in c_tools}
    assert hashes == {str(file.relative_to(ROOT)): sha(file.read_bytes()) for file in files}
    report = {'format': 'ProofAtlasSourceRecoveryVerification/1', 'status': 'PASS',
              'compiler': compiler, 'leanExecutableSha256': sha(lean.read_bytes()),
              'coreIdentities': dependencies, 'producerFiles': hashes,
              'cToolIdentities': c_identities, 'sdk': str(sdk),
              'generatedSourceSha256': sha(stable),
              'compiledModuleSha256': sha((folder / 'Check.olean').read_bytes()),
              'executableSha256': sha((folder / 'checker').read_bytes()),
              'nativeSha256': sha(output.read_bytes()), 'axioms': axioms,
              'instances': len(instances), 'rowRoundtrips': total_rows,
              'certificateRefusals': refusals, 'resources': resources,
              'resourcePolicy': POLICY, 'sandboxProfileSha256': sha(sandbox.encode()),
              'originalProofScriptsRead': False, 'dependencyCacheRestored': False,
              'generatedInstanceSourcesPublished': False, 'representedMathematicsRetyped': False,
              'scope': 'General Lean.Expr recovery, scope, composition and weighted-count laws; eight finite shared certificates and native primitive comparisons. No general executable/codec refinement, mathematical typing preservation, semantic compression or comprehension result.'}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    if args.publish:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(output.read_bytes(), mtime=0))
        (BASE / 'verification.json.gz').write_bytes(gzip.compress(
            (json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    print(json.dumps({k: report[k] for k in ['status', 'instances', 'rowRoundtrips']}))


if __name__ == '__main__':
    main()
