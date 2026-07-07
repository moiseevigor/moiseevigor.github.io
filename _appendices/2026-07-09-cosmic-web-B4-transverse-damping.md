---
layout: distill
title: "Appendix B4 — The Transverse-Damping Model, in Full"
subtitle: >
  The complete evidence chain behind the program's constructive result: the
  measured correction (E4), the first model and its oracle (E5, E5b), the
  frozen recipe (E5c/E5d), transfer with frozen knobs (E6, E7), field-level
  fidelity (E8), literature baselines (E9), and the two-code truth
  validation — with limitations and a reproduction map.
date: 2026-07-09 09:00:00
categories: [mathematics]
tags: [cosmic-web, zeldovich, adhesion, effective-models, cosmology]
description: >
  Full specification and evidence chain of the anisotropic-adhesion
  ("transverse damping") transport model: frozen recipe, model ladder against
  the oracle bound, MUSCLE and 2LPT baselines, transfer across clustering,
  resolution and cosmology, field-level r(k)/T(k), truth validation against
  Arepo and MP-Gadget, limitations, and Makefile reproduction targets.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B4
permalink: /mathematics/2026/07/09/cosmic-web-B4-transverse-damping/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The series' constructive product is a one-ingredient transport model:
Zel'dovich rays plus partial damping of the velocity components
perpendicular to the local filament axis at first shell-crossing. This
appendix states the frozen recipe precisely and walks the entire evidence
chain — E4 → E5 → E5b → E5c/E5d → E6/E7 → E8 → E9 — then the validation of
the truth itself against two production codes, the model's limitations, and
how to reproduce every number. All reports live in
<code>research/cosmic-web/docs/</code>; the model card is
<code>MODEL-CARD.md</code>.
</div>

## The recipe, frozen

Input: a linear initial density field (equivalently its Zel'dovich
displacement field) on a periodic grid. Output: approximate comoving
particle positions at the present epoch, at a small fraction of an N-body
run's cost (~18 cheap steps versus 90 force-solving steps). The rule
(E5d; MODEL-CARD):

- Evolve particles on straight Zel'dovich rays in growth-factor steps
  $$\Delta D = 0.05$$; no Poisson solves beyond cheap density deposits.
- At each step, deposit the model's own particles to a density grid.
- The first time a particle's local density exceeds $$\rho_c = 5$$, remove
  $$\beta = 60\%$$ of its velocity components perpendicular to the local
  filament axis $$e_3$$ — the minor eigenvector of the tidal tensor of the
  model's own density, smoothed at 2 h⁻¹Mpc and refreshed every third
  step. The along-axis component is never touched.

Three fixed numbers ($$\beta$$, $$\rho_c$$, the smoothing scale). Two
structural findings (E5c): partial damping ($$\beta < 1$$) is *required*
for self-estimated frames to pay — at full damping the model's own density
feedback over-triggers crossings and cancels the frame gain — and
pancake-ordered sequential damping underperforms both-perpendicular damping.

## The evidence chain, experiment by experiment

- **E4 — the measurement.** The residual between true particle-mesh (PM)
  N-body transport and each particle's own Zel'dovich (ZA) prediction is
  large near the web (RMS ≈ 4.4 voxels within 2 voxels of spines) and
  points *across* the filament axis at every distance: the needed
  correction is transverse arrest (full table in Appendix B2).
- **E5 — the first model.** ZA rays + full transverse damping with proxy
  frames: best of three models overall (4.91 versus ZA 5.00 and isotropic
  sticking 5.34), clearest at the web, with a small 2–4-voxel deficit.
- **E5b — the oracle.** Same model with tidal frames from the *true* final
  field: beats ZA in every distance bin (4.47 overall, −20% at the web).
  The E5 deficit was frame-estimation error; 0.46 voxels of headroom priced.
- **E5c/E5d — declared optimisation.** Selection on seeds {2, 3},
  validation on held-out {4, 5, 6}. Winner: self-density frames, β = 0.6,
  2 h⁻¹Mpc smoothing — 4.52 ± 0.18, within 0.05 of the oracle bound.
- **E6/E7 — transfer.** Frozen knobs across voxel size, clustering
  amplitude and cosmology: the advantage persists everywhere and grows
  with clustering.
- **E8 — field level.** Extends the usable wavenumber range of a ZA-based
  mock on both phases and amplitudes; isotropic sticking destroys phases.
- **E9 — baselines.** On identical initial conditions: statistical tie
  with MUSCLE, 2LPT degrades badly. The contribution is the mechanism,
  not a better engine.

## The model ladder

Median per-particle transport error against PM truth, in voxels (= h⁻¹Mpc),
held-out seeds — ZA reference 4.98 ± 0.27 on seeds {4, 5, 6} (E5–E5d, E9):

| stage | configuration | overall error (vox) | vs ZA |
|---|---|---|---|
| isotropic sticking (adhesion proxy) | full damping, all directions | 5.34 ± 0.15 | +7% |
| ZA baseline | straight rays, no damping | 4.98–5.00 | — |
| E5: first transverse model | β = 1, ZA-proxy frames | 4.91 ± 0.14 | −2% |
| E5c: refined | β = 0.75, self-density frames | 4.64 ± 0.18 | −7% |
| E5d: frozen recipe | β = 0.6, 2 h⁻¹Mpc frames | **4.52 ± 0.18** | **−9%** |
| E5b: oracle bound | true final-field frames | 4.47 ± 0.12 | −10% |
| MUSCLE (E9) | multiscale spherical collapse | 4.49 ± 0.12 | tie with frozen recipe |
| 2LPT (E9) | second-order perturbation theory | 8.07 ± 0.39 | +62% |

The frozen recipe closes 89% of the recoverable gap to the oracle. The
largest gains sit where the correction was measured: at 0–2 voxels from
spines the model reaches 5.77 ± 0.16 against ZA's 6.92 ± 0.31 (−17%), with
the oracle showing −20% available (E5b, E9). MUSCLE is slightly ahead at
the web (5.57 ± 0.07); the reading of the tie is the mechanism result —
a model with *only* the measured directional ingredient reproduces
MUSCLE-class transport, so shell-crossing prescriptions work because they
implement transverse arrest.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-ladder">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="lad-detail">ladder detail</button>
    <button class="fig-toggle" id="lad-full">full range (incl. 2LPT)</button>
  </div>
  <div id="cw-ladder" style="text-align:center;"></div>
  <figcaption>
    <strong>The model ladder — one ingredient, near the ceiling.</strong> Median
    per-particle transport error against particle-mesh truth (voxels = <em>h</em>⁻¹Mpc;
    <em>lower is better</em>; bars are ±1 s.d. over held-out seeds). The two dashed lines
    mark the achievable window: the Zel'dovich baseline (no correction) and the
    <em>oracle bound</em> (the same model handed the true final-field frames). The
    <strong>frozen recipe</strong> — Zel'dovich rays plus a single transverse-damping knob
    <em>β</em> = 0.6 — lands at 4.52, closing 89% of the recoverable gap and tying MUSCLE,
    a far more elaborate scheme. Second-order perturbation theory (2LPT) is +62% worse;
    switch to <em>full range</em> to see it. Every value is from the E5–E9 experiment
    artifacts in <code>research/cosmic-web/</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-ladder");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif", MONO = "'JetBrains Mono', monospace";
  const M = [
    { n: "oracle bound (E5b)",      e: 4.47, s: 0.12, ref: 1 },
    { n: "MUSCLE (E9)",             e: 4.49, s: 0.12 },
    { n: "frozen recipe (E5d)",     e: 4.52, s: 0.18, hero: 1 },
    { n: "refined (E5c)",           e: 4.64, s: 0.18 },
    { n: "first transverse (E5)",   e: 4.91, s: 0.14 },
    { n: "ZA baseline",             e: 4.98, s: 0.27, za: 1 },
    { n: "isotropic sticking",      e: 5.34, s: 0.15 },
    { n: "2LPT (E9)",               e: 8.07, s: 0.39 }
  ];
  const ZA = 4.98, OR = 4.47;
  const W = 620, H = 300, xL = 188, xR = 602, yT = 16, yB = 250;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "620px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const rowY = i => yT + (yB - yT) * (i + 0.5) / M.length;

  function render(mode) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const xmin = mode === "full" ? 4.3 : 4.35, xmax = mode === "full" ? 8.3 : 5.5;
    const X = v => xL + (v - xmin) / (xmax - xmin) * (xR - xL);
    // recoverable-gap band between oracle and ZA
    svg.appendChild(el("rect", { x: X(OR), y: yT, width: X(ZA) - X(OR), height: yB - yT, fill: "#eef3e9" }));
    // reference lines
    [[OR, "#2f855a", "oracle bound"], [ZA, "#999", "Zel'dovich baseline"]].forEach(([v, c, lab]) => {
      svg.appendChild(el("line", { x1: X(v), y1: yT - 2, x2: X(v), y2: yB, stroke: c, "stroke-width": 1.3, "stroke-dasharray": "4 3" }));
      svg.appendChild(el("text", { x: X(v), y: yB + 30, "text-anchor": "middle", "font-size": 10, fill: c, "font-family": SANS }, lab));
    });
    // x axis
    svg.appendChild(el("line", { x1: xL, y1: yB, x2: xR, y2: yB, stroke: "#333", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: (xL + xR) / 2, y: yB + 46, "text-anchor": "middle", "font-size": 11, fill: "#333", "font-family": SANS }, "median transport error  (voxels = h⁻¹Mpc, lower is better)"));
    M.forEach((m, i) => {
      const y = rowY(i);
      const col = m.hero ? "#2f855a" : (m.ref || m.za) ? "#666" : (m.e < ZA ? "#2b6cb0" : "#dd6b20");
      svg.appendChild(el("text", { x: xL - 10, y: y + 3.5, "text-anchor": "end", "font-size": 11.5,
        "font-weight": m.hero ? 700 : 400, fill: m.hero ? "#2f855a" : "#333", "font-family": SANS }, m.n));
      if (m.e > xmax) {  // off-scale (2LPT in detail mode)
        svg.appendChild(el("text", { x: xR - 2, y: y + 3.5, "text-anchor": "end", "font-size": 11, fill: col, "font-family": MONO }, m.e.toFixed(2) + " →"));
        return;
      }
      svg.appendChild(el("line", { x1: X(m.e - m.s), y1: y, x2: X(m.e + m.s), y2: y, stroke: col, "stroke-width": 1.5 }));
      svg.appendChild(el("circle", { cx: X(m.e), cy: y, r: m.hero ? 6 : 4.2, fill: col }));
      svg.appendChild(el("text", { x: X(m.e), y: y - 9, "text-anchor": "middle", "font-size": 10.5,
        "font-weight": m.hero ? 700 : 400, fill: col, "font-family": MONO }, m.e.toFixed(2)));
    });
  }
  const bD = document.getElementById("lad-detail"), bF = document.getElementById("lad-full");
  bD.onclick = () => { render("detail"); bD.classList.add("active"); bF.classList.remove("active"); };
  bF.onclick = () => { render("full"); bF.classList.add("active"); bD.classList.remove("active"); };
  render("detail");
})();
</script>

<div class="l-body" markdown="1">

## Transfer with frozen knobs

No re-calibration anywhere; resolution rows in physical h⁻¹Mpc (E6, E7,
E7b):

| condition | seeds | ZA all | model all | Δ all | ZA web | model web | Δ web |
|---|---|---|---|---|---|---|---|
| base (EdS, σ₈ = 0.8, 1 h⁻¹Mpc vox) | 3 | 4.98 | 4.52 | −9% | 6.93 | 5.78 | −17% |
| coarse (2 h⁻¹Mpc voxels) | 3 | 2.09 | 2.04 | −2% | 3.37 | 3.08 | −9% |
| σ₈ = 0.6 | 3 | 2.98 | 2.89 | −3% | 4.73 | 4.26 | −10% |
| σ₈ = 1.0 | 3 | 7.20 | 6.23 | −13% | 9.36 | 7.33 | −22% |
| flat ΛCDM, Ωm = 0.31 | 3 | 4.93 | 4.45 | −10% | 6.90 | 5.73 | −17% |
| 0.5 h⁻¹Mpc voxels (EdS) | 1 (+2 in E7b) | 4.95 | 4.45 | −10% | 6.76 | 5.72 | −15% |

Here σ₈ is the clustering amplitude of the initial conditions, "EdS" is
Einstein–de Sitter expansion, and "web" means within 2 h⁻¹Mpc of the spine
network. The advantage grows monotonically with clustering (−3% → −9% →
−13% overall) — the behaviour of a physical shell-crossing correction,
since higher σ₈ means more crossings — and is nearly identical between EdS
and ΛCDM, as expected for a growth-factor-parametrised geometric term;
physical-unit errors at 0.5 and 1 h⁻¹Mpc voxels match, so the error scale
is set by the physics, not the grid.

## Field-level fidelity

Density fields against PM truth, 3 seeds (E8, E9). The cross-correlation r(k)
measures phase/structure fidelity at wavenumber k, in h/Mpc (1 = perfect);
the transfer function T(k) measures amplitude fidelity (1 = unbiased).

| k | r: ZA | r: 2LPT | r: MUSCLE | r: damp | T: ZA | T: 2LPT | T: MUSCLE | T: damp |
|---|---|---|---|---|---|---|---|---|
| 0.14 | 0.975 | 0.933 | 0.956 | 0.962 | 0.693 | 0.607 | 0.669 | 0.739 |
| 0.34 | 0.710 | 0.691 | 0.771 | 0.716 | 0.229 | 0.202 | 0.433 | 0.410 |
| 0.53 | 0.288 | 0.430 | 0.527 | 0.388 | 0.098 | 0.095 | 0.305 | 0.262 |
| 0.82 | 0.057 | 0.144 | 0.228 | 0.095 | 0.052 | 0.048 | 0.210 | 0.143 |

The damping model beats ZA on both statistics in the nonlinear regime;
isotropic sticking (not shown) collapses to r = 0.089 at k = 0.53 (E8).
Against MUSCLE the strengths are complementary — MUSCLE wins small-scale
phases, the damping model mid-scale amplitudes — so a field-level hybrid is
the natural future work; the naive trigger-level hybrid was tested and
refuted (4.67, worse than both parents; E11).

## Is the truth true? Two-code validation

All errors above are measured against the program's own PM integrator, so
the truth itself was audited. Time convergence: doubling to 180 steps
shifts the median final position by 0.008 voxels and leaves the comparison
invariant (E10). External validation: evolved from the CAMELS CV_0 initial
conditions, the PM integrator reproduces the official final particle
positions to a median matched-ID offset of **0.41 Mpc/h** against both
Arepo and MP-Gadget — and those two production codes agree with each other
to **0.029 Mpc/h** median (E12). The hierarchy is what matters: code
consensus 0.03 ≪ our PM offset 0.41 ≪ measured effects 4–5 Mpc/h.

## Limitations

From the model card (MODEL-CARD), quantified:

- **One-shot damping.** Only the first crossing is treated; multi-stream
  interiors are out of scope by design. Residual web error (5.5–6 voxels
  even at the oracle bound) is post-crossing physics; do not interpret
  positions within ~2 voxels of density peaks as resolved halo structure.
- **Verified scope.** Frozen knobs verified for voxels 0.5–2 h⁻¹Mpc,
  σ₈ ∈ [0.6, 1.0], EdS and flat ΛCDM (Ωm = 0.31). Beyond that, and at
  other box sizes or tracer densities, re-calibrate β and ρ_c against a
  small PM truth, optimising the competitor first (Appendix B3); the β
  optimum is a flat minimum possibly slightly below 0.6.
- **Web-region correction, not global.** Gains far from the web are −2%.
- **Large-scale amplitude.** ~7% T(k) deficit in the largest-scale bin;
  rescale before use in mocks.

## Reproduce

Every table above regenerates from <code>research/cosmic-web/</code>
(Python virtualenv per <code>requirements.txt</code>):

```bash
cd research/cosmic-web
make residual           # E4: the measured correction (Appendix B2 table)
make model-ladder       # E5, E5b, E5c, E5d: the ladder and the oracle
make baselines          # E9: 2LPT and MUSCLE on identical ICs
make transfer           # E6, E7, E7b: frozen-knob transfer matrix
make field-level        # E8: r(k) and T(k)
make truth-validation   # E10 convergence; E12 external checks
```

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>Ya. B. Zel'dovich (1970). "Gravitational instability: an approximate theory for large density perturbations." <em>Astron. Astrophys.</em> 5, 84–89.</li>
  <li>S. N. Gurbatov, A. I. Saichev &amp; S. F. Shandarin (1989). "The large-scale structure of the universe in the frame of the model equation of non-linear diffusion." <em>MNRAS</em> 236, 385–402.</li>
  <li>M. C. Neyrinck (2016). "Truthing the stretch: non-perturbative cosmological realizations with multiscale spherical collapse (MUSCLE)." <em>MNRAS</em> 455, 1204.</li>
  <li>F. R. Bouchet, S. Colombi, E. Hivon &amp; R. Juszkiewicz (1995). "Perturbative Lagrangian approach to gravitational instability." <em>A&amp;A</em> 296, 575.</li>
  <li>F. Villaescusa-Navarro et al. (2021). "The CAMELS project." <em>ApJ</em> 915, 71.</li>
  <li>Model card (<code>MODEL-CARD.md</code>), experiment reports E4–E12 and the paper draft, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
