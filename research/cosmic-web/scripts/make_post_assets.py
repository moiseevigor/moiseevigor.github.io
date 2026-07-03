#!/usr/bin/env python3
"""Assets for the introductory blog post.

1. Slice-image series: seed-2 realization per variant x sampling level,
   3 panels (field+truth | lift | hessian) -> public/img/posts/cosmic-web/.
2. post_data.json: compact aggregates of E0/E0b/E1b/E2 results for the
   post's inline interactive plots.
"""

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT.parents[1]
IMG = SITE / "public" / "img" / "posts" / "cosmic-web"
IMG.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines  # noqa: E402

import matplotlib  # noqa: E402
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

N, SEED = 128, 2
LEVELS = [2500, 5000, 20000, 80000]
_AXES = lift.hemisphere_axes(42)


def make(seed, bend, n_gal):
    rng = np.random.default_rng(seed)
    segments, vertices = fields.voronoi_web(N, 32, rng)
    polys = fields.curve_polylines(segments, bend, rng)
    truth_pts, total = fields.sample_polylines(polys)
    gal = fields.polyline_galaxies(polys, vertices, N, n_gal, 0.25, 0.8, rng)
    field = fields.galaxy_field(gal, N, n_gal, rng)
    n_target = int(total)
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    sk_l = spines.extract_matched(spines.lifted_ridgeness(U), n_target)
    sk_h = spines.extract_matched(spines.hessian_ridgeness(field, 1.5), n_target)
    return field, truth_pts, sk_l, sk_h


def slice_fig(variant, bend, n_gal):
    field, truth_pts, sk_l, sk_h = make(SEED, bend, n_gal)
    z0, slab = N // 2, 6
    sl = slice(z0 - slab // 2, z0 + slab // 2)
    tp = truth_pts[(truth_pts[:, 2] >= sl.start) & (truth_pts[:, 2] < sl.stop)]
    fig, axs = plt.subplots(1, 3, figsize=(13.5, 4.8))
    for ax, (title, skel) in zip(axs, [
            (f"galaxy field (n={n_gal}) + truth", None),
            ("SE(3) orientation lift", sk_l), ("Hessian baseline", sk_h)]):
        ax.imshow(field[:, :, sl].mean(axis=2).T, origin="lower",
                  cmap="Greys", interpolation="nearest")
        ax.plot(tp[:, 0], tp[:, 1], ".", ms=1.0, color="tab:red",
                alpha=0.5 if skel is not None else 1.0)
        if skel is not None:
            p = spines.skeleton_points(skel)
            p = p[(p[:, 2] >= sl.start) & (p[:, 2] < sl.stop)]
            ax.plot(p[:, 0], p[:, 1], ".", ms=1.7, color="tab:blue")
        ax.set_title(title, fontsize=11)
        ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout(pad=0.6)
    out = IMG / f"slice_{variant}_{n_gal}.png"
    fig.savefig(out, dpi=115)
    plt.close(fig)
    print("wrote", out.name)


def bake_data():
    data = {}
    for tag in ("straight", "curved"):
        raw = json.loads((ROOT / "artifacts" / f"e0_results_{tag}.json").read_text())
        res = raw["results"]
        levels = sorted({r["n_gal"] for r in res})
        agg = {}
        for m in ("se3_lift", "hessian"):
            agg[m] = {
                "C": [round(float(np.mean([r["scores"][m]["M1"]["completeness"]
                      for r in res if r["n_gal"] == L])), 4) for L in levels],
                "P": [round(float(np.mean([r["scores"][m]["M1"]["purity"]
                      for r in res if r["n_gal"] == L])), 4) for L in levels],
                "jF1": [round(float(np.mean([r["scores"][m]["M2"]["f1"]
                        for r in res if r["n_gal"] == L])), 4) for L in levels],
            }
        deltas = {}
        for key, sub in [("dC", "M1"), ("djF1", "M2")]:
            kk = "completeness" if sub == "M1" else "f1"
            deltas[key] = [[round(
                r["scores"]["se3_lift"][sub][kk] - r["scores"]["hessian"][sub][kk], 4)
                for r in res if r["n_gal"] == L] for L in levels]
        data[tag] = {"levels": levels, "agg": agg, "deltas": deltas}

    e2 = json.loads((ROOT / "artifacts" / "e2_results.json").read_text())
    bins = ["0_2", "2_4", "4_8", "8_16", "16_64"]
    data["e2"] = {
        "bins": ["0–2", "2–4", "4–8", "8–16", "16–64"],
        "P1": [round(float(np.mean([r[f"align_v_{b}"] for r in e2])), 3) for b in bins],
        "P2": [round(float(np.mean([r[f"par_frac_{b}"] for r in e2])), 3) for b in bins],
        "dev": [round(float(np.mean([r[f"dev_vox_{b}"] for r in e2])), 2) for b in bins],
    }

    for tag in ("sigpar", "pm"):
        f = ROOT / "artifacts" / f"e1b_{tag}_results.json"
        if not f.exists():
            continue
        recs = json.loads(f.read_text())
        methods = sorted({r["method"] for r in recs})
        levels = sorted({r["n_gal"] for r in recs})
        data[f"e1b_{tag}"] = {"levels": levels, "methods": methods, "band": {
            m: [round(float(np.mean([r["band_cov"] for r in recs
                if r["method"] == m and r["n_gal"] == L])), 4) for L in levels]
            for m in methods}}

    out = IMG / "post_data.json"
    out.write_text(json.dumps(data))
    print("wrote", out.name, f"({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    for variant, bend in [("straight", 0.0), ("curved", 0.15)]:
        for n_gal in LEVELS:
            slice_fig(variant, bend, n_gal)
    bake_data()
