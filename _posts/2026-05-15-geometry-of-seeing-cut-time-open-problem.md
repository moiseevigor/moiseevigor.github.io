---
layout: distill
image: /public/img/posts/geometry-seeing-4.svg
title: "The Open Problem: Exact Cut Time on SE(2)"
subtitle: >
  For the visual cortex's geometry, when does a completed contour stop being the unique
  shortest one? Part 3 bounded that moment by the first Maxwell time. Here we ask whether
  the bound is exact — separating what Sachkov proved, what is verified only numerically,
  and what remains genuinely open at the degenerate boundary.
date: 2026-05-15 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, cut-locus, conjugate-time, open-problem, optimal-control]
description: >
  The cut time of the SE(2) sub-Riemannian problem: why it equals the first Maxwell time
  4K(k²)/ω₀ for inflectional geodesics, the structure of the cut locus, and the open
  frontier — degenerate strata, the separatrix limit, and the general Maxwell-equals-cut
  conjecture for left-invariant sub-Riemannian problems.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: 4
arxiv: "0903.0727"
coauthors: "Yu. L. Sachkov"
comments: true
permalink: /mathematics/2026/05/15/geometry-of-seeing-cut-time-open-problem/
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article covers</div>
This is where the series arrives at the edge of what is known. Part 3 proved an
<em>inequality</em>: a geodesic cannot stay globally shortest past the first Maxwell time
$4K(k^2)/\omega_0$. The natural question — is that bound <em>exact</em>? — is where
rigour, numerics, and open conjecture part ways. We give the honest map: the cut time and
cut locus of $\mathrm{SE}(2)$ that Sachkov <em>proved</em> (2010–2011), the parts confirmed
only by computation, and the frontier that stays open — the degenerate strata, the
separatrix limit, and the general "Maxwell equals cut" conjecture that $\mathrm{SE}(2)$ is
the headline example of. No hand-waving about what is settled and what is not.
</div>

## Where Part 3 left us

The story so far, in one line: the visual cortex completes a contour by the **globally
shortest** horizontal path in $\mathrm{SE}(2)$, and such a path stays uniquely shortest
only up to its **cut time** $t_{\mathrm{cut}}$. Part 3 gave two facts about it.

$$t_{\mathrm{cut}}(k) \;\le\; t_{\mathrm{conj}}(k), \qquad
  t_{\mathrm{cut}}(k) \;\le\; t_{\mathrm{MAX}}^1(k) = \frac{4K(k^2)}{\omega_0}.$$

The first is general (global failure precedes local). The second came from symmetry: the
$\sigma$-mirror twin ties the geodesic at $4K(k^2)$ at the latest. Two upper bounds. The
whole question of this article is whether either is achieved — and if so, which one binds.

## The conjugate time never binds first

Start with the two clocks side by side. For the inflectional family, Sachkov's Jacobi-field
analysis (Appendix [A5](/mathematics/2026/05/05/geometry-of-seeing-A5-sr-exponential/))
gives the first conjugate time, and comparing it to the Maxwell time settles their order.

<aside id="note-conj-time">
The <strong>conjugate time</strong> is the first arc length at which the sub-Riemannian
exponential map becomes singular — geometrically, where the fan of geodesics leaving the
origin first folds. It marks loss of <em>local</em> optimality. For SE(2) it is computed
from the second variation of the length functional along the geodesic.
</aside>

The result is clean: the <span class="annotated-term" data-note="note-conj-time">conjugate time</span> comes at or after the Maxwell
time, uniformly in $k$,

$$t_{\mathrm{conj}}(k) \;\ge\; t_{\mathrm{MAX}}^1(k) = \frac{4K(k^2)}{\omega_0}.$$

So of the two upper bounds, the **Maxwell** one is always the tighter. The geodesic loses
*global* optimality (ties with its twin) before it ever loses *local* optimality (folds).
That is exactly what you expect from a highly symmetric space: symmetry ends optimality
early, well before the geometry would have folded on its own. Figure 1 puts the two curves
on the same axes.

</div><!-- /.l-body -->

<!-- Figure 1: the two clocks — Maxwell vs conjugate time vs k -->
<figure class="l-middle">
  <div class="fig-box">
    <svg id="fig-clocks" style="width:100%;height:340px;"></svg>
  </div>
  <figcaption>
    <strong>Figure 1. The Maxwell time binds before the conjugate time.</strong>
    Horizontal axis: modulus $k \in (0, 1)$ of the inflectional geodesic (dimensionless).
    Vertical axis: arc length (units $\omega_0 = 1$). Blue: the first Maxwell time
    $t_{\mathrm{MAX}}^1 = 4K(k^2)$, plotted exactly — and proven to equal the cut time.
    Green (dashed): the first conjugate time, drawn <em>schematically</em> to show the one
    fact that matters here — it lies at or above the Maxwell curve everywhere (Sachkov's
    bound $t_{\mathrm{conj}} \ge t_{\mathrm{MAX}}^1$), so it never determines the cut; the
    green curve is an indicative envelope, not its exact closed form. Both diverge as
    $k \to 1$ (the separatrix / Euler-spiral limit), where the elliptic period $K(k^2) \to
    \infty$. The shaded region below the blue curve is where the geodesic is <em>the</em>
    unique shortest path; crossing blue is the cut.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## What is proved: the cut time and the cut locus

Because the Maxwell bound is the binding one and it is *achieved*, the cut time of the
inflectional family is known exactly.

<div class="callout theorem">
<div class="callout-title">Cut time, inflectional family (Sachkov 2010–2011)</div>

$$\boxed{\; t_{\mathrm{cut}}(k) \;=\; t_{\mathrm{MAX}}^1(k) \;=\; \frac{4K(k^2)}{\omega_0}. \;}$$

The first Maxwell tie is not merely an upper bound — it is where global optimality actually
ends. The elliptic period $4K(k^2)$, which began life in Part 2 as the spatial period of the
curvature, is therefore the exact cut time of the visual-cortex geodesics.
</div>

<aside id="note-cut-locus">
The <strong>cut locus</strong> $\mathrm{Cut}$ is the set of all cut points — every endpoint
$g \in \mathrm{SE}(2)$ at which some minimising geodesic first loses uniqueness. It is the
sub-Riemannian analogue of the "ridge" you get in a Riemannian manifold (e.g. the antipodal
point on a sphere). Knowing it <em>is</em> the optimal synthesis: for every target, it tells
you when the shortest path stops being unique.
</aside>

More than the number, Sachkov (2011) determined the whole <span class="annotated-term" data-note="note-cut-locus">cut locus</span> — the set of *all* cut points in
$\mathrm{SE}(2)$ — and with it the **optimal synthesis**: for any target configuration, which
geodesic is the minimiser and up to what length. Projected to the plane, the cut points
swept out as $k$ varies trace a sharp caustic-like curve; Figure 2 draws it. This is a
complete solution for the principal family — the visual-cortex completion problem is, for
generic inputs, *solved*.

</div><!-- /.l-body -->

<!-- Figure 2: the projected cut locus, traced by first-Maxwell endpoints -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>trace up to $|k|$
        <input type="range" id="cut-kmax" min="10" max="97" value="97" step="1">
        <span class="ctrl-val" id="cut-kmax-val">0.97</span>
      </label>
      <label>show geodesics
        <input type="checkbox" id="cut-geo" checked>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        each curve ends at its cut point $s = 4K(k^2)$
      </span>
    </div>
    <svg id="fig-cut" style="width:100%;height:420px;"></svg>
  </div>
  <figcaption>
    <strong>Figure 2. The cut locus, drawn in the plane.</strong>
    Faint curves: inflectional geodesics leaving the origin (black dot), one per signed
    modulus $k$ — blue for $k>0$ (curving one way), red for $k<0$ (the mirror). Each is drawn
    up to its own cut time $s = 4K(k^2)$, and its endpoint (dot) is a projected cut point.
    The bold orange curve threading those endpoints is the <strong>projected cut locus</strong>
    — the set of planar positions where the sub-Riemannian shortest path first stops being
    unique. Its cusps are where the cut locus meets the conjugate caustic. Axes: plane $x, y$
    in the geodesic's natural units. Drag $|k|$ to grow the family; toggle the geodesics to
    see the locus alone.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## What is not yet fully settled

So if $\mathrm{SE}(2)$ is solved, where is the "open problem" of the title? It lives in
three places, and honesty requires naming them precisely rather than gesturing at mystery.

### 1. The degenerate strata

The clean derivation used the *inflectional* family and the reflection $\varepsilon^2$. The
full extremal set also contains the **non-inflectional** family (rotating pendulum) and the
**separatrix** (the Euler spiral, $k \to 1$), plus the **abnormal** extremals. For these,
the Maxwell-stratum bookkeeping is more delicate: the symmetry group acts with degeneracies,
some strata collide, and the tidy "first tie at $4K(k^2)$" argument needs case-by-case care.
Sachkov's papers handle them, but the analysis is intricate and not reducible to the
one-line calculation that works for the generic case.

<aside id="note-abnormal">
An <strong>abnormal extremal</strong> is a candidate geodesic on which the Pontryagin
Hamiltonian degenerates (the multiplier $\nu = 0$ of Part 2). On $\mathrm{SE}(2)$ they exist
but are never strictly optimal — yet ruling them out rigorously, uniformly, is part of what
makes a complete proof hard, and it is the standard sticking point in higher-dimensional
sub-Riemannian problems.
</aside>

### 2. The separatrix limit

As $k \to 1^-$, the period $4K(k^2) \to \infty$: the cut time runs off to infinity and the
inflectional geodesic degenerates into the Euler spiral. Statements that are uniform in $k$
on $(0,1)$ can fail to extend cleanly to the closed endpoint. The behaviour of the cut locus
*at* the <span class="annotated-term" data-note="note-abnormal">abnormal</span>/separatrix boundary — the seam between families — is where numerical
confidence outruns fully uniform proof, and it is the concrete residue behind the "complete
proof in all degenerate cases remains open" caveat we flagged back in Part 1.

### 3. The general conjecture

Zoom out from $\mathrm{SE}(2)$ and the real open problem appears. Across left-invariant
sub-Riemannian problems on Lie groups, the same pattern recurs: **the cut time equals the
first Maxwell time**, $t_{\mathrm{cut}} = t_{\mathrm{MAX}}^1$. It has been *proved
case-by-case* — the Heisenberg group, $\mathrm{SO}(3)$, $\mathrm{SL}(2)$, the Engel group,
and $\mathrm{SE}(2)$ here — each a separate, hard paper. What is missing is a **general
theorem**: structural conditions on a symmetric sub-Riemannian problem guaranteeing that
Maxwell strata capture the entire cut locus, with no exotic non-symmetric cut points hiding
elsewhere. That theorem does not exist. Each new group is still, to date, its own
project.

<div class="callout open-problem">
<div class="callout-title">Open Problem</div>
Is there a general theorem — a checkable condition on a left-invariant sub-Riemannian
structure — under which the cut time equals the first Maxwell time
$t_{\mathrm{cut}} = t_{\mathrm{MAX}}^1$ for <em>every</em> geodesic, with the Maxwell strata
exhausting the cut locus? It is <em>conjectured</em> and verified numerically for a growing
list of groups (Heisenberg, $\mathrm{SO}(3)$, $\mathrm{SL}(2)$, $\mathrm{SE}(2)$), but proved
only one group at a time. $\mathrm{SE}(2)$ — the visual cortex's geometry — is the richest
worked example, not the general answer.
</div>

## Status of the problem, honestly

<div class="l-body" markdown="1">

| Claim | Status |
|:------|:-------|
| $t_{\mathrm{cut}} = 4K(k^2)/\omega_0$ for the inflectional family | **Proved** (Sachkov 2010–2011) |
| $t_{\mathrm{conj}} \ge t_{\mathrm{MAX}}^1$, so Maxwell binds first | **Proved** |
| Full cut locus & optimal synthesis on $\mathrm{SE}(2)$ | **Proved**, all families |
| Uniformity of the synthesis into the separatrix limit $k\to 1$ | Numerically solid; delicate to state uniformly |
| Complete rigour on all abnormal/degenerate strata | Established for $\mathrm{SE}(2)$; the general pattern is hard |
| General "Maxwell $=$ cut" theorem for left-invariant SR problems | **Open** — proved only case-by-case |

</div>

The line to hold onto: **$\mathrm{SE}(2)$ itself is solved.** For the visual cortex's
geometry, we know exactly when a completed contour stops being the unique shortest one — at
arc length $4K(k^2)$, the elliptic period that has followed us since Part 2. What remains
open is not this space but the *general theory* it is the flagship example of: why symmetry
so reliably sets the cut time, and whether that can be made a theorem rather than a growing
list of triumphant special cases.

## Where the series ends

Four parts ago we started with an illusion — the mind completing a contour that is not
there. It became a shortest-path problem on $\mathrm{SE}(2)$ (Part 1), whose geodesics are
Euler's elastica in Jacobi elliptic functions (Part 2), whose global optimality is broken by
a four-element symmetry group at the first Maxwell time (Part 3), which is the exact cut time
$4K(k^2)/\omega_0$ — with a clean general theory still waiting to be written (Part 4).

The elliptic integral $K(k^2)$ has been the thread throughout: period of the curvature,
first Maxwell time, cut time. That a single classical special function — the same one Gauss
computed with the arithmetic–geometric mean, the same one in the `elliptic` package that
draws these figures — governs when your visual system's inferred contour stops being unique
is the quiet punchline of the whole series.

</div><!-- /.l-body -->

<!-- ── References ── -->
<div class="d-article" style="padding-top:0;">
<div class="l-body d-references">
<h2>References</h2>
<ol>
  <li>
    Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian problem
    on the group of motions of a plane." <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>
  </li>
  <li>
    Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the
    group of motions of a plane." <em>ESAIM: COCV</em> 16(4): 1018–1039.
  </li>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on
    the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>
  </li>
  <li>
    A. A. Ardentov &amp; Yu. L. Sachkov (2011). "Solution to Euler's elastic problem."
    <em>Automation and Remote Control</em> 72(11): 2298–2312 — the same Maxwell-strata method
    applied to the elastica.
  </li>
  <li>
    D. Barilari, U. Boscain &amp; R. Neel (2012). "Small-time heat-kernel asymptotics at the
    sub-Riemannian cut locus." <em>J. Differential Geometry</em> 92(3): 373–416 — why the cut
    locus controls analysis, not just geometry.
  </li>
  <li>
    A. A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
    Sub-Riemannian Geometry.</em> Cambridge — cut/conjugate theory and the state of the
    general conjecture.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── Figure 1: Maxwell time vs conjugate time vs k ─────────────────────────
function drawClocks() {
  const svg = document.getElementById('fig-clocks');
  if (!svg) return;
  const W = svg.clientWidth || 720, H = 340;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const pad = { l: 52, r: 22, t: 22, b: 44 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const yMax = 26;
  const xSc = d3.scaleLinear([0, 1], [pad.l, pad.l + iW]);
  const ySc = d3.scaleLinear([0, yMax], [pad.t + iH, pad.t]);

  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  // grid + y ticks
  [4, 8, 12, 16, 20, 24].forEach(v => {
    g.append('line').attr('x1', pad.l).attr('x2', pad.l + iW).attr('y1', ySc(v)).attr('y2', ySc(v))
      .attr('stroke', '#ececec').attr('stroke-width', 1);
    g.append('text').attr('x', pad.l - 6).attr('y', ySc(v) + 4).attr('text-anchor', 'end')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa').text(v);
  });
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(v => {
    g.append('text').attr('x', xSc(v)).attr('y', pad.t + iH + 16).attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#aaa').text(v.toFixed(1));
  });
  g.append('text').attr('x', pad.l + iW / 2).attr('y', H - 8).attr('text-anchor', 'middle')
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:12px;fill:#666').text('modulus k');
  g.append('text').attr('transform', `translate(14,${pad.t + iH / 2}) rotate(-90)`).attr('text-anchor', 'middle')
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:12px;fill:#666').text('arc length');

  const N = 300;
  const kArr = d3.range(N).map(i => 0.01 + i * 0.975 / N);
  // first Maxwell time = 4K(k²); first conjugate time modelled as its known
  // upper envelope (≥ Maxwell), here 4K(k²)·(1 + small gap) — schematic but
  // order-correct: conjugate never dips below Maxwell.
  const tMax = kArr.map(k => 4 * ellipticK(k * k));
  const tConj = kArr.map(k => {
    const Km = ellipticK(k * k);
    return 4 * Km + 1.2 * Math.sqrt(1 - k * k);   // ≥ 4K, gap shrinks as k→1
  });

  const clip = v => Math.min(v, yMax);
  g.append('path').attr('d', d3.line().x((_, i) => xSc(kArr[i])).y(v => ySc(clip(v)))(tConj))
    .attr('fill', 'none').attr('stroke', '#2e7d32').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
  g.append('path').attr('d', d3.line().x((_, i) => xSc(kArr[i])).y(v => ySc(clip(v)))(tMax))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.4);

  // shade the "uniquely shortest" region below the Maxwell curve
  const area = d3.area().x((_, i) => xSc(kArr[i])).y0(ySc(0)).y1(v => ySc(clip(v)));
  g.append('path').attr('d', area(tMax)).attr('fill', '#1565c0').attr('opacity', 0.06);

  // legend
  const leg = [['t_cut = 4K(k²)  (Maxwell)', '#1565c0', false], ['t_conj  (conjugate)', '#2e7d32', true]];
  leg.forEach(([label, col, dash], i) => {
    const lx = pad.l + 10, ly = pad.t + 12 + i * 18;
    g.append('line').attr('x1', lx).attr('x2', lx + 22).attr('y1', ly).attr('y2', ly)
      .attr('stroke', col).attr('stroke-width', 2.2).attr('stroke-dasharray', dash ? '6,3' : null);
    g.append('text').attr('x', lx + 28).attr('y', ly + 4)
      .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#555').text(label);
  });
  g.append('text').attr('x', xSc(0.93)).attr('y', pad.t + 12).attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:10px;fill:#c62828').text('k→1: both → ∞');
}

// ── Figure 2: projected cut locus from first-Maxwell endpoints ─────────────
function inflGeo(k, sMax, N) {
  // signed k allowed: κ = 2k·cn (k<0 mirrors)
  const m = k * k, ds = sMax / N;
  let x = 0, y = 0, th = 0;
  const pts = [{ x, y }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const kap = 2 * k * ellipj(s + ds / 2, m).cn;
    const tm = th + 0.5 * kap * ds;
    x += Math.cos(tm) * ds; y += Math.sin(tm) * ds; th += kap * ds;
    pts.push({ x, y });
  }
  return pts;
}

function drawCut() {
  const svg = document.getElementById('fig-cut');
  if (!svg) return;
  const kMax = parseFloat(document.getElementById('cut-kmax').value) / 100;
  document.getElementById('cut-kmax-val').textContent = kMax.toFixed(2);
  const showGeo = document.getElementById('cut-geo').checked;

  const W = svg.clientWidth || 720, H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');
  const m = { l: 28, r: 24, t: 18, b: 30 };

  // one geodesic per signed k, each cut at its own s = 4K(k²)
  const kVals = [];
  for (let kk = 0.06; kk <= kMax + 1e-9; kk += 0.045) { kVals.push(kk); kVals.push(-kk); }
  const geos = kVals.map(k => {
    const sCut = 4 * ellipticK(k * k);
    const pts = inflGeo(k, sCut, 500);
    return { k, pts, end: pts[pts.length - 1] };
  });

  // auto-scale to all geodesic points
  let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
  geos.forEach(({ pts }) => pts.forEach(p => {
    if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
  }));
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
  const rng = Math.max(xMax - xMin, yMax - yMin) / 2 * 1.12 + 0.3;
  const asp = (W - m.l - m.r) / (H - m.t - m.b);
  const xR = rng * Math.max(asp, 1), yR = rng * Math.max(1 / asp, 1);
  const xS = d3.scaleLinear([cx - xR, cx + xR], [m.l, W - m.r]);
  const yS = d3.scaleLinear([cy - yR, cy + yR], [H - m.b, m.t]);

  // reference axes
  g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', yS(0)).attr('y2', yS(0))
    .attr('stroke', '#f2f2f2').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0)).attr('y1', m.t).attr('y2', H - m.b)
    .attr('stroke', '#f2f2f2').attr('stroke-width', 1);

  // faint geodesics
  if (showGeo) {
    geos.forEach(({ k, pts }) => {
      const col = k >= 0 ? d3.interpolateBlues(0.35 + 0.5 * Math.abs(k))
                         : d3.interpolateReds(0.35 + 0.5 * Math.abs(k));
      g.append('path').attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(pts))
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1).attr('opacity', 0.4);
    });
  }

  // the cut locus: order endpoints by k (which sweeps a connected curve)
  const ordered = geos.slice().sort((a, b) => a.k - b.k).map(x => x.end);
  g.append('path').attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(ordered))
    .attr('fill', 'none').attr('stroke', '#e65100').attr('stroke-width', 2.6);
  ordered.forEach(p => g.append('circle').attr('cx', xS(p.x)).attr('cy', yS(p.y)).attr('r', 2.3).attr('fill', '#e65100'));

  // origin
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#222');

  // labels
  g.append('text').attr('x', m.l + 2).attr('y', m.t + 12)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:11px;fill:#e65100').text('projected cut locus');
  g.append('text').attr('x', W - m.r).attr('y', H - m.b - 4).attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--mono,monospace);font-size:10px;fill:#888')
    .text(`|k| ≤ ${kMax.toFixed(2)}`);
}

// ── boot ──────────────────────────────────────────────────────────────────
function wire() {
  ['cut-kmax', 'cut-geo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawCut);
    if (el) el.addEventListener('change', drawCut);
  });
  drawClocks();
  drawCut();
  window.addEventListener('resize', () => { drawClocks(); drawCut(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();

})();
</script>
