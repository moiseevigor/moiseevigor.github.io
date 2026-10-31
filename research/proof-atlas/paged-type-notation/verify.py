"""Replay core notation and compare recorded constant-data environments.

No Mathlib data are restored and no preceding report is overwritten.
"""
import argparse, gzip, hashlib, importlib.util, json, os, shutil, subprocess, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw): return hashlib.sha256(raw).hexdigest()
def packed(path): return json.loads(gzip.decompress(path.read_bytes()))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ['lean', 'workdir', 'catalog_runtime', 'direct_runtime', 'adapter_runtime']:
        parser.add_argument('--' + key.replace('_', '-'), type=Path, required=True)
    a = parser.parse_args()
    lean, folder = a.lean.resolve(), a.workdir.resolve()
    folder.mkdir(exist_ok=False); (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    spec = importlib.util.spec_from_file_location('atlas_core_notation_replay', RESEARCH / 'type-notation/verify.py')
    old = importlib.util.module_from_spec(spec); spec.loader.exec_module(old)
    stable = old.runtime(); output = folder / 'native.json'
    entry = folder / 'Check.lean'
    entry.write_text(stable + '\n#atlas_notation_export ' + json.dumps(str(output)) + '\n')
    core = lean.parents[1] / 'lib/lean'
    def core_data(): return {str(p.relative_to(core)): sha(p.read_bytes()) for p in sorted(core.rglob('*.olean*')) if p.is_file()}
    data = core_data()
    libraries = {n: sha((core / n).read_bytes()) for n in ['libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']}
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder), 'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    resource = run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, []), str(lean), '-j1', '-M4096', str(entry)], folder, 'core', env, 30, 120)
    raw = output.read_bytes()
    assert raw == gzip.decompress((RESEARCH / 'type-notation/native.json.gz').read_bytes())
    assert stable == old.runtime() and data == core_data()
    assert data == packed(RESEARCH / 'dependent-region-inputs/core-data.json.gz')
    core_verification = packed(RESEARCH / 'type-notation/verification.json.gz')
    extra = packed(RESEARCH / 'type-notation/extra-verification.json.gz')
    assert core_verification['leanExecutableSha256'] == sha(lean.read_bytes())
    comparison = []
    for key, verification in [('catalog_runtime', extra),
            ('direct_runtime', packed(RESEARCH / 'region-input-functions/verification.json.gz')),
            ('adapter_runtime', packed(RESEARCH / 'region-input-adapters/verification.json.gz'))]:
        file = getattr(a, key).resolve() / 'recovery.json'; recovery = json.loads(file.read_bytes())
        assert sha(file.read_bytes()) == verification['kernelRecoverySha256']
        assert recovery['status'] == 'PASS' and recovery['executableIrRestored'] is False
        rows = sorted((r['file'], r['sha256'], r['bytes']) for r in recovery['files'])
        assert len(rows) == 26070
        comparison.append({'role': key, 'recoverySha256': sha(file.read_bytes()), 'constantDataSha256': sha(json.dumps(rows, separators=(',', ':')).encode()), 'files': len(rows)})
        assert verification['kernelCacheAttribution'] == extra['kernelCacheAttribution']
        assert verification['privateSupportManifestSha256'] == extra['privateSupportManifestSha256']
    assert len({r['constantDataSha256'] for r in comparison}) == 1
    for name in ['region-input-functions', 'dependent-region-inputs', 'region-input-adapters']:
        v = packed(RESEARCH / name / 'verification.json.gz')
        assert v.get('leanExecutableSha256', v['build']['leanExecutableSha256']) == sha(lean.read_bytes())
        assert v.get('libraries', v['build']['libraries']) == libraries
    report = {'format': 'ProofAtlasPagedNotationEnvironment/1', 'status': 'PASS',
        'nativeSha256': sha(raw), 'coreReplayBytesMatch': True, 'coreSignatures': 20,
        'leanExecutableSha256': sha(lean.read_bytes()), 'runtimeSha256': sha(stable.encode()),
        'coreDataFiles': len(data), 'coreDataInventorySha256': sha(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()),
        'libraries': libraries, 'constantDataComparisons': comparison,
        'kernelCacheAttribution': extra['kernelCacheAttribution'], 'privateSupportManifestSha256': extra['privateSupportManifestSha256'],
        'resource': resource, 'producerSha256': sha(Path(__file__).read_bytes()),
        'mathlibArtifactsRestored': False, 'originalPrivateSourcesRead': False,
        'scope': 'Fresh byte-identical replay of twenty core signatures and preceding controls/laws, plus equality of recorded constant-data identities across the catalogue and two region runs. Extra signatures are reused from matching data, not freshly re-exported. No new typing, general refinement or comprehension claim.'}
    (BASE / 'environment.json.gz').write_bytes(gzip.compress((json.dumps(report, indent=2) + '\n').encode(), mtime=0))
    print(json.dumps({'status': 'PASS', 'coreSignatures': 20, 'matchedConstantFiles': 26070, 'restoredMathlib': False}))

if __name__ == '__main__': main()
