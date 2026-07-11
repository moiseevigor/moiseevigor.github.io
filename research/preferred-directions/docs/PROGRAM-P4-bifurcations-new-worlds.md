# Phase 4 — Degenerate nulls, bifurcations, and new worlds

**Charter.** P3 grounded the SR null detector on the *generic* nulls of the real Sun and
delivered the honest division of labour: detection/order/gradient are sub-Riemannian, type
classification belongs to the linear fit. This phase attacks the two places that division
leaves the SR side genuinely ahead, and expands the data beyond the Sun.

1. **Degenerate nulls and their bifurcations.** Nulls are created and destroyed **in
   pairs** (opposite topological sign) through a *fold* (saddle–node) bifurcation: two
   generic nulls approach, merge into a **degenerate null** where the field vanishes to
   *second* order, and annihilate (Priest & Titov-style topology; null creation/
   annihilation is observed in data-driven coronal simulations). The degenerate
   configuration is structurally unstable — which is exactly why it matters: it is the
   *transition state* of magnetic topology change, i.e. of reconnection events.
   - The **eigenvalue method** sees a degenerate null only as `det ∇B → 0` — a fragile
     numerical zero test with no scale information.
   - The **growth vector** has a *law* for it: field vanishing to order $k$ gives
     $Q = 3 + (k+2)$. A fold point ($k=2$) must read $\mathbf{Q = 7}$ — a *new, untested
     value of the law* — and a *split pair* must read as a **scale crossover**: probe
     radii below the pair half-separation see the local structure (uniform: flux weight
     2; at a member null: 3), radii above it see the parent degenerate structure (weight
     4). The SR detector, uniquely, reads the **separation of an unresolved pair** off
     one scaling curve. Nothing pointwise can do that.

2. **New worlds.** The R5 theorem says spiral nulls need genuinely non-force-free
   currents — which solar extrapolations cannot supply but **planetary magnetospheres**
   can (magnetopause and tail current systems are real and strong). Empirical
   magnetosphere models (IGRF internal + Tsyganenko external, fitted to decades of
   spacecraft data) are the natural next real dataset: cusp and tail nulls, with spiral
   types finally possible. Vacuum multipole fields of the non-dipolar planets
   (Uranus/Neptune, real mission-fitted Gauss coefficients) extend the gallery;
   force-free analytic models of extreme objects (twisted magnetar dipole) are included
   only as clearly-labeled analytic demonstrations.

## Pre-registered predictions

| # | Prediction | Judged by |
|---|---|---|
| **H-P4a** | At the fold's degenerate null, $Q = 7$ (first $k=2$ point of the law in 3D); at each split null $Q = 6$ with opposite signs | measured weights $(1,1,1,4)$ vs $(1,1,1,3)$ |
| **H-P4b** | The local flux-reach exponent $w_4(r)$ at the pair **midpoint** crosses over $2 \to 4$ around $r \sim \sqrt{\mu}$ (half-separation), and the curves for different $\mu$ **collapse** when plotted against $r/\sqrt\mu$ (the dilation symmetry) | exponent-vs-scale curves, collapse quality |
| **H-P4c** | Real solar extrapolations contain close null pairs, and the real pair shows the same crossover | pair census + one real crossover curve |
| **H-P4d** | Empirical magnetosphere fields carry detectable nulls; where real (non-force-free) currents flow, **spiral** nulls exist — completing the R5 story on real-physics data | null census + Parnell types + SR $Q$ |

Failure modes pre-registered: (a) the crossover may be smeared over a decade in $r$
(exponents are asymptotic, not local) — report the width honestly; (b) the degenerate
point's basin is tiny, so the $Q=7$ measurement must verify insensitivity to the probe
radius window; (c) magnetosphere models are *models* fitted to data, not field
measurements — say so; (d) close pairs on the Sun may all be spurious (extrapolation
ringing) — check pair persistence across window/resolution choices.

## The family (S1)

$$\mathbf B_\mu = \big(xz,\; yz,\; \mu - z^2 + \tfrac{x^2+y^2}{2}\big),\qquad
\nabla\cdot\mathbf B_\mu = z + z - 2z = 0,$$

with exact vector potential (verified in code)
$A = \big(\tfrac{yz^2}{2},\; -\tfrac{xz^2}{2} + \mu x + \tfrac{x^3}{6} + \tfrac{xy^2}{2},\; 0\big)$.

- $\mu > 0$: two point nulls at $(0,0,\pm\sqrt\mu)$, Jacobians $\mathrm{diag}(\pm\sqrt\mu,
  \pm\sqrt\mu, \mp2\sqrt\mu)$ — a **radial pair of opposite sign**, exactly the
  pair-creation topology of the literature.
- $\mu = 0$: one isolated null at the origin with $\nabla\mathbf B = 0$ and
  $|\mathbf B| \sim r^2$ — the **fold point**, $k = 2$.
- $\mu < 0$: the pair is gone; a **null ring** of radius $\sqrt{2|\mu|}$ appears in the
  $z=0$ plane — the divergence-free fold's third face, noted but not this phase's target.

## Experiments

- **S1** (heavy): $Q$ at the fold point and at split nulls; $w_4(r)$ crossover curves at
  midpoint and at a member null across a $\mu$ grid; dilation collapse. `src/bifurcation.py`,
  `scripts/run_p4_fold.py`.
- **S2**: census of null pairs in the real R3 extrapolations (more windows, all three
  days); crossover measurement on the closest real pair.
- **S3**: Earth magnetosphere via IGRF+Tsyganenko (geopack) — null census, types, $Q$;
  spiral hunt. Vacuum multipoles of Uranus/Neptune from published coefficients. Analytic
  twisted-dipole demo (labeled analytic).

Reports land in `docs/S1..S3-*.md`; figures under `public/img/posts/`; write-up follows
the house series conventions once the results exist.
