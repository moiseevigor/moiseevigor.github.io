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

import fields, pm, spines  # noqa: E402
sys.path.insert(0, str(ROOT / "scripts"))
from run_e1 import lifted_ridgeness_weighted  # noqa: E402

N, L, D, TRUNC = 128, 128.0, 1.0, 2.0
N_TARGET = 2400
R0 = 3.0
PM = "--pm" in sys.argv          # real N-body fields instead of truncated ZA
SEEDS = list(range(1, 9)) if PM else list(range(1, 13))
LEVELS = [5000, 20000]
TAG = "pm" if PM else "sigpar"


def mass_coverage(spine_pts, pos, r0=R0):
    if len(spine_pts) == 0:
        return 0.0
    d = cKDTree(spine_pts).query(pos)[0]
    return float((d < r0).mean())


def band_mask(rho, pos, lo=2.0, hi=20.0):
    """Particles in filament-band environments: cell density in (lo, hi),
    excluding voids and cluster cores."""
    idx = (np.floor(pos).astype(int)) % N
    rp = rho[idx[:, 0], idx[:, 1], idx[:, 2]]
    return (rp > lo) & (rp < hi)


def run_seed(seed):
    rng = np.random.default_rng(seed)
    if PM:
        pos, _, _, _, _, _, _ = pm.pm_sim(N, L, rng, n_steps=90, track=1)
        rho = fields.cic_deposit(pos, N)
    else:
        rho, pos = fields.zeldovich_box(N, L, D, rng, trunc=TRUNC)
    band = band_mask(rho, pos)
    clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
    e3_clean = fields.tidal_frame(clean)

    recs = []
    for n_gal in LEVELS:
        gal_field = fields.galaxy_field(pos, N, n_gal, rng, adaptive=True)
        e3_sparse = fields.tidal_frame(gal_field)
        ests = {
            "hessian": spines.hessian_ridgeness(gal_field, 1.5),
            "lift_s3": lifted_ridgeness_weighted(gal_field, None, 0.0, 3.0),
            "lift_s45": lifted_ridgeness_weighted(gal_field, None, 0.0, 4.5),
            "lift_b0": lifted_ridgeness_weighted(gal_field, None, 0.0),
        }
        for mname, R in ests.items():
            skel = spines.extract_matched(R, N_TARGET, lo_frac=1.0)
            pts = spines.skeleton_points(skel)
            recs.append({"seed": seed, "n_gal": n_gal, "method": mname,
                         "n_spine": len(pts),
                         "mass_cov": mass_coverage(pts, pos),
                         "band_cov": mass_coverage(pts, pos[band])})
    return recs


def main():
    t0 = time.time()
    with Pool(4 if PM else 6) as pool:
        recs = [r for rs in pool.map(run_seed, SEEDS) for r in rs]
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / f"e1b_{TAG}_results.json").write_text(
        json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    from scipy.stats import wilcoxon
    methods = ["hessian", "lift_s3", "lift_s45", "lift_b0"]
    md = [f"# E1b-{TAG} — method-neutral H1 on gravity fields "
          f"({'PM N-body' if PM else 'truncated ZA'}): mass coverage at matched spine length\n",
          f"Setup: {len(SEEDS)} {'PM N-body' if PM else 'truncated-ZA'} boxes. Criterion "
          f"needs no reference skeleton: fraction of all {N}³ particles "
          f"within r₀={R0} vox of the spine set, spine length matched at "
          f"{N_TARGET} vox. Note the spine budget covers only ~"
          f"{N_TARGET * 4 * np.pi * R0 ** 2 / 3 / N ** 3 * 100:.0f}% of the "
          "volume if spread randomly — differences measure how well spines "
          "sit on mass.\n"]
    md.append("| n_gal | method | mass coverage | band coverage (2<ρ<20) "
              "| Δband vs hessian (p) | Δband vs lift_b0 (p) |")
    md.append("|---|---|---|---|---|---|")
    for n_gal in LEVELS:
        by = {m: {r["seed"]: r for r in recs
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in methods}
        for m in methods:
            c = np.array([by[m][s]["mass_cov"] for s in SEEDS])
            b = np.array([by[m][s]["band_cov"] for s in SEEDS])
            cells = []
            for refm in ("hessian", "lift_b0"):
                if m == refm:
                    cells.append("—")
                    continue
                d = np.array([by[m][s]["band_cov"] - by[refm][s]["band_cov"]
                              for s in SEEDS])
                cells.append(f"{d.mean():+.4f} ({wilcoxon(d).pvalue:.2g})")
            md.append(f"| {n_gal} | {m} | {c.mean():.4f} ± {c.std():.4f} "
                      f"| {b.mean():.4f} ± {b.std():.4f} "
                      f"| {cells[0]} | {cells[1]} |")
    out = ROOT / "docs" / f"E1b-{TAG}-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[4:]))


if __name__ == "__main__":
    main()
