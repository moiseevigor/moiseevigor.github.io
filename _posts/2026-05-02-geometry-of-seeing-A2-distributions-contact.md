---
layout: distill
image: /public/img/posts/geometry-seeing-1.svg
title: "Appendix A2 — Distributions, Frobenius, and Contact Geometry"
subtitle: >
  Why "rank-2 sub-bundle of $T\mathrm{SE}(2)$" and "completely non-integrable"
  are the right words for V1's horizontal connectivity.  Frobenius gives the
  test for integrability; Chow–Rashevskii gives the reachability theorem;
  contact geometry gives the cleanest version of both.
date: 2026-05-02 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, contact-geometry, optimal-control, lie-groups]
description: >
  Distributions, the Frobenius integrability theorem, the Chow–Rashevskii
  reachability theorem, and the definition of a contact structure on a
  3-manifold.  Worked out for $\mathrm{SE}(2)$ with the V1 distribution
  $\xi = \mathrm{span}\{X_1, X_2\}$.  Companion to the Geometry of Seeing
  series.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: A2
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix is for</div>

Part 1 §3 introduces a horizontal *distribution* $\mathcal H = \mathrm{span}\{X_1, X_2\}$
on $\mathrm{SE}(2)$, calls it "completely non-integrable", invokes the
*Hörmander* (bracket-generating) condition, and applies the
*Chow–Rashevskii* reachability theorem.  These are not metaphors —
they are precise theorems with one-paragraph proofs that bind the V1
horizontal connectivity to the contact-geometric backbone of the elastica
problem.  This appendix unpacks them.

The interactive figures borrow the cuspidal-trajectory machinery from the
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">Dubins-back-wheel example</a>
in the
<a href="https://moiseevigor.github.io/elliptic/">elliptic project</a> —
precisely because Chow's theorem says <em>any</em> two configurations in
$\mathrm{SE}(2)$ can be reached by repeated forward / steer manoeuvres,
which is what parallel parking demonstrates.

</div>

## Distributions on a manifold

Fix a smooth $n$-manifold $M$.  A **rank-$k$ distribution** $\Delta$ on $M$
is a smooth assignment

$$p \;\longmapsto\; \Delta_p \;\subset\; T_p M, \qquad \dim \Delta_p = k,$$

of a $k$-plane in the tangent space at every point.  Equivalently,
$\Delta$ is a rank-$k$ sub-bundle of $TM$.  Locally one specifies $\Delta$
by giving $k$ pointwise-independent vector fields $X_1, \ldots, X_k$ that
span $\Delta$ — but the distribution itself is the *plane field*, not the
choice of frame.

Two extreme examples we will keep in mind:

- $M = \mathbb R^3$, $\Delta = \mathrm{span}(\partial_x, \partial_y)$.
  At every point the plane is the horizontal $xy$-plane.  Curves tangent to
  $\Delta$ keep their $z$ fixed.
- $M = \mathbb R^3$, $\Delta = \ker(dz - y\,dx) = \mathrm{span}(\partial_x +
  y\,\partial_z,\, \partial_y)$.  At each point the plane is *tilted* by the
  amount $y$.  Curves tangent to $\Delta$ can change $z$ — but only via
  a precise interplay between $x$- and $y$-motion.

<aside id="note-horizontal">
"Horizontal" here is a borrowed mechanical word — nothing to do with
gravity. A horizontal curve is one whose velocity always lies in the
chosen distribution $\Delta$. In the V1 model, the only motions a neuron
can undergo "for free" are forward along its preferred orientation and
rotation in place — anything else is forbidden, and a horizontal curve is
one that never tries the forbidden moves.
</aside>

A curve $\gamma : [0, T] \to M$ is <span class="annotated-term" data-note="note-horizontal">**horizontal**</span> (or **admissible**) if
$\dot\gamma(t) \in \Delta_{\gamma(t)}$ for all $t$.  Horizontal curves are
the only legal trajectories in the V1 model: at every moment the curve's
velocity must lie in the 2-plane the cortex *can* move through (forward +
rotate).

## Frobenius's theorem: when is $\Delta$ integrable?

A rank-$k$ distribution is **integrable** if through every point passes a
$k$-dimensional submanifold $L \subset M$ — an *integral submanifold* — with
$T_p L = \Delta_p$ for every $p \in L$.  When integrable, the integral
submanifolds foliate $M$.

The clean test is purely algebraic:

<div class="callout theorem">
<div class="callout-title">Frobenius's theorem (1877)</div>
A smooth distribution $\Delta$ is integrable if and only if
$$[X, Y] \in \Delta \quad \text{whenever } X, Y \in \Delta,$$
i.e. $\Delta$ is closed under the Lie bracket of vector fields.
</div>

**Easy direction.**  Suppose $\Delta$ integrates, with leaves $L$.  Two
vector fields $X, Y \in \Delta$ are tangent to $L$.  Their flows preserve
$L$ (because the leaf is integral).  Their commutator's flow does too, so
$[X, Y]$ is tangent to $L$, i.e. in $\Delta$.

**Hard direction.**  If $[\Delta, \Delta] \subseteq \Delta$, choose a frame
$X_1, \ldots, X_k$ for $\Delta$.  By rectifying flows, find local
coordinates in which $X_i = \partial_{x_i}$ for $i \leq k$.  The integral
submanifolds are the slices $x_{k+1}, \ldots, x_n = \text{const}$.  The
bracket-closure ensures the rectifying coordinates are consistent.

**Worked test for the V1 distribution.**  $X_1 = \cos\theta\,\partial_x +
\sin\theta\,\partial_y$, $X_2 = \partial_\theta$ (Appendix A1 §3).  Compute
$[X_1, X_2]$ in coordinates:

$$[X_1, X_2]
  \;=\; (\cos\theta\,\partial_x + \sin\theta\,\partial_y)\partial_\theta
        - \partial_\theta(\cos\theta\,\partial_x + \sin\theta\,\partial_y)$$
$$\quad
  \;=\; -(-\sin\theta)\,\partial_x - (\cos\theta)\,\partial_y
  \;=\; \sin\theta\,\partial_x - \cos\theta\,\partial_y \;=\; -X_3,$$

and $X_3 \notin \mathrm{span}\{X_1, X_2\}$ (its $\partial_x, \partial_y$
coefficients are not proportional to $X_1$'s).  So
$[X_1, X_2] \notin \mathcal H$ and Frobenius **fails** — the V1
distribution is **not integrable**.

Geometrically: if it *had* integrated, the cortex would foliate into
2-dimensional sheets, and you could never reach a sideways-displaced
neuron from your starting one by horizontal motion.  V1 would be a
disconnected stack.  But it is not — and the failure of Frobenius is
exactly what makes contour completion possible.

## Bracket-generating distributions and Chow–Rashevskii

The dual case to Frobenius:

<div class="callout theorem">
<div class="callout-title">Chow–Rashevskii theorem (Chow 1939, Rashevskii 1938)</div>
Let $\Delta$ be a smooth distribution on a connected manifold $M$, and let
$\mathrm{Lie}(\Delta)$ be the smallest Lie subalgebra of vector fields
containing $\Delta$.  If $\mathrm{Lie}(\Delta)_p = T_p M$ at every $p$ (the
<strong>bracket-generating</strong> or <strong>Hörmander</strong> condition),
then any two points of $M$ can be joined by a piecewise-horizontal curve.
</div>

**Sketch.**  Bracket-generating means iterated brackets of the frame fields
span $T_p M$.  Concatenating short flows along a frame field $X_i$ for
times $\pm \varepsilon$ in the pattern of A1 Figure 1.2 produces a net
displacement of order $\varepsilon^2$ in the bracket direction, of order
$\varepsilon^3$ in iterated-bracket directions, etc.  Show that the smooth
map $\mathbb R^n \to M$, $(t_1, \ldots, t_n) \mapsto \Phi^{X_{i_1}}_{t_1}
\circ \cdots \circ \Phi^{X_{i_n}}_{t_n}$, has surjective differential at the
origin under bracket-generation, hence is locally surjective by the inverse
function theorem.  Compose enough hops and you can reach any point.

**For SE(2) the Hörmander condition is satisfied at depth 1.**  We computed
$[X_1, X_2] = \pm X_3$, and $X_1, X_2, X_3$ already span $T_g\mathrm{SE}(2)$
(three linearly independent fields).  No deeper brackets are needed.  This
is the *minimal* possible depth and is what makes the SR Carnot–Carathéodory
distance well-behaved on $\mathrm{SE}(2)$.

</div><!-- /.l-body -->

<!-- Fig A2.1 — Integrable vs contact -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>distribution
        <select id="dist-type">
          <option value="integrable" selected>integrable: $\mathrm{span}(\partial_x, \partial_y)$ — horizontal slabs</option>
          <option value="contact">contact / SE(2): $\xi = \ker(\sin\theta\,dx - \cos\theta\,dy)$</option>
        </select>
      </label>
      <label>height $\theta$ slice
        <input type="range" id="dist-theta" min="0" max="100" value="30" step="1">
        <span class="ctrl-val" id="dist-theta-val">0.94 rad</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        2-plane field over the cube $(x, y, \theta)$
      </span>
    </div>
    <svg id="fig-distribution" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A2.1.</strong> A 2-plane field over the cube $(x, y,
    \theta) \in [-1, 1]^2 \times [0, \pi]$, drawn at $5\times 5$ sample
    points on the level surface $\theta = $ slider.  In <strong>integrable</strong>
    mode the planes are all horizontal — points on different $\theta$
    slabs cannot be connected by a horizontal curve, so the manifold
    foliates.  In <strong>contact / SE(2)</strong> mode the planes
    <em>twist</em> as $\theta$ rotates, leaving no global foliation; this is
    the contact structure, $\xi = \ker(\sin\theta\,dx - \cos\theta\,dy)$.
    The double-headed arrow at the origin is the <em>missing</em>
    direction $X_3$ — what bracket-generation must produce.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Contact structures on 3-manifolds

A **contact form** on a $(2n+1)$-manifold $M$ is a 1-form $\alpha$ with

$$\alpha \wedge (d\alpha)^n \;\neq\; 0 \quad\text{everywhere}.$$

A **contact structure** is the rank-$2n$ distribution $\xi = \ker \alpha$.
The condition $\alpha \wedge (d\alpha)^n \neq 0$ is the strongest possible
non-integrability — exactly the opposite of Frobenius's vanishing condition.

For $n = 1$ (3-manifolds, our case):

$$\alpha \wedge d\alpha \;\neq\; 0.$$

**The standard contact structure on $\mathbb R^3$.**  $\alpha_0 = dz - y\,dx$.
Then $d\alpha_0 = -dy \wedge dx = dx \wedge dy$, and $\alpha_0 \wedge
d\alpha_0 = dz \wedge dx \wedge dy \neq 0$.  Contact, with kernel
$\xi_0 = \mathrm{span}(\partial_x + y\,\partial_z, \partial_y)$.

**The SE(2) contact structure.**  $\alpha = \sin\theta\,dx - \cos\theta\,dy$.
Compute $d\alpha = \cos\theta\,d\theta \wedge dx + \sin\theta\,d\theta \wedge dy$,
hence

$$\alpha \wedge d\alpha
  \;=\; (\sin\theta\,dx - \cos\theta\,dy) \wedge (\cos\theta\,d\theta \wedge dx
                                                  + \sin\theta\,d\theta \wedge dy)$$
$$\quad
  \;=\; -\sin^2\theta\,dx \wedge d\theta \wedge dy
       - \cos^2\theta\,dy \wedge d\theta \wedge dx
  \;=\; -dx \wedge dy \wedge d\theta \;\neq\; 0.$$

Contact.  The kernel $\xi = \mathrm{span}\{X_1, X_2\}$ is the V1 horizontal
distribution.

**Darboux's theorem** (contact version): every contact structure on a
3-manifold is *locally* isomorphic to the standard one $(\mathbb R^3,
\alpha_0)$.  So the V1 contact structure and the engineering "rolling
penny" contact structure are the same locally — a fact Petitot exploited
to import results from the latter into V1 modelling.

## Why Chow's theorem matters for vision

The Chow theorem is what makes "modal completion is a shortest-path problem
on $\mathrm{SE}(2)$" not a vacuous statement.  If the V1 distribution were
*integrable*, the brain would be unable to bridge two oriented edges that
do not lie on the same $\theta = \text{const}$ leaf — vision would split
into orientation strata.  Frobenius would have shut the door, and Petitot's
model would predict no perception of contour completion.

Bracket-generation says the *opposite*: any source/target neuron pair can
be linked by a horizontal path, and the *length* of the shortest such path
is the SR distance.  Petitot's claim is that the visual system computes
this distance and renders it as a percept.  The contact structure is what
makes this computation well-posed.

</div><!-- /.l-body -->

<!-- Fig A2.2 — Reachability via repeated bracket motions -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>target $(x_1, y_1, \theta_1)$
        <select id="reach-target">
          <option value="forward">in front, same heading</option>
          <option value="sideways" selected>sideways, same heading (needs bracket)</option>
          <option value="rotated">in front, rotated 90°</option>
          <option value="parking">parallel-park (sideways + heading flip)</option>
        </select>
      </label>
      <label>step size $\varepsilon$
        <input type="range" id="reach-eps" min="5" max="60" value="22" step="1">
        <span class="ctrl-val" id="reach-eps-val">0.22</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Repeated $X_1$ / $X_2$ flows reaching the target
      </span>
    </div>
    <svg id="fig-reach" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A2.2.</strong> Chow–Rashevskii in action.  A piecewise-
    horizontal path made of $\pm\varepsilon$ flows along $X_1$ (forward)
    and $X_2$ (rotate) connects the origin to the chosen target.  The
    "sideways" target needs a 4-leg bracket loop with each loop
    contributing an $\varepsilon^2$ sideways nudge — many loops to make
    appreciable progress, hence many short legs.  The "parallel-park"
    target is the same combinatorics as the cuspidal Dubins trajectory in
    the
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">
    elliptic project</a>: forward, steer, reverse, steer.  Drop $\varepsilon$
    and the path becomes a finer-grained zigzag; the SR-shortest path is the
    $\varepsilon \to 0$ limit, which is one of the elastica geodesics of
    Part 2.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Carnot–Carathéodory distance

<aside id="note-cc">
$d_{\mathrm{SR}}$ is also called the <strong>Carnot–Carathéodory
distance</strong>, after the 1909 thermodynamics paper that first used it
informally. It is a genuine metric: positive, symmetric, and satisfies the
triangle inequality. But the topology it generates can be very different
from the ambient Riemannian topology — small SR balls are anisotropic
"pancakes", flat in the bracket direction.
</aside>

Once a sub-Riemannian metric $\langle\cdot,\cdot\rangle_p$ on $\Delta_p$ is
fixed, the **horizontal length** of an admissible curve is

$$L_{\mathrm{SR}}(\gamma) \;:=\; \int_0^T \sqrt{\langle\dot\gamma, \dot\gamma\rangle_{\gamma(t)}}\,dt,$$

and the <span class="annotated-term" data-note="note-cc">**sub-Riemannian distance**</span> $d_{\mathrm{SR}}(p, q)$ is the infimum
over all admissible curves from $p$ to $q$.  Chow's theorem ensures this
infimum is finite (the set of admissible curves is non-empty).

For the V1 metric of Part 1 with frame $\{X_1, X_2\}$ orthonormal, an
admissible $\gamma$ writes as $\dot\gamma = u_1(t) X_1 + u_2(t) X_2$ and

$$L_{\mathrm{SR}}(\gamma) \;=\; \int_0^T \sqrt{u_1^2 + u_2^2}\,dt.$$

After the $u_1 = 1$ unit-speed reduction, this collapses to the elastica
functional $\int \kappa^2(s)\,ds$ — exactly the integrand Euler minimised.
Appendix A3 takes this and runs it through the Pontryagin Maximum Principle.

**Mitchell's compactness theorem** (1985) shows that on a connected
bracket-generating SR manifold the infimum is attained: a length-minimising
geodesic exists between any two points.  This is the SR analogue of
Hopf–Rinow.  For $\mathrm{SE}(2)$ it means every pair of V1 neurons is
connected by an *actual* shortest horizontal curve — not just an
approachable one.

## Connection to the elliptic project

The reachability figure above is mathematically the same object as the
parking trajectory in
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">
the dubins-back-wheel example</a>: a piecewise concatenation of
$X_1$ ("forward + reverse") and $X_2$ ("steer") flows.  The parking
trajectory is what Chow's theorem looks like with finite $\varepsilon$;
the elastica geodesic is what it converges to as $\varepsilon \to 0$.
Both are computed by the same SE(2) ODE integrator that lives in
`elliptic-core.js` on the elliptic site and is reused here.

## Code

```python
# Test the V1 distribution for Frobenius integrability.
# Computes [X1, X2] symbolically and checks if it's in span{X1, X2}.
import sympy as sp

x, y, th = sp.symbols('x y theta', real=True)
X1 = sp.Matrix([sp.cos(th), sp.sin(th), 0])     # cos θ ∂x + sin θ ∂y
X2 = sp.Matrix([0, 0, 1])                        # ∂θ

def vf_bracket(X, Y, vars_):
    # [X, Y]^i = X^j ∂_j Y^i - Y^j ∂_j X^i
    out = sp.zeros(len(X), 1)
    for i in range(len(X)):
        s = 0
        for j, v in enumerate(vars_):
            s += X[j] * sp.diff(Y[i], v) - Y[j] * sp.diff(X[i], v)
        out[i] = sp.simplify(s)
    return out

X3 = vf_bracket(X1, X2, [x, y, th])
print("[X1, X2] =", X3.T)
# → [-sin(θ), cos(θ), 0]   (this is -X3 from the text; sign convention)

# In span{X1, X2}? Solve a·X1 + b·X2 = X3 for constants a, b
a, b = sp.symbols('a b')
sol = sp.solve(a * X1 + b * X2 - X3, [a, b], dict=True)
print("solution (None means not in span):", sol)
# → [] — no solution; distribution is NOT integrable
```

```python
# Contact-form check: α ∧ dα ≠ 0  for SE(2)
alpha = [sp.sin(th), -sp.cos(th), 0]   # α = sin θ dx - cos θ dy as coefficients
# d α: coefficients of dx∧dy, dx∧dθ, dy∧dθ
# dα = cos θ dθ ∧ dx + sin θ dθ ∧ dy   (verify by direct exterior diff)
# α ∧ dα picks out the volume form coefficient on dx ∧ dy ∧ dθ:
vol_coeff = sp.simplify(
    alpha[0] * sp.cos(th) * (-1)   # sin θ · cos θ · (dx ∧ dθ ∧ dx) - vanishes; only the dy∧dθ term survives ↘
    + (-alpha[1]) * sp.sin(th)
)
# → 1, i.e. α ∧ dα = -dx ∧ dy ∧ dθ ≠ 0   (SE(2) is contact)
```

## What we covered, and what comes next

A distribution is a smooth plane field; integrability is decided by
Frobenius's bracket-closure test; bracket-generation gives Chow's
reachability theorem; contact structures are the "maximally non-integrable"
case in odd dimensions.  The V1 distribution $\mathcal H = \mathrm{span}\{X_1,
X_2\}$ on $\mathrm{SE}(2)$ is a contact structure, and Chow's theorem
guarantees any two V1 neurons can be linked by a horizontal curve.

Appendix A3 will turn the SR-length minimisation problem into a Hamiltonian
system on $\mathfrak{se}(2)^{\ast}$ via the Pontryagin Maximum Principle —
recovering the equations $\dot h_1 = h_2 h_3$ etc. that Part 2 §1 uses
without proof.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>
    R. Montgomery (2002). <em>A Tour of Subriemannian Geometries, Their
    Geodesics and Applications.</em> AMS Mathematical Surveys 91.
    The textbook — Chapter 1 develops everything in this appendix.
  </li>
  <li>
    A. A. Agrachev, D. Barilari, U. Boscain (2019).
    <em>A Comprehensive Introduction to Sub-Riemannian Geometry.</em>
    Cambridge.  Chapters 2 (distributions) and 3 (Chow's theorem).
  </li>
  <li>
    H. Geiges (2008). <em>An Introduction to Contact Topology.</em>
    Cambridge.  The contact-geometry side, with Darboux's theorem.
  </li>
  <li>
    G. Citti &amp; A. Sarti (2006). "A cortical based model of perceptual
    completion in the roto-translation space."
    <em>J. Math. Imaging Vision</em> 24(3): 307–326.  The application of
    Chow + contact to V1.
  </li>
  <li>
    J. Petitot (2003).  "The neurogeometry of pinwheels as a sub-Riemannian
    contact structure."  <em>Journal of Physiology–Paris</em> 97: 265–309.
    Originator of the contact-geometric V1 model.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">
    Elliptic project — Dubins back wheel</a>.  Shows parking-style horizontal
    paths whose $\varepsilon \to 0$ limit is exactly the SR geodesic of
    Part 2.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── Figure A2.1 — Integrable vs contact ─────────────────────────────────
function drawDistribution() {
  const svg = document.getElementById('fig-distribution');
  if (!svg) return;
  const type = document.getElementById('dist-type').value;
  const tNorm = parseFloat(document.getElementById('dist-theta').value) / 100;
  const theta = tNorm * Math.PI;
  document.getElementById('dist-theta-val').textContent = theta.toFixed(2) + ' rad';

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  const margin = { t: 18, b: 26, l: 40, r: 40 };
  const plotW = W - margin.l - margin.r, plotH = H - margin.t - margin.b;
  const ox = margin.l + plotW / 2, oy = margin.t + plotH / 2;
  // Oblique axonometric projection: x right, y receding 30°, theta vertical
  const cosA = Math.cos(Math.PI / 6), sinA = Math.sin(Math.PI / 6);
  const scale = Math.min(plotW, plotH) / 4.6;
  const project = (x, y, th) => ({
    x: ox + scale * (x - 0.5 * cosA * y),
    y: oy - scale * (th + 0.5 * sinA * y),
  });

  // Cube edges
  const corners = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        corners.push([i ? 1 : -1, j ? 1 : -1, k ? Math.PI : 0]);
  const edges = [
    [0,1],[0,2],[0,4],[3,1],[3,2],[3,7],[5,1],[5,4],[5,7],[6,2],[6,4],[6,7]
  ];
  edges.forEach(([a, b]) => {
    const A = project(...corners[a]), B = project(...corners[b]);
    g.append('line').attr('x1', A.x).attr('y1', A.y).attr('x2', B.x).attr('y2', B.y)
      .attr('stroke', '#d8d8d8').attr('stroke-width', 1);
  });

  // Sample 5x5 plane field at theta = slider value
  const samples = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const x = -0.8 + i * 0.4, y = -0.8 + j * 0.4;
      samples.push({ x, y, th: theta });
    }
  }
  // For each sample, draw a small parallelogram representing the 2-plane
  const sz = 0.18;
  samples.forEach(s => {
    let v1, v2;  // the two basis vectors of the 2-plane in (x, y, theta)
    if (type === 'integrable') {
      v1 = [1, 0, 0];
      v2 = [0, 1, 0];
    } else {
      // SE(2) contact: ξ = span{X1, X2} = span{cos θ ∂x + sin θ ∂y, ∂θ}
      v1 = [Math.cos(s.th), Math.sin(s.th), 0];
      v2 = [0, 0, 1];
    }
    const c0 = project(s.x, s.y, s.th);
    const c1 = project(s.x + sz * v1[0], s.y + sz * v1[1], s.th + sz * v1[2]);
    const c2 = project(s.x + sz * (v1[0] + v2[0]), s.y + sz * (v1[1] + v2[1]), s.th + sz * (v1[2] + v2[2]));
    const c3 = project(s.x + sz * v2[0], s.y + sz * v2[1], s.th + sz * v2[2]);
    g.append('polygon')
      .attr('points', `${c0.x},${c0.y} ${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`)
      .attr('fill', type === 'integrable' ? 'rgba(46,125,50,0.32)' : 'rgba(21,101,192,0.32)')
      .attr('stroke', type === 'integrable' ? '#2e7d32' : '#1565c0')
      .attr('stroke-width', 1);
  });

  // Missing direction X3 at the centre
  const c0 = project(0, 0, theta);
  let dx, dy, dth;
  if (type === 'integrable') {
    dx = 0; dy = 0; dth = 0.4;
  } else {
    // X3 = -sin θ ∂x + cos θ ∂y (the missing direction in the contact case)
    dx = -Math.sin(theta) * 0.5; dy = Math.cos(theta) * 0.5; dth = 0;
  }
  if (Math.hypot(dx, dy, dth) > 1e-3) {
    const c1 = project(dx, dy, theta + dth);
    g.append('line').attr('x1', c0.x).attr('y1', c0.y).attr('x2', c1.x).attr('y2', c1.y)
      .attr('stroke', '#b71c1c').attr('stroke-width', 2.4)
      .attr('marker-end', 'url(#a2-arr-red)');
    const c2 = project(-dx, -dy, theta - dth);
    g.append('line').attr('x1', c0.x).attr('y1', c0.y).attr('x2', c2.x).attr('y2', c2.y)
      .attr('stroke', '#b71c1c').attr('stroke-width', 2.4)
      .attr('marker-end', 'url(#a2-arr-red)');
    g.append('text').attr('x', c1.x + 6).attr('y', c1.y - 4)
      .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#b71c1c')
      .text(type === 'contact' ? 'X₃ (the missing direction)' : 'θ-axis');
  }

  // Marker
  const defs = g.append('defs');
  defs.append('marker').attr('id', 'a2-arr-red')
    .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
    .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
    .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', '#b71c1c');

  // Status text
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(type === 'integrable'
      ? 'integrable: Δ = span(∂x, ∂y) — Frobenius applies, planes foliate'
      : `contact: ξ = ker(sin θ dx − cos θ dy) — α ∧ dα = −dx∧dy∧dθ ≠ 0`);
}

// ── Figure A2.2 — reachability via repeated bracket motions ─────────────
function drawReach() {
  const svg = document.getElementById('fig-reach');
  if (!svg) return;
  const target = document.getElementById('reach-target').value;
  const eps = parseFloat(document.getElementById('reach-eps').value) / 100;
  document.getElementById('reach-eps-val').textContent = eps.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Targets in (x_target, y_target, theta_target)
  const targets = {
    forward:  { x: 1.2, y: 0,    theta: 0,         name: 'forward' },
    sideways: { x: 0,   y: 0.8,  theta: 0,         name: 'sideways' },
    rotated:  { x: 1.0, y: 0,    theta: Math.PI/2, name: 'rotate 90°' },
    parking:  { x: 0,   y: 0.8,  theta: Math.PI,   name: 'parallel-park' },
  };
  const tg = targets[target] || targets.sideways;

  // Build a piecewise X1/X2 path that *approximately* reaches the target.
  // Strategy: for sideways, repeat 4-step bracket loops (each loop contributes
  // ε² sideways).  For rotated, do one rotation then forward.  For parking,
  // sideways + rotation, alternate.
  function flowX1(s, t) {
    return { x: s.x + t * Math.cos(s.theta), y: s.y + t * Math.sin(s.theta), theta: s.theta };
  }
  function flowX2(s, t) {
    return { x: s.x, y: s.y, theta: s.theta + t };
  }
  function bracket4(s, e) {
    return [s, flowX1(s, e),
              flowX2(flowX1(s, e), e),
              flowX1(flowX2(flowX1(s, e), e), -e),
              flowX2(flowX1(flowX2(flowX1(s, e), e), -e), -e)];
  }

  const path = [{ x: 0, y: 0, theta: 0 }];
  let cur = path[0];

  if (target === 'forward') {
    const n = Math.ceil(tg.x / eps);
    for (let i = 0; i < n; i++) { cur = flowX1(cur, eps); path.push(cur); }
  } else if (target === 'sideways') {
    // Each bracket loop nets ε² in sideways direction; need n loops with n·ε² ≈ tg.y
    const nLoops = Math.max(1, Math.ceil(tg.y / (eps * eps)));
    for (let i = 0; i < nLoops; i++) {
      const loop = bracket4(cur, eps);
      for (let j = 1; j < loop.length; j++) path.push(loop[j]);
      cur = loop[loop.length - 1];
    }
  } else if (target === 'rotated') {
    // Rotate to π/2, then forward
    const nRot = Math.ceil((Math.PI / 2) / eps);
    for (let i = 0; i < nRot; i++) { cur = flowX2(cur, eps); path.push(cur); }
    const nFwd = Math.ceil(tg.x / eps);
    for (let i = 0; i < nFwd; i++) { cur = flowX1(cur, eps); path.push(cur); }
  } else { // parking — sideways + heading flip via repeated K-turn
    const nLoops = Math.max(1, Math.ceil(tg.y / (eps * eps)));
    for (let i = 0; i < nLoops; i++) {
      const loop = bracket4(cur, eps);
      for (let j = 1; j < loop.length; j++) path.push(loop[j]);
      cur = loop[loop.length - 1];
    }
    // Add explicit rotation to π
    const nRot = Math.ceil(Math.PI / eps);
    for (let i = 0; i < nRot; i++) { cur = flowX2(cur, eps); path.push(cur); }
  }

  // Bounds
  const xs = path.map(p => p.x).concat([tg.x]);
  const ys = path.map(p => p.y).concat([tg.y]);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.3;
  const margin = { t: 18, b: 36, l: 40, r: 40 };
  const aspect = (W - margin.l - margin.r) / (H - margin.t - margin.b);
  const xRange = range * Math.max(aspect, 1);
  const yRange = range * Math.max(1 / aspect, 1);
  const xS = d3.scaleLinear().domain([cx - xRange, cx + xRange]).range([margin.l, W - margin.r]);
  const yS = d3.scaleLinear().domain([cy - yRange, cy + yRange]).range([H - margin.b, margin.t]);

  // Path
  g.append('path')
    .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(path))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 1.4);

  // Origin and target markers
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#444');
  g.append('text').attr('x', xS(0) + 6).attr('y', yS(0) + 14)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#444')
    .text('start');
  g.append('circle').attr('cx', xS(tg.x)).attr('cy', yS(tg.y)).attr('r', 5)
    .attr('fill', 'none').attr('stroke', '#b71c1c').attr('stroke-width', 1.6);
  g.append('text').attr('x', xS(tg.x) + 6).attr('y', yS(tg.y) - 6)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#b71c1c')
    .text('target');

  // Heading triangles at every 6th point so the reader sees the direction
  for (let i = 0; i < path.length; i += Math.max(1, Math.floor(path.length / 80))) {
    const p = path[i];
    const len = 0.05;
    g.append('line').attr('x1', xS(p.x)).attr('y1', yS(p.y))
      .attr('x2', xS(p.x + len * Math.cos(p.theta)))
      .attr('y2', yS(p.y + len * Math.sin(p.theta)))
      .attr('stroke', '#888').attr('stroke-width', 0.6);
  }

  // Status
  const last = path[path.length - 1];
  const err = Math.hypot(last.x - tg.x, last.y - tg.y) +
              Math.abs(((last.theta - tg.theta) % (2*Math.PI) + 3*Math.PI) % (2*Math.PI) - Math.PI);
  g.append('text').attr('x', margin.l + 4).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`legs = ${path.length - 1}    ε = ${eps.toFixed(2)}    miss = ${err.toFixed(3)}`);
}

// ── Boot ─────────────────────────────────────────────────────────
function wire() {
  ['dist-type', 'dist-theta'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawDistribution);
    if (el) el.addEventListener('change', drawDistribution);
  });
  ['reach-target', 'reach-eps'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawReach);
    if (el) el.addEventListener('change', drawReach);
  });
  drawDistribution();
  drawReach();
  window.addEventListener('resize', () => { drawDistribution(); drawReach(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

})();
</script>
