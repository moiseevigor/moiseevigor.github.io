# E3d — galaxy-pair bridge stack (small-scale WHIM design)

Setup: CMASS-N z 0.45–0.55 pairs with transverse separation 6.0–14.0 Mpc/h and line-of-sight separation < 6.0 Mpc/h (570049 pairs). Estimator: y at the pair midpoint minus the mean of the four off-axis points at identical angular distance from each galaxy (±90° rotations) — a circularly symmetric halo contributes zero by construction, so any positive mean is gas that lives preferentially ON the inter-pair axis. Errors: bootstrap over pairs (500 resamples).

| map | pairs used | bridge excess (y) | error | SNR |
|---|---|---|---|---|
| ACT | 237813 | 8.211e-09 | 9.448e-09 | **0.87** |
| PLANCK | 570049 | 3.389e-08 | 2.265e-09 | **14.96** |

## Verdict and caveat

- **Planck 15σ is a bridge + leakage upper bound, not a pure detection.**
  At a 10′ beam, the second halo's smeared profile contributes more at the
  midpoint than at the off-axis control (which sits farther from it), so
  the estimator retains a positive halo term. The measured 3.4×10⁻⁸ bounds
  the true bridge from above.
- **ACT is clean (leakage negligible at 1.6′) but underpowered:**
  ±9.4×10⁻⁹ per-pair-set error cannot resolve a literature-level bridge of
  ~1×10⁻⁸ (would be ~1σ — exactly what we see: 0.87σ).
- Both maps are mutually consistent with Model B at the ~10⁻⁸ level.
  Next (E3d-v2): full CMASS z-range, disc-averaged sampling, multi-angle
  ring controls — projected ACT error ~2–3×10⁻⁹, turning 10⁻⁸ into a
  3–5σ test.
