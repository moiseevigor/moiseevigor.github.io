---
layout: distill
title: "Appendix D4 — The Magnetic Geodesic Flow and Its Conjugate Locus"
subtitle: >
  Where the identity "Larmor motion is Heisenberg" is proved. The Pontryagin Maximum Principle
  turns the magnetic contact structure into a flow whose curves are unit-speed circles of
  curvature B·w — the Larmor orbits — and for a uniform field the conjugate locus is Heisenberg's,
  reproduced by the code to eleven digits.
date: 2026-08-20 09:00:00
categories: [mathematics]
tags: [sub-riemannian, pontryagin, geodesics, conjugate-locus, larmor, heisenberg]
description: >
  Companion appendix to the Forbidden Directions series: the Hamiltonian and normal-geodesic
  equations of the magnetic contact structure, the identity with Larmor motion, the uniform-field
  conjugate time 2π/(B|w|), the Jacobian-determinant conjugate-locus computation, and gauge
  invariance.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: D4
permalink: /mathematics/2026/08/20/forbidden-directions-D4-geodesic-flow/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The geodesic flow behind
<a href="{% post_url 2026-08-08-forbidden-directions-magnetic-contact %}">Part 2</a> and
<a href="{% post_url 2026-08-11-forbidden-directions-reading-gradient %}">Part 3</a>: the
derivation that the sub-Riemannian geodesics of the magnetic contact structure are Larmor orbits,
the uniform-field conjugate locus (Heisenberg's), and how the caustic is computed and shown
gauge-invariant.
</div>

## The Hamiltonian

The magnetic contact structure has orthonormal horizontal frame
$X_1 = \partial_x + A_x\partial_\varphi$, $X_2 = \partial_y + A_y\partial_\varphi$ (Appendix D1).
The sub-Riemannian geodesics are the projections of the flow of the Hamiltonian
$H = \tfrac12(h_1^2 + h_2^2)$ on the cotangent bundle, where $h_i = \langle p, X_i\rangle$. Writing
$w = p_\varphi$ for the momentum conjugate to the flux — **conserved**, because neither $\mathbf A$
nor $B$ depends on $\varphi$ — the Pontryagin Maximum Principle gives, for unit-speed geodesics
($h_1^2+h_2^2=1$, so $(h_1,h_2)=(\cos\theta,\sin\theta)$),

$$
\dot x = \cos\theta,\qquad \dot y = \sin\theta,\qquad
\dot\varphi = A_x\cos\theta + A_y\sin\theta,\qquad
\dot\theta = B(x,y)\,w .
$$

## Larmor motion is the geodesic flow

Read the last equation: the velocity direction $\theta$ turns at rate $B\,w$. A unit-speed curve
whose direction turns at a constant rate is a **circle** of radius $r_L = 1/(B\lvert w\rvert)$ — exactly the
**Larmor orbit** of a charged particle of the corresponding charge-to-mass ratio in the field
$B$. The sub-Riemannian shortest paths are not an analogy for cyclotron motion; they *are*
cyclotron motion, with the sub-Riemannian momentum $w$ playing the role set by the particle's
speed and charge. The flux $\varphi$ swept is the enclosed area — the third coordinate.

## The uniform-field conjugate locus is Heisenberg's

For a uniform field $B_0$, the orbit is a circle traversed at unit speed; it closes, and the whole
family of orbits from a point refocuses, after one period:

$$
t_c \;=\; \frac{2\pi}{B_0\,|w|}\qquad(\text{the Larmor / cyclotron period}).
$$

In the symmetric gauge $\mathbf A = \tfrac{B_0}{2}(-y, x)$ the frame is, term for term, the
Heisenberg frame; the conjugate locus is the Heisenberg group's central axis; and the whole
structure is the flat model of 3D contact sub-Riemannian geometry. The abstract Heisenberg group
and the first system in a plasma course are the same object, and the identification is exact, not
approximate.

The code reproduces $t_c = 2\pi/(B_0\lvert w\rvert)$ to one part in $10^{11}$ across a range of $B_0$ and $w$,
and the deviation for a *varying* field (Part 3) is measured against this exact baseline.

## Computing the conjugate locus for a general field

For a non-uniform field there is no closed form, so the caustic is found numerically. The
conjugate time along a geodesic is the first positive time at which the **Jacobian determinant of
the exponential map** vanishes:

$$
J(t) = \det\!\big[\,\partial_{\theta_0}\gamma \;\big|\; \partial_w\gamma \;\big|\; \dot\gamma\,\big] = 0 .
$$

The base geodesic and its perturbations in $(\theta_0, w)$ are integrated together in one batch,
$J(t)$ is formed along the trajectory, and its first sign change is bracketed. This is the routine
that produces the nilpotent-deviation $\delta$ of Part 3.

(A scope note the criterion needs: this Jacobian test finds conjugate points of *normal*
geodesics. It is exhaustive here only because wherever $B \neq 0$ the structure is contact,
and contact structures have no nontrivial abnormal geodesics; approaching a null,
$B \to 0$, contact fails and abnormals appear — not hypothetically: the horizontal lift
of a nondegenerate zero curve is Montgomery's strictly abnormal *minimizer* (1995) —
which is one more reason everything
near nulls in this series is handled through the tangent cone rather than this routine.)

## Gauge invariance of the caustic

A gauge change $\mathbf A \to \mathbf A + \nabla\chi$ shifts the flux coordinate
$\varphi \to \varphi + \chi(x,y)$ — a **diffeomorphism of the target space**. A diffeomorphism
cannot move the set where a map's Jacobian drops rank, so the conjugate time is gauge-invariant.
The code confirms it: the symmetric gauge $\tfrac12(-y,x)$ and the Landau gauge $(0,x)$ give
identical conjugate times to eight decimals. This is the check that certifies $\delta$ measures
geometry rather than a gauge artefact — the same gauge discipline flagged in Appendix D1.

## References

- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press. (PMP, Heisenberg geodesics, conjugate
  locus.)
- Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the group of
  motions of a plane." <em>ESAIM: COCV</em> 16, 1018–1039.
  <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.
- L. D. Landau &amp; E. M. Lifshitz. <em>The Classical Theory of Fields</em>. (Larmor motion.)
</div><!-- /.l-body -->
