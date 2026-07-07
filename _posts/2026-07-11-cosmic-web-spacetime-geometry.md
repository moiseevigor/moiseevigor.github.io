---
layout: distill
title: "From Cosmic Filaments to Curved Spacetime"
subtitle: >
  The same geometry that lifts a filament — a direction attached to every point,
  shortest paths under a constraint — is the geometry underneath gravity. Make the
  symmetries of space local and spacetime bends; the cosmic web's tidal frame and
  Einstein's gravitational field turn out to be cousins.
date: 2026-07-11 09:00:00
categories: [mathematics]
tags: [cosmic-web, general-relativity, cartan-geometry, gauge-gravity, sub-riemannian, spacetime]
image: /public/img/posts/cosmic-web-3.svg
description: >
  A conceptual capstone to the cosmic-web series: how Klein's symmetry view of
  geometry, curved by Cartan, becomes Einstein's gravity when a symmetry is made
  local — with the tidal frame and the orientation lift as instances of one
  framework, an honest account of torsion, and where the sub-Riemannian toolkit
  meets spacetime.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: 3
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where this sits — and what it is</div>
This is the series' capstone: a step back from filaments to the geometry of
<em>spacetime itself</em>. The empirical posts asked whether a position-plus-orientation
lift finds and shapes the cosmic web
(<a href="{% post_url 2026-07-03-geometry-of-cosmic-web-research-program %}">Part 1</a>,
<a href="{% post_url 2026-07-04-cosmic-web-two-models %}">Part 2</a>). This one is
<em>conceptual</em>, not a data study — its one figure is an interactive diagram, not a
measurement — and it answers a question the whole program kept circling: the geometry
we used for filaments is the same geometry Einstein used for gravity. Both are what you
get when you take the symmetries of space and make them <em>local</em>.
</div>

## The thread the series kept pulling

Every post here has been about **frames and directions**. The tidal eigenframe picks
the filament axis — the direction gravity squeezes last
([Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/)). The orientation
lift carries a full direction at every point,
$$\mathbb{R}^3 \times S^2 \cong \mathrm{SE}(3)/\mathrm{SO}(2)$$. The
[Geometry of Seeing]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
series did the 2D version, $$\mathrm{SE}(2)$$, and traced shortest paths under a
turning constraint.

Attach a preferred frame to every point of a space, and ask how it twists as you move
from point to point. That single question — *how does the local frame turn?* — is the
one Einstein's gravity is built from. The cosmic web handed us frames; gravity is the
theory of how frames turn. This post makes the link precise.

## One idea: a geometry is a symmetry made local

Three moves, a century apart, line up into one picture.

**Klein (1872) — a geometry is its symmetry group.** Flat Euclidean space *is* the
group of translations and rotations, the **Euclidean group** $$\mathrm{SE}(3)$$; a point
is just "everything the rotations fix." Flat spacetime is the **Poincaré group** —
translations and Lorentz boosts/rotations. Your visual cortex's roto-translations are
$$\mathrm{SE}(2)$$. In each case the geometry and the symmetry are the same object.

**Cartan (1920s) — curve it.** A **Cartan geometry** is a space that looks like the flat
symmetric model only *up close*; curvature measures how it fails to be that flat model
globally — a manifold with a preferred frame at every point and a rule for transporting
it. Riemannian geometry, general relativity, *and* the $$\mathrm{SE}(2)$$ lift are all
Cartan geometries, differing only in which flat model they are "infinitesimally."

**Gauging — make the symmetry local.** Special relativity has one *global* Poincaré
symmetry for all of spacetime. Demand it hold **independently at every point** and you
are forced to introduce connection fields to compare frames at neighbouring points — and
those fields *are* gravity. This is not an analogy for gravity; it is a construction of
it (Kibble 1961; Hehl et al. 1976; Blagojević & Hehl 2013).

## Two symmetries, two pieces of gravity

The Poincaré group splits into translations and rotations, and each half, made local,
becomes a distinct piece of geometry. Noether's theorem ties each to the conserved
quantity that sources it:

| Symmetry, made local | Conserved source | Geometric field | Its "field strength" |
|---|---|---|---|
| **Translations** | energy–momentum | the **frame / metric** (a direction at each point) | **curvature** → Einstein's equation |
| **Rotations** | **spin** | the **spin connection** (how the frame turns) | **torsion** |

So the translational symmetry of space, made local, is the **curvature** of ordinary
gravity — sourced by energy and momentum, exactly Einstein's $$G = 8\pi G\,T$$. The
rotational symmetry, made local, is a *second* piece, **torsion**, sourced by the spin
of matter. Standard general relativity simply sets that second piece to zero.

## The bridge to this series: frames that don't close

Here is where the sub-Riemannian machinery of the whole project reappears — not by
analogy, but as the same object.

In sub-Riemannian geometry you may only move along a few allowed directions, yet their
**brackets** $$[X,Y]$$ generate the missing ones — the Chow–Rashevskii condition that
makes the space connected. The bracket measures the **failure of the frame to close**:
go out along $$X$$, then $$Y$$, then back, and you don't return to where a grid would put
you.

In the frame language of gravity, that *same* quantity — the frame's failure to close,
its **anholonomy** — *is* the gravitational field strength (the torsion, in the
tetrad/teleparallel formulation). A frame that closes like a grid is flat, gravity-free;
the amount by which it fails to close is the field. The cosmic web's tidal frame is a
frame field of exactly this kind; asking how it rotates from voxel to voxel is asking for
its connection.

And the variational picture is shared too. Cartan's **rolling-ball problem** — roll one
surface on another without slipping — is the textbook sub-Riemannian problem; its
geodesics come from the same Pontryagin principle as the $$\mathrm{SE}(2)$$ elastica
([Geometry of Seeing, Part 2]({% post_url 2026-04-28-geometry-of-seeing-elastica-jacobi %})).
Gravity, read as a Cartan geometry, **rolls a flat model spacetime along the curved one**
(Wise 2010). Roll a model along a manifold; the developed straight lines are the
geodesics. One machine, three incarnations: the visual cortex, the rolling ball, and
gravity.

## Where the Euclidean group sits — dial the speed of light

The figure below makes the family concrete. The Euclidean group you started from is the
**non-relativistic corner** of the spacetime symmetries: the limit where the speed of
light is infinite, so "now" is shared everywhere and space is just $$\mathrm{SE}(3)$$.
Slide $$c$$ down and the light cone tilts shut, passing through Minkowski (finite $$c$$)
on the way to the **Carroll** limit ($$c \to 0$$), where the cone closes completely — the
geometry of a black-hole horizon. Each corner, gauged, gives a theory of gravity.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-cone">
  <div style="text-align:center; margin-bottom:0.7em; font-family:'Source Sans 3', sans-serif; font-size:13px; color:#555;">
    <span style="color:#2f855a; font-weight:600;">space (c → ∞)</span>
    <input type="range" id="cone-c" min="0" max="100" value="6" style="width:230px; vertical-align:middle; margin:0 10px; accent-color:#1565c0;">
    <span style="color:#c53030; font-weight:600;">horizon (c → 0)</span>
  </div>
  <div id="cw-cone" style="text-align:center;"></div>
  <div id="cone-readout" style="text-align:center; font-family:'Source Sans 3', sans-serif; font-size:13.5px; color:#333; margin-top:10px; min-height:2.6em;"></div>
  <figcaption>
    <strong>One family, dialed by the speed of light.</strong> The wedge is the set of
    events a signal can reach from the centre — the future "light cone". At left
    (<em>c</em> → ∞) it opens flat: you can reach anywhere <em>now</em>, time is absolute,
    and space is the Euclidean group $$\mathrm{SE}(3)$$ — the geometry this series used.
    In the middle (finite <em>c</em>) it is the 45° Minkowski cone of special relativity,
    symmetry group Poincaré. At right (<em>c</em> → 0) it closes onto the time axis — the
    <em>Carroll</em> limit, the intrinsic geometry of a black-hole horizon. Gauging each
    corner gives a theory of gravity: Newton–Cartan, Einstein(–Cartan), and Carrollian
    respectively. Your Euclidean symmetries are the <em>c</em> → ∞ face of the same object
    that curves into gravity.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-cone");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 520, H = 300, cx = 260, cy = 165, R = 128;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const readout = document.getElementById("cone-readout");
  const REGIMES = [
    { max: 33, name: "Galilei / Euclidean  (c → ∞)", grav: "gauge it → Newton–Cartan gravity",
      note: "Time is absolute; space is the Euclidean group SE(3) — the frame this series used." },
    { max: 67, name: "Poincaré / Minkowski  (finite c)", grav: "gauge it → Einstein(–Cartan) gravity",
      note: "The 45° light cone of special relativity; localising this symmetry is general relativity." },
    { max: 101, name: "Carroll  (c → 0)", grav: "gauge it → Carrollian gravity (horizons)",
      note: "The cone closes: no motion through space. This is the geometry of a black-hole horizon." }
  ];
  function render(s) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // half-angle of the future cone, measured from the vertical time axis:
    // wide (≈86°) at c→∞, 45° at Minkowski, thin (≈4°) at c→0.
    const theta = (86 - 0.82 * s) * Math.PI / 180;
    const dx = R * Math.sin(theta), dy = R * Math.cos(theta);
    // shaded future wedge
    svg.appendChild(el("path", { d: `M ${cx} ${cy} L ${cx - dx} ${cy - dy} A ${R} ${R} 0 0 1 ${cx + dx} ${cy - dy} Z`,
      fill: "#e8f0fe", stroke: "none" }));
    // space & time axes
    svg.appendChild(el("line", { x1: cx - R - 12, y1: cy, x2: cx + R + 12, y2: cy, stroke: "#bbb", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: cx, y1: cy + 40, x2: cx, y2: cy - R - 16, stroke: "#bbb", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: cx + R + 8, y: cy + 15, "font-size": 11, fill: "#999", "font-family": SANS }, "space"));
    svg.appendChild(el("text", { x: cx + 5, y: cy - R - 6, "font-size": 11, fill: "#999", "font-family": SANS }, "time"));
    // cone edges
    ["#1565c0", "#1565c0"].forEach((c, i) => {
      const sx = i ? dx : -dx;
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + sx, y2: cy - dy, stroke: c, "stroke-width": 2.5 }));
    });
    // the point
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: 4, fill: "#111" }));
    // regime label on the figure
    const reg = REGIMES.find(r => s < r.max);
    svg.appendChild(el("text", { x: cx, y: cy - dy - 8 < 22 ? 16 : cy - dy - 8, "text-anchor": "middle",
      "font-size": 12.5, "font-weight": 700, fill: "#1565c0", "font-family": SANS }, reg.name));
    readout.innerHTML = "<strong>" + reg.name + "</strong> &nbsp;·&nbsp; " + reg.grav + "<br><span style='color:#777'>" + reg.note + "</span>";
  }
  const slider = document.getElementById("cone-c");
  slider.addEventListener("input", () => render(+slider.value));
  render(+slider.value);
})();
</script>

<div class="l-body" markdown="1">

## Does any of this change Einstein's equations?

**Standard general relativity: no.** Set torsion to zero and the whole gauge/Cartan
construction reproduces Einstein's equations exactly. It is a re-reading, not a rewrite.

**Einstein–Cartan: minimally, yes.** Keep the rotational piece honest and the spin of
matter sources torsion through a *second* equation. Because that equation is algebraic —
torsion does not propagate on its own — it vanishes wherever spin density vanishes, so
ordinary space, the Solar System, and all current tests are untouched. Corrections switch
on only at colossal spin density — the early Universe, neutron-star cores — where they act
as an effective repulsion that can replace the Big-Bang singularity with a **bounce**.

**The honest status.** Torsion has never been detected; no experiment is yet precise
enough to bound it. Versions in which torsion *propagates* are disfavoured — the absence
of extra gravitational-wave polarisations rules most of them out. The unification here is
therefore **conceptual and classical**: it says gravity and the geometry of this series
are the same kind of object, and it extends Einstein's equations by a term that is, so
far, a whisper — loud only where the cosmic web itself was born.

## What is solid, what is active, what is open

- **Solid (textbook).** Gravity is the gauge theory of the local spacetime symmetry group;
  Cartan geometry is the common language of Riemannian geometry, the orientation lift, and
  general relativity (Sharpe 1997; Wise 2010; Blagojević & Hehl 2013).
- **Active.** *Sub-Lorentzian* geometry — the sub-Riemannian construction with a
  Lorentzian metric on the allowed directions — is young and moving (Grochowski and
  others). Carrollian horizons are a live topic (Donnay & Marteau 2019).
- **Open, and close to home.** The exact $$\mathrm{SE}(2)$$ results of the Geometry of
  Seeing series — Maxwell strata, cut loci via elliptic functions — have sub-Lorentzian
  analogues on the relativistic cousins of $$\mathrm{SE}(2)$$ that, as far as I can tell,
  nobody has worked out. That is the natural next question this series points at.

## Glossary

- **Klein geometry** — a geometry presented as a symmetry group $$G$$ and a subgroup $$H$$
  it fixes; the space is $$G/H$$.
- **Cartan geometry** — a curved space modelled infinitesimally on a Klein geometry; the
  setting that contains both the orientation lift and general relativity.
- **Gauging** — promoting a global symmetry to hold independently at every point; for a
  spacetime symmetry this forces in the connection fields that are gravity.
- **Frame / tetrad** — an orthonormal set of directions attached to each point; the local
  gauge field of translations, and the carrier of the metric.
- **Spin connection** — the field that says how the frame rotates from point to point; the
  gauge field of local rotations, its field strength the curvature.
- **Torsion** — the field strength of the frame; equivalently the frame's *anholonomy*,
  its failure to close like a coordinate grid; sourced by spin.
- **Anholonomy** — failure of a frame to be a coordinate basis; the same object as the
  sub-Riemannian bracket in Chow–Rashevskii, and the gravitational field strength in
  frame gravity.
- **Einstein–Cartan theory** — general relativity plus torsion, obtained by gauging the
  full Poincaré group; reduces to GR wherever spin density is zero.
- **Sub-Lorentzian geometry** — a Lorentzian metric on a bracket-generating distribution;
  the relativistic sibling of the sub-Riemannian geometry used throughout this series.
- **Carroll limit** — the $$c \to 0$$ contraction of Minkowski geometry; the light cone
  closes; the intrinsic geometry of null surfaces and black-hole horizons.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>F. Klein (1872). "Vergleichende Betrachtungen über neuere geometrische Forschungen" (the Erlangen Program). <em>Math. Ann.</em> 43 (1893), 63–100.</li>
  <li>É. Cartan (1923). "Sur les variétés à connexion affine et la théorie de la relativité généralisée." <em>Ann. Sci. ENS</em> 40, 325–412.</li>
  <li>T. W. B. Kibble (1961). "Lorentz invariance and the gravitational field." <em>J. Math. Phys.</em> 2, 212–221.</li>
  <li>F. W. Hehl, P. von der Heyde, G. D. Kerlick &amp; J. M. Nester (1976). "General relativity with spin and torsion: foundations and prospects." <em>Rev. Mod. Phys.</em> 48, 393–416.</li>
  <li>R. W. Sharpe (1997). <em>Differential Geometry: Cartan's Generalization of Klein's Erlangen Program.</em> Springer GTM 166.</li>
  <li>D. K. Wise (2010). "MacDowell–Mansouri gravity and Cartan geometry." <em>Class. Quantum Grav.</em> 27, 155010. <a href="https://arxiv.org/abs/gr-qc/0611154">arXiv:gr-qc/0611154</a>.</li>
  <li>M. Blagojević &amp; F. W. Hehl, eds. (2013). <em>Gauge Theories of Gravitation: A Reader with Commentaries.</em> Imperial College Press. <a href="https://arxiv.org/abs/1210.3775">arXiv:1210.3775</a>.</li>
  <li>M. Grochowski (2006). "Geodesics in the sub-Lorentzian geometry." <em>Bull. Polish Acad. Sci. Math.</em> 54, 271–287.</li>
  <li>L. Donnay &amp; C. Marteau (2019). "Carrollian physics at the black hole horizon." <em>Class. Quantum Grav.</em> 36, 165002. <a href="https://arxiv.org/abs/1903.09654">arXiv:1903.09654</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
