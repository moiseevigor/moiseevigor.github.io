# E1b-256 — resolution check (0.5 h⁻¹Mpc voxels, filament cross-sections resolved)

Setup: 6 truncated-ZA boxes, 256³ voxels over the same physical L=128 h⁻¹Mpc volume, physically matched scales (r₀=3 h⁻¹Mpc, spine budget 2400 h⁻¹Mpc). Band = 2<ρ<20.

| n_gal | method | mass coverage | band coverage | Δband vs hessian (p) |
|---|---|---|---|---|
| 5000 | hessian | 0.2289 ± 0.0108 | 0.2825 ± 0.0123 | — |
| 5000 | lift_3mpc | 0.2158 ± 0.0028 | 0.2678 ± 0.0035 | -0.0146 (0.16) |
| 5000 | lift_6mpc | 0.1890 ± 0.0114 | 0.2331 ± 0.0112 | -0.0494 (0.031) |
| 20000 | hessian | 0.2627 ± 0.0122 | 0.3272 ± 0.0179 | — |
| 20000 | lift_3mpc | 0.2481 ± 0.0091 | 0.3109 ± 0.0113 | -0.0163 (0.062) |
| 20000 | lift_6mpc | 0.2207 ± 0.0070 | 0.2730 ± 0.0069 | -0.0542 (0.031) |
