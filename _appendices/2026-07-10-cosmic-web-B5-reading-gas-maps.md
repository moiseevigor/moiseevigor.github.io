---
layout: distill
title: "Appendix B5 — Reading the Sky's Hot Gas"
subtitle: >
  The thermal Sunyaev–Zel'dovich effect and Compton-y maps, stacking as a
  detection strategy, controls that match the sky's systematics, the 9σ spine
  detection and its halo/WHIM decomposition, pair-bridge estimators that
  cancel halos by symmetry, beam leakage — and the honest final numbers.
date: 2026-07-10 09:00:00
categories: [mathematics]
tags: [cosmic-web, tsz, compton-y, planck, act, observations]
description: >
  Observational appendix of the Geometry of the Cosmic Web series: how
  Compton-y maps encode hot gas, how stacking extracts signals of 1e-8 from
  1e-6 maps, why controls must match galactic-latitude exposure, the 9-sigma
  spine-stack detection and its decomposition, the halo-symmetric pair-bridge
  estimator, the Planck beam-leakage lesson, and the calibrated bridge
  amplitude of about 1.2–1.4e-8 at roughly 2 sigma per instrument.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B5
permalink: /mathematics/2026/07/10/cosmic-web-B5-reading-gas-maps/
published: true
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The series' observational campaign asked whether the filament networks
extracted from galaxy surveys sit on real hot gas. This appendix supplies
everything needed to read those results: the physics of the thermal
Sunyaev–Zel'dovich effect in one paragraph, stacking as a
signal-to-noise strategy, why control samples must match the sky's
systematics (the galactic-latitude lesson), the 9σ spine detection and its
decomposition into halo gas versus gas between halos, the pair-bridge
estimator that cancels halos by symmetry, the beam-leakage lesson from
comparing Planck and ACT, and the final calibrated numbers. Numbers cite
the experiment reports (E3, E3b, E3c, E3d, E3e) in
<code>research/cosmic-web/docs/</code>.
</div>

## The thermal Sunyaev–Zel'dovich effect, in one paragraph

Photons of the cosmic microwave background (CMB) crossing a pocket of hot
ionised gas occasionally scatter off its free electrons and pick up a
little energy — inverse Compton scattering. The distortion this imprints
on the CMB spectrum is the **thermal Sunyaev–Zel'dovich (tSZ) effect**
(Sunyaev & Zel'dovich 1972), and its amplitude at each sky position is the
**Compton-y parameter**: the line-of-sight integral of the electron
pressure,

$$
y \;=\; \frac{\sigma_{\mathrm{T}}}{m_e c^{2}} \int P_e \, dl , \qquad P_e = n_e k_{\mathrm{B}} T_e ,
$$

with $$\sigma_{\mathrm{T}}$$ the Thomson cross-section, $$m_e c^2$$ the
electron rest energy, $$n_e$$ the electron density and $$T_e$$ the electron
temperature. y is dimensionless and, usefully, independent of redshift: a
parcel of hot gas contributes the same y whether nearby or distant. Galaxy
clusters reach y ~ 10⁻⁴–10⁻⁵; the warm–hot intergalactic medium (WHIM)
expected in filaments sits near y ~ 10⁻⁸ — a hundred times below the noise
per pixel of the all-sky Planck y map. Both maps used in the series are
component-separated y maps: Planck (10′ beam) and the Atacama Cosmology
Telescope's ACT DR6 (1.6′ beam), where the beam is the instrument's
angular resolution.

## Stacking: seeing 10⁻⁸ in a 10⁻⁶ map

No single filament is visible, so the campaign averages the map over many
sky positions selected by an external catalogue — **stacking**. Averaging
N roughly independent positions beats the noise down by $$\sqrt{N}$$, but
the zero point of a y map is not trustworthy, so the measurement is always
*differential*: the stacked value minus the same stack on **control
positions**, with significance defined as

$$
\mathrm{SNR} \;=\; \frac{\text{stack} - \langle \text{stack}_{\mathrm{ctrl}} \rangle}{\sigma_{\mathrm{ctrl}}}
$$

over hundreds of control realisations. Everything then hinges on whether
the controls are exposed to the same systematics as the signal positions.

## Controls must match the sky's systematics

The first pass (E3) stacked spine networks extracted from 274,075 BOSS
CMASS-North galaxies (18 tiles of 512 h⁻¹Mpc, spines at matched total
length per method) on the Planck y map, against 200 footprint-constrained
controls built by rotating in right ascension and reflecting in
declination: 4.8σ (Hessian spines) and 4.1σ (orientation-lift spines).
But those transformations change **galactic latitude** — and galactic
foregrounds (dust, and the residual it leaves in a y map) vary with
latitude, so signal and controls sampled different foreground exposure.
The second pass (E3b) drew 200 control sets rejection-matched to the spine
points' galactic-latitude histogram in 2° bins, so no latitude-dependent
foreground can contribute. The detection **strengthened**: 8.99σ (Hessian)
and 6.86σ (lift). A stricter control does not necessarily shrink a real
signal — it removes a variance term that was diluting it.

## The 9σ spine detection, decomposed

At 8.99σ the extracted web demonstrably sits on hot gas — but *whose* gas?
The survey galaxies themselves carry hot halos, so E3b masked a 7′ disc
around every catalogue galaxy, identically in signal and controls. The
excess collapsed to 1.95σ (Hessian) and 0.07σ (lift): the spine-stack
signal is **dominantly the tracers' own halo gas**, with at most a hint of
a between-halos (WHIM) component. The radial profile extends to ≥60′ but
cannot discriminate extended filament gas from clustered halo
contributions at a 10′ beam (E3b). Two conclusions: the spine networks are
physically real (they trace hot gas at high significance), and isolating
*filament* gas needs a sharper instrument and a different estimator.

## The beam sets what you can see

The obvious sharper instrument, ACT DR6 at 1.6′, at first made things
*worse*: the same spine stack dropped to 2.95σ unmasked (versus Planck's
9σ on the overlapping footprint), and the masked residual stayed below the
pre-registered 3σ gate (1.77σ at 3′ masking; E3c). The diagnosis, not a
mere excuse, is a scale mismatch: the spines are projected through a
~250 h⁻¹Mpc redshift shell, so their stacked signal is coherent on
*degree* scales — exactly the scales a ground-based map's filtering
suppresses, while it excels at arcminutes. The lesson: an analysis design
must place its signal at the angular scales its instrument preserves.
E3c's prescription — go small-scale, individual structures instead of
shell projections — became the pair-bridge design.

## Pair bridges: cancel the halos by symmetry

Take close galaxy pairs — transverse separation 6–14 h⁻¹Mpc,
line-of-sight separation < 6 h⁻¹Mpc — which simulations expect to be
connected by filament bridges. The estimator (E3d, refined in E3d-v2):
average y in a 2′ disc at the pair **midpoint**, and subtract the mean of
the same disc at **ring control points** at ±60°, ±90° and ±120° around
each galaxy, at identical angular distance from that galaxy. Any
circularly symmetric halo profile contributes *exactly zero* by
construction — the control points sit at the same distance from the halo
as the midpoint does. What survives is gas that lives preferentially *on*
the inter-pair axis: the bridge. Over 876,639 CMASS pairs this gave
2.28×10⁻⁸ at 5.24σ on ACT and 2.97×10⁻⁸ at 19.3σ on Planck with
per-pair bootstrap errors (E3d-v2).

## The validity battery and the final numbers

Two upgrades of rigour (E3e; Appendix B3 discusses both as general
methods). First, pairs overlap on the sky, so bootstrap over pairs is too
optimistic: a jackknife over 50 right-ascension patches deflates the
significances by 1.6–2.4×. Second, a **physically-null control**: pairs
with the same transverse window but line-of-sight separation 25–40 h⁻¹Mpc
— same sky geometry, no possible bridge. The nulls came back zero on ACT
(1.65σ) but **4.7σ nonzero on Planck** (1.80×10⁻⁸): at a 10′ beam, the
second galaxy's smeared halo contributes more at the midpoint than at the
ring controls (which sit farther from it), manufacturing a fake bridge —
**beam leakage**, now measured rather than suspected.

| control stage | ACT DR6 | Planck |
|---|---|---|
| pair bootstrap errors (E3d-v2) | 5.24σ (2.28×10⁻⁸) | 19.3σ (2.97×10⁻⁸) |
| sky-patch jackknife (E3e) | 3.30σ | 7.99σ |
| null-pair subtracted (E3e) | ≈1.6σ (1.4×10⁻⁸ ± 0.9) | ≈2.2σ (1.2×10⁻⁸ ± 0.5) |

The bottom row is the physically meaningful bridge amplitude:
**~1.2–1.4×10⁻⁸, at ≈2σ per instrument**, mutually consistent between two
independent telescopes and matching the published luminous-red-galaxy
pair-bridge measurements (~1–2×10⁻⁸; de Graaff et al. 2019, Tanimura et
al. 2019). The campaign therefore reports a *reproduction* of the
literature amplitude under honest errors and physical nulls — not an
independent 5σ detection; upgrading it would need model-based two-halo
subtraction and a joint-map likelihood. The recurring moral of the series
holds to the last experiment: every strong claim, put under its own
strictest control, shrinks to its honest core — and the honest core here
still says the bridges are real.

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>R. A. Sunyaev &amp; Ya. B. Zel'dovich (1972). "The observation of relic radiation as a test of the nature of X-ray radiation from the clusters of galaxies." <em>Comments Astrophys. Space Phys.</em> 4, 173.</li>
  <li>Planck Collaboration (2016). "Planck 2015 results. XXII. A map of the thermal Sunyaev–Zeldovich effect." <em>A&amp;A</em> 594, A22.</li>
  <li>W. Coulton et al. (2024). "Atacama Cosmology Telescope: high-resolution component-separated maps across one third of the sky." <em>Phys. Rev. D</em> 109, 063530. The ACT DR6 Compton-y map.</li>
  <li>A. de Graaff et al. (2019). "Probing the missing baryons with the Sunyaev–Zel'dovich effect from filaments." <em>A&amp;A</em> 624, A48.</li>
  <li>H. Tanimura et al. (2019). "A search for warm/hot gas filaments between pairs of SDSS luminous red galaxies." <em>MNRAS</em> 483, 223–234.</li>
  <li>Experiment reports E3, E3b, E3c, E3d, E3d-v2, E3e, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
