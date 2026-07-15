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

The sign is negative — a gradient *delays* refocusing on this exponential profile
($c_2 = 1 - \tfrac34\beta$ in general: past $\beta = \tfrac43$ the leading effect flips
to acceleration) — because shearing spreads the orbit family
and it needs longer to reconverge.

## Parity: only even powers

The same cancellation repeats at every order. Averaging over $\theta_0$ projects onto the part of
$G$ invariant under reversing the gradient's sign, i.e. $\varepsilon \to -\varepsilon$. So
$G(\varepsilon)$ is **even**:

$$
\delta(\varepsilon) = -c_2\,\varepsilon^2 - c_4\,\varepsilon^4 - c_6\,\varepsilon^6 - \cdots
$$

Measured: $c_2 = 1.0000$, $c_4 = 2.2497 \pm 0.0009$ (the precision experiment below), and the
fitted exponent of $\lvert\delta\rvert$ vs $\varepsilon$ is $2.014$ — even powers, confirmed. The odd (directional) information about the gradient is exactly
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

One profile qualifier, established in the
[companion article](/articles/magnetic-flux-lifts/) (§4) after this appendix was first
written: the leading coefficient $c_2 = 1$ is a property of the *exponential* profile,
not of the statistic. With $\beta = (\ln B)''/[(\ln B)']^2$ the dimensionless profile
curvature at the launch point, the caustic law is $c_2 = 1 - \tfrac34\beta$ —
*derived* by exact second-order perturbation of the Jacobian zero (article Prop. 4.2,
arbitrary **one-dimensional** profiles at leading order) and *measured* (linear profile: $\tfrac74$,
measured $1.7466 \pm 0.0074$; quadratic-profile point $1.3741 \pm 0.0019$ against
$\tfrac{11}{8}$) — while the *proven* period-average law is $c_2 = 1 - \tfrac12\beta$.
The two differ because the conjugate-time = period identification is *refuted off* the
exponential profile (measured, V1) — on the exponential itself it remains Conjecture A,
supported to $10^{-8}$ but unproven (see the note in Step 1 below); the
$-\tfrac14\beta$ gap is an exact symbolic result at this order (computer-assisted). The inversion above therefore carries a profile-calibration factor
$\lvert 1-\tfrac34\beta\rvert^{-1/2}$ (absolute value: past $\beta = \tfrac43$ the
combination flips sign and $\delta$ becomes *positive* — the $\beta = 2$ example lives
in that regime; the blind jet at $\beta = \tfrac43$ itself is now *tested*: the
pipeline returns $c_2 = (-0.7\pm1.4)\times10^{-5}$ there,
`run_f2_beta43_blind.py`) — and, honestly, that is all it carries: at leading order
every probe radius reads the *same* single combination
$(1-\tfrac34\beta)\,\lvert\nabla\ln B\rvert^2$, so the gradient and the curvature are
not separately recoverable from this statistic alone (article §4).

## The quartic coefficient: $9/4$, not $5/2$

The first fit of this series (a two-term model over a wide $\varepsilon$ window) gave
$c_4 = 2.524$, temptingly close to $5/2$. A dedicated precision measurement
(`scripts/run_c4_precision.py`) settles it — and teaches a small lesson about reading
asymptotic series off finite windows. Measuring $z(\varepsilon) = (-\delta/\varepsilon^2 - 1)/
\varepsilon^2 = c_4 + c_6\varepsilon^2 + \cdots$ on a grid reaching down to $\varepsilon = 0.03$
(conjugate times converged to $10^{-6}$, verified across scan resolutions):

$$
c_4 \;=\; 2.2497 \pm 0.0009 \;=\; \tfrac94 \text{ to a part in } 2500.
$$

(Two honesty notes on that fit. The quoted precision is conditional on fixing
$c_2 \equiv 1$, the proven leading order — released, the fit drifts to
$c_4 \approx 2.229$. And the fit's own *quadratic* coefficient is a
model-dependent nuisance on this 10-point grid: $c_6 = 6.18$–$6.57$ across the
fit models in `artifacts/c4_precision.json` — consistent with, but nowhere near
pinning, the exact $25/4 = 6.25$ the closed form below fixes. High-order
coefficients read off finite windows are unstable; the closed form is checked
directly against $\delta$ instead.)

The hypothesis $c_4 = 5/2$ is **refuted** decisively — the measured value sits $0.25$
below it, roughly $280$ times the quoted band, which is a numerical/fit sensitivity
(convergence and fit-model spread), not a sampling error; the wide-window
$2.52$ was the *local slope* of $z$ at $\varepsilon \approx 0.2$ — the $c_6$ term folded in —
not the intercept. So

$$
\delta(\varepsilon) \;=\; -\varepsilon^2 - \tfrac94\,\varepsilon^4 - O(\varepsilon^6),
$$

with $9/4$ a sharp target for the analytic derivation — which then landed, and turned the
whole series into two symbols.

## The closed form

The angular equation integrates in one line: $\dot\theta = e^{\varepsilon x}$ and
$\dot x = \cos\theta$ give $d\dot\theta/d\theta = \varepsilon\cos\theta$, so
$\dot\theta = 1 + \varepsilon(\sin\theta - \sin\theta_0)$ — the system is integrable.

**Step 1 (identification — numerically established, proof open).** The per-angle
refocusing time is taken to be the $\theta$-period,
$t_c(\theta_0) = 2\pi\big[(1-\varepsilon\sin\theta_0)^2 - \varepsilon^2\big]^{-1/2}$.
This identification of the *conjugate time* (the Jacobian zero of D4) with the
*velocity-rotation period* is verified against the Jacobian-zero times to $10^{-8}$
across the tested $\varepsilon$ range, and it has structural support — along a period the
reduced $(x,\theta)$ orbit closes exactly (since $e^{\varepsilon x} = E + \varepsilon\sin\theta$
pins $x$ to $\theta$), so the endpoint at the period depends on the launch data only
through the first integral $E$, collapsing the $\theta_0$-variation onto a single
direction modulo $\dot\gamma$ — **but the last step of the Jacobian argument is not
written, and this remains the appendix's open formal problem.** Everything downstream is
conditional on it exactly as far as "conjugate time" is concerned; as a statement about
the *period average* the next step is unconditional. A measured warning for would-be
provers (V1, article §4): on the *linear* profile the same orbit closure and
$E$-collapse hold, yet $t_c \ne T$ there (relative gap $\propto \varepsilon^2$, up to
$1.2\times10^{-2}$ at $\varepsilon = 0.15$) — so the identification is *refuted
off-exponential*, and on the exponential it remains Conjecture A: if the equality
holds there, it holds for a reason that closure and collapse alone cannot supply.

**Step 2 (the elliptic reduction — proven).** The launch-angle average of
$t_c$ reduces to a complete elliptic integral in closed form. Shift the phase so the
integrand reads $[(1-\varepsilon\cos\theta)^2-\varepsilon^2]^{-1/2}$ and substitute
$t = \tan(\theta/2)$: the radicand factorises *exactly* (checked symbolically),

$$
\big[(1-\varepsilon\cos\theta)^2 - \varepsilon^2\big](1+t^2)^2
= \big[t^2 + (1-2\varepsilon)\big]\,\big[1 + (1+2\varepsilon)\,t^2\big],
$$

so with $p^2 = 1-2\varepsilon$, $q^2 = 1+2\varepsilon$,

$$
\int_0^{2\pi}\!\frac{d\theta}{\sqrt{(1-\varepsilon\sin\theta)^2-\varepsilon^2}}
= 4\!\int_0^{\infty}\!\frac{dt}{\sqrt{(t^2+p^2)(1+q^2t^2)}}
= \frac{4}{q}\!\int_0^{\infty}\!\frac{dt}{\sqrt{(t^2+p^2)(t^2+q^{-2})}} .
$$

Gauss's integral $\int_0^\infty dt/\sqrt{(t^2+a^2)(t^2+b^2)} = K(k)/a$ (with
$a \ge b$, $k^2 = 1-b^2/a^2$; equivalently $\pi/2\,\mathrm{AGM}(a,b)$) applies with
$a = q^{-1} > p$, and the modulus collapses:
$k^2 = 1 - p^2q^2 = 1-(1-2\varepsilon)(1+2\varepsilon) = 4\varepsilon^2$, i.e.
$k = 2\varepsilon$, while the prefactor $(4/q)\cdot q = 4$. Hence the average is
$\tfrac{2}{\pi}K(2\varepsilon)$ exactly (modulus convention,
$K(k)=\int_0^{\pi/2} d\phi/\sqrt{1-k^2\sin^2\phi}$) — the earlier
$O(\varepsilon^{12})$/$10^{-10}$ checks are now confirmations of a derived identity,
and the derivation chain itself is verified numerically to machine precision at each
tested $\varepsilon$ (`scripts/run_t2_reduction_check.py`). The domain is visible in the
factorisation: $p^2 = 1-2\varepsilon > 0$ requires $\varepsilon < 1/2$, and at
$\varepsilon = 1/2$ the integral diverges — the critical gradient.

$$
\boxed{\;\delta(\varepsilon) \;=\; 1 - \frac{2}{\pi}\,K(2\varepsilon),
\qquad 0 \le \varepsilon < \tfrac12,\quad K = K(k),\ k = 2\varepsilon\;}
\qquad
-\delta = \sum_{m\ge1}\Big[\tbinom{2m}{m}2^{-m}\Big]^2 \varepsilon^{2m}
= \varepsilon^2 + \tfrac94\varepsilon^4 + \tfrac{25}{4}\varepsilon^6 + \cdots
$$

verified against the full pipeline to $10^{-10}$ across $\varepsilon = 0.05\ldots0.45$.
The coefficients are squared normalised central binomials — the measured
$c_4 = 9/4$ and the fitted-range $c_6$ (6.2–6.6, model-dependent) are now
corollaries of the exact $c_6 = 25/4$. And $K$'s singularity at unit modulus is
physics: the mean $\theta$-period diverges as $\varepsilon \to 1/2$ — that is the
theorem; its refocusing reading rides on Conjecture A — where the slowest launch angle
($\sin\theta_0 = 1$) has diverging period, and, measured, diverging conjugate time
with it ($t_c \propto 1/\sqrt{1-2\varepsilon}$, verified). The supercritical regime was then measured
directly (`run_r6_supercritical.py`): above $\varepsilon = 1/2$, for exactly the launch
band $\sin\theta_0 \ge (1-\varepsilon)/\varepsilon$ no conjugate point is detected
within the integration window of eight reference periods ($9/64$ angles
at $\varepsilon = 0.52$, $13/64$ at $0.55$ — finite-horizon evidence, not a proof those
orbits never refocus), while every other angle keeps one, still
equal to its period to $5\times10^{-5}$. So the precise statement separates three
claims: **at $\varepsilon = 1/2$ the launch-averaged period diverges — a theorem; the
slowest launch directions stop refocusing on the measured horizon — finite-horizon
evidence; that the launch-averaged *refocusing* time diverges with the period is
Conjecture A's reading; and the rest of the beam keeps refocusing above it** — the
critical gradient opens the caustic band by band, not all at once. See
`docs/T2-closed-form.md` and `scripts/run_p5_series.py`. The uncompressed version of this
whole section — the reduction lemma, both steps with complete proofs where they exist,
the Gauss integral derived rather than cited, and the ledger separating theorem from
conjecture — is §3 of the
[companion article](/articles/magnetic-flux-lifts/).

Two positioning caveats belong right here, not buried in a research doc. **Guiding-centre
theory:** the per-gyration dynamics of a charged particle in a weakly inhomogeneous field is
classical plasma physics, and second-order guiding-centre expansions contain the machinery
that produces the leading $-\varepsilon^2$; what this appendix adds is the *statistic*
(the launch-angle-averaged conjugate-time deficit), the *closed form* for the exponential
profile, and the *critical gradient*. A bounded literature check has now been run
(targeted searches over the adiabatic-invariant and exact-orbit literature — Northrop's
averaging, Littlejohn's Lie-transform reduction, the classical exact-orbit papers where
elliptic integrals do appear): the machinery is ubiquitous, but none of the three
objects above surfaced. That is a search record, not a proof of novelty — the claim is
"not found in a targeted pass", and it is recorded as such.
**Contact invariants:** the deviation of a 3D contact caustic from its nilpotent model is
governed by the Agrachev–Barilari invariants $\chi, \kappa$; whether $c_2 = 1$ here is
those invariants in disguise for the magnetic structure is recorded as an open cross-check,
not settled either way. Both caveats bound the novelty claim; neither touches the formula.

## References

- L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds and
  stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391.
  <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.
- A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J. Dyn.
  Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.
- El-H. Chakir El-Alaoui, J.-P. Gauthier &amp; I. Kupka (1996). "Small sub-Riemannian balls on
  $\mathbb{R}^3$." <em>J. Dyn. Control Syst.</em> 2, 359–421.
</div><!-- /.l-body -->
