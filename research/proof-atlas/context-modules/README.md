# Checked context modules

Status: geometry and inverse-map implementation; reader integration is pending. The deployed source-shape reader remains a distinct syntax layer.

A term's source-variable links do not define its typing interface. For example, a proof hypothesis `h : p` mentions only `h` as a term, while its recorded type requires `p`. A retained let definition can also require an earlier variable through its value. `ProofAtlasDependentInterface/1` begins with the free context slots of the selected term and its recorded type, then closes that set under selected header types and let values. Headers use their pre-binder context. Original order, constructor, visibility, universe namespace and source routes remain attached.

Dependency edges have four distinct roles: term-support, recorded-type-support, binder-type and let-value. Edge access returns at most sixteen edges per page with an exact total. This operation is syntactic. It does not establish logical necessity, new typing or shared typing. Missing or unresolved support is rejected.

## Module rule

The native producer closes a selected term and expected type with an ordered subset of its source context. Assumptions become lambda/Pi pairs; definitions remain lets rebuilt with `nondep=false`. It checks the closed term at the expected type, applies the closure at the original context and kernel-checks conversion to the original selected term using `Eq.refl`.

Two uses share a module only when their closed terms, closed expected types, context-entry counts and let/assumption patterns match exactly within the same source declaration and compiled environment. Every additional use receives native instantiation and conversion checks. Retained definitions are not freely supplied arguments: records distinguish `contextEntryCount`, `argumentCount` and `letSlots`. Original occurrences, actual arguments, binder identities and root observations remain distinct.

The context boundary matters. Closing an entire function, its open body and a more deeply open body can yield identical closed syntax. Different interfaces remain separate modules. This rule does not quotient by arbitrary definitional equality, proof irrelevance, universe renaming or cross-declaration equivalence.

## Geometry and navigation

`ProofAtlasGeometricScene/10` draws the same constructor glyphs, ordered ports, binder links, telescopes and application spines as existing scenes. It has separate `checked-module-term` and `checked-module-type` categories in the `checked-context-module` namespace. A cut has at most 64 vertices and depth six; defaults are 32 vertices and depth three. Retained plus hidden occurrences account for the selected computed subtree. Root typing evidence does not supply inferred judgments for descendants.

`createModule` requires a previously authenticated and validated closed module graph and native provenance. It is a geometry constructor, not a browser kernel. The package hash, producer/request/output hashes, compiled environment and original source hashes qualify the module. A module path is a computed path, never an original source occurrence.

`locate` derives a separate per-use inverse map:

- New lambda/Pi/let wrappers refer to the exact original context header, with the relation `new-wrapper-from-source-header`.
- Header fields map to their original domain/value expressions through context reindexing.
- The term body maps to the selected original term and exact descendant route.
- The expected type body maps to the separately qualified native raw-type graph. It acquires no invented source-proof occurrence.

Computed variable links remain links to computed binders. Following the inverse map must recover the original binding in the selected use, even when source indices or binder targets differ between uses.

## Finite evidence

Fifteen own declarations supply 594 exact native observations, 313 closed modules and 281 additional checked instantiations. Twelve declarations are the existing public closed-context controls. Three additional controls exercise proof reuse across unused binders and preservation of module boundaries. Three proof-valued groups span different source node IDs and old context classes. Three pairs of identical closed term/type syntax retain different context boundaries.

An independent reconstruction of the source term, type and reordered header expressions matches all stored module term/type graphs. Geometry checks cover 5,634 cuts and 6,860 inverse mappings, including 563 original-source variable links and 441 raw-type variable links. Sixty-five geometry/provenance/limit alterations must be rejected. A fresh own-control replay matches all 594 stored entries and rejects 31 deliberately omitted required context entries. These are finite checks, not a proved Lean metatheory, a portable standalone kernel certificate, semantic compression or a comprehension result.

The interface operation is also independently checked on 743 recorded observations: the 594 own observations and 149 existing AI-attributed observations in `lean_workbook_plus_6206`. All 149 AI source/scope-paged interfaces match the full-source reference with a source cache capped at 4,096 tuples and a scope cache capped at sixteen entries. The original context-type package is separately resident. No reduced-context or module typing has been freshly checked for those AI observations. These cache bounds do not describe total browser memory.

## Data and reproduction

`context-modules-manifest.js` pins fifteen compressed compiled-observation packages and three additional compiled source packets. Existing twelve source packets retain their existing hashes. Metadata-only projection of the three new source packets records both their public index hash and original native packet hash; expression constructors, payloads, ordered edges and roots are unchanged. Each package is capped at 8 MiB decoded and each native graph at 32,768 stored nodes. Original research proof scripts, private source projects and raw native logs are excluded. The replay generates only own synthetic fixtures and rebuilds no private project or Mathlib.

```sh
node scripts/test-proof-atlas-dependent-interfaces.cjs
node scripts/test-proof-atlas-context-modules.cjs
python3 research/proof-atlas/context-modules/verify_controls.py --lean lean
```

The reader still needs an authenticated abortable package loader, a checked-module panel using the existing geometry renderer, per-use source navigation, failure/cancellation handling and browser/accessibility verification. The existing computed renderer assumes root zero in two navigation paths; module expected-type roots require preserving the actual component root. No blog update accompanies this implementation.
