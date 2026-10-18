"""Publish compact compiled evidence; exclude resource records and native logs."""
import argparse, gzip, hashlib, io, json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sha = lambda b: hashlib.sha256(b).hexdigest()
encode = lambda x: json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--positive', type=Path, required=True)
    p.add_argument('--negative', type=Path, required=True)
    p.add_argument('--audit', type=Path, required=True)
    p.add_argument('--requests', type=Path, nargs='+', required=True)
    p.add_argument('--check', action='store_true')
    p.add_argument('--output-copy', type=Path)
    a = p.parse_args()
    for f in (a.positive, a.negative, a.audit):
        assert f.stat().st_size <= 16*1024**2
    positive, negative, audit = [json.loads(f.read_text()) for f in (a.positive, a.negative, a.audit)]
    assert positive['status'] == negative['status'] == audit['status'] == 'PASS'
    assert len(a.requests) == len(positive['rows']) == 5
    assert positive['records'] == audit['records'] == 29 and audit['bindings'] == 3
    assert negative['nativeRejections'] == 22 and negative['native']['tableBoundaryControls'] == 3
    files = dict(positive['sourceFiles'])
    for file, digest in negative['sourceFiles'].items():
        assert file not in files or files[file] == digest
        files[file] = digest
    for file in [BASE/'audit_native.py', BASE/'audit_large.py', Path(__file__)]:
        files[str(file.relative_to(ROOT))] = sha(file.read_bytes())
    assert files == {file:sha((ROOT/file).read_bytes()) for file in files}
    folder = ROOT/'public/data/proof-atlas/large-source-cuts'

    def compressed(path):
        with gzip.open(path, 'rb') as stream:
            raw = stream.read(64*1024**2+1)
        assert len(raw) <= 64*1024**2
        return raw

    def put(path, raw):
        if a.check:
            assert path.is_file() and compressed(path) == raw
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            stream = io.BytesIO()
            with gzip.GzipFile(fileobj=stream, mode='wb', filename='', mtime=0) as z:
                z.write(raw)
            path.write_bytes(stream.getvalue())

    names = ('AtlasLargePacketReplay.legacy_decode_agrees', 'AtlasLargePacketReplay.legacy_exact_agrees')
    laws = {name:positive['rows'][0]['genericTheorems'][name] for name in names}
    assert all({name:r['genericTheorems'][name] for name in names} == laws for r in positive['rows'])
    rows = []
    for file, row in zip(a.requests, positive['rows']):
        assert file.stat().st_size <= 64*1024**2
        request = json.loads(file.read_text())
        assert request['expected'] == row['source']
        assert sha(encode(request['records'])) == row['recordSetSha256']
        raw = compressed(Path(request['packetFile']))
        assert sha(raw) == row['packetSha256'] == row['source']['indexSha256']
        source = Path(request['packetFile']).resolve()
        if source.is_relative_to(ROOT/'public/data/proof-atlas'):
            source_file, origin = '/'+str(source.relative_to(ROOT)), 'published-compiled-synthetic-control'
        else:
            source = folder/('deep-'+sha(raw)+'.json.gz')
            put(source, raw)
            source_file, origin = '/'+str(source.relative_to(ROOT)), 'own-serialized-syntax-control-no-typing-claim'
        packet = json.loads(raw)
        rows.append(dict(source=row['source'], sourcePacket=source_file, origin=origin,
                         sourceNodes=row['native']['sourceNodes'], sourceRootOccurrences=[packet['expanded'][r] for r in packet['roots']],
                         records=row['native']['records'], refinements=row['native']['refinements'],
                         nativeOutputSha256=row['nativeOutputSha256'], recordSetSha256=row['recordSetSha256'],
                         bindings=row['independent']['bindings'], externalTargets=row['independent']['externalTargets']))
    result = dict(format='ProofAtlasLargeSourceCutEvidence/1', toolchain='leanprover/lean4:v4.33.1', sourceNodeLimit=262144,
                  producer=dict(sourceFiles=files, runtimeSha256=positive['runtimeSha256'], negativeRuntimeSha256=negative['runtimeSha256']),
                  positive=dict(packets=5, records=29, refinements=sum(r['refinements'] for r in rows), bindings=3, rows=rows),
                  legacyCompatibility=dict(kindTableBound=131072, theorems=laws, scope='Equality of the pure decoder and exact-roundtrip results within the legacy kind-table bound; not decoder correctness.'),
                  independentTargetAudit=audit, negative=dict(nativeRejections=22, tableBoundaryControls=3, rejected=negative['native']['rejected']),
                  sourceModuleBytesVerified=False, mathematicalTypingChecked=False, individualKernelCertificates=False,
                  schemaDecoderFormallyVerified=False, browserRendererVerified=False,
                  scope='Finite native structural reconstruction and lexical checks on four large public controls and one deep syntax control. No AI attribution, mathematical typing or all-size guarantee.')
    raw = encode(result)
    if a.output_copy:
        a.output_copy.parent.mkdir(parents=True, exist_ok=True)
        a.output_copy.write_bytes(raw)
    file = folder/(sha(raw)+'.json.gz')
    put(file, raw)
    descriptor = dict(format='ProofAtlasLargeSourceCutInventory/1', file='/'+str(file.relative_to(ROOT)), sha256=sha(raw), decodedBytes=len(raw),
                      sourceNodeLimit=262144, largestCheckedSourceNodes=max(r['sourceNodes'] for r in rows), packets=5, records=29,
                      nativeRejections=22, tableBoundaryControls=3, sourceModuleBytesVerified=False, mathematicalTypingChecked=False)
    manifest = ROOT/'public/data/proof-atlas/large-source-cuts-manifest.js'
    text = 'window.PROOF_ATLAS_LARGE_SOURCE_CUT_CHECKS='+json.dumps(descriptor, separators=(',', ':'))+';\n'
    if a.check:
        assert manifest.read_text() == text
    else:
        manifest.write_text(text)
    print(json.dumps(dict(status='PASS', mode='check' if a.check else 'write', **descriptor)))


if __name__ == '__main__':
    main()
