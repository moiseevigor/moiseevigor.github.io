---
layout: distill
title: "Inverting the Exponential Map and Counting Geodesics on SE(2)"
subtitle: "An exact scalar inverse, finite rotating fibers, infinite winding families, and count formulas with explicit domains."
date: 2026-10-07 10:00:00 +0200
categories: [articles]
program: se2-geodesics
tags: [SE2, sub-riemannian, geodesics, elliptic-functions]
permalink: /articles/se2-geodesic-counts/
published: true
comments: false
manuscript_status: "manuscript candidate; final proof and novelty review open"
---

{% include se2-assets.html %}

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Author manuscript · manuscript candidate; final proof and novelty review open.</strong> This web companion states the principal results and explains their arguments. The complete hypotheses, detailed proofs, figures and bibliography are in the full manuscript linked below. This page is an editorial adaptation; it adds no theorem and does not claim journal peer review.</div>

<div class="se2-manuscript"><a href="/public/research/se2/inversion_counts_se2.pdf">Read the full manuscript · 75 pages</a><a href="/public/research/se2/inversion_counts_se2.tex">TeX snapshot</a><a href="/mathematics/2026/10/07/se2-geodesics-research-program/">The SE(2) program</a></div>


## Declare the counted object first

A source is an initial normal covector of Hamiltonian energy $1/2$ and a positive travel time. We count distinct sources, retaining reflections and continuing trajectories beyond their cut time.

For a strict heading $0<|\theta|<\pi$, distinguish the finite **rotating fiber** from the **full normal fiber**, which can be countably infinite because it also contains nonzero heading-winding classes. Neither is the count of minimizing paths. The latter uses the known optimal synthesis.

These distinctions are part of the theorem statements. A browser drawing of nine rotating sources cannot establish that a target has only nine normal geodesics of every stratum and travel time.

## A three-variable inverse becomes a scalar equation

Fix $X=(x,y)\ne0$ and a strict heading. For spatial sign $\varepsilon=1$, let $z=\tan a$ and put

$$\begin{aligned}
 H&=1+z^2,& C&=x+yz,& D&=z\cos\theta-\sin\theta,\\
 d&=D^2-z^2,& U&=C^2+d,& A&=\frac{xz-y}{\sqrt H},\\
 f&=\frac{U}{2C\sqrt H},& g&=\frac{d-C^2}{2C\sqrt H},&
 m&=\frac{z^2+(U/(2C))^2}{H}.
\end{aligned}$$

**Manuscript Proposition 2.1, off the seam.** The admissible domain is exactly

$$C\ne0,\qquad\cos\theta+z\sin\theta>0,
\qquad xz-y>0,\qquad0<m<1.$$

The sine–cosine pairs $(z/\sqrt H,f)$ and $(D/\sqrt H,g)$ determine endpoint amplitudes $\phi_0,\phi_1$. Choose their representatives in $[0,2\pi)$, form $\psi=F(\phi_0\mid m)$ and $v_0=F(\phi_1\mid m)$, and set

$$\begin{aligned}
 w&=\mathbf1_{v_0<\psi},& \delta&=v_0-\psi+4K(m)w,\\
 Q_0&=\delta-E(\phi_1\mid m)+E(\phi_0\mid m)-4E(m)w,\\
 L(m)&=4(K(m)-E(m)),& N(z)&=\frac{A-Q_0}{L(m)}.
\end{aligned}$$

Every intersection $N(z)=n\in\mathbb Z_{\ge0}$ reconstructs the source

$$\left(\psi,\sqrt m,\sqrt m\,\delta+4n\sqrt m K(m),1\right).$$

These exhaust the sources of that sign with nonzero transverse seam coordinate. Apply the same construction to $-X$ for $\varepsilon=-1$. The zero-transverse seam requires separate formulas; omitting it would lose actual sources, especially on symmetric rays.

### Why this is exact

The endpoint equations give $f-g=B$ and a second difference-of-squares relation. Solving them yields the algebraic data above. The admissibility inequalities choose the correct principal angle, positive longitudinal coordinate and real modulus. The remaining longitudinal displacement separates into a residual piece $Q_0$ and an integer number of full-period drifts $nL$.

No division by the endpoint cosines is required. Their zeros therefore do not disappear from the inverse chart. Local phase lifts handle the apparent jumps caused by the chosen amplitude representatives.

</div>

{% include se2-figure.html mode="inverse" kicker="Reconstruct and check forward" title="Explore a rotating fiber" caption="The nine-source example is recovered by the scalar chart and forward-checked at every render. The numerical search has a travel-time bound and a finite sampling strategy. Agreement for this example is evidence for the implementation, rather than a certificate for every possible target." %}

<div class="l-body" markdown="1">

## Where a scalar intersection becomes a fold

At an integer intersection off the seam, the full exponential map is regular if $N_z\ne0$. When $N_z=0$, it has corank one and is a fold exactly when $N_{zz}\ne0$ under the proposition's local coordinate hypotheses.

This identifies the mechanism for a pair of sources to meet and disappear: the horizontal integer level reaches a nondegenerate extremum. It also links the inverse problem to [Article B](/articles/se2-conjugate-locus/). Classifying a singularity still needs the full coordinate and rank conditions; a low-resolution crossing detector alone cannot supply them.

## An exact count on a half-heading ray

Fix $0<\alpha<\pi/2$, write $s=\sin\alpha$, and consider

$$q_R=(R(\sin\alpha,-\cos\alpha),2\alpha),\qquad R>0.$$

Let $Q=\operatorname{artanh}(s)-s$. The manuscript defines attained short-branch thresholds $S_n$ and increasing long-branch cusp thresholds $R_n^{\rm cusp}$. **Its all-radius ray theorem states**

$$\begin{aligned}
 N_{\rm rot}(R,\alpha)={}&\mathbf1_{R>2Q}
 +2\#\{n\ge1:S_n<R\}+\#\{n\ge1:S_n=R\}\\
 &+2\#\{n\ge0:R_n^{\rm cusp}<R\}.
\end{aligned}$$

The sums are finite. The equality term at $S_n$ is essential: exactly at that threshold, the seam contributes one source. The strict inequalities at the other thresholds also belong to the statement. Their defining equations and the proof that all families are exhausted are in the full manuscript.

</div>

{% include se2-figure.html mode="ray" kicker="A theorem with boundary cases" title="Count changes along the half-heading ray" caption="This display substitutes tabulated thresholds at α = 0.35 into the count formula. Vertical connectors show neighboring values only. Exact equality values are supplied by the formula above, not by a tolerance around rounded data." %}

<div class="l-body" markdown="1">

## Large distance, fixed angles

The far-field theorem fixes $a_0,b_0\in(-\pi/2,\pi/2)$ with $\theta=a_0-b_0\ne0$. Put

$$q_R=(R(\sin a_0,-\cos a_0),\theta),\qquad
m_*=\max(\sin^2a_0,\sin^2b_0),\quad L_*=4(K(m_*)-E(m_*)).$$

For sufficiently large $R$, the manuscript states

$$\nu_2(q_R)=\frac{4R}{L_*}+O(1).$$

The constants depend on the fixed angles. The onset radius is not given effectively, and no uniform estimate toward the angle boundaries is asserted. The generic off-symmetric case has an eventual floor formula in the two component maxima; the symmetric half-heading ray must include its seam fiber separately.

For all fixed spatial directions at strict heading, the zero-winding fiber has three eventual regimes, depending on the direction: growth proportional to $R$, growth proportional to $R/\log R$, or a single source. These statements have explicit sign and boundary conditions in the manuscript. They should not be compressed into “the number grows linearly in every direction.”

## Winding explains the infinite full fiber

Lift the heading continuously from zero and define $\ell\in\mathbb Z$ by

$$\widetilde\theta(t)=\theta+2\pi\ell.$$

For the strict-heading targets in the stated theorem, every nonzero winding class has exactly one oscillating source, at every positive radius. The zero-winding fiber is finite; its eventual rotating count is the far-field expression above. Thus a finite rotating count and a countably infinite full fiber coexist.

Headings zero and $\pi$ have separate catalogues. They are not obtained by plugging those boundary headings into a strict-heading theorem. The nonzero vertical axis at heading zero is among the cases with an infinite rotating fiber.

## Other manuscript results and their scope

The full article includes a certified threshold-fold window, a nine-source target, an explicit target segment with changing finite count, within-family momentum ordering and selected-family scaling laws. Those scaling results compare **specified signed families**. They do not exhaust every possible family or give a complete global transition diagram.

The critical scaling expansion has separate nondegeneracy clauses. Simultaneous degeneracies and effective general onset scales remain separate questions. These distinctions matter when connecting a local fold or a selected-family asymptotic to a claim about the entire fiber.

## Status, verification and provenance

This manuscript is an author publication candidate with final proof, novelty and author review gates open. Its stored evidence includes symbolic identities, domain-specific interval certificates and independent Hamiltonian/variational oracles. Later bounded attacks tested the inverse and selected far-field predictions; absence of a found counterexample is supporting evidence, not a proof of completeness.

The web figures use a tested floating-point module copied from the research explorer. The inverse figure reports its time bound and forward residual. The ray diagram uses rounded data at one fixed angle. The [snapshot manifest](/public/research/se2/se2-provenance.json) records the copied source and PDF hashes; the complete 75-page manuscript is linked above.

Return to [the unified SE(2) program](/mathematics/2026/10/07/se2-geodesics-research-program/) for the question connecting times, caustics and counts. The published Maxwell and optimal-synthesis sources remain the basis for minimizing conclusions; this article's post-cut source counts use the broader declared object.

</div>
