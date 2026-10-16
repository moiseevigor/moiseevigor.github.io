# Source-backed application types

For an exact compiled application, preserve the function, argument and applied result as separate original occurrences. Lean checks the function against a normalized `Π (x : A), B`, the argument against `A`, and the result against `B[a/x]`. These conversions concern complete native types; they do not identify their descendants.

`ProofAtlasApplicationTransport/1` uses small templates borrowing exact contextual source regions. Each template must reconstruct its native expression structurally. The browser independently checks capture-avoiding substitution, source ports and lexical binding. Computed parents use the `application-transport` namespace; borrowed regions alone receive original source links. Templates introduce no kernel constructor or standalone typing judgment.

## Evaluation

| Check | Own controls | Published AI-attributed sample |
|---|---:|---:|
| Input declarations | 7 | 20 |
| Declarations with an application query | 7 | 19 |
| Exact queries | 7 | 36 |
| Independently checked substitutions | 12 | 146 |
| Independent native type-root comparisons | 73 | 948 |
| Bounded type cuts | 93 | 984 |
| Borrowed-variable binding links | 45 | 305 |

The sample includes **all 36 checked application queries in the frozen 175-query primary inventory**. `lean_workbook_plus_54159` has no such query. This is finite query coverage, not all applications or lexical contexts. Dataset: `Goedel-LM/Lean-workbook-proofs`, revision `b731852af8d8ab11498fda27bce9020738c01c59`. AI attribution comes from the publisher; original model generation was not reproduced.

The previous native records independently supply the types for all 146 sample stages. The public audit checks 4,686 source-jump appearances and rejects 396 changed application records plus 114 changed package records. Metadata pin the source packet, source and compiled modules, compiler, producer, request, native extraction batch and dependency revisions. Only compiled metadata are added; original proof scripts and private research sources are not republished.

Seven core-only controls exercise dependent arguments, implicit universes, a captured predicate, let scope, an unused proof argument, a function-valued result and a large reflexivity type. The large control contains 196,623 stored source nodes; its result type represents 786,439 expanded occurrences through twenty template nodes. The ordinary materialized query is unavailable; a direct builder invocation separately reproduces `Type DAG exceeds 8192`. This is a synthetic data/reflexivity counterexample to a representation bound, not difficult theorem solving or a measured AI performance advantage.

## Reader and limits

The existing library's type controls use the transport on indexed applications. No extra page or toggle is introduced. Function, normalized Pi, actual argument type, expected domain, inferred result and substituted result remain selectable. Borrowed regions and enclosing binders return to exact source paths. Computed inspection preserves the selected proof occurrence. Missing or corrupt optional metadata leave previous source and type records available.

One prepared application record is retained at rest; optional decoding and preparation are serialized. An existing view and incoming preparation can coexist during a transition. Complete source packets and each decoded query package still load in memory. This is neither whole-proof paging nor a portable kernel certificate. Introduction paging and application transport are separately checked components; their whole-proof composition remains open.

Bounds include 128 stages, 256 anchors, 32,768 template nodes, context/route depth 512, 65,536 virtual descriptors and bounded comparison work. Decoded optional packages are capped at 16 MiB. Unrecorded contexts, semantic compression and human comprehension retain separate evaluation requirements.

## Reproduction

```sh
node scripts/test-proof-atlas-application-types.cjs
node scripts/test-proof-atlas-application-type-loading.cjs
node scripts/test-proof-atlas-application-types-browser.cjs
python3 research/proof-atlas/application-transport/verify_controls.py
```

Browser checks require the production site served on loopback port 8833, Chromium and axe-core. They exercise all 36 published queries, exact keyboard source jumps, stage/component changes, desktop/phone accessibility in both themes, cancellation and corrupt/missing metadata. Native controls require Lean 4.33.1 and Node. They compile only the generated self-contained module under the existing 8 GiB / 120-second / 64 MiB native bounds and 30 GiB reserve; no Mathlib or private research project is rebuilt.

`publish.cjs FOLDER` consumes preserved native extraction files (`applications.json`, `result.json`) and matches the already published sample. It writes compiled packages and their manifest; it does not read or publish original proof scripts or logs.
