#!/usr/bin/env python3
"""E5 (H-T2): does the tidal-frame TRANSVERSE damping term improve the model?

E4 measured the correction that flat (Zel'dovich) transport needs: large,
tidal-frame-organized, and transverse. This experiment builds that
correction into an effective model and tests it head-to-head:

  M0  plain ZA          x(D) = q + D psi, no interaction ever
  M1  isotropic stick   at first shell-crossing, all momentum -> 0
  M2  transverse damp   at first shell-crossing, remove the e1/e2
                        components of the velocity in the LOCAL tidal
                        frame; keep the e3 (along-filament) component

All three are evolved from the same initial conditions as a PM N-body run
(the truth), and scored per particle:
  M-E5a: median |x_model - x_PM| at a=1, binned by distance to the web
  M-E5b: velocity-direction fidelity <v_hat_model . v_hat_PM> near the web

Shell-crossing proxy: first time the local (ZA-evolved) density at the
particle exceeds rho_c; rho_c is calibrated on seed 1 by optimizing M1
(the ESTABLISHED model), then frozen — so the tuning favours the
competitor, not our candidate. Report -> docs/E5-report.md.
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

N, L = 128, 128.0
SEEDS = [1, 2, 3, 4, 5, 6]
D_STEPS = np.arange(0.10, 1.0001, 0.05)
FRAME_EVERY = 3                      # recompute tidal frame every k steps
D_BINS = [(0, 2), (2, 4), (4, 8), (8, 64)]
RHO_GRID = [2.0, 3.0, 5.0]
_AXES = lift.hemisphere_axes(42)


def za_density(q_grid, psi_full, D):
    return fields.cic_deposit((q_grid + D * psi_full) % N, N)


def gather(grid, pos):
    return map_coordinates(grid, [pos[:, 0] % N, pos[:, 1] % N,
                                  pos[:, 2] % N], order=1, mode="wrap")


def evolve(q_tr, psi_tr, q_grid, psi_full, rho_c, mode):
    """Evolve tracked particles under one effective model."""
    x = (q_tr + D_STEPS[0] * psi_tr) % N
    v = psi_tr.copy()                       # dx/dD
    crossed = np.zeros(len(x), bool)
    frame = None
    for i in range(1, len(D_STEPS)):
        D = D_STEPS[i]
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        if mode == "za":
            continue
        rho = za_density(q_grid, psi_full, D)
        if frame is None or i % FRAME_EVERY == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3 = fields.tidal_frame(clean)
        new = (~crossed) & (gather(rho, x) > rho_c)
        if new.any():
            if mode == "stick":
                v[new] = 0.0
            else:                            # transverse damp: keep e3 part
                idx = np.clip(np.round(x[new]).astype(int), 0, N - 1) % N
                e = e3[idx[:, 0], idx[:, 1], idx[:, 2]]
                v[new] = e * np.sum(v[new] * e, axis=1, keepdims=True)
            crossed |= new
    return x


def run_seed(args):
    seed, rho_c = args
    rng = np.random.default_rng(seed)
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, L, rng, n_steps=90, track=50000)
    # full-set ZA ingredients (regenerate deterministically, as pm does)
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, L, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, L, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    truth = tpos[-1].astype(float)
    clean = gaussian_filter(np.log1p(fields.cic_deposit(x_pm, N)), 1.0,
                            mode="wrap")
    U = lift.orientation_score(clean, _AXES, 6.0, 1.5)
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(U), 2400, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0]
    vt = v_pm[tidx]
    vt_hat = vt / np.maximum(np.linalg.norm(vt, axis=1, keepdims=True), 1e-12)

    rec = {"seed": seed, "rho_c": rho_c}
    for mode in ("za", "stick", "damp"):
        xm = evolve(q_tr, psi_tr, pos_q, psi_full, rho_c, mode)
        err = xm - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        for lo, hi in D_BINS:
            m = (d_spine >= lo) & (d_spine < hi)
            rec[f"{mode}_err_{lo}_{hi}"] = float(np.median(err[m]))
        rec[f"{mode}_err_all"] = float(np.median(err))
    return rec


def calibrate_rho():
    """Pick rho_c minimizing the ISOTROPIC-stick model's error on seed 1."""
    best, best_err = RHO_GRID[0], np.inf
    for rho_c in RHO_GRID:
        rec = run_seed((1, rho_c))
        e = rec["stick_err_all"]
        print(f"  cal rho_c={rho_c}: stick median err {e:.2f}")
        if e < best_err:
            best, best_err = rho_c, e
    print(f"  -> rho_c = {best}")
    return best


def main():
    t0 = time.time()
    print("calibrating rho_c on seed 1 (optimizing the competitor)...")
    rho_c = calibrate_rho()
    with Pool(5) as pool:
        recs = pool.map(run_seed, [(s, rho_c) for s in SEEDS[1:]])
    print(f"{len(recs)} eval sims in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e5_results.json").write_text(json.dumps(
        {"rho_c": rho_c, "results": recs}, indent=1))
    report(recs, rho_c)


def jk(vals):
    v = np.array(vals); k = len(v)
    means = np.array([np.delete(v, i).mean() for i in range(k)])
    return float(v.mean()), float(np.sqrt((k - 1) / k *
                                          np.sum((means - means.mean())**2)))


def report(recs, rho_c):
    md = ["# E5 (H-T2) — transverse-damping adjustment vs ZA and isotropic "
          "sticking\n",
          f"Effective models evolved from PM initial conditions "
          f"(rho_c = {rho_c}, calibrated on seed 1 by optimizing the "
          f"ISOTROPIC competitor; {len(recs)} held-out seeds). Score: "
          "median per-particle distance to the PM-truth position at a=1 "
          "(voxels = h⁻¹Mpc), binned by distance to the web.\n"]
    md.append("| d to spine (vox) | ZA | isotropic stick | transverse damp "
              "| damp vs ZA | damp vs stick |")
    md.append("|---|---|---|---|---|---|")
    for key in [f"{lo}_{hi}" for lo, hi in D_BINS] + ["all"]:
        za, zae = jk([r[f"za_err_{key}"] for r in recs])
        st, ste = jk([r[f"stick_err_{key}"] for r in recs])
        dm, dme = jk([r[f"damp_err_{key}"] for r in recs])
        lab = key.replace("_", "–") if key != "all" else "**all**"
        md.append(f"| {lab} | {za:.2f} ± {zae:.2f} | {st:.2f} ± {ste:.2f} "
                  f"| {dm:.2f} ± {dme:.2f} | {100*(dm-za)/za:+.0f}% "
                  f"| {100*(dm-st)/st:+.0f}% |")
    md.append("\nReading: negative percentages mean the transverse-damping "
              "model is closer to the N-body truth. H-T2 asks for damp < "
              "ZA (the adjustment helps) and damp <= stick (keeping the "
              "along-filament component does not hurt, unlike full "
              "sticking).\n")
    out = ROOT / "docs" / "E5-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
