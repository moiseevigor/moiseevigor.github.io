---
layout: distill
title: "The Geometry of Forbidden Directions: A Research Program"
subtitle: >
  When a physical field <em>forbids</em> a direction of motion — not merely slows it — the
  configuration space stops being ordinary and becomes sub-Riemannian. This post scopes a
  program built on that distinction, states the one law it has already confirmed
  (Q = d + k + 2), and draws the sharp line between the physics that qualifies (magnetic
  fields, rotation) and the physics that only looks like it does (anisotropic transport,
  gravity).
date: 2026-08-05 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-fields, holonomy, connections, nonholonomic, plasma]
image: /public/img/posts/forbidden-directions-1.svg
description: >
  Scoping document for a research program on the sub-Riemannian geometry of physical
  connections: the thesis that a connection whose curvature is a physical field makes
  configuration space sub-Riemannian, the selection rule (forbidden vs merely slow), the
  confirmed law Q = d + k + 2, and the phased plan with its confirmed results and open
  questions.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 1
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this document is</div>
A <strong>scoping document</strong> for a research program — but an unusual one, because
its central law is already confirmed. It states the thesis, the selection rule that decides
which physical systems it applies to, the law <code>Q = d + k + 2</code>, the phased plan,
and — reported honestly up front — what each phase has actually found. The program grew out
of the <a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">caustics-to-groups</a>
series, which built and validated the sub-Riemannian toolkit this one uses.
</div>

**The question, and a one-word pivot.** The prompt behind this program was simple: *in
environments where some directions become preferred — magnetized plasma, rotating flows —
can the sub-Riemannian machinery detect local structure?* The entire answer turns on
replacing one word. **Preferred is not enough. The direction must be forbidden.** A
direction that is merely *slow* — cross-field diffusion, an anisotropic medium — leaves the
geometry ordinary (Riemannian); the reachable set is just a squashed ellipsoid. A direction
that is *forbidden*, reachable only by combining allowed moves, is what makes a geometry
genuinely sub-Riemannian. Getting that distinction right is most of the work, and it is the
subject of the [selection rule](#the-selection-rule) below.

**The thesis, in one sentence.**

> A physical environment carries genuine sub-Riemannian geometry **if and only if there is a
> connection whose curvature is a physical field** — and then the geometry *reads that field
> off*: the growth vector gives the field's vanishing order, the ball–box exponents give the
> cost of accumulating holonomy, and the caustic gives the field's gradient.

A **connection**[^connection] is a rule for carrying a quantity along a path; its
**curvature** is the mismatch you accumulate around a loop — the **holonomy**. For a magnetic
field, the connection is the vector potential $\mathbf A$, the curvature is $\mathbf B$, and
the holonomy is the magnetic flux $\varphi = \oint \mathbf A\cdot d\boldsymbol\ell$ you sweep.
Adjoin that flux to position as an extra coordinate, and moving in the flux direction becomes
*forbidden except by going around a loop*. That is the sub-Riemannian structure this program
studies.

## The selection rule

Here is the filter, and it is strict. Most "preferred direction" phenomena fail it.

| Environment | What the structure is | Sub-Riemannian? |
|---|---|---|
| Cross-field transport, $D_\perp \ll D_\parallel$ | *coefficient* anisotropy | ✗ — anisotropic Riemannian, still $Q = n$ |
| The limit $D_\perp \to 0$ | rank-1 distribution | ✗ — integrable (field lines), no bracket |
| Anisotropic media, birefringence | Finsler metric | ✗ — $Q = n$ |
| Gravitational structure formation | a *flow*, no control system | ✗ — no distribution at all |
| **Magnetic field** | connection $\mathbf A$, curvature $\mathbf B$ | ✓ — contact where $\mathbf B \neq 0$ |
| **Rotating frame** (Coriolis) | connection, curvature $2\boldsymbol\omega$ | ✓ — uniform rotation *is* Heisenberg |
| **Berry connection** | Berry curvature | ✓ — but degeneracies diverge, a distinct regime |

The diagnostic that separates the rows is the **homogeneous dimension** $Q$, the exponent in
how a small ball grows, $\mathrm{vol}\,B(r)\sim r^{Q}$. A Riemannian space (however anisotropic)
has $Q$ equal to its ordinary dimension $n$. A genuinely sub-Riemannian space has $Q > n$ —
it is "bigger than it looks" because the forbidden direction is expensive to reach. **Slow
directions do not raise $Q$; forbidden directions do.** Why this matters so much — and why a
gravitational caustic can *counterfeit* $Q > n$ at a single point without being sub-Riemannian
— is the subject of [Appendix D2](#).

## The law: Q = d + k + 2

The program's central result, already confirmed. Adjoin the holonomy $\varphi$ to a
$d$-dimensional space; then wherever the curvature (field) vanishes to order $k$,

$$
\boxed{\,Q \;=\; d \;+\; k \;+\; 2\,}
$$

Each term is one physical idea. The **$d$** spatial directions are drivable directly (weight
one each). The flux coordinate $\varphi$ is not — you accumulate it only by enclosing area,
and *flux is area-like*: a loop of size $r$ encloses area $\sim r^2$ and catches flux
$\sim B\,r^2$. Where the field is ordinary that makes $\varphi$ a **weight-2** coordinate (the
"$+2$"); where the field *vanishes* to order $k$, the same loop catches only $\sim r^k\cdot r^2$,
so $\varphi$ costs even more — **weight $k+2$** (the "$+k$"). The figure makes the area
argument visible.

[^connection]: A connection is a rule for transporting a quantity (a phase, a frame, a vector) along a path so it stays "parallel"; go around a loop and you generally come back rotated or shifted — that leftover is the holonomy, and the field that causes it is the curvature.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-holonomy">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="fd-b-uniform">ordinary field (k=0)</button>
    <button class="fig-toggle" id="fd-b-null">near a null (k=1)</button>
    <button id="fd-replay" style="font-size:0.8rem;padding:2px 12px;cursor:pointer;border:1px solid #bbb;background:#fafafa;border-radius:3px;">replay</button>
  </div>
  <div id="fd-holonomy" style="text-align:center;"></div>
  <figcaption>
    <strong>Why the flux coordinate is area-like.</strong> A charged particle drives a loop;
    the shaded region is the area it encloses, and the meter is the magnetic flux
    $\varphi = B \times \text{area}$ it accumulates — the "forbidden" third coordinate, reached
    only by going around. Because area grows as (loop size)$^2$, flux is a <em>weight-2</em>
    coordinate, giving $Q = d + 2$. <em>Near a null</em> the field is weak in the loop's
    interior, so the same loop catches far less flux (fainter shading): the coordinate costs
    more to reach — weight $k+2$ — and $Q$ rises to $d + k + 2$. Schematic; the measured
    exponents are in Part 2.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("fd-holonomy");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const W = 520, H = 300, cx = 150, cy = 155, R = 92;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };

  let mode = "uniform";        // "uniform" | "null"
  let t0 = performance.now();

  function frame(now) {
    const T = 3.2;                                   // seconds per loop
    let f = ((now - t0) / 1000) / T;                 // fraction of loop
    if (f > 1) f = 1;
    const ang = f * 2 * Math.PI;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // field strength weighting: uniform=1 everywhere; null grows from centre outward
    const fieldColor = mode === "uniform" ? "#1565c0" : "#1565c0";
    // shaded swept sector (the enclosed area so far)
    const nseg = Math.max(1, Math.round(f * 60));
    let d = `M ${cx} ${cy}`;
    for (let i = 0; i <= nseg; i++) {
      const a = (i / 60) * ang * (60 / Math.max(nseg, 1));
      d += ` L ${(cx + R * Math.cos(a - Math.PI / 2)).toFixed(1)} ${(cy + R * Math.sin(a - Math.PI / 2)).toFixed(1)}`;
    }
    d += " Z";
    // flux caught: uniform -> area; null -> area weighted small near centre (field ~ radius)
    const areaFrac = f;                              // fraction of full disc area swept
    const opacity = mode === "uniform" ? 0.16 : 0.055;
    svg.appendChild(el("path", { d, fill: fieldColor, "fill-opacity": opacity, stroke: "none" }));

    // the loop outline
    svg.appendChild(el("circle", { cx, cy, r: R, fill: "none", stroke: "#bbb", "stroke-width": 1, "stroke-dasharray": "3 4" }));
    // the traced arc so far
    const ax = cx + R * Math.cos(ang - Math.PI / 2), ay = cy + R * Math.sin(ang - Math.PI / 2);
    const large = ang > Math.PI ? 1 : 0;
    if (f > 0.001)
      svg.appendChild(el("path", { d: `M ${cx} ${cy - R} A ${R} ${R} 0 ${large} 1 ${ax.toFixed(1)} ${ay.toFixed(1)}`,
        fill: "none", stroke: "#1565c0", "stroke-width": 2 }));
    // the particle
    svg.appendChild(el("circle", { cx: ax, cy: ay, r: 4.5, fill: "#e65100" }));
    // null marker at centre in null mode
    if (mode === "null") {
      svg.appendChild(el("circle", { cx, cy, r: 3, fill: "#e65100" }));
      svg.appendChild(el("text", { x: cx, y: cy + 16, "text-anchor": "middle", "font-size": 10, fill: "#e65100", "font-family": SANS }, "B ≈ 0 here"));
    }

    // flux meter
    const mx = 330, my = 60, mw = 150, mh = 22;
    const fluxFrac = mode === "uniform" ? areaFrac : areaFrac * 0.34;   // less flux near a null
    svg.appendChild(el("text", { x: mx, y: my - 8, "font-size": 12.5, fill: "#333", "font-family": SANS }, "flux φ = B × area"));
    svg.appendChild(el("rect", { x: mx, y: my, width: mw, height: mh, rx: 3, fill: "#f2f2f2", stroke: "#ddd" }));
    svg.appendChild(el("rect", { x: mx, y: my, width: (mw * fluxFrac).toFixed(1), height: mh, rx: 3, fill: "#1565c0", "fill-opacity": 0.8 }));
    svg.appendChild(el("text", { x: mx, y: my + mh + 30, "font-size": 12, fill: "#555", "font-family": SANS }, mode === "uniform" ? "ordinary field:" : "near a null:"));
    svg.appendChild(el("text", { x: mx, y: my + mh + 48, "font-size": 12.5, fill: "#333", "font-family": MONO },
      mode === "uniform" ? "φ ~ r²  (weight 2)" : "φ ~ r³  (weight 3)"));
    svg.appendChild(el("text", { x: mx, y: my + mh + 74, "font-size": 13, fill: "#e65100", "font-family": MONO, "font-weight": 700 },
      mode === "uniform" ? "Q = d + 2" : "Q = d + 1 + 2"));

    if (f < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const bu = document.getElementById("fd-b-uniform"), bn = document.getElementById("fd-b-null");
  bu.onclick = () => { mode = "uniform"; bu.classList.add("active"); bn.classList.remove("active"); t0 = performance.now(); requestAnimationFrame(frame); };
  bn.onclick = () => { mode = "null"; bn.classList.add("active"); bu.classList.remove("active"); t0 = performance.now(); requestAnimationFrame(frame); };
  document.getElementById("fd-replay").onclick = () => { t0 = performance.now(); requestAnimationFrame(frame); };
})();
</script>

<div class="l-body" markdown="1">

## What is already established

Because this program moved fast, the scoping comes with verdicts. Every number is from
reproducible code in `research/preferred-directions/` and the shared toolkit it imports.

| Result | Question | Verdict |
|---|---|---|
| **The law (2D)** | Is $Q = d+k+2$ real? | ✓ confirmed, orders $k=0,1,2,3$: exponents $2,3,4,5$ |
| **The moduli** | Does the caustic read $\nabla B$? | ✓ confirmed: $\delta = -\varepsilon^2 + O(\varepsilon^4)$, $\varepsilon = |\nabla\ln B|\,r_L$ |
| **The law (3D)** | Does $Q = k+5$ hold in 3D? | ✓ confirmed; the growth vector jumps $5\to6$ at a null |
| **Null detection** | Does it agree with the standard finder? | ✓ on an MHD field, agrees on location and order |

Three of these are worth stating plainly. **Uniform magnetic motion is exactly the Heisenberg
group** — the Larmor orbit of a charged particle *is* a sub-Riemannian geodesic, and the flux
it sweeps is the Heisenberg group's third coordinate. **The caustic measures the field
gradient**: the deviation of the refocusing pattern from the flat model scales as the square
of the dimensionless gradient, invertibly. And **the growth vector is a magnetic-null detector**:
it sits at $Q = d+2$ almost everywhere and pops up by exactly $k$ on the measure-zero set where
the field vanishes to order $k$ — a curvature-degeneracy meter.

## The honest open question

The program has a sharp risk, stated as its own kill criterion: **if you already know the
field, its zeros and their order are elementary to find, and the law above is a two-line
dimensional argument.** So the real question is whether the sub-Riemannian framing *predicts
anything a direct look at the field does not*. The growth vector, so far, only *agrees* with the
standard magnetic-null finder — it detects the same nulls to the same order, but does not
distinguish their *type* (radial vs spiral), which lives in the eigenvalues of $\nabla B$.

The one place the framing might genuinely *refine* the standard tools is the **moduli**: the
caustic already reads the field gradient (Part 3), so the decisive experiment is whether a
finer caustic invariant recovers the null *type* the growth vector discards. That is the
program's frontier, and Part 4 ends there honestly.

## The series

- **Part 1** *(this page)* — the program, the selection rule, the law.
- **Part 2** *(upcoming)* — *The magnetic contact geometry*: Larmor motion is Heisenberg, and
  the law measured.
- **Part 3** *(upcoming)* — *Reading the field gradient from the caustic*: the deviation
  statistic and $\delta = -\varepsilon^2$.
- **Part 4** *(upcoming)* — *Finding magnetic nulls*: 3D, the ABC field, and the external
  validation.
- Appendices **D1–D5** — connections and holonomy, the selection rule, the law derived, the
  magnetic geodesic flow, and the gradient formula.

## Glossary

- **Connection / holonomy / curvature** — a rule for transporting a quantity along a path; the
  net change around a loop; the field that causes it. For magnetism: $\mathbf A$, the flux
  $\varphi$, and $\mathbf B$.
- **Homogeneous dimension $Q$** — the exponent in ball-volume growth $\mathrm{vol}\,B(r)\sim r^Q$;
  equals the ordinary dimension for a Riemannian space, exceeds it for a sub-Riemannian one.
- **Forbidden vs slow direction** — a forbidden direction is reachable only by a bracket of
  allowed moves (it raises $Q$); a slow direction is still directly drivable (it does not).
- **Vanishing order $k$** — the order to which the field vanishes at a point; $k=0$ where
  $\mathbf B\neq0$, $k=1$ at a generic null.
- **Larmor orbit** — the circular path of a charged particle in a magnetic field; here, a
  sub-Riemannian geodesic.
- **Magnetic null** — a point where $\mathbf B = 0$; a reconnection site in plasma physics.

## References

- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their Geodesics and
  Applications</em>. AMS Mathematical Surveys and Monographs 91.
- A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to
  Sub-Riemannian Geometry</em>. Cambridge University Press.
- V. I. Arnold, B. A. Khesin (1998). <em>Topological Methods in Hydrodynamics</em>. Springer.
  (ABC / Beltrami fields.)
- D. W. Longcope (2005). "Topological methods for the analysis of solar magnetic fields."
  <em>Living Rev. Solar Phys.</em> 2, 7. (Magnetic charge topology and coronal nulls.)

</div><!-- /.l-body -->
