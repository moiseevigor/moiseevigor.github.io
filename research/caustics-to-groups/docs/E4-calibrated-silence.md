# E4 — the cosmic-web stress test: calibrated silence (tests H4, "no" half)

Reproduce: `.venv/bin/python scripts/run_e3e4.py` → `artifacts/e3e4_results.json`.

## Hypothesis

**H4 (in-the-wild), the "no" half.** On an *effective* flow — one that is not a
left-invariant group (the cosmic web: an adhesion/Zel'dovich field whose caustic
skeleton is sheets, filaments and nodes) — the detector must **abstain** from a
single global group label. A confident group output here would be a *failure*: the
method fitting the universal ADE germs rather than real geometry. Correct
behaviour is silence, with the honest report "a field of tangent cones."

## Method

A left-invariant group has one tangent cone at every point (homogeneity); an
effective flow has a *field* of different local structures. We estimate the growth
vector at K = 30 base points and test consistency:

- genuine group → the same growth vector everywhere → confident global label;
- effective flow → the growth vector varies point to point → abstain.

The effective flow is modelled offline as a field whose local tangent cone is
drawn from {contact (2,3), Engel (2,3,4), Cartan (2,3,5)} — the analogue of a
sheet / filament / node having different local dimensionality. Only validated
structures are used; a real caustic-skeleton adapter (Feldbrugge/Hertzsch-style
shell-crossing surfaces) is the remaining real-data step.

## Results

```
scenario                                 growth vectors seen        verdict
genuine Heisenberg (homogeneous)         {(2,3): 30}                CONFIDENT: contact class
genuine Engel (homogeneous)              {(2,3,4): 30}              CONFIDENT: Engel
genuine SE(3) (DW-MRI-like)              {(3,6):29, (4,6):1}        CONFIDENT: SE(3)-class (rank-3)
effective flow (sheets/filaments/nodes)  {(2,3,4):11, (2,3):11,     ABSTAIN: field of
                                          (2,3,5):8}                 varying tangent cones (top 37%)
```

The SE(3) row is the **H4 "yes"-half mechanism**: on a genuinely group-structured
field (the tangent cone of the DW-MRI fibre-tracking structure, growth vector
(3,6)) the detector returns a confident rank-3 label. It is more marginal than the
3D groups (97% vs 100% consistency) because the (3,6) structure has six coordinates,
three of them weight-2, so it is more data-hungry — the same "higher structure is
harder" theme from E0. Real DW-MRI inference is data-gated (credentialed download);
this synthetic SE(3) stands in for the mechanism, and the abstention machinery
(effective-flow row) is what keeps a real-data answer honest when homogeneity fails.

**H4 (no half): confirmed.** The detector is confident and correct on genuine
homogeneous groups and correctly **silent** on the effective flow — it reports a
field of varying tangent cones instead of inventing a group. This is the
calibrated silence the program set out to demonstrate: the method knows the edge
of its own competence.

## A methods lesson logged (frame ↔ structure-constants consistency)

While building a curvature-tunable contact family for this test, an early version
set the structure-constant array to a value the frame's *actual* Lie brackets did
not produce. The result was not a different SR structure — it was **no SR structure
at all**: the geodesic flow integrates `q'` from the frame but `h'` from the
structure constants, so an inconsistent pair yields a nonsense flow (it produced a
spurious nonzero deviation for what should have been a flat model). Fix: a
`structure_constants_consistent` check now validates, by finite-difference
brackets, that every registered group's frame matches its C — run for all groups
in `scripts/smoke_test.py`. This is exactly the "coordinate/structure error
masquerading as geometry" failure mode the scoping post's caveats warned about,
caught by a self-check rather than shipped.

## What remains for H4 (the "yes" half)

- Add the SE(3) forward model (rank-3 left-invariant structure; growth vector to
  be verified against the literature before use, given the frame↔C lesson above)
  and confirm M1 recovers it.
- Wire a DW-MRI orientation-field adapter to the common sample schema (fetch gated
  behind a documented credential step) and run inference on a genuinely
  group-structured real field — reporting the recovered structure *with* its
  homogeneity assumption stated. Where homogeneity fails locally, the E4 machinery
  above says: abstain.

## Verdict summary

- H1 identifiability — confirmed (E0).
- H2 discrimination — confirmed (E1).
- H3 rigidity/aliasing — confirmed (E2).
- H4 in-the-wild, "no" half (calibrated silence) — confirmed (E4); "yes" half
  (SE(3) + real DW-MRI) pending real data.
