"""Package the checked closing call and, for contradictions, the equality cast."""
import gzip
import hashlib
import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
assets = here.parents[2] / 'public/data/proof-atlas'
leaves = json.loads((here / 'transport-leaves.json').read_bytes())
reports = json.loads(Path(sys.argv[1]).read_bytes())
targets = [(leaf, key) for leaf in leaves for key in ('closing', 'cast') if key in leaf]
records = []
for (leaf, key), report in zip(targets, reports, strict=True):
    call = report['call']
    node = leaf['node' if key == 'closing' else 'castNode']
    assert call['node'] == node and ''.join(map(str, call['slots'])) == leaf[key]
    assert report['kernelDomainConversions'] == (2 if key == 'closing' else 4)
    if key == 'cast':
        assert report['arguments'][3]['node'] == leaf['sourceNode']
        leaf['equation'] = report['arguments'][3]['expected']
    elif leaf['rule'] == 'False.elim':
        assert report['arguments'][1]['expected'] == 'False'
    else:
        assert report['arguments'][1]['expected'].endswith(' = True')
    raw = json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode()
    file = 'transport-domains/leaf-' + str(node)
    (assets / (file + '.json.gz')).write_bytes(gzip.compress(raw, mtime=0))
    records.append(dict(node=node, path=leaf[key], bytes=len(raw), file=file, hash=hashlib.sha256(raw).hexdigest()))
hashes = {r['call']['indexSha256'] for r in reports}
assert len(hashes) == 1
index = dict(indexSha256=hashes.pop(), leaves=leaves, records=records)
(assets / 'transport-leaf-index.js').write_text('window.PROOF_ATLAS_TRANSPORT_LEAVES=' +
    json.dumps(index, ensure_ascii=False, separators=(',', ':'))+';\n')
