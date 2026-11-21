"""Render the six replayed calls and their selected proof inputs as a foldable tree."""
import gzip
import hashlib
import json
from html import escape
from pathlib import Path

here = Path(__file__).resolve().parent
reports = json.loads((here / 'contradiction-expansion.json').read_text())
owner = reports[0]['call']
root = here.parents[2]
packet_path = root / 'public/data/proof-atlas/goedel-sample/95236822667b3a9bca53.json.gz'
raw = gzip.decompress(packet_path.read_bytes())
assert hashlib.sha256(raw).hexdigest() == owner['indexSha256']
packet = json.loads(raw)
by_route = {tuple(r['call']['slots']): r for r in reports}

def link(path, node, label):
    current = packet['roots'][1]
    for slot in path:
        current = packet['children'][current][slot]
    assert current == node
    route = '.'.join(map(str, path))
    return (f'<a href="https://moiseevigor.github.io/projects/proof-atlas/library/'
            f'?edition={owner["edition"]}&amp;proof={owner["declaration"]}&amp;route=1%3A{route}'
            f'#expr-{node}">{escape(label)}</a>')

# Editorial captions and the mathematical inputs to expose on first expansion.
steps = {
    554: ('Conclude the goal from a contradiction', [2]),
    553: ('Use positivity of f(0) to obtain False', [4, 3]),
    551: ('Reduce positivity to the impossible inequality 0 < 0', [5, 6]),
    544: ('Substitute f(0) = 0 in the inequality', [6]),
    550: ('Apply irreflexivity of strict order at zero', []),
    543: ('Derive f(0) = 0 from the specialized equation', [4, 3]),
}

def render(path):
    report = by_route[path]
    call = report['call']
    assert all(call[k] == owner[k] for k in ('edition', 'indexSha256', 'declaration', 'root'))
    node = call['node']
    caption, slots = steps[node]
    head = node
    while packet['kind'][head] == 5:
        head = packet['children'][head][0]
    name = packet['payloads'][head]['name']
    args = report['arguments']
    parts = [f'<details{" open" if node in (554,553) else ""}><summary>{escape(caption)}</summary>',
             link(path, node, f'{name} · #{node}')]
    for slot in slots:
        arg = args[slot - 1]
        branch = path + (0,) * (len(args) - slot) + (1,)
        child = arg['node']
        parts.append('<div class="input">' + link(branch, child, arg['expected']))
        if branch in by_route:
            parts.append(render(branch))
        elif packet['kind'][child] == 0:
            binder = report['context'][-1 - packet['payloads'][child]['index']]
            name = packet['payloads'][binder['node']].get('binderName') or packet['payloads'][binder['node']]['declName']
            parts.append(' ← ' + link(binder['route']['slots'], binder['node'], name))
        parts.append('</div>')
    return ''.join(parts) + '</details>'

html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Why positivity gives a contradiction · Proof Atlas</title>
<style>html{color-scheme:light dark}body{max-width:45rem;margin:3rem auto;padding:0 1rem;font:1.1rem/1.55 Georgia,serif}h1,summary{line-height:1.3}details{margin:.6rem 0}summary{cursor:pointer;font-weight:bold;padding:.3rem 0}.input{border-inline-start:2px solid GrayText;padding-inline-start:clamp(.4rem,2vw,1rem);margin:.65rem 0;overflow-wrap:anywhere}a{color:LinkText;text-underline-offset:.16em}footer{font:.9rem/1.4 system-ui;margin-top:2rem}</style>
<main><h1>Why positivity gives a contradiction</h1><p>The hypothesis gives 0 &lt; f(0). The proof derives f(0) = 0. Expand the steps to see where these facts meet.</p>'''
(here / 'contradiction-expansion.html').write_text(html + render(tuple(owner['slots'])) +
    '<footer>Six compiled calls in lean_workbook_plus_19617. Captions are editorial. Formula links select exact inputs in the compiled term.</footer></main></html>')
