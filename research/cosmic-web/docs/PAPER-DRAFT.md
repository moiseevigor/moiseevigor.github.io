# The correction beyond Zel'dovich is transverse: a measured mechanism for shell-crossing models of cosmic-web transport

*Draft — 2026-07-05. Source of every number: the experiment reports in `research/cosmic-web/docs/` (E0–E12, T1, MODEL-CARD).*

## Abstract

Lagrangian approximations to cosmic structure formation — the Zel'dovich approximation (ZA), 2LPT, adhesion, and shell-crossing prescriptions of the MUSCLE class — are the transport engines of fast mock catalogues and reconstruction, yet *why* shell-crossing corrections outperform perturbative ones has not been directly measured. Using particle-mesh (PM) N-body simulations evolved from the same initial conditions as the approximations they test, we measure the residual between true transport and each particle's own ZA prediction in the local tidal eigenframe. The residual is large near the web (RMS ≈ 4.4 h⁻¹Mpc within 2 h⁻¹Mpc of filament spines) and biased perpendicular to the filament axis at *all* distances (⟨(R̂·e₃)²⟩ = 0.21–0.30 versus the isotropic 1/3; 6 simulations × 50,000 particles). A single-ingredient model built from exactly this measurement — ZA rays plus partial (β = 0.6) transverse momentum damping at first shell-crossing — reduces held-out median transport error from 4.98 to 4.52 h⁻¹Mpc, within 0.05 of the frame-information oracle bound (4.47), and statistically ties MUSCLE (4.49 ± 0.12 vs 4.52 ± 0.18, 3 seeds) while 2LPT degrades to 8.07. With frozen parameters the advantage persists across σ₈ ∈ [0.6, 1.0] (growing with clustering, −3% → −13%), voxel scales 0.5–2 h⁻¹Mpc, and EdS versus flat ΛCDM. The exact variational structure of the ZA/adhesion flow — Hopf–Lax quadratic-cost optimal transport on a flat metric — identifies the measured term as the shock-formation correction: shell-crossing models work because they implement transverse arrest.

## 1. Introduction

Fast approximations to gravitational transport underpin much of large-scale-structure practice. The Zel'dovich approximation (ZA; Zel'dovich 1970) moves mass on straight ballistic trajectories set by the initial gravitational potential; second-order Lagrangian perturbation theory (2LPT; Bouchet et al. 1995, Scoccimarro 1998) adds the leading nonlinear correction; the adhesion model (Gurbatov, Saichev & Shandarin 1989) regularises the ZA's multi-streaming with an infinitesimal Burgers viscosity so that matter sticks at shell-crossing; spherical-collapse remappings and their multiscale extension MUSCLE (Neyrinck 2013, 2016) replace the ZA divergence with a collapse-aware prescription; ALPT (Kitaura & Heß 2013) splits scales between 2LPT and spherical collapse; COLA (Tassev, Zaldarriaga & Eisenstein 2013) trades exactness for a few corrective time steps. A consistent empirical pattern runs through this literature: at nonlinear scales, prescriptions that *arrest* particles at shell-crossing beat prescriptions that *perturb* their trajectories — MUSCLE-class models outperform 2LPT, which is known to overshoot in collapsed regions. What has been missing is a direct measurement of the correction these models are implicitly supplying: the residual between true gravitational transport and the ZA prediction, resolved in the frame that organises collapse.

This paper supplies that measurement and traces its consequences. It is a mechanism paper, not a better-engine paper: the model we build is a probe of *why* shell-crossing corrections work, and its headline result is that a single directional ingredient reproduces MUSCLE-level transport accuracy.

Our contributions, in order:

1. **A direct measurement of the beyond-ZA correction (Section 3.1).** In PM N-body simulations evolved from the same initial conditions, the per-particle residual R = x_true − x_ZA is large near the web and preferentially *perpendicular* to the filament axis in the local tidal eigenframe at all distances: ⟨(R̂·e₃)²⟩ = 0.21–0.30 versus the isotropic 1/3, with per-axis RMS ratio R∥/R⊥ = 0.63–0.89 (6 simulations, 50,000 tracked particles each).
2. **A sufficiency test (Section 3.2).** A model containing only this ingredient — ZA rays plus partial transverse momentum damping at first shell-crossing — reaches held-out median transport error 4.52 ± 0.18 h⁻¹Mpc versus ZA's 4.98 ± 0.27, within 0.05 of an oracle bound (4.47 ± 0.12) obtained by giving the model the true final tidal frames. On identical initial conditions it statistically ties MUSCLE (4.49 ± 0.12) while 2LPT degrades to 8.07 ± 0.39. This explains the MUSCLE-class advantage: transverse arrest is the correction budget.
3. **Robustness with frozen parameters (Section 3.3).** The advantage transfers without re-calibration across σ₈ = 0.6–1.0 (growing monotonically with clustering), voxel scales 0.5–2 h⁻¹Mpc, and EdS versus flat ΛCDM (Ωm = 0.31); the PM truth is converged in time (0.008-voxel shift under step doubling); at the field level the model extends the usable k-range of ZA with a rescalable large-scale amplitude deficit.
4. **A theoretical identification (Section 4).** The exact variational principle of the ZA/adhesion flow is the Hopf–Lax formula — quadratic-cost optimal transport on a *flat* metric (Hopf 1950; Lax 1957; Brenier 1991; Frisch et al. 2002). Filaments are shocks of the transport map, and the measured transverse residual is the shock-formation term.
5. **Secondary results (Section 5):** an evaluation-methodology lesson (a proxy-matched comparison manufactured a p ≈ 10⁻¹⁴ false positive), the outcome of a filament-finder comparison including a descriptor that survives on real survey data, and an observational validation of the extracted web against Planck and ACT Compton-y maps.

## 2. Methods

### 2.1 Truth: PM N-body simulations and convergence

Truth throughout is a particle-mesh (PM) N-body integrator: 128³ grid and 128³ particles in a periodic box of L = 128 h⁻¹Mpc (1 voxel = 1 h⁻¹Mpc), FFT Poisson solver, kick–drift–kick leapfrog with 90 steps from a = 0.1 to a = 1, Einstein–de Sitter (EdS) expansion in the primary runs and flat ΛCDM (Ωm = 0.31) in the transfer test. Initial conditions are Gaussian fields with a BBKS spectrum normalised to σ₈ = 0.8 (varied in Section 3.3), displaced by ZA to a = 0.1. Each approximation under test is evolved from the *same* initial field, so residuals are per-particle and exact.

Time convergence of the truth (E10): doubling to 180 steps shifts the median final position by 0.008 voxels — three orders of magnitude below the effects measured — and leaves the model-versus-ZA comparison invariant (advantage −6.8% against both the 90-step and 180-step truths). Grid convergence is covered by the 256³ runs of Section 3.3. An external cross-check (E12) validates the integrator against a production code: evolved from the CAMELS CV_0 initial conditions (2LPT, Ωm = 0.3, 256³ particles, 25 h⁻¹Mpc box; Villaescusa-Navarro et al. 2021), our PM reproduces the official z = 0 particle positions to a median matched-ID offset of 0.41 h⁻¹Mpc against both Arepo and MP-Gadget truths (which agree with each other to 0.029 h⁻¹Mpc median — the code-consensus scale), with field cross-correlation r = 0.999, 0.984, 0.937 at k = 0.35, 0.66, 1.26 h Mpc⁻¹ — near-perfect agreement over the full range of scales used in this work, degrading only at k ≳ 2 h Mpc⁻¹ (r = 0.837 at k = 2.40) where PM force softening is expected to bite.

### 2.2 The residual measurement (E4)

For each tracked particle we compute R = x_true(a=1) − x_ZA(a=1) and its velocity analogue Rv, where x_ZA is the particle's own Zel'dovich prediction from the shared initial conditions. Residual directions are projected onto the local tidal eigenframe (e₁, e₂, e₃ with λ₁ ≥ λ₂ ≥ λ₃; filament axis along e₃), and statistics are binned by distance to the filament spine network extracted from the final density field. The direction statistic ⟨(R̂·e₃)²⟩ has isotropic null 1/3; values above it mean the correction points along filaments, below it across them. Sample: 6 PM simulations, 50,000 tracked particles each; quoted uncertainties are across-seed standard deviations.

A precursor measurement (E2; 4 PM runs, 50,000 particles each, tracked over a ∈ [0.5, 1]) applied the same protocol to deviations of true trajectories from straight chords, independently of any model.

### 2.3 The model: ZA rays with transverse damping at first crossing

The frozen recipe (fixed by the declared optimisation campaign of E5c/E5d and used unchanged in every subsequent experiment):

- Evolve particles on straight ZA rays in growth-factor steps ΔD = 0.05 (≈18 steps; no Poisson solves beyond cheap density deposits).
- At each step, deposit the model's own particles to a density grid.
- The first time a particle's local density exceeds ρ_c = 5, remove **β = 60%** of its velocity components perpendicular to the local filament axis e₃ — the minor eigenvector of the tidal tensor of the model's own density, smoothed at 2 h⁻¹Mpc and refreshed every third step. The along-axis component is never touched.

The model has three fixed numbers (β, ρ_c, the smoothing scale). Two structural findings from the campaign: partial damping (β < 1) is required for self-estimated frames to pay — at β = 1 the model's own density feedback over-triggers crossings and cancels the frame gain — and pancake-ordered sequential damping (e₁ then e₂) underperforms simple both-perpendicular damping at this resolution (E5c).

### 2.4 Baselines and the oracle bound

Four baselines are run from identical initial conditions: plain ZA; an isotropic sticking model (the classical adhesion proxy: all velocity components damped at crossing); 2LPT; and MUSCLE (Neyrinck 2016). Additionally, an *oracle* variant of our model replaces the self-estimated tidal frames with frames from the true PM final field (E5b). The oracle is not a competitor but an information bound: it prices how much of the remaining error is frame estimation rather than physics.

### 2.5 Evaluation protocol

The primary score is the median per-particle distance between the model's a = 1 position and the PM-truth position, in voxels (= h⁻¹Mpc), overall and binned by distance to the web (spine network of the final field). Seed discipline: ρ_c was calibrated on seed 1 *by optimising the isotropic competitor* (a competitor-favouring choice); configuration selection used seeds {2, 3}; every reported validation number comes from held-out seeds ({4, 5, 6}, or the 5 held-out seeds of E5), with jackknife-over-seed errors. Field-level scores (Section 3.3) are the cross-correlation r(k) (phase fidelity) and transfer function T(k) (amplitude fidelity) against the truth density field.

This protocol is strict because an earlier phase of the programme demonstrated how a plausible protocol can manufacture a discovery. In a filament-finder benchmark (Section 5.1), skeleton length — the quantity that mechanically buys completeness — was matched on a proxy (hysteresis-mask volume) rather than on the realised skeleton; the resulting +0.07 completeness "win" carried p ≈ 10⁻¹⁴ and was entirely an artifact of a 19% length mismatch. Every comparison in this paper therefore matches, calibrates, or holds out on the score-determining quantity itself: identical initial conditions, identical truth, frozen knobs, held-out seeds, and a competitor-favouring calibration where a choice had to be made.

## 3. Results

### 3.1 The correction beyond ZA is transverse in the tidal frame (E4)

Table 1 gives the direction and amplitude of the residual R = x_true − x_ZA by distance to the web (6 simulations × 50,000 particles; mean ± across-seed sd; isotropic null 1/3).

**Table 1 — the measured adjustment term (E4).**

| d to spine (vox) | n/seed | ⟨(R̂·e₃)²⟩ | ⟨(R̂v·e₃)²⟩ | RMS R∥ (vox) | RMS R⊥ per axis (vox) | R∥/R⊥ |
|---|---|---|---|---|---|---|
| 0–2 | 20,658 | 0.298 ± 0.002 | 0.312 ± 0.003 | 4.36 | 4.92 | 0.89 |
| 2–4 | 7,269 | 0.297 ± 0.004 | 0.300 ± 0.004 | 3.77 | 4.19 | 0.90 |
| 4–8 | 6,632 | 0.264 ± 0.004 | 0.280 ± 0.003 | 2.40 | 3.07 | 0.78 |
| 8–16 | 10,320 | 0.218 ± 0.002 | 0.218 ± 0.003 | 1.86 | 2.91 | 0.64 |
| 16–64 | 5,120 | 0.208 ± 0.003 | 0.203 ± 0.003 | 1.77 | 2.83 | 0.63 |

Three facts. (i) The correction is large where structure forms: RMS ≈ 4.4 voxels within 2 voxels of spines. (ii) It is organised by the tidal eigenframe — the statistics deviate strongly from isotropy. (iii) Its direction is *perpendicular* to the filament axis at every distance: ⟨(R̂·e₃)²⟩ = 0.21–0.30 < 1/3 and R∥/R⊥ = 0.63–0.89 everywhere, approaching (but never reaching) isotropy inside the tubes. Physically: ballistic ZA transport overshoots through forming walls and filaments, and the correction real gravity applies is transverse arrest at the web — not enhanced transport along it.

The model-independent precursor (E2) agrees: deviations of true trajectories from straight chords are perpendicular to the filament axis in the bulk (⟨(d̂ev·e₃)²⟩ = 0.208–0.233 at 8–64 voxels, versus 1/3), turning weakly parallel (0.364 ± 0.010) only within ~4 voxels of spines, with velocity–axis alignment nearly flat (⟨|v̂·e₃|⟩ = 0.537–0.572, null 0.5; 4 simulations × 50,000 particles). Transverse pancake infall — the Zel'dovich collapse sequence — is what the instrument recovers, from scratch.

### 3.2 One ingredient suffices: the damping model reaches the frame bound and ties MUSCLE (E5–E5d, E9)

Table 2 tracks the model from first test to frozen recipe. All entries are median per-particle transport error in voxels against PM truth.

**Table 2 — the model ladder.**

| stage | configuration | held-out seeds | overall error | vs ZA |
|---|---|---|---|---|
| ZA baseline | — | 5 | 5.00 ± 0.22 | — |
| isotropic sticking (adhesion proxy) | full damping, all directions | 5 | 5.34 ± 0.15 | +7% |
| E5: first transverse model | β = 1, ZA-proxy frames | 5 | 4.91 ± 0.14 | −2% |
| E5c: refined | β = 0.75, self-density frames | 3 (seeds 4–6) | 4.64 ± 0.18 | −7% |
| E5d: **frozen recipe** | β = 0.6, 2 h⁻¹Mpc frames | 3 (seeds 4–6) | **4.52 ± 0.18** | **−9%** |
| E5b: oracle bound | true final-field frames | 5 | 4.47 ± 0.12 | −10% |

with the ZA reference at 4.98 ± 0.27 on seeds 4–6. The largest gains sit exactly where the correction was measured: at 0–2 voxels from spines the first model already beats ZA by 7% and isotropic sticking by 14% (6.46 ± 0.07 vs 6.95 ± 0.24 vs 7.50 ± 0.10); the oracle shows −20% available at the web (5.53 ± 0.08). The frozen recipe lands 0.05 voxels above the oracle bound — 89% of the recoverable gap closed — and the oracle experiment (E5b) shows the model beats ZA in *every* distance bin once frames are exact, so the small 2–4-voxel deficit of the practical model (+4% vs ZA in E5) is frame-estimation error, not wrong physics.

Table 3 places the frozen model against the literature baselines on identical initial conditions (E9; 3 seeds; jackknife errors).

**Table 3 — literature baselines, identical ICs (E9).**

| model | overall error (vox) | web (0–2 vox) error |
|---|---|---|
| ZA | 4.97 ± 0.27 | 6.92 ± 0.31 |
| 2LPT | 8.07 ± 0.39 | 8.21 ± 0.35 |
| MUSCLE | 4.49 ± 0.12 | 5.57 ± 0.07 |
| transverse damping (frozen) | 4.52 ± 0.18 | 5.77 ± 0.16 |

2LPT *degrades* transport at these nonlinear scales — the known shell-crossing overshoot. MUSCLE statistically ties the frozen model overall and is slightly ahead at the web; at the field level (Section 3.3) MUSCLE wins small-scale phases while the damping model wins mid-scale amplitudes. This is the mechanism result: a model containing *only* the measured ingredient — transverse arrest at first crossing, in self-estimated tidal frames — reproduces MUSCLE-class transport accuracy. We conclude that shell-crossing corrections of the MUSCLE class work *because* they implement transverse arrest; the multiscale spherical-collapse machinery is one implementation of a correction whose measured form is directional damping across the web.

### 3.3 Robustness: frozen knobs across clustering, resolution, cosmology; field-level fidelity (E6–E8, E10)

Table 4 collects the transfer tests. All use the frozen recipe with no re-calibration; errors in the resolution rows are in physical h⁻¹Mpc.

**Table 4 — transfer with frozen parameters.**

| condition | seeds | ZA overall | model overall | Δ overall | ZA web | model web | Δ web |
|---|---|---|---|---|---|---|---|
| base (EdS, σ₈ = 0.8, 1 h⁻¹Mpc vox) | 3 | 4.98 | 4.52 | −9% | 6.93 | 5.78 | −17% |
| coarse (2 h⁻¹Mpc voxels) | 3 | 2.09 | 2.04 | −2% | 3.37 | 3.08 | −9% |
| σ₈ = 0.6 | 3 | 2.98 | 2.89 | −3% | 4.73 | 4.26 | −10% |
| σ₈ = 1.0 | 3 | 7.20 | 6.23 | −13% | 9.36 | 7.33 | −22% |
| flat ΛCDM, Ωm = 0.31 | 3 | 4.93 | 4.45 | −10% | 6.90 | 5.73 | −17% |
| 0.5 h⁻¹Mpc voxels (EdS) | 1 (+2 in E7b) | 4.95 | 4.45 | −10% | 6.76 | 5.72 | −15% |

The advantage grows monotonically with clustering amplitude (−3% → −9% → −13% overall; −10% → −17% → −22% at the web over σ₈ = 0.6, 0.8, 1.0) — the behaviour expected of a physical shell-crossing correction, since higher σ₈ means more crossings, not of a tuned artifact. Under ΛCDM the numbers match EdS almost exactly, as expected for a growth-factor-parametrised geometric term. At 0.5 h⁻¹Mpc voxels the physical-unit errors are nearly identical to the 1 h⁻¹Mpc runs — the error scale is set by the physics, not the grid; the two additional seeds of E7b confirm the row at n = 3 (−12% and −9%).

Field-level fidelity (E8; 3 seeds, 1 h⁻¹Mpc voxels): the model beats ZA on both cross-correlation and transfer amplitude in the nonlinear regime — r(k = 0.53 h Mpc⁻¹) = 0.388 vs 0.288, T(k = 0.34) = 0.410 vs 0.229 — extending the usable k-range of a ZA-based mock, while the classical isotropic sticking model destroys phase fidelity at all k > 0.1 h Mpc⁻¹ (r = 0.089 at k = 0.53). Costs, quantified: a ~7% amplitude deficit in the largest-scale bin (T = 0.849 vs ZA's 0.920 at k = 0.06 h Mpc⁻¹), removable by the standard linear transfer rescaling, and a small phase cost at intermediate k (r = 0.962 vs 0.975 at k = 0.14). Against the baselines (E9): MUSCLE leads r(k) at small scales (0.527 vs 0.388 at k = 0.53) while the damping model leads T(k) at mid scales (0.739 vs 0.669 at k = 0.14) — complementary strengths that suggest a hybrid.

## 4. Theoretical interpretation: shocks of a flat optimal-transport map (T1)

The measured transverse correction has an exact home in the variational structure of the models it corrects. Two short steps (full derivation in the programme's theory note, T1):

**ZA is free motion in growth-factor time.** Writing the Zel'dovich map with the linear growth factor D as time, x(q, D) = q − D∇_q Φ₀(q), every trajectory is a straight line traversed at constant velocity: the potential exerts no force during the evolution — it is absorbed entirely into the initial velocities. The trajectories extremise the free action ∫|dx/dD|² dD, i.e. they are geodesics of the *flat* Euclidean metric. (This also refutes, constructively, any Jacobi-type "effective metric" picture in which paths are cheap along potential valleys: in the variables where the flow is simple there is no potential along the path left to conformalise.)

**Adhesion is Hopf–Lax, i.e. quadratic-cost optimal transport.** The adhesion model regularises multi-streaming with Burgers dynamics ∂_D v + (v·∇)v = ν∆v, ν → 0⁺, v = ∇ψ. The Hopf–Cole transformation solves it exactly, and the vanishing-viscosity limit is the Hopf–Lax formula ψ(x, D) = min_q [ψ₀(q) + |x − q|²/2D] — a minimisation over straight-line transport paths with quadratic cost: precisely the Monge–Kantorovich optimal-transport structure (Hopf 1950; Lax 1957; Brenier 1991), used cosmologically in the MAK reconstruction (Frisch et al. 2002; Brenier et al. 2003).

The geometry of cosmic-web transport is therefore flat metric, straight rays, plus a Legendre-type convexification of the initial potential. Filaments and nodes are the loci where the Hopf–Lax minimiser jumps between branches — the **shock set (caustics) of the transport map** — not geodesics of any curved or lifted metric. Structure lives in the singularities of the map, not in curved paths.

This derivation predicts the measurements of Section 3.1 before they are made: matter arrives at a filament along straight inertial rays that terminate *on* the shock set — generically transverse to it (E2/E4: direction statistics below 1/3 everywhere) — and after absorption the surviving degree of freedom is the tangential pre-shock velocity, giving weak along-filament streaming inside the tube (E2: 0.364 ± 0.010 within ~4 voxels). The correction beyond ZA is, exactly, the shock-formation term: what happens to the transverse momentum at first crossing. Our model implements this term directly (β = 0.6 rather than the adhesion model's implicit full absorption), and Section 3.2 shows the single term carries the entire measurable correction budget at these scales.

## 5. Secondary results

### 5.1 The evaluation-methodology lesson: proxy matching and reference circularity

The programme began as a filament-finder comparison and produced its most instructive result there. Comparing skeletons requires matched total spine length, because length mechanically buys completeness. The first benchmark enforced the match on a proxy — hysteresis-mask volume — assuming realised skeleton lengths would follow. They did not: the orientation-lift method's skeletons came out ~19% longer at sparse sampling (1,468 vs 1,239 voxels), and the resulting "+0.07 completeness, 48/50 seeds, p ≈ 10⁻¹⁴" advantage was pure length. Under the corrected extractor (iterative correction until the realised skeleton hits the target length) the sign flips: the Hessian baseline wins completeness at every sampling level from 2,500 galaxies up (Δ = −0.045 to −0.066 across both curvature variants, the lift winning at most 3/50 seeds, p ≤ 8×10⁻¹⁰ everywhere and ≈ 10⁻¹⁵ at most levels), with a statistical tie only at 1,200 (Δ = +0.003/+0.004, p = 0.47/0.36) — and pushing sparser still (400–600 galaxies) the Hessian wins again (Δ = −0.017/−0.021, p ≈ 0.003, 30 seeds). The artifact was detected only because a later instrument change retroactively shifted archived scores; the archived length fields confirmed the mismatch. The lesson generalises: *a matched comparison must enforce the match on the quantity that determines the score, and statistical strength (p ≈ 10⁻¹⁴) does not certify that the comparison was constructed correctly.*

A second protocol failure was caught by design: scoring sparse-data skeletons against a clean-field *reference skeleton* is circular, because each method scores 0.07–0.19 higher against the reference extracted by its own family (E1, 2×2 reference matrix, 12 seeds; the two clean references agree only at completeness ≈ 0.60). The replacement criterion — mass coverage at matched length, which needs no reference — is what Sections 3 and 5.2 use. These two lessons motivated the strict protocol of Section 2.5.

### 5.2 The filament-finder comparison: single-scale Hessian ≥ SE(3) orientation lift; the anisotropy descriptor survives

Under honest matching, the simple single-scale Hessian ridge detector matches or beats the SE(3) orientation-lift detector essentially everywhere tested: exact-truth toys at every density (above), and gravity-shaped fields under the method-neutral mass criterion — on truncated-ZA boxes at all sampling levels (band coverage 0.2860 ± 0.0149 vs the lift's best 0.2691 ± 0.0139 at 5,000 galaxies, p ≈ 10⁻³, 12 seeds), on PM N-body fields (where the shortest-cigar lift closes to a statistical tie at sparse sampling: Δ = −0.0045, p = 0.55, 8 seeds), and at 256³ resolution (6 seeds). The lift's hypoelliptic-diffusion component is rejected outright: strong diffusion is harmful at every curvature and sparsity tested (−0.06 to −0.12, p ≈ 2×10⁻⁶), weak diffusion buys +0.01 (p = 0.03) only at ultra-sparse sampling, and an 8-step Trotter splitting at equal total diffusion reproduces the coarse result — the verdict is operator-level, not numerical (E0b, E0d). A hybrid summing the two percentile-normalised scores earns a niche: +0.05 purity and +0.040 junction F1 over the Hessian at 5,000 galaxies (p = 1.3×10⁻⁴, 20 seeds) at a −0.02 completeness cost (E0c).

What survives for the lifted geometry is a *descriptor* role, consistent with Section 4's reading (the orientation manifold describes the shock set, not the transport): unweighted lift spines align with the clean-field tidal eigenvector e₃ at 0.734–0.759 versus the Hessian's 0.665–0.674 (isotropic null 0.5; E1, 12 seeds), and this replicates on the real Universe — 0.677 ± 0.016 vs 0.617 ± 0.016 across 18 independent BOSS CMASS tiles (E3). The lifted skeleton reads the anisotropy of the web better even where it loses on mass.

### 5.3 Observational validation: the extracted web sits on real gas

The web that the pipeline extracts from data is physically real. Stacking spine networks from 274,075 BOSS CMASS-North galaxies (z = 0.45–0.55, 18 tiles of 512 h⁻¹Mpc at 4 h⁻¹Mpc voxels) on the Planck Compton-y map yields an excess of 8.99σ (Hessian spines; 6.86σ lift) against 200 null sets matched to the spine points' galactic-latitude histogram — stricter controls *strengthened* the first-pass 4.8σ/4.1σ detection (E3, E3b; 41,535/40,426 spine points). Masking the tracer halos (7′) leaves 1.95σ/0.07σ: the spine-stack signal is dominantly the tracers' own halo gas, and an ACT DR6 test of the masked residual at arcminute resolution stayed below the pre-registered 3σ gate (1.77σ at 3′, 1.11σ at 7′; E3c).

The between-halo component was instead measured with a pair-bridge estimator: y at the midpoint of close CMASS pairs (876,639 pairs, transverse separation 6–14 h⁻¹Mpc, line-of-sight < 6 h⁻¹Mpc) minus ring controls at ±60/±90/±120°, which cancels any circularly symmetric halo by construction (E3d-v2). Under the full validity battery (E3e) — jackknife errors over 50 RA patches (pair bootstrap is optimistic by 1.6–2.4×) and physically unconnected null pairs (same transverse window, line-of-sight 25–40 h⁻¹Mpc) — the on-axis excess is 3.30σ on ACT and 7.99σ on Planck, the null pairs expose a 4.7σ beam-leakage term on Planck (1.80×10⁻⁸) and none on ACT (1.65σ), and the null-subtracted bridge amplitude is 1.4×10⁻⁸ ± 0.9 (≈1.6σ, ACT) and 1.2×10⁻⁸ ± 0.5 (≈2.2σ, Planck) — mutually consistent and matching published LRG-pair bridge amplitudes (~1–2×10⁻⁸; de Graaff et al. 2019; Tanimura et al. 2019). We report this as a reproduction of the literature amplitude with honest errors and physical nulls at ~2σ per instrument, not as an independent detection.

## 6. Limitations

- **PM-only truth, externally checked at one configuration.** All transport truths come from our own particle-mesh integrator: time-converged (0.008-voxel shift under step doubling, E10), grid-checked at 256³, and validated against Arepo on the CAMELS CV_0 box (median matched-ID offset 0.41 h⁻¹Mpc; r ≥ 0.93 for k ≤ 1.3 h Mpc⁻¹, E12). Residual caveat: the external check covers one box size and cosmology; PM force softening still suppresses small-scale amplitudes (T ≈ 0.86–0.92 at the checked scales), a bias partially shared between truth and models.
- **EdS-primary.** The primary calibration and most experiments use Einstein–de Sitter expansion; ΛCDM is verified at one configuration (Ωm = 0.31, 3 seeds) with matching numbers, consistent with a growth-factor-parametrised term, but no broader cosmology scan was run.
- **One-shot damping.** The model damps at *first* shell-crossing only; multi-stream interiors are out of scope by design. The residual error at the web (5.5–6 voxels even at the oracle bound) is post-crossing physics that no first-crossing rule can represent; do not interpret model positions within ~2 voxels of density peaks as resolved halo structure.
- **BBKS spectrum.** Initial conditions use the BBKS transfer function rather than a Boltzmann-code spectrum; the mechanism measurement should be insensitive to this, but absolute numbers may shift.
- **Seed counts.** Held-out validation uses 3–5 seeds per condition (single seed for the first 0.5 h⁻¹Mpc row, extended to 3); errors are jackknife-over-seed. The consistency of the advantage across every condition mitigates, but does not replace, larger ensembles.
- **Calibration locality.** β and ρ_c were calibrated at this box size and tracer density; the transfer tests hold them frozen successfully across the scoped ranges (σ₈ 0.6–1.0, voxels 0.5–2 h⁻¹Mpc, EdS/ΛCDM), but new regimes warrant re-calibration against a small PM truth, optimising the competitor first.
- **Large-scale amplitude.** The field-level deficit at the largest scales (~7% in T(k) at k = 0.06 h Mpc⁻¹) requires the standard linear rescaling before use in mocks.

## 7. Conclusions

We measured the correction that ballistic (Zel'dovich) transport needs in order to match N-body gravity, resolved in the frame that organises gravitational collapse. The measurement is unambiguous: the correction is large near the web and points across the filament axis at every distance — transverse arrest, not enhanced along-filament transport. A model containing only that ingredient — straight ZA rays plus 60% transverse momentum damping at first shell-crossing in self-estimated tidal frames — closes 89% of the gap to its own frame-information bound, ties the best shell-crossing prescription in the literature (MUSCLE) on transport, beats the classical isotropic adhesion proxy everywhere, and transfers with frozen parameters across clustering amplitude, resolution, and cosmology, with the advantage growing where crossings multiply. The theory closes the loop: the exact variational structure of ZA/adhesion is flat quadratic-cost optimal transport, filaments are the shocks of that map, and the measured term is the shock-formation correction.

The practical conclusion for the fast-mock literature is a mechanism, not an engine: MUSCLE-class shell-crossing corrections work because they implement transverse arrest. The two model families' complementary field-level strengths — MUSCLE's small-scale phases, transverse damping's mid-scale amplitudes — suggest a hybrid as the natural next engine, but not a naive one: triggering the directional damping on MUSCLE's precomputed Lagrangian collapse times underperforms both parents (4.67 ± 0.18 vs 4.49/4.52, weakest at the web; E11), so the evolving Eulerian density carries trigger information the Lagrangian collapse time lacks, and MUSCLE's own advantage must live in its displacement-divergence construction rather than its trigger. Hybridisation therefore has to happen at the displacement/field level; the natural next measurement is the second-crossing term that both model families currently omit.

## Data availability

All code, per-experiment reports with full tables and p-values, per-seed result files, and one-command reproduction scripts are in the repository under `research/cosmic-web/` (experiments E0–E12 and T1: `docs/`; runners: `scripts/`; per-seed numbers: `artifacts/`), including the model card with the frozen recipe and integration guide (`docs/MODEL-CARD.md`): https://github.com/moiseevigor/moiseevigor.github.io/tree/research/geometry-of-cosmic-web/research/cosmic-web

## References

- Aragón-Calvo, M. A., et al. (2007). "The multiscale morphology filter: identifying and extracting spatial patterns in the galaxy distribution." *A&A* 474, 315–338.
- Bond, J. R., Kofman, L., & Pogosyan, D. (1996). "How filaments of galaxies are woven into the cosmic web." *Nature* 380, 603–606.
- Bouchet, F. R., Colombi, S., Hivon, E., & Juszkiewicz, R. (1995). "Perturbative Lagrangian approach to gravitational instability." *A&A* 296, 575.
- Brenier, Y. (1991). "Polar factorization and monotone rearrangement of vector-valued functions." *Comm. Pure Appl. Math.* 44, 375–417.
- Brenier, Y., Frisch, U., et al. (2003). "Reconstruction of the early Universe as a convex optimization problem." *MNRAS* 346, 501–524.
- Cautun, M., van de Weygaert, R., & Jones, B. J. T. (2013). "NEXUS: tracing the cosmic web connection." *MNRAS* 429, 1286–1308.
- Codis, S., et al. (2012). "Connecting the cosmic web to the spin of dark haloes." *MNRAS* 427, 3320–3336.
- de Graaff, A., et al. (2019). "Probing the missing baryons with the Sunyaev–Zel'dovich effect from filaments." *A&A* 624, A48.
- Duits, R., & Franken, E. (2011). "Left-invariant diffusions on the space of positions and orientations and their application to crossing-preserving smoothing of HARDI images." *Int. J. Comput. Vis.* 92, 231–264.
- Duits, R., Boscain, U., Rossi, F., & Sachkov, Yu. (2014). "Association fields via cuspless sub-Riemannian geodesics in SE(2)." *J. Math. Imaging Vis.* 49, 384–417.
- Epps, S. D., & Hudson, M. J. (2017). "The weak-lensing masses of filaments between luminous red galaxies." *MNRAS* 468, 2605–2613.
- Frisch, U., Matarrese, S., Mohayaee, R., & Sobolevski, A. (2002). "A reconstruction of the initial conditions of the Universe by optimal mass transportation." *Nature* 417, 260–262.
- Gurbatov, S. N., Saichev, A. I., & Shandarin, S. F. (1989). "The large-scale structure of the universe in the frame of the model equation of non-linear diffusion." *MNRAS* 236, 385–402.
- Hahn, O., Porciani, C., Carollo, C. M., & Dekel, A. (2007). "Properties of dark matter haloes in clusters, filaments, sheets and voids." *MNRAS* 375, 489–499.
- Hopf, E. (1950). "The partial differential equation u_t + u u_x = μ u_xx." *Comm. Pure Appl. Math.* 3, 201–230.
- Kitaura, F.-S., & Heß, S. (2013). "Cosmological structure formation with augmented Lagrangian perturbation theory." *MNRAS* (Letters).
- Lax, P. D. (1957). "Hyperbolic systems of conservation laws II." *Comm. Pure Appl. Math.* 10, 537–566.
- Libeskind, N. I., et al. (2018). "Tracing the cosmic web." *MNRAS* 473, 1195–1217.
- Neyrinck, M. C. (2013). "Quantifying distortions of the Lagrangian dark-matter mesh in cosmology." *MNRAS*.
- Neyrinck, M. C. (2016). "Truthing the stretch: non-perturbative cosmological realizations with multiscale spherical collapse (MUSCLE)." *MNRAS*.
- Portegies, J., Sanguinetti, G., Meesters, S., & Duits, R. (2015). "New approximation of a scale space kernel on SE(3) and applications in neuroimaging." *SSVM 2015*, LNCS 9087.
- Scoccimarro, R. (1998). "Transients from initial conditions: a perturbative analysis." *MNRAS* 299, 1097–1118.
- Sousbie, T. (2011). "The persistent structure of the Universe — I. Theory and implementation." *MNRAS* 414, 350–383.
- Tanimura, H., et al. (2019). "A search for warm/hot gas filaments between pairs of SDSS luminous red galaxies." *MNRAS* 483, 223–234.
- Tassev, S., Zaldarriaga, M., & Eisenstein, D. J. (2013). "Solving large scale structure in ten easy steps with COLA." *JCAP*.
- Villaescusa-Navarro, F., et al. (2021). "The CAMELS project." *ApJ* 915, 71.
- Villaescusa-Navarro, F., et al. (2020). "The Quijote simulations." *ApJS* 250, 2.
- Zel'dovich, Ya. B. (1970). "Gravitational instability: an approximate theory for large density perturbations." *A&A* 5, 84–89.
