#!/usr/bin/env python3
"""E0a: accuracy benchmark on the Voronoi filament model (exact ground truth).

Protocol
--------
1. Calibration (seed 1 only): each method gets the SAME budget of 3
   parameter configs; the config with the best mean (C + P + jF1) across
   sampling levels wins.
2. Evaluation (seeds 2-4, never used for calibration): both methods run
   with their frozen configs through identical post-processing at matched
   skeleton length; scored against exact truth (M1 spine metrics, M2
   junction recovery).

Usage: run_e0.py [--smoke]
Results -> artifacts/e0_results.json, figures -> docs/figures/.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines, metrics  # noqa: E402

SMOKE = "--smoke" in sys.argv
BEND = 0.15 if "--curved" in sys.argv else 0.0
TAG = "curved" if BEND else "straight"
N_EVAL = (int(sys.argv[sys.argv.index("--eval-seeds") + 1])
          if "--eval-seeds" in sys.argv else 5)
N_WORKERS = 8

CFG = dict(
    N=64 if SMOKE else 128,
    n_seeds=16 if SMOKE else 32,
    n_axes=42,
    sigma_perp_gal=0.8,          # transverse galaxy scatter (voxels)
    bg_frac=0.25,
    bend_frac=BEND,              # 0 = straight Voronoi edges, >0 = Bezier bend
    n_gal_levels=[8000] if SMOKE else [2500, 5000, 20000, 80000],
    cal_seed=1,
    eval_seeds=[2] if SMOKE else list(range(2, 2 + N_EVAL)),
    r0_spine=2.0,
    r0_junction=3.0,
)

# same-size config grids: one knob family per method
LIFT_GRID = [
    dict(sig_par=6.0, sig_perp=1.5, diff_iter=2),
    dict(sig_par=9.0, sig_perp=1.5, diff_iter=2),
    dict(sig_par=6.0, sig_perp=1.5, diff_iter=0),   # ablation: no diffusion
]
HESS_GRID = [dict(sigma=1.5), dict(sigma=2.0), dict(sigma=3.0)]

_AXES = lift.hemisphere_axes(CFG["n_axes"])
_W = lift.axis_adjacency(_AXES)


def make_realization(seed, n_gal):
    rng = np.random.default_rng(seed)
    segments, vertices = fields.voronoi_web(CFG["N"], CFG["n_seeds"], rng)
    polys = fields.curve_polylines(segments, CFG["bend_frac"], rng)
    truth_pts, total_len = fields.sample_polylines(polys)
    gal = fields.polyline_galaxies(polys, vertices, CFG["N"], n_gal,
                                   CFG["bg_frac"], CFG["sigma_perp_gal"], rng)
    field = fields.galaxy_field(gal, CFG["N"], n_gal, rng)
    return field, truth_pts, vertices, int(total_len)


def ridgeness(field, method, p):
    if method == "hessian":
        return spines.hessian_ridgeness(field, p["sigma"])
    U = lift.orientation_score(field, _AXES, p["sig_par"], p["sig_perp"])
    if p["diff_iter"]:
        U = lift.hypoelliptic_diffuse(U, _AXES, _W, n_iter=p["diff_iter"])
    return spines.lifted_ridgeness(U)


def evaluate(field, method, p, truth_pts, truth_j, n_target):
    t0 = time.time()
    R = ridgeness(field, method, p)
    skel = spines.extract_matched(R, n_target)
    m1 = metrics.spine_metrics(truth_pts, spines.skeleton_points(skel),
                               CFG["r0_spine"])
    m2 = metrics.junction_metrics(truth_j, spines.junction_points(skel),
                                  CFG["r0_junction"])
    return {"M1": m1, "M2": m2, "runtime_s": round(time.time() - t0, 1),
            "skel": skel}


def combined(sc):
    return sc["M1"]["completeness"] + sc["M1"]["purity"] + sc["M2"]["f1"]


def calibrate():
    """Pick each method's config on the calibration seed only."""
    data = {n: make_realization(CFG["cal_seed"], n) for n in CFG["n_gal_levels"]}
    chosen = {}
    for method, grid in [("se3_lift", LIFT_GRID), ("hessian", HESS_GRID)]:
        scores = []
        for p in grid:
            s = np.mean([combined(evaluate(f, method, p, tp, tj, nt))
                         for f, tp, tj, nt in data.values()])
            scores.append(s)
            print(f"  cal {method} {p}: {s:.3f}")
        chosen[method] = grid[int(np.argmax(scores))]
        print(f"  -> {method}: {chosen[method]}")
    return chosen


def _init_worker(cfg):
    CFG.clear()
    CFG.update(cfg)


def eval_one(args):
    seed, n_gal, chosen = args
    field, truth_pts, truth_j, n_target = make_realization(seed, n_gal)
    sc = {m: evaluate(field, m, chosen[m], truth_pts, truth_j, n_target)
          for m in ("se3_lift", "hessian")}
    for v in sc.values():
        v.pop("skel")
    return {"seed": seed, "n_gal": n_gal, "scores": sc}


def main():
    from multiprocessing import Pool

    print("calibration (seed 1)")
    chosen = calibrate()

    # one serial realization for the slice figure
    seed0, ngal0 = CFG["eval_seeds"][0], CFG["n_gal_levels"][min(1, len(CFG["n_gal_levels"]) - 1)]
    field, truth_pts, truth_j, n_target = make_realization(seed0, ngal0)
    sc0 = {m: evaluate(field, m, chosen[m], truth_pts, truth_j, n_target)
           for m in ("se3_lift", "hessian")}
    save_slice_figure(field, truth_pts, sc0, seed0, ngal0)

    jobs = [(s, n, chosen) for s in CFG["eval_seeds"]
            for n in CFG["n_gal_levels"]]
    t0 = time.time()
    with Pool(N_WORKERS, initializer=_init_worker, initargs=(dict(CFG),)) as pool:
        results = pool.map(eval_one, jobs)
    print(f"{len(jobs)} realizations on {N_WORKERS} workers "
          f"in {time.time()-t0:.0f}s")

    out = ROOT / "artifacts" / f"e0_results_{TAG}.json"
    out.write_text(json.dumps({
        "config": CFG, "chosen_params": chosen, "results": results}, indent=1))
    print(f"wrote {out}")
    if not SMOKE:
        save_curves_figure(results)


def save_slice_figure(field, truth_pts, sc, seed, n_gal, slab=6):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    N = CFG["N"]
    z0 = N // 2
    sl = slice(z0 - slab // 2, z0 + slab // 2)
    fig, axs = plt.subplots(1, 3, figsize=(15, 5.2))
    tp = truth_pts[(truth_pts[:, 2] >= sl.start) & (truth_pts[:, 2] < sl.stop)]
    panels = [("galaxy field + truth", None),
              ("SE(3) lift skeleton", sc["se3_lift"]["skel"]),
              ("Hessian skeleton", sc["hessian"]["skel"])]
    for ax, (title, skel) in zip(axs, panels):
        ax.imshow(field[:, :, sl].mean(axis=2).T, origin="lower",
                  cmap="Greys", interpolation="nearest")
        ax.plot(tp[:, 0], tp[:, 1], ".", ms=1.0, color="tab:red",
                alpha=0.5 if skel is not None else 1.0)
        if skel is not None:
            p = spines.skeleton_points(skel)
            p = p[(p[:, 2] >= sl.start) & (p[:, 2] < sl.stop)]
            ax.plot(p[:, 0], p[:, 1], ".", ms=1.6, color="tab:blue")
        ax.set_title(title)
        ax.set_xlabel("x (voxels = $h^{-1}$Mpc)")
        ax.set_ylabel("y (voxels)")
    fig.suptitle(f"E0a-{TAG} slab (thickness {slab} vox), eval seed={seed}, "
                 f"n_gal={n_gal}; red = truth, blue = estimate")
    fig.tight_layout()
    fig.savefig(ROOT / "docs" / "figures" / f"e0_slice_{TAG}.png", dpi=130)
    plt.close(fig)


def save_curves_figure(results):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    levels = sorted({r["n_gal"] for r in results})
    fig, axs = plt.subplots(1, 3, figsize=(14, 4.4))
    for name, color in [("se3_lift", "tab:blue"), ("hessian", "tab:orange")]:
        for ax, key, sub in [(axs[0], "completeness", "M1"),
                             (axs[1], "purity", "M1"), (axs[2], "f1", "M2")]:
            vals = [[r["scores"][name][sub][key] for r in results
                     if r["n_gal"] == L] for L in levels]
            ax.errorbar(levels, [np.mean(v) for v in vals],
                        yerr=[np.std(v) for v in vals], marker="o",
                        color=color, label=name, capsize=3)
    for ax, t in zip(axs, [f"M1 completeness (frac truth < "
                           f"{CFG['r0_spine']} vox of estimate)",
                           f"M1 purity (frac est < {CFG['r0_spine']} vox of truth)",
                           f"M2 junction F1 (r0 = {CFG['r0_junction']} vox)"]):
        ax.set_xscale("log")
        ax.set_xlabel("n_gal (galaxies per $128^3$ box)")
        ax.set_ylim(0, 1.05)
        ax.set_title(t, fontsize=10)
        ax.grid(alpha=0.3)
        ax.legend()
    fig.suptitle(f"E0a-{TAG} held-out means ± sd (eval seeds "
                 f"{CFG['eval_seeds']}), matched skeleton length")
    fig.tight_layout()
    fig.savefig(ROOT / "docs" / "figures" / f"e0_curves_{TAG}.png", dpi=130)
    plt.close(fig)


if __name__ == "__main__":
    main()
