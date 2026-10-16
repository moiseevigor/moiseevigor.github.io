"""Reuse only the existing own synthetic fixture to extract lambda/type records."""
from pathlib import Path
import argparse, json, os, hashlib, subprocess
from build_recursion_examples import run_checked

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[1]
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder', type=Path, required=True)
    parser.add_argument('--lean', default=os.environ.get('ATLAS_LEAN', 'lean'))
    args = parser.parse_args()
    folder = args.folder.resolve()
    provenance = json.loads((folder / 'result.json').read_text())
    source = folder / 'ReferenceFixture.lean'
    compiled = source.with_suffix('.olean')
    assert sha(source) == provenance['sourceSha256']
    assert sha(compiled) == provenance['compiledModuleSha256']
    compiler = subprocess.check_output([args.lean, '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    queries = json.loads((folder / 'requests.json').read_text())
    for query in queries:
        data = json.loads(Path(query['packetFile']).read_text())
        assert sha(Path(query['packetFile'])) == query['source']['indexSha256']
        # Query both the whole function and the existing exact primitive paths.
        routes = [dict(root=1, slots=[])] + query['routes']
        seen = set()
        query['routes'] = []
        for route in routes:
            key = json.dumps(route, sort_keys=True)
            if key not in seen:
                seen.add(key)
                query['routes'].append(route)
        covered = set()

        def cover_prefix(route):
            node = data['roots'][route['root']]
            for slot in route['slots']:
                node = data['children'][node][slot]
            while data['kind'][node] == 6:
                covered.add(node)
                node = data['children'][node][1]

        for route in query['routes']:
            cover_prefix(route)
        # Prune shared arithmetic regions before finding a representative for
        # every remaining stored lambda. Value routes take precedence over type
        # routes; a representative does not claim all lexical-context coverage.
        has_lambda = []
        for node, kind in enumerate(data['kind']):
            has_lambda.append(kind == 6 or any(has_lambda[c] for c in data['children'][node]))
        visited = set()
        for root in [1, 0]:
            pending = [(data['roots'][root], [])]
            while pending:
                node, slots = pending.pop()
                if node in visited or not has_lambda[node]:
                    continue
                visited.add(node)
                if data['kind'][node] == 6 and node not in covered:
                    route = dict(root=root, slots=slots)
                    key = json.dumps(route, sort_keys=True)
                    if key not in seen:
                        seen.add(key)
                        query['routes'].append(route)
                    cover_prefix(route)
                for slot in reversed(range(len(data['children'][node]))):
                    pending.append((data['children'][node][slot], slots + [slot]))
        assert covered == {i for i, kind in enumerate(data['kind']) if kind == 6}
        assert len(query['routes']) <= 512
    request = folder / 'introduction-requests.json'
    request.write_text(json.dumps(queries, separators=(',', ':')))
    body = (folder / 'References.lean').read_text().split('\n#atlas_source_references ')[0]
    context = (BASE / 'context-transport/ExportContextTransport.lean').read_text().replace('import ExportSourceReferences', '')
    introduction = (BASE / 'context-transport/ExportIntroductionTransport.lean').read_text().replace('import ExportContextTransport', '')
    entry = folder / 'Introductions.lean'
    entry.write_text(body + context + introduction + '\n#atlas_introduction_transport '
                     + json.dumps(str(request)) + ' => ' + json.dumps(str(folder / 'introductions.json')) + '\n')
    resources = run_checked([args.lean, str(entry)], folder, 'introductions',
                            dict(os.environ, LEAN_PATH=str(folder)), 30)
    assert sha(source) == provenance['sourceSha256'] and sha(compiled) == provenance['compiledModuleSha256']
    result = dict(status='PASS', compiler=compiler, sourceSha256=sha(source),
                  compiledModuleSha256=sha(compiled), producerSha256=sha(entry),
                  requestSha256=sha(request), outputSha256=sha(folder / 'introductions.json'),
                  resources=resources)
    (folder / 'introduction-result.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
