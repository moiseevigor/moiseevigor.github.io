#!/usr/bin/env python3
"""E9 - the unifying law: Q = k + 4 for a curvature vanishing to order k (2D).

Phase 0 of docs/PROGRAM-preferred-directions.md. E8 established the magnetic contact
structure and saw Q=4 (uniform B) and Q=5 (a simple null, B ~ x). If those are two
points on one law rather than two anecdotes, then a curvature vanishing to order k must
give a flux coordinate of weight k+2, hence

    Q = 1 + 1 + (k+2) = k + 4.

Mechanism: with B ~ x^k, the flux swept by a loop of size L is
    Phi ~ integral of B dA ~ L^k * L^2 = L^(k+2),
so holonomy costs path length  L ~ Phi^(1/(k+2)).  Physically: near a curvature zero of
order k, acquiring flux Phi requires path length Phi^(1/(k+2)) -- the Ball-Box theorem
read as a statement about how expensive geometric phase is.

KILL CRITERION for the whole program: if Q != k + 4, the unifying law is false and the
magnetic result is an isolated anecdote.

Usage: run_e9.py
Results -> artifacts/e9_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import magnetic as magf  # noqa: E402
import growth  # noqa: E402

RADII = np.geomspace(0.03, 0.30, 7)
NP = 4000


def main():
    rng = np.random.default_rng(0)
    res = {"radii": RADII.tolist(), "law": "Q = k + 4 (2D)"}
    print("== E9: curvature vanishing to order k  =>  Q = k + 4 ? ==\n")
    print(f"  {'k':>2} {'B':>8} {'weights (measured)':<26}{'w_flux':>8}{'Q':>4}"
          f"{'Q pred':>8}   holonomy cost")
    rows = {}
    ok = True
    for k in [0, 1, 2, 3]:
        f = magf.power_law_field(k)
        reach = f.reach([0.0, 0.0, 0.0], RADII, NP, rng)
        # allow weights above the default cap of 4 (k=3 predicts weight 5)
        w = growth.estimate_weights(reach, RADII, w_max=8.0)
        Q = int(np.rint(w).sum())
        w_flux = float(w[2])
        Qpred = k + 4
        ok &= (Q == Qpred)
        ws = "(" + ",".join(f"{x:.2f}" for x in w) + ")"
        print(f"  {k:>2} {'x^'+str(k):>8} {ws:<26}{w_flux:>8.2f}{Q:>4}{Qpred:>8}"
              f"   L ~ Phi^(1/{k+2})")
        rows[str(k)] = {"weights": w.tolist(), "w_flux": w_flux, "Q": Q, "Q_pred": Qpred}
    res["by_order"] = rows

    # the flux weight should be exactly k+2: fit w_flux vs k
    ks = np.array([0, 1, 2, 3], dtype=float)
    wf = np.array([rows[str(int(k))]["w_flux"] for k in ks])
    slope, intercept = np.polyfit(ks, wf, 1)
    print(f"\n  fit  w_flux = {slope:.3f} * k + {intercept:.3f}"
          f"   (theory: 1.000 * k + 2.000)")
    res["fit"] = {"slope": float(slope), "intercept": float(intercept)}

    assert ok, "Q != k+4 for some k: the unifying law is FALSE"
    assert abs(slope - 1.0) < 0.12 and abs(intercept - 2.0) < 0.12, "flux weight law off"
    print("\n  -> LAW CONFIRMED. The growth vector reads the vanishing order of the")
    print("     curvature, and Q = k + 4 in 2D. The magnetic result generalises.")

    out = ROOT / "artifacts" / "e9_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
