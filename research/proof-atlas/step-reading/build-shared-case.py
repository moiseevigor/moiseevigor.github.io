"""Build the controlled shared Lean proof and export it through the project interner."""
import argparse
import os
from pathlib import Path
import subprocess
import tempfile

here = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--lean', default='lean')
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--tagged-depth', type=int, choices=range(19))
parser.add_argument('--separated-assumptions', action='store_true')
args = parser.parse_args()
if args.separated_assumptions and args.tagged_depth is not None:
    parser.error('--tagged-depth applies only to the shared case tree')
env = os.environ.copy()
env.pop('ATLAS_TAGGED_TREE_DEPTH', None)
if args.tagged_depth is not None:
    env['ATLAS_TAGGED_TREE_DEPTH'] = str(args.tagged_depth)
exporter = (here.parent / 'ExportLibrary.lean').read_text().split('def kind : ConstantInfo')[0]
source = exporter.replace('import SE2Conjugate\n', '') + '\nend AtlasLibrary\n'
with tempfile.TemporaryDirectory() as work:
    folder = Path(work)
    (folder / 'Stress.lean').write_text(source + (here / ('SeparatedAssumptions.lean' if args.separated_assumptions else 'SharedCaseStress.lean')).read_text())
    subprocess.run([args.lean, 'Stress.lean'], check=True, cwd=folder, timeout=180, env=env)
    args.output.write_bytes((folder / 'shared-case.json').read_bytes())
