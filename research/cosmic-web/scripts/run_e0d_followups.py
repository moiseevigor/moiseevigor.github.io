#!/usr/bin/env python3
"""E0d: three follow-ups forced by the correction pass.

A. Splitting convergence (closes the E0b caveat properly): my hypoelliptic
   diffusion used 1-3 coarse splitting steps. Trotter: many small
   alternations converge to the true left-invariant semigroup. Compare, at
   equal TOTAL diffusion (same accumulated parallel variance and angular
   mixing): off | coarse (1 step) | fine (8 steps). If fine ~ coarse, the
   diffusion negative is about the operator, not the numerics.

B. Sparsity limit: corrected E0 showed a tie at n_gal=1200. Does the lift
   ever WIN under honest matching as sampling gets extreme?
   n_gal in {400, 600, 800, 1200}, 30 seeds, curved toy.

C. Hybrid on gravity fields: does hyb_sum's purity/junction gain on toys
   translate into mass/band coverage on truncated-ZA webs?

Report -> docs/E0d-followups.md.
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

import fields, lift, metrics, spines  # noqa: E402

N = 128
_AXES = lift.hemisphere_axes(42)
_W = lift.axis_adjacency(_AXES)

DIFF = {
    "off":    None,
    # total parallel variance 16 (sigma 4), angular mixing alpha_tot ~ 0.35
    "coarse": dict(n_iter=1, sig_par=4.0, sig_perp=0.5, alpha=0.35),
    "fine":   dict(n_iter=8, sig_par=4.0 / np.sqrt(8), sig_perp=0.5 / np.sqrt(8),
                   alpha=1 - (1 - 0.35) ** (1 / 8)),
}


def norm(R):
    return R / max(np.percentile(R, 99.5), 1e-12)


def make_toy(seed, n_gal):
    rng = np.random.default_rng(seed)
    segments, vertices = fields.voronoi_web(N, 32, rng)
    polys = fields.curve_polylines(segments, 0.15, rng)
    truth_pts, total = fields.sample_polylines(polys)
    gal = fields.polyline_galaxies(polys, vertices, N, n_gal, 0.25, 0.8, rng)
    field = fields.galaxy_field(gal, N, n_gal, rng)
    return field, truth_pts, int(total)


def job_a(args):
    seed, n_gal, dname = args
    field, truth_pts, n_target = make_toy(seed, n_gal)
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    if DIFF[dname]:
        p = DIFF[dname]
        U = lift.hypoelliptic_diffuse(U, _AXES, _W, p["sig_par"],
                                      p["sig_perp"], p["alpha"], p["n_iter"])
    skel = spines.extract_matched(spines.lifted_ridgeness(U), n_target)
    m1 = metrics.spine_metrics(truth_pts, spines.skeleton_points(skel), 2.0)
    return {"part": "A", "seed": seed, "n_gal": n_gal, "diff": dname,
            "C": m1["completeness"], "P": m1["purity"]}


def job_b(args):
    seed, n_gal, method = args
    field, truth_pts, n_target = make_toy(seed, n_gal)
    if method == "hessian":
        R = spines.hessian_ridgeness(field, 1.5)
    else:
        R = spines.lifted_ridgeness(
            lift.orientation_score(field, _AXES, 6.0, 1.5))
    skel = spines.extract_matched(R, n_target)
    m1 = metrics.spine_metrics(truth_pts, spines.skeleton_points(skel), 2.0)
    return {"part": "B", "seed": seed, "n_gal": n_gal, "method": method,
            "C": m1["completeness"], "P": m1["purity"]}


def job_c(seed):
    rng = np.random.default_rng(seed)
    rho, pos = fields.zeldovich_box(N, 128.0, 1.0, rng, trunc=2.0)
    idx = (np.floor(pos).astype(int)) % N
    rp = rho[idx[:, 0], idx[:, 1], idx[:, 2]]
    band = (rp > 2) & (rp < 20)
    recs = []
    for n_gal in (5000, 20000):
        gal_field = fields.galaxy_field(pos, N, n_gal, rng, adaptive=True)
        R_h = norm(spines.hessian_ridgeness(gal_field, 1.5))
        R_l = norm(spines.lifted_ridgeness(
            lift.orientation_score(gal_field, _AXES, 6.0, 1.5)))
        for mname, R in [("hessian", R_h), ("se3_lift", R_l),
                         ("hyb_sum", R_h + R_l)]:
            pts = spines.skeleton_points(
                spines.extract_matched(R, 2400, lo_frac=1.0))
            tree = cKDTree(pts)
            recs.append({"part": "C", "seed": seed, "n_gal": n_gal,
                         "method": mname,
                         "mass_cov": float((tree.query(pos)[0] < 3.0).mean()),
                         "band_cov": float((tree.query(pos[band])[0] < 3.0).mean())})
    return recs


def main():
    seeds_a = list(range(2, 22))
    seeds_b = list(range(2, 32))
    seeds_c = list(range(1, 13))
    jobs_a = [(s, n, d) for s in seeds_a for n in (1200, 2500) for d in DIFF]
    jobs_b = [(s, n, m) for s in seeds_b for n in (400, 600, 800, 1200)
              for m in ("hessian", "se3_lift")]
    t0 = time.time()
    with Pool(8) as pool:
        res_a = pool.map(job_a, jobs_a)
        res_b = pool.map(job_b, jobs_b)
        res_c = [r for rs in pool.map(job_c, seeds_c) for r in rs]
    print(f"{len(jobs_a)}+{len(jobs_b)}+{len(seeds_c)} jobs "
          f"in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e0d_results.json").write_text(
        json.dumps({"A": res_a, "B": res_b, "C": res_c}, indent=1))
    report(res_a, res_b, res_c)


def report(res_a, res_b, res_c):
    from scipy.stats import wilcoxon
    md = ["# E0d — post-correction follow-ups\n"]

    md.append("\n## A. Splitting convergence (is the diffusion negative "
              "numerical?)\n")
    md.append("Equal total diffusion; fine = 8 Trotter steps. Curved toy, "
              "20 seeds, corrected extractor.\n")
    md.append("| n_gal | diff | completeness | Δ vs off (p) |")
    md.append("|---|---|---|---|")
    for n_gal in (1200, 2500):
        base = {r["seed"]: r["C"] for r in res_a
                if r["n_gal"] == n_gal and r["diff"] == "off"}
        for d in DIFF:
            rs = [r for r in res_a if r["n_gal"] == n_gal and r["diff"] == d]
            C = np.array([r["C"] for r in rs])
            if d == "off":
                cell = "—"
            else:
                dd = np.array([r["C"] - base[r["seed"]] for r in rs])
                cell = f"{dd.mean():+.4f} ({wilcoxon(dd).pvalue:.2g})"
            md.append(f"| {n_gal} | {d} | {C.mean():.3f} ± {C.std():.3f} "
                      f"| {cell} |")

    md.append("\n## B. Sparsity limit (does the lift ever win honestly?)\n")
    md.append("| n_gal | ΔC (lift − hessian) | lift wins | Wilcoxon p "
              "| C hessian | C lift |")
    md.append("|---|---|---|---|---|---|")
    seeds_b = sorted({r["seed"] for r in res_b})
    for n_gal in (400, 600, 800, 1200):
        by = {m: {r["seed"]: r["C"] for r in res_b
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in ("hessian", "se3_lift")}
        d = np.array([by["se3_lift"][s] - by["hessian"][s] for s in seeds_b])
        md.append(f"| {n_gal} | {d.mean():+.4f} | {int((d>0).sum())}"
                  f"/{len(d)} | {wilcoxon(d).pvalue:.2g} "
                  f"| {np.mean(list(by['hessian'].values())):.3f} "
                  f"| {np.mean(list(by['se3_lift'].values())):.3f} |")

    md.append("\n## C. Hybrid on gravity fields (truncated ZA, 12 seeds)\n")
    md.append("| n_gal | method | mass coverage | band coverage "
              "| Δband vs hessian (p) |")
    md.append("|---|---|---|---|---|")
    seeds_c = sorted({r["seed"] for r in res_c})
    for n_gal in (5000, 20000):
        by = {m: {r["seed"]: r for r in res_c
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in ("hessian", "se3_lift", "hyb_sum")}
        for m in ("hessian", "se3_lift", "hyb_sum"):
            mc = np.mean([by[m][s]["mass_cov"] for s in seeds_c])
            bc = np.array([by[m][s]["band_cov"] for s in seeds_c])
            if m == "hessian":
                cell = "—"
            else:
                d = np.array([by[m][s]["band_cov"] - by["hessian"][s]["band_cov"]
                              for s in seeds_c])
                cell = f"{d.mean():+.4f} ({wilcoxon(d).pvalue:.2g})"
            md.append(f"| {n_gal} | {m} | {mc:.4f} | {bc.mean():.4f} "
                      f"± {bc.std():.4f} | {cell} |")

    out = ROOT / "docs" / "E0d-followups.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[2:]))


if __name__ == "__main__":
    main()
