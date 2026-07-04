#!/usr/bin/env python3
"""E4 (H4'): is the CORRECTION to flat transport organized by the lifted
geometry?

Reframing (user): the lifted geometry was never meant to replace the
standard description, but to be an adjustment term on top of it. T1 shows
the leading-order law is flat optimal transport (Zel'dovich + sticking);
the testable question is whether the RESIDUAL — true N-body transport minus
the ZA baseline from the same initial conditions — is anisotropic in the
tidal frame, preferentially along the filament axis e3, growing toward the
web.

Measurements (per PM sim, tracked particles, at a = 1):
  R  = x_true - x_ZA          (residual displacement, periodic-aware)
  Rv = v_true - v_ZA          (residual velocity; v_ZA = dD/dtau * psi)
  M-E4a: <(R_hat  . e3)^2> per distance-to-spine bin (null 1/3)
  M-E4b: <(Rv_hat . e3)^2> per bin (null 1/3)
  M-E4c: effect size — RMS parallel vs RMS transverse (per-axis) residual
         near the web vs far: the measured 'geometry adjustment' amplitude.
Errors: jackknife over sims. Report -> docs/E4-report.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, pm, spines  # noqa: E402

N, L = 128, 128.0
SEEDS = [1, 2, 3, 4, 5, 6]
D_BINS = [(0, 2), (2, 4), (4, 8), (8, 16), (16, 64)]
A_FINAL = 1.0
_AXES = lift.hemisphere_axes(42)


def lifted_spines(field):
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    return spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(U), 2400, lo_frac=1.0))


def e3_at(e3, pts):
    idx = np.clip(np.round(pts).astype(int), 0, N - 1) % N
    return e3[idx[:, 0], idx[:, 1], idx[:, 2]]


def par_frac(vecs, e3v, floor=1e-3):
    nrm = np.linalg.norm(vecs, axis=1)
    ok = nrm > floor
    h = vecs[ok] / nrm[ok, None]
    return np.sum(h * e3v[ok], axis=1) ** 2, ok


def run_seed(seed):
    rng = np.random.default_rng(seed)
    x, v, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(N, L, rng, n_steps=90,
                                                   track=50000)
    a = ta[-1]
    # ZA baseline for the SAME particles at final a (D = a in EdS):
    x_za = (q_tr + a * psi_tr) % N
    # ZA velocity in pm's convention (vel = p/a, ZA momentum p = a^{3/2} psi):
    v_za = np.sqrt(a) * psi_tr

    x_true = tpos[-1].astype(float)
    R = x_true - x_za
    R -= N * np.round(R / N)
    Rv = v[tidx] - v_za

    rho = fields.cic_deposit(x, N)
    clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
    e3 = fields.tidal_frame(clean)
    d_spine = cKDTree(lifted_spines(clean)).query(x_true)[0]
    e3v = e3_at(e3, x_true)

    pfR, okR = par_frac(R, e3v, floor=0.1)
    pfV, okV = par_frac(Rv, e3v, floor=1e-4)
    # per-axis RMS decomposition of R
    par_comp = np.sum(R * e3v, axis=1)
    perp2 = np.maximum(np.sum(R * R, axis=1) - par_comp ** 2, 0)

    rec = {"seed": seed, "a_final": float(a)}
    for lo, hi in D_BINS:
        m = (d_spine >= lo) & (d_spine < hi)
        rec[f"pfR_{lo}_{hi}"] = float(pfR[m[okR]].mean())
        rec[f"pfV_{lo}_{hi}"] = float(pfV[m[okV]].mean())
        rec[f"rmsPar_{lo}_{hi}"] = float(np.sqrt(np.mean(par_comp[m] ** 2)))
        rec[f"rmsPerp_{lo}_{hi}"] = float(np.sqrt(np.mean(perp2[m]) / 2))
        rec[f"rmsR_{lo}_{hi}"] = float(np.sqrt(np.mean(np.sum(R[m]**2, 1))))
        rec[f"n_{lo}_{hi}"] = int(m.sum())
    return rec


def jk(vals):
    v = np.array(vals)
    k = len(v)
    means = np.array([np.delete(v, i).mean() for i in range(k)])
    return float(v.mean()), float(np.sqrt((k - 1) / k *
                                          np.sum((means - means.mean()) ** 2)))


def main():
    t0 = time.time()
    with Pool(6) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(SEEDS)} sims in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e4_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    md = ["# E4 (H4') — the geometry-adjustment term on top of flat transport\n",
          f"Setup: {len(SEEDS)} PM sims (128³, EdS), 50k tracked particles "
          "each. Baseline: the Zel'dovich prediction for the SAME particle "
          "from the same initial conditions. R = true − ZA displacement at "
          "a=1; Rv = true − ZA velocity. If the lifted geometry is a valid "
          "adjustment term, R and Rv should point preferentially along the "
          "filament axis e3 near the web (null 1/3) with amplitude growing "
          "toward spines.\n"]
    md.append("| d to spine (vox) | n/seed | ⟨(R̂·e3)²⟩ | ⟨(R̂v·e3)²⟩ "
              "| RMS R∥ (vox) | RMS R⊥/axis | anisotropy R∥/R⊥ |")
    md.append("|---|---|---|---|---|---|---|")
    for lo, hi in D_BINS:
        a, ae = jk([r[f"pfR_{lo}_{hi}"] for r in recs])
        b, be = jk([r[f"pfV_{lo}_{hi}"] for r in recs])
        rp, _ = jk([r[f"rmsPar_{lo}_{hi}"] for r in recs])
        rt, _ = jk([r[f"rmsPerp_{lo}_{hi}"] for r in recs])
        n = int(np.mean([r[f"n_{lo}_{hi}"] for r in recs]))
        md.append(f"| {lo}–{hi} | {n} | {a:.3f} ± {ae:.3f} "
                  f"| {b:.3f} ± {be:.3f} | {rp:.2f} | {rt:.2f} "
                  f"| **{rp/rt:.2f}** |")
    md.append("\nNull for the direction statistics: 1/3 (isotropic). "
              "R∥/R⊥ = 1 means the correction is isotropic; > 1 means the "
              "residual transport is preferentially along the filament "
              "axis — the measured size of the geometry adjustment.\n")
    out = ROOT / "docs" / "E4-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
