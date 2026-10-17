# Construction judgments from a public compiled packet

The internal lambda at node 30853 of `lean_workbook_plus_6206`, route
`1:1.1.1.1.1.1.1.1.1`, previously had a checked type but no introduction
record. The composed reader therefore stopped at a typed source boundary.
Its type is `¬a = 0 → a = 1 / 2`.

## Predetermined inventory and native method

`prepare.cjs` takes the union of the previous 17 primary occurrence queries and
the 14 proof-role roots in the frozen context inventory. This gives 19 distinct
queries, two additional primary locations. It does not search for successful
queries after running Lean.

`PacketTyping.lean` decodes the public packet with the existing bounded decoder,
compares all six reserialized structural fields, checks the theorem type and
proof, and invokes the existing occurrence extractor in each exact lexical
context. The original theorem and proof module must be absent. Only the pinned
compiled Mathlib/Aesop dependencies are imported. The baseline separately checks
the transitive axioms and rejects a wrong proof and an ill-typed binder. An
invalid occurrence route must fail with the expected route error.

The 19 queries include ten checked lambda introductions and five checked
application traces; one application also records recursor elimination. Three
local definitions and the theorem's type root have no construction rule in this
package. Earlier separate let records remain in use.

At node 30853 the introduction checks domain sort, binder conversion, body
conversion and function conversion. The domain uses the seven-entry enclosing
context; the body uses that context extended by the new assumption. The body
premise has a recorded type, not a fabricated application trace.

## Provenance and delivery

The common occurrence schema is retained, with a distinct
`public-packet-occurrence-replay/1` recording environment.
`sourceModuleHashVerified` is false; `publicPacketHashVerified` is true. This
record does not pretend to recompile or import the original proof module.
Native output, query inventory, baseline, tooling and runtime have separate
digests. Original proof scripts and raw logs are not published.

The shared type table contains 383 nodes. The compiled supplement contains
87,120 decoded bytes. Both readers use the same judgments. The paged reader
retains this small supplement under separate explicit limits of 32 queries and
256 KiB; it does not count it as part of the evictable native-query cache or
claim a total-browser memory bound. Source fields continue to use the 4,096-node
source cache. Missing or invalid supplemental data retain the earlier source
graph and native evidence. Rule/type provenance identifies the replay method.

## Independent checks

`scripts/test-proof-atlas-packet-types.cjs` independently fingerprints type
expressions, compares all 17 previous primary judgments and 62 previous exact
observations, compares 57 full/paged construction scenes and rejects 23 altered
records or limit controls. The browser test exercises domain/body controls,
source-selection stability, unsupported body constructions, failure/retry,
stale loads and four accessibility configurations.

```sh
python3 research/proof-atlas/packet-typing/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --dependency-reference /absolute/path/to/pinned-compiled-dependency-reference \
  --workdir /absolute/path/to/new-private-workdir
node research/proof-atlas/packet-typing/publish.cjs /absolute/path/to/new-private-workdir
node scripts/test-proof-atlas-packet-types.cjs
node scripts/test-proof-atlas-packet-types-browser.cjs
```

The native driver enforces the existing 120-second, 8-GiB RSS, 64-MiB per-file
output and 30-GiB free-space bounds. It builds neither Mathlib nor the original
proof project. Resource records remain outside the research blog.

This closes one observed construction gap and reproduces a finite inventory.
It does not establish complete construction coverage of this proof, general
typing preservation, semantic compression or improved human comprehension.
