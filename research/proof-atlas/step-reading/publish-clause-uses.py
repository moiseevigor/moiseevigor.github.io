"""Join a complete structural census to contextual kernel replays for its representatives."""
import json
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
flow = json.loads(subprocess.check_output(['node', here/'nonnegative-uses.cjs']))
groups = flow.pop('groups')
results = []
def address(at):
    assert at['route']['root'] == 1
    return dict(node=at['node'], path=''.join(map(str, at['route']['slots'])))
for group, before, after in zip(groups, *(json.loads(Path(f).read_bytes()) for f in sys.argv[1:]), strict=True):
    e = group['example']
    for report, key in [(before, 'receiver'), (after, 'next')]:
        call = report['call']
        assert call['indexSha256'] == flow['indexSha256'] and call['declaration'] == flow['declaration']
        assert call['node'] == e[key]['node'] and call['root'] == 1 and call['slots'] == e[key]['route']['slots']
    premise = before['arguments'][e['slot']-1]
    conclusion = after['arguments'][e['nextSlot']-1]
    assert premise['node'] == e['clause']['node'] and conclusion['node'] == e['receiver']['node']
    results.append(dict(count=group['count'], input=premise['inferred'], output=conclusion['inferred'],
                        clause=address(e['clause']), receiver=address(e['receiver'])))
flow['groups'] = sorted(results, key=lambda r: r['input'])
(here.parents[2]/'public/data/proof-atlas/clause-uses.js').write_text(
    'window.PROOF_ATLAS_CLAUSE_USES='+json.dumps(flow, ensure_ascii=False, indent=2)+';\n')
