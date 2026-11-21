"""Join checked disjunctions to their source let-bindings and both branch occurrences."""
import gzip
import hashlib
import json
from pathlib import Path
import sys

here = Path(__file__).resolve().parent
assets = here.parents[2] / 'public/data/proof-atlas'
rows = json.loads((here / 'transport-cases.json').read_bytes())
for row, report in zip(rows, json.loads(Path(sys.argv[1]).read_bytes()), strict=True):
    call = report['call']
    assert (call['node'], call['indexSha256'], call['slots']) == (
        row['node'], row['indexSha256'], list(map(int, row['path'])))
    assert report['kernelDomainConversions'] == 6
    major = report['arguments'][3]
    assert major['node'] == row['major'] and major['structurallyIdentical']
    raw = json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode()
    row.update(disjunction=major['expected'], file='transport-domains/case-'+str(call['node']),
               hash=hashlib.sha256(raw).hexdigest(), bytes=len(raw))
    (assets / (row['file']+'.json.gz')).write_bytes(gzip.compress(raw, mtime=0))
(assets / 'transport-case-index.js').write_text('window.PROOF_ATLAS_TRANSPORT_CASES=' +
    json.dumps(rows, ensure_ascii=False, separators=(',', ':'))+';\n')
