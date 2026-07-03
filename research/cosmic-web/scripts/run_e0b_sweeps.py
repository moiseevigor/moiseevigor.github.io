#!/usr/bin/env python3
"""E0b: two follow-up sweeps from the E0 open questions.

Sweep A (Q1 — does hypoelliptic diffusion ever pay?):
  bend_frac x diffusion-strength x sampling, lift method only, scoring
  overall completeness AND curvature-binned completeness (terciles of
  discrete Menger curvature over truth points). If diffusion helps, it
  should show first in the high-curvature bin at extreme sparsity.

Sweep B (Q2 — junctions without node clumps):
  node_frac=0 so junctions are only implied by filament continuity;
  lift vs hessian, junction F1.

Results -> artifacts/e0b_sweeps.json, figures + docs/E0b-sweeps.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines, metrics  # noqa: E402

N = 128
N_SEEDS_WEB = 32
R0 = 2.0
R0_J = 3.0
EVAL_SEEDS = list(range(2, 22))          # 20 held-out seeds
DIFF_CONFIGS = {
    "off":    dict(n_iter=0),
    "weak":   dict(n_iter=1, sig_par=4.0, sig_perp=0.5, alpha=0.35),
    "strong": dict(n_iter=3, sig_par=6.0, sig_perp=0.5, alpha=0.5),
}
BENDS = [0.15, 0.30, 0.50]
LEVELS_A = [1200, 2500]
LEVELS_B = [2500, 5000]

_AXES = lift.hemisphere_axes(42)
_W = lift.axis_adjacency(_AXES)


def menger_curvature(pts):
    """Discrete curvature per point of an ordered polyline sample
    (endpoints get their neighbour's value)."""
    a, b, c = pts[:-2], pts[1:-1], pts[2:]
    ab, bc, ca = (np.linalg.norm(b - a, axis=1),
                  np.linalg.norm(c - b, axis=1),
                  np.linalg.norm(a - c, axis=1))
    area2 = np.linalg.norm(np.cross(b - a, c - a), axis=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        k = area2 / (ab * bc * ca)
    k = np.nan_to_num(k)
    return np.concatenate([[k[0]], k, [k[-1]]])


def make_web(seed, bend, n_gal, node_frac=0.15):
    rng = np.random.default_rng(seed)
    segments, vertices = fields.voronoi_web(N, N_SEEDS_WEB, rng)
    polys = fields.curve_polylines(segments, bend, rng)
    tp, curv = [], []
    for p in polys:
        d, _ = fields.sample_polylines([p], step=0.25)
        tp.append(d)
        curv.append(menger_curvature(d))
    truth_pts = np.vstack(tp)
    curvature = np.concatenate(curv)
    total_len = sum(np.linalg.norm(np.diff(p, axis=0), axis=1).sum()
                    for p in polys)
    gal = fields.polyline_galaxies(polys, vertices, N, n_gal, 0.25, 0.8, rng,
                                   node_frac=node_frac)
    field = fields.galaxy_field(gal, N, n_gal, rng)
    return field, truth_pts, curvature, vertices, int(total_len)


def lift_skeleton(field, diff_cfg, n_target):
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    if diff_cfg["n_iter"]:
        U = lift.hypoelliptic_diffuse(U, _AXES, _W, diff_cfg["sig_par"],
                                      diff_cfg["sig_perp"], diff_cfg["alpha"],
                                      diff_cfg["n_iter"])
    return spines.extract_matched(spines.lifted_ridgeness(U), n_target)


def job_a(args):
    seed, bend, diff_name, n_gal = args
    field, truth_pts, curv, _, n_target = make_web(seed, bend, n_gal)
    skel = lift_skeleton(field, DIFF_CONFIGS[diff_name], n_target)
    est = spines.skeleton_points(skel)
    from scipy.spatial import cKDTree
    d = cKDTree(est).query(truth_pts)[0] if len(est) else \
        np.full(len(truth_pts), np.inf)
    hit = d < R0
    terc = np.percentile(curv, [33.3, 66.7])
    bins = np.digitize(curv, terc)
    return {"sweep": "A", "seed": seed, "bend": bend, "diff": diff_name,
            "n_gal": n_gal,
            "completeness": float(hit.mean()),
            "completeness_by_curv": [float(hit[bins == b].mean())
                                     for b in range(3)],
            "curv_tercile_edges": [float(t) for t in terc]}


def job_b(args):
    seed, method, n_gal = args
    field, truth_pts, _, vertices, n_target = make_web(
        seed, 0.15, n_gal, node_frac=0.0)
    if method == "se3_lift":
        skel = lift_skeleton(field, DIFF_CONFIGS["off"], n_target)
    else:
        skel = spines.extract_matched(
            spines.hessian_ridgeness(field, 1.5), n_target)
    m1 = metrics.spine_metrics(truth_pts, spines.skeleton_points(skel), R0)
    m2 = metrics.junction_metrics(vertices, spines.junction_points(skel), R0_J)
    return {"sweep": "B", "seed": seed, "method": method, "n_gal": n_gal,
            "completeness": m1["completeness"], "jF1": m2["f1"],
            "jprec": m2["precision"], "jrec": m2["recall"]}


def main():
    jobs_a = [(s, b, d, n) for s in EVAL_SEEDS for b in BENDS
              for d in DIFF_CONFIGS for n in LEVELS_A]
    jobs_b = [(s, m, n) for s in EVAL_SEEDS for m in ("se3_lift", "hessian")
              for n in LEVELS_B]
    t0 = time.time()
    with Pool(8) as pool:
        res_a = pool.map(job_a, jobs_a)
        res_b = pool.map(job_b, jobs_b)
    print(f"{len(jobs_a)}+{len(jobs_b)} evals in {time.time()-t0:.0f}s")
    out = ROOT / "artifacts" / "e0b_sweeps.json"
    out.write_text(json.dumps({"A": res_a, "B": res_b}, indent=1))
    print(f"wrote {out}")
    summarize(res_a, res_b)


def summarize(res_a, res_b):
    from scipy.stats import wilcoxon
    lines = ["# E0b — diffusion sweep (Q1) and clump-free junctions (Q2)\n"]

    lines.append("\n## Sweep A: does diffusion help anywhere?\n")
    lines.append("Completeness (mean over 20 seeds), lift only; paired "
                 "Δ(diff − off) with Wilcoxon p. Curvature bins are "
                 "terciles of discrete Menger curvature of truth points "
                 "(bin 2 = most curved third).\n")
    lines.append("| n_gal | bend | diff | C overall | Δ vs off (p) "
                 "| C bin0 | C bin2 | Δ bin2 vs off (p) |")
    lines.append("|---|---|---|---|---|---|---|---|")
    for n_gal in LEVELS_A:
        for bend in BENDS:
            base = {r["seed"]: r for r in res_a
                    if r["bend"] == bend and r["n_gal"] == n_gal
                    and r["diff"] == "off"}
            for dn in DIFF_CONFIGS:
                rs = [r for r in res_a if r["bend"] == bend
                      and r["n_gal"] == n_gal and r["diff"] == dn]
                c = np.array([r["completeness"] for r in rs])
                c2 = np.array([r["completeness_by_curv"][2] for r in rs])
                if dn == "off":
                    d_str = p_str = d2_str = "—"
                else:
                    d = np.array([r["completeness"] - base[r["seed"]]["completeness"]
                                  for r in rs])
                    d2 = np.array([r["completeness_by_curv"][2]
                                   - base[r["seed"]]["completeness_by_curv"][2]
                                   for r in rs])
                    d_str = f"{d.mean():+.3f} ({wilcoxon(d).pvalue:.2g})"
                    d2_str = f"{d2.mean():+.3f} ({wilcoxon(d2).pvalue:.2g})"
                c0 = np.mean([r["completeness_by_curv"][0] for r in rs])
                lines.append(f"| {n_gal} | {bend} | {dn} | {c.mean():.3f} "
                             f"| {d_str} | {c0:.3f} | {c2.mean():.3f} "
                             f"| {d2_str} |")
    lines.append("")

    lines.append("\n## Sweep B: junctions with node_frac = 0\n")
    lines.append("| n_gal | method | completeness | junction F1 | jF1 "
                 "Δ(lift−hess) (p) |")
    lines.append("|---|---|---|---|---|")
    for n_gal in LEVELS_B:
        lifts = {r["seed"]: r for r in res_b
                 if r["n_gal"] == n_gal and r["method"] == "se3_lift"}
        hesss = {r["seed"]: r for r in res_b
                 if r["n_gal"] == n_gal and r["method"] == "hessian"}
        d = np.array([lifts[s]["jF1"] - hesss[s]["jF1"] for s in lifts])
        pj = wilcoxon(d).pvalue if np.any(d) else 1.0
        for m, rs in [("se3_lift", lifts), ("hessian", hesss)]:
            c = np.mean([r["completeness"] for r in rs.values()])
            f = np.mean([r["jF1"] for r in rs.values()])
            delta = f"**{d.mean():+.3f}** ({pj:.2g})" if m == "se3_lift" else ""
            lines.append(f"| {n_gal} | {m} | {c:.3f} | {f:.3f} | {delta} |")

    out = ROOT / "docs" / "E0b-sweeps.md"
    out.write_text("\n".join(lines) + "\n")
    print(f"wrote {out}")
    print("\n".join(lines[-12:]))


if __name__ == "__main__":
    main()
