---
layout: distill
title: "Appendix B2 — The Tidal Frame: How Collapse Chooses Directions"
subtitle: >
  The tidal tensor and its eigenframe, the ordered collapse from sheets to
  filaments to nodes, the T-web and V-web classifications, why filaments point
  along the weakest tidal axis — and the E4 measurement showing the correction
  to ballistic transport points across that axis, not along it.
date: 2026-07-07 09:00:00
categories: [mathematics]
tags: [cosmic-web, tidal-tensor, zeldovich, cosmology, filaments]
description: >
  Self-contained primer on the tidal eigenframe of large-scale structure:
  definition of the tidal tensor, anisotropic collapse and Zel'dovich
  pancakes, the T-web/V-web classifications, the full E4 residual
  measurement in the tidal frame, and the tidal-alignment descriptor result
  on BOSS data. Companion appendix to the Geometry of the Cosmic Web series.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B2
permalink: /mathematics/2026/07/07/cosmic-web-B2-tidal-frame/
published: true
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
Everywhere in the series, directions are measured "in the tidal frame" and
filaments "point along e₃". This appendix builds that frame from scratch:
the tidal tensor and its eigenvalues, why gravitational collapse proceeds
one axis at a time (sheet → filament → node), how the T-web and V-web
classifications turn the eigenframe into a map of the web, the full E4
measurement of the beyond-Zel'dovich correction resolved in this frame, and
the one statistic on which the orientation-lift method beats the simpler
Hessian detector — on simulations and on the real sky. Numbers cite the
experiment reports in <code>research/cosmic-web/docs/</code> by name.
</div>

## The tidal tensor and its eigenframe

Let $$\Phi(\mathbf{x})$$ be the peculiar gravitational potential — the part
of the potential sourced by density *fluctuations* $$\delta$$ about the
cosmic mean, via the Poisson equation $$\nabla^2 \Phi \propto \delta$$.
The **tidal tensor** is its Hessian, the matrix of second derivatives:

$$
T_{ij}(\mathbf{x}) \;=\; \frac{\partial^{2} \Phi}{\partial x_i\, \partial x_j}.
$$

It records how the gravitational pull *differs* across a small region — the
stretching and squeezing that a cloud of test particles feels. Being
symmetric, it has an orthonormal **eigenframe**: eigenvectors $$e_1, e_2, e_3$$
with eigenvalues ordered $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$.
A positive eigenvalue means
matter is being compressed along that eigenvector; the ordering says the
squeeze is strongest along $$e_1$$ and weakest along $$e_3$$.

## Collapse happens one axis at a time

The Zel'dovich approximation (Appendix B1) makes the consequence exact. Its
map $$\mathbf{x} = \mathbf{q} - D\,\nabla_q \Phi_0(\mathbf{q})$$ has Jacobian

$$
\frac{\partial x_i}{\partial q_j} \;=\; \delta_{ij} \;-\; D\,\frac{\partial^{2} \Phi_0}{\partial q_i\, \partial q_j},
$$

whose determinant — the inverse of the local density — first vanishes
when $$D\,\lambda_1 = 1$$. Collapse therefore happens **first
along** $$e_1$$, the strongest-squeeze axis, flattening the cloud into a sheet (a
Zel'dovich "pancake"); then along $$e_2$$, draining the sheet into a
filament; and last along $$e_3$$, pooling the filament into a node. A
filament is the structure that exists *after* two collapses and *before*
the third: it is extended along $$e_3$$, the axis gravity squeezes last.
Bond, Kofman & Pogosyan (1996) showed the resulting filamentary pattern is
already encoded in the initial tidal field around proto-clusters — hence
"cosmic web".

## The T-web and V-web classifications

The eigenframe gives a pointwise map of the web. The **T-web** (Hahn et
al. 2007; Forero-Romero et al. 2009) counts how many eigenvalues
of $$T_{ij}$$ exceed a threshold $$\lambda_{\mathrm{th}}$$:

| eigenvalues above threshold | environment | axis carried |
|---|---|---|
| 0 | void | — |
| 1 | sheet | normal along e₁ |
| 2 | filament | spine along e₃ |
| 3 | node | — |

The **V-web** (Hoffman et al. 2012) applies the same counting to the
velocity shear tensor

$$
\Sigma_{ij} \;=\; -\frac{1}{2H_0} \left( \frac{\partial v_i}{\partial x_j} + \frac{\partial v_j}{\partial x_i} \right),
$$

with $$H_0$$ the Hubble constant, which resolves finer structure because
the velocity field is smoother than the density but responds to the same
tides. Libeskind et al. (2018) compared twelve web finders on one
simulation and found substantial disagreement at filament boundaries and
junctions — the observation that motivated the series' benchmark in the
first place.

## Why the measurement had to be made in this frame

The series' physical hypothesis (H4 and its refinement H4') claimed the
lifted geometry supplies a correction to standard transport that is *aligned
with filaments*: cheap motion along $$e_3$$. The tidal frame is the only
frame in which that claim is falsifiable — an isotropic statistic would
average the signature away. Experiment E4 therefore measured, for every
tracked particle, the residual between truth and the particle's own
Zel'dovich prediction from the same initial conditions,

$$
\mathbf{R} \;=\; \mathbf{x}_{\mathrm{true}}(a{=}1) \;-\; \mathbf{x}_{\mathrm{ZA}}(a{=}1),
$$

and its velocity analogue $$\mathbf{R}_v$$, projected both onto the local
eigenframe, and binned by distance to the filament spine network. The
direction statistic is the squared projection of the unit residual on the
filament axis, with isotropic null 1/3: values above 1/3 mean the
correction points *along* filaments (the H4' prediction), below it
*across* them.

## The E4 measurement in full

Six particle-mesh (PM) N-body simulations (128³, Einstein–de Sitter),
50,000 tracked particles each; mean ± across-seed standard deviation;
distances in voxels of 1 h⁻¹Mpc (E4):

| d to spine (vox) | n per seed | ⟨(R̂·e₃)²⟩ | ⟨(R̂ᵥ·e₃)²⟩ | RMS R∥ (vox) | RMS R⊥ per axis (vox) | R∥/R⊥ |
|---|---|---|---|---|---|---|
| 0–2 | 20,658 | 0.298 ± 0.002 | 0.312 ± 0.003 | 4.36 | 4.92 | 0.89 |
| 2–4 | 7,269 | 0.297 ± 0.004 | 0.300 ± 0.004 | 3.77 | 4.19 | 0.90 |
| 4–8 | 6,632 | 0.264 ± 0.004 | 0.280 ± 0.003 | 2.40 | 3.07 | 0.78 |
| 8–16 | 10,320 | 0.218 ± 0.002 | 0.218 ± 0.003 | 1.86 | 2.91 | 0.64 |
| 16–64 | 5,120 | 0.208 ± 0.003 | 0.203 ± 0.003 | 1.77 | 2.83 | 0.63 |

Column key: ⟨(R̂·e₃)²⟩ and ⟨(R̂ᵥ·e₃)²⟩ are the mean squared projections of
the unit position and velocity residuals on the filament axis (isotropic
null 1/3); RMS R∥ is the root-mean-square residual component along e₃;
RMS R⊥ per axis is the same for each perpendicular axis; R∥/R⊥ is their
ratio (1 = isotropic correction, above 1 = along-filament, below 1 =
across-filament).

Three facts follow. **The correction is large where structure forms** —
RMS ≈ 4.4 voxels within 2 voxels of spines. **It is organised by the tidal
frame** — every entry deviates strongly from isotropy. **And it points
across the filament axis at every distance**: the direction statistic sits
at 0.21–0.30, below the 1/3 null everywhere, and R∥/R⊥ = 0.63–0.89 with no
bin reaching 1. Physically: ballistic transport overshoots through forming
walls and filaments, and the correction real gravity applies is
**transverse arrest at the web** — the adhesion model's viscosity made
anisotropic by the tidal frame — not enhanced transport along it. H4' is
refuted as stated, and the measured form of the true correction became the
model of Appendix B4. The result is consistent with the model-independent
precursor (E2: bulk deviations-from-chord at 0.21–0.23 versus 1/3) and
with the theory note's shock picture (T1).

## The tidal frame as an anisotropy judge

The eigenframe also grades filament *finders*. Define the alignment
statistic (M3): for spine samples with unit tangent $$\hat{t}_i$$ at
points $$\mathbf{x}_i$$,

$$
A \;=\; \bigl\langle\, \lvert \hat{t}_i \cdot e_3(\mathbf{x}_i) \rvert \,\bigr\rangle, \qquad \mathbb{E}[A] = \tfrac{1}{2} \ \text{under an isotropic null}.
$$

Neither detector is shown the tidal field; A measures how well each one's
spines *recover* the frame from density data alone. On simulations, the
orientation-lift spines align at 0.734–0.759 versus the Hessian detector's
0.665–0.674 (E1). On the real Universe the separation replicates: across
18 independent tiles of BOSS CMASS galaxies stacked in the E3 campaign,
the lift reaches **0.677 ± 0.016** versus the Hessian's **0.617 ± 0.016**
(null 0.5) — a clean, tile-replicated win (E3). This is the lifted
geometry's one surviving advantage, and the theory explains why it is a
*descriptor* rather than a mechanism: the orientation manifold captures the
tangent structure of the already-formed shock set (T1), even though the
transport that builds it flows across, not along, the filaments.

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>Ya. B. Zel'dovich (1970). "Gravitational instability: an approximate theory for large density perturbations." <em>Astron. Astrophys.</em> 5, 84–89.</li>
  <li>J. R. Bond, L. Kofman &amp; D. Pogosyan (1996). "How filaments of galaxies are woven into the cosmic web." <em>Nature</em> 380, 603–606.</li>
  <li>O. Hahn, C. Porciani, C. M. Carollo &amp; A. Dekel (2007). "Properties of dark matter haloes in clusters, filaments, sheets and voids." <em>MNRAS</em> 375, 489–499.</li>
  <li>J. E. Forero-Romero et al. (2009). "A dynamical classification of the cosmic web." <em>MNRAS</em> 396, 1815–1824.</li>
  <li>Y. Hoffman et al. (2012). "A kinematic classification of the cosmic web." <em>MNRAS</em> 425, 2049–2057.</li>
  <li>N. I. Libeskind et al. (2018). "Tracing the cosmic web." <em>MNRAS</em> 473, 1195–1217.</li>
  <li>Experiment reports E1, E2, E3, E4 and the theory note T1, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
