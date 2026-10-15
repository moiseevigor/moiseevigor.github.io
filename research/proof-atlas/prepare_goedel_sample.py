"""Recover the exact predetermined sample from the pinned public Parquet file.

Requires pyarrow 19.0.1. Output contains original scripts and must stay outside
the website repository. The public selection manifest contains identities and
hashes, never the original proof text.
"""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--parquet', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    target = args.output.resolve()
    assert root not in target.parents and target != root, 'Keep original scripts private'
    assert not target.exists(), 'Do not overwrite sample evidence'
    manifest = json.loads(Path(__file__).with_name('goedel-selection.json').read_text())
    assert args.parquet.stat().st_size <= 32 * 1024**2
    assert hashlib.sha256(args.parquet.read_bytes()).hexdigest() == manifest['parquetSha256']
    import pyarrow.parquet as pq
    table = pq.read_table(args.parquet, columns=['problem_id', 'full_proof'])
    assert table.num_rows == manifest['population']
    rows = table.to_pylist()
    assert len({r['problem_id'] for r in rows}) == len(rows)
    for index, row in enumerate(rows):
        row.update(row=index, bytes=len(row['full_proof'].encode()),
                   sourceSha256=hashlib.sha256(row['full_proof'].encode()).hexdigest())
    seeded = sorted(rows, key=lambda r: hashlib.sha256(
        ('ProofAtlasGoedel/1:' + r['problem_id']).encode()).hexdigest())[:16]
    longest = sorted(rows, key=lambda r: (-r['bytes'], r['problem_id']))[:8]
    selected = list({r['row']: r for r in seeded + longest}.values())
    fields = ['row', 'problem_id', 'bytes', 'sourceSha256']
    assert [{k: r[k] for k in fields} for r in selected] == [
        {k: r[k] for k in fields} for r in manifest['entries']], 'Selection mismatch'
    target.write_text(json.dumps(selected, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'population': len(rows), 'selected': len(selected),
                      'revision': manifest['revision'], 'originalScriptsKeptPrivate': True}))


if __name__ == '__main__':
    main()
