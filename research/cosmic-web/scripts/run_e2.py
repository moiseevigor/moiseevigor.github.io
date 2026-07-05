#!/usr/bin/env python3
"""E2 (H4-lite): do trajectories near filaments follow the lifted geometry?

The full H4 claim is that matter transport follows sub-Riemannian geodesics
of a metric that is cheap ALONG the local filament direction. Before any
geodesic machinery, two falsifiable dynamical prerequisites are measured on
PM N-body trajectories (method-neutral ground truth — no skeleton scoring):

P1 (flow anisotropy): near filament spines, velocity direction aligns with
   the tidal eigenvector e3 (the filament axis): <|v_hat . e3|> > 0.5 null,
   decaying with distance from the spine.

P2 (ballistic-correction direction): over a in [0.5, 1.0], the deviation of
   the true path from its straight chord is preferentially ALONG e3.
   Parallel fraction f = <(dev_hat . e3)^2> > 1/3 (isotropic null) near
   spines. If deviations are instead perpendicular (pure infall), an
   SR geodesic that bends along the filament CANNOT beat the chord, and H4
   fails at the premise level.

Results -> artifacts/e2_results.json, report -> docs/E2-report.md.
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
N_TARGET = 2400
SEEDS = [1, 2, 3, 4]
D_BINS = [(0, 2), (2, 4), (4, 8), (8, 16), (16, 64)]

_AXES = lift.hemisphere_axes(42)


def lifted_spines(field):
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    return spines.skeleton_points(
        spines.extract_matched(spines.lifted_ridgeness(U), N_TARGET,
                               lo_frac=1.0))


def e3_at(e3, pts):
    idx = np.clip(np.round(pts).astype(int), 0, N - 1) % N
    return e3[idx[:, 0], idx[:, 1], idx[:, 2]]


def run_seed(seed):
    t0 = time.time()
    rng = np.random.default_rng(seed)
    x, v, tidx, ta, tpos, _, _ = pm.pm_sim(N, L, rng, n_steps=90, track=50000)
    rho = fields.cic_deposit(x, N)
    clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
    e3 = fields.tidal_frame(clean)
    sp = lifted_spines(clean)
    tree = cKDTree(sp)

    # tracked-particle quantities
    p_end = tpos[-1].astype(float)
    d_spine = tree.query(p_end)[0]

    vv = v[tidx]
    vhat = vv / np.maximum(np.linalg.norm(vv, axis=1, keepdims=True), 1e-12)
    align_v = np.abs(np.sum(vhat * e3_at(e3, p_end), axis=1))

    # chord deviation over the tracked window (periodic-aware)
    p_start = tpos[0].astype(float)
    disp = p_end - p_start
    disp -= N * np.round(disp / N)
    mid_true = tpos[len(ta) // 2].astype(float)
    frac = (ta[len(ta) // 2] - ta[0]) / (ta[-1] - ta[0])
    mid_chord = p_start + frac * disp
    dev = mid_true - mid_chord
    dev -= N * np.round(dev / N)
    dev_norm = np.linalg.norm(dev, axis=1)
    ok = dev_norm > 0.1                      # ignore near-static particles
    devhat = dev[ok] / dev_norm[ok, None]
    par_frac = np.sum(devhat * e3_at(e3, mid_true[ok]), axis=1) ** 2

    rec = {"seed": seed, "runtime_s": round(time.time() - t0)}
    for lo, hi in D_BINS:
        m_all = (d_spine >= lo) & (d_spine < hi)
        m_dev = m_all[ok]
        rec[f"align_v_{lo}_{hi}"] = float(align_v[m_all].mean())
        rec[f"par_frac_{lo}_{hi}"] = float(par_frac[m_dev].mean())
        rec[f"dev_vox_{lo}_{hi}"] = float(dev_norm[m_all].mean())
        rec[f"n_{lo}_{hi}"] = int(m_all.sum())
    return rec


def main():
    t0 = time.time()
    with Pool(4) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(SEEDS)} PM sims in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e2_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    md = ["# E2 (H4-lite) — dynamics near filaments vs the lifted-geometry "
          "premise\n",
          f"Setup: {len(SEEDS)} PM N-body runs ({N}³ grid & particles, EdS, "
          "a: 0.1→1.0, 90 steps), 50k tracked particles per run over "
          "a ∈ [0.5, 1.0]. Spines: SE(3) lift on the final density; e3 = "
          "tidal minor eigenvector (filament axis). P1: mean |v̂·e3| at a=1 "
          "(null 0.5). P2: squared projection of the mid-path deviation "
          "from the straight chord onto e3 (null 1/3). dev = mean deviation "
          "magnitude (voxels = h⁻¹Mpc).\n"]
    md.append("| d to spine (vox) | n/seed | P1 ⟨\\|v̂·e3\\|⟩ | P2 ⟨(d̂ev·e3)²⟩ "
              "| ⟨\\|dev\\|⟩ vox |")
    md.append("|---|---|---|---|---|")
    for lo, hi in D_BINS:
        a = [r[f"align_v_{lo}_{hi}"] for r in recs]
        p = [r[f"par_frac_{lo}_{hi}"] for r in recs]
        d = [r[f"dev_vox_{lo}_{hi}"] for r in recs]
        n = int(np.mean([r[f"n_{lo}_{hi}"] for r in recs]))
        md.append(f"| {lo}–{hi} | {n} | {np.mean(a):.3f} ± {np.std(a):.3f} "
                  f"| {np.mean(p):.3f} ± {np.std(p):.3f} "
                  f"| {np.mean(d):.2f} |")
    md.append("\nNulls: P1 = 0.5, P2 = 1/3 ≈ 0.333 (isotropic). Values are "
              "across-seed mean ± sd; per-seed n is large so per-seed "
              "standard errors are negligible — seed scatter is the "
              "relevant uncertainty.\n")
    out = ROOT / "docs" / "E2-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[-10:]))


if __name__ == "__main__":
    main()
