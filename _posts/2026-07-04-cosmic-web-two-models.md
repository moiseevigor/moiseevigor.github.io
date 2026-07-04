---
layout: distill
title: "Two Ways to See a Cosmic Filament"
subtitle: >
  Matter in the Universe collects along a web of filaments, and finding them in
  sparse galaxy data is a geometry problem. We race two models — a local
  curvature test against an orientation-lifted measurement borrowed from the
  visual cortex — on thousands of synthetic universes with exact ground truth.
  The interactive plots below show what each model can and cannot do — and
  tell the story of how our own benchmark quietly handed one contestant a
  head start, and what happened when we levelled the race.
date: 2026-07-04 09:00:00
categories: [mathematics]
tags: [cosmic-web, sub-riemannian, SE3, filaments, data-analysis]
description: >
  Introductory tour of the cosmic-web filament experiments: the Hessian
  baseline vs the R³×S² orientation lift, with interactive result explorers
  built from the actual benchmark data (E0–E2), including the failure modes —
  junctions, dense sampling, gravity-shaped webs, and the transport test.
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this article covers</div>
An introductory, self-contained account of a small research program: can the
sub-Riemannian machinery from the
<a href="{% post_url 2026-04-25-geometry-of-seeing-visual-cortex-se2 %}">Geometry
of Seeing</a> series find <em>cosmic filaments</em>? Two models are defined
with all their mathematics, then raced under strict fairness rules on
synthetic universes where the truth is known exactly. Interactive figures let
you explore the results yourself — including the moment we discovered the
race had been <strong>quietly unfair</strong> in the fancier model's favour,
the verdict once it was levelled, a surprising rejection of diffusion, and a
dynamical test that refutes the prettiest version of the theory. Every number
comes from the actual experiment data in the repo
(<code>research/cosmic-web/</code>).
</div>

## The problem

You are handed a box of points — galaxies — and told that most of them
scatter around an invisible network of curves with branch points, while the
rest are clutter. Recover the network. This is the observational situation in
cosmology: gravity organises matter into **filaments** of width a few
megaparsecs, and galaxy surveys sample this web sparsely and noisily.

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

## The two models

Both start identically: blur the galaxy points into a smooth density $$f:\mathbb{R}^3 \to \mathbb{R}$$ (cloud-in-cell deposit, log transform, light
Gaussian smoothing). They differ in how they ask "is there a filament through
this point?"

**Model 1 — the Hessian baseline (local, quadratic).** On a bright ridge the
density falls off steeply in two directions and stays flat along the third.
So compute the Hessian $$H = D^2 f$$ at every point, take eigenvalues $$\lambda_1 \ge \lambda_2 \ge \lambda_3$$ of $$H$$, and score

$$
R_{\mathrm{hess}}(\mathbf{x}) = -\tfrac{1}{2}\left(\lambda_2 + \lambda_3\right)_+ ,
$$

with the filament direction given by the top eigenvector. This is the
workhorse of the field (the MMF and NEXUS filament finders are multiscale
versions of it). Its structural limit: everything it knows about direction at $$\mathbf{x}$$ sits in one quadratic form — as a function on the sphere of
directions, it has angular bandwidth 2 and *cannot be made sharper*.

**Model 2 — the SE(3) orientation lift.** Measure the data separately for
every direction: for each point $$\mathbf{x}$$ and unit vector $$\mathbf{n}$$,
correlate the density with a long thin "cigar" aligned with $$\mathbf{n}$$ —
concretely, in Fourier space,

$$
U(\mathbf{x},\mathbf{n}) = \mathcal{F}^{-1}\!\left[\,
\sigma_\perp^2\,|\mathbf{k}_\perp|^2\,
e^{-\frac{1}{2}\left(\sigma_\parallel^2 k_\parallel^2 + \sigma_\perp^2 |\mathbf{k}_\perp|^2\right)}
\hat{f}(\mathbf{k})\right],
$$

minus the transverse Laplacian of an $$\mathbf{n}$$-elongated Gaussian: large
exactly on ridges aligned with $$\mathbf{n}$$. The function $$U$$ lives on $$\mathbb{R}^3 \times S^2$$ (we sample 42 axes on the hemisphere), and its
angular sharpness grows with the aspect ratio $$\sigma_\parallel/\sigma_\perp$$
— a free parameter, unlike the Hessian's fixed bluntness. The final score is $$\max_{\mathbf{n}} U$$. The theory also offers a second ingredient — a
**hypoelliptic diffusion** on the lifted space that propagates evidence along
curves (the contour-completion flow of the visual cortex) — remember this
one; its fate below is an honest surprise.

The difference between the two models is easier to *feel* than to read.
Below, a dashed curve of galaxies hides in clutter. A single oriented filter
(the ellipse) sits on the curve and sweeps through all directions; the dial
on the right records how strongly it responds at each angle. Stretch the
filter and watch its sense of direction sharpen — then compare with the
grey lobe, which is the best any Hessian-type quadratic response can ever
do, no matter the data.

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

**Fairness rules.** Everything downstream of the score is *identical*:
thresholding, skeletonisation at **matched total spine length** (so neither
model can win by drawing more curve), junction detection. Each model gets the
same budget of three tuning configurations, chosen on one calibration
realization and *frozen* before scoring on 50 fresh ones. Both models reduce
to "a scalar ridge score, then the same pipeline" — the race isolates exactly
one variable: quadratic local curvature vs. angularly-sharp oriented
measurement.

## The test bed: universes with exact answers

You cannot score a filament finder on the real Universe — nobody knows the
true network. So the first battery (experiment E0) manufactures truth: seeds
dropped in a box, their **Voronoi diagram** computed, and the *edges* of the
Voronoi cells — where three cell walls meet — taken as the filament network
(a classic cartoon of the cosmic web, geometrically honest about branching).
One variant keeps the edges straight; a second bends each into a Bézier arc.
Galaxies are sprinkled along the network with transverse scatter, node
clumps, and 25% uniform clutter; both models get the identical blurred field.

Explore the raw material below — the same box, at four sampling densities
from "starved" (2,500 galaxies) to "saturated" (80,000). Red is the exact
truth; blue is each model's recovered skeleton.

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

## The result — and the race that wasn't fair at first

Fifty held-out random universes per variant, five sampling densities, three
scores: **completeness** (fraction of the true network within 2 voxels of the
estimate), **purity** (the converse), **junction F1** (branch-point recovery).

Before showing the verdict, the most instructive part of this article — a
story about fairness. The first version of this benchmark produced a
spectacular result: the lift beating the Hessian by **+7 points of
completeness** at sparse sampling, on 48 of 50 seeds, p ≈ 10⁻¹⁴. It looked
airtight. It wasn't — and the reason is worth understanding even if you
never touch a cosmic filament.

Think of the comparison as two fishermen, each allowed the same total length
of net: whoever's net catches more of the river's fish is the better
fisherman. Our rule for "same length of net" was enforced *one step early* —
we matched an intermediate quantity from which each model then produced its
final curve network, assuming both would end up with equal length. They
didn't. At sparse sampling the lift consistently ended up drawing about
**19% more curve** than the Hessian (1,468 vs 1,239 voxels). And a longer
net catches more fish no matter who holds it: the lift's celebrated
completeness win was substantially the extra length, not extra skill. The
imbalance came to light months of experiments later, when a different test
required tightening the procedure so that the *final drawn length itself*
is held equal — and re-running the original race under the level rule
flipped the outcome. Every figure below uses the level rule.

The levelled verdict: **the Hessian matches or beats the lift at every
sampling density**. At the ultra-sparse end (1,200 galaxies) the two are
statistically tied (Δ = +0.004, p = 0.36); everywhere else the Hessian wins
completeness by 4–7 points on 50 of 50 seeds, and junction F1 with it.

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

Averages can hide seed luck, so the next figure shows every seed: each dot is
one universe, plotted by the *paired difference* (lift − Hessian) on that
exact realization. Above the zero line, the lift won that universe. With the
race levelled, the clouds sit at zero for 1.2k galaxies and below zero
everywhere else. Worth remembering: the uneven race produced a +0.07 cloud
that looked exactly this decisive in the other direction — decisiveness
alone tells you nothing about whether the comparison was fair.

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
angularly-sharp measurement, not in evidence propagation. (The "crude
numerics" objection was tested and closed: an 8-step Trotter splitting at
equal total diffusion — which converges to the true left-invariant
semigroup — reproduces the coarse result at both sparsity levels. The
verdict is about the operator.)

**Failure 3 — gravity-shaped webs (with one nuance).** Real filaments are
not tubes. On gravity-evolved boxes, scored by a method-neutral criterion —
*which model's spines capture more mass at equal length* — the toy advantage
does not transfer. On Zel'dovich fields (winding, ribbon-like structures)
the Hessian wins at every sampling density and every filter scale tried
(p ≤ 0.001). On full N-body fields the verdict softens but does not flip:
long cigars still lose badly (−0.05), while the *shortest* filter
(σ∥ = 3 vox) closes to a statistical tie at sparse sampling (−0.005,
p = 0.55) and a small deficit when dense. Toggle the figure below between
the two field types: the lift never actually leads on gravity-shaped mass,
and its best case is "as good as the simpler model".

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
    σ∥ = 3, 4.5, 6 are the lift at three cigar lengths. The Hessian leads at
    both sampling densities regardless of scale — the honest negative that
    keeps the toy result in its lane.
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

The verdict is blunt: **filaments are built by matter falling across them,
not flowing along them.** The lifted geometry survives only as a *static
descriptor* — spine tangents from the lift align with the tidal eigenframe at
0.73–0.76 versus the Hessian's 0.67 (isotropic null 0.5), without ever being
shown the tidal field — but the geodesic *transport* story is refuted in the
bulk, with a weak, sign-correct residual for matter already captured inside
filament tubes.

## A real-Universe coda

The program's final experiment left simulations behind: 274,000 real BOSS
CMASS galaxies (z = 0.45–0.55) tiled into eighteen 512 h⁻¹Mpc cubes, spines
extracted by both methods at matched length, and the networks stacked
against Planck maps with footprint-matched rotated controls. Three things
happened. First, a **Compton-y detection** — rising to **~9σ** under the
strictest controls (nulls matched to the spine points' galactic-latitude
distribution): the extracted spine networks sit on measurably hot gas, so
the web the methods draw is physically real. Follow-up tests showed the
signal is carried mostly by the gas of the survey galaxies' own halos —
gas *between* the halos stays a ~2σ hint at Planck's depth. Second, the
Hessian's spines carry more of the signal than the lift's on every
statistic, consistent with everything above. Third — and this is the
lift's one clean win, replicated from simulation to sky — its spine
tangents align with the tidal eigenframe at 0.677 ± 0.016 vs the Hessian's
0.617 ± 0.016 across all eighteen tiles (isotropic null 0.5). The lifted
geometry reads the *anisotropy* of the real cosmic web better, even while
the simpler model finds its mass better.

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

The honest arc of the program: a beautiful theory, a benchmark that
appeared to confirm it spectacularly, a hidden head start discovered
*because* a later experiment tightened the measuring stick, and a levelled
verdict in which the simple model wins nearly everything — with the lifted
geometry surviving as an anisotropy descriptor, a hybrid ingredient, and a
physics probe. Each refutation (the uneven race, junctions, diffusion,
gravity ribbons, transport) redirected the next experiment, and the
dynamical instrument independently rediscovered textbook Zel'dovich pancake
physics, which is what lets us trust the negatives. If the article leaves
one lesson, it is not about cosmology: **when you promise a fair
comparison, measure the thing that actually wins races.** We held equal a
stand-in quantity and assumed the final one would follow; it drifted 19%,
and the drift wore the costume of a discovery for exactly as long as nobody
re-measured it.

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
