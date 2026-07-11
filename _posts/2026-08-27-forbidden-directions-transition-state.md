---
layout: distill
title: "The Transition State: Reading a Null Collision from One Point"
subtitle: >
  Magnetic nulls are born and destroyed in pairs, and the instant of birth passes through a
  degenerate null — the transition state of reconnection. This post gives that unstable
  configuration its own invariant (Q = 7, the law's first k = 2 test), shows that a merging
  pair's separation can be read from a single point as a scale crossover, hunts real pairs
  on the Sun — and then leaves the Sun entirely, finding the program's first spiral nulls
  in the Earth's own magnetotail.
date: 2026-08-27 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-nulls, bifurcation, reconnection, magnetosphere, tsyganenko, real-data]
image: /public/img/posts/forbidden-directions-6.svg
description: >
  Part 6 of the Forbidden Directions series: the fold (saddle-node) bifurcation of magnetic
  nulls, Q = 7 at the degenerate point, the pair-separation scale crossover with its dilation
  collapse, a real-Sun pair census with an honest partial verdict, the raw-grid scale-window
  repair, and the null constellation of Earth's magnetosphere with 79 spiral nulls.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 6
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-24-forbidden-directions-null-gallery %}">Part 5</a> settled the
division of labour: detection, order, and gradient belong to the sub-Riemannian invariants;
type classification belongs to the linear fit. This part goes where a pointwise fit cannot
follow at all — the <em>unstable</em> configurations through which magnetic topology changes —
and then takes the detector to a world with genuinely non-force-free currents.
</div>

## A null is a place; reconnection is an event

Everything so far treated nulls as static. But coronal nulls appear and disappear as flux
emerges and cancels, and topology dictates *how*: **in pairs of opposite sign**, through a
**fold** (saddle–node) bifurcation. Run the film of a null birth backwards: two generic
nulls — one positive, one negative — drift together, merge, and vanish. At the instant of
merging the field vanishes not linearly but **quadratically**: a *degenerate null*, the
transition state of reconnection. It is structurally unstable, which is exactly why it
matters — it is the configuration the field passes *through* when its topology changes.

The standard eigenvalue toolkit sees this moment only as $\det\nabla\mathbf B \to 0$, a
numerical zero test with no scale attached. The growth vector has a *law* for it.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-coronal-skeleton">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-coronal-skeleton.png"
      alt="The real Sun rendered as a sphere textured with the full-disk SDO/HMI magnetogram of 2012-03-07, sunspot groups visible; above AR11429 a blue arcade of extrapolated field lines and orange field lines threading the detected coronal null marked by a star, with an inset close-up of the null's spine and fan"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The stage, rendered from real data.</strong> The actual Sun of 2012-03-07
    (the X5.4-flare day): the full-disk SDO/HMI magnetogram textured on the solar
    sphere — the dark and bright specks are real sunspot groups — with the AR11429
    potential-field extrapolation embedded at its true disk position and height scale.
    Blue: the arcade over the strong flux. Orange: field lines threading the detected
    coronal null (★); the inset card is the close-up — its spine rising, its fan
    sweeping away. Every curve is a field line of the real extrapolation; nothing is
    drawn by hand. Pipeline:
    <code>research/preferred-directions/scripts/render_real_assets.py</code>.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-anatomy-sun">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-null-anatomy-sun.png"
      alt="Two rows of null-anatomy panels for the AR11429 coronal nulls: three orthogonal projections of real field lines with the spine drawn as orange arrows and the fan plane as a blue dashed ellipse, plus a type schematic with eigenvalues"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The anatomy of the two real nulls.</strong> Each row is one coronal null of
    the AR11429 volume; the three panels are its orthogonal projections — real traced
    field lines (blue), the <em>spine</em> (orange arrows, the principal axis), the
    <em>fan plane</em> (blue dashed ellipse) — with the type schematic and the measured
    $\nabla\mathbf B$ eigenvalues at right. Note $J_\parallel = 0.00$ on both: a
    potential field is current-free, exactly as the force-free theorem demands of its
    radial-only nulls.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The fold, and the law's third point

The divergence-free normal form of the collision is one family:

$$
\mathbf B_\mu = \Big(xz,\;\; yz,\;\; \mu - z^2 + \tfrac{x^2+y^2}{2}\Big),
$$

For $\mu > 0$ it has two nulls at $(0,0,\pm\sqrt\mu)$ — a radial pair of opposite sign,
the canonical creation topology. At $\mu = 0$ they merge into one isolated null where
$\lvert\mathbf B\rvert \sim r^2$: field vanishing of order $k = 2$. The law
$Q = d + k + 2$ then demands $Q = 7$ — a value never measured before in this program.

Measured (with an exact vector potential, so the sub-Riemannian structure is genuine):
**weights $(1,1,1,4)$, $Q = 7$** at the fold point; $(1,1,1,3)$, $Q = 6$ at each split
null. The law now stands tested at $k = 0, 1, 2$ in three dimensions. The transition
state of reconnection has its own integer.

## Reading a collision from one point

Here is the observable nothing pointwise can imitate. Stand at the **midpoint** of a
split pair — not at either null; the field there is nonzero — and measure the local flux
exponent $w_4(r)$: how the reachable holonomy scales with probe radius $r$.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-fold-crossover">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-fold-crossover.png"
      alt="Three panels: the local flux exponent at the pair midpoint crossing from 2 to 4 at the half-separation for four values of mu; the same curves collapsing onto one universal crossover when radius is rescaled by sqrt(mu); and the null-centred curve going from 3 to 4 with the degenerate control flat at 4"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The crossover, and its collapse.</strong> <em>A:</em> at the pair midpoint the
    exponent sits at 2 (locally uniform field) until the probe radius reaches the pair,
    then climbs to 4 (the degenerate parent); the knee marches with the half-separation
    $\sqrt\mu$ (dotted verticals). The $\mu=0$ control (orange) is flat at 4 across two
    decades. <em>B:</em> plotted against $r/\sqrt\mu$, all four separations lie on
    <strong>one universal curve</strong> — the dilation symmetry of the geometry.
    <em>C:</em> centred on a member null: plateau 3 (a single generic null), rising to 4
    when the probe swallows the partner. Pipeline:
    <code>research/preferred-directions/scripts/run_p4_fold.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

Read the three plateaus as a dictionary: $w_4 = 2$ — you are in ordinary field; $3$ — a
generic null is at hand; $4$ — a *degenerate* structure. And the knee of the curve reads
the **separation of a pair the probe never resolves individually**. A pointwise method
must distinguish two zeros to know there are two; this reads their distance from one
point's scaling. It is the first observable in this series with no standard analogue —
and one honest catch came with it: the vector potential's symmetric gradient at the probe
point contributes curl-free junk at $r^2$ that masks the physics. It is the gradient of
an exact form, so it subtracts off cleanly at the endpoint; the estimator now does this
in general, and every earlier result was re-verified unchanged.

*No analogue*, however, *does not mean no competitor* — and we raced it, pre-registered,
against the obvious statistical rival: fit a divergence-free quadratic field model to the
same noisy grid and root-find it. The fit wins every cell, by one to four orders of
magnitude, in a clean and a contaminated leg alike — so for *quantitative* pair
metrology, fit and root-find; the crossover stands as the concept (and $Q=7$ at the fold
as intrinsic geometry), not the estimator. That is the same division of labour Part 5
found for classification, now measured twice.

## On the real Sun: a census, a partial, and a repair

Do real coronal fields carry such pairs? Scanning twelve active-region volumes across the
three real days: **four same-volume pairs**, the closest at 23.4 px (2012-03-07). At its
midpoint, on the real extrapolation's own vector potential:

</div><!-- /.l-body -->

<figure class="l-body" id="fig-solar-pair">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-solar-pair.png"
      alt="The local flux exponent at the midpoint of the closest real solar null pair: starting at 2, rising through 3 near the half-separation, then relaxing — the rising edge of the crossover without the degenerate plateau"
      style="max-width:min(100%,460px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The crossover on the real Sun — honestly partial.</strong> The rising edge is
    there: $w_4$ starts at 2 and climbs through $\sim3$ as the probe reaches the pair
    scale. The degenerate plateau at 4 is not — correctly: a 23-px pair embedded in a busy
    active region is two independent nulls, not a fold in progress, and beyond the pair
    scale the background field takes over. The clean signature awaits a genuinely
    <em>merging</em> pair, i.e. a flux-emergence magnetogram sequence. Pipeline:
    <code>research/preferred-directions/scripts/run_p4_solar_pairs.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The same measurement paid an unexpected dividend. Part 4 reported that the raw gridded
field could not resolve the null jump and fell back to the measured Jacobian. The pair
study shows the failure was the *probe window*, not the grid: probed at sub-pixel radii
the interpolation has flattened everything, but in the window **above the grid cell and
below the surrounding structure** (1.5–10 px here), the raw real field returns the null
flux weight $w_4 \approx 3$ directly. On gridded data the detector is not
resolution-limited; it is **scale-windowed** — choose the window consciously and it
works on the data as it comes.

## New worlds: where the spiral nulls actually live

Part 5 proved a door shut: in any force-free field the current $\mathbf J = \alpha\mathbf B$
vanishes wherever $\mathbf B$ does, so $\nabla\mathbf B$ is symmetric at every null —
**no solar extrapolation can ever host a spiral null**. The contrapositive says where to
look: a place with genuinely non-force-free currents. The nearest one is over our heads.

The Earth's magnetosphere carries real current systems — magnetopause, tail, ring — and
empirical field models (internal IGRF plus the Tsyganenko T96 external field) encode
them, fitted to decades of spacecraft data. On our solar storm day (2012-03-07, southward
IMF, $D_{st}=-50$ nT), Newton descent from cusp and tail seeds finds **149 magnetic
nulls — and 79 of them are spiral**: the first spiral nulls of this entire program on a
field with observational pedigree, sitting exactly where the theorem permits them.
The growth vector returns $Q = 6$ at every one, radial and spiral alike.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-magnetosphere">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-magnetosphere.png"
      alt="Meridional map of Earth's magnetosphere field magnitude from IGRF plus Tsyganenko T96: compressed dayside, magnetopause boundary, and the dark tail current sheet, with white field lines"
      style="max-width:min(100%,760px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The fourth world.</strong> Noon–midnight cut of $\lvert\mathbf B\rvert$
    (log scale) in the IGRF + Tsyganenko T96 field for 2012-03-07 storm conditions: the
    compressed dayside, the magnetopause, and the dark ribbon of the tail current sheet —
    the genuinely non-force-free structure the Sun's extrapolations cannot have. The null
    population sits off this plane, at the flank/lobe boundary (next figure).
    Pipeline: <code>research/preferred-directions/scripts/run_p4_magnetosphere.py</code>.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-constellation">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-null-constellation.png"
      alt="Two projections of the 125 core magnetospheric nulls: from above and from the side, radial nulls in blue and spiral nulls in orange clustering along the nightside flank current regions"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The null constellation.</strong> The magnetospheric null census in two
    projections (ecliptic and noon–midnight; 24 far-tail nulls beyond
    $\lvert x\rvert = 40\,R_E$ omitted). Spiral nulls (orange) trace the nightside flank
    current regions and the high-latitude lobe boundary; radial nulls (blue) line the
    plasma-sheet flanks. Honest caveats: these are nulls of an <em>empirical model</em>
    fitted to data — not directly measured zeros — the population sits where the model's
    current closure is least constrained, and no dayside cusp nulls converge in T96's
    soft magnetopause. Cross-matching against in-situ Cluster/MMS null catalogues is the
    recorded next step.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-anatomy-earth">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-null-anatomy-earth.png"
      alt="Two rows of null-anatomy panels for magnetospheric nulls: the radial null shows a clean X of field lines about its spine and fan; the spiral null shows a tightly wound bundle, with complex eigenvalues and strong field-aligned current"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The two species, dissected.</strong> The same anatomy for two core-census
    magnetospheric nulls. <em>Top:</em> a radial null — straight fan, real eigenvalues,
    $J_\parallel \approx 0$. <em>Bottom:</em> a spiral null — complex fan pair and
    $J_\parallel = -7$: the field-aligned current the force-free theorem requires. Its
    winding is so rapid ($\lvert\mathrm{Im}/\mathrm{Re}\rvert \approx 20$ — many turns
    per e-fold of radius) that the fan renders as a tight bundle rather than a visible
    corkscrew — the dense tube <em>is</em> the visual signature of a fast spiral.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

And the worlds beyond, honestly scoped: planetary *internal* fields (Uranus's and
Neptune's wonderfully lopsided multipoles) are vacuum fields — curl-free, so the theorem
allows only radial nulls there; magnetars have no observed field *maps* to detect
anything in; and black-hole magnetospheres are general-relativistic objects whose flux
lift must first be rebuilt on curved spacetime. That last one is a genuine frontier, not
an afternoon.

## Where the series now stands

| Question about a null | Right tool | Status |
|---|---|---|
| Is one here? | $Q\colon 5\to6$ | grounded on 3 worlds: battery, Sun, magnetosphere |
| What order? Is it a **transition state**? | $Q = k+5$: generic 6, **fold 7** | law tested at $k = 0,1,2$ |
| An unresolved **pair**'s separation? | concept: the $w_4(r)$ knee · tool: a polynomial fit + roots | knee confirmed synthetically; the fit won the pre-registered race (Part 7) |
| How is the field changing nearby? | caustic: $\delta = 1-\tfrac2\pi K(2\varepsilon)$ | exact law (Part 7) |
| Radial or spiral, which sign? | the local linear fit | stays with the standard toolkit (Part 5) |

## Glossary

- **Fold (saddle–node) bifurcation** — the generic way nulls are created/destroyed: a
  pair of opposite-sign nulls merging through one degenerate null.
- **Degenerate null** — $\mathbf B = 0$ with $\det\nabla\mathbf B = 0$; here the fully
  quadratic point ($\lvert\mathbf B\rvert \sim r^2$, $k=2$), giving $Q = 7$.
- **$w_4(r)$** — scale-resolved flux exponent: the local log–log slope of the reachable
  holonomy versus probe radius; plateaus 2 / 3 / 4 = uniform / generic null / degenerate.
- **Scale window** — on gridded data, the probe range (cell size $\lesssim r \lesssim$
  structure scale) in which reach exponents are meaningful.
- **GSM / $R_E$** — geocentric solar-magnetospheric coordinates ($x$ to the Sun); Earth radii.
- **T96** — Tsyganenko 1996 empirical external-field model (magnetopause, tail, ring
  currents), parameterised by solar-wind pressure, $D_{st}$, and IMF; here
  $(3\,\text{nPa}, -50\,\text{nT}, B_z = -5\,\text{nT})$.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_p4_fold.py           # Q=7 + the crossover
../cosmic-web/.venv/bin/python scripts/run_p4_solar_pairs.py    # real pair census
../cosmic-web/.venv/bin/python scripts/run_p4_magnetosphere.py  # the 149-null census
../cosmic-web/.venv/bin/python scripts/render_real_assets.py    # the real-data renderings
```

Charter and reports: `docs/PROGRAM-P4-bifurcations-new-worlds.md`, `S1-fold-crossover.md`,
`S2-solar-pairs.md`, `S3-new-worlds.md`.

</div><!-- /.l-body -->
