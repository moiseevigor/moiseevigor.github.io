# Region checks beyond the visible cut

A proposed source region is displayed only after checking its partition against the **complete pinned finite source-use inventory**. The reversible region codec still describes a local cut; a separate live graph check supplies this additional guarantee. Neither operation creates a Lean term or a composite typing judgment.

## Failure and rule

The earlier local rule can accept `{0, 13}` when a direct use connects these calls but an undisplayed path `0 → 1 → … → 12 → 13` leaves and re-enters the group. Contracting that group introduces a cycle. The new authored `longReturn` control has fourteen calls and exhibits this failure with twelve hidden calls. The reader refuses the fold and traces the thirteen original uses in pages of eight and five. Each trace button loads the actual consumer port through the original source/native inspector.

Individual region checks are also insufficient for a partition. In `crossedGroups`, uses are `0 → 2`, `0 → 3`, `1 → 2`, `1 → 3`, `2 → 4`, `3 → 4`. Groups `{0,3}` and `{1,2}` each contract safely in isolation. Together they produce a cycle. The checker evaluates the complete proposed partition, not each block separately.

For a selected cut of at most eight calls, scan the inventory in topological order. An unselected call carries an eight-bit mask of the first selected predecessors that reach it without crossing another selected call. A selected call records those incoming hidden-path relations and resets its mask to its own bit. Keep direct selected input uses separately, including repeated argument positions. For a proposed partition, discard direct uses internal to one block; retain every hidden-path relation, including a relation inside one block. Check the resulting selected quotient for cycles. All calls outside the selection remain separate.

Any cycle introduced by contracting selected calls in the original acyclic inventory must traverse a selected block. Splitting its intervening paths at selected calls gives a cycle in this first-hit quotient; conversely each quotient relation expands to an original path. This explains the implemented algorithm. It is not a formal Lean proof of the algorithm or a claim about omitted uses.

Local connectedness, port conservation and reversible expansion remain separate requirements of the existing region codec. A successful graph check cannot repair a disconnected region or a changed source record. A serialized report is reviewable evidence, but the reader accepts only a report produced by its current live scan for the same original inventory, source/native owner, canonical records and model identity. Loading another source, changing the cut or releasing it retires the displayed fold. Missing or incompatible checks leave separate applications available.

## Provenance and delivery

The compact index is derived from the original authenticated call and reverse pages. Every ordered input triple `(producer, slot, reverse ordinal)`, result degree and producer source/context signature is checked against those pages during derivation. Headers retain the original scope/header hash, compiled source identity and native owner. Call IDs are inventory positions; they do not become source expression routes. Trace inspection rechecks a compact edge against its actual original consumer port before selecting its exact compiled address.

Graph pages have at most 512 compact rows, 2 MiB decoded per leaf, 32 children per branch and 16 KiB decoded per branch. The runtime retains one leaf and two branch records. A query holds at most eight original call records (4 MiB). Its temporary typed-array scratch is bounded before allocation at 64 MiB:

    call-ID order:       10 V + ceil(E / 8) bytes
    topological order:   14 V + ceil(E / 8) bytes

Here V is inventoried calls and E is inventoried source uses. After scanning, only reach masks (2 V bytes) and, when needed, ranks (4 V bytes) remain for paged path reconstruction. Only one scan and one current witness cursor can be active. A different query releases the old audit; source release aborts pending fetches. Bounds describe component arrays and caches, not total browser heap or execution time.

The large source-only inventory has V = 201,340 and E = 201,190. It uses 2,038,549 temporary array bytes and retains 402,680 mask bytes. The scan visits every compact row; it does not request the complete original topology, source archive or native record. It remains source-only: graph reachability adds no per-call type observations. A graph beyond the scratch limit is refused rather than silently checked only locally.

## Checked scope

The two new authored controls pass fresh Lean 4.33.1 closed-root kernel checks and packet-only replay of **19 calls and 44 actual ports**. Their original modules are absent from the replay environment. Dependency cache hashes are checked; this does not independently rebuild Lean or Mathlib. The synthetic control source is public. Original private research proof scripts and raw execution logs are not published. Earlier source/native inventories remain unchanged.

The compact derivation covers 38 profiles: 37 with native call observations and one source-only profile. The independent checker compares **201,533 calls, 700,312 ports and 201,323 uses** against original call/reverse pages. It uses independent forward searches and full-graph contraction/topological sorting as an oracle: **42 queries, 1,029 partitions, 667 accepted and 362 cyclic refusals**, with 16 negative controls. The offline oracle may retain the full graph; its memory use is distinct from the runtime bound. The Riccati seven-call region remains valid across all 87 inventoried calls and 68 source uses; it still has 41 actual input positions, six internal uses and 35 boundary inputs.

- [Native verification](native-verification.json.gz) and [control derivation](controls-derivation.json.gz).
- [Compact derivation](graph-derivation.json.gz) and [independent model checks](model-check.json.gz).
- [Built-site browser checks](browser-check.json.gz), [six current compatibility reports](compatibility.json.gz) and [complete evidence manifest](evidence.json.gz). All seven browser suites pass; the new suite selects all thirteen hidden-path uses and their original native type owners, checks both themes and responsive widths, and refuses missing/corrupt indexes and stale scans. [Asset integrity](asset-check.json.gz) compares all 553 added gzip assets with the production build. Historical evidence bundles are not rewritten to claim current presentation hashes.

Acyclicity concerns the pinned finite source-use graph. Uses beyond that inventory, mathematical premise necessity, a closed typed interface, semantic compression and improved human comprehension remain unproved. This local research iteration does not add a blog entry or deploy the site.

Downloadable evidence uses gzip because the site excludes plain JSON. Each file expands to the corresponding JSON record in this repository. Application assets are the tested production build; only the completed static review reports and this README were copied into the local preview afterwards.
