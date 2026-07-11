---
layout: distill
title: "The Forward Map: Caustics of the Model Groups"
subtitle: >
  Before you can reverse a map you have to understand it forwards. This post meets
  the four model groups of the series — Heisenberg, SE(2), Engel, Cartan — computes
  their caustics from a single geodesic engine, and shows the obstruction in the
  flesh: zoomed in, their caustics are identical, but the <em>rate</em> at which each
  group's hidden dimensions fill in — its growth vector — is a fingerprint you can
  measure. All numbers here come from the real code in <code>research/caustics-to-groups/</code>.
date: 2026-07-18 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, lie-groups, carnot-groups, growth-vector, optimal-control]
image: /public/img/posts/caustics-groups-1.svg
description: >
  Part 2 of the caustics-to-groups series: the forward model. The Heisenberg, SE(2),
  Engel and Cartan sub-Riemannian geodesic flows from one Lie-Poisson engine; the
  Heisenberg conjugate locus in closed form; the ADE group-blindness obstruction made
  concrete; and the growth vector recovered from geodesic-spreading data (metric M1),
  with its measured noise/sample tradeoff.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: 2
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">Part 1</a>
scoped the reverse map — caustics in, group out — and named the wall in the way: local
caustics are <strong>group-blind</strong>. This post builds the <em>forward</em> map for
four concrete groups, so we have leakage-free ground truth to reverse. Everything below
is computed by the code in <code>research/caustics-to-groups/</code>; the figure is drawn
from its output, not hand-placed. Part 3 will run the inverse.
</div>

**One engine, four groups.** A sub-Riemannian group is a rule for moving: at each point
only certain directions are *allowed*, and length is measured under that restriction. The
allowed directions plus the group's bracket structure[^bracket] fully determine its
geodesics — the shortest paths — through one set of equations (the Lie–Poisson normal
flow[^liepoisson]). We implemented that engine once and fed it four groups:

- **Heisenberg** — the simplest: move forward/back and left/right in a plane, but every
  move also winds a third "height" coordinate by the area you sweep. It is the *flat*
  model, the reference every other group is measured against.
- **SE(2)** — the [visual cortex]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
  group, and the Dubins car: drive forward and steer, never slide sideways.
- **Engel** — a car towing one trailer: the trailer angle is a fourth coordinate you can
  only change indirectly.
- **Cartan** — the exotic $(2,3,5)$ case Élie Cartan singled out in 1910: think a car with
  *two* trailers, the richest of the small models.

## The Heisenberg caustic, exactly

Start with the flat model, because there we can compute everything by hand and check the
code against it. A Heisenberg geodesic launched from the origin projects to a **circle** in
the plane; as it goes around, the height coordinate climbs. Two facts, both proven and
both regression-locked by a golden-file test in the repo:

- every geodesic with vertical momentum $w$ **refocuses** at time $t_c = 2\pi/|w|$ — exactly
  when its circle closes;
- at that instant every geodesic in the family lands on the **same point of the central
  axis**, at height $|z| = \pi/w^2$.

So the Heisenberg **caustic** — the set where geodesics refocus — is just the vertical axis.
It is maximally degenerate: a whole circle of geodesics collapses onto one point. That
degeneracy is the signature of flatness, and it is the yardstick for everything else. (The
curved groups do *not* collapse so cleanly — their refocusing time drifts away from
$2\pi/|w|$, and that drift is the subject of Part 3.)

## The obstruction, in the flesh

Part 1 stated it as a theorem; here it is as a fact about these four groups. Zoom far enough
into the caustic of *any* of them and you see the same short list of shapes — a fold, a
cusp[^cusp] — the universal ADE germs. Hand someone a single cusp and ask which group it came
from and they cannot answer: the four are **locally identical**. A detector that keys on
"there is a cusp here" is reading noise. The information that separates the groups is not in
any one local shape; it is in how the *whole* geometry is organised. The first and coarsest
piece of that organisation is the growth vector.

## The growth vector: how fast the hidden dimensions fill in

Here is the idea that turns the obstruction into a measurement. In all four groups you may
only *drive* along two directions. Everything else — height in Heisenberg, the trailer
angles in Engel and Cartan — you reach **indirectly**, by combining allowed moves (drive a
little loop and you gain height without ever "moving up"). The question that separates the
groups is: *how hard* is each hidden dimension to reach?

Measure it by geodesic spreading. Shoot the allowed moves out to a length $r$ and watch how
far each coordinate ranges. A directly-drivable coordinate spreads in proportion to $r$. A
coordinate you reach through *one* combination of moves spreads like $r^2$ — much slower. One
that needs *two* nested combinations spreads like $r^3$, slower still. The exponents — how
many coordinates fill in at rate $r$, at $r^2$, at $r^3$ — are the **growth vector**[^growthvector].
The figure shows the real measured curves.

[^bracket]: The "bracket" of two allowed directions is the net displacement you get by moving along one, then the other, then back — a new direction reachable only in combination. It is what lets a car parallel-park into a spot it can't slide into directly.

[^liepoisson]: The equations of motion for the geodesics of a left-invariant structure, written in the group's own moving frame; one compact system that specialises to each group by plugging in its bracket structure.

[^cusp]: A cusp is the pointed singularity you see on the bright edge of light focused in a coffee cup — the generic caustic shape, and the same one every one of these groups shows locally.

[^growthvector]: Written $(n_1, n_2, \dots)$: $n_1$ directions fill in at rate $r$, then $n_2$ total by rate $r^2$, and so on. Heisenberg and SE(2) are $(2,3)$; Engel is $(2,3,4)$; Cartan is $(2,3,5)$.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-reach">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span style="font-size:0.85rem; color:#555;">how far each kind of coordinate ranges vs. how far you drive — log–log</span>
  </div>
  <div id="c2g-reach" style="text-align:center;"></div>
  <figcaption>
    <strong>The growth vector, measured (experiment E0).</strong> Each line is the
    <em>reach</em> of a coordinate (98th percentile of |value| across a fan of geodesics)
    versus geodesic length $r$, both axes logarithmic. A straight line on log–log is a power
    law; its <em>slope</em> is the exponent. Directly-drivable coordinates (slope&nbsp;1) fill
    in fastest; coordinates reached through one bracket (slope&nbsp;2) far slower; through two
    brackets (slope&nbsp;3) slower still. Counting how many coordinates sit at each slope gives
    the growth vector: Heisenberg and SE(2) are $(2,3)$ — two slope-1, one slope-2, nothing
    steeper; Engel adds a slope-3 coordinate → $(2,3,4)$; Cartan adds two → $(2,3,5)$. Slopes
    recovered from data: $0.97$–$0.98$, $1.95$–$2.00$, $2.8$. Points are measured; dashed
    guides are exact slopes 1, 2, 3. Data: <code>research/caustics-to-groups/artifacts/e0_results.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-reach");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const R = [0.12, 0.171, 0.243, 0.346, 0.493, 0.702, 1.0];
  // measured reach curves (from e0_results): representative coord per weight
  const W1 = [0.119, 0.169, 0.241, 0.342, 0.485, 0.682, 0.963]; // slope 1 (all groups)
  const W2 = [0.002, 0.005, 0.009, 0.019, 0.039, 0.078, 0.159]; // slope 2 (Heisenberg z)
  const W3 = [0.0006, 0.0009, 0.0018, 0.004, 0.011, 0.029, 0.079]; // slope 3 (Engel/Cartan)
  const W = 620, H = 400, mL = 58, mR = 120, mT = 18, mB = 48;
  const x0 = mL, x1 = W - mR, y0 = mT, y1 = H - mB;
  const lxmin = Math.log10(0.1), lxmax = Math.log10(1.05);
  const lymin = Math.log10(3e-4), lymax = Math.log10(1.2);
  const X = v => x0 + (Math.log10(v) - lxmin) / (lxmax - lxmin) * (x1 - x0);
  const Y = v => y1 - (Math.log10(v) - lymin) / (lymax - lymin) * (y1 - y0);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "620px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };

  // gridlines (decades)
  [1, 0.1, 0.01, 0.001].forEach(gy => {
    svg.appendChild(el("line", { x1: x0, y1: Y(gy), x2: x1, y2: Y(gy), stroke: "#eee", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: x0 - 6, y: Y(gy) + 3, "text-anchor": "end", "font-size": 10, fill: "#999", "font-family": MONO }, gy));
  });
  [0.1, 0.2, 0.5, 1.0].forEach(gx => {
    svg.appendChild(el("line", { x1: X(gx), y1: y0, x2: X(gx), y2: y1, stroke: "#eee", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: X(gx), y: y1 + 16, "text-anchor": "middle", "font-size": 10, fill: "#999", "font-family": MONO }, gx));
  });
  // exact-slope reference guides (dashed), anchored to the last point of each curve
  function guide(slope, anchorR, anchorV, col) {
    const rA = 0.13, vA = anchorV * Math.pow(rA / anchorR, slope);
    svg.appendChild(el("line", { x1: X(rA), y1: Y(vA), x2: X(anchorR), y2: Y(anchorV),
      stroke: col, "stroke-width": 1, "stroke-dasharray": "3 3", opacity: 0.5 }));
  }
  guide(1, 1.0, 0.963, "#2b6cb0"); guide(2, 1.0, 0.159, "#dd6b20"); guide(3, 1.0, 0.079, "#2f855a");

  function plot(vals, col, label, sub) {
    const pts = R.map((r, i) => `${X(r).toFixed(1)},${Y(vals[i]).toFixed(1)}`).join(" ");
    svg.appendChild(el("polyline", { points: pts, fill: "none", stroke: col, "stroke-width": 2 }));
    R.forEach((r, i) => svg.appendChild(el("circle", { cx: X(r), cy: Y(vals[i]), r: 2.6, fill: col })));
    const lx = X(R[R.length - 1]) + 8, ly = Y(vals[vals.length - 1]);
    svg.appendChild(el("text", { x: lx, y: ly, "font-size": 12, fill: col, "font-family": SANS, "font-weight": 600 }, label));
    svg.appendChild(el("text", { x: lx, y: ly + 13, "font-size": 10, fill: "#777", "font-family": SANS }, sub));
  }
  plot(W1, "#2b6cb0", "slope 1", "drive directly");
  plot(W2, "#dd6b20", "slope 2", "one bracket");
  plot(W3, "#2f855a", "slope 3", "two brackets");

  // axes
  svg.appendChild(el("line", { x1: x0, y1: y1, x2: x1, y2: y1, stroke: "#333", "stroke-width": 1 }));
  svg.appendChild(el("line", { x1: x0, y1: y0, x2: x0, y2: y1, stroke: "#333", "stroke-width": 1 }));
  svg.appendChild(el("text", { x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS }, "geodesic length r  (log)"));
  const yl = el("text", { x: 15, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS, transform: `rotate(-90 15 ${(y0 + y1) / 2})` }, "coordinate reach  (log)");
  svg.appendChild(yl);
})();
</script>

<div class="l-body" markdown="1">

## What the growth vector does and doesn't settle

The measurement is clean. From noisy geodesic samples the exponents come back at $0.97, 1.95,
2.8$ — round them and you read off the growth vector directly: **Heisenberg $(2,3)$, SE(2)
$(2,3)$, Engel $(2,3,4)$, Cartan $(2,3,5)$.** That already splits the four into three classes,
and it does so from data, respecting the obstruction — we never named a local cusp.

Two honest limits, both measured rather than asserted:

1. **Heisenberg and SE(2) are identical here.** Both are $(2,3)$; the growth vector *cannot*
   tell them apart, because it only sees the tangent cone[^tangentcone] — the infinitely-zoomed-in
   model — and both zoom down to the same flat Heisenberg. Splitting them needs the *shape* of
   the caustic at finite scale, which is Part 3.
2. **The steeper the coordinate, the more fragile.** A slope-3 coordinate reaches only $\sim
   r^3$ — a hair above zero at small $r$ (look how the green line hugs the floor). So it is the
   first thing noise erases: recovering Cartan's $(2,3,5)$ needs more samples and tolerates less
   noise than recovering Heisenberg's $(2,3)$. In the experiments, clean data gives every growth
   vector exactly; at one-percent position noise the contact groups still come back perfectly
   while Cartan's success rate falls — the price of reading a faint, high-order dimension.

That second point is not a defect to hide; it is the **sample-complexity-versus-noise tradeoff**
the program set out to map, and it falls straight out of the geometry: higher-step structure is
intrinsically harder to see.

## What's next

We now have four groups, their caustics, and a measurable coarse fingerprint that sorts them
into three classes. What remains is the hard and interesting half: telling **Heisenberg from
SE(2)** — the two the growth vector declares identical — by how far each one's caustic *deviates*
from the flat model. That deviation is the nilpotent-deviation statistic, and turning it into a
working classifier with an honest confusion matrix is **Part 3**.

[^tangentcone]: The shape a sub-Riemannian geometry approaches when you zoom infinitely far in at a point — always a "Carnot group", the model whose growth vector we are measuring. Two different groups can share one tangent cone, which is exactly why the growth vector cannot always tell them apart.

## Glossary

- **Sub-Riemannian group** — a group with a set of allowed directions of motion and a length
  measured only along them.
- **Geodesic** — a shortest path under that restricted notion of length.
- **Caustic / conjugate locus** — the set of points where a family of geodesics refocuses; the
  singular set of the "shoot geodesics in all directions" map.
- **Bracket** — the net new direction obtained by combining two allowed moves; what makes
  otherwise-unreachable coordinates reachable.
- **Growth vector $(n_1,n_2,\dots)$** — how many coordinates fill in at rate $r, r^2, r^3, \dots$;
  the coarse fingerprint measured in this post.
- **Tangent cone** — the infinitely-zoomed-in model of the geometry at a point; sets the growth
  vector and can be shared by different groups.
- **ADE germs** — the universal local caustic shapes (fold, cusp, …); the same for every group,
  hence group-blind.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to Sub-Riemannian Geometry</em>. Cambridge University Press.</li>
  <li>É. Cartan (1910). "Les systèmes de Pfaff à cinq variables et les équations aux dérivées partielles du second ordre." <em>Ann. Sci. ÉNS</em> 27, 109–192.</li>
  <li>Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 16, 1018–1039. <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.</li>
  <li>A. A. Ardentov &amp; Yu. L. Sachkov (2017). "Maxwell strata and cut locus in the sub-Riemannian problem on the Engel group." <em>Regul. Chaotic Dyn.</em> 22, 909–936. <a href="https://arxiv.org/abs/1710.00216">arXiv:1710.00216</a>.</li>
  <li>A. A. Ardentov &amp; E. Hakavuori (2022). "Cut time in the sub-Riemannian problem on the Cartan group." <em>ESAIM: COCV</em> 28, 12. <a href="https://arxiv.org/abs/2107.06730">arXiv:2107.06730</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
