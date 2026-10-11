#!/usr/bin/env python3
"""Validate only the published, anonymized Proof Atlas graph projection.

This checks shape and cross-reference integrity, NOT Lean kernel correctness.
Run from any directory: python3 research/proof-atlas/verify_public_data.py
"""
from __future__ import annotations
from collections import Counter
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/data/proof-atlas/crossing-structure.js"


def main() -> None:
    raw = SOURCE.read_text(encoding="utf-8")
    marker = "window.PROOF_ATLAS_DATA="
    assert raw.count(marker) == 1, "missing or repeated data assignment"
    data = json.loads(raw.split(marker, 1)[1].strip().removesuffix(";"))
    parent = data["parent"]
    kinds = data["kinds"]
    kind_codes = data["kind"]
    subtree = data["size"]
    roots = data["roots"]
    n = len(parent)
    assert n == 7288, n
    assert len(kind_codes) == len(subtree) == n
    assert len(roots) == 2 and all(parent[r] == -1 for r in roots)
    assert sum(p == -1 for p in parent) == 2
    assert all(p == -1 or 0 <= p < i for i, p in enumerate(parent)), "invalid parent ordering"
    assert all(0 <= int(ch) < len(kinds) for ch in kind_codes)
    assert sum(p >= 0 for p in parent) == 7286

    recomputed_sizes = [1] * n
    depths = [0] * n
    for i, p in enumerate(parent):
        if p != -1:
            depths[i] = depths[p] + 1
    for i in range(n - 1, -1, -1):
        p = parent[i]
        if p != -1:
            recomputed_sizes[p] += recomputed_sizes[i]
    assert recomputed_sizes == subtree
    assert max(depths) == 49
    assert sum(subtree[r] for r in roots) == n

    binders = data["binder"]
    assert len(binders) == 431
    for a, b in binders:
        assert 0 <= a < n and 0 <= b < n
        assert kinds[int(kind_codes[a])] == "bvar"
        assert kinds[int(kind_codes[b])] in {"forallE", "lam", "letE"}
        assert b < a, (a, b)

    deps = data["deps"]
    assert len(deps) == 42
    assert sum(d["count"] for d in deps) == 2892
    uses = [u for d in deps for u in d["uses"]]
    assert len(uses) == len(set(uses)), "one constant occurrence assigned more than once"
    assert len(uses) == 2892
    for d in deps:
        assert d["count"] == len(d["uses"])
        assert all(0 <= i < n and kinds[int(kind_codes[i])] == "const" for i in d["uses"])

    assert data["stats"]["nodes"] == n
    assert data["stats"]["structuralEdges"] == 7286
    assert data["stats"]["binderEdges"] == len(binders)
    assert data["stats"]["referenceEdges"] == len(uses)

    print("Proof Atlas public graph: topology OK")
    print(json.dumps({
        "expressions": n,
        "roots": roots,
        "structural_edges": sum(p >= 0 for p in parent),
        "binder_links": len(binders),
        "constant_uses": len(uses),
        "distinct_dependencies": len(deps),
        "max_depth": max(depths),
        "expression_kind_counts": dict(Counter(kinds[int(ch)] for ch in kind_codes)),
    }, indent=2))


if __name__ == "__main__":
    main()
