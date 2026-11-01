"""Check the total certified executor and its finite public-data bridge."""
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
ROOT = RESEARCH.parents[1]
spec = importlib.util.spec_from_file_location('atlas_previous_bridge', RESEARCH/'context-instantiation/verify.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
bounded = previous.bounded
sha = lambda b: hashlib.sha256(b).hexdigest()


def source():
    prefix = previous.source().split('\nnamespace ProofAtlas.ContextInstantiationNative')[0]
    return prefix+'\n'+(BASE/'Certified.lean').read_text().replace('import Instantiation', '')+'\n'+(BASE/'Native.lean').read_text()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--source', type=Path, help='Optional pinned parent-input cache; every decoded hash is checked.')
    p.add_argument('--publish', action='store_true')
    args = p.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= bounded.POLICY['minimumFreeBytes']
    folder.mkdir(exist_ok=False)
    (folder/'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    parent = args.source.resolve() if args.source else folder/'parent'
    if not args.source:
        parent.mkdir()
        subprocess.run(['node', str(RESEARCH/'context-instantiation/prepare.cjs'), '--output', str(parent)], cwd=ROOT, check=True)
    subprocess.run(['node', str(BASE/'prepare.cjs'), '--source', str(parent), '--output', str(folder)], cwd=ROOT, check=True)
    inventory = json.loads(gzip.decompress((BASE/'inputs.json.gz').read_bytes()))
    earlier = json.loads(gzip.decompress((RESEARCH/'context-instantiation/verification.json.gz').read_bytes()))
    for file, expected in earlier['producerFiles'].items():
        assert sha((ROOT/file).read_bytes()) == expected, file
    files = [BASE/n for n in ['Certified.lean', 'Native.lean', 'prepare.cjs', 'verify.py', 'inputs.json.gz']]
    files += [ROOT/f for f in earlier['producerFiles']]
    files += [RESEARCH/'source-template-laws/instances.json.gz', RESEARCH/'context-instantiation/verification.json.gz']
    hashes = {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
    generated = source()
    assert re.findall(r'^import\s+([^\n]+)', generated, re.MULTILINE) == ['Lean']
    assert not re.search(r'\b(sorry|admit|axiom|unsafe|partial)\s+(def|theorem|opaque|constant|inductive)?\s*', (BASE/'Certified.lean').read_text())
    (folder/'Check.lean').write_text(generated)
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder/'scratch'))
    sandbox = bounded.profile(lean, folder)
    libraries = lean.parents[1]/'lib/lean'
    core = [libraries/n for n in ['Lean.olean', 'libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    dependencies = {f.name:sha(f.read_bytes()) for f in core}
    clang = Path('/Library/Developer/CommandLineTools/usr/bin/clang')
    sdk = Path('/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk').resolve()
    assert clang.is_file() and sdk.is_dir()
    c_tools = [lean.parent/'leanc', lean.parent/'clang', clang]
    c_identities = {str(f):sha(f.read_bytes()) for f in c_tools}
    commands = [[str(lean), '-j1', '-M4096', '-c', 'Check.c', '-o', 'Check.olean', 'Check.lean'],
                [str(lean.parent/'leanc'), '-O0', '-c', 'Check.c', '-o', 'Check.o', '-mmacosx-version-min=11.0'],
                [str(clang), '-isysroot', str(sdk), '-o', 'checker', 'Check.o', '-L'+str(libraries), '-lInit_shared', '-lleanshared', '-Wl,-rpath,'+str(libraries), '-mmacosx-version-min=11.0']]
    resources = [bounded.run_checked(c, folder, 'build-'+str(i), env, sandbox) for i,c in enumerate(commands)]
    axioms = {}
    for name, _, values in re.findall(r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$", (folder/'build-0.log').read_text(), re.MULTILINE):
        assert name not in axioms
        axioms[name] = [v.strip() for v in values.split(',') if v.strip()]
        assert set(axioms[name]) <= {'propext', 'Classical.choice', 'Quot.sound'}
    certified = {n:a for n,a in axioms.items() if n.startswith('ProofAtlas.CertifiedSubstitution.')}
    assert len(certified) == 11 and 'ProofAtlas.CertifiedSubstitution.execute_correct' in certified
    results, batches, index, rows = [], [], 0, 0
    for i, shard in enumerate(inventory['shards']):
        data = gzip.decompress((folder/shard['file']).read_bytes())
        assert sha(data) == shard['sha256'] and len(data) == shard['bytes']
        packet = json.loads(data)
        inp, out = folder/'input.json', folder/'output.json'
        inp.write_bytes(data)
        mode_results, mode_hashes = {}, {}
        for mode in ['certified', 'primitive']:
            resources.append(bounded.run_checked([str(folder/'checker'), mode, str(inp), str(out)], folder, mode+'-'+str(i), env, sandbox))
            raw = out.read_bytes()
            native = json.loads(raw)
            assert native['status'] == 'PASS' and native['mode'] == mode and len(native['queries']) == shard['queries']
            mode_results[mode] = native['queries']
            mode_hashes[mode] = sha(raw)
            if mode == 'certified':
                assert native['resourceRefusals'] == 2
                for key in ['kind', 'children', 'payloads', 'expanded', 'neededScope']:
                    assert native['rowRoundtrip'][key] == packet['graph'][key], (shard['file'], key)
                assert native['rowRoundtrip']['roots'] == list(range(shard['rows']))
            out.unlink()
        for query, result, primitive in zip(packet['queries'], mode_results['certified'], mode_results['primitive']):
            assert query['index'] == result['index'] == primitive['index'] == index
            assert result['status'] == primitive['status'] == 'PASS' and result['proof'] == 'Substituted.property'
            assert result['totalStates'] == result['copyStates']+result['renamingStates']+result['substitutionStates'] <= 262144
            results.append({'index': index, 'inputSha256': shard['sha256'], 'root': query['root'], 'images': query['images'], 'expected': query['expected'], 'owner': query['owner'], 'primitive': 'PASS', **result})
            index += 1
        batches.append({'inputSha256': shard['sha256'], 'outputs': mode_hashes, 'queries': shard['queries'], 'rowRoundtrips': shard['rows'], 'status': 'PASS'})
        rows += shard['rows']
        inp.unlink()
    assert index == inventory['counts']['queries'] == 2835 and rows == inventory['counts']['rows']
    # The implementation changes below must fail because of proof/type errors,
    # rather than parser failures or a resource stop. Raw diagnostics stay local.
    mutations = [('wrong-row-cache-key', '.substitutions.get? key', '.substitutions.get? (node+1,depth)'),
                 ('wrong-depth-cache-key', '.substitutions.get? key', '.substitutions.get? (node,depth+1)'),
                 ('unshifted-open-image', 'renameGraph g images limit fuel depth row 0', 'renameGraph g images limit fuel 0 row 0'),
                 ('let-value-inside-new-binder', 'substituteGraph g images limit fuel v.val depth', 'substituteGraph g images limit fuel v.val (depth+1)')]
    refusals = []
    for i, (name, before, after) in enumerate(mutations):
        assert generated.count(before) == 1
        damaged = generated.replace(before, after)
        file = folder/('Bad'+str(i)+'.lean')
        file.write_text(damaged)
        label = 'refusal-'+str(i)
        try:
            bounded.run_checked([str(lean), '-j1', '-M4096', file.name], folder, label, env, sandbox)
        except RuntimeError:
            resource = json.loads((folder/(label+'.resources.json')).read_bytes())
            diagnostic = (folder/(label+'.log')).read_bytes()
            assert resource['stopReason'] is None and resource['exitCode'] != 0 and b'error:' in diagnostic
            assert b'unexpected token' not in diagnostic and b'Unknown identifier' not in diagnostic
            refusals.append({'mutation': name, 'leanAccepted': False, 'diagnosticSha256': sha(diagnostic), 'resources': resource})
        else:
            raise AssertionError('Unsound executor accepted: '+name)
    assert hashes == {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
    assert dependencies == {f.name:sha(f.read_bytes()) for f in core}
    assert c_identities == {str(f):sha(f.read_bytes()) for f in c_tools}
    native = {'format':'ProofAtlasCertifiedSubstitutionNative/1', 'status':'PASS', 'queries':results}
    native_bytes = (json.dumps(native, separators=(',', ':'))+'\n').encode()
    report = {'format':'ProofAtlasCertifiedSubstitutionVerification/1', 'status':'PASS', 'compiler':compiler,
              'leanExecutableSha256':sha(lean.read_bytes()), 'coreIdentities':dependencies, 'producerFiles':hashes,
              'generatedSourceSha256':sha(generated.encode()), 'compiledModuleSha256':sha((folder/'Check.olean').read_bytes()),
              'executableSha256':sha((folder/'checker').read_bytes()), 'cToolIdentities':c_identities,
              'axioms':axioms, 'counts':inventory['counts'], 'rowRoundtrips':rows, 'batches':batches,
              'nativeSha256':sha(native_bytes), 'implementationRefusals':refusals,
              'resourcePolicy':bounded.POLICY, 'resources':resources, 'sandboxProfileSha256':sha(sandbox.encode()),
              'genericSuccessfulOutputCorrectnessProved':True, 'decoderRefinementProved':False,
              'perInputProofTermsRechecked':False, 'proofsErasedDuringNativeExecution':True,
              'representedMathematicsRetyped':False, 'originalProofScriptsRead':False, 'dependencyCacheRestored':False,
              'scope':'A total proof-carrying memoized substitution implementation on postorder rows, with generic successful-output correctness. Finite codec/primitive checks cover all preceding module uses, every frozen source/template opening and two additional sharing/scope controls. No general decoding or mathematical typing theorem, completeness proof, semantic compression or comprehension result.'}
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    if args.publish:
        (BASE/'native.json.gz').write_bytes(gzip.compress(native_bytes, mtime=0))
        (BASE/'verification.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(), mtime=0))
    print(json.dumps({'status':'PASS', 'queries':index, 'rowRoundtrips':rows, 'riccatiOpenings':inventory['counts']['riccatiOpenings']}))


if __name__ == '__main__':
    main()
