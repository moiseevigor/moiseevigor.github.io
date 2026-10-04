#!/usr/bin/env python3
"""P2 (part 2) - external validation: SR growth-vector null detection vs the standard
eigenvalue null-finder, on the ABC field.

docs/PROGRAM.md Phase 2. The program's external check: two independent computations on
the same divergence-free field B = (cos y, cos z, cos x).

  * Standard finder (src/nullfield.py): Newton's method locates the nulls; the
    eigenvalues of grad B classify each (radial / spiral, positive / negative).
  * SR detector (src/mfield3d.py): the growth vector / homogeneous dimension Q, which
    is 5 where B != 0 and jumps to 6 at a (linear, k=1) null.

VALIDATION QUESTIONS
  (A) Location + order: does Q = 6 occur exactly at the finder's nulls, and Q = 5 at
      generic points?  -> agreement is the pass condition.
  (B) Type: does Q distinguish radial from spiral?  -> NO, honestly reported: every
      linear null is k=1, so Q=6 for all. The type lives in the eigenvalues (the
      standard method's domain). Whether the MODULI carry the type is the open question.

Usage: run_p2_nulls.py [--quick]
Results -> artifacts/p2_nulls_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import nullfield as nf  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(0.02, 0.20, 7)
NP = 3500 if QUICK else 5000


def Q_at(struct, xyz, rng, n=NP):
    _, Q = struct.weights_Q(list(xyz) + [0.0], RADII, n, rng)
    return Q


def main():
    rng = np.random.default_rng(0)
    res = {"field": "ABC B=(cos y, cos z, cos x)", "radii": RADII.tolist()}
    struct = nf.abc_structure()

    # ---- standard finder: locate + classify the nulls
    print("== standard finder: Newton on B=0, classify by grad B eigenvalues ==")
    g = np.linspace(0.4, 2 * np.pi - 0.4, 4)
    seeds = [(a, b, c) for a in g for b in g for c in g]
    nulls = nf.find_nulls(seeds)
    print(f"  found {len(nulls)} nulls in [0,2pi)^3 (expected 8)")
    cls = [nf.classify(p) for p in nulls]
    for p, c in zip(nulls, cls):
        evs = ", ".join(f"{e.real:+.2f}{e.imag:+.2f}i" for e in c["eigs"])
        print(f"    ({p[0]:.3f},{p[1]:.3f},{p[2]:.3f})  {c['type']:>6}-{c['spine_sign']}"
              f"   eigs [{evs}]")
    subclass = [f"{c['type']}-{c['spine_sign']}" for c in cls]
    classes = sorted(set(subclass))
    res["n_nulls"] = len(nulls)
    res["subclasses_present"] = classes
    res["nulls"] = [{"xyz": p.tolist(), "type": c["type"], "spine_sign": c["spine_sign"]}
                    for p, c in zip(nulls, cls)]
    assert len(nulls) == 8, "ABC field should have 8 nulls in the box"
    assert len(classes) >= 2, "expected >= 2 standard sub-classes (the eigenvalue finder resolves them)"
    from collections import Counter
    print(f"  -> {len(nulls)} nulls; standard sub-classes: {dict(Counter(subclass))}")

    # ---- SR detector: Q at each null (expect 6) and at generic points (expect 5)
    print("\n== SR detector: Q at each null vs generic points ==")
    q_null = []
    for p, c in zip(nulls, cls):
        Q = Q_at(struct, p, np.random.default_rng(100 + len(q_null)))
        q_null.append(Q)
        print(f"    null ({p[0]:.2f},{p[1]:.2f},{p[2]:.2f}) [{c['type']}]:  Q = {Q}")
    rng_gen = np.random.default_rng(7)
    q_gen = []
    for _ in range(6 if QUICK else 10):
        pt = rng_gen.uniform(0, 2 * np.pi, 3)
        if np.linalg.norm(nf.B(pt[None, :])[0]) > 0.5:          # safely away from nulls
            q_gen.append(Q_at(struct, pt, rng_gen))
    print(f"  generic points (B!=0): Q = {q_gen}")
    res["Q_at_nulls"] = q_null
    res["Q_generic"] = q_gen

    # ---- validation
    print("\n== validation ==")
    detected = sum(q == 6 for q in q_null)
    gen_ok = sum(q == 5 for q in q_gen)
    print(f"  (A) location+order: Q=6 at {detected}/{len(q_null)} nulls; "
          f"Q=5 at {gen_ok}/{len(q_gen)} generic points")
    assert detected == len(q_null), "SR detector missed a null (Q != 6)"
    assert gen_ok == len(q_gen), "SR gave Q!=5 at a generic point"
    print("      -> SR growth-vector detection AGREES with the standard finder on"
          " location and order.")

    by_class = {}
    for q, sc in zip(q_null, subclass):
        by_class.setdefault(sc, []).append(q)
    print(f"  (B) type: Q by standard sub-class = "
          f"{{ {', '.join(f'{k}:{v}' for k,v in by_class.items())} }}")
    q_sets = [set(v) for v in by_class.values()]
    refines = any(a != b for a in q_sets for b in q_sets)
    print("      -> Q is 6 for EVERY sub-class (all nulls are linear, k=1). The growth"
          " vector does NOT resolve the type the eigenvalue finder assigns.")
    res["refines_type"] = bool(refines)
    print(f"      growth vector refines type: {refines}  "
          f"(open: do the moduli distinguish spiral-A from spiral-B?)")

    out = ROOT / "artifacts" / "p2_nulls_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2, default=str) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
