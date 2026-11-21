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
for group, before, after in zip(groups, *(json.loads(Path(f).read_bytes()) for f in sys.argv[1:3]), strict=True):
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
census = json.loads(subprocess.check_output(['node', here/'conjunct-uses.cjs']))
other = next(row for row in census['records'] if row['declaration'] != flow['declaration'])
rows = []
for group, report in zip(other['groups'], json.loads(Path(sys.argv[3]).read_bytes()), strict=True):
    call = report['call']
    assert call['indexSha256'] == other['indexSha256'] and call['declaration'] == other['declaration']
    assert call['root'] == 1 and group['target'] == dict(node=call['node'], path=''.join(map(str, call['slots'])))
    premise = report['arguments'][group['slot']-1]
    assert premise['node'] == group['use']['node']
    returned = report.get('returnedFunction')
    if not group['steps']:
        assert returned['head'] == 'Eq.ndrec' and group['slot'] == returned['declaredBinders'] + 1
        output = 'First premise after equality transport'
    else:
        assert group['receiver'].startswith('Mathlib.Tactic.Linarith.sub_nonpos_of_le · ')
        output = 'Rewrite as a nonpositive difference'
    rows.append(dict(count=group['count'], input=premise['inferred'], output=output,
                     clause=group['use'], receiver=group['target']))
second = dict(declaration=other['declaration'], edition=census['edition'], indexSha256=other['indexSha256'],
              binder=dict(**other['binder'], name=other['name']), groups=sorted(rows, key=lambda r:r['input']))
(here.parents[2]/'public/data/proof-atlas/clause-uses.js').write_text(
    'window.PROOF_ATLAS_CLAUSE_USES='+json.dumps([flow, second], ensure_ascii=False, indent=2)+';\n')
