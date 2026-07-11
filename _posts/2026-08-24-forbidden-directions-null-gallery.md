---
layout: distill
title: "The Null Gallery: Grounding the Detector in the Real Sun"
subtitle: >
  One detection is an anecdote. This post turns it into a program: a ground-truth battery of
  every null type, a classification method built from the sub-Riemannian flow, a fair race
  against the standard eigenvalue scheme under noise — and a gallery of five real coronal
  nulls on three different days of the real Sun. The verdict is honest: detection is the
  framework's to keep; classification belongs to the linear fit.
date: 2026-08-24 09:00:00
categories: [mathematics]
tags: [sub-riemannian, magnetic-nulls, solar-corona, sdo-hmi, classification, real-data]
image: /public/img/posts/forbidden-directions-5.svg
description: >
  Part 5 of the Forbidden Directions series: the R1 type battery (the detector is
  type-agnostic), the R2 integrate-vs-differentiate classification race under noise (wins
  against pointwise differences, loses honestly to the least-squares fit), and the R3 real
  gallery — five coronal nulls detected and classified across three SDO/HMI days.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 5
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-14-forbidden-directions-finding-nulls %}">Part 4</a> ended with a
single real detection: one SDO/HMI active region, one coronal null, the growth vector jumping
$Q\colon 5\to 6$ where the standard finder said it should. One data point is an anecdote, not
grounding. This post runs the program that turns it into evidence — and reports the one race
the framework loses.
</div>

## From an anecdote to a program

The standard theory of coronal nulls is not a strawman. Since Parnell, Smith, Neukirch &
Priest (1996), a null is classified by the eigenvalues of the field Jacobian
$M=\nabla\mathbf B$ at the point where $\mathbf B=0$: three real eigenvalues make a
**radial** null (an X in its fan plane), a complex-conjugate pair makes a **spiral** null
(an O), the odd-sign-out eigenvector is the **spine**, and the sign of its eigenvalue is
the null's **sign**. Detection on gridded fields is likewise settled practice — trilinear
and first-order-Taylor methods, applied routinely to potential and NLFFF extrapolations of
SDO/HMI magnetograms.

So the sub-Riemannian framing earns a place only if it *matches* that scheme where both
speak, and *adds* something where the standard scheme is silent or fragile. Three
falsifiable questions, pre-registered:

1. **H-R1** — can an SR read-out recover the Parnell type at all?
2. **H-R2** — is an *integrated* read-out more robust to noise than *differentiating* the
   field, which is what eigenvalue classification does in practice?
3. **H-R3** — does the detector reproduce a standard null catalogue on real solar data,
   plural — a gallery, not a single star on a single magnetogram?

## Every kind of null (the detector is type-agnostic)

First the battery. We build exact linear nulls of every type — radial and spiral, both
signs, each in its own randomly rotated frame, with the type *known by construction* — and
point the growth-vector detector at them, alongside the real Part-4 null. For any traceless
Jacobian $M$ there is a one-line exact vector potential $A(\mathbf r) = -\tfrac13\,
\mathbf r\times(M\mathbf r)$ with $\nabla\times A = M\mathbf r$, so the detector runs on a
genuine sub-Riemannian structure in every case, spiral nulls included.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-null-gallery">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-null-gallery.png"
      alt="Gallery of five magnetic nulls: two radial X-type fan topologies in blue, two spiral O-type in orange, and the real SDO/HMI null, each labeled with its Parnell class and the measured growth vector Q=6"
      style="max-width:min(100%,760px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The type battery.</strong> Fan-plane field lines of five nulls — synthetic
    radial$\pm$ and spiral$\pm$ with ground-truth labels by construction, plus the real
    Part-4 null (its measured Jacobian). X-type topologies in blue, O-type in orange; ★
    marks the null. The sub-Riemannian growth vector returns $Q=6$ at <em>all five</em> —
    detection recall 5/5 — but the same $Q=6$ for every type: the jump says "a null is
    here", not which kind. Pipeline:
    <code>research/preferred-directions/scripts/run_r1_gallery.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The result is clean and it sharpens the problem. The detector fires at **every** null type
— the $5\to6$ jump is real for radial and spiral alike — and precisely because of that it
carries no type information. Radial versus spiral lives in the fan topology: whether the
eigenvalues of $M$ are real or complex. If the framework wants to *classify*, it must read
that from the flow.

## Integrate or differentiate?

Here is the one place a genuine edge could exist. The standard route estimates $M$ by
**finite-differencing a noisy gridded field** — an ill-conditioned operation — and then
tests a fragile discriminant (real versus complex eigenvalues). The SR route can instead
**integrate**: field lines are the kernel foliation of the curvature 2-form $dA$, and their
behaviour near the null encodes the type with no derivative ever taken. Trajectories that
wind coherently about an axis mean a spiral; bounded winding means radial; and because
$\operatorname{div}\mathbf B=0$ forces the spine rate to beat the fan rate, the *escape-time
asymmetry* between forward and backward flow gives the sign.

So we raced them, fairly: same noisy grid instance to every method, same information ball,
true null location for all; winding threshold calibrated once at zero noise on a disjoint
battery, then frozen. Four methods: the integrated flow; pointwise central differences (the
standard practice); a least-squares linear fit of the whole ball (the strong baseline —
essentially the maximum-likelihood $\widehat M$ under white noise); and the same fit on a
half-radius ball. Two field legs: exactly linear, and linear plus a 30% divergence- and
current-free quadratic term the linear model cannot represent.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-r2-noise">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-r2-noise.png"
      alt="Four panels: accuracy versus noise for four classifiers on linear and curved fields, showing the integrated flow beating finite differences everywhere but the least-squares fit staying near perfect; and the flow classifier's confusion matrix showing radial nulls misread as spiral under noise while the sign column stays correct"
      style="max-width:min(100%,760px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The race.</strong> Four-class accuracy (radial$\pm$/spiral$\pm$) versus field
    noise $\sigma$ (relative to the RMS $\lvert\mathbf B\rvert$ over the information ball;
    600 trials per point, 95% error bars). <em>A:</em> exactly linear field. <em>B, C:</em>
    the curved leg, all nulls and the near-boundary subset. The integrated flow (orange)
    beats pointwise finite differences (blue) at every noise level — but the least-squares
    fit (grey, and green at half radius) is essentially unbeaten everywhere. <em>D:</em> the
    flow classifier's failure anatomy at $\sigma=0.2$: the <em>sign</em> columns stay nearly
    perfect (escape asymmetry is noise-robust) while noise-induced wander inflates winding,
    so radial nulls are misread as spiral. Pipeline:
    <code>research/preferred-directions/scripts/run_r2_classifier.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

**H-R1 is confirmed** — at zero noise the integrated flow recovers the full four-class
label at 0.958, missing only configurations parked next to the radial/spiral boundary,
where the types genuinely merge. An SR classification method exists.

**H-R2 splits, and the interesting half is negative.** Against the field's *standard
practice* — pointwise differences — integration wins at every noise level, in both legs.
The mechanism is real. But against the least-squares fit it loses everywhere, and the
anatomy of that loss is worth stating plainly:

- **Regression is also integration.** The least-squares fit is an integral operator over
  the ball — several thousand nodes averaging the noise down — with statistically optimal
  weights. The trajectory integral uses the same data budget less efficiently.
- **The curved leg was parity-protected** (a post-hoc finding, flagged as such): the
  quadratic contaminant is even under $\mathbf r\to-\mathbf r$ while the linear basis is
  odd, so on a centred ball the contamination is exactly orthogonal to the fit. The first
  term that actually biases a centred linear fit is cubic.
- **Winding is noise-biased upward.** Noise makes trajectories wander, wander reads as
  rotation, and radial nulls drift into the spiral bin — while the sign read-out barely
  degrades. Under noise the flow classifier decays into a good two-class sign classifier.

The morale, stated without hedging: for *classifying* a null, the community's local linear
fit is already the right tool, and the sub-Riemannian flow cannot sharpen it — it can only
beat the naive practice. Classification is a language the framework speaks, not a tool it
sharpens.

## Three days of the real Sun

Grounding, finally, means plural real data. We fetched two more genuine SDO/HMI
magnetograms — 2012-03-07, the day of AR11429's X5.4 flare, and 2014-10-22, hosting
AR12192, the largest active region of solar cycle 24 — alongside the 2011-06-07 region of
Part 4. Per day: the two most bipolar-balanced active regions, potential-field
extrapolation, the Newton null finder, and *every* interior null kept — no cherry-picking.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-hmi-triptych">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-hmi-triptych.png"
      alt="Three full-disk SDO/HMI magnetograms — 2011-06-07, 2012-03-07 with AR11429, and 2014-10-22 with the huge AR12192 — with dashed boxes marking the analysed active regions"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The raw material.</strong> The three full-disk line-of-sight magnetograms as
    SDO/HMI recorded them (red / blue = field out of / into the photosphere; peak
    $\lvert B\rvert$ labelled per disk — up to 4777 G on the AR12192 day). Dashed boxes:
    the active-region windows the pipeline extrapolates and searches. Everything below is
    computed from these three images and nothing else.
  </figcaption>
</figure>

<figure class="l-middle" id="fig-real-gallery">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-real-gallery.png"
      alt="Gallery of five real coronal nulls across three SDO/HMI days: each card shows the coronal field magnitude on a vertical slice collapsing to zero at the starred null with white streamlines tracing the topology, labeled with date, radial type, and Q=6"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The real gallery.</strong> Five coronal magnetic nulls on three days of the
    real Sun (2011-06-07; 2012-03-07, X5.4-flare day; 2014-10-22, AR12192). Each card: the
    extrapolated coronal $\lvert\mathbf B\rvert$ on the vertical plane through the null
    (log scale, dark = weak), in-plane field lines in white, ★ the detected null with its
    height. Every null: standard classification and the SR growth vector agree — $Q=6$ at
    5/5 — and the R2 flow classifier, run on the raw resampled grid, matches type
    <em>and sign</em> on all five. Pipeline:
    <code>research/preferred-directions/scripts/run_r3_real_gallery.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

Two findings ride along, and the first arrived as a caveat and left as a theorem. **All
five real nulls are radial — necessarily, and not just for potential fields.** In any
force-free field $\nabla\times\mathbf B = \alpha\mathbf B$ with bounded $\alpha$, the
current vanishes wherever $\mathbf B$ does; the antisymmetric part of
$\nabla\mathbf B$ is the dual of $\nabla\times\mathbf B$, so at a null the Jacobian is
symmetric, its eigenvalues real — *no force-free extrapolation, potential, linear
force-free, or NLFFF alike, can host a spiral null at all*. (Our Part-4 dynamo field can,
precisely because it is not force-free: all eight of its spiral nulls carry
$\lVert\nabla\times\mathbf B\rVert = \sqrt3 \neq 0$ where $\mathbf B = 0$.) So the
radial-only gallery is not half the problem — it is the *whole* problem the
extrapolation-based catalogues of solar physics can pose; genuinely spiral nulls live in
dynamic MHD and in-situ magnetospheric data. Second: the noise-fragile flow classifier
goes five-for-five here because real force-free nulls sit far from the radial/spiral
boundary — exactly the regime the R2 curves say is easy for everyone. Consistency, not
contradiction.

## The division of labour

After R1–R3 the ledger is clean enough to state as a table:

| Question about a null | Right tool | Status |
|---|---|---|
| **Is one here?** | SR growth vector: $Q\colon 5\to6$, scale-covariant, defined before any Jacobian is estimable | grounded: full type battery + five real nulls, 10/10 |
| **What order?** | SR law $Q=k+5$ | confirmed (Part 4) |
| **How is the field changing nearby?** | SR caustic: $\delta=-\varepsilon^2$ reads $\lvert\nabla\ln B\rvert$ | confirmed (Part 3) |
| **Radial or spiral, which sign?** | the local least-squares fit of $\nabla\mathbf B$ | the standard scheme keeps it — R2 |

That last row is the honest one. We built the classification method the request called
for; it works (H-R1), it beats the naive practice it was designed to beat, and a properly
fitted Jacobian still beats it. A framework that wants to be science rather than
advertising has to be able to report exactly that — and the rows above it are what it
keeps.

## Glossary

- **Null / radial / spiral / spine / fan / sign** — a point with $\mathbf B=0$; its Parnell
  class from the eigenvalues of $M=\nabla\mathbf B$: all real = radial (X), a complex pair
  = spiral (O); the spine is the odd-sign-out eigenvector, the fan its complementary
  plane, and the sign is the spine eigenvalue's sign.
- **$Q$ (homogeneous dimension)** — sum of the growth-vector weights of the flux lift;
  $Q=5$ where $\mathbf B\neq0$, $Q=6$ at a generic null.
- **Winding $W$** — median unwrapped angle swept by integrated field-line trajectories
  about their coherent rotation axis; the flow classifier's radial/spiral discriminant.
- **Escape asymmetry** — median exit time of forward- versus backward-integrated
  trajectories from the information ball; because $\operatorname{tr} M = 0$ forces the
  spine rate to exceed the fan rate, its sign is the null's sign.
- **$\sigma$ (noise level)** — standard deviation of white per-node field noise, relative
  to the RMS $\lvert\mathbf B\rvert$ over the information ball (radius 0.5, the data every
  classifier sees).
- **Parity protection** — an even-order contaminant is orthogonal to an odd (linear) basis
  on a centred symmetric ball, so quadratic curvature does not bias a centred linear fit.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_r1_gallery.py        # type battery + gallery
../cosmic-web/.venv/bin/python scripts/run_r2_classifier.py     # the race (~45 min)
../cosmic-web/.venv/bin/python scripts/fetch_hmi.py             # real HMI days (VSO)
../cosmic-web/.venv/bin/python scripts/run_r3_real_gallery.py   # the real gallery
```

Charter and per-experiment reports: `research/preferred-directions/docs/PROGRAM-P3-real-null-grounding.md`,
`R2-classifier-noise.md`, `R3-real-gallery.md`.

</div><!-- /.l-body -->
