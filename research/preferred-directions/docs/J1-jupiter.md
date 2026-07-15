# J1 — Jupiter: the polar patch as a combination of separatrices

**Question (user-posed).** Jupiter's Juno-era field model shows a patch of
reversed flux near the north pole. Is the patch a combination of
separatrices — the solar parasitic-polarity skeleton (null + fan dome +
spine) on a giant planet?

**Answer.** In the $l \le 18$ JRM33 potential continuation (the model carries
coefficients to degree 30; 18 is the useful-information cut): **yes** —
and the whole structure is buried in the molecular envelope, beneath the
1-bar surface. Robustness: the structure rides on the degree-14–18
coefficients (the least-determined tail); it is absent at degree-13
truncation and in JRM09. On the record as a falsifiable prediction for the
next Juno model release.

## Pre-registered hypotheses and verdicts

- **H-J1 (nulls exist).** As first posed (r > 1): REFUTED — zero nulls
  above the 1-bar surface in JRM33 (l18, l13) and JRM09; the dipole
  dominates. AMENDED (recorded in the script docstring): the reversed
  patches live at the dynamo surface (r = 0.85 R_J) and the envelope
  0.85 < r < 1 is potential-field territory; the amended hunt finds
  **two nulls**: r = 0.873 R_J, lat +69.0°, lon 282.3° (the polar one) and
  r = 0.864 R_J, lat +9.7°, lon 157.4°. CONFIRMED as amended — and then UPGRADED by
  the cell-prefiltered census (J2 below): the census confirms both and finds a
  **third** null the seeding missed (r = 0.857, lat +27.2°, lon 67.0°; radial,
  degree −1; floor-robustness verified in J2b). "Two nulls" is hereby corrected to
  "three", all radial (0 spirals out of 3).
- **H-J2 (the patch is separatrix-bounded).** CONFIRMED in JRM33-l18:
  the polar null's 72-line fan surface closes onto the dynamo surface as a
  dome; footprint→patch-boundary median angular distance **2.3°**
  (max 3.9°); boundary→footprint median 5.3° (p90 15°, where the patch's
  thin western extension outruns the 72-line discretisation). Spine: one
  branch lands INSIDE the patch (lat 69°N, lon 281°), the other in the far
  southern hemisphere (lat −53°, lon 311°) — dome + spine, the full
  combination. The low-latitude null repeats the anatomy over its own
  small patch (footprint→boundary median 1.5°). Corollary: the dome
  ceiling (r ≈ 0.873) lies ~9,000 km below the 1-bar level, which is why
  the r = 1 north cap is unipolar — the dome closes the reversed flux
  before the visible surface.
- **H-J3 (fourth world).** CONFIRMED: growth vector Q = 6 at both nulls
  (5→6 jump; after the synthetic battery, the Sun, and the magnetosphere);
  both radial with J∥ = 0.00 — the vacuum envelope cannot host spirals
  (Part-5 theorem), and doesn't.
- **H-J4 (robustness).** REFUTED as invariance, reported plainly:
  at lmax = 13 the patch survives weakly (min Br = −0.75 G vs −6.1 G at
  l18) but NO nulls exist (the weakened parasite no longer reverses the
  vertical balance); JRM09 (l10) has no polar reversed flux and different
  envelope nulls (3 equatorial, 2 southern). The skeleton is a
  *resolution tenant* of the l = 14–18 coefficients — the SH analogue of
  the solar window-sensitivity (R3/S5c).

## Machinery

- `src/jupfield.py`: Schmidt semi-normalised vector SH evaluator from the
  planetmagfields coefficient files (JRM33 arrays carry degree 30; package
  truncation 18). Golden checks: Br vs the package's own r = 1 map —
  median relative error 4.9e-16; exact match to an analytic dipole at
  l = 1; div B ≈ 0.
- `scripts/run_j1_jupiter.py`: shell-seeded Newton hunt (r in 0.855–8,
  ~3,000 seeds), classification, tangent-cone Q, fan-surface tracing
  (72 lines/null, RK2, ds = 0.004 R_J), spine tracing, patch contours at
  r = 0.85, model/truncation comparison.
- `scripts/run_j1b_dome.py`: per-null patch association (flood fill of the
  Br < 0 region beneath each null), two-way boundary↔footprint distances,
  spine-end classification, patch co-robustness checks.
- `scripts/render_j1_figures.py`: the four post figures (field maps at two
  depths, the 3D buried-skeleton render, the dome-footprint overlay, the
  anatomy sheet).

## Non-circular w4 reading (J1d, referee follow-up)

The referee's M1 (tangent-cone Q is a consistency check, not detection) is
answered for this world: jupfield gained the EXACT toroidal vector potential
(A = -(1/l) r^{-(l+1)} rhat x grad_s S_lm per harmonic; golden-checked
curl A = B), and w4(r) was measured on the FULL analytic field with no
Jacobian input (`run_j1d_raw_w4.py`, artifacts/j1d_raw_w4.json): w4 = 2.8-3.1
across r = 0.003-0.06 R_J at both nulls, 1.9-2.1 at a generic control —
the k = 1 flux weight read raw on the fourth world.

## Two-resolution cell-prefiltered root census + coefficient ensemble (J2/J2b)

`run_j2_census.py` (artifacts/j2_census.json) + `run_j2b_sensitivity.py`
(artifacts/j2b_sensitivity.json). **Census:** Haynes–Parnell-style corner-sign
prefilter over every spherical cell of the shell, Newton from candidate-cell centres,
two grid resolutions (24×72×144 and 36×108×216) — both converge on **three** nulls:
the two known ones plus r = 0.857, lat +27.2°, lon 67.0°. NOT a completeness theorem
(the prefilter is necessary-only; centre-started Newton can fail or leave its cell) —
the CONVERGENCE evidence is: two-resolution agreement, floor-move invariance (floor
lowered to 0.80 returns exactly the same three nulls in 0.855–1.0, while exposing a
root-dense, truncation-sensitive and poorly constrained continuation layer below 0.85:
39 further roots in 0.80–0.855; noise vs continuation amplification vs unresolved real
structure not diagnosed, no completeness claimed there), and a net-charge degree
cross-check (deg B/|B| numerically consistent with zero — −0.000/−0.000/−0.005 — over
spheres at r = 0.885/0.94/0.999 ⇒ no unexplained NET topological charge above 0.885;
index-cancelling missed pairs NOT excluded — fold pairs are exactly such). The
Haynes–Parnell trilinear cell census remains the stronger comparator (chartered in G1,
not implemented). Anatomy
(J2b): all three radial — polar (deg +1), low-lat (deg +1), census find (deg −1);
0 spirals out of 3, as the curl-free envelope demands. Vectorised evaluator
golden-checked at 2.8e-16.

**Stress ensemble** (J2b, all three nulls, PAIRED design): JRM33 covariances are not
distributed, so per-degree Gaussian perturbations are scaled by the JRM33−JRM09
per-degree difference (1.3% at l=2, 23% at l=10, log-linear extrapolation → ~100% at
l≥14; an honest stress proxy, NOT a posterior — outputs are survival fractions under
the chosen ensemble and sample position ranges, not probabilities; JRM33−JRM09
differences mix model evolution, secular variation and uncertainty). N = 40, capture
radius 0.15, floor 0.856: polar patch survives 40/40 (at thresholds 0.25/0.5/1.0 G
alike); polar null 32/40 with sample position range over those 32 survivors
r 0.86–0.93, lat 64–73°, lon 265–301° (raw recaptures before the floor cut: 36/40,
down to r = 0.75 — acceptance sets reported separately); the two low-lat nulls are
less persistent (15/40, 19/40). Paired amplitude scaling (same 40 standardized draws
×0.5/×1/×2): polar 35/32/29 of 40, low-lat 17/15/14 and 28/19/15. Capture radius
0.10/0.25 → 29/40 / 32/40; floor 0.80 → 35/40 (members sink below the floor rather
than vanish). Possible upgrade recorded: fold in the published JRM33
resolution-matrix diagonals as coefficient-specific constraint weights.

## Bald-patch classification (J1c, referee follow-up)

A PIL can be a separatrix without a null (bald patches, (B·grad)Br > 0).
Measured point-by-point (`run_j1c_baldpatch.py`, artifacts/j1c_baldpatch.json):
polar patch at l18: BP fraction 0.000 (the dome carries ALL the separatrix
character — the pure case); low-latitude patch l18: 0.234 (mixed);
l13 surviving polar patch (null-free): 0.104 — mostly plain arcade, so the
"combination of separatrices" answer genuinely degrades under truncation
rather than surviving via another mechanism.

## Honesty box

Potential-field treatment of the molecular envelope (standard, but neglects
any currents in weakly conducting H2); downward continuation to r = 0.85
amplifies degree-l power by (1/0.85)^(l+2) (~13× at l = 14), which is both
why the patch appears at depth and why the robustness caveat is load-bearing;
magnetodisc/magnetopause fields are negligible below r = 1 (tens of nT vs
1e4–1e6 nT internal). Longitudes are System III as used by JRM33.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/pip install planetmagfields
../cosmic-web/.venv/bin/python src/jupfield.py
../cosmic-web/.venv/bin/python scripts/run_j1_jupiter.py
../cosmic-web/.venv/bin/python scripts/run_j1b_dome.py
../cosmic-web/.venv/bin/python scripts/render_j1_figures.py
```

Artifacts: `j1_jupiter.json`, `j1b_dome.json`, `j1_maps.npz`, `j1c_baldpatch.json`,
`j1d_raw_w4.json`, `j2_census.json`.
Blog: Part 8 (`_posts/2026-09-02-forbidden-directions-jupiter.md`).
