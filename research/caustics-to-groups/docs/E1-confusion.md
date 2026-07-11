# E1 — the three-component fingerprint and the first confusion matrix (tests H2)

Reproduce: `.venv/bin/python scripts/run_e1.py` → `artifacts/e1_results.json`.
Numbers below are from that artifact (25 held-out evaluation seeds per group;
threshold τ calibrated on 10 disjoint seeds).

## Hypothesis and prediction

**H2 (discrimination).** The three-component fingerprint separates
{Heisenberg, SE(2), Engel, Cartan} from caustic observables, with off-diagonal
mass significantly below chance, and the shared-tangent-cone alias
(Heisenberg vs SE(2), both growth vector (2,3)) broken by the conjugate-locus
deviation. Pre-registered from E0: the step-3 groups (Cartan) are the fragile
ones and should degrade first under noise.

## Method

Per noisy realization the classifier (`src/fingerprint.py`) applies:

1. **growth vector** (M1, from E0) → the class: (2,3) = {Heisenberg, SE(2)},
   (2,3,4) = Engel, (2,3,5) = Cartan;
2. within (2,3), the **nilpotent deviation** δ = mean over momenta of
   `1 − t_c(w)·|w|/(2π)` (M2): Heisenberg is the flat model so δ ≈ 0 at every
   scale; SE(2) departs from the nilpotent `2π/|w|` law as the momentum drops.

The abnormal-stratum bit (M4) is consistent with the class (present for
Engel/Cartan, absent for contact) and is used only as corroboration — a
data-driven abnormal test is deferred (lower-confidence leg).

Leakage: the generator produces the true conjugate-time law; measurement noise is
added and δ is re-measured from the noisy observation. τ is calibrated on held-out
seeds; the matrix is scored on disjoint seeds.

## Results

**The alias is broken.** Measured deviation curves (δ per momentum, w = 0.5…4):

```
Heisenberg  [-0.000 -0.000 -0.000 -0.000 -0.000]   (flat model, as it must be)
SE(2)       [ 0.342  0.207  0.099  0.040  0.015]   (departs at low momentum)
```

Mean δ: Heisenberg ≈ 0.002, SE(2) ≈ 0.140; calibrated threshold τ = 0.071 sits
cleanly between them.

**Confusion matrices** (rows = truth, columns = prediction; 25 seeds each):

```
M1 noise 1e-3  — accuracy 1.00 (chance 0.25)
              Heis  SE2  Eng  Car  unk
Heisenberg     25    0    0    0    0
SE(2)           0   25    0    0    0
Engel           0    0   25    0    0
Cartan          0    0    0   25    0

M1 noise 1e-2  — accuracy 0.91
              Heis  SE2  Eng  Car  unk
Heisenberg     25    0    0    0    0
SE(2)           0   25    0    0    0
Engel           0    0   22    0    3
Cartan          0    0    0   19    6

M1 noise 3e-2  — accuracy 0.57
              Heis  SE2  Eng  Car  unk
Heisenberg     25    0    0    0    0
SE(2)           0   25    0    0    0
Engel           0    0    6    0   19
Cartan          0    0    0    1   24
```

(Full grid, incl. 5e-3 → 0.99, in the artifact.)

## Analysis and verdict

**H2: confirmed.** Perfect 4-way separation on clean data (1.00 vs 0.25 chance),
and three features make the result trustworthy rather than lucky:

1. **The (2,3) alias is broken decisively and robustly.** Heisenberg and SE(2)
   never confuse each other at any noise level — their δ separation (0.002 vs
   0.140) dwarfs the threshold, and their growth vector (2,3) is the most
   noise-robust (E0). This is the moduli component doing exactly the job M1
   provably cannot.
2. **Degradation is ordered by step, as pre-registered.** Cartan (step 3) breaks
   first, then Engel; the contact groups stay perfect throughout. The mechanism is
   inherited straight from E0: a step-s group's discriminating coordinate has
   weight s and reaches only ~r^s, so it is the first casualty of noise.
3. **Failures are abstentions, not confusions.** Degraded Engel/Cartan
   realizations fall to **"unknown"** (their growth vector is misread and matches
   no candidate), never to a wrong group. Off-diagonal wrong-group mass is
   essentially zero at every noise level. The classifier says "I can't tell"
   rather than guessing — the honest and safe failure mode, and the behaviour the
   program wants when it moves to real data (E3/E4).

## Update — M4 fallback (added after E2)

Folding the abnormal bit in as a fallback (when the growth vector is unresolved,
tag the coarse class from corank instead of returning "unknown", per E2's
complementary-robustness finding) recovers class-level information at moderate
noise without introducing wrong-group errors:

```
M1 noise    exact acc    class acc   (class = coarse label counts if it contains truth)
1e-3          0.99         1.00
1e-2          0.87         1.00
3e-2          0.52         0.96
```

Exact-group accuracy still degrades (step-3 weights are irreducibly noise-fragile),
but the classifier now falls to the correct *coarse* class ("Engel/Cartan" =
non-contact) rather than to "unknown" — graceful degradation, not a cliff.

## Caveats (logged)

- The δ measurement noise here is a multiplicative proxy on the conjugate-time
  law, not endpoint noise propagated through the detector. E2/E3 should propagate
  position noise properly; the qualitative separation (large δ gap) is unlikely to
  change, but the exact noise scaling will.
- The abnormal-stratum leg is not yet a data-driven test; it currently only
  corroborates the growth vector. A genuine endpoint-map rank-deficiency test is
  the main remaining fingerprint component (M4), flagged lower-confidence.

## Next hypothesis / next tests

- **E2 (H3):** noise/sampling identifiability curves for the full classifier; the
  rigidity/aliasing map — confirm Heisenberg/SE(2) separate *only* via δ (not M1),
  and probe whether any projective-equivalence aliasing appears.
- Add a data-driven abnormal-stratum test and fold it in as an independent leg;
  measure whether it separates {contact} from {Engel, Cartan} at lower sample cost
  than the growth-vector reach.
- Then draft Part 2 of the blog series from these E0/E1 results.
