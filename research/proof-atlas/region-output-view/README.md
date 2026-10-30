# Recorded outputs at a common source prefix

The existing [paged application reader](/projects/proof-atlas/manual/paged-network/) can inspect selected result closures without changing its source-use graph. Choose **Inspect shared-prefix outputs**, then a recorded collection. A selected result shows its inferred type in the original context and its closed type at the exact common binder prefix. Ordered constructor fields and lexical links use the existing four-vertex type neighborhood.

There are three UI collections in two original profiles: Riccati calls `25,26,27,75,76,77,78`; the distinct-branch diagnostic `37,44,75`; and AI-source calls `0…7` of `lean_workbook_plus_6206`. These comprise 18 positions and 17 distinct original occurrences. The AI calls form disconnected source-use components; selecting their outputs does not make a connected region or add graph edges. Own synthetic controls in the underlying native experiment are not added to the UI inventory.

## Rule and provenance

For original result `t : T` in `Γ, Δ`, retain the exact common prefix `Γ`. A lambda frame in `Δ` closes the result with a lambda and the type with a Pi. A local let frame retains its original type, value, name and nondependency flag. Ordered closed results form the recorded nested `PProd` tuple. Its projection followed by the original lambda arguments recovers each original result; lets remain definitions. The [native experiment and generic closure laws](../region-result-closures/README.md) state the typing/recovery checks and their assumptions. This is an output construction, not a theorem that boundary inputs form an independent common-context function.

Data are derived byte-for-byte from the native record at commit `e22691381fa67123d67c33a19ff172c1ed6dce8c`. The generator pins this owner. Each collection and selected type has a content hash. Exact original occurrence routes identify the results and every binder; equal depth or printed names never establish a shared context. The reader authenticates paged source paths, compares every closure-wrapper domain and let value with its exact source header, then compares the residual type with the original inferred type. Kernel typing is inherited from the recorded native check, not rerun in JavaScript. The checking environment's dependency hashes were recovered; original environment identity and independent Mathlib rebuilding remain unverified.

Source expressions and `common-prefix-output-types` retain separate addresses. Computed field navigation keeps the current original-source selection. Explicit source portals identify the original result, context binder or closure header. A different cut has no inferred fallback: its output collection is unavailable. Source-only profiles retain ordinary graph navigation without invented output types.

## Bounds

At most eight original calls are selected. Only one output's two type graphs are resident: at most 2,048 stored nodes each, with at most four vertices drawn. Collection metadata is bounded to 256 KiB decoded, each selected type file to 1 MiB, context metadata to 1 MiB, paths to 512 fields and aggregate source-header comparison to 262,144 node pairs. Source comparison has its own bounded memo/frontier; source pages and context extraction retain their existing independent limits. These component bounds do not assert a browser heap bound. Selecting another output retires its previous receipt; disposing aborts pending work and drops graphs and contexts.

## Reproduce

- `node research/proof-atlas/region-output-view/build-data.cjs`
- `node research/proof-atlas/region-output-view/check-model.cjs`
- Build the production Jekyll site, then run `ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/region-output-view/check-browser.cjs <output-directory>` with Playwright and axe-core available.

[Model report](model-check.json.gz) covers all 18 outputs, 13,312 distinct-node field cuts, 37 source-wrapper header links and refusal/lifecycle cases. [Browser report](browser-check.json.gz) checks all 18 outputs in 36 type views, explicit source portals, folded-region preservation, four stale-control cases, corruption retry and four theme/viewport accessibility audits with no violations. The existing network suites retain 787 model input selections and 162 browser call selections; source-context navigation also passes. [Combined current-file and built-asset evidence](evidence.json.gz) binds these reports and 21 compiled data assets. Run `node research/proof-atlas/region-output-view/evidence.cjs` after collecting those reports to verify their hashes. These are finite representation and delivery checks; broader proof coverage, independent environment reproduction and measured human comprehension remain open. The blog and public deployment are unchanged.
