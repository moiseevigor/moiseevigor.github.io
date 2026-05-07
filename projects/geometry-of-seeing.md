---
layout: distill
title: "Geometry of Seeing"
subtitle: >
  How the primary visual cortex fills in contours that do not exist —
  a four-part mathematical investigation from Petitot's V1 model to an
  open problem on the cut locus of SE(2).
date: 2026-04-26 00:00:00
categories: [projects]
tags: [sub-riemannian, SE2, visual-cortex, elliptic-functions, optimal-control]
description: >
  Project page for the "Geometry of Seeing" series: sub-Riemannian geometry on SE(2),
  Euler's elastica parametrised by Jacobi elliptic functions, Maxwell strata,
  and the open problem of the exact cut time.
permalink: /projects/geometry-of-seeing/
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this project is about</div>
Your brain constructs edges and surfaces that are not physically present in the light
hitting your retina. Jean Petitot's 2003 neurogeometry model shows this
<em>modal completion</em> is mathematically equivalent to finding shortest paths on
the Lie group SE(2) — the group of rigid motions of the plane — under a
sub-Riemannian metric. The geodesics of that metric are Euler's elastica, parametrised
by Jacobi elliptic functions. This series develops the full theory from first principles,
culminating in an open problem on the exact cut time.
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
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);">2</td>
      <td style="padding:8px 12px;"><a href="/mathematics/2026/04/28/geometry-of-seeing-elastica-jacobi/">Euler's Elastica and Jacobi Elliptic Functions</a></td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">sn, cn, dn, K(k²), elastica</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);">3</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">Maxwell Strata: When Optimal Paths Fork</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">discrete symmetries, first Maxwell time</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#f5f5f5;color:#999;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">SOON</span></td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">4</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">The Open Problem: Exact Cut Time on SE(2)</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">cut locus, conjugate time, conjecture</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#f5f5f5;color:#999;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">SOON</span></td>
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
    {% comment %}
      Appendices A1–A5 are still drafts (published: false).  In production the
      title cells are plain text so htmlproofer doesn't see broken internal
      links; in development we re-enable the link so locally-rendered drafts
      are reachable from the project index.
    {% endcomment %}
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A1</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">{% if jekyll.environment == 'development' %}<a href="/mathematics/2026/05/01/geometry-of-seeing-A1-lie-groups/">Lie Groups, Lie Algebras, and the Exponential Map of SE(2)</a>{% else %}Lie Groups, Lie Algebras, and the Exponential Map of SE(2){% endif %}</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">$\mathfrak{se}(2)$, brackets, $\exp$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A2</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">{% if jekyll.environment == 'development' %}<a href="/mathematics/2026/05/02/geometry-of-seeing-A2-distributions-contact/">Distributions, Frobenius, and Contact Geometry</a>{% else %}Distributions, Frobenius, and Contact Geometry{% endif %}</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">Chow, contact, V1 horizontality</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A3</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">{% if jekyll.environment == 'development' %}<a href="/mathematics/2026/05/03/geometry-of-seeing-A3-pmp/">Calculus of Variations and the Pontryagin Maximum Principle</a>{% else %}Calculus of Variations and the Pontryagin Maximum Principle{% endif %}</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">Lie–Poisson on $\mathfrak{se}(2)^*$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr style="border-bottom:1px solid var(--border,#e0e0e0);">
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A4</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">{% if jekyll.environment == 'development' %}<a href="/mathematics/2026/05/04/geometry-of-seeing-A4-jacobi-elliptic/">Jacobi Elliptic Functions, Elliptic Integrals, and the AGM</a>{% else %}Jacobi Elliptic Functions, Elliptic Integrals, and the AGM{% endif %}</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">$\mathrm{sn}, \mathrm{cn}, \mathrm{dn}, K(m)$</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:var(--text-muted,#777);font-family:var(--mono);">A5</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">{% if jekyll.environment == 'development' %}<a href="/mathematics/2026/05/05/geometry-of-seeing-A5-sr-exponential/">The Sub-Riemannian Exponential Map of SE(2)</a>{% else %}The Sub-Riemannian Exponential Map of SE(2){% endif %}</td>
      <td style="padding:8px 12px; color:var(--text-muted,#777);">conjugate / cut / Maxwell</td>
      <td style="padding:8px 12px; text-align:center;"><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:2px 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;">DRAFT</span></td>
    </tr>
  </tbody>
</table>
</div>

<div class="l-body" markdown="1">

## Mathematical Setting

The model rests on three ingredients.

**The state space is SE(2).** A neuron in V1 is sensitive not just to position $(x,y)$ in the
visual field but also to the local orientation $\theta$ of the edge it detects.
The lifted state $(x, y, \theta) \in \mathbb{R}^2 \times S^1 \cong \mathrm{SE}(2)$
carries both position and direction. The group law — translation composed with rotation
— is the group of rigid motions of the plane.

**The metric is sub-Riemannian.** Not all directions in $\mathrm{SE}(2)$ are allowed
at unit cost. A neuron at orientation $\theta$ can move cheaply along its preferred
direction $(\cos\theta, \sin\theta)$ and rotate cheaply by $d\theta$, but moving
transversally is penalised. This defines a rank-2 distribution (a contact structure)
with the Pontryagin Hamiltonian

$$H = \frac{1}{2}(p_x \cos\theta + p_y \sin\theta)^2 + \frac{1}{2} p_\theta^2.$$

**Geodesics are Euler's elastica.** The projection of SE(2) geodesics onto the
$(x,y)$-plane satisfies the elastica ODE — the same curves Euler studied in 1744 when
minimising the integral of squared curvature. The curvature along these curves is
$\kappa(s) = 2k\,\mathrm{cn}(s \mid k^2)$, directly expressed through Jacobi's
elliptic cosine, with spatial period $T = 4K(k^2)$.

## Key Results Covered

- **Petitot's contact model** (Part 1): why V1 lifts the image to SE(2) and why
  modal completion is a geodesic problem.
- **Complete parametrisation** (Part 2): all three inflectional families, the
  Euler separatrix, and the non-inflectional family, written in closed form using
  $\mathrm{sn}, \mathrm{cn}, \mathrm{dn}$.
- **Maxwell strata** (Part 3): discrete symmetry group $$\mathbb{Z}_2 \times \mathbb{Z}_2$$,
  the first Maxwell time $$t_{\max}^1 = 2\pi/\sqrt{H}$$, loss of optimality.
- **The open problem** (Part 4): the cut time is bounded above by $$t_{\max}^1$$ but
  the exact value for $k \in (0,1)$ remains unproved.

## Code and Data

The interactive figures use the **elliptic** library — Jacobi elliptic functions and
complete/incomplete integrals implemented without Maple calls, accepting tensors as input.

- GitHub: [moiseevigor/elliptic](https://github.com/moiseevigor/elliptic)
- arXiv: [0807.4731](https://arxiv.org/abs/0807.4731) — Moiseev & Sachkov (2010)
- arXiv: [0903.0727](https://arxiv.org/abs/0903.0727) — Sachkov (2011)

<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>Core References</h2>
<ol>
  <li>J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact structure." <em>J. Physiology–Paris</em> 97(2–3): 265–309.</li>
  <li>I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399. <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a></li>
  <li>Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 17(4): 293–321. <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a></li>
  <li>G. Citti &amp; A. Sarti (2006). "A cortical based model of perceptual completion in the roto-translation space." <em>J. Math. Imaging Vision</em> 24(3): 307–326.</li>
</ol>
</div>

</div>
