---
layout: distill
title: "Appendix C2 — Caustics as Lagrangian Singularities (Arnol'd's ADE List)"
subtitle: >
  What a caustic actually is — the singular set of a Lagrangian map — and why the
  local shapes you ever see come from one short universal list: fold, cusp,
  swallowtail, umbilic. That universality is the obstruction the whole series is
  built around: a lone cusp is group-blind.
date: 2026-07-29 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, singularity-theory, catastrophe-theory, lagrangian]
description: >
  Companion appendix to the caustics-to-groups series: caustics as critical-value
  sets of Lagrangian maps, Arnol'd's ADE classification of their local germs (A2
  fold, A3 cusp, A4 swallowtail, D4 umbilic), the coffee-cup and lensing examples,
  and why local germ universality makes single caustics group-blind.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C2
permalink: /mathematics/2026/07/29/caustics-to-groups-C2-lagrangian-singularities/
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The <a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">scoping post</a>
states that local caustics are group-blind. This appendix explains why, and separates
what is a theorem from what is this program's working hypothesis. It
defines a caustic precisely (the singular set of a Lagrangian map), states Arnol'd's
classification of the local shapes a <em>generic</em> such singular set can take, says
where a sub-Riemannian exponential map is and is not covered by it, reports the numerical
check made for the series' groups, and draws the
conclusion that a single local germ carries no information about the group that
produced it — which is exactly why the detector must read a <em>global</em> triple
instead.
</div>

## A caustic is where a flow of paths focuses

Shine light into a coffee cup: the bright, cusped curve on the surface is a **caustic**.
It is where reflected rays *pile up* — where a whole family of paths, spread out a moment
before, momentarily focus onto the same points. The same object appears wherever paths
focus: the bright folds and cusps of a gravitational lens, the shell-crossing walls of
the cosmic web, and — the subject of this series — the **conjugate locus** of a
sub-Riemannian geometry, where a family of geodesics leaving one point refocuses.

Mathematically these are all one thing. A family of paths is packaged as a **Lagrangian
map**: the projection down to ordinary space of a special half-dimensional surface carried
along by a Hamiltonian flow. Where that projection is a local diffeomorphism, paths spread
smoothly; where its differential drops rank, they focus. The **caustic** is precisely the
set of *critical values* of the Lagrangian map — the image of the points where its
Jacobian degenerates. For a sub-Riemannian structure the Lagrangian map is the exponential
map (Appendix C4), and its caustic is the conjugate locus.

## Arnol'd's list: the only shapes you ever see

Here is the remarkable fact. A generic Lagrangian caustic cannot look like *anything* — up
to smooth change of coordinates, its local pieces come from a **short universal list**,
Arnol'd's classification of Lagrangian singularities. Precisely: Lagrangian maps of
manifolds of dimension $n \le 5$ that are in general position (an open dense set of maps)
are stable, and each of their germs is equivalent to one of finitely many normal forms
$A_k$, $D_k$, $E_6$ determined by $n$ alone; from $n = 6$ on, continuous moduli appear and
the list is no longer finite. In low dimension the players are:

| Germ | Name | Local model | Where you see it |
|---|---|---|---|
| $A_2$ | fold | smooth edge | the bright boundary of any caustic |
| $A_3$ | cusp | $y^2 = x^3$ | the point of the coffee-cup curve; lensing cusps |
| $A_4$ | swallowtail | discriminant of $t^4 + a t^2 + b t + c$ | the point on a caustic surface where a cuspidal edge meets a self-intersection line |
| $D_4$ | umbilic | elliptic/hyperbolic | isolated highly-symmetric focal points |

The labels $A_k, D_k$ are the same ones that classify simply-laced simple Lie algebras and du Val
surface singularities — the "ADE" pattern that recurs across mathematics. The point for us
is blunt: **the same fold and the same cusp appear in optics, in cosmology, and — wherever
the exponential map is generic in the sense above — in the conjugate loci of the series'
groups.** They are universal. Whether a given group's exponential map *is* generic at a
given point is a separate question, taken up below.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-cusp">
  <div id="c2g-cusp" style="text-align:center;"></div>
  <figcaption>
    <strong>The cusp germ $A_3$.</strong> The simplest caustic singularity after the
    fold (a generic caustic point is a smooth fold; cusps are the isolated points where
    folds end): two smooth fold branches ($A_2$) meeting at a cusp along the exact semicubical curve $y^2 = x^3$. This
    is the shape at the point of the coffee-cup caustic and at a lensing cusp. Crucially, it
    is <em>identical</em> whichever flow produced it: read locally, a cusp names no group.
    (Schematic of the normal form; experiment E11, below, locates such cusps numerically
    on the SE(2), Engel and Cartan conjugate loci.) Axes are dimensionless local
    coordinates centred on the cusp.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-cusp");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const MONO = "'JetBrains Mono', monospace";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 440, H = 260, cx = 150, cy = 130, S = 95;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "440px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };
  // axes
  svg.appendChild(el("line", { x1: 30, y1: cy, x2: W - 20, y2: cy, stroke: "#e0e0e0", "stroke-width": 1 }));
  svg.appendChild(el("line", { x1: cx, y1: 20, x2: cx, y2: H - 20, stroke: "#e0e0e0", "stroke-width": 1 }));
  // semicubical cusp: x = t^2, y = t^3, opening to +x, cusp at origin
  const pts = [];
  for (let t = -1.25; t <= 1.25; t += 0.02) {
    pts.push([cx + S * (t * t) * 1.1, cy - S * (t * t * t) * 0.62]);
  }
  svg.appendChild(el("polyline", { points: pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "),
    fill: "none", stroke: "#e65100", "stroke-width": 2.4, "stroke-linecap": "round" }));
  svg.appendChild(el("circle", { cx: cx, cy: cy, r: 3.4, fill: "#e65100" }));
  svg.appendChild(el("text", { x: cx - 8, y: cy - 8, "text-anchor": "end", "font-size": 12, fill: "#e65100", "font-family": MONO }, "cusp"));
  svg.appendChild(el("text", { x: cx + S * 1.3, y: cy - S * 0.55, "font-size": 12.5, fill: "#e65100", "font-family": MONO }, "y² = x³"));
  svg.appendChild(el("text", { x: cx + 40, y: cy + 62, "font-size": 11.5, fill: "#888", "font-family": SANS }, "two folds (A₂) meet at the cusp (A₃)"));
})();
</script>

<div class="l-body" markdown="1">

## The obstruction, stated exactly

Combine "caustics are Lagrangian singularities" with "their generic local germs come from
one universal list" and you get the wall the whole series is designed around. It has a
proved part and a hypothesised part.

> **Theorem (Arnol'd).** At a point where a Lagrangian map of dimension $\le 5$ is generic
> (stable), its caustic germ is one of the ADE normal forms, the same list for every
> Hamiltonian. Away from the pole and from abnormal trajectories the sub-Riemannian
> exponential map is a Lagrangian map, so at every such point where it is generic its
> caustic germ is on that list, whatever the group.
>
> **Working hypothesis (this program): local generic caustics are group-blind.** For each
> candidate group, a generic point of the conjugate locus away from the pole, the abnormal
> set and symmetry-degenerate pieces is such a point. Hand someone a small patch of caustic
> there — a fold, a cusp — and ask which group produced it. They cannot answer, because
> that exact patch is produced by *all* of them. Any detector that keys on a local germ is
> fitting a universal, not a group.

The gap between the two is real. A left-invariant exponential map is one particular,
highly symmetric map, and the theorem's genericity is not automatic for it:

- **The pole.** Every sub-Riemannian exponential map is degenerate at the starting point,
  and the conjugate locus accumulates there; this singularity is never on Arnol'd's list.
  It is where the group information lives (Appendix C4).
- **Abnormal trajectories** (Engel, Cartan) are not projections of the Hamiltonian flow and
  lie outside the Lagrangian picture (Appendix C5).
- **Symmetry.** Heisenberg's rotational symmetry collapses its whole first conjugate locus
  onto a line: no point of it is a fold. Experiment E11 (below) finds the same kind of
  collapse on a thin part of the Engel and Cartan loci and on the whole first conjugate
  locus of the nilpotent cone of $\mathrm{SE}(3)$.
- **Dimension.** $\mathrm{SE}(3)$ is 6-dimensional, beyond the finite list.

**What was checked.** For generic 3D contact structures the caustic germs near the pole
are classified in the literature (Agrachev, Charlot, Gauthier &amp; Zakalyukin 2000; Bonnet,
Gauthier &amp; Rossi 2019). For the series' groups, experiment E10
(`research/caustics-to-groups/scripts/run_e10.py`, results in
`artifacts/e10_results.json`) tests the fold condition directly. At the first conjugate
point $p^\*$ of a random normal geodesic it computes the Jacobian $D\exp(p^\*)$ and three
numbers: the *corank gap* $s_{n-1}/s_1$ (ratio of second-smallest to largest singular
value; positive means corank exactly 1), the residual $s_n/s_1$ (zero at a critical point),
and the *transversality* $\lvert\nabla\det D\exp\cdot v\rvert/\lvert\nabla\det D\exp\rvert$ with $v$ the
kernel direction — the cosine of the angle between the kernel and the normal to the
critical hypersurface. A fold is corank 1 with nonzero transversality.

| Group | conjugate points found | corank gap (min) | residual (max) | transversality (min / median) | folds |
|---|---|---|---|---|---|
| Heisenberg (control) | 24 of 24 | 0.42 | $2\times10^{-8}$ | $5\times10^{-9}$ / $5\times10^{-8}$ | 0 of 24 |
| SE(2) | 24 of 24 | 0.38 | $2\times10^{-8}$ | 0.10 / 0.28 | 24 of 24 |
| Engel | 24 of 24 | 0.010 | $1\times10^{-8}$ | 0.0035 / 0.14 | 24 of 24 |
| Cartan | 24 of 24 | 0.0021 | $1\times10^{-9}$ | 0.0015 / 0.050 | 24 of 24 |

(24 covectors per group, seed 0, vertical momenta of magnitude 1–3; fold threshold on
transversality $10^{-3}$, four orders above the Heisenberg floor.) So at sampled generic
points the first conjugate locus of SE(2), Engel and Cartan is a fold, and the test
correctly refuses the Heisenberg axis. This is a sample, not a proof, and it covers folds
only.

**Cusps, and dimension 6 (experiment E11).** A cusp is a critical point of corank 1 where
the kernel $v$ is *tangent* to the critical set — the signed transversality $\tau$ vanishes
— and the tangency is simple: $\tau$ changes sign along the curve in the critical set that
leaves $p^\*$ in the direction $v$. The image of that curve is then semicubical,
$a s^2 + b s^3$. E11 (`scripts/run_e11.py`, `artifacts/e11_results.json`; hypotheses and
tolerances fixed before the run in `docs/E11-cusp-germs.md`) follows loops of initial
covectors (96 per loop, vertical momenta fixed), solves for the zeros of $\tau$ along the
first conjugate locus, and tests each one: $\lvert\tau\rvert \le 10^{-4}$ with a sign
change across the loop, corank 1, a simple zero, and fitted image exponents within
$2 \pm 0.2$ and $3 \pm 0.4$.

| Group | covectors searched | tangency points located | pass every cusp test | cusp on a finer scale (post hoc) | degenerate tangency (not a cusp) | undecided |
|---|---|---|---|---|---|---|
| SE(2) (calibration) | 384 | 16 | 16 (4 per loop) | — | 0 | 0 |
| Engel | 576 | 21 | 7 | 10 | 4 | 0 |
| Cartan | 576 | 38 | 16 | 7 | 10 | 5 |

SE(2) is the calibration: the four cusps per loop of the 3D contact theory are all found,
so the method is trusted. On Engel and Cartan standard cusps exist (fitted exponents
1.93–2.10 and 2.99–3.18 on the points that pass). But 4 Engel and 10 Cartan tangency points
are **not** cusps: $\tau$ keeps its sign along the kernel curve, also at doubled resolution.
At 10 of these 14 the first conjugate time is a period of the covector's motion and a whole
one-parameter family of geodesics arrives at one point — Heisenberg's mechanism on a thin
subset of the locus; at the other 4 the mechanism is not identified. A generic Lagrangian
map has no such stratum, so this is the symmetry exception at work inside Engel and Cartan.
Two Cartan loops are the same up to the rotation symmetry, so its distinct counts are 32
located and 13 passing. Intervals of the loops where the conjugate time jumps were skipped,
so the search is not exhaustive.

The same fold test as E10, in dimension 6 (24 covectors each): on the nilpotent tangent
cone of $\mathrm{SE}(3)$ 0 of 24 are folds — the kernel is tangent to the critical set
everywhere (transversality $\le 8\times10^{-7}$), a collapse like Heisenberg's; on the
curved group $\mathrm{SE}(3)$ 23 of 24 are folds (transversality median 0.015; the 24th
is at $1.1\times10^{-4}$, below the $10^{-3}$ threshold). For $n = 6$ Arnol'd's finite list
no longer guarantees stable germs, so this supports the hypothesis at fold points only.

Still unverified: swallowtails and higher germs, later conjugate points, the normal form
of the degenerate stratum. All of the above is numerics at sampled points, not proof.

This is not pessimism; it is a **specification**. It tells you precisely where *not* to
look (single local germs) and forces the design that the rest of the series follows: read
structure that the ADE germs cannot carry — the **tangent-cone growth vector** (Appendix
C3), the **symmetry and moduli of the whole conjugate locus at the pole** (C4), and the
**abnormal stratum** (C5) — never one cusp. The detector's target is that triple, and the
quantitative statistic is the *deviation* of the observed conjugate locus from its own
tangent cone's (C6), not the germ type.

## Why the exponential map is a Lagrangian map

For completeness: the sub-Riemannian normal geodesics are the projections of the flow of a
Hamiltonian $H = \tfrac12\sum_i h_i^2$ on the cotangent bundle. The cotangent fibre over
$q_0$, carried by that flow for unit time, is a Lagrangian submanifold; the exponential map
$\exp_{q_0}(p) = \gamma_p(1)$ is its projection to the manifold. So, for normal geodesics and away from $p = 0$, the conjugate
locus — the critical values of $\exp_{q_0}$ — is a genuine Lagrangian caustic. Arnol'd's
classification applies to it at every point where this particular map is generic, which is
what the hypothesis above asserts and experiments E10 and E11 sample. The code's caustic
detector (`src/caustics.py`) finds it as the first zero of the Jacobian determinant of that
map.

## References

- V. I. Arnol'd (1990). <em>Singularities of Caustics and Wave Fronts</em>. Kluwer.
- V. I. Arnol'd, S. M. Gusein-Zade &amp; A. N. Varchenko (1985). <em>Singularities of
  Differentiable Maps, Vol. I</em>. Birkhäuser.
- A. Agrachev, G. Charlot, J.-P. Gauthier &amp; V. Zakalyukin (2000). "On sub-Riemannian
  caustics and wave fronts for contact distributions in the three-space." <em>J. Dyn.
  Control Syst.</em> 6, 365–395.
- B. Bonnet, J.-P. Gauthier &amp; F. Rossi (2019). "Generic singularities of the 3D-contact
  sub-Riemannian conjugate locus." <em>C. R. Acad. Sci. Paris, Ser. I</em> 357, 542–549.
  <a href="https://arxiv.org/abs/1812.01508">arXiv:1812.01508</a>.
- T. Poston &amp; I. Stewart (1978). <em>Catastrophe Theory and Its Applications</em>. Pitman.
</div><!-- /.l-body -->
