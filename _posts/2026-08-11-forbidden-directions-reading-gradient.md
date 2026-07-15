---
layout: distill
title: "Reading the Field Gradient from the Caustic"
subtitle: >
  The growth vector tells you a magnetic field is there and where it vanishes. The
  <em>caustic</em> tells you more: how the field is changing. This post measures the
  deviation of the magnetic refocusing pattern from the flat model and finds it reads the
  field gradient — δ = −ε² on the exponential profile, invertible there as a leading-order
  estimator; general one-dimensional profiles carry the calibration factor 1 − 3β/4 — the
  first time this caustic statistic has been checked against an analytic field whose
  gradient is known independently.
date: 2026-08-11 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-fields, caustics, conjugate-locus, gradient, moduli]
image: /public/img/posts/forbidden-directions-3.svg
description: >
  Part 3 of the Forbidden Directions series: the nilpotent-deviation statistic of the
  magnetic contact structure, the dimensionless gradient ε = |grad ln B| r_L, the measured
  exponential-profile law δ = −ε² + O(ε⁴) with its parity and calibrated inversion
  (profile factor 1 − 3β/4 for general one-dimensional profiles), and what it means
  physically.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 3
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-08-forbidden-directions-magnetic-contact %}">Part 2</a> built the
magnetic contact geometry and read the field's <em>strength and vanishing order</em> off the
growth vector. But the growth vector is a single number about how a ball grows; it cannot see
<em>which way</em> the field leans. That finer information is in the shape of the caustic. Here
we extract it, and find it reads the field gradient — exactly on the exponential profile,
and through the calibrated combination $(1-\tfrac34\beta)\lvert\nabla\ln B\rvert^2$ for
general one-dimensional profiles.
</div>

## The idea: deviation from the flat model

Zoom into the magnetic geometry at a point $q_0$ and it looks like the flat Heisenberg model
with the constant field $B_0 = B(q_0)$ — that is the tangent cone (Part 2). But zoom out a
little and the real field *varies*, and the geometry departs from Heisenberg. The **caustic**
— the pattern where a family of Larmor orbits refocuses — captures that departure precisely.

For the flat model the orbits refocus at exactly the Larmor period $t_c = 2\pi/(B_0\lvert w\rvert)$. For
the real, varying field they refocus a little differently, and the **nilpotent deviation**

$$
\delta \;=\; \Big\langle\, 1 - \frac{|w|\,B_0}{2\pi}\, t_c(\theta_0, w) \,\Big\rangle_{\theta_0}
$$

measures the fractional departure, averaged over the launch direction $\theta_0$. It is zero
for a uniform field, by construction. The question is what it becomes when the field has a
gradient.

## The only dimensionless knob

Put a clean, constant gradient on the field: $B = B_0\,e^{g x}$, the unique family with
*exactly* constant $\nabla\ln B = g$. A Larmor orbit has one length scale, its radius
$r_L = 1/(B_0\lvert w\rvert)$, so there is exactly one dimensionless combination the deviation can depend
on:

$$
\varepsilon \;=\; g\,r_L \;=\; |\nabla\ln B|\times(\text{Larmor radius}).
$$

The gradient seen across one orbit. Everything must be a function of $\varepsilon$ alone — in
fact a *theorem*: rescaling lengths by $r_L$ turns the geodesic equations into a system that
depends on $g$ and $w$ only through $\varepsilon$. So the content is the *shape* of that
function, and its symmetry.

## The result

Measured across sixteen $(g, w)$ pairs — which, by the $\varepsilon$-only reduction
above, collapse onto seven distinct values of $\varepsilon$ (the plot shows those seven;
different $(g,w)$ pairs sharing an $\varepsilon$ land on the same point, which is itself a
check of the reduction) spanning nearly two decades:

$$
\boxed{\;\delta(\varepsilon) \;=\; 1 - \tfrac{2}{\pi}\,K(2\varepsilon)
\;=\; -\,\varepsilon^{2} \;-\; \tfrac{9}{4}\,\varepsilon^{4} \;-\; \tfrac{25}{4}\,\varepsilon^{6} \;-\;\cdots\;}
$$

with $K$ the complete elliptic integral of the first kind — an **exact period-average
law** (its reading as the *caustic's* law rides on the period identification below,
verified to $10^{-8}$ but formally open), found by a
precision measurement (which pinned $c_4 = 2.2497 \pm 0.0009 = 9/4$ — conditional on
fixing the proven leading coefficient $c_2 \equiv 1$; released, the fit drifts to
$2.229$ — refuting the $5/2$ a coarser fit once suggested) and then derived: the angular dynamics integrates in one line,
the per-angle refocusing time is identified with a pendulum-like period (an identification
verified to $10^{-8}$; its formal Jacobian step is the one open link — Appendix D5), and
its launch-angle average is *proven* to be
$\tfrac{2}{\pi}K(2\varepsilon)$ — modulus convention $K(k)$, $k = 2\varepsilon$, valid for
$\varepsilon < \tfrac12$ — by an exact tangent-half-angle factorisation (Appendix D5),
and verified against the geodesic code to $10^{-10}$. The
coefficients are squared normalised central binomials, only even powers — and $K$'s
singularity is physics: at the critical gradient $\varepsilon = 1/2$ the *mean*
$\theta$-period diverges (that is the theorem; reading it as the mean *refocusing*
time rides on the period identification above), and measured above it, the slowest
launch directions show no conjugate point within the integration window —
finite-horizon evidence (appendix D5, and Part 7 for the full referee-grade chain). The figure shows $\lvert\delta\rvert$
against $\varepsilon$ on log–log: a clean line of slope 2. The complete proofs — the
tangent-half-angle factorisation, the Gauss integral, and the precise statement of what
remains conjectural — are written out in the companion article
[*Growth Vectors and Caustics of Magnetic Flux Lifts*](/articles/magnetic-flux-lifts/), §3.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-delta">
  <div style="text-align:center;margin-bottom:0.4em;">
    <button class="fig-toggle active" id="dl-b-loglog">|δ| vs ε (log–log)</button>
    <button class="fig-toggle" id="dl-b-series">δ/ε² vs ε² (the even series)</button>
  </div>
  <div id="fd-delta" style="text-align:center;"></div>
  <figcaption>
    <strong>The caustic reads the gradient — the exponential-profile experiment P1;
    the coefficient-one inversion shown here is that profile's calibration, not
    general.</strong> <em>Left view:</em> the
    magnitude of the nilpotent deviation $\lvert\delta\rvert$ versus the dimensionless gradient
    $\varepsilon = \lvert\nabla\ln B\rvert\,r_L$, log–log; the measured points (dots) lie on the dashed
    slope-2 guide, so $\lvert\delta\rvert\propto\varepsilon^{2}$. <em>Right view:</em> $\delta/\varepsilon^{2}$
    against $\varepsilon^{2}$ hits $-1$ at the origin with initial slope $-9/4$ (dashed
    tangent) and bends below it as the $\varepsilon^{6}$ term wakes up (dotted curve) — the
    series $\delta = -\varepsilon^{2} - \tfrac94\varepsilon^{4} - O(\varepsilon^{6})$, only
    even powers. The relation inverts on this profile:
    $\lvert\nabla\ln B\rvert = \sqrt{\lvert\delta\rvert}/r_L$ (general 1D profiles carry
    $\lvert 1-\tfrac34\beta\rvert^{-1/2}$, undefined at $\beta = \tfrac43$). Data:
    <code>research/preferred-directions/artifacts/p1_results.json</code>,
    <code>c4_precision.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("fd-delta");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  // measured (eps, |delta|) from p1_results.json
  const EPS = [0.003125, 0.00625, 0.0125, 0.025, 0.05, 0.10, 0.20];
  const ADEL = [9.766e-6, 3.9066e-5, 1.56305e-4, 6.2588e-4, 2.51416e-3, 1.023145e-2, 4.405634e-2];
  const W = 560, H = 340, mL = 62, mR = 20, mT = 18, mB = 46;
  const x0 = mL, x1 = W - mR, y0 = mT, y1 = H - mB;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };

  function loglog() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const lxmin = Math.log10(0.0025), lxmax = Math.log10(0.26);
    const lymin = Math.log10(5e-6), lymax = Math.log10(0.08);
    const X = v => x0 + (Math.log10(v) - lxmin) / (lxmax - lxmin) * (x1 - x0);
    const Y = v => y1 - (Math.log10(v) - lymin) / (lymax - lymin) * (y1 - y0);
    [1e-1, 1e-2, 1e-3, 1e-4, 1e-5].forEach(gy => {
      svg.appendChild(el("line", { x1: x0, y1: Y(gy), x2: x1, y2: Y(gy), stroke: "#eee" }));
      svg.appendChild(el("text", { x: x0 - 6, y: Y(gy) + 3, "text-anchor": "end", "font-size": 9.5, fill: "#999", "font-family": MONO }, "1e" + Math.round(Math.log10(gy))));
    });
    [0.003, 0.01, 0.03, 0.1].forEach(gx => {
      svg.appendChild(el("line", { x1: X(gx), y1: y0, x2: X(gx), y2: y1, stroke: "#eee" }));
      svg.appendChild(el("text", { x: X(gx), y: y1 + 15, "text-anchor": "middle", "font-size": 10, fill: "#999", "font-family": MONO }, gx));
    });
    // slope-2 guide: |delta| = eps^2
    svg.appendChild(el("line", { x1: X(0.0028), y1: Y(0.0028 * 0.0028), x2: X(0.22), y2: Y(0.22 * 0.22),
      stroke: "#dd6b20", "stroke-width": 1, "stroke-dasharray": "4 3", opacity: 0.6 }));
    svg.appendChild(el("text", { x: X(0.06), y: Y(0.06 * 0.06) - 8, "font-size": 11, fill: "#dd6b20", "font-family": MONO }, "slope 2"));
    const pts = EPS.map((e, i) => `${X(e).toFixed(1)},${Y(ADEL[i]).toFixed(1)}`).join(" ");
    svg.appendChild(el("polyline", { points: pts, fill: "none", stroke: "#2b6cb0", "stroke-width": 2 }));
    EPS.forEach((e, i) => svg.appendChild(el("circle", { cx: X(e), cy: Y(ADEL[i]), r: 3, fill: "#2b6cb0" })));
    svg.appendChild(el("text", { x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS }, "ε = |∇ ln B| · r_L   (log)"));
    svg.appendChild(el("text", { x: 15, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS, transform: `rotate(-90 15 ${(y0 + y1) / 2})` }, "|δ|   (log)"));
  }

  function series() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // delta/eps^2 vs eps^2 : tangent at 0 has slope -c4 = -9/4; the eps^6 term bends below
    const xs = EPS.map(e => e * e);
    const ys = EPS.map((e, i) => -ADEL[i] / (e * e));      // = delta/eps^2 (negative)
    const xmax = 0.045, ymin = -1.16, ymax = -0.98;
    const X = v => x0 + v / xmax * (x1 - x0);
    const Y = v => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
    [-1.0, -1.05, -1.10, -1.15].forEach(gy => {
      svg.appendChild(el("line", { x1: x0, y1: Y(gy), x2: x1, y2: Y(gy), stroke: "#eee" }));
      svg.appendChild(el("text", { x: x0 - 6, y: Y(gy) + 3, "text-anchor": "end", "font-size": 10, fill: "#999", "font-family": MONO }, gy.toFixed(2)));
    });
    // tangent delta/eps^2 = -(1 + 9/4 eps^2), and the exact series with c6 = 25/4
    svg.appendChild(el("line", { x1: X(0), y1: Y(-1.0), x2: X(xmax), y2: Y(-(1 + 2.25 * xmax)),
      stroke: "#dd6b20", "stroke-width": 1.5, "stroke-dasharray": "5 4", opacity: 0.7 }));
    let d6 = "";
    for (let u = 0; u <= xmax + 1e-9; u += xmax / 40)
      d6 += (d6 ? " L" : "M") + ` ${X(u).toFixed(1)} ${Y(-(1 + 2.25 * u + 6.25 * u * u)).toFixed(1)}`;
    svg.appendChild(el("path", { d: d6, fill: "none", stroke: "#dd6b20", "stroke-width": 1,
      "stroke-dasharray": "1.5 3", opacity: 0.8 }));
    xs.forEach((xx, i) => { if (xx <= xmax) svg.appendChild(el("circle", { cx: X(xx), cy: Y(ys[i]), r: 3.2, fill: "#2b6cb0" })); });
    svg.appendChild(el("circle", { cx: X(0), cy: Y(-1.0), r: 3, fill: "none", stroke: "#dd6b20", "stroke-width": 1.5 }));
    svg.appendChild(el("text", { x: X(0) + 6, y: Y(-1.0) - 6, "font-size": 11, fill: "#dd6b20", "font-family": MONO }, "→ −1 (c₂=1)"));
    svg.appendChild(el("text", { x: X(xmax) - 4, y: Y(-(1 + 2.25 * xmax)) + 14, "text-anchor": "end", "font-size": 10.5, fill: "#dd6b20", "font-family": MONO }, "tangent −9/4 (c₄)"));
    svg.appendChild(el("text", { x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS }, "ε²"));
    svg.appendChild(el("text", { x: 15, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS, transform: `rotate(-90 15 ${(y0 + y1) / 2})` }, "δ / ε²"));
  }

  const bl = document.getElementById("dl-b-loglog"), bs = document.getElementById("dl-b-series");
  bl.onclick = () => { loglog(); bl.classList.add("active"); bs.classList.remove("active"); };
  bs.onclick = () => { series(); bs.classList.add("active"); bl.classList.remove("active"); };
  loglog();
})();
</script>

<div class="l-body" markdown="1">

## What it says, physically

Three things, each checkable and each a little surprising.

**The caustic measures the gradient, invertibly — for this profile class.** From the deviation
of the refocusing pattern you recover the field gradient:
$\lvert\nabla\ln B\rvert = \lvert 1-\tfrac34\beta\rvert^{-1/2}\,\sqrt{\lvert\delta\rvert}/r_L$
to leading order, **valid only for $\beta \ne \tfrac43$** — at $\beta = \tfrac43$ the
leading statistic is blind (tested: F2) and this estimator is undefined. The profile
factor is $1$ exactly on exponential-class jets ($\beta = 0$),
which is the case this post measures. The
shape of a caustic is not decoration — it is a readout. One honest qualifier, established
after this post was first drafted: the leading coefficient is $1$ only for
exponential-class profiles. The caustic law is $c_2 = 1 - \tfrac34\beta$ with
$\beta = (\ln B)''/\lvert(\ln B)'\rvert^2$ the dimensionless profile curvature at the
launch point — first measured (linear profile: $\tfrac74$, found $1.7466 \pm 0.0074$),
then *derived* by exact second-order perturbation of the caustic itself — while the
*proven period-average* law has $\tfrac12$ in place of $\tfrac34$: the two differ
because the conjugate-time = period identification *fails off* the exponential profile
(measured — this same experiment discovered it); on the exponential it agrees to
$10^{-8}$ but remains Conjecture A, not a theorem. So the inversion carries a
profile-calibration factor — and only that: at leading order every probe radius reads
the same single combination $(1-\tfrac34\beta)\lvert\nabla\ln B\rvert^2$, so gradient
and curvature are not separately recoverable from this statistic alone.
The derivations and the experiment are
[the companion article's §4](/articles/magnetic-flux-lifts/).

**A gradient delays refocusing — where $1-\tfrac34\beta > 0$** (the exponential class
included; past $\beta = \tfrac43$ the derived leading-order effect flips to *acceleration*).
$\delta<0$ means $t_c$ exceeds the Larmor period: orbits in a
graded field take *longer* to refocus than in a uniform one. The gradient shears the family of
orbits apart, and they need more time to come back together — at second order in the gradient.

**Only even powers appear — proven to all orders on the exponential profile, at first
order in general.** On the exponential profile the closed form is a series in
$\varepsilon^2$; for general one-dimensional profiles the *first* odd order provably
averages away ($\tau_1 = 2\pi\sin\theta_0$ is odd — article Prop. 4.2), while the
vanishing of higher odd orders remains open (O6). The mechanism: a gradient points
*somewhere*, and that directional (odd) part cancels when you
average over all starting directions, leaving a signal that depends only on the gradient's
*magnitude*. Which is also the honest limitation: this averaged $\delta$ reads the one
calibrated combination $(1-\tfrac34\beta)\lvert\nabla\ln B\rvert^2$ — on the exponential
profile that is $\lvert\nabla\ln B\rvert^2$ alone — and not the gradient's direction. The direction is in the $\theta_0$-*dependence* we averaged away — a readout still
on the table.

## Why this result matters beyond magnetism

The nilpotent-deviation statistic $\delta$ is not new here (this series uses the
launch-angle average; the sibling program's appendix C6 introduced it as a $w$-average —
same object, different marginal). It is the central object of the
[caustics-to-groups]({% post_url 2026-07-22-caustics-to-groups-inverse-map %}) program, where it
separated one abstract group from another. But there it was only ever checked against structures
that program generated itself. **This is the first time $\delta$ has been measured against an
independently known target** — an analytic field $B_0 e^{gx}$ whose gradient is fixed in
advance rather than generated by the statistic's own machinery (a *constructed* ground truth,
not an observed one) — and it passed exactly,
with a sharp coefficient and the predicted parity. A statistic invented to tell Lie groups apart
turns out to read a magnetic field gradient.

## The honest edge

$\delta$ reads one profile-calibrated gradient combination at a smooth point. The real prize is at the **nulls**,
where the field vanishes and the interesting plasma physics happens. The growth vector detects
those nulls but cannot tell their *type* (Part 4). The open question — the one that decides
whether this whole framing *refines* the standard tools or merely agrees with them — is whether a
caustic invariant like $\delta$ recovers the null type. Part 4 sets that question up honestly and
does not oversell the answer.

## Glossary

- **Nilpotent deviation $\delta$** — the fractional departure of the real refocusing time from the
  flat-model (Larmor) period, averaged over launch direction; zero for a uniform field.
- **Larmor radius $r_L = 1/(B_0\lvert w\rvert)$** — the size of a Larmor orbit; the geometry's one length scale.
- **Dimensionless gradient $\varepsilon = \lvert\nabla\ln B\rvert\,r_L$** — the fractional change of the field
  across one orbit; the leading knob. General one-dimensional profiles also enter through
  the curvature $\beta = (\ln B)''/[(\ln B)']^2$ (the $1-\tfrac34\beta$ calibration) and,
  beyond leading order, higher jets.
- **Parity** — on the exponential profile $\delta$ is even in $\varepsilon$ (closed form);
  in general the first odd order provably cancels under the launch average, higher odd
  orders open (O6).

## References

- L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds and
  stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391.
  <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.
- A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J. Dyn.
  Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.

</div><!-- /.l-body -->
