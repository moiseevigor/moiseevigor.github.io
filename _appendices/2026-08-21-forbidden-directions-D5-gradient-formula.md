---
layout: distill
title: "Appendix D5 — The Nilpotent-Deviation Gradient Formula"
subtitle: >
  Why δ = −ε². The dilation symmetry that makes the deviation a function of one variable, the
  perturbation argument that fixes the leading power, the parity that kills the odd terms — and
  the precision measurement that pins the next coefficient at exactly 9/4 (refuting the 5/2 a
  coarser fit once suggested).
date: 2026-08-21 09:00:00
categories: [mathematics]
tags: [sub-riemannian, conjugate-locus, perturbation, dilation, moduli, magnetic-fields]
description: >
  Companion appendix to the Forbidden Directions series: the dilation rescaling that reduces the
  nilpotent deviation to a universal function of ε = |grad ln B| r_L, the perturbation expansion
  giving δ = −ε² + O(ε⁴), the parity argument, the inversion, and the open analytic question about
  the quartic coefficient.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: D5
permalink: /mathematics/2026/08/21/forbidden-directions-D5-gradient-formula/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The structure behind
<a href="{% post_url 2026-08-11-forbidden-directions-reading-gradient %}">Part 3</a>'s result
$\delta = -\varepsilon^2 + O(\varepsilon^4)$: the dilation theorem that guarantees a universal
curve, the perturbation argument that fixes the leading behaviour, the parity that forces even
powers, the inversion, and the open analytic question.
</div>

## The one dimensionless variable

Put a constant logarithmic gradient on the field, $B = B_0\,e^{gx}$, so $\nabla\ln B = g$ exactly.
The nilpotent deviation is

$$
\delta \;=\; \Big\langle\, 1 - \tfrac{|w|B_0}{2\pi}\,t_c(\theta_0, w) \,\Big\rangle_{\theta_0},
$$

the fractional departure of the refocusing time from the Larmor period, averaged over launch
direction (Part 3). It can depend on $g$, $B_0$, and $w$ — but only in one combination, and this
is a **theorem**, not a fit.

## The dilation theorem

Rescale lengths by the Larmor radius $r_L = 1/(B_0\lvert w\rvert)$: set $X = x/r_L$, $\tau = t/r_L$. The
geodesic system of Appendix D4 becomes

$$
\frac{dX}{d\tau} = \cos\theta,\qquad \frac{d\theta}{d\tau} = e^{\,\varepsilon X},
\qquad \varepsilon = g\,r_L = |\nabla\ln B|\cdot r_L .
$$

Every trace of $g$, $B_0$, $w$ has collapsed into the single dimensionless group $\varepsilon$ —
the gradient seen across one Larmor orbit. Hence $t_c = r_L\,F(\varepsilon)$ for a universal
function $F$, and $\delta = 1 - F(\varepsilon)/2\pi =: G(\varepsilon)$. So the "data collapse"
observed in Part 3 (deviations at fixed $\varepsilon$ agreeing to $0.00\%$ across different
$(g,w)$) is *forced* by this rescaling — it validates the numerics but is not itself the physics.
The physics is the shape of $G$.

## The leading power, by perturbation

Expand the flow in small $\varepsilon$. At $\varepsilon = 0$ the orbit is the exact Larmor circle,
$\delta = 0$. Turning on $\varepsilon$ shears neighbouring orbits: the turning rate
$e^{\varepsilon X} \approx 1 + \varepsilon X + \tfrac12\varepsilon^2 X^2 + \cdots$ perturbs the
refocusing time. The first correction to $t_c$ is linear in the perturbation of the turning rate
and hence in $\varepsilon$, but it is *odd in the launch direction* $\theta_0$ (a gradient points
somewhere) and therefore **cancels under the $\theta_0$-average**. The surviving leading term is
second order:

$$
\delta = -\,c_2\,\varepsilon^2 + O(\varepsilon^4),\qquad c_2 = 1 \ \text{(measured } 0.9996).
$$

The sign is negative — a gradient *delays* refocusing — because shearing spreads the orbit family
and it needs longer to reconverge.

## Parity: only even powers

The same cancellation repeats at every order. Averaging over $\theta_0$ projects onto the part of
$G$ invariant under reversing the gradient's sign, i.e. $\varepsilon \to -\varepsilon$. So
$G(\varepsilon)$ is **even**:

$$
\delta(\varepsilon) = -c_2\,\varepsilon^2 - c_4\,\varepsilon^4 - c_6\,\varepsilon^6 - \cdots
$$

Measured: $c_2 = 1.0000$, $c_4 = 2.2497 \pm 0.0009$ (the precision experiment below), and the
fitted exponent of $|\delta|$ vs $\varepsilon$ is $2.014$ — even powers, confirmed. The odd (directional) information about the gradient is exactly
what the average discards; recovering it from the $\theta_0$-*dependence* of $t_c$ (rather than its
mean) would read the gradient's *direction*, a readout the series leaves on the table.

## The inversion

To leading order the relation is monotone and invertible:

$$
|\nabla\ln B| \;=\; \frac{\sqrt{|\delta|}}{r_L}\,\big(1 + O(\varepsilon^2)\big).
$$

Given the conjugate locus of the magnetic geometry at a point, you recover the field's fractional
gradient. This is the sense in which the caustic *reads* the field, and it is the first
demonstration of the nilpotent-deviation statistic against a physical ground truth.

## The quartic coefficient: $9/4$, not $5/2$

The first fit of this series (a two-term model over a wide $\varepsilon$ window) gave
$c_4 = 2.524$, temptingly close to $5/2$. A dedicated precision measurement
(`scripts/run_c4_precision.py`) settles it — and teaches a small lesson about reading
asymptotic series off finite windows. Measuring $z(\varepsilon) = (-\delta/\varepsilon^2 - 1)/
\varepsilon^2 = c_4 + c_6\varepsilon^2 + \cdots$ on a grid reaching down to $\varepsilon = 0.03$
(conjugate times converged to $10^{-6}$, verified across scan resolutions):

$$
c_4 \;=\; 2.2497 \pm 0.0009 \;=\; \tfrac94 \text{ to a part in } 2500,
\qquad c_6 \approx 6.4.
$$

The hypothesis $c_4 = 5/2$ is **refuted** (it sits $280\sigma$ away); the wide-window
$2.52$ was the *local slope* of $z$ at $\varepsilon \approx 0.2$ — the $c_6$ term folded in —
not the intercept. So

$$
\delta(\varepsilon) \;=\; -\varepsilon^2 - \tfrac94\,\varepsilon^4 - O(\varepsilon^6),
$$

with $9/4$ now a sharp target for the analytic derivation: a perturbation of the
pendulum-like $\theta$-equation $\ddot\theta = \varepsilon\,\dot X\,e^{\varepsilon X}$ around
the circular orbit should produce it in closed form ($c_6$, measured $\approx 6.4$, is the
next check — note $25/4 = 6.25$ sits inside the measurement's model spread, suggesting the
odd-square pattern $c_{2m} = (2m-1)^2/4$ for $m \ge 2$; that is a conjecture the derivation
must confirm or kill, not a claim). The derivation itself remains open — but it now has a
number to hit.

## References

- L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds and
  stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391.
  <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.
- A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J. Dyn.
  Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.
- El-H. Chakir El-Alaoui, J.-P. Gauthier &amp; I. Kupka (1996). "Small sub-Riemannian balls on
  $\mathbb{R}^3$." <em>J. Dyn. Control Syst.</em> 2, 359–421.
</div><!-- /.l-body -->
