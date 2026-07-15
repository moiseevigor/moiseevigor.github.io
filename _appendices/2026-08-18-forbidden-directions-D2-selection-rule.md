---
layout: distill
title: "Appendix D2 — The Selection Rule: Why Anisotropic Transport Isn't Sub-Riemannian"
subtitle: >
  The seductive mistake the whole program is built to avoid: thinking that "some directions are
  preferred" makes a geometry sub-Riemannian. It does not. A slow direction leaves the geometry
  Riemannian; only a forbidden, bracket-reachable direction changes it. This appendix makes the
  distinction precise, with the measure-theoretic diagnostic that a caustic can otherwise fool.
date: 2026-08-18 09:00:00
categories: [mathematics]
tags: [sub-riemannian, anisotropy, chow-rashevskii, frobenius, homogeneous-dimension, plasma]
description: >
  Companion appendix to the Forbidden Directions series: coefficient vs exponent anisotropy, why
  D_perp << D_par stays Riemannian (Q = n), the integrable rank-1 limit, Chow–Rashevskii vs
  Frobenius, and the full-measure Q > n criterion that a Lagrangian fold can counterfeit
  pointwise.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: D2
permalink: /mathematics/2026/08/18/forbidden-directions-D2-selection-rule/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
<a href="{% post_url 2026-08-05-forbidden-directions-research-program %}">Part 1</a>'s selection
rule — <em>forbidden, not slow</em> — decides which physical systems the program applies to, and
it rules out more than it admits. This appendix gives the rule teeth: why anisotropic transport
stays Riemannian however extreme, why the singular limit is worse rather than better, the exact
condition (Chow–Rashevskii) that separates the two cases, and the measure-theoretic diagnostic
that a caustic can otherwise counterfeit.
</div>

## Two ways a direction can be "special"

A preferred direction can mean two very different things, and only one of them changes the
geometry.

**Slow (coefficient anisotropy).** Transport across a magnetic field is suppressed relative to
along it, $D_\perp \ll D_\parallel$. The metric is

$$
g = \frac{1}{D_\parallel}\,\hat b\,\hat b + \frac{1}{D_\perp}\,(I - \hat b\,\hat b),
$$

an ordinary **Riemannian** metric — just a very eccentric one. You can still move in every
direction; some are simply expensive. The reachable set from a point in "cost" $r$ is an
ellipsoid whose every semi-axis is linear in $r$ (one long, the others short). Ball volume scales
as $r^n$, so the homogeneous dimension is $Q = n$. **However extreme the anisotropy, $Q$ never
rises.** The program measured this directly down to $D_\perp/D_\parallel = 10^{-6}$: still
$Q = n = 3$.

**Forbidden (exponent anisotropy).** In a genuine sub-Riemannian structure the forbidden
direction is not expensive — it is *unavailable*. You reach it only by a bracket of allowed moves
(Appendix D1), and it fills in like $r^2$, not $r$. Its weight is 2, not 1, and $Q > n$. Different
*coefficient* on the same power of $r$ is anisotropic-Riemannian; a different *power* is
sub-Riemannian. That is the whole distinction, and the diagnostic is the exponent, never the
coefficient.

## The singular limit is a trap, not a shortcut

It is tempting to think that pushing $D_\perp \to 0$ — making the cross-field direction truly
impossible — *produces* the sub-Riemannian structure. It produces the opposite. In the limit the
distribution has **rank 1**: you may only move along the field line. A rank-1 distribution is
**integrable** (Frobenius' theorem): its horizontal curves are trapped on the one-dimensional
field lines and cannot reach off them at all. There is no bracket, no Chow condition, no
connectivity — the space fragments into disjoint field lines. Suppressing a direction to zero
does not forbid-and-bracket it; it *severs* it.

## Chow–Rashevskii vs Frobenius: the exact fork

The two outcomes are separated by a clean theorem about the distribution $\mathcal D$ (the allowed
directions):

- **Frobenius (integrable).** If the brackets $[\mathcal D, \mathcal D]$ stay inside $\mathcal D$,
  the space foliates into leaves and horizontal curves never leave their leaf. Rank-1, or any
  involutive distribution. *No sub-Riemannian geometry.*
- **Chow–Rashevskii (bracket-generating).** If iterated brackets of $\mathcal D$ eventually span
  the whole tangent space, then any two points are joined by a horizontal curve, and the
  sub-Riemannian distance is finite and genuine. *This* is the case the program lives in — and by
  Appendix D1 it holds for the magnetic flux lift **exactly where the curvature is nonzero**.

So "does the field forbid a direction that brackets can nonetheless reach?" is not a vague
intuition; it is the question of whether $\mathcal D$ is bracket-generating, decided by whether
the curvature is nonzero.

## The diagnostic a caustic can counterfeit

The clean signature of sub-Riemannian structure is $Q > n$. But there is a subtlety the program
learned the hard way, and it is worth stating because it is exactly the kind of error that
produces a false discovery.

**$Q > n$ at a single point is not sufficient.** A Lagrangian **fold** — the generic caustic of
*any* smooth map, including gravitational structure formation, which has no sub-Riemannian
structure at all — compresses one direction so that the image of a small ball extends like $r^2$
there. Measured pointwise, the reach *estimator* then returns an exponent sum of $n+1$ —
numerically identical to a genuine contact structure's $Q$, even though no sub-Riemannian
homogeneous dimension exists there at all. Stated precisely, this is **estimator
confounding**: a coincidence of measured scaling exponents, not an equality of geometric
invariants — a Lagrangian caustic does not *acquire* a homogeneous dimension at its fold.
The ADE-universality of caustics resurfaces at the level of the measured exponent.

The fix this program uses is **measure-theoretic** — stated for what it is:

> **The program's operational screen (a working rule, not a standard theorem).** A
> bracket-generating distribution has $Q > n$ on a set of **full measure** — the weights are
> a property of the distribution, present almost everywhere — while a Lagrangian catastrophe
> inflates the *estimator's* exponent only on its caustic, a codimension-1 **null set**. The
> screen therefore demands full-measure prevalence before reading $Q > n$ as sub-Riemannian.
> No converse is claimed: full-measure $Q > n$ is used as a screen against caustic
> counterfeits, not as a characterisation of sub-Riemannian geometry.

The program confirmed both sides: a Zel'dovich gravitational flow gives $Q > n$ at $0\%$ of sampled
points (folds are measure-zero), while a genuine magnetic contact structure gives $Q > n$ at
$100\%$. The selection rule, made quantitative, is: *not "is $Q > n$ somewhere?" but "is $Q > n$
almost everywhere?"*

## The rule, and its ledger

| System | Distribution | Bracket-generating? | $Q$ | Verdict |
|---|---|---|---|---|
| Anisotropic transport $D_\perp\ll D_\parallel$ | full rank, eccentric | n/a (Riemannian) | $= n$ | ✗ slow, not forbidden |
| $D_\perp \to 0$ | rank 1 | no (Frobenius) | — | ✗ integrable, severed |
| Gravitational flow | no distribution | — | $=n$ a.e. | ✗ a flow, and folds fake $Q{>}n$ on a null set |
| Magnetic field, $\mathbf B\neq0$ | rank $d$ flux lift | yes (curvature $\neq 0$) | $=d+2$ a.e. | ✓ |
| Rotating frame | flux lift, curvature $2\boldsymbol\omega$ | yes | $=d+2$ a.e. | ✓ |

Everything the series builds sits in the last two rows, and the discipline that keeps it honest is
the refusal to confuse them with the first three.

## References

- W.-L. Chow (1939). "Über Systeme von linearen partiellen Differentialgleichungen erster
  Ordnung." <em>Math. Ann.</em> 117, 98–105.
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their Geodesics and
  Applications</em>. AMS. (Chow–Rashevskii, Frobenius, the Ball–Box theorem.)
- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." Progr. Math. 144,
  Birkhäuser. (Homogeneous dimension.)
</div><!-- /.l-body -->
