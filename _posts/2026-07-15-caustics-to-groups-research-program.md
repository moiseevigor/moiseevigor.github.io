---
layout: distill
title: "From Caustics to Groups: A Research Program"
subtitle: >
  A caustic is where a flow of paths focuses — the bright edge in a coffee cup, the
  cusp in a gravitational lens, the shell-crossing wall of the cosmic web. This post
  scopes a falsifiable research program for the <em>reverse</em> map: given an observed
  field of caustics, infer the hidden sub-Riemannian (Lie-group) geometry that produced
  it. The program is built around a hard obstruction — most caustics are provably
  group-blind — and the three places where the discriminating information actually lives.
date: 2026-07-15 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, lie-groups, singularity-theory, optimal-control, inverse-problems]
image: /public/img/posts/caustics-groups-1.svg
description: >
  Scoping document for a research program that inverts the map from sub-Riemannian
  group structure to caustics: the ADE group-blindness obstruction, a three-component
  fingerprint (tangent-cone growth vector, conjugate-locus moduli at the pole, abnormal
  stratum), hypotheses with pre-registered kill criteria, ordered experiments on
  synthetic and real caustic fields, and the metrics that judge them.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: 1
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this document is — and what it is not</div>
A <strong>scoping document</strong>, not a result. It defines a research program:
the question, what the literature already settles, the one obstruction the whole
design must respect, four hypotheses with falsifiable predictions and the metrics
that will judge them, and an ordered sequence of experiments — synthetic first,
real data last. The program follows the loop <em>literature → edge &amp; caveats →
hypothesis → test → analysis → next hypothesis</em>, and each hypothesis states in
advance the exact result that would <em>kill</em> it. A clean negative result, with
evidence, is a valid outcome here — arguably the most likely one.
</div>

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

**The planned arc.** Part 1 *(this page)* scopes the program. **Part 2** *(upcoming)*
builds the forward model — the caustics of the model groups Heisenberg, $\mathrm{SE}(2)$,
Engel, and Cartan, with their explicit conjugate loci. **Part 3** *(upcoming)* builds
the inverse map — the three-component fingerprint, the classifier, and the first
confusion matrix. **Part 4** *(upcoming)* takes the surviving method into the wild:
diffusion-MRI orientation fields, and the cosmic web as the stress test that shows
*where the method must stay silent.* Theory background lands in appendices C1–C5.

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

Here is the wall the whole design must respect. It is not an engineering
inconvenience; it is a theorem.

**Local generic caustics are group-blind.** Away from special points, a generic
Lagrangian caustic exhibits only the **universal ADE germs** classified by Arnol'd's
singularity theory[^arnold]: the **fold** $A_2$, the **cusp** $A_3$, the
**swallowtail** $A_4$, and the **umbilic** $D_4$. These germs are *universal* — the
same short list appears in optics, in the cosmic web, in the SR exponential of every
one of our candidate groups. A single cusp you find in the data carries **no**
information about which group produced it. The naive detector — *see a cusp, name the
group* — is provably hopeless, and any pipeline that pretends otherwise is fitting
noise.

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

The correct matching statistic is not "does the data contain a cusp" but the
**nilpotent-deviation**: *how far, and in what shape, does the observed conjugate
locus depart from the caustic of its own tangent cone* (in the spirit of
Sacchelli's caustic-stability invariant, 2019). Everything downstream is built
around that quantity — defined precisely below — not around raw cusp classification.

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
theorem — but nobody appears to have assembled the three structure-specific
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
      fill: "#455a64", "font-family": SANS }, "shape deviation from the flat astroid = moduli (χ, κ)"));
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

## The matching statistic, defined

Let $C_{\mathrm{obs}}$ be the observed first conjugate locus near the base point,
sampled as a point set in SR-normal coordinates (the intrinsic dilation-adapted
coordinates in which the tangent cone is the identity model). Let
$C_{\mathrm{nil}}(\theta)$ be the conjugate locus of the candidate tangent cone with
growth vector $\theta$ (Heisenberg for $(2,3)$, Engel for $(2,3,4)$, …), computed in
the same coordinates from the known closed form. The **nilpotent-deviation
statistic** is the shape distance

$$
\delta(C_{\mathrm{obs}}, \theta) \;=\; \min_{g \in G_\theta} \; d_{\mathrm{H}}\!\big(g \cdot C_{\mathrm{obs}},\; C_{\mathrm{nil}}(\theta)\big),
$$

where $d_{\mathrm{H}}$ is the Hausdorff distance between the two curve/surface sets
and the minimum is over $G_\theta$, the group of intrinsic symmetries (dilations and
rotations) of the nilpotent model — so the statistic measures *shape*, not accidental
placement or scale. The recovered class is $\hat\theta = \arg\min_\theta \delta$, and
the *residual shape* of $C_{\mathrm{obs}}$ after removing the best nilpotent match
carries the moduli $(\chi, \kappa)$ that pin the specific group within the class.
This is the quantity every experiment below reports, with uncertainty.

## Hypotheses

Conventions: "conjugate locus at the pole" always means the *full* first conjugate
locus from the base point, not a single germ; growth vectors are written
$(n_1, n_2, \dots)$; all metrics are defined in the data-analysis plan.

**H1 (identifiability).** *From noisy, finite samples of a caustic / conjugate-locus
field, the tangent-cone growth vector can be recovered stably.*
Falsifiable prediction: on synthetic data with a known growth vector (E0), the
Ball–Box growth-vector estimator returns the correct vector with accuracy rising
monotonically in sample size and degrading gracefully in noise, beating a
majority-class baseline at realistic noise. **If recovery is no better than the
baseline at any noise level, H1 fails** and the tangent-cone leg of the fingerprint
is dead.

**H2 (discrimination).** *The three-component fingerprint reliably separates the
candidate group list from caustic observables alone.*
Falsifiable prediction: the classifier's confusion matrix on held-out synthetic
realizations (E1) shows significantly-above-chance separation of
$\{\mathrm{Heisenberg}, \mathrm{SE}(2), \mathrm{Engel}, \mathrm{Cartan}\}$, with the
abnormal-stratum bit cleanly splitting $\{$contact 3D$\}$ from $\{$Engel, Cartan$\}$.
**If the off-diagonal mass is not significantly below chance, H2 fails** — and the
program reports *which* observables are informative and which are not.

**H3 (rigidity / aliasing).** *Some group pairs are provably or empirically aliased —
they produce indistinguishable caustics under the available observables.*
This hypothesis predicts its own partial failure: certain pairs (candidates:
$\mathrm{SE}(2)$ vs. Heisenberg, which share the $(2,3)$ tangent cone and differ only
in moduli; structures related by projective/affine equivalence of SR metrics) will
*collapse* under caustic observables. The deliverable is an **aliasing map**: for
each pair, the smallest observable set that separates it, or a statement that none in
our kit does. **H3 "fails" only if the aliasing is not reproducible** — i.e. if the
same pair sometimes separates and sometimes does not under identical protocol, which
would indict the estimator rather than reveal geometry.

**H4 (in-the-wild inference).** *On real data where the configuration space is
assumed to be a group (cortex, DW-MRI), the fingerprint picks out a best-fitting
candidate structure with calibrated confidence.*
Falsifiable prediction: on a DW-MRI orientation field (E3), the recovered tangent
cone is stable across the acquisition and consistent with the left-invariant
$\mathrm{SE}(3)$ model, with a reported posterior — *and* on the cosmic-web stress
test (E4) the method correctly **abstains** (wide posterior, no confident group),
because the flow is not left-invariant. **H4 fails if the method returns a confident
group on the effective-flow data** — that would prove it is fitting caustic
universals, not geometry.

## Experiments, in order

Each experiment gates the next; a kill criterion stops a branch. The generator and
the detector share **no fitted state** — the leakage discipline of the sibling
series applies here verbatim.

**E0 (synthetic ground truth; laptop).** For each candidate tangent cone, integrate
the nilpotent SR geodesic flow from a base point (closed form where it exists;
symplectic integration otherwise), compute the first conjugate locus, and emit
caustic point-clouds with controllable noise and sampling density. Ground truth — the
growth vector and the exact locus — is known by construction. Run the growth-vector
estimator and the conjugate-locus descriptor across a noise/sampling grid.
**Tests H1. Kill criterion: no growth-vector recovery above baseline at any noise
level.**

**E1 (the inverse core + first confusion matrix; laptop).** Add the full non-nilpotent
groups (Heisenberg, $\mathrm{SE}(2)$, Engel, Cartan) via their explicit geodesics;
generate labelled caustic realizations; run the complete three-component fingerprint
and the classifier; produce the first confusion matrix on held-out realizations.
**Tests H2.** Exit target set after the E0 baseline, not guessed in advance.

**E2 (robustness &amp; the aliasing map; laptop).** Noise and sampling sweeps;
identifiability curves (recovery accuracy vs. noise, per component); the rigidity
study — which pairs collapse, and the minimal observable that separates each.
**Tests H3.** Produces the honest map of what is and isn't distinguishable.

**E3 (SE(3) + real neuro-imaging data).** Add the $\mathrm{SE}(3)$ forward model
(elliptic-integral geodesics; cuspless-projection handling, Duits et al. 2013). Wire a
thin adapter converting a DW-MRI orientation field into the common
`ConjugateLocusSample` schema (credentialed download gated behind a documented step).
Run inference; report the recovered structure *with* its homogeneity assumptions
stated explicitly. **Tests H4 (the "yes" half).**

**E4 (astrophysical stress test — calibrated silence).** Apply the same pipeline to a
cosmic-web caustic-skeleton field (Feldbrugge/Hertzsch-style shell-crossing surfaces)
and to splashback caustics. **The pre-registered expectation is abstention.**
**Tests H4 (the "no" half).** A confident group output here is a *failure* of the
method, not a discovery — and catching that is the point.

## Data-analysis plan: the metrics, defined

Every claim is judged by one of these, all fixed before any experiment runs.

- **M1 — growth-vector accuracy.** From local ball-volume scaling
  $\mathrm{vol}\,B(q_0, r) \sim r^{\,Q}$, the **homogeneous dimension**
  $Q = \sum_i i\,(n_i - n_{i-1})$ and the per-step increments give the growth vector;
  report the fraction of held-out points whose full vector is recovered exactly, with
  a confusion matrix over vectors. (Heisenberg/$\mathrm{SE}(2)$: $Q=4$; Engel: $Q=7$;
  Cartan: $Q=10$.)
- **M2 — nilpotent deviation $\delta$.** The statistic defined above; reported as a
  distribution over realizations, per candidate $\theta$, with the gap between the
  best and second-best $\theta$ as the discrimination margin.
- **M3 — conjugate-locus descriptor error.** Cusp count and symmetry-group
  identification accuracy, plus the estimated moduli $(\hat\chi, \hat\kappa)$ against
  ground truth (bias and spread).
- **M4 — abnormal-stratum detection.** Precision/recall of the yes/no abnormal-bit
  against the known class, flagged as **lower-confidence** throughout — regularity of
  abnormal minimizers is itself an open problem, so this leg is reported with an
  explicit reliability caveat, never as a hard gate.
- **M5 — classifier posterior &amp; confusion matrix.** A posterior over the candidate
  list per realization; the confusion matrix is the headline deliverable of H2, scored
  only on held-out realizations, split **by realization, never by point**.
- **M6 — aliasing separation.** For each group pair, the minimal observable subset (of
  the three fingerprint components) achieving reproducible separation at a fixed
  confidence, or "none in kit."

Calibration discipline: every free parameter (kernel scales, ball-radius range for
the scaling fit, Hausdorff sampling density, classifier thresholds) is set on
designated calibration realizations only; every reported number comes from held-out
realizations. Parameter count is part of the model comparison.

## Caveats and failure modes, catalogued now

1. **ADE universality caps local data.** The method may need global/base-point
   information (the full conjugate locus from a pole) that real fields do not cleanly
   provide — you rarely get to choose the pole in the wild. Where only local germs are
   available, the honest output is "group-blind here." The write-up must never let a
   local cusp count leak into a group claim.
2. **Homogeneity rarely holds.** A recovered "group" is really the *tangent cone at a
   point*; a real field gives a *field* of tangent cones. Outputs are framed as
   tangent-cone fields, and a single global group is claimed only where homogeneity is
   independently justified.
3. **Abnormal detection is numerically delicate.** Treated as a lower-confidence leg
   and flagged (M4). A missed or spurious abnormal bit degrades class separation but
   never silently flips a verdict.
4. **Genuine mathematical aliasing.** Two non-isomorphic structures can be
   projectively/affinely equivalent and share caustics — a theorem, not a bug. The
   aliasing map (M6) is where this is reported, not hidden.
5. **Coordinate/units errors masquerade as geometry.** SR-normal coordinates,
   dilation weights, and frames are tracked explicitly; a silent weight error would
   look like a moduli signal.
6. **Compute and closed-form ceilings.** $\mathrm{SE}(3)$ geodesics need elliptic
   integrals and careful cuspless handling; where no closed form exists the flow is
   integrated symplectically and the integration error is reported alongside the
   deviation statistic.

## Success criteria and outcomes

- **Minimum publishable outcome:** E0+E1 show stable growth-vector recovery and an
  above-chance confusion matrix on the synthetic candidate list → a methods
  contribution: *a graded inverse estimator from caustics to sub-Riemannian
  structure, with its identifiability curves.*
- **Strong outcome:** additionally, E3 returns a stable, well-calibrated
  $\mathrm{SE}(3)$ inference on real DW-MRI **and** E4 correctly abstains on the cosmic
  web → the method has a demonstrated honest scope, not just synthetic success.
- **Null outcome:** no recovery above baseline → the negative result *plus the
  aliasing map* is the contribution: a precise statement of what caustic data can and
  cannot reveal about the group behind it.

## Open questions / next tests

- Does the nilpotent-deviation statistic $\delta$ separate $\mathrm{SE}(2)$ from
  Heisenberg at realistic noise, given they share the $(2,3)$ tangent cone and differ
  only in moduli?
- Is the abnormal-stratum bit recoverable at all from *caustic* data (as opposed to
  the distribution itself), or is it observable only with access to the geodesic flow?
- How does the estimator behave on a *field* of tangent cones — can it segment a
  domain into regions of differing growth vector, the way a web finder segments
  sheets/filaments/nodes?
- What is the exact aliasing class under projective equivalence within our candidate
  list — provable, or only empirical?

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
  swallowtail $A_4$, umbilic $D_4$ (and higher). *Universal* ⇒ group-blind.
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
  the metric; present iff corank is high enough.
- **Moduli $(\chi, \kappa)$** — Agrachev–Barilari differential invariants classifying
  left-invariant 3D contact SR structures; $\chi=\kappa=0$ is flat Heisenberg.
- **Nilpotent-deviation statistic $\delta$** — Hausdorff shape distance from the
  observed conjugate locus to its tangent cone's caustic, minimised over intrinsic
  symmetries; the program's central matching quantity.
- **H1–H4, E0–E4, M1–M6** — the four hypotheses, five experiments, and six metrics
  defined above.

[^subriemannian]: A geometry in which motion is allowed only along certain directions at each point, and length is measured under that restriction; its shortest paths trade distance travelled against turning (see Glossary).

[^lagrangian]: A map that projects a special "half-dimensional" surface carried along by a flow of paths back down to ordinary space; where that projection folds, paths pile up and a caustic appears.

[^conjugate]: Two points are conjugate along a geodesic when a whole family of nearby geodesics leaving the first refocuses at the second; the set of such refocusing points, seen from a fixed start, is the conjugate locus.

[^arnold]: Vladimir Arnol'd's classification showing that the caustics you generically see come from a short universal list labelled by the letters A, D, E — the same list whether the caustic is in optics, mechanics, or cosmology.

[^carnot]: A special kind of curved group with a built-in notion of zoom (dilation), which is exactly the shape any sub-Riemannian geometry takes on when you magnify it infinitely at a point.

[^growthvector]: A short sequence of integers recording how quickly the allowed directions, and the new directions you reach by combining them, fill up all of space — a coarse fingerprint of the local geometry.

[^abnormal]: A shortest-path candidate that owes its existence to the *shape* of the allowed directions rather than to the metric; some geometries have them and some do not, and that yes/no is itself informative.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>V. I. Arnol'd (1990). <em>Singularities of Caustics and Wave Fronts</em>. Mathematics and Its Applications 62, Kluwer.</li>
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
