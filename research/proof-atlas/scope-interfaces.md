# Source-scope interfaces

Collapsed source regions retain their free term-binder mentions. The interface includes mentions in type annotations and does not assert logical necessity. Constants, universe references and unresolved elaborator objects have separate meanings.

The stored summary is a bit set relative to the region's lexical boundary. For a variable, bit `i` denotes its de Bruijn index. Constructor children contribute a union; the body of a lambda, Pi or let removes bit zero and shifts other indices down by one. Domains, let types and let values do not introduce that binder. An unresolved free or metavariable propagates an unavailable interface. Width overflow also remains unavailable. A syntactically closed term-binder interface does not establish semantic independence.

Summaries share by immutable source DAG node. Resolving their targets requires the exact occurrence route: the same stored variable can denote different binders at different occurrences. Each target retains its original binder route. Displayed introduction/context frames additionally retain their member slot; out-of-cut targets remain explicit context boundaries. The diagram bundles targets by displayed frame, individual binder or external context, with exact member navigation. This is an additive layer: stripping it reproduces the original complete scene, including source partition, native observations and missing evidence.

The finite native-query inventory has 34 packets and 395,902 stored source nodes. Independent finite-set calculations agree with every transported summary. At 1,288 recorded routes, three priorities and three grouping modes give 11,592 checked cuts, containing 100,961 frontier-interface appearances and 181,702 binder-target appearances. These are sums over overlapping cuts, not proof-size or logical-dependency counts. Full-source references independently resolve each target and frame slot. The `SBracket.mk.inj` control has one 527-occurrence retained region mentioning 57 external term binders; four introduction frames bundle them as 16, 16, 16 and 9. This is a structural result, not a measured comprehension benefit.

The browser requests only selected summary pages. A content-addressed Merkle index and manifest bind them to the original validated source packet and derivation implementation. Cached summaries default to 4,096 entries, with four index pages and one transient 256-row page. Summary pages have a 64 KiB decoded bound; index pages have a 16 KiB bound. The source and native-query caches and resident shared type graphs have separate bounds. These counts do not measure total browser memory. Optional scope failure retains the base diagram and explicitly marks the scope evidence unavailable.

The current summary width is 512 term binders. Each scene is capped at 4,096 interfaces, 4,096 distinct targets and 16,384 target references. Exceeding a bound does not assert an empty interface. The inventory is finite; it does not establish complete contextual typing, all Lean syntax coverage, semantic proof compression or human understanding. The reader does not reconstruct original tactics.

Reproduction:

```
node scripts/build-proof-atlas-scope-pages.cjs --check
node scripts/test-proof-atlas-scope-controls.cjs
node scripts/test-proof-atlas-scope-interfaces.cjs
# After the production site build:
node scripts/test-proof-atlas-scope-browser.cjs
```

The independent audit writes its packet hashes, counts and observed cache state to `/tmp/atlas-scope-interfaces.json`. CI retains this and the failure controls as technical evidence. Browser checks cover keyboard navigation, exact source jumps, local refinement, stale responses, unavailable optional evidence and desktop/phone layouts in both themes. No new native Lean certificate is claimed: summaries are source-derived structure.

The separate [free-index support theory](context-projection/README.md#exact-free-index-support) proves the success criterion for a specified `Lean.Expr` projection and the relation between exact support and scope maxima. It justifies the empty-support shortcut for a correct scope field and gives a counterexample to replacing support by a positive maximum. Fresh compiled fixtures compare this summary producer with native sets at four widths. The theory does not prove this JavaScript producer or add typing to the source interfaces.
