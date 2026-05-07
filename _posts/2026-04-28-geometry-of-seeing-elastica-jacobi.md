---
layout: distill
image: /public/img/posts/geometry-seeing-2.svg
title: "Euler's Elastica and Jacobi Elliptic Functions"
subtitle: >
  The Pontryagin Maximum Principle turns the SE(2) geodesic problem into a pendulum
  ODE. Its solutions are the three families of Euler's elastica, parametrised exactly
  by Jacobi's elliptic functions sn, cn, dn — and their spatial period is 4K(k²),
  the complete elliptic integral of the first kind.
date: 2026-04-28 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, elastica, jacobi-elliptic, elliptic-integrals, optimal-control]
description: >
  Deriving Euler's elastica from the Pontryagin Maximum Principle on SE(2):
  the pendulum equation, three curve families (inflectional, non-inflectional,
  Euler spiral), their Jacobi elliptic parametrisations, and the period 4K(k²).
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: 2
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article covers</div>

We derive the curvature function $\kappa(s)$ of every sub-Riemannian geodesic on
$\mathrm{SE}(2)$ from first principles using the Pontryagin Maximum Principle.
The result is a pendulum equation whose general solution involves the three classical
families of Jacobi elliptic functions.
The <strong>key formula</strong>: for the inflectional family,

$$\kappa(s) = 2k\,\mathrm{cn}(s \mid k^{2}),$$

and the spatial period of the curvature oscillation is exactly
$T_{\kappa} = 4K(k^{2})$, the complete elliptic integral of the first kind.
All three families are interactive in the figures below.

</div>

## Hamiltonian Formulation via the PMP

Recall from Part 1 that we want to minimise arc length among horizontal curves
in $\mathrm{SE}(2)$:

$$\min \int_0^T \sqrt{u_1^2 + u_2^2}\,dt, \qquad \dot g = u_1 X_1(g) + u_2 X_2(g).$$

We use the standard normalisation $u_1^2 + u_2^2 = 1$ (unit-speed parametrisation),
which reduces the problem to minimising $T$ — the total arc length.

<aside id="note-covector">
A <strong>covector</strong> at $g$ is a linear map $T_g\,\mathrm{SE}(2)\!\to\!\mathbb{R}$ — it
"prices" each velocity direction.  The cotangent bundle $T^*\mathrm{SE}(2)$ collects all
such maps over every base point; it is the natural phase space for Hamiltonian mechanics
on a Lie group.  See Appendix A3 for the PMP derivation.
</aside>

The **Pontryagin Maximum Principle** (PMP) introduces a <span class="annotated-term" data-note="note-covector">covector</span> $\lambda$ in the
cotangent bundle, evolving alongside the state:

$$\lambda \in T^{*}_{g}\,\mathrm{SE}(2).$$

<aside id="note-left-triv">
Because SE(2) is a Lie group it is <em>parallelisable</em>: the basis
$\{X_1, X_2, X_3\}$ of the Lie algebra $\mathfrak{se}(2)$ extends to a global frame
via left-multiplication, giving a global identification
$T^*\mathrm{SE}(2) \cong \mathrm{SE}(2)\times\mathfrak{se}(2)^*$.
This <strong>left-trivialisation</strong> converts the costate $\lambda$ — a priori a
section of an abstract bundle — into three ordinary numbers $(h_1, h_2, h_3)$
evolving by ODEs.  See Appendix A1.
</aside>

In the <span class="annotated-term" data-note="note-left-triv">left-trivialisation</span> provided by the Lie algebra,

$$T^{*}\mathrm{SE}(2) \;\cong\; \mathrm{SE}(2) \times \mathfrak{se}(2)^{*},$$

the costate becomes a triple of components $(h_1, h_2, h_3)$ defined by

$$h_i = \langle \lambda,\, X_i(g)\rangle, \qquad i = 1, 2, 3.$$

The **Hamiltonian** for the PMP maximisation condition is

$$H = h_1 u_1 + h_2 u_2 - \nu \sqrt{u_1^2 + u_2^2},$$

where $\nu \in \{0, \tfrac{1}{2}\}$ is the abnormality constant.
For **normal extremals** ($\nu = \tfrac{1}{2}$), maximising over $u_1, u_2$
gives the **normal Hamiltonian**

$$\mathcal{H}_n = \tfrac{1}{2}\bigl(h_1^2 + h_2^2\bigr).$$

<aside>
Abnormal extremals ($\nu = 0$) occur when $h_1 \equiv 0$ along the extremal.
For $\mathrm{SE}(2)$ they exist but are never strictly optimal (Sachkov 2004).
We focus on normal extremals throughout.
</aside>

<aside id="note-lie-poisson">
$\{\cdot,\cdot\}$ is the <strong>Lie–Poisson bracket</strong> on $\mathfrak{se}(2)^*$,
the natural Poisson structure on the dual of any Lie algebra. With
$[X_1, X_2] = -X_3$, $[X_2, X_3] = -X_1$, $[X_1, X_3] = 0$ in our body frame,
the brackets between coordinate functionals are
$\{h_1, h_2\} = h_3$, $\{h_2, h_3\} = h_1$, $\{h_1, h_3\} = 0$.
</aside>

The Hamiltonian equations on $\mathfrak{se}(2)^{*}$, via the <span class="annotated-term" data-note="note-lie-poisson">Lie–Poisson bracket</span>, read

$$\dot h_1 = \{h_1, \mathcal{H}_n\} = h_2 h_3, \quad
  \dot h_2 = \{h_2, \mathcal{H}_n\} = -h_1 h_3, \quad
  \dot h_3 = \{h_3, \mathcal{H}_n\} = -h_1 h_2.$$

<aside id="note-casimir">
A <strong>Casimir function</strong> on the dual of a Lie algebra is one
that Poisson-commutes with <em>every</em> coordinate function — it is
preserved by every Hamiltonian flow, regardless of which Hamiltonian you
choose. Casimirs come from the structure of the algebra itself, not from
any particular dynamics. They label the <em>symplectic leaves</em> on which
genuine Hamiltonian motion takes place. Appendix A1 derives the SE(2)
Casimir from the structure constants directly.
</aside>

Two integrals reduce this 3D system to a 1D motion. The Hamiltonian itself,
$\mathcal{H}_n = \tfrac{1}{2}(h_1^{2} + h_2^{2})$, is conserved because the
flow is Hamiltonian. The second is the <span class="annotated-term" data-note="note-casimir">**Casimir**</span> of $\mathfrak{se}(2)^{*}$,

$$C \;=\; h_1^{2} + h_3^{2},$$

which Poisson-commutes with every smooth function and is therefore
*automatically* preserved by any Hamiltonian flow on the dual algebra.

<aside id="note-coadjoint">
The <strong>coadjoint orbits</strong> of a Lie group $G$ partition
$\mathfrak{g}^{*}$ into Kirillov–Kostant–Souriau symplectic manifolds.
For SE(2) they are vertical cylinders in $(h_1, h_2, h_3)$-space (plus
degenerate points along an axis). Appendix A1 §6 derives this directly
from the adjoint action.
</aside>

The Casimir labels the <span class="annotated-term" data-note="note-coadjoint">symplectic leaves</span> of
the Lie–Poisson bracket — the coadjoint orbits. For $\mathfrak{se}(2)^{*}$
the orbits are the cylinders $\{h_1^{2} + h_3^{2} = C\}$, on which the
Hamiltonian dynamics is genuinely symplectic.

Fix the unit-speed normalisation $\mathcal{H}_n = 1/2$, so $h_1^{2} + h_2^{2} = 1$.
The angle $\alpha$ defined by

$$h_1 = \sin\alpha, \qquad h_2 = \cos\alpha$$

then evolves as $\dot\alpha = h_3$ (from $\dot h_1 = h_2 h_3$).
Using $h_3^{2} = C - h_1^{2} = C - \sin^{2}\alpha$, set
$\varphi = 2\alpha$:

$$\dot\varphi^{2} \;=\; 4 h_3^{2} \;=\; (4C - 2) \,+\, 2\cos\varphi.$$

Differentiating once more in time gives the **pendulum equation**.

## The Pendulum Equation

<div class="callout theorem">
<div class="callout-title">Pendulum ODE for the doubled costate angle</div>

$$\ddot\varphi + \sin\varphi \;=\; 0,
\qquad E \;=\; \tfrac{1}{2}\dot\varphi^{2} - \cos\varphi \;=\; 2C - 1,$$

where $\varphi = 2\alpha$ and $\alpha = \arctan(h_1 / h_2)$ is the phase of
$(h_1, h_2)$ on the unit circle. The pendulum energy $E$ is fixed by the
Casimir $C$ on the coadjoint orbit.

</div>

The three dynamically distinct regimes of the pendulum correspond directly to the
**three families of SE(2) geodesics**:

| Energy $E$ | Pendulum motion | Elastica family |
|:-----------:|:---------------:|:---------------:|
| $-1 < E < 1$ | oscillation (libration) | **inflectional** |
| $E = 1$ | separatrix (infinite period) | **Euler spiral** |
| $E > 1$ | rotation | **non-inflectional** |

<aside>
The term <em>elastica</em> goes back to Euler (1744), who classified all
shapes of a thin elastic rod in equilibrium under end loads. What he showed
is that the heading angle of the rod's centreline satisfies precisely this
pendulum equation in arc length — the same equation our reduction has just
delivered for the SR-on-SE(2) costate phase.
</aside>

### From the pendulum to the curve

The pendulum equation lives on the costate, but the figures below plot the
**curvature $\kappa(s)$ of the projected plane curve in its own Euclidean
arc length $s$**. These two are tied together by a quick computation.

In unit-speed parametrisation $h_1^{2}+h_2^{2}=1$, the projected speed is
$|h_1| = |\sin(\varphi/2)|$ and the heading derivative is $\dot\theta = h_2 = \cos(\varphi/2)$.
Reparametrising by Euclidean arc length $s$ with $ds = |h_1|\,dt$, and using
$\dot\varphi = \pm 2 h_3$, a short calculation gives an explicit closed-form
$\kappa(s)$ in each regime — the three Jacobi-elliptic curvature profiles
below. They satisfy the **elastica curvature ODE** (the Duffing form
equivalent to the pendulum)

$$\kappa''(s) + \tfrac{1}{2}\kappa(s)^{3} - \mu\,\kappa(s) \;=\; 0,$$

with the integration constant $\mu$ fixed by the Casimir $C$ — one ODE, three
qualitatively different solution branches.

## Three Families via Jacobi Elliptic Functions

### Inflectional Elastica ($-1 < E < 1$)

The pendulum oscillates; $\varphi(s)$ changes sign.
The curvature of the projected plane curve therefore changes sign: these are curves
with **inflection points**.

Setting the energy $E = 2k^{2} - 1$ with $k \in (0, 1)$, the curvature is

$$\boxed{\;\kappa(s) = 2k\,\mathrm{cn}(s \mid k^{2})\;}$$

The Jacobi function $\mathrm{cn}(s \mid k^{2})$ has period $4K(k^{2})$ in $s$,
so the curvature — and hence the curve shape — repeats with spatial period

$$T_{\kappa} = 4K(k^{2}).$$

As $k \to 0$: $\mathrm{cn}(s\mid 0) = \cos s$ and the elastica approximates a
cosine-curvature curve (nearly straight).
As $k \to 1$: $K(1) = \infty$ and the period diverges — the curve spirals inward
without repeating (the Euler spiral limit).

### Euler Spiral / Cornu Spiral ($E = 1$, separatrix)

At the separatrix the curvature is

$$\kappa(s) = \frac{2}{\cosh s}.$$

This is the **Euler–Cornu spiral** (also called the *clothoid*).
Its curvature is a smooth bump decaying to zero at both ends; the total turning is
$\Delta\theta = 2\pi$.
It is the limiting case between oscillating and rotating pendulum, and has
infinite period $T_\kappa = \infty$.

The Euler spiral is famous in civil engineering (transition curves for railways)
and optics (Fresnel integrals), but here it arises as the unique separatrix
geodesic in SE(2).

### Non-Inflectional Elastica ($E > 1$)

The pendulum rotates without stopping; $\varphi(s)$ is monotone.
Setting $m = 2/(E + 1) \in (0, 1)$ (here $m$ parametrises this family — at
$E=1$ the separatrix gives $m=1$, and as $E\to\infty$ we have $m\to 0$):

$$\kappa(s) = 2\,\mathrm{dn}(s \mid m).$$

These curves have **no inflection points** — the curvature never changes sign.
The Jacobi function $\mathrm{dn}(s\mid m)$ has period $2K(m)$ in $s$, so the
spatial period is

$$T_{\kappa} = 2K(m).$$

As $m \to 1$: $\mathrm{dn}(s\mid 1) = \mathrm{sech}(s)$ — the non-inflectional family
approaches the Euler spiral from the other side.
As $m \to 0$: $\mathrm{dn}(s\mid 0) = 1$ and $\kappa \to 2$ — the curves
degenerate into circles of radius $1/2$ (high-energy uniform rotation).

</div><!-- /.l-body -->

<!-- Figure 1: Elastica explorer (κ(s) + curve) -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>
        Family
        <select id="elastica-type">
          <option value="inflectional">Inflectional   κ = 2k cn(s|k²)</option>
          <option value="euler">Euler spiral   κ = 2/cosh(s)</option>
          <option value="noninflectional">Non-inflectional   κ = 2 dn(s|m)</option>
        </select>
      </label>
      <label id="k-label">
        k = <span class="ctrl-val" id="k-val">0.70</span>
        <input type="range" id="k-slider" min="1" max="98" value="70">
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Left: κ(s).  Right: projected curve (x, y).
      </span>
    </div>
    <svg id="fig-elastica" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    <strong>Elastica explorer.</strong>
    Left panel: the curvature $\kappa(s)$ as a function of arc length.
    Right panel: the corresponding plane curve $(x(s), y(s))$, the spatial projection
    of the SE(2) geodesic.
    For the inflectional family, zeros of $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$
    coincide with inflection points of the curve; the period is $T_\kappa = 4K(k^2)$.
    Drag the slider to vary $k$ (or $m$); switch families with the dropdown.
  </figcaption>
</figure>

<!-- Figure 2: Period T = 4K(k²) vs k -->
<figure class="l-middle">
  <div class="fig-box">
    <svg id="fig-period" style="width:100%;height:320px;"></svg>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    <strong>The period $T_\kappa(k) = 4K(k^2)$ diverges as $k \to 1$.</strong>
    Blue: inflectional period $4K(k^2)$; green: non-inflectional period $2K(m)$
    (plotted vs $k = \sqrt{m}$ for comparison).
    The vertical asymptote at $k = 1$ corresponds to the Euler spiral — infinite period,
    infinite total curvature.
    For small $k$: $K(k^2) \approx \pi/2 + \pi k^2/8$, so $T_\kappa \approx 2\pi$
    (nearly circular curvature oscillation).
  </figcaption>
</figure>

<!-- Figure 3: Phase portrait of the pendulum -->
<figure class="l-middle">
  <div class="fig-box">
    <svg id="fig-phase" style="width:100%;height:360px;"></svg>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    <strong>Phase portrait of the pendulum $\ddot\varphi + \sin\varphi = 0$.</strong>
    Closed orbits (blue): libration — inflectional elastica.
    The separatrix (red, $E = 1$): Euler spiral.
    Rotation orbits (green): non-inflectional elastica.
    Each orbit corresponds to a one-parameter family of SE(2) geodesics;
    the energy $E$ determines the family, and the initial phase on the orbit
    determines the individual curve.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The Complete Elliptic Integral K(k²)

<aside id="note-agm">
The <strong>arithmetic–geometric mean</strong> $\mathrm{AGM}(a, b)$ is the
common limit of the simultaneous iterations $a_{n+1} = \tfrac12(a_n + b_n)$
and $b_{n+1} = \sqrt{a_n b_n}$. It converges <em>quadratically</em>: each
step roughly doubles the number of correct digits. Gauss discovered in 1799
that it computes $K(m)$ exactly. Appendix A4 derives the AGM from the
Landen transform and proves the $K$-formula.
</aside>

The period formula $T_\kappa = 4K(k^{2})$ is not incidental — $K(k^{2})$ is the
**exact** half-period of $\mathrm{sn}(s\mid k^{2})$ by definition.
This makes the elastica period computable to arbitrary precision via the
<span class="annotated-term" data-note="note-agm">arithmetic–geometric mean (AGM)</span>:

$$K(m) = \frac{\pi}{2\,\mathrm{AGM}\!\bigl(1,\;\sqrt{1 - m}\bigr)}, \qquad m = k^{2}.$$

The AGM converges quadratically: about 16 significant digits in 6 iterations.
This is precisely what the `elliptic` package uses:

```python
from elliptic import ellipticK
import numpy as np

k  = np.linspace(0, 0.999, 500)
Tk = 4 * ellipticK(k**2)   # spatial period of curvature oscillation
```

<aside>
The <code>elliptic</code> package was written originally to compute exactly these
integrals for the SE(2) geodesic analysis (Moiseev &amp; Sachkov 2010).
The browser figures on this page use the same AGM algorithm implemented in
<code>elliptic-core.js</code>.
</aside>

For the Jacobi functions themselves:

```python
from elliptic import ellipj

s = np.linspace(-2*K, 2*K, 800)
sn, cn, dn = ellipj(s, k**2)
kappa = 2 * k * cn             # curvature of inflectional elastica
```

The three functions satisfy the differential equations

$$\frac{d}{ds}\mathrm{sn} = \mathrm{cn}\,\mathrm{dn}, \qquad
  \frac{d}{ds}\mathrm{cn} = -\mathrm{sn}\,\mathrm{dn}, \qquad
  \frac{d}{ds}\mathrm{dn} = -m\,\mathrm{sn}\,\mathrm{cn},$$

and the Pythagorean identities

$$\mathrm{sn}^{2} + \mathrm{cn}^{2} = 1, \qquad \mathrm{dn}^{2} + m\,\mathrm{sn}^{2} = 1.$$

These let us differentiate $\kappa(s)$ analytically:

$$\kappa'(s) = -2k\,\mathrm{sn}(s)\,\mathrm{dn}(s),$$

which will be essential in Part 3 for locating Maxwell strata.

## Integrating the Elastica

Given $\kappa(s)$, the plane curve is recovered by Frenet–Serret integration:

$$\frac{d}{ds}\begin{pmatrix}x\\ y\\ \theta\end{pmatrix}
  = \begin{pmatrix}\cos\theta\\ \sin\theta\\ \kappa(s)\end{pmatrix}.$$

The $\theta$-equation integrates explicitly for the inflectional family:

$$\theta(s) = \theta_0 + 2\arcsin\!\bigl(k\,\mathrm{sn}(s\mid k^{2})\bigr),$$

then $x, y$ require a further integration involving $\mathrm{sn}$ and $\mathrm{cn}$
that can be expressed via the incomplete elliptic integral of the second kind
$E(s\mid k^{2})$.

In the `elliptic` package:

```python
from elliptic import elliptic12

phi = np.arcsin(k * sn)
E_vals, F_vals = elliptic12(phi, k**2)   # E(φ|k²) and F(φ|k²)
x = 2 * (E_vals - F_vals / 2)            # exact formula from Sachkov (2011)
```

The full closed-form expressions — due to Sachkov (2011) — express every
$x(s)$, $y(s)$ of an inflectional elastica as a rational combination of
$\mathrm{sn}$, $\mathrm{cn}$, $\mathrm{dn}$, and $E(\cdot\mid k^2)$.
No numerical ODE integration is needed.

## What the Three Families Look Like

The interactive figure above lets you explore all three families.
A few landmarks worth noting:

- **$k = 0.1$** (inflectional): nearly straight, very gentle curvature oscillation.
  The curve barely bends before straightening again.

- **$k \approx 0.71$** (inflectional): the "figure-eight" lemniscate — the curve
  crosses itself once per period and the endpoints of one period coincide.
  This is the **Maxwell stratum** for the symmetric geodesics (Part 3).

- **$k \to 1^-$** (inflectional → Euler spiral): the period $4K(k^2)$ diverges and
  the curve spirals inward, winding around two limiting points.

- **Euler spiral** ($k = 1$): curvature $2/\cosh(s)$, total turning $2\pi$.
  The two asymptotic directions are parallel but offset — the curve never closes.

- **Non-inflectional, $m = 0.3$**: like a wavy circle — curvature oscillates but
  never changes sign; the curve closes after a finite arc length.

</div><!-- /.l-body -->

<!-- Figure 4: All three families side by side -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <span style="font-size:12px;color:#555;">
        Blue: inflectional (k = 0.3, 0.6, 0.9) &nbsp;·&nbsp;
        Red: Euler spiral &nbsp;·&nbsp;
        Green: non-inflectional (m = 0.3, 0.6, 0.9)
      </span>
    </div>
    <svg id="fig-families" style="width:100%;height:340px;"></svg>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    <strong>All three families of Euler's elastica</strong> rendered at the same scale.
    Blue curves (inflectional): oscillate between positive and negative curvature;
    the amplitude grows with $k$.
    Red (Euler spiral / separatrix): the limiting case between oscillation and rotation.
    Green (non-inflectional): curvature stays one-signed; the curves resemble
    deformed circles.
    Every geodesic of SE(2) projects to one of these curve types.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Summary and Preview of Part 3

We have shown that every normal SR geodesic on SE(2) has curvature belonging to
one of three Jacobi-elliptic families, with the inflectional case
$\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$ being the generic one.
The complete elliptic integral $K(k^2)$ controls the spatial period of the
curvature, and the closed-form $x(s), y(s)$ involve elliptic integrals of the
second kind.

The next natural question is: *which geodesics are globally optimal?*
A geodesic may be locally length-minimising (no shorter path in a thin tube)
while a completely different geodesic of the same length exists.
The locus where this happens — where two distinct geodesics of equal length
*meet* — is the **Maxwell stratum**.

In Part 3 we will show that the Maxwell stratum is governed by the discrete
symmetry group of $\mathrm{SE}(2)$, and that the first Maxwell time for an
inflectional geodesic with modulus $k$ is exactly

$$t_{\mathrm{MAX}}^{(1)} = \frac{4K(k^{2})}{\omega_0},$$

the same period $4K(k^{2})$ that controls the curvature oscillation — but this
time as a *time*, not a length.
This identity is the heart of the Maxwell strata proof.

</div><!-- /.l-body -->

<!-- ── References ── -->
<div class="d-article" style="padding-top:0;">
<div class="l-body d-references">
<h2>References</h2>
<ol>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on
    the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>
  </li>
  <li>
    Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian
    problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>
  </li>
  <li>
    Yu. L. Sachkov (2004). "Exponential mapping in generalized Dido's problem."
    <em>Mat. Sbornik</em> 194(9): 63–90.
  </li>
  <li>
    L. Euler (1744). <em>Methodus inveniendi lineas curvas maximi minimive proprietate
    gaudentes.</em> Lausanne: Marcum-Michaelem Bousquet.
    Additamentum I (De curvis elasticis).
  </li>
  <li>
    M. Abramowitz &amp; I. A. Stegun (1964). <em>Handbook of Mathematical Functions.</em>
    National Bureau of Standards. §16 (Jacobian Elliptic Functions), §17 (Elliptic
    Integrals).
  </li>
  <li>
    J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact
    structure." <em>Journal of Physiology–Paris</em> 97(2–3): 265–309.
  </li>
  <li>
    L. S. Pontryagin et al. (1962). <em>The Mathematical Theory of Optimal Processes.</em>
    Wiley–Interscience.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script>
(function () {
'use strict';

// ── Figure 1: Elastica explorer ───────────────────────────────────────────
function drawElastica() {
  const svg = document.getElementById('fig-elastica');
  if (!svg) return;

  const typeEl  = document.getElementById('elastica-type');
  const slider  = document.getElementById('k-slider');
  const kValEl  = document.getElementById('k-val');
  const kLabel  = document.getElementById('k-label');

  function render() {
    const type = typeEl ? typeEl.value : 'inflectional';
    const param = slider ? parseInt(slider.value) / 100 : 0.7;
    if (kValEl) kValEl.textContent = param.toFixed(2);
    if (kLabel) kLabel.style.display = (type === 'euler') ? 'none' : '';

    const W = svg.getBoundingClientRect().width || 680;
    const H = 380;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const dv = d3.select(svg);
    dv.selectAll('*').remove();

    const midX = W / 2;
    const panelW = midX - 24;

    // Background
    dv.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');
    // Divider
    dv.append('line').attr('x1', midX).attr('x2', midX)
      .attr('y1', 12).attr('y2', H - 12)
      .attr('stroke', '#e0e0e0').attr('stroke-width', 1);

    // Panel labels
    const labelStyle = 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#999';
    dv.append('text').attr('x', midX / 2).attr('y', 22)
      .attr('text-anchor', 'middle').attr('style', labelStyle).text('κ(s)');
    dv.append('text').attr('x', midX + panelW / 2).attr('y', 22)
      .attr('text-anchor', 'middle').attr('style', labelStyle).text('curve (x, y)');

    // ── Left panel: κ(s) ──
    let kappaFn, sMin, sMax, N = 600;

    if (type === 'inflectional') {
      const k = Math.max(0.02, Math.min(0.99, param));
      const m = k * k;
      const Km = ellipticK(m);
      sMin = -2 * Km; sMax = 2 * Km;
      kappaFn = s => 2 * k * ellipj(s, m).cn;
    } else if (type === 'euler') {
      sMin = -7; sMax = 7;
      kappaFn = s => 2 / Math.cosh(s);
    } else {
      const m = Math.max(0.02, Math.min(0.98, param * param));
      const Km = ellipticK(m);
      sMin = -Km; sMax = Km;
      kappaFn = s => 2 * ellipj(s, m).dn;
    }

    const sArr = d3.range(N + 1).map(i => sMin + i * (sMax - sMin) / N);
    const kappaArr = sArr.map(kappaFn);
    const kappaExt = d3.extent(kappaArr);
    const kRange = Math.max(Math.abs(kappaExt[0]), Math.abs(kappaExt[1]), 0.5) * 1.25;

    const lPad = 36, rPad = 12, tPad = 32, bPad = 32;
    const lW = panelW - lPad - rPad;
    const lH = H - tPad - bPad;

    const xScL = d3.scaleLinear([sMin, sMax], [lPad, lPad + lW]);
    const yScL = d3.scaleLinear([-kRange, kRange], [tPad + lH, tPad]);

    const leftG = dv.append('g');

    // Axes
    leftG.append('line')
      .attr('x1', lPad).attr('x2', lPad + lW)
      .attr('y1', yScL(0)).attr('y2', yScL(0))
      .attr('stroke', '#ccc').attr('stroke-width', 1);
    leftG.append('line')
      .attr('x1', xScL(0)).attr('x2', xScL(0))
      .attr('y1', tPad).attr('y2', tPad + lH)
      .attr('stroke', '#ccc').attr('stroke-width', 1);

    // Period markers (inflectional only)
    if (type === 'inflectional') {
      const Km = (sMax - sMin) / 4;
      [-2*Km, -Km, 0, Km, 2*Km].filter(v => v >= sMin && v <= sMax).forEach(v => {
        leftG.append('line')
          .attr('x1', xScL(v)).attr('x2', xScL(v))
          .attr('y1', tPad).attr('y2', tPad + lH)
          .attr('stroke', '#ddd').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
      });
    }

    const lineData = sArr.map((s, i) => [xScL(s), yScL(kappaArr[i])]);
    leftG.append('path')
      .attr('d', d3.line()(lineData))
      .attr('fill', 'none')
      .attr('stroke', type === 'euler' ? '#d32f2f' : type === 'noninflectional' ? '#388e3c' : '#1565c0')
      .attr('stroke-width', 2.2);

    // y-axis ticks
    const tickVals = [-2, -1, 0, 1, 2].filter(v => Math.abs(v) <= kRange * 0.95);
    tickVals.forEach(v => {
      leftG.append('text')
        .attr('x', lPad - 4).attr('y', yScL(v) + 4)
        .attr('text-anchor', 'end')
        .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#999')
        .text(v);
    });

    // ── Right panel: curve ──
    const pts = integrateElastica(kappaFn, sMin, sMax, N);
    const xArr = pts.map(p => p.x), yArr = pts.map(p => p.y);
    const xExt = d3.extent(xArr), yExt = d3.extent(yArr);
    const xRange2 = Math.max(xExt[1] - xExt[0], 0.5);
    const yRange2 = Math.max(yExt[1] - yExt[0], 0.5);
    const sc2 = Math.min(lW / xRange2, lH / yRange2) * 0.82;
    const xO = midX + panelW / 2 - (xExt[0] + xExt[1]) / 2 * sc2;
    const yO = H / 2 + (yExt[0] + yExt[1]) / 2 * sc2;

    const rightG = dv.append('g');
    // Axes
    rightG.append('line').attr('x1', midX + 8).attr('x2', midX + panelW)
      .attr('y1', yO).attr('y2', yO).attr('stroke', '#e8e8e8').attr('stroke-width', 1);

    const curveData = pts.map(p => [xO + p.x * sc2, yO - p.y * sc2]);
    rightG.append('path')
      .attr('d', d3.line()(curveData))
      .attr('fill', 'none')
      .attr('stroke', type === 'euler' ? '#d32f2f' : type === 'noninflectional' ? '#388e3c' : '#1565c0')
      .attr('stroke-width', 2.2);

    // Start/end dots
    const [sx, sy] = curveData[0];
    const [ex, ey] = curveData[curveData.length - 1];
    rightG.append('circle').attr('cx', sx).attr('cy', sy)
      .attr('r', 4).attr('fill', '#fff').attr('stroke', '#333').attr('stroke-width', 1.5);
    rightG.append('circle').attr('cx', ex).attr('cy', ey)
      .attr('r', 4).attr('fill', '#333').attr('stroke', '#333').attr('stroke-width', 1.5);
  }

  render();
  if (typeEl) typeEl.addEventListener('change', render);
  if (slider) slider.addEventListener('input', render);
  window.addEventListener('resize', render);
}

// ── Figure 2: Period T = 4K(k²) ──────────────────────────────────────────
function drawPeriodPlot() {
  const svg = document.getElementById('fig-period');
  if (!svg) return;

  const W = svg.getBoundingClientRect().width || 680;
  const H = 320;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg);
  g.selectAll('*').remove();

  const pad = { l: 52, r: 24, t: 24, b: 44 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  // Data
  const N = 300;
  const kArr = d3.range(N).map(i => 0.01 + i * 0.97 / N);
  const T_infl = kArr.map(k => 4 * ellipticK(k * k));
  const T_noninfl = kArr.map(k => {
    const m = k * k;
    return 2 * ellipticK(m);
  });

  const yMax = 24;
  const xSc = d3.scaleLinear([0, 1], [pad.l, pad.l + iW]);
  const ySc = d3.scaleLinear([0, yMax], [pad.t + iH, pad.t]);

  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  // Grid lines
  [2, 4, 6, 8, 10, 15, 20].forEach(v => {
    g.append('line')
      .attr('x1', pad.l).attr('x2', pad.l + iW)
      .attr('y1', ySc(v)).attr('y2', ySc(v))
      .attr('stroke', '#ebebeb').attr('stroke-width', 1);
    g.append('text')
      .attr('x', pad.l - 6).attr('y', ySc(v) + 4)
      .attr('text-anchor', 'end')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa')
      .text(v);
  });

  // x-axis ticks
  [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(v => {
    g.append('line')
      .attr('x1', xSc(v)).attr('x2', xSc(v))
      .attr('y1', pad.t + iH).attr('y2', pad.t + iH + 5)
      .attr('stroke', '#aaa').attr('stroke-width', 1);
    g.append('text')
      .attr('x', xSc(v)).attr('y', pad.t + iH + 16)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa')
      .text(v.toFixed(1));
  });

  // Axis labels
  g.append('text')
    .attr('x', pad.l + iW / 2).attr('y', H - 6)
    .attr('text-anchor', 'middle')
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:12px;fill:#666')
    .text('k');
  g.append('text')
    .attr('transform', `translate(14,${pad.t + iH / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:12px;fill:#666')
    .text('T_κ');

  // Inflectional curve
  const inflData = kArr.map((k, i) => [xSc(k), ySc(Math.min(T_infl[i], yMax))]);
  g.append('path').attr('d', d3.line()(inflData))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);

  // Non-inflectional curve
  const nonInflData = kArr.map((k, i) => [xSc(k), ySc(Math.min(T_noninfl[i], yMax))]);
  g.append('path').attr('d', d3.line()(nonInflData))
    .attr('fill', 'none').attr('stroke', '#388e3c').attr('stroke-width', 2.2)
    .attr('stroke-dasharray', '6,3');

  // π line
  g.append('line')
    .attr('x1', pad.l).attr('x2', pad.l + iW)
    .attr('y1', ySc(Math.PI * 2)).attr('y2', ySc(Math.PI * 2))
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
  g.append('text').attr('x', pad.l + 4).attr('y', ySc(Math.PI * 2) - 4)
    .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#bbb')
    .text('2π');

  // Legend
  const leg = [['– 4K(k²)', '#1565c0'], ['- - 2K(m)', '#388e3c']];
  leg.forEach(([label, col], i) => {
    const lx = pad.l + iW - 130, ly = pad.t + 18 + i * 18;
    g.append('line').attr('x1', lx).attr('x2', lx + 24)
      .attr('y1', ly).attr('y2', ly)
      .attr('stroke', col).attr('stroke-width', 2)
      .attr('stroke-dasharray', i === 1 ? '6,3' : null);
    g.append('text').attr('x', lx + 30).attr('y', ly + 4)
      .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#555')
      .text(label);
  });

  // Asymptote label
  g.append('text')
    .attr('x', xSc(0.97)).attr('y', pad.t + 14)
    .attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:10px;fill:#c62828')
    .text('k→1: T→∞');
}

// ── Figure 3: Phase portrait ──────────────────────────────────────────────
function drawPhasePortrait() {
  const svg = document.getElementById('fig-phase');
  if (!svg) return;

  const W = svg.getBoundingClientRect().width || 680;
  const H = 360;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg);
  g.selectAll('*').remove();

  const pad = { l: 44, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const xSc = d3.scaleLinear([-Math.PI * 2.2, Math.PI * 2.2], [pad.l, pad.l + iW]);
  const ySc = d3.scaleLinear([-2.6, 2.6], [pad.t + iH, pad.t]);

  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  // Axes
  g.append('line').attr('x1', pad.l).attr('x2', pad.l + iW)
    .attr('y1', ySc(0)).attr('y2', ySc(0)).attr('stroke', '#ccc').attr('stroke-width', 1);
  g.append('line').attr('x1', xSc(0)).attr('x2', xSc(0))
    .attr('y1', pad.t).attr('y2', pad.t + iH).attr('stroke', '#ccc').attr('stroke-width', 1);

  // π tick marks on x-axis
  [-2, -1, 0, 1, 2].forEach(n => {
    const x = xSc(n * Math.PI);
    g.append('line').attr('x1', x).attr('x2', x)
      .attr('y1', ySc(0) - 3).attr('y2', ySc(0) + 3).attr('stroke', '#aaa');
    g.append('text').attr('x', x).attr('y', ySc(0) + 15)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa')
      .text(n === 0 ? '0' : n === 1 ? 'π' : n === -1 ? '-π' : n + 'π');
  });

  g.append('text').attr('x', pad.l + iW - 4).attr('y', ySc(0) + 14)
    .attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#888')
    .text('φ');
  g.append('text').attr('x', xSc(0) + 6).attr('y', pad.t + 12)
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#888')
    .text('φ̇');

  // Closed (libration) orbits — inflectional family
  const kLibration = [0.2, 0.4, 0.6, 0.8, 0.95];
  kLibration.forEach(k => {
    const E = 2 * k * k - 1; // energy
    const pts = [];
    const phiMax = 2 * Math.asin(k);
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const phi = -phiMax + 2 * phiMax * i / N;
      const phidot = Math.sqrt(2 * (E + Math.cos(phi)));
      if (!isNaN(phidot)) pts.push([xSc(phi), ySc(phidot)]);
    }
    // Mirror
    const ptsMirror = pts.slice().reverse().map(([x, y]) => [x, ySc(-Math.sqrt(2 * (E + Math.cos(xSc.invert(x)))))]);
    const col = d3.interpolateBlues(0.35 + k * 0.55);
    const closed = [...pts, ...ptsMirror.slice(1)];
    g.append('path').attr('d', d3.line()(closed) + 'Z')
      .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.6);
  });

  // Separatrix (E = 1)
  const sepPts = [];
  const N2 = 300;
  for (let i = 0; i <= N2; i++) {
    const phi = -Math.PI * 2 + 4 * Math.PI * i / N2;
    const phidot = 2 * Math.cos(phi / 2);
    sepPts.push([xSc(phi), ySc(phidot)]);
  }
  const sepPtsLow = [];
  for (let i = 0; i <= N2; i++) {
    const phi = -Math.PI * 2 + 4 * Math.PI * i / N2;
    const phidot = -2 * Math.cos(phi / 2);
    sepPtsLow.push([xSc(phi), ySc(phidot)]);
  }
  g.append('path').attr('d', d3.line()(sepPts))
    .attr('fill', 'none').attr('stroke', '#c62828').attr('stroke-width', 2.2);
  g.append('path').attr('d', d3.line()(sepPtsLow))
    .attr('fill', 'none').attr('stroke', '#c62828').attr('stroke-width', 2.2);

  // Rotation orbits — non-inflectional family
  const phidot0Vals = [2.2, 2.6];
  phidot0Vals.forEach(pd0 => {
    const E = 0.5 * pd0 * pd0 - 1; // energy at phi=0
    const pts = [];
    const N3 = 300;
    for (let i = 0; i <= N3; i++) {
      const phi = -Math.PI * 2 + 4 * Math.PI * i / N3;
      const val = 2 * (E + Math.cos(phi));
      if (val < 0) return;
      const phidot = Math.sqrt(val);
      pts.push([xSc(phi), ySc(phidot)]);
    }
    const ptsLow = pts.map(([x, y]) => [x, ySc(-Math.abs(ySc.invert(y)))]);
    const col = d3.interpolateGreens(0.4 + (pd0 - 2.2) * 0.8);
    if (pts.length > 1) {
      g.append('path').attr('d', d3.line()(pts))
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.8);
      g.append('path').attr('d', d3.line()(ptsLow))
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.8);
    }
  });

  // Labels
  g.append('text').attr('x', xSc(0.5)).attr('y', ySc(0.6))
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#1565c0')
    .text('inflectional');
  g.append('text').attr('x', xSc(Math.PI * 0.3)).attr('y', ySc(-2.3))
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#388e3c')
    .text('non-inflectional');
  g.append('text').attr('x', xSc(-Math.PI * 1.6)).attr('y', ySc(2.1))
    .attr('style', 'font-family:var(--sans,"sans-serif");font-size:11px;fill:#c62828')
    .text('separatrix');
}

// ── Figure 4: All three families ─────────────────────────────────────────
function drawFamilies() {
  const svg = document.getElementById('fig-families');
  if (!svg) return;

  const W = svg.getBoundingClientRect().width || 680;
  const H = 340;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg);
  g.selectAll('*').remove();
  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  const cx = W / 2, cy = H / 2;
  const scale = H * 0.13;

  // Non-inflectional (green)
  const mVals = [0.3, 0.6, 0.9];
  mVals.forEach(m => {
    const Km = ellipticK(m);
    const pts = integrateElastica(s => 2 * ellipj(s, m).dn, -Km, Km, 500);
    const x0 = pts[0].x, y0 = pts[0].y;
    const col = d3.interpolateGreens(0.4 + m * 0.4);
    g.append('path')
      .attr('d', d3.line().x(p => cx + (p.x - x0) * scale).y(p => cy - (p.y - y0) * scale)(pts))
      .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.8);
  });

  // Inflectional (blue)
  const kVals = [0.3, 0.6, 0.9];
  kVals.forEach(k => {
    const m = k * k, Km = ellipticK(m);
    const pts = integrateElastica(s => 2 * k * ellipj(s, m).cn, -2*Km, 2*Km, 500);
    const x0 = pts[0].x, y0 = pts[0].y;
    const col = d3.interpolateBlues(0.4 + k * 0.4);
    g.append('path')
      .attr('d', d3.line().x(p => cx + (p.x - x0) * scale).y(p => cy - (p.y - y0) * scale)(pts))
      .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.8);
  });

  // Euler spiral (red)
  const eulerPts = integrateElastica(s => 2 / Math.cosh(s), -7, 7, 600);
  const ex0 = eulerPts[0].x, ey0 = eulerPts[0].y;
  g.append('path')
    .attr('d', d3.line().x(p => cx + (p.x - ex0) * scale).y(p => cy - (p.y - ey0) * scale)(eulerPts))
    .attr('fill', 'none').attr('stroke', '#c62828').attr('stroke-width', 2.4);

  // Start dot
  g.append('circle').attr('cx', cx).attr('cy', cy)
    .attr('r', 3.5).attr('fill', '#555');
}

// ── Init ─────────────────────────────────────────────────────────────────
function init() {
  drawElastica();
  drawPeriodPlot();
  drawPhasePortrait();
  drawFamilies();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
</script>
