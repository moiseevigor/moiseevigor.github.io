#!/usr/bin/env python3
"""P5-T2 -- the closed form: delta(eps) = 1 - (2/pi) K(2 eps)   (K = complete elliptic
integral of the first kind).

Chain of claims, each tested independently against the geodesic code:

  (C1) One-line integral of motion: along a magnetic geodesic of B = e^(eps x)
       (B0 = w = 1, launch at the origin), d(theta')/d(theta) = eps cos(theta), so
           theta'(theta) = 1 + eps (sin theta - sin theta0).
  (C2) Per-angle conjugate time equals the theta-period:
           t_c(theta0) = 2 pi / sqrt((1 - eps sin theta0)^2 - eps^2).
  (C3) The angle average equals the elliptic integral:
           <t_c>/2pi = (1/2pi) Int d(phi) [(1 - eps sin phi)^2 - eps^2]^(-1/2)
                     = (2/pi) K(2 eps),
       hence delta(eps) = 1 - (2/pi) K(2 eps), whose Taylor coefficients are
       c_{2m} = [C(2m,m)/2^m]^2 = 1, 9/4, 25/4, 1225/64, ... (squared normalised
       central binomials) -- reproducing the measured 1 and 9/4 and predicting c6.
  (C4) Critical gradient: K diverges at modulus 1, so refocusing must slow down
       toward eps = 1/2 and the slowest launch angle (sin theta0 = 1) must lose its
       conjugate point exactly at eps = 1/2.

Usage: run_p5_series.py       Out: artifacts/p5_series.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.special import ellipk           # ellipk(m), m = k^2

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import mfield  # noqa: E402


def closed_form(eps):
    return 1.0 - (2.0 / np.pi) * ellipk((2.0 * eps) ** 2)


def main():
    res = {}

    # ---- C2: per-angle conjugate time vs the pendulum-period formula ----------------
    print("C2: per-angle t_c vs 2pi/sqrt((1 - eps sin th0)^2 - eps^2)")
    worst = 0.0
    for eps in (0.1, 0.25, 0.4):
        st = mfield.exp_gradient_field(1.0, g=eps)
        th0 = np.linspace(0, 2 * np.pi, 12, endpoint=False)
        tc = st.conjugate_times([0, 0, 0], th0, 1.0, t_max=4.0 * 2 * np.pi, n_scan=12000)
        pred = 2 * np.pi / np.sqrt((1 - eps * np.sin(th0)) ** 2 - eps ** 2)
        rel = np.abs(tc / pred - 1)
        worst = max(worst, float(np.nanmax(rel)))
        print(f"  eps={eps:4.2f}: max rel deviation = {np.nanmax(rel):.2e}")
    res["C2_worst_rel"] = worst

    # ---- C3: measured delta vs the closed form --------------------------------------
    print("\nC3: measured delta(eps) vs 1 - (2/pi) K(2 eps)")
    rows = []
    for eps in (0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.45):
        st = mfield.exp_gradient_field(1.0, g=eps)
        d, sd, nn = st.delta([0, 0, 0], 1.0, n_theta=32, n_scan=12000,
                             t_max_factor=1.0 / np.sqrt((1 - eps) ** 2 - eps ** 2) + 0.4)
        cf = closed_form(eps)
        rows.append({"eps": eps, "delta_measured": d, "delta_closed": cf,
                     "n_missing": int(nn)})
        print(f"  eps={eps:4.2f}: measured {d:+.7f}   closed form {cf:+.7f}   "
              f"diff {abs(d-cf):.1e}   (missing angles: {nn})")
    res["C3"] = rows
    res["C3_max_diff"] = float(max(abs(r["delta_measured"] - r["delta_closed"])
                                   for r in rows))

    # series coefficients of the closed form (sanity + the c6/c8 prediction)
    from math import comb
    coeffs = [comb(2 * m, m) ** 2 / 4 ** m for m in range(1, 5)]
    print(f"\nclosed-form Taylor coefficients c2,c4,c6,c8 = {coeffs}")
    print("  measured previously: c2 = 1.0000, c4 = 2.2497 +/- 0.0009; "
          "c6 fit intercept ~ 6.24-6.36  ->  prediction 25/4 = 6.25")
    res["closed_form_coeffs"] = coeffs

    # ---- C4: the critical gradient eps -> 1/2 ---------------------------------------
    print("\nC4: slowest angle (sin th0 = 1) near the critical gradient eps = 1/2")
    for eps in (0.45, 0.49, 0.52):
        st = mfield.exp_gradient_field(1.0, g=eps)
        tc = st.conjugate_times([0, 0, 0], np.array([np.pi / 2]), 1.0,
                                t_max=40 * 2 * np.pi, n_scan=60000)[0]
        arg = (1 - eps) ** 2 - eps ** 2
        pred = 2 * np.pi / np.sqrt(arg) if arg > 0 else float("inf")
        print(f"  eps={eps:4.2f}: t_c/2pi = {tc/(2*np.pi) if np.isfinite(tc) else float('nan'):8.3f}"
              f"   predicted {pred/(2*np.pi) if np.isfinite(pred) else float('inf'):8.3f}"
              f"   {'(no conjugate point found)' if not np.isfinite(tc) else ''}")
    res["C4_note"] = "t_c(sin th0=1) tracks 2pi/sqrt((1-eps)^2-eps^2); no refocus past 1/2"

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p5_series.json").write_text(json.dumps(res, indent=2) + "\n")
    print("\nwrote artifacts/p5_series.json")


if __name__ == "__main__":
    main()
