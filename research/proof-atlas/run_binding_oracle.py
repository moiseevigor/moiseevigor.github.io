"""Compare native lexical reference counts against an exact compiled packet set."""
import argparse
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
    paths, environment = verify_dependencies(args.snapshot)
    assert evaluation['environment'] == environment
    modules = [r for r in evaluation['results'] if r['compiledModuleSha256']]
    for r in modules:
        source = folder / Path(*r['module'].split('.')).with_suffix('.lean')
        assert sha(source.read_bytes()) == r['sourceSha256']
        assert sha(source.with_suffix('.olean').read_bytes()) == r['compiledModuleSha256']
    base = Path(__file__).parent
    tools = (base / 'ExportLibrary.lean').read_text().replace(
        'import SE2Conjugate', '\n'.join('import ' + r['module'] for r in modules))
    tools += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
    tools += (base / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    tools += '\n' + (base / 'BindingUsesOracle.lean').read_text()
    output = folder / 'binding-oracle.json'
    source = folder / 'AtlasBindingOracle.lean'
    assert not output.exists() and not source.exists()
    tools += '\n#atlas_binding_uses ' + json.dumps(str(folder / 'type-requests-02.json')) + ' => ' + json.dumps(str(output)) + '\n'
    source.write_text(tools)
    result = run_lean(args.lean, folder, paths, source, 'binding-oracle', timeout=240)
    assert result['exitCode'] == 0 and not result['stopReason'], 'Native binding oracle failed'
    records = json.loads(output.read_text())
    print(json.dumps({'status': 'PASS', 'declarations': len(records),
                      'bindings': sum(len(r['bindings']) for r in records),
                      'counted': sum(b['count']['status'] == 'counted' for r in records for b in r['bindings']),
                      'zeroLetReferences': sum(b['kind'] == 'letE' and not b['hasReference'] for r in records for b in r['bindings'])}))


if __name__ == '__main__':
    main()
