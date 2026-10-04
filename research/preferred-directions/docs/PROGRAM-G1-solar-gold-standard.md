# Program G1 — the gold-standard solar pipeline (charter)

**Status:** charter only — no experiment below has run. Written in response to the
independent review (docs/REVIEW-SR-ASTROPHYSICS-2026-07.md, M7 and plan items 10–11):
the existing solar legs (P2-solar, R3, S2, S5, T3) are software demonstrations on
convenience products; **no astrophysical discovery claim is made from them, and none
will be made until every item in this charter is satisfied.** Pre-registered in the
series' self-registered sense: verdict rules below are committed before any run.

## Why a rebuild rather than a patch

The review's diagnosis, accepted in full: (1) 45-second line-of-sight magnetograms were
used as the normal boundary field without radial conversion or uncertainty propagation;
(2) mean-flux subtraction + periodic FFT continuation on cropped windows manufactures
boundary conditions, and the repository's own window tests show low nulls are window
tenants; (3) Newton seeding is not a census — completeness and recall are unknowable
from it; (4) the AR11158 sequence is too sparse to track null identity; (5) all quoted
uncertainties are numerical, while the dominant error is the boundary data and model.

## G1a — data products

- **Primary:** HMI 720-s definitive vector series, SHARP CEA remapped patches
  (`hmi.sharp_cea_720s`), using the radial component $B_r$ directly; disambiguation as
  distributed; per-pixel uncertainty maps kept.
- **Secondary (cross-check):** the 720-s LOS series with explicit μ-correction, to
  quantify what the earlier LOS-as-radial approximation did.
- Every figure states: NOAA AR number, HARP number, exact T_REC, series name,
  projection, pixel scale, disk position, and the uncertainty product used.

## G1b — extrapolation without manufactured boundaries

- Potential extrapolation with **non-periodic** boundary treatment: zero-padded
  Green's-function or apodized-window comparison against the FFT continuation; the
  difference field is the boundary-systematic estimate.
- Window ensembles as standard: ±16/±32 px shifts, two window sizes, two resolutions
  (full and 2× down), noise ensemble (add per-pixel HMI uncertainty realizations,
  n ≥ 20). A null is reported **only with its survival fraction** across the ensemble.

## G1c — the census, done right

- **External baseline:** the trilinear method of Haynes & Parnell (2007) —
  cell-by-cell sign test + trilinear sub-grid positioning + Poincaré-index
  verification — as the completeness reference. Newton polishing only after the cell
  census.
- Report per region: census count, Newton-confirmed count, disagreements, and the
  weakest null's survival fraction. No "N nulls" claim without the census.

## G1d — temporal topology (the fold hunt, redone)

- AR11158-class emergence at **hourly or better cadence**, co-moving CEA window locked
  to the HARP centroid, null identity tracked by nearest-neighbour in (position, sign)
  with explicit **boundary-crossing accounting**: a count change is attributed to a
  fold only if the pair is interior, opposite-signed, and the collision is bracketed
  in time by the tracker.
- The S5c spectral-certification machinery applies unchanged once a candidate interval
  is found; the certificate vocabulary ("fold in a boundary-interpolation family")
  stays until a *tracked temporal* fold passes.

## G1e — verdict rules (pre-registered)

1. A null is **reported** iff survival fraction ≥ 0.8 across the G1b ensemble AND
   found by the G1c census AND its |B|-minimum exceeds the local noise floor
   propagated from the HMI uncertainty map.
2. The SR growth-vector reading remains labelled by the three-level taxonomy
   (blind / independent confirmation / tangent-cone check) — G1 does not upgrade it.
3. A **fold event** is claimed only under G1d's tracked-interior-bracketed rule.
4. Negative outcomes are published with the same prominence as positives.

## Cost estimate

G1a data pull ~1 h (JSOC exports); G1b/G1c pipeline work ~2–3 sessions; G1d needs
~50–100 frames per region (hourly, 2–4 days) — storage trivial, compute ~hours.
Blocking dependency: none — `drms`/`sunpy` already in the venv.

## Relation to existing results

Until G1 runs, the solar results stand as: *methods demonstrations on convenience
products with documented window sensitivity* (R3 gallery: strongest-2-per-region, not
a census; S5c: certified fold in a boundary-interpolation family; T3: sparse census,
no fold caught). The review's grade for that layer (astro grounding 2.4–2.6/5) is
accepted as the current state.
