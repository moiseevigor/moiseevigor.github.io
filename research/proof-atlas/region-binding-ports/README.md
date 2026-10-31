# Binder ports at an expression boundary

The compiled-interface reader now exposes references to enclosing binders for any selected constructor region in its 88 closed components. A dashed wire goes from the selected region to an exact binder occurrence and carries its syntactic multiplicity. Four binders are shown at a time. “Remaining body” focuses the continuation after the primary binder spine; a binder jump keeps a “Return to region” address.

This extends the earlier primary-spine type/value reference inspector to arbitrary descendant expression cuts. It is a lexical boundary, not a closed typed proof module, a minimal premise set, or a comprehension result. Existing whole-root native judgments stay attached to their original records; descendants receive no new typing judgment. The blog is unchanged.

[Inspect compiled proofs](/projects/proof-atlas/manual/binder-blocks/#compiled-definition-boundaries) · [Boundary model](model.cjs) · [Complete-row producer](pack.cjs) · [Producer audit](producer-check.json.gz) · [Paged consumer audit](model-check.json.gz).

## Compositional rule

For a selected occurrence `e` inside its component context, count its de Bruijn references relative to that region. A reference with local index `i` connects to the `i`th enclosing binder, starting with the nearest. The entire occurrence path determines that binder; a stored row and a depth alone do not determine its identity.

Lambda/forall domains and let types/values precede their new binder. Their bodies extend scope. Counts inside a child body shift by one at that boundary. References to binders internal to the selected region stay internal; references to enclosing binders become boundary ports. Universe references, declaration uses and unresolved elaborator objects remain separate relations. These counts include implicit arguments and type annotations and do not infer premise necessity.

The structural counting and protected-subtree laws are retained in [Expr reference laws](../expr-reference-laws/README.md) and [shared rewrites](../scoped-dag-rewrite/README.md). This new delivery layer adds no general theorem about the wire codec or a typed interface for arbitrary graph regions.

## Provenance and coverage

The fixed census contains eleven native cases: seven Riccati plans and four released AI-source plans over two original proof declarations. All eight source/computed components per case are included, not just proof bodies. Original selections retain their existing source packet/path mapping. Computed selections keep their native case, component and exact derived path. The reference coefficients identify the same joint table through its immutable graph-manifest hash.

The producer checks **439,780 stored expression rows and 759,794 nonzero coefficients**. A recursive sparse counter generates the values. A separate postorder recurrence reconstruction checks every serialized row, including counts removed at each binder body. All existing payloads and ordinary constructor navigation remain available.

The consumer audit streams every stored reference row, then checks occurrence-qualified regions and all their port pages across all 88 components. It independently resolves target binder paths against the complete graph and verifies that opening each port reaches the exact address advertised. Weighted top-down counts cross-check selected regions separately from the producer recurrence.

The current model checks 1,832 selected regions and 4,117 target ports, with 108 weighted-oracle comparisons. The production browser census exercises 22 remaining-body regions, 52 port pages and 170 displayed ports across all eleven cases, including binder jumps and return navigation. It also follows two actual Riccati occurrences of the same source row to different binders. These finite path checks do not exhaust every expanded occurrence.

Two inherited native controls exercise the distinction between storage and binding. In the small typed counterexample, the identical addition row occurs in two scopes; its port targets differ. A row-only rewrite cache preserves typing but computes a provably unequal function. In the 107,044-row authored shared program, a selected region represents more than `2^64` occurrences and retains exact boundary counts. This authored stress control is not an AI theorem-solving benchmark; the original AI-source census remains separately attributed.

## Delivery and unavailable states

Reference pages contain 64 rows. Each row stores its internal-reference count and ordered nonzero external coefficients. A manifest binds them to the existing native component table. Content hashes and decoded byte limits are checked before use. The complete support table is never requested by the reader.

The constructor reader and coefficient reader each retain one 64-row page and at most two index pages. A coefficient row has at most 512 entries; displayed binder ports are paged in groups of four. A constructor neighborhood has at most four vertices and the boundary diagram has one region plus four binder vertices. Paths are bounded at 512 fields. Each provider runs one active operation and retains only its latest pending request.

Source/computed addresses, stale controls, superseded navigation, cancellation, release and malformed/missing assets are checked explicitly. An unavailable coefficient record clears the previous boundary; the source fields and native evidence remain separate. Cache/view limits are guarded component bounds, not a theorem about total browser memory.

## Reproduction

```sh
node --max-old-space-size=2048 research/proof-atlas/region-binding-ports/pack.cjs --check
node --max-old-space-size=2048 research/proof-atlas/region-binding-ports/check.cjs --check
# After the production site build, with Playwright/axe-core and ATLAS_ORIGIN:
node research/proof-atlas/region-binding-ports/check-browser.cjs
node research/proof-atlas/region-binding-ports/check-compatibility.cjs
node research/proof-atlas/region-binding-ports/check-production.cjs
node research/proof-atlas/region-binding-ports/evidence.cjs --check
```

Producer and consumer records pin the original compiled inputs and current implementations. Browser records concern the actual generated page. Original private proof scripts are not included.
