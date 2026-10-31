# Paged components of checked source-frontier functions

The [paged source-use reader](/projects/proof-atlas/manual/paged-network/#ns-lab) has an optional **Inspect checked frontier functions** panel. It exposes the nineteen [native frontier functions](../corpus-frontier-functions/README.md) on the Riccati bound and one released AI-source proof. Their 222 components include function terms/types, source observations, original fragment types, closed fragments and parameter domains.

The reader uses the existing constructor glyphs, ordered fields, exact occurrence counts and lexical binder portals. A computed address includes the native inventory, native case, paging manifest, named component and ordered route. It is never an original Lean occurrence address. Kernel judgments attach to the recorded whole function; inspecting its descendants adds no typing judgment.

## Scope rule

Three component owners remain distinct:

| Owner | Ambient bindings | Portal target |
|---|---|---|
| Closed component | None | A local binder within that component |
| Original fragment type | Exact original lambda/let frames | An original source occurrence |
| Parameter domain *i* | Earlier computed parameters, in supplied order | The corresponding outer lambda in `function.term` |

A shared stored bound-variable row can have different targets under these owners. The manifest records each component's scope. Opening it checks root scope requirements and the literal identity of parameter-domain roots with the corresponding function-lambda domains. Navigation verifies each ordered path and the selected constructor's count/scope recurrence. Let types and values retain their pre-binder scope; only the body introduces the new binding.

All 27 parameter domains in these two corpus examples are closed. They do not demonstrate dependency on earlier parameters. An explicitly authored, syntax-only control exercises a parameter reference in a let value and a local reference in its body; it contributes no native typing claim. Original-context/computed-local distinctions also have sixteen witnesses in the real native records.

## Delivery and interaction

The producer validates the complete native tables with their original component owners, then writes content-addressed 64-row pages and a 64-way index. Byte-identical pages are reused across cases; source identity and scope stay in each case's manifest. Native input is pinned at commit `a27d7643b`. The original native records are unchanged.

One cursor retains one row page (at most 64 rows), two index pages and bounded manifest metadata. It admits one active operation and one replaceable pending operation; rapid navigation does not accumulate obsolete traversals. One displayed cut retains the selected vertex and at most three child vertices. A path has at most 512 slots and keeps only binder node/path positions. Root, parent, field and binder navigation use pages; there is no full-table fallback. The table cap is 131,072 rows, the decoded page cap is 1 MiB, the index cap is 16 KiB and the manifest cap is 256 KiB. Decoding temporarily holds bounded compressed-stream chunks and a decoded buffer in addition to the cache. These are separate component bounds, not a total-browser memory theorem.

Source graph selections choose the recorded singleton frontier or mark an input of the selected multi-input frontier. An unrecorded call clears the previous computed fields. A multi-input selection can load its original calls into the graph, preserving disconnected source components. It supplies no new source-use edges and performs no automatic region fold. Original source portals open the exact compiled occurrence in the proof explorer. Computed field navigation preserves the graph's original selection. Changing profiles or releasing the cut retires pending computed requests and stale controls.

## Checks and limits

The complete paged row comparison covers 856,960 row appearances across nineteen cases. The independent model checks 887 finite occurrence cuts, sixteen shared-row binding witnesses, the 512-slot path boundary and 77 refusal cases. Its largest retained row cache is 64 rows. These counts do not measure readability or total browser memory.

- [Model record](model-check.json.gz): complete row comparison against all nineteen frozen native cases; independent finite component/path/binder cuts, original-source witnesses, transport refusals, cancellation, recovery and cache bounds.
- [Production browser record](browser-check.json.gz): actual built page, component selection, graph synchronization, source portals, unavailable states, stale controls, failure/retry, responsive/theme accessibility and keyboard checks.
- [Compatibility record](compatibility.json.gz): preceding output-regrouping and paged source-use checks, retained separately from their immutable earlier reports.
- [Aggregate fingerprints](evidence.json.gz): native parent, current implementation, reports, production bytes and content-addressed page inventory.

The offline audit retains complete reference graphs. The browser checks transport hashes and local syntax/binding. It does not rerun Lean or independently prove a page's membership in the native archive; the producer supplies that attachment. Native typing, literal reconstruction and declared-goal conversion remain the separate evidence in the preceding package.

This is delivery and navigation of a finite source-frontier rule. Arbitrary graph-region interfaces, minimal premises, strategy extraction and improved human comprehension remain unproved. The article and blog are unchanged. A feature-branch push is not a public deployment.

## Reproduction

```sh
node research/proof-atlas/corpus-frontier-functions/check.cjs
node research/proof-atlas/frontier-pages/pack.cjs --check
node research/proof-atlas/frontier-pages/check.cjs
# After the actual production Jekyll build:
node research/proof-atlas/frontier-pages/check-browser.cjs
node research/proof-atlas/frontier-pages/check-compatibility.cjs
node research/proof-atlas/frontier-pages/evidence.cjs --check
```

Browser checks require Playwright and axe-core. `ATLAS_ORIGIN` selects the production preview; `ATLAS_CHROMIUM_PATH` optionally selects its browser executable. Technical report assets may be copied into the built reproduction directory after checks; tested HTML, scripts and styles must be actual production-build outputs.
