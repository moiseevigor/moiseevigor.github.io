---
layout: distill
title: "Appendix C4 — The Conjugate Locus at the Pole: Astroids and Their Moduli"
subtitle: >
  The second leg of the fingerprint. The full first conjugate locus from a point —
  its cusp count, its symmetry, and its continuous moduli — carries what a single
  germ cannot. For 3D contact geometries it is a four-cusped astroid whose departure
  from the symmetric Heisenberg case is measured by two invariants.
date: 2026-07-31 09:00:00
categories: [mathematics]
tags: [sub-riemannian, conjugate-locus, astroid, moduli, contact-geometry]
description: >
  Companion appendix to the caustics-to-groups series: the first conjugate locus as
  a discriminating observable, the four-cusped sub-Riemannian astroid of 3D contact
  structures, the Agrachev–Barilari invariants (chi, kappa), the degenerate
  Heisenberg case, and how SE(2) departs from it.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C4
permalink: /mathematics/2026/07/31/caustics-to-groups-C4-conjugate-locus-moduli/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The growth vector (Appendix C3) sorts groups into classes but cannot split those that
share a tangent cone — Heisenberg and SE(2), both $(2,3)$. This appendix is the second
fingerprint leg that does split them: not a single caustic germ, but the <em>whole</em>
first conjugate locus from the base point — its shape, symmetry, and continuous moduli.
It sets up the deviation statistic of Appendix C6.
</div>

## Not one germ — the whole locus

Appendix C2 showed a single cusp is group-blind. The escape is to use the *entire* first
conjugate locus seen from the base point $q_0$: the full set of first refocusing points over
all geodesic directions. Three features of that set are structure-specific in a way no local
germ is:

- its **cusp count** and how the folds are arranged;
- its **symmetry group** (dilations and rotations that map it to itself);
- its continuous **moduli** — real invariants that vary smoothly from group to group even
  when the cusp count and symmetry agree.

For the 3D contact structures of the series (Heisenberg, SE(2), and their relatives SL(2),
SH(2), SU(2)) this locus has a specific and beautiful form.

## The sub-Riemannian astroid

For a generic 3D contact structure the first conjugate locus, seen in the intrinsic
dilation-adapted coordinates near the pole, is a **four-cusped astroid** — the classic star
shape $x^{2/3} + y^{2/3} = a^{2/3}$, four sharp cusps joined by four fold arcs. This was
computed by El-Alaoui, Gauthier &amp; Kupka (1996) for small balls on $\mathbb{R}^3$, and the
germ structure worked out by Agrachev, Charlot, Gauthier &amp; Zakalyukin (2000); Bonnet,
Gauthier &amp; Rossi (2019) classified its generic singularities. The four cusps are $A_3$
germs (Appendix C2) — universal — but their *arrangement and proportions* are not.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-astroid">
  <div id="c2g-astroid" style="text-align:center;"></div>
  <figcaption>
    <strong>The sub-Riemannian astroid.</strong> The first conjugate locus of a generic 3D
    contact structure: four cusps ($A_3$) joined by four folds. The symmetric shape (blue) is
    the flat/nilpotent Heisenberg reference; a curved structure like SE(2) deforms it (orange),
    and the size and shape of that deformation are the moduli $(\chi, \kappa)$. The germs are
    universal; the deformation is the fingerprint. Shape schematic; axes are dimensionless
    SR-normal coordinates at the pole.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-astroid");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 440, H = 300, cx = 220, cy = 150;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "440px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };
  function astroid(a, b, col, dash, op) {
    const pts = [];
    for (let t = 0; t <= 6.2832; t += 0.02) {
      const c = Math.cos(t), s = Math.sin(t);
      pts.push([cx + a * c * c * c, cy - b * s * s * s]);
    }
    svg.appendChild(el("polygon", { points: pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "),
      fill: "none", stroke: col, "stroke-width": 2, "stroke-dasharray": dash, opacity: op }));
    [[a, 0], [-a, 0], [0, b], [0, -b]].forEach(p =>
      svg.appendChild(el("circle", { cx: cx + p[0], cy: cy - p[1], r: 2.6, fill: col, opacity: op })));
  }
  astroid(100, 100, "#2b6cb0", "0", 0.95);      // symmetric: Heisenberg reference
  astroid(122, 84, "#e65100", "5 4", 0.9);        // deformed: SE(2)-like
  svg.appendChild(el("text", { x: cx + 104, y: cy - 6, "font-size": 11.5, fill: "#2b6cb0", "font-family": SANS }, "flat (Heisenberg)"));
  svg.appendChild(el("text", { x: cx + 6, y: cy - 92, "font-size": 11.5, fill: "#e65100", "font-family": SANS }, "curved (SE(2)):"));
  svg.appendChild(el("text", { x: cx + 6, y: cy - 78, "font-size": 11, fill: "#e65100", "font-family": SANS }, "deformation = moduli (χ,κ)"));
})();
</script>

<div class="l-body" markdown="1">

## The two invariants (χ, κ)

Agrachev &amp; Barilari (2012) classified all left-invariant sub-Riemannian structures on 3D
Lie groups by exactly **two differential invariants**, $\chi \ge 0$ and $\kappa$. They locate
each group in a two-parameter family, with the flat model at the origin:

- $\chi = \kappa = 0$ — **Heisenberg**, the flat case. Its conjugate locus is maximally
  degenerate: rather than a non-degenerate astroid, the whole family of geodesics at a given
  momentum collapses to a single point, so the locus is just the central axis (proved in
  [Part 2](/mathematics/2026/07/18/caustics-to-groups-forward-map/), $t_c = 2\pi/|w|$).
- $\kappa < 0$ — **SE(2)**, the group of motions. It is curved; its conjugate locus is a
  genuine deformed astroid, and its geodesics are Euler elastica (Sachkov 2010).
- other signs and magnitudes — SU(2), SL(2), SH(2), the rest of the 3D contact family.

So the moduli $(\chi, \kappa)$ are the fingerprint that distinguishes structures with the same
tangent cone: they are precisely what the growth vector throws away.

## From shape to a number

Extracting $(\chi, \kappa)$ from a sampled locus is the goal, but the series' working
detector uses a scalar proxy that captures the same information for the Heisenberg/SE(2)
split: the **deviation of the conjugate locus from the flat reference**, measured through the
refocusing-time law. Heisenberg's law is exactly $t_c = 2\pi/|w|$; SE(2) departs from it,
increasingly at low momentum, giving a deviation $\delta \approx 0.14$ versus $0$. That
statistic — the nilpotent deviation — is the subject of Appendix C6, and it is what breaks the
alias in the [Part 3 confusion matrix](/mathematics/2026/07/22/caustics-to-groups-inverse-map/).

## References

- El-H. Chakir El-Alaoui, J.-P. Gauthier &amp; I. Kupka (1996). "Small sub-Riemannian balls on
  $\mathbb{R}^3$." <em>J. Dyn. Control Syst.</em> 2, 359–421.
- A. Agrachev, G. Charlot, J.-P. Gauthier &amp; V. Zakalyukin (2000). "On sub-Riemannian
  caustics and wave fronts for contact distributions in the three-space." <em>J. Dyn. Control
  Syst.</em> 6, 365–395.
- A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J.
  Dyn. Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.
- B. Bonnet, J.-P. Gauthier &amp; F. Rossi (2019). "Generic singularities of the 3D-contact
  sub-Riemannian conjugate locus." <em>C. R. Acad. Sci. Paris</em> 357, 542–549.
  <a href="https://arxiv.org/abs/1812.01508">arXiv:1812.01508</a>.
- Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the group of
  motions of a plane." <em>ESAIM: COCV</em> 16, 1018–1039.
  <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.
</div><!-- /.l-body -->
