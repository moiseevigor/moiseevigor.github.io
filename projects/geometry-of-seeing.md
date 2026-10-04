---
layout: distill
title: "Geometry of Seeing"
subtitle: >
  How the primary visual cortex fills in contours that do not exist —
  a four-part mathematical investigation from Petitot's V1 model to an
  open problem on the cut locus beyond SE(2).
date: 2026-04-26 00:00:00
categories: [projects]
tags: [sub-riemannian, SE2, visual-cortex, elliptic-functions, optimal-control]
description: >
  Project page for the "Geometry of Seeing" series: sub-Riemannian geometry on SE(2),
  Euler's elastica parametrised by Jacobi elliptic functions, Maxwell strata,
  Sachkov's exact cut time, and the open problem beyond SE(2).
permalink: /projects/geometry-of-seeing/
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this project is about</div>
Your brain constructs edges and surfaces that are not physically present in the light
hitting your retina. In Petitot's 2003 neurogeometry model, one idealisation of
<em>modal completion</em> represents oriented cortical states by a contact bundle and
selects connecting curves by a sub-Riemannian or elastica-type variational principle.
The oriented double cover of that bundle is the Lie group SE(2), the group of rigid
motions of the plane. One pendulum governs the extremals of two related problems: the smooth completion
curves are Euler's elastica, parametrised by Jacobi elliptic functions, while the free
geodesics project to their cuspidal siblings. This series develops the full theory from
first principles, up to Sachkov's exact cut time and the question that remains open
beyond SE(2).
</div>

## The Series

</div>

<div class="l-body">
<table style="width:100%; border-collapse:collapse; font-family:var(--sans,sans-serif); font-size:0.9rem; margin:1.5em 0 2em;">
  <thead>
    <tr style="border-bottom:2px solid var(--border,#e0e0e0);">
      <th style="text-align:left; padding:8px 12px; width:3em;">Part</th>
      <th style="text-align:left; padding:8px 12px;">Title</th>
      <th style="text-align:left; padding:8px 12px; width:9em;">Key objects</th>
      <th style="text-align:center; padding:8px 12px; width:6em;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);">1</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/04/25/geometry-of-seeing-visual-cortex-se2/">The Visual Cortex as a Contact Manifold</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">SE(2), contact structure, Kanizsa</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);">2</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/04/28/geometry-of-seeing-elastica-jacobi/">Euler's Elastica and Jacobi Elliptic Functions</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">sn, cn, dn, K(k²), elastica</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);">3</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/05/geometry-of-seeing-maxwell-strata/">Maxwell Strata: When Optimal Paths Fork</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">discrete symmetries, first Maxwell time</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">4</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/15/geometry-of-seeing-cut-time-open-problem/">The Exact Cut Time on SE(2) — and the Open Problem Beyond It</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">cut locus, conjugate time, conjecture</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
  </tbody>
</table>
</div>

<div class="l-body" markdown="1">

## Appendices — Theory Background

The five appendices below build, from first principles, the mathematics
the main parts use without proof.  Each is self-contained, with derivations
and 2–3 interactive figures, and re-uses code from the
[moiseevigor/elliptic](https://github.com/moiseevigor/elliptic)
package.  Read in the order **A1 → A2 → A3 → A4 → A5** — or as needed
from the main parts.

</div>

<div class="l-body">
<table style="width:100%; border-collapse:collapse; font-family:var(--sans,sans-serif); font-size:0.9rem; margin:1.5em 0 2em;">
  <thead>
    <tr style="border-bottom:2px solid var(--border,#e0e0e0);">
      <th style="text-align:left; padding:8px 12px; width:3em;">Part</th>
      <th style="text-align:left; padding:8px 12px;">Title</th>
      <th style="text-align:left; padding:8px 12px; width:11em;">Builds toward</th>
      <th style="text-align:center; padding:8px 12px; width:6em;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A1</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/01/geometry-of-seeing-A1-lie-groups/">Lie Groups, Lie Algebras, and the Exponential Map of SE(2)</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">$\mathfrak{se}(2)$, brackets, $\exp$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A2</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/02/geometry-of-seeing-A2-distributions-contact/">Distributions, Frobenius, and Contact Geometry</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">Chow, contact, V1 horizontality</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A3</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/03/geometry-of-seeing-A3-pmp/">Calculus of Variations and the Pontryagin Maximum Principle</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">Lie–Poisson on $\mathfrak{se}(2)^*$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A4</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/04/geometry-of-seeing-A4-jacobi-elliptic/">Jacobi Elliptic Functions, Elliptic Integrals, and the AGM</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">$\mathrm{sn}, \mathrm{cn}, \mathrm{dn}, K(m)$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A5</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/05/05/geometry-of-seeing-A5-sr-exponential/">The Sub-Riemannian Exponential Map of SE(2)</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">conjugate / cut / Maxwell</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">PUBLISHED</span></td>
    </tr>
  </tbody>
</table>
</div>

<div class="l-body" markdown="1">

## Mathematical Setting

The model rests on three ingredients.

**The state space is an orientation lift.** An idealised orientation-selective cortical
state records retinal position $(x,y)$ and a preferred line orientation $[\theta]$, with
$\theta\sim\theta+\pi$. The biologically natural space is therefore
$\mathbb{R}^2\times\mathbb{P}^1$. For calculation the series uses its oriented double
cover $\mathbb{R}^2\times S^1\cong\mathrm{SE}(2)$, where heading is remembered modulo
$2\pi$; endpoint statements modulo $\pi$ are explicitly projected back to the line bundle.

**The metric is sub-Riemannian.** Not all directions in $\mathrm{SE}(2)$ are allowed
at unit cost. An idealised cortical state at orientation $\theta$ can move cheaply along its preferred
direction $(\cos\theta, \sin\theta)$ and rotate cheaply by $d\theta$, but moving
transversally is forbidden outright. This defines a rank-2 distribution (a contact structure)
with the Pontryagin Hamiltonian

$$H = \frac{1}{2}(p_x \cos\theta + p_y \sin\theta)^2 + \frac{1}{2} p_\theta^2.$$

**One pendulum, two curve families.** Pinning the forward speed turns the problem into
Euler's elastica — the same curves Euler studied in 1744 when minimising the integral of
squared curvature, with $\kappa(s) = 2k\,\mathrm{cn}(s \mid k^2)$ and spatial period
$T = 4K(k^2)$. The free SE(2) geodesics share the pendulum but project to cuspidal
curves; their cut time is $2K(k^2)$ — half the elastica clock (Sachkov 2010–2011).

## Key Results Covered

- **Petitot's contact model** (Part 1): how a neurogeometric model lifts orientation
  data to a contact bundle and formulates one class of completion problems variationally.
- **Complete parametrisation** (Part 2): all three families — the inflectional
  family, the borderline (separatrix) elastica, and the non-inflectional family — written in
  closed form using $\mathrm{sn}, \mathrm{cn}, \mathrm{dn}$.
- **Maxwell strata** (Part 3): the pendulum's reflection group $$(\mathbb{Z}_2)^3$$,
  the mirror-pair tie at one curvature period $$4K(k^2)$$ on the elastica family,
  and the strata bounding the free problem's cut time.
- **The theorem and the open problem** (Part 4): Sachkov's exact cut time
  $$t_{\mathrm{cut}} = 2K(k^2)$$ on the inflectional family — with no conjugate
  points anywhere along it — and the general Maxwell-equals-cut question that
  remains open beyond SE(2).

## Code and Data

The interactive figures use the **elliptic** library — Jacobi elliptic functions and
complete/incomplete integrals implemented without Maple calls, accepting tensors as input.

- GitHub: [moiseevigor/elliptic](https://github.com/moiseevigor/elliptic)
- arXiv: [0807.4731](https://arxiv.org/abs/0807.4731) — Moiseev & Sachkov (2010)
- arXiv: [0903.0727](https://arxiv.org/abs/0903.0727) — Sachkov (2010, 2011)

<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>Core References</h2>
<ol>
  <li>J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact structure." <em>J. Physiology–Paris</em> 97(2–3): 265–309.</li>
  <li>I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399. <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a></li>
  <li>Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 17(2): 293–321. <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a></li>
  <li>G. Citti &amp; A. Sarti (2006). "A cortical based model of perceptual completion in the roto-translation space." <em>J. Math. Imaging Vision</em> 24(3): 307–326.</li>
</ol>
</div>

</div>
