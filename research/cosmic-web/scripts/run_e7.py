#!/usr/bin/env python3
"""E7: the model card's last two unverified scope rows.

H-LCDM   : the frozen model's advantage persists under real-universe
           expansion (flat LCDM, Omega_m = 0.31) — 3 held-out seeds, 128^3.
H-highres: it persists at 0.5 Mpc/h voxels (N = 256, same physical box,
           EdS) — one seed (smoke-level, indicative).

All knobs frozen (beta = 0.6, frame smoothing 2 Mpc/h, rho_c = 5). The
effective models are parametrized by the growth factor D directly, so
cosmology enters only through the truth run and the a<->D mapping; the
web bin is defined in physical Mpc/h (< 2). Report -> docs/E7-report.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, pm, spines  # noqa: E402

D_STEPS = np.arange(0.10, 1.0001, 0.05)
BETA, SMOOTH_MPC, RHO_C = 0.6, 2.0, 5.0
_AXES = lift.hemisphere_axes(42)

JOBS = [
    dict(name="lcdm_s4", N=128, L=128.0, omega_m=0.31, seed=4),
    dict(name="lcdm_s5", N=128, L=128.0, omega_m=0.31, seed=5),
    dict(name="lcdm_s6", N=128, L=128.0, omega_m=0.31, seed=6),
    dict(name="hires_s4", N=256, L=128.0, omega_m=1.0, seed=4),
]


def gather_g(grid, pos, N):
    return map_coordinates(grid, [pos[:, 0] % N, pos[:, 1] % N,
                                  pos[:, 2] % N], order=1, mode="wrap")


def evolve_frozen(q_grid, psi_full, N, vox_mpc):
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
            e3f = fields.tidal_frame(clean, smooth=SMOOTH_MPC / vox_mpc)
        hit = (~crossed) & (gather_g(rho, x, N) > RHO_C)
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
            par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
            v[hit] = par + (1 - BETA) * (v[hit] - par)
            crossed |= hit
    return x


def run_job(job):
    t0 = time.time()
    N, L = job["N"], job["L"]
    vox = L / N
    rng = np.random.default_rng(job["seed"])
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, L, rng, n_steps=90, track=50000, omega_m=job["omega_m"])
    seedseq = np.random.default_rng(job["seed"]).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, L, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, L, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    truth = tpos[-1].astype(float)
    clean = gaussian_filter(np.log1p(fields.cic_deposit(x_pm, N)), 1.0,
                            mode="wrap")
    n_spine = int(2400 / vox)  # constant physical spine budget
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(lift.orientation_score(clean, _AXES,
                                                       6.0 / vox, 1.5 / vox)),
        n_spine, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0] * vox   # physical Mpc/h
    web = d_spine < 2.0

    rec = {"name": job["name"], "vox": vox}
    xz = (q_tr + D_STEPS[-1] * psi_tr) % N
    for name, xm in [("za", xz),
                     ("model", evolve_frozen(pos_q, psi_full, N, vox)[tidx])]:
        err = xm - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1) * vox    # physical Mpc/h
        rec[f"{name}_all"] = float(np.median(err))
        rec[f"{name}_web"] = float(np.median(err[web]))
    rec["runtime_s"] = round(time.time() - t0)
    print(f"  {job['name']}: ZA {rec['za_all']:.2f} model "
          f"{rec['model_all']:.2f} Mpc/h [{rec['runtime_s']}s]")
    return rec


def main():
    t0 = time.time()
    with Pool(4) as pool:
        recs = pool.map(run_job, JOBS)
    print(f"total {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e7_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    md = ["# E7 — final scope rows: LCDM dynamics and sub-Mpc resolution\n",
          "Frozen knobs throughout; errors in PHYSICAL Mpc/h; web = within "
          "2 Mpc/h of the spine network.\n"]
    md.append("| run | voxel (Mpc/h) | ZA all | model all | Δ all "
              "| ZA web | model web | Δ web |")
    md.append("|---|---|---|---|---|---|---|---|")
    lcdm = [r for r in recs if r["name"].startswith("lcdm")]
    za = np.mean([r["za_all"] for r in lcdm])
    mo = np.mean([r["model_all"] for r in lcdm])
    zw = np.mean([r["za_web"] for r in lcdm])
    mw = np.mean([r["model_web"] for r in lcdm])
    md.append(f"| LCDM Ωm=0.31 (3 seeds) | 1.0 | {za:.2f} | {mo:.2f} "
              f"| **{100*(mo-za)/za:+.0f}%** | {zw:.2f} | {mw:.2f} "
              f"| **{100*(mw-zw)/zw:+.0f}%** |")
    hi = [r for r in recs if r["name"].startswith("hires")][0]
    md.append(f"| EdS 0.5 Mpc vox (1 seed) | 0.5 | {hi['za_all']:.2f} "
              f"| {hi['model_all']:.2f} "
              f"| **{100*(hi['model_all']-hi['za_all'])/hi['za_all']:+.0f}%** "
              f"| {hi['za_web']:.2f} | {hi['model_web']:.2f} "
              f"| **{100*(hi['model_web']-hi['za_web'])/hi['za_web']:+.0f}%** |")
    out = ROOT / "docs" / "E7-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[2:]))


if __name__ == "__main__":
    main()
