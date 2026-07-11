---
layout: distill
title: "In the Wild: DW-MRI, and Where the Method Stays Silent"
subtitle: >
  The synthetic groups are conquered; now the real world. This closing post adds SE(3) —
  the geometry of diffusion-MRI fibre fields and 3D vision — shows the fingerprint gives a
  confident answer on genuinely group-structured data, and shows it correctly refusing to
  answer on the cosmic web, which isn't a group at all. The honest edge of the method, and
  where the series meets its two siblings.
date: 2026-07-26 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, SE3, DW-MRI, cosmic-web, inverse-problems]
image: /public/img/posts/caustics-groups-4.svg
description: >
  Part 4 (final) of the caustics-to-groups series: the SE(3) structure of DW-MRI and vision
  as the real-world target, the (3,6) rank-3 fingerprint, confident recovery on homogeneous
  group-structured fields, calibrated silence on effective (non-group) flows, and the honest
  scope where the method must abstain. Ties the series to Geometry of Seeing and the Cosmic Web.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: 4
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
Parts <a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">1</a>–<a href="{% post_url 2026-07-22-caustics-to-groups-inverse-map %}">3</a>
built and graded the reverse map on four textbook groups. This post takes it to the geometry
that actually shows up in data — <strong>SE(3)</strong>, the group behind diffusion-MRI fibre
tracking and 3D vision — and draws the honest line between where the method answers and where
it must stay silent.
</div>

**The group in the scanner.** When a radiologist images the brain's white matter with
diffusion MRI, each voxel records not just *where* water sits but which *direction* it
diffuses along — the local fibre orientation. The natural state space is position **plus**
orientation, $\mathbb{R}^3 \times S^2$, and the rule for tracing a fibre through it — move
forward, gently reorient, never teleport sideways — is a sub-Riemannian structure on the group
$\mathrm{SE}(3)$ of 3D rigid motions. This is not an analogy; it is the working geometry of
Duits' fibre-tracking pipelines and of the [visual cortex]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
model in three dimensions. So "which group made these caustics?" is, here, a real question with
a real answer.

**SE(3)'s fingerprint.** Where the earlier groups let you *drive* along two directions, the
fibre-tracking structure gives you **three**: move forward, and tilt the axis two ways. That
single change — rank three, not two — is loud in the growth vector. Its three brackets fill all
six dimensions of $\mathrm{SE}(3)$ in one step (tilting two ways generates a roll; tilting while
moving generates the two sideways translations), so its growth vector is $(3,6)$: three
coordinates that fill in fast, three more that fill in as $r^2$. No rank-two group can imitate a
rank-three one, so SE(3) is set apart from all four earlier groups the instant you measure it —
and the estimator recovers $(3,6)$ cleanly from the code's synthetic SE(3) fields.

## The two halves of the real-world test

A method you can trust has to do two opposite things well: **answer** when the data really is a
group, and **refuse** when it isn't. We tested both by sampling the local growth vector at thirty
points across a field and asking how consistent the answer is.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-homog">
  <div id="c2g-homog" style="text-align:center;"></div>
  <figcaption>
    <strong>Answer, or stay silent (experiments E4 + SE(3)).</strong> Each bar is how often the
    single most common growth vector recurs across 30 base points sampled from a field — a
    homogeneity score. Above the dashed line (90%) the field has one consistent structure and the
    detector commits to a label; below it, the structure varies point to point and the detector
    <em>abstains</em>. The three genuine groups (including the SE(3) fibre-tracking structure,
    97%) clear the line easily; the modelled cosmic-web-style effective flow — a patchwork of
    sheet-, filament- and node-like local structures — sits far below at 37%, and the method
    correctly refuses to name a group. Data:
    <code>research/caustics-to-groups/artifacts/e3e4_results.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-homog");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const DATA = [
    { label: "Heisenberg", sub: "(2,3) group", v: 1.00, ok: true },
    { label: "Engel", sub: "(2,3,4) group", v: 1.00, ok: true },
    { label: "SE(3)", sub: "(3,6) — DW-MRI", v: 0.97, ok: true },
    { label: "cosmic-web flow", sub: "sheets/filaments/nodes", v: 0.37, ok: false },
  ];
  const W = 560, H = 320, mL = 50, mR = 20, mT = 24, mB = 70;
  const x0 = mL, x1 = W - mR, y0 = mT, y1 = H - mB;
  const Y = v => y1 - v * (y1 - y0);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };
  // y grid
  [0, 0.25, 0.5, 0.75, 1.0].forEach(g => {
    svg.appendChild(el("line", { x1: x0, y1: Y(g), x2: x1, y2: Y(g), stroke: "#eee", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: x0 - 6, y: Y(g) + 3, "text-anchor": "end", "font-size": 10, fill: "#999", "font-family": MONO }, (g * 100).toFixed(0) + "%"));
  });
  // threshold
  svg.appendChild(el("line", { x1: x0, y1: Y(0.9), x2: x1, y2: Y(0.9), stroke: "#c53030", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
  svg.appendChild(el("text", { x: x1 - 2, y: Y(0.9) - 5, "text-anchor": "end", "font-size": 10.5, fill: "#c53030", "font-family": SANS }, "commit / abstain threshold (90%)"));
  const bw = (x1 - x0) / DATA.length;
  DATA.forEach((d, i) => {
    const cx = x0 + bw * (i + 0.5), w = bw * 0.5;
    const col = d.ok ? "#2b6cb0" : "#dd6b20";
    svg.appendChild(el("rect", { x: cx - w / 2, y: Y(d.v), width: w, height: y1 - Y(d.v), fill: col, "fill-opacity": 0.85, rx: 2 }));
    svg.appendChild(el("text", { x: cx, y: Y(d.v) - 6, "text-anchor": "middle", "font-size": 12, "font-family": MONO, fill: "#333" }, (d.v * 100).toFixed(0) + "%"));
    svg.appendChild(el("text", { x: cx, y: y1 + 16, "text-anchor": "middle", "font-size": 11.5, fill: "#333", "font-family": SANS }, d.label));
    svg.appendChild(el("text", { x: cx, y: y1 + 30, "text-anchor": "middle", "font-size": 10, fill: "#888", "font-family": SANS }, d.sub));
    svg.appendChild(el("text", { x: cx, y: y1 + 48, "text-anchor": "middle", "font-size": 11, "font-family": SANS, fill: col, "font-weight": 600 }, d.ok ? "COMMIT" : "ABSTAIN"));
  });
  svg.appendChild(el("line", { x1: x0, y1: y1, x2: x1, y2: y1, stroke: "#333", "stroke-width": 1 }));
  svg.appendChild(el("text", { x: 14, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 11.5, fill: "#333", "font-family": SANS, transform: `rotate(-90 14 ${(y0 + y1) / 2})` }, "growth-vector consistency across the field"));
})();
</script>

<div class="l-body" markdown="1">

**Answering (the "yes" half).** On a genuinely $\mathrm{SE}(3)$-structured field the growth
vector comes back $(3,6)$ at essentially every base point (97%), and the detector commits to a
confident rank-three label. It is a touch more marginal than the low-dimensional groups — six
coordinates, three of them the slower $r^2$ kind, so it needs more data to pin down (the same
"higher structure is harder to read" pattern that ran through the whole series). But it answers,
and it answers correctly.

**Refusing (the "no" half).** Point the same machinery at a cosmic-web-style flow and the growth
vector is *different at different places* — $(2,3)$ here, $(2,3,4)$ there, $(2,3,5)$ elsewhere,
no single answer holding even 40%. The detector reports **"a field of varying tangent cones"** and
declines to name a group. That refusal is not a bug; it is the single most important behaviour in
the whole program. A cosmic filament's caustic shows the same universal cusps as a group's, and a
naïve detector would happily hallucinate a group from them. This one knows better, because it
checks for the one thing a group must have and an effective flow lacks: the *same* structure
everywhere.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-real-effective-flow">
  <div style="text-align:center;">
    <img src="/public/img/posts/cosmic-web-real-camels-slice.png"
      alt="Real z=0 cosmic web from a CAMELS N-body simulation: filaments and cluster nodes in a 25 h⁻¹Mpc slice — an effective flow, not a group"
      style="max-width:min(100%,440px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The effective flow the detector must stay silent on.</strong> A real $z=0$ cosmic
    web — the $z\!=\!0$ dark-matter density of a CAMELS N-body simulation
    ($256^3$ particles, $25\,h^{-1}$Mpc, $\Lambda$CDM). Its caustics show the same universal
    cusps as a group's, but its local structure is not the *same* everywhere: it is a patchwork
    of sheets, filaments and cluster nodes, each with a different local dimensionality. Sampled
    across this field the growth vector varies from place to place, so the detector reports "a
    field of varying tangent cones" and correctly declines to name a group. This is the honest
    scope of the method made concrete on real data. Rendered from
    <code>research/cosmic-web/data</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Where this sits — between seeing and the cosmos

This series was always the bridge between its two siblings, and now the bridge is complete:

- [**Geometry of Seeing**]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %}) is the
  clean case — the visual cortex genuinely computes on $\mathrm{SE}(2)$, a bona-fide group. The
  detector would answer confidently there, and it should.
- [**Geometry of the Cosmic Web**]({% post_url 2026-07-03-geometry-of-cosmic-web-research-program %})
  is the cautionary case — gravitational collapse draws gorgeous caustics, but the flow is *not*
  left-invariant, and reading a group into it would be a category error. The detector stays silent
  there, and it should.

Between them sits this program's real contribution: a way to tell those two situations apart *from
the caustics alone*, and to say honestly which one you are in. The obstruction from
[Part 1](/mathematics/2026/07/15/caustics-to-groups-research-program/) — that local caustics are
group-blind — turned out not to be a dead end but a specification: it told us to build a detector
out of the three structure-specific observables, and to make silence a first-class output.

## The honest ledger

What the four-post series established, and what it did not:

- **Established (synthetic, reproducible):** the growth vector recovers the tangent-cone class
  with a mapped noise/sample tradeoff (H1); the full fingerprint separates the candidate groups,
  breaking the Heisenberg/SE(2) alias via the deviation moduli, and degrades into honest
  class-level hedging rather than wrong answers (H2); the aliasing map has exactly two single-clue
  rigidity points (H3); and the method abstains on non-homogeneous effective flows while committing
  on genuine groups, SE(3) included (H4).
- **Not yet established (needs real data):** inference on an *actual* diffusion-MRI acquisition.
  That download is credential-gated; the SE(3) results here use synthetic fields, and the honest
  next step is to wire the DW-MRI adapter and run it — with the abstention machinery standing guard
  against over-claiming when a real field turns out to be locally inhomogeneous.

The reverse map from caustics to groups is real, bounded, and knows its own limits. That last part
— knowing when to stay silent — is the part worth keeping.

## Glossary

- **SE(3)** — the group of rigid motions of 3D space; with a rank-3 "move-and-reorient" restriction
  it is the geometry of diffusion-MRI fibre tracking and 3D vision. Growth vector $(3,6)$.
- **Growth vector $(3,6)$** — three directly-drivable directions, all six dimensions reached after
  one bracket; the rank-3 signature that sets SE(3) apart from the rank-2 groups.
- **Homogeneity** — same local structure at every point; the defining property of a group and the
  thing an effective flow lacks.
- **Calibrated silence** — the detector's refusal to name a group when the field's structure varies
  from point to point.
- **Effective flow** — a caustic-producing dynamics (e.g. gravitational collapse) that is not a
  left-invariant group, so it has no single global structure to recover.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>R. Duits, A. Ghosh, T. C. J. Dela Haije &amp; A. Mashtakov (2013). "On sub-Riemannian geodesics in $\mathrm{SE}(3)$ whose spatial projections do not have cusps." <a href="https://arxiv.org/abs/1305.6061">arXiv:1305.6061</a>.</li>
  <li>R. Duits &amp; E. Franken (2011). "Left-invariant diffusions on the space of positions and orientations and their application to crossing-preserving smoothing of HARDI images." <em>Int. J. Comput. Vis.</em> 92, 231–264.</li>
  <li>J. Portegies, G. Sanguinetti, S. Meesters &amp; R. Duits (2015). "New approximation of a scale space kernel on SE(3) and applications in neuroimaging." <em>SSVM 2015</em>. <a href="https://arxiv.org/abs/1506.02529">arXiv:1506.02529</a>.</li>
  <li>A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to Sub-Riemannian Geometry</em>. Cambridge University Press.</li>
  <li>J. Feldbrugge, R. van de Weygaert, J. Hidding &amp; J. Feldbrugge (2018). "Caustic skeleton &amp; cosmic web." <em>JCAP</em> 05, 027. <a href="https://arxiv.org/abs/1703.09598">arXiv:1703.09598</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
