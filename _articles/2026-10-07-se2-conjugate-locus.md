---
layout: distill
title: "The Conjugate Locus of Rotating Geodesics on SE(2)"
subtitle: "From the kernel of the exponential map to folds, cusp seams, and a conditional global incidence criterion."
date: 2026-10-07 10:00:00 +0200
categories: [articles]
program: se2-geodesics
article_kind: "Manuscript companion"
tags: [SE2, sub-riemannian, geodesics, elliptic-functions]
permalink: /articles/se2-conjugate-locus/
published: true
comments: false
manuscript_status: "research draft; excluded-domain arguments open"
---

{% include se2-assets.html %}

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Author manuscript · research draft; excluded-domain arguments open.</strong> This web companion states the principal results and explains their arguments. The complete hypotheses, detailed proofs, figures and bibliography are in the full manuscript linked below. This page is an editorial adaptation; it adds no theorem and does not claim journal peer review.</div>

<div class="se2-manuscript"><a href="/public/research/se2/first_caustic_se2.pdf">Read the full manuscript · 31 pages</a><a href="/public/research/se2/first_caustic_se2.tex">TeX snapshot</a><a href="/mathematics/2026/10/07/se2-geodesics-research-program/">The SE(2) program</a></div>


## The image of the singular sources

Use the standard metric of [Article A](/articles/se2-conjugate-times/) and rotating source coordinates $(\psi,k,t)$. A conjugate time is a zero of the differential's determinant. Its endpoint belongs to the conjugate locus.

The time equation tells us where to look, but the geometry of the image needs more information. A rank loss of one and a rank loss of two require different analyses. Even at corank one, the behavior along the kernel distinguishes an ordinary fold from a cusp.

The manuscript studies the first caustic, the later sheets and the target-incidence question. Its fold/cusp results and its global count criterion use separate certificates with separate domains.

## First variation isolates the kernel

On Hamiltonian energy $H=1/2$, the first variation pairs the terminal covector with the two parameter variations to zero, while its pairing with the time velocity is one. Hence a null vector of the full differential has zero time component.

On the open first sheet the heading derivative $\theta_\psi$ is nonzero. Therefore the map has corank one there, and a kernel generator is

$$v=(\theta_k,-\theta_\psi,0).$$

This also explains why differentiating at fixed scaled time $p$ requires care: the geometric kernel holds physical time $t$ fixed. Since $t=2kp$, changing $k$ changes $p$ along that kernel.

## The polynomial that recognizes a fold

The manuscript expresses the derivative of the determinant along $v$ as an explicit nonzero factor times a polynomial $Q$ in the Riccati variables of Article A. On an open sheet, a nonzero kernel derivative establishes the fold condition.

The first-sheet positivity proof changes variables to a positive parameter and three variables in the open unit cube. After an explicit positive scaling, it gives the exact identity

$$P=S_0+\mathsf B S_B+\mathsf Z S_Z,$$

with $\mathsf B>0$, $\mathsf Z\ge0$ and each $S$ a sum of positive Bernstein-basis products. The table contains **216 strictly positive rational coefficients**. Its identity and scaling are checked with exact fractions. Thus the positivity argument is algebraic, rather than an extrapolation from a color plot or a floating-point sample.

Later right-sheet sign statements have their own domain and rational certificates. Neither this positivity identity nor a local fold test establishes the global incidence-count conjecture.

</div>

{% include se2-figure.html mode="caustic" kicker="The image of the rank loss" title="A slice through the conjugate locus" caption="The figure varies the modulus and chooses an ordinal conjugate point. It is a sampled plane projection, not a proof of embedding or a full three-dimensional singularity classifier. Paths can cross in projection while their endpoint headings differ." %}

<div class="l-body" markdown="1">

## Edges and the critical point

The manuscript distinguishes the open sheets from their seams:

- The Maxwell edge of the first caustic is a cusp edge.
- Its half-period edge is a cusp below the critical modulus.
- Above the critical modulus, the first-sheet edge at the zero of $\alpha_1$ is a fold.
- At $k=k_0$ the relevant seams meet in a corank-two point, classified through a generating-family calculation as $D_4^+$.

The later-cell seam statements require their own labels and conditions; they are given in the PDF. The $D_4^+$ argument uses the intrinsic cubic sign **and** the parameter classes needed for versality. These are separate requirements. A quartic zero of the scalar determinant along one curve is not enough to infer that classification.

The reviewed source statements for Morin and generating-family recognition are explicitly located in the manuscript. The literature record still contains full-text and edition gaps; the existence of an Obsidian note is not a substitute for a checked source theorem.

## Embedding has a target-space boundary

An explicit half-angle chart parametrizes the first caustic in eight patches. Within each open patch, a slope argument establishes injectivity of the spatial chart, and hence of the full endpoint chart.

The small-modulus limit tends to the identity, while the separatrix limit leaves compact sets. Properness must therefore be stated into **SE(2) with the identity removed**. Into the whole group, a sequence approaching the omitted small-modulus endpoint disproves that properness claim. The corrected statement and seam identifications are in the manuscript; the plane projection above does not prove them.

## The incidence bridge to the scalar inverse

Article C reconstructs rotating sources from integer intersections of a target-dependent function $N$. A critical integer intersection is a singular source. This turns questions about incidences of conjugate sheets into questions about critical points and integer levels of $N$.

Primes below differentiate along the scalar inverse chart. The useful conditional predicate at an interior critical point is

$$N''<0\qquad\text{or}\qquad N<\tfrac12\ \text{ and }\ R<L(m),$$

Here $R=\sqrt{x^2+y^2}$ and $L(m)=4(K(m)-E(m))$. The implication requires a nonzero spatial target, a strict heading $0<\lvert\theta\rvert<\pi$, the off-seam condition $x\cos(\theta/2)+y\sin(\theta/2)\ne0$, and a **maximal** admissible component of the scalar inverse. Assume the predicate holds at every critical point with $N\ge1/2$ and at every interior local minimum; any critical points in the excluded regions need separate arguments. Then there is at most one critical point at levels $\ge1$, and at most two solutions at each positive integer level. The uniqueness threshold is **one**, not one half.

A locally certified low-level minimum is compatible with this statement. In fact, six selected targets have such dips below one, which rule out unrestricted all-real-level unimodality. They do not refute the positive-integer-level conjecture.

## What the interval run establishes

For endpoint-amplitude lifts $\varphi_0,\varphi_1$, set $\mu=(\varphi_0+\varphi_1)/2$ and $\Delta\varphi=\varphi_1-\varphi_0$. Reflection and period symmetries reduce the midpoint to $\mu\in[0,\pi/2]$. The endpoint-coordinate box is

$$0.02\le m\le0.98,\qquad 0\le\mu\le\pi/2,
\qquad 0.02\le\Delta\varphi\le2\pi-0.02.$$

The original interval certificate was withdrawn after two enclosure defects were found: incomplete integrals at negative amplitudes and varying quadratic square roots incorrectly tightened as constants. The current calculation uses repaired primitives and source-bound, resumable proof records.

The saved full-grid audit records **38,400 validated cell checkpoints**, with no semantic validation failures. Under the original exclusions, 304 boxes in 32 cells remain unresolved. The current manuscript declares those cells as a fifth excluded set $\mathcal C_4$, in addition to the bisector slab, two corners and double-flip tube.

The largest part of $\mathcal C_4$ is a low-modulus wedge,

$$0.02\le m\le0.06,\quad0.94\le\mu\le\pi/2,
\quad0.41\le\Delta\varphi\le0.80,$$

plus one further cell near $m\in[0.78,0.82]$. The five declared sets occupy approximately 2.56% of the ambient endpoint-coordinate volume. All boxes outside those sets close in the recorded computation. The predicate inside the excluded regions remains an analytical task.

The fifth exclusion is a change of certified domain. It does not prove the residual wedge, nor convert numerical small-modulus asymptotics into a remainder-bounded theorem. Applying the conditional count globally to a target component requires its critical points to meet the certified domain or to have separate proofs on the excluded portions.

## Status and reproducibility

This is a **research draft**. Exact local certificates, geometric recognition and selected independent differential checks support their scoped statements. The global incidence/count conjecture, excluded-domain arguments and publication checks remain open.

This web pass snapshots the current manuscript and reads the latest grid audit. It does not rerun the multi-million-leaf interval calculation or formalize the caustic in Lean. The [snapshot manifest](/public/research/se2/se2-provenance.json) preserves the PDF and TeX hashes and identifies the audit totals used.

Read the complete 31-page manuscript above for all charts, seam hypotheses and proof details. Continue to [Article C](/articles/se2-geodesic-counts/) for the exact inverse map and its count statements, or return to [the unified program](/mathematics/2026/10/07/se2-geodesics-research-program/).

</div>
