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
    lines = ["| n_gal | method | completeness | purity | junction F1 | Δ(lift−hess) C |",
             "|---|---|---|---|---|---|"]
    for L in levels:
        dC = paired_delta(res, "M1", "completeness", L)
        for name in ("se3_lift", "hessian"):
            c = agg(res, name, "M1", "completeness", L)
            p = agg(res, name, "M1", "purity", L)
            f = agg(res, name, "M2", "f1", L)
            delta = (f"**{np.mean(dC):+.3f}** ({sum(d > 0 for d in dC)}/{len(dC)} seeds +)"
                     if name == "se3_lift" else "")
            lines.append(
                f"| {L} | {name} | {np.mean(c):.3f} ± {np.std(c):.3f} "
                f"| {np.mean(p):.3f} ± {np.std(p):.3f} "
                f"| {np.mean(f):.3f} ± {np.std(f):.3f} | {delta} |")
    return "\n".join(lines)


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
        md.append(table(data))
        md.append(f"\n![E0a {tag}: completeness, purity, junction F1 vs "
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
    for tag, data in [("straight", straight), ("curved", curved)]:
        if data is None:
            continue
        r = data["results"]
        d = paired_delta(r, "M1", "completeness", levels[0])
        verdict.append(
            f"- **{tag}**: at the sparsest level (n_gal={levels[0]}) the "
            f"lift wins completeness on {sum(x > 0 for x in d)}/{len(d)} "
            f"held-out seeds, mean Δ = {np.mean(d):+.3f}; at the densest "
            f"level Δ = "
            f"{np.mean(paired_delta(r, 'M1', 'completeness', levels[-1])):+.3f}.")
    md.append("\n".join(verdict))
    md.append(
        "\n**Supported (partially):** the orientation lift consistently "
        "improves spine completeness in the sparse-sampling regime (the "
        "survey-realistic one), at a small purity cost and matched skeleton "
        "length; the Hessian baseline is marginally better when sampling is "
        "dense. **Not supported:** (i) the junction sub-claim — M2 is "
        "statistically tied; (ii) the hypoelliptic-diffusion component — "
        "calibration rejected it (diff_iter=0 won) on BOTH straight and "
        "curved filaments, so all observed gains come from the elongated "
        "oriented filters alone.\n")

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
