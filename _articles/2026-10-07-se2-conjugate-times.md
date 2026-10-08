---
layout: distill
title: "All Conjugate Times of the Rotating Geodesics on SE(2)"
subtitle: "The exact bracket mechanism, its critical exception, and what the Lean development formalizes."
date: 2026-10-07 10:00:00 +0200
categories: [articles]
program: se2-geodesics
tags: [SE2, sub-riemannian, geodesics, elliptic-functions]
permalink: /articles/se2-conjugate-times/
published: true
comments: false
manuscript_status: "manuscript candidate; final review open"
---

{% include se2-assets.html %}

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Author manuscript · manuscript candidate; final review open.</strong> This web companion states the principal results and explains their arguments. The complete hypotheses, detailed proofs, figures and bibliography are in the full manuscript linked below. This page is an editorial adaptation; it adds no theorem and does not claim journal peer review.</div>

<div class="se2-manuscript"><a href="/public/research/se2/conjugate_times_se2.pdf">Read the full manuscript · 16 pages</a><a href="/public/research/se2/conjugate_times_se2.tex">TeX snapshot</a><a href="/mathematics/2026/10/07/se2-geodesics-research-program/">The SE(2) program</a></div>


## The problem and its normalization

The standard left-invariant sub-Riemannian metric makes

$$X_1=\cos\theta\,\partial_x+\sin\theta\,\partial_y,
\qquad X_2=\partial_\theta$$

orthonormal. A normal geodesic starts at $(0,0,0)$ with Hamiltonian energy $1/2$. On the rotating stratum $C_2$, use the modulus $0<k<1$, initial phase $\psi$ and scaled time $p=t/(2k)$. Put $m=k^2$, $K=K(m)$, $E=E(m)$ and $\tau=\psi+p$.

The exponential map sends $(\psi,k,t)$ to the endpoint $(x,y,\theta)$. A positive time is conjugate when this map loses rank. Sachkov's reduced Jacobian has the form

$$J_2(\tau,p)=\alpha(p)\operatorname{sn}^2\tau+
\beta(p)\operatorname{cn}^2\tau.$$

Its zeros are the conjugate times, since the full determinant differs by a nonvanishing factor on the rotating chart. This reduction concerns the zero set; it does not replace a geometric rank calculation when classifying the image singularity.

Write $s=\operatorname{sn}p$, $c=\operatorname{cn}p$, $d=\operatorname{dn}p$ and $e=\mathcal E(p)$, where $\mathcal E$ is the Jacobi epsilon function. The coefficients are

$$\begin{aligned}
f_1&=c(e-p)-ds, &\beta_1&=ce-ds,\\
\alpha_1&=cd(p-2e)+s\bigl(d^2+e(p-e)\bigr),\\
\alpha&=(1-m)s\alpha_1, &\beta&=f_1\beta_1.
\end{aligned}$$

## The first-time statement

Let $p_n^1$ be the positive zeros of $f_1$, with $(2n-1)K<p_n^1<2nK$. Write $p_0=p_1^1$. Let $p_1^{\alpha}$ be the first zero of $\alpha_1$ after $p_0$ and put

$$p_1=\min(2K,p_1^{\alpha}).$$

**Manuscript Theorem 3.4.** For every modulus and initial phase, the first conjugate time is the unique root in the closed bracket $[p_0,p_1]$, multiplied by $2k$ to recover physical time. There is no conjugate time before $2kp_0$.

The phase-uniform bounds and the cut-time result are attributed to Sachkov. The manuscript contribution is the exact unique crossing within the bracket, together with the corresponding all-cell count. It does not claim a new minimizing synthesis.

## Why the crossing is unique

On an admissible bracket, solve the Jacobian equation for the phase ratio:

$$\operatorname{sn}^2\tau=r(p),\qquad
r=-\frac{\beta}{\alpha-\beta}.$$

Let $u(p)\in[0,K]$ be the inverse phase with $\operatorname{sn}^2u=r$. The zero set lifts to $\tau\equiv\pm u(p)\pmod{2K}$; a geodesic is the line $\tau=\psi+p$.

The Riccati identities control the derivatives of the two coefficient ratios. Their product identity and the arithmetic–geometric mean inequality imply $|u'|\ge1$, with a fixed orientation on each bracket. An oriented monotonicity argument then gives a unique time for the crossing. The two signs describe the same time at a corner, so the conclusion is uniqueness of **time**, rather than uniqueness of a signed pair.

Equality of slopes requires additional care: the paper treats finite tangencies through analytic continuation and local order. The formal counting theorem assumes the needed finiteness of tangencies; it does not silently replace that hypothesis by a strict slope inequality everywhere.

</div>

{% include se2-figure.html mode="brackets" kicker="The analytical mechanism" title="Read the zeros as phase intersections" caption="Shaded regions are the left and right brackets of a Maxwell cell. The critical preset exposes the touching case. Numerical detection supports the explanation; the manuscript's slope and endpoint arguments establish the count." %}

<div class="l-body" markdown="1">

## Every Maxwell cell, including the exceptional case

Let $b_n$ be the zero of $\beta_1$ in $(2nK,(2n+1)K)$ and $p_n^\alpha$ the relevant zero of $\alpha_1$. The brackets are

$$\begin{aligned}
 B_n^-&=[p_n^1,\min(2nK,p_n^\alpha)],\\
 B_n^+&=[\max(2nK,p_n^\alpha),b_n].
\end{aligned}$$

**Manuscript Theorem 4.1.** Every half-open Maxwell cell $[p_n^1,p_{n+1}^1)$ has one conjugate root on each closed bracket and none elsewhere. The roots are distinct except at

$$K=2E,\qquad \psi\equiv K\pmod{2K},$$

when both are $p=2nK$. The unique critical modulus is $k_0\approx0.90890855755$.

The half-open convention is essential. At $\psi\equiv-p_n^1$, the left root is $p_n^1$ itself. Omitting that endpoint changes the open-cell count. At the critical phase, the coincident determinant zero has order four:

$$J_2(K+2nK+\sigma,2nK+\sigma,k_0)
=\frac{1-k_0^2}{3}\sigma^4+O(\sigma^6).$$

This scalar order does not itself identify the singularity of the full exponential map. That belongs to the conjugate-locus article.

## Periodic velocity, spatial drift, late times

The body velocity has period $T$, while the endpoint satisfies $g(t+nT)=h^n g(t)$ for a period translation $h$. Differentiating with respect to the source parameters gives a determinant that is exactly quadratic in the integer $n$.

For phase representatives in $(-K,K)$, away from $\psi\equiv K$, the manuscript derives

$$p_{(j)}=(j+\tfrac12)K-\tfrac12\psi+O(1/j).$$

The estimate is uniform on compact phase subsets away from the excluded phase. It describes late conjugate times; it does not assert that the entire geodesic closes after a pendulum period, or supply a uniform estimate up to the exceptional phase.

## The formal proof boundary

The current Lean reduction constructs `JacobiFull` from a 13-hypothesis `JacobiCore`: the modulus range, four derivative rules, four initial values, and the first-zero data for $\operatorname{cn}$ and $K$. It derives the algebraic relations, positivity, reflection and periodic identities, inverse phase map and phase congruence characterization.

The remaining formal assumptions include existence of functions with that core and finiteness of the relevant tangencies. The formal development covers the bracket counting chain under its hypotheses. The large-index theorem, identification with the concrete geometric exponential map, scalar zero orders and caustic recognition are separately argued; they are not all Lean consequences.

## Status and sources

This manuscript is an author publication candidate. Its original September review repaired signed-corner uniqueness, unqualified distinct counts and numerical provenance. The latest September reduction narrows the formal assumption base. This editorial pass reads those records and reruns the browser numerical fixtures; it does not claim a fresh Lean or Mathlib rebuild.

Foundational sources are Moiseev–Sachkov's [Maxwell-strata paper](https://doi.org/10.1051/cocv/2009004) and Sachkov's [conjugate/cut-time paper](https://doi.org/10.1051/cocv/2009031). Complete citations and statement locators are in the PDF. The project-local literature catalogue preserves its reading and edition limits.

Continue to [the conjugate locus](/articles/se2-conjugate-locus/): apply the endpoint map to the singular sources identified here. The [snapshot manifest](/public/research/se2/se2-provenance.json) records the exact source and PDF hashes used for this web edition.

</div>
