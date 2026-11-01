"""Bounded native bridge for proved occurrence paths and JavaScript address cuts."""
import argparse
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = BASE.parents[2]
sha = lambda b: hashlib.sha256(b).hexdigest()
spec = importlib.util.spec_from_file_location('atlas_certified_bridge', RESEARCH/'certified-substitution/verify.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
bounded = previous.bounded


def source(paths=None):
    prelude = previous.source().split('\nnamespace ProofAtlas.CertifiedSubstitutionNative')[0]
    helpers = (RESEARCH/'certified-substitution/Native.lean').read_text().split('\ndef run (mode')[0]
    helpers += '\nend ProofAtlas.CertifiedSubstitutionNative\n'
    paths = paths if paths is not None else (BASE/'Paths.lean').read_text()
    return '\n'.join([prelude, helpers, paths.replace('import Certified', ''), (BASE/'Native.lean').read_text()])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--inputs', type=Path, help='Optional prepared address requests, checked by decoded SHA.')
    p.add_argument('--base-inputs', type=Path, help='Optional original certified-substitution input cache.')
    p.add_argument('--publish', action='store_true')
    args = p.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= bounded.POLICY['minimumFreeBytes']
    folder.mkdir(exist_ok=False)
    (folder/'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    requests = args.inputs.resolve() if args.inputs else folder
    if not args.inputs:
        command = ['node', str(BASE/'prepare.cjs'), '--output', str(folder)]
        if args.base_inputs:
            command += ['--inputs', str(args.base_inputs.resolve())]
        subprocess.run(command, cwd=ROOT, check=True)
    inventory = json.loads(gzip.decompress((BASE/'inputs.json.gz').read_bytes()))
    theory = json.loads(gzip.decompress((BASE/'theory.json.gz').read_bytes()))
    assert theory['status'] == 'PASS'
    parent = json.loads(gzip.decompress((RESEARCH/'certified-substitution/verification.json.gz').read_bytes()))
    producers = {f: sha((ROOT/f).read_bytes()) for f in parent['producerFiles']}
    assert producers == parent['producerFiles']
    for f, h in inventory['files'].items():
        assert sha((ROOT/f).read_bytes()) == h, f
        producers[f] = h
    for f, h in theory['producerFiles'].items():
        assert sha((ROOT/f).read_bytes()) == h, f
        producers[f] = h
    for name in ['Paths.lean', 'Native.lean', 'prepare.cjs', 'verify.py', 'verify_theory.py', 'inputs.json.gz', 'theory.json.gz']:
        f = BASE/name
        producers[str(f.relative_to(ROOT))] = sha(f.read_bytes())
    generated = source()
    assert re.findall(r'^import\s+([^\n]+)', generated, re.MULTILINE) == ['Lean']
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder/'scratch'))
    sandbox = bounded.profile(lean, folder)
    libraries = lean.parents[1]/'lib/lean'
    core = [libraries/n for n in ['Lean.olean', 'libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    dependencies = {f.name: sha(f.read_bytes()) for f in core}
    clang = Path('/Library/Developer/CommandLineTools/usr/bin/clang')
    sdk = Path('/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk').resolve()
    c_tools = {'lean-leanc': sha((lean.parent/'leanc').read_bytes()),
               'lean-clang': sha((lean.parent/'clang').read_bytes()),
               'system-clang': sha(clang.read_bytes())}
    resources = []

    def compile_native(label, text):
        (folder/(label+'.lean')).write_text(text)
        commands = [[str(lean), '-j1', '-M4096', '-c', label+'.c', '-o', label+'.olean', label+'.lean'],
                    [str(lean.parent/'leanc'), '-O0', '-c', label+'.c', '-o', label+'.o', '-mmacosx-version-min=11.0'],
                    [str(clang), '-isysroot', str(sdk), '-o', label, label+'.o', '-L'+str(libraries), '-lInit_shared', '-lleanshared', '-Wl,-rpath,'+str(libraries), '-mmacosx-version-min=11.0']]
        for i, command in enumerate(commands):
            resources.append(bounded.run_checked(command, folder, label+'-build-'+str(i), env, sandbox))
        return folder/label

    executable = compile_native('Check', generated)
    axioms = {}
    for name, _, values in re.findall(r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$", (folder/'Check-build-0.log').read_text(), re.MULTILINE):
        if name.startswith('ProofAtlas.SubstitutionPaths.'):
            axioms[name] = [v.strip() for v in values.split(',') if v.strip()]
    assert axioms == theory['axioms']
    results, batches = [], []
    total_fields = total_ports = total_rows = 0
    all_kinds = set()
    for index, s in enumerate(inventory['shards']):
        raw = gzip.decompress((requests/s['file']).read_bytes())
        assert sha(raw) == s['sha256'] and len(raw) == s['bytes']
        packet = json.loads(raw)
        inp, out = folder/'input.json', folder/'output.json'
        inp.write_bytes(raw)
        resources.append(bounded.run_checked([str(executable), str(inp), str(out)], folder, 'native-'+str(index), env, sandbox))
        output = out.read_bytes()
        value = json.loads(output)
        assert value['status'] == 'PASS' and len(value['queries']) == s['queries']
        for key in ['kind', 'children', 'payloads', 'expanded', 'neededScope']:
            assert value['rowRoundtrip'][key] == packet['graph'][key], (index, key)
        assert value['rowRoundtrip']['roots'] == list(range(s['rows']))
        assert value['fieldChecks'] == 4*s['rows']
        all_kinds.update(value['kernelKinds'])
        for q, r in zip(packet['queries'], value['queries']):
            assert q['index'] == r['index'] == len(results)
            assert r['status'] == r['nativeInstantiation'] == 'PASS'
            assert r['observations'] == len(q['observations']) and r['invalidPaths'] == len(q['invalidPaths'])
            assert r['cacheStates'] <= 262144
            results.append({'inputSha256': s['sha256'], 'parentInputSha256': s['parentInputSha256'], 'owner': q['owner'], **r})
        batches.append({'inputSha256': s['sha256'], 'outputSha256': sha(output), 'queries': s['queries'],
                        'observations': s['observations'], 'rowRoundtrips': s['rows'], 'fieldChecks': value['fieldChecks'], 'status': 'PASS'})
        total_rows += s['rows']
        total_fields += value['fieldChecks']
        total_ports += value['validPorts']
        inp.unlink(); out.unlink()
        print(json.dumps({'batch': index, 'status': 'PASS', 'queries': s['queries'], 'observations': s['observations']}), flush=True)
    assert len(results) == inventory['counts']['queries']
    assert sum(r['observations'] for r in results) == inventory['counts']['vertices']
    for field in ['sourceRelations', 'imageRelations', 'resultOrigins', 'localOwners', 'invalidPaths']:
        assert sum(r[field] for r in results) == inventory['counts'][field], field
    assert all_kinds == set(range(12))
    # A coherent convention change can satisfy the general theorems while
    # disagreeing with the immutable wire format. Keep this independent gate.
    paths = (BASE/'Paths.lean').read_text()
    coherent = paths.replace('| .app f _, 0 => some (f,0)', '| .app _ a, 0 => some (a,0)').replace('| .app _ a, 1 => some (a,0)', '| .app f _, 1 => some (f,0)')
    assert coherent != paths
    bad_program = compile_native('Swapped', source(coherent))
    inp, out = folder/'bad-input.json', folder/'bad-output.json'
    inp.write_bytes(gzip.decompress((requests/inventory['shards'][0]['file']).read_bytes()))
    refusals = []

    def reject(program, label, expected_diagnostic):
        try:
            bounded.run_checked([str(program), str(inp), str(out)], folder, label, env, sandbox)
        except RuntimeError:
            r = json.loads((folder/(label+'.resources.json')).read_bytes())
            diagnostic = (folder/(label+'.log')).read_text()
            assert r['exitCode'] != 0 and r['stopReason'] is None
            assert expected_diagnostic in diagnostic
            refusals.append({'name': label, 'nativeAccepted': False, 'requestSha256': sha(inp.read_bytes()),
                             'diagnosticSha256': sha(diagnostic.encode()), 'resources': r})
        else:
            raise AssertionError('Damaged request accepted: '+label)

    reject(bad_program, 'coherent-port-swap', 'Wire field role mismatch')
    refusals[-1]['theoryAccepted'] = True
    # Change only the request, preserving the compiled correct implementation.
    own = json.loads(gzip.decompress((requests/inventory['shards'][-1]['file']).read_bytes()))
    own['queries'][0]['observations'][0]['depth'] += 1
    inp.write_text(json.dumps(own))
    reject(executable, 'wrong-recorded-depth', 'Recorded depth mismatch')
    own = json.loads(gzip.decompress((requests/inventory['shards'][-1]['file']).read_bytes()))
    target = next(o for o in own['queries'][1]['observations'] if o['part'] == 'result' and o['origin']['kind'] == 'image' and o['origin']['usePath'] == [0])
    target['origin']['usePath'] = [1]
    inp.write_text(json.dumps(own))
    reject(executable, 'equal-image-wrong-use-owner', 'Image source prefix mismatch')
    control = json.loads(gzip.decompress((requests/inventory['shards'][37]['file']).read_bytes()))
    q = next(q for q in control['queries'] if q['index'] == 2834)
    target = next(o for o in q['observations'] if o['part'] == 'result' and o['binding'] and o['binding']['kind'] == 'local' and o['binding']['address']['path'] == [1])
    assert target['binding']['name'] == control['graph']['payloads'][q['expected']]['binderName']
    target['binding']['address']['path'] = []
    inp.write_text(json.dumps(control))
    reject(executable, 'same-name-wrong-binder-owner', 'Binder owner witness mismatch')
    refusals[-1]['sameBinderName'] = True
    inp.unlink()
    if out.exists(): out.unlink()
    assert producers == {f: sha((ROOT/f).read_bytes()) for f in producers}
    native = {'format': 'ProofAtlasSubstitutionPathResults/1', 'status': 'PASS', 'queries': results}
    native_bytes = (json.dumps(native, separators=(',', ':'))+'\n').encode()
    report = {'format': 'ProofAtlasSubstitutionPathVerification/1', 'status': 'PASS', 'compiler': compiler,
              'leanExecutableSha256': sha(lean.read_bytes()), 'coreIdentities': dependencies,
              'cToolIdentities': c_tools,
              'producerFiles': producers, 'runtimeSha256': sha(generated.encode()), 'axioms': axioms,
              'counts': inventory['counts'], 'rowRoundtrips': total_rows, 'fieldChecks': total_fields,
              'validPorts': total_ports, 'kernelKinds': sorted(all_kinds), 'batches': batches,
              'nativeSha256': sha(native_bytes), 'dataRefusals': refusals, 'resources': resources,
              'resourcePolicy': bounded.POLICY, 'sandboxProfileSha256': sha(sandbox.encode()),
              'proofsErasedDuringNativeExecution': True, 'perInputProofTermsRechecked': False,
              'generalJavaScriptOrDecoderRefinementProved': False, 'mathematicalTypingPreservationProved': False,
              'originalProofScriptsRead': False, 'dependencyCacheRestored': False,
              'scope': 'General Expr occurrence and owner laws, a proved postorder graph selector, all preceding address cuts and three authored controls. Fresh finite codec, field-order, native substitution and owner-witness checks. Not a general JS/JSON compiler, typing or comprehension theorem.'}
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    if args.publish:
        (BASE/'native.json.gz').write_bytes(gzip.compress(native_bytes, mtime=0))
        (BASE/'verification.json.gz').write_bytes(gzip.compress((json.dumps(report, separators=(',', ':'))+'\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'queries': len(results), 'observations': sum(r['observations'] for r in results),
                      'rowRoundtrips': total_rows, 'fieldChecks': total_fields, 'refusals': len(refusals)}))


if __name__ == '__main__':
    main()
