"""Fresh core-only native controls for lexical support and exact reference counts."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
from build_recursion_examples import run_checked


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('lean', nargs='?', default='lean')
    parser.add_argument('--reserve-gib', type=int, default=30)
    args = parser.parse_args()
    base = Path(__file__).parent
    folder = Path(tempfile.mkdtemp(prefix='atlas-binding-controls-'))
    output = folder / 'controls.json'
    source = (base / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', '')
    source += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
    source += (base / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    source += '\n' + (base / 'BindingUsesOracle.lean').read_text()
    source += '\n' + (base / 'BindingUsesControls.lean').read_text()
    source += '\n#atlas_binding_controls ' + json.dumps(str(output)) + '\n'
    entry = folder / 'Controls.lean'
    entry.write_text(source)
    run_checked([args.lean, str(entry)], folder, 'native', reserve=args.reserve_gib)
    subprocess.run(['node', 'scripts/test-proof-atlas-binding-uses.cjs', str(output)], check=True)


if __name__ == '__main__':
    main()
