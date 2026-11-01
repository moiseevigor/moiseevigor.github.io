"""Core-only structural instantiation laws and finite native syntax probes."""
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
spec = importlib.util.spec_from_file_location('atlas_bounded_native', RESEARCH / 'source-template-laws/verify.py')
bounded = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bounded)
sha = lambda b: hashlib.sha256(b).hexdigest()


def source():
    serializer = (RESEARCH / 'ExportLibrary.lean').read_text().split('\ndef kind : ConstantInfo')[0]
    serializer = serializer.replace('import SE2Conjugate', '') + '\nend AtlasLibrary\n'
    levels = (RESEARCH / 'LevelTransportControls.lean').read_text().split('\ndef compactGraph')[0]
    levels = levels.replace(' AtlasOccurrenceTypes', '') + '\nend AtlasLevelTransport\n'
    decoder = (RESEARCH / 'compiled-replay/Replay.lean').read_text().split('\ndef graph (roots')[0]
    start, end = decoder.index('def metadata '), decoder.index('def decode (packet')
    # This finite corpus contains Boolean and string metadata only. Other kinds
    # are refused explicitly rather than converted through a display string.
    metadata = '''def metadata (p : Json) : Except String KVMap := do
 let entries ← p.getObjValAs? (Array Json) "metadata"
 let mut data := KVMap.empty
 for e in entries do
  let n ← name e "keyNameParts" "key"
  let v ← field e "value"
  let repr ← v.getObjValAs? String "repr"
  match ← v.getObjValAs? String "kind" with
  | "ofBool" =>
   let b ← if repr == "Lean.DataValue.ofBool true" then pure true
     else if repr == "Lean.DataValue.ofBool false" then pure false
     else throw "Boolean metadata encoding"
   data := data.setBool n b
  | "ofString" =>
   let marker := "Lean.DataValue.ofString "
   unless repr.startsWith marker do throw "String metadata prefix"
   let s ← (← Json.parse (repr.drop marker.length).toString).getStr?
   data := data.set n (DataValue.ofString s)
  | _ => throw "Unsupported metadata kind in finite instantiation probe"
 return data
'''
    decoder = decoder[:start] + metadata + decoder[end:]
    decoder = decoder.replace('kinds.size <= 131072', 'kinds.size <= 262144')
    decoder += '\nend AtlasPacketReplay\n'
    helpers = (RESEARCH / 'source-template-laws/Native.lean').read_text().split('\ndef check (index')[0]
    helpers += '\nend ProofAtlas.SourceRecoveryNative\n'
    theory = (RESEARCH / 'occurrence-constructions/ContextFrame.lean').read_text().replace('import Lean', '')
    theory += (RESEARCH / 'context-modules/Instantiation.lean').read_text().replace('import ContextFrame', '')
    return '\n'.join([serializer, 'set_option maxRecDepth 8192', 'set_option maxHeartbeats 10000000',
                      theory, levels, decoder, helpers, (BASE / 'Native.lean').read_text()])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--publish', action='store_true')
    args = p.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= bounded.POLICY['minimumFreeBytes']
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    subprocess.run(['node', str(BASE / 'prepare.cjs'), '--output', str(folder)], cwd=ROOT, check=True)
    inventory = json.loads(gzip.decompress((BASE / 'inputs.json.gz').read_bytes()))
    files = [BASE / n for n in ['prepare.cjs', 'Native.lean', 'verify.py', 'inputs.json.gz']]
    files += [RESEARCH / n for n in ['occurrence-constructions/ContextFrame.lean',
              'context-modules/Instantiation.lean', 'ExportLibrary.lean', 'LevelTransportControls.lean',
              'compiled-replay/Replay.lean', 'source-template-laws/Native.lean', 'source-template-laws/verify.py']]
    files += [ROOT / f for f in inventory['files']]
    files += [ROOT / 'public/js' / n for n in ['proof-atlas-library-data.js', 'proof-atlas-context-modules.js',
              'proof-atlas-geometry-core.js', 'proof-atlas-occurrence-types.js', 'proof-atlas-context-types.js',
              'proof-atlas-context-views.js', 'proof-atlas-expression-views.js']]
    files += [ROOT / 'scripts' / n for n in ['proof-atlas-context-module-audit.cjs', 'proof-atlas-expression-digest.cjs']]
    hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    generated = source()
    assert re.findall(r'^import\s+([^\n]+)', generated, re.MULTILINE) == ['Lean']
    assert not re.search(r'\b(sorry|admit|axiom)\b', generated)
    (folder / 'Check.lean').write_text(generated)
    env = dict(os.environ, LEAN_PATH=str(folder), TMPDIR=str(folder / 'scratch'))
    sandbox = bounded.profile(lean, folder)
    libraries = lean.parents[1] / 'lib/lean'
    core = [libraries / n for n in ['Lean.olean', 'libInit_shared.dylib', 'libleanshared.dylib',
                                   'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    dependencies = {f.name: sha(f.read_bytes()) for f in core}
    clang = Path('/Library/Developer/CommandLineTools/usr/bin/clang')
    sdk = Path('/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk').resolve()
    assert clang.is_file() and sdk.is_dir()
    c_tools = [lean.parent / 'leanc', lean.parent / 'clang', clang]
    c_identities = {str(f): sha(f.read_bytes()) for f in c_tools}
    commands = [[str(lean), '-j1', '-M4096', '-c', 'Check.c', '-o', 'Check.olean', 'Check.lean'],
                [str(lean.parent / 'leanc'), '-O0', '-c', 'Check.c', '-o', 'Check.o', '-mmacosx-version-min=11.0'],
                [str(clang), '-isysroot', str(sdk), '-o', 'checker', 'Check.o', '-L'+str(libraries),
                 '-lInit_shared', '-lleanshared', '-Wl,-rpath,'+str(libraries), '-mmacosx-version-min=11.0']]
    resources = [bounded.run_checked(c, folder, 'build-'+str(i), env, sandbox) for i,c in enumerate(commands)]
    axioms = {}
    for name, _, values in re.findall(
            r"^'([^']+)' (does not depend on any axioms|depends on axioms: \[([^\]]*)\])$",
            (folder / 'build-0.log').read_text(), re.MULTILINE):
        assert name not in axioms
        axioms[name] = [v.strip() for v in values.split(',') if v.strip()]
        assert set(axioms[name]) <= {'propext', 'Quot.sound'}
    assert len([n for n in axioms if n.startswith('ProofAtlas.ContextInstantiation.')]) == 33
    results, batches, index, total_rows = [], [], 0, 0
    for i, shard in enumerate(inventory['shards']):
        data = gzip.decompress((folder / shard['file']).read_bytes())
        assert sha(data) == shard['sha256'] and len(data) == shard['bytes']
        packet = json.loads(data)
        input_file, output_file = folder / 'input.json', folder / 'output.json'
        input_file.write_bytes(data)
        resources.append(bounded.run_checked([str(folder / 'checker'), str(input_file), str(output_file)],
                                            folder, 'native-'+str(i), env, sandbox))
        output_bytes = output_file.read_bytes()
        native = json.loads(output_bytes)
        assert native['status'] == 'PASS' and native['controls']['refusals'] == 8
        assert len(native['cases']) == shard['cases']
        for key in ['kind', 'children', 'payloads', 'expanded', 'neededScope']:
            assert native['rowRoundtrip'][key] == packet['graph'][key], (shard['file'], key)
        assert native['rowRoundtrip']['roots'] == list(range(shard['rows']))
        batches.append({'inputSha256': shard['sha256'], 'outputSha256': sha(output_bytes),
                        'cases': shard['cases'], 'rowRoundtrips': shard['rows'], 'status': 'PASS'})
        total_rows += shard['rows']
        for case, result in zip(packet['cases'], native['cases']):
            assert result['index'] == case['index'] == index
            assert all(result[k] == 'PASS' for k in ['nativeSimultaneous', 'nativeSequential', 'modelResults', 'scope'])
            assert result['specification'] == ('PASS' if case['runSpecification'] else 'not-evaluated-expanded-budget')
            results.append({'index': index, 'owner': case['owner'], 'shardSha256': shard['sha256'],
                            'termResult': case['expectedTerm'], 'typeResult': case['expectedType'], **result})
            index += 1
        # Keep scratch bounded independently of corpus size; logs stay private.
        input_file.unlink()
        output_file.unlink()
    assert index == 1383 and total_rows == inventory['counts']['storedRows']
    refusals = []
    controls = [
        ('extra-let-argument', 'applyTerm [false,true] (rebuild oneDefinition (.bvar 0)) [seventeen,eighteen] = some seventeen'),
        ('lost-module-boundary', 'applyTerm [] identityValue [] = some seventeen'),
        ('captured-open-image', 'applyTerm [false] (.lam `x natType (.lam `y natType (.bvar 1) .default) .default) [.bvar 0] = some (.lam `y natType (.bvar 0) .default)')]
    for i, (name, statement) in enumerate(controls):
        file = folder / ('Bad'+str(i)+'.lean')
        file.write_text('import Check\nopen Lean ProofAtlas.ContextFrame ProofAtlas.ContextInstantiation\nexample : '+statement+' := by rfl\n')
        label = 'refusal-'+str(i)
        try:
            bounded.run_checked([str(lean), '-j1', '-M4096', file.name], folder, label, env, sandbox)
        except RuntimeError:
            resource = json.loads((folder / (label+'.resources.json')).read_bytes())
            diagnostic = (folder / (label+'.log')).read_bytes()
            assert resource['stopReason'] is None and resource['exitCode'] != 0 and b'error:' in diagnostic
            refusals.append({'mutation': name, 'leanAccepted': False, 'diagnosticSha256': sha(diagnostic), 'resources': resource})
        else:
            raise AssertionError('Damaged structural certificate accepted: '+name)
    assert hashes == {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in files}
    assert dependencies == {f.name: sha(f.read_bytes()) for f in core}
    assert c_identities == {str(f): sha(f.read_bytes()) for f in c_tools}
    report = {'format': 'ProofAtlasContextInstantiationVerification/1', 'status': 'PASS',
              'compiler': compiler, 'leanExecutableSha256': sha(lean.read_bytes()), 'coreIdentities': dependencies,
              'producerFiles': hashes, 'cToolIdentities': c_identities, 'generatedSourceSha256': sha(generated.encode()),
              'compiledModuleSha256': sha((folder/'Check.olean').read_bytes()), 'executableSha256': sha((folder/'checker').read_bytes()),
              'axioms': axioms, 'counts': inventory['counts'], 'batches': batches, 'rowRoundtrips': total_rows,
              'specificationCases': sum(r['specification'] == 'PASS' for r in results),
              'certificateRefusals': refusals, 'nativeControlRefusals': 8,
              'resourcePolicy': bounded.POLICY, 'resources': resources, 'sandboxProfileSha256': sha(sandbox.encode()),
              'originalProofScriptsRead': False, 'dependencyCacheRestored': False,
              'representedMathematicsRetyped': False, 'generalExecutorRefinementProved': False,
              'scope': 'General explicit-binder syntax laws, all recorded full/reduced module-use symbolic probes, and authored controls. No mathematical typing preservation, semantic compression or comprehension result.'}
    output = {'format': 'ProofAtlasContextInstantiationNative/1', 'status': 'PASS', 'cases': results}
    report['nativeSha256'] = sha((json.dumps(output, separators=(',', ':'))+'\n').encode())
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    if args.publish:
        (BASE/'native.json.gz').write_bytes(gzip.compress((json.dumps(output, separators=(',', ':'))+'\n').encode(), mtime=0))
        (BASE/'verification.json.gz').write_bytes(gzip.compress((json.dumps(report, indent=2)+'\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'counts': inventory['counts'], 'rowRoundtrips': total_rows}))


if __name__ == '__main__':
    main()
