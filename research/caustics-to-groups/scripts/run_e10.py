#!/usr/bin/env python3
"""E10 - what singularity does the exponential map have at a generic first-conjugate
point? (evidence for the "local caustics are group-blind" premise, Part 1 / appendix C2)

Arnol'd's ADE theorem classifies the stable singularities of GENERIC Lagrangian maps.
A left-invariant sub-Riemannian exponential map is one specific, highly symmetric
Lagrangian map, so "its caustic germs are the ADE ones" is a hypothesis to be checked
group by group, not a corollary. This script checks the simplest case numerically: is
the first conjugate point along a randomly chosen normal geodesic a FOLD (A2)?

Setup. E(p) = endpoint at time 1 of the normal geodesic from the identity with initial
covector p in R^n (n = dim G). The Hamiltonian is quadratic, so E(t*h0) is the geodesic
of h0 at time t. DE(p) is the n x n Jacobian (central finite differences).

Whitney/Morin fold criterion at a critical point p* (det DE = 0), all three required:
  (i)   corank 1:           singular values s_1 >= ... >= s_n of DE; s_n = 0, s_{n-1} > 0
                            reported as gap = s_{n-1}/s_1 (and residual s_n/s_1)
  (ii)  smooth critical set: grad(det DE)(p*) != 0
                            reported as grad_sigma_min = |grad det| / (s_1...s_{n-1}),
                            the gradient norm of the smallest signed singular value
  (iii) kernel transverse:  v = ker DE(p*) is NOT tangent to {det DE = 0}
                            reported as transversality = |grad det . v| / |grad det|
                            (cosine of the angle between the kernel and the normal to the
                            critical hypersurface; 0 = tangent = not a fold)

Sample: N_COV random covectors per group (unit horizontal part, vertical momenta of
magnitude uniform in [1, 3], random sign; seed 0), first sign change of det DE(t*h0)
for t in (T_LO, T_MAX]. Random covectors miss the measure-zero abnormal set and the
pole t = 0 is excluded, i.e. this probes exactly the regime where the theorem could
apply. Heisenberg is the pre-registered NEGATIVE control: its first conjugate locus is
the collapsed z-axis (rotational symmetry), the kernel is the rotation direction and is
tangent to the critical set, so transversality must come out 0 - not a fold.

Usage: run_e10.py [--quick]
Results -> artifacts/e10_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402

QUICK = "--quick" in sys.argv
GROUPS = ["Heisenberg", "SE(2)", "Engel", "Cartan"]
N_COV = 6 if QUICK else 24
SEED = 0
T_LO, T_MAX, N_SCAN = 0.3, 12.0, 240
N_REFINE, REFINE_PTS = 4, 33          # bracket shrinks by 32x per round
STEPS = 4000                          # RK4 steps over unit time (speed <= T_MAX)
H_FD = 1e-4                           # finite-difference step for DE
H_DIR = 1e-3                          # step for derivatives of det DE
FOLD_TOL = 1e-3                       # transversality above this -> fold. Calibrated on
                                      # the Heisenberg control, whose exact value is 0 and
                                      # which measures ~1e-7 (the numerical floor)
CORANK_TOL = 100.0                    # corank 1 iff s_{n-1} > CORANK_TOL * s_n


def jacobians(spec, P):
    """DE at each row of P (m, n) -> (m, n, n), central differences, one batch."""
    m, n = P.shape
    e = np.eye(n) * H_FD
    pert = np.concatenate([P[:, None, :] + e[None], P[:, None, :] - e[None]], axis=1)
    ends = liegroup.geodesic_batch(spec, pert.reshape(-1, n), np.array([1.0]),
                                   steps_per_unit=STEPS)[:, 0, :].reshape(m, 2 * n, n)
    return np.swapaxes((ends[:, :n] - ends[:, n:]) / (2 * H_FD), 1, 2)


def dets(spec, P):
    return np.linalg.det(jacobians(spec, P))


def first_conjugate(spec, H0):
    """First zero of det DE(t*h0) per covector (nan if none below T_MAX)."""
    k, n = H0.shape
    lo, hi = np.full(k, np.nan), np.full(k, np.nan)
    ts = np.linspace(T_LO, T_MAX, N_SCAN)
    for rnd in range(1 + N_REFINE):
        if rnd:   # refine inside the current bracket
            ok = ~np.isnan(lo)
            T = np.where(ok[:, None], lo[:, None] + (hi - lo)[:, None]
                         * np.linspace(0, 1, REFINE_PTS)[None], 1.0)
        else:
            T = np.tile(ts, (k, 1))
        D = dets(spec, (T[:, :, None] * H0[:, None, :]).reshape(-1, n)).reshape(T.shape)
        for i in range(k):
            if rnd and np.isnan(lo[i]):
                continue
            idx = np.where(np.sign(D[i, :-1]) * np.sign(D[i, 1:]) < 0)[0]
            if idx.size:
                lo[i], hi[i] = T[i, idx[0]], T[i, idx[0] + 1]
            elif not rnd:
                lo[i] = hi[i] = np.nan
    return 0.5 * (lo + hi)


def fold_diagnostics(spec, P):
    """Criteria (i)-(iii) at critical points P (m, n)."""
    m, n = P.shape
    U, S, Vt = np.linalg.svd(jacobians(spec, P))
    v = Vt[:, -1, :]                                   # kernel direction
    e = np.eye(n) * H_DIR
    pert = np.concatenate([P[:, None, :] + e[None], P[:, None, :] - e[None]], axis=1)
    d = dets(spec, pert.reshape(-1, n)).reshape(m, 2 * n)
    grad = (d[:, :n] - d[:, n:]) / (2 * H_DIR)
    gnorm = np.linalg.norm(grad, axis=1)
    return {
        "gap": S[:, -2] / S[:, 0],
        "residual": S[:, -1] / S[:, 0],
        "grad_sigma_min": gnorm / np.prod(S[:, :-1], axis=1),
        "transversality": np.abs((grad * v).sum(1)) / gnorm,
    }


def summarize(x):
    return {"min": float(np.min(x)), "median": float(np.median(x)), "max": float(np.max(x))}


def main():
    res = {"n_cov": N_COV, "seed": SEED, "t_scan": [T_LO, T_MAX, N_SCAN],
           "rk4_steps": STEPS, "h_fd": H_FD, "h_dir": H_DIR, "fold_tol": FOLD_TOL, "corank_tol": CORANK_TOL,
           "groups": {}}
    print("== E10: singularity type at the first conjugate point of a random geodesic ==")
    print(f"{'group':<11}{'found':>7}{'t_c med':>9}{'gap min':>10}{'s_n/s_1 max':>13}"
          f"{'|d sig_n| min':>15}{'transv. min':>13}{'median':>10}{'max':>10}{'folds':>8}")
    for g in GROUPS:
        spec = liegroup.GROUPS[g]
        rng = np.random.default_rng(SEED)
        n, nh = spec.dim, len(spec.horiz)
        H0 = np.zeros((N_COV, n))
        hor = rng.standard_normal((N_COV, nh))
        H0[:, list(spec.horiz)] = hor / np.linalg.norm(hor, axis=1, keepdims=True)
        vert = [i for i in range(n) if i not in spec.horiz]
        H0[:, vert] = rng.uniform(1, 3, (N_COV, len(vert))) * rng.choice([-1.0, 1.0],
                                                                         (N_COV, len(vert)))
        tc = first_conjugate(spec, H0)
        ok = ~np.isnan(tc)
        diag = fold_diagnostics(spec, tc[ok, None] * H0[ok])
        n_corank1 = int((diag["gap"] > CORANK_TOL * diag["residual"]).sum())
        n_fold = int(((diag["transversality"] > FOLD_TOL)
                      & (diag["gap"] > CORANK_TOL * diag["residual"])).sum())
        res["groups"][g] = {
            "n_found": int(ok.sum()), "n_corank1": n_corank1, "n_fold": n_fold,
            "t_conj": summarize(tc[ok]),
            **{k: summarize(v) for k, v in diag.items()},
            "per_covector": {"t_conj": tc[ok].tolist(),
                             **{k: v.tolist() for k, v in diag.items()}},
        }
        print(f"{g:<11}{ok.sum():>4}/{N_COV:<2}{np.median(tc[ok]):>9.3f}"
              f"{diag['gap'].min():>10.4f}{diag['residual'].max():>13.1e}"
              f"{diag['grad_sigma_min'].min():>15.3f}{diag['transversality'].min():>13.1e}"
              f"{np.median(diag['transversality']):>10.1e}{diag['transversality'].max():>10.1e}"
              f"{n_fold:>5}/{ok.sum()}")

    out = ROOT / "artifacts" / "e10_results.json"
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")

    # negative control: the detector must be able to say "not a fold"
    assert res["groups"]["Heisenberg"]["n_fold"] == 0, "Heisenberg axis misread as a fold"


if __name__ == "__main__":
    main()
