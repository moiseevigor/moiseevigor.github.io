# E6 — transfer test of the frozen model (no re-calibration)

Recipe frozen at β=0.6, frame smoothing 2.0 Mpc/h, ρ_c=5.0; 3 held-out seeds per condition. Voxel sizes differ across conditions, so compare the RELATIVE advantage over ZA, not absolute voxel errors.

| condition | ZA all | model all | Δ all | ZA web | model web | Δ web |
|---|---|---|---|---|---|---|
| base | 4.98 | 4.52 | **-9%** | 6.93 | 5.78 | **-17%** |
| coarse | 2.09 | 2.04 | **-2%** | 3.37 | 3.08 | **-9%** |
| s8lo | 2.98 | 2.89 | **-3%** | 4.73 | 4.26 | **-10%** |
| s8hi | 7.20 | 6.23 | **-13%** | 9.36 | 7.33 | **-22%** |

Success criterion: Δ ≤ 0 in every condition (advantage persists with frozen knobs). Degradation localizes which parameter is condition-dependent.


## Verdict

H-transfer supported in all conditions with frozen knobs: the advantage
over ZA persists at 2 Mpc/h voxels (−2% overall, −9% web) and at both
clustering amplitudes, and it GROWS with sigma8 (−3% → −9% → −13%
overall; −10% → −17% → −22% at the web) — the monotone trend expected of
a physical shell-crossing correction, not a tuned artifact. The model
card's resolution/amplitude limitation is closed; remaining scope
limits are LCDM time-stepping (engineering) and multi-stream interiors
(out of scope by design).
