"""Publish compiled reduced-context recipes; original scripts and logs stay private."""
from pathlib import Path
import argparse, gzip, hashlib, json

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--evidence-root', type=Path, required=True)
args = parser.parse_args()
base = args.evidence_root.resolve()
read = lambda p: json.loads(p.read_text())
encode = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':')).encode()
sha = lambda b: hashlib.sha256(b).hexdigest()
native = read(base / 'verification.json')
independent = read(base / 'independent-reconstruction.json')
assert native['status'] == independent['status'] == 'PASS'
assert native['nativeReducedContexts'] == independent['nativeReducedContextsCompared'] == 3
output = (base / 'observations.ndjson').read_bytes()
assert sha(output) == native['nativeOutputSha256'] == independent['nativeOutputSha256']
ai = json.loads((ROOT / 'public/data/proof-atlas/goedel-sample-manifest.js').read_text().split('=', 1)[1].rstrip(';\n'))
record = next(r for r in ai['edition']['declarations'] if r['name'] == native['name'])
assert record['indexSha256'] == native['sourceIndexSha256']
assert record['origin']['kind'] == 'publisher-attributed-ai-source'
source = {'edition': 'goedel-sample-4331', 'name': record['name'], 'indexSha256': record['indexSha256'], 'sourceSha256': record['sourceSha256']}

def root_digests(graph, roots):
    hashes = []
    for i, kind in enumerate(graph['kind']):
        assert all(0 <= c < i for c in graph['children'][i])
        # Match the independently implemented Node fingerprint. Only payload
        # object keys need sorting; expression children retain their port order.
        payload = json.loads(json.dumps(graph['payloads'][i], sort_keys=True, ensure_ascii=False))
        hashes.append(sha(encode([kind, payload, [hashes[c] for c in graph['children'][i]], graph['expanded'][i], graph['neededScope'][i]])))
    return [hashes[i] for i in roots]

entries = []
for row in map(json.loads, output.splitlines()):
    assert row['source'] == source and row['nativeDagMatchesPacket'] is True and row['kernelDeclarationTyping'] == 'PASS'
    entry = row['entry']
    assert entry['status'] == 'checked'
    use = entry['reducedContext']
    if entry['state']['expectReducedFailure']:
        assert use['status'] == 'expected-rejection'
        continue
    assert use['status'] == 'checked'
    for field in ['closedTermTyping', 'closedTypeTyping', 'closedExpectedConversion', 'appliedClosureTyping', 'instantiatedTermConversion', 'sourceTypeRoundtrip']:
        assert use[field] == 'PASS'
    module = use['module']
    assert module['status'] == 'first-checked-module'
    graph = module.pop('moduleGraph')
    term, expected = module.pop('moduleTermRoot'), module.pop('moduleTypeRoot')
    term_hash, expected_hash = root_digests(graph, [term, expected])
    module.update(closedRepresentation='ordered-source-projection-recipe/1',
                  nativeTermShapeSha256=term_hash, nativeExpectedTypeShapeSha256=expected_hash,
                  nativeTermOccurrences=graph['expanded'][term], nativeExpectedTypeOccurrences=graph['expanded'][expected],
                  fingerprintMethod='expr-constructor-payload-ordered-children-count-scope/1')
    use.pop('rawTypeGraph')
    use.pop('rawTypeRoot')
    entry['state'] = {k: v for k, v in entry['state'].items() if k not in ['expectReducedFailure', 'requiredSlots']}
    entries.append(entry)
assert len(entries) == 3
environment = dict(native['environment'], kind='existing-compiled-reduced-context/1', module=record['module'],
                   sourceSha256=record['sourceSha256'], compiledModuleSha256=native['compiledModuleSha256'], compiler=native['compiler'])
provenance = {k: native[k] for k in ['producerSha256', 'requestSha256', 'nativeOutputSha256', 'compiledModuleSha256']}
provenance.update(nativePacketSha256=record['indexSha256'], projectionProducerSha256=sha(Path(__file__).read_bytes()),
                  environmentSha256=sha(encode(environment)), projectionModelSha256=sha((ROOT / 'public/js/proof-atlas-context-projection.js').read_bytes()),
                  sceneModelSha256=sha((ROOT / 'public/js/proof-atlas-projected-context-modules.js').read_bytes()))
package = dict(format='ProofAtlasProjectedContextModulePackage/1', source=source, leanVersion='4.33.1',
               nativeDagMatchesPacket=True, kernelDeclarationTyping='PASS', environment=environment, entries=entries, **provenance)
raw = encode(package)
assert len(raw) <= 8 * 1024**2 and b'/Users/' not in raw and b'/tmp/' not in raw
digest = sha(raw)
target = ROOT / 'public/data/proof-atlas/projected-context-modules'
target.mkdir(exist_ok=True)
file = target / (digest + '.json.gz')
file.write_bytes(gzip.compress(raw, mtime=0))
descriptor = dict(source, file='/' + file.relative_to(ROOT).as_posix(), sha256=digest, decodedBytes=len(raw),
                  checked=3, modules=3, instantiations=0, routes=[e['state']['route'] for e in entries], **provenance)
manifest = dict(format='ProofAtlasProjectedContextModuleInventory/1', records=[descriptor],
                scope='Three native checked reduced contexts in one frozen publisher-attributed AI proof. Other routes retain the separately recorded full-context view. No new typing for descendants, cross-proof reuse or logical-necessity claim.')
(ROOT / 'public/data/proof-atlas/projected-context-modules-manifest.js').write_text('window.PROOF_ATLAS_PROJECTED_CONTEXT_MODULES=' + encode(manifest).decode() + ';\n')
print(json.dumps({'status': 'PASS', 'compiledRoutes': 3, 'decodedBytes': len(raw), 'file': descriptor['file'],
                  'originalProofScriptsOrLogsPublished': False, 'materializedClosedGraphsPublished': False}))
