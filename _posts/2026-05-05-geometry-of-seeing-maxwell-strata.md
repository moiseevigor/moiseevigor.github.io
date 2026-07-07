---
layout: distill
image: /public/img/posts/geometry-seeing-3.svg
title: "Maxwell Strata: When Optimal Paths Fork"
subtitle: >
  A geodesic can stop being the shortest path long before it stops being locally
  taut. The place where two equal-length geodesics meet is a Maxwell point — and on
  SE(2) those points are forced by a hidden four-element symmetry group. We derive the
  first Maxwell time exactly: it is 4K(k²), the same elliptic period that governs the
  curvature.
date: 2026-05-05 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, maxwell-strata, symmetry, optimal-control, elliptic-functions]
description: >
  How discrete symmetries of the pendulum force Maxwell points on the SE(2)
  sub-Riemannian problem: the Klein four-group ℤ₂×ℤ₂, the σ-symmetric geodesic pair,
  and the exact first Maxwell time t¹_MAX = 4K(k²)/ω₀ — the upper bound on the cut time.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: 3
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
permalink: /mathematics/2026/05/05/geometry-of-seeing-maxwell-strata/
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article covers</div>
Part&nbsp;2 handed us <em>every</em> geodesic of the visual-cortex geometry — the three
families of Euler's elastica, written in closed form with Jacobi elliptic functions.
This part asks the next question: <em>which of them are actually the shortest path?</em>
A curve can be perfectly taut locally and still be beaten by a completely different
curve of the same length. The set of endpoints where that happens — where two distinct
shortest geodesics <em>tie</em> — is the <strong>Maxwell stratum</strong>. We show it is
forced by a four-element symmetry group hiding inside the pendulum equation, and we
compute the first tie exactly: it happens at arc length $4K(k^2)$, the very period that
controlled the curvature in Part&nbsp;2.
</div>

## Two ways to stop being optimal

Recall the problem from Part&nbsp;1. The visual cortex completes a broken contour by finding
the **shortest** horizontal path in $\mathrm{SE}(2)$ between two oriented points — where
"shortest" always means the sub-Riemannian length, the only length the contact geometry
defines. Part&nbsp;2 solved the *local* equations: every candidate path (every **geodesic**)
is an Euler elastica, and its curvature is $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$ for
the generic inflectional family.

But solving the geodesic equation only gives *candidates*. A geodesic is guaranteed to be
the shortest path **only for a while**. As you extend it, one of two things eventually
goes wrong.

<aside id="note-conjugate">
A <strong>conjugate point</strong> is where an infinitesimally-nearby geodesic with the
same starting point reconverges — the point at which the family of geodesics leaving the
origin develops a fold. Past it, the geodesic is no longer even a <em>local</em> minimum:
an arbitrarily small wiggle produces a strictly shorter horizontal curve. Appendix
<a href="/mathematics/2026/05/05/geometry-of-seeing-A5-sr-exponential/">A5</a> builds
conjugate points from Jacobi fields.
</aside>

The first is *local* failure. Past its first <span class="annotated-term" data-note="note-conjugate">conjugate point</span>, a geodesic
is no longer even a local minimum — some tiny perturbation beats it. The **conjugate
time** $t_{\mathrm{conj}}$ is when this first happens.

<aside id="note-cut">
The <strong>cut time</strong> $t_{\mathrm{cut}}$ is the last moment a geodesic is still
globally shortest. For $t < t_{\mathrm{cut}}$ it is <em>the</em> minimiser to its
endpoint; for $t > t_{\mathrm{cut}}$ some other horizontal curve reaches the same endpoint
in less (or equal) length. Always $t_{\mathrm{cut}} \le t_{\mathrm{conj}}$: losing global
optimality is at least as easy as losing local optimality.
</aside>

The second is *global* failure, and it can strike much earlier. A geodesic can be a
perfect local minimum — taut, no shortcut in any thin tube around it — while, somewhere
else in $\mathrm{SE}(2)$, an entirely different geodesic of exactly the same length
reaches the same endpoint. At that endpoint neither curve is uniquely shortest; they
**tie**. The moment of the first tie is the <span class="annotated-term" data-note="note-cut">cut time</span> $t_{\mathrm{cut}}$,
and it is what we actually care about: beyond it, the "completed contour" the cortex would
draw is no longer well-defined by minimality alone.

<div class="callout theorem">
<div class="callout-title">The two clocks</div>
Along a geodesic from the origin, optimality can fail two ways:

$$t_{\mathrm{cut}} \;\le\; t_{\mathrm{conj}}.$$

<strong>Conjugate</strong> ($t_{\mathrm{conj}}$): loss of <em>local</em> minimality, a
fold of the geodesic family. <strong>Cut</strong> ($t_{\mathrm{cut}}$): loss of
<em>global</em> minimality, the first endpoint reachable equally fast by a different
geodesic. This article is about the second clock — and the symmetric mechanism that sets
it.
</div>

## The Maxwell mechanism

Why would two *different* geodesics ever reach the same point with the same length? For a
generic geometry, they might not — you would have to solve transcendental equations and
hope for a coincidence. But $\mathrm{SE}(2)$ is not generic. It is loaded with symmetry,
and symmetry manufactures coincidences on purpose.

<aside id="note-maxwell">
A <strong>Maxwell point</strong> is a point reached by two <em>distinct</em>
length-minimising geodesics from the same origin, with <em>equal</em> length. The set of
all such points is the <strong>Maxwell stratum</strong>. The name entered optimal control
from catastrophe theory's <em>Maxwell convention</em> — an echo of J. C. Maxwell's
equal-area rule in thermodynamics: a system sits in its global minimum, and where two
minima <em>tie</em>, the choice jumps.
</aside>

Here is the mechanism. Suppose the problem has a symmetry — a transformation $\varepsilon$
of the geodesics that (i) preserves length and the starting point, but (ii) sends a
geodesic $\gamma$ to a *genuinely different* geodesic $\varepsilon(\gamma)$. If, at some
time $t$, the two happen to arrive at the **same** endpoint,

$$\gamma(t) \;=\; \varepsilon(\gamma)(t), \qquad \gamma \neq \varepsilon(\gamma),$$

then that endpoint is a <span class="annotated-term" data-note="note-maxwell">Maxwell point</span> by construction — two distinct equal-length
geodesics tie there. No luck required; the symmetry forces it. So the whole problem of
locating the cut time reduces to a much more tractable one: **find the symmetries, then
find where a geodesic first meets its own symmetric image.**

## The four symmetries of the pendulum

The symmetries live not in the plane but in the **pendulum** that Part&nbsp;2 derived. Recall
the reduction: the costate angle obeys

$$\ddot\varphi + \sin\varphi = 0, \qquad E = \tfrac12\dot\varphi^2 - \cos\varphi,$$

and the inflectional family is the librating pendulum, $-1 < E < 1$, oscillating between
turning points $\pm\varphi_{\max}$. This pendulum has two obvious discrete symmetries, and
they generate a third.

- **Time reversal** $\varepsilon^1 : s \mapsto -s$. Run the pendulum backwards. Because the
  equation has no friction, a reversed solution is still a solution.
- **Reflection** $\varepsilon^2 : \varphi \mapsto -\varphi$. Flip the pendulum left-right.
  Since $\sin(-\varphi) = -\sin\varphi$, the equation is unchanged, so this too maps
  solutions to solutions. Downstairs in the plane it is the mirror $y \mapsto -y$, which
  flips the sign of the curvature: $\kappa \mapsto -\kappa$.
- **The composite** $\varepsilon^3 = \varepsilon^1\!\circ\varepsilon^2$: reverse time *and*
  reflect.

<aside id="note-klein">
The <strong>Klein four-group</strong> $\mathbb{Z}_2 \times \mathbb{Z}_2 = \{e,
\varepsilon^1, \varepsilon^2, \varepsilon^3\}$ is the smallest non-cyclic group. Every
non-identity element is its own inverse ($(\varepsilon^i)^2 = e$), and the product of any
two distinct ones is the third. It is exactly the symmetry group of a non-square rectangle
— two independent reflections and their composite half-turn.
</aside>

Together with the identity, these close up into a group under composition: each element
undoes itself, and any two of them compose to the third. That is precisely the
<span class="annotated-term" data-note="note-klein">Klein four-group</span> $\mathbb{Z}_2 \times \mathbb{Z}_2$ — the exact discrete
symmetry group Moiseev–Sachkov (2010) identified for this problem.

| Element | Action on pendulum | Action on plane curve | Fixed set in the phase plane $(\varphi, \dot\varphi)$ |
|:--------|:-------------------|:----------------------|:------------------------------------------------------|
| $e$ | identity | identity | everything |
| $\varepsilon^1$ | $s \mapsto -s$ (time reversal) | reverse traversal | the axis $\dot\varphi = 0$ — the turning points |
| $\varepsilon^2$ | $\varphi \mapsto -\varphi$ (mirror) | mirror $y \mapsto -y$, $\kappa \mapsto -\kappa$ | the origin alone — it pairs instants, pins none |
| $\varepsilon^3$ | both | mirrored, traversed backwards | the axis $\varphi = 0$ — the bottom crossings |

(In the phase plane, $\varepsilon^1$ is the reflection across the horizontal axis;
$\varepsilon^3$ — which flips $\varphi$ but, reversing time too, preserves $\dot\varphi$ —
is the reflection across the vertical axis; and $\varepsilon^2$, flipping both, is the
half-turn about the origin.)

What makes a symmetry *useful* is its fixed set downstairs, in $\mathrm{SE}(2)$ itself. If
the geodesic $\gamma$ crosses a configuration that $\varepsilon$ leaves fixed, then at that
instant its partner $\varepsilon(\gamma)$ passes through the *same* configuration — a tie,
provided the partner is a genuinely different curve. For the mirror $\varepsilon^2$, acting
downstairs by $(x, y, \theta) \mapsto (x, -y, -\theta)$, that fixed set is the launch axis
with heading along it: $\{\,y = 0,\ \theta \in \{0, \pi\}\,\}$. The instants where a
geodesic crosses this set are its candidate Maxwell times — and the next section computes
the first one exactly.

</div><!-- /.l-body -->

<!-- Figure&nbsp;1: pendulum phase portrait with the ℤ₂×ℤ₂ reflection axes -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>highlight symmetry
        <select id="sym-pick">
          <option value="none" selected>— none —</option>
          <option value="e1">ε¹ : time reversal (s → −s)</option>
          <option value="e2">ε² : mirror (φ → −φ)</option>
          <option value="e3">ε³ : both composed</option>
        </select>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        one libration orbit (blue) and the chosen symmetry's geometry (orange)
      </span>
    </div>
    <svg id="fig-sym" style="width:100%;height:360px;"></svg>
  </div>
  <figcaption>
    <strong>Figure&nbsp;1. The Klein four-group acting on the pendulum.</strong>
    Phase plane of $\ddot\varphi + \sin\varphi = 0$: horizontal axis is the pendulum angle
    $\varphi$ (radians), vertical axis its rate $\dot\varphi$. The bold blue closed loop is
    one libration orbit (one inflectional geodesic, energy $E = 2k^2 - 1$); faint loops are
    neighbouring orbits. Choose a group element to see its geometry (orange): $\varepsilon^1$
    reflects the phase plane across the horizontal axis $\dot\varphi = 0$, pinning the two
    turning points; $\varepsilon^3$ reflects across the vertical axis $\varphi = 0$, pinning
    the two bottom-crossings; $\varepsilon^2$ flips both signs — the half-turn about the
    origin — pinning no instant but pairing every phase point with its antipode (an example
    pair is marked). The libration orbit is carried to itself by all three: that is what
    makes them symmetries of the geodesic family.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The first fork, computed exactly

Take the symmetry that turns out to bind first: the mirror $\varepsilon^2$. Apply it to
an inflectional geodesic $\gamma_A$ with curvature $\kappa_A(s) = +2k\,\mathrm{cn}(s\mid
k^2)$. The image $\gamma_B = \varepsilon^2(\gamma_A)$ is the geodesic with the opposite
curvature, $\kappa_B(s) = -2k\,\mathrm{cn}(s\mid k^2)$ — a *different* geodesic (it bends
the other way) but with identical length at every arc length $s$. This is the
**$\sigma$-symmetric pair**: two mirror-image curves leaving the origin.

They start together. When do they first meet again? In the plane, the reflection acts by
$y \mapsto -y$, so $\gamma_B(s) = \bigl(x_A(s),\, -y_A(s),\, -\theta_A(s)\bigr)$. As points
of $\mathrm{SE}(2)$ — position **and** heading — the two coincide exactly when

$$y_A(s) = 0 \quad\text{and}\quad \theta_A(s) \equiv 0 \pmod{2\pi}.$$

Part&nbsp;2 gave the closed form (via Appendix A5) for the inflectional geodesic:

$$y_A(s) = 2k\bigl(1 - \mathrm{cn}(s\mid k^2)\bigr) \;\ge\; 0.$$

<aside>
Since $\mathrm{cn} \le 1$, the height $y_A(s) = 2k(1-\mathrm{cn})$ never dips below zero —
it only *touches* it. The two curves do not cross and re-cross; they kiss the mirror axis
at isolated instants, and the first kiss with matching heading is the first Maxwell time.
</aside>

This is the whole calculation in one line. Since $\mathrm{cn}(s\mid k^2) \le 1$ with
equality only at $s = 0, 4K(k^2), 8K(k^2), \dots$, the height $y_A(s)$ returns to zero
**first** at

$$s = 4K(k^2),$$

exactly one spatial period of the curvature. The heading returns with it: Part&nbsp;2 gave
$\theta_A(s) = 2\arcsin\!\bigl(k\,\mathrm{sn}(s\mid k^2)\bigr)$, which vanishes wherever
$\mathrm{sn}$ does — at $s = 0,\, 2K,\, 4K, \dots$ (it never winds; the heading just
oscillates within $\pm 2\arcsin k$). At $s = 2K(k^2)$ the heading is zero but the height is
*maximal*, $y_A = 4k$; the first instant both conditions hold together is $s = 4K(k^2)$. So
the mirror pair re-coincides — position and heading at once — for the first time at
$s = 4K(k^2)$, for **every** modulus $k$.

<div class="callout theorem">
<div class="callout-title">First Maxwell time (inflectional family)</div>

$$\boxed{\; t_{\mathrm{MAX}}^{1}(k) \;=\; \frac{4K(k^2)}{\omega_0}, \;}$$

where $K(k^2)$ is the complete elliptic integral of the first kind and $\omega_0$ is the
linearised pendulum frequency (equal to $1$ in the unit-energy normalisation, so
$t_{\mathrm{MAX}}^1 = 4K(k^2)$ in arc length). This is the <em>same</em> $4K(k^2)$ that set
the curvature's spatial period in Part&nbsp;2 — now reappearing as a <em>time</em>: the first
instant a geodesic ties with its mirror twin.
</div>

The identity is worth pausing on. In Part&nbsp;2, $4K(k^2)$ was a fact about one curve — how far
you travel before its curvature pattern repeats. Here it is a fact about *two* curves — how
far you travel before a geodesic and its symmetric partner arrive at the same place at the
same time. The two roles of the elliptic period coincide, and that coincidence is the
technical heart of the Maxwell-strata theorem.

</div><!-- /.l-body -->

<!-- Figure&nbsp;2: the σ-pair fork, meeting at s = 4K(k²) -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$k$
        <input type="range" id="fork-k" min="20" max="97" value="70" step="1">
        <span class="ctrl-val" id="fork-k-val">0.70</span>
      </label>
      <label>arc length $s$
        <input type="range" id="fork-s" min="10" max="100" value="55" step="1">
        <span class="ctrl-val" id="fork-s-val">—</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        blue: $\kappa = +2k\,\mathrm{cn}$ &nbsp;·&nbsp; red: mirror $\kappa = -2k\,\mathrm{cn}$
      </span>
    </div>
    <svg id="fig-fork" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure&nbsp;2. The σ-symmetric pair forks and re-meets.</strong>
    The blue geodesic ($\kappa = +2k\,\mathrm{cn}$) and its mirror image (red, dashed,
    $\kappa = -2k\,\mathrm{cn}$) leave the origin (black dot) together. Drag $s$ to extend
    them. The vertical guide on the height plot (right) shows $y_A(s) = 2k(1-\mathrm{cn})$,
    the gap to the mirror axis; its first return to zero — marked, at $s = 4K(k^2)$ — is the
    <strong>first Maxwell time</strong>, where the two equal-length curves arrive at the same
    $\mathrm{SE}(2)$ point (orange). The slider's arc-length readout turns orange once you
    pass it. Horizontal axis of the left panel: plane $x$; right panel: arc length $s$
    against height $y_A$ (both in the geodesic's natural units, $\omega_0 = 1$).
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## From the first tie to the cut time

The mirror $\varepsilon^2$ gave one family of ties, at $4K(k^2)$. The other group
elements give their own Maxwell strata — $\varepsilon^1$ and $\varepsilon^3$ contribute
further coincidences — but a direct check (Moiseev–Sachkov 2010) shows none of them fires
earlier than the $\varepsilon^2$ tie for the inflectional family. So the *first* Maxwell
time, across the whole group, is the one we computed.

<div class="callout theorem">
<div class="callout-title">Maxwell strata bound the cut time</div>
The cut time is at most the first Maxwell time, because a tie destroys uniqueness of the
minimiser:

$$t_{\mathrm{cut}}(k) \;\le\; t_{\mathrm{MAX}}^{1}(k) \;=\; \frac{4K(k^2)}{\omega_0}.$$

Moiseev–Sachkov (2010) prove the full description of the Maxwell strata for the
$\mathrm{SE}(2)$ sub-Riemannian problem via this $\mathbb{Z}_2\times\mathbb{Z}_2$ action.
</div>

That inequality is the punchline of Part&nbsp;3 — and a cliffhanger. It says the geodesic
*cannot* remain globally shortest past $4K(k^2)$; the mirror twin catches it there at the
latest. What it does **not** say is whether the cut happens *exactly* there or strictly
earlier — whether the bound is tight.

For the inflectional family it turns out to be tight: $t_{\mathrm{cut}} = t_{\mathrm{MAX}}^1$
exactly, so the elliptic period $4K(k^2)$ *is* the cut time. Proving that — pinning the cut
locus down precisely, handling the non-inflectional and separatrix families, and confronting
what remains genuinely open near the degenerate boundary — is
[Part&nbsp;4](/mathematics/2026/05/15/geometry-of-seeing-cut-time-open-problem/).

## Summary

- A geodesic loses optimality two ways: **locally** at its conjugate point, **globally** at
  its cut point, with $t_{\mathrm{cut}} \le t_{\mathrm{conj}}$.
- Global optimality dies at a **Maxwell point** — where two distinct equal-length geodesics
  tie — and ties are *forced* by symmetry, not luck.
- The inflectional pendulum carries a **Klein four-group** $\mathbb{Z}_2 \times \mathbb{Z}_2$
  of symmetries (time reversal, reflection, composite).
- The reflection's $\sigma$-symmetric pair first re-meets at $s = 4K(k^2)$, giving the exact
  **first Maxwell time** $t_{\mathrm{MAX}}^1 = 4K(k^2)/\omega_0$ — the same elliptic period
  as the curvature.
- Hence $t_{\mathrm{cut}} \le 4K(k^2)/\omega_0$. Whether equality holds is Part&nbsp;4.

</div><!-- /.l-body -->

<!-- ── References ── -->
<div class="d-article" style="padding-top:0;">
<div class="l-body d-references">
<h2>References</h2>
<ol>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on
    the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>
  </li>
  <li>
    Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the
    group of motions of a plane." <em>ESAIM: COCV</em> 16(4): 1018–1039.
  </li>
  <li>
    Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian problem
    on the group of motions of a plane." <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>
  </li>
  <li>
    A. A. Agrachev &amp; Yu. L. Sachkov (2004). <em>Control Theory from the Geometric
    Viewpoint.</em> Springer. Chapter 17 — symmetries of the exponential map and Maxwell
    strata.
  </li>
  <li>
    Yu. L. Sachkov (2008). "Maxwell strata in the Euler elastic problem."
    <em>Journal of Dynamical and Control Systems</em> 14(2): 169–234 — the same
    reflection-symmetry method applied to Euler's elastica.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── Figure&nbsp;1: pendulum phase portrait + ℤ₂×ℤ₂ symmetry axes ───────────────
function drawSym() {
  const svg = document.getElementById('fig-sym');
  if (!svg) return;
  const pick = (document.getElementById('sym-pick') || {}).value || 'none';

  const W = svg.clientWidth || 720, H = 360;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const pad = { l: 44, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const xSc = d3.scaleLinear([-Math.PI * 1.15, Math.PI * 1.15], [pad.l, pad.l + iW]);
  const ySc = d3.scaleLinear([-1.7, 1.7], [pad.t + iH, pad.t]);

  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  // axes
  g.append('line').attr('x1', pad.l).attr('x2', pad.l + iW)
    .attr('y1', ySc(0)).attr('y2', ySc(0)).attr('stroke', '#ccc').attr('stroke-width', 1);
  g.append('line').attr('x1', xSc(0)).attr('x2', xSc(0))
    .attr('y1', pad.t).attr('y2', pad.t + iH).attr('stroke', '#ccc').attr('stroke-width', 1);
  [-1, 0, 1].forEach(n => {
    const x = xSc(n * Math.PI);
    g.append('text').attr('x', x).attr('y', ySc(0) + 15).attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa')
      .text(n === 0 ? '0' : n === 1 ? 'π' : '-π');
  });
  g.append('text').attr('x', pad.l + iW - 4).attr('y', ySc(0) + 14).attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#888').text('φ');
  g.append('text').attr('x', xSc(0) + 6).attr('y', pad.t + 12)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#888').text('φ̇');

  // faint background libration orbits
  [0.35, 0.6, 0.82].forEach(k => {
    const E = 2 * k * k - 1;
    const pm = 2 * Math.asin(Math.min(k, 0.999));
    const up = [], N = 160;
    for (let i = 0; i <= N; i++) {
      const phi = -pm + 2 * pm * i / N;
      const v = 2 * (E + Math.cos(phi));
      if (v >= 0) up.push([xSc(phi), ySc(Math.sqrt(v))]);
    }
    const down = up.slice().reverse().map(([x]) => {
      const phi = xSc.invert(x); const v = 2 * (E + Math.cos(phi));
      return [x, ySc(-Math.sqrt(Math.max(v, 0)))];
    });
    g.append('path').attr('d', d3.line()([...up, ...down]) + 'Z')
      .attr('fill', 'none').attr('stroke', '#c9d8ec').attr('stroke-width', 1);
  });

  // the highlighted orbit (k = 0.82)
  const k = 0.82, E = 2 * k * k - 1, pm = 2 * Math.asin(k);
  function orbit() {
    const up = [], N = 220;
    for (let i = 0; i <= N; i++) {
      const phi = -pm + 2 * pm * i / N;
      const v = 2 * (E + Math.cos(phi));
      if (v >= 0) up.push([phi, Math.sqrt(v)]);
    }
    const down = up.slice().reverse().map(([phi]) => {
      const v = 2 * (E + Math.cos(phi)); return [phi, -Math.sqrt(Math.max(v, 0))];
    });
    return [...up, ...down];
  }
  const O = orbit();
  g.append('path').attr('d', d3.line().x(p => xSc(p[0])).y(p => ySc(p[1]))(O) + 'Z')
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.4);

  // symmetry axis + image orbit + fixed markers
  const axis = { color: '#e65100', dash: '6,4' };
  function drawAxisV(xv) {   // vertical axis φ = xv
    g.append('line').attr('x1', xSc(xv)).attr('x2', xSc(xv))
      .attr('y1', pad.t).attr('y2', pad.t + iH)
      .attr('stroke', axis.color).attr('stroke-width', 1.4).attr('stroke-dasharray', axis.dash).attr('opacity', 0.8);
  }
  function drawAxisH(yv) {   // horizontal axis φ̇ = yv
    g.append('line').attr('x1', pad.l).attr('x2', pad.l + iW)
      .attr('y1', ySc(yv)).attr('y2', ySc(yv))
      .attr('stroke', axis.color).attr('stroke-width', 1.4).attr('stroke-dasharray', axis.dash).attr('opacity', 0.8);
  }
  function mark(phi, phid) {
    g.append('circle').attr('cx', xSc(phi)).attr('cy', ySc(phid)).attr('r', 4.5)
      .attr('fill', '#e65100').attr('stroke', '#fff').attr('stroke-width', 1.2);
  }

  let caption = 'pick a symmetry to see its geometry in the phase plane';
  if (pick === 'e1') {          // time reversal: (φ, φ̇) → (φ, −φ̇); axis φ̇ = 0
    drawAxisH(0);
    mark(-pm, 0); mark(pm, 0);
    caption = 'ε¹ reflects across φ̇ = 0 — the orbit meets the axis at its two turning points';
  } else if (pick === 'e2') {   // mirror at fixed time: (φ, φ̇) → (−φ, −φ̇) = half-turn
    const phiStar = pm * 0.55;
    const vStar = Math.sqrt(Math.max(2 * (E + Math.cos(phiStar)), 0));
    g.append('line').attr('x1', xSc(phiStar)).attr('y1', ySc(vStar))
      .attr('x2', xSc(-phiStar)).attr('y2', ySc(-vStar))
      .attr('stroke', axis.color).attr('stroke-width', 1.2).attr('stroke-dasharray', axis.dash).attr('opacity', 0.8);
    g.append('circle').attr('cx', xSc(0)).attr('cy', ySc(0)).attr('r', 5)
      .attr('fill', 'none').attr('stroke', '#e65100').attr('stroke-width', 1.6);
    mark(phiStar, vStar); mark(-phiStar, -vStar);
    caption = 'ε² is the half-turn about the origin — it pairs each phase point with its antipode';
  } else if (pick === 'e3') {   // mirror + reversal: (φ, φ̇) → (−φ, φ̇); axis φ = 0
    drawAxisV(0);
    const vTop = Math.sqrt(2 * (E + 1));
    mark(0, vTop); mark(0, -vTop);
    caption = 'ε³ reflects across φ = 0 — the orbit crosses the axis at the swing bottom (max speed)';
  }

  g.append('text').attr('x', pad.l).attr('y', pad.t + 12)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#666').text(caption);
}

// ── Figure&nbsp;2: σ-symmetric pair fork, meeting at s = 4K(k²) ─────────────────
function forkGeodesic(k, sMax, N) {
  // κ(s) = 2k·cn(s|k²);  dθ = κ ds, dx = cosθ ds, dy = sinθ ds  (midpoint rule)
  const m = k * k, ds = sMax / N;
  let x = 0, y = 0, th = 0;
  const pts = [{ x, y, th, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const kap = 2 * k * ellipj(s + ds / 2, m).cn;
    const tm = th + 0.5 * kap * ds;
    x += Math.cos(tm) * ds; y += Math.sin(tm) * ds; th += kap * ds;
    pts.push({ x, y, th, s: s + ds });
  }
  return pts;
}

function drawFork() {
  const svg = document.getElementById('fig-fork');
  if (!svg) return;
  const k = parseFloat(document.getElementById('fork-k').value) / 100;
  document.getElementById('fork-k-val').textContent = k.toFixed(2);

  const Km = ellipticK(k * k);
  const sMax1 = 4 * Km;                     // first Maxwell time
  const sMaxFull = 1.6 * sMax1;             // integrate a bit past it
  const sSlider = document.getElementById('fork-s');
  const s = (parseFloat(sSlider.value) / 100) * sMaxFull;
  const sValEl = document.getElementById('fork-s-val');
  sValEl.textContent = s.toFixed(2);
  sValEl.style.color = (s >= sMax1) ? '#e65100' : '';

  const N = 1400;
  const A = forkGeodesic(k, sMaxFull, N);
  const B = A.map(p => ({ x: p.x, y: -p.y, th: -p.th, s: p.s }));  // mirror ε²
  const idx = Math.max(1, Math.round(s / sMaxFull * N));
  const Atr = A.slice(0, idx + 1), Btr = B.slice(0, idx + 1);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  const split = W * 0.56, m = { l: 26, r: 22, t: 16, b: 30 };

  // left panel: the two plane curves
  const all = Atr.concat(Btr);
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  const xE = [Math.min(...xs), Math.max(...xs)], yE = [Math.min(...ys), Math.max(...ys)];
  const cx = (xE[0] + xE[1]) / 2, cy = (yE[0] + yE[1]) / 2;
  const rng = Math.max(xE[1] - xE[0], yE[1] - yE[0]) / 2 + 0.3;
  const plotW = split - m.l - m.r, asp = plotW / (H - m.t - m.b);
  const xR = rng * Math.max(asp, 1), yR = rng * Math.max(1 / asp, 1);
  const xL = d3.scaleLinear([cx - xR, cx + xR], [m.l, split - m.r]);
  const yL = d3.scaleLinear([cy - yR, cy + yR], [H - m.b, m.t]);

  g.append('line').attr('x1', m.l).attr('x2', split - m.r).attr('y1', yL(0)).attr('y2', yL(0))
    .attr('stroke', '#eee').attr('stroke-width', 1);      // mirror axis y = 0
  g.append('path').attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(Atr))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);
  g.append('path').attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(Btr))
    .attr('fill', 'none').attr('stroke', '#b71c1c').attr('stroke-width', 2.2).attr('stroke-dasharray', '5,3');
  g.append('circle').attr('cx', xL(0)).attr('cy', yL(0)).attr('r', 4).attr('fill', '#333');

  // if we've reached/passed the first Maxwell time, mark the meeting point
  if (s >= sMax1) {
    const meet = A[Math.round(sMax1 / sMaxFull * N)];
    g.append('circle').attr('cx', xL(meet.x)).attr('cy', yL(meet.y)).attr('r', 6)
      .attr('fill', '#e65100');
    g.append('circle').attr('cx', xL(meet.x)).attr('cy', yL(meet.y)).attr('r', 10)
      .attr('fill', 'none').attr('stroke', '#e65100').attr('stroke-width', 1.2).attr('opacity', 0.5);
  } else {
    const eA = Atr[Atr.length - 1], eB = Btr[Btr.length - 1];
    g.append('circle').attr('cx', xL(eA.x)).attr('cy', yL(eA.y)).attr('r', 4.5).attr('fill', '#1565c0');
    g.append('circle').attr('cx', xL(eB.x)).attr('cy', yL(eB.y)).attr('r', 4.5).attr('fill', '#b71c1c');
  }
  g.append('text').attr('x', m.l).attr('y', m.t + 10)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#888').text('plane curves');

  // right panel: height y_A(s) = 2k(1 − cn) and its first return to zero
  const yMax = 2 * k * 2 * 1.05;   // 2k(1 − cn) ∈ [0, 4k]
  const xR2 = d3.scaleLinear([0, sMaxFull], [split + m.l, W - m.r]);
  const yR2 = d3.scaleLinear([0, Math.max(yMax, 0.2)], [H - m.b, m.t + 10]);

  g.append('line').attr('x1', split).attr('x2', split).attr('y1', m.t).attr('y2', H - m.b)
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1);
  g.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(xR2).ticks(6))
    .call(s2 => s2.selectAll('text').attr('font-family', 'var(--sans,sans-serif)').attr('font-size', 10));

  const hCurve = A.map(p => ({ s: p.s, h: 2 * k * (1 - ellipj(p.s, k * k).cn) }));
  g.append('path').attr('d', d3.line().x(p => xR2(p.s)).y(p => yR2(p.h))(hCurve))
    .attr('fill', 'none').attr('stroke', '#0d3a78').attr('stroke-width', 2);

  // first-Maxwell marker at s = 4K — label sits at the bottom, flipping to the
  // left of its guide near the right edge, so it never collides with the
  // panel title in the top band.
  g.append('line').attr('x1', xR2(sMax1)).attr('x2', xR2(sMax1)).attr('y1', m.t + 22).attr('y2', H - m.b)
    .attr('stroke', '#e65100').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
  g.append('circle').attr('cx', xR2(sMax1)).attr('cy', yR2(0)).attr('r', 4).attr('fill', '#e65100');
  const lblRight = xR2(sMax1) < W - m.r - 110;
  g.append('text')
    .attr('x', xR2(sMax1) + (lblRight ? 6 : -6))
    .attr('y', H - m.b - 10)
    .attr('text-anchor', lblRight ? 'start' : 'end')
    .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#e65100')
    .text(`4K(k²) = ${sMax1.toFixed(2)}`);

  // current-s guide
  g.append('line').attr('x1', xR2(s)).attr('x2', xR2(s)).attr('y1', m.t + 22).attr('y2', H - m.b)
    .attr('stroke', '#1565c0').attr('stroke-width', 1).attr('stroke-dasharray', '2,3').attr('opacity', 0.7);
  g.append('text').attr('x', split + m.l).attr('y', m.t + 6)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#444')
    .text('height to mirror axis:  y_A(s) = 2k(1 − cn)');
}

// ── boot ──────────────────────────────────────────────────────────────────
function wire() {
  const p = document.getElementById('sym-pick');
  if (p) p.addEventListener('change', drawSym);
  ['fork-k', 'fork-s'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawFork);
  });
  drawSym();
  drawFork();
  window.addEventListener('resize', () => { drawSym(); drawFork(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();

})();
</script>
