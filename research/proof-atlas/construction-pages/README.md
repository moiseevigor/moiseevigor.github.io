# Sparse construction geometry

Local prototype. No browser integration or publication assets have been generated.
The default article and the blog are unchanged. The general geometric-language
research program remains active.

The construction reader must retain native premise interfaces without keeping
complete source/native/type graphs in the consumer. This prototype projects the
existing format-2 recorded profiles and let supplements; it adds no native typing
judgments. Other synthetic/control formats and elimination rules need explicit
adapters and remain outside this transport's scope.

## Representation

`pack.cjs` accepts original validated source/record attachments, one case at a
time. It preserves source graph identity, original routes and node numbers,
roles, context lengths, ordered premises, conversion-check results, component
roots and original recording queries. Existing type-page tables remain separate
assets. The complete inputs are producer/reference inputs, never consumer fetches.

An ordinary recorded type and a construction type can have identical syntax but
different origins. The latter uses the original
`ProofAtlasConstructionTypeComponent/1` recipe, including its base recorded type
identity and selected root. Its envelope is explicitly
`ProofAtlasPagedConstructionTypeObservation/1`. The original recorded-observation
API still accepts only `ProofAtlasPagedTypeObservation/1`. Kernel and Meta
argument-type observations retain different recording origins.

`ProofAtlasTypeSyntaxFingerprint/1` hashes constructor kind, canonical payload and
ordered child fingerprints. This is producer-attested syntactic agreement under
SHA-256 collision resistance and the existing payload canonicalizer, not
definitional equality. Original source position, lexical context and role remain
mandatory for construction composition. A different type fingerprint remains an
explicit interface boundary even if its source position and role agree.

The bounded model checks actual source fields, nodes and context lengths through
the existing resumable source cursor. It produces the same selected-root-relative
construction vocabulary, source frontier partition and zero-count external binder
references as the complete reader. It never rebases an original source context.

## Limits

The sparse index has sixteen rows per leaf and thirty-two children per branch.
Each declaration has at most 4,096 recorded positions. A manifest is capped at
256 KiB, an index at 128 KiB and a construction record at 64 KiB. The consumer
retains at most four index pages and eight record pages. Cache limits can be
reduced to one page for eviction tests. The existing format-2 512-binder and
65,536-type-node limits remain explicit.

The selected type cursor is replaced and disposed on each new selection. A
construction cut retains at most thirteen construction nodes, with depth at most
four and at most twenty-seven source frontiers. Its serialized scene remains
under 64 KiB. Producer/reference inputs, in-flight decoded buffers, source/type
caches, index/record caches and JavaScript object overhead are different residency
categories. These bounds do not establish a bound on whole-browser heap or RSS.

## Finite comparison and remaining work

Run `node scripts/test-proof-atlas-construction-pages.cjs` for the finite comparison
with the complete model. The test uses one-page source/type/record/index caches,
compares three cut budgets for every construction, original source routes and
every recorded construction type component, and refuses complete-archive fetches.

The comparison covers 25 profiles, all 2,411 checked positions and 1,066
constructions: 815 applications, 203 introductions and 48 local definitions.
It checks 3,198 construction cuts, 1,345 recorded-only cuts, 25 unrecorded source
cuts, and type selections from 1,066 scene points. All 997 candidate construction
joins agree with the complete model. Direct type comparisons cover 2,411 recorded
types, 1,066 construction conclusions, 2,180 premises and 815 Meta argument
observations. The ordinary observation API refuses all 1,066 tested construction
conclusion envelopes. Observed maxima in this one-page test are 256 source rows,
64 type rows and 7,005 decoded record bytes. These are cache measurements;
the reference process also retains complete validated inputs.

`node scripts/test-proof-atlas-construction-page-controls.cjs` checks 38 refusals,
including re-signed recipe/origin mutations, actual source-field mismatches,
foreign record copies, disposal and cache limits. A separate altered projection
with a mismatched type fingerprint remains an exact source frontier; it is a
synthetic transport control, not a native mathematical counterexample. The
existing recorded-type comparison still passes all 7,233 scenes and 1,065
refinements, with 43 existing rejection controls.

An earlier private experiment incorrectly indexed premise roots in the lookup
entry's type table instead of the construction owner's table. Its claimed 36
refused joins are withdrawn. The corrected model keeps every root paired with its
own original table, including let-supplement tables with different node numbering.

Browser integration, browser failure/cancellation and proof-switch checks,
deterministic public assets and release gates are required before this can replace
the complete construction loader.

Transport hashes authenticate producer-selected projections. They do not prove
independent membership in a native archive, verify private source module bytes,
prove the JavaScript consumer correct, increase inference coverage or establish
semantic compression and human comprehension.
