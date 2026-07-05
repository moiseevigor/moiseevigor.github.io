# E0c — junction/spine hybrids on the curved toy (exact truth)

Setup: E0-curved protocol, 20 held-out seeds, sparse levels only (where the division of labour lives). Hybrids are sums/maxima of percentile-normalised parent scores; identical matched-length pipeline.

| n_gal | method | completeness | purity | junction F1 | ΔC vs best parent (p) | ΔjF1 vs best parent (p) |
|---|---|---|---|---|---|---|
| 2500 | hessian | 0.916 ± 0.018 | 0.780 | 0.493 ± 0.049 | — | — |
| 2500 | se3_lift | 0.897 ± 0.024 | 0.792 | 0.437 ± 0.058 | — | — |
| 2500 | hyb_sum | 0.921 ± 0.022 | 0.829 | 0.483 ± 0.050 | +0.005 vs hessian (0.28) | -0.010 vs hessian (0.18) |
| 2500 | hyb_max | 0.900 ± 0.023 | 0.793 | 0.440 ± 0.067 | -0.016 vs hessian (0.0056) | -0.053 vs hessian (6.3e-05) |
| 5000 | hessian | 0.954 ± 0.010 | 0.872 | 0.514 ± 0.057 | — | — |
| 5000 | se3_lift | 0.911 ± 0.031 | 0.867 | 0.495 ± 0.067 | — | — |
| 5000 | hyb_sum | 0.935 ± 0.023 | 0.924 | 0.553 ± 0.057 | -0.019 vs hessian (9.5e-06) | +0.040 vs hessian (0.00013) |
| 5000 | hyb_max | 0.912 ± 0.027 | 0.866 | 0.490 ± 0.069 | -0.042 vs hessian (1.9e-06) | -0.024 vs hessian (0.027) |
