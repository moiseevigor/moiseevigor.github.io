# Paged native type fields: transport experiment

The application readers currently load up to five complete native type graphs before exposing their small field cuts. This experiment separates the existing port metadata from its type graph and reproduces the same cuts through bounded pages. It is a transport component, not yet a replacement for the complete-graph application-window loader.

## Identity and validation

The producer verifies the complete native archive and compiled source packet hashes, then runs the existing native header and application-port validators. It preserves all original graph arrays, node IDs, six component roots, query/input identity and original contexts. A round-trip reconstructs all five arrays from emitted pages and compares them with the original graph.

The graph-table hash uses JSON fields in the fixed order `kind`, `children`, `payloads`, `expanded`, `neededScope`. This normalized table identity is separate from the original native-archive hash. The native owner remains the original archive; no packed page acquires a new kernel observation.

The existing type-page protocol supplies 64-row pages and a bounded index cache. The new metadata record is pinned by the table manifest and descriptor. The runtime checks those hashes and identities, validates its selected address, and checks the selected node's occurrence/scope recurrence. Original source-context metadata is producer-validated here. Independent browser verification against original source paths is still required before replacing the existing reader's source/binder inspection contract. This transport is not an independent proof of membership in the original archive, a new kernel check or a reduction trace.

## Resumable field rule

The synchronous and paged field models share their final scene-construction rule. The paged walker completes one row access at a time and retains only local binder node/depth pairs while traversing. Page eviction does not restart the accumulated route. At the selected root it retains at most four row tuples for rendering. The resulting scene, computed addresses, local/source binder targets and exact retained/hidden counts match the complete-data field model.

The tested runtime uses one page: at most 64 cached type rows, plus two index records and at most four selected-cut row tuples. Metadata is independently capped at 2 MiB; a type page at 1 MiB; a manifest at 256 KiB. Tables retain the existing 65,536-node limit, and encoded occurrence counts have at most 4,096 digits. Paths and local binder stacks retain the earlier 512-field limit. Small graphs can fit completely in one page. These are component bounds, not whole-browser heap measurements. The producer and test harness read complete original archives outside these runtime cache bounds.

## Finite observations

All 877 native inputs in the existing 42-profile inventory round-trip their original graph arrays. The model compares 10,524 root/descendant cut appearances with the complete-data model. The tested cache peaks at 64 rows; 446 ports cause eviction. The largest fetched native page in these tests is 4,069 decoded bytes and the largest metadata record is 173,296 decoded bytes. Those observed sizes do not replace the protocol's larger hard caps.

An authored structural control has 32,770 stored nodes and 513 pages. It traverses a 511-field path with 512 evictions, retains three expression vertices, and also checks the exact local binder at depth 512. This is not a kernel-checked proof or an AI benchmark. Corrupt and missing pages, cancellation, foreign owners/queries and disposed readers have separate refusal checks. Source-only inputs have no native port descriptor.

## Reproduction

```sh
node research/proof-atlas/native-type-paging/check-model.cjs /tmp/native-type-paging.json
node research/proof-atlas/native-type-paging/check-controls.cjs /tmp/native-type-paging-controls.json
node scripts/test-proof-atlas-type-pages.cjs
node research/proof-atlas/type-field-navigation/check-model.cjs /tmp/complete-field-regression.json
# With a production build served locally; Playwright and an installed Chromium:
ATLAS_ORIGIN=http://127.0.0.1:8866 node research/proof-atlas/native-type-paging/check-browser.cjs /tmp/native-type-paging-browser
```

The browser check executes the served runtime in Chromium with compiled data fixtures supplied by the test harness. It does not mount a new proof reader or establish an application memory improvement. No permanent packed corpus is added before integration. The blog is unchanged. The general geometric-language goal remains active.

The [evidence manifest](evidence.json) pins the producer, runtime, inventory and report hashes. Recorded checks: [native model](model-check.json), [structural controls](controls-check.json), [Chromium transport](browser-check.json), [field-model regression](compatibility/field-model.json.gz), [reader/browser regression](compatibility/field-browser.json.gz), and [existing type-page model](compatibility/type-pages-model.json). The reader regression includes 24 field selections, five binder selections and eight accessibility audits. The production build and served runtime bytes match the pinned source; compiled data fixtures are used only for the experimental transport check. No merge or deployment is recorded here.
