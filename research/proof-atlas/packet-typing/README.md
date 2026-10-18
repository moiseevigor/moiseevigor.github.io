# Construction judgments from public compiled packets

The initial 19-query inventory recovered an internal lambda introduction in
`lean_workbook_plus_6206`. A recorded proof-premise frontier extends that
inventory first to 27, then to 36 exact queries, using the same construction
notation and reader. Replay queries can use the existing bounded native-page
transport rather than expanding the resident supplement limit.
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
are not published. Two fresh native runs at each stage reproduce the native observations and frozen
inventory identically. The 36-query stage preserves all 27 previous judgments,
including the historical nineteen-query seed. The native observation digest is
`21e49ecc9925f23d9e5bbbc413ec417f0cd75f9a269aeb3bcf356ca9dd911573`; the published
shared evidence digest is
`3dfcb01eff8e75b76efe89725b2cbeef6bc1903e8e4f399028b218657dc7c5b3`.

## Second layer and bounded delivery

`proof-premise-second-layer.json` fixes the earlier 27-query evidence as its seed.
The independently enumerated layer has 48 premise appearances: fourteen terminal,
twenty-five recorded and nine missing. All nine new routes pass native checks:
four introductions and five applications. The resulting 36-query package has
sixteen introductions and sixteen applications; earlier local definitions and
the statement boundary remain distinct. Fourteen further proof-premise roots
remain unrecorded. This procedure has not completed the proof's constructions.

The compiled package has 777 shared type nodes and 248,307 decoded bytes. The
complete reader retains the full package. The paged reader uses a separate
`NativeQueryPages/1` manifest, bound to that package's digest and source identity.
Each query, lookup index and shared type table has a content digest. Decoding a
query reconstructs the same contextual judgment and original evidence reference
as the complete reader; a query page is transport, not a new native judgment.

Replay queries share the existing native LRU: at most 128 resident query records
and 16 MiB of decoded query bytes, with at most sixteen lookup pages. Each
provider's shared type table is loaded fully under its separate 65,536-node and
16-MiB limits. The manifest allows at most 512 indexed queries per provider.
Source fields retain their separate 4,096-node cache. These component bounds do
not imply a total-browser memory bound. A working set that cannot fit is rejected.

Without a query-page descriptor, the historical resident supplement retains its
32-query/256-KiB cap. With a query-page descriptor, neither the complete source
packet nor the complete replay archive is requested. Invalid optional replay
metadata, indexes or queries disable only that optional evidence and retain the
earlier native/source views; they do not silently download a complete archive.
Cancellation and disposal cannot restore a stale selection. Missing construction
records remain explicit source or typed boundaries in both readers.

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
primary judgments and 62 exact observations, compares 108 full/paged scenes and
rejects 23 modified records or limit controls. Browser checks distinguish newly
recorded constructions from all fourteen still-unrecorded next-layer roots in
both readers. The transport audit compares 194 exact observations and all 108
composed cuts, then repeats all 36 queries with a one-query cache to force
eviction. Sixteen altered-data and disposal controls retain earlier evidence.
Browser checks verify lazy query loads, exact source routes, optional-load
failure/retry, stale-load cancellation and four accessibility cases.

```sh
python3 research/proof-atlas/packet-typing/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --dependency-reference /absolute/path/to/pinned-compiled-dependency-reference \
  --workdir /absolute/path/to/new-private-workdir \
  --frontier-seed research/proof-atlas/packet-typing/proof-premise-second-layer.json
node research/proof-atlas/packet-typing/publish.cjs /absolute/path/to/new-private-workdir
node scripts/build-proof-atlas-native-pages.cjs --packet-only
node scripts/test-proof-atlas-replay-query-pages.cjs
node scripts/test-proof-atlas-replay-query-controls.cjs
node scripts/test-proof-atlas-packet-types.cjs
node scripts/test-proof-atlas-proof-frontier.cjs
node scripts/audit-proof-atlas-proof-frontiers.cjs
node scripts/test-proof-atlas-packet-types-browser.cjs
node scripts/test-proof-atlas-proof-frontier-browser.cjs
```

Use the recorded producer revision to reproduce metadata byte-for-byte. Omitting
both frontier options replays the historical 19-query seed. `--proof-frontier`
reproduces the first 27-query stage. Native runs retain the
120-second, 8-GiB RSS, 64-MiB per-file output and 30-GiB free-space bounds. Neither
Mathlib nor the original proof project is built. Resource records stay outside
the research blog.

These results establish finite construction recovery and source correspondence.
They do not prove general typing preservation, semantic compression or improved
human comprehension.
