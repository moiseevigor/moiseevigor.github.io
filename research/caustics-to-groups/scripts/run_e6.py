#!/usr/bin/env python3
"""E6 - the local symmetry group of the cosmic web, validated against Doroshkevich (1970).

Phase B of docs/PLAN-astrophysics-local-groups.md. The programme's FIRST external
validation: every prediction tested here is an analytic result from the literature that
we did not generate.

The local "group" of the cosmic web is the isotropy (stabilizer) group of the
deformation tensor, fixed by its eigenvalue degeneracy:

    l1 > l2 > l3   -> discrete (triaxial)           generic
    two equal      -> continuous SO(2)              umbilic / D4 locus
    all three equal-> SO(3)                         isolated, higher codim

Feldbrugge et al. (2018), read from the source: caustic conditions are stated in
LAGRANGIAN space; A2 fold (1+mu_i=0) -> walls; A3 cusp (fold + v_i.grad mu_i = 0) ->
filaments; A4 -> cluster nodes; D4 umbilic is *corank 2* -- TWO eigenvalue fields at
the fold simultaneously, i.e. degeneracy AND fold.

External predictions tested (Doroshkevich 1970):
  P1  <T_ij T_kl> = (s^2/15)(d_ij d_kl + d_ik d_jl + d_il d_jk)
      => Var(T_00)/s^2 = 1/5,  Var(T_01)/s^2 = 1/15,  trace(T) = delta.
  P2  the eigenvalue density carries a Vandermonde factor prod_{i<j}(l_i - l_j),
      so measured eigenvalues must match the theory ensemble (KS test).
  P3  Vandermonde => EIGENVALUE REPULSION: p(min gap = s) ~ s^1 as s->0,
      hence P(min gap < s) ~ s^2, i.e. the SO(2) stratum has CODIMENSION 2 (curves).

Usage: run_e6.py [--quick]
Results -> artifacts/e6_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.stats import ks_2samp

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import grf  # noqa: E402

QUICK = "--quick" in sys.argv
N = 64 if QUICK else 96
L = float(N)


def fit_loglog(x, y):
    m = (x > 0) & (y > 0)
    return float(np.polyfit(np.log(x[m]), np.log(y[m]), 1)[0])


def main():
    rng = np.random.default_rng(0)
    res = {"N": N, "L": L}

    print(f"== building Gaussian random field ({N}^3) and its deformation tensor ==")
    delta, kvecs, k2, dk = grf.gaussian_field(N, L, rng, n_index=0.0, r_smooth=1.2)
    T = grf.deformation_tensor(dk, kvecs, k2)
    sigma = float(delta.std())
    print(f"  sigma = <delta^2>^1/2 = {sigma:.5f}")

    # ---- P1: analytic covariance of a Gaussian Hessian (external check of our FFT)
    print("\n== P1: Doroshkevich covariance of the Hessian (analytic, published) ==")
    tr = np.trace(T, axis1=-2, axis2=-1)
    trace_err = float(np.abs(tr - delta).max() / sigma)
    v00 = float(T[..., 0, 0].var() / sigma ** 2)
    v01 = float(T[..., 0, 1].var() / sigma ** 2)
    print(f"  max|trace(T) - delta| / sigma = {trace_err:.2e}     (theory: 0)")
    print(f"  Var(T_00)/sigma^2 = {v00:.4f}   (theory 1/5  = 0.2000)")
    print(f"  Var(T_01)/sigma^2 = {v01:.4f}   (theory 1/15 = 0.0667)")
    res["P1"] = {"trace_err": trace_err, "var_T00": v00, "var_T01": v01,
                 "theory_var_T00": 0.2, "theory_var_T01": 1.0 / 15.0}
    assert trace_err < 1e-8, "trace(T) must equal delta"
    assert abs(v00 - 0.2) < 0.012 and abs(v01 - 1 / 15) < 0.004, "covariance off theory"
    print("  -> our FFT deformation tensor reproduces the analytic covariance. PASS")

    # ---- P2: eigenvalue distribution vs the theory ensemble
    print("\n== P2: eigenvalue distribution vs Doroshkevich theory ensemble ==")
    lam = grf.eigenvalues_sorted(T)                       # (N^3, 3) descending
    lam_th = grf.doroshkevich_sample(lam.shape[0], sigma, np.random.default_rng(1))
    ks = {}
    for i, nm in enumerate(["lambda1", "lambda2", "lambda3"]):
        d, p = ks_2samp(lam[:, i], lam_th[:, i])
        ks[nm] = {"D": float(d), "p": float(p),
                  "mean_measured": float(lam[:, i].mean() / sigma),
                  "mean_theory": float(lam_th[:, i].mean() / sigma)}
        print(f"  {nm}: KS D={d:.4f}   <l>/sigma measured {lam[:,i].mean()/sigma:+.4f}"
              f"  theory {lam_th[:,i].mean()/sigma:+.4f}")
    res["P2_ks"] = ks
    assert all(v["D"] < 0.03 for v in ks.values()), "eigenvalue law departs from theory"
    print("  -> measured eigenvalue law matches the 1970 prediction. PASS")

    # ---- P3: eigenvalue repulsion -> codimension of the SO(2) stratum
    print("\n== P3: eigenvalue repulsion (the Vandermonde) ==")
    g = grf.min_gap(lam) / sigma
    # no-repulsion null: three eigenvalues drawn independently from the pooled marginal
    pool = lam.flatten() / sigma
    idx = np.random.default_rng(2).integers(0, pool.size, size=(g.size, 3))
    null = np.sort(pool[idx], axis=1)[:, ::-1]
    g_null = np.minimum(null[:, 0] - null[:, 1], null[:, 1] - null[:, 2])

    edges = np.linspace(0, 0.20, 41)
    ctr = 0.5 * (edges[1:] + edges[:-1])
    h, _ = np.histogram(g, bins=edges, density=True)
    hn, _ = np.histogram(g_null, bins=edges, density=True)
    win = (ctr > 0.012) & (ctr < 0.10)   # the asymptotic s->0 regime
    alpha = fit_loglog(ctr[win], h[win])
    alpha_null = fit_loglog(ctr[win], hn[win])
    print(f"  p(min gap = s) ~ s^alpha :  measured alpha = {alpha:.3f}"
          f"   (theory 1.0, Vandermonde)")
    print(f"  no-repulsion null        :  alpha = {alpha_null:.3f}   "
          f"(does NOT vanish at s->0: no suppression)")

    # cumulative: P(min gap < s) ~ s^2  <=>  codimension 2
    ss = np.geomspace(0.02, 0.3, 12)
    cum = np.array([(g < s).mean() for s in ss])
    beta = fit_loglog(ss, cum)
    print(f"  P(min gap < s) ~ s^beta  :  measured beta = {beta:.3f}   (theory 2.0)")
    print(f"  => the SO(2)-isotropy (umbilic) stratum has codimension 2: it is a set of"
          f" CURVES in 3D Lagrangian space.")
    res["P3"] = {"alpha": alpha, "alpha_null": alpha_null, "beta": beta,
                 "theory_alpha": 1.0, "theory_beta": 2.0}
    assert abs(alpha - 1.0) < 0.15, "repulsion exponent off"
    assert alpha_null < 0.3, "null must show no repulsion (p(s) finite at 0)"
    assert abs(beta - 2.0) < 0.25, "codimension of degeneracy locus off"

    # ---- local-group census
    print("\n== local isotropy census (what fraction of space has a continuous group?) ==")
    for eps in [0.10, 0.03, 0.01]:
        f2 = float((g < eps).mean())
        print(f"  within {eps:>5.2f} sigma of SO(2) degeneracy: {f2:8.5%} of volume")
    res["census"] = {f"{e}": float((g < e).mean()) for e in [0.10, 0.03, 0.01]}
    print("  generic point: triaxial, discrete symmetry only.")
    print("  D4 umbilic = degeneracy AND fold (corank 2) -> codim 3 -> isolated POINTS.")

    out = ROOT / "artifacts" / "e6_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
