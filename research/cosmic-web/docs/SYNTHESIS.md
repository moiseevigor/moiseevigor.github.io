# Program synthesis — geometry of the cosmic web (E0–E2)

One-line summary: **under correctly length-matched evaluation the simple
Hessian baseline matches or beats the orientation lift essentially
everywhere as a filament finder; the lift survives as an anisotropy
descriptor, a hybrid ingredient, and the program's physics probes produced
clean refutations of the geometric transport thesis.**

> **Correction (2026-07-04).** The first E0 verdict ("lift wins sparse-regime
> completeness +0.07, p≈10⁻¹⁴") was an evaluation artifact. Length matching
> was enforced on a proxy (hysteresis-mask volume); realized skeleton lengths
> differed systematically (lift ~19% longer at sparse levels), and length
> buys completeness. The corrected extractor (iterative correction until the
> skeleton itself hits the target) flips the sign. Detected when an
> instrument change made for E1 retroactively shifted E0 parent scores; the
> archived n_est fields confirmed the mismatch. All numbers below are from
> the corrected reruns.

All experiments: 128³ boxes (256³ resolution check), matched spine length,
calibrate/held-out discipline, paired Wilcoxon statistics. Chain of
hypotheses, in the order they were tested and what each result forced next:

## H1 — the lift is a better filament finder

- **Exact-truth toys (E0 corrected, 50 seeds × 2 curvature variants):
  refuted.** The Hessian wins completeness at every level from n_gal=2500 up
  (−0.045 to −0.066, 50/50 seeds, p ≈ 10⁻¹⁵) and junction F1 with it; at
  ultra-sparse n_gal=1200 the methods are statistically tied (Δ ≈ +0.004,
  p ≈ 0.4). The pre-correction "sparse-regime crossover" does not survive
  honest length matching.
- **Gravity-shaped webs (E1, E1b): consistent with the corrected toys.**
  Skeleton-vs-skeleton scoring first collapsed to reference circularity
  (each method wins against its own clean reference — E1's 2×2 design
  caught this). The method-neutral criterion (mass coverage at matched
  length, E1b) gave the Hessian a significant win at *all* sampling
  levels, in total mass AND in filament-band mass (2<ρ<20), on truncated-ZA
  and PM N-body fields and at 256³ resolution; the short-cigar lift's best
  case is a statistical tie at sparse sampling on N-body fields (p = 0.55).
- **Hybrid (E0c):** summing the two percentile-normalised scores ties the
  Hessian's completeness at 2500 and beats it on purity (+0.05) and
  junction F1 (+0.040, p = 1.3×10⁻⁴) at 5000, at a −0.02 completeness cost
  — the two responses carry complementary information.

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
2. **E0b (corrected rerun):** strong hypoelliptic diffusion (splitting
   scheme) is harmful at every curvature × sparsity tested including the
   most-curved tercile; weak diffusion is neutral-to-harmful except a small
   positive (+0.01, p=0.03) at the ultra-sparse level. (Caveat: crude
   numerical scheme, not the exact SE(3) kernel.)
3. **E0c hybrid:** the sum of normalised scores improves purity and
   junction F1 over the Hessian at moderate sparsity — a practical recipe.
4. **E2's instrument recovered known Zel'dovich pancake physics** from
   scratch — the perpendicular-infall signature — which validates the PM +
   tracking pipeline.
5. **The length-matching lesson:** matched comparisons must enforce the
   match on the score-buying quantity itself (realized skeleton length),
   not a proxy (mask volume). The proxy manufactured a p≈10⁻¹⁴ phantom win.

## Status of the program's claims

- **C1 (methodological)** is refuted as a general claim: at honest matched
  length the Hessian is at least as good everywhere tested, with the lift
  tying only at ultra-sparse sampling. What survives of C1: the anisotropy
  description (M3) and the hybrid's purity/junction gains.
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

## E0d addendum (post-correction follow-ups, 2026-07-04)

1. **Splitting convergence:** 8-step Trotter splitting at equal total
   diffusion reproduces the coarse-splitting result at both sparsity levels
   (fine −0.017 vs coarse −0.020 at n_gal=2500; both ≈ +0.01 at 1200). The
   diffusion verdict is operator-level, not numerical. Caveat closed.
2. **Sparsity limit:** no honest lift-win regime exists anywhere: at
   n_gal=400–600 the Hessian wins again (−0.017/−0.021, p ≈ 0.003); the
   800–1200 tie is a narrow band, not a trend. The pooling advantage never
   exceeds the positional-accuracy cost at any tested density.
3. **Hybrid on gravity:** hyb_sum halves the lift's band-coverage deficit
   but still trails the Hessian (−0.009, p = 0.04 at 5k; −0.016 at 20k).
   The hybrid's niche remains toy purity/junctions.

With these, every locally executable hypothesis and caveat of the program
has a replicated verdict. Remaining: E3/H3 on real survey data (blocked on
data download approval).
