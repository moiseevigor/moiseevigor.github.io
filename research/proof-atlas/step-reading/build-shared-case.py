"""Build the controlled shared Lean proof and export it through the project interner."""
import argparse
from pathlib import Path
import subprocess
import tempfile

here = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--lean', default='lean')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
exporter = (here.parent / 'ExportLibrary.lean').read_text().split('def kind : ConstantInfo')[0]
source = exporter.replace('import SE2Conjugate\n', '') + '\nend AtlasLibrary\n'
with tempfile.TemporaryDirectory() as work:
    folder = Path(work)
    (folder / 'Stress.lean').write_text(source + (here / 'SharedCaseStress.lean').read_text())
    subprocess.run([args.lean, 'Stress.lean'], check=True, cwd=folder, timeout=60)
    args.output.write_bytes((folder / 'shared-case.json').read_bytes())
