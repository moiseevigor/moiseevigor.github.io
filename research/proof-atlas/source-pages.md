# Bounded source paging for proof geometry

The optional compiled-library mode `?loading=paged` uses the existing occurrence-based judgment geometry. It fetches source fields through immutable pages rather than loading a complete `ExprDAG/1` packet. The complete library and article reader keep their existing loading paths.

## Representation

The offline producer first checks the original packet hash and validates the complete DAG with `ProofAtlasLibraryData.validateIndex`. It preserves the declaration, roots and other header fields. Each source tuple retains `kind`, ordered `children`, `payloads`, exact `expanded` count and `neededScope`.

`ProofAtlasSourcePages/1` anchors the original packet/source hashes, normalized validated-source hash, producer hash and validator hash. A page contains at most 256 original tuples. A fanout-64 Merkle index addresses pages by their decoded SHA-256 hashes. Page hashes include the original packet identity and starting node number. Manifests and indexes use gzip transport; their addresses identify decoded bytes. The producer's `--check` mode reconstructs every expected output and compares its decoded bytes with the committed assets.

The consumer checks the manifest identity and bounds, each fetched index's hash and range, and each leaf's hash, identity and local tuple shape. This is not an independent client validation of every unfetched edge/count. Complete DAG validation is an offline producer attestation tied to the original packet; it is not a new Lean certificate.

Five sparse array interfaces expose the original fields without complete backing arrays. A missing page suspends an operation; the cursor loads it and replays the operation. Operations are serialized, must tolerate replay, and stop after 64 attempts. Proof and scene cancellation prevent stale publication. Each cursor retains at most sixteen source pages (4,096 tuples) and four index pages. Decoding has additional bounded temporary buffers; the tuple-cache bound is not a whole-process memory bound. Manifest/header and native evidence have separate residency.

## Composition with geometry

`ProofAtlasJudgmentScene/7` adds an explicit source-only fallback. Missing native construction records expose literal kernel child fields, retaining the original routes and syntactic scope extension. Lambda/Pi bodies and let bodies extend the context; binder domains and let values do not. A dashed source layout does not infer an introduction, application role or child type. An independently recorded observation at a child keeps its own evidence. Source-field edges are distinct from recorded typing-premise edges.

Checked introduction/context frames still require individual native construction records. Source-only binders cannot enter those frames. Native rule ports, exact hidden-occurrence accounting and lexical binder targets retain the existing contracts. Turning the fallback off preserves earlier scene formats and behavior.

The optional library mode supports the finite 34-packet native-query inventory: four published research declarations, one working-snapshot declaration, twenty released AI-source declarations and nine synthetic recursion controls. The source contains 395,902 stored nodes in 1,567 pages. Every stored field can be fetched; construction evidence remains limited to the recorded native queries. The rest of the library, contextual transport examples and article application are not paged by this change.

## Reproduction

Run from the repository root:

```
node scripts/build-proof-atlas-source-pages.cjs --check
node scripts/test-proof-atlas-source-page-controls.cjs
node scripts/test-proof-atlas-source-pages.cjs
```

The complete-reference comparison checks all 1,979,510 source field values and 23,184 complete scenes: 1,288 recorded routes, three priorities, three grouping modes, and fallback on/off. Source and native evidence are opened independently on the paged and reference sides. Selected fallback cuts additionally pass the independent original-source partition/scope audits. Shared source regions are not expanded into occurrence trees.

After the production build, run `node scripts/test-proof-atlas-source-pages-browser.cjs`. It checks a live scene against the complete reference, source-field refinement, exact source navigation, asynchronous control changes, stale proof cancellation, damaged assets and explicit resource/coverage boundaries. It records requests to reject complete source downloads, and audits desktop/phone layouts in both themes. The released AI-source test body represents 29,794,821 expanded occurrences; this is a representation scale case, not a theorem-solving or human-comprehension result.

The codec controls cover corruption, re-signed invalid shapes, decoded-byte limits, eviction, serialization, cancellation, disposal and retry exhaustion. Separate synthetic source-only scenes exercise all twelve constructors and shared variables under different binders. These structural fixtures are not additional native Lean certificates. CI retains the finite-corpus and codec reports as artifacts.

## Remaining limits

Native type packages still load in full. Very scattered source working sets can exceed the cache/retry bound and remain explicitly unavailable in paged mode; the complete-view link is an explicit user action. No automatic full-source fallback occurs. This does not establish a bound for all browser memory, semantic compression, complete all-context typing, reconstruction of tactic histories or improved human comprehension.
