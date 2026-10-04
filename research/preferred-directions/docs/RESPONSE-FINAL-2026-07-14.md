# Response to the final review (REVIEW-SR-ASTROPHYSICS-FINAL-2026-07-14)

All four release conditions executed. The centerpiece — user-directed — is the Lean 4
formalization of the formalizable core; the honest boundary of what that buys is
stated in `lean/FORMAL.md` and repeated in the article's §0.

## F1 — Lean 4 / mathlib formalization: DONE (zero `sorry`, `lake build` green)

Project: `research/preferred-directions/lean/` (Lean 4 v4.32.0 + mathlib, pinned).
`lake build` → "Build completed successfully (8661 jobs)"; `grep sorry FDFormal/` →
none. Ledger: `lean/FORMAL.md`, one row per claim with an explicit
"what it does NOT prove" column.

| Item | Lean theorems | Status |
|---|---|---|
| F1a — Prop 4.2 homogeneous backbone | `FDFormal.J0_pos` (J₀ > 0 on (0, 2π) — the first-root statement, proved via the half-angle factorization J₀ = 2 sin(t/2)(2 sin(t/2) − t cos(t/2)) and mathlib's `lt_tan`), `J0_two_pi`, `deriv_J0_two_pi` (= −2π, simple zero), `J0_div_pow_four_tendsto` (J₀/t⁴ → 1/12, four formalized L'Hôpital steps with all derivative lemmas proved) | **Done.** The closed form's identification with the flow Jacobian is the stated interface: verified symbolically (exact 3×3 determinant ⇒ 2(1−cos t) − t sin t, θ₀-free; anchors J₀(2π) = 0, J₀′(2π) = −2π, series t⁴/12 all reproduced) — recorded in FORMAL.md, not claimed as Lean. |
| F1b — Lorentz sign (Lemma 1.3) | `lorentz_sum_identity`, `lorentz_force_reduction` (the calculus form, with Hamilton + chain rule as `HasDerivAt` hypotheses) | **Done.** The sign that survived three drafts is now machine-checked; the article's Lemma 1.3 parenthetical points at it. |
| F1c — Theorem B factorization | `radicand_factorization` (under the substitution hypothesis), `cos_tan_half_relation` (the substitution itself, for cos(θ/2) ≠ 0), `modulus_identity` (k = 2ε) | **Done.** The elliptic *average* is explicitly not formalized (no complete elliptic integrals in mathlib) and the article's ledger row now says so in place. |
| F1d — B2 subcritical algebra | `subcritical_E_gt_eps`, `subcritical_radicand_pos`, `critical_equality` | **Done.** Finite θ-period for every angle below ε = 1/2; sharp at sin θ₀ = 1. |
| F1e — force-free core | `isHermitian_map_ofReal_of_isSymm`, `spectrum_real_of_isSymm`, `forcefree_null_no_spiral` (via mathlib's Hermitian spectral theorem) | **Done.** The two-line physics step (null of a J = αB field ⇒ symmetric ∇B) stays in the article; Part 5 links the Lean theorem. |
| F1f — ledger + wiring | `lean/FORMAL.md`; article §0 note + Prop 4.2/Theorem B/Lemma 1.3 pointers; reproduce gains the `lake build` block | **Done.** Including a de-ambiguation the formalization itself forced: the Theorem B ledger cell said "chain machine-checked", which had meant *sympy* — it now distinguishes sympy-checked chain from the Lean-checked factorization step. |

**Not formalized, by declared scope:** the elliptic period average, the
ε-perturbation certificate (τ₁, τ₂ — the sympy trace remains the derivation of
record, archived), the growth-vector flag beyond algebra, anything observational.
Article sentence after F1: *"the elementary load-bearing steps are machine-checked;
the symbolic perturbation is certificate-backed; the period-caustic identification
remains an open conjecture"* — exactly the review's §4 boundary.

## F2 — the β = 4/3 caustic-blind prediction: RUN, PASS

`run_f2_beta43_blind.py` (power profile n = −3/4, exact potential, same pipeline and
band construction as V1; rule pre-registered in the review before the run):

- caustic **c₂ = (−0.7 ± 1.4) × 10⁻⁵** against predicted **0** — consistent with
  zero exactly where Prop 4.2 predicts cancellation, while the *period
  average* there is 1/3: the sharpest period-vs-caustic split measured;
- the residual is consistent with ε⁴ scaling over the sampled range, under the
  even-power fit models used (c₄ ≈ −0.105 ± 0.006 across those models);
- per-angle t_c ≠ T confirmed off-exponential (max|t_c/T − 1| = 1.5×10⁻² at ε = 0.15).

Written into: article §4 (the β = 2 parenthetical) + Prop 4.2 ledger row, V1 doc
(item 4), D5's calibration-factor note. Artifact: `artifacts/f2_beta43_blind.json`.

## F3 — wiring: DONE

FORMAL.md linked from article §0, Prop 4.2, Theorem B row, Lemma 1.3, Part 5;
`lake build` in the article's reproduce block; the build-verification log carries the
Lean build stamp ("8661 jobs", zero sorry) and the F2 verdict. Guard: clean
(21 files, 39/3/4/2 rules, 25 fixtures) — no new banned phrases arose.

## F4 — housekeeping: DONE

`REVIEW-SR-ASTROPHYSICS-INCREMENTAL-2026-07-14.md` stamped as the superseded
same-day draft of the re-review, pointing at the review and response of record.

## Residue (open, owned)

- O2 (period = caustic on the exponential), O6 hand proof and higher coefficients,
  O1/O3/O5 — unchanged, leddered in the article.
- Lean upside not taken: formalizing the ε-perturbation and the elliptic average
  would be research-scale mathlib work; recorded as the natural formalization
  frontier, not a debt.
- G1 solar execution and the Part 6 editorial split remain the author's calls.
