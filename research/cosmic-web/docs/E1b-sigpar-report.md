# E1b — method-neutral H1 on gravity fields: mass coverage at matched spine length

Setup: 12 truncated-ZA boxes as in E1. Criterion needs no reference skeleton: fraction of all 128³ particles within r₀=3.0 vox of the spine set, spine length matched at 2400 vox. Note the spine budget covers only ~4% of the volume if spread randomly — differences measure how well spines sit on mass.

| n_gal | method | mass coverage | band coverage (2<ρ<20) | Δband vs hessian (p) | Δband vs lift_b0 (p) |
|---|---|---|---|---|---|
| 5000 | hessian | 0.2178 ± 0.0143 | 0.2860 ± 0.0149 | — | +0.0176 (0.00049) |
| 5000 | lift_s3 | 0.2037 ± 0.0126 | 0.2691 ± 0.0139 | -0.0169 (0.00098) | +0.0007 (0.52) |
| 5000 | lift_s45 | 0.2014 ± 0.0128 | 0.2663 ± 0.0148 | -0.0197 (0.0015) | -0.0021 (0.73) |
| 5000 | lift_b0 | 0.2029 ± 0.0144 | 0.2684 ± 0.0144 | -0.0176 (0.00049) | — |
| 20000 | hessian | 0.2497 ± 0.0106 | 0.3335 ± 0.0099 | — | +0.0427 (0.00049) |
| 20000 | lift_s3 | 0.2305 ± 0.0180 | 0.3095 ± 0.0191 | -0.0240 (0.00098) | +0.0188 (0.0015) |
| 20000 | lift_s45 | 0.2219 ± 0.0083 | 0.2974 ± 0.0082 | -0.0361 (0.00049) | +0.0066 (0.077) |
| 20000 | lift_b0 | 0.2177 ± 0.0146 | 0.2908 ± 0.0137 | -0.0427 (0.00049) | — |
