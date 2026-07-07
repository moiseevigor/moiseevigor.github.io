---
layout: distill
title: "Two Ways to See a Cosmic Filament"
subtitle: >
  Galaxies trace an invisible web of filaments across the Universe. We taught
  a computer two ways of seeing it — one borrowed from how your own visual
  cortex completes broken contours — and raced them on worlds where the answer
  is known. The race had a surprise winner, a flaw in our own scoring that
  briefly crowned the wrong one, and an ending nobody planned: a small new
  physics rule that predicts where matter goes nearly as well as theoretically
  possible.
date: 2026-07-04 09:00:00
categories: [mathematics]
tags: [cosmic-web, sub-riemannian, SE3, filaments, data-analysis]
image: /public/img/posts/cosmic-web-2.svg
description: >
  A benchmark study of two filament detectors — the standard curvature
  (Hessian) detector and an orientation lift adapted from models of the visual
  cortex — told for a general reader, with interactive figures built from the
  actual experiment data: the three levels of reality the tests run on, where
  each method works and fails, a scoring flaw and its correction, and the
  transverse-damping transport rule the program distilled at the end.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: 2
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">How to read this article</div>
This is the <em>results</em> half of a research program — its plan, hypotheses,
and pre-registered kill-criteria are in
<a href="{% post_url 2026-07-03-geometry-of-cosmic-web-research-program %}">Part 1</a>;
this post is what happened when it ran. The question: can the mathematics your
visual cortex uses to complete broken contours — developed in the
<a href="{% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %}">Geometry
of Seeing</a> series — find the <em>filaments of the cosmic web</em>? The main
text tells that story in plain language. Every technical term gets a short
footnote the first time it appears, and the full machinery lives in five
appendices linked where relevant: the transport models of cosmology
(<a href="/mathematics/2026/07/06/cosmic-web-B1-transport-models/">B1</a>),
the tidal frame that gives the web its directions
(<a href="/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/">B2</a>),
how to race two methods without rigging the race
(<a href="/mathematics/2026/07/08/cosmic-web-B3-honest-benchmarks/">B3</a>),
the transport rule this program produced
(<a href="/mathematics/2026/07/09/cosmic-web-B4-transverse-damping/">B4</a>),
and how to read hot-gas maps of the sky
(<a href="/mathematics/2026/07/10/cosmic-web-B5-reading-gas-maps/">B5</a>).
Every number comes from the experiment data in the repository
(<code>research/cosmic-web/</code>); nothing is illustrative.
</div>

## The problem

You are handed a box of points — galaxies — and told that most of them
scatter around an invisible network of curves with branch points, while the
rest are clutter. Recover the network. This is the observational situation in
cosmology: gravity organises matter into **filaments** of width a few
megaparsecs[^megaparsec], and galaxy surveys sample this web sparsely and noisily.

Your visual system solves a two-dimensional version of this instantly: a
dashed line reads as *one line*, because the cortex pools evidence from
collinear fragments. The mathematical mechanism, developed in the series, is
a **lift**: instead of working on the image plane $$\mathbb{R}^2$$, the cortex
represents position *and* orientation, $$\mathbb{R}^2 \times S^1$$. The
question here is whether the 3D version of that trick,

$$
\mathbb{R}^3 \times S^2 \;\cong\; \mathrm{SE}(3)/\mathrm{SO}(2),
$$

buys anything for cosmic filaments — and, more ambitiously, whether the
geometry is not just a detector but part of the *physics*.

## Three levels of reality

There is a problem with testing anything on the real sky: nobody has the
answer key. No catalogue says where the true filaments are — the true
network is exactly what everyone is trying to find. So this study, like most
of cosmology, works on a ladder of three worlds, each one a controlled model
of the one above it.

At the top sits the **real sky**: a slice of the BOSS galaxy survey, every
dot a real galaxy, out to billions of light-years. You can already see the
clumps and strands by eye — but you cannot grade a method here, only check
that what it finds is physically real (we do that at the end, with maps of
hot gas).

One level down is a **gravity simulation**: start from the smooth infant
Universe, let gravity act on a couple of million mass points, and the same
web pattern emerges on its own. Here we know every particle's full history —
where it started, where it ended — so questions about *motion* have exact
answers, even though the filaments themselves are still nobody-said-so.

At the bottom is a **toy universe with the answers printed on it**: an
invented network of curves, with fake galaxies sprinkled along it and
clutter added. It is the least realistic world and the only one where
"completely right" is a checkable statement — so this is where the race
between the two methods is scored.

Every claim in this article was tested at the bottom of this ladder first,
then walked upward as far as it survived.

</div><!-- /.l-body -->

<figure class="l-middle">
  <img src="/public/img/posts/cosmic-web/three_universes.png"
       alt="Three panels: top, a fan-shaped slice of the BOSS galaxy survey with each dot a real galaxy; bottom left, the web-like density field of a 2.1-million-particle gravity simulation; bottom right, a synthetic Voronoi web with the exact true filaments drawn in red"
       style="width:100%; border:1px solid #ddd; border-radius:4px;">
  <figcaption>
    <strong>The three worlds the experiments run on.</strong> Top: one thin
    slice of the real sky (BOSS survey; Earth sits at the bottom tip of the
    fan) — real, but with no answer key. Bottom left: a gravity simulation —
    the web emerges by itself, and every particle's history is known.
    Bottom right: a synthetic toy where the true filament network (red) is
    known exactly, so methods can be graded. Realism decreases downward;
    control increases.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The two models

Both start identically: blur the galaxy points into a smooth density map, so
that instead of isolated dots there is a landscape with hills where galaxies
crowd and plains where they don't. They differ in how they ask "is there a
filament through this point?"

**Model 1 — the mountain-ridge reading (the Hessian baseline).** Walking
along a mountain ridge, the ground falls away steeply to both sides and
stays level ahead. A filament is the same shape in the density landscape.
Model 1 measures, at every point, how the density curves in each direction —
the mathematical object holding those curvatures is the **Hessian
matrix**[^hessian] — and calls "filament" wherever the landscape drops
steeply in two directions and stays flat along the third[^hessian-score].
This is the workhorse of the field (the standard MMF and NEXUS filament
finders are refinements of it). It has one structural limit: its direction
reading comes from a single quadratic form, which is like judging direction
through permanently blurred glasses — the response has angular
bandwidth 2[^angular-bandwidth] and *cannot be made sharper*, no matter how
clean the data.

**Model 2 — the searchlight reading (the SE(3) orientation lift).** Instead
of one blurred direction estimate per point, measure every direction
separately: slide a long, thin, cigar-shaped filter over the data and record
how strongly it responds when aligned this way, that way, every way (we
sample 42 axes)[^lift-formula]. The result no longer lives in ordinary space
but on $$\mathbb{R}^3 \times S^2$$ — position *and* direction — and its
directional sharpness grows with the cigar's length: a knob the Hessian
simply does not have. This is the 3D version of what the visual cortex does
with contours. The theory also offers a second ingredient — a
**hypoelliptic diffusion**[^hypoelliptic] on the lifted space that lets
evidence flow along hypothesised curves (the contour-completion mechanism
of the visual cortex) — remember this one; its fate below is an honest
surprise.

The figure below demonstrates the difference directly. A dashed curve of
points sits in uniform clutter. One oriented filter (the ellipse) is placed
on the curve and rotated through all directions; the panel on the right
records its response at each angle. Increasing the filter length sharpens
its directional selectivity; the grey lobe shows the sharpest response a
quadratic (Hessian-type) model can express regardless of the data.

[^megaparsec]: One megaparsec (Mpc) is about 3.26 million light-years. Cosmologists often quote distances in h⁻¹Mpc, where $$h \approx 0.7$$ encodes the measured expansion rate of the Universe; 1 h⁻¹Mpc is roughly 1.4 Mpc.

[^hessian]: The matrix of second derivatives of the density, recording how the density curves in every direction around a point; its eigenvalues are the curvatures along the three principal axes, and its eigenvectors are those axes.

[^hessian-score]: Precisely: with Hessian eigenvalues $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$, the ridge score is $$R_{\mathrm{hess}} = -\tfrac{1}{2}(\lambda_2+\lambda_3)_+$$ and the filament direction is the top eigenvector.

[^lift-formula]: Precisely, in Fourier space: $$U(\mathbf{x},\mathbf{n}) = \mathcal{F}^{-1}[\,\sigma_\perp^2 \vert\mathbf{k}_\perp\vert^2 e^{-\frac{1}{2}(\sigma_\parallel^2 k_\parallel^2 + \sigma_\perp^2 \vert\mathbf{k}_\perp\vert^2)} \hat{f}(\mathbf{k})]$$ — the transverse Laplacian of an $$\mathbf{n}$$-elongated Gaussian correlated with the density: large exactly on ridges aligned with $$\mathbf{n}$$. Sharpness grows with the aspect ratio $$\sigma_\parallel/\sigma_\perp$$; the final score at a point is $$\max_{\mathbf{n}} U$$.

[^angular-bandwidth]: A limit on how finely the response can vary as the probe direction rotates: bandwidth 2 means the response traces one broad bump around the circle of directions (like $$\cos^2$$) and can never form a narrower peak, however clean the data.

[^hypoelliptic]: A smoothing process that acts directly only along a few allowed directions — here, along the current orientation — yet eventually reaches all directions through combinations of the allowed moves (see Glossary).

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-cigar">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span class="cw-ctl">
      <button class="cw-btn" id="cig-play">pause</button>
      &nbsp; filter length:
      <input type="range" id="cig-aspect" min="1" max="6" step="0.25" value="1.5"
             style="vertical-align:middle; width:130px;">
      <span id="cig-aspect-val" style="display:inline-block; width:2.5em;">1.5×</span>
    </span>
  </div>
  <div id="cw-cigar"></div>
  <figcaption>
    <strong>Interactive.</strong> Left: a dashed curve of points (dark) in
    uniform clutter (light), with one oriented ridge filter (blue ellipse)
    rotating on the curve. Right: its response at every angle (blue lobe;
    live) against the sharpest response any quadratic/Hessian model can
    express (grey lobe — angular bandwidth 2, fixed by algebra, not by
    data). At filter length 1–1.5× the two are similar; stretch to 4–6× and
    the blue lobe narrows onto the true tangent while the grey one cannot.
    This extra angular sharpness is the entire advantage — and, as the
    benchmarks show, also the source of the lift's weaknesses at corners
    and junctions.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

**Fairness rules.** A race between methods is only as good as its rules.
Here, everything after the scoring step is *identical* for both models:
the same thresholding, the same skeletonisation[^skeletonisation], and —
crucially — both must draw the **same total length of curve**, so neither
can win just by drawing more. Each model gets the same small budget of
tuning attempts, locked in on one practice universe[^realization] before
the real scoring begins on 50 fresh ones. The race isolates exactly one
variable: blurred local curvature versus sharp oriented measurement. (Why
each of these rules exists, and what goes wrong without them, is
[Appendix B3](/mathematics/2026/07/08/cosmic-web-B3-honest-benchmarks/) —
one of them turns out to carry this whole article.)

## The test bed: universes with exact answers

The race is scored on the bottom rung of the ladder — the toy with the
answer key. The first experiment battery (E0) manufactures that truth:
seed points dropped in a box, their **Voronoi diagram**[^voronoi] computed,
and the *edges* of the Voronoi cells — the lines where three cell walls
meet — taken as the filament network. It is a classic cartoon of the cosmic
web, and geometrically honest about the thing filaments do that trips up
detectors: branch. One variant keeps the edges straight; a second bends
each into a smooth arc[^bezier]. Fake galaxies are then sprinkled along the
network with sideways scatter, extra clumps at the junctions, and 25% pure
clutter; both models get the identical blurred field.

Explore the raw material below — the same box, at four sampling densities
from "starved" (2,500 galaxies) to "saturated" (80,000). Red is the exact
truth; blue is each model's recovered skeleton.

[^skeletonisation]: Reducing a thick detected region to a centreline one grid cell wide — the "skeleton" of curves on which all scores are computed.

[^realization]: One random draw of a synthetic universe; the "seed" is the number that initialises the random generator, so each seed labels one reproducible test universe.

[^voronoi]: A division of space into cells, one per seed point, each cell containing everything closer to its own seed than to any other; the cells' walls and edges form a natural web-like network.

[^bezier]: A smooth curve steered by a few control points — the standard way computer graphics draws curved strokes.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-slices">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span class="cw-ctl">
      variant:
      <button class="cw-btn cw-var active" data-v="curved">curved</button><button class="cw-btn cw-var" data-v="straight">straight</button>
    </span>
    <span class="cw-ctl" style="margin-left:1.2em;">
      galaxies:
      <button class="cw-btn cw-lvl" data-n="1200">1.2k</button><button class="cw-btn cw-lvl active" data-n="2500">2.5k</button><button class="cw-btn cw-lvl" data-n="5000">5k</button><button class="cw-btn cw-lvl" data-n="20000">20k</button><button class="cw-btn cw-lvl" data-n="80000">80k</button>
    </span>
  </div>
  <img id="cw-slice-img" src="/public/img/posts/cosmic-web/slice_curved_2500.png"
       alt="6-voxel slab of a Voronoi-web galaxy field with exact truth curves in red and the skeletons recovered by the SE(3) lift and the Hessian baseline in blue, at the selected variant and sampling density"
       style="width:100%; border:1px solid #ddd; border-radius:4px;">
  <figcaption>
    <strong>Interactive.</strong> One 6-voxel slab of a 128³ test box (1 voxel
    = 1 h⁻¹Mpc). Left: input galaxy field with the exact truth (red). Middle:
    SE(3)-lift skeleton (blue). Right: Hessian skeleton (blue). At 1.2–2.5k
    galaxies both struggle in different ways — the lift draws smoother,
    longer strands, the Hessian hugs density clumps; at 80k both are
    near-perfect. Buttons switch the precomputed result images.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The result — and the evaluation flaw that preceded it

Fifty held-out random universes per variant, five sampling densities, three
scores: **completeness** (fraction of the true network within 2 voxels[^voxel] of the
estimate), **purity** (the converse), **junction F1** (branch-point recovery).

Before the verdict, the most instructive result of this study. The first
version of this benchmark showed the lift beating the Hessian by **+7
points of completeness** at sparse sampling, on 48 of 50 seeds, p ≈ 10⁻¹⁴[^pvalue].
That result was wrong, and the mechanism matters beyond this application.

The comparison requires both methods to output skeletons of **equal total
length**, because a longer skeleton covers more of the true network
regardless of quality. We enforced that constraint one step too early — on
an intermediate quantity from which each method then produced its final
skeleton — assuming the final lengths would match. They did not: at sparse
sampling the lift's skeletons came out about **19% longer** than the
Hessian's (1,468 vs 1,239 voxels). Most of its apparent advantage was extra
length, not extra accuracy. The flaw surfaced only when a later experiment
required enforcing the constraint on the final skeleton itself; re-running
the benchmark under the corrected procedure reversed the outcome. Every
figure below uses the corrected procedure.

The corrected verdict: **the Hessian matches or beats the lift at every
sampling density**. At the ultra-sparse end (1,200 galaxies) the two are
indistinguishable at our power (Δ = +0.004, p = 0.36 — a null result, not
proven equivalence); everywhere else the Hessian wins
completeness by 4–7 points on 50 of 50 seeds, and junction F1 with it.

<div class="callout">
<div class="callout-title">In plain words</div>
Imagine grading two students who each trace a river network on a map, where
the score is "how much of the true river did your tracing cover?" — and one
student was quietly allowed to draw a 19% longer line. On sparse data, more
line means more coverage, skill or not. Our scoring made exactly that
mistake, and the extra length masqueraded as a discovery with spectacular
statistics. Equalise the pencil, and the simpler method wins the race
almost everywhere. The full anatomy of this mistake — and the other ways a
method comparison can quietly rig itself — is
<a href="/mathematics/2026/07/08/cosmic-web-B3-honest-benchmarks/">Appendix B3</a>.
</div>

[^voxel]: One cell of the 3D grid a box is divided into — the three-dimensional analogue of a pixel. In these experiments one voxel corresponds to one h⁻¹Mpc.

[^pvalue]: The probability of seeing a difference at least this large by pure chance if the two methods were in fact equally good; smaller means less likely to be luck. Throughout, p comes from the Wilcoxon signed-rank test, which uses only the per-universe paired differences (see Glossary).

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-crossover">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span class="cw-ctl">metric:
      <button class="cw-btn cw-met active" data-m="C">completeness</button><button class="cw-btn cw-met" data-m="P">purity</button><button class="cw-btn cw-met" data-m="jF1">junction F1</button>
    </span>
    <span class="cw-ctl" style="margin-left:1.2em;">variant:
      <button class="cw-btn cw-cvar active" data-v="curved">curved</button><button class="cw-btn cw-cvar" data-v="straight">straight</button>
    </span>
  </div>
  <div id="cw-crossover"></div>
  <figcaption>
    <strong>Interactive.</strong> Mean score vs. galaxies per box (log axis),
    50 held-out seeds, skeleton length now genuinely matched. Blue: SE(3)
    lift; orange: Hessian. Hover for values. The Hessian curve sits on or
    above the lift's at every density; the gap closes to a tie only at the
    ultra-sparse end. Junction F1 (third toggle) is where both models are
    weakest overall.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

Averages can hide variation between realizations, so the next figure shows
every seed: each dot is one test universe, plotted by the *paired
difference* (lift − Hessian) on that realization. Above the zero line, the
lift won that universe. Under the corrected procedure the clouds sit at
zero for 1.2k galaxies and below zero everywhere else. Note that the flawed
procedure produced a +0.07 cloud that looked equally decisive in the other
direction — statistical strength does not certify that a comparison was
constructed correctly.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-deltas">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span class="cw-ctl">metric:
      <button class="cw-btn cw-dmet active" data-m="dC">Δ completeness</button><button class="cw-btn cw-dmet" data-m="djF1">Δ junction F1</button>
    </span>
    <span class="cw-ctl" style="margin-left:1.2em;">variant:
      <button class="cw-btn cw-dvar active" data-v="curved">curved</button><button class="cw-btn cw-dvar" data-v="straight">straight</button>
    </span>
  </div>
  <div id="cw-deltas"></div>
  <figcaption>
    <strong>Interactive.</strong> Per-seed paired differences (positive =
    lift wins), 50 dots per column, with the per-column mean (bar) and win
    count. At 1.2k galaxies the cloud straddles zero (statistical tie,
    p ≈ 0.4); from 2.5k upward it sits entirely below zero — the Hessian
    wins on 50/50 seeds, Wilcoxon p ≈ 10⁻¹⁵. Junction F1 favours the
    Hessian at essentially all levels.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

**Why the intuition failed.** The dashed-line argument — that integrating
along a hypothesised curve pools evidence sparse data cannot supply locally —
is real, and it is why the *unmatched* benchmark looked so good. But the
elongated window pays for that pooling: it rounds corners, overshoots
endpoints, displaces spines from winding crests, and blurs junctions. Once
skeleton length is genuinely equal, those costs eat the pooling gain almost
exactly; the residue is a tie in a narrow ultra-sparse band (800–1,200
galaxies) — and pushing sparser still (400–600), the Hessian wins *again*
(−0.02, p ≈ 0.003): below a floor, the long window mostly integrates noise.
A useful way to say it: the lift buys *smoothness and connectivity*, the
Hessian buys *positional accuracy* — and on these benchmarks, positional
accuracy is what the scores reward at every density.

## Where each model fails

**Failure 1 — the lift at junctions.** Orientation-selective measurement is
weakest exactly where direction is ill-defined: at branch points the cigar
averages across the corner. With node clumps removed from the toy (junctions
implied only by filament continuity), the Hessian wins junction F1 by
0.04–0.05 (p ≈ 10⁻⁴). If your science is about *nodes*, the lift is the
wrong tool.

**Failure 2 — the diffusion surprise.** The vision theory's second ingredient,
hypoelliptic diffusion (smooth strongly along $$\mathbf{n}$$, weakly across and
in orientation — the contour-completion flow), was swept over three bend
levels up to 50% sag, three sparsity levels, weak and strong settings, with
scoring binned by local curve curvature. Strong diffusion **loses
everywhere** (−0.06 to −0.12, p ≈ 2×10⁻⁶), including the most-curved third of
the network where it was most expected to help; weak diffusion is neutral to
harmful at ordinary sparsity and buys a whisper (+0.01, p = 0.03) only at the
ultra-sparse level. Essentially all of the lift's power is in the
sharp oriented measurement, not in evidence propagation. (The "your
numerics were too crude" objection was tested and closed: a finer,
provably convergent implementation[^trotter] reproduces the result. The
verdict is about the idea, not the code.)

**Failure 3 — gravity-shaped webs (with one nuance).** Real filaments are
not tubes. On gravity-evolved boxes, scored by a method-neutral criterion —
*which model's spines capture more mass at equal length* — the toy advantage
does not transfer. On Zel'dovich fields[^zeldovich] (winding, ribbon-like structures)
the Hessian wins at every sampling density and every filter scale tried
(p ≤ 0.001). On full N-body fields[^nbody] the verdict softens but does not flip:
long cigars still lose badly (−0.05), while the *shortest* filter
(σ∥ = 3 vox) closes to a statistical tie at sparse sampling (−0.005,
p = 0.55) and a small deficit when dense. Toggle the figure below between
the two field types: the lift never actually leads on gravity-shaped mass,
and its best case is "as good as the simpler model".

[^trotter]: An 8-step Trotter splitting at equal total diffusion, which converges to the true left-invariant semigroup on the lifted space; it reproduces the coarse result at both sparsity levels.

[^zeldovich]: Density fields evolved with the Zel'dovich approximation: matter coasts along straight lines set by the initial gravity field. It captures the first stage of collapse, when matter flattens into sheet-like "pancakes" (see Glossary).

[^nbody]: Fields from a simulation that follows many mass points evolving under their mutual gravity; "PM" (particle-mesh) means the gravity is computed on a grid at each step for speed.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-e1b">
  <div style="text-align:center; margin-bottom:0.4em;">
    <span class="cw-ctl" id="cw-e1b-toggle-wrap">field type:
      <button class="cw-btn cw-e1b active" data-t="sigpar">Zel'dovich</button><button class="cw-btn cw-e1b" data-t="pm">N-body (PM)</button>
    </span>
  </div>
  <div id="cw-e1b"></div>
  <figcaption>
    <strong>Interactive.</strong> Filament-band mass coverage (fraction of
    particles in intermediate-density environments within 3 voxels of the
    spine network) at matched spine length, on gravity-shaped fields.
    σ∥ = 3, 4.5, 6 are the lift at three cigar lengths. The Hessian leads or
    ties at both sampling densities and every scale (the σ∥ = 3, 5k case is a
    statistical tie) — the honest negative that keeps the toy result in its
    lane.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

**Failure 4 — the physics claim.** The ambitious version of the program said
the lifted geometry isn't just a detector: matter *transport* should follow
sub-Riemannian geodesics that are cheap along the filament axis. That
predicts trajectories' deviations from straight-line motion should point
*along* filaments. We ran N-body simulations and measured exactly that, for
200,000 tracked particles.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-e2">
  <div id="cw-e2"></div>
  <figcaption>
    <strong>Interactive (hover).</strong> The dynamical test. For particles
    binned by distance to the nearest filament spine: P2 = squared projection
    of each trajectory's deviation-from-chord onto the filament axis
    (isotropic null 1/3, dashed). Far from filaments P2 ≈ 0.21 —
    deviations are strongly <em>perpendicular</em>: transverse pancake
    infall, the mechanism that builds filaments, and the opposite of
    along-axis geodesic transport. Only within ~4 voxels of a spine does the
    signal turn weakly parallel (0.364). Bars show the mean deviation
    magnitude — nearly all nonlinear transport happens at the web.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The verdict is blunt: **filaments are *built* by matter falling across them.**
The along-filament drainage toward nodes — the standard picture's "highway"
role — is real and shows in our own numbers (⟨\|v̂·e₃\|⟩ ≈ 0.54–0.57 against a
0.5 null, and P2 = 0.364 against ⅓ inside spines), but it is weak at our
1 h⁻¹Mpc resolution and it is not what *builds* the wall: that is transverse
infall, from both sides. The lifted
geometry survives only as a *static descriptor* — spine tangents from the
lift align with the tidal eigenframe[^tidal-eigenframe] (the local set of
axes gravity itself defines — [Appendix B2](/mathematics/2026/07/07/cosmic-web-B2-tidal-frame/))
at 0.73–0.76 versus the Hessian's 0.67 (isotropic null 0.5), without ever
being shown the tidal field — but the geodesic *transport* story is refuted
in the bulk, with a weak, sign-correct residual for matter already captured
inside filament tubes.

## A real-Universe coda

One rung of the ladder remains: the real sky. There is still no answer key
there — but there is something almost as good. Filaments should contain hot
gas, and hot gas leaves a faint, measurable imprint on the relic light of
the Big Bang as it passes through. So if the webs our methods draw are real,
the sky should be slightly "hotter" along them than elsewhere. That imprint
is measured in **Compton-y maps** (how such maps are made and what can fake
a signal in them is
[Appendix B5](/mathematics/2026/07/10/cosmic-web-B5-reading-gas-maps/)).

The final experiment left simulations behind: 274,000 real BOSS
CMASS galaxies[^boss] (z = 0.45–0.55)[^redshift] tiled into eighteen 512 h⁻¹Mpc tiles (the
redshift shell is ~250 h⁻¹Mpc deep, so radially they are slabs, not cubes), spines
extracted by both methods at matched length, and the networks stacked
against Planck maps[^planck-act] with footprint-matched rotated controls. Three things
happened. First, a **Compton-y detection**[^compton-y] — rising to **~9σ** under the
strictest controls (nulls matched to the spine points' galactic-latitude
distribution): the extracted spine networks sit on measurably hot gas, so
the web the methods draw is physically real. Follow-up tests showed that
signal is carried mostly by the gas of the survey galaxies' own halos —
but a closing experiment — stacking 876,000 close galaxy *pairs* with an
estimator that cancels any symmetric halo by construction, then holding
it to jackknife errors[^jackknife] and physically-unconnected control pairs — found
the gas **between** the halos at an amplitude of ~1.2–1.4×10⁻⁸,
consistent between ACT and Planck and with published measurements,
at ≈2σ per instrument: honest evidence for the filament bridges,
reproducing the field's amplitude rather than claiming a new detection.
The figure below shows that trajectory of the claim explicitly — the same
measurement under progressively stricter controls. Second, the Hessian's spines carry more of the spine-stack signal
than the lift's on every statistic, consistent with everything above. Third — and this is the
lift's one clean win, replicated from simulation to sky — its spine
tangents align with the tidal eigenframe at 0.677 ± 0.016 vs the Hessian's
0.617 ± 0.016 across all eighteen tiles (isotropic null 0.5). The lifted
geometry reads the *anisotropy* of the real cosmic web better, even while
the simpler model finds its mass better.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-claims">
  <div id="cw-claims"></div>
  <figcaption>
    <strong>The same measurement under stricter controls.</strong> The
    inter-galaxy bridge signal (gas between close galaxy pairs), as a
    significance, for both instruments: first with naive per-pair errors,
    then with sky-patch jackknife errors (pairs overlap on the sky), then
    after subtracting physically-unconnected control pairs (same geometry,
    no possible bridge). Planck's large drop at the last step is measured
    beam leakage; what survives on both instruments — about two sigma at
    an amplitude near 10⁻⁸ — is the honest bridge evidence.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The correction, measured

The refutations left a constructive question: if matter does not travel
along filament-aligned geodesics, what correction *does* standard
transport need? Cosmology's workhorse shortcut — the **Zel'dovich
model** — predicts where matter ends up by sending every parcel along a
straight line set by the initial conditions, no further gravity computed.
It is startlingly good for something so simple, and it fails in a specific
way: it lets matter coast *through* the walls and filaments that real
gravity would have stopped it at. (The full family of these fast transport
models, from 1970 to the modern ones, is
[Appendix B1](/mathematics/2026/07/06/cosmic-web-B1-transport-models/).)
Our simulations use exactly the same initial conditions, so for every particle we can
subtract the model's prediction from the truth and examine the **residual
directly**: the adjustment term itself.

The result reverses the original conjecture's orientation while
confirming its spirit. The residual is large near the web (RMS ≈ 4.4
h⁻¹Mpc per particle along the filament axis alone; ≈ 8 h⁻¹Mpc in full 3D)
and it *is* organized by the local tidal frame — but
it points **across** the filament axis, not along it, at every distance.
Physically: straight-line transport overshoots *through* forming walls
and filaments; real gravity arrests that crossing. The correction the
standard model needs is transverse braking at the web, not longitudinal
flow along it.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-e4">
  <div id="cw-e4"></div>
  <figcaption>
    <strong>Direction of the correction.</strong> For each tracked
    particle, the residual (true minus Zel'dovich position, and true minus
    Zel'dovich velocity) is projected onto the local filament axis; the
    curve shows the mean squared projection by distance to the web. An
    isotropic correction would sit on the dashed line (1/3). Everywhere
    below it: the correction is preferentially <em>perpendicular</em> to
    filaments, most strongly far from the web, approaching isotropy inside
    the tubes where motion is virialized.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## From correction to model, to the bound

A measured correction invites a model. The candidate is one rule added to
Zel'dovich's straight lines: *the first time a particle crashes into a
dense region, take away most of its sideways speed — the part carrying it
across the local filament — and let it keep the part moving along the
filament*. A brake that only acts sideways, and only at the web. Three
questions, answered in order:

1. **Does the rule help?** Yes — against full simulation truth from
   identical starting conditions, it beats both plain Zel'dovich and the
   isotropic "stick at walls" proxy we built for comparison (inspired by,
   but much cruder than, the 1989 adhesion model — true adhesion solves a
   Burgers equation and is <em>not</em> beaten here; Appendix B1), most
   clearly right at the web. The one tuning knob was deliberately set to favour the
   *competitor*, so the win is conservative.
2. **Is the remaining error the rule's fault, or its steering's?** The
   rule needs to know each filament's direction, and must estimate it
   from its own imperfect matter map. So run an **oracle test**: hand the
   rule the *true* directions (read from the finished simulation — pure
   cheating, impossible in practice) and see how good it could ever be.
   With perfect steering the rule wins everywhere, in every distance
   band. The physics of the brake is right; the practical cost is the
   steering.
3. **How close can an honest version get?** After a short tuning campaign
   (brake strength, how coarsely directions are estimated), the frozen
   final recipe scores **4.52** on held-out worlds against Zel'dovich's
   4.98 — within 0.05 of the oracle's 4.47. Ninety percent of the error
   that *could* be recovered, is. The exact recipe, every parameter
   frozen, is [Appendix B4](/mathematics/2026/07/09/cosmic-web-B4-transverse-damping/).

The ladder below shows where that leaves the model among its neighbours —
including MUSCLE (2016), the best published recipe in this class, which
our one-rule model statistically ties. The frozen recipe was then
stress-tested without any re-tuning on universes with different clumpiness,
different resolution, and a different cosmology — it kept beating plain
Zel'dovich in every condition — by 2–13% over whole boxes and 9–22% in the
web-masked regions that matter most — and its truth reference was
cross-checked against two independent professional simulation codes.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-ladder">
  <div id="cw-ladder"></div>
  <figcaption>
    <strong>The model ladder.</strong> Each row is one recipe for predicting
    where matter ends up; the score is how far its predictions land from
    the true simulated positions (median, in grid cells of 1 h⁻¹Mpc ≈ 4.7
    million light-years — lower is better; held-out test worlds). Grey:
    the two classical recipes — straight-line motion, and sticking at
    walls in all directions equally. Blue: this program's rule, in three
    stages of refinement — a brake that acts only <em>sideways</em>, only
    at the web. Green: the best published recipe of this kind, which the
    final one-rule model statistically ties. The dashed red line is the
    limit no version of the rule can beat: the score it gets when handed
    the true filament directions instead of estimating them.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-bins">
  <div id="cw-bins"></div>
  <figcaption>
    <strong>Where the gains live.</strong> The same prediction error, split
    by how close a particle ends up to the filament web. The sideways brake
    earns its keep exactly where filaments form (left bars), which is where
    the correction was measured in the first place; far from the web (right
    bars) all three recipes agree, as they must — there is nothing there to
    brake against.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The frozen recipe, its capabilities, limitations, failure modes, and an
integration guide are documented in a model card
([`research/cosmic-web/docs/MODEL-CARD.md`](https://github.com/moiseevigor/moiseevigor.github.io/blob/research/geometry-of-cosmic-web/research/cosmic-web/docs/MODEL-CARD.md)) —
the program's end product: not a verdict but a usable object.

## So which model should you use?

| Your situation | Use | Why |
|---|---|---|
| Finding filament spines, any sampling density | **Hessian** | matches or beats the lift at every level tested (50/50 seeds from 2.5k up); simpler and cheaper |
| Ultra-sparse tube-like data (a narrow 800–1,200-galaxy band) | either | statistical tie (p ≈ 0.4); sparser still, the Hessian wins again |
| Junctions / nodes are the science | **Hessian** | orientation selectivity fails where direction is ill-defined |
| Gravity-realistic ribbons, mass-tracing | **Hessian** | wins band mass coverage on ZA, N-body, and at 0.5 Mpc resolution |
| Purity- or junction-critical at moderate sparsity | **hybrid (sum of both scores)** | +0.05 purity and +0.04 junction F1 over the Hessian at 5k (p ≈ 10⁻⁴), at a small completeness cost |
| Describing web *anisotropy* (tangent statistics) | **SE(3) lift** | tidal-frame alignment 0.73–0.76 vs 0.67 — the one job it does better |
| Modelling filament *formation* | **neither as geodesics** | assembly is transverse infall; E2 refutes along-axis transport |

Summary of the program: a theoretically motivated method, a benchmark that
initially appeared to confirm it, an evaluation flaw exposed when a later
experiment tightened the procedure, and a corrected comparison in which the
simple model wins nearly everywhere — with the lifted geometry retaining
value as an anisotropy descriptor, a hybrid component, and a physics probe.
Each negative result (the evaluation flaw, junctions, diffusion,
gravity-evolved fields, transport) determined the design of the next
experiment, and the dynamical pipeline independently reproduced known
Zel'dovich collapse behaviour, which supports trusting the negative
results. The general lesson: **a matched comparison must enforce the match
on the quantity that determines the score.** We held an intermediate
quantity equal and assumed the final one would follow; it deviated by 19%,
and that deviation read as a discovery until it was re-measured.

Full protocols, per-experiment reports with all tables and p-values, and
one-command reproduction live in
[`research/cosmic-web/`](https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web)
(experiments E0–E2, `docs/SYNTHESIS.md`). The research program itself is
scoped in the
[companion post]({% post_url 2026-07-03-geometry-of-cosmic-web-research-program %}).

## Glossary

- **Filament / cosmic web** — the network of matter overdensities (width
  ~1–3 h⁻¹Mpc) connecting galaxy clusters; sheets, filaments, nodes, voids.
- **Completeness / purity** — fraction of truth within r₀ = 2 vox of the
  estimate / fraction of the estimate within r₀ of truth, at matched
  skeleton length.
- **Junction F1** — harmonic mean of precision and recall of branch-point
  recovery within 3 vox.
- **Hessian ridgeness** — $$-(\lambda_2+\lambda_3)/2$$ of the smoothed
  density's second-derivative matrix; angular bandwidth 2 in direction.
- **Orientation score $$U(\mathbf{x},\mathbf{n})$$** — response of an
  $$\mathbf{n}$$-elongated anisotropic ridge filter; a function on
  $$\mathbb{R}^3\times S^2$$.
- **Hypoelliptic diffusion** — degenerate smoothing on the lifted space,
  strong along $$\mathbf{n}$$; the contour-completion flow. Rejected by every
  calibration in these experiments.
- **Matched spine length** — both models' skeletons must have equal total
  length before scoring, so completeness/purity trade on equal terms.
  Enforced on the final drawn skeleton itself, not on an intermediate
  quantity — the difference between the two is the "uneven race" this
  article is built around.
- **Zel'dovich approximation / pancake infall** — ballistic displacement
  model of structure formation; collapse proceeds sheet → filament → node,
  with motion *transverse* to the forming structure.
- **Wilcoxon p** — signed-rank test on per-seed paired differences.
- **P2 statistic (E2)** — squared projection of a trajectory's mid-path
  deviation-from-chord onto the local filament axis; isotropic null 1/3.

[^tidal-eigenframe]: At each point the gravity of surrounding matter stretches and squeezes along three natural perpendicular axes; this local set of axes is the tidal eigenframe. Filaments tend to point along the axis of weakest squeezing.

[^boss]: BOSS (the Baryon Oscillation Spectroscopic Survey, part of the Sloan Digital Sky Survey) mapped millions of galaxy positions; CMASS is its catalogue of massive galaxies selected to have roughly constant stellar mass.

[^redshift]: z is redshift: the expansion of the Universe stretches light from distant galaxies toward longer wavelengths, and z measures that stretch. It doubles as a distance and look-back-time label — at z ≈ 0.5 the light left its galaxy about five billion years ago.

[^planck-act]: Planck is a space telescope and ACT (the Atacama Cosmology Telescope) a ground-based one; both mapped the cosmic microwave background — the relic light of the early Universe — over large areas of sky, giving two independent maps to check the same signal.

[^compton-y]: Hot electrons along the line of sight give a small energy kick to the relic microwave photons passing through them; the Compton-y map records the size of that kick across the sky, so a bright y signal means hot gas.

[^jackknife]: Error bars estimated by removing one chunk of the data at a time and remeasuring; the spread across the remeasurements gives the uncertainty.

</div><!-- /.l-body -->

<style>
.cw-ctl { font-size: 0.85rem; color: #555; }
.cw-btn {
  font-size: 0.8rem; padding: 2px 10px; margin: 0 1px; cursor: pointer;
  border: 1px solid #bbb; background: #fafafa; border-radius: 3px; color: #444;
}
.cw-btn.active { background: #2b6cb0; color: #fff; border-color: #2b6cb0; }
.cw-tip {
  position: absolute; pointer-events: none; background: #222; color: #fff;
  padding: 3px 8px; font-size: 0.75rem; border-radius: 3px; opacity: 0;
}
</style>

<script src="/public/data/cosmic-web/post_data.js"></script>
<script>
(function () {
  const IMG = "/public/img/posts/cosmic-web/";
  const BLUE = "#2b6cb0", ORANGE = "#dd6b20", GREY = "#888";

  // ---- figure 0: rotating-cigar concept widget (no data needed) ----
  (function cigar() {
    const host = document.getElementById("cw-cigar");
    if (!host) return;
    const W = 680, H = 300, cx = 170, cy = 150;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.width = "100%";
    host.appendChild(svg);

    // deterministic pseudo-random
    let s = 42;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

    // dashed curve through (cx,cy) with tangent ~ -25 deg, plus clutter
    const TRUE_ANGLE = -25 * Math.PI / 180;
    const pts = [];
    for (let t = -130; t <= 130; t += 4) {
      if (Math.floor((t + 130) / 26) % 2 === 1) continue;   // gaps
      const x = cx + t * Math.cos(TRUE_ANGLE) - 18 * Math.sin(3 * t / 130) * Math.sin(TRUE_ANGLE);
      const y = cy + t * Math.sin(TRUE_ANGLE) + 18 * Math.sin(3 * t / 130) * Math.cos(TRUE_ANGLE);
      pts.push([x + (rnd() - 0.5) * 5, y + (rnd() - 0.5) * 5, true]);
    }
    for (let i = 0; i < 60; i++)
      pts.push([20 + rnd() * 300, 15 + rnd() * 270, false]);
    pts.forEach(([x, y, on]) => {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", on ? 2.6 : 2);
      c.setAttribute("fill", on ? "#333" : "#bbb");
      svg.appendChild(c);
    });

    const ell = document.createElementNS(ns, "ellipse");
    ell.setAttribute("cx", cx); ell.setAttribute("cy", cy);
    ell.setAttribute("fill", "rgba(43,108,176,0.18)");
    ell.setAttribute("stroke", "#2b6cb0"); ell.setAttribute("stroke-width", 1.5);
    svg.appendChild(ell);

    // response dial (right panel)
    const dx = 500, dy = 150, R = 105;
    const axis = document.createElementNS(ns, "circle");
    axis.setAttribute("cx", dx); axis.setAttribute("cy", dy); axis.setAttribute("r", R);
    axis.setAttribute("fill", "none"); axis.setAttribute("stroke", "#ddd");
    svg.appendChild(axis);
    const lbl = document.createElementNS(ns, "text");
    lbl.setAttribute("x", dx); lbl.setAttribute("y", dy + R + 22);
    lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", 12);
    lbl.textContent = "response vs filter angle";
    svg.appendChild(lbl);
    const quadPath = document.createElementNS(ns, "path");
    quadPath.setAttribute("fill", "rgba(120,120,120,0.25)");
    quadPath.setAttribute("stroke", "#888");
    svg.appendChild(quadPath);
    const lobePath = document.createElementNS(ns, "path");
    lobePath.setAttribute("fill", "rgba(43,108,176,0.3)");
    lobePath.setAttribute("stroke", "#2b6cb0"); lobePath.setAttribute("stroke-width", 1.5);
    svg.appendChild(lobePath);
    const needle = document.createElementNS(ns, "line");
    needle.setAttribute("x1", dx); needle.setAttribute("y1", dy);
    needle.setAttribute("stroke", "#c53030"); needle.setAttribute("stroke-width", 2);
    svg.appendChild(needle);

    const sigP = 9;   // perpendicular width of the filter (px)
    function response(theta, aspect) {
      const ct = Math.cos(theta), st = Math.sin(theta), sl = sigP * aspect;
      let acc = 0;
      for (const [x, y] of pts) {
        const ddx = x - cx, ddy = y - cy;
        const u = ddx * ct + ddy * st, v = -ddx * st + ddy * ct;
        acc += Math.exp(-0.5 * (u * u / (sl * sl) + v * v / (sigP * sigP)));
      }
      return acc / aspect;   // normalise by filter area
    }
    function lobe(fn, nmax) {
      let d = "";
      for (let a = 0; a <= 360; a += 3) {
        const th = a * Math.PI / 180;
        const r = R * fn(th) / nmax;
        const px = dx + r * Math.cos(th), py = dy + r * Math.sin(th);
        d += (a ? "L" : "M") + px.toFixed(1) + "," + py.toFixed(1);
      }
      return d + "Z";
    }

    let theta = 0, playing = true, aspect = 1.5;
    function redraw() {
      const resp = [];
      let m = 0;
      for (let a = 0; a < 360; a += 3) {
        const v = response(a * Math.PI / 180, aspect);
        resp[a / 3] = v; if (v > m) m = v;
      }
      lobePath.setAttribute("d", lobe(th => resp[Math.round(((th * 180 / Math.PI) % 360) / 3) % 120], m));
      // quadratic reference: best-fit bandwidth-2 lobe around the true angle
      const qmax = 1, qmin = 0.45;
      quadPath.setAttribute("d", lobe(th =>
        (qmin + (qmax - qmin) * Math.pow(Math.cos(th - TRUE_ANGLE), 2)) * m, m));
      ell.setAttribute("rx", sigP * aspect * 1.8); ell.setAttribute("ry", sigP * 1.8);
    }
    function tick() {
      if (playing) {
        theta += 0.02;
        ell.setAttribute("transform", `rotate(${theta * 180 / Math.PI} ${cx} ${cy})`);
        needle.setAttribute("x2", dx + R * Math.cos(theta));
        needle.setAttribute("y2", dy + R * Math.sin(theta));
      }
      requestAnimationFrame(tick);
    }
    redraw(); tick();

    document.getElementById("cig-play").onclick = function () {
      playing = !playing; this.textContent = playing ? "pause" : "play";
    };
    document.getElementById("cig-aspect").oninput = function () {
      aspect = +this.value;
      document.getElementById("cig-aspect-val").textContent = aspect + "×";
      redraw();
    };
  })();

  // ---- figure 1: slice explorer (image swap) ----
  const state = { v: "curved", n: "2500" };
  function swap() {
    document.getElementById("cw-slice-img").src =
      IMG + "slice_" + state.v + "_" + state.n + ".png";
  }
  document.querySelectorAll(".cw-var").forEach(b => b.onclick = () => {
    document.querySelectorAll(".cw-var").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); state.v = b.dataset.v; swap();
  });
  document.querySelectorAll(".cw-lvl").forEach(b => b.onclick = () => {
    document.querySelectorAll(".cw-lvl").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); state.n = b.dataset.n; swap();
  });

  (function (DATA) {
    if (!DATA) return;
    if (typeof d3 === "undefined") return;
    const tip = d3.select("body").append("div").attr("class", "cw-tip");

    function frame(sel, w, h, m) {
      d3.select(sel).selectAll("*").remove();
      const svg = d3.select(sel).append("svg")
        .attr("viewBox", `0 0 ${w} ${h}`).style("width", "100%");
      return { svg, g: svg.append("g").attr("transform", `translate(${m.l},${m.t})`),
               iw: w - m.l - m.r, ih: h - m.t - m.b };
    }

    // ---- figure 2: crossover chart ----
    const cState = { m: "C", v: "curved" };
    const M_LABEL = { C: "completeness", P: "purity", jF1: "junction F1" };
    function drawCrossover() {
      const d = DATA[cState.v], levels = d.levels;
      const { g, iw, ih } = frame("#cw-crossover", 640, 300, { l: 45, r: 15, t: 10, b: 40 });
      const x = d3.scaleLog().domain(d3.extent(levels)).range([0, iw]);
      const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);
      g.append("g").attr("transform", `translate(0,${ih})`)
        .call(d3.axisBottom(x).tickValues(levels).tickFormat(d3.format("~s")));
      g.append("g").call(d3.axisLeft(y).ticks(5));
      g.append("text").attr("x", iw / 2).attr("y", ih + 34).attr("text-anchor", "middle")
        .attr("font-size", 12).text("galaxies per 128³ box (log)");
      g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -32)
        .attr("text-anchor", "middle").attr("font-size", 12).text(M_LABEL[cState.m]);
      [["se3_lift", BLUE, "SE(3) lift"], ["hessian", ORANGE, "Hessian"]].forEach(([mth, col, lab]) => {
        const vals = d.agg[mth][cState.m];
        const line = d3.line().x((v, i) => x(levels[i])).y(v => y(v));
        g.append("path").datum(vals).attr("fill", "none").attr("stroke", col)
          .attr("stroke-width", 2.5).attr("d", line);
        g.selectAll(null).data(vals).enter().append("circle")
          .attr("cx", (v, i) => x(levels[i])).attr("cy", v => y(v)).attr("r", 4.5)
          .attr("fill", col)
          .on("mousemove", (ev, v) => tip.style("opacity", 1)
            .style("left", (ev.pageX + 12) + "px").style("top", (ev.pageY - 10) + "px")
            .text(`${lab}: ${v.toFixed(3)}`))
          .on("mouseout", () => tip.style("opacity", 0));
        g.append("text").attr("x", x(levels[levels.length - 1]) - 4)
          .attr("y", Math.max(12, y(d.agg[mth][cState.m][levels.length - 1])
                                  + (mth === "hessian" ? -10 : 16)))
          .attr("text-anchor", "end").attr("fill", col).attr("font-size", 12).text(lab);
      });
    }
    document.querySelectorAll(".cw-met").forEach(b => b.onclick = () => {
      document.querySelectorAll(".cw-met").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); cState.m = b.dataset.m; drawCrossover();
    });
    document.querySelectorAll(".cw-cvar").forEach(b => b.onclick = () => {
      document.querySelectorAll(".cw-cvar").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); cState.v = b.dataset.v; drawCrossover();
    });
    drawCrossover();

    // ---- figure 3: per-seed delta strip plot ----
    const dState = { m: "dC", v: "curved" };
    function drawDeltas() {
      const d = DATA[dState.v], levels = d.levels, cols = d.deltas[dState.m];
      const { g, iw, ih } = frame("#cw-deltas", 640, 320, { l: 50, r: 15, t: 14, b: 40 });
      const x = d3.scalePoint().domain(levels).range([40, iw - 40]);
      const flat = cols.flat();
      const y = d3.scaleLinear().domain([Math.min(-0.08, d3.min(flat)),
                                         Math.max(0.12, d3.max(flat))]).nice().range([ih, 0]);
      g.append("g").attr("transform", `translate(0,${ih})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("~s")));
      g.append("g").call(d3.axisLeft(y).ticks(6));
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0))
        .attr("stroke", "#000").attr("stroke-width", 1);
      g.append("text").attr("x", iw / 2).attr("y", ih + 34).attr("text-anchor", "middle")
        .attr("font-size", 12).text("galaxies per box");
      g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -36)
        .attr("text-anchor", "middle").attr("font-size", 12)
        .text((dState.m === "dC" ? "Δ completeness" : "Δ junction F1") + "  (+ = lift wins)");
      const rnd = d3.randomLcg(7);
      cols.forEach((vals, i) => {
        const cx = x(levels[i]);
        g.selectAll(null).data(vals).enter().append("circle")
          .attr("cx", () => cx + (rnd() - 0.5) * 44)
          .attr("cy", v => y(v)).attr("r", 2.6)
          .attr("fill", BLUE).attr("opacity", 0.45);
        const mean = d3.mean(vals), wins = vals.filter(v => v > 0).length;
        g.append("line").attr("x1", cx - 26).attr("x2", cx + 26)
          .attr("y1", y(mean)).attr("y2", y(mean))
          .attr("stroke", "#c53030").attr("stroke-width", 2.5);
        g.append("text").attr("x", cx).attr("y", 10).attr("text-anchor", "middle")
          .attr("font-size", 11).attr("fill", "#555")
          .text(`${wins}/${vals.length} +`);
      });
    }
    document.querySelectorAll(".cw-dmet").forEach(b => b.onclick = () => {
      document.querySelectorAll(".cw-dmet").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); dState.m = b.dataset.m; drawDeltas();
    });
    document.querySelectorAll(".cw-dvar").forEach(b => b.onclick = () => {
      document.querySelectorAll(".cw-dvar").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); dState.v = b.dataset.v; drawDeltas();
    });
    drawDeltas();

    // ---- figure 4: E1b band-coverage bars (ZA / PM toggle) ----
    const E1B_LABELS = { hessian: "Hessian", lift_s3: "lift σ∥=3",
                         lift_s45: "lift σ∥=4.5", lift_b0: "lift σ∥=6" };
    let e1bState = "sigpar";
    function drawE1b() {
      const key = "e1b_" + e1bState;
      const { g, iw, ih } = frame("#cw-e1b", 640, 300, { l: 50, r: 15, t: 14, b: 58 });
      if (!DATA[key]) {
        g.append("text").attr("x", iw / 2).attr("y", ih / 2).attr("text-anchor", "middle")
          .attr("fill", GREY).text("N-body results pending");
        return;
      }
      const d = DATA[key];
      const methods = ["hessian", "lift_s3", "lift_s45", "lift_b0"].filter(m => d.band[m]);
      const groups = d.levels.map(String);
      const x0 = d3.scaleBand().domain(groups).range([0, iw]).padding(0.25);
      const x1 = d3.scaleBand().domain(methods).range([0, x0.bandwidth()]).padding(0.12);
      const y = d3.scaleLinear()
        .domain([0, d3.max(methods.flatMap(m => d.band[m])) * 1.15]).range([ih, 0]);
      g.append("g").attr("transform", `translate(0,${ih})`)
        .call(d3.axisBottom(x0).tickFormat(v => (+v / 1000) + "k galaxies"));
      g.append("g").call(d3.axisLeft(y).ticks(5));
      g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -36)
        .attr("text-anchor", "middle").attr("font-size", 12)
        .text("filament-band mass coverage");
      groups.forEach((grp, gi) => {
        methods.forEach(m => {
          const v = d.band[m][gi];
          g.append("rect")
            .attr("x", x0(grp) + x1(m)).attr("y", y(v))
            .attr("width", x1.bandwidth()).attr("height", ih - y(v))
            .attr("fill", m === "hessian" ? ORANGE : BLUE)
            .attr("opacity", m === "hessian" ? 0.95 : 0.55 + 0.15 * methods.indexOf(m))
            .on("mousemove", ev => tip.style("opacity", 1)
              .style("left", (ev.pageX + 12) + "px").style("top", (ev.pageY - 10) + "px")
              .text(`${E1B_LABELS[m] || m}: ${v.toFixed(3)}`))
            .on("mouseout", () => tip.style("opacity", 0));
        });
      });
      const leg = g.append("g").attr("transform", `translate(0,${ih + 34})`);
      methods.forEach((m, i) => {
        leg.append("rect").attr("x", i * 150).attr("y", 0).attr("width", 12).attr("height", 12)
          .attr("fill", m === "hessian" ? ORANGE : BLUE)
          .attr("opacity", m === "hessian" ? 0.95 : 0.55 + 0.15 * i);
        leg.append("text").attr("x", i * 150 + 17).attr("y", 10).attr("font-size", 11)
          .text(E1B_LABELS[m] || m);
      });
    }
    document.querySelectorAll(".cw-e1b").forEach(b => b.onclick = () => {
      document.querySelectorAll(".cw-e1b").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); e1bState = b.dataset.t; drawE1b();
    });
    drawE1b();

    // ---- figure 5: E2 dynamics ----
    function drawE2() {
      const d = DATA.e2;
      const { g, iw, ih } = frame("#cw-e2", 640, 300, { l: 50, r: 60, t: 14, b: 44 });
      const x = d3.scaleBand().domain(d.bins).range([0, iw]).padding(0.3);
      const y = d3.scaleLinear().domain([0, 0.5]).range([ih, 0]);
      const y2 = d3.scaleLinear().domain([0, d3.max(d.dev) * 1.2]).range([ih, 0]);
      g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x));
      g.append("g").call(d3.axisLeft(y).ticks(5));
      g.append("g").attr("transform", `translate(${iw},0)`).call(d3.axisRight(y2).ticks(4));
      g.append("text").attr("x", iw / 2).attr("y", ih + 34).attr("text-anchor", "middle")
        .attr("font-size", 12).text("distance to nearest filament spine (voxels)");
      g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -34)
        .attr("text-anchor", "middle").attr("font-size", 12).text("P2 (parallel fraction)");
      g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", iw + 46)
        .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", GREY)
        .text("mean |deviation| (vox)");
      d.bins.forEach((b, i) => {
        g.append("rect").attr("x", x(b) + x.bandwidth() * 0.55).attr("y", y2(d.dev[i]))
          .attr("width", x.bandwidth() * 0.45).attr("height", ih - y2(d.dev[i]))
          .attr("fill", GREY).attr("opacity", 0.35)
          .on("mousemove", ev => tip.style("opacity", 1)
            .style("left", (ev.pageX + 12) + "px").style("top", (ev.pageY - 10) + "px")
            .text(`|dev| = ${d.dev[i]} vox`))
          .on("mouseout", () => tip.style("opacity", 0));
      });
      g.append("line").attr("x1", 0).attr("x2", iw)
        .attr("y1", y(1 / 3)).attr("y2", y(1 / 3))
        .attr("stroke", "#000").attr("stroke-dasharray", "5,4");
      g.append("text").attr("x", iw - 4).attr("y", y(1 / 3) - 6).attr("text-anchor", "end")
        .attr("font-size", 11).text("isotropic null 1/3");
      const line = d3.line().x((v, i) => x(d.bins[i]) + x.bandwidth() * 0.27).y(v => y(v));
      g.append("path").datum(d.P2).attr("fill", "none").attr("stroke", "#c53030")
        .attr("stroke-width", 2.5).attr("d", line);
      g.selectAll(null).data(d.P2).enter().append("circle")
        .attr("cx", (v, i) => x(d.bins[i]) + x.bandwidth() * 0.27)
        .attr("cy", v => y(v)).attr("r", 4.5).attr("fill", "#c53030")
        .on("mousemove", (ev, v) => tip.style("opacity", 1)
          .style("left", (ev.pageX + 12) + "px").style("top", (ev.pageY - 10) + "px")
          .text(`P2 = ${v}`))
        .on("mouseout", () => tip.style("opacity", 0));
      g.append("text").attr("x", x(d.bins[0])).attr("y", y(d.P2[0]) - 12)
        .attr("font-size", 11).attr("fill", "#c53030").text("weakly parallel near spines");
      g.append("text").attr("x", x(d.bins[4]) - 30).attr("y", y(d.P2[4]) + 20)
        .attr("font-size", 11).attr("fill", "#c53030").text("perpendicular infall far away");
    }
    drawE2();
  })(window.CW_DATA);
})();
</script>

<script>
/* Constructive-arc figures. Numbers are frozen results from
   artifacts/e4_results.json, e5*_results.json and docs/E3d/E3e reports. */
(function () {
  if (typeof d3 === "undefined") return;
  const BLUE = "#2b6cb0", ORANGE = "#dd6b20", GREY = "#888", RED = "#c53030";
  const tip2 = d3.select("body").append("div").attr("class", "cw-tip");

  function frame(sel, w, h, m) {
    const host = d3.select(sel);
    if (host.empty()) return null;
    host.selectAll("*").remove();
    const svg = host.append("svg").attr("viewBox", `0 0 ${w} ${h}`)
      .style("width", "100%");
    return { g: svg.append("g").attr("transform", `translate(${m.l},${m.t})`),
             iw: w - m.l - m.r, ih: h - m.t - m.b };
  }

  // ---- claims-under-controls (bridge SNR ladder) ----
  (function () {
    const STEPS = ["naive errors", "jackknife errors", "null-subtracted"];
    const DATA = [{name: "Planck", vals: [19.3, 8.0, 2.2], color: GREY},
                  {name: "ACT",    vals: [5.24, 3.30, 1.6], color: BLUE}];
    const f = frame("#cw-claims", 640, 300, {l: 52, r: 20, t: 12, b: 40});
    if (!f) return;
    const x = d3.scalePoint().domain(STEPS).range([30, f.iw - 30]);
    const y = d3.scaleLog().domain([1, 25]).range([f.ih, 0]);
    f.g.append("g").attr("transform", `translate(0,${f.ih})`)
      .call(d3.axisBottom(x));
    f.g.append("g").call(d3.axisLeft(y).tickValues([1, 2, 3, 5, 10, 20])
      .tickFormat(d3.format("g")));
    f.g.append("text").attr("transform", "rotate(-90)").attr("x", -f.ih / 2)
      .attr("y", -36).attr("text-anchor", "middle").attr("font-size", 12)
      .text("bridge significance (σ)");
    [[3, "3σ"], [2, "2σ"]].forEach(([v, lab]) => {
      f.g.append("line").attr("x1", 0).attr("x2", f.iw)
        .attr("y1", y(v)).attr("y2", y(v))
        .attr("stroke", "#000").attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.4);
      f.g.append("text").attr("x", f.iw - 2).attr("y", y(v) - 4)
        .attr("text-anchor", "end").attr("font-size", 10)
        .attr("fill", "#555").text(lab);
    });
    DATA.forEach(d => {
      const line = d3.line().x((v, i) => x(STEPS[i])).y(v => y(v));
      f.g.append("path").datum(d.vals).attr("fill", "none")
        .attr("stroke", d.color).attr("stroke-width", 2.5).attr("d", line);
      f.g.selectAll(null).data(d.vals).enter().append("circle")
        .attr("cx", (v, i) => x(STEPS[i])).attr("cy", v => y(v))
        .attr("r", 5).attr("fill", d.color)
        .on("mousemove", (ev, v) => tip2.style("opacity", 1)
          .style("left", (ev.pageX + 12) + "px")
          .style("top", (ev.pageY - 10) + "px")
          .text(`${d.name}: ${v}σ`))
        .on("mouseout", () => tip2.style("opacity", 0));
      f.g.append("text").attr("x", x(STEPS[0]) - 8)
        .attr("y", y(d.vals[0]) + 4).attr("text-anchor", "end")
        .attr("fill", d.color).attr("font-size", 12).text(d.name);
    });
  })();

  // ---- E4: direction of the correction ----
  (function () {
    const BINS = ["0–2", "2–4", "4–8", "8–16", "16–64"];
    const PFR = [0.298, 0.297, 0.264, 0.218, 0.208];
    const PFV = [0.312, 0.300, 0.280, 0.218, 0.203];
    const f = frame("#cw-e4", 640, 300, {l: 52, r: 20, t: 12, b: 44});
    if (!f) return;
    const x = d3.scalePoint().domain(BINS).range([30, f.iw - 30]);
    const y = d3.scaleLinear().domain([0.15, 0.4]).range([f.ih, 0]);
    f.g.append("g").attr("transform", `translate(0,${f.ih})`)
      .call(d3.axisBottom(x));
    f.g.append("g").call(d3.axisLeft(y).ticks(6));
    f.g.append("text").attr("x", f.iw / 2).attr("y", f.ih + 36)
      .attr("text-anchor", "middle").attr("font-size", 12)
      .text("distance to filament web (voxels = h⁻¹Mpc)");
    f.g.append("text").attr("transform", "rotate(-90)").attr("x", -f.ih / 2)
      .attr("y", -38).attr("text-anchor", "middle").attr("font-size", 12)
      .text("mean squared projection on filament axis");
    f.g.append("line").attr("x1", 0).attr("x2", f.iw)
      .attr("y1", y(1 / 3)).attr("y2", y(1 / 3))
      .attr("stroke", "#000").attr("stroke-dasharray", "5,4");
    f.g.append("text").attr("x", f.iw - 4).attr("y", y(1 / 3) - 6)
      .attr("text-anchor", "end").attr("font-size", 11)
      .text("isotropic (1/3)");
    f.g.append("text").attr("x", 6).attr("y", y(0.21) + 26)
      .attr("font-size", 11).attr("fill", RED)
      .text("below the line = correction points ACROSS filaments");
    [["position residual", PFR, BLUE], ["velocity residual", PFV, ORANGE]]
      .forEach(([lab, vals, col], k) => {
        const line = d3.line().x((v, i) => x(BINS[i])).y(v => y(v));
        f.g.append("path").datum(vals).attr("fill", "none")
          .attr("stroke", col).attr("stroke-width", 2.5).attr("d", line);
        f.g.selectAll(null).data(vals).enter().append("circle")
          .attr("cx", (v, i) => x(BINS[i])).attr("cy", v => y(v))
          .attr("r", 4.5).attr("fill", col)
          .on("mousemove", (ev, v) => tip2.style("opacity", 1)
            .style("left", (ev.pageX + 12) + "px")
            .style("top", (ev.pageY - 10) + "px").text(`${lab}: ${v}`))
          .on("mouseout", () => tip2.style("opacity", 0));
        f.g.append("circle").attr("cx", 14).attr("cy", 14 + k * 18)
          .attr("r", 5).attr("fill", col);
        f.g.append("text").attr("x", 24).attr("y", 18 + k * 18)
          .attr("font-size", 11).attr("fill", col).text(lab);
      });
  })();

  // ---- model ladder ----
  (function () {
    const MODELS = [
      ["stick at walls — isotropic proxy", 5.34, GREY],
      ["straight lines — Zel'dovich (1970)", 4.98, GREY],
      ["+ sideways brake, first version (ours)", 4.91, BLUE],
      ["+ better steering (ours)", 4.64, BLUE],
      ["final frozen recipe (ours)", 4.52, BLUE],
      ["best published recipe — MUSCLE (2016)", 4.49, "#2f855a"],
    ];
    const BOUND = 4.47;
    const f = frame("#cw-ladder", 640, 330, {l: 300, r: 30, t: 14, b: 40});
    if (!f) return;
    const y = d3.scaleBand().domain(MODELS.map(m => m[0]))
      .range([0, f.ih]).padding(0.35);
    const x = d3.scaleLinear().domain([4.3, 5.5]).range([0, f.iw]);
    f.g.append("g").attr("transform", `translate(0,${f.ih})`)
      .call(d3.axisBottom(x).ticks(6));
    f.g.append("g").call(d3.axisLeft(y).tickSize(0));
    f.g.append("text").attr("x", f.iw / 2).attr("y", f.ih + 34)
      .attr("text-anchor", "middle").attr("font-size", 12)
      .text("median prediction error vs simulation truth (grid cells, lower is better)");
    f.g.append("line").attr("x1", x(BOUND)).attr("x2", x(BOUND))
      .attr("y1", 0).attr("y2", f.ih)
      .attr("stroke", RED).attr("stroke-dasharray", "5,4");
    f.g.append("text").attr("x", x(BOUND) - 4).attr("y", 12)
      .attr("text-anchor", "end").attr("font-size", 11).attr("fill", RED)
      .text("perfect-steering limit 4.47");
    MODELS.forEach(([name, v, col]) => {
      f.g.append("line").attr("x1", x(4.3)).attr("x2", x(v))
        .attr("y1", y(name) + y.bandwidth() / 2)
        .attr("y2", y(name) + y.bandwidth() / 2)
        .attr("stroke", "#ddd");
      f.g.append("circle").attr("cx", x(v))
        .attr("cy", y(name) + y.bandwidth() / 2).attr("r", 6.5)
        .attr("fill", col)
        .on("mousemove", (ev) => tip2.style("opacity", 1)
          .style("left", (ev.pageX + 12) + "px")
          .style("top", (ev.pageY - 10) + "px").text(`${v} vox`))
        .on("mouseout", () => tip2.style("opacity", 0));
      f.g.append("text").attr("x", x(v) + 10)
        .attr("y", y(name) + y.bandwidth() / 2 + 4)
        .attr("font-size", 11).text(v.toFixed(2));
    });
  })();

  // ---- per-bin gains ----
  (function () {
    const BINS = ["0–2", "2–4", "4–8", "8–64"];
    const SERIES = [["Zel'dovich (straight lines)", [6.95, 5.43, 3.74, 3.38], GREY],
                    ["our model (frozen recipe)", [5.96, 5.37, 3.67, 3.28], BLUE],
                    ["perfect steering (cheating)", [5.53, 5.20, 3.68, 3.33], RED]];
    const f = frame("#cw-bins", 640, 300, {l: 52, r: 20, t: 14, b: 58});
    if (!f) return;
    const x0 = d3.scaleBand().domain(BINS).range([0, f.iw]).padding(0.25);
    const x1 = d3.scaleBand().domain(SERIES.map(s => s[0]))
      .range([0, x0.bandwidth()]).padding(0.15);
    const y = d3.scaleLinear().domain([0, 7.5]).range([f.ih, 0]);
    f.g.append("g").attr("transform", `translate(0,${f.ih})`)
      .call(d3.axisBottom(x0));
    f.g.append("g").call(d3.axisLeft(y).ticks(6));
    f.g.append("text").attr("x", f.iw / 2).attr("y", f.ih + 34)
      .attr("text-anchor", "middle").attr("font-size", 12)
      .text("distance to filament web (voxels)");
    f.g.append("text").attr("transform", "rotate(-90)").attr("x", -f.ih / 2)
      .attr("y", -36).attr("text-anchor", "middle").attr("font-size", 12)
      .text("median transport error (voxels)");
    SERIES.forEach(([name, vals, col]) => {
      BINS.forEach((b, i) => {
        f.g.append("rect").attr("x", x0(b) + x1(name)).attr("y", y(vals[i]))
          .attr("width", x1.bandwidth()).attr("height", f.ih - y(vals[i]))
          .attr("fill", col).attr("opacity", col === GREY ? 0.6 : 0.85)
          .on("mousemove", (ev) => tip2.style("opacity", 1)
            .style("left", (ev.pageX + 12) + "px")
            .style("top", (ev.pageY - 10) + "px")
            .text(`${name}: ${vals[i]}`))
          .on("mouseout", () => tip2.style("opacity", 0));
      });
    });
    const leg = f.g.append("g").attr("transform", `translate(0,${f.ih + 42})`);
    SERIES.forEach(([name, _, col], i) => {
      leg.append("rect").attr("x", i * 170).attr("width", 12)
        .attr("height", 12).attr("fill", col);
      leg.append("text").attr("x", i * 170 + 17).attr("y", 10)
        .attr("font-size", 11).text(name);
    });
  })();
})();
</script>
