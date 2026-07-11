# E0 — tangent-cone growth-vector recovery (tests H1)

Reproduce: `.venv/bin/python scripts/run_e0.py` → `artifacts/e0_results.json`.
All numbers below are from that artifact (N_TRIALS = 15 held-out seeds).

## Hypothesis and prediction

**H1 (identifiability).** From noisy, finite samples of geodesic spreading, the
tangent-cone growth vector is recovered stably, with accuracy rising in sample
size and degrading gracefully in noise.

**Falsifiable prediction (pre-registered weights, from the graded structure):**

| Group | coord weights | growth vector | Q |
|---|---|---|---|
| Heisenberg | (1, 1, 2) | (2, 3) | 4 |
| SE(2) | (1, 2, 1) | (2, 3) | 4 |
| Engel | (1, 1, 2, 3) | (2, 3, 4) | 7 |

Heisenberg and SE(2) share the tangent cone (both nilpotentize to Heisenberg), so
M1 **must** return the same vector for them — a pre-registered aliasing, not a
failure. The split is deferred to the conjugate-locus moduli (E1).

## Method (metric M1)

For each group we integrate the Lie–Poisson normal-geodesic flow (`src/liegroup.py`)
from the identity over a batch of unit-speed covectors with vertical momenta drawn
log-uniformly across a wide band (magnitude 0.5–60, random sign). At each geodesic
length `r` on a grid (0.15–1.0, 6 points) we measure each ambient coordinate's
**reach** — the 98th percentile of `|coord|` across the front. By the Ball–Box
theorem a coordinate of weight `w` reaches `~ r^w`, so a log–log fit gives `w`; the
multiset of weights builds the growth vector (`src/growth.py`).

Two design points, both forced by what the data showed (see "Methodological
findings"): (i) momenta must span a **wide** band so every radius samples each
coordinate's full reach; (ii) the weight fit models a **noise floor**,
`m(r) = sqrt((a r^w)^2 + b^2)`, so absolute position noise degrades recovery
gracefully instead of cliff-collapsing.

## Results

**Clean recovery (noise 0, n=800):** all three vectors recovered exactly; measured
weights Heisenberg (0.96, 0.97, 2.00), SE(2) (0.94, 1.92, 0.97), Engel
(0.95, 0.99, 1.91, 2.82). Heisenberg and SE(2) both → (2,3): **aliased as
predicted.**

**Noise robustness** — recovery rate vs added absolute position noise σ (n=400):

```
 σ →        0    1e-3   1e-2   3e-2   1e-1   3e-1
Heisenberg 1.00  1.00   1.00   1.00   0.27   0.00
SE(2)      1.00  1.00   1.00   1.00   0.80   0.13
Engel      1.00  1.00   0.87   0.33   0.00   0.07
```

**Sample complexity** — recovery rate vs number of geodesics (σ = 1e-2):

```
 n →        50    100    200    400    800
Heisenberg 0.93  1.00   1.00   1.00   1.00
SE(2)      1.00  1.00   1.00   1.00   1.00
Engel      0.20  0.47   0.67   0.87   1.00
```

## Analysis and verdict

**H1: confirmed, with the tradeoff mapped.** The growth vector is recovered
exactly on clean data and stays perfect to σ ≈ 3e-2 for the contact groups. The
central quantitative finding is an **ordering by step**: Engel (step 3) is
uniformly the hardest — it tolerates the least noise (breaks by σ = 3e-2 vs 1e-1
for the contact groups) and needs the most samples (0.20 → 1.00 across n = 50 →
800, where the contact groups saturate by n ≈ 100). The mechanism is direct: the
discriminating coordinate of a step-`s` group has weight `s`, so it reaches only
`~ r^s` — vanishingly small at small radius — and is the first casualty of both
finite sampling and absolute noise. Higher-step structure is intrinsically more
fragile to read from caustic data. The pre-registered Heisenberg/SE(2) aliasing
held exactly.

## Methodological findings (logged for the in-the-wild estimator)

1. **Fixed-momentum spread gives spurious weights.** A first estimator using the
   std of a fixed momentum distribution measured Heisenberg's z-weight as **2.78**,
   not 2: at small `r` the front only samples `w r → 0`, where `z ≈ w r^3/12` (the
   cubic term), adding a spurious power of `r`. The true weight appears only under
   the anisotropic dilation — realised here by wide-band momenta + reach.
2. **Absolute noise demands a noise-floor fit.** A plain log-slope collapses to
   zero recovery at σ ≥ 1e-2 (the small-`r`, high-weight reach drops below σ and
   flattens the slope). Modelling the floor explicitly restores the graded curves
   above. In the wild, `b` is an estimate of the position-measurement precision.

## Next hypothesis / next tests

- **E1 (H2):** add Engel and Cartan conjugate loci; compute the nilpotent-deviation
  statistic δ and the moduli (χ, κ) to split the Heisenberg/SE(2) alias that M1
  cannot; build the first confusion matrix over the four-group list.
- Open: does the abnormal-stratum bit (Engel/Cartan present, contact absent)
  separate the classes at lower sample cost than the growth-vector reach, given
  the step-3 fragility found here?
- Open: in SR-normal coordinates estimated from data (not the adapted coordinates
  used here), how much does the weight-fit bias grow?
