# E1b-pm — method-neutral H1 on gravity fields (PM N-body): mass coverage at matched spine length

Setup: 8 PM N-body boxes (128³, EdS, a: 0.1→1). Criterion needs no reference skeleton: fraction of all 128³ particles within r₀=3.0 vox of the spine set, spine length matched at 2400 vox. Note the spine budget covers only ~4% of the volume if spread randomly — differences measure how well spines sit on mass.

| n_gal | method | mass coverage | band coverage (2<ρ<20) | Δband vs hessian (p) | Δband vs lift_b0 (p) |
|---|---|---|---|---|---|
| 5000 | hessian | 0.4840 ± 0.0224 | 0.2969 ± 0.0172 | — | +0.0557 (0.0078) |
| 5000 | lift_s3 | 0.4727 ± 0.0159 | 0.2924 ± 0.0117 | -0.0045 (0.55) | +0.0512 (0.0078) |
| 5000 | lift_s45 | 0.4448 ± 0.0206 | 0.2703 ± 0.0146 | -0.0267 (0.0078) | +0.0291 (0.0078) |
| 5000 | lift_b0 | 0.4105 ± 0.0242 | 0.2412 ± 0.0196 | -0.0557 (0.0078) | — |
| 20000 | hessian | 0.5228 ± 0.0161 | 0.3329 ± 0.0094 | — | +0.0496 (0.0078) |
| 20000 | lift_s3 | 0.4993 ± 0.0137 | 0.3102 ± 0.0067 | -0.0228 (0.0078) | +0.0268 (0.016) |
| 20000 | lift_s45 | 0.4915 ± 0.0173 | 0.3047 ± 0.0128 | -0.0282 (0.0078) | +0.0214 (0.0078) |
| 20000 | lift_b0 | 0.4662 ± 0.0151 | 0.2833 ± 0.0127 | -0.0496 (0.0078) | — |
