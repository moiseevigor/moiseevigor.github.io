"""Publish compiled replay attestations and own compiled controls, excluding logs/sources."""
import argparse
import gzip
import json
from pathlib import Path
from verify import BASE, RESEARCH, ROOT, manifest, runtime_source, sha

FILES = ['research/proof-atlas/ExportLibrary.lean',
         'research/proof-atlas/LevelTransportControls.lean',
         'research/proof-atlas/build_recursion_examples.py',
         'research/proof-atlas/evaluate_goedel.py',
         'research/proof-atlas/compiled-replay/Replay.lean',
         'research/proof-atlas/compiled-replay/Controls.lean',
         'research/proof-atlas/compiled-replay/verify.py']


def package(verification):
    native = json.loads(verification.read_text())
    folder = verification.parent
    inventory = manifest()
    records = inventory['edition']['declarations']
    assert native['status'] == 'PASS' and native['resources']['exitCode'] == 0
    assert native['resources']['stopReason'] is None
    assert native['runtimeSourceSha256'] == sha(runtime_source().encode())
    assert native['driverSha256'] == sha((BASE / 'verify.py').read_bytes())
    assert native['entrySha256'] == sha((folder / 'Replay.lean').read_bytes())
    assert (folder / 'Replay.lean').read_text().startswith(runtime_source())
    assert native['environment'] == inventory['provenance']['environment']
    assert native['imports'] == ['Mathlib', 'Aesop']
    assert native['originalProofModulesImported'] is False
    assert native['originalProofProjectsOrDependenciesBuilt'] is False
    assert sha((folder / 'replayed.ndjson').read_bytes()) == native['nativeOutputSha256']
    assert [json.loads(s) for s in (folder / 'replayed.ndjson').read_text().splitlines()] == native['rows']
    assert sha((folder / 'controls.json').read_bytes()) == native['controlsSha256']
    assert json.loads((folder / 'controls.json').read_text()) == native['controls']
    assert len(native['rows']) == len(records) == 20
    metadata = 0
    for row, record in zip(native['rows'], records):
        assert row['name'] == record['name'] and row['indexSha256'] == record['indexSha256']
        assert row['storedNodes'] == record['uniqueNodes']
        assert sorted(row['axioms']) == sorted(record['axioms']) and 'sorryAx' not in row['axioms']
        assert row['originalTheoremAbsentFromEnvironment'] and row['originalModuleAbsentFromEnvironment']
        assert row['wrongProofRejectedByKernel'] and row['illTypedBinderRejectedByKernel']
        assert all(row[k] == 'PASS' for k in ['kernelExpectedType', 'kernelProof', 'kernelExpectedTypeConversion'])
        raw = gzip.decompress((ROOT / record['indexFile'].lstrip('/')).read_bytes())
        assert sha(raw) == record['indexSha256']
        source = json.loads(raw)
        for kind, payload in zip(source['kind'], source['payloads']):
            if kind == 10:
                for item in payload['metadata']:
                    assert item['value']['kind'] == 'ofBool'
                    metadata += 1
    return {'format': 'ProofAtlasCompiledPacketReplay/1', 'edition': inventory['edition']['id'],
            'leanVersion': '4.33.1', 'compiler': native['compiler'],
            'environment': native['environment'], 'imports': native['imports'],
            'producer': {k: native[k] for k in ['runtimeSourceSha256', 'driverSha256', 'entrySha256',
                                               'requestSha256', 'nativeOutputSha256', 'controlsSha256']},
            'producerFiles': {p: sha((ROOT / p).read_bytes()) for p in FILES},
            'originalProofModulesImported': False, 'originalProofProjectsOrDependenciesBuilt': False,
            'coverage': {'packets': 20, 'storedNodes': sum(r['storedNodes'] for r in native['rows']),
                         'metadataEntries': metadata, 'metadataValueKinds': ['ofBool']},
            'rows': native['rows'], 'controls': native['controls'],
            'scope': 'Closed theorem type/proof roots from one frozen 20-proof publisher-attributed AI sample. '
                     'Exact Boolean metadata only; other metadata payloads are rejected. Open constructor controls '
                     'are structural only. Recorded native checks trust the pinned compiled Mathlib/Aesop '
                     'environment and are not a portable kernel certificate or a comprehension result.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verification', required=True, type=Path)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    data = package(args.verification.resolve())
    raw = json.dumps(data, separators=(',', ':'), ensure_ascii=False).encode()
    digest = sha(raw)
    file = '/public/data/proof-atlas/compiled-replay/' + digest + '.json.gz'
    descriptor = {'format': 'ProofAtlasCompiledReplayManifest/1', 'edition': data['edition'],
                  'package': {'file': file, 'sha256': digest, 'decodedBytes': len(raw)},
                  'records': [{'name': r['name'], 'indexSha256': r['indexSha256']} for r in data['rows']]}
    target = ROOT / file.lstrip('/')
    index = ROOT / 'public/data/proof-atlas/compiled-replay-manifest.js'
    if args.publish:
        target.parent.mkdir(exist_ok=True)
        if target.exists():
            assert gzip.decompress(target.read_bytes()) == raw, 'Frozen generation changed'
        else:
            target.write_bytes(gzip.compress(raw, mtime=0))
        index.write_text('window.PROOF_ATLAS_COMPILED_REPLAY = ' + json.dumps(descriptor, separators=(',', ':')) + ';\n')
    else:
        assert json.loads(index.read_text().split('=', 1)[1].strip().rstrip(';')) == descriptor
        assert gzip.decompress(target.read_bytes()) == raw
    print(json.dumps({'status': 'PASS', 'packets': data['coverage']['packets'],
                      'file': file, 'decodedBytes': len(raw), 'published': args.publish}))


if __name__ == '__main__':
    main()
