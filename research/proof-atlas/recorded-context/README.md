# Existing native records in occurrence windows

The packed occurrence reader can attach the existing `ProofAtlasOccurrenceTypes/1` and `/2` extraction records at exact source routes. This bridge does not extract new judgments or change the published term/type data. The nine core-only controls retain their separate profile and provenance.

The current input inventory has five project declarations and twenty publisher-attributed AI-source declarations: 1,129 checked primary queries and 1,174 explicit application/introduction observations, or 2,303 typed occurrence routes. These are selected positions, not complete type coverage of the declarations. A missing route remains without a recorded type. A record marked unavailable remains unavailable unless the existing observation index has a separate explicit checked observation at that exact route.

## Identity and binding

A separate bounded byte decoder leaves the historical, hash-pinned JSON loader unchanged. The bridge hashes the original decoded packet and evidence bytes, rather than a reserialized JSON object. It snapshots those bytes and descriptor fields before asynchronous hashing. The existing profile validator checks the compiler/environment attestations, packet identity, query contexts, argument order, introduction scope, packing and type table. The browser does not rerun Lean or independently inspect private source module bytes. The producer's module-hash attestation and the browser's byte-verification scope remain separate fields.

`ProofAtlasDeepTypingAttachment/2` preserves:

- the original source packet hash and packed occurrence route;
- the extraction evidence hash and original environment/publisher provenance;
- primary-query versus application/introduction-observation origin, including the parent recording query and its part/stage;
- the canonical shared-type-table hash and selected table root;
- a separate component-identity hash, derived from the evidence hash, table hash and root. This is not presented as a file or type-table hash;
- the exact ordered source context, accessible through `contextAt` without copying source path prefixes into every displayed link.

Each declaration's shared type arrays are validated and stored once. Component roots share those immutable arrays. A computed type occurrence is in a separate namespace. Type-local bound variables link to their internal binder; ambient variables link to the exact original source binder. Navigating within a type does not change the original source selection or its URL. A type descendant has no additional typing judgment merely because its enclosing type has one.

The known shared source node 17 in `JacobiCore.E_pos` has a value use and a proof use under different contexts. The bridge retains the distinct routes, roles, type roots and binder links. Node number alone does not identify a contextual judgment.

## Bounds and interaction

Each decoded input is capped at 64 MiB. This reader profile accepts at most 262,144 stored source nodes, 512 enclosing binders per extraction record and 4,096 recorded positions per declaration. The existing extraction validator bounds a shared type table at 65,536 nodes. Displayed type cuts use at most 13 vertices and depth three; original context boundaries lie outside the subtree count. These are finite working bounds, not an arbitrary-proof or total browser-memory guarantee. Complete source packets and the selected shared type table still load in full. The paged source reader is a separate profile.

The recorded-position list renders at most twenty buttons at once, with filtering and pagination. No indexed position is silently dropped. Observation links return to the query that recorded the observation. Unrecorded source nodes, unavailable optional data and corrupt records preserve source navigation; there is no fallback from a real project proof to a synthetic control's typing claim.

## Checks

Run from the repository root:

```
node scripts/test-proof-atlas-library-bytes.cjs
node scripts/test-proof-atlas-recorded-context.cjs
node scripts/test-proof-atlas-deep-context.cjs
```

After building the production site and serving it locally, set `ATLAS_ORIGIN` and run:

```
node scripts/test-proof-atlas-recorded-context-browser.cjs
node scripts/test-proof-atlas-deep-context-browser.cjs
node scripts/test-proof-atlas-occurrence-window-browser.cjs
```

The model audit covers all 2,303 recorded routes and 13,154 bounded type cuts. It independently walks constructor fields and lexical scope, checks retained/hidden accounting, checks that component arrays share storage, and rejects altered source/type/context/environment inputs. It also checks immutable input capture and explicit unavailable-query behavior. The browser audit samples every declaration and exercises primary and observation selections, return-to-query links, original-context and type-local binder jumps, a source-node click, shared-node roles, pagination, unsupported positions, delayed/corrupt/missing data and accessibility in both themes and viewport sizes. These checks are correspondence and rendering evidence; they are not new kernel checks, a verified JavaScript kernel, semantic proof comprehension or a population-level AI evaluation.
