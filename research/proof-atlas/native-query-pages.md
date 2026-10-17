# Native query delivery for proof geometry

The compiled library's optional `?loading=paged` view loads source fields and native query records on demand. It uses the existing judgment geometry. Complete source/native loaders remain available in the complete library and article application.

## Contract

An observation can be a direct query or a premise derived from an application, lambda, recursor, beta composition or let definition. Query delivery must preserve the original lookup winner, lexical context, type graph, source route, typing origin and native archive identity. A failed fetch is unavailable evidence, not an unrecorded construction. Source-only fields remain distinct from checked typing premises.

The offline producer opens each original hash-checked package with its existing validator and provider, against the complete immutable source packet. It records the full selected-observation map and own-query map. An index row maps an exact occurrence route to the original native record needed to reconstruct that value. Beta-derived lambda observations can point through a synthetic head; the owning original beta record is retained. Reconstruction reuses the existing provider functions, including the existing precedence among direct and derived observations.

The current inventory has 34 source packets and 48 evidence packages: 25 primary, 15 recursor, one beta and seven bounded-let packages. There are 1,382 original records, 3,188 indexed selected observations and 1,177 own-query lookup values. The own-query method is present for primary/let providers. Other providers keep their existing interface.

## Storage and validation

`NativeQueryPages/1` retains the original source record, edition, provider kind, original descriptor/header, shared type-graph descriptor, query descriptors and the two lookup roots. It also records producer and validator code hashes. A `NativeQueryRecord/1` contains its original native archive SHA-256, original ordinal and complete original entry. Graph arrays stay in a separate immutable type package; their node numbers are unchanged.

Route keys encode the root number and ordered child slots. A sorted Merkle index has at most 64 rows per leaf and 32 children per internal node. Hash-addressed gzip files identify decoded bytes. The consumer checks byte/hash identity, level, ordering and ranges, including when an index is reused from cache. The producer's `--check` mode reconstructs expected assets and compares decoded bytes.

Membership and absence refer to this producer-validated lookup set. Hashes authenticate the transported set; they do not independently prove that a repacking matches an original native archive. Complete offline validation and the complete-reference comparison provide that separate evidence. No additional Lean certificate or browser kernel is claimed.

A cached query is reconstructed with its original header and type graph. Existing validators check source/context attachment and construction metadata before it supplies an observation. The geometry keeps its original `file`, `evidenceSha256`, type-root indices and typing origin. The transport manifest/index hashes are separate from that native provenance.

Prepared caches are keyed by **provider kind, original archive hash and query ordinal**. A control registers one checked beta archive under ordinary-typing and beta-composition providers. Sharing the prepared map by archive/ordinal alone returns a plain head observation where the beta provider has a checked lambda introduction. The kind-qualified cache preserves both interpretations. This is a representation/control result, not a new mathematical theorem.

## Bounds

The current consumer retains at most 128 query records and 16 MiB of their decoded JSON. A single query is capped at 2 MiB. Sixteen index pages are retained; each is capped at 128 KiB. A manifest is capped at 1 MiB, with at most four providers and 512 original records per provider. An operation stops after 512 native page faults. Queries and indexes are loaded through a serialized, cancellable queue.

Shared type graphs still load fully. Each provider has a separate 65,536-node and 16 MiB decoded-byte bound. Headers, prepared observation maps, source pages, scenes and decoding buffers have separate residency. The JSON-cache limit is not a bound on JavaScript heap or browser RSS. Unsupported graphs, records or working sets remain explicit; no complete-package fallback occurs automatically.

The source cursor runs outside the native cursor. A source fault escapes the native operation, loads through the source queue, then retries with already fetched native records retained. Native record validation never starts a second source operation while the outer source queue is held. Proof changes and scene changes cancel the corresponding work; disposed cursors release query caches and type graphs.

## Checks

Run from the repository root:

```
node scripts/build-proof-atlas-native-pages.cjs --check
node scripts/test-proof-atlas-native-page-controls.cjs
node scripts/test-proof-atlas-native-pages.cjs
```

The complete-reference test independently opens all original packages, checks every indexed observation/own-query value and compares complete scenes for all 1,288 finite recorded routes under three priorities, three grouping modes and source fallback on/off: 23,184 scenes. Type-graph contents and per-provider graph identity are checked separately from the remaining entry fields. Lookup candidates also include unrecorded paths. Selected scenes pass the independent source partition/scope audits. Complete source and native archives are forbidden on the paged consumer side.

After the production build, run both `node scripts/test-proof-atlas-source-pages-browser.cjs` and `node scripts/test-proof-atlas-native-pages-browser.cjs`. They check exact scene equality, source refinement/jumps, stale proof/scene cancellation, corrupted evidence, missing optional modules, complete-package request absence, responsive layout and accessibility. Reports are retained in CI.

The initial `SBracket.mk.inj` browser cut has 13 regions retaining 59 construction records. It fetches 65 native records totalling 2,088,296 decoded JSON bytes; its shared type graph has 13,976 nodes and 639,823 decoded bytes. The original evidence package is 28,093,346 decoded bytes. These are this view's serialized working sets, not heap/RSS, minimum-dependency or comprehension measurements. The separate released-AI browser case represents 29,794,821 source body occurrences without fetching its complete source or native archive.

The codec/control suite covers damaged hashes, re-signed invalid records and indexes, source/compiler identity, record/byte eviction, retry exhaustion, cancellation, disposal and provider-interpretation isolation. Synthetic transport mutations are not additional native proof certificates.

## Remaining work

This mode covers the existing finite native-query inventory. Other source-backed type/projection providers and the article application retain their current loaders. Native query coverage remains limited to recorded paths. Shared type-graph paging, larger query inventories, tighter prepared-map accounting and proof-inspection user tasks remain open.
