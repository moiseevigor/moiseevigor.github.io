# Reduced contexts replayed from public packets

The complete frozen context inventory for `lean_workbook_plus_6206` has 149 selected source routes. Every route now has a reduced term/type closure checked directly from the public compiled packet. The native process imports the pinned compiled Mathlib/Aesop dependencies; the original theorem and proof module are absent. No original proof script or project build is required.

This inventory evaluates the ordered context-projection rule. A dedicated reader adapter now authenticates its public-packet environment and exposes the 149 recorded routes. The earlier three-route imported-module package remains a separate fallback when the optional replay manifest is absent. Neither environment is presented as the other.

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

The public audit independently reconstructs all 149 closures, checks fingerprints and boundaries, reproduces the query inventory and rejects altered provenance/typing claims. Archived flags and fingerprints are not a portable kernel certificate. Fresh replay is a separate native command. These records provide no inferred typing for arbitrary diagram descendants, no certified article equivalence and no comprehension measurement.

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

## Bounded reader adapter

The [reader](https://moiseevigor.github.io/projects/proof-atlas/library/?loading=paged&edition=goedel-sample-4331&proof=lean_workbook_plus_6206&route=1:1.1.1.1.1.1.1.2.0#expr-154) defaults to the original full-context observation. **Required syntactic context** loads the replay package only on request. Its adapter authenticates the source, earlier context-package identity, pinned dependencies, baseline proof checks, unchanged original observations, exact route inventory and reduced-module checks before preparing geometry. It shares the bounded projection renderer, not the older imported-module provenance envelope.

Every replay cut retains `public-packet-reduced-context/1`, the replay environment hash, native-output and query-inventory hashes and baseline-proof digest. The earlier compiled-module hash is labelled as an earlier input record, not reverified by replay. Canonical modules share their computed geometry; switching an original use retains its own source mapping. Native checks cover complete closed term/type roots. Computed descendants receive no additional typing judgment.

The independent paged-loader audit checks all 149 routes, 1,071 cuts, 124 canonical-use component comparisons and 3,598 inverse source locations against separately reconstructed references. It checks 199 variable links, including 138 appearances where the index changes but the original binder does not. The largest tested cut captures 56 source tuples and 71 virtual states. These are finite cut measurements; raw type metadata and the independent offline reference have separate residency. The existing 4,096-tuple source cache and projection limits remain in force.

```sh
node scripts/test-proof-atlas-replay-context-loading.cjs
node scripts/test-proof-atlas-replay-context-browser.cjs
```

The browser check prepares both root components at all 149 routes and exercises representative proof/type/value reductions, recorded type/value instantiations, source-preserving local navigation, both reader loading modes, optional-package/code failures and retry, and four phone/desktop and light/dark accessibility audits. The older three-route browser suite explicitly withholds the optional replay manifest to check that fallback separately. No blog claim or new native result is generated by this adapter.
