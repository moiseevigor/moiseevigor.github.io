# Paged computed-type geometry

Status: experimental producer/cursor and complete-reference evaluation. This
prototype is not wired into the website. The released native-query reader still
loads its shared type graphs completely. No new type archive is published here.

## Representation and scope

A recorded type uses the existing twelve-constructor vocabulary and occurrence
addresses, in the computed-type namespace. Type-local variables point to their
exact internal binder. Ambient variables point to the exact original proof
binder, with local definitions distinguished from assumptions. A descendant of
a recorded type is syntax, not an additional inferred typing judgment.

The type cursor retains the original shared table's node numbers, payloads,
ordered fields, expanded counts and needed-scope values. `ProofAtlasTypePages/1`
uses 64-row immutable pages and a fanout-64 Merkle index. Each asset's descriptor
identifies its decoded byte length and SHA-256. Table/native-archive identities
are separate from transport hashes. An observation retains its exact original
source route, role, context length, component identity and recording query.
The consumer checks the recorded component identity against its root and table.

The producer accepts a sealed case opened by the existing full native/source
validator. `pack.cjs` processes one case at a time. This experiment covers the
format-2 recorded extraction profiles and their supplementary let observations.
Other control profiles and construction-premise component recipes need their
own explicit adapters. They must not be relabelled as supported by name alone.

Source fields use the existing bounded source cursor. The source cursor now
snapshots its input descriptors and exposes an immutable, sealed identity.
Headers and fetched tuples are immutable as well. A matching object supplied by
another caller cannot impersonate that cursor. For each selected observation,
the type cursor resolves the actual original source node and enclosing binder
count. It derives displayed ambient targets from that original source path;
it does not copy the entire Γ into each type point.

## Bounds and traversal

The default type cache retains eight pages, or at most 512 stored type nodes.
The allowed cache range is one to sixteen pages. Four index pages are retained.
A type page is capped at 1 MiB decoded bytes, an index at 16 KiB, a manifest at
256 KiB and an observation at 64 KiB. The original native table's 65,536-node
profile limit remains in force. The manifest has at most seventeen index-size
entries under those bounds. Tables are never renumbered or silently truncated.

The displayed cut retains at most thirteen vertices and depth three, with at
most three vertices in each layer. Source/type paths and displayed Γ references
retain their existing meanings. The same visible recurrence and exact frontier
accounting checks apply. Context references contribute zero to that count.

Path traversal resumes after each individual row access. It retains a current
node and scope counter rather than requiring all ancestor pages to stay
resident. A bound-variable target can be recovered by a second path pass.
Disjoint type and source cursors handle their own faults; a type operation never
holds the source cursor while requesting another source operation. Source/scene
cancellation and disposal remain explicit errors.

`run` supports a small synchronous resident working set. Wrapping an entire cut
in a retry loop is not a general traversal algorithm: an operation can continually
evict a page that its restart needs. The regression control uses a genuine
midpoint-polynomial type cut and a one-page cache. The synchronous cut exhausts
its retry budget; the resumable cursor subsequently produces the identical cut
under the same 64-node cache bound. This is a finite counterexample to that retry
strategy, not a general liveness proof for arbitrary consumers.

Cache sizes count stored table rows and decoded JSON bytes. Scene metadata,
observation metadata, source/index caches, parsing/decompression buffers and
JavaScript objects have separate residency. The cursor can have the complete
table resident when a small table fits inside the fixed cache. It does not request
a complete type/source/native archive. These facts do not establish a bound on
whole-browser heap or RSS.

## Checked finite result

The complete-reference comparison covers all **2,411 recorded positions** in
25 declarations and 32 original type tables. It includes the 108 extra positions
from the seven existing native let supplements. The original snapshots and
publisher-attributed AI provenance are retained; this is not complete occurrence
typing or independently verified generation history.

For each position it compares cuts at three budgets, yielding **7,233 exact
scene comparisons**, plus **1,065 refinements**. Original node numbers, payloads,
roles, type-component identities, original-source and type-local binder links,
layout coordinates, constructor ports and occurrence counts agree with the
complete reader. The comparisons include 216 original-context and 331 type-local
link appearances. These are appearances in overlapping cuts, not new proofs.

The largest table has **13,976 nodes**. The observed type cache maximum is
**512 nodes and 40,495 decoded JSON bytes**. Six tables exceed that node cache
size. No complete source/native archive is requested on the consumer side.
The reference side retains complete inputs to make the comparison; the test
process's total memory is not the cursor cache measurement.

The separate control suite checks modified manifests, observation roots,
component hashes, source identity, altered pages/recurrences, source contexts,
cache eviction, the restart counterexample, immutable nested tuples, descriptor
capture during asynchronous fetch, cancellation and disposal. It currently has
43 refusal controls. Transport mutations and cache controls are not new Lean
typing certificates.

Run from the repository root:

```sh
node scripts/test-proof-atlas-type-pages.cjs
node scripts/test-proof-atlas-type-page-controls.cjs
node scripts/test-proof-atlas-source-page-controls.cjs
node scripts/test-proof-atlas-source-pages.cjs
```

## Trust boundary and remaining integration

The producer validates original complete source/native packages. Merkle hashes
authenticate the transported representation selected by that producer; they do
not independently prove membership in the original native archive or verify its
compiler/module attestation. Original private mathematical module bytes are
neither read nor published. This cursor is not a JavaScript kernel or a formal
proof of native-consumer correctness.

The next step is to connect this cursor to the existing recorded-type renderer
and then replace complete type-table residency in paged native-query delivery.
The renderer must consume bounded scene/payload snapshots, preserve original Γ
jumps and cancel stale source/type selections. Query/table registration and
construction-premise recipes must retain their distinct original provenance.
This experiment does not yet change live loading, frame delivery, article
reading, other proof-rule coverage or measured human inspection performance.
The general geometric-language program remains active. The blog is unchanged.
