---
layout: distill
title: "The Magnetic Contact Geometry: Larmor Motion Is Heisenberg"
subtitle: >
  A charged particle circling in a magnetic field is not just <em>like</em> a sub-Riemannian
  geodesic — it <em>is</em> one, and the group is Heisenberg. This post builds the magnetic
  contact geometry from that fact, then measures the law Q = d + k + 2 directly: the flux
  coordinate is area-like (weight 2), and near a magnetic null it costs even more (weight k+2).
date: 2026-08-08 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-fields, heisenberg, larmor, holonomy, ball-box]
image: /public/img/posts/forbidden-directions-2.svg
description: >
  Part 2 of the Forbidden Directions series: the magnetic contact structure, the identity
  between Larmor orbits and Heisenberg geodesics, the flux coordinate as an area-like weight-2
  direction, and the measured reach-scaling law Q = d + k + 2 with the flux exponent k+2.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 2
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-05-forbidden-directions-research-program %}">Part 1</a> stated the
thesis (a connection whose curvature is a physical field makes configuration space
sub-Riemannian), the selection rule (forbidden, not slow), and the law
<code>Q = d + k + 2</code>. This post builds the actual geometry for a magnetic field, shows
its geodesics are the orbits every physicist already knows, and <em>measures</em> the law.
</div>

## The structure

A charged particle in the plane, tracking one extra number: the **magnetic flux**
$\varphi = \int \mathbf A\cdot d\boldsymbol\ell$ it has swept, where $\nabla\times\mathbf A = B\,\hat z$.
The state is $(x,y,\varphi)$, and the allowed moves are "step in the plane, and let the flux
follow":

$$
X_1 = \partial_x + A_x\,\partial_\varphi,\qquad X_2 = \partial_y + A_y\,\partial_\varphi.
$$

You may drive along $X_1$ and $X_2$; you may **not** drive along $\partial_\varphi$ directly.
But you reach it anyway, because the bracket of the two allowed moves is

$$
[X_1, X_2] \;=\; (\partial_x A_y - \partial_y A_x)\,\partial_\varphi \;=\; B(x,y)\,\partial_\varphi.
$$

Wherever $B\neq0$, one bracket reaches the forbidden flux direction: the structure is
**contact**, growth vector $(2,3)$, and — as [Part 1](/mathematics/2026/08/05/forbidden-directions-research-program/)
promised — $Q = d + 2 = 4$.

## Larmor motion is Heisenberg — exactly

Now solve for the geodesics. The sub-Riemannian geodesics of this structure are unit-speed
curves whose velocity direction $\theta$ turns at a rate set by the field:

$$
\dot x = \cos\theta,\qquad \dot y = \sin\theta,\qquad \dot\theta = B(x,y)\,w,
$$

for a conserved momentum $w$. A curve of constant curvature $B\,w$ — a **circle**. This is
precisely the **Larmor orbit** of a charged particle in a magnetic field: the shortest paths of
the magnetic contact geometry are the trajectories the Lorentz force already draws. And the
flux swept as the particle goes around is the area it encloses — the third coordinate.

For a *uniform* field $B_0$ in the symmetric gauge $\mathbf A = \tfrac{B_0}{2}(-y, x)$, write
this out and it is, letter for letter, the **Heisenberg group**: the frame is the Heisenberg
frame, the geodesics close at

$$
t_c = \frac{2\pi}{B_0\,|w|}\qquad(\text{the Larmor period}),
$$

and the caustic — the set where a family of orbits refocuses — is the Heisenberg group's
central axis. The abstract flat model of sub-Riemannian geometry and the first system in every
plasma-physics course are the same object. (Details in
[Appendix D4](#); the code reproduces $t_c$ to one part in $10^{11}$ and confirms it is
gauge-independent.)

## The flux is area-like — so it is weight two

Why is $\varphi$ a weight-2 coordinate and not weight 1? Because you cannot get flux by going
*somewhere* — only by going *around*. A loop of spatial size $r$ encloses area $\sim r^2$ and
sweeps flux $\varphi \sim B\,r^2$. So as you shrink the available path length $r$, the reach in
$x$ and $y$ shrinks like $r$, but the reach in $\varphi$ shrinks like $r^2$ — twice as fast. On
a log–log plot of reach versus path length, the spatial coordinates have slope 1 and the flux
has slope 2. The figure shows the real measurement.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-reach2d">
  <div style="text-align:center;margin-bottom:0.3em;">
    <span style="font-size:0.85rem;color:#555;">how far each coordinate reaches vs. path length — log–log, measured</span>
  </div>
  <div id="fd-reach2d" style="text-align:center;"></div>
  <figcaption>
    <strong>The law $Q = d + k + 2$, measured.</strong> Each line is a coordinate's reach (98th
    percentile of $\lvert\cdot\rvert$ across a fan of geodesics) versus path length $r$, both axes
    logarithmic; slope = weight. The two spatial coordinates (slope&nbsp;1) are drivable
    directly. The <em>flux</em> coordinate has slope&nbsp;2 in an ordinary field ($k=0$) — it is
    area-like — giving $Q = 2 + 2 = 4$. Where the field vanishes to order $k$, the flux slope
    rises to $k+2$: slope&nbsp;3 at a simple null ($k=1$, $Q=5$), slope&nbsp;4 at a double null
    ($k=2$, $Q=6$). Points are measured; dashed guides are the exact integer slopes. Data:
    <code>research/preferred-directions</code> (the sibling <code>run_e9.py</code> confirms
    $k=0..3$).
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("fd-reach2d");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const R = [0.03, 0.044, 0.0646, 0.0949, 0.1392, 0.2044, 0.30];
  const SPATIAL = [0.0293, 0.0430, 0.0631, 0.0927, 0.1360, 0.1997, 0.2926];
  const FLUX0 = [2.76e-4, 5.87e-4, 1.277e-3, 2.743e-3, 5.886e-3, 1.2757e-2, 2.7481e-2];
  const FLUX1 = [2e-6, 8e-6, 2.4e-5, 7.7e-5, 2.37e-4, 7.58e-4, 2.41e-3];
  const FLUX2 = [null, null, 1e-6, 3e-6, 1.5e-5, 6.9e-5, 3.21e-4];
  const W = 620, H = 420, mL = 60, mR = 128, mT = 16, mB = 46;
  const x0 = mL, x1 = W - mR, y0 = mT, y1 = H - mB;
  const lxmin = Math.log10(0.025), lxmax = Math.log10(0.33);
  const lymin = Math.log10(6e-7), lymax = Math.log10(0.5);
  const X = v => x0 + (Math.log10(v) - lxmin) / (lxmax - lxmin) * (x1 - x0);
  const Y = v => y1 - (Math.log10(v) - lymin) / (lymax - lymin) * (y1 - y0);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "620px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };

  [1, 1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6].forEach(gy => {
    svg.appendChild(el("line", { x1: x0, y1: Y(gy), x2: x1, y2: Y(gy), stroke: "#eee", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: x0 - 6, y: Y(gy) + 3, "text-anchor": "end", "font-size": 9.5, fill: "#999", "font-family": MONO },
      gy >= 1 ? "1" : "1e" + Math.round(Math.log10(gy)) ));
  });
  [0.03, 0.1, 0.3].forEach(gx => {
    svg.appendChild(el("line", { x1: X(gx), y1: y0, x2: X(gx), y2: y1, stroke: "#eee", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: X(gx), y: y1 + 15, "text-anchor": "middle", "font-size": 10, fill: "#999", "font-family": MONO }, gx));
  });
  // exact-slope guides through the last point of each series
  function guide(slope, r1, v1, col) {
    const r2 = 0.028, v2 = v1 * Math.pow(r2 / r1, slope);
    svg.appendChild(el("line", { x1: X(r2), y1: Y(v2), x2: X(r1), y2: Y(v1), stroke: col, "stroke-width": 1, "stroke-dasharray": "3 3", opacity: 0.5 }));
  }
  guide(1, 0.30, 0.2926, "#2b6cb0"); guide(2, 0.30, 0.027481, "#dd6b20");
  guide(3, 0.30, 0.00241, "#2f855a"); guide(4, 0.30, 0.000321, "#805ad5");

  function plot(vals, col, label, sub) {
    const pts = [];
    R.forEach((r, i) => { if (vals[i] != null) pts.push(`${X(r).toFixed(1)},${Y(vals[i]).toFixed(1)}`); });
    svg.appendChild(el("polyline", { points: pts.join(" "), fill: "none", stroke: col, "stroke-width": 2 }));
    R.forEach((r, i) => { if (vals[i] != null) svg.appendChild(el("circle", { cx: X(r), cy: Y(vals[i]), r: 2.6, fill: col })); });
    let li = R.length - 1;
    const lx = X(R[li]) + 8, ly = Y(vals[li]);
    svg.appendChild(el("text", { x: lx, y: ly + 3, "font-size": 11.5, fill: col, "font-family": SANS, "font-weight": 600 }, label));
    svg.appendChild(el("text", { x: lx, y: ly + 15, "font-size": 9.5, fill: "#888", "font-family": SANS }, sub));
  }
  plot(SPATIAL, "#2b6cb0", "spatial", "slope 1");
  plot(FLUX0, "#dd6b20", "flux, k=0", "slope 2  (Q=4)");
  plot(FLUX1, "#2f855a", "flux, k=1", "slope 3  (Q=5)");
  plot(FLUX2, "#805ad5", "flux, k=2", "slope 4  (Q=6)");

  svg.appendChild(el("line", { x1: x0, y1: y1, x2: x1, y2: y1, stroke: "#333", "stroke-width": 1 }));
  svg.appendChild(el("line", { x1: x0, y1: y0, x2: x0, y2: y1, stroke: "#333", "stroke-width": 1 }));
  svg.appendChild(el("text", { x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS }, "path length r  (log)"));
  svg.appendChild(el("text", { x: 14, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 12, fill: "#333", "font-family": SANS, transform: `rotate(-90 14 ${(y0 + y1) / 2})` }, "coordinate reach  (log)"));
})();
</script>

<div class="l-body" markdown="1">

## The null jump, and what it means

Read the figure as a story about a **magnetic null**. Almost everywhere the field is ordinary,
the flux is weight 2, and $Q = d + 2$. But approach a point where $B$ vanishes to order $k$ and
the flux line steepens: the coordinate becomes weight $k+2$, and $Q$ jumps to $d + k + 2$. In 2D,
$Q$ goes $4 \to 5$ at a simple null; in 3D (Part 4) it goes $5 \to 6$.

So the homogeneous dimension is a **curvature-degeneracy meter**. It sits at its floor value
everywhere the field is healthy, and rises by exactly the vanishing order on the measure-zero set
where the field fails. A sub-Riemannian invariant, computed from how a small ball grows, locates
the magnetic nulls — the reconnection sites — and reads how degenerate each one is. Part 4 turns
that into an actual detector and checks it against the standard tool.

What the growth vector does **not** yet tell you is the *shape* of the field near the null — how
it curves, which way it leans. That information is not in how big the ball is; it is in the shape
of the caustic. Reading the field's gradient off that caustic is [Part 3](#).

## Glossary

- **Magnetic contact structure** — the sub-Riemannian structure on (position, flux) with frame
  $X_i = \partial_i + A_i\partial_\varphi$; contact wherever $B\neq0$.
- **Larmor orbit** — the circular trajectory of a charged particle in a magnetic field; here, a
  sub-Riemannian geodesic.
- **Flux coordinate $\varphi$** — the swept magnetic flux $\int\mathbf A\cdot d\boldsymbol\ell$;
  the forbidden, area-like direction.
- **Weight of a coordinate** — the power of path length $r$ at which it fills in; the slope on the
  log–log reach plot. Spatial coordinates: 1; flux: $k+2$.
- **Reach** — how far a coordinate ranges over geodesics of a given length; a high quantile of its
  absolute value.
- **Null jump** — the increase of $Q$ from $d+2$ to $d+k+2$ at a magnetic null of order $k$.

## References

- L. D. Landau &amp; E. M. Lifshitz. <em>The Classical Theory of Fields</em> — Larmor motion.
- A. Bellaïche (1996). "The tangent space in sub-Riemannian geometry." In <em>Sub-Riemannian
  Geometry</em>, Progr. Math. 144, Birkhäuser. (Ball–Box, weights.)
- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press. (Heisenberg, Martinet.)

</div><!-- /.l-body -->
