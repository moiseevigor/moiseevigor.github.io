#!/usr/bin/env python3
"""E6 (H-transfer): does the frozen model transfer without re-calibration?

The model card declares the recipe (beta=0.6, 2 Mpc/h frames, rho_c=5)
tested only at 1 Mpc/h voxels, sigma8=0.8. Three transfer conditions, all
knobs FROZEN:

  coarse : L=256 Mpc/h on the same 128^3 grid (2 Mpc/h voxels)
  s8lo   : sigma8 = 0.6 (weaker clustering)
  s8hi   : sigma8 = 1.0 (stronger clustering)

Per condition, seeds {4,5,6} (held-out family): PM truth, ZA baseline,
frozen model. Metric: overall median per-particle error and the 0-2 vox
web bin. Success: the model's advantage over ZA persists (negative delta)
in every condition. Report -> docs/E6-report.md.
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
sys.path.insert(0, str(ROOT / "scripts"))

import fields, lift, pm, spines  # noqa: E402
from run_e5 import D_STEPS, N, gather, jk  # noqa: E402

SEEDS = [4, 5, 6]
BETA, SMOOTH, RHO_C = 0.6, 2.0, 5.0
CONDITIONS = {
    "base":   dict(L=128.0, sigma8=0.8),   # reference; matches E5d setup
    "coarse": dict(L=256.0, sigma8=0.8),
    "s8lo":   dict(L=128.0, sigma8=0.6),
    "s8hi":   dict(L=128.0, sigma8=1.0),
}
_AXES = lift.hemisphere_axes(42)


def evolve_frozen(q_grid, psi_full):
    x = (q_grid + D_STEPS[0] * psi_full) % N
    v = psi_full.copy()
    crossed = np.zeros(len(x), bool)
    e3f = None
    for i in range(1, len(D_STEPS)):
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        rho = fields.cic_deposit(x, N)
        if e3f is None or i % 3 == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3f = fields.tidal_frame(clean, smooth=SMOOTH)
        hit = (~crossed) & (gather(rho, x) > RHO_C)
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
            par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
            v[hit] = par + (1 - BETA) * (v[hit] - par)
            crossed |= hit
    return x


def run_job(args):
    cond, seed = args
    cfg = CONDITIONS[cond]
    rng = np.random.default_rng(seed)
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, cfg["L"], rng, n_steps=90, track=50000, sigma8=cfg["sigma8"])
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, cfg["L"], 0.0,
                                    np.random.default_rng(seedseq),
                                    sigma8=cfg["sigma8"])
    _, pos_d = fields.zeldovich_box(N, cfg["L"], 1.0,
                                    np.random.default_rng(seedseq),
                                    sigma8=cfg["sigma8"])
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    truth = tpos[-1].astype(float)
    clean = gaussian_filter(np.log1p(fields.cic_deposit(x_pm, N)), 1.0,
                            mode="wrap")
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(lift.orientation_score(clean, _AXES, 6.0, 1.5)),
        2400, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0]
    web = d_spine < 2.0

    rec = {"cond": cond, "seed": seed}
    xz = (q_tr + D_STEPS[-1] * psi_tr) % N
    for name, xm in [("za", xz), ("model", evolve_frozen(pos_q, psi_full)[tidx])]:
        err = xm - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        rec[f"{name}_all"] = float(np.median(err))
        rec[f"{name}_web"] = float(np.median(err[web]))
    return rec


def main():
    t0 = time.time()
    jobs = [(c, s) for c in CONDITIONS for s in SEEDS]
    with Pool(6) as pool:
        recs = pool.map(run_job, jobs)
    print(f"{len(jobs)} jobs in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e6_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    md = ["# E6 — transfer test of the frozen model (no re-calibration)\n",
          f"Recipe frozen at β={BETA}, frame smoothing {SMOOTH} Mpc/h, "
          f"ρ_c={RHO_C}; {len(SEEDS)} held-out seeds per condition. "
          "Voxel sizes differ across conditions, so compare the RELATIVE "
          "advantage over ZA, not absolute voxel errors.\n"]
    md.append("| condition | ZA all | model all | Δ all | ZA web | "
              "model web | Δ web |")
    md.append("|---|---|---|---|---|---|---|")
    for cond in CONDITIONS:
        rs = [r for r in recs if r["cond"] == cond]
        za, _ = jk([r["za_all"] for r in rs])
        mo, _ = jk([r["model_all"] for r in rs])
        zw, _ = jk([r["za_web"] for r in rs])
        mw, _ = jk([r["model_web"] for r in rs])
        md.append(f"| {cond} | {za:.2f} | {mo:.2f} | "
                  f"**{100*(mo-za)/za:+.0f}%** | {zw:.2f} | {mw:.2f} | "
                  f"**{100*(mw-zw)/zw:+.0f}%** |")
    md.append("\nSuccess criterion: Δ ≤ 0 in every condition (advantage "
              "persists with frozen knobs). Degradation localizes which "
              "parameter is condition-dependent.\n")
    out = ROOT / "docs" / "E6-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
