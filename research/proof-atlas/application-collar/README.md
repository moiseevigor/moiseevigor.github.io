# Application ports inside a declaration window

In the [existing paged proof reader](/projects/proof-atlas/manual/paged-network/#ns-lab), open **Inspect checked region functions → Read declarations together → Show value structure** on a result or derived definition. One value structure is open at a time. Its declared type stays visible above it.

## Rule

A literal curried application `(((f a₁) a₂) … aₙ)` becomes an ordered interface: function slot 0, argument slots 1 through n, and the selected declaration's value. The join folds the actual n `Expr.app` occurrences. Arrows denote this application construction, not implication or necessary proof premises. Function and argument ports open their exact computed expressions. No normalization or eta expansion is performed. Metadata, lambdas and other non-application constructors remain opaque endpoints; an atomic value has no application join.

A port whose root is `Expr.bvar` links to its exact preceding computed declaration or original-context binder. The value field is outside its own let binder. Composite ports do not receive invented reference-free or independent labels: their inner uses remain uninspected. Equal stored rows in different slots remain distinct occurrences.

For the source-specializing result calls, every computed port is additionally checked against the previously recorded original input correspondence. An original source-use position, an independent/derived boundary's source specialization and a computed binder use remain distinct relations. Derived definition values have no invented original application-port map. Supplied positions are retained without guessing proof/data/instance roles from names.

The full recorded cut consists of the n application occurrences, the head subtree and the n argument subtrees. Their expanded occurrence counts sum to the selected value's count. A page retains the folded application occurrences and the visible head/argument roots; all other occurrences remain collapsed. Shared storage never changes these occurrence multiplicities.

## Bounds and evidence

One value model retains at most 64 argument descriptors and 1 MiB of metadata, with incremental allocation guards. Each page draws the head, up to four arguments and one application join: at most six vertices. The existing provider retains its separate 64-row/two-index cache. Compound-port previews use the existing notation renderer and its authenticated literal signatures. They borrow one notation cursor at a time, dispose it before the next preview and retain only 96 characters per visible port. The separate notation cache remains bounded at 8192 rows / 4 MiB and each transient scene at 48 objects. No hidden argument subtree is previewed merely because it belongs to another page. Spine, path and metadata limits return an explicit unavailable state while the exact constructor inspector remains available. These are component bounds, not a total-browser heap measurement.

The model check covers all **116 value fields in the 30 frozen candidates**: 104 applications and 12 atomic values. It checks literal reassembly of 273 app occurrences, 389 endpoint ports, 339 original input correspondences and 273 direct lexical uses (228 computed, 45 original context). Seven repeated-row port pairs remain distinct. All 130 argument pages preserve occurrence accounting. Its 51 compound-port preview scenes agree with complete-graph notation in their actual value contexts. The largest retained model is 20,833 serialized bytes. The three policies overlap; their source inventory consists of two corpus regions and eight authored controls. This is not a representative massive-AI benchmark. Source/native data and judgments are unchanged; this is a structural representation result.

Refusal controls include mismatched source ports, wrong owners, missing values, unbound root variables, cancellation, retired readers, excessive spines, paths and metadata. The three work-limit controls are authored structural readers, not additional kernel-checked proofs. Browser checks use the actual production site and cover exact computed/original selections, all endpoint roles, paging, single-value lifecycle and responsive themes. No new kernel judgment, arbitrary-region completeness, semantic compression or improved human comprehension is established.

```sh
node research/proof-atlas/application-collar/check.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/application-collar/browser.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/application-collar/lifecycle.cjs
node research/proof-atlas/application-collar/verify.cjs --write
```

Model and browser reports are technical reproduction records. Logs and screenshots remain local. The earlier [declared-type window](../declaration-window/README.md) and its checks remain in use.
