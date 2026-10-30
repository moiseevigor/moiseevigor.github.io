# Paged native type fields and application windows

The manual and compiled-library application views use bounded type pages by default. The installed index covers 877 recorded inputs at 201 calls across 42 native profiles. The existing renderer keeps the same application scenes and exact source/type selections. The network port inspector now uses the same bounded provider. Its information and field selections are asynchronous; controls retain their original source/type addresses and reject retired selections.

The general geometric-language goal remains active. This package changes representation and delivery; it does not establish semantic compression or improved human comprehension. The blog is unchanged. No site deployment is recorded here.

## Identity and validation

The producer verifies the original native archive and compiled source packet hashes, then runs the existing header, source-witness and application-port validators. Every emitted table reconstructs all five original arrays, preserving node IDs and six component roots. Only compiled term/type records and existing native attestations are installed; original Lean/tactic source scripts are excluded.

The table hash uses JSON fields in the order `kind`, `children`, `payloads`, `expanded`, `neededScope`. This normalized table identity is separate from the original native-archive hash. Computed addresses retain the original native owner, source index, query, input slot, component and ordered route. A stored node ID alone does not identify an occurrence or its lexical context.

Before exposing a port, the runtime recomputes its consumer/producer paths, original contexts, literal argument position and definition hops through source pages. Only `producerType` uses the original producer context; lifted, expected and normalized types use the consumer context. It checks recorded port attestations, six root scopes, callable-root shapes and literal producer-type weakening. Selected cuts additionally check visible occurrence/scope recurrences.

Complete native-table validation and typing remain producer attestations. The browser does not independently prove original-archive membership, replay kernel typing or infer new typing judgments for descendants. Source roles, literal references and recorded conversion are distinct from mathematical premise necessity or recovered tactics.

## Index and scene rules

Lookup reads a catalog, one exact native profile and one exact call. The catalog identifies profiles by original owner and full source identity. A profile lists at most 128 recorded call routes; a call supplies at most 65 ordered port descriptors. The reader selects the function and up to four arguments. Missing, foreign or corrupt indexes/pages leave this interface unavailable, without loading legacy port files as a fallback. The surrounding source reader is preserved.

`openWindow` assembles scenes through paged comparison, weakening and formal-domain reference discovery. Complete-data and paged producers share presentation assembly; that assembly is not itself a validator. Every scene address comes from a recorded root, located comparison endpoint or checked formal-domain route. The renderer accepts asynchronous information/cuts, snapshots selections and checks window/selection generations before installing their results.

The four-vertex field rule preserves ordered constructor fields, lexical binder targets and exact retained/hidden counts. Row reads finish independently, so eviction does not restart an accumulated route. A difference beyond the 512-field selection limit remains a structural difference with an unavailable navigation witness.

Weakening and dependency memo keys include binder depth. Authored controls demonstrate that one shared node pair can compare differently at different depths, and one stored variable can refer to different formal parameters. A missing literal function-type prefix, exhausted work budget and empty dependency list remain distinct outcomes. Budget exhaustion never establishes equality or absent references.

## Component bounds

| Component | Bound |
|---|---|
| Type table | 65,536 nodes; occurrence counts at most 4,096 digits |
| Type cursor | One 64-row page and two index records |
| Retained field cut | At most four row tuples; 512-field route/local-binder limit |
| Primitive type walk | At most two row tuples; 262,144 memo states/pairs; 524,289 frontier records |
| Formal bridge | Function and argument readers; one additional retained telescope row |
| Port metadata | 2 MiB decoded JSON |
| Port source paths | 4,096 retained rows / 4 MiB encoded tuples; 256-row fetch cache; two index records |
| Application window | At most five port readers: 320 cached type rows, 1,280 cached source rows, 20,480 retained source rows / 20 MiB encoded tuples, 10 MiB metadata |
| Index lookup | Catalog 128 KiB; profile 256 KiB; call 256 KiB; total 640 KiB decoded JSON |

Type pages have a 1 MiB decoded cap and type manifests a 256 KiB cap. Comparison predecessors retain node IDs, depths and fields, not ancestor expression rows. Their chains are bounded by processed states. Small graphs can fit entirely in one page. Work metadata can exceed a small complete graph's size; these are component bounds, not total browser-heap measurements. Producers and baseline harnesses retain complete original data separately.

## Checked observations

The [application checkpoint](evidence.json) pins its source, inventory, report and production-build hashes at the earlier application-view revision. The [network extension](network-evidence.json) records the current inspector and downstream checks; historical checkpoint bytes are retained. The [publication inventory](publication.json.gz) lists 8,969 immutable assets occupying 7,143,999 compressed bytes. Existing hash-addressed assets are verified without replacement.

| Check | Observation and scope |
|---|---|
| [Native port model](model-check.json) | All 877 arrays round-trip; 10,524 sampled root/descendant cut appearances match complete data. All 877 type comparisons and 676 formal bridges match; all recorded weakenings pass. |
| [Window model](window-model.json.gz) | All 246 windows at 201 calls match the pre-refactor implementation at commit `fe6057ade17bf6040d5975dd4f2e46920bf44be2`; 3,173 computed selections/cuts and 2,981 source selections, including binding hops, are checked. |
| [Installed-index model](installed-index.json) | All 246 installed scenes match; fourteen refusal controls cover owners, occurrences, bounds, missing/corrupt assets and cancellation. Maximum decoded index lookup is 70,962 bytes. |
| [Default browser](default-browser.json) | Normal controls, without a provider override: 207 paged windows, 115 library producer jumps, 45 argument-page transitions, exact selections, stale responses, corruption and component failure. No legacy port or whole-source archive requests. Four accessibility audits. |
| [Field/browser regression](compatibility/field-browser.json.gz) | Twenty-four field selections, five binder selections, source preservation, optional-component boundaries and eight accessibility audits. |
| [Source/metadata controls](source-witness-controls.json) | Thirty-two refusal/release controls, including re-hashed false source metadata, same-node/different-occurrence input, false weakening, foreign call readers and forged formal dependencies. |
| [Structural paging control](controls-check.json) | Authored 32,770-node graph, 513 pages, 511-field path and exact local binder at depth 512, with 512 evictions. |
| [Operation controls](operation-controls.json) | Authored 33,810-node graph over 529 pages; a 600-field difference, depth-sensitive sharing, lifting, budgets, alias boundaries, cancellation and a missing row. Cache remains at 64 rows through 8,577 evictions. |

Observed window peaks are 320 cached type rows, 1,280 cached source rows, 367 retained source rows and 458,732 metadata bytes. These finite inventory checks are not all applications in every source proof. Structural controls are not kernel-checked proofs or AI benchmarks.

The earlier [aggregate application gate](aggregate-check.json) passed at its pinned revision: unit observations, fifteen fingerprint-checked browser records and thirteen immutable checkpoints were consistent. Historical checkpoint bytes are not rewritten. Earlier primitive/window fixture browser records remain available and are identified separately in the evidence manifest; the default-browser record above is the installed transport check.

## Reproduction

Run from the repository root, with the baseline Git object available:

```sh
node research/proof-atlas/native-type-paging/publish.cjs --check
node research/proof-atlas/native-type-paging/check-installed.cjs /tmp/installed-type-index.json
node research/proof-atlas/native-type-paging/check-model.cjs /tmp/native-type-model.json
node research/proof-atlas/native-type-paging/check-windows.cjs /tmp/native-type-windows.json
node research/proof-atlas/native-type-paging/check-source.cjs /tmp/native-type-source-controls.json
node research/proof-atlas/native-type-paging/check-controls.cjs /tmp/native-type-controls.json
node research/proof-atlas/native-type-paging/check-operations.cjs /tmp/native-type-operations.json
ATLAS_APPLICATION_PORT_CHECK=1 node scripts/test-proof-atlas-application-ports.cjs
node scripts/build-proof-atlas-application-ports-evidence.cjs --check
# With a production build served locally, Playwright and Chromium installed:
ATLAS_ORIGIN=http://127.0.0.1:8866 node scripts/test-proof-atlas-application-ports-browser.cjs
```

## Network inspector extension

The inspector reads installed catalog/profile/call indexes and bounded source/type pages. It no longer opens complete native graphs. Both native and source-only `info` operations return promises; native `neighborhood` operations return promises. The network view, retained-boundary ledger and rule-support reader await these operations. Source-only inputs remain untyped. Cancellation and selection generations prevent old responses or detached controls from changing a newer selection.

[Current checks](network-evidence.json) pin the inspector, provider, consumers, HTML and reports. The network model checks 787 inputs across 31 network profiles, 2,361 computed contexts and 31 source-only inspections. Its observed peaks are 319 cached type rows, 1,280 cached source rows and 70,962 decoded index bytes. The field model checks all 877 recorded inputs across 42 profiles and 8,962 root/child cuts, including lexical binder destinations. These observations concern the finite installed inventory, not all Lean proofs or total browser memory. Browser records cover exact port/type selections, source-only boundaries, keyboard navigation, optional field-view failure, stale/corrupt native type loads and responsive light/dark accessibility.

```sh
ATLAS_NETWORK_STREAM_AUDIT=/tmp/atlas-network-model.json node scripts/test-proof-atlas-network-streaming.cjs
node research/proof-atlas/type-field-navigation/check-model.cjs /tmp/atlas-network-fields.json
# After the production build and the recorded browser/model executions:
node research/proof-atlas/native-type-paging/check-network-evidence.cjs --check
```

No blog post, merge or deployment is part of this extension.
