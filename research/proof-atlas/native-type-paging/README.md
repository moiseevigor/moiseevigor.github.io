# Paged native type fields: transport experiment

The application readers currently load up to five complete native type graphs before exposing their small field cuts. This experiment separates the existing port metadata from its type graph and reproduces the same cuts through bounded pages. It is a transport component, not yet a replacement for the complete-graph application-window loader.

## Identity and validation

The producer verifies the complete native archive and compiled source packet hashes, then runs the existing native header and application-port validators. It preserves all original graph arrays, node IDs, six component roots, query/input identity and original contexts. A round-trip reconstructs all five arrays from emitted pages and compares them with the original graph.

The graph-table hash uses JSON fields in the fixed order `kind`, `children`, `payloads`, `expanded`, `neededScope`. This normalized table identity is separate from the original native-archive hash. The native owner remains the original archive; no packed page acquires a new kernel observation.

The existing type-page protocol supplies 64-row pages and a bounded index cache. The new metadata record is pinned by the table manifest and descriptor. The runtime checks those hashes and identities, validates its selected address, and checks the selected node's occurrence/scope recurrence. Before exposing a type cut, the runtime now opens the original source-page manifest, walks the consumer and producer application spines, and recomputes contexts, the literal argument position and every local-definition hop. It uses the same extracted source-witness rule as the complete-data port validator. An original-context binder portal can be inspected against those retained paths. This transport is not an independent proof of membership in the original archive, a new kernel check or a reduction trace.

## Resumable field rule

The synchronous and paged field models share their final scene-construction rule. The paged walker completes one row access at a time and retains only local binder node/depth pairs while traversing. Page eviction does not restart the accumulated route. At the selected root it retains at most four row tuples for rendering. The resulting scene, computed addresses, local/source binder targets and exact retained/hidden counts match the complete-data field model.

The tested runtime uses one page: at most 64 cached type rows, plus two index records and at most four selected-cut row tuples. Metadata is independently capped at 2 MiB; a type page at 1 MiB; a manifest at 256 KiB. Tables retain the existing 65,536-node limit, and encoded occurrence counts have at most 4,096 digits. Paths and local binder stacks retain the earlier 512-field limit. Small graphs can fit completely in one page. Source verification separately retains at most 4,096 path rows / 4 MiB of encoded tuples, with a 256-row fetch cache and two source-index records. These are component bounds, not whole-browser heap measurements. The producer and test harness read complete original archives outside these runtime cache bounds.

## Finite observations

All 877 native inputs in the existing 42-profile inventory round-trip their original graph arrays. The model compares 10,524 root/descendant cut appearances with the complete-data model. The tested cache peaks at 64 rows; 461 ports cause eviction. The largest fetched native page in these tests is 4,069 decoded bytes and the largest metadata record is 173,296 decoded bytes. The runtime source check retains at most 87 path rows across this inventory. Those observed sizes do not replace the protocol's larger hard caps.

An authored structural control has 32,770 stored nodes and 513 pages. It traverses a 511-field path with 512 evictions, retains three expression vertices, and also checks the exact local binder at depth 512. This is not a kernel-checked proof or an AI benchmark. Corrupt and missing pages, cancellation, foreign owners/queries and disposed readers have separate refusal checks. Source-only inputs have no native port descriptor.

## Reproduction

```sh
node research/proof-atlas/native-type-paging/check-model.cjs /tmp/native-type-paging.json
node research/proof-atlas/native-type-paging/check-controls.cjs /tmp/native-type-paging-controls.json
node research/proof-atlas/native-type-paging/check-source.cjs /tmp/native-type-source-controls.json
node research/proof-atlas/native-type-paging/check-operations.cjs /tmp/native-type-operation-controls.json
node scripts/test-proof-atlas-type-pages.cjs
node research/proof-atlas/type-field-navigation/check-model.cjs /tmp/complete-field-regression.json
# With a production build served locally; Playwright and an installed Chromium:
ATLAS_ORIGIN=http://127.0.0.1:8866 node research/proof-atlas/native-type-paging/check-browser.cjs /tmp/native-type-paging-browser
```

The browser check executes the served runtime in Chromium with compiled data fixtures supplied by the test harness. It does not mount a new proof reader or establish an application memory improvement. No permanent packed corpus is added before integration. The blog is unchanged. The general geometric-language goal remains active.

The [evidence manifest](evidence.json) pins the producer, runtime, inventory and report hashes. Recorded checks: [native model](model-check.json), [structural controls](controls-check.json), [Chromium transport](browser-check.json), [source-witness refusals](source-witness-controls.json), [operation controls](operation-controls.json), [application-model regression](compatibility/application-model.json.gz), [field-model regression](compatibility/field-model.json.gz), [reader/browser regression](compatibility/field-browser.json.gz), and [existing type-page model](compatibility/type-pages-model.json). The reader regression includes 24 field selections, five binder selections and eight accessibility audits. The production build and served runtime bytes match the pinned source; compiled data fixtures are used only for the experimental transport check. No merge or deployment is recorded here.

## Source-witness boundary

Re-hashed metadata controls preserve valid transport hashes while altering source contexts, producer shape, argument occurrence and definition hops. The runtime must reject these by recomputing the source witness. A separate control supplies a different occurrence of the same stored input node. All 32 source/metadata and reader-ownership refusal controls pass. The model inspects 1,238 original binder portals in root-cut appearances, and Chromium checks 18 original binder portals in its selected four-port fixture. Bounds, corrupt source pages, cancellation and cursor release are tested separately. These checks establish source-path consistency against the pinned source-page protocol. They do not independently prove original native-archive membership or replay native typing.

The production application window still assembles its scene synchronously from complete graphs. Paged comparison, weakening and formal dependencies are now available in the experimental service; connecting them to that scene assembly and its selection lifecycle remains unimplemented. No application memory improvement is claimed.

## Literal type operations

The service now checks six root scopes, callable-root shapes, recorded port attestations and literal producer-type weakening before exposing a reader. Weakening compares the original producer type with its recorded lift into the consumer context. This is a structural check over recorded expressions, not fresh kernel typing or normalization.

`proof-atlas-paged-type-operations.js` implements row-at-a-time structural comparison, weakening and formal-domain reference discovery. Comparison preserves the complete-data model's traversal order, pair counts and exact first difference; a difference beyond the 512-field selection limit remains a proved structural difference with an unavailable navigation witness. The weakening and dependency memo keys include local binder depth. Sharing storage does not erase lexical context.

The primitive walks keep at most two row tuples while awaiting data, separately from their cursor's 64-row page cache. A formal bridge additionally retains one telescope row during its dependency walk. Ordered work records and a bounded memo retain node IDs, depths and predecessor fields, without retaining expression rows. The state budget is at most 262,144 distinct pairs/states; the frontier bound is 524,289 records (arity at most three). Comparison predecessor chains are separately bounded by the processed-state budget. These bounds can be larger than a small complete graph; they are not a claim about total heap reduction. A formal bridge uses a function reader and an argument reader, each with its own source/metadata/type cache; the combined observed type cache peaks at 128 rows.

All 877 native input comparisons match the complete-data model, and all 877 literal weakening checks pass. The 676 recorded argument positions recover the same formal domain and dependency list as the complete-data model, including explicit literal-signature boundaries. An unavailable formal domain remains distinct from an empty dependency list. Source roles and kernel instantiation remain recorded attestations; literal references do not establish mathematical premise necessity.

An authored 33,810-node control uses 529 type pages. It tests a 600-field difference, free-variable lifting, the same node pair at distinct binder depths, formal-reference budgets, alias boundaries, cancellation and a missing row. Its paged operations keep 64 cached rows through 8,577 evictions. It is a structural expression control, not a kernel-checked proof or an AI benchmark. [Operation controls](operation-controls.json).

Complete table validation remains producer-owned. The runtime checks page hashes/local shapes, root scopes, original source witnesses, literal weakening and selected recurrences. It does not independently validate original-archive membership or replay the native typing judgments.
