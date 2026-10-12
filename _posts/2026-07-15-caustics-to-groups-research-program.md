---
layout: distill
last_modified_at: 2026-10-13
title: "From Caustics to Groups: Identifiability and Its Limits"
subtitle: >
  Generic local caustics do not identify a group. Finite synthetic tests recover additional structure, while degenerate tangencies refute a universal cusp claim.
date: 2026-07-15 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, lie-groups, singularity-theory, optimal-control, inverse-problems]
image: /public/img/posts/caustics-groups-1.svg
description: >
  The group-blindness obstruction, sampled fold and cusp results, synthetic classification and the limits of inferring geometry from caustics.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: 1
comments: true
---

<div class="l-body" markdown="1">

**Results and scope.** Generic Lagrangian singularities supply a sharp obstruction to identifying a group from one local caustic. Sampled fold tests support that obstruction; cusp tests also expose symmetry exceptions. A finite synthetic classifier separates four candidate structures, but real diffusion-MRI inference is not established.

**The question, in one breath.** A caustic is the pattern a flow of shortest paths
makes when it focuses — where nearby paths pile onto the same point. The
[Geometry of Seeing]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
series showed that the visual cortex traces shortest paths on a curved geometry
(the group $\mathrm{SE}(2)$); the
[Geometry of the Cosmic Web]({% post_url 2026-07-03-geometry-of-cosmic-web-research-program %})
series showed that matter collapsing under gravity draws caustic walls and
filaments. Both are *forward* maps: geometry in, caustics out. **This series asks
the inverse.** Handed only the caustics — a cloud of fold edges, cusps, and
focusing surfaces — can we read back the geometry that made them? And in particular,
can we name the *group*?

**Why it is hard, stated up front.** The honest answer, which this whole program is
built around, is *mostly no — and we can say precisely where the "no" comes from and
what narrow "yes" survives it.* That structure — a sharp obstruction plus a
three-part escape from it — is the scientific content of the series. The rest of
this page makes it precise.

## The question, made precise

Fix a smooth manifold $M$ with a **sub-Riemannian (SR) structure**[^subriemannian]:
a sub-bundle $\mathcal{D} \subset TM$ of *allowed* directions (the *distribution*)
and a metric on it. Shortest paths are constrained to move along $\mathcal{D}$; their
lengths define the SR distance. From a base point $q_0$, the **exponential map** sends
each initial covector to the endpoint of the geodesic it launches. That map is a
**Lagrangian map**[^lagrangian] — the projection of a Hamiltonian flow — and the set
where it becomes singular (where the geodesic front folds over itself) is the
**caustic**, equivalently the **conjugate locus**[^conjugate]. This is the same object
that appears in optics (bright focusing curves), in gravitational lensing (fold and
cusp critical curves), and in cosmology (shell-crossing surfaces).

The forward map is understood:

$$
\text{group / SR structure} \;\longrightarrow\; \text{Hamiltonian flow} \;\longrightarrow\; \text{caustic}.
$$

The **reverse map** is the target of this program:

$$
\text{observed caustic field} \;\overset{?}{\longrightarrow}\; \text{underlying SR structure (which group?)}.
$$

We restrict the "which group?" question to a fixed, honest candidate list —

$$
\{\,\mathrm{Heisenberg},\; \mathrm{SE}(2),\; \mathrm{SE}(3),\; \mathrm{Engel}\,(2,3,4),\; \mathrm{Cartan}\,(2,3,5)\,\}
$$

— the groups whose SR geodesics and conjugate loci are known in closed or
near-closed form (Sachkov school; Duits et al.), so that ground truth is available
and the inverse can be graded, not just asserted.

## The obstruction that shapes everything

Here is the wall the whole design must respect. Part of it is a theorem and part of
it is this program's working hypothesis; the two are stated separately.

**The theorem.** A caustic is the set of critical values of a Lagrangian map. By
Arnol'd's classification[^arnold], a *generic* Lagrangian map of a manifold of
dimension $n \le 5$ is stable, and each of its germs is equivalent to one of a finite
list that depends only on $n$: the **fold** $A_2$, the **cusp** $A_3$, the
**swallowtail** $A_4$, the **umbilic** $D_4$, and a few higher $A$, $D$, $E$ germs.
The list does not depend on which Hamiltonian produced the map. Away from the pole
(the starting point) and from abnormal trajectories, a sub-Riemannian exponential map
*is* a Lagrangian map, so wherever it is generic in Arnol'd's sense its caustic germs
come from this group-independent list.

**What the theorem does not give.** Genericity is a hypothesis on the map, and the
exponential map of a left-invariant structure is one particular, symmetric map, not a
generic one. Three things fall outside the theorem: the pole, where every
sub-Riemannian exponential map is degenerate and the conjugate locus accumulates;
abnormal trajectories, which are not part of the Lagrangian picture at all; and
symmetry, which can make a whole conjugate locus non-generic (Heisenberg's first
conjugate locus is a line, not a surface of folds; experiment E11, below, finds the
same kind of collapse on part of the Engel and Cartan loci and on the whole locus of
the nilpotent cone of $\mathrm{SE}(3)$). $\mathrm{SE}(3)$ has $n = 6$, beyond the
range of the finite list, so even a generic map there need not have germs from it.

**The working hypothesis: local generic caustics are group-blind.** Away from those
three exceptions, a generic point of the conjugate locus of each candidate group is a
standard ADE germ, and so carries **no** information about which group produced it.
The evidence is of three kinds. For generic 3D contact structures the germs are
classified (Agrachev, Charlot, Gauthier &amp; Zakalyukin 2000; Bonnet, Gauthier &amp;
Rossi 2019). For Engel and Cartan we checked the simplest case numerically
(experiment E10): at the first conjugate point of 24 random geodesics per group the
exponential map has corank 1 with its kernel transverse to the critical set — a fold
— in 24 of 24 cases for SE(2), Engel and Cartan, and in 0 of 24 for the Heisenberg
control, whose collapsed axis the test correctly rejects (data:
`research/caustics-to-groups/artifacts/e10_results.json`). Experiment E11 then
searched for the next germ, the cusp, along loops of initial covectors (pre-registered;
data: `research/caustics-to-groups/artifacts/e11_results.json`). On SE(2), the
calibration case, it finds the four cusps per loop that the 3D contact theory predicts:
16 of 16 located points pass every test. On Engel it locates 21 points where the kernel
is tangent to the critical set, and on Cartan 38 (tangency $\le 10^{-4}$, corank 1 at
every one). Of these, 7 and 16 pass all the pre-registered cusp tests — a simple
tangency and a semicubical image, with fitted exponents 1.93–2.10 and 2.99–3.18 against
the exact 2 and 3 — and 10 and 7 more pass once the image test is repeated on a finer
scale chosen after the fact. But 4 Engel points and 10 Cartan points are *not* cusps:
the tangency is degenerate, and at 10 of those 14 a whole one-parameter family of
geodesics refocuses at a single point, as on Heisenberg's axis. Five Cartan points
are undecided. On $\mathrm{SE}(3)$ the fold test gives 23 of 24 on the group itself
(the 24th falls below the fold threshold) and 0 of 24 on its nilpotent tangent cone,
which collapses like Heisenberg. So the hypothesis holds at the folds and cusps we
sampled; the symmetry exception is wider than Heisenberg alone; swallowtails and
higher germs remain unchecked. All of this is numerics at sampled points, not proof.
Under this hypothesis the naive
detector — *see a cusp, name the group* — cannot work, and a pipeline that pretends
otherwise is fitting noise.

<figure class="l-body" id="fig-obstruction">
  <div style="text-align:center; margin-bottom:0.6em;">
    <button class="fig-toggle active" id="ob-btn-local">local view — group-blind</button>
    <button class="fig-toggle" id="ob-btn-global">global view — the fingerprint</button>
  </div>
  <div id="c2g-obstruction" style="text-align:center;"></div>
  <figcaption>
    <strong>The obstruction, and the escape.</strong> <em>Local view:</em> a single
    caustic germ — here the cusp $A_3$ (the exact semicubical curve $y^2 = x^3$) — is
    consistent with <em>every</em> candidate group at once. Read locally, the caustic
    is group-blind; the labels around it are all equally possible. <em>Global view:</em>
    the <em>full</em> first conjugate locus from the base point is a four-cusped
    <em>sub-Riemannian astroid</em> (El-Alaoui–Gauthier–Kupka 1996). Its symmetry,
    the deviation of its shape from the flat nilpotent reference, and a discrete
    yes/no flag for an <em>abnormal</em> stratum together form a fingerprint that
    <em>does</em> separate the groups. The astroid outline is schematic; the cusp
    curve is exact. Axes are dimensionless SR-normal coordinates centred at the pole.
  </figcaption>
</figure>

**The discriminating information lives elsewhere** — in three places that *are*
structure-specific, and that a local germ never sees:

1. **The tangent cone (nilpotent approximation).** Zoom infinitely far into an SR
   structure at a point and it converges to a **Carnot group**[^carnot] — its *metric
   tangent cone* — classified by its **growth vector**[^growthvector]: how fast the
   allowed directions, and their brackets, fill up the tangent space. $(2,3)$ is the
   contact case (Heisenberg); $(2,3,4)$ is Engel; $(2,3,5)$ is Cartan; $(3,6)$ is free
   step-2. The caustic of this nilpotent model is the **reference fingerprint** —
   the shape the real caustic is measured *against*.
2. **The germ of the conjugate locus at the pole.** Not one cusp, but the *entire*
   first conjugate locus seen from the base point: its cusp count, its symmetry group,
   and its **moduli** — continuous invariants that vary from group to group. These are
   computed explicitly and *differently* for Heisenberg, $\mathrm{SE}(2)$,
   $\mathrm{SH}(2)$, $\mathrm{SL}(2)$, Engel, and Cartan (Sachkov school). Two groups
   can share a tangent cone yet differ here.
3. **The abnormal-geodesic spectrum.** SR geometry has a second kind of extremal —
   **abnormal** geodesics[^abnormal] — that do not come from the metric at all, only
   from the shape of the distribution. Their presence or absence is a *topological*
   property: rank-2 contact structures in 3D (Heisenberg, $\mathrm{SE}(2)$, …) have
   **none**; higher-corank structures (Engel, Cartan) **do**. A single yes/no bit that
   separates whole classes at once.

**Therefore the detector's target is a triple, never a single germ:**

$$
\Big(\; \underbrace{\text{growth vector of the tangent cone}}_{\text{which Carnot model}},\;\; \underbrace{\text{symmetry + moduli of the conjugate locus at the pole}}_{\text{which group within the class}},\;\; \underbrace{\text{abnormal stratum present?}}_{\text{one topological bit}} \;\Big).
$$

For the contact comparison, the measured deviation is the average shortfall of
refocusing time relative to the flat Heisenberg law. It separates Heisenberg
(approximately zero) from SE(2) (approximately 0.14) on the stated momentum and
launch-angle grid. This is a finite-model observable, not a universal group identifier.
[Definition, grid and results]({% post_url 2026-07-22-caustics-to-groups-inverse-map %}).

## What the literature already settles

**Forward theory (solid ground).**

- *Caustics are Lagrangian singularities.* Arnol'd's ADE classification (Arnol'd
  1990) fixes the universal local germs. Agrachev, Charlot, Gauthier &amp; Zakalyukin
  (2000) worked out the SR caustics and wave fronts of 3D contact distributions
  specifically — the germ list *and* the global astroid.
- *The flat models and their deviations.* El-Alaoui, Gauthier &amp; Kupka (1996)
  computed the small SR balls and the four-cusp astroid caustic on $\mathbb{R}^3$
  in the contact case; Agrachev &amp; Barilari (2012) gave the complete classification
  of left-invariant SR structures on 3D Lie groups by **two differential invariants**
  $\chi \ge 0$ and $\kappa$, with the flat Heisenberg case at $\chi = \kappa = 0$;
  Sacchelli (2019) pushed the caustic-stability analysis to five dimensions and made
  the nilpotent-deviation invariant explicit.
- *Explicit geodesics and conjugate loci per group.* Sachkov (2010) solved
  $\mathrm{SE}(2)$ — conjugate time, cut time, and the global cut locus; Ardentov &amp;
  Sachkov (2017) did the Engel group; Ardentov &amp; Hakavuori (2022) proved the cut
  time on the Cartan group; Duits, Boscain, Rossi &amp; Sachkov (2014) and Duits et al.
  (2013) gave the cuspless SR geodesics on $\mathrm{SE}(2)$ and $\mathrm{SE}(3)$ used
  in imaging. These are the closed forms that make ground truth possible.

**The candidate edge**, in one sentence: *the forward map (group → caustic) is
richly worked out group by group, and the local obstruction (ADE universality) is a
theorem for generic Lagrangian maps and a numerically supported hypothesis for these
groups — but nobody appears to have assembled the three structure-specific
observables into a single graded inverse estimator and asked, quantitatively, which
groups it can and cannot tell apart from caustic data alone.*

**Where the caustics come from (the data domains).**

| Domain | What plays the role of the caustic | Is it a left-invariant group? |
|---|---|---|
| Vision / V1 | association-field cut loci | **Yes** — $\mathrm{SE}(2)$/Heisenberg (Citti–Sarti; Petitot) |
| Diffusion MRI | SR fibre-tracking caustics / cut loci | **Yes** — left-invariant $\mathrm{SE}(3)$ (Duits) |
| Gravitational lensing | fold/cusp critical curves | 2D Lagrangian lens map (not a group) |
| Halo boundaries | outermost density caustic (splashback) | spherical/self-similar infall (not a group) |
| Cosmic web | shell-crossing $A_3/A_4/A_5/D_4$ skeleton | **No** — *effective* Lagrangian flow |

The right-hand column is the honest scope boundary. Where the configuration space
*is* a group (cortex, DW-MRI, controlled robots), "which group?" is a well-posed
question. Where the flow is only *effective* (the cosmic web, splashback), the group
inference must either abstain or be reported as a tangent-cone-at-a-point statement,
never a global group claim. The cosmic web is therefore not a target but a
**calibration of silence** — the place the method must correctly refuse to answer.
That refusal is a deliverable, connecting this series directly to the
[cosmic-web caustic skeleton]({% post_url 2026-07-03-geometry-of-cosmic-web-research-program %})
(Feldbrugge et al. 2018; Hertzsch et al. 2026).

</div><!-- /.l-body -->

<script>
(function () {
  const host = document.getElementById("c2g-obstruction");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const W = 560, H = 340, cx = 280, cy = 170;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (tag, a, txt) => { const e = document.createElementNS(ns, tag);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const GROUPS = ["Heisenberg", "SE(2)", "Engel", "Cartan"];

  function axes() {
    svg.appendChild(el("line", { x1: 40, y1: cy, x2: W - 40, y2: cy, stroke: "#e0e0e0", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: cx, y1: 34, x2: cx, y2: H - 30, stroke: "#e0e0e0", "stroke-width": 1 }));
  }

  function renderLocal() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    axes();
    // exact semicubical cusp  x = s^2, y = s^3  (A3 cusp), scaled, pointing left
    const A = 150, pts = [];
    for (let s = -1.15; s <= 1.15; s += 0.02) {
      const x = cx - A * (s * s) * 0.9 + 70;
      const y = cy - A * (s * s * s) * 0.62;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    svg.appendChild(el("polyline", { points: pts.join(" "), fill: "none",
      stroke: "#e65100", "stroke-width": 2.4, "stroke-linecap": "round" }));
    // cusp point marker
    svg.appendChild(el("circle", { cx: cx + 70, cy: cy, r: 3.2, fill: "#e65100" }));
    svg.appendChild(el("text", { x: cx + 78, y: cy - 8, "font-size": 12, fill: "#e65100",
      "font-family": MONO }, "A₃ cusp  y² = x³"));
    // fan of "which group?" labels, all equally possible
    const fan = [[-130, -78], [-150, -18], [-150, 44], [-120, 96]];
    fan.forEach((p, i) => {
      svg.appendChild(el("line", { x1: cx + 66, y1: cy, x2: cx + p[0] + 34, y2: cy + p[1],
        stroke: "#9e9e9e", "stroke-width": 1, "stroke-dasharray": "3 3" }));
      svg.appendChild(el("text", { x: cx + p[0], y: cy + p[1] + 4, "font-size": 12.5,
        fill: "#607d8b", "font-family": SANS, "text-anchor": "middle" }, GROUPS[i] + " ?"));
    });
    svg.appendChild(el("text", { x: cx, y: H - 12, "text-anchor": "middle", "font-size": 12,
      fill: "#455a64", "font-family": SANS }, "one local germ · consistent with all groups · group-blind"));
  }

  function renderGlobal() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    axes();
    // sub-Riemannian astroid: x = a cos^3 t, y = b sin^3 t  (schematic; slightly skewed b≠a = deviation)
    const a = 128, b = 150, pts = [];
    for (let t = 0; t <= 6.2832; t += 0.02) {
      const c = Math.cos(t), s = Math.sin(t);
      const x = cx + a * c * c * c;
      const y = cy - b * s * s * s;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    svg.appendChild(el("polygon", { points: pts.join(" "), fill: "#e65100", "fill-opacity": 0.07,
      stroke: "#e65100", "stroke-width": 2.2, "stroke-linejoin": "round" }));
    // four cusps
    [[a, 0], [-a, 0], [0, b], [0, -b]].forEach(p =>
      svg.appendChild(el("circle", { cx: cx + p[0], cy: cy - p[1], r: 3, fill: "#e65100" })));
    // symmetry axes (dashed) + moduli caption
    svg.appendChild(el("text", { x: cx + a + 6, y: cy + 14, "font-size": 11.5, fill: "#e65100",
      "font-family": MONO }, "4-cusp astroid"));
    svg.appendChild(el("text", { x: cx, y: 26, "text-anchor": "middle", "font-size": 12,
      fill: "#455a64", "font-family": SANS }, "astroid size and shape ↔ moduli (χ, κ)"));
    // abnormal-stratum badge
    const bx = 44, by = 40;
    svg.appendChild(el("rect", { x: bx, y: by, width: 150, height: 40, rx: 5, fill: "#fff",
      stroke: "#2b6cb0", "stroke-width": 1.2 }));
    svg.appendChild(el("text", { x: bx + 10, y: by + 16, "font-size": 11, fill: "#2b6cb0",
      "font-family": SANS }, "abnormal stratum"));
    svg.appendChild(el("text", { x: bx + 10, y: by + 31, "font-size": 11.5, fill: "#455a64",
      "font-family": MONO }, "contact 3D: absent"));
    svg.appendChild(el("text", { x: cx, y: H - 12, "text-anchor": "middle", "font-size": 12,
      fill: "#455a64", "font-family": SANS }, "full conjugate locus + symmetry + abnormal bit · the fingerprint"));
  }

  const bL = document.getElementById("ob-btn-local"), bG = document.getElementById("ob-btn-global");
  bL.onclick = () => { renderLocal(); bL.classList.add("active"); bG.classList.remove("active"); };
  bG.onclick = () => { renderGlobal(); bG.classList.add("active"); bL.classList.remove("active"); };
  renderLocal();
})();
</script>

<div class="l-body" markdown="1">

## The measured inverse result

On four synthetic candidate groups, the fingerprint classifier achieves **0.99 exact accuracy** at the lowest tested noise and **0.55** at noise 0.03; accepting a correct coarse class gives **0.98** at the latter noise. The thresholds use ten calibration seeds distinct from the 25 evaluation seeds per group. The Heisenberg/SE(2) distinction depends on finite-scale refocusing deviation; Engel/Cartan separation depends on the growth vector. Removing the corresponding observable removes that distinction. [Confusion matrix and aliasing results]({% post_url 2026-07-22-caustics-to-groups-inverse-map %}).

These tests use known model flows and directional reach, not arbitrary observed cusp photographs. The implemented contact deviation averages the refocusing-time shortfall against the flat law; it is not the originally proposed general Hausdorff shape-distance estimator. Real diffusion-MRI acquisition inference remains unmeasured. The synthetic SE(3) test recovers its tangent-cone class, not unique identification of every geometry with that growth vector. [Test scope]({% post_url 2026-07-26-caustics-to-groups-in-the-wild %}).

**A second negative result corrects the original gravitational interpretation.** A deterministic gravitational flow supplies no controlled distribution whose brackets could be inferred this way. A Zel'dovich fold can counterfeit Heisenberg's pointwise scaling exponent without being sub-Riemannian. Therefore the effective-flow abstention test cannot establish recovery of physical gravitational growth vectors. [Derivation and counterexample](https://github.com/moiseevigor/moiseevigor.github.io/blob/master/research/caustics-to-groups/docs/E5-no-sr-structure-in-gravity.md).

The sampled fold and cusp results above are numerical evidence with stated exceptions. They neither prove genericity for every candidate exponential map nor establish an unrestricted inverse theorem. [Methods and result reports](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/caustics-to-groups/docs).

## Glossary

- **Sub-Riemannian (SR) structure** — a manifold with a distinguished sub-bundle of
  allowed directions (the *distribution*) and a metric on it; shortest paths must move
  along the distribution.
- **Distribution $\mathcal{D}$** — the sub-bundle of allowed velocity directions at
  each point; its *rank* is its dimension, its *corank* the codimension in $TM$.
- **Exponential map** — the map from initial covectors at the base point to geodesic
  endpoints; a Lagrangian map whose singular set is the caustic.
- **Caustic / conjugate locus** — the set where the exponential map is singular
  (geodesics focus); the *first* conjugate locus is the nearest such set to the pole.
- **Lagrangian map** — the base projection of a Lagrangian submanifold under a
  Hamiltonian flow; its singularities are classified by Arnol'd's ADE list.
- **ADE germs** — the universal local caustic singularities: fold $A_2$, cusp $A_3$,
  swallowtail $A_4$, umbilic $D_4$ (and higher). *Universal* for generic Lagrangian
  maps of dimension $\le 5$ ⇒ group-blind wherever the exponential map is generic.
- **Tangent cone / nilpotent approximation** — the Carnot group an SR structure
  converges to under infinite zoom at a point; its caustic is the reference fingerprint.
- **Carnot group** — a nilpotent Lie group with a dilation structure; the model space
  for an SR tangent cone.
- **Growth vector $(n_1, n_2, \dots)$** — dimensions of the flag
  $\mathcal{D} \subset \mathcal{D}+[\mathcal{D},\mathcal{D}] \subset \cdots$ generated
  by iterated brackets; e.g. $(2,3)$ contact, $(2,3,4)$ Engel, $(2,3,5)$ Cartan.
- **Homogeneous dimension $Q$** — $\sum_i i\,(n_i-n_{i-1})$; the exponent in ball-volume
  scaling $\mathrm{vol}\,B(r)\sim r^Q$ (Ball–Box theorem).
- **Abnormal geodesic** — an extremal arising from the distribution's shape alone, not
  the metric; absent for the 3D contact candidates, present for Engel and Cartan.
- **Moduli $(\chi, \kappa)$** — Agrachev–Barilari differential invariants classifying
  left-invariant 3D contact SR structures; $\chi=\kappa=0$ is flat Heisenberg.

- **E10 (fold check)** — a numerical check added after review: at the first conjugate
  point of random geodesics, is the exponential map a *fold* (Jacobian of corank 1 whose
  kernel is transverse to the critical set)? Supports the group-blindness hypothesis for
  SE(2), Engel and Cartan; Heisenberg is the negative control.
- **E11 (cusp search)** — the follow-up: along loops of initial covectors, find where the
  kernel of the exponential map's Jacobian becomes *tangent* to the critical set, and test
  whether that point is a *cusp* (corank 1, simple tangency, semicubical image). Also
  runs the E10 fold test on $\mathrm{SE}(3)$ and on its nilpotent tangent cone.
- **Degenerate tangency** — a point where the kernel is tangent to the critical set but
  the tangency is not simple, so the germ is not a cusp; in E11 most of these are points
  where a one-parameter family of geodesics refocuses at one point.

[^subriemannian]: A geometry in which motion is allowed only along certain directions at each point, and length is measured under that restriction; its shortest paths trade distance travelled against turning (see Glossary).

[^lagrangian]: A map that projects a special "half-dimensional" surface carried along by a flow of paths back down to ordinary space; where that projection folds, paths pile up and a caustic appears.

[^conjugate]: Two points are conjugate along a geodesic when a whole family of nearby geodesics leaving the first refocuses at the second; the set of such refocusing points, seen from a fixed start, is the conjugate locus.

[^arnold]: Vladimir Arnol'd's classification showing that the caustics you generically see come from a short universal list labelled by the letters A, D, E — the same list whether the caustic is in optics, mechanics, or cosmology. "Generically" is part of the statement: the list is finite for Lagrangian maps of manifolds of dimension at most 5 that are in general position (Arnol'd, Gusein-Zade &amp; Varchenko 1985, ch. 21).

[^carnot]: A special kind of curved group with a built-in notion of zoom (dilation), which is exactly the shape any sub-Riemannian geometry takes on when you magnify it infinitely at a point.

[^growthvector]: A short sequence of integers recording how quickly the allowed directions, and the new directions you reach by combining them, fill up all of space — a coarse fingerprint of the local geometry.

[^abnormal]: A shortest-path candidate that owes its existence to the *shape* of the allowed directions rather than to the metric; some geometries have them and some do not, and that yes/no is itself informative.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>V. I. Arnol'd (1990). <em>Singularities of Caustics and Wave Fronts</em>. Mathematics and Its Applications 62, Kluwer.</li>
  <li>V. I. Arnol'd, S. M. Gusein-Zade &amp; A. N. Varchenko (1985). <em>Singularities of Differentiable Maps, Vol. I</em>. Birkhäuser.</li>
  <li>A. Agrachev, G. Charlot, J.-P. Gauthier &amp; V. Zakalyukin (2000). "On sub-Riemannian caustics and wave fronts for contact distributions in the three-space." <em>J. Dyn. Control Syst.</em> 6, 365–395.</li>
  <li>El-H. Chakir El-Alaoui, J.-P. Gauthier &amp; I. Kupka (1996). "Small sub-Riemannian balls on $\mathbb{R}^3$." <em>J. Dyn. Control Syst.</em> 2, 359–421.</li>
  <li>A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J. Dyn. Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.</li>
  <li>A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to Sub-Riemannian Geometry</em>. Cambridge Studies in Advanced Mathematics 181, Cambridge University Press.</li>
  <li>B. Bonnet, J.-P. Gauthier &amp; F. Rossi (2019). "Generic singularities of the 3D-contact sub-Riemannian conjugate locus." <em>C. R. Acad. Sci. Paris, Ser. I</em> 357, 542–549. <a href="https://arxiv.org/abs/1812.01508">arXiv:1812.01508</a>.</li>
  <li>L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds and stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391. <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.</li>
  <li>Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 16, 1018–1039. <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.</li>
  <li>A. A. Ardentov &amp; Yu. L. Sachkov (2017). "Maxwell strata and cut locus in the sub-Riemannian problem on the Engel group." <em>Regul. Chaotic Dyn.</em> 22, 909–936. <a href="https://arxiv.org/abs/1710.00216">arXiv:1710.00216</a>.</li>
  <li>A. A. Ardentov &amp; E. Hakavuori (2022). "Cut time in the sub-Riemannian problem on the Cartan group." <em>ESAIM: COCV</em> 28, 12. <a href="https://arxiv.org/abs/2107.06730">arXiv:2107.06730</a>.</li>
  <li>R. Duits, A. Ghosh, T. C. J. Dela Haije &amp; A. Mashtakov (2013). "On sub-Riemannian geodesics in $\mathrm{SE}(3)$ whose spatial projections do not have cusps." <a href="https://arxiv.org/abs/1305.6061">arXiv:1305.6061</a>.</li>
  <li>R. Duits, U. Boscain, F. Rossi &amp; Yu. Sachkov (2014). "Association fields via cuspless sub-Riemannian geodesics in $\mathrm{SE}(2)$." <em>J. Math. Imaging Vis.</em> 49, 384–417. <a href="https://arxiv.org/abs/1301.6976">arXiv:1301.6976</a>.</li>
  <li>G. Citti &amp; A. Sarti (2006). "A cortical based model of perceptual completion in the roto-translation space." <em>J. Math. Imaging Vis.</em> 24, 307–326.</li>
  <li>J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact structure." <em>J. Physiol. Paris</em> 97, 265–309.</li>
  <li>J. Feldbrugge, R. van de Weygaert, J. Hidding &amp; J. Feldbrugge (2018). "Caustic skeleton &amp; cosmic web." <em>JCAP</em> 05, 027. <a href="https://arxiv.org/abs/1703.09598">arXiv:1703.09598</a>.</li>
  <li>B. Hertzsch, J. Feldbrugge, M. Rodriguez &amp; R. van de Weygaert (2026). "A new recipe for caustic pancakes: on the reality of walls in the cosmic web." <em>JCAP</em> 02, 037. <a href="https://arxiv.org/abs/2510.02419">arXiv:2510.02419</a>.</li>
  <li>S. More, H. Miyatake, M. Takada et al. (2016). "Detection of the splashback radius and halo assembly bias of massive galaxy clusters." <em>ApJ</em> 825, 39. <a href="https://arxiv.org/abs/1601.06063">arXiv:1601.06063</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
