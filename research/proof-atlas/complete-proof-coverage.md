---
layout: default
title: Proof Atlas — compiled proof coverage and resource audit
permalink: /projects/proof-atlas/coverage/
---

# Complete compiled proofs, bounded resources

12 October 2026. The [compiled proof library](/projects/proof-atlas/library/) covers every declaration extracted from two finite project snapshots. Original source projects, tactic scripts, downloadable source archives and extraction logs remain private. The previously published article and statement excerpts remain available.

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

## Sharing and disk use

The initial exporter repeatedly unfolded shared subterms into trees and created large disposable intermediates. Approximately 9 GiB of those files was removed, raising free disk space from 47 to 56 GiB. Research sources, toolchains and dependency caches were preserved.

The complete current compiled inventory represents 670 million occurrences with 1.28 million shared nodes, using about 10 MB of compressed packets. The measured private export used about 44 MiB of temporary graph data and 5.7 GiB peak sampled resident memory, including Lean's imported environment. One declaration is processed at a time and its table is released before the next declaration. The browser fetches one declaration at a time too.

The export runner samples memory, output size and free space every five seconds. Default budgets are 8 GiB resident memory, 1 GiB output, a 30 GiB free-space reserve, a 30-minute timeout and a 256 MiB per-file limit. Sampled RAM budgets are not an instantaneous hard allocation ceiling. An unavailable memory monitor causes the runner to stop.

`ExprDAG/1` preserves full structural sharing, including binder names, annotations and metadata. Every ordered child reference remains present. Expanded counts and natural-number literals use exact decimal strings. A stress fixture represents `2^81 − 1` occurrences with 81 nodes. Native controls preserve binder and metadata variants and reject invalid/open expressions and a false body/type pairing. The disk reserve control refused a run with an unavailable reserve.

## Reading compiled proofs

The right-hand reader and article comparison display **decoded compiled terms**. `eN` names a shared subterm; child links reference those names. Bound-variable indices depend on the displayed root-to-node path. The same shared variable node can have different enclosing binders on different paths. Direct jumps show a labeled representative path, and links preserve the selected path.

The decoded listing is a compact notation for the kernel graph, not the original tactic script or independently compilable Lean source. Every selected branch can be paged through and downloaded without exponentially unfolding repeated subterms. The type is also shown using Lean's readable pretty-printer output.

All six article proof blocks have correspondence status; five link to supporting compiled proof terms, and the Floquet proof remains unformalized in the published snapshot. All nine numbered results retain their audited partial or unformalized status. **Complete coverage of these project declaration inventories does not mean complete formalization of the article.** Module links identify related proof context rather than certify a sentence-by-sentence translation.

The original [crossing microscope](/projects/proof-atlas/app/) remains a focused 7,288-occurrence example. The separate [language reference](/projects/proof-atlas/grammar/) covers all 12 `Expr`, six `Level` and four `Syntax` constructor tags for Lean 4.33.1, plus curated major surface-language families. Extensible parsers, tactics and macros are not claimed to be an exhaustive registry. External Lean/Mathlib declarations remain explicit named boundaries.

## Public validation

[Compiled packet checks](/research/proof-atlas/compiled-term-checks.json) report the complete public denominators, graph and payload checks, and publication-boundary checks. Browser tests exercise every served packet, contextual binders, decoded terms, article links, responsive layouts, corrupt-packet rejection and scoped automated accessibility checks in both themes. Original extraction logs and private source projects are not part of this release.

Run `python3 research/proof-atlas/verify_proof_library.py` to audit every published packet. The browser regression is `node scripts/test-proof-atlas-library.cjs`. The native exporter and synthetic constructor controls are included as tooling, without project source proofs. Fresh project-source reproduction is not offered by this public release.
