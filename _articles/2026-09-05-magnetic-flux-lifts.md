---
layout: distill
title: "Growth Vectors and Caustics of Magnetic Flux Lifts"
subtitle: >
  The mathematical companion to "The Geometry of Forbidden Directions": complete statements
  and hypotheses, proofs where they exist, and the caustic identification stated as the open
  conjecture it is. The flag computation behind Q = d + k + 2, the proven elliptic reduction
  behind the period-average law δ(ε) = 1 − (2/π)K(2ε), a computation showing the coefficients
  read the profile of the field and not just its gradient, the saddle-node corollary — and an
  explicit ledger separating theorem, measurement, and conjecture.
date: 2026-09-05 09:00:00
categories: [articles]
tags: [sub-riemannian, magnetic-fields, growth-vector, conjugate-locus, elliptic-integrals, nilpotentization]
description: >
  Full derivations for the Forbidden Directions series: the magnetic flux lift as a central
  extension, the growth-vector lemma at an order-k zero of the field, the closed form
  δ(ε) = 1 − (2/π)K(2ε) with the Gauss-integral proof, the linear-profile computation showing
  the leading period-average coefficient is 3/2 rather than 1 (the caustic coefficient
  there is 7/4), and the rank-2 fold corollary.
permalink: /articles/magnetic-flux-lifts/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article is</div>
The blog series <em>The Geometry of Forbidden Directions</em> (Parts 1–8, Appendices D1–D5)
shows results and experiments; derivations there are compressed to what a post can carry.
This article is the uncompressed version: every statement the series relies on, written with
its hypotheses, its proof where one exists, and its open status where one does not. Nothing
here is new <em>relative to the series</em> except §4 — an investigation, prompted by the
question "is the coefficient 1 universal?", whose answer is <strong>no</strong> twice
over: the conjugate-time statistic reads the field's profile curvature, not just its
gradient (caustic law $c_2 = 1 - \tfrac34\beta$ — measured, then derived by exact
perturbation), and the general-profile
identification of the conjugate time with the orbital period is **refuted** — the
linear profile is a measured counterexample; equality, if valid, is an
exponential-specific property, and remains Conjecture A.
</div>

## 0. Notation and status ledger

Throughout, $d \in \{2,3\}$ is the spatial dimension, $A$ a smooth 1-form on
$\mathbb{R}^d$ (the vector potential), $F = dA$ the magnetic 2-form; in $d=2$ we write
$F = B\,dx\wedge dy$ for a scalar $B$, in $d=3$ the 2-form is identified with the vector
field $\mathbf B$ via $F = \iota_{\mathbf B}(dx\wedge dy\wedge dz)$. The **flux lift** is
the sub-Riemannian structure of §1. $K(k)$ is the complete elliptic integral of the first
kind in the **modulus** convention, $K(k) = \int_0^{\pi/2} (1-k^2\sin^2\phi)^{-1/2} d\phi$.

Every claim in this article carries one of four labels, and the whole ledger is collected
in §7:

- **Theorem/Lemma** — proved here, in full;
- **Computer-assisted** — derived by an exact symbolic computation whose identities are
  machine-generated; the inputs, the exact-vs-numerical boundary, and the resulting
  expressions are archived as a referee-checkable certificate
  (`artifacts/o6_certificate.json`), and a human-readable proof remains an open item
  where stated;
- **Measured** — a numerical result with stated precision and a reproduce path;
- **Conjecture/Open** — stated precisely, with what is known recorded next to what is not.

One further assurance layer: the **elementary load-bearing steps are machine-checked
in Lean 4 / mathlib** (`research/preferred-directions/lean/`, `lake build`, zero
`sorry`) — the homogeneous-Jacobian backbone of Proposition 4.2 (positivity before
$2\pi$, the simple zero, the $t^4/12$ small-time limit), the Lorentz sign identity of
Lemma 1.3, the tan-half-angle factorization of Theorem B, Corollary B2's subcritical
algebra, and the symmetric-spectrum core of the force-free theorem. The ledger
`lean/FORMAL.md` states exactly what each Lean theorem does and does **not** prove —
in particular, the elliptic average and the $\varepsilon$-perturbation certificate
are *not* formalized, and nothing below cites Lean beyond the ledger.

Two conventions attached to those labels. *Uncertainties:* every quoted band in this
article is a **numerical/fit sensitivity** (convergence shifts and fit-model spread),
not a sampling standard error — no probabilistic error model is claimed, and for the
astrophysical applications the field-model uncertainty dominates any root-position
precision. *Detection:* where the series reports a growth-vector value on data, it is
labelled at one of three levels — **blind detection** (location produced by the
sub-Riemannian statistic itself, with no root-finder or Jacobian input), **independent
local confirmation** (the statistic evaluated on the full field at a location another
method found), or **tangent-cone consistency check** (the structure built from the
measured Jacobian, which the flag lemma then fixes). Most of the series' planetary and
solar values are the second and third kind; none are blind detection.

## 1. The magnetic flux lift

**Definition 1.1.** Let $A = \sum_{i=1}^d A_i\,dx_i$ be a smooth 1-form on $\mathbb{R}^d$
with all $A_i$ independent of the extra variable $\varphi$. The *flux lift* is the manifold
$M = \mathbb{R}^d_x \times \mathbb{R}_\varphi$ with the rank-$d$ distribution and metric

$$
\mathcal D = \mathrm{span}\{X_1,\dots,X_d\},\qquad
X_i = \partial_{x_i} + A_i\,\partial_\varphi,
$$

the $X_i$ declared orthonormal. A horizontal path is a spatial path together with the
running line integral $\varphi(t) = \varphi(0) + \int A(\dot x)\,dt$; its length is its
spatial Euclidean length.

The brackets close on the fibre direction and encode exactly the field:

$$
[X_i, X_j] \;=\; \big(\partial_i A_j - \partial_j A_i\big)\,\partial_\varphi
\;=\; F_{ij}\,\partial_\varphi,
\qquad [X_i, \partial_\varphi] = 0 .
$$

**Remark 1.2 (provenance, gauge, and the fibre).** This is the standard
central-extension / prequantization construction (Kostant–Souriau), and as a
sub-Riemannian problem it is Montgomery's isoholonomic setting; nothing in Definition
1.1 is new — see §6 for the two closest prior works and the precise delimitation. A
gauge change $A \mapsto A + d\chi$ is implemented by the fibre shear $(x,\varphi)
\mapsto (x, \varphi + \chi(x))$, which is an isomorphism of sub-Riemannian structures —
so every metric quantity below depends on $F$ only, never on the choice of $A$. One
topological hypothesis is implicit and should be explicit: taking the fibre to be
$\mathbb R$ presumes a globally defined potential 1-form, i.e. $F$ exact — automatic on
$\mathbb R^d$, but on a multiply connected base or for non-exact $F$ the correct object
is a principal $U(1)$-bundle with connection, and every local statement below transfers
unchanged while global ones need the bundle language.

**Lemma 1.3 (reduction to the Lorentz force).** *Normal sub-Riemannian geodesics of the
flux lift project to solutions of the charged-particle equation. Precisely: the normal
Hamiltonian is $H = \tfrac12 \sum_i (p_i + w A_i)^2$ with $w := p_\varphi$ conserved, and
along its flow the spatial velocity $u_i = p_i + wA_i$ satisfies*

$$
\dot u_i \;=\; -\,w\,F_{ij}\,u_j
\qquad\text{(sum over } j\text{)},
$$

*i.e. $\ddot x = -\,w\,F(x)\,\dot x$: Larmor motion with charge-to-mass ratio $w$. In
$d=2$, where $F_{12} = B$, this reads $\ddot x = wB\,J\dot x$ with $J$ the
**counterclockwise** rotation by $\pi/2$ ($Je_1 = e_2$, $Je_2 = -e_1$): for $wB > 0$
the velocity turns counterclockwise at rate $wB$.*

*Proof.* $H = \tfrac12\sum_i \langle p, X_i\rangle^2 = \tfrac12\sum_i (p_i + A_i
p_\varphi)^2$. Since no $A_i$ depends on $\varphi$, $\dot p_\varphi = -\partial_\varphi H
= 0$, so $w = p_\varphi$ is constant. Hamilton's equations give $\dot x_i = u_i$ and
$\dot p_i = -\partial_{x_i} H = -\sum_j u_j\, w\,\partial_i A_j$, hence

$$
\dot u_i = \dot p_i + w \sum_j (\partial_j A_i)\,\dot x_j
= w\sum_j u_j\big(\partial_j A_i - \partial_i A_j\big)
= -\,w\sum_j F_{ij}\,u_j . \qquad\blacksquare
$$

(The sign is forced by the convention $F_{ij} = \partial_i A_j - \partial_j A_i$:
$\partial_j A_i - \partial_i A_j = -F_{ij}$. An earlier draft wrote $+wF_{ij}u_j$ here,
which is inconsistent with that convention; only the orientation of gyration changes,
and every launch-averaged quantity in §3–4 is orientation-blind. The identity — sum
algebra and the trajectory form — is now machine-checked:
`FDFormal.lorentz_force_reduction`.)

The conserved $w$ is the momentum conjugate to holonomy; $\lvert w\rvert$ sets the Larmor
radius $r_L = 1/(\lvert w\rvert\, \lvert B\rvert)$ at unit speed. Geodesics with $w = 0$
are straight lines; abnormal extremals are absent wherever $F \ne 0$ (the structure is
contact/quasi-contact there). At zeros of $F$ the abnormal story is classical and
load-bearing, not fine print: in the planar case the horizontal lift of a nondegenerate
zero curve of $B$ is a *strictly abnormal minimizer* — Montgomery's central example
(§6) — so any analysis of geodesics near the zero set, including the conjugate-time
statistics of §3–4 if they are ever pushed onto the null itself, must reckon with the
abnormal curve living there.

## 2. The growth vector at a zero of order $k$

**Definition 2.1 (order of a zero).** $F$ has a *zero of order $k \ge 1$* at
$q_0 \in \mathbb{R}^d$ if every partial derivative of every coefficient $F_{ij}$ of order
$\le k-1$ vanishes at $q_0$ and some derivative of order exactly $k$ does not. (Order $0$
means $F(q_0) \ne 0$. In $d = 2$ this is the jet of the scalar $B$; in $d = 3$, of the
vector field $\mathbf B$ componentwise.)

**Definition 2.2 (flag, growth vector, weights).** The flag of $\mathcal D$ is
$\mathcal D^1 = \mathcal D$, $\mathcal D^{s+1} = \mathcal D^s + [\mathcal D, \mathcal
D^s]$; the growth vector at $q$ is $(\dim \mathcal D^s(q))_s$. A point is *regular
(equiregular)* if the growth vector is locally constant, *singular* otherwise. Weights:
coordinate directions first reached at step $s$ carry weight $s$; the homogeneous
dimension of the nilpotent approximation at $q$ is the sum of weights,
$Q = \sum_i w_i$.

**Lemma 2.3 (the flag at an order-$k$ zero).** *Let $F$ have a zero of order $k$ at
$q_0$. Then, at $q_0$,*

$$
\mathcal D^s(q_0) = \mathcal D(q_0)\ \ (1 \le s \le k+1),
\qquad
\mathcal D^{k+2}(q_0) = T_{q_0}M ,
$$

*so the growth vector is $(d, d, \dots, d, d+1)$ with the jump at step $k+2$, the weights
are $(1,\dots,1,\,k+2)$, and*

$$
\boxed{\,Q \;=\; d + k + 2\,.}
$$

*Proof.* Two bracket identities do all the work. First, $[X_i, X_j] = F_{ij}
\partial_\varphi$ (§1). Second, for any function $g(x)$ independent of $\varphi$,

$$
[X_l,\; g\,\partial_\varphi] \;=\; (X_l\, g)\,\partial_\varphi
\;=\; (\partial_l g)\,\partial_\varphi ,
$$

because $\partial_\varphi g = 0$ and $[\,\cdot\,\partial_\varphi, \partial_\varphi] = 0$.
By induction, every iterated bracket of length $m \ge 2$ of the generators $X_i$ is of the
form $(\partial^\alpha F_{ij})\,\partial_\varphi$ with $\lvert\alpha\rvert = m - 2$, and
all such derivatives occur. Hence, as a distribution near $q_0$,

$$
\mathcal D^{s} \;=\; \mathcal D \;+\;
\mathrm{span}\big\{\, (\partial^\alpha F_{ij})(x)\,\partial_\varphi \;:\;
\lvert\alpha\rvert \le s-2 \,\big\},
\qquad s \ge 2 .
$$

Evaluate at $q_0$. For $s \le k+1$ every spanning coefficient is a derivative of $F$ of
order $\le k-1$, which vanishes by Definition 2.1 — so $\mathcal D^s(q_0)$ does not grow.
For $s = k+2$ some derivative of order $k$ is nonzero, so $\partial_\varphi \in \mathcal
D^{k+2}(q_0)$ and the flag is full. The $d$ spatial directions lie in $\mathcal D$ (weight
1); $\partial_\varphi$ is first reached at step $k+2$ (weight $k+2$); the weight sum is
$d + k + 2$. $\blacksquare$

Note what the proof does **not** need: no genericity of the $k$-jet beyond being nonzero,
and no isotropy — the field may vanish to different orders in different directions (the
fold of §5 does exactly this); the flag only asks for *some* surviving derivative at each
order. The familiar heuristic — a loop of size $r$ encloses area $r^2$ and catches flux
$r^k \cdot r^2$, so the holonomy coordinate has weight $k+2$ — is the geometric reading of
the same count.

**Corollary 2.4 (instantiations).**

<table style="width:100%; border-collapse:collapse; font-family:var(--sans,sans-serif); font-size:0.9rem; margin:1.2em 0 1.6em;">
  <thead>
    <tr style="border-bottom:2px solid var(--border,#e0e0e0);">
      <th style="text-align:left; padding:6px 10px;">$d$</th>
      <th style="text-align:left; padding:6px 10px;">$k$</th>
      <th style="text-align:left; padding:6px 10px;">$Q$</th>
      <th style="text-align:left; padding:6px 10px;">Structure</th>
      <th style="text-align:left; padding:6px 10px;">Genericity</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">2</td><td style="padding:6px 10px;">0</td><td style="padding:6px 10px;">4</td>
      <td style="padding:6px 10px;">Heisenberg group (contact)</td>
      <td style="padding:6px 10px;">generic point</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">2</td><td style="padding:6px 10px;">1</td><td style="padding:6px 10px;">5</td>
      <td style="padding:6px 10px;">flat Martinet structure (Prop. 2.5)</td>
      <td style="padding:6px 10px;">generic zero curve of a scalar $B$</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">2</td><td style="padding:6px 10px;">$k\ge2$</td><td style="padding:6px 10px;">$k+4$</td>
      <td style="padding:6px 10px;">higher Martinet family</td>
      <td style="padding:6px 10px;">constructed, non-generic</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">3</td><td style="padding:6px 10px;">0</td><td style="padding:6px 10px;">5</td>
      <td style="padding:6px 10px;">quasi-contact ($\mathbf B \ne 0$)</td>
      <td style="padding:6px 10px;">generic point</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;">3</td><td style="padding:6px 10px;">1</td><td style="padding:6px 10px;">6</td>
      <td style="padding:6px 10px;">transverse magnetic null</td>
      <td style="padding:6px 10px;">generic null of $\mathbf B$</td>
    </tr>
  </tbody>
</table>

**Proposition 2.5 (the $k=1$ lift is Martinet).** *In $d = 2$ take $B = -y$ (a transverse
linear zero along $\{y = 0\}$) with gauge $A = \tfrac12 y^2\,dx$. Then $\mathcal D =
\ker\big(d\varphi - \tfrac12 y^2\,dx\big)$ with orthonormal frame $X_1 = \partial_x +
\tfrac12 y^2 \partial_\varphi$, $X_2 = \partial_y$: the flat Martinet structure, with
singular locus the plane $\{y = 0\}$ — which is exactly the zero set of the field.* More
generally $A = \tfrac{y^{k+1}}{k+1}dx$ gives $B = -y^k$ and the higher Martinet family
$\ker\big(d\varphi - \tfrac{y^{k+1}}{k+1}dx\big)$. *Proof:* compute $dA = y\,dy\wedge dx$
(respectively $y^k dy\wedge dx$) and compare frames. $\blacksquare$

So the series' central law is, for $d=2$, $k=1$, literally the Martinet growth vector
$(2,2,3)$ — the law's content is the general-$k$, general-$d$ dictionary and the fact that
the *field's jet* is the only input.

**Remark 2.6 (the zero is a singular point; what $Q$ does and does not assert).** Points
with $F(q) \ne 0$ are regular; an order-$k$ zero is a singular point of the flag — the
growth vector jumps there. At singular points the clean equivalence "$Q$ = volume growth
exponent of small balls" is *not* automatic: Mitchell's theorem and the ball–box estimates
are equiregular statements, and Hausdorff volume at non-equiregular points has its own
literature (Ghezzi–Jean). What Lemma 2.3 licenses at the zero itself is the *nilpotent
approximation*: in privileged coordinates the lift is approximated by its weighted
principal part — the system $\dot x = u$, $\dot\varphi = \hat A(x)\,u$ with $\hat A$ the
weight-$(k+1)$ part of $A$ — which is invariant under the anisotropic dilations
$\delta_r(x, \varphi) = (r x,\, r^{k+2}\varphi)$, and $Q = d+k+2$ is the homogeneous
dimension of that dilation structure. The series' numerical "reach exponents" probe
exactly these dilation weights (per-coordinate reach of the endpoint map at radius $r$),
not a volume theorem. Proving the volume statement at the null — or exhibiting a
correction to it — is **Open problem O1**, and Ghezzi–Jean's machinery is the natural
tool.

**Proposition 2.7 (what the reach estimator estimates).** *Let $q_0$ satisfy the
hypotheses of Lemma 2.3, fix privileged (adapted) coordinates $u_1, \dots, u_{d+1}$ at
$q_0$, and define the per-coordinate reach*

$$
R_i(r) \;=\; \sup\big\{\, \lvert u_i(\gamma(T))\rvert \;:\; \gamma \text{ horizontal},\
\gamma(0) = q_0,\ \mathrm{length}(\gamma) \le r \,\big\}.
$$

*Then there exist constants $0 < c \le C$ (depending on the jet of $F$ at $q_0$) such
that for all sufficiently small $r$,*

$$
c\, r^{w_i} \;\le\; R_i(r) \;\le\; C\, r^{w_i},
$$

*with $(w_i) = (1, \dots, 1, k+2)$ the weights of Lemma 2.3. Consequently the two-point
log–log slope over a window $[r_1, r_2]$ satisfies*

$$
\frac{\log R_i(r_2) - \log R_i(r_1)}{\log r_2 - \log r_1}
\;=\; w_i \;+\; O\!\Big(\frac{\log(C/c)}{\log(r_2/r_1)}\Big):
$$

*the estimator converges to the dilation weight of the nilpotent approximation as the
window widens, with an explicit $O(1/\log(r_2/r_1))$ window bias — and it does not
estimate a ball-volume exponent (that is Open problem O1, unchanged).*

*Proof sketch.* Upper bound: by the first-order approximation theorem in privileged
coordinates (Bellaïche; Jean, Thm. 2.2-type), the endpoint of any horizontal $\gamma$
of length $\le r$ differs from the endpoint of the corresponding nilpotentized flow by
$O(r^{w_i+1})$ in the $i$-th coordinate, and the nilpotent system is
$\delta_\lambda$-homogeneous, so its reach is exactly proportional to $r^{w_i}$.
Lower bound: push the nilpotent extremizer back through the same approximation. The
constants are not tracked here; the statement is a proposition with a sketch, not a
numbered theorem of this article. $\square$

Two honest riders for the *sampled* estimator used by the series (Part 4's parameter
box). (i) *Sampling*: the measured quantity is a high percentile over $n$ random
horizontal curves, not the sup; the bounds transfer with modified constants provided
the curve family achieves a fixed fraction of each sup — true for the family used
(straight segments realise the spatial sup exactly; arcs with curvature $\sim 1/r$
realise the flux sup's order). (ii) *Noise and grid*: on gridded or noisy data the
admissible window $[r_1, r_2]$ is bounded below by the resolution/noise floor and
above by the distance to neighbouring structure — Part 4's scale-window rule is
exactly the operational form of the window-bias term above.

**Remark 2.8 (positioning).** Given Bellaïche's weights and Jean's normal forms, Lemma 2.3
is an exercise — the referee's reading of the series ("a direct corollary of
Bellaïche/Mitchell/Jean; $k=1$ is Martinet") is accepted here, and Proposition 2.5 makes
the Martinet identification exact rather than analogical. What the series adds is not the
flag count but (i) the dictionary from *field jets* to weights with the null as the
physically occurring singular point, (ii) the measured instantiations of Corollary 2.4 on
synthetic, solar, magnetospheric and Jovian fields, and (iii) the fold refinement of §5.

## 3. The conjugate-time law for an exponential profile

### 3.1 The statistic

Fix $d = 2$ and the profile $B(x,y) = B_0 e^{gx}$, so $\nabla \ln B = g$ exactly. For a
launch point $q_0$, launch angle $\theta_0$ and fibre momentum $w$, let
$t_c(\theta_0, w)$ be the first conjugate time along the corresponding normal geodesic
(first zero of the Jacobian of the sub-Riemannian exponential map — the caustic time).
The *nilpotent deviation* is the launch-averaged fractional delay against the Larmor clock:

$$
\delta \;=\; \Big\langle\, 1 - \tfrac{\lvert w\rvert B_0}{2\pi}\, t_c(\theta_0, w)
\,\Big\rangle_{\theta_0},
$$

with $\langle\cdot\rangle_{\theta_0}$ the uniform average over $[0, 2\pi)$. In the
homogeneous (nilpotent) model the conjugate time is exactly one Larmor period, so
$\delta \equiv 0$; $\delta$ measures the field's inhomogeneity as seen by the caustic.

**Remark 3.0 (physical scope).** Everything in §§3–4 is a statement about the normal
geodesic flow of the flux lift — equivalently, by Lemma 1.3, about the exact orbits of
a non-relativistic test particle in a **static** magnetic field with **no electric
field**, no collisions, and no radiation reaction; the gyration is exact, not
gyro-averaged. Dimensionally: restoring units, $r_L = mv_\perp/(qB_0)$ is the Larmor
radius, the conserved fibre momentum $w$ plays the charge-to-mass ratio after
nondimensionalisation, $\varepsilon = \lvert\nabla\ln B\rvert\,r_L$ and $\delta$ are
dimensionless. **No measurement-feasibility claim is made**: how an experiment or an
in-situ instrument would estimate $\delta$, at what signal-to-noise, and in which
plasma regime the static test-particle idealisation holds, is an analysis this article
has not performed — the statistic is here a property of the model flow, and any
observational use inherits the full uncertainty of the field model it is applied to
(§0's convention).

### 3.2 Dilation collapse to one variable

**Proposition 3.1.** *$t_c = r_L\, F(\theta_0, \varepsilon)$ for a universal function
$F$ of the launch angle and the single dimensionless group*

$$
\varepsilon \;=\; g\, r_L \;=\; \lvert\nabla \ln B\rvert \cdot r_L ,
\qquad r_L = \frac{1}{B_0 \lvert w \rvert},
$$

*hence the launch average $\delta = G(\varepsilon)$ depends on $(g, B_0, w)$ only
through $\varepsilon$. Convention: $g \ge 0$ throughout — the reflection $x \mapsto -x$,
$\theta \mapsto \pi - \theta$ maps $g \mapsto -g$ while permuting launch angles, so the
launch-averaged statistic is even in $g$.*

*Proof.* Rescale $X = x/r_L$, $Y = y/r_L$, $\tau = t/r_L$ in Lemma 1.3's equations with
$B = B_0 e^{gx}$: unit-speed motion with heading $\theta$ obeys

$$
\frac{dX}{d\tau} = \cos\theta,\qquad
\frac{dY}{d\tau} = \sin\theta,\qquad
\frac{d\theta}{d\tau} = e^{\varepsilon X}
$$

(after translating the launch point to $X=0$ and absorbing signs into orientation). All
three parameters enter only through $\varepsilon$; conjugate times of a rescaled flow
rescale by $r_L$. $\blacksquare$

### 3.3 First integral and the period

Along the reduced flow, $\tfrac{d}{d\tau} e^{\varepsilon X} = \varepsilon \cos\theta\,
e^{\varepsilon X}$ and $\dot\theta = e^{\varepsilon X}$ give
$\tfrac{d\dot\theta}{d\theta} = \varepsilon\cos\theta$, so with $\dot\theta(0) = 1$:

$$
\dot\theta \;=\; E + \varepsilon\sin\theta,
\qquad E := 1 - \varepsilon \sin\theta_0
\quad\text{(first integral: } e^{\varepsilon X} = E + \varepsilon\sin\theta\text{)} .
$$

The heading is monotone for $\varepsilon < 1/2$ (indeed
$\dot\theta \ge E - \varepsilon > 0$), so the *$\theta$-period* — the time for the
heading to advance by $2\pi$ — is

$$
T(\theta_0)
= \int_0^{2\pi}\!\! \frac{d\theta}{E + \varepsilon\sin\theta}
= \frac{2\pi}{\sqrt{E^2 - \varepsilon^2}}
= \frac{2\pi}{\sqrt{(1-\varepsilon\sin\theta_0)^2 - \varepsilon^2}},
$$

the middle equality being the standard Poisson-kernel integral (or the $t =
\tan(\theta/2)$ substitution of §3.5 applied to the first power).

### 3.4 Conjecture A: the conjugate time is the period

**Conjecture A (identification; numerically established, proof open).**
*$t_c(\theta_0) = T(\theta_0)$ for all $\theta_0$ and all $\varepsilon < 1/2$.*

Status and structure — what is proved, exactly:

1. **Orbit closure (proved).** At $t = T$ the heading has advanced by $2\pi$ and, by the
   first integral, $e^{\varepsilon X}$ returns to its initial value, so $X(T) = X(0) = 0$:
   the reduced $(X,\theta)$ orbit closes exactly.
2. **$E$-collapse of the endpoint (proved).** The remaining endpoint components at the
   period are single-period $\theta$-integrals:
   $\Delta Y = \int_0^{2\pi} \tfrac{\sin\theta\, d\theta}{E+\varepsilon\sin\theta}$, a
   function of $E$ alone; and in the gauge $A = \varepsilon^{-1}e^{\varepsilon X}dY$
   (which has $dA = e^{\varepsilon X}dX\wedge dY$), using $e^{\varepsilon X} =
   \dot\theta$,
   $\Delta \varphi = \varepsilon^{-1}\!\int e^{\varepsilon X}\dot Y\,d\tau =
   \varepsilon^{-1}\!\int_0^{2\pi}\sin\theta\,d\theta = 0$ — constant, a fortiori a
   function of $E$ alone. So the endpoint of each geodesic *at its own period*, together
   with the period $T(E)$ itself, depends on the launch angle only through the one number
   $E(\theta_0)$.
3. **The gap.** Consequently the $\theta_0$-variation of the endpoint at the frozen time
   $t = T(\theta_0^\ast)$ is the single vector
   $\big[\partial_E(\text{endpoint}) - T'(E)\,\dot\gamma\big]\, E'(\theta_0)$. The
   Jacobian of the exponential map at $t = T$ vanishes iff this vector is linearly
   dependent with $\{\partial_w \gamma,\ \dot\gamma\}$ — a $3\times3$ determinant identity
   in explicit one-period $\theta$-integrals that has been verified to $10^{-8}$ across
   the tested $\varepsilon$ range but not yet proved. Because the variational system of
   the reduced flow integrates by quadratures ($\partial\theta/\partial\theta_0$ solves a
   first-order linear ODE along the orbit), the missing step is a finite computation with
   elementary integrands; it is **Open problem O2**, and the sharpest single gap in the
   series' chain.
4. **A measured counterexample delimits any proof (V1, §4).** Orbit closure (step 1) and
   the $E$-collapse (step 2) hold *verbatim* for the linear profile $B = B_0(1+gx)$ —
   its first integral $\dot\theta^2 = 1 + 2\varepsilon(\sin\theta - \sin\theta_0)$ closes
   the $(X,\theta)$ orbit and collapses the endpoint onto $\sin\theta_0$ — and yet there
   the identity is **false**: the Jacobian pipeline measures
   $\max_{\theta_0}\lvert t_c/T - 1\rvert \propto \varepsilon^2$ (reaching $1.2\times
   10^{-2}$ at $\varepsilon = 0.15$, against $10^{-8}$ for the exponential profile). So
   Conjecture A, if valid, is an exponential-specific property, and no argument built
   from closure and $E$-collapse alone can prove it — the proof, if it exists, must use
   whatever makes the exponential exceptional (its period integrand is the Poisson
   kernel $(1+\varepsilon u)^{-1}$, the $n\to\infty$ member of the power family of §4).

Everything in §3.5–§3.6 is a theorem about the *period average*; its reading as a
statement about the *caustic* is conditional on Conjecture A.

### 3.5 Theorem B: the elliptic reduction (proved)

**Theorem B.** *For $0 \le \varepsilon < \tfrac12$,*

$$
\frac{1}{2\pi}\int_0^{2\pi} \frac{d\theta_0}{\sqrt{(1-\varepsilon\sin\theta_0)^2 -
\varepsilon^2}} \;=\; \frac{2}{\pi} K(2\varepsilon),
$$

*hence the period-averaged deviation is exactly*

$$
\boxed{\;\delta(\varepsilon) \;=\; 1 - \frac{2}{\pi} K(2\varepsilon),
\qquad 0 \le \varepsilon < \tfrac12 .\;}
$$

*Proof.* Write the average as $\tfrac{1}{2\pi} I$ with
$I = \int_0^{2\pi} \big[(1-\varepsilon\sin\theta_0)^2-\varepsilon^2\big]^{-1/2}
d\theta_0$. The substitution $\theta_0 = \psi + \tfrac{\pi}{2}$ (periodicity) turns
$\sin\theta_0$ into $\cos\psi$:

$$
I = \int_0^{2\pi} \frac{d\psi}{\sqrt{(1-\varepsilon\cos\psi)^2 - \varepsilon^2}} .
$$

Substitute $t = \tan(\psi/2)$, so $\cos\psi = \tfrac{1-t^2}{1+t^2}$, $d\psi =
\tfrac{2\,dt}{1+t^2}$, and the half-period $\psi \in (0,\pi)$ maps to $t \in (0,\infty)$.
The radicand factorises exactly — compute each factor over the common denominator
$1+t^2$:

$$
1 - \varepsilon\cos\psi - \varepsilon
= \frac{(1+t^2) - \varepsilon(1-t^2) - \varepsilon(1+t^2)}{1+t^2}
= \frac{t^2 + (1-2\varepsilon)}{1+t^2},
$$

$$
1 - \varepsilon\cos\psi + \varepsilon
= \frac{(1+t^2) - \varepsilon(1-t^2) + \varepsilon(1+t^2)}{1+t^2}
= \frac{1 + (1+2\varepsilon)\,t^2}{1+t^2},
$$

so with $p^2 = 1-2\varepsilon$, $q^2 = 1+2\varepsilon$:

$$
I = 2\int_0^{\pi}\frac{d\psi}{\sqrt{\cdots}}
= 4\int_0^\infty \frac{dt}{\sqrt{(t^2+p^2)(1+q^2t^2)}}
= \frac{4}{q}\int_0^\infty \frac{dt}{\sqrt{(t^2+p^2)\,(t^2+q^{-2})}} .
$$

Gauss's integral evaluates the last expression. For $a \ge b > 0$, the substitution
$t = b\tan\phi$ gives

$$
\int_0^\infty \frac{dt}{\sqrt{(t^2+a^2)(t^2+b^2)}}
= \int_0^{\pi/2} \frac{d\phi}{\sqrt{a^2\cos^2\phi + b^2\sin^2\phi}}
= \frac{1}{a}\,K(k), \qquad k^2 = 1-\frac{b^2}{a^2}
$$

(equivalently $\pi / 2\,\mathrm{AGM}(a,b)$ — this is the arithmetic–geometric mean).
Here $a = q^{-1}$, $b = p$ — the ordering check: $a^2 - b^2 = \tfrac{1-(1-2\varepsilon)
(1+2\varepsilon)}{1+2\varepsilon} = \tfrac{4\varepsilon^2}{1+2\varepsilon} \ge 0$. The
modulus collapses:

$$
k^2 = 1 - p^2 q^2 = 1 - (1-2\varepsilon)(1+2\varepsilon) = 4\varepsilon^2,
\qquad k = 2\varepsilon,
$$

and the prefactor cancels: $\tfrac{4}{q}\cdot\tfrac{1}{a} K = \tfrac{4}{q}\cdot q\,K =
4K(2\varepsilon)$. Hence $I = 4K(2\varepsilon)$ and the average is
$\tfrac{2}{\pi}K(2\varepsilon)$. The domain is visible in the factorisation: $p^2 =
1-2\varepsilon > 0$ requires $\varepsilon < \tfrac12$. $\blacksquare$

### 3.6 Corollaries: the coefficients, and the critical gradient

**Corollary B1 (the series).** From $K(k) = \tfrac{\pi}{2}\sum_{m\ge0}
\big[\tbinom{2m}{m} 4^{-m}\big]^2 k^{2m}$ and $k = 2\varepsilon$:

$$
-\delta \;=\; \sum_{m\ge1}\Big[\tbinom{2m}{m} 2^{-m}\Big]^2 \varepsilon^{2m}
\;=\; \varepsilon^2 + \tfrac94\,\varepsilon^4 + \tfrac{25}{4}\,\varepsilon^6
+ \tfrac{1225}{64}\,\varepsilon^8 + \cdots
$$

— squared normalised central binomial coefficients. In particular $c_2 = 1$, $c_4 =
\tfrac94$, $c_6 = \tfrac{25}{4}$ are corollaries of Theorem B (as period-average
statements; as caustic statements, conditional on Conjecture A). The measured values —
$c_2 = 0.9996$, $c_4 = 2.2497 \pm 0.0009$ from the precision pipeline, and full-curve
agreement with $1-\tfrac{2}{\pi}K(2\varepsilon)$ to $10^{-10}$ over $\varepsilon \in
[0.05, 0.45]$ — are independent confirmations, and simultaneously the numerical evidence
for Conjecture A.

**Corollary B2 (critical gradient).** $K(k)$ diverges (logarithmically) as $k \to 1^-$;
hence the mean period diverges as $\varepsilon \to \tfrac12^-$. Per launch angle,
$T(\theta_0) < \infty$ requires $E > \varepsilon$, i.e. $\varepsilon(1 + \sin\theta_0) <
1$; the slowest launch $\theta_0 = \pi/2$ loses its period exactly at $\varepsilon =
\tfrac12$. The correct physical reading is therefore *per launch band*, not "the beam
stops refocusing": measured directly (`run_r6_supercritical.py`), above the critical
gradient exactly the band $\sin\theta_0 \ge (1-\varepsilon)/\varepsilon$ shows **no
conjugate point within the integration window** of eight reference Larmor periods
($9/64$ launch angles at $\varepsilon = 0.52$, $13/64$ at $0.55$, with deep
$\lvert J\rvert$ dips but no sign change in the window) — finite-horizon evidence, not
a proof that those geodesics have no later or even-multiplicity conjugate point — while
*every* angle that keeps a finite period also keeps a conjugate point equal to it —
$t_c = T$ to $5\times10^{-5}$ at $\varepsilon = 0.52$–$0.55$. What diverges at
$\varepsilon = \tfrac12$ *as a theorem* is the launch-averaged **period**; that the
launch-averaged *refocusing* time diverges with it is exactly Conjecture A's reading
(numerically supported, unproven), and refocusing itself survives outside the critical
band. (This also extends Conjecture A's numerical support
beyond the domain of the $K$-formula itself. And the same probe answers the
even-multiplicity worry about the sign-change detector: the $\lvert J\rvert$-dip guard
runs clean *below* the critical gradient — zero suspects at $\varepsilon = 0.45$ and
$0.48$ across all 64 angles — so no grazing Jacobian zeros are being missed in the
verified range.)

## 4. The coefficients read the profile, not just the gradient

Is $c_2 = 1$ universal — does the leading deviation measure $\lvert\nabla\ln B\rvert$
regardless of profile? The series implicitly calibrated its inversion
$\lvert\nabla\ln B\rvert = \sqrt{\lvert\delta\rvert}/r_L$ on the exponential profile. The
answer, at the level of the period average, is **no** — and the failure is clean enough
to be a feature.

**Proposition 4.1 (general profile, leading order).** *Let $B(x) = B_0 e^{L(x)}$ with
$L(0) = 0$, launch at $x = 0$, and set*

$$
\varepsilon = L'(0)\,r_L, \qquad
\beta = \frac{L''(0)}{L'(0)^2}
$$

*(the dimensionless profile curvature; $\beta = 0$ for the exponential profile, $\beta =
-1$ for the linear profile $B = B_0(1+gx)$). Then the period-averaged deviation obeys*

$$
\delta \;=\; -\Big(1 - \frac{\beta}{2}\Big)\,\varepsilon^2 \;+\; O(\varepsilon^3) .
$$

*Proof.* In rescaled variables the reduced flow is $\dot X = \cos\theta$, $\dot\theta =
f(X) := e^{\Lambda(X)}$ with $\Lambda(X) = \varepsilon X + \tfrac{\beta}{2}\varepsilon^2
X^2 + O(\varepsilon^3 X^3)$. The planar $(X, \theta)$ system is separable: dividing the
two equations, $\tfrac{dX}{d\theta} = \cos\theta / f(X)$, so $f(X)\,dX =
\cos\theta\,d\theta$ and the orbit is

$$
\mathcal F(X) := \int_0^X f \;=\; \sin\theta - \sin\theta_0 \;=:\; u .
$$

Invert order by order: $\mathcal F(X) = X + \tfrac{\varepsilon}{2}X^2 +
O(\varepsilon^2X^3)$ gives $X(u) = u - \tfrac{\varepsilon}{2}u^2 + O(\varepsilon^2 u^3)$.
The period is

$$
T(\theta_0) = \int_0^{2\pi} \frac{d\theta}{f(X(\theta))}
= \int_0^{2\pi} e^{-\Lambda(X(u(\theta)))}\, d\theta ,
$$

and expanding to second order,

$$
e^{-\Lambda(X)} = 1 - \varepsilon X + \tfrac{1-\beta}{2}\varepsilon^2 X^2
+ O(\varepsilon^3)
\;=\; 1 - \varepsilon u + \Big(\tfrac12 + \tfrac{1-\beta}{2}\Big)\varepsilon^2 u^2
+ O(\varepsilon^3),
$$

using $-\varepsilon X = -\varepsilon u + \tfrac{\varepsilon^2}{2}u^2 + O(\varepsilon^3)$.
Average over $\theta$ (the period integral) and over the launch $\theta_0$: with $u =
\sin\theta - \sin\theta_0$ and the two angles independent and uniform,
$\langle u\rangle = 0$ and $\langle u^2\rangle = \langle\sin^2\theta\rangle +
\langle\sin^2\theta_0\rangle = 1$. Hence

$$
\frac{\langle T\rangle}{2\pi} = 1 + \Big(1 - \frac{\beta}{2}\Big)\varepsilon^2
+ O(\varepsilon^3)
\quad\Longrightarrow\quad
\delta = -\Big(1 - \frac{\beta}{2}\Big)\varepsilon^2 + O(\varepsilon^3).
\qquad\blacksquare
$$

*(Remainder honesty: the displayed computation controls only $O(\varepsilon^3)$. The
cubic term vanishes exactly for the two families computed below — by the closed form
for the exponential, by odd moments for the linear — and the numerics are consistent
with even parity in general, but the general-profile parity argument, which must
transform all profile jets under the reflection rather than import the exponential
family's symmetry, has not been written; it is folded into Open problem O6.)*

**Worked check (linear profile, exact first integral).** For $B = B_0(1+gx)$ the reduced
flow has $f(X) = 1 + \varepsilon X$, and $\tfrac{d\dot\theta}{d\tau} =
\varepsilon\cos\theta$ integrates exactly to $\dot\theta = \sqrt{1 +
2\varepsilon(\sin\theta - \sin\theta_0)}$. Expanding the period integrand
$[1+2\varepsilon u]^{-1/2} = 1 - \varepsilon u + \tfrac32\varepsilon^2u^2 -
\tfrac52\varepsilon^3u^3 + \tfrac{35}{8}\varepsilon^4u^4 - \cdots$ and using the moments
$\langle u^2\rangle = 1$, $\langle u^3\rangle = 0$, $\langle u^4\rangle = \tfrac{9}{4}$:

$$
\delta_{\mathrm{lin}} \;=\; -\frac32\,\varepsilon^2 \;-\; \frac{315}{32}\,\varepsilon^4
\;-\;\cdots
$$

— consistent with Proposition 4.1 at $\beta = -1$, and *incompatible* with the
exponential curve at leading order.

**Numerical check (period average).** Solving the reduced flow's period directly
(`run_t4_beta_period_check.py`): at $\varepsilon = 0.02$ the measured
$-\delta/\varepsilon^2$ is $1.0009,\ 1.5029,\ 0.4994,\ -0.0015,\ 2.0054$ for $\beta = 0,
-1, +1, +2, -2$ against the predicted $1, \tfrac32, \tfrac12, 0, 2$; the exact linear
profile matches $\tfrac32\varepsilon^2 + \tfrac{315}{32}\varepsilon^4$ to a ratio of
$1.00001$ at $\varepsilon = 0.02$; and the exponential control reproduces
$1-\tfrac{2}{\pi}K(2\varepsilon)$ to ten digits. Note the $\beta = 2$ row: the profile
$B = B_0(1-2gx)^{-1/2}$ (which solves $L'' = 2L'^2$) has **vanishing leading
*period-average* deviation** — the cleanest demonstration that the statistic is not a
gradient meter. (Careful with the scope: this blindness belongs to the period average.
The *caustic* law measured below, $c_2 = 1-\tfrac34\beta$, gives $-\tfrac12$ at $\beta
= 2$ — a sign flip, i.e. a predicted *accelerated* refocusing there, untested; and
Proposition 4.2 places the leading-order caustic-blind jet at $\beta = \tfrac43$ — a
consequence of the one-dimensional derivation, **tested**: running the power-family
profile $n = -\tfrac34$ ($\beta = \tfrac43$, exact potential) through the same
conjugate-point pipeline (`run_f2_beta43_blind.py`, pre-registered rule) returns
$c_2 = (-0.7 \pm 1.4)\times 10^{-5}$ — consistent with zero exactly where the law
predicts cancellation, while the *period average* there is $\tfrac13$:
the sharpest period-vs-caustic split measured, at the law's most falsifiable point.)

**V1: the caustic is not the period average.** The natural next question — does the
*actual* conjugate-point pipeline (Jacobian zeros, no period shortcut) measure
$c_2 = 1-\beta/2$? — was pre-registered as V1 with the prediction $c_2 = \tfrac32$ for
the linear profile, and the prediction is **refuted**, informatively. Running
`run_v1_linear_profile.py` on the power family $B = B_0(1+gx)^n$ (whose members have
$\beta = -1/n$ and period integrand $(1 + \tfrac{n+1}{n}\varepsilon u)^{-n/(n+1)}$,
$u = \sin\theta - \sin\theta_0$; the exponential profile is $n \to \infty$):

<table style="width:100%; border-collapse:collapse; font-family:var(--sans,sans-serif); font-size:0.88rem; margin:1.2em 0 1.6em;">
  <thead>
    <tr style="border-bottom:2px solid var(--border,#e0e0e0);">
      <th style="text-align:left; padding:6px 10px;">Profile</th>
      <th style="text-align:left; padding:6px 10px;">$\beta$</th>
      <th style="text-align:left; padding:6px 10px;">period-avg $c_2 = 1-\tfrac{\beta}{2}$</th>
      <th style="text-align:left; padding:6px 10px;">caustic $c_2$ (measured)</th>
      <th style="text-align:left; padding:6px 10px;">$1-\tfrac34\beta$</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">exponential ($n=\infty$)</td>
      <td style="padding:6px 10px;">$0$</td>
      <td style="padding:6px 10px;">$1$</td>
      <td style="padding:6px 10px;">$0.9996$ (Part 3)</td>
      <td style="padding:6px 10px;">$1$</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">quadratic ($n=2$)</td>
      <td style="padding:6px 10px;">$-\tfrac12$</td>
      <td style="padding:6px 10px;">$\tfrac54 = 1.25$</td>
      <td style="padding:6px 10px;">$1.3741 \pm 0.0019$</td>
      <td style="padding:6px 10px;">$\tfrac{11}{8} = 1.375$</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;">linear ($n=1$)</td>
      <td style="padding:6px 10px;">$-1$</td>
      <td style="padding:6px 10px;">$\tfrac32 = 1.5$</td>
      <td style="padding:6px 10px;">$1.7466 \pm 0.0074$</td>
      <td style="padding:6px 10px;">$\tfrac74 = 1.75$</td>
    </tr>
  </tbody>
</table>

Three measured facts. **(a)** The caustic $c_2$ differs from the period-average $c_2$
whenever $\beta \ne 0$: the conjugate time is *not* the $\theta$-period off the
exponential profile — measured directly as $\max_{\theta_0}\lvert t_c/T-1\rvert \propto
\varepsilon^2$, roughly proportional to $\lvert\beta\rvert$ ($1.2\times10^{-2}$ vs
$5.7\times10^{-3}$ at $\varepsilon = 0.15$ for $n = 1, 2$), vanishing on the exponential
($10^{-8}$). **(b)** Both measured caustic values land on the one-parameter law

$$
c_2^{\mathrm{caustic}} \;=\; 1 - \tfrac34\,\beta
$$

within the quoted sensitivity bands (about half a band at each point), while the
alternative "period value plus $\tfrac14\beta^2$" misses the $n=2$ point by $0.062$ —
some thirty times that band. (The bands are fit-model spread plus resolution shift, not
sampling errors; see §0.)

**Proposition 4.2 (the caustic coefficient; computer-assisted derivation).** *Let $B(x) = B_0\,e^{L(x)}$ be
a **one-dimensional** profile, $L$ sufficiently smooth near the launch point ($C^6$
suffices — no analyticity is assumed; window (i) of the proof) with $L'(0) \ne 0$, and
let $(\varepsilon, \beta)$ be the normalized jets of Proposition 4.1, the higher
normalized jets ranging over a fixed bounded family as $\varepsilon \to 0$ — this is
the meaning of "bounded jets" here: the limit holds the normalized profile fixed
($L''(0) = \beta\,L'(0)^2$, and so on up the jet) while $\varepsilon$ shrinks. Then for
all sufficiently small $\varepsilon$ the first conjugate time satisfies*

$$
t_c(\theta_0) \;=\; 2\pi\Big(1 + \varepsilon \sin\theta_0\Big) + O(\varepsilon^2)
\quad\text{per angle},
\qquad
\delta \;=\; -\Big(1 - \frac34\,\beta\Big)\,\varepsilon^2 \;+\; O(\varepsilon^3)
\quad\text{on average}.
$$

*Proof (computer-assisted exact perturbation; `run_o6_caustic_c2.py`).* Solve the flow
$\dot x = \cos\theta$, $\dot y = \sin\theta$, $\dot\theta = (1+h)e^{L(x)}$,
$\dot\varphi = A(x)\sin\theta$ as a joint series in $(\varepsilon, h)$ through order
$\varepsilon^2 h$ — every coefficient is an explicitly integrable trigonometric
polynomial, and the $h$-direction supplies the $\partial_w$ column of the Jacobian.
Expanding $J = J_0 + \varepsilon J_1 + \varepsilon^2 J_2$ about the unperturbed simple
zero ($J_0(2\pi) = 0$, $J_0'(2\pi) = -2\pi$) gives $t_c = 2\pi + \varepsilon\tau_1 +
\varepsilon^2\tau_2$ with $\tau_1(\theta_0) = 2\pi\sin\theta_0$ (odd — its average
vanishes, proving the first-order parity at the caustic) and the launch average of
$\tau_2$ evaluating **symbolically** to $2\pi\,(1 - \tfrac34\beta)$. The quadrature
cross-check agrees to $2\times10^{-16}$ at $\beta = 0, \pm\tfrac12$-scale values, and
the V1 pipeline's independently measured $1.7466 \pm 0.0074$ ($\beta=-1$) and $1.3741
\pm 0.0019$ ($\beta=-\tfrac12$) are confirmations.

*Why the continued root is the **first** conjugate root.* The perturbation by itself
only constructs the root that continues from the homogeneous first zero; that it is
the first for small $\varepsilon$ needs three windows. (The homogeneous inputs to all
three are machine-checked: `FDFormal.J0_pos`, `J0_two_pi`, `deriv_J0_two_pi`,
`J0_div_pow_four_tendsto` — see `lean/FORMAL.md` for what those statements do and do
not cover.) (i) *Short times.* Smooth dependence on $\varepsilon$ alone would **not**
suffice here: a smooth family like $t^4/12 - \varepsilon t^3$ has the correct
$\varepsilon = 0$ limit yet a positive root tending to $0$ — the re-review's
counterexample. What holds is stronger and structural. The endpoint variations obey,
in $(x, y, \varphi)$-components,

$$
\partial_{\theta_0} = \big(O(t),\, O(t),\, O(t^2)\big),\qquad
\partial_{h} = \big(O(t^2),\, O(t^2),\, O(t^3)\big),\qquad
\partial_{t} = \big(O(1),\, O(1),\, O(t)\big),
$$

the $\varphi$-component always one order higher than its $(x,y)$ partners because
$A(0) = 0$ (the launch gauge). Every determinant term takes one entry per column and
uses the $\varphi$-row exactly once — one extra order — so **every term is $O(t^4)$**,
for every profile and every $h$: the first four Taylor coefficients of $J$ in $t$
vanish identically. Finite regularity then suffices for the factorization — no
analyticity is invoked. Writing $p = (\varepsilon, \theta_0)$, the fourth-order Taylor
formula with integral remainder gives

$$
J(t;\, p) \;=\; t^{4}\cdot\frac{1}{3!}\int_0^1 (1-s)^3\,\partial_t^4 J(st;\, p)\,ds
\;=\; t^{4}\,\big(a(p) + t\,R(t;\, p)\big),
\qquad a(p) = \frac{\partial_t^4 J(0;\, p)}{4!}:
$$

the first equality needs only $\partial_t^4 J$ continuous and exhibits $J/t^4$ as
continuous in $(t, p)$; the second — one Taylor order further — bounds $R$ on compacts
using $\partial_t^5 J$. Both hold once $L \in C^6$: the flow and its first variations
are then $C^5$ jointly in $(t, p)$ across the bounded normalized-jet family, which is
the "sufficiently smooth" of the statement. Here $a(0,\theta_0) = \tfrac1{12}$. Hence $a \ge \tfrac1{24}$ for all $\theta_0$ and all sufficiently small
$\varepsilon$, giving a **uniform** $t_1 > 0$ with $J \ne 0$ on $(0, t_1]$. Verified
symbolically with the profile jets and $h$ kept exact
(`run_f3_smalltime_uniform.py`): the $t^0$–$t^3$ coefficients vanish identically in
(jets, $h$, $\theta_0$), and for the three-jet family the $t^4$ coefficient is
*identically* $\tfrac1{12}$. (The general-technology alternative — a uniform lower
bound on the first conjugate time from bounded canonical curvature — is
Barilari–Rizzi's comparison theory.) (ii) *The bulk:* $J_0$'s first positive zero
at $2\pi$ is simple, so $\lvert J_0\rvert \ge c' > 0$ on $[t_1,\, 2\pi - \eta]$, and
$J(\cdot;\varepsilon) \to J_0$ uniformly on that compact interval, excluding roots
there for small $\varepsilon$. (iii) *Near $2\pi$:* the zero is simple, so the
implicit function theorem gives exactly one root in $(2\pi-\eta,\, 2\pi+\eta)$ — the
constructed series. Compactness of the launch circle makes $\varepsilon_0$ uniform in
$\theta_0$. $\blacksquare$

*Scope.* Independently of window (i) below, the construction always yields the unique
simple root continuing from the homogeneous zero at $2\pi$, and every coefficient
statement holds for that root; window (i) is what upgrades it to the *first* conjugate
time. The statement is one-dimensional: the field varies along a single direction,
and $(\varepsilon,\beta)$ are the jets of that one profile function. Nothing here
covers a genuinely two-dimensional $B(x,y)$, whose caustic need not be governed by any
single profile's jets.

*Exactness boundary and certificate.* The per-order flow coefficients, the assembly of
$J_0, J_1, J_2$, the values $J_0(2\pi) = 0$ and $J_0'(2\pi) = -2\pi$, the small-time
series above, $\tau_1$, $\tau_2$, and the launch averages $\langle\tau_1\rangle = 0$,
$\langle\tau_2\rangle = 2\pi(1-\tfrac34\beta)$ are **exact symbolic identities**; the
five-point quadrature table is numerical *verification*, not part of the derivation.
The full set — expressions included — is archived as a referee-checkable certificate,
`artifacts/o6_certificate.json`, regenerated by `run_o6_caustic_c2.py`. Per §0's label
convention this result is a computer-assisted derivation; the human-readable proof is
open item O6.

Two upgrades follow. *Generality:* the derivation runs on the arbitrary second-order
jet, so the law holds for **all one-dimensional** profiles at leading order — V1's
"measured on the power family" restriction is lifted. *The gap:* period average $1 - \tfrac12\beta$
versus caustic $1 - \tfrac34\beta$ — the difference $-\tfrac14\beta$ is an exact
symbolic result at this order (computer-assisted, per §0's labels), and with it $\beta = 0$ — i.e. $L''(0) = 0$ **at the launch point** —
is *derived* to be the unique second-order jet condition under which caustic and
period average agree at leading order. (A local condition: it picks out
exponential-*class* jets at that point; global exponential form follows only if
$L'' = 0$ holds along the whole relevant interval.) That locus is exactly
where Conjecture A lives. What remains of **O6**: the higher coefficients ($c_4$ off
the exponential family) and a human-readable proof to replace the computer-assisted
trace.
**(c)** The exponential profile is exceptional exactly where Conjecture A says it is
(§3.4, item 4): the linear profile satisfies orbit closure and $E$-collapse yet fails
the identification, so the exponential's $t_c = T$ must hinge on structure those two
properties don't capture.

**Consequences.** (i) The deviation statistic does *not* measure
$\lvert\nabla \ln B\rvert$ alone: at leading order the caustic measures the
curvature-corrected combination $\lvert 1-\tfrac34\beta\rvert^{1/2}\,\lvert\nabla\ln
B\rvert$, with the **sign** of $\delta$ carrying the rest — when $1 - \tfrac34\beta <
0$ (the regime the $\beta = 2$ example above enters: $c_2 = -\tfrac12$), $\delta$ is
*positive* at leading order and the square root is of the absolute value, not of a
negative number (derived for one-dimensional profiles at leading order — Proposition
4.2 — and measured; the proven period-average version has $\tfrac12$ in place of
$\tfrac34$). The series' inversion $\sqrt{\lvert\delta\rvert}/r_L$ is a
*leading-order estimator* whose coefficient is $1$ only for exponential-class profiles
— an exact inversion would invert $K(2\varepsilon)$ itself — and it needs the
$\lvert 1-\tfrac34\beta\rvert^{-1/2}$ factor otherwise; Part 3's inversion claim now
carries both qualifiers.
(ii) A correction to an earlier draft of this section: two Larmor radii do **not**
separate $L'(0)$ from $L''(0)$. Since $\delta(r_L) = -\big[(1-\tfrac34\beta)
L'(0)^2\big] r_L^2 + O(r_L^3)$ as a function of the probe radius, every sufficiently
small radius measures the *same* single combination $(1-\tfrac34\beta)L'(0)^2$;
separating gradient from curvature requires an independently derived and
profile-parameterised higher-order term, which does not yet exist. What the statistic
measures is that one combination — no more is claimed. (iii) A smaller bonus of the
first integral:
the linear profile's critical gradient is $\varepsilon = \tfrac14$ (radicand
$1+2\varepsilon(\sin\theta-\sin\theta_0)$ first touches zero at
$\theta_0 = \tfrac{\pi}{2}$, $\theta = -\tfrac{\pi}{2}$), not the exponential's
$\tfrac12$ — the critical gradient is itself a profile-dependent observable.

## 5. The saddle-node corollary: $Q$ is blind to the fold

**Corollary 5.1.** *Let $d = 3$ and let $\{\mathbf B_\lambda\}$ be a one-parameter family
in which two transverse nulls collide at $\lambda = \lambda_c$ in a generic saddle-node
(fold): at the degenerate null $q_\ast$, the Jacobian $\nabla\mathbf B_{\lambda_c}
(q_\ast)$ has a one-dimensional kernel and rank 2. Then $\mathbf B_{\lambda_c}$ has a
zero of order exactly $k = 1$ at $q_\ast$, and by Lemma 2.3*

$$
Q(q_\ast) \;=\; 3 + 1 + 2 \;=\; 6
$$

*— the same value as at a generic (nondegenerate) null. The homogeneous dimension does
not see the fold.*

*Proof.* Order of a zero is a statement about the full 1-jet: $k \ge 2$ would require
*every* first derivative of every component to vanish, i.e. $\nabla\mathbf B(q_\ast) =
0$ — a codimension-8 condition on the Jacobian (solenoidality already fixes the trace,
so the Jacobian lives in the 8-dimensional trace-free space), not the codimension-1
fold. Rank 2 means
the 1-jet survives, so $k = 1$, and Lemma 2.3 applies (recall it needs only *some*
nonvanishing first derivative, not isotropy — the quadratic vanishing along the kernel
direction is invisible to the flag). $\blacksquare$

The reading $k = 2$, $Q = 7$ at a degenerate null belongs only to the fully symmetric
normal form with $\nabla\mathbf B \equiv 0$ — a constructed object, not the generic
collision. What *does* see the fold is scale-resolved, not pointwise: the flux-reach
exponent $w_4(r)$ measured at the pair's midpoint crosses over — reading the ordinary
value at radii far outside the pair, the near-degenerate value in the window comparable
to the separation $s$, and collapsing as $s \to 0$ (the "knee" measured at the fold
certified in Part 6's real-data-anchored boundary-interpolation family — a saddle-node
of the modelled field, not an observed temporal event — where the collapse under
dilation was the fourth certificate signature). Deriving the universal crossover
profile $w_4 = W(r/s)$ in the saddle-node
tangent family is **Open problem O3**: the empirical curve exists; the formula does not.

## 6. Relation to prior work

The magnetic lift is classical, and two works sit close enough that the honest way to
state this article's contribution is a direct comparison. (Both were surfaced by an
independent review of this program; the comparison below is based on the papers'
published statements and should be refined against their proofs before any formal
submission.)

**Montgomery (1995), *Hearing the zero locus of a magnetic field*.** For a planar
magnetic field vanishing along a curve, that paper already contains: the circle-bundle
lift on which the magnetic Schrödinger operator becomes a sub-Laplacian; the horizontal
fields determined by the vector potential — Definition 1.1's structure; the observation
that one bracket suffices where $B \ne 0$ and a second is needed at a nondegenerate
zero — precisely the $k = 1$ instance of Lemma 2.3; and the discovery that the
horizontal lift of the zero locus is a **strictly abnormal minimizer**, one of the
founding examples of that phenomenon. So the $d = 2$, $k = 1$ row of Corollary 2.4 is
not merely *analogous* to known work — it is part of that paper's mechanism, and
Lemma 1.3's closing remark on abnormals is a pointer into it.

**Barilari–Bossio–Franceschi (Trans. Amer. Math. Soc., accepted 2026; arXiv:2504.09274), *Magnetic
flows on 3D contact sub-Riemannian manifolds via the Rumin complex*.** Magnetic fields
on a contact 3-manifold are identified with closed Rumin 2-forms; horizontal magnetic
flows are built from a potential 1-form and shown to depend only on its Rumin
differential (the gauge statement of Remark 1.2, in their setting); and the lifted
structure — of Engel type — has its **step and abnormal trajectories characterised in
terms of the analytical properties of the magnetic field**, including where the field
vanishes. That is the same family of questions as §2, asked over a contact base rather
than the Euclidean one.

**What is and is not claimed as new, against that background.** *Not new*: the flux
lift and its bracket (§1), the Heisenberg reduction of the uniform field, the extra
bracket at a nondegenerate zero ($k=1$), the existence and role of abnormal curves on
the zero locus, gauge invariance. *Claimed by this article*, in decreasing order of
confidence: (i) Theorem B — the exact period-average elliptic identity
$\tfrac{2}{\pi}K(2\varepsilon)$ for the exponential profile, with its coefficient
series and critical gradient; (ii) the measured caustic profile law of §4 with the
counterexample delimiting Conjecture A (the identification's exponential-specificity
appears to be a new observation); (iii) the general finite-order flag dictionary of
Lemma 2.3 for arbitrary $(d, k)$ with the anisotropy remark and the fold corollary of
§5 — a modest extension whose value is the dictionary, not the technique; (iv) the
application methodology (audits, certificates, and the honesty protocol). On the
guiding-centre side (check O4): a bounded, targeted search of the adiabatic-invariant
and exact-orbit literature (Northrop; Littlejohn; the classical exact-orbit papers
where elliptic integrals appear) found the averaging machinery everywhere but not the
launch-averaged conjugate-time statistic, the $\tfrac{2}{\pi}K(2\varepsilon)$ form, or
the critical gradient — recorded as "not found in a targeted pass", which bounds but
does not close the novelty question.

## 7. Status ledger

<table style="width:100%; border-collapse:collapse; font-family:var(--sans,sans-serif); font-size:0.88rem; margin:1.2em 0 1.6em;">
  <thead>
    <tr style="border-bottom:2px solid var(--border,#e0e0e0);">
      <th style="text-align:left; padding:6px 10px;">Claim</th>
      <th style="text-align:left; padding:6px 10px; width:14em;">Status</th>
      <th style="text-align:left; padding:6px 10px;">Where</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Reduction to Lorentz force (Lemma 1.3)</td>
      <td style="padding:6px 10px;">proved</td>
      <td style="padding:6px 10px;">§1; classical</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Flag at an order-$k$ zero, $Q = d+k+2$ (Lemma 2.3)</td>
      <td style="padding:6px 10px;">proved (elementary given Bellaïche/Jean)</td>
      <td style="padding:6px 10px;">§2; measured instantiations in Parts 2, 4, 6, 8</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">$k{=}1$ lift $\cong$ flat Martinet (Prop. 2.5)</td>
      <td style="padding:6px 10px;">proved</td>
      <td style="padding:6px 10px;">§2</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Ball-volume growth at the null itself</td>
      <td style="padding:6px 10px;"><strong>open (O1)</strong></td>
      <td style="padding:6px 10px;">Remark 2.6; Ghezzi–Jean machinery</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Reach estimator $\to$ dilation weights, window bias $O(1/\log(r_2/r_1))$ (Prop. 2.7)</td>
      <td style="padding:6px 10px;">stated with proof sketch (Bellaïche approximation); constants untracked; sampling + noise riders explicit</td>
      <td style="padding:6px 10px;">§2; Part 4's scale-window rule</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Conjugate time = $\theta$-period (Conjecture A)</td>
      <td style="padding:6px 10px;"><strong>open (O2)</strong>; verified $10^{-8}$ on the exponential profile, and above the critical gradient for every angle keeping a period (R6, $4\times10^{-5}$ at $\varepsilon=0.55$); steps 1–2 of its structure proved; general-profile version <strong>refuted</strong> by V1 (gap $\propto \beta\varepsilon^2$) — the conjecture is exponential-specific</td>
      <td style="padding:6px 10px;">§3.4, §4; <code>run_r6_supercritical.py</code></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Period average $= \tfrac{2}{\pi}K(2\varepsilon)$ (Theorem B)</td>
      <td style="padding:6px 10px;">proved; chain sympy+numeric-checked; the factorization step and the modulus identity machine-checked in Lean (<code>lean/FORMAL.md</code> — the elliptic average itself is <em>not</em> formalized)</td>
      <td style="padding:6px 10px;">§3.5; <code>run_t2_reduction_check.py</code></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">$c_2 = 1$, $c_4 = \tfrac94$, $c_6 = \tfrac{25}{4}$</td>
      <td style="padding:6px 10px;">corollaries of Thm B; measured $0.9996$, $2.2497\pm0.0009$, curve $10^{-10}$</td>
      <td style="padding:6px 10px;">§3.6; <code>run_c4_precision.py</code>, <code>run_p5_series.py</code></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Critical gradient $\varepsilon = \tfrac12$</td>
      <td style="padding:6px 10px;">corollary of Thm B (+ Conj. A for the caustic reading); verified</td>
      <td style="padding:6px 10px;">§3.6</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Profile law, period average: $c_2 = 1 - \beta/2$ (Prop. 4.1)</td>
      <td style="padding:6px 10px;">proved (leading order) + numerically checked at 5 values of $\beta$</td>
      <td style="padding:6px 10px;">§4; <code>run_t4_beta_period_check.py</code></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Profile law, caustic: $c_2 = 1 - \tfrac34\beta$ (Prop. 4.2)</td>
      <td style="padding:6px 10px;"><strong>computer-assisted derivation</strong> for arbitrary one-dimensional profiles at leading order (certificate: <code>artifacts/o6_certificate.json</code>; $\tau_1 = 2\pi\sin\theta_0$, $\langle\tau_2\rangle = 2\pi(1-\tfrac34\beta)$ exact symbolic; first-root status via the uniform $t^4$ factorization (structural order counting + exact-symbolic verification, <code>run_f3_smalltime_uniform.py</code>; homogeneous inputs machine-checked in Lean, <code>lean/FORMAL.md</code>) + measured (V1) + blind jet $\beta = \tfrac43$ tested: PASS ($c_2 = (-0.7\pm1.4)\times10^{-5}$); remaining O6: higher coefficients, hand-written proof</td>
      <td style="padding:6px 10px;">§4; <code>run_o6_caustic_c2.py</code>, <code>run_v1_linear_profile.py</code></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">$Q$ blind to the generic fold (Cor. 5.1)</td>
      <td style="padding:6px 10px;">proved; knee measured at the certified boundary-interpolation fold</td>
      <td style="padding:6px 10px;">§5; Part 6</td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:6px 10px;">Crossover profile $W(r/s)$ at the fold</td>
      <td style="padding:6px 10px;"><strong>open (O3)</strong></td>
      <td style="padding:6px 10px;">§5</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;">Novelty vs guiding-centre literature (O4); $\chi,\kappa$ contact invariants (O5)</td>
      <td style="padding:6px 10px;">O4: <strong>bounded search done</strong> — machinery found (Northrop, Littlejohn), statistic/closed form/critical gradient not found; recorded as a search record, not proof. O5: <strong>open</strong></td>
      <td style="padding:6px 10px;">§6; Appendix D5's caveats</td>
    </tr>
  </tbody>
</table>

The honest one-sentence summary of the ledger: the *period reduction and its
period-average consequences are proved*, and the caustic profile coefficient is a
computer-assisted derivation with an archived certificate; the identification of the
period with the caustic (O2) remains conjectural — and only on the exponential
profile, where alone it can hold; the growth-vector law is an exercise placed in
the right dictionary; and §4 holds two profile laws with opposite histories: the
*period-average* law ($c_2 = 1 - \tfrac12\beta$, Prop. 4.1) was derived before being
measured, and its naive caustic extension became the program's first pre-registered
prediction to be cleanly refuted by its own pipeline — whereupon the *caustic* law
($c_2 = 1 - \tfrac34\beta$) was measured first (V1) and then derived (Prop. 4.2).

## 8. Reproduce

All numerics live in the site repository under `research/preferred-directions/`:

```bash
cd research/preferred-directions
# environment: research/cosmic-web/.venv (runs used numpy 2.5.0, scipy 1.18.0, sympy)
# Theorem B's chain, symbolically and numerically, at machine precision:
../cosmic-web/.venv/bin/python scripts/run_t2_reduction_check.py
# The closed form against the full conjugate-point pipeline (1e-10):
../cosmic-web/.venv/bin/python scripts/run_p5_series.py
# The c4 precision measurement (2.2497 ± 0.0009):
../cosmic-web/.venv/bin/python scripts/run_c4_precision.py
# Prop 4.1's beta-law at the period-average level (5 profiles + linear series):
../cosmic-web/.venv/bin/python scripts/run_t4_beta_period_check.py
# V1: the caustic pipeline on the power family — c2 = 1 - (3/4)beta measured,
# Conjecture A refuted off the exponential profile:
../cosmic-web/.venv/bin/python scripts/run_v1_linear_profile.py
# R6: above the critical gradient — which launch angles keep conjugate points:
../cosmic-web/.venv/bin/python scripts/run_r6_supercritical.py
# O6: the caustic coefficient DERIVED (exact perturbation, symbolic; ~10 s);
# writes the referee certificate artifacts/o6_certificate.json:
../cosmic-web/.venv/bin/python scripts/run_o6_caustic_c2.py
# F2: the beta = 4/3 caustic-blind jet, tested (pre-registered PASS):
../cosmic-web/.venv/bin/python scripts/run_f2_beta43_blind.py
# F3: uniform small-time t^4 factorization, jets and h exact (~45 s):
../cosmic-web/.venv/bin/python scripts/run_f3_smalltime_uniform.py
```

And the machine-checked layer (Lean 4 + mathlib; ledger in `lean/FORMAL.md`):

```bash
cd research/preferred-directions/lean
lake exe cache get   # first time: fetch mathlib binaries
lake build           # zero errors; the FDFormal/ tree contains no `sorry`
```

## References

- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." Progr. Math. 144,
  Birkhäuser.
- J. Mitchell (1985). "On Carnot–Carathéodory metrics." <em>J. Differential Geom.</em>
  21, 35–45.
- F. Jean (2014). <em>Control of Nonholonomic Systems: from Sub-Riemannian Geometry to
  Motion Planning</em>. Springer.
- R. Ghezzi, F. Jean (2013). "Hausdorff measures and dimensions in non-equiregular
  sub-Riemannian manifolds." <a href="https://arxiv.org/abs/1301.3682">arXiv:1301.3682</a>.
- R. Ghezzi, F. Jean (2015). "Hausdorff volume in non-equiregular sub-Riemannian
  manifolds." <em>Nonlinear Anal.</em> 126.
- A. Nagel, E. M. Stein, S. Wainger (1985). "Balls and metrics defined by vector fields
  I." <em>Acta Math.</em> 155.
- R. Montgomery (1995). "Hearing the zero locus of a magnetic field."
  <em>Comm. Math. Phys.</em> 168, 651–675. (The planar magnetic lift, the extra bracket
  at a nondegenerate zero, and the zero locus as a strictly abnormal minimizer — the
  closest prior work; see §6.)
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their Geodesics and
  Applications</em>. AMS. (Flux lifts, isoholonomic problems, charge as fibre momentum.)
- D. Barilari, T. Bossio, V. Franceschi (2025). "Magnetic flows on 3D contact
  sub-Riemannian manifolds via the Rumin complex."
  <em>Trans. Amer. Math. Soc.</em>, accepted 2026.
  <a href="https://arxiv.org/abs/2504.09274">arXiv:2504.09274</a> ·
  <a href="https://cvgmt.sns.it/paper/7077/">cvgmt record</a>. (Lifted magnetic structures on a contact base: step
  and abnormal trajectories where the field vanishes; see §6.)
- A. Agrachev, D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups."
  <em>J. Dyn. Control Syst.</em> 18, 21–44.
- D. Barilari, L. Rizzi (2016). "Comparison theorems for conjugate points in
  sub-Riemannian geometry." <em>ESAIM Control Optim. Calc. Var.</em> 22, 439–472.
  (Curvature-based lower bounds on the first conjugate time — the general-technology
  alternative to Prop. 4.2's window (i).)
- L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian
  manifolds and stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em>
  57, 2362–2391.
- J. Martinet (1970). "Sur les singularités des formes différentielles."
  <em>Ann. Inst. Fourier</em> 20, 95–178. (The classification of 2-form degenerations
  behind the $d=2$ hierarchy of §2.)
- E. Priest, T. Forbes (2000). <em>Magnetic Reconnection: MHD Theory and Applications</em>.
  CUP. (Null taxonomy; the fold as a physical event.)
- D. I. Pontin, E. R. Priest (2022). "Magnetic reconnection: MHD theory and modelling."
  <em>Living Rev. Solar Phys.</em> 19, 1.
  <a href="https://doi.org/10.1007/s41116-022-00032-9">doi:10.1007/s41116-022-00032-9</a>.
  (3D reconnection requires localized non-ideal evolution and can occur without a null —
  the physical scope note behind every "candidate site" qualifier in the series.)
- T. G. Northrop (1963). <em>The Adiabatic Motion of Charged Particles</em>.
  Interscience. (The gyro-averaging machinery behind check O4.)
- R. G. Littlejohn (1983). "Variational principles of guiding centre motion."
  <em>J. Plasma Phys.</em> 29, 111–125. (The modern guiding-centre reduction; O4.)

</div><!-- /.l-body -->
