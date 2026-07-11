---
layout: distill
title: "Appendix C1 — The Model Groups, by Example: Real-World Sub-Riemannian Systems"
subtitle: >
  The five groups of the series are not abstractions — each is the exact control
  geometry of a system you can picture: a charged particle in a magnetic field,
  a parking car, a truck with trailers, rolling spheres, an MRI scanner tracing
  nerve fibres. This appendix meets each one concretely: the system, the "moves
  you're allowed", the growth vector as parking difficulty, and where its caustic
  shows up.
date: 2026-07-28 09:00:00
categories: [mathematics]
tags: [sub-riemannian, lie-groups, nonholonomic, robotics, dw-mri, examples]
description: >
  Companion appendix to the caustics-to-groups series: real-world sub-Riemannian
  systems for the Heisenberg, SE(2), Engel, Cartan, and SE(3) groups — magnetic
  orbits and the isoperimetric problem, the Dubins car and visual cortex, the
  car-with-trailer, Cartan's rolling spheres and G2, and diffusion-MRI fibre
  tracking — with the growth vector read as nonholonomic parking difficulty.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: C1
permalink: /mathematics/2026/07/28/caustics-to-groups-C1-model-groups-by-example/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The main series treats the five groups fairly abstractly. Here each one is pinned
to a <strong>concrete real-world system</strong> whose motion is governed by exactly
that sub-Riemannian structure. The through-line is <em>nonholonomy</em>: in every
case you can only move in certain directions, yet by combining those moves you reach
places you could never go directly — and the <em>growth vector</em> measures how many
combined moves each "forbidden" direction costs. That is the same number the detector
in <a href="{% post_url 2026-07-22-caustics-to-groups-inverse-map %}">Part 3</a>
recovers from caustic data.
</div>

## The one idea behind all of them: reaching the unreachable

Every system here obeys the same kind of rule: **some directions of motion are
allowed, others are forbidden**, and the forbidden ones can only be reached
*indirectly*. A car cannot slide sideways — yet it parks sideways, by a back-and-forth
wiggle. That wiggle is the geometric heart of the whole subject: combine "drive
forward" and "steer" in the right order and you get *net sideways motion* that neither
move alone provides. Mathematicians call that combination the **bracket** of the two
moves; engineers call the whole situation **nonholonomic**.

<figure class="l-body" id="fig-bracket">
  <div id="c2g-bracket" style="text-align:center;"></div>
  <figcaption>
    <strong>Why a car parks sideways — the bracket made visible.</strong> The car may
    only <em>drive</em> (forward/back) and <em>steer</em>, never slide sideways. It
    executes four moves — forward, steer-left arc, back, steer-right arc — trying to
    return to where it started. It doesn't: it ends up displaced <em>sideways</em> (the
    orange arrow). That leftover gap is the bracket [drive, steer] = sideways, and its
    size grows like the <em>square</em> of the maneuver, which is exactly why sideways is
    a "weight-2" direction — twice as hard to reach as a direction you can drive along
    directly. Stack another indirection (a trailer angle) and you get weight 3.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-bracket");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 520, H = 250, cx = 150, cy = 150;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };
  // the (x,y) trace of a car doing a forward / steer / back / unsteer commutator wiggle.
  // integrate: heading th, drive u1 (+/-), steer u2 (+/-); dz sideways accumulates.
  const seg = 60, dt = 1 / seg, L = 78;
  let x = cx, y = cy, th = -Math.PI / 2; // pointing up
  const pts = [[x, y]];
  function run(u1, u2) {
    for (let i = 0; i < seg; i++) {
      th += u2 * dt;
      x += u1 * Math.cos(th) * L * dt;
      y += u1 * Math.sin(th) * L * dt;
      pts.push([x, y]);
    }
  }
  run(1, 0.9); run(0, 0); run(-1, -0.9); // forward+left, (straighten), back+right
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  // start & end markers
  svg.appendChild(el("path", { d: path, fill: "none", stroke: "#2b6cb0", "stroke-width": 2.2, "stroke-linecap": "round" }));
  svg.appendChild(el("circle", { cx: cx, cy: cy, r: 4, fill: "#2b6cb0" }));
  svg.appendChild(el("text", { x: cx - 8, y: cy + 4, "text-anchor": "end", "font-size": 11, fill: "#2b6cb0", "font-family": SANS }, "start"));
  const end = pts[pts.length - 1];
  svg.appendChild(el("circle", { cx: end[0], cy: end[1], r: 4, fill: "#e65100" }));
  // net displacement arrow start->end
  svg.appendChild(el("line", { x1: cx, y1: cy, x2: end[0], y2: end[1], stroke: "#e65100", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
  svg.appendChild(el("text", { x: end[0] + 8, y: end[1] + 4, "text-anchor": "start", "font-size": 11.5, fill: "#e65100", "font-family": SANS, "font-weight": 600 }, "net sideways"));
  // legend
  svg.appendChild(el("text", { x: 300, y: 60, "font-size": 12.5, fill: "#333", "font-family": SANS, "font-weight": 600 }, "allowed moves:"));
  svg.appendChild(el("text", { x: 300, y: 80, "font-size": 12, fill: "#2b6cb0", "font-family": SANS }, "→ drive (forward / back)"));
  svg.appendChild(el("text", { x: 300, y: 98, "font-size": 12, fill: "#2b6cb0", "font-family": SANS }, "↻ steer"));
  svg.appendChild(el("text", { x: 300, y: 128, "font-size": 12.5, fill: "#333", "font-family": SANS, "font-weight": 600 }, "achieved by combining:"));
  svg.appendChild(el("text", { x: 300, y: 148, "font-size": 12, fill: "#e65100", "font-family": SANS }, "↔ sideways = [drive, steer]"));
  svg.appendChild(el("text", { x: 300, y: 172, "font-size": 11, fill: "#777", "font-family": SANS }, "a \"weight-2\" direction:"));
  svg.appendChild(el("text", { x: 300, y: 188, "font-size": 11, fill: "#777", "font-family": SANS }, "displacement ~ (wiggle size)²"));
})();
</script>

Now, one system at a time.

## Heisenberg $H^3$ — a charged particle, and the shortest fence

**The system.** Picture a charged particle moving in a plane with a magnetic field
pointing straight up out of it. The Lorentz force curves its path into circles —
*Larmor orbits*. Track a third number alongside its position: the **magnetic flux**
swept out by its trajectory, which is just the signed area it encloses. Position plus
that area is the Heisenberg group, and the particle's circular orbits are *exactly*
its sub-Riemannian geodesics.

**The everyday version.** A boat that can go forward/back and left/right, with a meter
that ticks up by the signed area it encloses. "Get home having enclosed exactly this
much area, by the shortest possible route" is the ancient **isoperimetric (Dido)
problem** — and its answer is a circular arc. The area is the "vertical" coordinate,
and you can only change it by *going around* — never directly.

**Where it also lives.** Heisenberg is literally the algebra of quantum mechanics:
position and momentum with $[x, p] = i\hbar$, the center being phase. It underlies the
uncertainty principle, the Gabor transform, and time–frequency analysis.

**Growth vector $(2,3)$; caustic.** Two directly-drivable directions, one area
coordinate reached by a bracket (weight 2). As the series proves, the caustic collapses
to a line: every orbit of a given curvature refocuses at the same phase point after one
full turn, at time $2\pi/|w|$. It is the *flat* reference — the simplest possible
version of "reaching the unreachable."

## SE(2) — the parking car and the visual cortex

**The system.** A car (or bicycle, or unicycle) that drives forward and steers but
cannot slip sideways: the **Dubins/Reeds–Shepp car** of robot motion planning. Its
configuration is position plus heading, the group $\mathrm{SE}(2)$, and its
length-optimal paths are the workhorses of autonomous-vehicle planners.

**The surprising twin.** Your **visual cortex** runs the same geometry. Area V1 lifts
each edge to a (position, orientation) pair and completes broken contours along
$\mathrm{SE}(2)$ geodesics — the "association field" of Petitot and Citti–Sarti that
explains illusory contours like the Kanizsa triangle. The
[Geometry of Seeing]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
series is entirely about this group.

**The shape of its geodesics.** They are **Euler's elastica** — the curve a thin springy
rod bends into. So the optimal path of a parking car, the contour your brain hallucinates,
and the shape of a bent leaf-spring are the *same* curve.

**Growth vector $(2,3)$; the aliasing.** Same as Heisenberg — which is the whole point of
the series' hardest case: zoomed in, a parking car and a magnetic orbit are
indistinguishable. Only the *finite-scale* curvature (the deviation $\delta$) tells SE(2)
from Heisenberg (Part 3).

## Engel — the truck with one trailer

**The system.** A car towing a single trailer. Its state is (position, cab heading,
**trailer heading**) — four numbers. You steer the cab directly, but the trailer angle
you can only change *indirectly*, by driving while turning. Engel is the nilpotent model
of this generic car-with-trailer kinematics.

**Why backing up a trailer is hard.** The trailer heading is a **weight-3** coordinate:
reaching it needs a bracket of a bracket — a maneuver nested two deep. That is the precise
mathematical reason a trailer is so much harder to reverse into a spot than a car: its
key coordinate is buried one indirection deeper than the car's sideways slide.

**Growth vector $(2,3,4)$; abnormals.** And Engel is the first group in the series with
**abnormal geodesics** — special optimal motions (here, driving dead straight) that owe
their optimality to the *shape* of the constraints, not the metric. That yes/no bit is a
robust fingerprint (Part 3, Appendix C5).

## Cartan $(2,3,5)$ — two trailers, and rolling spheres

**The everyday version.** Add a *second* trailer and the deepest coordinate sinks one level
further, giving the growth vector $(2,3,5)$.

**The beautiful version.** Take two spheres, one rolling on the other **without slipping and
without twisting**. The allowed motions (two independent rolling directions) generate a
$(2,3,5)$ distribution — and when the radius ratio is exactly **1 : 3**, this humble system
has the *exceptional Lie group* $G_2$ as its symmetry. This is the system Élie Cartan
singled out in his 1910 "five variables" paper; the rolling-sphere realization is one of the
few places the largest of the exceptional groups shows up in something you could build on a
desk.

**Growth vector $(2,3,5)$; abnormals present.** Its deepest coordinate is the most
noise-fragile to recover — which is exactly why the detector finds Cartan the hardest of the
four to pin down under noise (Part 3).

## SE(3) — the MRI scanner and the drone

**The system.** Move through 3D space *and* carry an orientation: position in
$\mathbb{R}^3$ plus a direction on the sphere $S^2$, the group $\mathrm{SE}(3)$ (modulo
roll). You may go **forward** along your axis and **reorient** that axis two ways, but not
slide sideways — a rank-**three** structure, the first in the series with three drivable
directions.

**Where it lives.**

- **Diffusion MRI.** Each voxel of brain white matter records the local nerve-fibre
  direction; tracing a tract means following $\mathrm{SE}(3)$ geodesics through position +
  orientation. This is Duits' fibre-tracking geometry, and the real-world target of the
  series' final post.
- **Drones and aircraft.** A fixed-wing craft flies forward and can pitch and yaw
  (reorienting its axis) but cannot translate sideways — the same rank-3 structure. Roll is
  generated by the bracket of the two reorientations.
- **Surgical needle steering.** A bevel-tipped needle pushed through tissue turns as it
  advances: forward + reorient, nonholonomic 3D steering.

**Growth vector $(3,6)$.** Three drivable directions; the three brackets fill all six
dimensions at once (reorienting two ways makes a roll; reorienting while moving makes the
two sideways translations). Rank three is *loud* — no rank-two group can imitate it — so the
detector separates SE(3) from all the earlier groups the instant it measures the growth
vector (Part 4).

## Summary: the groups as machines

| Group | Real-world system | Allowed moves | Hidden coordinate (weight) | Growth vector |
|---|---|---|---|---|
| **Heisenberg** | charged particle in a magnetic field; the shortest-fence (Dido) problem; quantum phase space | move in the plane | enclosed area / flux (2) | $(2,3)$ |
| **SE(2)** | parking car (Dubins); visual-cortex contour completion | drive + steer | sideways slip (2) | $(2,3)$ |
| **Engel** | car with **one** trailer | drive + steer | trailer angle (3) | $(2,3,4)$ |
| **Cartan** | car with **two** trailers; two spheres rolling ($G_2$ at 1:3) | two rolling directions | deepest trailer/roll angle (3) | $(2,3,5)$ |
| **SE(3)** | diffusion-MRI fibre tracking; drone/aircraft; steerable needle | drive forward + reorient axis (×2) | sideways + roll (2) | $(3,6)$ |

The pattern to carry into the rest of the appendices: **the growth vector is nonholonomic
parking difficulty**, made into a number. Weight 1 is a direction you drive; weight 2 needs
one wiggle (a bracket); weight 3 needs a wiggle of wiggles. That number is the coarse
fingerprint — the first thing the inverse detector reads off a field of caustics, and the
thing that sorts a magnetic orbit, a trailer truck, and an MRI fibre field into three
different geometric species.

## Glossary

- **Nonholonomic** — a system whose allowed velocities are restricted, but which can still
  reach any configuration by combining them (a car reaches any parking spot despite not
  sliding sideways).
- **Bracket** — the net motion from combining two allowed moves in a back-and-forth wiggle;
  reaches directions neither move gives alone.
- **Growth vector** — how many coordinates are reached at each "bracket depth": directly
  (weight 1), by one bracket (weight 2), by a nested bracket (weight 3), …
- **Larmor orbit** — the circular path of a charged particle in a magnetic field; the
  Heisenberg geodesic.
- **Dubins / Reeds–Shepp car** — a vehicle that drives and steers without side-slip; the
  $\mathrm{SE}(2)$ model.
- **Euler elastica** — the shape of a bent elastic rod; the $\mathrm{SE}(2)$ geodesic.
- **Abnormal geodesic** — an optimal motion forced by the *shape* of the constraints rather
  than the metric (e.g. driving a trailer dead straight); present for Engel, Cartan, SE(3),
  absent for Heisenberg, SE(2).

## References

- A. M. Vershik &amp; V. Ya. Gershkovich (1994). "Nonholonomic dynamical systems, geometry of
  distributions and variational problems." <em>Dynamical Systems VII</em>, Springer.
- R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their Geodesics and
  Applications</em>. AMS Mathematical Surveys and Monographs 91. (Rolling spheres, $G_2$,
  abnormal geodesics.)
- J.-P. Laumond, ed. (1998). <em>Robot Motion Planning and Control</em>. Springer LNCIS 229.
  (Car-with-trailers nonholonomic control.)
- J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact structure."
  <em>J. Physiol. Paris</em> 97, 265–309.
- R. Duits, A. Ghosh, T. C. J. Dela Haije &amp; A. Mashtakov (2013). "On sub-Riemannian
  geodesics in $\mathrm{SE}(3)$ whose spatial projections do not have cusps."
  <a href="https://arxiv.org/abs/1305.6061">arXiv:1305.6061</a>.
- G. Bor &amp; R. Montgomery (2009). "$G_2$ and the rolling distribution."
  <em>Enseign. Math.</em> 55, 157–196.
</div><!-- /.l-body -->
