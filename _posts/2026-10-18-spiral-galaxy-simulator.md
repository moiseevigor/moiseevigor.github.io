---
layout: post
title: "Grow your own spiral galaxy"
subtitle: "A live N-body disc in your browser: light discs, massive discs, bars, tidal encounters and the winding problem"
date: 2026-10-18 12:00:00 +0000
categories: [astrophysics]
tags: [galaxies, spiral-arms, n-body, simulation, popular-science]
permalink: /astrophysics/spiral-galaxy-simulator/
image: /public/img/posts/galaxy-sim/thumb.png
result: '$m\approx\dfrac{\kappa^2R}{2\pi G\Sigma X},\quad X\approx2$'
math: true
published: true
comments: false
description: "An interactive particle-mesh N-body simulation of a stellar disc in a dark halo. Choose a galaxy type, watch spiral arms form, and compare their measured pitch with 391 real galaxies."
---

In the [prime spirals post](/mathematics/prime-spirals-sunflowers/) the spirals came from a fixed rule. Galaxy arms have no such rule. They form when a rotating disc of stars amplifies its own small irregularities through gravity. Some galaxies get help from a passing neighbour or a central bar.

You can watch this happen below. The page runs a real gravitational simulation of 40,000 particles. Each particle stands for a large group of stars, and every one pulls on every other. The disc sits inside a dark-matter halo, and the arms that appear are not drawn in by hand.

## Simulate a galaxy

Pick a galaxy type, then change one setting at a time. **Disc share** is the fraction of the rotation at 6.6 kpc that comes from the stars' own gravity; the dark halo supplies the rest. **Toomre Q** measures how warm the disc is: random stellar motions resist collapse, so a low Q means a cold disc that responds strongly. Changing a setting restarts the run. **New random start** keeps the settings and rolls new initial star positions, so you get a different set of arms.

<link rel="stylesheet" href="/public/css/galaxy-spirals.css">
<div class="galaxy-sim" data-galaxy-sim>
  <div class="gs-controls">
    <label>Galaxy type
      <select data-control="type">
        <option value="multi">Multi-armed (light disc, heavy halo)</option>
        <option value="few">Three arms (massive disc)</option>
        <option value="barred">Barred spiral (cold, disc-dominated)</option>
        <option value="tidal">Grand design from a passing companion</option>
        <option value="wave">Density wave (imposed rotating pattern)</option>
        <option value="winding">Material arms (the winding problem)</option>
      </select>
    </label>
    <label>Stars simulated
      <select data-control="n"><option value="20000">20,000 (faster)</option><option value="40000" selected>40,000</option><option value="80000">80,000 (smoother, slower)</option></select>
    </label>
    <label>Disc share of rotation: <output data-for="f">45%</output>
      <input data-control="f" aria-label="Disc share of rotation at 2.2 disc scale lengths" type="range" min="0.3" max="0.9" step="0.05" value="0.45">
    </label>
    <label data-only="self">Toomre Q (disc warmth): <output data-for="Q">1.10</output>
      <input data-control="Q" aria-label="Toomre stability parameter Q" type="range" min="0.9" max="2.5" step="0.05" value="1.1">
    </label>
    <label data-only="tidal">Companion mass: <output data-for="mc">0.25</output>
      <input data-control="mc" aria-label="Companion mass as a fraction of the galaxy mass within 13.5 kpc" type="range" min="0.05" max="0.6" step="0.05" value="0.25">
    </label>
    <label data-only="wave">Pattern pitch angle: <output data-for="pitch">20°</output>
      <input data-control="pitch" aria-label="Pitch angle of the imposed spiral pattern in degrees" type="range" min="8" max="40" step="1" value="20">
    </label>
    <label>Simulation speed
      <input data-control="speed" aria-label="Simulation steps per frame" type="range" min="1" max="6" step="1" value="2">
    </label>
  </div>
  <div>
    <button type="button" data-control="play">Pause</button>
    <button type="button" data-control="restart">Restart</button>
    <button type="button" data-control="seed">New random start</button>
  </div>
  <canvas data-view role="img" aria-label="Face-on view of the simulated galaxy; brightness shows stellar surface density"></canvas>
  <p data-readout role="status" aria-live="polite"></p>
  <p data-status></p>
  <div class="gs-charts">
    <figure>
      <canvas data-rc role="img" aria-label="Rotation curve: circular speed in km/s against radius in kpc for the total, the stellar disc and the dark halo"></canvas>
      <figcaption>Rotation curve: circular speed (km/s) against radius (kpc). The total (black or white) combines the stellar disc (orange) and the dark halo (blue). The dashed line marks 6.6 kpc, where the predictions are evaluated.</figcaption>
    </figure>
    <figure>
      <canvas data-hist role="img" aria-label="Histogram of pitch angles of 391 real galaxies with the simulated galaxy's measured pitch marked"></canvas>
      <figcaption>Pitch angles of 391 real disc galaxies (grey bars, S4G survey, 2° bins). Orange line: your galaxy's measured pitch. Dashed blue line: the pitch predicted from the rotation curve's shear. Green band: Milky Way inner-arm models (12–13°).</figcaption>
    </figure>
  </div>
  <p class="gs-legend">Brightness is stellar surface density on a logarithmic scale. Rotation is counter-clockwise. The orange dot in the tidal run is the companion; dashed circles in the density-wave run mark the pattern's inner Lindblad resonance, corotation and outer Lindblad resonance. Scale: disc scale length 3 kpc, and a circular speed of 220 km/s at 6.6 kpc, close to the Milky Way.</p>
  <noscript>Enable JavaScript to run the simulation.</noscript>
</div>
<script type="module" src="/public/js/galaxy-spirals.js"></script>

## What each galaxy type shows

**Multi-armed and three-armed discs: arms from the disc's own gravity.** A rotating disc shears every small clump into a trailing streak, and the streak's gravity briefly strengthens it. This is *swing amplification* (Goldreich & Lynden-Bell 1965; Julian & Toomre 1966; Toomre 1981). The arms fade and new ones form from the noise they leave behind. Sellwood & Masters (2022) describe this recurrent, transient picture as the current consensus for isolated galaxies.

Theory predicts how many arms you get. Disturbances grow most when $X = \kappa^2R/(2\pi G\Sigma m)$ is about 2 (Dobbs & Baba 2014), which gives

$$m \approx \frac{\kappa^2 R}{2\pi G\Sigma\cdot 2}.$$

A light disc, which supplies little of the rotation, has a small $\Sigma$ and so many arms; a massive disc has few (Carlberg & Freedman 1985; Fujii et al. 2011). The read-out shows this prediction for your settings next to the arm number measured from the simulation. Galaxies like M101 have many arms; massive discs show two to four.

**Barred spiral.** Make the disc dominant and cold, and the whole inner disc becomes unstable. Within a few rotations it forms a rotating bar, with spiral arms trailing from its ends, as in NGC 1300. Without gas the disc then heats up, and after a billion years mostly the bar remains.

**Grand design from a companion.** A neighbour on a prograde orbit raises a two-armed tide in the disc, the way NGC 5195 shaped M51. After the companion passes, the arms wind tighter. In the reference run they go from about 49° to 17° pitch over 600 Myr. The disc is set warm here (Q = 1.8) so that its own arms stay weak and the tidal response stands out.

**Density wave.** This mode switches off self-gravity and imposes a rigidly rotating two-armed spiral, the picture of Lin & Shu (1964). Stars orbit faster than the pattern inside corotation and slower outside. The response only follows the pattern between the two Lindblad resonances, marked by dashed circles.

**Material arms.** Here two straight lines of stars are painted orange and the disc simply rotates. Because the inner disc turns faster, the lines wind into ever tighter spirals: $\cot P = R\,|d\Omega/dR|\,t$. Within a few hundred million years the pitch drops below what almost any real galaxy shows. This is the *winding problem*, and it is why arms cannot be fixed lines of stars.

## How the simulation works

- **Gravity.** The particles are spread onto a 128 × 128 grid covering 33 kpc. The gravitational potential follows from a fast Fourier transform convolution with zero padding, so the disc is isolated rather than periodic. Gravity is softened over 0.24 kpc, standing in for the disc's thickness. This particle-mesh method is a standard N-body technique for galactic discs (Sellwood 2014).
- **Disc.** Stars start in an exponential disc out to 13.5 kpc. Their random motions are set from Toomre Q and their mean rotation from the Jeans equation.
- **Halo.** The dark halo is a fixed logarithmic potential with a 6 kpc core, scaled so that the disc supplies the chosen share of rotation at 6.6 kpc.
- **Time steps.** Orbits advance with a leapfrog integrator in steps of 0.33 Myr.
- **Measurement.** The arm number and pitch come from a two-dimensional Fourier decomposition in log-radius and angle between 3.6 and 12 kpc. This is the same method applied to galaxy images (Puerari & Dottori 1992), so the orange line on the histogram is measured the same way as the real galaxies behind it.

**Checked against theory.** The [check script](https://github.com/moiseevigor/moiseevigor.github.io/blob/master/research/galactic-spirals/scripts/check_simulator.mjs) runs every galaxy type for 800 Myr without a browser and asserts two things:

- Material arms reach the predicted pitch: 9.9° at 240 Myr, measured 9.9°.
- A lighter disc grows more arms than a massive one: an average of 5.1 arms at 45% disc share against 3.2 at 65% (three random starts each), matching the predicted 5.1 and 3.2.

The imposed 20° density wave is recovered at 20.5° on average, and the companion-driven arms come out two-armed.

**What it leaves out.**
- **Particle count.** A real galaxy has about $10^{11}$ stars, and the simulation has tens of thousands. Its larger random clumping seeds arms faster than in nature (Sellwood 2012).
- **Gas.** There is no gas. Without gas cooling the disc, real self-excited spirals fade within about ten rotations, so this disc heats up and its arms weaken over a few billion years. That fading is real physics, not a bug.
- **A flat, fixed host.** The disc is two-dimensional and the halo is rigid. In the tidal run the galaxy's centre is held fixed and nothing slows the companion's orbit (no dynamical friction).

## Glossary

- **Pitch angle $P$**: the angle between an arm and the circle through it, centred on the galaxy. Small $P$ means a tight arm.
- **Disc share $f$**: $V_\text{disc}^2/V_\text{total}^2$ at 6.6 kpc (2.2 disc scale lengths). The rest of the rotation comes from the dark halo.
- **Toomre Q**: $Q = \sigma_R\kappa/(3.36\,G\Sigma)$, where $\sigma_R$ is the radial velocity dispersion and $\Sigma$ the stellar surface density. Below 1 the disc collapses into rings; a little above 1 it amplifies spirals strongly.
- **Epicyclic frequency $\kappa$**: the frequency at which a star oscillates around a circular orbit, $\kappa^2 = R\,d\Omega^2/dR + 4\Omega^2$.
- **Shear $\Gamma$**: $\Gamma = -d\ln\Omega/d\ln R$, equal to 1 for a flat rotation curve. The predicted pitch is $\tan P = \tfrac27\sqrt{4-2\Gamma}/\Gamma$ (Michikoshi & Kokubo 2014).
- **Swing parameter $X$**: $X = \kappa^2R/(2\pi G\Sigma m)$ for an $m$-armed disturbance; amplification peaks near $1 < X < 2$.
- **Lindblad resonances, corotation**: the radii where the pattern speed $\Omega_p$ equals $\Omega - \kappa/2$ (inner), $\Omega$ (corotation) and $\Omega + \kappa/2$ (outer), for two arms.
- **Amplitude**: $|A(m,p)|$, the strength of the best-fitting logarithmic spiral of $m$ arms and radial wavenumber $p$; the noise level shown is $4/\sqrt{N}$ for $N$ measured particles.

## References

- Carlberg, R. G., Freedman, W. L. 1985, *ApJ* 298, 486.
- Díaz-García, S. et al. 2019, *A&A* 631, A94. S4G pitch angles, the histogram data.
- Dobbs, C., Baba, J. 2014, *PASA* 31, e035. "Dawes Review 4: Spiral structures in disc galaxies." [arXiv:1407.5062](https://arxiv.org/abs/1407.5062)
- Fujii, M. S. et al. 2011, *ApJ* 730, 109. [arXiv:1006.1228](https://arxiv.org/abs/1006.1228)
- Goldreich, P., Lynden-Bell, D. 1965, *MNRAS* 130, 125.
- Julian, W. H., Toomre, A. 1966, *ApJ* 146, 810.
- Lin, C. C., Shu, F. H. 1964, *ApJ* 140, 646.
- Michikoshi, S., Kokubo, E. 2014, *ApJ* 787, 174. [arXiv:1404.6332](https://arxiv.org/abs/1404.6332)
- Puerari, I., Dottori, H. A. 1992, *A&AS* 93, 469.
- Reid, M. J. et al. 2019, *ApJ* 885, 131. Milky Way rotation and arm pitch angles.
- Sellwood, J. A. 2012, *ApJ* 751, 44. "Spiral instabilities in N-body simulations I: Emergence from noise." [arXiv:1203.0444](https://arxiv.org/abs/1203.0444)
- Sellwood, J. A. 2014, *Rev. Mod. Phys.* 86, 1. "Secular evolution in disk galaxies." [arXiv:1310.0403](https://arxiv.org/abs/1310.0403)
- Sellwood, J. A., Masters, K. L. 2022, *ARA&A* 60, 73. [arXiv:2110.05615](https://arxiv.org/abs/2110.05615)
- Toomre, A. 1981, in *The Structure and Evolution of Normal Galaxies*, 111.
