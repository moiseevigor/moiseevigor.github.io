---
layout: distill
image: /public/img/posts/geometry-seeing-1.svg
title: "The Visual Cortex as a Contact Manifold"
subtitle: >
  Your brain fills in contours that do not exist. Jean Petitot showed in 2003 that
  this visual completion is equivalent to finding shortest paths on the Lie group
  SE(2) — the group of rigid motions of the plane — equipped with a sub-Riemannian
  metric whose geodesics are Euler's elastica, parametrised by Jacobi elliptic functions.
date: 2026-04-25 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, visual-cortex, elliptic-functions, optimal-control]
description: >
  Petitot's 2003 model of primary visual cortex V1 as a contact manifold on SE(2),
  the sub-Riemannian metric, and how optimal contour completion reduces to geodesics
  parametrised by Jacobi elliptic functions.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: 1
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article covers</div>
Why the primary visual cortex computes shortest paths in a non-Euclidean geometry.
We develop the mathematical model step by step — from the illusion that motivates it,
through the neuroscience, to the sub-Riemannian structure on SE(2) whose geodesics
are Euler's elastica.
The <strong>payoff</strong>: those geodesics are parametrised by Jacobi elliptic functions
$\mathrm{sn}(s\mid k^2)$, and their spatial period is $4K(k^2)$ — the complete
elliptic integral of the first kind.
</div>

## The Illusion That Started Everything

Look at the figure below. You see a bright white equilateral triangle floating above
three black discs.
The triangle has sharp edges and appears slightly brighter than the background.
None of that is actually printed on the page.

</div><!-- /.l-body -->

<!-- Figure 1: Kanizsa triangle — exact SVG from Wikimedia Commons -->
<figure class="l-middle">
  <div class="fig-box" style="padding: 48px 0 36px; background: #fff; text-align: center;">
    <svg viewBox="0 0 500 430" style="max-width:500px; margin:0 auto; display:block;"
         xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="430" fill="#fff"/>
      <!--
        Kanizsa triangle: circumradius R=150, centre (250,248), disc r=72.
        Each Pac-Man: M centre  L lip1  A r,r 0 large,sweep  lip2  Z
        Body = 300° arc; mouth = 60° gap facing the implied triangle centre.
      -->
      <!-- Top (250,98): mouth down. Lips 60°→(286,160) and 120°→(214,160).
           300° CCW from (286,160) to (214,160): large=1, sweep=0 -->
      <path d="M 250,98 L 286,160 A 72,72 0 1,0 214,160 Z" fill="#111"/>

      <!-- BL (120,323): mouth upper-right (≈330°). Lips 0°→(192,323) and 300°→(156,261).
           300° CW from (192,323) to (156,261): large=1, sweep=1 -->
      <path d="M 120,323 L 192,323 A 72,72 0 1,1 156,261 Z" fill="#111"/>

      <!-- BR (380,323): mouth upper-left (≈210°). Lips 180°→(308,323) and 240°→(344,261).
           300° CCW from (308,323) to (344,261): large=1, sweep=0 -->
      <path d="M 380,323 L 308,323 A 72,72 0 1,0 344,261 Z" fill="#111"/>
    </svg>
    <p style="font-family:'Source Sans 3',sans-serif; font-size:12px; color:#aaa; margin:16px 0 0;">
      Kanizsa (1955) — the white triangle does not exist
    </p>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    Three "Pac-Man" shapes arranged so their open mouths point inward.
    Your visual system perceives a bright equilateral triangle with sharp edges —
    a <em>modal completion</em> of contours that are absent in the image.
    This is not a trick or an error; it is a fundamental feature of how V1 processes
    local orientation information into global contour structure.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

<aside>
Modal completion (the triangle case) is distinguished from
<em>amodal completion</em>, in which an occluded object is inferred behind an
occluder. Both likely share underlying neural mechanisms, but the modal case is
more tractable mathematically.
</aside>

This is the **Kanizsa triangle** (Kanizsa 1955), the canonical example of *modal
completion* — the visual system's tendency to infer the presence of a bounding contour
from a set of locally consistent cues.
The phenomenon is not subtle: the perceived edges are sharp, the interior surface appears
measurably lighter than the background (Cornsweet 1970), and the effect survives
rotation, scaling, and partial occlusion.

The question is: *what is the computational rule that produces this completion?*
A satisfying answer did not arrive until 2003.

## Orientation Columns in V1

The primary visual cortex (V1, also called area 17 or the striate cortex) is the
first cortical stage of visual processing.
Hubel and Wiesel (1959, 1962) received the Nobel Prize for discovering that neurons
in V1 respond selectively to oriented edges: a neuron fires most vigorously when a
bar of light oriented at a particular angle passes through a small region of the
visual field.

Each V1 neuron can be characterised by three numbers:
$$\text{position }(x, y) \in \mathbb{R}^2 \quad\text{and}\quad
  \text{preferred orientation }\theta \in [0, \pi).$$

Neurons with the same preferred orientation cluster in *orientation columns* running
perpendicular to the cortical surface.
Mapped over a patch of cortex, the preferred orientations rotate continuously —
completing a full $\pi$-rotation over a distance of about 1&thinsp;mm.
The resulting pattern of orientation preferences is called an *orientation map*,
and it exhibits a characteristic structure of *pinwheels*: point singularities
around which the preferred orientation rotates by $\pm\pi/2$.

<aside>
The pinwheel structure was first measured in the cat striate cortex using
optical imaging of intrinsic signals (Bonhoeffer & Grinvald 1991).
A typical cortical hypercolumn — about 1&thinsp;mm² — contains roughly one
pinwheel centre per orientation cycle.
</aside>

The figure below shows a schematic orientation map: each short line segment represents
one cortical location $(x,y)$, oriented at the local preferred angle $\theta(x,y)$.
Colours encode the orientation angle on a $[0, \pi)$ hue wheel.

</div><!-- /.l-body -->

<!-- Figure 2: Orientation columns + geodesic completions -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls" id="v1-controls">
      <label class="v1-type">
        <input type="checkbox" id="v1-show-inflectional" checked>
        <span class="v1-swatch" style="background:#1565c0"></span>
        Inflectional
      </label>
      <label class="v1-type">
        <input type="checkbox" id="v1-show-noninflectional">
        <span class="v1-swatch" style="background:#2e7d32"></span>
        Non-inflectional
      </label>
      <label class="v1-type">
        <input type="checkbox" id="v1-show-separatrix">
        <span class="v1-swatch" style="background:#c62828"></span>
        Euler spiral
      </label>
      <label class="v1-type">
        <input type="checkbox" id="v1-show-maxwell">
        <span class="v1-swatch" style="background:#e65100"></span>
        Maxwell pair
      </label>
      <span style="margin-left:auto; font-size:12px; color:#888;">
        Hover a cell:
      </span>
      <span id="v1-angle-display" style="font-family:var(--mono,monospace); font-size:12px; color:#1565c0;"></span>
    </div>
    <svg id="fig-v1" style="width:100%;height:460px;"></svg>
  </div>
  <figcaption>
    <strong class="figure-label"></strong>
    Schematic orientation map of a patch of V1.
    Each line segment represents one neuron at position $(x,y)$, oriented at its
    preferred angle $\theta$ (colour encodes $\theta$ via a hue wheel); the
    orientation field is smooth almost everywhere, with a pinwheel singularity
    near the centre of the patch.
    Tick the boxes to overlay <strong>true sub-Riemannian geodesics</strong> on
    $\mathrm{SE}(2)$, integrated from the SR control ODE
    $(\dot x, \dot y, \dot\theta) = (\cos\theta, \sin\theta, \kappa(s))$ — each
    curve is a real elastica solving the SR boundary-value problem from the
    source neuron to the target neuron's $(x, y, \theta)$, with the
    target-tangent residual driven to $0$ (mod $\pi$) by a damped Newton.
    All four start at the blue source neuron, tangent to the source's preferred
    orientation, and end exactly tangent to the target neuron's stroke.
    The endpoint of each curve is highlighted with the family's colour, and the
    label gives the modulus and the SR length $L = \int\!\sqrt{u_1^2 + u_2^2}\,dt$
    in pixels.
    The four families exhaust the regimes of the SE(2) geodesic flow:
    <strong>inflectional</strong> ($-1\!&lt;\!E\!&lt;\!1$) —
    $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^{2})$, generic S-shaped curve;
    <strong>non-inflectional</strong> ($E\!&gt;\!1$) —
    $\kappa(s) = 2\,\mathrm{dn}(s\mid m)$, one-signed curvature, wavy-circle shape;
    <strong>Euler spiral</strong> ($E = 1$) —
    $\kappa(s) = 2\,\mathrm{sech}\,s$, the separatrix between the two regimes;
    <strong>Maxwell pair</strong> — the two geodesics
    $\kappa$ and $-\kappa$ related by the SE(2) symmetry $\sigma$, with provably
    equal SR length, demonstrating the non-uniqueness of optimal completions
    that Part&nbsp;3 makes precise.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

A key discovery from Bosking et al. (1997) is that the long-range *horizontal connections*
in V1 — axons that reach across several millimetres of cortex — connect neurons with
**the same** preferred orientation that lie roughly along the direction of that
orientation.
In other words, a neuron at $(x,y)$ preferring angle $\theta$ connects strongly to
neurons at $(x', y')$ where the displacement $(x'-x, y'-y)$ is approximately parallel
to $\theta$.

<aside>
Field, Hayes &amp; Hess (1993) showed that humans can detect a "path" of oriented
Gabor patches embedded in a random field, but only when successive patches are
co-circular (each one is tangent to the arc connecting them).
</aside>

This is the empirical *association field* (Field, Hayes &amp; Hess 1993): two oriented
line elements are perceptually grouped together if they lie along a smooth curve that
is tangent to both elements.

## Petitot's Insight: V1 Is a Contact Bundle

Jean Petitot (1999, 2003) made the key observation:
the data $(x, y, \theta)$ encoding every neuron in V1 — together with the horizontal
connectivity pattern just described — is not a 2D image map.
It is a 3-dimensional **contact manifold**.

<aside>
The contact structure $\xi$ is a rank-2 sub-bundle of the tangent bundle.
It is <em>completely non-integrable</em>: the bracket $[X_1, X_2]$ generates a
third direction, so any two points can be connected by a horizontal curve
(Chow–Rashevskii theorem).
</aside>

Specifically: the set of triples $(x, y, \theta) \in \mathbb{R}^2 \times S^1$ is
the total space of a circle bundle over the retinal plane.
It carries a **contact structure** $\xi = \ker(\sin\theta\,dx - \cos\theta\,dy)$:
the constraint that a curve $(x(t), y(t), \theta(t))$ can only move *horizontally*
(forward in direction $\theta$, or rotate in place) — it cannot slide sideways.

This constraint is satisfied by any curve whose position $(x,y)$ moves in the
direction the neuron prefers:
$$\dot x = u_1 \cos\theta, \quad \dot y = u_1 \sin\theta, \quad \dot\theta = u_2.$$

The bundle $(\mathbb{R}^2 \times S^1, \xi)$ is canonically isomorphic (as a contact
manifold) to the *unit cotangent bundle* $ST^*\mathbb{R}^2$, and its symmetry group
is SE(2) — the Lie group of orientation-preserving rigid motions of the plane.

## The Lie Group SE(2)

### What SE(2) is, concretely

<aside id="note-se2-group">
$\mathrm{SE}(2)$ — the <strong>Special Euclidean group</strong> in two
dimensions — is the set of orientation-preserving rigid motions of the
plane, equipped with composition as its group law. Concretely it is
$\mathbb{R}^2 \rtimes \mathrm{SO}(2)$: a translation paired with a
rotation. It is the simplest non-commutative Lie group worth knowing.
See Appendix A1 for the full Lie-group setup.
</aside>

A point of <span class="annotated-term" data-note="note-se2-group">$\mathrm{SE}(2)$</span> is a triple $(x, y, \theta)$: a *position*
$(x, y) \in \mathbb{R}^2$ together with an *orientation* $\theta \in S^1$.
This is exactly the data describing one V1 neuron in Figure 2 — its retinal
position and its preferred edge orientation. As a $3\times3$ matrix the
configuration $g$ acts on the plane as a rotation followed by a translation:

$$g \;=\; \begin{pmatrix} \cos\theta & -\sin\theta & x \\
                          \sin\theta &  \cos\theta & y \\
                          0          &  0          & 1 \end{pmatrix}.$$

### The two motions that are *directly available*

The horizontal connectivity of V1 (Bosking et al. 1997) lets the cortex move
its neural locus in only two ways:

- $X_1$ — slide the locus *along the current preferred orientation*: the
  position changes, the orientation stays the same.
- $X_2$ — *rotate the preferred orientation* in place: the position stays
  the same, the orientation changes.

In $(x, y, \theta)$ coordinates these are the two <span class="annotated-term" data-note="note-left-inv">left-invariant</span> vector
fields

<aside id="note-left-inv">
A vector field $X$ on a Lie group is <strong>left-invariant</strong> if it is unchanged
by every left-translation: $(L_g)_* X = X$ for all $g$.
Left-invariant fields are determined entirely by their value at the identity, so
the space of all of them is isomorphic to the Lie algebra $\mathfrak{g}$.
For SE(2) this yields the global frame $\{X_1, X_2, X_3\}$.  See Appendix A1.
</aside>

$$X_1 \;=\; \cos\theta\,\partial_x + \sin\theta\,\partial_y, \qquad
  X_2 \;=\; \partial_\theta.$$

The third direction — sliding the locus *perpendicular* to the current
orientation — is **forbidden**:

$$X_3 \;:=\; -\sin\theta\,\partial_x + \cos\theta\,\partial_y \;\notin\; \mathrm{span}\{X_1, X_2\}.$$

V1 has no "move my edge sideways" connection at this level.

### How sideways motion still happens — the Lie bracket

The cortex can nevertheless reach a perpendicularly-displaced neuron, by a
short loop of the two moves it *does* have. The figure below shows the
canonical four-step manoeuvre

$$+\varepsilon X_1 \;\to\; +\varepsilon X_2 \;\to\; -\varepsilon X_1 \;\to\; -\varepsilon X_2 .$$

Each leg is small (length $\varepsilon$). The net effect is to leave the
*orientation* unchanged but to displace the position by an amount of order
$\varepsilon^2$ in the **perpendicular** direction:

$$\Phi^{X_2}_{-\varepsilon} \!\circ\! \Phi^{X_1}_{-\varepsilon} \!\circ\! \Phi^{X_2}_{\varepsilon} \!\circ\! \Phi^{X_1}_{\varepsilon}\;(g_0)
\;=\; g_0 \,+\, \varepsilon^2\, X_3 \,+\, O(\varepsilon^3).$$

<aside id="note-lie-bracket">
The <strong>Lie bracket</strong> $[X, Y]$ measures the failure of two
flows to commute. For vector fields it acts on smooth functions as
$[X, Y]f = X(Yf) - Y(Xf)$; for matrix Lie algebras it equals $XY - YX$;
geometrically it is the leading $\varepsilon^2$ residual of the four-step
loop above. All three definitions agree — see Appendix A1 for the full
side-by-side derivation.
</aside>

The infinitesimal limit of this loop is exactly the <span class="annotated-term" data-note="note-lie-bracket">Lie bracket</span> of $X_1$ and
$X_2$:

$$[X_1, X_2] \;=\; X_3 \;=\; -\sin\theta\,\partial_x + \cos\theta\,\partial_y.$$

</div><!-- /.l-body -->

<!-- Figure 3: interactive moving Frenet–Serret frame on a real SE(2) geodesic -->
<figure class="l-middle">
  <div class="fig-box" style="padding:8px 8px 12px;">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;
                font-family:var(--sans);padding:6px 12px 10px;font-size:12.5px;">
      <label style="display:flex;align-items:center;gap:8px;flex:1;min-width:300px;">
        <span style="white-space:nowrap;color:#444;">arc length s</span>
        <input id="frenet-s-slider" type="range" min="0" max="400" value="0" step="1"
               style="flex:1;accent-color:#1565c0;"/>
        <span id="frenet-s-val" style="font-family:var(--mono);min-width:130px;
                                       text-align:right;color:#1565c0;font-weight:600;">
          s = 0.000
        </span>
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#444;">
        curve:
        <select id="frenet-curve-select"
                style="font-family:var(--mono);font-size:12px;padding:2px 6px;">
          <!-- options injected at render time -->
        </select>
      </label>
    </div>
    <svg id="fig-frenet" style="width:100%;height:460px;display:block;"></svg>
    <div id="frenet-readout-single"
         style="font-family:var(--mono);font-size:12px;color:#444;
                padding:8px 14px 0;display:flex;gap:22px;flex-wrap:wrap;">
      <span>θ(s) = <span id="frenet-theta">+0.0°</span></span>
      <span>κ(s) = dθ/ds = <span id="frenet-kappa">+0.000</span> /unit</span>
      <span>cell field θ at (x,y) = <span id="frenet-cell">+0.0°</span></span>
      <span>Δθ = θ(s) − cell = <span id="frenet-deltatheta">+0.0°</span></span>
    </div>
    <div id="frenet-readout-pair"
         style="font-family:var(--mono);font-size:12px;color:#444;
                padding:8px 14px 0;display:none;flex-wrap:wrap;gap:22px;">
      <span style="color:#e65100;font-weight:600;">curve A:</span>
      <span>θ_A = <span id="frenet-thetaA">+0.0°</span></span>
      <span>κ_A = <span id="frenet-kappaA">+0.000</span> /unit</span>
      <span style="margin-left:18px;color:#bf360c;font-weight:600;">curve B:</span>
      <span>θ_B = <span id="frenet-thetaB">+0.0°</span></span>
      <span>κ_B = <span id="frenet-kappaB">+0.000</span> /unit</span>
      <span style="margin-left:18px;color:#444;font-weight:600;">
        θ_A − θ_B = <span id="frenet-pair-diff">0°</span>
        <span style="font-style:italic;color:#888;">(mod π = same neuron line)</span>
      </span>
    </div>
  </div>
  <figcaption>
    <strong>Figure 3.</strong> The moving Frenet–Serret frame along an
    $\mathrm{SE}(2)$ sub-Riemannian geodesic. Drag the slider to advance the
    arc-length parameter $s \in [0, L]$ along one of the BVP-solved
    trajectories (use the dropdown to switch). At every $s$ the figure shows
    the planar position $(x(s), y(s))$ on the orientation field and the
    moving frame $\{T(s), N(s)\}$ — both arrows always labelled:
    $T = (\cos\theta(s), \sin\theta(s)) = X_1\!\restriction_{\gamma(s)}$,
    the horizontal direction the SR control law drives along, and
    $N = (-\sin\theta(s), \cos\theta(s)) = X_3\!\restriction_{\gamma(s)}$,
    the perpendicular direction that is <em>only</em> reachable through the
    Lie bracket $[X_1, X_2]$.
    <br><br>
    <strong>Why the green field stroke is tangent at the endpoints but not
    in between.</strong> The green stroke at the moving point is
    $\theta_{\mathrm{field}}(x(s), y(s))$ — the orientation that the
    <em>cortex</em> assigns to the neuron sitting at the planar position
    $(x(s), y(s))$. The blue arrow $T$ is the orientation that the
    <em>geodesic</em> happens to have at this $s$. These are two different
    things:
    <ul style="margin:6px 0 6px 18px;font-family:inherit;font-size:inherit;">
      <li>The orientation field $\theta_{\mathrm{field}}$ is a fixed
        scalar function on the $(x, y)$ retinal plane — it labels each
        cortical column with its preferred orientation.</li>
      <li>The geodesic's tangent $\theta(s)$ is the third coordinate of a
        curve in the 3-D contact bundle $\mathrm{SE}(2)$. It is determined
        by Pontryagin's maximum principle (i.e. by the SR Hamiltonian flow,
        which gives $\kappa(s) = d\theta/ds$ as one of the elastica functions)
        — <em>not</em> by what the field happens to read at $(x(s), y(s))$.</li>
    </ul>
    The boundary value problem only forces equality at the two ends:
    $\theta(0) = \theta_{\mathrm{field}}(\text{source})$ and
    $\theta(L) = \theta_{\mathrm{field}}(\text{target})$, because that is
    what "connect these two neurons" means — start and finish on the
    cortical columns the field assigns. In between the two ends, the
    geodesic is free to leave the field's prescription. Watching $\Delta\theta$
    as you drag the slider, you see it go from $0°$ at $s = 0$ to a non-zero
    excursion in the middle and back to $0°$ at $s = L$ — that excursion is
    the <em>cost of horizontality</em>: the curve has to keep
    $\dot\theta = \kappa$, $\dot x = u\cos\theta$, $\dot y = u\sin\theta$
    consistent with the SR ODE, and the cortical orientation field plays no
    role in that constraint.
    <br><br>
    <em>Maxwell-pair mode.</em> When the dropdown is set to the
    <strong>Maxwell pair</strong>, two frames advance in lock-step along the
    two members of the pair $\gamma_A, \gamma_B$ (frame labels become
    $T_A, N_A$ and $T_B, N_B$). Both close back to the source after the same
    arc length $L = 4K(k_c^2)/\omega$, but their final tangents differ by
    exactly $\pi$: $\theta_A(L) - \theta_B(L) = \pi \pmod{2\pi}$.
    That is the whole point of the pair. The two geodesics are
    <em>reversed-heading</em> partners — they leave the source in opposite
    directions and traverse $\sigma$-mirrored figure-8 loops.
    Because a V1 neuron's preferred orientation is a <em>line</em>,
    identified mod&nbsp;$\pi$, both endpoint headings $+\theta_{\mathrm{src}}$
    and $-\theta_{\mathrm{src}}$ represent <em>the same neuron</em>.
    The pair therefore gives two genuinely distinct closed SR-shortest paths
    from the source neuron to itself, with identical arc length — a Maxwell
    pair on $\mathrm{SE}(2)$ (Sachkov, ESAIM:COCV 2008, Fig.&nbsp;34).
  </figcaption>
</figure>

<div class="l-body" markdown="1">

### Hörmander condition ⇒ V1 is a contact manifold

Because $X_3 = [X_1, X_2]$ is *not* in $\mathrm{span}\{X_1, X_2\}$ but the
three together $\{X_1,\, X_2,\, [X_1, X_2]\}$ span the full tangent space
$T_g\,\mathrm{SE}(2) \cong \mathbb{R}^3$ at every $g$, the 2-plane field

$$\mathcal{H} \;:=\; \mathrm{span}\{X_1, X_2\}$$

satisfies the <span class="annotated-term" data-note="note-hormander"><strong>Hörmander (bracket-generating) condition</strong></span>. By the
**Chow–Rashevskii theorem** (1938, 1938) any two configurations in
$\mathrm{SE}(2)$ can therefore be joined by a *horizontal* path — a curve
whose velocity lies in $\mathcal{H}$ at every point. Geometrically,
$\mathcal{H}$ is a **contact structure** on $\mathrm{SE}(2)$, and Petitot's
key insight is that the V1 cortex *is* this contact manifold.

<aside id="note-hormander">
The <strong>Hörmander condition</strong> (1967): the vector fields and all their iterated
Lie brackets together span the full tangent space at every point.
It is the key criterion for hypoellipticity and, via Chow–Rashevskii, for the
existence of horizontal paths between any two points.
For SE(2): $\{X_1, X_2, [X_1,X_2]\} = \{X_1, X_2, X_3\}$ already spans
$\mathbb{R}^3$, so depth-1 brackets suffice.
See Appendix A2 for the full statement.
</aside>

## The Sub-Riemannian Metric and the Minimisation Problem

We equip the horizontal distribution $\mathcal{H}$ with the left-invariant
inner product:
$$\langle u_1 X_1 + u_2 X_2,\; u_1 X_1 + u_2 X_2 \rangle = u_1^2 + u_2^2.$$

This defines a <span class="annotated-term" data-note="note-sr-metric"><strong>sub-Riemannian (SR) metric</strong></span> on SE(2): the length of a horizontal
curve is $\int_0^T \sqrt{u_1^2 + u_2^2}\,dt$, and the SR distance between two points
is the infimum of lengths over all horizontal paths.

<aside id="note-sr-metric">
A <strong>sub-Riemannian metric</strong> is like a Riemannian metric, but an inner
product is defined only on a sub-bundle $\mathcal{H}\subsetneq TM$, not on all of $TM$.
Motion <em>outside</em> $\mathcal{H}$ is forbidden, not merely costly — there is no
finite-length "shortcut" through the forbidden directions.
SR geometry arises naturally wherever there are non-holonomic constraints
(rolling wheels, robot arms, the visual cortex).
</aside>

The **visual completion problem** now takes a precise form:

<div class="callout theorem">
<div class="callout-title">Problem (Petitot 2003)</div>
Given two neurons $(x_0, y_0, \theta_0)$ and $(x_1, y_1, \theta_1)$ in V1,
find the horizontal curve $(x(t), y(t), \theta(t))$ in SE(2) of minimum length
connecting them.
</div>

The spatial projection $(x(t), y(t))$ of the solution is the **perceptually completed
contour** that the visual system infers between two oriented line elements
$(x_0,\theta_0)$ and $(x_1,\theta_1)$.

The simplification $u_1 = 1$ (unit forward speed) reduces the problem to minimising
$$\int_0^L \kappa^2(s)\,ds$$
where $L$ is arc length and $\kappa = u_2/u_1 = \dot\theta$ is the signed curvature.
This is the **Euler elastica functional**: the total squared bending energy of the
projected curve.

</div><!-- /.l-body -->

<!-- Figure 4: Geodesic family from one base point — slider over k -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>
        max&nbsp;<em>k</em>
        <input type="range" id="geodesic-kmax-slider" min="20" max="195" value="100" step="5">
        <span class="ctrl-val" id="geodesic-kmax-val">1.00</span>
      </label>
      <span style="font-size:12px; color:#888; margin-left:auto;">
        $k\!&lt;\!1$ inflectional &nbsp;·&nbsp; $k\!=\!1$ Euler spiral &nbsp;·&nbsp; $k\!&gt;\!1$ non-inflectional
      </span>
    </div>
    <svg id="fig-geodesics" style="width:100%;height:420px;"></svg>
  </div>
  <figcaption>
    <strong>Figure 4.</strong>
    Family of SE(2) geodesics starting from the same position with the same
    initial heading. The single control parameter $k$ traverses all three
    elastica regimes:
    $k \in (0, 1)$ — <strong>inflectional</strong>, $\kappa(s) = 2k\,\mathrm{cn}(s\mid k^{2})$;
    $k = 1$ — the <strong>Euler / Cornu spiral</strong>, the separatrix
    $\kappa(s) = 2\,\mathrm{sech}\,s$;
    $k > 1$ — <strong>non-inflectional</strong>, parametrised by
    $m = 2 - k \in (0, 1)$ with $\kappa(s) = 2\,\mathrm{dn}(s\mid m)$
    (closed-loop curves with one-signed curvature).
    Drag the slider to set the maximum $k$ rendered; the vertical bar on the
    right is the colour scale, with the red tick marking the separatrix
    $k = 1$. As $k \to 1$ the period $4K(k^{2})$ diverges and the inflectional
    curve spirals inward; as $k$ increases past 1 the non-inflectional curves
    close up into deformed circles (Part&nbsp;2).
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## From Petitot's Model to the Open Problem

Petitot's paper established the model.
The subsequent mathematical programme — carried out primarily by Sachkov and collaborators
— aimed to characterise the *global* structure of this SR geometry: which geodesics are
actually optimal (globally length-minimising), and up to what arc length?

In every statement that follows, *"length"* means the **sub-Riemannian length** —
the only length the visual cortex's contact-bundle geometry actually defines.
For a horizontal curve $\gamma : [0, T] \to \mathrm{SE}(2)$ with controls
$(u_1, u_2)$ along the horizontal frame $\{X_1, X_2\}$,

$$L_{\mathrm{SR}}(\gamma) \;=\; \int_{0}^{T} \sqrt{u_1^{2} + u_2^{2}}\,dt.$$

Under the standard unit-speed parametrisation $u_1^{2} + u_2^{2} = 1$, this
collapses to $L_{\mathrm{SR}}(\gamma) = T$ — the SR arc-length parameter.
Crucially, *Euclidean* arc length on the projected plane curve $(x(s), y(s))$
is **not** what gets minimised; only horizontal motion (forward + rotation)
costs anything, and "sliding sideways" is forbidden, not free.

<aside id="note-sr-exp">
The <strong>sub-Riemannian exponential map</strong> sends an initial costate
$\mu_0 \in \mathfrak{se}(2)^{\ast}$ and a time $T$ to the geodesic endpoint
$g(T)$. It is <em>different from</em> the matrix exponential of Appendix A1
— different domain, different image, different geometry. Appendix A5 builds
it carefully and explains why it is the right object for the cut-locus
question.
</aside>

This requires understanding two geometric loci, both defined with respect to
$L_{\mathrm{SR}}$:

- **The conjugate locus**: points beyond which a geodesic is no longer
  *locally* length-minimising. These correspond to where two infinitesimally
  nearby geodesics with the same initial conditions reconverge in the phase
  space — i.e. the <span class="annotated-term" data-note="note-sr-exp">SR exponential map</span> ceases to be a local diffeomorphism.

- **The cut locus** (or **Maxwell locus**): points beyond which the geodesic
  is no longer *globally* length-minimising — because at least one other
  *horizontal* curve from the same start point reaches the same end point with
  equal or smaller $L_{\mathrm{SR}}$. At a Maxwell point, two distinct
  globally-optimal geodesics meet with *exactly* the same SR length.

For a sub-Riemannian manifold as symmetric as SE(2), the cut and Maxwell loci coincide
(this is part of what Sachkov and I proved in arXiv:0807.4731).
The first point on the cut locus along a given geodesic is the **cut time**
$t_\mathrm{cut}$, and it equals the first time the exponential map is no longer
injective.

The beautiful — and still incomplete — result is:

<div class="callout open-problem">
<div class="callout-title">Open Problem</div>
For the SR problem on SE(2), the first Maxwell time along an extremal with
modulus $k$ is
$$t_{\mathrm{MAX}} = \frac{4K(k^2)}{\omega_0(k)},$$
where $K(k^2)$ is the complete elliptic integral of the first kind and $\omega_0$
is the linearised oscillation frequency.
It is <em>conjectured</em> — and verified numerically — that $t_\mathrm{cut} = t_\mathrm{MAX}$
for all extremals.
A complete proof in all degenerate cases (the boundary of the abnormal locus) remains
open.
</div>

The four parts of this series develop the full story:

1. **This article**: the model, the geometry, the problem statement.
2. **Part 2** (Euler's Elastica): deriving the pendulum equation and solving it with
   Jacobi elliptic functions $\mathrm{sn}(s\mid k^2)$, $\mathrm{cn}(s\mid k^2)$,
   $\mathrm{dn}(s\mid k^2)$.
3. **Part 3** (Maxwell Strata): characterising the locus where two geodesics of equal
   length meet; the role of the discrete symmetry group of SE(2); proof that the
   first Maxwell time is $4K(k^2)/\omega_0$.
4. **Part 4** (The Open Problem): what is proved, what is conjectured, and the
   remaining analytic difficulty near the boundary of the abnormal set.

</div><!-- /.l-body -->

<!-- ── References ── -->
<div class="d-article" style="padding-top:0;">
<div class="l-body d-references">
<h2>References</h2>
<ol>
  <li>
    J. Petitot (2003). "The neurogeometry of pinwheels as a sub-Riemannian contact
    structure." <em>Journal of Physiology–Paris</em> 97(2–3): 265–309.
  </li>
  <li>
    I. Moiseev &amp; Yu. L. Sachkov (2010). "Maxwell strata in sub-Riemannian problem on
    the group of motions of a plane." <em>ESAIM: COCV</em> 16(2): 380–399.
    <a href="https://arxiv.org/abs/0807.4731">arXiv:0807.4731</a>
  </li>
  <li>
    G. Citti &amp; A. Sarti (2006). "A cortical based model of perceptual completion
    in the roto-translation space." <em>J. Math. Imaging Vision</em> 24(3): 307–326.
  </li>
  <li>
    D. H. Hubel &amp; T. N. Wiesel (1962). "Receptive fields, binocular interaction
    and functional architecture in the cat's visual cortex."
    <em>J. Physiology</em> 160: 106–154.
  </li>
  <li>
    D. J. Field, A. Hayes &amp; R. F. Hess (1993). "Contour integration by the human
    visual system: Evidence for a local 'association field'."
    <em>Vision Research</em> 33(2): 173–193.
  </li>
  <li>
    W. H. Bosking et al. (1997). "Orientation selectivity and the arrangement of
    horizontal connections in tree shrew striate cortex."
    <em>J. Neuroscience</em> 17(6): 2112–2127.
  </li>
  <li>
    G. Kanizsa (1955). "Margini quasi-percettivi in campi con stimolazione omogenea."
    <em>Rivista di Psicologia</em> 49: 7–30.
  </li>
  <li>
    Yu. L. Sachkov (2011). "Cut locus and optimal synthesis in the sub-Riemannian
    problem on the group of motions of a plane."
    <em>ESAIM: COCV</em> 17(4): 293–321.
    <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>
  </li>
</ol>
</div>
</div>

<!-- ── Precomputed SE(2) BVP polylines for Figure 2 ── -->
<!-- Generated by scripts/sr_geodesics_v1.py — sets window.__v1Data -->
<script src="/public/data/v1_geodesics.js"></script>

<!-- ── Interactive figures JavaScript ── -->
<script>
(function () {
'use strict';

// ── Figure 2: V1 orientation field ───────────────────────────────────────
function drawV1() {
  const svg = document.getElementById('fig-v1');
  if (!svg) return;

  // CRITICAL: theta(), cx, cy, cellW, cellH, src and the BVP polylines all
  // come from a 680 × 460 reference frame computed in scripts/sr_geodesics_v1.py.
  // We keep that frame for the FIELD (so JS theta(x,y) and Python theta_field
  // agree pixel-for-pixel and the BVP polylines land where they should), but
  // we widen the viewBox horizontally so the orientation grid extends past the
  // original [0, 680] range and fills the full SVG container.  The extra cells
  // on the left and right are drawn by evaluating theta(x, y) at x < 0 and
  // x > 680 — the field is defined globally, so this Just Works.
  const W = 680, H = 460;
  const ROWS = 22, COLS = 32;            // floor(22 * 680/460) = 32
  const cx = W / 2, cy = H / 2;
  const cellW = W / COLS, cellH = H / ROWS;
  const lineLen = Math.min(cellW, cellH) * 0.38;
  const containerW = svg.clientWidth || svg.getBoundingClientRect().width || W;
  const viewBoxW = Math.max(W, containerW * H / H);  // == containerW
  const xPad = (viewBoxW - W) / 2;       // left/right viewBox padding (px)
  const xMin = -xPad;
  svg.setAttribute('viewBox', `${xMin} 0 ${viewBoxW} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const g = d3.select(svg);
  g.selectAll('*').remove();

  /*
   * Orientation field: superposition of two pinwheels.
   *
   * The naïve `(phi1 + 0.35*phi2)/2` formula has a hidden bug: each atan2
   * returns a value with a branch cut at the negative x-axis (jumping
   * +π → -π). At the SUM's branch cuts θ jumps by π/2 + 0.35·π/2 = 0.675π,
   * which is NOT a multiple of π, so the rendered line orientation snaps
   * visibly (see strokes on the left side of the figure).
   *
   * Fix: combine the contributions as complex phasors e^{iφ}, then take
   * (½·atan2). The only branch cut left is in the sum's argument, where
   * the jump is exactly π — invisible in line drawing because lines are
   * bidirectional (θ and θ+π are the same line).
   */
  function theta(x, y) {
    const phi1 = Math.atan2(y - cy,         x - cx);
    const phi2 = Math.atan2(y - cy * 1.3,   x - cx * 0.5);
    const sumRe = Math.cos(phi1) + 0.35 * Math.cos(phi2);
    const sumIm = Math.sin(phi1) + 0.35 * Math.sin(phi2);
    return Math.atan2(sumIm, sumRe) / 2;
  }

  // Background gradient — covers the full extended viewBox.
  g.append('rect')
    .attr('x', xMin).attr('y', 0)
    .attr('width', viewBoxW).attr('height', H)
    .attr('fill', '#fafafa');

  // Orientation grid — extended on both sides past the original 680×460 frame
  // so it fills the full container width.  theta() is well-defined for all
  // (x, y), so we just evaluate it at every cell-centre column from
  // colMin..colMax across the extended viewBox.
  const colMin = Math.floor(xMin / cellW);
  const colMax = Math.ceil((xMin + viewBoxW) / cellW);
  for (let row = 0; row < ROWS; row++) {
    for (let col = colMin; col < colMax; col++) {
      const px = (col + 0.5) * cellW;
      const py = (row + 0.5) * cellH;
      const t = theta(px, py);
      const hue = ((t * 180 / Math.PI) % 180 + 180) % 180;
      const color = `hsl(${hue},70%,40%)`;
      const dx = lineLen * Math.cos(t), dy = lineLen * Math.sin(t);

      g.append('line')
        .attr('x1', px - dx).attr('y1', py - dy)
        .attr('x2', px + dx).attr('y2', py + dy)
        .attr('stroke', color).attr('stroke-width', 1.6)
        .attr('stroke-linecap', 'round');
    }
  }

  // SVG-level hover: compute cell from mouse position (no tiny hit-targets
  // needed).  Allow hover anywhere in the extended viewBox.
  g.on('mousemove', function(event) {
    const [mx, my] = d3.pointer(event);
    const col = Math.floor(mx / cellW);
    const row = Math.floor(my / cellH);
    if (col >= colMin && col < colMax && row >= 0 && row < ROWS) {
      const px = (col + 0.5) * cellW;
      const py = (row + 0.5) * cellH;
      const t = theta(px, py);
      const el = document.getElementById('v1-angle-display');
      if (el) el.textContent = `θ = ${(t * 180 / Math.PI).toFixed(1)}°`;
    }
  }).on('mouseleave', () => {
    const el = document.getElementById('v1-angle-display');
    if (el) el.textContent = '';
  });

  // Pinwheel centre marker
  g.append('circle').attr('cx', cx).attr('cy', cy)
    .attr('r', 4).attr('fill', 'none').attr('stroke', '#666')
    .attr('stroke-width', 1.5).attr('stroke-dasharray', '3,2');

  /*
   * ── REAL sub-Riemannian geodesics on SE(2), from a tangent-matching BVP ─
   *
   * Every curve drawn from now on is a TRUE projection of an SE(2) geodesic.
   * The polylines come from `scripts/sr_geodesics_v1.py`, which solves the
   * boundary-value problem
   *
   *     dx/ds = cos θ,  dy/ds = sin θ,  dθ/ds = κ(s)
   *     (x(0), y(0), θ(0)) = (src, srcHeading)
   *     (x(L), y(L), θ(L)) = (target_cell, target_orientation mod π)
   *
   * for inflectional/non-inflectional/separatrix κ profiles using a damped
   * Newton on the residual (x_end − x_t, y_end − y_t, θ_end − θ_t).  The
   * solver is seeded from a vectorised forward-shoot grid; refinement reaches
   * |position miss| < 0.01 px and |orientation miss| < 10⁻⁴ deg.  We then
   * dump the polylines to JSON so the browser just plots them — no runtime
   * BVP, no chance of a curve floating off a stroke.
   *
   * The Maxwell pair is built by Sachkov's σ-symmetric construction
   * ("Maxwell strata in Euler's elastic problem", ESAIM:COCV 2008, Fig. 34):
   * two inflectional geodesics with κ(s) = ±2k·ω·cn(ω·s | k²) integrated
   * over N · 4K(k²)/ω.  By the SE(2) σ-symmetry that negates curvature,
   * both end at the IDENTICAL group element on the source-tangent axis,
   * with IDENTICAL arc length.  k > 1/√2 ≈ 0.707 puts each curve into the
   * looped/cusped regime; N=2 yields four cusps per curve.
   */

  // Precomputed BVP data from /public/data/v1_geodesics.json.  Loaded once
  // (fetch-and-cache) by drawV1; the script's `data` argument carries it.
  function renderGeodesics(data) {
    if (!data) return;

    const src = data.src;
    const geodesicGroup = g.append('g').attr('id', 'v1-geodesics');

    function pathFromPoly(poly) {
      let d = 'M ' + poly[0][0] + ',' + poly[0][1];
      for (let i = 1; i < poly.length; i++) {
        d += ' L ' + poly[i][0] + ',' + poly[i][1];
      }
      return d;
    }

    function drawTag(text, color, x, y, fontSize) {
      geodesicGroup.append('text')
        .attr('x', x).attr('y', y)
        .attr('style',
          'font-family:var(--mono,monospace);font-size:' + (fontSize || 10.5) + 'px;' +
          'paint-order:stroke;stroke:#fff;stroke-width:3px;' +
          'stroke-linejoin:round;font-weight:600;fill:' + color + ';')
        .text(text);
    }

    // Format an angle in degrees, mod π in (-90, +90].
    function fmtAngle(rad) {
      let d = rad * 180 / Math.PI;
      d = ((d + 90) % 180 + 180) % 180 - 90;
      return (d >= 0 ? '+' : '') + d.toFixed(1) + '°';
    }

    function highlightTarget(tx, ty, color) {
      geodesicGroup.append('circle')
        .attr('cx', tx).attr('cy', ty).attr('r', 9)
        .attr('fill', 'none').attr('stroke', color)
        .attr('stroke-width', 1.4).attr('stroke-opacity', 0.55)
        .attr('stroke-dasharray', '2,2');
    }

    // Draw two things at (cx, cy) for tangent-alignment verification:
    //   (1) a long faint DASHED guide line spanning ~120 px, drawn at the
    //       cell's preferred-orientation angle thetaSvg.  Lets the eye
    //       extrapolate the cell stroke far enough to see that the curve
    //       leaves/arrives along it, even when the curve bends sharply
    //       within the first cell after src or before target.
    //   (2) a short SOLID stroke at the same angle (length ~30 px) sitting
    //       on top of the cell, with a white halo so it pops against the
    //       coloured orientation grid.  This is the visible "this is the
    //       neuron's preferred orientation" marker.
    function drawCellStroke(cx, cy, thetaSvg, color, lengthPx) {
      const L = lengthPx || 28;
      const dxL = L * Math.cos(thetaSvg);
      const dyL = L * Math.sin(thetaSvg);
      const G = 110;        // half-length of the long dashed guide
      const dxG = G * Math.cos(thetaSvg);
      const dyG = G * Math.sin(thetaSvg);
      // Long dashed guide line (low opacity)
      geodesicGroup.append('line')
        .attr('x1', cx - dxG).attr('y1', cy - dyG)
        .attr('x2', cx + dxG).attr('y2', cy + dyG)
        .attr('stroke', color).attr('stroke-width', 1.0)
        .attr('stroke-opacity', 0.35).attr('stroke-dasharray', '4,4')
        .attr('stroke-linecap', 'round');
      // White halo + solid coloured stroke at the cell itself
      geodesicGroup.append('line')
        .attr('x1', cx - dxL).attr('y1', cy - dyL)
        .attr('x2', cx + dxL).attr('y2', cy + dyL)
        .attr('stroke', '#fff').attr('stroke-width', 5.5)
        .attr('stroke-linecap', 'round').attr('stroke-opacity', 0.9);
      geodesicGroup.append('line')
        .attr('x1', cx - dxL).attr('y1', cy - dyL)
        .attr('x2', cx + dxL).attr('y2', cy + dyL)
        .attr('stroke', color).attr('stroke-width', 2.6)
        .attr('stroke-linecap', 'round');
    }

    function drawCurveFromPoly(poly, color, label, dashed, labelAt) {
      const path = geodesicGroup.append('path')
        .attr('d', pathFromPoly(poly))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.4)
        .attr('stroke-opacity', 0.92)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
      if (dashed) path.attr('stroke-dasharray', '6,3');
      const last = poly[poly.length - 1];
      geodesicGroup.append('circle')
        .attr('cx', last[0]).attr('cy', last[1]).attr('r', 4.5)
        .attr('fill', color)
        .attr('stroke', '#fff').attr('stroke-width', 1.8);
      if (label) {
        const lp = labelAt || [last[0] + 9, last[1] - 9];
        drawTag(label, color, lp[0], lp[1]);
      }
    }

    // Find the polyline point furthest from a reference point — handy for
    // placing labels at the visually-distinct extremum of a closed loop.
    function farthestFrom(poly, refX, refY) {
      let best = -1, bx = poly[0][0], by = poly[0][1];
      for (let i = 0; i < poly.length; i++) {
        const dx = poly[i][0] - refX, dy = poly[i][1] - refY;
        const d2 = dx*dx + dy*dy;
        if (d2 > best) { best = d2; bx = poly[i][0]; by = poly[i][1]; }
      }
      return [bx, by];
    }

    function drawSourceMarker() {
      // Highlight the source neuron's preferred-orientation stroke first,
      // so it sits underneath the marker dot and is the visual reference for
      // every curve's initial tangent.
      drawCellStroke(src.x, src.y, src.heading, '#1565c0', 30);
      geodesicGroup.append('circle')
        .attr('cx', src.x).attr('cy', src.y).attr('r', 6)
        .attr('fill', '#1565c0')
        .attr('stroke', '#fff').attr('stroke-width', 2.2);
    }

    function render() {
      geodesicGroup.selectAll('*').remove();

      const enabled = {
        inflectional:    document.getElementById('v1-show-inflectional').checked,
        noninflectional: document.getElementById('v1-show-noninflectional').checked,
        separatrix:      document.getElementById('v1-show-separatrix').checked,
        maxwell:         document.getElementById('v1-show-maxwell').checked,
      };
      if (!Object.values(enabled).some(Boolean)) {
        drawSourceMarker();
        return;
      }

      // Tangent-matching curves: inflectional/non-inflectional/separatrix.
      data.curves.forEach(curve => {
        if (curve.family === 'inflectional'    && !enabled.inflectional)    return;
        if (curve.family === 'noninflectional' && !enabled.noninflectional) return;
        if (curve.family === 'separatrix'      && !enabled.separatrix)      return;

        const tc = curve.target_cell;
        highlightTarget(tc.x, tc.y, curve.color);
        // Overlay the target cell's preferred-orientation stroke (in the
        // curve's color) so the eye can directly verify "the curve arrives
        // tangent to this stroke (mod π)".
        drawCellStroke(tc.x, tc.y, tc.theta_svg, curve.color);
        let label;
        if (curve.family === 'inflectional') {
          label = 'inflect  k=' + curve.params.k.toFixed(2) +
                  '  L=' + curve.L_pixels.toFixed(0);
        } else if (curve.family === 'noninflectional') {
          label = 'non-inflect  k=' + curve.params.k.toFixed(2) +
                  '  L=' + curve.L_pixels.toFixed(0);
        } else {
          label = 'separatrix  ω=' + curve.params.omega.toFixed(2) +
                  '  L=' + curve.L_pixels.toFixed(0);
        }
        drawCurveFromPoly(curve.polyline, curve.color, label, false);
      });

      // Maxwell pair: two closed figure-8 inflectional loops at the
      // Bernoulli modulus k_c (Sachkov, ESAIM:COCV 2008, Fig. 34).  Both
      // start AND end at the source neuron, tangent to its preferred
      // orientation; one starts in the +heading direction, the other in
      // the -heading direction (same line orientation, mod π).  Identical
      // arc length L = N · 4K(k_c²)/ω — a true Maxwell pair on SE(2).
      if (enabled.maxwell && data.maxwell) {
        const mx = data.maxwell;
        const labA = 'figure-8  k=' + mx.k.toFixed(3) +
                     '  L=' + mx.L_pixels.toFixed(0);
        // Place each label at the far tip of its respective figure-8 lobe
        // (max distance from src), so the two labels don't pile up at src.
        const tipA = farthestFrom(mx.polyline_A, src.x, src.y);
        const tipB = farthestFrom(mx.polyline_B, src.x, src.y);
        drawCurveFromPoly(mx.polyline_A, mx.color_A, labA, false,
                          [tipA[0] + 8, tipA[1] - 10]);
        drawCurveFromPoly(mx.polyline_B, mx.color_B,
                          'reversed-heading (same L)', true,
                          [tipB[0] - 180, tipB[1] - 10]);
      }

      drawSourceMarker();
    }

    ['inflectional', 'noninflectional', 'separatrix', 'maxwell'].forEach(key => {
      const el = document.getElementById('v1-show-' + key);
      if (el) el.addEventListener('change', render);
    });

    render();
  }

  // ── render from precomputed BVP results ────────────────────────────────
  // window.__v1Data is set by /public/data/v1_geodesics.js, loaded as a
  // <script> tag (see the head of this article).  We poll briefly in case
  // drawV1 fires before that script finishes.
  if (window.__v1Data) {
    renderGeodesics(window.__v1Data);
  } else {
    const t0 = Date.now();
    (function poll() {
      if (window.__v1Data) return renderGeodesics(window.__v1Data);
      if (Date.now() - t0 > 3000) {
        console.error('v1_geodesics.js failed to load within 3 s');
        return;
      }
      setTimeout(poll, 50);
    })();
  }
}

// ── Figure 3: Geodesic family ─────────────────────────────────────────────
/*
 * Continuous SE(2) geodesic family parametrised by a single k ∈ (0, K_HI].
 *   k ∈ (0, 1)        inflectional   κ(s) = 2k·cn(s|k²)
 *   k ≈ 1             Euler spiral   κ(s) = 2·sech(s)
 *   k ∈ (1, K_HI]     non-inflectional with m = 2 − k ∈ (0, 1)
 *                                    κ(s) = 2·dn(s|m)
 * The slider sets the maximum k actually rendered; curves are sampled
 * uniformly in k from 0.05 to k_max.  The vertical bar on the right is
 * the colour legend, with a red tick at the separatrix k = 1.
 */
const K_HI = 1.95;
const N_CURVES = 22;
const SEP_EPS = 0.015;

function elasticaForK(k) {
  if (k < 1 - SEP_EPS)       return elasticaInflectional(k, 500);
  if (k <= 1 + SEP_EPS)      return elasticaSeparatrix(7, 500);
  // non-inflectional: m = 2 − k, clamped away from 0 so the curve has finite extent
  const m = Math.max(0.04, 2 - k);
  return elasticaNonInflectional(m, 500);
}

function drawGeodesicFamily() {
  const svg = document.getElementById('fig-geodesics');
  if (!svg) return;

  const W = svg.getBoundingClientRect().width || 680;
  const H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg);
  g.selectAll('*').remove();

  const slider = document.getElementById('geodesic-kmax-slider');
  const valEl  = document.getElementById('geodesic-kmax-val');

  // Layout: main plot on the left, vertical colour legend on the right
  const PAD = { l: 24, r: 96, t: 22, b: 22 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const colorScale = k => d3.interpolateViridis(Math.min(0.05 + 0.9 * (k / K_HI), 0.97));

  // ── Static decorations: background + colour-bar legend (built once) ──
  g.append('rect').attr('width', W).attr('height', H).attr('fill', '#fafafa');

  const defs = g.append('defs');
  const grad = defs.append('linearGradient')
    .attr('id', 'k-legend-gradient')
    .attr('x1', 0).attr('y1', 1)   // bottom = small k
    .attr('x2', 0).attr('y2', 0);  // top = large k
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    grad.append('stop')
      .attr('offset', (t * 100) + '%')
      .attr('stop-color', colorScale(t * K_HI));
  }

  const legX = W - PAD.r + 26;
  const legY = PAD.t + 12;
  const legW = 14;
  const legH = innerH - 24;

  g.append('rect')
    .attr('x', legX).attr('y', legY)
    .attr('width', legW).attr('height', legH)
    .attr('fill', 'url(#k-legend-gradient)')
    .attr('stroke', '#ccc').attr('stroke-width', 0.5);

  // Legend title
  g.append('text')
    .attr('x', legX + legW / 2).attr('y', legY - 4)
    .attr('text-anchor', 'middle')
    .attr('style', 'font-family:var(--sans);font-size:11px;fill:#666;font-weight:700')
    .text('k');

  // Tick labels at k = 0, 0.5, 1, 1.5
  const ticks = [0, 0.5, 1.0, 1.5, K_HI];
  ticks.forEach(k => {
    if (k > K_HI) return;
    const ty = legY + legH * (1 - k / K_HI);
    g.append('line')
      .attr('x1', legX + legW).attr('x2', legX + legW + 4)
      .attr('y1', ty).attr('y2', ty)
      .attr('stroke', '#888').attr('stroke-width', 1);
    g.append('text')
      .attr('x', legX + legW + 7).attr('y', ty + 3.4)
      .attr('style', 'font-family:var(--mono);font-size:10px;fill:#666')
      .text(k.toFixed(k < 1 ? 1 : (k === 1 ? 1 : 2)).replace(/0$/, ''));
  });

  // Separatrix marker (red bar at k = 1)
  const sepY = legY + legH * (1 - 1.0 / K_HI);
  g.append('line')
    .attr('x1', legX - 2).attr('x2', legX + legW + 2)
    .attr('y1', sepY).attr('y2', sepY)
    .attr('stroke', '#c62828').attr('stroke-width', 1.6);
  g.append('text')
    .attr('x', legX - 4).attr('y', sepY + 3.5)
    .attr('text-anchor', 'end')
    .attr('style', 'font-family:var(--sans);font-size:9.5px;fill:#c62828;font-weight:700')
    .text('k=1');

  // Indicator that tracks the slider's current k_max (filled triangle on the bar)
  const kMaxMarker = g.append('polygon')
    .attr('fill', '#1a1a1a');

  // Plot group (cleared on every redraw)
  const plot = g.append('g').attr('class', 'geodesic-plot');

  // Centre/baseline for the plot
  const xOff = PAD.l + innerW * 0.34;       // origin slightly left of centre
  const yOff = PAD.t + innerH * 0.35;   // moved 20 percentage-points higher
                                        // so the long inflectional curls
                                        // hanging downward don't get clipped

  function render() {
    plot.selectAll('*').remove();

    const kMax = slider ? parseFloat(slider.value) / 100 : 1.0;
    if (valEl) valEl.textContent = kMax.toFixed(2);

    // Sample N_CURVES values of k from 0.05 to kMax
    const kVals = [];
    const kMin = 0.05;
    if (kMax > kMin) {
      for (let i = 0; i <= N_CURVES; i++) {
        kVals.push(kMin + (kMax - kMin) * i / N_CURVES);
      }
    } else {
      kVals.push(kMin);
    }

    // Compute curves and global extent
    const curves = kVals.map(k => ({ k, pts: elasticaForK(k) }));

    let xs = [], ys = [];
    curves.forEach(({ pts }) => pts.forEach(p => {
      if (isFinite(p.x) && isFinite(p.y)) { xs.push(p.x); ys.push(p.y); }
    }));
    if (xs.length === 0) return;
    const xExt = d3.extent(xs), yExt = d3.extent(ys);
    const xRange = Math.max(0.5, xExt[1] - xExt[0]);
    const yRange = Math.max(0.5, yExt[1] - yExt[0]);
    const scale = Math.min(innerW / xRange, innerH / yRange) * 0.85;

    // Anchor every curve so each starts at (xOff, yOff)
    curves.forEach(({ k, pts }) => {
      const x0 = pts[0].x, y0 = pts[0].y;
      const stroke = (Math.abs(k - 1) <= SEP_EPS) ? '#c62828' : colorScale(k);
      const sw = (Math.abs(k - 1) <= SEP_EPS) ? 2.4 : (k > 1 ? 1.7 : 1.6);
      plot.append('path')
        .attr('d', d3.line()
          .x(p => xOff + (p.x - x0) * scale)
          .y(p => yOff - (p.y - y0) * scale)(pts))
        .attr('fill', 'none')
        .attr('stroke', stroke)
        .attr('stroke-width', sw)
        .attr('stroke-opacity', 0.88)
        .attr('stroke-linecap', 'round');
    });

    // Origin dot
    plot.append('circle')
      .attr('cx', xOff).attr('cy', yOff).attr('r', 4.5).attr('fill', '#222');

    // Update the k_max indicator on the legend
    const my = legY + legH * (1 - kMax / K_HI);
    kMaxMarker.attr('points',
      `${legX - 7},${my} ${legX - 1},${my - 5} ${legX - 1},${my + 5}`);
  }

  render();
  if (slider) slider.addEventListener('input', render);
}

// ── Figure 3: moving Frenet–Serret frame on a real SE(2) geodesic ───────
// All quantities are read from window.__v1Data (the BVP-solved polylines
// from scripts/sr_geodesics_v1.py) — the figure is a faithful rendering of
// computed data, not a hand-positioned diagram.  At slider value s the
// frame consists of:
//   T(s) = (cos θ(s), sin θ(s))   — the horizontal direction X_1|γ(s)
//   N(s) = (-sin θ(s), cos θ(s))  — the perpendicular X_3|γ(s)
// The curvature κ(s) = dθ/ds is estimated by central difference on the
// θ-samples; for the inflectional family the analytic value is
// 2 k ω cn(ω s + φ | k²) and the two agree to ~ 0.01 rel-error.
function drawFrenet() {
  const svg = document.getElementById('fig-frenet');
  if (!svg || !window.__v1Data) return;
  const data = window.__v1Data;

  // Use the SAME extended-grid logic as Figure 2 so the orientation field
  // fills the full container width regardless of how wide it renders.
  const W = 680, H = 460;
  const ROWS = 22, COLS = 32;
  const cellW = W / COLS, cellH = H / ROWS;
  const lineLen = Math.min(cellW, cellH) * 0.38;
  const cx = W / 2, cy = H / 2;
  const containerW = svg.clientWidth || svg.getBoundingClientRect().width || W;
  const viewBoxW = Math.max(W, containerW * H / H);
  const xPad = (viewBoxW - W) / 2;
  const xMin = -xPad;
  svg.setAttribute('viewBox', `${xMin} 0 ${viewBoxW} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const g = d3.select(svg);
  g.selectAll('*').remove();

  function theta(x, y) {
    const phi1 = Math.atan2(y - cy, x - cx);
    const phi2 = Math.atan2(y - cy * 1.3, x - cx * 0.5);
    const sumRe = Math.cos(phi1) + 0.35 * Math.cos(phi2);
    const sumIm = Math.sin(phi1) + 0.35 * Math.sin(phi2);
    return Math.atan2(sumIm, sumRe) / 2;
  }
  g.append('rect')
    .attr('x', xMin).attr('y', 0)
    .attr('width', viewBoxW).attr('height', H).attr('fill', '#fafafa');
  const colMin = Math.floor(xMin / cellW);
  const colMax = Math.ceil((xMin + viewBoxW) / cellW);
  for (let row = 0; row < ROWS; row++) {
    for (let col = colMin; col < colMax; col++) {
      const px = (col + 0.5) * cellW, py = (row + 0.5) * cellH;
      const t = theta(px, py);
      const hue = ((t * 180 / Math.PI) % 180 + 180) % 180;
      const dx = lineLen * Math.cos(t), dy = lineLen * Math.sin(t);
      g.append('line')
        .attr('x1', px - dx).attr('y1', py - dy)
        .attr('x2', px + dx).attr('y2', py + dy)
        .attr('stroke', `hsl(${hue},70%,40%)`).attr('stroke-width', 1.4)
        .attr('stroke-linecap', 'round').attr('stroke-opacity', 0.55);
    }
  }

  const select = document.getElementById('frenet-curve-select');
  const slider = document.getElementById('frenet-s-slider');
  const sValEl = document.getElementById('frenet-s-val');
  const readSingle = document.getElementById('frenet-readout-single');
  const readPair = document.getElementById('frenet-readout-pair');
  const thEl = document.getElementById('frenet-theta');
  const kapEl = document.getElementById('frenet-kappa');
  const cellEl = document.getElementById('frenet-cell');
  const dthEl = document.getElementById('frenet-deltatheta');
  const thAEl = document.getElementById('frenet-thetaA');
  const thBEl = document.getElementById('frenet-thetaB');
  const kAEl = document.getElementById('frenet-kappaA');
  const kBEl = document.getElementById('frenet-kappaB');
  const pairDiffEl = document.getElementById('frenet-pair-diff');

  // Populate dropdown — single curves first, then the Maxwell pair as a unit.
  if (select && select.options.length === 0) {
    data.curves.forEach((c, i) => {
      const o = document.createElement('option');
      o.value = 'curve:' + i;
      const fam = c.family === 'inflectional' ? 'inflectional'
                : c.family === 'noninflectional' ? 'non-inflectional'
                : 'separatrix';
      const k = c.params.k !== undefined ? c.params.k.toFixed(2) : 'sech';
      o.textContent = `${fam}  →  cell (${c.target_cell.col}, ${c.target_cell.row})  k=${k}`;
      select.appendChild(o);
    });
    if (data.maxwell) {
      const o = document.createElement('option');
      o.value = 'maxwell';
      o.textContent = `Maxwell pair (figure-8, k=${data.maxwell.k.toFixed(3)})`;
      select.appendChild(o);
    }
  }

  function fmtAng(rad) {
    let d = rad * 180 / Math.PI;
    d = ((d + 90) % 180 + 180) % 180 - 90;
    return (d >= 0 ? '+' : '') + d.toFixed(1) + '°';
  }
  function fmtAng360(rad) {
    let d = rad * 180 / Math.PI;
    while (d > 180) d -= 360;
    while (d <= -180) d += 360;
    return (d >= 0 ? '+' : '') + d.toFixed(1) + '°';
  }
  // unwrap (a - b) into (-π, π]
  function shortDiff(a, b) {
    let d = a - b;
    while (d > Math.PI)  d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }
  function kappaAt(thetas, ss, i) {
    const N = thetas.length;
    const i0 = Math.max(0, i - 1), i1 = Math.min(N - 1, i + 1);
    const ds = ss[i1] - ss[i0];
    if (ds < 1e-9) return 0;
    const dth = shortDiff(thetas[i1], thetas[i0]);
    return -dth / ds;        // SVG y-flip ⇒ kappa = -kappa_svg in math frame
  }

  // Persistent overlay group (cleared on every slider tick / curve change)
  const overlay = g.append('g').attr('id', 'frenet-overlay');

  function drawCurvePathFaint(poly, color) {
    let d = 'M ' + poly[0][0] + ',' + poly[0][1];
    for (let k = 1; k < poly.length; k++)
      d += ' L ' + poly[k][0] + ',' + poly[k][1];
    overlay.append('path').attr('d', d).attr('fill', 'none')
      .attr('stroke', color).attr('stroke-width', 2.0)
      .attr('stroke-opacity', 0.30).attr('stroke-linecap', 'round');
  }
  function drawCurvePathSolidUpTo(poly, color, i, dashed) {
    let dt = 'M ' + poly[0][0] + ',' + poly[0][1];
    for (let k = 1; k <= i; k++) dt += ' L ' + poly[k][0] + ',' + poly[k][1];
    const sel = overlay.append('path').attr('d', dt).attr('fill', 'none')
      .attr('stroke', color).attr('stroke-width', 2.6)
      .attr('stroke-opacity', 0.95).attr('stroke-linecap', 'round');
    if (dashed) sel.attr('stroke-dasharray', '6,3');
  }
  function drawFrenetFrame(x, y, th, color, suffix) {
    const TLEN = 50, NLEN = 36;
    const tx = Math.cos(th), ty = Math.sin(th);
    const nx = -Math.sin(th), ny = Math.cos(th);
    const arrowKey = color === '#1565c0' ? 'blue'
                   : color === '#e65100' ? 'orange'
                   : 'darkorange';
    // T arrow (curve's tangent — uses curve color)
    overlay.append('line')
      .attr('x1', x).attr('y1', y)
      .attr('x2', x + TLEN * tx).attr('y2', y + TLEN * ty)
      .attr('stroke', '#fff').attr('stroke-width', 5.5)
      .attr('stroke-linecap', 'round');
    overlay.append('line')
      .attr('x1', x).attr('y1', y)
      .attr('x2', x + TLEN * tx).attr('y2', y + TLEN * ty)
      .attr('stroke', color).attr('stroke-width', 2.8)
      .attr('marker-end', 'url(#frenet-arrow-' + arrowKey + ')');
    // N arrow (perpendicular — always orange dashed, the "forbidden" direction)
    overlay.append('line')
      .attr('x1', x).attr('y1', y)
      .attr('x2', x + NLEN * nx).attr('y2', y + NLEN * ny)
      .attr('stroke', '#fff').attr('stroke-width', 5.5)
      .attr('stroke-linecap', 'round');
    overlay.append('line')
      .attr('x1', x).attr('y1', y)
      .attr('x2', x + NLEN * nx).attr('y2', y + NLEN * ny)
      .attr('stroke', '#e65100').attr('stroke-width', 2.0)
      .attr('stroke-dasharray', '5,3')
      .attr('marker-end', 'url(#frenet-arrow-orange)');
    overlay.append('circle')
      .attr('cx', x).attr('cy', y).attr('r', 4.5)
      .attr('fill', '#1a1a1a').attr('stroke', '#fff').attr('stroke-width', 2);
    // Always label BOTH T and N (with optional suffix for the Maxwell pair).
    const tLabel = 'T' + (suffix ? '_' + suffix : '');
    const nLabel = 'N' + (suffix ? '_' + suffix : '');
    overlay.append('text')
      .attr('x', x + TLEN * tx + 6 * tx).attr('y', y + TLEN * ty + 6 * ty + 4)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono);font-size:12px;font-weight:700;'
        + 'paint-order:stroke;stroke:#fff;stroke-width:3.5px;fill:' + color + ';')
      .text(tLabel);
    overlay.append('text')
      .attr('x', x + NLEN * nx + 7 * nx).attr('y', y + NLEN * ny + 7 * ny + 4)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-family:var(--mono);font-size:12px;font-weight:700;'
        + 'paint-order:stroke;stroke:#fff;stroke-width:3.5px;fill:#e65100;')
      .text(nLabel);
  }
  function drawFieldStroke(x, y) {
    const t_field = theta(x, y);
    const fdx = 24 * Math.cos(t_field), fdy = 24 * Math.sin(t_field);
    overlay.append('line')
      .attr('x1', x - fdx).attr('y1', y - fdy)
      .attr('x2', x + fdx).attr('y2', y + fdy)
      .attr('stroke', '#fff').attr('stroke-width', 5)
      .attr('stroke-linecap', 'round').attr('stroke-opacity', 0.8);
    overlay.append('line')
      .attr('x1', x - fdx).attr('y1', y - fdy)
      .attr('x2', x + fdx).attr('y2', y + fdy)
      .attr('stroke', '#2e7d32').attr('stroke-width', 2.4)
      .attr('stroke-linecap', 'round').attr('stroke-opacity', 0.9);
    return t_field;
  }

  function render() {
    overlay.selectAll('*').remove();
    const sel = (select.value || 'curve:0');
    const isMaxwell = (sel === 'maxwell');

    if (!isMaxwell) {
      // ── Single curve (inflect / non-inflect / separatrix) ──────────────
      readSingle.style.display = 'flex';
      readPair.style.display = 'none';
      const idx = parseInt(sel.replace('curve:', ''), 10);
      const curve = data.curves[idx];
      if (!curve) return;
      const poly = curve.polyline;
      const thetas = curve.theta_svg_samples;
      const ss = curve.s_samples;
      const N = poly.length;
      slider.max = String(N - 1);
      let i = parseInt(slider.value, 10);
      if (i < 0) i = 0;
      if (i > N - 1) i = N - 1;
      const x = poly[i][0], y = poly[i][1];
      const th = thetas[i];
      const s = ss[i];
      const kappa = kappaAt(thetas, ss, i);

      drawCurvePathFaint(poly, curve.color);
      drawCurvePathSolidUpTo(poly, curve.color, i, false);
      // Source dot + target dashed circle
      overlay.append('circle')
        .attr('cx', poly[0][0]).attr('cy', poly[0][1]).attr('r', 4)
        .attr('fill', '#1565c0').attr('stroke', '#fff').attr('stroke-width', 1.5);
      const last = poly[N - 1];
      overlay.append('circle')
        .attr('cx', last[0]).attr('cy', last[1]).attr('r', 8)
        .attr('fill', 'none').attr('stroke', curve.color)
        .attr('stroke-width', 1.2).attr('stroke-opacity', 0.6)
        .attr('stroke-dasharray', '2,2');

      const t_field = drawFieldStroke(x, y);
      drawFrenetFrame(x, y, th, '#1565c0');

      sValEl.textContent = `s = ${s.toFixed(3)}  (L = ${(curve.L).toFixed(3)})`;
      thEl.textContent = fmtAng(th);
      kapEl.textContent = (kappa >= 0 ? '+' : '') + kappa.toFixed(3);
      cellEl.textContent = fmtAng(t_field);
      const delta = shortDiff(th, t_field);
      let dnorm = ((delta + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2;
      dthEl.textContent = (dnorm >= 0 ? '+' : '')
        + (dnorm * 180 / Math.PI).toFixed(1) + '°';
    } else {
      // ── Maxwell pair: two synchronised frames ──────────────────────────
      readSingle.style.display = 'none';
      readPair.style.display = 'flex';
      const mx = data.maxwell;
      const polyA = mx.polyline_A, polyB = mx.polyline_B;
      const thA = mx.theta_svg_samples_A;
      const thB = mx.theta_svg_samples_B;
      const ss = mx.s_samples;
      const N = polyA.length;
      slider.max = String(N - 1);
      let i = parseInt(slider.value, 10);
      if (i < 0) i = 0;
      if (i > N - 1) i = N - 1;

      // Both curves shown faintly, traversed portion solid
      drawCurvePathFaint(polyA, mx.color_A);
      drawCurvePathFaint(polyB, mx.color_B);
      drawCurvePathSolidUpTo(polyA, mx.color_A, i, false);
      drawCurvePathSolidUpTo(polyB, mx.color_B, i, true);

      // Source / meeting marker (both curves start AND end here)
      overlay.append('circle')
        .attr('cx', polyA[0][0]).attr('cy', polyA[0][1]).attr('r', 5)
        .attr('fill', '#1565c0').attr('stroke', '#fff').attr('stroke-width', 2);

      // Frenet frames at the same arc length on each curve
      const xA = polyA[i][0], yA = polyA[i][1], thAi = thA[i];
      const xB = polyB[i][0], yB = polyB[i][1], thBi = thB[i];
      drawFrenetFrame(xA, yA, thAi, mx.color_A, 'A');
      drawFrenetFrame(xB, yB, thBi, mx.color_B, 'B');

      const kappa_A = kappaAt(thA, ss, i);
      const kappa_B = kappaAt(thB, ss, i);
      sValEl.textContent = `s = ${ss[i].toFixed(3)}  (L = ${mx.L.toFixed(3)})`;
      thAEl.textContent = fmtAng360(thAi);
      thBEl.textContent = fmtAng360(thBi);
      kAEl.textContent = (kappa_A >= 0 ? '+' : '') + kappa_A.toFixed(3);
      kBEl.textContent = (kappa_B >= 0 ? '+' : '') + kappa_B.toFixed(3);
      const diff = shortDiff(thAi, thBi);
      pairDiffEl.textContent = (diff * 180 / Math.PI).toFixed(1) + '°';
    }
  }

  // Arrowhead defs
  const defs = g.append('defs');
  [['blue', '#1565c0'], ['orange', '#e65100'], ['darkorange', '#bf360c']].forEach(([n, c]) => {
    const m = defs.append('marker')
      .attr('id', 'frenet-arrow-' + n)
      .attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto');
    m.append('path').attr('d', 'M0,0 L10,5 L0,10 Z').attr('fill', c);
  });

  if (slider) slider.addEventListener('input', render);
  if (select) select.addEventListener('change', () => { slider.value = '0'; render(); });
  render();
}

// ── Bootstrap on load ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
  drawV1();
  drawGeodesicFamily();
  // drawFrenet depends on window.__v1Data which loads asynchronously via the
  // <script src="/public/data/v1_geodesics.js"> tag.  Wait briefly for it.
  (function pollFrenet() {
    if (window.__v1Data) return drawFrenet();
    setTimeout(pollFrenet, 50);
  })();
  window.addEventListener('resize', () => {
    drawV1(); drawGeodesicFamily(); drawFrenet();
  });
});

})();
</script>
