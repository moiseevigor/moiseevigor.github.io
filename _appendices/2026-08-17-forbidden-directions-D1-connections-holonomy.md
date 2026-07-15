---
layout: distill
title: "Appendix D1 — Connections, Holonomy, and Curvature"
subtitle: >
  The three words the whole series rests on. A connection is a rule for carrying something
  along a path; holonomy is what you accumulate around a loop; curvature is the field that
  causes it. For magnetism these are the vector potential, the magnetic flux, and the field —
  and adjoining the holonomy to position is exactly what builds the sub-Riemannian structure.
date: 2026-08-17 09:00:00
categories: [mathematics]
tags: [sub-riemannian, connections, holonomy, curvature, gauge, magnetic-fields]
description: >
  Companion appendix to the Forbidden Directions series: connections as parallel-transport
  rules, holonomy as loop integral, curvature as infinitesimal holonomy, the magnetic
  dictionary (A, flux, B), the flux lift and why [X_i, X_j] equals the curvature, and other
  physical connections (Berry, Coriolis).
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: D1
permalink: /mathematics/2026/08/17/forbidden-directions-D1-connections-holonomy/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The series' thesis is that sub-Riemannian geometry appears exactly when there is a
<em>connection whose curvature is a physical field</em>. This appendix defines those three
words precisely, gives the magnetic dictionary, and shows why adjoining the holonomy to
position produces the bracket <code>[X_i, X_j] = curvature</code> that makes the geometry
sub-Riemannian. It is the mathematical spine behind
<a href="{% post_url 2026-08-05-forbidden-directions-research-program %}">Part 1</a>.
</div>

## Connection: a rule for carrying things along a path

A **connection** answers a question that has no automatic answer on a curved or twisted space:
*as I move along a path, how do I carry a quantity so that it stays "the same"?* Parallel
transport of a vector on a sphere; the phase of a quantum state as parameters change; the
direction "north" as you walk the globe. In each case the rule is encoded by a **connection
one-form** $\alpha$ — a recipe that, given your velocity, tells you the compensating change to
apply.

For a charged particle the connection is the **vector potential** $\mathbf A$, and the quantity
carried is a phase. Transporting along a step $d\boldsymbol\ell$ accrues phase proportional to
$\mathbf A\cdot d\boldsymbol\ell$.

## Holonomy: what a loop leaves behind

Transport all the way around a **closed loop** and you generally do *not* come back to where you
started — the carried quantity has shifted. That leftover is the **holonomy**. On a sphere,
parallel transport around a triangle rotates a vector by the enclosed solid angle. For the
charged particle, going around a loop $\gamma$ accrues the **magnetic flux**

$$
\varphi \;=\; \oint_\gamma \mathbf A\cdot d\boldsymbol\ell \;=\; \iint_S \mathbf B\cdot d\mathbf S,
$$

by Stokes' theorem — the flux threading the enclosed surface. Holonomy is not a defect; it is a
*measurement*. The loop reads out the field it encloses.

## Curvature: holonomy in the small

Shrink the loop to an infinitesimal parallelogram spanned by two directions, and the holonomy
per unit area is the **curvature** $F = d\alpha$, the exterior derivative of the connection form.
For magnetism, $F_{ij} = \partial_i A_j - \partial_j A_i$, i.e.

$$
\mathbf B = \nabla\times\mathbf A .
$$

Curvature is the local density of holonomy: how much phase a tiny loop catches per unit area.
Where the curvature (field) vanishes, tiny loops catch nothing to leading order — the point that
drives the vanishing-order $k$ in the law $Q = d + k + 2$.

## The dictionary

| Geometry | Magnetism | Rotation (Coriolis) | Quantum (Berry) |
|---|---|---|---|
| connection $\alpha$ | vector potential $\mathbf A$ | angular-velocity potential | Berry connection $\langle\psi\rvert\,d\,\lvert\psi\rangle$ |
| holonomy $\varphi$ | magnetic flux | Coriolis circulation | Berry phase |
| curvature $F$ | field $\mathbf B$ | vorticity $2\boldsymbol\omega$ | Berry curvature |

The series works the magnetic column in full and points at the others (Part 1's selection
table). The mathematics is identical; only the physical name of the field changes.

## The flux lift, and why the bracket is the curvature

Here is the step that turns a connection into a sub-Riemannian geometry. Adjoin the holonomy as
an *extra coordinate*: state $= (x_1,\dots,x_d, \varphi)$, with $\varphi$ constrained to track the
connection, $d\varphi = \sum_i A_i\,dx_i$. The allowed motions — the ones respecting that
constraint — are the horizontal frame

$$
X_i = \partial_{x_i} + A_i\,\partial_\varphi .
$$

(Standing hypothesis, used everywhere and worth saying once: the potential depends on
position only, $A_i = A_i(x)$, never on the fibre coordinate $\varphi$ — that is what
makes the bracket below close on $\partial_\varphi$ and, in D4, what conserves
$w = p_\varphi$. This "adjoin the holonomy as a coordinate" construction is itself
classical: it is the central extension of Kostant–Souriau prequantization and the
magnetic/isoperimetric model of Montgomery's book — the series builds on it, it did not
invent it.)

Their Lie bracket is a direct computation:

$$
[X_i, X_j] = (\partial_{x_i} A_j - \partial_{x_j} A_i)\,\partial_\varphi = F_{ij}\,\partial_\varphi .
$$

**The bracket of two horizontal moves is the curvature, pointing in the forbidden holonomy
direction.** So wherever the curvature is nonzero the distribution is bracket-generating (Chow's
condition holds, Appendix D2) and the geometry is genuinely sub-Riemannian; wherever it vanishes,
you must go to higher brackets, and the geometry degenerates (Martinet and beyond). Every
quantitative result in the series — the law, the null jump, the caustic gradient — is
downstream of this one identity (a genealogy, not a claim that the identity does the
work by itself).

## Gauge freedom, and what survives it

The connection is not unique: $\mathbf A \to \mathbf A + \nabla\chi$ leaves the curvature
$\mathbf B$ unchanged (a **gauge transformation**), and correspondingly shifts the holonomy
coordinate $\varphi \to \varphi + \chi$. Anything physical must be gauge-invariant. The curvature
is; so are the growth vector and the conjugate time (the series checks the latter numerically —
symmetric and Landau gauges give identical caustics). But the *coordinate* $\varphi$ is not
gauge-invariant for open paths, which is why the measurements must be done in a gauge adapted to
the base point ($\mathbf A(q_0)=0$) — a subtlety that, ignored, silently corrupts the growth-vector
estimate. Gauge care is not optional bookkeeping; it is the difference between measuring geometry
and measuring an artefact.

## References

- M. Nakahara (2003). <em>Geometry, Topology and Physics</em>, 2nd ed. IOP. (Connections,
  holonomy, curvature.)
- M. V. Berry (1984). "Quantal phase factors accompanying adiabatic changes." <em>Proc. R. Soc.
  Lond. A</em> 392, 45–57.
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries</em>. AMS. (The bracket-generating
  condition and holonomy.)
- R. Montgomery (1995). "Hearing the zero locus of a magnetic field." <em>Comm. Math.
  Phys.</em> 168, 651–675. (The magnetic lift itself, a decade earlier and in this exact
  setting: the extra bracket at a nondegenerate zero and the zero locus as a strictly
  abnormal minimizer — the closest prior work; companion article §6.)
</div><!-- /.l-body -->
