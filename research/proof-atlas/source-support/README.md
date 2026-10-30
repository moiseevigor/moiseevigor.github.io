# Source expression and recorded type references

The same original binder can occur in the selected source expression, in its recorded type, in both, or in neither. This collar displays those two literal relations separately. It is a lossy interface summary with one witness per binder, not a replacement for the expression tree or a criterion for necessary premises. The exact selected root and all emitted occurrences retain their compiled source/type identities.

## Rule

The source adapter checks the selected occurrence and derives its ordered original context through source pages. It then applies the existing de Bruijn support scanner to all expression fields, including binder domains, let types and value annotations. Binders introduced inside the selected subtree are excluded from its outside interface. No definitions are unfolded. A complete scan is required before absence can be displayed.

For a native comparison, the recorded application provider supplies the source/type association from its checked port metadata:

| Recorded type component | Selected source expression |
| --- | --- |
| Original producer type | Original producer occurrence |
| Expected or recorded callable input type | Actual input use |
| Producer type lifted into the consumer context | Actual input use, explicitly labelled |
| Result or recorded callable result type | Original consumer application |

The lifted-type row does not invent a lifted source occurrence. It compares the actual input use with that separately recorded type component in the same context. Typing, weakening and conversion remain their existing independent observations. The comparison checks the full ordered list of qualified source binder addresses; equal depth or equal names are insufficient. The portable `compare` helper checks structural alignment and an explicit association. The recorded-provider constructor binds that association to the native query and port metadata.

Each visible row has three columns: a source witness, its original context binder, and a recorded type witness. Source witnesses use original source addresses; type witnesses keep their separate computed namespace and native owner. Missing per-expression types remain **unobserved**. Source-only views never classify a binder as absent from an unknown type.

## Riccati example

At input `25:4`, the selected source expression is the bound-variable use of the `amgm` local definition. Its literal expected type mentions `J` and `p`. The comparison therefore shows `amgm` as source-only and `J`, `p` as type-only. Selecting the original producer expression instead shows `J` and `p` in both layers. These are different original occurrences, not conflicting dependency estimates.

This generalizes the previous type-support counterexample: a binder absent from a literal statement can still occur in a proof input. Source-expression support itself includes annotations and is not transitive closure through definitions, semantic dependence or mathematical premise necessity.

## Navigation and bounds

In the existing [paged application reader](/projects/proof-atlas/manual/paged-network/#ns-lab), select a recorded type, show its literal support, then choose **Compare source expression**. Four original binders are displayed at a time. Both source and computed witnesses remain selectable without replacing the comparison root. A source-only selection has **Show source expression support**, using the same reference-column renderer with unknown type entries.

Some source witnesses lie outside the existing native input window. A separate source cursor replays their complete original routes and accepts only the emitted root, original context binders and support witnesses. This does not broaden the native type window or assign type evidence to those source descendants. Hiding a comparison or changing the input/proof disposes its cursor; an in-flight operation is cancelled. Each port reader permits one active or pending source comparison. Parent disposal closes that child.

The native type-table limit remains 65,536 nodes. Source scans use the source-page ID range up to 2,147,483,647 nodes without allocating an array of that size. Both scans retain at most 4,096 memo entries and 4,096 pending frames and stop after 262,144 processed states. The source cursor retains one 256-row page and two index records. Context derivation has its existing 4,096-row / 4 MiB budget and releases that row map before the expression scan. Source scenes are capped at 4 MiB and paired scenes at 8 MiB. These are component limits, not a measured browser-heap bound.

Only witness routes within the existing 512-field selection bound become clickable occurrences. Deeper witnesses stay explicitly unselectable. A work-bound, unresolved object, missing page or identity mismatch produces no source absence conclusion. A failed source comparison leaves the independently checked type-only view available.

## Finite evidence

- [Model checks](model-check.json.gz) compare all six type components at 877 native inputs in 42 profiles with complete checksum-verified source/native oracles: 5,262 comparisons. They check 10,047 source-witness appearances and 4,719 type-witness appearances. There are 3,577 both-layer, 6,470 source-only, 1,142 type-only and 42,825 neither-layer context positions. These positions repeat across components; they are not counts of unique mathematical premises.
- Fourteen selected source-only expressions retain their exact references without inferred per-expression types. The closed body of that packet also completes in 9,241 processed states with a 4,096-entry memo. Its outside context is empty; this does not mean the proof contains no internal binders or assumptions.
- [Large-packet checks](large-check.json.gz) independently verify selected occurrences with node IDs above 65,535 in packets containing 86,587, 91,424 and 121,568 stored expressions. The two attributed AI-source samples retain their publisher attribution; generation provenance is not independently verified. These are bounded occurrence checks, not complete analysis of those three proofs.
- [Window checks](window-check.json.gz) verify a source witness that the original native window correctly refuses, using the independent source cursor. Browser checks cover both witness namespaces, context categories, page retirement, source-only behavior, corruption, cancellation and missing components. Evidence and exact source hashes are kept separately from prior research records.

The blog is unchanged. Human inspection benefits and semantic compression remain unmeasured. General elimination notation and broader corpus/type coverage remain open.

## Reproduction

```sh
node research/proof-atlas/source-support/check-model.cjs
node research/proof-atlas/source-support/check-large.cjs
node research/proof-atlas/source-support/check-windows.cjs
# Build and serve the actual production site. Playwright/Chromium required.
ATLAS_ORIGIN=http://127.0.0.1:8866 node research/proof-atlas/source-support/check-browser.cjs /tmp/atlas-source-support-browser
node research/proof-atlas/source-support/verify.cjs --check
```

Only compiled term metadata, derived views and verification records are added. Original Lean/tactic scripts and private execution logs remain excluded. The program goal stays active. This iteration does not merge or deploy the research branch. Completed static evidence and figures are copied into the local preview after verification; application assets come from the actual production build.
