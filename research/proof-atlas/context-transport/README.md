# Contextual source transport and lambda/type composition

The implementation supplies ordinary expression graphs to the existing scoped geometry. It adds no Lean constructor. A source occurrence keeps its original packet and route; a computed Pi binder has an explicit introduction relation to a source lambda, rather than an invented source occurrence.

`ExportContextTransport.lean` checks an occurrence, its inferred type and the type of that type. Exact source regions from the selected expression, immediate nonbinding children and enclosing binder headers become explicit substitution anchors. Each anchor retains its original context. The target context must extend that context by an exact prefix; capture-avoiding lifting accounts for the extension. Substituting the original anchors must recover the native expressions structurally, including annotations. Templates with substitution slots are not kernel judgments.

`ExportIntroductionTransport.lean` composes a contiguous lambda prefix with its inferred Pi type. Each domain, binder name and visibility must match structurally. Inside the extended context, the native body type must match the Pi body structurally. The browser combines computed Pi nodes, borrowed original domains and the terminal contextual type. Source context and computed type context are related at each checked introduction. Domains remain outside their own binders.

Native declaration typing separately checks conversion with the declaration's written type. The reconstructed inferred type need not have that type's syntax. A root conversion never establishes equality of corresponding descendants.

`ProofAtlasIntroductionTransportPackage/2` interns lexical context prefixes. The reader expands one selected observation and retains one prepared view. Templates, source embeddings, comparisons, virtual descriptors and package decoding have explicit bounds. The complete original term packet still loads in memory; this is not packet paging.

## Reproduce

Run from the repository root with Lean 4.33.1 and Node installed:

```sh
python3 research/proof-atlas/verify_compositional_transport.py --workdir /tmp/AtlasCompositionalTransport
node scripts/test-proof-atlas-compositional-types.cjs
node scripts/test-proof-atlas-composition-loading.cjs
```

Use `--lean /absolute/path/to/lean` to select the pinned compiler. The native suite creates only self-contained controls importing Lean; it does not rebuild a research project or Mathlib. Compiler runs are serialized and retain the existing free-space, memory, time and output bounds. Raw source files and logs stay in the generated work folders. The aggregate `checks.json` identifies those artifacts and their hashes.

For reader checks, build the actual production site and serve `_site_production`:

```sh
docker compose --profile build run --rm build
node scripts/test-proof-atlas-compositional-types-browser.cjs
```

The browser script defaults to `http://127.0.0.1:8833`. `ATLAS_ORIGIN`, `ATLAS_CHROMIUM_PATH` and `ATLAS_SCREENSHOTS` can override the local origin, Chromium executable and output folder. It checks source jumps, keyboard binder correspondence, unchanged source selection during local inspection, four accessibility configurations, stale requests, corrupted metadata and an unavailable optional module.

The nineteen already-published own synthetic packets receive separate immutable type metadata. To reproduce those sidecars, first run `verify_source_references.py` to regenerate its self-contained fixture, then pass its printed folder to:

```sh
python3 research/proof-atlas/extract_reference_introductions.py --folder ABSOLUTE_FIXTURE_FOLDER
node research/proof-atlas/publish_compositional_types.cjs ABSOLUTE_FIXTURE_FOLDER
```

CI also runs `node scripts/check-proof-atlas-native-compositional-types.cjs ABSOLUTE_FIXTURE_FOLDER` to compare every formal field in all 44 released records with the fresh native extraction. Presentation text is counted separately.

The extraction step checks the source and compiled-module hashes before and after importing that existing fixture. It checks every native DAG field against the exact packet. Publishing preserves the original packet files and inventories.

## Finite results and limits

The two native control sets contain twenty declarations and 113 selected queries. They check 108 independent type-root comparisons, 4,541 bounded cuts and 6,974 borrowed-variable binding appearances. Cases include dependent domains, local definitions, captured functions, shadowing, two universe parameters, all four binder visibility kinds and a 64-entry telescope. Two packets have 196,628 and 196,631 stored source nodes; eight-node terminal templates suffice for their composed whole-function types. Large arithmetic annotations and reflexivity fields are scale controls, not difficult theorem-solving benchmarks.

Ambient-context anchors alone fail on those two whole-function types at the template-table bound. The checked introduction composition handles them. Repeated context arrays also exceeded the output-file bound for the complete deep-binder query set. Prefix interning preserves every query and brings that fixture bundle to approximately 6.55 MB. Its largest individual package is approximately 6.45 MB. These are metadata results; they do not establish semantic proof compression or human comprehension.

The released reader examples contain nineteen packages and 44 exact queries, including a representative for every one of their 27 stored lambda nodes. All nineteen complete declared types have a native conversion check; four match the inferred type syntactically. The package audit checks all representative records, their bounded cuts and exact source jumps, and 169 rejected record changes. A stored-node representative does not cover every lexical occurrence context. These selected records do not cover every declaration or occurrence in the fixture module, the research snapshots or the AI-source sample.

An introduction record accepts at most 64 contiguous lambdas. The 65-entry control is explicitly rejected. Source routes and contexts retain their existing bounds; terminal templates can reject other compositions. Longer typed chains, application-stage transport, interleaved large let/function constructions, wider compiled-corpus evaluation, independent standalone replay and source packet paging remain open. The general geometric-language goal remains active.
