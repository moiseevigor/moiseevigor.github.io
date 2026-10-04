# E2 (H4-lite) — dynamics near filaments vs the lifted-geometry premise

Setup: 4 PM N-body runs (128³ grid & particles, EdS, a: 0.1→1.0, 90 steps), 50k tracked particles per run over a ∈ [0.5, 1.0]. Spines: SE(3) lift on the final density; e3 = tidal minor eigenvector (filament axis). P1: mean |v̂·e3| at a=1 (null 0.5). P2: squared projection of the mid-path deviation from the straight chord onto e3 (null 1/3). dev = mean deviation magnitude (voxels = h⁻¹Mpc).

| d to spine (vox) | n/seed | P1 ⟨\|v̂·e3\|⟩ | P2 ⟨(d̂ev·e3)²⟩ | ⟨\|dev\|⟩ vox |
|---|---|---|---|---|
| 0–2 | 20262 | 0.559 ± 0.013 | 0.364 ± 0.010 | 1.72 |
| 2–4 | 7244 | 0.537 ± 0.008 | 0.349 ± 0.004 | 1.22 |
| 4–8 | 6730 | 0.544 ± 0.011 | 0.327 ± 0.005 | 0.39 |
| 8–16 | 10315 | 0.572 ± 0.009 | 0.233 ± 0.005 | 0.27 |
| 16–64 | 5447 | 0.564 ± 0.020 | 0.208 ± 0.014 | 0.25 |

Nulls: P1 = 0.5, P2 = 1/3 ≈ 0.333 (isotropic). Values are across-seed mean ± sd; per-seed n is large so per-seed standard errors are negligible — seed scatter is the relevant uncertainty.

