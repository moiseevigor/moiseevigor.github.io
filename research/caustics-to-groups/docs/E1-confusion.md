# E1 — the three-component fingerprint and the first confusion matrix (tests H2)

Reproduce: `.venv/bin/python scripts/run_e1.py` → `artifacts/e1_results.json`.
Numbers below are from that artifact, full run (no `--quick`): 25 held-out evaluation
seeds per group; threshold τ calibrated on 10 disjoint seeds. `--quick` is a smoke run
(10 evaluation seeds, 2 noise levels) and overwrites the artifact with different counts.

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

Mean δ on the 10 calibration seeds: Heisenberg 0.002, SE(2) 0.140; calibrated
threshold τ = 0.071 sits cleanly between them (`tau`, `tau_calibration` in the artifact).

**Confusion matrices** (rows = truth, columns = prediction; 25 evaluation seeds per
group, 400 geodesics per realization). Columns `E/C` and `H/S` are the coarse labels
"Engel/Cartan" and "Heisenberg/SE(2)" that the classifier falls back to (via the corank /
abnormal bit M4, see E2) when the growth vector matches no candidate. "exact" = diagonal
mass / 100; "class" = exact plus coarse labels that contain the true group, / 100.
M1 noise σ = standard deviation of absolute Gaussian jitter on geodesic endpoints.

```
M1 noise 1e-3  — exact 0.99, class 1.00 (chance 0.25)
              Heis  SE2  Eng  Car  E/C  H/S  unk
Heisenberg     25    0    0    0    0    0    0
SE(2)           0   25    0    0    0    0    0
Engel           0    0   25    0    0    0    0
Cartan          0    0    0   24    1    0    0

M1 noise 5e-3  — exact 0.95, class 1.00
              Heis  SE2  Eng  Car  E/C  H/S  unk
Heisenberg     25    0    0    0    0    0    0
SE(2)           0   25    0    0    0    0    0
Engel           0    0   24    0    1    0    0
Cartan          0    0    0   21    4    0    0

M1 noise 1e-2  — exact 0.88, class 1.00
              Heis  SE2  Eng  Car  E/C  H/S  unk
Heisenberg     25    0    0    0    0    0    0
SE(2)           0   25    0    0    0    0    0
Engel           0    0   20    0    5    0    0
Cartan          0    0    0   18    7    0    0

M1 noise 3e-2  — exact 0.55, class 0.98
              Heis  SE2  Eng  Car  E/C  H/S  unk
Heisenberg     25    0    0    0    0    0    0
SE(2)           0   25    0    0    0    0    0
Engel           0    0    4    0   19    2    0
Cartan          0    0    0    1   24    0    0
```

## Analysis and verdict

**H2: confirmed.** Near-perfect 4-way separation at the lowest noise (0.99 exact vs
0.25 chance; one Cartan realization hedges to the coarse class), and three features make
the result trustworthy rather than lucky:

1. **The (2,3) alias is broken decisively and robustly.** Heisenberg and SE(2)
   never confuse each other at any noise level — their δ separation (0.002 vs
   0.140) dwarfs the threshold, and their growth vector (2,3) is the most
   noise-robust (E0). This is the moduli component doing exactly the job M1
   provably cannot.
2. **Degradation is ordered by step, as pre-registered.** Cartan (step 3) breaks
   first, then Engel; the contact groups stay perfect throughout. The mechanism is
   inherited straight from E0: a step-s group's discriminating coordinate has
   weight s and reaches only ~r^s, so it is the first casualty of noise.
3. **Failures are hedges, not confusions.** Degraded Engel/Cartan realizations fall
   to the coarse class "Engel/Cartan" (their growth vector is misread and matches no
   candidate; the M4 fallback then tags the class from the corank), never to a wrong
   exact group. The only wrong answers in the whole grid are 2 of 25 Engel
   realizations at σ = 3e-2 that land in the wrong coarse class "Heisenberg/SE(2)".

## The M4 fallback (added after E2)

The classifier's fallback (when the growth vector is unresolved, tag the coarse class
from the corank instead of returning "unknown", per E2's complementary-robustness
finding) is what separates the two accuracy columns. Without it every coarse-labelled
realization would be "unknown", i.e. accuracy would equal the "exact" column:

```
M1 noise    exact acc    class acc   (class = coarse label counts if it contains truth)
1e-3          0.99         1.00
5e-3          0.95         1.00
1e-2          0.88         1.00
3e-2          0.55         0.98
```

Exact-group accuracy still degrades (step-3 weights are irreducibly noise-fragile),
but the classifier falls to the correct *coarse* class ("Engel/Cartan" =
non-contact) rather than to "unknown" — graceful degradation, not a cliff.

**Reproducibility note.** Evaluation seeds are `10000 + crc32(group) % 1000 + i`.
An earlier version used Python's built-in `hash(group)`, which is salted per process,
so counts at σ ≥ 1e-2 moved by a few realizations from run to run (e.g. exact accuracy
0.87 / 0.52 in one earlier run vs 0.88 / 0.55 here). The numbers above are the
deterministic ones.

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
