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

Where the field **vanishes to order $k$** at the point, $B \sim r^k$ nearby, so the same loop
catches

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
\subset\cdots$ reaches $\partial_\varphi$ only after $k+2$ steps of weighting — Appendix D1.)

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
  k=1  ->  3   (Q=5, Martinet)
  k=2  ->  4   (Q=6)
  k=3  ->  5   (Q=7)     [measured slopes 2.0, 3.0, 4.0, 5.0]

d = 3:   Q = k + 5
  k=0  ->  Q=5  (B != 0)
  k=1  ->  Q=6  (a generic magnetic null)
```

The measured slopes match the integers to within a percent, and the $d=3$ jump $5\to6$ at a null
is what makes the growth vector a null detector (Part 4).

## References

- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." Progr. Math. 144,
  Birkhäuser. (Ball–Box, weights, homogeneous dimension.)
- J. Mitchell (1985). "On Carnot–Carathéodory metrics." <em>J. Differential Geom.</em> 21, 35–45.
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries</em>. AMS.
</div><!-- /.l-body -->
