---
layout: distill
title: "Appendix C5 — Abnormal Geodesics: The Yes/No Fingerprint"
subtitle: >
  Sub-Riemannian geometry has a second, stranger kind of shortest path — the
  abnormal geodesic, forced by the shape of the constraints rather than the metric.
  Whether any exist is a coarse yes/no that splits whole classes of groups, and it
  turns out to be the most noise-robust leg of the fingerprint.
date: 2026-08-01 09:00:00
categories: [mathematics]
tags: [sub-riemannian, abnormal-geodesics, pontryagin, corank, optimal-control]
description: >
  Companion appendix to the caustics-to-groups series: normal vs abnormal extremals
  from the Pontryagin Maximum Principle, why abnormals depend only on the
  distribution, the corank criterion (contact none; Engel/Cartan/SE(3) yes), the
  straight-line abnormal of the trailer, and why the coarse bit outlasts the growth
  vector under noise.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C5
permalink: /mathematics/2026/08/01/caustics-to-groups-C5-abnormal-geodesics/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The third fingerprint leg is a single bit: does the geometry admit
<strong>abnormal</strong> shortest paths? This appendix explains what abnormals are,
why their existence is a topological property of the constraints alone, the corank
criterion that decides it for the series' groups, and why — surprisingly — this coarse
bit is the most noise-robust piece of the whole detector (experiment E2).
</div>

## Two kinds of extremal

Shortest paths in sub-Riemannian geometry come from the Pontryagin Maximum Principle, which
produces two families. **Normal** extremals are the ones you expect: solutions of the
geodesic Hamiltonian $H = \tfrac12\sum_i h_i^2$, projecting to smooth locally-minimizing
curves — these are what Appendices C3–C4 and the whole forward model deal with. But the
Principle also allows **abnormal** extremals, for which the metric drops out of the equations
entirely. An abnormal curve is a critical point of the *endpoint map* restricted to admissible
controls: a path so constrained by the *shape* of the allowed directions that it is forced,
regardless of how you measure length.

Abnormals are the delicate part of the subject. Whether a given abnormal curve is actually
*minimizing* — and how regular such minimizers are — is a genuinely hard, still-open corner of
the theory (Sard-type problems, the regularity of minimizers). That is why the series treats
this leg as **lower-confidence** and never lets it hard-gate a verdict.

## Existence is topological: the corank criterion

For our purposes the useful fact is coarse and robust: **whether nontrivial abnormals exist at
all** is a topological property of the distribution, governed by its **corank** = ambient
dimension − rank:

- **Rank-2, corank-1 (contact) structures** — Heisenberg, SE(2), and the other 3D contact
  groups — have **no** nontrivial abnormal minimizers. The distribution is "fat" enough that
  the endpoint map is a submersion; nothing is forced.
- **Higher-corank structures** — Engel (corank 2), Cartan (corank 3), SE(3) (corank 3) —
  **do** admit abnormals. There are directions in which the geometry is constrained enough to
  force particular curves.

So a single yes/no bit cleanly partitions the candidate list: $\{$contact: Heisenberg,
SE(2)$\}$ versus $\{$Engel, Cartan, SE(3)$\}$. It is orthogonal to the within-class questions
the growth vector and the moduli answer.

## The trailer's straight line

The cleanest concrete abnormal is the Engel one — the car with a trailer of
[Appendix C1](/mathematics/2026/07/28/caustics-to-groups-C1-model-groups-by-example/). Drive
**dead straight**, cab and trailer aligned and unmoving: that motion is an abnormal extremal.
It owes its special status not to being shortest in any metric sense but to sitting on a
singular stratum of the constraints — the configurations where the trailer angle cannot be
independently steered. Ardentov &amp; Sachkov (2017) located exactly these abnormal strata in
the Engel cut locus; the analogous straight strata appear in Cartan.

## Why the coarse bit is the robust one (experiment E2)

Here is the counter-intuitive payoff. The abnormal bit asks only *how many directions can you
drive?* — the rank of the distribution against the ambient dimension. That is a far coarser
question than resolving the full growth vector, which needs the fragile high-weight
coordinates. So it survives noise that destroys the fine estimate. In the code (metric M4,
`src/growth.py`), the bit is read from the count of weight-1 coordinates, and the experiments
show the gap starkly: at a noise level where the *full growth vector* for Cartan is recovered
0% of the time, the *abnormal bit* is still correct 100% of the time
([E2](/mathematics/2026/07/22/caustics-to-groups-inverse-map/)).

The fingerprint's legs therefore have **complementary noise profiles**: when the growth vector
collapses a high-step group to "unknown", the abnormal bit still assigns it to the correct
coarse class ("non-contact"). The
[Part 3 classifier](/mathematics/2026/07/22/caustics-to-groups-inverse-map/) uses exactly this
fallback, which is why its class-level accuracy barely moves as its exact-group accuracy falls.

## The honest caveat

The corank criterion tells you abnormals *exist*; it is not yet a detector of abnormal
*minimizers in caustic data*. Building that — finding actual abnormal geodesics in an observed
field, robustly, given the open regularity questions — is the genuinely hard piece the series
flags as future work. The coarse existence bit is what is used today, and it is used only as
corroboration and graceful fallback, never as a hard gate.

## References

- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press. (Abnormal extremals, PMP.)
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their Geodesics and
  Applications</em>. AMS. (The first strictly abnormal minimizer.)
- A. A. Ardentov &amp; Yu. L. Sachkov (2017). "Maxwell strata and cut locus in the
  sub-Riemannian problem on the Engel group." <em>Regul. Chaotic Dyn.</em> 22, 909–936.
  <a href="https://arxiv.org/abs/1710.00216">arXiv:1710.00216</a>.
- A. Belotto da Silva, A. Figalli, A. Parusiński &amp; L. Rifford (2022). "Strong Sard
  conjecture and regularity of singular minimizing geodesics for analytic sub-Riemannian
  structures." <em>Invent. Math.</em> 229, 395–448.
</div><!-- /.l-body -->
