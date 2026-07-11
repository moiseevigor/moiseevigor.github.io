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
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The <a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">scoping post</a>
asserts a theorem: local caustics are group-blind. This appendix explains why. It
defines a caustic precisely (the singular set of a Lagrangian map), states Arnol'd's
classification of the local shapes such singular sets can take, and draws the
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
Arnol'd's classification of Lagrangian singularities. In low dimension the players are:

| Germ | Name | Local model | Where you see it |
|---|---|---|---|
| $A_2$ | fold | smooth edge | the bright boundary of any caustic |
| $A_3$ | cusp | $y^2 = x^3$ | the point of the coffee-cup curve; lensing cusps |
| $A_4$ | swallowtail | quartic section | where a caustic surface self-crosses |
| $D_4$ | umbilic | elliptic/hyperbolic | isolated highly-symmetric focal points |

The labels $A_k, D_k$ are the same ones that classify simple Lie algebras and du Val
surface singularities — the "ADE" pattern that recurs across mathematics. The point for us
is blunt: **the same fold and the same cusp appear in optics, in cosmology, and in the
conjugate locus of every one of the series' five groups.** They are universal.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-cusp">
  <div id="c2g-cusp" style="text-align:center;"></div>
  <figcaption>
    <strong>The cusp germ $A_3$.</strong> The generic caustic point: two smooth fold
    branches ($A_2$) meeting at a cusp along the exact semicubical curve $y^2 = x^3$. This
    is the shape at the point of the coffee-cup caustic and at a lensing cusp. Crucially, it
    is <em>identical</em> whether the underlying flow came from Heisenberg, SE(2), Engel,
    Cartan, or SE(3): read locally, a cusp names no group. Axes are dimensionless local
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

Combine "caustics are Lagrangian singularities" with "their local germs come from one
universal list" and you get the wall the whole series is designed around:

> **Local generic caustics are group-blind.** Hand someone a small patch of a caustic — a
> fold, a cusp — and ask which group produced it. They cannot answer, because that exact
> patch is produced by *all* of them. Any detector that keys on a local germ is fitting a
> universal, not a group.

This is not pessimism; it is a **specification**. It tells you precisely where *not* to
look (single local germs) and forces the design that the rest of the series follows: read
structure that the ADE germs cannot carry — the **tangent-cone growth vector** (Appendix
C3), the **symmetry and moduli of the whole conjugate locus at the pole** (C4), and the
**abnormal stratum** (C5) — never one cusp. The detector's target is that triple, and the
quantitative statistic is the *deviation* of the observed conjugate locus from its own
tangent cone's (C6), not the germ type.

## Why the exponential map is a Lagrangian map

For completeness: the sub-Riemannian normal geodesics are the projections of the flow of a
Hamiltonian $H = \tfrac12\sum_i h_i^2$ on the cotangent bundle. The set of covectors of a
fixed energy, carried by that flow, sweeps out a Lagrangian submanifold; the exponential map
$\exp_{q_0}(p) = \gamma_p(1)$ is its projection to the manifold. So the conjugate
locus — the critical values of $\exp_{q_0}$ — is a genuine Lagrangian caustic, subject to
Arnol'd's classification, and everything above applies to it verbatim. The code's caustic
detector (`src/caustics.py`) finds it as the first zero of the Jacobian determinant of that
map.

## References

- V. I. Arnol'd (1990). <em>Singularities of Caustics and Wave Fronts</em>. Kluwer.
- V. I. Arnol'd, S. M. Gusein-Zade &amp; A. N. Varchenko (1985). <em>Singularities of
  Differentiable Maps, Vol. I</em>. Birkhäuser.
- A. Agrachev, G. Charlot, J.-P. Gauthier &amp; V. Zakalyukin (2000). "On sub-Riemannian
  caustics and wave fronts for contact distributions in the three-space." <em>J. Dyn.
  Control Syst.</em> 6, 365–395.
- T. Poston &amp; I. Stewart (1978). <em>Catastrophe Theory and Its Applications</em>. Pitman.
</div><!-- /.l-body -->
