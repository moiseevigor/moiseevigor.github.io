---
layout: distill
image: /public/img/posts/geometry-seeing-1.svg
title: "Appendix A1 — Lie Groups, Lie Algebras, and the Exponential Map of SE(2)"
subtitle: >
  What "left-invariant vector field" really means, why the Lie bracket of two
  vector fields is the same thing as the matrix commutator, and why $\exp(tX)$
  generates a 1-parameter subgroup.  Everything Part 1 used about SE(2),
  derived from scratch.
date: 2026-05-01 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, lie-groups, lie-algebra, optimal-control]
description: >
  Self-contained primer on Lie groups and Lie algebras with SE(2) as the
  running example.  Matrix exponential, left-invariant vector fields, the Lie
  bracket as both commutator and closing-defect, adjoint and coadjoint
  actions.  Companion appendix to the Geometry of Seeing series.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: A1
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix is for</div>

Part 1 of the series uses the language of Lie groups and Lie algebras as if it
were standard furniture: $\mathrm{SE}(2)$, $\mathfrak{se}(2)$,
left-invariant vector fields $X_1 = \cos\theta\,\partial_x +
\sin\theta\,\partial_y$, the bracket $[X_1, X_2] = X_3$, the exponential map.
This appendix builds those objects from scratch.  Read it once and Part 1
becomes a calmer text.  All three figures below are powered by the same
$\mathrm{SE}(2)$ matrix exponential routine that the
<a href="https://moiseevigor.github.io/elliptic/">elliptic</a> project uses to
draw the Dubins-car
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">parking trajectories</a>.

</div>

## A Lie group is a smooth manifold that is also a group

A **Lie group** $G$ is a set carrying two compatible structures:

- a *smooth manifold structure* — locally it looks like $\mathbb R^n$ and you
  can take derivatives;
- a *group structure* — there is an associative product $G \times G \to G$, an
  identity element $e \in G$, and an inverse map $g \mapsto g^{-1}$.

Compatibility means: multiplication $(g, h) \mapsto gh$ and inversion
$g \mapsto g^{-1}$ are smooth maps.  That is the whole definition.

Examples that come up in the series:

| $G$ | Description | Dim |
|---|---|---|
| $(\mathbb R, +)$ | additive line | 1 |
| $S^1 \cong \mathrm{SO}(2)$ | unit complex numbers, rotations of the plane | 1 |
| $\mathrm{SO}(3)$ | rotations of $\mathbb R^3$ | 3 |
| $\mathrm{SE}(2) = \mathbb R^2 \rtimes \mathrm{SO}(2)$ | rigid motions of the plane | **3** |
| $\mathrm{GL}_n(\mathbb R)$ | invertible $n\times n$ matrices | $n^2$ |

Two facts you can take for granted in what follows: every closed subgroup of
$\mathrm{GL}_n(\mathbb R)$ is automatically a smooth manifold (Cartan), and
all the Lie groups we meet in the series sit inside some $\mathrm{GL}_n$ as
matrices.  So "Lie group" means **matrix group** for our purposes, and every
abstract construction has a concrete matrix incarnation.

## SE(2) as a $3\times 3$ matrix group

A configuration of $\mathrm{SE}(2)$ is a triple $(x, y, \theta)$: a
translation $(x, y) \in \mathbb R^2$ followed by a rotation by $\theta \in
S^1$.  The corresponding matrix is

$$g(x, y, \theta) \;=\;
\begin{pmatrix} \cos\theta & -\sin\theta & x \\
                \sin\theta &  \cos\theta & y \\
                0          &  0          & 1 \end{pmatrix}\;\in\;\mathrm{GL}_3(\mathbb R).$$

Acting on a column $(p_x, p_y, 1)^\top$ produces the rotated-and-translated
point.  The product of two such matrices is again of the same form (try it):
$\mathrm{SE}(2)$ is closed under multiplication.  The identity is at
$x = y = \theta = 0$.  The inverse is

$$g(x, y, \theta)^{-1} \;=\; g\!\bigl(-x\cos\theta - y\sin\theta,\;\;
                                   x\sin\theta - y\cos\theta,\;\;
                                   -\theta\bigr).$$

Composition is **not** commutative: rotating then translating is not the same
as translating then rotating.  Lie-group non-commutativity is the entire
reason the Lie bracket has anything to say.

## The Lie algebra $\mathfrak g = T_e G$

The **Lie algebra** of $G$ is the tangent space at the identity:

$$\mathfrak g \;:=\; T_e G.$$

For a matrix group it is concretely a vector space of $n\times n$ matrices.
A curve $\gamma: (-\varepsilon, \varepsilon) \to G$ with $\gamma(0) = e$ has
$\gamma'(0) \in \mathfrak g$.  Differentiating
$g(\varepsilon\, a, \varepsilon\, b, \varepsilon\, c)$ at $\varepsilon = 0$ in
the three coordinate directions gives

$$E_1 = \begin{pmatrix} 0&0&1 \\ 0&0&0 \\ 0&0&0 \end{pmatrix},\;\;
  E_2 = \begin{pmatrix} 0&0&0 \\ 0&0&1 \\ 0&0&0 \end{pmatrix},\;\;
  E_3 = \begin{pmatrix} 0&-1&0 \\ 1&0&0 \\ 0&0&0 \end{pmatrix},$$

a basis of $\mathfrak{se}(2)$.  $E_1$ is "translate in $x$", $E_2$ is
"translate in $y$", $E_3$ is "rotate in place".

### Left-invariant vector fields

There is a canonical way to push the Lie algebra around the group: at any
$g \in G$ define

$$X_i(g) \;:=\; (dL_g)_e (E_i),$$

where $L_g(h) = gh$ is left-multiplication.  $X_i(g)$ is the pushforward of
the abstract algebra element $E_i$ to the tangent space at $g$ along the
left-translation.  These are the **left-invariant vector fields**.  They
satisfy $X_i(gh) = (dL_g)_h X_i(h)$, i.e. they look the same in every
left-translated frame.

Computing them in the chart $(x, y, \theta)$ is mechanical:
$L_g(x', y', \theta') = (\,x + x'\cos\theta - y'\sin\theta,\;\;
                            y + x'\sin\theta + y'\cos\theta,\;\;
                            \theta + \theta')$, so

$$\boxed{\;
  X_1 \;=\; \cos\theta\,\partial_x + \sin\theta\,\partial_y, \qquad
  X_2 \;=\; \partial_\theta, \qquad
  X_3 \;=\; -\sin\theta\,\partial_x + \cos\theta\,\partial_y .\;}$$

These are the same three vector fields Part 1 §3 introduced.  Now you know
where they come from: they are the basis of $\mathfrak{se}(2)$, parallel-
transported across the group by left-multiplication.  They form an
orthonormal frame for the *Cartan-Killing geometry* on $\mathrm{SE}(2)$.

</div><!-- /.l-body -->

<!-- Fig A1.1 — Same algebra coefficients act differently on SE(2) vs SO(3) -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$a_1$
        <input type="range" id="osg-a1" min="-100" max="100" value="80" step="1">
        <span class="ctrl-val" id="osg-a1-val">+0.80</span>
      </label>
      <label>$a_2$
        <input type="range" id="osg-a2" min="-100" max="100" value="60" step="1">
        <span class="ctrl-val" id="osg-a2-val">+0.60</span>
      </label>
      <label>$a_3$
        <input type="range" id="osg-a3" min="-100" max="100" value="0" step="1">
        <span class="ctrl-val" id="osg-a3-val">+0.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Same $(a_1, a_2, a_3)$ — two different groups, two different orbits
      </span>
    </div>
    <svg id="fig-osg" style="width:100%;height:420px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A1.1 — same algebra, two different groups.</strong>
    The three sliders pick a Lie-algebra element with coefficients
    $(a_1, a_2, a_3)$.  We then plot the 1-parameter subgroup
    $t \mapsto \exp(tX) \cdot \text{(base point)}$ for $t \in [-3, 3]$ in
    <em>two separate groups</em> driven by the <em>same coefficients</em>.

    <strong>Left panel (blue tint) — $\mathrm{SE}(2)$</strong>, the group
    of rigid motions of the plane.  $X = a_1 X_1 + a_2 X_2 + a_3 X_3$
    where $X_1 = $ forward translation, $X_2 = $ rotation, $X_3 = $
    sideways translation.  Pure $a_2$ → circle through the origin;
    pure $a_1$ → straight line; combined → screw motion projecting to a
    circle.  The 3-D state $(x, y, \theta)$ is shown by the planar trace
    plus a frame at $t = 0$.  The "missing" $X_3$ direction is rendered as
    a thin orange line — non-horizontal in the contact-bundle sense.

    <strong>Right panel (purple tint) — $\mathrm{SO}(3)$</strong>, the
    group of rotations of $\mathbb R^3$.  $X = a_1 L_x + a_2 L_y + a_3 L_z$,
    so the orbit on the unit sphere $S^2$ from $p_0 = (1/\sqrt 2, 0,
    1/\sqrt 2)$ is the great circle around the axis
    $\hat n = (a_1, a_2, a_3)/|a|$.

    These are <em>not the same picture</em>.  The brackets differ:
    $\mathfrak{se}(2)$ has $[E_1, E_2] = 0$ but $[E_3, E_1] = E_2$;
    $\mathfrak{so}(3)$ has $[L_x, L_y] = L_z$ cyclically.  Same
    coefficient triple, different group, different orbit shape — the
    point of "Lie algebra" is precisely that this encoding into a
    coefficient triple <em>plus</em> a bracket table is what determines
    the group.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The Lie bracket, three ways

Three definitions, all equivalent; switch among them as convenient.

**(i) Matrix commutator.**  For $X, Y \in \mathfrak g \subset \mathrm{Mat}_n$,

$$[X, Y] \;:=\; XY - YX.$$

Multiplying out the $3\times 3$ matrices for the $\mathfrak{se}(2)$
basis yields the **structure constants**:

$$[E_1, E_2] = 0, \qquad [E_3, E_1] = E_2, \qquad [E_3, E_2] = -E_1.$$

The two translations commute (translations always do, regardless of axis),
while rotation does *not* commute with either translation — that is the
non-triviality of $\mathrm{SE}(2)$.

Two warnings worth absorbing.

- This basis $\{E_1, E_2, E_3\}$ of $\mathfrak{se}(2)$ is *different* from
  the left-invariant frame $\{X_1, X_2, X_3\}$ used in Part 1.  At the
  identity $X_i(e) = E_i$, but at a generic $g \in \mathrm{SE}(2)$,
  $X_i(g) \neq E_i$ — the LI vector fields are not constant in
  coordinates.
- For the LI vector fields the relevant bracket is the **vector-field
  commutator** below, *not* the matrix commutator of their constant
  identity-values.  The vector-field bracket of $X_1$ with $X_2$ produces
  $\pm X_3$ — the missing sideways direction — even though the matrix
  bracket of $E_1$ with $E_2$ vanishes.

**(ii) Vector-field commutator.**  For two vector fields acting on smooth
functions $f$,

$$([X, Y] f)(g) \;:=\; X(Y f)(g) - Y(X f)(g).$$

This is again a vector field: the second-order pieces cancel, leaving a
first-order operator.  Compute in the chart $(x, y, \theta)$:

$$X_1(X_2 f) - X_2(X_1 f)
  \;=\; (\cos\theta\,\partial_x + \sin\theta\,\partial_y)(\partial_\theta f)
        - \partial_\theta\bigl((\cos\theta\,\partial_x + \sin\theta\,\partial_y) f\bigr).$$

The cross-terms give

$$[X_1, X_2] f \;=\; -(\partial_\theta\cos\theta)\partial_x f
                    - (\partial_\theta\sin\theta)\partial_y f
                  \;=\; \sin\theta\,\partial_x f - \cos\theta\,\partial_y f
                  \;=\; -X_3 f.$$

So $[X_1, X_2] = -X_3$ as left-invariant vector fields.  The sign is a
convention: Part 1 used the opposite sign convention to land at
$[X_1, X_2] = +X_3$, and we will switch to that in §4 below where it matters.
Either way, the bracket is $\pm X_3$ — non-zero, in the missing sideways
direction.

**(iii) Closing-defect interpretation.**  Flow along $X$ for time
$\varepsilon$, then along $Y$ for time $\varepsilon$, then back along $X$,
then back along $Y$.  In a commutative world the loop closes; here it
doesn't, and the residual is

$$\Phi^Y_{-\varepsilon} \circ \Phi^X_{-\varepsilon} \circ \Phi^Y_{\varepsilon}
   \circ \Phi^X_{\varepsilon}\,(g) \;=\; g + \varepsilon^2 [X, Y]_g + O(\varepsilon^3).$$

For the V1 cortex this is the four-step manoeuvre Part 1 §3.4 illustrated:
two hops of "slide along your orientation" interleaved with two hops of
"rotate the orientation" produce a sideways nudge of order $\varepsilon^2$.
The Lie bracket is exactly the leading coefficient of that nudge.

</div><!-- /.l-body -->

<!-- Fig A1.2 — Closing-defect on BOTH SE(2) and SO(3) -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$\varepsilon$
        <input type="range" id="bracket-eps" min="3" max="100" value="30" step="1">
        <span class="ctrl-val" id="bracket-eps-val">0.30</span>
      </label>
      <label>show $O(\varepsilon^3)$ residuals
        <input type="checkbox" id="bracket-residual" checked>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        4-leg loop $+\varepsilon X, +\varepsilon Y, -\varepsilon X, -\varepsilon Y$ — same algebra coefficients, different groups
      </span>
    </div>
    <svg id="fig-bracket" style="width:100%;height:560px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A1.2 — closing-defect on two different groups.</strong>
    The same 4-leg loop pattern (a forward step, a sideways step, a
    forward un-step, a sideways un-step) is applied on
    <strong>$\mathrm{SE}(2)$</strong> (top-left, blue tint) and on
    <strong>$\mathrm{SO}(3)$</strong> (bottom-left, purple tint), driven
    by the same $\varepsilon$.

    <strong>$\mathrm{SE}(2)$ (top-left)</strong> — flow legs are
    $+\varepsilon X_1$ (forward), $+\varepsilon X_2$ (rotation),
    $-\varepsilon X_1$, $-\varepsilon X_2$.  In a commutative world the
    loop returns to the origin; here it lands at a tiny offset of order
    $\varepsilon^2$ in the $X_3$ direction (the missing sideways
    direction of the V1 cortex story in Part 1).  The dashed grey arrow
    shows the actual gap; the orange arrow is the prediction
    $\varepsilon^2 \cdot [X_1, X_2]_e = -\varepsilon^2 X_3$.

    <strong>$\mathrm{SO}(3)$ (bottom-left)</strong> — flow legs are
    $R_x(\varepsilon), R_y(\varepsilon), R_x(-\varepsilon),
    R_y(-\varepsilon)$ acting on $p_0 = (1/\sqrt 2, 0, 1/\sqrt 2)$.  The
    closing-defect is approximately $-\varepsilon^2 L_z \cdot p_0$ — a
    rotation about the $z$-axis at order $\varepsilon^2$.  Both panels
    auto-zoom so the loop is always visually readable.

    <strong>Right panel.</strong>  log–log of the closing-defect
    magnitude vs $\varepsilon$, sweeping $\varepsilon \in [10^{-3}, 1]$,
    for <em>both</em> groups.  Blue traces (SE(2)) and purple traces
    (SO(3)) overlap on slope $\approx 2$ — the leading bracket order is
    universal.  Toggle the $O(\varepsilon^3)$ residuals: after
    subtracting the predicted $\varepsilon^2 [X, Y]$ term, the orange
    (SE(2)) and pink (SO(3)) residuals fall on slope $\approx 3$ — the
    next BCH contribution, also universal.  Two grey reference lines
    have slopes 2 and 3 exactly; the four data traces all track them.

    Punchline: the <em>algebra</em> determines the leading order; the
    <em>group</em> determines the geometric meaning of the $X_3$ that
    pops out at $\varepsilon^2$ — $\hat z$-rotation in $\mathrm{SO}(3)$,
    sideways translation in $\mathrm{SE}(2)$.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The exponential map

For matrix groups the **exponential map** $\exp : \mathfrak g \to G$ is the
literal matrix exponential

$$\exp(X) \;=\; \sum_{n=0}^{\infty} \frac{X^n}{n!}.$$

It does two things at once:

1. **Generates 1-parameter subgroups.**  The curve $t \mapsto \exp(tX)$ is a
   smooth homomorphism $(\mathbb R, +) \to G$.  It is the unique solution of
   $\dot g(t) = X \cdot g(t)$ with $g(0) = e$ in the matrix group, i.e. the
   integral curve of the *right*-invariant vector field associated to $X$.
2. **Linearises the group near $e$.**  $d\exp_0 = \mathrm{id}_{\mathfrak g}$,
   so $\exp$ is a local diffeomorphism near the origin.  It is *not* a
   global diffeomorphism: for SE(2) the exponential map is surjective but
   not injective, and we will need to be careful in Appendix A5 when we
   talk about the *sub-Riemannian* exponential map (which is a different
   beast — see A5).

For SE(2), $\exp(t(a_1 E_1 + a_2 E_2 + a_3 E_3))$ has a closed form.  Write
$X = T + \omega E_3$ with $T = a_1 E_1 + a_2 E_2$ (translation part) and
$\omega = a_3$ (rotation rate).  Then

$$\exp(tX) \;=\;
\begin{pmatrix} \cos(\omega t) & -\sin(\omega t) & b_1(t)\\
                \sin(\omega t) &  \cos(\omega t) & b_2(t)\\
                0 & 0 & 1 \end{pmatrix},$$

where the translation vector $b(t) = (b_1, b_2)$ is

$$b(t) = \tfrac{1}{\omega}\bigl(\sin(\omega t)\,a_1 + (\cos(\omega t) - 1)\,a_2,\;
                               -(\cos(\omega t) - 1)\,a_1 + \sin(\omega t)\,a_2\bigr)$$

for $\omega \neq 0$, and $b(t) = (a_1 t, a_2 t)$ for $\omega = 0$.  Trace this
through Figure A1.1: $\omega = 0$ gives a straight line, $\omega \neq 0$ gives
a circle whose centre is offset from the origin by the screw "axis"
$a / \omega$.

### The 1-parameter subgroups *are* the geodesics of the Cartan-Killing metric

If you put a left-invariant Riemannian metric on $G$ that is also right-
invariant (a "bi-invariant" metric, which on $\mathrm{SE}(2)$ exists), then
the geodesics through $e$ are exactly the 1-parameter subgroups
$t \mapsto \exp(tX)$.  This is **not** the situation in Part 1: Part 1 uses
a *sub-Riemannian* metric that is left-invariant but not right-invariant,
and in that geometry the geodesics are **not** generally
$\exp(tX)$ — they are Euler's elastica.  Appendix A5 explains how the SR
exponential map differs from this group exponential.

## Adjoint and coadjoint actions

The group acts on its Lie algebra by conjugation:

$$\mathrm{Ad}_g : \mathfrak g \to \mathfrak g, \qquad
  \mathrm{Ad}_g(X) \;:=\; g X g^{-1}.$$

Differentiating at $g = e$ recovers the bracket:
$\frac{d}{dt}\bigr|_{t=0} \mathrm{Ad}_{\exp(tX)}(Y) = [X, Y] =: \mathrm{ad}_X(Y)$.

The **coadjoint action** is the dual: $\mathrm{Ad}^{\ast}_g : \mathfrak g^{\ast} \to
\mathfrak g^{\ast}$, $\langle \mathrm{Ad}^{\ast}_g(\mu), Y\rangle :=
\langle \mu, \mathrm{Ad}_{g^{-1}}(Y)\rangle$.  The orbits of $\mathrm{Ad}^{\ast}$
on $\mathfrak g^{\ast}$ are called **coadjoint orbits**, and they are *symplectic
manifolds* (Kirillov-Kostant-Souriau).

For $\mathrm{SE}(2)$, parametrise $\mathfrak{se}(2)^{\ast}$ by $(h_1, h_2, h_3)$
in the basis dual to $\{E_1, E_2, E_3\}$.  The coadjoint orbits are

$$\mathcal O_c \;:=\; \{(h_1, h_2, h_3) : h_1^2 + h_2^2 = c\},$$

i.e. **vertical cylinders** in $(h_1, h_2, h_3)$-space (plus a degenerate
1-point orbit at $h_1 = h_2 = 0$ for each value of $h_3$).  Part 2 §1
discovered this structure organically: the costate of the SR geodesic
problem evolves on the cylinder $h_1^2 + h_2^2 = 2\mathcal H$, with $h_3 =
\omega_0$ constant — exactly Lie–Poisson dynamics on $\mathfrak{se}(2)^{\ast}$.
Appendix A3 will derive that flow from the PMP.

</div><!-- /.l-body -->

<!-- Fig A1.3 — coadjoint orbit cylinder -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$c = h_1^2 + h_2^2$
        <input type="range" id="orbit-c" min="10" max="200" value="80" step="1">
        <span class="ctrl-val" id="orbit-c-val">0.80</span>
      </label>
      <label>$h_3$ (rotation costate)
        <input type="range" id="orbit-h3" min="-150" max="150" value="60" step="1">
        <span class="ctrl-val" id="orbit-h3-val">+0.60</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Coadjoint orbit $\mathcal O_c$ on $\mathfrak{se}(2)^{\ast}$
      </span>
    </div>
    <svg id="fig-orbit" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A1.3.</strong> The coadjoint orbits of $\mathrm{SE}(2)$ are
    cylinders $h_1^2 + h_2^2 = c$ in the dual space $\mathfrak{se}(2)^{\ast}$.
    The blue curve is the trajectory of the costate $(h_1(t), h_2(t),
    h_3(t))$ under the Lie–Poisson flow generated by the SR Hamiltonian
    $\mathcal H = \tfrac12 (h_1^2 + h_2^2)$ — derived in Appendix A3, used
    without proof in Part 2 §1.  The trajectory winds around the cylinder
    at constant $h_3$, with angular rate $-h_3$ (slide $h_3$ to vary).  This
    is a symplectic structure visualised: cylinders for non-trivial orbits,
    pinched-off points along the axis $h_1 = h_2 = 0$ for the degenerate
    orbits.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The Baker–Campbell–Hausdorff series

For two non-commuting algebra elements,

$$\exp X \cdot \exp Y \;=\; \exp\!\Bigl(X + Y + \tfrac12 [X, Y]
                                    + \tfrac{1}{12}[X, [X, Y]]
                                    + \tfrac{1}{12}[Y, [Y, X]] + \cdots\Bigr).$$

The leading non-commutative correction is exactly $\tfrac12 [X, Y]$.  Two
points to remember:

- The 4-step closing-defect of §3 is BCH applied twice and subtracted.  The
  $X + Y$ pieces cancel, leaving $\varepsilon^2 [X, Y]$ at the leading
  surviving order.  See Figure A1.2.
- Even when $[X, Y] \neq 0$, the higher commutators
  $[X, [X, Y]], [Y, [X, Y]]$ may vanish — and for $\mathrm{SE}(2)$, the
  algebra is "step-2 nilpotent at infinity" in a sense, meaning many
  identities truncate quickly.  This is what makes the Sachkov closed forms
  in Part 2 manageable.

## Connection to the elliptic project

Every figure on this page integrates the SE(2) ODE $\dot g = g \cdot \xi(t)$
using the exact same midpoint-rule helper that the
<a href="https://moiseevigor.github.io/elliptic/">moiseevigor/elliptic</a>
project ships in `examples/dubins-back-wheel/app.js`.  When $\xi(t) =
(a_1, a_2, a_3)$ is *constant* you get the 1-parameter subgroups of
Figure A1.1; when $\xi(t)$ is the *Pontryagin extremal* control of Part 2
you get Euler's elastica; when $\xi(t)$ has its forward component
$\cos\varphi(t)$ change sign you get the cuspidal parking trajectory shown
in
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-back-wheel/">that example</a>.
The same matrix exponential drives all three.

## Code

```python
# Matrix exponential of an se(2) element — closed form.
# Identical to the formula used in moiseevigor/elliptic/se2.py.
import numpy as np

def exp_se2(a1, a2, a3, t=1.0):
    """Return the 3x3 SE(2) matrix exp(t * (a1 E1 + a2 E2 + a3 E3))."""
    om = a3 * t
    if abs(om) < 1e-12:
        # Pure translation limit
        b1, b2 = a1 * t, a2 * t
        c, s = 1.0, 0.0
    else:
        c, s = np.cos(om), np.sin(om)
        # Translation vector b(t) = (sin/om · a + (cos-1)/om · J·a)
        b1 = ( s * a1 + (c - 1) * a2) / a3
        b2 = (-(c - 1) * a1 + s * a2) / a3
    return np.array([[c, -s, b1],
                     [s,  c, b2],
                     [0,  0, 1.0]])

# Verify [E1, E2] = 0  and  [E3, E1] = E2  in matrix form
E1 = np.array([[0,0,1],[0,0,0],[0,0,0]], float)
E2 = np.array([[0,0,0],[0,0,1],[0,0,0]], float)
E3 = np.array([[0,-1,0],[1,0,0],[0,0,0]], float)
def comm(A, B): return A @ B - B @ A
assert np.allclose(comm(E1, E2), 0)
assert np.allclose(comm(E3, E1), E2)
assert np.allclose(comm(E3, E2), -E1)
```

## What we covered, and what comes next

A Lie group is a manifold-with-group-law.  Its Lie algebra is the tangent
space at the identity, encoded either as matrices in $\mathrm{Mat}_n$ or as
left-invariant vector fields on $G$.  The **bracket** measures non-
commutativity in three equivalent ways (matrix commutator, vector-field
commutator, infinitesimal closing-defect of a 4-leg loop).  The **exponential
map** turns algebra elements into 1-parameter subgroups.  The **coadjoint
orbits** of $\mathrm{SE}(2)$ are cylinders, and the SR Hamiltonian flow lives
on them.

Appendix A2 will use this language to give *the right* definition of a
contact structure and prove Chow–Rashevskii.  Appendix A3 will derive the
Lie–Poisson equations $\dot h_1 = h_2 h_3, \dot h_2 = -h_1 h_3, \dot h_3 =
0$ — the equations Part 2 §1 asserts without proof — directly from the
Pontryagin Maximum Principle.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>
    M. Spivak (1979). <em>A Comprehensive Introduction to Differential
    Geometry, Vol. 1.</em> Publish or Perish.  Chapters 5–6 for manifolds
    and Lie groups.
  </li>
  <li>
    B. C. Hall (2015). <em>Lie Groups, Lie Algebras, and Representations:
    An Elementary Introduction.</em> Springer GTM 222.  Matrix-Lie-group
    perspective; ideal companion to this appendix.
  </li>
  <li>
    V. I. Arnold (1989). <em>Mathematical Methods of Classical Mechanics.</em>
    Springer GTM 60.  Appendix 2 covers Lie groups, coadjoint orbits, and
    Lie–Poisson dynamics with the lightest possible touch.
  </li>
  <li>
    A. A. Kirillov (2004). <em>Lectures on the Orbit Method.</em> AMS GSM 64.
    Coadjoint orbits as symplectic leaves; the SE(2) example is worked
    explicitly.
  </li>
  <li>
    Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the
    sub-Riemannian problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.
    Uses every concept of this appendix.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/">moiseevigor/elliptic</a>
    — Jacobi elliptic functions, complete and incomplete integrals, and the
    SE(2) exponential routine used in all three figures of this appendix.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── SE(2) matrix exponential, identical to elliptic/se2.py closed form ─
function expSE2(a1, a2, a3, t) {
  const om = a3 * t;
  if (Math.abs(om) < 1e-12) {
    return { x: a1 * t, y: a2 * t, theta: 0 };
  }
  const c = Math.cos(om), s = Math.sin(om);
  const b1 = ( s * a1 + (c - 1) * a2) / a3;
  const b2 = (-(c - 1) * a1 + s * a2) / a3;
  return { x: b1, y: b2, theta: om };
}

// ── Figure A1.1 — Same algebra coefficients on SE(2) vs SO(3) ──────────
function drawOSG() {
  const svg = document.getElementById('fig-osg');
  if (!svg) return;
  const a1 = parseFloat(document.getElementById('osg-a1').value) / 100;
  const a2 = parseFloat(document.getElementById('osg-a2').value) / 100;
  const a3 = parseFloat(document.getElementById('osg-a3').value) / 100;
  document.getElementById('osg-a1-val').textContent = (a1 >= 0 ? '+' : '') + a1.toFixed(2);
  document.getElementById('osg-a2-val').textContent = (a2 >= 0 ? '+' : '') + a2.toFixed(2);
  document.getElementById('osg-a3-val').textContent = (a3 >= 0 ? '+' : '') + a3.toFixed(2);

  const W = svg.clientWidth || 720, H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Common defs (arrow markers)
  const defs = g.append('defs');
  [['blue', '#1565c0'], ['red', '#b71c1c'], ['orange', '#e65100'], ['purple', '#6a1b9a']]
    .forEach(([name, c]) => {
      defs.append('marker').attr('id', `a1-arr-${name}`)
        .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', c);
    });

  const split = W / 2;
  const headerH = 36;

  // ────────── LEFT PANEL: SE(2) ──────────
  // Tinted background
  g.append('rect').attr('x', 0).attr('y', 0).attr('width', split).attr('height', H)
    .attr('fill', '#e8f0fb');
  // Header strip
  g.append('rect').attr('x', 0).attr('y', 0).attr('width', split).attr('height', headerH)
    .attr('fill', '#1565c0');
  g.append('text').attr('x', 16).attr('y', 17)
    .attr('font-family', 'Source Sans 3').attr('font-weight', 700)
    .attr('font-size', 13).attr('fill', '#fff')
    .text('SE(2) — rigid plane motions');
  g.append('text').attr('x', 16).attr('y', 31)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#cfdcef')
    .text('X = a₁·X₁ + a₂·X₂ + a₃·X₃   (forward, rot, sideways)');

  // Convert sliders to expSE2 args:
  //   X1 = forward = E_x at identity → ax = a1
  //   X2 = rotation = E_θ            → ath = a2
  //   X3 = sideways = E_y at identity → ay = a3
  const ax = a1, ay = a3, ath = a2;
  const tArr = d3.range(-3, 3.01, 0.04);
  const pts = tArr.map(t => {
    const p = expSE2(ax, ay, ath, t);
    return { x: p.x, y: p.y, theta: p.theta, t };
  });

  // Auto-scale (within left panel area)
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.4;
  const mL = { t: headerH + 8, b: 30, l: 28, r: 14 };
  const plotLW = split - mL.l - mL.r, plotLH = H - mL.t - mL.b;
  const aspectL = plotLW / plotLH;
  const xRangeL = range * Math.max(aspectL, 1);
  const yRangeL = range * Math.max(1 / aspectL, 1);
  const xLeft = d3.scaleLinear().domain([cx - xRangeL, cx + xRangeL]).range([mL.l, split - mL.r]);
  const yLeft = d3.scaleLinear().domain([cy - yRangeL, cy + yRangeL]).range([H - mL.b, mL.t]);

  // Axes
  g.append('line').attr('x1', mL.l).attr('x2', split - mL.r)
    .attr('y1', yLeft(0)).attr('y2', yLeft(0))
    .attr('stroke', '#cdd9e8').attr('stroke-width', 1);
  g.append('line').attr('x1', xLeft(0)).attr('x2', xLeft(0))
    .attr('y1', mL.t).attr('y2', H - mL.b)
    .attr('stroke', '#cdd9e8').attr('stroke-width', 1);

  // Curve
  g.append('path')
    .attr('d', d3.line().x(p => xLeft(p.x)).y(p => yLeft(p.y))(pts))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.4);

  // Identity dot + frame
  g.append('circle').attr('cx', xLeft(0)).attr('cy', yLeft(0)).attr('r', 4).attr('fill', '#0d3a78');
  const frL = 0.18 * Math.min(xRangeL, yRangeL);
  // X1 (forward) — blue
  g.append('line').attr('x1', xLeft(0)).attr('y1', yLeft(0))
    .attr('x2', xLeft(frL)).attr('y2', yLeft(0))
    .attr('stroke', '#1565c0').attr('stroke-width', 2)
    .attr('marker-end', 'url(#a1-arr-blue)');
  g.append('text').attr('x', xLeft(frL) + 6).attr('y', yLeft(0) - 4)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#1565c0')
    .text('X₁');
  // X3 (sideways, the "missing" non-horizontal direction) — orange
  g.append('line').attr('x1', xLeft(0)).attr('y1', yLeft(0))
    .attr('x2', xLeft(0)).attr('y2', yLeft(frL))
    .attr('stroke', '#e65100').attr('stroke-width', 2)
    .attr('marker-end', 'url(#a1-arr-orange)');
  g.append('text').attr('x', xLeft(0) + 6).attr('y', yLeft(frL) - 4)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#e65100')
    .text('X₃ (non-horizontal)');

  // Status
  const cur = expSE2(ax, ay, ath, 1);
  g.append('text').attr('x', mL.l + 4).attr('y', H - 8)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#345')
    .text(`exp(1·X)→(x,y,θ)=(${cur.x.toFixed(2)}, ${cur.y.toFixed(2)}, ${cur.theta.toFixed(2)})`);
  const kindL = Math.abs(ath) < 1e-9
    ? 'pure translation'
    : (Math.abs(ax) < 1e-9 && Math.abs(ay) < 1e-9 ? 'pure rotation' : 'screw motion');
  g.append('text').attr('x', split - mL.r - 4).attr('y', H - 8)
    .attr('text-anchor', 'end')
    .attr('font-family', 'Source Sans 3').attr('font-size', 10).attr('fill', '#666')
    .text(kindL);

  // ────────── DIVIDER ──────────
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', 0).attr('y2', H)
    .attr('stroke', '#888').attr('stroke-width', 2);
  // "different groups" badge
  g.append('rect').attr('x', split - 84).attr('y', H / 2 - 14)
    .attr('width', 168).attr('height', 28)
    .attr('fill', '#fff').attr('stroke', '#444').attr('stroke-width', 1.4).attr('rx', 14);
  g.append('text').attr('x', split).attr('y', H / 2 - 1)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Source Sans 3').attr('font-weight', 700)
    .attr('font-size', 11).attr('fill', '#444')
    .text('DIFFERENT GROUPS');
  g.append('text').attr('x', split).attr('y', H / 2 + 11)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#666')
    .text('same coefficients (a₁,a₂,a₃)');

  // ────────── RIGHT PANEL: SO(3) ──────────
  g.append('rect').attr('x', split).attr('y', 0).attr('width', W - split).attr('height', H)
    .attr('fill', '#f4ecf8');
  g.append('rect').attr('x', split).attr('y', 0).attr('width', W - split).attr('height', headerH)
    .attr('fill', '#6a1b9a');
  g.append('text').attr('x', split + 16).attr('y', 17)
    .attr('font-family', 'Source Sans 3').attr('font-weight', 700)
    .attr('font-size', 13).attr('fill', '#fff')
    .text('SO(3) — rotations of the sphere');
  g.append('text').attr('x', split + 16).attr('y', 31)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#e0d0e8')
    .text('X = a₁·Lₓ + a₂·Lᵧ + a₃·L_z       brackets:  [Lₓ,Lᵧ]=L_z  (cyclic)');

  // Sphere display centered on right half
  const mR = { t: headerH + 8, b: 28, l: 16, r: 16 };
  const plotRW = W - split - mR.l - mR.r, plotRH = H - mR.t - mR.b;
  const sphereR = Math.min(plotRW, plotRH) / 2.1;
  const sCx = split + mR.l + plotRW / 2;
  const sCy = mR.t + plotRH / 2;

  // Sphere outline
  g.append('circle').attr('cx', sCx).attr('cy', sCy).attr('r', sphereR)
    .attr('fill', '#fff').attr('fill-opacity', 0.6)
    .attr('stroke', '#bca3c8').attr('stroke-width', 1);

  // Project a 3D point onto the sphere display.  Use the same projection as
  // Fig A1.2 so p₀ (front-equator) is at the centre.
  function projSphereSo3(p) {
    const pr = projOrtho(p);
    return { x: sCx + pr.u * sphereR, y: sCy - pr.v * sphereR, depth: pr.depth };
  }

  // Lat/long grid
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = lat * Math.PI / 180;
    const ring = [];
    for (let lng = 0; lng <= 360; lng += 6) {
      const psi = lng * Math.PI / 180;
      const p = [Math.cos(phi) * Math.cos(psi), Math.sin(phi), Math.cos(phi) * Math.sin(psi)];
      ring.push(projSphereSo3(p));
    }
    g.append('path')
      .attr('d', d3.line().defined(p => p.depth > -0.05).x(p => p.x).y(p => p.y)(ring))
      .attr('fill', 'none').attr('stroke', '#e8d8ee').attr('stroke-width', 1);
  }
  for (let lng = 0; lng < 180; lng += 30) {
    const arr = [];
    for (let lat = -90; lat <= 90; lat += 3) {
      const phi = lat * Math.PI / 180, psi = lng * Math.PI / 180;
      const p = [Math.cos(phi) * Math.cos(psi), Math.sin(phi), Math.cos(phi) * Math.sin(psi)];
      arr.push(projSphereSo3(p));
    }
    g.append('path')
      .attr('d', d3.line().defined(p => p.depth > -0.05).x(p => p.x).y(p => p.y)(arr))
      .attr('fill', 'none').attr('stroke', '#e8d8ee').attr('stroke-width', 1);
  }

  // 1-parameter subgroup orbit on SO(3): rotate p_0 by exp(t · (a1 Lx + a2 Ly + a3 Lz))
  const inv2 = 1 / Math.SQRT2;
  const p0 = [inv2, 0, inv2];
  const norm = Math.hypot(a1, a2, a3);
  let orbit = [];
  if (norm < 1e-6) {
    // Identity element — no motion; just plot a single point.
    orbit = [projSphereSo3(p0)];
  } else {
    const nx = a1 / norm, ny = a2 / norm, nz = a3 / norm;
    const tList = d3.range(-3, 3.01, 0.03);
    orbit = tList.map(t => {
      const ang = norm * t;
      const q = quatAxisAngle(nx, ny, nz, ang);
      const p = quatRot(q, p0);
      return { ...projSphereSo3(p), depth: projOrtho(p).depth };
    });
  }

  // Draw orbit — split into "front" and "back" segments by depth
  function drawOrbitSegments(arr, frontColor, backColor) {
    let buf = [];
    let lastFront = null;
    arr.forEach(p => {
      const isFront = p.depth >= -0.02;
      if (lastFront === null) lastFront = isFront;
      if (isFront !== lastFront && buf.length > 1) {
        g.append('path')
          .attr('d', d3.line().x(q => q.x).y(q => q.y)(buf))
          .attr('fill', 'none').attr('stroke', lastFront ? frontColor : backColor)
          .attr('stroke-width', 2.4)
          .attr('opacity', lastFront ? 1 : 0.35)
          .attr('stroke-dasharray', lastFront ? null : '3,3');
        buf = [p];
        lastFront = isFront;
      } else {
        buf.push(p);
      }
    });
    if (buf.length > 1) {
      g.append('path')
        .attr('d', d3.line().x(q => q.x).y(q => q.y)(buf))
        .attr('fill', 'none').attr('stroke', lastFront ? frontColor : backColor)
        .attr('stroke-width', 2.4)
        .attr('opacity', lastFront ? 1 : 0.35)
        .attr('stroke-dasharray', lastFront ? null : '3,3');
    }
  }
  if (orbit.length > 1) drawOrbitSegments(orbit, '#6a1b9a', '#6a1b9a');

  // Mark p₀
  const pp0 = projSphereSo3(p0);
  g.append('circle').attr('cx', pp0.x).attr('cy', pp0.y).attr('r', 4).attr('fill', '#4a148c');
  g.append('text').attr('x', pp0.x + 7).attr('y', pp0.y - 6)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#4a148c').text('p₀');

  // Mark the rotation axis (when defined)
  if (norm > 1e-6) {
    const nx = a1 / norm, ny = a2 / norm, nz = a3 / norm;
    const axTip = projSphereSo3([nx, ny, nz]);
    const axTipNeg = projSphereSo3([-nx, -ny, -nz]);
    // Through-sphere line representing the axis
    g.append('line').attr('x1', axTipNeg.x).attr('y1', axTipNeg.y)
      .attr('x2', axTip.x).attr('y2', axTip.y)
      .attr('stroke', '#b71c1c').attr('stroke-width', 1.5).attr('stroke-dasharray', '3,3');
    g.append('circle').attr('cx', axTip.x).attr('cy', axTip.y).attr('r', 3)
      .attr('fill', '#b71c1c');
    g.append('text').attr('x', axTip.x + 6).attr('y', axTip.y + 4)
      .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#b71c1c')
      .text('axis n̂');
  }

  // Status
  g.append('text').attr('x', split + mR.l + 4).attr('y', H - 8)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#4a148c')
    .text(`|a| = ${norm.toFixed(2)}    angular speed ω = ${norm.toFixed(2)} rad/unit-t`);
}

// ── Figure A1.2 — Lie bracket on the sphere (SO(3)) ────────────────────
//
// Loop: rotate by ε about x̂, then ε about ŷ, then -ε about x̂, then -ε
// about ŷ.  Acting on p₀ = (0, 0, 1).  Endpoint is at distance ~ε² in the
// −ẑ direction; subtracting the predicted leading term leaves an O(ε³)
// residual.  Rotations are computed via quaternions.
function quatAxisAngle(ax, ay, az, ang) {
  const h = ang / 2, s = Math.sin(h);
  return [Math.cos(h), ax * s, ay * s, az * s];
}
function quatMul(a, b) {
  return [
    a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3],
    a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2],
    a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1],
    a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0],
  ];
}
function quatRot(q, v) {
  // R(q) · v.  v is a 3-vector.
  const qv = [0, v[0], v[1], v[2]];
  const qInv = [q[0], -q[1], -q[2], -q[3]];
  const r = quatMul(quatMul(q, qv), qInv);
  return [r[1], r[2], r[3]];
}
function loop4OnSphere(p0, eps, nSub = 18) {
  // Apply the 4-leg loop; return the path (sub-divided arcs) plus end.
  const path = [p0];
  function applyArc(p, axis, ang) {
    const arr = [];
    for (let i = 1; i <= nSub; i++) {
      const q = quatAxisAngle(axis[0], axis[1], axis[2], ang * i / nSub);
      arr.push(quatRot(q, p));
    }
    return arr;
  }
  let p = p0;
  let arc;
  arc = applyArc(p, [1, 0, 0],  eps); path.push(...arc); p = arc[arc.length - 1];
  arc = applyArc(p, [0, 1, 0],  eps); path.push(...arc); p = arc[arc.length - 1];
  arc = applyArc(p, [1, 0, 0], -eps); path.push(...arc); p = arc[arc.length - 1];
  arc = applyArc(p, [0, 1, 0], -eps); path.push(...arc); p = arc[arc.length - 1];
  return { path, end: p };
}
// Orthographic projection.  Camera defaults are chosen so that the working
// point p₀ = (1/√2, 0, 1/√2) projects to the dead centre of the sphere
// outline (yaw -π/4 aligns it with the +ẑ camera axis; pitch 0).  The
// longitude curves still curve, giving a 3-D look without offsetting p₀.
function projOrtho(p, viewYaw = -Math.PI / 4, viewPitch = 0) {
  // First yaw around y, then pitch around x
  const cy = Math.cos(viewYaw), sy = Math.sin(viewYaw);
  const cp = Math.cos(viewPitch), sp = Math.sin(viewPitch);
  const x1 =  cy * p[0] + sy * p[2];
  const y1 =  p[1];
  const z1 = -sy * p[0] + cy * p[2];
  const x2 = x1;
  const y2 = cp * y1 - sp * z1;
  const z2 = sp * y1 + cp * z1;
  return { u: x2, v: y2, depth: z2 };
}

// ── 4-leg loop on SE(2) — flows along forward (X1) and rotation (X2) ───
function loop4OnSE2(eps) {
  const sub = 24;
  function flowX1(p, t) {
    const out = [{ ...p }];
    for (let i = 1; i <= sub; i++) {
      const f = i / sub;
      out.push({
        x: p.x + Math.cos(p.theta) * t * f,
        y: p.y + Math.sin(p.theta) * t * f,
        theta: p.theta,
      });
    }
    return out;
  }
  function flowX2(p, t) {
    const out = [{ ...p }];
    for (let i = 1; i <= sub; i++) {
      const f = i / sub;
      out.push({ x: p.x, y: p.y, theta: p.theta + t * f });
    }
    return out;
  }
  let p = { x: 0, y: 0, theta: 0 };
  const path = [p];
  let leg;
  leg = flowX1(p,  eps); path.push(...leg.slice(1)); p = leg[leg.length - 1];
  leg = flowX2(p,  eps); path.push(...leg.slice(1)); p = leg[leg.length - 1];
  leg = flowX1(p, -eps); path.push(...leg.slice(1)); p = leg[leg.length - 1];
  leg = flowX2(p, -eps); path.push(...leg.slice(1)); p = leg[leg.length - 1];
  return { path, end: p };
}

function drawBracket() {
  const svg = document.getElementById('fig-bracket');
  if (!svg) return;
  const eps = parseFloat(document.getElementById('bracket-eps').value) / 100;
  document.getElementById('bracket-eps-val').textContent = eps.toFixed(2);
  const showResid = document.getElementById('bracket-residual').checked;

  const W = svg.clientWidth || 720, H = 560;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Layout: left column has two stacked panels (SE(2) on top, SO(3) on bottom);
  // right column shows a log-log plot for both groups.
  const split = W * 0.55;
  const halfH = H / 2;

  // Common arrow markers
  const defs = g.append('defs');
  [['orange', '#e65100'], ['blue', '#1565c0'], ['purple', '#6a1b9a'], ['pink', '#c2185b']]
    .forEach(([name, c]) => {
      defs.append('marker').attr('id', `a2-arr-${name}`)
        .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', c);
    });

  // ════════════════════════════════════════════════════════════════════
  // SE(2) panel (top-left)
  // ════════════════════════════════════════════════════════════════════
  g.append('rect').attr('x', 0).attr('y', 0).attr('width', split).attr('height', halfH)
    .attr('fill', '#e8f0fb');
  g.append('rect').attr('x', 0).attr('y', 0).attr('width', split).attr('height', 26)
    .attr('fill', '#1565c0');
  g.append('text').attr('x', 12).attr('y', 17)
    .attr('font-family', 'Source Sans 3').attr('font-weight', 700)
    .attr('font-size', 12).attr('fill', '#fff')
    .text('SE(2) — flow forward, rotate, reverse, un-rotate');

  const { path: pathSE2, end: endSE2 } = loop4OnSE2(eps);
  const gapSE2 = { x: endSE2.x, y: endSE2.y, theta: endSE2.theta };
  const predSE2 = { x: 0, y: -eps * eps, theta: 0 };

  const mSE = { t: 30, b: 6, l: 16, r: 16 };
  const plotSEW = split - mSE.l - mSE.r, plotSEH = halfH - mSE.t - mSE.b;
  const xs = pathSE2.map(p => p.x), ys = pathSE2.map(p => p.y);
  const xExt = [Math.min(...xs, 0), Math.max(...xs, 0)];
  const yExt = [Math.min(...ys, predSE2.y), Math.max(...ys, 0)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 * 1.5 + 1e-3;
  const aspect = plotSEW / plotSEH;
  const xRangeSE = range * Math.max(aspect, 1);
  const yRangeSE = range * Math.max(1 / aspect, 1);
  const xSE = d3.scaleLinear().domain([cx - xRangeSE, cx + xRangeSE]).range([mSE.l, split - mSE.r]);
  const ySE = d3.scaleLinear().domain([cy - yRangeSE, cy + yRangeSE]).range([halfH - mSE.b, mSE.t]);

  g.append('line').attr('x1', mSE.l).attr('x2', split - mSE.r)
    .attr('y1', ySE(0)).attr('y2', ySE(0)).attr('stroke', '#cdd9e8').attr('stroke-width', 1);
  g.append('line').attr('x1', xSE(0)).attr('x2', xSE(0))
    .attr('y1', mSE.t).attr('y2', halfH - mSE.b).attr('stroke', '#cdd9e8').attr('stroke-width', 1);

  g.append('path')
    .attr('d', d3.line().x(p => xSE(p.x)).y(p => ySE(p.y))(pathSE2))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2);
  g.append('circle').attr('cx', xSE(0)).attr('cy', ySE(0)).attr('r', 4).attr('fill', '#0d3a78');
  g.append('text').attr('x', xSE(0) - 6).attr('y', ySE(0) - 6)
    .attr('text-anchor', 'end')
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#0d3a78').text('start');
  g.append('circle').attr('cx', xSE(endSE2.x)).attr('cy', ySE(endSE2.y)).attr('r', 4).attr('fill', '#b71c1c');
  g.append('text').attr('x', xSE(endSE2.x) + 6).attr('y', ySE(endSE2.y) + 4)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#b71c1c').text('end');

  g.append('line').attr('x1', xSE(endSE2.x)).attr('y1', ySE(endSE2.y))
    .attr('x2', xSE(0)).attr('y2', ySE(0))
    .attr('stroke', '#888').attr('stroke-width', 1.4).attr('stroke-dasharray', '4,3');

  g.append('line').attr('x1', xSE(0)).attr('y1', ySE(0))
    .attr('x2', xSE(predSE2.x)).attr('y2', ySE(predSE2.y))
    .attr('stroke', '#e65100').attr('stroke-width', 2.2)
    .attr('marker-end', 'url(#a2-arr-orange)');
  g.append('text').attr('x', xSE(predSE2.x) + 6).attr('y', ySE(predSE2.y / 2))
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#e65100')
    .text('ε²·[X₁,X₂] = -ε²·X₃');

  const magGapSE = Math.hypot(gapSE2.x, gapSE2.y, gapSE2.theta);
  g.append('text').attr('x', mSE.l + 4).attr('y', mSE.t + 2)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#345')
    .text(`ε = ${eps.toFixed(2)}    |gap| = ${magGapSE.toExponential(2)}    pred. ε² = ${(eps * eps).toExponential(2)}`);

  // ════════════════════════════════════════════════════════════════════
  // Dividers
  // ════════════════════════════════════════════════════════════════════
  g.append('line').attr('x1', 0).attr('x2', split)
    .attr('y1', halfH).attr('y2', halfH)
    .attr('stroke', '#888').attr('stroke-width', 2);
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', 0).attr('y2', H)
    .attr('stroke', '#888').attr('stroke-width', 2);

  // ════════════════════════════════════════════════════════════════════
  // SO(3) panel (bottom-left)
  // ════════════════════════════════════════════════════════════════════
  g.append('rect').attr('x', 0).attr('y', halfH).attr('width', split).attr('height', halfH)
    .attr('fill', '#f4ecf8');
  g.append('rect').attr('x', 0).attr('y', halfH).attr('width', split).attr('height', 26)
    .attr('fill', '#6a1b9a');
  g.append('text').attr('x', 12).attr('y', halfH + 17)
    .attr('font-family', 'Source Sans 3').attr('font-weight', 700)
    .attr('font-size', 12).attr('fill', '#fff')
    .text('SO(3) — Rₓ(ε), Rᵧ(ε), Rₓ(-ε), Rᵧ(-ε) on the sphere');

  const inv2 = 1 / Math.SQRT2;
  const p0so3 = [inv2, 0, inv2];
  const { path: pathSO3, end: endSO3 } = loop4OnSphere(p0so3, eps, 22);
  const gapSO3 = [endSO3[0] - p0so3[0], endSO3[1] - p0so3[1], endSO3[2] - p0so3[2]];
  const predSO3 = [eps * eps * p0so3[1], -eps * eps * p0so3[0], 0];

  const mS3 = { t: halfH + 30, b: 6, l: 16, r: 16 };
  const sphereR = Math.min(split - mS3.l - mS3.r, halfH - 30 - mS3.b - 4) / 2.2;
  const sCx = mS3.l + (split - mS3.l - mS3.r) / 2;
  const sCy = halfH + 30 + (halfH - 30 - mS3.b - 4) / 2;

  g.append('circle').attr('cx', sCx).attr('cy', sCy).attr('r', sphereR)
    .attr('fill', '#fff').attr('fill-opacity', 0.55)
    .attr('stroke', '#bca3c8').attr('stroke-width', 1);

  function projSphere(p) {
    const pr = projOrtho(p);
    return { x: sCx + pr.u * sphereR, y: sCy - pr.v * sphereR, depth: pr.depth };
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = lat * Math.PI / 180;
    const ring = [];
    for (let lng = 0; lng <= 360; lng += 6) {
      const psi = lng * Math.PI / 180;
      const p = [Math.cos(phi) * Math.cos(psi), Math.sin(phi), Math.cos(phi) * Math.sin(psi)];
      ring.push(projSphere(p));
    }
    g.append('path')
      .attr('d', d3.line().defined(p => p.depth > -0.05).x(p => p.x).y(p => p.y)(ring))
      .attr('fill', 'none').attr('stroke', '#e8d8ee').attr('stroke-width', 1);
  }
  for (let lng = 0; lng < 180; lng += 30) {
    const arr = [];
    for (let lat = -90; lat <= 90; lat += 3) {
      const phi = lat * Math.PI / 180, psi = lng * Math.PI / 180;
      const p = [Math.cos(phi) * Math.cos(psi), Math.sin(phi), Math.cos(phi) * Math.sin(psi)];
      arr.push(projSphere(p));
    }
    g.append('path')
      .attr('d', d3.line().defined(p => p.depth > -0.05).x(p => p.x).y(p => p.y)(arr))
      .attr('fill', 'none').attr('stroke', '#e8d8ee').attr('stroke-width', 1);
  }

  const targetLegLen = 0.30;
  const displayBoost = Math.max(1, targetLegLen / Math.max(eps, 1e-4));
  function projAndBoost(p, zoom) {
    const pp = [
      p0so3[0] + zoom * (p[0] - p0so3[0]),
      p0so3[1] + zoom * (p[1] - p0so3[1]),
      p0so3[2] + zoom * (p[2] - p0so3[2]),
    ];
    const n = Math.hypot(pp[0], pp[1], pp[2]) || 1;
    const q = [pp[0] / n, pp[1] / n, pp[2] / n];
    return projSphere(q);
  }

  const legLen = pathSO3.length / 4;
  const legColors = ['#6a1b9a', '#7b1fa2', '#4a148c', '#9c27b0'];
  for (let leg = 0; leg < 4; leg++) {
    const seg = pathSO3.slice(leg * legLen, (leg + 1) * legLen + 1).map(p => projAndBoost(p, displayBoost));
    g.append('path')
      .attr('d', d3.line().x(p => p.x).y(p => p.y)(seg))
      .attr('fill', 'none').attr('stroke', legColors[leg]).attr('stroke-width', 2.4);
  }

  const ps = projAndBoost(p0so3, displayBoost);
  g.append('circle').attr('cx', ps.x).attr('cy', ps.y).attr('r', 4).attr('fill', '#4a148c');
  g.append('text').attr('x', ps.x - 6).attr('y', ps.y - 6).attr('text-anchor', 'end')
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#4a148c').text('p₀');
  const pe = projAndBoost(endSO3, displayBoost);
  g.append('circle').attr('cx', pe.x).attr('cy', pe.y).attr('r', 4).attr('fill', '#b71c1c');
  g.append('text').attr('x', pe.x + 6).attr('y', pe.y + 4)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#b71c1c').text('p_end');

  g.append('line').attr('x1', pe.x).attr('y1', pe.y).attr('x2', ps.x).attr('y2', ps.y)
    .attr('stroke', '#888').attr('stroke-width', 1.4).attr('stroke-dasharray', '4,3');
  const pPred = [p0so3[0] + predSO3[0], p0so3[1] + predSO3[1], p0so3[2] + predSO3[2]];
  const ppPred = projAndBoost(pPred, displayBoost);
  g.append('line').attr('x1', ps.x).attr('y1', ps.y).attr('x2', ppPred.x).attr('y2', ppPred.y)
    .attr('stroke', '#e65100').attr('stroke-width', 2.2)
    .attr('marker-end', 'url(#a2-arr-orange)');

  g.append('text').attr('x', mS3.l + 4).attr('y', halfH + 28)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#4a148c')
    .text(`zoom = ×${displayBoost.toFixed(1)}    |gap| = ${Math.hypot(...gapSO3).toExponential(2)}    pred. ε² = ${(eps * eps).toExponential(2)}`);

  // ════════════════════════════════════════════════════════════════════
  // Right panel: log-log convergence for BOTH groups
  // ════════════════════════════════════════════════════════════════════
  const mR = { t: 16, b: 36, l: 30, r: 18 };
  const epsArr = [];
  for (let lge = -3.0; lge <= 0.0; lge += 0.05) epsArr.push(Math.pow(10, lge));

  // SE(2) data
  const dataSE = epsArr.map(e => {
    const { end: en } = loop4OnSE2(e);
    const gap = Math.hypot(en.x, en.y, en.theta);
    const pr = { x: 0, y: -e * e, theta: 0 };
    const rs = Math.hypot(en.x - pr.x, en.y - pr.y, en.theta - pr.theta);
    return { e, raw: gap, residual: rs };
  });
  // SO(3) data
  const dataSO = epsArr.map(e => {
    const { end: en } = loop4OnSphere(p0so3, e, 16);
    const gp = [en[0] - p0so3[0], en[1] - p0so3[1], en[2] - p0so3[2]];
    const pr = [e * e * p0so3[1], -e * e * p0so3[0], 0];
    const rs = [gp[0] - pr[0], gp[1] - pr[1], gp[2] - pr[2]];
    return { e, raw: Math.hypot(...gp), residual: Math.hypot(...rs) };
  });

  const xR = d3.scaleLog().domain([1e-3, 1]).range([split + mR.l, W - mR.r]);
  const yR = d3.scaleLog().domain([1e-12, 2]).range([H - mR.b, mR.t + 12]);

  // Reference slope-2 and slope-3
  const ref2 = epsArr.map(e => ({ e, v: e * e }));
  const ref3 = epsArr.map(e => ({ e, v: e * e * e }));
  g.append('path')
    .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(p.v))(ref2))
    .attr('fill', 'none').attr('stroke', '#bbb').attr('stroke-width', 1)
    .attr('stroke-dasharray', '5,3');
  g.append('text').attr('x', xR(0.6)).attr('y', yR(0.36) - 4)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#888')
    .text('slope 2: ε²');
  g.append('path')
    .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(p.v))(ref3))
    .attr('fill', 'none').attr('stroke', '#bbb').attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,3');
  g.append('text').attr('x', xR(0.4)).attr('y', yR(0.064) + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#888')
    .text('slope 3: ε³');

  // SE(2) raw + residual
  g.append('path')
    .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(Math.max(p.raw, 1e-12)))(dataSE))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);
  if (showResid) {
    g.append('path')
      .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(Math.max(p.residual, 1e-12)))(dataSE))
      .attr('fill', 'none').attr('stroke', '#e65100').attr('stroke-width', 2.2);
  }
  // SO(3) raw + residual (slightly different colours for distinction)
  g.append('path')
    .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(Math.max(p.raw, 1e-12)))(dataSO))
    .attr('fill', 'none').attr('stroke', '#6a1b9a').attr('stroke-width', 2.2)
    .attr('stroke-dasharray', '4,2');
  if (showResid) {
    g.append('path')
      .attr('d', d3.line().x(p => xR(p.e)).y(p => yR(Math.max(p.residual, 1e-12)))(dataSO))
      .attr('fill', 'none').attr('stroke', '#c2185b').attr('stroke-width', 2.2)
      .attr('stroke-dasharray', '4,2');
  }

  g.append('line').attr('x1', xR(eps)).attr('x2', xR(eps))
    .attr('y1', mR.t + 12).attr('y2', H - mR.b)
    .attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-dasharray', '2,3');

  g.append('g').attr('transform', `translate(0,${H - mR.b})`)
    .call(d3.axisBottom(xR).ticks(4))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));
  g.append('g').attr('transform', `translate(${split + mR.l},0)`)
    .call(d3.axisLeft(yR).ticks(5))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));

  // Legend
  const lgX = split + mR.l + 6, lgY = mR.t + 16;
  const lgH = showResid ? 70 : 38;
  g.append('rect').attr('x', lgX - 4).attr('y', lgY - 12).attr('width', 230).attr('height', lgH)
    .attr('fill', 'white').attr('fill-opacity', 0.92)
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('rx', 3);

  let row = 0;
  function legendRow(color, dash, label) {
    const yy = lgY + row * 16;
    g.append('line').attr('x1', lgX).attr('x2', lgX + 18).attr('y1', yy).attr('y2', yy)
      .attr('stroke', color).attr('stroke-width', 2.2)
      .attr('stroke-dasharray', dash || null);
    g.append('text').attr('x', lgX + 22).attr('y', yy + 4)
      .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', color)
      .text(label);
    row++;
  }
  legendRow('#1565c0', null, 'SE(2)  |gap|         ~ ε²');
  legendRow('#6a1b9a', '4,2', 'SO(3)  |gap|         ~ ε²');
  if (showResid) {
    legendRow('#e65100', null, 'SE(2)  |residual|     ~ ε³');
    legendRow('#c2185b', '4,2', 'SO(3)  |residual|     ~ ε³');
  }

  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', mR.t).attr('y2', H - mR.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
}

// ── Figure A1.3 — coadjoint orbit cylinder ─────────────────────────────
function drawOrbit() {
  const svg = document.getElementById('fig-orbit');
  if (!svg) return;
  const c = parseFloat(document.getElementById('orbit-c').value) / 100;
  const h3 = parseFloat(document.getElementById('orbit-h3').value) / 100;
  document.getElementById('orbit-c-val').textContent = c.toFixed(2);
  document.getElementById('orbit-h3-val').textContent = (h3 >= 0 ? '+' : '') + h3.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  const margin = { t: 18, b: 26, l: 60, r: 30 };
  const plotW = W - margin.l - margin.r;
  const plotH = H - margin.t - margin.b;

  // Project (h1, h2, h3) onto a 2D canvas using a fake-3D oblique view.
  // h1 horizontal, h3 vertical, h2 receding axis at 30°.
  const cosA = Math.cos(Math.PI / 6), sinA = Math.sin(Math.PI / 6);
  const scale = Math.min(plotW, plotH) / 4;
  const ox = margin.l + plotW / 2, oy = margin.t + plotH / 2;
  const project = (h1, h2, h3) => ({
    x: ox + scale * (h1 - 0.5 * cosA * h2),
    y: oy - scale * (h3 + 0.5 * sinA * h2),
  });

  // Draw cylinder mesh: hoops at several h3 levels
  const r = Math.sqrt(c);
  for (let h3i = -1; h3i <= 1; h3i += 0.25) {
    const ring = [];
    for (let phi = 0; phi <= 2 * Math.PI + 0.01; phi += 0.05) {
      ring.push(project(r * Math.cos(phi), r * Math.sin(phi), h3i));
    }
    g.append('path')
      .attr('d', d3.line().x(p => p.x).y(p => p.y)(ring))
      .attr('fill', 'none').attr('stroke', '#e0e0e0').attr('stroke-width', 1);
  }
  // Vertical generators
  for (let phi = 0; phi < 2 * Math.PI; phi += Math.PI / 6) {
    const a = project(r * Math.cos(phi), r * Math.sin(phi), -1);
    const b = project(r * Math.cos(phi), r * Math.sin(phi), 1);
    g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y)
      .attr('stroke', '#e8e8e8').attr('stroke-width', 1);
  }

  // Trajectory of (h1, h2, h3) on the orbit:
  // Lie–Poisson: ḣ1 = h2·h3, ḣ2 = -h1·h3, ḣ3 = 0
  // ⇒ h1(t) = √c·cos(-h3·t + φ0), h2(t) = √c·sin(-h3·t + φ0)
  const T = 12;
  const traj = [];
  for (let t = 0; t <= T; t += 0.05) {
    const ph = -h3 * t;
    traj.push(project(r * Math.cos(ph), r * Math.sin(ph), h3));
  }
  g.append('path')
    .attr('d', d3.line().x(p => p.x).y(p => p.y)(traj))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);

  // Endpoints
  g.append('circle').attr('cx', traj[0].x).attr('cy', traj[0].y).attr('r', 4).attr('fill', '#1565c0');
  const tEnd = traj[traj.length - 1];
  g.append('circle').attr('cx', tEnd.x).attr('cy', tEnd.y).attr('r', 4)
    .attr('fill', '#1565c0').attr('opacity', 0.5);

  // Axis arrows
  const axisLen = scale * 1.4;
  const oCenter = project(0, 0, 0);
  const axEnd = (dx, dy) => ({ x: oCenter.x + dx, y: oCenter.y + dy });
  const lblFont = 12;
  // h1
  g.append('line').attr('x1', oCenter.x).attr('y1', oCenter.y)
    .attr('x2', oCenter.x + axisLen).attr('y2', oCenter.y)
    .attr('stroke', '#444').attr('stroke-width', 1.2);
  g.append('text').attr('x', oCenter.x + axisLen + 4).attr('y', oCenter.y + 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', lblFont).attr('fill', '#444')
    .text('h₁');
  // h3 (vertical)
  g.append('line').attr('x1', oCenter.x).attr('y1', oCenter.y)
    .attr('x2', oCenter.x).attr('y2', oCenter.y - axisLen)
    .attr('stroke', '#444').attr('stroke-width', 1.2);
  g.append('text').attr('x', oCenter.x + 4).attr('y', oCenter.y - axisLen)
    .attr('font-family', 'Source Sans 3').attr('font-size', lblFont).attr('fill', '#444')
    .text('h₃');
  // h2 (receding)
  g.append('line').attr('x1', oCenter.x).attr('y1', oCenter.y)
    .attr('x2', oCenter.x - 0.5 * cosA * scale * 1.2).attr('y2', oCenter.y - 0.5 * sinA * scale * 1.2)
    .attr('stroke', '#444').attr('stroke-width', 1.2);
  g.append('text').attr('x', oCenter.x - 0.5 * cosA * scale * 1.3 - 8)
    .attr('y', oCenter.y - 0.5 * sinA * scale * 1.3 - 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', lblFont).attr('fill', '#444')
    .text('h₂');

  // Status text
  g.append('text').attr('x', margin.l + 4).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`c = ${c.toFixed(2)}    h₃ = ${h3.toFixed(2)}    angular rate = ${-h3.toFixed(2)}`);
}

// ── Wire up & boot ────────────────────────────────────────────────────
function wire() {
  ['osg-a1', 'osg-a2', 'osg-a3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawOSG);
  });
  ['bracket-eps', 'bracket-residual'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawBracket);
    if (el) el.addEventListener('change', drawBracket);
  });
  ['orbit-c', 'orbit-h3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawOrbit);
  });

  drawOSG();
  drawBracket();
  drawOrbit();

  window.addEventListener('resize', () => {
    drawOSG();
    drawBracket();
    drawOrbit();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

})();
</script>
