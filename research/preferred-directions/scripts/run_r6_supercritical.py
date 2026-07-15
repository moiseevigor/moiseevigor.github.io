#!/usr/bin/env python3
"""R6 -- what actually happens to conjugate points above the critical gradient?

Referee-prompted probe (independent review M2). Under Conjecture A, at
eps > 1/2 only launch angles with sin(theta0) >= (1-eps)/eps lose their
theta-period; the rest keep a finite period T = 2pi/sqrt(E^2 - eps^2).
Appendix D5's sentence "none found at eps = 0.52" is therefore ambiguous:
either it referred to the slowest angle only, or the caustic genuinely
disappears for ALL angles above 1/2 (which would break the per-angle
identification t_c = T there).

This probe measures it: exponential profile, eps in {0.45, 0.48, 0.52,
0.55}, 64 launch angles, generous window t_max = 8 Larmor periods,
n_scan = 16000, with BOTH detectors:
  - first sign change of the exponential-map Jacobian J(t)  (the standard);
  - global minimum of |J| (guard against even-multiplicity zeros the
    sign-change detector would miss -- review M2.2).

For each angle also the predicted period T(theta0) where finite.

Out: artifacts/r6_supercritical.json + printed verdicts.
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import mfield  # noqa: E402

EPS = [0.45, 0.48, 0.52, 0.55]
N_TH, N_SCAN, T_FACTOR = 64, 16000, 8.0


def jacobian_scan(st, q0, thetas, w, t_max, n_scan, h=1e-5):
    """Mirror of MagneticStructure.conjugate_times, returning J(t) per angle."""
    q0 = np.asarray(q0, float)
    thetas = np.asarray(thetas, float)
    m = thetas.size
    t_grid = np.linspace(t_max / n_scan, t_max, n_scan)
    th_all = np.concatenate([thetas, thetas + h, thetas - h, thetas, thetas])
    w_all = np.concatenate([np.full(m, w)] * 3 + [np.full(m, w + h), np.full(m, w - h)])
    pos, ang = st._integrate(q0, th_all, w_all, t_grid)
    pos = pos.reshape(5, m, n_scan, 3)
    th_base = ang[:m]
    d_th = (pos[1] - pos[2]) / (2 * h)
    d_w = (pos[3] - pos[4]) / (2 * h)
    xb, yb = pos[0][..., 0], pos[0][..., 1]
    c, sn = np.cos(th_base), np.sin(th_base)
    d_t = np.stack([c, sn, st.A_x(xb, yb) * c + st.A_y(xb, yb) * sn], axis=-1)
    J = np.linalg.det(np.stack([d_th, d_w, d_t], axis=-1))
    return t_grid, J


def main():
    out = {"eps": EPS, "n_theta": N_TH, "t_max_larmor": T_FACTOR, "rows": []}
    thetas = np.linspace(0.0, 2 * np.pi, N_TH, endpoint=False)

    for e in EPS:
        st = mfield.exp_gradient_field(1.0, g=float(e))
        t_grid, J = jacobian_scan(st, [0, 0, 0], thetas, 1.0,
                                  T_FACTOR * 2 * np.pi, N_SCAN)
        n_sign, n_only_min, details = 0, 0, []
        for i, th0 in enumerate(thetas):
            E = 1.0 - e * np.sin(th0)
            T_pred = 2 * np.pi / np.sqrt(E * E - e * e) if E > e else np.inf
            sgn = np.sign(J[i])
            cross = np.where(sgn[:-1] * sgn[1:] < 0)[0]
            tc = np.nan
            if cross.size:
                j = cross[0]
                t0, t1, j0, j1 = t_grid[j], t_grid[j + 1], J[i, j], J[i, j + 1]
                tc = t0 - j0 * (t1 - t0) / (j1 - j0)
                n_sign += 1
            # even-multiplicity guard: deep |J| dip without sign change
            absJ = np.abs(J[i])
            dip = float(absJ.min() / max(absJ[: N_SCAN // 50].max(), 1e-30))
            if not cross.size and dip < 1e-3:
                n_only_min += 1
            details.append({"theta0": round(float(th0), 4),
                            "T_pred": None if not np.isfinite(T_pred) else round(float(T_pred), 6),
                            "t_c": None if not np.isfinite(tc) else round(float(tc), 6),
                            "rel": None if not (np.isfinite(tc) and np.isfinite(T_pred))
                                   else round(float(tc / T_pred - 1.0), 8),
                            "minJ_dip": round(dip, 6)})
        finite_T = sum(1 for d in details if d["T_pred"] is not None)
        matched = [d["rel"] for d in details if d["rel"] is not None]
        row = {"eps": e, "angles_with_finite_period": finite_T,
               "angles_with_conjugate_point": n_sign,
               "angles_even_multiplicity_suspect": n_only_min,
               "max_abs_rel_tc_vs_T": (None if not matched
                                       else float(np.max(np.abs(matched)))),
               "details": details}
        out["rows"].append(row)
        print(f"eps={e}: finite-T angles {finite_T}/{N_TH}, "
              f"conjugate points found {n_sign}/{N_TH}, "
              f"even-mult suspects {n_only_min}, "
              f"max|t_c/T - 1| = {row['max_abs_rel_tc_vs_T']}")

    (ROOT / "artifacts" / "r6_supercritical.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/r6_supercritical.json")


if __name__ == "__main__":
    main()
