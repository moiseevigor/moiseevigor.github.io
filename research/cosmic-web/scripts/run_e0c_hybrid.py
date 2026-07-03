#!/usr/bin/env python3
"""E0c: junction/spine hybrid — can combining the two scores beat both?

Motivation: E0/E0b showed a consistent division of labour (lift wins spines
in sparse data, Hessian wins junctions). Test the simplest combinations of
the percentile-normalised ridgeness fields:

  hyb_sum = R_lift/q(R_lift) + R_hess/q(R_hess),   q = 99.5th percentile
  hyb_max = max of the two normalised fields

on the curved Voronoi toy at sparse sampling, against both parents, same
matched-length pipeline, exact truth. Report -> docs/E0c-hybrid-report.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, metrics, spines  # noqa: E402

N = 128
SEEDS = list(range(2, 22))
LEVELS = [2500, 5000]
_AXES = lift.hemisphere_axes(42)


def norm(R):
    return R / max(np.percentile(R, 99.5), 1e-12)


def run_seed(seed):
    recs = []
    for n_gal in LEVELS:
        rng = np.random.default_rng(seed)
        segments, vertices = fields.voronoi_web(N, 32, rng)
        polys = fields.curve_polylines(segments, 0.15, rng)
        truth_pts, total = fields.sample_polylines(polys)
        gal = fields.polyline_galaxies(polys, vertices, N, n_gal, 0.25, 0.8, rng)
        field = fields.galaxy_field(gal, N, n_gal, rng)
        n_target = int(total)

        R_h = norm(spines.hessian_ridgeness(field, 1.5))
        R_l = norm(spines.lifted_ridgeness(
            lift.orientation_score(field, _AXES, 6.0, 1.5)))
        ests = {"hessian": R_h, "se3_lift": R_l,
                "hyb_sum": R_h + R_l, "hyb_max": np.maximum(R_h, R_l)}
        for mname, R in ests.items():
            skel = spines.extract_matched(R, n_target)
            m1 = metrics.spine_metrics(truth_pts,
                                       spines.skeleton_points(skel), 2.0)
            m2 = metrics.junction_metrics(vertices,
                                          spines.junction_points(skel), 3.0)
            recs.append({"seed": seed, "n_gal": n_gal, "method": mname,
                         "C": m1["completeness"], "P": m1["purity"],
                         "jF1": m2["f1"]})
    return recs


def main():
    t0 = time.time()
    with Pool(8) as pool:
        recs = [r for rs in pool.map(run_seed, SEEDS) for r in rs]
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e0c_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    from scipy.stats import wilcoxon
    methods = ["hessian", "se3_lift", "hyb_sum", "hyb_max"]
    md = ["# E0c — junction/spine hybrids on the curved toy (exact truth)\n",
          f"Setup: E0-curved protocol, {len(SEEDS)} held-out seeds, sparse "
          "levels only (where the division of labour lives). Hybrids are "
          "sums/maxima of percentile-normalised parent scores; identical "
          "matched-length pipeline.\n"]
    md.append("| n_gal | method | completeness | purity | junction F1 "
              "| ΔC vs best parent (p) | ΔjF1 vs best parent (p) |")
    md.append("|---|---|---|---|---|---|---|")
    for n_gal in LEVELS:
        by = {m: {r["seed"]: r for r in recs
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in methods}
        for m in methods:
            C = np.array([by[m][s]["C"] for s in SEEDS])
            P = np.array([by[m][s]["P"] for s in SEEDS])
            F = np.array([by[m][s]["jF1"] for s in SEEDS])
            cells = []
            if m.startswith("hyb"):
                pc_ref = ("hessian" if np.mean([by["hessian"][s]["C"]
                          for s in SEEDS]) >= np.mean([by["se3_lift"][s]["C"]
                          for s in SEEDS]) else "se3_lift")
                dC = np.array([by[m][s]["C"] - by[pc_ref][s]["C"]
                               for s in SEEDS])
                pj_ref = ("hessian" if np.mean([by["hessian"][s]["jF1"]
                          for s in SEEDS]) >= np.mean([by["se3_lift"][s]["jF1"]
                          for s in SEEDS]) else "se3_lift")
                dF = np.array([by[m][s]["jF1"] - by[pj_ref][s]["jF1"]
                               for s in SEEDS])
                cells = [f"{dC.mean():+.3f} vs {pc_ref} "
                         f"({wilcoxon(dC).pvalue:.2g})",
                         f"{dF.mean():+.3f} vs {pj_ref} "
                         f"({wilcoxon(dF).pvalue:.2g})"]
            else:
                cells = ["—", "—"]
            md.append(f"| {n_gal} | {m} | {C.mean():.3f} ± {C.std():.3f} "
                      f"| {P.mean():.3f} | {F.mean():.3f} ± {F.std():.3f} "
                      f"| {cells[0]} | {cells[1]} |")
    out = ROOT / "docs" / "E0c-hybrid-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
