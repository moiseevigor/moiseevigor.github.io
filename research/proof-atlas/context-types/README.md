# Context-derived type geometry

The optional **Show context type** control reuses a native checked closed-context judgment at a matching original source route. It uses the same constructor geometry and bounded cuts as recorded types. It remains separate from the reader's existing native exact-occurrence type controls.

## Rule

Each class consists of one original source expression and an ordered retained context. A closed expression drops the unused ambient context; descendants add their own binders. Header identities retain the original constructor, payload, domain, let value and preceding retained headers. Binder bodies are excluded from their own headers. Domains and let values use the pre-binder context; only bodies add a binder.

The extractor closes a representative term with lambdas for assumptions and lets for definitions, and closes its inferred type with matching Pi/let wrappers. New let wrappers use `nondep=false`. Lean checks the term and expected type in an empty local context, and kernel-checks conversion to the expected type. Every retained header and raw type must fit that context. Headers remain exact source references; large let values are not copied into another expression table.

The reader computes a class signature directly from the selected occurrence route, bounded by 512 source ports. It does not build the complete expression/context state index or expand the occurrence tree. A matching source expression and header signature supports context-variable renaming and weakening by an unused prefix. This is an explicitly **derived** target typing judgment, not an invented native query. Native environment, compiled module, packet and evidence hashes qualify the class. Context classes and source occurrences are different identities.

Computed type parents retain computed paths. Ambient type variables link to the selected target's original binders; type-local variables link to their internal type binders. The native representative remains separately reachable. Neither source variable identities/values nor article matches are merged. Type descendants receive no new inferred typing judgment.

## Finite evidence

- Twelve own synthetic declarations supply all 484 source occurrences in their types and bodies, covering 266 expression/context classes.
- The largest proof in the frozen AI-attributed sample supplies 128 predetermined representatives plus 21 predetermined alternate routes. This covers 128 classes, not 149 new classes or the complete AI inventory.
- All 633 selected closed contexts pass native checks. An older occurrence exporter independently agrees on all 633 raw inferred types.
- All 239 additional selected routes receive fresh native checks of the target at the canonical transported type, the applied closure at that type, and `Eq.refl` against the equality of the applied closure and target term. This forces kernel definitional conversion; it does not assert structural identity after reduction.
- The package audit checks 633 bounded cuts, 49 displayed ambient type links, and 69 selected original variable links. Source binder targets remain distinct when patterns match. Browser checks exercise two actual canvas selections under different binders, keyboard context jumps, type-local navigation, unsupported classes, stale/corrupt metadata and four phone/desktop theme/accessibility combinations.

These are finite checks of the implementation. The transport implementation is not a formally proved Lean metatheory, a portable kernel certificate, semantic compression or a comprehension study. The AI sample's generation remains publisher-attributed. Existing primary type records, application traces and article correspondence remain separate evidence.

## Bounds and failures

Native records contain a raw inferred type table of at most 32,768 nodes plus an ordered source-backed context recipe. The first copied closed-type encoding exceeded that limit at one selected large let context. Source-backed wrappers resolve it without increasing the limit. Its raw type has 81 nodes; its nine-entry closure recipe borrows 59,967 distinct source nodes. This avoids duplicate serialization, while the complete source packet remains resident.

One compressed context package is decoded at a time, with an 8 MiB decoded-byte limit and abortable loading/validation. Each provider retains one prepared selection. Type cuts draw at most 32 term vertices with explicit retained/hidden accounting and context boundaries. Full source paging, complete type coverage, other logical abstractions and human proof-inspection benefits remain open.

Optional evidence/module failures leave the original graph and primary native type records available. Missing class matches clear the previous context view and expose no context-type button. A native observation at a target is recorded separately from the derived typing operation.

## Reproduction

```sh
node scripts/test-proof-atlas-context-types.cjs
node scripts/test-proof-atlas-context-type-loading.cjs
python3 research/proof-atlas/context-types/verify_controls.py --lean lean
# After the production Jekyll build, with the existing browser dependencies:
node scripts/test-proof-atlas-context-types-browser.cjs
```

`Controls.lean` is own synthetic source. `ExportClosedContext.lean` is the version-pinned extractor, combined with the existing library and occurrence exporters by `verify_controls.py`. Fresh CI compiles only these own controls and checks all 484 routes. Original AI proof scripts, private research projects and Mathlib are not rebuilt or published by this workflow.

`context-types-manifest.js` pins the compiled packet, native producer/request/output, environment and package hashes. The independent type fixtures contain compiled types only. Control packets add public dependency/inventory metadata without changing any expression constructor, payload, ordered edge, root, scope or expanded count; `nativePacketSha256` retains the original extraction packet identity. `publish.py --evidence <verified-local-experiment>` verifies the saved native evidence before producing this public projection. Raw native logs, temporary paths, original AI scripts and private research source projects are omitted. No blog update accompanies this implementation.
