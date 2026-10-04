# E0a — orientation-lifted vs Hessian filament extraction (Voronoi toy, exact truth)

**Question (H1):** does lifting a galaxy density field to the position–orientation manifold R³×S² recover filament spines better than the quadratic (Hessian) orientation response, at identical post-processing and matched skeleton length?

**Setup.** Voronoi filament model in a 128³ box (1 voxel = 1 h⁻¹Mpc at the nominal L=128 h⁻¹Mpc): filaments are Voronoi-cell edges (straight variant) or Bézier-bent edges (curved variant, sag ≈ 15% of length); galaxies = arclength-uniform points with transverse Gaussian scatter σ=0.8 vox + 15% node clumps + 25% uniform background; field = CIC deposit → log(1+δ) → Gaussian smooth σ=1. Exact truth: the generating curves and vertices.

**Protocol.** Each method gets 3 candidate configs; the best on calibration seed 1 (mean C+P+jF1 over sampling levels) is frozen, then evaluated on held-out seeds. Both methods share hysteresis thresholding, matched-length skeletonization (mask volume bisection, tube area 9 vox²), speckle pruning ≥4 vox, and junction clustering.


## Metric definitions

- **Completeness (M1)** = fraction of truth-curve sample points within r₀=2 vox of the estimated skeleton.
- **Purity (M1)** = fraction of estimated skeleton voxels within r₀=2 vox of a truth curve.
- **Junction F1 (M2)** = harmonic mean of precision/recall of greedy one-to-one matching of estimated junction centroids to true Voronoi vertices within r₀=3 vox.
- **Δ(lift−hess) C** = per-seed paired completeness difference, mean over held-out seeds; (k/n seeds +) counts seeds where the lift wins.
- All numbers: mean ± sd over held-out eval seeds; matched skeleton length ⇒ completeness/purity trade on equal footing.


## Straight filaments

Chosen configs — lift: `{'sig_par': 6.0, 'sig_perp': 1.5, 'diff_iter': 2}`, hessian: `{'sigma': 2.0}`.


### Per-method summary

| n_gal | method | completeness mean ± sd | median (p10–p90) | purity | junction F1 |
|---|---|---|---|---|---|
| 1200 | se3_lift | 0.813 ± 0.032 | 0.812 (0.780–0.852) | 0.685 ± 0.059 | 0.383 ± 0.056 |
| 1200 | hessian | 0.811 ± 0.029 | 0.812 (0.777–0.843) | 0.695 ± 0.034 | 0.455 ± 0.051 |
| 2500 | se3_lift | 0.867 ± 0.037 | 0.871 (0.823–0.904) | 0.847 ± 0.052 | 0.464 ± 0.065 |
| 2500 | hessian | 0.912 ± 0.023 | 0.908 (0.887–0.945) | 0.758 ± 0.054 | 0.469 ± 0.057 |
| 5000 | se3_lift | 0.886 ± 0.038 | 0.892 (0.837–0.929) | 0.919 ± 0.029 | 0.512 ± 0.060 |
| 5000 | hessian | 0.938 ± 0.018 | 0.939 (0.913–0.960) | 0.913 ± 0.049 | 0.541 ± 0.066 |
| 20000 | se3_lift | 0.890 ± 0.038 | 0.896 (0.838–0.930) | 0.937 ± 0.022 | 0.530 ± 0.076 |
| 20000 | hessian | 0.943 ± 0.025 | 0.949 (0.910–0.973) | 0.974 ± 0.012 | 0.592 ± 0.057 |
| 80000 | se3_lift | 0.882 ± 0.037 | 0.886 (0.829–0.930) | 0.932 ± 0.023 | 0.523 ± 0.073 |
| 80000 | hessian | 0.939 ± 0.024 | 0.943 (0.906–0.968) | 0.973 ± 0.012 | 0.591 ± 0.054 |

### Paired differences (the H1 evidence)

| n_gal | n seeds | ΔC mean | ΔC median (p10–p90) | lift wins | Wilcoxon p (ΔC) | ΔjF1 mean | Wilcoxon p (ΔjF1) |
|---|---|---|---|---|---|---|---|
| 1200 | 50 | **+0.003** | +0.002 (-0.029–+0.035) | 27/50 | 0.47 | -0.071 | 5.9e-10 |
| 2500 | 50 | **-0.045** | -0.041 (-0.083–-0.018) | 3/50 | 2.5e-14 | -0.005 | 0.5 |
| 5000 | 50 | **-0.053** | -0.050 (-0.096–-0.016) | 0/50 | 1.8e-15 | -0.028 | 0.00065 |
| 20000 | 50 | **-0.053** | -0.050 (-0.087–-0.028) | 0/50 | 1.8e-15 | -0.062 | 5e-11 |
| 80000 | 50 | **-0.057** | -0.054 (-0.083–-0.036) | 0/50 | 1.8e-15 | -0.068 | 5.6e-11 |

![E0a straight: box plots with per-seed points of paired delta completeness and delta junction F1 vs galaxy count; positive favours the lift](figures/e0_delta_straight.png)

![E0a straight: completeness, purity, junction F1 vs galaxy count, both methods, mean ± sd over held-out seeds](figures/e0_curves_straight.png)

![E0a straight: 6-voxel slab of the galaxy field with truth (red) and extracted skeletons (blue) for both methods](figures/e0_slice_straight.png)


## Curved filaments

Chosen configs — lift: `{'sig_par': 6.0, 'sig_perp': 1.5, 'diff_iter': 2}`, hessian: `{'sigma': 1.5}`.


### Per-method summary

| n_gal | method | completeness mean ± sd | median (p10–p90) | purity | junction F1 |
|---|---|---|---|---|---|
| 1200 | se3_lift | 0.813 ± 0.030 | 0.815 (0.775–0.849) | 0.677 ± 0.050 | 0.376 ± 0.047 |
| 1200 | hessian | 0.810 ± 0.024 | 0.806 (0.784–0.841) | 0.707 ± 0.036 | 0.435 ± 0.039 |
| 2500 | se3_lift | 0.869 ± 0.032 | 0.874 (0.835–0.895) | 0.828 ± 0.055 | 0.459 ± 0.061 |
| 2500 | hessian | 0.919 ± 0.017 | 0.921 (0.899–0.936) | 0.778 ± 0.034 | 0.484 ± 0.042 |
| 5000 | se3_lift | 0.891 ± 0.036 | 0.899 (0.846–0.930) | 0.909 ± 0.029 | 0.508 ± 0.053 |
| 5000 | hessian | 0.956 ± 0.013 | 0.953 (0.944–0.975) | 0.866 ± 0.050 | 0.510 ± 0.052 |
| 20000 | se3_lift | 0.892 ± 0.043 | 0.902 (0.834–0.941) | 0.933 ± 0.026 | 0.520 ± 0.071 |
| 20000 | hessian | 0.956 ± 0.021 | 0.960 (0.932–0.982) | 0.971 ± 0.017 | 0.593 ± 0.058 |
| 80000 | se3_lift | 0.884 ± 0.046 | 0.888 (0.817–0.931) | 0.927 ± 0.028 | 0.519 ± 0.069 |
| 80000 | hessian | 0.950 ± 0.024 | 0.951 (0.919–0.977) | 0.974 ± 0.013 | 0.600 ± 0.053 |

### Paired differences (the H1 evidence)

| n_gal | n seeds | ΔC mean | ΔC median (p10–p90) | lift wins | Wilcoxon p (ΔC) | ΔjF1 mean | Wilcoxon p (ΔjF1) |
|---|---|---|---|---|---|---|---|
| 1200 | 50 | **+0.004** | +0.010 (-0.037–+0.044) | 30/50 | 0.36 | -0.059 | 8.9e-10 |
| 2500 | 50 | **-0.050** | -0.049 (-0.074–-0.016) | 0/50 | 1.8e-15 | -0.025 | 0.0054 |
| 5000 | 50 | **-0.064** | -0.062 (-0.104–-0.029) | 0/50 | 7.6e-10 | -0.003 | 0.75 |
| 20000 | 50 | **-0.064** | -0.059 (-0.101–-0.028) | 0/50 | 1.8e-15 | -0.073 | 3.1e-12 |
| 80000 | 50 | **-0.066** | -0.062 (-0.104–-0.033) | 0/50 | 1.8e-15 | -0.081 | 1.8e-15 |

![E0a curved: box plots with per-seed points of paired delta completeness and delta junction F1 vs galaxy count; positive favours the lift](figures/e0_delta_curved.png)

![E0a curved: completeness, purity, junction F1 vs galaxy count, both methods, mean ± sd over held-out seeds](figures/e0_curves_curved.png)

![E0a curved: 6-voxel slab of the galaxy field with truth (red) and extracted skeletons (blue) for both methods](figures/e0_slice_curved.png)


## Verdict on H1 (toy-level)

- **straight**: at the sparsest level (n_gal=1200) the lift wins completeness on 27/50 held-out seeds, mean Δ = +0.003 (Wilcoxon signed-rank p = 0.47); at the densest level Δ = -0.057 (p = 1.8e-15).
- **curved**: at the sparsest level (n_gal=1200) the lift wins completeness on 30/50 held-out seeds, mean Δ = +0.004 (Wilcoxon signed-rank p = 0.36); at the densest level Δ = -0.066 (p = 1.8e-15).

**Not supported (CORRECTED result).** An earlier version of this report claimed a sparse-regime lift win (+0.07 completeness at n_gal=2500). That was an evaluation artifact: the original extractor targeted mask volume, and realized skeleton lengths differed systematically between methods (lift ~19% longer at sparse levels) — longer skeletons buy completeness mechanically. With skeleton length enforced (iterative correction to the target), the Hessian matches or beats the lift at every sampling level on both variants; the lift's best case is a statistical tie at the ultra-sparse level (n_gal=1200, p≈0.4). Junction F1 favours the Hessian at essentially all levels. The diffusion component remains rejected by calibration (weak diffusion shows a small positive only at n_gal=1200 in the E0b sweep, +0.01). Detection of the artifact: an instrument change made for E1 (connected-web extraction) retroactively changed E0 parent scores; the n_est fields in the archived E0 results confirmed the length mismatch.


## Open questions / next tests

1. **Why doesn't diffusion help?** Candidates: bend level too mild (sag 15%); diffusion parameters not co-calibrated with filter scales; matched-length extraction absorbing its benefit. Next: sweep bend_frac ∈ {0.15, 0.3, 0.5} × diffusion strength, and score curvature-binned completeness (does diffusion win specifically on high-curvature arcs?).
2. **Junctions:** node clumps make junctions easy for both methods. Re-run with node_frac=0 — the lift should shine when junctions are only implied by filament continuity.
3. **Gravity realism (E1):** port the benchmark to a Zel'dovich / N-body field where filaments are tidal-sheared, not tubular — the regime the physics prior (tidal-modulated coefficients, H2) targets.
4. **Tier B:** the current extraction skeletonises the ridgeness; true SR geodesic tracing on the lifted graph is not yet exercised and is where curvature penalties enter explicitly.
