---
layout: distill
title: "Appendix B1 — How the Universe Moves Its Matter: Transport Models"
subtitle: >
  The Zel'dovich approximation as free motion in growth-factor time, why
  second-order perturbation theory overshoots at shell-crossing, the adhesion
  model as Hopf–Lax optimal transport on a flat metric, MUSCLE's spherical
  collapse — and the transverse-damping recipe the research program froze.
date: 2026-07-06 09:00:00
categories: [mathematics]
tags: [cosmic-web, zeldovich, adhesion, optimal-transport, cosmology]
description: >
  Self-contained tour of the fast transport models of large-scale structure:
  the Zel'dovich approximation, 2LPT and its shell-crossing overshoot, the
  adhesion/Burgers model and the Hopf–Lax formula, MUSCLE, the flat
  optimal-transport theorem chain, and the frozen transverse-damping recipe.
  Companion appendix to the Geometry of the Cosmic Web series.
series: geometry-of-cosmic-web
series_title: "Geometry of the Cosmic Web"
series_part: B1
permalink: /mathematics/2026/07/06/cosmic-web-B1-transport-models/
published: false
comments: true
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix covers</div>
The series compares fast <em>transport models</em> — recipes that move the
early Universe's matter to its present positions without a full gravity
simulation. This appendix defines each from scratch: the Zel'dovich
approximation as free motion, 2LPT and its shell-crossing overshoot, the
adhesion model and its Hopf–Lax solution, the optimal-transport chain that
identifies filaments as <em>shocks</em> of a flat map, and MUSCLE — ending
with the precise transverse-damping recipe the program distilled from all of
them. Numbers cite the reports in <code>research/cosmic-web/docs/</code> by
name, e.g. "(E9)".
</div>

## The problem every transport model solves

The input is the infant Universe: a nearly uniform matter distribution with
tiny density ripples, summarised by an initial gravitational
potential $$\Phi_0(\mathbf{q})$$, where $$\mathbf{q}$$ labels each parcel of
matter by its starting (Lagrangian) position. The output is the parcel's final
(Eulerian) position $$\mathbf{x}$$ today, in comoving coordinates — coordinates
that expand with the Universe, so the overall expansion is factored out. A full N-body simulation integrates gravity step by step; a transport
model replaces that with a formula or a near-free evolution rule. Time is
best measured not in years but
by the **linear growth factor** $$D(t)$$, the overall factor by which small
density ripples have grown, because the equations below are simplest in that
variable. The shared obstacle is **shell-crossing**: the moment two streams of
matter first try to occupy the same place, where the density is formally
infinite (a caustic). How the models cope with that moment is where they differ.

## The Zel'dovich approximation: straight lines in growth-factor time

The Zel'dovich approximation (ZA; Zel'dovich 1970) is first-order Lagrangian
perturbation theory: each parcel moves ballistically along the initial force
direction. Differentiating the map with respect to $$D$$ shows the velocity is
constant along each trajectory:

$$
\mathbf{x}(\mathbf{q}, D) \;=\; \mathbf{q} \;-\; D\,\nabla_q \Phi_0(\mathbf{q}),
\qquad
\frac{d\mathbf{x}}{dD} \;=\; -\nabla_q \Phi_0(\mathbf{q}) \;=\; \mathrm{const}.
$$

Every trajectory is a **straight line traversed at constant velocity** in the
variables $$(\mathbf{x}, D)$$. Such paths extremise the free action

$$
S[\mathbf{x}] \;=\; \int \Bigl|\frac{d\mathbf{x}}{dD}\Bigr|^{2}\, dD ,
$$

so they are geodesics of the **flat Euclidean metric**. The gravitational
potential exerts no force during the evolution at all: in $$D$$-time it is
absorbed entirely into the initial velocities $$\mathbf{v}_0 = -\nabla\Phi_0$$.
This constructively refutes any Jacobi-type "effective metric" picture in which
paths would be cheap along potential valleys (T1): a Jacobi metric reweights
paths by the potential *along* the path, and here there is no potential along
the path left to reweight.

The ZA's failure mode follows from its virtue: straight lines do not stop — a
parcel falling into a forming wall sails straight *through* it. Measured
against particle-mesh (PM) N-body truth from identical initial conditions, the
ZA's median per-particle transport error is 4.98–5.00 voxels, where one voxel
is one grid cell of 1 h⁻¹Mpc ≈ 1.4 megaparsecs (E5, E9).

## Why 2LPT overshoots at shell-crossing

Second-order Lagrangian perturbation theory (2LPT; Bouchet et al. 1995,
Scoccimarro 1998) adds the next term of the displacement series, sourced by a
second-order potential:

$$
\boldsymbol{\Psi} \;=\; -\,D\,\nabla_q \Phi^{(1)} + D_2\,\nabla_q \Phi^{(2)}, \qquad D_2 \simeq -\tfrac{3}{7} D^{2}, \qquad
\nabla_q^{2} \Phi^{(2)} \;=\; \sum_{i>j} \Bigl[ \Phi^{(1)}_{,ii}\,\Phi^{(1)}_{,jj} - \bigl(\Phi^{(1)}_{,ij}\bigr)^{2} \Bigr].
$$

On large, still-linear scales this is a genuine improvement. But the series is
an expansion around uncollapsed flow: it has no mechanism for *stopping*. Near
shell-crossing the second-order term keeps accelerating parcels into and
through the caustic — the known 2LPT overshoot in collapsed regions. Measured
on identical initial conditions and identical PM truth, 2LPT's median
transport error is **8.07 ± 0.39 voxels** against the plain ZA's 4.97 ± 0.27
(E9) — the "better" perturbative term makes transport *worse* by 62%. The
pattern — arresting particles beats perturbing them — is the empirical thread
of the whole series.

## The adhesion model: Burgers viscosity and the Hopf–Lax formula

The adhesion model (Gurbatov, Saichev & Shandarin 1989) repairs the ZA's
sail-through with an infinitesimal viscosity, so that streams stick instead
of crossing. The velocity field obeys Burgers' equation,

$$
\partial_D \mathbf{v} + (\mathbf{v}\cdot\nabla)\,\mathbf{v} \;=\; \nu\,\Delta \mathbf{v}, \qquad \nu \to 0^{+}, \qquad \mathbf{v} = \nabla\psi ,
$$

with $$\psi$$ the velocity potential; the Hopf–Cole transformation solves it
exactly, and the vanishing-viscosity limit is the **Hopf–Lax formula** (Hopf
1950; Lax 1957):

$$
\psi(\mathbf{x}, D) \;=\; \min_{\mathbf{q}} \left[ \psi_0(\mathbf{q}) + \frac{|\mathbf{x}-\mathbf{q}|^{2}}{2D} \right].
$$

Matter still travels on straight rays, but where rays collide it sticks —
sheets, filaments and nodes persist instead of dissolving. The classical
particle-form proxy is **isotropic sticking**: at shell-crossing, damp *all*
velocity components. Measured, it overcorrects — 5.34 ± 0.15 voxels, worse
than the plain ZA's 5.00 (E5) — and destroys small-scale phase fidelity,
because it kills the along-filament motion real gravity preserves (E8).

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-transport">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="tr-adh">adhesion (sticks)</button>
    <button class="fig-toggle" id="tr-za">Zel'dovich (sails through)</button>
  </div>
  <div style="text-align:center; font-family:'Source Sans 3',sans-serif; font-size:12.5px; color:#555; margin-bottom:0.3em;">
    early&nbsp;<input type="range" id="tr-D" min="0" max="120" value="88" style="width:210px; vertical-align:middle; accent-color:#1565c0;">&nbsp;collapsed &nbsp;<span style="color:#888;">(growth factor)</span>
  </div>
  <div id="cw-transport" style="text-align:center;"></div>
  <figcaption>
    <strong>Two transport models, one collapse.</strong> 600 matter parcels, initially
    uniform, displaced by a fixed initial push; the curve is density (parcels per bin).
    Drag from early times to late. Under <strong>Zel'dovich</strong> matter moves on
    straight rays at constant speed, so where a wall forms the parcels <em>sail straight
    through</em> and the peak smears (multi-streaming). Under <strong>adhesion</strong> an
    infinitesimal viscosity makes colliding streams <em>stick</em>, so the same walls
    sharpen into persistent structures — the sheets, filaments and nodes of the web (here
    the 1-D shock solution, a monotone pool-adjacent-violators rearrangement). The faint
    line shows the other model for comparison. This streaming-versus-sticking split is
    exactly why filaments are the <em>shocks</em> of the flat transport map (next section).
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("cw-transport");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const N = 600, AMP = 0.13, NB = 64;
  const q = [], v = [];
  for (let i = 0; i < N; i++) { const Q = (i + 0.5) / N; q.push(Q); v.push(Math.sin(4 * Math.PI * Q)); }
  function pava(x) {                       // monotone rearrangement = 1-D adhesion shock solution
    const st = [];
    for (let i = 0; i < x.length; i++) {
      let cur = { s: x[i], n: 1, val: x[i] };
      while (st.length && st[st.length - 1].val >= cur.val) { const p = st.pop(); cur.s += p.s; cur.n += p.n; cur.val = cur.s / cur.n; }
      st.push(cur);
    }
    const out = []; for (const b of st) for (let k = 0; k < b.n; k++) out.push(b.val); return out;
  }
  function hist(x) { const h = new Array(NB).fill(0); for (const xi of x) { let b = Math.floor(xi * NB); if (b < 0) b = 0; if (b >= NB) b = NB - 1; h[b]++; } return h; }
  const W = 560, H = 300, xL = 40, xR = 540, yT = 24, yB = 236;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, txt) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const slider = document.getElementById("tr-D");
  let mode = "adhesion";
  function render() {
    const D = (+slider.value) / 100;
    const z = q.map((Q, i) => Q + D * AMP * v[i]);
    const hz = hist(z), ha = hist(pava(z));
    const mx = Math.max(...hz, ...ha, 1);
    const sel = mode === "adhesion" ? ha : hz, oth = mode === "adhesion" ? hz : ha;
    const col = mode === "adhesion" ? "#2f855a" : "#2b6cb0";
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(el("line", { x1: xL, y1: yB, x2: xR, y2: yB, stroke: "#333", "stroke-width": 1 }));
    const bw = (xR - xL) / NB, Yb = c => yB - (c / mx) * (yB - yT);
    sel.forEach((c, b) => { if (c === 0) return; svg.appendChild(el("rect", { x: xL + b * bw + 0.4, y: Yb(c), width: bw - 0.8, height: yB - Yb(c), fill: col, "fill-opacity": 0.82 })); });
    svg.appendChild(el("polyline", { points: oth.map((c, b) => `${xL + (b + 0.5) * bw},${Yb(c)}`).join(" "), fill: "none", stroke: "#bbb", "stroke-width": 1.2 }));
    svg.appendChild(el("text", { x: (xL + xR) / 2, y: yB + 22, "text-anchor": "middle", "font-size": 11, fill: "#333", "font-family": SANS }, "position along the box"));
    svg.appendChild(el("text", { x: xL, y: yT - 10, "text-anchor": "start", "font-size": 10.5, fill: "#555", "font-family": SANS }, "density of matter"));
    const msg = mode === "adhesion" ? "streams stick → sharp, persistent structures" : "straight rays sail through → the peak smears";
    svg.appendChild(el("text", { x: xR, y: yT - 10, "text-anchor": "end", "font-size": 11, fill: col, "font-weight": 600, "font-family": SANS }, msg));
  }
  slider.addEventListener("input", render);
  const bA = document.getElementById("tr-adh"), bZ = document.getElementById("tr-za");
  bA.onclick = () => { mode = "adhesion"; bA.classList.add("active"); bZ.classList.remove("active"); render(); };
  bZ.onclick = () => { mode = "zeldovich"; bZ.classList.add("active"); bA.classList.remove("active"); render(); };
  render();
})();
</script>

<div class="l-body" markdown="1">

## The theorem chain: flat optimal transport, filaments as shocks

The Hopf–Lax formula identifies the flow's exact variational principle: a
minimisation over straight-line paths with quadratic
cost $$|\mathbf{x}-\mathbf{q}|^{2}$$ plus initial data is precisely the
**Monge–Kantorovich optimal-transport problem**. The chain (T1): Brenier's polar factorisation theorem (Brenier 1991) guarantees the
quadratic-cost optimal map is the gradient of a convex potential; Frisch,
Matarrese, Mohayaee & Sobolevski (2002) turned this into cosmology's MAK
reconstruction — recovering initial conditions from final positions *is*
quadratic-cost optimal transport. The geometry governing cosmic-web transport
is therefore **flat metric, straight rays, plus a Legendre-type
convexification of the initial potential**. Filaments and nodes are the places
where the Hopf–Lax minimiser jumps between branches — the **shock set
(caustics) of the transport map** — not geodesics of any curved or lifted
metric: structure lives in the singularities of the map, not in curved paths.

This derivation predicts the two dynamical signatures the simulations found
(E2, E4): matter arrives at a filament along straight rays that terminate *on*
the shock set — generically **transverse** to it (direction statistic
0.21–0.30 versus the isotropic 1/3) — and after absorption only the tangential
pre-shock velocity survives: weak along-filament streaming inside the tube
(0.364 ± 0.010 within ~4 voxels of spines).

## MUSCLE: spherical collapse as the sticking rule

MUSCLE (MUltiscale Spherical-CoLlapse Evolution; Neyrinck 2016) keeps the ZA's
displacement structure but replaces its linear divergence $$\psi_{\mathrm{div}} = -D\,\delta_0$$
(which never knows that collapse has happened, $$\delta_0$$ being the initial
density contrast) with the spherical-collapse remapping

$$
\psi_{\mathrm{sc}}(\mathbf{q}, D) \;=\; 3\left[ \sqrt{1 - \tfrac{2}{3}\,D\,\delta_0(\mathbf{q})\,} \;-\; 1 \right],
$$

which reaches the collapse value −3 at *finite* linear density, so collapsed
parcels stop compressing; MUSCLE evaluates the rule on the initial field
smoothed at a hierarchy of scales and declares a parcel collapsed if the
threshold is crossed at *any* scale. On identical initial conditions MUSCLE
statistically ties the frozen transverse-damping model (4.49 ± 0.12 vs
4.52 ± 0.18 voxels), winning small-scale phase fidelity while the damping
model wins mid-scale amplitudes (E9). The mechanism reading: MUSCLE-class
prescriptions work *because* they implement transverse arrest — the
correction budget that E4 measured directly.

## The transverse-damping recipe, stated precisely

The program's own model adds exactly one rule to the ZA, every parameter
frozen by the declared optimisation campaign (E5c, E5d; model card: <code>docs/MODEL-CARD.md</code>):

- **Rays.** Evolve particles on straight ZA rays in growth-factor steps
  $$\Delta D = 0.05$$ (about 18 steps; only cheap density deposits).
- **Trigger.** At each step, deposit the model's own particles to a density
  grid. A particle "crosses" the first time its local density exceeds
  $$\rho_c = 5$$ (in units of the mean).
- **Damping.** At first crossing, remove $$\beta = 0.6$$ (60%) of the velocity
  components perpendicular to the local filament axis $$e_3$$ (minor
  eigenvector of the tidal tensor of the model's own density, smoothed at
  2 h⁻¹Mpc, refreshed every third step); never touch the along-axis component.

Three fixed numbers ($$\beta$$, $$\rho_c$$, the smoothing scale). Held-out:
4.52 ± 0.18 voxels against the ZA's 4.98 ± 0.27 (−9%), within 0.05 of the
oracle bound 4.47 (E5d, E5b). Appendix B4 walks the full evidence chain;
Appendix B2 explains the tidal frame the rule lives in.

## Back to the series

Back to the series: [The Geometry of the Cosmic Web: A Research Program](/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/) · [Two Ways to See a Cosmic Filament](/mathematics/2026/07/04/cosmic-web-two-models/).

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>Ya. B. Zel'dovich (1970). "Gravitational instability: an approximate theory for large density perturbations." <em>Astron. Astrophys.</em> 5, 84–89.</li>
  <li>F. R. Bouchet, S. Colombi, E. Hivon &amp; R. Juszkiewicz (1995). "Perturbative Lagrangian approach to gravitational instability." <em>A&amp;A</em> 296, 575; R. Scoccimarro (1998). "Transients from initial conditions: a perturbative analysis." <em>MNRAS</em> 299, 1097–1118.</li>
  <li>S. N. Gurbatov, A. I. Saichev &amp; S. F. Shandarin (1989). "The large-scale structure of the universe in the frame of the model equation of non-linear diffusion." <em>MNRAS</em> 236, 385–402.</li>
  <li>E. Hopf (1950). "The partial differential equation u<sub>t</sub> + uu<sub>x</sub> = μu<sub>xx</sub>." <em>Comm. Pure Appl. Math.</em> 3, 201–230; P. D. Lax (1957). "Hyperbolic systems of conservation laws II." <em>Comm. Pure Appl. Math.</em> 10, 537–566.</li>
  <li>Y. Brenier (1991). "Polar factorization and monotone rearrangement of vector-valued functions." <em>Comm. Pure Appl. Math.</em> 44, 375–417; U. Frisch, S. Matarrese, R. Mohayaee &amp; A. Sobolevski (2002). "A reconstruction of the initial conditions of the Universe by optimal mass transportation." <em>Nature</em> 417, 260–262.</li>
  <li>M. C. Neyrinck (2016). "Truthing the stretch: non-perturbative cosmological realizations with multiscale spherical collapse (MUSCLE)." <em>MNRAS</em> 455, 1204.</li>
  <li>Experiment reports T1, E2, E4, E5, E8, E9 and the model card, in <code>research/cosmic-web/docs/</code> of <a href="https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web">the repository</a>.</li>
</ol>
</div>
</div>
