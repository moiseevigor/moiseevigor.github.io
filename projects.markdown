---
layout: page
title: Projects
header: Projects
group: navigation
permalink: /projects/
comments: false
---

<style>
a > img {
	display: inline;
}
.proj-badge {
	background: #fff3e0;
	color: #e65100;
	border-radius: 3px;
	padding: 2px 8px;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	vertical-align: middle;
}
</style>

Four mathematical research programs — each a pre-registered series of posts with
theory appendices and a public research codebase — plus the software they run on.
Draft series are readable here once published; their code and derivations live in
the [site repository](https://github.com/moiseevigor/moiseevigor.github.io) under
`research/` throughout.

## The Geometry of Forbidden Directions <span class="proj-badge">DRAFT</span>

Magnetic fields turned into sub-Riemannian geometry: the flux lift makes a charged
particle's "forbidden directions" a distribution whose bracket *is* the field. The
series derives and tests the growth-vector law $Q = d + k + 2$ at magnetic nulls,
measures how caustics read field gradients — culminating in the closed form
$\delta(\varepsilon) = 1 - \tfrac{2}{\pi}K(2\varepsilon)$ with a critical gradient at
$\varepsilon = \tfrac12$ — then goes hunting on real data: null detection on SDO/HMI
magnetograms, a certified null-pair collision (fold) on the Sun, an audit of Earth's
Tsyganenko magnetosphere model, and Jupiter's polar patch resolved as a buried
null–dome–spine skeleton in JRM33.

Eight parts, five theory appendices (D1–D5), and a companion article with the full
proofs. Code: `research/preferred-directions/`.

- {% if jekyll.environment == 'development' %}<a href="/mathematics/2026/08/05/forbidden-directions-research-program/">Part 1 — The Research Program</a>{% else %}Part 1 — The Research Program (in draft){% endif %}
- {% if jekyll.environment == 'development' %}<a href="/articles/magnetic-flux-lifts/">Article — Growth Vectors and Caustics of Magnetic Flux Lifts</a>{% else %}Article — Growth Vectors and Caustics of Magnetic Flux Lifts (in draft){% endif %}

<hr />

## From Caustics to Groups <span class="proj-badge">DRAFT</span>

Can you hear the group from the caustic? The forward map: each nilpotent group
stamps a signature caustic on its sub-Riemannian exponential map. The inverse map:
a moduli-based classifier that reads a caustic and names the group — tested to an
honest confusion matrix, with its aliasing pairs and its calibrated silence on data
that carries no group at all. The finale takes the classifier into the wild,
including diffusion-MRI orientation data.

Four parts and six appendices (C1–C6). Code: `research/caustics-to-groups/`.

- {% if jekyll.environment == 'development' %}<a href="/mathematics/2026/07/15/caustics-to-groups-research-program/">Part 1 — The Research Program</a>{% else %}Part 1 — The Research Program (in draft){% endif %}

<hr />

## Geometry of the Cosmic Web <span class="proj-badge">DRAFT</span>

A stress test of the orientation-lift machinery on cosmology: can the geometry that
completes contours in the visual cortex find — and explain — cosmic filaments? The
program's benchmark verdict is honestly mixed (the corrected comparison favours the
simple transport model), and the constructive result the refutations left standing
is a *measured transverse correction* to Zel'dovich transport, validated against
CAMELS simulation data.

Three parts and five appendices (B1–B5). Code: `research/cosmic-web/`.

- {% if jekyll.environment == 'development' %}<a href="/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/">Part 1 — The Research Program</a>{% else %}Part 1 — The Research Program (in draft){% endif %}

<hr />

## [Geometry of Seeing]({{ site.url }}/projects/geometry-of-seeing/)

A four-part series on the mathematics of visual perception: why the primary visual cortex
computes contour completion as shortest paths on the Lie group SE(2), how those paths are
parametrised by Jacobi elliptic functions, and what remains open about the exact cut time.
The origin of everything above — the orientation lift, the moduli, the elliptic machinery.

Four parts and five appendices (A1–A5), building on
[Moiseev &amp; Sachkov (2010)](https://arxiv.org/abs/0807.4731).

[Read the project overview →](/projects/geometry-of-seeing/)

<hr />

## [Elliptic functions for Matlab and Octave]({{ site.url }}/elliptic)

<a aria-label="Star moiseevigor/elliptic on GitHub" data-count-aria-label="# stargazers on GitHub" data-count-api="/repos/moiseevigor/elliptic#stargazers_count" data-count-href="/moiseevigor/elliptic/stargazers" data-style="mega" data-icon="octicon-star" href="https://github.com/moiseevigor/elliptic" class="github-button">Star</a>&nbsp;
<a aria-label="Fork moiseevigor/elliptic on GitHub" data-count-aria-label="# forks on GitHub" data-count-api="/repos/moiseevigor/elliptic#forks_count" data-count-href="/moiseevigor/elliptic/network" data-style="mega" data-icon="octicon-git-branch" href="https://github.com/moiseevigor/elliptic/fork" class="github-button">Fork</a>

The [Matlab](https://www.mathworks.com/) script implementations of [Elliptic integrals of three types](https://en.wikipedia.org/wiki/Elliptic_integral), [Jacobi's elliptic functions](https://en.wikipedia.org/wiki/Jacobi%27s_elliptic_functions) and [Jacobi theta functions](https://en.wikipedia.org/wiki/Theta_function) of four types.

The main *GOAL* of the project is to provide the natural Matlab scripts *WITHOUT* external library calls like Maple and others. All scripts are developed to accept tensors as arguments and almost all of them have their complex versions. Performance and complete control on the execution are the main features. The same functions — $K(k)$, $\mathrm{sn}$, $\mathrm{cn}$, $\mathrm{dn}$ — do the exact work in the series above, from elastica periods to the $\delta(\varepsilon)$ law.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/moiseevigor/elliptic/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/moiseevigor/elliptic/tree/master) [![DOI](https://zenodo.org/badge/5762/moiseevigor/elliptic.svg)](https://zenodo.org/badge/latestdoi/5762/moiseevigor/elliptic)


<hr />

## [Tech Blog]({{ site.url }}/)

<a aria-label="Star moiseevigor/moiseevigor.github.io on GitHub" data-count-aria-label="# stargazers on GitHub" data-count-api="/repos/moiseevigor/moiseevigor.github.io#stargazers_count" data-count-href="/moiseevigor/moiseevigor.github.io/stargazers" data-style="mega" data-icon="octicon-star" href="https://github.com/moiseevigor/moiseevigor.github.io" class="github-button">Star</a>&nbsp;&nbsp;
<a aria-label="Fork moiseevigor/moiseevigor.github.io on GitHub" data-count-aria-label="# forks on GitHub" data-count-api="/repos/moiseevigor/moiseevigor.github.io#forks_count" data-count-href="/moiseevigor/moiseevigor.github.io/network" data-style="mega" data-icon="octicon-git-branch" href="https://github.com/moiseevigor/moiseevigor.github.io/fork" class="github-button">Fork</a>


A public space for thoughts on machine learning and human intelligence, plus notes
on tech and related topics — and the host of everything on this page: the series,
the [articles](/articles/), and the research code are all in this one repository.

[![CircleCI](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master.svg?style=svg)](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master)

<script async defer id="github-bjs" src="https://buttons.github.io/buttons.js"></script>
