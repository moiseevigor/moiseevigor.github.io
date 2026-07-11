# E5 — Is there sub-Riemannian structure in gravitational structure formation?

Phase A of [`PLAN-astrophysics-local-groups.md`](PLAN-astrophysics-local-groups.md).
Reproduce: `.venv/bin/python scripts/run_e5.py` → `artifacts/e5_results.json`.

**Verdict: no — and the experiment refuted the plan's own criterion along the way.**

## Hypotheses

- **H-A (instrument invariance).** The growth vector of the $\mathbb{R}^3\times S^2$
  lift is determined by the lift, not by the dynamics.
- **Plan's criterion (as originally written).** $Q = n$ ⟹ no sub-Riemannian structure;
  therefore $Q > n$ would indicate it. **This turned out to be wrong.**

## Method

Gravitational structure formation is a *deterministic flow*, not a *control system*: a
particle may move in any direction, so there is no distribution of allowed directions
and no growth vector to estimate. What one *can* ask of a map is how the image of a
small Lagrangian ball extends along a fixed frame. `src/lagrangian.py` measures those
exponents (high quantile of |projection| vs ball radius, fitted in log–log), for:

- explicit control maps of known degeneracy order;
- the **Zel'dovich map** $x(q) = q - D\,\nabla\Phi(q)$ for an analytic Gaussian
  potential with $\Lambda$CDM-like amplitudes ($\Phi \sim k^{-2}$), where the
  deformation tensor $T = \nabla\nabla\Phi$ is exact and the fold locations
  ($D\lambda_i = 1$) are known in closed form.

## Results

**Controls — the estimator reads degeneracy order correctly.**

```
linear / regular          exponents (1.01, 1.01, 0.99)   Q = 3
exact fold   x1 = q1^2    exponents (1.99, 1.00, 1.00)   Q = 4
exact cusp   x1 = q1^3    exponents (3.03, 1.00, 1.03)   Q = 5
```

**Heisenberg (genuine sub-Riemannian).** Weights $(0.97, 0.98, 2.00)$, growth vector
$(2,3)$, $Q = 4 > n = 3$ — and, because the structure is left-invariant, this holds at
**every** point.

**Zel'dovich (real gravitational flow).**

```
regular point (D = 0.5 D_fold)   exponents (1.00, 1.00, 1.00)   Q = 3 = n
FOLD caustic  (D = D_fold)       exponents (1.00, 1.01, 2.00)   Q = 4
```

At a generic point there is no exponent anisotropy at all: $Q = n = 3$, confirming
that gravity imposes no nonholonomic constraint. **But at a fold caustic one exponent
becomes 2 and $Q = 4$ — numerically identical to Heisenberg.** The exponent-2 direction
is the eigendirection of the largest tidal eigenvalue: it is the Zel'dovich pancake, the
direction of first collapse.

**Measure test.**

```
Zel'dovich (pre-shell-crossing):  0/120 base points have Q > 3   (0.00%)
Heisenberg:                     100% of points have Q > 3
```

**The lift is a tautology.** For both a Zel'dovich flow and an unrelated random smooth
flow, the lifted curve's transverse residual is at machine precision:

```
Zel'dovich flow       max transverse residual = 4.7e-16
random smooth flow    max transverse residual = 5.0e-16
```

Every smooth flow lifts to a horizontal curve of the *same* rank-3 distribution.

## Analysis

**H-A: confirmed.** The $\mathbb{R}^3\times S^2$ constraint $\dot{\mathbf x}\parallel
\hat{\mathbf v}$ holds identically for any smooth curve, by definition of
$\hat{\mathbf v}$. The lifted distribution — and hence its growth vector — is the same
for the cosmic web, a random flow, or anything else. **M1 applied to the lift measures
the instrument, not the universe.** The nilpotent-deviation $\delta$ is worse still: the
conjugate locus of the lifted structure depends on the metric one *chooses* on the
distribution (the turning penalty), a free modelling parameter gravity does not fix.

**The plan's criterion is refuted — by this experiment.** "$Q > n$ at a point" does
**not** imply sub-Riemannian structure. A Lagrangian **fold** produces exactly the same
signature ($Q = 4$) as the Heisenberg group, because a degenerate map compresses one
direction so the image of a ball extends like $r^2$ there. This is the
**ADE-universality trap resurfacing at the level of the growth vector**, not merely at
the level of the caustic germ: the two mechanisms are numerically indistinguishable
pointwise.

**The corrected criterion is measure-theoretic:**

> Genuine sub-Riemannian structure has $Q > n$ on a set of **full measure** (it is a
> property of the *distribution*, present everywhere). A Lagrangian catastrophe has
> $Q > n$ only on the **caustic**, a codimension-1 null set.

Measured: Zel'dovich gives $Q>n$ on $0\%$ of sampled points; Heisenberg on $100\%$.
That is the discriminator, and it is what E5 actually establishes.

**Why this matters for the programme.** The E4 "calibrated silence" experiment abstained
because a hand-built mixture had inconsistent growth vectors — the right verdict for the
wrong reason. E5 replaces that with (i) a structural theorem (the lift is a tautology)
and (ii) a measured, principled criterion (full-measure $Q>n$). It is also the first
estimator in this repository that consumes a **map** rather than the generative
structure — a step toward the genuinely data-driven inverse the programme has lacked.

## Honest caveats

1. The Zel'dovich potential here is analytic (a random Fourier superposition), not a
   simulation snapshot. The physics (Zel'dovich approximation, $\Lambda$CDM-like
   amplitudes) is real; the field is controlled so fold locations are exact. Repeating
   on CAMELS / PM snapshots (`research/cosmic-web/data`, `src/pm.pm_sim`) is a
   worthwhile robustness check, not expected to change the conclusion.
2. The "measure test" samples 120 base points; folds are codimension 1, so a null
   result is expected and observed. It bounds the fold volume fraction, it does not
   prove it is zero.
3. Post-shell-crossing (multi-stream) regions were not probed. There the Eulerian
   velocity field is multi-valued, and the natural object is the number of streams — a
   caustic diagnostic — not a distribution rank.

## Consequence for the plan

Phase A is complete and its conclusion is stronger than planned: not only does gravity
lack sub-Riemannian structure, but the naive detector for it is *actively fooled by
caustics*. Phase B (the deformation-tensor isotropy stratification, and its validation
against the published $D_4$-umbilic criterion) is unaffected and remains the right next
step — indeed E5 strengthens the case that the deformation tensor, not a growth vector,
is where the local-group information lives.
