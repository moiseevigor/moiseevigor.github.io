# E10 — is a generic first-conjugate point a fold? (evidence for the group-blindness premise)

Reproduce: `.venv/bin/python scripts/run_e10.py` → `artifacts/e10_results.json`
(full run, ~7 min; `--quick` uses 6 covectors per group). All numbers below are from
that artifact.

## Question

The series' design rests on "local caustics are group-blind". Arnol'd's ADE theorem
gives that for **generic** Lagrangian maps (dimension ≤ 5). A left-invariant
sub-Riemannian exponential map is one specific, symmetric Lagrangian map, so for our
candidate groups the statement is a hypothesis. Does it hold where it can be checked?

## Hypothesis (pre-registered) and metric

**H-fold.** Along a randomly chosen normal geodesic of SE(2), Engel and Cartan (random
covector ⇒ away from abnormals; scan starts at t = 0.3 ⇒ away from the pole), the first
conjugate point is a **fold** (A2) of the exponential map. **Negative control:**
Heisenberg must *fail* the test — its first conjugate locus is the collapsed z-axis, a
symmetry-degenerate (non-generic) singularity.

Whitney/Morin fold criterion at a critical point p* of E(p) = exp_e(p), all required:

| quantity | definition | fold iff |
|---|---|---|
| gap | s_{n-1}/s_1, singular values s_1 ≥ … ≥ s_n of DE(p*) | > 100 · residual (corank 1) |
| residual | s_n/s_1 | ≈ 0 (it is a critical point) |
| \|d σ_n\| | \|∇ det DE\| / (s_1 ⋯ s_{n-1}) | ≠ 0 (critical set is a smooth hypersurface) |
| transversality | \|∇ det DE · v\| / \|∇ det DE\|, v = ker DE(p*) | > 1e-3 (kernel not tangent to the critical set) |

Transversality is the cosine of the angle between the kernel and the normal to the
critical hypersurface: 0 means the kernel is tangent (cusp or worse, or a
symmetry-collapsed locus), anything bounded away from 0 is a fold. The 1e-3 threshold is
calibrated on the control, whose exact value is 0 and which measures ≤ 2.1e-7.

## Test

`scripts/run_e10.py`: per group, 24 covectors (seed 0; unit horizontal part, each
vertical momentum of magnitude uniform in [1, 3] with random sign). DE by central
differences (step 1e-4) through the RK4 Lie–Poisson engine (`src/liegroup.py`, 4000
steps); first sign change of det DE(t·h0) for t ∈ (0.3, 12], refined by four rounds of
32× bracketing; ∇ det by central differences (step 1e-3). One variable changes between
rows: the group.

## Result

```
group       found   t_c median   gap min   residual max   |d σ_n| min   transversality min / median / max   folds
Heisenberg  24/24     3.694      0.4159      2.2e-08        0.159        5.4e-09 / 5.2e-08 / 2.1e-07         0/24
SE(2)       24/24     3.459      0.3790      2.3e-08        0.093        1.0e-01 / 2.8e-01 / 4.6e-01        24/24
Engel       24/24     5.111      0.0101      9.9e-09        0.007        3.5e-03 / 1.4e-01 / 9.6e-01        24/24
Cartan      24/24     4.821      0.0021      1.3e-09        0.003        1.5e-03 / 5.0e-02 / 3.3e-01        24/24
```

(t_c = first conjugate time along the unit-speed geodesic, group units.)

**H-fold: confirmed on this sample.** Every sampled first-conjugate point of SE(2),
Engel and Cartan is corank 1 with the kernel transverse to a smooth critical
hypersurface — a fold. The control behaves as it must: Heisenberg is corank 1 but its
kernel (the rotation direction) is tangent to the critical set to 7 digits, so 0/24
folds. The detector can say "not a fold", and says it exactly where the theory predicts.

## Caveats

- **Sample, not proof.** 24 covectors per group in one momentum band; a fold at sampled
  points says the fold stratum is open and non-empty, not that the whole locus is ADE.
- **Folds only.** Cusps (A3) and higher germs sit on lower-dimensional sets that random
  geodesics miss; their type on Engel and Cartan was not checked. The smallest Engel
  and Cartan transversalities (3.5e-3, 1.5e-3) are only just above threshold —
  consistent with sample points lying near a cusp set, not examined further.
- **First conjugate point only**, found as a sign change of det DE (an even-order zero
  would be skipped).
- **Finite differences.** Diagnostics were unchanged to 3 digits when the ∇ det step was
  cut to 3e-4 and the RK4 steps doubled (checked on 6 Cartan covectors, not stored).
- **Pole, abnormal set, SE(3)** (dimension 6) are outside the test.

## Next

- Locate the cusp set of the Engel and Cartan first conjugate loci (zero set of the
  transversality) and verify the A3 normal form there.
- Repeat at covectors approaching the abnormal direction to see where the fold
  description breaks down.

Follow-up: the first item and the SE(3) gap are taken up in
[E11](E11-cusp-germs.md) (cusps located on Engel and Cartan, together with a degenerate
non-A3 stratum; fold test on SE(3) and its nilpotent cone).
