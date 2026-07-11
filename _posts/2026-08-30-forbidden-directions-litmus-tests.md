---
layout: distill
title: "The Litmus Tests: What Survived Our Own Review"
subtitle: >
  Before claiming new science, attack it yourself. This closing part runs the referee's
  checks on the series' three novelty candidates — and reports the outcomes without
  cosmetics: one claim hardened into an exact law with a critical gradient (the caustic is
  a complete elliptic integral); one was demoted by our own pre-registered race; one was
  downgraded by the literature; and the hunt for a fold on the real Sun came back honestly
  empty-handed.
date: 2026-08-30 09:00:00
categories: [mathematics]
tags: [sub-riemannian, elliptic-integrals, magnetic-nulls, pre-registration, replication, real-data]
image: /public/img/posts/forbidden-directions-7.svg
description: >
  Part 7 of the Forbidden Directions series: the novelty audit, the exact law
  delta = 1 - (2/pi) K(2 eps) with its critical gradient eps = 1/2, the pre-registered race
  that demoted the scale crossover, the AR11158 emergence census, and the division of
  labour that stands after review.
series: preferred-directions
series_title: "The Geometry of Forbidden Directions"
series_part: 7
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-08-27-forbidden-directions-transition-state %}">Part 6</a> ended
with three candidate pieces of new science. A claim is not science until it has survived
the attacks a referee would mount — so this part mounts them ourselves: a literature
audit, a pre-registered race against the strongest statistical rival, a precision
derivation, and a real-data hunt. Everything below, including the losses, was decided by
rules written down before the experiments ran.
</div>

## The audit, first

| Candidate | Literature check | Outcome |
|---|---|---|
| *No force-free field hosts a spiral null* | the MHD-relaxation literature (Fuentes-Fernández & Parnell) already knew this **dynamically** | **downgraded**: our 3-line pointwise proof is a clarification; what remains ours is the audit corollary — a spiral null in any extrapolation-based catalogue is a numerical force-free violation, not physics |
| *The gyro-caustic series $\delta(\varepsilon)$* | guiding-centre theory has the machinery (Littlejohn, Brizard), **not the statistic** | survives → hardened below |
| *The scale-crossover pair read-out* | null detection is pointwise; multifractal "local dimension" is a different object | survives the library — so we raced it against the strongest rival we could build |

## The claim that hardened: the caustic is an elliptic integral

Part 3 measured how a magnetic-field gradient delays the refocusing of Larmor orbits:
$\delta = -\varepsilon^2 - c_4\varepsilon^4 - \cdots$ with
$\varepsilon = \lvert\nabla\ln B\rvert\,r_L$. Chasing $c_4$ to precision
($2.2497 \pm 0.0009 = 9/4$, refuting the $5/2$ a coarse fit once suggested) exposed a
coefficient pattern — squared normalised central binomials — that is the fingerprint of
one classical function. The whole series collapses into two symbols:

$$
\boxed{\;\delta(\varepsilon) \;=\; 1 - \frac{2}{\pi}\,K(2\varepsilon)\;}
$$

with $K$ the complete elliptic integral of the first kind (modulus convention). Nothing
here is asymptotic hand-waving; every link is checked at referee grade:

- **The mechanism is a one-line integral of motion.** Along a geodesic,
  $\dot\theta = e^{\varepsilon x}$ and $\dot x = \cos\theta$ give
  $d\dot\theta/d\theta = \varepsilon\cos\theta$, hence
  $\dot\theta = 1 + \varepsilon(\sin\theta - \sin\theta_0)$ — the angular dynamics is
  integrable, a pendulum in disguise.
- **Per launch angle**, the refocusing time equals the $\theta$-period
  $2\pi\big[(1-\varepsilon\sin\theta_0)^2-\varepsilon^2\big]^{-1/2}$ — verified against
  the Jacobian-zero conjugate times of the geodesic integrator to $10^{-8}$ relative,
  every angle, up to $\varepsilon = 0.45$.
- **The launch-angle average** equals $\tfrac2\pi K(2\varepsilon)$ — verified
  symbolically term-by-term through $O(\varepsilon^{12})$ (computer algebra) and
  numerically to $10^{-10}$ absolute through the full measurement pipeline.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-closed-form">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-closed-form.png"
      alt="Two panels: the measured mean refocusing delay riding the exact elliptic-integral curve across four decades up to the critical gradient one half; and per-angle refocusing times matching the pendulum-period formula at three gradient strengths"
      style="max-width:min(100%,820px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The exact law, against the measurement.</strong> <em>A:</em> the mean
    refocusing delay $-\delta$ (log scale) measured by the geodesic code (dots) on the
    exact curve $\tfrac2\pi K(2\varepsilon)-1$ (line), up to the <strong>critical
    gradient</strong> $\varepsilon = 1/2$ where $K$ diverges. <em>B:</em> the per-angle
    refocusing time against the pendulum-period formula at three gradients — the peak at
    $\theta_0 = \pi/2$ (launch along the gradient) grows toward divergence. Pipeline:
    <code>research/preferred-directions/scripts/run_p5_series.py</code>,
    <code>render_closed_form.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The divergence is physics, not pathology. As $\varepsilon \to 1/2$ the *mean* refocusing
time diverges, and the slowest launch direction ($\sin\theta_0 = 1$) has
$t_c = 2\pi/\sqrt{1-2\varepsilon}$ — verified at $\varepsilon = 0.45$ and $0.49$, with
no conjugate point found at $0.52$. **When the field changes by more than half across a
Larmor radius, the slowest orbits never come back and the beam's caustic opens.** A
critical gradient, delivered by a textbook special function. (The two steps a referee
should still demand, stated plainly: a formal proof that the conjugate time equals the
period for this integrable family — our evidence is $10^{-8}$ numerics — and one final
literature pass on gyro-period integrals in exponential field profiles.)

## The claim that lost: the crossover, demoted by its own race

Part 6's scale crossover reads an unresolved null pair's separation from one point — an
observable with no analogue in the null-detection literature. No analogue does not mean
no competitor. The obvious statistical rival: fit a divergence-free quadratic field to
the same noisy grid and root-find it. We pre-registered the protocol *and the demotion
rule*, then ran it: same gridded field to both sides, the crossover building its own
potential from the data, a clean leg and a contaminated leg, three separations, three
noise levels.

</div><!-- /.l-body -->

<figure class="l-body" id="fig-race">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-race.png"
      alt="Two panels of median separation error versus noise: the quadratic-fit baseline lies one to four orders of magnitude below the crossover estimator in both the pure and contaminated legs"
      style="max-width:min(100%,700px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>The race, lost.</strong> Median relative error of the estimated pair
    separation (log scale) versus noise, for the scale crossover (orange) and the
    divergence-free quadratic fit + root-finding (blue). The fit wins every cell by one
    to four orders of magnitude — even in the contaminated leg, because a smooth
    background is precisely what a polynomial fit absorbs. Per the pre-registered rule,
    the crossover is <strong>demoted from candidate tool to conceptual observable</strong>.
    Pipeline: <code>research/preferred-directions/scripts/run_p5_race.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

What survives the demotion, stated precisely: $Q = 7$ at the fold point is a statement
about the field's intrinsic geometry, not an estimate in competition; the 2/3/4 plateau
dictionary remains the correct *meaning* of uniform/null/degenerate; and the dilation
collapse remains the right mental model of what an unresolved pair *is*. But for
measuring a separation on data, fit and root-find. This is the second time the series
has measured this moral — classification fell to the linear fit in Part 5 the same way.

## The hunt that came back empty: a fold on the real Sun

The transition state's cleanest real-data signature would be a null pair being born in a
flux-emergence region. We fetched eight real HMI frames tracking AR11158 — the textbook
emergence region — from its birth through its X2.2 flare (2011-02-13 → 02-15), and ran
the census on every frame.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-emergence">
  <div style="text-align:center;">
    <img src="/public/img/posts/forbidden-directions-emergence.png"
      alt="Eight frames of the emerging active region AR11158 across two and a half days, growing from a simple bipole into a multipolar flaring complex, with detected coronal nulls starred: none at first, a pair by twelve hours after the X-class flare"
      style="max-width:min(100%,880px);width:100%;height:auto;border-radius:3px;">
  </div>
  <figcaption>
    <strong>A region builds its topology.</strong> AR11158 emerging (real SDO/HMI,
    2011-02-13 → 02-15 through the X2.2 flare; red/blue = photospheric polarity; ★ =
    detected coronal nulls of the potential extrapolation). The census reads
    0,0,0,(1),0,1,0,<strong>2</strong>: a young bipole is a simple arcade with no coronal
    nulls at all, and nulls appear as the region builds the multipolar structure that
    makes it flare-capable. Pipeline:
    <code>research/preferred-directions/scripts/run_p5_sequence.py</code>.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

The honest verdict: **no fold was caught.** The final pair is same-signed, and
fold-born pairs are necessarily opposite-signed (topological degree conservation) — so
these two nulls arose independently as the region's complexity grew. What the census
*does* deliver is a real-data observation worth keeping: the coronal null count as a
topological complexity index of an emerging region, zero while it is a simple arcade.
Catching a birth needs hourly cadence, a co-moving window, and null identity tracking —
specified for the follow-up, not claimed. (One methodological save worth confessing: the
first tracking pass left the region in the window's corner, and its quiet-Sun nulls
briefly impersonated an "annihilation candidate" — caught by looking at the picture,
fixed by recentring, discarded.)

## What stands after review

| Claim | Status after the litmus tests |
|---|---|
| $Q = d+k+2$, tested $k = 0,1,2$ in 3D; **$Q=7$ at the fold** | stands — intrinsic geometry, no estimation rival |
| $\delta = 1 - \tfrac2\pi K(2\varepsilon)$; **critical gradient $\varepsilon = 1/2$** | stands at $10^{-8}$–$10^{-10}$; two referee steps named |
| Force-free ⇒ radial-only; magnetotail ⇒ 79 spirals | stands as a *demonstrated dichotomy*; the theorem itself is a clarification of known dynamics |
| Crossover as pair-metrology tool | **demoted** by pre-registered race; survives as concept |
| Type classification, pair metrology | belong to statistical fits — measured twice |
| Fold birth on the real Sun | not caught; requirements specified |

The series' deepest result is the shape of this table: the sub-Riemannian framing's
durable contributions are **laws, exact structure, and dictionaries** — things with no
estimation competitor — while every head-to-head against a matched statistical estimator
was lost and reported. That is what distinguishes a research program from an
advertisement, and it is the standard the next phase (the moduli question, the hourly
fold hunt, the in-situ cross-match) will be held to.

## Glossary

- **$K(k)$** — complete elliptic integral of the first kind,
  $\int_0^{\pi/2} d\phi/\sqrt{1-k^2\sin^2\phi}$ (modulus convention).
- **Critical gradient** — $\varepsilon = 1/2$: the value of
  $\lvert\nabla\ln B\rvert\,r_L$ at which the mean refocusing time diverges and the
  slowest launch angle stops refocusing.
- **Pre-registered rule** — the verdict criterion written into the phase charter before
  the experiment ran; the race's demotion rule is one.
- **Same-signed pair** — two nulls whose spine eigenvalues share a sign; cannot be
  fold-born (degree conservation), hence the emergence verdict.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_p5_series.py       # the exact law, 4 checks
../cosmic-web/.venv/bin/python scripts/render_closed_form.py  # its figure
../cosmic-web/.venv/bin/python scripts/run_p5_race.py         # the race (~75 min)
../cosmic-web/.venv/bin/python scripts/fetch_sequence.py      # 8 real HMI frames
../cosmic-web/.venv/bin/python scripts/run_p5_sequence.py     # the emergence census
```

Charter and reports: `docs/PROGRAM-P5-litmus.md`, `T1-race.md`, `T2-closed-form.md`,
`T3-emergence.md`.

</div><!-- /.l-body -->
