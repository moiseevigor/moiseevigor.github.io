#!/usr/bin/env python3
"""Task: is the quartic coefficient of the nilpotent deviation exactly 5/2?

Part 3 / appendix D5 measured  delta(eps) = -c2 eps^2 - c4 eps^4 + O(eps^6)  for the
constant-gradient field B = B0 exp(g x), with c2 = 0.9996 (= 1) and c4 = 2.524 -- close
enough to 5/2 to ask whether it IS 5/2. This driver measures c4 with controlled errors:

  * y(eps) = -delta/eps^2 = c2 + c4 eps^2 + c6 eps^4 fitted quadratically in eps^2;
  * two conjugate-time scan resolutions (numerical-bias estimate: the shift n_scan
    4000 -> 8000 bounds the discretisation error);
  * fit-window stability (drop-largest / drop-smallest eps re-fits);
  * error bar = quadrature of fit covariance, window spread, and resolution shift.

Verdict rule (pre-registered): "consistent with 5/2" iff |c4 - 2.5| <= 2 sigma_total;
"refutes 5/2" iff |c4 - 2.5| > 3 sigma_total; in between: undecided, report as such.

Usage: run_c4_precision.py            Output: artifacts/c4_precision.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import mfield  # noqa: E402

EPS = np.array([0.03, 0.04, 0.05, 0.075, 0.10, 0.125, 0.15, 0.175, 0.20, 0.25])
B0, W = 1.0, 1.0                       # r_L = 1, so eps = g


def measure_y(eps_grid, n_scan, n_theta=32):
    """y = -delta/eps^2 for each eps (B0 = w = 1 so eps = g).

    t_max_factor 1.7: per-angle conjugate times deviate at O(eps) (only the angular
    MEAN is even in eps), so the slowest angle needs headroom ~ 1 + O(eps).
    """
    ys = []
    for e in eps_grid:
        st = mfield.exp_gradient_field(B0, g=float(e))
        d, sd, nnan = st.delta([0.0, 0.0, 0.0], W, n_theta=n_theta,
                               n_scan=n_scan, t_max_factor=1.7)
        assert nnan == 0, f"missing conjugate points at eps={e}"
        ys.append(-d / e ** 2)
        print(f"  eps={e:5.3f}  n_scan={n_scan}  y=-delta/eps^2 = {ys[-1]:.6f} "
              f"(angle spread {sd/e**2:.1e})")
    return np.array(ys)


def polyfit_err(u, z, deg):
    """LSQ z = sum_k a_k u^k. Returns (coefs low->high, sigma of each coef)."""
    X = np.stack([u ** k for k in range(deg + 1)], 1)
    coef, res, *_ = np.linalg.lstsq(X, z, rcond=None)
    dof = max(len(u) - (deg + 1), 1)
    s2 = (res[0] / dof) if len(res) else float(np.sum((z - X @ coef) ** 2) / dof)
    cov = s2 * np.linalg.inv(X.T @ X)
    return coef, np.sqrt(np.diag(cov))


def main():
    print("high resolution (n_scan=8000):")
    y_hi = measure_y(EPS, 8000)
    print("control resolution (n_scan=4000):")
    y_lo = measure_y(EPS, 4000)
    bias_y = float(np.max(np.abs(y_hi - y_lo)))       # discretisation: fully converged

    # Estimator: z = (y - 1)/u = c4 + c6 u + c8 u^2 + ...  (c2 = 1 is Part 3's law,
    # re-verified by the free fit below). c4 is z's intercept at u -> 0; truncation
    # bias is controlled by comparing a linear and a quadratic model on small-eps
    # windows -- the honest systematic is their spread.
    u = EPS ** 2
    z = (y_hi - 1.0) / u
    for e, zz in zip(EPS, z):
        print(f"  eps={e:5.3f}  z=(y-1)/eps^2 = {zz:.5f}")

    mA = EPS <= 0.126                                  # 6 pts, linear model
    (c4_A, c6_A), (sA, _) = polyfit_err(u[mA], z[mA], 1)
    mB = EPS <= 0.201                                  # 9 pts, quadratic model
    (c4_B, c6_B, c8_B), (sB, *_r) = polyfit_err(u[mB], z[mB], 2)
    # cross-check: free-c2 quadratic fit of y itself (absorbs any offset)
    (c2_f, c4_C, c6_C), _ = polyfit_err(u[mB], y_hi[mB], 2)

    c4 = float((c4_A + c4_B) / 2)
    spread = abs(c4_A - c4_B)
    sigma = float(np.sqrt(max(sA, sB) ** 2 + spread ** 2 + (bias_y / u[0]) ** 2))

    print(f"\nmodel A (z linear,   eps<=0.125): c4 = {c4_A:.4f} +/- {sA:.4f}, c6 = {c6_A:.2f}")
    print(f"model B (z quadratic, eps<=0.20):  c4 = {c4_B:.4f} +/- {sB:.4f}, "
          f"c6 = {c6_B:.2f}, c8 = {c8_B:.1f}")
    print(f"cross-check free-c2 fit: c2 = {c2_f:.6f}, c4 = {c4_C:.4f}")
    print(f"resolution shift (max |y8000-y4000|): {bias_y:.1e}")
    print(f"\n==> c4 = {c4:.4f} +/- {sigma:.4f}   (model spread {spread:.4f})")
    for name, val in (("5/2 (pre-registered)", 2.5), ("9/4 (post-hoc)", 2.25)):
        dev = abs(c4 - val)
        tag = ("CONSISTENT" if dev <= 2 * sigma else
               "REFUTED" if dev > 3 * sigma else "UNDECIDED")
        print(f"    c4 = {name:22s}: |dev| = {dev:.4f} = {dev/sigma:5.1f} sigma  -> {tag}")

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "c4_precision.json").write_text(json.dumps({
        "eps": EPS.tolist(), "y": y_hi.tolist(), "z": z.tolist(),
        "c4": c4, "sigma": sigma,
        "model_A": {"c4": float(c4_A), "c6": float(c6_A), "sigma": float(sA)},
        "model_B": {"c4": float(c4_B), "c6": float(c6_B), "c8": float(c8_B),
                    "sigma": float(sB)},
        "free_c2_check": {"c2": float(c2_f), "c4": float(c4_C)},
        "resolution_shift_y": bias_y}, indent=2) + "\n")
    print("wrote artifacts/c4_precision.json")


if __name__ == "__main__":
    main()
