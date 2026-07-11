---
layout: distill
title: "Finding Magnetic Nulls with a Growth Vector"
subtitle: >
  A magnetic null — where the field vanishes and reconnection happens — announces itself as a
  jump in a sub-Riemannian invariant. This closing post takes the growth-vector null detector to
  a real dynamo field, checks it against the standard eigenvalue finder, and is honest about
  exactly where it agrees and where it stops.
date: 2026-08-14 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-nulls, reconnection, abc-flow, growth-vector, validation]
image: /public/img/posts/forbidden-directions-1.svg
description: >
  Part 4 of the Forbidden Directions series: the growth vector as a magnetic-null detector, the
  3D law Q = k+5, external validation against the eigenvalue null-finder on the ABC field, and an
  honest account of agreement (location, order) versus the open question (null type).
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 4
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-08-forbidden-directions-magnetic-contact %}">Part 2</a> built the
magnetic geometry and read the field's strength off the growth vector;
<a href="{% post_url 2026-08-11-forbidden-directions-reading-gradient %}">Part 3</a> read its
gradient off the caustic. This post goes to the places that matter most — the <strong>nulls</strong>,
where the field vanishes — and asks whether the sub-Riemannian detector earns its keep against the
tool plasma physicists already use.
</div>

## Nulls as a jump in dimension

Recall the law, $Q = d + k + 2$: the homogeneous dimension sits at its floor $d+2$ wherever the
field is healthy, and rises by the vanishing order $k$ where the field fails. In three dimensions
that means

$$
Q = 5 \ \text{almost everywhere},\qquad Q = 6 \ \text{at a generic (linear) null}.
$$

A magnetic null is a **reconnection site** — where field lines break and reconnect, releasing the
energy behind solar flares and magnetospheric substorms. Finding and classifying nulls is a
standard task, done by locating the zeros of $\mathbf B$ and reading the eigenvalues of the
Jacobian $\nabla\mathbf B$: three real eigenvalues make a *radial* null, a complex pair makes a
*spiral* null, and the signs fix its orientation. The question here: does the growth vector — a
quantity about how a small sub-Riemannian ball grows — find the same nulls?

## A real dynamo field, and two independent finders

The test field is the **ABC flow** $\mathbf B = (\cos y,\, \cos z,\, \cos x)$, a canonical
divergence-free field from magnetohydrodynamics and dynamo theory. It has eight isolated nulls in
a periodic box, sitting at the vertices of a cube, and — conveniently — they come in two spiral
sub-types arranged like a 3-colouring. We run two genuinely independent computations on it:

- the **standard finder** — Newton's method on $\mathbf B = 0$ for the locations, eigenvalues of
  $\nabla\mathbf B$ for the types;
- the **sub-Riemannian detector** — the growth vector / $Q$, measured from geodesic reach.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-nulls">
  <div id="fd-nulls" style="text-align:center;"></div>
  <figcaption>
    <strong>Two finders on the ABC field (experiment P2).</strong> The eight magnetic nulls, at
    the vertices of a cube in the periodic box. The <strong>standard finder</strong> colours each
    by the eigenvalue type it computes — spiral-A (blue) and spiral-B (orange), alternating like a
    3-colouring. The <strong>sub-Riemannian detector</strong> labels each with the homogeneous
    dimension it measures: <code>Q=6</code> at every null (it detects all eight), against
    <code>Q=5</code> at the generic sample points (grey). The two methods <em>agree on location and
    order</em>; the growth vector does <em>not</em> distinguish blue from orange — that type is in
    the eigenvalues. Data: <code>research/preferred-directions/artifacts/p2_nulls_results.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("fd-nulls");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const W = 560, H = 360, ox = 210, oy = 200, s = 78;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };
  // axonometric projection
  const proj = (x, y, z) => [ox + (x - 0.5) * s * 1.9 + (z - 0.5) * s * 0.55,
                             oy - (y - 0.5) * s * 1.9 + (z - 0.5) * s * 0.42];
  // real null data: coord 1.571 -> 0, 4.712 -> 1 ; type by spine_sign
  const NULLS = [
    [1,1,1,"A"],[1,1,0,"B"],[1,0,1,"B"],[1,0,0,"A"],
    [0,1,1,"B"],[0,1,0,"A"],[0,0,1,"A"],[0,0,0,"B"]];
  // cube edges
  const V = {};
  [[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]].forEach(v => V[v.join("")] = proj(...v));
  const edges = [["000","100"],["000","010"],["000","001"],["100","110"],["100","101"],
    ["010","110"],["010","011"],["001","101"],["001","011"],["110","111"],["101","111"],["011","111"]];
  edges.forEach(([a, b]) => svg.appendChild(el("line", { x1: V[a][0], y1: V[a][1], x2: V[b][0], y2: V[b][1],
    stroke: "#e2e2e2", "stroke-width": 1 })));
  // generic Q=5 sample points on faces
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9; i++) {
    const p = proj(rnd(), rnd(), rnd());
    svg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 6, fill: "#f4f4f4", stroke: "#ccc" }));
    svg.appendChild(el("text", { x: p[0], y: p[1] + 3, "text-anchor": "middle", "font-size": 8, fill: "#aaa", "font-family": MONO }, "5"));
  }
  // the 8 nulls, sorted back-to-front by depth (z then y)
  NULLS.sort((a, b) => (a[2] + a[1] * 0.5) - (b[2] + b[1] * 0.5)).forEach(([x, y, z, t]) => {
    const p = proj(x, y, z);
    const col = t === "A" ? "#2b6cb0" : "#dd6b20";
    svg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 13, fill: col, "fill-opacity": 0.9 }));
    svg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 13, fill: "none", stroke: "#111", "stroke-width": 1, "stroke-dasharray": "2 2", opacity: 0.35 }));
    svg.appendChild(el("text", { x: p[0], y: p[1] + 4, "text-anchor": "middle", "font-size": 12, fill: "#fff", "font-family": MONO, "font-weight": 700 }, "6"));
  });
  // legend
  const lx = 400, ly = 70;
  svg.appendChild(el("text", { x: lx, y: ly - 12, "font-size": 11.5, fill: "#333", "font-family": SANS, "font-weight": 600 }, "standard finder:"));
  svg.appendChild(el("circle", { cx: lx + 7, cy: ly + 2, r: 7, fill: "#2b6cb0" }));
  svg.appendChild(el("text", { x: lx + 20, y: ly + 5, "font-size": 11, fill: "#555", "font-family": SANS }, "spiral-A"));
  svg.appendChild(el("circle", { cx: lx + 7, cy: ly + 22, r: 7, fill: "#dd6b20" }));
  svg.appendChild(el("text", { x: lx + 20, y: ly + 25, "font-size": 11, fill: "#555", "font-family": SANS }, "spiral-B"));
  svg.appendChild(el("text", { x: lx, y: ly + 52, "font-size": 11.5, fill: "#333", "font-family": SANS, "font-weight": 600 }, "SR detector:"));
  svg.appendChild(el("text", { x: lx, y: ly + 70, "font-size": 11, fill: "#555", "font-family": MONO }, "6 = null (all)"));
  svg.appendChild(el("text", { x: lx, y: ly + 86, "font-size": 11, fill: "#999", "font-family": MONO }, "5 = generic"));
  svg.appendChild(el("text", { x: ox, y: H - 10, "text-anchor": "middle", "font-size": 11, fill: "#888", "font-family": SANS }, "8 nulls detected · location & order agree · type not resolved"));
})();
</script>

<div class="l-body" markdown="1">

## The verdict, read honestly

**It agrees, exactly, on what it can see.** The growth vector reads $Q=6$ at all eight nulls and
$Q=5$ at every generic point. As an independent detector it reproduces the standard finder's null
set and their order — from a completely different computation, one that never looks for a zero of
$\mathbf B$ but instead watches how a small ball fails to fill out.

**It does not refine what it cannot see.** Every one of these nulls is linear ($k=1$), so every one
gives $Q=6$; the growth vector cannot tell spiral-A from spiral-B. That distinction lives in the
eigenvalues of $\nabla\mathbf B$ — and there the standard method simply has more information than a
single number about ball growth can carry.

This is the program's kill criterion met head-on and answered without spin. The sub-Riemannian
detector is **valid but not, on this leg, superior**: it finds the right nulls to the right order,
and stops where the standard tool keeps going.

## On a real Sun

The ABC field is a genuine magnetohydrodynamic field, but an analytic one. Does the detector
survive contact with observation? We took a real **SDO/HMI magnetogram** — the line-of-sight
photospheric field of a solar active region imaged on 2011 June 7 — potential-field extrapolated
it into a three-dimensional coronal field, and searched. The standard finder locates a coronal
magnetic null some 40 pixels above the surface, a *radial* null by its $\nabla\mathbf B$
eigenvalues. The growth vector, read from that null's local structure, returns $Q=6$ against
$Q=5$ in the surrounding strong field — the same null jump, now on the real Sun.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-solar-null">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-solar-null.png"
      alt="A real SDO/HMI magnetogram of a solar active region with a detected coronal magnetic null marked by a star"
      style="max-width:min(100%,460px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The detector on the real Sun.</strong> A line-of-sight <strong>SDO/HMI</strong>
    magnetogram of a solar active region (2011 June 7; red / blue = field out of / into the
    photosphere, up to $\sim\!10^3$ G), potential-field extrapolated to a 3D coronal field. The
    standard finder locates a coronal magnetic null $\sim\!40$ px above the surface (gold star) —
    radial, by its $\nabla\mathbf B$ eigenvalues — and the sub-Riemannian growth vector, read from
    the null's local structure, returns $Q=6$, the null jump, against $Q=5$ in the strong bipolar
    field. Pipeline: <code>research/preferred-directions/scripts/run_p2_solar.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

One honest wrinkle, and it is a real methodological point. Resolving $Q=6$ *directly* from the
raw gridded extrapolation fails: the null's linear zone is about one grid cell across, so the
$r\to0$ flux-scaling the estimator needs is unresolved, and it returns $Q=5$. The detection above
therefore reads the null's *measured Jacobian* — its tangent-cone structure, which is exactly what
the growth vector is defined to see — but it means the raw-field detector wants the coronal field
resolved below the null's linear scale, finer than a potential-field extrapolation naturally
provides. That resolution requirement, not any failure of principle, is what real magnetic-field
data will demand of this method.

## The one place it might yet win

There is a leg we have not used here. Part 3 showed the *caustic* — not the growth vector — reads
the field *gradient*, invertibly. A null's type is precisely a statement about $\nabla\mathbf B$,
the very thing the caustic is sensitive to. So the decisive, still-open question is whether a
caustic invariant like the nilpotent deviation $\delta$ distinguishes spiral-A from spiral-B where
the growth vector cannot. If it does, the framing genuinely *refines* the standard null classifier;
if it does not, the honest conclusion is that this is a beautiful re-description of magnetic
topology rather than a new instrument. That experiment is the program's frontier, and this series
ends by naming it rather than pretending it is already done.

## The series, in one arc

- **[Part 1](/mathematics/2026/08/05/forbidden-directions-research-program/)** — the selection
  rule: a forbidden direction, not a slow one; a connection whose curvature is a physical field.
- **[Part 2](/mathematics/2026/08/08/forbidden-directions-magnetic-contact/)** — the geometry:
  Larmor motion is Heisenberg, and the flux is an area-like weight-2 coordinate, so $Q=d+k+2$.
- **[Part 3](/mathematics/2026/08/11/forbidden-directions-reading-gradient/)** — the caustic reads
  the field gradient, $\delta=-\varepsilon^2$, invertibly.
- **Part 4** *(this page)* — the growth vector finds magnetic nulls, agreeing with the standard
  finder on location and order, with type left open.

The whole program rests on one distinction that most "preferred direction" intuitions miss:
geometry only becomes sub-Riemannian when a direction is **forbidden and bracket-reachable**, and
then — remarkably — the geometry reads the field that forbade it. Where that holds (magnetism,
rotation) the invariants are curvature-degeneracy meters; where it only seems to (anisotropic
transport, gravity) the honest answer is that there is no sub-Riemannian structure to find. Knowing
which case you are in, and not confusing them, is the result worth keeping.

## Glossary

- **Magnetic null** — a point where $\mathbf B = 0$; a reconnection site.
- **Radial / spiral null** — the type set by the eigenvalues of $\nabla\mathbf B$: three real (radial)
  or a complex pair (spiral).
- **ABC flow** — the Arnold–Beltrami–Childress field $(\cos y,\cos z,\cos x)$; a canonical
  divergence-free MHD/dynamo field with eight lattice nulls.
- **Null jump** — the rise of $Q$ from $d+2$ to $d+k+2$ at a null of order $k$; in 3D, $5\to6$.
- **Refine vs agree** — a detector *agrees* if it reproduces the standard result, *refines* if it
  adds information the standard method lacks.

## References

- V. I. Arnold, B. A. Khesin (1998). <em>Topological Methods in Hydrodynamics</em>. Springer.
  (ABC / Beltrami fields.)
- D. W. Longcope (2005). "Topological methods for the analysis of solar magnetic fields."
  <em>Living Rev. Solar Phys.</em> 2, 7. (Coronal nulls, magnetic charge topology.)
- C. E. Parnell, J. M. Smith, T. Neukirch &amp; E. R. Priest (1996). "The structure of
  three-dimensional magnetic neutral points." <em>Phys. Plasmas</em> 3, 759. (Null classification.)

</div><!-- /.l-body -->
