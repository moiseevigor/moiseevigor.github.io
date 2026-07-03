#!/usr/bin/env python3
"""Generate docs/E0-report.md from artifacts/e0_results_{straight,curved}.json."""

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def load(tag):
    p = ROOT / "artifacts" / f"e0_results_{tag}.json"
    return json.loads(p.read_text()) if p.exists() else None


def agg(results, name, sub, key, level):
    return [r["scores"][name][sub][key] for r in results if r["n_gal"] == level]


def paired_delta(results, sub, key, level):
    """Per-seed (se3_lift - hessian) at one level."""
    return [r["scores"]["se3_lift"][sub][key] - r["scores"]["hessian"][sub][key]
            for r in results if r["n_gal"] == level]


def table(data):
    res = data["results"]
    levels = sorted({r["n_gal"] for r in res})
    lines = ["| n_gal | method | completeness mean ± sd | median (p10–p90) "
             "| purity | junction F1 |",
             "|---|---|---|---|---|---|"]
    for L in levels:
        for name in ("se3_lift", "hessian"):
            c = np.array(agg(res, name, "M1", "completeness", L))
            p = agg(res, name, "M1", "purity", L)
            f = agg(res, name, "M2", "f1", L)
            lines.append(
                f"| {L} | {name} | {c.mean():.3f} ± {c.std():.3f} "
                f"| {np.median(c):.3f} ({np.percentile(c, 10):.3f}–"
                f"{np.percentile(c, 90):.3f}) "
                f"| {np.mean(p):.3f} ± {np.std(p):.3f} "
                f"| {np.mean(f):.3f} ± {np.std(f):.3f} |")
    return "\n".join(lines)


def delta_table(data):
    """Paired per-seed differences (se3_lift - hessian), the H1 evidence."""
    from scipy.stats import wilcoxon
    res = data["results"]
    levels = sorted({r["n_gal"] for r in res})
    lines = ["| n_gal | n seeds | ΔC mean | ΔC median (p10–p90) | lift wins "
             "| Wilcoxon p (ΔC) | ΔjF1 mean | Wilcoxon p (ΔjF1) |",
             "|---|---|---|---|---|---|---|---|"]
    for L in levels:
        dC = np.array(paired_delta(res, "M1", "completeness", L))
        dF = np.array(paired_delta(res, "M2", "f1", L))
        pC = wilcoxon(dC).pvalue if np.any(dC) else 1.0
        pF = wilcoxon(dF).pvalue if np.any(dF) else 1.0
        lines.append(
            f"| {L} | {len(dC)} | **{dC.mean():+.3f}** "
            f"| {np.median(dC):+.3f} ({np.percentile(dC, 10):+.3f}–"
            f"{np.percentile(dC, 90):+.3f}) "
            f"| {int((dC > 0).sum())}/{len(dC)} | {pC:.2g} "
            f"| {dF.mean():+.3f} | {pF:.2g} |")
    return "\n".join(lines)


def delta_figure(data, tag):
    """Box + jittered scatter of paired deltas per level: the key plot."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    res = data["results"]
    levels = sorted({r["n_gal"] for r in res})
    rng = np.random.default_rng(0)
    fig, axs = plt.subplots(1, 2, figsize=(12, 4.6))
    for ax, sub, key, title in [
            (axs[0], "M1", "completeness",
             "Δ completeness (SE(3) lift − Hessian), paired per seed"),
            (axs[1], "M2", "f1",
             "Δ junction F1 (SE(3) lift − Hessian), paired per seed")]:
        ds = [paired_delta(res, sub, key, L) for L in levels]
        ax.axhline(0, color="k", lw=0.8)
        ax.boxplot(ds, positions=range(len(levels)), widths=0.5,
                   showfliers=False)
        for i, d in enumerate(ds):
            ax.plot(i + rng.uniform(-0.15, 0.15, len(d)), d, ".",
                    ms=3, color="tab:blue", alpha=0.4)
        ax.set_xticks(range(len(levels)), [str(L) for L in levels])
        ax.set_xlabel("n_gal (galaxies per $128^3$ box)")
        ax.set_ylabel("Δ (dimensionless, + favours lift)")
        ax.set_title(title, fontsize=10)
        ax.grid(alpha=0.3, axis="y")
    fig.suptitle(f"E0a-{tag}: paired per-seed differences over "
                 f"{max(len(d) for d in ds)} held-out seeds "
                 "(box = quartiles, dots = individual seeds)")
    fig.tight_layout()
    fig.savefig(ROOT / "docs" / "figures" / f"e0_delta_{tag}.png", dpi=130)
    plt.close(fig)


def spark(vals, lo=0.0, hi=1.0):
    blocks = "▁▂▃▄▅▆▇█"
    return "".join(blocks[int(np.clip((v - lo) / (hi - lo), 0, 0.999) * 8)]
                   for v in vals)


def main():
    straight, curved = load("straight"), load("curved")
    assert straight, "run scripts/run_e0.py first"

    md = ["# E0a — orientation-lifted vs Hessian filament extraction "
          "(Voronoi toy, exact truth)\n"]
    md.append(
        "**Question (H1):** does lifting a galaxy density field to the "
        "position–orientation manifold R³×S² recover filament spines better "
        "than the quadratic (Hessian) orientation response, at identical "
        "post-processing and matched skeleton length?\n\n"
        "**Setup.** Voronoi filament model in a 128³ box (1 voxel = 1 h⁻¹Mpc "
        "at the nominal L=128 h⁻¹Mpc): filaments are Voronoi-cell edges "
        "(straight variant) or Bézier-bent edges (curved variant, sag ≈ 15% "
        "of length); galaxies = arclength-uniform points with transverse "
        "Gaussian scatter σ=0.8 vox + 15% node clumps + 25% uniform "
        "background; field = CIC deposit → log(1+δ) → Gaussian smooth σ=1. "
        "Exact truth: the generating curves and vertices.\n\n"
        "**Protocol.** Each method gets 3 candidate configs; the best on "
        "calibration seed 1 (mean C+P+jF1 over sampling levels) is frozen, "
        "then evaluated on held-out seeds. Both methods share hysteresis "
        "thresholding, matched-length skeletonization (mask volume "
        "bisection, tube area 9 vox²), speckle pruning ≥4 vox, and junction "
        "clustering.\n")

    md.append("\n## Metric definitions\n\n"
              "- **Completeness (M1)** = fraction of truth-curve sample "
              "points within r₀=2 vox of the estimated skeleton.\n"
              "- **Purity (M1)** = fraction of estimated skeleton voxels "
              "within r₀=2 vox of a truth curve.\n"
              "- **Junction F1 (M2)** = harmonic mean of precision/recall of "
              "greedy one-to-one matching of estimated junction centroids to "
              "true Voronoi vertices within r₀=3 vox.\n"
              "- **Δ(lift−hess) C** = per-seed paired completeness "
              "difference, mean over held-out seeds; (k/n seeds +) counts "
              "seeds where the lift wins.\n"
              "- All numbers: mean ± sd over held-out eval seeds; matched "
              "skeleton length ⇒ completeness/purity trade on equal "
              "footing.\n")

    for tag, data in [("straight", straight), ("curved", curved)]:
        if data is None:
            continue
        md.append(f"\n## {tag.capitalize()} filaments\n")
        md.append(f"Chosen configs — lift: `{data['chosen_params']['se3_lift']}`, "
                  f"hessian: `{data['chosen_params']['hessian']}`.\n")
        md.append("\n### Per-method summary\n")
        md.append(table(data))
        md.append("\n### Paired differences (the H1 evidence)\n")
        md.append(delta_table(data))
        delta_figure(data, tag)
        md.append(f"\n![E0a {tag}: box plots with per-seed points of paired "
                  f"delta completeness and delta junction F1 vs galaxy "
                  f"count; positive favours the lift]"
                  f"(figures/e0_delta_{tag}.png)\n")
        md.append(f"![E0a {tag}: completeness, purity, junction F1 vs "
                  f"galaxy count, both methods, mean ± sd over held-out "
                  f"seeds](figures/e0_curves_{tag}.png)\n")
        md.append(f"![E0a {tag}: 6-voxel slab of the galaxy field with truth "
                  f"(red) and extracted skeletons (blue) for both methods]"
                  f"(figures/e0_slice_{tag}.png)\n")

    # verdict, computed from the numbers
    md.append("\n## Verdict on H1 (toy-level)\n")
    res = straight["results"]
    levels = sorted({r["n_gal"] for r in res})
    verdict = []
    from scipy.stats import wilcoxon
    for tag, data in [("straight", straight), ("curved", curved)]:
        if data is None:
            continue
        r = data["results"]
        d = paired_delta(r, "M1", "completeness", levels[0])
        dd = paired_delta(r, "M1", "completeness", levels[-1])
        p_sparse = wilcoxon(d).pvalue if len(d) > 5 else float("nan")
        p_dense = wilcoxon(dd).pvalue if len(dd) > 5 else float("nan")
        verdict.append(
            f"- **{tag}**: at the sparsest level (n_gal={levels[0]}) the "
            f"lift wins completeness on {sum(x > 0 for x in d)}/{len(d)} "
            f"held-out seeds, mean Δ = {np.mean(d):+.3f} (Wilcoxon "
            f"signed-rank p = {p_sparse:.2g}); at the densest level "
            f"Δ = {np.mean(dd):+.3f} (p = {p_dense:.2g}).")
    md.append("\n".join(verdict))
    md.append(
        "\n**Not supported (CORRECTED result).** An earlier version of this "
        "report claimed a sparse-regime lift win (+0.07 completeness at "
        "n_gal=2500). That was an evaluation artifact: the original "
        "extractor targeted mask volume, and realized skeleton lengths "
        "differed systematically between methods (lift ~19% longer at "
        "sparse levels) — longer skeletons buy completeness mechanically. "
        "With skeleton length enforced (iterative correction to the "
        "target), the Hessian matches or beats the lift at every sampling "
        "level on both variants; the lift's best case is a statistical tie "
        "at the ultra-sparse level (n_gal=1200, p≈0.4). Junction F1 "
        "favours the Hessian at essentially all levels. The diffusion "
        "component remains rejected by calibration (weak diffusion shows a "
        "small positive only at n_gal=1200 in the E0b sweep, +0.01). "
        "Detection of the artifact: an instrument change made for E1 "
        "(connected-web extraction) retroactively changed E0 parent "
        "scores; the n_est fields in the archived E0 results confirmed the "
        "length mismatch.\n")

    md.append(
        "\n## Open questions / next tests\n\n"
        "1. **Why doesn't diffusion help?** Candidates: bend level too mild "
        "(sag 15%); diffusion parameters not co-calibrated with filter "
        "scales; matched-length extraction absorbing its benefit. Next: "
        "sweep bend_frac ∈ {0.15, 0.3, 0.5} × diffusion strength, and score "
        "curvature-binned completeness (does diffusion win specifically on "
        "high-curvature arcs?).\n"
        "2. **Junctions:** node clumps make junctions easy for both "
        "methods. Re-run with node_frac=0 — the lift should shine when "
        "junctions are only implied by filament continuity.\n"
        "3. **Gravity realism (E1):** port the benchmark to a Zel'dovich / "
        "N-body field where filaments are tidal-sheared, not tubular — the "
        "regime the physics prior (tidal-modulated coefficients, H2) "
        "targets.\n"
        "4. **Tier B:** the current extraction skeletonises the ridgeness; "
        "true SR geodesic tracing on the lifted graph is not yet exercised "
        "and is where curvature penalties enter explicitly.\n")

    out = ROOT / "docs" / "E0-report.md"
    out.write_text("\n".join(md))
    print(f"wrote {out}")

    # compact terminal summary for chat
    print("\nΔ completeness (lift − hessian), by sampling level:")
    for tag, data in [("straight", straight), ("curved", curved)]:
        if data is None:
            continue
        res = data["results"]
        ds = [float(np.mean(paired_delta(res, "M1", "completeness", L)))
              for L in levels]
        print(f"  {tag:9s} {spark([d + 0.5 for d in ds])}  "
              + "  ".join(f"{d:+.3f}" for d in ds))


if __name__ == "__main__":
    main()
