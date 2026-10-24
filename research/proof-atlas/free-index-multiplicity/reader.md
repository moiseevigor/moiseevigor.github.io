# Candidate syntax-count annotations

The existing occurrence reader can show **Syntax use counts** in source cuts
and in typed introduction/local-definition interfaces. The layer is optional;
`counts=syntax` retains that presentation choice in the occurrence URL. It adds
one annotation to each retained source binder. There is no additional proof
viewer or article-specific diagram.

The label reports expanded syntactic occurrences of the binder in its original
body. A `forallE` is still a source type binder, not a proof introduction. The
annotation keeps the packet hash, original binder route, original body field,
algorithm identifier, implementation hash and resource units. **Count
provenance** exposes those fields. The graph scene, source partition, binding
links and recorded native judgments remain unchanged. The annotation contributes
zero source occurrences.

Recorded typed-use counts stay separate. While the new layer is enabled, the
existing variable-use panel shows its recorded count beside the new syntax
annotation. Turning the layer off restores its previous scalar count display,
including that method's seven unavailable counts. The two methods do not reuse
the same state/resource field. A failed or missing new count is marked
unavailable; it is never zero and does not assign a type.

## Coverage and data

`build-proof-atlas-syntax-counts.cjs` reads the public compiled indexes only. Its
current delivery has 44,887 stored-binder rows across 2,118 library/AI packets:
the existing 2,098 library packets and twenty publisher-attributed AI packets.
There are no unavailable rows in this frozen delivery. Owned calibration
profiles remain reference tests and are not added to this public catalogue.
This counts binder syntax; it is not complete Lean surface/tactic coverage.

The metadata are available for both source loading modes. **Source paging is a
separate, inherited boundary:** the existing source-page inventory has 35
profiles. Other declarations use the complete source reader. The count layer
does not silently load a complete source archive when paged source is missing.
A complete reader keeps its source packet resident under its existing bounds;
a count query itself loads only count metadata. Missing native type profiles do
not prevent source-syntax annotations.

Each count manifest is at most 64 KiB and names at most 256 ordered pages.
A page has at most 128 rows and 64 KiB; one numeric count has at most 16,384
digits. The producer refuses oversized rows/manifests instead of truncating
counts. The consumer keeps one page, serializes
reads and accepts at most 64 pending requests. Disposal releases its cache and
refuses pending work. A page is bound to the compiled index hash and verified
against its expected decoded size/hash before use. A selected source point must
match the original constructor and body node/port. Counts cannot exceed the
body's expanded occurrence count. Inputs needed after an asynchronous read are
copied first.

The global catalogue is separately resident (1,004,633 bytes in this snapshot).
All 4,232 immutable compressed assets total 2,021,044 bytes; they are not loaded
together by the reader. The observed largest resident count page was 9,717
bytes. These are count-transport units, not total browser or source-table RAM.
The coefficient-table limits in the manifest describe the offline computation,
including its scratch vector and retained outputs. They are not scalar states.

The publisher retains existing compressed bytes and authenticates canonical
decoded metadata, avoiding dependence on a platform's gzip encoding. Existing
source/type/variable-use archives are unchanged. The package contains no
original private mathematical source or raw private verification log.

## Checks

```sh
node scripts/build-proof-atlas-syntax-counts.cjs
node scripts/test-proof-atlas-syntax-counts.cjs
node scripts/test-proof-atlas-syntax-count-coverage.cjs
```

The consumer audit compares every delivered row against the separately checked
multiplicity engine, attaches all 44,887 rows to actual original binder routes
and verifies unchanged source scenes. It also checks source/body/hash/method
and resource refusals, the pending-request bound, input mutation and disposal.
A separate bridge checks the sparse native-use catalogue against these syntax
counts: 152 source uses, 304 observations and 113 original binder routes. In
103 of those routes the syntactic count exceeds the recorded-use count. The
cached Linux Node 22 runtime passes the publisher and consumer checks.

After the normal production site build, run
`node scripts/test-proof-atlas-syntax-counts-browser.cjs` with the existing
`ATLAS_ORIGIN` and Playwright/axe environment. Its complete scope includes all
269 public mixed-frame starts, original route/body/count comparisons, source
and dedicated definition views, source forall binders, a declaration without a
native type profile, all seven prior scalar refusals, the unsupported paged
boundary, sharing changes, recorded-use compatibility, accessibility and
failure/retirement controls. The optional `ATLAS_SYNTAX_COUNTS_FOCUSED=1` run has
`fullCorpus: false` and is not a substitute for that corpus audit. Inspect the
emitted report to establish a pass.

Source sharing and compression, general kernel correctness, semantic
necessity and measured proof comprehension are separate questions. This is a
candidate integration; public deployment requires its own merge, Pages and
hosted-interaction checks. The general research goal remains active, and the
blog is unchanged.
