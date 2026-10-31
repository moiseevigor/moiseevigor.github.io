"""Row/depth replay of the complete frozen 29-profile, 100-exchange census."""
import argparse, gzip, hashlib, importlib.util, json, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    lean = args.lean.resolve()
    folder = args.workdir.resolve()
    subprocess.run(['node', str(RESEARCH / 'expr-reference-laws/prepare.cjs'), str(folder)], cwd=ROOT, check=True)
    (folder / 'outputs').mkdir()
    (folder / 'scratch').mkdir(exist_ok=True)
    plan_raw = (folder / 'plan.json').read_bytes()
    plan = json.loads(plan_raw)
    assert len(plan['profiles']) == 29 and plan['queries'] == 100
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    spec = importlib.util.spec_from_file_location('reference_runtime', RESEARCH / 'expr-reference-laws/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    files = [BASE / name for name in ['NodeRewrite.lean', 'Corpus.lean', 'verify-corpus.py']]
    files += [RESEARCH / name for name in ['expr-reference-laws/verify.py', 'expr-reference-laws/prepare.cjs',
        'expr-reference-laws/Reference.lean', 'expr-reference-laws/Bridge.lean', 'packet-typing/verify.py',
        'packet-typing/PacketTyping.lean', 'ExportLibrary.lean', 'ExportOccurrenceTypes.lean',
        'LevelTransportControls.lean', 'compiled-replay/Replay.lean', 'build_recursion_examples.py', 'evaluate_goedel.py']]
    producer_files = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    binary = sha(lean.read_bytes())
    runtime = module.runtime() + '\n' + (BASE / 'NodeRewrite.lean').read_text() + '\n' + (BASE / 'Corpus.lean').read_text()
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder),
           'LANG': 'en_US.UTF-8', 'TMPDIR': str(folder / 'scratch')}
    records = []
    for i, profile in enumerate(plan['profiles']):
        assert sha(Path(profile['requestFile']).read_bytes()) == profile['requestSha256']
        assert sha(Path(profile['graphFile']).read_bytes()) == profile['graphSha256']
        assert sha((ROOT / profile['nativeInventory']['file']).read_bytes()) == profile['nativeInventory']['sha256']
        entry, output = folder / 'Replay.lean', folder / 'output.json'
        assert not output.exists()
        entry.write_text(runtime + '\n#atlas_scoped_dag_replay ' + json.dumps(profile['requestFile']) + ' => ' + json.dumps(str(output)) + '\n')
        resources = run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, [folder]),
            str(lean), '-j1', '-M4096', str(entry)], folder, 'native-' + str(i), env, timeout=120)
        raw = output.read_bytes()
        data = json.loads(raw)
        assert data['id'] == profile['id'] and data['source'] == profile['source']
        assert data['nativeCaseSha256'] == profile['nativeCaseSha256'] and data['nativeInventory'] == profile['nativeInventory']
        assert data['originalDeclarationImported'] is False
        assert [o['query'] for o in data['observations']] == profile['queries']
        assert all(o['recordedAndNative'] == 'PASS' for o in data['observations'])
        for o in data['observations']:
            assert len(o['stats']) == 4
            assert all(s['states'] <= 262144 and s['visits'] <= 1048577 and s['peakPending'] <= 4096 for s in o['stats'])
        archive = folder / 'outputs' / (str(i) + '.json.gz')
        archive.write_bytes(gzip.compress(raw, mtime=0))
        output.unlink()
        records.append({'source': profile['source'], 'id': profile['id'], 'outputFile': 'outputs/' + archive.name,
            'outputSha256': sha(raw), 'runtimeSha256': sha(entry.read_bytes()), 'resources': resources,
            'queries': len(profile['queries'])})
        (folder / 'progress.json').write_text(json.dumps({'completed': records}, indent=2) + '\n')
        print(json.dumps({'status': 'PASS', 'profile': i, 'id': profile['id'], 'queries': len(profile['queries'])}), flush=True)
    assert producer_files == {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    assert binary == sha(lean.read_bytes()) and plan_raw == (folder / 'plan.json').read_bytes()
    assert sum(r['queries'] for r in records) == 100
    report = {'format': 'ProofAtlasScopedDagCorpusEvidence/1', 'status': 'PASS', 'compiler': compiler,
        'leanExecutableSha256': binary, 'producerFiles': producer_files, 'planSha256': sha(plan_raw),
        'profiles': records, 'independentDependencyRebuild': False,
        'scope': 'Complete structural replay of all 100 frozen exchanges with explicit row/depth caching. No new original-theorem typing judgment.'}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')

if __name__ == '__main__':
    main()
