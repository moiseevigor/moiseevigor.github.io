"""Package checked transport occurrences and their exact containment links."""
import gzip
import hashlib
import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
data = here.parents[2] / 'public/data/proof-atlas'
batch = json.loads(Path(sys.argv[1]).read_bytes())
inventory = json.loads((here / 'transport-boundaries.json').read_bytes())
entries = []
for record in inventory['records']:
    for width, witnesses in record['examples'].items():
        assert len(witnesses) == int(record['counts'][width])
        for witness in witnesses:
            entries.append((record, int(width), witness))
metadata = []
for report, (owner, width, witness) in zip(batch, entries, strict=True):
    call, returned = report['call'], report['returnedFunction']
    path = ''.join(map(str, call['slots']))
    assert (call['declaration'], call['indexSha256'], call['root'], path, call['node']) == (
        owner['name'], owner['indexSha256'], 1, witness['slots'], witness['node'])
    assert returned['node'] == witness['returnedNode'] and returned['head'] == 'Eq.ndrec'
    assert returned['declaredBinders'] == 6 and report['kernelDomainConversions'] == width
    raw = json.dumps(report, separators=(',', ':'), ensure_ascii=False).encode()
    file = 'ai-ndrec-domains' if call['node'] == 86574 else 'transport-domains/' + str(call['node'])
    asset = data / (file + '.json.gz')
    asset.parent.mkdir(exist_ok=True)
    if call['node'] == 86574:
        assert gzip.decompress(asset.read_bytes()) == raw
    else:
        asset.write_bytes(gzip.compress(raw, mtime=0))
    metadata.append(dict(node=call['node'], path=path, file=file, bytes=len(raw),
                         hash=hashlib.sha256(raw).hexdigest(), equality=report['arguments'][5]['expected']))
for row in metadata:
    ancestors = [r for r in metadata if r!=row and row['path'].startswith(r['path'])]
    parent = max(ancestors, key=lambda r: len(r['path']), default=None)
    row['parent'] = parent['node'] if parent else None
    if parent:
        # Every nested transport in this packet lies within argument 4 of its closest enclosing transport.
        assert row['path'][len(parent['path']):].startswith('0000001')
assert len({r['indexSha256'] for r, _, _ in entries}) == 1
index = dict(indexSha256=entries[0][0]['indexSha256'], records=metadata)
(data / 'transport-domain-index.js').write_text('window.PROOF_ATLAS_TRANSPORT_DOMAINS=' +
    json.dumps(index, ensure_ascii=False, separators=(',', ':'))+';\n')
