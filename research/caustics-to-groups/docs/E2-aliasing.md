# E2 — rigidity / aliasing map and the abnormal-stratum leg (tests H3, exercises M4)

Reproduce: `.venv/bin/python scripts/run_e2.py` → `artifacts/e2_results.json`.
Numbers below are from that artifact (20 trials per noise level).

## Hypothesis and prediction

**H3 (rigidity / aliasing).** Some group pairs are separated by only a single
fingerprint component; remove it and they alias. Pre-registered:

- Heisenberg vs SE(2): same growth vector (2,3), same abnormal bit → **δ only**.
- Engel vs Cartan: both have abnormals → **growth vector only**.
- all cross-class pairs: separated by growth vector *and* abnormal bit (redundant).
- no pair fully aliased under the complete kit.

Plus a sub-hypothesis on the abnormal leg (M4): because it asks a *coarser*
question (corank ≥ 2?) than the full growth vector, it should survive noise that
defeats M1.

## Clean observables

```
group        growth       δ       corank   abnormal
Heisenberg   (2,3)       -0.000     1       False
SE(2)        (2,3)        0.141     1       False
Engel        (2,3,4)      n/a       2       True
Cartan       (2,3,5)      n/a       3       True
```

## Aliasing map (H3)

```
pair                     minimal separator(s)
Heisenberg vs SE(2)      δ            <- collapses without δ
Heisenberg vs Engel      growth + abnormal
Heisenberg vs Cartan     growth + abnormal
SE(2)      vs Engel      growth + abnormal
SE(2)      vs Cartan     growth + abnormal
Engel      vs Cartan     growth       <- collapses without the growth vector
```

**H3: confirmed.** No pair is fully aliased under the full kit, but exactly two
pairs are *single-observable-dependent*: Heisenberg/SE(2) rides entirely on the
nilpotent deviation δ (they are identical in growth vector and abnormal bit), and
Engel/Cartan rides entirely on the growth vector (both carry abnormals, so that
bit cannot tell them apart). These are the rigidity points of the candidate list —
drop the load-bearing observable and the pair becomes indistinguishable.

## Rigidity under noise

Separation rate of the two load-bearing pairs vs added noise:

```
pair (via)                1e-3   1e-2   3e-2   1e-1
Heisenberg/SE(2) (δ)      1.00   1.00   1.00   0.20
Engel/Cartan   (growth)   0.90   0.65   0.00   0.00
```

The δ-separated pair is the more robust one: δ stays decisive to σ = 3e-2. The
growth-vector-separated pair (Engel/Cartan) is fragile because telling (2,3,4)
from (2,3,5) needs the step-3 weights, the noisiest part of M1.

## The complementary-robustness finding (M4 vs M1)

Correct-recovery rate, full growth vector (M1) vs the coarse abnormal bit (M4):

```
                       1e-3   1e-2   3e-2   1e-1
Engel  (M1 growth)     1.00   0.95   0.20   0.05
Engel  (M4 abnormal)   1.00   1.00   0.95   0.45
Cartan (M1 growth)     1.00   0.75   0.00   0.00
Cartan (M4 abnormal)   1.00   1.00   1.00   0.70
```

**M4 is dramatically more noise-robust than M1.** At σ = 3e-2, where M1 cannot
recover Cartan's growth vector at all (0.00), the abnormal bit is still perfect
(1.00). The reason is structural: M4 only needs to count the weight-1 coordinates
(the rank of D) against the ambient dimension — a coarse, robust question — whereas
M1 must resolve the fragile step-3 weights. The fingerprint components therefore
have **complementary noise profiles**: when M1 collapses a high-step group to
"unknown" (as in the E1 confusion matrix), M4 can still assign it to the
"non-contact / has-abnormals" class.

## Analysis and next steps

- **Classifier upgrade (next):** fall back to the M4 abnormal bit when M1 fails to
  resolve the full growth vector, so degraded Engel/Cartan are tagged
  "non-contact" rather than dropped to "unknown". This should lift the E1
  confusion-matrix accuracy at moderate noise without introducing wrong-group
  confusion.
- **Caveat (unchanged from E1):** M4 here is a corank flag, not a data-driven
  abnormal-*minimizer* detector (finding actual abnormal geodesics in caustic
  data); that remains the genuinely hard, lower-confidence piece deferred to the
  real-data phase.
- **Then:** draft Part 2 of the blog series from the E0/E1/E2 results.

## Verdict summary so far

- H1 (identifiability): confirmed (E0).
- H2 (discrimination): confirmed (E1).
- H3 (rigidity/aliasing): confirmed (E2) — honest map, two rigidity points, and
  complementary component robustness.
