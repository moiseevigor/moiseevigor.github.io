#!/usr/bin/env python3
"""E5 - does gravitational structure formation carry sub-Riemannian structure?

Phase A of docs/PLAN-astrophysics-local-groups.md. Tests hypothesis H-A and, as it
turns out, refutes the plan's own naive criterion.

Structure of the test
---------------------
1. CONTROLS on maps with known degeneracy: a regular linear map (exponents 1,1,1),
   an exact fold x1=q1^2 (2,1,1), an exact cusp x1=q1^3 (3,1,1). Validates the
   estimator.
2. HEISENBERG (genuine sub-Riemannian): weights (1,1,2), Q=4 > n=3 -- and crucially
   this holds at EVERY point, because the structure is homogeneous.
3. ZEL'DOVICH (real gravitational flow, analytic Gaussian potential):
     * at a generic point -> exponents (1,1,1), "Q" = 3 = n. No SR structure.
     * at a FOLD caustic  -> exponents (1,1,2), "Q" = 4. Numerically identical to
       Heisenberg, but produced by a Lagrangian catastrophe, not a distribution.
4. MEASURE TEST: what fraction of base points has Q > n? For Heisenberg: all of them.
   For Zel'dovich below shell-crossing: none (folds are codimension-1, a null set).

Conclusion (see docs/E5-no-sr-structure-in-gravity.md): "Q > n at a point" does NOT
imply sub-Riemannian structure -- caustics fake it. The corrected criterion is
measure-theoretic: Q > n on a set of FULL MEASURE.

Usage: run_e5.py [--quick]
Results -> artifacts/e5_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import lagrangian as lag  # noqa: E402
import growth  # noqa: E402
import liegroup  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(1e-3, 2e-2, 6)
NS = 3000 if QUICK else 8000
N_BASE = 30 if QUICK else 120
I3 = np.eye(3)


def exponents(map_fn, q0, frame, rng, radii=RADII, ns=NS):
    reach = lag.image_reach(map_fn, q0, frame, radii, ns, rng)
    w = growth.estimate_weights(reach, radii)
    return w, int(np.rint(w).sum())


def show(name, w, Q, expect=None):
    ws = "(" + ",".join(f"{x:.2f}" for x in w) + ")"
    tag = ""
    if expect is not None:
        tag = "  OK" if Q == expect else f"  <-- expected Q={expect}"
    print(f"  {name:<34}{ws:<24} Q={Q}{tag}")
    return {"weights": w.tolist(), "Q": Q}


def main():
    rng = np.random.default_rng(0)
    res = {"radii": RADII.tolist(), "n_samples": NS}

    # ---------------- 1. controls on maps with known degeneracy
    print("== controls: maps with known degeneracy (validates the estimator) ==")
    res["controls"] = {}
    w, Q = exponents(lag.linear_map(np.diag([1.0, 0.7, 0.5])), np.zeros(3), I3, rng)
    res["controls"]["linear (regular)"] = show("linear / regular", w, Q, 3)
    assert Q == 3
    w, Q = exponents(lag.fold_map, np.zeros(3), I3, rng)
    res["controls"]["fold x1=q1^2"] = show("exact fold  x1 = q1^2", w, Q, 4)
    assert Q == 4
    w, Q = exponents(lag.cusp_map, np.zeros(3), I3, rng)
    res["controls"]["cusp x1=q1^3"] = show("exact cusp  x1 = q1^3", w, Q, 5)

    # ---------------- 2. Heisenberg: genuine SR structure, homogeneous
    print("\n== Heisenberg (genuine sub-Riemannian, homogeneous) ==")
    vec, Qh, wh = growth.estimate_growth_vector(
        liegroup.GROUPS["Heisenberg"], np.geomspace(0.15, 1.0, 6), 800,
        np.random.default_rng(1), 0.0)
    print(f"  growth vector {vec}, Q={Qh} > n=3   weights "
          f"({','.join(f'{x:.2f}' for x in wh)})")
    print("  -> Q > n holds at EVERY point (left-invariant: the structure is the same"
          " everywhere)")
    res["heisenberg"] = {"growth_vector": list(vec), "Q": Qh, "weights": wh.tolist()}

    # ---------------- 3. Zel'dovich: regular point vs fold caustic
    print("\n== Zel'dovich gravitational flow (analytic Gaussian potential) ==")
    flow = lag.ZeldovichFlow(n_modes=10, seed=3, amp=0.05)
    # find a base point with a healthy positive max eigenvalue
    q0, lmax = None, -np.inf
    probe = rng.uniform(0, 2 * np.pi, size=(400, 3))
    for q in probe:
        lam = np.linalg.eigvalsh(flow.hess(q))
        if lam.max() > lmax:
            q0, lmax = q, lam.max()
    lam, E = lag.eigenframe(flow, q0)
    D_fold = 1.0 / lam.max()
    print(f"  base point tidal eigenvalues {np.round(lam,4)}   D_fold = {D_fold:.4f}")

    w, Q = exponents(lambda q: flow.map(q, 0.5 * D_fold), q0, E, rng)
    res["zeldovich_regular"] = show("regular point (D = 0.5 D_fold)", w, Q, 3)
    assert Q == 3, "generic Zel'dovich point should have Q = n = 3"

    w, Q = exponents(lambda q: flow.map(q, D_fold), q0, E, rng)
    res["zeldovich_fold"] = show("FOLD caustic (D = D_fold)", w, Q, 4)
    print("     ^ same Q as Heisenberg -- but this is a Lagrangian catastrophe,")
    print("       not a bracket-generating distribution. Q > n is NOT sufficient.")

    # ---------------- 4. measure test: how much of space has Q > n?
    print("\n== measure test: fraction of base points with Q > n ==")
    # a growth factor safely below the global first shell-crossing
    lam_glob = max(np.linalg.eigvalsh(flow.hess(q)).max() for q in probe)
    D_safe = 0.9 / lam_glob
    hits = 0
    bases = rng.uniform(0, 2 * np.pi, size=(N_BASE, 3))
    for q in bases:
        _, Ei = lag.eigenframe(flow, q)
        _, Qi = exponents(lambda z: flow.map(z, D_safe), q, Ei, rng,
                          radii=RADII, ns=max(1500, NS // 4))
        hits += int(Qi > 3)
    frac = hits / N_BASE
    print(f"  Zel'dovich (D={D_safe:.4f}, pre-shell-crossing): "
          f"{hits}/{N_BASE} = {frac:.2%} of points have Q > 3")
    print(f"  Heisenberg: 100% of points have Q > 3 (homogeneous)")
    res["measure_test"] = {"zeldovich_frac_Q_gt_n": frac, "n_base": N_BASE,
                           "D_safe": D_safe, "heisenberg_frac": 1.0}
    assert frac < 0.05, "folds should be a null set below shell-crossing"

    # ---------------- 5. the lift is a tautology
    print("\n== the R^3 x S^2 lift: horizontality is a tautology ==")
    resid = {}
    for name, vel in [
        ("Zel'dovich flow", lambda q: -flow.grad(q)),
        ("random smooth flow", lambda q: np.stack(
            [np.sin(q[..., 1]), np.cos(q[..., 2]), np.sin(q[..., 0] + 1.0)], -1)),
    ]:
        qs = rng.uniform(0, 2 * np.pi, size=(500, 3))
        v = vel(qs)
        vhat = v / np.linalg.norm(v, axis=1, keepdims=True)
        # horizontality: the position-velocity is parallel to the lifted direction
        perp = v - (np.sum(v * vhat, axis=1, keepdims=True)) * vhat
        r = float(np.max(np.linalg.norm(perp, axis=1) / np.linalg.norm(v, axis=1)))
        resid[name] = r
        print(f"  {name:<22} max transverse residual = {r:.2e}")
    res["lift_horizontality_residual"] = resid
    print("  -> every smooth flow lifts to a horizontal curve of the SAME rank-3")
    print("     distribution. The growth vector of the lift measures the lift.")
    assert max(resid.values()) < 1e-12

    out = ROOT / "artifacts" / "e5_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
