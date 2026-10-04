# E8 — Does the sub-Riemannian technique have any astrophysical home?

Phase C of [`PLAN-astrophysics-local-groups.md`](PLAN-astrophysics-local-groups.md).
Reproduce: `.venv/bin/python scripts/run_e8.py` → `artifacts/e8_results.json`.

**Verdict: yes — magnetized systems, on the extended (position, flux) space. And there
the growth vector is a magnetic-null detector.**

## The trap, tested first

The obvious candidate is "cross-field transport is suppressed, so the geometry must be
sub-Riemannian." It is not. The transport tensor
$D = D_\parallel\, b\,b + D_\perp (I - b\,b)$ with $D_\perp \ll D_\parallel$ is an
**anisotropic Riemannian** metric: its reachable ellipsoid has *every* semi-axis linear
in the cost, so $Q = n$ however extreme the anisotropy. Measured:

```
D_perp/D_par = 1e-02   weights (1.00,1.00,1.00)   Q=3
D_perp/D_par = 1e-04   weights (1.00,1.00,1.00)   Q=3
D_perp/D_par = 1e-06   weights (1.00,1.00,1.00)   Q=3
```

**Coefficient anisotropy is not exponent anisotropy** — the same distinction that decided
E5. And the singular limit $D_\perp\to0$ is worse, not better: the distribution becomes
rank 1, which is *integrable* (Frobenius) — you can only move along your own field line.
Chow's theorem fails; there is no sub-Riemannian geometry there at all.

## Where the structure actually is: magnetic flux

Adjoin to the plane the **flux swept by the path**, $z = \int \mathbf{A}\cdot d\boldsymbol{\ell}$
with $\nabla\times\mathbf{A} = B\,\hat z$. The horizontal frame is

$$X_1 = \partial_x + A_x\,\partial_z, \qquad X_2 = \partial_y + A_y\,\partial_z,$$

$$[X_1, X_2] = (\partial_x A_y - \partial_y A_x)\,\partial_z \;=\; B(x,y)\,\partial_z .$$

So the rank-2 distribution $\ker(dz - A_x dx - A_y dy)$ is **contact exactly where
$B \neq 0$**. For uniform $B$ in the symmetric gauge $\mathbf{A} = (-y/2,\, x/2)$ this frame
is *literally* the Heisenberg frame of `src/heisenberg.py`, and the SR geodesics are the
Larmor circles (equivalently, the isoperimetric problem).

## Results

**Uniform $B$ — the structure is Heisenberg.**

```
uniform B, base (0,0)      weights (1.00,1.00,2.00)   Q=4 > n=3
```

Flux is a weight-2 coordinate: you accumulate it only by *going around*.

**Modulated $B = 1 + 0.5\sin x\,\sin y$ (nowhere zero) — contact on full measure.**

```
Q > n at 30/30 = 100% of base points   (all Q = 4)
```

This is the decisive contrast with gravity. By the corrected criterion of E5 — *genuine
sub-Riemannian structure has $Q>n$ on a set of full measure* — this **is** a
sub-Riemannian geometry, and gravity is not.

**Magnetic null $B = x$ (vanishing on $x=0$) — Martinet degeneration.**

```
away from the null, base (1,0)   weights (1.00,1.00,2.04)   Q=4
AT the null,        base (0,0)   weights (1.00,1.00,3.00)   Q=5
```

At the null the first bracket dies, so flux accumulates only at **third** order: the
weight jumps $2\to3$, the growth vector goes $(2,3)\to(2,2,3)$, and $Q$ jumps $4\to5$.
The structure is Martinet type on the null set.

> **The growth vector of the magnetic contact structure is a magnetic-null detector.**
> Nulls are reconnection sites — where the interesting plasma physics happens — and they
> announce themselves as a jump in the homogeneous dimension.

## The verdict, against E5

```
gravity        Q = n = 3 almost everywhere;  Q = 4 only on the codim-1 caustic (0% of volume)
magnetic flux  Q = 4 > n = 3 on FULL measure;  Q = 5 on the codim-1 null set
```

The full-measure criterion cleanly separates the two. The technique's astrophysical home is
magnetized systems on the extended (position, flux) space — **not** gravitational structure
formation.

## A bug caught: the flux coordinate is gauge-dependent

The first run gave $Q=3$ for the modulated field — no sub-Riemannian structure where there
must be one. Not a modelling error: for an **open** path, $z = \int\mathbf{A}\cdot d\boldsymbol{\ell}$
is *gauge-dependent*. With $\mathbf{A}(q_0)\neq0$ the flux coordinate picks up a linear term
$z \approx \mathbf{A}(q_0)\cdot\Delta\mathbf{x}$ and therefore reads as weight 1, destroying
the measurement. Uniform $B$ worked only by luck — the symmetric gauge has $\mathbf{A}(0,0)=0$.

The fix is a gauge transformation to the symmetric gauge *at the base point*,
$z_{\text{adapted}} = dz - A_x(q_0)dx - A_y(q_0)dy$. This is a diffeomorphism leaving $B$ and
the growth vector unchanged; it simply makes the ambient coordinates **graded-adapted at
$q_0$** — the standing assumption of the reach estimator, documented in `src/growth.py` and
violated here. Exactly the class of coordinate error the programme's caveats warned about,
caught by a failing prediction rather than shipped.

## Honest caveats

1. **The third coordinate is flux, not space.** This is the geometry of *flux accumulation*
   (magnetic translations, the Landau problem, the isoperimetric problem), not of particle
   transport. Cosmic-ray and heat transport across $\mathbf{B}$ remain anisotropic diffusion:
   $Q=n$, and this technique does not apply to them. Do not conflate the two.
2. **The lift is tautological in the same sense as E5's.** Any planar curve lifts
   horizontally, because $z$ is defined by the curve. What differs from the cosmic-web lift
   is that here the distribution's *contact condition* is set by a physical field: the growth
   vector changes ($4\to5$) exactly where $B$ vanishes. That is physics, not instrument — but
   it is only **one bit** (null vs non-null). The finer invariants (the moduli $\chi,\kappa$,
   which should encode $\nabla B$) were **not** measured here.
3. **2D fields only.** Real reconnection sites are 3D magnetic nulls; the 3D magnetic
   structure is richer and was not built.
4. **No real data.** Synthetic fields with analytic vector potentials. An MHD snapshot or a
   solar-corona extrapolation would be the honest next step.

## Consequence: the astrophysics phase is complete

- **Phase A (E5):** gravity has no sub-Riemannian structure. The orientation lift is a
  tautology; a Zel'dovich fold counterfeits $Q=4$; the correct criterion is full-measure.
- **Phase B (E6):** the cosmic web's local group is the *isotropy group of the deformation
  tensor*, detectable via eigenvalue degeneracy, validated against Doroshkevich (1970).
- **Phase C (E8):** the technique's astrophysical home is magnetized flux geometry, where
  $Q=4$ a.e. and the growth vector detects magnetic nulls.
