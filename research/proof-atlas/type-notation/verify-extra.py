"""Literal signatures for every applied head in the frozen native type packets.

Uses the separately recovered kernel-data runtime, preserves original archives,
and retires only that owned runtime after a completed and verified native run.
"""
import argparse, gzip, hashlib, importlib.util, json, os, shutil, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--runtime', type=Path, required=True)
    p.add_argument('--support', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    a = p.parse_args()
    lean, runtime, support, folder = (v.resolve() for v in [a.lean,a.runtime,a.support,a.workdir])
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    recovery_raw = (runtime / 'recovery.json').read_bytes()
    recovery = json.loads(recovery_raw)
    assert recovery['status'] == 'PASS' and recovery['executableIrRestored'] is False
    assert len(recovery['files']) == 26070
    def verify_runtime():
        for entry in recovery['files']:
            file = runtime / 'artifacts' / entry['file']
            assert file.stat().st_size == entry['bytes'] and sha(file.read_bytes()) == entry['sha256']
    verify_runtime()
    private_raw = (support / 'private-modules.json').read_bytes()
    private = json.loads(private_raw)
    def verify_support():
        for name, digest in private['modules'].items():
            assert sha((support / 'SE2Conjugate' / name).read_bytes()) == digest
    verify_support()
    packet_inventory = ROOT / 'research/proof-atlas/region-native-types/packets.json.gz'
    inventory_raw = packet_inventory.read_bytes()
    inventory = json.loads(gzip.decompress(inventory_raw))
    names = {}
    for file, digest in inventory['files'].items():
        if not file.startswith('public/data/proof-atlas/region-native-types/'):
            continue
        raw = (ROOT / file).read_bytes()
        assert sha(raw) == digest
        g = json.loads(gzip.decompress(raw))['types']
        for i, kind in enumerate(g['kind']):
            if kind != 5:
                continue
            head = i
            while g['kind'][head] in [5,10]:
                head = g['children'][head][0]
            if g['kind'][head] == 4:
                value = g['payloads'][head]
                names[json.dumps(value['nameParts'])] = {k:value[k] for k in ['name','nameParts']}
    queries = sorted(names.values(), key=lambda v:v['name'])
    assert len(queries) == 43
    parent_file = ROOT / 'research/proof-atlas/corpus-definition-boundaries/native-check.json.gz'
    parent_raw = parent_file.read_bytes()
    parent = json.loads(gzip.decompress(parent_raw))
    profile = next(v for v in parent['profiles'] if v['source']['name'] == 'JacobiData.slope_bound_abs')
    source_raw = (json.dumps(profile['cases'][0]['native']['result']['graph'],separators=(',',':'),ensure_ascii=False)+'\n').encode()
    source_file = folder / 'source.json'
    source_file.write_bytes(source_raw)
    request = {'names':queries,'sourceGraph':str(source_file)}
    request_file = folder / 'request.json'
    request_file.write_text(json.dumps(request)+'\n')
    spec = importlib.util.spec_from_file_location('notation_packet_runtime', RESEARCH / 'packet-typing/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stable = module.runtime().replace('import Mathlib\nimport Aesop','import Lean') + '\n' + (BASE / 'KernelCatalog.lean').read_text()
    source_paths = [BASE / 'KernelCatalog.lean',Path(__file__),RESEARCH / 'packet-typing/verify.py',
        RESEARCH / 'packet-typing/PacketTyping.lean',RESEARCH / 'ExportLibrary.lean',
        RESEARCH / 'ExportOccurrenceTypes.lean',RESEARCH / 'LevelTransportControls.lean',
        RESEARCH / 'compiled-replay/Replay.lean',RESEARCH / 'build_recursion_examples.py',RESEARCH / 'evaluate_goedel.py']
    sources = {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in source_paths}
    (folder / 'Check.lean').write_text(stable)
    env = {'PATH':str(lean.parent)+':/usr/bin:/bin','TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
    commands = [[str(lean),'-j1','-M4096','-c','Check.c','Check.lean'],
        [str(lean.parent/'leanc'),'-O0','-c','Check.c','-o','Check.o','-mmacosx-version-min=11.0'],
        ['/usr/bin/clang','-o','checker','Check.o','-L'+str(lean.parents[1]/'lib/lean'),
         '-lInit_shared','-lleanshared','-Wl,-rpath,'+str(lean.parents[1]/'lib/lean'),'-mmacosx-version-min=11.0']]
    resources = [run_checked(cmd,folder,'build-'+str(i),env,30,120) for i,cmd in enumerate(commands)]
    paths = [Path(v) for v in (runtime/'lean-env-path.txt').read_text().strip().split(os.pathsep)]
    read_paths = paths+[support]
    env['LEAN_PATH'] = os.pathsep.join(map(str,[folder]+read_paths))
    executable = folder/'checker'
    profile_text = sandbox_profile(lean,folder,read_paths).replace('(literal '+json.dumps(str(lean))+')','(literal '+json.dumps(str(executable))+')',1)
    output = folder/'extra.json'
    result = run_checked(['/usr/bin/sandbox-exec','-p',profile_text,str(executable),str(lean.parents[1]),str(request_file),str(output)],folder,'native',env,30,120)
    verify_runtime()
    verify_support()
    raw = output.read_bytes()
    data = json.loads(raw)
    assert data['format'] == 'ProofAtlasNotationExtraNative/1' and len(data['signatures']) == 43
    assert data['sourceRiccatiTypeBodyMatch'] == 'PASS' and data['loadExts'] is False and data['trustLevel'] == 0
    assert all(v['kernelSignature'] == 'PASS' for v in data['signatures'])
    assert sources == {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in source_paths}
    assert sha(packet_inventory.read_bytes()) == sha(inventory_raw) and sha(parent_file.read_bytes()) == sha(parent_raw)
    report = {'format':'ProofAtlasNotationExtraVerification/1','status':'PASS','signatures':43,
        'nativeSha256':sha(raw),'nativeBytes':len(raw),'runtimeSha256':sha(stable.encode()),
        'leanExecutableSha256':sha(lean.read_bytes()),'executableSha256':sha(executable.read_bytes()),
        'producerFiles':sources,'queries':queries,'sourceGraphSha256':sha(source_raw),
        'packetInventorySha256':sha(inventory_raw),'parentInventorySha256':sha(parent_raw),
        'kernelRecoverySha256':sha(recovery_raw),'kernelCacheAttribution':recovery['attribution'],
        'allKernelDataHashesVerified':True,'privateSupportManifestSha256':sha(private_raw),
        'privateSupportModules':private['modules'],'originalPrivateSourcesPublished':False,
        'independentDependencyRebuild':False,'buildResources':resources,'nativeResources':result}
    # The subprocess is terminal here. Only retire the owned recovered files;
    # retain original cache archives, support binaries and recovery inventory.
    artifacts = runtime/'artifacts'
    expected = {v['file'] for v in recovery['files']}
    assert {str(f.relative_to(artifacts)) for f in artifacts.rglob('*') if f.is_file()} == expected
    assert artifacts.resolve().parent == runtime and artifacts.name == 'artifacts'
    shutil.rmtree(artifacts)
    report['ownedRuntimeRetired'] = True
    (BASE/'extra-native.json.gz').write_bytes(gzip.compress(raw,mtime=0))
    (BASE/'extra-verification.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(),mtime=0))
    print(json.dumps({'status':'PASS','signatures':43,'ownedRuntimeRetired':True}))


if __name__ == '__main__':
    main()
