# E0d — post-correction follow-ups


## A. Splitting convergence (is the diffusion negative numerical?)

Equal total diffusion; fine = 8 Trotter steps. Curved toy, 20 seeds, corrected extractor.

| n_gal | diff | completeness | Δ vs off (p) |
|---|---|---|---|
| 1200 | off | 0.810 ± 0.024 | — |
| 1200 | coarse | 0.822 ± 0.026 | +0.0128 (0.027) |
| 1200 | fine | 0.819 ± 0.030 | +0.0089 (0.16) |
| 2500 | off | 0.897 ± 0.024 | — |
| 2500 | coarse | 0.877 ± 0.030 | -0.0196 (4.8e-05) |
| 2500 | fine | 0.880 ± 0.027 | -0.0169 (0.00021) |

## B. Sparsity limit (does the lift ever win honestly?)

| n_gal | ΔC (lift − hessian) | lift wins | Wilcoxon p | C hessian | C lift |
|---|---|---|---|---|---|
| 400 | -0.0165 | 8/30 | 0.0037 | 0.593 | 0.576 |
| 600 | -0.0214 | 8/30 | 0.002 | 0.693 | 0.671 |
| 800 | -0.0056 | 10/30 | 0.26 | 0.737 | 0.731 |
| 1200 | +0.0026 | 17/30 | 0.49 | 0.809 | 0.812 |

## C. Hybrid on gravity fields (truncated ZA, 12 seeds)

| n_gal | method | mass coverage | band coverage | Δband vs hessian (p) |
|---|---|---|---|---|
| 5000 | hessian | 0.2178 | 0.2860 ± 0.0149 | — |
| 5000 | se3_lift | 0.2029 | 0.2684 ± 0.0144 | -0.0176 (0.00049) |
| 5000 | hyb_sum | 0.2096 | 0.2775 ± 0.0122 | -0.0085 (0.042) |
| 20000 | hessian | 0.2497 | 0.3335 ± 0.0099 | — |
| 20000 | se3_lift | 0.2177 | 0.2908 ± 0.0137 | -0.0427 (0.00049) |
| 20000 | hyb_sum | 0.2374 | 0.3180 ± 0.0155 | -0.0155 (0.0068) |
