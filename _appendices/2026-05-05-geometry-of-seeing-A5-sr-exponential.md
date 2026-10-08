---
layout: distill
image: /public/img/posts/geometry-seeing-1.svg
title: "Appendix A5 — The Sub-Riemannian Exponential Map of SE(2)"
subtitle: >
  How initial-costate parameters $(c, \omega_0, \phi_0)$ generate every
  SE(2) geodesic from the origin; what conjugate, cut, and Maxwell points
  are; why the elastica mirror pair first ties after one curvature period
  $4K(k^2)$ while the free SR cut fires at half a pendulum period,
  $2K(k^2)$.  Bridges Parts 1–2 to Parts 3–4.
date: 2026-05-05 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, optimal-control, jacobi-elliptic, elliptic-integrals, lie-groups]
description: >
  The SR exponential map of SE(2): closed-form geodesic ends via Jacobi
  elliptic functions, conjugate points and the second variation, Maxwell
  pairs, and the cut locus.  Self-contained capstone of the Geometry of
  Seeing appendices.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: A5
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
permalink: /mathematics/2026/05/05/geometry-of-seeing-A5-sr-exponential/
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix is for</div>

Parts&nbsp;3 and 4 of the series discuss the <strong>cut locus</strong> and
the <strong>Maxwell strata</strong> of the SE(2) sub-Riemannian problem.
This appendix builds the object both rest on: the SR exponential map.
It also makes precise the difference between the matrix exponential of
Appendix A1 and this SR exponential — they are <em>different functions</em>
on the same manifold.  The interactive figures borrow the geodesic-family
visualisation directly from the
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">elliptic
project's Dubins–visual-cortex example</a>; the Maxwell-pair and
conjugate-locus figures formalise what that figure was already showing.

</div>

## Two exponential maps, both relevant

Lie-group $\exp$ (Appendix A1):

$$\exp_{\mathrm{group}}: \mathfrak{se}(2) \to \mathrm{SE}(2), \qquad
  X \mapsto \exp(X) \cdot e.$$

The 1-parameter subgroups $t \mapsto \exp(tX) \cdot e$ would be the
geodesics of a **bi-invariant** Riemannian metric — but Appendix A1 showed
$\mathrm{SE}(2)$ carries *no* such metric (its adjoint action is
non-compact).  They remain the natural "group-straight" curves on
$\mathrm{SE}(2)$; they are certainly not the geodesics of the
sub-Riemannian (SR) metric of Part&nbsp;1's primary-visual-cortex (V1) model.

Sub-Riemannian $\mathrm{Exp}$:

$$\mathrm{Exp}: \mathfrak{se}(2)^{\ast} \times \mathbb R_{\geq 0} \to \mathrm{SE}(2),
  \qquad (\mu_0, t) \mapsto g(t),$$

where $g(t)$ is the SR geodesic with initial costate $\mu_0 = (h_1^0, h_2^0,
h_3^0) \in \mathfrak{se}(2)^{\ast}$ on the unit-Hamiltonian surface
$h_1^2 + h_2^2 = 1$.  This is the map that generates "Petitot's family of
candidate completion paths" from a fixed lifted state. When we say "exponential
map" in Parts&nbsp;3–4 we always mean *this* one.

Two parametrisations of the same costate space are convenient:

- **Cylinder coordinates** $(c, \omega_0, \phi_0)$: $h_1 = \sqrt c \cos\phi_0,
  h_2 = \sqrt c \sin\phi_0, h_3 = \omega_0$.  By rescaling, set $c = 1$ on
  the energy surface.
- **Pendulum-energy coordinates** $(E, \phi_0)$: $E = 2C - 1$ with the
  Casimir $C = h_1^2 + h_3^2$ (Appendix A3).  Here $E < 1$ is libration
  (the oscillating-pendulum family $C_1$), $E = 1$ is the separatrix ($C_3$), $E > 1$ is
  rotation (the rotating-pendulum family $C_2$).  A note on names: for the *elastica*
  these regimes are the inflectional, borderline and non-inflectional curves of
  Part&nbsp;2, but Moiseev–Sachkov (2010) call the $C_1$ planar trajectories of the free
  SR problem *non-inflexional* and the $C_2$ ones *inflexional* — the reverse pairing —
  which is why this series names the SR families by pendulum regime.

The exponential map is a **smooth map** $\mathrm{Exp}_T :
\mathfrak{se}(2)^{\ast}_{c=1} \to \mathrm{SE}(2)$ at each time $T$; it is
generically a local diffeomorphism but has degeneracies — that is the
whole story of cut/conjugate analysis.

## Closed-form geodesic endpoints

Two closed forms live here, one per horizontal problem — and this appendix keeps
them apart (Part&nbsp;2, Appendix A3).

**The elastica sister curve** (pinned $u_1 \equiv 1$; the smooth family every figure
in this series integrates).  With heading $\theta(s) = 2\arcsin(k\,\mathrm{sn}(s\mid k^2))$,

$$\boxed{\;x(s) \;=\; 2E(\mathrm{am}(s\mid k^2)\mid k^2) - s,\;}$$

$$\boxed{\;y(s) \;=\; 2k\bigl(1 - \mathrm{cn}(s\mid k^2)\bigr).\;}$$

**The free SR geodesics** (Moiseev–Sachkov 2010, §3.3 "Parameterization of extremal
trajectories" of the journal version — §4.3 in the preprint arXiv:0807.4731; the
displays are unnumbered in both).  In the paper's
elliptic coordinates $(\varphi, k)$ on $C_1$ — here, and only in this formula,
$\varphi$ is the *time along the pendulum orbit* (not the pendulum angle), with
$\varphi_t = \varphi + t$ — e.g.

$$y_t \;=\; \tfrac{1}{k}\bigl[\,\mathrm{sn}\,\varphi\,(\mathrm{dn}\,\varphi - \mathrm{dn}\,\varphi_t) - \mathrm{cn}\,\varphi\,\bigl(t + \mathrm{E}(\varphi) - \mathrm{E}(\varphi_t)\bigr)\bigr],$$

with matching expressions for $x_t$ and $\sin\theta_t$ (the paper's $x_t$ and
$\sin\theta_t$ carry the sign $s_1 = \operatorname{sgn}\cos(\gamma/2)$).  Conventions
of the paper, as used in this display: Jacobi functions are written with the *modulus*
$k$ (parameter $m = k^2$ in this series), and $\mathrm{E}(\varphi) =
E(\mathrm{am}\,\varphi \mid k^2)$ is Jacobi's epsilon function.  Still nothing but
$\mathrm{sn}, \mathrm{cn}, \mathrm{dn}$ and incomplete elliptic integrals, but a
*different* curve: with the paper's pendulum angle $\gamma_t$ (controls $u_1 =
\sin(\gamma_t/2)$, $u_2 = -\cos(\gamma_t/2)$, its eq. (3.9)) the plane projection has
curvature $u_2/u_1 = -\cot(\gamma_t/2)$ — the same quantity as the
$\cot(\varphi/2)$ of Appendix A3, whose pendulum angle is $\varphi = 2\pi - \gamma$ —
and generic **cusps** wherever the forward speed changes sign.  No numerical ODE
integration is needed for either family.

Three takeaways:

1. **$\mathrm{Exp}_T(\mu_0)$ is a transcendental but explicit function of
   $T$ and the initial costate.**  Compute every entry with two
   `elliptic12` calls and one `ellipj` call.
2. **Periodic curvature is not necessarily a closed curve.** Since
   $\mathrm{cn},\mathrm{sn}$ are $4K(k^2)$-periodic, the elastica curvature
   and tangent repeat after $4K(k^2)$, but $(x,y)$ generally acquires a
   translational drift. Closure requires the additional condition that this
   net displacement vanish; the figure-eight modulus is a special case.
3. **The exponential map is *not injective.***  Different $(c, \omega_0,
   \phi_0)$ can land at the same $g(T)$.  When two distinct costates
   produce the same end with the same $T$, that endpoint is a **Maxwell
   point**, and the corresponding $T$ is its **Maxwell time**.

</div><!-- /.l-body -->

<!-- Fig A5.1 — Shoot the SR exp map -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>family
        <select id="exp-family">
          <option value="inflectional" selected>inflectional (k &lt; 1)</option>
          <option value="separatrix">separatrix (k = 1, borderline elastica)</option>
          <option value="noninflectional">non-inflectional (k &gt; 1)</option>
        </select>
      </label>
      <label>$k$ (or $m = 2 - k$ for non-infl.)
        <input type="range" id="exp-k" min="5" max="195" value="70" step="1">
        <span class="ctrl-val" id="exp-k-val">0.70</span>
      </label>
      <label>arc length $T$
        <input type="range" id="exp-T" min="20" max="800" value="200" step="5">
        <span class="ctrl-val" id="exp-T-val">2.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">
        pinned elastica endpoint from origin
      </span>
    </div>
    <svg id="fig-expmap" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.1.</strong> The elastica sister curve for $s \in [0, T]$
    — the smooth family ($\kappa = 2k\,\mathrm{cn}$) that stands in for the free
    SR geodesics throughout the series' figures (the true SR projections are their
    cuspidal cousins; §Closed-form above).  The blue, red, green colour scheme
    matches Part&nbsp;1 Figure&nbsp;4 — and indeed this figure is the same one,
    lifted to a more controllable form.  As $k \to 1^-$ the inflectional family's
    period $4K(k^2)$ diverges (Appendix A4) and the curve approaches the
    borderline elastica on bounded intervals; for
    $k > 1$ (non-inflectional) the curvature is one-signed with spatial
    period $T = 2K(m)$ (a closed circle only in the $m \to 0$ limit).  The endpoint dot is the
    endpoint of the selected pinned elastica at $T$. It is not the value of
    the free-SR exponential map unless the free reconstruction is used.
    <em>Axes and units:</em> the plane $(x, y)$ — $x$ to the right, $y$ up, origin at
    the grey dot, faint lines the axes $y = 0$ and $x = 0$ — in dimensionless units of
    the elastica length scale $\ell$ (the unit of arc length in which the inflectional curvature is $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$ and the pendulum equation is $\ddot\varphi + \sin\varphi = 0$); no tick axes, the scale bar (bottom left) gives the length scale. The
    readout lists the endpoint as $(x, y, \theta)$ with $\theta$ in radians.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Conjugate points and Jacobi fields

<aside id="note-jacobi-field">
A <strong>Jacobi field</strong> is the linearised version of "wiggle the
geodesic and see what happens." It satisfies a second-order linear ODE
along $\gamma$ — the Jacobi equation — whose solutions form a
$2\dim G$-dimensional vector space. The Jacobi fields starting from
$J(0) = 0$ describe geodesics through the same starting point with nearby
initial directions. A <em>conjugate point</em> is where one of these
fanned-out family members closes up again.
</aside>

A <span class="annotated-term" data-note="note-jacobi-field">**Jacobi field**</span> along a geodesic $\gamma : [0, T] \to G$ is a
variational vector field $$J(s) \in T_{\gamma(s)} G$$ obtained by varying
$\gamma$ through nearby geodesics with the same $\gamma(0)$:

$$J(s) \;=\; \tfrac{\partial}{\partial\varepsilon}\Big|_{\varepsilon=0} \gamma_\varepsilon(s),$$

where $$\gamma_\varepsilon$$ is a 1-parameter family of geodesics with $\gamma_0 = \gamma$.

A point $\gamma(t^{\ast})$ is a **conjugate point** to $\gamma(0)$ if a
non-trivial Jacobi field with $J(0) = 0$ also has $J(t^{\ast}) = 0$.
Equivalently, $t^{\ast}$ is a time at which the differential of the SR
exponential map is singular:

$$\det d_{\mu_0}\!\mathrm{Exp}_{t^{\ast}} \;=\; 0.$$

**The relevance:** past the first conjugate point, the geodesic stops being
a *local* length-minimiser.  Any sufficiently small perturbation produces
a strictly shorter horizontal curve.  This is the SR analogue of the
classical Riemannian Morse-theoretic statement.

For SE(2), Sachkov's analysis (2010, Thms 2.1–2.5 of the journal version; Thms 2.1–2.6
in the preprint arXiv:0903.0727) shows something stronger and
cleaner than a bound:

- **Oscillating-pendulum ($C_1$) and separatrix ($C_3$) families: no conjugate points at all.** Along every
  oscillating-pendulum geodesic (and the critical-energy ones) local optimality
  *never* fails — $t_{\mathrm{conj}} = +\infty$.
- **Rotating-pendulum family ($C_2$) only:** the first conjugate time is finite, pinched between
  elliptic quantities, $2k\,p_1^1(k) \le t_{\mathrm{conj}} \le \min\bigl(4kK(k),\,
  2k\,p_1^{\alpha_1}(k)\bigr)$, where $p_1^1$ is the first positive root of
  $f_1(p) = \mathrm{cn}\,p\,(E(p)-p) - \mathrm{dn}\,p\,\mathrm{sn}\,p$ — and the
  binding branch switches exactly at the figure-eight modulus $k_0 \approx 0.909$
  (the root of $2E = K$ from Part&nbsp;2).
- The astroidal caustic visible in Figure A5.3 is the conjugate structure of the
  smooth **elastica sister family** the figure integrates — Euler's elastic problem
  does have conjugate points; the free SR oscillating-pendulum ($C_1$) geodesics do not.

## Cut and Maxwell points

The **cut time** is the last $t$ up to which $\gamma$ is *globally*
length-minimising — for any later $t$ there is some other horizontal curve from
$\gamma(0)$ to $\gamma(t)$ with strictly smaller SR length; $\gamma(t_{\mathrm{cut}})$
is the **cut point**.  In general the cut time satisfies $$t_{\mathrm{cut}} \leq t_{\mathrm{conj}}$$
(losing local optimality is at least as hard as losing global).

A **Maxwell point** is a point where two *distinct* geodesics from
$\gamma(0)$ meet with **equal** SR length.  These come from discrete
symmetries of the problem: the pendulum carries the reflection group
$\{\mathrm{Id}, \varepsilon^1, \dots, \varepsilon^7\} \cong (\mathbb Z_2)^3$
of Moiseev–Sachkov (2010, §4.1.1 of the journal version; §5.1.1 in the preprint), "the group of symmetries of a parallelepiped".  In
the paper's coordinates $(\gamma, c)$ on the pendulum's phase cylinder ($\gamma \in
\mathbb R/4\pi\mathbb Z$ the pendulum angle, $c = \dot\gamma$) it is generated by the
three reflections $\varepsilon^1 : (\gamma, c) \mapsto (\gamma, -c)$,
$\varepsilon^2 : (\gamma, c) \mapsto (-\gamma, c)$ and
$\varepsilon^4 : (\gamma, c) \mapsto (\gamma + 2\pi, c)$, with
$\varepsilon^3 = \varepsilon^1 \circ \varepsilon^2$ and $\varepsilon^{i+4} =
\varepsilon^4 \circ \varepsilon^i$; $\varepsilon^1, \varepsilon^2, \varepsilon^5,
\varepsilon^6$ reverse the direction of time along pendulum trajectories and
$\varepsilon^3, \varepsilon^4, \varepsilon^7$ preserve it.  The
fixed-point sets of these reflections on the exponential map are the Maxwell
strata.

A Maxwell point always gives the upper bound $t_{\mathrm{cut}} \le
t_{\mathrm{Maxwell}}^{(1)}$.  For SE(2) the bound is attained (Sachkov 2010, Thm 3.3):

$$\boxed{\;t_{\mathrm{cut}} \;=\; t_{\mathrm{Maxwell}}^{(1)},\;}$$

i.e. the cut time equals the first Maxwell time $\mathfrak t(\lambda)$ of this
group.  The same equality has been proved case by case in several other highly
symmetric left-invariant problems, but it is not a general theorem (Part&nbsp;4).
Characterising the Maxwell strata is the work of Moiseev–Sachkov
(2010, arXiv:0807.4731); the equality is Sachkov (2010) and the full cut locus
and optimal synthesis Sachkov (2011) — both from the preprint arXiv:0903.0727.

For the oscillating-pendulum family ($C_1$) with modulus $k$ the value is strikingly simple:

$$t_{\mathrm{cut}}(k) \;=\; \mathfrak t(\lambda) \;=\; 2K(k^2),$$

**half a pendulum period** — while the smooth elastica *sister* family first
ties with its own mirror image only after a full curvature period,
$s = 4K(k^2)$ (the coincidence Figure A5.2 plays with).  The elliptic clock
$K(k^2)$ runs both problems; how the half-versus-full period split arises is
the heart of Parts&nbsp;3–4.

</div><!-- /.l-body -->

<!-- Fig A5.2 — σ-symmetric pair and its first coincidence -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$k$
        <input type="range" id="mx-k" min="20" max="98" value="85" step="1">
        <span class="ctrl-val" id="mx-k-val">0.85</span>
      </label>
      <label>$T$ (arc length)
        <input type="range" id="mx-T" min="10" max="120" value="50" step="1">
        <span class="ctrl-val" id="mx-T-val">5.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">
        γ_A: κ = +2k·cn — γ_B: κ = −2k·cn — coincidence requires y_A(s) = 0
      </span>
    </div>
    <svg id="fig-maxwell" style="width:100%;height:400px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.2.</strong> The <strong>σ-symmetric pair</strong>:
    two pinned elastica $\gamma_A, \gamma_B$ leaving the origin with curvatures
    $\pm 2k\,\mathrm{cn}(s\mid k^2)$ respectively.  By the
    $y \to -y$ reflection symmetry of the pendulum equation,
    $\gamma_B(s) = (x_A(s),\, -y_A(s),\, -\theta_A(s))$ — they trace
    mirror-image curves.  As SE(2) configurations, they coincide exactly
    when $y_A(s) = 0$ <em>and</em> $\theta_A(s) \in \{0, \pi\} \pmod{2\pi}$
    (here only $0$ occurs, since $|\theta_A| \le 2\arcsin k < \pi$).
    Panel (a) is the plane $(x, y)$ ($x$ right, $y$ up; blue $\gamma_A$, red dashed
    $\gamma_B$, grey dashed segment joining their current endpoints); panel (b) plots
    the plane separation $|\gamma_A(s) - \gamma_B(s)| = 2|y_A(s)|$ (vertical axis)
    against arc length $s$ (horizontal axis) — all lengths dimensionless, in units of
    the elastica length scale $\ell$ (the unit of arc length in which the inflectional curvature is $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$ and the pendulum equation is $\ddot\varphi + \sin\varphi = 0$); panel (a) has no tick axes, its scale bar gives the length scale. In
    (b) the blue dotted guide is the current $T$ and the grey dashed one $4K(k^2)$;
    the first zero of the separation (red marker, if any) is the
    <strong>first Maxwell time of this pair</strong>.
    Because $y_A(s) = 2k\bigl(1 - \mathrm{cn}(s\mid k^2)\bigr) \ge 0$ returns to
    zero only at $s = 4K(k^2)$ (and its multiples), the pair first re-coincides
    in full — position <em>and</em> heading — at $s = 4K(k^2)$, for every
    $k$: the first Maxwell coincidence of the <em>elastica sister family</em> —
    the smooth curves this figure integrates.  (For the free SR problem the same
    symmetry machinery gives a cut at $2K(k^2)$, half this value; §Cut above.)
    At the special "figure-eight" modulus
    $k_0 \approx 0.909$ (root of $2E(k^2) = K(k^2)$) that shared endpoint sits
    back at the origin, so the closed curve is itself a single self-crossing
    figure-eight; for other $k$ the two curves still meet at $s = 4K(k^2)$, just
    away from the origin.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## How a wavefront forms from a family of geodesics

Fix $T$ and vary the initial costate over a 1-parameter slice of the
unit-energy surface — concretely, signed initial curvature $k \in [-0.95, 0.95]$
in $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^2)$.  Each $k$ launches a distinct
geodesic from the origin.  The set of *positions* reached at exact arc
length $T$ — one position per geodesic — is the **wavefront** at time $T$:

$$\mathcal W_T \;:=\; \bigl\{\,(x(T;k),\; y(T;k)) : k \in [-0.95, 0.95]\,\bigr\} \;\subset\; \mathbb R^2.$$

It is a *continuous curve* in the plane (because $k \mapsto $ trajectory is
continuous), and as $T$ grows it sweeps outward.  At small $T$ — since every
geodesic leaves the origin heading the same way and curves only gently —
the wavefront is a short, almost-straight arc near $(T, 0)$, transverse to
the launch direction.  As $T$
approaches the elastica mirror-tie time $T_{\mathrm M} = 4K(k^2)$,
neighbouring trajectories begin to converge and the wavefront develops
**cusps** — points where this one-parameter family folds
($\partial_k(x, y) = 0$), the planar shadow of the mechanism by which an
exponential map becomes singular at conjugate points.

Visually, this looks remarkably like the SR analogue of the Riemannian
*caustic* — the bright curves you see at the bottom of a coffee cup when
light reflects.  The same mathematics: failure of the exponential map to
be locally surjective along a critical curve.

</div><!-- /.l-body -->

<!-- Fig A5.3 — Wavefront formation -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>arc length $T$
        <input type="range" id="conj-T" min="2" max="100" value="65" step="1">
        <span class="ctrl-val" id="conj-T-val">6.50</span>
      </label>
      <label>show ghost wavefronts
        <input type="checkbox" id="conj-ghost" checked>
      </label>
      <label>show sampled bend markers
        <input type="checkbox" id="conj-cusps" checked>
      </label>
      <button id="conj-play" type="button" style="padding:4px 14px;font-family:var(--sans);font-size:13px;border:1px solid #1565c0;background:#1565c0;color:#fff;border-radius:4px;cursor:pointer;">▶ play</button>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">
        Faint trajectories sweep $k \in [-0.95, 0.95]$; the bold curve is $\mathcal W_T$
      </span>
    </div>
    <svg id="fig-conjugate" style="width:100%;height:440px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A5.3.</strong> A wavefront forming.  39 trajectories,
    one per signed modulus $k$, are drawn in faint blue (forward-curving,
    $k > 0$) and faint red ($k < 0$) up to the current arc length $T$.
    The thick coloured curve passing through their endpoints is the
    <strong>wavefront</strong> $\mathcal W_T$ at that $T$.  Three lighter
    "ghost" wavefronts at $T/4, T/2, 3T/4$ (toggleable) show how
    $\mathcal W_T$ moves outward and reshapes as time grows.  Slide $T$
    forward and watch:
    <ol style="margin:6px 0 6px 18px;font-family:inherit;font-size:inherit;">
      <li>at small $T$ the wavefront is a short arc near $(T, 0)$;</li>
      <li>at $T \approx \pi$ it lengthens and starts to flatten;</li>
      <li>around $T \approx 2\pi$ — the smallest period $4K(0)$ in the swept
        family (the near-straight $k \to 0$ curves) — the first
        <em>sharp bends become visible</em> in the sampled endpoint slice (red rings, found
        by a turning-angle heuristic): sharp bends in this sampled one-parameter planar slice. These rings do not certify a cusp or a conjugate point; that requires the differential of the full endpoint map. The free
        SR oscillating-pendulum ($C_1$) geodesics have none (Sachkov 2010, Thm 2.1);</li>
      <li>as $T$ grows the wavefront self-intersects: at those crossings two
        different curves reach the same plane point at equal spatial arclength. This alone does not give a Maxwell point: the headings and the cost for the chosen variational problem must also agree. The mirror pair of Figure A5.2 has the required symmetry, but this diagram does not test arbitrary crossings.</li>
    </ol>
    <em>Axes:</em> the plane $(x, y)$ ($x$ right, $y$ up, origin at the black dot,
    faint lines the axes), dimensionless in units of $\ell$; no tick axes — the scale
    bar (bottom right) gives the length scale and rescales as $T$ grows.
    Press <em>play</em> to animate $T$ continuously.  This is a slice of endpoints of pinned elastica at fixed spatial arclength, not an SR distance sphere or a computed conjugate locus. Euler's elastic problem has its own conjugate-point theory; the free SR oscillating-pendulum ($C_1$) geodesics have no conjugate points.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Connection to the elliptic project

Figure A5.1 is, modulo cosmetics, the same family of curves as
<a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
"Geodesic family from a fixed base point"</a> in the elliptic project's
Dubins-visual-cortex page.  The two visualisations share the same
integration routine (`integrateElastica` in `elliptic-core.js`) and the
same colour palette.  The difference is that this appendix interprets
the curves as pinned-elastica endpoint illustrations, isolates the mirror pair, and
shows a fixed-arclength endpoint slice. The slice illustrates endpoint geometry;
it does not compute a conjugate locus. Parts&nbsp;3 and 4 develop the Maxwell and
cut-time mechanisms separately.

The Dubins-back-wheel cuspidal trajectories of the elliptic project
(<a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
parking-style curves with cusps</a>) are also relevant here: they are
projections of SE(2) geodesics in the regime where the rear-axle
forward velocity changes sign.  Those cusps belong to a *single trajectory*
(the forward speed $u_1$ passing through zero) and should not be confused with
the wavefront cusps of Figure A5.3, which are singularities of a *family* of
trajectories.

## Code

```python
# Generate the mirror pair for the pinned inflectional elastica problem.
# This is the 4K elastica tie, not the 2K first Maxwell/cut event of free SR.
import numpy as np
from elliptic import ellipj, agm

ellipticK = lambda m: np.pi / (2 * agm(1.0, np.sqrt(1 - m)))   # K(m) = π / (2·AGM(1, √(1−m)))

def inflectional_elastica(k, sign, T, N=1500):
    """Compute one member (sign = ±1) of the pinned mirror pair."""
    m = k * k
    s = np.linspace(0, T, N)
    sn, cn, dn, _ = ellipj(s, m)   # vectorised; returns (sn, cn, dn, am)
    # Heading half-angle: sin(θ/2) = k·sn(s|m), so θ = 2·arcsin(k·sn).
    # Curvature κ = dθ/ds = 2k·cn·dn / sqrt(1 − k²sn²) = 2k·cn  (since dn = sqrt).
    kappa = sign * 2 * k * cn * dn / np.sqrt(1 - k * k * sn * sn)
    theta = np.zeros_like(s)
    x = np.zeros_like(s)
    y = np.zeros_like(s)
    # Cumulative trapezoidal
    dt = T / (N - 1)
    for i in range(1, N):
        thmid = theta[i-1] + 0.5 * kappa[i-1] * dt
        x[i] = x[i-1] + np.cos(thmid) * dt
        y[i] = y[i-1] + np.sin(thmid) * dt
        theta[i] = theta[i-1] + kappa[i-1] * dt
    return x, y, theta

k = 0.55
omega0 = 1.0
T_maxwell = 4 * ellipticK(k * k) / omega0   # elastica mirror-pair tie (SR cut is 2K)
print(f"elastica mirror-tie time T₁ = 4K(k²)/ω₀ = {T_maxwell:.4f}")

# Two pinned extremals with opposite curvature.
xA, yA, thA = inflectional_elastica(k, +1, T_maxwell)
xB, yB, thB = inflectional_elastica(k, -1, T_maxwell)

err = np.hypot(xA[-1] - xB[-1], yA[-1] - yB[-1])
print(f"|γA(T₁) − γB(T₁)|  =  {err:.2e}")     # ≈ 2e-2 at N = 1500 (first-order stepping); → 0 like 1/N
```

```python
# Conjugate time of the ELASTICA family (schematic scale, one curvature period).
# NB: the free SR oscillating-pendulum (C1) geodesics have NO conjugate points at all
# (Sachkov 2010, Thm 2.1) — this heuristic applies to the elastica sister
# problem, where conjugate points do occur on the 4K scale.
def conjugate_scale_elastica(k):
    """Heuristic scale (one curvature period), not a closed form."""
    return 4 * ellipticK(k * k)

for k in (0.1, 0.3, 0.5, 0.7, 0.9, 0.95):
    print(f"k = {k:4.2f}:  ~T_conj(elastica) = {conjugate_scale_elastica(k):.4f}")
```

## What we covered, and where Parts&nbsp;3–4 go next

The SR exponential map of $\mathrm{SE}(2)$ takes initial costates to
group endpoints; its closed form involves Jacobi elliptic functions and
incomplete elliptic integrals.  Conjugate points mark the loss of local
optimality; cut points mark the loss of global optimality.  Maxwell
points are the symmetric mechanism by which optimality fails — two
distinct geodesics meeting with the same SR length.  For the oscillating-pendulum
family ($C_1$) the free SR cut fires at $2K(k^2)$ — half a pendulum period — while
the smooth elastica sister pair first ties at $4K(k^2)$, one full curvature
period: the same elliptic clock, two problems.

What Parts&nbsp;3 and 4 of the blog series do with it:

- **Part&nbsp;3** develops the Maxwell mechanism via the pendulum's
  reflection group $(\mathbb Z_2)^3$, computes the mirror-pair tie exactly on
  the elastica family ($s = 4K(k^2)$, one curvature period), and states the
  SR result it bounds: $t_{\mathrm{cut}} \le \mathfrak t(\lambda)$.
- **Part&nbsp;4** presents Sachkov's theorem $t_{\mathrm{cut}} = \mathfrak
  t(\lambda)$ — for the oscillating-pendulum family ($C_1$) $2K(k^2)$, half a pendulum
  period, with <em>no conjugate points at all</em> along the way — and lays
  out what stays genuinely open: the general Maxwell-equals-cut question
  beyond $\mathrm{SE}(2)$.

The five appendices A1–A5 supply every prerequisite: Lie groups (A1),
distributions and contact structures (A2), the Pontryagin Maximum
Principle and Lie–Poisson reduction (A3), Jacobi elliptic functions and
the arithmetic–geometric mean (A4), and the SR exponential map (A5).  With them in hand, Parts&nbsp;1 and 2 should read
fluently, and Parts&nbsp;3 and 4 become approachable.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010).  "Maxwell strata in
    sub-Riemannian problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>. Journal numbering: §3.3,
    geodesics in Jacobi functions; §4.1.1, the reflections
    $\varepsilon^1, \dots, \varepsilon^7$ (§4.3 and §5.1.1 in the preprint, whose
    Introduction is numbered as Section 1).
  </li>
  <li>
    Yu. L. Sachkov (2011).  "Cut locus and optimal synthesis in the
    sub-Riemannian problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 17(2): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.
    Global structure of the exponential map, cut locus and optimal synthesis. (The
    closed-form geodesic parametrisation quoted above is in §3.3 of the
    Moiseev–Sachkov paper — §4.3 of its preprint — not here.)
  </li>
  <li>
    Yu. L. Sachkov (2010).  "Conjugate and cut time in the sub-Riemannian
    problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 16(4): 1018–1039.
    Conjugate-time theorems 2.1–2.5 and $t_{\mathrm{cut}} = \mathfrak t$ (Thm 3.3) in the
    journal numbering; in the preprint arXiv:0903.0727 these are Thms 2.1–2.6 and 3.3
    (Thms 2.1 and 3.3 carry the same number in both; journal Thms 2.4, 2.5 are preprint
    Thms 2.5, 2.6).
  </li>
  <li>
    A. A. Agrachev, Yu. L. Sachkov (2004).
    <em>Control Theory from the Geometric Viewpoint.</em> Springer.
    Chapters 12 and 21 develop the Hamiltonian exponential map and the Jacobi
    equation (conjugate points) in general; the SE(2) computations are in the
    Sachkov papers listed here.
  </li>
  <li>
    R. Montgomery (2002).
    <em>A Tour of Subriemannian Geometries, Their Geodesics and
    Applications.</em> AMS Mathematical Surveys and Monographs 91.  Chapter 1
    works the Heisenberg-group geodesics explicitly, including where they stop
    minimising.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
    Elliptic project — Dubins / Visual Cortex example</a>: the geodesic
    family in Figure A5.1 is the same family rendered there.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/dubins-visual-cortex/">
    Elliptic project — Dubins car example</a>: cuspidal SE(2)
    trajectories arising in the same problem under reverse-allowed
    parametrisation.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js?v=20261009-plots1"></script>
<script>
(function () {
'use strict';

// ── shared helpers ─────────────────────────────────────────────────────
function inflectionalGeodesic(k, T, N) {
  // Curvature κ(s) = 2k·cn(s|k²) (Part 2 convention)
  // dθ/ds = κ, dx/ds = cos θ, dy/ds = sin θ
  const m = k * k;
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const j = ellipj(s + ds / 2, m);
    const k1 = 2 * k * j.cn;
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function separatrixGeodesic(T, N) {
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const k1 = 2 / Math.cosh(s + ds / 2);
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function nonInflectionalGeodesic(m, T, N) {
  // κ = 2 dn(s|m)
  const ds = T / N;
  let x = 0, y = 0, theta = 0;
  const pts = [{ x, y, theta, s: 0 }];
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    const j = ellipj(s + ds / 2, m);
    const k1 = 2 * j.dn;
    const tmid = theta + 0.5 * k1 * ds;
    x += Math.cos(tmid) * ds;
    y += Math.sin(tmid) * ds;
    theta += k1 * ds;
    pts.push({ x, y, theta, s: s + ds });
  }
  return pts;
}

function fitScales(pts, W, H, margin) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.4;
  const aspect = (W - margin.l - margin.r) / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  return {
    xS: d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, W - margin.r]),
    yS: d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]),
  };
}

// ── Figure A5.1 — shoot the SR exp map ─────────────────────────────────
function drawExpMap() {
  const svg = document.getElementById('fig-expmap');
  if (!svg) return;
  const family = document.getElementById('exp-family').value;
  const kInput=document.getElementById('exp-k');
  kInput.disabled=family==='separatrix';
  kInput.min=family==='noninflectional'?'101':'5';
  kInput.max=family==='noninflectional'?'195':'99';
  let kVal=parseFloat(kInput.value)/100;
  if(family==='separatrix')kVal=1;
  else if(family==='inflectional')kVal=Math.max(.05,Math.min(.99,kVal));
  else kVal=Math.max(1.01,Math.min(1.95,kVal));
  if(family!=='separatrix')kInput.value=String(Math.round(100*kVal));
  const T = parseFloat(document.getElementById('exp-T').value) / 100;
  document.getElementById('exp-k-val').textContent = kVal.toFixed(2);
  document.getElementById('exp-T-val').textContent = T.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const margin = { t: 18, b: 32, l: 30, r: 30 };

  let pts, color;
  if (family === 'inflectional') {
    pts = inflectionalGeodesic(Math.min(kVal, 0.99), T, 800);
    color = '#1565c0';
  } else if (family === 'separatrix') {
    pts = separatrixGeodesic(T, 800);
    color = '#b71c1c';
  } else {
    // non-inflectional with m = 2 - k mapped from slider
    const m = Math.max(0.01, Math.min(0.99, 2 - kVal));
    pts = nonInflectionalGeodesic(m, T, 800);
    color = '#2e7d32';
  }

  const { xS, yS } = fitScales(pts, W, H, margin);
  // Axes
  g.append('line').attr('x1', margin.l).attr('x2', W - margin.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#eee').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#eee').attr('stroke-width', 1);

  labelPlaneAxes(g, W - margin.r, yS(0), xS(0), margin.t + 16);
  drawScaleBar(g, margin.l + 2, H - 8, xS(1) - xS(0));

  // Curve
  g.append('path')
    .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(pts))
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.4);
  // Origin
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#444');
  // Endpoint
  const end = pts[pts.length - 1];
  g.append('circle').attr('cx', xS(end.x)).attr('cy', yS(end.y))
    .attr('r', 5).attr('fill', color);

  // Status
  let info = '';
  if (family === 'inflectional') {
    const Km = ellipticK(kVal * kVal);
    info = `k = ${kVal.toFixed(2)}    period 4K(k²) = ${(4*Km).toFixed(2)}    T = ${T.toFixed(2)}`;
  } else if (family === 'separatrix') {
    info = `borderline elastica    T = ${T.toFixed(2)}`;
  } else {
    const m = Math.max(0.01, Math.min(0.99, 2 - kVal));
    const Km = ellipticK(m);
    info = `non-inflectional m = ${m.toFixed(2)}    period 2K(m) = ${(2*Km).toFixed(2)}    T = ${T.toFixed(2)}`;
  }
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(info);
  g.append('text').attr('x', W - margin.r).attr('y', margin.t + 12)
    .attr('text-anchor', 'end')
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', color)
    .text(`endpoint = (${end.x.toFixed(2)}, ${end.y.toFixed(2)}, ${(end.theta % (2*Math.PI)).toFixed(2)})`);
}

// ── Figure A5.2 — σ-symmetric pair + first-coincidence detection ───────
//
// Build γ_A(s) for s ∈ [0, T_total] (T_total chosen so we can search past T).
// γ_B(s) is the y → -y reflection of γ_A.  Coincidence requires y_A(s) = 0.
function drawMaxwell() {
  const svg = document.getElementById('fig-maxwell');
  if (!svg) return;
  const k = parseFloat(document.getElementById('mx-k').value) / 100;
  const T = parseFloat(document.getElementById('mx-T').value) / 10;
  document.getElementById('mx-k-val').textContent = k.toFixed(2);
  document.getElementById('mx-T-val').textContent = T.toFixed(2);

  const W = svg.clientWidth || 720, H = 400;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Build trajectories up to a generous range — twice T or twice 4K(k²),
  // whichever is larger, so the right panel can show the period clearly.
  const Km = ellipticK(k * k);
  const T_full = Math.max(T, 1.5 * (4 * Km));
  const N = 1500;
  const ds = T_full / N;

  function buildA() {
    const m = k * k;
    let x = 0, y = 0, theta = 0;
    const pts = [{ x, y, theta, s: 0 }];
    for (let i = 0; i < N; i++) {
      const s = i * ds;
      const j = ellipj(s + ds / 2, m);
      const k1 = 2 * k * j.cn;
      const tMid = theta + 0.5 * k1 * ds;
      x += Math.cos(tMid) * ds;
      y += Math.sin(tMid) * ds;
      theta += k1 * ds;
      pts.push({ x, y, theta, s: s + ds });
    }
    return pts;
  }

  const ptsA = buildA();
  // ptsB derived by symmetry (no need to integrate twice)
  const ptsB = ptsA.map(p => ({ x: p.x, y: -p.y, theta: -p.theta, s: p.s }));

  // Per-s separation: |γA(s) − γB(s)| = 2|y_A(s)|
  const sep = ptsA.map(p => ({ s: p.s, d: 2 * Math.abs(p.y) }));

  // The pair coincides in full (position AND heading) at s = 4K(k²): there
  // y_A = 2k(1 − cn) returns to 0 and θ_A returns to 0 (mod 2π).  Since
  // y_A ≥ 0 only *touches* zero (never crosses), a sign-change search would
  // miss it — use the analytic first Maxwell time directly.
  const firstZero = (4 * Km <= T_full) ? 4 * Km : null;

  // Layout: left panel = trajectories up to T; right panel = sep(s) plot
  const split = W * 0.55;
  const margin = { t: 18, b: 36, l: 30, r: 26 };

  // Trajectory subset truncated at T
  const Tidx = Math.max(1, Math.round(T / T_full * N));
  const ptsAtrunc = ptsA.slice(0, Tidx + 1);
  const ptsBtrunc = ptsB.slice(0, Tidx + 1);

  // Left scales
  const allTrunc = ptsAtrunc.concat(ptsBtrunc);
  const xs = allTrunc.map(p => p.x);
  const ys = allTrunc.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.4;
  const plotLW = split - margin.l - margin.r;
  const aspect = plotLW / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  const xL = d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, split - margin.r]);
  const yL = d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]);

  // Reference axes (left)
  g.append('line').attr('x1', margin.l).attr('x2', split - margin.r)
    .attr('y1', yL(0)).attr('y2', yL(0)).attr('stroke', '#f0f0f0').attr('stroke-width', 1);
  g.append('line').attr('x1', xL(0)).attr('x2', xL(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#f0f0f0').attr('stroke-width', 1);

  labelPlaneAxes(g, split - margin.r, yL(0), xL(0), margin.t + 16);
  drawScaleBar(g, margin.l + 2, H - 8, xL(1) - xL(0));
  g.append('text').attr('x', 8).attr('y', 12)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:12px;font-weight:700;fill:#444').text('a');

  // Trajectories
  g.append('path')
    .attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(ptsAtrunc))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2);
  g.append('path')
    .attr('d', d3.line().x(p => xL(p.x)).y(p => yL(p.y))(ptsBtrunc))
    .attr('fill', 'none').attr('stroke', '#b71c1c').attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3');

  // Origin and endpoints
  g.append('circle').attr('cx', xL(0)).attr('cy', yL(0)).attr('r', 4).attr('fill', '#444');
  const eA = ptsAtrunc[ptsAtrunc.length - 1], eB = ptsBtrunc[ptsBtrunc.length - 1];
  g.append('circle').attr('cx', xL(eA.x)).attr('cy', yL(eA.y)).attr('r', 5).attr('fill', '#1565c0');
  g.append('circle').attr('cx', xL(eB.x)).attr('cy', yL(eB.y)).attr('r', 5).attr('fill', '#b71c1c');

  // Connecting dashed line at endpoint
  g.append('line').attr('x1', xL(eA.x)).attr('y1', yL(eA.y))
    .attr('x2', xL(eB.x)).attr('y2', yL(eB.y))
    .attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');

  const dEnd = 2 * Math.abs(eA.y);
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`k = ${k.toFixed(2)}    T = ${T.toFixed(2)}    |γ_A(T) − γ_B(T)| = ${dEnd.toFixed(3)}`);

  g.append('text').attr('x', split - margin.r - 4).attr('y', margin.t + 12)
    .attr('text-anchor', 'end')
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888')
    .text('blue: γ_A   red: γ_B');

  // Right panel: |γA(s) − γB(s)| over s ∈ [0, T_full]
  const dMax = Math.max(...sep.map(p => p.d));
  const xR2 = d3.scaleLinear().domain([0, T_full]).range([split + margin.l, W - margin.r]);
  const yR2 = d3.scaleLinear().domain([0, dMax * 1.1]).range([H - margin.b, margin.t + 12]);

  g.append('g').attr('transform', `translate(0,${H - margin.b})`)
    .call(d3.axisBottom(xR2).ticks(6))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));
  g.append('g').attr('transform', `translate(${split + margin.l},0)`)
    .call(d3.axisLeft(yR2).ticks(4))
    .call(s => s.selectAll('text').attr('font-family', 'Source Sans 3').attr('font-size', 11));

  // The separation curve
  g.append('path')
    .attr('d', d3.line().x(p => xR2(p.s)).y(p => yR2(p.d))(sep))
    .attr('fill', 'none').attr('stroke', '#0d3a78').attr('stroke-width', 2);

  // Mark first zero (Maxwell time of σ-pair)
  if (firstZero !== null) {
    g.append('line').attr('x1', xR2(firstZero)).attr('x2', xR2(firstZero))
      .attr('y1', margin.t + 12).attr('y2', H - margin.b)
      .attr('stroke', '#b71c1c').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
    g.append('circle').attr('cx', xR2(firstZero)).attr('cy', yR2(0)).attr('r', 4)
      .attr('fill', '#b71c1c');
    g.append('text').attr('x', xR2(firstZero) - 6).attr('y', margin.t + 22).attr('text-anchor','end')
      .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#b71c1c')
      .text(`mirror tie @ s = ${firstZero.toFixed(3)}`);
  } else {
    g.append('text').attr('x', xR2(T_full / 2)).attr('y', margin.t + 22)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888')
      .text('no mirror coincidence in this range');
  }

  // Mark current T on right plot too
  g.append('line').attr('x1', xR2(T)).attr('x2', xR2(T))
    .attr('y1', margin.t + 12).attr('y2', H - margin.b)
    .attr('stroke', '#1565c0').attr('stroke-width', 1).attr('stroke-dasharray', '2,3').attr('opacity', 0.7);

  // Reference: 4K(k²)
  g.append('line').attr('x1', xR2(4 * Km)).attr('x2', xR2(4 * Km))
    .attr('y1', margin.t + 12).attr('y2', H - margin.b)
    .attr('stroke', '#888').attr('stroke-width', 1).attr('stroke-dasharray', '5,3').attr('opacity', 0.7);
  g.append('text').attr('x', xR2(4 * Km) + 4).attr('y', H - margin.b - 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', 10).attr('fill', '#888')
    .text(`4K(k²) = ${(4 * Km).toFixed(2)}`);

  // Right panel: letter + axis labels (no title — the caption describes the panel)
  g.append('text').attr('x', split + 6).attr('y', 12)
    .attr('style', 'font-family:var(--sans,sans-serif);font-size:12px;font-weight:700;fill:#444').text('b');
  g.append('text').attr('x', split + margin.l + 6).attr('y', margin.t + 8)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#666')
    .text('|γ_A − γ_B| (units of ℓ)');
  g.append('text').attr('x', W - margin.r).attr('y', H - 4).attr('text-anchor', 'end')
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#666')
    .text('arc length s (units of ℓ)');

  // Divider
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
}

// ── Figure A5.3 — Wavefront formation ──────────────────────────────────
//
// 39 trajectories sweep signed k ∈ [-0.95, 0.95].  Each trajectory is
// integrated up to a fixed maximum arc length sMax (≥ the slider's max T).
// The wavefront W_T is the curve through {(x(T;k), y(T;k)) : k ∈ [-1, 1]}.
const conjState = {
  trajectories: null,    // cached
  sMax: 10.0,            // arc length to which we precompute every trajectory
  N: 480,                // sample count per trajectory
  T: 2.4,
  showGhost: true,
  showCusps: true,
  playing: false,
  raf: null,
};

function buildConjTrajectories() {
  if (conjState.trajectories) return;
  const kVals = d3.range(-0.95, 0.96, 0.05);   // 39 trajectories (signed k)
  const traj = kVals.map(k => {
    const sign = k >= 0 ? 1 : -1;
    const ka = Math.max(Math.abs(k), 1e-3);
    const m = ka * ka;
    const ds = conjState.sMax / conjState.N;
    let x = 0, y = 0, theta = 0;
    const pts = new Array(conjState.N + 1);
    pts[0] = { x: 0, y: 0, theta: 0, s: 0 };
    for (let i = 0; i < conjState.N; i++) {
      const s = i * ds;
      const j = ellipj(s + ds / 2, m);
      const kappaMid = sign * 2 * ka * j.cn;
      const tMid = theta + 0.5 * kappaMid * ds;
      x += Math.cos(tMid) * ds;
      y += Math.sin(tMid) * ds;
      theta += kappaMid * ds;
      pts[i + 1] = { x, y, theta, s: s + ds };
    }
    return { k, pts };
  });
  conjState.trajectories = traj;
}

function indexAt(s) {
  return Math.max(0, Math.min(conjState.N, Math.round(s / conjState.sMax * conjState.N)));
}

// Detect a cusp in the wavefront curve — turn-angle exceeding π/2 between
// successive segments suggests a fold (conjugate point projection).
function findWavefrontCusps(front) {
  const cusps = [];
  for (let i = 1; i < front.length - 1; i++) {
    const a = front[i - 1], b = front[i], c = front[i + 1];
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
    if (m1 < 1e-9 || m2 < 1e-9) continue;
    const cosA = dot / (m1 * m2);
    if (cosA < 0.2) {  // turn angle ≳ 78° → cusp / fold
      cusps.push({ x: b.x, y: b.y });
    }
  }
  return cusps;
}

function drawConjugate() {
  const svg = document.getElementById('fig-conjugate');
  if (!svg) return;
  buildConjTrajectories();

  conjState.T = parseFloat(document.getElementById('conj-T').value) / 10;
  document.getElementById('conj-T-val').textContent = conjState.T.toFixed(2);
  conjState.showGhost = document.getElementById('conj-ghost').checked;
  conjState.showCusps = document.getElementById('conj-cusps').checked;

  const W = svg.clientWidth || 720, H = 440;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();
  const margin = { t: 18, b: 36, l: 30, r: 30 };

  // Truncate each trajectory at current T
  const Tidx = indexAt(conjState.T);
  const trajClipped = conjState.trajectories.map(({ k, pts }) => ({
    k, pts: pts.slice(0, Tidx + 1),
    end: pts[Tidx],
  }));

  // Auto-scale to encompass all trajectories up to current T (with 15% margin)
  // and keep room for the origin.  Padding generously avoids tight crops.
  let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
  trajClipped.forEach(({ pts }) => {
    pts.forEach(p => {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    });
  });
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
  const range = Math.max(xMax - xMin, yMax - yMin) / 2 * 1.15 + 0.4;
  const aspect = (W - margin.l - margin.r) / (H - margin.t - margin.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  const xS = d3.scaleLinear().domain([cx - xR, cx + xR]).range([margin.l, W - margin.r]);
  const yS = d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - margin.b, margin.t]);

  // Reference axes
  g.append('line').attr('x1', margin.l).attr('x2', W - margin.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#f4f4f4').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0))
    .attr('y1', margin.t).attr('y2', H - margin.b).attr('stroke', '#f4f4f4').attr('stroke-width', 1);

  // Faint trajectories up to current T
  trajClipped.forEach(({ k, pts }) => {
    if (pts.length < 2) return;
    const sign = k >= 0 ? 1 : -1;
    const ka = Math.abs(k);
    // Colour: blue for k > 0, red for k < 0; opacity scales with |k| so
    // small-k (near-straight) trajectories are most prominent
    const color = sign > 0
      ? d3.interpolateBlues(0.35 + 0.55 * ka)
      : d3.interpolateReds(0.35 + 0.55 * ka);
    g.append('path')
      .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(pts))
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.1)
      .attr('opacity', 0.45);
  });

  // Ghost wavefronts at T/4, T/2, 3T/4
  if (conjState.showGhost && conjState.T > 0.4) {
    [0.25, 0.5, 0.75].forEach(frac => {
      const idxG = indexAt(conjState.T * frac);
      if (idxG === 0) return;
      const front = conjState.trajectories.map(({ pts }) => pts[idxG]);
      g.append('path')
        .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(front))
        .attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,3').attr('opacity', 0.55);
    });
  }

  // Current wavefront — the bold curve through endpoints
  const front = trajClipped.map(t => t.end);
  if (front.length > 1) {
    g.append('path')
      .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(front))
      .attr('fill', 'none').attr('stroke', '#0d3a78').attr('stroke-width', 2.6);
    // Dots on each endpoint
    front.forEach((p, i) => {
      g.append('circle').attr('cx', xS(p.x)).attr('cy', yS(p.y))
        .attr('r', 2.4).attr('fill', '#0d3a78');
    });
  }

  // Cusp markers
  if (conjState.showCusps) {
    const cusps = findWavefrontCusps(front);
    cusps.forEach(c => {
      g.append('circle').attr('cx', xS(c.x)).attr('cy', yS(c.y))
        .attr('r', 7).attr('fill', 'none')
        .attr('stroke', '#b71c1c').attr('stroke-width', 1.8);
    });
    if (cusps.length > 0) {
      g.append('text').attr('x', W - margin.r - 4).attr('y', margin.t + 12)
        .attr('text-anchor', 'end')
        .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#b71c1c')
        .text(`${cusps.length} sampled sharp bends (heuristic)`);
    }
  }

  // Origin
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#222');

  labelPlaneAxes(g, W - margin.r, yS(0), xS(0), margin.t + 16);
  drawScaleBar(g, W - margin.r - 112, H - 8, xS(1) - xS(0));

  // Status text + scale legend
  // Reference: the figure-eight modulus k_c ≈ 0.909 (root of 2E(k²) = K(k²)).
  const Tmax_ref = 4 * ellipticK(0.9089 * 0.9089);
  g.append('text').attr('x', margin.l).attr('y', margin.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`T = ${conjState.T.toFixed(2)}    (mirror tie @ k = 0.909: T₁ = ${Tmax_ref.toFixed(2)})`);

  // Colour-bar mini-legend
  const lx = margin.l + 4, ly = H - margin.b - 14;
  g.append('rect').attr('x', lx).attr('y', ly - 10).attr('width', 220).attr('height', 22)
    .attr('fill', 'white').attr('fill-opacity', 0.85)
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('rx', 3);
  g.append('text').attr('x', lx + 8).attr('y', ly + 4)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#555')
    .text('k = −0.95 (red)  · · ·  k = +0.95 (blue)');
}

// Animate the wavefront forming
function animateConjugate(now) {
  if(!conjState.playing)return;
  const sl=document.getElementById('conj-T');
  if(conjState.lastFrame!==undefined) {
    conjState.playTime+=Math.min(now-conjState.lastFrame,100)/1000*0.6;
    if(conjState.playTime>conjState.sMax)conjState.playTime=.2;
    sl.value=String(Math.round(conjState.playTime*10));drawConjugate();
  }
  conjState.lastFrame=now;
  conjState.raf=requestAnimationFrame(animateConjugate);
}

// ── Boot ─────────────────────────────────────────────────────────
function wire() {
  ['exp-family', 'exp-k', 'exp-T'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawExpMap);
    if (el) el.addEventListener('change', drawExpMap);
  });
  ['mx-k', 'mx-T'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawMaxwell);
  });
  ['conj-T', 'conj-ghost', 'conj-cusps'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawConjugate);
    if (el) el.addEventListener('change', drawConjugate);
  });
  const playBtn = document.getElementById('conj-play');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      conjState.playing = !conjState.playing;
      playBtn.textContent = conjState.playing ? '⏸ pause' : '▶ play';
      if (conjState.playing) {
        conjState.playTime=parseFloat(document.getElementById('conj-T').value)/10;
        conjState.lastFrame=undefined;
        conjState.raf = requestAnimationFrame(animateConjugate);
      } else if (conjState.raf) {
        cancelAnimationFrame(conjState.raf);
      }
    });
  }

  drawExpMap();
  drawMaxwell();
  drawConjugate();
  window.addEventListener('resize', () => { drawExpMap(); drawMaxwell(); drawConjugate(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

})();
</script>
