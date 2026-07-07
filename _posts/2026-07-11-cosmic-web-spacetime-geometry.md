---
layout: distill
title: "From Cosmic Filaments to Curved Spacetime"
subtitle: >
  The same geometry that lifts a filament — a direction attached to every point,
  shortest paths under a constraint — is the geometry underneath gravity. Make the
  symmetries of space local and spacetime bends; the cosmic web's tidal frame and
  Einstein's gravitational field turn out to be the same tensor read twice.
date: 2026-07-11 09:00:00
categories: [mathematics]
tags: [cosmic-web, general-relativity, cartan-geometry, gauge-gravity, sub-riemannian, spacetime, zeldovich, caustics]
image: /public/img/posts/cosmic-web-3.svg
description: >
  The capstone of the cosmic-web series, developed in full: the Euclidean group as a
  Klein geometry (semidirect product, Lie algebra, the lift as a quotient of the frame
  bundle); Cartan's recipe for curving it (solder form, connection, torsion and
  curvature); gravity as the gauged symmetry with geodesic deviation as its observable;
  and filament theory — Zel'dovich free fall, the deformation tensor, caustics and
  catastrophes — living in the eigenframe of the very same tidal tensor.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: 3
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where this sits — and what it is</div>
This is the series' capstone: a step back from filaments to the geometry of
<em>spacetime itself</em>. The empirical posts asked whether a position-plus-orientation
lift finds and shapes the cosmic web
(<a href="{% post_url 2026-07-03-geometry-of-cosmic-web-research-program %}">Part&nbsp;1</a>,
<a href="{% post_url 2026-07-04-cosmic-web-two-models %}">Part&nbsp;2</a>). This one is
<em>theoretical</em>, not a data study — its figures are interactive diagrams, not
measurements — and it develops, with the actual machinery, the claim the whole program
kept circling: the geometry we used for filaments is the geometry Einstein used for
gravity. Both are what you get when you take the symmetries of flat space and make them
<em>local</em>. The route: the Euclidean group done properly (§2), Cartan's recipe for
curving a symmetry (§3), gravity as the gauged version (§4), what curvature does to
falling matter (§5) — and then back down to Earth, or rather to the web: filament theory
as the caustics of free fall, in the eigenframe of the very tensor that ran the whole
series (§6).
</div>

## The thread the series kept pulling

Every post here has been about **frames and directions**. The tidal eigenframe picks
the filament axis — the direction gravity squeezes last
([Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/)). The orientation
lift carries a full direction at every point,
$$\mathbb{R}^3 \times S^2 \cong \mathrm{SE}(3)/\mathrm{SO}(2)$$. The
[Geometry of Seeing]({% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %})
series did the 2D version, $$\mathrm{SE}(2)$$, and traced shortest paths under a
turning constraint.

Attach a preferred frame to every point of a space, and ask how it twists as you move
from point to point. That single question — *how does the local frame turn?* — is the
one Einstein's gravity is built from. The cosmic web handed us frames; gravity is the
theory of how frames turn. The rest of this post makes that link precise, and it ends
somewhere concrete: the tensor whose eigenframe oriented every experiment in this series
is the Newtonian face of the Riemann curvature of spacetime, and the filaments are the
*caustics* of its free-fall flow.

## The Euclidean group, all the way down

Start with the group this series has been living on. A **rigid motion** of ordinary
3-space is a rotation followed by a translation: it moves points as

$$\mathbf{x} \;\longmapsto\; R\,\mathbf{x} + \mathbf{t},
\qquad R \in \mathrm{SO}(3),\; \mathbf{t} \in \mathbb{R}^3 .$$

Composing two of them shows the structure immediately: do $$(R_1, \mathbf{t}_1)$$ first,
then $$(R_2, \mathbf{t}_2)$$, and you get

$$(R_2, \mathbf{t}_2)\,(R_1, \mathbf{t}_1)
 \;=\; \bigl(R_2 R_1,\; R_2\,\mathbf{t}_1 + \mathbf{t}_2\bigr).$$

The rotations multiply among themselves, but they also *act on* the translations —
the $$R_2\,\mathbf{t}_1$$ term. That twist is what the symbol
$$\mathrm{SE}(3) = \mathbb{R}^3 \rtimes \mathrm{SO}(3)$$ records: a **semidirect
product**,[^semidirect] not a plain product. Concretely, every rigid motion is one
$$4\times 4$$ matrix,

$$g \;=\; \begin{pmatrix} R & \mathbf{t} \\ 0 & 1 \end{pmatrix},$$

acting on points written as $$(\mathbf{x}, 1)^{\top}$$; matrix multiplication reproduces
the composition law above. This is the group the cosmic-web lift and the visual-cortex
model are built on (in two dimensions, $$\mathrm{SE}(2)$$, rotations about one axis).

### Klein's dictionary: the space *is* the group

Felix Klein's Erlangen program (1872) turns this around: don't start with the space and
find its symmetries — start with the symmetry group and *reconstruct the space from
it*. Fix a point, say the origin. The subgroup that leaves it fixed is the rotations,
$$H = \mathrm{SO}(3)$$. Every other point of space is reached from the origin by some
motion, and two motions land on the same point exactly when they differ by a rotation
about it. So the points of space are the *cosets*:

$$\mathbb{R}^3 \;\cong\; \mathrm{SE}(3)\,/\,\mathrm{SO}(3).$$

A geometry, in Klein's dictionary, is a pair $$(G, H)$$ — a group and the subgroup
fixing a basepoint — and the space is the quotient $$G/H$$, a **homogeneous
space**.[^homogeneous] Geometric notions are exactly the $$G$$-invariant ones: distance
and angle survive because rigid motions preserve them; "left of" does not, because
rotations scramble it. Euclidean geometry *is* $$(\mathrm{SE}(3), \mathrm{SO}(3))$$.
Special relativity's flat spacetime is the same construction one row down:
Minkowski space is $$\mathrm{ISO}(3,1)/\mathrm{SO}(3,1)$$ — the **Poincaré group**
(translations, rotations, boosts) quotiented by the Lorentz group fixing an event.

### The lift is a quotient of the same group

Now the observation that ties the whole series to this machinery. Quotient
$$\mathrm{SE}(3)$$ not by all rotations but only by the rotations about a chosen axis,
$$\mathrm{SO}(2)$$, and you keep two pieces of data: *where you are* and *which way that
axis points*:

$$\mathrm{SE}(3)\,/\,\mathrm{SO}(2) \;\cong\; \mathbb{R}^3 \times S^2 .$$

That is precisely the state space of the orientation lift of
[Part&nbsp;2]({% post_url 2026-07-04-cosmic-web-two-models %}) — position plus
direction — and $$\mathrm{SE}(2)$$ itself (no quotient at all) is the state space of
the V1 model. There is a cleaner way to say it: $$\mathrm{SE}(3)$$ *is* the bundle of
oriented orthonormal frames of flat space — a point plus a full right-handed triad at
it. The lift keeps the triad's first leg and forgets the spin about it. So when the
tidal analysis of [Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/)
attaches an eigenframe to every voxel, it is literally handing you a *section of the
frame bundle* — a copy of the group's own geometry, spread over space. "The web hands
us frames" is not a metaphor; it is the statement that the data lives on
$$\mathrm{SE}(3)$$.

### The algebra: where flatness hides

Groups are unwieldy; their **Lie algebras**[^liealgebra] — the infinitesimal motions —
carry the same information linearly. For $$\mathfrak{se}(3)$$ the generators are three
infinitesimal translations $$P_1, P_2, P_3$$ and three infinitesimal rotations
$$J_1, J_2, J_3$$, with brackets

$$[J_i, J_j] = \epsilon_{ijk} J_k, \qquad
  [J_i, P_j] = \epsilon_{ijk} P_k, \qquad
  \boxed{\;[P_i, P_j] = 0.\;}$$

Read them in words. Rotations compose like rotations. Rotations turn translations into
other translations (that is the semidirect twist again). And — the boxed line —
**translations commute**: go east then north, or north then east, and you arrive at the
same point. That innocuous-looking zero *is the flatness of Euclidean space*, written
algebraically. Hold that thought: in §4 the entire difference between flat space and a
gravitating universe with a cosmological constant will live in whether
$$[P, P] = 0$$.[^desitter]

## Cartan's move: curve the model

Klein's picture is perfect and rigid — and useless for a lumpy universe, because a
lumpy space has *no* global symmetries at all: no motion of the actual matter
distribution maps it to itself. Élie Cartan's generalisation (1923) keeps Klein's
dictionary but applies it *infinitesimally*: a **Cartan geometry** is a space that
looks like the Klein model $$G/H$$ at each point, together with a rule for comparing
the model copies at neighbouring points. All the geometry is stored in that rule — the
**Cartan connection** — and curvature is the precise measure of its failure to be the
flat model globally.

The connection is one object with two parts, mirroring the algebra's split
$$\mathfrak{se}(3) = \mathbb{R}^3 \oplus \mathfrak{so}(3)$$. It is a 1-form[^forms]
$$\omega$$ with values in the algebra, and it decomposes as

$$\omega \;=\; \underbrace{e}_{\text{translation part}} \;\oplus\;
             \underbrace{\hat\omega}_{\text{rotation part}} .$$

- The translational piece $$e$$ — the **solder form**, or *frame/coframe* — says which
  infinitesimal step in the model corresponds to each infinitesimal step in the actual
  space. It is what welds the abstract model to the manifold, and it carries the metric:
  lengths and angles are read through $$e$$.
- The rotational piece $$\hat\omega$$ — the **spin connection** — says how the local
  frame *turns* as you slide from a point to its neighbour. It is the mathematical answer
  to the series' running question, "how does the frame rotate from voxel to voxel?"

One curvature measures everything. The field strength of a connection is

$$F \;=\; d\omega + \tfrac{1}{2}[\omega, \omega],$$

and because the algebra splits, $$F$$ splits too — into two failures with two names:

$$\Theta \;=\; de + \hat\omega \wedge e \quad(\text{translation part: } \textbf{torsion}),
\qquad
R \;=\; d\hat\omega + \hat\omega \wedge \hat\omega \quad(\text{rotation part: } \textbf{curvature}).$$

**Torsion** is the failure of infinitesimal parallelograms to close: step along $$X$$,
then $$Y$$, then back along $$X$$ and $$Y$$ — torsion is the gap. **Curvature** is the
failure of *frames* to return: carry a frame around the same little loop and curvature
is the rotation it comes back with. Riemannian geometry is the special case
$$\Theta = 0$$ with $$\hat\omega$$ then fixed uniquely by $$e$$ (the Levi-Civita
choice); general relativity, the orientation lift, and the rolling-ball problem below
are all Cartan geometries, differing only in the model $$G/H$$ they are glued from.

### Holonomy: curvature you can watch

The rotation-around-a-loop definition of curvature is not an abstraction — it is the
one thing about curved space you can *demonstrate on a ball*. Parallel transport means:
carry a vector so that it never rotates *as far as the local frame can tell* — no
twisting relative to the surface. On a flat sheet the vector comes back unchanged
around any loop. On a sphere it comes back **rotated**, and the rotation angle is
exactly the curvature integrated over the enclosed area — for the unit sphere, the
enclosed solid angle. That net rotation is the loop's **holonomy**, and the figure
below lets you watch it accumulate.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-holonomy">
  <div style="text-align:center; margin-bottom:0.5em; font-family:'Source Sans 3', sans-serif; font-size:13px; color:#555;">
    latitude&nbsp;<input type="range" id="hol-lat" min="15" max="88" value="55" style="width:170px; vertical-align:middle; accent-color:#1565c0;">
    &nbsp;&nbsp;transport progress&nbsp;<input type="range" id="hol-phi" min="0" max="100" value="100" style="width:200px; vertical-align:middle; accent-color:#e65100;">
  </div>
  <div id="cw-holonomy" style="text-align:center;"></div>
  <div id="hol-readout" style="text-align:center; font-family:'Source Sans 3', sans-serif; font-size:13.5px; color:#333; margin-top:8px; min-height:2.4em;"></div>
  <figcaption>
    <strong>Parallel transport measures curvature.</strong> A tangent vector (orange)
    is carried around a circle of constant latitude on the unit sphere, never rotating
    as far as the surface can tell. The ghost arrow marks its starting direction. After
    a full loop the vector returns <em>rotated</em> — by the <strong>holonomy angle</strong>
    $$\Delta\psi = 2\pi(1 - \cos\theta)$$, which is exactly the solid angle the loop
    encloses: curvature integrated over area. Drag the latitude toward the pole and the
    loop encloses little area — small rotation; push it toward the equator and the enclosed cap
    approaches a hemisphere — deficit approaching $$2\pi$$, a full turn back to identity,
    as befits the equator being a geodesic. On a flat sheet the
    same procedure returns every vector unchanged: holonomy is the operational meaning of
    the curvature 2-form $$R = d\hat\omega + \hat\omega\wedge\hat\omega$$ of the text.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-holonomy");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 520, H = 330, cx = 260, cy = 172, Rs = 132;
  const tilt = 0.42;                       // camera tilt about the x-axis
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const readout = document.getElementById("hol-readout");

  // orthographic projection with tilt: world (x, y, z), z = polar axis (up)
  function proj(p) {
    const yy = p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt);   // depth after tilt
    const zz = p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt);   // screen-up after tilt
    return { x: cx + Rs * p[0], y: cy - Rs * zz, front: yy <= 0 };
  }
  const sph = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  // local tangent frame at (th, ph)
  const eTh = (th, ph) => [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), -Math.sin(th)];
  const ePh = (th, ph) => [-Math.sin(ph), Math.cos(ph), 0];

  function arrow(from3, dir3, len, color, dash, wid) {
    const a = proj(from3);
    const tip3 = [from3[0] + len * dir3[0], from3[1] + len * dir3[1], from3[2] + len * dir3[2]];
    const b = proj(tip3);
    const g = el("g", {});
    g.appendChild(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color,
      "stroke-width": wid || 2.6, "stroke-dasharray": dash || "none" }));
    // arrowhead
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const hl = 7;
    [0.5, -0.5].forEach(s => {
      g.appendChild(el("line", { x1: b.x, y1: b.y,
        x2: b.x - hl * Math.cos(ang + s), y2: b.y - hl * Math.sin(ang + s),
        stroke: color, "stroke-width": wid || 2.6 }));
    });
    return g;
  }

  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const thetaDeg = +document.getElementById("hol-lat").value;
    const th = thetaDeg * Math.PI / 180;                 // polar angle of the loop
    const prog = +document.getElementById("hol-phi").value / 100;
    const phi = prog * 2 * Math.PI;                      // current transport azimuth

    // sphere outline
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: Rs, fill: "#f7fafc", stroke: "#cbd5e0", "stroke-width": 1.2 }));
    // a few meridians + equator for depth (front halves solid, back dashed)
    for (let m = 0; m < 4; m++) {
      const phM = m * Math.PI / 4;
      let dFront = "", dBack = "";
      for (let i = 0; i <= 80; i++) {
        const t = -Math.PI / 2 + i * Math.PI / 80;
        const p = proj(sph(Math.PI / 2 - t, phM));
        const seg = (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
        if (p.front) dFront += seg.replace(/^L/, dFront ? "L" : "M");
        else dBack += seg.replace(/^L/, dBack ? "L" : "M");
      }
      if (dBack) svg.appendChild(el("path", { d: dBack, fill: "none", stroke: "#e2e8f0", "stroke-width": 0.8 }));
      if (dFront) svg.appendChild(el("path", { d: dFront, fill: "none", stroke: "#cbd5e0", "stroke-width": 0.8 }));
    }
    // the latitude loop
    let dF = "", dB = "";
    for (let i = 0; i <= 120; i++) {
      const ph = i * 2 * Math.PI / 120;
      const p = proj(sph(th, ph));
      if (p.front) dF += (dF ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
      else dB += (dB ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
    }
    if (dB) svg.appendChild(el("path", { d: dB, fill: "none", stroke: "#90cdf4", "stroke-width": 1.6, "stroke-dasharray": "3,4" }));
    if (dF) svg.appendChild(el("path", { d: dF, fill: "none", stroke: "#1565c0", "stroke-width": 2 }));

    // start point and ghost of the initial vector (at phi = 0)
    const p0 = sph(th, 0);
    const psi0 = 0;                                       // start along e_theta
    const v0 = eTh(th, 0).map((c, i) => Math.cos(psi0) * c + Math.sin(psi0) * ePh(th, 0)[i]);
    svg.appendChild(arrow(p0, v0, 0.42, "#f6ad55", "5,4", 2));
    svg.appendChild(el("circle", { cx: proj(p0).x, cy: proj(p0).y, r: 3.5, fill: "#333" }));

    // transported vector at current phi: angle drifts by -cos(theta) * phi
    const psi = psi0 - Math.cos(th) * phi;
    const pt = sph(th, phi);
    const v = eTh(th, phi).map((c, i) => Math.cos(psi) * c + Math.sin(psi) * ePh(th, phi)[i]);
    svg.appendChild(arrow(pt, v, 0.42, "#e65100", "none", 3));
    svg.appendChild(el("circle", { cx: proj(pt).x, cy: proj(pt).y, r: 4, fill: "#e65100" }));

    // pole mark
    const pole = proj([0, 0, 1]);
    svg.appendChild(el("circle", { cx: pole.x, cy: pole.y, r: 2.5, fill: "#a0aec0" }));

    const hol = 2 * Math.PI * (1 - Math.cos(th));
    const holDeg = hol * 180 / Math.PI;
    readout.innerHTML =
      "loop at colatitude θ = " + thetaDeg + "°" +
      " &nbsp;·&nbsp; enclosed solid angle = 2π(1 − cos θ) = <strong>" + hol.toFixed(2) + " sr</strong>" +
      "<br><span style='color:#777'>full-loop holonomy: the vector returns rotated by <strong>" +
      holDeg.toFixed(0) + "°</strong> — curvature × area, watched directly.</span>";
  }
  ["hol-lat", "hol-phi"].forEach(id =>
    document.getElementById(id).addEventListener("input", render));
  render();
})();
</script>

<div class="l-body" markdown="1">

### Rolling the model: Cartan meets the sub-Riemannian series

There is a second, wonderfully physical way to say what a Cartan geometry is: **roll
the Klein model along the actual space without slipping or twisting**. The connection
is the rolling map; a straight line in the model, rolled out, *develops* onto the
curved space as its natural "straightest" curve. Cartan's rolling-ball problem — one
sphere rolling on another — is simultaneously the textbook example of this and a
bona-fide **sub-Riemannian** system: the no-slip constraint restricts the allowed
velocities to a small set of directions whose brackets restore full controllability,
exactly the Chow–Rashevskii mechanism the
[Geometry of Seeing]({% post_url 2026-04-28-geometry-of-seeing-elastica-jacobi %})
series used on $$\mathrm{SE}(2)$$, with the same Pontryagin principle generating the
optimal paths. Gravity, read as Cartan geometry, rolls a copy of flat Minkowski
spacetime along the curved universe (Wise 2010). One machine, three incarnations: the
visual cortex, the rolling ball, and gravity.

And the bracket has one more name here. In sub-Riemannian geometry
$$[X, Y]$$ measures the *failure of a frame of allowed moves to close* — go out along
$$X$$, then $$Y$$, then back, and you miss your starting point. In frame-based gravity
that same failure-to-close of the frame field, its **anholonomy**, *is* the field
strength (it is the torsion of the teleparallel formulation). A frame that closes like
a graph-paper grid is flat and gravity-free; the amount by which the cosmic web's tidal
frame fails to close from voxel to voxel is, in this language, its connection made
visible.

## Gauging: how gravity appears

Now the third move. Special relativity is the Klein geometry
$$(\mathrm{ISO}(3,1), \mathrm{SO}(3,1))$$: one *global* Poincaré symmetry for the whole
of spacetime — the same ten motions (four translations, three rotations, three boosts)
applied everywhere at once. Demand instead that the symmetry hold **independently at
every event** — that each observer may choose their own frame, at their own point, with
no god's-eye alignment — and rigid symmetry becomes impossible to state without new
structure: you need fields that *connect* the frame choices at neighbouring points
before you can compare them. Those compensating fields are forced on you, and they are
precisely Cartan's two pieces:

- gauging the **translations** forces in the frame field $$e$$ (the **tetrad**), which
  carries the metric $$g_{\mu\nu} = \eta_{ab}\, e^a_\mu e^b_\nu$$;
- gauging the **rotations/boosts** forces in the **spin connection** $$\hat\omega$$,
  which says how frames turn between events.

This is not an analogy for gravity; it is a construction of it (Utiyama 1956;
Kibble 1961; Sciama 1962). The two field strengths are the torsion and curvature of
§3, and Noether's theorem pairs each gauged symmetry with the source that excites it:

| Symmetry, made local | Conserved source | Geometric field | Its "field strength" |
|:---|:---|:---|:---|
| **Translations** | energy–momentum | the **frame / tetrad** $$e$$ | **torsion** $$\Theta$$ |
| **Rotations & boosts** | **spin** | the **spin connection** $$\hat\omega$$ | **curvature** $$R$$ |

The dynamics comes from the most economical invariant you can build from these pieces,
the Einstein–Cartan (Palatini) action

$$S \;=\; \frac{1}{16\pi G}\int \epsilon_{abcd}\; e^a \wedge e^b \wedge R^{cd},$$

read: *sum over spacetime the curvature, measured in the units the frame provides*.
Varying the frame $$e$$ gives Einstein's equation $$G_{\mu\nu} = 8\pi G\, T_{\mu\nu}$$
— curvature sourced by energy–momentum. Varying the connection $$\hat\omega$$ gives a
second, purely algebraic equation: torsion sourced by spin density. Where spin density
vanishes — everywhere outside quantum matter in extreme states — the second equation
says $$\Theta = 0$$, the connection collapses to Levi-Civita, and the construction
lands *exactly* on general relativity. Nothing in the gauge reading changes Einstein's
predictions; it explains where the two fields come from.[^desitter2]

## What curvature does: the tidal equation

So far, machinery. Here is the observable — and the series' punchline.

A single freely falling particle feels nothing: it follows a **geodesic**,[^geodesic]
the developed straight line of §3, and by the equivalence principle its local
experience is indistinguishable from floating in empty flat space. Curvature only
becomes measurable with *two* nearby free-fallers. Let $$\xi$$ be the separation vector
between neighbouring geodesics with 4-velocity $$u$$. It obeys the **geodesic deviation
(Jacobi) equation**

$$\frac{D^2 \xi^{\mu}}{d\tau^2} \;=\; -\,R^{\mu}{}_{\alpha\nu\beta}\, u^{\alpha}\, \xi^{\nu} u^{\beta} ,$$

read: *the relative acceleration of free-falling neighbours is curvature contracted
with their separation*. The piece of the Riemann tensor doing the work, in the rest
frame of the pair, is its **electric part**

$$E_{ij} \;=\; R_{i0j0}, \qquad
\frac{d^2 \xi^{i}}{d\tau^2} \;=\; -\,E_{ij}\,\xi^{j} :$$

a symmetric $$3\times 3$$ matrix that stretches and squeezes a ball of test particles
into an ellipsoid along its eigenvectors. Its trace focuses volume — by Einstein's
equation, $$\mathrm{tr}\,E = 4\pi G(\rho + 3p)$$, the seed of gravitational collapse —
while its trace-free part deforms shape without changing volume: the **tides**.

Now take the Newtonian limit — weak fields, slow motion, potential $$\Phi$$. The
electric Riemann tensor degenerates to

$$E_{ij} \;\longrightarrow\; \frac{\partial^2 \Phi}{\partial x_i\, \partial x_j}
\;=\; T_{ij},$$

**the Hessian of the gravitational potential** — which is, symbol for symbol, the tidal
tensor $$T_{ij}$$ of [Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/),
the matrix whose ordered eigenvalues $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$ and
eigenframe $$\{e_1, e_2, e_3\}$$ oriented every experiment in this series. The compass
that pointed our detectors down the filaments is the eigenframe of the electric part of
spacetime curvature. The cosmic web's tidal frame and Einstein's gravitational field
are not cousins after all — they are **the same tensor, read at two levels of the same
theory**.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-tidal">
  <div style="text-align:center; margin-bottom:0.5em; font-family:'Source Sans 3', sans-serif; font-size:13px; color:#555;">
    λ₁&nbsp;<input type="range" id="td-l1" min="-100" max="100" value="80" style="width:130px; vertical-align:middle; accent-color:#1565c0;">
    &nbsp;λ₂&nbsp;<input type="range" id="td-l2" min="-100" max="100" value="-35" style="width:130px; vertical-align:middle; accent-color:#2f855a;">
    &nbsp;growth&nbsp;D&nbsp;<input type="range" id="td-D" min="0" max="100" value="55" style="width:150px; vertical-align:middle; accent-color:#e65100;">
  </div>
  <div id="cw-tidal" style="text-align:center;"></div>
  <div id="td-readout" style="text-align:center; font-family:'Source Sans 3', sans-serif; font-size:13.5px; color:#333; margin-top:8px; min-height:2.6em;"></div>
  <figcaption>
    <strong>The tidal ellipsoid — geodesic deviation as web morphology.</strong> A ring
    of freely falling test particles (grey circle: initial; blue: now) deforms under the
    tidal tensor: each principal axis scales by $$1 - D\lambda_i$$, where $$D$$ is the
    growth factor playing the role of time and $$\lambda_1 \ge \lambda_2$$ are the
    eigenvalues of $$T_{ij} = \partial_i \partial_j \Phi$$ in the plane shown (the third
    axis, $$e_3$$, points out of the screen). Positive eigenvalue = compression along
    that eigenvector (arrows). Signs give the morphology of
    <a href="/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/">Appendix&nbsp;B2</a>:
    both positive → collapsing toward a <em>node</em>; mixed → one axis collapsing, one
    expanding — a <em>filament</em> cross-section; both negative → a <em>void</em>. Push
    $$D\lambda_1 \to 1$$ and the ellipse degenerates to a line: the first caustic — a
    Zel'dovich pancake — forms (§6). The readout tracks the density factor
    $$1/\prod(1-D\lambda_i)$$ in this plane, which diverges exactly at the caustic.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-tidal");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 520, H = 300, cx = 260, cy = 150, R0 = 92;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const readout = document.getElementById("td-readout");

  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const l1 = +document.getElementById("td-l1").value / 100;
    const l2 = +document.getElementById("td-l2").value / 100;
    const D = +document.getElementById("td-D").value / 100;
    const a1 = 1 - D * l1, a2 = 1 - D * l2;          // axis scale factors
    // morphology decisions use the ordered eigenvalues, so the labels stay
    // correct even when the sliders are set with λ₂ > λ₁
    const lmax = Math.max(l1, l2), lmin = Math.min(l1, l2);
    const caustic = Math.min(a1, a2) <= 0.025;
    const s1 = Math.max(a1, 0.02), s2 = Math.max(a2, 0.02);

    // initial ring (ghost)
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: R0, fill: "none",
      stroke: "#cbd5e0", "stroke-width": 1.4, "stroke-dasharray": "4,4" }));
    // deformed ring: x scaled by s1 (e1 horizontal), y by s2 (e2 vertical)
    svg.appendChild(el("ellipse", { cx: cx, cy: cy, rx: R0 * s1, ry: R0 * s2,
      fill: "#e8f0fe", "fill-opacity": 0.65,
      stroke: caustic ? "#c53030" : "#1565c0", "stroke-width": 2.6 }));
    // particles on the ring
    for (let i = 0; i < 16; i++) {
      const u = i * Math.PI / 8;
      svg.appendChild(el("circle", { cx: cx + R0 * s1 * Math.cos(u),
        cy: cy - R0 * s2 * Math.sin(u), r: 2.6, fill: caustic ? "#c53030" : "#1565c0" }));
    }
    // eigenvector arrows: inward if compressing (λ>0), outward if expanding
    const arr = (dx, dy, lam, color, label, lx, ly) => {
      const L = 26, off = R0 * (dx ? s1 : s2) + 14;
      const sgn = lam >= 0 ? -1 : 1;                  // inward for compression
      [[1, 1], [-1, -1]].forEach(([sx]) => {
        const bx = cx + (dx ? sx * off : 0), by = cy - (dy ? sx * off : 0);
        const ex = bx + (dx ? sx * sgn * L : 0), ey = by - (dy ? sx * sgn * L : 0);
        svg.appendChild(el("line", { x1: bx, y1: by, x2: ex, y2: ey,
          stroke: color, "stroke-width": 2.4 }));
        const ang = Math.atan2(ey - by, ex - bx);
        [0.5, -0.5].forEach(s => svg.appendChild(el("line", { x1: ex, y1: ey,
          x2: ex - 6 * Math.cos(ang + s), y2: ey - 6 * Math.sin(ang + s),
          stroke: color, "stroke-width": 2.4 })));
      });
      svg.appendChild(el("text", { x: lx, y: ly, "font-size": 12, "font-weight": 600,
        fill: color, "font-family": SANS }, label));
    };
    arr(1, 0, l1, "#1565c0", "e₁  (λ₁ = " + l1.toFixed(2) + ")", cx + R0 * s1 + 44, cy - 8);
    arr(0, 1, l2, "#2f855a", "e₂  (λ₂ = " + l2.toFixed(2) + ")", cx + 8, cy - R0 * s2 - 44);

    // morphology by signs (B2 classification, this plane; e3 out of screen)
    let morph;
    if (caustic) morph = "<strong style='color:#c53030'>caustic! an axis has collapsed — a Zel'dovich pancake forms</strong>";
    else if (lmin > 0) morph = "both axes collapsing → <strong>node-forming</strong> region";
    else if (lmax > 0) morph = "one axis collapsing, one expanding → <strong>filament</strong> cross-section (axis = e₃, out of screen)";
    else morph = "both axes expanding → <strong>void</strong>";
    const dens = 1 / (s1 * s2);
    readout.innerHTML = morph +
      "<br><span style='color:#777'>axis factors (1−Dλ): " + a1.toFixed(2) + ", " + a2.toFixed(2) +
      " &nbsp;·&nbsp; density factor 1/∏(1−Dλ) ≈ <strong>" + (dens > 200 ? "∞" : dens.toFixed(1)) + "</strong></span>";
  }
  ["td-l1", "td-l2", "td-D"].forEach(id =>
    document.getElementById(id).addEventListener("input", render));
  render();
})();
</script>

<div class="l-body" markdown="1">

## Filaments: free fall until the map folds

With the tidal dictionary in hand, the web's own theory — the one running underneath
[Appendix B1](/mathematics/2026/07/06/cosmic-web-B1-transport-models/)'s transport
models — reads as a chapter of the same geometry.

### Zel'dovich: geodesics with a frozen tide

The **Zel'dovich approximation** (1970) moves matter from its initial (Lagrangian)
position $$\mathbf{q}$$ to its evolved position by a displacement that never updates:

$$\mathbf{x}(\mathbf{q}, t) \;=\; \mathbf{q} \;-\; D(t)\, \nabla_{q} \Phi^{(1)}(\mathbf{q}),$$

with $$D(t)$$ the linear growth factor[^growth] serving as the clock and
$$\Phi^{(1)}$$ the (suitably scaled) initial potential. In growth-factor time this is
**free flight**: each parcel receives one initial push $$-\nabla\Phi^{(1)}$$ from the
primordial potential and then coasts on a straight ray — the ballistic transport of
Appendix B1, now recognisable as the first-order statement of *geodesic motion in the
perturbed spacetime*, with the tide frozen at its initial value. The whole map is one
gradient flow; everything that happens next is differential geometry of that map.

### The deformation tensor: the tide decides the shape

How does a small blob of matter deform under this map? Differentiate:

$$\frac{\partial x_i}{\partial q_j} \;=\; \delta_{ij} \;-\; D(t)\, T_{ij}(\mathbf{q}),
\qquad T_{ij} = \frac{\partial^2 \Phi^{(1)}}{\partial q_i \,\partial q_j},$$

the identity minus growth times — the tidal tensor again. In its eigenframe the map is
diagonal: an initial cube becomes a brick with edge factors $$(1 - D\lambda_1)$$,
$$(1 - D\lambda_2)$$, $$(1 - D\lambda_3)$$, and mass conservation gives the density in
closed form:

$$\frac{\rho}{\bar\rho} \;=\;
\frac{1}{(1 - D\lambda_1)(1 - D\lambda_2)(1 - D\lambda_3)} .$$

This one formula is the skeleton of large-scale structure. As $$D$$ grows, the axis
with the largest eigenvalue collapses first: at $$D\lambda_1 = 1$$ the brick flattens
to zero thickness along $$e_1$$ and the density diverges — a **pancake** (a wall of the
web) with normal $$e_1$$. Collapse along $$e_2$$ follows: the pancake drains into a
**filament** whose axis is $$e_3$$, the direction squeezed last — exactly the
eigenframe reading of Appendix B2 that our detectors exploited. Collapse of the third
axis makes a **node**; regions with all eigenvalues negative expand into **voids**. The
interactive tidal ellipsoid above plays this sequence in the $$(e_1, e_2)$$ plane.

### Caustics: where free fall folds

The divergence at $$D\lambda_1 = 1$$ is not a physical infinity — it is the signature
that the Lagrangian map $$\mathbf{q} \mapsto \mathbf{x}$$ has **folded**: three streams
of matter now pass through the same point, and the boundary where
$$\det(\partial \mathbf{x}/\partial \mathbf{q}) = 0$$ is a **caustic** — the same
mathematical object as the bright lines of focused light on the bottom of a coffee
cup.[^caustic-optics] Arnold, Shandarin and Zel'dovich (1982) classified the caustics
of these gravitational maps with **catastrophe theory**: generic folds ($$A_2$$) making
the walls, cusps ($$A_3$$) stiffening them into filament-like edges, swallowtails and
umbilics ($$A_4$$, $$D_4$$) decorating the nodes — a complete local taxonomy of the
web's skeleton, refined into the modern "caustic skeleton" of large-scale structure
(Feldbrugge, van de Weygaert et al. 2018).

Readers of the companion series will recognise the machinery: the *same* singularity
theory names the **Maxwell strata** and conjugate/caustic wavefronts of the
$$\mathrm{SE}(2)$$ shortest-path problem — where optimality forks on the group, matter
multi-streams in the universe. In both series, the load-bearing objects are not the
smooth solutions but the **singularities of a map built from a variational principle**:
the exponential map there, the gravitational Lagrangian map here.

After the fold, ballistic flight and reality part ways — Zel'dovich streams sail
through the caustic while real matter, bound by gravity, stays. The **adhesion model**
of Appendix B1 patches this with vanishing viscosity (Burgers' equation), gluing
streams at the caustics and preserving the skeleton. And this series' own measured
correction slots in precisely here: the
[transverse-damping model](/mathematics/2026/07/09/cosmic-web-B4-transverse-damping/)
found (E4–E5c, [Part&nbsp;2]({% post_url 2026-07-04-cosmic-web-two-models %})) that the
leading error of pure free flight is cured by damping $$\beta \approx 60\%$$ of the
velocity components **perpendicular to the local filament axis** — that is,
transversally *in the tidal eigenframe* — while leaving the along-axis flow untouched.
In the language of this post: the next-order effect of the real, un-frozen tide is a
partial arrest of exactly the motions that geodesic deviation squeezes, applied in the
eigenframe of $$E_{ij}$$. The empirical correction the program measured is a
tidal-tensor term.

### Where the geodesic language honestly stops

One refutation from the program belongs in this picture, because it sharpens it. The
theory question T1 asked whether filament spines are themselves *shortest paths* —
geodesics of some effective metric — and the answer was **no**
([Part&nbsp;1]({% post_url 2026-07-03-geometry-of-cosmic-web-research-program %})):
filaments are *pile-ups* of the flow, not paths of it. The Cartan/gauge reading of this
post is consistent with that verdict, and states it better: matter follows geodesics;
**filaments are the caustics of the geodesic flow** — the folds of the free-fall map,
organised by the tidal eigenframe. The web is not made of straightest lines; it is made
of the places where families of straightest lines *focus*. That is also why the caustic
machinery of the Seeing series (wavefronts, conjugate points) kept resurfacing here:
both projects study focusing, not paths.

## Where the Euclidean group sits — dial the speed of light

The figure below places the group of §2 in its family. The Euclidean group is the
**non-relativistic corner** of the spacetime symmetries: the limit where the speed of
light is infinite, so "now" is shared everywhere and space is just $$\mathrm{SE}(3)$$.
Slide $$c$$ down and the light cone tilts shut, passing through Minkowski (finite
$$c$$) on the way to the **Carroll** limit ($$c \to 0$$), where the cone closes
completely — the geometry of a black-hole horizon. Each corner, gauged by the recipe of
§4, gives a theory of gravity.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-cone">
  <div style="text-align:center; margin-bottom:0.7em; font-family:'Source Sans 3', sans-serif; font-size:13px; color:#555;">
    <span style="color:#2f855a; font-weight:600;">space (c → ∞)</span>
    <input type="range" id="cone-c" min="0" max="100" value="6" style="width:230px; vertical-align:middle; margin:0 10px; accent-color:#1565c0;">
    <span style="color:#c53030; font-weight:600;">horizon (c → 0)</span>
  </div>
  <div id="cw-cone" style="text-align:center;"></div>
  <div id="cone-readout" style="text-align:center; font-family:'Source Sans 3', sans-serif; font-size:13.5px; color:#333; margin-top:10px; min-height:2.6em;"></div>
  <figcaption>
    <strong>One family, dialed by the speed of light.</strong> The wedge is the set of
    events a signal can reach from the centre — the future "light cone". At left
    (<em>c</em> → ∞) it opens flat: you can reach anywhere <em>now</em>, time is absolute,
    and space is the Euclidean group $$\mathrm{SE}(3)$$ — the geometry this series used.
    In the middle (finite <em>c</em>) it is the 45° Minkowski cone of special relativity,
    symmetry group Poincaré. At right (<em>c</em> → 0) it closes onto the time axis — the
    <em>Carroll</em> limit, the intrinsic geometry of a black-hole horizon. Gauging each
    corner gives a theory of gravity: Newton–Cartan (strictly, one gauges the
    <em>Bargmann</em> central extension of the Galilei group), Einstein(–Cartan), and
    Carrollian respectively. Your Euclidean symmetries are the <em>c</em> → ∞ face of the same object
    that curves into gravity.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-cone");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const W = 520, H = 300, cx = 260, cy = 165, R = 128;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "520px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const readout = document.getElementById("cone-readout");
  const REGIMES = [
    { max: 33, name: "Galilei / Euclidean  (c → ∞)", grav: "gauge it → Newton–Cartan gravity",
      note: "Time is absolute; space is the Euclidean group SE(3) — the frame this series used." },
    { max: 67, name: "Poincaré / Minkowski  (finite c)", grav: "gauge it → Einstein(–Cartan) gravity",
      note: "The 45° light cone of special relativity; localising this symmetry is general relativity." },
    { max: 101, name: "Carroll  (c → 0)", grav: "gauge it → Carrollian gravity (horizons)",
      note: "The cone closes: no motion through space. This is the geometry of a black-hole horizon." }
  ];
  function render(s) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // half-angle of the future cone, measured from the vertical time axis:
    // wide (≈86°) at c→∞, 45° at Minkowski, thin (≈4°) at c→0.
    const theta = (86 - 0.82 * s) * Math.PI / 180;
    const dx = R * Math.sin(theta), dy = R * Math.cos(theta);
    // shaded future wedge
    svg.appendChild(el("path", { d: `M ${cx} ${cy} L ${cx - dx} ${cy - dy} A ${R} ${R} 0 0 1 ${cx + dx} ${cy - dy} Z`,
      fill: "#e8f0fe", stroke: "none" }));
    // space & time axes
    svg.appendChild(el("line", { x1: cx - R - 12, y1: cy, x2: cx + R + 12, y2: cy, stroke: "#bbb", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: cx, y1: cy + 40, x2: cx, y2: cy - R - 16, stroke: "#bbb", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: cx + R + 8, y: cy + 15, "font-size": 11, fill: "#999", "font-family": SANS }, "space"));
    svg.appendChild(el("text", { x: cx + 5, y: cy - R - 6, "font-size": 11, fill: "#999", "font-family": SANS }, "time"));
    // cone edges
    ["#1565c0", "#1565c0"].forEach((c, i) => {
      const sx = i ? dx : -dx;
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + sx, y2: cy - dy, stroke: c, "stroke-width": 2.5 }));
    });
    // the point
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: 4, fill: "#111" }));
    // regime label on the figure
    const reg = REGIMES.find(r => s < r.max);
    svg.appendChild(el("text", { x: cx, y: cy - dy - 8 < 22 ? 16 : cy - dy - 8, "text-anchor": "middle",
      "font-size": 12.5, "font-weight": 700, fill: "#1565c0", "font-family": SANS }, reg.name));
    readout.innerHTML = "<strong>" + reg.name + "</strong> &nbsp;·&nbsp; " + reg.grav + "<br><span style='color:#777'>" + reg.note + "</span>";
  }
  const slider = document.getElementById("cone-c");
  slider.addEventListener("input", () => render(+slider.value));
  render(+slider.value);
})();
</script>

<div class="l-body" markdown="1">

## Does any of this change Einstein's equations?

**Standard general relativity: no.** Set torsion to zero and the whole gauge/Cartan
construction reproduces Einstein's equations exactly. It is a re-reading, not a rewrite.

**Einstein–Cartan: minimally, yes.** Keep the rotational piece honest and the spin of
matter sources torsion through a *second* equation. Because that equation is algebraic —
torsion does not propagate on its own — it vanishes wherever spin density vanishes, so
ordinary space, the Solar System, and all current tests are untouched. Corrections switch
on only at colossal spin density — the early Universe, neutron-star cores — where they act
as an effective repulsion that can replace the Big-Bang singularity with a **bounce**
(Popławski's scenario).

**The honest status.** Torsion has never been detected; laboratory and astrophysical
searches (spin-polarised matter, Lorentz/torsion-coupling constraint tables) bound
specific couplings without seeing anything. Versions in which torsion *propagates* are
further constrained — among other things by the absence of extra gravitational-wave
polarisations in current observations. The
unification here is therefore **conceptual and classical**: it says gravity and the
geometry of this series are the same kind of object, and it extends Einstein's equations
by a term that is, so far, a whisper — loud only where the cosmic web itself was born.

## One blueprint, three geometries

The synthesis the series has been building, in one table:

| | **Visual cortex** (Seeing series) | **Cosmic web** (this series) | **Gravity** |
|:---|:---|:---|:---|
| Base space | image plane $$\mathbb{R}^2$$ | comoving space $$\mathbb{R}^3$$ | spacetime $$M^4$$ |
| Symmetry group | $$\mathrm{SE}(2)$$ | $$\mathrm{SE}(3)$$ | Poincaré $$\mathrm{ISO}(3,1)$$ |
| Lifted / bundle space | $$\mathrm{SE}(2)$$ itself | $$\mathbb{R}^3{\times}S^2 = \mathrm{SE}(3)/\mathrm{SO}(2)$$ | frame bundle, connection $$(e, \hat\omega)$$ |
| Frame field from data | orientation columns of V1 | tidal eigenframe $$\{e_1,e_2,e_3\}$$ | tetrad $$e^a$$ |
| "Straightest" curves | SR geodesics (cuspidal; smooth face: elastica) | Zel'dovich rays (free fall, frozen tide) | geodesics |
| Governing tensor | pendulum curvature (elastica face: $$2k\,\mathrm{cn}$$) | tidal tensor $$T_{ij} = \partial_i\partial_j\Phi$$ | Riemann; electric part $$E_{ij}$$ |
| Where smoothness fails | Maxwell strata, conjugate caustics | pancake caustics, multi-stream folds | conjugate points, horizons |
| Singularity bookkeeping | Jacobi elliptic clock $$K(k^2)$$ (ties at $$4K$$, SR cut at $$2K$$) | catastrophes $$A_2, A_3, A_4, D_4$$ | focusing theorems |

Same blueprint each time: a homogeneous model, a frame at every point, a variational
flow along it, and the interesting physics concentrated on the *singular set* where the
flow's map folds.

## What is solid, what is active, what is open

- **Solid (textbook).** Gravity is the gauge theory of the local spacetime symmetry
  group; Cartan geometry is the common language of Riemannian geometry, the orientation
  lift, and general relativity (Sharpe 1997; Wise 2010; Blagojević & Hehl 2013).
  Zel'dovich transport, its caustic classification, and adhesion are the standard
  analytic theory of the web (Zel'dovich 1970; Arnold–Shandarin–Zel'dovich 1982;
  Shandarin & Zel'dovich 1989).
- **Active.** The **caustic skeleton** — using the catastrophe taxonomy as a practical
  web-finder in the tidal eigenframe — is a live research line (Feldbrugge, van de
  Weygaert et al. 2018). *Sub-Lorentzian* geometry — the sub-Riemannian construction
  with a Lorentzian metric on the allowed directions — is young and moving (Grochowski
  and others). Carrollian horizons are a live topic (Donnay & Marteau 2019).
- **Open, and close to home.** The exact $$\mathrm{SE}(2)$$ results of the Geometry of
  Seeing series — Maxwell strata, cut loci via elliptic functions — have sub-Lorentzian
  analogues on the relativistic cousins of $$\mathrm{SE}(2)$$ that, as far as I can
  tell, nobody has worked out. And in the other direction: whether the measured
  transverse-damping coefficient $$\beta$$ of this series can be *derived* — as the
  leading post-Zel'dovich tidal term in the eigenframe, rather than fit — is exactly the
  kind of question the dictionary of §5–6 makes well-posed.

## Glossary

- **Euclidean group** $$\mathrm{SE}(3) = \mathbb{R}^3 \rtimes \mathrm{SO}(3)$$ — rigid
  motions of space: rotations acting on translations in a semidirect product; equally,
  the bundle of oriented orthonormal frames of $$\mathbb{R}^3$$.
- **Semidirect product** — a product of two groups in which one acts on the other;
  the reason $$(R_2,\mathbf{t}_2)(R_1,\mathbf{t}_1) = (R_2R_1,\, R_2\mathbf{t}_1 + \mathbf{t}_2)$$.
- **Klein geometry** — a geometry presented as a symmetry group $$G$$ and a subgroup
  $$H$$ fixing a basepoint; the space is the homogeneous quotient $$G/H$$.
- **Cartan geometry** — a curved space modelled infinitesimally on a Klein geometry,
  with a connection comparing neighbouring model copies; contains Riemannian geometry,
  the orientation lift, and general relativity as instances.
- **Solder form / frame / tetrad** — the translational part $$e$$ of the Cartan
  connection: an orthonormal set of directions at each point, carrier of the metric.
- **Spin connection** — the rotational part $$\hat\omega$$: how the frame turns from
  point to point; its field strength is the curvature.
- **Torsion** — the translational field strength $$\Theta = de + \hat\omega \wedge e$$;
  failure of infinitesimal parallelograms to close; sourced by spin in Einstein–Cartan.
- **Holonomy** — the net rotation a vector acquires under parallel transport around a
  closed loop; curvature integrated over the enclosed area.
- **Anholonomy** — failure of a frame to be a coordinate basis; the same object as the
  sub-Riemannian bracket in Chow–Rashevskii, and the field strength of teleparallel
  gravity.
- **Geodesic deviation** — the relative acceleration of neighbouring free-fallers,
  $$D^2\xi/d\tau^2 = -R(u,\xi)u$$; the operational meaning of curvature.
- **Electric part of Riemann / tidal tensor** — $$E_{ij} = R_{i0j0}$$, in the Newtonian
  limit the potential's Hessian $$T_{ij} = \partial_i\partial_j\Phi$$; its eigenframe is
  the tidal frame of Appendix B2.
- **Zel'dovich approximation** — free flight in growth-factor time with the initial
  tide as the only push: $$\mathbf{x} = \mathbf{q} - D\,\nabla_q\Phi^{(1)}$$.
- **Deformation tensor** — $$\partial\mathbf{x}/\partial\mathbf{q} = \mathbb{1} - D\,T$$;
  its eigenvalue factors $$(1-D\lambda_i)$$ set the collapse sequence and the density
  $$1/\prod(1-D\lambda_i)$$.
- **Caustic / catastrophe** — the fold set of a Lagrangian map, where its Jacobian
  vanishes and streams cross; classified generically by catastrophe theory
  ($$A_2$$ folds, $$A_3$$ cusps, …); the walls and filaments of the web.
- **Einstein–Cartan theory** — general relativity plus torsion, from gauging the full
  Poincaré group; reduces to GR wherever spin density is zero.
- **Sub-Lorentzian geometry** — a Lorentzian metric on a bracket-generating
  distribution; the relativistic sibling of the sub-Riemannian geometry used throughout
  this series.
- **Carroll limit** — the $$c \to 0$$ contraction of Minkowski geometry; the light cone
  closes; the intrinsic geometry of null surfaces and black-hole horizons.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">

[^semidirect]: A product $$N \rtimes K$$ of two groups where the second acts on the first: elements are pairs, but composition twists the $$N$$-component by the $$K$$-action, $$(n_2,k_2)(n_1,k_1) = (n_2 \cdot k_2(n_1),\, k_2k_1)$$. For $$\mathrm{SE}(3)$$: rotations act on translation vectors by rotating them.

[^homogeneous]: A space on which a group acts transitively — any point can be moved to any other. Equivalently $$G/H$$ for $$H$$ the stabiliser of a basepoint; all points look alike because the group says so.

[^liealgebra]: The tangent space of a Lie group at the identity: the infinitesimal versions of the group's motions, with the commutator bracket $$[X,Y] = XY - YX$$ recording how little motions fail to commute. Appendix A1 of the Seeing series builds it from scratch for $$\mathrm{SE}(2)$$.

[^desitter]: Replace the flat model by de Sitter space (the maximally symmetric solution with cosmological constant $$\Lambda$$) and the "translations" no longer commute: $$[P_i, P_j] \propto \Lambda\, J_{ij}$$. The cosmological constant is, in Cartan language, the curvature you build into the *model itself* (MacDowell–Mansouri; Wise 2010).

[^forms]: A 1-form eats a direction and returns a number (here, an algebra element) — the right gadget for "what happens if I step this way". A 2-form eats a little parallelogram; that is why curvature and torsion, which measure loop defects, are 2-forms: $$d$$ and $$\wedge$$ assemble loop-answers from step-answers.

[^desitter2]: Two loose ends the construction also explains: the metric is *derived* (from $$e$$), not fundamental; and coupling fermions to gravity — which textbook GR does awkwardly — is automatic, since spinors talk to the tetrad and spin connection directly.

[^geodesic]: The curve a free particle follows: straightest possible, extremal proper time. In Cartan's rolling picture, the development of a straight line of the flat model.

[^growth]: The factor $$D(t)$$ by which small density fluctuations grow in linear theory; using it as the time variable absorbs the cosmic expansion so that Zel'dovich motion is uniform and straight. See Appendix B1.

[^caustic-optics]: The optical analogy is exact, not decorative: light rays are geodesics of an effective metric, the bright curves are where the ray map folds, and the classification of stable fold shapes (fold, cusp, swallowtail…) is the same Arnold catastrophe list that organises the web's walls and filament edges.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>F. Klein (1872). "Vergleichende Betrachtungen über neuere geometrische Forschungen" (the Erlangen Program). <em>Math. Ann.</em> 43 (1893), 63–100.</li>
  <li>É. Cartan (1923). "Sur les variétés à connexion affine et la théorie de la relativité généralisée." <em>Ann. Sci. ENS</em> 40, 325–412.</li>
  <li>R. Utiyama (1956). "Invariant theoretical interpretation of interaction." <em>Phys. Rev.</em> 101, 1597–1607.</li>
  <li>T. W. B. Kibble (1961). "Lorentz invariance and the gravitational field." <em>J. Math. Phys.</em> 2, 212–221.</li>
  <li>D. W. Sciama (1962). "On the analogy between charge and spin in general relativity." In <em>Recent Developments in General Relativity</em>, Pergamon, 415–439.</li>
  <li>Ya. B. Zel'dovich (1970). "Gravitational instability: an approximate theory for large density perturbations." <em>Astron. Astrophys.</em> 5, 84–89.</li>
  <li>F. W. Hehl, P. von der Heyde, G. D. Kerlick &amp; J. M. Nester (1976). "General relativity with spin and torsion: foundations and prospects." <em>Rev. Mod. Phys.</em> 48, 393–416.</li>
  <li>V. I. Arnold, S. F. Shandarin &amp; Ya. B. Zel'dovich (1982). "The large scale structure of the universe I: general properties; one- and two-dimensional models." <em>Geophys. Astrophys. Fluid Dyn.</em> 20, 111–130.</li>
  <li>S. F. Shandarin &amp; Ya. B. Zel'dovich (1989). "The large-scale structure of the universe: turbulence, intermittency, structures in a self-gravitating medium." <em>Rev. Mod. Phys.</em> 61, 185–220.</li>
  <li>R. M. Wald (1984). <em>General Relativity.</em> University of Chicago Press. §3.3 (geodesic deviation), §4.4 (Newtonian limit).</li>
  <li>R. W. Sharpe (1997). <em>Differential Geometry: Cartan's Generalization of Klein's Erlangen Program.</em> Springer GTM 166.</li>
  <li>D. K. Wise (2010). "MacDowell–Mansouri gravity and Cartan geometry." <em>Class. Quantum Grav.</em> 27, 155010. <a href="https://arxiv.org/abs/gr-qc/0611154">arXiv:gr-qc/0611154</a>.</li>
  <li>M. Blagojević &amp; F. W. Hehl, eds. (2013). <em>Gauge Theories of Gravitation: A Reader with Commentaries.</em> Imperial College Press. <a href="https://arxiv.org/abs/1210.3775">arXiv:1210.3775</a>.</li>
  <li>J. Feldbrugge, R. van de Weygaert, J. Hidding &amp; J. Feldbrugge (2018). "Caustic skeleton &amp; cosmic web." <em>JCAP</em> 05, 027. <a href="https://arxiv.org/abs/1703.09598">arXiv:1703.09598</a>.</li>
  <li>M. Grochowski (2006). "Geodesics in the sub-Lorentzian geometry." <em>Bull. Polish Acad. Sci. Math.</em> 54, 271–287.</li>
  <li>L. Donnay &amp; C. Marteau (2019). "Carrollian physics at the black hole horizon." <em>Class. Quantum Grav.</em> 36, 165002. <a href="https://arxiv.org/abs/1903.09654">arXiv:1903.09654</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
