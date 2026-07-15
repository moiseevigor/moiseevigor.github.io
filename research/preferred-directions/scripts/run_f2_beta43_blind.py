#!/usr/bin/env python3
"""F2 -- the caustic-blind jet at beta = 4/3, tested (final review, item F2).

Proposition 4.2 derives c2_caustic(beta) = 1 - (3/4) beta, so the theory
predicts EXACT leading-order cancellation at beta = 4/3; the numerical fit
below can only test CONSISTENCY WITH ZERO within its sensitivity band, and
its even-power fit models assume the even form over the sampled positive-eps
range. That prediction was written
into the article as a consequence of the derivation, "not yet run through the
full numerical caustic pipeline". This runs it.

PRE-REGISTERED RULE (stated in REVIEW-SR-ASTROPHYSICS-FINAL-2026-07-14.md
before this script was run): the prediction PASSES iff |c2_fit| lies within
the fit's own sensitivity band, with the same band construction as V1's
published points (fit-model spread + resolution shift). Either outcome is
recorded.

Profile: the power family B = (1+gx)^n at n = -3/4, so beta = -1/n = 4/3.
Orientation: g = eps/n < 0 keeps L'(0) = n g = +eps (the g >= 0 reflection
convention of Prop 3.1 is about the launch-averaged statistic; the pipeline
runs the actual field). Exact potential A_y = ((1+gx)^{n+1} - 1)/(g(n+1)).
Under the even-power fit ansatz, with c2 = 0 the first fitted residual term
is eps^4 (an eps^3 term is not excluded by theory for general profiles; the
ansatz assumes it away): y = -delta/eps^2 = c4 eps^2 + ..., so the fit's
intercept is the tested quantity.

Out: artifacts/f2_beta43_blind.json + printed verdict.
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import mfield  # noqa: E402
import run_v1_linear_profile as v1  # noqa: E402  (fit_c2, period_T, EPS)

N_POW = -0.75
BETA = -1.0 / N_POW                                   # = 4/3


def pow_field(e, n=N_POW):
    """B = (1+gx)^n with g = e/n, so L'(0) = +e; exact A_y."""
    g = e / n
    A_x = lambda x, y: np.zeros_like(np.asarray(x, dtype=float))
    A_y = lambda x, y: ((1.0 + g * x) ** (n + 1.0) - 1.0) / (g * (n + 1.0))
    B = lambda x, y: (1.0 + g * x) ** n
    return mfield.MagneticStructure(A_x, A_y, B, name=f"B=(1+{g:.4f}x)^{n}")


def integrand(e, u):
    """Power-family theta-period integrand (1 + ((n+1)/n) e u)^(-n/(n+1))."""
    return (1.0 + ((N_POW + 1.0) / N_POW) * e * u) ** (-N_POW / (N_POW + 1.0))


def main():
    W = 1.0
    n_theta, n_scan = 32, 8000
    print(f"== F2: beta = {BETA:.4f} (n = {N_POW}) — prediction c2_caustic = "
          f"{1 - 0.75 * BETA:.1f} ==", flush=True)
    ys, ys_lo, rel_max = [], [], []
    for e in v1.EPS:
        st = pow_field(float(e))
        d, sd, nnan = st.delta([0.0, 0.0, 0.0], W, n_theta=n_theta,
                               n_scan=n_scan, t_max_factor=2.0)
        assert nnan == 0, f"missing conjugate points at eps={e}"
        d_lo, _, nn2 = st.delta([0.0, 0.0, 0.0], W, n_theta=n_theta,
                                n_scan=n_scan // 2, t_max_factor=2.0)
        assert nn2 == 0
        ys.append(-d / e ** 2)
        ys_lo.append(-d_lo / e ** 2)
        thetas = np.linspace(0.0, 2 * np.pi, n_theta, endpoint=False)
        tc = st.conjugate_times([0.0, 0.0, 0.0], thetas, W,
                                2.0 * 2 * np.pi, n_scan=n_scan)
        Tp = np.array([v1.period_T(integrand, float(e), t) for t in thetas])
        rel = float(np.abs(tc / Tp - 1.0).max())
        rel_max.append(rel)
        print(f"  eps={e:5.3f}  y=-delta/eps^2 = {ys[-1]:+.5f}   "
              f"period c2_pred = {1 - BETA/2:.4f}   max|t_c/T-1| = {rel:.2e}",
              flush=True)

    c2, sigma, c_A, c_B, bias = v1.fit_c2(v1.EPS, np.array(ys), np.array(ys_lo))
    passed = abs(c2) <= sigma
    print(f"  fits: A(c2,c4) = ({c_A[0]:+.4f}, {c_A[1]:+.3f})  "
          f"B(c2,c4,c6) = ({c_B[0]:+.4f}, {c_B[1]:+.3f}, {c_B[2]:+.1f})  "
          f"bias {bias:.1e}", flush=True)
    print(f"  caustic c2 = {c2:+.4f} +/- {sigma:.4f}   predicted 0   "
          f"[period-average c2 = {1 - BETA/2:.4f}]", flush=True)
    print(f"  PRE-REGISTERED VERDICT: {'PASS' if passed else 'FAIL'} "
          f"(|c2| {'<=' if passed else '>'} band)", flush=True)

    out = {"beta": BETA, "n": N_POW, "eps": v1.EPS.tolist(),
           "y": [float(v) for v in ys], "y_lo_res": [float(v) for v in ys_lo],
           "max_rel_tc_vs_period": rel_max,
           "c2_caustic": c2, "sigma": sigma, "c2_predicted": 0.0,
           "c2_period_pred": 1 - BETA / 2,
           "fit_A": [float(v) for v in c_A], "fit_B": [float(v) for v in c_B],
           "verdict": "PASS" if passed else "FAIL"}
    (ROOT / "artifacts" / "f2_beta43_blind.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/f2_beta43_blind.json", flush=True)


if __name__ == "__main__":
    main()
