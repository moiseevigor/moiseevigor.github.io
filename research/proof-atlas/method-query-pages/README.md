# One-call delivery of checked method geometry

Status: local research iteration. No deployment or blog post.

## Problem and rule

The [bounded source reader](../method-pages/README.md), frozen at `4401069d3`,
still loaded the whole native method record and retained source rows for all
its calls. A proof with many recorded calls needs a separate delivery rule for
those observations, as well as for source expressions.

The new reader authenticates a provenance header and the complete call
inventory, then fetches **one original call**. Provenance validation, inventory
validation and per-call source/type/eta validation are separate operations.
The whole-record API continues to check every call. The per-call API checks
only the fetched call and labels the others **unvisited**. An unavailable native
observation and an unrecorded route remain different states.

The page is an unchanged entry from the original native JSON. Its parent type
graph, computed graphs, graph indices, source routes and method ordinals are
preserved. Source and computed addresses keep the **original native record
hash** as their evidence owner. The page hash identifies delivery; it does not
become a new native derivation owner.

## Exactness and trust boundary

The offline producer checks the existing complete native record against its
compiled packet, splits it, and reassembles the header and ordered entries.
Reassembled bytes must equal the original native bytes. Entry hashes are also
checked separately. No native query inventory is rewritten and no original
record is replaced by a fabricated one-entry record.

The browser authenticates the derived manifest, header and selected page. It
uses the same provenance and per-call validation functions as the complete
reader, and compares the selected method with its current paged source/type
observations. It does not load or validate unvisited calls. The relation between
the derived manifest and the old whole-record hash is a **producer attestation**
verified on the offline side; the client does not cryptographically reconstruct
the old hash without fetching the other entries. This is not a portable kernel
certificate. No new Lean extraction or kernel replay is performed here.

## Finite result

The producer preserves **21 calls and 34 method interfaces in nine profiles**:
the original Riccati profile, five authored native controls and three
publisher-attributed AI-source profiles. Direct per-call models reproduce all
34 complete-record scenes.

Live source paging covers the four existing source-paged profiles: **16 calls,
26 method frames and 32 inputs**. Each selected frame retains its old source and
computed addresses. Complete source and complete native method archives are
forbidden in the client test. Other call pages are checked to remain unfetched.

The Riccati native record contains 568,387 decoded bytes. Its seven call pages
range from 63,911 to 133,692 decoded bytes, plus a separate provenance header.
For `lean_workbook_plus_6206`, the 546,399-byte record is split into seven pages
of 64,080–106,062 bytes. These are decoded JSON sizes, not browser heap use.
Source closure also decreases for several selected calls; the first call can
still require most of a record's source closure. The observation adds delivery
scope, not semantic compression or additional recursor coverage.

## Bounds and interaction

The selected call has an 8 MiB decoded JSON limit; its header has a separate
1 MiB limit and its call manifest a 128 KiB limit. The complete native record
may be up to 64 MiB on the producer side. An oversized selected page is refused
before fetching it. Unvisited pages are not loaded. Large aggregate native
records beyond the current sample have not been measured.

The selected call's original source closure retains the existing limits of
4,096 rows, 4 MiB of serialized row JSON and a separate 256-row page cache.
Type/computed graphs for that call load fully. The main graph's native-query
cache has its own bounds. These are separate logical storage limits, not a
whole-application heap bound. A large single method can still exceed a limit.

In the [paged Riccati reader](/projects/proof-atlas/library/?loading=paged&edition=published-15&proof=JacobiData.slope_bound_abs&route=1:1.1.1.1.1.1.2.2.2.2.2.1),
choose **Show paged method interface**. The delivery details show the original
owner, selected page, entry hash and full inventory size. Case changes reuse
the selected call. Source/context jumps remain exact. Hiding the frame or
changing source selection releases it. A failed or late page cannot restore a
previous source selection or trigger a whole-record fallback.

## Checks and historical evidence

The [verification bundle](method-query-evidence.json) contains the producer,
per-call model, browser and compatibility results. Model checks include all
21 call models, all 34 method scenes, live source paging, unvisited/unavailable
states, source disposal, corrupt headers/pages, reordered queries and foreign
owners. The browser checks the existing live cases, source/context jumps,
failure/retry, cancellation and both themes at desktop/mobile widths.

Earlier native, public-replay and bounded-source checkpoints remain immutable.
`checkpoints.json` records their bundle/report hashes and original code
revisions; the recorded source fingerprints were verified against those Git
revisions before refactoring. Current compatibility records compare their
functional observations separately from implementation fingerprints. The
test-only control-page producer SHA changes when its test driver changes; that
fingerprint is reported separately from its unchanged source and geometry.
Earlier reports are not rewritten to look current.

```sh
node scripts/build-proof-atlas-method-query-pages.cjs --check
ATLAS_METHOD_QUERY_CHECK=1 node scripts/test-proof-atlas-method-query-pages.cjs
node scripts/test-proof-atlas-method-source-browser.cjs
node scripts/build-proof-atlas-method-query-evidence.cjs --check
```

Only existing compiled terms and derived observations are used. Private proof
scripts are not read or published. AI-source attribution remains the dataset
publisher's claim. The fixed AI inventory still has 25 unavailable candidates
across seven queried profiles; the three supported profiles' nine checked calls
all use `Or.rec`. No general elimination or comprehension result follows.
