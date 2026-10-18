"""Compare every larger-profile native binder observation with original DAG paths.

This imports the independent path walker, not the decoder, renderer or producer.
"""
import argparse, gzip, json
from pathlib import Path
from audit_native import sha, source_at


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--report', type=Path, required=True)
    p.add_argument('--requests', type=Path, nargs='+', required=True)
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    assert a.report.stat().st_size <= 16*1024**2
    report = json.loads(a.report.read_text())
    assert report['status'] == 'PASS' and report['format'] == 'ProofAtlasLargeNativeSourceCutVerification/1'
    assert 0 < len(a.requests) == len(report['rows']) <= 4096
    variables = bindings = external = records = 0
    for index, (file, row) in enumerate(zip(a.requests, report['rows'])):
        assert file.stat().st_size <= 64*1024**2
        request = json.loads(file.read_text())
        assert request['expected'] == row['source']
        assert sha(json.dumps(request['records'], sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()) == row['recordSetSha256']
        with gzip.open(request['packetFile'], 'rb') as f:
            raw = f.read(64*1024**2+1)
        assert len(raw) <= 64*1024**2 and sha(raw) == row['packetSha256'] == row['source']['indexSha256']
        packet = json.loads(raw)
        output = a.report.parent/str(index)/'native.json'
        assert output.stat().st_size <= 64*1024**2
        raw = output.read_bytes()
        assert sha(raw) == row['nativeOutputSha256']
        observed = json.loads(raw)
        assert observed == row['native'] and len(observed['bindings']) == len(request['records'])
        for record, actual in zip(request['records'], observed['bindings']):
            records += 1
            root = record['root']['route']['root']
            base = record['root']['route']['slots']
            expected = []
            for entry in record['entries']:
                if entry['tag'] != 'node':
                    continue
                slots = base+entry['slots']
                node, context = source_at(packet, root, slots)
                assert node == entry['node']
                if packet['kind'][node] != 0:
                    continue
                n = packet['payloads'][node]['index']
                target = context[-1-n] if n < len(context) else None
                target_slots = target[1] if target else None
                outside = bool(target and len(target_slots) < len(base))
                expected.append(dict(node=node, root=root, slots=slots, target=target_slots, external=outside))
                variables += 1
                bindings += int(target is not None)
                external += int(outside)
            assert expected == actual, 'Native target mismatch: '+row['source']['name']
    result = dict(status='PASS', format='ProofAtlasLargeNativeTargetAudit/1', requests=len(a.requests), records=records,
                  variables=variables, bindings=bindings, externalTargets=external, nativeOrBrowserCodeImported=False,
                  scope='Exact emitted-target comparison at retained source paths; no mathematical typing or general decoder proof.')
    a.output.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
