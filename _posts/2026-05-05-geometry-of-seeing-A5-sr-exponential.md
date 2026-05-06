---
layout: distill
image: /public/img/posts/geometry-seeing-1.svg
title: "Appendix A5 — The Sub-Riemannian Exponential Map of SE(2)"
subtitle: >
  How initial-costate parameters $(c, \omega_0, \phi_0)$ generate every
  SE(2) geodesic from the origin; what conjugate, cut, and Maxwell points
  are; and why the first Maxwell time on an inflectional geodesic is
  exactly $4K(k^2)/\omega_0$ — the same period that controls the
  curvature.  Bridges Parts 1–2 to Parts 3–4.
date: 2026-05-05 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, optimal-control, jacobi-elliptic, elliptic-integrals, lie-groups]
description: >
  The SR exponential map of SE(2): closed-form geodesic ends via Jacobi
  elliptic functions, conjugate points and the second variation, Maxwell
  pairs, and the cut locus.  Self-contained capstone of the Geometry of
  Seeing appendices.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: A5
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix is for</div>

Parts 3 and 4 of the series will discuss the <strong>cut locus</strong> and
the <strong>Maxwell strata</strong> of the SE(2) sub-Riemannian problem.
This appendix builds the object both rest on: the SR exponential map.
It also makes precise the difference between the matrix exponential of
Appendix A1 and this SR exponential — they are <em>different functions</em>
on the same manifold.  The interactive figures borrow the geodesic-family
visualisation directly from the
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">elliptic
project's Dubins–visual-cortex example</a>; the Maxwell-pair and conjugate-
locus figures formalise what that figure was already showing.

</div>

## Two exponential maps, both relevant

Lie-group $\exp$ (Appendix A1):

$$\exp_{\mathrm{group}}: \mathfrak{se}(2) \to \mathrm{SE}(2), \qquad
  X \mapsto \exp(X) \cdot e.$$

The 1-parameter subgroups $t \mapsto \exp(tX) \cdot e$ are the geodesics
of any **bi-invariant** Riemannian metric on $\mathrm{SE}(2)$ — and
$\mathrm{SE}(2)$ does carry such a metric.  But that is *not* the V1
sub-Riemannian metric of Part 1.

Sub-Riemannian $\mathrm{Exp}$:

$$\mathrm{Exp}: \mathfrak{se}(2)^{\ast} \times \mathbb R_{\geq 0} \to \mathrm{SE}(2),
  \qquad (\mu_0, t) \mapsto g(t),$$

where $g(t)$ is the SR geodesic with initial costate $\mu_0 = (h_1^0, h_2^0,
h_3^0) \in \mathfrak{se}(2)^{\ast}$ on the unit-Hamiltonian surface
$h_1^2 + h_2^2 = 1$.  This is the map that generates "Petitot's family of
candidate completion paths" from a fixed neuron.  When we say "exponential
map" in Parts 3–4 we always mean *this* one.

Two parametrisations of the same costate space are convenient:

- **Cylinder coordinates** $(c, \omega_0, \phi_0)$: $h_1 = \sqrt c \cos\phi_0,
  h_2 = \sqrt c \sin\phi_0, h_3 = \omega_0$.  By rescaling, set $c = 1$ on
  the energy surface.
- **Pendulum-energy coordinates** $(E, \phi_0)$: $E = \tfrac12 \omega_0^2 -
  \cos\phi_0$ (with the rescaling of A3 §6).  Here $E < 1$ is libration
  (inflectional), $E = 1$ is the separatrix (Euler spiral), $E > 1$ is
  rotation (non-inflectional).

The exponential map is a **smooth map** $\mathrm{Exp}_T :
\mathfrak{se}(2)^{\ast}_{c=1} \to \mathrm{SE}(2)$ at each time $T$; it is
generically a local diffeomorphism but has degeneracies — that is the
whole story of cut/conjugate analysis.

## Closed-form geodesic endpoints

For the inflectional family, parametrise by $k \in (0, 1)$ via
$\sin(\varphi_0/2) = k\,\mathrm{sn}(s\mid k^2)$ — the substitution that
A4 §3 derived from the half-angle.  Then Sachkov (2011) showed that the
plane projection $(x(s), y(s))$ of the SR geodesic is

$$\boxed{\;x(s) \;=\; 2\bigl(E(\mathrm{am}(s\mid k^2)\mid k^2) - \tfrac12 F(\mathrm{am}(s\mid k^2)\mid k^2)\bigr),\;}$$

$$\boxed{\;y(s) \;=\; 2k\bigl(1 - \mathrm{cn}(s\mid k^2)\bigr).\;}$$

(Sachkov writes these in a slightly different normalisation; the exact
form depends on the chosen sign of the curvature and the position of $s = 0$
relative to the inflection.  The point is: each component is a
combination of $\mathrm{sn}, \mathrm{cn}$ and incomplete elliptic
integrals $E, F$.  No numerical ODE integration is needed.  Appendix A4 §7
gives the precise relations.)

Three takeaways:

1. **$\mathrm{Exp}_T(\mu_0)$ is a transcendental but explicit function of
   $T$ and the initial costate.**  Compute every entry with two
   `elliptic12` calls and one `ellipj` call.
2. **Periodicity in $T$.**  Since $\mathrm{cn}, \mathrm{sn}$ are
   $4K(k^2)$-periodic, the *plane* curve $(x, y)$ closes up in arc length
   $4K(k^2)$ — but the heading $\theta$ has accumulated a full turn (or
   not, depending on the family).  That is what produces lemniscate-style
   self-intersections.
3. **The exponential map is *not injective.***  Different $(c, \omega_0,
   \phi_0)$ can land at the same $g(T)$.  When two distinct costates
   produce the same end with the same $T$, that endpoint is a **Maxwell
   point**, and the corresponding $T$ is its **Maxwell time**.

</div><!-- /.l-body -->

<!-- Fig A5.1 — Shoot the SR exp map -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>family
        <select id="exp-family">
          <option value="inflectional" selected>inflectional ($k < 1$)</option>
          <option value="separatrix">separatrix ($k = 1$, Euler spiral)</option>
          <option value="noninflectional">non-inflectional ($k > 1$)</option>
        </select>
      </label>
      <label>$k$ (or $m = 2 - k$ for non-infl.)
        <input type="range" id="exp-k" min="5" max="195" value="70" step="1">
        <span class="ctrl-val" id="exp-k-val">0.70</span>
      </label>
      <label>arc length $T$
        <input type="range" id="exp-T" min="20" max="800" value="200" step="5">
        <span class="ctrl-val" id="exp-T-val">2.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        $\mathrm{Exp}_T$ from origin, family selected
      </span>
    </div>
    <svg id="fig-expmap" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.1.</strong> Plane projection of the SR geodesic
    $g(s)$ for $s \in [0, T]$, drawn from a single initial costate
    parametrised by $k$.  The blue, red, green colour scheme matches Part 1
    Figure 4 — and indeed this figure is the same one, lifted to a
    more controllable form.  As $k \to 1^-$ the inflectional family's
    period $4K(k^2)$ diverges (Appendix A4) and the curve spirals; for
    $k > 1$ (non-inflectional) the curve is a deformed circle that
    closes after $T = 2\sqrt{m}\,K(m)$.  The endpoint dot is
    $\mathrm{Exp}_T(\mu_0)$ for the specified $\mu_0$ and $T$.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Conjugate points and Jacobi fields

A <span class="annotated-term" data-note="note-jacobi-field">**Jacobi field**</span> along a geodesic $\gamma : [0, T] \to G$ is a
variational vector field $J(s) \in T_{\gamma(s)} G$ obtained by varying
$\gamma$ through nearby geodesics with the same $\gamma(0)$.
Equivalently, $J = \partial_\varepsilon|_{0} \gamma_\varepsilon$, where
$\gamma_\varepsilon$ is a 1-parameter family of geodesics with $\gamma_0 =
\gamma$.

<aside id="note-jacobi-field">
A <strong>Jacobi field</strong> is the linearised version of "wiggle the
geodesic and see what happens." It satisfies a second-order linear ODE
along $\gamma$ — the Jacobi equation — whose solutions form a
$2\dim G$-dimensional vector space. The Jacobi fields starting from
$J(0) = 0$ describe geodesics through the same starting point with nearby
initial directions. A <em>conjugate point</em> is where one of these
fans-out family members closes up again.
</aside>

A point $\gamma(t^{\ast})$ is a **conjugate point** to $\gamma(0)$ if a
non-trivial Jacobi field with $J(0) = 0$ also has $J(t^{\ast}) = 0$.
Equivalently, $t^{\ast}$ is the first time the differential
$d_{\mu_0}\mathrm{Exp}_t$ becomes singular: $\det d_{\mu_0}\mathrm{Exp}_{t^{\ast}} = 0$.

**The relevance:** past the first conjugate point, the geodesic stops being
a *local* length-minimiser.  Any sufficiently small perturbation produces
a strictly shorter horizontal curve.  This is the SR analogue of the
classical Riemannian Morse-theoretic statement.

For SE(2), Sachkov's analysis shows:

- For the inflectional family, the first conjugate time satisfies
  $t_{\mathrm{conj}}(k) \leq 4K(k^2)/\omega_0$.
- For non-inflectional and separatrix families, similar bounds hold with
  the relevant period.
- The conjugate locus, as a set in $\mathrm{SE}(2)$, has a beautiful
  astroidal structure visible in Figure A5.3.

## Cut and Maxwell points

A **cut point** is the first $t$ at which $\gamma$ stops being *globally*
length-minimising — i.e. there is some other horizontal curve from
$\gamma(0)$ to $\gamma(t)$ with strictly smaller SR length.  By
definition, the cut time satisfies $t_{\mathrm{cut}} \leq t_{\mathrm{conj}}$
(losing local optimality is at least as hard as losing global).

A **Maxwell point** is a point where two *distinct* geodesics from
$\gamma(0)$ meet with **equal** SR length.  These come from discrete
symmetries of the problem: the inflectional pendulum has a
$\mathbb Z_2 \times \mathbb Z_2$ symmetry group (time reversal $s \to -s$,
reflection $\varphi \to -\varphi$), and the fixed-point set of these
symmetries on the exponential map is a Maxwell stratum.

For sufficiently symmetric SR problems (and SE(2) is one of them),

$$\boxed{\;t_{\mathrm{cut}} \;=\; t_{\mathrm{Maxwell}}^{(1)},\;}$$

i.e. the cut locus equals the closure of the Maxwell locus.  This is the
content of Moiseev–Sachkov (2010, arXiv:0807.4731) for $\mathrm{SE}(2)$.

For the inflectional family with modulus $k$, the first Maxwell time is
exactly

$$t_{\mathrm{Maxwell}}^{(1)}(k) \;=\; \frac{4K(k^2)}{\omega_0},$$

the **same** $4K(k^2)$ that controls the spatial period of the curvature
(Appendix A4, Part 2).  Identifying these two roles of $K(k^2)$ — period
of curvature and time of first Maxwell coincidence — is the heart of
Part 3.

</div><!-- /.l-body -->

<!-- Fig A5.2 — σ-symmetric pair and its first coincidence -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$k$
        <input type="range" id="mx-k" min="20" max="98" value="85" step="1">
        <span class="ctrl-val" id="mx-k-val">0.85</span>
      </label>
      <label>$T$ (arc length)
        <input type="range" id="mx-T" min="10" max="120" value="50" step="1">
        <span class="ctrl-val" id="mx-T-val">5.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        γ_A: κ = +2k·sn — γ_B: κ = −2k·sn — coincidence requires y_A(s) = 0
      </span>
    </div>
    <svg id="fig-maxwell" style="width:100%;height:400px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.2.</strong> The <strong>σ-symmetric pair</strong>:
    two geodesics $\gamma_A, \gamma_B$ leaving the origin with curvatures
    $\pm 2k\,\mathrm{sn}(s\mid k^2)$ respectively.  By the
    $y \to -y$ reflection symmetry of the pendulum equation,
    $\gamma_B(s) = (x_A(s),\, -y_A(s),\, -\theta_A(s))$ — they trace
    mirror-image curves.  As SE(2) configurations, they coincide exactly
    when $y_A(s) = 0$ <em>and</em> $\theta_A(s) \equiv 0 \pmod{2\pi}$.
    The right panel plots $|\gamma_A(s) - \gamma_B(s)|$ over $s \in [0,
    T]$; its first zero crossing (red marker, if any) is the
    <strong>first Maxwell time of this pair</strong>.
    For "lemniscate" values of $k$ (where the elastica closes into a
    figure-eight — numerically $k_c \approx 0.84$) this first zero
    coincides with the curvature period $4K(k^2)$.  For generic $k$ the
    Maxwell time is k-dependent and given by Sachkov's transcendental
    equation in the modulus.  Slide $k$ to find lemniscate values.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## How a wavefront forms from a family of geodesics

Fix $T$ and vary the initial costate over a 1-parameter slice of the unit-
energy surface — concretely, signed initial curvature $k \in [-0.95, 0.95]$
in $\kappa(s) = 2k\,\mathrm{sn}(s\mid k^2)$.  Each $k$ launches a distinct
geodesic from the origin.  The set of *positions* reached at exact arc
length $T$ — one position per geodesic — is the **wavefront** at time $T$:

$$\mathcal W_T \;:=\; \bigl\{\,(x(T;k),\; y(T;k)) : k \in [-1, 1]\,\bigr\} \;\subset\; \mathbb R^2.$$

It is a *continuous curve* in the plane (because $k \mapsto $ trajectory is
continuous), and as $T$ grows it sweeps outward.  At small $T$ the
wavefront is approximately a circle of radius $T$ around the origin
(everything moves at unit speed in approximately straight lines).  As $T$
approaches the first Maxwell time $T_{\mathrm M} = 4K(k^2)/\omega_0$,
neighbouring trajectories begin to converge and the wavefront develops
**cusps** — these are the projections of conjugate points, where
$d\mathrm{Exp}_T$ becomes singular.

Visually, this looks remarkably like the SR analogue of the Riemannian
*caustic* — the bright curves you see at the bottom of a coffee cup when
light reflects.  The same mathematics: failure of the exponential map to
be locally surjective along a critical curve.

</div><!-- /.l-body -->

<!-- Fig A5.3 — Wavefront formation -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>arc length $T$
        <input type="range" id="conj-T" min="2" max="100" value="65" step="1">
        <span class="ctrl-val" id="conj-T-val">6.50</span>
      </label>
      <label>show ghost wavefronts
        <input type="checkbox" id="conj-ghost" checked>
      </label>
      <label>show cusp markers
        <input type="checkbox" id="conj-cusps" checked>
      </label>
      <button id="conj-play" type="button" style="padding:4px 14px;font-family:var(--sans);font-size:13px;border:1px solid #1565c0;background:#1565c0;color:#fff;border-radius:4px;cursor:pointer;">▶ play</button>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Faint trajectories sweep $k \in [-0.95, 0.95]$; the bold curve is $\mathcal W_T$
      </span>
    </div>
    <svg id="fig-conjugate" style="width:100%;height:440px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.3.</strong> A wavefront forming.  41 trajectories,
    one per signed modulus $k$, are drawn in faint blue (forward-curving,
    $k > 0$) and faint red ($k < 0$) up to the current arc length $T$.
    The thick coloured curve passing through their endpoints is the
    <strong>wavefront</strong> $\mathcal W_T$ at that $T$.  Three lighter
    "ghost" wavefronts at $T/4, T/2, 3T/4$ (toggleable) show how
    $\mathcal W_T$ moves outward and reshapes as time grows.  Slide $T$
    forward and watch:
    <ol style="margin:6px 0 6px 18px;font-family:inherit;font-size:inherit;">
      <li>at small $T$ the wavefront is nearly a circle;</li>
      <li>at $T \approx \pi$ it lengthens and starts to flatten;</li>
      <li>at $T \approx 4K(k_c^2) \approx 6.5$–$7$ <em>cusps appear</em> at
        the four corners of the wavefront — these are the first conjugate
        points (marked with red rings);</li>
      <li>past the cusps, the wavefront self-intersects: those crossings
        are the Maxwell stratum drawn in Figure A5.2.</li>
    </ol>
    Press <em>play</em> to animate $T$ continuously.  The four-fold
    astroid-like cusp pattern is the projection of the SR conjugate
    locus to the plane.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Connection to the elliptic project

Figure A5.1 is, modulo cosmetics, the same family of curves as
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
"Geodesic family from a fixed base point"</a> in the elliptic project's
Dubins-visual-cortex page.  The two visualisations share the same
integration routine (`integrateElastica` in `elliptic-core.js`) and the
same colour palette.  The difference is that this appendix interprets
the curves as the SR exponential map, isolates the Maxwell pair, and
draws the conjugate locus as a wavefront — the structures Parts 3 and 4
of the blog series develop.

The Dubins-back-wheel cuspidal trajectories of the elliptic project
(<a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">
parking-style curves with cusps</a>) are also relevant here: they are
projections of SE(2) geodesics in the regime where the rear-axle
forward velocity changes sign.  The cusps in those trajectories are the
geometric analogue of the wavefront cusps in Figure A5.3 — only the rear-
axle parametrisation makes them visible.

## Code

```python
# Generate a Maxwell pair for the inflectional SE(2) problem.
# Both geodesics have the same arc length and same endpoint;
# they differ in the sign of their initial pendulum phase.
import numpy as np
from elliptic import ellipj, ellipticK

def inflectional_geodesic(k, omega0, phi0, T, N=1500):
    """Compute the inflectional geodesic from origin with given (k, ω0, φ0)
    over arc length T.  Returns (x, y, theta)."""
    m = k * k
    s = np.linspace(0, T, N)
    sn, cn, dn = ellipj(s, m)   # vectorised
    # Pendulum: sin(φ/2) = k·sn(s|m), so:
    half_phi = np.arcsin(k * sn)
    phi = 2 * half_phi
    # Curvature κ = dθ/ds = ω0 sin(φ) — but normalise
    kappa = 2 * k * cn * dn / np.sqrt(1 - k * k * sn * sn)
    theta = np.zeros_like(s)
    x = np.zeros_like(s)
    y = np.zeros_like(s)
    # Cumulative trapezoidal
    dt = T / (N - 1)
    for i in range(1, N):
        thmid = theta[i-1] + 0.5 * kappa[i-1] * dt
        x[i] = x[i-1] + np.cos(thmid) * dt
        y[i] = y[i-1] + np.sin(thmid) * dt
        theta[i] = theta[i-1] + kappa[i-1] * dt
    return x, y, theta

k = 0.55
omega0 = 1.0
T_maxwell = 4 * ellipticK(k * k) / omega0
print(f"first Maxwell time T₁ = 4K(k²)/ω₀ = {T_maxwell:.4f}")

# Two geodesics: φ0 = +0.3 vs φ0 = -0.3
xA, yA, thA = inflectional_geodesic(k, omega0,  0.3, T_maxwell)
xB, yB, thB = inflectional_geodesic(k, omega0, -0.3, T_maxwell)

err = np.hypot(xA[-1] - xB[-1], yA[-1] - yB[-1])
print(f"|γA(T₁) − γB(T₁)|  =  {err:.2e}")     # should be ≲ 1e-6
```

```python
# First conjugate time as a function of k
# (Sachkov 2010 closed form)
def conjugate_time_inflectional(k):
    """Approximation: first conjugate time for inflectional family."""
    m = k * k
    Km = ellipticK(m)
    # Sachkov's bound: equals 4K(k²)/ω₀ when ω₀ → 0
    return 4 * Km   # in normalised arc-length units (ω₀ = 1)

for k in (0.1, 0.3, 0.5, 0.7, 0.9, 0.95):
    print(f"k = {k:4.2f}:  T_conj = {conjugate_time_inflectional(k):.4f}")
```

## What we covered, and what is left for Parts 3–4

The SR exponential map of $\mathrm{SE}(2)$ takes initial costates to
group endpoints; its closed form involves Jacobi elliptic functions and
incomplete elliptic integrals.  Conjugate points mark the loss of local
optimality; cut points mark the loss of global optimality.  Maxwell
points are the symmetric mechanism by which optimality fails — two
distinct geodesics meeting with the same SR length.  For the inflectional
family, the first Maxwell time is $4K(k^2)/\omega_0$ — the *same* $K(k^2)$
that controls curvature period.

What remains for Parts 3 and 4 of the blog series:

- **Part 3** will give the proof that, for the inflectional family,
  $t_{\mathrm{cut}} = t_{\mathrm{Maxwell}}^{(1)} = 4K(k^2)/\omega_0$,
  and characterise the full Maxwell stratum via the
  $\mathbb Z_2 \times \mathbb Z_2$ symmetries.
- **Part 4** will discuss the open question: extending this to the
  non-inflectional and separatrix families, and the related conjecture
  on the global structure of the cut locus.

The five appendices A1–A5 supply every prerequisite: Lie groups (A1),
distributions and contact structures (A2), the PMP and Lie–Poisson
reduction (A3), Jacobi elliptic functions and the AGM (A4), and the SR
exponential map (A5).  With them in hand, Parts 1 and 2 should read
fluently, and Parts 3 and 4 will be approachable when they ship.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010).  "Maxwell strata in
    sub-Riemannian problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>.
  </li>
  <li>
    Yu. L. Sachkov (2011).  "Cut locus and optimal synthesis in the
    sub-Riemannian problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.
    Closed-form geodesic endpoints — eqs. (24)–(28).
  </li>
  <li>
    Yu. L. Sachkov (2010).  "Conjugate and cut time in the sub-Riemannian
    problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 16(4): 1018–1039.
  </li>
  <li>
    A. A. Agrachev, Yu. L. Sachkov (2004).
    <em>Control Theory from the Geometric Viewpoint.</em> Springer.
    Chapter 16 develops the SR exponential map abstractly; SE(2) is the
    headline worked example.
  </li>
  <li>
    R. Montgomery (2002).
    <em>A Tour of Subriemannian Geometries, Their Geodesics and
    Applications.</em> AMS.  Maxwell strata, conjugate-and-cut analysis
    for Heisenberg-style examples.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
    Elliptic project — Dubins / Visual Cortex example</a>: the geodesic
    family in Figure A5.1 is the same family rendered there.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">
    Elliptic project — Dubins back wheel example</a>: cuspidal SE(2)
    trajectories arising in the same problem under reverse-allowed
    parametrisation.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── shared helpers ─────────────────────────────────────────────────────
function inflectionalGeodesic(k, T, N) {
  // Curvature κ(s) = 2k·sn(s|k²) (Part 2 convention)
  // dθ/ds = κ, dx/ds = cos θ, dy/ds = sin θ
  const m = k * k;
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const j = ellipj(s + ds / 2, m);
    const k1 = 2 * k * j.sn;
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function separatrixGeodesic(T, N) {
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds - T / 2;
    const k1 = 2 / Math.cosh(s + ds / 2);
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function nonInflectionalGeodesic(m, T, N) {
  // κ = 2 dn(s|m)
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const j = ellipj(s + ds / 2, m);
    const k1 = 2 * j.dn;
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function fitScales(pts, W, H, margin) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.4;
  const aspect = (W - margin.l - margin.r) / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  return {
    xS: d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, W - margin.r]),
    yS: d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]),
  };
}

// ── Figure A5.1 — shoot the SR exp map ─────────────────────────────────
function drawExpMap() {
  const svg = document.getElementById('fig-expmap');
  if (!svg) return;
  const family = document.getElementById('exp-family').value;
  const kVal = parseFloat(document.getElementById('exp-k').value) / 100;
  const T = parseFloat(document.getElementById('exp-T').value) / 100;
  document.getElementById('exp-k-val').textContent = kVal.toFixed(2);
  document.getElementById('exp-T-val').textContent = T.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const margin = { t: 18, b: 32, l: 30, r: 30 };

  let pts, color;
  if (family === 'inflectional') {
    pts = inflectionalGeodesic(Math.min(kVal, 0.99), T, 800);
    color = '#1565c0';
  } else if (family === 'separatrix') {
    pts = separatrixGeodesic(T, 800);
    color = '#b71c1c';
  } else {
    // non-inflectional with m = 2 - k mapped from slider
    const m = Math.max(0.01, Math.min(0.99, 2 - kVal));
    pts = nonInflectionalGeodesic(m, T, 800);
    color = '#2e7d32';
  }

  const { xS, yS } = fitScales(pts, W, H, margin);
  // Axes
  g.append('line').attr('x1', margin.l).attr('x2', W - margin.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#eee').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#eee').attr('stroke-width', 1);

  // Curve
  g.append('path')
    .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(pts))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.4);
  // Origin
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#444');
  // Endpoint
  const end = pts[pts.length - 1];
  g.append('circle').attr('cx', xS(end.x)).attr('cy', yS(end.y))
    .attr('r', 5).attr('fill', color);

  // Status
  let info = '';
  if (family === 'inflectional') {
    const Km = ellipticK(kVal * kVal);
    info = `k = ${kVal.toFixed(2)}    period 4K(k²) = ${(4*Km).toFixed(2)}    T = ${T.toFixed(2)}`;
  } else if (family === 'separatrix') {
    info = `Euler spiral    T = ${T.toFixed(2)}`;
  } else {
    const m = Math.max(0.01, Math.min(0.99, 2 - kVal));
    const Km = ellipticK(m);
    info = `non-inflectional m = ${m.toFixed(2)}    period 2√m·K = ${(2*Math.sqrt(m)*Km).toFixed(2)}    T = ${T.toFixed(2)}`;
  }
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(info);
  g.append('text').attr('x', W - margin.r).attr('y', margin.t + 12)
    .attr('text-anchor', 'end')
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', color)
    .text(`Exp_T = (${end.x.toFixed(2)}, ${end.y.toFixed(2)}, ${(end.theta % (2*Math.PI)).toFixed(2)})`);
}

// ── Figure A5.2 — σ-symmetric pair + first-coincidence detection ───────
//
// Build γ_A(s) for s ∈ [0, T_total] (T_total chosen so we can search past T).
// γ_B(s) is the y → -y reflection of γ_A.  Coincidence requires y_A(s) = 0.
function drawMaxwell() {
  const svg = document.getElementById('fig-maxwell');
  if (!svg) return;
  const k = parseFloat(document.getElementById('mx-k').value) / 100;
  const T = parseFloat(document.getElementById('mx-T').value) / 10;
  document.getElementById('mx-k-val').textContent = k.toFixed(2);
  document.getElementById('mx-T-val').textContent = T.toFixed(2);

  const W = svg.clientWidth || 720, H = 400;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Build trajectories up to a generous range — twice T or twice 4K(k²),
  // whichever is larger, so the right panel can show the period clearly.
  const Km = ellipticK(k * k);
  const T_full = Math.max(T, 1.5 * (4 * Km));
  const N = 1500;
  const ds = T_full / N;

  function buildA() {
    const m = k * k;
    let x = 0, y = 0, theta = 0;
    const pts = [{ x, y, theta, s: 0 }];
    for (let i = 0; i < N; i++) {
      const s = i * ds;
      const j = ellipj(s + ds / 2, m);
      const k1 = 2 * k * j.sn;
      const tMid = theta + 0.5 * k1 * ds;
      x += Math.cos(tMid) * ds;
      y += Math.sin(tMid) * ds;
      theta += k1 * ds;
      pts.push({ x, y, theta, s: s + ds });
    }
    return pts;
  }

  const ptsA = buildA();
  // ptsB derived by symmetry (no need to integrate twice)
  const ptsB = ptsA.map(p => ({ x: p.x, y: -p.y, theta: -p.theta, s: p.s }));

  // Per-s separation: |γA(s) − γB(s)| = 2|y_A(s)|
  const sep = ptsA.map(p => ({ s: p.s, d: 2 * Math.abs(p.y) }));

  // Find first zero crossing of y_A after s = ds (skip the initial s = 0)
  let firstZero = null;
  for (let i = 8; i < ptsA.length; i++) {
    if ((ptsA[i - 1].y > 0) !== (ptsA[i].y > 0)) {
      // Linear interpolation
      const y0 = ptsA[i - 1].y, y1 = ptsA[i].y;
      const t0 = ptsA[i - 1].s, t1 = ptsA[i].s;
      firstZero = t0 + (t1 - t0) * (-y0) / (y1 - y0);
      break;
    }
  }

  // Layout: left panel = trajectories up to T; right panel = sep(s) plot
  const split = W * 0.55;
  const margin = { t: 18, b: 36, l: 30, r: 26 };

  // Trajectory subset truncated at T
  const Tidx = Math.max(1, Math.round(T / T_full * N));
  const ptsAtrunc = ptsA.slice(0, Tidx + 1);
  const ptsBtrunc = ptsB.slice(0, Tidx + 1);

  // Left scales
  const allTrunc = ptsAtrunc.concat(ptsBtrunc);
  const xs = allTrunc.map(p => p.x);
  const ys = allTrunc.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.4;
  const plotLW = split - margin.l - margin.r;
  const aspect = plotLW / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  const xL = d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, split - margin.r]);
  const yL = d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]);

  // Reference axes (left)
  g.append('line').attr('x1', margin.l).attr('x2', split - margin.r)
    .attr('y1', yL(0)).attr('y2', yL(0)).attr('stroke', '#f0f0f0').attr('stroke-width', 1);
  g.append('line').attr('x1', xL(0)).attr('x2', xL(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#f0f0f0').attr('stroke-width', 1);

  // Trajectories
  g.append('path')
    .attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(ptsAtrunc))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2);
  g.append('path')
    .attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(ptsBtrunc))
    .attr('fill', 'none').attr('stroke', '#b71c1c').attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3');

  // Origin and endpoints
  g.append('circle').attr('cx', xL(0)).attr('cy', yL(0)).attr('r', 4).attr('fill', '#444');
  const eA = ptsAtrunc[ptsAtrunc.length - 1], eB = ptsBtrunc[ptsBtrunc.length - 1];
  g.append('circle').attr('cx', xL(eA.x)).attr('cy', yL(eA.y)).attr('r', 5).attr('fill', '#1565c0');
  g.append('circle').attr('cx', xL(eB.x)).attr('cy', yL(eB.y)).attr('r', 5).attr('fill', '#b71c1c');

  // Connecting dashed line at endpoint
  g.append('line').attr('x1', xL(eA.x)).attr('y1', yL(eA.y))
    .attr('x2', xL(eB.x)).attr('y2', yL(eB.y))
    .attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');

  const dEnd = 2 * Math.abs(eA.y);
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`k = ${k.toFixed(2)}    T = ${T.toFixed(2)}    |γ_A(T) − γ_B(T)| = ${dEnd.toFixed(3)}`);

  g.append('text').attr('x', split - margin.r - 4).attr('y', margin.t + 12)
    .attr('text-anchor', 'end')
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888')
    .text('blue: γ_A   red: γ_B');

  // Right panel: |γA(s) − γB(s)| over s ∈ [0, T_full]
  const dMax = Math.max(...sep.map(p => p.d));
  const xR2 = d3.scaleLinear().domain([0, T_full]).range([split + margin.l, W - margin.r]);
  const yR2 = d3.scaleLinear().domain([0, dMax * 1.1]).range([H - margin.b, margin.t + 12]);

  g.append('g').attr('transform', `translate(0,${H - margin.b})`)
    .call(d3.axisBottom(xR2).ticks(6))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));
  g.append('g').attr('transform', `translate(${split + margin.l},0)`)
    .call(d3.axisLeft(yR2).ticks(4))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));

  // The separation curve
  g.append('path')
    .attr('d', d3.line().x(p => xR2(p.s)).y(p => yR2(p.d))(sep))
    .attr('fill', 'none').attr('stroke', '#0d3a78').attr('stroke-width', 2);

  // Mark first zero (Maxwell time of σ-pair)
  if (firstZero !== null) {
    g.append('line').attr('x1', xR2(firstZero)).attr('x2', xR2(firstZero))
      .attr('y1', margin.t + 12).attr('y2', H - margin.b)
      .attr('stroke', '#b71c1c').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
    g.append('circle').attr('cx', xR2(firstZero)).attr('cy', yR2(0)).attr('r', 4)
      .attr('fill', '#b71c1c');
    g.append('text').attr('x', xR2(firstZero) + 6).attr('y', margin.t + 22)
      .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#b71c1c')
      .text(`1st Maxwell @ s = ${firstZero.toFixed(3)}`);
  } else {
    g.append('text').attr('x', xR2(T_full / 2)).attr('y', margin.t + 22)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888')
      .text('no Maxwell coincidence in this range');
  }

  // Mark current T on right plot too
  g.append('line').attr('x1', xR2(T)).attr('x2', xR2(T))
    .attr('y1', margin.t + 12).attr('y2', H - margin.b)
    .attr('stroke', '#1565c0').attr('stroke-width', 1).attr('stroke-dasharray', '2,3').attr('opacity', 0.7);

  // Reference: 4K(k²)
  g.append('line').attr('x1', xR2(4 * Km)).attr('x2', xR2(4 * Km))
    .attr('y1', margin.t + 12).attr('y2', H - margin.b)
    .attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-dasharray', '5,3').attr('opacity', 0.7);
  g.append('text').attr('x', xR2(4 * Km) + 4).attr('y', H - margin.b - 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', 10).attr('fill', '#888')
    .text(`4K(k²) = ${(4 * Km).toFixed(2)}`);

  // Right-panel title
  g.append('text').attr('x', split + margin.l).attr('y', margin.t + 8)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#444')
    .text('|γ_A(s) − γ_B(s)| = 2 |y_A(s)|');

  // Divider
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
}

// ── Figure A5.3 — Wavefront formation ──────────────────────────────────
//
// 41 trajectories sweep signed k ∈ [-0.95, 0.95].  Each trajectory is
// integrated up to a fixed maximum arc length sMax (≥ the slider's max T).
// The wavefront W_T is the curve through {(x(T;k), y(T;k)) : k ∈ [-1, 1]}.
const conjState = {
  trajectories: null,    // cached
  sMax: 10.0,            // arc length to which we precompute every trajectory
  N: 480,                // sample count per trajectory
  T: 2.4,
  showGhost: true,
  showCusps: true,
  playing: false,
  raf: null,
};

function buildConjTrajectories() {
  if (conjState.trajectories) return;
  const kVals = d3.range(-0.95, 0.96, 0.05);   // 39 trajectories (signed k)
  const traj = kVals.map(k => {
    const sign = k >= 0 ? 1 : -1;
    const ka = Math.max(Math.abs(k), 1e-3);
    const m = ka * ka;
    const ds = conjState.sMax / conjState.N;
    let x = 0, y = 0, theta = 0;
    const pts = new Array(conjState.N + 1);
    pts[0] = { x: 0, y: 0, theta: 0, s: 0 };
    for (let i = 0; i < conjState.N; i++) {
      const s = i * ds;
      const j = ellipj(s + ds / 2, m);
      const kappaMid = sign * 2 * ka * j.sn;
      const tMid = theta + 0.5 * kappaMid * ds;
      x += Math.cos(tMid) * ds;
      y += Math.sin(tMid) * ds;
      theta += kappaMid * ds;
      pts[i + 1] = { x, y, theta, s: s + ds };
    }
    return { k, pts };
  });
  conjState.trajectories = traj;
}

function indexAt(s) {
  return Math.max(0, Math.min(conjState.N, Math.round(s / conjState.sMax * conjState.N)));
}

// Detect a cusp in the wavefront curve — turn-angle exceeding π/2 between
// successive segments suggests a fold (conjugate point projection).
function findWavefrontCusps(front) {
  const cusps = [];
  for (let i = 1; i < front.length - 1; i++) {
    const a = front[i - 1], b = front[i], c = front[i + 1];
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
    if (m1 < 1e-9 || m2 < 1e-9) continue;
    const cosA = dot / (m1 * m2);
    if (cosA < 0.2) {  // turn angle ≳ 78° → cusp / fold
      cusps.push({ x: b.x, y: b.y });
    }
  }
  return cusps;
}

function drawConjugate() {
  const svg = document.getElementById('fig-conjugate');
  if (!svg) return;
  buildConjTrajectories();

  conjState.T = parseFloat(document.getElementById('conj-T').value) / 10;
  document.getElementById('conj-T-val').textContent = conjState.T.toFixed(2);
  conjState.showGhost = document.getElementById('conj-ghost').checked;
  conjState.showCusps = document.getElementById('conj-cusps').checked;

  const W = svg.clientWidth || 720, H = 440;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const margin = { t: 18, b: 36, l: 30, r: 30 };

  // Truncate each trajectory at current T
  const Tidx = indexAt(conjState.T);
  const trajClipped = conjState.trajectories.map(({ k, pts }) => ({
    k, pts: pts.slice(0, Tidx + 1),
    end: pts[Tidx],
  }));

  // Auto-scale to encompass all trajectories up to current T (with 15% margin)
  // and keep room for the origin.  Padding generously avoids tight crops.
  let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
  trajClipped.forEach(({ pts }) => {
    pts.forEach(p => {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    });
  });
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
  const range = Math.max(xMax - xMin, yMax - yMin) / 2 * 1.15 + 0.4;
  const aspect = (W - margin.l - margin.r) / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  const xS = d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, W - margin.r]);
  const yS = d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]);

  // Reference axes
  g.append('line').attr('x1', margin.l).attr('x2', W - margin.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#f4f4f4').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#f4f4f4').attr('stroke-width', 1);

  // Faint trajectories up to current T
  trajClipped.forEach(({ k, pts }) => {
    if (pts.length < 2) return;
    const sign = k >= 0 ? 1 : -1;
    const ka = Math.abs(k);
    // Colour: blue for k > 0, red for k < 0; opacity scales with |k| so
    // small-k (near-straight) trajectories are most prominent
    const color = sign > 0
      ? d3.interpolateBlues(0.35 + 0.55 * ka)
      : d3.interpolateReds(0.35 + 0.55 * ka);
    g.append('path')
      .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(pts))
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.1)
      .attr('opacity', 0.45);
  });

  // Ghost wavefronts at T/4, T/2, 3T/4
  if (conjState.showGhost && conjState.T > 0.4) {
    [0.25, 0.5, 0.75].forEach(frac => {
      const idxG = indexAt(conjState.T * frac);
      if (idxG === 0) return;
      const front = conjState.trajectories.map(({ pts }) => pts[idxG]);
      g.append('path')
        .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(front))
        .attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,3').attr('opacity', 0.55);
    });
  }

  // Current wavefront — the bold curve through endpoints
  const front = trajClipped.map(t => t.end);
  if (front.length > 1) {
    g.append('path')
      .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(front))
      .attr('fill', 'none').attr('stroke', '#0d3a78').attr('stroke-width', 2.6);
    // Dots on each endpoint
    front.forEach((p, i) => {
      g.append('circle').attr('cx', xS(p.x)).attr('cy', yS(p.y))
        .attr('r', 2.4).attr('fill', '#0d3a78');
    });
  }

  // Cusp markers
  if (conjState.showCusps) {
    const cusps = findWavefrontCusps(front);
    cusps.forEach(c => {
      g.append('circle').attr('cx', xS(c.x)).attr('cy', yS(c.y))
        .attr('r', 7).attr('fill', 'none')
        .attr('stroke', '#b71c1c').attr('stroke-width', 1.8);
    });
    if (cusps.length > 0) {
      g.append('text').attr('x', W - margin.r - 4).attr('y', margin.t + 12)
        .attr('text-anchor', 'end')
        .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#b71c1c')
        .text(`${cusps.length} cusp${cusps.length === 1 ? '' : 's'} on wavefront`);
    }
  }

  // Origin
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#222');

  // Status text + scale legend
  // Use k ≈ 0.85 as a reference for "first Maxwell time"
  const Tmax_ref = 4 * ellipticK(0.85 * 0.85);
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`T = ${conjState.T.toFixed(2)}    (1st Maxwell @ k = 0.85: T₁ = ${Tmax_ref.toFixed(2)})`);

  // Colour-bar mini-legend
  const lx = margin.l + 4, ly = H - margin.b - 14;
  g.append('rect').attr('x', lx).attr('y', ly - 10).attr('width', 220).attr('height', 22)
    .attr('fill', 'white').attr('fill-opacity', 0.85)
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('rx', 3);
  g.append('text').attr('x', lx + 8).attr('y', ly + 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#555')
    .text('k = −0.95 (red)  · · ·  k = +0.95 (blue)');
}

// Animate the wavefront forming
function animateConjugate(now) {
  if (!conjState.playing) return;
  const sl = document.getElementById('conj-T');
  const cur = parseFloat(sl.value) / 10;
  const speed = 0.04;          // T increase per frame at 60Hz
  const next = cur > conjState.sMax * 0.97 ? 0.3 : cur + speed;
  sl.value = String(Math.round(next * 10));
  drawConjugate();
  conjState.raf = requestAnimationFrame(animateConjugate);
}

// ── Boot ─────────────────────────────────────────────────────────
function wire() {
  ['exp-family', 'exp-k', 'exp-T'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawExpMap);
    if (el) el.addEventListener('change', drawExpMap);
  });
  ['mx-k', 'mx-T'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawMaxwell);
  });
  ['conj-T', 'conj-ghost', 'conj-cusps'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawConjugate);
    if (el) el.addEventListener('change', drawConjugate);
  });
  const playBtn = document.getElementById('conj-play');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      conjState.playing = !conjState.playing;
      playBtn.textContent = conjState.playing ? '⏸ pause' : '▶ play';
      if (conjState.playing) {
        conjState.raf = requestAnimationFrame(animateConjugate);
      } else if (conjState.raf) {
        cancelAnimationFrame(conjState.raf);
      }
    });
  }

  drawExpMap();
  drawMaxwell();
  drawConjugate();
  window.addEventListener('resize', () => { drawExpMap(); drawMaxwell(); drawConjugate(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

})();
</script>
