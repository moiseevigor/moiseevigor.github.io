#!/usr/bin/env python3
"""E8 - does the sub-Riemannian technique have ANY astrophysical home? (Phase C)

Plan: docs/PLAN-astrophysics-local-groups.md. Kill criterion: if Q = n even in the
singular limit, the technique's honest scope is neuro-imaging and robotics only.

The trap, tested explicitly (control 0): suppressed cross-field transport
(D_perp << D_par) is *coefficient* anisotropy -- an anisotropic RIEMANNIAN metric whose
reachable ellipsoid has every semi-axis linear in the cost. Q = n however extreme the
anisotropy. That is not sub-Riemannian.

The real structure: adjoin the magnetic FLUX swept by the path, z = int A.dl. Then
[X1, X2] = B(x,y) d/dz, so the rank-2 distribution is contact exactly where B != 0:
weights (1,1,2), Q = 4 > n = 3, on a set of FULL MEASURE. At a magnetic NULL (B = 0)
flux accumulates only at third order: weights (1,1,3), Q = 5 (Martinet).

Contrast with gravity (E5): there Q = n = 3 almost everywhere and Q = 4 only on the
codimension-1 caustic. The full-measure criterion cleanly separates the two.

Usage: run_e8.py [--quick]
Results -> artifacts/e8_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import magnetic as mag  # noqa: E402
import growth  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(0.02, 0.25, 6)
NP = 1200 if QUICK else 3000
NBASE = 12 if QUICK else 30


def weights_Q(struct, q0, rng, n_paths=NP):
    reach = struct.reach(q0, RADII, n_paths, rng)
    w = growth.estimate_weights(reach, RADII)
    return w, int(np.rint(w).sum())


def show(label, w, Q, expect):
    ws = "(" + ",".join(f"{x:.2f}" for x in w) + ")"
    ok = "OK" if Q == expect else f"<-- expected {expect}"
    print(f"  {label:<40}{ws:<22} Q={Q}  {ok}")
    return {"weights": w.tolist(), "Q": Q}


def main():
    rng = np.random.default_rng(0)
    res = {"radii": RADII.tolist()}

    # ---- control 0: anisotropic RIEMANNIAN is NOT sub-Riemannian
    print("== control: anisotropic Riemannian transport (D_perp << D_par) ==")
    for aniso in [1e-2, 1e-4, 1e-6]:
        axes = np.array([1.0, aniso, aniso])            # semi-axes of the reach ellipsoid
        reach = np.outer(RADII, axes)                    # every axis LINEAR in r
        w = growth.estimate_weights(reach, RADII)
        Q = int(np.rint(w).sum())
        print(f"  D_perp/D_par = {aniso:<8.0e} weights "
              f"({','.join(f'{x:.2f}' for x in w)})  Q={Q}   (n=3)")
        assert Q == 3, "anisotropic Riemannian must have Q = n"
    print("  -> coefficient anisotropy, however extreme, gives Q = n. NOT sub-Riemannian.")
    res["anisotropic_riemannian_Q"] = 3

    # ---- uniform field: the frame IS Heisenberg
    print("\n== uniform B: the magnetic contact structure is Heisenberg ==")
    uni = mag.uniform_field(1.0)
    print(f"  B(0.3,-0.2) = {uni.B(0.3,-0.2):.6f}   (exact 1.0)")
    w, Q = weights_Q(uni, [0.0, 0.0, 0.0], rng)
    res["uniform"] = show("uniform B, base (0,0)", w, Q, 4)
    assert Q == 4, "uniform magnetic contact structure should give Q=4 (Heisenberg)"
    print("  -> weights (1,1,2): flux is a weight-2 coordinate. Q=4 > n=3.")

    # ---- modulated, nowhere-zero field: contact on FULL MEASURE
    print("\n== modulated B = 1 + 0.5 sin x sin y (nowhere zero) ==")
    mod = mag.modulated_field(0.5)
    bs = [mod.B(*p) for p in [(0.0, 0.0), (1.3, 0.7), (-2.0, 2.4)]]
    print(f"  sample B values: {np.round(bs,4)}   (all > 0)")
    hits = 0
    bases = rng.uniform(-3, 3, size=(NBASE, 2))
    Qs = []
    for b in bases:
        wq, Qq = weights_Q(mod, [b[0], b[1], 0.0], rng, n_paths=max(800, NP // 2))
        Qs.append(Qq)
        hits += int(Qq > 3)
    frac = hits / NBASE
    print(f"  Q > n at {hits}/{NBASE} = {frac:.0%} of base points  (Q values: "
          f"{sorted(set(Qs))})")
    res["modulated"] = {"frac_Q_gt_n": frac, "Q_values": sorted(set(Qs))}
    assert frac == 1.0, "contact structure must have Q>n on full measure"
    print("  -> Q > n on a set of FULL MEASURE. This IS a sub-Riemannian geometry.")

    # ---- magnetic null: Martinet degeneration, Q = 5
    print("\n== B = x : a magnetic NULL on the line x = 0 ==")
    nul = mag.null_field()
    print(f"  B(0,y) = {nul.B(0.0,0.5):.2e}   B(1,y) = {nul.B(1.0,0.5):.4f}")
    w, Q = weights_Q(nul, [1.0, 0.0, 0.0], rng)
    res["null_away"] = show("away from null, base (1,0)", w, Q, 4)
    w, Q = weights_Q(nul, [0.0, 0.0, 0.0], rng)
    res["null_at"] = show("AT the null, base (0,0)", w, Q, 5)
    assert res["null_away"]["Q"] == 4 and res["null_at"]["Q"] == 5, "Martinet jump absent"
    print("  -> at the null the flux weight jumps 2 -> 3 (Martinet): Q jumps 4 -> 5.")
    print("     The growth vector is a magnetic-null / reconnection-site detector.")

    # ---- the verdict, against E5
    print("\n== verdict (compare experiment E5, gravity) ==")
    print("  gravity      : Q = n = 3 a.e.;  Q = 4 only on the codim-1 caustic (0% of volume)")
    print("  magnetic flux: Q = 4 > n = 3 on FULL measure;  Q = 5 on the codim-1 null set")
    print("  => the technique's astrophysical home is magnetized systems, on the")
    print("     extended (position, flux) space -- not gravitational structure formation.")
    res["verdict"] = ("SR structure genuine for magnetic flux geometry (Q=4 a.e.); "
                      "absent for gravity (Q=n a.e.)")

    out = ROOT / "artifacts" / "e8_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
