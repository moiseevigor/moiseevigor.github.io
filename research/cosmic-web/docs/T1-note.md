# T1 — the variational structure of the Zel'dovich/adhesion flow (refutation with derivation)

**Question (from the scoping post):** derive — or refute — a Jacobi-type
variational principle for the Zel'dovich/adhesion flow in comoving
coordinates: an effective metric $g \propto (E-\Phi)\,g_{\mathrm{Euclid}}$
(or a sub-Riemannian analogue on $\mathbb{R}^3 \times S^2$) whose geodesics
the flow follows, with "cheap along the filament axis" anisotropy.

**Answer: refuted.** The flow has an exact variational principle, but it is
optimal transport with quadratic cost, not geodesic flow of a
potential-weighted metric. Three short steps.

## 1. In growth-factor time, Zel'dovich dynamics is free motion

Write the Zel'dovich map with the linear growth factor $D$ as the time
variable:

$$
\mathbf{x}(\mathbf{q}, D) = \mathbf{q} - D\,\nabla_q \Phi_0(\mathbf{q}),
\qquad
\frac{d\mathbf{x}}{dD} = -\nabla_q \Phi_0(\mathbf{q}) = \text{const along the trajectory}.
$$

Every trajectory is a **straight line traversed at constant velocity** in
$(\mathbf{x}, D)$. Such trajectories extremise the free action

$$
S[\mathbf{x}] = \int \left| \frac{d\mathbf{x}}{dD} \right|^2 dD ,
$$

i.e. they are geodesics of the **flat Euclidean metric**. The gravitational
potential does not act as a force during the evolution at all — in $D$-time
it is entirely absorbed into the initial velocity field
$\mathbf{v}_0 = -\nabla\Phi_0$. This is the precise reason the Jacobi
construction cannot be repaired: the Jacobi metric
$2m(E-\Phi)g_{\mathrm{Euclid}}$ conformally reweights paths by the potential
*along* the path, but in the variables where the cosmic-web flow is simple
there is no potential along the path to reweight. Not only is energy not
conserved (the objection raised in the scoping post); there is no force
term left to build a conformal factor from.

## 2. The adhesion model's variational principle is Hopf–Lax, i.e. optimal transport

The adhesion model regularises multi-streaming with Burgers dynamics,
$\partial_D \mathbf{v} + (\mathbf{v}\cdot\nabla)\mathbf{v} = \nu \Delta \mathbf{v}$,
$\nu \to 0^+$, with $\mathbf{v} = \nabla \psi$. The Hopf–Cole
transformation solves it exactly, and the $\nu \to 0$ limit is the
**Hopf–Lax formula**: the velocity potential evolves as

$$
\psi(\mathbf{x}, D) = \min_{\mathbf{q}} \left[ \psi_0(\mathbf{q}) +
\frac{|\mathbf{x} - \mathbf{q}|^2}{2D} \right].
$$

This *is* a variational principle — a minimisation over straight-line
transport paths with quadratic cost plus initial data — which is exactly the
Monge–Kantorovich optimal-transport structure with cost
$|\mathbf{x}-\mathbf{q}|^2$ (Brenier; used cosmologically in the MAK
reconstruction of Frisch et al.). The "geometry" that governs the cosmic
web is therefore: **flat metric, straight rays, plus a Legendre-type
convexification of the initial potential.** Filaments and nodes are the
places where the Hopf–Lax minimiser jumps between branches — the **shock
set (caustics) of an optimal-transport map** — not the geodesics of any
curved or lifted metric. Structure lives in the *singularities of the map*,
not in *curved paths*.

## 3. Why this reproduces E2's measurements

The derivation predicts the two dynamical signatures E2 measured:

- Matter arrives at a filament along straight inertial rays that terminate
  *on* the shock set — generically **transverse** to it. Hence the bulk
  deviation-from-chord field points across, not along, filaments
  (E2: $\langle(\hat{dev}\cdot e_3)^2\rangle = 0.21$–$0.23$ vs the
  isotropic 1/3).
- After absorption into the shock, the surviving degree of freedom is the
  tangential component of the pre-shock velocity: weak **along-filament
  streaming inside the tube** (E2: 0.364 ± 0.010 within ~4 voxels of
  spines).

The orientation manifold $\mathbb{R}^3 \times S^2$ retains a legitimate
role, but as a *descriptor of the shock set* — the tangent structure of an
already-formed web (which is why the lift wins the alignment statistic M3
on simulations and on the sky) — and not as the state space of transport.

## Verdict

- T1 as posed: **refuted, constructively.** No Jacobi-type
  potential-weighted metric generates the flow; the correct variational
  structure (Hopf–Lax / quadratic-cost optimal transport) was identified
  instead, and it is flat.
- The refutation is consistent with, and explains, the empirical E2
  verdict obtained independently ten experiments earlier.
- Program table status: with T1 closed, every item in the original scoping
  post — T1, E0–E3, H1–H4 — carries an executed verdict.

## References

- Ya. B. Zel'dovich (1970), *A&A* 5, 84 — the straight-line property is
  implicit in the ballistic form of the map.
- S. N. Gurbatov, A. I. Saichev, S. F. Shandarin (1989), *MNRAS* 236, 385 —
  adhesion model.
- E. Hopf (1950); P. D. Lax (1957) — the viscosity limit and the
  variational formula.
- Y. Brenier (1991), *Comm. Pure Appl. Math.* 44, 375 — polar factorisation
  and quadratic-cost optimal transport.
- U. Frisch, S. Matarrese, R. Mohayaee, A. Sobolevski (2002), *Nature* 417,
  260 — MAK reconstruction: optimal transport as the variational principle
  of large-scale structure.
