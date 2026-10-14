---
layout: page
title: Proof Atlas coverage
permalink: /projects/proof-atlas/coverage/
---

12 October 2026. The [compiled proof library](/projects/proof-atlas/library/) covers every declaration extracted from two finite project snapshots. Original source projects, tactic scripts, downloadable source archives and extraction logs remain private. The previously published article and statement excerpts remain available.

The [proof-step correspondence index](/projects/proof-atlas/proof-steps/) links clauses and proof steps of Theorems 3.4 and 4.1 to 44 checksum-bound compiled occurrence anchors. Exact selected anchors and descendant step context are distinguished; excluded analytic clauses remain explicit.

| Extracted inventory | Published article snapshot | Current working snapshot |
|:--|--:|--:|
| Owned source modules | 15 | 26 |
| Owned declarations | 739 / 739 | 1,359 / 1,359 |
| Theorem proof bodies | 561 / 561 | 1,083 / 1,083 |
| All available bodies, including definitions | 715 / 715 | 1,335 / 1,335 |
| Recursor reduction rules | 8 / 8 | 8 / 8 |
| Distinct expression nodes | 549,509 | 1,277,896 |
| Expanded expression occurrences | 49,693,046 | 670,018,056 |

Every type, available body and recursor rule passed native Lean kernel checking during the private extraction. Inferred body types were compared with declared types. Transitive axiom lists contain only `propext`, `Classical.choice` and `Quot.sound`; no custom axiom or `sorryAx` was found. There are no unsafe or partial declarations in either extracted inventory.

Public checks verify every compressed packet's hashes, constructor arities, ordered child links, root reachability, lexical-scope requirements, expanded counts and declaration references. These checks validate the published serialization. They do not independently reproduce the private native kernel checks or prove that every article sentence follows from Lean. The packets are not advertised as standalone kernel certificates.

## Structural sharing and binding

`ExprDAG/1` preserves full structural sharing, including binder names, annotations and metadata. Every ordered child reference remains present. The current inventory has 1,277,896 distinct expression nodes representing 670,018,056 expanded occurrences. This is a measured structural property of the extracted corpus, not a mathematical proof-equivalence claim.

Expanded counts and natural-number literals use exact decimal strings. The exporter uses full expression structural equality rather than alpha equality, preserving distinctions that matter for the representation. A bound variable's enclosing binder depends on its root-to-node path. Sharing does not give a variable one fixed binder in every context.

## Reading compiled proofs

The right-hand reader and article comparison display **decoded compiled terms**. `eN` names a shared subterm; child links reference those names. Bound-variable indices depend on the displayed root-to-node path. The same shared variable node can have different enclosing binders on different paths. Direct jumps show a labeled representative path, and links preserve the selected path.

The decoded listing is a compact notation for the kernel graph, not the original tactic script or independently compilable Lean source. Every selected branch can be paged through and downloaded without exponentially unfolding repeated subterms. The type is also shown using Lean's readable pretty-printer output.

All six article proof blocks have correspondence status; five link to supporting compiled proof terms, and the Floquet proof remains unformalized in the published snapshot. All nine numbered results retain their audited partial or unformalized status. **Complete coverage of these project declaration inventories does not mean complete formalization of the article.** Module links identify related proof context rather than certify a sentence-by-sentence translation.

The original [crossing microscope](/projects/proof-atlas/app/) remains a focused 7,288-occurrence example. The separate [language reference](/projects/proof-atlas/grammar/) covers all 12 `Expr`, six `Level` and four `Syntax` constructor tags for Lean 4.33.1, plus curated major surface-language families. Extensible parsers, tactics and macros are not claimed to be an exhaustive registry. External Lean/Mathlib declarations remain explicit named boundaries.

## Public validation

[Compiled packet checks](/research/proof-atlas/compiled-term-checks.json) report the complete public denominators, graph and payload checks, and publication-boundary checks. Browser tests exercise every served packet, contextual binders, decoded terms, article links, responsive layouts, corrupt-packet rejection and scoped automated accessibility checks in both themes. Original extraction logs and private source projects are not part of this release.

Run `python3 research/proof-atlas/verify_proof_library.py` to audit every published packet. The browser regression is `node scripts/test-proof-atlas-library.cjs`. The native exporter and synthetic constructor controls are included as tooling, without project source proofs. Fresh project-source reproduction is not offered by this public release.
