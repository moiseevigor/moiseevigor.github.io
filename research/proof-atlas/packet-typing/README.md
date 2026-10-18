# Construction judgments from public compiled packets

The initial 19-query inventory recovered an internal lambda introduction in
`lean_workbook_plus_6206`. A recorded proof-premise frontier extends that
inventory to 27 exact queries, using the same construction notation and reader.
The original theorem and proof module are absent from native replay.

## Frozen seed and one-layer extension

The seed is the union of 17 earlier primary queries and 14 proof-role context
roots: 19 distinct locations. `proof-premise-seed.json` fixes its immutable
compiled evidence and the earlier application, elimination and let providers.
It does not use the current output manifest as its own seed.

`frontier.cjs` inspects each seed's recorded construction premises. It follows
native proof roles, excludes terminal declaration/context references, and keeps
nonterminal premises without a checked construction. Unknown types or source
field layouts do not supply proof roles. Candidates are keyed by exact routes,
not shared node identifiers; an exceeded bound withholds the frontier rather
than dropping candidates.

The frozen seed has 31 proof-premise appearances: six terminal references,
sixteen with recorded constructions, and nine missing appearances at eight
distinct routes. Three missing routes share node 166 but have different lexical
contexts. All eight requests pass native checks: two introductions and six
applications. The enriched inventory has twelve introductions, eleven
applications and three elimination records within those applications. Three
local definitions retain their separate earlier construction records; the
statement type root has no construction rule in this package.

At node 30853, the original introduction separates the seven-entry domain
context from the eight-entry body context. Its body at node 30852 now has its own
checked application record. This record comes from a new native query, not an
inference from its previously recorded type.

## Native checks and provenance

`PacketTyping.lean` decodes the public packet, compares all six reserialized
structural fields, checks the theorem type and proof, and invokes the existing
occurrence extractor in each exact lexical context. Only the pinned compiled
Mathlib/Aesop dependencies are imported. The baseline verifies transitive axioms
and rejects a wrong proof and an ill-typed binder. An invalid occurrence route
must fail with the expected route error.

The common occurrence schema retains a distinct
`public-packet-occurrence-replay/1` environment. `sourceModuleHashVerified` is
false; `publicPacketHashVerified` is true. Native output, inventory, baseline,
tooling and runtime have separate digests. Original proof scripts and raw logs
are not published. Two fresh native runs reproduce the 27 judgments and frozen
inventory identically; all nineteen seed judgments remain structurally equal.

## Delivery and remaining coverage

The current compiled supplement has 591 shared type nodes and 176,544 decoded
bytes. Both readers use the same records. Its separate limits remain 32 queries
and 256 KiB; source fields retain the 4,096-node paged cache. Missing or invalid
supplemental data preserve earlier evidence and the source graph. These are
component residency limits, not a total-browser memory bound.

The next proof-premise layer contains nine unrecorded routes. Adding them would
require 36 total queries, exceeding this small supplement's query limit. Further
expansion therefore needs bounded query paging. Those nine constructions remain
explicitly unrecorded. No complete proof coverage is claimed.

The same candidate policy enumerates bounded frontiers for 34 frozen earlier
native query inventories: five project-development proofs, twenty AI-attributed proofs
and nine recursion controls. It identifies 112 candidate routes in total, at
most 31 per inventory. This is candidate enumeration using existing native
premise roles; it supplies no new kernel checks for those other candidates.

## Independent checks and reproduction

The frontier audit independently enumerates premises from native application,
lambda and let fields, compares the eight route-qualified candidates, checks the
three uses of shared node 166, rejects limits/duplicate seeds, and preserves all
nineteen seed judgments. The common artifact audit preserves the original 17
primary judgments and 62 exact observations, compares 81 full/paged scenes and
rejects 23 modified records or limit controls. Browser checks distinguish newly
recorded constructions from the still-unrecorded next layer in both readers.

```sh
python3 research/proof-atlas/packet-typing/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --dependency-reference /absolute/path/to/pinned-compiled-dependency-reference \
  --workdir /absolute/path/to/new-private-workdir --proof-frontier
node research/proof-atlas/packet-typing/publish.cjs /absolute/path/to/new-private-workdir
node scripts/test-proof-atlas-packet-types.cjs
node scripts/test-proof-atlas-proof-frontier.cjs
node scripts/audit-proof-atlas-proof-frontiers.cjs
node scripts/test-proof-atlas-packet-types-browser.cjs
node scripts/test-proof-atlas-proof-frontier-browser.cjs
```

Use the recorded producer revision to reproduce metadata byte-for-byte. Omitting
`--proof-frontier` replays the historical 19-query seed. Native runs retain the
120-second, 8-GiB RSS, 64-MiB per-file output and 30-GiB free-space bounds. Neither
Mathlib nor the original proof project is built. Resource records stay outside
the research blog.

These results establish finite construction recovery and source correspondence.
They do not prove general typing preservation, semantic compression or improved
human comprehension.
