"""Prepare aligned term payloads from the original CoreGIR + public structure.

Publication of this output releases private-repository proof-term details.
Generate outside public/ until the owner explicitly authorizes that release.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('export', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--artifact-run', required=True, type=int)
    args = parser.parse_args()
    raw = args.export.read_bytes()
    core = json.loads(raw)
    text = (ROOT/'public/data/proof-atlas/crossing-structure.js').read_text()
    structure = json.loads(text.split('window.PROOF_ATLAS_DATA=')[1].rstrip(';\n'))
    nodes = core['nodes']
    assert len(nodes) == len(structure['parent'])
    indexes = {n['id']: i for i, n in enumerate(nodes)}
    child_lists = [[] for _ in nodes]
    for i, parent in enumerate(structure['parent']):
        if parent >= 0:
            child_lists[parent].append(i)
    paths=[]
    roles={'app':['fn','arg'],'lam':['domain','body'],'forallE':['domain','body'],'letE':['type','value','body'],'mdata':['expr'],'proj':['struct']}
    for i, node in enumerate(nodes):
        assert node['kind'] == structure['kinds'][int(structure['kind'][i])], i
        assert [indexes[c] for c in node['children']] == child_lists[i], i
        parent=structure['parent'][i]
        expected=node['id'] if parent<0 else paths[parent]+'.'+roles[nodes[parent]['kind']][child_lists[parent].index(i)]
        assert expected==node['id'], i
        paths.append(expected)
    data = {
        'format': 'ProofAtlasTermPayload/1',
        'theorem': core['rootDeclaration']['name'],
        'source': {'coregirSha256': hashlib.sha256(raw).hexdigest(), 'artifactRun': args.artifact_run,
                   'method': 'Same-order payloads and paths from the original CoreGIR export; every constructor and child checked against the released graph.'},
        'scope': 'Elaborated type and value of crossing only. Not original tactic source, inferred type per node, or transitive dependency proof bodies. CoreGIR omits mdata key-value payloads.',
        'rootPaths': [nodes[i]['id'] for i in structure['roots']],
        'pathEncoding': 'Paths reconstructed from parent + ordered constructor fields; verified against every original node ID.',
        'payloads': [n['payload'] for n in nodes],
        'declarations': core['dependencyInfo']
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text('/* Aligned CoreGIR payloads, with provenance. */\nwindow.PROOF_ATLAS_TERMS='+json.dumps(data, ensure_ascii=False,separators=(',',':'))+';\n')
    print(json.dumps({'nodes': len(nodes), 'sha256': data['source']['coregirSha256'], 'bytes': args.output.stat().st_size}))

if __name__ == '__main__':
    main()
