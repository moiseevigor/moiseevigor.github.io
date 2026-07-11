#!/usr/bin/env python3
"""P1 - do the conjugate-locus moduli measure grad B?  (Phase 1, decisive)

docs/PROGRAM.md §6. The first setting in which the nilpotent-deviation statistic has a
*physical ground truth* to be checked against.

Structure: the magnetic contact structure, whose geodesics are unit-speed curves of
curvature B(x,y)*w. Its tangent cone at q0 is Heisenberg with the constant field
B0 = B(q0), whose conjugate time is exactly t_c = 2*pi/(B0|w|). So

    delta = < 1 - t_c(th0,w) * B0 |w| / (2 pi) >_th0

is the deviation of the true conjugate locus from its own nilpotent model. It vanishes
identically for uniform B.

Field family: B = B0 exp(g x), the unique family with EXACTLY constant grad(ln B) = g.
The only dimensionless combination available is

    eps = g * r_L = g / (B0 |w|)          (gradient x Larmor radius)

PRE-REGISTERED PREDICTIONS -- with an honest correction made after the first run.

  (1) delta -> 0 as eps -> 0   (uniform limit; failure = bug)

  (2) COLLAPSE is a THEOREM, not a prediction.  Rescaling X = x/r_L, tau = t/r_L turns
      the geodesic ODE into  dX/dtau = cos th,  dth/dtau = exp(eps X),  which depends on
      (g, w) ONLY through eps.  Hence t_c = r_L * F(eps) exactly, and delta = 1 -
      F(eps)/(2 pi).  So the collapse MUST hold; observing it validates the code, it is
      not evidence about physics.  (Pre-registered as a prediction; corrected here.)

  (3) PARITY (real prediction): averaging over th0 kills odd terms, so delta is even in
      eps => delta ~ C eps^p with p = 2.  Finding p = 1 would mean a surviving odd term.

  (4) The empirical content is the function F, i.e. the coefficients of the even series
      delta(eps) = -c2 eps^2 - c4 eps^4 - ...   These are what the experiment measures.

KILL: no dependence on eps, or no collapse => the moduli do not read a physical
curvature gradient, and this program's moduli leg is dead (Phase 2 proceeds on the
growth vector alone).

Usage: run_p1_moduli.py [--quick]
Results -> artifacts/p1_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import mfield as mf  # noqa: E402

QUICK = "--quick" in sys.argv
B0 = 1.0
GS = [0.05, 0.1, 0.2, 0.4]
WS = [2.0, 4.0, 8.0, 16.0]
N_THETA = 8 if QUICK else 16
N_SCAN = 1500 if QUICK else 3000


def main():
    res = {"B0": B0, "gs": GS, "ws": WS, "n_theta": N_THETA}

    # ---- control: uniform field must give delta at the numerical floor
    print("== control: uniform B (grad B = 0) ==")
    floors = []
    for w in WS:
        d, _, _ = mf.exp_gradient_field(B0, 0.0).delta([0, 0, 0], w, N_THETA, N_SCAN)
        floors.append(abs(d))
        print(f"  w={w:<5} delta = {d:+.3e}")
    floor = max(floors)
    res["uniform_floor"] = floor
    assert floor < 1e-7, f"uniform field must give delta ~ 0, got {floor:.2e}"
    print(f"  -> numerical floor |delta| < {floor:.1e}. PASS\n")

    # ---- sweep
    print("== sweep: delta(g, w),  eps = g / (B0 |w|) ==")
    print(f"  {'g':>6}{'w':>7}{'eps':>10}{'delta':>14}{'delta/eps^2':>14}")
    rows = []
    for g in GS:
        for w in WS:
            f = mf.exp_gradient_field(B0, g)
            d, sd, nan = f.delta([0, 0, 0], w, N_THETA, N_SCAN)
            eps = g / (B0 * w)
            rows.append({"g": g, "w": w, "eps": eps, "delta": d, "sd": sd, "nan": nan})
            print(f"  {g:>6}{w:>7}{eps:>10.5f}{d:>14.3e}{d/eps**2:>14.4f}")
    res["rows"] = rows

    eps = np.array([r["eps"] for r in rows])
    dels = np.array([r["delta"] for r in rows])
    res["sign"] = "negative" if np.all(dels < 0) else ("positive" if np.all(dels > 0) else "mixed")
    print(f"\n  delta sign: {res['sign']}")

    # ---- (3) exponent: parity prediction, |delta| ~ C eps^p with p = 2
    p, logC = np.polyfit(np.log(eps), np.log(np.abs(dels)), 1)
    C = float(np.exp(logC))
    print(f"\n== (3) parity: |delta| = C * eps^p ==")
    print(f"  measured p = {p:.4f}   (pre-registered prediction: 2)")
    res["exponent"] = {"p": float(p), "C_global": C, "predicted_p": 2.0}
    assert abs(p - 2.0) < 0.10, f"exponent {p:.3f} != 2: parity prediction FAILED"

    # ---- (4) the even series: |delta|/eps^2 = c2 + c4 eps^2 + ...
    r = np.abs(dels) / eps ** 2
    c4, c2 = np.polyfit(eps ** 2, r, 1)
    print(f"\n== (4) the even series  delta = -(c2 eps^2 + c4 eps^4 + ...) ==")
    print(f"  c2 = {c2:.5f}   (small-eps limit of |delta|/eps^2 is {r[np.argmin(eps)]:.5f})")
    print(f"  c4 = {c4:.4f}")
    print(f"  -> delta(eps) = -eps^2 - {c4:.2f} eps^4 + O(eps^6),  ONLY EVEN POWERS.")
    print(f"  -> invertible: |grad ln B| = sqrt(|delta|) / r_L  to leading order.")
    res["even_series"] = {"c2": float(c2), "c4": float(c4)}
    assert abs(c2 - 1.0) < 0.02, f"leading coefficient {c2:.4f} != 1"

    # ---- (2) collapse: guaranteed by dilation symmetry -> a CODE check, not evidence
    print("\n== (2) collapse [dilation theorem: a consistency check, not evidence] ==")
    groups = {}
    for r in rows:
        groups.setdefault(round(r["eps"], 8), []).append(r)
    worst = 0.0
    for e, rs in sorted(groups.items()):
        if len(rs) < 2:
            continue
        ds = np.array([r["delta"] for r in rs])
        spread = float(np.std(ds) / abs(np.mean(ds)))
        worst = max(worst, spread)
        pairs = ", ".join(f"(g={r['g']},w={r['w']})" for r in rs)
        print(f"  eps={e:<9.5f} n={len(rs)}  delta spread = {spread:6.2%}   {pairs}")
    res["collapse_worst_relative_spread"] = worst
    print(f"\n  worst relative spread across an eps-group: {worst:.2%}")
    assert worst < 0.06, f"no collapse: spread {worst:.1%} -- delta is not a function of eps"

    print("\n  -> H1 CONFIRMED. The nilpotent deviation reads a physical curvature")
    print("     gradient: delta = -eps^2 + O(eps^4) with the leading coefficient exactly 1,")
    print("     eps = |grad ln B| * r_L.  Inverting, |grad ln B| = sqrt(|delta|)/r_L.")
    print("     Evidence = the parity exponent (p=2) and the coefficients; the collapse is")
    print("     a theorem and only validates the implementation.")

    out = ROOT / "artifacts" / "p1_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
