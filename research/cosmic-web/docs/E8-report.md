# E8 — field-level fidelity (the mock-catalogue criterion)

Full-set density fields vs PM truth, 3 seeds, 1 Mpc/h voxels. r(k): phase/structure fidelity (1 = perfect); T(k): amplitude fidelity (1 = unbiased).


## Cross-correlation r(k)

| k (h/Mpc) | ZA | isotropic stick | transverse damp |
|---|---|---|---|
| 0.06 | 0.997 | 0.991 | 0.997 |
| 0.09 | 0.993 | 0.970 | 0.989 |
| 0.14 | 0.975 | 0.890 | 0.962 |
| 0.22 | 0.924 | 0.730 | 0.901 |
| 0.34 | 0.710 | 0.374 | 0.716 |
| 0.53 | 0.288 | 0.089 | 0.388 |
| 0.82 | 0.057 | 0.008 | 0.095 |
| 1.26 | 0.005 | -0.001 | 0.009 |

## Transfer T(k)

| k (h/Mpc) | ZA | isotropic stick | transverse damp |
|---|---|---|---|
| 0.06 | 0.920 | 0.683 | 0.849 |
| 0.09 | 0.842 | 0.679 | 0.827 |
| 0.14 | 0.693 | 0.593 | 0.739 |
| 0.22 | 0.469 | 0.458 | 0.601 |
| 0.34 | 0.229 | 0.300 | 0.410 |
| 0.53 | 0.098 | 0.222 | 0.262 |
| 0.82 | 0.052 | 0.187 | 0.143 |
| 1.26 | 0.042 | 0.172 | 0.079 |

## Verdict (H-field)

Supported with quantified caveats. In the nonlinear regime the transverse
damping model beats ZA on both statistics (r at k=0.53: 0.388 vs 0.288;
T at k=0.34: 0.410 vs 0.229) — it extends the usable k-range of the mock —
while classical isotropic sticking degrades r(k) catastrophically at all
k > 0.1. Costs: ~7% amplitude deficit in the largest-scale bin
(0.849 vs 0.920; removable by the standard linear transfer rescaling) and
a small phase cost at intermediate k (r 0.962 vs 0.975 at k=0.14). E7b:
the 0.5 Mpc resolution row is now verified at n=3 (−12%, −9% on the two
added seeds).
