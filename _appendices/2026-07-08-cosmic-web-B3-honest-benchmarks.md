---
layout: distill
title: "Appendix B3 — How to Grade a Model Honestly"
subtitle: >
  Every evaluation failure the research program hit, told technically: the
  matched-length artifact and its sign flip, reference circularity, held-out
  seed discipline, jackknife versus pair bootstrap, physically-null controls,
  oracle bounds as information limits — and two byte-identical datasets
  caught by hashing.
date: 2026-07-08 09:00:00
categories: [mathematics]
tags: [cosmic-web, methodology, statistics, benchmarks, data-analysis]
description: >
  The evaluation-methodology appendix of the Geometry of the Cosmic Web
  series: proxy matching that manufactured a p ≈ 1e-14 false positive,
  circular reference skeletons, competitor-favouring calibration, honest
  error bars for overlapping data, null controls that exposed beam leakage,
  oracle bounds, and dataset provenance checks.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B3
permalink: /mathematics/2026/07/08/cosmic-web-B3-honest-benchmarks/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The research program's most transferable products are not cosmological.
They are the evaluation failures it committed, caught, and repaired — each
one a general lesson in how a plausible protocol manufactures a discovery.
This appendix tells them technically: the matched-length artifact (a
p ≈ 10⁻¹⁴ result with the wrong sign), reference circularity in skeleton
scoring, seed discipline and competitor-favouring calibration, why pair
bootstrap overstated a detection by a factor of 1.6, physically-null
controls that exposed a 4.7σ instrumental ghost, oracle bounds that
separate physics from estimation error, and a dataset-provenance check
that caught two "independent" simulations being byte-identical. Numbers
cite the experiment reports in <code>research/cosmic-web/docs/</code>.
</div>

## Match on the quantity that buys the score

The program's benchmark compared two filament detectors by
**completeness**: the fraction of the true filament network lying within
2 voxels of the recovered skeleton. Completeness has a mechanical
confounder — a longer skeleton covers more of the truth regardless of
quality — so both methods were required to output skeletons of equal total
length. The first implementation enforced that match on a **proxy**: the
volume of the hysteresis mask from which each method's skeleton is then
extracted, on the assumption that realised skeleton lengths would follow.

They did not. At sparse sampling the orientation-lift's realised skeletons
came out about 19% longer than the Hessian baseline's — **1,468 versus
1,239 voxels** — and the resulting "+0.06 completeness, 48/50 seeds,
p ≈ 10⁻¹⁴" advantage was pure length. Under the corrected extractor, which
iterates until the realised skeleton itself hits the target length, the
**sign flips**: the Hessian wins completeness at every sampling level from
2,500 galaxies up (Δ = −0.045 to −0.057, 50/50 seeds, p ≈ 10⁻¹⁵), with a
statistical tie only at ultra-sparse sampling (SYNTHESIS; PAPER-DRAFT
§5.1). The artifact was detected only because a later instrument change
retroactively shifted archived scores, and the archived length fields
confirmed the mismatch.


Two statistical debts an honest checklist also names. **Multiplicity:** the
sky-side estimator went through a redesign sequence (E3→E3e) before the final
pre-registered gate (E3c's 3σ); results from the exploratory stages are
reported as exploration, and only the gated, null-subtracted numbers are
carried forward — but a reader should know the garden of forking paths was
walked. **Tiny held-out samples:** transfer rows rest on n = 3 seeds, so the
quoted ±'s are jackknife estimates with large variance-of-variance; treat them
as scale indicators, not precision intervals.

The lesson generalises beyond skeletons: *a matched comparison must
enforce the match on the quantity that determines the score, not on a
proxy upstream of it — and statistical strength (p ≈ 10⁻¹⁴) certifies
nothing about whether the comparison was constructed correctly.*

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-match">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="match-proxy">matched on mask-volume proxy</button>
    <button class="fig-toggle" id="match-corr">matched on realised length</button>
  </div>
  <div id="cw-match" style="text-align:center;"></div>
  <figcaption>
    <strong>The same race, two ways to "match length" — experiment E0.</strong>
    Completeness advantage of the orientation lift over the Hessian
    (Δ = lift − Hessian; <em>above zero the lift wins, below the Hessian wins</em>),
    versus galaxy count. Both skeletons were pruned to equal length before scoring — but
    equal <em>on what?</em> Matched on a <strong>proxy</strong> (the hysteresis-mask
    volume), the lift's realised skeleton ran ~19% longer at sparse sampling, and length
    buys completeness: the lift <em>appears</em> to win by up to +0.06 (p ≈ 10⁻¹⁴). Flip
    the match to the <strong>realised skeleton length</strong> — the quantity that actually
    determines the score — and the sparse "win" inverts to a clean Hessian lead at every
    level. The phantom was in the matching, not the method. Proxy numbers from
    <code>e0_results.json</code>; corrected from the 50-seed reruns
    (E0 report and its E0b sweeps in <code>research/cosmic-web/docs/</code>).
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-match");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif", MONO = "'JetBrains Mono', monospace";
  const NG = ["2,500", "5,000", "20,000", "80,000"];
  const D = { proxy: [0.064, 0.044, -0.016, -0.025], corrected: [-0.045, -0.052, -0.053, -0.057] };
  const W = 560, H = 328, xL = 92, xR = 540, yT = 26, yB = 250;
  const ymin = -0.085, ymax = 0.085, Y = v => yB - (v - ymin) / (ymax - ymin) * (yB - yT);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  function render(mode) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const d = D[mode], bw = (xR - xL) / NG.length, y0 = Y(0);
    [-0.05, 0.05].forEach(v => svg.appendChild(el("line", { x1: xL, y1: Y(v), x2: xR, y2: Y(v), stroke: "#eee", "stroke-width": 1 })));
    [-0.05, 0.05].forEach(v => svg.appendChild(el("text", { x: xL - 8, y: Y(v) + 3, "text-anchor": "end", "font-size": 10, fill: "#aaa", "font-family": SANS }, (v > 0 ? "+" : "") + v.toFixed(2))));
    // zone labels
    svg.appendChild(el("text", { x: xL + 3, y: yT + 4, "text-anchor": "start", "font-size": 10.5, fill: "#2f855a", "font-family": SANS }, "▲ lift wins"));
    svg.appendChild(el("text", { x: xL + 3, y: yB - 3, "text-anchor": "start", "font-size": 10.5, fill: "#2b6cb0", "font-family": SANS }, "▼ Hessian wins"));
    d.forEach((v, i) => {
      const cx = xL + bw * (i + 0.5), wid = bw * 0.46, bx = cx - wid / 2;
      const up = v > 0, col = up ? "#2f855a" : "#2b6cb0";
      svg.appendChild(el("rect", { x: bx, y: up ? Y(v) : y0, width: wid, height: Math.abs(Y(v) - y0), fill: col, "fill-opacity": 0.85, rx: 1 }));
      svg.appendChild(el("text", { x: cx, y: up ? Y(v) - 6 : Y(v) + 14, "text-anchor": "middle", "font-size": 11, fill: col, "font-family": MONO }, (v > 0 ? "+" : "") + v.toFixed(3)));
      svg.appendChild(el("text", { x: cx, y: yB + 17, "text-anchor": "middle", "font-size": 10.5, fill: "#555", "font-family": SANS }, NG[i]));
    });
    svg.appendChild(el("line", { x1: xL, y1: y0, x2: xR, y2: y0, stroke: "#333", "stroke-width": 1.5 }));
    svg.appendChild(el("text", { x: xR, y: y0 - 5, "text-anchor": "end", "font-size": 10, fill: "#333", "font-family": SANS }, "Δ = 0 (tie)"));
    svg.appendChild(el("text", { x: (xL + xR) / 2, y: yB + 36, "text-anchor": "middle", "font-size": 11, fill: "#333", "font-family": SANS }, "galaxies in the box (sampling density)"));
    svg.appendChild(el("text", { x: xL - 8, y: yT - 12, "text-anchor": "end", "font-size": 10.5, fill: "#555", "font-family": SANS }, "ΔC = lift − Hessian"));
  }
  render("proxy");
  [["match-proxy", "proxy"], ["match-corr", "corrected"]].forEach(([id, mode]) => {
    const b = document.getElementById(id); if (!b) return;
    b.onclick = () => { render(mode); ["match-proxy", "match-corr"].forEach(x => document.getElementById(x).classList.remove("active")); b.classList.add("active"); };
  });
})();
</script>

<div class="l-body" markdown="1">

## Reference circularity

When no analytic truth exists, the temptation is to score each method's
sparse-data skeleton against a *reference skeleton* extracted from the
clean, noise-free field. The program's E1 ran the full 2×2 design — each
method's sparse skeleton against each method's clean reference — and found
each method scores **0.07–0.19 higher against the reference produced by
its own family**; the two clean references agree with each other only at
completeness ≈ 0.60 (E1, 12 seeds). Any single-reference comparison is
therefore circular: the choice of reference decides the winner before the
data are consulted.

The repair is a **method-neutral criterion** that needs no reference at
all: which skeleton's spines capture more mass (total, and in the
filament-density band) at matched length (E1b). Under that criterion the
verdicts stabilised across field types and resolutions.

## Held-out seeds and competitor-favouring calibration

Every tunable choice is an opportunity to overfit the benchmark. The
transport-model campaign used a three-tier seed protocol: the crossing
threshold $$\rho_c$$ was calibrated on seed 1 **by optimising the
isotropic competitor**, not the proposed model; configuration selection
used seeds {2, 3}; every reported number comes from held-out seeds
({4, 5, 6}, or the five held-out seeds of E5), with jackknife-over-seed
error bars (E5–E5d). Calibrating on the competitor is the cheap trick that
makes a win conservative: any residual bias in the shared knob favours the
opponent. When the frozen model then beats the ZA by −9% on seeds it never
saw, the number means something.

## Jackknife versus pair bootstrap

The observational campaign stacked Compton-y maps at 876,639 galaxy pairs.
Bootstrap over pairs treats each pair as independent — but pairs share
galaxies and overlap on the sky, so their map noise is correlated, and the
bootstrap error is too small. The validity battery (E3e) replaced it with
a **jackknife over 50 right-ascension patches**: delete one sky patch at a
time, remeasure, and read the variance from the spread. The deflation was
a factor 1.6–2.4 across instruments: the headline bridge significance on
ACT dropped from **5.24σ (pair bootstrap) to 3.30σ (jackknife)**, and
Planck's from 19.3σ to 7.99σ. Rule: resample units that are actually
exchangeable — sky patches, not overlapping pairs.

## Physically-null controls

An estimator can pass every statistical test and still measure an
instrumental artifact. The decisive check is a **control sample in which
the physics is absent by construction but every systematic is present**.
For the pair-bridge measurement: pairs with the same transverse separation
window but line-of-sight separation 25–40 h⁻¹Mpc — same sky geometry, same
halos, no possible physical bridge between them. On ACT the null pairs are
consistent with zero (1.65σ). On Planck they show a **4.7σ "bridge"**
(1.80×10⁻⁸) — direct, quantitative confirmation of second-halo beam
leakage at Planck's 10′ resolution (E3e; Appendix B5 explains the
mechanism). Without the null, that leakage would have been booked as
astrophysics. The physically meaningful number is the null-subtracted one:
~1.2–1.4×10⁻⁸ at ≈2σ per instrument (2.4σ Planck, 1.6σ ACT).

The same discipline applied on the sky in an earlier form: the spine-stack
controls were rejection-matched to the spine points' galactic-latitude
histogram, so a latitude-dependent foreground could not inflate the
detection (E3b) — and the stricter control *strengthened* the result, from
4.8σ to 9.0σ. Stricter controls do not always shrink signals; they shrink
lies.

## Oracle bounds as information limits

When a model underperforms, is the physics wrong or the estimation noisy?
The program answered with an **oracle**: rerun the transverse-damping
model with tidal frames computed from the *true* final N-body field
instead of the model's own evolving estimate (E5b). With oracle frames the
model beats the Zel'dovich baseline in **every** distance bin (−20% at the
web; 4.47 versus 5.00 overall), so the damping physics is uniformly
correct, and the practical model's small outskirts deficit was frame
estimation, not wrong physics. The oracle also *prices* the remaining
headroom — 0.46 voxels of recoverable error, more than any other
refinement lever — and grades the final model: the frozen recipe's 4.52
closes 89% of the gap to the 4.47 bound (E5d). An oracle bound converts
"could do better" into a number.

## Trust the bytes: the CAMELS twins

The referee battery required validating the program's own N-body truth
against two independent production codes. The second dataset chosen,
SIMBA_DM CV_0 from the public CAMELS suite, was checked before use with a
range-request hash comparison — and found **byte-identical** to the first,
IllustrisTNG_DM CV_0: the dark-matter-only "CV_0" runs of those two suites
are one shared simulation on the server (E12). Astrid_DM CV_0 (run with
MP-Gadget) was genuinely distinct and became the second code; the two real
codes agree with each other to 0.029 Mpc/h median per particle, and the
program's particle-mesh truth sits 0.41 Mpc/h from that consensus — an
order of magnitude below the 4–5 Mpc/h effects measured (E12). The lesson:
"independent dataset" is a hypothesis, and it is testable for pennies —
hash before you validate.

## The checklist

- Match comparisons on the score-determining quantity itself, never a proxy.
- Never score against a reference one contestant produced; prefer
  reference-free criteria.
- Calibrate shared knobs by optimising the *competitor*; select and
  validate on disjoint held-out seeds.
- Resample exchangeable units (sky patches), not overlapping ones (pairs).
- Run a control in which the physics is absent by construction; subtract
  what survives it.
- Buy an oracle bound: it separates wrong physics from noisy estimation
  and prices the remaining headroom.
- Hash "independent" datasets before trusting their independence.

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>F. Wilcoxon (1945). "Individual comparisons by ranking methods." <em>Biometrics Bulletin</em> 1, 80–83. The paired signed-rank test used throughout the benchmark.</li>
  <li>J. W. Tukey (1958). "Bias and confidence in not-quite large samples." <em>Ann. Math. Statist.</em> 29, 614; B. Efron (1979). "Bootstrap methods: another look at the jackknife." <em>Ann. Statist.</em> 7, 1–26.</li>
  <li>F. Villaescusa-Navarro et al. (2021). "The CAMELS project." <em>ApJ</em> 915, 71. Source of the external-validation simulations, including the byte-identical CV_0 twins.</li>
  <li>Experiment reports SYNTHESIS, E1, E1b, E5–E5d, E3b, E3e, E12 and the paper draft, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
