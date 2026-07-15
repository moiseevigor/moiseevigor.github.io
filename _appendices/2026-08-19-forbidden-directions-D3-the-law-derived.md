---
layout: distill
title: "Appendix D3 — The Law Q = d + k + 2, Derived"
subtitle: >
  The series' central law in four lines. It is an area argument dressed as the Ball–Box theorem:
  the flux you catch is field times enclosed area, and near a curvature zero of order k that makes
  the holonomy coordinate weight k+2. Add the d drivable directions and you have the homogeneous
  dimension.
date: 2026-08-19 09:00:00
categories: [mathematics]
tags: [sub-riemannian, ball-box, homogeneous-dimension, growth-vector, holonomy]
description: >
  Companion appendix to the Forbidden Directions series: the Ball–Box weights, the derivation of
  the flux coordinate's weight k+2 from flux ~ field × area, the homogeneous dimension as the sum
  of weights, the holonomy cost law, and the confirmed exponents.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: D3
permalink: /mathematics/2026/08/19/forbidden-directions-D3-the-law-derived/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The law <code>Q = d + k + 2</code> stated in
<a href="{% post_url 2026-08-05-forbidden-directions-research-program %}">Part 1</a> and measured
in <a href="{% post_url 2026-08-08-forbidden-directions-magnetic-contact %}">Part 2</a>, derived
from the Ball–Box theorem in a few lines, with the holonomy-cost reading and the confirmed
exponents.
</div>

## The Ball–Box theorem, and coordinate weights

The **Ball–Box theorem** says a sub-Riemannian ball, seen in coordinates adapted to the point, is
comparable to an axis-aligned box whose side in coordinate $u_i$ is $r^{w_i}$:

$$
B(q_0, r) \;\asymp\; \big\{\, |u_i| \lesssim r^{\,w_i} \,\big\},
$$

where $w_i$ is the **weight** of coordinate $u_i$ — how many brackets you need to reach it. A
directly drivable coordinate (one you can move along in the distribution) has weight 1. A
coordinate reached by one bracket has weight 2, by a bracket-of-a-bracket weight 3, and so on. The
**homogeneous dimension** is the volume exponent of that box:

$$
\mathrm{vol}\,B(q_0, r) \;\asymp\; \prod_i r^{w_i} = r^{\sum_i w_i}
\quad\Longrightarrow\quad Q = \sum_i w_i .
$$

So computing $Q$ is bookkeeping: add up the weights.

## The weights of the magnetic flux lift

The state is $(x_1,\dots,x_d,\varphi)$. The $d$ spatial coordinates are drivable directly — you
move along them in the distribution — so each has **weight 1**, contributing $d$.

The flux coordinate $\varphi$ is the one that must be reached by a bracket. Its weight is fixed by
*how fast you can accumulate flux with a short path*. A loop of spatial size $r$ encloses area
$\sim r^2$, and the flux threading it is field times area. Where the field is ordinary,
$B \sim \text{const}$, so

$$
\varphi \;\sim\; B\cdot r^2 \;\sim\; r^2 \quad\Longrightarrow\quad w_\varphi = 2.
$$

Where the field **vanishes to order $k$** at the point — precisely: the $(k-1)$-jet of $B$
vanishes there and the $k$-jet does not (in 3D, read this for the curvature 2-form
$F$, i.e. for the vector field $\mathbf B$ componentwise) — $B \sim r^k$ nearby along
generic directions, so the same loop catches

$$
\varphi \;\sim\; r^k\cdot r^2 = r^{\,k+2}\quad\Longrightarrow\quad w_\varphi = k+2 .
$$

Adding up:

$$
\boxed{\,Q \;=\; \underbrace{d\cdot 1}_{\text{spatial}} \;+\; \underbrace{(k+2)}_{\text{flux}}
\;=\; d + k + 2\,.}
$$

(The same fact reads off the bracket structure directly: $[X_i,X_j] = F_{ij}\partial_\varphi$
with $F \sim r^k$ near the zero means the flag $\mathcal D \subset \mathcal D+[\mathcal D,\mathcal D]
\subset\cdots$ reaches $\partial_\varphi$ only after $k+2$ steps of weighting — Appendix D1.
That flag computation is carried out in full — the two bracket identities, the induction,
the order-$k$ hypotheses, and the exact identification of the $k=1$ lift with the flat
Martinet structure — as Lemma 2.3 and Proposition 2.5 of the
[companion article](/articles/magnetic-flux-lifts/).)

## The holonomy-cost reading

Invert the weight. To build up a holonomy $\varphi = \Phi$ you need path length

$$
L \;\sim\; \Phi^{\,1/(k+2)} .
$$

Geometric phase is *expensive*, and most expensive near a degeneracy: at a magnetic null of order
$k$, catching a given flux costs path length $\Phi^{1/(k+2)}$, with the exponent shrinking as the
null becomes more degenerate. For an ordinary field ($k=0$) the cost is $\Phi^{1/2}$ — the
isoperimetric law that a fixed flux is cheapest to enclose with a circle.

## The confirmed exponents

The estimator measures each coordinate's reach exponent directly, and the law holds to the integer:

```
d = 2:   flux weight = k + 2
  k=0  ->  2   (Q=4, the Heisenberg group)
  k=1  ->  3   (Q=5, Martinet -- the generic 2D zero)
  k=2  ->  4   (Q=6)  [constructed field, not generic]
  k=3  ->  5   (Q=7)  [constructed field, not generic]
                       [measured slopes 2.0, 3.0, 4.0, 5.0]

d = 3:   Q = k + 5
  k=0  ->  Q=5  (B != 0)
  k=1  ->  Q=6  (a generic magnetic null; k=2 needs the
                 fold's degenerate point, Part 6)
```

A genericity note the table deserves: in 2D a scalar $B$ generically vanishes to order 1
along a curve — the $k \ge 2$ rows are deliberately *constructed* degeneracies, there to
test the law, not claims about typical fields. In 3D only $k = 1$ (a transverse zero of
$\mathbf B$) is generic; $k = 2$ occurs at codimension-one moments like the fold of
Part 6.

The measured slopes match the integers to within a percent, and the $d=3$ jump $5\to6$ at a null
is what indexes nulls for the growth vector (Part 4 — with that part's caveats on what
"detection" costs on real data).

## The fine print: the null is a singular point

One hypothesis has been silent so far and must be said out loud. The Ball–Box theorem as
invoked above holds at **equiregular** points — points where the growth vector is locally
constant. The null is *precisely* where it jumps: a **singular (non-equiregular) point** of
the distribution. What $Q = d + k + 2$ means there is the homogeneous dimension of the
**nilpotentization at that point** — the tangent-cone group whose dilations have the weights
computed above — and the clean statement "$\mathrm{vol}\,B(r) \sim r^Q$" for metric balls
*centred at* the singular point is genuinely more delicate: Hausdorff volume at
non-equiregular points is the subject of its own literature (Ghezzi–Jean below), and this
series' numerical "reach exponents" probe the dilation weights of the tangent cone, not a
volume theorem it never proved. The empirical slopes come out clean; the mathematical
license for reading them as $Q$ at the singular point is the nilpotentization, and that is
the only license claimed.

## References

- R. Montgomery (1995). "Hearing the zero locus of a magnetic field." <em>Comm. Math.
  Phys.</em> 168, 651–675. (The planar magnetic lift with the extra bracket at a
  nondegenerate zero — the $k=1$ row of this appendix — and the zero locus as a
  strictly abnormal minimizer; the closest prior work, discussed in the companion
  article's §6.)
- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." Progr. Math. 144,
  Birkhäuser. (Ball–Box, weights, homogeneous dimension — at equiregular points.)
- J. Mitchell (1985). "On Carnot–Carathéodory metrics." <em>J. Differential Geom.</em> 21, 35–45.
- F. Jean (2014). <em>Control of Nonholonomic Systems: from Sub-Riemannian Geometry to
  Motion Planning</em>. Springer. (The modern reference for growth vectors, weights, and
  first-order approximations, including the singular case.)
- R. Ghezzi, F. Jean (2015). "Hausdorff volume in non-equiregular sub-Riemannian
  manifolds." <em>Nonlinear Anal.</em> 126. (Volume at exactly the kind of singular point a
  magnetic null is.)
- A. Nagel, E. M. Stein, S. Wainger (1985). "Balls and metrics defined by vector fields I."
  <em>Acta Math.</em> 155. (The origin of the ball–box estimates.)
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries</em>. AMS.
</div><!-- /.l-body -->
