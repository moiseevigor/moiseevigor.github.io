# R2 — classifying nulls under noise: integrate or differentiate?

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_r2_classifier.py`
(≈45 min; `--fast` for a smoke run). Results → `artifacts/r2_results.json`,
figure → `public/img/posts/forbidden-directions-r2-noise.png`.
Protocol pre-registered in [`PROGRAM-P3-real-null-grounding.md`](PROGRAM-P3-real-null-grounding.md).

## Question

The standard null classification (Parnell radial/spiral ± sign) is a function of the
Jacobian **M = ∇B**, estimated in practice by differentiating a noisy gridded field. The
sub-Riemannian read-out can instead *integrate*: trajectories of the curvature-kernel flow
(field lines), their winding, and their escape asymmetry — no derivative ever taken. **Does
integration classify more robustly under noise?** (H-R2; H-R1 = does it classify at all.)

## Protocol (fairness)

Same noisy grid instance per draw to all methods; true null location given to all; same
information ball ρ = 0.5. Calibration battery `(p,q) = (1.0, 0.4)` fixes the winding
threshold `W_crit = 0.376` at σ = 0, then frozen; disjoint test battery
`(p,q) ∈ {(0.8,0.3), (1.2,0.5)}` × `j/j_thr ∈ {0, .5, .9, 1.1, 1.5, 3}` × both signs, each
in its own random frame (24 configs, N = 25 draws, 6 noise levels, two legs).

Methods: **flow** (integrated: winding + escape asymmetry + chirality) · **fd-plain**
(central differences at the null — standard practice) · **fd-lsq** (least-squares linear
fit over the ball — the strong baseline, ≈ the maximum-likelihood M̂ under white noise) ·
**fd-lsq-small** (same at ρ = 0.25).

Legs: **clean** (exactly linear field) and **curved** (a divergence- and current-free
quadratic contaminant at 30% RMS of the linear part — a physical field the linear model
cannot represent).

## Results (4-class accuracy; n = 600 per point)

| σ | flow | fd-plain | fd-lsq | fd-lsq-small |
|---|---|---|---|---|
| 0.00 | 0.958 | 1.000 | 1.000 | 1.000 |
| 0.05 | 0.930 | 0.838 | 1.000 | 0.998 |
| 0.10 | 0.820 | 0.695 | 1.000 | 0.978 |
| 0.20 | 0.528 | 0.505 | 1.000 | 0.930 |
| 0.35 | 0.462 | 0.342 | 0.998 | 0.878 |
| 0.50 | 0.420 | 0.332 | 0.980 | 0.833 |

*(clean leg; the curved leg is the same picture within error bars — see the JSON and figure.)*

## Verdicts

- **H-R1 — CONFIRMED.** At σ = 0 the integrated flow recovers the Parnell type at 0.958
  (its only misses are the `j/j_thr = 0.9, 1.1` cases, where the types genuinely merge).
  An SR-side classifier exists; the framework is not type-blind in principle.
- **H-R2 — PARTIAL, and the interesting half is negative.**
  - Against **standard practice** (pointwise finite differences): **confirmed at every
    noise level**, both legs. The integrate-don't-differentiate mechanism is real.
  - Against the **strong baseline** (least-squares linear fit): **refuted everywhere**.
    fd-lsq stays ≥ 0.97 up to σ = 0.5 — even in the curved leg.

## Why the strong baseline is unbeatable here (the honest anatomy)

1. **Least squares is also an integral.** The LSQ fit is an integral operator over the
   ball (≈ 4 000 nodes); white noise averages down by √4000 ≈ 63. "Integration beats
   differentiation" is true — and regression *is* integration, done with statistically
   optimal weights. The trajectory integral uses the same data budget less efficiently.
2. **The curved leg was parity-protected** (post-hoc insight, flagged as such): the
   quadratic contaminant is *even* under r → −r while the linear basis is *odd*, so on a
   symmetric fit ball the contamination is exactly orthogonal to the fit — zero bias. The
   first contaminant that aliases into a centred linear fit is *cubic*. The curved leg
   therefore under-tested model misspecification.
3. **The winding statistic is noise-biased upward.** The confusion matrix at σ = 0.2 shows
   the failure mode precisely: *sign* (escape-time asymmetry) stays near-perfect under
   noise, but noise-induced angular wander inflates winding, so radial nulls read as
   spiral. Under noise the flow classifier degrades into a good 2-class (sign) classifier
   — which is exactly the ~0.45 plateau observed.

## The morale, stated plainly

For **classifying** a null the community's local linear fit is already the right tool —
statistically near-optimal — and the SR trajectory read-out cannot beat it there, only the
naive pointwise practice. The SR framework's genuine, non-redundant contribution in this
domain remains what R1/P2 established: **detection and order** — the scale-covariant jump
`Q: 5 → 6` that exists *before* any Jacobian is estimable — plus, from P1, the gradient
read-out δ = −ε². Classification is a language the framework speaks, not a tool it sharpens.

## Open questions / next tests (derived, not run — no forking paths)

1. **Off-centre reality.** Real pipelines *estimate* the null position; an off-centre fit
   ball breaks the parity protection and biases the linear fit. Does the ranking tighten
   under realistic localisation error? (R3's real-field classification is the first probe.)
2. **Debiased winding.** Subtracting the noise-only winding expectation (estimable from
   shuffled fields) should repair the radial→spiral bias; worth doing only if (1) shows a
   regime where the linear fit actually struggles.
3. **Cubic contamination** (odd parity) as the honest misspecification stress test.
