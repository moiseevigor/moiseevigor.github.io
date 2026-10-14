---
layout: page
title: Article–Lean proof-step correspondence
permalink: /projects/proof-atlas/proof-steps/
---

The index links literal clauses and proof passages of Lemmas 3.1–3.3, Theorems 3.4/4.1 and the supporting cumulative count and hypothesis reduction to specific compiled occurrence paths. It adds **94 anchors across 59 compiled declarations**, covering **55 passages**: 42 partial, conditional counterparts and 13 explicitly unsupported passages. The existing 84 crossing anchors remain unchanged.

| Article argument | Indexed compiled step |
|:--|:--|
| Coefficient collapse and quotient derivatives (3.1) | Separate `collapse_beta/alpha/diff` and `hasDerivAt` proof bodies |
| Maxwell and β₁ zeros (3.1) | Unique-zero proofs, distinct sign proofs and completed monotonicity/endpoint calls |
| α₁ zero (3.1) | Quotient injectivity, opposite endpoint signs and the intermediate-value helper; simplicity excluded |
| Riccati pair and z derivative (3.2) | Separate `a_deriv_form`/`b_deriv_form` applications within `hasDerivAt_z` |
| Slope bound (3.2) | Product, common-sign and completed AM–GM calls within `slope_bound_abs`; then the oriented phase-lift bound |
| Cumulative 2N count | `roots_ncard` induction, `roots_succ` and `two_per_cell_of_ne` |
| Reduction of hypotheses | Compiled `JacobiCore.toJacobiFull` construction; core assumptions retained |
| First bracket has exactly one root | `exact_first_time` applies `left_exact_time`; `first_time_complete` reuses that count |
| No earlier positive root | Positivity in `J2_pos_before_p0`; the `q < p₀` contradiction branch of `first_time_complete` |
| A competing root is in the first bracket | The `q ≥ p₀` uniqueness branch and witness construction in `first_time_complete` |
| One root on each cell bracket | Separate fully applied `left_exact_time` and `right_exact_time` calls in `cell_roots` |
| No root after bₙ or between brackets | Distinct `J2_pos_after_bR` and `J2_neg_gap` applications |
| Bracket roots exhaust the cell | The complete `Set.ext` proof of the cell zero-set equality |
| Coincidence requires a common endpoint | The equality branch in `cell_roots` and `coincide_imp`, including `eL_eq_eR_iff` |
| Phase at an even-period endpoint | `J2_even_eq_zero_iff` |

The focused Lemma 3.2 geometry has nine compiled proof nodes and six completed-call edges. Differentiation and the inequality argument are shown separately. Selecting a node opens its proof body; selecting an arrow opens the precise lemma application. The square-gap/equality case remains unsupported. [Geometric model](/public/js/proof-atlas-riccati-geometry.js).

A selected anchor identifies the recorded compiled expression. A descendant identifies **context within that proof step**, preserving its occurrence path and binder scope. Reused helpers can correspond to more than one article passage; the reader exposes the alternatives. This is a reviewed correspondence index, not a kernel certification that prose and Lean are equivalent.

All 39 named counterparts in the five partial statement records now have indexed compiled paths. This is an inventory check, not a claim that every article clause or every helper declaration has an exact prose counterpart. Unindexed nodes retain declaration context. The crossing argument retains its original 84 paths; its analytic order/finiteness passages now clear the compiled match explicitly.

The scalar counting declarations assume `JacobiFull` and finite tangencies (`hfin`, `hL/hR`). Lean's `m` is article `n − 1`. Zero-simplicity claims in Lemma 3.1, the exact square-gap/equality case in Lemma 3.2, root continuity as a function of phase, endpoint divergence, analytic continuation, extrema, geometric time interpretation and zero-order claims are not established by these scalar counterparts. The relevant unsupported passages clear the previous compiled selection. All nine original statement coverage records remain unchanged: five partial, four unformalized.

The index covers 16,188 of 18,359 expanded proof occurrences in `first_time_complete`, 353,668 of 360,606 in `cell_roots`, and 105,945 of 105,975 in `coincide_imp`. These counts measure membership in recorded step subtrees, including their syntactic arguments and internal proof terms; they are not counts of article sentences proved. Binder domains, type motives and other unindexed nodes retain explicitly labelled declaration context.

[Reviewed input](/research/proof-atlas/proof-step-map.json) · [Index builder](/research/proof-atlas/build_proof_steps.cjs) · [Path and scope audit](/scripts/test-proof-atlas-proof-steps.cjs) · [Browser regression](/scripts/test-proof-atlas-proof-steps-browser.cjs) · [Statement coverage](/projects/proof-atlas/coverage/)

The audit checks every literal excerpt and source line, article and packet hashes, structural paths, node identity, complete call arities and specificity of descendant resolution. Negative controls reject a stale article hash, stale packet, wrong node, changed path and partial call. Browser checks exercise all 55 article targets and 94 compiled anchor paths, actual compiled-line and canvas clicks in four added lemma argument families, a change from the z derivative to its Riccati-pair substep, reused-helper choices, saved paths, unsupported passages and standalone-library links. The manuscript's 916 formulas, four figures, three tables and original proof paragraph counts are preserved. No original private proof scripts are published.
