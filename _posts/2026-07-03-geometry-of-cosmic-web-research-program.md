---
layout: distill
title: "The Geometry of the Cosmic Web: A Research Program"
subtitle: >
  Matter in the Universe collapses into a web of filaments. This post scopes a
  falsifiable research program: lift the cosmic web onto the position–orientation
  manifold $\mathbb{R}^3 \times S^2 \cong \mathrm{SE}(3)/\mathrm{SO}(2)$ — the same
  machinery the visual cortex uses to complete contours — and test with public
  simulation and survey data whether sub-Riemannian geodesics trace, and perhaps
  shape, the filaments.
date: 2026-07-03 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE3, cosmic-web, filaments, cosmology, optimal-control]
description: >
  Scoping document for a research program connecting the sub-Riemannian geometry of
  the "Geometry of Seeing" series to cosmic-web filaments: literature review,
  hypotheses with falsifiable predictions, ordered experiments on public data,
  and the analysis plan with defined metrics.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: 1
comments: true
published: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Status — the program has been run to completion</div>
<p>This document is the <em>plan</em>, written before the experiments. The
plan was then executed in full, and every hypothesis below now carries a
verdict. The story of what happened — with interactive figures built from
the experiment data — is
<a href="{% post_url 2026-07-04-cosmic-web-two-models %}">Part 2: Two Ways
to See a Cosmic Filament</a>. In brief:</p>
<ul>
<li><strong>The detector claim (H1) died</strong> — and the way it died is
the best part. It first appeared to win with spectacular statistics; a
flaw in our own scoring was manufacturing the win, and the corrected race
reversed the verdict. The simpler standard method matches or beats the
lifted one nearly everywhere.</li>
<li><strong>The physics claim (H4) died in the bulk</strong> — matter
builds filaments by falling <em>across</em> them, not by flowing along
them. The companion theory question (T1) resolved the same way:
filaments are pile-ups (shocks) of the matter flow, not shortest
paths.</li>
<li><strong>The real-sky test (H3) succeeded</strong> — the webs both
methods draw on 274,000 real galaxies sit on measurably hot gas (up to
9σ under the strictest controls), so the extracted networks are
physically real.</li>
<li><strong>One clean survivor:</strong> the lifted geometry reads the
web's <em>directions</em> better than the standard method, in
simulations and on the real sky alike.</li>
<li><strong>An unplanned product:</strong> chasing "what correction does
the standard transport model actually need?" produced a one-rule model —
brake sideways at the web — that performs within a hair of its
theoretical best (see Part 2 and
<a href="/mathematics/2026/07/09/cosmic-web-B4-transverse-damping/">Appendix B4</a>).</li>
</ul>
<p>Full experiment reports: <code>research/cosmic-web/docs/</code> in the
repository, entry point <code>SYNTHESIS.md</code>.</p>
</div>

<div class="callout">
<div class="callout-title">What this document is</div>
A <strong>scoping document</strong>, not a result. It defines a research program:
the question, what the literature already says, the candidate edge, the caveats,
four hypotheses with falsifiable predictions and the metrics that will judge them,
and an ordered sequence of experiments on public data. Every experiment below can
be run on a single workstation with public datasets. The program follows the loop
<em>literature → edge &amp; caveats → hypothesis → test → analysis → next
hypothesis</em>, and each hypothesis states in advance what result would kill it.
</div>

## The question

Gravity organises matter into a **cosmic web**: sheets, filaments of width $$\sim 1{-}3\,h^{-1}\mathrm{Mpc}$$, and nodes, surrounding vast voids. Filaments are
not merely *places* — each carries a **local direction** (its tangent). The
[Geometry of Seeing]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
series developed the mathematics of exactly this situation in 2D: the visual cortex
lifts an image from $$\mathbb{R}^2$$ to the position–orientation space $$\mathbb{R}^2 \times S^1 \cong \mathrm{SE}(2)$$, and completes contours along
sub-Riemannian geodesics[^subriemannian]. The 3D analogue is the homogeneous space[^homogeneous]

$$
\mathbb{R}^3 \times S^2 \;\cong\; \mathrm{SE}(3)/\mathrm{SO}(2),
$$

positions plus unit directions modulo roll about the tangent — the state space
used for fibre tracking in diffusion MRI and vessel tracking in retinal imaging
(Duits &amp; Franken 2011; Portegies et al. 2015; Duits, Boscain, Rossi &amp;
Sachkov 2014).

The program asks two **separate** questions, in increasing order of ambition:

1. **Methodological (C1).** Is the orientation-lifted manifold a *better
   instrument* for extracting filament spines from noisy density fields than
   density-only methods — especially at crossings and junctions, where
   $$\mathrm{SE}(2)$$/$$\mathrm{SE}(3)$$ lifting is provably advantageous in imaging?
2. **Physical (C2).** Do the *dynamics* of structure formation themselves follow
   sub-Riemannian geodesics of an effective metric on the lifted space — i.e., is
   the intrinsic geometry not just a good detector but part of the mechanism?

C1 is concrete, testable, and publishable on its own. C2 is speculative; the
scoping below keeps it honest by demanding a dynamical test in simulations, not
just skeleton overlap. Conflating the two is the main failure mode this document
is designed to avoid.

## What the literature already says

**Consensus physics.** In $$\Lambda$$CDM[^lcdm], small Gaussian density perturbations[^gaussian-perturbations] grow
by gravitational instability in an expanding FLRW[^flrw] background. Collapse is
**anisotropic**: the tidal tensor $$T_{ij} = \partial_i \partial_j \Phi$$ (Hessian of
the peculiar gravitational potential) has an eigenframe, and matter collapses
first along the eigenvector with the largest eigenvalue (forming sheets or
"pancakes"), then along the second (filaments), then the third (halos/nodes). The
**Zel'dovich approximation** (Zel'dovich 1970) captures this with the Lagrangian
map $$\mathbf{x}(\mathbf{q},t) = \mathbf{q} - D(t)\,\nabla_q \Phi(\mathbf{q})$$,
where $$D(t)$$ is the linear growth factor[^growth-factor]; the **adhesion model** (Gurbatov,
Saichev &amp; Shandarin 1989) adds an infinitesimal viscosity (Burgers equation[^burgers])
so matter *sticks* to sheets and filaments after shell-crossing. Bond, Kofman
&amp; Pogosyan (1996) showed the filamentary pattern is already encoded in the
initial tidal field around proto-clusters — hence "cosmic web".

In plain words: gravity does not crush a blob of matter evenly. The
surrounding matter stretches it more strongly along some directions than
others, and the blob gives way one axis at a time — first flattening into a
sheet, then draining into a filament, finally pooling into a node. The
animation below plays this sequence; the three arrows are the tidal
directions, ordered by how hard each squeezes. (The transport models are
developed from scratch in
[Appendix B1](/mathematics/2026/07/06/cosmic-web-B1-transport-models/); the
tidal frame in
[Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/).)

[^subriemannian]: A geometry in which movement is allowed only along certain directions at each point, and path length is measured under that restriction; its shortest paths trade distance travelled against turning (see Glossary).

[^homogeneous]: A space that looks the same from every point: a family of symmetries can carry any point to any other, so no location is special.

[^lcdm]: The standard cosmological model: most matter is "cold dark matter" — slow-moving and invisible — and $$\Lambda$$ (Lambda) is the constant energy of empty space that accelerates the expansion (see Glossary).

[^gaussian-perturbations]: Tiny random ripples in the early distribution of matter whose statistics follow the bell curve: fully described by the typical ripple strength at each size, with no preferred shapes or directions.

[^flrw]: Friedmann–Lemaître–Robertson–Walker: the solution of Einstein's equations describing a universe that is on average the same everywhere and expands uniformly in time.

[^growth-factor]: The overall factor by which small density ripples have grown by time $$t$$: multiply the initial ripple pattern by $$D(t)$$ to get its strength at that time.

[^burgers]: The simplest equation of motion for a fluid with no pressure; adding a vanishingly small viscosity makes particles stop streaming through one another and instead pile up where they meet.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-collapse">
  <div style="text-align:center; margin-bottom:0.4em;">
    <button id="col-play" style="font-size:0.8rem; padding:2px 12px; cursor:pointer;
      border:1px solid #bbb; background:#fafafa; border-radius:3px;">restart</button>
    <span id="col-stage" style="font-size:0.85rem; color:#555; margin-left:1em;">cloud</span>
  </div>
  <div id="cw-collapse" style="text-align:center;"></div>
  <figcaption>
    <strong>Animation.</strong> Anisotropic gravitational collapse in the
    tidal eigenframe: the same cloud of matter collapses first along the
    strongest tidal direction (λ₁ — becoming a <em>sheet</em>), then along
    the second (λ₂ — a <em>filament</em>), and finally along the weakest
    (λ₃ — a <em>node</em>). Filaments point along the λ₃ direction: the
    axis gravity squeezes <em>last</em>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

**How filaments are found today.** Four families of methods, all operating on
scalar or tensor fields in $$\mathbb{R}^3$$:

- **T-web** (Hahn et al. 2007; Forero-Romero et al. 2009): classify each point by
  how many eigenvalues of $$T_{ij}$$ exceed a threshold $$\lambda_{\mathrm{th}}$$;
  two ⇒ filament, with the axis along the eigenvector of the *smallest*
  eigenvalue.
- **V-web** (Hoffman et al. 2012): same classification using the velocity shear
  tensor $$\Sigma_{ij} = -\tfrac{1}{2H_0}(\partial_i v_j + \partial_j v_i)$$.
- **Multiscale filters**: MMF (Aragón-Calvo et al. 2007) and NEXUS/NEXUS+
  (Cautun, van de Weygaert &amp; Jones 2013) — Hessian-based morphology filters
  over a scale-space, a direct cousin of Frangi vesselness in medical imaging.
- **Topological skeletons**: DisPerSE (Sousbie 2011) extracts the filamentary
  skeleton via discrete Morse theory and persistent homology[^persistent-homology]; T-ReX (Bonnaire et
  al. 2020) uses regularised minimum spanning trees.

Libeskind et al. (2018) compared twelve such web finders on the same simulation:
they disagree substantially on filament boundaries and junctions — evidence that
the *instrument* question (C1) is genuinely open.

**Observational anchors.** Filaments are detected as mass and gas, not just as
galaxy overdensities: weak-lensing[^weak-lensing] detections of inter-cluster filaments (Epps
&amp; Hudson 2017), stacked thermal Sunyaev–Zel'dovich (tSZ)[^tsz] signal from the warm–hot
intergalactic medium between luminous-red-galaxy pairs (de Graaff et al. 2019;
Tanimura et al. 2019), and 3D Lyman-$$\alpha$$ forest tomography[^lyman-tomography] of the web at $$z \sim 2.3$$ (CLAMATO; Lee et al. 2018). Galaxy spins align with filament axes in
a mass-dependent way (Tempel &amp; Libeskind 2013; Codis et al. 2012). These give
us **independent channels** to validate any new skeleton: lensing mass, tSZ gas,
and spin alignment. (How gas maps are made, stacked, and defended against
false positives is
[Appendix B5](/mathematics/2026/07/10/cosmic-web-B5-reading-gas-maps/).)

**The vision-side toolbox** (developed in the series and its appendices): build an
**orientation score** $$U(\mathbf{x},\mathbf{n})$$ by correlating the data with
rotated anisotropic wavelets; evolve it with **left-invariant (hypoelliptic)
diffusion**[^hypoelliptic] that smooths strongly along the direction $$\mathbf{n}$$ and weakly
across and in orientation, which enhances elongated coherent structures while
keeping crossings separated; extract curves as **sub-Riemannian geodesics** that
penalise bending. In 2D this reproduces the psychophysical association field
(Duits, Boscain, Rossi &amp; Sachkov 2014); in 3D on $$\mathrm{SE}(3)/\mathrm{SO}(2)$$ it underlies crossing-preserving enhancement of
diffusion-MRI fibre fields (Duits &amp; Franken 2011; Portegies et al. 2015).

**The candidate edge**, in one sentence: *filament finders in cosmology are still
density/Hessian methods in $$\mathbb{R}^3$$; nobody appears to have run the
orientation-lifted $$\mathrm{SE}(3)$$ machinery — which demonstrably beats Hessian
methods at crossings in imaging — on cosmic-web fields, and the physics itself
(anisotropic tidal collapse) supplies a natural drift and anisotropy for the
lifted generator.*

## From GR to an effective geometry — and its honest limits

Cold dark matter is pressureless dust following geodesics of spacetime. In the
weak-field, sub-horizon limit the dynamics reduce to Vlasov–Poisson[^vlasov-poisson] in comoving
coordinates[^comoving]; anisotropy enters through the tidal eigenframe. Two geometric
observations motivate the lift:

**Jacobi/Maupertuis metric.**[^jacobi] For a test particle with conserved energy $$E$$ in a
static potential $$\Phi$$, trajectories are geodesics of the conformally flat
Riemannian metric $$g^{\mathrm{J}} = 2m\,(E - \Phi)\, g_{\mathrm{Euclid}}$$. Paths
are "cheap" where $$\Phi$$ is deep — along potential valleys, i.e. filaments.
In plain words: matter should prefer routes through gravity's valleys the
way light bends toward denser glass — and the valleys of the cosmic
potential *are* the filaments.
**Caveat, stated up front:** in an expanding universe with a growing potential,
energy is *not* conserved along comoving trajectories, so the Jacobi construction
does not literally apply. Making the argument respectable in comoving coordinates
(where the Zel'dovich flow is potential, $$\mathbf{v} \propto \nabla_q \Phi$$) is
itself a theory work-item (T1 below), not an assumption we grant ourselves.

**Orientation is physical here.** The tidal tensor gives every point a *frame* $$(e_1, e_2, e_3)$$ with $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$, and filaments
extend along $$e_3$$. So the natural generator on $$\mathbb{R}^3 \times S^2$$ is not
isotropic: diffusion should be strong along the local tangent, weak across it and
in orientation, with coefficients tied to the tidal eigenvalues:

$$
\partial_t U
= D_\parallel\, \mathcal{A}_3^2\, U
+ D_\perp \left( \mathcal{A}_1^2 + \mathcal{A}_2^2 \right) U
+ D_S\, \Delta_{S^2} U
+ \mu\, \mathcal{A}_3\, U,
$$

where $$\mathcal{A}_i$$ are the left-invariant vector fields[^left-invariant] on $$\mathrm{SE}(3)/\mathrm{SO}(2)$$ ($$\mathcal{A}_3$$ = transport along $$\mathbf{n}$$), $$\Delta_{S^2}$$ is the spherical Laplacian in the orientation variable, $$D_\parallel \gg D_\perp$$, and the drift $$\mu$$ and the ratios $$D_\parallel : D_\perp : D_S$$ are functions of $$(\lambda_1, \lambda_2, \lambda_3)$$
to be calibrated (see H2/E1). This is the direct 3D analogue of the $$\mathrm{SE}(2)$$ hypoelliptic evolution in
[Part 1]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %}), with the
physics entering through the coefficients instead of being bolted on afterwards.

In plain words: imagine the box of galaxies copied once for every possible
direction, and heat spreading through this stack of copies — flowing easily
*along* each copy's own direction, reluctantly sideways, and only slowly
leaking between copies of nearby directions. Structures aligned with a copy's
direction glow; everything else washes out. The equation above is that
heat-flow rule, with the local gravity field (the $$\lambda_i$$) deciding how
eager the flow is in each direction.

## Hypotheses

In plain words, the four bets, from safest to boldest: **H1** — the
orientation-aware eye traces filaments better than the standard one.
**H2** — telling that eye about the local gravity field improves it
further. **H3** — the webs it draws sit on real mass and gas, not just on
galaxy counts. **H4** — the boldest — matter itself *travels* along the
geometry's preferred paths, so the lift is part of the physics, not just
a detector. Each bet comes with a pre-registered way to lose, stated
below.

Conventions used throughout: tidal eigenvalues ordered $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$ with eigenvectors $$e_1, e_2, e_3$$;
filament axis along $$e_3$$. "Spine" = 1D curve set output by a filament finder.
All metrics are defined in the data-analysis plan below.

**H1 (instrument).** *Orientation-lifted extraction recovers filament spines more
faithfully than density-only methods, with the largest gains at
crossings/junctions.*
Falsifiable prediction: on simulations with known structure (E0, E1), the $$\mathrm{SE}(3)$$ spines beat DisPerSE and NEXUS spines on spine-distance and
junction recovery at matched total spine length; if the gain at junctions is not
statistically significant, H1 fails.

**H2 (physics-informed generator).** *Coupling the generator's coefficients to
the tidal eigenvalues improves extraction over a fixed-coefficient generator.*
Falsifiable prediction: the tidally-modulated diffusion (coefficients as
functions of $$\lambda_i$$) outperforms the best constant-coefficient run under the
same metrics with the same parameter budget (calibrated on one sub-box, tested on
held-out sub-boxes). If constant coefficients do as well, the "physics prior"
adds nothing — H2 fails even if H1 holds.

**H3 (mass follows the geodesic spines).** *The sub-Riemannian spine network
traces real mass and gas at least as well as standard skeletons.*
Falsifiable prediction: stacking weak-lensing convergence and tSZ maps along $$\mathrm{SE}(3)$$ spines (E3) yields stack significance at least matching DisPerSE
spines on the same footprint, at matched spine length and after identical masking.
A materially lower stack SNR kills H3.

**H4 (formation, the strong claim).** *Matter transport during web assembly
follows sub-Riemannian geodesics of the effective metric.*
Falsifiable prediction: in an N-body simulation[^nbody], lift particle trajectories $$(\mathbf{x}(t), \hat{\mathbf{v}}(t))$$ to $$\mathbb{R}^3 \times S^2$$ and compare
them, between fixed snapshots, to SR geodesics of the calibrated metric with the
same endpoints. H4 requires the geodesic prediction to beat the straight-line
(Zel'dovich ballistic) baseline on transport error by a pre-registered margin
(metric M4 in the data-analysis plan). If SR geodesics do not beat Zel'dovich, H4 is dead and C2 with it —
and the program remains a methods paper (C1).

## Experiments, in order

In plain words, the campaign: first settle whether the theory even
permits the boldest claim (T1); race the two methods on toy universes
where the answer is known (E0); repeat on real simulated gravity (E1);
watch matter actually move and ask whose paths it follows (E2); and only
then take the surviving method to the real sky and check its webs
against maps of mass and hot gas (E3). Each experiment gates the next; a
kill criterion at any stage stops the branch, and the analysis of each
stage sets the coefficients or priors of the following one.

**T1 (theory, parallel track).** Derive — or refute — a Jacobi-type variational
principle for the Zel'dovich/adhesion flow in comoving coordinates, giving the
effective metric whose geodesics the flow follows. Candidate route: the adhesion
model is the zero-viscosity limit of Burgers flow, whose characteristics *are*
extremals of an action; recast that action on $$\mathbb{R}^3 \times S^2$$ and read
off the metric and the correct $$\lambda_i$$-dependence of $$D_\parallel, D_\perp, D_S, \mu$$. Also connects to optimal-transport
reconstruction of the early Universe (Brenier, Frisch et al. 2002), which is
Monge–Ampère[^optimal-transport] — i.e. already a geodesic statement in a Wasserstein geometry.
Deliverable: a note fixing the functional form of the coefficients used in E1–E3
instead of leaving them free parameters.

**E0 (synthetic ground truth; days, laptop).**
Generate Gaussian random fields with a $$\Lambda$$CDM-like power spectrum in a $$256^3$$ box, displace particles with the Zel'dovich map at several growth factors,
deposit density with cloud-in-cell. Ground-truth spines and junctions are known
from the deformation-tensor eigenstructure of the initial field. Build the
orientation score with 3D steerable ridge filters[^steerable] over $$\sim 3$$ scales and $$\sim 60{-}160$$ orientations (a $$256^3 \times 60$$ float32 score is $$\sim 4$$ GB —
workstation-feasible), run the lifted diffusion, trace SR geodesics, project to $$\mathbb{R}^3$$. Benchmark against DisPerSE on the same fields across noise levels
and sampling densities. **Tests H1. Kill criterion: no significant gain at any
noise level.**

**E1 (real gravity; weeks, one GPU/big-RAM node).**
Public N-body data: a Quijote fiducial snapshot (Villaescusa-Navarro et al. 2020)
and/or IllustrisTNG-100-Dark (Nelson et al. 2019). Compute $$T_{ij}$$ by FFT of the
deposited density, smoothed at $$2\,h^{-1}$$Mpc; run the pipeline with and without
tidal modulation of the coefficients; calibrate on one octant, evaluate on the
others. Extraction quality is judged against the E0-style metrics (using
high-resolution DisPerSE-on-particles as reference where no analytic truth
exists) plus two physical alignments: spine tangent vs. $$e_3(T)$$, and spine
tangent vs. DM particle velocities. **Tests H1 on real gravity and H2. Kill
criterion for H2: tidal modulation ≤ constant coefficients on held-out volumes.**

**E2 (dynamical test of formation; runs on E1's data).**
Between consecutive Quijote/TNG snapshots, select particles ending on filament
spines; compare their lifted trajectories to (a) SR geodesics of the calibrated
metric, (b) Zel'dovich straight-line transport, (c) geodesics of the isotropic
Jacobi metric with no orientation lift. **Tests H4 — the only experiment that can
support C2.** Pre-register the margin before running (metric M4).

**E3 (observations; after E1 passes).**
SDSS DR17 spectroscopic sample (selection-corrected density field, redshift-space
distortions[^rsd] treated at least by anisotropic smoothing along the line of sight —
a known caveat — see the caveats section), spines extracted with coefficients frozen from E1. Stack the
public Planck 2018 lensing convergence map and Compton-$$y$$ map along spines vs.
(i) DisPerSE spines on the identical catalogue and (ii) randomised control
spines. Optional extension at $$z \sim 2.3$$ with CLAMATO tomography, where sparse
sampling should favour the orientation lift. Also re-measure the spin–filament
alignment trend with the new spines (a sharper mass transition supports H3).
**Tests H3.**

## Data-analysis plan: the metrics, defined

Every claim in the program is judged by one of the six metrics below, all
frozen before any experiment ran. (Why benchmarks need this discipline —
matched budgets, held-out scoring, and the one rule whose violation later
became the program's central lesson — is
[Appendix B3](/mathematics/2026/07/08/cosmic-web-B3-honest-benchmarks/).)

- **M1 — spine distance.** Sample both skeletons at $$0.1\,h^{-1}$$Mpc; report the
  two directed median point-to-curve distances
  $$d_{A \to B} = \mathrm{median}_{x \in S_A} \min_{y \in S_B} \lVert x - y \rVert$$
  and the completeness/purity pair: fraction of truth within
  $$r_0 = 0.5\,h^{-1}$$Mpc of the estimate, and vice versa, at **matched total
  spine length** (prune both skeletons to equal length before comparing —
  otherwise longer skeletons win purity-free).
- **M2 — junction recovery.** Precision/recall of ground-truth junction points
  recovered within $$r_0$$; junctions are where H1 predicts the win.
- **M3 — alignment statistic.** For spine samples with tangent $$t_i$$:
  $$A = \langle \lvert t_i \cdot e_3(x_i) \rvert \rangle$$. Under an isotropic null
  $$\mathbb{E}[A] = 1/2$$; significance by permutation over randomly rotated
  spines. Same statistic against normalised DM velocities.
- **M4 — transport error (E2).** For particle $$p$$ over snapshot interval
  $$[t_1, t_2]$$, $$\varepsilon_p = \tfrac{1}{L_p} \int \lVert x_p(t) - \gamma_p(t) \rVert \, dt$$,
  path-length-normalised, where $$\gamma_p$$ is the
  candidate curve with matched endpoints. Compare distributions of
  $$\varepsilon_p$$ (SR geodesic vs. Zel'dovich vs. isotropic Jacobi) with a paired
  test; pre-registered success margin: median error reduction $$\ge 10\%$$ over
  Zel'dovich. Below that, H4 is rejected regardless of p-values.
- **M5 — stack SNR (E3).** Mean excess convergence
  $$\Delta\kappa$$ (or Compton-$$y$$) in tubes of radius $$1\,h^{-1}$$Mpc around
  spines; $$\mathrm{SNR} = (\Delta\kappa - \langle \Delta\kappa_{\mathrm{ctrl}} \rangle)/\sigma_{\mathrm{ctrl}}$$
  over $$\ge 1000$$ control realisations
  (randomly rotated/translated spines respecting the survey mask).
- **M6 — topology.** Betti curves[^betti] $$\beta_0, \beta_1$$ of the skeleton vs.
  persistence threshold; compared to the reference skeleton's, on the same field.

Calibration discipline: all free parameters ($$D_\parallel, D_\perp, D_S, \mu$$ and
their $$\lambda_i$$-dependence, wavelet scales, persistence thresholds) are set on
designated calibration volumes only; every reported number comes from held-out
volumes or sky areas. Parameter count is part of the model comparison (H2).

## Caveats and failure modes, catalogued now

1. **Analogy ≠ mechanism.** Success of $$\mathrm{SE}(3)$$ methods in imaging says
   nothing about cosmology by itself; only E2 speaks to mechanism. The write-up
   must keep C1 results from leaking into C2 claims.
2. **Flexible-parameter self-deception.** The lifted generator has more knobs
   than DisPerSE. Held-out evaluation and parameter-count-aware comparison (H2)
   are the guardrails.
3. **Jacobi-metric gap.** Until T1 lands, "geodesics of an effective metric" is a
   motivated ansatz, not a derivation. If T1 refutes it, E2 becomes a pure
   null-test and C2 should be dropped from the framing.
4. **Redshift-space distortions.** Observed density fields are anisotropic along
   the line of sight (Kaiser squashing, Fingers-of-God); a spurious win in E3
   could come from the orientation machinery absorbing RSD anisotropy rather
   than tracing mass. Mitigation: test on RSD-mocked simulation catalogues in E1
   before touching data.
5. **Static snapshot vs. dynamic web.** Filaments migrate; skeletons from a
   single snapshot are time-slices of a flow. E2's snapshot-pair design addresses
   this partially; a full time-dependent treatment is future work.
6. **Selection and masks.** Survey selection can imprint fake elongation.
   Controls in M5 must respect the exact mask geometry.
7. **Compute ceiling.** $$\mathrm{SE}(3)$$ diffusion at $$512^3 \times 160$$
   orientations exceeds a workstation; the program is scoped at $$256^3 \times 60$$
   with fast separable kernel approximations (Portegies et al. 2015). Resolution
   sensitivity must be reported.

## Success criteria and outcomes

- **Minimum publishable outcome (C1):** E0+E1 show significant junction-recovery
  and spine-distance gains → methods paper: "orientation-score filament finding
  for cosmic-web fields", regardless of E2/E3.
- **Strong outcome (C1+C2):** additionally, E2 beats the Zel'dovich baseline at
  the pre-registered margin and T1 supplies the variational derivation → the
  intrinsic-geometry claim has dynamical support and the observational program
  (E3) becomes decisive.
- **Null outcome:** no E0/E1 gains → write the negative result with the
  benchmark suite; the comparison framework itself (twelve finders vs. a lifted
  one on common metrics) is a useful contribution.

## Open questions / next tests

- T1: does the adhesion action admit a clean $$\mathbb{R}^3 \times S^2$$
  reformulation, and what $$\lambda_i$$-dependence does it force on the
  coefficients?
- Should the geodesic penalty include torsion as well as curvature (in 3D, twist
  of the spine matters at junction handoffs)?
- Branching: handled by persistence pruning, or does the lifted space admit a
  principled branching prior (junctions are crossings in $$\mathbb{R}^3$$ but
  *separated* points in $$\mathbb{R}^3 \times S^2$$)?
- Curvature diagnostics: do Ollivier–Ricci/Forman curvatures[^network-curvature] of the spine graph
  correlate with tSZ brightness along filaments?
- High-$$z$$: does the orientation lift stabilise CLAMATO skeletons at sparse
  sampling, where density-only methods degrade fastest?

## Glossary

- **$$\Lambda$$CDM** — standard cosmological model: cold dark matter plus a
  cosmological constant in an expanding FLRW spacetime.
- **Tidal tensor $$T_{ij}$$** — Hessian $$\partial_i \partial_j \Phi$$ of the peculiar
  gravitational potential; its eigenframe ($$\lambda_1 \ge \lambda_2 \ge \lambda_3$$)
  sets the anisotropy of collapse; filament axis $$\parallel e_3$$.
- **Zel'dovich approximation** — first-order Lagrangian perturbation theory:
  ballistic comoving displacement $$\mathbf{x} = \mathbf{q} - D(t)\nabla_q\Phi(\mathbf{q})$$.
- **Adhesion model** — Zel'dovich flow regularised by infinitesimal Burgers
  viscosity so matter sticks at shell-crossing, producing persistent
  sheets/filaments.
- **T-web / V-web** — web classification by eigenvalue counts of the tidal /
  velocity-shear tensor above a threshold.
- **MMF / NEXUS / DisPerSE / T-ReX** — multiscale Hessian filters (first two),
  discrete-Morse/persistence skeleton, and regularised-MST filament finders.
- **WHIM** — warm–hot intergalactic medium, $$10^5$$–$$10^7$$ K gas in filaments.
- **tSZ / Compton-$$y$$** — thermal Sunyaev–Zel'dovich effect: CMB spectral
  distortion proportional to line-of-sight electron pressure; $$y$$ is its
  amplitude map.
- **RSD** — redshift-space distortions: peculiar velocities shift redshifts,
  distorting the inferred radial positions of galaxies.
- **CLAMATO** — Lyman-$$\alpha$$ forest tomography survey giving a 3D absorption
  map of the web at $$z \sim 2.3$$.
- **Orientation score $$U(\mathbf{x},\mathbf{n})$$** — lift of a scalar field to
  position–orientation space by correlation with rotated anisotropic wavelets.
- **Hypoelliptic diffusion** — degenerate diffusion generating smoothing in
  missing directions only through commutators (Hörmander condition); here:
  strong along $$\mathbf{n}$$, weak across and in orientation.
- **Sub-Riemannian (SR) geodesic** — shortest path when motion is restricted to
  a distribution of allowed directions; in the lift, curves that trade length
  against turning.
- **Jacobi/Maupertuis metric** — conformal metric $$2m(E-\Phi)\,g_{\mathrm{Euclid}}$$
  whose geodesics are fixed-energy mechanical trajectories.
- **Spine** — the 1D curve network a filament finder outputs.
- **M1–M6** — the six evaluation metrics defined in the data-analysis plan.
- **C1/C2, H1–H4, E0–E3, T1** — the two claims, four hypotheses, four
  experiments, and one theory work-item defined in the sections above.

[^persistent-homology]: A topology tool that tracks how connected pieces, loops, and voids appear and merge as a detection threshold is swept; features that survive over a wide range of the sweep are treated as real, short-lived ones as noise.

[^weak-lensing]: The gravity of matter lying between us and distant galaxies slightly bends their light and distorts their apparent shapes; averaging the shapes of many background galaxies maps the intervening mass, visible or dark.

[^tsz]: Hot electrons in cosmic gas give a small energy kick to photons of the cosmic microwave background passing through them; the resulting distortion on the sky traces the pressure of hot gas (see Glossary).

[^lyman-tomography]: Light from many background galaxies picks up absorption dips from the hydrogen gas it crosses; combining the dips along many neighbouring sightlines yields a 3D map of that gas. CLAMATO is the survey that produced such a map (see Glossary).

[^hypoelliptic]: A diffusion that spreads directly only along a few allowed directions, yet ends up smoothing in every direction because combinations of the allowed moves can reach them all (see Glossary).

[^vlasov-poisson]: The paired equations for a vast crowd of particles interacting only through the gravity of their combined mass: one equation moves the crowd, the other recomputes the gravity that the crowd itself generates.

[^comoving]: Coordinates that stretch together with the expanding Universe, so the overall expansion is factored out and only motion relative to it remains.

[^jacobi]: A rescaling of ordinary distance by how fast a particle of fixed energy would move at each point; after the rescaling, the particle's possible trajectories become the shortest paths of the new geometry (see Glossary).

[^left-invariant]: Direction fields written in each point's own frame — "forward along my axis", "sideways", "turn" — the same recipe at every point, so the smoothing rule does not depend on where you stand.

[^nbody]: A computer simulation that follows millions of mass points evolving under their mutual gravity — the standard tool for computing how cosmic structure grows once the density ripples are no longer small.

[^optimal-transport]: Optimal transport asks for the cheapest way to rearrange one pile of mass into another; the Monge–Ampère equation is the condition the cheapest rearrangement must satisfy, and "Wasserstein geometry" measures the distance between two mass distributions by that cheapest cost.

[^steerable]: Oriented template patterns designed so that the response at any angle can be computed exactly by combining a small fixed set of measured responses — every orientation for the price of a few.

[^rsd]: A galaxy's distance is inferred from the stretching of its light, but the galaxy's own motion adds to that stretch, so the inferred 3D map is squashed or smeared along the line of sight (see Glossary).

[^betti]: Counts of topological features: $$\beta_0$$ is the number of separate connected pieces, $$\beta_1$$ the number of independent loops.

[^network-curvature]: Two recipes for assigning a curvature number to the nodes and edges of a network: roughly, positive where the network is densely interlinked, negative where it branches out like a tree.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>Ya. B. Zel'dovich (1970). "Gravitational instability: an approximate theory for large density perturbations." <em>Astron. Astrophys.</em> 5, 84–89.</li>
  <li>J. R. Bond, L. Kofman &amp; D. Pogosyan (1996). "How filaments of galaxies are woven into the cosmic web." <em>Nature</em> 380, 603–606. <a href="https://arxiv.org/abs/astro-ph/9512141">arXiv:astro-ph/9512141</a>.</li>
  <li>S. N. Gurbatov, A. I. Saichev &amp; S. F. Shandarin (1989). "The large-scale structure of the universe in the frame of the model equation of non-linear diffusion." <em>MNRAS</em> 236, 385–402.</li>
  <li>O. Hahn, C. Porciani, C. M. Carollo &amp; A. Dekel (2007). "Properties of dark matter haloes in clusters, filaments, sheets and voids." <em>MNRAS</em> 375, 489–499. <a href="https://arxiv.org/abs/astro-ph/0610280">arXiv:astro-ph/0610280</a>.</li>
  <li>J. E. Forero-Romero et al. (2009). "A dynamical classification of the cosmic web." <em>MNRAS</em> 396, 1815–1824. <a href="https://arxiv.org/abs/0809.4135">arXiv:0809.4135</a>.</li>
  <li>Y. Hoffman et al. (2012). "A kinematic classification of the cosmic web." <em>MNRAS</em> 425, 2049–2057. <a href="https://arxiv.org/abs/1201.3367">arXiv:1201.3367</a>.</li>
  <li>M. A. Aragón-Calvo et al. (2007). "The multiscale morphology filter: identifying and extracting spatial patterns in the galaxy distribution." <em>A&amp;A</em> 474, 315–338. <a href="https://arxiv.org/abs/0705.2072">arXiv:0705.2072</a>.</li>
  <li>M. Cautun, R. van de Weygaert &amp; B. J. T. Jones (2013). "NEXUS: tracing the cosmic web connection." <em>MNRAS</em> 429, 1286–1308. <a href="https://arxiv.org/abs/1209.2043">arXiv:1209.2043</a>.</li>
  <li>T. Sousbie (2011). "The persistent structure of the Universe — I. Theory and implementation." <em>MNRAS</em> 414, 350–383. <a href="https://arxiv.org/abs/1009.4015">arXiv:1009.4015</a>.</li>
  <li>T. Bonnaire et al. (2020). "T-ReX: a graph-based filament detection method." <em>A&amp;A</em> 637, A18. <a href="https://arxiv.org/abs/1912.00732">arXiv:1912.00732</a>.</li>
  <li>N. I. Libeskind et al. (2018). "Tracing the cosmic web." <em>MNRAS</em> 473, 1195–1217. <a href="https://arxiv.org/abs/1705.03021">arXiv:1705.03021</a>.</li>
  <li>S. D. Epps &amp; M. J. Hudson (2017). "The weak-lensing masses of filaments between luminous red galaxies." <em>MNRAS</em> 468, 2605–2613. <a href="https://arxiv.org/abs/1702.08485">arXiv:1702.08485</a>.</li>
  <li>A. de Graaff et al. (2019). "Probing the missing baryons with the Sunyaev–Zel'dovich effect from filaments." <em>A&amp;A</em> 624, A48. <a href="https://arxiv.org/abs/1709.10378">arXiv:1709.10378</a>.</li>
  <li>H. Tanimura et al. (2019). "A search for warm/hot gas filaments between pairs of SDSS luminous red galaxies." <em>MNRAS</em> 483, 223–234. <a href="https://arxiv.org/abs/1709.05024">arXiv:1709.05024</a>.</li>
  <li>K.-G. Lee et al. (2018). "First data release of the COSMOS Lyα mapping and tomography observations (CLAMATO)." <em>ApJS</em> 237, 31. <a href="https://arxiv.org/abs/1710.02894">arXiv:1710.02894</a>.</li>
  <li>E. Tempel &amp; N. I. Libeskind (2013). "Galaxy spin alignment in filaments and sheets: observational evidence." <em>ApJL</em> 775, L42. <a href="https://arxiv.org/abs/1308.2816">arXiv:1308.2816</a>.</li>
  <li>S. Codis et al. (2012). "Connecting the cosmic web to the spin of dark haloes." <em>MNRAS</em> 427, 3320–3336. <a href="https://arxiv.org/abs/1201.5794">arXiv:1201.5794</a>.</li>
  <li>Y. Brenier, U. Frisch et al. (2003). "Reconstruction of the early Universe as a convex optimization problem." <em>MNRAS</em> 346, 501–524. <a href="https://arxiv.org/abs/astro-ph/0304214">arXiv:astro-ph/0304214</a>.</li>
  <li>R. Duits &amp; E. Franken (2011). "Left-invariant diffusions on the space of positions and orientations and their application to crossing-preserving smoothing of HARDI images." <em>Int. J. Comput. Vis.</em> 92, 231–264.</li>
  <li>J. Portegies, G. Sanguinetti, S. Meesters &amp; R. Duits (2015). "New approximation of a scale space kernel on SE(3) and applications in neuroimaging." <em>SSVM 2015</em>, LNCS 9087. <a href="https://arxiv.org/abs/1506.02529">arXiv:1506.02529</a>.</li>
  <li>R. Duits, U. Boscain, F. Rossi &amp; Yu. Sachkov (2014). "Association fields via cuspless sub-Riemannian geodesics in SE(2)." <em>J. Math. Imaging Vis.</em> 49, 384–417. <a href="https://arxiv.org/abs/1301.6976">arXiv:1301.6976</a>.</li>
  <li>F. Villaescusa-Navarro et al. (2020). "The Quijote simulations." <em>ApJS</em> 250, 2. <a href="https://arxiv.org/abs/1909.05273">arXiv:1909.05273</a>.</li>
  <li>D. Nelson et al. (2019). "The IllustrisTNG simulations: public data release." <em>Comput. Astrophys. Cosmol.</em> 6, 2. <a href="https://arxiv.org/abs/1812.05609">arXiv:1812.05609</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->

<style>
figure.l-middle { max-width: calc(var(--body-w) + 32px + var(--gutter-w)); padding: 0 14px; box-sizing: border-box; overflow-x: hidden; }
figure.l-middle svg { max-width: 100%; height: auto; }
</style>
<script>
(function () {
  const host = document.getElementById("cw-collapse");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const W = 540, H = 300, cx = 250, cy = 155;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "540px"; svg.style.width = "100%";
  host.appendChild(svg);

  // axonometric projection of 3D -> 2D
  const proj = (x, y, z) => [cx + x + 0.45 * z, cy - y + 0.28 * z];

  // deterministic point cloud in a ball
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = [];
  while (P.length < 260) {
    const x = (rnd() * 2 - 1), y = (rnd() * 2 - 1), z = (rnd() * 2 - 1);
    if (x * x + y * y + z * z <= 1) P.push([x * 95, y * 95, z * 95]);
  }
  const dots = P.map(() => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("r", 2.2); c.setAttribute("fill", "#2b6cb0");
    c.setAttribute("fill-opacity", 0.55);
    svg.appendChild(c);
    return c;
  });

  // tidal axes: e1 = y (first collapse), e2 = z, e3 = x (filament axis)
  const axes = [
    { v: [0, 1, 0], label: "λ₁ (first)",   color: "#c53030" },
    { v: [0, 0, 1], label: "λ₂ (second)",  color: "#dd6b20" },
    { v: [1, 0, 0], label: "λ₃ (last — filament axis)", color: "#2f855a" },
  ];
  axes.forEach(a => {
    const [x2, y2] = proj(a.v[0] * 125, a.v[1] * 125, a.v[2] * 125);
    const ln = document.createElementNS(ns, "line");
    ln.setAttribute("x1", cx); ln.setAttribute("y1", cy);
    ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
    ln.setAttribute("stroke", a.color); ln.setAttribute("stroke-width", 2);
    svg.appendChild(ln);
    const tx = document.createElementNS(ns, "text");
    tx.setAttribute("x", x2 + (x2 > cx ? 4 : -4)); tx.setAttribute("y", y2 - 4);
    tx.setAttribute("text-anchor", x2 > cx ? "start" : "end");
    tx.setAttribute("font-size", 11); tx.setAttribute("fill", a.color);
    tx.textContent = a.label;
    svg.appendChild(tx);
  });

  const stageEl = document.getElementById("col-stage");
  const ease = t => Math.max(0, Math.min(1, t));
  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;             // seconds since (re)start
    // collapse factors: y first (0-2.5s), z second (2.5-5s), x last (5-7.5s)
    const fy = 1 - 0.92 * ease(t / 2.5);
    const fz = 1 - 0.92 * ease((t - 2.5) / 2.5);
    const fx = 1 - 0.86 * ease((t - 5) / 2.5);
    P.forEach(([x, y, z], i) => {
      const [px, py] = proj(x * fx, y * fy, z * fz);
      dots[i].setAttribute("cx", px); dots[i].setAttribute("cy", py);
    });
    stageEl.textContent = t < 2.5 ? "collapsing along λ₁ → sheet"
      : t < 5 ? "collapsing along λ₂ → filament"
      : t < 7.5 ? "draining along λ₃ → node" : "node (restart to replay)";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.getElementById("col-play").onclick = () => { t0 = performance.now(); };
})();
</script>
