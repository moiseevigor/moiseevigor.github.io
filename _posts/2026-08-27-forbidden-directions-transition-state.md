---
layout: distill
title: "The Transition State: Reading a Null Collision from One Point"
subtitle: >
  Magnetic nulls are born and destroyed in pairs, and the instant of birth passes through a
  degenerate null — the transition state of the field's topology. This post gives that
  unstable configuration its own invariant (Q = 7 for the symmetric family; corrected at a
  certified real-data collision to Q = 6 for a generic rank-2 fold), shows that a merging
  pair's separation can be read from a single point as a scale crossover, certifies a fold
  in a boundary blend of two measured magnetograms — and then leaves the Sun for the Earth's
  magnetosphere, where the census's own boundary audit retracts its "79 spiral nulls".
date: 2026-08-27 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-nulls, bifurcation, reconnection, magnetosphere, tsyganenko, real-data]
image: /public/img/posts/forbidden-directions-6.svg
description: >
  Part 6 of the Forbidden Directions series: the fold (saddle-node) bifurcation of magnetic
  nulls, Q = 7 at the degenerate point, the pair-separation scale crossover with its dilation
  collapse, a real-Sun pair census with an honest partial verdict, the raw-grid scale-window
  repair, and the null constellation of Earth's magnetosphere, whose 79 spiral nulls the
  boundary audit retracts.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 6
hidden: true
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-24-forbidden-directions-null-gallery %}">Part 5</a> settled the
division of labour: local confirmation of a null, its order, and the gradient belong to the sub-Riemannian invariants;
type classification belongs to the linear fit. This part goes where a pointwise fit cannot
follow at all — the <em>unstable</em> configurations through which magnetic topology changes —
and then takes the growth-vector read-out to a world with genuinely non-force-free currents.
</div>

## A null is a place; reconnection is an event

Everything so far treated nulls as static. But coronal nulls appear and disappear as flux
emerges and cancels, and topology dictates *how*: **in pairs of opposite sign**, through a
**fold** (saddle–node) bifurcation. Run the film of a null birth backwards: two generic
nulls — one positive, one negative — drift together, merge, and vanish. At the instant of
merging the field vanishes not linearly but **quadratically**: a *degenerate null*, the
transition state of the field's topology. It is structurally unstable, which is exactly
why it matters — it is the configuration the field passes *through* when its topology
changes. (Whether any *reconnection* — non-ideal evolution with a parallel electric
field — accompanies that change is a separate, dynamical question; see the section
below. The definitive statement of that separation — reconnection needs a localised
non-ideal region and can proceed with no null at all — is Pontin &amp; Priest 2022,
<em>Living Rev. Solar Phys.</em> 19, 1.)

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

<figure class="l-middle" id="fig-aia-overlay">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-aia-overlay.png"
      alt="The real SDO/AIA 171 angstrom EUV corona of AR11429, glowing loop systems in gold, with our extrapolated potential-field lines overlaid: the blue arcade draping over the observed loops and the long orange fan of the null sweeping across the frame from the starred null"
      style="max-width:min(100%,820px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The corona computed, over the corona seen.</strong> The real EUV corona of
    AR11429 at the same hour — SDO/AIA 171 Å, million-kelvin plasma lighting up the true
    field lines — with <em>our</em> potential-field extrapolation drawn on top (blue: the
    arcade; orange: the null's spine and fan, ★ the null). The circled <strong>+/−</strong>
    mark the bipole's two magnetic poles (flux-weighted centroids of the measured surface
    field); arrowheads give the direction of $\mathbf B$, running + → −; the inset shows
    where on the full solar disk this frame sits (N up). The two datasets are
    independent: AIA sees plasma, HMI measured the surface field the extrapolation grew
    from — and cross-registering them required correcting HMI's 180° camera rotation
    (CROTA2) against AIA's upright frame, with the disk geometry taken from the FITS
    headers. The arcade is traced in the flux-centred extrapolation window (which
    contains the full loop system) and the null's fan in the null-centred window
    (which gives its lines room) — two potential-field volumes of the same
    magnetogram. Departures are expected and honest: a potential
    field carries no currents, and this region was anything but current-free (it flared
    X5.4 the same day).
  </figcaption>
</figure>

<figure class="l-middle" id="fig-aia-flare">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-aia-flare.gif"
      alt="Animated sequence of thirty-two real SDO/AIA 171 angstrom frames spanning three hours: the X5.4 and X1.3 flares of 2012-03-07 erupting and reorganising the coronal loops of AR11429, with our extrapolated skeleton re-computed frame by frame from the matching magnetograms"
      style="max-width:min(100%,640px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The skeleton evolving through the detonation.</strong> Thirty-two real
    AIA 171 Å frames spanning 00:00–03:06 UT (6-minute cadence), and the skeleton
    <em>evolves with the Sun</em>: each frame's overlay is re-extrapolated from its
    own HMI magnetogram (measured at the matching minute), the arcade re-traced from
    the same physical footpoints across the full field of view (every loop system in
    frame gets its lines, both poles included), and the null re-detected and
    identity-tracked in a stable co-rotating domain. Watch the measured track: the
    null <strong>descends from 3.9 px toward the surface exactly through the X5.4
    flare</strong> (h = 1.5 px at the 00:24 peak; heights in extrapolation-grid pixels,
    $1\ \text{px} \approx 3.23'' \approx 2.3$ Mm in the plane of the sky on this day —
    derived from the FITS headers in Part 5, <code>artifacts/hmi_scale.json</code> — so
    $\approx 9$ Mm falling to $\approx 3.5$ Mm), flickers at its detection floor
    through the X1.3 impulsive phase (lost 01:12–01:30), and is <strong>re-found from
    01:36 onwards</strong> as the region settles, riding at h ≈ 2–3.5 px (≈ 5–8 Mm) to the end —
    24 of 32 frames in all, within this windowed potential model at survey
    resolution. And the deeper honest point stands: a potential field holds <em>no
    free energy</em>, so the skeleton can only breathe with the boundary data while
    the EUV corona reorganises violently — that difference <em>is</em> the flare.
    The null's fan lines are traced to their full extent: born at the null in its
    survey volume and <em>continued past its walls in a wider extrapolation of the
    same magnetogram</em>, ending where they reach the photosphere (crisp) or the
    edge of the modelled region (fading). Frames exposure-normalised, per-frame FITS
    registration. Pipeline: <code>fetch_aia_seq.py</code> +
    <code>fetch_hmi_seq.py</code> + <code>render_aia_gif</code>; null track in
    <code>artifacts/aia_gif_null_track.json</code>. <em>Footnote:</em> the full
    cinematic sequence of this region is on YouTube —
    <a href="https://www.youtube.com/watch?v=4qIV1iPUOxY">AR11429 2012-03-07,
    SDO/AIA 171 Å</a> (NASA SDO footage).
  </figcaption>
</figure>

<figure class="l-middle" id="fig-anatomy-sun">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-null-anatomy-sun.png"
      alt="One row of three null-anatomy panels for the single interior coronal null of the AR11429 volume, in the null's own frame: A, a 3D skeleton with a translucent fan disc and the orange spine axis; B, the view down the spine, axes fan-plane coordinates e1 and e2 in extrapolation-grid pixels (linear, minus 12 to 12; one pixel is about 2.3 megametres), blue fan field lines radiating from the null; C, the side view, x axis fan-plane coordinate e1 and y axis spine coordinate in pixels (linear), orange spine lines vertical and the fan edge-on"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The anatomy of a real null.</strong> The one interior coronal null of
    the null-recentred AR11429 volume (height $h = 4$ px $\approx 9$ Mm; the panels span
    $\pm 12$ px $\approx \pm 28$ Mm), drawn in the null's
    <em>own frame</em> (the visual grammar of
    Pontin &amp; Priest 2022: colour = topological role). <em>A:</em> a 3D skeleton with the
    translucent ideal fan disc (dashed rim) and the spine axis (orange arrows).
    <em>B:</em> the view <em>down the spine</em> — axes are the two fan-plane
    coordinates $e_1, e_2$ in extrapolation-grid pixels, linear — where the real traced
    fan lines (blue) radiate from the null; the dashed circle is the rim of the ideal
    fan disc. <em>C:</em> the side view, with the <em>spine</em>
    (orange; vertical axis = spine coordinate in px, linear) vertical and the fan
    edge-on (dashed line). Gray lines are ambient field; the open
    circle at the null is coloured by topological degree (blue $+1$, red $-1$); a line
    that sweeps in along the fan and leaves along the spine is split at the null and
    carries both colours. The measured invariants: radial type, degree $+1$, fan-in,
    normalised $\nabla\mathbf B$ eigenvalues $(1.00,\,-0.30,\,-0.71)$, SR growth vector
    $Q = 6$. Here and below "normalised" means
    $\widehat M = \nabla\mathbf B / \max_i\lvert\lambda_i(\nabla\mathbf B)\rvert$ (trace
    removed), so the largest eigenvalue has modulus 1, and
    $J_\parallel \equiv (\nabla\times\widehat M\mathbf r)\cdot\hat{\mathbf s}$ is the
    spine-parallel component of the curl ($\mu_0\,\mathbf j\cdot\hat{\mathbf s}$, with
    $\hat{\mathbf s}$ the unit spine eigenvector) in units of that largest eigenvalue —
    a dimensionless number. Note $J_\parallel = 0.00$: a
    potential field is current-free, exactly as the force-free theorem demands of its
    radial-only nulls. (This is a null <em>of the survey window's extrapolation</em>;
    low potential-field nulls are window-sensitive — see the window-sensitivity check in
    the R3 report, the write-up of Part 5's real-gallery experiment,
    <code>research/preferred-directions/docs/R3-real-gallery.md</code>.)
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The fold, and the law's third point

The divergence-free normal form of the collision is one family:

$$
\mathbf B_\mu = \Big(xz,\;\; yz,\;\; \mu - z^2 + \tfrac{x^2+y^2}{2}\Big).
$$

For $\mu > 0$ it has two nulls at $(0,0,\pm\sqrt\mu)$ — a radial pair of opposite sign,
the canonical creation topology. At $\mu = 0$ they merge into one isolated null where
$\lvert\mathbf B\rvert \sim r^2$: field vanishing of order $k = 2$. The law
$Q = d + k + 2$ then demands $Q = 7$ — a value never measured before in this program.

Measured (with an exact vector potential, so the sub-Riemannian structure is genuine):
**weights $(1,1,1,4)$, $Q = 7$** at the fold point; $(1,1,1,3)$, $Q = 6$ at each split
null. The law now stands tested at $k = 0, 1, 2$ in three dimensions. The transition
state of magnetic topology has its own integer.

## Reading a collision from one point

Here is the observable nothing pointwise can imitate. Stand at the **midpoint** of a
split pair — not at either null; the field there is nonzero — and measure the local flux
exponent $w_4(r)$: how the reachable holonomy scales with probe radius $r$.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-fold-crossover">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-fold-crossover.png"
      alt="Three panels sharing the y axis, local flux exponent w4 (dimensionless, linear, 1.5 to 4.6): A, against probe radius r in model units (log scale), the exponent at the pair midpoint crossing from 2 to 4 at the half-separation for four values of mu, with the mu equals zero control flat at 4; B, the same curves against r over sqrt(mu) in half-separations (log scale) collapsing onto one universal crossover; C, the null-centred curve going from 3 to 4 with the fold-point control flat at 4"
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
    when the probe swallows the partner (blue squares, against $r/\sqrt\mu$; the
    orange fold-point control is plotted against $r$). Colours, shared by all panels:
    orange = $\mu = 0$ (the fold point); dark purple → light green =
    $\mu = 0.01, 0.04, 0.09, 0.16$. Dashed horizontals are the reference levels named
    at the right margin: $w_4 = 2$ uniform field, $3$ single null, $4$ fold point; the
    dotted vertical in B is $r = \sqrt\mu$. Pipeline:
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

Do real coronal fields carry such pairs? Scanning twelve active-region volumes (four
windows per day, a wider net than the two per day of Part 5's gallery) across the
three real days: **four same-volume pairs**, the closest at 23.4 px (2012-03-07) — about $54$ Mm:
throughout this post "px" is one cell of the extrapolation grid, $\approx 3.23''$ or
$\approx 2.3$ Mm in the plane of the sky (full-disk HMI resampled to 1024 px, then each
window by a further factor $1.6$; Part 5 derives it from the FITS headers). At its
midpoint, on the real extrapolation's own vector potential:

</div><!-- /.l-body -->

<figure class="l-body" id="fig-solar-pair">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-solar-pair.png"
      alt="The local flux exponent at the midpoint of the closest real solar null pair: starting at 2, rising through 3 near the half-separation, then relaxing — the rising edge of the crossover without the degenerate plateau; x axis probe radius over half-separation (log scale), y axis flux exponent w4"
      style="max-width:min(100%,460px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The crossover on the real Sun — honestly partial.</strong> The rising edge is
    there: $w_4$ starts at 2 and climbs through $\sim3$ as the probe reaches the pair
    scale. The degenerate plateau at 4 is not — correctly: a 23-px ($\approx 54$ Mm) pair embedded in a busy
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
below the surrounding structure** (1.5–10 px here, $\approx 3.5$–$23$ Mm), the raw real field returns the null
flux weight $w_4 \approx 3$ directly. On gridded data the read-out is not
resolution-limited; it is **scale-windowed** — choose the window consciously and it
works on the data as it comes.

## The hunt, part one: does the Sun fold on camera?

The pair census above is static — one extrapolation per day. The flare sequence hands us
the other axis: **thirty-two re-extrapolations of the same co-rotating volume, six
minutes apart, through two X-class flares**. If a null pair collapsed or was born
anywhere in those three hours, a census should catch it — and topology says exactly what
to demand. Away from the volume's boundaries the total *topological degree* (the sum of
$\mathrm{sign}\det\nabla\mathbf B$ over all nulls) cannot change smoothly: the only
interior event a generic one-parameter divergence-free family allows is a **fold** — two nulls of *opposite*
degree approaching, merging through one degenerate point, and vanishing (or the mirror,
a pair born). So the hunt is a bookkeeping protocol: track every null, attribute every
birth and death (photospheric floor, lateral wall, or interior), and demand of any
interior candidate all four fold signatures at once — opposite degrees, separation
$\propto\sqrt{\lvert\lambda-\lambda_c\rvert}$, $\det\nabla\mathbf B \to 0$, and the
$w_4 \to 4$ plateau at the collision.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-solar-hunt">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-solar-hunt.png"
      alt="Left: null count and topological degree sum of the AR11429 wide volume over three hours, churning between frames with the two X-flare intervals shaded; right: the candidate pair's separation versus the blend parameter on log-log axes, flat at about six pixels while a square-root reference line falls away below it"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The solar hunt, and the impostor it caught.</strong> <em>A:</em> the
    per-frame census of the AR11429 wide volume (SDO/HMI, 2012-03-07 00:01–03:07 UT,
    6-min cadence; shaded bands = the X5.4 and X1.3 flares): 12–21 nulls per frame, and
    a degree sum that swings between $-5$ and $-17$ — the churn of marginal, low-lying
    nulls of a windowed potential extrapolation flickering against the finder, not
    interior topology change. <em>B:</em> the one candidate that survived the first cut
    (an opposite-degree pair approaching $14.5 \to 5.3$ px, i.e. $\approx 34 \to 12$ Mm,
    between 00:49 and 01:01; last seen together at 01:07, one member last seen at 01:13,
    both gone by 01:19 — tracks 1 and 38 of <code>artifacts/s5_solar_fold.json</code> —
    so the co-death is bracketed by the 01:07 and 01:19 magnetograms) interrogated by <em>boundary continuation</em>: blend
    the two measured magnetograms, $\mathrm{cut}(s) = (1-s)\,\mathrm{cut}_A +
    s\,\mathrm{cut}_B$, and track the pair in $s$. A genuine fold must close like
    $\sqrt{s_c - s}$ (gray dashed); the candidate stays flat at $\approx 6.2$ px
    ($\approx 14$ Mm; fitted slope $-0.015$), the "collision" point reads $w_4 \approx 2$ and growth
    vector $Q = 5$ — a generic point, not even a null — and neither $\pm16$-px ($\approx\pm 37$ Mm) shifted
    window reproduces it. The pair was never merging; the finder was losing a marginal
    null. (Counts here are Newton-finder censuses — dense seeding, dedup — not
    exhaustive cell censuses; the Haynes–Parnell-grade upgrade is specified in the G1
    charter — <code>docs/PROGRAM-G1-solar-gold-standard.md</code>, the chartered,
    not-yet-run gold-standard solar pipeline: vector-magnetogram boundary data,
    non-periodic extrapolation, window ensembles, exhaustive cell census.) Pipeline: <code>scripts/run_s5_solar_fold.py</code> +
    <code>scripts/run_s5b_pair.py</code>; census and blend in
    <code>artifacts/s5_solar_fold.json</code>, <code>s5b_pair.json</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The verdict is honestly negative — **no certified fold at 6-minute cadence** — and
the refutation is the valuable part. The protocol worked: a candidate that naive track
bookkeeping would have published was executed by its own physics — flat separation
where a fold demands a square root, $w_4 \approx 2$ where it demands the plateau, and
no window robustness. But time is not the only dial the measured Sun offers.

## The hunt, part two: the collider — a fold in the boundary blend, certified

The census at 00:01 UT holds one null population; the census at 03:07 UT holds a
different one. Between those two *measured boundaries* stretches a continuous family:
blend the first and last magnetograms, $\mathrm{cut}(s) = (1-s)\,\mathrm{cut}_{00:01} +
s\,\mathrm{cut}_{03:07}$, and extrapolate each blend. The Sun itself moved from one
endpoint to the other in three hours — along *some* path in boundary-data space — and
since the interior null count differs between the endpoints, **every continuous path
between them either crosses fold walls or passes a null through the window boundary**
(in a windowed model the count can change both ways, so the fold is not forced — it
must be found). The straight path is the one we can walk with a
microscope, and on it the change happens by an interior collision: the certified fold
below.

And the microscope here is unreasonably good. The potential extrapolation is a finite
sum of Fourier modes — an *analytic* function of position of which the grid is merely a
sampling — so Newton's method on the mode sum locates nulls at machine precision,
arbitrarily far below the pixel. A pair whose entire approach happens inside one grid
cell (invisible to any gridded finder) is fully resolvable. With that: track the census
along $s$, walk every newborn null backward to where it dies, recover its opposite-degree
twin along the fold axis (the kernel of $\nabla\mathbf B$), and drive the pair into its
collision with adaptive continuation.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-collider">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-collider.png"
      alt="Three panels: the two nulls' paths in the window plane converging onto a star marking the fold; the pair separation against distance-to-fold on log-log axes following a square-root law over more than four decades with the determinants falling alongside; and the flux-exponent curves whose knee marches to zero, settling on the generic-null value three at the collision"
      style="max-width:min(100%,980px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>Two coronal nulls collapse into one another — the fold signatures pass
    (the fourth in refined form: a collapsing knee on plateau 3, not the pre-registered
    plateau 4); the separate window-robustness check fails and is reported below.</strong>
    The certified fold of the AR11429 boundary blend at $s_c = 0.14095804$ (window
    position $x \approx 11.8$, $y \approx 209$, height $z \approx 3.7$ px, i.e.
    $\approx 8.5$ Mm above the photosphere at $2.3$ Mm per grid pixel).
    <em>A:</em> the two nulls' paths (blue: degree $+1$, orange: degree $-1$; colour =
    blend $s$), walked with predictor–corrector continuation into the collision (★).
    <em>B:</em> the pair separation against $\delta = s - s_c$ on log–log axes:
    the fitted slope is <strong>0.4999</strong> against the fold's exact $\tfrac12$,
    holding over more than four decades down to a separation of $10^{-5}$ px —
    a hundred-thousandth of a pixel (nominally $\sim 20$ m: a statement about the
    analytic blend family, not about anything the $\approx 2.3$-Mm data resolve),
    courtesy of the spectral microscope; both members'
    $\det\nabla\mathbf B \to 0$ alongside (orange triangles, scaled). <em>C:</em> the
    SR read: the $w_4(r)$ crossover knee marches to zero with the shrinking pair, and
    at the collision the curve settles on the <em>generic-null</em> plateau 3
    ($Q = 6$) — not the plateau 4 ($Q = 7$) of this post's symmetric fold family. That
    deviation is a finding, not a failure: see below.
    Pipeline: <code>scripts/run_s5c_blend_fold.py</code> →
    <code>artifacts/s5c_blend_fold.json</code>.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-collider-anatomy">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-collider-anatomy.png"
      alt="Three field-line panels in the fold plane: two X-type null structures three pixels apart with degree labels; the same two structures almost touching; and the merged degenerate point at the critical blend value, its field lines forming a single cusped pattern"
      style="max-width:min(100%,980px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The collision, in field lines.</strong> Field lines of the blended
    extrapolation traced in the fold plane (horizontal axis = the fold axis, the kernel
    direction of $\nabla\mathbf B$ at the collision; the same real AR11429 volume as
    the flare sequence). <em>A:</em> at $s_c + 0.05$ the two nulls (★, degrees
    labelled) sit $\approx 3$ px ($\approx 7$ Mm) apart, each with its own X-type line structure.
    <em>B:</em> at $s_c + 0.004$ they nearly touch. <em>C:</em> at $s_c$ one degenerate
    point (gold ★) remains — below $s_c$ the field is null-free here: the pair has
    annihilated. This is the fold sequence of the normal form above, drawn by measured solar boundary data.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The catch also **refined the law it was sent to test**. The symmetric fold family $\mathbf B_\mu$ predicts
plateau-4 and $Q = 7$ at the collision — but that family's degenerate point has
$\nabla\mathbf B = 0$ entirely, a *symmetric* normal form. A generic fold is milder:
at the collision the Jacobian keeps rank 2 — exactly one eigenvalue crosses zero (that
is what $\det \to 0$ with a $\sqrt{\delta}$ pair means) — so the field still vanishes
*linearly* in two directions, and the growth vector correctly answers $k = 1$:
$Q = 6$, flux exponent 3. (Stated with hypotheses and proved as Corollary 5.1 of the
[companion article](/articles/magnetic-flux-lifts/): the homogeneous dimension is blind
to any *generic* fold, because $k \ge 2$ would need the entire Jacobian to vanish —
codimension 8 in the trace-free space $\nabla\cdot\mathbf B = 0$ leaves it, not the
fold's codimension 1.) The plateau-4 belongs to the fully
degenerate normal form; what survives contact with real data is the **collapsing knee**
— the $w_4(r)$
crossover whose elbow marches to zero like $\sqrt{s - s_c}$, visible in panel C above.
The honesty boxes, filled: the two flanking window shifts do <em>not</em> reproduce
this particular fold ($+16$ px pushes the event region out of frame; $-16$ px has
different null content at the matching position — window-sensitivity operating at
event level, on a low null at $z \approx 3.7$ px ($\approx 8.5$ Mm), exactly the fragile class the R3
report's window-sensitivity check documented). So the precise claim is: **a fold of the windowed family built from two
measured magnetograms, certified to machine precision** — the wall between the 00:01
and 03:07 topologies is real in that family, and its location is pinned; whether the
physical corona crossed *this particular* wall needs the global-extrapolation upgrade
the temporal hunt already ordered.

## New worlds: where the spiral nulls actually live

Part 5 proved a door shut: in any force-free field the current $\mathbf J = \alpha\mathbf B$
vanishes wherever $\mathbf B$ does, so $\nabla\mathbf B$ is symmetric at every null —
**no smooth force-free extrapolation with bounded $\alpha$ can host a spiral null**
(non-force-free and data-driven MHD extrapolations are *not* covered by the theorem).
The contrapositive says where to
look: a place with genuinely non-force-free currents. The nearest one is over our heads.

The Earth's magnetosphere carries real current systems — magnetopause, tail, ring — and
empirical field models (internal IGRF plus the Tsyganenko T96 external field) encode
them, fitted to decades of spacecraft data. On our solar storm day (2012-03-07, southward
IMF, $D_{st}=-50$ nT), Newton descent from cusp and tail seeds finds **149 magnetic
nulls — and 79 of them are spiral**, sitting exactly where the theorem permits them.
The growth vector returns $Q = 6$ at every one, radial and spiral alike.

The bifurcation hunt (below) forced a sharper audit of this census, and the result is
worth stating precisely. Testing the census nulls of the core tracking box (70 of them) against the T96
model's *own* magnetopause (the boundary function shipped with the model): **every one
lies <em>outside</em> the model boundary** (70 of 70; 33 of them within one Earth radius
of it, the rest up to $27\,R_E$ out, median $1.5\,R_E$) **— and inside its
valid domain the model has no nulls at all**, at any of the seven IMF $B_z$ values
probed from $-9$ to $+3$ nT (counts from `artifacts/s4_collider.json`,
`t96_boundary_audit`, written by `run_s4b_drive.py --audit-only`). The
smooth *average* magnetosphere of an empirical model is null-free; the census nulls are
mathematical structure of the field's continuation past its own edge (which is also why
they barely respond to the ring-current index: $\lvert\Delta\mathbf B\rvert \le 0.03$
nT for a 30-nT $D_{st}$ swing). That is physically sensible — real magnetospheric
nulls are *dynamical* creatures of the reconnecting current sheet, which is exactly
why the in-situ missions hunt them during events rather than in quiet averages — and
it upgrades the honest reading of the two figures below: they are anatomy of spiral
and radial null structure in a realistically shaped, genuinely non-force-free field —
not spacecraft-confirmed standing nulls of the magnetosphere. The MMS cross-match
stays on the books.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-magnetosphere">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-magnetosphere.png"
      alt="Meridional map of Earth's magnetosphere field magnitude from IGRF plus Tsyganenko T96, colour = field magnitude in nanotesla on a log scale from 1 to 2000, x axis GSM x from minus 35 to 12 Earth radii with the Sun to the right, y axis GSM z from minus 14 to 14 Earth radii (both linear): compressed dayside, magnetopause boundary, and the dark tail current sheet, with white in-plane field lines and Earth as a cyan disc"
      style="max-width:min(100%,760px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The third world.</strong> Noon–midnight cut of $\lvert\mathbf B\rvert$
    (log scale) in the IGRF + Tsyganenko T96 field for 2012-03-07 storm conditions: the
    compressed dayside, the magnetopause, and the dark ribbon of the tail current sheet —
    the genuinely non-force-free structure the Sun's <em>force-free</em> extrapolations
    cannot have (non-force-free and data-driven MHD extrapolations are outside that
    theorem). White arrowed lines are the in-plane field lines; the cyan disc is
    Earth (the field inside $2\,R_E$ is masked). The null census of this field counts
    <strong>149 nulls, 79 of them spiral</strong>; the
    population sits off this plane, at $\lvert y\rvert \approx 17$–$25\,R_E$ on the
    nightside flank/lobe boundary (next figure).
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
    <strong>The null constellation — continuation-only structure, outside T96's own
    validity domain</strong> (the boundary audit above places every root it tested outside
    the model's magnetopause and finds none inside; they are anatomy of the model's continuation, not standing
    magnetospheric nulls). The census in two
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
      alt="Two rows of three null-anatomy panels for magnetospheric nulls in null-frame views, radial null on top (A to C) and spiral null below (D to F): 3D skeleton with translucent fan disc; view down the spine with axes fan-plane coordinates e1 and e2 in Earth radii (linear, minus 1.6 to 1.6); side view with x axis fan-plane coordinate e1 and y axis spine coordinate in Earth radii (linear); the radial null shows ambient-dominated gray field lines, the spiral null a tight in-plane bundle of blue fan lines"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The two species, dissected.</strong> The same null-frame anatomy (3D
    skeleton, down-the-spine, side view; colour = topological role as in the coronal
    sheet: orange = spine, blue = fan lines, gray = ambient, dashed circle/line = ideal
    fan plane, open circle = the null, blue for degree $+1$; axes in $R_E$, linear)
    for two core-census magnetospheric nulls. <em>Top (A–C):</em> a radial null at GSM
    $(-12, 17, 11)\,R_E$ —
    real normalised eigenvalues $(0.66, -0.33, -0.34)$, $J_\parallel = +0.01$
    (normalisation as in the coronal sheet: $\nabla\mathbf B$ divided by its largest
    $\lvert\lambda_i\rvert$, $J_\parallel = (\nabla\times\mathbf B)\cdot\hat{\mathbf s}
    / \max_i\lvert\lambda_i\rvert$, dimensionless. The leading value is $0.66$ rather
    than $1$ because the eigenvalues are quoted <em>after</em> the trace removal, and
    here the trace is not small: the raw Jacobian at this point has eigenvalues
    $\approx(1.60,\,0.01,\,-0.00)$ nT$/R_E$ and trace $1.61$ nT$/R_E$ — the model field
    is not divergence-free there, one more symptom of the point lying outside T96's own
    magnetopause; the spiral example below has trace $\sim10^{-9}$); note how much of the local field is
    honest gray <em>ambient</em>: a T96 null is weak and buried in its surroundings.
    <em>Bottom (D–F):</em> a spiral null at GSM $(3, 15, 26)\,R_E$ — complex fan pair
    (eigenvalues $0.10,\ -0.05 \pm 1.00\,i$) and
    $J_\parallel = -6.95$ (i.e. the spine-parallel curl is about seven times the largest
    eigenvalue rate of $\nabla\mathbf B$ — dimensionless, same definition): the field-aligned current the force-free theorem requires. Its
    winding is so rapid ($\lvert\mathrm{Im}/\mathrm{Re}\rvert \approx 20$ — many turns
    per e-fold of radius) that the fan renders as a tight in-plane bundle rather than a
    visible corkscrew — the dense tube <em>is</em> the visual signature of a fast
    spiral.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

And the worlds beyond, honestly scoped: planetary *internal* fields (Jupiter's included —
Part 8 hunts its envelope and finds the polar patch dome-covered) are vacuum fields —
curl-free, so the theorem allows only radial nulls there; magnetars have no observed
field *maps* to detect anything in; and black-hole magnetospheres are
general-relativistic objects whose flux lift must first be rebuilt on curved spacetime.
That last one is a genuine frontier, not an afternoon.

## The hunt at Earth: stability, and the wall the collider maps

Could the collision be staged at Earth too? The audit above answers for T96: its valid
interior owns no nulls, so there is nothing to collide. But the *classical* outer
magnetosphere — the Chapman–Ferraro/Dungey vacuum superposition of the planet's real
internal field (IGRF) and a uniform interplanetary field, here 5 nT — genuinely owns
the textbook pair: two neutral points at $r \approx 18\text{–}23\,R_E$ (between
$(B_0/B_{sw})^{1/3} \approx 18$ for the equatorial, anti-parallel balance and
$(2B_0/B_{sw})^{1/3} \approx 23$ for the polar one, in $R_E$ with $B_0 \approx 3\times10^4$ nT
the surface equatorial field). Rotating the IMF direction $\theta$ from northward to southward is
the natural dial, and the census tells a two-act story. For $125°$ of rotation the two
nulls just migrate — the configuration is **structurally stable**, the census flat
(sampled every $5°$ with a fixed seed battery; "stable" here means no event at that
resolution).
Then, approaching the anti-parallel orientation, the count cascades: $2 \to 3 \to 6
\to 17$. The pure-dipole textbook says why — and we ran the control rather than
citing it: replace IGRF by the same epoch's pure dipole and set the IMF exactly
anti-parallel, and $\lvert\mathbf B\rvert$ stays below $0.007$ nT around the
<em>entire</em> circle of azimuths at $r^\ast = 18.15\,R_E$ — a degenerate null
<em>ring</em> to numerical precision, the third face of the fold family from the top
of this post ($\mu < 0$). Restore the real multipoles and the same circle is
modulated eleven-fold (up to $0.078$ nT), its zeros surviving only at isolated
azimuths: the ring breaks into the swarm
(<code>scripts/run_s4d_dipole_control.py</code>). Measured up close, the swarm's nulls live in a
$0.02$-nT-flat azimuthal valley with Jacobian condition numbers near $10^2$: null
<em>identity</em> itself dissolves there, folds merging into the broken ring rather
than standing cleanly apart. The certified fold belongs to the Sun; Earth's
contribution is the phase portrait — where nulls are stable, and which walls they die
on.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-stability-walls">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-stability-walls.png"
      alt="Left: scatter of null states in the plane of normalised Jacobian determinant versus fan discriminant, forming two wings that meet at the origin, with the certified solar pair's two tracks diving into the vertical fold wall at det zero, and the type wall at disc zero marked; right: the Dungey census versus IMF angle, flat at two nulls for 125 degrees then cascading to seventeen near anti-parallel"
      style="max-width:min(100%,940px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The stability map.</strong> <em>A:</em> every null state as a point in the
    $(\widehat{\det\nabla\mathbf B},\, \widehat{\mathrm{disc}})$ plane — normalised
    Jacobian determinant (its sign is the topological degree) against the normalised
    fan-eigenvalue discriminant (positive = radial, negative = spiral). The hats are
    defined by $\widehat M = \nabla\mathbf B/\max_i\lvert\lambda_i(\nabla\mathbf B)\rvert$
    (trace removed): $\widehat{\det} = \det\widehat M$ and $\widehat{\mathrm{disc}} =
    (\mu_1-\mu_2)^2$ for the two fan eigenvalues $\mu_{1,2}$ of $\widehat M$ — both
    dimensionless, both axes linear; for a radial null $\lvert\widehat{\det}\rvert \le
    \tfrac14$, and the vertical axis is clipped to $[-0.1, 3]$ and shown to $1.06$. Pale blue: the
    135 states of the Dungey $\theta$-census (a vacuum field, so the type wall is
    untouchable — all radial, by Part 5's theorem). Dark blue/orange: the certified
    solar pair of the collider figure, whose two branches dive into the <span
    style="color:#c62828;">fold wall $\det = 0$</span> from opposite sides and
    annihilate — the only way a null count can change in the interior of a smooth
    divergence-free family. The <span style="color:#6a1b9a;">type wall
    $\mathrm{disc} = 0$</span> is the other codimension-1 crossing (radial ↔ spiral
    conversion); crossing it needs the field-aligned current the force-free theorem
    demands. Stability = distance from the walls. <em>B:</em> the Dungey census versus
    IMF angle $\theta$: the classical cusp pair is structurally stable over
    $125°$ of IMF rotation (at $5°$ sampling), then the anti-parallel <em>ring</em>
    degeneracy (the fold family's $\mu<0$ face) breaks up into a cascade — real
    multipoles shattering a textbook symmetric bifurcation into a swarm. The ring is
    measured, not cited: the pure-dipole control holds $\lvert\mathbf B\rvert <
    0.007$ nT around the whole $r^\ast = 18.15\,R_E$ circle; IGRF modulates it
    $11\times$. Degree-sum wobbles inside the shaded
    band are census resolution in the near-degenerate valley, not boundary flux.
    Pipeline: <code>scripts/run_s4c_dungey.py</code>, <code>run_s4b_drive.py</code>
    (the T96 boundary audit) → <code>artifacts/s4_collider.json</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Where the series now stands

| Question about a null | Right tool | Status |
|---|---|---|
| Is one here? | $Q\colon 5\to6$ | grounded on 3 worlds: the synthetic battery, the Sun's extrapolations, and the analytic Dungey/vacuum magnetosphere model (the empirical T96 census is retracted — continuation-only) |
| What order? Is it a **transition state**? | $Q = k+5$: generic 6; symmetric fold 7; **generic (rank-2) fold reads 6 + collapsing knee** | law tested at $k = 0,1,2$; refined by the certified collision |
| An unresolved **pair**'s separation? | concept: the $w_4(r)$ knee · tool: a polynomial fit + roots | knee confirmed synthetically; the fit won the pre-registered race (Part 7) |
| **When do nulls appear/disappear?** | the fold certificate: opposite degrees + $C\sqrt{\lvert\lambda-\lambda_c\rvert}$ + $\det\to 0$ + knee collapse | one collision certified (boundary blend, slope 0.4999); protocol also *kills* impostors |
| How is the field changing nearby? | period average: $\delta = 1-\tfrac2\pi K(2\varepsilon)$ exactly (exponential profile); the caustic agrees with it numerically (to $\lesssim 10^{-7}$) there, identification formally open | exact period-average law; caustic status separate (Part 7) |
| Radial or spiral, which sign? | the local linear fit | stays with the standard toolkit (Part 5) |

## Glossary

- **px (grid pixel)** — one cell of the solar extrapolation grid, horizontally and in
  height: $\approx 3.23''$, i.e. $\approx 2.3$ Mm in the plane of the sky ($2.32$ Mm on
  2012-03-07; from the FITS headers, `artifacts/hmi_scale.json`; derivation in Part 5).
- **Normalised Jacobian $\widehat M$, $\widehat{\det}$, $\widehat{\mathrm{disc}}$,
  $J_\parallel$** — $\widehat M = \nabla\mathbf B/\max_i\lvert\lambda_i(\nabla\mathbf
  B)\rvert$ with the trace removed (largest eigenvalue modulus 1); $\widehat{\det} =
  \det\widehat M$; $\widehat{\mathrm{disc}} = (\mu_1-\mu_2)^2$ over the two fan
  eigenvalues of $\widehat M$ (positive radial, negative spiral); $J_\parallel =
  (\nabla\times\widehat M\mathbf r)\cdot\hat{\mathbf s}$, the spine-parallel curl in
  units of the largest eigenvalue. All dimensionless
  (`src/nulltopo.py`, `classify_null`).
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
- **Topological degree** — $\mathrm{sign}\det\nabla\mathbf B$ at a null ($\pm1$). Its
  sum over a region is conserved under smooth deformation until a null crosses the
  boundary or a fold happens inside: folds create/destroy $(+1,-1)$ pairs only.
- **Boundary blend** — the straight path $\mathrm{cut}(s) = (1-s)\,\mathrm{cut}_A +
  s\,\mathrm{cut}_B$ between two measured magnetograms; extrapolating each blend gives
  a smooth 1-parameter family of coronal fields connecting two measured states.
- **Fold certificate** — the four signatures demanded of any claimed pair
  creation/annihilation: opposite degrees; separation $= C\sqrt{\lvert\lambda -
  \lambda_c\rvert}$; $\det\nabla\mathbf B \to 0$ for both members; the $w_4$ knee
  collapsing to zero. Candidates failing any one are impostors (three died that way
  during the solar hunt; this post shows one).
- **Pre-registered (as used in this series)** — the hypothesis and its
  falsification criteria are written into the experiment's docstring and committed
  before the run, in the same repository; there is no external timestamped
  registry. The practice has teeth (several pre-registered claims lost and the
  losses are published), but the term is used in this weaker, self-registered
  sense.
- **Spectral (mode-sum) Newton** — locating nulls by Newton's method on the analytic
  Fourier-mode sum of the extrapolation rather than its sampled grid; resolves pairs
  to $\sim 10^{-5}$ px, far below the grid cell.
- **Ring face / cascade** — at exactly anti-parallel dipole + uniform field the null
  set degenerates to a circle (the fold family's $\mu<0$ face); real multipoles break
  it into a swarm of near-degenerate nulls with dissolving identities.
- **Structural stability / walls** — a null configuration is stable while its
  $(\det, \mathrm{disc})$ state stays off the two codimension-1 walls: $\det = 0$
  (fold: the count changes) and $\mathrm{disc} = 0$ (type: radial ↔ spiral).

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_p4_fold.py           # Q=7 + the crossover
../cosmic-web/.venv/bin/python scripts/run_p4_solar_pairs.py    # real pair census
../cosmic-web/.venv/bin/python scripts/run_p4_magnetosphere.py  # the 149-null census
../cosmic-web/.venv/bin/python scripts/render_real_assets.py    # the real-data renderings
# the bifurcation hunt
../cosmic-web/.venv/bin/python scripts/run_s5_solar_fold.py     # temporal census (32 frames)
../cosmic-web/.venv/bin/python scripts/run_s5b_pair.py          # the impostor, executed
../cosmic-web/.venv/bin/python scripts/run_s5c_blend_fold.py    # the certified fold
../cosmic-web/.venv/bin/python scripts/run_s4b_drive.py         # T96 boundary audit
../cosmic-web/.venv/bin/python scripts/run_s4c_dungey.py        # Dungey cascade census
../cosmic-web/.venv/bin/python scripts/run_s4d_dipole_control.py # the ring, measured
../cosmic-web/.venv/bin/python scripts/render_s45_figures.py    # the four hunt figures
```

Environment of record: sunpy 8.0.0, geopack 1.0.13, scipy 1.18.0, numpy 2.5.0,
astropy 8.0.0 (the cosmic-web venv).

Charter and reports: `docs/PROGRAM-P4-bifurcations-new-worlds.md`, `S1-fold-crossover.md`,
`S2-solar-pairs.md`, `S3-new-worlds.md`, `S4-null-collider.md`, `S5-solar-fold-hunt.md`.

</div><!-- /.l-body -->
