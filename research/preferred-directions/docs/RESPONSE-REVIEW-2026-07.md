# Response to the independent review (REVIEW-SR-ASTROPHYSICS-2026-07)

> **CORRECTION (2026-07-14).** The post-revision re-review demonstrated that several
> **Done** labels below (M3, M6, M8, M10, M11, M12) were premature: the intended
> corrections had been applied at some sites while the old claims survived verbatim at
> others (Parts 1/2/4 reconnection language, V1's two-radius sentence, the README's
> part count and inversion, Part 8's spiral count). Those residues are now fixed and
> the guard rewritten so this failure mode is structurally caught — see
> `RESPONSE-REREVIEW-2026-07-14.md` for the current disposition of record. This file
> is kept as the historical response to the first review.

Point-by-point disposition of every finding. **Done** = implemented and verifiable at
the pointer; **Partial** = implemented with a stated residue; **Deferred** = not done,
with the reason and the owner of the decision recorded. Regression protection:
`scripts/check_retracted_claims.py` (since upgraded to invariant rules + a fixtures
self-test; see the correction note above).

## Major findings

| # | Finding | Disposition |
|---|---|---|
| M1 | Closest prior art (Montgomery 1995; Barilari–Bossio–Franceschi) | **Done.** Article §6 "Relation to prior work" with explicit not-new list; abnormals upgraded from fine print (Lemma 1.3, §6); BBF verified against arXiv:2504.09274; refs added to article, D1, D3, D4. Residue: the §6 comparison is statement-level and says so — to be refined against the papers' proofs before any journal submission. |
| M2 | Period theorem vs caustic conjecture conflated | **Done.** "Exact period-average law" everywhere (incl. Part 6 scoreboard cell); Conjecture A's structure (steps proved/gap) in §3.4; R6 probe replaced "beam stops refocusing" with the measured band statement; even-multiplicity guard run subcritical (0 suspects at ε=0.45/0.48) and stated; M2.4 physical-operational scope now in Remark 3.0. |
| M3 | §4 non-sequiturs (two-radius, exact inversion, β=2, σ) | **Done.** Two-radius separation retracted (single combination at leading order — article, D5, Part 3); inversion labelled leading-order estimator; β=2 rescoped to the period average with the derived caustic −½ sign-flip prediction; σ language replaced by sensitivity bands; Prop 4.1 remainder honest at O(ε³). Since superseded in the good direction: caustic c₂ = 1−¾β now DERIVED (Prop 4.2, `run_o6_caustic_c2.py`). |
| M4 | Singular-point Q / blog volume language / D2 criterion | **Done.** D3 fine print (earlier pass); article Remark 2.6 + Prop 2.7 (what the estimator converges to); D2 rewritten: estimator confounding named, full-measure screen labelled "working rule, no converse claimed". O1 (volume at the null) remains open and is leddered as such. |
| M5 | Smaller math issues (notation, codimension, bundle, dimensions) | **Done.** t_c = r_L F(θ₀,ε); g ≥ 0 convention with reflection argument; codimension 8 (×2 sites); ℝ-fibre vs U(1) hypothesis in Remark 1.2; dimensions/w↔q/m in Remark 3.0. |
| M6 | Detection vocabulary | **Done.** Three-level taxonomy (blind / independent local confirmation / tangent-cone consistency check) defined in article §0 + Part 4, applied in README rows and Parts 5/8; "none is blind detection" stated. |
| M7 | Solar validation below solar-physics standard | **Partial by design.** Immediate honesty items done (r3 cap/prose, finder-params in captions, LOS/45s provenance, T3 complexity-index demoted to candidate). The rebuild itself (SHARP/720s radial, trilinear census, ensembles, tracked cadence) is chartered with pre-registered verdict rules (PROGRAM-G1) and **not executed**; accordingly, no solar discovery claim is made anywhere in the current layer. Owner of execution: next program phase. |
| M8 | Null/fold ≠ reconnection; fold naming; boundary crossing | **Done.** "Fold in a real-data-anchored boundary-interpolation family" naming; no-boundary-crossing caveat on the fold-wall claim; reconnection language reserved for non-ideal evolution (Part 6 subtitle + body). |
| M9 | T96 retraction not propagated | **Done.** README row, S3 banner (SUPERSEDED), Part 7 scoreboard, PROGRAM.md; Cluster/MMS gate recorded in the S3 banner; no magnetospheric claim pending. |
| M10 | Jupiter overstatement | **Done.** l≤18 continuation wording (×5); 0.85 = conventional mapping surface, Lowes ≈ 0.81; census caveat → then the census RAN (J2): three nulls (third found, Part 8 corrected), converged at two resolutions; coefficient ensemble (model-difference proxy, honestly labelled): patch 40/40, null 33/40 + position box; bald-patch scoping fixed (M10.5). Residue: formal covariances remain unpublished — the proxy is the best available and is labelled as such. |
| M11 | Statistical language | **Done.** No σ theater; bands labelled numerical/fit sensitivity; §0 convention; model-uncertainty-dominates note. |
| M12 | Record vs publication layer | **Done.** Superseded banners (S1, S3), PROGRAM.md status header, Part 7 sync, stale-claims regression script; current layer = README + article ledger. "Seven parts" claim: not found anywhere in the tree (checked); treated as already-fixed or mislocated. |

## Minor findings

| # | Finding | Disposition |
|---|---|---|
| 1 | "SR" in article abstract/theorems | **Done** (none present; posts define the abbreviation at first use). |
| 2 | Units / w ↔ q/m | **Done** (Remark 3.0). |
| 3 | Heisenberg claim planar-scoped | **Done** (Part 2 + article Cor. 2.4 table). |
| 4 | Contact vs quasi-contact | **Done** (Lemma 1.3; Part 2 planar note). |
| 5 | Null ≠ reconnection site | **Done** (M8). |
| 6 | Full solar figure provenance | **Partial.** Series names, dates, downsampling, sample-file provenance present (Parts 4–7); NOAA/HARP + pixel scale + disk position for *every* figure is mandated by G1a going forward; retrofitting every legacy caption is folded into the G1 phase. |
| 7 | Finder parameters beside null counts | **Done** (Part 4 estimator box; Part 5 R3 caption; Part 6 hunt caption; Part 8/J2 census parameters). |
| 8 | "Pre-registered" qualified | **Done** (self-registered sense defined; repeated in G1). |
| 9 | Data-class labels in captions | **Done where load-bearing** (Parts 5/6/7/8 captions state real / extrapolated / model-derived); full sweep of early-series figures rides with G1's caption standard. |
| 10 | Split Part 6 into two posts | **Deferred to the author.** An editorial restructure of an interactive post with cross-references; flagged, not executed unilaterally. All correctness issues inside Part 6 are fixed in place. |
| 11 | Title/abstract conditional | **Done** (subtitle rewritten; caustic identification named as open in the callout and ledger). |
| 12 | Regression tests for retracted claims | **Done** (`check_retracted_claims.py`, 15 patterns, wired for manual/CI use). |

## The review's two "decisive frontiers"

1. *Prove or refute the exponential-profile conjugate-time identity.* Not closed — but
   materially sharpened since the review: the identity is now known to be
   **exponential-specific** (V1 counterexample), its first-order caustic shift is
   derived (τ₁ = 2π sin θ₀), the β = 0 coincidence of caustic and period average is a
   theorem at second order (Prop 4.2), and the supercritical regime is mapped (R6).
   O2 remains the program's top open problem, now with a much smaller haystack.
2. *One astrophysical test at external standard.* Chartered (G1) with frozen verdict
   rules; Jupiter's J2 census + ensemble executed the reviewable half (item 12) and
   corrected the program's own claim in the process. No discovery claim is made until
   G1 runs.

## New results produced by implementing the review

- Caustic profile law **derived**: c₂(β) = 1 − ¾β (arbitrary profiles, leading order).
- Conjecture A delimited: exponential-specific; supercritical band structure measured.
- Jupiter: third envelope null found by the cell-prefiltered census; prediction now
  carries a survival fraction under the stress ensemble and a sample position range.
- The launch-averaged statistic confirmed absent from a bounded guiding-centre
  literature search (O4 closed as a search record).
