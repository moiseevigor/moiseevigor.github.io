"""Query exact type/argument contexts along each AI proof's outer binding prefix.

Only the stated routes are queried. Internal descendants do not inherit types.
The exact source DAG and module hashes are checked against the native environment.
"""
import argparse
import gzip
import json
from pathlib import Path
from evaluate_goedel import sha, run_lean, verify_dependencies


def prefix_routes(data):
    routes = [{'root': 0, 'slots': []}, {'root': 1, 'slots': []}]
    node, slots, count = data['roots'][1], [], 0
    while data['kind'][node] in [6, 8] and count < 64:
        kind = data['kind'][node]
        if kind == 8:
            routes.append({'root': 1, 'slots': slots + [1]})  # The value is outside its own binder.
        field = 1 if kind == 6 else 2
        node = data['children'][node][field]
        slots = slots + [field]
        routes.append({'root': 1, 'slots': slots})
        count += 1
    return routes, data['kind'][node] in [6, 8]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evaluation-dir', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--requests', type=Path)
    args = parser.parse_args()
    folder = args.evaluation_dir.resolve()
    edition = json.loads((folder / 'edition.json').read_text())
    evaluation = json.loads((folder / 'evaluation.json').read_text())
    paths, environment = verify_dependencies(args.snapshot)
    assert evaluation['environment'] == environment
    successful = [r for r in evaluation['results'] if r['compiledModuleSha256']]
    sources = {r['module']: {'sourceSha256': r['sourceSha256'],
                            'compiledModuleSha256': r['compiledModuleSha256']} for r in successful}

    def check_modules():
        for module, hashes in sources.items():
            source = folder / Path(*module.split('.')).with_suffix('.lean')
            assert sha(source.read_bytes()) == hashes['sourceSha256']
            assert sha(source.with_suffix('.olean').read_bytes()) == hashes['compiledModuleSha256']

    check_modules()
    phase = '02' if args.requests else '01'
    target = folder / ('native-types-' + phase + '.json')
    request_file = args.requests.resolve() if args.requests else folder / 'type-requests-01.json'
    packet_dir = folder / 'type-packets'
    assert not target.exists()
    if args.requests:
        assert request_file.is_relative_to(folder) and request_file.exists()
        queries = json.loads(request_file.read_text())
        assert len(queries) == len(edition['declarations'])
        for query in queries:
            record = next(r for r in edition['declarations'] if r['name'] == query['source']['name'])
            assert query['source']['edition'] == edition['id']
            assert query['source']['indexSha256'] == record['indexSha256']
            assert query['source']['sourceSha256'] == record['sourceSha256']
            assert sha(Path(query['packetFile']).read_bytes()) == record['indexSha256']
            assert len(query['routes']) <= 512
    else:
        assert not request_file.exists() and not packet_dir.exists()
        packet_dir.mkdir()
    if not args.requests:
        queries = []
    limited = []
    for record in edition['declarations']:
        raw = gzip.decompress((folder / 'projection' / Path(record['file']).name).read_bytes())
        assert sha(raw) == record['indexSha256']
        data = json.loads(raw)
        packet = packet_dir / (sha(record['name'].encode())[:20] + '.json')
        if not args.requests:
            packet.write_bytes(raw)
        routes, truncated = prefix_routes(data)
        if truncated:
            limited.append(record['name'])
        if not args.requests:
            queries.append({'packetFile': str(packet),
                            'source': {'edition': edition['id'], 'name': record['name'],
                                       'indexSha256': record['indexSha256'], 'sourceSha256': record['sourceSha256']},
                            'routes': routes})
    if not args.requests:
        request_file.write_text(json.dumps(queries, separators=(',', ':')) + '\n')
    imports = '\n'.join('import ' + r['module'] for r in successful)
    base = Path(__file__).parent
    tools = (base / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', imports)
    tools += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
    tools += (base / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    tools += '\n#atlas_occurrence_types ' + json.dumps(str(request_file)) + ' => ' + json.dumps(str(target)) + '\n'
    source = folder / ('AtlasAITypes' + phase + '.lean')
    assert not source.exists()
    source.write_text(tools)
    result = run_lean(args.lean, folder, paths, source, 'native-types-' + phase, timeout=240)
    assert result['exitCode'] == 0 and not result['stopReason'], 'Native query stage failed'
    check_modules()
    native = json.loads(target.read_text())
    assert len(native) == len(edition['declarations'])
    for record in native:
        record['sourceModuleHashVerified'] = True
        record['environment'] = {**environment, 'kind': 'pinned-mathlib-source-recompile/1',
                                 'compiler': evaluation['compiler'], 'sourceModules': sources,
                                 'dataset': evaluation['publisher'], 'datasetRevision': evaluation['revision']}
    target.write_text(json.dumps(native, separators=(',', ':')) + '\n')
    coverage = {'format': 'ProofAtlasGoedelTypeCoverage/1',
                'strategy': 'Statement/body roots, consecutive outer lambdas and lets, their continuation, and each outer let value; at most 64 bindings per proof. Phase 02 also queries exact source lambdas of native-checked minor premises.',
                'declarations': len(native), 'queries': sum(len(r['entries']) for r in native),
                'checked': sum(e['status'] == 'checked' for r in native for e in r['entries']),
                'prefixBoundReached': limited, 'generatorSha256': sha(tools.encode()),
                'scope': 'Exact queried routes and their recorded observations. Internal descendants have no invented type judgments.'}
    (folder / 'type-coverage.json').write_text(json.dumps(coverage, indent=2) + '\n')
    print(json.dumps(coverage))


if __name__ == '__main__':
    main()
