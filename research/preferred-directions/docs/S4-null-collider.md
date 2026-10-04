# S4 — The null collider, Earth arm: an audit, a cascade, and where folds live

**Question.** Can we catch two magnetic nulls annihilating at Earth — drive a
model-magnetosphere pair through its fold with a physical dial and verify
every signature the fold normal form predicts?

**Answer (short).** No — and the two reasons are findings. (1) The T96
empirical magnetosphere is **null-free inside its own magnetopause**; its
advertised null population is a boundary-shell artifact. (2) The classical
Dungey (IGRF + uniform IMF) field owns real nulls, but its topology change
is a broken *ring* degeneracy, not clean isolated folds. The certified fold
of the program lives on the Sun (see `S5-solar-fold-hunt.md`); Earth's arm
contributes the stability phase portrait and the walls.

## Pre-registered hypotheses (as run, three designs)

- **H-S4a (existence).** A 1-parameter storm path of IGRF+T96 exhibits at
  least one interior pair creation/annihilation.
- **H-S4b (fold signature).** Opposite degrees; separation
  $C\sqrt{|\lambda-\lambda_c|}$; $\det\nabla B \to 0$.
- **H-S4c (SR read).** The measured 2-jet at the collision carries the S1
  crossover structure (pre-registered as plateau-4/$Q=7$; refined by the
  solar catch — see S5c).

## What actually happened (chronology kept, per program rules)

1. **v1/v2 (Dst sweep, −5 → −150 nT and validity-capped −5 → −100 nT).**
   The census EXPLODES with storm depth (143 → 1830 nulls over the full
   path; artifacts/s4_sweep_extended.json). All 47 tracked "creations"
   failed certification identically: separation ladders CONSTANT in Dst
   (slope ≈ 0.000 vs the fold's 0.5) — they were finder-discovery
   artifacts, coexisting neighbours found late by the seed battery. The
   certificate did its job on its own pipeline.
2. **Boundary audit (run_s4b_drive.py).** Probing why driven pairs were
   rigid: B at the null positions is IDENTICAL for Dst −5/−50/−100 —
   the nulls do not feel the ring current. Testing every interior null
   against T96's own magnetopause (`geopack.t96_mgnp`): **all 70 interior
   census nulls sit < 1 R_E OUTSIDE the model boundary** (dist 0.7–0.8,
   id = −1), and inside the valid domain the hunt finds **zero nulls at
   every IMF Bz in [−9, +3] nT**. The smooth average magnetosphere is
   null-free; the "149 nulls, 79 spiral" census of P4-S3 is structure of
   the model's continuation past its own edge. (P4-S3's blog section now
   carries this correction; the spiral/radial anatomy remains valid as
   anatomy of a realistically shaped non-force-free field.)
3. **Dungey collider (run_s4c_dungey.py).** IGRF(2012-03-07) + 5 nT
   uniform IMF, dial = IMF angle θ from northward. Census: the classical
   cusp-pair topology (2 nulls, degree sum 0, r ≈ 18–23 R_E) is
   **structurally stable over 125° of IMF rotation**, then cascades
   2 → 3 → 4 → 6 → 8 → 12 → 17 approaching anti-parallel: the pure-dipole
   null RING (the μ<0 face of the S1 fold family) broken up by the real
   multipoles. Up close the cascade nulls live in a 0.02-nT-flat azimuthal
   valley (Jacobian eigenvalues ~ (0.83, −0.82, −0.009), condition ~ 10²):
   null identity dissolves; walked "deaths" are continuation-conditioning
   events, not certifiable isolated folds. Several backward-walked
   newborns died with det̂ → 0.01 (genuinely approaching degeneracy), but
   no partner could be resolved against the valley conditioning; the
   pre-registered certificate was therefore NOT issued at Earth.

## Verdicts

- H-S4a: **REFUTED as posed for T96** (no interior nulls to collide inside
  validity); for the Dungey family the count changes but through
  ring-cascade degeneracy, not certifiable isolated folds.
- H-S4b/c: **not issued at Earth**; issued on the Sun (S5c) where the
  four-signature certificate passed at machine precision.
- Byproducts kept: the stability phase portrait (det̂ vs disĉ; 135 Dungey
  states + the solar pair's dive into the fold wall) and the cascade census
  — figure `forbidden-directions-stability-walls.png`.

## Honesty box

The Dungey field is the classical vacuum superposition (no magnetopause
currents); its neutral points at 5 nT sit at r ≈ 18–23 R_E, beyond the real
magnetopause — it is the textbook outer-field model, not a calibrated
magnetosphere. The T96 audit statement is about the model's own boundary
function; real magnetospheric nulls are dynamical current-sheet structures
(Cluster/MMS territory), absent from smooth empirical averages by
construction.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_s4_collider.py   # Dst sweep (context)
../cosmic-web/.venv/bin/python scripts/run_s4b_drive.py     # boundary audit
../cosmic-web/.venv/bin/python scripts/run_s4c_dungey.py    # Dungey cascade
../cosmic-web/.venv/bin/python scripts/render_s45_figures.py
```

Artifacts: `s4_collider.json` (Dungey census + portraits + T96 audit),
`s4_sweep_extended.json` (full Dst-path census, exploratory beyond −100 nT).
