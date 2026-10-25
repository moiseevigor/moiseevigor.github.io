# Paged source-use geometry

The connected application rule is unchanged. The reader now keeps a cut of at most eight calls without loading a complete connection table. Original expression addresses and native evidence owners remain distinct from delivery-page hashes.

[Local visual experiment](/projects/proof-atlas/manual/paged-network/) · [model and complete-source records (gzip)](/public/data/proof-atlas/network-streaming-audit.json.gz) · [combined evidence (gzip)](/public/data/proof-atlas/network-streaming-evidence.json.gz)

## Cut rule

Every actual input belongs to its consumer call. The retained calls provide all of their function and supplied-argument positions, including source types and instances whose classification may be unavailable. Known source producers determine internal and incoming edges. Each producer has a recorded reverse degree and a contiguous block in the reverse index.

For retained calls S, let E_SS count the internal input uses. Then:

```
incoming = sum of retained calls' known input counts - E_SS
outgoing = sum of retained calls' reverse degrees - E_SS
hidden known = all known - incoming - outgoing - E_SS
```

Visible and hidden unrecorded-producer inputs form two separate classes. These six classes still partition every actual input position. The accounting is about source fields, not necessary premises, disjoint expression regions or a semantic proof order.

The reverse list stores one ordinal for each destination port. To request its kth outgoing crossing edge, the reader selects the kth ordinal outside the retained internal set. That excluded set is bounded by the eight calls' input positions. The reader does not scan the hidden consumer prefix. Eight rows load for the displayed connection page; repeated uses retain distinct destination ports.

## Preserved native observations

All **31 earlier profiles, 162 calls, 787 ports and 101 source connections** remain separately identified. Delivery pages do not become their native evidence owners. The model compares 305 paged cuts against earlier complete scenes, checks all 787 native input selections and 2,361 computed-type contexts, and tests expansion/collapse round trips. Original producer types use the producer context; expected input and result types use the consumer context.

Native input details are loaded on demand through the earlier bounded query-page protocol. Its finite descriptor still has the earlier call/argument bounds. This delivery rule does not extend the per-call native typing inventory. A separate fresh kernel replay checks the larger closed source packet, as described below.

## Larger compiled source case

The independently indexed source packet is `lean_workbook_plus_54159`, from the existing twenty-profile sample attributed by its publisher to `Goedel-LM/Lean-workbook-proofs`. Source index SHA-256:

```
e49aaa58558af0635d5f8128ce9d7c2d718c5fdf495e8af5833457d76c6745b6
```

It has **6,479 stored expression nodes and 997,411 expanded expression occurrences**. The index covers **201,340 maximal raw application spines in both declaration roots**, with **699,453 actual inputs and 201,190 application-to-application source uses**. Intermediate `app.fn` prefixes are retained in source paths rather than counted as separate call boxes. Constant declarations are not recursively expanded into their bodies. The largest supplied spine has seventeen arguments.

The complete source audit reads every indexed call and input, compares its ordered field and local-definition path with the original packet, checks all reverse entries and degrees, and independently enumerates the source in preorder to establish complete maximal-spine coverage. A separate lexical-binder traversal checks 7,835 variable and binding witnesses. No original tactic scripts are read or published.

This is **source-only** coverage. Per-call native types, proof/value/type classifications and binder visibilities are unavailable. They are marked unobserved, and computed-type selection is refused. The closed packet also passes a fresh Lean 4.33.1 replay with its original theorem, original module and every private Riccati module absent. Its expected proposition, proof, type conversion and axiom set pass; unrelated-proof and ill-typed-binder controls are rejected. Cached dependency binaries are hash-verified; the Mathlib revision remains cache attribution rather than an independent dependency rebuild. This replay adds zero per-call type observations. Publisher attribution is retained; AI generation is not independently verified. This does not establish new mathematical results or native type observations for the indexed calls.

The runtime model also checks 207 cuts and 31 source inspections in this larger index. Arithmetic rank/select controls test small domains exhaustively and large numeric domains separately. They are not a massive synthetic Lean proof or a complete high-degree browser benchmark; the largest observed reverse degree in this packet is fourteen.

## Component bounds

- Eight retained call records, with a 4 MiB serialized-row cap and a 256 KiB single-call cap.
- One call leaf with at most four rows, one reverse leaf with at most 32 rows, and two branch records per cursor. Decoded leaves are capped at 2 MiB and branches at 16 KiB.
- A 64 KiB topology header. Rank trees have fanout 32 and at most eight levels.
- Eight displayed connection rows. No accumulated frontier ticket history.
- One selected source/native window. Original source paths retain the earlier 4,096-row / 4 MiB cap and 256-row fetch cache. Native types retain their separate bounded, fully resident graphs and the earlier descriptor cap.

These are logical component bounds, not a total browser-heap measurement. In the finite navigation checks, at most eight call records and 27,276 serialized retained-call bytes were observed. Complete topology, source-packet and native-record archives are blocked in runtime tests. A failed or cancelled query clears its pending state; it does not fall back to a complete archive.

## Remaining representation limit

This producer materializes occurrence-qualified call records. Its storage grows with application occurrences, although the original expression packet shares a much smaller DAG. Paging controls resident working data; it does not solve this storage expansion, parametric scope-aware sharing, whole-proof visual abstraction or comprehension. Larger corpora can still exceed producer, path, type or page bounds and must fail explicitly. No blog publication or public deployment follows from this experiment.

## Reproduce

Use the repository's Node runtime with SQLite support and fresh temporary directories:

```
node research/proof-atlas/network-streaming/build.cjs /absolute/fresh/stage
node scripts/test-proof-atlas-network-source-index.cjs /private/tmp/fresh-source-audit
node scripts/test-proof-atlas-network-streaming.cjs
```

The producer stages calls and reverse edges in SQLite with bounded database and batch caches. The complete source audit uses a separate database and a different source enumeration order. Rebuilding should reproduce the manifest, root hashes and record digests; temporary databases are not part of the website.

The independent packet replay is reproduced with `verify-packet.py --lean /path/to/pinned/lean --cache /path/to/verified/cache --workdir /fresh/verification`. It reads only compiled packet data and authored checking tools.

Build the production site and run `scripts/test-proof-atlas-network-streaming-browser.cjs` with the existing local Chromium/Playwright dependencies. Browser checks pass for all 162 earlier native call selections and 101 source-use selections, eleven larger-packet call selections with disabled type controls, consumer paging, zoom, pan, keyboard access, four desktop/mobile and light/dark accessibility audits, delayed-page refusal, damaged-page refusal and release. Complete topology/source/native archives are blocked. Native, complete-source, runtime, browser and delivered-asset checks remain separate records.

`node scripts/build-proof-atlas-network-streaming-evidence.cjs --check` binds those records, the unchanged earlier evidence, source fingerprints and the reachable delivery closure.
