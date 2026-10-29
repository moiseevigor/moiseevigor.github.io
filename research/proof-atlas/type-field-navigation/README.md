# Fields and binding inside recorded types

Selecting a type root or mismatch endpoint in the application readers previously showed a short expression description and its address. The same selection now exposes its immediate ordered fields, parent and component root. A bound-variable portal opens either an enclosing computed type binder or the exact original proof binder. The existing proof selection stays unchanged during computed navigation. An explicit original-context jump can navigate the proof explorer to that binder.

## Visual rule and identity

Use the existing kernel constructor vocabulary and glyphs from `proof-atlas-geometry-core.js`. A cut contains the selected expression and each immediate child: at most four expression vertices because the largest Expr constructor has three fields. Each child remains a separate occurrence, even when multiple fields point to the same stored DAG node. Solid field labels retain their original order. Dashed binder portals are references outside the expression count.

Every computed selection preserves the native evidence owner, source index, original query, input position, component, component root and ordered path. The shared application-page provider validates that address before either reader presents the cut. Parent and component-root navigation stay in the same component. Original producer types use the producer's source context; other recorded components use the consumer's source context.

The lexical rule follows the path from the recorded component root. Lambda and Pi bodies extend the local stack; their domains do not. Let bodies extend it; declared types and values do not. A de Bruijn index below the local stack size targets that exact computed binder occurrence. Other indices target the corresponding original source-context binder. Equal binder names and shared node IDs do not determine either relation. The local stack stores node/depth pairs; qualified routes are materialized only for displayed targets.

For one selected occurrence with immediate children cᵢ, the unfurled occurrence count is 1 + Σ expanded(cᵢ). The displayed cut retains one occurrence for the parent and one for each displayed child; the remaining descendants are hidden. Repeated shared children contribute separately. Binder portals contribute zero expression occurrences. Navigation reads the already validated native type graph and does not expand its occurrence tree.

These are structural views of recorded types. Neither a child nor a referenced computed binder receives an extra inferred type, conversion, source occurrence or proof-step interpretation. This is not a kernel reduction trace, a closed proof module or a minimal-premise analysis.

## Bounds and unavailable cases

- At most four expression vertices, with a 1,024-code-unit summary per vertex.
- At most 512 path fields and 512 local binder records. Original source contexts retain their existing 512-binder limit.
- At path depth 512, child fields remain explicit unopened regions with exact occurrence counts. Their selectable addresses are unavailable; parent and component-root navigation remain available.
- Source-only application inputs have no computed type view. Unresolved `fvar` and `mvar` expressions remain outside the native type-export contract; this rule does not invent their contexts.
- The existing native window still loads at most five complete computed graphs, each within its earlier 65,536-node/8-MiB bound. These are component bounds, not a total browser-heap measurement or paged native-type delivery.

Both the network reader and individual application reader use the same field/binder component. The compiled proof library embeds the individual reader. Missing optional components preserve the earlier expression/provenance controls. Replacing a selection or application window discards the old cut; old controls cannot redirect the replacement selection.

## Finite checks

The model checker resolves all six recorded type components at each of 877 native inputs in 42 profiles, plus mismatch endpoints and representative variable paths. This produces 8,962 checked cut appearances, not 8,962 distinct proofs or all occurrence paths. It verifies 6,216 child selections and independently resolves 800 type-local and 3,980 original-context binder references. Counts include repeated appearances. Each advertised target is resolved through the actual provider.

Seven constructor kinds occur in those sampled native cuts: Pi, application, bound variable, sort, lambda, constant and metadata. Ten authored structural controls cover every constructor admitted by the native type-graph schema; let, literal and projection coverage here comes from those controls. They are structurally validated examples, not additional kernel-checked proofs. A depth-512 control retains explicit unopened child regions. Altered owners, queries, roots and paths are refused; unresolved locals/metavariables and source-only inputs remain unavailable.

## Reproduction

From the repository root:

```sh
node research/proof-atlas/type-field-navigation/check-model.cjs /tmp/type-fields-model.json
# With the actual production site served locally; Playwright and axe-core are required:
ATLAS_ORIGIN=http://127.0.0.1:8866 node research/proof-atlas/type-field-navigation/check-browser.cjs /tmp/type-fields-browser
```

`ATLAS_CHROMIUM_PATH` can select an installed Chromium. The browser checker follows actual field, parent, root and binder controls in the network and individual readers, verifies preserved library source routes, checks stale controls and optional-component failure, and audits phone/desktop layouts in both themes. Reports identify the exact tested source hashes. Earlier type-bridge and mismatch reports remain historical evidence for their earlier versions.

This remains a local prototype, with no measured human-inspection benefit or semantic-compression result. The general geometric-language program remains active. The blog is unchanged.

## Current local checks

The actual Jekyll production build and six browser suites passed without source overrides: field/binder navigation, the earlier mismatch witness, type bridges, all application windows, paged network navigation and current-call boundary inspection. The existing application suite covers 207 manual argument windows and 115 library calls.

The new browser checker exercised 24 field selections, five binder portals and three component-root returns. Twelve library checks preserved the source selection during computed navigation; an explicit original-context portal then opened the exact source binder. Eight phone/desktop and light/dark accessibility audits passed. Eight invalid presentations were refused, four controls from replaced cuts were ignored, including component changes within one input, and missing optional components preserved the earlier type controls in both readers. The source-only packet retained no computed type view. The model checker also refused use of all 42 disposed providers.

- [Model and lexical-target report](model-check.json.gz).
- [Production browser report](browser-check.json.gz).
- [Compatibility reports and tested file hashes](compatibility.json.gz).
- [Evidence and build environment](evidence.json.gz).

The production build uses the same local Ruby compatibility environment documented for the preceding type-difference iteration. Its exact dependency and shim hashes are retained in the evidence. No repository dependencies changed. Compatibility reports retain their complete contents in gzip form, with decoded and compressed hashes in the manifest. Static reports, checker sources and this reproduction text are copied after the production build; served bytes are checked afterward. A passing local build does not establish deployment or a hosted CI result.
