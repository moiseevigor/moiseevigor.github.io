# From Caustics to Groups — experiments

Code for the research program scoped in the blog post
[`_posts/2026-07-15-caustics-to-groups-research-program.md`](../../_posts/2026-07-15-caustics-to-groups-research-program.md):
given an observed field of caustics (the singular set of a sub-Riemannian
exponential map), infer the underlying Lie-group structure — the *reverse* map.
Built around the ADE group-blindness obstruction and the three structure-specific
observables that escape it (tangent-cone growth vector; conjugate-locus symmetry
and moduli at the pole; abnormal-geodesic stratum), matched by the
nilpotent-deviation statistic. Full derivation in [`docs/METHODS.md`](docs/METHODS.md).

## Layout

- `src/` — dependency-light math core (numpy only), one module per group / concern:
  - `heisenberg.py` — Heisenberg `H³` forward model: closed-form geodesics,
    exponential map, and the known conjugate locus (`t_c = 2π/|w|`, z-axis). The
    leakage-free Phase 0 ground truth.
  - `caustics.py` — generic first-conjugate-time / caustic detection for any
    geodesic map, via the zero of the exponential map's Jacobian determinant.
    Validated against the Heisenberg closed form; reused for later groups.
  - `liegroup.py` — generic vectorized Lie–Poisson normal-geodesic engine;
    candidate-group specs (Heisenberg, SE(2), Engel, Cartan; SE(3) upcoming) as
    frame + structure constants + horizontal set.
  - `growth.py` — tangent-cone growth-vector estimator (metric M1) via geodesic
    reach scaling with a noise-floor-aware weight fit.
  - `caustics.py` — first-conjugate-time detection: a generic finite-difference
    routine and a fast batched one for 3D contact groups.
  - `fingerprint.py` — the three-component fingerprint and the group classifier
    (M1 growth vector + M2 nilpotent-deviation δ that splits the (2,3) alias).
  - *(upcoming)* a data-driven abnormal-stratum test (M4); SE(3) forward model.
- `scripts/run_e0.py` — E0 growth-vector recovery sweeps (noise, sample size).
- `scripts/run_e1.py` — E1 fingerprint classifier + confusion matrix.
- `scripts/smoke_test.py` — assert-based self-checks + golden-file regression.
- `tests/golden/` — committed reference outputs (e.g. the Heisenberg conjugate
  locus); regenerate with `smoke_test.py --update-golden`.
- `docs/METHODS.md` — living derivation of the fingerprint + deviation statistic.
- `docs/adr/` — architecture/method decision records (ADR-0001: candidate list
  and identifiability target).
- `artifacts/` — result JSONs (gitignored, regenerable).

## Status

- **Phase 0** (scaffold + ground truth): done — Heisenberg model, generic engine,
  golden test green.
- **E0** (growth-vector recovery, tests H1): done — **H1 confirmed.** All three
  vectors recovered exactly on clean data; graceful noise degradation; Engel
  (step 3) is the hardest (needs more samples, tolerates less noise); Heisenberg
  and SE(2) alias at (2,3) as pre-registered. See [`docs/E0-growth-vector.md`](docs/E0-growth-vector.md).
- **E1** (fingerprint + confusion matrix, tests H2): done — **H2 confirmed.**
  Perfect 4-way separation on clean data (1.00 vs 0.25 chance); δ breaks the
  Heisenberg/SE(2) alias (δ ≈ 0.002 vs 0.140); noise degrades step-3 groups first
  and into "unknown" (abstention), never wrong-group confusion. See
  [`docs/E1-confusion.md`](docs/E1-confusion.md).
- **E2** (aliasing map + abnormal leg, tests H3): done — **H3 confirmed.** Honest
  aliasing map with two rigidity points (Heisenberg/SE(2) rides on δ alone;
  Engel/Cartan on the growth vector alone). Standout finding: the coarse abnormal
  bit (M4) is far more noise-robust than the full growth vector — perfect for
  Cartan at σ=3e-2 where M1 recovery is 0.00. See [`docs/E2-aliasing.md`](docs/E2-aliasing.md).
- **Classifier upgrade** (M4 fallback): done — tagging the coarse class from the
  abnormal bit when the growth vector is unresolved lifts class accuracy to 1.00 at
  σ=1e-2 and 0.96 at σ=3e-2 (from 0.91 / 0.57 strict), with no new wrong-group
  errors. Degradation is now graceful (falls to correct coarse class, not "unknown").
- **Blog Parts 2 & 3** drafted from these results:
  [Part 2 "The Forward Map"](../../_posts/2026-07-18-caustics-to-groups-forward-map.md)
  and [Part 3 "The Inverse Map"](../../_posts/2026-07-22-caustics-to-groups-inverse-map.md)
  (confusion matrix, aliasing map, calibrated silence).
- **E4 + SE(3)** (calibrated silence + H4 both halves): done — **confirmed.**
  Added the SE(3) fibre-tracking tangent cone (growth vector (3,6), M1-verified with
  the frame↔C guard). Confident on genuine homogeneous groups *including SE(3)* (the
  H4 yes-half mechanism, 97%); correctly **abstains** on an effective flow (growth
  vector varies across base points → "field of varying tangent cones").
  See [`docs/E4-calibrated-silence.md`](docs/E4-calibrated-silence.md).
- **Blog Part 4** ("In the Wild"): the four-part series is complete —
  [Part 4](../../_posts/2026-07-26-caustics-to-groups-in-the-wild.md).
- **Remaining (future):** inference on a real (credential-gated) DW-MRI acquisition;
  optional theory appendices C1–C5; the curved SE(3) exact geodesics (Euler-angle
  frame) for a full conjugate-locus deviation on SE(3).

## Results at a glance

| Experiment | Hypothesis | Verdict |
|---|---|---|
| E0 growth-vector recovery | H1 identifiability | confirmed |
| E1 fingerprint + confusion matrix | H2 discrimination | confirmed |
| E2 aliasing map + abnormal leg | H3 rigidity | confirmed |
| E4 calibrated silence | H4 (no half) | confirmed (right verdict, wrong reason — see E5) |
| SE(3) synthetic field | H4 (yes half, mechanism) | confirmed |
| real DW-MRI acquisition | H4 (yes half, real data) | pending credentialed data |
| E5 gravity has no SR structure | H-A (astrophysics Phase A) | confirmed; refuted our own `Q>n` criterion |

## Astrophysics phase

Plan: [`docs/PLAN-astrophysics-local-groups.md`](docs/PLAN-astrophysics-local-groups.md).
**E5 done** ([`docs/E5-no-sr-structure-in-gravity.md`](docs/E5-no-sr-structure-in-gravity.md)):
gravity is a deterministic *flow*, not a control system — no distribution, no growth
vector. The R³×S² lift's constraint is a tautology (residual 5e-16 for any smooth flow),
so the growth vector measures the instrument. And a Zel'dovich **fold** fakes Heisenberg's
`Q=4` exactly, so `Q>n` pointwise is not sufficient; the correct criterion is `Q>n` on a
set of **full measure** (Zel'dovich 0%, Heisenberg 100%). Next: Phase B — the
deformation-tensor isotropy stratification, validated against the published D₄-umbilic
criterion (first external validation in this repo).

**E6 done** ([`docs/E6-local-symmetry-doroshkevich.md`](docs/E6-local-symmetry-doroshkevich.md)) —
**the programme's first external validation.** The local group of the cosmic web is the
isotropy group of the deformation tensor, stratified by eigenvalue degeneracy. Measured
against Doroshkevich (1970): the Hessian covariance matches theory (0.2025 vs 1/5; 0.0664
vs 1/15), the eigenvalue law matches to ~0.1% (KS D ≈ 0.002), and the Vandermonde-induced
**eigenvalue repulsion** is confirmed (α = 0.973 vs 1.0). Hence the SO(2)-symmetry stratum
has codimension 2 (curves, β = 1.944 vs 2.0), and D₄ umbilics — degeneracy ∩ fold, corank 2
— are isolated points. Local groups are detectable; they are found with the deformation
tensor, never a growth vector.

**E8 done** ([`docs/E8-magnetized-plasma.md`](docs/E8-magnetized-plasma.md)) — the technique's
astrophysical **home**. Suppressed cross-field transport is *anisotropic Riemannian* (Q=n even
at D⊥/D∥ = 1e-6), and D⊥→0 gives an integrable rank-1 foliation. But on the extended
**(position, flux)** space, [X₁,X₂] = B ∂_z, so the structure is contact wherever B≠0:
Q=4>n=3 on **full measure** (30/30 base points), and for uniform B the frame is *literally*
Heisenberg. At a magnetic **null** the weight jumps 2→3 (Martinet), Q: 4→5 — so the growth
vector is a **magnetic-null / reconnection-site detector**.

**The astrophysics phase is complete.** Gravity: no SR structure (E5). Cosmic-web local
groups: isotropy groups of the deformation tensor, externally validated (E6). SR technique's
home: magnetized flux geometry (E8).

## Reproduce

```bash
cd research/caustics-to-groups
python3.13 -m venv .venv && .venv/bin/pip install numpy scipy
.venv/bin/python scripts/smoke_test.py     # model + detector + M1 + classifier + golden
.venv/bin/python scripts/run_e0.py         # E0 growth-vector recovery sweeps (~30s)
.venv/bin/python scripts/run_e1.py         # E1 fingerprint + confusion matrix (~20s)
```
