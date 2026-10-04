# E9 — literature baselines: 2LPT and MUSCLE vs the frozen model

Identical initial conditions, PM truth, 3 seeds. Transport errors in voxels (= h⁻¹Mpc); web = within 2 of the spine network.

## Per-particle transport error (median)

| model | all | web |
|---|---|---|
| ZA | 4.97 ± 0.27 | 6.92 ± 0.31 |
| 2LPT | 8.07 ± 0.39 | 8.21 ± 0.35 |
| MUSCLE | 4.49 ± 0.12 | 5.57 ± 0.07 |
| transverse damp | 4.52 ± 0.18 | 5.77 ± 0.16 |

## Cross-correlation r(k)

| k (h/Mpc) | ZA | 2LPT | MUSCLE | transverse damp |
|---|---|---|---|---|
| 0.14 | 0.975 | 0.933 | 0.956 | 0.962 |
| 0.34 | 0.710 | 0.691 | 0.771 | 0.716 |
| 0.53 | 0.288 | 0.430 | 0.527 | 0.388 |
| 0.82 | 0.057 | 0.144 | 0.228 | 0.095 |

## Transfer T(k)

| k (h/Mpc) | ZA | 2LPT | MUSCLE | transverse damp |
|---|---|---|---|---|
| 0.14 | 0.693 | 0.607 | 0.669 | 0.739 |
| 0.34 | 0.229 | 0.202 | 0.433 | 0.410 |
| 0.53 | 0.098 | 0.095 | 0.305 | 0.262 |
| 0.82 | 0.052 | 0.048 | 0.210 | 0.143 |

## Verdict — the framing decision

MUSCLE (Neyrinck 2016) statistically ties the frozen transverse-damping
model on transport (4.49 ± 0.12 vs 4.52 ± 0.18; slightly ahead at the
web) and wins small-scale phase fidelity, while the damping model leads
on mid-scale amplitude T(k). 2LPT degrades transport at these nonlinear
scales (8.07 — the known shell-crossing overshoot). Consequence for the
paper: the contribution is NOT "a better mock engine than the
literature"; it is the MECHANISM result — E4 measured that the correction
budget beyond ZA is transverse in the tidal frame, and a model built
from exactly that single directional ingredient reproduces MUSCLE-level
transport. MUSCLE-class shell-crossing corrections work, we can now say,
BECAUSE they implement transverse arrest; the two models' complementary
field-level strengths (phases vs amplitudes) suggest a hybrid as future
work.
