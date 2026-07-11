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

1. **All-radial is forced by the physics, not observed luck.** A potential extrapolation
   is current-free; `∇×B = 0` makes `∇B` symmetric, its eigenvalues real — a potential
   field *cannot contain a spiral null*. The gallery therefore grounds only the **radial
   half** of the classification problem. The spiral half on real data needs a
   current-carrying model (NLFFF or MHD) — recorded as the program's next data need.
2. **Why the flow classifier succeeds here despite R2's noise fragility:** these real
   nulls sit *far from the radial/spiral boundary* (discriminants are large), exactly the
   regime R2 showed is easy for every method. Consistency, not contradiction.
3. `Q = 6` is measured on each null's tangent cone (its measured Jacobian), as in P2 —
   the raw-grid reach estimator remains resolution-limited below the linear-zone scale.
4. A small exact tool fell out: for **any** traceless linear field `B = M r` (radial or
   spiral), `A(r) = −⅓ r × (M r)` satisfies `∇×A = M r` (homogeneous-degree-1 identity,
   asserted numerically). This builds the SR structure of an arbitrary real null in one
   line — `nullfields.py`'s block construction is now a special case.

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

- Spiral nulls on real data → NLFFF or MHD snapshot (the one remaining real-data gap).
- Off-centre linear fits under realistic null-localisation error (R2 open question #1) —
  the real-data agreement here suggests the effect is small far from the boundary.
- The moduli-vs-null-type frontier (program task #22) stays the deepest open question.
