---
layout: distill
title: "Appendix B5 — Reading the Sky's Hot Gas"
subtitle: >
  The thermal Sunyaev–Zel'dovich effect and Compton-y maps, stacking as a
  detection strategy, controls that match the sky's systematics, the 9σ spine
  detection and its halo/WHIM decomposition, pair-bridge estimators that
  cancel halos by symmetry, beam leakage — and the honest final numbers.
date: 2026-07-10 09:00:00
categories: [mathematics]
tags: [cosmic-web, tsz, compton-y, planck, act, observations]
description: >
  Observational appendix of the Geometry of the Cosmic Web series: how
  Compton-y maps encode hot gas, how stacking extracts signals of 1e-8 from
  1e-6 maps, why controls must match galactic-latitude exposure, the 9-sigma
  spine-stack detection and its decomposition, the halo-symmetric pair-bridge
  estimator, the Planck beam-leakage lesson, and the calibrated bridge
  amplitude of about 1.2–1.4e-8 at roughly 2 sigma per instrument.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B5
permalink: /mathematics/2026/07/10/cosmic-web-B5-reading-gas-maps/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The series' observational campaign asked whether the filament networks
extracted from galaxy surveys sit on real hot gas. This appendix supplies
everything needed to read those results: the physics of the thermal
Sunyaev–Zel'dovich effect in one paragraph, stacking as a
signal-to-noise strategy, why control samples must match the sky's
systematics (the galactic-latitude lesson), the 9σ spine detection and its
decomposition into halo gas versus gas between halos, the pair-bridge
estimator that cancels halos by symmetry, the beam-leakage lesson from
comparing Planck and ACT, and the final calibrated numbers. Numbers cite
the experiment reports (E3, E3b, E3c, E3d, E3e) in
<code>research/cosmic-web/docs/</code>.
</div>

## The thermal Sunyaev–Zel'dovich effect, in one paragraph

Photons of the cosmic microwave background (CMB) crossing a pocket of hot
ionised gas occasionally scatter off its free electrons and pick up a
little energy — inverse Compton scattering. The distortion this imprints
on the CMB spectrum is the **thermal Sunyaev–Zel'dovich (tSZ) effect**
(Sunyaev & Zel'dovich 1972), and its amplitude at each sky position is the
**Compton-y parameter**: the line-of-sight integral of the electron
pressure,

$$
y \;=\; \frac{\sigma_{\mathrm{T}}}{m_e c^{2}} \int P_e \, dl , \qquad P_e = n_e k_{\mathrm{B}} T_e ,
$$

with $$\sigma_{\mathrm{T}}$$ the Thomson cross-section, $$m_e c^2$$ the
electron rest energy, $$n_e$$ the electron density and $$T_e$$ the electron
temperature. y is dimensionless and, usefully, independent of redshift: a
parcel of hot gas contributes the same y whether nearby or distant. Galaxy
clusters reach y ~ 10⁻⁴–10⁻⁵; the warm–hot intergalactic medium (WHIM,
gas at 10⁵–10⁷ K) sits near y ~ 10⁻⁸ for the *stacked LRG-pair bridges*
targeted here (prominent individual intercluster bridges reach
10⁻⁷–10⁻⁶) — around a hundred times below the noise per pixel of the
all-sky Planck y map. tSZ is the filament probe of choice because y scales
with gas density $$n_e$$ to the first power, where X-ray emission scales as
$$n_e^2$$ and so collapses in diffuse gas. Both maps used in the series are
component-separated y maps: Planck (10′ beam) and the Atacama Cosmology
Telescope's ACT DR6 (1.6′ beam), where the beam is the instrument's
angular resolution.

## Stacking: seeing 10⁻⁸ in a 10⁻⁶ map

No single filament is visible, so the campaign averages the map over many
sky positions selected by an external catalogue — **stacking**. Averaging
N roughly independent positions beats the noise down by $$\sqrt{N}$$, but
the zero point of a y map is not trustworthy, so the measurement is always
*differential*: the stacked value minus the same stack on **control
positions**, with significance defined as

$$
\mathrm{SNR} \;=\; \frac{\text{stack} - \langle \text{stack}_{\mathrm{ctrl}} \rangle}{\sigma_{\mathrm{ctrl}}}
$$

over hundreds of control realisations. Everything then hinges on whether
the controls are exposed to the same systematics as the signal positions.

## Controls must match the sky's systematics

The first pass (E3) stacked spine networks extracted from 274,075 BOSS
CMASS-North galaxies (18 tiles of 512 h⁻¹Mpc, spines at matched total
length per method) on the Planck y map, against 200 footprint-constrained
controls built by rotating in right ascension and reflecting in
declination: 4.8σ (Hessian spines) and 4.1σ (orientation-lift spines).
But those transformations change **galactic latitude** — and galactic
foregrounds (dust, and the residual it leaves in a y map) vary with
latitude, so signal and controls sampled different foreground exposure.
The second pass (E3b) drew 200 control sets rejection-matched to the spine
points' galactic-latitude histogram in 2° bins, so no latitude-dependent
foreground can contribute. The detection **strengthened**: 8.99σ (Hessian; per-bin SNRs can exceed
the overall figure because neighbouring bins are correlated — and, with 200
empirical controls, σ's this large are Gaussian-tail extrapolations of the
measured null, not counted exceedances)
and 6.86σ (lift). A stricter control does not necessarily shrink a real
signal — it removes a variance term that was diluting it.

## The 9σ spine detection, decomposed

At 8.99σ the extracted web demonstrably sits on hot gas — but *whose* gas?
The survey galaxies themselves carry hot halos, so E3b masked a 7′ disc
around every catalogue galaxy, identically in signal and controls. The
excess collapsed to 1.95σ (Hessian) and 0.07σ (lift): the spine-stack
signal is **dominantly the tracers' own halo gas**, with at most a hint of
a between-halos (WHIM) component. The radial profile extends to ≥60′ but
cannot discriminate extended filament gas from clustered halo
contributions at a 10′ beam (E3b). Two conclusions: the spine networks are
physically real (they trace hot gas at high significance), and isolating
*filament* gas needs a sharper instrument and a different estimator.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-gas">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="gas-both">both methods</button>
    <button class="fig-toggle" id="gas-hess">Hessian</button>
    <button class="fig-toggle" id="gas-lift">orientation lift</button>
  </div>
  <div id="cw-gas" style="text-align:center;"></div>
  <figcaption>
    <strong>Hot gas sits on the extracted web — experiment E3.</strong> Stacked Planck
    Compton-<em>y</em> (a hot-gas thermometer) around the filament spines drawn on 274,075
    BOSS galaxies, as excess over 200 sky-matched control stacks, versus angular distance
    from the spine. Both detectors show gas strongly concentrated on the spine and falling
    outward; the overall stacks reach <strong>9.0σ</strong> (Hessian) and <strong>6.9σ</strong>
    (orientation lift), so the networks are physically real. A halo-mask test showed the
    signal is dominantly the tracer galaxies' own halo gas — isolating true inter-filament
    gas needs a sharper beam (next section). <em>Hover a point for its per-bin
    significance.</em> Numbers from <code>research/cosmic-web/artifacts/e3b_results.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-gas");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif", MONO = "'JetBrains Mono', monospace";
  const TH = [2.5, 7.5, 15, 30, 60];
  const S = [
    { key: "hessian", y: [8.04, 7.06, 4.94, 2.74, 2.70], e: [0.79, 0.69, 0.81, 0.81, 0.82], snr: [10.1, 10.2, 6.1, 3.4, 3.3], col: "#2b6cb0", lab: "Hessian (9.0σ)" },
    { key: "lift",    y: [6.63, 6.02, 5.63, 1.59, 2.34], e: [1.01, 0.85, 0.95, 0.92, 0.81], snr: [6.6, 7.1, 5.9, 1.7, 2.9], col: "#2f855a", lab: "orientation lift (6.9σ)" }
  ];
  const W = 580, H = 336, xL = 54, xR = 452, yT = 30, yB = 250;
  const lx0 = Math.log(2), lx1 = Math.log(74);
  const X = t => xL + (Math.log(t) - lx0) / (lx1 - lx0) * (xR - xL);
  const ymin = -1.2, ymax = 9.2, Y = v => yB - (v - ymin) / (ymax - ymin) * (yB - yT);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.maxWidth = "580px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  let tip;
  function hideTip() { if (tip) while (tip.firstChild) tip.removeChild(tip.firstChild); }
  function showTip(x, y, txt) { hideTip(); const w = txt.length * 5.7 + 12, tx = Math.min(Math.max(x - w / 2, 2), W - w - 2);
    tip.appendChild(el("rect", { x: tx, y: y - 27, width: w, height: 17, rx: 3, fill: "#111", "fill-opacity": 0.88 }));
    tip.appendChild(el("text", { x: tx + w / 2, y: y - 15, "text-anchor": "middle", "font-size": 10.5, fill: "#fff", "font-family": MONO }, txt)); }
  function render(mode) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(el("line", { x1: xL, y1: Y(0), x2: xR, y2: Y(0), stroke: "#999", "stroke-width": 1, "stroke-dasharray": "4 3" }));
    svg.appendChild(el("text", { x: xR + 3, y: Y(0) + 3, "font-size": 10, fill: "#999", "font-family": SANS }, "control"));
    svg.appendChild(el("line", { x1: xL, y1: yB, x2: xR, y2: yB, stroke: "#333", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: xL, y1: yT, x2: xL, y2: yB, stroke: "#333", "stroke-width": 1 }));
    TH.forEach(t => { svg.appendChild(el("line", { x1: X(t), y1: yB, x2: X(t), y2: yB + 4, stroke: "#333", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: X(t), y: yB + 16, "text-anchor": "middle", "font-size": 10, fill: "#555", "font-family": SANS }, t)); });
    svg.appendChild(el("text", { x: (xL + xR) / 2, y: yB + 34, "text-anchor": "middle", "font-size": 11, fill: "#333", "font-family": SANS }, "angular radius from spine (arcmin, log)"));
    [0, 2, 4, 6, 8].forEach(v => { svg.appendChild(el("line", { x1: xL - 4, y1: Y(v), x2: xL, y2: Y(v), stroke: "#333", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: xL - 7, y: Y(v) + 3, "text-anchor": "end", "font-size": 10, fill: "#555", "font-family": SANS }, v)); });
    svg.appendChild(el("text", { x: xL - 6, y: yT - 10, "text-anchor": "start", "font-size": 10.5, fill: "#555", "font-family": SANS }, "excess Compton-y (×10⁻⁸)"));
    S.forEach(s => {
      if (mode !== "both" && mode !== s.key) return;
      svg.appendChild(el("polyline", { points: TH.map((t, i) => `${X(t)},${Y(s.y[i])}`).join(" "), fill: "none", stroke: s.col, "stroke-width": 2, "stroke-opacity": 0.85 }));
      TH.forEach((t, i) => {
        svg.appendChild(el("line", { x1: X(t), y1: Y(s.y[i] - s.e[i]), x2: X(t), y2: Y(s.y[i] + s.e[i]), stroke: s.col, "stroke-width": 1.3 }));
        const c = el("circle", { cx: X(t), cy: Y(s.y[i]), r: 4, fill: s.col, cursor: "pointer" });
        c.addEventListener("mouseenter", () => showTip(X(t), Y(s.y[i]), `${t}′ · ${s.y[i].toFixed(1)}×10⁻⁸ · ${s.snr[i].toFixed(1)}σ`));
        c.addEventListener("mouseleave", hideTip);
        svg.appendChild(c);
      });
    });
    S.forEach((s, i) => { const lx = xL + 10, ly = yT + 4 + i * 15, on = (mode === "both" || mode === s.key);
      svg.appendChild(el("line", { x1: lx, y1: ly, x2: lx + 16, y2: ly, stroke: s.col, "stroke-width": 2, "stroke-opacity": on ? 1 : 0.3 }));
      svg.appendChild(el("circle", { cx: lx + 8, cy: ly, r: 3.5, fill: s.col, "fill-opacity": on ? 1 : 0.3 }));
      svg.appendChild(el("text", { x: lx + 22, y: ly + 3.5, "font-size": 10.5, fill: on ? "#333" : "#aaa", "font-family": SANS }, s.lab)); });
    tip = el("g", {}); svg.appendChild(tip);
  }
  render("both");
  [["gas-both", "both"], ["gas-hess", "hessian"], ["gas-lift", "lift"]].forEach(([id, mode]) => {
    const b = document.getElementById(id); if (!b) return;
    b.onclick = () => { render(mode); ["gas-both", "gas-hess", "gas-lift"].forEach(x => document.getElementById(x).classList.remove("active")); b.classList.add("active"); };
  });
})();
</script>

<div class="l-body" markdown="1">

## The beam sets what you can see

The obvious sharper instrument, ACT DR6 at 1.6′, at first made things
*worse*: the same spine stack dropped to 2.95σ unmasked (versus Planck's
9σ on the overlapping footprint), and the masked residual stayed below the
pre-registered 3σ gate (1.77σ at 3′ masking; E3c). The working diagnosis is
a scale mismatch: the spines are projected through a ~250 h⁻¹Mpc redshift
shell, so their stacked signal is coherent on *degree* scales, where a
ground-based map is least reliable while excelling at arcminutes. (A caveat
belongs here: ACT DR6's y-map co-adds Planck information at large scales,
so pure filtering cannot be the whole story — transfer-function and
footprint effects on degree scales remain to be pinned down.) The lesson: an analysis design
must place its signal at the angular scales its instrument preserves.
E3c's prescription — go small-scale, individual structures instead of
shell projections — became the pair-bridge design.

## Pair bridges: cancel the halos by symmetry

Take close galaxy pairs — transverse separation 6–14 h⁻¹Mpc,
line-of-sight separation < 6 h⁻¹Mpc — which simulations expect to be
connected by filament bridges. The estimator (E3d, refined in E3d-v2):
average y in a 2′ disc at the pair **midpoint**, and subtract the mean of
the same disc at **ring control points** at ±60°, ±90° and ±120° around
each galaxy, at identical angular distance from that galaxy. Any
circularly symmetric halo profile contributes *exactly zero* by
construction — the control points sit at the same distance from the halo
as the midpoint does. What survives is gas that lives preferentially *on*
the inter-pair axis: the bridge. Over 876,639 CMASS pairs this gave
2.28×10⁻⁸ at 5.24σ on ACT and 2.97×10⁻⁸ at 19.3σ on Planck with
per-pair bootstrap errors (E3d-v2).

## The validity battery and the final numbers

Two upgrades of rigour (E3e; Appendix B3 discusses both as general
methods). First, pairs overlap on the sky, so bootstrap over pairs is too
optimistic: a jackknife over 50 right-ascension patches deflates the
significances by 1.6–2.4×. Second, a **physically-null control**: pairs
with the same transverse window but line-of-sight separation 25–40 h⁻¹Mpc
— same sky geometry, no possible bridge. The nulls came back zero on ACT
(1.65σ) but **4.7σ nonzero on Planck** (1.80×10⁻⁸): at a 10′ beam, the
second galaxy's smeared halo contributes more at the midpoint than at the
ring controls (which sit farther from it), manufacturing a fake bridge —
**beam leakage**, now measured rather than suspected.

| control stage | ACT DR6 | Planck |
|---|---|---|
| pair bootstrap errors (E3d-v2) | 5.24σ (2.28×10⁻⁸) | 19.3σ (2.97×10⁻⁸) |
| sky-patch jackknife (E3e) | 3.30σ | 7.99σ |
| null-pair subtracted (E3e) | ≈1.6σ (1.4×10⁻⁸ ± 0.9) | ≈2.4σ (1.2×10⁻⁸ ± 0.5) |

The bottom row is the physically meaningful bridge amplitude:
**~1.2–1.4×10⁻⁸, at ≈2σ per instrument**, mutually consistent between two
independent telescopes and matching the published luminous-red-galaxy
pair-bridge measurements (~1–2×10⁻⁸; de Graaff et al. 2019, Tanimura et
al. 2019). The campaign therefore reports a *reproduction* of the
literature amplitude under honest errors and physical nulls — not an
independent 5σ detection; upgrading it would need model-based two-halo
subtraction and a joint-map likelihood. The recurring moral of the series
holds to the last experiment: every strong claim, put under its own
strictest control, shrinks to its honest core — and the honest core here
still says the bridges are real.

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>R. A. Sunyaev &amp; Ya. B. Zel'dovich (1972). "The observation of relic radiation as a test of the nature of X-ray radiation from the clusters of galaxies." <em>Comments Astrophys. Space Phys.</em> 4, 173.</li>
  <li>Planck Collaboration (2016). "Planck 2015 results. XXII. A map of the thermal Sunyaev–Zeldovich effect." <em>A&amp;A</em> 594, A22.</li>
  <li>W. Coulton et al. (2024). "Atacama Cosmology Telescope: high-resolution component-separated maps across one third of the sky." <em>Phys. Rev. D</em> 109, 063530. The ACT DR6 Compton-y map.</li>
  <li>A. de Graaff et al. (2019). "Probing the missing baryons with the Sunyaev–Zel'dovich effect from filaments." <em>A&amp;A</em> 624, A48.</li>
  <li>H. Tanimura et al. (2019). "A search for warm/hot gas filaments between pairs of SDSS luminous red galaxies." <em>MNRAS</em> 483, 223–234.</li>
  <li>Experiment reports E3, E3b, E3c, E3d, E3d-v2, E3e, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
