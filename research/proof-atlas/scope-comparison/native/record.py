"""Record authored compiled controls and replay attestations; no private sources/logs."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[3]
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inputs', type=Path, required=True)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    folder = args.inputs.resolve()
    verification = json.loads((folder/'verification.json').read_bytes())
    assert verification['status'] == 'PASS' and verification['wrongTypeRefusedByKernel']
    for file, digest in verification['producerFiles'].items():
        assert sha((ROOT/file).read_bytes()) == digest, file
    batch = (folder/'native.json').read_bytes()
    assert sha(batch) == verification['nativeSha256']
    plans = json.loads((folder/'plan.json').read_bytes())
    rows = json.loads(batch)
    profiles, outputs = [], {'native-batch.json.gz': batch,
                             'verification.json.gz': (folder/'verification.json').read_bytes()}
    for plan, row in zip(plans, rows, strict=True):
        name = plan['source']['name'].split('.')[-1]
        raw = (folder/(name+'.json')).read_bytes()
        assert sha(raw) == plan['source']['indexSha256']
        packet = json.loads(raw)
        assert packet['declaration']['kernelCheck'] == 'PASS' and packet['declaration']['axioms'] == []
        assert row['source'] == plan['source']
        native = json.dumps(row, separators=(',', ':'), ensure_ascii=False).encode()
        prefix = '/research/proof-atlas/scope-comparison/native/'+name
        record = dict(plan['record'], indexFile=prefix+'.index.json.gz')
        profiles.append(dict(source=plan['source'], record=record, kind=plan['kind'],
                             calls=plan['calls'], sourcePages=None,
                             owner=dict(file=prefix+'.native.json.gz', sha256=sha(native), bytes=len(native))))
        outputs[name+'.index.json.gz'] = raw
        outputs[name+'.native.json.gz'] = native
    assert len(profiles) == 3
    manifest = dict(format='ProofAtlasScopeNativeInventory/1', status='PASS', profiles=profiles,
                    batchSha256=sha(batch), verificationSha256=sha(outputs['verification.json.gz']),
                    recorderSha256=sha(Path(__file__).read_bytes()),
                    scope='Three authored Lean-core controls, not a corpus or AI benchmark. Compiled terms and native attestations only; no original private mathematical source or extraction logs.')
    outputs['inventory.json.gz'] = (json.dumps(manifest, indent=2)+'\n').encode()
    for name, raw in outputs.items():
        if args.publish:
            (BASE/name).write_bytes(gzip.compress(raw, mtime=0))
    print(json.dumps(dict(status='PASS', profiles=len(profiles), files=len(outputs),
                         compressedBytes=sum(len(gzip.compress(raw, mtime=0)) for raw in outputs.values()),
                         publishedLocally=args.publish)))


if __name__ == '__main__':
    main()
