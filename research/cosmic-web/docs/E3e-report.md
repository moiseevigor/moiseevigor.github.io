# E3e — validity battery for the bridge detection

Jackknife errors over 50 RA patches (pairs overlap on the sky, so pair-bootstrap is too optimistic). Null pairs: same transverse window, line-of-sight separation 25–40 Mpc/h — same sky geometry, no physical bridge.

| map | pair set | n | bridge (y) | jackknife err | SNR |
|---|---|---|---|---|---|
| ACT | connected | 361057 | 2.278e-08 | 6.911e-09 | **3.30** |
| ACT | null | 460389 | 8.449e-09 | 5.130e-09 | **1.65** |
| PLANCK | connected | 876639 | 2.967e-08 | 3.715e-09 | **7.99** |
| PLANCK | null | 1117971 | 1.801e-08 | 3.828e-09 | **4.70** |

## ACT bridge vs transverse separation (connected pairs)

| separation (Mpc/h) | n | bridge (y) | err | SNR |
|---|---|---|---|---|
| 6-8 | 82303 | 2.601e-08 | 1.227e-08 | 2.12 |
| 8-10 | 87752 | 2.753e-08 | 1.200e-08 | 2.29 |
| 10-12 | 92889 | 1.766e-08 | 1.017e-08 | 1.74 |
| 12-14 | 98109 | 1.732e-08 | 1.121e-08 | 1.54 |

## Verdict — the claim after the battery

1. **Honest errors**: jackknife over sky patches deflates pair-bootstrap
   SNRs by ~1.6–2.4×: ACT connected 3.30σ (gate ≥3 still passed),
   Planck 7.99σ.
2. **Null pairs**: zero on ACT (1.65σ) but **4.7σ nonzero on Planck**
   (1.80×10⁻⁸) — direct quantitative confirmation of second-halo beam
   leakage at 10′.
3. **Null-subtracted bridge** (the physically meaningful number):
   ACT 1.4×10⁻⁸ ± 0.9 (≈1.6σ), Planck 1.2×10⁻⁸ ± 0.5 (≈2.2σ).
   Mutually consistent and matching published LRG-pair bridge amplitudes
   (~1×10⁻⁸).
4. **Final claim**: the pipeline reproduces the literature bridge
   amplitude with honest errors and physical nulls, at ~2σ per
   instrument. The earlier 5.24σ was on-axis excess including
   correlated-structure/leakage components; a >3σ *bridge-specific*
   claim from this data would need model-based halo subtraction and a
   joint-map likelihood — the natural scope of a dedicated paper.
5. Separation bins are flat within errors (2.6→1.7×10⁻⁸ over 6–14
   Mpc/h) — no steep decline, consistent with a genuine extended
   component plus leakage, discriminating power limited at n≈90k/bin.
