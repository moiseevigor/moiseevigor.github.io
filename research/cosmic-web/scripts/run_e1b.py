#!/usr/bin/env python3
"""E1b: method-NEUTRAL H1 test on gravity fields + H2 upper bound.

E1's skeleton-vs-skeleton scoring collapsed to reference circularity. Here
the criterion needs no reference skeleton at all: at matched spine length,
which method's spine network captures more MASS (the actual particles)?

  M_mass(r0) = fraction of all 2.1M particles within r0 of the spine set.

Configs: hessian | lift b0 | lift b1_sparse (tidal frame from the sparse
field, as in E1) | lift b1_clean (tidal frame from the clean field — an
upper bound: is tidal information useful in principle, or only too noisy
when estimated from sparse data?).

Results -> artifacts/e1b_results.json, report -> docs/E1b-report.md.
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

import fields, spines  # noqa: E402
sys.path.insert(0, str(ROOT / "scripts"))
from run_e1 import lifted_ridgeness_weighted  # noqa: E402

N, L, D, TRUNC = 128, 128.0, 1.0, 2.0
N_TARGET = 2400
R0 = 3.0
SEEDS = list(range(1, 13))
LEVELS = [5000, 20000]


def mass_coverage(spine_pts, pos, r0=R0):
    if len(spine_pts) == 0:
        return 0.0
    d = cKDTree(spine_pts).query(pos)[0]
    return float((d < r0).mean())


def run_seed(seed):
    rng = np.random.default_rng(seed)
    rho, pos = fields.zeldovich_box(N, L, D, rng, trunc=TRUNC)
    clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
    e3_clean = fields.tidal_frame(clean)

    recs = []
    for n_gal in LEVELS:
        gal_field = fields.galaxy_field(pos, N, n_gal, rng, adaptive=True)
        e3_sparse = fields.tidal_frame(gal_field)
        ests = {
            "hessian": spines.hessian_ridgeness(gal_field, 1.5),
            "lift_b0": lifted_ridgeness_weighted(gal_field, None, 0.0),
            "lift_b1_sparse": lifted_ridgeness_weighted(gal_field, e3_sparse, 1.0),
            "lift_b1_clean": lifted_ridgeness_weighted(gal_field, e3_clean, 1.0),
        }
        for mname, R in ests.items():
            skel = spines.extract_matched(R, N_TARGET, lo_frac=1.0)
            pts = spines.skeleton_points(skel)
            recs.append({"seed": seed, "n_gal": n_gal, "method": mname,
                         "n_spine": len(pts),
                         "mass_cov": mass_coverage(pts, pos)})
    return recs


def main():
    t0 = time.time()
    with Pool(6) as pool:
        recs = [r for rs in pool.map(run_seed, SEEDS) for r in rs]
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e1b_results.json").write_text(
        json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    from scipy.stats import wilcoxon
    methods = ["hessian", "lift_b0", "lift_b1_sparse", "lift_b1_clean"]
    md = ["# E1b — method-neutral H1 on gravity fields: mass coverage at "
          "matched spine length\n",
          f"Setup: {len(SEEDS)} truncated-ZA boxes as in E1. Criterion "
          f"needs no reference skeleton: fraction of all {N}³ particles "
          f"within r₀={R0} vox of the spine set, spine length matched at "
          f"{N_TARGET} vox. Note the spine budget covers only ~"
          f"{N_TARGET * 4 * np.pi * R0 ** 2 / 3 / N ** 3 * 100:.0f}% of the "
          "volume if spread randomly — differences measure how well spines "
          "sit on mass.\n"]
    md.append("| n_gal | method | mass coverage | Δ vs hessian (p) "
              "| Δ vs lift_b0 (p) |")
    md.append("|---|---|---|---|---|")
    for n_gal in LEVELS:
        by = {m: {r["seed"]: r["mass_cov"] for r in recs
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in methods}
        for m in methods:
            c = np.array([by[m][s] for s in SEEDS])
            cells = []
            for refm in ("hessian", "lift_b0"):
                if m == refm:
                    cells.append("—")
                    continue
                d = np.array([by[m][s] - by[refm][s] for s in SEEDS])
                cells.append(f"{d.mean():+.4f} ({wilcoxon(d).pvalue:.2g})")
            md.append(f"| {n_gal} | {m} | {c.mean():.4f} ± {c.std():.4f} "
                      f"| {cells[0]} | {cells[1]} |")
    out = ROOT / "docs" / "E1b-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[4:]))


if __name__ == "__main__":
    main()
