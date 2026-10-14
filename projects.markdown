---
layout: page
title: Tools
header: Tools
group: navigation
permalink: /projects/
comments: false
---

<style>
a > img {
	display: inline;
}
</style>

<nav class="research-index-jump" aria-label="Tools index"><a href="#interactive-tools">Interactive tools</a><a href="#software">Software</a><a href="/lab/">Research results</a></nav>

<div class="research-tool-list" id="interactive-tools" markdown="1">

## Interactive tools

<div class="research-tool" markdown="1">

### [Proof Atlas](/projects/proof-atlas/)

Read the mathematical article, follow its crossing proof in the graph, or browse all compiled Lean declarations. The overview explains which view to choose; references and coverage sit alongside them.

[Open Proof Atlas →](/projects/proof-atlas/)

</div>
<div class="research-tool" markdown="1">

### [The geometry of shortest paths](/mathematics/se2-explained/)

Interactive figures explain motion, the pendulum reduction, cut time and the classical SE(2) optimal synthesis. Numerical illustrations carry their stated scope.

[Explore the guide →](/mathematics/se2-explained/)

</div>
<div class="research-tool" markdown="1">

### [Stages of star formation](/astrophysics/2026/10/11/hidden-protostars-research-program/#star-formation)

A physical explainer of collapse and embedded stellar formation. It illustrates published physics; the survey research has established no stellar-birth detector.

[Explore formation →](/astrophysics/2026/10/11/hidden-protostars-research-program/#star-formation)

</div>
</div>

<h2 id="software">Software and libraries</h2>

## [Elliptic functions for Matlab and Octave]({{ site.url }}/elliptic)

<a aria-label="Star moiseevigor/elliptic on GitHub" data-count-aria-label="# stargazers on GitHub" data-count-api="/repos/moiseevigor/elliptic#stargazers_count" data-count-href="/moiseevigor/elliptic/stargazers" data-style="mega" data-icon="octicon-star" href="https://github.com/moiseevigor/elliptic" class="github-button">Star</a>&nbsp;
<a aria-label="Fork moiseevigor/elliptic on GitHub" data-count-aria-label="# forks on GitHub" data-count-api="/repos/moiseevigor/elliptic#forks_count" data-count-href="/moiseevigor/elliptic/network" data-style="mega" data-icon="octicon-git-branch" href="https://github.com/moiseevigor/elliptic/fork" class="github-button">Fork</a>

The [Matlab](https://www.mathworks.com/) script implementations of [Elliptic integrals of three types](https://en.wikipedia.org/wiki/Elliptic_integral), [Jacobi's elliptic functions](https://en.wikipedia.org/wiki/Jacobi%27s_elliptic_functions) and [Jacobi theta functions](https://en.wikipedia.org/wiki/Theta_function) of four types.

The main *GOAL* of the project is to provide the natural Matlab scripts *WITHOUT* external library calls like Maple and others. All scripts are developed to accept tensors as arguments and almost all of them have their complex versions. Performance and complete control on the execution are the main features. The same functions — $K(k)$, $\mathrm{sn}$, $\mathrm{cn}$, $\mathrm{dn}$ — do the exact work in the [Lab](/lab/)'s programs, from elastica periods to the $\delta(\varepsilon)$ law.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/moiseevigor/elliptic/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/moiseevigor/elliptic/tree/master) [![DOI](https://zenodo.org/badge/5762/moiseevigor/elliptic.svg)](https://zenodo.org/badge/latestdoi/5762/moiseevigor/elliptic)


<hr />

<script async defer id="github-bjs" src="https://buttons.github.io/buttons.js"></script>
