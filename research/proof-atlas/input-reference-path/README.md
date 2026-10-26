# Original input-reference paths in folded constructions

A source-use wire records a precise consumer input and its producer. A dashed wire previously reduced its intervening lexical definitions to a hop count. The folded reader now exposes the original reference path without switching the currently read construction.

## Representation rule

Select a boundary input or an internal input-use position. The adjacent pane reads backwards from that exact input through its recorded local definitions to the original producer. Each definition retains three selectable occurrences: use, binder and value. A value belongs to the context before its definition. The producer and any final context binder remain separate endpoints. The graph retains the selected consumer and marks the known source call with a dashed outline; the textual path carries the same relation without depending on color.

The path pane temporarily replaces the region result list. **Show region results** restores that list; reading a result clears the old path. Opening a path returns the graph to its selected construction and focuses the path group. Selecting a source address within it leaves the construction and input slot unchanged, and uses the existing original-occurrence inspector. No second native observation window is opened when that input is already inspected.

The source-use relation runs from producer to consumer. The displayed reference traversal runs in the opposite direction, from the consumer input back through lexical references. It is not an evaluation trace, a type-conversion proof or a new common-context typing judgment. Function inputs, proof/type/value arguments and repeated positions retain their original slots. Unobserved roles remain unobserved.

## Identity and bounds

`ProofAtlasCallBoundary.referencePath` replays the immutable region model, checks that the selected position belongs exactly once to the internal/boundary partition, and preserves the original source packet, declaration, inventory, native owner and call route. Every source occurrence retains its qualified root and ordered slot route. Each hop preserves its de Bruijn index, binder position and nondependent flag. The recorded index and position must agree with the use-context length; the value starts at that binder position. The last value and context must equal the original producer endpoint.

The derived `input-reference-path` identity is separate from original expressions and computed types. At most four definitions are displayed per page, with a 4 MiB serialization bound. The underlying sixteen-hop resolution limit is unchanged. If resolution stops at a remaining local definition, it is labelled as a boundary; the reader does not invent an endpoint beyond it. Paging does not join nonadjacent definitions with an invented edge. Source-only paths expose structural references without acquiring native term or type observations.

This observer reads the existing retained cut. It requests no source or native archive and retains no additional computed graph. Existing cut and inspector limits remain separate. Four-row delivery is a component bound, not a measurement of the whole browser heap.

## Riccati example

Input `25:4` in the seven-call region is the inequality used by the selected `Eq.mp`. Its reference occurs in original context Γ13. The recorded local definition has index 2 and position 10; its value is in Γ10 and is original result 75, the AM–GM application. Selecting the definition, use or value changes the original occurrence inspector while call 25 remains the current construction. Its equality input `25:3`, from result 76, has no intervening local definition. These are distinct original input paths even where printed statements are equal or convertible.

## Checks and limitations

The [model checker](check-model.cjs) checks all **877 input positions from 42 native profiles** against both their original compiled packets and recorded native binding paths. One additional Riccati internal-region comparison brings the total to 878 native comparisons, including 39 hop appearances. Six positions in a selected cut of the 201,340-call source-only inventory are compared with their compiled source packet. This is not a claim of checking every source-only input.

Two authored structural controls contain twelve and twenty chained local definitions. They exercise three and four windows respectively; the latter stops at the existing sixteen-hop boundary. Shared stored variable nodes retain distinct occurrence routes. These controls have no new Lean typing or kernel-replay claim. Twenty-four negative controls cover invalid pages, altered metadata and identities, and independently rebuilt region models with inconsistent lexical context indices or producer contexts. The largest observed page is 6,543 bytes.

The [browser checker](check-browser.cjs) checks 37 exact source selections across nine native and four source-only input inspections, shadowed binder identity, all seven authored-control pages, stale-path clearing, keyboard focus, graph position and the result-list round trip. Desktop and phone layouts in both themes have accessibility and document-overflow checks. The existing call-boundary, result-reading, region, proof-input, rule-head, inventory, streaming and result-path suites provide compatibility checks.

- [Model report](model-check.json.gz).
- [Production browser report](browser-check.json.gz).
- [Current compatibility reports](compatibility.json.gz).
- [Evidence identities](evidence.json.gz).

The guarantees are finite structural/reference checks. They do not establish minimal premises, a new typing theorem, improved comprehension or semantic compression. No private source scripts, native extraction logs or new blog result are published. The production build precedes final static report copies; current served assets are checked against the tested source. Earlier reports remain historical. This is a local prototype, not a public deployment.
