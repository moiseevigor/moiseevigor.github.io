# Inspecting checked region functions

The [paged source-use reader](/projects/proof-atlas/manual/paged-network/#ns-lab)
has an optional **Inspect checked region functions** panel. It exposes the
sixteen accepted [native region functions](../region-input-functions/README.md)
and the two recorded kernel rejections. These are the same finite native
artifacts, now delivered as scoped components. No new kernel evidence is
created by selecting a component or opening its fields.

## Scope rule

Each accepted case has ten named components:

| Components | Ambient context |
|---|---|
| Original function and inferred type | Exact original common prefix |
| Reduced function and type | Ordered retained subset of that prefix |
| Closed function and type | Empty |
| Source specialization and original result tuple | Original common prefix |
| Recovery equality witness and its type | Empty |

The domains of supplied inputs and the type/value fields of result lets are
selected *inside the original function*. Earlier computed binders therefore
remain lexical ancestors. An internal computed binder and an external
original binder have distinct portals. Context reduction may change a free
index while keeping its exact original binder target.

The hundred binding domains in this finite inventory have no free reference
to an earlier computed binding. They can depend on the original context.
Domain dependencies between computed inputs/results therefore remain an
uncovered case here, despite the presence of lexical ancestors. This count
is syntax support, not mathematical premise necessity.

An address identifies the original source packet, native inventory, native
case, delivery manifest, component and ordered occurrence route. It never
becomes an original source address. Binding/source cards separately retain
their compiled input or result occurrence. Selecting an original input
updates the existing source/native inspector; selecting computed fields
preserves the source-use cut. The two corpus sources also have standalone
proof-explorer links. Authored controls use exact inline source selection;
they are not registered as standalone library editions.

## Delivery and presentation

The producer validates the complete pinned native graphs, source context
paths, constructor recurrences and binding-domain/value identity. It writes
content-addressed 64-row pages with a 64-way index. A cursor retains one row
page and two index pages, with one active and one replaceable pending
operation. A cut displays the selected constructor and at most its three
fields. There is no complete-table fallback.

The table bound is 131,072 rows, path bound 512 slots, row-page decoded bound
1 MiB, index bound 16 KiB and manifest bound 256 KiB. The active/pending
operation limit prevents rapid clicks from accumulating obsolete traversals.
Decoding holds bounded compressed-stream chunks and a decoded buffer in
addition to retained caches. These are component bounds, not a total-browser
memory theorem. The offline audit retains complete native references.

Original function, reduced function, closed function and recovery witness
remain separate choices. The binding list is initially collapsed to keep the
selected four-vertex view visible. Loading recorded calls restores their
original graph connections; it does not invent edges or automatically fold
an arbitrary current cut. The displayed record names its exact call set.

Changing to a source call outside the recorded region clears the previous
computed component. Rejected input policies show their exact original failing
port and no accepted function fields. Missing records, transport failures,
cancelled requests and unsupported source packets remain explicit.

## Evidence and limits

- [Model audit](model-check.json.gz): complete row comparison against the
  sixteen native cases, independent finite scope/constructor cuts, exact
  binding portals, context reindexing, refusals and bounded lifecycle checks.
- [Production browser audit](browser-check.json.gz): actual build, component
  and binder selection, exact original-source synchronization, rejected and
  unavailable states, cancellation/retry, keyboard access and four responsive
  light/dark layouts.
- [Compatibility](compatibility.json.gz): current shared-neighborhood and
  source-use checks; earlier frozen reports remain unchanged.
- [Evidence manifest](evidence.json.gz): producer, implementation, native
  parent, reports, build and content-addressed data fingerprints.

The native parent is pinned at commit `39df58d95`. Browser transport hashes
and local recurrences do not independently prove attachment to the native
archive; the complete producer/audit supplies that correspondence. A browser
does not replay the Lean kernel. Original source contexts, computed lexical
binding and recorded whole-function typing are separate guarantees.

This view does not extend the accepted input policies, handle required suffix
lambdas, solve dependent boundary constraints, prove compiler refinement,
identify minimal premises, measure comprehension or complete the general
language goal. The article, blog and original private proof scripts are
unchanged. A research-branch push is separate from public deployment.

## Reproduction

```sh
node research/proof-atlas/region-function-pages/pack.cjs --check
node research/proof-atlas/region-function-pages/check.cjs
# After an actual production Jekyll build:
node research/proof-atlas/region-function-pages/check-browser.cjs
node research/proof-atlas/region-function-pages/check-compatibility.cjs
node research/proof-atlas/region-function-pages/evidence.cjs --check
```

Browser checks require Playwright and axe-core through `NODE_PATH`.
`ATLAS_ORIGIN` and `ATLAS_CHROMIUM_PATH` select the production preview and
browser. Completed technical reports may be copied into the build after
checking; application HTML, scripts, styles and source SVG come from the
actual production build.

Refreshing the evidence manifest uses `evidence.cjs --publish --collect DIR`,
where `DIR` is the temporary compatibility directory printed by
`check-compatibility.cjs`. This collects the four output-regrouping figures
only after checking their recorded image hashes; earlier packages remain
unchanged. Frozen reproduction uses `--check` and requires no temporary
directory.
