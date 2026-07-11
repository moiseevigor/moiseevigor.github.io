---
layout: distill
title: "Appendix C3 — The Tangent Cone: Carnot Groups and Growth Vectors"
subtitle: >
  Zoom infinitely far into any sub-Riemannian geometry and it converges to a
  Carnot group — its metric tangent cone — labelled by a growth vector. This
  appendix defines that flag of brackets, the Ball–Box scaling that measures it,
  and the reach estimator the code actually runs.
date: 2026-07-30 09:00:00
categories: [mathematics]
tags: [sub-riemannian, carnot-groups, growth-vector, ball-box, nilpotent]
description: >
  Companion appendix to the caustics-to-groups series: the metric tangent cone as
  a Carnot group, the growth vector as the bracket-generated flag, the Ball–Box
  theorem and homogeneous dimension, why groups can share a tangent cone, and the
  geodesic-reach estimator of metric M1.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C3
permalink: /mathematics/2026/07/30/caustics-to-groups-C3-tangent-cone-growth-vectors/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The first leg of the fingerprint — the one that sorts the five groups into classes —
is the <strong>growth vector</strong> of the tangent cone. This appendix says what the
tangent cone is (a Carnot group), what the growth vector measures (bracket depth), how
the Ball–Box theorem turns it into a scaling law you can fit, and how metric M1 in the
code (<code>src/growth.py</code>) recovers it from geodesic-spreading data. It is the
theory behind
<a href="{% post_url 2026-07-18-caustics-to-groups-forward-map %}">Part 2</a>'s figure.
</div>

## Zoom in, and every geometry becomes a Carnot group

Take a sub-Riemannian manifold and a point $q_0$, and blow up the metric around $q_0$ by
larger and larger factors. In the limit (Gromov–Hausdorff) the geometry converges to a
model space called the **metric tangent cone**. Unlike the Riemannian case — where the
tangent cone is always flat $\mathbb{R}^n$ — here it is a **Carnot group**: a nilpotent Lie
group carrying a family of anisotropic dilations that stretch different coordinates by
different powers. The tangent cone is the *simplest* geometry with the same infinitesimal
bracket structure as the original, and it is the reference against which everything is
measured (Appendix C6).

## The growth vector: a flag of brackets

Let $\mathcal{D}$ be the distribution — the allowed directions, with $n_1 = \operatorname{rank}
\mathcal{D}$. Add the directions you reach by one bracket, then two, and so on:

$$
\mathcal{D} \;\subset\; \mathcal{D} + [\mathcal{D},\mathcal{D}] \;\subset\;
\mathcal{D} + [\mathcal{D},\mathcal{D}] + [[\mathcal{D},\mathcal{D}],\mathcal{D}]
\;\subset\; \cdots
$$

The dimensions of this flag, $(n_1, n_2, n_3, \dots)$, are the **growth vector**. It reaches
the full dimension at the *step* of the structure (the deepest bracket needed). For the
series' groups:

| Group | Growth vector | Step | Reading |
|---|---|---|---|
| Heisenberg, SE(2) | $(2,3)$ | 2 | drive 2 ways; 1 coordinate one bracket deep |
| Engel | $(2,3,4)$ | 3 | + 1 coordinate two brackets deep |
| Cartan | $(2,3,5)$ | 3 | + 2 coordinates two brackets deep |
| SE(3) | $(3,6)$ | 2 | drive 3 ways; 3 coordinates one bracket deep |

This is exactly the "nonholonomic parking difficulty" of
[Appendix C1](/mathematics/2026/07/28/caustics-to-groups-C1-model-groups-by-example/): a
coordinate at flag level $k$ needs a bracket nested $k-1$ deep to reach.

## Ball–Box: turning bracket depth into a scaling law

The growth vector is invisible to any single caustic germ (Appendix C2), but it *is* visible
in how fast small balls grow. The **Ball–Box theorem** says: in dilation-adapted coordinates
where coordinate $x_i$ has weight $w_i$ (its flag level), the sub-Riemannian ball of radius
$r$ is comparable to the box $\prod_i \{|x_i| \lesssim r^{w_i}\}$. Two consequences the code
uses:

- **Coordinate reach.** A coordinate of weight $w$ ranges over $\sim r^w$ along geodesics of
  length $r$. Directly-drivable coordinates ($w=1$) fill in linearly; bracket coordinates
  ($w=2$) as $r^2$; nested-bracket coordinates ($w=3$) as $r^3$.
- **Ball volume and homogeneous dimension.** $\operatorname{vol} B(q_0,r) \sim r^{Q}$ with

$$
Q \;=\; \sum_i i\,(n_i - n_{i-1}), \qquad n_0 := 0,
$$

the **homogeneous dimension** (Heisenberg/SE(2): $Q=4$; Engel: $Q=7$; Cartan: $Q=10$;
SE(3): $Q=9$). Note $Q$ exceeds the topological dimension — the hallmark of a genuinely
sub-Riemannian space.

## What the code measures (metric M1)

The estimator in `src/growth.py` reads the coordinate weights directly. It shoots unit-speed
geodesics with vertical momenta spanning a wide band, measures each coordinate's *reach* (a
high quantile of $|x_i|$) at a grid of lengths $r$, and fits the exponent of $r$ — that
exponent is the weight. Counting weights builds the growth vector; summing them gives $Q$.
Two lessons the experiments forced (documented in `docs/E0-growth-vector.md`):

1. the momenta must span a **wide** band, or a fixed distribution only samples the
   $wr \to 0$ regime at small $r$ and returns a spurious weight (Heisenberg's weight-2 came
   out as 2.8 before the fix);
2. the exponent fit must be **noise-floor aware**, $m(r) = \sqrt{(a\,r^w)^2 + b^2}$, or
   absolute position noise cliff-collapses the estimate.

With those, clean data recovers every growth vector exactly, and the noise/sample tradeoff
is graded — with the higher-step groups (Cartan) the hardest, because their discriminating
coordinate reaches only $\sim r^3$ and is the first thing noise erases.

## Why groups can share a tangent cone

The tangent cone forgets everything except the bracket structure to leading order. So two
genuinely different groups can share one: **Heisenberg is the tangent cone of SE(2)** — zoom
into a parking car and the curvature of its steering washes out, leaving the flat Heisenberg
model. That is why the growth vector alone *cannot* separate Heisenberg from SE(2) (both
$(2,3)$), and why the series needs the finite-scale moduli of Appendix C6 to break that tie.
The tangent cone fixes the *species*; the moduli fix the *individual*.

## References

- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." In <em>Sub-Riemannian
  Geometry</em>, Progr. Math. 144, Birkhäuser, 1–78.
- M. Gromov (1996). "Carnot–Carathéodory spaces seen from within." Same volume, 79–323.
- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press. (Ball–Box, nilpotent
  approximation.)
- J. Mitchell (1985). "On Carnot–Carathéodory metrics." <em>J. Differential Geom.</em> 21,
  35–45.
</div><!-- /.l-body -->
