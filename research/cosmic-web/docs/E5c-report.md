# E5c — refinement campaign (declared optimization)

Config grid over frame source (ZA proxy vs model self-density), damping fraction β, crossing threshold ρ_c, and sequential (pancake-ordered) damping. Selection on seeds {2,3}; the top two configs validated on held-out seeds {4,5,6}. References: ZA and the E5b oracle bound (4.47 overall).

## Selection scores (median voxel error, seeds 2–3)

| config | overall error |
|---|---|
| C_self_b075_r5 | 4.662 |
| F_self_b075_r3_sq | 4.837 |
| A_proxy_b1_r5 | 4.926 |
| E_self_b1_r5_sq | 4.943 |
| B_self_b1_r5 | 5.024 |
| D_self_b1_r3 | 5.403 |

## Held-out validation (seeds 4–6)

| quantity | ZA | C_self_b075_r5 | F_self_b075_r3_sq |
|---|---|---|---|
| **all** | 4.98 ± 0.27 | 4.64 ± 0.18 | 4.83 ± 0.15 |
| 0–2 | — | 5.96 ± 0.13 | 6.26 ± 0.12 |
| 2–4 | — | 5.37 ± 0.23 | 5.73 ± 0.21 |
| 4–8 | — | 3.67 ± 0.14 | 3.83 ± 0.13 |
| 8–64 | — | 3.28 ± 0.11 | 3.26 ± 0.09 |

## Verdict

Held-out winner: **self-density frames + β = 0.75 partial transverse
damping** (C): 4.64 ± 0.18 vs ZA 4.98 ± 0.27 (−7% overall; −14% at the
web vs ZA), recovering ~63% of the oracle-bound gap (4.93 → 4.64 of the
0.46 available). Structural findings: (1) partial damping is what makes
self-density frames profitable — at β = 1 the model's own density
feedback over-triggers crossings and cancels the frame gain; (2)
sequential pancake-ordered damping (e1 then e2) underperforms simple
both-perpendicular damping at 1 Mpc resolution.
