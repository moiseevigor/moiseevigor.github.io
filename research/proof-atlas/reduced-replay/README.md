# Reduced contexts replayed from public packets

The complete frozen context inventory for `lean_workbook_plus_6206` has 149 selected source routes. Every route now has a reduced term/type closure checked directly from the public compiled packet. The native process imports the pinned compiled Mathlib/Aesop dependencies; the original theorem and proof module are absent. No original proof script or project build is required.

This inventory evaluates the ordered context-projection rule. The existing reader still uses its separately published three-route package. The broader evidence below is a distinct format with an explicit public-packet environment; it must not be presented as an imported-original-module attestation or silently passed to that reader loader.

## Checks

The runner first reconstructs and reserializes the complete public theorem packet. Constructor kinds, payloads, ordered children, counts, scope maxima and roots must match exactly. The kernel checks the expected type as a proposition, the proof and its conversion to that expected type. Baseline axiom dependencies match the recorded inventory; `sorryAx` is rejected. Compiled dependency binaries remain trusted under the pinned revisions and lock digest.

For each of the 149 predetermined routes, the checker rebuilds its lexical context. Binder domains and let values use their pre-binder scopes. It infers the original expression's type, closes both expression and expected type with the retained assumptions and let definitions, and checks the complete closed roots. It then checks application of the closure at the selected original context and conversion back to the original term. Raw type graphs, roles, source-header recipes and context depths match the earlier native extraction exactly.

There are 109 additional controls. Each removes a directly mentioned term/type seed from that route's retained set. Rejection must report the specific remaining-free-support error; unrelated exceptions, unavailable records and resource termination do not count as successful rejection. All positive observations must succeed. The native process runs under the existing fixed limits and verifies input and producer hashes before and after execution.

An independent offline reconstruction rebuilds every selected reduced term and expected type from the public source, with a 131,072-node bound. It compares every constructor/payload/ordered-child structure with the native canonical modules, then checks all recorded instantiations. These references are fully resident and separate from browser paging. The reader's existing 32,768-node materialized-module limit is unchanged.

## Finite results

| Role | Selected routes | Proper context reductions | Checked alternate instantiations |
| --- | ---: | ---: | ---: |
| Proof | 14 | 2 | 0 |
| Type | 38 | 30 | 13 |
| Value | 97 | 61 | 49 |
| Total | 149 | 93 | 62 |

The selected closures form 87 native canonical modules and 62 further checked instantiations. Equality retains expression syntax, expected types, argument/let boundaries and binder names. The three previously published native reduced roots independently agree with the new results. The largest offline reconstructed module stores 91,425 nodes. The complete proof body represents 31,752,787 expanded occurrences; no occurrence tree is materialized by this protocol.

The 93 reductions count context closures, including types and values. They are not 93 smaller proofs, a reduction of the whole theorem, logically minimal hypotheses or measured semantic compression. The 62 instantiations are type/value observations within one declaration, with no alternate proof-role observation. This is the complete **frozen 149-route inventory**, not every occurrence or context class in the proof, all twenty AI-source theorems, or all Lean syntax. Generation attribution remains the dataset publisher's.

## Public evidence and boundaries

`reduced-replay-manifest.js` identifies the immutable `ProofAtlasReducedReplayEvidence/1` package. It contains source routes, compact closure recipes, raw recorded types, canonical-root fingerprints, native-check flags, baseline assumptions and producer/independent-checker hashes. It excludes original scripts, private paths, logs and materialized closed graphs. The earlier compiled-module digest belongs to the input context evidence; this replay does not load or reverify that original module.

The public audit independently reconstructs all 149 closures, checks fingerprints and boundaries, reproduces the query inventory and rejects altered provenance/typing claims. Archived flags and fingerprints are not a portable kernel certificate. Fresh replay is a separate native command. These records provide no inferred typing for arbitrary diagram descendants, no certified article equivalence and no comprehension measurement. The reader's three-route coverage remains explicit until a loader for this environment is validated.

## Reproduction

Use an existing Lean 4.33.1 dependency reference with `lake-manifest.json` and `lean-env-path.txt`, as described in the [complete packet replay method](../compiled-replay/README.md). The runner currently uses macOS sandboxing. Only compiled dependencies, the toolchain and the new workdir are readable by its child process. It builds no Mathlib or private proof project.

```sh
python3 research/proof-atlas/reduced-replay/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --dependency-reference /path/to/dependency-reference \
  --workdir /path/to/new-private-workdir
node research/proof-atlas/reduced-replay/check.cjs /path/to/new-private-workdir
python3 research/proof-atlas/reduced-replay/publish.py \
  --verification /path/to/new-private-workdir/verification.json
node scripts/test-proof-atlas-reduced-replay.cjs
```

The publisher's default compares the regenerated compact package with the frozen generation. `--publish` deliberately creates a new immutable generation. Raw native output and resource records remain private. The public artifact audit needs only Node and the checked-out public data; it does not run a kernel.
