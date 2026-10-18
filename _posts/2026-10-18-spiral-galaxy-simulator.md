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

## The theory of spiral arms, built in six steps

Each step adds one physical ingredient. The simulator contains all six, and the read-out quotes the two laws that come out at the end.

### 1. Shear alone: the winding problem

A disc rotates differentially. With circular speed $V(R)$ the angular speed is $\Omega = V/R$, and for a flat rotation curve it falls as $1/R$. Take any line of stars drawn across the disc at $t = 0$. A star at radius $R$ has turned through $\theta = \Omega(R)\,t$ after time $t$, so the line becomes a curve with

$$\frac{\partial\theta}{\partial R} = \frac{d\Omega}{dR}\,t
\qquad\Longrightarrow\qquad
\cot P = R\,\Bigl\lvert\frac{d\Omega}{dR}\Bigr\rvert\,t ,$$

where $P$ is the pitch angle. For a flat curve $\cot P = \Omega t$, and the shape is $R\theta = Vt$, a *hyperbolic* spiral whose pitch grows outward. At the Sun's radius $\Omega \approx 29.6$ rad/Gyr, so such a line is at 45° after 34 Myr, 17° after 110 Myr and 1.9° after 1 Gyr. Real arms sit at 10–40°, and discs are 10 Gyr old. Arms therefore cannot be made of the same stars for long. This is the *winding problem*, and the "Material arms" preset shows it directly.

### 2. Scale invariance: why arms are logarithmic spirals

Between its core and its edge, a disc with a flat rotation curve has no preferred length: rescale every radius by a factor and the dynamics look the same. A pattern that respects this symmetry must look the same under a rotation combined with a dilation, and that is the defining property of the logarithmic spiral $R = R_0 e^{\theta\tan P}$. The natural way to decompose the disc is therefore not into sines of $R$ but into

$$\delta\Sigma(R,\theta) \propto \exp\bigl[i(m\theta + p\ln R)\bigr],
\qquad \tan P = \frac{m}{\lvert p\rvert}.$$

Each term is an $m$-armed logarithmic spiral of pitch $P$. This is the basis in which Zang and Evans & Read solved the exact modes of scale-free discs, and it is also what the simulator measures: the "Measured" line reports the strongest term in this expansion, which is how pitch angles of real galaxies are measured.

### 3. Epicycles: the disc's natural frequency

Nudge a star off its circular orbit and it oscillates about it at the *epicyclic frequency*

$$\kappa^2 = R\frac{d\Omega^2}{dR} + 4\Omega^2 = 2\Omega^2(2-\Gamma),
\qquad \Gamma = -\frac{d\ln\Omega}{d\ln R}.$$

$\Gamma$ is the shear rate: $\Gamma = 1$ for a flat rotation curve (then $\kappa = \sqrt2\,\Omega$), $\Gamma = 0$ for solid-body rotation, $\Gamma = 1.5$ for a Keplerian fall-off. Random motions matter through Toomre's parameter $Q = \sigma_R\kappa/(3.36\,G\Sigma)$: pressure ($\sigma_R$) and rotation ($\kappa$) both resist the self-gravity of the surface density $\Sigma$. For $Q < 1$ the disc breaks into rings; every spiral theory lives at $Q$ a little above 1.

### 4. Density waves: a pattern the stars pass through

Lin & Shu asked whether a spiral *pattern* can rotate rigidly at a speed $\Omega_p$ while the stars stream through it. For a tightly wound wave with radial wavenumber $k = p/R$, perturbing the equations of motion gives, in the simplest fluid form,

$$(\omega - m\Omega)^2 = \kappa^2 - 2\pi G\Sigma\,\lvert k\rvert + \sigma^2 k^2,
\qquad \omega = m\,\Omega_p .$$

The three terms on the right are rotation, self-gravity and pressure, and $Q > 1$ is exactly the condition that the right-hand side stays positive for every $k$ when $\omega = m\Omega$. The relation also says where a wave can exist: only where $\lvert\omega - m\Omega\rvert < \kappa$, that is, between the inner and outer *Lindblad resonances* $\Omega_p = \Omega \mp \kappa/m$. The stars overtake the pattern inside *corotation* ($\Omega_p = \Omega$) and lag behind it outside. The "Density wave" preset imposes such a pattern; the dashed circles are these three radii, and the stars respond only between the outer two. The catch, found in the 1960s, is that a wave packet travels to a resonance within a few rotations and is absorbed there. A standing density wave needs something to keep feeding it.

### 5. Swing amplification: shear, epicycles and self-gravity together

Goldreich & Lynden-Bell and Julian & Toomre looked at a small patch of the disc in a frame that rotates with it. In that frame the shear carries a *leading* ripple (one whose outer end points forward) around into a *trailing* one. While it swings through the radial direction, the ripple's pattern turns at a rate close to $\kappa$, so the stars' epicycles stay in step with it, and for a moment self-gravity can win against rotation. The ripple is amplified, by factors of 10–100 when the disc is cool. Two dimensionless numbers decide how much:

$$Q \;\;\text{and}\;\; X = \frac{k_\text{crit}}{k_y} = \frac{\kappa^2 R}{2\pi G\Sigma\,m},
\qquad k_\text{crit} = \frac{\kappa^2}{2\pi G\Sigma},$$

where $k_y = m/R$ is the azimuthal wavenumber of an $m$-armed ripple. Amplification is strong for $Q \lesssim 2$ and $1 \lesssim X \lesssim 2$, and switches off for $X \gtrsim 3$. This is the mechanism in the two self-gravitating presets, and it yields two laws.

**Law 1: how many arms.** The disc amplifies whatever $m$ puts $X$ in the window. Taking $X \approx 2$,

$$m \approx \frac{\kappa^2 R}{4\pi G\Sigma}.$$

For an exponential disc measured at 2.2 scale lengths, $2\pi G\Sigma R \approx 0.5\,V_\text{disc}^2$, and for a flat curve $\kappa^2 R^2 = 2V^2$, so $m \approx 2\,V^2/V_\text{disc}^2 = 2/f$: **the number of arms is inversely proportional to the disc's share of the rotation.** A disc that supplies 45% of its rotation should grow four to five arms, one that supplies 65% about three, and a disc that dominates its rotation grows two, which then join into a bar. The read-out evaluates this with the actual $\kappa$ of your rotation curve; the headless check finds 5.1 and 3.2 arms against predictions of 5.1 and 3.1.

**Law 2: how tightly wound.** The ripple reaches peak amplitude at a fixed stage of its swing, so its pitch at that moment depends only on the shear. Michikoshi & Kokubo fitted their local simulations with

$$\tan P = \frac{2}{7}\,\frac{\sqrt{4-2\Gamma}}{\Gamma},$$

which follows from the linear theory with the swing time at peak set to about $3.5/\kappa$. It gives $P = 22°$ for a flat rotation curve, 33° where the curve still rises ($\Gamma = 0.7$), 11° where it falls as Kepler's law ($\Gamma = 1.5$) and 45° near solid-body rotation. **Arms are tighter where the rotation curve falls and more open where it rises.** This is the dashed blue line on the histogram, and it is the trend seen in real galaxies: tight arms go with centrally concentrated mass (Yu & Ho 2019). The 391 S4G galaxies peak near 20°, close to the flat-curve value.

### 6. Recurrence: why the arms keep coming

A swing-amplified arm is transient. It grows, winds past the amplification window and fades within a rotation or two. But it leaves two marks on the disc. It heats the stars, raising $Q$, and it scatters stars at its Lindblad resonances, carving narrow grooves in the distribution of angular momentum. A groove is itself unstable and seeds the next arm, with a different number and phase. Sellwood & Carlberg showed this cycle in simulations, and Sellwood & Masters (2022) call it the most likely explanation for the arms of isolated galaxies. The cycle runs until the disc is too hot, after about ten rotations in a pure stellar disc. Real galaxies have gas, which cools and forms new stars on circular orbits, resetting $Q$ and keeping the cycle going for the age of the universe. The simulator has no gas, so its arms fade over a few billion years, which is itself a demonstration of the gas's role.

**Driven arms** fit into the same picture. A passing companion of mass $M_c$ at distance $d$ applies a tidal acceleration $\sim 2GM_cR/d^3$ that is bisymmetric, so it imposes an $m = 2$ ripple on the whole disc at once; the disc then swing-amplifies it and the shear winds it, which is the M51 story (Toomre & Toomre 1972). A bar is the $m = 2$ instability of a disc that supplies most of its own rotation; a heavy halo suppresses it, and the arms attached to the bar's ends are the disc's forced response at the bar's pattern speed.

| Ingredient | Law | Where you see it |
|---|---|---|
| Shear $d\Omega/dR$ | material arms wind as $\cot P = R\,\lvert d\Omega/dR\rvert\,t$ | Material arms preset |
| Scale invariance | arms are logarithmic spirals, $\tan P = m/\lvert p\rvert$ | the measurement line |
| Epicycles $\kappa$, $Q$ | waves exist only between Lindblad resonances | dashed circles, density-wave preset |
| Swing amplification, $X$ | $m \approx \kappa^2R/(4\pi G\Sigma) \approx 2/f$ | multi-armed vs three-armed presets |
| Shear rate $\Gamma$ | $\tan P = \tfrac27\sqrt{4-2\Gamma}/\Gamma$ | dashed blue line on the histogram |
| Heating and grooves | arms recur until $Q$ is too high | arms fade after a few Gyr |

None of these steps contains the golden ratio. The inputs are a rotation curve, a surface density and a velocity dispersion, and the outputs are a pitch set by $\Gamma$ and an arm count set by $X$. A galaxy whose arms happen to sit at 17° has a flat-ish rotation curve, nothing more.

## What each galaxy type shows

**Multi-armed and three-armed discs: arms from the disc's own gravity.** These are steps 5 and 6 at work. The disc amplifies its own noise into trailing arms, which fade and seed the next set. Law 1 fixes the arm count: a light disc (45% share) grows four to six arms like M101, a massive one (65%) about three. The read-out shows the prediction next to the measured count, and the dashed blue line on the histogram is Law 2's pitch for your rotation curve. Change the disc share and watch both move.

**Barred spiral.** Make the disc dominant and cold, and the whole inner disc becomes unstable. Within a few rotations it forms a rotating bar, with spiral arms trailing from its ends, as in NGC 1300. Without gas the disc then heats up, and after a billion years mostly the bar remains.

**Grand design from a companion.** A neighbour on a prograde orbit raises a two-armed tide in the disc, the way NGC 5195 shaped M51. After the companion passes, the arms wind tighter. In the reference run they go from about 49° to 17° pitch over 600 Myr. The disc is set warm here (Q = 1.8) so that its own arms stay weak and the tidal response stands out.

**Density wave.** Step 4 on its own. Self-gravity is switched off and a rigidly rotating two-armed pattern is imposed, with corotation at 12 kpc. Stars overtake the pattern inside corotation and lag behind it outside, and the response follows the pattern only between the two Lindblad resonances, the inner and outer dashed circles.

**Material arms.** Step 1 on its own. Two straight lines of stars are painted orange and the disc simply rotates. The read-out compares the measured pitch with $\cot P = R\,\lvert d\Omega/dR\rvert\,t$ as the lines wind up; within a few hundred million years they are tighter than almost any real arm.

## How the simulation works

- **Gravity.** The particles are spread onto a 128 × 128 grid covering 33 kpc. The gravitational potential follows from a fast Fourier transform convolution with zero padding, so the disc is isolated rather than periodic. Gravity is softened over 0.24 kpc, standing in for the disc's thickness. This particle-mesh method is a standard N-body technique for galactic discs.
- **Disc.** Stars start in an exponential disc out to 13.5 kpc. Their random motions are set from Toomre Q and their mean rotation from the Jeans equation.
- **Halo.** The dark halo is a fixed logarithmic potential with a 6 kpc core, scaled so that the disc supplies the chosen share of rotation at 6.6 kpc.
- **Time steps.** Orbits advance with a leapfrog integrator in steps of 0.33 Myr.
- **Measurement.** The arm number and pitch come from a two-dimensional Fourier decomposition in log-radius and angle between 3.6 and 12 kpc. This is the same method applied to galaxy images (Puerari & Dottori 1992), so the orange line on the histogram is measured the same way as the real galaxies behind it.

**Checked against theory.** The [check script](https://github.com/moiseevigor/moiseevigor.github.io/blob/master/research/galactic-spirals/scripts/check_simulator.mjs) runs every galaxy type for 800 Myr without a browser and asserts two things:

- Material arms reach the predicted pitch: 9.9° at 240 Myr, measured 9.9°.
- A lighter disc grows more arms than a massive one: an average of 5.1 arms at 45% disc share against 3.2 at 65% (three random starts each), matching the predicted 5.1 and 3.1.

The imposed 20° density wave is recovered at 20.5° on average, and the companion-driven arms come out two-armed.

**What it leaves out.**
- **Particle count.** A real galaxy has about $10^{11}$ stars, and the simulation has tens of thousands. Its larger random clumping seeds arms faster than in nature.
- **Gas.** There is no gas. Without gas cooling the disc, real self-excited spirals fade within about ten rotations, so this disc heats up and its arms weaken over a few billion years. That fading is real physics, not a bug.
- **A flat, fixed host.** The disc is two-dimensional and the halo is rigid. In the tidal run the galaxy's centre is held fixed and nothing slows the companion's orbit (no dynamical friction).

## Glossary

- **Pitch angle $P$**: the angle between an arm and the circle through it, centred on the galaxy. Small $P$ means a tight arm.
- **Disc share $f$**: $V_\text{disc}^2/V_\text{total}^2$ at 6.6 kpc (2.2 disc scale lengths). The rest of the rotation comes from the dark halo.
- **Toomre Q**: $Q = \sigma_R\kappa/(3.36\,G\Sigma)$, where $\sigma_R$ is the radial velocity dispersion and $\Sigma$ the stellar surface density. Below 1 the disc collapses into rings; a little above 1 it amplifies spirals strongly.
- **Epicyclic frequency $\kappa$**: the frequency at which a star oscillates around a circular orbit, $\kappa^2 = R\,d\Omega^2/dR + 4\Omega^2$.
- **Shear $\Gamma$**: $\Gamma = -d\ln\Omega/d\ln R$, equal to 1 for a flat rotation curve. The predicted pitch is $\tan P = \tfrac27\sqrt{4-2\Gamma}/\Gamma$ (Michikoshi & Kokubo 2014).
- **Critical wavenumber $k_\text{crit}$**: $\kappa^2/(2\pi G\Sigma)$, the radial wavenumber at which rotation and self-gravity balance in the dispersion relation.
- **Pattern speed $\Omega_p$**: the angular speed at which a spiral pattern turns, as opposed to $\Omega$, the speed of the stars.
- **Leading / trailing**: an arm is trailing when its outer end points away from the direction of rotation; nearly all real arms trail.
- **Swing parameter $X$**: $X = \kappa^2R/(2\pi G\Sigma m)$ for an $m$-armed disturbance; amplification peaks near $1 < X < 2$.
- **Lindblad resonances, corotation**: the radii where the pattern speed $\Omega_p$ equals $\Omega - \kappa/2$ (inner), $\Omega$ (corotation) and $\Omega + \kappa/2$ (outer), for two arms.
- **Amplitude**: $\lvert A(m,p)\rvert$, the strength of the best-fitting logarithmic spiral of $m$ arms and radial wavenumber $p$; the noise level shown is $4/\sqrt{N}$ for $N$ measured particles.

## References

- Díaz-García, S. et al. 2019, *A&A* 631, A94. The S4G pitch angles behind the histogram. [arXiv:1908.04246](https://arxiv.org/abs/1908.04246)
- Dobbs, C., Baba, J. 2014, *PASA* 31, e035. Review of spiral structure, including swing amplification and the arm-number estimate. [arXiv:1407.5062](https://arxiv.org/abs/1407.5062)
- Lin, C. C., Shu, F. H. 1964, *ApJ* 140, 646. Density-wave theory.
- Michikoshi, S., Kokubo, E. 2014, *ApJ* 787, 174. The pitch–shear formula used in the read-out. [arXiv:1404.6332](https://arxiv.org/abs/1404.6332)
- Puerari, I., Dottori, H. A. 1992, *A&AS* 93, 469. The two-dimensional Fourier method used to measure the arms.
- Toomre, A., Toomre, J. 1972, *ApJ* 178, 623. Tidal arms and bridges from galaxy encounters.
- Yu, S.-Y., Ho, L. C. 2019, *ApJ* 871, 194. Pitch angle against rotation-curve shape in real galaxies. [arXiv:1812.06010](https://arxiv.org/abs/1812.06010)
- Sellwood, J. A., Masters, K. L. 2022, *ARA&A* 60, 73. Current review of how spirals form. [arXiv:2110.05615](https://arxiv.org/abs/2110.05615)
