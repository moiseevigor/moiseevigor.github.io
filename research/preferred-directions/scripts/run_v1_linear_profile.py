#!/usr/bin/env python3
"""V1 -- caustic test of the profile law across three profiles (article S4 + Conj A).

PRE-REGISTERED PREDICTION (derived in the article BEFORE the first run; see
run_t4_beta_period_check.py): the PERIOD-AVERAGED deviation obeys
c2_period = 1 - beta/2 (beta = L''(0)/L'(0)^2, L = ln B). If Conjecture A
(conjugate time = theta-period) held for every profile, the caustic pipeline
would measure the same c2.

FIRST-RUN RESULT (recorded): REFUTED for the linear profile. The Jacobian
pipeline measures c2 ~= 1.746 +/- 0.010 (7/4?), not 3/2, and the per-angle
comparison shows t_c != T with max|t_c/T - 1| growing as eps^2 (1.2e-2 at
eps = 0.15). So Conjecture A is EXPONENTIAL-SPECIFIC: orbit closure and the
E-collapse hold for the linear profile too, yet the identity fails -- any
proof of Conj A must use something more than those two ingredients.

THIS EXTENDED RUN maps the caustic law: three profiles from the power family
B = B0 (1 + g x)^n (beta = -1/n; period integrand (1 + (n+1)/n eps u)^{-n/(n+1)},
u = sin th - sin th0; n -> inf is the exponential, where t_c = T to 1e-8):

    n = 1   (linear,    beta = -1  ): period c2 = 3/2, caustic c2 = ?
    n = 2   (quadratic, beta = -1/2): period c2 = 5/4, caustic c2 = ?
    n = inf (exponential, beta = 0 ): c2 = 1 exactly (control)

A linear caustic law c2 = 1 - a*beta predicts caustic(n=2) = 1 + a/2
(a = 3/4 would give 11/8 = 1.375); a quadratic correction
c2 = 1 - beta/2 + (1/4)beta^2 predicts 21/16 = 1.3125.

Out: artifacts/v1_linear_profile.json + printed verdicts.
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.integrate import quad

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import mfield  # noqa: E402

EPS = np.array([0.02, 0.03, 0.05, 0.075, 0.10, 0.15])
B0, W = 1.0, 1.0                                  # r_L = 1


def linear_field(g):
    """B = 1 + g x  (n = 1, beta = -1); A_y = x + g x^2/2."""
    A_x = lambda x, y: np.zeros_like(np.asarray(x, dtype=float))
    A_y = lambda x, y: x + 0.5 * g * x * x
    B = lambda x, y: 1.0 + g * x
    return mfield.MagneticStructure(A_x, A_y, B, name=f"B=(1+{g}x)")


def quad_field(g):
    """B = (1 + g x)^2  (n = 2, beta = -1/2); A_y = x + g x^2 + g^2 x^3/3."""
    A_x = lambda x, y: np.zeros_like(np.asarray(x, dtype=float))
    A_y = lambda x, y: x + g * x * x + (g * g / 3.0) * x ** 3
    B = lambda x, y: (1.0 + g * x) ** 2
    return mfield.MagneticStructure(A_x, A_y, B, name=f"B=(1+{g}x)^2")


PROFILES = {
    # name: (beta, eps -> structure, period integrand power terms)
    "linear_n1": (-1.0, lambda e: linear_field(e),
                  lambda e, u: (1.0 + 2.0 * e * u) ** (-0.5)),
    "quad_n2": (-0.5, lambda e: quad_field(e / 2.0),
                lambda e, u: (1.0 + 1.5 * e * u) ** (-2.0 / 3.0)),
}


def period_T(integrand, eps, th0):
    f = lambda th: integrand(eps, np.sin(th) - np.sin(th0))
    val, _ = quad(f, 0.0, 2.0 * np.pi, limit=200)
    return val


def fit_c2(eps, ys, ys_lo):
    u = eps ** 2
    X = np.stack([np.ones_like(u), u], 1)
    c_A = np.linalg.lstsq(X, ys, rcond=None)[0]
    X2 = np.stack([np.ones_like(u), u, u ** 2], 1)
    c_B = np.linalg.lstsq(X2, ys, rcond=None)[0]
    bias = float(np.max(np.abs(ys - ys_lo)))
    c2 = float((c_A[0] + c_B[0]) / 2)
    sigma = float(np.sqrt((c_A[0] - c_B[0]) ** 2 + bias ** 2))
    return c2, sigma, c_A, c_B, bias


def main():
    out = {"eps": EPS.tolist(), "profiles": {}}
    n_theta, n_scan = 32, 8000

    for tag, (beta, mk, integrand) in PROFILES.items():
        print(f"== {tag} (beta = {beta}) ==")
        ys, ys_lo, rel_max = [], [], []
        for e in EPS:
            st = mk(float(e))
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
            Tp = np.array([period_T(integrand, float(e), t) for t in thetas])
            rel = float(np.abs(tc / Tp - 1.0).max())
            rel_max.append(rel)
            print(f"  eps={e:5.3f}  y=-delta/eps^2 = {ys[-1]:.5f}   "
                  f"period c2_pred = {1 - beta/2:.4f}   max|t_c/T-1| = {rel:.2e}")

        c2, sigma, c_A, c_B, bias = fit_c2(EPS, np.array(ys), np.array(ys_lo))
        print(f"  fits: A(c2,c4) = ({c_A[0]:.4f}, {c_A[1]:.2f})  "
              f"B(c2,c4,c6) = ({c_B[0]:.4f}, {c_B[1]:.2f}, {c_B[2]:.0f})  "
              f"bias {bias:.1e}")
        print(f"  caustic c2 = {c2:.4f} +/- {sigma:.4f}   "
              f"period-average c2 = {1 - beta/2}\n")
        out["profiles"][tag] = {
            "beta": beta, "y": [float(v) for v in ys],
            "y_lo_res": [float(v) for v in ys_lo],
            "max_rel_tc_vs_period": rel_max,
            "c2_caustic": c2, "sigma": sigma,
            "c2_period_pred": 1 - beta / 2,
            "fit_A": [float(v) for v in c_A], "fit_B": [float(v) for v in c_B]}

    la, qa = out["profiles"]["linear_n1"], out["profiles"]["quad_n2"]
    print("== caustic law in beta ==")
    for lbl, pred_lin, pred_sq in [
            ("linear model c2 = 1 - (3/4)beta", 1.75, 1.375),
            ("period + quadratic c2 = 1 - beta/2 + beta^2/4", 1.75, 1.3125)]:
        d1 = abs(la["c2_caustic"] - pred_lin)
        d2 = abs(qa["c2_caustic"] - pred_sq)
        print(f"  {lbl}: predicts (n=1, n=2) = ({pred_lin}, {pred_sq}); "
              f"measured ({la['c2_caustic']:.4f}, {qa['c2_caustic']:.4f}); "
              f"|diff| = ({d1:.4f}, {d2:.4f})")

    (ROOT / "artifacts" / "v1_linear_profile.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/v1_linear_profile.json")


if __name__ == "__main__":
    main()
