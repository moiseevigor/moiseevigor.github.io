"""Export the complete owned declarations from the successfully compiled sample.

Outputs remain private. Publication is a separate reviewed step. Source and
compiled-module hashes are rechecked before and after native extraction.
"""
import argparse
from collections import Counter
import gzip
import json
from pathlib import Path
from evaluate_goedel import sha, run_lean, verify_dependencies


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evaluation-dir', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--lean', type=Path, required=True)
    args = parser.parse_args()
    folder = args.evaluation_dir.resolve()
    evaluation = json.loads((folder / 'evaluation.json').read_text())
    selection = json.loads(Path(__file__).with_name('goedel-selection.json').read_text())
    paths, environment = verify_dependencies(args.snapshot)
    assert evaluation['environment'] == environment
    assert evaluation['driverSha256'] == sha(Path(__file__).with_name('evaluate_goedel.py').read_bytes())
    successful = [r for r in evaluation['results'] if r['compiledModuleSha256']]
    assert successful, 'No successfully compiled source modules'

    def check_modules():
        for row in successful:
            source = folder / Path(*row['module'].split('.')).with_suffix('.lean')
            assert sha(source.read_bytes()) == row['sourceSha256']
            assert sha(source.with_suffix('.olean').read_bytes()) == row['compiledModuleSha256']

    check_modules()
    output = folder / 'packets'
    assert not output.exists(), 'Do not overwrite native export evidence'
    imports = '\n'.join('import ' + r['module'] for r in successful)
    exporter = Path(__file__).with_name('ExportLibrary.lean').read_text()
    exporter = exporter.replace('import SE2Conjugate', imports).replace(
        'startsWith "SE2Conjugate."', 'startsWith "ProofAtlasAI.Goedel."')
    exporter += '\nset_option pp.maxSteps 2000\n#atlas_library ' + json.dumps(str(output)) + '\n'
    source = folder / 'AtlasAIExport.lean'
    assert not source.exists()
    source.write_text(exporter)
    resources = run_lean(args.lean, folder, paths, source, 'export', timeout=240)
    assert resources['exitCode'] == 0 and not resources['stopReason'], 'Native export failed'
    check_modules()
    inventory = json.loads((output / 'inventory.json').read_text())
    by_module = {r['module']: r for r in successful}
    names = {r['name'] for r in inventory}
    assert set(r['module'] for r in inventory) == set(by_module), 'Owned-module denominator'
    for r in successful:
        assert any(d['name'] == r['problem_id'] and d['module'] == r['module'] for d in inventory)
    projected = folder / 'projection'
    projected.mkdir(exist_ok=False)
    records, counts, modules, total_nodes = [], Counter(), Counter(), 0
    kinds = ['bvar', 'fvar', 'mvar', 'sort', 'const', 'app', 'lam', 'forallE', 'letE', 'lit', 'mdata', 'proj']
    for original in inventory:
        data = json.loads((output / original['file']).read_text())
        record = dict(data['declaration'])
        assert record['kernelCheck'] == 'PASS' and not record['unsafe'] and not record['partial']
        assert set(record['axioms']) <= {'propext', 'Classical.choice', 'Quot.sound'}, 'Unsupported axiom'
        row = by_module[record['module']]
        record.pop('sourceRange', None)
        record.update(sourceSha256=row['sourceSha256'], articleAnchor=None,
                      proofOccurrences=str(sum(int(data['expanded'][r]) for r in data['roots'][1:])),
                      origin={'kind': 'publisher-attributed-ai-source', 'dataset': selection['dataset'],
                              'revision': selection['revision'], 'row': row['row'], 'problemId': row['problem_id'],
                              'sourceSha256': row['sourceSha256']})
        weights = [0] * len(data['kind'])
        for r in data['roots']:
            weights[r] += 1
        for i in range(len(weights)-1, -1, -1):
            for c in data['children'][i]:
                weights[c] += weights[i]
        dependencies = Counter()
        for i, kind in enumerate(data['kind']):
            counts[kinds[kind]] += weights[i]
            if kind == 4:
                dependencies[data['payloads'][i]['name']] += weights[i]
        record['references'] = sorted(dependencies)
        data['declaration'] = record
        data['dependencies'] = [{'name': n, 'count': str(c), 'local': n in names}
                                for n, c in sorted(dependencies.items())]
        raw = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()
        assert not any(s in raw for s in [b'/Users/', b'/private/', b'/tmp/']), 'Private path in compiled payload'
        name = sha(record['name'].encode())[:20] + '.json.gz'
        compressed = gzip.compress(raw, mtime=0)
        (projected / name).write_bytes(compressed)
        file = '/public/data/proof-atlas/goedel-sample/' + name
        records.append({**record, 'file': file, 'indexFile': file, 'sha256': sha(raw),
                        'indexSha256': sha(raw), 'gzipSha256': sha(compressed)})
        modules[record['module'].split('.')[-1]] += 1
        total_nodes += len(data['kind'])
    edition = {'id': 'goedel-sample-4331', 'label': 'Goedel source sample · Lean 4.33.1',
               'modulePrefix': 'ProofAtlasAI.Goedel.',
               'modules': {m: {'declarations': n} for m, n in sorted(modules.items())},
               'counts': {'modules': len(modules), 'declarations': len(records),
                          'theorems': sum(r['kind'] == 'theorem' for r in records),
                          'bodies': sum(r['bodyAvailable'] for r in records), 'uniqueNodes': total_nodes,
                          'constructors': {k: str(v) for k, v in counts.items()},
                          'occurrences': str(sum(counts.values()))}, 'declarations': records}
    provenance = {k: selection[k] for k in ['dataset', 'revision', 'parquetSha256', 'population',
                                           'method', 'provenance', 'readmeUrl', 'readmeSha256',
                                           'license', 'licenseUrl', 'licenseSha256']}
    provenance.update(kind='publisher-attributed-ai-source', attempted=24, compiled=len(successful),
                      exportedDeclarations=len(records), compiler=evaluation['compiler'],
                      environment=environment, exporterSha256=sha(exporter.encode()),
                      bodyTypeConversion='native-kernel-typed-identity/1',
                      outcomes=[{k: r[k] for k in ['row', 'problem_id', 'sourceSha256']} |
                                {'status': 'compiled' if r['compiledModuleSha256'] else
                                 'bounded-out' if r['stopReason'] else 'compiler-error'}
                                for r in evaluation['results']],
                      scope='Unmodified publisher-attributed AI source scripts recompiled under the stated environment. Original generation and original-environment equivalence are not independently reproduced. This predetermined sample is not a population-level model success-rate estimate.')
    (folder / 'edition.json').write_text(json.dumps(edition, ensure_ascii=False, separators=(',', ':')) + '\n')
    (folder / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(json.dumps({'status': 'EXPORTED', 'modules': len(successful), 'declarations': len(records),
                      'nodes': total_nodes, 'occurrences': str(sum(counts.values())),
                      'largest': sorted([{'name': r['name'], 'nodes': r['uniqueNodes'],
                                          'occurrences': r['occurrences']} for r in records],
                                         key=lambda r: r['nodes'], reverse=True)[:4]}))


if __name__ == '__main__':
    main()
