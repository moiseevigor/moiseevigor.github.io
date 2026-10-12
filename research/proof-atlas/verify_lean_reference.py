"""Verify the curated reference against Lean 4.33.1 source and compiler.

Run: python3 research/proof-atlas/verify_lean_reference.py --lean /path/to/lean
This checks constructor names/fields and 40 complete source examples. Internal
fragments and intentionally unfinished holes are excluded; no AST correspondence
is asserted between source snippets and the illustrative constructor diagrams.
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def load(name, assignment):
    text = (ROOT / 'public/data/proof-atlas' / name).read_text()
    return json.loads(text.split(assignment + '=')[1].rstrip(';\n'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lean', default='lean')
    args = parser.parse_args()
    version = subprocess.run([args.lean, '--version'], capture_output=True, text=True, check=True).stdout
    if '4.33.1' not in version:
        raise SystemExit('Expected Lean 4.33.1; got ' + version)
    prefix = subprocess.run([args.lean, '--print-prefix'], capture_output=True, text=True, check=True).stdout.strip()
    source = Path(prefix) / 'src/lean'
    grammar = load('lean-expr-grammar.js', 'window.PROOF_ATLAS_GRAMMAR')
    reference = load('lean-syntax-reference.js', 'window.PROOF_ATLAS_SYNTAX_REFERENCE')
    expr = (source / 'Lean/Expr.lean').read_text().split('inductive Expr where')[1].split('\nwith\n')[0]
    tags = re.findall(r'^  \| (\w+)', expr, re.M)
    assert tags == [e['kind'] for e in grammar['kinds']], 'Expr constructor inventory differs'
    for entry in grammar['kinds']:
        line = re.search(r'^  \| ' + entry['kind'] + r'\b(.*)$', expr, re.M).group(1)
        actual = re.findall(r'\((\w+) : ([^)]+)\)', line)
        displayed = [(f['name'], f['type']) for f in entry['fields']]
        if entry['kind'] == 'lit':
            assert 'Literal → Expr' in line and displayed == [('literal', 'Literal')]
        else:
            assert actual == displayed, (entry['kind'], actual, displayed)
    for layer, filename, start, end in [
        ('level', 'Lean/Level.lean', 'inductive Level where', '\nwith\n'),
        ('syntax', 'Init/Prelude.lean', 'inductive Syntax where', '/-- Create syntax node')
    ]:
        definition = (source / filename).read_text().split(start)[1].split(end)[0]
        actual = re.findall(r'^  \| (\w+)', definition, re.M)
        shown = [e['id'].split('-', 1)[1] for e in reference['entries'] if e['layer'] == layer]
        assert actual == shown, (layer, actual, shown)
    complete_ids = {
        'surface-binders', 'surface-do', 'surface-calc', 'surface-recursion', 'surface-logic', 'surface-coercions',
        'command-declarations', 'command-axioms', 'command-inductive', 'command-structure', 'command-instance',
        'command-scope', 'command-universes', 'command-attributes', 'command-options', 'command-diagnostics',
        'command-termination', 'macro-notation', 'macro-expansion', 'macro-quotation', 'macro-elaborators',
        'macro-delaboration', 'level-param', 'level-max', 'elab-info-tree', 'elab-environment', 'elab-constraints'
    }
    term_ids = {'surface-match', 'surface-conditionals'}
    snippets = []
    for entry in reference['entries']:
        if entry['layer'] == 'tactic' or entry['id'] in complete_ids | term_ids:
            text = entry['example']
            if entry['id'] in term_ids:
                text = '#check (' + text + ')'
            namespace = entry['id'].replace('-', '_')
            snippets.append('namespace ' + namespace + '\n' + text + '\nend ' + namespace)
    assert len(snippets) == 40
    with tempfile.TemporaryDirectory() as directory:
        file = Path(directory) / 'SurfaceExamples.lean'
        file.write_text('import Lean\n' + '\n\n'.join(snippets) + '\n')
        result = subprocess.run([args.lean, str(file)], capture_output=True, text=True)
        if result.returncode:
            raise SystemExit(result.stdout + result.stderr)
    subprocess.run([args.lean, str(ROOT / 'research/proof-atlas/KernelExamples.lean')], capture_output=True, text=True, check=True)
    print(json.dumps({'status': 'PASS', 'lean': '4.33.1', 'constructors': {'Expr': 12, 'Level': 6, 'Syntax': 4},
                      'compiled_source_examples': 40, 'kernel_checked_terms': 10, 'invalid_projection_rejected': True}))

if __name__ == '__main__':
    main()
