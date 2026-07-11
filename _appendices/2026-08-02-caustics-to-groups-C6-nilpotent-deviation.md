---
layout: distill
title: "Appendix C6 — The Nilpotent-Deviation Statistic"
subtitle: >
  The quantitative heart of the inverse method. Not "which germ is this?" but "how
  far does the observed conjugate locus depart from the caustic of its own tangent
  cone?" This appendix defines that deviation, gives the working proxy the code uses,
  and is honest about the one place it is coordinate-dependent.
date: 2026-08-02 09:00:00
categories: [mathematics]
tags: [sub-riemannian, conjugate-locus, nilpotent-approximation, invariants, matching]
description: >
  Companion appendix to the caustics-to-groups series: the nilpotent-deviation
  matching statistic, the Hausdorff shape distance from the observed conjugate locus
  to the tangent cone's caustic, the refocusing-time proxy the code uses, the
  Heisenberg-vs-SE(2) split, and an honest note on parametrization dependence.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C6
permalink: /mathematics/2026/08/02/caustics-to-groups-C6-nilpotent-deviation/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
This is the statistic the whole inverse method is built around. The
<a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">scoping post</a>
insists the right question is not raw germ classification but the <em>deviation</em> of
the observed conjugate locus from its nilpotent reference. This appendix defines that
deviation precisely, gives the concrete proxy the code computes, shows it breaking the
Heisenberg/SE(2) alias — and flags, honestly, where it is only a proxy.
</div>

## The right question

Appendices C2–C4 build to one conclusion: a caustic germ is universal (group-blind), but the
*departure* of a group's conjugate locus from its tangent cone's is not. The tangent cone
(Appendix C3) is the flat, maximally-symmetric model with the same bracket structure; a real
group's caustic looks like the cone's up close and deviates from it at finite scale, and *that
deviation is the individual signature*. So the matching statistic is a **distance to the
reference**, not a label.

## The definition

Let $C_{\mathrm{obs}}$ be the observed first conjugate locus near the pole, sampled in
SR-normal (dilation-adapted) coordinates, and let $C_{\mathrm{nil}}(\theta)$ be the conjugate
locus of the candidate tangent cone with growth vector $\theta$, in the same coordinates from
its known closed form. The **nilpotent-deviation statistic** is

$$
\delta(C_{\mathrm{obs}}, \theta) \;=\; \min_{g \in G_\theta}\;
d_{\mathrm{H}}\!\big(g \cdot C_{\mathrm{obs}},\; C_{\mathrm{nil}}(\theta)\big),
$$

where $d_{\mathrm{H}}$ is the Hausdorff distance between the two sampled sets and the minimum
is over $G_\theta$, the intrinsic symmetries (anisotropic dilations and rotations) of the
nilpotent model — so $\delta$ measures *shape*, not accidental scale or placement. The
recovered class is $\hat\theta = \arg\min_\theta \delta$, and the residual shape after the best
nilpotent match carries the moduli $(\chi,\kappa)$ of Appendix C4. This is the invariant in the
spirit of Sacchelli's (2019) caustic-stability analysis, which made the leading deviation of
the contact caustic from its nilpotent model explicit.

## The working proxy the code computes

Computing the full Hausdorff shape distance over the symmetry group is the target; the series'
working detector uses a scalar proxy that captures the same information for the decisive
Heisenberg/SE(2) split. The **refocusing-time law** is intrinsic where the parametrization is
standard: Heisenberg refocuses at exactly $t_c = 2\pi/|w|$ for vertical momentum $w$, so its
deviation from the flat law is identically zero. A curved group departs from it. The proxy
averages that fractional departure over a band of momenta:

$$
\delta \;=\; \Big\langle\, 1 - \tfrac{|w|}{2\pi}\, t_c(w) \,\Big\rangle_{w}.
$$

Measured by the code (`src/fingerprint.py`, detector `src/caustics.py`):

| Group | $\delta$ | reading |
|---|---|---|
| Heisenberg | $\approx 0.00$ | it *is* the flat model |
| SE(2) | $\approx 0.14$ | curved; refocuses early, more so at low momentum |

That gap — with a calibrated threshold near $0.07$ sitting cleanly between — is what breaks the
alias the growth vector cannot, and it holds up robustly under noise
([Part 3 confusion matrix](/mathematics/2026/07/22/caustics-to-groups-inverse-map/): the
Heisenberg and SE(2) rows never bleed into each other).

## An honest note on parametrization

The full statistic $\delta$ above is intrinsic by construction (Hausdorff distance in
SR-normal coordinates, minimized over symmetries). The refocusing-time **proxy** is intrinsic
only when the momentum $w$ is the standard vertical momentum of a faithful realization; it can
pick up spurious value under a non-standard reparametrization. The research log records exactly
this: an early attempt to build a curvature-tunable family produced a structure whose frame and
structure constants were inconsistent — not a valid geometry at all — and the proxy dutifully
reported a nonzero deviation for what should have been flat. The fix was twofold: a
`structure_constants_consistent` guard that now validates every group's frame against its
brackets (so only genuine geometries are ever measured), and the recognition that for real
groups in standard coordinates the proxy is sound, while the coordinate-free replacement — the
shape/dimension of the conjugate locus itself (Appendix C4) — is the right long-term invariant.
This is precisely the "coordinate error masquerading as geometry" failure the caveats warned
about, caught by a self-check rather than shipped.

## Where it sits in the method

The deviation $\delta$ is the second of the three fingerprint legs and the one that does the
finest work: the growth vector (C3) fixes the species, the abnormal bit (C5) corroborates the
class, and $\delta$ resolves the individual within a shared tangent cone. Together they are the
triple the scoping post specified — and $\delta$ is the number that turns "these two are the
same species" into "this one is Heisenberg and that one is SE(2)."

## References

- L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds
  and stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391.
  <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.
- A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J.
  Dyn. Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.
- El-H. Chakir El-Alaoui, J.-P. Gauthier &amp; I. Kupka (1996). "Small sub-Riemannian balls on
  $\mathbb{R}^3$." <em>J. Dyn. Control Syst.</em> 2, 359–421.
- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press.
</div><!-- /.l-body -->
