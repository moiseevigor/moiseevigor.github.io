---
layout: page
title: Article–Lean proof-step correspondence
permalink: /projects/proof-atlas/proof-steps/
---

The index links literal clauses and proof passages of Theorems 3.4 and 4.1 to specific compiled occurrence paths. It adds **44 anchors across 23 compiled declarations**, covering **22 passages**: sixteen partial, conditional counterparts and six explicitly unformalized passages. The existing 84 crossing anchors remain unchanged.

| Article argument | Indexed compiled step |
|:--|:--|
| First bracket has exactly one root | `exact_first_time` applies `left_exact_time`; `first_time_complete` reuses that count |
| No earlier positive root | Positivity in `J2_pos_before_p0`; the `q < p₀` contradiction branch of `first_time_complete` |
| A competing root is in the first bracket | The `q ≥ p₀` uniqueness branch and witness construction in `first_time_complete` |
| One root on each cell bracket | Separate fully applied `left_exact_time` and `right_exact_time` calls in `cell_roots` |
| No root after bₙ or between brackets | Distinct `J2_pos_after_bR` and `J2_neg_gap` applications |
| Bracket roots exhaust the cell | The complete `Set.ext` proof of the cell zero-set equality |
| Coincidence requires a common endpoint | The equality branch in `cell_roots` and `coincide_imp`, including `eL_eq_eR_iff` |
| Phase at an even-period endpoint | `J2_even_eq_zero_iff` |

A selected anchor identifies the recorded compiled expression. A descendant identifies **context within that proof step**, preserving its occurrence path and binder scope. Reused helpers can correspond to more than one article passage; the reader exposes the alternatives. This is a reviewed correspondence index, not a kernel certification that prose and Lean are equivalent.

The scalar counting declarations assume `JacobiFull` and finite tangencies (`hfin`, `hL/hR`). Lean's `m` is article `n − 1`. Root continuity as a function of phase, endpoint divergence, analytic continuation, extrema, geometric time interpretation and zero-order claims are not established by these scalar counterparts. The relevant unsupported passages clear the previous compiled selection. All nine original statement coverage records remain unchanged: five partial, four unformalized.

The index covers 16,188 of 18,359 expanded proof occurrences in `first_time_complete`, 353,668 of 360,606 in `cell_roots`, and 105,945 of 105,975 in `coincide_imp`. These counts measure membership in recorded step subtrees, including their syntactic arguments and internal proof terms; they are not counts of article sentences proved. Binder domains, type motives and other unindexed nodes retain explicitly labelled declaration context.

[Reviewed input](/research/proof-atlas/proof-step-map.json) · [Index builder](/research/proof-atlas/build_proof_steps.cjs) · [Path and scope audit](/scripts/test-proof-atlas-proof-steps.cjs) · [Browser regression](/scripts/test-proof-atlas-proof-steps-browser.cjs) · [Statement coverage](/projects/proof-atlas/coverage/)

The audit checks every literal excerpt and source line, article and packet hashes, structural paths, node identity, complete call arities and specificity of descendant resolution. Negative controls reject a stale article hash, stale packet, wrong node, changed path and partial call. Browser checks exercise article clicks, compiled lines, canvas nodes, reused-helper choices, saved paths, unsupported passages and standalone-library links. The manuscript's 916 formulas, four figures and three tables are preserved. No original private proof scripts are published.
