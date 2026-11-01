# Inspectable substitution

[Reader](/projects/proof-atlas/manual/substitution/). This is a syntax view of the existing [certified executor](../certified-substitution/README.md), not a new typing rule.

## Visual rule

A source occurrence and result occurrence have the same ordered field path until a replaced bound reference is reached. At source-local binder depth `d`, external index `i-d` selects image `m-1-(i-d)` from the source-ordered map. The result at this boundary is the image shifted by `d`.

Beyond that boundary, a result path splits into the exact source-use prefix and image-local suffix. Image-local binders preserve their references. A loose image reference increases its index by `d`. Source lambda/Pi bodies and let bodies increase source depth; domains and let values do not. Image traversal applies the same rule to its own binders.

The source-use prefix is required. One image may have multiple uses. Selecting an image without an anchor clears the source/result panes instead of choosing a use. Source and computed occurrence identities include input hash, query index, component, image ordinal where applicable and ordered field path. Interned row numbers are shared syntax storage, never occurrence identity.

Each pane shows a root and its immediate ordered fields: at most four vertices, with at most twelve across the operation. Solid branches are constructor fields; dashed portals lead to exact local binder occurrences. A context strip reports the selected occurrence's local binder depth and links its nearest four binders, retaining distinct addresses for shadowed names. For external target-context references the reader reports a relative index and marks the original binder unavailable. Free and metavariable identifiers remain distinct from lexical binder links. Complete constructor payloads retain names, universe levels, metadata and literal fields.

## Coverage and evidence

All **2,835** native queries are included: 1,376 overlapping full/reduced module uses and seven earlier authored cases, their term/type bodies and 51 retained let values; sixteen source/template openings; and two additional authored controls. All six Riccati openings remain separately identified. These cover sixteen preceding source declarations but only one publisher-attributed AI proof. Repeated contexts and term/type views are not independent proofs.

Exact wire interning pools **3,331,136 batch-local rows into 255,233 rows**, without normalizing away payload encodings. The producer checks every decoded input SHA against the existing manifest, every query against its native record and every row's ordered fields, count and scope recurrence. The full input-to-pool mapping is reproduced from the public packet producers; private proof projects and original scripts are not used.

The independent audit checks every reachable stored source/result row-and-depth relation for every query: **2,305,238 substitution states and 193,911 image-renaming states**. It checks all twelve constructors. The selected-cut audit covers **7,410 scenes**, with exact occurrence accounting and independently resolved binder targets. It does not enumerate the potentially exponential set of occurrence paths. All 2,835 query records also load through the bounded hash-checked reader. Refusals test invalid fields, image anchors, paths, counts, wrong image results, unavailable assets, hash tampering and cancellation. A failed page request can be retried.

The shared-row control uses the same stored `bvar 0` externally and below a lambda; only the former is replaced. The open-image control separates an external index changing from one to two from an image-local index staying zero. Its result has exactly `2^92+3` occurrences in 96 reachable rows. It is authored expression data with no asserted mathematical typing, rather than a massive mathematical proof.

The executor's successful-output theorem and earlier native comparisons are reused with their original hashes. Native return proofs were erased, and separate per-input proof terms were not rechecked. The browser checks visible correspondence and transport, not the theorem or kernel. General decoding/visual-compiler refinement, mathematical typing preservation and human-comprehension improvement remain open.

Original owners, source hashes, canonical uses and original context slots remain in the downloaded query record. A normalized source/template value has a distinct address from the original proof AST. The original Riccati context links are explicitly enclosing context; no unsupported descendant mapping is asserted.

## Bounds and reproduction

The browser keeps one 64-row cache, two 64-entry directory pages and one query record. A page is at most 1 MiB decoded, an index 16 KiB and a query 64 KiB. Paths and image maps stop at 512. Reference discovery retains at most 262,144 failed row/depth keys and a 512-frame stack, with an explicit work limit; it never expands the complete occurrence tree. The current cut and path frames retain separate bounded row snapshots. These are retained-data limits, not measured total browser RSS.

From the repository root:

```sh
node research/proof-atlas/substitution-geometry/pack.cjs --check
node research/proof-atlas/substitution-geometry/check.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/substitution-geometry/browser.cjs
node research/proof-atlas/substitution-geometry/check.cjs --integration
```

The packer regenerates upstream public compiled inputs by default, with no Lean project or dependency restore. An existing input directory can be supplied with `--inputs`; its decoded hashes are checked. The finite audit and its producer hashes are in [audit.json.gz](audit.json.gz). The [integration record](integration.json.gz) retains local production-build, link-check and browser results with their producer hashes. Browser checks use both themes, desktop/mobile layouts, keyboard interactions, exact use/image links, saved URLs, request cancellation and error/retry behavior. Screenshots and raw logs remain local. No research blog post is added for this delivery/representation increment.
