---
layout: distill
title: "Beyond the Shortest Path: Geodesics on SE(2)"
subtitle: >
  One research program, three questions: when a path loses local optimality,
  where nearby paths focus, and how many paths reach the same position and heading.
  Follow the pendulum, explore the conjugate locus, and count the inverse images.
date: 2026-10-07 09:00:00 +0200
categories: [mathematics]
tags: [SE2, sub-riemannian, geodesics, conjugate-locus, elliptic-functions, inverse-problems]
series: se2-geodesics
series_title: "Geodesics on SE(2)"
series_part: 1
permalink: /mathematics/2026/10/07/se2-geodesics-research-program/
image: /public/img/posts/se2-geodesics-program.svg
result: '$\operatorname{sn}^2(\psi+p)=r(p)$'
published: true
comments: false
description: >
  A unified SE(2) research program connecting exact conjugate-time brackets,
  the geometry of the caustic and scalar inversion of the exponential map,
  with interactive figures and a current ledger of manuscript claims and open questions.
---

{% include se2-assets.html %}

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Conjugate-times update · 21 November 2026.</strong> This guide accompanies three author manuscripts on rotating geodesics. The linked PDFs preserve the October web edition. The conjugate-times section also reports subsequent results checked in Lean.</div>

A point in the plane is not enough to describe a moving vehicle. We also need its heading. Write its state as $(x,y,\theta)$: a position and an angle. Together these states form **SE(2), the group of plane motions**.

Now forbid sideways motion. The vehicle may drive, reverse and turn, with equal cost for the two allowed controls. Its equations are

$$
\dot x=u_1\cos\theta,\qquad
\dot y=u_1\sin\theta,\qquad
\dot\theta=u_2,
\qquad \text{length}=\int\sqrt{u_1^2+u_2^2}\,dt.
$$

The shortest paths for this problem are already understood through the work of Moiseev and Sachkov.[^maxwell][^cut] But the equations produce more than shortest paths. Continue a geodesic after its cut time and it still solves the Hamiltonian equations. Nearby geodesics can focus, and several different sources can reach exactly the same position **and heading**.

This program follows that continuation. Its three articles examine the same exponential map from three directions:

- **Times:** locate the losses of rank along a source geodesic.
- **Geometry:** map those singular sources into the target space.
- **Counts:** hold a target fixed and recover every source in the stated class.

<aside class="marginnote">Here “source” means an initial normal covector of energy ½ together with a positive travel time. Different sources count separately. A plane crossing alone does not mean the paths share a target: their headings must agree too.</aside>

<div class="se2-jump"><a href="#a-pendulum-behind-every-path">The flow</a><a href="#one-crossing-in-each-bracket">Conjugate times</a><a href="#from-times-to-a-caustic">The caustic</a><a href="#turning-the-map-around">The inverse</a><a href="#what-is-proved-and-what-remains-open">Status</a></div>

</div>

{% include se2-figure.html mode="geodesic" kicker="Start with a source" title="A geodesic, continued beyond its cut time" caption="Change the modulus and phase, then scrub or play time. Purple marks the cut point; orange marks detected conjugate points. The vehicle's heading is part of its state. Equal scales on the two spatial axes preserve the shape of the path." %}

<div class="l-body" markdown="1">

## A pendulum behind every path

The maximum principle reduces the normal Hamiltonian equations to a mathematical pendulum. Oscillating and rotating pendulum motions produce different families of geodesics. In the standard metric considered here, **only the rotating family has conjugate points**.[^conjugate]

A rotating source is specified by a modulus $0<k<1$, an initial phase $\psi$ modulo $4K$, and a rotation sign $\varepsilon=\pm1$. The source-flow figures show $\varepsilon=1$; the inverse search considers both signs. We use the parameter $m=k^2$ in numerical elliptic functions, and the scaled time

$$p=\frac{t}{2k},\qquad \tau=\psi+p,\qquad K=K(k^2).$$

These conventions matter. A statement about $p$ is a statement about physical time only after multiplying by $2k$; a complete elliptic integral written in the modulus convention has $k^2$ inside its defining integral.

There are also two different ways for a shortest path to stop being shortest. At a **Maxwell point**, another path reaches the same target with the same length. At a **conjugate point**, the differential of the exponential map loses rank: changing the source can cease to change the endpoint to first order. A global competitor and a local degeneracy are different events. The cut time occurs no later than the first conjugate time.

## One crossing in each bracket

The first article starts from Sachkov's reduced Jacobian,

$$J_2(\tau,p)=\alpha(p)\,\operatorname{sn}^2\tau+\beta(p)\,\operatorname{cn}^2\tau.$$

On the relevant brackets, its zero equation becomes a crossing problem:

$$\operatorname{sn}^2(\psi+p)=r(p),\qquad r(p)=-\frac{\beta(p)}{\alpha(p)-\beta(p)}.$$

The useful step is to lift $r$ back to phase. A Riccati identity and the arithmetic–geometric mean inequality give a slope bound for the two lifted branches. Each line $\tau=\psi+p$ then crosses the appropriate closed branch exactly once. The manuscript proves one conjugate time in the first bracket and one root on each of two brackets in every later Maxwell cell.

At one modulus, $k_0\approx0.90890856$, the complete elliptic integrals satisfy $K=2E$. At phase $\psi\equiv K\pmod{2K}$, the two roots then meet at $p=2nK$ and the determinant has a fourth-order zero. Keep that phase relation and vary $k$ slightly. One root stays at the moving cell center $2nK(k)$. The distance to the other scales as $\lvert k-k_0\rvert^{1/3}$ for each fixed $n\ge1$. Thus even a small error in the modulus can visibly separate the roots. The [conjugate-times companion](/articles/se2-conjugate-times/#how-the-two-times-separate) gives the signed displacement and its proof. The half-open convention $[p_n^1,p_{n+1}^1)$ assigns each boundary root to one cell.

</div>

{% include se2-figure.html mode="brackets" kicker="Article A · the crossing mechanism" title="Two equations, one root per bracket" caption="Orange is the target ratio r(p); blue is the geodesic's sn² phase. Dots show detected intersections inside the half-open cell. Select the critical case to see the two bracket roots coalesce. The browser root detector illustrates the analytical result; it is not a root-isolation certificate." %}

<div class="l-body" markdown="1">

The paper also derives an exact Floquet form: after an integer number of pendulum periods, the Jacobian is quadratic in that integer. Away from the exceptional phase, this gives an arithmetic-progression law for late conjugate times. It explains regular spacing without assuming the entire endpoint map is periodic: each pendulum period also produces a spatial drift.

## From times to a caustic

A conjugate time is a location in source coordinates. Apply the exponential map and it becomes a point on the **conjugate locus**, or caustic. The second article studies this image.

The central calculation expresses the derivative of the determinant along its kernel through a polynomial $Q$. Exact rational positivity certificates establish the fold behavior of the open sheets. Separate derivative and rank conditions identify their cusp seams. At the critical point, the manuscript treats a corank-two $D_4^+$ singularity through a generating-family calculation and its versality conditions.

This is why plotting a scalar double root does not by itself classify a caustic. A singularity belongs to the full map, with its kernel, rank and higher derivatives. The article keeps those geometric tests separate from the time equation.

</div>

{% include se2-figure.html mode="caustic" kicker="Article B · the image of the singular set" title="Where a family of geodesics focuses" caption="For a fixed modulus, orange joins sampled conjugate endpoints and blue shows selected paths leading to them. Switch between the first and second distinct conjugate points. This is a plane projection of a locus in (x, y, θ), so a projected crossing is not automatically a shared SE(2) endpoint." %}

<div class="l-body" markdown="1">

## Turning the map around

The third article fixes a target $q=(x,y,\theta)$ and asks which sources reach it. A direct search would vary phase, modulus and time. The scalar inverse removes two of those unknowns algebraically.

For an admissible axis angle $a$, write $z=\tan a$. The target determines a modulus $m(z)$, two endpoint amplitudes, a residual displacement $Q_0(z)$ and a positive drift per full period

$$L(m)=4\bigl(K(m)-E(m)\bigr).$$

The remaining equation is a level crossing:

$$N(z)=\frac{A(z)-Q_0(z)}{L(m(z))}=n,\qquad n\in\mathbb Z_{\ge0}.$$

Each admissible integer intersection reconstructs an actual rotating source. Both spatial signs must be considered, and the chart's seam needs its own treatment. This gives the bridge between the three articles: a critical integer intersection of $N$ corresponds to a singular source, whose image lies on a caustic sheet.

</div>

{% include se2-figure.html mode="inverse" kicker="Article C · hold the target fixed" title="Different paths, the same position and heading" caption="The nine-source preset is a regression example for the rotating inverse. Every displayed source is reconstructed and checked forward; seam sources use a separate chart. Move the target or its heading to explore nearby fibers. The displayed search is bounded by t ≤ 40 and uses floating-point detection; it does not certify completeness for arbitrary targets." %}

<div class="l-body" markdown="1">

### Which count?

The word “count” needs a declared object. The **rotating fiber** is finite at strict nonzero headings in the manuscript's stated domains. The **full normal fiber** can be countably infinite, because it includes oscillating geodesics in nonzero winding classes. The **minimizing fiber** is smaller still, and its classification uses the published optimal synthesis.

On one especially tractable half-heading ray, the manuscript gives an exact rotating count at every positive radius. Changes occur at analytically defined seam and cusp thresholds. At a threshold itself, equality matters; the count there cannot be inferred simply by drawing a step between the two neighboring values.

</div>

{% include se2-figure.html mode="ray" kicker="A count with explicit thresholds" title="How the rotating fiber grows along a ray" caption="The ray is q(R) = (R(sin α, −cos α), 2α), with α = 0.35. The diagram evaluates the manuscript's threshold formula using tabulated numerical thresholds. It shows values away from equality cases; purple guides identify Sₙ. The formula in Article C states the exact threshold values." %}

<div class="l-body" markdown="1">

## What is proved and what remains open

The program now has three manuscript snapshots, with different proof boundaries. The table reports their author-level status; none has external journal approval.

<div class="se2-ledger" markdown="1">

| Layer | What the current record supports | Remaining boundary |
|---|---|---|
| Conjugate times | Lean verifies the first rotating conjugate time, the noncritical cell count, the exceptional modulus, fourth-order contact, the fixed-cell cube-root splitting and the [ordered large-index law](/articles/se2-conjugate-times/#periodic-velocity-spatial-drift-late-times), including its critical quadratic rate, and [all three bracket endpoint expansions](/articles/se2-conjugate-times/#the-three-bracket-endpoints) | Geometric fold recognition and the variational index theorem retain analytic steps outside the formalization |
| Caustic geometry | Exact fold identities and rational certificates, separate cusp/umbilic arguments and bounded independent differential checks | The global incidence/count conjecture is open; excluded endpoint domains require additional arguments |
| Interval criterion | All 38,400 grid cells are covered outside the four original analytic exclusions. Later analysis covers both corners and a neighborhood of the double flip. | The remaining slab, the full width of the double-flip tube and regimes outside the grid still limit the global count. |
| Inversion and counts | Exact scalar reconstruction and domain-specific count statements in the manuscript, with stored symbolic, interval and ODE checks | General effective onset scales, full publication review and the stated novelty checks remain open |

</div>

The October snapshot listed 304 residual boxes in 32 grid cells. A later audit found that six boxes lay outside the rounded rectangle used to describe the fifth exclusion. Subsequent interval proofs closed all 304 boxes. The earlier percentage estimate for the excluded volume was withdrawn. The [caustic companion](/articles/se2-conjugate-locus/#what-the-interval-run-establishes) distinguishes this grid result from the global incidence question.

The Lean construction starts with the real elliptic integral and its inverse. For every $0<k<1$ it produces the Jacobi functions used by the counting theorem and connects the reduced determinant to the derivative of the endpoint map. A separate interval calculation bounds the scaled profile error at every offset in every cell $n\ge5$ for two moduli. The bounds are $0.5700$ at $k=0.60$ and $0.0481$ at $k=0.95$.

A useful negative finding survives the review: six selected targets have locally certified low-level dips in $N$. Unrestricted unimodality at all real levels is therefore false. These dips occur below one and do not settle the positive-integer-level conjecture. Several historical binary64 finite-difference signs were wrong in precisely these shallow regions; direct derivatives and higher precision were needed to distinguish them.

For incidence counts, the remaining tasks include controlling the width of the bisector slab and the double-flip tube, and treating targets outside the certified box. The interactive figures illustrate individual targets and geodesics.

## The three articles

<div class="se2-articles">
<section class="se2-article"><small>Article A · manuscript candidate · 16-page snapshot</small><h3><a href="/articles/se2-conjugate-times/">All Conjugate Times of Rotating Geodesics</a></h3><p>The bracket mechanism, the critical exception, the Floquet form and the formal proof of the splitting. Includes the full manuscript PDF.</p></section>
<section class="se2-article"><small>Article B · research draft · 31-page snapshot</small><h3><a href="/articles/se2-conjugate-locus/">The Conjugate Locus: Folds, Cusps and Incidence</a></h3><p>The image of the singular set, geometric recognition and the exact scope of the count certificate. Includes the full manuscript PDF.</p></section>
<section class="se2-article"><small>Article C · manuscript candidate · 75-page snapshot</small><h3><a href="/articles/se2-geodesic-counts/">Inverting the Exponential Map and Counting Geodesics</a></h3><p>The scalar inverse, winding classes, exact ray counts and the stated asymptotic regimes. Includes the full manuscript PDF.</p></section>
</div>

All three belong to this single SE(2) program. The model is the standard left-invariant metric with $\theta$ modulo $2\pi$; extensions to other groups, metrics or quotients need their own hypotheses.

## Sources and reproducibility

The project’s source catalogue tracks reading coverage and edition gaps. The October web snapshot used its original 53 records. The expanded catalogue has 775 entries, including three withdrawal notices. Inclusion records a source and its status, without implying that every theorem has been checked.

The downloadable manuscript snapshots and browser figures correspond to research revision `5c304fd` from 27 September 2026. The [source repository](https://github.com/moiseevigor/se2-conjugate-locus) contains the canonical manuscripts, living notebook, formal development and audit records. The [snapshot manifest](/public/research/se2/se2-provenance.json) binds the copied manuscript PDFs, their TeX sources and the browser math module. This publishing pass checks the figures and records current claims; it does not rerun the full interval computation.

[^maxwell]: I. Moiseev and Y. L. Sachkov, *Maxwell strata in the sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 16 (2010). [DOI](https://doi.org/10.1051/cocv/2009004). Establishes the underlying parametrization and Maxwell structure used here.
[^conjugate]: Y. L. Sachkov, *Conjugate and cut time in the sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 16 (2010). [DOI](https://doi.org/10.1051/cocv/2009031). The known first-time bounds and rotating-stratum conjugate results are inputs to the new manuscript.
[^cut]: Y. L. Sachkov, *Cut locus and optimal synthesis in the sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 17 (2011). [DOI](https://doi.org/10.1051/cocv/2010005). The complete minimizing synthesis is an established source result, distinct from post-cut counts.

</div>
