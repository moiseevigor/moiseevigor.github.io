"""Query each stored let once at an exact representative occurrence in the pinned AI sample."""
import argparse
import gzip
import json
from pathlib import Path
from evaluate_goedel import sha, run_lean, verify_dependencies


def let_routes(data):
    parents = {n: (None, root) for root, n in enumerate(data['roots'])}
    queue = list(data['roots'])
    for node in queue:
        for slot, child in enumerate(data['children'][node]):
            if child not in parents:
                parents[child] = (node, slot)
                queue.append(child)
    routes = []
    for node, kind in enumerate(data['kind']):
        if kind != 8:
            continue
        slots, at = [], node
        while parents[at][0] is not None:
            at, slot = parents[at]
            slots.append(slot)
        routes.append({'root': parents[at][1], 'slots': list(reversed(slots))})
    return routes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evaluation-dir', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--tag', default='01')
    args = parser.parse_args()
    assert args.tag.isalnum() and len(args.tag) <= 16
    folder = args.evaluation_dir.resolve()
    edition = json.loads((folder / 'edition.json').read_text())
    evaluation = json.loads((folder / 'evaluation.json').read_text())
    paths, environment = verify_dependencies(args.snapshot)
    assert evaluation['environment'] == environment
    success = [r for r in evaluation['results'] if r['compiledModuleSha256']]

    def check_modules():
        for row in success:
            source = folder / Path(*row['module'].split('.')).with_suffix('.lean')
            assert sha(source.read_bytes()) == row['sourceSha256']
            assert sha(source.with_suffix('.olean').read_bytes()) == row['compiledModuleSha256']

    check_modules()
    target, requests = folder / ('native-lets-' + args.tag + '.json'), folder / ('let-requests-' + args.tag + '.json')
    assert not target.exists() and not requests.exists()
    queries = []
    for record in edition['declarations']:
        packet = folder / 'type-packets' / (sha(record['name'].encode())[:20] + '.json')
        assert sha(packet.read_bytes()) == record['indexSha256']
        data = json.loads(packet.read_text())
        routes = let_routes(data)
        if routes:
            queries.append({'packetFile': str(packet), 'source': {'edition': edition['id'], 'name': record['name'],
                            'indexSha256': record['indexSha256'], 'sourceSha256': record['sourceSha256']}, 'routes': routes})
    assert len(queries) == 7 and sum(len(q['routes']) for q in queries) == 48
    requests.write_text(json.dumps(queries) + '\n')
    base = Path(__file__).parent
    imports = '\n'.join('import ' + r['module'] for r in success)
    tools = (base / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', imports)
    tools += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
    tools += (base / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    tools += '\n' + (base / 'ExportLetReduction.lean').read_text().replace('import ExportOccurrenceTypes', '')
    tools += '\n#atlas_let_reductions ' + json.dumps(str(requests)) + ' => ' + json.dumps(str(target)) + '\n'
    entry = folder / ('AtlasAILets' + args.tag + '.lean')
    assert not entry.exists()
    entry.write_text(tools)
    result = run_lean(args.lean, folder, paths, entry, 'native-lets-' + args.tag, timeout=240)
    assert result['exitCode'] == 0 and not result['stopReason'], 'Native let query failed'
    check_modules()
    native = json.loads(target.read_text())
    env = json.loads((folder / 'native-types-02.json').read_text())[0]['environment']
    for record in native:
        record['sourceModuleHashVerified'] = True
        record['environment'] = env
    target.write_text(json.dumps(native, separators=(',', ':')) + '\n')
    print(json.dumps({'declarations': len(native), 'queried': sum(len(r['entries']) for r in native),
                      'checked': sum(e['status'] == 'checked' for r in native for e in r['entries']),
                      'generatorSha256': sha(tools.encode())}))


if __name__ == '__main__':
    main()
