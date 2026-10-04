# E1b — method-neutral H1 on gravity fields: mass coverage at matched spine length

Setup: 12 truncated-ZA boxes as in E1. Criterion needs no reference skeleton: fraction of all 128³ particles within r₀=3.0 vox of the spine set, spine length matched at 2400 vox. Note the spine budget covers only ~4% of the volume if spread randomly — differences measure how well spines sit on mass.

| n_gal | method | mass coverage | band coverage (2<ρ<20) | Δband vs hessian (p) | Δband vs lift_b0 (p) |
|---|---|---|---|---|---|
| 5000 | hessian | 0.2178 ± 0.0143 | 0.2860 ± 0.0149 | — | +0.0176 (0.00049) |
| 5000 | lift_b0 | 0.2029 ± 0.0144 | 0.2684 ± 0.0144 | -0.0176 (0.00049) | — |
| 5000 | lift_b1_sparse | 0.1842 ± 0.0115 | 0.2425 ± 0.0133 | -0.0435 (0.00098) | -0.0259 (0.0015) |
| 5000 | lift_b1_clean | 0.1900 ± 0.0126 | 0.2504 ± 0.0141 | -0.0357 (0.00049) | -0.0180 (0.0034) |
| 20000 | hessian | 0.2497 ± 0.0106 | 0.3335 ± 0.0099 | — | +0.0427 (0.00049) |
| 20000 | lift_b0 | 0.2177 ± 0.0146 | 0.2908 ± 0.0137 | -0.0427 (0.00049) | — |
| 20000 | lift_b1_sparse | 0.2166 ± 0.0141 | 0.2880 ± 0.0148 | -0.0455 (0.00049) | -0.0027 (0.62) |
| 20000 | lift_b1_clean | 0.2126 ± 0.0144 | 0.2828 ± 0.0144 | -0.0507 (0.00049) | -0.0080 (0.092) |
