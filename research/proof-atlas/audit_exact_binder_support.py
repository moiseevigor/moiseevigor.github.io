#!/usr/bin/env python3
"""Independent exact free-de-Bruijn-support audit for released Lean ExprDAG packets.

The bit set at position j means that de Bruijn index j is free relative to
this subexpression root. It is *not* a kernel typing/inference certificate.
"""
import gzip
import json
from pathlib import Path

KINDS = ("bvar", "fvar", "mvar", "sort", "const", "app", "lam", "forallE",
         "letE", "lit", "mdata", "proj")
ARITIES = (0, 0, 0, 0, 0, 2, 2, 2, 3, 0, 1, 1)


def exact_support(data):
    tags = data["kind"]
    children = data["children"]
    payloads = data["payloads"]
    expected = data["neededScope"]
    n = len(tags)
    if data.get("serialization") != "ExprDAG/1" or tuple(data["kinds"]) != KINDS:
        raise ValueError("unexpected ExprDAG/1 schema")
    if len(children) != n or len(payloads) != n or len(expected) != n:
        raise ValueError("inconsistent node columns")
    masks = [0] * n
    for i, (tag, cs, p) in enumerate(zip(tags, children, payloads)):
        if type(tag) is not int or not 0 <= tag < len(KINDS):
            raise ValueError(f"bad constructor at {i}")
        if len(cs) != ARITIES[tag] or any(type(c) is not int or c < 0 or c >= i for c in cs):
            raise ValueError(f"invalid child/arity at {i}")
        k = KINDS[tag]
        if k == "bvar":
            j = p.get("index")
            if type(j) is not int or j < 0:
                raise ValueError(f"bad de Bruijn index at {i}")
            mask = 1 << j
        elif k == "app":
            mask = masks[cs[0]] | masks[cs[1]]
        elif k in ("lam", "forallE"):
            mask = masks[cs[0]] | (masks[cs[1]] >> 1)
        elif k == "letE":
            mask = masks[cs[0]] | masks[cs[1]] | (masks[cs[2]] >> 1)
        elif k in ("mdata", "proj"):
            mask = masks[cs[0]]
        else:
            # fvar/mvar are NOT closed elaboration terms: detect separately.
            mask = 0
        if type(expected[i]) is not int or expected[i] != mask.bit_length():
            raise ValueError(f"neededScope mismatch at {i}")
        masks[i] = mask
    if not data["roots"] or any(type(r) is not int or r < 0 or r >= n or masks[r] for r in data["roots"]):
        raise ValueError("missing, invalid or de-Bruijn-open root")
    return masks


def audit(root):
    totals = {}
    for edition in ("published-15", "working-26"):
        folder = root / "public/data/proof-atlas/library" / edition
        if not folder.is_dir():
            raise ValueError(f"missing edition {edition}")
        counts = {"declarations": 0, "nodes": 0, "sparse": 0, "closed_bvar": 0}
        for file in sorted(folder.glob("*.json.gz")):
            data = json.loads(gzip.decompress(file.read_bytes()))
            masks = exact_support(data)
            if data.get("source", {}).get("edition") != edition:
                raise ValueError(f"edition mismatch {file}")
            counts["declarations"] += 1
            counts["nodes"] += len(masks)
            counts["sparse"] += sum(bool(m) and m.bit_count() < m.bit_length() for m in masks)
            counts["closed_bvar"] += sum(m == 0 for m in masks)
        totals[edition] = counts
    return totals


def negative_controls():
    data = {"serialization": "ExprDAG/1", "kinds": list(KINDS),
            "kind": [3, 0, 6], "children": [[], [], [0, 1]],
            "payloads": [{"level": {"kind": "zero"}}, {"index": 0}, {}],
            "neededScope": [0, 1, 0], "roots": [2]}
    if exact_support(data) != [0, 1, 0]:
        raise ValueError("lambda discharge regression")
    for modification in ("scope", "domain", "child", "binder"):
        p = json.loads(json.dumps(data))
        if modification == "scope":
            p["neededScope"][2] = 1
        elif modification == "domain":
            p["children"][2] = [1, 0]
            p["neededScope"][2] = 1
        elif modification == "child":
            p["children"][2] = [0, 2]
        else:
            p["payloads"][1]["index"] = 3
        try:
            exact_support(p)
        except ValueError:
            continue
        raise ValueError(f"negative control accepted: {modification}")


if __name__ == "__main__":
    negative_controls()
    result = audit(Path(__file__).resolve().parents[2])
    print(json.dumps({"status": "PASS", "scope": "syntax-only; no kernel judgment",
                      "results": result}, indent=2))
