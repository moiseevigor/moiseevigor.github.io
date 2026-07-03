# Program synthesis — geometry of the cosmic web (E0–E2)

One-line summary: **the orientation lift is a real instrument win on sparse
tubular networks with exact ground truth, but on gravity-shaped webs every
strong form of the geometric thesis tested so far fails — and the failures
are informative.**

All experiments: 128³ boxes, matched spine length, calibrate/held-out
discipline, paired Wilcoxon statistics. Chain of hypotheses, in the order
they were tested and what each result forced next:

## H1 — the lift is a better filament finder

- **Exact-truth toys (E0, 50 seeds × 2 curvature variants): crossover,
  strongly significant.** At sparse sampling the lift wins spine
  completeness (+0.070, 48–49/50 seeds, p ≈ 10⁻¹⁴) and junction F1
  (+0.03–0.04); at dense sampling the Hessian wins both by ~0.02–0.05.
  The lift is specifically a *sparse-data* instrument.
- **Gravity-shaped webs (E1, E1b): the toy advantage does not transfer.**
  Skeleton-vs-skeleton scoring first collapsed to reference circularity
  (each method wins against its own clean reference — E1's 2×2 design
  caught this). The method-neutral criterion (mass coverage at matched
  length, E1b) then gave the Hessian a significant win at *all* sampling
  levels, in total mass AND in filament-band mass (2<ρ<20), at *all*
  filter scales σ∥ ∈ {3, 4.5, 6} (p ≤ 0.001). ZA filaments are winding,
  anisotropic ribbons, not straight Gaussian tubes; pointwise curvature
  tracks their crests better than any elongated window tried.

## H2 — physics-informed (tidal) coefficients help

**Dead.** Multiplicative tidal-alignment weighting hurts mass coverage even
with the *clean-field* tidal frame (E1b: b1_clean < b0), so this is not a
noise-in-the-estimate problem — the weighting itself is wrong. (E1's
sparse-frame version was already null-to-negative.)

## H4 — transport follows sub-Riemannian geodesics of the lifted metric

**Refuted in the bulk; a weak, sign-correct residual survives inside
filaments (E2, 4 PM N-body runs, 200k tracked particles).** Deviations of
true trajectories from ballistic chords are *perpendicular* to the filament
axis in the bulk (⟨(d̂ev·e3)²⟩ = 0.21–0.23 vs isotropic 1/3): transverse
pancake infall is what builds filaments, the opposite of "cheap along the
axis". Only within ~4 vox of spines does the deviation turn weakly parallel
(0.364 ± 0.010). Velocity–axis alignment is a flat ~0.56 (null 0.5).
Geodesic-shooting machinery (Tier B) is therefore unmotivated as a
*formation* model; at best it describes streaming *within* formed
filaments.

## Sub-findings that survive

1. **E1-M3:** unweighted lift spines align with the tidal eigenframe at
   0.73–0.76 vs Hessian 0.67 (null 0.5) — the lifted geometry is a better
   *static descriptor* of web anisotropy even where it loses on mass.
2. **E0b:** hypoelliptic diffusion (splitting scheme) is strictly harmful
   at every curvature × sparsity tested — all of the lift's toy gains come
   from the angularly-sharp elongated filters, none from evidence
   propagation. (Caveat: crude numerical scheme, not the exact SE(3)
   kernel.)
3. **E2's instrument recovered known Zel'dovich pancake physics** from
   scratch — the perpendicular-infall signature — which validates the PM +
   tracking pipeline.

## Status of the program's claims

- **C1 (methodological)** survives only in restricted form: orientation
  lifting is the better spine-geometry estimator for *sparse samples of
  thin, tube-like networks* (the CLAMATO-like regime), not a general
  cosmic-web improvement.
- **C2 (physical)** is refuted as stated: the intrinsic-manifold geodesics
  do not drive filament assembly; assembly is transverse collapse in the
  tidal eigenframe, with the lifted geometry emerging as a *description* of
  the end state (M3), not the mechanism.

## What would continue the program (not executable locally)

- **H3 / E3**: stacking real lensing/tSZ maps along spines from real survey
  catalogues — requires downloading public datasets (SDSS catalogue,
  Planck maps; several GB). Blocked on data access, not on method.
- Repeat E1b on full N-body (PM) fields instead of truncated ZA, and at
  256³ resolution where filament cross-sections are resolved.
- A proper SE(3) kernel (Portegies et al.) instead of the splitting scheme,
  to close the E0b caveat.
- Junction-specialised hybrid (Hessian near direction-degenerate points,
  lift along spines) — motivated by the consistent junction/spine split in
  E0/E0b.
