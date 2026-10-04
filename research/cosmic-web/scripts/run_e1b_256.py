#!/usr/bin/env python3
"""E1b-256: resolution check of the gravity-field verdict.

Same physical setup as E1b (L = 128 h^-1 Mpc box, same galaxy densities,
same physical filter scales and r0), but at 256^3 so the voxel is
0.5 h^-1 Mpc and filament cross-sections are resolved. If the Hessian's
mass-coverage win was an artefact of unresolved (1-voxel-wide) filaments,
it should shrink or flip here.

Physical-scale mapping (voxels doubled): hessian sigma 3, lift cigars
(sig_par, sig_perp) = (12, 3) ["6 Mpc"] and (6, 3) ["3 Mpc"], spine budget
4800 vox, r0 = 6 vox.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines  # noqa: E402

N, L, D, TRUNC = 256, 128.0, 1.0, 2.0
N_TARGET = 4800
R0 = 6.0
SEEDS = list(range(1, 7))
LEVELS = [5000, 20000]

_AXES = lift.hemisphere_axes(42)


def lift_ridge(field, sig_par, sig_perp):
    U = lift.orientation_score(field, _AXES, sig_par, sig_perp)
    return spines.lifted_ridgeness(U)


def coverage(spine_pts, pos, r0=R0):
    if len(spine_pts) == 0:
        return 0.0
    return float((cKDTree(spine_pts).query(pos)[0] < r0).mean())


def run_seed(seed):
    t0 = time.time()
    rng = np.random.default_rng(seed)
    rho, pos = fields.zeldovich_box(N, L, D, rng, trunc=TRUNC)
    idx = (np.floor(pos).astype(int)) % N
    rp = rho[idx[:, 0], idx[:, 1], idx[:, 2]]
    band = (rp > 2) & (rp < 20)

    recs = []
    for n_gal in LEVELS:
        gal_field = fields.galaxy_field(pos, N, n_gal, rng, adaptive=True)
        ests = {
            "hessian": spines.hessian_ridgeness(gal_field, 3.0),
            "lift_3mpc": lift_ridge(gal_field, 6.0, 3.0),
            "lift_6mpc": lift_ridge(gal_field, 12.0, 3.0),
        }
        for mname, R in ests.items():
            pts = spines.skeleton_points(
                spines.extract_matched(R, N_TARGET, lo_frac=1.0))
            recs.append({"seed": seed, "n_gal": n_gal, "method": mname,
                         "mass_cov": coverage(pts, pos),
                         "band_cov": coverage(pts, pos[band])})
    print(f"seed {seed} done in {time.time()-t0:.0f}s")
    return recs


def main():
    t0 = time.time()
    with Pool(3) as pool:
        recs = [r for rs in pool.map(run_seed, SEEDS) for r in rs]
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e1b_256_results.json").write_text(
        json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    from scipy.stats import wilcoxon
    methods = ["hessian", "lift_3mpc", "lift_6mpc"]
    md = ["# E1b-256 — resolution check (0.5 h⁻¹Mpc voxels, filament "
          "cross-sections resolved)\n",
          f"Setup: {len(SEEDS)} truncated-ZA boxes, 256³ voxels over the "
          "same physical L=128 h⁻¹Mpc volume, physically matched scales "
          "(r₀=3 h⁻¹Mpc, spine budget 2400 h⁻¹Mpc). Band = 2<ρ<20.\n"]
    md.append("| n_gal | method | mass coverage | band coverage "
              "| Δband vs hessian (p) |")
    md.append("|---|---|---|---|---|")
    for n_gal in LEVELS:
        by = {m: {r["seed"]: r for r in recs
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in methods}
        for m in methods:
            c = np.array([by[m][s]["mass_cov"] for s in SEEDS])
            b = np.array([by[m][s]["band_cov"] for s in SEEDS])
            if m == "hessian":
                cell = "—"
            else:
                d = np.array([by[m][s]["band_cov"] - by["hessian"][s]["band_cov"]
                              for s in SEEDS])
                cell = f"{d.mean():+.4f} ({wilcoxon(d).pvalue:.2g})"
            md.append(f"| {n_gal} | {m} | {c.mean():.4f} ± {c.std():.4f} "
                      f"| {b.mean():.4f} ± {b.std():.4f} | {cell} |")
    out = ROOT / "docs" / "E1b-256-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
