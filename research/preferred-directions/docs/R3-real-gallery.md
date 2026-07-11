# R3 — the real detection gallery: three days of the Sun, five coronal nulls

Reproduce: `../cosmic-web/.venv/bin/python scripts/fetch_hmi.py` (best-effort VSO
download, needs `zeep`+`drms`+`bs4`; ~30 MB into gitignored `artifacts/hmi/`), then
`scripts/run_r3_real_gallery.py` (~7 s). Results → `artifacts/r3_real_gallery.json`,
figure → `public/img/posts/forbidden-directions-real-gallery.png`.

## Data — genuinely real, genuinely distinct

| Day | Source | Context |
|---|---|---|
| 2011-06-07 | SDO/HMI LOS (sunpy sample, 1024²) | the P2 active region |
| 2012-03-07 | SDO/HMI `m_45s` (VSO, 4096²→1024²) | AR11429, X5.4-flare day |
| 2014-10-22 | SDO/HMI `m_45s` (VSO, 4096²→1024²) | AR12192 — largest AR of cycle 24 |

Per day: the two most bipolar-balanced active-region windows → potential-field
extrapolation (`src/solar.py`) → Newton null finder → every interior null classified.

## Result — the per-null agreement table (H-R3)

| Day | null height | standard (Parnell) | SR growth vector | flow on raw grid | LSQ on cube |
|---|---|---|---|---|---|
| 2011-06-07 | 14 px | radial− | **Q = 6** | radial− | radial− |
| 2012-03-07 | 20 px | radial+ | **Q = 6** | radial+ | radial+ |
| 2012-03-07 | 26 px | radial+ | **Q = 6** | radial+ | radial+ |
| 2014-10-22 | 45 px | radial+ | **Q = 6** | radial+ | radial+ |
| 2014-10-22 | 40 px | radial+ | **Q = 6** | radial+ | radial+ |

**Detection 5/5, type agreement 5/5 for every method — including the R2 flow classifier
run directly on the raw resampled real grid** (its resolution-limited regime), and
including sign.

## The honest caveats — what this does and does not test

1. **All-radial is forced by the physics — and more strongly than we first stated.**
   *No-spiral theorem (force-free fields):* if `J = ∇×B = αB` with `α` locally bounded,
   then at any null `∇×B = αB = 0`; the antisymmetric part of `M = ∇B` is the dual of
   `∇×B`, so `M` is symmetric there, its eigenvalues real — **the null is radial**. This
   covers not just our potential extrapolation (`α = 0`) but *any* force-free model:
   linear force-free and NLFFF with bounded `α` alike. Spiral nulls require genuinely
   non-force-free current *at the null* — dynamic MHD or in-situ (magnetospheric) fields.
   Premise checked on our own P2 field `(cos y, cos z, cos x)`: all 8 of its spiral nulls
   carry `|∇×B| = √3 ≠ 0` where `|B| = 0` — it is not force-free, which is exactly *why*
   it can host them. Consequence: for extrapolation-based coronal null catalogues (the
   field's standard tools) radial is the only class, so this gallery grounds not half the
   problem but the **whole force-free-accessible problem**. (Numerical NLFFF
   reconstructions can still exhibit spiral nulls where they locally violate
   force-freeness — a solver artefact to filter, not a physical class to expect.)
2. **Why the flow classifier succeeds here despite R2's noise fragility:** these real
   nulls sit *far from the radial/spiral boundary* (discriminants are large), exactly the
   regime R2 showed is easy for every method. Consistency, not contradiction.
3. `Q = 6` is measured on each null's tangent cone (its measured Jacobian), as in P2 —
   the raw-grid reach estimator remains resolution-limited below the linear-zone scale.
4. A small exact tool fell out: for **any** traceless linear field `B = M r` (radial or
   spiral), `A(r) = −⅓ r × (M r)` satisfies `∇×A = M r` (homogeneous-degree-1 identity,
   asserted numerically). This builds the SR structure of an arbitrary real null in one
   line — `nullfields.py`'s block construction is now a special case.

## Window-sensitivity of low potential-field nulls (post-P5 check)

Attempting to render the AR11429 null's field lines to closure exposed a caveat that
belongs in the record. Scanning the extrapolation window around the survey's 160 px:

| window [disk px] | null nearest the AR target |
|---|---|
| 160 (survey) | present, dist 0.0 px (h = 4.9 px) |
| 180 | 18 px away, at h = 1.8 px |
| 200–224 | **no nulls found at all** |
| 256–280 | unrelated nulls, 40–47 px away |

**Low-lying nulls of windowed potential extrapolations are features of the model
domain** (flux balancing + periodic FFT boundaries), not established coronal
structures: this one does not persist under domain enlargement. Two consequences,
stated precisely: (1) the *detector validation* of R1–R3 is untouched — the SR
detector correctly finds and grades the nulls of whatever field it is given, which is
what was claimed; (2) any *physical* claim about a specific coronal null from a single
windowed potential extrapolation is weaker than it looks — persistent identification
needs NLFFF or global extrapolations, and the rendered field lines of such a null
cannot be traced "to closure", because their connectivity leaves the volume in which
the null exists. Figure captions now say so.

## Where the program stands after R1–R3

- **Detection**: grounded. Q = 6 at every null across the full synthetic type battery
  (R1) *and* five real coronal nulls on three real days (R3), agreeing with the standard
  finder everywhere.
- **Classification**: the integrated read-out exists (H-R1 ✓) and matches on real radial
  nulls, but R2's verdict stands — the local least-squares fit is the statistically
  right classifier; SR classification is a language, not an edge.
- **The SR framework's non-redundant contributions** remain: the scale-covariant null
  *detector* (Q-jump), the *order* read-out (Q = k+5), and the *gradient* read-out
  (δ = −ε², P1).

## Open / next

- Spiral nulls on real data → dynamic MHD or in-situ magnetospheric data (Cluster/MMS);
  force-free extrapolations of any kind are excluded by the no-spiral theorem above.
- Off-centre linear fits under realistic null-localisation error (R2 open question #1) —
  the real-data agreement here suggests the effect is small far from the boundary.
- The moduli-vs-null-type frontier (program task #22) stays the deepest open question.
