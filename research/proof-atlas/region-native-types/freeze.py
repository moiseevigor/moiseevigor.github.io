"""Freeze verified compiled evidence; original Lean proof sources stay private."""
import argparse, gzip, hashlib, json, shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--support', type=Path, required=True)
    p.add_argument('--lean', type=Path, required=True)
    a = p.parse_args()
    folder, support, lean = a.workdir.resolve(), a.support.resolve(), a.lean.resolve()
    raw = (folder / 'verification.json').read_bytes()
    report = json.loads(raw)
    plan_raw = (folder / 'plan.json').read_bytes()
    assert report['status'] == 'PASS' and report['queries'] == 150 and len(report['profiles']) == 11
    assert sha(plan_raw) == report['planSha256']
    plan = json.loads(plan_raw)
    for f, h in {**report['build']['sourceFiles'], **plan['files'], **report['sourceFiles']}.items():
        assert sha((ROOT / f).read_bytes()) == h, f
    assert sha(lean.read_bytes()) == report['build']['leanExecutableSha256']
    for name, digest in report['build']['libraries'].items():
        assert sha((lean.parents[1] / 'lib/lean' / name).read_bytes()) == digest
    private_raw = (support / 'private-modules.json').read_bytes()
    private = json.loads(private_raw)
    for name, digest in private['modules'].items():
        assert sha((support / 'SE2Conjugate' / name).read_bytes()) == digest
    count = 0
    for profile in report['profiles']:
        original = folder / profile['outputFile']
        assert sha(original.read_bytes()) == profile['outputSha256']
        with gzip.open(original, 'rb') as stream:
            digest = hashlib.sha256()
            for line in stream:
                row = json.loads(line)
                assert row['status'] == 'PASS' and row['kernelProjectedOpenTyping'] == 'PASS'
                digest.update(line)
                count += 1
            assert digest.hexdigest() == profile['resources']['rawStreamSha256']
        shutil.copyfile(original, BASE / ('native-' + str(profile['profile']) + '.ndjson.gz'))
    assert count == 150
    provenance = {'format': 'ProofAtlasRegionNativeFreeze/1', 'status': 'PASS',
        'nativeVerificationSha256': sha(raw), 'planSha256': sha(plan_raw),
        'postRunLibrariesMatchBuild': True, 'reusedRiccatiSupport': {
            'manifestSha256': sha(private_raw), 'modules': private['modules'],
            'compiler': private['inputs']['compiler'],
            'previousDependencyInventorySha256': private['inputs']['dependencyInventorySha256']},
        'originalPrivateSourcesPublished': False,
        'scope': 'Verified constant-data artifacts and exact support module binaries are reused; no independent dependency rebuild.'}
    for name, data in [('native-check.json.gz', raw), ('plan.json.gz', plan_raw),
                       ('freeze.json.gz', (json.dumps(provenance, indent=2) + '\n').encode())]:
        (BASE / name).write_bytes(gzip.compress(data, mtime=0))
    print(json.dumps({'status': 'PASS', 'profiles': 11, 'queries': 150}))


if __name__ == '__main__':
    main()
