"""Copy a bounded, source-revision-bound public evidence snapshot. No research run."""
import argparse
import csv
import hashlib
import subprocess
from pathlib import Path

REVISION = '3ae8c22bbd4bf73c68074e0cc44d63094c509e0e'
SOURCES = {
    'starbirth-e15.json': 'artifacts/e15/mir_bright.json',
    'starbirth-e27.json': 'artifacts/e27/incremental.json',
    'starbirth-e28.json': 'artifacts/e28/incremental.json',
    'starbirth-core-verification.json': 'artifacts/core_review_20261006/verification.json',
    'starbirth-n20-witness.json': 'artifacts/n20_prefit_gate_20261006/exact_witness.json',
    'starbirth-c6828-checkpoint.json': 'artifacts/c6828_source_association_20261008/terminal_checkpoint.json',
    'core-conclusion.md': 'docs/CORE_RESEARCH_CONCLUSION_20261006.md',
    'n20-results.md': 'docs/N20_PREFIT_GATE_RESULTS_20261006.md',
    'c6828-results.md': 'docs/C6828_SOURCE_ASSOCIATION_RESULTS_20261008.md',
}

def export(source, destination):
    revision = subprocess.check_output(
        ['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if revision != REVISION:
        raise RuntimeError('Research revision changed; review claims before exporting.')
    entries = []
    for public_name, source_path in SOURCES.items():
        data = (source / source_path).read_bytes()
        frozen = subprocess.check_output(
            ['git', '-C', str(source), 'show', REVISION + ':' + source_path])
        if frozen != data:
            raise RuntimeError('Source differs from committed snapshot: ' + source_path)
        entries.append((public_name, source_path, data))
    if sum(len(item[2]) for item in entries) > 1024 * 1024:
        raise RuntimeError('Compact evidence exceeded 1 MiB cap.')
    destination.mkdir(parents=True, exist_ok=True)
    with (destination / 'source-inventory.csv').open('w', newline='') as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(['public_file', 'source_path', 'bytes', 'sha256', 'source_revision'])
        for name, path, data in entries:
            (destination / name).write_bytes(data)
            writer.writerow([name, path, len(data), hashlib.sha256(data).hexdigest(), REVISION])
    print('Exported %d original files, %d bytes.' %
          (len(entries), sum(len(item[2]) for item in entries)))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    export(args.source, Path(__file__).resolve().parents[2] / 'public/data/starbirth')
