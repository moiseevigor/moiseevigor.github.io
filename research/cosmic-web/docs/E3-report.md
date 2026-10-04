# E3 — BOSS CMASS × Planck lensing/tSZ (tiled shell)

Setup: CMASS-North, z ∈ [0.45, 0.55] (291188 galaxies; 274075 used across 18 tiles of 512 Mpc/h at 4 Mpc/h voxels). Spines at matched length (2400 vox per tile), both methods. Stacks: mean map value at spine sky positions vs 200 footprint-constrained RA-rotated/DEC-reflected controls. First pass: no systematics weights, single shell, projected through the full shell depth.

## M3 on real data (spine–tidal-frame alignment, null 0.5)

- **hessian**: 0.617 ± 0.016 (mean ± sd over tiles)
- **se3_lift**: 0.677 ± 0.016 (mean ± sd over tiles)

## Cross-signal stacks

| spine set | map | stack | null mean ± std | SNR |
|---|---|---|---|---|
| hessian | kappa | 1.078e-03 | -9.332e-04 ± 5.979e-03 | **0.34** |
| hessian | y | 4.517e-08 | -2.951e-08 ± 1.549e-08 | **4.82** |
| se3_lift | kappa | -1.400e-03 | -6.835e-05 ± 5.940e-03 | **-0.22** |
| se3_lift | y | 3.343e-08 | -2.487e-08 ± 1.409e-08 | **4.14** |

Reading: positive SNR means the spine network sits on more lensing convergence / hot gas than footprint-matched random placements. H3 asks whether the lift's spines carry at least the Hessian's signal at equal length.


## Verdict (first pass)

1. **H3 — spine networks trace real gas: supported.** Both methods' spine
   networks show a ~4–5σ Compton-y excess over footprint-matched controls;
   Planck lensing is null (noise-dominated at these scales, as expected).
2. **H3 comparison — Hessian ≥ lift on real cross-signals** (4.8σ vs 4.1σ
   at matched length), consistent with the corrected H1 and E1b: the
   simpler model is also the better mass/gas tracer on real data.
3. **M3-real — the lift's descriptor advantage replicates on the real
   Universe**: spine–tidal-frame alignment 0.677 ± 0.016 vs 0.617 ± 0.016
   across 18 independent tiles (null 0.5) — a clean, tile-replicated
   separation matching the simulation finding.

## Caveats (would tighten a second pass)

- Controls rotate in RA / reflect in DEC, which changes galactic latitude;
  a latitude-dependent y foreground could bias the SNR. Fixed-galactic-
  latitude nulls are the right refinement.
- The y excess includes the halo gas of the CMASS tracers themselves, not
  only intergalactic filament gas; masking tracer positions would isolate
  the WHIM component.
- No FKP/systematics weights; single redshift shell; spines projected
  through the full ~250 Mpc/h shell depth.
