---
layout: distill
title: "All Conjugate Times of the Rotating Geodesics on SE(2)"
subtitle: "The exact bracket mechanism, its critical exception, and what the Lean development formalizes."
date: 2026-10-07 10:00:00 +0200
categories: [articles]
program: se2-geodesics
article_kind: "Manuscript companion"
tags: [SE2, sub-riemannian, geodesics, elliptic-functions]
permalink: /articles/se2-conjugate-times/
published: true
comments: false
pdf: /public/research/se2/conjugate_times_se2.pdf
manuscript_status: "manuscript candidate; final review open"
---

{% include se2-assets.html %}

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Author manuscript · manuscript candidate; final review open.</strong> This web companion states the principal results and explains their arguments. The complete hypotheses, detailed proofs, figures and bibliography are in the full manuscript linked below. The November update below includes the subsequent formal proof of the fixed-cell splitting.</div>

<div class="se2-manuscript"><a href="/public/research/se2/conjugate_times_se2.pdf">Read the full manuscript · 16 pages</a><a href="/public/research/se2/conjugate_times_se2.tex">TeX snapshot</a><a href="/mathematics/2026/10/07/se2-geodesics-research-program/">The SE(2) program</a></div>


## The problem and its normalization

The standard left-invariant sub-Riemannian metric makes

$$X_1=\cos\theta\,\partial_x+\sin\theta\,\partial_y,
\qquad X_2=\partial_\theta$$

orthonormal. A normal geodesic starts at $(0,0,0)$ with Hamiltonian energy $1/2$. On either fixed rotation-sign component of the rotating stratum $C_2$, use the modulus $0<k<1$, initial phase $\psi$ and scaled time $p=t/(2k)$. Put $m=k^2$, $K=K(m)$, $E=E(m)$ and $\tau=\psi+p$.

The exponential map sends $(\psi,k,t)$ to the endpoint $(x,y,\theta)$. A positive time is conjugate when this map loses rank. Sachkov's reduced Jacobian has the form

$$J_2(\tau,p)=\alpha(p)\operatorname{sn}^2\tau+
\beta(p)\operatorname{cn}^2\tau.$$

Its zeros are the conjugate times, since the full determinant differs by a nonvanishing factor on the rotating chart. This reduction concerns the zero set; it does not replace a geometric rank calculation when classifying the image singularity.

Write $s=\operatorname{sn}p$, $c=\operatorname{cn}p$, $d=\operatorname{dn}p$ and $e=\mathcal E(p)$, where $\mathcal E(p)=E(\operatorname{am}(p\mid m)\mid m)$ is the Jacobi epsilon function, so $\mathcal E^\prime(p)=\operatorname{dn}^2(p\mid m)$. The coefficients are

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

The Riccati identities control the derivatives of the two coefficient ratios. Their product identity and the arithmetic–geometric mean inequality imply $\lvert u^\prime\rvert\ge1$, with a fixed orientation on each bracket. An oriented monotonicity argument then gives a unique time for the crossing. The two signs describe the same time at a corner, so the conclusion is uniqueness of **time**, rather than uniqueness of a signed pair.

The lift can have unit slope at a tangency. The concrete counting theorem handles these contacts and proves uniqueness for every admissible modulus and phase. Its statement requires no separate finiteness assumption on tangencies.

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

## How the two times separate

Fix a later cell $n\ge1$ and keep $\psi\equiv K(k)\pmod{2K(k)}$. Write $h=p-2nK(k)$ and $\delta=K-2E$. One root has $h=0$ for every modulus. Near the exceptional modulus the second root solves

$$I_k(h)=-2n\delta,\qquad I_k(h)=\int_0^h
\left(\frac{\operatorname{sn}v\,\operatorname{dn}v}{\operatorname{cn}v}\right)^2\,dv.$$

The integrand is positive on either side of zero close to the center. Thus $I_k$ is strictly increasing there, and the sign of the second displacement is opposite to that of $\delta$. Its leading term is $h^3/3$. More precisely, with $x=\sqrt[3]{-6n\delta}$ the signed real cube root,

$$h=x+\frac{4k^2-2}{15}x^3+O(\lvert x\rvert^5).$$

One can verify the correction by substituting $h=x+(4k^2-2)x^3/15$ into $3I_k(h)=x^3$. The terms of degree five cancel. Adding and subtracting a sufficiently large multiple of $\lvert x\rvert^5$ gives two trial offsets with opposite residuals. Continuity puts a root between them and strict increase identifies it uniquely. The derivative of $K-2E$ at $k_0$ is $E/[k_0(1-k_0^2)]>0$, so the separation is proportional to $\lvert k-k_0\rvert^{1/3}$ at fixed $n$. Physical time separation is $2k\lvert h\rvert$.

## Periodic velocity, spatial drift, late times

The body velocity has period $T=4kK$, while the endpoint satisfies $g(t+nT)=h^n g(t)$ for a period translation $h$. Differentiating with respect to the source parameters gives a determinant that is a polynomial of degree at most two in the integer $n$.

For each fixed modulus and phase representatives in $(-K,K)$, away from $\psi\equiv K$, the manuscript derives

$$p_{(j)}=(j+\tfrac12)K-\tfrac12\psi+O(1/j).$$

The estimate is uniform on compact phase subsets away from the excluded phase. It describes late conjugate times; it does not assert that the entire geodesic closes after a pendulum period, or supply a uniform estimate up to the exceptional phase.

## The formal proof boundary

The November development constructs the Jacobi functions by inverting the elliptic integral and proves the first-time and noncritical counting theorems for these concrete functions. It also identifies the signed determinant of the actual rectified endpoint map and proves that this determinant has degree at most two in the period index.

For the exceptional phase, Lean verifies the unique critical modulus, the scalar fourth-order coefficient and the fixed-cell splitting formula above, including its fifth-order error bound and local uniqueness. The large-index root asymptotics, the full variational index theorem and the geometric classification of the caustic have further analytic steps.

## Status and sources

The downloadable PDF is the October manuscript snapshot. This companion was updated on 21 November 2026 after checking the combined Lean build and the axiom dependencies of the splitting result. The [proof sources and verification record](/public/research/se2/fixed-cell-splitting.zip) reproduce that check. Peer review remains open.

Foundational sources are Moiseev–Sachkov's [Maxwell-strata paper](https://doi.org/10.1051/cocv/2009004) and Sachkov's [conjugate/cut-time paper](https://doi.org/10.1051/cocv/2009031). Complete citations and statement locators are in the PDF. The project-local literature catalogue preserves its reading and edition limits.

Continue to [the conjugate locus](/articles/se2-conjugate-locus/): apply the endpoint map to the singular sources identified here. The [snapshot manifest](/public/research/se2/se2-provenance.json) records the exact source and PDF hashes used for this web edition.

</div>
