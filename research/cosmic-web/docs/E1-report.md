# E1 — gravity-shaped fields (Zel'dovich, D=1.0): H1 transfer and first H2 test

Setup: 12 Zel'dovich boxes (128³, L=128 h⁻¹Mpc, BBKS spectrum, σ₈=0.8·D, truncated ZA R_t=2), full 2.1M-particle density as clean reference, sparse galaxy subsamples as input. All skeletons at matched length 2400 vox. Completeness/purity vs the clean reference of EACH method (2×2, conservative). M3 alignment: mean |tangent·e3| of spine tangents vs clean-field tidal eigenframe (isotropic null 0.5). H2 weight: w = 1 + β(⟨n,e3_sparse⟩² − 1/3).

| n_gal | method | C vs ref_hess | C vs ref_lift | P vs ref_hess | align e3 |
|---|---|---|---|---|---|
| 5000 | hessian | 0.396 ± 0.046 | 0.471 ± 0.047 | 0.379 | 0.665 |
| 5000 | lift_b0 | 0.332 ± 0.041 | 0.499 ± 0.055 | 0.351 | 0.734 |
| 5000 | lift_b1 | 0.292 ± 0.029 | 0.462 ± 0.048 | 0.358 | 0.719 |
| 5000 | lift_b2 | 0.300 ± 0.036 | 0.467 ± 0.050 | 0.356 | 0.722 |
| 20000 | hessian | 0.525 ± 0.026 | 0.571 ± 0.037 | 0.520 | 0.674 |
| 20000 | lift_b0 | 0.435 ± 0.039 | 0.629 ± 0.052 | 0.487 | 0.759 |
| 20000 | lift_b1 | 0.424 ± 0.037 | 0.640 ± 0.037 | 0.472 | 0.785 |
| 20000 | lift_b2 | 0.426 ± 0.037 | 0.638 ± 0.037 | 0.480 | 0.790 |

## Paired tests

- **H1 transfer, n_gal=5000** (lift β=0 vs hessian, judged on the hessian's own clean reference): ΔC = -0.064, wins 0/12, Wilcoxon p = 0.00049
- **H2, n_gal=5000, β=1** (tidal weight vs β=0, same reference): ΔC = -0.040, wins 1/12, Wilcoxon p = 0.00098
- **H2, n_gal=5000, β=2** (tidal weight vs β=0, same reference): ΔC = -0.032, wins 1/12, Wilcoxon p = 0.0015
- **H1 transfer, n_gal=20000** (lift β=0 vs hessian, judged on the hessian's own clean reference): ΔC = -0.090, wins 0/12, Wilcoxon p = 0.00049
- **H2, n_gal=20000, β=1** (tidal weight vs β=0, same reference): ΔC = -0.011, wins 5/12, Wilcoxon p = 0.3
- **H2, n_gal=20000, β=2** (tidal weight vs β=0, same reference): ΔC = -0.009, wins 4/12, Wilcoxon p = 0.34

## Verdict

1. **H1 transfer: inconclusive — the design caught its own confound.** The
   2×2 reference matrix shows strong method-affinity: each method scores
   ~0.07–0.19 higher against the clean reference extracted by its own
   family. Since the two clean references only overlap at C≈0.60, reference
   choice dominates the method effect. Skeleton-vs-skeleton scoring cannot
   settle H1 on fields without exact truth; a method-neutral criterion
   (mass/particle coverage, or dynamical tests) is required. This supersedes
   the naive reading "lift loses 0/12 on ref_hessian".
2. **H2 first pass: not supported.** Multiplicative tidal-alignment
   weighting (β=1,2) is significantly negative at n_gal=5000 and null at
   20000 against ref_hessian (mildly positive against ref_lift — again
   reference-dependent). The sparse-field tidal frame may simply be too
   noisy at these densities (estimated from the same data it re-weights).
3. **M3 — the clean positive finding:** spine tangents from the
   *unweighted* lift align with the clean-field tidal eigenvector e3 at
   0.734–0.759 vs the Hessian's 0.665–0.674 (isotropic null 0.5). The
   orientation-lifted skeleton is more physically oriented despite receiving
   no tidal information — supporting the claim that the lifted geometry
   captures the anisotropy of gravitational collapse better than pointwise
   curvature.

## Next

E2 (dynamical test, H4) needs beyond-Zel'dovich trajectories: under pure ZA
the ballistic baseline is exact by construction. Plan: minimal particle-mesh
N-body (leapfrog, FFT Poisson) to generate curved trajectories, then test
whether transport near filaments follows the lifted geometry's geodesics
better than the ballistic chord (metric M4).
